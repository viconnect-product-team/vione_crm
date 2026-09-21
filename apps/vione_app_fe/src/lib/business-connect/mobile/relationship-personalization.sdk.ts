// BC-Mobile-6C — RelationshipPersonalizationSDK: stable client façade.
//
// UI code uses this and never imports server functions directly.
// Resilient: uses TanStack Start server functions with direct fetchNestApi fallback.

import { fetchNestApi } from "@/lib/api-client";
import {
  bcRelPersonalizationGetFn,
  bcRelPersonalizationRecordInteractionFn,
  bcRelPersonalizationResetFn,
  bcRelPersonalizationUpdateFn,
} from "./relationship-personalization.functions";
import type {
  BcMobileGetPersonalizationResult,
  BcMobileRecordInteractionResult,
  BcMobileResetPersonalizationResult,
  BcMobileUpdateRelationshipIntelPreferencesResult,
  RelationshipIntelInteractionKind,
  UpdateRelationshipIntelPreferencesInput,
} from "./relationship-personalization.types";

export const RelationshipPersonalizationSDK = {
  get: async (): Promise<BcMobileGetPersonalizationResult> => {
    try {
      return await bcRelPersonalizationGetFn();
    } catch {
      return await fetchNestApi<BcMobileGetPersonalizationResult>("/connect-app/network/personalization/get");
    }
  },

  update: async (
    input: UpdateRelationshipIntelPreferencesInput,
  ): Promise<BcMobileUpdateRelationshipIntelPreferencesResult> => {
    try {
      return await bcRelPersonalizationUpdateFn({ data: input });
    } catch {
      return await fetchNestApi<BcMobileUpdateRelationshipIntelPreferencesResult>(
        "/connect-app/network/personalization/update",
        {
          method: "POST",
          body: JSON.stringify(input),
        },
      );
    }
  },

  record: async (
    kind: RelationshipIntelInteractionKind,
    recommendationType?: "reconnect" | null,
  ): Promise<BcMobileRecordInteractionResult> => {
    try {
      return await bcRelPersonalizationRecordInteractionFn({ data: { kind, recommendationType } });
    } catch {
      return await fetchNestApi<BcMobileRecordInteractionResult>(
        "/connect-app/network/personalization/record-interaction",
        {
          method: "POST",
          body: JSON.stringify({ kind, recommendationType }),
        },
      );
    }
  },

  reset: async (): Promise<BcMobileResetPersonalizationResult> => {
    try {
      return await bcRelPersonalizationResetFn();
    } catch {
      return await fetchNestApi<BcMobileResetPersonalizationResult>(
        "/connect-app/network/personalization/reset",
        {
          method: "POST",
        },
      );
    }
  },
};

export type RelationshipPersonalizationSDKType = typeof RelationshipPersonalizationSDK;
