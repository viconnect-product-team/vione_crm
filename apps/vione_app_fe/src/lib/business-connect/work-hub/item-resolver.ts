// BC-8.0 — Pure item resolvers. Transform canonical domain DTOs into
// WorkHubItemDTO. No I/O, no supabase, no dates.now — takes an injected
// `now` for determinism.

import { WORK_HUB_KIND_REGISTRY, WORK_HUB_ACTION_LABEL_KEYS } from "./registry";
import {
  WORK_HUB_PRIORITY_VERSION,
  WORK_HUB_WINDOWS,
  type WorkHubActionDTO,
  type WorkHubDisplayData,
  type WorkHubItemDTO,
  type WorkHubItemKind,
  type WorkHubSourceType,
} from "./types";

interface ResolveContextBase {
  now: string;
  viewerCanRoute?: boolean;
}

function buildAction(
  kind: WorkHubItemKind,
  targetRoute: string | null,
  targetParams: Record<string, string> | null = null,
  targetSearch: Record<string, string | number | boolean> | null = null,
  mutationCapability: WorkHubActionDTO["mutationCapability"] | undefined = null,
  requiresConfirmation = false,
): WorkHubActionDTO {
  const descriptor = WORK_HUB_KIND_REGISTRY[kind];
  return {
    kind: descriptor.actionKind,
    labelKey: WORK_HUB_ACTION_LABEL_KEYS[descriptor.actionKind],
    targetRoute,
    targetParams,
    targetSearch,
    mutationCapability: mutationCapability ?? null,
    requiresConfirmation,
  };
}

function makeId(source: WorkHubSourceType, sourceRecordId: string, kind: WorkHubItemKind): string {
  return `${source}:${sourceRecordId}:${kind}`;
}

function makeDedupeKey(source: WorkHubSourceType, sourceRecordId: string): string {
  return `${source}:${sourceRecordId}`;
}

function base(
  source: WorkHubSourceType,
  sourceRecordId: string,
  kind: WorkHubItemKind,
  {
    dueAt = null,
    startsAt = null,
    occurredAt = null,
    status = null,
    display = {},
    context = {},
    action,
    secondaryAction = null,
    viewerCanRoute = true,
    canInlineMutate = false,
  }: {
    dueAt?: string | null;
    startsAt?: string | null;
    occurredAt?: string | null;
    status?: string | null;
    display?: WorkHubDisplayData;
    context?: Record<string, string | number | boolean | null>;
    action: WorkHubActionDTO;
    secondaryAction?: WorkHubActionDTO | null;
    viewerCanRoute?: boolean;
    canInlineMutate?: boolean;
  },
): WorkHubItemDTO {
  const descriptor = WORK_HUB_KIND_REGISTRY[kind];
  return {
    id: makeId(source, sourceRecordId, kind),
    sourceType: source,
    sourceRecordId,
    itemKind: kind,
    category: descriptor.category,
    priority: descriptor.priority,
    urgency: descriptor.urgency,
    titleKey: descriptor.titleKey,
    descriptionKey: descriptor.descriptionKey,
    safeDisplayData: display,
    dueAt,
    startsAt,
    occurredAt,
    status,
    action,
    secondaryAction,
    context,
    viewerPermissions: {
      canRoute: viewerCanRoute,
      canInlineMutate: canInlineMutate,
    },
    dedupeKey: makeDedupeKey(source, sourceRecordId),
    registryVersion: WORK_HUB_PRIORITY_VERSION,
  };
}

// ── Resolvers per source ────────────────────────────────────────────────────

export interface ConnectionRequestLike {
  id: string;
  direction: "incoming" | "outgoing";
  status: string;
  createdAt: string;
  counterpartHandle?: string | null;
  counterpartDisplayName?: string | null;
  counterpartAvatarUrl?: string | null;
}

