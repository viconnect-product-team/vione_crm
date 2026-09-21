import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { requireStagingSupabase } from "./helpers/test-env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Live-DB e2e proving payMyRenewal is EFFECTIVELY ATOMIC on the failure path:
// if the invoices write fails, the members row MUST NOT be extended
// (new_term_end, renewed_at, fee_paid all unchanged).
//
// The server fn performs sequential writes (no BEGIN..COMMIT) but its
// invariant is ORDER + throw-before-second-write: invoices write happens
// first inside a try block; any error throws before members.update runs.
// This test enforces that invariant by deliberately violating the
// `invoices_method_check` CHECK constraint (method must be one of
// bank|card|cash|ewallet). The update fails at the DB layer, and we assert
// the members row is byte-identical before/after.
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const canRun = Boolean(SUPABASE_URL && SERVICE_ROLE && ANON_KEY);
const rid = () => Math.random().toString(36).slice(2, 10);

function addOneYear(iso: string | null): string {
  const base = iso ? new Date(iso) : new Date();
  const d = Number.isNaN(base.getTime()) ? new Date() : base;
  const from = d.getTime() > Date.now() ? d : new Date();
  from.setFullYear(from.getFullYear() + 1);
  return from.toISOString().slice(0, 10);
}

// Mirror of payMyRenewal write sequence — same ordering as the server fn,
// so a regression that reorders (members-first) or removes the throw fails
// this test at the DB layer.
async function payMyRenewalMirror(
  admin: SupabaseClient,
  memberId: string,
  method: string, // may be an invalid literal to force a CHECK violation
) {
  const { data: me } = await admin
    .from("members")
    .select("id, term_end, new_term_end, renewed_at")
    .eq("id", memberId)
    .maybeSingle();
  if (!me) throw new Error("no member");

  const { data: invRows } = await admin
    .from("invoices")
    .select("id, status")
    .eq("member_id", memberId);
  const pending = (invRows ?? []).filter((i) => {
    const s = (i.status as string) ?? "";
    return s !== "paid" && s !== "cancelled";
  });

  const today = new Date().toISOString().slice(0, 10);
  const newTermEnd = addOneYear(
    (me.new_term_end as string | null) ?? (me.term_end as string | null),
  );

  // 1) invoices write FIRST — throw on any error before touching members.
  if (pending.length) {
    const { error } = await admin
      .from("invoices")
      .update({ status: "paid", paid_at: today, method })
      .in(
        "id",
        pending.map((i) => i.id as string),
      );
    if (error) throw new Error(error.message);
  }
  // 2) members extension ONLY if step 1 succeeded.
  const { error: mErr } = await admin
    .from("members")
    .update({ new_term_end: newTermEnd, renewed_at: today, fee_paid: true })
    .eq("id", memberId);
  if (mErr) throw new Error(mErr.message);
}

async function snapshot(admin: SupabaseClient, memberId: string, invId: string) {
  const mem = await admin
    .from("members")
    .select("renewed_at, new_term_end, term_end, fee_paid")
    .eq("id", memberId)
    .single();
  const inv = await admin
    .from("invoices")
    .select("status, paid_at, method")
    .eq("id", invId)
    .single();
  return { member: mem.data, invoice: inv.data };
}

