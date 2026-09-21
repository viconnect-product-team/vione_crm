import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  Wallet,
  Sparkles,
  Info,
  Users,
  BriefcaseBusiness,
  Eye,
  PhoneCall,
  CheckCircle2,
  XCircle,
  CheckCheck,
  Search,
  X,
  ExternalLink,
  Loader2,
  Check,
  EyeOff,
  Trophy,
  UserCheck,
  UserX,
  Trash2,
  Ticket,
  QrCode,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { fetchNestApi } from "@/lib/api-client";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import {
  listMyNotifications,
  markAllNotificationsReadFn,
  unmarkAllNotificationsReadFn,
  markNotificationReadFn,
  dismissNotificationFn,
  deleteNotificationFn,
  dismissAllNotificationsFn,
  dismissBroadcastNotificationsFn,
  restoreNotificationFn,
  restoreBroadcastNotificationsFn,
  restoreAllPersonalNotificationsFn,
  type MyNotification,
  type LeadWorkflowStatus,
  type NotificationPriority,
} from "@/lib/member-app.functions";
import { processLeadWorkflowFn } from "@/lib/business-card.functions";
import { useT, useFmt, type TKey } from "@/lib/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const NOTIFICATIONS_PREFS_KEY = "vba-notifications-preferences";

const notificationsSearchSchema = z.object({
  filter: fallback(
    z.enum(["all", "lead", "unread", "read", "dismissed", "event", "fee", "opportunity"]),
    "all",
  ).default("all"),
  sort: fallback(z.enum(["priority", "newest"]), "priority").default("priority"),
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/association/notifications")({
  component: NotificationsScreen,
  validateSearch: zodValidator(notificationsSearchSchema),
});

const iconFor = (t: MyNotification["type"]) =>
  t === "event"
    ? Calendar
    : t === "fee"
      ? Wallet
      : t === "opportunity"
        ? Sparkles
        : t === "network"
          ? Users
          : t === "lead"
            ? BriefcaseBusiness
            : Info;

function formatNotifTitle(n: any): string {
  const t = n.title || "";
  if (t.includes("connection_request_received") || n.notificationKind === "connection_request_received") {
    return "Lời mời kết nối mới";
  }
  if (t.includes("connection_request_accepted") || n.notificationKind === "connection_request_accepted") {
    return "Kết nối thành công";
  }
  if (t.includes("connection_request_declined") || n.notificationKind === "connection_request_declined") {
    return "Lời mời kết nối bị từ chối";
  }
  if (t.includes("community_join_approved") || n.notificationKind === "community_join_approved") {
    return "Đã duyệt tham gia cộng đồng";
  }
  if (t.includes("community_join_rejected") || n.notificationKind === "community_join_rejected") {
    return "Yêu cầu tham gia bị từ chối";
  }
  return t;
}

function formatNotifBody(n: any): string {
  const b = n.body || "";
  const name =
    n.safeDisplayData?.counterpartDisplayName ||
    n.safeDisplayData?.senderName ||
    "Hội viên CLB CEO 1983";
  if (b.includes("connection_request_received") || n.notificationKind === "connection_request_received") {
    return `${name} muốn kết nối danh thiếp số với bạn.`;
  }
  if (b.includes("connection_request_accepted") || n.notificationKind === "connection_request_accepted") {
    return `${name} đã chấp nhận lời mời kết nối của bạn.`;
  }
  if (b.includes("connection_request_declined") || n.notificationKind === "connection_request_declined") {
    return `${name} đã từ chối lời mời kết nối.`;
  }
  if (b.includes("community_join_approved") || n.notificationKind === "community_join_approved") {
    return "Yêu cầu gia nhập cộng đồng của bạn đã được ban quản trị phê duyệt.";
  }
  if (b.includes("community_join_rejected") || n.notificationKind === "community_join_rejected") {
    return "Yêu cầu gia nhập cộng đồng của bạn chưa được phê duyệt.";
  }
  return b;
}

const LEAD_STATUS_LABEL: Record<LeadWorkflowStatus, TKey> = {
  new: "m.notifications.lead.markRead",
  read: "m.notifications.lead.markRead",
  contacting: "m.notifications.lead.contacting",
  responded: "m.notifications.lead.contacting",
  won: "m.notifications.lead.won",
  lost: "m.notifications.lead.lost",
  archived: "m.notifications.lead.lost",
};

const WORKFLOW_ACTIONS: {
  status: "read" | "contacting" | "won" | "lost";
  key: TKey;
  Icon: typeof Eye;
}[] = [
  { status: "read", key: "m.notifications.lead.markRead", Icon: Eye },
  { status: "contacting", key: "m.notifications.lead.contacting", Icon: PhoneCall },
  { status: "won", key: "m.notifications.lead.won", Icon: CheckCircle2 },
  { status: "lost", key: "m.notifications.lead.lost", Icon: XCircle },
];

