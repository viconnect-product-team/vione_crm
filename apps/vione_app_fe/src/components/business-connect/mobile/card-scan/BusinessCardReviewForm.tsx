// BC-Mobile-4B — Human Review: the OCR candidate becomes an EDITABLE draft.
//
// OCR proposes; the human confirms. Only the confirmed values in this form
// are ever saved. Confidence cues stay textual (chips), never bare colors.
// Fax numbers are intentionally absent here (documented omission — they are
// not a personal contact channel; the 4A preview still showed them as OCR
// evidence). One primary phone + one primary email persist.

import { forwardRef, useId, useMemo } from "react";
import { Save, X, AlertTriangle, Share2, Sparkles } from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";
import type {
  BusinessCardCandidate,
  PhoneLabel,
} from "@/lib/business-connect/mobile/card-scan.types";
import { confidenceBand } from "@/lib/business-connect/mobile/card-scan.types";
import type {
  ScanReviewDraft,
  ScanReviewErrors,
} from "@/lib/business-connect/mobile/card-scan.review";
import { buildScanDraftVCard } from "@/lib/business-connect/mobile/card-scan.vcard";
import { VcfPreviewRows } from "@/components/business-connect/mobile/VcfPreviewRows";

const PHONE_LABEL_KEY: Record<PhoneLabel, TKey> = {
  mobile: "bc.mobile.cardScan.phone.mobile",
  office: "bc.mobile.cardScan.phone.office",
  hotline: "bc.mobile.cardScan.phone.hotline",
  fax: "bc.mobile.cardScan.phone.fax",
};

/** Textual confidence chip — shown only when a value needs human attention. */
function ConfidenceChip({ confidence }: { confidence: number | undefined }) {
  const t = useT();
  if (confidence === undefined) return null;
  const band = confidenceBand(confidence);
  if (band === "clear") return null;
  return (
    <span className="rounded-full bg-[var(--bc-mobile-surface-2)] px-2 py-0.5 text-[11px] text-[var(--bc-mobile-muted)]">
      {t(
        band === "review"
          ? "bc.mobile.cardScan.confidence.review"
          : "bc.mobile.cardScan.confidence.unclear",
      )}
    </span>
  );
}

const INPUT_CLASS =
  "w-full rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-3.5 py-2.5 text-[15px] text-[var(--bc-mobile-text)] outline-none transition-colors placeholder:text-[var(--bc-mobile-muted)] focus:border-[var(--bc-mobile-navy)] motion-reduce:transition-none aria-[invalid=true]:border-red-500";

