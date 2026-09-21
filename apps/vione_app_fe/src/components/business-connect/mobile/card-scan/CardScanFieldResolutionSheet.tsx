// BC-Mobile-4B — Field-level merge confirmation (existing-person update).
//
// When a scan is linked to an existing guest contact and the confirmed card
// values differ from the stored ones, identity fields are NEVER silently
// overwritten: every conflict is a human choice (default = keep current).
// Empty canonical fields are auto-filled from the card and listed here for
// transparency. Only 'card' choices are sent to the save RPC.

import { useT, type TKey } from "@/lib/i18n";
import type {
  ScanFieldChoice,
  ScanFieldChoices,
  ScanFieldKey,
  ScanFieldResolution,
} from "@/lib/business-connect/mobile/card-scan.review";

type Props = {
  targetName: string;
  resolutions: ScanFieldResolution[];
  choices: ScanFieldChoices;
  busy: boolean;
  onChoice: (key: ScanFieldKey, choice: ScanFieldChoice) => void;
  onConfirm: () => void;
  onBack: () => void;
};

const FIELD_LABEL: Record<ScanFieldKey, TKey> = {
  displayName: "bc.mobile.cardScan.review.name",
  phone: "bc.mobile.cardScan.review.phone",
  email: "bc.mobile.cardScan.review.email",
  companyName: "bc.mobile.cardScan.review.company",
  title: "bc.mobile.cardScan.review.titleLabel",
  website: "bc.mobile.cardScan.review.website",
  address: "bc.mobile.cardScan.review.address",
};

function ChoiceRow({
  label,
  value,
  selected,
  onSelect,
}: {
  label: string;
  value: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors motion-reduce:transition-none ${
        selected
          ? "border-[var(--bc-mobile-text)] bg-[var(--bc-mobile-surface-2)]"
          : "border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] hover:bg-[var(--bc-mobile-surface-2)]"
      }`}
    >
      <span
        className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${
          selected ? "border-[var(--bc-mobile-text)]" : "border-[var(--bc-mobile-muted)]"
        }`}
        aria-hidden
      >
        {selected ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--bc-mobile-text)]" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium uppercase tracking-wide text-[var(--bc-mobile-muted)]">
          {label}
        </span>
        <span className="block truncate text-sm font-medium text-[var(--bc-mobile-text)]">
          {value}
        </span>
      </span>
    </button>
  );
}

export function CardScanFieldResolutionSheet({
  targetName,
  resolutions,
  choices,
  busy,
  onChoice,
  onConfirm,
  onBack,
}: Props) {
  const t = useT();
  const fills = resolutions.filter((r) => r.status === "fill");
  const conflicts = resolutions.filter((r) => r.status === "conflict");

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/45"
      role="dialog"
      aria-modal="true"
      aria-label={t("bc.mobile.cardScan.fields.title")}
    >
      <div className="w-full max-w-md rounded-t-3xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-5 pb-6 pt-3 shadow-xl">
        <div
          className="mx-auto mb-3 h-1 w-9 rounded-full bg-[var(--bc-mobile-border)]"
          aria-hidden
        />
        <h2 className="text-base font-semibold tracking-tight text-[var(--bc-mobile-text)]">
          {t("bc.mobile.cardScan.fields.title")}
        </h2>
        <p className="mt-1 text-sm text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.cardScan.fields.desc", { name: targetName })}
        </p>

        <div className="mt-4 max-h-[44vh] space-y-4 overflow-y-auto">
          {conflicts.length > 0 ? (
            <div
              className="space-y-4"
              role="radiogroup"
              aria-label={t("bc.mobile.cardScan.fields.title")}
            >
              {conflicts.map((r: any) => {
                const selected = (choices as any)[r.key] ?? "current";
                return (
                  <div key={r.key}>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--bc-mobile-muted)]">
                      {t((FIELD_LABEL as any)[r.key])}
                    </p>
                    <div className="space-y-1.5">
                      <ChoiceRow
                        label={t("bc.mobile.cardScan.fields.current")}
                        value={r.currentValue}
                        selected={selected === "current"}
                        onSelect={() => onChoice(r.key, "current")}
                      />
                      <ChoiceRow
                        label={t("bc.mobile.cardScan.fields.fromCard")}
                        value={r.cardValue}
                        selected={selected === "card"}
                        onSelect={() => onChoice(r.key, "card")}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {fills.length > 0 ? (
            <div className="rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--bc-mobile-muted)]">
                {t("bc.mobile.cardScan.fields.fillTitle")}
              </p>
              <ul className="mt-1.5 space-y-1">
                {fills.map((r: any) => (
                  <li key={r.key} className="text-sm text-[var(--bc-mobile-text)]">
                    <span className="font-medium">{t((FIELD_LABEL as any)[r.key])}</span>
                    <span className="text-[var(--bc-mobile-muted)]"> · {r.cardValue}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="mt-4 space-y-2">
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--bc-mobile-text)] px-6 text-[15px] font-semibold text-[var(--bc-mobile-surface)] transition-opacity hover:opacity-90 disabled:opacity-40 motion-reduce:transition-none"
          >
            {t("bc.mobile.cardScan.fields.confirm")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onBack}
            className="flex min-h-11 w-full items-center justify-center rounded-full px-6 text-[14px] font-medium text-[var(--bc-mobile-muted)] transition-colors hover:text-[var(--bc-mobile-text)] disabled:opacity-40 motion-reduce:transition-none"
          >
            {t("bc.mobile.cardScan.fields.back")}
          </button>
        </div>
      </div>
    </div>
  );
}
