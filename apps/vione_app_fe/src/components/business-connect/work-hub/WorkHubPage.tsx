// BC-8.0 — Work Hub page. Replaces the old Business Connect overview.

import {
  WorkHubCategorySection,
  WorkHubSummaryCards,
  WORK_HUB_CATEGORY_ORDER,
} from "./WorkHubPrimitives";
import { useWorkHubOverview } from "@/lib/business-connect/work-hub";
import { useT } from "@/lib/i18n";

export function WorkHubPage() {
  const t = useT();
  const { data, isLoading, isError, refetch } = useWorkHubOverview();

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold text-foreground">{t("bc.workHub.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("bc.workHub.subtitle")}</p>
      </header>

      {isError ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4"
        >
          <div className="text-sm font-medium text-destructive">{t("bc.workHub.error.title")}</div>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-lg border border-destructive/50 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("bc.workHub.error.retry")}
          </button>
        </div>
      ) : null}

      <div aria-live="polite" aria-busy={isLoading}>
        <WorkHubSummaryCards summary={data?.summary} />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("bc.workHub.loading")}</p>
      ) : data ? (
        WORK_HUB_CATEGORY_ORDER.every((c) => ((data.previews as any)[c]?.length ?? 0) === 0) ? (
          <div className="rounded-xl border bg-card p-8 text-center">
            <h3 className="text-base font-semibold text-foreground">
              {t("bc.workHub.empty.title")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("bc.workHub.empty.body")}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {WORK_HUB_CATEGORY_ORDER.map((c: any) => (
              <WorkHubCategorySection key={c} category={c} items={(data.previews as any)[c] ?? []} />
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
