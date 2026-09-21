import { createFileRoute, useParams } from "@tanstack/react-router";
import { Gift, ExternalLink, CalendarClock, Building2, Sparkles, CheckCircle2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import { getPerk, type Perk } from "@/lib/member-app.functions";
import { PERK_ICONS } from "./association.perks.index";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/association/perks/$id")({
  component: PerkDetailScreen,
});

function PerkDetailScreen() {
  const t = useT();
  const { id } = useParams({ from: "/association/perks/$id" });
  const fetchPerk = useServerFn(getPerk);
  const { data: perk, loading } = useServerData<Perk | null>(
    () => fetchPerk({ data: { id } }),
    null,
  );

  const Icon = perk ? (PERK_ICONS[perk.icon] ?? Gift) : Gift;

  return (
    <div className="vba-animate pb-24">
      <MemberHeader title={t("m.perks.detail.title")} back />

      <div className="mt-3 px-4">
        {loading && (
          <p className="py-12 text-center text-[13px] text-slate-400">
            {t("m.perks.loading")}
          </p>
        )}
        {!loading && !perk && (
          <p className="py-12 text-center text-[13px] text-slate-400">
            {t("m.perks.detail.empty")}
          </p>
        )}
        {perk && (
          <div className="space-y-4">
            {/* Hero Card with Navy & Amber Gold Theme */}
            <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-[#003B95]/15 via-amber-500/5 to-transparent p-6 shadow-sm">
              <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-amber-400/15 blur-2xl" />
              <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-[#003B95]/15 blur-xl" />

              <div className="relative z-10 space-y-3">
                <span className="flex h-15 w-15 items-center justify-center rounded-2xl bg-gradient-to-br from-[#003B95] to-[#1E40AF] text-amber-300 shadow-lg shadow-[#003B95]/25 border border-amber-500/30">
                  <Icon className="h-7 w-7 text-amber-300" />
                </span>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {perk.category && (
                    <span className="inline-block rounded-md bg-amber-100 dark:bg-amber-950/90 border border-amber-300 dark:border-amber-600/80 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                      {perk.category}
                    </span>
                  )}
                  {perk.discount && (
                    <span className="rounded-md bg-[#003B95] px-2.5 py-0.5 text-[11px] font-extrabold text-white shadow-xs">
                      {perk.discount}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> Đã xác thực
                  </span>
                </div>

                <h1 className="text-[19px] font-black leading-snug text-slate-900 dark:text-white">
                  {perk.title}
                </h1>

                {perk.summary && (
                  <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {perk.summary}
                  </p>
                )}
              </div>
            </div>

            {/* Details Card */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#131a26] p-5 shadow-xs space-y-4">
              <div className="space-y-2.5 pb-3 border-b border-slate-100 dark:border-white/5">
                {perk.partner && (
                  <div className="flex items-center gap-2.5 text-[13px] text-slate-800 dark:text-slate-200">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[#003B95] dark:text-amber-400 shrink-0">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Đối tác cung cấp</p>
                      <p className="font-bold text-[13px]">{perk.partner}</p>
                    </div>
                  </div>
                )}
                {perk.validUntil && (
                  <div className="flex items-center gap-2.5 text-[13px] text-slate-800 dark:text-slate-200">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 shrink-0">
                      <CalendarClock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Thời hạn áp dụng</p>
                      <p className="font-bold text-[13px]">{t("m.perks.detail.valid_until", { date: perk.validUntil })}</p>
                    </div>
                  </div>
                )}
              </div>

              {perk.description && (
                <div className="space-y-1.5">
                  <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                    Chi tiết quyền lợi
                  </h3>
                  <p className="whitespace-pre-line text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {perk.description}
                  </p>
                </div>
              )}

              {perk.link && (
                <div className="pt-2">
                  <a
                    href={perk.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#ffffff" }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#003B95] hover:bg-[#002B70] py-3 text-[13.5px] font-bold text-white shadow-lg shadow-[#003B95]/25 active:scale-98 transition cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    {t("m.perks.detail.use_perk")}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
