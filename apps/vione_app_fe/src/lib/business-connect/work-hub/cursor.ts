// BC-8.0 — Cursor codec + summary/overview builders. Pure.

import { dedupeWorkHubItems, sortWorkHubItems } from "./priority-policy";
import {
  WORK_HUB_CATEGORIES,
  WORK_HUB_PRIORITY_VERSION,
  type WorkHubCategory,
  type WorkHubCursor,
  type WorkHubItemDTO,
  type WorkHubOverviewDTO,
  type WorkHubSummaryDTO,
} from "./types";

/** Encode a base64 JSON cursor. Node/edge Buffer only — never sent PII. */
export function encodeCursor(c: WorkHubCursor): string {
  const json = JSON.stringify(c);
  if (typeof Buffer !== "undefined") return Buffer.from(json, "utf8").toString("base64");
  // Browser fallback (tests): btoa handles ASCII JSON.
  return typeof btoa === "function" ? btoa(json) : json;
}

export function decodeCursor(raw: string | null | undefined): WorkHubCursor | null {
  if (!raw) return null;
  try {
    const json =
      typeof Buffer !== "undefined"
        ? Buffer.from(raw, "base64").toString("utf8")
        : typeof atob === "function"
          ? atob(raw)
          : raw;
    const parsed = JSON.parse(json) as WorkHubCursor;
    if (parsed?.v !== WORK_HUB_PRIORITY_VERSION) return null;
    if (typeof parsed.i !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Build a summary DTO from a sorted item list. */
export function buildSummary(items: WorkHubItemDTO[], now: string): WorkHubSummaryDTO {
  let needs = 0;
  let overdue = 0;
  let due = 0;
  let upcoming = 0;
  let waiting = 0;
  let recent = 0;
  let top: WorkHubItemDTO | null = null;
  for (const it of items) {
    switch (it.category) {
      case "needs_action":
        needs++;
        break;
      case "overdue":
        overdue++;
        break;
      case "due_soon":
        due++;
        break;
      case "upcoming":
        upcoming++;
        break;
      case "waiting":
        waiting++;
        break;
      case "recent":
        recent++;
        break;
    }
    if (!top || it.priority < top.priority) top = it;
  }
  return {
    needsActionCount: needs,
    overdueCount: overdue,
    dueSoonCount: due,
    upcomingCount: upcoming,
    waitingCount: waiting,
    recentCount: recent,
    highestPriority: top?.priority ?? null,
    registryVersion: WORK_HUB_PRIORITY_VERSION,
    generatedAt: now,
  };
}

/** Build overview payload: summary + previews per category (§10). */
export function buildOverview(
  rawItems: WorkHubItemDTO[],
  now: string,
  previewLimit = 3,
): WorkHubOverviewDTO {
  const sorted = sortWorkHubItems(dedupeWorkHubItems(rawItems));
  const previews = {} as Record<WorkHubCategory, WorkHubItemDTO[]>;
  for (const c of WORK_HUB_CATEGORIES) previews[c] = [];
  for (const item of sorted) {
    const bucket = previews[item.category];
    if (bucket.length < previewLimit) bucket.push(item);
  }
  return { summary: buildSummary(sorted, now), previews };
}
