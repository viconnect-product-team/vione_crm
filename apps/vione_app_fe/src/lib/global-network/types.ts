// BC-3.1A — Global Business Networking domain types (client-safe).
// Frozen per BC3_0 domain contract + state machine. Additive only.

export const GLOBAL_CONNECTION_STATUSES = [
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "disconnected",
  "blocked",
] as const;
export type GlobalConnectionStatus = (typeof GLOBAL_CONNECTION_STATUSES)[number];

export const GLOBAL_CONNECTION_SOURCE_TYPES = [
  "business_card",
  "saved_card",
  "qr",
  "nfc",
  "event",
  "meeting",
  "association",
  "community",
  "company",
  "marketplace",
  "manual",
  "referral",
] as const;
export type GlobalConnectionSourceType = (typeof GLOBAL_CONNECTION_SOURCE_TYPES)[number];

/** Named lifecycle operations. Clients never submit a target status. */
export type GlobalConnectionOperation =
  | "send_request"
  | "accept"
  | "decline"
  | "cancel"
  | "disconnect"
  | "block";

/** Participant-scoped connection DTO. Never exposes internal pair fields. */
export type GlobalConnection = {
  id: string;
  requesterUserId: string;
  recipientUserId: string;
  status: GlobalConnectionStatus;
  sourceType: GlobalConnectionSourceType;
  sourceId: string | null;
  statusReason: string | null;
  requestedAt: string;
  respondedAt: string | null;
  disconnectedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Directional pair state relative to the current user. */
export type PairDirection = "none" | "outgoing" | "incoming" | "self";

export type PairState = {
  targetUserId: string;
  status: GlobalConnectionStatus | "none";
  direction: PairDirection;
  connectionId: string | null;
  /** True only when the pair is currently blocked (blocker identity stays private). */
  blocked: boolean;
};

export type StatusCounts = Record<GlobalConnectionStatus, number>;

/** The authenticated platform networking user. Never requires a member row. */
export type GlobalNetworkUser = {
  userId: string;
  accountStatus: string;
  profileId?: string;
};

/** JSON-safe result returned by controlled mutation functions. */
export type GlobalConnectionMutationResult = {
  connectionId: string;
  status: GlobalConnectionStatus;
};

// ── BC-3.1B — application-layer DTOs & contracts ─────────────────────────────

/** JSON-safe, direction-aware connection DTO exposed to application code. */
export type GlobalConnectionDTO = {
  id: string;
  requesterUserId: string;
  recipientUserId: string;
  status: GlobalConnectionStatus;
  sourceType: GlobalConnectionSourceType;
  sourceId: string | null;
  requestedAt: string;
  respondedAt: string | null;
  disconnectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  direction: "incoming" | "outgoing";
  counterpartUserId: string;
  requestedByCurrentUser: boolean;
};

/** Stable pagination contract for list reads. */
export type ListOptions = {
  limit?: number;
  offset?: number;
};

export type SourceInput = {
  type?: GlobalConnectionSourceType;
  id?: string | null;
};

export type SendRequestInput = {
  targetUserId: string;
  source?: SourceInput;
  mutationKey?: string;
};

export type MutationOptions = {
  mutationKey?: string;
};

export type ReasonInput = {
  reason?: string;
  mutationKey?: string;
};

/** Privacy-safe counterpart summary — public projections only. */
export type CounterpartSummary = {
  userId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  headline?: string | null;
  primaryCardSlug?: string | null;
  companyName?: string | null;
};

/** Read-only relationship composition (BC-3.0 frozen shape). */
export type RelationshipState = {
  savedCard: boolean;
  globalConnection?: {
    id: string;
    status: GlobalConnectionStatus;
    requestedByCurrentUser: boolean;
    direction: "incoming" | "outgoing";
  };
  associationContexts: Array<{
    associationId: string;
    memberConnectionStatus?: string | null;
  }>;
  effectiveState: "none" | "saved" | "pending_sent" | "pending_received" | "connected" | "blocked";
};
