// BC-Mobile-5E — Public Card handshake hook.
//
// Query + mutations over IdentityConnectSDK for /c/:token. Enabled ONLY when
// the viewer is authenticated (anonymous viewers see the sign-in CTA, never
// a state fetch). Every mutation invalidates the state query — the RPC layer
// stays the single source of truth.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IdentityConnectSDK } from "@/lib/business-connect/mobile/identity-connect.sdk";

export const identityConnectionKeys = {
  root: ["bc-mobile", "identity-connection"] as const,
  state: (token: string) => [...identityConnectionKeys.root, "state", token] as const,
};

import { safeRandomUUID } from "@/lib/utils";

function newMutationKey(): string {
  return safeRandomUUID();
}

export function useIdentityConnection(token: string, enabled: boolean) {
  const queryClient = useQueryClient();
  const stateKey = identityConnectionKeys.state(token);

  const stateQuery = useQuery({
    queryKey: stateKey,
    enabled,
    staleTime: 10_000,
    queryFn: () => IdentityConnectSDK.getState(token),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: stateKey });

  const send = useMutation({
    mutationFn: () => IdentityConnectSDK.send(token, newMutationKey()),
    onSuccess: invalidate,
    onError: invalidate, // refetch the truthful state (cooldown/rate-limit no-ops)
  });
  const accept = useMutation({
    mutationFn: (connectionId: string) => IdentityConnectSDK.accept(connectionId, newMutationKey()),
    onSuccess: invalidate,
  });
  const decline = useMutation({
    mutationFn: (connectionId: string) =>
      IdentityConnectSDK.decline(connectionId, newMutationKey()),
    onSuccess: invalidate,
  });
  const withdraw = useMutation({
    mutationFn: (connectionId: string) =>
      IdentityConnectSDK.withdraw(connectionId, newMutationKey()),
    onSuccess: invalidate,
  });

  const busy = send.isPending || accept.isPending || decline.isPending || withdraw.isPending;

  return { stateQuery, send, accept, decline, withdraw, busy };
}
