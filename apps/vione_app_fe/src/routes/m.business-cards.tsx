import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowLeft,
  Eye,
  QrCode,
  EyeOff,
  IdCard,
  Pencil,
  Plus,
  Link2,
  Trash2,
  X,
  Save,
  Loader2,
  ExternalLink,
  Star,
  Share2,
  Mail,
  Phone,
  Inbox,
  Clock,
  ChevronDown,
  ChevronUp,
  History,
  Search,
  BarChart3,
  TrendingUp,
  Send,
  MessageSquareText,
  FileText,
  Download,
  Zap,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { MemberHeader } from "@/components/member/MemberShell";
import { ShareCardModal } from "@/components/member/ShareCardModal";
import { CardPreviewModal } from "@/components/member/CardPreviewModal";
import { FastScanModal } from "@/components/member/FastScanModal";
import { ConfirmDialog } from "@/components/member/ConfirmDialog";

import { performWithUndo } from "@/lib/undo-action";
import { cardPermissionErrorKey } from "@/lib/card-permission-error";
import { useT, useLang, type TKey } from "@/lib/i18n";
import {
  listMyBusinessCardsFn,
  getMyBusinessCardFn,
  saveBusinessCardFn,
  deleteBusinessCardFn,
  setBusinessCardStatusFn,
  setPrimaryBusinessCardFn,
  listMyBusinessCardLeadsFn,
  updateBusinessCardLeadStatusFn,
  sendBusinessCardLeadReplyFn,
  REPLY_TEMPLATES,
  type ReplyChannel,
  getBusinessCardStatsFn,
  type BusinessCardStats,
  DEFAULT_VISIBILITY,
  type BusinessCardSummary,
  type BusinessCard,
  type BusinessCardLead,
  type LeadStatus,
  type CardKind,
  type CardStatus,
  type PublicMode,
  type VisibilitySettings,
} from "@/lib/business-card.functions";
import { listReplyTemplatesFn, type ReplyTemplateRow } from "@/lib/reply-templates.functions";
import { useServerData } from "@/hooks/use-server-data";
import { LinkMemberProfile } from "@/components/dashboard/LinkMemberProfile";
import { AvatarUploadField } from "@/components/business-connect/mobile/me/AvatarUploadField";

type BusinessCardsSearch = {
  tab?: "cards" | "leads" | "stats";
  leadId?: string;
};

const TABS = ["cards", "leads", "stats"] as const;

export const Route = createFileRoute("/m/business-cards")({
  validateSearch: (search: Record<string, unknown>): BusinessCardsSearch => {
    const tab = TABS.includes(search.tab as (typeof TABS)[number])
      ? (search.tab as (typeof TABS)[number])
      : undefined;
    const leadId = typeof search.leadId === "string" ? search.leadId : undefined;
    return { tab, leadId };
  },
  component: BusinessCardsScreen,
});

type Draft = {
  id: string | null;
  slug: string;
  cardKind: CardKind;
  publicMode: PublicMode;
  visibility: VisibilitySettings;
  displayName: string;
  professionalTitle: string;
  companyName: string;
  avatarUrl: string;
  headline: string;
  bio: string;
  website: string;
  workEmail: string;
  workPhone: string;
  address: string;
  zaloUrl: string;
  linkedinUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  skills: string[];
  services: { title: string; description: string }[];
  needs: { title: string; description: string }[];
};

function emptyDraft(): Draft {
  return {
    id: null,
    slug: "",
    cardKind: "primary",
    publicMode: "members_only",
    visibility: { ...DEFAULT_VISIBILITY },
    displayName: "",
    professionalTitle: "",
    companyName: "",
    avatarUrl: "",
    headline: "",
    bio: "",
    website: "",
    workEmail: "",
    workPhone: "",
    address: "",
    zaloUrl: "",
    linkedinUrl: "",
    facebookUrl: "",
    youtubeUrl: "",
    tiktokUrl: "",
    skills: [],
    services: [],
    needs: [],
  };
}

function fromCard(c: BusinessCard): Draft {
  return {
    id: c.id,
    slug: c.slug,
    cardKind: c.cardKind,
    publicMode: c.publicMode,
    visibility: c.visibilitySettings,
    displayName: c.displayName ?? "",
    professionalTitle: c.professionalTitle ?? "",
    companyName: c.companyName ?? "",
    avatarUrl: c.avatarUrl ?? "",
    headline: c.headline ?? "",
    bio: c.bio ?? "",
    website: c.website ?? "",
    workEmail: c.workEmail ?? "",
    workPhone: c.workPhone ?? "",
    address: c.address ?? "",
    zaloUrl: c.zaloUrl ?? "",
    linkedinUrl: c.linkedinUrl ?? "",
    facebookUrl: c.facebookUrl ?? "",
    youtubeUrl: c.youtubeUrl ?? "",
    tiktokUrl: c.tiktokUrl ?? "",
    skills: c.skills.map((s) => s.label),
    services: c.services.map((s) => ({ title: s.title, description: s.description ?? "" })),
    needs: c.needs.map((s) => ({ title: s.title, description: s.description ?? "" })),
  };
}

const STATUS_KEY: Record<CardStatus, TKey> = {
  draft: "bc.st.draft",
  published: "bc.st.published",
  hidden: "bc.st.hidden",
  suspended: "bc.st.suspended",
  archived: "bc.st.archived",
  rejected: "bc.st.rejected",
};

