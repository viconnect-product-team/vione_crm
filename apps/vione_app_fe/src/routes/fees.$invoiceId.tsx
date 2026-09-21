import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Printer,
  Send,
  ShieldCheck,
  Trash2,
  User,
  Wallet,
  AlertTriangle,
  Banknote,
  BadgeCheck,
  Bell,
  CreditCard,
  Hourglass,
  Smartphone,
  Receipt,
} from "lucide-react";
import type { ReactNode } from "react";
import { AppShell } from "@/components/dashboard/AppShell";
import { ErrorState } from "@/components/dashboard/StateKit";
import { useRole } from "@/hooks/use-role";
import { useT, type TKey } from "@/lib/i18n";
import {
  formatVnd,
  type FeeRecord,
  type FeeStatus,
  type ReminderChannel,
  type ReminderEntry,
} from "@/lib/fees-data";
import {
  addReminderFn,
  deleteInvoiceFn,
  getInvoiceFn,
  markInvoicePaidFn,
  updateInvoiceMethodFn,
} from "@/lib/fees.functions";

export const Route = createFileRoute("/fees/$invoiceId")({
  ssr: false,
  loader: async ({ params }) => {
    const result = await getInvoiceFn({ data: { id: params.invoiceId } });
    if (!result) throw notFound();
    return result;
  },
  component: InvoiceDetailPage,
  notFoundComponent: NotFound,
  errorComponent: InvoiceError,
});

function NotFound() {
  const t = useT();
  return (
    <AppShell>
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
        <h2 className="mb-2 text-xl font-bold text-foreground">404</h2>
        <p className="mb-6 text-sm text-muted-foreground">{t("invoice.notFound")}</p>
        <Link
          to="/fees"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("invoice.back")}
        </Link>
      </div>
    </AppShell>
  );
}

function InvoiceError({ reset }: { error: Error; reset: () => void }) {
  const t = useT();
  const router = useRouter();
  return (
    <AppShell>
      <ErrorState
        title={t("invoice.loadError")}
        onRetry={() => {
          reset();
          router.invalidate();
        }}
      />
    </AppShell>
  );
}

const statusMeta: Record<FeeStatus, { label: TKey; bg: string; fg: string; icon: typeof Clock }> = {
  paid: {
    label: "fees.status.paid",
    bg: "oklch(0.93 0.07 155)",
    fg: "oklch(0.40 0.16 155)",
    icon: CheckCircle2,
  },
  unpaid: {
    label: "fees.status.unpaid",
    bg: "oklch(0.94 0.09 75)",
    fg: "oklch(0.45 0.14 65)",
    icon: Clock,
  },
  overdue: {
    label: "fees.status.overdue",
    bg: "oklch(0.93 0.06 25)",
    fg: "oklch(0.50 0.20 25)",
    icon: AlertTriangle,
  },
};

const channelIcon: Record<ReminderChannel, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  call: Phone,
  zalo: MessageSquare,
};