export function resolveConnectionRequest(
  req: ConnectionRequestLike,
  _ctx: ResolveContextBase,
): WorkHubItemDTO | null {
  const isPending = req.status === "pending";
  if (!isPending) return null;
  const kind: WorkHubItemKind =
    req.direction === "incoming"
      ? "connection_request_received"
      : "connection_request_sent_waiting";
  const display: WorkHubDisplayData = {
    counterpartHandle: req.counterpartHandle ?? null,
    counterpartDisplayName: req.counterpartDisplayName ?? null,
    counterpartAvatarUrl: req.counterpartAvatarUrl ?? null,
    scalars: { direction: req.direction },
  };
  const action = buildAction(
    kind,
    "/business-connect/connections",
    null,
    { requestId: req.id },
    req.direction === "incoming" ? "accept_connection_request" : null,
    false,
  );
  return base("connection", req.id, kind, {
    occurredAt: req.createdAt,
    status: req.status,
    display,
    action,
    canInlineMutate: req.direction === "incoming",
    context: { direction: req.direction },
  });
}

export interface IntroductionRequestLike {
  id: string;
  role: "requester" | "intermediary" | "target";
  status: string;
  createdAt: string;
  targetPersonNodeId?: string | null;
  counterpartDisplayName?: string | null;
}

export function resolveIntroductionRequest(
  req: IntroductionRequestLike,
  _ctx: ResolveContextBase,
): WorkHubItemDTO | null {
  if (req.role === "intermediary" && req.status === "pending") {
    return base("introduction_request", req.id, "introduction_request_received", {
      occurredAt: req.createdAt,
      status: req.status,
      display: {
        counterpartDisplayName: req.counterpartDisplayName ?? null,
        scalars: { role: req.role },
      },
      action: buildAction(
        "introduction_request_received",
        "/business-connect/introductions/inbox",
        null,
        { requestId: req.id },
      ),
    });
  }
  if (req.role === "intermediary" && req.status === "accepted") {
    return base("introduction_request", req.id, "introduction_request_accepted_waiting_delivery", {
      occurredAt: req.createdAt,
      status: req.status,
      display: {
        counterpartDisplayName: req.counterpartDisplayName ?? null,
      },
      action: buildAction(
        "introduction_request_accepted_waiting_delivery",
        "/business-connect/introductions/deliveries",
        null,
        { requestId: req.id },
      ),
    });
  }
  return null;
}

export interface IntroductionDeliveryLike {
  id: string;
  status: string;
  createdAt: string;
  counterpartDisplayName?: string | null;
}

export function resolveIntroductionDelivery(d: IntroductionDeliveryLike): WorkHubItemDTO | null {
  if (d.status !== "delivered" && d.status !== "sent") return null;
  return base("introduction_delivery", d.id, "introduction_delivery_received", {
    occurredAt: d.createdAt,
    status: d.status,
    display: {
      counterpartDisplayName: d.counterpartDisplayName ?? null,
    },
    action: buildAction(
      "introduction_delivery_received",
      "/business-connect/introductions/deliveries",
      null,
      { deliveryId: d.id },
      "acknowledge_introduction_delivery",
    ),
    canInlineMutate: true,
  });
}

export interface MeetingWorkspaceItemLike {
  meetingId: string;
  status: string;
  bucket: "overview" | "upcoming" | "unscheduled" | "history" | "needs_action";
  suggestedActionKind: string;
  scheduledStartAt: string | null;
  viewerRole: string;
  counterpartDisplayName?: string | null;
  hasOutcome?: boolean;
  isEvent?: boolean;
  communityId?: string;
}

