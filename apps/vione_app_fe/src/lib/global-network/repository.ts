// BC-3.1A — GlobalConnectionRepository.
// The ONLY ordinary application module that queries user_connections directly.
// Reads are participant-scoped by RLS (auth.uid() ∈ participants) AND by the
// trusted current-user id passed in. Mutations are NOT done here — they go
// through the controlled global_connection_* database functions.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type {
  GlobalConnection,
  GlobalConnectionStatus,
  ListOptions,
  PairState,
  StatusCounts,
} from "./types";
import { GLOBAL_CONNECTION_STATUSES } from "./types";

type DB = SupabaseClient<Database>;

const MAX_PAGE = 100;
const DEFAULT_PAGE = 50;

/** Apply a stable, bounded range to a query builder for pagination. */

function applyRange<Q extends { range: (from: number, to: number) => any }>(
  q: Q,
  options?: ListOptions,
): Q {
  const limit = Math.min(Math.max(options?.limit ?? DEFAULT_PAGE, 1), MAX_PAGE);
  const offset = Math.max(options?.offset ?? 0, 0);
  return q.range(offset, offset + limit - 1) as Q;
}

const TABLE = "user_connections";
const SELECT =
  "id, requester_user_id, recipient_user_id, status, source_type, source_id, status_reason, requested_at, responded_at, disconnected_at, created_at, updated_at";

type Row = {
  id: string;
  requester_user_id: string;
  recipient_user_id: string;
  status: GlobalConnectionStatus;
  source_type: GlobalConnection["sourceType"];
  source_id: string | null;
  status_reason: string | null;
  requested_at: string;
  responded_at: string | null;
  disconnected_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Map a raw row to a participant-safe DTO (no internal pair/block fields). */
export function mapConnectionRow(row: Row): GlobalConnection {
  return {
    id: row.id,
    requesterUserId: row.requester_user_id,
    recipientUserId: row.recipient_user_id,
    status: row.status,
    sourceType: row.source_type,
    sourceId: row.source_id,
    statusReason: row.status_reason,
    requestedAt: row.requested_at,
    respondedAt: row.responded_at,
    disconnectedAt: row.disconnected_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const GlobalConnectionRepository = {
  async findById(
    supabase: DB,
    userId: string,
    connectionId: string,
  ): Promise<GlobalConnection | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT)
      .eq("id", connectionId)
      .or(`requester_user_id.eq.${userId},recipient_user_id.eq.${userId}`)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapConnectionRow(data as Row) : null;
  },

  /** Directional pair state relative to the current user. */
  async findPairState(supabase: DB, userId: string, targetUserId: string): Promise<PairState> {
    if (userId === targetUserId) {
      return {
        targetUserId,
        status: "none",
        direction: "self",
        connectionId: null,
        blocked: false,
      };
    }
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT)
      .in("status", ["pending", "accepted", "blocked"])
      .or(
        `and(requester_user_id.eq.${userId},recipient_user_id.eq.${targetUserId}),` +
          `and(requester_user_id.eq.${targetUserId},recipient_user_id.eq.${userId})`,
      )
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      return {
        targetUserId,
        status: "none",
        direction: "none",
        connectionId: null,
        blocked: false,
      };
    }
    const row = data as Row;
    const dto = mapConnectionRow(row);
    const direction = dto.requesterUserId === userId ? "outgoing" : "incoming";
    return {
      targetUserId,
      status: dto.status,
      direction: dto.status === "blocked" ? "none" : direction,
      connectionId: dto.id,
      blocked: dto.status === "blocked",
    };
  },

  async listIncomingPending(
    supabase: DB,
    userId: string,
    options?: ListOptions,
  ): Promise<GlobalConnection[]> {
    let q = supabase
      .from(TABLE)
      .select(SELECT)
      .eq("recipient_user_id", userId)
      .eq("status", "pending")
      .order("requested_at", { ascending: false });
    q = applyRange(q, options);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => mapConnectionRow(r as Row));
  },

  async listOutgoingPending(
    supabase: DB,
    userId: string,
    options?: ListOptions,
  ): Promise<GlobalConnection[]> {
    let q = supabase
      .from(TABLE)
      .select(SELECT)
      .eq("requester_user_id", userId)
      .eq("status", "pending")
      .order("requested_at", { ascending: false });
    q = applyRange(q, options);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => mapConnectionRow(r as Row));
  },

  async listAccepted(
    supabase: DB,
    userId: string,
    options?: ListOptions,
  ): Promise<GlobalConnection[]> {
    let q = supabase
      .from(TABLE)
      .select(SELECT)
      .eq("status", "accepted")
      .or(`requester_user_id.eq.${userId},recipient_user_id.eq.${userId}`)
      .order("updated_at", { ascending: false });
    q = applyRange(q, options);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => mapConnectionRow(r as Row));
  },

  /** Participant-scoped list filtered by a single status, stable ordering. */
  async listByStatus(
    supabase: DB,
    userId: string,
    status: GlobalConnectionStatus,
    options?: ListOptions,
  ): Promise<GlobalConnection[]> {
    let q = supabase
      .from(TABLE)
      .select(SELECT)
      .eq("status", status)
      .or(`requester_user_id.eq.${userId},recipient_user_id.eq.${userId}`)
      .order("updated_at", { ascending: false });
    q = applyRange(q, options);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => mapConnectionRow(r as Row));
  },

  /** The other participant relative to the current user (pure, no I/O). */
  getCounterpartUserId(connection: GlobalConnection, userId: string): string {
    return connection.requesterUserId === userId
      ? connection.recipientUserId
      : connection.requesterUserId;
  },

  async isBlockedPair(supabase: DB, userId: string, targetUserId: string): Promise<boolean> {
    const state = await this.findPairState(supabase, userId, targetUserId);
    return state.blocked;
  },

  async countByStatus(supabase: DB, userId: string): Promise<StatusCounts> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("status")
      .or(`requester_user_id.eq.${userId},recipient_user_id.eq.${userId}`);
    if (error) throw new Error(error.message);
    const counts = Object.fromEntries(
      GLOBAL_CONNECTION_STATUSES.map((s) => [s, 0]),
    ) as StatusCounts;
    for (const r of data ?? []) {
      const s = (r as { status: GlobalConnectionStatus }).status;
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  },
};
