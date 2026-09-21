import { z } from "zod";
import type { ReviewType } from "@/lib/reviews.functions";

export type ReviewSort = "recent" | "highest" | "lowest";
export type ReviewSearch = { reviewFilter: "all" | ReviewType; reviewSort: ReviewSort };

export const REVIEW_FILTERS = ["all", "service", "event", "networking"] as const;
export const REVIEW_SORTS = ["recent", "highest", "lowest"] as const;

/** Default valid view restored by the "reset to defaults" link. */
export const REVIEW_SEARCH_RESET: ReviewSearch = { reviewFilter: "all", reviewSort: "recent" };

/**
 * Strict schema: values must be exactly one of the allowed enums. Extra
 * refinements reject non-string/empty inputs with clear messages before the
 * enum check. Used to produce a 400-style result for invalid params.
 */
export const reviewSearchStrictSchema = z.object({
  reviewFilter: z
    .string({ invalid_type_error: "reviewFilter must be a string" })
    .refine((v) => REVIEW_FILTERS.includes(v as (typeof REVIEW_FILTERS)[number]), {
      message: `reviewFilter must be one of: ${REVIEW_FILTERS.join(", ")}`,
    }),
  reviewSort: z
    .string({ invalid_type_error: "reviewSort must be a string" })
    .refine((v) => REVIEW_SORTS.includes(v as (typeof REVIEW_SORTS)[number]), {
      message: `reviewSort must be one of: ${REVIEW_SORTS.join(", ")}`,
    }),
});

/**
 * Lenient schema for the route's validateSearch: invalid/missing values fall
 * back to defaults so shared links and back/forward nav never crash the route.
 */
export const reviewSearchSchema = z.object({
  reviewFilter: z.enum(REVIEW_FILTERS).catch("all"),
  reviewSort: z.enum(REVIEW_SORTS).catch("recent"),
});

/** Runs on every URL change (shared links, forward and back/forward nav). */
export function parseReviewSearch(search: Record<string, unknown>): ReviewSearch {
  return reviewSearchSchema.parse(search) as ReviewSearch;
}

export type ReviewSearchResult =
  | { ok: true; data: ReviewSearch }
  | { ok: false; status: 400; errors: { path: string; message: string }[] };

/**
 * Strict validation that returns a 400-style state instead of falling back.
 * Use when invalid review params should be treated as a bad request.
 */
export function validateReviewSearchStrict(search: Record<string, unknown>): ReviewSearchResult {
  const result = reviewSearchStrictSchema.safeParse(search);
  if (result.success) return { ok: true, data: result.data as ReviewSearch };
  return {
    ok: false,
    status: 400,
    errors: result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
  };
}

/**
 * Computes the 400-style validity from a raw URL search string. Only params
 * actually present in the URL are validated — an absent param falls back to its
 * default. This drives whether the reviews tab shows the error UI.
 */
export function computeReviewSearchValidity(rawSearchStr: string): ReviewSearchResult {
  const params = new URLSearchParams(rawSearchStr);
  const present: Record<string, unknown> = {
    reviewFilter: params.has("reviewFilter") ? params.get("reviewFilter") : "all",
    reviewSort: params.has("reviewSort") ? params.get("reviewSort") : "recent",
  };
  return validateReviewSearchStrict(present);
}
