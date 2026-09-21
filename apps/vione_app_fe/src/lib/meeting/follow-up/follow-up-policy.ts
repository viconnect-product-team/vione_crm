// BC-7.9 Turn B — Pure follow-up authority + state-machine policy.
// No I/O. Every branch is unit-tested.

import {
  MEETING_FOLLOW_UP_DUE_SOON_MS,
  type MeetingFollowUpPriority,
  type MeetingFollowUpStatus,
  type MeetingFollowUpTemporalState,
} from "./types";

// ── State machine ──────────────────────────────────────────────────────────
const TRANSITIONS: ReadonlyMap<MeetingFollowUpStatus, ReadonlySet<MeetingFollowUpStatus>> = new Map(
  [
    ["open", new Set<MeetingFollowUpStatus>(["in_progress", "completed", "cancelled"])],
    ["in_progress", new Set<MeetingFollowUpStatus>(["completed", "cancelled"])],
    ["completed", new Set<MeetingFollowUpStatus>()],
    ["cancelled", new Set<MeetingFollowUpStatus>()],
  ],
);

export function canTransitionFollowUpStatus(
  from: MeetingFollowUpStatus,
  to: MeetingFollowUpStatus,
): boolean {
  return TRANSITIONS.get(from)?.has(to) ?? false;
}

export function isFollowUpTerminal(status: MeetingFollowUpStatus): boolean {
  return status === "completed" || status === "cancelled";
}

// ── Temporal derivation ────────────────────────────────────────────────────
export function deriveFollowUpTemporalState(args: {
  status: MeetingFollowUpStatus;
  dueAt: string | null | undefined;
  now?: Date;
}): MeetingFollowUpTemporalState {
  if (args.status === "completed") return "completed";
  if (args.status === "cancelled") return "cancelled";
  if (!args.dueAt) return "active";
  const dueMs = Date.parse(args.dueAt);
  if (!Number.isFinite(dueMs)) return "active";
  const nowMs = (args.now ?? new Date()).getTime();
  if (dueMs < nowMs) return "overdue";
  if (dueMs - nowMs <= MEETING_FOLLOW_UP_DUE_SOON_MS) return "due_soon";
  return "active";
}

// ── Authority ──────────────────────────────────────────────────────────────
export interface FollowUpAuthorityCtx {
  viewerUserId: string;
  organizerUserId: string;
  isMeetingParticipant: boolean;
  followUp: {
    ownerUserId: string;
    createdByUserId: string;
    status: MeetingFollowUpStatus;
  } | null;
}

function isOrganizer(ctx: FollowUpAuthorityCtx): boolean {
  return ctx.viewerUserId === ctx.organizerUserId;
}

function isActor(ctx: FollowUpAuthorityCtx): boolean {
  return isOrganizer(ctx) || ctx.isMeetingParticipant;
}

/** Can the viewer create a follow-up on this meeting? Owner eligibility is
 *  enforced separately server-side (see bmfu_owner_eligible). */
export function canCreateFollowUp(ctx: FollowUpAuthorityCtx, intendedOwnerUserId: string): boolean {
  if (!isActor(ctx)) return false;
  if (isOrganizer(ctx)) return true; // may assign any eligible owner
  return intendedOwnerUserId === ctx.viewerUserId; // participant → self-only
}

export function canEditFollowUp(ctx: FollowUpAuthorityCtx): boolean {
  if (!ctx.followUp) return false;
  if (isFollowUpTerminal(ctx.followUp.status)) return false;
  if (!isActor(ctx)) return false;
  if (isOrganizer(ctx)) return true;
  return (
    ctx.viewerUserId === ctx.followUp.ownerUserId ||
    ctx.viewerUserId === ctx.followUp.createdByUserId
  );
}

export function canChangeFollowUpStatus(
  ctx: FollowUpAuthorityCtx,
  target: MeetingFollowUpStatus,
): boolean {
  if (!ctx.followUp) return false;
  if (!canTransitionFollowUpStatus(ctx.followUp.status, target)) return false;
  if (target === "cancelled") return canCancelFollowUp(ctx);
  if (!isActor(ctx)) return false;
  if (isOrganizer(ctx)) return true;
  return ctx.viewerUserId === ctx.followUp.ownerUserId;
}

export function canCancelFollowUp(ctx: FollowUpAuthorityCtx): boolean {
  if (!ctx.followUp) return false;
  if (isFollowUpTerminal(ctx.followUp.status)) return false;
  if (!isActor(ctx)) return false;
  if (isOrganizer(ctx)) return true;
  return ctx.viewerUserId === ctx.followUp.ownerUserId;
}

export function canReassignOwner(ctx: FollowUpAuthorityCtx): boolean {
  if (!ctx.followUp) return false;
  if (isFollowUpTerminal(ctx.followUp.status)) return false;
  return isOrganizer(ctx);
}

export function deriveFollowUpViewerPermissions(ctx: FollowUpAuthorityCtx) {
  return {
    canEdit: canEditFollowUp(ctx),
    canChangeStatus:
      canChangeFollowUpStatus(ctx, "in_progress") || canChangeFollowUpStatus(ctx, "completed"),
    canCancel: canCancelFollowUp(ctx),
  };
}

// ── Priority guard (delegates to registry for callers preferring policy API) ─
const PRIORITY_SET: ReadonlySet<string> = new Set(["low", "normal", "high", "urgent"]);
export function isKnownPriority(v: unknown): v is MeetingFollowUpPriority {
  return typeof v === "string" && PRIORITY_SET.has(v);
}
