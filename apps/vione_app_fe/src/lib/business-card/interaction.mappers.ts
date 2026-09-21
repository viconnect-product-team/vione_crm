// Pure row → DTO mapping + timeline building for the interaction domain.
// No supabase, no window — deterministic and unit-testable.

import type { JsonValue } from "./relationship.types";
import {
  INTERACTION_TYPES,
  type BusinessInteraction,
  type InteractionTimeline,
  type InteractionType,
} from "./interaction.types";

function normalizeType(v: unknown): InteractionType {
  return INTERACTION_TYPES.includes(v as InteractionType) ? (v as InteractionType) : "other";
}

/** Map a business_interactions row to a BusinessInteraction DTO. */
export function mapRowToInteraction(row: Record<string, unknown>): BusinessInteraction {
  return {
    id: row.id as string,
    relationshipId: row.relationship_id as string,
    companyId: (row.company_id as string) ?? null,
    type: normalizeType(row.interaction_type),
    occurredAt: (row.occurred_at as string) ?? (row.created_at as string),
    title: (row.title as string) ?? null,
    note: (row.note as string) ?? null,
    location: (row.location as string) ?? null,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, JsonValue>)
        : {},
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) ?? (row.created_at as string),
  };
}

/** Build an interaction timeline (newest first) with per-type counts. */
export function buildInteractionTimeline(
  relationshipId: string,
  interactions: BusinessInteraction[],
): InteractionTimeline {
  const sorted = [...interactions].sort(
    (a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt),
  );
  const countsByType: Record<string, number> = {};
  for (const i of sorted) countsByType[i.type] = (countsByType[i.type] ?? 0) + 1;
  return {
    relationshipId,
    total: sorted.length,
    countsByType,
    interactions: sorted,
  };
}
