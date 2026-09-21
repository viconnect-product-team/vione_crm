// BC-Mobile-2A — Network composition hook.
//
// Thin client-safe adapter over the two LIVE_REUSABLE contracts verified in
// docs/business-connect/mobile/BC_MOBILE_2A_NETWORK_DATA_CONTRACT.md:
//   1. Accepted Global Network connections — GlobalNetworkSDK.connections
//      (+ counterparts.resolvePublic for privacy-safe identity)
//   2. Saved business cards (owner's relationship edges) — SavedCardSDK.search
//
// Network inclusion rule (frozen): accepted connections ∪ non-archived saved
// cards, deduped by public card slug (a connection counterpart whose
// primaryCardSlug matches a saved card's target slug is ONE person; the
// connection row wins). Query keys are scoped by the authenticated viewer id
// so an account switch can never show a stale cross-account Network.
//
// Privacy: the normalized DTO never carries notes, tags, embeddings, scores,
// relationship-memory payloads, or raw backend records.

import { useEffect, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { GlobalNetworkSDK } from "@/lib/global-network/network.sdk";
import { SavedCardSDK } from "@/lib/business-card/saved-card.sdk";
import { GuestContactSDK } from "@/lib/business-card/guest-contact.sdk";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import type { CounterpartSummary, GlobalConnectionDTO } from "@/lib/global-network/types";
import type { SavedCard } from "@/lib/business-card/relationship.types";
import type { GuestContact } from "@/lib/business-card/guest-contact";

// ── Normalized mobile DTO (presentation only — never raw backend records) ────

export type BcMobileNetworkRelationshipKind = "connection" | "saved_card" | "guest_contact";

export type BcMobileNetworkContextKind =
  | "connected"
  | "saved_card"
  | "contact_shared"
  | "card_scanned"; // BC-Mobile-4B — paper-card scan provenance

export type BcMobileNetworkPerson = {
  /** Opaque, URL-safe person id: `u:<userId>` (connection) or `c:<cardId>` (saved card). */
  personId: string;
  /** Underlying relationship edge id (connectionId | savedCardId). */
  relationshipId: string;
  relationshipKind: BcMobileNetworkRelationshipKind;
  /** Null only when the counterpart is not publicly resolvable (UI falls back to i18n). */
  displayName: string | null;
  avatarUrl: string | null;
  headline: string | null;
  companyName: string | null;
  /** ONE restrained context line; null = omit the third row line entirely. */
  context: { kind: BcMobileNetworkContextKind; at: string } | null;
  /** Public card slug — dedupe key + future Person Detail resolution. */
  cardSlug: string | null;
  /** ISO timestamp driving the deterministic recency ordering. */
  sortAt: string;
};

export const BC_MOBILE_NETWORK_PAGE_SIZE = 25;
/** While a search term is active, connection filtering covers at most this
 * many pages (bounded: 4 × 25 = 100 most-recent connections). No server-side
 * connection search contract exists — this is the truthful bounded fallback. */
export const BC_MOBILE_NETWORK_SEARCH_MAX_PAGES = 4;
export const BC_MOBILE_NETWORK_SEARCH_DEBOUNCE_MS = 300;

// ── Query keys (viewer-scoped — cache isolation contract) ────────────────────

export const bcMobileNetworkKeys = {
  root: ["bc-mobile", "network"] as const,
  connections: (viewerUserId: string) =>
    [...bcMobileNetworkKeys.root, viewerUserId, "connections"] as const,
  savedCards: (viewerUserId: string, term: string) =>
    [...bcMobileNetworkKeys.root, viewerUserId, "saved-cards", term] as const,
  guestContacts: (viewerUserId: string) =>
    [...bcMobileNetworkKeys.root, viewerUserId, "guest-contacts"] as const,
};

// ── DTO mapping (pure — unit-tested) ─────────────────────────────────────────

export function connectionToPerson(
  connection: GlobalConnectionDTO,
  counterpart: CounterpartSummary | null,
): BcMobileNetworkPerson {
  const at = connection.respondedAt ?? connection.createdAt;
  return {
    personId: `u:${connection.counterpartUserId}`,
    relationshipId: connection.id,
    relationshipKind: "connection",
    displayName: counterpart?.displayName ?? null,
    avatarUrl: counterpart?.avatarUrl ?? null,
    headline: counterpart?.headline ?? null,
    companyName: counterpart?.companyName ?? null,
    context: at ? { kind: "connected", at } : null,
    cardSlug: counterpart?.primaryCardSlug ?? null,
    sortAt: at ?? "",
  };
}

/** Maps a saved-card edge. Private owner metadata (notes, tags, labels,
 * importance, priority, …) is deliberately NOT carried into the DTO. */
export function savedCardToPerson(card: SavedCard): BcMobileNetworkPerson {
  return {
    personId: `c:${card.targetCardId}`,
    relationshipId: card.id,
    relationshipKind: "saved_card",
    displayName: card.target.displayName,
    avatarUrl: card.target.avatarUrl,
    headline: card.target.professionalTitle,
    companyName: card.target.companyName,
    context: card.savedAt ? { kind: "saved_card", at: card.savedAt } : null,
    cardSlug: card.target.slug ?? null,
    sortAt: card.savedAt ?? "",
  };
}

/** BC-Mobile-3B — maps a guest contact (owner-scoped via RLS). The DTO
 * carries ONLY what the guest explicitly shared: name/title/company and the
 * share timestamps. No card slug exists for guests. */
export function guestContactToPerson(g: GuestContact): BcMobileNetworkPerson {
  return {
    personId: `g:${g.id}`,
    relationshipId: g.id,
    relationshipKind: "guest_contact",
    displayName: g.displayName,
    avatarUrl: null,
    headline: g.title,
    companyName: g.companyName,
    // BC-Mobile-4B — context states provenance truthfully: a scanned paper
    // card is "Card scanned", never "Shared" (scans carry no guest consent).
    context: {
      kind: g.source === "business_card_scan" ? "card_scanned" : "contact_shared",
      at: g.firstSharedAt,
    },
    cardSlug: null,
    sortAt: g.lastSharedAt,
  };
}

/**
 * Merges the relationship sources into ONE Network list.
 * Dedupe: a saved card whose target slug equals a connection counterpart's
 * primaryCardSlug is the same person — the connection (two-way established
 * relationship) wins. Guest contacts carry no slug, so slug-dedupe never
 * applies to them; they are additive (precedence: connection > saved card >
 * guest). Order: relationship recency desc, then display name.
 */
export function mergeNetworkPeople(
  connections: BcMobileNetworkPerson[],
  savedCards: BcMobileNetworkPerson[],
  guestContacts: BcMobileNetworkPerson[] = [],
): BcMobileNetworkPerson[] {
  const connectionSlugs = new Set(
    connections.map((p) => p.cardSlug).filter((s): s is string => Boolean(s)),
  );
  const merged = [
    ...connections,
    ...savedCards.filter((p) => !p.cardSlug || !connectionSlugs.has(p.cardSlug)),
    ...guestContacts,
  ];
  return merged.sort((a, b) => {
    const byTime = b.sortAt.localeCompare(a.sortAt);
    if (byTime !== 0) return byTime;
    const byName = (a.displayName ?? "").localeCompare(b.displayName ?? "");
    if (byName !== 0) return byName;
    return a.personId.localeCompare(b.personId);
  });
}

// ── Bounded client-side connection filter (search fallback) ─────────────────

/** Case- and diacritic-insensitive fold so "binh" matches "Bình". */
export function foldSearchText(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

/** Matches a person against a folded term over display-safe fields only. */
export function personMatchesTerm(person: BcMobileNetworkPerson, foldedTerm: string): boolean {
  if (!foldedTerm) return true;
  return [person.displayName, person.headline, person.companyName]
    .filter((v): v is string => Boolean(v))
    .some((v) => foldSearchText(v).includes(foldedTerm));
}

// ── Debounce ─────────────────────────────────────────────────────────────────

export function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

// ── Composition hook ─────────────────────────────────────────────────────────

export function useBusinessConnectNetwork(searchTerm: string) {
  const viewerId = useViewerUserId();
  const viewerKey = viewerId ?? "viewer-pending";
  const term = useDebouncedValue(searchTerm.trim(), BC_MOBILE_NETWORK_SEARCH_DEBOUNCE_MS);
  const searching = term.length > 0;

  // Source 1 — accepted connections (offset infinite pages, viewer-scoped).
  const connectionsQuery = useInfiniteQuery({
    queryKey: bcMobileNetworkKeys.connections(viewerKey),
    enabled: viewerId !== null,
    staleTime: 15_000,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const list = await GlobalNetworkSDK.connections.listAccepted({
        limit: BC_MOBILE_NETWORK_PAGE_SIZE,
        offset: pageParam,
      });
      const ids = Array.from(new Set(list.map((c: any) => c.counterpartUserId)));
      const summaries = ids.length ? await GlobalNetworkSDK.counterparts.resolvePublic(ids) : [];
      const byId = new Map(summaries.map((s) => [s.userId, s]));
      return list.map((c: any) => connectionToPerson(c, byId.get(c.counterpartUserId) ?? null));
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === BC_MOBILE_NETWORK_PAGE_SIZE
        ? allPages.length * BC_MOBILE_NETWORK_PAGE_SIZE
        : undefined,
  });

  // Bounded search fallback: while a term is active, extend the loaded
  // connection pages up to SEARCH_MAX_PAGES so filtering covers the 100 most
  // recent relationships (no server-side connection search exists).
  useEffect(() => {
    if (!searching) return;
    const pages = connectionsQuery.data?.pages.length ?? 0;
    if (
      connectionsQuery.hasNextPage &&
      !connectionsQuery.isFetchingNextPage &&
      pages < BC_MOBILE_NETWORK_SEARCH_MAX_PAGES
    ) {
      void connectionsQuery.fetchNextPage();
    }
  }, [searching, connectionsQuery]);

  // Source 2 — saved business cards (real server-side viewer-scoped search).
  const savedCardsQuery = useQuery({
    queryKey: bcMobileNetworkKeys.savedCards(viewerKey, term),
    enabled: viewerId !== null,
    staleTime: 15_000,
    queryFn: async () => {
      const cards = await SavedCardSDK.search(term ? { text: term } : {});
      return cards.map(savedCardToPerson);
    },
  });

  // Source 3 — BC-Mobile-3B guest contacts (owner-scoped via RLS; additive —
  // no slug dedupe applies). Bounded list, filtered client-side like the
  // connection fallback.
  const guestContactsQuery = useQuery({
    queryKey: bcMobileNetworkKeys.guestContacts(viewerKey),
    enabled: viewerId !== null,
    staleTime: 15_000,
    queryFn: async () => {
      const guests = await GuestContactSDK.listMine();
      return guests.map(guestContactToPerson);
    },
  });

  const connectionPeople = (connectionsQuery.data?.pages ?? []).flat();
  const savedCardPeople = savedCardsQuery.data ?? [];
  const guestPeople = guestContactsQuery.data ?? [];
  const merged = mergeNetworkPeople(connectionPeople, savedCardPeople, guestPeople);
  const people = searching
    ? merged.filter((p) => personMatchesTerm(p, foldSearchText(term)))
    : merged;

  const initialLoading =
    (connectionsQuery.isPending && savedCardsQuery.isPending) || viewerId === null;
  // Full error only when ALL sources failed and no data survived; a single
  // failing source degrades to the others' data (React Query keeps last good).
  const noData = !connectionsQuery.data && !savedCardsQuery.data && !guestContactsQuery.data;
  const coreError =
    connectionsQuery.isError && savedCardsQuery.isError && guestContactsQuery.isError && noData;

  return {
    people,
    searching: searchTerm.trim().length > 0,
    initialLoading,
    coreError,
    isLoadingMore: connectionsQuery.isFetchingNextPage,
    hasMore: !searching && Boolean(connectionsQuery.hasNextPage),
    loadMore: () => {
      if (connectionsQuery.hasNextPage && !connectionsQuery.isFetchingNextPage) {
        void connectionsQuery.fetchNextPage();
      }
    },
    retry: () => {
      void connectionsQuery.refetch();
      void savedCardsQuery.refetch();
      void guestContactsQuery.refetch();
    },
  };
}

export type BcMobileNetworkResult = ReturnType<typeof useBusinessConnectNetwork>;
