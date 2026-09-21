// BC-5.0 — Connection service (server-only).
//
// Thin adapter over GlobalConnectionService, keyed on Relationship Graph
// `person` nodes. On accepted/disconnect/block it keeps the canonical
// CONNECTED_TO edge in the graph engine in sync — never writes graph_edges
// directly.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { GlobalConnectionService } from "@/lib/global-network/service";
import { GlobalConnectionRepository } from "@/lib/global-network/repository";
import { requireGlobalNetworkUser } from "@/lib/global-network/identity";
import { RelationshipGraphWriteService } from "@/lib/graph/graph.write.service.server";
import { RelationshipGraphWriteRepository } from "@/lib/graph/graph.write.repository.server";
import { mapNode } from "@/lib/graph/dto";
import { toConnectionError, ConnectionError } from "./errors";
import { resolveConnectionState } from "./state-resolver";
import type {
  ConnectionRelationshipStateDTO,
  ConnectionRequestDTO,
  ConnectionSummaryDTO,
  ListOptions,
  SendRequestInput,
} from "./types";

type DB = SupabaseClient<Database>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MESSAGE_MAX = 500;

function assertUuid(
  v: unknown,
  code: "TARGET_NOT_FOUND" | "REQUEST_NOT_FOUND" = "TARGET_NOT_FOUND",
): string {
  if (typeof v !== "string" || !UUID.test(v)) throw new ConnectionError(code);
  return v;
}

function stripMessage(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, MESSAGE_MAX);
  return t.length ? t : undefined;
}

/** Resolve a person node id → its owning user_profile user id. */
async function personNodeToUserId(sb: DB, personNodeId: string): Promise<string> {
  const { data, error } = await sb
    .from("graph_nodes")
    .select("external_ref_type, external_ref_id, node_kind, status")
    .eq("id", personNodeId)
    .maybeSingle();
  if (error || !data) throw new ConnectionError("TARGET_NOT_FOUND");
  if (data.node_kind !== "person" || data.external_ref_type !== "user_profile") {
    throw new ConnectionError("TARGET_NOT_FOUND");
  }
  if (data.status === "archived") throw new ConnectionError("TARGET_NOT_FOUND");
  return data.external_ref_id as string;
}

/** Get-or-create the canonical `person` node for a user_profile. */
async function ensurePersonNode(sb: DB, viewerUserId: string, userId: string): Promise<string> {
  const writes = new RelationshipGraphWriteService(sb, viewerUserId);
  const dto = await writes.resolveOrRegisterNode({
    nodeKind: "person",
    externalRefType: "user_profile",
    externalRefId: userId,
  });
  return dto.id;
}

