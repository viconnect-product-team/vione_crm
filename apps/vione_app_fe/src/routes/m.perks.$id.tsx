// ============= Full file contents =============

import { createFileRoute, useParams } from "@tanstack/react-router";
import { Gift, ExternalLink, CalendarClock, Building2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import { getPerk, type Perk } from "@/lib/member-app.functions";
import { PERK_ICONS } from "./m.perks.index";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/m/perks/$id")({
  component: PerkDetailScreen,
});

function PerkDetailScreen() {
  const t = useT();
  const { id } = useParams({ from: "/m/perks/$id" });
  const fetchPerk = useServerFn(getPerk);
  const { data: perk, loading } = useServerData<Perk | null>(
    () => fetchPerk({ data: { id } }),
    null,
  );

  const Icon = perk ? (PERK_ICONS[perk.icon] ?? Gift) : Gift;

  return (
    <div className="vba-animate">
      <MemberHeader title={t("m.perks.detail.title")} back />

      <div className="mt-3 px-4">
        {loading && (
          <p className="py-10 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.perks.loading")}
          </p>
        )}
        {!loading && !perk && (
          <p className="py-10 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.perks.detail.empty")}
          </p>
        )}
        {perk && (
          <div className="space-y-4">
            <div className="vba-card p-5">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--vba-gold-soft)] text-[var(--vba-gold)]">
                <Icon className="h-6 w-6" />
              </span>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {perk.category && (
                  <span className="inline-block rounded-md bg-[var(--vba-gold-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--vba-gold)]">
                    {perk.category}
                  </span>
                )}
                {perk.discount && (
                  <span className="rounded-md bg-[var(--vba-gold)] px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                    {perk.discount}
                  </span>
                )}
              </div>
              <h1 className="mt-2 text-[18px] font-bold leading-snug text-[var(--vba-text)]">
                {perk.title}
              </h1>
              {perk.summary && (
                <p className="mt-1 text-[13px] text-[var(--vba-text-muted)]">{perk.summary}</p>
              )}
            </div>

            <div className="vba-card space-y-3 p-5">
              {perk.partner && (
                <div className="flex items-center gap-2 text-[13px] text-[var(--vba-text)]">
                  <Building2 className="h-4 w-4 text-[var(--vba-text-dim)]" /> {perk.partner}
                </div>
              )}
              {perk.validUntil && (
                <div className="flex items-center gap-2 text-[13px] text-[var(--vba-text)]">
                  <CalendarClock className="h-4 w-4 text-[var(--vba-text-dim)]" />{" "}
                  {t("m.perks.detail.valid_until", { date: perk.validUntil })}
                </div>
              )}
              {perk.description && (
                <p className="whitespace-pre-line text-[13px] leading-relaxed text-[var(--vba-text-muted)]">
                  {perk.description}
                </p>
              )}
              {perk.link && (
                <a
                  href={perk.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--vba-gold)] px-4 py-2.5 text-[13px] font-semibold text-primary-foreground"
                >
                  {t("m.perks.detail.use_perk")} <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
