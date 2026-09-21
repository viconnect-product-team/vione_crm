// BC-Mobile-2D — Person Journey composition (pure, framework-free).
// Extended by BC-Mobile-2E: two-source merge with owner Moments.
//
// Contract: docs/business-connect/mobile/BC_MOBILE_2D_TIMELINE_DATA_CONTRACT.md
//           docs/business-connect/mobile/BC_MOBILE_2E_MOMENT_ARCHITECTURE.md §8
//
// Authorization-first, read-only composition of the person journey:
//
//   u:<userId>  → pair state must be accepted (fail-closed otherwise) →
//                 read-only node resolution (null ⇒ no graph milestones, NEVER
//                 a registerNode write) → canonical pair-scoped timeline read,
//                 merged with the viewer's OWN active moments for this person.
//   c:<cardId>  → owner-scoped saved-card edge IS the authorization →
//                 one truthful "card_saved" milestone + the viewer's OWN
//                 active moments for this card.
//
// Merge semantics (BC-Mobile-2E §8): exact global (occurredAt DESC, id DESC)
// ordering across sources via the composite cursor { g, ge, lo, ms }; every
// item appears exactly once; each page reads at most ONE graph page and ONE
// indexed moments query. No fabrication, no write-on-read.

import {
  JOURNEY_EVENT_KINDS,
  JOURNEY_LOCAL_WINDOW,
  clampJourneyLimit,
  decodeJourneyCursor,
  encodeJourneyCursor,
  parseBcMobilePersonId,
  type BcMobileJourneyCompositeCursor,
  type BcMobileJourneyItem,
  type BcMobileJourneyKind,
  type BcMobileJourneyMomentKeyset,
  type BcMobileJourneyMomentRecord,
  type BcMobilePersonJourneyResult,
  type PersonJourneyDeps,
} from "./person-journey.types";

const UNAVAILABLE: BcMobilePersonJourneyResult = { status: "unavailable" };

const KIND_BY_EVENT: Readonly<Record<string, BcMobileJourneyKind>> = Object.fromEntries(
  JOURNEY_EVENT_KINDS.map((k) => [k, k === "CONNECTED_TO" ? "connected" : "introduction"]),
) as Record<string, BcMobileJourneyKind>;

export interface ComposePersonJourneyInput {
  viewerUserId: string;
  personId: string;
  cursor: string | null;
  limit?: number;
}

/** Local (non-graph) entry: a moment or the card_saved milestone. */
type LocalEntry = {
  item: BcMobileJourneyItem;
  /** Raw moment uuid for keyset advancement; null for the milestone. */
  momentId: string | null;
};

/** (occurredAt DESC, id DESC) — mirrors the canonical SQL ordering. */
function compareDesc(a: { occurredAt: string; id: string }, b: { occurredAt: string; id: string }) {
  if (a.occurredAt !== b.occurredAt) return a.occurredAt < b.occurredAt ? 1 : -1;
  if (a.id !== b.id) return a.id < b.id ? 1 : -1;
  return 0;
}

function toMomentItem(m: BcMobileJourneyMomentRecord): LocalEntry {
  return {
    item: {
      id: `moment:${m.id}`,
      kind: "moment",
      occurredAt: m.occurredAt,
      provenance: { domain: "moment" },
      moment: {
        title: m.title,
        placeLabel: m.placeLabel,
        note: m.note,
        photoUrl: null, // signed by the server adapter after compose
        photoCount: m.photoCount,
        photoPath: m.photoPath,
      },
    },
    momentId: m.id,
  };
}

