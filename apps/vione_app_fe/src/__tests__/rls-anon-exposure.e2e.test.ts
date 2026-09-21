import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { requireStagingSupabase } from "./helpers/test-env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Live ANON EXPOSURE test (hits the real database via PostgREST).
//
// Locks in the two-layer guarantee that also lives in scripts/security-guard.sql:
//
//   (a) An anonymous, unauthenticated client calling Supabase REST/PostgREST
//       directly can read NOTHING except published associations.
//   (b) A signed-in user belonging to a DIFFERENT tenant cannot read the
//       current tenant's data (cross-tenant isolation at the REST layer).
//
// Whitelist = ONLY `associations` (landing is public by slug, exposed only
// when landing_published = true). Every other public table must be unreachable
// by anon — both because no anon/public policy exists AND because anon has no
// table GRANT.
//
// Cleans up everything it creates. Skipped when the service role key is absent.
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const canRun = Boolean(SUPABASE_URL && SERVICE_ROLE && ANON_KEY);

const rid = () => Math.random().toString(36).slice(2, 10);

// Whitelist: only `associations` may ever be reachable by anon.
const WHITELIST = new Set<string>(["associations"]);

// Business tables that MUST be invisible to anon. (Subset covering every
// sensitive surface — anon must read 0 rows / be denied on each.)
const PROTECTED_TABLES = [
  "members",
  "memberships",
  "profiles",
  "user_roles",
  "messages",
  "invoices",
  "invoice_reminders",
  "documents",
  "events",
  "event_registrations",
  "reviews",
  "quote_requests",
  "opportunities",
  "opportunity_interests",
  "products",
  "transactions",
  "votes",
  "notifications",
  "member_notifications",
  "activity_log",
  "app_settings",
  "ai_request_audit",
  "member_account_audit",
  "member_identity_passes",
  "member_identity_events",
  "sponsors",
  "sponsor_packages",
  "news",
  "perks",
  "connections",
  "meetings",
  "attendees",
  "card_settings",
] as const;

function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL!, ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

describe.skipIf(!canRun)("anon PostgREST exposure (live DB)", () => {
  let admin: SupabaseClient;
  // Tenant A: has a published landing + private data seeded by service role.
  let assocId: string;
  let slug: string;
  // A user in a DIFFERENT tenant (B) — used for cross-tenant checks.
  let other: { userId: string; email: string; password: string; client: SupabaseClient };
  let otherAssocId: string;
  const created = { assoc: [] as string[], user: [] as string[], member: [] as string[] };

  beforeAll(async () => {
    requireStagingSupabase();
    admin = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ---- Tenant A with a PUBLISHED landing page ----
    slug = `anon-a-${rid()}`;
    const { data: a, error: aErr } = await admin
      .from("associations")
      .insert({ name: `Anon A ${rid()}`, slug, landing_published: true })
      .select("id")
      .single();
    if (aErr) throw aErr;
    assocId = a.id;
    created.assoc.push(assocId);

    // Seed a private member row in tenant A (must stay invisible to anon).
    const { data: m, error: mErr } = await admin
      .from("members")
      .insert({
        id: `anon-mem-${rid()}-${rid()}`,
        name: "Private Member A",
        type: "company",
        level: "memberLevel.medium",
        industry: "ind.trade",
        region: "region.north",
        status: "active",
        joined_at: "2024-01-01",
        fee_year: 2024,
        association_id: assocId,
      })
      .select("id")
      .single();
    if (mErr) throw mErr;
    created.member.push(m.id);

    // ---- Tenant B with an admin user (cross-tenant actor) ----
    const otherSlug = `anon-b-${rid()}`;
    const { data: b, error: bErr } = await admin
      .from("associations")
      .insert({ name: `Anon B ${rid()}`, slug: otherSlug })
      .select("id")
      .single();
    if (bErr) throw bErr;
    otherAssocId = b.id;
    created.assoc.push(otherAssocId);

    const email = `anon-other-${rid()}@test.invalid`;
    const password = `Pw-${rid()}-${rid()}`;
    const { data: u, error: uErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (uErr) throw uErr;
    created.user.push(u.user!.id);
    await admin.from("memberships").update({ is_default: false }).eq("user_id", u.user!.id);
    await admin.from("memberships").insert({
      user_id: u.user!.id,
      association_id: otherAssocId,
      role: "admin",
      is_default: true,
    });

    const client = anonClient();
    const { error: sErr } = await client.auth.signInWithPassword({ email, password });
    if (sErr) throw sErr;
    other = { userId: u.user!.id, email, password, client };
  });

  afterAll(async () => {
    if (!admin) return;
    for (const id of created.member) await admin.from("members").delete().eq("id", id);
    for (const id of created.user) await admin.auth.admin.deleteUser(id).catch(() => {});
    for (const id of created.assoc) await admin.from("associations").delete().eq("id", id);
  });

  // ----------------------------------------------------------------------
  // (a) Anon cannot read anything except published associations.
  // ----------------------------------------------------------------------

  it("anon CAN read the published association (whitelisted, landing_published)", async () => {
    const { data, error } = await anonClient()
      .from("associations")
      .select("id, slug, name")
      .eq("slug", slug);
    expect(error).toBeNull();
    expect((data ?? []).some((r) => r.id === assocId)).toBe(true);
  });

  it("anon CANNOT read an UNpublished association", async () => {
    const { data, error } = await anonClient()
      .from("associations")
      .select("id")
      .eq("id", otherAssocId); // tenant B is not published
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("whitelist contains only `associations`", () => {
    expect([...WHITELIST]).toEqual(["associations"]);
  });

  for (const table of PROTECTED_TABLES) {
    it(`anon CANNOT read ${table} (not whitelisted)`, async () => {
      expect(WHITELIST.has(table)).toBe(false);
      const { data, error } = await anonClient().from(table).select("*").limit(1);
      // Either PostgREST denies (permission error) or RLS returns zero rows.
      // Both satisfy "anon reads nothing"; a non-empty result is a failure.
      if (error) {
        expect(error).not.toBeNull();
      } else {
        expect(data ?? []).toHaveLength(0);
      }
    });
  }

  // ----------------------------------------------------------------------
  // (b) Signed-in user in a different tenant cannot read tenant A's data.
  // ----------------------------------------------------------------------

  it("cross-tenant user CANNOT read tenant A members", async () => {
    const { data, error } = await other.client
      .from("members")
      .select("id")
      .eq("association_id", assocId);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("cross-tenant user CANNOT read tenant A invoices", async () => {
    const { data, error } = await other.client
      .from("invoices")
      .select("id")
      .eq("association_id", assocId);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("cross-tenant user CANNOT read tenant A documents", async () => {
    const { data, error } = await other.client
      .from("documents")
      .select("id")
      .eq("association_id", assocId);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });
});