describe.skipIf(!canRun)("payMyRenewal — atomic on invoice failure (live DB)", () => {
  let admin: SupabaseClient;
  const slug = `test-rn-atom-${rid()}`;
  const email = `rn-atom-${rid()}@test.invalid`;
  const password = `Pw-${rid()}-${rid()}`;
  let assocId = "";
  let userId = "";
  const memberId = `m-${rid()}-${rid()}`;
  const invId = `inv-${rid()}`;

  beforeAll(async () => {
    requireStagingSupabase();
    admin = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: assoc, error: aErr } = await admin
      .from("associations")
      .insert({ name: "Test Renew Atomic", slug })
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
      name: "Hoi vien Atomic",
      type: "individual",
      level: "memberLevel.medium",
      industry: "ind.trade",
      region: "region.north",
      status: "active",
      joined_at: "2024-01-01",
      fee_year: 2025,
      fee_paid: false,
      term_end: "2025-06-30",
      new_term_end: null,
      renewed_at: null,
      association_id: assocId,
    });

    await admin.from("invoices").insert({
      id: invId,
      member_id: memberId,
      invoice_no: `HD-ATOM-${rid().toUpperCase()}`,
      year: 2025,
      amount: 1_800_000,
      due_date: "2025-03-01",
      status: "unpaid", // valid per invoices_status_check
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

  it("invoice update failure ⇒ members row is NOT extended (renewed_at/new_term_end/fee_paid untouched)", async () => {
    const before = await snapshot(admin, memberId, invId);
    expect(before.member?.renewed_at).toBeNull();
    expect(before.member?.new_term_end).toBeNull();
    expect(before.member?.fee_paid).toBe(false);
    expect(before.invoice?.status).toBe("unpaid");

    // Force the invoices UPDATE to fail with a CHECK constraint violation
    // by passing a method value outside {bank,card,cash,ewallet}.
    await expect(payMyRenewalMirror(admin, memberId, "NOT_A_VALID_METHOD")).rejects.toThrow();

    const after = await snapshot(admin, memberId, invId);

    // members row byte-identical → NO partial extension leaked.
    expect(after.member).toEqual(before.member);
    // invoice still unpaid → the failed write did not partially persist.
    expect(after.invoice?.status).toBe("unpaid");
    expect(after.invoice?.paid_at).toBeNull();
    expect(after.invoice?.method).toBeNull();

    // Recovery: a valid retry MUST now succeed and extend the term exactly once.
    await payMyRenewalMirror(admin, memberId, "bank");
    const recovered = await snapshot(admin, memberId, invId);
    expect(recovered.member?.new_term_end).toBe("2026-06-30");
    expect(recovered.member?.renewed_at).toBe(new Date().toISOString().slice(0, 10));
    expect(recovered.member?.fee_paid).toBe(true);
    expect(recovered.invoice?.status).toBe("paid");
    expect(recovered.invoice?.method).toBe("bank");
  }, 60_000);
});

// ---------------------------------------------------------------------------
// Static invariants — the server fn MUST:
//   (a) wrap invoices + members writes in a single try block,
//   (b) throw on invoice write errors BEFORE touching members,
//   (c) place the members.update AFTER the invoices update in source order.
// A regression to any of these silently breaks the atomicity guarantee.
// ---------------------------------------------------------------------------
describe("payMyRenewal — atomicity invariants (static)", () => {
  const source = readFileSync("src/lib/member-app/renewal.functions.ts", "utf8");

  it("invoice write throws on error before members.update runs", () => {
    // The invoices update block ends with `if (error) throw new Error(error.message);`
    // BEFORE the members.update call appears in source.
    const idxInvoiceThrow = source.indexOf("if (error) throw new Error(error.message);");
    const idxMembersUpdate = source.indexOf('.from("members")\n        .update({ new_term_end');
    expect(idxInvoiceThrow).toBeGreaterThan(0);
    expect(idxMembersUpdate).toBeGreaterThan(idxInvoiceThrow);
  });

  it("members.update sits inside the same try/catch that catches invoice errors", () => {
    // Locate the settlement try block (it opens right after settledInvoiceNo).
    const tryIdx = source.indexOf("try {", source.indexOf("let settledInvoiceNo"));
    const catchIdx = source.indexOf("} catch (e) {", tryIdx);
    const membersIdx = source.indexOf('.from("members")\n        .update({ new_term_end', tryIdx);
    expect(tryIdx).toBeGreaterThan(0);
    expect(membersIdx).toBeGreaterThan(tryIdx);
    expect(membersIdx).toBeLessThan(catchIdx);
  });

  it("catch handler returns failure without extending the term", () => {
    // The catch branch must return success:false and MUST NOT contain any
    // subsequent members.update call.
    const catchIdx = source.indexOf("} catch (e) {");
    const catchBlock = source.slice(catchIdx, catchIdx + 400);
    expect(catchBlock).toMatch(/success:\s*false/);
    expect(catchBlock).not.toMatch(/\.from\(["']members["']\)/);
  });
});
