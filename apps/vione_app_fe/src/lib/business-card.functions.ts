import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";

// ── Domain type + constant re-exports ──────────────────────────────────────
// Canonical home is @/lib/business-card/business-card.types. Re-exported here so
// existing importers of "@/lib/business-card.functions" keep working unchanged.
export {
  DEFAULT_VISIBILITY,
  normalizeVisibility,
  BC_ERR,
} from "@/lib/business-card/business-card.types";
export type {
  CardKind,
  CardStatus,
  PublicMode,
  VisibilitySettings,
  CardSkill,
  CardService,
  CardNeed,
  BusinessCard,
  BusinessCardSummary,
  PublicBusinessCardResult,
} from "@/lib/business-card/business-card.types";

import type {
  BusinessCard,
  BusinessCardSummary,
  PublicBusinessCardResult,
} from "@/lib/business-card/business-card.types";

// ── Validation ───────────────────────────────────────────────────────────
const nullableStr = (max: number) => z.string().trim().max(max).nullable().optional();

const cardInput = z.object({
  id: z.string().uuid().nullable().optional(),
  // BC-2.1C: additive create scope. "association" (default) = existing member
  // builder flow. "global" = platform-user-owned card with no member/association
  // link. Client NEVER supplies owner_user_id — it is always auth.uid().
  scope: z.enum(["association", "global"]).optional(),
  slug: z.string().trim().min(2).max(60),
  cardKind: z.enum(["primary", "secondary"]),
  publicMode: z.enum(["public", "members_only", "private"]),
  visibilitySettings: z
    .object({
      showContact: z.boolean(),
      showSocial: z.boolean(),
      showServices: z.boolean(),
      showNeeds: z.boolean(),
    })
    .optional(),
  displayName: nullableStr(120),
  professionalTitle: nullableStr(160),
  companyName: nullableStr(200),
  companyLogoUrl: nullableStr(600),
  avatarUrl: nullableStr(600),
  coverUrl: nullableStr(600),
  headline: nullableStr(200),
  bio: nullableStr(2000),
  // EN overrides for two-sided VI/EN business cards. Optional; empty side is
  // hidden at render time so old cards keep working unchanged.
  displayNameEn: nullableStr(120),
  professionalTitleEn: nullableStr(160),
  companyNameEn: nullableStr(200),
  headlineEn: nullableStr(200),
  bioEn: nullableStr(2000),
  website: nullableStr(300),
  workEmail: nullableStr(200),
  workPhone: nullableStr(60),
  zaloUrl: nullableStr(300),
  linkedinUrl: nullableStr(300),
  facebookUrl: nullableStr(300),
  youtubeUrl: nullableStr(300),
  tiktokUrl: nullableStr(300),
  address: nullableStr(400),
  mapUrl: nullableStr(600),
  themeId: nullableStr(60),
  customBrandColor: nullableStr(20),
  qrOptions: z
    .object({
      background: z.enum(["white", "template", "transparent"]),
      logoScale: z.number().min(0.14).max(0.3),
      logoOffsetX: z.number().min(-0.25).max(0.25),
      logoOffsetY: z.number().min(-0.25).max(0.25),
    })
    .nullable()
    .optional(),
  skills: z.array(z.object({ label: z.string().trim().min(1).max(60) })).max(30),
  services: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(160),
        description: nullableStr(600),
        category: nullableStr(80),
      }),
    )
    .max(30),
  needs: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(160),
        description: nullableStr(600),
        category: nullableStr(80),
      }),
    )
    .max(30),
});

import { fetchNestApiFromServer } from "@/lib/api-client";
import { mapRowToBusinessCard, mapRowToSummary } from "@/lib/business-card/business-card.mappers";

// ── Server functions (thin adapters over NestJS REST API) ──────────────────

export const listMyBusinessCardsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<BusinessCardSummary[]> => {
    try {
      const rows = await fetchNestApiFromServer<any[]>("/business-cards", context.token);
      return (rows || []).map(mapRowToSummary);
    } catch {
      return [];
    }
  });

import {
  BC_ERR,
} from "@/lib/business-card/business-card.types";
import { toPublicBusinessCard } from "@/lib/business-card/public-card";

export const getMyBusinessCardFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<BusinessCard> => {
    const raw = await fetchNestApiFromServer<any>(`/business-cards/${data.id}`, context.token);
    if (!raw) throw new Error(BC_ERR.NOT_FOUND);
    return mapRowToBusinessCard(
      raw,
      { skills: raw.skills, services: raw.services, needs: raw.needs },
      {
        status: "draft",
        publicMode: "members_only",
        exposeOwner: true,
      },
    );
  });

