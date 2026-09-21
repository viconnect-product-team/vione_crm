import { describe, it, expect } from "vitest";
import { parseReviewSearch, reviewSearchSchema, validateReviewSearchStrict } from "./review-search";

// Lenient path: used by the route's validateSearch so shared links and
// back/forward navigation always resolve to a valid view.
describe("reviewSearchSchema / parseReviewSearch (lenient)", () => {
  it("defaults to all + recent for an empty URL", () => {
    expect(parseReviewSearch({})).toEqual({ reviewFilter: "all", reviewSort: "recent" });
  });

  it("reads valid filter and sort from a shared link", () => {
    expect(parseReviewSearch({ reviewFilter: "event", reviewSort: "highest" })).toEqual({
      reviewFilter: "event",
      reviewSort: "highest",
    });
  });

  it("falls back to defaults for invalid values", () => {
    expect(parseReviewSearch({ reviewFilter: "bogus", reviewSort: "nope" })).toEqual({
      reviewFilter: "all",
      reviewSort: "recent",
    });
  });

  it("schema.parse is idempotent", () => {
    const once = reviewSearchSchema.parse({ reviewFilter: "networking", reviewSort: "lowest" });
    expect(reviewSearchSchema.parse(once)).toEqual(once);
  });
});

// Strict path: invalid values produce a 400-style state.
describe("validateReviewSearchStrict (400-style)", () => {
  it("accepts every valid filter/sort combination", () => {
    for (const reviewFilter of ["all", "service", "event", "networking"] as const) {
      for (const reviewSort of ["recent", "highest", "lowest"] as const) {
        expect(validateReviewSearchStrict({ reviewFilter, reviewSort })).toEqual({
          ok: true,
          data: { reviewFilter, reviewSort },
        });
      }
    }
  });

  it("returns 400 for invalid string values", () => {
    const res = validateReviewSearchStrict({ reviewFilter: "bogus", reviewSort: "nope" });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.status).toBe(400);
      expect(res.errors.map((e: any) => e.path).sort()).toEqual(["reviewFilter", "reviewSort"]);
    }
  });

  it("returns 400 for wrong types", () => {
    const res = validateReviewSearchStrict({ reviewFilter: 123, reviewSort: ["highest"] });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.status).toBe(400);
  });

  it("returns 400 for missing params (no silent default)", () => {
    const res = validateReviewSearchStrict({});
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.length).toBe(2);
  });

  it("reports only the invalid field when one is valid", () => {
    const res = validateReviewSearchStrict({ reviewFilter: "service", reviewSort: "nope" });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors).toHaveLength(1);
      expect(res.errors[0].path).toBe("reviewSort");
      expect(res.errors[0].message).toContain("recent");
    }
  });
});

import { computeReviewSearchValidity, REVIEW_SEARCH_RESET } from "./review-search";

// Drives the reviews tab 400-style error UI: ok=false renders the error
// section, ok=true renders the reviews. The reset link restores defaults.
describe("computeReviewSearchValidity (drives 400 error UI)", () => {
  it("is ok for an empty search string (absent params use defaults)", () => {
    expect(computeReviewSearchValidity("")).toEqual({
      ok: true,
      data: { reviewFilter: "all", reviewSort: "recent" },
    });
  });

  it("is ok for valid present params", () => {
    expect(computeReviewSearchValidity("?reviewFilter=event&reviewSort=highest")).toEqual({
      ok: true,
      data: { reviewFilter: "event", reviewSort: "highest" },
    });
  });

  it("renders the 400 state when a present param is invalid", () => {
    const res = computeReviewSearchValidity("?reviewFilter=bogus");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.status).toBe(400);
      expect(res.errors.map((e: any) => e.path)).toEqual(["reviewFilter"]);
    }
  });

  it("reports both fields when both present params are invalid", () => {
    const res = computeReviewSearchValidity("?reviewFilter=x&reviewSort=y");
    expect(res.ok).toBe(false);
    if (!res.ok)
      expect(res.errors.map((e: any) => e.path).sort()).toEqual(["reviewFilter", "reviewSort"]);
  });

  it("reset defaults resolve back to a valid ok state", () => {
    const reset = computeReviewSearchValidity(
      `?reviewFilter=${REVIEW_SEARCH_RESET.reviewFilter}&reviewSort=${REVIEW_SEARCH_RESET.reviewSort}`,
    );
    expect(reset).toEqual({ ok: true, data: REVIEW_SEARCH_RESET });
    expect(REVIEW_SEARCH_RESET).toEqual({ reviewFilter: "all", reviewSort: "recent" });
  });
});
