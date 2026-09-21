import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import {
  listConversations,
  listMessages,
  sendMessage,
  type MyConversation,
} from "@/lib/member-app.functions";
import { useT, useFmt } from "@/lib/i18n";
import {
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  Plus,
  Send,
  X,
} from "lucide-react";
import { uploadChatAttachment } from "@/lib/upload-media";

export const Route = createFileRoute("/m/messages")({
  component: MessagesScreen,
});

function initialsOf(name: string) {
  return name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("");
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

type ParsedContent =
  | { type: "image"; url: string; name?: string; caption?: string }
  | { type: "file"; url: string; name: string; size?: number; caption?: string }
  | { type: "text"; text: string };

function parseMessageContent(body: string): ParsedContent {
  const imageRegex = /\[image:(https?:\/\/[^|\]]+)(?:\|([^\]]*))?\]/i;
  const imageMatch = body.match(imageRegex);
  if (imageMatch) {
    const url = imageMatch[1];
    const name = imageMatch[2] || "";
    const caption = body.replace(imageRegex, "").trim();
    return { type: "image", url, name, caption: caption || undefined };
  }

  const fileRegex = /\[file:(https?:\/\/[^|\]]+)(?:\|([^|\]]*))?(?:\|(\d+))?\]/i;
  const fileMatch = body.match(fileRegex);
  if (fileMatch) {
    const url = fileMatch[1];
    const name = fileMatch[2] || "Tài liệu đính kèm";
    const size = fileMatch[3] ? parseInt(fileMatch[3], 10) : undefined;
    const caption = body.replace(fileRegex, "").trim();
    return { type: "file", url, name, size, caption: caption || undefined };
  }

  const isRawImageUrl = /^(https?:\/\/[^\s]+?\.(png|jpe?g|gif|webp|svg))(?:\?.*)?$/i.test(body.trim());
  if (isRawImageUrl) {
    return { type: "image", url: body.trim() };
  }

  return { type: "text", text: body };
}

function formatMessagePreview(raw?: string | null): string {
  if (!raw) return "";
  const text = raw.trim();
  if (
    /\[image:(https?:\/\/[^|\]]+)(?:\|([^\]]*))?\]/i.test(text) ||
    /^(https?:\/\/[^\s]+?\.(png|jpe?g|gif|webp|svg))(?:\?.*)?$/i.test(text)
  ) {
    return "📷 [Hình ảnh]";
  }
  const fileMatch = text.match(/\[file:(https?:\/\/[^|\]]+)(?:\|([^|\]]*))?(?:\|(\d+))?\]/i);
  if (fileMatch) {
    return `📎 [Tệp] ${fileMatch[2] || "Tài liệu"}`;
  }
  if (/\[voice:(https?:\/\/[^|\]]+|data:audio\/[^|\]]+)(?:\|(\d+))?\]/i.test(text)) {
    return "🎙️ [Tin nhắn thoại]";
  }
  const callMatch = text.match(/\[call:(audio|video)(?:\|status:(ended|missed|declined))?(?:\|duration:(\d+))?\]/i);
  if (callMatch) {
    const isVideo = callMatch[1].toLowerCase() === "video";
    const status = callMatch[2]?.toLowerCase() || "ended";
    if (status === "missed") return `📵 [Cuộc gọi ${isVideo ? "video " : ""}nhỡ]`;
    if (status === "declined") return `🚫 [Cuộc gọi ${isVideo ? "video " : ""}bị từ chối]`;
    return `📞 [Cuộc gọi ${isVideo ? "video" : "thoại"}]`;
  }
  return text;
}

function MessagesScreen() {
  const [active, setActive] = useState<MyConversation | null>(null);

  if (active) {
    return <ChatThread peer={active} onBack={() => setActive(null)} />;
  }
  return <ConversationList onOpen={setActive} />;
}