function BusinessCardsScreen() {
  const t = useT();
  const search = Route.useSearch();
  const listFn = useServerFn(listMyBusinessCardsFn);
  const getFn = useServerFn(getMyBusinessCardFn);

  const [cards, setCards] = useState<BusinessCardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [tab, setTab] = useState<"cards" | "leads" | "stats">(search.tab ?? "cards");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "unpublished">("all");

  useEffect(() => {
    if (search.tab) setTab(search.tab);
  }, [search.tab]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setCards(await listFn());
    } catch (e) {
      toast.error(t(cardPermissionErrorKey(e)));
    } finally {
      setLoading(false);
    }
  }, [listFn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openNew = () => setEditing(emptyDraft());
  const openEdit = async (id: string) => {
    try {
      const card = await getFn({ data: { id } });
      setEditing(fromCard(card));
    } catch (e) {
      toast.error(t(cardPermissionErrorKey(e)));
    }
  };

  if (editing) {
    return (
      <CardEditor
        draft={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void refresh();
        }}
      />
    );
  }

  return (
    <>
      <MemberHeader
        title={t("bc.title")}
        subtitle={t("bc.subtitle")}
        right={
          tab === "cards" ? (
            <button
              onClick={openNew}
              aria-label={t("bc.new")}
              className="grid h-9 w-9 place-items-center rounded-full text-[var(--vba-gold)] transition hover:bg-card/5"
            >
              <Plus className="h-5 w-5" />
            </button>
          ) : undefined
        }
      />
      <div className="flex gap-2 px-4 pt-3">
        {(["cards", "leads", "stats"] as const).map((tk) => (
          <button
            key={tk}
            onClick={() => setTab(tk)}
            className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition ${
              tab === tk
                ? "vba-gold-grad text-[#1a1206]"
                : "text-[var(--vba-text-dim)] hover:bg-card/5"
            }`}
          >
            {t(tk === "cards" ? "bc.tab.cards" : tk === "leads" ? "bc.tab.leads" : "bc.tab.stats")}
          </button>
        ))}
      </div>
      {tab === "leads" ? (
        <LeadsPanel selectedLeadId={search.leadId} />
      ) : tab === "stats" ? (
        <StatsPanel />
      ) : (
        <div className="space-y-3 px-4 py-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--vba-text-dim)]" />
            </div>
          ) : cards.length === 0 ? (
            <div className="space-y-3">
              <div className="vba-card flex flex-col items-center gap-3 p-8 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--vba-gold)]/15 text-[var(--vba-gold)]">
                  <IdCard className="h-7 w-7" />
                </div>
                <p className="text-[15px] font-semibold text-[var(--vba-text)]">
                  {t("bc.empty.title")}
                </p>
                <p className="text-[13px] leading-relaxed text-[var(--vba-text-dim)]">
                  {t("bc.empty.guide")}
                </p>
                <button
                  onClick={() =>
                    document
                      .getElementById("m-link-member-profile")
                      ?.scrollIntoView({ behavior: "smooth", block: "center" })
                  }
                  className="vba-gold-grad mt-1 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold text-[#1a1206]"
                >
                  <Link2 className="h-4 w-4" />
                  {t("bc.empty.cta")}
                </button>
              </div>
              <div id="m-link-member-profile">
                <LinkMemberProfile onLinked={refresh} />
              </div>
            </div>
          ) : (
            (() => {
              const q = query.trim().toLowerCase();
              const filtered = cards.filter((c) => {
                const matchesStatus =
                  statusFilter === "all" ||
                  (statusFilter === "published"
                    ? c.status === "published"
                    : c.status !== "published");
                if (!matchesStatus) return false;
                if (!q) return true;
                return [c.displayName, c.slug, c.professionalTitle, c.companyName]
                  .filter(Boolean)
                  .some((v) => (v as string).toLowerCase().includes(q));
              });
              const FILTERS = [
                { key: "all", label: t("bc.filter.all") },
                { key: "published", label: t("bc.filter.published") },
                { key: "unpublished", label: t("bc.filter.unpublished") },
              ] as const;
              return (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vba-text-dim)]" />
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t("bc.search.placeholder")}
                      aria-label={t("bc.search.placeholder")}
                      className="w-full rounded-xl border border-[var(--vba-border-soft)] bg-transparent py-2 pl-9 pr-3 text-[13px] text-[var(--vba-text)] placeholder:text-[var(--vba-text-dim)] focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-1.5" role="group" aria-label={t("bc.filter.all")}>
                    {FILTERS.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setStatusFilter(f.key)}
                        aria-pressed={statusFilter === f.key}
                        className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                          statusFilter === f.key
                            ? "vba-gold-grad text-[#1a1206]"
                            : "text-[var(--vba-text-dim)] hover:bg-card/5"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  {filtered.length === 0 ? (
                    <div className="vba-card p-6 text-center text-[13px] text-[var(--vba-text-dim)]">
                      {t("bc.filter.empty")}
                    </div>
                  ) : (
                    filtered.map((c: any) => (
                      <CardRow
                        key={c.id}
                        card={c}
                        onEdit={() => void openEdit(c.id)}
                        onChanged={refresh}
                      />
                    ))
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}
    </>
  );
}

// ── Analytics panel ────────────────────────────────────────────────────────
function StatKpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="vba-card flex flex-col gap-1 p-3">
      <div className="flex items-center gap-1.5 text-[var(--vba-text-dim)]">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <span className="text-[20px] font-bold text-[var(--vba-text)]">{value}</span>
    </div>
  );
}

function StatsPanel() {
  const t = useT();
  const statsFn = useServerFn(getBusinessCardStatsFn);
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [stats, setStats] = useState<BusinessCardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (d: 7 | 30 | 90) => {
      setLoading(true);
      try {
        const res = await statsFn({ data: { days: d } });
        setStats(res);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      } finally {
        setLoading(false);
      }
    },
    [statsFn],
  );

  useEffect(() => {
    void load(days);
  }, [days, load]);

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="flex gap-2">
        {([7, 30, 90] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-full px-3 py-1 text-[12px] font-semibold transition ${
              days === d
                ? "vba-gold-grad text-[#1a1206]"
                : "text-[var(--vba-text-dim)] hover:bg-card/5"
            }`}
          >
            {t(`bc.stats.range.${d}` as TKey)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--vba-text-dim)]" />
        </div>
      ) : !stats ? (
        <div className="vba-card p-10 text-center text-[13px] text-[var(--vba-text-dim)]">
          {t("bc.stats.empty")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <StatKpi
              icon={<Inbox className="h-3.5 w-3.5" />}
              label={t("bc.stats.kpi.leads")}
              value={String(stats.totalLeads)}
            />
            <StatKpi
              icon={<BarChart3 className="h-3.5 w-3.5" />}
              label={t("bc.stats.kpi.interactions")}
              value={String(stats.totalInteractions)}
            />
            <StatKpi
              icon={<Eye className="h-3.5 w-3.5" />}
              label={t("bc.stats.kpi.uniqueViews")}
              value={String(stats.uniqueViews)}
            />
            <StatKpi
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              label={t("bc.stats.kpi.responseRate")}
              value={`${Math.round(stats.responseRate * 100)}%`}
            />
          </div>

          <div className="vba-card p-3">
            <p className="mb-2 text-[13px] font-semibold text-[var(--vba-text)]">
              {t("bc.stats.trend.title")}
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.daily} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => v.slice(5)}
                  tick={{ fontSize: 10, fill: "var(--vba-text-dim)" }}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "var(--vba-text-dim)" }}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #bae6fd",
                    borderRadius: 10,
                    fontSize: 12,
                    boxShadow: "0 4px 14px rgba(2, 132, 199, 0.12)",
                  }}
                  labelStyle={{ color: "#0369a1", fontWeight: 700, marginBottom: 2 }}
                  itemStyle={{ color: "#0284c7", fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="interactions"
                  name={t("bc.stats.legend.interactions")}
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="leads"
                  name={t("bc.stats.legend.leads")}
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="vba-card p-3">
            <p className="mb-2 text-[13px] font-semibold text-[var(--vba-text)]">
              {t("bc.stats.status.title")}
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={stats.statusBreakdown.map((s) => ({
                  name: t(LEAD_STATUS_KEY[s.status]),
                  count: s.count,
                }))}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(2, 132, 199, 0.08)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--vba-text-dim)" }} />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "var(--vba-text-dim)" }}
                  width={28}
                />
                <Tooltip
                  cursor={{ fill: "rgba(2, 132, 199, 0.06)" }}
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #bae6fd",
                    borderRadius: 10,
                    fontSize: 12,
                    boxShadow: "0 4px 14px rgba(2, 132, 199, 0.12)",
                  }}
                  labelStyle={{ color: "#0369a1", fontWeight: 700, marginBottom: 2 }}
                  itemStyle={{ color: "#0284c7", fontWeight: 600 }}
                />
                <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

