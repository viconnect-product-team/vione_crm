import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { requireStagingSupabase } from "./helpers/test-env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Live RLS isolation test (hits the real database).
//
// This provisions two ephemeral associations (A, B) and two ephemeral admin
// users (one per association), then verifies that the API surface — exercised
// through RLS-scoped clients, exactly like every `requireSupabaseAuth` server
// function does — enforces two guarantees:
//
//   1. Authentication: an anonymous client cannot read tenant data.
//   2. Cross-tenant isolation: admin of association B cannot read/write
//      association A's data, and vice versa.
//
// It cleans up everything it creates. Skipped automatically when the service
// role key is not available in the environment (e.g. plain CI without secrets).
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const canRun = Boolean(SUPABASE_URL && SERVICE_ROLE && ANON_KEY);

const rid = () => Math.random().toString(36).slice(2, 10);

type Tenant = {
  assocId: string;
  slug: string;
  userId: string;
  email: string;
  password: string;
  memberId: string;
  client: SupabaseClient;
};

function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL!, ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

describe.skipIf(!canRun)("multi-tenant RLS isolation (live DB)", () => {
  let admin: SupabaseClient;
  let A: Tenant;
  let B: Tenant;
  const created = { assoc: [] as string[], user: [] as string[], member: [] as string[] };

  async function makeTenant(label: string): Promise<Tenant> {
    const slug = `test-${label}-${rid()}`;
    const { data: assoc, error: aErr } = await admin
      .from("associations")
      .insert({ name: `Test ${label}`, slug })
      .select("id")
      .single();
    if (aErr) throw aErr;
    created.assoc.push(assoc.id);

    const email = `rls-${label}-${rid()}@test.invalid`;
    const password = `Pw-${rid()}-${rid()}`;
    const { data: u, error: uErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (uErr) throw uErr;
    created.user.push(u.user!.id);

    // Make this user an ADMIN of their association and pin it as the active one.
    await admin.from("memberships").update({ is_default: false }).eq("user_id", u.user!.id);
    const { error: mErr } = await admin.from("memberships").insert({
      user_id: u.user!.id,
      association_id: assoc.id,
      role: "admin",
      is_default: true,
    });
    if (mErr) throw mErr;

    // Seed a member row owned by this association.
    const memberId = `m-${rid()}-${rid()}`;
    const { error: memErr } = await admin.from("members").insert({
      id: memberId,
      code: `${slug.toUpperCase()}-000001`,
      name: `Member of ${label}`,
      type: "company",
      level: "memberLevel.medium",
      industry: "ind.trade",
      region: "region.north",
      status: "active",
      joined_at: "2024-01-01",
      fee_year: 2024,
      association_id: assoc.id,
    });
    if (memErr) throw memErr;
    created.member.push(memberId);

    const client = anonClient();
    const { error: sErr } = await client.auth.signInWithPassword({ email, password });
    if (sErr) throw sErr;

    return { assocId: assoc.id, slug, userId: u.user!.id, email, password, memberId, client };
  }

  beforeAll(async () => {
    requireStagingSupabase();
    admin = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    A = await makeTenant("a");
    B = await makeTenant("b");
  }, 60_000);

  afterAll(async () => {
    if (!admin) return;
    await admin.from("members").delete().in("id", created.member);
    await admin.from("memberships").delete().in("user_id", created.user);
    for (const id of created.user) await admin.auth.admin.deleteUser(id).catch(() => {});
    await admin.from("associations").delete().in("id", created.assoc);
  }, 60_000);

  it("admin can read members of their OWN association", async () => {
    const { data, error } = await A.client
      .from("members")
      .select("id")
      .eq("association_id", A.assocId);
    expect(error).toBeNull();
    expect((data ?? []).map((r: any) => r.id)).toContain(A.memberId);
  });

  it("admin CANNOT read members of ANOTHER association (cross-tenant denied)", async () => {
    const { data, error } = await B.client
      .from("members")
      .select("id")
      .eq("association_id", A.assocId);
    expect(error).toBeNull(); // RLS filters rows; not a hard error
    expect((data ?? []).map((r: any) => r.id)).not.toContain(A.memberId);
    expect(data ?? []).toHaveLength(0);
  });

  it("admin CANNOT update another association's member", async () => {
    const { data, error } = await B.client
      .from("members")
      .update({ name: "HACKED" })
      .eq("id", A.memberId)
      .select("id");
    // RLS rejects the row from the UPDATE scope: no rows affected (or error).
    expect((data ?? []).length).toBe(0);
    // Confirm the row is untouched via the service role.
    const { data: check } = await admin
      .from("members")
      .select("name")
      .eq("id", A.memberId)
      .single();
    expect(check?.name).not.toBe("HACKED");
    void error;
  });

  // -------------------------------------------------------------------------
  // Forced association_id attacks: a client deliberately supplies a foreign
  // association_id on write. RLS WITH CHECK must always pin writes to an
  // association where the caller is admin, regardless of the payload.
  // -------------------------------------------------------------------------

  it("admin CANNOT re-assign their OWN member to another association (UPDATE association_id)", async () => {
    const { data, error } = await A.client
      .from("members")
      .update({ association_id: B.assocId }) // attempt to move row into B
      .eq("id", A.memberId)
      .select("id, association_id");
    // WITH CHECK on the NEW association_id (B) fails → 0 rows affected or error.
    expect((data ?? []).length).toBe(0);
    // Row must still belong to A.
    const { data: check } = await admin
      .from("members")
      .select("association_id")
      .eq("id", A.memberId)
      .single();
    expect(check?.association_id).toBe(A.assocId);
    void error;
  });

  it("admin CANNOT insert a member while forging another association_id", async () => {
    const evilId = `forge-${rid()}-${rid()}`;
    const { error } = await A.client.from("members").insert({
      id: evilId,
      code: `${B.slug.toUpperCase()}-888888`,
      name: "Forged into B",
      type: "company",
      level: "memberLevel.medium",
      industry: "ind.trade",
      region: "region.north",
      status: "active",
      joined_at: "2024-01-01",
      fee_year: 2024,
      association_id: B.assocId, // caller is admin of A, not B
    });
    expect(error).not.toBeNull();
    // Nothing leaked into B.
    const { data: leak } = await admin.from("members").select("id").eq("id", evilId);
    expect(leak ?? []).toHaveLength(0);
  });

  it("forged association_id on read filter never returns another tenant's rows", async () => {
    // Even though the client explicitly targets A's association_id, RLS scopes
    // SELECT to rows the caller (admin of B) may see → empty.
    const { data, error } = await B.client
      .from("members")
      .select("id, association_id")
      .eq("association_id", A.assocId);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("admin CANNOT re-assign another association's member to themselves (UPDATE)", async () => {
    // B tries to pull A's member into B by rewriting association_id.
    const { data } = await B.client
      .from("members")
      .update({ association_id: B.assocId })
      .eq("id", A.memberId)
      .select("id");
    expect((data ?? []).length).toBe(0);
    const { data: check } = await admin
      .from("members")
      .select("association_id")
      .eq("id", A.memberId)
      .single();
    expect(check?.association_id).toBe(A.assocId);
  });

  it("admin CANNOT insert a member into another association", async () => {
    const { error } = await B.client.from("members").insert({
      id: `evil-${rid()}`,
      code: `${A.slug.toUpperCase()}-999999`,
      name: "Injected",
      type: "company",
      level: "memberLevel.medium",
      industry: "ind.trade",
      region: "region.north",
      status: "active",
      joined_at: "2024-01-01",
      fee_year: 2024,
      association_id: A.assocId, // foreign association → must be blocked
    });
    expect(error).not.toBeNull();
  });

  it("admin CAN add a MEMBER (individual) to their OWN association", async () => {
    const id = `mem-${rid()}-${rid()}`;
    created.member.push(id);
    const { data, error } = await A.client
      .from("members")
      .insert({
        id,
        code: `${A.slug.toUpperCase()}-100001`,
        name: "New Individual",
        type: "individual",
        level: "memberLevel.medium",
        industry: "ind.trade",
        region: "region.north",
        status: "active",
        joined_at: "2024-01-01",
        fee_year: 2024,
        association_id: A.assocId,
      })
      .select("id, association_id, type")
      .single();
    expect(error).toBeNull();
    expect(data?.association_id).toBe(A.assocId);
    expect(data?.type).toBe("individual");
  });

  it("admin CAN add a COMPANY (type=company) to their OWN association", async () => {
    const id = `co-${rid()}-${rid()}`;
    created.member.push(id);
    const { data, error } = await A.client
      .from("members")
      .insert({
        id,
        code: `${A.slug.toUpperCase()}-100002`,
        name: "New Company Ltd",
        type: "company",
        level: "memberLevel.medium",
        industry: "ind.trade",
        region: "region.north",
        status: "active",
        joined_at: "2024-01-01",
        fee_year: 2024,
        association_id: A.assocId,
      })
      .select("id, association_id, type")
      .single();
    expect(error).toBeNull();
    expect(data?.association_id).toBe(A.assocId);
    expect(data?.type).toBe("company");
  });

  it("admin's inserted rows are isolated from the OTHER association", async () => {
    const { data } = await B.client.from("members").select("id").eq("association_id", A.assocId);
    expect(data ?? []).toHaveLength(0);
  });

  it("anonymous (unauthenticated) client cannot read tenant members", async () => {
    const { data } = await anonClient()
      .from("members")
      .select("id")
      .eq("association_id", A.assocId);
    expect(data ?? []).toHaveLength(0);
  });
});
