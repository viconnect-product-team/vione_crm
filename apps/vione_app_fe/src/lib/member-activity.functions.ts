import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { resolveMemberIdOrNull } from "./current-member";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

export type InteractionType = "connect" | "message" | "quote" | "meeting" | "event";

export type Interaction = {
  id: string;
  type: InteractionType;
  at: string;
  title: string;
  detail?: string;
};

type Row = Record<string, unknown>;

/**
 * Real interaction history between the signed-in member and the member being
 * viewed, aggregated from actual records (connections, messages, quote
 * requests). RLS scopes every read to rows the current user may see.
 */
export type InteractionStats = {
  all: number;
  week: number;
  month: number;
  byType: Record<InteractionType, number>;
};

export type InteractionPage = {
  items: Interaction[];
  total: number;
  hasMore: boolean;
  stats: InteractionStats;
};

export const listInteractionsWithFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        peerId: z.string().min(1).max(128),
        type: z.enum(["all", "connect", "message", "quote", "meeting", "event"]).default("all"),
        offset: z.number().int().min(0).default(0),
        limit: z.number().int().min(1).max(50).default(10),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<InteractionPage> => {
    const me = await resolveMemberIdOrNull((context as any)?.token);
    const peer = data.peerId;
    const emptyStats: InteractionStats = {
      all: 0,
      week: 0,
      month: 0,
      byType: { connect: 0, message: 0, quote: 0, meeting: 0, event: 0 },
    };
    // No linked member profile → no interaction history to show.
    if (!me || peer === me) return { items: [], total: 0, hasMore: false, stats: emptyStats };

    const out: Interaction[] = [];

    // Run the three reads concurrently — they are independent, so parallelism
    // cuts total latency to the slowest single query instead of their sum.
    const [connRes, msgRes, quoteRes] = await Promise.all([
      // 1) Connection state (single row owned by me toward the peer).
      getDb(context)
        .from("connections")
        .select("status, updated_at, created_at")
        .eq("owner_id", me)
        .eq("peer_id", peer)
        .maybeSingle(),
      // 2) Direct messages exchanged either direction (only needed fields).
      getDb(context)
        .from("messages")
        .select("id, from_id, to_id, text, created_at")
        .or(`and(from_id.eq.${me},to_id.eq.${peer}),and(from_id.eq.${peer},to_id.eq.${me})`)
        .order("created_at", { ascending: false })
        .limit(50),
      // 3) Quote requests between the two members (either as buyer or seller).
      // Narrow at the DB: only rows where me or peer is the buyer. The seller
      // side is checked in JS via the joined product (PostgREST can't filter on
      // an embedded column cheaply). This avoids scanning every quote globally.
      getDb(context)
        .from("quote_requests")
        .select("id, buyer_id, status, created_at, products(seller_id, title)")
        .in("buyer_id", [me, peer])
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const conn = connRes.data;
    if (conn) {
      const c = conn as Row;
      const status = (c.status as string) ?? "";
      const connected = status === "connected";
      out.push({
        id: `conn-${peer}`,
        type: "connect",
        at: (c.updated_at as string) ?? (c.created_at as string),
        title: connected ? "Đã kết nối trong mạng lưới hội viên" : "Lời mời kết nối",
        detail: connected ? undefined : "Đang chờ phản hồi kết nối.",
      });
    }

    for (const m of (msgRes.data ?? []) as Row[]) {
      const outgoing = (m.from_id as string) === me;
      out.push({
        id: `msg-${m.id as string}`,
        type: "message",
        at: m.created_at as string,
        title: outgoing ? "Bạn đã gửi tin nhắn" : "Đã nhận tin nhắn",
        detail: (m.text as string) ?? undefined,
      });
    }

    for (const q of (quoteRes.data ?? []) as Row[]) {
      const buyer = q.buyer_id as string;
      const seller = ((q.products as Row | null)?.seller_id as string) ?? "";
      const between = (buyer === me && seller === peer) || (buyer === peer && seller === me);
      if (!between) continue;
      const iAmBuyer = buyer === me;
      const productTitle = ((q.products as Row | null)?.title as string) ?? "";
      out.push({
        id: `quote-${q.id as string}`,
        type: "quote",
        at: q.created_at as string,
        title: iAmBuyer ? "Bạn gửi yêu cầu báo giá" : "Nhận yêu cầu báo giá",
        detail: productTitle || undefined,
      });
    }

    out.sort((a, b) => b.at.localeCompare(a.at));

    const nowMs = Date.now();
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
    const stats: InteractionStats = {
      all: out.length,
      week: 0,
      month: 0,
      byType: { connect: 0, message: 0, quote: 0, meeting: 0, event: 0 },
    };
    for (const i of out) {
      stats.byType[i.type] += 1;
      const at = new Date(i.at).getTime();
      if (!Number.isNaN(at)) {
        if (nowMs - at <= WEEK_MS) stats.week += 1;
        if (nowMs - at <= MONTH_MS) stats.month += 1;
      }
    }

    const filtered = data.type === "all" ? out : out.filter((i) => i.type === data.type);
    const items = filtered.slice(data.offset, data.offset + data.limit);
    return {
      items,
      total: filtered.length,
      hasMore: data.offset + items.length < filtered.length,
      stats,
    };
  });
