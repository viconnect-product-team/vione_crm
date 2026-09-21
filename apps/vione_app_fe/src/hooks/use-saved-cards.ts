// BC-3.1 — Saved Cards client hooks.
//
// The ONLY client entry-point into the Saved Cards domain. Every read and
// mutation flows through SavedCardSDK — no route/component/hook may import a
// repository, service, server function, or supabase client directly.
//
// Query keys are centralized in `savedCardKeys` so invalidation is precise and
// never leaks PII (only normalized, approved search input is keyed).

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { SavedCardSDK } from "@/lib/business-card/saved-card.sdk";
import type { SavedCard } from "@/lib/business-card/relationship.types";
import type { SavedCardCollection } from "@/lib/business-card/collection.types";
import type { SavedCardTag } from "@/lib/business-card/saved-card.contracts";
import { availabilityOf } from "@/lib/business-card/saved-card.contracts";
import type { SavedCardSearchQuery } from "@/lib/business-card/collection.types";
import { type SavedCardsSearch, type SavedCardSort } from "@/lib/business-card/saved-card.search";

// ── Query keys ────────────────────────────────────────────────────────────────
// Only normalized, non-PII-beyond-approved-search fields are embedded.

export type SavedCardsListKeyInput = {
  text: string;
  collectionId: string | null;
  tag: string | null;
  favorite?: boolean;
  archived?: boolean;
};

export const savedCardKeys = {
  all: ["saved-cards"] as const,
  lists: () => [...savedCardKeys.all, "list"] as const,
  list: (input: SavedCardsListKeyInput): QueryKey => [...savedCardKeys.lists(), input] as const,
  collections: () => [...savedCardKeys.all, "collections"] as const,
  tags: () => [...savedCardKeys.all, "tags"] as const,
  tagsForCard: (targetCardId: string) =>
    [...savedCardKeys.all, "tags", "card", targetCardId] as const,
};

// ── Search → SDK query mapping (server does the heavy filtering) ──────────────

/** Fields sent to the server. Section/sort/source/availability are client-side
 * refinements over the already server-filtered result set (the frozen SDK does
 * not accept them), so they are intentionally NOT part of the query key. */
export function toSdkQuery(s: SavedCardsSearch): SavedCardSearchQuery {
  const archived = s.section === "archived" ? true : s.archived === true ? true : false;
  const favorite = s.section === "favorites" ? true : s.favorite;
  return {
    text: s.q.trim().slice(0, 200) || undefined,
    collectionId: s.collection ? s.collection : undefined,
    tag: s.tags[0], // server accepts a single tag; extra tags refined client-side
    favorite: favorite || undefined,
    archived,
  };
}

function listKeyInput(s: SavedCardsSearch): SavedCardsListKeyInput {
  const q = toSdkQuery(s);
  return {
    text: q.text ?? "",
    collectionId: q.collectionId ?? null,
    tag: q.tag ?? null,
    favorite: q.favorite,
    archived: q.archived,
  };
}

// ── Client-side refinement (sort + multi-tag + availability + source) ─────────

function sortComparator(sort: SavedCardSort): (a: SavedCard, b: SavedCard) => number {
  const time = (v: string | null) => (v ? new Date(v).getTime() : 0);
  switch (sort) {
    case "recentlyOpened":
      return (a, b) => time(b.lastOpened) - time(a.lastOpened);
    case "frequentlyOpened":
      // open_count is not on the DTO; approximate via lastOpened recency.
      return (a, b) => time(b.lastOpened) - time(a.lastOpened);
    case "name":
      return (a, b) => (a.target.displayName ?? "").localeCompare(b.target.displayName ?? "");
    case "company":
      return (a, b) =>
        (a.target.companyName ?? a.company ?? "").localeCompare(
          b.target.companyName ?? b.company ?? "",
        );
    case "recentlySaved":
    default:
      return (a, b) => time(b.savedAt) - time(a.savedAt);
  }
}

export function refineSavedCards(cards: SavedCard[], s: SavedCardsSearch): SavedCard[] {
  let out = cards;
  // Multi-tag AND refinement beyond the single server tag.
  const extraTags = s.tags
    .slice(1)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (extraTags.length > 0) {
    out = out.filter((c) => {
      const owned = c.tags.map((t) => t.trim().toLowerCase());
      return extraTags.every((t) => owned.includes(t));
    });
  }
  if (s.availability) {
    out = out.filter((c) => availabilityOf(c.target) === s.availability);
  }
  if (s.source) {
    out = out.filter((c) => c.source === s.source);
  }
  return [...out].sort(sortComparator(s.sort));
}

