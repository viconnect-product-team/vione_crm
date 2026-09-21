// BC-Mobile-7B — Community activity hooks (events & opportunities).
// UI never calls server fns directly — everything flows through CommunitySDK.
// Query keys are viewer-scoped (account-switch isolation); register/interest
// mutations invalidate only the affected keys (detail + lists + previews).

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CommunitySDK } from "@/lib/business-connect/mobile/community.sdk";
import type {
  CommunityEventsTabDTO,
  CommunityInterestLevel,
} from "@/lib/business-connect/mobile/community-activity.types";
import { communityKeys } from "@/hooks/use-community";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import { fetchNestApi } from "@/lib/api-client";

export const communityActivityKeys = {
  eventsRoot: ["bc-mobile", "community-events"] as const,
  events: (viewer: string, communityId: string, tab: CommunityEventsTabDTO) =>
    [...communityActivityKeys.eventsRoot, viewer, communityId, tab] as const,
  event: (viewer: string, communityId: string, eventRef: string) =>
    ["bc-mobile", "community-event", viewer, communityId, eventRef] as const,
  opportunitiesRoot: ["bc-mobile", "community-opportunities"] as const,
  opportunities: (viewer: string, communityId: string, query: string) =>
    [...communityActivityKeys.opportunitiesRoot, viewer, communityId, query] as const,
  opportunity: (viewer: string, communityId: string, opportunityRef: string) =>
    ["bc-mobile", "community-opportunity", viewer, communityId, opportunityRef] as const,
  preview: (viewer: string, communityId: string) =>
    ["bc-mobile", "community-activity-preview", viewer, communityId] as const,
};

export function useCommunityEvents(communityId: string, tab: CommunityEventsTabDTO) {
  const viewerId = useViewerUserId();
  const viewerKey = viewerId ?? "viewer-pending";
  const result = useInfiniteQuery({
    queryKey: communityActivityKeys.events(viewerKey, communityId, tab),
    enabled: Boolean(communityId),
    staleTime: 15_000,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const q = new URLSearchParams();
      q.set("tab", tab);
      if (pageParam) q.set("offset", String(pageParam));
      const qs = q.toString();
      try {
        const res = await fetchNestApi<any>(`/connect-app/community/${communityId}/events${qs ? `?${qs}` : ""}`);
        if (res) return res;
      } catch {
        // fallback
      }
      return CommunitySDK.listEvents({ communityId, tab, offset: pageParam });
    },
    getNextPageParam: (last) => last?.nextOffset ?? undefined,
  });

  const pages = result.data?.pages ?? [];
  const items = pages.flatMap((p) => p?.items ?? []);
  const firstPage = pages[0];
  return {
    events: items,
    /** null = membership missing/unavailable (neutral state). */
    unavailable: !result.isPending && !result.isError && firstPage === null,
    totalCount: firstPage?.totalCount ?? 0,
    initialLoading: result.isPending,
    coreError: result.isError && !result.data,
    retry: () => void result.refetch(),
    hasMore: result.hasNextPage,
    loadMore: () => void result.fetchNextPage(),
    isLoadingMore: result.isFetchingNextPage,
  };
}

export function useCommunityEventDetail(communityId: string, eventRef: string) {
  const viewerId = useViewerUserId();
  const viewerKey = viewerId ?? "viewer-public";
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: communityActivityKeys.event(viewerKey, communityId, eventRef),
    enabled: Boolean(communityId) && Boolean(eventRef),
    staleTime: 15_000,
    queryFn: async () => {
      try {
        const res = await fetchNestApi<any>(`/connect-app/community/${communityId}/events/${eventRef}`);
        if (res) return res;
      } catch {
        // fallback
      }
      return CommunitySDK.getEventDetail({ communityId, eventRef });
    },
  });

  const register = useMutation({
    mutationFn: async () => {
      // Primary path: REST API (NestJS). Only fall back to the server-fn
      // on genuine network / connection failures — not on domain 4xx errors
      // ("event full", "registration closed"), which must surface to the UI.
      try {
        const res = await fetchNestApi<any>(
          `/connect-app/community/${communityId}/events/${eventRef}/registrations`,
          { method: "POST" },
        );
        return res;
      } catch (apiErr: unknown) {
        const msg = apiErr instanceof Error ? apiErr.message : String(apiErr);
        // Domain errors from the NestAPI or server function — re-throw as-is
        // so the UI error-key resolver can inspect them.
        if (
          msg.includes("community_event_full") ||
          msg.includes("community_event_registration_closed") ||
          msg.includes("community_event_register_unavailable") ||
          msg.includes("Unauthorized")
        ) {
          throw apiErr;
        }
        // Network / unknown error — fall back to the TanStack server function.
        return CommunitySDK.registerForEvent({ communityId, eventRef });
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: communityActivityKeys.event(viewerKey, communityId, eventRef),
      });
      void queryClient.invalidateQueries({ queryKey: communityActivityKeys.eventsRoot });
      void queryClient.invalidateQueries({
        queryKey: communityActivityKeys.preview(viewerKey, communityId),
      });
      void queryClient.invalidateQueries({
        queryKey: communityKeys.detail(viewerKey, communityId),
      });
    },
  });

  const invalidateEvent = () => {
    void queryClient.invalidateQueries({
      queryKey: communityActivityKeys.event(viewerKey, communityId, eventRef),
    });
    void queryClient.invalidateQueries({ queryKey: communityActivityKeys.eventsRoot });
    void queryClient.invalidateQueries({
      queryKey: communityActivityKeys.preview(viewerKey, communityId),
    });
    void queryClient.invalidateQueries({
      queryKey: communityKeys.detail(viewerKey, communityId),
    });
  };

  /** Rút tham dự — huỷ đăng ký đã có (server xác định chủ thể, idempotent). */
  const cancelRegistration = useMutation({
    mutationFn: () => CommunitySDK.cancelEventRegistration({ communityId, eventRef }),
    onSuccess: invalidateEvent,
  });

  return {
    detail: query.data ?? null,
    unavailable: !query.isPending && !query.isError && query.data === null,
    initialLoading: query.isPending,
    coreError: query.isError && query.data === undefined,
    retry: () => void query.refetch(),
    register,
    cancelRegistration,
  };
}

