// BC-6.7 — IntroductionAnalyticsSDK (client-safe façade). Read-only.
import {
  getIntroductionAnalyticsConfidencePerformanceFn,
  getIntroductionAnalyticsIntermediaryImpactFn,
  getIntroductionAnalyticsOverviewFn,
  getIntroductionAnalyticsPathPerformanceFn,
  getIntroductionAnalyticsTimeToOutcomeFn,
  getIntroductionAnalyticsTrendFn,
} from "./analytics.functions";
import {
  INTRODUCTION_ANALYTICS_VERSION,
  type AnalyticsFilters,
  type ConfidencePerformanceDTO,
  type IntermediaryImpactDTO,
  type OverviewDTO,
  type PathPerformanceDTO,
  type TimeToOutcomeDTO,
  type TrendDTO,
} from "./types";

export const IntroductionAnalyticsSDK = {
  getOverview: (f: AnalyticsFilters): Promise<OverviewDTO> =>
    getIntroductionAnalyticsOverviewFn({ data: f }),
  getTrend: (f: AnalyticsFilters): Promise<TrendDTO> =>
    getIntroductionAnalyticsTrendFn({ data: f }),
  getTimeToOutcome: (f: AnalyticsFilters): Promise<TimeToOutcomeDTO> =>
    getIntroductionAnalyticsTimeToOutcomeFn({ data: f }),
  getPathPerformance: (f: AnalyticsFilters): Promise<PathPerformanceDTO> =>
    getIntroductionAnalyticsPathPerformanceFn({ data: f }),
  getConfidencePerformance: (f: AnalyticsFilters): Promise<ConfidencePerformanceDTO> =>
    getIntroductionAnalyticsConfidencePerformanceFn({ data: f }),
  getIntermediaryImpact: (fromDate: string, toDate: string): Promise<IntermediaryImpactDTO> =>
    getIntroductionAnalyticsIntermediaryImpactFn({ data: { fromDate, toDate } }),
};

export type IntroductionAnalyticsSDKType = typeof IntroductionAnalyticsSDK;

/** Cache keys are scoped so no entry is ever shared across tenants. */
export const introductionAnalyticsKeys = {
  root: ["introduction-analytics", INTRODUCTION_ANALYTICS_VERSION] as const,
  overview: (f: AnalyticsFilters) =>
    [
      "introduction-analytics",
      INTRODUCTION_ANALYTICS_VERSION,
      "overview",
      f.scope,
      f.fromDate,
      f.toDate,
      f.pathDepth,
      f.confidence,
    ] as const,
  trend: (f: AnalyticsFilters) =>
    [
      "introduction-analytics",
      INTRODUCTION_ANALYTICS_VERSION,
      "trend",
      f.scope,
      f.fromDate,
      f.toDate,
      f.pathDepth,
      f.confidence,
    ] as const,
  timeToOutcome: (f: AnalyticsFilters) =>
    [
      "introduction-analytics",
      INTRODUCTION_ANALYTICS_VERSION,
      "tto",
      f.scope,
      f.fromDate,
      f.toDate,
      f.pathDepth,
      f.confidence,
    ] as const,
  pathPerformance: (f: AnalyticsFilters) =>
    [
      "introduction-analytics",
      INTRODUCTION_ANALYTICS_VERSION,
      "path",
      f.scope,
      f.fromDate,
      f.toDate,
      f.confidence,
    ] as const,
  confidencePerformance: (f: AnalyticsFilters) =>
    [
      "introduction-analytics",
      INTRODUCTION_ANALYTICS_VERSION,
      "confidence",
      f.scope,
      f.fromDate,
      f.toDate,
      f.pathDepth,
    ] as const,
  intermediaryImpact: (fromDate: string, toDate: string) =>
    ["introduction-analytics", INTRODUCTION_ANALYTICS_VERSION, "impact", fromDate, toDate] as const,
};