async function personNodeForUser(sb: DB, userId: string): Promise<string | null> {
  const { data } = await sb
    .from("graph_nodes")
    .select("id")
    .eq("node_kind", "person")
    .eq("external_ref_type", "user_profile")
    .eq("external_ref_id", userId)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

async function targetAvailable(sb: DB, targetUserId: string): Promise<boolean> {
  const { data } = await sb
    .from("user_profiles")
    .select("account_status")
    .eq("user_id", targetUserId)
    .maybeSingle();
  if (!data) return false;
  const status = (data.account_status as string | undefined) ?? "active";
  return status !== "suspended" && status !== "deactivated";
}

/** Look up the raw blocker on a blocked pair without exposing it to callers. */
async function blockerUserId(sb: DB, userIdA: string, userIdB: string): Promise<string | null> {
  const { data } = await sb
    .from("user_connections")
    .select("requester_user_id, recipient_user_id, status")
    .eq("status", "blocked")
    .or(
      `and(requester_user_id.eq.${userIdA},recipient_user_id.eq.${userIdB}),` +
        `and(requester_user_id.eq.${userIdB},recipient_user_id.eq.${userIdA})`,
    )
    .maybeSingle();
  // In the frozen BC-3.1A model, the blocker is the requester of the blocked row.
  return (data?.requester_user_id as string | undefined) ?? null;
}

async function archiveConnectedToEdge(
  sb: DB,
  viewerUserId: string,
  viewerNodeId: string,
  targetNodeId: string,
): Promise<void> {
  const writes = new RelationshipGraphWriteRepository(sb);
  const svc = new RelationshipGraphWriteService(sb, viewerUserId);
  const a = await writes.findActiveEdge("CONNECTED_TO", viewerNodeId, targetNodeId);
  const b = a ? null : await writes.findActiveEdge("CONNECTED_TO", targetNodeId, viewerNodeId);
  const edge = a ?? b;
  if (edge) await svc.archiveEdge(edge.id);
}

async function toRequestDTO(
  sb: DB,
  row: {
    id: string;
    requesterUserId: string;
    recipientUserId: string;
    status: string;
    requestedAt: string;
    respondedAt: string | null;
    disconnectedAt: string | null;
  },
): Promise<ConnectionRequestDTO> {
  const [reqNode, recNode] = await Promise.all([
    personNodeForUser(sb, row.requesterUserId),
    personNodeForUser(sb, row.recipientUserId),
  ]);
  const status: ConnectionRequestDTO["status"] =
    row.status === "pending" || row.status === "accepted"
      ? (row.status as "pending" | "accepted")
      : row.status === "declined" || row.status === "cancelled"
        ? (row.status as "declined" | "cancelled")
        : "expired";
  return {
    id: row.id,
    requester: { personNodeId: reqNode ?? "", userId: row.requesterUserId },
    recipient: { personNodeId: recNode ?? "", userId: row.recipientUserId },
    status,
    createdAt: row.requestedAt,
    respondedAt: row.respondedAt,
  };
}

export const ConnectionService = {
  async sendRequest(sb: DB, userId: string | null, input: SendRequestInput) {
    try {
      const me = await requireGlobalNetworkUser(sb, userId);
      const targetPersonNodeId = assertUuid(input.targetPersonNodeId);
      const targetUserId = await personNodeToUserId(sb, targetPersonNodeId);
      if (targetUserId === me.userId) throw new ConnectionError("SELF_CONNECTION_FORBIDDEN");
      // Message currently persisted as source metadata (no schema change).
      const message = stripMessage(input.message);
      const result = await GlobalConnectionService.sendRequest(sb, me.userId, {
        targetUserId,
        source: message ? { type: "manual" } : undefined,
        mutationKey: input.mutationKey,
      });
      return { connectionId: result.connectionId, status: result.status };
    } catch (e) {
      throw toConnectionError(e);
    }
  },

  async acceptRequest(sb: DB, userId: string | null, requestId: string, mutationKey?: string) {
    try {
      const me = await requireGlobalNetworkUser(sb, userId);
      const id = assertUuid(requestId, "REQUEST_NOT_FOUND");
      const conn = await GlobalConnectionRepository.findById(sb, me.userId, id);
      if (!conn) throw new ConnectionError("REQUEST_NOT_FOUND");
      const counterpartId = GlobalConnectionRepository.getCounterpartUserId(conn, me.userId);
      const result = await GlobalConnectionService.accept(sb, me.userId, id, { mutationKey });
      // Sync canonical CONNECTED_TO edge — idempotent, keyed on request id.
      const [myNode, otherNode] = await Promise.all([
        ensurePersonNode(sb, me.userId, me.userId),
        ensurePersonNode(sb, me.userId, counterpartId),
      ]);
      const writes = new RelationshipGraphWriteService(sb, me.userId);
      await writes
        .connect({ sourceNodeId: myNode, targetNodeId: otherNode, idempotencyKey: `bc5:${id}` })
        .catch(() => undefined); // idempotent replay is not a lifecycle failure
      return result;
    } catch (e) {
      throw toConnectionError(e);
    }
  },

  async declineRequest(sb: DB, userId: string | null, requestId: string, mutationKey?: string) {
    try {
      const me = await requireGlobalNetworkUser(sb, userId);
      const id = assertUuid(requestId, "REQUEST_NOT_FOUND");
      return await GlobalConnectionService.decline(sb, me.userId, id, { mutationKey });
    } catch (e) {
      throw toConnectionError(e);
    }
  },

  async cancelRequest(sb: DB, userId: string | null, requestId: string, mutationKey?: string) {
    try {
      const me = await requireGlobalNetworkUser(sb, userId);
      const id = assertUuid(requestId, "REQUEST_NOT_FOUND");
      return await GlobalConnectionService.cancel(sb, me.userId, id, { mutationKey });
    } catch (e) {
      throw toConnectionError(e);
    }
  },

  async disconnect(
    sb: DB,
    userId: string | null,
    targetPersonNodeId: string,
    mutationKey?: string,
  ) {
    try {
      const me = await requireGlobalNetworkUser(sb, userId);
      const nodeId = assertUuid(targetPersonNodeId);
      const targetUserId = await personNodeToUserId(sb, nodeId);
      const pair = await GlobalConnectionRepository.findPairState(sb, me.userId, targetUserId);
      if (pair.status !== "accepted" || !pair.connectionId) {
        throw new ConnectionError("NOT_CONNECTED");
      }
      const result = await GlobalConnectionService.disconnect(sb, me.userId, pair.connectionId, {
        mutationKey,
      });
      const myNode = await personNodeForUser(sb, me.userId);
      if (myNode) await archiveConnectedToEdge(sb, me.userId, myNode, nodeId);
      return result;
    } catch (e) {
      throw toConnectionError(e);
    }
  },

  async block(sb: DB, userId: string | null, targetPersonNodeId: string, mutationKey?: string) {
    try {
      const me = await requireGlobalNetworkUser(sb, userId);
      const nodeId = assertUuid(targetPersonNodeId);
      const targetUserId = await personNodeToUserId(sb, nodeId);
      const result = await GlobalConnectionService.block(sb, me.userId, targetUserId, {
        mutationKey,
      });
      const myNode = await personNodeForUser(sb, me.userId);
      if (myNode) await archiveConnectedToEdge(sb, me.userId, myNode, nodeId);
      return result;
    } catch (e) {
      throw toConnectionError(e);
    }
  },

  async unblock(sb: DB, userId: string | null, targetPersonNodeId: string) {
    try {
      const me = await requireGlobalNetworkUser(sb, userId);
      const nodeId = assertUuid(targetPersonNodeId);
      const targetUserId = await personNodeToUserId(sb, nodeId);
      const blocker = await blockerUserId(sb, me.userId, targetUserId);
      if (!blocker) throw new ConnectionError("BLOCK_NOT_FOUND");
      if (blocker !== me.userId) throw new ConnectionError("FORBIDDEN");
      // No dedicated RPC; update the row directly (RLS scopes to blocker).
      const { error } = await sb
        .from("user_connections")
        .update({ status: "disconnected", disconnected_at: new Date().toISOString() })
        .eq("status", "blocked")
        .eq("requester_user_id", me.userId)
        .eq("recipient_user_id", targetUserId);
      if (error) throw new ConnectionError("INTERNAL_ERROR");
      return { ok: true as const };
    } catch (e) {
      throw toConnectionError(e);
    }
  },

  async resolveRelationshipState(
    sb: DB,
    userId: string | null,
    targetPersonNodeId: string,
  ): Promise<ConnectionRelationshipStateDTO> {
    try {
      const me = await requireGlobalNetworkUser(sb, userId);
      const nodeId = assertUuid(targetPersonNodeId);
      const targetUserId = await personNodeToUserId(sb, nodeId).catch(() => null);
      if (!targetUserId) return { state: "unavailable" };
      if (targetUserId === me.userId) return { state: "unavailable" };
      const [pair, available] = await Promise.all([
        GlobalConnectionRepository.findPairState(sb, me.userId, targetUserId),
        targetAvailable(sb, targetUserId),
      ]);
      let blockedByMe = false;
      let blockedMe = false;
      if (pair.blocked) {
        const blocker = await blockerUserId(sb, me.userId, targetUserId);
        blockedByMe = blocker === me.userId;
        blockedMe = blocker !== null && blocker !== me.userId;
      }
      const state = resolveConnectionState({
        targetAvailable: available,
        blockedByMe,
        blockedMe,
        connected: pair.status === "accepted",
        incomingPending: pair.status === "pending" && pair.direction === "incoming",
        outgoingPending: pair.status === "pending" && pair.direction === "outgoing",
      });
      return {
        state,
        connectionId: pair.connectionId ?? null,
        requestId: pair.status === "pending" ? pair.connectionId : null,
      };
    } catch (e) {
      throw toConnectionError(e);
    }
  },

  async listIncomingRequests(sb: DB, userId: string | null, options?: ListOptions) {
    try {
      const me = await requireGlobalNetworkUser(sb, userId);
      const rows = await GlobalConnectionRepository.listIncomingPending(sb, me.userId, options);
      return Promise.all(rows.map((r: any) => toRequestDTO(sb, r)));
    } catch (e) {
      throw toConnectionError(e);
    }
  },

  async listOutgoingRequests(sb: DB, userId: string | null, options?: ListOptions) {
    try {
      const me = await requireGlobalNetworkUser(sb, userId);
      const rows = await GlobalConnectionRepository.listOutgoingPending(sb, me.userId, options);
      return Promise.all(rows.map((r: any) => toRequestDTO(sb, r)));
    } catch (e) {
      throw toConnectionError(e);
    }
  },

  async listConnections(
    sb: DB,
    userId: string | null,
    options?: ListOptions,
  ): Promise<ConnectionSummaryDTO[]> {
    try {
      const me = await requireGlobalNetworkUser(sb, userId);
      const rows = await GlobalConnectionRepository.listAccepted(sb, me.userId, options);
      const results = await Promise.all(
        rows.map(async (r) => {
          const counterpart = GlobalConnectionRepository.getCounterpartUserId(r, me.userId);
          const nodeId = await personNodeForUser(sb, counterpart);
          return {
            person: { personNodeId: nodeId ?? "", userId: counterpart },
            connectionId: r.id,
            connectedAt: r.updatedAt,
          };
        }),
      );
      return results.filter((x: any) => x.person.personNodeId.length > 0);
    } catch (e) {
      throw toConnectionError(e);
    }
  },

  /**
   * Block-aware exclusion helper for the Recommendation Engine.
   * Returns person node ids of all users blocked in either direction.
   */
  async listBlockedPersonNodeIds(sb: DB, userId: string): Promise<string[]> {
    const { data } = await sb
      .from("user_connections")
      .select("requester_user_id, recipient_user_id")
      .eq("status", "blocked")
      .or(`requester_user_id.eq.${userId},recipient_user_id.eq.${userId}`);
    if (!data?.length) return [];
    const others = new Set<string>();
    for (const r of data) {
      const req = (r as { requester_user_id: string }).requester_user_id;
      const rec = (r as { recipient_user_id: string }).recipient_user_id;
      others.add(req === userId ? rec : req);
    }
    if (!others.size) return [];
    const { data: nodes } = await sb
      .from("graph_nodes")
      .select("id, external_ref_id")
      .eq("node_kind", "person")
      .eq("external_ref_type", "user_profile")
      .in("external_ref_id", Array.from(others));
    return (nodes ?? []).map((n: any) => (n as { id: string }).id);
  },
};

// Re-export mapNode purely to keep the module graph stable for tests that
// consume the shared graph DTO helpers.
export { mapNode };
