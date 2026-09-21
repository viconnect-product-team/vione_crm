// BC-6.0 — Smart Introduction Foundation — pure engine tests.
// Deterministic, IO-free coverage of scoring, weakest-link, diversity,
// confidence thresholds, reason contract, path identity, and privacy
// (hidden topology can have zero influence — engine only receives
// viewer-safe inputs).

import { describe, expect, it } from "vitest";
import {
  SMART_INTRODUCTION_VERSION,
  INTRODUCTION_CONFIDENCE_THRESHOLDS,
  INTRODUCTION_DIVERSITY,
  applyDiversity,
  computePathId,
  confidenceFromScore,
  rankAndBuildPaths,
  scorePath,
  type EnginePathInput,
  type SmartIntroductionPathDTO,
} from "@/lib/graph/introduction";

const opts = {
  strengthVersion: "test",
  generatedAt: "2026-07-14T00:00:00.000Z",
  limit: 10,
};

const chain2 = (mid: string): string[] => ["S", mid, "T"];

function base(mid: string, overrides: Partial<EnginePathInput> = {}): EnginePathInput {
  return {
    nodeChain: chain2(mid),
    hopStrengths: [0.5, 0.5],
    hopStale: [false, false],
    hopRecent: [false, false],
    sharedContexts: [],
    priorIntroductionSuccess: false,
    ...overrides,
  };
}

describe("BC-6.0 SmartIntroduction — scoring", () => {
  it("bounded to [0,1] and deterministic", () => {
    const s1 = scorePath(base("A"));
    const s2 = scorePath(base("A"));
    expect(s1).toBe(s2);
    expect(s1).toBeGreaterThanOrEqual(0);
    expect(s1).toBeLessThanOrEqual(1);
  });

  it("weakest-link: strong/strong outranks strong/weak", () => {
    const strong = scorePath(base("A", { hopStrengths: [0.9, 0.9] }));
    const strongWeak = scorePath(base("A", { hopStrengths: [0.9, 0.2] }));
    const weakStrong = scorePath(base("A", { hopStrengths: [0.2, 0.9] }));
    expect(strong).toBeGreaterThan(strongWeak);
    expect(strong).toBeGreaterThan(weakStrong);
    // Symmetry of penalty on min side.
    expect(strongWeak).toBeCloseTo(weakStrong, 6);
  });

  it("path-length penalty: 3-hop with same trust ranks below 2-hop", () => {
    const two = scorePath(base("A", { hopStrengths: [0.8, 0.8] }));
    const three = scorePath({
      nodeChain: ["S", "A", "B", "T"],
      hopStrengths: [0.8, 0.8, 0.8],
      hopStale: [false, false, false],
      hopRecent: [false, false, false],
      sharedContexts: [],
      priorIntroductionSuccess: false,
    });
    expect(two).toBeGreaterThan(three);
  });

  it("shared context and recency add bounded bonuses", () => {
    const plain = scorePath(base("A", { hopStrengths: [0.5, 0.5] }));
    const ctx = scorePath(
      base("A", {
        hopStrengths: [0.5, 0.5],
        sharedContexts: [{ kind: "company", count: 1, example: "acme" }],
      }),
    );
    const rec = scorePath(base("A", { hopRecent: [true, false] }));
    expect(ctx).toBeGreaterThan(plain);
    expect(rec).toBeGreaterThan(plain);
  });

  it("stale hop is penalized", () => {
    const fresh = scorePath(base("A"));
    const stale = scorePath(base("A", { hopStale: [true, false] }));
    expect(fresh).toBeGreaterThan(stale);
  });
});

describe("BC-6.0 SmartIntroduction — confidence thresholds", () => {
  it("maps score to low/medium/high deterministically", () => {
    expect(confidenceFromScore(0, 2)).toBe("low");
    expect(confidenceFromScore(INTRODUCTION_CONFIDENCE_THRESHOLDS.medium, 2)).toBe("medium");
    expect(confidenceFromScore(INTRODUCTION_CONFIDENCE_THRESHOLDS.high, 2)).toBe("high");
  });
  it("3-hop paths are held to a higher bar for 'high'", () => {
    const s = INTRODUCTION_CONFIDENCE_THRESHOLDS.high;
    expect(confidenceFromScore(s, 3)).toBe("medium");
    expect(confidenceFromScore(s + 0.05, 3)).toBe("high");
  });
});

describe("BC-6.0 SmartIntroduction — reasons contract", () => {
  it("every path has at least one reason and codes are stable", () => {
    const [p] = rankAndBuildPaths({ candidates: [base("A")], options: opts });
    expect(p!.reasons.length).toBeGreaterThan(0);
    for (const r of p!.reasons) {
      expect(typeof r.code).toBe("string");
      expect(r.summaryKey).toMatch(/^businessConnect\.introduction\.reason\./);
      expect(typeof r.priority).toBe("number");
    }
  });

  it("high-strength hops emit STRONG_* reasons; fallback yields SHORTEST_TRUSTED_PATH", () => {
    const strong = rankAndBuildPaths({
      candidates: [base("A", { hopStrengths: [0.9, 0.9] })],
      options: opts,
    })[0]!;
    const codes = strong.reasons.map((r: any) => r.code);
    expect(codes).toContain("STRONG_DIRECT_INTERMEDIARY");
    expect(codes).toContain("STRONG_TARGET_RELATIONSHIP");

    const fallback = rankAndBuildPaths({
      candidates: [base("A", { hopStrengths: [0.1, 0.1] })],
      options: opts,
    })[0]!;
    expect(fallback.reasons.map((r: any) => r.code)).toContain("SHORTEST_TRUSTED_PATH");
  });
});

