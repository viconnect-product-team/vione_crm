// BC-1.2 — Identity Bridge server functions (client-callable RPCs).
// Additive & backward-compatible. Does NOT touch current_member_id /
// current_association_id semantics, Business Card schema/RLS, or Association
// identity helpers.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;
import {
  resolveAccountStatus,
  resolveActiveAssociationContext,
  resolveActiveMemberId,
  resolveBusinessCardOwnerContext,
} from "./identity-bridge.server";
import type {
  AccountStatusResult,
  ActiveAssociationContext,
  BusinessCardOwnerContext,
} from "./identity.types";

/**
 * Active association context, or null when the user has no active association.
 * Trusted source: current_member_id() / current_association_id() (JWT-scoped).
 * Consumers: Business Connect surfaces needing the active tenancy.
 * Forbidden: passing/trusting client memberId or associationId.
 */
export const getActiveAssociationContextFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<ActiveAssociationContext | null> => {
    return resolveActiveAssociationContext(getDb(context), context.userId);
  });

/**
 * Active member id (text) or null. Additive bridge, not a replacement for
 * resolveMemberId(). Consumers: read paths that must degrade gracefully.
 */
export const getActiveMemberIdFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<{ memberId: string | null }> => {
    return { memberId: await resolveActiveMemberId(getDb(context)) };
  });

/**
 * Set the active association. Delegates to the trusted security-definer RPC
 * set_active_association, which validates membership and rejects cross-assoc
 * selection. No new client-trusted tenancy state is introduced.
 * Forbidden: arbitrary memberId; selecting an association the user is not in.
 */
export const setActiveAssociationContextFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ associationId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<ActiveAssociationContext | null> => {
    const { error } = await (getDb(context)).rpc("set_active_association", {
      _association_id: data.associationId,
    });
    // set_active_association raises when the user is not a member of the target.
    if (error) throw new Error(error.message);
    return resolveActiveAssociationContext(getDb(context), context.userId);
  });

/**
 * Platform account status. Trusted source: user_profiles.account_status
 * (server-resolved). Distinct from association member status — never
 * substituted. Consumers: platform gating (not tenant gating).
 */
export const getAccountStatusFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<AccountStatusResult> => {
    const accountStatus = await resolveAccountStatus(getDb(context), context.userId);
    return {
      userId: context.userId,
      accountStatus,
      isActive: accountStatus === "active",
    };
  });

/**
 * Card-owner bridge (read-only). Trusted source: member_business_cards +
 * unique members.user_id mapping. Returns "unresolved" for null/ambiguous.
 * Consumers: BC-2 migration prep. Forbidden: treating "unresolved" as a
 * grant, or using association admin as owner.
 */
export const resolveBusinessCardOwnerContextFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ cardId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<BusinessCardOwnerContext> => {
    return resolveBusinessCardOwnerContext(getDb(context), data.cardId);
  });
