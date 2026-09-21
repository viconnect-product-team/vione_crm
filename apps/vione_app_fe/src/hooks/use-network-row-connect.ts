// BC-Mobile — inline connect actions for ONE Network row.
//
// Reuses the FROZEN BC-3.1D contract (ProfileConnectSDK, card-slug scoped):
// the row never learns a counterpart user id, never invents a state machine,
// and every transition flows through the canonical server functions.
// Enabled only for people who carry a public card slug and are not already an
// established connection — everything else renders no action at all.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProfileConnectSDK } from "@/lib/business-card/profile-connect.sdk";
import type { BusinessProfileRelationshipState } from "@/lib/business-card/profile-connect.types";
import { bcMobileNetworkKeys } from "@/hooks/use-business-connect-network";
import { networkRequestKeys } from "@/hooks/use-network-requests";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";

export type NetworkRowConnectAction = "connect" | "accept" | "decline" | "cancel";

export const networkRowConnectKeys = {
  root: ["bc-mobile", "network-row-connect"] as const,
  state: (viewerUserId: string, cardSlug: string) =>
    [...networkRowConnectKeys.root, viewerUserId, cardSlug] as const,
};

import { safeRandomUUID } from "@/lib/utils";

function newMutationKey(): string {
  return safeRandomUUID();
}

export function useNetworkRowConnect(cardSlug: string | null, enabled: boolean) {
  const viewerId = useViewerUserId();
  const viewerKey = viewerId ?? "viewer-pending";
  const queryClient = useQueryClient();
  const active = enabled && Boolean(cardSlug) && viewerId !== null;
  const slug = cardSlug ?? "";

  const stateQuery = useQuery<BusinessProfileRelationshipState>({
    queryKey: networkRowConnectKeys.state(viewerKey, slug),
    enabled: active,
    staleTime: 60_000,
    retry: 1,
    queryFn: () => ProfileConnectSDK.getState(slug),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: networkRowConnectKeys.state(viewerKey, slug) });
    void queryClient.invalidateQueries({ queryKey: bcMobileNetworkKeys.root });
    void queryClient.invalidateQueries({ queryKey: networkRequestKeys.root });
  };

  const connectionId = stateQuery.data?.connection?.id ?? null;

  const connect = useMutation({
    mutationFn: () => ProfileConnectSDK.connect(slug, newMutationKey()),
    onSuccess: invalidate,
    onError: invalidate,
  });
  const accept = useMutation({
    mutationFn: () => ProfileConnectSDK.accept(slug, connectionId as string, newMutationKey()),
    onSuccess: invalidate,
    onError: invalidate,
  });
  const decline = useMutation({
    mutationFn: () =>
      ProfileConnectSDK.decline(slug, connectionId as string, undefined, newMutationKey()),
    onSuccess: invalidate,
    onError: invalidate,
  });
  const cancel = useMutation({
    mutationFn: () => ProfileConnectSDK.cancel(slug, connectionId as string, newMutationKey()),
    onSuccess: invalidate,
    onError: invalidate,
  });

  return {
    state: stateQuery.data?.effectiveState ?? null,
    connectionId,
    ready: active && stateQuery.isSuccess,
    connect,
    accept,
    decline,
    cancel,
    busy: connect.isPending || accept.isPending || decline.isPending || cancel.isPending,
  };
}
