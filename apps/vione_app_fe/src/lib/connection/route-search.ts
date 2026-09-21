// BC-5.1 — Canonical route-search contract for the Connections workspace.
// Client-safe: no server-only imports.

import { z } from "zod";
import { fallback } from "@tanstack/zod-adapter";

export const CONNECTION_TABS = ["discover", "incoming", "sent", "connected"] as const;
export type ConnectionTab = (typeof CONNECTION_TABS)[number];

export const CONNECTION_SEARCH_DEFAULT: ConnectionSearch = {
  tab: "discover",
  q: "",
  cursor: null,
};

export const connectionSearchSchema = z.object({
  tab: fallback(z.string(), "discover").default("discover"),
  q: fallback(z.string(), "").default(""),
  cursor: fallback(z.string().nullable(), null).default(null),
});

export type ConnectionSearch = {
  tab: ConnectionTab;
  q: string;
  cursor: string | null;
};

/** Coerce raw parsed search into the frozen typed shape (clamp unknown tabs). */
export function normalizeConnectionSearch(
  raw: z.infer<typeof connectionSearchSchema>,
): ConnectionSearch {
  const tab = (CONNECTION_TABS as readonly string[]).includes(raw.tab)
    ? (raw.tab as ConnectionTab)
    : "discover";
  return {
    tab,
    q: raw.q.slice(0, 200),
    cursor: raw.cursor,
  };
}
