// BC-Mobile-2D — Person Journey server adapter (server-only).
// Extended by BC-Mobile-2E: owner moments read + signed photo URLs.
//
// Wires the pure composition to the CANONICAL read paths:
// - Authorization: GlobalConnectionService.getState (RLS-scoped pair state).
// - Node resolution: RelationshipGraphWriteService.findPersonNodeByExternalRef
//   (BC-RC1 sanctioned passthrough) — READ-ONLY (SELECT). registerNode is
//   never reachable from this module.
// - Timeline: RelationshipGraphWriteService.pairTimeline — this class hosts
//   the BC-4.2 keyset timeline READS (graphTimelineFn/graphPairTimelineFn use
//   the same method); only its read method is invoked here.
// - Saved card: owner-scoped saved_business_cards SELECT (RLS + explicit
//   owner_user_id filter, mirroring SavedCardRepository).
// - Moments (2E): owner-scoped business_relationship_moments SELECT, active
//   only, keyset-paginated; media batched per page. Photo paths are minted
//   into short-TTL signed URLs AFTER compose and the raw path is stripped
//   before the RPC boundary.

import type { SupabaseClient } from "@supabase/supabase-js";
import { GlobalConnectionService } from "@/lib/global-network/service";
import { RelationshipGraphWriteService } from "@/lib/graph/graph.write.service.server";
import type { PairTimelineQuery } from "@/lib/graph/timeline.types";
import { composePersonJourney } from "./person-journey.compose";
import type {
  BcMobileJourneyMomentRecord,
  BcMobilePersonJourneyResult,
} from "./person-journey.types";

const MOMENTS_TABLE = "business_relationship_moments";
const MOMENT_MEDIA_TABLE = "business_relationship_moment_media";
const MOMENT_MEDIA_BUCKET = "relationship-moments";
/** Short-TTL signed URLs, re-minted on every page render (never public). */
const SIGNED_URL_TTL_SECONDS = 3600;

export interface GetPersonJourneyInput {
  personId: string;
  cursor: string | null;
  limit?: number;
}

type RawMomentJourneyRow = {
  id: string;
  occurred_at: string;
  event_name: string | null;
  place_label: string | null;
  note: string | null;
};

type RawMomentMediaRow = {
  moment_id: string;
  storage_path: string;
  sort_order: number;
};

export async function getBcMobilePersonJourneyPage(
  sb: SupabaseClient,
  viewerUserId: string,
  input: GetPersonJourneyInput,
): Promise<BcMobilePersonJourneyResult> {
  const graphReads = new RelationshipGraphWriteService(sb, viewerUserId);

  const result = await composePersonJourney(
    {
      getPairState: (targetUserId) =>
        GlobalConnectionService.getState(sb, viewerUserId, targetUserId),
      findPersonNodeId: async (userId) =>
        (await graphReads.findPersonNodeByExternalRef(userId))?.id ?? null,
      listPairTimeline: ({ nodeA, nodeB, eventKinds, cursor, limit }) =>
        graphReads.pairTimeline({
          nodeA,
          nodeB,
          cursor,
          limit,
          eventKinds: [...eventKinds] as NonNullable<PairTimelineQuery["eventKinds"]>,
        }),
      findSavedCard: async (targetCardId) => {
        const { data, error } = await sb
          .from("saved_business_cards")
          .select("saved_at")
          .eq("owner_user_id", viewerUserId)
          .eq("target_card_id", targetCardId)
          .eq("archived", false)
          .maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) return null;
        return { savedAt: (data as { saved_at: string | null }).saved_at ?? null };
      },
      // BC-Mobile-3B — owner-scoped guest contact (RLS + explicit owner
      // filter); the read IS the g: authorization.
      findGuestContact: async (guestContactId) => {
        const { data, error } = await sb
          .from("guest_contacts")
          .select("first_shared_at, source")
          .eq("owner_user_id", viewerUserId)
          .eq("id", guestContactId)
          .maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) return null;
        const row = data as { first_shared_at: string | null; source?: string | null };
        return { firstSharedAt: row.first_shared_at ?? null, source: row.source ?? "" };
      },
      listMoments: async ({ target, cursor, limit }) => {
        let q = sb
          .from(MOMENTS_TABLE)
          .select("id, occurred_at, event_name, place_label, note")
          .eq("owner_user_id", viewerUserId)
          .eq("status", "active")
          .order("occurred_at", { ascending: false })
          .order("id", { ascending: false })
          .limit(limit);
        q =
          target.kind === "connection"
            ? q.eq("target_user_id", target.id)
            : target.kind === "guest_contact"
              ? q.eq("target_guest_id", target.id)
              : q.eq("target_card_id", target.id);
        if (cursor) {
          // Same keyset shape as the BC-4.2 graph read path.
          q = q.or(`occurred_at.lt.${cursor.o},and(occurred_at.eq.${cursor.o},id.lt.${cursor.i})`);
        }
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        const rows = (data ?? []) as unknown as RawMomentJourneyRow[];
        if (rows.length === 0) return [];

        const ids = rows.map((r: any) => r.id);
        const media = await sb
          .from(MOMENT_MEDIA_TABLE)
          .select("moment_id, storage_path, sort_order")
          .in("moment_id", ids)
          .order("sort_order", { ascending: true });
        if (media.error) throw new Error(media.error.message);
        const byMoment = new Map<string, RawMomentMediaRow[]>();
        for (const m of (media.data ?? []) as unknown as RawMomentMediaRow[]) {
          const list = byMoment.get(m.moment_id) ?? [];
          list.push(m);
          byMoment.set(m.moment_id, list);
        }

        return rows.map(
          (r): BcMobileJourneyMomentRecord => ({
            id: r.id,
            occurredAt: r.occurred_at,
            title: r.event_name,
            placeLabel: r.place_label,
            note: r.note,
            photoCount: byMoment.get(r.id)?.length ?? 0,
            photoPath: byMoment.get(r.id)?.[0]?.storage_path ?? null,
          }),
        );
      },
    },
    {
      viewerUserId,
      personId: input.personId,
      cursor: input.cursor,
      limit: input.limit,
    },
  );

  // Mint short-TTL signed URLs for moment photos, then strip the private
  // storage paths so they never cross the RPC boundary.
  if (result.status !== "ok") return result;
  const paths = result.page.items
    .map((i) => i.moment?.photoPath)
    .filter((p): p is string => typeof p === "string" && p.length > 0);

  const signed = new Map<string, string>();
  if (paths.length > 0) {
    const { data, error } = await sb.storage
      .from(MOMENT_MEDIA_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
    if (error) throw new Error(error.message);
    for (const entry of data ?? []) {
      if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
    }
  }

  for (const item of result.page.items) {
    if (!item.moment) continue;
    const path = item.moment.photoPath ?? null;
    item.moment.photoUrl = path ? (signed.get(path) ?? null) : null;
    delete item.moment.photoPath;
  }

  return result;
}