function StatusPill({ status }: { status: FeeStatus }) {
  const t = useT();
  const m = statusMeta[status];
  const Icon = m.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ background: m.bg, color: m.fg }}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {t(m.label)}
    </span>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof User; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden="true" />
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

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "neutral",
}: {
  icon: typeof Wallet;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "primary";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-secondary text-muted-foreground",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
    primary: "bg-primary/10 text-primary",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-2 text-lg font-bold text-foreground tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

const DUE_SOON_DAYS = 14;

function InvoiceDetailPage() {
  const t = useT();
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const { invoice: initial, reminders: initialReminders } = Route.useLoaderData() as {
    invoice: FeeRecord;
    reminders: ReminderEntry[];
  };
  const addReminder = useServerFn(addReminderFn);
  const markInvoicePaid = useServerFn(markInvoicePaidFn);
  const updateInvoiceMethod = useServerFn(updateInvoiceMethodFn);
  const deleteInvoice = useServerFn(deleteInvoiceFn);
  const [invoice, setInvoice] = useState<FeeRecord>(initial);
  const [reminders, setReminders] = useState<ReminderEntry[]>(initialReminders);
  const [payOpen, setPayOpen] = useState(false);
  const [payMode, setPayMode] = useState<"pay" | "change">("pay");
  const [deleting, setDeleting] = useState(false);
  const [payMethod, setPayMethod] = useState<NonNullable<FeeRecord["method"]>>(
    initial.method ?? "bank",
  );

  const m = invoice.member;

  const openPay = () => {
    setPayMode("pay");
    setPayMethod(invoice.method ?? "bank");
    setPayOpen(true);
  };

  const openChangeMethod = () => {
    setPayMode("change");
    setPayMethod(invoice.method ?? "bank");
    setPayOpen(true);
  };

  const handleRemind = async (channel: ReminderChannel) => {
    const entry = await addReminder({ data: { invoiceId: invoice.id, channel } });
    setReminders((prev) => [entry, ...prev]);
    toast.success(t(`invoice.channel.${channel}` as TKey));
  };

  const handleConfirm = async () => {
    const updated =
      payMode === "pay"
        ? await markInvoicePaid({ data: { id: invoice.id, method: payMethod } })
        : await updateInvoiceMethod({ data: { id: invoice.id, method: payMethod } });
    if (updated) {
      setInvoice({ ...updated });
      toast.success(payMode === "pay" ? t("invoice.markPaidSuccess") : t("invoice.methodUpdated"));
    }
    setPayOpen(false);
  };

  const handleDelete = async () => {
    if (!confirm(t("invoice.deleteConfirm"))) return;
    setDeleting(true);
    try {
      await deleteInvoice({ data: { id: invoice.id } });
      toast.success(t("invoice.deleted"));
      navigate({ to: "/fees" });
    } catch {
      setDeleting(false);
    }
  };

  const due = new Date(invoice.dueDate);
  const dayMs = 86400000;
  const daysDelta = Math.ceil((due.getTime() - Date.now()) / dayMs);
  const daysOverdue = Math.max(0, -daysDelta);
  const isPaid = invoice.status === "paid";
  const isOverdue = invoice.status === "overdue";
  const isDueSoon = !isPaid && !isOverdue && daysDelta >= 0 && daysDelta <= DUE_SOON_DAYS;

  const timelineValue = isPaid
    ? t("fees.status.paid")
    : isOverdue
      ? `${daysOverdue} ${t("invoice.days")}`
      : daysDelta === 0
        ? t("invoice.dueToday")
        : `${daysDelta} ${t("invoice.days")}`;
  const timelineHint = isPaid
    ? undefined
    : isOverdue
      ? t("invoice.overdueBy")
      : t("invoice.daysRemaining");

  return (
    <AppShell>
      <Link
        to="/fees"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("invoice.back")}
      </Link>

      {/* Header card */}
      <div
        className="relative mb-5 overflow-hidden rounded-2xl border border-border p-6 shadow-[var(--shadow-card)]"
        style={{ background: "var(--gradient-card)" }}
      >
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-card/15 text-primary-foreground backdrop-blur">
            <Receipt className="h-8 w-8" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1 text-primary-foreground">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-card/15 px-2.5 py-0.5 font-mono text-[11px] font-semibold backdrop-blur">
                {invoice.invoiceNo}
              </span>
              {isOverdue && (
                <span className="inline-flex items-center gap-1 rounded-full bg-card/20 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur">
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                  {t("fees.badge.overdue")}
                </span>
              )}
              {isDueSoon && (
                <span className="inline-flex items-center gap-1 rounded-full bg-card/20 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur">
                  <Hourglass className="h-3 w-3" aria-hidden="true" />
                  {t("fees.badge.dueSoon")}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{m.name}</h2>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-primary-foreground/85">
              <span className="font-mono">{m.code}</span>
              <span aria-hidden="true">·</span>
              <span>
                {t("invoice.title")} {invoice.year}
              </span>
            </div>
            <div className="mt-2 text-3xl font-extrabold tracking-tight">
              {formatVnd(invoice.amount)}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusPill status={invoice.status} />
            <div className="hidden flex-wrap justify-end gap-2 sm:flex">
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-card/15 px-3 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur hover:bg-card/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                {t("invoice.print")}
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-card/15 px-3 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur hover:bg-card/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                PDF
              </button>
              {isAdmin && !isPaid && (
                <button
                  onClick={openPay}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 text-xs font-semibold text-primary hover:bg-card/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("invoice.markPaid")}
                </button>
              )}
              {isAdmin && isPaid && (
                <button
                  onClick={openChangeMethod}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-card/15 px-3 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur hover:bg-card/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("invoice.changeMethod")}
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-card/15 px-3 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur hover:bg-card/25 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("invoice.delete")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <SummaryCard
          icon={Wallet}
          tone="primary"
          label={t("invoice.card.amount")}
          value={formatVnd(invoice.amount)}
        />
        <SummaryCard
          icon={isPaid ? BadgeCheck : isOverdue ? AlertTriangle : Clock}
          tone={isPaid ? "success" : isOverdue ? "danger" : "warning"}
          label={t("invoice.card.status")}
          value={t(statusMeta[invoice.status].label)}
        />
        <SummaryCard
          icon={Calendar}
          label={t("invoice.card.dueDate")}
          value={due.toLocaleDateString("vi-VN")}
        />
        <SummaryCard
          icon={Hourglass}
          tone={isOverdue ? "danger" : isDueSoon ? "warning" : "neutral"}
          label={t("invoice.card.timeline")}
          value={timelineValue}
          hint={timelineHint}
        />
        <SummaryCard
          icon={Bell}
          label={t("invoice.card.reminders")}
          value={`${reminders.length} ${t("invoice.reminderCountUnit")}`}
          hint={invoice.method ? t(`fees.method.${invoice.method}` as TKey) : undefined}
        />
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-5 pb-24 lg:grid-cols-3 lg:pb-0">
        <div className="space-y-5 lg:col-span-2">
          {/* Member info */}
          <Section
            title={t("invoice.memberInfo")}
            action={
              <Link
                to="/companies/$companyId"
                params={{ companyId: m.id }}
                className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                {t("invoice.viewProfile")} →
              </Link>
            }
          >
            <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
              <Row icon={Building2} label={t("invoice.memberName")} value={m.name} />
              <Row
                icon={ShieldCheck}
                label={t("invoice.memberCode")}
                value={<span className="font-mono">{m.code}</span>}
              />
              <Row icon={ShieldCheck} label={t("detail.level")} value={t(m.level)} />
              <Row icon={User} label={t("detail.contactPerson")} value={m.contact} />
              <Row
                icon={Mail}
                label={t("detail.email")}
                value={
                  <a
                    href={`mailto:${m.email}`}
                    className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    {m.email}
                  </a>
                }
              />
              <Row icon={Phone} label={t("detail.phone")} value={m.phone} />
              <Row icon={MapPin} label={t("detail.address")} value={m.address} />
            </div>
          </Section>

          {/* Period & status */}
          <Section title={t("invoice.period")}>
            <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
              <Row icon={Calendar} label={t("invoice.year")} value={`${invoice.year}`} />
              <Row icon={Clock} label={t("fees.col.due")} value={due.toLocaleDateString("vi-VN")} />
              <Row
                icon={CheckCircle2}
                label={t("fees.col.paid")}
                value={invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString("vi-VN") : "—"}
              />
              <Row
                icon={Wallet}
                label={t("invoice.method")}
                value={invoice.method ? t(`fees.method.${invoice.method}` as TKey) : "—"}
              />
            </div>
            {isOverdue && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                {t("invoice.overdueBy")} {daysOverdue} {t("invoice.days")}
              </div>
            )}
          </Section>

          {/* Payment info */}
          <Section title={t("invoice.paymentInfo")}>
            <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
              <Row
                icon={BadgeCheck}
                label={t("fees.col.status")}
                value={t(statusMeta[invoice.status].label)}
              />
              <Row
                icon={Wallet}
                label={t("invoice.paymentDate")}
                value={
                  invoice.paidAt
                    ? new Date(invoice.paidAt).toLocaleDateString("vi-VN")
                    : t("invoice.notPaidYet")
                }
              />
              <Row
                icon={Banknote}
                label={t("invoice.method")}
                value={invoice.method ? t(`fees.method.${invoice.method}` as TKey) : "—"}
              />
              <Row
                icon={Receipt}
                label={t("invoice.total")}
                value={
                  <span className="font-semibold text-primary">{formatVnd(invoice.amount)}</span>
                }
              />
            </div>
          </Section>

          {/* Reminder history */}
          <Section
            title={t("invoice.reminderHistory")}
            action={
              isAdmin && !isPaid ? (
                <div className="flex items-center gap-1">
                  {(["email", "sms", "zalo", "call"] as ReminderChannel[]).map((c: any) => {
                    const Icon = channelIcon[c as ReminderChannel];
                    return (
                      <button
                        key={c}
                        onClick={() => handleRemind(c)}
                        title={t(`invoice.channel.${c}` as TKey)}
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2 text-[11px] font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        {t(`invoice.channel.${c}` as TKey)}
                      </button>
                    );
                  })}
                </div>
              ) : undefined
            }
          >
            {reminders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("invoice.noReminders")}
              </p>
            ) : (
              <ol className="relative space-y-4 border-l border-border pl-5">
                {reminders.map((r: any) => {
                  const Icon = channelIcon[r.channel as ReminderChannel];
                  return (
                    <li key={r.id} className="relative">
                      <span className="absolute -left-[26px] flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-card">
                        <Icon className="h-3 w-3" aria-hidden="true" />
                      </span>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-foreground">
                          {t(`invoice.channel.${r.channel}` as TKey)}
                          {r.note && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              · {r.note}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {new Date(r.sentAt).toLocaleString("vi-VN")}
                        </div>
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {t("invoice.by")} {r.by}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Section>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Section title={t("invoice.summary")}>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("fees.col.amount")}</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {formatVnd(invoice.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("invoice.tax")}</span>
                <span className="font-semibold text-foreground tabular-nums">{formatVnd(0)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <span className="font-semibold text-foreground">{t("invoice.total")}</span>
                <span className="text-base font-bold text-primary tabular-nums">
                  {formatVnd(invoice.amount)}
                </span>
              </div>
            </div>
          </Section>

          <Section title={t("invoice.quickActions")}>
            <div className="space-y-2">
              {isAdmin && !isPaid && (
                <button
                  onClick={openPay}
                  className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {t("invoice.markPaid")}
                </button>
              )}
              {isAdmin && isPaid && (
                <button
                  onClick={openChangeMethod}
                  className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Wallet className="h-4 w-4" aria-hidden="true" />
                  {t("invoice.changeMethod")}
                </button>
              )}
              {isAdmin && !isPaid && (
                <button
                  onClick={() => handleRemind("email")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {t("invoice.sendReminder")}
                </button>
              )}
              <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Download className="h-4 w-4" aria-hidden="true" />
                {t("invoice.downloadPdf")}
              </button>
              {isAdmin && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-background px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  {t("invoice.delete")}
                </button>
              )}
            </div>
          </Section>
        </div>
      </div>

      {/* Sticky mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-border bg-card/95 p-3 backdrop-blur lg:hidden">
        {isAdmin && !isPaid ? (
          <button
            onClick={openPay}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            style={{ background: "var(--gradient-primary)" }}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {t("invoice.markPaid")}
          </button>
        ) : (
          <button
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            PDF
          </button>
        )}
        {isAdmin && !isPaid && (
          <button
            onClick={() => handleRemind("email")}
            aria-label={t("invoice.sendReminder")}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        <button
          aria-label={t("invoice.print")}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Pay dialog */}
      {payOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
          onClick={() => setPayOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-lg font-bold text-foreground">
              {payMode === "pay" ? t("invoice.markPaid") : t("invoice.updateMethodTitle")}
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">{t("invoice.choosePaymentMethod")}</p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { k: "bank", icon: Banknote },
                  { k: "card", icon: CreditCard },
                  { k: "cash", icon: Wallet },
                  { k: "ewallet", icon: Smartphone },
                ] as { k: NonNullable<FeeRecord["method"]>; icon: typeof Wallet }[]
              ).map(({ k, icon: Icon }) => (
                <button
                  key={k}
                  onClick={() => setPayMethod(k)}
                  aria-pressed={payMethod === k}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    payMethod === k
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {t(`fees.method.${k}` as TKey)}
                </button>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setPayOpen(false)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("invoice.cancel")}
              </button>
              <button
                onClick={handleConfirm}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                style={{ background: "var(--gradient-primary)" }}
              >
                {t("invoice.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