export async function composePersonJourney(
  deps: PersonJourneyDeps,
  input: ComposePersonJourneyInput,
): Promise<BcMobilePersonJourneyResult> {
  const parsed = parseBcMobilePersonId(input.personId);
  if (!parsed) return UNAVAILABLE;
  const limit = clampJourneyLimit(input.limit);

  let composite: BcMobileJourneyCompositeCursor | null = null;
  if (input.cursor) {
    composite = decodeJourneyCursor(input.cursor);
    if (!composite) throw new Error("INVALID_CURSOR");
  }

  // ── Authorization (every page, fail-closed) ───────────────────────────────
  let milestoneSavedAt: string | null = null;
  let milestoneSharedAt: string | null = null; // BC-Mobile-3B guest origin
  // BC-Mobile-4B — contact origin decides the milestone kind: a paper-card
  // scan is provenance ("Card scanned"), never a fabricated "Shared contact".
  let milestoneGuestScanned = false;
  let graphNodePair: { nodeA: string; nodeB: string } | null = null;

  if (parsed.kind === "saved_card") {
    const row = await deps.findSavedCard(parsed.id);
    if (!row) return UNAVAILABLE;
    milestoneSavedAt = row.savedAt;
  } else if (parsed.kind === "guest_contact") {
    // BC-Mobile-3B — the owner-scoped guest_contacts read IS the
    // authorization; no graph milestones exist for guests.
    const row = await deps.findGuestContact(parsed.id);
    if (!row) return UNAVAILABLE;
    milestoneSharedAt = row.firstSharedAt;
    milestoneGuestScanned = row.source === "business_card_scan";
  } else {
    const state = await deps.getPairState(parsed.id);
    if (state.status !== "accepted" || state.blocked || state.direction === "self") {
      return UNAVAILABLE;
    }
    const [viewerNodeId, targetNodeId] = await Promise.all([
      deps.findPersonNodeId(input.viewerUserId),
      deps.findPersonNodeId(parsed.id),
    ]);
    // Read-only resolution: missing nodes mean no canonical graph milestones
    // exist yet. Moments are still merged — they do not depend on the graph.
    if (viewerNodeId && targetNodeId) {
      graphNodePair = { nodeA: viewerNodeId, nodeB: targetNodeId };
    }
  }

  // ── Graph source (u: only; skipped when the graph is done) ────────────────
  let graphItems: BcMobileJourneyItem[] = [];
  let graphNextCursor: string | null = null;
  const graphFetchable = graphNodePair !== null && (composite === null || composite.g !== null);
  const geBase = composite?.ge ?? 0;

  if (graphFetchable && graphNodePair) {
    const page = await deps.listPairTimeline({
      nodeA: graphNodePair.nodeA,
      nodeB: graphNodePair.nodeB,
      eventKinds: JOURNEY_EVENT_KINDS,
      cursor: composite?.g ?? null,
      limit,
    });
    graphNextCursor = page.nextCursor ?? null;
    graphItems = page.items
      .slice(geBase) // skip entries already emitted from THIS page
      .flatMap((e) => {
        const kind = KIND_BY_EVENT[e.eventKind];
        return kind
          ? [
              {
                id: e.id,
                kind,
                occurredAt: e.occurredAt,
                provenance: { domain: "graph" as const },
              },
            ]
          : [];
      });
  }

  // ── Local source: moments (keyset) + first-page milestone ─────────────────
  const loBase: BcMobileJourneyMomentKeyset | null = composite?.lo ?? null;
  const milestonePending =
    ((parsed.kind === "saved_card" && milestoneSavedAt !== null) ||
      (parsed.kind === "guest_contact" && milestoneSharedAt !== null)) &&
    !(composite?.ms ?? false);

  const moments = await deps.listMoments({
    target: parsed,
    cursor: loBase,
    limit: JOURNEY_LOCAL_WINDOW,
  });

  const local: LocalEntry[] = moments.map(toMomentItem);
  if (milestonePending) {
    // BC-Mobile-3B — guests get the truthful origin milestone instead.
    // BC-Mobile-4B — scanned paper cards get a provenance milestone, not a
    // fabricated "Shared contact" (scans carry no guest consent).
    const milestone: LocalEntry =
      parsed.kind === "guest_contact"
        ? {
            item: milestoneGuestScanned
              ? {
                  id: `business_card_scanned:${parsed.id}`,
                  kind: "business_card_scanned",
                  occurredAt: milestoneSharedAt!,
                  provenance: { domain: "guest_contact" },
                }
              : {
                  id: `contact_shared:${parsed.id}`,
                  kind: "contact_shared",
                  occurredAt: milestoneSharedAt!,
                  provenance: { domain: "guest_contact" },
                },
            momentId: null,
          }
        : {
            item: {
              id: `card_saved:${parsed.id}`,
              kind: "card_saved",
              occurredAt: milestoneSavedAt!,
              provenance: { domain: "saved_card" },
            },
            momentId: null,
          };
    local.push(milestone);
  }
  local.sort((a, b) => compareDesc(a.item, b.item));

  // ── Merge (exact global ordering, bounded output) ─────────────────────────
  const items: BcMobileJourneyItem[] = [];
  let gi = 0;
  let li = 0;
  let milestoneConsumed = false;
  let lastMomentKeyset: BcMobileJourneyMomentKeyset | null = null;

  while (items.length < limit && (gi < graphItems.length || li < local.length)) {
    const g = gi < graphItems.length ? graphItems[gi] : null;
    const l = li < local.length ? local[li] : null;
    if (g && (!l || compareDesc(g, l.item) <= 0)) {
      items.push(g);
      gi += 1;
    } else if (l) {
      items.push(l.item);
      li += 1;
      if (l.momentId) {
        lastMomentKeyset = { o: l.item.occurredAt, i: l.momentId };
      } else {
        milestoneConsumed = true;
      }
    }
  }

  // ── Next composite cursor ─────────────────────────────────────────────────
  const graphPageDone = gi >= graphItems.length;
  const localDone = li >= local.length;
  const nextLo = lastMomentKeyset ?? loBase;
  const nextMs = (composite?.ms ?? false) || milestoneConsumed;
  // A full local window may have older moments beyond it — keep paginating.
  const momentsMayRemain = localDone && moments.length >= JOURNEY_LOCAL_WINDOW;

  let next: BcMobileJourneyCompositeCursor | null = null;
  if (!graphPageDone) {
    // Same graph page continues; lo advances only via consumed moments.
    next = { g: composite?.g ?? null, ge: geBase + gi, lo: nextLo, ms: nextMs };
  } else if (graphFetchable && graphNextCursor) {
    next = { g: graphNextCursor, ge: 0, lo: nextLo, ms: nextMs };
  } else if (!localDone || momentsMayRemain) {
    next = { g: null, ge: 0, lo: nextLo, ms: nextMs };
  }

  return {
    status: "ok",
    page: { items, nextCursor: next ? encodeJourneyCursor(next) : null },
  };
}
