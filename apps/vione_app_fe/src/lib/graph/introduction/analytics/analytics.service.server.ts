// BC-6.7 — Introduction Analytics Service (server-only).
// Thin wrapper over SECURITY DEFINER RPCs. No raw lifecycle scans.
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ANALYTICS_MAX_RANGE_DAYS,
  INTRODUCTION_ANALYTICS_VERSION,
  IntroductionAnalyticsError,
  computeRates,
  isLowSample,
  toIntroductionAnalyticsError,
  type AnalyticsFilters,
  type ConfidencePerformanceDTO,
  type FunnelCountsDTO,
  type IntermediaryImpactDTO,
  type IntroductionAnalyticsScopeType,
  type OverviewDTO,
  type PathPerformanceDTO,
  type TimeToOutcomeDTO,
  type TrendDTO,
} from "./types";

type DB = SupabaseClient<any>;

interface OverviewRow {
  requested_count: number | string;
  accepted_count: number | string;
  delivered_count: number | string;
  acknowledged_count: number | string;
  connected_count: number | string;
  progressed_count: number | string;
  not_connected_count: number | string;
  closed_no_outcome_count: number | string;
  expired_count: number | string;
  total_accept_seconds: number | string;
  total_delivery_seconds: number | string;
  total_ack_seconds: number | string;
  total_connect_seconds: number | string;
  total_progressed_seconds: number | string;
}

function n(v: number | string | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v) || 0;
}

function nOrNull(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : null;
}

function countsFromRow(r: OverviewRow): FunnelCountsDTO {
  return {
    requested: n(r.requested_count),
    accepted: n(r.accepted_count),
    delivered: n(r.delivered_count),
    acknowledged: n(r.acknowledged_count),
    connected: n(r.connected_count),
    progressed: n(r.progressed_count),
    notConnected: n(r.not_connected_count),
    closedNoOutcome: n(r.closed_no_outcome_count),
    expired: n(r.expired_count),
  };
}

function sampleSizeFrom(c: FunnelCountsDTO): number {
  // Denominator hint = number of requested introductions in the window.
  return c.requested;
}

function assertRange(from: string, to: string): void {
  const f = Date.parse(from);
  const t = Date.parse(to);
  if (!Number.isFinite(f) || !Number.isFinite(t) || t < f) {
    throw new IntroductionAnalyticsError("INTRO_ANALYTICS_INVALID_INPUT", "invalid date range");
  }
  const days = Math.floor((t - f) / 86_400_000);
  if (days > ANALYTICS_MAX_RANGE_DAYS) {
    throw new IntroductionAnalyticsError(
      "INTRO_ANALYTICS_RANGE_TOO_LARGE",
      `range exceeds ${ANALYTICS_MAX_RANGE_DAYS} days`,
    );
  }
}

function scopeIdFor(
  scope: IntroductionAnalyticsScopeType,
  viewerUid: string | null,
): string | null {
  if (scope === "platform") return null;
  if (!viewerUid) {
    throw new IntroductionAnalyticsError("INTRO_ANALYTICS_FORBIDDEN");
  }
  return viewerUid;
}

export class IntroductionAnalyticsService {
  constructor(
    private readonly sb: DB,
    private readonly viewerUserId: string | null,
  ) {}

  async getOverview(f: AnalyticsFilters): Promise<OverviewDTO> {
    assertRange(f.fromDate, f.toDate);
    const scopeId = scopeIdFor(f.scope, this.viewerUserId);
    try {
      const { data, error } = await this.sb.rpc("intro_analytics_overview", {
        p_scope_type: f.scope,
        p_scope_id: scopeId,
        p_from: f.fromDate,
        p_to: f.toDate,
        p_path_depth: f.pathDepth,
        p_confidence: f.confidence,
      });
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as OverviewRow | undefined;
      const counts = row
        ? countsFromRow(row)
        : ({
            requested: 0,
            accepted: 0,
            delivered: 0,
            acknowledged: 0,
            connected: 0,
            progressed: 0,
            notConnected: 0,
            closedNoOutcome: 0,
            expired: 0,
          } as FunnelCountsDTO);
      const sample = sampleSizeFrom(counts);
      return {
        filters: f,
        counts,
        rates: computeRates(counts),
        sampleSize: sample,
        lowSample: isLowSample(sample),
        analyticsVersion: INTRODUCTION_ANALYTICS_VERSION,
      };
    } catch (err) {
      throw toIntroductionAnalyticsError(err);
    }
  }

