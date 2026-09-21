// BC-2.6 — Business Interaction model.
//
// An Interaction is an IMMUTABLE business event on a Business Relationship
// (owner→card edge from BC-2.4). It sits BETWEEN the Relationship Graph and
// Networking. Interactions are owner-private (owner = auth.uid()) and never
// duplicate profile or relationship data — they reference the relationship edge
// by id and carry only the event's own facts.
//
// This layer adds interaction history ONLY. It does NOT implement chat,
// messaging, feeds, opportunities, CRM pipelines, community, or marketplace.
// Downstream phases (meetings, networking, CRM, AI, affiliate, analytics) build
// ON these primitives; none are implemented here.

import type { JsonValue } from "./relationship.types";

/** The closed set of business interaction types. */
export type InteractionType =
  | "meeting"
  | "call"
  | "email"
  | "qr_scan"
  | "nfc_tap"
  | "wallet_save"
  | "website_visit"
  | "referral"
  | "business_lunch"
  | "conference"
  | "event"
  | "demo"
  | "proposal"
  | "contract"
  | "follow_up"
  | "other";

export const INTERACTION_TYPES: InteractionType[] = [
  "meeting",
  "call",
  "email",
  "qr_scan",
  "nfc_tap",
  "wallet_save",
  "website_visit",
  "referral",
  "business_lunch",
  "conference",
  "event",
  "demo",
  "proposal",
  "contract",
  "follow_up",
  "other",
];

/** A single immutable business interaction (owner-private). */
export type BusinessInteraction = {
  id: string;
  relationshipId: string;
  companyId?: string | null;
  type: InteractionType;
  occurredAt: string;
  title: string | null;
  note: string | null;
  location: string | null;
  metadata: Record<string, JsonValue>;
  createdAt: string;
  updatedAt: string;
};

/** Input to create a business interaction. */
export type CreateInteractionInput = {
  relationshipId: string;
  companyId?: string | null;
  type: InteractionType;
  occurredAt?: string | null;
  title?: string | null;
  note?: string | null;
  location?: string | null;
  metadata?: Record<string, JsonValue>;
};

/** Patch for an existing interaction. Only provided keys change. */
export type UpdateInteractionInput = {
  companyId?: string | null;
  type?: InteractionType;
  occurredAt?: string | null;
  title?: string | null;
  note?: string | null;
  location?: string | null;
  metadata?: Record<string, JsonValue>;
};

/**
 * The Interaction Timeline for a relationship: the ordered list of interactions
 * (newest first) plus lightweight counts. Derived on read, never persisted.
 */
export type InteractionTimeline = {
  relationshipId: string;
  total: number;
  countsByType: Record<string, number>;
  interactions: BusinessInteraction[];
};

export const INTERACTION_ERR = {
  NOT_FOUND: "INTERACTION_NOT_FOUND",
  RELATIONSHIP_NOT_FOUND: "INTERACTION_RELATIONSHIP_NOT_FOUND",
  INVALID_TYPE: "INTERACTION_INVALID_TYPE",
} as const;
