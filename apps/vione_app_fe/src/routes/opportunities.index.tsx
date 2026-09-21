import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { REVIEW_SEARCH_RESET } from "@/lib/review-search";
import { useMemo, useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  ImagePlus,
  LayoutGrid,
  Lightbulb,
  MapPin,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Table as TableIcon,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { resolveMediaUrl } from "@/lib/api-client";
import { AppShell } from "@/components/dashboard/AppShell";
import { PageHeader, StatCard, Card, Pill } from "@/components/dashboard/PageKit";
import { TruncatedText } from "@/components/dashboard/TruncatedText";
import { useFmt, useT, type TKey } from "@/lib/i18n";
import {
  OPPORTUNITY_TYPES,
  ICON_OPTIONS,
  getPoster,
  type Opportunity,
  type OpportunityInterest,
  type OpportunityStatus,
  type OpportunityTypeKey,
} from "@/lib/opportunities-data";
import {
  listOpportunitiesFn,
  createOpportunityFn,
  deleteOpportunityFn,
  expressInterestFn,
  toggleOpportunityStatusFn,
} from "@/lib/opportunities.functions";
import { CURRENT_USER_ID } from "@/lib/networking-data";
import { useAuth } from "@/context/AuthContext";
import { useTableControls } from "@/hooks/use-table-controls";
import { useUrlState } from "@/hooks/use-url-state";
import { Pagination } from "@/components/dashboard/DataTablePagination";
import { toast } from "sonner";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/date-format";

function formatCurrencyInput(val: string): string {
  const digits = val.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("vi-VN");
}

export const Route = createFileRoute("/opportunities/")({
  ssr: false,
  loader: () => listOpportunitiesFn(),
  component: OpportunitiesPage,
});

const STATUS_COLOR: Record<OpportunityStatus, "success" | "neutral"> = {
  open: "success",
  closed: "neutral",
};
const STATUS_KEY: Record<OpportunityStatus, TKey> = {
  open: "opp.status.open",
  closed: "opp.status.closed",
};

function OpportunityCard({
  opp,
  interestCount,
  onInterest,
  onDelete,
  onToggle,
}: {
  opp: Opportunity;
  interestCount: number;
  onInterest: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const t = useT();
  const fmt = useFmt();
  const poster = getPoster(opp.posterId);
  const isOwner = opp.posterId === CURRENT_USER_ID;

  const budget =
    opp.budgetMin && opp.budgetMax
      ? `${fmt.money(opp.budgetMin)} – ${fmt.money(opp.budgetMax)}`
      : opp.budgetMin
        ? `${t("opp.fromLabel")} ${fmt.money(opp.budgetMin)}`
        : t("opp.budgetOpen");

  return (
    <Card className="flex flex-col overflow-hidden transition hover:shadow-lg">
      <Link
        to="/opportunities/$id"
        params={{ id: opp.id }}
        className="relative flex h-28 items-center justify-center overflow-hidden text-5xl bg-secondary/30"
        style={{ background: "var(--gradient-primary)" }}
        aria-label={opp.title}
      >
        {(() => {
          const img = opp.image || (opp as any).imageUrl;
          const resolved = resolveMediaUrl(img);
          if (resolved) {
            return (
              <img
                src={resolved}
                alt={opp.title}
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            );
          }
          return null;
        })()}
        <span className="relative z-10 drop-shadow-md">{opp.emoji}</span>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <Pill color="primary">{t(opp.type)}</Pill>
          <Pill color={STATUS_COLOR[opp.status]}>{t(STATUS_KEY[opp.status])}</Pill>
        </div>
        <Link
          to="/opportunities/$id"
          params={{ id: opp.id }}
          className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground hover:text-primary hover:underline"
        >
          {opp.title}
        </Link>
        <p className="line-clamp-2 text-xs text-muted-foreground">{opp.description}</p>

        <div className="grid grid-cols-1 gap-1.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />
            <span>
              {opp.region} · {opp.industry}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarClock className="h-3 w-3" />
            <span>
              {t("opp.deadline")}: {fmt.date(opp.deadline)}
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-secondary/50 p-2 text-[11px]">
          <div className="text-muted-foreground">{t("opp.budget")}</div>
          <div className="font-semibold text-foreground">{budget}</div>
        </div>

        {(opp.contactName || opp.contactPhone || opp.company) && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-2 text-[11px] text-foreground">
            <div className="font-semibold text-primary flex items-center gap-1">
              <span>Liên hệ:</span>
              <span>{opp.contactName || "Người liên hệ"}</span>
              {opp.contactTitle && <span className="font-normal text-muted-foreground">({opp.contactTitle})</span>}
            </div>
            {(opp.company || opp.contactPhone) && (
              <div className="mt-0.5 text-muted-foreground text-[10.5px]">
                {[opp.company, opp.contactPhone].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
        )}

        {opp.claimedByName && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-[11px] text-emerald-400">
            <div className="flex items-center gap-1 font-semibold text-emerald-300">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Đã nhận kết nối: {opp.claimedByName}
            </div>
            {(opp.claimedCompany || opp.claimedPhone) && (
              <div className="mt-0.5 text-emerald-300/80 truncate text-[10.5px]">
                {[opp.claimedCompany, opp.claimedPhone].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
          <Link
            to="/members/$memberId"
            params={{ memberId: opp.posterId }}
            search={REVIEW_SEARCH_RESET}
            className="truncate font-medium text-primary hover:underline"
          >
            {opp.posterName || opp.contactName || poster?.name || opp.company || "Hội viên CLB"}
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {opp.views}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {interestCount}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {isOwner ? (
            <>
              <button
                onClick={onToggle}
                className="flex-1 rounded-lg border border-border bg-background py-2 text-xs font-medium hover:bg-secondary"
              >
                {opp.status === "open" ? t("opp.action.close") : t("opp.action.reopen")}
              </button>
              <button
                onClick={onDelete}
                className="rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10"
                aria-label={t("opp.action.delete")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={onInterest}
              disabled={opp.status === "closed"}
              className="flex-1 rounded-lg py-2 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "var(--gradient-primary)" }}
            >
              <span className="inline-flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5" />
                {t("opp.action.interest")}
              </span>
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

function NewOpportunityModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const router = useRouter();
  const { user } = useAuth();
  const createOpp = useServerFn(createOpportunityFn);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState<OpportunityTypeKey>("opp.type.partnership");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [region, setRegion] = useState("");
  const [industry, setIndustry] = useState("");
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
  );
  const [emoji, setEmoji] = useState("💡");
  const [imageUrl, setImageUrl] = useState("");
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState(user?.user_metadata?.full_name || "");
  const [contactPhone, setContactPhone] = useState(
    (user as any)?.phone || (user?.username && /^\d+$/.test(user.username) ? user.username : ""),
  );
  const [contactTitle, setContactTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !desc.trim() || !region.trim() || !industry.trim()) return;
    await createOpp({
      data: {
        title,
        description: desc,
        type,
        budgetMin: budgetMin ? Number(budgetMin.replace(/\D/g, "")) : undefined,
        budgetMax: budgetMax ? Number(budgetMax.replace(/\D/g, "")) : undefined,
        region,
        industry,
        deadline: new Date(deadline).toISOString(),
        emoji,
        contactName: contactName.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        contactTitle: contactTitle.trim() || undefined,
        company: company.trim() || undefined,
        image: imageUrl || undefined,
        imageUrl: imageUrl || undefined,
      },
    });
    await router.invalidate();
    toast.success(t("opp.toast.created"));
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("opp.form.title")}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-5 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="mb-1.5 block text-xs font-semibold">Hình ảnh minh họa / Poster cơ hội</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-border max-h-40 bg-muted/20">
                <img src={imageUrl} alt="Poster" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow cursor-pointer transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-border p-4 text-center hover:border-primary/50 hover:bg-muted/20 transition cursor-pointer flex flex-col items-center justify-center gap-1.5"
              >
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">
                  Chọn ảnh tải lên từ thiết bị (JPG, PNG, WebP)
                </span>
              </button>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold">{t("opp.form.titleField")}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={t("opp.form.titlePh")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold">{t("opp.form.desc")}</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              required
              placeholder={t("opp.form.descPh")}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold">{t("opp.form.type")}</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as OpportunityTypeKey)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {OPPORTUNITY_TYPES.map((c: any) => (
                  <option key={c} value={c}>
                    {t(c)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold">{t("opp.form.deadline")}</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              {deadline && (
                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                  <span>Hạn chót: {formatDisplayDate(deadline, { withWeekday: true })}</span>
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold">Doanh nghiệp / Tổ chức</label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="VD: Tập đoàn ViConnect"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold">Người liên hệ</label>
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="VD: Nguyễn Văn A"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold">Chức vụ người liên hệ</label>
              <input
                value={contactTitle}
                onChange={(e) => setContactTitle(e.target.value)}
                placeholder="VD: Giám đốc Kinh doanh"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold">Số điện thoại liên hệ</label>
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="VD: 0912345678"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold">{t("opp.form.region")}</label>
              <input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                required
                placeholder="VD: TP. Hồ Chí Minh"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold">{t("opp.form.industry")}</label>
              <input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                required
                placeholder="VD: Sản xuất"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold">
                {t("opp.form.budgetMin")} (VNĐ)
              </label>
              <input
                value={budgetMin}
                onChange={(e) => setBudgetMin(formatCurrencyInput(e.target.value))}
                placeholder="VD: 50.000.000"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary font-medium"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold">
                {t("opp.form.budgetMax")} (VNĐ)
              </label>
              <input
                value={budgetMax}
                onChange={(e) => setBudgetMax(formatCurrencyInput(e.target.value))}
                placeholder="VD: 200.000.000"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary font-medium"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold">{t("opp.form.icon")}</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setEmoji(i)}
                  className={`h-9 w-9 rounded-lg border text-lg transition ${
                    emoji === i
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              {t("opp.form.cancel")}
            </button>
            <button
              type="submit"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              {t("opp.form.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InterestModal({ opp, onClose }: { opp: Opportunity; onClose: () => void }) {
  const t = useT();
  const navigate = useNavigate();
  const router = useRouter();
  const express = useServerFn(expressInterestFn);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !contact.trim()) return;
    await express({ data: { opportunityId: opp.id, message, contact } });
    await router.invalidate();
    toast.success(t("opp.toast.interest"));
    onClose();
    // Open chat with poster
    navigate({ to: "/network", search: { peer: opp.posterId } });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Send className="h-5 w-5 text-primary" />
            {t("opp.interest.title")}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-5">
          <div className="rounded-lg bg-secondary/50 p-3 text-xs">
            <div className="text-muted-foreground">{t("opp.interest.about")}</div>
            <div className="font-semibold text-foreground">{opp.title}</div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold">
              {t("opp.interest.contact")}
            </label>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
              placeholder="email@congty.vn / 0901..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold">
              {t("opp.interest.message")}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
              placeholder={t("opp.interest.messagePh")}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              {t("opp.form.cancel")}
            </button>
            <button
              type="submit"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              {t("opp.interest.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type Tab = "browse" | "mine" | "interests";

function OpportunitiesPage() {
  const t = useT();
  const fmt = useFmt();
  const router = useRouter();
  const {
    opportunities: all,
    interests,
    interestCounts,
  } = Route.useLoaderData() as {
    opportunities: Opportunity[];
    interests: OpportunityInterest[];
    interestCounts: Record<string, number>;
  };
  const deleteOpp = useServerFn(deleteOpportunityFn);
  const toggleOpp = useServerFn(toggleOpportunityStatusFn);
  const [tab, setTab] = useState<Tab>("browse");
  const [view, setView] = useUrlState<"table" | "grid">("view", "table");
  const [q, setQ] = useUrlState<string>("q", "");
  const [typeFilter, setTypeFilter] = useState<OpportunityTypeKey | "all">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [interestOpp, setInterestOpp] = useState<Opportunity | null>(null);

  const countFor = (id: string) => interestCounts[id] ?? 0;

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let base = all;
    if (tab === "mine") base = base.filter((o) => o.posterId === CURRENT_USER_ID);
    if (typeFilter !== "all") base = base.filter((o) => o.type === typeFilter);
    if (ql) {
      base = base.filter(
        (o) =>
          o.title.toLowerCase().includes(ql) ||
          o.description.toLowerCase().includes(ql) ||
          o.industry.toLowerCase().includes(ql) ||
          o.region.toLowerCase().includes(ql),
      );
    }
    return base;
  }, [all, q, tab, typeFilter]);

  const tc = useTableControls<Opportunity>(
    filtered,
    {
      title: (o) => o.title,
      type: (o) => o.type,
      region: (o) => o.region,
      deadline: (o) => o.deadline,
      createdAt: (o) => o.createdAt,
    },
    { initialSortKey: "createdAt", initialSortDir: "desc", initialPageSize: 9 },
  );

  const myOpps = useMemo(() => all.filter((o) => o.posterId === CURRENT_USER_ID), [all]);
  const myInterests = useMemo(
    () =>
      myOpps
        .map((o) => ({
          opp: o,
          items: interests.filter((it) => it.opportunityId === o.id),
        }))
        .filter((x: any) => x.items.length > 0),
    [myOpps, interests],
  );

  const totalOpen = all.filter((o) => o.status === "open").length;
  const totalInterestsOnMine = myOpps.reduce((s, o) => s + countFor(o.id), 0);

  return (
    <AppShell>
      <PageHeader
        title={t("opp.title")}
        subtitle={t("opp.subtitle")}
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Plus className="h-4 w-4" />
            {t("opp.action.new")}
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("opp.kpi.total")}
          value={all.length}
          icon={<Lightbulb className="h-4 w-4" />}
        />
        <StatCard
          label={t("opp.kpi.open")}
          value={totalOpen}
          tone="success"
          icon={<Sparkles className="h-4 w-4" />}
        />
        <StatCard
          label={t("opp.kpi.mine")}
          value={myOpps.length}
          tone="info"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label={t("opp.kpi.interests")}
          value={totalInterestsOnMine}
          tone="warning"
          icon={<MessageSquare className="h-4 w-4" />}
        />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["browse", "mine", "interests"] as Tab[]).map((tk) => (
          <button
            key={tk}
            onClick={() => setTab(tk)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === tk
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                : "border border-border bg-card hover:bg-secondary"
            }`}
          >
            {t(`opp.tab.${tk}` as TKey)}
          </button>
        ))}
      </div>

      {tab !== "interests" && (
        <Card className="mb-6 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[260px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("opp.search")}
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as OpportunityTypeKey | "all")}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="all">{t("opp.filter.all")}</option>
              {OPPORTUNITY_TYPES.map((c: any) => (
                <option key={c} value={c}>
                  {t(c)}
                </option>
              ))}
            </select>
            <div className="flex items-center rounded-lg border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => setView("table")}
                className={`rounded-md p-1.5 transition-colors ${
                  view === "table"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Dạng bảng"
              >
                <TableIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`rounded-md p-1.5 transition-colors ${
                  view === "grid"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Dạng lưới"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>
      )}

      {tab === "interests" ? (
        <div className="space-y-4">
          {myInterests.length === 0 ? (
            <Card className="p-12 text-center text-sm text-muted-foreground">
              {t("opp.empty.interests")}
            </Card>
          ) : (
            myInterests.map(({ opp, items }) => (
              <Card key={opp.id} className="p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <Pill color="primary">{t(opp.type)}</Pill>
                    <h4 className="mt-2 text-base font-semibold">{opp.title}</h4>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {items.length} {t("opp.interest.count")}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.map((it) => {
                    const m = getPoster(it.memberId);
                    return (
                      <div
                        key={it.id}
                        className="rounded-lg border border-border bg-secondary/30 p-3 text-sm"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <Link
                            to="/members/$memberId"
                            params={{ memberId: it.memberId }}
                            search={REVIEW_SEARCH_RESET}
                            className="font-semibold text-primary hover:underline"
                          >
                            {(it as any).memberName || (it as any).name || m?.name || it.contact || it.memberId}
                          </Link>
                          <span className="text-[11px] text-muted-foreground">
                            {fmt.date(it.createdAt)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">{it.contact}</div>
                        <p className="mt-1.5 text-sm text-foreground">{it.message}</p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))
          )}
        </div>
      ) : tc.total === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          {tab === "mine" ? t("opp.empty.mine") : t("opp.empty.browse")}
        </Card>
      ) : view === "table" ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[1250px] whitespace-nowrap border-separate border-spacing-0 text-sm">
              <thead className="bg-secondary/80 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="sticky left-0 z-20 w-14 min-w-[56px] bg-secondary px-3 py-3 text-center text-xs font-bold border-b border-r border-border">
                    STT
                  </th>
                  <th className="sticky left-[56px] z-20 min-w-[90px] bg-secondary px-3 py-3 border-b border-r border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                    Mã
                  </th>
                  <th className="px-4 py-3 border-b border-border text-left">Cơ hội / Tiêu đề</th>
                  <th className="px-4 py-3 border-b border-border text-left">Người tạo cơ hội</th>
                  <th className="px-4 py-3 border-b border-border text-left">Người liên hệ</th>
                  <th className="px-4 py-3 border-b border-border text-left">Người nhận cơ hội</th>
                  <th className="px-4 py-3 border-b border-border text-left">Phân loại</th>
                  <th className="px-4 py-3 border-b border-border text-left">Ngành & Khu vực</th>
                  <th className="px-4 py-3 border-b border-border text-left">Ngân sách</th>
                  <th className="px-4 py-3 border-b border-border text-left">Hạn chót</th>
                  <th className="px-4 py-3 border-b border-border text-left">Trạng thái</th>
                  <th className="sticky right-0 z-20 min-w-[150px] bg-secondary px-4 py-3 text-right font-bold border-b border-l border-border shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {tc.pageRows.map((opp, idx) => {
                  const poster = getPoster(opp.posterId);
                  const isOwner = opp.posterId === CURRENT_USER_ID;
                  const budget =
                    opp.budgetMin && opp.budgetMax
                      ? `${fmt.money(opp.budgetMin)} – ${fmt.money(opp.budgetMax)}`
                      : opp.budgetMin
                        ? `${t("opp.fromLabel")} ${fmt.money(opp.budgetMin)}`
                        : t("opp.budgetOpen");

                  return (
                    <tr
                      key={opp.id}
                      className="group border-b border-border transition-all duration-150 hover:bg-secondary/60"
                    >
                      {/* Sticky STT */}
                      <td className="sticky left-0 z-10 w-14 min-w-[56px] bg-card group-hover:bg-muted/70 px-3 py-3 text-center text-xs font-medium text-muted-foreground border-b border-r border-border transition-colors">
                        {(tc.page - 1) * tc.pageSize + idx + 1}
                      </td>

                      {/* Sticky Code */}
                      <td className="sticky left-[56px] z-10 min-w-[100px] bg-card group-hover:bg-muted/70 px-3 py-3 font-mono text-[12px] font-semibold text-primary border-b border-r border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)] transition-colors">
                        <div className="flex items-center gap-1.5">
                          <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded bg-secondary/40 flex items-center justify-center text-sm">
                            {(() => {
                              const img = opp.image || (opp as any).imageUrl;
                              const resolved = resolveMediaUrl(img);
                              if (resolved) {
                                return (
                                  <img
                                    src={resolved}
                                    alt={opp.title}
                                    className="absolute inset-0 h-full w-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = "none";
                                    }}
                                  />
                                );
                              }
                              return null;
                            })()}
                            <span className="relative z-10 text-xs">{opp.emoji}</span>
                          </div>
                          <span>OPP-{opp.id.slice(0, 6).toUpperCase()}</span>
                        </div>
                      </td>

                      {/* Title & Description with Tooltip */}
                      <td className="px-4 py-3 border-b border-border">
                        <Link
                          to="/opportunities/$id"
                          params={{ id: opp.id }}
                          className="font-semibold text-foreground text-xs hover:text-primary hover:underline block"
                        >
                          <TruncatedText text={opp.title} maxWidth="max-w-[240px]" />
                        </Link>
                        <TruncatedText
                          text={opp.description}
                          maxWidth="max-w-[240px]"
                          className="text-[11px] text-muted-foreground"
                        />
                      </td>

                      {/* Người tạo cơ hội */}
                      <td className="px-4 py-3 border-b border-border">
                        <Link
                          to="/members/$memberId"
                          params={{ memberId: opp.posterId }}
                          search={REVIEW_SEARCH_RESET}
                          className="font-semibold text-primary hover:underline text-xs block"
                        >
                          <TruncatedText
                            text={opp.posterName || poster?.name || `Hội viên #${opp.posterId.slice(0, 6)}`}
                            maxWidth="max-w-[160px]"
                          />
                        </Link>
                        <div className="text-[11px] text-muted-foreground">
                          <TruncatedText
                            text={poster?.email || poster?.contact || "Hội viên"}
                            maxWidth="max-w-[160px]"
                          />
                        </div>
                      </td>

                      {/* Người liên hệ */}
                      <td className="px-4 py-3 border-b border-border">
                        {opp.contactName || opp.contactPhone || opp.company ? (
                          <div>
                            <div className="font-semibold text-foreground text-xs">
                              <TruncatedText
                                text={`${opp.contactName || "Người liên hệ"}${opp.contactTitle ? ` (${opp.contactTitle})` : ""}`}
                                maxWidth="max-w-[160px]"
                              />
                            </div>
                            {opp.company && (
                              <div className="text-[11px] text-muted-foreground">
                                <TruncatedText text={opp.company} maxWidth="max-w-[160px]" />
                              </div>
                            )}
                            {opp.contactPhone && (
                              <div className="text-[11px] text-primary font-mono">
                                {opp.contactPhone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">—</span>
                        )}
                      </td>

                      {/* Người nhận cơ hội */}
                      <td className="px-4 py-3 border-b border-border">
                        {opp.claimedByName ? (
                          <div>
                            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                              <TruncatedText text={opp.claimedByName} maxWidth="max-w-[150px]" />
                            </div>
                            {(opp.claimedCompany || opp.claimedPhone) && (
                              <div className="text-[11px] text-muted-foreground">
                                <TruncatedText
                                  text={[opp.claimedCompany, opp.claimedPhone].filter(Boolean).join(" • ")}
                                  maxWidth="max-w-[150px]"
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Chưa tiếp nhận
                          </span>
                        )}
                      </td>

                      {/* Phân loại */}
                      <td className="px-4 py-3 border-b border-border">
                        <Pill color="primary">{t(opp.type)}</Pill>
                      </td>

                      {/* Ngành & Khu vực */}
                      <td className="px-4 py-3 border-b border-border text-xs">
                        <div className="font-medium text-foreground">
                          <TruncatedText text={opp.industry} maxWidth="max-w-[140px]" />
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          <TruncatedText text={opp.region} maxWidth="max-w-[140px]" />
                        </div>
                      </td>

                      {/* Ngân sách */}
                      <td className="px-4 py-3 border-b border-border font-semibold text-xs text-foreground">
                        {budget}
                      </td>

                      {/* Hạn chót */}
                      <td className="px-4 py-3 border-b border-border text-xs text-muted-foreground">
                        {fmt.date(opp.deadline)}
                      </td>

                      {/* Trạng thái */}
                      <td className="px-4 py-3 border-b border-border">
                        <Pill color={STATUS_COLOR[opp.status]}>{t(STATUS_KEY[opp.status])}</Pill>
                      </td>

                      {/* Sticky Thao tác */}
                      <td className="sticky right-0 z-10 min-w-[150px] bg-card group-hover:bg-muted/70 px-4 py-3 text-right border-b border-l border-border shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)] transition-colors">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <Link
                            to="/opportunities/$id"
                            params={{ id: opp.id }}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                            title={t("tbl.view")}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            to="/opportunities/$id/edit"
                            params={{ id: opp.id }}
                            className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
                            title={t("opp.action.edit")}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                          {isOwner ? (
                            <>
                              <button
                                onClick={async () => {
                                  await toggleOpp({ data: { id: opp.id } });
                                  await router.invalidate();
                                }}
                                className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium hover:bg-secondary"
                                title={opp.status === "open" ? t("opp.action.close") : t("opp.action.reopen")}
                              >
                                {opp.status === "open" ? "Đóng" : "Mở lại"}
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(t("opp.confirmDelete"))) {
                                    await deleteOpp({ data: { id: opp.id } });
                                    await router.invalidate();
                                  }
                                }}
                                className="rounded-lg border border-destructive/30 p-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                                title={t("opp.action.delete")}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setInterestOpp(opp)}
                              disabled={opp.status === "closed"}
                              className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                              title={t("opp.action.interest")}
                            >
                              <Send className="h-3 w-3" />
                              Kết nối
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border bg-card">
            <Pagination
              page={tc.page}
              pageCount={tc.pageCount}
              pageSize={tc.pageSize}
              total={tc.total}
              from={tc.from}
              to={tc.to}
              onPage={tc.setPage}
              onPageSize={tc.setPageSize}
              pageSizeOptions={[9, 18, 36, 72]}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tc.pageRows.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opp={opp}
                interestCount={countFor(opp.id)}
                onInterest={() => setInterestOpp(opp)}
                onDelete={async () => {
                  if (confirm(t("opp.confirmDelete"))) {
                    await deleteOpp({ data: { id: opp.id } });
                    await router.invalidate();
                  }
                }}
                onToggle={async () => {
                  await toggleOpp({ data: { id: opp.id } });
                  await router.invalidate();
                }}
              />
            ))}
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
            <Pagination
              page={tc.page}
              pageCount={tc.pageCount}
              pageSize={tc.pageSize}
              total={tc.total}
              from={tc.from}
              to={tc.to}
              onPage={tc.setPage}
              onPageSize={tc.setPageSize}
              pageSizeOptions={[9, 18, 36, 72]}
            />
          </div>
        </>
      )}

      {showCreate && <NewOpportunityModal onClose={() => setShowCreate(false)} />}
      {interestOpp && <InterestModal opp={interestOpp} onClose={() => setInterestOpp(null)} />}
    </AppShell>
  );
}
