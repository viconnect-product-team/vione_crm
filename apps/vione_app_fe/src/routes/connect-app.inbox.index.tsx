// BC-Mobile-8A — Hộp thư nội bộ (danh sách cuộc trò chuyện).
// Chỉ hiển thị cuộc trò chuyện có thật; không tạo danh sách gợi ý ảo.

import { useEffect, useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Loader2, MessageSquare, Plus, Users } from "lucide-react";
import { useLang, useT } from "@/lib/i18n";
import { MobilePage } from "@/components/business-connect/mobile/MobilePage";
import { BusinessConnectTopBar } from "@/components/business-connect/mobile/BusinessConnectTopBar";
import { MobileSearchBar } from "@/components/business-connect/mobile/MobileSearchBar";
import { useDmThreads } from "@/hooks/use-bc-dm";
import type { BcDmThreadSummary } from "@/lib/business-connect/mobile/dm.types";
import { ViOneCreateGroupModal } from "@/components/business-connect/mobile/ViOneCreateGroupModal";
import { PersonalProfileBottomSheet } from "@/components/common/PersonalProfileBottomSheet";

export const Route = createFileRoute("/connect-app/inbox/")({
  head: () => ({
    meta: [
      { title: "Tin nhắn — ViOne Connect" },
      {
        name: "description",
        content: "Hộp thư nội bộ ViOne Connect: trao đổi trực tiếp với các kết nối đã chấp nhận.",
      },
      { property: "og:title", content: "Tin nhắn — ViOne Connect" },
      {
        property: "og:description",
        content: "Trao đổi trực tiếp trong ứng dụng với những người bạn đã kết nối.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InboxPage,
});

function timeLabel(iso: string | null, locale: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const sameDay = new Date().toDateString() === d.toDateString();
  return sameDay
    ? d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
}

import { resolveMediaUrl } from "@/lib/api-client";

function Avatar({ thread }: { thread: BcDmThreadSummary }) {
  const [imgError, setImgError] = useState(false);
  const resolvedUrl = resolveMediaUrl(thread.avatarUrl);

  return (
    <div className="relative shrink-0">
      {resolvedUrl && !imgError ? (
        <img
          src={resolvedUrl}
          alt={thread.displayName}
          onError={() => setImgError(true)}
          className="h-12 w-12 rounded-full object-cover ring-1 ring-[#D8B282]/30"
          loading="lazy"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1c2433] text-[15px] font-semibold text-[#D8B282] ring-1 ring-[#D8B282]/30">
          {(thread as any).isGroup ? (
            <Users className="h-6 w-6 text-[var(--bc-mobile-accent,#C29B69)]" />
          ) : (
            thread.displayName.trim().charAt(0).toUpperCase() || "?"
          )}
        </div>
      )}
      {thread.isOnline ? (
        <span
          className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-[#22c55e] ring-2 ring-[#0a1019]"
          title="Đang hoạt động"
        />
      ) : null}
    </div>
  );
}

function formatMessagePreview(raw?: string | null, isFromMe?: boolean, youPrefix = ""): string {
  if (!raw) return "";
  const text = raw.trim();
  const prefix = isFromMe ? youPrefix : "";

  // Payment action format: [action:payment|amount:X|invoice:Y|...]
  if (/\[action:payment/i.test(text)) {
    return `${prefix}💳 [Giao dịch] Thông báo thanh toán`;
  }

  // Image tag format: image:URL|NAME or image:URL or raw image url
  if (
    /\[image:(https?:\/\/[^|\]]+)(?:\|([^\]]*))?\]/i.test(text) ||
    /^(https?:\/\/[^\s]+?\.(png|jpe?g|gif|webp|svg))(?:\?.*)?$/i.test(text)
  ) {
    return `${prefix}📷 [Hình ảnh]`;
  }

  // File tag format: file:URL|NAME|SIZE
  const fileMatch = text.match(/\[file:(https?:\/\/[^|\]]+)(?:\|([^|\]]*))?(?:\|(\d+))?\]/i);
  if (fileMatch) {
    const fileName = fileMatch[2] || "Tài liệu";
    return `${prefix}📎 [Tệp] ${fileName}`;
  }

  // Voice tag format: voice:URL|DURATION
  if (/\[voice:(https?:\/\/[^|\]]+|data:audio\/[^|\]]+)(?:\|(\d+))?\]/i.test(text)) {
    return `${prefix}🎙️ [Tin nhắn thoại]`;
  }

  // Call tag format: call:TYPE|status:STATUS|duration:SECONDS
  const callMatch = text.match(/\[call:(audio|video)(?:\|status:(ended|missed|declined))?(?:\|duration:(\d+))?\]/i);
  if (callMatch) {
    const isVideo = callMatch[1].toLowerCase() === "video";
    const status = callMatch[2]?.toLowerCase() || "ended";
    if (status === "missed") {
      return `${prefix}📵 [Cuộc gọi ${isVideo ? "video " : ""}nhỡ]`;
    }
    if (status === "declined") {
      return `${prefix}🚫 [Cuộc gọi ${isVideo ? "video " : ""}bị từ chối]`;
    }
    return `${prefix}📞 [Cuộc gọi ${isVideo ? "video" : "thoại"}]`;
  }

  return `${prefix}${text}`;
}

