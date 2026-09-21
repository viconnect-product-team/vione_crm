// BC-6.7 — Introduction Analytics React Query bindings.
import { useQuery } from "@tanstack/react-query";
import {
  IntroductionAnalyticsSDK,
  introductionAnalyticsKeys,
  type AnalyticsFilters,
  type ConfidencePerformanceDTO,
  type IntermediaryImpactDTO,
  type OverviewDTO,
  type PathPerformanceDTO,
  type TimeToOutcomeDTO,
  type TrendDTO,
} from "@/lib/graph/introduction/analytics";

const STALE = 60_000;

export { introductionAnalyticsKeys };

export function useIntroductionAnalyticsOverview(f: AnalyticsFilters, enabled = true) {
  return useQuery<OverviewDTO>({
    queryKey: introductionAnalyticsKeys.overview(f),
    queryFn: () => IntroductionAnalyticsSDK.getOverview(f),
    staleTime: STALE,
    enabled,
  });
}

export function useIntroductionAnalyticsTrend(f: AnalyticsFilters, enabled = true) {
  return useQuery<TrendDTO>({
    queryKey: introductionAnalyticsKeys.trend(f),
    queryFn: () => IntroductionAnalyticsSDK.getTrend(f),
    staleTime: STALE,
    enabled,
  });
}

export function useIntroductionAnalyticsTimeToOutcome(f: AnalyticsFilters, enabled = true) {
  return useQuery<TimeToOutcomeDTO>({
    queryKey: introductionAnalyticsKeys.timeToOutcome(f),
    queryFn: () => IntroductionAnalyticsSDK.getTimeToOutcome(f),
    staleTime: STALE,
    enabled,
  });
}

export function useIntroductionAnalyticsPathPerformance(f: AnalyticsFilters, enabled = true) {
  return useQuery<PathPerformanceDTO>({
    queryKey: introductionAnalyticsKeys.pathPerformance(f),
    queryFn: () => IntroductionAnalyticsSDK.getPathPerformance(f),
    staleTime: STALE,
    enabled,
  });
}

export function useIntroductionAnalyticsConfidencePerformance(f: AnalyticsFilters, enabled = true) {
  return useQuery<ConfidencePerformanceDTO>({
    queryKey: introductionAnalyticsKeys.confidencePerformance(f),
    queryFn: () => IntroductionAnalyticsSDK.getConfidencePerformance(f),
    staleTime: STALE,
    enabled,
  });
}

export function useIntroductionAnalyticsIntermediaryImpact(
  fromDate: string,
  toDate: string,
  enabled = true,
) {
  return useQuery<IntermediaryImpactDTO>({
    queryKey: introductionAnalyticsKeys.intermediaryImpact(fromDate, toDate),
    queryFn: () => IntroductionAnalyticsSDK.getIntermediaryImpact(fromDate, toDate),
    staleTime: STALE,
    enabled,
  });
}
