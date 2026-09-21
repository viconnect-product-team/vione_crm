// BC-9.0 — Business Connect Intelligence: safe fact schemas, context envelope,
// citation model, and shared DTO shapes.
//
// FACT PRINCIPLES
// - Facts carry ONLY fields allowed by capability policy.
// - No raw DB IDs (auth uid, tenant id) — use opaque safe references.
// - No private-note content, ever.
// - Every fact has a stable `ref` that citations may point at.
// - Every fact records `updatedAt` and `sourceDomain` so freshness & lineage
//   flow through the response.

import type {
  BusinessConnectAICapability,
  BusinessConnectAIConfidence,
  BusinessConnectAISessionScope,
  BusinessConnectAISourceDomain,
} from "./registry";

/** Opaque, viewer-scoped safe reference used to link facts and citations. */
export type SafeRef = {
  /** Stable identifier scoped to the current viewer (not a raw DB PK). */
  id: string;
  /** Public route the UI may deep-link to. Optional (some refs are label-only). */
  route?: string;
  /** Short human-readable label; must be safe to display. */
  label: string;
};

/** Lineage & freshness metadata carried on every safe fact. */
export type FactLineage = {
  sourceDomain: BusinessConnectAISourceDomain;
  updatedAt: string; // ISO-8601
  /** Optional monotonic version from the source projection, if any. */
  sourceVersion?: string;
};

// ── Safe Facts ──────────────────────────────────────────────────────────────

export type PersonFact = FactLineage & {
  kind: "person";
  ref: SafeRef;
  displayName: string | null;
  headline: string | null;
  companyName: string | null;
  primaryCardSlug: string | null;
  isViewerSelf: boolean;
};

export type OrganizationFact = FactLineage & {
  kind: "organization";
  ref: SafeRef;
  name: string;
  industry: string | null;
  size: string | null;
};

export type RelationshipFact = FactLineage & {
  kind: "relationship";
  ref: SafeRef;
  counterpart: SafeRef;
  status:
    | "none"
    | "saved"
    | "pending_sent"
    | "pending_received"
    | "connected"
    | "blocked"
    | "unavailable";
  strengthTier: "cold" | "warm" | "strong" | null;
  savedAt: string | null;
  firstMetAt: string | null;
  lastContactAt: string | null;
  sharedTags: readonly string[];
};

export type IntroductionFact = FactLineage & {
  kind: "introduction";
  ref: SafeRef;
  status: "requested" | "accepted" | "declined" | "delivered" | "closed" | "expired";
  requester: SafeRef;
  target: SafeRef;
  intermediary: SafeRef | null;
  requestedAt: string;
  outcomeSummary: string | null;
};

export type MeetingFact = FactLineage & {
  kind: "meeting";
  ref: SafeRef;
  title: string;
  status: "proposed" | "tentative" | "confirmed" | "completed" | "cancelled";
  startsAt: string | null;
  endsAt: string | null;
  organizer: SafeRef | null;
  participants: readonly SafeRef[];
  hasAgenda: boolean;
  hasSharedNotes: boolean;
  hasOutcome: boolean;
};

export type AgendaFact = FactLineage & {
  kind: "agenda_item";
  ref: SafeRef;
  meetingRef: SafeRef;
  title: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  ownerRef: SafeRef | null;
  position: number;
};

/** Shared notes — only present when viewer is authorized to read the note. */
export type SharedNoteFact = FactLineage & {
  kind: "shared_note";
  ref: SafeRef;
  meetingRef: SafeRef;
  title: string | null;
  /** Redacted body summary (bounded chars). Never the raw note body verbatim. */
  bodySummary: string;
  isPublished: boolean;
};

export type OutcomeFact = FactLineage & {
  kind: "meeting_outcome";
  ref: SafeRef;
  meetingRef: SafeRef;
  summary: string;
  commitments: readonly {
    text: string;
    ownerRef: SafeRef | null;
    dueAt: string | null;
  }[];
  recordedAt: string;
};

export type FollowUpFact = FactLineage & {
  kind: "follow_up";
  ref: SafeRef;
  meetingRef: SafeRef | null;
  title: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  dueAt: string | null;
  ownerRef: SafeRef | null;
  isOverdue: boolean;
};

export type WorkItemFact = FactLineage & {
  kind: "work_item";
  ref: SafeRef;
  itemKind: string; // WORK_HUB_ITEM_KINDS — kept as string to avoid cross-dep in facts
  category: string;
  priorityTier: string;
  headline: string;
  counterpartRef: SafeRef | null;
  dueAt: string | null;
};

export type OpportunitySignalFact = FactLineage & {
  kind: "opportunity_signal";
  ref: SafeRef;
  signalType:
    | "warm_introduction_opportunity"
    | "reconnect_opportunity"
    | "meeting_follow_up_opportunity"
    | "shared_interest_opportunity"
    | "organization_connection_opportunity"
    | "dormant_relationship_review";
  strength: "low" | "medium" | "high";
  relatedRefs: readonly SafeRef[];
};

export type BusinessConnectSafeFact =
  | PersonFact
  | OrganizationFact
  | RelationshipFact
  | IntroductionFact
  | MeetingFact
  | AgendaFact
  | SharedNoteFact
  | OutcomeFact
  | FollowUpFact
  | WorkItemFact
  | OpportunitySignalFact;

// ── Viewer & Scope ──────────────────────────────────────────────────────────

export type ViewerContext = {
  /** Opaque server-derived viewer identity — NEVER a raw auth uid downstream. */
  viewerRef: SafeRef;
  locale: "vi" | "en";
  tenantScopeOpaque: string; // opaque hash; never a raw tenant id
};

export type IntelligenceScope =
  | { type: "global_business_connect" }
  | { type: "person"; personRef: SafeRef }
  | { type: "organization"; organizationRef: SafeRef }
  | { type: "meeting"; meetingRef: SafeRef }
  | { type: "introduction"; introductionRef: SafeRef }
  | { type: "work_hub" };

export function scopeSessionType(scope: IntelligenceScope): BusinessConnectAISessionScope {
  return scope.type;
}

// ── Context Envelope (§8) ───────────────────────────────────────────────────

export type ModelPolicyClass = "cloud_general" | "cloud_private" | "local_private" | "unavailable";

export type BusinessConnectAIContextEnvelope = {
  requestId: string;
  capability: BusinessConnectAICapability;
  viewerContext: ViewerContext;
  scope: IntelligenceScope;
  safeFacts: readonly BusinessConnectSafeFact[];
  exclusions: readonly string[]; // human-readable, e.g. "private notes excluded"
  dataFreshness: {
    generatedAt: string;
    oldestSourceUpdatedAt: string | null;
    newestSourceUpdatedAt: string | null;
  };
  sourceVersions: Readonly<Record<string, string>>;
  policyVersion: string;
  promptVersion: string;
  modelPolicy: ModelPolicyClass;
};

// ── Citations (§30) ─────────────────────────────────────────────────────────

export type Citation = {
  sourceType: BusinessConnectSafeFact["kind"];
  sourceRef: SafeRef;
  updatedAt: string;
};

// ── Common response envelope pieces ─────────────────────────────────────────

export type ResponseMeta = {
  capability: BusinessConnectAICapability;
  generatedAt: string;
  promptVersion: string;
  policyVersion: string;
  modelPolicy: ModelPolicyClass;
  modelId: string | null;
  confidence: BusinessConnectAIConfidence;
  sourceFreshness: {
    oldestSourceUpdatedAt: string | null;
    newestSourceUpdatedAt: string | null;
    isStale: boolean;
  };
  limitations: readonly string[];
  citations: readonly Citation[];
};
