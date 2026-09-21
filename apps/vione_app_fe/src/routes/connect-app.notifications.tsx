// Trung tâm thông báo riêng cho Connect-app (/connect-app/notifications).
// Giao diện tối "Executive Minimal Luxury", đọc/ghi qua SDK thông báo sẵn có
// (không kho dữ liệu song song, không badge ảo).

import { useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Bell, Check, CheckCheck, Loader2, Undo2, Trash2, MessageSquare, X, CheckCircle2, Sparkles, AlertTriangle, ArrowRight, Trophy } from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";
import { hasTKey, useLang, useT } from "@/lib/i18n";
import { MobilePage } from "@/components/business-connect/mobile/MobilePage";
import { BusinessConnectTopBar } from "@/components/business-connect/mobile/BusinessConnectTopBar";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkNotificationUnread,
  useDeleteNotification,
} from "@/hooks/use-bc-notifications";
import { GlobalNetworkSDK } from "@/lib/global-network/network.sdk";
import type { NotificationDTO } from "@/lib/business-connect/notification-orchestration/types";

export const Route = createFileRoute("/connect-app/notifications")({
  head: () => ({
    meta: [
      { title: "Thông báo — ViOne Connect" },
      {
        name: "description",
        content:
          "Trung tâm thông báo ViOne Connect: lời mời kết nối, cộng đồng, cuộc gặp và nhắc việc.",
      },
      { property: "og:title", content: "Thông báo — ViOne Connect" },
      {
        property: "og:description",
        content: "Theo dõi lời mời kết nối, hoạt động cộng đồng và nhắc việc trong ViOne Connect.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConnectAppNotificationsPage,
});

type Tab = "unread" | "all";

const NOTIFICATION_KIND_TITLES: Record<string, string> = {
  connection_request_received: "Lời mời kết nối mới",
  connection_request_accepted: "Lời mời kết nối đã được chấp nhận",
  connection_request_declined: "Lời mời kết nối đã bị từ chối",
  meeting_upcoming_reminder: "Lịch hẹn sắp diễn ra",
  meeting_confirmed: "Cuộc gặp đã được xác nhận",
  meeting_cancelled: "Cuộc gặp đã bị huỷ",
  moment_new_comment: "{commenterName} đã bình luận về khoảnh khắc của bạn",
  moment_reply_comment: "{commenterName} đã phản hồi bình luận của bạn",
  moment_user_mention: "Bạn được nhắc tên trong khoảnh khắc của {mentionerName}",
  opportunity_new: "Cơ hội kinh doanh mới",
  opportunity_claimed: "Bạn đã nhận cơ hội",
  opportunity_claimed_by_peer: "Cơ hội của bạn đã có người tiếp nhận",
  opportunity_interest_sent: "Đã gửi mức độ quan tâm cơ hội",
  opportunity_received: "Tiếp nhận cơ hội thành công",
  system_broadcast: "Thông báo hệ thống",
  community_post_new: "Bài viết mới trong cộng đồng",
};

/** Chèn dữ liệu hiển thị an toàn ({communityName}, ...) vào chuỗi đã dịch. */
function fill(text: string, data: unknown): string {
  if (!text || !data || typeof data !== "object") return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) => {
    const v = (data as Record<string, unknown>)[k];
    return typeof v === "string" || typeof v === "number" ? String(v) : m;
  });
}

function resolveText(
  t: ReturnType<typeof useT>,
  keyOrText: string | undefined | null,
  fallbackKind?: string,
  displayData?: any
): string {
  if (keyOrText) {
    if (hasTKey(keyOrText)) return fill(t(keyOrText as any), displayData);
    if (NOTIFICATION_KIND_TITLES[keyOrText]) return fill(NOTIFICATION_KIND_TITLES[keyOrText], displayData);
    // If it's already a Vietnamese or human-readable sentence/phrase:
    if (keyOrText.includes(" ") || keyOrText.length > 20) {
      return fill(keyOrText, displayData);
    }
  }
  if (fallbackKind && NOTIFICATION_KIND_TITLES[fallbackKind]) {
    return fill(NOTIFICATION_KIND_TITLES[fallbackKind], displayData);
  }
  if (keyOrText && !keyOrText.includes("_")) {
    return fill(keyOrText, displayData);
  }
  if (displayData?.message) return String(displayData.message);
  if (displayData?.content) return String(displayData.content);
  if (fallbackKind === "system_broadcast") return "Thông báo hệ thống";
  if (fallbackKind === "opportunity_claimed") return "Tiếp nhận cơ hội thành công";
  if (fallbackKind === "opportunity_claimed_by_peer") return "Cơ hội của bạn đã có người tiếp nhận";
  if (fallbackKind === "opportunity_interest_sent") return "Đã gửi mức độ quan tâm cơ hội";
  if (fallbackKind) return fallbackKind.replace(/_/g, " ");
  return "";
}

function timeLabel(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ConnectAppNotificationsPage() {
  const t = useT();
  const { lang } = useLang();
  const locale = lang === "en" ? "en-GB" : "vi-VN";
  const [tab, setTab] = useState<Tab>("unread");
  const [actionStates, setActionStates] = useState<Record<string, "accepted" | "declined">>({});
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>({});

  const handleQuickVote = async (pollId: string, optionId: string) => {
    try {
      setVotedPolls((prev) => ({ ...prev, [pollId]: optionId }));
      await fetchNestApi(`/voting/polls/${pollId}/vote`, {
        method: "POST",
        body: JSON.stringify({ optionId, sourceApp: "vione_app" }),
      });
      toast.success("Đã ghi nhận biểu quyết của bạn qua ViOne App!");
    } catch (e: any) {
      toast.error(e?.message || "Không thể gửi biểu quyết");
    }
  };

  const query = useNotifications({ unreadOnly: tab === "unread", limit: 30 });
  const markRead = useMarkNotificationRead();
  const markUnread = useMarkNotificationUnread();
  const deleteNotif = useDeleteNotification();

  const items: NotificationDTO[] = useMemo(() => query.data?.items ?? [], [query.data]);
  const unreadItems = items.filter((n) => n.readAt === null);
  const busy = markRead.isPending || markUnread.isPending || deleteNotif.isPending;

  const tabs: Array<{ value: Tab; text: string }> = [
    { value: "unread", text: t("bc.mobile.notifications.page.tab.unread") },
    { value: "all", text: t("bc.mobile.notifications.page.tab.all") },
  ];

  const handleAcceptConnection = async (notifId: string, connectionId: string) => {
    setActionStates((prev) => ({
      ...prev,
      [notifId]: "accepted",
      [connectionId]: "accepted",
    }));
    try {
      await GlobalNetworkSDK.mutations.accept(connectionId);
      markRead.mutate({ id: notifId });
      void query.refetch();
      toast.success("Đã đồng ý kết nối thành công!");
    } catch {
      toast.error("Có lỗi xảy ra khi chấp nhận kết nối.");
    }
  };

  const handleDeclineConnection = async (notifId: string, connectionId: string) => {
    setActionStates((prev) => ({
      ...prev,
      [notifId]: "declined",
      [connectionId]: "declined",
    }));
    try {
      await GlobalNetworkSDK.mutations.decline(connectionId);
      markRead.mutate({ id: notifId });
      void query.refetch();
      toast.info("Đã từ chối lời mời.");
    } catch {
      // ignore
    }
  };

  const handleDeleteNotification = async (notifId: string) => {
    try {
      await deleteNotif.mutateAsync({ id: notifId });
      void query.refetch();
      toast.success("Đã xóa thông báo");
    } catch {
      toast.error("Không thể xóa thông báo");
    }
  };

  return (
    <MobilePage>
      <BusinessConnectTopBar title={t("bc.mobile.notifications.page.title")} back />
      <div className="grid gap-3.5 pt-4">
        <p className="text-[12.5px] leading-snug text-slate-500 dark:text-slate-400">
          {t("bc.mobile.notifications.page.desc")}
        </p>

        {/* Thanh Tab Segmented Control siêu tinh tế */}
        <div
          role="tablist"
          aria-label={t("bc.mobile.notifications.page.title")}
          className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#121926] border border-slate-200/80 dark:border-[#243042]"
        >
          {tabs.map((item) => {
            const isActive = tab === item.value;
            const count = item.value === "unread" ? unreadItems.length : items.length;

            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(item.value)}
                className={`min-h-[38px] flex-1 rounded-lg px-3 text-xs sm:text-[13px] font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                  isActive
                    ? "bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#F6E1C3] shadow-sm border border-slate-200 dark:border-[#D8B282]/40"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-white/5 border border-transparent"
                }`}
              >
                <span>{item.text}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-bold tabular-nums ${
                      isActive
                        ? "bg-amber-500/15 dark:bg-[#D8B282]/20 text-amber-700 dark:text-[#F6E1C3] border border-amber-500/20 dark:border-[#D8B282]/30"
                        : "bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {unreadItems.length > 0 ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              for (const n of unreadItems) markRead.mutate({ id: n.id });
            }}
            data-testid="bc-notifications-mark-all"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-[#D8B282]/40 bg-white dark:bg-[#121926] text-xs font-semibold text-slate-700 dark:text-[#D8B282] hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-xs disabled:opacity-60 cursor-pointer"
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <CheckCheck className="size-3.5" aria-hidden />
            )}
            {t("bc.mobile.notifications.page.markAll")}
          </button>
        ) : null}

        {query.isPending ? (
          <ul className="grid gap-3" aria-hidden>
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="h-[96px] animate-pulse rounded-2xl border border-slate-200 dark:border-[#243042] bg-slate-100 dark:bg-[#121926]"
              />
            ))}
          </ul>
        ) : query.isError ? (
          <section className="rounded-2xl border border-slate-200 dark:border-[#243042] bg-white dark:bg-[#121926] p-6 text-center">
            <p role="alert" className="text-[14px] text-slate-500 dark:text-slate-400">
              {t("bc.mobile.notifications.page.error")}
            </p>
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="mt-3 min-h-10 rounded-full bg-slate-900 dark:bg-slate-100 px-6 text-[13px] font-semibold text-white dark:text-slate-900 cursor-pointer"
            >
              {t("bc.mobile.notifications.page.retry")}
            </button>
          </section>
        ) : items.length === 0 ? (
          <section className="flex flex-col items-center gap-2.5 rounded-2xl border border-slate-200 dark:border-[#243042] bg-white dark:bg-[#0c121d] px-6 py-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-[#D8B282]">
              <Bell className="size-6" strokeWidth={1.8} aria-hidden />
            </div>
            <p className="text-[14.5px] font-bold text-slate-900 dark:text-slate-100">
              {tab === "unread"
                ? t("bc.mobile.notifications.page.empty.unread")
                : t("bc.mobile.notifications.page.empty.all")}
            </p>
            <p className="max-w-[32ch] text-[12.5px] text-slate-500 dark:text-slate-400">
              {t("bc.mobile.notifications.page.empty.hint")}
            </p>
          </section>
        ) : (
          <ul
            aria-label={t("bc.mobile.notifications.page.title")}
            className="grid gap-3"
            data-testid="bc-notifications-list"
          >
            {items.map((n: any) => {
              const unread = n.readAt === null;
              const isConnectionNotification =
                n.notificationKind === "connection_request_received" ||
                n.notificationKind === "connection_request_accepted" ||
                n.sourceDomain === "connection" ||
                n.titleKey === "connection_request_received";
              const isOpportunityNotification =
                n.sourceDomain === "opportunity" ||
                n.notificationKind?.startsWith("opportunity") ||
                Boolean(n.safeDisplayData?.opportunityId);
              const isPollNotification =
                n.notificationKind === "interactive_poll" ||
                n.sourceDomain === "voting" ||
                n.eventKind === "poll_created" ||
                Boolean(n.safeDisplayData?.pollId);
              const isPollClosed =
                n.eventKind === "poll_closed" ||
                n.notificationKind === "poll_result" ||
                (n.sourceDomain === "voting" && n.safeDisplayData?.status === "closed") ||
                Boolean(n.safeDisplayData?.winner);
              const isInvoiceReminder =
                n.notificationKind === "overdue_payment_reminder" ||
                n.sourceDomain === "finance" ||
                n.eventKind === "invoice_reminder" ||
                Boolean(n.safeDisplayData?.invoiceId);
              const connectionId = n.sourceRecordId || n.safeDisplayData?.connectionId;
              const opportunityId = n.safeDisplayData?.opportunityId || (n.sourceDomain === "opportunity" ? n.sourceRecordId : null);
              const communityId = n.safeDisplayData?.communityId || n.associationId || "clb-ceo-1983";
              const opportunityRoute = opportunityId
                ? `/connect-app/community/${communityId}/opportunities/${opportunityId}`
                : null;
              const senderUserId =
                n.safeDisplayData?.counterpartUserId || n.actorUserId;
              const profileRoute = senderUserId
                ? `/connect-app/network/u:${senderUserId}`
                : n.action?.targetRoute || "/connect-app/network";

              const resolvedStatus =
                actionStates[n.id] ||
                (connectionId ? actionStates[connectionId] : null) ||
                n.safeDisplayData?.connectionStatus ||
                (n.notificationKind === "connection_request_accepted" ? "accepted" : "pending");

              const displayTitle = resolveText(t, n.titleKey, n.notificationKind, n.safeDisplayData);
              const displayBody =
                resolveText(t, n.bodyKey, "", n.safeDisplayData) ||
                n.safeDisplayData?.message ||
                n.safeDisplayData?.body ||
                "";

              return (
                <li
                  key={n.id}
                  className={`rounded-2xl border p-4 transition-all relative overflow-hidden ${
                    unread
                      ? "bg-amber-50/40 dark:bg-[#121927] border-amber-300/60 dark:border-[#D8B282]/50 shadow-xs"
                      : "bg-white dark:bg-[#0c121d] border-slate-200 dark:border-[#243042] hover:border-slate-300 dark:hover:border-[#334155]"
                  }`}
                >
                  {unread && (
                    <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-amber-500 dark:bg-[#D8B282]" />
                  )}
                  {/* Hàng trên cùng: Nhãn phân loại + Nút Xóa thông báo (Thùng rác rõ nét) */}
                  <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-[#1e293b]">
                    <div className="flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className={`size-2 shrink-0 rounded-full ${
                          unread ? "bg-amber-500 dark:bg-[#D8B282]" : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      />
                      <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-500/10 dark:bg-[#D8B282]/15 text-amber-700 dark:text-[#D8B282] border border-amber-500/20 dark:border-[#D8B282]/30 uppercase tracking-wider">
                        {isOpportunityNotification
                          ? "Cơ hội B2B"
                          : isConnectionNotification
                          ? "Kết nối B2B"
                          : isPollNotification
                          ? "Biểu quyết"
                          : isInvoiceReminder
                          ? "Nhắc nợ"
                          : "Thông báo"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400 dark:text-slate-400">
                        {timeLabel(n.createdAt, locale)}
                      </span>
                      {/* NÚT XÓA THÔNG BÁO RÕ NÉT */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteNotification(n.id);
                        }}
                        aria-label="Xóa thông báo"
                        title="Xóa thông báo này"
                        className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 border border-transparent hover:border-red-200 dark:hover:border-red-500/30 transition-all cursor-pointer ml-1"
                      >
                        <Trash2 className="size-3.5" strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>

                  {/* Nội dung thông báo */}
                  <div className="pt-2.5">
                    <p className="text-[14px] sm:text-[14.5px] font-bold leading-snug text-slate-900 dark:text-slate-100">
                      {displayTitle}
                    </p>

                    {displayBody ? (
                      <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                        {displayBody}
                      </p>
                    ) : null}

                    {/* Thẻ biểu quyết tương tác trực tiếp (Đang mở) */}
                    {isPollNotification && !isPollClosed && n.safeDisplayData?.options && (
                      <div className="mt-3 p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="text-[11.5px] font-bold text-amber-800 dark:text-amber-300">
                            Bình chọn ý kiến của bạn:
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300 font-bold border border-sky-500/20">
                            📱 Bỏ phiếu qua ViOne App
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {n.safeDisplayData.options.map((opt: any) => {
                            const pollId = n.safeDisplayData.pollId || n.sourceRecordId;
                            const isSelected = votedPolls[pollId] === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleQuickVote(pollId, opt.id)}
                                className={`w-full p-2.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                                    : "bg-white dark:bg-[#151f2e] border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-amber-400"
                                }`}
                              >
                                <span>{opt.title}</span>
                                {isSelected ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold">
                                    <Check className="size-3.5" />
                                    <span>Đã chọn</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">Bình chọn</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {votedPolls[n.safeDisplayData.pollId || n.sourceRecordId] && (
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 pt-1">
                            <CheckCircle2 className="size-3.5" />
                            <span>Đã ghi nhận biểu quyết thành công qua ViOne App.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Thẻ kết quả biểu quyết đã kết thúc */}
                    {isPollClosed && n.safeDisplayData?.options && (
                      <div className="mt-3 p-3.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[12px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            <Trophy className="size-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Kết quả biểu quyết (Đã kết thúc)</span>
                          </div>
                          <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
                            {n.safeDisplayData.totalVotes || 0} lượt bầu
                          </span>
                        </div>

                        {n.safeDisplayData.winner && (
                          <div className="p-2.5 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/30 flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                              🏆 Phương án chiến thắng: {n.safeDisplayData.winner.title}
                            </span>
                            <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                              {n.safeDisplayData.winner.percentage}%
                            </span>
                          </div>
                        )}

                        <div className="space-y-2 pt-1">
                          {n.safeDisplayData.options.map((opt: any) => {
                            const isWinner = n.safeDisplayData.winner?.id === opt.id || opt.isLeading;
                            return (
                              <div key={opt.id} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className={`font-medium ${isWinner ? "font-bold text-emerald-800 dark:text-emerald-300" : "text-slate-700 dark:text-slate-300"}`}>
                                    {opt.title} {isWinner && "✓"}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                    {opt.votesCount || opt.votes_count || 0} phiếu ({opt.percentage || 0}%)
                                  </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${isWinner ? "bg-emerald-500" : "bg-slate-400 dark:bg-slate-500"}`}
                                    style={{ width: `${Math.max(Number(opt.percentage || 0), 2)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {n.safeDisplayData.sourceStats && (
                          <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap items-center gap-2 text-[10.5px] text-slate-600 dark:text-slate-300">
                            <span className="font-semibold">Nguồn tham gia:</span>
                            <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-300 font-medium">
                              📱 ViOne: {n.safeDisplayData.sourceStats.vioneApp || 0}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium">
                              🏛️ Hiệp hội: {n.safeDisplayData.sourceStats.associationApp || 0}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Thẻ thông báo nhắc nợ quá hạn thanh toán */}
                    {isInvoiceReminder && (
                      <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2">
                        <div className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                          <AlertTriangle className="size-3.5 text-red-500" />
                          <span>Chi tiết hóa đơn quá hạn</span>
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300">
                          Số tiền: <strong className="text-red-600 dark:text-red-400">{Number(n.safeDisplayData?.amount || 0).toLocaleString("vi-VN")} đ</strong>
                          {n.safeDisplayData?.dueDate && ` • Hạn chót: ${n.safeDisplayData.dueDate}`}
                        </div>
                        <Link
                          to="/fees"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 text-white text-[11.5px] font-bold shadow-xs hover:bg-red-700 transition-colors"
                        >
                          <span>Kiểm tra & Thanh toán ngay</span>
                          <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    )}

                    {/* Hàng nút hành động */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {isConnectionNotification && connectionId ? (
                        <>
                          {resolvedStatus === "accepted" ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="size-3.5 text-emerald-500 dark:text-emerald-400" />
                                <span>Đã kết nối</span>
                              </span>
                              {senderUserId && (
                                <Link
                                  to="/connect-app/inbox/$threadId"
                                  params={{ threadId: senderUserId }}
                                  className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#F6E1C3] via-[#D8B282] to-[#C29B69] px-3.5 text-[12px] font-bold text-slate-950 shadow-xs hover:brightness-105 active:scale-95 transition-all"
                                >
                                  <MessageSquare className="size-3.5" />
                                  <span>Nhắn tin</span>
                                </Link>
                              )}
                              <Link
                                to={profileRoute}
                                className="inline-flex min-h-8 items-center rounded-full border border-slate-300 dark:border-[#334155] bg-slate-50 dark:bg-[#1e293b] px-3 text-[12px] font-semibold text-slate-700 dark:text-slate-200 hover:border-amber-400 dark:hover:border-[#D8B282] transition-colors"
                              >
                                Xem hồ sơ
                              </Link>
                            </div>
                          ) : resolvedStatus === "declined" ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                <X className="size-3.5" />
                                <span>Đã từ chối lời mời</span>
                              </span>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAcceptConnection(n.id, connectionId)}
                                className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#F6E1C3] via-[#D8B282] to-[#C29B69] px-3.5 text-[12px] font-bold text-slate-950 shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                              >
                                <Check className="size-3.5" strokeWidth={2.5} />
                                <span>Đồng ý kết bạn</span>
                              </button>

                              <Link
                                to={profileRoute}
                                className="inline-flex min-h-8 items-center rounded-full border border-slate-300 dark:border-[#334155] bg-slate-50 dark:bg-[#1e293b] px-3 text-[12px] font-semibold text-slate-700 dark:text-slate-200 hover:border-amber-400 dark:hover:border-[#D8B282] transition-colors"
                              >
                                Xem hồ sơ
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleDeclineConnection(n.id, connectionId)}
                                className="inline-flex min-h-8 items-center rounded-full border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 px-3 text-[11.5px] font-medium transition-colors cursor-pointer"
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {isOpportunityNotification && opportunityRoute ? (
                            <Link
                              to={opportunityRoute}
                              className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-[var(--bc-mobile-accent-grad)] px-3.5 text-[12px] font-bold text-black shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                            >
                              <Sparkles className="size-3.5 text-black" />
                              <span>Xem chi tiết cơ hội</span>
                            </Link>
                          ) : null}

                          {n.action?.targetRoute && n.action.targetRoute !== opportunityRoute ? (
                            <Link
                              to={n.action.targetRoute}
                              search={(n.action.targetSearch ?? undefined) as never}
                              className="inline-flex min-h-8 items-center rounded-full border border-amber-400/60 dark:border-[#D8B282] bg-amber-50/50 dark:bg-[#D8B282]/10 px-3.5 text-[12px] font-semibold text-amber-800 dark:text-[#D8B282] transition-colors hover:brightness-105"
                            >
                              {resolveText(t, n.action.labelKey, t("bc.mobile.notifications.page.open"))}
                            </Link>
                          ) : null}

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              unread
                                ? markRead.mutate({ id: n.id })
                                : markUnread.mutate({ id: n.id })
                            }
                            className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-slate-200 dark:border-[#334155] px-3 text-[11.5px] font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1e293b] disabled:opacity-60 cursor-pointer"
                          >
                            {unread ? (
                              <Check className="size-3" aria-hidden />
                            ) : (
                              <Undo2 className="size-3" aria-hidden />
                            )}
                            {unread
                              ? t("bc.mobile.notifications.page.markRead")
                              : t("bc.mobile.notifications.page.markUnread")}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </MobilePage>
  );
}

