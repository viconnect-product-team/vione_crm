// Pure row → DTO mapping + deterministic AI suggestions for the SavedCard
// organization layer. No supabase, no window — unit-testable.

import type {
  SavedCardCollection,
  SavedCardCollectionKind,
  SavedCardSuggestion,
  SystemCollectionSlug,
} from "./collection.types";
import { SYSTEM_COLLECTION_SLUGS } from "./collection.types";
import type { SavedCard } from "./relationship.types";

export function mapRowToCollection(
  row: Record<string, unknown>,
  count: number,
): SavedCardCollection {
  const isSystem = Boolean(row.is_system);
  return {
    id: row.id as string,
    slug: (row.slug as string) ?? "",
    name: (row.name as string) ?? "",
    kind: (row.kind as SavedCardCollectionKind) ?? (isSystem ? "system" : "custom"),
    color: (row.color as string) ?? null,
    position: typeof row.position === "number" ? row.position : 0,
    isSystem,
    count,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ── Deterministic suggestion engine (no external model) ─────────────────────

const KEYWORDS: {
  slug: SystemCollectionSlug;
  rel: SavedCardSuggestion["relationship"];
  words: string[];
}[] = [
  {
    slug: "investors",
    rel: "investor",
    words: ["invest", "venture", "capital", "vc", "fund", "angel", "quỹ", "đầu tư"],
  },
  {
    slug: "suppliers",
    rel: "supplier",
    words: ["supply", "supplier", "vendor", "manufactur", "logistics", "nhà cung cấp", "cung ứng"],
  },
  {
    slug: "partners",
    rel: "partner",
    words: ["partner", "agency", "consult", "law", "advisor", "đối tác", "tư vấn"],
  },
  {
    slug: "customers",
    rel: "customer",
    words: ["retail", "buyer", "client", "customer", "khách hàng", "mua"],
  },
];

/** Suggest tags + a target collection from a saved card's known fields. Pure. */
export function suggestForSavedCard(card: SavedCard): SavedCardSuggestion {
  const hay = [
    card.target.professionalTitle,
    card.target.companyName,
    card.company,
    card.industry,
    card.interest,
    ...card.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const tags = new Set<string>();
  if (card.industry) tags.add(card.industry.trim().slice(0, 40));
  if (card.target.companyName) tags.add(card.target.companyName.trim().slice(0, 40));

  for (const k of KEYWORDS) {
    if (k.words.some((w) => hay.includes(w))) {
      tags.add(k.slug);
      return {
        tags: Array.from(tags).slice(0, 8),
        collectionSlug: k.slug,
        relationship: k.rel,
        reason: `Matched keywords for ${k.slug}`,
      };
    }
  }

  return {
    tags: Array.from(tags).slice(0, 8),
    collectionSlug: card.favorite ? "favorites" : null,
    relationship: card.favorite ? "contact" : "prospect",
    reason: card.favorite ? "Marked as favorite" : "No strong signal; kept as prospect",
  };
}

export function isSystemSlug(slug: string): slug is SystemCollectionSlug {
  return (SYSTEM_COLLECTION_SLUGS as string[]).includes(slug);
}
