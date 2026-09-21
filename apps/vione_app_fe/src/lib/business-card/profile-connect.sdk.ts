// BC-3.1D — ProfileConnectSDK: the stable client façade for Business Profile
// connect actions. UI code uses this and never imports the server functions
// directly. Thin delegation to the server-function adapters; no logic here.
//
// Client-safe: statically imports only *.functions (RPC stubs) and types.

import {
  acceptBusinessProfileConnectionFn,
  cancelBusinessProfileConnectionFn,
  declineBusinessProfileConnectionFn,
  disconnectBusinessProfileConnectionFn,
  getBusinessProfileRelationshipStateFn,
  sendBusinessProfileConnectionRequestFn,
} from "./profile-connect.functions";
import type { BusinessProfileRelationshipState } from "./profile-connect.types";
import type { GlobalConnectionMutationResult } from "@/lib/global-network/types";

export const ProfileConnectSDK = {
  getState(cardSlug: string): Promise<BusinessProfileRelationshipState> {
    return getBusinessProfileRelationshipStateFn({ data: { cardSlug } });
  },
  connect(cardSlug: string, mutationKey?: string): Promise<GlobalConnectionMutationResult> {
    return sendBusinessProfileConnectionRequestFn({ data: { cardSlug, mutationKey } });
  },
  accept(
    cardSlug: string,
    connectionId: string,
    mutationKey?: string,
  ): Promise<GlobalConnectionMutationResult> {
    return acceptBusinessProfileConnectionFn({ data: { cardSlug, connectionId, mutationKey } });
  },
  decline(
    cardSlug: string,
    connectionId: string,
    reason?: string,
    mutationKey?: string,
  ): Promise<GlobalConnectionMutationResult> {
    return declineBusinessProfileConnectionFn({
      data: { cardSlug, connectionId, reason, mutationKey },
    });
  },
  cancel(
    cardSlug: string,
    connectionId: string,
    mutationKey?: string,
  ): Promise<GlobalConnectionMutationResult> {
    return cancelBusinessProfileConnectionFn({ data: { cardSlug, connectionId, mutationKey } });
  },
  disconnect(
    cardSlug: string,
    connectionId: string,
    reason?: string,
    mutationKey?: string,
  ): Promise<GlobalConnectionMutationResult> {
    return disconnectBusinessProfileConnectionFn({
      data: { cardSlug, connectionId, reason, mutationKey },
    });
  },
};
