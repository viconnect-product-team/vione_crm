// BC-4.5 — Discovery card for a single recommendation.
//
// Pure presentation over RecommendationDTO. Reads only fields the Graph SDK
// exposes (candidateNode.metadata is the frozen allow-list from NODE_MANIFEST).
// Actions kept intentionally minimal for BC-4.5: Dismiss only. Connect/save
// flows land in BC-4.6+ once the request pipeline is contracted (per user
// scope "STOP after BC-4.5").

import { useT } from "@/lib/i18n";
import type { RecommendationDTO } from "@/lib/graph";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Sparkles, X } from "lucide-react";
import { RecommendationReasonChip } from "./RecommendationReasonChip";

import type { ReactNode } from "react";

interface Props {
  item: RecommendationDTO;
  onDismiss: (nodeId: string) => void;
  /** BC-5.1 — injected connection-action surface (state-aware). */
  renderAction?: (item: RecommendationDTO) => ReactNode;
}

function personLabel(md: Record<string, unknown>): string {
  const name = md.displayName ?? md.name;
  return typeof name === "string" && name.trim() ? name : "—";
}

function subtitleFor(item: RecommendationDTO): string | null {
  const md = item.candidateNode.metadata as Record<string, unknown>;
  const headline = md.headline;
  if (typeof headline === "string" && headline.trim()) return headline;
  const company = md.companyName;
  if (typeof company === "string" && company.trim()) return company;
  return null;
}

function avatarUrl(md: Record<string, unknown>): string | null {
  const v = md.avatarUrl ?? md.logoUrl;
  return typeof v === "string" && v ? v : null;
}

export function RecommendationCard({ item, onDismiss, renderAction }: Props) {
  const t = useT();
  const md = item.candidateNode.metadata as Record<string, unknown>;
  const label = personLabel(md);
  const subtitle = subtitleFor(item);
  const avatar = avatarUrl(md);
  const initials = label.slice(0, 2).toUpperCase();

  const freshnessKey =
    item.freshness === "fresh"
      ? "bc.rec.card.freshness.fresh"
      : item.freshness === "stale"
        ? "bc.rec.card.freshness.stale"
        : "bc.rec.card.freshness.cold";

  return (
    <article
      className="group relative flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
      data-testid="rec-card"
      data-node-id={item.candidateNode.id}
      data-rank={item.rank}
      aria-label={label}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold text-muted-foreground">
          {avatar ? (
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden="true">{initials}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">{label}</h3>
          {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
          <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground/80">
            <span className="sr-only">{t("bc.rec.card.score")}: </span>
            {t("bc.rec.card.rank", { n: item.rank })} · {t(freshnessKey)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("bc.rec.dismiss")}
          onClick={() => onDismiss(item.candidateNode.id)}
          className="opacity-70 hover:opacity-100"
          data-testid="rec-dismiss"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {item.reasons.length > 0 ? (
        <ul
          className="flex flex-wrap gap-1.5"
          aria-label={t("bc.rec.title")}
          data-testid="rec-reasons"
        >
          {item.reasons.slice(0, 3).map((r: any) => (
            <li key={r.code}>
              <RecommendationReasonChip reason={r} />
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <Link
          to="/business-connect/introductions/$targetPersonNodeId"
          params={{ targetPersonNodeId: item.candidateNode.id }}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-testid="rec-find-intro"
          aria-label={t("bc.intro.findIntroduction")}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {t("bc.intro.findIntroduction")}
        </Link>
        {renderAction ? <div data-testid="rec-action-slot">{renderAction(item)}</div> : null}
      </div>
    </article>
  );
}
