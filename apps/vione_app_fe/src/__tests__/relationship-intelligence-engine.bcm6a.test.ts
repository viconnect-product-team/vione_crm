// BC-Mobile-6A — Deterministic engine contract tests.
//
// Pins the frozen semantics: thresholds, recent-interaction suppression,
// dismissal expiry, missing-evidence silence, deterministic ranking, and
// edge cases (future timestamps, invalid dates, same-day). Pure module —
// no I/O anywhere.

import { describe, expect, it } from "vitest";
import {
  buildEvidence,
  daysSince,
  deriveSignals,
  isDismissed,
  latestMomentByPerson,
  rankReconnectCandidates,
  selectReconnectCandidate,
  type RelationshipDismissal,
} from "@/lib/business-connect/mobile/relationship-intelligence.engine";
import {
  RELATIONSHIP_INTELLIGENCE_CONFIG as CFG,
  type RelationshipEvidence,
} from "@/lib/business-connect/mobile/relationship-intelligence.types";

const NOW = Date.parse("2026-08-10T00:00:00.000Z");
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();
const NO_DISMISSALS: RelationshipDismissal[] = [];

function evidenceWithLast(
  days: number,
  kind: "connected" | "moment" = "connected",
): RelationshipEvidence {
  return {
    personId: "u:p1",
    kind: "connection",
    relationshipStartedAt: daysAgo(days),
    lastMeaningfulInteraction: { kind, occurredAt: daysAgo(days) },
  };
}

describe("daysSince", () => {
  it("computes whole days; same-day → 0; future clamped to 0; invalid → null", () => {
    expect(daysSince(daysAgo(46), NOW)).toBe(46);
    expect(daysSince(new Date(NOW - 3600_000).toISOString(), NOW)).toBe(0);
    expect(daysSince(new Date(NOW + 3 * 86_400_000).toISOString(), NOW)).toBe(0);
    expect(daysSince("not-a-date", NOW)).toBeNull();
  });
});

describe("selectReconnectCandidate — thresholds", () => {
  it("44 days → silent; 45 days → reconnect; large staleness → reconnect", () => {
    expect(selectReconnectCandidate(evidenceWithLast(44), NO_DISMISSALS, NOW, CFG)).toBeNull();
    const at45 = selectReconnectCandidate(evidenceWithLast(45), NO_DISMISSALS, NOW, CFG);
    expect(at45?.days).toBe(45);
    expect(selectReconnectCandidate(evidenceWithLast(180), NO_DISMISSALS, NOW, CFG)?.days).toBe(
      180,
    );
  });

  it("recent interaction (< 7 days) suppresses even above nothing else", () => {
    expect(selectReconnectCandidate(evidenceWithLast(0), NO_DISMISSALS, NOW, CFG)).toBeNull();
    expect(selectReconnectCandidate(evidenceWithLast(6), NO_DISMISSALS, NOW, CFG)).toBeNull();
  });

  it("no last meaningful interaction → NO recommendation (missing evidence)", () => {
    const ev: RelationshipEvidence = {
      personId: "u:p1",
      kind: "connection",
      relationshipStartedAt: null,
      lastMeaningfulInteraction: null,
    };
    expect(selectReconnectCandidate(ev, NO_DISMISSALS, NOW, CFG)).toBeNull();
  });

  it("active dismissal suppresses; expired dismissal re-surfaces", () => {
    const active: RelationshipDismissal[] = [
      { personId: "u:p1", recommendationType: "reconnect", dismissedUntil: daysAgo(-3) },
    ];
    expect(selectReconnectCandidate(evidenceWithLast(60), active, NOW, CFG)).toBeNull();

    const expired: RelationshipDismissal[] = [
      { personId: "u:p1", recommendationType: "reconnect", dismissedUntil: daysAgo(1) },
    ];
    expect(selectReconnectCandidate(evidenceWithLast(60), expired, NOW, CFG)).not.toBeNull();
  });

  it("dismissal for a DIFFERENT person or type does not suppress", () => {
    const other: RelationshipDismissal[] = [
      { personId: "u:other", recommendationType: "reconnect", dismissedUntil: daysAgo(-3) },
      { personId: "u:p1", recommendationType: "other_type", dismissedUntil: daysAgo(-3) },
    ];
    expect(selectReconnectCandidate(evidenceWithLast(60), other, NOW, CFG)).not.toBeNull();
  });

  it("evidence kind flows through (moment beats origin when later)", () => {
    const sel = selectReconnectCandidate(evidenceWithLast(50, "moment"), NO_DISMISSALS, NOW, CFG);
    expect(sel?.evidenceKind).toBe("moment");
  });
});

