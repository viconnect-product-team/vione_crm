// BC-4.1/4.2 — Relationship Graph Engine — Authenticated server-fn adapters.
// Thin RPC boundary. Server-only modules loaded inside handlers.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;
import type {
  GraphCursorPage,
  GraphMutualDTO,
  GraphNeighborDTO,
  GraphNodeDTO,
  GraphPathDTO,
  GraphSharedNodeDTO,
} from "./types";
import type { GraphTimelineEventDTO, TimelinePage } from "./timeline.types";

const idSchema = z.string().uuid();
const kindListSchema = z.array(z.string().min(1).max(64)).max(20).optional();
const cursorSchema = z.string().max(2048).nullable().optional();
const limitSchema = z.number().int().positive().max(100).optional();
const directionSchema = z.enum(["outgoing", "incoming", "any"]).optional();
const kindSchema = z.string().min(1).max(64);
const scopeTypeSchema = z.enum(["global", "association", "community", "tenant"]).optional();
const visibilitySchema = z
  .enum(["private", "connected", "association", "community", "public"])
  .optional();
const metadataSchema = z.record(z.unknown()).optional();
const idempotencySchema = z.string().min(1).max(128).nullable().optional();

// ── Reads (unchanged from BC-4.1) ──
const neighborsInput = z.object({
  nodeId: idSchema,
  edgeKinds: kindListSchema,
  nodeKinds: kindListSchema,
  direction: directionSchema,
  cursor: cursorSchema,
  limit: limitSchema,
});
const mutualInput = z.object({
  nodeA: idSchema,
  nodeB: idSchema,
  edgeKinds: kindListSchema,
  cursor: cursorSchema,
  limit: limitSchema,
});
const sharedInput = z.object({
  nodeA: idSchema,
  nodeB: idSchema,
  cursor: cursorSchema,
  limit: limitSchema,
});
const pathInput = z.object({
  fromNodeId: idSchema,
  toNodeId: idSchema,
  edgeKinds: kindListSchema,
  nodeKinds: kindListSchema,
  maxDepth: z.number().int().positive().max(4).optional(),
});

async function readService(sb: unknown, uid: string) {
  const { RelationshipGraphService } = await import("./graph.service.server");
  return new RelationshipGraphService(sb as never, uid);
}
async function writeService(sb: unknown, uid: string) {
  const { RelationshipGraphWriteService } = await import("./graph.write.service.server");
  return new RelationshipGraphWriteService(sb as never, uid);
}

export const graphGetNodeFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => z.object({ nodeId: idSchema }).parse(i))
  .handler(async ({ data, context }): Promise<GraphNodeDTO> => {
    const svc = await readService(getDb(context), context.userId);
    return svc.getNode(data.nodeId);
  });

export const graphNeighborsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => neighborsInput.parse(i))
  .handler(async ({ data, context }): Promise<GraphCursorPage<GraphNeighborDTO>> => {
    const svc = await readService(getDb(context), context.userId);
    return svc.neighbors(data);
  });

export const graphMutualConnectionsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => mutualInput.parse(i))
  .handler(async ({ data, context }): Promise<GraphCursorPage<GraphMutualDTO>> => {
    const svc = await readService(getDb(context), context.userId);
    return svc.mutualConnections(data);
  });

export const graphSharedCompaniesFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => sharedInput.parse(i))
  .handler(async ({ data, context }): Promise<GraphCursorPage<GraphSharedNodeDTO>> => {
    const svc = await readService(getDb(context), context.userId);
    return svc.sharedCompanies(data);
  });

export const graphSharedAssociationsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => sharedInput.parse(i))
  .handler(async ({ data, context }): Promise<GraphCursorPage<GraphSharedNodeDTO>> => {
    const svc = await readService(getDb(context), context.userId);
    return svc.sharedAssociations(data);
  });

export const graphSharedCommunitiesFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => sharedInput.parse(i))
  .handler(async ({ data, context }): Promise<GraphCursorPage<GraphSharedNodeDTO>> => {
    const svc = await readService(getDb(context), context.userId);
    return svc.sharedCommunities(data);
  });

export const graphShortestPathFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => pathInput.parse(i))
  .handler(async ({ data, context }): Promise<GraphPathDTO> => {
    const svc = await readService(getDb(context), context.userId);
    return svc.shortestPath(data);
  });

