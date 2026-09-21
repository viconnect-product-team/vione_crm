import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "@/lib/api-client";
import { relTime } from "./shared";

export type MyConversation = {
  peerCode: string;
  name: string;
  last: string;
  time: string;
  rawTime?: string;
  unread: number;
  avatarUrl?: string | null;
  isSystem?: boolean;
  isOnline?: boolean;
  userId?: string | null;
  isConnected?: boolean;
  connectionStatus?: string;
  isPending?: boolean;
  isOutgoingPending?: boolean;
  isIncomingPending?: boolean;
  isStranger?: boolean;
  connectionId?: string | null;
  isGroup?: boolean;
  memberCount?: number;
  members?: { id?: string; name: string; avatarUrl?: string | null; code?: string; role?: string }[];
  groupAvatar?: string | null;
};

export type ChatMessage = {
  id: string;
  text: string;
  mine: boolean;
  time: string;
  createdAt: string;
  seen: boolean;
  retracted?: boolean;
  reactions?: { emoji: string; count?: number }[];
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
};

// ---------- Messaging ----------
export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }: any): Promise<MyConversation[]> => {
    try {
      const token = context?.token;
      const items = await fetchNestApiFromServer<any[]>("/dm/member/conversations", token);
      return (items ?? []).map((c: any) => ({
        peerCode: c.peerCode,
        name: c.name,
        last: c.last,
        time: relTime(c.time),
        rawTime: c.rawTime || c.time || new Date().toISOString(),
        unread: c.unread ?? 0,
        avatarUrl: c.avatarUrl ?? null,
        isSystem: Boolean(c.isSystem),
        isOnline: Boolean(c.isOnline),
        userId: c.userId ?? null,
        isConnected: Boolean(c.isConnected),
        connectionStatus: c.connectionStatus || (c.isSystem ? "accepted" : "none"),
        isPending: Boolean(c.isPending),
        isOutgoingPending: Boolean(c.isOutgoingPending),
        isIncomingPending: Boolean(c.isIncomingPending),
        isStranger: Boolean(c.isStranger),
        connectionId: c.connectionId ?? null,
      }));
    } catch {
      return [];
    }
  });

export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({ peerCode: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/) }).parse(d),
  )
  .handler(async ({ data, context }: any): Promise<{ peerName: string; avatarUrl?: string | null; isSystem?: boolean; messages: ChatMessage[] }> => {
    try {
      const token = context?.token;
      const res = await fetchNestApiFromServer<{ peerName: string; avatarUrl?: string; isSystem?: boolean; messages: any[] }>(
        "/dm/member/messages?peerCode=" + encodeURIComponent(data.peerCode),
        token,
      );
      return {
        peerName: res?.peerName ?? data.peerCode.toUpperCase(),
        avatarUrl: res?.avatarUrl ?? null,
        isSystem: Boolean(res?.isSystem),
        messages: (res?.messages ?? []).map((m: any) => ({
          id: m.id,
          text: m.text,
          mine: Boolean(m.mine),
          time: relTime(m.time || m.createdAt),
          createdAt: m.createdAt,
          seen: Boolean(m.seen),
          retracted: m.text === "[retracted]" || Boolean(m.retracted || m.isRetracted),
        })),
      };
    } catch {
      return { peerName: data.peerCode.toUpperCase(), avatarUrl: null, isSystem: false, messages: [] };
    }
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ peerCode: z.string().min(1).max(64), text: z.string().trim().min(1).max(2000) })
      .parse(d),
  )
  .handler(async ({ data, context }: any): Promise<{ ok: boolean }> => {
    const token = context?.token;
    return fetchNestApiFromServer<{ ok: boolean }>("/dm/member/messages", token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

export const retractMemberMessage = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({ messageId: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data, context }: any): Promise<{ ok: boolean }> => {
    const token = context?.token;
    return fetchNestApiFromServer<{ ok: boolean }>(
      `/dm/member/messages/${encodeURIComponent(data.messageId)}`,
      token,
      { method: "DELETE" }
    );
  });

export const requestMemberConnectionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({ targetUserId: z.string().uuid(), message: z.string().optional() }).parse(d),
  )
  .handler(async ({ data, context }: any): Promise<any> => {
    const token = context?.token;
    return fetchNestApiFromServer<any>("/network/requests", token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

export const respondMemberConnectionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({ connectionId: z.string().uuid(), action: z.enum(["accept", "decline"]) }).parse(d),
  )
  .handler(async ({ data, context }: any): Promise<any> => {
    const token = context?.token;
    return fetchNestApiFromServer<any>(`/network/connections/${data.connectionId}`, token, {
      method: "PATCH",
      body: JSON.stringify({ status: data.action === "accept" ? "accepted" : "declined" }),
    });
  });

export const disconnectMemberConnectionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({ connectionId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }: any): Promise<any> => {
    const token = context?.token;
    return fetchNestApiFromServer<any>(`/network/connections/${data.connectionId}`, token, {
      method: "DELETE",
    });
  });

