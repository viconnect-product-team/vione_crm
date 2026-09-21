// BC-3.1D — Business Profile Connect server-function adapters.
// Thin authenticated RPC boundary for the public Business Profile route.
// Every verb authenticates via requireSupabaseAuth, resolves the target owner
// server-side from the card slug (never trusting a client-supplied user id),
// and delegates composition/lifecycle to server-only helpers. No business logic
// or SQL here.
//
// Client-safe module: only handler bodies ship server-side. The server-only
// composition (profile-connect.server) is loaded via await import() inside
// handlers, so nothing here statically imports a *.server module.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { GlobalConnectionService } from "@/lib/global-network/service";
import { GlobalNetworkError } from "@/lib/global-network/errors";
import type { GlobalConnectionMutationResult } from "@/lib/global-network/types";
import type { BusinessProfileRelationshipState } from "./profile-connect.types";

const slugSchema = z.string().min(1).max(200);
const mutationKeySchema = z.string().min(8).max(200).optional();
const reasonSchema = z.string().max(500).optional();
const uuidSchema = z.string().uuid();

export const getBusinessProfileRelationshipStateFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) => z.object({ cardSlug: slugSchema }).parse(input))
  .handler(async ({ data, context }): Promise<BusinessProfileRelationshipState> => {
    const { getProfileRelationshipState } = await import("./profile-connect.server");
    return getProfileRelationshipState(null as any, context.userId, data.cardSlug);
  });

export const sendBusinessProfileConnectionRequestFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) =>
    z.object({ cardSlug: slugSchema, mutationKey: mutationKeySchema }).parse(input),
  )
  .handler(async ({ data, context }): Promise<GlobalConnectionMutationResult> => {
    const { sendProfileConnectionRequest } = await import("./profile-connect.server");
    return sendProfileConnectionRequest(
      null as any,
      context.userId,
      data.cardSlug,
      data.mutationKey,
    );
  });

export const acceptBusinessProfileConnectionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ cardSlug: slugSchema, connectionId: uuidSchema, mutationKey: mutationKeySchema })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<GlobalConnectionMutationResult> => {
    const { assertProfileParticipant } = await import("./profile-connect.server");
    await assertProfileParticipant(
      null as any,
      context.userId,
      data.cardSlug,
      data.connectionId,
    );
    return GlobalConnectionService.accept(null as any, context.userId, data.connectionId, {
      mutationKey: data.mutationKey,
    });
  });

export const declineBusinessProfileConnectionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        cardSlug: slugSchema,
        connectionId: uuidSchema,
        reason: reasonSchema,
        mutationKey: mutationKeySchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<GlobalConnectionMutationResult> => {
    const { assertProfileParticipant } = await import("./profile-connect.server");
    await assertProfileParticipant(
      null as any,
      context.userId,
      data.cardSlug,
      data.connectionId,
    );
    return GlobalConnectionService.decline(null as any, context.userId, data.connectionId, {
      reason: data.reason,
      mutationKey: data.mutationKey,
    });
  });

export const cancelBusinessProfileConnectionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ cardSlug: slugSchema, connectionId: uuidSchema, mutationKey: mutationKeySchema })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<GlobalConnectionMutationResult> => {
    const { assertProfileParticipant } = await import("./profile-connect.server");
    await assertProfileParticipant(
      null as any,
      context.userId,
      data.cardSlug,
      data.connectionId,
    );
    return GlobalConnectionService.cancel(null as any, context.userId, data.connectionId, {
      mutationKey: data.mutationKey,
    });
  });

export const disconnectBusinessProfileConnectionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        cardSlug: slugSchema,
        connectionId: uuidSchema,
        reason: reasonSchema,
        mutationKey: mutationKeySchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<GlobalConnectionMutationResult> => {
    const { assertProfileParticipant } = await import("./profile-connect.server");
    await assertProfileParticipant(
      null as any,
      context.userId,
      data.cardSlug,
      data.connectionId,
    );
    return GlobalConnectionService.disconnect(null as any, context.userId, data.connectionId, {
      reason: data.reason,
      mutationKey: data.mutationKey,
    });
  });

export { GlobalNetworkError };
