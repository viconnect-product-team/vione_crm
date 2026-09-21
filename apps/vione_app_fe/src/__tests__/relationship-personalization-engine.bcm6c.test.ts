// BC-Mobile-6C — Relationship Personalization engine contract.
//
// Pins: explicit cadence always wins; adaptive cadence only shifts QUIETER
// on a high dismiss ratio; learning off = pure defaults; adaptive action
// preference from recent contact selections only; reordering invariants
// (moment last, pure permutation); and the no-inference guarantee.
//
// Run: bunx vitest run src/__tests__/relationship-personalization-engine.bcm6c.test.ts

import { describe, expect, it } from "vitest";
import {
  derivePersonalizationProfile,
  orderRelationshipActions,
} from "@/lib/business-connect/mobile/relationship-personalization.engine";
import {
  DEFAULT_RELATIONSHIP_INTEL_PREFERENCES,
  RELATIONSHIP_PERSONALIZATION_CONFIG,
  type RelationshipIntelInteraction,
  type RelationshipIntelInteractionKind,
  type RelationshipIntelPreferencesDTO,
} from "@/lib/business-connect/mobile/relationship-personalization.types";
import type { RelationshipActionItem } from "@/lib/business-connect/mobile/relationship-actions";

const CONFIG = RELATIONSHIP_PERSONALIZATION_CONFIG;
const NOW = Date.parse("2026-03-10T09:00:00Z");
const DAY = 86_400_000;

function prefs(
  over: Partial<RelationshipIntelPreferencesDTO> = {},
): RelationshipIntelPreferencesDTO {
  return { ...DEFAULT_RELATIONSHIP_INTEL_PREFERENCES, ...over };
}

function interaction(
  kind: RelationshipIntelInteractionKind,
  daysAgo: number,
  recommendationType: "reconnect" | null = "reconnect",
): RelationshipIntelInteraction {
  return {
    kind,
    recommendationType,
    occurredAt: new Date(NOW - daysAgo * DAY).toISOString(),
  };
}

describe("derivePersonalizationProfile — cadence", () => {
  it("explicit cadence always wins (learning on, dismiss-heavy behavior)", () => {
    const acts = Array.from({ length: 8 }, (_, i) =>
      interaction("recommendation_dismissed", i + 1),
    );
    const p = derivePersonalizationProfile(
      prefs({ reconnectCadence: "less_often" }),
      acts,
      NOW,
      CONFIG,
    );
    expect(p.reconnectThresholdDays).toBe(60);
    expect(p.cadenceSource).toBe("explicit");
  });

  it("explicit more_often → 30 / normal → 45", () => {
    expect(
      derivePersonalizationProfile(prefs({ reconnectCadence: "more_often" }), [], NOW, CONFIG)
        .reconnectThresholdDays,
    ).toBe(30);
    expect(
      derivePersonalizationProfile(prefs({ reconnectCadence: "normal" }), [], NOW, CONFIG)
        .reconnectThresholdDays,
    ).toBe(45);
  });

  it("auto + learning off → default 45, source default", () => {
    const acts = Array.from({ length: 8 }, (_, i) =>
      interaction("recommendation_dismissed", i + 1),
    );
    const p = derivePersonalizationProfile(
      prefs({ behavioralAdaptationEnabled: false }),
      acts,
      NOW,
      CONFIG,
    );
    expect(p).toMatchObject({ reconnectThresholdDays: 45, cadenceSource: "default" });
  });

  it("auto + dismiss ratio ≥ 0.8 (≥5 outcomes) → shifts quieter to 60", () => {
    const acts = [
      ...Array.from({ length: 5 }, (_, i) => interaction("recommendation_dismissed", i + 1)),
      interaction("recommendation_opened", 6),
    ];
    const p = derivePersonalizationProfile(prefs(), acts, NOW, CONFIG);
    expect(p).toMatchObject({ reconnectThresholdDays: 60, cadenceSource: "adaptive" });
  });

  it("auto + mostly opened → stays 45 (never shifts louder)", () => {
    const acts = [
      ...Array.from({ length: 5 }, (_, i) => interaction("recommendation_opened", i + 1)),
      interaction("recommendation_dismissed", 6),
    ];
    const p = derivePersonalizationProfile(prefs(), acts, NOW, CONFIG);
    expect(p).toMatchObject({ reconnectThresholdDays: 45, cadenceSource: "default" });
  });

  it("auto + fewer than 5 outcomes → default", () => {
    const acts = Array.from({ length: 4 }, (_, i) =>
      interaction("recommendation_dismissed", i + 1),
    );
    const p = derivePersonalizationProfile(prefs(), acts, NOW, CONFIG);
    expect(p.cadenceSource).toBe("default");
  });

  it("events outside the 90-day window are ignored", () => {
    const acts = Array.from({ length: 8 }, () => interaction("recommendation_dismissed", 100));
    const p = derivePersonalizationProfile(prefs(), acts, NOW, CONFIG);
    expect(p.cadenceSource).toBe("default");
  });

  it("non-reconnect events never influence cadence", () => {
    const acts = Array.from({ length: 8 }, (_, i) =>
      interaction("recommendation_dismissed", i + 1, null),
    );
    const p = derivePersonalizationProfile(prefs(), acts, NOW, CONFIG);
    expect(p.cadenceSource).toBe("default");
  });
});

