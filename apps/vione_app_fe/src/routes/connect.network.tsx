// BC-3.1C — Global Business Networking management shell.
// Tabbed layout over the three sections; children render in the <Outlet />.

import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/connect/network")({
  ssr: false,
  component: NetworkLayout,
});

function NetworkLayout() {
  const t = useT();
  const tabClass =
    "rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&.active]:bg-muted [&.active]:text-foreground";
  return (
    <div>
      <div className="mx-auto w-full max-w-5xl px-4 pt-6">
        <h1 className="text-xl font-semibold text-foreground">{t("connect.network.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("connect.network.subtitle")}</p>
        <nav
          className="mt-4 flex items-center gap-1 border-b pb-3"
          aria-label={t("connect.network.tabsLabel")}
        >
          <Link to="/connect/network/connections" className={tabClass}>
            {t("connect.network.tab.connections")}
          </Link>
          <Link to="/connect/network/requests/incoming" className={tabClass}>
            {t("connect.network.tab.incoming")}
          </Link>
          <Link to="/connect/network/requests/sent" className={tabClass}>
            {t("connect.network.tab.sent")}
          </Link>
          <Link to="/connect/network/notifications" className={tabClass}>
            {t("connect.network.notif.title")}
          </Link>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
