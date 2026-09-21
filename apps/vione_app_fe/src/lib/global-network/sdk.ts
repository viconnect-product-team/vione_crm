// BC-3.1B — GlobalConnectionSDK.
// The single, stable façade application/UI code uses for Global Business
// Networking. It binds an authenticated Supabase client + trusted userId once,
// then delegates to GlobalConnectionService. It NEVER touches the DB directly,
// never duplicates the state machine, and returns only JSON-safe DTOs.
//
// Client-safe: statically imports no *.server module.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { GlobalConnectionService } from "./service";
import type {
  GlobalConnectionDTO,
  GlobalConnectionMutationResult,
  ListOptions,
  PairState,
  ReasonInput,
  SendRequestInput,
  StatusCounts,
} from "./types";

type DB = SupabaseClient<Database>;

export function createGlobalConnectionSDK(supabase: DB, userId: string | null | undefined) {
  return {
    // Mutations
    sendRequest: (input: SendRequestInput): Promise<GlobalConnectionMutationResult> =>
      GlobalConnectionService.sendRequest(supabase, userId, input),
    accept: (
      connectionId: string,
      options?: { mutationKey?: string },
    ): Promise<GlobalConnectionMutationResult> =>
      GlobalConnectionService.accept(supabase, userId, connectionId, options),
    decline: (connectionId: string, input?: ReasonInput): Promise<GlobalConnectionMutationResult> =>
      GlobalConnectionService.decline(supabase, userId, connectionId, input),
    cancel: (
      connectionId: string,
      options?: { mutationKey?: string },
    ): Promise<GlobalConnectionMutationResult> =>
      GlobalConnectionService.cancel(supabase, userId, connectionId, options),
    disconnect: (
      connectionId: string,
      input?: ReasonInput,
    ): Promise<GlobalConnectionMutationResult> =>
      GlobalConnectionService.disconnect(supabase, userId, connectionId, input),
    block: (targetUserId: string, input?: ReasonInput): Promise<GlobalConnectionMutationResult> =>
      GlobalConnectionService.block(supabase, userId, targetUserId, input),

    // Reads
    getState: (targetUserId: string): Promise<PairState> =>
      GlobalConnectionService.getState(supabase, userId, targetUserId),
    getById: (connectionId: string): Promise<GlobalConnectionDTO> =>
      GlobalConnectionService.getById(supabase, userId, connectionId),
    listIncomingRequests: (options?: ListOptions): Promise<GlobalConnectionDTO[]> =>
      GlobalConnectionService.listIncomingRequests(supabase, userId, options),
    listOutgoingRequests: (options?: ListOptions): Promise<GlobalConnectionDTO[]> =>
      GlobalConnectionService.listOutgoingRequests(supabase, userId, options),
    listConnections: (options?: ListOptions): Promise<GlobalConnectionDTO[]> =>
      GlobalConnectionService.listConnections(supabase, userId, options),
    countByStatus: (): Promise<StatusCounts> =>
      GlobalConnectionService.countByStatus(supabase, userId),
  };
}

export type GlobalConnectionSDK = ReturnType<typeof createGlobalConnectionSDK>;
