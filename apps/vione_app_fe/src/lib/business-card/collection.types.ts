// BC-3.0 — Saved Card Collections.
//
// A Collection is an owner-scoped grouping of Saved Business Cards. System
// collections (default, favorites, customers, partners, suppliers, investors)
// are seeded lazily per user; custom collections are user-created. Collections
// NEVER duplicate card data — a saved card simply carries a collection_id.

export type SystemCollectionSlug =
  | "default"
  | "favorites"
  | "customers"
  | "partners"
  | "suppliers"
  | "investors";

export const SYSTEM_COLLECTIONS: {
  slug: SystemCollectionSlug;
  name: string;
  color: string;
  position: number;
}[] = [
  { slug: "default", name: "Default", color: "#64748b", position: 0 },
  { slug: "favorites", name: "Favorites", color: "#eab308", position: 1 },
  { slug: "customers", name: "Customers", color: "#22c55e", position: 2 },
  { slug: "partners", name: "Partners", color: "#3b82f6", position: 3 },
  { slug: "suppliers", name: "Suppliers", color: "#a855f7", position: 4 },
  { slug: "investors", name: "Investors", color: "#f97316", position: 5 },
];

export const SYSTEM_COLLECTION_SLUGS: SystemCollectionSlug[] = SYSTEM_COLLECTIONS.map(
  (c) => c.slug,
);

export type SavedCardCollectionKind = "system" | "custom";

export type SavedCardCollection = {
  id: string;
  slug: string;
  name: string;
  kind: SavedCardCollectionKind;
  color: string | null;
  position: number;
  isSystem: boolean;
  /** Number of (non-archived) saved cards currently in this collection. */
  count: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateCollectionInput = {
  name: string;
  color?: string | null;
};

export type UpdateCollectionInput = {
  name?: string;
  color?: string | null;
  position?: number;
};

// ── Search ────────────────────────────────────────────────────────────────

export type SavedCardSearchQuery = {
  /** Free text over name, company, industry, tags. */
  text?: string;
  collectionId?: string | null;
  tag?: string;
  industry?: string;
  location?: string;
  association?: string;
  favorite?: boolean;
  archived?: boolean;
};

export const SAVED_CARD_ERR = {
  COLLECTION_NOT_FOUND: "SC_COLLECTION_NOT_FOUND",
  SYSTEM_LOCKED: "SC_SYSTEM_LOCKED",
  DUPLICATE_NAME: "SC_DUPLICATE_NAME",
} as const;

// ── AI (deterministic, no external model) ───────────────────────────────────

export type SavedCardSuggestion = {
  tags: string[];
  collectionSlug: SystemCollectionSlug | null;
  relationship: "prospect" | "customer" | "partner" | "supplier" | "investor" | "contact";
  reason: string;
};
