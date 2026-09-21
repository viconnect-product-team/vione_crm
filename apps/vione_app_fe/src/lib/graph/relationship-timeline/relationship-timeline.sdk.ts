// BC-7.5 — RelationshipTimelineSDK — thin product adapter.
//
// Framework-free. Delegates to the existing RelationshipGraphSDK (BC-4.2)
// so there is no second cursor implementation, no second visibility model,
// and no direct graph repository leakage. React, Supabase and repositories
// are intentionally absent.

import { RelationshipGraphSDK, GraphError } from "../index";
import type { GraphTimelineEventDTO } from "../timeline.types";
import { toRelationshipTimelineDTO } from "./mapping";
import {
  RELATIONSHIP_TIMELINE_VERSION,
  type ListRelationshipPairTimelineInput,
  type ListRelationshipTimelineInput,
  type RelationshipTimelineEventDTO,
  type RelationshipTimelinePage,
} from "./types";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

function clamp(limit: number | undefined): number {
  if (!limit || limit <= 0) return DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) return MAX_LIMIT;
  return Math.floor(limit);
}

function projectPage(
  rows: GraphTimelineEventDTO[],
  categories?: ListRelationshipTimelineInput["categories"],
  sources?: ListRelationshipTimelineInput["sourceDomains"],
): RelationshipTimelineEventDTO[] {
  let out = rows.map(toRelationshipTimelineDTO);
  if (categories && categories.length > 0) {
    const set = new Set(categories);
    out = out.filter((e: any) => set.has(e.eventCategory));
  }
  if (sources && sources.length > 0) {
    const set = new Set(sources);
    out = out.filter((e: any) => set.has(e.sourceDomain));
  }
  return out;
}

export const RelationshipTimelineSDK = {
  version: RELATIONSHIP_TIMELINE_VERSION,

  async listTimeline(input: ListRelationshipTimelineInput): Promise<RelationshipTimelinePage> {
    const page = await RelationshipGraphSDK.timeline({
      nodeId: input.nodeId,
      eventKinds: input.eventTypes,
      cursor: input.cursor ?? null,
      limit: clamp(input.limit),
    });
    return {
      items: projectPage(page.items, input.categories, input.sourceDomains),
      nextCursor: page.nextCursor,
    };
  },

  async listRelationshipTimeline(
    input: ListRelationshipPairTimelineInput,
  ): Promise<RelationshipTimelinePage> {
    const page = await RelationshipGraphSDK.pairTimeline({
      nodeA: input.nodeA,
      nodeB: input.nodeB,
      eventKinds: input.eventTypes,
      cursor: input.cursor ?? null,
      limit: clamp(input.limit),
    });
    return {
      items: projectPage(page.items),
      nextCursor: page.nextCursor,
    };
  },

  async getTimelineEvent(args: {
    nodeId: string;
    eventId: string;
  }): Promise<RelationshipTimelineEventDTO | null> {
    // BC-7.5B — Direct by-id RPC. RLS on graph_timeline_events still
    // enforces visibility on both subject_node_id and related_node_id.
    // The `nodeId` argument is preserved for callers that want to assert
    // the event belongs to a specific viewer perspective.
    const raw = await RelationshipGraphSDK.getTimelineEventById(args.eventId);
    if (!raw) return null;
    if (args.nodeId && raw.subjectNodeId !== args.nodeId && raw.relatedNodeId !== args.nodeId) {
      return null;
    }
    return toRelationshipTimelineDTO(raw);
  },
} as const;

export type RelationshipTimelineSDKType = typeof RelationshipTimelineSDK;
export { GraphError };