const LEAD_STATUS_KEY: Record<LeadStatus, TKey> = {
  new: "bc.leads.st.new",
  read: "bc.leads.st.read",
  contacting: "bc.leads.st.contacting",
  responded: "bc.leads.st.responded",
  won: "bc.leads.st.won",
  lost: "bc.leads.st.lost",
  archived: "bc.leads.st.archived",
};

const LEAD_TYPE_KEY: Record<string, TKey> = {
  contact: "bc.leads.type.contact",
  meeting: "bc.leads.type.meeting",
  quote: "bc.leads.type.quote",
};

const LEAD_CSV_HEADERS = [
  "id",
  "name",
  "email",
  "phone",
  "card",
  "type",
  "status",
  "message",
  "preferredTime",
  "createdAt",
  "updatedAt",
  "repliesCount",
];

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function leadToCsvRow(l: BusinessCardLead): string {
  return [
    l.id,
    l.requesterName,
    l.requesterEmail,
    l.requesterPhone,
    l.cardName,
    l.leadType,
    l.status,
    l.message,
    l.preferredTime,
    l.createdAt,
    l.updatedAt,
    l.replies.length,
  ]
    .map(csvCell)
    .join(",");
}

function downloadLeadsCsv(leads: BusinessCardLead[], filename: string) {
  const lines = [LEAD_CSV_HEADERS.join(","), ...leads.map(leadToCsvRow)];
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function LeadsPanel({ selectedLeadId }: { selectedLeadId?: string }) {
  const t = useT();
  const navigate = useNavigate({ from: "/m/business-cards" });
  const listLeads = useServerFn(listMyBusinessCardLeadsFn);
  const [leads, setLeads] = useState<BusinessCardLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setLeads(await listLeads());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [listLeads]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (loading || !selectedLeadId) return;
    const found = leads.some((l) => l.id === selectedLeadId);
    if (!found) {
      toast.warning(t("bc.leads.notFound"), {
        description: t("bc.leads.notFoundDesc"),
      });
      void navigate({ search: { tab: "leads" }, replace: true });
    }
  }, [loading, selectedLeadId, leads, navigate, t]);

  const filtered = leads
    .filter((l) => statusFilter === "all" || l.status === statusFilter)
    .filter((l) => typeFilter === "all" || l.leadType === typeFilter)
    .filter((l) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return [l.requesterName, l.cardName, l.requesterEmail, l.message]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q));
    })
    .sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sort === "newest" ? -diff : diff;
    });

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--vba-text-dim)]" />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="px-4 py-4">
        <div className="vba-card flex flex-col items-center gap-3 p-10 text-center">
          <Inbox className="h-9 w-9 text-[var(--vba-gold)]" />
          <p className="text-[14px] font-semibold text-[var(--vba-text)]">{t("bc.leads.empty")}</p>
        </div>
      </div>
    );
  }

  const statusOptions: (LeadStatus | "all")[] = [
    "all",
    "new",
    "read",
    "contacting",
    "responded",
    "won",
    "lost",
    "archived",
  ];

  const typeOptions: string[] = [
    "all",
    ...Array.from(new Set(leads.map((l) => l.leadType))).filter((ty): ty is string => Boolean(ty)),
  ];

  return (
    <div className="space-y-3 px-4 py-4">
      <div className="vba-card flex flex-col gap-3 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vba-text-dim)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("bc.leads.search.ph")}
            className="w-full rounded-lg border border-[var(--vba-border)] bg-[var(--vba-bg)] py-2 pl-9 pr-3 text-[13px] text-[var(--vba-text)] outline-none focus:border-[var(--vba-gold)]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-3 py-1 text-[12px] font-medium transition ${
                statusFilter === s
                  ? "border-[var(--vba-gold)] bg-[var(--vba-gold)] text-foreground"
                  : "border-[var(--vba-border)] text-[var(--vba-text-dim)]"
              }`}
            >
              {s === "all" ? t("bc.leads.filter.all") : t(LEAD_STATUS_KEY[s])}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            {(["newest", "oldest"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                className={`rounded-full border px-3 py-1 text-[12px] font-medium transition ${
                  sort === s
                    ? "border-[var(--vba-gold)] bg-[var(--vba-gold)] text-foreground"
                    : "border-[var(--vba-border)] text-[var(--vba-text-dim)]"
                }`}
              >
                {t(s === "newest" ? "bc.leads.sort.newest" : "bc.leads.sort.oldest")}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--vba-text-dim)]">
            {t("bc.leads.filter.type")}
          </span>
          {typeOptions.map((ty) => (
            <button
              key={ty}
              type="button"
              onClick={() => setTypeFilter(ty)}
              className={`rounded-full border px-3 py-1 text-[12px] font-medium transition ${
                typeFilter === ty
                  ? "border-[var(--vba-gold)] bg-[var(--vba-gold)] text-foreground"
                  : "border-[var(--vba-border)] text-[var(--vba-text-dim)]"
              }`}
            >
              {ty === "all" ? t("bc.leads.filter.all") : t(LEAD_TYPE_KEY[ty])}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] text-[var(--vba-text-dim)]">
            {filtered.length} {t("bc.leads.count")}
          </p>
          <button
            type="button"
            disabled={filtered.length === 0}
            onClick={() =>
              downloadLeadsCsv(filtered, `leads-${new Date().toISOString().slice(0, 10)}.csv`)
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-card/5 px-3 py-1.5 text-[12px] font-semibold text-[var(--vba-text)] hover:bg-card/10 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {t("bc.leads.exportCsv")}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="vba-card p-8 text-center text-[13px] text-[var(--vba-text-dim)]">
          {t("bc.leads.noMatch")}
        </div>
      ) : (
        filtered.map((l) => (
          <LeadRow key={l.id} lead={l} onChanged={refresh} initialOpen={l.id === selectedLeadId} />
        ))
      )}
    </div>
  );
}

function LeadRow({
  lead,
  onChanged,
  initialOpen,
}: {
  lead: BusinessCardLead;
  onChanged: () => Promise<void> | void;
  initialOpen?: boolean;
}) {
  const t = useT();
  const updateStatus = useServerFn(updateBusinessCardLeadStatusFn);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(initialOpen ?? false);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [open]);

  const setStatus = async (status: LeadStatus, note?: string) => {
    setBusy(true);
    try {
      await updateStatus({ data: { id: lead.id, status, note: note || undefined } });
      await onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const fmt = (v: string | null) => (v ? new Date(v).toLocaleString() : t("bc.leads.na"));
  const created = fmt(lead.createdAt);
  const leadTypeKey = `bc.leads.type.${lead.leadType}` as TKey;

  return (
    <div
      ref={rowRef}
      className="vba-card space-y-3 p-4"
      style={initialOpen ? { borderColor: "var(--vba-gold)" } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-[var(--vba-text)]">
            {lead.requesterName}
          </p>
          {lead.cardName ? (
            <p className="truncate text-[12px] text-[var(--vba-text-dim)]">
              {t("bc.leads.from")}: {lead.cardName}
            </p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            lead.status === "new"
              ? "bg-[var(--vba-gold)]/15 text-[var(--vba-gold)]"
              : "bg-card/5 text-[var(--vba-text-dim)]"
          }`}
        >
          {t(LEAD_STATUS_KEY[lead.status])}
        </span>
      </div>

      {lead.message ? (
        <p className="whitespace-pre-wrap rounded-lg bg-card/5 p-3 text-[13px] text-[var(--vba-text)]">
          {lead.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 text-[12px] text-[var(--vba-text-dim)]">
        {lead.requesterEmail ? (
          <a
            href={`mailto:${lead.requesterEmail}`}
            className="inline-flex items-center gap-1 hover:text-[var(--vba-gold)]"
          >
            <Mail className="h-3.5 w-3.5" />
            {lead.requesterEmail}
          </a>
        ) : null}
        {lead.requesterPhone ? (
          <a
            href={`tel:${lead.requesterPhone}`}
            className="inline-flex items-center gap-1 hover:text-[var(--vba-gold)]"
          >
            <Phone className="h-3.5 w-3.5" />
            {lead.requesterPhone}
          </a>
        ) : null}
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {created}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {lead.requesterEmail ? (
          <a
            href={`mailto:${lead.requesterEmail}`}
            className="vba-gold-grad inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-[#1a1206]"
          >
            <Mail className="h-3.5 w-3.5" />
            {t("bc.leads.reply")}
          </a>
        ) : null}
        {lead.requesterPhone ? (
          <a
            href={`tel:${lead.requesterPhone}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-card/5 px-3 py-1.5 text-[12px] font-semibold text-[var(--vba-text)] hover:bg-card/10"
          >
            <Phone className="h-3.5 w-3.5" />
            {t("bc.leads.call")}
          </a>
        ) : null}
        {lead.status === "new" ? (
          <button
            disabled={busy}
            onClick={() => void setStatus("read")}
            className="rounded-lg bg-card/5 px-3 py-1.5 text-[12px] font-semibold text-[var(--vba-text)] hover:bg-card/10 disabled:opacity-50"
          >
            {t("bc.leads.markRead")}
          </button>
        ) : null}
        {lead.status !== "responded" && lead.status !== "archived" ? (
          <button
            disabled={busy}
            onClick={() => void setStatus("responded")}
            className="rounded-lg bg-card/5 px-3 py-1.5 text-[12px] font-semibold text-[var(--vba-text)] hover:bg-card/10 disabled:opacity-50"
          >
            {t("bc.leads.markResponded")}
          </button>
        ) : null}
        {lead.status !== "archived" ? (
          <button
            disabled={busy}
            onClick={() => void setStatus("archived")}
            className="rounded-lg bg-card/5 px-3 py-1.5 text-[12px] font-semibold text-[var(--vba-text-dim)] hover:bg-card/10 disabled:opacity-50"
          >
            {t("bc.leads.archive")}
          </button>
        ) : null}
        <button
          onClick={() => setOpen((v) => !v)}
          className="ml-auto inline-flex items-center gap-1 rounded-lg bg-card/5 px-3 py-1.5 text-[12px] font-semibold text-[var(--vba-text-dim)] hover:bg-card/10"
        >
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {t(open ? "bc.leads.hideDetails" : "bc.leads.details")}
        </button>
      </div>

      {open ? (
        <div className="space-y-4 border-t border-border/10 pt-4">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[12px] font-semibold text-[var(--vba-text)]">
                {t("bc.leads.detailTitle")}
              </p>
              <button
                type="button"
                onClick={() => downloadLeadsCsv([lead], `lead-${lead.id.slice(0, 8)}.csv`)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-card/5 px-2.5 py-1 text-[11px] font-semibold text-[var(--vba-text)] hover:bg-card/10"
              >
                <Download className="h-3.5 w-3.5" />
                {t("bc.leads.exportCsv")}
              </button>
            </div>
            <table className="w-full text-[12px]">
              <tbody className="align-top">
                {(
                  [
                    ["bc.leads.field.name", lead.requesterName],
                    ["bc.leads.field.email", lead.requesterEmail],
                    ["bc.leads.field.phone", lead.requesterPhone],
                    ["bc.leads.field.type", t(leadTypeKey)],
                    ["bc.leads.field.card", lead.cardName],
                    ["bc.leads.field.status", t(LEAD_STATUS_KEY[lead.status])],
                    ["bc.leads.field.preferredTime", fmt(lead.preferredTime)],
                    ["bc.leads.field.createdAt", created],
                    ["bc.leads.field.updatedAt", fmt(lead.updatedAt)],
                    ["bc.leads.field.message", lead.message],
                  ] as [TKey, string | null][]
                ).map(([k, v]) => (
                  <tr key={k} className="border-b border-border/5 last:border-0">
                    <td className="w-2/5 py-1.5 pr-3 text-[var(--vba-text-dim)]">{t(k)}</td>
                    <td className="whitespace-pre-wrap py-1.5 text-[var(--vba-text)]">
                      {v || t("bc.leads.na")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <LeadStatusChanger lead={lead} busy={busy} onChange={setStatus} />

          <div>
            <p className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--vba-text)]">
              <History className="h-3.5 w-3.5 text-[var(--vba-gold)]" />
              {t("bc.leads.history")}
            </p>
            <ol className="space-y-2">
              <li className="flex items-center gap-2 text-[12px] text-[var(--vba-text-dim)]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-card/30" />
                <span className="text-[var(--vba-text)]">{t("bc.leads.historyCreated")}</span>
                <span className="ml-auto">{created}</span>
              </li>
              {lead.history.length === 0 ? (
                <li className="text-[12px] text-[var(--vba-text-dim)]">
                  {t("bc.leads.historyEmpty")}
                </li>
              ) : (
                lead.history.map((h, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-[12px] text-[var(--vba-text-dim)]"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--vba-gold)]" />
                    <span className="text-[var(--vba-text)]">
                      {h.from ? `${t(LEAD_STATUS_KEY[h.from])} → ` : ""}
                      {t(LEAD_STATUS_KEY[h.to])}
                    </span>
                    <span className="ml-auto">{fmt(h.at)}</span>
                  </li>
                ))
              )}
            </ol>
          </div>

          <LeadReplyBlock lead={lead} onChanged={onChanged} fmt={fmt} />
        </div>
      ) : null}
    </div>
  );
}

function LeadStatusChanger({
  lead,
  busy,
  onChange,
}: {
  lead: BusinessCardLead;
  busy: boolean;
  onChange: (status: LeadStatus, note?: string) => Promise<void> | void;
}) {
  const t = useT();
  const [note, setNote] = useState("");
  const options: LeadStatus[] = [
    "new",
    "read",
    "contacting",
    "responded",
    "won",
    "lost",
    "archived",
  ];

  const apply = async (status: LeadStatus) => {
    if (status === lead.status) return;
    await onChange(status, note.trim());
    setNote("");
    toast.success(t("bc.leads.statusUpdated"));
  };

  return (
    <div className="rounded-lg border border-border/10 bg-card/5 p-3">
      <p className="mb-2 text-[12px] font-semibold text-[var(--vba-text)]">
        {t("bc.leads.changeStatus")}
      </p>
      <div className="mb-2 flex flex-wrap gap-2">
        {options.map((s) => {
          const active = s === lead.status;
          return (
            <button
              key={s}
              disabled={busy || active}
              onClick={() => void apply(s)}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition disabled:opacity-60 ${
                active
                  ? "vba-gold-grad text-[#1a1206]"
                  : "bg-card/5 text-[var(--vba-text)] hover:bg-card/10"
              }`}
            >
              {t(LEAD_STATUS_KEY[s])}
            </button>
          );
        })}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder={t("bc.leads.statusNotePh")}
        className="w-full resize-none rounded-lg border border-border/10 bg-transparent px-3 py-2 text-[12px] text-[var(--vba-text)] outline-none placeholder:text-[var(--vba-text-dim)] focus:border-[var(--vba-gold)]/50"
      />
    </div>
  );
}

