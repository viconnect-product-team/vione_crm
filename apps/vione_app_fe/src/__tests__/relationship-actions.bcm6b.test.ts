// BC-Mobile-6B — Deterministic action availability resolver + structural
// no-autonomy / no-LLM gates.
//
// Pins: reconnect policy order; availability derives ONLY from the current
// authorized person DTO; malformed/hostile contact values never produce
// hrefs; unknown recommendation types and null persons fail closed; the
// recommendation payload is never an action authority; and no 6B module
// imports LLM or mutation machinery (static source scan).

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveRelationshipActions } from "@/lib/business-connect/mobile/relationship-actions";
import type { BcMobilePersonDetail } from "@/hooks/use-business-connect-person";

function person(overrides: Partial<BcMobilePersonDetail> = {}): BcMobilePersonDetail {
  return {
    personId: "u:123e4567-e89b-42d3-a456-426614174000",
    kind: "connection",
    displayName: "Minh Tran",
    avatarUrl: null,
    headline: "CEO",
    companyName: "Acme",
    primaryCardSlug: null,
    relationship: { kind: "connected", connectedAt: null, requestedByViewer: null },
    contact: {
      phone: "+84 901 234 567",
      phoneHref: "tel:+84901234567",
      email: "minh@example.com",
      emailHref: "mailto:minh@example.com",
      websiteLabel: null,
      websiteHref: null,
      social: [],
    },
    ...overrides,
  };
}

describe("BC-Mobile-6B — resolveRelationshipActions", () => {
  it("reconnect + full contact → call, email, save_meeting_moment (deterministic order)", () => {
    const a = resolveRelationshipActions(person(), "reconnect");
    expect(a.actions.map((x: any) => x.kind)).toEqual(["call", "email", "save_meeting_moment", "create_follow_up", "schedule_meeting"]);
    expect(a.actions[0].destination).toBe("tel:+84901234567");
    expect(a.actions[1].destination).toBe("mailto:minh@example.com");
    expect(a.actions[2].destination).toBeNull();
  });

  it("missing phone omits call; missing email omits email — never disabled rows", () => {
    const p = person({
      contact: {
        phone: null,
        phoneHref: null,
        email: null,
        emailHref: null,
        websiteLabel: null,
        websiteHref: null,
        social: [],
      },
    });
    const a = resolveRelationshipActions(p, "reconnect");
    expect(a.actions.map((x: any) => x.kind)).toEqual(["save_meeting_moment", "create_follow_up", "schedule_meeting"]);
  });

  it("malformed/hostile phone values never produce a href", () => {
    for (const bad of [
      "javascript:alert(1)",
      "data:text/html,<script>1</script>",
      "call me maybe",
      "12", // too short
      "1234567890123456789012345", // too long
    ]) {
      const p = person({
        contact: {
          phone: bad,
          phoneHref: `tel:${bad}`,
          email: null,
          emailHref: null,
          websiteLabel: null,
          websiteHref: null,
          social: [],
        },
      });
      const kinds = resolveRelationshipActions(p, "reconnect").actions.map((x: any) => x.kind);
      expect(kinds).not.toContain("call");
    }
  });

  it("header-injection emails never produce a href", () => {
    for (const bad of [
      "a@b.com?subject=x",
      "a@b.com&cc=evil@x.com",
      "a@b.com\nBcc:evil@x.com",
      "not-an-email",
    ]) {
      const p = person({
        contact: {
          phone: null,
          phoneHref: null,
          email: bad,
          emailHref: `mailto:${bad}`,
          websiteLabel: null,
          websiteHref: null,
          social: [],
        },
      });
      const kinds = resolveRelationshipActions(p, "reconnect").actions.map((x: any) => x.kind);
      expect(kinds).not.toContain("email");
    }
  });

  it("destinations are rebuilt from the DTO raw value, never trusted from stored hrefs", () => {
    const p = person({
      contact: {
        phone: "0901 234 567",
        phoneHref: "javascript:alert(1)", // hostile stored href must be ignored
        email: "minh@example.com",
        emailHref: "data:text/html,x",
        websiteLabel: null,
        websiteHref: null,
        social: [],
      },
    });
    const a = resolveRelationshipActions(p, "reconnect");
    expect(a.actions.find((x) => x.kind === "call")?.destination).toBe("tel:0901234567");
    expect(a.actions.find((x) => x.kind === "email")?.destination).toBe("mailto:minh@example.com");
  });

  it("unknown/future recommendation types fail safe to zero actions", () => {
    expect(resolveRelationshipActions(person(), "schedule_meeting").actions).toEqual([]);
    expect(resolveRelationshipActions(person(), "create_follow_up").actions).toEqual([]);
    expect(resolveRelationshipActions(person(), "something_new").actions).toEqual([]);
  });

  it("null person (unavailable/blocked/error) fails closed to zero actions", () => {
    const a = resolveRelationshipActions(null, "reconnect");
    expect(a.actions).toEqual([]);
  });

  it("works identically for c: (saved card) and g: (guest contact) persons", () => {
    for (const [personId, kind, relationship] of [
      [
        "c:123e4567-e89b-42d3-a456-426614174000",
        "saved_card",
        { kind: "saved", savedAt: null, favorite: false },
      ],
      [
        "g:123e4567-e89b-42d3-a456-426614174000",
        "guest_contact",
        { kind: "guest", sharedAt: null, source: null },
      ],
    ] as const) {
      const a = resolveRelationshipActions(person({ personId, kind, relationship }), "reconnect");
      expect(a.actions.map((x: any) => x.kind)).toEqual(["call", "email", "save_meeting_moment", "create_follow_up", "schedule_meeting"]);
    }
  });
});

