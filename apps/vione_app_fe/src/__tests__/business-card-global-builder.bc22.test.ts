import { describe, it, expect } from "vitest";
import {
  validateCardForPublish,
  isPublishable,
  type PublishValidationInput,
} from "@/lib/business-card/publish-validation";

// ---------------------------------------------------------------------------
// BC-2.2 — Global Business Card Builder: publish validation contract.
// Pure, deterministic. Verifies the invariants a global (platform-user) card
// must satisfy before publishing — and, crucially, that NO membership concern
// (member code, association, membership level, identity pass) is required.
// ---------------------------------------------------------------------------

const complete: PublishValidationInput = {
  displayName: "Nguyen An",
  professionalTitle: "CEO",
  slug: "nguyen-an-ab12cd",
  status: "draft",
  workEmail: "an@example.com",
  publicMode: "public",
  visibilitySettings: {
    showContact: true,
    showSocial: true,
    showServices: true,
    showNeeds: true,
  },
  accountActive: true,
};

describe("validateCardForPublish", () => {
  it("passes a complete global card", () => {
    expect(validateCardForPublish(complete)).toEqual([]);
    expect(isPublishable(complete)).toBe(true);
  });

  it("requires a display name", () => {
    const issues = validateCardForPublish({ ...complete, displayName: "  " });
    expect(issues.map((i) => i.code)).toContain("DISPLAY_NAME");
  });

  it("requires a title or headline (either satisfies)", () => {
    const noneCase = validateCardForPublish({
      ...complete,
      professionalTitle: null,
      headline: null,
    });
    expect(noneCase.map((i) => i.code)).toContain("TITLE_OR_HEADLINE");

    const headlineOnly = validateCardForPublish({
      ...complete,
      professionalTitle: null,
      headline: "Building things",
    });
    expect(headlineOnly.map((i) => i.code)).not.toContain("TITLE_OR_HEADLINE");
  });

  it("rejects an invalid slug", () => {
    expect(validateCardForPublish({ ...complete, slug: "Bad Slug!" }).map((i) => i.code)).toContain(
      "SLUG",
    );
    expect(validateCardForPublish({ ...complete, slug: "a" }).map((i) => i.code)).toContain("SLUG");
  });

  it("requires at least one enabled CTA", () => {
    // Contact hidden AND no social => no CTA.
    const issues = validateCardForPublish({
      ...complete,
      workEmail: null,
      workPhone: null,
      website: null,
      visibilitySettings: {
        showContact: false,
        showSocial: true,
        showServices: true,
        showNeeds: true,
      },
    });
    expect(issues.map((i) => i.code)).toContain("CTA");
  });

  it("counts a visible social link as a CTA", () => {
    const issues = validateCardForPublish({
      ...complete,
      workEmail: null,
      workPhone: null,
      website: null,
      linkedinUrl: "https://linkedin.com/in/an",
      visibilitySettings: {
        showContact: false,
        showSocial: true,
        showServices: true,
        showNeeds: true,
      },
    });
    expect(issues.map((i) => i.code)).not.toContain("CTA");
  });

  it("does not count a CTA when its section is hidden", () => {
    const issues = validateCardForPublish({
      ...complete,
      visibilitySettings: {
        showContact: false, // email present but hidden
        showSocial: false,
        showServices: true,
        showNeeds: true,
      },
    });
    expect(issues.map((i) => i.code)).toContain("CTA");
  });

  it("rejects an invalid public mode", () => {
    expect(
      validateCardForPublish({ ...complete, publicMode: "everyone" }).map((i) => i.code),
    ).toContain("VISIBILITY");
  });

  it("flags malformed URLs", () => {
    expect(
      validateCardForPublish({ ...complete, website: "not a url" }).map((i) => i.code),
    ).toContain("CONTACT_URL");
    expect(
      validateCardForPublish({ ...complete, website: "example.com" }).map((i) => i.code),
    ).not.toContain("CONTACT_URL");
  });

  it("blocks publishing for an inactive account", () => {
    expect(
      validateCardForPublish({ ...complete, accountActive: false }).map((i) => i.code),
    ).toContain("ACCOUNT_INACTIVE");
  });

  it("blocks publishing for an administratively locked card", () => {
    expect(
      validateCardForPublish({ ...complete, status: "suspended" }).map((i) => i.code),
    ).toContain("CARD_LOCKED");
    expect(
      validateCardForPublish({ ...complete, status: "rejected" }).map((i) => i.code),
    ).toContain("CARD_LOCKED");
  });

  it("does NOT require any membership concern (no member/association/level/pass)", () => {
    // A fully global card with zero membership context is publishable.
    const globalOnly: PublishValidationInput = {
      displayName: "Solo Founder",
      headline: "Independent consultant",
      slug: "solo-founder-9xk2",
      status: "draft",
      workPhone: "+84 900 000 000",
      publicMode: "public",
      visibilitySettings: {
        showContact: true,
        showSocial: false,
        showServices: false,
        showNeeds: false,
      },
      accountActive: true,
    };
    expect(validateCardForPublish(globalOnly)).toEqual([]);
  });
});
