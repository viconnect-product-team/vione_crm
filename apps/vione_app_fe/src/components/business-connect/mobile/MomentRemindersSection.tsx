// BC-Mobile-7F — Danh sách nhắc nhở của một khoảnh khắc đã lưu.
//
// Hiển thị + tạo + đánh dấu xong + xoá. Mọi thao tác đi qua RPC có xác thực;
// thất bại luôn hiện lỗi tại chỗ, không im lặng.

import { useCallback, useEffect, useState } from "react";
import { BellRing, Check, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLang, useT, type TKey } from "@/lib/i18n";
import {
  bcMobileMomentReminderCreateFn,
  bcMobileMomentReminderDeleteFn,
  bcMobileMomentReminderSetStatusFn,
  bcMobileMomentRemindersFn,
} from "@/lib/business-connect/mobile/moment-reminder.functions";
import {
  MOMENT_REMINDER_MAX_LABEL_LEN,
  type BcMobileMomentReminder,
} from "@/lib/business-connect/mobile/moment-reminder.types";
import { defaultReminderAt, toLocalInputValue } from "./MomentReminderPicker";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)]";

function formatWhen(iso: string, locale: string) {
  const d = new Date(iso);
  return d.toLocaleString(locale === "en" ? "en-GB" : "vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MomentRemindersSection({ momentId }: { momentId: string }) {
  const t = useT();
  const { lang } = useLang();
  const [items, setItems] = useState<BcMobileMomentReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<TKey | null>(null);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [at, setAt] = useState(() => defaultReminderAt(7));
  const [label, setLabel] = useState("");
  const [showDone, setShowDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bcMobileMomentRemindersFn({
        data: { momentId, includeDone: showDone, limit: 20 },
      });
      if (!res.ok) {
        setErrorKey(`bc.mobile.moment.reminder.error.${res.error}` as TKey);
        return;
      }
      setErrorKey(null);
      setItems(res.reminders);
    } catch {
      setErrorKey("bc.mobile.moment.reminder.error.unavailable");
    } finally {
      setLoading(false);
    }
  }, [momentId, showDone]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    if (!at) return;
    setSaving(true);
    try {
      const res = await bcMobileMomentReminderCreateFn({
        data: {
          momentId,
          remindAt: new Date(at).toISOString(),
          label: label.trim() || null,
        },
      });
      if (!res.ok) {
        setErrorKey(`bc.mobile.moment.reminder.error.${res.error}` as TKey);
        return;
      }
      setErrorKey(null);
      setAdding(false);
      setLabel("");
      setAt(defaultReminderAt(7));
      toast.success(t("bc.mobile.moment.reminder.created"));
      await load();
    } catch {
      setErrorKey("bc.mobile.moment.reminder.error.unavailable");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(r: BcMobileMomentReminder, status: "pending" | "done") {
    setBusyId(r.id);
    try {
      const res = await bcMobileMomentReminderSetStatusFn({
        data: { reminderId: r.id, status },
      });
      if (!res.ok) {
        setErrorKey(`bc.mobile.moment.reminder.error.${res.error}` as TKey);
        return;
      }
      setErrorKey(null);
      await load();
    } catch {
      setErrorKey("bc.mobile.moment.reminder.error.unavailable");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(r: BcMobileMomentReminder) {
    setBusyId(r.id);
    try {
      const res = await bcMobileMomentReminderDeleteFn({ data: { reminderId: r.id } });
      if (!res.ok) {
        setErrorKey(`bc.mobile.moment.reminder.error.${res.error}` as TKey);
        return;
      }
      setErrorKey(null);
      toast.success(t("bc.mobile.moment.reminder.deleted"));
      setItems((prev) => prev.filter((x: any) => x.id !== r.id));
    } catch {
      setErrorKey("bc.mobile.moment.reminder.error.unavailable");
    } finally {
      setBusyId(null);
    }
  }

  const now = Date.now();

  return (
    <section className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3.5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold text-[var(--bc-mobile-text)]">
          <BellRing aria-hidden="true" className="h-4 w-4 text-[var(--bc-mobile-accent)]" />
          {t("bc.mobile.moment.reminder.sectionTitle")}
        </h3>
        <label className="flex items-center gap-1.5 text-[12.5px] text-[var(--bc-mobile-muted)]">
          <input
            type="checkbox"
            checked={showDone}
            onChange={(e) => setShowDone(e.target.checked)}
            className="h-4 w-4 accent-[var(--bc-mobile-accent)]"
          />
          {t("bc.mobile.moment.reminder.showDone")}
        </label>
      </div>

      {loading ? (
        <p className="mt-3 flex items-center gap-2 text-[13px] text-[var(--bc-mobile-muted)]">
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />
          {t("bc.mobile.moment.reminder.sectionTitle")}
        </p>
      ) : items.length === 0 ? (
        <p className="mt-3 text-[13px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.moment.reminder.empty")}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((r: any) => {
            const overdue = r.status === "pending" && Date.parse(r.remindAt) < now;
            return (
              <li
                key={r.id}
                className="flex items-start gap-2.5 rounded-xl bg-[var(--bc-mobile-surface-2)] px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[14px] ${r.status === "done" ? "text-[var(--bc-mobile-muted)] line-through" : "text-[var(--bc-mobile-text)]"}`}
                  >
                    {r.label ?? t("bc.mobile.moment.reminder.title")}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-[var(--bc-mobile-muted)]">
                    {formatWhen(r.remindAt, lang)}
                    {overdue ? ` · ${t("bc.mobile.moment.reminder.overdue")}` : ""}
                    {r.status === "done" ? ` · ${t("bc.mobile.moment.reminder.done")}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => void setStatus(r, r.status === "done" ? "pending" : "done")}
                  aria-label={t(
                    r.status === "done"
                      ? "bc.mobile.moment.reminder.reopen"
                      : "bc.mobile.moment.reminder.markDone",
                  )}
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--bc-mobile-accent)] hover:bg-[var(--bc-mobile-surface)] disabled:opacity-60 ${FOCUS}`}
                >
                  {r.status === "done" ? (
                    <RotateCcw aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <Check aria-hidden="true" className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => void remove(r)}
                  aria-label={t("bc.mobile.moment.reminder.delete")}
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--bc-mobile-muted)] hover:bg-[var(--bc-mobile-surface)] disabled:opacity-60 ${FOCUS}`}
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {adding ? (
        <div className="mt-3 space-y-2.5">
          <input
            type="datetime-local"
            value={at}
            min={toLocalInputValue(new Date())}
            onChange={(e) => setAt(e.target.value)}
            aria-label={t("bc.mobile.moment.reminder.at")}
            className="w-full rounded-xl border border-[var(--bc-mobile-border)] bg-transparent px-3 py-2.5 text-[15px] text-[var(--bc-mobile-text)] outline-none focus:border-[var(--bc-mobile-accent)]"
          />
          <input
            type="text"
            value={label}
            maxLength={MOMENT_REMINDER_MAX_LABEL_LEN}
            onChange={(e) => setLabel(e.target.value)}
            aria-label={t("bc.mobile.moment.reminder.label")}
            placeholder={t("bc.mobile.moment.reminder.label.placeholder")}
            className="w-full rounded-xl border border-[var(--bc-mobile-border)] bg-transparent px-3 py-2.5 text-[15px] text-[var(--bc-mobile-text)] outline-none placeholder:text-[var(--bc-mobile-muted)] focus:border-[var(--bc-mobile-accent)]"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void create()}
              disabled={saving}
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bc-cta-gold px-4 text-[14.5px] font-semibold disabled:opacity-60 ${FOCUS}`}
            >
              {saving ? (
                <Loader2
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin motion-reduce:animate-none"
                />
              ) : null}
              {t("bc.mobile.moment.reminder.save")}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              disabled={saving}
              className={`min-h-11 rounded-xl border border-[var(--bc-mobile-border)] px-4 text-[14.5px] font-medium text-[var(--bc-mobile-text-2)] disabled:opacity-60 ${FOCUS}`}
            >
              {t("bc.mobile.moment.reminder.cancel")}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className={`mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--bc-mobile-border-gold)] text-[14.5px] font-semibold text-[var(--bc-mobile-accent)] ${FOCUS}`}
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          {t("bc.mobile.moment.reminder.add")}
        </button>
      )}

      {errorKey ? (
        <p role="alert" className="mt-2 text-[12.5px] text-[#b91c1c]">
          {t(errorKey)}
        </p>
      ) : null}
    </section>
  );
}