// ── Structural gates: no autonomous execution, no new LLM surface ────────────

const MOBILE_DIR = join(__dirname, "..", "lib", "business-connect", "mobile");
const SHEET = join(
  __dirname,
  "..",
  "components",
  "business-connect",
  "mobile",
  "RelationshipActionSheet.tsx",
);

const SIX_A_MODULES = [
  "relationship-intelligence.engine.ts",
  "relationship-intelligence.service.ts",
  "relationship-intelligence.server.ts",
  "relationship-intelligence.functions.ts",
  "relationship-intelligence.sdk.ts",
  "relationship-actions.ts",
];

const FORBIDDEN_MUTATION_IMPORTS = [
  /createMeetingFollowUpFn/,
  /createMeetingDraftFn/,
  /business-meetings\.functions/,
  /meeting\/follow-up/,
  /moment\.functions/,
  /sendEmail|send_email|sendNotification/,
];

describe("BC-Mobile-6B — no-autonomy / no-LLM static gates", () => {
  it("intelligence + action modules never import mutation/creation machinery", () => {
    for (const file of SIX_A_MODULES) {
      const src = readFileSync(join(MOBILE_DIR, file), "utf8");
      for (const pattern of FORBIDDEN_MUTATION_IMPORTS) {
        expect(src, `${file} must not reference ${pattern}`).not.toMatch(pattern);
      }
    }
    const sheetSrc = readFileSync(SHEET, "utf8");
    for (const pattern of FORBIDDEN_MUTATION_IMPORTS) {
      expect(sheetSrc, `RelationshipActionSheet must not reference ${pattern}`).not.toMatch(
        pattern,
      );
    }
  });

  it("6B action layer introduces ZERO new LLM surface", () => {
    const actionSrc = readFileSync(join(MOBILE_DIR, "relationship-actions.ts"), "utf8");
    const sheetSrc = readFileSync(SHEET, "utf8");
    const llmPatterns = [/ai\.server/, /ai-gateway/, /generateRelationshipWording/, /lovable\.ai/];
    for (const pattern of llmPatterns) {
      expect(actionSrc).not.toMatch(pattern);
      expect(sheetSrc).not.toMatch(pattern);
    }
  });
});
