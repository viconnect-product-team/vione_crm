// BC-UI-1 — Business Connect product surface layout.
//
// Wraps the two shipped domains (My Business Card, Saved Business Cards) plus
// Overview and "coming soon" placeholders in one coherent surface inside the
// authenticated AppShell. Tab navigation uses type-safe <Link>; each leaf
// route owns its own head()/content. No business logic here.

import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { AppShell } from "@/components/dashboard/AppShell";
import { useT, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/business-connect")({
  ssr: false,
  component: BusinessConnectLayout,
});

type Tab = { key: TKey; to: string; exact?: boolean };

const TABS: Tab[] = [
  { key: "bc.tab.overview", to: "/business-connect", exact: true },
  { key: "bc.tab.myCard", to: "/business-connect/my-card" },
  { key: "bc.tab.saved", to: "/business-connect/saved-cards" },
  { key: "bc.tab.connections", to: "/business-connect/connections" },
  { key: "bc.tab.meetings", to: "/business-connect/meetings" },
  { key: "bc.tab.timeline", to: "/business-connect/relationship-timeline" },
  { key: "bc.memory.tab", to: "/business-connect/memory" },
];

function BusinessConnectLayout() {
  const t = useT();
  const location = useLocation();
  const isFullBleed =
    location.pathname === "/business-connect" ||
    location.pathname === "/business-connect/" ||
    location.pathname.startsWith("/business-connect/v");

  // Khi người dùng vào /business-connect hoặc các bản demo v1, v2, v3, v4, hiển thị toàn màn hình (Full-bleed) không bị bó khung trong AppShell
  if (isFullBleed) {
    return <Outlet />;
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <header className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("bc.surface.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("bc.surface.subtitle")}</p>
        </header>

        <nav
          aria-label={t("bc.surface.title")}
          className="mb-6 flex gap-1 overflow-x-auto border-b"
        >
          {TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: tab.exact }}
              className="whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[status=active]:border-b-2 data-[status=active]:border-primary data-[status=active]:text-foreground"
            >
              {t(tab.key)}
            </Link>
          ))}
        </nav>

        <Outlet />
      </div>
    </AppShell>
  );
}

