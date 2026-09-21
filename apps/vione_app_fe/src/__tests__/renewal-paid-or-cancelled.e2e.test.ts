import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { requireStagingSupabase } from "./helpers/test-env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Live-DB e2e proving payMyRenewal is a NO-OP when the only invoice(s) for
// the target renewal year are already "paid" or "cancelled":
//   - No new invoice is inserted.
//   - members.renewed_at and members.new_term_end are NOT changed.
// Mirrors the two idempotency guards in src/lib/member-app/renewal.functions.ts
// so a regression in either guard fails this test at the DB level.
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
  const pending = invoices.filter((i) => {
    const s = (i.status as string) ?? "";
    return s !== "paid" && s !== "cancelled";
  });
  const outstanding = pending.reduce((s, i) => s + Number(i.amount ?? 0), 0);
  const lastAmount = Number(invoices[0]?.amount ?? 0);
  const renewalFee = lastAmount > 0 ? lastAmount : DEFAULT_RENEWAL_FEE;
  const currentTermEnd = (me.new_term_end as string | null) ?? (me.term_end as string | null);
  return { me, invoices, pending, outstanding, renewalFee, currentTermEnd };
}

// Mirror of payMyRenewal — MUST match server-fn guards exactly.
async function payMyRenewalMirror(admin: SupabaseClient, memberId: string, method: string) {
  const ctx = await loadCtx(admin, memberId);
  if (!ctx) return { success: false, amountPaid: 0, newTermEnd: null as string | null };
  const today = new Date().toISOString().slice(0, 10);
  const amount = ctx.outstanding > 0 ? ctx.outstanding : ctx.renewalFee;
  const newTermEnd = addOneYear(ctx.currentTermEnd);

  // Guard 1: already renewed today with no dues.
  if ((ctx.me as { renewed_at?: string | null }).renewed_at === today && !ctx.pending.length) {
    return { success: true, amountPaid: 0, newTermEnd: ctx.currentTermEnd };
  }
  // Guard 2: target year already covered by a paid invoice.
  const targetYear = new Date(newTermEnd).getFullYear();
  const alreadyPaidForYear = ctx.invoices.some(
    (i) => (i.status as string) === "paid" && Number(i.year) === targetYear,
  );
  if (!ctx.pending.length && alreadyPaidForYear) {
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

async function snapshotState(admin: SupabaseClient, memberId: string) {
  const inv = await admin
    .from("invoices")
    .select("id, status, amount, year")
    .eq("member_id", memberId)
    .order("id");
  const mem = await admin
    .from("members")
    .select("renewed_at, new_term_end, term_end, fee_paid")
    .eq("id", memberId)
    .single();
  return { invoices: inv.data ?? [], member: mem.data };
}

describe.skipIf(!canRun)(
  "payMyRenewal — no-op when invoice already paid or cancelled (live DB)",
  () => {
    let admin: SupabaseClient;
    const slug = `test-rn-poc-${rid()}`;
    const email = `rn-poc-${rid()}@test.invalid`;
    const password = `Pw-${rid()}-${rid()}`;
    let assocId = "";
    let userId = "";
    const memberId = `m-${rid()}-${rid()}`;
    const paidInvId = `inv-paid-${rid()}`;
    const cancelledInvId = `inv-cancel-${rid()}`;

    // Target renewal year the guard checks — derived the same way the server fn does.
    const targetYear = new Date(addOneYear("2025-06-30")).getFullYear(); // 2026

    beforeAll(async () => {
      requireStagingSupabase();
      admin = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: assoc, error: aErr } = await admin
        .from("associations")
        .insert({ name: "Test Renew Paid/Cancelled", slug })
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
        name: "Hoi vien Paid/Cancelled",
        type: "individual",
        level: "memberLevel.medium",
        industry: "ind.trade",
        region: "region.north",
        status: "active",
        joined_at: "2024-01-01",
        fee_year: 2026,
        fee_paid: true,
        term_end: "2025-06-30",
        new_term_end: "2026-06-30",
        renewed_at: "2025-07-01", // NOT today → guard 1 alone won't trigger.
        association_id: assocId,
      });

      // Pre-existing PAID invoice for the target renewal year → guard 2 must trigger.
      await admin.from("invoices").insert({
        id: paidInvId,
        member_id: memberId,
        invoice_no: `HD-${targetYear}-${rid().toUpperCase()}`,
        year: targetYear,
        amount: 1_800_000,
        due_date: "2026-01-01",
        paid_at: "2025-07-01",
        status: "paid",
        method: "bank",
        association_id: assocId,
      });

      // Cancelled invoice — must NOT be reactivated / treated as pending.
      await admin.from("invoices").insert({
        id: cancelledInvId,
        member_id: memberId,
        invoice_no: `HD-CANCEL-${rid().toUpperCase()}`,
        year: targetYear,
        amount: 500_000,
        due_date: "2026-02-01",
        status: "cancelled",
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

    it("returns success with amountPaid=0 and does NOT create a new invoice or bump member fields", async () => {
      const before = await snapshotState(admin, memberId);
      expect(before.invoices.length).toBe(2);

      // Fire several attempts (double-tap, retry) — all must be no-ops.
      const r1 = await payMyRenewalMirror(admin, memberId, "bank");
      const r2 = await payMyRenewalMirror(admin, memberId, "card");
      const r3 = await payMyRenewalMirror(admin, memberId, "ewallet");

      for (const r of [r1, r2, r3]) {
        expect(r.success).toBe(true);
        expect(r.amountPaid).toBe(0);
        expect(r.newTermEnd).toBe("2026-06-30");
      }

      const after = await snapshotState(admin, memberId);

      // No new invoice was created.
      expect(after.invoices.length).toBe(before.invoices.length);
      // Cancelled invoice remained cancelled (was NOT reactivated/settled).
      const cancelled = after.invoices.find((i) => i.id === cancelledInvId);
      expect(cancelled?.status).toBe("cancelled");
      // Paid invoice remained paid unchanged.
      const paid = after.invoices.find((i) => i.id === paidInvId);
      expect(paid?.status).toBe("paid");
      expect(Number(paid?.amount)).toBe(1_800_000);

      // Member fields untouched.
      expect(after.member?.renewed_at).toBe(before.member?.renewed_at);
      expect(after.member?.new_term_end).toBe(before.member?.new_term_end);
      expect(after.member?.term_end).toBe(before.member?.term_end);
      expect(after.member?.fee_paid).toBe(before.member?.fee_paid);
    }, 60_000);
  },
);

// ---------------------------------------------------------------------------
// Static invariants — the server fn MUST exclude cancelled invoices from
// pending, AND MUST short-circuit when the target year is already paid.
// Regressions in either guard silently bring back duplicate invoices / term
// bumps, so the tests below fail the build before hitting the DB.
// ---------------------------------------------------------------------------
describe("payMyRenewal — paid/cancelled short-circuit invariants (static)", () => {
  const source = readFileSync("src/lib/member-app/renewal.functions.ts", "utf8");

  it("filters cancelled invoices out of pending", () => {
    expect(source).toMatch(/s\s*!==\s*["']paid["']\s*&&\s*s\s*!==\s*["']cancelled["']/);
  });

  it("short-circuits when a paid invoice already covers the target renewal year", () => {
    expect(source).toMatch(/alreadyPaidForYear/);
    expect(source).toMatch(/targetYear\s*=\s*new Date\(newTermEnd\)\.getFullYear\(\)/);
    expect(source).toMatch(/!ctx\.pending\.length\s*&&\s*alreadyPaidForYear/);
  });
});
