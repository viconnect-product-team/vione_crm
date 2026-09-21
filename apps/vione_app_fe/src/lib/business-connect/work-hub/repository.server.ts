// BC-8.0 — Work Hub repository. Bounded viewer-scoped reads under RLS.
//
// All reads are safe by construction: they run through the caller's
// authenticated Supabase client, RLS filters to the viewer, and we project
// only PII-safe columns. Failures degrade to an empty array — the Hub is
// a composition layer, never a source of truth (spec §3, §24, §41).

import type { SupabaseClient } from "@supabase/supabase-js";
import { WORK_HUB_SOURCE_READ_LIMIT_DEFAULT, WORK_HUB_WINDOWS } from "./types";

type Sb = SupabaseClient<any, any, any>;

const LIMIT = WORK_HUB_SOURCE_READ_LIMIT_DEFAULT;

async function safe<T>(p: PromiseLike<{ data: T | null; error: unknown }>): Promise<T[]> {
  try {
    const { data, error } = await p;
    if (error || !data) return [];
    return (data as unknown as T[]) ?? [];
  } catch {
    return [];
  }
}

export interface WorkHubRawInput {
  connectionRequests: Array<{
    id: string;
    direction: "incoming" | "outgoing";
    status: string;
    createdAt: string;
    counterpartHandle: string | null;
    counterpartDisplayName: string | null;
    counterpartAvatarUrl: string | null;
  }>;
  introductionRequests: Array<{
    id: string;
    role: "requester" | "intermediary" | "target";
    status: string;
    createdAt: string;
    targetPersonNodeId: string | null;
    counterpartDisplayName: string | null;
  }>;
  introductionDeliveries: Array<{
    id: string;
    status: string;
    createdAt: string;
    counterpartDisplayName: string | null;
  }>;
  meetingWorkspaceItems: Array<{
    meetingId: string;
    status: string;
    bucket: "overview" | "upcoming" | "unscheduled" | "history" | "needs_action";
    suggestedActionKind: string;
    scheduledStartAt: string | null;
    viewerRole: string;
    counterpartDisplayName: string | null;
    hasOutcome: boolean;
  }>;
  meetingFollowUps: Array<{
    id: string;
    meetingId: string;
    status: string;
    dueAt: string | null;
    temporalState: "active" | "due_soon" | "overdue" | "completed" | "cancelled";
    title: string | null;
  }>;
  relationshipActivity: Array<{
    id: string;
    occurredAt: string;
    eventKind: string;
    personNodeId: string | null;
    counterpartDisplayName: string | null;
  }>;
}

function classifyFollowUpTemporal(
  status: string,
  dueAt: string | null,
  now: string,
): "active" | "due_soon" | "overdue" | "completed" | "cancelled" {
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  if (!dueAt) return "active";
  const due = Date.parse(dueAt);
  const n = Date.parse(now);
  if (due < n) return "overdue";
  if ((due - n) / 86_400_000 <= WORK_HUB_WINDOWS.dueSoonDays) return "due_soon";
  return "active";
}

export const WorkHubRepository = {
  async load(sb: Sb, userId: string, now: string): Promise<WorkHubRawInput> {
    const [
      connectionRows,
      introReqRows,
      introDeliveryRows,
      meetingRows,
      followUpRows,
      timelineRows,
    ] = await Promise.all([
      safe(
        sb
          .from("global_connection_requests" as any)
          .select("id, requester_user_id, target_user_id, status, created_at")
          .in("status", ["pending"])
          .order("created_at", { ascending: false })
          .limit(LIMIT) as any,
      ).catch(() => []),
      safe(
        sb
          .from("introduction_requests")
          .select(
            "id, status, created_at, requester_user_id, intermediary_user_id, target_user_id, target_person_node_id",
          )
          .in("status", ["pending", "accepted"])
          .order("created_at", { ascending: false })
          .limit(LIMIT) as any,
      ),
      safe(
        sb
          .from("introduction_deliveries")
          .select("id, status, created_at, recipient_user_id")
          .in("status", ["sent", "delivered"])
          .order("created_at", { ascending: false })
          .limit(LIMIT) as any,
      ),
      safe(
        sb
          .from("business_meetings")
          .select("id, status, scheduled_start_at, organizer_user_id")
          .order("scheduled_start_at", { ascending: true, nullsFirst: false })
          .limit(LIMIT) as any,
      ),
      safe(
        sb
          .from("business_meeting_follow_ups")
          .select("id, meeting_id, status, due_at, title, owner_user_id")
          .in("status", ["open", "in_progress"])
          .order("due_at", { ascending: true, nullsFirst: false })
          .limit(LIMIT) as any,
      ),
      safe(
        sb
          .from("graph_timeline_events")
          .select("id, occurred_at, event_kind, person_node_id")
          .order("occurred_at", { ascending: false })
          .limit(LIMIT) as any,
      ),
    ]);

    return {
      connectionRequests: (connectionRows as any[]).map((r: any) => ({
        id: String(r.id),
        direction: r.requester_user_id === userId ? ("outgoing" as const) : ("incoming" as const),
        status: String(r.status),
        createdAt: String(r.created_at),
        counterpartHandle: null,
        counterpartDisplayName: null,
        counterpartAvatarUrl: null,
      })),
      introductionRequests: (introReqRows as any[]).map((r: any) => {
        const role: "requester" | "intermediary" | "target" =
          r.intermediary_user_id === userId
            ? "intermediary"
            : r.target_user_id === userId
              ? "target"
              : "requester";
        return {
          id: String(r.id),
          role,
          status: String(r.status),
          createdAt: String(r.created_at),
          targetPersonNodeId: r.target_person_node_id ?? null,
          counterpartDisplayName: null,
        };
      }),
      introductionDeliveries: (introDeliveryRows as any[])
        .filter((r) => r.recipient_user_id === userId)
        .map((r: any) => ({
          id: String(r.id),
          status: String(r.status),
          createdAt: String(r.created_at),
          counterpartDisplayName: null,
        })),
      meetingWorkspaceItems: (meetingRows as any[]).map((r: any) => ({
        meetingId: String(r.id),
        status: String(r.status),
        bucket:
          r.status === "confirmed" && r.scheduled_start_at && r.scheduled_start_at >= now
            ? ("upcoming" as const)
            : r.status === "completed"
              ? ("history" as const)
              : ("overview" as const),
        suggestedActionKind:
          r.status === "proposed"
            ? "respond_meeting"
            : r.status === "confirmed" && !r.scheduled_start_at
              ? "schedule_meeting"
              : "view_meeting",
        scheduledStartAt: r.scheduled_start_at ?? null,
        viewerRole: r.organizer_user_id === userId ? "organizer" : "participant",
        counterpartDisplayName: null,
        hasOutcome: false,
      })),
      meetingFollowUps: (followUpRows as any[])
        .filter((r) => r.owner_user_id === userId)
        .map((r: any) => ({
          id: String(r.id),
          meetingId: String(r.meeting_id),
          status: String(r.status),
          dueAt: r.due_at ?? null,
          temporalState: classifyFollowUpTemporal(String(r.status), r.due_at ?? null, now),
          title: r.title ?? null,
        })),
      relationshipActivity: (timelineRows as any[]).map((r: any) => ({
        id: String(r.id),
        occurredAt: String(r.occurred_at),
        eventKind: String(r.event_kind),
        personNodeId: r.person_node_id ?? null,
        counterpartDisplayName: null,
      })),
    };
  },
};
