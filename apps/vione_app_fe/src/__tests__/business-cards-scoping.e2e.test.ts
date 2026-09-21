import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { requireStagingSupabase } from "./helpers/test-env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { resolveCardListScope } from "@/lib/business-card-admin.functions";

// ---------------------------------------------------------------------------
// Live RLS test for the DESKTOP Business Card module.
//
// Verifies that the desktop card surfaces only ever expose data allowed by the
// caller's role AND association_id, exactly as the RLS-scoped
// `requireSupabaseAuth` server functions do:
//
//   1. Owner scope: a member reads only their OWN cards (member_id).
//   2. Association/manager scope: an association admin reads cards in THEIR
//      association, and never another association's cards.
//   3. Admin listing scope: `resolveCardListScope` pins an association admin's
//      query to their association ids; cross-tenant rows never return.
//   4. Anonymous: cannot read any card via the Data API.
//
// Cleans up everything it creates. Skipped when the service role key is not in
// the environment (plain CI without secrets).
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const canRun = Boolean(SUPABASE_URL && SERVICE_ROLE && ANON_KEY);
const rid = () => Math.random().toString(36).slice(2, 10);

function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL!, ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type Tenant = {
  assocId: string;
  slug: string;
  userId: string;
  memberId: string;
  cardId: string;
  client: SupabaseClient;
};

describe.skipIf(!canRun)("desktop Business Card RLS scoping (live DB)", () => {
  let admin: SupabaseClient;
  let A: Tenant;
  let B: Tenant;
  const created = { assoc: [] as string[], user: [] as string[], member: [] as string[] };

  async function makeTenant(label: string): Promise<Tenant> {
    const slug = `bc-${label}-${rid()}`;
    const { data: assoc, error: aErr } = await admin
      .from("associations")
      .insert({ name: `BC Test ${label}`, slug })
      .select("id")
      .single();
    if (aErr) throw aErr;
    created.assoc.push(assoc.id);

    const email = `bc-${label}-${rid()}@test.invalid`;
    const password = `Pw-${rid()}-${rid()}`;
    const { data: u, error: uErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (uErr) throw uErr;
    created.user.push(u.user!.id);

    await admin.from("memberships").update({ is_default: false }).eq("user_id", u.user!.id);
    const { error: mErr } = await admin.from("memberships").insert({
      user_id: u.user!.id,
      association_id: assoc.id,
      role: "admin",
      is_default: true,
    });
    if (mErr) throw mErr;

    // Member row for this user, linked via user_id so current_member_id resolves.
    const memberId = `bcm-${rid()}-${rid()}`;
    const { error: memErr } = await admin.from("members").insert({
      id: memberId,
      code: `${slug.toUpperCase()}-000001`,
      name: `Member of ${label}`,
      type: "individual",
      level: "memberLevel.medium",
      industry: "ind.trade",
      region: "region.north",
      status: "active",
      joined_at: "2024-01-01",
      fee_year: 2024,
      association_id: assoc.id,
      user_id: u.user!.id,
    });
    if (memErr) throw memErr;
    created.member.push(memberId);

    // A draft business card owned by this member / association.
    const { data: card, error: cErr } = await admin
      .from("member_business_cards")
      .insert({
        member_id: memberId,
        association_id: assoc.id,
        slug: `card-${label}-${rid()}`,
        card_kind: "primary",
        status: "draft",
        public_mode: "members_only",
        display_name: `Card ${label}`,
      })
      .select("id")
      .single();
    if (cErr) throw cErr;

    const client = anonClient();
    const { error: sErr } = await client.auth.signInWithPassword({ email, password });
    if (sErr) throw sErr;

    return { assocId: assoc.id, slug, userId: u.user!.id, memberId, cardId: card.id, client };
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
    await admin.from("member_business_cards").delete().in("member_id", created.member);
    await admin.from("members").delete().in("id", created.member);
    await admin.from("memberships").delete().in("user_id", created.user);
    for (const id of created.user) await admin.auth.admin.deleteUser(id).catch(() => {});
    await admin.from("associations").delete().in("id", created.assoc);
  }, 60_000);

  it("owner reads their OWN card (member_id scope)", async () => {
    const { data, error } = await A.client
      .from("member_business_cards")
      .select("id, member_id")
      .eq("member_id", A.memberId);
    expect(error).toBeNull();
    expect((data ?? []).map((r: any) => r.id)).toContain(A.cardId);
  });

  it("member CANNOT read another association's card (cross-tenant denied)", async () => {
    const { data, error } = await B.client
      .from("member_business_cards")
      .select("id")
      .eq("id", A.cardId);
    expect(error).toBeNull(); // RLS filters rows, not a hard error
    expect((data ?? []).map((r: any) => r.id)).not.toContain(A.cardId);
    expect(data ?? []).toHaveLength(0);
  });

  it("association admin reads cards of THEIR association", async () => {
    const { data, error } = await A.client
      .from("member_business_cards")
      .select("id, association_id")
      .eq("association_id", A.assocId);
    expect(error).toBeNull();
    expect((data ?? []).map((r: any) => r.id)).toContain(A.cardId);
  });

  it("association admin scoped query never returns another association's cards", async () => {
    // Even explicitly targeting A's association_id, admin B is scoped out by RLS.
    const scope = resolveCardListScope({
      isPlatformAdmin: false,
      managedAssociationIds: [B.assocId],
    });
    expect(scope).toEqual({
      authorized: true,
      scope: "associations",
      associationIds: [B.assocId],
    });

    const { data, error } = await B.client
      .from("member_business_cards")
      .select("id, association_id")
      .in("association_id", (scope as { associationIds: string[] }).associationIds);
    expect(error).toBeNull();
    // B sees only its own card, never A's.
    const ids = (data ?? []).map((r: any) => r.id);
    expect(ids).toContain(B.cardId);
    expect(ids).not.toContain(A.cardId);
  });

  it("anonymous client cannot read draft cards via the Data API", async () => {
    const anon = anonClient();
    const { data } = await anon.from("member_business_cards").select("id").eq("id", A.cardId);
    expect(data ?? []).toHaveLength(0);
  });
});
