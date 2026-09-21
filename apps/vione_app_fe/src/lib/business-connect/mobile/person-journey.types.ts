// BC-Mobile-2D — Person Journey read-model types (framework-free).
//
// Contract: docs/business-connect/mobile/BC_MOBILE_2D_TIMELINE_DATA_CONTRACT.md
//
// This module contains ONLY erased types, the opaque person-id parser, and the
// frozen constants of the 2D read contract. No React, no Supabase, no
// repositories — safe to import from both client and server bundles.
//
// Frozen rules:
// - Read-only. No write helpers live here and none may be added.
// - DTO whitelist: id, kind, occurredAt, provenance.domain. No graph node ids,
//   no metadata, no tenant fields, no counters.
// - SAVED_CARD / MET graph event kinds are TIMELINE_OPTIONAL and unwired; they
//   are intentionally NOT part of JOURNEY_EVENT_KINDS.

// ── Opaque person id (mirrors the 2C contract §1) ───────────────────────────

const PERSON_ID_RE =
  /^([ucg]):([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;

export type ParsedPersonId = {
  kind: "connection" | "saved_card" | "guest_contact";
  id: string;
};

export function parseBcMobilePersonId(raw: string): ParsedPersonId | null {
  const m = PERSON_ID_RE.exec(raw);
  if (!m) return null;
  const kind = m[1] === "u" ? "connection" : m[1] === "c" ? "saved_card" : "guest_contact";
  return { kind, id: m[2]!.toLowerCase() };
}

// ── Canonical event kinds wired for 2D ──────────────────────────────────────
// CONNECTED_TO   — emitted by the canonical connect write (BC-5.0 accept path).
// INTRO_*        — projected from introduction domain records (BC-7.5B).
// MEETING_*      — EXCLUDED: no projection exists (projection marks meetings
//                  NOT_READABLE for mobile); never request them.

export const JOURNEY_EVENT_KINDS = [
  "CONNECTED_TO",
  "INTRO_DELIVERY_CREATED",
  "INTRO_DELIVERY_DELIVERED",
  "INTRO_DELIVERY_ACKNOWLEDGED",
  "INTRO_DELIVERY_DECLINED",
  "INTRO_DELIVERY_EXPIRED",
  "INTRO_OUTCOME_CREATED",
  "INTRO_OUTCOME_CONNECTED",
  "INTRO_OUTCOME_PROGRESSING",
  "INTRO_OUTCOME_CLOSED_SUCCESS",
  "INTRO_OUTCOME_CLOSED_NO_FIT",
  "INTRO_OUTCOME_CLOSED_LOST",
] as const;

// ── DTO (whitelist — contract §4) ───────────────────────────────────────────

export type BcMobileJourneyKind =
  | "connected"
  | "introduction"
  | "card_saved"
  | "moment"
  | "contact_shared" // BC-Mobile-3B — guest contact origin milestone
  | "business_card_scanned"; // BC-Mobile-4B — paper-card scan provenance (never a fake "shared")

/** BC-Mobile-2E — owner-private Moment payload. `photoUrl` is a short-TTL
 * signed URL minted per page render. `photoPath` is server-internal (used to
 * mint the signed URL) and is stripped before the RPC boundary. */
export type BcMobileJourneyMoment = {
  /** User-typed occasion name; null → UI falls back to the i18n default
   * ("Một lần gặp gỡ"). Never AI-generated. */
  title: string | null;
  placeLabel: string | null;
  note: string | null;
  photoUrl: string | null;
  photoCount: number;
  photoPath?: string | null;
};

export type BcMobileJourneyItem = {
  /** Stable within a source. Graph event id, `card_saved:<targetCardId>`,
   * `contact_shared:<guestContactId>`, or `moment:<momentId>`. */
  id: string;
  kind: BcMobileJourneyKind;
  occurredAt: string; // ISO
  provenance: { domain: "graph" | "saved_card" | "moment" | "guest_contact" };
  /** Present only when kind === "moment". Owner-private data on an
   * owner-scoped surface; never leaves the viewer's own journey. */
  moment?: BcMobileJourneyMoment;
};

export type BcMobileJourneyPage = {
  items: BcMobileJourneyItem[];
  /** Opaque composite cursor (BC-Mobile-2E: base64 { g, ge, lo, ms }). */
  nextCursor: string | null;
};

export type BcMobilePersonJourneyResult =
  | { status: "ok"; page: BcMobileJourneyPage }
  | { status: "unavailable" };

// ── Pagination ──────────────────────────────────────────────────────────────

export const JOURNEY_DEFAULT_LIMIT = 5;
export const JOURNEY_MAX_LIMIT = 20;
/** BC-Mobile-2E — bounded local (moments) window read per page. */
export const JOURNEY_LOCAL_WINDOW = 100;

export function clampJourneyLimit(limit: number | undefined): number {
  if (!limit || limit <= 0) return JOURNEY_DEFAULT_LIMIT;
  if (limit > JOURNEY_MAX_LIMIT) return JOURNEY_MAX_LIMIT;
  return Math.floor(limit);
}

// ── BC-Mobile-2E composite cursor ────────────────────────────────────────────
//
// Two-source merge pagination (graph timeline + owner moments):
//   g  — BC-4.2 graph keyset cursor (u: namespace only); null = graph done
//   ge — consumed count within the CURRENT graph page (same g re-fetches one
//        page and skips ge entries; bounded by the graph page size)
//   lo — keyset { o: occurredAt, i: moment uuid } of the last consumed moment;
//        null = no moment consumed yet
//   ms — card_saved milestone already consumed (c: namespace only)
//
// Exactness: both cursors only advance; every item appears exactly once;
// ordering is globally (occurredAt DESC, id DESC) across sources. Each page
// reads at most ONE graph page + ONE indexed moments query.

export type BcMobileJourneyMomentKeyset = { o: string; i: string };

export type BcMobileJourneyCompositeCursor = {
  g: string | null;
  ge: number;
  lo: BcMobileJourneyMomentKeyset | null;
  ms: boolean;
};

export function encodeJourneyCursor(cursor: BcMobileJourneyCompositeCursor): string {
  return btoa(JSON.stringify(cursor));
}

export function decodeJourneyCursor(raw: string): BcMobileJourneyCompositeCursor | null {
  try {
    const p = JSON.parse(atob(raw)) as Record<string, unknown>;
    if (typeof p !== "object" || p === null) return null;
    if (p.g !== null && typeof p.g !== "string") return null;
    if (!Number.isInteger(p.ge) || (p.ge as number) < 0) return null;
    if (typeof p.ms !== "boolean") return null;
    let lo: BcMobileJourneyMomentKeyset | null = null;
    if (p.lo !== null && p.lo !== undefined) {
      const l = p.lo as Record<string, unknown>;
      if (typeof l !== "object" || l === null) return null;
      if (typeof l.o !== "string" || typeof l.i !== "string") return null;
      if (Number.isNaN(Date.parse(l.o))) return null;
      lo = { o: l.o, i: l.i };
    }
    return { g: (p.g as string | null) ?? null, ge: p.ge as number, lo, ms: p.ms as boolean };
  } catch {
    return null;
  }
}

// ── Read ports (implemented by person-journey.server.ts) ────────────────────
// The composition depends on these narrow ports so it stays pure and testable.
// There is intentionally NO write port: the read model cannot register nodes,
// create edges, or emit timeline events.

export interface PersonJourneyDeps {
  /** Viewer-scoped pair state lookup (GlobalConnectionService.getState). */
  getPairState(
    targetUserId: string,
  ): Promise<{ status: string; blocked: boolean; direction: string }>;
  /** READ-ONLY node resolution. Returns null when the node was never
   *  canonically registered — the journey renders empty, never registers. */
  findPersonNodeId(userId: string): Promise<string | null>;
  /** Pair-scoped timeline page (BC-4.2 keyset read on the write service). */
  listPairTimeline(args: {
    nodeA: string;
    nodeB: string;
    eventKinds: readonly string[];
    cursor: string | null;
    limit: number;
  }): Promise<{
    items: { id: string; eventKind: string; occurredAt: string }[];
    nextCursor: string | null;
  }>;
  /** Owner-scoped saved-card edge lookup (c: authorization + savedAt). */
  findSavedCard(targetCardId: string): Promise<{ savedAt: string | null } | null>;
  /** BC-Mobile-3B — owner-scoped guest-contact lookup (g: authorization +
   * firstSharedAt). The owner-scoped read IS the authorization. */
  findGuestContact(guestContactId: string): Promise<{
    firstSharedAt: string | null;
    /** Contact origin (guest_contacts.source); the milestone kind adapts to it. */
    source: string;
  } | null>;
  /** BC-Mobile-2E — owner's OWN active moments for the resolved person,
   * keyset-paginated ((occurred_at, id) strictly older than `cursor`),
   * ordered occurred_at DESC, id DESC, bounded by `limit`. Owner-scoped by
   * construction (RLS + explicit owner filter in the server adapter). */
  listMoments(args: {
    target: ParsedPersonId;
    cursor: BcMobileJourneyMomentKeyset | null;
    limit: number;
  }): Promise<BcMobileJourneyMomentRecord[]>;
}

/** BC-Mobile-2E — moment row as the composition consumes it. `photoPath` is
 * the private storage path (server signs it into `photoUrl` after compose). */
export type BcMobileJourneyMomentRecord = {
  id: string;
  occurredAt: string;
  title: string | null;
  placeLabel: string | null;
  note: string | null;
  photoCount: number;
  photoPath: string | null;
};
