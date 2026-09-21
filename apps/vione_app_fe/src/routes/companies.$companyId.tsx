import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Globe,
  Hash,
  Users,
  Calendar,
  Briefcase,
  Edit3,
  Building2,
  CheckCircle2,
  XCircle,
  Wallet,
  Activity,
  CalendarCheck2,
  Receipt,
  TrendingUp,
  PhoneCall,
  Mail as MailIcon,
  StickyNote,
  Users2,
  CreditCard,
  Download,
  ExternalLink,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { SendEmailModal } from "@/components/dashboard/SendEmailModal";
import { CrudModal, type CrudField, type CrudValues } from "@/components/dashboard/CrudModal";
import { useRole } from "@/hooks/use-role";
import { useT, type TKey } from "@/lib/i18n";
import { type Member, type MemberStatus } from "@/lib/members-data";
import { fetchNestApi } from "@/lib/api-client";
import {
  ACTIVITY_LABEL,
  EVENT_ROLE_LABEL,
  PAY_KIND_LABEL,
  PAY_METHOD_LABEL,
  PAY_STATUS_LABEL,
  formatVND,
  type ActivityType,
  type EventRole,
  type PayStatus,
} from "@/lib/companies-history";
import type { CompanyHistory } from "@/lib/companies.functions";

export const Route = createFileRoute("/companies/$companyId")({
  ssr: false,
  loader: async ({ params }) => {
    const company = await fetchNestApi<Member>(`/members/${params.companyId}`).catch(() => null);
    if (!company) throw notFound();
    const history = await fetchNestApi<CompanyHistory>(`/members/${params.companyId}/history`).catch(() => null);
    return {
      company,
      history: history || { activities: [], events: [], payments: [] },
    };
  },
  component: CompanyDetailPage,
  notFoundComponent: NotFound,
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error.message}
      </div>
    </AppShell>
  ),
});

function NotFound() {
  const t = useT();
  return (
    <AppShell>
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
        <h2 className="mb-2 text-xl font-bold text-foreground">404</h2>
        <p className="mb-6 text-sm text-muted-foreground">{t("cdetail.notFound")}</p>
        <Link
          to="/companies"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("cdetail.back")}
        </Link>
      </div>
    </AppShell>
  );
}

const statusStyle: Record<MemberStatus, { dot: string; text: string; bg: string }> = {
  active: { dot: "bg-success", text: "text-success", bg: "bg-success/15" },
  pending: {
    dot: "bg-warning",
    text: "text-[oklch(0.45_0.16_65)]",
    bg: "bg-warning/20",
  },
  expired: { dot: "bg-destructive", text: "text-destructive", bg: "bg-destructive/15" },
};

const ACT_STYLE: Record<ActivityType, { Icon: typeof MailIcon; bg: string; text: string }> = {
  email: { Icon: MailIcon, bg: "bg-info/10", text: "text-info" },
  call: { Icon: PhoneCall, bg: "bg-primary/10", text: "text-primary" },
  meeting: { Icon: Users2, bg: "bg-warning/15", text: "text-[oklch(0.55_0.16_65)]" },
  event: { Icon: CalendarCheck2, bg: "bg-success/10", text: "text-success" },
  payment: { Icon: CreditCard, bg: "bg-primary/15", text: "text-primary" },
  note: { Icon: StickyNote, bg: "bg-muted", text: "text-muted-foreground" },
};

const ROLE_STYLE: Record<EventRole, string> = {
  attendee: "bg-muted text-muted-foreground border-border",
  sponsor: "bg-primary/10 text-primary border-primary/30",
  speaker: "bg-info/10 text-info border-info/30",
  partner: "bg-warning/15 text-[oklch(0.45_0.16_65)] border-warning/40",
};

const PAY_STATUS_STYLE: Record<PayStatus, string> = {
  paid: "bg-success/10 text-success",
  pending: "bg-warning/15 text-[oklch(0.45_0.16_65)]",
  refunded: "bg-muted text-muted-foreground",
};

