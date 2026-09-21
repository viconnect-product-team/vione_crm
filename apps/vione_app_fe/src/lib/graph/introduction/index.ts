// BC-6.0 — Smart Introduction — public barrel (client-safe).
export { SMART_INTRODUCTION_VERSION, SMART_INTRODUCTION_REGISTRY_VERSION } from "./types";
export type {
  IntroductionConfidence,
  IntroductionReasonCode,
  SmartIntroductionReasonDTO,
  SmartIntroductionIntermediaryDTO,
  SmartIntroductionTargetDTO,
  SmartIntroductionPathDTO,
  SmartIntroductionPageDTO,
  SmartIntroductionQuery,
  SmartIntroductionPageState,
} from "./types";
export {
  INTRODUCTION_WEIGHTS,
  INTRODUCTION_CONFIDENCE_THRESHOLDS,
  INTRODUCTION_DIVERSITY,
  INTRODUCTION_BUDGETS,
  INTRODUCTION_REASON_PRIORITY,
  confidenceFromScore,
} from "./registry";
export { scorePath, computePathId, rankAndBuildPaths, applyDiversity } from "./engine";
export type { EnginePathInput, EngineOptions, RankArgs } from "./engine";
export { SmartIntroductionSDK } from "./introduction.sdk";
export type { SmartIntroductionSDKType } from "./introduction.sdk";

// BC-6.3 — Introduction Delivery
export {
  INTRODUCTION_DELIVERY_VERSION,
  INTRODUCTION_DELIVERY_MAX_NOTE,
  INTRODUCTION_DELIVERY_EXPIRY_DAYS,
  INTRODUCTION_DELIVERY_STATUSES,
  INTRODUCTION_DELIVERY_TERMINAL,
  INTRODUCTION_DELIVERY_ERROR_CODES,
  IntroductionDeliveryError,
  toIntroductionDeliveryError,
  IntroductionDeliverySDK,
} from "./delivery";
export type {
  IntroductionDeliveryStatus,
  IntroductionDeliveryErrorCode,
  IntroductionDeliveryParticipantDTO,
  IntroductionDeliverySummaryDTO,
  IntroductionDeliveryDTO,
  IntroductionDeliveryPageDTO,
  DeliverIntroductionInput,
  ListDeliveriesOptions,
  PendingDeliveryItemDTO,
  IntroductionDeliverySDKType,
} from "./delivery";
