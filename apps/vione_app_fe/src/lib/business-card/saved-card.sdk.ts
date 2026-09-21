// SavedCardSDK — BC-3.0 client-safe façade for the Saved Business Card
// organization layer (collections, search, tagging, favorite/archive/move,
// sync, AI suggestions). UI MUST consume this domain through this SDK, never by
// importing server functions or the service directly.

import { fetchNestApi } from "../api-client";
import {
  applySavedCardSuggestionFn,
  archiveSavedCardFn,
  createCollectionFn,
  createSavedCardTagFn,
  deleteCollectionFn,
  deleteSavedCardTagFn,
  listCollectionsFn,
  listSavedCardTagsFn,
  moveSavedCardFn,
  recordSavedCardOpenFn,
  renameSavedCardTagFn,
  searchSavedCardsFn,
  setSavedCardTagsFn,
  suggestSavedCardFn,
  syncSavedCardsFn,
  tagsForSavedCardFn,
  touchSavedCardFn,
  updateCollectionFn,
} from "./saved-card.functions";
import { favoriteSavedCardFn, noteSavedCardFn, removeSavedCardFn } from "./relationship.functions";
import type {
  CreateCollectionInput,
  SavedCardCollection,
  SavedCardSearchQuery,
  SavedCardSuggestion,
  UpdateCollectionInput,
} from "./collection.types";
import type { SavedCardTag } from "./saved-card.contracts";
import type { SavedCard } from "./relationship.types";

export const SavedCardSDK = {
  collections: {
    list(): Promise<SavedCardCollection[]> {
      return listCollectionsFn();
    },
    create(input: CreateCollectionInput): Promise<SavedCardCollection> {
      return createCollectionFn({ data: input });
    },
    update(id: string, patch: UpdateCollectionInput): Promise<SavedCardCollection> {
      return updateCollectionFn({ data: { id, ...patch } });
    },
    remove(id: string): Promise<{ removed: boolean }> {
      return deleteCollectionFn({ data: { id } });
    },
  },

  tags: {
    /** The owner's tag catalog with live counts. */
    list(): Promise<SavedCardTag[]> {
      return listSavedCardTagsFn();
    },
    create(name: string): Promise<SavedCardTag> {
      return createSavedCardTagFn({ data: { name } });
    },
    rename(id: string, name: string): Promise<SavedCardTag> {
      return renameSavedCardTagFn({ data: { id, name } });
    },
    remove(id: string): Promise<{ removed: boolean }> {
      return deleteSavedCardTagFn({ data: { id } });
    },
    /** Tags currently linked to one saved card. */
    forCard(targetCardId: string): Promise<SavedCardTag[]> {
      return tagsForSavedCardFn({ data: { targetCardId } });
    },
    /** Replace the full tag set on a saved card (auto-creates missing tags). */
    setForCard(targetCardId: string, names: string[]): Promise<SavedCardTag[]> {
      return setSavedCardTagsFn({ data: { targetCardId, names } });
    },
  },

  /** Filtered search over the caller's saved cards. */
  search(query: SavedCardSearchQuery = {}): Promise<SavedCard[]> {
    const qs = query.text ? `?term=${encodeURIComponent(query.text)}` : "";
    return fetchNestApi<SavedCard[]>(`/connect-app/network/saved-cards${qs}`).catch(() => []);
  },

  /** Move a saved card into a collection (null = uncategorized). */
  move(targetCardId: string, collectionId: string | null): Promise<SavedCard> {
    return moveSavedCardFn({ data: { targetCardId, collectionId } });
  },

  /** Archive / restore a saved card. */
  setArchived(targetCardId: string, archived: boolean): Promise<SavedCard> {
    return archiveSavedCardFn({ data: { targetCardId, archived } });
  },

  /** Set the favorite flag on a saved card (owner-private). */
  setFavorite(targetCardId: string, favorite: boolean): Promise<SavedCard> {
    return favoriteSavedCardFn({ data: { targetCardId, favorite } });
  },

  /** Set the owner-private note on a saved card (null clears it). */
  setNote(targetCardId: string, notes: string | null): Promise<SavedCard> {
    return noteSavedCardFn({ data: { targetCardId, notes } });
  },

  /**
   * Remove the collector's saved reference ONLY. Never deletes the canonical
   * Business Card — this detaches the owner→card edge.
   */
  remove(targetCardId: string): Promise<{ removed: boolean }> {
    return removeSavedCardFn({ data: { targetCardId } });
  },

  /** Stamp last_opened when the owner opens a saved card. */
  touch(targetCardId: string): Promise<SavedCard> {
    return touchSavedCardFn({ data: { targetCardId } });
  },

  /** Record an open: increments open_count and stamps last_opened. */
  recordOpen(targetCardId: string): Promise<SavedCard> {
    return recordSavedCardOpenFn({ data: { targetCardId } });
  },

  /** Reconcile collections + saved cards (idempotent). */
  sync(): Promise<{ collections: number; cards: number }> {
    return syncSavedCardsFn();
  },

  /** Deterministic per-card suggestion (tags + collection). */
  suggest(targetCardId: string): Promise<SavedCardSuggestion> {
    return suggestSavedCardFn({ data: { targetCardId } });
  },

  /** Apply the suggestion (add tags + move into suggested collection). */
  applySuggestion(targetCardId: string): Promise<SavedCard> {
    return applySavedCardSuggestionFn({ data: { targetCardId } });
  },
};
