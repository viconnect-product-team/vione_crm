import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Check, Clock, Plus, Building2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import {
  listMyOpportunities,
  expressInterest,
  type MyOpportunity,
} from "@/lib/member-app.functions";
import { useT, useFmt } from "@/lib/i18n";

export const Route = createFileRoute("/m/opportunities")({
  component: OpportunitiesScreen,
});

function OpportunitiesScreen() {
  const t = useT();
  const fmt = useFmt();
  const fetchOpps = useServerFn(listMyOpportunities);
  const doInterest = useServerFn(expressInterest);
  const {
    data: opportunities,
    loading,
    reload,
  } = useServerData<MyOpportunity[]>(() => fetchOpps(), []);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const allTab = t("m.opportunities.tabAll");

  const tabs = useMemo(() => {
    const set = new Set<string>([allTab]);
    opportunities.forEach((o) => set.add(o.tag));
    return Array.from(set);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunities]);
  const [tab, setTab] = useState(allTab);

  const list = useMemo(() => {
    return opportunities.filter((o) => {
      const matchTab = tab === allTab || o.tag === tab;
      const matchQ = !q || (o.title + o.company).toLowerCase().includes(q.toLowerCase());
      return matchTab && matchQ;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunities, tab, q]);

  async function interest(id: string) {
    setBusy(id);
    try {
      await doInterest({ data: { opportunityId: id } });
      toast.success(t("m.opportunities.interestSent"));
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("m.opportunities.interestError"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="vba-animate">
      <MemberHeader
        title={t("m.opportunities.title")}
        subtitle={t("m.opportunities.subtitle")}
        back
        right={
          <button className="rounded-lg vba-gold-grad px-2.5 py-1.5 text-[10px] font-semibold text-[#1a1206]">
            <Plus className="mr-0.5 inline h-3 w-3" />
            {t("m.opportunities.post")}
          </button>
        }
      />

      {/* Search */}
      <div className="flex items-center gap-2 px-4 pt-4">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-[var(--vba-border-soft)] bg-[var(--vba-surface)] px-3 py-2.5">
          <Search className="h-4 w-4 text-[var(--vba-text-dim)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("m.opportunities.searchPlaceholder")}
            className="w-full bg-transparent text-[13px] text-[var(--vba-text)] outline-none placeholder:text-[var(--vba-text-dim)]"
          />
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-xl vba-gold-grad text-[#1a1206]">
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-4">
        {tabs.map((tabItem) => (
          <button
            key={tabItem}
            onClick={() => setTab(tabItem)}
            className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition"
            style={
              tab === tabItem
                ? { background: "var(--vba-gold-soft)", color: "var(--vba-gold)" }
                : { color: "var(--vba-text-dim)" }
            }
          >
            {tabItem}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-3 space-y-3 px-4">
        {loading && (
          <p className="py-10 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.opportunities.loading")}
          </p>
        )}
        {list.map((o) => (
          <div key={o.id} className="vba-card flex gap-3 p-3.5">
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-primary-foreground"
              style={{ background: o.color }}
            >
              <Building2 className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--vba-gold)]">
                {o.tag}
              </div>
              <div className="mt-0.5 line-clamp-2 text-[13px] font-semibold text-[var(--vba-text)]">
                {o.title}
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-[var(--vba-text-muted)]">
                <span className="truncate">🏢 {o.company}</span>
                <span className="flex shrink-0 items-center gap-1">
                  <Clock className="h-3 w-3" /> {fmt.rel(o.time)}
                </span>
              </div>
              <div className="mt-2">
                {o.interested ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--vba-gold-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--vba-gold)]">
                    <Check className="h-3.5 w-3.5" /> {t("m.opportunities.interested")}
                  </span>
                ) : (
                  <button
                    onClick={() => interest(o.id)}
                    disabled={busy === o.id}
                    className="rounded-lg vba-gold-grad px-3 py-1.5 text-[11px] font-semibold text-[#1a1206] disabled:opacity-60"
                  >
                    {busy === o.id ? t("m.opportunities.sending") : t("m.opportunities.interest")}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {!loading && list.length === 0 && (
          <p className="py-10 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.opportunities.noResults")}
          </p>
        )}
      </div>
    </div>
  );
}
