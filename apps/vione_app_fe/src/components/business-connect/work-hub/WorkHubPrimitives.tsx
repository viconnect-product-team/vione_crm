// BC-8.0 — Work Hub UI primitives.
// Summary counts, single item card, category section. All labels via i18n.

import { Link } from "@tanstack/react-router";
import { useT, type TKey, hasTKey } from "@/lib/i18n";
import type {
  WorkHubCategory,
  WorkHubItemDTO,
  WorkHubSummaryDTO,
} from "@/lib/business-connect/work-hub";

const CATEGORY_ORDER: WorkHubCategory[] = [
  "overdue",
  "needs_action",
  "due_soon",
  "upcoming",
  "waiting",
  "recent",
];

const CATEGORY_LABEL: Record<WorkHubCategory, TKey> = {
  overdue: "bc.workHub.category.overdue",
  needs_action: "bc.workHub.category.needs_action",
  due_soon: "bc.workHub.category.due_soon",
  upcoming: "bc.workHub.category.upcoming",
  waiting: "bc.workHub.category.waiting",
  recent: "bc.workHub.category.recent",
};

export function WorkHubSummaryCards({
  summary,
}: {
  summary: WorkHubSummaryDTO | null | undefined;
}) {
  const t = useT();
  const cards: Array<{ key: TKey; count: number; tone: string }> = [
    {
      key: "bc.workHub.summary.overdue",
      count: summary?.overdueCount ?? 0,
      tone: "text-destructive",
    },
    {
      key: "bc.workHub.summary.needsAction",
      count: summary?.needsActionCount ?? 0,
      tone: "text-foreground",
    },
    {
      key: "bc.workHub.summary.dueSoon",
      count: summary?.dueSoonCount ?? 0,
      tone: "text-foreground",
    },
    {
      key: "bc.workHub.summary.upcoming",
      count: summary?.upcomingCount ?? 0,
      tone: "text-foreground",
    },
    {
      key: "bc.workHub.summary.waiting",
      count: summary?.waitingCount ?? 0,
      tone: "text-muted-foreground",
    },
    {
      key: "bc.workHub.summary.recent",
      count: summary?.recentCount ?? 0,
      tone: "text-muted-foreground",
    },
  ];
  return (
    <div
      role="list"
      aria-label={t("bc.workHub.title")}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
    >
      {cards.map((c: any) => (
        <div key={c.key} role="listitem" className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t(c.key)}
          </div>
          <div className={`mt-2 text-2xl font-semibold ${c.tone}`}>{c.count}</div>
        </div>
      ))}
    </div>
  );
}

export function WorkHubItemCard({ item }: { item: WorkHubItemDTO }) {
  const t = useT();
  const title = hasTKey(item.titleKey) ? t(item.titleKey as TKey) : item.titleKey;
  const desc =
    item.descriptionKey && hasTKey(item.descriptionKey) ? t(item.descriptionKey as TKey) : null;
  const actionLabel = hasTKey(item.action.labelKey)
    ? t(item.action.labelKey as TKey)
    : item.action.labelKey;

  const target = item.action.targetRoute;
  const params = item.action.targetParams ?? undefined;
  const search = item.action.targetSearch ?? undefined;

  return (
    <article
      className="flex items-start justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm hover:border-primary/40 focus-within:border-primary/40"
      aria-labelledby={`wh-title-${item.id}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={
              "inline-block h-2 w-2 shrink-0 rounded-full " +
              (item.urgency === "critical"
                ? "bg-destructive"
                : item.urgency === "high"
                  ? "bg-primary"
                  : "bg-muted-foreground/50")
            }
            aria-hidden="true"
          />
          <h3 id={`wh-title-${item.id}`} className="truncate text-sm font-semibold text-foreground">
            {title}
          </h3>
        </div>
        {desc && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{desc}</p>}
        {item.safeDisplayData.counterpartDisplayName && (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {item.safeDisplayData.counterpartDisplayName}
          </p>
        )}
      </div>
      {target && item.viewerPermissions.canRoute ? (
        <Link
          // Untyped runtime navigation is intentional here: hub cards route into
          // arbitrary product surfaces based on the resolver output. Types are
          // enforced at the resolver boundary.

          to={target as any}
          params={(params ?? {}) as any}
          search={(search ?? {}) as any}
          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {actionLabel}
        </Link>
      ) : null}
    </article>
  );
}

export function WorkHubCategorySection({
  category,
  items,
  emptyLabel,
}: {
  category: WorkHubCategory;
  items: WorkHubItemDTO[];
  emptyLabel?: string;
}) {
  const t = useT();
  if (items.length === 0 && !emptyLabel) return null;
  return (
    <section aria-labelledby={`wh-cat-${category}`} className="space-y-3">
      <h2
        id={`wh-cat-${category}`}
        className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {t(CATEGORY_LABEL[category])}
        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
          {items.length}
        </span>
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div role="list" className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {items.map((it) => (
            <div role="listitem" key={it.id}>
              <WorkHubItemCard item={it} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export const WORK_HUB_CATEGORY_ORDER = CATEGORY_ORDER;
