// BC-8.1 Turn C §A §B §K §V — Business Connect Notification Center product surface.
//
// Renders the recipient-scoped Business Connect notification stream via the
// public SDK hooks. No direct SDK/runtime imports; no PII in query keys.

import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useT, type TKey, hasTKey } from "@/lib/i18n";
import { toast } from "sonner";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkNotificationUnread,
  useArchiveNotification,
  useArchiveAllRead,
  useDeleteNotification,
} from "@/hooks/use-bc-notifications";
import { GlobalNetworkSDK } from "@/lib/global-network/network.sdk";
import type {
  NotificationDTO,
  NotificationStatus,
} from "@/lib/business-connect/notification-orchestration/types";
import {
  Bell,
  Check,
  CheckCheck,
  Archive,
  RefreshCw,
  Trash2,
  UserCheck,
  UserX,
  MessageSquare,
  User,
  Loader2,
} from "lucide-react";

const STATUS_TABS: Array<{ key: NotificationStatus | "all"; labelKey: TKey }> = [
  { key: "all", labelKey: "bc.notif.filter.status.all" },
  { key: "delivered", labelKey: "bc.notif.filter.status.delivered" },
  { key: "read", labelKey: "bc.notif.filter.status.read" },
  { key: "archived", labelKey: "bc.notif.filter.status.archived" },
];

function fallbackText(t: ReturnType<typeof useT>, key: string, fallback: string): string {
  return hasTKey(key) ? t(key) : fallback;
}

