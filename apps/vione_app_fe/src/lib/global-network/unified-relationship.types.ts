// BC-3.1E — Unified Relationship Read Experience: client-safe DTOs.
//
// The UnifiedRelationshipView is the SINGLE canonical read shape that composes
// the isolated relationship domains into one viewer-scoped projection:
//   • Global Networking connection state (BC-3.1A/B)
//   • Saved Card private metadata (BC-2.x, owner-only)
//   • Business Interaction summary (BC-2.6, owner-only)
//   • Deterministic relationship score (BC-2.6)
//   • Privacy-safe public counterpart identity
//
// It is READ-ONLY and additive. It never carries owner_user_id, target pair
// fields, blocker identity, mutation keys, or raw connection/edge rows. Private
// metadata (notes/tags/labels/score) is present ONLY for the "owner-of-edge"
// viewer, i.e. the current authenticated user reading their own saved edge.

import type { GlobalConnectionStatus } from "./types";

export type UnifiedViewer = "anonymous" | "self" | "authenticated";

export type UnifiedEffectiveState =
  | "anonymous"
  | "self"
  | "none"
  | "saved"
  | "pending_sent"
  | "pending_received"
  | "connected"
  | "blocked"
  | "unavailable";

/** Direction-aware connection projection (no pair/internal fields). */
export type UnifiedConnectionDTO = {
  id: string;
  status: GlobalConnectionStatus;
  direction: "incoming" | "outgoing";
  requestedByCurrentUser: boolean;
};

/** Privacy-safe public identity of the counterpart (published public card only). */
export type UnifiedCounterpartDTO = {
  displayName: string | null;
  headline: string | null;
  companyName: string | null;
  avatarUrl: string | null;
  primaryCardSlug: string | null;
  /** True when the counterpart is not publicly resolvable (removed/private). */
  unavailable: boolean;
};

/** Owner-only private metadata carried on the saved edge. */
export type UnifiedPrivateMetadata = {
  favorite: boolean;
  tags: string[];
  labels: string[];
  notes: string | null;
  importance: number;
  priority: string | null;
  savedAt: string;
  firstMetAt: string | null;
  lastContactAt: string | null;
  lastViewedAt: string | null;
};

/** Owner-only interaction summary derived from the interaction timeline. */
export type UnifiedInteractionSummary = {
  total: number;
  countsByType: Record<string, number>;
  lastOccurredAt: string | null;
};

/** Deterministic relationship score projection (owner-only). */
export type UnifiedScore = {
  value: number;
  tier: "cold" | "warm" | "strong";
};

/**
 * The unified, viewer-scoped relationship read. One object; every consumer
 * (profile route, network management, saved-card drawer) reads the same shape.
 */
export type UnifiedRelationshipView = {
  viewer: UnifiedViewer;
  effectiveState: UnifiedEffectiveState;
  savedCard: boolean;
  connection?: UnifiedConnectionDTO;
  counterpart: UnifiedCounterpartDTO;
  /** Present only when the viewer owns a saved edge for this counterpart. */
  privateMetadata?: UnifiedPrivateMetadata;
  interactions?: UnifiedInteractionSummary;
  score?: UnifiedScore;
};
