// BC — Lời mời tham gia cộng đồng qua email (viewer-scoped cache).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CommunitySDK } from "@/lib/business-connect/mobile/community.sdk";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import type { InviteLocale } from "@/lib/business-connect/mobile/community-invite-template";

export const communityInviteKeys = {
  root: ["bc-mobile", "community-invites"] as const,
  list: (viewer: string, communityId: string) =>
    [...communityInviteKeys.root, viewer, communityId] as const,
  templates: (viewer: string, communityId: string) =>
    [...communityInviteKeys.root, "templates", viewer, communityId] as const,
  roleHistory: (viewer: string, inviteRef: string) =>
    [...communityInviteKeys.root, "role-history", viewer, inviteRef] as const,
};

/** Lịch sử đổi vai trò của một lời mời đã được chấp nhận. */
export function useInviteRoleHistory(inviteRef: string | null) {
  const viewerId = useViewerUserId();
  const viewerKey = viewerId ?? "viewer-pending";
  const query = useQuery({
    queryKey: communityInviteKeys.roleHistory(viewerKey, inviteRef ?? "none"),
    enabled: viewerId !== null && Boolean(inviteRef),
    staleTime: 15_000,
    queryFn: () => CommunitySDK.listInviteRoleHistory(inviteRef as string),
  });
  return { entries: query.data ?? [], loading: query.isPending && Boolean(inviteRef) };
}

export function useCommunityInvites(communityId: string, enabled = true) {
  const viewerId = useViewerUserId();
  const viewerKey = viewerId ?? "viewer-pending";
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: communityInviteKeys.list(viewerKey, communityId),
    enabled: enabled && viewerId !== null && Boolean(communityId),
    staleTime: 15_000,
    queryFn: () => CommunitySDK.listInvites({ communityId }),
  });

  const invalidate = () =>
    void queryClient.invalidateQueries({
      queryKey: communityInviteKeys.list(viewerKey, communityId),
    });

  const create = useMutation({
    mutationFn: (input: {
      email: string;
      note?: string;
      inviteUrl?: string;
      locale?: InviteLocale;
      invitedRole?: "admin" | "member";
    }) =>
      CommunitySDK.createInvite({ communityId, ...input }),
    onSuccess: invalidate,
  });

  const cancel = useMutation({
    mutationFn: (inviteRef: string) => CommunitySDK.cancelInvite({ inviteRef }),
    onSuccess: invalidate,
  });

  const resend = useMutation({
    mutationFn: (input: { inviteRef: string; locale?: InviteLocale }) =>
      CommunitySDK.resendInvite(input),
    onSuccess: invalidate,
  });

  const updateAcceptedRole = useMutation({
    mutationFn: (input: { inviteRef: string; role: "admin" | "member" }) =>
      CommunitySDK.updateAcceptedInviteRole(input),
    onSuccess: () => {
      invalidate();
      void queryClient.invalidateQueries({
        queryKey: [...communityInviteKeys.root, "role-history"],
      });
      void queryClient.invalidateQueries({ queryKey: ["bc-mobile", "community"] });
    },
  });

  return {
    invites: query.data ?? [],
    loading: query.isPending && viewerId !== null,
    create,
    cancel,
    resend,
    updateAcceptedRole,
  };
}

/** Mẫu email lời mời (vi/en) của một cộng đồng. */
export function useCommunityInviteTemplates(communityId: string, enabled = true) {
  const viewerId = useViewerUserId();
  const viewerKey = viewerId ?? "viewer-pending";
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: communityInviteKeys.templates(viewerKey, communityId),
    enabled: enabled && viewerId !== null && Boolean(communityId),
    staleTime: 30_000,
    queryFn: () => CommunitySDK.listInviteTemplates({ communityId }),
  });

  const invalidate = () =>
    void queryClient.invalidateQueries({
      queryKey: communityInviteKeys.templates(viewerKey, communityId),
    });

  const save = useMutation({
    mutationFn: (input: { locale: InviteLocale; subject: string; body: string }) =>
      CommunitySDK.saveInviteTemplate({ communityId, ...input }),
    onSuccess: invalidate,
  });

  const reset = useMutation({
    mutationFn: (locale: InviteLocale) =>
      CommunitySDK.resetInviteTemplate({ communityId, locale }),
    onSuccess: invalidate,
  });

  return {
    templates: query.data?.templates ?? [],
    canEdit: query.data?.canEdit ?? false,
    loading: query.isPending && viewerId !== null,
    save,
    reset,
  };
}