// ── Reads ─────────────────────────────────────────────────────────────────────

export function useSavedCards(search: SavedCardsSearch) {
  const keyInput = listKeyInput(search);
  const query = useQuery({
    queryKey: savedCardKeys.list(keyInput),
    queryFn: () => SavedCardSDK.search(toSdkQuery(search)),
    staleTime: 15_000,
  });
  const refined = useMemo(() => refineSavedCards(query.data ?? [], search), [query.data, search]);
  return { ...query, cards: refined };
}

export function useSavedCard(targetCardId: string | undefined, search: SavedCardsSearch) {
  const { cards, ...rest } = useSavedCards(search);
  const card = useMemo(
    () => cards.find((c) => c.targetCardId === targetCardId),
    [cards, targetCardId],
  );
  return { ...rest, card };
}

export function useSavedCardCollections() {
  return useQuery<SavedCardCollection[]>({
    queryKey: savedCardKeys.collections(),
    queryFn: () => SavedCardSDK.collections.list(),
    staleTime: 60_000,
  });
}

export function useSavedCardTags() {
  return useQuery<SavedCardTag[]>({
    queryKey: savedCardKeys.tags(),
    queryFn: () => SavedCardSDK.tags.list(),
    staleTime: 60_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useSaveCardMutations() {
  const qc = useQueryClient();
  const invalidateLists = useCallback(() => {
    void qc.invalidateQueries({ queryKey: savedCardKeys.lists() });
  }, [qc]);
  const invalidateTags = useCallback(() => {
    void qc.invalidateQueries({ queryKey: savedCardKeys.tags() });
  }, [qc]);
  const invalidateCollections = useCallback(() => {
    void qc.invalidateQueries({ queryKey: savedCardKeys.collections() });
  }, [qc]);

  const setFavorite = useMutation({
    mutationFn: (v: { targetCardId: string; favorite: boolean }) =>
      SavedCardSDK.setFavorite(v.targetCardId, v.favorite),
    onSuccess: invalidateLists,
  });

  const setArchived = useMutation({
    mutationFn: (v: { targetCardId: string; archived: boolean }) =>
      SavedCardSDK.setArchived(v.targetCardId, v.archived),
    onSuccess: invalidateLists,
  });

  const move = useMutation({
    mutationFn: (v: { targetCardId: string; collectionId: string | null }) =>
      SavedCardSDK.move(v.targetCardId, v.collectionId),
    onSuccess: () => {
      invalidateLists();
      invalidateCollections();
    },
  });

  const setNote = useMutation({
    mutationFn: (v: { targetCardId: string; notes: string | null }) =>
      SavedCardSDK.setNote(v.targetCardId, v.notes),
    onSuccess: invalidateLists,
  });

  const setTags = useMutation({
    mutationFn: (v: { targetCardId: string; names: string[] }) =>
      SavedCardSDK.tags.setForCard(v.targetCardId, v.names),
    onSuccess: () => {
      invalidateLists();
      invalidateTags();
    },
  });

  const remove = useMutation({
    mutationFn: (v: { targetCardId: string }) => SavedCardSDK.remove(v.targetCardId),
    onSuccess: invalidateLists,
  });

  const recordOpen = useMutation({
    mutationFn: (v: { targetCardId: string }) => SavedCardSDK.recordOpen(v.targetCardId),
    // deliberate open: do not invalidate lists (avoids re-render loops).
  });

  return { setFavorite, setArchived, move, setNote, setTags, remove, recordOpen };
}

export function useSavedCardCollectionMutations() {
  const qc = useQueryClient();
  const invalidate = useCallback(() => {
    void qc.invalidateQueries({ queryKey: savedCardKeys.collections() });
    void qc.invalidateQueries({ queryKey: savedCardKeys.lists() });
  }, [qc]);

  const create = useMutation({
    mutationFn: (v: { name: string; color?: string | null }) => SavedCardSDK.collections.create(v),
    onSuccess: invalidate,
  });
  const rename = useMutation({
    mutationFn: (v: { id: string; name: string }) =>
      SavedCardSDK.collections.update(v.id, { name: v.name }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (v: { id: string }) => SavedCardSDK.collections.remove(v.id),
    onSuccess: invalidate,
  });
  return { create, rename, remove };
}
