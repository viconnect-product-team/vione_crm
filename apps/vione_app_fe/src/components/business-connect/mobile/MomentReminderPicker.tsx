// BC-Mobile-7F — Chọn nhắc nhở khi đang soạn khoảnh khắc.
//
// Không gọi máy chủ: chỉ trả về lựa chọn cho composer, nhắc nhở được tạo
// SAU KHI khoảnh khắc lưu thành công (không có khoảnh khắc thì không có
// nhắc nhở treo lơ lửng).

import { BellRing } from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";
import { MOMENT_REMINDER_MAX_LABEL_LEN } from "@/lib/business-connect/mobile/moment-reminder.types";

export type MomentReminderChoice = {
  enabled: boolean;
  /** giá trị của input datetime-local (giờ địa phương) */
  atLocal: string;
  label: string;
};

const PRESETS: { key: "d3" | "w1" | "w2"; days: number; labelKey: TKey }[] = [
  { key: "d3", days: 3, labelKey: "bc.mobile.moment.reminder.preset.d3" },
  { key: "w1", days: 7, labelKey: "bc.mobile.moment.reminder.preset.w1" },
  { key: "w2", days: 14, labelKey: "bc.mobile.moment.reminder.preset.w2" },
];

export function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function defaultReminderAt(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return toLocalInputValue(d);
}

export function MomentReminderPicker({
  value,
  onChange,
  disabled,
}: {
  value: MomentReminderChoice;
  onChange: (next: MomentReminderChoice) => void;
  disabled?: boolean;
}) {
  const t = useT();
  const minLocal = toLocalInputValue(new Date());

  return (
    <section className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3.5">
      <div className="flex items-start gap-3.5">
        <span
          aria-hidden="true"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-accent)]"
        >
          <BellRing className="h-5 w-5" strokeWidth={1.7} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="bc-moment-reminder-toggle"
              className="text-[14px] font-semibold text-[var(--bc-mobile-text)]"
            >
              {t("bc.mobile.moment.reminder.title")}
            </label>
            <input
              id="bc-moment-reminder-toggle"
              type="checkbox"
              checked={value.enabled}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  ...value,
                  enabled: e.target.checked,
                  atLocal: value.atLocal || defaultReminderAt(7),
                })
              }
              className="h-5 w-5 shrink-0 accent-[var(--bc-mobile-accent)]"
            />
          </div>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.moment.reminder.hint")}
          </p>
        </div>
      </div>

      {value.enabled ? (
        <div className="mt-3 space-y-2.5">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const preset = defaultReminderAt(p.days);
              const active = value.atLocal === preset;
              return (
                <button
                  key={p.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ ...value, atLocal: preset })}
                  aria-pressed={active}
                  className={`min-h-9 rounded-full border px-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] ${
                    active
                      ? "border-[var(--bc-mobile-border-gold)] bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-accent)]"
                      : "border-[var(--bc-mobile-border)] text-[var(--bc-mobile-text-2)]"
                  }`}
                >
                  {t(p.labelKey)}
                </button>
              );
            })}
          </div>
          <div>
            <label
              htmlFor="bc-moment-reminder-at"
              className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--bc-mobile-muted)]"
            >
              {t("bc.mobile.moment.reminder.at")}
            </label>
            <input
              id="bc-moment-reminder-at"
              type="datetime-local"
              value={value.atLocal}
              min={minLocal}
              disabled={disabled}
              onChange={(e) => onChange({ ...value, atLocal: e.target.value })}
              className="mt-1 w-full rounded-xl border border-[var(--bc-mobile-border)] bg-transparent px-3 py-2.5 text-[15px] text-[var(--bc-mobile-text)] outline-none focus:border-[var(--bc-mobile-accent)]"
            />
          </div>
          <div>
            <label
              htmlFor="bc-moment-reminder-label"
              className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--bc-mobile-muted)]"
            >
              {t("bc.mobile.moment.reminder.label")}
            </label>
            <input
              id="bc-moment-reminder-label"
              type="text"
              value={value.label}
              maxLength={MOMENT_REMINDER_MAX_LABEL_LEN}
              disabled={disabled}
              placeholder={t("bc.mobile.moment.reminder.label.placeholder")}
              onChange={(e) => onChange({ ...value, label: e.target.value })}
              className="mt-1 w-full rounded-xl border border-[var(--bc-mobile-border)] bg-transparent px-3 py-2.5 text-[15px] text-[var(--bc-mobile-text)] outline-none placeholder:text-[var(--bc-mobile-muted)] focus:border-[var(--bc-mobile-accent)]"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