describe("rankReconnectCandidates — deterministic ordering", () => {
  it("staleness DESC, tie → personId ASC", () => {
    const ranked = rankReconnectCandidates([
      { personId: "u:b", kind: "connection", days: 50, evidenceKind: "connected" },
      { personId: "u:a", kind: "connection", days: 90, evidenceKind: "connected" },
      { personId: "u:c", kind: "connection", days: 50, evidenceKind: "connected" },
    ]);
    expect(ranked.map((r: any) => r.personId)).toEqual(["u:a", "u:b", "u:c"]);
  });

  it("same inputs ⇒ identical outputs (no randomness, no clock drift)", () => {
    const input = [
      {
        personId: "u:z",
        kind: "connection" as const,
        days: 47,
        evidenceKind: "connected" as const,
      },
      {
        personId: "u:y",
        kind: "connection" as const,
        days: 200,
        evidenceKind: "connected" as const,
      },
    ];
    expect(rankReconnectCandidates(input)).toEqual(rankReconnectCandidates(input));
  });
});

describe("buildEvidence — timestamps only", () => {
  it("last meaningful interaction = max(origin, latest moment)", () => {
    const ev = buildEvidence({
      personId: "c:card1",
      kind: "saved_card",
      startedAt: daysAgo(100),
      latestMomentAt: daysAgo(60),
    });
    expect(ev.lastMeaningfulInteraction).toEqual({ kind: "moment", occurredAt: daysAgo(60) });
    expect(deriveSignals(ev, NOW).daysSinceLastInteraction).toBe(60);
  });

  it("origin only when no moments; guest card scan provenance → card_scanned", () => {
    const ev = buildEvidence({
      personId: "g:g1",
      kind: "guest_contact",
      startedAt: daysAgo(80),
      originSource: "card_scan",
      latestMomentAt: null,
    });
    expect(ev.lastMeaningfulInteraction?.kind).toBe("card_scanned");
  });

  it("invalid timestamps are discarded; all invalid ⇒ no evidence", () => {
    const ev = buildEvidence({
      personId: "u:x",
      kind: "connection",
      startedAt: "garbage",
      latestMomentAt: "also-garbage",
    });
    expect(ev.lastMeaningfulInteraction).toBeNull();
  });

  it("no origin and no moment ⇒ lastMeaningfulInteraction null (stays silent)", () => {
    const ev = buildEvidence({
      personId: "u:x",
      kind: "connection",
      startedAt: null,
      latestMomentAt: null,
    });
    expect(ev.lastMeaningfulInteraction).toBeNull();
  });
});

describe("latestMomentByPerson", () => {
  it("keeps the newest timestamp per person; skips invalid rows", () => {
    const map = latestMomentByPerson([
      { personId: "u:a", occurredAt: daysAgo(10) },
      { personId: "u:a", occurredAt: daysAgo(3) },
      { personId: "u:a", occurredAt: "nope" },
      { personId: "u:b", occurredAt: daysAgo(20) },
    ]);
    expect(map.get("u:a")).toBe(daysAgo(3));
    expect(map.get("u:b")).toBe(daysAgo(20));
  });
});

describe("isDismissed", () => {
  it("matches only exact (person, type) with future dismissedUntil", () => {
    const d: RelationshipDismissal[] = [
      { personId: "u:a", recommendationType: "reconnect", dismissedUntil: daysAgo(-1) },
    ];
    expect(isDismissed(d, "u:a", "reconnect", NOW)).toBe(true);
    expect(isDismissed(d, "u:a", "other", NOW)).toBe(false);
    expect(isDismissed(d, "u:b", "reconnect", NOW)).toBe(false);
  });
});
