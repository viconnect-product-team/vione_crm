// BC-9.1 Turn C2 — Filter bar for the Memory Explorer.
//
// Purely presentational + controlled. All state lives in the parent so the
// URL / search-params layer can persist it if needed. No server calls here.

import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  RELATIONSHIP_MEMORY_KINDS,
  RELATIONSHIP_MEMORY_ALLOWED_SOURCE_DOMAINS,
  type RelationshipMemoryKind,
  type RelationshipMemoryAllowedSourceDomain,
} from "@/lib/business-connect/relationship-memory";
import { kindLabelKey, sourceLabelKey } from "./badges";

export type ConfidenceFilter = "any" | "medium" | "high" | "verified";
export type FreshnessFilter = "any" | "fresh" | "recent_plus";

export interface MemoryExplorerFiltersValue {
  kinds: ReadonlyArray<RelationshipMemoryKind>;
  sources: ReadonlyArray<RelationshipMemoryAllowedSourceDomain>;
  confidence: ConfidenceFilter;
  freshness: FreshnessFilter;
  includeHistorical: boolean;
  includeCandidates: boolean;
  conflictReview: boolean;
}

export const DEFAULT_FILTERS: MemoryExplorerFiltersValue = Object.freeze({
  kinds: [],
  sources: [],
  confidence: "any",
  freshness: "any",
  includeHistorical: false,
  includeCandidates: false,
  conflictReview: false,
});

export function activeFilterCount(v: MemoryExplorerFiltersValue): number {
  let n = 0;
  if (v.kinds.length > 0) n += 1;
  if (v.sources.length > 0) n += 1;
  if (v.confidence !== "any") n += 1;
  if (v.freshness !== "any") n += 1;
  if (v.includeHistorical) n += 1;
  if (v.includeCandidates) n += 1;
  if (v.conflictReview) n += 1;
  return n;
}

/** Convert UI confidence band into an SDK `minConfidence` number. */
export function filterMinConfidence(c: ConfidenceFilter): number | undefined {
  if (c === "medium") return 0.5;
  if (c === "high") return 0.75;
  if (c === "verified") return 0.9;
  return undefined;
}

interface Props {
  value: MemoryExplorerFiltersValue;
  onChange: (next: MemoryExplorerFiltersValue) => void;
}

function toggleFrom<T>(arr: ReadonlyArray<T>, item: T): T[] {
  return arr.includes(item) ? arr.filter((x: any) => x !== item) : [...arr, item];
}

export function RelationshipMemoryFilters({ value, onChange }: Props) {
  const t = useT();
  const count = activeFilterCount(value);

  return (
    <section
      role="group"
      aria-label={t("bc.memory.filter.aria")}
      data-testid="memory-filters"
      className="rounded-lg border border-border bg-card p-4"
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t("bc.memory.filter.title")}</h3>
          <p className="text-xs text-muted-foreground">
            {t("bc.memory.filter.summary", { n: count })}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(DEFAULT_FILTERS)}
          disabled={count === 0}
        >
          {t("bc.memory.filter.reset")}
        </Button>
      </header>

      {/* Kinds */}
      <fieldset className="mb-3">
        <legend className="mb-1.5 text-xs font-medium text-muted-foreground">
          {t("bc.memory.filter.kind")}
        </legend>
        <div
          role="group"
          aria-label={t("bc.memory.filter.kind.aria")}
          className="flex flex-wrap gap-1.5"
        >
          {RELATIONSHIP_MEMORY_KINDS.map((k) => {
            const active = value.kinds.includes(k);
            return (
              <button
                key={k}
                type="button"
                aria-pressed={active}
                data-testid={`memory-filter-kind-${k}`}
                onClick={() => onChange({ ...value, kinds: toggleFrom(value.kinds, k) })}
                className={chipClass(active)}
              >
                {t(kindLabelKey(k) as never)}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Sources */}
      <fieldset className="mb-3">
        <legend className="mb-1.5 text-xs font-medium text-muted-foreground">
          {t("bc.memory.filter.source")}
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {RELATIONSHIP_MEMORY_ALLOWED_SOURCE_DOMAINS.map((s) => {
            const active = value.sources.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                data-testid={`memory-filter-source-${s}`}
                onClick={() => onChange({ ...value, sources: toggleFrom(value.sources, s) })}
                className={chipClass(active)}
              >
                {t(sourceLabelKey(s) as never)}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Confidence */}
      <fieldset className="mb-3">
        <legend className="mb-1.5 text-xs font-medium text-muted-foreground">
          {t("bc.memory.filter.confidence")}
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {(["any", "medium", "high", "verified"] as ConfidenceFilter[]).map((c: any) => {
            const active = value.confidence === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={active}
                data-testid={`memory-filter-conf-${c}`}
                onClick={() => onChange({ ...value, confidence: c })}
                className={chipClass(active)}
              >
                {t(`bc.memory.filter.confidence.${c}` as never)}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Freshness */}
      <fieldset className="mb-3">
        <legend className="mb-1.5 text-xs font-medium text-muted-foreground">
          {t("bc.memory.filter.freshness")}
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {(["any", "fresh", "recent_plus"] as FreshnessFilter[]).map((f) => {
            const active = value.freshness === f;
            const key =
              f === "any"
                ? "bc.memory.filter.freshness.any"
                : f === "fresh"
                  ? "bc.memory.filter.freshness.freshOnly"
                  : "bc.memory.filter.freshness.recentPlus";
            return (
              <button
                key={f}
                type="button"
                aria-pressed={active}
                data-testid={`memory-filter-fresh-${f}`}
                onClick={() => onChange({ ...value, freshness: f })}
                className={chipClass(active)}
              >
                {t(key as never)}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Lifecycle */}
      <fieldset>
        <legend className="mb-1.5 text-xs font-medium text-muted-foreground">
          {t("bc.memory.filter.lifecycle")}
        </legend>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            aria-pressed={value.includeHistorical}
            data-testid="memory-filter-historical"
            onClick={() => onChange({ ...value, includeHistorical: !value.includeHistorical })}
            className={chipClass(value.includeHistorical)}
          >
            {t("bc.memory.filter.lifecycle.includeHistorical")}
          </button>
          <button
            type="button"
            aria-pressed={value.includeCandidates}
            data-testid="memory-filter-candidates"
            onClick={() => onChange({ ...value, includeCandidates: !value.includeCandidates })}
            className={chipClass(value.includeCandidates)}
          >
            {t("bc.memory.filter.lifecycle.includeCandidates")}
          </button>
          <button
            type="button"
            aria-pressed={value.conflictReview}
            data-testid="memory-filter-conflicts"
            onClick={() => onChange({ ...value, conflictReview: !value.conflictReview })}
            className={chipClass(value.conflictReview)}
          >
            {t("bc.memory.filter.conflictReview")}
          </button>
        </div>
      </fieldset>
    </section>
  );
}

function chipClass(active: boolean) {
  return cn(
    "rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-background text-muted-foreground hover:text-foreground",
  );
}
