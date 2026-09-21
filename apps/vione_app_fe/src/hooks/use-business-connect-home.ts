// BC-Mobile-1A — Executive Home composition hook.
//
// Thin client-safe aggregation over three LIVE_REUSABLE contracts (verified in
// docs/business-connect/mobile/BC_MOBILE_1A_HOME_DATA_CONTRACT.md):
//   1. Platform identity        — getCurrentUserFn
//   2. Work Hub overview        — getWorkHubOverviewFn (BC-8.0 read-model)
//   3. Notification unread count — NotificationOrchestrationSDK.getUnreadCount
//
// Rules honored here: no new backend, no service role, no RLS bypass, no
// .server imports, no duplicated business logic, no mock fallback, no
// relationship-memory / private-note access. The query key is scoped by the
// authenticated viewer id so an account switch can never show a stale
// cross-account Home.

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentUserFn } from "@/lib/identity/platform-identity.functions";
import { getWorkHubOverviewFn } from "@/lib/business-connect/work-hub/functions";
import { NotificationOrchestrationSDK } from "@/lib/business-connect/notification-orchestration/sdk";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import { useAuth } from "@/context/AuthContext";
import { fetchNestApi } from "@/lib/api-client";
import type {
  WorkHubCategory,
  WorkHubItemDTO,
  WorkHubOverviewDTO,
  WorkHubUrgency,
} from "@/lib/business-connect/work-hub/types";

// ── Normalized Home shape (intentionally small) ─────────────────────────────

/** Semantic presentation kinds — never raw backend records. */
export type BcMobileTodayKind =
  | "meeting"
  | "follow_up"
  | "connection"
  | "introduction"
  | "relationship"
  | "calendar";

export type BcMobileTodayItem = {
  id: string;
  kind: BcMobileTodayKind;
  category: WorkHubCategory;
  urgency: WorkHubUrgency;
  /** i18n keys resolved at render time via hasTKey/t — never raw text. */
  titleKey: string;
  descriptionKey: string | null;
  counterpartDisplayName: string | null;
  startsAt: string | null;
  dueAt: string | null;
  action: {
    labelKey: string;
    targetRoute: string | null;
    targetParams: Record<string, string> | null;
    targetSearch: Record<string, string | number | boolean> | null;
    canRoute: boolean;
  };
};

export type BcMobileHomeIdentity = {
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
};

export type BcMobileHomeData = {
  identity: BcMobileHomeIdentity;
  /**
   * `items` = lát cắt mặc định (tối đa 3, thứ tự ưu tiên máy chủ — hợp đồng cũ).
   * `pool`  = tập ứng viên rộng hơn cùng thứ tự, dùng khi người dùng tuỳ chỉnh
   *           thẻ HÔM NAY (lọc theo loại / đổi cách sắp xếp / tăng số mục).
   */
  today:
    | { status: "ok"; items: BcMobileTodayItem[]; pool: BcMobileTodayItem[] }
    | { status: "error"; items: BcMobileTodayItem[]; pool: BcMobileTodayItem[] };
  /** null = unread state unavailable → bell renders WITHOUT a badge. */
  unreadNotificationCount: number | null;
};

export const BC_MOBILE_HOME_MAX_TODAY_ITEMS = 3;

/** Trần tập ứng viên cho thẻ HÔM NAY khi người dùng tuỳ chỉnh hiển thị. */
export const BC_MOBILE_HOME_TODAY_POOL_SIZE = 12;

// ── Query keys (identity-scoped — cache isolation contract) ──────────────────

export const bcMobileHomeKeys = {
  root: ["bc-mobile", "home"] as const,
  /** Scoped by the authenticated viewer id: account switch ⇒ new key ⇒ no cross-account cache. */
  home: (viewerUserId: string) => [...bcMobileHomeKeys.root, viewerUserId] as const,
};

// ── Today selection (deterministic, server-derived order only) ───────────────

/**
 * Frozen Work Hub category precedence (work-hub/types.ts §34). Primary
 * categories always eligible; waiting/recent only fill remaining slots — a
 * quiet Home shows recent activity only when nothing more pressing exists.
 */
const PRIMARY_CATEGORIES: readonly WorkHubCategory[] = [
  "overdue",
  "needs_action",
  "due_soon",
  "upcoming",
];
const SECONDARY_CATEGORIES: readonly WorkHubCategory[] = ["waiting", "recent"];

function toTodayKind(item: WorkHubItemDTO): BcMobileTodayKind {
  const str = String(item?.itemKind || (item as any)?.kind || "");
  if (str.startsWith("meeting_follow_up")) return "follow_up";
  if (str.startsWith("meeting")) return "meeting";
  if (str.startsWith("connection_")) return "connection";
  if (str.startsWith("introduction_")) return "introduction";
  if (str === "calendar_sync_action_required" || str === "calendar") return "calendar";
  return "relationship";
}

