import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { requireStagingSupabase } from "./helpers/test-env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Live RLS OWNERSHIP test (hits the real database).
//
// Verifies row-level ownership checks — not just tenant isolation — for three
// surfaces that depend on `current_member_id()`:
//
//   • messages        — from_id must equal the caller; only sender/recipient read
//   • quote_requests  — buyer_id must equal the caller; only buyer/seller/admin read
//   • product-media    storage — object folder must equal the caller's member id
//
// It provisions one association with three member-linked users (M1, M2, M3),
// then exercises positive and negative paths through RLS-scoped clients exactly
// like every `requireSupabaseAuth` server function does.
//
// Cleans up everything it creates. Skipped when the service role key is absent.
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const canRun = Boolean(SUPABASE_URL && SERVICE_ROLE && ANON_KEY);

const rid = () => Math.random().toString(36).slice(2, 10);

type Member = {
  userId: string;
  memberId: string;
  email: string;
  password: string;
  client: SupabaseClient;
};

function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL!, ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

describe.skipIf(!canRun)("RLS ownership checks (live DB)", () => {
  let admin: SupabaseClient;
  let assocId: string;
  let slug: string;
  let M1: Member;
  let M2: Member;
  let M3: Member;
  let productId: string; // owned (sold) by M2
  const created = {
    user: [] as string[],
    member: [] as string[],
    product: [] as string[],
    storagePaths: [] as string[],
  };

  async function makeMember(label: string): Promise<Member> {
    const email = `own-${label}-${rid()}@test.invalid`;
    const password = `Pw-${rid()}-${rid()}`;
    const { data: u, error: uErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (uErr) throw uErr;
    created.user.push(u.user!.id);

    // Pin this association as the user's default membership (role: member).
    await admin.from("memberships").update({ is_default: false }).eq("user_id", u.user!.id);
    const { error: mErr } = await admin.from("memberships").insert({
      user_id: u.user!.id,
      association_id: assocId,
      role: "member",
      is_default: true,
    });
    if (mErr) throw mErr;

    // A member row LINKED to this auth user so current_member_id() resolves.
    const memberId = `m-${label}-${rid()}`;
    const { error: memErr } = await admin.from("members").insert({
      id: memberId,
      code: `${slug.toUpperCase()}-00000${label}`,
      name: `Member ${label}`,
      type: "individual",
      level: "memberLevel.medium",
      industry: "ind.trade",
      region: "region.north",
      status: "active",
      joined_at: "2024-01-01",
      fee_year: 2024,
      association_id: assocId,
      user_id: u.user!.id,
    });
    if (memErr) throw memErr;
    created.member.push(memberId);

    const client = anonClient();
    const { error: sErr } = await client.auth.signInWithPassword({ email, password });
    if (sErr) throw sErr;

    return { userId: u.user!.id, memberId, email, password, client };
  }

  beforeAll(async () => {
    requireStagingSupabase();
    admin = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    slug = `test-own-${rid()}`;
    const { data: assoc, error: aErr } = await admin
      .from("associations")
      .insert({ name: "Ownership Test", slug })
      .select("id")
      .single();
    if (aErr) throw aErr;
    assocId = assoc.id;

    M1 = await makeMember("1");
    M2 = await makeMember("2");
    M3 = await makeMember("3");

    // A product sold by M2 — used to validate quote_requests seller-read access.
    productId = `p-${rid()}`;
    const { error: pErr } = await admin.from("products").insert({
      id: productId,
      seller_id: M2.memberId,
      title: "Test Product",
      description: "desc",
      price: 1000,
      category: "general",
      status: "active",
      emoji: "📦",
      image_urls: [],
      association_id: assocId,
    });
    if (pErr) throw pErr;
    created.product.push(productId);
  }, 90_000);

  afterAll(async () => {
    if (!admin) return;
    await admin.storage
      .from("product-media")
      .remove(created.storagePaths)
      .catch(() => {});
    await admin.from("quote_requests").delete().eq("product_id", productId);
    await admin.from("messages").delete().in("from_id", created.member);
    await admin.from("products").delete().in("id", created.product);
    await admin.from("members").delete().in("id", created.member);
    await admin.from("memberships").delete().in("user_id", created.user);
    for (const id of created.user) await admin.auth.admin.deleteUser(id).catch(() => {});
    await admin.from("associations").delete().eq("id", assocId);
  }, 90_000);

  // ---------------------------- messages ----------------------------------

  it("member CAN send a message as themselves (from_id = self)", async () => {
    const { data, error } = await M1.client
      .from("messages")
      .insert({ from_id: M1.memberId, to_id: M2.memberId, text: "hi", association_id: assocId })
      .select("id, from_id")
      .single();
    expect(error).toBeNull();
    expect(data?.from_id).toBe(M1.memberId);
  });

  it("member CANNOT forge from_id to impersonate another member", async () => {
    const { data, error } = await M1.client
      .from("messages")
      .insert({ from_id: M2.memberId, to_id: M3.memberId, text: "spoof", association_id: assocId })
      .select("id");
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("recipient CAN read a message addressed to them", async () => {
    const { data, error } = await M2.client
      .from("messages")
      .select("text")
      .eq("from_id", M1.memberId)
      .eq("to_id", M2.memberId);
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  it("uninvolved member CANNOT read a private message", async () => {
    const { data, error } = await M3.client
      .from("messages")
      .select("id")
      .eq("from_id", M1.memberId)
      .eq("to_id", M2.memberId);
    expect(error).toBeNull(); // RLS filters rows, no hard error
    expect(data ?? []).toHaveLength(0);
  });

  // ------------------------- quote_requests -------------------------------

  it("buyer CAN create a quote request as themselves (buyer_id = self)", async () => {
    const id = `q-${rid()}`;
    const { data, error } = await M1.client
      .from("quote_requests")
      .insert({
        id,
        product_id: productId,
        buyer_id: M1.memberId,
        quantity: 2,
        message: "quote pls",
        contact: "x@y.z",
        status: "pending",
        association_id: assocId,
      })
      .select("id, buyer_id")
      .single();
    expect(error).toBeNull();
    expect(data?.buyer_id).toBe(M1.memberId);
  });

  it("member CANNOT forge buyer_id on a quote request", async () => {
    const { data, error } = await M1.client
      .from("quote_requests")
      .insert({
        id: `q-${rid()}`,
        product_id: productId,
        buyer_id: M2.memberId, // forged
        quantity: 1,
        message: "spoof",
        contact: "x@y.z",
        status: "pending",
        association_id: assocId,
      })
      .select("id");
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("seller CAN read quote requests on their product", async () => {
    const { data, error } = await M2.client
      .from("quote_requests")
      .select("id, buyer_id")
      .eq("product_id", productId);
    expect(error).toBeNull();
    expect((data ?? []).some((r) => r.buyer_id === M1.memberId)).toBe(true);
  });

  it("unrelated member CANNOT read another member's quote request", async () => {
    const { data, error } = await M3.client
      .from("quote_requests")
      .select("id")
      .eq("product_id", productId);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  // ----------------------- product-media storage --------------------------

  const bytes = new Uint8Array([1, 2, 3, 4]);

  it("member CAN upload media into their OWN folder", async () => {
    const path = `${M1.memberId}/${rid()}.bin`;
    created.storagePaths.push(path);
    const { error } = await M1.client.storage
      .from("product-media")
      .upload(path, bytes, { contentType: "application/octet-stream" });
    expect(error).toBeNull();
  });

  it("member CANNOT upload media into ANOTHER member's folder", async () => {
    const path = `${M2.memberId}/${rid()}.bin`;
    const { error } = await M1.client.storage
      .from("product-media")
      .upload(path, bytes, { contentType: "application/octet-stream" });
    expect(error).not.toBeNull();
  });

  it("member CANNOT delete media from ANOTHER member's folder", async () => {
    // Seed an object owned by M2 via the service role.
    const path = `${M2.memberId}/${rid()}.bin`;
    created.storagePaths.push(path);
    const { error: upErr } = await admin.storage
      .from("product-media")
      .upload(path, bytes, { contentType: "application/octet-stream" });
    expect(upErr).toBeNull();

    // M1 attempts to delete it — RLS denies, object must survive.
    await M1.client.storage.from("product-media").remove([path]);
    const { data: still } = await admin.storage
      .from("product-media")
      .list(M2.memberId, { search: path.split("/")[1] });
    expect((still ?? []).length).toBeGreaterThan(0);
  });
});
