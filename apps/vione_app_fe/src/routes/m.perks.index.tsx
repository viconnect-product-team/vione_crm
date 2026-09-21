// ============= Full file contents =============

import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, Briefcase, Scale, Calculator, Hotel, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import { listPerks, type Perk } from "@/lib/member-app.functions";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/m/perks/")({
  component: PerksScreen,
});

export const PERK_ICONS: Record<string, LucideIcon> = {
  Gift,
  Briefcase,
  Scale,
  Calculator,
  Hotel,
};

function PerksScreen() {
  const t = useT();
  const fetchPerks = useServerFn(listPerks);
  const { data: perks, loading } = useServerData<Perk[]>(() => fetchPerks(), []);

  return (
    <div className="vba-animate">
      <MemberHeader title={t("m.perks.title")} back />

      <div className="mt-3 space-y-3 px-4">
        {loading && (
          <p className="py-10 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.perks.loading")}
          </p>
        )}
        {!loading && perks.length === 0 && (
          <p className="py-10 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.perks.empty")}
          </p>
        )}
        {perks.map((p) => {
          const Icon = PERK_ICONS[p.icon] ?? Gift;
          return (
            <Link
              key={p.id}
              to="/m/perks/$id"
              params={{ id: p.id }}
              className="vba-card flex items-center gap-3 p-4"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--vba-gold-soft)] text-[var(--vba-gold)]">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {p.category && (
                    <span className="inline-block rounded-md bg-[var(--vba-gold-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--vba-gold)]">
                      {p.category}
                    </span>
                  )}
                  {p.discount && (
                    <span className="text-[11px] font-semibold text-[var(--vba-gold)]">
                      {p.discount}
                    </span>
                  )}
                </div>
                <h2 className="mt-1 truncate text-[14px] font-semibold text-[var(--vba-text)]">
                  {p.title}
                </h2>
                {p.summary && (
                  <p className="mt-0.5 line-clamp-1 text-[12px] text-[var(--vba-text-muted)]">
                    {p.summary}
                  </p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[var(--vba-text-dim)]" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
