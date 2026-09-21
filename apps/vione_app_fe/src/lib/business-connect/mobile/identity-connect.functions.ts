// BC-Mobile-5E — Connection Handshake RPC (thin wrappers only).
//
// Auth from requireSupabaseAuth; input validation here; ALL domain logic in
// identity-connect.service → GlobalConnectionService → authoritative RPCs.
// Both endpoints require auth BY DESIGN: the anonymous public projection
// (bcIdentityPublicByTokenFn) stays byte-identical and relationship-free.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import {
  getIdentityConnectionState,
  sendIdentityConnectionRequest,
} from "./identity-connect.service";
import { publicTokenSchema } from "./identity.validation";
import type { IdentityConnectionState } from "./identity-connect.types";
import type { GlobalConnectionMutationResult } from "@/lib/global-network/types";

const UNAVAILABLE: IdentityConnectionState = { state: "unavailable", connectionId: null };

export const bcIdentityConnectionStateFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((data: unknown) => publicTokenSchema.parse(data))
  .handler(async ({ data, context }): Promise<IdentityConnectionState> => {
    try {
      return await getIdentityConnectionState(null as any, context.userId, data);
    } catch {
      // Pair-state read failures collapse to the same neutral state — the
      // viewer retries; the RPC layer stays authoritative on mutations.
      return UNAVAILABLE;
    }
  });

export const bcIdentitySendConnectionRequestFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        token: publicTokenSchema,
        mutationKey: z.string().min(8).max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<GlobalConnectionMutationResult> => {
    return sendIdentityConnectionRequest(
      null as any,
      context.userId,
      data.token,
      data.mutationKey,
    );
  });
