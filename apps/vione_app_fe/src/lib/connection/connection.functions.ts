// BC-5.0 — Canonical Connection server functions (RPC boundary).
// Handlers dynamically import the *.server module to keep the client bundle
// clean; the enclosing file is safe to import from client-reachable modules.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import type {
  ConnectionRelationshipStateDTO,
  ConnectionRequestDTO,
  ConnectionSummaryDTO,
} from "./types";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

const uuid = z.string().uuid();
const mutationKey = z.string().min(8).max(200).optional();
const listOpts = z
  .object({
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional(),
  })
  .optional();

export const sendConnectionRequestFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        targetPersonNodeId: uuid,
        message: z.string().max(500).optional(),
        mutationKey,
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { ConnectionService } = await import("./service.server");
    return ConnectionService.sendRequest(getDb(context), context.userId, data);
  });

export const acceptConnectionRequestFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => z.object({ requestId: uuid, mutationKey }).parse(i))
  .handler(async ({ data, context }) => {
    const { ConnectionService } = await import("./service.server");
    return ConnectionService.acceptRequest(
      getDb(context),
      context.userId,
      data.requestId,
      data.mutationKey,
    );
  });

export const declineConnectionRequestFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => z.object({ requestId: uuid, mutationKey }).parse(i))
  .handler(async ({ data, context }) => {
    const { ConnectionService } = await import("./service.server");
    return ConnectionService.declineRequest(
      getDb(context),
      context.userId,
      data.requestId,
      data.mutationKey,
    );
  });

export const cancelConnectionRequestFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => z.object({ requestId: uuid, mutationKey }).parse(i))
  .handler(async ({ data, context }) => {
    const { ConnectionService } = await import("./service.server");
    return ConnectionService.cancelRequest(
      getDb(context),
      context.userId,
      data.requestId,
      data.mutationKey,
    );
  });

export const disconnectPersonFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => z.object({ targetPersonNodeId: uuid, mutationKey }).parse(i))
  .handler(async ({ data, context }) => {
    const { ConnectionService } = await import("./service.server");
    return ConnectionService.disconnect(
      getDb(context),
      context.userId,
      data.targetPersonNodeId,
      data.mutationKey,
    );
  });

export const blockPersonFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => z.object({ targetPersonNodeId: uuid, mutationKey }).parse(i))
  .handler(async ({ data, context }) => {
    const { ConnectionService } = await import("./service.server");
    return ConnectionService.block(
      getDb(context),
      context.userId,
      data.targetPersonNodeId,
      data.mutationKey,
    );
  });

export const unblockPersonFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => z.object({ targetPersonNodeId: uuid }).parse(i))
  .handler(async ({ data, context }) => {
    const { ConnectionService } = await import("./service.server");
    return ConnectionService.unblock(getDb(context), context.userId, data.targetPersonNodeId);
  });

export const resolveConnectionStateFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => z.object({ targetPersonNodeId: uuid }).parse(i))
  .handler(async ({ data, context }): Promise<ConnectionRelationshipStateDTO> => {
    const { ConnectionService } = await import("./service.server");
    return ConnectionService.resolveRelationshipState(
      getDb(context),
      context.userId,
      data.targetPersonNodeId,
    );
  });

export const listIncomingConnectionRequestsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => listOpts.parse(i) ?? {})
  .handler(async ({ data, context }): Promise<ConnectionRequestDTO[]> => {
    const { ConnectionService } = await import("./service.server");
    return ConnectionService.listIncomingRequests(getDb(context), context.userId, data);
  });

export const listOutgoingConnectionRequestsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => listOpts.parse(i) ?? {})
  .handler(async ({ data, context }): Promise<ConnectionRequestDTO[]> => {
    const { ConnectionService } = await import("./service.server");
    return ConnectionService.listOutgoingRequests(getDb(context), context.userId, data);
  });

export const listConnectionsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((i: unknown) => listOpts.parse(i) ?? {})
  .handler(async ({ data, context }): Promise<ConnectionSummaryDTO[]> => {
    const { ConnectionService } = await import("./service.server");
    return ConnectionService.listConnections(getDb(context), context.userId, data);
  });
