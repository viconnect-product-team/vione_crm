// BC-3.1B — Read-only relationship-state resolver.
// Composes the frozen BC-3.0 UnifiedRelationship view: saved-card status +
// global connection state (+ optional association contexts). Read-only: it
// NEVER mutates and NEVER duplicates the state machine. All access is
// participant-scoped through the repository and RLS.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireGlobalNetworkUser } from "./identity";
import { GlobalConnectionRepository } from "./repository";
import { toGlobalNetworkError } from "./errors";
import type { RelationshipState } from "./types";

type DB = SupabaseClient<Database>;

/**
 * Resolve the composed, read-only relationship state between the current user
 * and a target user. Deterministic: never fabricates data.
 */
export async function resolveRelationshipState(
  supabase: DB,
  userId: string | null | undefined,
  targetUserId: string,
  options?: { savedCard?: boolean; associationContexts?: RelationshipState["associationContexts"] },
): Promise<RelationshipState> {
  const me = await requireGlobalNetworkUser(supabase, userId);

  const pair = await GlobalConnectionRepository.findPairState(
    supabase,
    me.userId,
    targetUserId,
  ).catch((e) => {
    throw toGlobalNetworkError(e);
  });

  const savedCard = options?.savedCard ?? false;
  const associationContexts = options?.associationContexts ?? [];

  let globalConnection: RelationshipState["globalConnection"];
  if (pair.connectionId && pair.status !== "none" && pair.direction !== "self") {
    globalConnection = {
      id: pair.connectionId,
      status: pair.status,
      requestedByCurrentUser: pair.direction === "outgoing",
      direction: pair.direction === "outgoing" ? "outgoing" : "incoming",
    };
  }

  const effectiveState: RelationshipState["effectiveState"] = pair.blocked
    ? "blocked"
    : pair.status === "accepted"
      ? "connected"
      : pair.status === "pending"
        ? pair.direction === "outgoing"
          ? "pending_sent"
          : "pending_received"
        : savedCard
          ? "saved"
          : "none";

  return {
    savedCard,
    globalConnection,
    associationContexts,
    effectiveState,
  };
}
