// BC-4.5 — Recommendation feed container.
//
// Responsibilities: resolve viewer node → fetch paginated recommendations →
// filter client-side by reason category → render responsive card grid with
// load-more, refresh, dismiss, empty and error states.
//
// Scope guardrails (per BC-4.5 stop condition): no connection-request UI,
// no smart-introduction UI, no writes beyond idempotent viewer-node
// registration. Dismiss is session-only (in-memory Set), not persisted.

import { useCallback, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { GraphError } from "@/lib/graph";
import { useViewerPersonNodeId } from "@/hooks/use-viewer-person-node";
import { useRecommendations, type RecommendationFilterKey } from "@/hooks/use-recommendations";
import { RecommendationCard } from "./RecommendationCard";
import { ConnectionStateAction } from "./ConnectionStateAction";
import { RecommendationFilters, matchesFilter } from "./RecommendationFilters";

export function RecommendationFeed() {
  const t = useT();
  const [filter, setFilter] = useState<RecommendationFilterKey>("all");
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(() => new Set());

  const viewer = useViewerPersonNodeId();
  const q = useRecommendations({
    sourceNodeId: viewer.data ?? null,
    filter,
  });

  const items = useMemo(() => {
    const pages = q.data?.pages ?? [];
    const flat = pages.flatMap((p) => p.items);
    return flat.filter(
      (it) => !dismissed.has(it.candidateNode.id) && matchesFilter(it.reasons, filter),
    );
  }, [q.data, dismissed, filter]);

  const onDismiss = useCallback((nodeId: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(nodeId);
      return next;
    });
  }, []);

  const onRefresh = useCallback(() => {
    setDismissed(new Set());
    void q.refetch();
  }, [q]);

  const onResetFilter = useCallback(() => setFilter("all"), []);

  const status = q.status;
  const error = q.error as unknown;
  const isCursorError =
    error instanceof GraphError &&
    (error.code === "RECOMMENDATION_CURSOR_INVALID" ||
      error.code === "RECOMMENDATION_VERSION_UNSUPPORTED");

  return (
    <section aria-labelledby="bc-rec-title" className="flex flex-col gap-6" data-testid="rec-feed">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="bc-rec-title" className="text-lg font-semibold text-foreground">
            {t("bc.rec.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("bc.rec.subtitle")}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={q.isFetching}
          data-testid="rec-refresh"
          aria-label={t("bc.rec.refresh")}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${q.isFetching ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          {t("bc.rec.refresh")}
        </Button>
      </header>

      <RecommendationFilters value={filter} onChange={setFilter} />

      <div
        aria-live="polite"
        aria-atomic="true"
        aria-busy={q.isFetching}
        className="sr-only"
        data-testid="rec-live"
      >
        {status === "success" ? t("bc.rec.status.updated", { n: items.length }) : ""}
      </div>

      {status === "pending" || viewer.isPending ? (
        <div
          role="status"
          aria-label={t("bc.rec.loadingMore")}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl border border-border bg-muted/30"
            />
          ))}
        </div>
      ) : status === "error" ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive"
          data-testid="rec-error"
        >
          <p className="font-semibold">{t("bc.rec.error.title")}</p>
          {isCursorError ? (
            <p className="mt-1 text-destructive/80">{t("bc.rec.error.staleCursor")}</p>
          ) : null}
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" onClick={onRefresh}>
              {t("bc.rec.error.retry")}
            </Button>
            {filter !== "all" ? (
              <Button size="sm" variant="ghost" onClick={onResetFilter}>
                {t("bc.rec.error.reset")}
              </Button>
            ) : null}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center"
          data-testid="rec-empty"
        >
          <p className="text-sm font-semibold text-foreground">{t("bc.rec.empty.title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("bc.rec.empty.body")}</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{t("bc.rec.count", { n: items.length })}</p>
          <ul
            role="list"
            aria-label={t("bc.rec.list.aria")}
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            data-testid="rec-list"
          >
            {items.map((item) => (
              <li key={item.candidateNode.id}>
                <RecommendationCard
                  item={item}
                  onDismiss={onDismiss}
                  renderAction={(it) => (
                    <ConnectionStateAction
                      targetPersonNodeId={it.candidateNode.id}
                      personLabel={
                        (it.candidateNode.metadata as Record<string, unknown>).displayName as
                          | string
                          | undefined
                      }
                    />
                  )}
                />
              </li>
            ))}
          </ul>

          {q.hasNextPage ? (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => void q.fetchNextPage()}
                disabled={q.isFetchingNextPage}
                data-testid="rec-load-more"
              >
                {q.isFetchingNextPage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    {t("bc.rec.loadingMore")}
                  </>
                ) : (
                  t("bc.rec.loadMore")
                )}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
