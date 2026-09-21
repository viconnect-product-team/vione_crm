// BC-Mobile-4B — Duplicate confirmation bottom sheet.
//
// Surfaces viewer-scoped duplicate candidates after review. Exact/strong
// tiers are shown up front; weak "possible" matches (name-only/company-only)
// are disclosed behind a toggle and are NEVER selectable — fuzzy similarity
// can never merge people. Only owner-scoped guest contacts can be update
// targets: saved cards and connections render as information only (OCR never
// overwrites another canonical identity).

import { useState } from "react";
import { useT, type TKey } from "@/lib/i18n";
import type {
  ScanDuplicateCandidate,
  ScanDuplicateResolution,
} from "@/lib/business-connect/mobile/card-scan.review";

type Props = {
  resolution: ScanDuplicateResolution;
  /** Only an owner-scoped guest person ref may be selected (update target). */
  selectedTargetId: string | null;
  busy: boolean;
  onSelectTarget: (personId: string) => void;
  onUpdateExisting: () => void;
  onKeepNew: () => void;
  onEditFirst: () => void;
};

const REASON_KEY: Record<ScanDuplicateCandidate["reason"], TKey> = {
  phone: "bc.mobile.cardScan.duplicate.reasonPhone",
  email: "bc.mobile.cardScan.duplicate.reasonEmail",
  phone_email: "bc.mobile.cardScan.duplicate.reasonBoth",
  name_company: "bc.mobile.cardScan.duplicate.reasonNameCompany",
  name_domain: "bc.mobile.cardScan.duplicate.reasonNameDomain",
  name: "bc.mobile.cardScan.duplicate.reasonName",
  company: "bc.mobile.cardScan.duplicate.reasonCompany",
};

const KIND_KEY: Record<ScanDuplicateCandidate["kind"], TKey> = {
  guest: "bc.mobile.cardScan.duplicate.kind.guest",
  saved_card: "bc.mobile.cardScan.duplicate.kind.savedCard",
  connection: "bc.mobile.cardScan.duplicate.kind.connection",
};

function Chip({ label, tone }: { label: string; tone?: "warning" }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
        tone === "warning"
          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          : "bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-muted)]"
      }`}
    >
      {label}
    </span>
  );
}

function CandidateRow({
  candidate,
  selected,
  selectable,
  onSelect,
}: {
  candidate: ScanDuplicateCandidate;
  selected: boolean;
  selectable: boolean;
  onSelect: () => void;
}) {
  const t = useT();
  const body = (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <p className="text-sm font-semibold text-[var(--bc-mobile-text)]">
          {candidate.displayName || t("bc.mobile.cardScan.duplicate.noName")}
        </p>
        <Chip label={t(KIND_KEY[candidate.kind])} />
        <Chip tone="warning" label={t(REASON_KEY[candidate.reason])} />
      </div>
      {candidate.title || candidate.companyName ? (
        <p className="mt-1 text-xs text-[var(--bc-mobile-muted)]">
          {[candidate.title, candidate.companyName].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </>
  );
  if (!selectable) {
    return (
      <div
        className="rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-4 py-3"
        data-testid="dup-row"
      >
        {body}
      </div>
    );
  }
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      data-testid="dup-row"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors motion-reduce:transition-none ${
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
      <span className="min-w-0 flex-1">{body}</span>
    </button>
  );
}

export function CardScanDuplicateSheet({
  resolution,
  selectedTargetId,
  busy,
  onSelectTarget,
  onUpdateExisting,
  onKeepNew,
  onEditFirst,
}: Props) {
  const t = useT();
  const [showPossible, setShowPossible] = useState(false);

  const strong = resolution.candidates.filter((c) => c.matchLevel !== "possible");
  const possible = resolution.candidates.filter((c) => c.matchLevel === "possible");
  const leadCandidate = resolution.candidates[0];
  const reason = leadCandidate ? t(REASON_KEY[leadCandidate.reason]) : "";
  const ambiguous = resolution.state === "ambiguous";
  const messageKey: TKey = ambiguous
    ? "bc.mobile.cardScan.duplicate.ambiguousMessage"
    : "bc.mobile.cardScan.duplicate.exactMessage";
  /** Selectable rows: ambiguous guest candidates only. Exact state shows its
   *  single candidate read-only (preselected upstream); possible-tier rows
   *  are never selectable. */
  const listed = ambiguous ? strong : resolution.candidates;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/45"
      role="dialog"
      aria-modal="true"
      aria-label={t("bc.mobile.cardScan.duplicate.title")}
    >
      <div className="w-full max-w-md rounded-t-3xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-5 pb-6 pt-3 shadow-xl">
        <div
          className="mx-auto mb-3 h-1 w-9 rounded-full bg-[var(--bc-mobile-border)]"
          aria-hidden
        />
        <h2 className="text-base font-semibold tracking-tight text-[var(--bc-mobile-text)]">
          {t("bc.mobile.cardScan.duplicate.title")}
        </h2>
        <p className="mt-1 text-sm text-[var(--bc-mobile-muted)]">{t(messageKey, { reason })}</p>

        <div
          className="mt-4 max-h-[38vh] space-y-2 overflow-y-auto"
          role={ambiguous ? "radiogroup" : undefined}
          aria-label={ambiguous ? t("bc.mobile.cardScan.duplicate.title") : undefined}
        >
          {listed.map((candidate) => (
            <CandidateRow
              key={candidate.personId}
              candidate={candidate}
              selected={selectedTargetId === candidate.personId}
              selectable={ambiguous && candidate.kind === "guest"}
              onSelect={() => onSelectTarget(candidate.personId)}
            />
          ))}
        </div>

        {possible.length > 0 && ambiguous ? (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowPossible((v) => !v)}
              className="text-xs font-medium text-[var(--bc-mobile-muted)] underline-offset-2 hover:text-[var(--bc-mobile-text)] hover:underline"
            >
              {showPossible
                ? t("bc.mobile.cardScan.duplicate.possibleHide")
                : t("bc.mobile.cardScan.duplicate.possibleShow", { count: possible.length })}
            </button>
            {showPossible ? (
              <div className="mt-2 max-h-[24vh] space-y-2 overflow-y-auto">
                {possible.map((candidate) => (
                  <CandidateRow
                    key={candidate.personId}
                    candidate={candidate}
                    selected={false}
                    selectable={false}
                    onSelect={() => undefined}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 space-y-2">
          <button
            type="button"
            disabled={busy || selectedTargetId === null}
            onClick={onUpdateExisting}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--bc-mobile-text)] px-6 text-[15px] font-semibold text-[var(--bc-mobile-surface)] transition-opacity hover:opacity-90 disabled:opacity-40 motion-reduce:transition-none"
          >
            {t("bc.mobile.cardScan.duplicate.updateExisting")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onKeepNew}
            className="flex min-h-12 w-full items-center justify-center rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-6 text-[15px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] disabled:opacity-40 motion-reduce:transition-none"
          >
            {t("bc.mobile.cardScan.duplicate.keepNew")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onEditFirst}
            className="flex min-h-11 w-full items-center justify-center rounded-full px-6 text-[14px] font-medium text-[var(--bc-mobile-muted)] transition-colors hover:text-[var(--bc-mobile-text)] disabled:opacity-40 motion-reduce:transition-none"
          >
            {t("bc.mobile.cardScan.duplicate.editFirst")}
          </button>
        </div>
      </div>
    </div>
  );
}