function LeadActions({
  leadId,
  current,
  onDone,
}: {
  leadId: string;
  current: LeadWorkflowStatus | null;
  onDone: () => void;
}) {
  const t = useT();
  const process = useServerFn(processLeadWorkflowFn);
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (status: "read" | "contacting" | "won" | "lost") => {
    setBusy(status);
    try {
      await process({ data: { id: leadId, status } });
      toast.success(t("m.notifications.lead.updated"));
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-2.5">
      {current && (
        <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-[var(--vba-gold-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--vba-gold)]">
          {t("m.notifications.lead.current")}: {t(LEAD_STATUS_LABEL[current])}
        </span>
      )}
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label={t("m.notifications.lead.workflow")}
        aria-describedby={`lead-wf-hint-${leadId}`}
      >
        <span id={`lead-wf-hint-${leadId}`} className="sr-only">
          {t("m.notifications.lead.workflowHint")}
        </span>
        {WORKFLOW_ACTIONS.map(({ status, key, Icon }) => {
          const active = current === status;
          return (
            <button
              key={status}
              type="button"
              disabled={busy !== null}
              onClick={() => run(status)}
              aria-pressed={active}
              aria-label={t(key)}
              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vba-gold)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--vba-bg)] disabled:opacity-50"
              style={{
                borderColor: active ? "var(--vba-gold)" : "var(--vba-border)",
                color: active ? "var(--vba-gold)" : "var(--vba-text-muted)",
                background: active ? "var(--vba-gold-soft)" : "transparent",
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(key)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NotificationsScreen() {
  const t = useT();
  const fmt = useFmt();
  const fetchNotis = useServerFn(listMyNotifications);
  const markAllRead = useServerFn(markAllNotificationsReadFn);
  const unmarkAllRead = useServerFn(unmarkAllNotificationsReadFn);
  const markRead = useServerFn(markNotificationReadFn);
  const dismiss = useServerFn(dismissNotificationFn);
  const deleteNotif = useServerFn(deleteNotificationFn);
  const dismissAll = useServerFn(dismissAllNotificationsFn);
  const dismissBroadcast = useServerFn(dismissBroadcastNotificationsFn);
  const restoreOne = useServerFn(restoreNotificationFn);
  const restoreBroadcast = useServerFn(restoreBroadcastNotificationsFn);
  const restoreAllPersonal = useServerFn(restoreAllPersonalNotificationsFn);
  const navigate = useNavigate({ from: "/association/notifications" });
  const {
    data: rawNotifications,
    loading,
    reload,
  } = useServerData<MyNotification[]>(() => fetchNotis(), []);

  const notifications = useMemo(() => {
    const seen = new Set<string>();
    const res: MyNotification[] = [];
    for (const n of rawNotifications || []) {
      const keys: string[] = [];
      if (n.id) keys.push(`id:${n.id}`);
      if (n.refType && n.refId) keys.push(`ref:${n.refType}:${n.refId}`);
      if ((n as any).sourceRecordId) keys.push(`src:${(n as any).sourceRecordId}`);
      if (n.title && n.body) {
        const normTitle = n.title.trim().toLowerCase();
        const normBody = n.body.trim().toLowerCase().slice(0, 80);
        keys.push(`text:${normTitle}|${normBody}`);
      }
      const isDup = keys.some((k) => seen.has(k));
      if (!isDup) {
        for (const k of keys) seen.add(k);
        res.push(n);
      }
    }
    return res;
  }, [rawNotifications]);

  useEffect(() => {
    const handleUpdate = () => {
      reload();
    };
    window.addEventListener("notifications-updated", handleUpdate);
    return () => {
      window.removeEventListener("notifications-updated", handleUpdate);
    };
  }, [reload]);
  const [marking, setMarking] = useState(false);
  const [dismissingAll, setDismissingAll] = useState(false);
  const [openingLeadId, setOpeningLeadId] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [confirmDismiss, setConfirmDismiss] = useState<MyNotification | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MyNotification | null>(null);
  const [confirmDismissAll, setConfirmDismissAll] = useState(false);
  const dismissTriggerRef = useRef<HTMLElement | null>(null);
  const deleteTriggerRef = useRef<HTMLElement | null>(null);
  const restoreDialogFocus = () => {
    const el = dismissTriggerRef.current || deleteTriggerRef.current;
    dismissTriggerRef.current = null;
    deleteTriggerRef.current = null;
    if (el && document.contains(el)) {
      requestAnimationFrame(() => el.focus());
    }
  };
  const [lastBulkAction, setLastBulkAction] = useState<
    | null
    | { type: "markRead"; ids: string[] }
    | { type: "dismiss"; personalIds: string[]; broadcastIds: string[] }
  >(null);
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>({});
  const [connectionStates, setConnectionStates] = useState<Record<string, "accepted" | "declined">>({});
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const handleAcceptFriend = async (n: any) => {
    const connId =
      n.safeDisplayData?.connectionId ||
      n.sourceRecordId ||
      (n.refType === "connection" ? n.refId : null) ||
      n.id;
    if (actionBusy) return;
    setActionBusy(n.id);
    try {
      await fetchNestApi(`/network/connections/${connId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "accepted" }),
      });
      setConnectionStates((prev) => ({
        ...prev,
        [n.id]: "accepted",
        ...(connId ? { [connId]: "accepted" } : {}),
      }));
      toast.success("Đã đồng ý kết bạn thành công!");
      await markRead({ data: { id: n.id } }).catch(() => {});
      reload();
    } catch (e: any) {
      toast.error(e?.message || "Không thể đồng ý kết bạn");
    } finally {
      setActionBusy(null);
    }
  };

  const handleDeclineFriend = async (n: any) => {
    const connId =
      n.safeDisplayData?.connectionId ||
      n.sourceRecordId ||
      (n.refType === "connection" ? n.refId : null) ||
      n.id;
    if (actionBusy) return;
    setActionBusy(n.id);
    try {
      await fetchNestApi(`/network/connections/${connId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "declined" }),
      });
      setConnectionStates((prev) => ({
        ...prev,
        [n.id]: "declined",
        ...(connId ? { [connId]: "declined" } : {}),
      }));
      toast.info("Đã từ chối lời mời kết nối");
      await markRead({ data: { id: n.id } }).catch(() => {});
      reload();
    } catch (e: any) {
      toast.error(e?.message || "Không thể từ chối kết bạn");
    } finally {
      setActionBusy(null);
    }
  };

  const handleQuickVote = async (pollId: string, optionId: string) => {
    try {
      setVotedPolls((prev) => ({ ...prev, [pollId]: optionId }));
      await fetchNestApi(`/voting/polls/${pollId}/vote`, {
        method: "POST",
        body: JSON.stringify({ optionId, sourceApp: "association_app" }),
      });
      toast.success("Đã ghi nhận biểu quyết của bạn qua Hiệp hội App!");
      reload();
    } catch (e: any) {
      toast.error(e?.message || "Không thể gửi biểu quyết");
    }
  };

  const onMarkOneRead = async (n: MyNotification) => {
    if (rowBusy) return;
    setRowBusy(n.id);
    try {
      await markRead({ data: { id: n.id } });
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("m.notifications.markOne.error"));
    } finally {
      setRowBusy(null);
    }
  };

  const onUndoDismiss = async (n: MyNotification) => {
    try {
      if (n.personal) {
        await restoreOne({ data: { id: n.id } });
      } else {
        await restoreBroadcast({ data: { ids: [n.id] } });
      }
      reload();
      toast.success(t("m.notifications.undo.done"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("m.notifications.dismiss.error"));
    }
  };

  const onDismiss = async (n: MyNotification) => {
    if (rowBusy) return;
    setRowBusy(n.id);
    try {
      if (n.personal) {
        await dismiss({ data: { id: n.id } });
      } else {
        await dismissBroadcast({ data: { ids: [n.id] } });
      }
      reload();
      toast.success(t("m.notifications.dismiss.done"), {
        duration: 6000,
        action: {
          label: t("m.notifications.undo.action"),
          onClick: () => onUndoDismiss(n),
        },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("m.notifications.dismiss.error"));
    } finally {
      setRowBusy(null);
    }
  };

  const onDelete = async (n: MyNotification) => {
    if (rowBusy) return;
    setRowBusy(n.id);
    try {
      await deleteNotif({ data: { id: n.id } });
      reload();
      toast.success("Đã xóa vĩnh viễn thông báo");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể xóa thông báo");
    } finally {
      setRowBusy(null);
    }
  };

  const hasUnread = notifications.some((n) => n.unread);

  const onUndoBulkAction = async () => {
    if (!lastBulkAction) return;
    const action = lastBulkAction;
    setLastBulkAction(null);
    try {
      if (action.type === "markRead" && action.ids.length > 0) {
        await unmarkAllRead({ data: { ids: action.ids } });
      } else if (action.type === "dismiss") {
        if (action.personalIds.length > 0) {
          await restoreAllPersonal({ data: { ids: action.personalIds } });
        }
        if (action.broadcastIds.length > 0) {
          await restoreBroadcast({ data: { ids: action.broadcastIds } });
        }
      }
      reload();
      toast.success(t("m.notifications.undoAll.done"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("m.notifications.undoAll.error"));
    }
  };

  const onMarkAllRead = async () => {
    if (marking || !hasUnread) return;
    setMarking(true);
    try {
      const result = await markAllRead();
      setLastBulkAction({ type: "markRead", ids: result.ids ?? [] });
      toast.success(t("m.notifications.markAllRead.done"), {
        duration: 6000,
        action: {
          label: t("m.notifications.undo.action"),
          onClick: onUndoBulkAction,
        },
      });
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setMarking(false);
    }
  };

  const search = Route.useSearch();

  type NotificationFilter = "all" | "lead" | "unread" | "read" | "dismissed" | "event" | "fee" | "opportunity";

  const [filter, setFilter] = useState<NotificationFilter>(
    search.filter as NotificationFilter,
  );
  const [sort, setSort] = useState<"priority" | "newest">(search.sort);
  const [query, setQuery] = useState(search.q ?? "");
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<MyNotification | null>(null);

  const isLuckyDrawNotification = (n: any): boolean => {
    if (!n) return false;
    const text = `${n.title || ""} ${n.body || ""} ${n.notificationKind || ""}`.toLowerCase();
    return /lucky draw|bốc thăm|quay số|trúng thưởng|giải thưởng|chúc mừng.*trúng/i.test(text);
  };

  const isEventNotification = (n: any): boolean => {
    if (!n) return false;
    if (n.refType === "event" || n.type === "event" || n.notificationKind?.includes("event")) return true;
    const text = `${n.title || ""} ${n.body || ""} ${n.notificationKind || ""}`.toLowerCase();
    return /sự kiện|vé tham dự|đăng ký vé|check-in|gala|diễn đàn|bàn tiệc/i.test(text);
  };

  const isFeeNotification = (n: any): boolean => {
    if (!n) return false;
    const text = `${n.title || ""} ${n.body || ""} ${n.notificationKind || ""}`.toLowerCase();

    // Explicitly exclude 0đ, free, or complimentary event passes
    if (
      text.includes("0đ") ||
      text.includes("0 đ") ||
      text.includes("0 vnd") ||
      text.includes("miễn phí") ||
      text.includes("free") ||
      n.safeDisplayData?.amount === 0 ||
      n.safeDisplayData?.amount === "0"
    ) {
      return false;
    }

    if (
      n.type === "fee" ||
      n.notificationKind === "overdue_payment_reminder" ||
      n.notificationKind === "invoice" ||
      n.notificationKind === "payment"
    ) {
      return true;
    }

    if (
      Boolean(n.safeDisplayData?.invoiceId) ||
      (Boolean(n.safeDisplayData?.amount) && Number(n.safeDisplayData.amount) > 0)
    ) {
      return true;
    }

    return /hội phí|phí thường niên|quản lý hội phí|hóa đơn|chuyển khoản|quét mã qr|vietqr|invoice/i.test(text);
  };

  const handlePayNotification = (n: any) => {
    if (n.unread && n.personal) {
      void onMarkOneRead(n);
    }
    const text = `${n.title || ""} ${n.body || ""}`.toLowerCase();
    if (n.safeDisplayData?.targetRoute) {
      void navigate({ to: n.safeDisplayData.targetRoute });
      return;
    }
    if (text.includes("sự kiện") || n.refType === "event") {
      void navigate({ to: "/association/messages", search: { peerCode: "admin" } });
      return;
    }
    void navigate({ to: "/association/renew" });
  };

  useEffect(() => {
    if (!prefsLoaded) {
      setPrefsLoaded(true);
      const isDefaultUrl =
        search.filter === "all" &&
        search.sort === "priority" &&
        (search.q === "" || search.q == null);
      if (!isDefaultUrl) return;
      const saved = localStorage.getItem(NOTIFICATIONS_PREFS_KEY);
      if (!saved) return;
      try {
        const p = JSON.parse(saved) as {
          filter?: string;
          sort?: string;
          q?: string;
        };
        const validFilters: NotificationFilter[] = [
          "all",
          "lead",
          "unread",
          "read",
          "dismissed",
          "event",
          "fee",
          "opportunity",
        ];
        if (validFilters.includes(p.filter as NotificationFilter)) {
          setFilter(p.filter as NotificationFilter);
        }
        if (p.sort === "priority" || p.sort === "newest") setSort(p.sort);
        if (typeof p.q === "string") setQuery(p.q);
      } catch {
        // ignore corrupt storage
      }
      return;
    }

    localStorage.setItem(NOTIFICATIONS_PREFS_KEY, JSON.stringify({ filter, sort, q: query }));
    const t = setTimeout(() => {
      navigate({ search: { filter, sort, q: query }, replace: true });
    }, 150);
    return () => clearTimeout(t);
  }, [filter, sort, query, search.filter, search.sort, search.q, navigate, prefsLoaded]);

  const filterTabs: { key: typeof filter; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "unread", label: "Chưa đọc" },
    { key: "opportunity", label: "Cơ hội B2B" },
    { key: "event", label: "Sự kiện" },
    { key: "fee", label: "Hội phí" },
    { key: "dismissed", label: "Đã ẩn" },
  ];

  const PRIORITY_RANK: Record<NotificationPriority, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };
  const PRIORITY_KEY: Record<NotificationPriority, TKey> = {
    high: "m.notifications.priority.high",
    medium: "m.notifications.priority.medium",
    low: "m.notifications.priority.low",
  };
  const priorityColor = (p: NotificationPriority) =>
    p === "high" ? "var(--vba-danger)" : p === "medium" ? "var(--vba-gold)" : "var(--vba-text-dim)";

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");

  const q = normalize((query ?? "").trim());

  const visible = notifications
    .filter((n) => {
      if (filter === "dismissed") return n.dismissed;
      if (n.dismissed) return false;
      if (filter === "lead") return n.type === "lead";
      if (filter === "event") return n.type === "event";
      if (filter === "fee") return n.type === "fee";
      if (filter === "opportunity") return n.type === "opportunity" || n.type === "lead";
      if (filter === "unread") return n.unread;
      if (filter === "read") return !n.unread;
      return true;
    })
    .filter((n) => (q ? normalize(n.title).includes(q) || normalize(n.body).includes(q) : true))
    .slice()
    .sort((a, b) => {
      if (sort === "priority") {
        const d = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
        if (d !== 0) return d;
      }
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return tb - ta;
    });

  const hasVisible = visible.length > 0;

  const executeDismissAll = async () => {
    if (dismissingAll || !hasVisible) return;
    setConfirmDismissAll(false);
    setDismissingAll(true);
    try {
      const result = await dismissAll();
      // Also persist dismissal of broadcast notifications so it syncs across devices.
      const broadcastIds = visible.filter((n) => !n.personal).map((n: any) => n.id);
      if (broadcastIds.length > 0) {
        await dismissBroadcast({ data: { ids: broadcastIds } });
      }
      setLastBulkAction({
        type: "dismiss",
        personalIds: result.ids ?? [],
        broadcastIds,
      });
      toast.success(t("m.notifications.dismissAll.done"), {
        duration: 6000,
        action: {
          label: t("m.notifications.undo.action"),
          onClick: onUndoBulkAction,
        },
      });
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("m.notifications.dismissAll.error"));
    } finally {
      setDismissingAll(false);
    }
  };

  return (
    <div className="vba-animate">
      <MemberHeader
        title={t("m.notifications.title")}
        back
        right={
          <div className="flex items-center gap-1.5">
            <button
              onClick={onMarkAllRead}
              disabled={marking || !hasUnread || filter === "dismissed"}
              aria-label={t("m.notifications.markAllRead")}
              title={t("m.notifications.markAllRead")}
              className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border-2 border-[#2E3192] bg-[#2E3192] text-white hover:bg-[#19194D] transition-all disabled:opacity-30 cursor-pointer shadow-xs active:scale-95"
            >
              {marking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4.5 w-4.5 stroke-[2.5]" />
              )}
            </button>
            <button
              onClick={(e) => {
                dismissTriggerRef.current = e.currentTarget;
                setConfirmDismissAll(true);
              }}
              disabled={dismissingAll || !hasVisible || filter === "dismissed"}
              aria-label={t("m.notifications.dismissAll")}
              title={t("m.notifications.dismissAll")}
              className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-30 cursor-pointer shadow-xs active:scale-95"
            >
              {dismissingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <EyeOff className="h-4 w-4 stroke-[2.2]" />
              )}
            </button>
          </div>
        }
      />

      <div className="mt-3 space-y-3 px-4">
        {/* Segmented Filter Control */}
        <div
          className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar"
          role="group"
          aria-label={t("m.notifications.filter.group")}
        >
          {filterTabs.map((tab) => {
            const active = filter === tab.key;
            const count =
              tab.key === "unread"
                ? notifications.filter((n) => n.unread && !n.dismissed).length
                : tab.key === "all"
                ? notifications.filter((n) => !n.dismissed).length
                : tab.key === "opportunity"
                ? notifications.filter((n) => (n.type === "opportunity" || n.type === "lead") && !n.dismissed).length
                : tab.key === "event"
                ? notifications.filter((n) => n.type === "event" && !n.dismissed).length
                : tab.key === "fee"
                ? notifications.filter((n) => n.type === "fee" && !n.dismissed).length
                : tab.key === "dismissed"
                ? notifications.filter((n) => n.dismissed).length
                : null;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                aria-pressed={active}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  active
                    ? "bg-[#2E3192] text-white font-black shadow-md scale-[1.02]"
                    : "text-slate-700 dark:text-slate-200 font-bold hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                <span>{tab.label}</span>
                {count != null && count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold tabular-nums ${
                      active
                        ? "bg-white/30 text-white"
                        : "bg-red-600 text-white shadow-xs font-black"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vba-text-dim)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && query) {
                  e.preventDefault();
                  setQuery("");
                }
              }}
              placeholder={t("m.notifications.search.placeholder")}
              aria-label={t("m.notifications.search.placeholder")}
              className="w-full rounded-2xl border border-[var(--vba-border)] bg-[var(--vba-surface,#fff)] py-2 pl-9 pr-8 text-[13px] text-[var(--vba-text)] placeholder:text-[var(--vba-text-dim)] shadow-xs focus:border-[var(--vba-gold)] focus:outline-none transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--vba-text-dim)] hover:text-[var(--vba-text)] cursor-pointer"
                aria-label={t("action.close")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSort(sort === "priority" ? "newest" : "priority")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-[var(--vba-border)] bg-[var(--vba-surface,#fff)] text-xs font-semibold text-[var(--vba-text-muted)] hover:text-[var(--vba-gold)] shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <span>{sort === "priority" ? "⚡ Ưu tiên" : "🕒 Mới nhất"}</span>
          </button>
        </div>
      </div>

      <p data-testid="noti-announcement" role="status" aria-live="polite" className="sr-only">
        {loading
          ? t("m.notifications.loading")
          : visible.some((n) => n.unread)
            ? t("m.notifications.announce.summary", {
                count: visible.length,
                unread: visible.filter((n) => n.unread).length,
              })
            : t("m.notifications.announce.allRead")}
      </p>

      <div className="mt-3.5 space-y-3 px-4" role="list" aria-live="polite" aria-busy={loading}>
        {loading && (
          <p className="py-10 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.notifications.loading")}
          </p>
        )}
        {!loading && visible.length === 0 && (
          <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-[var(--vba-border)] bg-[var(--vba-surface,#fff)] px-6 py-12 text-center shadow-xs">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--vba-gold-soft)] text-[var(--vba-gold)]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-[14.5px] font-bold text-[var(--vba-text)]">
              {t("m.notifications.empty")}
            </p>
            <p className="text-[12.5px] text-[var(--vba-text-muted)] max-w-[28ch]">
              Không có thông báo nào trong danh mục này.
            </p>
          </div>
        )}
        {visible.map((n: any) => {
          const Icon = iconFor(n.type);
          const isLead = n.type === "lead" && !!n.refId;

          const isFriendReq =
            n.notificationKind === "connection_request_received" ||
            n.refType === "connection" ||
            (n.type === "network" &&
              (n.title?.toLowerCase().includes("kết nối") ||
                n.title?.toLowerCase().includes("kết bạn") ||
                n.title?.toLowerCase().includes("lời mời") ||
                n.title?.toLowerCase().includes("connection_request")));

          const connId =
            n.safeDisplayData?.connectionId ||
            n.sourceRecordId ||
            (n.refType === "connection" ? n.refId : null) ||
            n.id;

          const connStatus =
            connectionStates[n.id] ||
            (connId ? connectionStates[connId] : null) ||
            n.safeDisplayData?.connectionStatus ||
            (n.title?.toLowerCase().includes("chấp nhận") ||
            n.title?.toLowerCase().includes("thành công") ||
            n.notificationKind === "connection_request_accepted"
              ? "accepted"
              : n.title?.toLowerCase().includes("từ chối") ||
                n.notificationKind === "connection_request_declined"
              ? "declined"
              : "pending");

          // Color coded per type - High contrast, sharp & vibrant brand CEO 1983
          const typeTheme: Record<string, { iconBg: string; badge: string; label: string }> = {
            opportunity: {
              iconBg: "bg-emerald-600 text-white border-emerald-700 shadow-xs",
              badge: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-bold",
              label: "Cơ hội B2B",
            },
            lead: {
              iconBg: "bg-purple-600 text-white border-purple-700 shadow-xs",
              badge: "bg-purple-50 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-700 font-bold",
              label: "Khách hàng B2B",
            },
            event: {
              iconBg: "bg-[#2E3192] text-white border-[#19194D] shadow-xs",
              badge: "bg-blue-50 text-[#2E3192] dark:bg-blue-950/80 dark:text-amber-300 border-blue-200 dark:border-blue-800 font-bold",
              label: "Sự kiện",
            },
            fee: {
              iconBg: "bg-amber-600 text-white border-amber-700 shadow-xs",
              badge: "bg-amber-50 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-bold",
              label: "Hội phí",
            },
            network: {
              iconBg: "bg-[#2E3192] text-white border-[#19194D] shadow-xs",
              badge: "bg-blue-50 text-[#2E3192] dark:bg-slate-800 dark:text-amber-300 border-[#2E3192]/30 dark:border-amber-500/30 font-bold",
              label: "Kết nối",
            },
            info: {
              iconBg: "bg-[#2E3192] text-white border-[#19194D] shadow-xs",
              badge: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 font-bold",
              label: "Hệ thống",
            },
          };

          const theme = typeTheme[n.type] || {
            iconBg: "bg-[#2E3192] text-white border-[#19194D] shadow-xs",
            badge: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 font-bold",
            label: "Thông báo",
          };

          return (
            <div
              key={n.id}
              role="listitem"
              onClick={() => {
                setSelectedNotif(n);
                if (n.unread && n.personal) onMarkOneRead(n);
              }}
              className={`relative flex gap-2.5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md overflow-hidden cursor-pointer ${
                n.unread
                  ? "bg-white dark:bg-[#0F172A] border-2 border-[#2E3192]/40 dark:border-[#2E3192]/60 shadow-sm"
                  : "bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              {/* Vertical Indicator on Unread - Blue Navy */}
              {n.unread && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#2E3192]" />
              )}

              <span className={`grid h-8.5 w-8.5 shrink-0 place-items-center rounded-xl border shadow-xs ${theme.iconBg}`}>
                <Icon className="h-4 w-4 stroke-[2.2]" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider border shadow-2xs ${theme.badge}`}>
                      {theme.label}
                    </span>
                    {n.priority && n.priority !== "low" && (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-2xs"
                        aria-label={`${t("m.notifications.status.priority")}: ${t(PRIORITY_KEY[n.priority as NotificationPriority])}`}
                      >
                        {t(PRIORITY_KEY[n.priority as NotificationPriority])}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {n.unread && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white border border-red-700 shadow-2xs">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                        </span>
                        Mới
                      </span>
                    )}
                    <span className="text-[10.5px] font-medium text-[var(--vba-text-dim)]">
                      {fmt.rel(n.time)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-bold text-[var(--vba-text)]">
                    {formatNotifTitle(n)}
                  </span>
                  {isLead && (
                    <button
                      type="button"
                      disabled={openingLeadId === n.id}
                      onClick={async () => {
                        setOpeningLeadId(n.id);
                        let marked = false;
                        for (let attempt = 0; attempt < 3 && !marked; attempt++) {
                          try {
                            await markRead({ data: { id: n.id } });
                            marked = true;
                          } catch {
                            if (attempt < 2) {
                              await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
                            }
                          }
                        }
                        try {
                          await navigate({
                            to: "/association/business-cards",
                            search: { tab: "leads", leadId: n.refId as string },
                          });
                        } catch (e) {
                          toast.error(
                            e instanceof Error ? e.message : t("m.notifications.lead.openError"),
                          );
                        } finally {
                          setOpeningLeadId(null);
                          if (!marked) reload();
                        }
                      }}
                      aria-label={t("m.notifications.lead.openDetail")}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#2E3192] dark:text-amber-400 transition hover:bg-amber-50 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                    >
                      {openingLeadId === n.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ExternalLink className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>

                <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--vba-text-muted)] line-clamp-2">
                  {formatNotifBody(n)}
                </p>

                {/* Thao tác Lời mời kết bạn */}
                {isFriendReq && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80">
                    {connStatus === "accepted" ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-200 text-xs font-black shadow-xs">
                        <Check className="size-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                        <span>Đã đồng ý kết bạn</span>
                      </div>
                    ) : connStatus === "declined" ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-400 text-rose-700 dark:text-rose-300 text-xs font-bold shadow-xs">
                        <X className="size-4 text-rose-500" />
                        <span>Đã từ chối lời mời</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <button
                          type="button"
                          disabled={actionBusy === n.id}
                          onClick={() => handleAcceptFriend(n)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50"
                        >
                          {actionBusy === n.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <UserCheck className="size-4 stroke-[2.5]" />
                          )}
                          <span>Đồng ý kết bạn</span>
                        </button>
                        <button
                          type="button"
                          disabled={actionBusy === n.id}
                          onClick={() => handleDeclineFriend(n)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 active:scale-95 border-2 border-rose-400 dark:border-rose-600 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          <UserX className="size-4 stroke-[2.5]" />
                          <span>Từ chối</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Thẻ biểu quyết tương tác trực tiếp (Đang mở) */}
                {((n.type === "voting" || n.notificationKind === "interactive_poll" || n.refType === "voting" || Boolean(n.safeDisplayData?.pollId)) &&
                  n.safeDisplayData?.options &&
                  !(n.notificationKind === "poll_result" || (n as any).eventKind === "poll_closed" || (n.safeDisplayData as any)?.isClosed)) && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/25 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[11.5px] font-bold text-[#2E3192] dark:text-amber-300">
                        Bình chọn ý kiến của bạn:
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/30">
                        🏛️ Bỏ phiếu qua Hiệp hội App
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {n.safeDisplayData.options.map((opt: any) => {
                        const pollId = n.safeDisplayData.pollId || n.refId;
                        const isSelected = votedPolls[pollId] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleQuickVote(pollId, opt.id)}
                            className={`w-full p-2.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[var(--vba-gold)] text-[#071322] border-[var(--vba-gold)] shadow-sm"
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
                    {votedPolls[n.safeDisplayData.pollId || n.refId] && (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 pt-1">
                        <CheckCircle2 className="size-3.5" />
                        <span>Đã ghi nhận biểu quyết thành công qua Hiệp hội App.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Thẻ kết quả biểu quyết đã kết thúc */}
                {(n.notificationKind === "poll_result" || (n as any).eventKind === "poll_closed" || (n.safeDisplayData as any)?.isClosed) && n.safeDisplayData?.options && (
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
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-[#2E3192] dark:text-amber-300 font-medium">
                          📱 App Doanh nhân: {n.safeDisplayData.sourceStats.vioneApp || 0}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium">
                          🏛️ Hiệp hội: {n.safeDisplayData.sourceStats.associationApp || 0}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Thẻ chúc mừng trúng thưởng Vòng Quay May Mắn (Lucky Draw Winner) */}
                {(n.notificationKind === "lucky_draw_winner" ||
                  (n as any).notification_kind === "lucky_draw_winner" ||
                  n.title?.toLowerCase().includes("trúng thưởng") ||
                  n.body?.toLowerCase().includes("trúng thưởng") ||
                  Boolean(n.safeDisplayData?.luckyNumber)) && (
                  <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 via-rose-500/15 to-amber-500/10 border-2 border-amber-500/50 shadow-md space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500 text-white shadow-sm animate-bounce">
                          <Trophy className="h-4 w-4" />
                        </span>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">
                            🎉 CHÚC MỪNG TRÚNG THƯỞNG!
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            {n.safeDisplayData?.eventName || "Vòng quay may mắn sự kiện"}
                          </span>
                        </div>
                      </div>
                      {n.safeDisplayData?.luckyNumber && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/25 border border-amber-500/40 text-xs font-mono font-black text-amber-700 dark:text-amber-300">
                          Mã vé: {n.safeDisplayData.luckyNumber}
                        </span>
                      )}
                    </div>

                    {n.safeDisplayData?.prizeName && (
                      <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/80 border border-amber-500/30 text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                        <span>Phần thưởng: {n.safeDisplayData.prizeName}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">
                        Liên hệ Ban Tổ Chức tại quầy lễ tân để nhận quà
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          void markRead({ data: { id: n.id } }).catch(() => {});
                          navigate({ to: "/association/messages", search: { peerCode: "admin" } });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white text-[11px] font-bold shadow-xs hover:opacity-95 transition cursor-pointer"
                      >
                        Nhắn tin BTC
                      </button>
                    </div>
                  </div>
                )}

                {/* Thẻ nhắc nhở thanh toán quá hạn */}
                {(n.type === "fee" || n.notificationKind === "overdue_payment_reminder" || Boolean(n.safeDisplayData?.invoiceId)) && n.safeDisplayData?.amount && (
                  <div className="mt-3 p-3 rounded-xl bg-red-500/10 dark:bg-red-500/15 border border-red-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-700 dark:text-red-300">
                        Số tiền cần thanh toán:
                      </span>
                      <span className="text-sm font-extrabold text-red-600 dark:text-red-400">
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(n.safeDisplayData.amount))}
                      </span>
                    </div>
                    {n.safeDisplayData.dueDate && !isNaN(new Date(n.safeDisplayData.dueDate).getTime()) && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Hạn chót: {new Date(n.safeDisplayData.dueDate).toLocaleDateString("vi-VN")}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handlePayNotification(n)}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.99]"
                    >
                      <Wallet className="size-3.5 text-white" />
                      <span>Thanh toán ngay</span>
                    </button>
                  </div>
                )}

                {n.refType === "renewal_audit" && n.refId && (
                  <button
                    type="button"
                    onClick={() => {
                      void markRead({ data: { id: n.id } }).catch(() => {});
                      void navigate({ to: "/association/renew/audit", search: { ref: n.refId as string } });
                    }}
                    className="mt-2 inline-flex items-center gap-1 rounded-xl border border-[var(--vba-border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--vba-gold)] transition hover:bg-[var(--vba-gold-soft)] cursor-pointer"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {t("m.notifications.renewal.openAudit")}
                  </button>
                )}

                <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  {n.dismissed ? (
                    <button
                      type="button"
                      disabled={rowBusy === n.id}
                      onClick={() => onUndoDismiss(n)}
                      className="inline-flex items-center gap-1.5 rounded-xl border-2 border-amber-500 dark:border-amber-400 bg-amber-50 dark:bg-amber-950/60 px-3 py-1.5 text-[11.5px] font-bold text-amber-800 dark:text-amber-200 transition hover:bg-amber-100 disabled:opacity-50 shadow-xs cursor-pointer active:scale-95"
                    >
                      {rowBusy === n.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      )}
                      {t("m.notifications.undo.action")}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNotif(n);
                          if (n.unread && n.personal) onMarkOneRead(n);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#2E3192] hover:bg-[#19194D] px-3.5 py-1.5 text-[11px] font-bold text-white shadow-xs cursor-pointer active:scale-95 whitespace-nowrap transition-all"
                        style={{ color: "#ffffff" }}
                      >
                        <Eye className="h-3.5 w-3.5 text-white" />
                        <span className="text-white font-bold">Xem chi tiết</span>
                      </button>

                      <button
                        type="button"
                        disabled={rowBusy === n.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissTriggerRef.current = e.currentTarget;
                          setConfirmDismiss(n);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 disabled:opacity-50 shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap transition-all"
                      >
                        <EyeOff className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                        <span>Ẩn</span>
                      </button>
                      <button
                        type="button"
                        disabled={rowBusy === n.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTriggerRef.current = e.currentTarget;
                          setConfirmDelete(n);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 px-3 py-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 disabled:opacity-50 shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        <span>Xóa</span>
                      </button>
                    </>
                  )}
                </div>
                {isLead && !n.dismissed && (
                  <LeadActions
                    leadId={n.refId as string}
                    current={n.leadStatus ?? null}
                    onDone={reload}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialog 1: Ẩn thông báo */}
      <AlertDialog
        open={!!confirmDismiss}
        onOpenChange={(open) => !open && setConfirmDismiss(null)}
      >
        <AlertDialogContent
          className="max-w-[330px] p-6 rounded-3xl bg-white/95 dark:bg-[#131A26]/95 border border-slate-200/80 dark:border-white/10 shadow-2xl text-slate-900 dark:text-white backdrop-blur-xl text-center space-y-2"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            restoreDialogFocus();
          }}
        >
          <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-2xl bg-[#2E3192]/10 dark:bg-amber-500/20 text-[#2E3192] dark:text-amber-400 mb-1 ring-8 ring-[#2E3192]/5">
            <EyeOff className="h-6 w-6" />
          </div>
          <AlertDialogHeader className="text-center sm:text-center space-y-1.5">
            <AlertDialogTitle className="text-[17px] font-bold text-slate-900 dark:text-white text-center">
              Ẩn thông báo
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-400 text-center max-w-[260px] mx-auto">
              Thông báo này sẽ được chuyển vào mục Đã ẩn và bạn có thể khôi phục lại bất kỳ lúc nào.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-3 pt-3 sm:flex-none">
            <AlertDialogCancel
              onClick={() => setConfirmDismiss(null)}
              className="w-full h-11 !m-0 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-[13.5px] font-semibold transition cursor-pointer flex items-center justify-center"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDismiss) onDismiss(confirmDismiss);
                setConfirmDismiss(null);
              }}
              style={{ color: "#ffffff" }}
              className="w-full h-11 !m-0 rounded-xl bg-[#2E3192] hover:bg-[#19194D] text-white text-[13.5px] font-bold shadow-md shadow-[#2E3192]/25 transition cursor-pointer flex items-center justify-center"
            >
              Ẩn ngay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog 2: Xóa vĩnh viễn thông báo */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <AlertDialogContent
          className="max-w-[330px] p-6 rounded-3xl bg-white/95 dark:bg-[#131A26]/95 border border-slate-200/80 dark:border-white/10 shadow-2xl text-slate-900 dark:text-white backdrop-blur-xl text-center space-y-2"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            restoreDialogFocus();
          }}
        >
          <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 mb-1 ring-8 ring-rose-500/5">
            <Trash2 className="h-6 w-6" />
          </div>
          <AlertDialogHeader className="text-center sm:text-center space-y-1.5">
            <AlertDialogTitle className="text-[17px] font-bold text-slate-900 dark:text-white text-center">
              Xóa thông báo
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-400 text-center max-w-[260px] mx-auto">
              Bạn có chắc chắn muốn xóa vĩnh viễn thông báo này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-3 pt-3 sm:flex-none">
            <AlertDialogCancel
              onClick={() => setConfirmDelete(null)}
              className="w-full h-11 !m-0 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-[13.5px] font-semibold transition cursor-pointer flex items-center justify-center"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) onDelete(confirmDelete);
                setConfirmDelete(null);
              }}
              className="w-full h-11 !m-0 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-[13.5px] font-bold shadow-md shadow-rose-500/25 transition cursor-pointer flex items-center justify-center"
            >
              Xóa ngay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog 3: Ẩn tất cả thông báo */}
      <AlertDialog
        open={confirmDismissAll}
        onOpenChange={(open) => !open && setConfirmDismissAll(false)}
      >
        <AlertDialogContent
          className="max-w-[330px] p-6 rounded-3xl bg-white/95 dark:bg-[#131A26]/95 border border-slate-200/80 dark:border-white/10 shadow-2xl text-slate-900 dark:text-white backdrop-blur-xl text-center space-y-2"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            restoreDialogFocus();
          }}
        >
          <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-2xl bg-[#2E3192]/10 dark:bg-amber-500/20 text-[#2E3192] dark:text-amber-400 mb-1 ring-8 ring-[#2E3192]/5">
            <EyeOff className="h-6 w-6" />
          </div>
          <AlertDialogHeader className="text-center sm:text-center space-y-1.5">
            <AlertDialogTitle className="text-[17px] font-bold text-slate-900 dark:text-white text-center">
              Ẩn tất cả thông báo
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-400 text-center max-w-[260px] mx-auto">
              Bạn có chắc chắn muốn ẩn tất cả thông báo trong danh sách này? Bạn có thể khôi phục lại trong mục Đã ẩn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-3 pt-3 sm:flex-none">
            <AlertDialogCancel
              onClick={() => setConfirmDismissAll(false)}
              className="w-full h-11 !m-0 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-[13.5px] font-semibold transition cursor-pointer flex items-center justify-center"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDismissAll}
              style={{ color: "#ffffff" }}
              className="w-full h-11 !m-0 rounded-xl bg-[#2E3192] hover:bg-[#19194D] text-white text-[13.5px] font-bold shadow-md shadow-[#2E3192]/25 transition cursor-pointer flex items-center justify-center"
            >
              Ẩn tất cả
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL 4: XEM CHI TIẾT THÔNG BÁO */}
      {selectedNotif && (
        <Dialog open={!!selectedNotif} onOpenChange={(open) => !open && setSelectedNotif(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-[var(--vba-surface,#fff)] space-y-4">
            <DialogHeader className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  {selectedNotif.type === "fee" ? "Hội phí" : selectedNotif.type === "event" ? "Sự kiện" : selectedNotif.type === "opportunity" ? "Cơ hội B2B" : "Thông báo"}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {fmt.rel(selectedNotif.time)}
                </span>
              </div>
              <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 text-left leading-snug">
                {formatNotifTitle(selectedNotif)}
              </DialogTitle>
              <div className="text-xs text-slate-500 dark:text-slate-400 text-left flex items-center gap-1">
                <span>Người gửi:</span>
                <span className="font-semibold text-[#2E3192] dark:text-amber-400">Ban Thư Ký CLB Doanh Nhân CEO 1983</span>
              </div>
            </DialogHeader>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-100 dark:border-slate-800 text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed text-left whitespace-pre-wrap">
              {formatNotifBody(selectedNotif)}
            </div>

            {/* KHỐI CHÚC MỪNG TRÚNG THƯỞNG LUCKY DRAW */}
            {isLuckyDrawNotification(selectedNotif) && (
              <div className="rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-transparent border-2 border-amber-500/40 p-4 space-y-3 text-left shadow-sm">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-sm">
                  <span className="text-xl">🎉</span>
                  <span>CHÚC MỪNG HỘI VIÊN TRÚNG THƯỞNG!</span>
                </div>
                <div className="rounded-xl bg-white dark:bg-slate-900 p-3 border border-amber-200 dark:border-amber-900/50 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Mã trúng thưởng may mắn:</span>
                    <span className="font-mono font-black text-base text-[#003B95] dark:text-amber-400">#1140</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Giải thưởng:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-300">Giải Đặc Biệt Gala CEO 1983</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Trạng thái nhận giải:</span>
                    <span className="font-bold text-emerald-600">Đã xác thực hợp lệ</span>
                  </div>
                </div>
                <p className="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Vui lòng mang theo màn hình thông báo này hoặc mã định danh hội viên trên App tới Bàn Lễ Tân Ban Thư Ký để nhận giải thưởng.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNotif(null);
                    void navigate({ to: "/association/events" });
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Xem Chi Tiết Sự Kiện Gala</span>
                </button>
              </div>
            )}

            {/* KHỐI VÉ THAM DỰ SỰ KIỆN (0Đ / MIỄN PHÍ) */}
            {!isFeeNotification(selectedNotif) && isEventNotification(selectedNotif) && !isLuckyDrawNotification(selectedNotif) && (
              <div className="rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border-2 border-emerald-500/30 p-4 space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Ticket className="h-4 w-4 text-emerald-600" />
                    Vé tham dự sự kiện:
                  </span>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    0đ · Miễn phí Hội viên
                  </span>
                </div>
                <div className="text-[12px] text-slate-600 dark:text-slate-400 space-y-1">
                  <p>Trạng thái vé: <b className="text-emerald-700 dark:text-emerald-400">Đã đăng ký thành công</b></p>
                  <p>Hội viên vui lòng xuất trình mã vé điện tử QR tại cổng đón tiếp của sự kiện để check-in tự động trong 1 giây.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNotif(null);
                      void navigate({ to: "/association/checkin" });
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <QrCode className="h-4 w-4 text-white" />
                    <span>Mở Vé & Check-in QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNotif(null);
                      void navigate({ to: "/association/events" });
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>Xem Sự Kiện</span>
                  </button>
                </div>
              </div>
            )}

            {/* KHỐI THANH TOÁN DÀNH CHO THÔNG BÁO CÓ PHÍ */}
            {isFeeNotification(selectedNotif) && (
              <div className="rounded-2xl bg-red-500/10 dark:bg-red-500/15 border-2 border-red-500/30 p-4 space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-700 dark:text-red-300 flex items-center gap-1">
                    <Wallet className="h-4 w-4" />
                    Khoản phí cần thanh toán:
                  </span>
                  <span className="text-base font-black text-red-600 dark:text-red-400">
                    {selectedNotif.safeDisplayData?.amount
                      ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(selectedNotif.safeDisplayData.amount))
                      : "20.000.000 đ"}
                  </span>
                </div>
                {selectedNotif.safeDisplayData?.dueDate && (
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Hạn chót thanh toán: <b>{selectedNotif.safeDisplayData.dueDate}</b>
                  </div>
                )}
                <div className="text-[11.5px] text-slate-600 dark:text-slate-400">
                  Hội viên có thể quét mã VietQR chuyển khoản tự động hoặc thanh toán trực tiếp qua cổng ngân hàng của hiệp hội.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const n = selectedNotif;
                    setSelectedNotif(null);
                    handlePayNotification(n);
                  }}
                  style={{ color: "#ffffff" }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 animate-pulse"
                >
                  <Wallet className="h-4 w-4 text-white" style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff" }}>Thanh toán ngay</span>
                </button>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedNotif(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
              >
                Đóng
              </button>
              {!isFeeNotification(selectedNotif) && isEventNotification(selectedNotif) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNotif(null);
                    void navigate({ to: "/association/checkin" });
                  }}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#003B95] to-[#002766] hover:from-[#002B70] hover:to-[#001D4D] text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <QrCode className="h-3.5 w-3.5 text-white" />
                  <span>Mở Vé & Check-in QR</span>
                </button>
              )}
              {isFeeNotification(selectedNotif) && (
                <button
                  type="button"
                  onClick={() => {
                    const n = selectedNotif;
                    setSelectedNotif(null);
                    handlePayNotification(n);
                  }}
                  style={{ color: "#ffffff" }}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Wallet className="h-3.5 w-3.5 text-white" style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff" }}>Đi đến phần thanh toán</span>
                </button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
