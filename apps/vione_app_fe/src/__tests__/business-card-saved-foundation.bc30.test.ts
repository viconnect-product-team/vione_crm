// BC-3.0 — Saved Business Cards foundation contracts (deterministic, no DB).

import { describe, it, expect } from "vitest";
import {
  ACCEPTED_SAVED_CARD_SOURCES,
  CANONICAL_SAVED_CARD_SOURCES,
  SAVED_CARD_TAG_ERR,
  availabilityOf,
  normalizeSavedCardSource,
  normalizeTagName,
} from "@/lib/business-card/saved-card.contracts";

describe("BC-3.0 source contract", () => {
  it("canonical sources are all accepted", () => {
    for (const s of CANONICAL_SAVED_CARD_SOURCES) {
      expect(ACCEPTED_SAVED_CARD_SOURCES).toContain(s);
    }
  });

  it("keeps legacy sources valid for back-compat", () => {
    for (const legacy of ["profile", "url", "import"]) {
      expect(ACCEPTED_SAVED_CARD_SOURCES).toContain(legacy);
    }
  });

  it("coerces unknown/empty input to 'unknown'", () => {
    expect(normalizeSavedCardSource("QR")).toBe("qr");
    expect(normalizeSavedCardSource("  nfc ")).toBe("nfc");
    expect(normalizeSavedCardSource("something-else")).toBe("unknown");
    expect(normalizeSavedCardSource(null)).toBe("unknown");
    expect(normalizeSavedCardSource(42)).toBe("unknown");
  });
});

describe("BC-3.0 availability contract", () => {
  it("reports available/unavailable from the live target", () => {
    expect(availabilityOf({ unavailable: false })).toBe("available");
    expect(availabilityOf({ unavailable: true })).toBe("unavailable");
  });
});

describe("BC-3.0 tag normalization", () => {
  it("lowercases, collapses whitespace and trims to 60 chars", () => {
    expect(normalizeTagName("  Key   Account  ")).toBe("key account");
    expect(normalizeTagName("ĐỐI TÁC")).toBe("đối tác");
    expect(normalizeTagName("x".repeat(80))).toHaveLength(60);
  });

  it("exposes a stable error contract", () => {
    expect(SAVED_CARD_TAG_ERR.INVALID_NAME).toBe("SC_TAG_INVALID_NAME");
    expect(SAVED_CARD_TAG_ERR.DUPLICATE).toBe("SC_TAG_DUPLICATE");
    expect(SAVED_CARD_TAG_ERR.NOT_FOUND).toBe("SC_TAG_NOT_FOUND");
  });
});