export function resolveMeetingWorkspaceItem(
  m: MeetingWorkspaceItemLike,
  ctx: ResolveContextBase,
): WorkHubItemDTO | null {
  const isEvent = m.isEvent === true;
  const target = isEvent
    ? `/connect-app/community/${m.communityId}/events/${m.meetingId}`
    : `/business-connect/meetings/${m.meetingId}`;
  const display: WorkHubDisplayData = {
    counterpartDisplayName: m.counterpartDisplayName ?? null,
    scalars: { viewerRole: m.viewerRole, status: m.status },
  };

  const map: Partial<Record<string, WorkHubItemKind>> = {
    respond_meeting: "meeting_invitation_response_required",
    respond_time_proposal: "meeting_time_response_required",
    select_final_time: "meeting_final_time_selection_ready",
    schedule_meeting: "meeting_schedule_required",
  };
  const actionable = map[m.suggestedActionKind];
  if (actionable) {
    return base("meeting_scheduling", m.meetingId, actionable, {
      startsAt: m.scheduledStartAt,
      status: m.status,
      display,
      action: buildAction(actionable, target),
    });
  }

  // Upcoming (confirmed + future within window, or today)
  const isToday =
    m.scheduledStartAt &&
    new Date(m.scheduledStartAt).toDateString() === new Date(ctx.now).toDateString();
  if (m.bucket === "upcoming" && m.scheduledStartAt && (m.scheduledStartAt >= ctx.now || isToday)) {
    const start = Date.parse(m.scheduledStartAt);
    const now = Date.parse(ctx.now);
    const days = (start - now) / 86_400_000;
    if (days <= WORK_HUB_WINDOWS.upcomingDays) {
      return base("meeting", m.meetingId, "meeting_upcoming", {
        startsAt: m.scheduledStartAt,
        status: m.status,
        display,
        action: buildAction("meeting_upcoming", target),
      });
    }
  }

  // Recently past confirmed meeting with no outcome recorded → outcome missing
  if (
    m.status === "completed" &&
    m.hasOutcome === false &&
    m.scheduledStartAt &&
    m.scheduledStartAt < ctx.now
  ) {
    return base("meeting_outcome", m.meetingId, "meeting_outcome_missing", {
      occurredAt: m.scheduledStartAt,
      status: m.status,
      display,
      action: buildAction("meeting_outcome_missing", target),
    });
  }

  return null;
}

export interface MeetingFollowUpLike {
  id: string;
  meetingId: string;
  status: string;
  dueAt: string | null;
  temporalState: "active" | "due_soon" | "overdue" | "completed" | "cancelled";
  title?: string | null;
}

export function resolveMeetingFollowUp(f: MeetingFollowUpLike): WorkHubItemDTO | null {
  const kindMap: Partial<Record<string, WorkHubItemKind>> = {
    overdue: "meeting_follow_up_overdue",
    due_soon: "meeting_follow_up_due_soon",
    active: "meeting_follow_up_active",
  };
  const kind = kindMap[f.temporalState];
  if (!kind) return null;
  const target = `/business-connect/meetings/${f.meetingId}`;
  return base("meeting_follow_up", f.id, kind, {
    dueAt: f.dueAt,
    status: f.status,
    display: {
      scalars: {
        temporalState: f.temporalState,
        ...(f.title ? { titleHint: f.title.slice(0, 80) } : {}),
      },
    },
    action: buildAction(kind, target, null, { followUpId: f.id }),
  });
}

export interface RelationshipActivityLike {
  id: string;
  occurredAt: string;
  eventKind: string;
  personNodeId?: string | null;
  counterpartDisplayName?: string | null;
}

export function resolveRelationshipActivity(
  ev: RelationshipActivityLike,
  ctx: ResolveContextBase,
): WorkHubItemDTO | null {
  const occurred = Date.parse(ev.occurredAt);
  const now = Date.parse(ctx.now);
  const days = (now - occurred) / 86_400_000;
  if (days < 0 || days > WORK_HUB_WINDOWS.recentDays) return null;
  const target = ev.personNodeId
    ? `/business-connect/connections/${ev.personNodeId}`
    : "/business-connect/relationship-timeline";
  return base("relationship_activity", ev.id, "relationship_activity_recent", {
    occurredAt: ev.occurredAt,
    status: ev.eventKind,
    display: {
      counterpartDisplayName: ev.counterpartDisplayName ?? null,
      scalars: { eventKind: ev.eventKind },
    },
    action: buildAction(
      "relationship_activity_recent",
      target,
      ev.personNodeId ? { personNodeId: ev.personNodeId } : null,
    ),
  });
}
