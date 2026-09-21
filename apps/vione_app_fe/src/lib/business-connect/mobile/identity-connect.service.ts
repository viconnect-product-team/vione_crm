// BC-Mobile-5E — Connection Handshake service (server-side logic).
//
// The ONLY new capability 5E adds: resolve an opaque 5A share token to the
// identity owner SERVER-SIDE, then delegate every read/mutation to the
// frozen Global Networking state machine (BC-3.1A/B/F). No new state
// machine, no new table, no parallel timeline.
//
// Privacy contract:
// - Token → owner resolution uses the privileged server client in ONE
//   lookup (same pattern as the 5A public resolver). The owner id is used
//   only to call the viewer-scoped GlobalConnectionService and is NEVER
//   serialized to the client.
// - Every failure mode of the lookup (unknown/revoked token, disabled
//   identity) collapses to the neutral `unavailable` state — no oracle.
// - Blocked pairs (either direction) also map to `unavailable`: the viewer
//   can never learn they were blocked from this surface.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { GlobalConnectionService } from "@/lib/global-network/service";
import type { GlobalConnectionMutationResult, PairState } from "@/lib/global-network/types";
import type { IdentityConnectionState } from "./identity-connect.types";

type DB = SupabaseClient<Database>;

const UNAVAILABLE: IdentityConnectionState = { state: "unavailable", connectionId: null };

/**
 * Resolve an active share token to its identity owner. Returns null for any
 * failure mode — identical semantics to the anonymous public resolver.
 */
async function resolveShareTokenOwner(token: string): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: link } = await supabaseAdmin
    .from("identity_share_links")
    .select("identity_id, status")
    .eq("public_token", token)
    .eq("status", "active")
    .maybeSingle();
  if (!link) return null;

  const { data: identity } = await supabaseAdmin
    .from("business_identities")
    .select("owner_user_id")
    .eq("id", link.identity_id)
    .eq("status", "active")
    .maybeSingle();

  return identity?.owner_user_id ?? null;
}

/** Map the canonical pair state onto the viewer-relative handshake DTO. */
export function pairStateToIdentityConnection(pair: PairState): IdentityConnectionState {
  if (pair.blocked) return UNAVAILABLE;
  if (pair.direction === "self") return { state: "self", connectionId: null };
  if (pair.status === "accepted") return { state: "connected", connectionId: null };
  if (pair.status === "pending" && pair.direction === "outgoing") {
    return { state: "outgoing_pending", connectionId: pair.connectionId };
  }
  if (pair.status === "pending" && pair.direction === "incoming") {
    return { state: "incoming_pending", connectionId: pair.connectionId };
  }
  // Terminal statuses (declined/cancelled/disconnected) and "none" all allow
  // a fresh request — subject to the RPC's resend cooldown.
  return { state: "none", connectionId: null };
}

/** Authenticated, viewer-relative handshake state for a share token. */
export async function getIdentityConnectionState(
  supabase: DB,
  viewerUserId: string,
  token: string,
): Promise<IdentityConnectionState> {
  const ownerUserId = await resolveShareTokenOwner(token);
  if (!ownerUserId) return UNAVAILABLE;
  if (ownerUserId === viewerUserId) return { state: "self", connectionId: null };
  const pair = await GlobalConnectionService.getState(supabase, viewerUserId, ownerUserId);
  return pairStateToIdentityConnection(pair);
}

/**
 * Explicit handshake: send a connection request to the identity behind the
 * token. All guardrails live in the frozen RPC (self, blocked, duplicate,
 * open-state uniqueness, rate limit, resend cooldown, idempotent
 * mutationKey). Domain errors propagate as GlobalNetworkError; the UI maps
 * every failure to ONE generic toast.
 */
export async function sendIdentityConnectionRequest(
  supabase: DB,
  viewerUserId: string,
  token: string,
  mutationKey?: string,
): Promise<GlobalConnectionMutationResult> {
  const ownerUserId = await resolveShareTokenOwner(token);
  if (!ownerUserId) {
    // Neutral: indistinguishable from any other unavailable token.
    throw new Error("identity_unavailable");
  }
  return GlobalConnectionService.sendRequest(supabase, viewerUserId, {
    targetUserId: ownerUserId,
    // The handshake originates from an explicit Connect tap on the public
    // digital card; the transport (QR/NFC/link) is not attributable (5D).
    source: { type: "manual" },
    mutationKey,
  });
}
