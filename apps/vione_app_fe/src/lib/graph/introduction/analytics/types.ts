// BC-6.7 — Introduction Analytics — client-safe types and constants.
// No PII, no note content, no raw graph topology, no causal claims.

export const INTRODUCTION_ANALYTICS_VERSION = "1.0.0" as const;
export const ANALYTICS_LOW_SAMPLE_THRESHOLD = 20 as const;
export const ANALYTICS_MAX_RANGE_DAYS = 366 as const;

export type IntroductionAnalyticsScopeType = "self_requester" | "self_intermediary" | "platform";

export const INTRODUCTION_ANALYTICS_SCOPES: readonly IntroductionAnalyticsScopeType[] = [
  "self_requester",
  "self_intermediary",
  "platform",
] as const;

export type ConfidenceBucket = "low" | "medium" | "high" | "all";
export const CONFIDENCE_BUCKETS: readonly ConfidenceBucket[] = [
  "all",
  "low",
  "medium",
  "high",
] as const;

/** 0 means "all path depths"; 2 / 3 are the real depths. */
export type PathDepthFilter = 0 | 2 | 3;
export const PATH_DEPTH_FILTERS: readonly PathDepthFilter[] = [0, 2, 3] as const;

export type OutcomeMixKey =
  | "connected"
  | "progressed"
  | "not_connected"
  | "closed_no_outcome"
  | "expired";

export type TimeMetricKind = "accept" | "deliver" | "ack" | "connect" | "progressed";
export const TIME_METRIC_KINDS: readonly TimeMetricKind[] = [
  "accept",
  "deliver",
  "ack",
  "connect",
  "progressed",
] as const;

export interface AnalyticsFilters {
  scope: IntroductionAnalyticsScopeType;
  fromDate: string; // ISO date (YYYY-MM-DD)
  toDate: string;
  pathDepth: PathDepthFilter;
  confidence: ConfidenceBucket;
}

export interface FunnelCountsDTO {
  requested: number;
  accepted: number;
  delivered: number;
  acknowledged: number;
  connected: number;
  progressed: number;
  notConnected: number;
  closedNoOutcome: number;
  expired: number;
}

/** Explicit formulas; each is null when its denominator is 0. */
export interface FunnelRatesDTO {
  acceptanceRate: number | null; // accepted / requested
  deliveryRate: number | null; // delivered / accepted
  acknowledgmentRate: number | null; // acknowledged / delivered
  connectionConversion: number | null; // connected / acknowledged
  progressionRate: number | null; // (connected + progressed) / acknowledged
}

export interface OverviewDTO {
  filters: AnalyticsFilters;
  counts: FunnelCountsDTO;
  rates: FunnelRatesDTO;
  sampleSize: number;
  lowSample: boolean;
  analyticsVersion: string;
}

export interface TrendPointDTO {
  metricDate: string; // YYYY-MM-DD
  counts: FunnelCountsDTO;
}

export interface TrendDTO {
  filters: AnalyticsFilters;
  points: TrendPointDTO[];
  analyticsVersion: string;
}

export interface TimeToOutcomeRowDTO {
  metric: TimeMetricKind;
  sampleSize: number;
  lowSample: boolean;
  p50Seconds: number | null;
  p75Seconds: number | null;
  p90Seconds: number | null;
}

export interface TimeToOutcomeDTO {
  filters: AnalyticsFilters;
  rows: TimeToOutcomeRowDTO[];
  analyticsVersion: string;
}

export interface PathBucketDTO {
  pathDepth: 2 | 3;
  counts: Pick<
    FunnelCountsDTO,
    "requested" | "accepted" | "delivered" | "acknowledged" | "connected" | "progressed"
  >;
  rates: Pick<
    FunnelRatesDTO,
    | "acceptanceRate"
    | "deliveryRate"
    | "acknowledgmentRate"
    | "connectionConversion"
    | "progressionRate"
  >;
  sampleSize: number;
  lowSample: boolean;
}

export interface PathPerformanceDTO {
  filters: Omit<AnalyticsFilters, "pathDepth">;
  buckets: PathBucketDTO[];
  analyticsVersion: string;
}

export interface ConfidenceBucketDTO {
  bucket: "low" | "medium" | "high";
  counts: Pick<
    FunnelCountsDTO,
    "requested" | "accepted" | "delivered" | "acknowledged" | "connected" | "progressed"
  >;
  rates: Pick<
    FunnelRatesDTO,
    "acceptanceRate" | "acknowledgmentRate" | "connectionConversion" | "progressionRate"
  >;
  sampleSize: number;
  lowSample: boolean;
}

export interface ConfidencePerformanceDTO {
  filters: Omit<AnalyticsFilters, "confidence">;
  buckets: ConfidenceBucketDTO[];
  analyticsVersion: string;
}

export interface IntermediaryImpactDTO {
  fromDate: string;
  toDate: string;
  counts: Pick<
    FunnelCountsDTO,
    "requested" | "accepted" | "delivered" | "acknowledged" | "connected" | "progressed"
  >;
  medianDeliverSeconds: number | null;
  sampleSize: number;
  lowSample: boolean;
  analyticsVersion: string;
}

export const INTRODUCTION_ANALYTICS_ERROR_CODES = [
  "INTRO_ANALYTICS_FORBIDDEN",
  "INTRO_ANALYTICS_RANGE_TOO_LARGE",
  "INTRO_ANALYTICS_INVALID_INPUT",
  "INTRO_ANALYTICS_UNAVAILABLE",
] as const;
export type IntroductionAnalyticsErrorCode = (typeof INTRODUCTION_ANALYTICS_ERROR_CODES)[number];

export class IntroductionAnalyticsError extends Error {
  readonly code: IntroductionAnalyticsErrorCode;
  constructor(code: IntroductionAnalyticsErrorCode, message?: string) {
    super(message ?? code);
    this.name = "IntroductionAnalyticsError";
    this.code = code;
  }
}

export function toIntroductionAnalyticsError(err: unknown): IntroductionAnalyticsError {
  if (err instanceof IntroductionAnalyticsError) return err;
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (/forbidden|42501/i.test(msg))
    return new IntroductionAnalyticsError("INTRO_ANALYTICS_FORBIDDEN", msg);
  if (/range_too_large|22023/i.test(msg))
    return new IntroductionAnalyticsError("INTRO_ANALYTICS_RANGE_TOO_LARGE", msg);
  return new IntroductionAnalyticsError("INTRO_ANALYTICS_UNAVAILABLE", msg);
}

/** Pure helpers — used by service & tests. */
export function safeRate(num: number, den: number): number | null {
  if (!Number.isFinite(num) || !Number.isFinite(den) || den <= 0) return null;
  const r = num / den;
  return Number.isFinite(r) ? r : null;
}

export function computeRates(c: FunnelCountsDTO): FunnelRatesDTO {
  return {
    acceptanceRate: safeRate(c.accepted, c.requested),
    deliveryRate: safeRate(c.delivered, c.accepted),
    acknowledgmentRate: safeRate(c.acknowledged, c.delivered),
    connectionConversion: safeRate(c.connected, c.acknowledged),
    progressionRate: safeRate(c.connected + c.progressed, c.acknowledged),
  };
}

export function isLowSample(sampleSize: number): boolean {
  return sampleSize < ANALYTICS_LOW_SAMPLE_THRESHOLD;
}
