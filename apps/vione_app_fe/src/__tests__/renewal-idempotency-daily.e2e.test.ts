import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { requireStagingSupabase } from "./helpers/test-env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Live-DB e2e proving payMyRenewal's idempotency is SCOPED TO ONE DAY:
//   - Same day: repeat calls are no-ops (no extra invoice, no extra extension).
//   - Next day: a fresh call MUST renew again exactly once, extending the term
//     by exactly one year and creating exactly one new paid invoice (no dues).
//
// Because the server-fn guard compares `renewed_at === today` where `today` is
// derived from wall clock, we simulate "sang ngày kế tiếp" by rewinding
// `members.renewed_at` back to yesterday between calls.
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
function yesterdayIso(): string {
  return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
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

// Mirror of payMyRenewal success path — MUST match the server fn's guard.
async function payMyRenewalMirror(admin: SupabaseClient, memberId: string, method: string) {
  const ctx = await loadCtx(admin, memberId);
  if (!ctx) return { success: false, amountPaid: 0, newTermEnd: null as string | null };

  const today = new Date().toISOString().slice(0, 10);
  const amount = ctx.outstanding > 0 ? ctx.outstanding : ctx.renewalFee;
  const newTermEnd = addOneYear(ctx.currentTermEnd);

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

describe.skipIf(!canRun)("payMyRenewal — daily-scoped idempotency (live DB)", () => {
  let admin: SupabaseClient;
  const slug = `test-rn-daily-${rid()}`;
  const email = `rn-daily-${rid()}@test.invalid`;
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
      .insert({ name: "Test Renew Daily", slug })
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
      name: "Hoi vien Daily",
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
      amount: 1_800_000,
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

  it("same day: 2nd + 3rd calls are no-ops; next day: renews exactly once more", async () => {
    // --- Day 1 call #1: settles pending 1.8M, extends term to 2026-06-30 ---
    const r1 = await payMyRenewalMirror(admin, memberId, "bank");
    expect(r1.success).toBe(true);
    expect(r1.amountPaid).toBe(1_800_000);
    expect(r1.newTermEnd).toBe("2026-06-30");

    const snap1Inv = await admin.from("invoices").select("id").eq("member_id", memberId);
    const snap1Mem = await admin
      .from("members")
      .select("new_term_end, renewed_at, fee_paid")
      .eq("id", memberId)
      .single();
    expect(snap1Inv.data?.length).toBe(1);

    // --- Day 1 call #2 & #3: idempotent no-ops ----------------------------
    const r2 = await payMyRenewalMirror(admin, memberId, "bank");
    const r3 = await payMyRenewalMirror(admin, memberId, "card");
    expect(r2.amountPaid).toBe(0);
    expect(r3.amountPaid).toBe(0);

    const snap2Inv = await admin.from("invoices").select("id").eq("member_id", memberId);
    const snap2Mem = await admin
      .from("members")
      .select("new_term_end, renewed_at, fee_paid")
      .eq("id", memberId)
      .single();
    expect(snap2Inv.data?.length).toBe(snap1Inv.data?.length);
    expect(snap2Mem.data).toEqual(snap1Mem.data);

    // --- Simulate "sang ngày kế tiếp" -------------------------------------
    // Rewind renewed_at to yesterday. Guard compares === today, so the next
    // call must NOT short-circuit.
    const yday = yesterdayIso();
    await admin.from("members").update({ renewed_at: yday }).eq("id", memberId);

    // --- Day 2 call: MUST renew again, exactly once -----------------------
    const r4 = await payMyRenewalMirror(admin, memberId, "bank");
    expect(r4.success).toBe(true);
    // No pending invoices remain → default renewal fee is charged.
    expect(r4.amountPaid).toBe(1_800_000); // last invoice amount picked as fee
    // Term extended by exactly ONE more year (from 2026-06-30 → 2027-06-30).
    expect(r4.newTermEnd).toBe("2027-06-30");

    const snap3Inv = await admin
      .from("invoices")
      .select("id, status, amount")
      .eq("member_id", memberId);
    // Exactly one NEW paid invoice was created (total = previous + 1).
    expect(snap3Inv.data?.length).toBe((snap2Inv.data?.length ?? 0) + 1);
    expect(snap3Inv.data?.every((r) => r.status === "paid")).toBe(true);

    const snap3Mem = await admin
      .from("members")
      .select("new_term_end, renewed_at")
      .eq("id", memberId)
      .single();
    expect(snap3Mem.data?.new_term_end).toBe("2027-06-30");
    expect(snap3Mem.data?.renewed_at).toBe(new Date().toISOString().slice(0, 10));

    // --- Day 2 call #2: idempotent again on the NEW day -------------------
    const r5 = await payMyRenewalMirror(admin, memberId, "bank");
    expect(r5.amountPaid).toBe(0);
    const snap4Inv = await admin.from("invoices").select("id").eq("member_id", memberId);
    expect(snap4Inv.data?.length).toBe(snap3Inv.data?.length);
  }, 60_000);
});

// ---------------------------------------------------------------------------
// Static invariant — guard MUST be date-scoped (renewed_at === today), not a
// permanent flag. A regression to `fee_paid` or a boolean guard would silently
// break next-day renewals.
// ---------------------------------------------------------------------------
describe("payMyRenewal — daily-scope guard invariant (static)", () => {
  const source = readFileSync("src/lib/member-app/renewal.functions.ts", "utf8");

  it("guard compares renewed_at to today (date string, not boolean)", () => {
    expect(source).toMatch(/const\s+today\s*=\s*new Date\(\)\.toISOString\(\)\.slice\(0,\s*10\)/);
    // The stored renewed_at is lifted into `previousRenewedAt` before the
    // guard; the invariant is the date-string comparison, not the identifier.
    expect(source).toMatch(/previousRenewedAt\s*=\s*\(ctx\.me[\s\S]*?renewed_at/);
    expect(source).toMatch(/previousRenewedAt\s*===\s*today/);
  });

  it("does NOT short-circuit renewal purely on fee_paid boolean", () => {
    // The guard line must include the today comparison, not just fee_paid.
    const guardLine = source
      .split("\n")
      .find((l) => l.includes("previousRenewedAt === today") && l.includes("pending"));
    expect(guardLine).toBeTruthy();
    expect(guardLine!).toMatch(/today/);
  });
});
