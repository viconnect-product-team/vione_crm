import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { requireStagingSupabase } from "./helpers/test-env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Live DB tests for the queries behind:
//   - getCompanyHistoryFn (activity_log + event_registrations + events + invoices)
//   - listPeersFn (list_peers RPC) and getNetworkStateFn (connections)
//
// These exercise the exact RLS-scoped queries the server functions run, using
// a signed-in client (mirrors `requireSupabaseAuth`). The goal is to prove the
// queries return the correct, NON-EMPTY data when a session exists — and that
// an anonymous client gets nothing (no false data without a session).
//
// Skipped automatically when the service role key isn't available.
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

describe.skipIf(!canRun)("company history + networking queries (live DB)", () => {
  let admin: SupabaseClient;
  let client: SupabaseClient; // signed-in admin of the tenant

  const slug = `test-ch-${rid()}`;
  const email = `ch-${rid()}@test.invalid`;
  const password = `Pw-${rid()}-${rid()}`;
  let assocId = "";
  let userId = "";

  // The "company" whose history we build, plus a peer in the same association.
  const memberId = `m-${rid()}-${rid()}`;
  const peerId = `m-${rid()}-${rid()}`;
  let memberCode = "";
  const eventId = `ev-${rid()}`;
  const invoiceId = `inv-${rid()}`;
  const invoiceNo = `HD-${rid()}`;

  beforeAll(async () => {
    requireStagingSupabase();
    admin = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Association
    const { data: assoc, error: aErr } = await admin
      .from("associations")
      .insert({ name: "Test CH", slug })
      .select("id")
      .single();
    if (aErr) throw aErr;
    assocId = assoc.id;

    // Admin user pinned to this association
    const { data: u, error: uErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (uErr) throw uErr;
    userId = u.user!.id;

    await admin.from("memberships").update({ is_default: false }).eq("user_id", userId);
    await admin.from("memberships").insert({
      user_id: userId,
      association_id: assocId,
      role: "admin",
      is_default: true,
    });
    // Link the admin user to the member profile so list_peers / current_member_id resolve.
    const baseMember = (id: string, name: string, user_id: string | null) => ({
      id,
      user_id,
      code: `${slug.toUpperCase()}-${id.slice(-6)}`,
      name,
      type: "company",
      level: "memberLevel.medium",
      industry: "ind.trade",
      region: "region.north",
      status: "active",
      joined_at: "2024-01-01",
      fee_year: 2024,
      association_id: assocId,
    });
    const { data: m, error: mErr } = await admin
      .from("members")
      .insert(baseMember(memberId, "Cong ty Test", userId))
      .select("code")
      .single();
    if (mErr) throw mErr;
    memberCode = m.code as string;
    await admin.from("members").insert(baseMember(peerId, "Cong ty Peer", null));

    // Seed history rows for the member.
    await admin.from("activity_log").insert({
      code: `AL-${rid()}`,
      user: "Admin",
      action: "Thanh toán hội phí",
      target: memberCode, // matched by company code
      category: "fee",
      at: "2024-06-01",
      association_id: assocId,
    });
    await admin.from("events").insert({
      id: eventId,
      name: "Hội nghị thường niên",
      date: "2024-09-01",
      registered: 42,
      association_id: assocId,
    });
    await admin.from("event_registrations").insert({
      id: `reg-${rid()}`,
      event_id: eventId,
      member_code: memberCode,
      member_name: "Cong ty Test",
      status: "attended",
      ticket_type: "speaker",
      association_id: assocId,
    });
    await admin.from("invoices").insert({
      id: invoiceId,
      member_id: memberId,
      invoice_no: invoiceNo,
      year: 2024,
      amount: 5000000,
      due_date: "2024-03-01",
      paid_at: "2024-02-20",
      status: "paid",
      method: "bank",
      association_id: assocId,
    });

    client = anonClient();
    const { error: sErr } = await client.auth.signInWithPassword({ email, password });
    if (sErr) throw sErr;
  }, 60_000);

  afterAll(async () => {
    if (!admin) return;
    await admin.from("invoices").delete().eq("id", invoiceId);
    await admin.from("event_registrations").delete().eq("event_id", eventId);
    await admin.from("events").delete().eq("id", eventId);
    await admin.from("activity_log").delete().eq("target", memberCode);
    await admin.from("connections").delete().eq("association_id", assocId);
    await admin.from("members").delete().in("id", [memberId, peerId]);
    await admin.from("memberships").delete().eq("user_id", userId);
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    await admin.from("associations").delete().eq("id", assocId);
  }, 60_000);

  // --- getCompanyHistory queries ----------------------------------------

  it("activity_log query returns this member's activities (non-empty)", async () => {
    const { data, error } = await client
      .from("activity_log")
      .select("code, action, target, category, created_at")
      .in("target", [memberCode, "Cong ty Test"])
      .order("created_at", { ascending: false })
      .limit(50);
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
    expect(data![0].action).toBe("Thanh toán hội phí");
  });

  it("event_registrations + events join returns enriched event history", async () => {
    const { data: regs, error } = await client
      .from("event_registrations")
      .select("id, event_id, status, ticket_type")
      .eq("member_code", memberCode);
    expect(error).toBeNull();
    expect((regs ?? []).length).toBeGreaterThan(0);

    const ids = [...new Set((regs ?? []).map((r: any) => r.event_id as string))];
    const { data: evs } = await client.from("events").select("id, name, registered").in("id", ids);
    expect((evs ?? [])[0]?.name).toBe("Hội nghị thường niên");
    expect((evs ?? [])[0]?.registered).toBe(42);
  });

  it("invoices query returns this member's payments (non-empty, correct amount)", async () => {
    const { data, error } = await client
      .from("invoices")
      .select("invoice_no, amount, status, method")
      .eq("member_id", memberId)
      .limit(50);
    expect(error).toBeNull();
    expect((data ?? []).length).toBe(1);
    expect(Number(data![0].amount)).toBe(5000000);
    expect(data![0].status).toBe("paid");
  });

  // --- networking queries ----------------------------------------------

  it("list_peers RPC returns peers in the association with a session", async () => {
    const { data, error } = await client.rpc("list_peers");
    expect(error).toBeNull();
    const ids = (data ?? []).map((r: { id: string }) => r.id);
    expect(ids).toContain(memberId);
    expect(ids).toContain(peerId);
    // Sensitive columns are not exposed by the RPC.
    expect(data![0]).not.toHaveProperty("email");
    expect(data![0]).not.toHaveProperty("phone");
  });

  it("current_member_id resolves to the signed-in user's member", async () => {
    const { data, error } = await client.rpc("current_member_id");
    expect(error).toBeNull();
    expect(data).toBe(memberId);
  });

  it("connections query succeeds and starts empty (no false data)", async () => {
    const { data, error } = await client.from("connections").select("peer_id,status");
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  // --- no session => no data -------------------------------------------

  it("anonymous client gets NO company-history or peer data", async () => {
    const anon = anonClient();
    const inv = await anon.from("invoices").select("id").eq("member_id", memberId);
    expect(inv.data ?? []).toHaveLength(0);

    const al = await anon.from("activity_log").select("code").in("target", [memberCode]);
    expect(al.data ?? []).toHaveLength(0);

    const peers = await anon.rpc("list_peers");
    // No session => current_association_id() is null => no peers leak.
    expect((peers.data ?? []).map((r: { id: string }) => r.id)).not.toContain(memberId);
  });
});
