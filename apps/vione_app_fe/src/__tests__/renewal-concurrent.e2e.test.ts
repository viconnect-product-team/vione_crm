import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { requireStagingSupabase } from "./helpers/test-env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Live-DB e2e proving payMyRenewal is safe under CONCURRENT calls:
//   Two parallel invocations (double-tap on flaky network, retry storm,
//   two tabs, mobile background wake-up) MUST result in:
//     - exactly ONE new paid invoice for the member, and
//     - members.new_term_end extended by EXACTLY one year (not two).
//
// This exercises the race between "read renewed_at" and "write renewed_at"
// that the same-day guard alone cannot close without a DB-level constraint.
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
    // NOTE: uses the daily-idempotency key so two concurrent inserts on the
    // same day collide on the unique invoice_no (see migration guarding
    // invoices.invoice_no per member) — the loser is caught in Promise.all.
    const invNo = `HD-RENEW-${memberId}-${today}`;
    const invId = `INV-${today}-${memberId}`;
    const { error } = await admin.from("invoices").insert({
      id: invId,
      invoice_no: invNo,
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

describe.skipIf(!canRun)("payMyRenewal — concurrent safety (live DB)", () => {
  let admin: SupabaseClient;
  const slug = `test-rn-conc-${rid()}`;
  const email = `rn-conc-${rid()}@test.invalid`;
  const password = `Pw-${rid()}-${rid()}`;
  let assocId = "";
  let userId = "";
  const memberId = `m-${rid()}-${rid()}`;

  beforeAll(async () => {
    requireStagingSupabase();
    admin = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: assoc, error: aErr } = await admin
      .from("associations")
      .insert({ name: "Test Renew Concurrent", slug })
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
      name: "Hoi vien Concurrent",
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
      // No pending invoices → both racers hit the INSERT path (worst case).
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

  it("two parallel payMyRenewal calls → 1 invoice, term extended once", async () => {
    const startTerm = "2025-06-30";
    const expectedTerm = "2026-06-30";

    // Fire in the same tick — both calls read renewed_at before either writes.
    const results = await Promise.allSettled([
      payMyRenewalMirror(admin, memberId, "bank"),
      payMyRenewalMirror(admin, memberId, "card"),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // At least one must succeed; the other may either succeed as a no-op
    // (idempotency guard won the race) or reject on the unique-invoice_no
    // collision (DB constraint won the race). Both outcomes are correct;
    // silently double-writing is NOT.
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);
    for (const r of rejected) {
      const msg = String((r as PromiseRejectedResult).reason?.message ?? "");
      expect(msg).toMatch(/duplicate key|unique|conflict|23505/i);
    }

    // --- Invariants after the race ---------------------------------------
    const { data: invRows } = await admin
      .from("invoices")
      .select("id, invoice_no, amount, status")
      .eq("member_id", memberId);
    // Exactly ONE invoice, exactly ONE charge.
    expect(invRows?.length).toBe(1);
    expect(invRows?.[0].status).toBe("paid");

    const { data: mem } = await admin
      .from("members")
      .select("new_term_end, term_end, renewed_at, fee_paid")
      .eq("id", memberId)
      .single();
    // Term extended by exactly ONE year — not two.
    expect(mem?.new_term_end).toBe(expectedTerm);
    expect(mem?.term_end).toBe(startTerm); // original untouched
    expect(mem?.fee_paid).toBe(true);
    expect(mem?.renewed_at).toBe(new Date().toISOString().slice(0, 10));

    // Follow-up serial call on same day is still a no-op (idempotency holds).
    const r3 = await payMyRenewalMirror(admin, memberId, "bank");
    expect(r3.amountPaid).toBe(0);
    const { data: invRows2 } = await admin.from("invoices").select("id").eq("member_id", memberId);
    expect(invRows2?.length).toBe(1);
  }, 60_000);
});

// ---------------------------------------------------------------------------
// Static invariant — a DB-level guard MUST back the app-level idempotency.
// Without a unique key on the daily renewal invoice, two concurrent calls
// can slip past the read-then-write guard and both insert.
// ---------------------------------------------------------------------------
describe("payMyRenewal — concurrent-safety migration invariant (static)", () => {
  it("a migration declares a uniqueness guard on invoices.invoice_no", () => {
    // Search all migrations for a unique constraint / unique index that
    // prevents two invoices with the same invoice_no on the same member/day.
    let out = "";
    try {
      out = execSync(
        "grep -iREn --include='*.sql' -e 'unique.*invoice_no' -e 'invoice_no.*unique' supabase/migrations || true",
        { encoding: "utf8" },
      );
    } catch {
      out = "";
    }
    // If this assertion fails, add a migration:
    //   CREATE UNIQUE INDEX IF NOT EXISTS invoices_invoice_no_key
    //     ON public.invoices (invoice_no);
    expect(out.length, "expected a UNIQUE constraint/index on invoices.invoice_no").toBeGreaterThan(
      0,
    );
  });

  it("handler builds a deterministic daily invoice_no for the no-dues path", () => {
    const source = readFileSync("src/lib/member-app/renewal.functions.ts", "utf8");
    // The server fn should build invoice_no from stable inputs (member + day)
    // so concurrent racers collide on the unique key, not on a random suffix.
    // If this fails, refactor the insert branch to use `HD-RENEW-<memberId>-<today>`.
    expect(source).toMatch(/HD-RENEW-\$\{memberId\}-\$\{today\}|invoice_no.*memberId.*today/);
  });
});
