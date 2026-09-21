// BC-Mobile-3B — ShareContactPanel: the guest-facing "Chia sẻ liên hệ của
// bạn" CTA + minimal contact form on the public digital card (/b/<slug>).
//
// A guest voluntarily shares their OWN contact back with the card owner —
// no account required. Consent is explicit (never pre-checked) and a hard
// gate on every layer. The client token is generated once per form session
// so double-taps/retries are idempotent server-side. A hidden "website"
// honeypot silently drops naive bots. Status changes are announced via an
// aria-live region; all styling reuses the public card's vba tokens.

import { useRef, useState } from "react";
import { CheckCircle2, Loader2, Send, Share2 } from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";
import {
  GUEST_CONSENT_VERSION,
  validateGuestContactSubmission,
  type GuestShareResponse,
  type GuestShareValidationDetail,
} from "@/lib/business-card/guest-contact";
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
  "w-full rounded-xl border border-[var(--vba-border-soft)] bg-transparent px-3 py-2.5 text-[13px] text-[var(--vba-text)] placeholder:text-[var(--vba-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vba-gold)]";

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
      <label htmlFor={id} className="mb-1 block text-[12px] font-medium text-[var(--vba-text)]">
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-[var(--vba-text-muted)]">
            ({t("bc.publicCard.exchange.optional")})
          </span>
        ) : null}
      </label>
      {children}
    </div>
  );
}

export function ShareContactPanel({ slug, ownerName }: { slug: string; ownerName: string }) {
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
    setOpen(true);
  };

  const closeForm = () => {
    setOpen(false);
    setDone(false);
    setError(null);
    setForm(EMPTY_FORM);
    tokenRef.current = null; // a future share gets a fresh idempotency token
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
      const res = await fetch(`/api/public/card/${encodeURIComponent(slug)}/contact`, {
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
        setDone(true);
        return;
      }
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
      setError(t("bc.publicCard.exchange.errorGeneric"));
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={openForm}
        className="focus-visible:ring-2 focus-visible:ring-[var(--vba-gold)] inline-flex items-center gap-2 rounded-xl border border-[var(--vba-gold)] px-4 py-2 text-[13px] font-semibold text-[var(--vba-gold)] transition hover:bg-[var(--vba-gold-soft)]"
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
        {t("bc.publicCard.exchange.cta")}
      </button>
    );
  }

  if (done) {
    return (
      <div
        role="status"
        className="mt-2 rounded-xl border border-[var(--vba-border-soft)] bg-[var(--vba-gold-soft)] p-4"
      >
        <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--vba-text)]">
          <CheckCircle2 className="h-4.5 w-4.5 text-[var(--vba-gold)]" aria-hidden="true" />
          {t("bc.publicCard.exchange.successTitle")}
        </p>
        <p className="mt-1 text-[12px] text-[var(--vba-text-muted)]">
          {t("bc.publicCard.exchange.successBody")}
        </p>
        <button
          type="button"
          onClick={closeForm}
          className="focus-visible:ring-2 focus-visible:ring-[var(--vba-gold)] mt-3 inline-flex items-center rounded-lg border border-[var(--vba-border-soft)] px-3 py-1.5 text-[12px] font-medium text-[var(--vba-text)] hover:bg-card/5"
        >
          {t("bc.publicCard.exchange.back")}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      aria-label={t("bc.publicCard.exchange.title")}
      className="mt-2 space-y-3 rounded-xl border border-[var(--vba-border-soft)] p-4"
    >
      <p className="text-[13px] font-semibold text-[var(--vba-text)]">
        {t("bc.publicCard.exchange.title")}
      </p>
      <p className="text-[12px] text-[var(--vba-text-muted)]">
        {t("bc.publicCard.exchange.intro", { name: ownerName })}
      </p>

      <fieldset disabled={busy} className="space-y-3">
        <Field id="bc-guest-name" label={t("bc.publicCard.exchange.name")}>
          <input
            id="bc-guest-name"
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
          <Field id="bc-guest-phone" label={t("bc.publicCard.exchange.phone")} optional>
            <input
              id="bc-guest-phone"
              type="tel"
              autoComplete="tel"
              maxLength={60}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field id="bc-guest-email" label={t("bc.publicCard.exchange.email")} optional>
            <input
              id="bc-guest-email"
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
          <Field id="bc-guest-company" label={t("bc.publicCard.exchange.company")} optional>
            <input
              id="bc-guest-company"
              type="text"
              autoComplete="organization"
              maxLength={240}
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field id="bc-guest-title" label={t("bc.publicCard.exchange.jobTitle")} optional>
            <input
              id="bc-guest-title"
              type="text"
              autoComplete="organization-title"
              maxLength={200}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        {/* Honeypot — invisible to humans, attractive to bots. The route
            silently drops any submission that carries a value here. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="bc-guest-website">Website</label>
          <input
            id="bc-guest-website"
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            ref={honeypotRef}
          />
        </div>

        <label
          htmlFor="bc-guest-consent"
          className="flex items-start gap-2.5 text-[12px] leading-snug text-[var(--vba-text)]"
        >
          <input
            id="bc-guest-consent"
            type="checkbox"
            checked={form.consent}
            onChange={(e) => set("consent", e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--vba-gold)]"
          />
          <span>{t("bc.publicCard.exchange.consent")}</span>
        </label>
      </fieldset>

      <div aria-live="polite">
        {error ? (
          <p role="alert" className="text-[12px] font-medium text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={!valid || busy}
        className="focus-visible:ring-2 focus-visible:ring-[var(--vba-gold)] inline-flex items-center gap-2 rounded-xl bg-[var(--vba-gold)] px-4 py-2 text-[13px] font-semibold text-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        ) : (
          <Send className="h-4 w-4" aria-hidden="true" />
        )}
        {busy ? t("bc.publicCard.exchange.submitting") : t("bc.publicCard.exchange.submit")}
      </button>
    </form>
  );
}
