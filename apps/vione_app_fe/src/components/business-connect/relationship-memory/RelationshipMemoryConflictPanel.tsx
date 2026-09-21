// BC-9.1 Turn C2 — Side-by-side conflict comparison. Read-only.
//
// Backend does not yet emit peerMemoryId in most paths, so the panel
// gracefully renders an "no conflicts" state when peer data is missing.

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";
import { useRelationshipMemory } from "@/hooks/use-relationship-memory";
import {
  RelationshipMemoryConfidenceBadge,
  RelationshipMemoryStatusBadge,
  kindLabelKey,
} from "./badges";
import { memoryDetail, memoryDisplayText } from "./display";

export interface Props {
  leftMemoryId: string | null;
  rightMemoryId: string | null;
  onClose: () => void;
}

export function RelationshipMemoryConflictPanel({ leftMemoryId, rightMemoryId, onClose }: Props) {
  const t = useT();
  const open = leftMemoryId !== null;
  const left = useRelationshipMemory(leftMemoryId);
  const right = useRelationshipMemory(rightMemoryId ?? null);

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("bc.memory.conflict.title")}</DialogTitle>
          <DialogDescription>{t("bc.memory.conflict.description")}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ConflictColumn
            title={t("bc.memory.conflict.left")}
            loading={left.isLoading}
            data={left.data ?? null}
          />
          {rightMemoryId ? (
            <ConflictColumn
              title={t("bc.memory.conflict.right")}
              loading={right.isLoading}
              data={right.data ?? null}
            />
          ) : (
            <div className="flex items-center justify-center rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("bc.memory.conflict.none")}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConflictColumn({
  title,
  loading,
  data,
}: {
  title: string;
  loading: boolean;

  data: any | null;
}) {
  const t = useT();
  return (
    <section aria-label={title} className="rounded-md border p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {loading ? (
        <div role="status" aria-busy="true" className="space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
        </div>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">{t("bc.memory.error.notFound")}</p>
      ) : (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t(kindLabelKey(data.kind) as never)}
            </span>
            <RelationshipMemoryStatusBadge status={data.status} />
            <RelationshipMemoryConfidenceBadge
              confidence={data.confidence}
              sourceCount={data.sourceCount}
            />
          </div>
          <p className="text-sm font-medium text-foreground">{memoryDisplayText(data)}</p>
          {memoryDetail(data) ? (
            <p className="mt-1 text-sm text-muted-foreground">{memoryDetail(data)}</p>
          ) : null}
        </>
      )}
    </section>
  );
}