  async getTrend(f: AnalyticsFilters): Promise<TrendDTO> {
    assertRange(f.fromDate, f.toDate);
    const scopeId = scopeIdFor(f.scope, this.viewerUserId);
    try {
      const { data, error } = await this.sb.rpc("intro_analytics_trend", {
        p_scope_type: f.scope,
        p_scope_id: scopeId,
        p_from: f.fromDate,
        p_to: f.toDate,
        p_path_depth: f.pathDepth,
        p_confidence: f.confidence,
      });
      if (error) throw error;
      const rows = (data ?? []) as Array<OverviewRow & { metric_date: string }>;
      return {
        filters: f,
        points: rows.map((r: any) => ({
          metricDate: r.metric_date,
          counts: countsFromRow(r),
        })),
        analyticsVersion: INTRODUCTION_ANALYTICS_VERSION,
      };
    } catch (err) {
      throw toIntroductionAnalyticsError(err);
    }
  }

  async getTimeToOutcome(f: AnalyticsFilters): Promise<TimeToOutcomeDTO> {
    assertRange(f.fromDate, f.toDate);
    const scopeId = scopeIdFor(f.scope, this.viewerUserId);
    try {
      const { data, error } = await this.sb.rpc("intro_analytics_time_to_outcome", {
        p_scope_type: f.scope,
        p_scope_id: scopeId,
        p_from: f.fromDate,
        p_to: f.toDate,
        p_path_depth: f.pathDepth,
        p_confidence: f.confidence,
      });
      if (error) throw error;
      const rows = (data ?? []) as Array<{
        metric_kind: string;
        sample_size: number | string;
        p50_seconds: number | string | null;
        p75_seconds: number | string | null;
        p90_seconds: number | string | null;
      }>;
      return {
        filters: f,
        rows: rows.map((r: any) => {
          const sample = n(r.sample_size);
          return {
            metric: r.metric_kind as TimeToOutcomeDTO["rows"][number]["metric"],
            sampleSize: sample,
            lowSample: isLowSample(sample),
            p50Seconds: nOrNull(r.p50_seconds),
            p75Seconds: nOrNull(r.p75_seconds),
            p90Seconds: nOrNull(r.p90_seconds),
          };
        }),
        analyticsVersion: INTRODUCTION_ANALYTICS_VERSION,
      };
    } catch (err) {
      throw toIntroductionAnalyticsError(err);
    }
  }

  async getPathPerformance(f: AnalyticsFilters): Promise<PathPerformanceDTO> {
    assertRange(f.fromDate, f.toDate);
    const scopeId = scopeIdFor(f.scope, this.viewerUserId);
    try {
      const { data, error } = await this.sb.rpc("intro_analytics_path_performance", {
        p_scope_type: f.scope,
        p_scope_id: scopeId,
        p_from: f.fromDate,
        p_to: f.toDate,
        p_confidence: f.confidence,
      });
      if (error) throw error;
      const rows = (data ?? []) as Array<{
        path_depth: number;
        requested_count: number | string;
        accepted_count: number | string;
        delivered_count: number | string;
        acknowledged_count: number | string;
        connected_count: number | string;
        progressed_count: number | string;
      }>;
      const { pathDepth: _p, ...rest } = f;
      return {
        filters: rest,
        buckets: rows
          .filter((r) => r.path_depth === 2 || r.path_depth === 3)
          .map((r: any) => {
            const counts = {
              requested: n(r.requested_count),
              accepted: n(r.accepted_count),
              delivered: n(r.delivered_count),
              acknowledged: n(r.acknowledged_count),
              connected: n(r.connected_count),
              progressed: n(r.progressed_count),
            };
            const rates = computeRates({
              ...counts,
              notConnected: 0,
              closedNoOutcome: 0,
              expired: 0,
            });
            return {
              pathDepth: r.path_depth as 2 | 3,
              counts,
              rates: {
                acceptanceRate: rates.acceptanceRate,
                deliveryRate: rates.deliveryRate,
                acknowledgmentRate: rates.acknowledgmentRate,
                connectionConversion: rates.connectionConversion,
                progressionRate: rates.progressionRate,
              },
              sampleSize: counts.requested,
              lowSample: isLowSample(counts.requested),
            };
          }),
        analyticsVersion: INTRODUCTION_ANALYTICS_VERSION,
      };
    } catch (err) {
      throw toIntroductionAnalyticsError(err);
    }
  }

