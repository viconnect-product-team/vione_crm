// BC-Mobile-5D — Share Contact back (Guest Contact Exchange) for the PUBLIC
// DIGITAL IDENTITY card (/c/<token>).
//
// This reuses the BC-Mobile-3B guest-contact domain end to end: the same
// frozen validation module, versioned explicit consent (never pre-checked),
// per-session idempotency token, honeypot, and leak-free response contract.
// Only the owner resolution differs: /api/public/identity/<token>/contact
// resolves the opaque share token → active identity → owner server-side.
// The token is NEVER rendered in the UI — it appears only inside the fetch
// URL of the page the recipient is already on.
//
// This is NOT a Business Connect connection: success copy stays "Đã chia sẻ
// liên hệ", never "Đã kết nối" (Connect is deferred to the Connection
// Engine — see BC_MOBILE_5D docs).

import { useRef, useState } from "react";
import { CheckCircle2, Loader2, Send, Share2 } from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";
import {
  GUEST_CONSENT_VERSION,
  validateGuestContactSubmission,
  type GuestShareResponse,
  type GuestShareValidationDetail,
} from "@/lib/business-card/guest-contact";
import { reportIdentityMetric } from "@/lib/business-connect/mobile/identity.telemetry";
import { safeRandomUUID } from "@/lib/utils";

const DETAIL_MESSAGE: Record<GuestShareValidationDetail, TKey> = {
  name_required: "bc.publicCard.exchange.errorName",
  contact_method_required: "bc.publicCard.exchange.errorContactMethod",
  invalid_phone: "bc.publicCard.exchange.errorPhone",
  invalid_email: "bc.publicCard.exchange.errorEmail",
  consent_required: "bc.publicCard.exchange.errorConsent",
  invalid_client_token: "bc.publicCard.exchange.errorGeneric",
  field_too_long: "bc.publicCard.exchange.errorGeneric",
};

type FormFields = {
  displayName: string;
  phone: string;
  email: string;
  companyName: string;
  title: string;
  consent: boolean;
};

const EMPTY_FORM: FormFields = {
  displayName: "",
  phone: "",
  email: "",
  companyName: "",
  title: "",
  consent: false,
};

const INPUT_CLASS =
  "w-full rounded-xl border border-[var(--bc-mobile-border)] bg-transparent px-3 py-2.5 text-[13.5px] text-[var(--bc-mobile-text)] placeholder:text-[var(--bc-mobile-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]";

function Field({
  id,
  label,
  optional,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  const t = useT();
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-[12.5px] font-medium text-[var(--bc-mobile-text)]"
      >
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-[var(--bc-mobile-muted)]">
            ({t("bc.publicCard.exchange.optional")})
          </span>
        ) : null}
      </label>
      {children}
    </div>
  );
}