type InboxFilter = "all" | "unread" | "groups" | "requests";

function InboxPage() {
  const t = useT();
  const { lang } = useLang();
  const locale = lang === "en" ? "en-GB" : "vi-VN";
  const query = useDmThreads();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<InboxFilter>("all");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [selectedProfileThread, setSelectedProfileThread] = useState<BcDmThreadSummary | null>(null);

  // Nhóm cục bộ đã tạo
  const [localGroups, setLocalGroups] = useState<BcDmThreadSummary[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("vione_local_groups") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const onGroupCreated = (e: any) => {
      if (e.detail) {
        setLocalGroups((prev) => [e.detail, ...prev]);
      }
    };
    window.addEventListener("vione_group_created", onGroupCreated);
    return () => window.removeEventListener("vione_group_created", onGroupCreated);
  }, []);

  const result = query.data;
  const rawRemoteThreads = Array.isArray(result)
    ? result
    : result?.ok && Array.isArray(result.threads)
      ? result.threads
      : [];
  const isError = query.isError || (result != null && typeof result === "object" && "ok" in result && !result.ok);

  const threads = useMemo(() => {
    const list = [...localGroups, ...rawRemoteThreads];
    // Đảm bảo tin nhắn mới nhất luôn nổi lên đầu tiên
    return list.sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [localGroups, rawRemoteThreads]);

  // Phân loại danh mục chuẩn Messenger:
  // - Tất cả: Toàn bộ hội thoại do chính tài khoản này đã nhắn tin tới (lastMessageFromMe), hội thoại đã có tin nhắn, nhóm, và người đã kết nối
  const allThreads = useMemo(() => {
    return threads.filter((t) => {
      if ((t as any).isGroup) return true;
      if (t.lastMessageFromMe) return true;
      if (Boolean(t.lastMessagePreview)) return true;
      if (t.isConnected !== false) return true;
      return false;
    });
  }, [threads]);

  const connectedThreads = useMemo(() => threads.filter((t) => t.isConnected !== false), [threads]);
  const groupThreads = useMemo(() => threads.filter((t) => (t as any).isGroup), [threads]);
  const unreadConnectedThreads = useMemo(
    () => allThreads.filter((t) => (t.unreadCount || 0) > 0),
    [allThreads],
  );
  // Tin nhắn chờ: Chỉ chứa tin nhắn từ người lạ CHƯA kết nối gửi đến và KHÔNG PHẢI do chính tài khoản này gửi đi
  const pendingThreads = useMemo(
    () => threads.filter((t) => t.isConnected === false && !t.lastMessageFromMe && Boolean(t.lastMessagePreview)),
    [threads],
  );

  const unreadCount = useMemo(
    () => unreadConnectedThreads.reduce((sum, t) => sum + (t.unreadCount || 0), 0),
    [unreadConnectedThreads],
  );
  const requestsCount = pendingThreads.length;

  const normalize = (s: string) =>
    (s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .trim();

  const q = normalize(searchTerm);

  const baseThreads = useMemo(() => {
    if (activeTab === "unread") return unreadConnectedThreads;
    if (activeTab === "groups") return groupThreads;
    if (activeTab === "requests") return pendingThreads;
    return allThreads;
  }, [activeTab, unreadConnectedThreads, groupThreads, pendingThreads, allThreads]);

  const filteredThreads = useMemo(() => {
    if (!q) return baseThreads;
    return baseThreads.filter((thread) => {
      const name = normalize(thread.displayName);
      const company = normalize(thread.companyName || "");
      const headline = normalize(thread.headline || "");
      const msg = normalize(thread.lastMessagePreview || "");
      return name.includes(q) || company.includes(q) || headline.includes(q) || msg.includes(q);
    });
  }, [baseThreads, q]);

  return (
    <MobilePage>
      <BusinessConnectTopBar title={t("bc.mobile.inbox.title")} back />
      <div className="grid gap-4 pt-5">
        <p className="text-[12.5px] leading-snug text-slate-500 dark:text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.inbox.desc")}
        </p>

        {/* Search bar and Create Group Button */}
        <div className="flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <MobileSearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Tìm người liên hệ, nhóm phòng ban..."
            />
          </div>
          <button
            type="button"
            onClick={() => setIsCreateGroupOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-[var(--bc-mobile-accent-grad)] px-3.5 py-2.5 text-xs font-bold text-black shadow-xs hover:opacity-95 active:scale-95 transition cursor-pointer"
            title="Tạo nhóm làm việc mới"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Tạo nhóm</span>
          </button>
        </div>

        {/* Messenger-style Segmented Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-[var(--bc-mobile-accent-grad)] text-black border border-[var(--bc-mobile-border-gold)] font-bold shadow-xs"
                : "border border-slate-200 dark:border-[var(--bc-mobile-border)] bg-white dark:bg-[var(--bc-mobile-surface)] text-slate-700 dark:text-[var(--bc-mobile-muted)] hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>Tất cả</span>
            <span className="text-[11px] opacity-80">({allThreads.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("groups")}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "groups"
                ? "bg-[var(--bc-mobile-accent-grad)] text-black border border-[var(--bc-mobile-border-gold)] font-bold shadow-xs"
                : "border border-slate-200 dark:border-[var(--bc-mobile-border)] bg-white dark:bg-[var(--bc-mobile-surface)] text-slate-700 dark:text-[var(--bc-mobile-muted)] hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>Nhóm</span>
            <span className="text-[11px] opacity-80">({groupThreads.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("unread")}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "unread"
                ? "bg-[var(--bc-mobile-accent-grad)] text-black border border-[var(--bc-mobile-border-gold)] font-bold shadow-xs"
                : "border border-slate-200 dark:border-[var(--bc-mobile-border)] bg-white dark:bg-[var(--bc-mobile-surface)] text-slate-700 dark:text-[var(--bc-mobile-muted)] hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>Chưa đọc</span>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10.5px] font-bold text-white">
                {unreadCount}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "requests"
                ? "bg-[var(--bc-mobile-accent-grad)] text-black border border-[var(--bc-mobile-border-gold)] font-bold shadow-xs"
                : "border border-slate-200 dark:border-[var(--bc-mobile-border)] bg-white dark:bg-[var(--bc-mobile-surface)] text-slate-700 dark:text-[var(--bc-mobile-muted)] hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>Tin nhắn chờ</span>
            {requestsCount > 0 ? (
              <span className="rounded-full bg-[var(--bc-mobile-accent)] px-1.5 py-0.2 text-[10.5px] font-bold text-black">
                {requestsCount}
              </span>
            ) : null}
          </button>
        </div>

        {/* Info banner for Message Requests */}
        {activeTab === "requests" ? (
          <div className="rounded-2xl border border-[var(--bc-mobile-border-gold)]/30 bg-[var(--bc-mobile-surface-2)] p-3.5 text-[12px] text-slate-700 dark:text-[var(--bc-mobile-muted)] leading-relaxed">
            <span className="font-bold text-slate-900 dark:text-[var(--bc-mobile-text)]">
              📩 Tin nhắn từ người chưa kết nối:
            </span>{" "}
            Người gửi không thể thấy trạng thái bạn đã đọc cho đến khi bạn đồng ý kết nối hoặc trả lời tin nhắn.
          </div>
        ) : null}

        {query.isLoading ? (
          <div className="flex items-center gap-2 py-10 text-[13px] text-[var(--bc-mobile-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t("bc.mobile.inbox.loading")}
          </div>
        ) : isError ? (
          <p className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-4 text-[13px] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.inbox.error")}
          </p>
        ) : baseThreads.length === 0 ? (
          <div className="grid justify-items-center gap-2 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-5 py-10 text-center">
            <MessageSquare
              className="h-6 w-6 text-[var(--bc-mobile-accent)]"
              aria-hidden="true"
            />
            <p className="text-[14px] font-semibold text-slate-900 dark:text-[var(--bc-mobile-text)]">
              {activeTab === "requests"
                ? "Không có tin nhắn chờ nào"
                : activeTab === "unread"
                  ? "Bạn đã đọc hết tin nhắn"
                  : t("bc.mobile.inbox.empty.title")}
            </p>
            <p className="text-[12.5px] leading-snug text-slate-500 dark:text-[var(--bc-mobile-muted)]">
              {activeTab === "requests"
                ? "Tin nhắn từ người gửi lạ hoặc đối tác từ AI gợi ý chưa kết nối sẽ xuất hiện tại đây mà không làm phiền thông báo chính."
                : activeTab === "unread"
                  ? "Không có tin nhắn chưa đọc nào từ các đối tác đã kết nối."
                  : t("bc.mobile.inbox.empty.desc")}
            </p>
            {activeTab === "all" ? (
              <Link
                to="/connect-app/network"
                className="mt-1 rounded-full border border-[var(--bc-mobile-border)] px-4 py-2 text-[12.5px] text-slate-800 dark:text-[var(--bc-mobile-text)] hover:bg-slate-100 dark:hover:bg-white/5"
              >
                {t("bc.mobile.inbox.empty.cta")}
              </Link>
            ) : null}
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="grid justify-items-center gap-2 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-5 py-8 text-center">
            <p className="text-[13.5px] font-medium text-[var(--bc-mobile-text)]">
              Không tìm thấy cuộc trò chuyện phù hợp
            </p>
            <p className="text-[12px] text-[var(--bc-mobile-muted)]">
              Thử tìm kiếm với tên hoặc từ khóa khác
            </p>
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="mt-1 text-[12.5px] text-[var(--bc-mobile-accent)] hover:underline cursor-pointer"
            >
              Xóa tìm kiếm
            </button>
          </div>
        ) : (
          <ul className="grid gap-2">
            {filteredThreads.map((thread) => (
              <li key={thread.threadId}>
                <Link
                  to="/connect-app/inbox/$threadId"
                  params={{ threadId: thread.threadId }}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-[var(--bc-mobile-border)] bg-white dark:bg-[var(--bc-mobile-surface)] p-3 active:opacity-80 shadow-xs hover:border-[var(--bc-mobile-border-gold)]/50 transition-colors"
                >
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedProfileThread(thread);
                    }}
                    className="cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                    title="Bấm để xem hồ sơ đối tác"
                  >
                    <Avatar thread={thread} />
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[14px] font-bold text-slate-900 dark:text-[var(--bc-mobile-text)]">
                        {thread.displayName}
                      </span>
                      <span className="shrink-0 text-[11px] text-slate-500 dark:text-[var(--bc-mobile-muted)] font-medium">
                        {timeLabel(thread.lastMessageAt, locale)}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className="truncate text-[12.5px] text-slate-600 dark:text-[var(--bc-mobile-muted)] font-normal">
                        {thread.lastMessagePreview
                          ? formatMessagePreview(
                              thread.lastMessagePreview,
                              thread.lastMessageFromMe,
                              t("bc.mobile.inbox.you"),
                            )
                          : t("bc.mobile.inbox.noMessage")}
                      </span>
                      {/* Chỉ hiển thị badge chưa đọc của cuộc trò chuyện */}
                      {thread.unreadCount > 0 ? (
                        <span className="ml-auto shrink-0 rounded-full bg-[var(--bc-mobile-accent)] px-2 py-0.5 text-[11px] font-semibold text-[var(--bc-mobile-on-accent,#04111F)]">
                          {thread.unreadCount}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ViOneCreateGroupModal
        open={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />

      {/* Sheet xem hồ sơ cá nhân khi bấm vào avatar */}
      <PersonalProfileBottomSheet
        open={Boolean(selectedProfileThread)}
        onClose={() => setSelectedProfileThread(null)}
        profile={{
          displayName: selectedProfileThread?.displayName || "Thành viên ViOne",
          avatarUrl: selectedProfileThread?.avatarUrl || null,
          jobTitle: (selectedProfileThread as any)?.isGroup ? "Nhóm làm việc" : "Hội viên kết nối",
          companyName: (selectedProfileThread as any)?.isGroup ? "Cộng đồng ViOne" : "Doanh nghiệp ViOne",
          phone: null,
          email: null,
        }}
      />
    </MobilePage>
  );
}