  async getConfidencePerformance(f: AnalyticsFilters): Promise<ConfidencePerformanceDTO> {
    assertRange(f.fromDate, f.toDate);
    const scopeId = scopeIdFor(f.scope, this.viewerUserId);
    try {
      const { data, error } = await this.sb.rpc("intro_analytics_confidence_performance", {
        p_scope_type: f.scope,
        p_scope_id: scopeId,
        p_from: f.fromDate,
        p_to: f.toDate,
        p_path_depth: f.pathDepth,
      });
      if (error) throw error;
      const rows = (data ?? []) as Array<{
        confidence_bucket: string;
        requested_count: number | string;
        accepted_count: number | string;
        delivered_count: number | string;
        acknowledged_count: number | string;
        connected_count: number | string;
        progressed_count: number | string;
      }>;
      const { confidence: _c, ...rest } = f;
      return {
        filters: rest,
        buckets: rows
          .filter(
            (r) =>
              r.confidence_bucket === "low" ||
              r.confidence_bucket === "medium" ||
              r.confidence_bucket === "high",
          )
          .map((r: any) => {
            const counts = {
              requested: n(r.requested_count),
              accepted: n(r.accepted_count),
              delivered: n(r.delivered_count),
              acknowledged: n(r.acknowledged_count),
              connected: n(r.connected_count),
              progressed: n(r.progressed_count),
            };
            const rates = computeRates({
              ...counts,
              notConnected: 0,
              closedNoOutcome: 0,
              expired: 0,
            });
            return {
              bucket: r.confidence_bucket as "low" | "medium" | "high",
              counts,
              rates: {
                acceptanceRate: rates.acceptanceRate,
                acknowledgmentRate: rates.acknowledgmentRate,
                connectionConversion: rates.connectionConversion,
                progressionRate: rates.progressionRate,
              },
              sampleSize: counts.requested,
              lowSample: isLowSample(counts.requested),
            };
          }),
        analyticsVersion: INTRODUCTION_ANALYTICS_VERSION,
      };
    } catch (err) {
      throw toIntroductionAnalyticsError(err);
    }
  }

  async getIntermediaryImpact(fromDate: string, toDate: string): Promise<IntermediaryImpactDTO> {
    assertRange(fromDate, toDate);
    if (!this.viewerUserId) {
      throw new IntroductionAnalyticsError("INTRO_ANALYTICS_FORBIDDEN");
    }
    try {
      const { data, error } = await this.sb.rpc("intro_analytics_intermediary_impact", {
        p_from: fromDate,
        p_to: toDate,
      });
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as
        | (OverviewRow & { median_deliver_seconds: number | string | null })
        | undefined;
      const counts = row
        ? {
            requested: n(row.requested_count),
            accepted: n(row.accepted_count),
            delivered: n(row.delivered_count),
            acknowledged: n(row.acknowledged_count),
            connected: n(row.connected_count),
            progressed: n(row.progressed_count),
          }
        : {
            requested: 0,
            accepted: 0,
            delivered: 0,
            acknowledged: 0,
            connected: 0,
            progressed: 0,
          };
      const sample = counts.requested;
      return {
        fromDate,
        toDate,
        counts,
        medianDeliverSeconds: row ? nOrNull(row.median_deliver_seconds) : null,
        sampleSize: sample,
        lowSample: isLowSample(sample),
        analyticsVersion: INTRODUCTION_ANALYTICS_VERSION,
      };
    } catch (err) {
      throw toIntroductionAnalyticsError(err);
    }
  }
}