// ── Writes (BC-4.2) ──
const registerNodeInput = z.object({
  nodeKind: kindSchema,
  externalRefType: z.string().min(1).max(64),
  externalRefId: z.string().min(1).max(256),
  visibility: visibilitySchema,
  tenantScopeType: scopeTypeSchema,
  tenantScopeId: idSchema.nullable().optional(),
  metadata: metadataSchema,
});
const createEdgeInput = z.object({
  edgeKind: kindSchema,
  sourceNodeId: idSchema,
  targetNodeId: idSchema,
  visibility: visibilitySchema,
  tenantScopeType: scopeTypeSchema,
  tenantScopeId: idSchema.nullable().optional(),
  metadata: metadataSchema,
  idempotencyKey: idempotencySchema,
});
const connectInput = z.object({
  sourceNodeId: idSchema,
  targetNodeId: idSchema,
  idempotencyKey: idempotencySchema,
});
const edgeIdInput = z.object({ edgeId: idSchema });
const updateMetaInput = z.object({ edgeId: idSchema, metadata: z.record(z.unknown()) });

export const graphRegisterNodeFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => registerNodeInput.parse(i))
  .handler(async ({ data, context }): Promise<GraphNodeDTO> => {
    const svc = await writeService(getDb(context), context.userId);
    return svc.registerNode(data);
  });

export const graphCreateEdgeFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => createEdgeInput.parse(i))
  .handler(async ({ data, context }): Promise<{ edgeId: string; replayed: boolean }> => {
    const svc = await writeService(getDb(context), context.userId);
    return svc.createEdge(data);
  });

export const graphConnectFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => connectInput.parse(i))
  .handler(async ({ data, context }): Promise<{ edgeId: string }> => {
    const svc = await writeService(getDb(context), context.userId);
    return svc.connect(data);
  });

export const graphArchiveEdgeFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => edgeIdInput.parse(i))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const svc = await writeService(getDb(context), context.userId);
    await svc.archiveEdge(data.edgeId);
    return { ok: true };
  });

export const graphRestoreEdgeFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => edgeIdInput.parse(i))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const svc = await writeService(getDb(context), context.userId);
    await svc.restoreEdge(data.edgeId);
    return { ok: true };
  });

export const graphDisconnectFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => edgeIdInput.parse(i))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const svc = await writeService(getDb(context), context.userId);
    await svc.disconnect(data.edgeId);
    return { ok: true };
  });

export const graphUpdateEdgeMetadataFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => updateMetaInput.parse(i))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const svc = await writeService(getDb(context), context.userId);
    await svc.updateEdgeMetadata(data.edgeId, data.metadata);
    return { ok: true };
  });

// Timeline
const timelineInput = z.object({
  nodeId: idSchema,
  eventKinds: kindListSchema,
  cursor: cursorSchema,
  limit: limitSchema,
});
const pairTimelineInput = z.object({
  nodeA: idSchema,
  nodeB: idSchema,
  eventKinds: kindListSchema,
  cursor: cursorSchema,
  limit: limitSchema,
});

export const graphTimelineFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => timelineInput.parse(i))
  .handler(async ({ data, context }): Promise<TimelinePage> => {
    const svc = await writeService(getDb(context), context.userId);
    return svc.timeline(data);
  });

export const graphPairTimelineFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => pairTimelineInput.parse(i))
  .handler(async ({ data, context }): Promise<TimelinePage> => {
    const svc = await writeService(getDb(context), context.userId);
    return svc.pairTimeline(data);
  });

export const graphHistoryFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => timelineInput.parse(i))
  .handler(async ({ data, context }): Promise<TimelinePage> => {
    const svc = await writeService(getDb(context), context.userId);
    return svc.history(data);
  });

// BC-7.5B — Direct by-id timeline read (avoids page-scan in adapters).
export const graphGetTimelineEventFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => z.object({ eventId: idSchema }).parse(i))
  .handler(async ({ data, context }): Promise<GraphTimelineEventDTO | null> => {
    const svc = await writeService(getDb(context), context.userId);
    return svc.getTimelineEventById(data.eventId);
  });

export type { GraphTimelineEventDTO };
