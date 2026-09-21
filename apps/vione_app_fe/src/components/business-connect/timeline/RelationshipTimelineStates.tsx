// BC-7.5C — Neutral empty / loading / error states.

import { Link } from "@tanstack/react-router";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Card } from "@/components/dashboard/PageKit";
import { useT } from "@/lib/i18n";

export function RelationshipTimelineEmptyState({
  showConnectionsCta = true,
}: {
  showConnectionsCta?: boolean;
}) {
  const t = useT();
  return (
    <Card className="p-8 text-center text-sm text-muted-foreground">
      <p className="mb-2 font-medium text-foreground">{t("bc.timeline.empty.title")}</p>
      <p className="mb-3 text-xs">{t("bc.timeline.disclaimer")}</p>
      {showConnectionsCta ? (
        <Link
          to="/business-connect/connections"
          className="text-primary underline underline-offset-2"
        >
          {t("bc.timeline.empty.cta")}
        </Link>
      ) : null}
    </Card>
  );
}

export function RelationshipTimelineLoading() {
  const t = useT();
  return (
    <Card
      className="flex items-center justify-center p-8 text-sm text-muted-foreground"
      aria-busy="true"
    >
      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      {t("bc.timeline.loading")}
    </Card>
  );
}

export function RelationshipTimelineError({ onRetry }: { onRetry?: () => void }) {
  const t = useT();
  return (
    <Card className="p-6 text-sm text-destructive">
      <div role="alert" className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4" aria-hidden="true" />
        <div className="flex-1">
          <p>{t("bc.timeline.error")}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 text-xs underline underline-offset-2"
            >
              {t("bc.timeline.refresh")}
            </button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
