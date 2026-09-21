// BusinessCardSDK — the client-facing facade for the Business Card shared
// service. Other product surfaces (Marketplace, Association, Community, AI)
// MUST consume the Business Card domain through this SDK, never by importing the
// server functions or querying member_business_cards directly.
//
// DB-backed verbs delegate to the domain server functions (RPC stubs, safe to
// import on the client). Pure verbs (vCard/QR/share/theme) delegate to the
// client-safe share primitives. Behavior is unchanged — this is a thin facade.

import {
  deleteBusinessCardFn,
  getMyBusinessCardFn,
  getPublicBusinessCardFn,
  listMyBusinessCardsFn,
  saveBusinessCardFn,
  setBusinessCardStatusFn,
  setPrimaryBusinessCardFn,
} from "@/lib/business-card.functions";
import {
  createGlobalCardDraftFn,
  getGlobalBuilderEligibilityFn,
  getMyGlobalCardFn,
  listMyGlobalCardsFn,
  type GlobalBuilderEligibility,
} from "@/lib/business-card/global-builder.functions";
import { resolveBusinessCardOwnerContextFn } from "@/lib/identity/identity-bridge.functions";
import {
  favoriteSavedCardFn,
  isSavedCardBySlugFn,
  isSavedCardFn,
  listSavedCardsFn,
  noteSavedCardFn,
  recordRelationshipEventFn,
  relationshipCollectionsFn,
  relationshipHistoryFn,
  relationshipScoreFn,
  relationshipTimelineFn,
  removeSavedCardBySlugFn,
  removeSavedCardFn,
  saveCardBySlugFn,
  saveCardFn,
  tagSavedCardFn,
  updateSavedCardMetadataFn,
} from "@/lib/business-card/relationship.functions";
import {
  createInteractionFn,
  deleteInteractionFn,
  interactionTimelineFn,
  listInteractionsFn,
  updateInteractionFn,
} from "@/lib/business-card/interaction.functions";
import type {
  BusinessInteraction,
  CreateInteractionInput,
  InteractionTimeline,
  UpdateInteractionInput,
} from "@/lib/business-card/interaction.types";
import { CompanySDK } from "@/lib/company/company.sdk";
import type {
  Company,
  CompanyMember,
  CreateCompanyInput,
  InviteMemberInput,
  UpdateCompanyInput,
} from "@/lib/company/company.types";
import type {
  JsonValue,
  RelationshipEvent,
  RelationshipEventType,
  RelationshipMetadataPatch,
  RelationshipScore,
  RelationshipTimeline,
  SaveCardInput,
  SavedCard,
  SavedCardSource,
  SmartCollection,
} from "@/lib/business-card/relationship.types";
import {
  buildSharePayload,
  cardPublicUrl,
  generateQR,
  generateVCard,
  resolveTheme,
  type CardSharePayload,
  type ShareContact,
} from "./business-card.share";
import type {
  BusinessCard,
  BusinessCardSummary,
  CardWriteInput,
  PublicBusinessCardResult,
} from "./business-card.types";

function currentOrigin(origin?: string): string {
  if (origin) return origin;
  return typeof window !== "undefined" ? window.location.origin : "";
}

const NEST_API =
  typeof window !== "undefined" &&
  (window.location.protocol === "https:" ||
    window.location.port === "5443" ||
    window.location.port === "5444" ||
    window.location.port === "5445")
    ? ""
    : (import.meta.env.VITE_API_URL || "http://localhost:3000");