export function useCommunityOpportunities(communityId: string, rawQuery: string) {
  const viewerId = useViewerUserId();
  const viewerKey = viewerId ?? "viewer-pending";
  const query = rawQuery.trim();
  const result = useInfiniteQuery({
    queryKey: communityActivityKeys.opportunities(viewerKey, communityId, query),
    enabled: Boolean(communityId),
    staleTime: 15_000,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const q = new URLSearchParams();
      if (query) q.set("query", query);
      if (pageParam) q.set("offset", String(pageParam));
      const qs = q.toString();
      try {
        const res = await fetchNestApi<any>(`/connect-app/community/${communityId}/opportunities${qs ? `?${qs}` : ""}`);
        if (res) return res;
      } catch {
        // fallback
      }
      return CommunitySDK.listOpportunities({ communityId, query, offset: pageParam });
    },
    getNextPageParam: (last) => last?.nextOffset ?? undefined,
  });

  const pages = result.data?.pages ?? [];
  const items = pages.flatMap((p) => p?.items ?? []);
  const firstPage = pages[0];
  return {
    opportunities: items,
    unavailable: !result.isPending && !result.isError && firstPage === null,
    totalCount: firstPage?.totalCount ?? 0,
    initialLoading: result.isPending && viewerId !== null,
    coreError: result.isError && !result.data,
    retry: () => void result.refetch(),
    hasMore: result.hasNextPage,
    loadMore: () => void result.fetchNextPage(),
    isLoadingMore: result.isFetchingNextPage,
    searching: query.length > 0,
  };
}

export function useCommunityOpportunityDetail(communityId: string, opportunityRef: string) {
  const viewerId = useViewerUserId();
  const viewerKey = viewerId ?? "viewer-pending";
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: communityActivityKeys.opportunity(viewerKey, communityId, opportunityRef),
    enabled: Boolean(communityId) && Boolean(opportunityRef),
    staleTime: 15_000,
    queryFn: async () => {
      try {
        const res = await fetchNestApi<any>(`/connect-app/community/${communityId}/opportunities/${opportunityRef}`);
        if (res) return res;
      } catch {
        // fallback
      }
      return CommunitySDK.getOpportunityDetail({ communityId, opportunityRef });
    },
  });

  const invalidateOpportunity = () => {
    void queryClient.invalidateQueries({
      queryKey: communityActivityKeys.opportunity(viewerKey, communityId, opportunityRef),
    });
    void queryClient.invalidateQueries({
      queryKey: communityActivityKeys.opportunitiesRoot,
    });
    void queryClient.invalidateQueries({
      queryKey: communityActivityKeys.preview(viewerKey, communityId),
    });
  };

  // Mức độ quan tâm: gọi lại cùng endpoint canonical để đặt/đổi mức (cao/thấp).
  const interest = useMutation({
    mutationFn: (interestLevel?: CommunityInterestLevel) =>
      CommunitySDK.expressInterest({ communityId, opportunityRef, interestLevel }),
    onSuccess: invalidateOpportunity,
  });

  /** Bỏ quan tâm — gỡ trạng thái quan tâm hiện có (idempotent phía máy chủ). */
  const withdrawInterest = useMutation({
    mutationFn: () => CommunitySDK.withdrawInterest({ communityId, opportunityRef }),
    onSuccess: invalidateOpportunity,
  });

  /** Lưu tiến độ theo đuổi cơ hội (planned/messaged/replied/closed). */
  const saveProgress = useMutation({
    mutationFn: (input: {
      progress: "planned" | "messaged" | "replied" | "closed";
      note?: string;
    }) =>
      CommunitySDK.saveOpportunityProgress({
        communityId,
        opportunityRef,
        progress: input.progress,
        ...(input.note ? { note: input.note } : {}),
      }),
    onSuccess: invalidateOpportunity,
  });

  /** Nhắc hẹn liên hệ lại — lưu trên bảng nhắc hẹn của chính người xem. */
  const scheduleFollowUp = useMutation({
    mutationFn: (inDays: number) =>
      CommunitySDK.scheduleOpportunityFollowUp({ communityId, opportunityRef, inDays }),
    onSuccess: invalidateOpportunity,
  });

  const updateFollowUp = useMutation({
    mutationFn: (action: "done" | "cancel") =>
      CommunitySDK.updateOpportunityFollowUp({ communityId, opportunityRef, action }),
    onSuccess: invalidateOpportunity,
  });

  /** Đính kèm own-row: thêm liên kết/tệp hoặc gỡ khỏi cơ hội. */
  const addAttachment = useMutation({
    mutationFn: (input: {
      kind: "link" | "file";
      title?: string;
      url?: string;
      storagePath?: string;
      mimeType?: string;
      sizeBytes?: number;
    }) => CommunitySDK.addOpportunityAttachment({ communityId, opportunityRef, ...input }),
    onSuccess: invalidateOpportunity,
  });

  const removeAttachment = useMutation({
    mutationFn: (attachmentId: string) =>
      CommunitySDK.removeOpportunityAttachment({ attachmentId }),
    onSuccess: invalidateOpportunity,
  });

  return {
    detail: query.data ?? null,
    unavailable: !query.isPending && !query.isError && query.data === null,
    initialLoading: query.isPending && viewerId !== null,
    coreError: query.isError && query.data === undefined,
    retry: () => void query.refetch(),
    interest,
    withdrawInterest,
    scheduleFollowUp,
    updateFollowUp,
    saveProgress,
    addAttachment,
    removeAttachment,
  };
}

