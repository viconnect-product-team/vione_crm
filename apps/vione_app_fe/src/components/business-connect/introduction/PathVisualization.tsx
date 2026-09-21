// BC-6.1 — Introduction path visualization (You → A → Target).
import { useT } from "@/lib/i18n";
import { ChevronRight } from "lucide-react";

interface Props {
  intermediaries: string[];
  targetLabel: string;
}

export function PathVisualization({ intermediaries, targetLabel }: Props) {
  const t = useT();
  return (
    <ol
      className="flex flex-wrap items-center gap-2 text-sm"
      aria-label={t("bc.intro.viaVisual", { a: intermediaries[0] ?? "…" })}
    >
      <li className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
        {t("bc.intro.you")}
      </li>
      {intermediaries.map((mid, i) => (
        <li key={mid + i} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span
            className="max-w-[10rem] truncate rounded-full bg-muted px-3 py-1 text-muted-foreground"
            title={mid}
          >
            {mid.slice(0, 8)}…
          </span>
        </li>
      ))}
      <li className="flex items-center gap-2">
        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
          {targetLabel}
        </span>
      </li>
    </ol>
  );
}
