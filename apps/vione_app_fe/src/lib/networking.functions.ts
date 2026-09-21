/**
 * networking.functions.ts
 * Server functions cho mạng lưới kết nối — chỉ dùng NestJS REST API, không dùng Supabase.
 *
 * Mapping:
 *   getNetworkStateFn   → GET /api/network/connections  +  GET /api/dm/threads
 *   sendRequestFn       → POST /api/network/requests
 *   acceptRequestFn     → PATCH /api/network/connections/:id  { status: "accepted" }
 *   declineRequestFn    → PATCH /api/network/connections/:id  { status: "declined" }
 *   removeConnectionFn  → DELETE /api/network/connections/:id
 *   sendMessageFn       → POST /api/dm/threads  +  POST /api/dm/threads/:id/messages
 *   markThreadReadFn    → POST /api/dm/threads/:id/read
 *   deleteMessageFn     → DELETE /api/dm/messages/:id
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ChatMessage, ConnectionStatus } from "./networking-data";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "./api-client";

// ── Schemas ────────────────────────────────────────────────────────────────────

const PeerSchema = z.object({ peerId: z.string().min(1).max(128) });
const IdSchema = z.object({ id: z.string().min(1).max(128) });

// ── Row mappers ────────────────────────────────────────────────────────────────

type Row = Record<string, unknown>;

function mapConnection(r: Row): { peerId: string; status: ConnectionStatus; updatedAt: string } {
  return {
    peerId: (r.peer_id ?? r.peerId ?? r.counterpart_user_id ?? r.id) as string,
    status: (r.status as ConnectionStatus) ?? "none",
    updatedAt: ((r.updated_at ?? r.updatedAt ?? r.created_at ?? "") as string),
  };
}

function mapMessage(r: Row): ChatMessage {
  // DM thread message format from NestJS
  const body = (r.body ?? r.text ?? "") as string;
  return {
    id: r.id as string,
    fromId: (r.sender_id ?? r.from_id ?? r.senderId ?? "") as string,
    toId: (r.recipient_id ?? r.to_id ?? r.recipientId ?? "") as string,
    text: body,
    at: (r.created_at ?? r.createdAt ?? "") as string,
    readAt: (r.read_at ?? r.readAt ?? null) as string | null,
  };
}

// ── getNetworkStateFn ──────────────────────────────────────────────────────────

/**
 * Trả về trạng thái mạng lưới của user hiện tại:
 * - currentMemberId: ID member của user
 * - statuses: { [peerId]: ConnectionStatus }
 * - timestamps: { [peerId]: string }
 * - messages: ChatMessage[]
 */
export const getNetworkStateFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(
    async ({ context }): Promise<{
      currentMemberId: string | null;
      statuses: Record<string, ConnectionStatus>;
      timestamps: Record<string, string>;
      messages: ChatMessage[];
    }> => {
      // Gọi song song: connections + DM threads
      const [connsRaw, threadsRaw, meRaw] = await Promise.allSettled([
        fetchNestApiFromServer("/network/connections", context.token),
        fetchNestApiFromServer("/dm/threads", context.token),
        fetchNestApiFromServer("/members/me", context.token),
      ]);

      // Resolve member ID từ /members/me
      let currentMemberId: string | null = null;
      if (meRaw.status === "fulfilled" && meRaw.value) {
        const me = meRaw.value as Row;
        currentMemberId = (me.id ?? me.member_id ?? null) as string | null;
      }

      // Build statuses + timestamps từ connections
      const statuses: Record<string, ConnectionStatus> = {};
      const timestamps: Record<string, string> = {};
      if (connsRaw.status === "fulfilled") {
        const list = Array.isArray(connsRaw.value) ? connsRaw.value : [];
        for (const r of list) {
          const conn = mapConnection(r as Row);
          if (!conn.peerId) continue;
          statuses[conn.peerId] = conn.status;
          timestamps[conn.peerId] = conn.updatedAt;
        }
      }

      // Build messages từ DM threads (flatten tất cả messages)
      const messages: ChatMessage[] = [];
      if (threadsRaw.status === "fulfilled") {
        const threads = Array.isArray(threadsRaw.value) ? threadsRaw.value : [];
        for (const thread of threads) {
          const t = thread as Row;
          const threadMsgs = (t.messages ?? t.last_messages ?? []) as Row[];
          for (const m of threadMsgs) {
            messages.push(mapMessage(m));
          }
        }
      }

      return { currentMemberId, statuses, timestamps, messages };
    },
  );

// ── Connection actions ─────────────────────────────────────────────────────────

/** Gửi lời mời kết nối tới peerId */
export const sendRequestFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => PeerSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    await fetchNestApiFromServer("/network/requests", context.token, {
      method: "POST",
      body: JSON.stringify({ targetUserId: data.peerId }),
    });
    return { ok: true };
  });

/** Chấp nhận lời mời kết nối từ peerId */
export const acceptRequestFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => PeerSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    await fetchNestApiFromServer(`/network/connections/${encodeURIComponent(data.peerId)}`, context.token, {
      method: "PATCH",
      body: JSON.stringify({ status: "accepted" }),
    });
    return { ok: true };
  });

/** Từ chối lời mời kết nối từ peerId */
export const declineRequestFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => PeerSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    await fetchNestApiFromServer(`/network/connections/${encodeURIComponent(data.peerId)}`, context.token, {
      method: "PATCH",
      body: JSON.stringify({ status: "declined" }),
    });
    return { ok: true };
  });

/** Huỷ / xoá kết nối với peerId */
export const removeConnectionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => PeerSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    await fetchNestApiFromServer(`/network/connections/${encodeURIComponent(data.peerId)}`, context.token, {
      method: "DELETE",
    });
    return { ok: true };
  });

// ── Message actions ────────────────────────────────────────────────────────────

/** Gửi tin nhắn tới toId — tự mở DM thread nếu chưa có */
export const sendMessageFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({
      toId: z.string().min(1).max(128),
      text: z.string().min(1).max(4000),
    }).parse(d)
  )
  .handler(async ({ data, context }): Promise<ChatMessage> => {
    // 1. Mở (hoặc lấy lại) DM thread
    const thread = await fetchNestApiFromServer("/dm/threads", context.token, {
      method: "POST",
      body: JSON.stringify({ counterpartUserId: data.toId }),
    }) as Row;

    const threadId = (thread.id ?? thread.thread_id) as string;

    // 2. Gửi tin nhắn vào thread
    const clientToken = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const msg = await fetchNestApiFromServer(
      `/dm/threads/${encodeURIComponent(threadId)}/messages`,
      context.token,
      {
        method: "POST",
        body: JSON.stringify({ body: data.text.trim(), clientToken }),
      },
    ) as Row;

    return mapMessage(msg);
  });

/** Đánh dấu toàn bộ tin nhắn trong thread với peerId là đã đọc */
export const markThreadReadFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => PeerSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    // Mở thread để lấy threadId
    const thread = await fetchNestApiFromServer("/dm/threads", context.token, {
      method: "POST",
      body: JSON.stringify({ counterpartUserId: data.peerId }),
    }) as Row;

    const threadId = (thread.id ?? thread.thread_id) as string;

    await fetchNestApiFromServer(`/dm/threads/${encodeURIComponent(threadId)}/read`, context.token, {
      method: "POST",
    });
    return { ok: true };
  });

/** Xoá tin nhắn theo ID (chỉ được xoá tin của chính mình) */
export const deleteMessageFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => IdSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    await fetchNestApiFromServer(`/dm/messages/${encodeURIComponent(data.id)}`, context.token, {
      method: "DELETE",
    });
    return { ok: true };
  });
