// BC-8.0 — WorkHubService. Composes domain reads and applies the pure
// resolver + priority policy. Read-only. Never mutates canonical state.

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildOverview, buildSummary, decodeCursor, encodeCursor } from "./cursor";
import {
  resolveConnectionRequest,
  resolveIntroductionDelivery,
  resolveIntroductionRequest,
  resolveMeetingFollowUp,
  resolveMeetingWorkspaceItem,
  resolveRelationshipActivity,
} from "./item-resolver";
import { dedupeWorkHubItems, sortWorkHubItems } from "./priority-policy";
import { WorkHubRepository } from "./repository.server";
import {
  WORK_HUB_PAGE_SIZE_DEFAULT,
  WORK_HUB_PAGE_SIZE_MAX,
  WORK_HUB_PRIORITY_VERSION,
  type WorkHubItemDTO,
  type WorkHubListDTO,
  type WorkHubListFilters,
  type WorkHubOverviewDTO,
  type WorkHubSummaryDTO,
} from "./types";
import { WorkHubError } from "./errors";

type Sb = SupabaseClient<any, any, any>;

export function resolveAllFromRaw(raw: any, now: string): WorkHubItemDTO[] {
  const items: WorkHubItemDTO[] = [];
  for (const r of raw.connectionRequests) {
    const it = resolveConnectionRequest(r, { now });
    if (it) items.push(it);
  }
  for (const r of raw.introductionRequests) {
    const it = resolveIntroductionRequest(r, { now });
    if (it) items.push(it);
  }
  for (const r of raw.introductionDeliveries) {
    const it = resolveIntroductionDelivery(r);
    if (it) items.push(it);
  }
  for (const r of raw.meetingWorkspaceItems) {
    const it = resolveMeetingWorkspaceItem(r, { now });
    if (it) items.push(it);
  }
  for (const r of raw.meetingFollowUps) {
    const it = resolveMeetingFollowUp(r);
    if (it) items.push(it);
  }
  for (const r of raw.relationshipActivity) {
    const it = resolveRelationshipActivity(r, { now });
    if (it) items.push(it);
  }
  return sortWorkHubItems(dedupeWorkHubItems(items));
}

async function resolveAll(sb: Sb, userId: string, now: string): Promise<WorkHubItemDTO[]> {
  const raw = await WorkHubRepository.load(sb, userId, now);
  return resolveAllFromRaw(raw, now);
}

function applyFilters(items: WorkHubItemDTO[], filters: WorkHubListFilters): WorkHubItemDTO[] {
  return items.filter((it) => {
    if (filters.category && it.category !== filters.category) return false;
    if (filters.sourceType && it.sourceType !== filters.sourceType) return false;
    if (filters.urgency && it.urgency !== filters.urgency) return false;
    if (filters.fromDate) {
      const t = it.dueAt ?? it.startsAt ?? it.occurredAt;
      if (!t || t < filters.fromDate) return false;
    }
    if (filters.toDate) {
      const t = it.dueAt ?? it.startsAt ?? it.occurredAt;
      if (!t || t > filters.toDate) return false;
    }
    return true;
  });
}

export const WorkHubService = {
  async getSummary(sb: Sb, userId: string, now: string): Promise<WorkHubSummaryDTO> {
    const items = await resolveAll(sb, userId, now);
    return buildSummary(items, now);
  },

  async getOverview(sb: Sb, userId: string, now: string): Promise<WorkHubOverviewDTO> {
    const items = await resolveAll(sb, userId, now);
    return buildOverview(items, now);
  },

  getOverviewFromRaw(raw: any, now: string): WorkHubOverviewDTO {
    const items = resolveAllFromRaw(raw, now);
    return buildOverview(items, now);
  },

  async listItems(
    sb: Sb,
    userId: string,
    now: string,
    filters: WorkHubListFilters,
  ): Promise<WorkHubListDTO> {
    const limitRaw = filters.limit ?? WORK_HUB_PAGE_SIZE_DEFAULT;
    if (!Number.isFinite(limitRaw) || limitRaw <= 0 || limitRaw > WORK_HUB_PAGE_SIZE_MAX) {
      throw new WorkHubError("WORK_HUB_INVALID_FILTER");
    }
    const limit = Math.min(WORK_HUB_PAGE_SIZE_MAX, Math.max(1, Math.floor(limitRaw)));
    const cursor = decodeCursor(filters.cursor ?? null);
    if (filters.cursor && !cursor) throw new WorkHubError("WORK_HUB_INVALID_CURSOR");

    const all = applyFilters(await resolveAll(sb, userId, now), filters);
    let startIdx = 0;
    if (cursor) {
      const idx = all.findIndex((it) => it.id === cursor.i);
      startIdx = idx >= 0 ? idx + 1 : 0;
    }
    const page = all.slice(startIdx, startIdx + limit);
    const last = page[page.length - 1] ?? null;
    const hasMore = startIdx + page.length < all.length;
    const nextCursor =
      hasMore && last
        ? encodeCursor({
            v: WORK_HUB_PRIORITY_VERSION,
            c: last.category,
            p: last.priority,
            d: last.dueAt,
            s: last.startsAt,
            o: last.occurredAt,
            i: last.id,
            f: null,
          })
        : null;
    return {
      items: page,
      nextCursor,
      registryVersion: WORK_HUB_PRIORITY_VERSION,
    };
  },
};
