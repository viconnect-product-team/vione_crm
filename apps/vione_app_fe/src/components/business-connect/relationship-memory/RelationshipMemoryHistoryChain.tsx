// BC-9.1 Turn C2 — Supersession / refinement history chain. Read-only.

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { useRelationshipMemoryGraphContext } from "@/hooks/use-relationship-memory-graph-context";
import { kindLabelKey } from "./badges";

export interface Props {
  memoryId: string | null;
  onClose: () => void;
}

const HISTORY_EDGES = new Set(["self", "supports", "refines", "contradicts", "related"]);

export function RelationshipMemoryHistoryChain({ memoryId, onClose }: Props) {
  const t = useT();
  const open = memoryId !== null;
  const query = useRelationshipMemoryGraphContext(memoryId, {
    maxDepth: 2,
    maxNodes: 30,
  });

  const nodes = (query.data?.nodes ?? []).filter((n) => HISTORY_EDGES.has(n.edgeKindFromRoot));

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("bc.memory.history.title")}</DialogTitle>
          <DialogDescription>{t("bc.memory.history.description")}</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {query.isLoading ? (
            <div role="status" aria-busy="true" className="space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          ) : nodes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("bc.memory.history.empty")}</p>
          ) : (
            <ol role="list" className="relative space-y-3 border-l border-border pl-4">
              {nodes.map((n: any) => (
                <li key={n.memoryId} className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <Badge variant="outline">
                      {t(`bc.memory.history.edge.${n.edgeKindFromRoot}` as never)}
                    </Badge>
                    <span>{t("bc.memory.history.depth", { n: n.depth })}</span>
                    <span>·</span>
                    <span>{t(kindLabelKey(n.kind) as never)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {n.subjectType} · {n.subjectRef}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
