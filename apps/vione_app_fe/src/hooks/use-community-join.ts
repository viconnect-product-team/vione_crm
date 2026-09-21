// BC-Mobile-7B+ — Hook yêu cầu tham gia cộng đồng (viewer-scoped cache).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listJoinableCommunitiesFn,
  requestCommunityJoinFn,
  cancelCommunityJoinFn,
  listCommunityJoinHistoryFn,
  listCommunityJoinAdminRequestsFn,
  syncCommunityJoinDecisionsFn,
} from "@/lib/business-connect/mobile/community-join.functions";
import { communityKeys } from "@/hooks/use-community";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { notificationKeys } from "@/hooks/use-bc-notifications";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

export const communityJoinKeys = {
  joinable: (viewer: string) => [...communityKeys.root, viewer, "joinable"] as const,
  history: (viewer: string) => [...communityKeys.root, viewer, "join-history"] as const,
  adminRequests: (viewer: string) => [...communityKeys.root, viewer, "join-admin"] as const,
};

/** Yêu cầu tham gia gửi tới các cộng đồng mà viewer quản trị. */
export function useCommunityJoinAdminRequests() {
  const viewerId = useViewerUserId();
  const viewerKey = viewerId ?? "viewer-pending";

  const query = useQuery({
    queryKey: communityJoinKeys.adminRequests(viewerKey),
    enabled: viewerId !== null,
    staleTime: 30_000,
    queryFn: () => listCommunityJoinAdminRequestsFn(),
  });

  return {
    items: query.data ?? [],
    initialLoading: query.isPending && viewerId !== null,
    coreError: query.isError && !query.data,
    retry: () => void query.refetch(),
  };
}

export function useCommunityJoinHistory() {
  const viewerId = useViewerUserId();
  const viewerKey = viewerId ?? "viewer-pending";

  const query = useQuery({
    queryKey: communityJoinKeys.history(viewerKey),
    enabled: viewerId !== null,
    staleTime: 30_000,
    queryFn: () => listCommunityJoinHistoryFn(),
  });

  return {
    items: query.data ?? [],
    initialLoading: query.isPending && viewerId !== null,
    coreError: query.isError && !query.data,
    retry: () => void query.refetch(),
  };
}

export function useJoinableCommunities() {
  const viewerId = useViewerUserId();
  const viewerKey = viewerId ?? "viewer-pending";
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: communityJoinKeys.joinable(viewerKey),
    enabled: viewerId !== null,
    staleTime: 30_000,
    queryFn: () => listJoinableCommunitiesFn(),
  });

  const requestJoin = useMutation({
    mutationFn: (input: { communityId: string; note?: string | null }) =>
      requestCommunityJoinFn({
        data: { communityId: input.communityId, note: input.note ?? null },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: communityKeys.root });
    },
  });

  const cancelJoin = useMutation({
    mutationFn: (input: string | { communityId: string; cancelReason?: string | null }) => {
      const payload = typeof input === "string" ? { communityId: input } : input;
      return cancelCommunityJoinFn({
        data: {
          communityId: payload.communityId,
          cancelReason: payload.cancelReason ?? null,
        },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: communityKeys.root });
    },
  });

  return {
    cancelJoin,
    candidates: query.data ?? [],
    initialLoading: query.isPending && viewerId !== null,
    coreError: query.isError && !query.data,
    retry: () => void query.refetch(),
    requestJoin,
  };
}

/**
 * Phát hiện yêu cầu tham gia vừa được duyệt/từ chối: tạo thông báo trong app
 * (idempotent phía máy chủ) và hiện toast một lần cho mỗi quyết định mới.
 */
/** Toast quyết định tham gia, kèm hành động mở tab "Lịch sử yêu cầu". */
function showJoinDecisionToast(
  status: "approved" | "rejected",
  message: string,
  actionLabel: string,
) {
  const options = {
    action: {
      label: actionLabel,
      onClick: () => window.location.assign("/connect-app/community?tab=history"),
    },
  };
  if (status === "approved") toast.success(message, options);
  else toast(message, options);
}

export function useCommunityJoinDecisionAlerts() {
  const viewerId = useViewerUserId();
  const queryClient = useQueryClient();
  const t = useT();
  const ranFor = useRef<string | null>(null);

  useEffect(() => {
    if (!viewerId || ranFor.current === viewerId) return;
    ranFor.current = viewerId;
    void (async () => {
      try {
        const decisions = await syncCommunityJoinDecisionsFn();
        if (decisions.length === 0) return;
        for (const d of decisions) {
          const msg = t(
            d.status === "approved"
              ? "bc.mobile.community.join.decision.approved"
              : "bc.mobile.community.join.decision.rejected",
            { name: d.name },
          );
          showJoinDecisionToast(d.status, msg, t("bc.mobile.community.join.decision.toastAction"));
        }
        void queryClient.invalidateQueries({ queryKey: notificationKeys.root });
        void queryClient.invalidateQueries({ queryKey: communityKeys.root });
      } catch {
        /* im lặng: thông báo là phụ trợ, không chặn màn hình */
      }
    })();
  }, [viewerId, queryClient, t]);
}


/**
 * Đồng bộ tự động trạng thái yêu cầu tham gia: nghe thay đổi thời gian thực
 * trên các yêu cầu của chính viewer, kèm polling dự phòng khi tab đang hiển thị.
 */
export function useCommunityJoinLiveSync() {
  const viewerId = useViewerUserId();
  const queryClient = useQueryClient();
  const t = useT();
  const seen = useRef<Set<string>>(new Set());
  const inFlight = useRef(false);

  const sync = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const decisions = await syncCommunityJoinDecisionsFn();
      for (const d of decisions) {
        const dedupeKey = `${d.communityId ?? d.name}:${d.status}`;
        if (seen.current.has(dedupeKey)) continue;
        seen.current.add(dedupeKey);
        const msg = t(
          d.status === "approved"
            ? "bc.mobile.community.join.decision.approved"
            : "bc.mobile.community.join.decision.rejected",
          { name: d.name },
        );
        showJoinDecisionToast(d.status, msg, t("bc.mobile.community.join.decision.toastAction"));
      }
      void queryClient.invalidateQueries({ queryKey: notificationKeys.root });
      void queryClient.invalidateQueries({ queryKey: communityKeys.root });
    } catch {
      /* im lặng: đồng bộ nền không chặn màn hình */
    } finally {
      inFlight.current = false;
    }
  }, [queryClient, t]);

  useEffect(() => {
    if (!viewerId) return;

    let channel: any = null;
    try {
      channel = supabase
        .channel(`community-join-${viewerId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "community_join_requests",
            filter: `user_id=eq.${viewerId}`,
          },
          () => {
            void sync();
          },
        )
        .subscribe();
    } catch {
      /* Supabase realtime không khả dụng; dùng cơ chế thăm dò bên dưới */
    }

    // Dự phòng: nếu realtime không khả dụng, vẫn làm mới định kỳ khi tab hiển thị.
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void sync();
    }, 45_000);

    const onVisible = () => {
      if (document.visibilityState === "visible") void sync();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      if (channel) {
        try {
          void supabase.removeChannel(channel);
        } catch {
          // ignore
        }
      }
    };
  }, [viewerId, sync]);
}
