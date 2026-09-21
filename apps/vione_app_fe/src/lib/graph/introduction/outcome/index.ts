// BC-6.4 — Public barrel.
export {
  INTRODUCTION_OUTCOME_VERSION,
  INTRODUCTION_OUTCOME_MAX_NOTE,
  INTRODUCTION_OUTCOME_WINDOW_DAYS,
  INTRODUCTION_OUTCOME_STATUSES,
  INTRODUCTION_OUTCOME_TYPES,
  INTRODUCTION_OUTCOME_TERMINAL,
  INTRODUCTION_OUTCOME_ERROR_CODES,
  IntroductionOutcomeError,
  toIntroductionOutcomeError,
  canTransition,
} from "./types";
export type {
  IntroductionOutcomeStatus,
  IntroductionOutcomeType,
  IntroductionOutcomeSource,
  IntroductionOutcomeErrorCode,
  IntroductionOutcomeParticipantDTO,
  IntroductionOutcomeDTO,
  IntroductionOutcomePageDTO,
  ListOutcomesOptions,
  MarkProgressedInput,
} from "./types";
export { IntroductionOutcomeSDK, introductionOutcomeKeys } from "./outcome.sdk";
export type { IntroductionOutcomeSDKType } from "./outcome.sdk";
