// BC-9.1 Turn C1 — Compact summary widget for person/relationship sidebars.

import { Link } from "@tanstack/react-router";
import { Card } from "@/components/dashboard/PageKit";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, useFmt } from "@/lib/i18n";
import { useRelationshipMemories } from "@/hooks/use-relationship-memory";
import type {
  RelationshipMemorySubject,
  RelationshipMemoryDTO,
} from "@/lib/business-connect/relationship-memory";
import {
  RelationshipMemoryConfidenceBadge,
  RelationshipMemoryStatusBadge,
  kindLabelKey,
} from "./badges";
import { memoryDisplayText } from "./display";

export interface RelationshipMemorySummaryProps {
  subject: RelationshipMemorySubject;
  /** Number of memories to preview in the compact card. */
  limit?: number;
}

export function RelationshipMemorySummary({ subject, limit = 3 }: RelationshipMemorySummaryProps) {
  const t = useT();
  const fmt = useFmt();
  const query = useRelationshipMemories({
    subject,
    statuses: ["active"],
    limit,
  });

  const items: RelationshipMemoryDTO[] = query.data?.items ?? [];
  const latest = items[0]?.lastObservedAt ?? null;
  const totalSources = items.reduce((n, m) => n + m.sourceCount, 0);

  return (
    <Card className="p-4">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t("bc.memory.summary.title")}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {latest
              ? `${t("bc.memory.summary.updated")} · ${fmt.rel(latest)}`
              : t("bc.memory.disclaimer")}
          </p>
        </div>
        <Link
          to="/business-connect/memory"
          className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("bc.memory.summary.viewAll")}
        </Link>
      </header>

      {query.isLoading ? (
        <div role="status" aria-busy="true" className="space-y-2">
          <span className="sr-only">{t("bc.memory.loading")}</span>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("bc.memory.empty.noActive")}</p>
      ) : (
        <>
          <ul role="list" className="space-y-2">
            {items.map((m) => (
              <li key={m.id} className="text-sm">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t(kindLabelKey(m.kind) as never)}
                  </span>
                  <RelationshipMemoryStatusBadge status={m.status} />
                  <RelationshipMemoryConfidenceBadge
                    confidence={m.confidence}
                    sourceCount={m.sourceCount}
                  />
                </div>
                <p className="mt-0.5 text-foreground">{memoryDisplayText(m)}</p>
              </li>
            ))}
          </ul>
          {totalSources > 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {t("bc.memory.summary.sources", { n: totalSources })}
            </p>
          ) : null}
        </>
      )}
    </Card>
  );
}
