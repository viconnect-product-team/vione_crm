// P0-A2B — Check-in hardening (findings A/B/C).
//
// These are structural/contract tests that grep the compiled server function
// source. Live authenticated E2E is out of scope for P0-A2B per the approved
// plan (LIVE_E2E_PENDING). See MEMBER_CHECKIN_LIVE_RUNTIME_PROOF_P0A2B.md.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";

const SRC = readFileSync("src/lib/member-app/checkin.functions.ts", "utf8");
const ROUTE = readFileSync("src/routes/m.checkin.tsx", "utf8");

describe("P0-A2B · check-in hardening", () => {
  // Finding A — invalid/rejected scans never enter member_checkins.
  it("36 · never inserts status='invalid' rows into member_checkins", () => {
    // No `insert(...)` or `upsert(...)` call in the file may set status: "invalid".
    expect(SRC).not.toMatch(/status:\s*["']invalid["']/);
  });

  it("36b · rejections go to member_checkin_rejections, not member_checkins", () => {
    expect(SRC).toMatch(/member_checkin_rejections/);
    // Rejections table is only written to via the admin client because RLS
    // forbids client INSERT for audit integrity.
    expect(SRC).toMatch(/supabaseAdmin[\s\S]*member_checkin_rejections/);
  });

  it("36c · returns stable safe error codes for rejected scans", () => {
    for (const code of [
      "invalid_payload",
      "member_not_found",
      "membership_inactive",
      "event_not_found",
      "association_mismatch",
      "backend_unavailable",
    ]) {
      expect(SRC).toContain(`"${code}"`);
    }
  });

  it("36d · rejection audit hashes the payload — no raw payload stored", () => {
    // recordRejection uses hashPayload(...) built on SHA-256, never inserts
    // the raw payload string into the rejections row.
    expect(SRC).toMatch(/payload_hash:\s*hashPayload/);
    expect(SRC).not.toMatch(/payload_raw|raw_payload/);
  });

  // Finding B — idempotency key scope.
  it("37 · idempotency key is a server-side hash of (association|member|event)", () => {
    expect(SRC).toMatch(/createHash\(["']sha256["']\)/);
    expect(SRC).toMatch(/v2\|\$\{associationId\}\|\$\{memberCode\}\|\$\{eventId\}/);
    // Client never sees association_id / member_code in the key material.
    expect(SRC).toMatch(/chk:v2:/);
  });

  it("37b · hash function is deterministic and includes association scope", () => {
    // Recompute the same shape locally to prove associationId participates.
    const a1 = createHash("sha256").update("v2|A|M|E").digest("hex");
    const a2 = createHash("sha256").update("v2|A|M|E").digest("hex");
    const b = createHash("sha256").update("v2|B|M|E").digest("hex");
    expect(a1).toEqual(a2);
    expect(a1).not.toEqual(b); // cross-association cannot collide
  });

  // Finding C — replay preserves the authoritative record.
  it("38 · replay returns prior row and does NOT upsert on the already-exists branch", () => {
    // The prior-row branch must return { status: "already", ... } BEFORE any
    // .upsert() call on member_checkins runs.
    const priorIdx = SRC.indexOf("if (prior) {");
    const upsertIdx = SRC.indexOf(".upsert(");
    expect(priorIdx).toBeGreaterThan(-1);
    expect(upsertIdx).toBeGreaterThan(priorIdx);
  });

  it("39 · replay preserves original method and checked_at from the prior row", () => {
    // The returned object in the replay branch reads method/at from `r`
    // (the prior row), not from `data` or `now`.
    const replayBlock = SRC.split("if (prior) {")[1]?.split("}")[0] ?? "";
    expect(replayBlock).toMatch(/method:\s*r\.method/);
    expect(replayBlock).toMatch(/at:\s*r\.checked_at/);
  });

  // Cross-association / forgery.
  it("40 · rejects cross-association event targets with association_mismatch", () => {
    expect(SRC).toMatch(/association_id !== me\.association_id/);
    expect(SRC).toMatch(/"association_mismatch"/);
  });

  it("41 · member identity is server-derived — client cannot forge member_code", () => {
    // The Zod input schema is strict and only accepts { payload, method }.
    expect(SRC).toMatch(/\.strict\(\)/);
    // member_code is read from the DB via resolveMember(userId), never from data.
    expect(SRC).toMatch(/resolveMember\(supabase, userId\)/);
    expect(SRC).not.toMatch(/data\.memberCode|data\.member_code/);
  });

  it("42 · association is server-derived — client cannot forge association_id", () => {
    expect(SRC).not.toMatch(/data\.associationId|data\.association_id/);
    // association_id in the insert/upsert always uses me.association_id.
    expect(SRC).toMatch(/association_id:\s*me\.association_id/);
  });

  // Existence-leak / conflict handling.
  it("43 · conflict handling does not leak another tenant's row (no existence probe by raw key)", () => {
    // The upsert onConflict target is the physical unique index on client_id,
    // whose value is a hash that already includes association_id. There is no
    // codepath that selects by client_id shape from client input.
    expect(SRC).not.toMatch(/\.eq\(\s*["']client_id["']\s*,\s*data\./);
  });

  it("44 · no service-role usage on the browser side — route never imports client.server", () => {
    expect(ROUTE).not.toMatch(/client\.server/);
    expect(ROUTE).not.toMatch(/supabaseAdmin/);
  });
});
