// BC-Mobile-5E — Incoming connection requests (mobile Network surface).
//
// ONE bounded query feeds both the Network entry row (badge count) and the
// /connect-app/network/requests page. Counterpart identity resolves through
// the privacy-safe public summaries only — no raw user records. Accept and
// decline delegate to the frozen GlobalNetworkSDK verbs with idempotent
// mutation keys; every mutation invalidates this list AND the Network
// composition so a freshly accepted person appears in Network immediately.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GlobalNetworkSDK } from "@/lib/global-network/network.sdk";
import { bcMobileNetworkKeys } from "@/hooks/use-business-connect-network";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import type { CounterpartSummary, GlobalConnectionDTO } from "@/lib/global-network/types";

export const BC_MOBILE_REQUESTS_PAGE_SIZE = 25;

export const networkRequestKeys = {
  root: ["bc-mobile", "network-requests"] as const,
  incoming: (viewerUserId: string) =>
    [...networkRequestKeys.root, viewerUserId, "incoming"] as const,
};

export type BcMobileConnectionRequest = {
  connectionId: string;
  requestedAt: string;
  counterpart: CounterpartSummary | null;
};

export function toConnectionRequest(
  connection: GlobalConnectionDTO,
  counterpart: CounterpartSummary | null,
): BcMobileConnectionRequest {
  return {
    connectionId: connection.id,
    requestedAt: connection.createdAt,
    counterpart,
  };
}

/** Truthful badge label: exact count below the page bound, "N+" beyond it. */
export function requestCountLabel(loaded: number, pageSize: number): string {
  return loaded >= pageSize ? `${pageSize}+` : String(loaded);
}

import { safeRandomUUID } from "@/lib/utils";

function newMutationKey(): string {
  return safeRandomUUID();
}

export function useIncomingConnectionRequests(enabled = true) {
  const viewerId = useViewerUserId();
  const viewerKey = viewerId ?? "viewer-pending";
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: networkRequestKeys.incoming(viewerKey),
    enabled: enabled && viewerId !== null,
    staleTime: 15_000,
    queryFn: async (): Promise<BcMobileConnectionRequest[]> => {
      const list = await GlobalNetworkSDK.connections.listIncoming({
        limit: BC_MOBILE_REQUESTS_PAGE_SIZE,
      });
      const ids = Array.from(new Set(list.map((c: any) => c.counterpartUserId)));
      const summaries = ids.length ? await GlobalNetworkSDK.counterparts.resolvePublic(ids) : [];
      const byId = new Map(summaries.map((s) => [s.userId, s]));
      return list.map((c: any) => toConnectionRequest(c, byId.get(c.counterpartUserId) ?? null));
    },
  });

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: networkRequestKeys.root });
    void queryClient.invalidateQueries({ queryKey: bcMobileNetworkKeys.root });
    // BC-Mobile-6A — accept/decline changes relationship recency inputs.
    void queryClient.invalidateQueries({ queryKey: ["bc-mobile", "rel-intel"] });
  };

  const accept = useMutation({
    mutationFn: (connectionId: string) =>
      GlobalNetworkSDK.mutations.accept(connectionId, newMutationKey()),
    onSuccess: invalidateAll,
  });
  const decline = useMutation({
    mutationFn: (connectionId: string) =>
      GlobalNetworkSDK.mutations.decline(connectionId, { mutationKey: newMutationKey() }),
    onSuccess: invalidateAll,
  });

  const requests = query.data ?? [];
  return {
    requests,
    countLabel: requestCountLabel(requests.length, BC_MOBILE_REQUESTS_PAGE_SIZE),
    initialLoading: query.isPending && viewerId !== null,
    coreError: query.isError && !query.data,
    retry: () => void query.refetch(),
    accept,
    decline,
    busy: accept.isPending || decline.isPending,
  };
}
