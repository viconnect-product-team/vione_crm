// BC-6.1 — Smart Introduction product page (read-only).
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, type TKey } from "@/lib/i18n";
import { useSmartIntroduction } from "@/hooks/use-smart-introduction";
import type { SmartIntroductionPageState } from "@/lib/graph";
import { BestPathCard } from "./BestPathCard";

interface Props {
  targetPersonNodeId: string;
}

const STATE_KEYS: Record<Exclude<SmartIntroductionPageState, "OK">, { title: TKey; desc: TKey }> = {
  NO_PATH: { title: "bc.intro.state.NO_PATH.title", desc: "bc.intro.state.NO_PATH.desc" },
  TARGET_ALREADY_CONNECTED: {
    title: "bc.intro.state.TARGET_ALREADY_CONNECTED.title",
    desc: "bc.intro.state.TARGET_ALREADY_CONNECTED.desc",
  },
  TARGET_UNAVAILABLE: {
    title: "bc.intro.state.TARGET_UNAVAILABLE.title",
    desc: "bc.intro.state.TARGET_UNAVAILABLE.desc",
  },
  PRIVACY_RESTRICTED: {
    title: "bc.intro.state.PRIVACY_RESTRICTED.title",
    desc: "bc.intro.state.PRIVACY_RESTRICTED.desc",
  },
};

export function SmartIntroductionPage({ targetPersonNodeId }: Props) {
  const t = useT();
  const q = useSmartIntroduction(targetPersonNodeId);
  const targetLabel = t("bc.intro.target");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6" data-testid="smart-intro-page">
      <header>
        <Link
          to="/business-connect"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("bc.intro.backToDiscovery")}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("bc.intro.pageTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("bc.intro.subtitle")}</p>
      </header>

      <section aria-live="polite" aria-busy={q.isLoading}>
        {q.isLoading && (
          <div className="space-y-3" data-testid="intro-loading">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        )}

        {q.isError && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm"
          >
            <p className="mb-2 text-destructive">{t("bc.intro.error")}</p>
            <Button size="sm" variant="outline" onClick={() => q.refetch()}>
              {t("bc.intro.retry")}
            </Button>
          </div>
        )}

        {q.data && q.data.state !== "OK" && (
          <EmptyState state={q.data.state as Exclude<SmartIntroductionPageState, "OK">} />
        )}

        {q.data?.state === "OK" && q.data.items.length > 0 && (
          <>
            {q.data.usedStrengthFallback && (
              <p className="mb-3 rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-warning">
                {t("bc.intro.usedFallback")}
              </p>
            )}

            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("bc.intro.bestPath")}
            </h2>
            <BestPathCard path={q.data.items[0]!} targetLabel={targetLabel} highlighted />

            {q.data.items.length > 1 && (
              <>
                <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("bc.intro.alternatives")}
                </h2>
                <ul className="flex flex-col gap-3" data-testid="intro-alternatives">
                  {q.data.items.slice(1).map((p) => (
                    <li key={p.pathId}>
                      <BestPathCard path={p} targetLabel={targetLabel} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function EmptyState({ state }: { state: Exclude<SmartIntroductionPageState, "OK"> }) {
  const t = useT();
  const keys = STATE_KEYS[state];
  return (
    <div
      className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center"
      data-testid="intro-empty"
      data-state={state}
    >
      <h2 className="text-lg font-semibold text-foreground">{t(keys.title)}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t(keys.desc)}</p>
    </div>
  );
}
