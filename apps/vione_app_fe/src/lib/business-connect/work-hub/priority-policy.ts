// BC-8.0 — Deterministic priority/sort/dedup policy (§11, §33, §34, §35).
// Pure, side-effect-free. Fully unit-tested.

import { WORK_HUB_CATEGORY_PRECEDENCE, type WorkHubCategory, type WorkHubItemDTO } from "./types";

const CATEGORY_INDEX: ReadonlyMap<WorkHubCategory, number> = new Map(
  WORK_HUB_CATEGORY_PRECEDENCE.map((c, i) => [c, i] as const),
);

function categoryRank(c: WorkHubCategory): number {
  return CATEGORY_INDEX.get(c) ?? 99;
}

/**
 * Deterministic ordering (§33):
 *   1. category precedence  (overdue > needs_action > due_soon > upcoming > waiting > recent)
 *   2. priority tier ascending (P0 > P1 > ...)
 *   3. dueAt / startsAt / occurredAt ascending (nulls last)
 *   4. logical id ascending (tiebreaker)
 */
export function compareWorkHubItems(a: WorkHubItemDTO, b: WorkHubItemDTO): number {
  const c = categoryRank(a.category) - categoryRank(b.category);
  if (c !== 0) return c;
  const p = a.priority - b.priority;
  if (p !== 0) return p;
  const ta = a.dueAt ?? a.startsAt ?? a.occurredAt;
  const tb = b.dueAt ?? b.startsAt ?? b.occurredAt;
  if (ta && tb) {
    if (ta < tb) return -1;
    if (ta > tb) return 1;
  } else if (ta && !tb) {
    return -1;
  } else if (!ta && tb) {
    return 1;
  }
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

/** Stable sort (§33). Callers MUST use this — never Array#sort directly. */
export function sortWorkHubItems(items: WorkHubItemDTO[]): WorkHubItemDTO[] {
  return [...items].sort(compareWorkHubItems);
}

/**
 * Dedup (§32). When two items share dedupeKey, keep the one with:
 *   1. lower category precedence rank
 *   2. lower priority tier
 *   3. lexicographically smaller item id
 */
export function dedupeWorkHubItems(items: WorkHubItemDTO[]): WorkHubItemDTO[] {
  const winners = new Map<string, WorkHubItemDTO>();
  for (const item of items) {
    const key = item.dedupeKey;
    const cur = winners.get(key);
    if (!cur) {
      winners.set(key, item);
      continue;
    }
    if (compareWorkHubItems(item, cur) < 0) {
      winners.set(key, item);
    }
  }
  return Array.from(winners.values());
}

/** Category precedence for a single item (test surface). */
export function workHubCategoryRank(c: WorkHubCategory): number {
  return categoryRank(c);
}
