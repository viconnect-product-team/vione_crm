// BC-4.4 — Recommendation Engine v1 — Pure engine + registry + cursor tests.
// No DB, no server functions. Determinism, caps, diversity, cursor safety.

import { describe, it, expect } from "vitest";
import {
  rankCandidates,
  diversityRerank,
  type RawCandidate,
} from "@/lib/graph/recommendation/engine";
import {
  RECO_CATEGORY_CAPS,
  RECO_MAX_CONSECUTIVE_SAME_CATEGORY,
  getRecommendationSource,
  listRecommendationSources,
} from "@/lib/graph/recommendation/registry";
import {
  decodeRecoCursor,
  encodeRecoCursor,
  normalizeKinds,
} from "@/lib/graph/recommendation/cursor";
import {
  RELATIONSHIP_RECOMMENDATION_REGISTRY_VERSION,
  RELATIONSHIP_RECOMMENDATION_VERSION,
} from "@/lib/graph/recommendation/types";
import { GraphError } from "@/lib/graph";

describe("BC-4.4 registry integrity", () => {
  it("declares a stable non-zero registry version and semver runtime version", () => {
    expect(RELATIONSHIP_RECOMMENDATION_REGISTRY_VERSION).toBe(1);
    expect(RELATIONSHIP_RECOMMENDATION_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
  it("has unique source kinds and valid base weights", () => {
    const kinds = new Set<string>();
    for (const s of listRecommendationSources()) {
      expect(kinds.has(s.sourceKind)).toBe(false);
      kinds.add(s.sourceKind);
      expect(s.baseWeight).toBeGreaterThan(0);
      expect(s.baseWeight).toBeLessThanOrEqual(1);
      expect(s.frequencyCap).toBeGreaterThanOrEqual(1);
    }
  });
  it("registry lookup returns undefined for unknown kinds", () => {
    expect(getRecommendationSource("NON_EXISTENT" as never)).toBeUndefined();
  });
});

describe("BC-4.4 deterministic ranking", () => {
  const build = (): RawCandidate[] => [
    { candidateNodeId: "b", evidence: [{ sourceKind: "MUTUAL_CONNECTION", count: 4 }] },
    { candidateNodeId: "a", evidence: [{ sourceKind: "MUTUAL_CONNECTION", count: 4 }] },
    { candidateNodeId: "c", evidence: [{ sourceKind: "SHARED_COMPANY", count: 2 }] },
  ];

  it("produces same output for identical input (referentially independent)", () => {
    const r1 = rankCandidates({ candidates: build() });
    const r2 = rankCandidates({ candidates: build() });
    expect(r2.map((x: any) => x.candidateNodeId)).toEqual(r1.map((x: any) => x.candidateNodeId));
    expect(r2.map((x: any) => x.score)).toEqual(r1.map((x: any) => x.score));
  });

  it("breaks ties on candidateNodeId ASC", () => {
    const out = rankCandidates({ candidates: build() });
    // a & b tied on score → a before b
    const aIdx = out.findIndex((x) => x.candidateNodeId === "a");
    const bIdx = out.findIndex((x) => x.candidateNodeId === "b");
    expect(aIdx).toBeLessThan(bIdx);
  });

  it("stronger evidence beats weaker evidence", () => {
    const out = rankCandidates({
      candidates: [
        { candidateNodeId: "weak", evidence: [{ sourceKind: "SHARED_COMPANY", count: 1 }] },
        { candidateNodeId: "strong", evidence: [{ sourceKind: "MUTUAL_CONNECTION", count: 10 }] },
      ],
    });
    expect(out[0]!.candidateNodeId).toBe("strong");
  });

  it("frequency has diminishing returns (capped_log)", () => {
    const one = rankCandidates({
      candidates: [
        { candidateNodeId: "x", evidence: [{ sourceKind: "MUTUAL_CONNECTION", count: 1 }] },
      ],
    })[0]!.score;
    const many = rankCandidates({
      candidates: [
        { candidateNodeId: "x", evidence: [{ sourceKind: "MUTUAL_CONNECTION", count: 20 }] },
      ],
    })[0]!.score;
    expect(many).toBeGreaterThan(one);
    // Not linear: 20x count ≪ 20x score
    expect(many).toBeLessThan(one * 20);
  });

  it("caps contributions above the source frequency cap", () => {
    const atCap = rankCandidates({
      candidates: [
        { candidateNodeId: "x", evidence: [{ sourceKind: "MUTUAL_CONNECTION", count: 12 }] },
      ],
    })[0]!.score;
    const wayAbove = rankCandidates({
      candidates: [
        { candidateNodeId: "x", evidence: [{ sourceKind: "MUTUAL_CONNECTION", count: 999 }] },
      ],
    })[0]!.score;
    expect(wayAbove).toBeCloseTo(atCap, 6);
  });
});

describe("BC-4.4 category caps and clamping", () => {
  it("enforces per-category cap even under extreme evidence", () => {
    const r = rankCandidates({
      candidates: [
        {
          candidateNodeId: "x",
          evidence: [
            { sourceKind: "MUTUAL_CONNECTION", count: 500 },
            { sourceKind: "STRONG_MUTUAL", count: 100 },
          ],
        },
      ],
    })[0]!;
    const mutualSum = r.contributions
      .filter((c) => c.category === "mutual")
      .reduce((a, b) => a + b.contribution, 0);
    expect(mutualSum).toBeLessThanOrEqual(RECO_CATEGORY_CAPS.mutual + 1e-9);
  });

  it("keeps final score in [0,1]", () => {
    const r = rankCandidates({
      candidates: [
        {
          candidateNodeId: "x",
          evidence: [
            { sourceKind: "MUTUAL_CONNECTION", count: 999 },
            { sourceKind: "SHARED_COMPANY", count: 999 },
            { sourceKind: "SHARED_ASSOCIATION", count: 999 },
            { sourceKind: "SHARED_COMMUNITY", count: 999 },
            { sourceKind: "SHARED_EVENT", count: 999 },
            { sourceKind: "STRONG_MUTUAL", count: 50, strengthWeight: 1 },
            { sourceKind: "INTRODUCTION_PATH", count: 5 },
          ],
        },
      ],
    })[0]!;
    expect(r.score).toBeGreaterThan(0);
    expect(r.score).toBeLessThanOrEqual(1);
  });

  it("ignores disabled or unknown sources", () => {
    const out = rankCandidates({
      candidates: [
        {
          candidateNodeId: "x",
          evidence: [
            { sourceKind: "UNKNOWN_SOURCE" as never, count: 100 },
            { sourceKind: "MUTUAL_CONNECTION", count: 1 },
          ],
        },
      ],
    })[0]!;
    expect(out.contributions.every((c) => c.sourceKind === "MUTUAL_CONNECTION")).toBe(true);
  });
});

describe("BC-4.4 diversity rerank", () => {
  it("does not surface more than N consecutive same-category items", () => {
    const cands: RawCandidate[] = [];
    for (let i = 0; i < 5; i++) {
      cands.push({
        candidateNodeId: `m${i}`,
        evidence: [{ sourceKind: "MUTUAL_CONNECTION", count: 5 - i }],
      });
    }
    cands.push({
      candidateNodeId: "c1",
      evidence: [{ sourceKind: "SHARED_COMPANY", count: 3 }],
    });
    const out = rankCandidates({ candidates: cands });
    let streak = 1;
    for (let i = 1; i < out.length; i++) {
      const catI = out[i]!.contributions[0]?.category;
      const catP = out[i - 1]!.contributions[0]?.category;
      streak = catI === catP ? streak + 1 : 1;
      expect(streak).toBeLessThanOrEqual(RECO_MAX_CONSECUTIVE_SAME_CATEGORY + 1);
    }
  });

  it("diversityRerank is a stable no-op when input is already diverse", () => {
    const ranked = rankCandidates({
      candidates: [
        { candidateNodeId: "a", evidence: [{ sourceKind: "MUTUAL_CONNECTION", count: 3 }] },
        { candidateNodeId: "b", evidence: [{ sourceKind: "SHARED_COMPANY", count: 3 }] },
        { candidateNodeId: "c", evidence: [{ sourceKind: "SHARED_ASSOCIATION", count: 3 }] },
      ],
    });
    const out = diversityRerank(ranked);
    expect(out.map((x: any) => x.candidateNodeId)).toEqual(ranked.map((x: any) => x.candidateNodeId));
  });
});

describe("BC-4.4 cursor safety", () => {
  it("round-trips a valid cursor", () => {
    const raw = encodeRecoCursor({
      v: RELATIONSHIP_RECOMMENDATION_VERSION,
      src: "src-node",
      kinds: "person",
      rank: 0.42,
      id: "cand-1",
    });
    const back = decodeRecoCursor(raw, "src-node", "person");
    expect(back?.rank).toBe(0.42);
    expect(back?.id).toBe("cand-1");
  });

  it("rejects cursor with mismatched source", () => {
    const raw = encodeRecoCursor({
      v: RELATIONSHIP_RECOMMENDATION_VERSION,
      src: "src-A",
      kinds: "person",
      rank: 0.5,
      id: "x",
    });
    expect(() => decodeRecoCursor(raw, "src-B", "person")).toThrow(GraphError);
  });

  it("rejects garbage cursor input", () => {
    expect(() => decodeRecoCursor("not-base64!!!", "s", "person")).toThrow(GraphError);
  });

  it("normalizes empty kinds to 'person'", () => {
    expect(normalizeKinds(undefined)).toBe("person");
    expect(normalizeKinds([])).toBe("person");
    expect(normalizeKinds(["b", "a"])).toBe("a|b");
  });
});