export function IdentityShareContactPanel({
  token,
  ownerName,
}: {
  /** Opaque share token — used ONLY inside the fetch URL, never rendered. */
  token: string;
  ownerName: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormFields>(EMPTY_FORM);
  const tokenRef = useRef<string | null>(null);
  const honeypotRef = useRef<HTMLInputElement | null>(null);

  const set = <K extends keyof FormFields>(key: K, value: FormFields[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openForm = () => {
    if (tokenRef.current == null) tokenRef.current = safeRandomUUID();
    reportIdentityMetric("PUBLIC_CARD_SHARE_CONTACT_OPENED");
    setOpen(true);
  };

  const candidate = () => ({
    displayName: form.displayName,
    phone: form.phone,
    email: form.email,
    companyName: form.companyName,
    title: form.title,
    consent: form.consent,
    consentVersion: GUEST_CONSENT_VERSION,
    clientToken: tokenRef.current ?? "",
  });

  const valid = validateGuestContactSubmission(candidate()).ok;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const v = validateGuestContactSubmission(candidate());
    if (!v.ok) {
      setError(t(DETAIL_MESSAGE[v.detail]));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/identity/${encodeURIComponent(token)}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...v.data,
          consent: true,
          website: honeypotRef.current?.value ?? "",
        }),
      });
      const body = (await res.json().catch(() => null)) as GuestShareResponse | null;
      if (res.ok && body?.ok === true) {
        reportIdentityMetric("PUBLIC_CARD_SHARE_CONTACT_SUBMITTED");
        setDone(true);
        return;
      }
      reportIdentityMetric("PUBLIC_CARD_SHARE_CONTACT_FAILED");
      if (
        body &&
        body.ok === false &&
        (body.error === "card_unavailable" || body.error === "exchange_disabled")
      ) {
        setError(t("bc.publicCard.exchange.errorUnavailable"));
      } else if (body && body.ok === false && body.error === "invalid_payload" && body.detail) {
        setError(t(DETAIL_MESSAGE[body.detail]));
      } else {
        setError(t("bc.publicCard.exchange.errorGeneric"));
      }
    } catch {
      reportIdentityMetric("PUBLIC_CARD_SHARE_CONTACT_FAILED");
      setError(t("bc.publicCard.exchange.errorGeneric"));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-4"
      >
        <p className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-[var(--bc-mobile-text)]">
          <CheckCircle2 className="h-4.5 w-4.5 text-[var(--bc-mobile-navy)]" aria-hidden="true" />
          {t("bc.publicCard.exchange.successTitle")}
        </p>
        <p className="mt-1 text-[12.5px] text-[var(--bc-mobile-muted)]">
          {t("bc.publicCard.exchange.successBody")}
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-5 text-center">
        <p className="text-[14.5px] font-semibold text-[var(--bc-mobile-text)]">
          {t("bc.publicIdentity.exchangeTeaserTitle")}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--bc-mobile-muted)]">
          {t("bc.publicIdentity.exchangeTeaserBody", { name: ownerName })}
        </p>
        <button
          type="button"
          onClick={openForm}
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--bc-mobile-navy)] px-5 text-[13.5px] font-semibold text-[var(--bc-mobile-navy)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" strokeWidth={1.8} />
          {t("bc.publicCard.exchange.cta")}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      aria-label={t("bc.publicCard.exchange.title")}
      className="space-y-3 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-4"
    >
      <p className="text-[13.5px] font-semibold text-[var(--bc-mobile-text)]">
        {t("bc.publicCard.exchange.title")}
      </p>
      <p className="text-[12.5px] text-[var(--bc-mobile-muted)]">
        {t("bc.publicCard.exchange.intro", { name: ownerName })}
      </p>

      <fieldset disabled={busy} className="space-y-3">
        <Field id="bc-id-guest-name" label={t("bc.publicCard.exchange.name")}>
          <input
            id="bc-id-guest-name"
            type="text"
            required
            autoComplete="name"
            maxLength={200}
            value={form.displayName}
            onChange={(e) => set("displayName", e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field id="bc-id-guest-phone" label={t("bc.publicCard.exchange.phone")} optional>
            <input
              id="bc-id-guest-phone"
              type="tel"
              autoComplete="tel"
              maxLength={60}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field id="bc-id-guest-email" label={t("bc.publicCard.exchange.email")} optional>
            <input
              id="bc-id-guest-email"
              type="email"
              autoComplete="email"
              maxLength={180}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field id="bc-id-guest-company" label={t("bc.publicCard.exchange.company")} optional>
            <input
              id="bc-id-guest-company"
              type="text"
              autoComplete="organization"
              maxLength={240}
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field id="bc-id-guest-title" label={t("bc.publicCard.exchange.jobTitle")} optional>
            <input
              id="bc-id-guest-title"
              type="text"
              autoComplete="organization-title"
              maxLength={200}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        {/* Honeypot — invisible to humans, attractive to bots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="bc-id-guest-website">Website</label>
          <input
            id="bc-id-guest-website"
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            ref={honeypotRef}
          />
        </div>

        <label
          htmlFor="bc-id-guest-consent"
          className="flex items-start gap-2.5 text-[12.5px] leading-snug text-[var(--bc-mobile-text)]"
        >
          <input
            id="bc-id-guest-consent"
            type="checkbox"
            checked={form.consent}
            onChange={(e) => set("consent", e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--bc-mobile-navy)]"
          />
          <span>{t("bc.publicCard.exchange.consent")}</span>
        </label>
      </fieldset>

      <div aria-live="polite">
        {error ? (
          <p role="alert" className="text-[12.5px] font-medium text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={!valid || busy}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bc-cta-gold px-5 text-[13.5px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        ) : (
          <Send className="h-4 w-4" aria-hidden="true" strokeWidth={1.8} />
        )}
        {busy ? t("bc.publicCard.exchange.submitting") : t("bc.publicCard.exchange.submit")}
      </button>
    </form>
  );
}