const API_URL = NEST_API ? (NEST_API.endsWith("/api") ? NEST_API : `${NEST_API}/api`) : "/api";
const getHeaders = (): HeadersInit => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('vibe_token') : null;
  return token ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` } : { "Content-Type": "application/json" };
};

export const BusinessCardSDK = {
  /** Full card owned by the caller. */
  async get(id: string): Promise<BusinessCard> {
    const res = await fetch(`${API_URL}/business-cards/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch card");
    return res.json();
  },

  /** Caller's card summaries. */
  async list(): Promise<BusinessCardSummary[]> {
    const res = await fetch(`${API_URL}/business-cards`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to list cards");
    return res.json();
  },

  /** Create a card (owner_user_id is set server-side from auth.uid()). */
  async create(input: CardWriteInput): Promise<{ id: string }> {
    const res = await fetch(`${API_URL}/business-cards`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ ...input, id: null })
    });
    if (!res.ok) throw new Error("Failed to create card");
    return res.json();
  },

  /** Update an existing card. */
  async update(input: CardWriteInput & { id: string }): Promise<{ id: string }> {
    const res = await fetch(`${API_URL}/business-cards`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error("Failed to update card");
    return res.json();
  },

  /** Delete a card the caller owns. */
  async delete(id: string): Promise<{ ok: boolean }> {
    const res = await fetch(`${API_URL}/business-cards/${id}`, { method: "DELETE", headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to delete card");
    return res.json();
  },

  /** Archive a card. */
  async archive(id: string): Promise<{ ok: boolean }> {
    const res = await fetch(`${API_URL}/business-cards/${id}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status: "archived" })
    });
    return res.json();
  },

  /** Return a card to draft (unpublish). */
  async unpublish(id: string): Promise<{ ok: boolean }> {
    const res = await fetch(`${API_URL}/business-cards/${id}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status: "draft" })
    });
    return res.json();
  },

  /** Mark a card as the caller's primary card. */
  async setPrimary(id: string): Promise<{ ok: boolean }> {
    const res = await fetch(`${API_URL}/business-cards/${id}/primary`, { method: "POST", headers: getHeaders() });
    return res.json();
  },

  // ── Global builder (BC-2.2) ───────────────────────────────────────────────
  /** Whether the caller may use the global (platform-user) builder. */
  async globalEligibility(): Promise<GlobalBuilderEligibility> {
    return getGlobalBuilderEligibilityFn();
  },

  /** List the caller's global (owner-scoped) cards. */
  async listGlobal(): Promise<BusinessCardSummary[]> {
    const res = await fetch(`${API_URL}/business-cards`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch global cards");
    const rawList = await res.json();
    return rawList.map((c: any) => ({
      id: c.id,
      slug: c.slug,
      cardKind: c.card_kind,
      status: c.status,
      publicMode: c.public_mode,
      displayName: c.display_name,
      professionalTitle: c.professional_title,
      companyName: c.company_name,
      avatarUrl: c.avatar_url,
      updatedAt: c.updated_at
    }));
  },

  /** Get one global card the caller owns (works on drafts). */
  async getGlobal(id: string): Promise<BusinessCard> {
    const res = await fetch(`${API_URL}/business-cards/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch global card");
    const c = await res.json();
    return {
      id: c.id,
      slug: c.slug,
      cardKind: c.card_kind,
      status: c.status,
      publicMode: c.public_mode,
      displayName: c.display_name,
      professionalTitle: c.professional_title,
      companyName: c.company_name,
      avatarUrl: c.avatar_url,
      updatedAt: c.updated_at,
      themeId: c.theme_id,
      bio: c.bio,
      website: c.website,
      skills: (c.skills || []).map((s: any) => s.skill_name || s),
      services: (c.services || []).map((s: any) => ({ title: s.title, description: s.description })),
      needs: (c.needs || []).map((n: any) => n.need_name || n),
    } as BusinessCard;
  },

  /** Create a prefilled draft global card owned by the caller. */
  async createGlobalDraft(): Promise<{ id: string }> {
    const res = await fetch(`${API_URL}/business-cards`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        card_kind: "custom",
        status: "draft",
        slug: `card-${Math.random().toString(36).substring(2, 10)}`,
      })
    });
    if (!res.ok) throw new Error("Failed to create draft card");
    const data = await res.json();
    return { id: data.id };
  },

  /** Publish a card. */
  async publish(id: string): Promise<{ ok: boolean }> {
    const res = await fetch(`${API_URL}/business-cards/${id}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status: "published" })
    });
    return res.json();
  },

  /** Hide a card. */
  async hide(id: string): Promise<{ ok: boolean }> {
    const res = await fetch(`${API_URL}/business-cards/${id}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status: "hidden" })
    });
    return res.json();
  },

  /** Public projection by slug (respects public_mode). */
  async getPublic(slug: string): Promise<PublicBusinessCardResult> {
    const res = await fetch(`${API_URL}/business-cards/public/${slug}`);
    if (!res.ok) throw new Error("Failed to fetch public card");
    return res.json();
  },

  /** Build a full share payload (URL + vCard + QR) for a card. */
  share(contact: ShareContact, origin?: string): CardSharePayload {
    return buildSharePayload(currentOrigin(origin), contact);
  },

  /** vCard text for a card. */
  generateVCard(contact: ShareContact, origin?: string): string {
    return generateVCard(currentOrigin(origin), contact);
  },

  /** QR value (public URL, or smart-QR when a code is supplied). */
  generateQR(slug: string, opts?: { origin?: string; code?: string }): string {
    return generateQR(currentOrigin(opts?.origin), slug, { code: opts?.code });
  },

  /** Resolve the ownership context of a card (owner_user_id → legacy member). */
  async resolveOwner(cardId: string) {
    return resolveBusinessCardOwnerContextFn({ data: { cardId } });
  },

  /** Public URL for a card slug. */
  publicUrl(slug: string, origin?: string): string {
    return cardPublicUrl(currentOrigin(origin), slug);
  },

  /** Theme resolution for a stored theme id. */
  theme: resolveTheme,

  /**
   * Business Relationships (BC-2.4) — the owner→card graph built on Saved
   * Business Cards. Persistent connections + private metadata; no messaging.
   */
  relationships: {
    /** All of the caller's saved relationships (newest first, live summary). */
    list(): Promise<SavedCard[]> {
      return listSavedCardsFn();
    },
    /** Whether the caller has saved a target card. */
    isSaved(targetCardId: string): Promise<boolean> {
      return isSavedCardFn({ data: { targetCardId } });
    },
    /** Save a relationship edge to a target card. */
    save(input: SaveCardInput): Promise<SavedCard> {
      return saveCardFn({ data: input });
    },
    /** Save via a public slug (QR/NFC/URL import flows). */
    saveBySlug(slug: string, source?: SavedCardSource): Promise<SavedCard> {
      return saveCardBySlugFn({ data: { slug, source } });
    },
    /** BC-Mobile-3A — Saved-state check by public slug (no internal id leaks). */
    isSavedBySlug(slug: string): Promise<boolean> {
      return isSavedCardBySlugFn({ data: { slug } });
    },
    /** BC-Mobile-3A — Remove a relationship edge by public slug. */
    removeBySlug(slug: string): Promise<{ removed: boolean }> {
      return removeSavedCardBySlugFn({ data: { slug } });
    },
    /** Remove a relationship edge by target card id. */
    remove(targetCardId: string): Promise<{ removed: boolean }> {
      return removeSavedCardFn({ data: { targetCardId } });
    },
    /** Set the favorite flag on an edge. */
    setFavorite(targetCardId: string, favorite: boolean): Promise<SavedCard> {
      return favoriteSavedCardFn({ data: { targetCardId, favorite } });
    },
    /** Replace the private tag set on an edge. */
    setTags(targetCardId: string, tags: string[]): Promise<SavedCard> {
      return tagSavedCardFn({ data: { targetCardId, tags } });
    },
    /** Set the private note on an edge. */
    setNote(targetCardId: string, notes: string | null): Promise<SavedCard> {
      return noteSavedCardFn({ data: { targetCardId, notes } });
    },
    /** Patch owner-only relationship metadata. */
    update(targetCardId: string, patch: RelationshipMetadataPatch): Promise<SavedCard> {
      return updateSavedCardMetadataFn({ data: { targetCardId, ...patch } });
    },
    /** Append an interaction event to a relationship's history/timeline. */
    recordEvent(
      targetCardId: string,
      type: RelationshipEventType,
      metadata?: Record<string, JsonValue>,
    ): Promise<RelationshipEvent> {
      return recordRelationshipEventFn({ data: { targetCardId, type, metadata } });
    },
    /** Derived timeline (edge timestamps + events) for one relationship. */
    timeline(targetCardId: string): Promise<RelationshipTimeline> {
      return relationshipTimelineFn({ data: { targetCardId } });
    },
    /** History events (newest first) for one relationship or the whole graph. */
    history(targetCardId?: string): Promise<RelationshipEvent[]> {
      return relationshipHistoryFn({ data: { targetCardId } });
    },
    /** Dynamic smart collections over the caller's saved cards. */
    collections(): Promise<SmartCollection[]> {
      return relationshipCollectionsFn();
    },
    /** Deterministic relationship score for one relationship. */
    relationshipScore(targetCardId: string): Promise<RelationshipScore> {
      return relationshipScoreFn({ data: { targetCardId } });
    },
  },

  /**
   * Business Interactions (BC-2.6) — immutable business events on a relationship
   * (owner→card edge). The interaction layer between the Relationship Graph and
   * Networking. Owner-private; no chat, feed, CRM, or marketplace.
   */
  interactions: {
    /** Create an immutable interaction on a relationship the caller owns. */
    create(input: CreateInteractionInput): Promise<BusinessInteraction> {
      return createInteractionFn({
        data: {
          relationshipId: input.relationshipId,
          companyId: input.companyId ?? null,
          type: input.type,
          occurredAt: input.occurredAt ?? null,
          title: input.title ?? null,
          note: input.note ?? null,
          location: input.location ?? null,
          metadata: input.metadata,
        },
      });
    },
    /** Patch an interaction the caller owns. */
    update(id: string, patch: UpdateInteractionInput): Promise<BusinessInteraction> {
      return updateInteractionFn({ data: { id, ...patch } });
    },
    /** Delete an interaction the caller owns. */
    delete(id: string): Promise<{ removed: boolean }> {
      return deleteInteractionFn({ data: { id } });
    },
    /** List interactions for one relationship or the whole graph (newest first). */
    list(relationshipId?: string): Promise<BusinessInteraction[]> {
      return listInteractionsFn({ data: { relationshipId } });
    },
    /** Derived interaction timeline for one relationship. */
    timeline(relationshipId: string): Promise<InteractionTimeline> {
      return interactionTimelineFn({ data: { relationshipId } });
    },
  },

  /**
   * Companies / Organizations (BC-2.7) — first-class Platform entity. A Business
   * Profile may optionally represent a Company; relationships and interactions
   * may optionally reference a company_id. This namespace is a thin passthrough
   * to CompanySDK, kept here so surfaces already using BusinessCardSDK can reach
   * companies without a second import. No CRM/marketplace/community/messaging.
   */
  companies: {
    createCompany(input: CreateCompanyInput): Promise<Company> {
      return CompanySDK.createCompany(input);
    },
    updateCompany(id: string, patch: UpdateCompanyInput): Promise<Company> {
      return CompanySDK.updateCompany(id, patch);
    },
    listCompanies(): Promise<Company[]> {
      return CompanySDK.listCompanies();
    },
    inviteMember(input: InviteMemberInput): Promise<CompanyMember> {
      return CompanySDK.inviteMember(input);
    },
  },
};
