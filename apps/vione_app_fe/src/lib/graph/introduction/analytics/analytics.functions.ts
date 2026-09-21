// BC-6.7 — Introduction Analytics server-fn boundary.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import type {
  AnalyticsFilters,
  ConfidencePerformanceDTO,
  IntermediaryImpactDTO,
  OverviewDTO,
  PathPerformanceDTO,
  TimeToOutcomeDTO,
  TrendDTO,
} from "./types";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
const scope = z.enum(["self_requester", "self_intermediary", "platform"]);
const confidence = z.enum(["all", "low", "medium", "high"]);
const pathDepth = z.union([z.literal(0), z.literal(2), z.literal(3)]);

const filtersSchema = z.object({
  scope,
  fromDate: isoDate,
  toDate: isoDate,
  pathDepth,
  confidence,
});

export const getIntroductionAnalyticsOverviewFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => filtersSchema.parse(i))
  .handler(async ({ data, context }): Promise<OverviewDTO> => {
    const { IntroductionAnalyticsService } = await import("./analytics.service.server");
    return new IntroductionAnalyticsService(null as any as never, context.userId).getOverview(
      data as AnalyticsFilters,
    );
  });

export const getIntroductionAnalyticsTrendFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => filtersSchema.parse(i))
  .handler(async ({ data, context }): Promise<TrendDTO> => {
    const { IntroductionAnalyticsService } = await import("./analytics.service.server");
    return new IntroductionAnalyticsService(null as any as never, context.userId).getTrend(
      data as AnalyticsFilters,
    );
  });

export const getIntroductionAnalyticsTimeToOutcomeFn = createServerFn({
  method: "GET",
})
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => filtersSchema.parse(i))
  .handler(async ({ data, context }): Promise<TimeToOutcomeDTO> => {
    const { IntroductionAnalyticsService } = await import("./analytics.service.server");
    return new IntroductionAnalyticsService(
      null as any as never,
      context.userId,
    ).getTimeToOutcome(data as AnalyticsFilters);
  });

export const getIntroductionAnalyticsPathPerformanceFn = createServerFn({
  method: "GET",
})
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => filtersSchema.parse(i))
  .handler(async ({ data, context }): Promise<PathPerformanceDTO> => {
    const { IntroductionAnalyticsService } = await import("./analytics.service.server");
    return new IntroductionAnalyticsService(
      null as any as never,
      context.userId,
    ).getPathPerformance(data as AnalyticsFilters);
  });

export const getIntroductionAnalyticsConfidencePerformanceFn = createServerFn({
  method: "GET",
})
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => filtersSchema.parse(i))
  .handler(async ({ data, context }): Promise<ConfidencePerformanceDTO> => {
    const { IntroductionAnalyticsService } = await import("./analytics.service.server");
    return new IntroductionAnalyticsService(
      null as any as never,
      context.userId,
    ).getConfidencePerformance(data as AnalyticsFilters);
  });

export const getIntroductionAnalyticsIntermediaryImpactFn = createServerFn({
  method: "GET",
})
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => z.object({ fromDate: isoDate, toDate: isoDate }).parse(i))
  .handler(async ({ data, context }): Promise<IntermediaryImpactDTO> => {
    const { IntroductionAnalyticsService } = await import("./analytics.service.server");
    return new IntroductionAnalyticsService(
      null as any as never,
      context.userId,
    ).getIntermediaryImpact(data.fromDate, data.toDate);
  });
