// BC-3.1F — Networking notification center view.
// Presentation only: consumes the notification hook, renders privacy-safe rows
// (public actor projection only), and supports mark-all-read. i18n throughout.

import { Link } from "@tanstack/react-router";
import { Loader2, UserRound } from "lucide-react";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/dashboard/StateKit";
import { useNetworkNotifications } from "@/hooks/use-network-notifications";
import { useT } from "@/lib/i18n";

function actorName(name: string | null | undefined, fallback: string): string {
  return name && name.trim() ? name : fallback;
}

export function NetworkNotificationsView() {
  const t = useT();
  const { items, loading, error, unread, reload, markAllRead } = useNetworkNotifications();

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          {t("connect.network.notif.title")}
        </h2>
        <button
          type="button"
          onClick={() => void markAllRead()}
          disabled={unread === 0}
          className="rounded-lg border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          {t("connect.network.notif.markAllRead")}
        </button>
      </div>

      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorState onRetry={() => void reload()} />
      ) : items.length === 0 ? (
        <EmptyState title={t("connect.network.notif.empty")} />
      ) : (
        <ul className="flex flex-col gap-2" aria-live="polite">
          {items.map((n: any) => {
            const name = actorName(n.actor?.displayName, t("connect.network.notif.someone"));
            const msg =
              n.type === "connection_accepted"
                ? t("connect.network.notif.accepted")
                : t("connect.network.notif.request");
            const slug = n.actor?.primaryCardSlug ?? null;
            const inner = (
              <>
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-muted-foreground"
                >
                  {n.actor?.avatarUrl ? (
                    <img src={n.actor.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <UserRound className="h-4 w-4" />
                  )}
                </span>
                <p className="min-w-0 flex-1 text-sm text-foreground">
                  <span className="font-semibold">{name}</span> {msg}
                </p>
                {!n.read ? (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="unread" />
                ) : null}
              </>
            );
            const cls = `flex items-center gap-3 rounded-xl border p-3 ${
              n.read ? "bg-card" : "bg-primary/5"
            }`;
            return (
              <li key={n.id}>
                {slug ? (
                  <Link
                    to="/b/$slug"
                    params={{ slug }}
                    className={`${cls} transition hover:bg-muted`}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className={cls}>{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function NetworkNotificationsSuspense() {
  return (
    <div className="grid place-items-center py-10 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}
