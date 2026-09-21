// BC-4.4 — Recommendation cursor: stable, version-bound, query-bound.
// Opaque base64 JSON: { v, src, kinds, rank, id }.
// Invalid or incompatible cursors → GraphError("RECOMMENDATION_CURSOR_INVALID").

import { graphErr } from "../errors";
import { RELATIONSHIP_RECOMMENDATION_VERSION } from "./types";

export interface RecommendationCursor {
  v: typeof RELATIONSHIP_RECOMMENDATION_VERSION;
  src: string;
  /** Normalized target node kinds joined with '|'. */
  kinds: string;
  /** Last rank key emitted (score, id). */
  rank: number;
  id: string;
}

export function encodeRecoCursor(c: RecommendationCursor): string {
  return Buffer.from(JSON.stringify(c)).toString("base64");
}
export function decodeRecoCursor(
  raw: string | null | undefined,
  expectedSrc: string,
  expectedKinds: string,
): RecommendationCursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as unknown;
    if (!parsed || typeof parsed !== "object") throw new Error("bad");
    const c = parsed as Partial<RecommendationCursor>;
    if (c.v !== RELATIONSHIP_RECOMMENDATION_VERSION) {
      throw graphErr("RECOMMENDATION_VERSION_UNSUPPORTED");
    }
    if (c.src !== expectedSrc || c.kinds !== expectedKinds) {
      throw graphErr("RECOMMENDATION_CURSOR_INVALID");
    }
    if (typeof c.rank !== "number" || typeof c.id !== "string") {
      throw graphErr("RECOMMENDATION_CURSOR_INVALID");
    }
    return c as RecommendationCursor;
  } catch (e) {
    if ((e as { code?: string })?.code) throw e;
    throw graphErr("RECOMMENDATION_CURSOR_INVALID");
  }
}

export function normalizeKinds(kinds: string[] | undefined): string {
  const list = (kinds && kinds.length > 0 ? kinds : ["person"]).slice().sort();
  return list.join("|");
}
