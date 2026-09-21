// BC-5.0 — ConnectionSDK: framework-free, client-safe façade over the
// canonical Connection server fns. Product code MUST use this SDK — never
// the Global Networking `.functions` file or graph write endpoints — so
// person-node ↔ user-id resolution and graph synchronization stay inside
// the adapter.

import {
  acceptConnectionRequestFn,
  blockPersonFn,
  cancelConnectionRequestFn,
  declineConnectionRequestFn,
  disconnectPersonFn,
  listConnectionsFn,
  listIncomingConnectionRequestsFn,
  listOutgoingConnectionRequestsFn,
  resolveConnectionStateFn,
  sendConnectionRequestFn,
  unblockPersonFn,
} from "./connection.functions";
import type {
  ConnectionRelationshipStateDTO,
  ConnectionRequestDTO,
  ConnectionSummaryDTO,
  ListOptions,
  SendRequestInput,
} from "./types";

export const ConnectionSDK = {
  sendRequest: (i: SendRequestInput) => sendConnectionRequestFn({ data: i }),
  acceptRequest: (requestId: string, mutationKey?: string) =>
    acceptConnectionRequestFn({ data: { requestId, mutationKey } }),
  declineRequest: (requestId: string, mutationKey?: string) =>
    declineConnectionRequestFn({ data: { requestId, mutationKey } }),
  cancelRequest: (requestId: string, mutationKey?: string) =>
    cancelConnectionRequestFn({ data: { requestId, mutationKey } }),
  disconnect: (targetPersonNodeId: string, mutationKey?: string) =>
    disconnectPersonFn({ data: { targetPersonNodeId, mutationKey } }),
  block: (targetPersonNodeId: string, mutationKey?: string) =>
    blockPersonFn({ data: { targetPersonNodeId, mutationKey } }),
  unblock: (targetPersonNodeId: string) => unblockPersonFn({ data: { targetPersonNodeId } }),
  resolveRelationshipState: (targetPersonNodeId: string): Promise<ConnectionRelationshipStateDTO> =>
    resolveConnectionStateFn({ data: { targetPersonNodeId } }),
  listIncomingRequests: (o?: ListOptions): Promise<ConnectionRequestDTO[]> =>
    listIncomingConnectionRequestsFn({ data: o ?? {} }),
  listOutgoingRequests: (o?: ListOptions): Promise<ConnectionRequestDTO[]> =>
    listOutgoingConnectionRequestsFn({ data: o ?? {} }),
  listConnections: (o?: ListOptions): Promise<ConnectionSummaryDTO[]> =>
    listConnectionsFn({ data: o ?? {} }),
};

export type ConnectionSDKType = typeof ConnectionSDK;