function ConversationList({ onOpen }: { onOpen: (c: MyConversation) => void }) {
  const t = useT();
  const fmt = useFmt();
  const {
    data: conversations,
    loading,
    error,
    reload,
  } = useServerData<MyConversation[]>(() => listConversations(), []);

  useEffect(() => {
    const timer = setInterval(() => reload(), 6000);
    return () => clearInterval(timer);
  }, [reload]);

  return (
    <div className="vba-app vba-animate min-h-[100dvh] bg-[var(--vba-bg)] text-[var(--vba-text)]">
      <MemberHeader title={t("m.messages.title")} back />
      <p className="sr-only" role="status" aria-live="polite" data-testid="messages-announcement">
        {loading
          ? t("m.messages.announce.loading")
          : t("m.messages.announce.count", { count: conversations.length })}
      </p>
      <div
        className="mt-2 px-4"
        role="list"
        aria-live="polite"
        aria-busy={loading}
        aria-label={t("m.messages.title")}
      >
        {loading && (
          <p className="py-8 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.messages.loading")}
          </p>
        )}
        {error && (
          <p className="py-8 text-center text-[13px] text-[var(--vba-danger,#e05656)]">{error}</p>
        )}
        {!loading && !error && conversations.length === 0 && (
          <p className="py-8 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.messages.empty")}
          </p>
        )}
        {conversations.map((c: any) => (
          <div key={c.peerCode} role="listitem">
            <button
              onClick={() => onOpen(c)}
              className="flex w-full items-center gap-3 border-b border-[var(--vba-border-soft)] py-3.5 text-left active:opacity-80"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--vba-surface-2)] text-[14px] font-bold text-[var(--vba-gold)]">
                {initialsOf(c.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[14px] font-bold text-slate-900 dark:text-[var(--vba-text)]">
                    {c.name}
                  </span>
                  <span className="shrink-0 text-[11px] text-slate-500 dark:text-[var(--vba-text-dim)]">
                    {fmt.rel(c.time)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="truncate text-[12px] text-slate-600 dark:text-[var(--vba-text-muted)]">
                    {formatMessagePreview(c.last)}
                  </span>
                  {c.unread > 0 && (
                    <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full vba-gold-grad px-1.5 text-[10px] font-bold text-[#1a1206]">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatThread({ peer, onBack }: { peer: MyConversation; onBack: () => void }) {
  const t = useT();
  const fmt = useFmt();
  const { data, loading, error, reload } = useServerData(
    () => listMessages({ data: { peerCode: peer.peerCode } }),
    { peerName: peer.name, messages: [] as Awaited<ReturnType<typeof listMessages>>["messages"] },
  );
  const send = useServerFn(sendMessage);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadMenuOpen, setUploadMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handleResize = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardOffset(offset);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);
    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => reload(), 4000);
    return () => clearInterval(timer);
  }, [reload]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.messages.length]);

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
        payload = text.trim()
          ? `${text.trim()}\n[image:${uploaded.url}|${uploaded.name}]`
          : `[image:${uploaded.url}|${uploaded.name}]`;
      } else {
        payload = text.trim()
          ? `${text.trim()}\n[file:${uploaded.url}|${uploaded.name}|${uploaded.size}]`
          : `[file:${uploaded.url}|${uploaded.name}|${uploaded.size}]`;
      }

      await send({ data: { peerCode: peer.peerCode, text: payload } });
      setText("");
      reload();
    } catch {
      /* handle error */
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (e.target) e.target.value = "";
    }
  };

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending || isUploading) return;
    setSending(true);
    try {
      await send({ data: { peerCode: peer.peerCode, text: value } });
      setText("");
      reload();
    } catch {
      /* keep text so the user can retry */
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="vba-app vba-animate flex flex-col bg-[var(--vba-bg)] text-[var(--vba-text)] overflow-hidden"
      style={{ height: "100dvh" }}
      onClick={() => setUploadMenuOpen(false)}
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

      {/* Lightbox Modal */}
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

      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-[var(--vba-border-soft)] bg-white/95 dark:bg-[var(--vba-bg-2)]/95 px-4 py-3 shrink-0 backdrop-blur-md shadow-xs">
        <button onClick={onBack} className="text-amber-700 dark:text-[var(--vba-gold)] hover:underline text-[14px] font-medium cursor-pointer flex items-center gap-1">
          ‹ {t("m.messages.back")}
        </button>
        <span className="truncate text-[15px] font-bold text-slate-900 dark:text-[var(--vba-text)]">
          {data.peerName}
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {loading && (
          <p className="py-8 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.messages.loading")}
          </p>
        )}
        {error && (
          <p className="py-8 text-center text-[13px] text-[var(--vba-danger,#e05656)]">{error}</p>
        )}
        {!loading && data.messages.length === 0 && (
          <p className="py-8 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.messages.emptyThread")}
          </p>
        )}
        {(() => {
          const lastSeenId = [...data.messages].reverse().find((m) => m.mine && m.seen)?.id;
          return data.messages.map((m) => {
            const content = parseMessageContent(m.text);
            return (
              <div key={m.id} className={`flex flex-col ${m.mine ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[82%] rounded-2xl shadow-xs overflow-hidden ${
                    m.mine
                      ? "vba-gold-grad text-[#1a1206] font-medium shadow-amber-500/10"
                      : "border border-slate-200 dark:border-[var(--vba-border-soft)] bg-white dark:bg-[var(--vba-surface-2)] text-slate-900 dark:text-[var(--vba-text)] shadow-slate-200/50 dark:shadow-none"
                  }`}
                >
                  {content.type === "image" ? (
                    <div className="p-1.5 space-y-1.5">
                      <div
                        onClick={() => setPreviewImageUrl(content.url)}
                        className="group relative cursor-pointer overflow-hidden rounded-xl border border-black/10 dark:border-white/10"
                      >
                        <img
                          src={content.url}
                          alt={content.name || "Hình ảnh"}
                          className="max-h-60 max-w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
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
                          className={`px-2 pb-1 text-[13px] leading-relaxed ${
                            m.mine ? "text-[#1a1206]" : "text-[var(--vba-text)]"
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
                              m.mine
                                ? "bg-black/10 hover:bg-black/15 text-[#1a1206]"
                                : "bg-[var(--vba-surface-2)] hover:bg-[var(--vba-surface-2)]/80 text-[var(--vba-text)] border border-[var(--vba-border-soft)]"
                            }`}
                          >
                            <div
                              className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border font-bold text-[11px] ${badge.color}`}
                            >
                              {badge.label}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-semibold leading-tight">
                                {content.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {content.size ? (
                                  <span
                                    className={`text-[11px] ${
                                      m.mine ? "text-[#1a1206]/70" : "text-[var(--vba-text-dim)]"
                                    }`}
                                  >
                                    {formatFileSize(content.size)}
                                  </span>
                                ) : null}
                                <span
                                  className={`flex items-center gap-0.5 text-[11px] font-medium underline ${
                                    m.mine ? "text-[#1a1206]" : "text-[var(--vba-gold)]"
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
                          className={`px-2 text-[13px] leading-relaxed ${
                            m.mine ? "text-[#1a1206]" : "text-[var(--vba-text)]"
                          }`}
                        >
                          {content.caption}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="px-3.5 py-2 text-[13px]">
                      <p className="whitespace-pre-wrap break-words">{content.text}</p>
                    </div>
                  )}

                  <span
                    className={`px-3.5 pb-1.5 block text-[10px] ${
                      m.mine ? "text-[#1a1206]/75 font-semibold text-right" : "text-[var(--vba-text-dim)]"
                    }`}
                  >
                    {fmt.rel(m.time)}
                  </span>
                </div>
                {m.id === lastSeenId && (
                  <span className="mt-0.5 pr-1 text-[10px] text-[var(--vba-gold)] font-medium">
                    ✓✓ {t("m.messages.seen")}
                  </span>
                )}
              </div>
            );
          });
        })()}
        <div ref={bottomRef} />
      </div>

      {isUploading ? (
        <div className="flex items-center gap-2 border-t border-[var(--vba-border-soft)] bg-[var(--vba-surface-2)] px-4 py-2 text-[12px] text-[var(--vba-gold)] animate-pulse">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          <span className="truncate">{uploadProgress || "Đang tải tệp lên..."}</span>
        </div>
      ) : null}

      <form
        onSubmit={handleSend}
        className="flex items-end gap-2 border-t border-[var(--vba-border-soft)] px-3 py-2.5 shrink-0 bg-[var(--vba-bg-2)]/95 backdrop-blur-md"
        style={{
          paddingBottom:
            keyboardOffset > 0 ? `${keyboardOffset}px` : "max(12px, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex flex-1 items-end gap-2 rounded-2xl bg-[var(--vba-surface-2)] border border-[var(--vba-border-soft)] px-3 py-1.5 focus-within:border-[var(--vba-gold)] transition-colors">
          {/* Attachment + Button */}
          <div className="relative shrink-0 mb-0.5">
            <button
              type="button"
              disabled={isUploading || sending}
              onClick={(e) => {
                e.stopPropagation();
                setUploadMenuOpen(!uploadMenuOpen);
              }}
              aria-label="Đính kèm tệp hoặc ảnh"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--vba-bg-2)] text-[var(--vba-gold)] border border-[var(--vba-border-soft)] hover:bg-[var(--vba-surface-2)] transition-colors cursor-pointer"
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
                className="absolute bottom-10 left-0 z-40 w-48 rounded-2xl border border-[var(--vba-border)] bg-[var(--vba-bg-2)] p-1.5 shadow-2xl backdrop-blur-xl animate-fade-in"
              >
                <button
                  type="button"
                  onClick={() => {
                    setUploadMenuOpen(false);
                    imageInputRef.current?.click();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-[var(--vba-text)] hover:bg-[var(--vba-surface-2)] hover:text-[var(--vba-gold)] cursor-pointer transition-colors"
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
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-[var(--vba-text)] hover:bg-[var(--vba-surface-2)] hover:text-[var(--vba-gold)] cursor-pointer transition-colors"
                >
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-500/15 text-blue-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span>Gửi tài liệu / tệp</span>
                </button>
              </div>
            ) : null}
          </div>

          <textarea
            value={text}
            rows={1}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const form = e.currentTarget.form;
                if (form) form.requestSubmit();
              }
            }}
            placeholder={t("m.messages.inputPlaceholder")}
            maxLength={2000}
            className="chat-input no-focus-outline w-full max-h-[120px] min-h-[28px] resize-none bg-transparent py-1 text-[13.5px] text-[var(--vba-text)] placeholder:text-[var(--vba-text-dim)] border-none outline-none focus:outline-none focus:ring-0 shadow-none leading-relaxed"
            style={{ border: "none", outline: "none", boxShadow: "none" }}
          />

          {text.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setText("");
              }}
              aria-label="Xóa nội dung nhập"
              className="mb-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200/60 text-slate-600 hover:bg-slate-300 hover:text-slate-900 dark:bg-white/10 dark:text-slate-400 dark:hover:bg-white/20 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={sending || isUploading || !text.trim()}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-[#F7D896] via-[#E2B755] to-[#C49338] text-slate-950 font-black disabled:opacity-35 transition-all hover:scale-105 active:scale-95 shadow-[0_2px_12px_rgba(216,178,130,0.4)] cursor-pointer mb-0.5"
          aria-label={t("m.messages.sendAria")}
        >
          {sending || isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-950" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4 fill-current text-slate-950 ml-0.5" aria-hidden="true" />
          )}
        </button>
      </form>
    </div>
  );
}

