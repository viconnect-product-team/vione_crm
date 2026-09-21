// BusinessInteractionService — the single home for Business Interaction logic
// (BC-2.6). Orchestrates the interaction repository + mappers; enforces
// invariants (owner = auth.uid(), the relationship must exist and belong to the
// caller, valid interaction_type). Sits BETWEEN the Relationship Graph and
// Networking.
//
// It does NOT rewrite RelationshipService, does NOT duplicate relationship or
// profile data, and does NOT implement chat/feed/CRM/community/marketplace.
//
// Statically imports NO *.server module, so it is safe to import from
// *.functions.ts.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { JsonValue } from "./relationship.types";
import { RelationshipRepository } from "./relationship.repository";
import { InteractionRepository } from "./interaction.repository";
import { buildInteractionTimeline, mapRowToInteraction } from "./interaction.mappers";
import {
  INTERACTION_ERR,
  INTERACTION_TYPES,
  type BusinessInteraction,
  type CreateInteractionInput,
  type InteractionTimeline,
  type InteractionType,
  type UpdateInteractionInput,
} from "./interaction.types";

function validType(v: InteractionType): InteractionType {
  if (!INTERACTION_TYPES.includes(v)) throw new Error(INTERACTION_ERR.INVALID_TYPE);
  return v;
}

function str(v: string | null | undefined, max: number): string | null {
  return v?.trim() ? v.trim().slice(0, max) : null;
}

function cleanMetadata(m: Record<string, JsonValue> | undefined): Record<string, JsonValue> {
  return m && typeof m === "object" ? m : {};
}

/**
 * The relationship edge must exist AND belong to the caller. Because the owner
 * scope is enforced by RelationshipRepository (RLS + explicit filter), a foreign
 * or missing edge resolves to null → INTERACTION_RELATIONSHIP_NOT_FOUND. This
 * blocks cross-user and cross-tenant interaction creation.
 */
async function assertOwnedRelationship(
  supabase: SupabaseClient,
  userId: string,
  relationshipId: string,
): Promise<void> {
  const edge = await RelationshipRepository.findById(supabase, userId, relationshipId);
  if (!edge) throw new Error(INTERACTION_ERR.RELATIONSHIP_NOT_FOUND);
}

export const BusinessInteractionService = {
  /** Create an immutable business interaction on a relationship the caller owns. */
  async create(
    supabase: SupabaseClient,
    userId: string,
    input: CreateInteractionInput,
  ): Promise<BusinessInteraction> {
    await assertOwnedRelationship(supabase, userId, input.relationshipId);
    const row = await InteractionRepository.insert(supabase, {
      owner_user_id: userId,
      relationship_id: input.relationshipId,
      company_id: input.companyId ?? null,
      interaction_type: validType(input.type),
      occurred_at: input.occurredAt || new Date().toISOString(),
      title: str(input.title, 200),
      note: str(input.note, 4000),
      location: str(input.location, 200),
      metadata: cleanMetadata(input.metadata),
    });
    return mapRowToInteraction(row);
  },

  /** Patch an interaction the caller owns. */
  async update(
    supabase: SupabaseClient,
    userId: string,
    id: string,
    patch: UpdateInteractionInput,
  ): Promise<BusinessInteraction> {
    const p: Record<string, unknown> = {};
    if (patch.companyId !== undefined) p.company_id = patch.companyId || null;
    if (patch.type !== undefined) p.interaction_type = validType(patch.type);
    if (patch.occurredAt !== undefined)
      p.occurred_at = patch.occurredAt || new Date().toISOString();
    if (patch.title !== undefined) p.title = str(patch.title, 200);
    if (patch.note !== undefined) p.note = str(patch.note, 4000);
    if (patch.location !== undefined) p.location = str(patch.location, 200);
    if (patch.metadata !== undefined) p.metadata = cleanMetadata(patch.metadata);
    const row = await InteractionRepository.update(supabase, userId, id, p);
    if (!row) throw new Error(INTERACTION_ERR.NOT_FOUND);
    return mapRowToInteraction(row);
  },

  /** Delete an interaction the caller owns. Returns whether one was removed. */
  async delete(
    supabase: SupabaseClient,
    userId: string,
    id: string,
  ): Promise<{ removed: boolean }> {
    const n = await InteractionRepository.deleteById(supabase, userId, id);
    return { removed: n > 0 };
  },

  /**
   * List interactions — for one relationship (owner-scoped) or the whole graph.
   * Newest first (by occurred_at).
   */
  async list(
    supabase: SupabaseClient,
    userId: string,
    relationshipId?: string,
  ): Promise<BusinessInteraction[]> {
    const rows = relationshipId
      ? await InteractionRepository.listByRelationship(supabase, userId, relationshipId)
      : await InteractionRepository.listByOwner(supabase, userId);
    return rows.map(mapRowToInteraction);
  },

  /** Derived interaction timeline for one relationship (newest first + counts). */
  async timeline(
    supabase: SupabaseClient,
    userId: string,
    relationshipId: string,
  ): Promise<InteractionTimeline> {
    await assertOwnedRelationship(supabase, userId, relationshipId);
    const interactions = (
      await InteractionRepository.listByRelationship(supabase, userId, relationshipId)
    ).map(mapRowToInteraction);
    return buildInteractionTimeline(relationshipId, interactions);
  },

  /** Count interactions for one relationship (owner-scoped). Feeds the score. */
  async count(supabase: SupabaseClient, userId: string, relationshipId: string): Promise<number> {
    return InteractionRepository.countByRelationship(supabase, userId, relationshipId);
  },
};
