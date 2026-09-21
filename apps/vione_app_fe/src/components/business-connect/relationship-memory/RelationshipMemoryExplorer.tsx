// BC-9.1 Turn C2 — Memory Explorer: search + filters + results + drawers.
//
// Read-only. Delegates all data access to the frozen SDK via hooks.

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/dashboard/PageKit";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";
import type { MemorySearchInput } from "@/hooks/use-relationship-memory-search";
import { useDebounced, useRelationshipMemorySearch } from "@/hooks/use-relationship-memory-search";
import { RELATIONSHIP_MEMORY_QUERY_MAX_CHARS } from "@/lib/business-connect/relationship-memory";
import {
  DEFAULT_FILTERS,
  RelationshipMemoryFilters,
  activeFilterCount,
  filterMinConfidence,
  type MemoryExplorerFiltersValue,
} from "./RelationshipMemoryFilters";
import { RelationshipMemorySearchResultCard } from "./RelationshipMemorySearchResultCard";
import { RelationshipMemoryDetailDrawer } from "./RelationshipMemoryDetailDrawer";
import { RelationshipMemoryConflictPanel } from "./RelationshipMemoryConflictPanel";
import { RelationshipMemoryHistoryChain } from "./RelationshipMemoryHistoryChain";
import { RelationshipMemoryFeedbackDialog } from "./RelationshipMemoryFeedbackDialog";

export function RelationshipMemoryExplorer() {
  const t = useT();
  const [rawQuery, setRawQuery] = useState("");
  const debounced = useDebounced(rawQuery, 250);
  const [filters, setFilters] = useState<MemoryExplorerFiltersValue>(DEFAULT_FILTERS);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [conflictId, setConflictId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);

  const overLimit = rawQuery.length > RELATIONSHIP_MEMORY_QUERY_MAX_CHARS;

  const searchInput: MemorySearchInput = useMemo(
    () =>
      ({
        queryText: overLimit ? "" : debounced.trim() || undefined,
        kinds: filters.kinds.length > 0 ? filters.kinds : undefined,
        minConfidence: filterMinConfidence(filters.confidence),
        includeHistorical: filters.includeHistorical,
        includeCandidates: filters.includeCandidates,
        conflictReview: filters.conflictReview,
        limit: 30,
      }) as MemorySearchInput,
    [debounced, overLimit, filters],
  );

  const enableSearch =
    !overLimit && (debounced.trim().length > 0 || activeFilterCount(filters) > 0);

  const query = useRelationshipMemorySearch(searchInput, {
    enabled: enableSearch,
  });

  const items = query.data?.items ?? [];
  // Additional client-side filters that the SDK does not carry natively.
  const filtered = useMemo(
    () =>
      items.filter((r) => {
        if (filters.freshness === "fresh" && r.freshness !== "fresh") return false;
        if (
          filters.freshness === "recent_plus" &&
          r.freshness !== "fresh" &&
          r.freshness !== "recent"
        )
          return false;
        if (filters.sources.length > 0) {
          const sources = r.citations.map((c: any) => c.sourceDomain);
          if (!sources.some((s) => filters.sources.includes(s))) return false;
        }
        if (filters.conflictReview && !r.conflictState.hasConflict) return false;
        return true;
      }),
    [items, filters],
  );

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold text-foreground">{t("bc.memory.explorer.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("bc.memory.explorer.subtitle")}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              placeholder={t("bc.memory.search.placeholder")}
              aria-label={t("bc.memory.search.aria")}
              aria-invalid={overLimit || undefined}
              maxLength={RELATIONSHIP_MEMORY_QUERY_MAX_CHARS + 32}
              className="pl-9 pr-10"
              data-testid="memory-search-input"
            />
            {rawQuery.length > 0 ? (
              <button
                type="button"
                aria-label={t("bc.memory.search.clear")}
                onClick={() => setRawQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          {overLimit ? (
            <Alert variant="destructive" role="alert">
              <AlertTitle>{t("bc.memory.error.title")}</AlertTitle>
              <AlertDescription>
                {t("bc.memory.search.tooLong", {
                  max: RELATIONSHIP_MEMORY_QUERY_MAX_CHARS,
                })}
              </AlertDescription>
            </Alert>
          ) : null}

          <div
            aria-live="polite"
            role="status"
            className="min-h-[1.25rem] text-xs text-muted-foreground"
          >
            {query.isFetching
              ? t("bc.memory.search.thinking")
              : enableSearch && query.data
                ? t("bc.memory.search.resultCount", {
                    n: filtered.length,
                    total: query.data.totalConsidered,
                  })
                : ""}
            {query.data?.truncated ? ` · ${t("bc.memory.search.truncated")}` : ""}
          </div>

          {!enableSearch ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              {t("bc.memory.search.hint")}
            </Card>
          ) : query.isLoading ? (
            <div role="status" aria-busy="true" className="space-y-3">
              <span className="sr-only">{t("bc.memory.loading")}</span>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : query.isError ? (
            <Alert variant="destructive" role="alert">
              <AlertTitle>{t("bc.memory.error.title")}</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-3">
                <span>{t("bc.memory.error.generic")}</span>
                <Button type="button" size="sm" variant="outline" onClick={() => query.refetch()}>
                  {t("bc.memory.error.retry")}
                </Button>
              </AlertDescription>
            </Alert>
          ) : filtered.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              {t("bc.memory.search.empty")}
            </Card>
          ) : (
            <ul role="list" className="space-y-3" data-testid="memory-search-results">
              {filtered.map((r: any) => (
                <li key={r.memory.id}>
                  <RelationshipMemorySearchResultCard
                    result={r}
                    onOpenDetails={setDetailId}
                    onOpenConflict={setConflictId}
                    onOpenHistory={setHistoryId}
                    onOpenFeedback={setFeedbackId}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside>
          <RelationshipMemoryFilters value={filters} onChange={setFilters} />
        </aside>
      </div>

      <RelationshipMemoryDetailDrawer memoryId={detailId} onClose={() => setDetailId(null)} />
      <RelationshipMemoryConflictPanel
        leftMemoryId={conflictId}
        rightMemoryId={
          conflictId
            ? ((
                items.find((r) => r.memory.id === conflictId)?.conflictState as
                  | { hasConflict: true; peerMemoryId: string }
                  | undefined
              )?.peerMemoryId ?? null)
            : null
        }
        onClose={() => setConflictId(null)}
      />
      <RelationshipMemoryHistoryChain memoryId={historyId} onClose={() => setHistoryId(null)} />
      <RelationshipMemoryFeedbackDialog memoryId={feedbackId} onClose={() => setFeedbackId(null)} />
    </div>
  );
}