// Preview by slug (owner / manager, works on drafts).
export const getBusinessCardPreviewFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ slug: z.string().trim().min(1).max(60) }).parse(d))
  .handler(async ({ data, context }): Promise<BusinessCard | null> => {
    try {
      const raw = await fetchNestApiFromServer<any>(
        `/business-cards/preview/${encodeURIComponent(data.slug)}`,
        context.token,
      );
      if (!raw) return null;
      return mapRowToBusinessCard(
        raw,
        { skills: raw.skills, services: raw.services, needs: raw.needs },
        {
          status: "draft",
          publicMode: "members_only",
          exposeOwner: true,
        },
      );
    } catch {
      return null;
    }
  });

// Public profile by slug (no auth; respects public_mode).
export const getPublicBusinessCardFn = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().trim().min(1).max(60) }).parse(d))
  .handler(async ({ data }): Promise<PublicBusinessCardResult> => {
    try {
      const raw = await fetchNestApiFromServer<any>(
        `/business-cards/public/${encodeURIComponent(data.slug)}`,
      );
      if (!raw) return { state: "not_found" };
      if (raw.public_mode === "members_only" || raw.publicMode === "members_only") {
        return { state: "members_only" };
      }
      const card = mapRowToBusinessCard(
        raw,
        { skills: raw.skills, services: raw.services, needs: raw.needs },
        {
          status: "published",
          publicMode: "public",
          exposeOwner: false,
        },
      );
      return { state: "public", card: toPublicBusinessCard(card) };
    } catch {
      return { state: "not_found" };
    }
  });

// Public: published + fully-public profile slugs for the sitemap (BC-2.3 SEO).
export const listPublicProfileSlugsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ slug: string; updatedAt: string | null }[]> => {
    try {
      const res = await fetchNestApiFromServer<{ slug: string; updatedAt: string | null }[]>(
        "/business-cards/public-slugs",
      );
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },
);

// Create / update (with child replace).
export const saveBusinessCardFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => cardInput.parse(d))
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const res = await fetchNestApiFromServer<{ id: string }>(
      "/business-cards",
      context.token,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
    return res;
  });

// Set status (publish / unpublish / archive).
export const setBusinessCardStatusFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["draft", "published", "hidden", "archived"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    await fetchNestApiFromServer(
      `/business-cards/${data.id}/status`,
      context.token,
      {
        method: "PATCH",
        body: JSON.stringify({ status: data.status }),
      },
    );
    return { ok: true };
  });

// Set Primary (demote current primary, promote target).
export const setPrimaryBusinessCardFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    return await fetchNestApiFromServer<{ ok: boolean }>(
      `/business-cards/${data.id}/primary`,
      context.token,
      {
        method: "POST",
      },
    );
  });

// Delete.
export const deleteBusinessCardFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    await fetchNestApiFromServer(`/business-cards/${data.id}`, context.token, {
      method: "DELETE",
    });
    return { ok: true };
  });

// ── Leads + analytics (thin adapters over LeadService) ─────────────────────
// All lead/stats domain logic lives in LeadService / LeadRepository. Types and
// constants are re-exported so existing importers of this module are unchanged.
export { REPLY_TEMPLATES, LEAD_STATUSES } from "@/lib/business-card/lead.types";
export type {
  LeadStatus,
  ReplyChannel,
  LeadReplyEntry,
  ReplyTemplate,
  LeadHistoryEntry,
  BusinessCardLead,
  DailyPoint,
  StatusBreakdown,
  BusinessCardStats,
} from "@/lib/business-card/lead.types";

import { LeadService } from "@/lib/business-card/lead.service";
import type { BusinessCardLead, BusinessCardStats } from "@/lib/business-card/lead.types";

export const listMyBusinessCardLeadsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(({ context }): Promise<BusinessCardLead[]> => LeadService.listMyLeads(context.token));

export const updateBusinessCardLeadStatusFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["new", "read", "contacting", "responded", "won", "lost", "archived"]),
        note: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(
    ({ data, context }): Promise<{ ok: boolean }> =>
      LeadService.updateStatus(context.token, data.id, data.status, data.note),
  );

export const sendBusinessCardLeadReplyFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        channel: z.enum(["email", "phone", "note"]),
        templateId: z.string().max(60).nullable().optional(),
        subject: z.string().trim().max(200).nullable().optional(),
        body: z.string().trim().min(1).max(5000),
        markResponded: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(
    ({ data, context }): Promise<{ ok: boolean }> => LeadService.sendReply(context.token, data),
  );

// Workflow action from the notification center: change status AND auto-append
// an entry to the response history so the timeline reflects the action.
export const processLeadWorkflowFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["read", "contacting", "won", "lost"]),
        note: z.string().trim().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(
    ({ data, context }): Promise<{ ok: boolean }> =>
      LeadService.processWorkflow(context.token, data.id, data.status, data.note),
  );

// ── Analytics / Stats ─────────────────────────────────────────────────────
export const getBusinessCardStatsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({ days: z.number().int().min(7).max(90).optional() }).parse(d ?? {}),
  )
  .handler(
    ({ data, context }): Promise<BusinessCardStats> =>
      LeadService.getStats(context.token, data.days),
  );
