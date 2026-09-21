import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "./api-client";
import type {
  CounterpartSummary,
  GlobalConnectionDTO,
  GlobalConnectionMutationResult,
  PairState,
  StatusCounts,
} from "./global-network/types";

const sourceSchema = z
  .object({
    type: z.string().optional(),
    id: z.string().uuid().nullable().optional(),
  })
  .optional();

const mutationKeySchema = z.string().min(8).max(200).optional();
const reasonSchema = z.string().max(500).optional();
const uuidSchema = z.string().uuid();

const listSchema = z
  .object({
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional(),
  })
  .optional();

// ── Mutations ────────────────────────────────────────────────────────────────

export const sendConnectionRequestFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        targetUserId: uuidSchema,
        source: sourceSchema,
        mutationKey: mutationKeySchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<GlobalConnectionMutationResult> => {
    const { token } = context as any;
    return fetchNestApiFromServer("/connect-app/network/requests", token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

export const acceptConnectionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) =>
    z.object({ connectionId: uuidSchema, mutationKey: mutationKeySchema }).parse(input),
  )
  .handler(async ({ data, context }): Promise<GlobalConnectionMutationResult> => {
    const { token } = context as any;
    const { connectionId, mutationKey } = data;
    return fetchNestApiFromServer(`/connect-app/network/connections/${connectionId}`, token, {
      method: "PATCH",
      body: JSON.stringify({ status: "accepted", mutationKey }),
    });
  });

export const declineConnectionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        connectionId: uuidSchema,
        reason: reasonSchema,
        mutationKey: mutationKeySchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<GlobalConnectionMutationResult> => {
    const { token } = context as any;
    const { connectionId, ...rest } = data;
    return fetchNestApiFromServer(`/connect-app/network/connections/${connectionId}`, token, {
      method: "PATCH",
      body: JSON.stringify({ status: "declined", ...rest }),
    });
  });

export const cancelConnectionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) =>
    z.object({ connectionId: uuidSchema, mutationKey: mutationKeySchema }).parse(input),
  )
  .handler(async ({ data, context }): Promise<GlobalConnectionMutationResult> => {
    const { token } = context as any;
    const { connectionId } = data;
    return fetchNestApiFromServer(`/connect-app/network/connections/${connectionId}`, token, {
      method: "DELETE",
    });
  });

export const disconnectConnectionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        connectionId: uuidSchema,
        reason: reasonSchema,
        mutationKey: mutationKeySchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<GlobalConnectionMutationResult> => {
    const { token } = context as any;
    const { connectionId } = data;
    return fetchNestApiFromServer(`/connect-app/network/connections/${connectionId}`, token, {
      method: "DELETE",
    });
  });

export const blockUserFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        targetUserId: uuidSchema,
        reason: reasonSchema,
        mutationKey: mutationKeySchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<GlobalConnectionMutationResult> => {
    const { token } = context as any;
    return fetchNestApiFromServer("/connect-app/network/blocks", token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

// ── Reads ────────────────────────────────────────────────────────────────────

export const getConnectionStateFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) => z.object({ targetUserId: uuidSchema }).parse(input))
  .handler(async ({ data, context }): Promise<PairState> => {
    const { token } = context as any;
    return fetchNestApiFromServer(`/connect-app/network/state?targetUserId=${data.targetUserId}`, token);
  });

export const getConnectionByIdFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) => z.object({ connectionId: uuidSchema }).parse(input))
  .handler(async ({ data, context }): Promise<GlobalConnectionDTO> => {
    const { token } = context as any;
    return fetchNestApiFromServer(`/connect-app/network/connection/${data.connectionId}`, token);
  });

export const listIncomingRequestsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) => listSchema.parse(input) ?? {})
  .handler(async ({ data, context }): Promise<GlobalConnectionDTO[]> => {
    const { token } = context as any;
    const queryParams = new URLSearchParams();
    if (data.limit !== undefined) queryParams.set("limit", String(data.limit));
    if (data.offset !== undefined) queryParams.set("offset", String(data.offset));
    const queryString = queryParams.toString();
    const url = `/connect-app/network/requests/incoming${queryString ? `?${queryString}` : ""}`;
    return fetchNestApiFromServer(url, token);
  });

export const listOutgoingRequestsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) => listSchema.parse(input) ?? {})
  .handler(async ({ data, context }): Promise<GlobalConnectionDTO[]> => {
    const { token } = context as any;
    const queryParams = new URLSearchParams();
    if (data.limit !== undefined) queryParams.set("limit", String(data.limit));
    if (data.offset !== undefined) queryParams.set("offset", String(data.offset));
    const queryString = queryParams.toString();
    const url = `/connect-app/network/requests/outgoing${queryString ? `?${queryString}` : ""}`;
    return fetchNestApiFromServer(url, token);
  });

export const listConnectionsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) => listSchema.parse(input) ?? {})
  .handler(async ({ data, context }): Promise<GlobalConnectionDTO[]> => {
    const { token } = context as any;
    const queryParams = new URLSearchParams();
    if (data.limit !== undefined) queryParams.set("limit", String(data.limit));
    if (data.offset !== undefined) queryParams.set("offset", String(data.offset));
    const queryString = queryParams.toString();
    const url = `/connect-app/network/connections${queryString ? `?${queryString}` : ""}`;
    return fetchNestApiFromServer(url, token);
  });

export const countConnectionsByStatusFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<StatusCounts> => {
    const { token } = context as any;
    return fetchNestApiFromServer("/connect-app/network/connections/status-counts", token);
  });

// ── Public counterpart projection ──────────────────────────────────────────────
export const resolvePublicCounterpartsFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) =>
    z.object({ userIds: z.array(z.string().uuid()).max(200) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<CounterpartSummary[]> => {
    const { token } = context as any;
    return fetchNestApiFromServer("/connect-app/network/connections/resolve", token, {
      method: "POST",
      body: JSON.stringify({ userIds: data.userIds }),
    });
  });

