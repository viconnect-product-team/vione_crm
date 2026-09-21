// BC-8.1 Turn C §C §D — Public React Query hooks over NotificationOrchestrationSDK.
//
// UI MUST use these hooks. No component imports runtime/*, repositories, raw
// tables or the worker endpoint. Query keys are frozen and PII-free.

import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { NotificationOrchestrationSDK } from "@/lib/business-connect/notification-orchestration/sdk";
import type {
  NotificationDTO,
  NotificationListDTO,
  NotificationListFilters,
  NotificationPreferencesDTO,
  NotificationPreferenceOverrideDTO,
  NotificationKind,
} from "@/lib/business-connect/notification-orchestration/types";

// ── Frozen query keys (§D) ─────────────────────────────────────────────────
export const notificationKeys = Object.freeze({
  root: ["bc", "notifications"] as const,
  list: (filters: Pick<NotificationListFilters, "status" | "unreadOnly" | "limit">) =>
    [
      "bc",
      "notifications",
      "list",
      filters.status ?? null,
      filters.unreadOnly ?? null,
      filters.limit ?? null,
    ] as const,
  unreadCount: () => ["bc", "notifications", "unread-count"] as const,
  preferences: () => ["bc", "notifications", "preferences"] as const,
});

// ── List / count ────────────────────────────────────────────────────────────

export function useNotifications(
  filters: Pick<NotificationListFilters, "status" | "unreadOnly" | "limit" | "cursor"> = {},
) {
  const list = useServerFn(NotificationOrchestrationSDK.listNotifications);
  return useQuery<NotificationListDTO>({
    queryKey: [...notificationKeys.list(filters), filters.cursor ?? null] as const,
    queryFn: () =>
      list({
        data: {
          status: filters.status ?? null,
          unreadOnly: filters.unreadOnly ?? null,
          limit: filters.limit ?? null,
          cursor: filters.cursor ?? null,
        },
      }),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useUnreadNotificationCount() {
  const count = useServerFn(NotificationOrchestrationSDK.getUnreadCount);
  return useQuery<{ count: number }>({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => count({}),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

// ── Mutations ───────────────────────────────────────────────────────────────

function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: notificationKeys.root });
    void qc.invalidateQueries({ queryKey: ["bc-mobile", "home"] });
    void qc.invalidateQueries({ queryKey: ["bc-notifications"] });
  };
}

export function useMarkNotificationRead() {
  const fn = useServerFn(NotificationOrchestrationSDK.markRead);
  const invalidate = useInvalidateAll();
  return useMutation<NotificationDTO, Error, { id: string }>({
    mutationFn: (input) => fn({ data: input }),
    onSuccess: invalidate,
  });
}
export function useMarkNotificationUnread() {
  const fn = useServerFn(NotificationOrchestrationSDK.markUnread);
  const invalidate = useInvalidateAll();
  return useMutation<NotificationDTO, Error, { id: string }>({
    mutationFn: (input) => fn({ data: input }),
    onSuccess: invalidate,
  });
}
export function useArchiveNotification() {
  const fn = useServerFn(NotificationOrchestrationSDK.archiveNotification);
  const invalidate = useInvalidateAll();
  return useMutation<NotificationDTO, Error, { id: string }>({
    mutationFn: (input) => fn({ data: input }),
    onSuccess: invalidate,
  });
}
export function useArchiveAllRead() {
  const fn = useServerFn(NotificationOrchestrationSDK.archiveAllRead);
  const invalidate = useInvalidateAll();
  return useMutation<{ archived: number }, Error, void>({
    mutationFn: () => fn({}),
    onSuccess: invalidate,
  });
}

export function useDeleteNotification() {
  const fn = useServerFn(NotificationOrchestrationSDK.deleteNotification);
  const invalidate = useInvalidateAll();
  return useMutation<{ ok: boolean; id: string }, Error, { id: string }>({
    mutationFn: (input) => fn({ data: input }),
    onSuccess: invalidate,
  });
}

// ── Preferences ─────────────────────────────────────────────────────────────

export function useNotificationPreferences() {
  const fn = useServerFn(NotificationOrchestrationSDK.getPreferences);
  return useQuery<{
    preferences: NotificationPreferencesDTO;
    overrides: NotificationPreferenceOverrideDTO[];
  }>({
    queryKey: notificationKeys.preferences(),
    queryFn: () => fn({}),
    staleTime: 60_000,
  });
}

export function useUpdateNotificationPreferences() {
  const fn = useServerFn(NotificationOrchestrationSDK.updatePreferences);
  const qc = useQueryClient();
  return useMutation<NotificationPreferencesDTO, Error, Partial<NotificationPreferencesDTO>>({
    mutationFn: (data) => fn({ data }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.preferences() });
    },
  });
}

export function useUpdateNotificationOverride() {
  const fn = useServerFn(NotificationOrchestrationSDK.updateOverride);
  const qc = useQueryClient();
  return useMutation<
    NotificationPreferenceOverrideDTO,
    Error,
    {
      notificationKind: NotificationKind;
      inAppEnabled?: boolean | null;
      emailEnabled?: boolean | null;
      pushEnabled?: boolean | null;
      reminderEnabled?: boolean | null;
    }
  >({
    mutationFn: (data) => fn({ data }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.preferences() });
    },
  });
}

export function useClearNotificationOverride() {
  const fn = useServerFn(NotificationOrchestrationSDK.clearOverride);
  const qc = useQueryClient();
  return useMutation<{ ok: true }, Error, { notificationKind: NotificationKind }>({
    mutationFn: (data) => fn({ data }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.preferences() });
    },
  });
}

// ── Provider posture (§L §Q) — mirrors adapters.server.ts ──────────────────
export const NOTIFICATION_CHANNEL_AVAILABILITY = Object.freeze({
  in_app: "available",
  email: "unavailable",
  push: "unavailable",
} as const);
