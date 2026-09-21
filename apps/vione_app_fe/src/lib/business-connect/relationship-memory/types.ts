// BC-9.1 Turn A — Relationship Memory DTOs (client-safe).

import type {
  RelationshipMemoryFeedbackKind,
  RelationshipMemoryKind,
  RelationshipMemoryLinkKind,
  RelationshipMemorySensitivity,
  RelationshipMemoryStatus,
  RelationshipMemorySubjectType,
  RelationshipMemoryAllowedSourceDomain,
} from "./registry";

export type RelationshipMemorySubject = {
  type: RelationshipMemorySubjectType;
  /** Domain reference — a person_node_id, organization slug, etc. Never raw PII. */
  ref: string;
};

export type RelationshipMemoryCanonicalValue = Record<string, unknown>;

export type RelationshipMemoryDTO = {
  id: string;
  ownerUserId: string;
  subject: RelationshipMemorySubject;
  kind: RelationshipMemoryKind;
  canonicalKey: string;
  canonicalValue: RelationshipMemoryCanonicalValue;
  confidence: number; // 0..1
  sourceCount: number;
  status: RelationshipMemoryStatus;
  sensitivity: RelationshipMemorySensitivity;
  firstObservedAt: string;
  lastObservedAt: string;
  lastReviewedAt: string | null;
  registryVersion: string;
  createdAt: string;
  updatedAt: string;
};

export type RelationshipMemorySourceDTO = {
  id: string;
  memoryId: string;
  sourceDomain: RelationshipMemoryAllowedSourceDomain;
  sourceRef: string;
  observedAt: string;
  weight: number;
  extractorVersion: string;
  snippetSafe: string | null;
};

export type RelationshipMemoryLinkDTO = {
  id: string;
  fromMemoryId: string;
  toMemoryId: string;
  linkKind: RelationshipMemoryLinkKind;
  weight: number;
};

export type RelationshipMemoryFeedbackDTO = {
  id: string;
  memoryId: string;
  feedbackKind: RelationshipMemoryFeedbackKind;
  note: string | null;
  createdAt: string;
};

export type RelationshipMemoryListFilters = {
  subject?: RelationshipMemorySubject;
  kinds?: ReadonlyArray<RelationshipMemoryKind>;
  statuses?: ReadonlyArray<RelationshipMemoryStatus>;
  minConfidence?: number;
  maxSensitivity?: RelationshipMemorySensitivity;
  limit?: number;
  cursor?: string | null;
};

export type RelationshipMemoryListDTO = {
  items: RelationshipMemoryDTO[];
  nextCursor: string | null;
  registryVersion: string;
};

export const RELATIONSHIP_MEMORY_PAGE_SIZE_DEFAULT = 50;
export const RELATIONSHIP_MEMORY_PAGE_SIZE_MAX = 200;
