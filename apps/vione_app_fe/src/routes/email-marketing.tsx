import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, MousePointerClick, Plus, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/AppShell";
import { PageHeader, Pill, StatCard, TableShell } from "@/components/dashboard/PageKit";
import {
  listCampaignsFn,
  createCampaignFn,
  deleteCampaignFn,
  type Campaign,
} from "@/lib/campaigns.functions";
import { useFmt, useT, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/email-marketing")({
  ssr: false,
  loader: () => listCampaignsFn(),
  component: EmailPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </div>
  ),
});

const STATUS_KEY: Record<Campaign["status"], TKey> = {
  sent: "notif.status.sent",
  scheduled: "notif.status.scheduled",
  draft: "notif.status.draft",
};
const STATUS_COLOR: Record<Campaign["status"], "success" | "info" | "neutral"> = {
  sent: "success",
  scheduled: "info",
  draft: "neutral",
};

function EmailPage() {
  const t = useT();
  const fmt = useFmt();
  const router = useRouter();
  const CAMPAIGNS = Route.useLoaderData() as Campaign[];
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const deleteFn = useServerFn(deleteCampaignFn);
  const sent = CAMPAIGNS.filter((c) => c.status === "sent");
  const totalSent = sent.reduce((s, c) => s + c.sent, 0);
  const totalOpen = sent.reduce((s, c) => s + c.opened, 0);
  const totalClick = sent.reduce((s, c) => s + c.clicked, 0);
  const openRate = totalSent > 0 ? Math.round((totalOpen / totalSent) * 100) : 0;
  const clickRate = totalSent > 0 ? Math.round((totalClick / totalSent) * 100) : 0;

  const onDelete = async (c: Campaign) => {
    if (!window.confirm(t("email.deleteConfirm"))) return;
    setBusyId(c.id);
    try {
      await deleteFn({ data: { id: c.id } });
      toast.success(t("email.deleted"));
      await router.invalidate();
    } catch (e) {
      toast.error(String((e as Error).message ?? e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title={t("email.title")}
        subtitle={t("email.subtitle")}
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Plus className="h-4 w-4" />
            {t("email.create")}
          </button>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("email.kpi.total")}
          value={CAMPAIGNS.length}
          icon={<Mail className="h-4 w-4" />}
        />
        <StatCard
          label={t("email.kpi.sent")}
          value={fmt.num(totalSent)}
          tone="success"
          icon={<Send className="h-4 w-4" />}
        />
        <StatCard
          label={t("email.kpi.openRate")}
          value={`${openRate}%`}
          tone="info"
          hint={`${fmt.num(totalOpen)} ${t("common.times")}`}
          icon={<Mail className="h-4 w-4" />}
        />
        <StatCard
          label={t("email.kpi.clickRate")}
          value={`${clickRate}%`}
          tone="primary"
          hint={`${fmt.num(totalClick)} ${t("common.times")}`}
          icon={<MousePointerClick className="h-4 w-4" />}
        />
      </div>

      <TableShell
        columns={[
          t("email.col.name"),
          t("email.col.audience"),
          t("email.col.sent"),
          t("email.col.open"),
          t("email.col.click"),
          t("email.col.time"),
          t("email.col.status"),
          t("email.col.actions"),
        ]}
      >
        {CAMPAIGNS.map((c: any) => (
          <tr key={c.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
            <td className="px-4 py-3">
              <div className="font-semibold text-foreground">{c.name}</div>
              <div className="text-[11px] text-muted-foreground">{c.subject}</div>
            </td>
            <td className="px-4 py-3 text-foreground">{c.audience}</td>
            <td className="px-4 py-3 text-foreground">{fmt.num(c.sent)}</td>
            <td className="px-4 py-3 text-foreground">
              {fmt.num(c.opened)}
              {c.sent > 0 && (
                <span className="ml-1 text-[11px] text-muted-foreground">
                  ({Math.round((c.opened / c.sent) * 100)}%)
                </span>
              )}
            </td>
            <td className="px-4 py-3 text-foreground">
              {fmt.num(c.clicked)}
              {c.sent > 0 && (
                <span className="ml-1 text-[11px] text-muted-foreground">
                  ({Math.round((c.clicked / c.sent) * 100)}%)
                </span>
              )}
            </td>
            <td className="px-4 py-3 text-muted-foreground">{fmt.date(c.sentAt)}</td>
            <td className="px-4 py-3">
              <Pill color={STATUS_COLOR[c.status as Campaign["status"]]}>{t(STATUS_KEY[c.status as Campaign["status"]])}</Pill>
            </td>
            <td className="px-4 py-3">
              <button
                onClick={() => onDelete(c)}
                disabled={busyId === c.id}
                title={t("email.deleted")}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </td>
          </tr>
        ))}
      </TableShell>

      {showCreate && (
        <CreateCampaignModal
          onClose={() => setShowCreate(false)}
          onDone={() => router.invalidate()}
        />
      )}
    </AppShell>
  );
}

function CreateCampaignModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const t = useT();
  const createFn = useServerFn(createCampaignFn);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [audience, setAudience] = useState("");
  const [status, setStatus] = useState<Campaign["status"]>("draft");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createFn({ data: { name, subject, audience, status, time } });
      toast.success(t("email.created"));
      onClose();
      await onDone();
    } catch (e) {
      toast.error(String((e as Error).message ?? e));
    } finally {
      setSaving(false);
    }
  };

  const field =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-elevated)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">{t("email.form.title")}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              {t("email.form.name")}
            </label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              {t("email.form.subject")}
            </label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={field} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              {t("email.form.audience")}
            </label>
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              {t("email.form.time")}
            </label>
            <input
              type="date"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              {t("email.form.status")}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Campaign["status"])}
              className={field}
            >
              <option value="draft">{t("notif.status.draft")}</option>
              <option value="scheduled">{t("notif.status.scheduled")}</option>
              <option value="sent">{t("notif.status.sent")}</option>
            </select>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={submit}
            disabled={saving || !name.trim()}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-50"
            style={{ background: "var(--gradient-primary)" }}
          >
            {t("email.form.create")}
          </button>
        </div>
      </div>
    </div>
  );
}
