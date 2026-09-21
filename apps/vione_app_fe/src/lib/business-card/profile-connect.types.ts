// BC-3.1D — Business Profile Connect: viewer-safe relationship DTOs.
// Client-safe. These types are the ONLY relationship shape exposed to profile UI.
// They never carry owner_user_id, target_user_id, pair fields, blocker identity,
// mutation keys, private notes/tags, or raw connection rows.

import type { GlobalConnectionStatus } from "@/lib/global-network/types";

export type ProfileViewer = "anonymous" | "owner" | "authenticated";

export type ProfileEffectiveState =
  | "anonymous"
  | "self"
  | "none"
  | "saved"
  | "pending_sent"
  | "pending_received"
  | "connected"
  | "blocked"
  | "unavailable";

/** Minimal, direction-aware connection projection safe for the public profile. */
export type BusinessProfileConnectionDTO = {
  id: string;
  status: GlobalConnectionStatus;
  direction: "incoming" | "outgoing";
  requestedByCurrentUser: boolean;
};

/** Composed, viewer-scoped relationship state for a Business Profile. */
export type BusinessProfileRelationshipState = {
  viewer: ProfileViewer;
  savedCard: boolean;
  connection?: BusinessProfileConnectionDTO;
  effectiveState: ProfileEffectiveState;
};
