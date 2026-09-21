// BC-5.1 — Connections workspace: Discover / Incoming / Sent / Connected tabs.

import { Link, getRouteApi } from "@tanstack/react-router";
import { useT, type TKey } from "@/lib/i18n";
import { RecommendationFeed } from "./RecommendationFeed";
import { IncomingRequestsList } from "./IncomingRequestsList";
import { OutgoingRequestsList } from "./OutgoingRequestsList";
import { ConnectedPeopleList } from "./ConnectedPeopleList";
import type { ConnectionTab } from "@/lib/connection/route-search";

const routeApi = getRouteApi("/business-connect/connections/");

const TABS: ConnectionTab[] = ["discover", "incoming", "sent", "connected"];

export function ConnectionsWorkspace() {
  const t = useT();
  const { tab } = routeApi.useSearch();

  const tabClass =
    "rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&.active]:bg-muted [&.active]:text-foreground";

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold text-foreground">{t("bc.conn.workspace.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("bc.conn.workspace.subtitle")}</p>
      </header>

      <nav
        role="tablist"
        aria-label={t("bc.conn.workspace.tabsLabel")}
        className="-mx-1 flex items-center gap-1 overflow-x-auto border-b pb-3"
        data-testid="bc-conn-tabs"
      >
        {TABS.map((k) => (
          <Link
            key={k}
            role="tab"
            aria-selected={tab === k}
            to="/business-connect/connections"
            search={{ tab: k }}
            className={tabClass}
            data-testid={`bc-conn-tab-${k}`}
            resetScroll={false}
          >
            {t(`bc.conn.tab.${k}` as TKey)}
          </Link>
        ))}
      </nav>

      <section
        role="tabpanel"
        aria-label={t(`bc.conn.tab.${tab}` as TKey)}
        data-testid={`bc-conn-panel-${tab}`}
      >
        {tab === "discover" ? <RecommendationFeed /> : null}
        {tab === "incoming" ? <IncomingRequestsList /> : null}
        {tab === "sent" ? <OutgoingRequestsList /> : null}
        {tab === "connected" ? <ConnectedPeopleList /> : null}
      </section>
    </div>
  );
}
