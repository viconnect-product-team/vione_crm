import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { requireStagingSupabase } from "./helpers/test-env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// RLS contract for /m/renew.*
//   - members.members_select_assoc: user sees only rows where user_id = auth.uid()
//     (unless assoc-admin or platform-admin).
//   - invoices.invoices_select_assoc: user sees only invoices where
//     member_id = current_member_id() (their own member row).
//   - anon role has NO SELECT policy → every read must be blocked.
//
// This suite provisions two members in two associations, signs in as member A,
// and asserts:
//   1. A sees exactly A's member row and A's invoices.
//   2. A cannot see B's member row or B's invoices (empty result, not error).
//   3. Anon client sees zero rows for both tables.
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const canRun = Boolean(SUPABASE_URL && SERVICE_ROLE && ANON_KEY);
const rid = () => Math.random().toString(36).slice(2, 10);

type Ctx = {
  slug: string;
  assocId: string;
  userId: string;
  email: string;
  password: string;
  memberId: string;
  invoiceId: string;
};

async function seedMember(admin: SupabaseClient, label: string): Promise<Ctx> {
  const slug = `test-rls-renew-${label}-${rid()}`;
  const email = `rls-renew-${label}-${rid()}@test.invalid`;
  const password = `Pw-${rid()}-${rid()}`;
  const memberId = `m-${rid()}-${rid()}`;
  const invoiceId = `inv-${rid()}`;

  const { data: assoc, error: aErr } = await admin
    .from("associations")
    .insert({ name: `Test RLS Renew ${label}`, slug })
    .select("id")
    .single();
  if (aErr) throw aErr;
  const assocId = assoc.id as string;

  const { data: u, error: uErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (uErr) throw uErr;
  const userId = u.user!.id;

  await admin.from("memberships").update({ is_default: false }).eq("user_id", userId);
  await admin.from("memberships").insert({
    user_id: userId,
    association_id: assocId,
    role: "member",
    is_default: true,
  });

  await admin.from("members").insert({
    id: memberId,
    user_id: userId,
    code: `${slug.toUpperCase()}-${memberId.slice(-6)}`,
    name: `Hoi vien RLS ${label}`,
    type: "individual",
    level: "memberLevel.medium",
    industry: "ind.trade",
    region: "region.north",
    status: "active",
    joined_at: "2024-01-01",
    fee_year: 2025,
    fee_paid: false,
    term_end: "2025-06-30",
    association_id: assocId,
  });

  await admin.from("invoices").insert({
    id: invoiceId,
    member_id: memberId,
    invoice_no: `HD-${label}-${rid()}`,
    year: 2025,
    amount: 3_200_000,
    due_date: "2025-03-01",
    status: "pending",
    association_id: assocId,
  });

  return { slug, assocId, userId, email, password, memberId, invoiceId };
}

async function cleanup(admin: SupabaseClient, c: Ctx) {
  await admin.from("invoices").delete().eq("member_id", c.memberId);
  await admin.from("members").delete().eq("id", c.memberId);
  await admin.from("memberships").delete().eq("user_id", c.userId);
  await admin.auth.admin.deleteUser(c.userId).catch(() => {});
  await admin.from("associations").delete().eq("id", c.assocId);
}

describe.skipIf(!canRun)("/m/renew.* — RLS boundaries (live DB)", () => {
  let admin: SupabaseClient;
  let A: Ctx;
  let B: Ctx;

  beforeAll(async () => {
    requireStagingSupabase();
    admin = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    A = await seedMember(admin, "a");
    B = await seedMember(admin, "b");
  }, 60_000);

  afterAll(async () => {
    if (!admin) return;
    if (A) await cleanup(admin, A);
    if (B) await cleanup(admin, B);
  }, 60_000);

  it("member A sees only A's member row and A's invoices", async () => {
    const asA = createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: signErr } = await asA.auth.signInWithPassword({
      email: A.email,
      password: A.password,
    });
    expect(signErr).toBeNull();

    // Own member row visible.
    const mine = await asA.from("members").select("id, user_id, code");
    expect(mine.error).toBeNull();
    expect(mine.data?.length).toBe(1);
    expect(mine.data?.[0].id).toBe(A.memberId);
    expect(mine.data?.[0].user_id).toBe(A.userId);

    // Own invoices visible.
    const invMine = await asA.from("invoices").select("id, member_id");
    expect(invMine.error).toBeNull();
    expect(invMine.data?.length).toBe(1);
    expect(invMine.data?.[0].id).toBe(A.invoiceId);
    expect(invMine.data?.[0].member_id).toBe(A.memberId);

    // Explicit lookup of B's row returns empty (RLS filter, not error).
    const otherMember = await asA.from("members").select("id").eq("id", B.memberId);
    expect(otherMember.error).toBeNull();
    expect(otherMember.data?.length).toBe(0);

    const otherInv = await asA.from("invoices").select("id").eq("id", B.invoiceId);
    expect(otherInv.error).toBeNull();
    expect(otherInv.data?.length).toBe(0);

    // A cannot UPDATE B's invoice (RLS on UPDATE ⇒ 0 rows affected).
    const upd = await asA
      .from("invoices")
      .update({ status: "paid" })
      .eq("id", B.invoiceId)
      .select("id");
    expect(upd.data?.length ?? 0).toBe(0);
    // Confirm B's invoice still pending server-side.
    const check = await admin.from("invoices").select("status").eq("id", B.invoiceId).single();
    expect(check.data?.status).toBe("pending");

    await asA.auth.signOut();
  }, 30_000);

  it("anon (unauthenticated) is denied on members and invoices", async () => {
    const anon = createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const m = await anon.from("members").select("id").limit(5);
    // Either an error (permission denied / no policy) or empty rows — never data.
    expect((m.data ?? []).length).toBe(0);

    const i = await anon.from("invoices").select("id").limit(5);
    expect((i.data ?? []).length).toBe(0);

    // Targeted lookups also return no rows.
    const mById = await anon.from("members").select("id").eq("id", A.memberId);
    expect((mById.data ?? []).length).toBe(0);
    const iById = await anon.from("invoices").select("id").eq("id", A.invoiceId);
    expect((iById.data ?? []).length).toBe(0);
  }, 30_000);

  it("anon INSERT/UPDATE on invoices is blocked", async () => {
    const anon = createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const ins = await anon.from("invoices").insert({
      id: `inv-anon-${rid()}`,
      member_id: A.memberId,
      invoice_no: `HD-ANON-${rid()}`,
      year: 2025,
      amount: 1,
      due_date: "2025-01-01",
      status: "pending",
      association_id: A.assocId,
    });
    expect(ins.error).not.toBeNull();

    const upd = await anon
      .from("invoices")
      .update({ status: "paid" })
      .eq("id", A.invoiceId)
      .select("id");
    expect((upd.data ?? []).length).toBe(0);

    // Server-side truth: A's invoice remains pending.
    const check = await admin.from("invoices").select("status").eq("id", A.invoiceId).single();
    expect(check.data?.status).toBe("pending");
  }, 30_000);
});

// ---------------------------------------------------------------------------
// Static invariants — the RLS policies backing this contract must exist.
// Detected via schema queries lives in DB, but we also assert the server
// functions rely on the auth-middleware (RLS-scoped) client, not admin.
// ---------------------------------------------------------------------------
describe("/m/renew.* — server-fn uses RLS-scoped client (static)", () => {
  const source = readFileSync("src/lib/member-app/renewal.functions.ts", "utf8");

  it("getMyMembership + getRenewalQuote use requireSupabaseAuth", () => {
    // Both read paths must go through the RLS-scoped middleware.
    expect(source).toMatch(/getMyMembership[\s\S]*?requireSupabaseAuth/);
    expect(source).toMatch(/getRenewalQuote[\s\S]*?requireSupabaseAuth/);
  });

  it("read queries filter by session identity, not client-supplied ids", () => {
    // The membership read must scope by userId from the auth context.
    expect(source).toMatch(/\.eq\("user_id",\s*userId\)/);
    // No .eq("user_id", data.something) that would trust client input.
    expect(source).not.toMatch(/\.eq\("user_id",\s*data\./);
  });
});
