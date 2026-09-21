// BC-3.1C — Stable client-side messaging for global-network domain errors.
// Never surfaces raw SQL/RLS text. Maps a thrown error (whose message carries a
// stable NETWORK_* code across the RPC boundary) to an i18n key the UI resolves.

import { isNetworkErrorCode, type NetworkErrorCode } from "./errors";
import type { TKey } from "@/lib/i18n";

/** Extract the stable NETWORK_* code from any thrown error, else UNKNOWN. */
export function toNetworkErrorCode(err: unknown): NetworkErrorCode {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const direct = raw.trim();
  if (isNetworkErrorCode(direct)) return direct;
  const match = raw.match(/NETWORK_[A-Z_]+/);
  if (match && isNetworkErrorCode(match[0])) return match[0];
  return "NETWORK_UNKNOWN";
}

const CODE_TO_TKEY: Record<NetworkErrorCode, TKey> = {
  NETWORK_AUTH_REQUIRED: "connect.network.err.authRequired",
  NETWORK_ACCOUNT_INACTIVE: "connect.network.err.accountInactive",
  NETWORK_ACCOUNT_SUSPENDED: "connect.network.err.accountSuspended",
  NETWORK_SELF_CONNECTION: "connect.network.err.selfConnection",
  NETWORK_TARGET_NOT_FOUND: "connect.network.err.targetNotFound",
  NETWORK_TARGET_UNAVAILABLE: "connect.network.err.targetUnavailable",
  NETWORK_ALREADY_PENDING: "connect.network.err.alreadyPending",
  NETWORK_ALREADY_CONNECTED: "connect.network.err.alreadyConnected",
  NETWORK_BLOCKED: "connect.network.err.blocked",
  NETWORK_CONNECTION_NOT_FOUND: "connect.network.err.connectionNotFound",
  NETWORK_NOT_PARTICIPANT: "connect.network.err.notParticipant",
  NETWORK_INVALID_TRANSITION: "connect.network.err.invalidTransition",
  NETWORK_NOT_REQUESTER: "connect.network.err.notRequester",
  NETWORK_NOT_RECIPIENT: "connect.network.err.notRecipient",
  NETWORK_RATE_LIMITED: "connect.network.err.rateLimited",
  NETWORK_PAIR_COOLDOWN: "connect.network.err.pairCooldown",
  NETWORK_REPORT_RATE_LIMITED: "connect.network.err.reportRateLimited",
  NETWORK_MUTATION_CONFLICT: "connect.network.err.mutationConflict",
  NETWORK_IMMUTABLE_FIELD: "connect.network.err.immutableField",
  NETWORK_UNKNOWN: "connect.network.err.unknown",
};

/** Resolve the i18n key for a thrown networking error. */
export function networkErrorTKey(err: unknown): TKey {
  return CODE_TO_TKEY[toNetworkErrorCode(err)];
}
