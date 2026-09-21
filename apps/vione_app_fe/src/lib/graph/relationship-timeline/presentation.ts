// BC-7.5C — Frozen presentation registry for Relationship Timeline.
//
// UI-only. Maps an event kind to icon, importance, actor policy, and a
// source CTA policy. Does not change source event taxonomy or category
// mapping (see `./mapping.ts`). Unknown kinds fall back to `UNKNOWN_PRESENTATION`
// so UI renders safely and never crashes.

import {
  Activity,
  Award,
  Ban,
  Briefcase,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  CheckCircle2,
  Clock,
  Handshake,
  LinkIcon,
  MailCheck,
  MailWarning,
  MailX,
  Send,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { TKey } from "@/lib/i18n";
import type { RelationshipTimelineCategory, RelationshipTimelineEventDTO } from "./types";

export type TimelineImportance = "low" | "normal" | "high";

export type TimelineActorPolicy = "actor-if-visible" | "always-neutral" | "system";

export type TimelineSourceCTA =
  | { kind: "none" }
  | {
      kind: "introduction";
      label: TKey;
    }
  | {
      kind: "meeting";
      label: TKey;
    }
  | {
      kind: "outcome";
      label: TKey;
    }
  | {
      kind: "connection";
      label: TKey;
    };

export interface TimelinePresentation {
  icon: LucideIcon;
  category: RelationshipTimelineCategory;
  importance: TimelineImportance;
  actorPolicy: TimelineActorPolicy;
  cta: TimelineSourceCTA;
}

const REGISTRY: Record<string, TimelinePresentation> = {
  // Connections / graph edges
  CONNECTED_TO: {
    icon: Handshake,
    category: "connection",
    importance: "high",
    actorPolicy: "actor-if-visible",
    cta: { kind: "connection", label: "bc.timeline.cta.viewConnection" },
  },
  MET: {
    icon: Users,
    category: "meeting_touch",
    importance: "normal",
    actorPolicy: "actor-if-visible",
    cta: { kind: "none" },
  },
  FOLLOWED: {
    icon: UserPlus,
    category: "connection",
    importance: "low",
    actorPolicy: "actor-if-visible",
    cta: { kind: "none" },
  },
  FOLLOWED_BY: {
    icon: UserCheck,
    category: "connection",
    importance: "low",
    actorPolicy: "actor-if-visible",
    cta: { kind: "none" },
  },

  // Cards / library
  SAVED_CARD: {
    icon: LinkIcon,
    category: "card",
    importance: "low",
    actorPolicy: "actor-if-visible",
    cta: { kind: "none" },
  },
  SAVED_BY: {
    icon: LinkIcon,
    category: "card",
    importance: "low",
    actorPolicy: "always-neutral",
    cta: { kind: "none" },
  },

  // Work / membership
  WORKS_FOR: {
    icon: Briefcase,
    category: "work",
    importance: "normal",
    actorPolicy: "actor-if-visible",
    cta: { kind: "none" },
  },
  EMPLOYS: {
    icon: Briefcase,
    category: "work",
    importance: "normal",
    actorPolicy: "actor-if-visible",
    cta: { kind: "none" },
  },
  MANAGES: {
    icon: Briefcase,
    category: "work",
    importance: "low",
    actorPolicy: "actor-if-visible",
    cta: { kind: "none" },
  },
  MANAGED_BY: {
    icon: Briefcase,
    category: "work",
    importance: "low",
    actorPolicy: "actor-if-visible",
    cta: { kind: "none" },
  },
  MEMBER_OF: {
    icon: Award,
    category: "membership",
    importance: "low",
    actorPolicy: "actor-if-visible",
    cta: { kind: "none" },
  },
  HAS_MEMBER: {
    icon: Award,
    category: "membership",
    importance: "low",
    actorPolicy: "always-neutral",
    cta: { kind: "none" },
  },

  ATTENDED: {
    icon: Calendar,
    category: "meeting_touch",
    importance: "low",
    actorPolicy: "actor-if-visible",
    cta: { kind: "none" },
  },
  HAD_ATTENDEE: {
    icon: Calendar,
    category: "meeting_touch",
    importance: "low",
    actorPolicy: "always-neutral",
    cta: { kind: "none" },
  },

  // Introduction delivery
  INTRO_DELIVERY_CREATED: {
    icon: Send,
    category: "introduction",
    importance: "low",
    actorPolicy: "actor-if-visible",
    cta: { kind: "introduction", label: "bc.timeline.cta.viewIntroduction" },
  },
  INTRO_DELIVERY_DELIVERED: {
    icon: MailCheck,
    category: "introduction",
    importance: "high",
    actorPolicy: "actor-if-visible",
    cta: { kind: "introduction", label: "bc.timeline.cta.viewIntroduction" },
  },
  INTRO_DELIVERY_ACKNOWLEDGED: {
    icon: CheckCircle2,
    category: "introduction",
    importance: "normal",
    actorPolicy: "actor-if-visible",
    cta: { kind: "introduction", label: "bc.timeline.cta.viewIntroduction" },
  },
  INTRO_DELIVERY_DECLINED: {
    icon: MailX,
    category: "introduction",
    importance: "normal",
    actorPolicy: "always-neutral",
    cta: { kind: "introduction", label: "bc.timeline.cta.viewIntroduction" },
  },
  INTRO_DELIVERY_EXPIRED: {
    icon: MailWarning,
    category: "introduction",
    importance: "low",
    actorPolicy: "system",
    cta: { kind: "introduction", label: "bc.timeline.cta.viewIntroduction" },
  },

  // Introduction outcome
  INTRO_OUTCOME_CREATED: {
    icon: Sparkles,
    category: "introduction",
    importance: "low",
    actorPolicy: "system",
    cta: { kind: "outcome", label: "bc.timeline.cta.viewOutcome" },
  },
  INTRO_OUTCOME_CONNECTED: {
    icon: Handshake,
    category: "introduction",
    importance: "high",
    actorPolicy: "actor-if-visible",
    cta: { kind: "outcome", label: "bc.timeline.cta.viewOutcome" },
  },
  INTRO_OUTCOME_PROGRESSING: {
    icon: Activity,
    category: "introduction",
    importance: "high",
    actorPolicy: "actor-if-visible",
    cta: { kind: "outcome", label: "bc.timeline.cta.viewOutcome" },
  },
  INTRO_OUTCOME_CLOSED_SUCCESS: {
    icon: CheckCircle2,
    category: "introduction",
    importance: "high",
    actorPolicy: "actor-if-visible",
    cta: { kind: "outcome", label: "bc.timeline.cta.viewOutcome" },
  },
  INTRO_OUTCOME_CLOSED_NO_FIT: {
    icon: Ban,
    category: "introduction",
    importance: "normal",
    actorPolicy: "actor-if-visible",
    cta: { kind: "outcome", label: "bc.timeline.cta.viewOutcome" },
  },
  INTRO_OUTCOME_CLOSED_LOST: {
    icon: XCircle,
    category: "introduction",
    importance: "normal",
    actorPolicy: "actor-if-visible",
    cta: { kind: "outcome", label: "bc.timeline.cta.viewOutcome" },
  },

  // Meetings
  MEETING_CREATED: {
    icon: Calendar,
    category: "meeting",
    importance: "low",
    actorPolicy: "actor-if-visible",
    cta: { kind: "meeting", label: "bc.timeline.cta.viewMeeting" },
  },
  MEETING_PROPOSED: {
    icon: CalendarClock,
    category: "meeting",
    importance: "low",
    actorPolicy: "actor-if-visible",
    cta: { kind: "meeting", label: "bc.timeline.cta.viewMeeting" },
  },
  MEETING_CONFIRMED: {
    icon: CalendarCheck,
    category: "meeting",
    importance: "normal",
    actorPolicy: "actor-if-visible",
    cta: { kind: "meeting", label: "bc.timeline.cta.viewMeeting" },
  },
  MEETING_COMPLETED: {
    icon: CheckCircle2,
    category: "meeting",
    importance: "high",
    actorPolicy: "actor-if-visible",
    cta: { kind: "meeting", label: "bc.timeline.cta.viewMeeting" },
  },
  MEETING_CANCELLED: {
    icon: CalendarX,
    category: "meeting",
    importance: "normal",
    actorPolicy: "actor-if-visible",
    cta: { kind: "meeting", label: "bc.timeline.cta.viewMeeting" },
  },
  MEETING_RESCHEDULED: {
    icon: CalendarClock,
    category: "meeting",
    importance: "normal",
    actorPolicy: "actor-if-visible",
    cta: { kind: "meeting", label: "bc.timeline.cta.viewMeeting" },
  },
  MEETING_DECLINED: {
    icon: CalendarX,
    category: "meeting",
    importance: "normal",
    actorPolicy: "always-neutral",
    cta: { kind: "meeting", label: "bc.timeline.cta.viewMeeting" },
  },

  // Legacy aliases
  INTRO_DELIVERED: {
    icon: MailCheck,
    category: "introduction",
    importance: "normal",
    actorPolicy: "actor-if-visible",
    cta: { kind: "introduction", label: "bc.timeline.cta.viewIntroduction" },
  },
  INTRO_OUTCOME: {
    icon: Sparkles,
    category: "introduction",
    importance: "normal",
    actorPolicy: "actor-if-visible",
    cta: { kind: "outcome", label: "bc.timeline.cta.viewOutcome" },
  },
};

export const UNKNOWN_PRESENTATION: TimelinePresentation = {
  icon: Clock,
  category: "other",
  importance: "low",
  actorPolicy: "system",
  cta: { kind: "none" },
};

/** Frozen registry export — read-only. */
export const RELATIONSHIP_TIMELINE_PRESENTATION_REGISTRY: Readonly<
  Record<string, TimelinePresentation>
> = Object.freeze({ ...REGISTRY });

export function presentationFor(kind: string): TimelinePresentation {
  return REGISTRY[kind] ?? UNKNOWN_PRESENTATION;
}

/** Convenience — importance derived per event (registry-only). */
export function importanceFor(
  event: Pick<RelationshipTimelineEventDTO, "eventType">,
): TimelineImportance {
  return presentationFor(event.eventType).importance;
}