function Field({
  id,
  label,
  error,
  confidence,
  children,
}: {
  id: string;
  label: string;
  error?: string | null;
  confidence?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[12px] font-medium text-[var(--bc-mobile-muted)]">
          {label}
        </label>
        <ConfidenceChip confidence={confidence} />
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-[12px] text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const BusinessCardReviewForm = forwardRef<
  HTMLHeadingElement,
  {
    candidate: BusinessCardCandidate;
    draft: ScanReviewDraft;
    errors: ScanReviewErrors;
    /** Truthful duplicate hint shown after the resolver finds possible matches. */
    duplicateHint: boolean;
    /** Last save failure surfaced as a calm inline note (i18n-resolved text). */
    saveErrorText: string | null;
    saving: boolean;
    onChange: (patch: Partial<ScanReviewDraft>) => void;
    onContinue: () => void;
    onCancel: () => void;
    /** Instant .vcf export of the CURRENT draft — share before saving. */
    onExportVcf?: () => void;
    /** Disabled while the draft has no name to anchor the card. */
    exportVcfDisabled?: boolean;
  }
>(function BusinessCardReviewForm(
  {
    candidate,
    draft,
    errors,
    duplicateHint,
    saveErrorText,
    saving,
    onChange,
    onContinue,
    onCancel,
    onExportVcf,
    exportVcfDisabled,
  },
  headingRef,
) {
  const t = useT();
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const { fields } = candidate;
  const overallPercent = Math.round(Math.min(1, Math.max(0, candidate.overallConfidence)) * 100);
  const saveablePhones = fields.phones.filter((p) => p.label !== "fax");

  const errorMessages: string[] = [];
  if (errors.name_required) errorMessages.push(t("bc.mobile.cardScan.review.error.name"));
  if (errors.invalid_phone) errorMessages.push(t("bc.mobile.cardScan.review.error.phone"));
  if (errors.invalid_email) errorMessages.push(t("bc.mobile.cardScan.review.error.email"));
  if (errors.invalid_website) errorMessages.push(t("bc.mobile.cardScan.review.error.website"));
  if (errors.contact_method_required)
    errorMessages.push(t("bc.mobile.cardScan.review.error.contact"));

  // Inline live vCard preview: built from the CURRENT draft on every edit,
  // so the human sees exactly what will be exported BEFORE pressing the
  // export button. Null while the draft has no name (button is disabled).
  const vcfPreview = useMemo(
    () =>
      buildScanDraftVCard(
        draft,
        typeof window === "undefined" ? undefined : window.location.origin,
      ),
    [draft],
  );

  return (
    <div className="flex flex-1 flex-col px-6 pb-8">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-2 text-[18px] font-semibold tracking-tight text-[var(--bc-mobile-text)] outline-none"
      >
        {t("bc.mobile.cardScan.review.title")}
      </h2>
      <p className="mt-0.5 text-[13px] text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.cardScan.review.subtitle")}
      </p>

      {/* Overall OCR confidence — an estimate, never a save threshold. */}
      <div className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3 py-2.5">
        <Sparkles
          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--bc-mobile-muted)]"
          strokeWidth={1.8}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[var(--bc-mobile-text)]">
            {t("bc.mobile.cardScan.confidence.overall", { percent: overallPercent })}
          </p>
          <p className="mt-0.5 text-[12px] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.cardScan.confidence.overallHint")}
          </p>
        </div>
      </div>

      {duplicateHint ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3 py-2.5 text-[13px] text-[var(--bc-mobile-muted)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
          {t("bc.mobile.cardScan.review.duplicate")}
        </p>
      ) : null}

      {errorMessages.length > 0 ? (
        <div
          role="alert"
          className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-900/50 dark:bg-red-950/40"
        >
          <ul className="grid gap-1 text-[13px] text-red-700 dark:text-red-300">
            {errorMessages.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {saveErrorText ? (
        <p role="alert" className="mt-3 text-[13px] text-red-600 dark:text-red-400">
          {saveErrorText}
        </p>
      ) : null}

      <div className="mt-4 grid gap-4">
        <Field
          id={id("name")}
          label={t("bc.mobile.cardScan.review.name")}
          error={errors.name_required ? t("bc.mobile.cardScan.review.error.name") : null}
          confidence={fields.displayName?.confidence}
        >
          <input
            id={id("name")}
            type="text"
            required
            aria-required="true"
            aria-invalid={errors.name_required === true}
            aria-describedby={errors.name_required ? `${id("name")}-error` : undefined}
            autoComplete="name"
            placeholder={t("bc.mobile.cardScan.review.placeholder.name")}
            value={draft.displayName}
            onChange={(e) => onChange({ displayName: e.target.value })}
            className={INPUT_CLASS}
          />
        </Field>

        <Field
          id={id("title")}
          label={t("bc.mobile.cardScan.review.titleLabel")}
          confidence={fields.title?.confidence}
        >
          <input
            id={id("title")}
            type="text"
            autoComplete="organization-title"
            placeholder={t("bc.mobile.cardScan.review.placeholder.titleLabel")}
            value={draft.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className={INPUT_CLASS}
          />
        </Field>

        <Field
          id={id("company")}
          label={t("bc.mobile.cardScan.review.company")}
          confidence={fields.companyName?.confidence}
        >
          <input
            id={id("company")}
            type="text"
            autoComplete="organization"
            placeholder={t("bc.mobile.cardScan.review.placeholder.company")}
            value={draft.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            className={INPUT_CLASS}
          />
        </Field>

        {draft.phones.length > 0 ? (
          <fieldset className="grid gap-2">
            <legend className="text-[12px] font-medium text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.cardScan.review.phone")}
            </legend>
            {draft.phones.map((p, i) => (
              <div key={`phone-${i}`} className="flex items-center gap-2">
                <input
                  type="radio"
                  id={id(`phone-primary-${i}`)}
                  name={`${uid}-primary-phone`}
                  aria-label={t("bc.mobile.cardScan.review.phone")}
                  checked={draft.primaryPhone === i}
                  onChange={() => onChange({ primaryPhone: i })}
                  className="h-4 w-4 shrink-0 accent-[var(--bc-mobile-navy)]"
                />
                <input
                  type="tel"
                  aria-labelledby={id(`phone-primary-${i}`)}
                  aria-invalid={errors.invalid_phone === true && draft.primaryPhone === i}
                  autoComplete={i === 0 ? "tel" : undefined}
                  placeholder={t("bc.mobile.cardScan.review.placeholder.phone")}
                  value={p.value}
                  onChange={(e) => {
                    const phones = draft.phones.map((q, j) =>
                      j === i ? { ...q, value: e.target.value } : q,
                    );
                    onChange({ phones });
                  }}
                  className={INPUT_CLASS}
                />
                {p.label ? (
                  <span className="shrink-0 rounded-full bg-[var(--bc-mobile-surface-2)] px-2 py-0.5 text-[11px] text-[var(--bc-mobile-muted)]">
                    {t(PHONE_LABEL_KEY[p.label])}
                  </span>
                ) : null}
                <ConfidenceChip confidence={saveablePhones[i]?.confidence} />
              </div>
            ))}
            <p className="text-[12px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.cardScan.review.phoneHint")}
            </p>
          </fieldset>
        ) : null}

        {draft.emails.length > 0 ? (
          <fieldset className="grid gap-2">
            <legend className="text-[12px] font-medium text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.cardScan.review.email")}
            </legend>
            {draft.emails.map((em, i) => (
              <div key={`email-${i}`} className="flex items-center gap-2">
                <input
                  type="radio"
                  id={id(`email-primary-${i}`)}
                  name={`${uid}-primary-email`}
                  aria-label={t("bc.mobile.cardScan.review.email")}
                  checked={draft.primaryEmail === i}
                  onChange={() => onChange({ primaryEmail: i })}
                  className="h-4 w-4 shrink-0 accent-[var(--bc-mobile-navy)]"
                />
                <input
                  type="email"
                  aria-labelledby={id(`email-primary-${i}`)}
                  aria-invalid={errors.invalid_email === true && draft.primaryEmail === i}
                  autoComplete={i === 0 ? "email" : undefined}
                  placeholder={t("bc.mobile.cardScan.review.placeholder.email")}
                  value={em}
                  onChange={(e) => {
                    const emails = draft.emails.map((q, j) => (j === i ? e.target.value : q));
                    onChange({ emails });
                  }}
                  className={INPUT_CLASS}
                />
                <ConfidenceChip confidence={fields.emails[i]?.confidence} />
              </div>
            ))}
          </fieldset>
        ) : null}

        <Field
          id={id("website")}
          label={t("bc.mobile.cardScan.review.website")}
          error={errors.invalid_website ? t("bc.mobile.cardScan.review.error.website") : null}
          confidence={fields.website?.confidence}
        >
          <input
            id={id("website")}
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder={t("bc.mobile.cardScan.review.placeholder.website")}
            aria-invalid={errors.invalid_website === true}
            aria-describedby={errors.invalid_website ? `${id("website")}-error` : undefined}
            value={draft.website}
            onChange={(e) => onChange({ website: e.target.value })}
            className={INPUT_CLASS}
          />
        </Field>

        <Field
          id={id("address")}
          label={t("bc.mobile.cardScan.review.address")}
          confidence={fields.address?.confidence}
        >
          <input
            id={id("address")}
            type="text"
            autoComplete="street-address"
            placeholder={t("bc.mobile.cardScan.review.placeholder.address")}
            value={draft.address}
            onChange={(e) => onChange({ address: e.target.value })}
            className={INPUT_CLASS}
          />
        </Field>
      </div>

      <div className="mt-auto grid gap-3 pt-8">
        {onExportVcf && vcfPreview ? (
          <section
            data-testid="vcf-inline-preview"
            aria-label={t("bc.mobile.vcfPreview.title")}
            className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-4 pb-3 pt-3.5"
          >
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.vcfPreview.title")}
            </h3>
            <VcfPreviewRows vcf={vcfPreview} />
          </section>
        ) : null}
        {onExportVcf ? (
          <button
            type="button"
            onClick={onExportVcf}
            disabled={saving || exportVcfDisabled === true}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[var(--bc-mobile-navy)] bg-[var(--bc-mobile-surface)] px-6 text-[15px] font-medium text-[var(--bc-mobile-navy)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] disabled:opacity-50 motion-reduce:transition-none"
          >
            <Share2 className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            {t("bc.mobile.cardScan.review.exportVcf")}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onContinue}
          disabled={saving}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--bc-mobile-text)] px-6 text-[15px] font-semibold text-[var(--bc-mobile-surface)] transition-opacity hover:opacity-90 disabled:opacity-50 motion-reduce:transition-none"
        >
          <Save className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          {t("bc.mobile.cardScan.save")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-6 text-[15px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] motion-reduce:transition-none"
        >
          <X className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          {t("bc.mobile.cardScan.cancel")}
        </button>
      </div>
    </div>
  );
});
