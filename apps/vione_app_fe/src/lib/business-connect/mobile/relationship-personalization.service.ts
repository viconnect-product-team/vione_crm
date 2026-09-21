// BC-Mobile-6C — Personalization composition service (DI, no direct I/O).
//
// All reads/writes go through injected ports (implemented by
// relationship-personalization.server.ts). The viewer id ALWAYS comes from
// requireSupabaseAuth context — never from client input. Learning is gated
// server-side: when behavioral adaptation is OFF, interaction events are
// accepted but truthfully NOT recorded ({ recorded: false }).

import {
  DEFAULT_RELATIONSHIP_INTEL_PREFERENCES,
  RELATIONSHIP_PERSONALIZATION_CONFIG,
  type BcMobileGetPersonalizationResult,
  type BcMobileRecordInteractionResult,
  type RelationshipIntelInteraction,
  type RelationshipIntelInteractionKind,
  type RelationshipIntelPreferencesDTO,
  type RelationshipPersonalizationConfig,
  type RelationshipPersonalizationPolicy,
  type UpdateRelationshipIntelPreferencesInput,
} from "./relationship-personalization.types";
import { derivePersonalizationProfile } from "./relationship-personalization.engine";

export interface RelationshipPersonalizationPorts {
  /** null = no row yet (defaults apply). Throws on read failure. */
  getPreferences(viewerId: string): Promise<RelationshipIntelPreferencesDTO | null>;
  upsertPreferences(
    viewerId: string,
    preferences: RelationshipIntelPreferencesDTO,
  ): Promise<RelationshipIntelPreferencesDTO>;
  deletePreferences(viewerId: string): Promise<void>;
  /** Events inside the behavior window, newest first. Throws on read failure. */
  listInteractions(viewerId: string, sinceIso: string): Promise<RelationshipIntelInteraction[]>;
  insertInteraction(
    viewerId: string,
    kind: RelationshipIntelInteractionKind,
    recommendationType: "reconnect" | null,
  ): Promise<void>;
  deleteInteractions(viewerId: string): Promise<void>;
  pruneInteractions(viewerId: string, beforeIso: string): Promise<void>;
  nowMs(): number;
}

const RECOMMENDATION_KINDS: readonly RelationshipIntelInteractionKind[] = [
  "recommendation_opened",
  "recommendation_dismissed",
];

export function createRelationshipPersonalizationService(
  ports: RelationshipPersonalizationPorts,
  config: RelationshipPersonalizationConfig = RELATIONSHIP_PERSONALIZATION_CONFIG,
) {
  function windowStartIso(nowMs: number): string {
    return new Date(nowMs - config.BEHAVIOR_WINDOW_DAYS * 86_400_000).toISOString();
  }

  async function buildResult(viewerId: string): Promise<BcMobileGetPersonalizationResult> {
    const stored = await ports.getPreferences(viewerId);
    const preferences = stored ?? { ...DEFAULT_RELATIONSHIP_INTEL_PREFERENCES };
    const needsInteractions =
      preferences.behavioralAdaptationEnabled &&
      (preferences.reconnectCadence === "auto" || preferences.preferredContactAction === "auto");
    const interactions = needsInteractions
      ? await ports.listInteractions(viewerId, windowStartIso(ports.nowMs()))
      : [];
    const profile = derivePersonalizationProfile(preferences, interactions, ports.nowMs(), config);
    return { preferences, profile };
  }

  return {
    /** Preferences + derived profile for the settings UI. Fails open at the fn layer. */
    getPersonalization: (viewerId: string): Promise<BcMobileGetPersonalizationResult> =>
      buildResult(viewerId),

    /** Merge explicit updates over stored (or default) preferences. */
    async updatePreferences(
      viewerId: string,
      input: UpdateRelationshipIntelPreferencesInput,
    ): Promise<BcMobileGetPersonalizationResult> {
      const stored = await ports.getPreferences(viewerId);
      const base = stored ?? { ...DEFAULT_RELATIONSHIP_INTEL_PREFERENCES };
      const next: RelationshipIntelPreferencesDTO = {
        ...base,
        ...input,
        policyVersion: config.POLICY_VERSION,
      };
      await ports.upsertPreferences(viewerId, next);
      return buildResult(viewerId);
    },

    /**
     * Record one allowlisted interaction. Learning OFF ⇒ not recorded.
     * Action kinds never carry a recommendation type (normalized here).
     * Opportunistic retention: events older than the window are pruned.
     */
    async recordInteraction(
      viewerId: string,
      kind: RelationshipIntelInteractionKind,
      recommendationType: "reconnect" | null,
    ): Promise<BcMobileRecordInteractionResult> {
      const stored = await ports.getPreferences(viewerId);
      const preferences = stored ?? { ...DEFAULT_RELATIONSHIP_INTEL_PREFERENCES };
      if (!preferences.behavioralAdaptationEnabled) return { ok: true, recorded: false };
      const type = RECOMMENDATION_KINDS.includes(kind) ? recommendationType : null;
      await ports.insertInteraction(viewerId, kind, type);
      await ports.pruneInteractions(viewerId, windowStartIso(ports.nowMs()));
      return { ok: true, recorded: true };
    },

    /** Full reset: delete preferences row + all recorded interactions. */
    async reset(viewerId: string): Promise<{ ok: true }> {
      await ports.deleteInteractions(viewerId);
      await ports.deletePreferences(viewerId);
      return { ok: true };
    },

    /**
     * Policy consumed by 6A composition. Returns null on ANY failure so
     * callers fall back to deterministic defaults (fail open to baseline).
     */
    async getPolicy(viewerId: string): Promise<RelationshipPersonalizationPolicy | null> {
      try {
        const { preferences, profile } = await buildResult(viewerId);
        return Object.freeze({
          recommendationsEnabled: preferences.recommendationsEnabled,
          reconnectEnabled: preferences.reconnectEnabled,
          reconnectThresholdDays: profile.reconnectThresholdDays,
          cadenceSource: profile.cadenceSource,
        });
      } catch {
        return null;
      }
    },
  };
}

export type RelationshipPersonalizationService = ReturnType<
  typeof createRelationshipPersonalizationService
>;