function NotificationRow({
  n,
  onAction,
  actionState,
  onDelete,
}: {
  n: NotificationDTO;
  onAction: (notifId: string, connId: string, action: "accepted" | "declined") => Promise<void>;
  actionState?: "accepted" | "declined";
  onDelete: (id: string) => Promise<void>;
}) {
  const t = useT();
  const markRead = useMarkNotificationRead();
  const markUnread = useMarkNotificationUnread();
  const archive = useArchiveNotification();
  const [isProcessing, setIsProcessing] = useState(false);

  const isUnread = n.status === "delivered" || n.status === "pending" || n.status === "scheduled" || n.readAt === null;
  const priorityKey = `bc.notif.priority.${n.priority}`;

  // Check connection status
  const safeData = n.safeDisplayData as any;
  const isConnectionNotification =
    n.notificationKind === "connection_request_received" ||
    n.notificationKind === "connection_request_accepted" ||
    n.notificationKind === "connection_request_declined" ||
    n.sourceDomain === "connection" ||
    !!safeData?.connectionId;

  const rawConnStatus =
    actionState ||
    safeData?.connectionStatus ||
    safeData?.scalars?.connectionStatus ||
    (n.notificationKind === "connection_request_accepted" ? "accepted" : null) ||
    (n.notificationKind === "connection_request_declined" ? "declined" : null);

  const connId = safeData?.connectionId || n.sourceRecordId;
  const counterpartName =
    safeData?.counterpartDisplayName ||
    safeData?.senderName ||
    safeData?.senderHandle ||
    "Người dùng";
  const counterpartAvatar = safeData?.counterpartAvatarUrl || safeData?.senderAvatar;
  const senderUserId = safeData?.senderUserId || safeData?.counterpartUserId;

  const handleAccept = async () => {
    if (!connId || isProcessing) return;
    setIsProcessing(true);
    try {
      await onAction(n.id, connId, "accepted");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!connId || isProcessing) return;
    setIsProcessing(true);
    try {
      await onAction(n.id, connId, "declined");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <li
      className={[
        "flex flex-col gap-3 rounded-xl border p-4 transition-all hover:shadow-sm",
        isUnread ? "border-primary/30 bg-primary/[0.03]" : "border-border bg-card",
      ].join(" ")}
      aria-labelledby={`notif-title-${n.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {counterpartAvatar ? (
            <img
              src={counterpartAvatar}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-border"
            />
          ) : (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
              {counterpartName.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs">
              <span
                className={[
                  "inline-flex items-center rounded-full px-2 py-0.5 font-medium text-[11px]",
                  n.priority === "critical"
                    ? "bg-destructive/10 text-destructive"
                    : n.priority === "high"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-muted text-muted-foreground",
                ].join(" ")}
                aria-label={fallbackText(t, priorityKey, n.priority)}
              >
                {fallbackText(t, priorityKey, n.priority)}
              </span>
              <time className="text-muted-foreground text-[11px]" dateTime={n.createdAt}>
                {new Date(n.createdAt).toLocaleString()}
              </time>
            </div>
            <h3
              id={`notif-title-${n.id}`}
              className="mt-1 truncate text-sm font-semibold text-foreground"
            >
              {fallbackText(t, n.titleKey, n.notificationKind || "Thông báo")}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {fallbackText(t, n.bodyKey, "")}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex shrink-0 items-center gap-1">
          {isUnread ? (
            <button
              type="button"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title={t("bc.notif.markRead")}
              disabled={markRead.isPending}
              onClick={() => markRead.mutate({ id: n.id })}
            >
              <Check className="h-4 w-4" aria-hidden />
            </button>
          ) : n.status === "read" ? (
            <button
              type="button"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title={t("bc.notif.markUnread")}
              disabled={markUnread.isPending}
              onClick={() => markUnread.mutate({ id: n.id })}
            >
              <CheckCheck className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          {n.status !== "archived" ? (
            <button
              type="button"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title={t("bc.notif.archive")}
              disabled={archive.isPending}
              onClick={() => archive.mutate({ id: n.id })}
            >
              <Archive className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
            title="Xóa thông báo"
            onClick={() => onDelete(n.id)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* Connection interactive actions & resolved status */}
      {isConnectionNotification && (
        <div className="mt-1 flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
          {rawConnStatus === "accepted" ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <UserCheck className="h-3.5 w-3.5" />
                ✓ Đã kết nối
              </span>
              {senderUserId ? (
                <>
                  <Link
                    to="/connect-app/inbox"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Nhắn tin
                  </Link>
                  <Link
                    to="/connect-app/network/$personId"
                    params={{ personId: `u:${senderUserId}` }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <User className="h-3.5 w-3.5" />
                    Trang cá nhân
                  </Link>
                </>
              ) : null}
            </div>
          ) : rawConnStatus === "declined" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground border border-border">
              <UserX className="h-3.5 w-3.5" />
              ✕ Đã từ chối
            </span>
          ) : connId ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleAccept}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
              >
                {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                Đồng ý kết nối
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleDecline}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 transition-all"
              >
                <UserX className="h-3.5 w-3.5" />
                Từ chối
              </button>
            </div>
          ) : null}
        </div>
      )}

      {n.action?.targetRoute && !isConnectionNotification ? (
        <a
          href={n.action.targetRoute}
          className="inline-flex w-fit items-center gap-1 rounded-md text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {fallbackText(t, n.action.labelKey, t("bc.notif.openAction"))}
        </a>
      ) : null}
    </li>
  );
}

export function BcNotificationCenter() {
  const t = useT();
  const [status, setStatus] = useState<NotificationStatus | "all">("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [actionStates, setActionStates] = useState<Record<string, "accepted" | "declined">>({});

  const filters = useMemo(
    () => ({ status: status === "all" ? null : status, unreadOnly, limit: 30 }),
    [status, unreadOnly],
  );
  const q = useNotifications(filters);
  const unread = useUnreadNotificationCount();
  const archiveAllRead = useArchiveAllRead();
  const markRead = useMarkNotificationRead();
  const deleteNotif = useDeleteNotification();

  const handleAction = async (notifId: string, connId: string, action: "accepted" | "declined") => {
    setActionStates((prev) => ({
      ...prev,
      [notifId]: action,
      [connId]: action,
    }));
    try {
      if (action === "accepted") {
        await GlobalNetworkSDK.mutations.accept(connId);
        markRead.mutate({ id: notifId });
        toast.success("Đã đồng ý kết nối thành công!");
      } else {
        await GlobalNetworkSDK.mutations.decline(connId);
        markRead.mutate({ id: notifId });
        toast.info("Đã từ chối lời mời kết nối.");
      }
      void q.refetch();
      void unread.refetch();
    } catch {
      toast.error("Thao tác kết nối không thành công. Vui lòng thử lại.");
    }
  };

  const handleDelete = async (notifId: string) => {
    try {
      await deleteNotif.mutateAsync({ id: notifId });
      toast.success("Đã xóa thông báo");
      void q.refetch();
      void unread.refetch();
    } catch {
      toast.error("Không thể xóa thông báo");
    }
  };

  return (
    <section aria-labelledby="bc-notif-heading" className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1
            id="bc-notif-heading"
            className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground"
          >
            <Bell className="h-6 w-6" aria-hidden />
            {t("bc.notif.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("bc.notif.subtitle")} ·{" "}
            <span aria-live="polite">
              {t("bc.notif.unreadCount", { count: unread.data?.count ?? 0 })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            onClick={() => {
              void q.refetch();
              void unread.refetch();
            }}
            aria-label={t("bc.notif.refresh")}
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            {t("bc.notif.refresh")}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            disabled={archiveAllRead.isPending}
            onClick={() => archiveAllRead.mutate()}
          >
            <Archive className="h-4 w-4" aria-hidden />
            {t("bc.notif.archiveAllRead")}
          </button>
        </div>
      </header>

      <div
        role="tablist"
        aria-label={t("bc.notif.title")}
        className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1"
      >
        {STATUS_TABS.map((tab) => {
          const selected = status === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              type="button"
              aria-selected={selected}
              className={[
                "rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
                selected
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
              onClick={() => setStatus(tab.key)}
            >
              {t(tab.labelKey)}
            </button>
          );
        })}
        <label className="ml-auto inline-flex items-center gap-2 px-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="rounded border-border"
          />
          {t("bc.notif.unreadOnly")}
        </label>
      </div>

      {q.isLoading ? (
        <p className="text-sm text-muted-foreground" role="status">
          {t("bc.notif.loading")}
        </p>
      ) : q.isError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="text-destructive">{t("bc.notif.error")}</p>
          <button
            type="button"
            className="mt-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => void q.refetch()}
          >
            {t("bc.notif.retry")}
          </button>
        </div>
      ) : (q.data?.items.length ?? 0) === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t("bc.notif.empty")}
        </p>
      ) : (
        <ul role="list" className="space-y-2.5" aria-busy={q.isFetching}>
          {q.data!.items.map((n: any) => (
            <NotificationRow
              key={n.id}
              n={n}
              onAction={handleAction}
              actionState={actionStates[n.id] || (n.safeDisplayData?.connectionId ? actionStates[n.safeDisplayData.connectionId] : undefined)}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