export function useCommunityActivityPreview(communityId: string) {
  const viewerId = useViewerUserId();
  const viewerKey = viewerId ?? "viewer-pending";
  const query = useQuery({
    queryKey: communityActivityKeys.preview(viewerKey, communityId),
    enabled: Boolean(communityId),
    staleTime: 30_000,
    queryFn: async () => {
      try {
        const res = await fetchNestApi<any>(`/connect-app/community/${communityId}/activity-preview`);
        if (res) return res;
      } catch {
        // fallback
      }
      return CommunitySDK.getActivityPreview(communityId);
    },
  });
  return {
    preview: query.data ?? null,
    initialLoading: query.isPending && viewerId !== null,
    coreError: query.isError && query.data === undefined,
    retry: () => void query.refetch(),
  };
}

/**
 * Đăng ký sự kiện ngay tại chỗ (dùng cho module "Sắp diễn ra" trong màn Cộng đồng).
 * Chủ thể do máy chủ xác định; chỉ vô hiệu hoá đúng các khoá bị ảnh hưởng.
 * @param onRegistered - optional callback gọi sau khi đăng ký thành công,
 *   dùng để persist state trong caller ngay cả khi useMutation.isSuccess reset.
 */
export function useCommunityEventRegistration(
  communityId: string,
  eventRef: string,
  onRegistered?: () => void,
) {
  const viewerId = useViewerUserId();
  const viewerKey = viewerId ?? "viewer-pending";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Primary: NestAPI REST. Fallback: TanStack server-fn on network errors only.
      try {
        const res = await fetchNestApi<any>(
          `/connect-app/community/${communityId}/events/${eventRef}/registrations`,
          { method: "POST" },
        );
        return res;
      } catch (apiErr: unknown) {
        const msg = apiErr instanceof Error ? apiErr.message : String(apiErr);
        if (
          msg.includes("community_event_full") ||
          msg.includes("community_event_registration_closed") ||
          msg.includes("community_event_register_unavailable") ||
          msg.includes("Unauthorized")
        ) {
          throw apiErr;
        }
        return CommunitySDK.registerForEvent({ communityId, eventRef });
      }
    },
    onSuccess: () => {
      onRegistered?.();
      void queryClient.invalidateQueries({
        queryKey: communityActivityKeys.event(viewerKey, communityId, eventRef),
      });
      void queryClient.invalidateQueries({ queryKey: communityActivityKeys.eventsRoot });
      void queryClient.invalidateQueries({
        queryKey: communityActivityKeys.preview(viewerKey, communityId),
      });
      void queryClient.invalidateQueries({
        queryKey: communityKeys.detail(viewerKey, communityId),
      });
    },
  });
}

/**
 * Bày tỏ quan tâm ngay tại chỗ (module "Cơ hội kinh doanh" trong màn Cộng đồng).
 * Chủ thể do máy chủ xác định; chỉ vô hiệu hoá các khoá liên quan.
 */
export function useCommunityOpportunityInterest(communityId: string, opportunityRef: string) {
  const viewerId = useViewerUserId();
  const viewerKey = viewerId ?? "viewer-pending";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (interestLevel?: CommunityInterestLevel) =>
      CommunitySDK.expressInterest({ communityId, opportunityRef, interestLevel }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: communityActivityKeys.opportunity(viewerKey, communityId, opportunityRef),
      });
      void queryClient.invalidateQueries({ queryKey: communityActivityKeys.opportunitiesRoot });
      void queryClient.invalidateQueries({
        queryKey: communityActivityKeys.preview(viewerKey, communityId),
      });
    },
  });
}
