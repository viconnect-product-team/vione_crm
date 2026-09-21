// BC-4.5 — Reason chips rendered next to a recommendation.
// Maps RecommendationReasonDTO.summaryKey → i18n label with optional count.
// Never invents copy: unknown keys fall back to a neutral placeholder so the
// UI never crashes when the engine adds a new reason before i18n catches up.

import type { RecommendationReasonDTO } from "@/lib/graph";
import { translate, translations, useLang, type TKey } from "@/lib/i18n";

const KNOWN_KEYS = new Set<string>(Object.keys(translations));

interface Props {
  reason: RecommendationReasonDTO;
}

export function RecommendationReasonChip({ reason }: Props) {
  const { lang } = useLang();
  const key = reason.summaryKey;
  const label = KNOWN_KEYS.has(key)
    ? translate(key as TKey, lang).replace("{n}", String(reason.count ?? 0))
    : reason.code;

  return (
    <span
      className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground"
      data-testid="rec-reason-chip"
      data-reason-code={reason.code}
    >
      {label}
    </span>
  );
}
