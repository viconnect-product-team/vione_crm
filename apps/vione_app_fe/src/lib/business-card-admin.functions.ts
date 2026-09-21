import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "@/lib/api-client";
import type { CardKind, CardStatus, PublicMode } from "@/lib/business-card.functions";

export type BcAdminLevel = "full" | "moderator" | "viewer" | "none";

// Pure authorization/scoping decision for the admin business-card listing.
export type CardListScope =
  | { authorized: false }
  | { authorized: true; scope: "all" }
  | { authorized: true; scope: "associations"; associationIds: string[] };

export function resolveCardListScope(input: {
  isPlatformAdmin: boolean;
  managedAssociationIds: string[];
}): CardListScope {
  if (input.isPlatformAdmin) return { authorized: true, scope: "all" };
  const ids = Array.from(new Set(input.managedAssociationIds.filter(Boolean)));
  if (ids.length === 0) return { authorized: false };
  return { authorized: true, scope: "associations", associationIds: ids };
}

// Admin/manager view of a business card, enriched with owner + association.
export type AdminBusinessCard = {
  id: string;
  slug: string;
  cardKind: CardKind;
  status: CardStatus;
  publicMode: PublicMode;
  displayName: string | null;
  professionalTitle: string | null;
  companyName: string | null;
  avatarUrl: string | null;
  updatedAt: string;
  createdAt: string;
  memberId: string;
  memberName: string | null;
  memberCode: string | null;
  associationId: string;
  associationName: string | null;
};

export const listAllBusinessCardsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<AdminBusinessCard[]> => {
    try {
      const res = await fetchNestApiFromServer<AdminBusinessCard[]>(
        "/business-cards/admin/all",
        context.token,
      );
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  });

// Moderate a card as a manager/admin.
export const adminSetCardStatusFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["draft", "published", "hidden", "suspended", "archived", "rejected"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<void> => {
    await fetchNestApiFromServer(
      "/business-cards/admin/status",
      context.token,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  });

// Bulk moderate cards.
export const adminSetCardsStatusFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        ids: z.array(z.string().uuid()).min(1).max(500),
        status: z.enum(["draft", "published", "hidden", "suspended", "archived", "rejected"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<number> => {
    const res = await fetchNestApiFromServer<number>(
      "/business-cards/admin/bulk-status",
      context.token,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
    return typeof res === "number" ? res : data.ids.length;
  });

// Current user's business-card admin level (drives UI gating).
export const getMyBcAdminLevelFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<BcAdminLevel> => {
    try {
      const res = await fetchNestApiFromServer<string>(
        "/business-cards/admin/level",
        context.token,
      );
      return (res as BcAdminLevel) || "none";
    } catch {
      return "none";
    }
  });

// Change history for a single card.
export type CardAuditEntry = {
  id: string;
  eventType: string;
  reason: string | null;
  from: string | null;
  to: string | null;
  actorName: string | null;
  createdAt: string;
};

export const listCardAuditFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ cardId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<CardAuditEntry[]> => {
    try {
      const res = await fetchNestApiFromServer<CardAuditEntry[]>(
        `/business-cards/admin/audit/${data.cardId}`,
        context.token,
      );
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  });

// Association-wide audit log across every business card the admin can manage.
export type AuditLogEntry = {
  id: string;
  cardId: string;
  eventType: string;
  reason: string | null;
  from: string | null;
  to: string | null;
  changes: Array<{ field: string; from: string | null; to: string | null }>;
  actorName: string | null;
  createdAt: string;
  cardName: string | null;
  cardSlug: string | null;
  memberName: string | null;
  memberCode: string | null;
  associationId: string;
  associationName: string | null;
};

export const listBusinessCardAuditLogFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        eventType: z.string().optional(),
        limit: z.number().int().min(1).max(1000).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<AuditLogEntry[]> => {
    try {
      const query = new URLSearchParams();
      if (data.eventType) query.set("eventType", data.eventType);
      if (data.limit) query.set("limit", String(data.limit));
      const res = await fetchNestApiFromServer<AuditLogEntry[]>(
        `/business-cards/admin/audit-log?${query.toString()}`,
        context.token,
      );
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  });
