// BC-Mobile — Tuỳ chỉnh thẻ HÔM NAY (chỉ trình bày).
//
// Người dùng chọn loại nội dung muốn thấy, cách sắp xếp và số mục hiển thị.
// Toàn bộ tuỳ chọn là PRESENTATION-ONLY: lọc/sắp xếp trên dữ liệu canonical
// đã được máy chủ cấp quyền. Không tạo dữ liệu mới, không gọi backend mới.
// Lưu cục bộ theo từng viewer để không rò rỉ giữa các tài khoản.

import type { BcMobileTodayItem, BcMobileTodayKind } from "@/hooks/use-business-connect-home";

export const TODAY_KINDS: readonly BcMobileTodayKind[] = [
  "meeting",
  "follow_up",
  "connection",
  "introduction",
  "relationship",
  "calendar",
];

export type TodayOrderMode = "priority" | "time";

export type TodayPreferences = {
  /** Các loại được hiển thị. Rỗng ⇒ coi như hiển thị tất cả. */
  kinds: BcMobileTodayKind[];
  order: TodayOrderMode;
  /** Số mục tối đa trong thẻ HÔM NAY. */
  maxItems: number;
};

export const TODAY_MAX_CHOICES: readonly number[] = [3, 5, 7];

export const DEFAULT_TODAY_PREFERENCES: TodayPreferences = {
  kinds: [...TODAY_KINDS],
  order: "priority",
  maxItems: 3,
};

const STORAGE_PREFIX = "bc-mobile:today-prefs:";

function storageKey(viewerKey: string): string {
  return `${STORAGE_PREFIX}${viewerKey}`;
}

export function sanitizeTodayPreferences(raw: unknown): TodayPreferences {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_TODAY_PREFERENCES };
  const value = raw as Partial<TodayPreferences>;
  const kinds = Array.isArray(value.kinds)
    ? TODAY_KINDS.filter((k) => (value.kinds as unknown[]).includes(k))
    : [];
  return {
    kinds: kinds.length > 0 ? kinds : [...TODAY_KINDS],
    order: value.order === "time" ? "time" : "priority",
    maxItems: TODAY_MAX_CHOICES.includes(Number(value.maxItems))
      ? Number(value.maxItems)
      : DEFAULT_TODAY_PREFERENCES.maxItems,
  };
}

export function loadTodayPreferences(viewerKey: string): TodayPreferences {
  if (typeof window === "undefined") return { ...DEFAULT_TODAY_PREFERENCES };
  try {
    const raw = window.localStorage.getItem(storageKey(viewerKey));
    return raw ? sanitizeTodayPreferences(JSON.parse(raw)) : { ...DEFAULT_TODAY_PREFERENCES };
  } catch {
    return { ...DEFAULT_TODAY_PREFERENCES };
  }
}

export function saveTodayPreferences(viewerKey: string, prefs: TodayPreferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(viewerKey), JSON.stringify(prefs));
  } catch {
    /* bộ nhớ cục bộ không khả dụng — tuỳ chọn chỉ áp dụng cho phiên hiện tại */
  }
}

export function isDefaultTodayPreferences(prefs: TodayPreferences): boolean {
  return (
    prefs.order === DEFAULT_TODAY_PREFERENCES.order &&
    prefs.maxItems === DEFAULT_TODAY_PREFERENCES.maxItems &&
    prefs.kinds.length === TODAY_KINDS.length
  );
}

function timeValue(item: BcMobileTodayItem): number {
  const raw = item.startsAt ?? item.dueAt;
  if (!raw) return Number.POSITIVE_INFINITY;
  const ms = Date.parse(raw);
  return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
}

/**
 * Áp dụng tuỳ chọn lên danh sách canonical đã sắp xếp theo thứ tự ưu tiên
 * của máy chủ. Sắp xếp "time" là sắp xếp ổn định: mục không có mốc thời gian
 * giữ nguyên thứ tự ưu tiên gốc ở cuối danh sách.
 */
export function applyTodayPreferences(
  items: readonly BcMobileTodayItem[],
  prefs: TodayPreferences,
): BcMobileTodayItem[] {
  const allowed = new Set(prefs.kinds.length > 0 ? prefs.kinds : TODAY_KINDS);
  const filtered = items.filter((item) => allowed.has(item.kind));
  const ordered =
    prefs.order === "time"
      ? filtered
          .map((item, index) => ({ item, index, at: timeValue(item) }))
          .sort((a, b) => a.at - b.at || a.index - b.index)
          .map((entry) => entry.item)
      : filtered;
  return ordered.slice(0, prefs.maxItems);
}