describe("derivePersonalizationProfile — preferred action", () => {
  it("adaptive: ≥70% calls among recent contact selections → call", () => {
    const acts = [
      ...Array.from({ length: 4 }, (_, i) => interaction("action_call_selected", i + 1)),
      interaction("action_email_selected", 5),
    ];
    const p = derivePersonalizationProfile(prefs(), acts, NOW, CONFIG);
    expect(p).toMatchObject({ preferredAction: "call", actionSource: "adaptive" });
  });

  it("adaptive: ≥70% emails → email", () => {
    const acts = [
      ...Array.from({ length: 5 }, (_, i) => interaction("action_email_selected", i + 1)),
    ];
    const p = derivePersonalizationProfile(prefs(), acts, NOW, CONFIG);
    expect(p).toMatchObject({ preferredAction: "email", actionSource: "adaptive" });
  });

  it("explicit email is never overridden by call-heavy behavior", () => {
    const acts = Array.from({ length: 8 }, (_, i) => interaction("action_call_selected", i + 1));
    const p = derivePersonalizationProfile(
      prefs({ preferredContactAction: "email" }),
      acts,
      NOW,
      CONFIG,
    );
    expect(p).toMatchObject({ preferredAction: "email", actionSource: "explicit" });
  });

  it("learning off + auto → null", () => {
    const acts = Array.from({ length: 8 }, (_, i) => interaction("action_call_selected", i + 1));
    const p = derivePersonalizationProfile(
      prefs({ behavioralAdaptationEnabled: false }),
      acts,
      NOW,
      CONFIG,
    );
    expect(p).toMatchObject({ preferredAction: null, actionSource: "default" });
  });

  it("fewer than 5 contact selections → null", () => {
    const acts = Array.from({ length: 4 }, (_, i) => interaction("action_call_selected", i + 1));
    const p = derivePersonalizationProfile(prefs(), acts, NOW, CONFIG);
    expect(p.preferredAction).toBeNull();
  });

  it("moment and person-open selections NEVER influence contact ordering preference", () => {
    const acts = [
      ...Array.from({ length: 10 }, (_, i) => interaction("action_moment_selected", i + 1)),
      ...Array.from({ length: 10 }, (_, i) => interaction("action_person_opened", i + 1)),
    ];
    const p = derivePersonalizationProfile(prefs(), acts, NOW, CONFIG);
    expect(p.preferredAction).toBeNull();
  });
});

describe("orderRelationshipActions", () => {
  const call: RelationshipActionItem = { kind: "call", destination: "tel:+84900000001" };
  const email: RelationshipActionItem = { kind: "email", destination: "mailto:a@example.com" };
  const moment: RelationshipActionItem = { kind: "save_meeting_moment", destination: null };

  it("empty / single → unchanged", () => {
    expect(orderRelationshipActions([], null)).toEqual([]);
    expect(orderRelationshipActions([call], "email")).toEqual([call]);
  });

  it("null preference → resolved order preserved, moment moved last", () => {
    expect(orderRelationshipActions([moment, email, call], null)).toEqual([email, call, moment]);
    expect(orderRelationshipActions([moment, call, email], null)).toEqual([call, email, moment]);
  });

  it("preferred call → [call, email, moment]; preferred email → [email, call, moment]", () => {
    expect(orderRelationshipActions([moment, email, call], "call").map((a: any) => a.kind)).toEqual([
      "call",
      "email",
      "save_meeting_moment",
    ]);
    expect(orderRelationshipActions([moment, call, email], "email").map((a: any) => a.kind)).toEqual([
      "email",
      "call",
      "save_meeting_moment",
    ]);
  });

  it("pure permutation, input not mutated", () => {
    const input = [moment, email, call];
    const out = orderRelationshipActions(input, "email");
    expect(out.map((a: any) => a.kind).sort()).toEqual(input.map((a: any) => a.kind).sort());
    expect(input.map((a: any) => a.kind)).toEqual(["save_meeting_moment", "email", "call"]);
  });

  it("only one contact available → it leads regardless of preference", () => {
    expect(orderRelationshipActions([moment, email], "call").map((a: any) => a.kind)).toEqual([
      "email",
      "save_meeting_moment",
    ]);
  });
});

describe("no-inference guarantee", () => {
  it("interaction DTO exposes only coarse fields (no person/content keys)", () => {
    const sample = interaction("action_call_selected", 1);
    expect(Object.keys(sample).sort()).toEqual(["kind", "occurredAt", "recommendationType"].sort());
  });

  it("same inputs ⇒ same outputs (deterministic)", () => {
    const acts = [
      interaction("recommendation_dismissed", 2),
      interaction("action_call_selected", 3),
    ];
    const a = derivePersonalizationProfile(prefs(), acts, NOW, CONFIG);
    const b = derivePersonalizationProfile(prefs(), acts, NOW, CONFIG);
    expect(a).toEqual(b);
  });
});
