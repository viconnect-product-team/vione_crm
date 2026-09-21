import { Bell, CheckCheck, Megaphone, Info, ChevronRight, Trash2, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import type { Notification } from "@/lib/extra-data";
import { listNotificationsFn, deleteNotificationFn } from "@/lib/notifications.functions";
import { getLastSeen, markNotificationsSeen } from "@/hooks/use-unread-notifications";
import { ListSkeleton, NoNotifications } from "@/components/dashboard/StateKit";
import { getConnectAppSocket } from "@/hooks/use-connect-app-socket";
import { useRole } from "@/hooks/use-role";


function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function useRelativeTime() {
  const t = useT();
  return useCallback(
    (iso: string) => {
      const ts = iso ? new Date(iso).getTime() : 0;
      if (!ts) return "";
      const diff = Date.now() - ts;
      const min = Math.floor(diff / 60000);
      if (min < 1) return t("time.now");
      if (min < 60) return `${min} ${t("time.minute")}`;
      const hr = Math.floor(min / 60);
      if (hr < 24) return `${hr} ${t("time.hour")}`;
      const day = Math.floor(hr / 24);
      if (day < 30) return `${day} ${t("time.day")}`;
      return new Date(ts).toLocaleDateString();
    },
    [t],
  );
}

function audienceIcon(a: Notification["audience"]) {
  if (a === "sponsors" || a === "staff") return Info;
  return Megaphone;
}

export function NotificationCenter() {
  const t = useT();
  const rel = useRelativeTime();
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const list = useServerFn(listNotificationsFn);
  const deleteFn = useServerFn(deleteNotificationFn);
  const [items, setItems] = useState<Notification[]>([]);
  const [seen, setSeen] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const rows = await list({ data: { appScope: "crm" } as never });
      const uniqueMap = new Map<string, Notification>();
      for (const r of rows) {
        if (r.status !== "sent") continue;
        // Hide staff-only and member approval notifications from non-admin accounts
        if (!isAdmin) {
          if (r.audience === "staff") continue;
          const tLower = (r.title || "").toLowerCase();
          const bLower = (r.body || "").toLowerCase();
          if (
            (tLower.includes("đăng ký") && (bLower.includes("duyệt") || bLower.includes("nộp hồ sơ"))) ||
            bLower.includes("bấm để duyệt ngay") ||
            (r as any).targetRoute?.includes("status=pending")
          ) {
            continue;
          }
        }
        const key = r.id || `${r.title}:${r.body}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, r);
        }
      }
      setItems([...uniqueMap.values()]);
      setSeen(getLastSeen());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [list, isAdmin]);

  useEffect(() => {
    void refresh();
    const onSeen = () => setSeen(getLastSeen());
    window.addEventListener("notifications-seen", onSeen);
    window.addEventListener("connect-app:notification", refresh);

    const socket = getConnectAppSocket();
    const onSocketNotif = () => {
      void refresh();
    };
    socket.on("notification:new", onSocketNotif);
    socket.on("notification:count", onSocketNotif);
    socket.on("notification:unread_count", onSocketNotif);
    socket.on("notification", onSocketNotif);

    return () => {
      window.removeEventListener("notifications-seen", onSeen);
      window.removeEventListener("connect-app:notification", refresh);
      socket.off("notification:new", onSocketNotif);
      socket.off("notification:count", onSocketNotif);
      socket.off("notification:unread_count", onSocketNotif);
      socket.off("notification", onSocketNotif);
    };
  }, [refresh]);


  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteFn({ data: { id } });
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Đã xóa thông báo");
    } catch {
      toast.error("Không thể xóa thông báo");
    }
  };

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          (b.sentAt ? new Date(b.sentAt).getTime() : 0) -
          (a.sentAt ? new Date(a.sentAt).getTime() : 0),
      ),
    [items],
  );
  const unreadCount = useMemo(
    () => sorted.filter((n) => (n.sentAt ? new Date(n.sentAt).getTime() : 0) > seen).length,
    [sorted, seen],
  );
  const badgeText = unreadCount > 99 ? "99+" : String(unreadCount);

  const now = Date.now();
  const todayStart = startOfDay(now);
  const yesterdayStart = todayStart - 86400000;
  const tsOf = (n: Notification) => (n.sentAt ? new Date(n.sentAt).getTime() : 0);
  const today = sorted.filter((n) => tsOf(n) >= todayStart);
  const yesterday = sorted.filter((n) => tsOf(n) >= yesterdayStart && tsOf(n) < todayStart);
  const earlier = sorted.filter((n) => tsOf(n) < yesterdayStart);

  const markAll = () => {
    markNotificationsSeen();
    setSeen(Date.now());
  };

  const handleItemClick = (n: Notification) => {
    setOpen(false);
    markNotificationsSeen();
    setSeen(Date.now());

    // Determine target redirection route based on notification content/title
    const titleLower = (n.title || "").toLowerCase();
    const bodyLower = (n.body || "").toLowerCase();

    if (
      isAdmin &&
      (titleLower.includes("hội viên") ||
        titleLower.includes("đăng ký") ||
        titleLower.includes("gia nhập") ||
        bodyLower.includes("duyệt") ||
        bodyLower.includes("hồ sơ"))
    ) {
      void navigate({ to: "/members", search: { status: "pending" } });
      return;
    }

    if (
      titleLower.includes("phí") ||
      titleLower.includes("thanh toán") ||
      bodyLower.includes("hội phí")
    ) {
      void navigate({ to: "/fees" });
      return;
    }

    if (titleLower.includes("sự kiện") || bodyLower.includes("sự kiện")) {
      void navigate({ to: "/events" });
      return;
    }

    if (
      titleLower.includes("kết nối") ||
      bodyLower.includes("kết bạn") ||
      titleLower.includes("khoảnh khắc")
    ) {
      void navigate({ to: "/members" });
      return;
    }

    void navigate({ to: "/notifications" });
  };

  const renderItem = (n: Notification, i: number) => {
    const ts = n.sentAt ? new Date(n.sentAt).getTime() : 0;
    const unread = ts > seen;
    const Icon = audienceIcon(n.audience);
    return (
      <div
        key={n.id ?? `${n.title}-${i}`}
        onClick={() => handleItemClick(n)}
        className={`group flex items-start gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-muted relative cursor-pointer ${
          unread ? "bg-accent/40" : ""
        }`}
      >
        <span
          className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
            unread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">{n.title}</p>
            {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
          </div>
          {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium">
                {n.appScope === 'all' || n.targetApp === 'all' ? 'Toàn hệ thống' : 'CRM Quản trị'}
              </span>
              <p className="text-[11px] text-muted-foreground">{rel(n.sentAt)}</p>
            </div>
            <span className="text-[10px] text-primary/80 font-medium group-hover:underline flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Xem chi tiết</span>
              <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => handleDelete(e, n.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded ml-1"
          title="Xóa thông báo"
          aria-label="Xóa thông báo"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
        aria-label={t("notif.title")}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="vba-badge-pop absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
            {badgeText}
          </span>
        )}
      </button>

      {open && (
        <div className="vba-pop-in absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-border bg-popover shadow-[var(--shadow-elevated)]">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{t("notif.title")}</p>
              {unreadCount > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  {unreadCount} {t("notif.unreadCount")}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAll}
                className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {t("notif.markAll")}
              </button>
            )}
          </div>

          <div className="max-h-[min(26rem,60vh)] overflow-y-auto p-1.5">
            {loading ? (
              <div className="p-2.5">
                <ListSkeleton rows={4} />
              </div>
            ) : sorted.length === 0 ? (
              <NoNotifications />
            ) : (
              <>
                {[
                  { key: "notif.today", rows: today },
                  { key: "notif.yesterday", rows: yesterday },
                  { key: "notif.earlier", rows: earlier },
                ].map(
                  (s) =>
                    s.rows.length > 0 && (
                      <div key={s.key}>
                        <div className="px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {t(s.key as Parameters<typeof t>[0])}
                        </div>
                        {s.rows.map(renderItem)}
                      </div>
                    ),
                )}
              </>
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1 border-t border-border px-3.5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-muted"
          >
            {t("notif.viewAll")}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