const REPLY_CHANNEL_KEY: Record<ReplyChannel, TKey> = {
  email: "bc.reply.ch.email",
  phone: "bc.reply.ch.phone",
  note: "bc.reply.ch.note",
};

function LeadReplyBlock({
  lead,
  onChanged,
  fmt,
}: {
  lead: BusinessCardLead;
  onChanged: () => Promise<void> | void;
  fmt: (v: string | null) => string;
}) {
  const t = useT();
  const { lang } = useLang();
  const sendReply = useServerFn(sendBusinessCardLeadReplyFn);
  const [composing, setComposing] = useState(false);
  const [channel, setChannel] = useState<ReplyChannel>(lead.requesterEmail ? "email" : "note");
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [markResponded, setMarkResponded] = useState(true);
  const [busy, setBusy] = useState(false);

  // Association-managed templates (falls back to built-in defaults when empty).
  const { data: dbTemplates } = useServerData<ReplyTemplateRow[]>(() => listReplyTemplatesFn(), []);
  const templates: ReplyTemplateRow[] =
    dbTemplates.length > 0
      ? dbTemplates
      : REPLY_TEMPLATES.map((tpl) => ({
          id: tpl.id,
          channel: tpl.channel,
          labelVi: tpl.labelVi,
          labelEn: tpl.labelEn,
          subjectVi: tpl.subjectVi ?? null,
          subjectEn: tpl.subjectEn ?? null,
          bodyVi: tpl.bodyVi,
          bodyEn: tpl.bodyEn,
          priority: 0,
          isActive: true,
        }));

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const tpl = templates.find((x) => x.id === id);
    if (!tpl) return;
    const fill = (s: string) =>
      s.replace(/\{name\}/g, lead.requesterName || "").replace(/\{card\}/g, lead.cardName || "");
    setChannel(tpl.channel);
    setSubject(fill((lang === "en" ? tpl.subjectEn : tpl.subjectVi) ?? ""));
    setBody(fill(lang === "en" ? tpl.bodyEn : tpl.bodyVi));
  };

  const submit = async () => {
    if (!body.trim()) {
      toast.error(t("bc.reply.bodyRequired"));
      return;
    }
    setBusy(true);
    try {
      await sendReply({
        data: {
          id: lead.id,
          channel,
          templateId: templateId || null,
          subject: channel === "email" ? subject.trim() || null : null,
          body: body.trim(),
          markResponded,
        },
      });
      toast.success(t("bc.reply.saved"));
      // Open mail/tel client as a convenience when contact info exists.
      if (channel === "email" && lead.requesterEmail) {
        const url = `mailto:${lead.requesterEmail}?subject=${encodeURIComponent(
          subject,
        )}&body=${encodeURIComponent(body)}`;
        window.open(url, "_blank");
      }
      setComposing(false);
      setTemplateId("");
      setSubject("");
      setBody("");
      await onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--vba-text)]">
          <MessageSquareText className="h-3.5 w-3.5 text-[var(--vba-gold)]" />
          {t("bc.reply.history")}
        </p>
        {!composing ? (
          <button
            onClick={() => setComposing(true)}
            className="vba-gold-grad inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-[#1a1206]"
          >
            <Send className="h-3.5 w-3.5" />
            {t("bc.reply.compose")}
          </button>
        ) : null}
      </div>

      {lead.replies.length === 0 ? (
        <p className="text-[12px] text-[var(--vba-text-dim)]">{t("bc.reply.empty")}</p>
      ) : (
        <ol className="space-y-2">
          {lead.replies.map((r, i) => (
            <li key={i} className="rounded-lg bg-card/5 p-3">
              <div className="mb-1 flex items-center gap-2 text-[11px] text-[var(--vba-text-dim)]">
                <span className="rounded-full bg-[var(--vba-gold)]/15 px-2 py-0.5 font-semibold text-[var(--vba-gold)]">
                  {t(REPLY_CHANNEL_KEY[r.channel as ReplyChannel])}
                </span>
                {r.subject ? (
                  <span className="truncate font-semibold text-[var(--vba-text)]">{r.subject}</span>
                ) : null}
                <span className="ml-auto shrink-0">{fmt(r.at)}</span>
              </div>
              <p className="whitespace-pre-wrap text-[12px] text-[var(--vba-text)]">{r.body}</p>
            </li>
          ))}
        </ol>
      )}

      {composing ? (
        <div className="mt-3 space-y-3 rounded-lg border border-border/10 bg-card/[0.03] p-3">
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--vba-text-dim)]">
              <FileText className="h-3.5 w-3.5" />
              {t("bc.reply.template")}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl.id)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
                    templateId === tpl.id
                      ? "vba-gold-grad text-[#1a1206]"
                      : "bg-card/5 text-[var(--vba-text)] hover:bg-card/10"
                  }`}
                >
                  {lang === "en" ? tpl.labelEn : tpl.labelVi}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(["email", "phone", "note"] as ReplyChannel[]).map((c: any) => (
              <button
                key={c}
                onClick={() => setChannel(c)}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
                  channel === c
                    ? "bg-[var(--vba-gold)]/15 text-[var(--vba-gold)]"
                    : "bg-card/5 text-[var(--vba-text-dim)] hover:bg-card/10"
                }`}
              >
                {t(REPLY_CHANNEL_KEY[c as ReplyChannel])}
              </button>
            ))}
          </div>

          {channel === "email" ? (
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("bc.reply.subjectPh")}
              className="w-full rounded-lg border border-border/10 bg-card/5 px-3 py-2 text-[13px] text-[var(--vba-text)] outline-none focus:border-[var(--vba-gold)]"
            />
          ) : null}

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder={t("bc.reply.bodyPh")}
            className="w-full resize-y rounded-lg border border-border/10 bg-card/5 px-3 py-2 text-[13px] text-[var(--vba-text)] outline-none focus:border-[var(--vba-gold)]"
          />

          <label className="flex items-center gap-2 text-[12px] text-[var(--vba-text-dim)]">
            <input
              type="checkbox"
              checked={markResponded}
              onChange={(e) => setMarkResponded(e.target.checked)}
              className="accent-[var(--vba-gold)]"
            />
            {t("bc.reply.markResponded")}
          </label>

          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={() => void submit()}
              className="vba-gold-grad inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-[#1a1206] disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {t("bc.reply.save")}
            </button>
            <button
              disabled={busy}
              onClick={() => setComposing(false)}
              className="rounded-lg bg-card/5 px-3 py-1.5 text-[12px] font-semibold text-[var(--vba-text-dim)] hover:bg-card/10 disabled:opacity-50"
            >
              {t("bc.reply.cancel")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CardRow({
  card,
  onEdit,
  onChanged,
}: {
  card: BusinessCardSummary;
  onEdit: () => void;
  onChanged: () => Promise<void> | void;
}) {
  const t = useT();
  const setStatus = useServerFn(setBusinessCardStatusFn);
  const del = useServerFn(deleteBusinessCardFn);
  const setPrimary = useServerFn(setPrimaryBusinessCardFn);
  const [busy, setBusy] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [fastScanOpen, setFastScanOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [confirmKind, setConfirmKind] = useState<null | "delete" | "primary">(null);

  const commit = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await onChanged();
    } catch (e) {
      toast.error(t(cardPermissionErrorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  const makePrimary = () => setConfirmKind("primary");

  const togglePublish = async () => {
    setBusy(true);
    try {
      await setStatus({
        data: { id: card.id, status: card.status === "published" ? "hidden" : "published" },
      });
      toast.success(card.status === "published" ? t("bc.unpublish") : t("bc.published"));
      await onChanged();
    } catch (e) {
      toast.error(t(cardPermissionErrorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  const remove = () => setConfirmKind("delete");

  const onConfirm = () => {
    const kind = confirmKind;
    setConfirmKind(null);
    if (kind === "delete") {
      performWithUndo({
        message: t("bc.deleteScheduled"),
        undoLabel: t("bc.undo"),
        commit: () => commit(() => del({ data: { id: card.id } })),
      });
    } else if (kind === "primary") {
      performWithUndo({
        message: t("bc.primaryScheduled"),
        undoLabel: t("bc.undo"),
        commit: () => commit(() => setPrimary({ data: { id: card.id } })),
      });
    }
  };

  const published = card.status === "published";

  return (
    <div className="vba-card p-4">
      <div className="flex items-start gap-3">
        {card.avatarUrl ? (
          <img
            src={card.avatarUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-xl object-cover"
            width={48}
            height={48}
          />
        ) : (
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--vba-gold-soft)] text-[var(--vba-gold)]">
            <IdCard className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[14px] font-semibold text-[var(--vba-text)]">
              {card.displayName || card.slug}
            </span>
            <span className="rounded-full bg-[var(--vba-gold-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--vba-gold)]">
              {t(card.cardKind === "primary" ? "bc.f.kind.primary" : "bc.f.kind.secondary")}
            </span>
          </div>
          {card.professionalTitle ? (
            <p className="truncate text-[12px] text-[var(--vba-text-muted)]">
              {card.professionalTitle}
              {card.companyName ? ` · ${card.companyName}` : ""}
            </p>
          ) : null}
          <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--vba-text-dim)]">
            <span>/b/{card.slug}</span>
            <span>·</span>
            <span className={published ? "text-[var(--vba-gold)]" : ""}>
              {t(STATUS_KEY[card.status])}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--vba-border-soft)] px-3 py-1.5 text-[12px] font-semibold text-[var(--vba-text)]"
        >
          <Pencil className="h-3.5 w-3.5" />
          {t("bc.edit")}
        </button>
        <button
          onClick={() => setPreviewOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--vba-border-soft)] px-3 py-1.5 text-[12px] font-semibold text-[var(--vba-text)]"
        >
          <QrCode className="h-3.5 w-3.5" />
          {t("bc.preview")}
        </button>
        {card.cardKind !== "primary" ? (
          <button
            onClick={makePrimary}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--vba-border-soft)] px-3 py-1.5 text-[12px] font-semibold text-[var(--vba-text)] disabled:opacity-50"
          >
            <Star className="h-3.5 w-3.5" />
            {t("bc.setPrimary")}
          </button>
        ) : null}
        <button
          disabled={busy}
          onClick={() => void togglePublish()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--vba-border-soft)] px-3 py-1.5 text-[12px] font-semibold text-[var(--vba-text)] disabled:opacity-50"
        >
          {published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {published ? t("bc.unpublish") : t("bc.publish")}
        </button>
        {published ? (
          <>
            <button
              onClick={() => setShareOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--vba-border-soft)] px-3 py-1.5 text-[12px] font-semibold text-[var(--vba-text)]"
            >
              <Share2 className="h-3.5 w-3.5" />
              {t("bc.share")}
            </button>
            <button
              onClick={() => setFastScanOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--vba-gold)]/40 bg-[var(--vba-gold-soft)] px-3 py-1.5 text-[12px] font-semibold text-[var(--vba-text)]"
            >
              <Zap className="h-3.5 w-3.5 text-[var(--vba-gold)]" />
              {t("bc.fastScan")}
            </button>
            <a
              href={`/b/${card.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--vba-border-soft)] px-3 py-1.5 text-[12px] font-semibold text-[var(--vba-text)]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t("bc.viewPublic")}
            </a>
          </>
        ) : null}
        <button
          disabled={busy}
          onClick={() => void remove()}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-[var(--vba-danger)] disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t("bc.delete")}
        </button>
      </div>
      {shareOpen ? (
        <ShareCardModal
          slug={card.slug}
          name={card.displayName || card.slug}
          title={card.professionalTitle || undefined}
          company={card.companyName || undefined}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
      {fastScanOpen ? (
        <FastScanModal slug={card.slug} onClose={() => setFastScanOpen(false)} />
      ) : null}

      {previewOpen ? (
        <CardPreviewModal
          slug={card.slug}
          name={card.displayName || card.slug}
          title={card.professionalTitle || undefined}
          company={card.companyName || undefined}
          avatarUrl={card.avatarUrl}
          published={published}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
      <ConfirmDialog
        open={confirmKind !== null}
        onOpenChange={(o) => !o && setConfirmKind(null)}
        title={t(confirmKind === "delete" ? "bc.confirmDelete.title" : "bc.confirmPrimary.title")}
        description={t(
          confirmKind === "delete" ? "bc.confirmDelete.desc" : "bc.confirmPrimary.desc",
        )}
        confirmLabel={t(confirmKind === "delete" ? "bc.delete" : "bc.setPrimary")}
        destructive={confirmKind === "delete"}
        onConfirm={onConfirm}
      />
    </div>
  );
}

function CardEditor({
  draft,
  onClose,
  onSaved,
}: {
  draft: Draft;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const save = useServerFn(saveBusinessCardFn);
  const [d, setD] = useState<Draft>(draft);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setD((prev) => ({ ...prev, [key]: value }));

  const addSkill = () => {
    const v = skillInput.trim();
    if (!v) return;
    set("skills", [...d.skills, v]);
    setSkillInput("");
  };

  const submit = async () => {
    if (d.slug.trim().length < 2) {
      toast.error(t("bc.required"));
      return;
    }
    setSaving(true);
    try {
      await save({
        data: {
          id: d.id,
          slug: d.slug.trim(),
          cardKind: d.cardKind,
          publicMode: d.publicMode,
          visibilitySettings: {
            showContact: d.visibility.showContact,
            showSocial: d.visibility.showSocial,
            showServices: d.visibility.showServices,
            showNeeds: d.visibility.showNeeds,
          },
          displayName: d.displayName || null,
          professionalTitle: d.professionalTitle || null,
          companyName: d.companyName || null,
          avatarUrl: d.avatarUrl || null,
          headline: d.headline || null,
          bio: d.bio || null,
          website: d.website || null,
          workEmail: d.workEmail || null,
          workPhone: d.workPhone || null,
          address: d.address || null,
          zaloUrl: d.zaloUrl || null,
          linkedinUrl: d.linkedinUrl || null,
          facebookUrl: d.facebookUrl || null,
          youtubeUrl: d.youtubeUrl || null,
          tiktokUrl: d.tiktokUrl || null,
          skills: d.skills.map((label) => ({ label })),
          services: d.services
            .filter((s) => s.title.trim())
            .map((s) => ({ title: s.title, description: s.description || null, category: null })),
          needs: d.needs
            .filter((s) => s.title.trim())
            .map((s) => ({ title: s.title, description: s.description || null, category: null })),
        },
      });
      toast.success(t("bc.saved"));
      onSaved();
    } catch (e) {
      toast.error(t(cardPermissionErrorKey(e)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <MemberHeader
        title={d.id ? t("bc.edit") : t("bc.new")}
        right={
          <button
            onClick={onClose}
            aria-label={t("bc.cancel")}
            className="grid h-9 w-9 place-items-center rounded-full text-[var(--vba-text-dim)] transition hover:bg-card/5"
          >
            <X className="h-5 w-5" />
          </button>
        }
      />
      <div className="space-y-4 px-4 py-4">
        {/* Identity */}
        <Section title={t("bc.sec.identity")}>
          <Field label={t("bc.f.slug")}>
            <Input
              value={d.slug}
              onChange={(v) => set("slug", v)}
              placeholder={t("bc.f.slug.ph")}
            />
          </Field>
          <Field label={t("bc.f.kind")}>
            <Segmented
              value={d.cardKind}
              options={[
                { value: "primary", label: t("bc.f.kind.primary") },
                { value: "secondary", label: t("bc.f.kind.secondary") },
              ]}
              onChange={(v) => set("cardKind", v as CardKind)}
            />
            <p className="mt-1 text-[11px] text-[var(--vba-text-dim)]">{t("bc.f.kind.hint")}</p>
          </Field>
          <Field label={t("bc.f.displayName")}>
            <Input value={d.displayName} onChange={(v) => set("displayName", v)} />
          </Field>
          <Field label={t("bc.f.title")}>
            <Input value={d.professionalTitle} onChange={(v) => set("professionalTitle", v)} />
          </Field>
          <Field label={t("bc.f.company")}>
            <Input value={d.companyName} onChange={(v) => set("companyName", v)} />
          </Field>
          <Field label={t("bc.f.avatar")}>
            <AvatarUploadField
              value={d.avatarUrl}
              onChange={(url) => set("avatarUrl", url)}
            />
            <Input
              value={d.avatarUrl}
              onChange={(v) => set("avatarUrl", v)}
              placeholder="https://..."
            />
          </Field>
          <Field label={t("bc.f.headline")}>
            <Input value={d.headline} onChange={(v) => set("headline", v)} />
          </Field>
          <Field label={t("bc.f.bio")}>
            <Textarea value={d.bio} onChange={(v) => set("bio", v)} />
          </Field>
        </Section>

        {/* Contact */}
        <Section title={t("bc.sec.contact")}>
          <Field label={t("bc.f.website")}>
            <Input value={d.website} onChange={(v) => set("website", v)} />
          </Field>
          <Field label={t("bc.f.email")}>
            <Input value={d.workEmail} onChange={(v) => set("workEmail", v)} type="email" />
          </Field>
          <Field label={t("bc.f.phone")}>
            <Input value={d.workPhone} onChange={(v) => set("workPhone", v)} />
          </Field>
          <Field label={t("bc.f.address")}>
            <Input value={d.address} onChange={(v) => set("address", v)} />
          </Field>
        </Section>

        {/* Social */}
        <Section title={t("bc.sec.social")}>
          <Field label={t("bc.f.zalo")}>
            <Input value={d.zaloUrl} onChange={(v) => set("zaloUrl", v)} />
          </Field>
          <Field label={t("bc.f.linkedin")}>
            <Input value={d.linkedinUrl} onChange={(v) => set("linkedinUrl", v)} />
          </Field>
          <Field label={t("bc.f.facebook")}>
            <Input value={d.facebookUrl} onChange={(v) => set("facebookUrl", v)} />
          </Field>
          <Field label={t("bc.f.youtube")}>
            <Input value={d.youtubeUrl} onChange={(v) => set("youtubeUrl", v)} />
          </Field>
          <Field label={t("bc.f.tiktok")}>
            <Input value={d.tiktokUrl} onChange={(v) => set("tiktokUrl", v)} />
          </Field>
        </Section>

        {/* Skills */}
        <Section title={t("bc.sec.skills")}>
          <div className="flex flex-wrap gap-2">
            {d.skills.map((s, i) => (
              <span
                key={`${s}-${i}`}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--vba-gold-soft)] px-3 py-1 text-[12px] font-medium text-[var(--vba-gold)]"
              >
                {s}
                <button
                  onClick={() =>
                    set(
                      "skills",
                      d.skills.filter((_, j) => j !== i),
                    )
                  }
                  aria-label={t("bc.delete")}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder={t("bc.skillPlaceholder")}
              className="vba-input flex-1"
            />
            <button
              onClick={addSkill}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--vba-border-soft)] px-3 text-[12px] font-semibold text-[var(--vba-text)]"
            >
              <Plus className="h-4 w-4" />
              {t("bc.add")}
            </button>
          </div>
        </Section>

        {/* Services */}
        <ItemListSection
          title={t("bc.sec.services")}
          items={d.services}
          onChange={(items) => set("services", items)}
        />

        {/* Needs */}
        <ItemListSection
          title={t("bc.sec.needs")}
          items={d.needs}
          onChange={(items) => set("needs", items)}
        />

        {/* Visibility */}
        <Section title={t("bc.sec.visibility")}>
          <Field label={t("bc.f.public")}>
            <Segmented
              value={d.publicMode}
              options={[
                { value: "public", label: t("bc.pm.public") },
                { value: "members_only", label: t("bc.pm.members_only") },
                { value: "private", label: t("bc.pm.private") },
              ]}
              onChange={(v) => set("publicMode", v as PublicMode)}
            />
          </Field>
          <p className="mb-2 mt-1 text-[11px] text-[var(--vba-text-dim)]">
            {t(`bc.pm.${d.publicMode}.desc` as TKey)}
          </p>
          {d.publicMode !== "private" ? (
            <div className="mt-1 space-y-1.5">
              <p className="text-[12px] font-semibold text-[var(--vba-text)]">
                {t("bc.vis.rules")}
              </p>
              <VisToggle
                label={t("bc.vis.showContact")}
                checked={d.visibility.showContact}
                onChange={(b) => set("visibility", { ...d.visibility, showContact: b })}
              />
              <VisToggle
                label={t("bc.vis.showSocial")}
                checked={d.visibility.showSocial}
                onChange={(b) => set("visibility", { ...d.visibility, showSocial: b })}
              />
              <VisToggle
                label={t("bc.vis.showServices")}
                checked={d.visibility.showServices}
                onChange={(b) => set("visibility", { ...d.visibility, showServices: b })}
              />
              <VisToggle
                label={t("bc.vis.showNeeds")}
                checked={d.visibility.showNeeds}
                onChange={(b) => set("visibility", { ...d.visibility, showNeeds: b })}
              />
            </div>
          ) : null}
        </Section>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-[var(--vba-border-soft)] py-3 text-[13px] font-semibold text-[var(--vba-text)]"
          >
            {t("bc.cancel")}
          </button>
          <button
            disabled={saving}
            onClick={() => void submit()}
            className="vba-gold-grad flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold text-[#1a1206] disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? t("bc.saving") : t("bc.save")}
          </button>
        </div>
      </div>
    </>
  );
}

function ItemListSection({
  title,
  items,
  onChange,
}: {
  title: string;
  items: { title: string; description: string }[];
  onChange: (items: { title: string; description: string }[]) => void;
}) {
  const t = useT();
  const update = (i: number, patch: Partial<{ title: string; description: string }>) =>
    onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  return (
    <Section title={title}>
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-xl border border-[var(--vba-border-soft)] p-3">
            <div className="flex items-center gap-2">
              <input
                value={it.title}
                onChange={(e) => update(i, { title: e.target.value })}
                placeholder={t("bc.itemTitle")}
                className="vba-input flex-1"
              />
              <button
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                aria-label={t("bc.delete")}
                className="grid h-9 w-9 place-items-center rounded-lg text-[var(--vba-danger)]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={it.description}
              onChange={(e) => update(i, { description: e.target.value })}
              placeholder={t("bc.itemDesc")}
              rows={2}
              className="vba-input mt-2 w-full resize-none"
            />
          </div>
        ))}
      </div>
      <button
        onClick={() => onChange([...items, { title: "", description: "" }])}
        className="mt-2 inline-flex items-center gap-1 rounded-lg border border-[var(--vba-border-soft)] px-3 py-1.5 text-[12px] font-semibold text-[var(--vba-text)]"
      >
        <Plus className="h-4 w-4" />
        {t("bc.add")}
      </button>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="vba-card p-4">
      <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[var(--vba-gold)]">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-[var(--vba-text-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="vba-input w-full"
    />
  );
}

function Textarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="vba-input w-full resize-none"
    />
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-[var(--vba-border-soft)] p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${
            value === o.value
              ? "vba-gold-grad text-[#1a1206]"
              : "text-[var(--vba-text-muted)] hover:text-[var(--vba-text)]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function VisToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg border border-[var(--vba-border-soft)] px-3 py-2 text-left"
    >
      <span className="text-[12px] font-medium text-[var(--vba-text)]">{label}</span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${
          checked ? "vba-gold-grad" : "bg-[var(--vba-border-soft)]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-card transition-all ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
