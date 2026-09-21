import { Fragment } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { navGroups, type NavItem, type NavGroup } from "@/lib/nav-items";
import { useT, type TKey } from "@/lib/i18n";

type Crumb = { label: string; to?: string };

/** Resolve the nav item + owning group for a base path (e.g. "/members"). */
function findNav(base: string): { group: NavGroup; item: NavItem } | null {
  for (const group of navGroups) {
    const item = group.items.find((it) => it.to === base);
    if (item) return { group, item };
  }
  return null;
}

/**
 * Build breadcrumb crumbs from the current pathname using the nav registry
 * as the single source of truth. Read-only; derives from the router only.
 */
function useCrumbs(): Crumb[] {
  const t = useT();
  const pathname = useRouterState({ select: (s) => s?.location?.pathname }) ?? "/";

  // Home / dashboard.
  if (pathname === "/") return [{ label: t("nav.dashboard") }];

  const segments = pathname.split("/").filter(Boolean);
  const base = "/" + segments[0];
  const match = findNav(base);

  const crumbs: Crumb[] = [];

  if (match) {
    if (match.group.label) crumbs.push({ label: t(match.group.label) });
    // The section item links back to its list/root route.
    crumbs.push({ label: t(match.item.key), to: base });
  } else {
    // Fallback: Title-case the first segment for routes outside the registry.
    crumbs.push({
      label: segments[0].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      to: base,
    });
  }

  // Nested detail / sub-page crumb (Members > Detail, Opportunities > Edit, ...).
  if (segments.length > 1) {
    const trailingKey: TKey = segments.includes("edit") ? "bc.edit" : "bc.detail";
    crumbs.push({ label: t(trailingKey) });
  }

  return crumbs;
}

export function TopbarBreadcrumb() {
  const crumbs = useCrumbs();
  const current = crumbs[crumbs.length - 1];

  return (
    <div className="min-w-0 flex-1 lg:flex-none">
      {/* Mobile / tablet: current page title only. */}
      <h1 className="truncate text-base font-semibold text-foreground md:hidden">
        {current.label}
      </h1>

      {/* Desktop: full breadcrumb trail. */}
      <nav aria-label="breadcrumb" className="hidden md:block">
        <ol className="flex items-center gap-1.5 text-sm">
          {crumbs.map((c, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <Fragment key={`${c.label}-${i}`}>
                {i > 0 && (
                  <ChevronRight
                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60"
                    aria-hidden="true"
                  />
                )}
                {isLast ? (
                  <span aria-current="page" className="truncate font-semibold text-foreground">
                    {c.label}
                  </span>
                ) : c.to ? (
                  <Link
                    to={c.to}
                    className="truncate rounded text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="truncate text-muted-foreground">{c.label}</span>
                )}
              </Fragment>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
