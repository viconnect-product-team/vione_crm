// BC-7.7 Turn B2 — CalendarSyncService.
// Orchestrates: pending/retry projections → provider adapter → status update.
// The service is provider-agnostic: adapters live behind CalendarProviderAdapter.
// Runs server-side only (imports the service-role client for claim/update).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CalendarProviderAdapter } from "./calendar-provider.port";
import type { CalendarProvider, CalendarSyncStatus } from "./types";
import { CalendarError, toCalendarError, type CalendarErrorCode } from "./errors";
import { classifyRetry, type RetryDecision } from "./retry";

export interface ProjectionRow {
  id: string;
  meetingId: string;
  participantUserId: string;
  provider: CalendarProvider;
  syncStatus: CalendarSyncStatus;
  retryCount: number;
  lastErrorCode: CalendarErrorCode | null;
  externalEventRef: string | null;
}

export interface MeetingScheduleSnapshot {
  meetingId: string;
  title: string;
  description: string | null;
  scheduledStartAt: string;
  scheduledEndAt: string;
  scheduledTimezone: string;
  location: string | null;
  virtualJoinUrl: string | null;
}

export interface SyncOutcome {
  projectionId: string;
  decision: "synced" | "cancelled" | "retry_scheduled" | "failed";
  errorCode?: CalendarErrorCode;
  externalEventRef?: string;
}

/**
 * Adapter resolver — production wires per-provider adapters. Tests can
 * inject a stub that always returns the internal adapter or a mock.
 */
export type AdapterResolver = (provider: CalendarProvider) => CalendarProviderAdapter;

export interface CalendarSyncServiceDeps {
  supabase: SupabaseClient;
  adapters: AdapterResolver;
  now?: () => Date;
  random?: () => number;
}

export function createCalendarSyncService(deps: CalendarSyncServiceDeps) {
  const now = deps.now ?? (() => new Date());
  const random = deps.random ?? Math.random;

  async function loadMeetingSnapshot(meetingId: string): Promise<MeetingScheduleSnapshot | null> {
    const { data, error } = await deps.supabase
      .from("business_meetings")
      .select(
        "id, title, description, scheduled_start_at, scheduled_end_at, scheduled_timezone, status, scheduling_mode",
      )
      .eq("id", meetingId)
      .maybeSingle();
    if (error) throw toCalendarError(error);
    if (!data) return null;
    if (data.scheduling_mode !== "scheduled" || !data.scheduled_start_at) return null;
    return {
      meetingId: String(data.id),
      title: String(data.title ?? "Meeting"),
      description: (data.description as string | null) ?? null,
      scheduledStartAt: String(data.scheduled_start_at),
      scheduledEndAt: String(data.scheduled_end_at),
      scheduledTimezone: String(data.scheduled_timezone),
      location: null,
      virtualJoinUrl: null,
    };
  }

  async function persistOutcome(projection: ProjectionRow, outcome: SyncOutcome): Promise<void> {
    const patch: Record<string, unknown> = {
      sync_status: outcome.decision === "retry_scheduled" ? "retry_scheduled" : outcome.decision,
      last_error_code: outcome.errorCode ?? null,
      updated_at: now().toISOString(),
    };
    if (outcome.decision === "synced") {
      patch.last_synced_at = now().toISOString();
      patch.retry_count = 0;
      patch.retry_after_at = null;
      patch.permanent_failure = false;
      if (outcome.externalEventRef) patch.external_event_ref = outcome.externalEventRef;
    } else if (outcome.decision === "failed") {
      patch.permanent_failure = true;
      patch.retry_after_at = null;
    }
    const { error } = await deps.supabase
      .from("business_meeting_calendar_projections")
      .update(patch)
      .eq("id", projection.id);
    if (error) throw toCalendarError(error);
  }

  async function scheduleRetry(
    projection: ProjectionRow,
    decision: Extract<RetryDecision, { kind: "retry" }>,
  ): Promise<void> {
    const { error } = await deps.supabase
      .from("business_meeting_calendar_projections")
      .update({
        sync_status: "retry_scheduled",
        retry_after_at: decision.nextRetryAfterAt,
        retry_count: decision.retryCount,
        updated_at: now().toISOString(),
      })
      .eq("id", projection.id);
    if (error) throw toCalendarError(error);
  }

  async function syncOne(projection: ProjectionRow): Promise<SyncOutcome> {
    const adapter = deps.adapters(projection.provider);
    try {
      const snapshot = await loadMeetingSnapshot(projection.meetingId);
      if (!snapshot) {
        // Meeting no longer scheduled — cancel any prior external event.
        if (projection.externalEventRef) {
          await adapter.cancelCalendarEvent(
            projection.participantUserId,
            projection.externalEventRef,
          );
        }
        const outcome: SyncOutcome = { projectionId: projection.id, decision: "cancelled" };
        await persistOutcome(projection, outcome);
        return outcome;
      }

      const eventInput = {
        meetingId: snapshot.meetingId,
        title: snapshot.title,
        description: snapshot.description ?? undefined,
        startAt: snapshot.scheduledStartAt,
        endAt: snapshot.scheduledEndAt,
        timezone: snapshot.scheduledTimezone,
        location: snapshot.location ?? undefined,
        virtualJoinUrl: snapshot.virtualJoinUrl ?? undefined,
      };

      const ref = projection.externalEventRef
        ? await adapter.updateCalendarEvent(
            projection.participantUserId,
            projection.externalEventRef,
            eventInput,
          )
        : await adapter.createCalendarEvent(projection.participantUserId, eventInput);

      const outcome: SyncOutcome = {
        projectionId: projection.id,
        decision: "synced",
        externalEventRef: ref.externalEventRef,
      };
      await persistOutcome(projection, outcome);
      return outcome;
    } catch (err) {
      const cal = err instanceof CalendarError ? err : toCalendarError(err);
      const decision = classifyRetry({
        errorCode: cal.code,
        currentRetryCount: projection.retryCount,
        now: now(),
        random,
      });
      if (decision.kind === "retry") {
        await scheduleRetry(projection, decision);
        return {
          projectionId: projection.id,
          decision: "retry_scheduled",
          errorCode: cal.code,
        };
      }
      const outcome: SyncOutcome = {
        projectionId: projection.id,
        decision: "failed",
        errorCode: cal.code,
      };
      await persistOutcome(projection, outcome);
      return outcome;
    }
  }

  async function claimAndProcessBatch(limit = 20): Promise<SyncOutcome[]> {
    const { data, error } = await deps.supabase.rpc("business_meeting_calendar_projections_claim", {
      _limit: limit,
      _now: now().toISOString(),
    });
    if (error) throw toCalendarError(error);
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const outcomes: SyncOutcome[] = [];
    for (const r of rows) {
      const p: ProjectionRow = {
        id: String(r.id),
        meetingId: String(r.meeting_id),
        participantUserId: String(r.participant_user_id),
        provider: r.provider as CalendarProvider,
        syncStatus: r.sync_status as CalendarSyncStatus,
        retryCount: Number(r.retry_count ?? 0),
        lastErrorCode: (r.last_error_code as CalendarErrorCode | null) ?? null,
        externalEventRef: (r.external_event_ref as string | null) ?? null,
      };
      outcomes.push(await syncOne(p));
    }
    return outcomes;
  }

  return { syncOne, claimAndProcessBatch, loadMeetingSnapshot };
}

export type CalendarSyncService = ReturnType<typeof createCalendarSyncService>;
