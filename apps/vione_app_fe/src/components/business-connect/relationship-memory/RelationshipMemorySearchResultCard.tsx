// BC-9.1 Turn C2 — Search-result card. Read-only.
//
// Renders one RelationshipMemorySearchResultDTO with match badges, relevance
// band, conflict/historical warnings, evidence summary, citation count and
// read-only action buttons (compare / history / feedback stub).

import { AlertTriangle, History, MessagesSquare } from "lucide-react";
import { Card } from "@/components/dashboard/PageKit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useT, useFmt } from "@/lib/i18n";
import type { RelationshipMemorySearchResultDTO } from "@/lib/business-connect/relationship-memory";
import {
  RelationshipMemoryConfidenceBadge,
  RelationshipMemoryFreshnessBadge,
  RelationshipMemoryStatusBadge,
  kindLabelKey,
} from "./badges";

export interface Props {
  result: RelationshipMemorySearchResultDTO;
  onOpenDetails?: (memoryId: string) => void;
  onOpenConflict?: (memoryId: string) => void;
  onOpenHistory?: (memoryId: string) => void;
  onOpenFeedback?: (memoryId: string) => void;
}

export function RelationshipMemorySearchResultCard({
  result,
  onOpenDetails,
  onOpenConflict,
  onOpenHistory,
  onOpenFeedback,
}: Props) {
  const t = useT();
  const fmt = useFmt();
  const m = result.memory;
  const relLabel = t(`bc.memory.relevance.${result.relevanceBand}` as never);

  return (
    <Card className="p-4">
      <article aria-labelledby={`memres-${m.id}-title`}>
        <header className="mb-2 flex flex-wrap items-center gap-1.5">
          <Badge
            variant={
              result.relevanceBand === "high"
                ? "default"
                : result.relevanceBand === "medium"
                  ? "secondary"
                  : "outline"
            }
            aria-label={t("bc.memory.relevance.a11y", { label: relLabel })}
          >
            {relLabel}
          </Badge>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {t(kindLabelKey(m.memoryKind) as never)}
          </span>
          <RelationshipMemoryStatusBadge status={m.status} />
          <RelationshipMemoryConfidenceBadge
            confidence={m.confidence}
            sourceCount={m.sourceCount}
          />
          <RelationshipMemoryFreshnessBadge lastObservedAt={m.lastObservedAt} />
          {result.historical ? (
            <Badge variant="outline">{t("bc.memory.result.historical")}</Badge>
          ) : null}
          {result.conflictState.hasConflict ? (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              {t("bc.memory.result.conflict")}
            </Badge>
          ) : null}
        </header>

        <button
          type="button"
          id={`memres-${m.id}-title`}
          onClick={() => onOpenDetails?.(m.id)}
          className="text-left text-sm font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {m.canonicalText}
        </button>

        {result.evidenceSummary ? (
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="mr-1 text-xs uppercase tracking-wide">
              {t("bc.memory.result.evidence")}:
            </span>
            {result.evidenceSummary}
          </p>
        ) : null}
        {result.graphContextSummary ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className="mr-1 uppercase tracking-wide">
              {t("bc.memory.result.graphContext")}:
            </span>
            {result.graphContextSummary}
          </p>
        ) : null}

        {result.matchedOn.length > 0 ? (
          <div
            className="mt-2 flex flex-wrap items-center gap-1"
            aria-label={t("bc.memory.matched.title")}
          >
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t("bc.memory.matched.title")}:
            </span>
            {result.matchedOn.map((code) => (
              <Badge key={code} variant="outline" className="text-[10px]">
                {t(`bc.memory.matched.${code}` as never)}
              </Badge>
            ))}
          </div>
        ) : null}

        <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{t("bc.memory.result.citations", { n: result.citations.length })}</span>
            <span>
              {t("bc.memory.card.lastSeen")}: {fmt.rel(m.lastObservedAt)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {result.conflictState.hasConflict && onOpenConflict ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => onOpenConflict(m.id)}>
                <AlertTriangle className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                {t("bc.memory.result.openConflict")}
              </Button>
            ) : null}
            {onOpenHistory ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => onOpenHistory(m.id)}>
                <History className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                {t("bc.memory.result.openHistory")}
              </Button>
            ) : null}
            {onOpenFeedback && result.viewerPermissions.canFeedback ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => onOpenFeedback(m.id)}>
                <MessagesSquare className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                {t("bc.memory.result.feedback")}
              </Button>
            ) : null}
          </div>
        </footer>
      </article>
    </Card>
  );
}
