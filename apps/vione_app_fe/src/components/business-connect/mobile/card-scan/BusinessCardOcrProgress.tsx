// BC-Mobile-4A — calm processing state. Stages are TRUTHFUL: "preparing"
// covers client-side decode/resize; "reading" covers the server vision call.
// No fake percentage.

import { Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";

export type CardScanProcessingStage = "preparing" | "reading";

export function BusinessCardOcrProgress({ stage }: { stage: CardScanProcessingStage }) {
  const t = useT();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-16">
      <Loader2
        className="h-8 w-8 animate-spin text-[var(--bc-mobile-muted)] motion-reduce:animate-none"
        strokeWidth={1.8}
        aria-hidden
      />
      <p className="text-[15px] font-medium text-[var(--bc-mobile-text)]">
        {stage === "preparing"
          ? t("bc.mobile.cardScan.preparing")
          : t("bc.mobile.cardScan.reading")}
      </p>
    </div>
  );
}
