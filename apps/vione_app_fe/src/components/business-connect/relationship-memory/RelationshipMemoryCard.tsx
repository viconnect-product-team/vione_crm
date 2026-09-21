// BC-9.1 Turn C1 — Individual memory card.

import { Copy, Check, Eye } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/dashboard/PageKit";
import { useT, useFmt } from "@/lib/i18n";
import type { RelationshipMemoryDTO } from "@/lib/business-connect/relationship-memory";
import {
  RelationshipMemoryConfidenceBadge,
  RelationshipMemoryFreshnessBadge,
  RelationshipMemoryStatusBadge,
  kindLabelKey,
} from "./badges";
import { memoryDetail, memoryDisplayText } from "./display";

export interface RelationshipMemoryCardProps {
  memory: RelationshipMemoryDTO;
  onOpenDetails?: (id: string) => void;
}

export function RelationshipMemoryCard({ memory, onOpenDetails }: RelationshipMemoryCardProps) {
  const t = useT();
  const fmt = useFmt();
  const [copied, setCopied] = useState(false);

  const text = memoryDisplayText(memory);
  const detail = memoryDetail(memory);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* no-op */
    }
  };

  return (
    <Card className="p-4">
      <article aria-labelledby={`memory-${memory.id}-title`}>
        <header className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            aria-label={t(kindLabelKey(memory.kind) as never)}
          >
            {t(kindLabelKey(memory.kind) as never)}
          </span>
          <RelationshipMemoryStatusBadge status={memory.status} />
          <RelationshipMemoryConfidenceBadge
            confidence={memory.confidence}
            sourceCount={memory.sourceCount}
          />
          <RelationshipMemoryFreshnessBadge lastObservedAt={memory.lastObservedAt} />
        </header>

        <p id={`memory-${memory.id}-title`} className="text-sm font-medium text-foreground">
          {text}
        </p>
        {detail ? <p className="mt-1 text-sm text-muted-foreground">{detail}</p> : null}

        <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{t("bc.memory.card.sourceCount", { n: memory.sourceCount })}</span>
            <span>
              {t("bc.memory.card.lastSeen")}: {fmt.rel(memory.lastObservedAt)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={copy}
              aria-label={t("bc.memory.card.copyText")}
            >
              {copied ? (
                <>
                  <Check className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  {t("bc.memory.card.copied")}
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  {t("bc.memory.card.copyText")}
                </>
              )}
            </Button>
            {onOpenDetails ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenDetails(memory.id)}
                aria-label={t("bc.memory.card.viewDetails")}
              >
                <Eye className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                {t("bc.memory.card.viewDetails")}
              </Button>
            ) : null}
          </div>
        </footer>
      </article>
    </Card>
  );
}