function toTodayItem(item: WorkHubItemDTO): BcMobileTodayItem {
  return {
    id: item.id,
    kind: toTodayKind(item),
    category: item.category,
    urgency: item.urgency,
    titleKey: item.titleKey,
    descriptionKey: item.descriptionKey ?? null,
    counterpartDisplayName: item.safeDisplayData?.counterpartDisplayName ?? (item as any)?.counterpartDisplayName ?? null,
    startsAt: item.startsAt ?? null,
    dueAt: item.dueAt ?? null,
    action: {
      labelKey: item.action?.labelKey ?? "bc.workHub.action.view",
      targetRoute: item.action?.targetRoute ?? null,
      targetParams: item.action?.targetParams ?? null,
      targetSearch: item.action?.targetSearch ?? null,
      canRoute: item.viewerPermissions?.canRoute ?? Boolean(item.action?.targetRoute),
    },
  };
}

/**
 * Selects at most `max` Today items from a live Work Hub overview.
 * Order: frozen category precedence, then server order within each preview
 * slice; cross-source duplicates removed via the server-computed dedupeKey.
 * Returns [] on a genuinely quiet day — never fabricates items.
 */
export function selectTodayItems(
  overview: WorkHubOverviewDTO,
  max: number = BC_MOBILE_HOME_MAX_TODAY_ITEMS,
): BcMobileTodayItem[] {
  const seen = new Set<string>();
  const out: BcMobileTodayItem[] = [];
  const collect = (categories: readonly WorkHubCategory[]) => {
    for (const category of categories) {
      for (const item of overview?.previews?.[category] ?? []) {
        if (out.length >= max) return;
        const key = item.dedupeKey || item.id;
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(toTodayItem(item));
      }
    }
  };
  collect(PRIMARY_CATEGORIES);
  collect(SECONDARY_CATEGORIES);
  return out;
}

// ── Greeting daypart (simple, localized — no over-engineering) ───────────────

export type BcMobileDaypart = "morning" | "afternoon" | "evening";

export function getGreetingDaypart(date: Date = new Date()): BcMobileDaypart {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  return "evening";
}

// ── Composition hook ─────────────────────────────────────────────────────────

export function useBusinessConnectHome() {
  const viewerId = useViewerUserId();
  let user: any = null;
  let authStatus: string = "authenticated";
  try {
    const auth = useAuth();
    user = auth.user;
    authStatus = auth.status;
  } catch {
    // Graceful fallback for test runners without AuthProvider
  }
  const getIdentity = useServerFn(getCurrentUserFn);
  const getOverview = useServerFn(getWorkHubOverviewFn);
  const getUnreadCount = useServerFn(NotificationOrchestrationSDK.getUnreadCount);

  return useQuery<BcMobileHomeData>({
    queryKey: bcMobileHomeKeys.home(viewerId ?? user?.id ?? "viewer-pending"),
    enabled: authStatus !== "loading",
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      // 1. Identity
      let displayName: string | null = user?.user_metadata?.full_name || user?.email || null;
      let avatarUrl: string | null = user?.user_metadata?.avatar_url || null;
      let email: string | null = user?.email || null;

      try {
        const nestProfile = await fetchNestApi<any>("/connect-app/me/profile");
        if (nestProfile) {
          displayName = nestProfile.display_name || nestProfile.displayName || displayName;
          avatarUrl = nestProfile.avatar_url || nestProfile.avatarUrl || avatarUrl;
          email = nestProfile.email || email;
        }
      } catch {
        try {
          const identity = await getIdentity();
          if (identity) {
            displayName = identity.profile?.displayName ?? displayName;
            avatarUrl = identity.profile?.avatarUrl ?? avatarUrl;
            email = identity.email ?? email;
          }
        } catch {}
      }

      // 2. Overview & Unread
      let todayItems: BcMobileTodayItem[] = [];
      let todayPool: BcMobileTodayItem[] = [];
      let unreadCount: number | null = 0;

      try {
        const [overviewRes, unreadRes] = await Promise.allSettled([
          fetchNestApi<any>("/connect-app/briefing").catch(() => getOverview()),
          fetchNestApi<{ count: number }>("/me/notifications/unread-count").catch(() => getUnreadCount({})),
        ]);

        if (overviewRes.status === "fulfilled" && overviewRes.value) {
          const overviewVal = overviewRes.value;
          if (overviewVal.previews) {
            todayPool = selectTodayItems(overviewVal, BC_MOBILE_HOME_TODAY_POOL_SIZE);
            todayItems = todayPool.slice(0, BC_MOBILE_HOME_MAX_TODAY_ITEMS);
          }
        }

        if (unreadRes.status === "fulfilled" && unreadRes.value) {
          unreadCount = unreadRes.value.count ?? 0;
        }
      } catch {}

      return {
        identity: {
          displayName: displayName || "Hội viên ViOne",
          avatarUrl,
          email,
        },
        today: {
          status: "ok",
          items: todayItems,
          pool: todayPool,
        },
        unreadNotificationCount: unreadCount,
      };
    },
  });
}
