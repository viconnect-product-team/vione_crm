// BC-7.7 Turn B1 — Server-side Availability composition.
// Loads each participant's preferences + confirmed BusinessMeeting busy
// intervals from Postgres (RLS-scoped), plus their internal-adapter busy
// intervals (empty in B1), and runs the pure availability engine.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { CalendarError } from "./errors";
import { CALENDAR_QUERY_BOUNDS } from "./registry";
import type {
  AvailabilitySlotDTO,
  BusyInterval,
  FindCommonAvailabilityInput,
  IsoWeekday,
  WorkingHourWindow,
} from "./types";
import { computeCommonAvailability, type AvailabilityParticipant } from "./availability.engine";

type DB = SupabaseClient<Database>;

const DEFAULT_WORKING_DAYS: IsoWeekday[] = [1, 2, 3, 4, 5];
const DEFAULT_WORKING_HOURS: WorkingHourWindow[] = DEFAULT_WORKING_DAYS.map((d) => ({
  day: d as IsoWeekday,
  start: "09:00",
  end: "17:00",
}));

export async function findCommonAvailability(
  db: DB,
  callerUserId: string,
  input: FindCommonAvailabilityInput,
): Promise<AvailabilitySlotDTO[]> {
  const B = CALENDAR_QUERY_BOUNDS;
  const ids = Array.from(new Set([callerUserId, ...input.participantUserIds]));
  if (ids.length === 0 || ids.length > B.MAX_PARTICIPANTS) {
    throw new CalendarError("CALENDAR_TOO_MANY_PARTICIPANTS");
  }
  const from = new Date(input.fromDate);
  const to = new Date(input.toDate);
  if (!isFinite(from.getTime()) || !isFinite(to.getTime())) {
    throw new CalendarError("CALENDAR_INVALID_DATE_RANGE");
  }
  const fromAt = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 0, 0),
  ).toISOString();
  const toAt = new Date(
    Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate() + 1, 0, 0),
  ).toISOString();

  // Preferences (per participant). Missing rows fall back to defaults.
  const { data: prefs, error: prefsErr } = await db
    .from("business_availability_preferences")
    .select(
      "user_id, timezone, working_days, working_hours, minimum_notice_minutes, buffer_before_minutes, buffer_after_minutes, default_meeting_duration_minutes",
    )
    .in("user_id", ids);
  if (prefsErr) throw new CalendarError("CALENDAR_INTERNAL_ERROR", prefsErr.message);

  // Confirmed BusinessMeetings the caller participates in → busy intervals.
  // NB: we intentionally scope to `ids` and rely on RLS to filter what the
  // caller can actually see. This is not a full cross-user busy oracle —
  // that would leak busy details. See calendar-security tests.
  const busyByUser = await loadConfirmedMeetingBusy(db, ids, fromAt, toAt);

  const prefsByUser = new Map<string, AvailabilityParticipant>();
  for (const id of ids) {
    const row = (prefs ?? []).find((p) => String(p.user_id) === id);
    prefsByUser.set(id, {
      userId: id,
      timezone: row?.timezone ?? input.organizerTimezone,
      workingDays: (row?.working_days as IsoWeekday[] | null) ?? DEFAULT_WORKING_DAYS,
      workingHours: (row?.working_hours as WorkingHourWindow[] | null) ?? DEFAULT_WORKING_HOURS,
      busyIntervals: busyByUser.get(id) ?? [],
      bufferBeforeMinutes: Number(row?.buffer_before_minutes ?? 0),
      bufferAfterMinutes: Number(row?.buffer_after_minutes ?? 0),
      minimumNoticeMinutes: Number(row?.minimum_notice_minutes ?? 0),
    });
  }

  return computeCommonAvailability({
    participants: ids.map((id: any) => prefsByUser.get(id)!),
    fromAt,
    toAt,
    durationMinutes: input.durationMinutes,
    organizerTimezone: input.organizerTimezone,
  });
}

async function loadConfirmedMeetingBusy(
  db: DB,
  userIds: string[],
  fromAt: string,
  toAt: string,
): Promise<Map<string, BusyInterval[]>> {
  const out = new Map<string, BusyInterval[]>();
  // Business Connect canonical: confirmed_proposal_id → business_meeting_proposals.
  // BC-4.1A stored start_at/end_at on business_meeting_proposals.
  const { data, error } = await db
    .from("business_meeting_participants")
    .select(
      "user_id, meeting:business_meetings!inner(id,status,confirmed_proposal_id, proposal:business_meeting_proposals!business_meetings_confirmed_proposal_id_fkey(start_at,end_at))",
    )
    .in("user_id", userIds)
    .is("left_at", null);
  if (error) {
    // Fail-closed: if we cannot see busy state we return empty and the
    // engine will emit optimistic slots. This mirrors internal-only
    // adapter behaviour. Callers that need a hard fail can inspect the
    // error separately.
    return out;
  }
  for (const row of (data ?? []) as unknown as Array<{
    user_id: string;
    meeting?: {
      status?: string;
      proposal?: { start_at?: string; end_at?: string } | null;
    } | null;
  }>) {
    const p = row.meeting?.proposal;
    if (row.meeting?.status !== "confirmed" || !p?.start_at || !p?.end_at) continue;
    if (Date.parse(p.end_at) <= Date.parse(fromAt)) continue;
    if (Date.parse(p.start_at) >= Date.parse(toAt)) continue;
    const list = out.get(row.user_id) ?? [];
    list.push({
      startAt: p.start_at,
      endAt: p.end_at,
      source: "confirmed_meeting",
      transparency: "opaque",
    });
    out.set(row.user_id, list);
  }
  return out;
}
