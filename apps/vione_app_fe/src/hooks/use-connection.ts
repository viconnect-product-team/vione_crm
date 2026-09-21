// BC-5.1 — Canonical Connection UI data + mutation hooks.
//
// The ONLY connection-lifecycle data path for Business Connect UI. Wraps
// ConnectionSDK, centralizes query-key factory, invalidation matrix, toasts,
// and stable ConnectionError → i18n mapping. UI never calls the SDK directly.
//
// Counterpart profile enrichment (name / avatar / headline) uses
// GlobalNetworkSDK.counterparts.resolvePublic — a public-profile lookup,
// NOT a lifecycle operation — kept isolated to this hook module so the
// security-boundary audit only has to scan one file.

import { useCallback } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { ConnectionSDK, ConnectionError } from "@/lib/connection";
import type {
  ConnectionRelationshipStateDTO,
  ConnectionRequestDTO,
  ConnectionSummaryDTO,
  ConnectionErrorCode,
} from "@/lib/connection";
import { GlobalNetworkSDK } from "@/lib/global-network/network.sdk";
import type { CounterpartSummary } from "@/lib/global-network/types";
import { useT, type TKey } from "@/lib/i18n";

// ── Canonical query keys ────────────────────────────────────────────────
export const connectionKeys = {
  root: ["bc51", "connection"] as const,
  state: (targetPersonNodeId: string | null | undefined) =>
    ["bc51", "connection", "state", targetPersonNodeId ?? "-"] as const,
  incoming: (limit = 20) => ["bc51", "connection", "incoming", limit] as const,
  outgoing: (limit = 20) => ["bc51", "connection", "outgoing", limit] as const,
  connected: (limit = 20) => ["bc51", "connection", "connected", limit] as const,
  counterparts: (userIds: readonly string[]) =>
    ["bc51", "counterparts", [...userIds].sort().join(",")] as const,
};

const RECOMMENDATION_ROOT = ["bc45", "recommendations"] as const;

// ── Error → i18n mapping ────────────────────────────────────────────────
const ERROR_KEYS: Record<ConnectionErrorCode, TKey> = {
  UNAUTHENTICATED: "bc.conn.err.unauth",
  TARGET_NOT_FOUND: "bc.conn.err.notFound",
  SELF_CONNECTION_FORBIDDEN: "bc.conn.err.self",
  ALREADY_CONNECTED: "bc.conn.err.already",
  REQUEST_ALREADY_PENDING: "bc.conn.err.pending",
  REQUEST_NOT_FOUND: "bc.conn.err.reqNotFound",
  REQUEST_NOT_PENDING: "bc.conn.err.stale",
  REQUEST_NOT_OWNED: "bc.conn.err.notOwned",
  REQUEST_BLOCKED: "bc.conn.err.blocked",
  BLOCK_ALREADY_EXISTS: "bc.conn.err.blocked",
  BLOCK_NOT_FOUND: "bc.conn.err.notFound",
  NOT_CONNECTED: "bc.conn.err.notConnected",
  IDEMPOTENCY_CONFLICT: "bc.conn.err.stale",
  INVALID_INPUT: "bc.conn.err.invalid",
  FORBIDDEN: "bc.conn.err.forbidden",
  INTERNAL_ERROR: "bc.conn.err.internal",
};

export function connectionErrorTKey(err: unknown): TKey {
  if (err instanceof ConnectionError) return ERROR_KEYS[err.code] ?? "bc.conn.err.internal";
  return "bc.conn.err.internal";
}

// ── Relationship-state hook ─────────────────────────────────────────────
export function useConnectionRelationshipState(targetPersonNodeId: string | null | undefined) {
  return useQuery<ConnectionRelationshipStateDTO>({
    queryKey: connectionKeys.state(targetPersonNodeId),
    enabled: Boolean(targetPersonNodeId),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 1,
    queryFn: () => ConnectionSDK.resolveRelationshipState(targetPersonNodeId as string),
  });
}

// ── List hooks ──────────────────────────────────────────────────────────
export function useIncomingRequests(limit = 20) {
  return useQuery<ConnectionRequestDTO[]>({
    queryKey: connectionKeys.incoming(limit),
    staleTime: 30_000,
    queryFn: () => ConnectionSDK.listIncomingRequests({ limit }),
  });
}

export function useOutgoingRequests(limit = 20) {
  return useQuery<ConnectionRequestDTO[]>({
    queryKey: connectionKeys.outgoing(limit),
    staleTime: 30_000,
    queryFn: () => ConnectionSDK.listOutgoingRequests({ limit }),
  });
}

export function useConnectedPeople(limit = 20) {
  return useQuery<ConnectionSummaryDTO[]>({
    queryKey: connectionKeys.connected(limit),
    staleTime: 30_000,
    queryFn: () => ConnectionSDK.listConnections({ limit }),
  });
}

// ── Counterpart summaries ───────────────────────────────────────────────
export function useCounterparts(userIds: readonly string[]) {
  const stable = [...userIds].filter(Boolean).sort();
  return useQuery<Map<string, CounterpartSummary>>({
    queryKey: connectionKeys.counterparts(stable),
    enabled: stable.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const list = await GlobalNetworkSDK.counterparts.resolvePublic(stable);
      return new Map(list.map((s) => [s.userId, s]));
    },
  });
}