function initials(name: string) {
  const w = name
    .replace(/Công ty|TNHH|CP|TMCP|Cửa hàng|Tập đoàn|Ngân hàng/gi, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return ((w[0]?.[0] ?? "") + (w[w.length - 1]?.[0] ?? "")).toUpperCase();
}

function fmtDate(iso: string, withTime = false) {
  const d = new Date(iso);
  return withTime
    ? d.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : d.toLocaleDateString("vi-VN");
}

function relativeDate(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (diff < 1) return "Hôm nay";
  if (diff < 2) return "Hôm qua";
  if (diff < 7) return `${Math.floor(diff)} ngày trước`;
  if (diff < 30) return `${Math.floor(diff / 7)} tuần trước`;
  return `${Math.floor(diff / 30)} tháng trước`;
}

function CompanyDetailPage() {
  const t = useT();
  const loaderData = Route.useLoaderData() as {
    company: Member;
    history?: CompanyHistory;
  };
  const loaded = loaderData.company;
  const history = loaderData.history || { activities: [], events: [], payments: [] };
  const activities = history.activities || [];
  const events = history.events || [];
  const payments = history.payments || [];

  const { isAdmin } = useRole();
  const [companyState, setCompanyState] = useState<Member>(loaded);
  const [openEmail, setOpenEmail] = useState(false);
  const [editingCompany, setEditingCompany] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const [contact, setContact] = useState({
    email: loaded.email,
    phone: loaded.phone,
    address: loaded.address,
  });
  const company: Member = { ...companyState, ...contact };

  const [tab, setTab] = useState<"overview" | "activity" | "events" | "payments">("overview");

  const fields: CrudField[] = [
    { name: "name", label: t("members.f.name"), type: "text", required: true },
    { name: "contact", label: t("members.f.contact"), type: "text" },
    { name: "email", label: t("members.f.email"), type: "text" },
    { name: "phone", label: t("members.f.phone"), type: "text" },
    {
      name: "level",
      label: t("members.f.level"),
      type: "select",
      options: [
        { value: "memberLevel.large", label: t("memberLevel.large") },
        { value: "memberLevel.medium", label: t("memberLevel.medium") },
        { value: "memberLevel.small", label: t("memberLevel.small") },
      ],
    },
    {
      name: "industry",
      label: t("members.f.industry"),
      type: "select",
      options: [
        { value: "ind.trade", label: t("ind.trade") },
        { value: "ind.it", label: t("ind.it") },
        { value: "ind.manufacturing", label: t("ind.manufacturing") },
        { value: "ind.realestate", label: t("ind.realestate") },
        { value: "ind.finance", label: t("ind.finance") },
      ],
    },
    {
      name: "region",
      label: t("members.f.region"),
      type: "select",
      options: [
        { value: "region.north", label: t("region.north") },
        { value: "region.central", label: t("region.central") },
        { value: "region.south", label: t("region.south") },
      ],
    },
    {
      name: "status",
      label: t("members.f.status"),
      type: "select",
      options: [
        { value: "pending", label: t("status.pending") },
        { value: "active", label: t("status.active") },
        { value: "expired", label: t("status.expired") },
      ],
    },
    { name: "address", label: t("members.f.address"), type: "text" },
    { name: "website", label: t("members.f.website"), type: "text" },
    { name: "taxCode", label: t("members.f.taxCode"), type: "text" },
    { name: "employees", label: t("members.f.employees"), type: "number" },
    { name: "about", label: t("members.f.about"), type: "textarea" },
  ];

  const editInitial = (m: Member): CrudValues => ({
    name: m.name,
    contact: m.contact,
    email: m.email,
    phone: m.phone,
    level: m.level,
    industry: m.industry,
    region: m.region,
    status: m.status,
    address: m.address,
    website: m.website ?? "",
    taxCode: m.taxCode ?? "",
    employees: m.employees ?? 0,
    about: m.about,
  });

  const handleSaveCompany = async (values: CrudValues) => {
    if (!isAdmin) {
      toast.error(t("perm.denied.title"), { description: t("perm.denied.adminOnly") });
      return;
    }
    setSubmittingEdit(true);
    try {
      const payload = {
        name: String(values.name || "").trim(),
        contact: String(values.contact || "").trim(),
        email: String(values.email || "").trim(),
        phone: String(values.phone || "").trim(),
        level: values.level,
        industry: values.industry,
        region: values.region,
        status: values.status,
        address: String(values.address || "").trim(),
        website: values.website ? String(values.website).trim() : null,
        taxCode: values.taxCode ? String(values.taxCode).trim() : null,
        employees: Number(values.employees) || 0,
        about: String(values.about || "").trim(),
      };

      const updated = await fetchNestApi<Member>(`/members/${company.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (updated && updated.id) {
        setCompanyState(updated);
        setContact({
          email: updated.email,
          phone: updated.phone,
          address: updated.address,
        });
      } else {
        setCompanyState((prev) => ({ ...prev, ...payload } as Member));
      }
      toast.success("Đã cập nhật thông tin doanh nghiệp thành công!");
      setEditingCompany(false);
    } catch (err) {
      console.error("[Companies] Failed to update company:", err);
      toast.error("Không thể cập nhật thông tin doanh nghiệp");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleSaveContact = (next: typeof contact) => {
    setContact(next);
    void fetchNestApi(`/members/${loaded.id}/contact`, {
      method: "PATCH",
      body: JSON.stringify(next),
    }).catch((err) => {
      console.error("[Companies] Failed to update contact:", err);
      toast.error("Không thể cập nhật thông tin liên hệ");
    });
  };

  const totalPaid = useMemo(
    () => payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0),
    [payments],
  );
  const tenure = Math.max(
    0,
    Math.floor((Date.now() - new Date(company.joinedAt || Date.now()).getTime()) / (365 * 86400000)),
  );
  const [approving, setApproving] = useState(false);
  const handleQuickApprove = async () => {
    if (!isAdmin) {
      toast.error(t("perm.denied.title"), { description: t("perm.denied.adminOnly") });
      return;
    }
    setApproving(true);
    try {
      await fetchNestApi(`/members/${company.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...company,
          status: "active",
        }),
      });
      setCompanyState((prev) => ({ ...prev, status: "active" }));
      toast.success("✓ Đã duyệt hồ sơ doanh nghiệp thành công! Trạng thái chuyển sang Hoạt động.");
    } catch (err: any) {
      console.error("[Companies] Failed to approve company:", err);
      toast.error(err?.message || "Không thể duyệt hồ sơ doanh nghiệp");
    } finally {
      setApproving(false);
    }
  };

  const [submittingFee, setSubmittingFee] = useState(false);
  const handleToggleFeePaid = async () => {
    if (!isAdmin) {
      toast.error(t("perm.denied.title"), { description: t("perm.denied.adminOnly") });
      return;
    }
    setSubmittingFee(true);
    const nextPaid = !company.feePaid;
    try {
      await fetchNestApi(`/members/${company.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...company,
          feePaid: nextPaid,
          feeYear: company.feeYear || new Date().getFullYear(),
        }),
      });
      setCompanyState((prev) => ({ ...prev, feePaid: nextPaid }));
      toast.success(
        nextPaid
          ? "✓ Đã xác nhận nộp hội phí thành công!"
          : "Đã chuyển trạng thái sang chưa đóng phí.",
      );
    } catch (err: any) {
      console.error("[Companies] Failed to update fee status:", err);
      toast.error(err?.message || "Không thể cập nhật trạng thái hội phí");
    } finally {
      setSubmittingFee(false);
    }
  };

  const s = statusStyle[company.status] || statusStyle.pending;

  const tabs: { key: typeof tab; label: TKey; Icon: typeof Activity; count?: number }[] = [
    { key: "overview", label: "cdetail.tab.overview", Icon: Building2 },
    {
      key: "activity",
      label: "cdetail.tab.activity",
      Icon: Activity,
      count: activities.length,
    },
    {
      key: "events",
      label: "cdetail.tab.events",
      Icon: CalendarCheck2,
      count: events.length,
    },
    {
      key: "payments",
      label: "cdetail.tab.payments",
      Icon: Receipt,
      count: payments.length,
    },
  ];

  return (
    <AppShell>
      <Link
        to="/companies"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("cdetail.back")}
      </Link>

      {/* Hero */}
      <div
        className="relative mb-5 overflow-hidden rounded-2xl border border-border p-6 shadow-[var(--shadow-elevated)]"
        style={{ background: "var(--gradient-card)" }}
      >
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-card/15 text-2xl font-bold text-primary-foreground backdrop-blur">
            {initials(company.name)}
          </div>
          <div className="min-w-0 flex-1 text-primary-foreground">
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-card/15 px-2.5 py-0.5 font-mono text-[11px] font-semibold backdrop-blur">
              {company.code}
            </div>
            <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">{company.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-primary-foreground/85">
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" /> {t(company.industry)}
              </span>
              <span className="opacity-50">•</span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> {t(company.level)}
              </span>
              <span className="opacity-50">•</span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {t(company.region)}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${s.bg} ${s.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
              {t(`status.${company.status}` as TKey)}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin && company.status === "pending" && (
                <button
                  type="button"
                  onClick={handleQuickApprove}
                  disabled={approving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{approving ? "Đang duyệt..." : "Duyệt hồ sơ"}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpenEmail(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-card/15 px-3 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur transition hover:bg-card/25"
              >
                <Mail className="h-3.5 w-3.5" /> {t("detail.sendEmail")}
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setEditingCompany(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-card/90"
                >
                  <Edit3 className="h-3.5 w-3.5" /> {t("detail.edit")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          Icon={CalendarCheck2}
          label={t("cdetail.kpi.events")}
          value={history.events.length.toString()}
          tone="primary"
        />
        <Kpi
          Icon={TrendingUp}
          label={t("cdetail.kpi.paid")}
          value={formatVND(totalPaid)}
          tone="success"
        />
        <Kpi
          Icon={Activity}
          label={t("cdetail.kpi.touchpoints")}
          value={history.activities.length.toString()}
          tone="info"
        />
        <Kpi
          Icon={Clock}
          label={t("cdetail.kpi.tenure")}
          value={`${tenure} ${t("cdetail.years")}`}
          tone="warning"
        />
      </div>

      {/* Tabs */}
      <div className="mb-5 overflow-x-auto">
        <div className="inline-flex min-w-full items-center gap-1 rounded-2xl border border-border bg-card p-1 shadow-[var(--shadow-card)]">
          {tabs.map((tb) => {
            const active = tab === tb.key;
            return (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-semibold transition lg:text-sm ${
                  active
                    ? "text-primary-foreground shadow-[var(--shadow-glow)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={active ? { background: "var(--gradient-primary)" } : undefined}
              >
                <tb.Icon className="h-4 w-4" />
                {t(tb.label)}
                {tb.count != null && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active ? "bg-card/20" : "bg-muted"
                    }`}
                  >
                    {tb.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <Overview
          company={company}
          onSaveContact={handleSaveContact}
          onToggleFeePaid={isAdmin ? handleToggleFeePaid : undefined}
          submittingFee={submittingFee}
        />
      )}
      {tab === "activity" && <ActivityTab entries={history.activities} />}
      {tab === "events" && <EventsTab entries={history.events} />}
      {tab === "payments" && <PaymentsTab entries={history.payments} />}

      {/* Send Email Modal */}
      <SendEmailModal
        open={openEmail}
        onClose={() => setOpenEmail(false)}
        recipientName={company.name}
        recipientEmail={company.email}
      />

      {/* Edit Company Modal */}
      <CrudModal
        open={editingCompany}
        title="Chỉnh sửa thông tin doanh nghiệp"
        fields={fields}
        initial={editInitial(company)}
        submitting={submittingEdit}
        submitLabel={t("common.save") || "Lưu thay đổi"}
        cancelLabel={t("common.cancel") || "Hủy"}
        onSubmit={handleSaveCompany}
        onClose={() => setEditingCompany(false)}
      />
    </AppShell>
  );
}

