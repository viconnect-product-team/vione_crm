// BC-8.1 §7 §8 §9 — Pure recipient resolvers.
//
// These functions are DETERMINISTIC and rely ONLY on the canonical facts passed
// by the caller. The runtime layer is responsible for producing those facts by
// reading canonical domain state at dispatch time (§9, §22). Never trust raw
// event payloads: the runtime must revalidate before calling these resolvers.

import { NOTIFICATION_KIND_REGISTRY } from "./registry";
import type { NotificationKind } from "./types";

export interface ResolvedRecipient {
  userId: string;
  /** True when the runtime confirmed canonical visibility for the recipient. */
  visibilityConfirmed: boolean;
}

export interface RecipientContext {
  /** The actor whose action triggered the event, when applicable. */
  actorUserId?: string | null;
  /** Whether the runtime has canonical read access confirming visibility. */
  visibilityConfirmed: boolean;
}

/** Rule §8: suppress self-notifications for kinds whose descriptor marks them
 *  as `suppressForActor`. Reminders and account-issue notifications are exempt. */
export function shouldSuppressSelfNotification(
  kind: NotificationKind,
  actorUserId: string | null | undefined,
  candidateUserId: string,
): boolean {
  if (!actorUserId) return false;
  const d = NOTIFICATION_KIND_REGISTRY[kind];
  return d.suppressForActor && actorUserId === candidateUserId;
}

function make(userId: string, ctx: RecipientContext): ResolvedRecipient {
  return { userId, visibilityConfirmed: ctx.visibilityConfirmed };
}

/** Connection notifications — target is the counterpart of the actor. */
export function resolveConnectionRecipients(input: {
  kind: NotificationKind;
  requesterUserId: string;
  addresseeUserId: string;
  ctx: RecipientContext;
}): ResolvedRecipient[] {
  const { kind, requesterUserId, addresseeUserId, ctx } = input;
  const actor = ctx.actorUserId ?? null;
  // received = addressee is recipient; accepted/declined = requester is recipient.
  const candidate = kind === "connection_request_received" ? addresseeUserId : requesterUserId;
  if (shouldSuppressSelfNotification(kind, actor, candidate)) return [];
  return [make(candidate, ctx)];
}

/** Introduction request — recipient depends on kind. */
export function resolveIntroductionRequestRecipients(input: {
  kind: NotificationKind;
  requesterUserId: string;
  intermediaryUserId: string;
  targetUserId: string;
  ctx: RecipientContext;
}): ResolvedRecipient[] {
  const { kind, requesterUserId, intermediaryUserId, targetUserId, ctx } = input;
  const actor = ctx.actorUserId ?? null;
  const candidate = (() => {
    switch (kind) {
      case "introduction_request_received":
        return intermediaryUserId; // §7
      case "introduction_request_accepted":
      case "introduction_request_declined":
      case "introduction_outcome_due":
        return requesterUserId;
      case "introduction_delivery_required":
        return intermediaryUserId;
      case "introduction_delivered":
        return targetUserId;
      case "introduction_delivery_acknowledged":
        return requesterUserId;
      default:
        return null;
    }
  })();
  if (!candidate) return [];
  if (shouldSuppressSelfNotification(kind, actor, candidate)) return [];
  return [make(candidate, ctx)];
}

/** Meeting notifications. Participants + organizer as appropriate. */
export function resolveMeetingRecipients(input: {
  kind: NotificationKind;
  organizerUserId: string;
  participantUserIds: readonly string[];
  ctx: RecipientContext;
}): ResolvedRecipient[] {
  const { kind, organizerUserId, participantUserIds, ctx } = input;
  const actor = ctx.actorUserId ?? null;

  const all = Array.from(new Set([organizerUserId, ...participantUserIds]));
  let candidates: string[];
  switch (kind) {
    case "meeting_invitation_received":
      candidates = participantUserIds.filter((u) => u !== organizerUserId);
      break;
    case "meeting_invitation_accepted":
    case "meeting_invitation_declined":
      candidates = [organizerUserId];
      break;
    case "meeting_time_response_required":
      candidates = participantUserIds.filter((u) => u !== organizerUserId);
      break;
    case "meeting_final_time_ready":
      candidates = [organizerUserId];
      break;
    case "meeting_upcoming_reminder":
    case "meeting_confirmed":
    case "meeting_cancelled":
      candidates = [...all];
      break;
    case "meeting_outcome_missing":
      candidates = [organizerUserId];
      break;
    default:
      candidates = [];
  }
  return candidates
    .filter((u) => !shouldSuppressSelfNotification(kind, actor, u))
    .map((u) => make(u, ctx));
}

/** Follow-up notifications. Owner-scoped in v1 (§7, §21). */
export function resolveFollowUpRecipients(input: {
  kind: NotificationKind;
  ownerUserId: string;
  ctx: RecipientContext;
}): ResolvedRecipient[] {
  const { kind, ownerUserId, ctx } = input;
  const actor = ctx.actorUserId ?? null;
  if (shouldSuppressSelfNotification(kind, actor, ownerUserId)) return [];
  return [make(ownerUserId, ctx)];
}

/** Shared notes / agenda notifications. Authorized meeting participants minus actor. */
export function resolveCollaborationRecipients(input: {
  kind: NotificationKind;
  authorizedUserIds: readonly string[];
  ctx: RecipientContext;
}): ResolvedRecipient[] {
  const { kind, authorizedUserIds, ctx } = input;
  const actor = ctx.actorUserId ?? null;
  return authorizedUserIds
    .filter((u) => !shouldSuppressSelfNotification(kind, actor, u))
    .map((u) => make(u, ctx));
}

/** Calendar notifications — always the owning user, self-notification allowed. */
export function resolveCalendarRecipients(input: {
  kind: NotificationKind;
  ownerUserId: string;
  ctx: RecipientContext;
}): ResolvedRecipient[] {
  return [make(input.ownerUserId, input.ctx)];
}