// ── Invalidation matrix ─────────────────────────────────────────────────
type Kind = "send" | "accept" | "decline" | "cancel" | "disconnect" | "block" | "unblock";

function invalidateFor(
  qc: ReturnType<typeof useQueryClient>,
  kind: Kind,
  targetPersonNodeId?: string,
) {
  const inv = (k: readonly unknown[]) => qc.invalidateQueries({ queryKey: k });
  if (targetPersonNodeId) inv(connectionKeys.state(targetPersonNodeId));
  switch (kind) {
    case "send":
      inv(["bc51", "connection", "outgoing"]);
      break;
    case "accept":
      inv(["bc51", "connection", "incoming"]);
      inv(["bc51", "connection", "connected"]);
      inv(RECOMMENDATION_ROOT);
      break;
    case "decline":
      inv(["bc51", "connection", "incoming"]);
      break;
    case "cancel":
      inv(["bc51", "connection", "outgoing"]);
      break;
    case "disconnect":
      inv(["bc51", "connection", "connected"]);
      inv(RECOMMENDATION_ROOT);
      break;
    case "block":
      inv(["bc51", "connection", "connected"]);
      inv(["bc51", "connection", "incoming"]);
      inv(["bc51", "connection", "outgoing"]);
      inv(RECOMMENDATION_ROOT);
      break;
    case "unblock":
      inv(RECOMMENDATION_ROOT);
      break;
  }
}

// ── Mutation hook ───────────────────────────────────────────────────────
type MutationBuilder<TVars> = (vars: TVars) => {
  kind: Kind;
  targetPersonNodeId?: string;
  run: () => Promise<unknown>;
};

function useConnectionMutation<TVars>(
  build: MutationBuilder<TVars>,
  successKey: TKey,
  opts?: Omit<UseMutationOptions<unknown, unknown, TVars>, "mutationFn">,
) {
  const t = useT();
  const qc = useQueryClient();
  return useMutation({
    ...opts,
    mutationFn: async (vars: TVars) => build(vars).run(),
    onSuccess: (...args: unknown[]) => {
      const vars = args[1] as TVars;
      const meta = build(vars);
      invalidateFor(qc, meta.kind, meta.targetPersonNodeId);
      toast.success(t(successKey));
      (opts?.onSuccess as ((...a: unknown[]) => void) | undefined)?.(...args);
    },
    onError: (...args: unknown[]) => {
      toast.error(t(connectionErrorTKey(args[0])));
      (opts?.onError as ((...a: unknown[]) => void) | undefined)?.(...args);
    },
  } as UseMutationOptions<unknown, unknown, TVars>);
}

export function useSendConnectionRequest() {
  return useConnectionMutation<{ targetPersonNodeId: string; message?: string }>(
    (v) => ({
      kind: "send",
      targetPersonNodeId: v.targetPersonNodeId,
      run: () =>
        ConnectionSDK.sendRequest({
          targetPersonNodeId: v.targetPersonNodeId,
          message: v.message,
        }),
    }),
    "bc.conn.toast.sent",
  );
}

export function useAcceptRequest() {
  return useConnectionMutation<{ requestId: string; targetPersonNodeId?: string }>(
    (v) => ({
      kind: "accept",
      targetPersonNodeId: v.targetPersonNodeId,
      run: () => ConnectionSDK.acceptRequest(v.requestId),
    }),
    "bc.conn.toast.accepted",
  );
}

export function useDeclineRequest() {
  return useConnectionMutation<{ requestId: string; targetPersonNodeId?: string }>(
    (v) => ({
      kind: "decline",
      targetPersonNodeId: v.targetPersonNodeId,
      run: () => ConnectionSDK.declineRequest(v.requestId),
    }),
    "bc.conn.toast.declined",
  );
}

export function useCancelRequest() {
  return useConnectionMutation<{ requestId: string; targetPersonNodeId?: string }>(
    (v) => ({
      kind: "cancel",
      targetPersonNodeId: v.targetPersonNodeId,
      run: () => ConnectionSDK.cancelRequest(v.requestId),
    }),
    "bc.conn.toast.cancelled",
  );
}

export function useDisconnect() {
  return useConnectionMutation<{ targetPersonNodeId: string }>(
    (v) => ({
      kind: "disconnect",
      targetPersonNodeId: v.targetPersonNodeId,
      run: () => ConnectionSDK.disconnect(v.targetPersonNodeId),
    }),
    "bc.conn.toast.disconnected",
  );
}

export function useBlockPerson() {
  return useConnectionMutation<{ targetPersonNodeId: string }>(
    (v) => ({
      kind: "block",
      targetPersonNodeId: v.targetPersonNodeId,
      run: () => ConnectionSDK.block(v.targetPersonNodeId),
    }),
    "bc.conn.toast.blocked",
  );
}

export function useUnblockPerson() {
  return useConnectionMutation<{ targetPersonNodeId: string }>(
    (v) => ({
      kind: "unblock",
      targetPersonNodeId: v.targetPersonNodeId,
      run: () => ConnectionSDK.unblock(v.targetPersonNodeId),
    }),
    "bc.conn.toast.unblocked",
  );
}

/** Convenience: invalidate a specific target state (e.g. after external refresh). */
export function useInvalidateConnectionState() {
  const qc = useQueryClient();
  return useCallback(
    (targetPersonNodeId: string) =>
      qc.invalidateQueries({ queryKey: connectionKeys.state(targetPersonNodeId) }),
    [qc],
  );
}
