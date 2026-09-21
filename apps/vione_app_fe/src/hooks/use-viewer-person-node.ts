// BC-4.5 — Resolve the viewer's own `person` node id.
//
// Uses RelationshipGraphSDK.registerNode which is idempotent — get-or-create
// against the frozen ("person","user_profile",<userId>) external ref. Cached
// per user id so opening the connections tab does not re-register on every
// mount.

import { useQuery } from "@tanstack/react-query";
import { PlatformIdentitySDK } from "@/lib/identity/platform-identity-sdk";
import { RelationshipGraphSDK } from "@/lib/graph";

export function useViewerPersonNodeId() {
  return useQuery({
    queryKey: ["bc45", "viewerPersonNodeId"],
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
    queryFn: async (): Promise<string> => {
      const me = await PlatformIdentitySDK.getCurrentUser();
      const node = await RelationshipGraphSDK.registerNode({
        nodeKind: "person",
        externalRefType: "user_profile",
        externalRefId: me.userId,
      });
      return node.id;
    },
  });
}
