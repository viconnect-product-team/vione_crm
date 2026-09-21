// BC-Mobile-8A — Cuộc trò chuyện 1-1 (Messenger Layout).
// Tin nhắn đối tác bên trái (kèm Avatar thật & chấm xanh Online), tin nhắn của tôi bên phải (Gold accent).
// Hỗ trợ Menu ..., Thu hồi, Trả lời (Reply quote), Thả cảm xúc (Reactions), Đính kèm file/ảnh MinIO và Real-time Sync.

import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import {
  Check,
  CheckCheck,
  ChevronLeft,
  Copy,
  CornerUpLeft,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  Mic,
  MoreHorizontal,
  Paperclip,
  Phone,
  PhoneMissed,
  PhoneOff,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import { useLang, useT } from "@/lib/i18n";
import {
  useDmMarkRead,
  useDmReact,
  useDmRetract,
  useDmSend,
  useDmThread,
} from "@/hooks/use-bc-dm";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import {
  DM_MAX_BODY_LEN,
  sanitizeDmBody,
  type BcDmErrorCode,
  type BcDmMessage,
} from "@/lib/business-connect/mobile/dm.types";
import { safeRandomUUID } from "@/lib/utils";
import { uploadChatAttachment } from "@/lib/upload-media";
import { DmCallModal } from "@/components/business-connect/mobile/inbox/DmCallModal";
import { VoiceMessagePlayer } from "@/components/business-connect/mobile/inbox/VoiceMessagePlayer";
import { VoiceMessageRecorder } from "@/components/business-connect/mobile/inbox/VoiceMessageRecorder";
import { NotificationPermissionBanner } from "@/components/business-connect/mobile/inbox/NotificationPermissionBanner";
import { sendExternalNotification } from "@/lib/notification-permissions";
import { resolveMediaUrl } from "@/lib/api-client";
import {
  ZaloTransactionCard,
  type ZaloTransactionData,
} from "@/components/business-connect/mobile/ZaloTransactionCard";

export const Route = createFileRoute("/connect-app/inbox/$threadId")({
  head: () => ({
    meta: [
      { title: "Cuộc trò chuyện — ViOne Connect" },
      {
        name: "description",
        content: "Trao đổi trực tiếp trong ứng dụng với kết nối đã chấp nhận trên ViOne Connect.",
      },
      { property: "og:title", content: "Cuộc trò chuyện — ViOne Connect" },
      {
        property: "og:description",
        content: "Tin nhắn nội bộ giữa hai kết nối đã chấp nhận trong ViOne Connect.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <div className="bc-app flex min-h-[100dvh] w-full max-w-[480px] mx-auto flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-[#070B12] text-slate-900 dark:text-slate-100">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/20">
        <Sparkles className="h-7 w-7" />
      </div>
      <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Không thể tải cuộc trò chuyện</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-6 leading-relaxed">
        Đang khởi tạo kết nối hoặc kết nối mạng bị gián đoạn. Vui lòng thử lại.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-gradient-to-r from-[#F6E1C3] via-[#D8B282] to-[#C29B69] px-5 py-2.5 text-xs font-bold text-slate-950 shadow-sm hover:brightness-105 transition-all cursor-pointer"
        >
          Thử lại
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
        >
          Quay lại
        </button>
      </div>
    </div>
  ),
  component: ThreadPage,
});

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

function newToken(): string {
  return safeRandomUUID();
}

function formatDateSeparator(dateStr: string, locale: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return "Hôm nay";
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return "Hôm qua";
  }
  return d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatFileSize(bytes?: number): string {
  if (!bytes || isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileBadgeInfo(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["pdf"].includes(ext)) {
    return { label: "PDF", color: "bg-red-500/20 text-red-400 border-red-500/30" };
  }
  if (["doc", "docx"].includes(ext)) {
    return { label: "DOC", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return { label: "XLS", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
  }
  if (["ppt", "pptx"].includes(ext)) {
    return { label: "PPT", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return { label: "ZIP", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
  }
  return {
    label: ext.toUpperCase().slice(0, 4) || "FILE",
    color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  };
}

function formatCallDuration(sec: number): string {
  if (!sec || sec <= 0) return "0s";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m > 0) {
    return `${m} phút ${s > 0 ? `${s}s` : ""}`;
  }
  return `${s} giây`;
}

type ParsedContent =
  | { type: "action_payment"; data: ZaloTransactionData }
  | { type: "image"; url: string; name?: string; caption?: string }
  | { type: "file"; url: string; name: string; size?: number; caption?: string }
  | { type: "voice"; url: string; duration?: number; caption?: string }
  | { type: "call"; callType: "audio" | "video"; status: "ended" | "missed" | "declined"; duration: number }
  | { type: "text"; text: string };

function parseMessageContent(body: string): ParsedContent {
  // Pattern -2: Zalo OA Style Payment Action [action:payment|amount:X|invoice:Y|qr:Z|due:D|desc:S]
  const payRegex = /\[action:payment\|amount:(\d+)\|invoice:([^|]+)\|qr:([^|]+)(?:\|due:([^|]+))?(?:\|desc:([^\]]*))?\]/i;
  const payMatch = body.match(payRegex);
  if (payMatch) {
    return {
      type: "action_payment",
      data: {
        amount: parseInt(payMatch[1], 10),
        invoiceNo: payMatch[2],
        qrUrl: payMatch[3],
        dueDate: payMatch[4],
        desc: payMatch[5] ? decodeURIComponent(payMatch[5]) : undefined,
      },
    };
  }

  // Pattern -1: call:TYPE|status:STATUS|duration:SECONDS
  const callRegex = /\[call:(audio|video)(?:\|status:(ended|missed|declined))?(?:\|duration:(\d+))?\]/i;
  const callMatch = body.match(callRegex);
  if (callMatch) {
    const callType = (callMatch[1].toLowerCase() === "video" ? "video" : "audio") as "audio" | "video";
    const status = (callMatch[2]?.toLowerCase() || "ended") as "ended" | "missed" | "declined";
    const duration = callMatch[3] ? parseInt(callMatch[3], 10) : 0;
    return { type: "call", callType, status, duration };
  }

  // Pattern 0: voice:URL|DURATION or voice:URL
  const voiceRegex = /\[voice:(https?:\/\/[^|\]]+|data:audio\/[^|\]]+)(?:\|(\d+))?\]/i;
  const voiceMatch = body.match(voiceRegex);
  if (voiceMatch) {
    const url = voiceMatch[1];
    const duration = voiceMatch[2] ? parseInt(voiceMatch[2], 10) : undefined;
    const caption = body.replace(voiceRegex, "").trim();
    return { type: "voice", url, duration, caption: caption || undefined };
  }

  // Pattern 1: image:URL|NAME or image:URL
  const imageRegex = /\[image:(https?:\/\/[^|\]]+)(?:\|([^\]]*))?\]/i;
  const imageMatch = body.match(imageRegex);
  if (imageMatch) {
    const url = imageMatch[1];
    const name = imageMatch[2] || "";
    const caption = body.replace(imageRegex, "").trim();
    return { type: "image", url, name, caption: caption || undefined };
  }

  // Pattern 2: file:URL|NAME|SIZE or file:URL|NAME or file:URL
  const fileRegex = /\[file:(https?:\/\/[^|\]]+)(?:\|([^|\]]*))?(?:\|(\d+))?\]/i;
  const fileMatch = body.match(fileRegex);
  if (fileMatch) {
    const url = fileMatch[1];
    const name = fileMatch[2] || "Tài liệu đính kèm";
    const size = fileMatch[3] ? parseInt(fileMatch[3], 10) : undefined;
    const caption = body.replace(fileRegex, "").trim();
    return { type: "file", url, name, size, caption: caption || undefined };
  }

  // Pattern 3: direct image URL
  const isRawImageUrl = /^(https?:\/\/[^\s]+?\.(png|jpe?g|gif|webp|svg))(?:\?.*)?$/i.test(body.trim());
  if (isRawImageUrl) {
    return { type: "image", url: body.trim() };
  }

  return { type: "text", text: body };
}

type ReplyingState = {
  id: string;
  senderName: string;
  preview: string;
};

function ThreadPage() {
  const t = useT();
  const { lang } = useLang();
  const locale = lang === "en" ? "en-GB" : "vi-VN";
  const { threadId } = useParams({ from: "/connect-app/inbox/$threadId" });
  const viewerUserId = useViewerUserId();

  const query = useDmThread(threadId);
  const result = query.data;
  const thread = result?.ok ? result.thread : null;
  const actualThreadId = thread?.threadId || threadId;

  const send = useDmSend(actualThreadId);
  const retract = useDmRetract(actualThreadId);
  const react = useDmReact(actualThreadId);
  const markRead = useDmMarkRead();

  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<ReplyingState | null>(null);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);
  const [activeReactionPickerMsgId, setActiveReactionPickerMsgId] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<BcDmErrorCode | null>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [avatarError, setAvatarError] = useState(false);

  // Attachment upload & preview states
  const [uploadMenuOpen, setUploadMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [callModal, setCallModal] = useState<{ isOpen: boolean; type: "audio" | "video" }>({
    isOpen: false,
    type: "audio",
  });

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const markedRef = useRef<string | null>(null);

  const messages = useMemo(() => (result?.ok ? result.messages : []), [result]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  // External system push notification when new message arrives in background
  const prevMsgCountRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      const latest = messages[messages.length - 1];
      if (latest && !latest.fromMe && (typeof document !== "undefined" && document.hidden)) {
        let preview = latest.body;
        if (preview.startsWith("[action:payment")) preview = "💳 Thông báo giao dịch thanh toán";
        else if (preview.startsWith("[image:")) preview = "📷 Đã gửi một hình ảnh";
        else if (preview.startsWith("[file:")) preview = "📎 Đã gửi một tệp đính kèm";
        else if (preview.startsWith("[voice:")) preview = "🎙️ Đã gửi một tin nhắn thoại";
        else if (preview.startsWith("[call:")) preview = "📞 Cuộc gọi";

        sendExternalNotification(thread?.displayName || "Tin nhắn mới", {
          body: preview,
          icon: thread?.avatarUrl || "/app-icon.png",
          tag: `msg-${actualThreadId}`,
          url: `/connect-app/inbox/${actualThreadId}`,
        });
      }
    }
    prevMsgCountRef.current = messages.length;
  }, [messages, thread?.displayName, thread?.avatarUrl, actualThreadId]);

  // Visual viewport listener: detect keyboard open/close on mobile
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handleResize = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardOffset(offset);
      if (offset > 50) {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 100);
      }
    };
    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);
    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!thread) return;
    if (markedRef.current === actualThreadId && thread.unreadCount === 0) return;
    markedRef.current = actualThreadId;
    markRead.mutate(actualThreadId);
  }, [thread, actualThreadId, markRead]);

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuMsgId(null);
      setActiveReactionPickerMsgId(null);
      setUploadMenuOpen(false);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleCopyText = (text: string) => {
    if (!text) return;
    void navigator.clipboard.writeText(text);
    setCopyToast("Đã sao chép tin nhắn");
    setTimeout(() => setCopyToast(null), 2000);
    setActiveMenuMsgId(null);
  };

  const handleSelectReply = (m: BcDmMessage) => {
    const senderName = m.fromMe ? "Chính bạn" : thread?.displayName ?? "Đối tác";
    const preview = m.body.length > 80 ? `${m.body.substring(0, 80)}...` : m.body;
    setReplyingTo({ id: m.id, senderName, preview });
    setActiveMenuMsgId(null);
    textareaRef.current?.focus();
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    react.mutate({ messageId, emoji });
    setActiveReactionPickerMsgId(null);
    setActiveMenuMsgId(null);
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(isImage ? `Đang tải ảnh "${file.name}"...` : `Đang tải tệp "${file.name}"...`);
    setUploadMenuOpen(false);

    try {
      const uploaded = await uploadChatAttachment(file);
      let payload = "";
      if (uploaded.isImage) {
        payload = draft.trim()
          ? `${draft.trim()}\n[image:${uploaded.url}|${uploaded.name}]`
          : `[image:${uploaded.url}|${uploaded.name}]`;
      } else {
        payload = draft.trim()
          ? `${draft.trim()}\n[file:${uploaded.url}|${uploaded.name}|${uploaded.size}]`
          : `[file:${uploaded.url}|${uploaded.name}|${uploaded.size}]`;
      }

      const res = await send.mutateAsync({
        body: payload,
        clientToken: newToken(),
        replyTo: replyingTo
          ? {
              id: replyingTo.id,
              senderName: replyingTo.senderName,
              preview: replyingTo.preview,
            }
          : null,
      });

      if (res.ok) {
        setDraft("");
        setReplyingTo(null);
      } else {
        setErrorCode(res.error);
      }
    } catch (err: any) {
      setErrorCode("generic");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (e.target) e.target.value = "";
    }
  };

  const handleSendVoice = async (payload: { url: string; duration: number }) => {
    setIsRecordingVoice(false);
    const bodyPayload = `[voice:${payload.url}|${payload.duration}]`;
    const res = await send.mutateAsync({
      body: bodyPayload,
      clientToken: newToken(),
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            preview: replyingTo.preview,
          }
        : null,
    });
    if (res.ok) {
      setReplyingTo(null);
    } else {
      setErrorCode(res.error);
    }
  };

  const handleCallRecord = async (rec: {
    callType: "audio" | "video";
    status: "ended" | "missed" | "declined";
    duration: number;
  }) => {
    const bodyPayload = `[call:${rec.callType}|status:${rec.status}${rec.duration ? `|duration:${rec.duration}` : ""}]`;
    try {
      await send.mutateAsync({
        body: bodyPayload,
        clientToken: newToken(),
      });
    } catch (e) {
      console.warn("Could not record call log into thread:", e);
    }
  };

  const submit = async () => {
    const body = sanitizeDmBody(draft);
    if (!body || send.isPending) return;
    setErrorCode(null);

    const res = await send.mutateAsync({
      body,
      clientToken: newToken(),
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            preview: replyingTo.preview,
          }
        : null,
    });

    if (res.ok) {
      setDraft("");
      setReplyingTo(null);
    } else {
      setErrorCode(res.error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  const errorText =
    errorCode === "not_connected"
      ? t("bc.mobile.inbox.error.not_connected")
      : errorCode === "empty_message"
        ? t("bc.mobile.inbox.error.empty_message")
        : errorCode
          ? t("bc.mobile.inbox.error.generic")
          : null;

  return (
    <div
      className="bc-app flex h-[100dvh] w-full max-w-[480px] mx-auto flex-col bg-[var(--bc-mobile-bg)] text-[var(--bc-mobile-text)] overflow-hidden transition-colors"
      style={{
        height: keyboardOffset > 0 ? `calc(100dvh - ${keyboardOffset}px)` : "100dvh",
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFileSelected(e, true)}
      />
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z"
        className="hidden"
        onChange={(e) => void handleFileSelected(e, false)}
      />

      {/* Fullscreen Image Lightbox Modal */}
      {previewImageUrl ? (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <a
              href={previewImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              onClick={(e) => e.stopPropagation()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              title="Tải ảnh về máy"
            >
              <Download className="h-5 w-5" />
            </a>
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <img
            src={previewImageUrl}
            alt="Xem ảnh lớn"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}

      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 dark:border-[var(--bc-mobile-border)] bg-white/95 dark:bg-[var(--bc-mobile-surface)]/95 px-3 py-2.5 backdrop-blur-md shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => window.history.back()}
            aria-label={t("bc.mobile.topbar.back")}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-700 dark:text-[var(--bc-mobile-muted)] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[var(--bc-mobile-surface-2)] transition-colors shrink-0 cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {thread ? (
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="relative shrink-0">
                {thread.avatarUrl && !avatarError ? (
                  <img
                    src={resolveMediaUrl(thread.avatarUrl) ?? thread.avatarUrl}
                    alt={thread.displayName}
                    onError={() => setAvatarError(true)}
                    className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-[var(--bc-mobile-border)]"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 dark:bg-[var(--bc-mobile-surface-2)] text-[13px] font-bold text-amber-700 dark:text-[var(--bc-mobile-accent)] ring-1 ring-amber-500/30 dark:ring-[var(--bc-mobile-border)]">
                    {thread.displayName.trim().charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                {thread.isOnline ? (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#22c55e] ring-2 ring-white dark:ring-[var(--bc-mobile-surface)]"
                    title="Đang hoạt động"
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[15px] font-bold text-slate-900 dark:text-white leading-tight">
                  {thread.displayName}
                </h1>
                <p className="truncate text-[11px] text-slate-500 dark:text-[#D4C3A3] leading-tight mt-0.5 font-medium">
                  {thread.isOnline ? (
                    <span className="text-[#16a34a] dark:text-[#22c55e] font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a] dark:bg-[#22c55e] animate-pulse" />
                      Đang hoạt động
                    </span>
                  ) : (
                    thread.companyName || thread.headline || "Hội viên ViOne Connect"
                  )}
                </p>
              </div>
            </div>
          ) : (
            <h1 className="text-[15px] font-bold text-slate-900 dark:text-white">{t("bc.mobile.inbox.title")}</h1>
          )}
        </div>

        {thread ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setCallModal({ isOpen: true, type: "audio" })}
              aria-label="Gọi thoại"
              title="Gọi thoại"
              className="grid h-9 w-9 place-items-center rounded-full text-slate-700 dark:text-[var(--bc-mobile-muted)] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[var(--bc-mobile-surface-2)] transition-colors cursor-pointer"
            >
              <Phone className="h-4.5 w-4.5 text-[var(--bc-mobile-accent,#B8860B)]" strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={() => setCallModal({ isOpen: true, type: "video" })}
              aria-label="Gọi video"
              title="Gọi video"
              className="grid h-9 w-9 place-items-center rounded-full text-slate-700 dark:text-[var(--bc-mobile-muted)] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[var(--bc-mobile-surface-2)] transition-colors cursor-pointer"
            >
              <Video className="h-4.5 w-4.5 text-[var(--bc-mobile-accent,#B8860B)]" strokeWidth={1.8} />
            </button>
          </div>
        ) : null}
      </header>

      {/* Direct Call Modal */}
      <DmCallModal
        isOpen={callModal.isOpen}
        callType={callModal.type}
        counterpartUserId={thread?.personId ? thread.personId.replace(/^u:/, "") : undefined}
        counterpartName={thread?.displayName ?? "Đối tác"}
        counterpartAvatar={thread?.avatarUrl}
        counterpartTitle={thread?.companyName || thread?.headline}
        onClose={() => setCallModal((prev) => ({ ...prev, isOpen: false }))}
        onCallRecord={handleCallRecord}
      />

      <div className="flex flex-1 min-h-0 flex-col max-w-full relative overflow-hidden">
        {copyToast ? (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border-gold)] px-4 py-1.5 text-[12px] font-medium text-[var(--bc-mobile-text)] shadow-lg backdrop-blur-md animate-fade-in">
            {copyToast}
          </div>
        ) : null}

        {/* Global Notification & Device Permissions Banner */}
        <NotificationPermissionBanner />

        {query.isLoading ? (
          <div className="flex flex-1 items-center justify-center gap-2 py-10 text-[13px] text-[var(--bc-mobile-muted)]">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--bc-mobile-accent)]" aria-hidden="true" />
            {t("bc.mobile.inbox.thread.loading")}
          </div>
        ) : !thread ? (
          <div className="p-6 text-center">
            <p className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-4 text-[13px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.inbox.thread.notFound")}
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-accent)] mb-3 ring-1 ring-[var(--bc-mobile-border-gold)]">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <p className="text-[14px] font-semibold text-[var(--bc-mobile-text)]">
                    Bắt đầu cuộc trò chuyện với {thread.displayName}
                  </p>
                  <p className="text-[12px] text-[var(--bc-mobile-muted)] max-w-[280px] mt-1">
                    Gửi tin nhắn đầu tiên để chào hỏi và trao đổi cơ hội hợp tác kinh doanh.
                  </p>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const isNewDay =
                    !prevMsg ||
                    new Date(m.createdAt).toDateString() !==
                      new Date(prevMsg.createdAt).toDateString();
                  const timeFormatted = new Date(m.createdAt).toLocaleTimeString(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const reactionsGrouped = (m.reactions || []).reduce(
                    (acc, r) => {
                      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                      return acc;
                    },
                    {} as Record<string, number>,
                  );

                  const myReaction = (m.reactions || []).find((r) => r.userId === viewerUserId);
                  const content = parseMessageContent(m.body);

                  return (
                    <div key={m.id} className="space-y-1.5">
                      {isNewDay ? (
                        <div className="flex items-center justify-center my-3">
                          <span className="rounded-full bg-slate-100 dark:bg-[var(--bc-mobile-surface-2)] border border-slate-200 dark:border-[var(--bc-mobile-border)] px-3 py-1 text-[10.5px] font-semibold text-slate-600 dark:text-[var(--bc-mobile-muted)] shadow-xs">
                            {formatDateSeparator(m.createdAt, locale)}
                          </span>
                        </div>
                      ) : null}

                      <div
                        className={`flex items-start gap-2.5 group relative ${
                          m.fromMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!m.fromMe ? (
                          <div className="relative shrink-0 mt-0.5">
                            {thread.avatarUrl && !avatarError ? (
                              <img
                                src={resolveMediaUrl(thread.avatarUrl) ?? thread.avatarUrl}
                                alt=""
                                onError={() => setAvatarError(true)}
                                className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-[var(--bc-mobile-border-gold)] shadow-xs"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 dark:bg-[var(--bc-mobile-surface-2)] text-[12px] font-bold text-amber-700 dark:text-[var(--bc-mobile-accent)] ring-1 ring-amber-500/30 dark:ring-[var(--bc-mobile-border-gold)] shadow-xs">
                                {thread.displayName.trim().charAt(0).toUpperCase() || "?"}
                              </div>
                            )}
                            {thread.isOnline ? (
                              <span
                                className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#22c55e] ring-2 ring-white dark:ring-[var(--bc-mobile-surface)]"
                                title="Đang hoạt động"
                              />
                            ) : null}
                          </div>
                        ) : null}

                        <div
                          className={`flex flex-col max-w-[82%] min-w-0 ${
                            m.fromMe ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className={`flex items-center gap-1.5 w-full ${
                              m.fromMe ? "justify-end" : "justify-start"
                            }`}
                          >
                            {m.fromMe && !m.retractedAt ? (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="relative">
                                  <button
                                    type="button"
                                    title="Thêm hành động"
                                    onClick={() =>
                                      setActiveMenuMsgId(activeMenuMsgId === m.id ? null : m.id)
                                    }
                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-[var(--bc-mobile-surface-2)] text-slate-600 dark:text-[var(--bc-mobile-muted)] hover:text-slate-900 dark:hover:text-[var(--bc-mobile-accent)] hover:bg-slate-200 dark:hover:bg-[var(--bc-mobile-surface)] border border-slate-200 dark:border-[var(--bc-mobile-border)] shadow-xs cursor-pointer transition-colors"
                                  >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </button>

                                  {activeMenuMsgId === m.id ? (
                                    <div className="absolute bottom-8 right-0 z-30 min-w-[140px] rounded-xl border border-slate-200 dark:border-[var(--bc-mobile-border)] bg-white dark:bg-[var(--bc-mobile-surface)] py-1 shadow-2xl backdrop-blur-md">
                                      <button
                                        type="button"
                                        onClick={() => handleSelectReply(m)}
                                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-slate-800 dark:text-[var(--bc-mobile-text)] hover:bg-slate-100 dark:hover:bg-[var(--bc-mobile-surface-2)] hover:text-amber-700 dark:hover:text-[var(--bc-mobile-accent)] cursor-pointer"
                                      >
                                        <CornerUpLeft className="h-3.5 w-3.5" />
                                        <span>Trả lời</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyText(m.body)}
                                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-slate-800 dark:text-[var(--bc-mobile-text)] hover:bg-slate-100 dark:hover:bg-[var(--bc-mobile-surface-2)] hover:text-amber-700 dark:hover:text-[var(--bc-mobile-accent)] cursor-pointer"
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                        <span>Sao chép</span>
                                      </button>
                                      <button
                                        type="button"
                                        disabled={retract.isPending}
                                        onClick={() => {
                                          retract.mutate(m.id);
                                          setActiveMenuMsgId(null);
                                        }}
                                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-red-500 hover:bg-red-500/15 cursor-pointer"
                                      >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        <span>Thu hồi tin nhắn</span>
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                                <button
                                  type="button"
                                  title="Trả lời"
                                  onClick={() => handleSelectReply(m)}
                                  className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-[var(--bc-mobile-surface-2)] text-slate-600 dark:text-[var(--bc-mobile-muted)] hover:text-slate-900 dark:hover:text-[var(--bc-mobile-accent)] hover:bg-slate-200 dark:hover:bg-[var(--bc-mobile-surface)] border border-slate-200 dark:border-[var(--bc-mobile-border)] shadow-xs cursor-pointer transition-colors"
                                >
                                  <CornerUpLeft className="h-3.5 w-3.5" />
                                </button>
                                <div className="relative">
                                  <button
                                    type="button"
                                    title="Thả cảm xúc"
                                    onClick={() =>
                                      setActiveReactionPickerMsgId(
                                        activeReactionPickerMsgId === m.id ? null : m.id,
                                      )
                                    }
                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-[var(--bc-mobile-surface-2)] text-slate-600 dark:text-[var(--bc-mobile-muted)] hover:text-slate-900 dark:hover:text-[var(--bc-mobile-accent)] hover:bg-slate-200 dark:hover:bg-[var(--bc-mobile-surface)] border border-slate-200 dark:border-[var(--bc-mobile-border)] shadow-xs cursor-pointer transition-colors text-[13px]"
                                  >
                                    {myReaction ? myReaction.emoji : "👍"}
                                  </button>

                                  {activeReactionPickerMsgId === m.id ? (
                                    <div className="absolute bottom-8 right-0 z-30 flex items-center gap-1 rounded-full border border-slate-200 dark:border-[var(--bc-mobile-border-gold)] bg-white dark:bg-[var(--bc-mobile-surface)] p-1.5 shadow-xl backdrop-blur-md animate-fade-in">
                                      {QUICK_REACTIONS.map((emoji) => (
                                        <button
                                          key={emoji}
                                          type="button"
                                          onClick={() => handleToggleReaction(m.id, emoji)}
                                          className={`flex h-7 w-7 items-center justify-center rounded-full text-[15px] hover:scale-125 transition-transform cursor-pointer ${
                                            myReaction?.emoji === emoji
                                              ? "bg-amber-100 dark:bg-[var(--bc-mobile-accent-soft)] ring-1 ring-amber-500 dark:ring-[var(--bc-mobile-accent)]"
                                              : "hover:bg-slate-100 dark:hover:bg-[var(--bc-mobile-surface-2)]"
                                          }`}
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}

                            {m.retractedAt ? (
                              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-[var(--bc-mobile-border)] bg-slate-100 dark:bg-[var(--bc-mobile-surface-2)] px-3.5 py-2 text-[12.5px] italic text-slate-500 dark:text-[var(--bc-mobile-muted)]">
                                {t("bc.mobile.inbox.thread.retracted")}
                              </div>
                            ) : (
                              <div className="relative min-w-0">
                                {m.replyTo ? (
                                  <div
                                    className={`mb-1 rounded-xl px-3 py-1.5 text-[11.5px] border-l-2 ${
                                      m.fromMe
                                        ? "bg-black/15 border-black/50 text-[#1a1206]"
                                        : "bg-slate-100 dark:bg-[var(--bc-mobile-surface-2)] border-amber-500 dark:border-[var(--bc-mobile-accent)] text-slate-800 dark:text-[var(--bc-mobile-text)]"
                                    }`}
                                  >
                                    <p className="font-semibold text-[10.5px]">
                                      {m.replyTo.senderName || "Trả lời"}
                                    </p>
                                    <p className="truncate opacity-90">{m.replyTo.preview}</p>
                                  </div>
                                ) : null}

                                <div
                                  className={`relative break-words transition-all shadow-xs overflow-hidden ${
                                    content.type === "action_payment"
                                      ? "rounded-2xl bg-transparent border-0 shadow-none p-0"
                                      : m.fromMe
                                        ? "rounded-2xl rounded-tr-xs bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_50%,#C29B69_100%)] text-[#1A1206] font-medium shadow-[0_2px_10px_rgba(184,134,11,0.25)] border border-amber-300/40"
                                        : "rounded-2xl rounded-tl-xs border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131A26] text-slate-900 dark:text-slate-100 shadow-xs"
                                  }`}
                                >
                                  {content.type === "action_payment" ? (
                                    <ZaloTransactionCard data={content.data} isFromMe={m.fromMe} />
                                  ) : content.type === "image" ? (
                                    <div className="space-y-1.5 p-1.5">
                                      <div
                                        onClick={() => setPreviewImageUrl(content.url)}
                                        className="group relative cursor-pointer overflow-hidden rounded-xl border border-black/10 dark:border-white/10"
                                      >
                                        <img
                                          src={content.url}
                                          alt={content.name || "Hình ảnh"}
                                          className="max-h-64 max-w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
                                          loading="lazy"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-xs flex items-center gap-1">
                                            <ExternalLink className="h-3 w-3" />
                                            Xem ảnh
                                          </span>
                                        </div>
                                      </div>
                                      {content.caption ? (
                                        <p
                                          className={`px-2 pb-1 text-[13.5px] leading-relaxed ${
                                            m.fromMe ? "text-[#1A1206] font-medium" : "text-slate-900 dark:text-[var(--bc-mobile-text)]"
                                          }`}
                                        >
                                          {content.caption}
                                        </p>
                                      ) : null}
                                    </div>
                                  ) : content.type === "file" ? (
                                    <div className="p-2 space-y-1.5">
                                      {(() => {
                                        const badge = getFileBadgeInfo(content.name);
                                        return (
                                          <a
                                            href={content.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download
                                            className={`flex items-center gap-3 rounded-xl p-2.5 transition-all cursor-pointer ${
                                              m.fromMe
                                                ? "bg-black/10 hover:bg-black/15 text-[#1A1206]"
                                                : "bg-slate-50 dark:bg-[var(--bc-mobile-surface-2)] hover:bg-slate-100 dark:hover:bg-[var(--bc-mobile-surface-2)]/80 text-slate-900 dark:text-[var(--bc-mobile-text)] border border-slate-200 dark:border-[var(--bc-mobile-border)]"
                                            }`}
                                          >
                                            <div
                                              className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border font-bold text-[11px] ${badge.color}`}
                                            >
                                              {badge.label}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <p className="truncate text-[13px] font-semibold leading-tight text-slate-900 dark:text-[var(--bc-mobile-text)]">
                                                {content.name}
                                              </p>
                                              <div className="flex items-center gap-2 mt-0.5">
                                                {content.size ? (
                                                  <span
                                                    className={`text-[11px] ${
                                                      m.fromMe
                                                        ? "text-[#1A1206]/70"
                                                        : "text-slate-500 dark:text-[var(--bc-mobile-muted)]"
                                                    }`}
                                                  >
                                                    {formatFileSize(content.size)}
                                                  </span>
                                                ) : null}
                                                <span
                                                  className={`flex items-center gap-0.5 text-[11px] font-medium underline ${
                                                    m.fromMe
                                                      ? "text-[#1A1206]"
                                                      : "text-amber-700 dark:text-[var(--bc-mobile-accent)]"
                                                  }`}
                                                >
                                                  <Download className="h-3 w-3" />
                                                  Tải về
                                                </span>
                                              </div>
                                            </div>
                                          </a>
                                        );
                                      })()}
                                      {content.caption ? (
                                        <p
                                          className={`px-2 text-[13.5px] leading-relaxed ${
                                            m.fromMe ? "text-[#1A1206] font-medium" : "text-slate-900 dark:text-[var(--bc-mobile-text)]"
                                          }`}
                                        >
                                          {content.caption}
                                        </p>
                                      ) : null}
                                    </div>
                                  ) : content.type === "call" ? (
                                    <div className="p-3">
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                                            content.status === "missed"
                                              ? "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                                              : content.status === "declined"
                                                ? "bg-slate-500/15 text-slate-400 border border-slate-500/30"
                                                : m.fromMe
                                                  ? "bg-black/15 text-amber-900 border border-amber-800/20"
                                                  : "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                                          }`}
                                        >
                                          {content.status === "missed" ? (
                                            <PhoneMissed className="h-5 w-5" />
                                          ) : content.status === "declined" ? (
                                            <PhoneOff className="h-5 w-5" />
                                          ) : content.callType === "video" ? (
                                            <Video className="h-5 w-5" />
                                          ) : (
                                            <Phone className="h-5 w-5" />
                                          )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p
                                            className={`text-[13.5px] font-semibold leading-tight ${
                                              content.status === "missed"
                                                ? "text-rose-600 dark:text-rose-400"
                                                : content.status === "declined"
                                                  ? "text-slate-600 dark:text-slate-400"
                                                  : m.fromMe
                                                    ? "text-[#1A1206]"
                                                    : "text-slate-900 dark:text-white"
                                            }`}
                                          >
                                            {content.status === "missed"
                                              ? `Cuộc gọi ${content.callType === "video" ? "video " : ""}nhỡ`
                                              : content.status === "declined"
                                                ? `Cuộc gọi ${content.callType === "video" ? "video " : ""}bị từ chối`
                                                : `Cuộc gọi ${content.callType === "video" ? "video" : "thoại"}`}
                                          </p>
                                          <p
                                            className={`text-[11.5px] mt-0.5 ${
                                              m.fromMe
                                                ? "text-[#1A1206]/70"
                                                : "text-slate-500 dark:text-[var(--bc-mobile-muted)]"
                                            }`}
                                          >
                                            {content.status === "ended" && content.duration > 0
                                              ? `Thời lượng: ${formatCallDuration(content.duration)}`
                                              : content.status === "missed"
                                                ? "Không có người trả lời"
                                                : content.status === "declined"
                                                  ? "Người nhận bận"
                                                  : "Đã kết thúc"}
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setCallModal({ isOpen: true, type: content.callType })}
                                          className={`shrink-0 rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition-colors cursor-pointer ${
                                            m.fromMe
                                              ? "bg-black/10 hover:bg-black/20 text-[#1A1206]"
                                              : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-[var(--bc-mobile-accent)] border border-amber-500/30"
                                          }`}
                                        >
                                          Gọi lại
                                        </button>
                                      </div>
                                    </div>
                                  ) : content.type === "voice" ? (
                                    <div className="p-0.5">
                                      <VoiceMessagePlayer url={content.url} duration={content.duration} fromMe={m.fromMe} />
                                      {content.caption ? (
                                        <p
                                          className={`px-3 pb-2 text-[13px] leading-relaxed ${
                                            m.fromMe ? "text-[#1A1206] font-medium" : "text-slate-900 dark:text-[var(--bc-mobile-text)]"
                                          }`}
                                        >
                                          {content.caption}
                                        </p>
                                      ) : null}
                                    </div>
                                  ) : (
                                    <div className="px-4 py-2.5 text-[14px] leading-relaxed break-words">
                                      {content.text}
                                    </div>
                                  )}
                                </div>

                                {Object.keys(reactionsGrouped).length > 0 ? (
                                  <div
                                    className={`absolute -bottom-2.5 flex items-center gap-1 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-1.5 py-0.5 shadow-md ${
                                      m.fromMe ? "right-2" : "left-2"
                                    }`}
                                  >
                                    {Object.entries(reactionsGrouped).map(([emoji, count]) => (
                                      <span
                                        key={emoji}
                                        className="flex items-center gap-0.5 text-[11px]"
                                      >
                                        <span>{emoji}</span>
                                        {count > 1 ? (
                                          <span className="font-semibold text-[10px] text-[var(--bc-mobile-muted)]">
                                            {count}
                                          </span>
                                        ) : null}
                                      </span>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            )}

                            {!m.fromMe && !m.retractedAt ? (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="relative">
                                  <button
                                    type="button"
                                    title="Thả cảm xúc"
                                    onClick={() =>
                                      setActiveReactionPickerMsgId(
                                        activeReactionPickerMsgId === m.id ? null : m.id,
                                      )
                                    }
                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-accent)] hover:bg-[var(--bc-mobile-surface)] border border-[var(--bc-mobile-border)] shadow-xs cursor-pointer transition-colors text-[13px]"
                                  >
                                    {myReaction ? myReaction.emoji : "👍"}
                                  </button>

                                  {activeReactionPickerMsgId === m.id ? (
                                    <div className="absolute bottom-8 left-0 z-30 flex items-center gap-1 rounded-full border border-[var(--bc-mobile-border-gold)] bg-[var(--bc-mobile-surface)] p-1.5 shadow-xl backdrop-blur-md animate-fade-in">
                                      {QUICK_REACTIONS.map((emoji) => (
                                        <button
                                          key={emoji}
                                          type="button"
                                          onClick={() => handleToggleReaction(m.id, emoji)}
                                          className={`flex h-7 w-7 items-center justify-center rounded-full text-[15px] hover:scale-125 transition-transform cursor-pointer ${
                                            myReaction?.emoji === emoji
                                              ? "bg-[var(--bc-mobile-accent-soft)] ring-1 ring-[var(--bc-mobile-accent)]"
                                              : "hover:bg-[var(--bc-mobile-surface-2)]"
                                          }`}
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                                <button
                                  type="button"
                                  title="Trả lời"
                                  onClick={() => handleSelectReply(m)}
                                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-accent)] hover:bg-[var(--bc-mobile-surface)] border border-[var(--bc-mobile-border)] shadow-xs cursor-pointer transition-colors"
                                >
                                  <CornerUpLeft className="h-3.5 w-3.5" />
                                </button>
                                <div className="relative">
                                  <button
                                    type="button"
                                    title="Thêm hành động"
                                    onClick={() =>
                                      setActiveMenuMsgId(activeMenuMsgId === m.id ? null : m.id)
                                    }
                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-accent)] hover:bg-[var(--bc-mobile-surface)] border border-[var(--bc-mobile-border)] shadow-xs cursor-pointer transition-colors"
                                  >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </button>

                                  {activeMenuMsgId === m.id ? (
                                    <div className="absolute bottom-8 left-0 z-30 min-w-[140px] rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] py-1 shadow-2xl backdrop-blur-md">
                                      <button
                                        type="button"
                                        onClick={() => handleSelectReply(m)}
                                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface-2)] hover:text-[var(--bc-mobile-accent)] cursor-pointer"
                                      >
                                        <CornerUpLeft className="h-3.5 w-3.5" />
                                        <span>Trả lời</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyText(m.body)}
                                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface-2)] hover:text-[var(--bc-mobile-accent)] cursor-pointer"
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                        <span>Sao chép</span>
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}
                          </div>

                          <div
                            className={`mt-1 flex items-center gap-1.5 px-1 text-[10.5px] text-[var(--bc-mobile-muted)] ${
                              m.fromMe ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span>{timeFormatted}</span>
                            {m.fromMe && !m.retractedAt ? (
                              m.readAt ? (
                                <span className="flex items-center gap-0.5 text-[var(--bc-mobile-accent)] font-semibold">
                                  <CheckCheck className="h-3.5 w-3.5" />
                                  <span>Đã xem</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-[var(--bc-mobile-muted)]">
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Đã gửi</span>
                                </span>
                              )
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {errorText ? (
              <div className="px-4 pb-1">
                <p
                  role="alert"
                  className="rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-1.5 text-[12px] text-[#f87171]"
                >
                  {errorText}
                </p>
              </div>
            ) : null}

            {replyingTo ? (
              <div className="flex items-center justify-between border-t border-[var(--bc-mobile-border-gold)] bg-[var(--bc-mobile-surface)] px-4 py-2 text-[12px] text-[var(--bc-mobile-text)] animate-fade-in">
                <div className="flex items-center gap-2 min-w-0">
                  <CornerUpLeft className="h-4 w-4 text-[var(--bc-mobile-accent)] shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--bc-mobile-accent)] truncate">
                      Đang trả lời {replyingTo.senderName}
                    </p>
                    <p className="text-[11px] text-[var(--bc-mobile-muted)] truncate">{replyingTo.preview}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="p-1 text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] cursor-pointer"
                  title="Hủy trả lời"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            {isUploading ? (
              <div className="flex items-center gap-2 border-t border-[var(--bc-mobile-border-gold)] bg-[var(--bc-mobile-surface-2)] px-4 py-2 text-[12px] text-[var(--bc-mobile-accent)] animate-pulse">
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                <span className="truncate">{uploadProgress || "Đang tải tệp lên máy chủ..."}</span>
              </div>
            ) : null}

            <div
              className="border-t border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)]/95 p-3 backdrop-blur-md shrink-0"
              style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
            >
              {isRecordingVoice ? (
                <VoiceMessageRecorder
                  onSendVoice={handleSendVoice}
                  onCancel={() => setIsRecordingVoice(false)}
                />
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submit();
                  }}
                >
                  <div className="flex items-end gap-2 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3 py-1.5 focus-within:border-[var(--bc-mobile-border-gold)] transition-all shadow-none">
                    {/* Plus (+) Button for attachment menu */}
                    <div className="relative shrink-0 mb-0.5">
                      <button
                        type="button"
                        disabled={isUploading || send.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadMenuOpen(!uploadMenuOpen);
                        }}
                        aria-label="Đính kèm tệp hoặc ảnh"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bc-mobile-surface)] text-[var(--bc-mobile-accent)] border border-[var(--bc-mobile-border)] hover:bg-[var(--bc-mobile-surface-2)] transition-colors cursor-pointer"
                      >
                        <Plus
                          className={`h-4 w-4 transition-transform duration-200 ${
                            uploadMenuOpen ? "rotate-45" : ""
                          }`}
                        />
                      </button>

                      {uploadMenuOpen ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-11 left-0 z-40 w-52 rounded-2xl border border-[var(--bc-mobile-border-gold)] bg-[var(--bc-mobile-surface-2)] p-1.5 shadow-2xl backdrop-blur-xl animate-fade-in"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setUploadMenuOpen(false);
                              imageInputRef.current?.click();
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface)] hover:text-[var(--bc-mobile-accent)] cursor-pointer transition-colors"
                          >
                            <div className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500/15 text-amber-400">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                            <span>Gửi hình ảnh</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setUploadMenuOpen(false);
                              fileInputRef.current?.click();
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface)] hover:text-[var(--bc-mobile-accent)] cursor-pointer transition-colors"
                          >
                            <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-500/15 text-blue-400">
                              <FileText className="h-4 w-4" />
                            </div>
                            <span>Gửi tài liệu / tệp</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setUploadMenuOpen(false);
                              setIsRecordingVoice(true);
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface)] hover:text-[var(--bc-mobile-accent)] cursor-pointer transition-colors"
                          >
                            <div className="grid h-7 w-7 place-items-center rounded-lg bg-red-500/15 text-red-400">
                              <Mic className="h-4 w-4" />
                            </div>
                            <span>Ghi âm giọng nói</span>
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <label className="sr-only" htmlFor="bc-dm-input">
                      {t("bc.mobile.inbox.thread.placeholder")}
                    </label>
                    <textarea
                      id="bc-dm-input"
                      ref={textareaRef}
                      rows={1}
                      value={draft}
                      maxLength={DM_MAX_BODY_LEN}
                      onChange={(e) => {
                        setDraft(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder={t("bc.mobile.inbox.thread.placeholder")}
                      className="chat-input no-focus-outline max-h-[120px] min-h-[32px] flex-1 resize-none bg-transparent py-1 text-[13.5px] text-[var(--bc-mobile-text)] placeholder-[var(--bc-mobile-muted)] border-none outline-none focus:outline-none focus:ring-0 shadow-none leading-relaxed"
                      style={{ border: "none", outline: "none", boxShadow: "none" }}
                    />

                    {draft.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setDraft("");
                          if (textareaRef.current) {
                            textareaRef.current.style.height = "auto";
                            textareaRef.current.focus();
                          }
                        }}
                        aria-label="Xóa nội dung nhập"
                        className="mb-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-white/20 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/30 transition-colors cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* High-Contrast Send Button or Voice Mic Button */}
                    {draft.trim().length === 0 ? (
                      <button
                        type="button"
                        onClick={() => setIsRecordingVoice(true)}
                        aria-label="Ghi âm tin nhắn thoại"
                        title="Ghi âm tin nhắn thoại"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[#F7D896] hover:bg-amber-500/30 border border-amber-500/40 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm mb-0.5"
                      >
                        <Mic className="h-4 w-4 text-[#F7D896]" aria-hidden="true" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={send.isPending || isUploading}
                        aria-label={t("bc.mobile.inbox.thread.send")}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#F7D896] via-[#E2B755] to-[#C49338] text-slate-950 font-black shadow-[0_2px_12px_rgba(216,178,130,0.5)] transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer mb-0.5"
                      >
                        {send.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-950" aria-hidden="true" />
                        ) : (
                          <Send className="h-3.5 w-3.5 fill-current text-slate-950 ml-0.5" aria-hidden="true" />
                        )}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
