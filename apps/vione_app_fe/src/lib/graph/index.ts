// BC-4.1/4.2 — Relationship Graph Engine — Public barrel.
// Consumers import ONLY from here.
export { RelationshipGraphSDK } from "./graph.sdk";
export type {
  RelationshipGraphSDKType,
  RegisterNodeArgs,
  CreateEdgeArgs,
  ConnectArgs,
} from "./graph.sdk";
export { GraphError } from "./errors";
export type { GraphErrorCode } from "./errors";
export { graphRegistry } from "./registry";
export type { NodeKindRegistration, EdgeKindRegistration, Cardinality } from "./registry";
export type {
  NodeKind,
  EdgeKind,
  VisibilityClass,
  TenantScopeType,
  Direction,
  Directionality,
  NodeStatus,
  EdgeStatus,
  ExternalRef,
  GraphNodeDTO,
  GraphEdgeDTO,
  GraphNeighborDTO,
  GraphMutualDTO,
  GraphSharedNodeDTO,
  GraphPathDTO,
  GraphPathHop,
  GraphCursorPage,
  NeighborsQuery,
  MutualQuery,
  SharedNodesQuery,
  ShortestPathQuery,
} from "./types";
export type {
  GraphTimelineEventDTO,
  TimelineQuery,
  PairTimelineQuery,
  TimelinePage,
} from "./timeline.types";
export {
  RELATIONSHIP_STRENGTH_VERSION,
  RELATIONSHIP_STRENGTH_REGISTRY_VERSION,
} from "./strength/types";
export type {
  RelationshipStrengthResult,
  StrengthTier,
  StrengthCategory,
  StrengthSignalKind,
  StrengthContributionRecord,
  StrengthFreshness,
} from "./strength/types";
export { computeStrength, canonicalPair } from "./strength/engine";
export { listContributions, TIER_BANDS, CATEGORY_CAPS } from "./strength/registry";
export {
  RELATIONSHIP_RECOMMENDATION_VERSION,
  RELATIONSHIP_RECOMMENDATION_REGISTRY_VERSION,
} from "./recommendation/types";
export type {
  RecommendationDTO,
  RecommendationPageDTO,
  RecommendationQuery,
  RecommendationReasonDTO,
  RecommendationReasonCode,
  RecommendationSourceKind,
  RecommendationCategory,
} from "./recommendation/types";
export {
  listRecommendationSources,
  getRecommendationSource,
  RECO_CATEGORY_CAPS,
  RECO_MAX_CONSECUTIVE_SAME_CATEGORY,
  RECO_MAX_CANDIDATE_POOL,
  RECO_DEFAULT_LIMIT,
  RECO_MAX_LIMIT,
} from "./recommendation/registry";
export { rankCandidates, diversityRerank } from "./recommendation/engine";
export type { RawCandidate, CandidateEvidence, RankedCandidate } from "./recommendation/engine";

// BC-6.0 — Smart Introduction Foundation (read-only).
export {
  SMART_INTRODUCTION_VERSION,
  SMART_INTRODUCTION_REGISTRY_VERSION,
  SmartIntroductionSDK,
  INTRODUCTION_WEIGHTS,
  INTRODUCTION_CONFIDENCE_THRESHOLDS,
  INTRODUCTION_DIVERSITY,
  INTRODUCTION_BUDGETS,
  INTRODUCTION_REASON_PRIORITY,
  confidenceFromScore,
  scorePath,
  computePathId,
  rankAndBuildPaths,
  applyDiversity,
} from "./introduction";
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
  SmartIntroductionSDKType,
  EnginePathInput,
  EngineOptions,
  RankArgs,
} from "./introduction";

// BC-6.2 — Introduction Request Workflow.
export {
  INTRODUCTION_REQUEST_VERSION,
  INTRODUCTION_REQUEST_MAX_NOTE,
  INTRODUCTION_REQUEST_EXPIRY_DAYS,
  INTRODUCTION_REQUEST_STATUSES,
  INTRODUCTION_REQUEST_TERMINAL,
  INTRODUCTION_REQUEST_ERROR_CODES,
  IntroductionRequestError,
  toIntroductionRequestError,
  canTransition,
  IntroductionRequestSDK,
} from "./introduction/request";
export type {
  IntroductionRequestStatus,
  IntroductionRequestErrorCode,
  IntroductionRequestParticipantDTO,
  SelectedPathSummaryDTO,
  IntroductionRequestDTO,
  IntroductionRequestPageDTO,
  SendIntroductionRequestInput,
  ListRequestsOptions,
  IntroductionPathSnapshot,
  IntroductionRequestSDKType,
} from "./introduction/request";

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
} from "./introduction/delivery";
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
} from "./introduction/delivery";
