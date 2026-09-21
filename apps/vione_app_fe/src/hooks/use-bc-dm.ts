// BC-Mobile-8A — Hooks hộp thư nội bộ với Real-time WebSocket Sync.
// Khoá cache luôn gắn với người xem hiện tại (viewer isolation).
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  bcDmMarkReadFn,
  bcDmOpenThreadFn,
  bcDmReactFn,
  bcDmRetractFn,
  bcDmSendFn,
  bcDmThreadFn,
  bcDmThreadsFn,
} from "@/lib/business-connect/mobile/dm.functions";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import { useConnectAppSocket } from "@/hooks/use-connect-app-socket";

export const bcDmKeys = {
  root: ["bc-dm"] as const,
  threads: (viewerKey: string) => ["bc-dm", viewerKey, "threads"] as const,
  thread: (viewerKey: string, threadId: string) => ["bc-dm", viewerKey, "thread", threadId] as const,
};

function useViewerKey(): string {
  return useViewerUserId() ?? "anon";
}

export function useDmThreads(enabled = true) {
  const viewerKey = useViewerKey();
  const qc = useQueryClient();
  const fn = useServerFn(bcDmThreadsFn);
  const socket = useConnectAppSocket(viewerKey !== "anon" ? `user:${viewerKey}` : undefined);

  useEffect(() => {
    if (!socket || viewerKey === "anon") return;

    const handleThreadUpdated = () => {
      void qc.invalidateQueries({ queryKey: bcDmKeys.threads(viewerKey) });
    };

    const handlePresenceChanged = () => {
      void qc.invalidateQueries({ queryKey: bcDmKeys.threads(viewerKey) });
    };

    socket.on("dm:thread_updated", handleThreadUpdated);
    socket.on("dm:message_received", handleThreadUpdated);
    socket.on("presence:user_online", handlePresenceChanged);
    socket.on("presence:user_offline", handlePresenceChanged);

    return () => {
      socket.off("dm:thread_updated", handleThreadUpdated);
      socket.off("dm:message_received", handleThreadUpdated);
      socket.off("presence:user_online", handlePresenceChanged);
      socket.off("presence:user_offline", handlePresenceChanged);
    };
  }, [socket, viewerKey, qc]);

  return useQuery({
    queryKey: bcDmKeys.threads(viewerKey),
    queryFn: () => fn({ data: undefined as never }),
    enabled,
    staleTime: 10_000,
  });
}

export function useUnreadDmCount(): number {
  const query = useDmThreads();
  const threads = query.data?.ok ? query.data.threads : [];
  // CHỈ tính tin nhắn của người ĐÃ KẾT NỐI y hệt Messenger (tin nhắn chờ không tính vào badge thông báo)
  return threads
    .filter((t) => t.isConnected !== false)
    .reduce((acc, t) => acc + (t.unreadCount || 0), 0);
}

export function useDmThread(threadId: string | null) {
  const viewerKey = useViewerKey();
  const qc = useQueryClient();
  const fn = useServerFn(bcDmThreadFn);
  const socket = useConnectAppSocket(threadId ? `thread:${threadId}` : undefined);

  useEffect(() => {
    if (!socket || !threadId) return;

    const handleMessageReceived = (data: { threadId: string; message: any }) => {
      if (data.threadId !== threadId) return;
      void qc.invalidateQueries({ queryKey: bcDmKeys.thread(viewerKey, threadId) });
      void qc.invalidateQueries({ queryKey: bcDmKeys.threads(viewerKey) });
    };

    const handleMessageRetracted = (data: { threadId: string; messageId: string }) => {
      if (data.threadId !== threadId) return;
      void qc.invalidateQueries({ queryKey: bcDmKeys.thread(viewerKey, threadId) });
    };

    const handleReactionUpdated = (data: { threadId: string; messageId: string; reactions: any[] }) => {
      if (data.threadId !== threadId) return;
      void qc.invalidateQueries({ queryKey: bcDmKeys.thread(viewerKey, threadId) });
    };

    const handleReadReceipt = (data: { threadId: string }) => {
      if (data.threadId !== threadId) return;
      void qc.invalidateQueries({ queryKey: bcDmKeys.thread(viewerKey, threadId) });
    };

    const handlePresenceChanged = () => {
      void qc.invalidateQueries({ queryKey: bcDmKeys.thread(viewerKey, threadId) });
    };

    socket.on("dm:message_received", handleMessageReceived);
    socket.on("dm:message_retracted", handleMessageRetracted);
    socket.on("dm:reaction_updated", handleReactionUpdated);
    socket.on("dm:read_receipt", handleReadReceipt);
    socket.on("presence:user_online", handlePresenceChanged);
    socket.on("presence:user_offline", handlePresenceChanged);

    return () => {
      socket.off("dm:message_received", handleMessageReceived);
      socket.off("dm:message_retracted", handleMessageRetracted);
      socket.off("dm:reaction_updated", handleReactionUpdated);
      socket.off("dm:read_receipt", handleReadReceipt);
      socket.off("presence:user_online", handlePresenceChanged);
      socket.off("presence:user_offline", handlePresenceChanged);
    };
  }, [socket, threadId, viewerKey, qc]);

  return useQuery({
    queryKey: bcDmKeys.thread(viewerKey, threadId ?? "none"),
    queryFn: () => fn({ data: { threadId: threadId as string, limit: 50 } }),
    enabled: Boolean(threadId),
    staleTime: 5_000,
  });
}

export function useDmSend(threadId: string) {
  const viewerKey = useViewerKey();
  const qc = useQueryClient();
  const fn = useServerFn(bcDmSendFn);
  return useMutation({
    mutationFn: (input: {
      body: string;
      clientToken: string;
      replyTo?: { id: string; senderName?: string; preview?: string } | null;
    }) => fn({ data: { threadId, ...input } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bcDmKeys.thread(viewerKey, threadId) });
      void qc.invalidateQueries({ queryKey: bcDmKeys.threads(viewerKey) });
    },
  });
}

export function useDmReact(threadId: string) {
  const viewerKey = useViewerKey();
  const qc = useQueryClient();
  const fn = useServerFn(bcDmReactFn);
  return useMutation({
    mutationFn: (input: { messageId: string; emoji: string }) =>
      fn({ data: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bcDmKeys.thread(viewerKey, threadId) });
    },
  });
}

export function useDmMarkRead() {
  const viewerKey = useViewerKey();
  const qc = useQueryClient();
  const fn = useServerFn(bcDmMarkReadFn);
  return useMutation({
    mutationFn: (threadId: string) => fn({ data: { threadId } }),
    onSuccess: (_res, threadId) => {
      void qc.invalidateQueries({ queryKey: bcDmKeys.thread(viewerKey, threadId) });
      void qc.invalidateQueries({ queryKey: bcDmKeys.threads(viewerKey) });
    },
  });
}

export function useDmRetract(threadId: string) {
  const viewerKey = useViewerKey();
  const qc = useQueryClient();
  const fn = useServerFn(bcDmRetractFn);
  return useMutation({
    mutationFn: (messageId: string) => fn({ data: { messageId } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bcDmKeys.thread(viewerKey, threadId) });
      void qc.invalidateQueries({ queryKey: bcDmKeys.threads(viewerKey) });
    },
  });
}

export function useDmOpenThread() {
  const viewerKey = useViewerKey();
  const qc = useQueryClient();
  const fn = useServerFn(bcDmOpenThreadFn);
  return useMutation({
    mutationFn: (personId: string) => fn({ data: { personId } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bcDmKeys.threads(viewerKey) });
    },
  });
}
