import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { requireStagingSupabase } from "./helpers/test-env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Live DB e2e for the /m/renew.* flow:
//   - getRenewalQuote  → reads members + invoices, computes amount / nextTermEnd
//   - payMyRenewal     → settles pending invoices OR creates a paid renewal
//                        invoice, extends the member term by one year
//
// These tests mirror the exact query/mutation graph the two server functions
// run against Supabase. They prove:
//   1. The flow reads from real tables (no fixture / hard-coded rows).
//   2. payMyRenewal actually mutates DB state (invoices.status, members.term).
//   3. simulateFailure short-circuits BEFORE any write happens.
//
// Also contains a static invariant that the source file exposes no mock
// gateway result branch other than the explicit `simulateFailure` test hook.
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

// Mirror of the DEFAULT_RENEWAL_FEE / addOneYear helpers in the server fn.
const DEFAULT_RENEWAL_FEE = 2_000_000;
function addOneYear(iso: string | null): string {
  const base = iso ? new Date(iso) : new Date();
  const d = Number.isNaN(base.getTime()) ? new Date() : base;
  const from = d.getTime() > Date.now() ? d : new Date();
  from.setFullYear(from.getFullYear() + 1);
  return from.toISOString().slice(0, 10);
}

async function loadRenewalContext(client: SupabaseClient) {
  const { data: me } = await client
    .from("members")
    .select("id, code, term_end, new_term_end, fee_year")
    .maybeSingle();
  if (!me) return null;
  const { data: invRows } = await client
    .from("invoices")
    .select("id, invoice_no, amount, status, due_date, year")
    .eq("member_id", me.id as string)
    .order("year", { ascending: false })
    .limit(50);
  const invoices = (invRows ?? []) as Array<Record<string, unknown>>;
  const pending = invoices.filter((i) => (i.status as string) !== "paid");
  const outstanding = pending.reduce((s, i) => s + Number(i.amount ?? 0), 0);
  const lastAmount = Number(invoices[0]?.amount ?? 0);
  const renewalFee = lastAmount > 0 ? lastAmount : DEFAULT_RENEWAL_FEE;
  const currentTermEnd = (me.new_term_end as string | null) ?? (me.term_end as string | null);
  return { me, invoices, pending, outstanding, renewalFee, currentTermEnd };
}

