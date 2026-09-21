// BC-6.4 — IntroductionOutcomeSDK (client-safe façade).
import {
  getIntermediaryIntroductionImpactFn,
  getIntroductionOutcomeFn,
  listIntermediaryIntroductionOutcomesFn,
  listRequesterIntroductionOutcomesFn,
  markIntroductionOutcomeNoOutcomeFn,
  markIntroductionOutcomeProgressedFn,
} from "./outcome.functions";
import type {
  IntroductionOutcomeDTO,
  IntroductionOutcomePageDTO,
  ListOutcomesOptions,
  MarkProgressedInput,
} from "./types";

export const IntroductionOutcomeSDK = {
  getOutcome: (id: string): Promise<IntroductionOutcomeDTO> =>
    getIntroductionOutcomeFn({ data: { outcomeId: id } }),
  listRequesterOutcomes: (o?: ListOutcomesOptions): Promise<IntroductionOutcomePageDTO> =>
    listRequesterIntroductionOutcomesFn({ data: o ?? {} }),
  listIntermediaryOutcomes: (o?: ListOutcomesOptions): Promise<IntroductionOutcomePageDTO> =>
    listIntermediaryIntroductionOutcomesFn({ data: o ?? {} }),
  markProgressed: (i: MarkProgressedInput): Promise<IntroductionOutcomeDTO> =>
    markIntroductionOutcomeProgressedFn({
      data: { outcomeId: i.outcomeId, note: i.note },
    }),
  markNoOutcome: (outcomeId: string): Promise<IntroductionOutcomeDTO> =>
    markIntroductionOutcomeNoOutcomeFn({ data: { outcomeId } }),
  getIntermediaryImpact: () => getIntermediaryIntroductionImpactFn({ data: {} as never }),
};

export type IntroductionOutcomeSDKType = typeof IntroductionOutcomeSDK;

export const introductionOutcomeKeys = {
  root: ["introduction-outcomes"] as const,
  detail: (id: string) => ["introduction-outcomes", "detail", id] as const,
  requester: (params?: ListOutcomesOptions) =>
    ["introduction-outcomes", "requester", params ?? {}] as const,
  intermediary: (params?: ListOutcomesOptions) =>
    ["introduction-outcomes", "intermediary", params ?? {}] as const,
  impact: () => ["introduction-outcomes", "impact"] as const,
};