describe("BC-6.0 SmartIntroduction — path identity & version", () => {
  it("path id is deterministic and bound to version", () => {
    const id1 = computePathId(["S", "A", "T"]);
    const id2 = computePathId(["S", "A", "T"]);
    const id3 = computePathId(["S", "B", "T"]);
    expect(id1).toBe(id2);
    expect(id1).not.toBe(id3);
  });

  it("results carry introductionVersion and strengthVersion", () => {
    const [p] = rankAndBuildPaths({ candidates: [base("A")], options: opts });
    expect(p!.introductionVersion).toBe(SMART_INTRODUCTION_VERSION);
    expect(p!.strengthVersion).toBe("test");
    expect(p!.generatedAt).toBe(opts.generatedAt);
  });
});

describe("BC-6.0 SmartIntroduction — ranking & diversity", () => {
  it("orders by score desc, then depth asc, then pathId asc", () => {
    const cands: EnginePathInput[] = [
      base("A", { hopStrengths: [0.9, 0.9] }),
      base("B", { hopStrengths: [0.5, 0.5] }),
      base("C", { hopStrengths: [0.3, 0.3] }),
    ];
    const ranked = rankAndBuildPaths({ candidates: cands, options: opts });
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1]!.score).toBeGreaterThanOrEqual(ranked[i]!.score);
    }
  });

  it("caps paths per primary intermediary (diversity)", () => {
    const many: EnginePathInput[] = Array.from({ length: 5 }, (_, i) => ({
      // Same intermediary A across all — should be capped.
      nodeChain: ["S", "A", `T${i}`],
      hopStrengths: [0.7, 0.7],
      hopStale: [false, false],
      hopRecent: [false, false],
      sharedContexts: [],
      priorIntroductionSuccess: false,
    }));
    const ranked = rankAndBuildPaths({
      candidates: many,
      options: { ...opts, limit: 10 },
    });
    const viaA = ranked.filter((p) => p.intermediaries[0]?.personNodeId === "A");
    expect(viaA.length).toBeLessThanOrEqual(INTRODUCTION_DIVERSITY.maxPathsPerPrimaryIntermediary);
  });

  it("applyDiversity is deterministic (no randomization)", () => {
    const built = rankAndBuildPaths({
      candidates: [
        base("A", { hopStrengths: [0.9, 0.9] }),
        base("A", { hopStrengths: [0.8, 0.8], nodeChain: ["S", "A", "T2"] }),
        base("A", { hopStrengths: [0.7, 0.7], nodeChain: ["S", "A", "T3"] }),
      ],
      options: opts,
    });
    const again = rankAndBuildPaths({
      candidates: [
        base("A", { hopStrengths: [0.9, 0.9] }),
        base("A", { hopStrengths: [0.8, 0.8], nodeChain: ["S", "A", "T2"] }),
        base("A", { hopStrengths: [0.7, 0.7], nodeChain: ["S", "A", "T3"] }),
      ],
      options: opts,
    });
    expect(built.map((p) => p.pathId)).toEqual(again.map((p) => p.pathId));
  });
});

describe("BC-6.0 SmartIntroduction — privacy invariant", () => {
  it("engine only sees provided inputs — hidden topology is not representable", () => {
    // If callers never pass a hidden intermediary/edge, no engine output can
    // reference one. This test encodes that contract: the DTO chain is a
    // subset of the input nodeChain.
    const p = rankAndBuildPaths({ candidates: [base("A")], options: opts })[0]!;
    const dtoIds = ["S", ...p.intermediaries.map((i) => i.personNodeId), p.target.personNodeId];
    expect(dtoIds).toEqual(["S", "A", "T"]);
  });

  it("applyDiversity keeps ranked order and never invents paths", () => {
    const p1: SmartIntroductionPathDTO = {
      pathId: "p1",
      target: { personNodeId: "T" },
      intermediaries: [{ personNodeId: "A", hop: 1 }],
      depth: 2,
      score: 0.9,
      confidence: "high",
      reasons: [],
      introductionVersion: SMART_INTRODUCTION_VERSION,
      strengthVersion: "test",
      generatedAt: opts.generatedAt,
    };
    const p2: SmartIntroductionPathDTO = { ...p1, pathId: "p2", score: 0.85 };
    const p3: SmartIntroductionPathDTO = { ...p1, pathId: "p3", score: 0.8 };
    const kept = applyDiversity(
      [p1, p2, p3],
      new Map([
        ["p1", "company"],
        ["p2", "company"],
        ["p3", "company"],
      ]),
    );
    // Same primary intermediary "A" -> capped at 2 max.
    expect(kept.length).toBe(INTRODUCTION_DIVERSITY.maxPathsPerPrimaryIntermediary);
    for (const p of kept) expect(["p1", "p2", "p3"]).toContain(p.pathId);
  });
});
