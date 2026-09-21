// BC-Mobile-6C — Relationship Personalization queries (settings + surfaces).
//
// Viewer-scoped query keys; updates/reset invalidate both the personalization
// key and the 6A rel-intel root so recommendations refresh truthfully.
// Interaction recording is fire-and-forget and NEVER blocks or errors a UI
// flow — the server drops events when behavioral learning is disabled.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RelationshipPersonalizationSDK } from "@/lib/business-connect/mobile/relationship-personalization.sdk";
import type {
  RelationshipIntelInteractionKind,
  UpdateRelationshipIntelPreferencesInput,
} from "@/lib/business-connect/mobile/relationship-personalization.types";
import { relationshipIntelKeys } from "@/hooks/use-relationship-intelligence";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import type { RelationshipActionKind } from "@/lib/business-connect/mobile/relationship-actions";

export const relationshipPersonalizationKeys = {
  root: ["bc-mobile", "rel-personalization"] as const,
  viewer: (viewerId: string) => [...relationshipPersonalizationKeys.root, viewerId] as const,
};

export function useRelationshipPersonalization(enabled = true) {
  const viewerId = useViewerUserId();
  const query = useQuery({
    queryKey: relationshipPersonalizationKeys.viewer(viewerId ?? "viewer-pending"),
    enabled: enabled && viewerId !== null,
    staleTime: 60_000,
    queryFn: () => RelationshipPersonalizationSDK.get(),
  });
  return {
    preferences: query.data?.preferences ?? null,
    profile: query.data?.profile ?? null,
    initialLoading: query.isPending && viewerId !== null,
    error: query.isError && !query.data,
    retry: () => void query.refetch(),
  };
}

export function useUpdateRelationshipIntelPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateRelationshipIntelPreferencesInput) =>
      RelationshipPersonalizationSDK.update(input),
    onSuccess: (result) => {
      queryClient.setQueryData(relationshipPersonalizationKeys.root, result);
      void queryClient.invalidateQueries({ queryKey: relationshipPersonalizationKeys.root });
      // Threshold/suppression changes alter which recommendations surface.
      void queryClient.invalidateQueries({ queryKey: relationshipIntelKeys.root });
    },
  });
}

export function useResetRelationshipPersonalization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => RelationshipPersonalizationSDK.reset(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: relationshipPersonalizationKeys.root });
      void queryClient.invalidateQueries({ queryKey: relationshipIntelKeys.root });
    },
  });
}

/** Fire-and-forget behavioral signal; failures are swallowed by design. */
export function recordIntelInteraction(
  kind: RelationshipIntelInteractionKind,
  recommendationType?: "reconnect" | null,
): void {
  void RelationshipPersonalizationSDK.record(kind, recommendationType).catch(() => {});
}

const ACTION_INTERACTION_KIND = {
  call: "action_call_selected",
  email: "action_email_selected",
  save_meeting_moment: "action_moment_selected",
} as const;

/** Record a 6B action selection as a coarse personalization signal.
 *  6D: plan actions (follow-up / meeting) intentionally emit NO signal — the
 *  personalization vocabulary stays limited to contact-action ordering. */
export function recordActionSelected(kind: RelationshipActionKind): void {
  const mapped = (ACTION_INTERACTION_KIND as Record<string, RelationshipIntelInteractionKind>)[kind];
  if (!mapped) return;
  recordIntelInteraction(mapped, null);
}
