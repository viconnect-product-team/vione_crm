// BC-6.1 — Ranked introduction path card. BC-6.2 adds request action for 2-hop.
import { useT } from "@/lib/i18n";
import type { SmartIntroductionPathDTO } from "@/lib/graph";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { PathVisualization } from "./PathVisualization";
import { RequestIntroductionButton } from "./request/RequestIntroductionButton";

interface Props {
  path: SmartIntroductionPathDTO;
  targetLabel: string;
  highlighted?: boolean;
}

export function BestPathCard({ path, targetLabel, highlighted }: Props) {
  const t = useT();
  const intermediaries = path.intermediaries.map((x: any) => x.personNodeId);
  const primary = path.intermediaries[0];
  const intermediaryLabel = primary ? `#${primary.personNodeId.slice(0, 8)}` : targetLabel;
  return (
    <article
      className={`rounded-xl border p-5 shadow-sm transition ${
        highlighted ? "border-primary/50 bg-primary/5" : "border-border bg-card"
      }`}
      data-testid="intro-path-card"
      data-path-id={path.pathId}
      aria-label={t("bc.intro.hops", { n: intermediaries.length + 1 })}
    >
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ConfidenceBadge confidence={path.confidence} />
          <span className="text-xs text-muted-foreground">
            {t("bc.intro.hops", { n: intermediaries.length + 1 })}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="sr-only">{t("bc.intro.score")}: </span>
          {(path.score * 100).toFixed(0)}
        </div>
      </header>

      <PathVisualization intermediaries={intermediaries} targetLabel={targetLabel} />

      {path.reasons.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={t("bc.intro.pageTitle")}>
          {path.reasons.slice(0, 4).map((r: any) => (
            <li
              key={r.code}
              className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {t(r.summaryKey as never)}
            </li>
          ))}
        </ul>
      )}

      {path.depth === 2 && (
        <div className="mt-4 flex justify-end">
          <RequestIntroductionButton
            path={path}
            targetLabel={targetLabel}
            intermediaryLabel={intermediaryLabel}
          />
        </div>
      )}
    </article>
  );
}
