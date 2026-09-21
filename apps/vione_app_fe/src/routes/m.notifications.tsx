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
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

const NOTIFICATIONS_PREFS_KEY = "vba-notifications-preferences";

const notificationsSearchSchema = z.object({
  filter: fallback(
    z.enum(["all", "lead", "unread", "read", "dismissed", "event", "fee", "opportunity"]),
    "all",
  ).default("all"),
  sort: fallback(z.enum(["priority", "newest"]), "priority").default("priority"),
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/m/notifications")({
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
  const dismissAll = useServerFn(dismissAllNotificationsFn);
  const dismissBroadcast = useServerFn(dismissBroadcastNotificationsFn);
  const restoreOne = useServerFn(restoreNotificationFn);
  const restoreBroadcast = useServerFn(restoreBroadcastNotificationsFn);
  const restoreAllPersonal = useServerFn(restoreAllPersonalNotificationsFn);
  const navigate = useNavigate({ from: "/m/notifications" });
  const {
    data: notifications,
    loading,
    reload,
  } = useServerData<MyNotification[]>(() => fetchNotis(), []);
  const [marking, setMarking] = useState(false);
  const [dismissingAll, setDismissingAll] = useState(false);
  const [openingLeadId, setOpeningLeadId] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [confirmDismiss, setConfirmDismiss] = useState<MyNotification | null>(null);
  const [confirmDismissAll, setConfirmDismissAll] = useState(false);
  const dismissTriggerRef = useRef<HTMLElement | null>(null);
  const restoreDialogFocus = () => {
    const el = dismissTriggerRef.current;
    dismissTriggerRef.current = null;
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
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-[var(--vba-border)] bg-slate-100 dark:bg-[var(--vba-surface)] text-[var(--vba-gold)] hover:bg-[var(--vba-gold-soft)] transition-colors disabled:opacity-30 cursor-pointer shadow-xs"
            >
              {marking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
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
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-[var(--vba-border)] bg-slate-100 dark:bg-[var(--vba-surface)] text-slate-500 dark:text-[var(--vba-text-muted)] hover:text-red-500 hover:border-red-400/40 transition-colors disabled:opacity-30 cursor-pointer shadow-xs"
            >
              {dismissingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>
          </div>
        }
      />

      <div className="mt-3 space-y-3 px-4">
        {/* Segmented Filter Control */}
        <div
          className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--vba-border)] overflow-x-auto no-scrollbar"
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
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  active
                    ? "bg-[var(--vba-gold)] text-[#0B0C10] shadow-sm font-bold scale-[1.02]"
                    : "text-[var(--vba-text-muted)] hover:text-[var(--vba-text)] hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <span>{tab.label}</span>
                {count != null && count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold tabular-nums ${
                      active
                        ? "bg-[#0B0C10]/20 text-[#0B0C10]"
                        : "bg-[var(--vba-gold-soft)] text-[var(--vba-gold)] border border-[var(--vba-border)]"
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

          // Color coded per type
          const typeTheme: Record<string, { iconBg: string; badge: string; label: string }> = {
            opportunity: {
              iconBg: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
              badge: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
              label: "Cơ hội B2B",
            },
            lead: {
              iconBg: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
              badge: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
              label: "Khách hàng B2B",
            },
            event: {
              iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
              badge: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
              label: "Sự kiện",
            },
            fee: {
              iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
              badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
              label: "Hội phí",
            },
            network: {
              iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
              badge: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
              label: "Kết nối",
            },
            info: {
              iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
              badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
              label: "Hệ thống",
            },
          };

          const theme = typeTheme[n.type] || {
            iconBg: "bg-muted text-muted-foreground border-border",
            badge: "bg-muted text-muted-foreground border-border",
            label: "Thông báo",
          };

          return (
            <div
              key={n.id}
              role="listitem"
              className={`relative flex gap-3.5 p-4 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md overflow-hidden ${
                n.unread
                  ? "bg-amber-50/50 dark:bg-[#121927] border-amber-300/70 dark:border-[#D8B282]/50 shadow-sm"
                  : "bg-[var(--vba-surface,#fff)] border-slate-200 dark:border-[#243042] hover:border-slate-300 dark:hover:border-[#334155]"
              }`}
            >
              {/* Vertical Indicator on Unread */}
              {n.unread && (
                <span className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full bg-[var(--vba-gold)]" />
              )}

              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border shadow-xs ${theme.iconBg}`}>
                <Icon className="h-5 w-5" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-wider border ${theme.badge}`}>
                      {theme.label}
                    </span>
                    {n.priority !== "low" && (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider"
                        style={{
                          color: priorityColor(n.priority),
                          background: "var(--vba-gold-soft)",
                        }}
                        aria-label={`${t("m.notifications.status.priority")}: ${t(PRIORITY_KEY[n.priority as NotificationPriority])}`}
                      >
                        {t(PRIORITY_KEY[n.priority as NotificationPriority])}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {n.unread && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
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
                  <span className="truncate text-[13.5px] font-bold text-[var(--vba-text)]">
                    {n.title}
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
                            to: "/m/business-cards",
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
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[var(--vba-gold)] transition hover:bg-[var(--vba-gold-soft)] disabled:opacity-50 cursor-pointer"
                    >
                      {openingLeadId === n.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ExternalLink className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>

                <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--vba-text-muted)]">
                  {n.body}
                </p>

                {/* Thẻ biểu quyết tương tác trực tiếp (Đang mở) */}
                {((n.type === "voting" || n.notificationKind === "interactive_poll" || n.refType === "voting" || Boolean(n.safeDisplayData?.pollId)) &&
                  n.safeDisplayData?.options &&
                  !(n.notificationKind === "poll_result" || (n as any).eventKind === "poll_closed" || (n.safeDisplayData as any)?.isClosed)) && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[11.5px] font-bold text-amber-800 dark:text-amber-300">
                        Bình chọn ý kiến của bạn:
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20">
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
                    {n.safeDisplayData.dueDate && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Hạn chót: {new Date(n.safeDisplayData.dueDate).toLocaleDateString("vi-VN")}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        void markRead({ data: { id: n.id } }).catch(() => {});
                        void navigate({ to: "/m/renew" });
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Wallet className="size-3.5" />
                      <span>Thanh toán ngay</span>
                    </button>
                  </div>
                )}

                {n.refType === "renewal_audit" && n.refId && (
                  <button
                    type="button"
                    onClick={() => {
                      void markRead({ data: { id: n.id } }).catch(() => {});
                      void navigate({ to: "/m/renew/audit", search: { ref: n.refId as string } });
                    }}
                    className="mt-2 inline-flex items-center gap-1 rounded-xl border border-[var(--vba-border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--vba-gold)] transition hover:bg-[var(--vba-gold-soft)] cursor-pointer"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {t("m.notifications.renewal.openAudit")}
                  </button>
                )}

                <div className="mt-3 flex items-center gap-2 pt-2 border-t border-[var(--vba-border)]/60">
                  {n.dismissed ? (
                    <button
                      type="button"
                      disabled={rowBusy === n.id}
                      onClick={() => onUndoDismiss(n)}
                      className="inline-flex items-center gap-1 rounded-xl border border-[var(--vba-border)] px-2.5 py-1 text-[11px] font-medium text-[var(--vba-text-muted)] transition hover:bg-[var(--vba-gold-soft)] disabled:opacity-50 cursor-pointer"
                    >
                      {rowBusy === n.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      {t("m.notifications.undo.action")}
                    </button>
                  ) : (
                    <>
                      {n.unread && n.personal && (
                        <button
                          type="button"
                          disabled={rowBusy === n.id}
                          onClick={() => onMarkOneRead(n)}
                          className="inline-flex items-center gap-1 rounded-xl border border-[var(--vba-border)] bg-[var(--vba-surface,#fff)] px-2.5 py-1 text-[11px] font-semibold text-[var(--vba-gold)] transition hover:bg-[var(--vba-gold-soft)] disabled:opacity-50 shadow-xs cursor-pointer active:scale-95"
                        >
                          {rowBusy === n.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          {t("m.notifications.markOne")}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={rowBusy === n.id}
                        onClick={(e) => {
                          dismissTriggerRef.current = e.currentTarget;
                          setConfirmDismiss(n);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl border border-[var(--vba-border)] px-2.5 py-1 text-[11px] font-medium text-[var(--vba-text-muted)] transition hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 cursor-pointer"
                      >
                        <EyeOff className="h-3 w-3" />
                        {t("m.notifications.dismiss")}
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
          <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 mb-1 ring-8 ring-sky-500/5">
            <EyeOff className="h-6 w-6" />
          </div>
          <AlertDialogHeader className="text-center sm:text-center space-y-1.5">
            <AlertDialogTitle className="text-[17px] font-bold text-slate-900 dark:text-white text-center">
              {t("m.notifications.dismissConfirm.title")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-400 text-center max-w-[260px] mx-auto">
              {t("m.notifications.dismissConfirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-3 pt-3 sm:flex-none">
            <AlertDialogCancel
              onClick={() => setConfirmDismiss(null)}
              className="w-full h-11 !m-0 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-[13.5px] font-semibold transition cursor-pointer flex items-center justify-center"
            >
              {t("m.notifications.dismissConfirm.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDismiss) onDismiss(confirmDismiss);
                setConfirmDismiss(null);
              }}
              className="w-full h-11 !m-0 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-[13.5px] font-bold shadow-md shadow-sky-500/25 transition cursor-pointer flex items-center justify-center"
            >
              {t("m.notifications.dismissConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 mb-1 ring-8 ring-sky-500/5">
            <EyeOff className="h-6 w-6" />
          </div>
          <AlertDialogHeader className="text-center sm:text-center space-y-1.5">
            <AlertDialogTitle className="text-[17px] font-bold text-slate-900 dark:text-white text-center">
              {t("m.notifications.dismissAllConfirm.title")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-400 text-center max-w-[260px] mx-auto">
              {t("m.notifications.dismissAllConfirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-3 pt-3 sm:flex-none">
            <AlertDialogCancel
              onClick={() => setConfirmDismissAll(false)}
              className="w-full h-11 !m-0 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-[13.5px] font-semibold transition cursor-pointer flex items-center justify-center"
            >
              {t("m.notifications.dismissAllConfirm.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDismissAll}
              className="w-full h-11 !m-0 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-[13.5px] font-bold shadow-md shadow-sky-500/25 transition cursor-pointer flex items-center justify-center"
            >
              {t("m.notifications.dismissAllConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
