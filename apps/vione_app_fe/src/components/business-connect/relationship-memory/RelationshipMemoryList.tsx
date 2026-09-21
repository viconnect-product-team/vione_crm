// BC-9.1 Turn C1 — Grouped list rendering + filter/empty/error/loading states.

import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/dashboard/PageKit";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useT } from "@/lib/i18n";
import type {
  RelationshipMemoryDTO,
  RelationshipMemoryListFilters,
} from "@/lib/business-connect/relationship-memory";
import { useRelationshipMemories } from "@/hooks/use-relationship-memory";
import { RelationshipMemoryCard } from "./RelationshipMemoryCard";
import { RelationshipMemoryDetailDrawer } from "./RelationshipMemoryDetailDrawer";

export interface RelationshipMemoryListProps {
  filters?: RelationshipMemoryListFilters;
  /** Compact = smaller header, meant for embedding in detail sidebars. */
  compact?: boolean;
  showHistoricalToggle?: boolean;
}

const CURRENT = new Set<RelationshipMemoryDTO["status"]>(["active"]);
const HISTORICAL = new Set<RelationshipMemoryDTO["status"]>(["superseded", "expired", "dismissed"]);

export function RelationshipMemoryList({
  filters,
  compact = false,
  showHistoricalToggle = true,
}: RelationshipMemoryListProps) {
  const t = useT();
  const [showHistorical, setShowHistorical] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const query = useRelationshipMemories(filters);

  const grouped = useMemo(() => {
    const items = query.data?.items ?? [];
    const active: RelationshipMemoryDTO[] = [];
    const candidate: RelationshipMemoryDTO[] = [];
    const historical: RelationshipMemoryDTO[] = [];
    for (const m of items) {
      if (m.status === "candidate") candidate.push(m);
      else if (CURRENT.has(m.status)) active.push(m);
      else if (HISTORICAL.has(m.status)) historical.push(m);
    }
    return { active, candidate, historical };
  }, [query.data]);

  if (query.isLoading) {
    return (
      <div role="status" aria-live="polite" aria-busy="true" className="space-y-3">
        <span className="sr-only">{t("bc.memory.loading")}</span>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertTitle>{t("bc.memory.error.title")}</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-3">
          <span>{t("bc.memory.error.generic")}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => query.refetch()}>
            {t("bc.memory.error.retry")}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const total = grouped.active.length + grouped.candidate.length + grouped.historical.length;

  if (total === 0) {
    return (
      <Card className="p-6 text-center">
        <h3 className={compact ? "text-sm font-semibold" : "text-base font-semibold"}>
          {t("bc.memory.empty.title")}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("bc.memory.empty.description")}</p>
      </Card>
    );
  }

  const renderGroup = (label: string, items: RelationshipMemoryDTO[]) =>
    items.length === 0 ? null : (
      <section aria-label={label} className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </h3>
        <ul role="list" className="space-y-3">
          {items.map((m) => (
            <li key={m.id}>
              <RelationshipMemoryCard memory={m} onOpenDetails={setOpenId} />
            </li>
          ))}
        </ul>
      </section>
    );

  return (
    <div className="space-y-6">
      {renderGroup(t("bc.memory.list.title"), grouped.active)}
      {grouped.candidate.length > 0
        ? renderGroup(t("bc.memory.list.candidates"), grouped.candidate)
        : null}

      {showHistoricalToggle && grouped.historical.length > 0 ? (
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={showHistorical}
            onClick={() => setShowHistorical((v) => !v)}
          >
            {showHistorical
              ? t("bc.memory.list.hideHistorical")
              : t("bc.memory.list.showHistorical")}
          </Button>
          {showHistorical ? renderGroup(t("bc.memory.list.historical"), grouped.historical) : null}
        </div>
      ) : null}

      <RelationshipMemoryDetailDrawer memoryId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
