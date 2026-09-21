// BC-3.1B — GlobalConnectionService.
// The authoritative APPLICATION service for Global Business Networking.
// Responsibilities:
//   • require an active platform networking user (no member row needed)
//   • validate + normalize input server-side (never trust client identity/status)
//   • delegate every lifecycle MUTATION to the authoritative BC-3.1A
//     global_connection_* RPCs (state machine lives in the DB)
//   • delegate every ordinary READ to GlobalConnectionRepository
//   • map results to JSON-safe, direction-aware DTOs
//   • map raw DB/RLS errors to stable typed domain errors
//   • emit safe telemetry
//
// It NEVER queries user_connections directly and NEVER duplicates the state
// machine. Statically imports NO *.server module → safe from *.functions.ts.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { GlobalNetworkError, toGlobalNetworkError } from "./errors";
import { requireGlobalNetworkUser } from "./identity";
import { GlobalConnectionRepository } from "./repository";
import { toConnectionDTO, toConnectionDTOs } from "./mappers";
import { normalizeSourceId, normalizeSourceType } from "./source";
import { withTelemetry } from "./telemetry";
import type {
  GlobalConnectionDTO,
  GlobalConnectionMutationResult,
  GlobalConnectionStatus,
  ListOptions,
  PairState,
  ReasonInput,
  SendRequestInput,
  StatusCounts,
} from "./types";

type DB = SupabaseClient<Database>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REASON_MAX = 500;

function assertUuid(v: unknown): string {
  if (typeof v !== "string" || !UUID.test(v)) {
    throw new GlobalNetworkError("NETWORK_TARGET_NOT_FOUND");
  }
  return v;
}

function assertConnectionId(v: unknown): string {
  if (typeof v !== "string" || !UUID.test(v)) {
    throw new GlobalNetworkError("NETWORK_CONNECTION_NOT_FOUND");
  }
  return v;
}

function cleanReason(v: string | undefined): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim().slice(0, REASON_MAX);
  return t.length ? t : undefined;
}

import { safeRandomUUID } from "@/lib/utils";

/** Server-side mutation key: use caller key if provided, else deterministic new. */
function resolveMutationKey(key: string | undefined): string {
  if (typeof key === "string" && key.trim().length >= 8 && key.length <= 200) {
    return key.trim();
  }
  return safeRandomUUID();
}

function parseMutationResult(json: unknown): GlobalConnectionMutationResult {
  const obj = (json ?? {}) as Record<string, unknown>;
  return {
    connectionId: String(obj.connectionId ?? ""),
    status: obj.status as GlobalConnectionStatus,
  };
}

