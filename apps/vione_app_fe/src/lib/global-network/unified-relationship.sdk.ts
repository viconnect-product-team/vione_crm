// BC-3.1E — UnifiedRelationshipSDK (client-facing façade).
// The ONLY entry point UI/hook code uses to read the composed relationship view.
// Delegates to the authenticated server-function adapter (RPC stub, client-safe).

import { getUnifiedRelationshipBySlugFn } from "@/lib/unified-relationship.functions";
import type { UnifiedRelationshipView } from "./unified-relationship.types";

export const UnifiedRelationshipSDK = {
  /** Composed, viewer-scoped relationship view for a Business Card slug. */
  getBySlug: (cardSlug: string): Promise<UnifiedRelationshipView> =>
    getUnifiedRelationshipBySlugFn({ data: { cardSlug } }),
};

export type UnifiedRelationshipSDKType = typeof UnifiedRelationshipSDK;