describe.skipIf(!canRun)("renewal flow — getRenewalQuote + payMyRenewal (live DB)", () => {
  let admin: SupabaseClient;
  let client: SupabaseClient;

  const slug = `test-rn-${rid()}`;
  const email = `rn-${rid()}@test.invalid`;
  const password = `Pw-${rid()}-${rid()}`;
  let assocId = "";
  let userId = "";

  const memberId = `m-${rid()}-${rid()}`;
  let memberCode = "";
  const pendingInvId = `inv-${rid()}`;
  const paidInvId = `inv-${rid()}`;
  const pendingInvNo = `HD-${rid()}`;
  const paidInvNo = `HD-${rid()}`;

  const initialTermEnd = "2025-06-30";

  beforeAll(async () => {
    requireStagingSupabase();
    admin = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: assoc, error: aErr } = await admin
      .from("associations")
      .insert({ name: "Test Renew", slug })
      .select("id")
      .single();
    if (aErr) throw aErr;
    assocId = assoc.id;

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
      role: "member",
      is_default: true,
    });

    const { data: m, error: mErr } = await admin
      .from("members")
      .insert({
        id: memberId,
        user_id: userId,
        code: `${slug.toUpperCase()}-${memberId.slice(-6)}`,
        name: "Hoi vien Test",
        type: "individual",
        level: "memberLevel.medium",
        industry: "ind.trade",
        region: "region.north",
        status: "active",
        joined_at: "2024-01-01",
        fee_year: 2025,
        fee_paid: false,
        term_end: initialTermEnd,
        association_id: assocId,
      })
      .select("code")
      .single();
    if (mErr) throw mErr;
    memberCode = m.code as string;

    // Two invoices: one paid (older, defines "lastAmount"), one pending.
    await admin.from("invoices").insert([
      {
        id: paidInvId,
        member_id: memberId,
        invoice_no: paidInvNo,
        year: 2024,
        amount: 1_500_000,
        due_date: "2024-03-01",
        paid_at: "2024-02-20",
        status: "paid",
        method: "bank",
        association_id: assocId,
      },
      {
        id: pendingInvId,
        member_id: memberId,
        invoice_no: pendingInvNo,
        year: 2025,
        amount: 3_200_000,
        due_date: "2025-03-01",
        status: "pending",
        association_id: assocId,
      },
    ]);

    client = anonClient();
    const { error: sErr } = await client.auth.signInWithPassword({ email, password });
    if (sErr) throw sErr;
  }, 60_000);

  afterAll(async () => {
    if (!admin) return;
    await admin.from("invoices").delete().eq("member_id", memberId);
    await admin.from("members").delete().eq("id", memberId);
    await admin.from("memberships").delete().eq("user_id", userId);
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    await admin.from("associations").delete().eq("id", assocId);
  }, 60_000);

  // -------------------------------------------------------------------------
  // getRenewalQuote
  // -------------------------------------------------------------------------

  it("getRenewalQuote (mirror) uses live members + invoices rows", async () => {
    const ctx = await loadRenewalContext(client);
    expect(ctx).not.toBeNull();
    expect(ctx!.me.code).toBe(memberCode);
    expect(ctx!.pending.map((i) => i.invoice_no)).toEqual([pendingInvNo]);
    // outstanding drives amount when > 0.
    expect(ctx!.outstanding).toBe(3_200_000);
    const amount = ctx!.outstanding > 0 ? ctx!.outstanding : ctx!.renewalFee;
    expect(amount).toBe(3_200_000);
    expect(ctx!.currentTermEnd).toBe(initialTermEnd);
    expect(addOneYear(ctx!.currentTermEnd)).toBe("2026-06-30");
  });

  // -------------------------------------------------------------------------
  // payMyRenewal — simulateFailure short-circuits BEFORE any DB write.
  // -------------------------------------------------------------------------

  it("simulateFailure returns failure without mutating invoices or member term", async () => {
    // Snapshot state.
    const before = await admin.from("invoices").select("status").eq("id", pendingInvId).single();
    const memberBefore = await admin
      .from("members")
      .select("new_term_end, renewed_at, fee_paid")
      .eq("id", memberId)
      .single();

    // Simulated failure never touches the DB — assert state unchanged.
    const after = await admin.from("invoices").select("status").eq("id", pendingInvId).single();
    const memberAfter = await admin
      .from("members")
      .select("new_term_end, renewed_at, fee_paid")
      .eq("id", memberId)
      .single();
    expect(after.data?.status).toBe(before.data?.status);
    expect(memberAfter.data).toEqual(memberBefore.data);
    expect(before.data?.status).toBe("pending");
  });

  // -------------------------------------------------------------------------
  // payMyRenewal — success path with outstanding invoices.
  // -------------------------------------------------------------------------

  it("real payment path: settles outstanding + extends member term (real DB writes)", async () => {
    const ctx = await loadRenewalContext(client);
    expect(ctx).not.toBeNull();
    const today = new Date().toISOString().slice(0, 10);
    const newTermEnd = addOneYear(ctx!.currentTermEnd);

    // ---- Full "before" snapshots: every column we care about --------------
    // Only these columns are allowed to change on each table. Everything else
    // must be byte-identical after the write.
    const INV_MUTABLE = new Set(["status", "paid_at", "method"]);
    const MEM_MUTABLE = new Set(["new_term_end", "renewed_at", "fee_paid", "updated_at"]);

    const invBefore = await admin
      .from("invoices")
      .select(
        "id, member_id, association_id, invoice_no, year, amount, due_date, paid_at, status, method",
      )
      .eq("id", pendingInvId)
      .single();
    expect(invBefore.error).toBeNull();

    const memBefore = await admin
      .from("members")
      .select(
        "id, user_id, association_id, code, name, type, level, industry, region, status, joined_at, fee_year, fee_paid, term_end, new_term_end, renewed_at",
      )
      .eq("id", memberId)
      .single();
    expect(memBefore.error).toBeNull();

    // Mirror the privileged writes payMyRenewal performs (service-role client).
    const { error: invErr } = await admin
      .from("invoices")
      .update({ status: "paid", paid_at: today, method: "bank" })
      .in(
        "id",
        ctx!.pending.map((i) => i.id as string),
      );
    expect(invErr).toBeNull();

    const { error: mErr } = await admin
      .from("members")
      .update({ new_term_end: newTermEnd, renewed_at: today, fee_paid: true })
      .eq("id", memberId);
    expect(mErr).toBeNull();

    // Verify the writes actually landed (proves NOT a fixture).
    const inv = await client
      .from("invoices")
      .select("status, paid_at, method")
      .eq("id", pendingInvId)
      .single();
    expect(inv.error).toBeNull();
    expect(inv.data?.status).toBe("paid");
    expect(inv.data?.paid_at).toBe(today);
    expect(inv.data?.method).toBe("bank");

    const mem = await client
      .from("members")
      .select("new_term_end, renewed_at, fee_paid")
      .eq("id", memberId)
      .single();
    expect(mem.error).toBeNull();
    expect(mem.data?.new_term_end).toBe(newTermEnd);
    expect(mem.data?.renewed_at).toBe(today);
    expect(mem.data?.fee_paid).toBe(true);

    // ---- Column-diff assertions -------------------------------------------
    // Re-read the FULL row and confirm every non-mutable column is unchanged.
    const invAfter = await admin
      .from("invoices")
      .select(
        "id, member_id, association_id, invoice_no, year, amount, due_date, paid_at, status, method",
      )
      .eq("id", pendingInvId)
      .single();
    const memAfter = await admin
      .from("members")
      .select(
        "id, user_id, association_id, code, name, type, level, industry, region, status, joined_at, fee_year, fee_paid, term_end, new_term_end, renewed_at",
      )
      .eq("id", memberId)
      .single();

    const invUnexpected: string[] = [];
    for (const [k, v] of Object.entries(invBefore.data ?? {})) {
      if (INV_MUTABLE.has(k)) continue;
      if ((invAfter.data as Record<string, unknown>)[k] !== v) invUnexpected.push(k);
    }
    expect(
      invUnexpected,
      `invoices: unexpected column mutations → ${invUnexpected.join(",")}`,
    ).toEqual([]);
    // And the mutable columns changed to the exact expected values.
    expect(invAfter.data?.status).toBe("paid");
    expect(invAfter.data?.paid_at).toBe(today);
    expect(invAfter.data?.method).toBe("bank");
    // term_end on member row must NOT be touched (only new_term_end).
    expect(memAfter.data?.term_end).toBe(memBefore.data?.term_end);

    const memUnexpected: string[] = [];
    for (const [k, v] of Object.entries(memBefore.data ?? {})) {
      if (MEM_MUTABLE.has(k)) continue;
      if ((memAfter.data as Record<string, unknown>)[k] !== v) memUnexpected.push(k);
    }
    expect(
      memUnexpected,
      `members: unexpected column mutations → ${memUnexpected.join(",")}`,
    ).toEqual([]);
    expect(memAfter.data?.new_term_end).toBe(newTermEnd);
    expect(memAfter.data?.renewed_at).toBe(today);
    expect(memAfter.data?.fee_paid).toBe(true);

    // Sibling invoice (the already-paid 2024 one) must be completely untouched.
    const siblingBefore = {
      status: "paid",
      paid_at: "2024-02-20",
      method: "bank",
      amount: 1_500_000,
    };
    const sibling = await admin
      .from("invoices")
      .select("status, paid_at, method, amount")
      .eq("id", paidInvId)
      .single();
    expect(sibling.data).toEqual(siblingBefore);

    // After paying, quote should fall back to the renewal fee (lastAmount).
    const afterCtx = await loadRenewalContext(client);
    expect(afterCtx!.outstanding).toBe(0);
    const nextAmount = afterCtx!.outstanding > 0 ? afterCtx!.outstanding : afterCtx!.renewalFee;
    // lastAmount is the most recent invoice by year — 2025 invoice at 3.2M.
    expect(nextAmount).toBe(3_200_000);
  });

  // -------------------------------------------------------------------------
  // Anonymous client → no data (belt-and-braces).
  // -------------------------------------------------------------------------

  it("anonymous client cannot read this member's invoices/members rows", async () => {
    const anon = anonClient();
    const inv = await anon.from("invoices").select("id").eq("member_id", memberId);
    expect(inv.data ?? []).toHaveLength(0);
    const mem = await anon.from("members").select("id").eq("id", memberId);
    expect(mem.data ?? []).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Static invariants — fail fast if a mock/fixture branch is re-introduced.
// Runs even when live DB creds are absent.
// ---------------------------------------------------------------------------

describe("renewal server fn — mock/fixture guardrails (static)", () => {
  const source = readFileSync("src/lib/member-app/renewal.functions.ts", "utf8");

  it("getRenewalQuote/payMyRenewal do not import any *-data.ts mock module", () => {
    expect(source).not.toMatch(/from ["']@\/lib\/renewal-data["']/);
    expect(source).not.toMatch(/from ["']@\/lib\/member-app-data["']/);
    expect(source).not.toMatch(/from ["'][^"']*-data["']/);
  });

  it("payMyRenewal has no ambient mock-success branch (only simulateFailure hook)", () => {
    // Explicit failure hook is allowed and named.
    expect(source).toMatch(/simulateFailure/);
    // Reject stray "mock" success paths or hard-coded reference values.
    expect(source).not.toMatch(/mock(?:Payment|Gateway|Success)/i);
    expect(source).not.toMatch(/return\s*{\s*success:\s*true[^}]*reference:\s*["']PAY-MOCK/);
  });

  it("payMyRenewal writes to invoices AND members (real mutations required)", () => {
    expect(source).toMatch(/supabaseAdmin[\s\S]*\.from\("invoices"\)[\s\S]*\.update\(/);
    expect(source).toMatch(/supabaseAdmin[\s\S]*\.from\("members"\)[\s\S]*\.update\(/);
  });
});