export const GlobalConnectionService = {
  // ── Mutations (delegated to authoritative RPCs) ────────────────────────────

  async sendRequest(
    supabase: DB,
    userId: string | null | undefined,
    input: SendRequestInput,
  ): Promise<GlobalConnectionMutationResult> {
    const me = await requireGlobalNetworkUser(supabase, userId);
    const target = assertUuid(input?.targetUserId);
    if (target === me.userId) throw new GlobalNetworkError("NETWORK_SELF_CONNECTION");
    const sourceType = normalizeSourceType(input?.source?.type);
    const sourceId = normalizeSourceId(input?.source?.id);
    const mutationKey = resolveMutationKey(input?.mutationKey);

    return withTelemetry("send_request", mutationKey, async () => {
      // BC-3.1F — rate-limit + cooldown guard wraps the frozen state-machine RPC.
      const { data, error } = await supabase.rpc("global_connection_send_request_guarded", {
        _target_user_id: target,
        _source_type: sourceType,
        _source_id: sourceId ?? undefined,
        _mutation_key: mutationKey,
      });
      if (error) throw toGlobalNetworkError(error);
      return parseMutationResult(data);
    });
  },

  async accept(
    supabase: DB,
    userId: string | null | undefined,
    connectionId: string,
    options?: { mutationKey?: string },
  ): Promise<GlobalConnectionMutationResult> {
    await requireGlobalNetworkUser(supabase, userId);
    const id = assertConnectionId(connectionId);
    const mutationKey = resolveMutationKey(options?.mutationKey);
    return withTelemetry("accept", id, async () => {
      const { data, error } = await supabase.rpc("global_connection_accept", {
        _connection_id: id,
        _mutation_key: mutationKey,
      });
      if (error) throw toGlobalNetworkError(error);
      return parseMutationResult(data);
    });
  },

  async decline(
    supabase: DB,
    userId: string | null | undefined,
    connectionId: string,
    input?: ReasonInput,
  ): Promise<GlobalConnectionMutationResult> {
    await requireGlobalNetworkUser(supabase, userId);
    const id = assertConnectionId(connectionId);
    const mutationKey = resolveMutationKey(input?.mutationKey);
    return withTelemetry("decline", id, async () => {
      const { data, error } = await supabase.rpc("global_connection_decline", {
        _connection_id: id,
        _reason: cleanReason(input?.reason),
        _mutation_key: mutationKey,
      });
      if (error) throw toGlobalNetworkError(error);
      return parseMutationResult(data);
    });
  },

  async cancel(
    supabase: DB,
    userId: string | null | undefined,
    connectionId: string,
    options?: { mutationKey?: string },
  ): Promise<GlobalConnectionMutationResult> {
    await requireGlobalNetworkUser(supabase, userId);
    const id = assertConnectionId(connectionId);
    const mutationKey = resolveMutationKey(options?.mutationKey);
    return withTelemetry("cancel", id, async () => {
      const { data, error } = await supabase.rpc("global_connection_cancel", {
        _connection_id: id,
        _mutation_key: mutationKey,
      });
      if (error) throw toGlobalNetworkError(error);
      return parseMutationResult(data);
    });
  },

  async disconnect(
    supabase: DB,
    userId: string | null | undefined,
    connectionId: string,
    input?: ReasonInput,
  ): Promise<GlobalConnectionMutationResult> {
    await requireGlobalNetworkUser(supabase, userId);
    const id = assertConnectionId(connectionId);
    const mutationKey = resolveMutationKey(input?.mutationKey);
    return withTelemetry("disconnect", id, async () => {
      const { data, error } = await supabase.rpc("global_connection_disconnect", {
        _connection_id: id,
        _reason: cleanReason(input?.reason),
        _mutation_key: mutationKey,
      });
      if (error) throw toGlobalNetworkError(error);
      return parseMutationResult(data);
    });
  },

  async block(
    supabase: DB,
    userId: string | null | undefined,
    targetUserId: string,
    input?: ReasonInput,
  ): Promise<GlobalConnectionMutationResult> {
    const me = await requireGlobalNetworkUser(supabase, userId);
    const target = assertUuid(targetUserId);
    if (target === me.userId) throw new GlobalNetworkError("NETWORK_SELF_CONNECTION");
    const mutationKey = resolveMutationKey(input?.mutationKey);
    return withTelemetry("block", mutationKey, async () => {
      const { data, error } = await supabase.rpc("global_connection_block", {
        _target_user_id: target,
        _reason: cleanReason(input?.reason),
        _mutation_key: mutationKey,
      });
      if (error) throw toGlobalNetworkError(error);
      return parseMutationResult(data);
    });
  },

  /**
   * unblock is NOT part of the frozen BC-3.0/3.1A lifecycle (no RPC exists).
   * Contract stub only — never fabricate a transition. Callers must treat this
   * as unsupported until a future slice ships the authoritative RPC.
   */
  async unblock(
    _supabase: DB,
    _userId: string | null | undefined,
    _targetUserId: string,
    _input?: ReasonInput,
  ): Promise<never> {
    throw new GlobalNetworkError("NETWORK_INVALID_TRANSITION");
  },

  // ── Reads (delegated to repository) ────────────────────────────────────────

  async getState(
    supabase: DB,
    userId: string | null | undefined,
    targetUserId: string,
  ): Promise<PairState> {
    const me = await requireGlobalNetworkUser(supabase, userId);
    const target = assertUuid(targetUserId);
    return withTelemetry("get_state", target, () =>
      GlobalConnectionRepository.findPairState(supabase, me.userId, target).catch((e) => {
        throw toGlobalNetworkError(e);
      }),
    );
  },

  async getById(
    supabase: DB,
    userId: string | null | undefined,
    connectionId: string,
  ): Promise<GlobalConnectionDTO> {
    const me = await requireGlobalNetworkUser(supabase, userId);
    const id = assertConnectionId(connectionId);
    const conn = await GlobalConnectionRepository.findById(supabase, me.userId, id).catch((e) => {
      throw toGlobalNetworkError(e);
    });
    if (!conn) throw new GlobalNetworkError("NETWORK_CONNECTION_NOT_FOUND");
    return toConnectionDTO(conn, me.userId);
  },

  async listIncomingRequests(
    supabase: DB,
    userId: string | null | undefined,
    options?: ListOptions,
  ): Promise<GlobalConnectionDTO[]> {
    const me = await requireGlobalNetworkUser(supabase, userId);
    return withTelemetry(
      "list",
      null,
      async () =>
        toConnectionDTOs(
          await GlobalConnectionRepository.listIncomingPending(supabase, me.userId, options),
          me.userId,
        ),
      (r) => ({ itemCount: r.length }),
    );
  },

  async listOutgoingRequests(
    supabase: DB,
    userId: string | null | undefined,
    options?: ListOptions,
  ): Promise<GlobalConnectionDTO[]> {
    const me = await requireGlobalNetworkUser(supabase, userId);
    return withTelemetry(
      "list",
      null,
      async () =>
        toConnectionDTOs(
          await GlobalConnectionRepository.listOutgoingPending(supabase, me.userId, options),
          me.userId,
        ),
      (r) => ({ itemCount: r.length }),
    );
  },

  async listConnections(
    supabase: DB,
    userId: string | null | undefined,
    options?: ListOptions,
  ): Promise<GlobalConnectionDTO[]> {
    const me = await requireGlobalNetworkUser(supabase, userId);
    return withTelemetry(
      "list",
      null,
      async () =>
        toConnectionDTOs(
          await GlobalConnectionRepository.listAccepted(supabase, me.userId, options),
          me.userId,
        ),
      (r) => ({ itemCount: r.length }),
    );
  },

  async countByStatus(supabase: DB, userId: string | null | undefined): Promise<StatusCounts> {
    const me = await requireGlobalNetworkUser(supabase, userId);
    return withTelemetry("count", null, () =>
      GlobalConnectionRepository.countByStatus(supabase, me.userId).catch((e) => {
        throw toGlobalNetworkError(e);
      }),
    );
  },

  /**
   * Suggestions are NOT part of BC-3.1B. Contract-only: return a deterministic
   * empty result — never fabricate suggestions.
   */
  async listSuggestedConnections(
    supabase: DB,
    userId: string | null | undefined,
  ): Promise<{ supported: false; items: [] }> {
    await requireGlobalNetworkUser(supabase, userId);
    return { supported: false, items: [] };
  },
};
