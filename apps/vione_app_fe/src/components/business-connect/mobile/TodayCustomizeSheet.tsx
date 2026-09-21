// BC-Mobile — Sheet tuỳ chỉnh thẻ HÔM NAY.
// Chỉ thay đổi cách hiển thị (loại nội dung, cách sắp xếp, số mục).
// Không tạo dữ liệu, không gọi backend, không đổi quyền xem.
import { Check, RotateCcw } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useT, type TKey } from "@/lib/i18n";
import type { BcMobileTodayKind } from "@/hooks/use-business-connect-home";
import {
  DEFAULT_TODAY_PREFERENCES,
  TODAY_KINDS,
  TODAY_MAX_CHOICES,
  type TodayOrderMode,
  type TodayPreferences,
} from "@/lib/business-connect/mobile/today-preferences";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)]";

const KIND_LABEL: Record<BcMobileTodayKind, TKey> = {
  meeting: "bc.mobile.home.today.kind.meeting",
  follow_up: "bc.mobile.home.today.kind.followUp",
  connection: "bc.mobile.home.today.kind.connection",
  introduction: "bc.mobile.home.today.kind.introduction",
  relationship: "bc.mobile.home.today.kind.relationship",
  calendar: "bc.mobile.home.today.kind.calendar",
};

export type TodayCustomizeSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefs: TodayPreferences;
  onChange: (next: TodayPreferences) => void;
  onReset: () => void;
};

export function TodayCustomizeSheet({
  open,
  onOpenChange,
  prefs,
  onChange,
  onReset,
}: TodayCustomizeSheetProps) {
  const t = useT();

  const toggleKind = (kind: BcMobileTodayKind) => {
    const has = prefs.kinds.includes(kind);
    // Luôn giữ ít nhất một loại để thẻ không bao giờ trống vì cấu hình.
    if (has && prefs.kinds.length === 1) return;
    const kinds = has ? prefs.kinds.filter((k) => k !== kind) : [...prefs.kinds, kind];
    onChange({ ...prefs, kinds: TODAY_KINDS.filter((k) => kinds.includes(k)) });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bc-app mx-auto w-full max-w-[480px] rounded-t-[var(--bc-mobile-radius-sheet)] border border-[#D8B282]/25 bg-[linear-gradient(165deg,rgba(10,16,25,0.98)_0%,rgba(7,12,19,0.98)_50%,rgba(4,8,14,0.99)_100%)] backdrop-blur-xl shadow-2xl">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-[17px] text-[var(--bc-mobile-text)]">
            {t("bc.mobile.home.today.customize.title")}
          </DrawerTitle>
          <DrawerDescription className="text-[13px] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.home.today.customize.description")}
          </DrawerDescription>
        </DrawerHeader>

        <div
          className="max-h-[80dvh] space-y-6 overflow-y-auto px-4"
          style={{ paddingBottom: "max(1.5rem, var(--bc-mobile-safe-bottom))" }}
        >
          <section aria-label={t("bc.mobile.home.today.customize.kinds")}>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.home.today.customize.kinds")}
            </h3>
            <ul className="mt-2 divide-y divide-[var(--bc-mobile-border)] overflow-hidden rounded-xl border border-[var(--bc-mobile-border)]">
              {TODAY_KINDS.map((kind) => {
                const active = prefs.kinds.includes(kind);
                return (
                  <li key={kind}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={active}
                      onClick={() => toggleKind(kind)}
                      className={`flex min-h-[48px] w-full items-center justify-between gap-3 px-3 text-left text-[15px] text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] ${FOCUS}`}
                    >
                      <span className="truncate">{t(KIND_LABEL[kind])}</span>
                      <span
                        aria-hidden="true"
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                          active
                            ? "border-transparent bg-[var(--bc-mobile-accent)] text-[var(--bc-mobile-navy)]"
                            : "border-[var(--bc-mobile-border)] text-transparent"
                        }`}
                      >
                        <Check className="h-4 w-4" strokeWidth={2.2} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-label={t("bc.mobile.home.today.customize.order")}>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.home.today.customize.order")}
            </h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["priority", "time"] as const).map((mode: TodayOrderMode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={prefs.order === mode}
                  onClick={() => onChange({ ...prefs, order: mode })}
                  className={`min-h-[44px] rounded-xl border px-3 text-[14px] font-medium transition-colors ${FOCUS} ${
                    prefs.order === mode
                      ? "border-transparent bg-[var(--bc-mobile-accent)] text-[var(--bc-mobile-navy)]"
                      : "border-[var(--bc-mobile-border)] text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface-2)]"
                  }`}
                >
                  {t(
                    mode === "priority"
                      ? "bc.mobile.home.today.customize.order.priority"
                      : "bc.mobile.home.today.customize.order.time",
                  )}
                </button>
              ))}
            </div>
          </section>

          <section aria-label={t("bc.mobile.home.today.customize.max")}>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.home.today.customize.max")}
            </h3>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {TODAY_MAX_CHOICES.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={prefs.maxItems === value}
                  onClick={() => onChange({ ...prefs, maxItems: value })}
                  className={`min-h-[44px] rounded-xl border px-3 text-[14px] font-medium transition-colors ${FOCUS} ${
                    prefs.maxItems === value
                      ? "border-transparent bg-[var(--bc-mobile-accent)] text-[var(--bc-mobile-navy)]"
                      : "border-[var(--bc-mobile-border)] text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface-2)]"
                  }`}
                >
                  {t("bc.mobile.home.today.customize.max.value", { count: value })}
                </button>
              ))}
            </div>
          </section>

          <button
            type="button"
            onClick={onReset}
            disabled={
              prefs.order === DEFAULT_TODAY_PREFERENCES.order &&
              prefs.maxItems === DEFAULT_TODAY_PREFERENCES.maxItems &&
              prefs.kinds.length === TODAY_KINDS.length
            }
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-[14px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] disabled:opacity-40 ${FOCUS}`}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" strokeWidth={1.7} />
            {t("bc.mobile.home.today.customize.reset")}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
