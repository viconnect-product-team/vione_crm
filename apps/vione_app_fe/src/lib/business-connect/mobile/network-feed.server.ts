// BC-Mobile-7E — Network feed server adapter (server-only).
//
// Reads ONLY the canonical Moment domain (business_relationship_moments +
// business_relationship_moment_media) scoped to the caller. No parallel feed
// table, no social graph fan-out: the viewer sees their own meeting moments.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BC_NETWORK_FEED_PAGE_SIZE,
  type BcNetworkFeedItem,
  type BcNetworkFeedPage,
} from "./network-feed.types";

const MOMENTS_TABLE = "business_relationship_moments";
const MEDIA_TABLE = "business_relationship_moment_media";
const MOMENT_MEDIA_BUCKET = "relationship-moments";
const MAX_PHOTOS = 5;

type Row = {
  id: string;
  target_kind: "connection" | "saved_card" | "guest_contact";
  target_user_id: string | null;
  target_card_id: string | null;
  target_guest_id: string | null;
  occurred_at: string;
  event_name: string | null;
  place_label: string | null;
  note: string | null;
};

function personIdOf(row: Row): string | null {
  if (row.target_kind === "connection" && row.target_user_id) return `u:${row.target_user_id}`;
  if (row.target_kind === "saved_card" && row.target_card_id) return `c:${row.target_card_id}`;
  if (row.target_kind === "guest_contact" && row.target_guest_id) return `g:${row.target_guest_id}`;
  return null;
}

export async function listNetworkFeedPage(
  sb: SupabaseClient,
  args: { viewerId: string; cursor: string | null; limit?: number },
): Promise<BcNetworkFeedPage> {
  const limit = Math.min(Math.max(args.limit ?? BC_NETWORK_FEED_PAGE_SIZE, 1), 30);

  let query = sb
    .from(MOMENTS_TABLE)
    .select(
      "id, target_kind, target_user_id, target_card_id, target_guest_id, occurred_at, event_name, place_label, note",
    )
    .eq("owner_user_id", args.viewerId)
    .eq("status", "active")
    .order("occurred_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (args.cursor) query = query.lt("occurred_at", args.cursor);

  const { data, error } = await query;
  if (error || !data) return { items: [], nextCursor: null };

  const rows = data as unknown as Row[];
  const page = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? (page[page.length - 1]?.occurred_at ?? null) : null;
  if (page.length === 0) return { items: [], nextCursor: null };

  // Ảnh: đọc theo lô, ký URL ngắn hạn (bucket riêng tư).
  const media = await sb
    .from(MEDIA_TABLE)
    .select("moment_id, storage_path, sort_order")
    .eq("owner_user_id", args.viewerId)
    .in(
      "moment_id",
      page.map((r: any) => r.id),
    )
    .order("sort_order", { ascending: true });

  const pathsByMoment = new Map<string, string[]>();
  for (const m of (media.data ?? []) as unknown as {
    moment_id: string;
    storage_path: string;
  }[]) {
    const list = pathsByMoment.get(m.moment_id) ?? [];
    if (list.length < MAX_PHOTOS) list.push(m.storage_path);
    pathsByMoment.set(m.moment_id, list);
  }

  const allPaths = [...pathsByMoment.values()].flat();
  const signed = new Map<string, string>();
  if (allPaths.length > 0) {
    const res = await sb.storage.from(MOMENT_MEDIA_BUCKET).createSignedUrls(allPaths, 600);
    for (const entry of res.data ?? []) {
      if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
    }
  }

  const items: BcNetworkFeedItem[] = [];
  for (const row of page) {
    const personId = personIdOf(row);
    if (!personId) continue;
    const paths = pathsByMoment.get(row.id) ?? [];
    items.push({
      momentId: row.id,
      personId,
      occurredAt: row.occurred_at,
      eventName: row.event_name,
      placeLabel: row.place_label,
      note: row.note,
      photoUrls: paths.map((p) => signed.get(p)).filter((u): u is string => Boolean(u)),
      photoCount: paths.length,
    });
  }

  return { items, nextCursor };
}