function Kpi({
  Icon,
  label,
  value,
  tone,
}: {
  Icon: typeof Activity;
  label: string;
  value: string;
  tone: "primary" | "success" | "info" | "warning";
}) {
  const map = {
    primary: { bg: "bg-primary/10", text: "text-primary" },
    success: { bg: "bg-success/10", text: "text-success" },
    info: { bg: "bg-info/10", text: "text-info" },
    warning: { bg: "bg-warning/15", text: "text-[oklch(0.55_0.16_65)]" },
  } as const;
  const c = map[tone];
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.bg}`}>
          <Icon className={`h-5 w-5 ${c.text}`} />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="truncate text-lg font-bold text-foreground">{value}</div>
        </div>
      </div>
    </div>
  );
}

function Overview({
  company,
  onSaveContact,
  onToggleFeePaid,
  submittingFee,
}: {
  company: Member;
  onSaveContact: (next: { email: string; phone: string; address: string }) => void;
  onToggleFeePaid?: () => void;
  submittingFee?: boolean;
}) {
  const t = useT();
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <Section title={t("detail.about")}>
          <p className="py-2 text-sm leading-relaxed text-foreground">{company.about}</p>
        </Section>
        <Section title={t("detail.companyInfo")}>
          <InfoRow icon={Briefcase} label={t("detail.industry")} value={t(company.industry)} />
          <InfoRow icon={ShieldCheck} label={t("detail.level")} value={t(company.level)} />
          {company.taxCode && (
            <InfoRow icon={Hash} label={t("detail.taxCode")} value={company.taxCode} />
          )}
          {company.website && (
            <InfoRow
              icon={Globe}
              label={t("detail.website")}
              value={
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {company.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
              }
            />
          )}
          {company.employees != null && (
            <InfoRow
              icon={Users}
              label={t("detail.employees")}
              value={company.employees.toLocaleString("vi-VN")}
            />
          )}
          <InfoRow icon={Calendar} label={t("detail.joined")} value={fmtDate(company.joinedAt)} />
        </Section>
      </div>
      <div className="space-y-5">
        <ContactSection company={company} onSave={onSaveContact} />

        <Section title={t("detail.fee")}>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    company.feePaid
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {company.feePaid ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {t("detail.feeYear")} {company.feeYear}
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {company.feePaid ? t("detail.feePaid") : t("detail.feeUnpaid")}
                  </div>
                </div>
              </div>
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </div>

            {onToggleFeePaid && (
              <button
                type="button"
                disabled={submittingFee}
                onClick={onToggleFeePaid}
                className={`mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  company.feePaid
                    ? "bg-secondary text-secondary-foreground hover:bg-destructive/15 hover:text-destructive"
                    : "bg-success text-white hover:bg-success/90"
                }`}
              >
                {submittingFee
                  ? "Đang xử lý..."
                  : company.feePaid
                    ? "Đổi sang Chưa nộp"
                    : "Xác nhận đã đóng phí"}
              </button>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <h3 className="mb-3 text-base font-semibold text-foreground">{title}</h3>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 break-words text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}

const contactSchema = z.object({
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(32),
  address: z.string().trim().min(3).max(255),
});

function ContactSection({
  company,
  onSave,
}: {
  company: Member;
  onSave: (next: { email: string; phone: string; address: string }) => void;
}) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    email: company.email,
    phone: company.phone,
    address: company.address,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const start = () => {
    setForm({ email: company.email, phone: company.phone, address: company.address });
    setErrors({});
    setEditing(true);
  };
  const cancel = () => {
    setEditing(false);
    setErrors({});
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errs[issue.path[0] as string] = issue.message;
      }
      setErrors(errs);
      return;
    }
    onSave(parsed.data);
    setEditing(false);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-foreground">{t("detail.contactInfo")}</h3>
        {!editing && (
          <button
            onClick={start}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <Edit3 className="h-3.5 w-3.5" />
            {t("cdetail.editContact")}
          </button>
        )}
      </div>
      {!editing ? (
        <div className="divide-y divide-border">
          <InfoRow icon={Users} label={t("detail.contactPerson")} value={company.contact} />
          <InfoRow
            icon={Mail}
            label={t("detail.email")}
            value={
              <a href={`mailto:${company.email}`} className="text-primary hover:underline">
                {company.email}
              </a>
            }
          />
          <InfoRow icon={Phone} label={t("detail.phone")} value={company.phone} />
          <InfoRow icon={MapPin} label={t("detail.address")} value={company.address} />
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <Field
            icon={Mail}
            label={t("detail.email")}
            value={form.email}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            type="email"
            error={errors.email}
            maxLength={255}
            placeholder="company@example.com"
          />
          <Field
            icon={Phone}
            label={t("detail.phone")}
            value={form.phone}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            error={errors.phone}
            maxLength={32}
            placeholder="Ví dụ: +84 901 234 567"
          />
          <Field
            icon={MapPin}
            label={t("detail.address")}
            value={form.address}
            onChange={(v) => setForm((f) => ({ ...f, address: v }))}
            error={errors.address}
            maxLength={255}
            multiline
            placeholder="Nhập địa chỉ đầy đủ của doanh nghiệp..."
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={cancel}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
            >
              {t("cdetail.cancel")}
            </button>
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
              style={{ background: "var(--gradient-primary)" }}
            >
              {t("cdetail.save")}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  type = "text",
  error,
  maxLength,
  multiline,
  placeholder,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
  maxLength?: number;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          rows={2}
          className={`w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/30 ${
            error ? "border-destructive" : "border-border"
          }`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          className={`h-9 w-full rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/30 ${
            error ? "border-destructive" : "border-border"
          }`}
        />
      )}
      {error && <span className="mt-1 block text-[11px] text-destructive">{error}</span>}
    </label>
  );
}

function ActivityTab({ entries }: { entries: CompanyHistory["activities"] }) {
  const t = useT();
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <h3 className="mb-4 text-base font-semibold text-foreground">
        {t("cdetail.activity.title")}
      </h3>
      <ol className="relative space-y-5 border-l-2 border-border pl-6">
        {entries.map((a: any) => {
          const st = ACT_STYLE[a.type as ActivityType];
          return (
            <li key={a.id} className="relative">
              <span
                className={`absolute -left-[34px] top-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card ${st.bg} ${st.text}`}
              >
                <st.Icon className="h-4 w-4" />
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${st.bg} ${st.text}`}
                >
                  {t(ACTIVITY_LABEL[a.type as ActivityType])}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {fmtDate(a.date, true)} · {relativeDate(a.date)}
                </span>
              </div>
              <h4 className="mt-1 text-sm font-semibold text-foreground">{a.title}</h4>
              {a.detail && (
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{a.detail}</p>
              )}
              <div className="mt-1 text-[11px] text-muted-foreground">— {a.by}</div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function EventsTab({ entries }: { entries: CompanyHistory["events"] }) {
  const t = useT();
  return (
    <section className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="border-b border-border p-5">
        <h3 className="text-base font-semibold text-foreground">{t("cdetail.events.title")}</h3>
      </div>
      <div className="divide-y divide-border">
        {entries.map((e: any) => (
          <div
            key={e.id}
            className="flex flex-wrap items-center justify-between gap-3 p-4 transition hover:bg-muted/30"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                <span className="text-[10px] font-semibold uppercase">
                  {new Date(e.date).toLocaleDateString("vi-VN", { month: "short" })}
                </span>
                <span className="text-base font-bold leading-none">
                  {new Date(e.date).getDate()}
                </span>
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-foreground">{e.name}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {fmtDate(e.date)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" /> {e.attendees.toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${ROLE_STYLE[e.role as EventRole]}`}
              >
                {t(EVENT_ROLE_LABEL[e.role as EventRole])}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  e.checkedIn ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                }`}
              >
                {e.checkedIn ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {t("cdetail.checkin")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PaymentsTab({ entries }: { entries: CompanyHistory["payments"] }) {
  const t = useT();
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-border p-5">
        <h3 className="text-base font-semibold text-foreground">{t("cdetail.payments.title")}</h3>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">
          <Download className="h-3.5 w-3.5" /> {t("members.export")}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">{t("cdetail.invoice")}</th>
              <th className="px-4 py-3 font-semibold">{t("cdetail.date")}</th>
              <th className="px-4 py-3 font-semibold">{t("detail.about")}</th>
              <th className="px-4 py-3 font-semibold">{t("cdetail.method")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("cdetail.amount")}</th>
              <th className="px-4 py-3 font-semibold">{t("cdetail.status")}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((p) => (
              <tr key={p.id} className="border-t border-border transition hover:bg-muted/30">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-foreground">
                  {p.invoice}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {fmtDate(p.date)}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{p.description}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t(PAY_KIND_LABEL[p.kind])}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-foreground">
                  {t(PAY_METHOD_LABEL[p.method])}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-foreground">
                  {formatVND(p.amount)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${PAY_STATUS_STYLE[p.status]}`}
                  >
                    {t(PAY_STATUS_LABEL[p.status])}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
