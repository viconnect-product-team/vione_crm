// BC-Mobile-6C — Personalization server adapter (SERVER ONLY).
//
// Implements RelationshipPersonalizationPorts over Supabase with the
// authenticated per-request client (RLS as the viewer). All queries are
// owner-scoped; the viewer id comes from requireSupabaseAuth context.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { RelationshipPersonalizationPolicy } from "./relationship-personalization.types";
import type {
  RelationshipIntelInteraction,
  RelationshipIntelInteractionKind,
  RelationshipIntelPreferencesDTO,
} from "./relationship-personalization.types";
import { RELATIONSHIP_INTEL_INTERACTION_KINDS } from "./relationship-personalization.types";
import {
  createRelationshipPersonalizationService,
  type RelationshipPersonalizationService,
} from "./relationship-personalization.service";

type PrefsRow = Record<string, unknown>;
type InteractionRow = Record<string, unknown>;

const INTERACTION_KIND_SET: ReadonlySet<string> = new Set(RELATIONSHIP_INTEL_INTERACTION_KINDS);

function mapPrefsRow(row: PrefsRow): RelationshipIntelPreferencesDTO {
  return {
    recommendationsEnabled: row.recommendations_enabled !== false,
    reconnectEnabled: row.reconnect_enabled !== false,
    reconnectCadence:
      row.reconnect_cadence === "more_often" ||
      row.reconnect_cadence === "normal" ||
      row.reconnect_cadence === "less_often"
        ? row.reconnect_cadence
        : "auto",
    preferredContactAction:
      row.preferred_contact_action === "call" || row.preferred_contact_action === "email"
        ? row.preferred_contact_action
        : "auto",
    behavioralAdaptationEnabled: row.behavioral_adaptation_enabled !== false,
    policyVersion: typeof row.policy_version === "string" ? row.policy_version : "v1",
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

function mapInteractionRow(row: InteractionRow): RelationshipIntelInteraction | null {
  const kind = row.kind;
  const occurredAt = row.occurred_at;
  if (typeof kind !== "string" || !INTERACTION_KIND_SET.has(kind)) return null;
  if (typeof occurredAt !== "string" || !Number.isFinite(Date.parse(occurredAt))) return null;
  return {
    kind: kind as RelationshipIntelInteractionKind,
    recommendationType: row.recommendation_type === "reconnect" ? "reconnect" : null,
    occurredAt,
  };
}

export function createSupabasePersonalizationService(
  supabase: SupabaseClient<Database>,
): RelationshipPersonalizationService {
  return createRelationshipPersonalizationService({
    async getPreferences(viewerId) {
      const { data, error } = await supabase
        .from("relationship_intelligence_preferences")
        .select(
          "recommendations_enabled, reconnect_enabled, reconnect_cadence, preferred_contact_action, behavioral_adaptation_enabled, policy_version, updated_at",
        )
        .eq("viewer_user_id", viewerId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapPrefsRow(data as PrefsRow) : null;
    },

    async upsertPreferences(viewerId, preferences) {
      const { data, error } = await supabase
        .from("relationship_intelligence_preferences")
        .upsert(
          {
            viewer_user_id: viewerId,
            recommendations_enabled: preferences.recommendationsEnabled,
            reconnect_enabled: preferences.reconnectEnabled,
            reconnect_cadence: preferences.reconnectCadence,
            preferred_contact_action: preferences.preferredContactAction,
            behavioral_adaptation_enabled: preferences.behavioralAdaptationEnabled,
            policy_version: preferences.policyVersion,
          },
          { onConflict: "viewer_user_id" },
        )
        .select(
          "recommendations_enabled, reconnect_enabled, reconnect_cadence, preferred_contact_action, behavioral_adaptation_enabled, policy_version, updated_at",
        )
        .single();
      if (error) throw error;
      return mapPrefsRow(data as PrefsRow);
    },

    async deletePreferences(viewerId) {
      const { error } = await supabase
        .from("relationship_intelligence_preferences")
        .delete()
        .eq("viewer_user_id", viewerId);
      if (error) throw error;
    },

    async listInteractions(viewerId, sinceIso) {
      const { data, error } = await supabase
        .from("relationship_intelligence_interactions")
        .select("kind, recommendation_type, occurred_at")
        .eq("viewer_user_id", viewerId)
        .gte("occurred_at", sinceIso)
        .order("occurred_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return ((data ?? []) as InteractionRow[])
        .map(mapInteractionRow)
        .filter((i): i is RelationshipIntelInteraction => i !== null);
    },

    async insertInteraction(viewerId, kind, recommendationType) {
      const { error } = await supabase.from("relationship_intelligence_interactions").insert({
        viewer_user_id: viewerId,
        kind,
        recommendation_type: recommendationType,
      });
      if (error) throw error;
    },

    async deleteInteractions(viewerId) {
      const { error } = await supabase
        .from("relationship_intelligence_interactions")
        .delete()
        .eq("viewer_user_id", viewerId);
      if (error) throw error;
    },

    async pruneInteractions(viewerId, beforeIso) {
      const { error } = await supabase
        .from("relationship_intelligence_interactions")
        .delete()
        .eq("viewer_user_id", viewerId)
        .lt("occurred_at", beforeIso);
      if (error) throw error;
    },

    nowMs: () => Date.now(),
  });
}

/**
 * Policy for 6A composition (suppression + reconnect threshold). Returns
 * null on any failure → callers fall back to deterministic defaults.
 */
export function getPersonalizationPolicy(
  supabase: SupabaseClient<Database>,
  viewerId: string,
): Promise<RelationshipPersonalizationPolicy | null> {
  return createSupabasePersonalizationService(supabase).getPolicy(viewerId);
}
