// BC-9.1 Turn C1 — Read-only detail drawer.
//
// Uses shadcn Sheet for accessible focus-trap / escape handling. Fetches the
// DTO on demand via the frozen SDK (no direct table access).

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, useFmt } from "@/lib/i18n";
import { useRelationshipMemory } from "@/hooks/use-relationship-memory";
import {
  RelationshipMemoryConfidenceBadge,
  RelationshipMemoryFreshnessBadge,
  RelationshipMemoryStatusBadge,
  kindLabelKey,
} from "./badges";
import { memoryDetail, memoryDisplayText } from "./display";

export interface RelationshipMemoryDetailDrawerProps {
  memoryId: string | null;
  onClose: () => void;
}

export function RelationshipMemoryDetailDrawer({
  memoryId,
  onClose,
}: RelationshipMemoryDetailDrawerProps) {
  const t = useT();
  const fmt = useFmt();
  const query = useRelationshipMemory(memoryId);

  const open = memoryId !== null;

  return (
    <Sheet open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{t("bc.memory.drawer.title")}</SheetTitle>
          <SheetDescription>{t("bc.memory.drawer.permissions.readOnly")}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {query.isLoading ? (
            <div role="status" aria-busy="true" className="space-y-3">
              <span className="sr-only">{t("bc.memory.loading")}</span>
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : query.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {t("bc.memory.error.generic")}
            </p>
          ) : !query.data ? (
            <p className="text-sm text-muted-foreground">{t("bc.memory.error.notFound")}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t(kindLabelKey(query.data.kind) as never)}
                </span>
                <RelationshipMemoryStatusBadge status={query.data.status} />
                <RelationshipMemoryConfidenceBadge
                  confidence={query.data.confidence}
                  sourceCount={query.data.sourceCount}
                />
                <RelationshipMemoryFreshnessBadge lastObservedAt={query.data.lastObservedAt} />
              </div>

              <div>
                <p className="text-sm font-medium text-foreground">
                  {memoryDisplayText(query.data)}
                </p>
                {memoryDetail(query.data) ? (
                  <p className="mt-1 text-sm text-muted-foreground">{memoryDetail(query.data)}</p>
                ) : null}
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("bc.memory.drawer.firstObserved")}
                  </dt>
                  <dd>{fmt.date(query.data.firstObservedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("bc.memory.drawer.lastObserved")}
                  </dt>
                  <dd>{fmt.date(query.data.lastObservedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("bc.memory.drawer.lastReviewed")}
                  </dt>
                  <dd>
                    {query.data.lastReviewedAt
                      ? fmt.date(query.data.lastReviewedAt)
                      : t("bc.memory.drawer.notAvailable")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("bc.memory.drawer.sources")}
                  </dt>
                  <dd>
                    {t("bc.memory.card.sourceCount", {
                      n: query.data.sourceCount,
                    })}
                  </dd>
                </div>
              </dl>

              <p className="text-xs text-muted-foreground">{t("bc.memory.disclaimer")}</p>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
