// BC-6.7 — Public barrel.
export {
  INTRODUCTION_ANALYTICS_VERSION,
  ANALYTICS_LOW_SAMPLE_THRESHOLD,
  ANALYTICS_MAX_RANGE_DAYS,
  INTRODUCTION_ANALYTICS_SCOPES,
  CONFIDENCE_BUCKETS,
  PATH_DEPTH_FILTERS,
  TIME_METRIC_KINDS,
  INTRODUCTION_ANALYTICS_ERROR_CODES,
  IntroductionAnalyticsError,
  toIntroductionAnalyticsError,
  computeRates,
  safeRate,
  isLowSample,
} from "./types";
export type {
  IntroductionAnalyticsScopeType,
  ConfidenceBucket,
  PathDepthFilter,
  TimeMetricKind,
  OutcomeMixKey,
  AnalyticsFilters,
  FunnelCountsDTO,
  FunnelRatesDTO,
  OverviewDTO,
  TrendPointDTO,
  TrendDTO,
  TimeToOutcomeRowDTO,
  TimeToOutcomeDTO,
  PathBucketDTO,
  PathPerformanceDTO,
  ConfidenceBucketDTO,
  ConfidencePerformanceDTO,
  IntermediaryImpactDTO,
  IntroductionAnalyticsErrorCode,
} from "./types";
export { IntroductionAnalyticsSDK, introductionAnalyticsKeys } from "./analytics.sdk";
export type { IntroductionAnalyticsSDKType } from "./analytics.sdk";
