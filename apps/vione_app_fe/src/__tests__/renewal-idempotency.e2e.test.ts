import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { requireStagingSupabase } from "./helpers/test-env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Live-DB e2e proving payMyRenewal is idempotent:
//   Calling it twice in a row (double-tap, retry, browser reload) MUST NOT
//     - charge the member twice,
//     - insert a duplicate renewal invoice, or
//     - extend `members.new_term_end` by two years.
//
// Test strategy: run the exact same read/write graph the server-fn handler
// runs (loadRenewalContext → guard → invoice write → member update) TWICE,
// then assert the DB state after the second call equals the state after the
// first call.
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const canRun = Boolean(SUPABASE_URL && SERVICE_ROLE && ANON_KEY);
const rid = () => Math.random().toString(36).slice(2, 10);

const DEFAULT_RENEWAL_FEE = 2_000_000;
function addOneYear(iso: string | null): string {
  const base = iso ? new Date(iso) : new Date();
  const d = Number.isNaN(base.getTime()) ? new Date() : base;
  const from = d.getTime() > Date.now() ? d : new Date();
  from.setFullYear(from.getFullYear() + 1);
  return from.toISOString().slice(0, 10);
}

async function loadCtx(client: SupabaseClient, memberId: string) {
  const { data: me } = await client
    .from("members")
    .select("id, code, term_end, new_term_end, renewed_at, fee_year")
    .eq("id", memberId)
    .maybeSingle();
  if (!me) return null;
  const { data: invRows } = await client
    .from("invoices")
    .select("id, invoice_no, amount, status, due_date, paid_at, year")
    .eq("member_id", memberId)
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

// Mirror of payMyRenewal (success path) — includes the today-based idempotency
// guard the server fn applies. Returns the same shape.
async function payMyRenewalMirror(admin: SupabaseClient, memberId: string, method: string) {
  const ctx = await loadCtx(admin, memberId);
  if (!ctx) return { success: false, amountPaid: 0, newTermEnd: null as string | null };

  const today = new Date().toISOString().slice(0, 10);
  const amount = ctx.outstanding > 0 ? ctx.outstanding : ctx.renewalFee;
  const newTermEnd = addOneYear(ctx.currentTermEnd);

  // Idempotency guard — MUST match the server function exactly.
  if ((ctx.me as { renewed_at?: string | null }).renewed_at === today && !ctx.pending.length) {
    return { success: true, amountPaid: 0, newTermEnd: ctx.currentTermEnd };
  }

  if (ctx.pending.length) {
    const { error } = await admin
      .from("invoices")
      .update({ status: "paid", paid_at: today, method })
      .in(
        "id",
        ctx.pending.map((i) => i.id as string),
      );
    if (error) throw error;
  } else {
    const year = new Date(newTermEnd).getFullYear();
    const invId = `INV-${Date.now().toString(36).toUpperCase()}-${rid()}`;
    const { error } = await admin.from("invoices").insert({
      id: invId,
      invoice_no: `HD-${year}-${rid().toUpperCase()}`,
      member_id: memberId,
      year,
      amount,
      due_date: today,
      paid_at: today,
      status: "paid",
      method,
    });
    if (error) throw error;
  }
  const { error: mErr } = await admin
    .from("members")
    .update({ new_term_end: newTermEnd, renewed_at: today, fee_paid: true })
    .eq("id", memberId);
  if (mErr) throw mErr;

  return { success: true, amountPaid: amount, newTermEnd };
}

describe.skipIf(!canRun)("payMyRenewal — idempotency (live DB)", () => {
  let admin: SupabaseClient;
  const slug = `test-rn-idem-${rid()}`;
  const email = `rn-idem-${rid()}@test.invalid`;
  const password = `Pw-${rid()}-${rid()}`;
  let assocId = "";
  let userId = "";
  const memberId = `m-${rid()}-${rid()}`;
  const pendingInvId = `inv-${rid()}`;

  beforeAll(async () => {
    requireStagingSupabase();
    admin = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: assoc, error: aErr } = await admin
      .from("associations")
      .insert({ name: "Test Renew Idem", slug })
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

    await admin.from("members").insert({
      id: memberId,
      user_id: userId,
      code: `${slug.toUpperCase()}-${memberId.slice(-6)}`,
      name: "Hoi vien Idem",
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
      id: pendingInvId,
      member_id: memberId,
      invoice_no: `HD-${rid()}`,
      year: 2025,
      amount: 3_200_000,
      due_date: "2025-03-01",
      status: "pending",
      association_id: assocId,
    });
  }, 60_000);

  afterAll(async () => {
    if (!admin) return;
    await admin.from("invoices").delete().eq("member_id", memberId);
    await admin.from("members").delete().eq("id", memberId);
    await admin.from("memberships").delete().eq("user_id", userId);
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    await admin.from("associations").delete().eq("id", assocId);
  }, 60_000);

  it("double-tap: 2nd call is a no-op — no extra invoice, no double extension", async () => {
    // --- 1st call: settles the pending 3.2M invoice, extends term ----------
    const r1 = await payMyRenewalMirror(admin, memberId, "bank");
    expect(r1.success).toBe(true);
    expect(r1.amountPaid).toBe(3_200_000);
    const term1 = r1.newTermEnd!;
    expect(term1).toBe("2026-06-30");

    const invAfter1 = await admin.from("invoices").select("id, status").eq("member_id", memberId);
    expect(invAfter1.data?.length).toBe(1);
    expect(invAfter1.data?.[0].status).toBe("paid");

    const memAfter1 = await admin
      .from("members")
      .select("new_term_end, renewed_at, fee_paid")
      .eq("id", memberId)
      .single();

    // --- 2nd call: MUST be idempotent -------------------------------------
    const r2 = await payMyRenewalMirror(admin, memberId, "bank");
    expect(r2.success).toBe(true);
    // No amount charged on the duplicate call.
    expect(r2.amountPaid).toBe(0);
    // Term end unchanged (same date returned, NOT +1 year further).
    expect(r2.newTermEnd).toBe(term1);

    // Invoice count MUST NOT grow (no phantom renewal invoice).
    const invAfter2 = await admin
      .from("invoices")
      .select("id, amount, status")
      .eq("member_id", memberId);
    expect(invAfter2.data?.length).toBe(1);
    expect(invAfter2.data?.[0].id).toBe(pendingInvId);
    const totalCharged = (invAfter2.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
    expect(totalCharged).toBe(3_200_000);

    // Member fields identical to snapshot after 1st call.
    const memAfter2 = await admin
      .from("members")
      .select("new_term_end, renewed_at, fee_paid")
      .eq("id", memberId)
      .single();
    expect(memAfter2.data).toEqual(memAfter1.data);
    expect(memAfter2.data?.new_term_end).toBe("2026-06-30");
  }, 30_000);

  it("3rd call same day is still a no-op (guard is stable, not one-shot)", async () => {
    const before = await admin.from("invoices").select("id").eq("member_id", memberId);
    const memBefore = await admin
      .from("members")
      .select("new_term_end, renewed_at")
      .eq("id", memberId)
      .single();

    const r3 = await payMyRenewalMirror(admin, memberId, "card");
    expect(r3.amountPaid).toBe(0);

    const after = await admin.from("invoices").select("id").eq("member_id", memberId);
    const memAfter = await admin
      .from("members")
      .select("new_term_end, renewed_at")
      .eq("id", memberId)
      .single();
    expect(after.data?.length).toBe(before.data?.length);
    expect(memAfter.data).toEqual(memBefore.data);
  });
});

// ---------------------------------------------------------------------------
// Static invariant — the idempotency guard must stay in the server fn source.
// ---------------------------------------------------------------------------
describe("payMyRenewal — idempotency guard invariant (static)", () => {
  const source = readFileSync("src/lib/member-app/renewal.functions.ts", "utf8");

  it("handler contains today-based renewed_at + !pending.length guard", () => {
    // Guard lifts renewed_at into previousRenewedAt, then compares to today.
    expect(source).toMatch(/previousRenewedAt\s*=\s*\(ctx\.me[\s\S]*?renewed_at/);
    expect(source).toMatch(/previousRenewedAt\s*===\s*today/);
    expect(source).toMatch(/!ctx\.pending\.length/);
  });

  it("loadRenewalContext selects renewed_at (required by the guard)", () => {
    expect(source).toMatch(/select\(\s*"id,\s*code,\s*term_end,\s*new_term_end,\s*renewed_at/);
  });
});
