// BC-8.0 — Frozen read-only WorkHubSDK. UI never talks to service.server directly.

import type {
  WorkHubListDTO,
  WorkHubListFilters,
  WorkHubOverviewDTO,
  WorkHubSummaryDTO,
} from "./types";
import { getWorkHubOverviewFn, getWorkHubSummaryFn, listWorkHubItemsFn } from "./functions";

export interface WorkHubSDKType {
  getSummary(): Promise<WorkHubSummaryDTO>;
  getOverview(): Promise<WorkHubOverviewDTO>;
  listItems(filters: WorkHubListFilters): Promise<WorkHubListDTO>;
}

export const WorkHubSDK: WorkHubSDKType = Object.freeze({
  getSummary: () => getWorkHubSummaryFn(),
  getOverview: () => getWorkHubOverviewFn(),
  listItems: (filters: WorkHubListFilters) => listWorkHubItemsFn({ data: filters }),
});

/** Whitelisted method names — used by the SDK-freeze contract test. */
export const WORK_HUB_SDK_METHODS = Object.freeze([
  "getSummary",
  "getOverview",
  "listItems",
] as const);
