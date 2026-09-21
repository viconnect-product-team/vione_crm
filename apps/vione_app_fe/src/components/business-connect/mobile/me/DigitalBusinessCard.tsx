// BC-Mobile-5A/5D — the canonical visual representation of the user's
// SHAREABLE identity. It renders ONLY the PublicIdentityCard projection:
// the owner preview and the anonymous recipient view are the same component
// fed by the same projection, so a false preview is impossible.
//
// 5D recipient hierarchy: PERSON → PROFESSIONAL CONTEXT → PRIMARY ACTION
// (Save Contact) → QUICK CONTACT ACTIONS → BIO → CONTACT DETAILS.
//
// Hard rules:
// - "Save Contact" generates the vCard client-side from THIS DTO — a PRIVATE
//   field is null here and can never leak into the export. After delivery we
//   show truthful copy ("open the contact to save it") — a browser cannot
//   know the native Contacts save completed, so no "Đã lưu" claim.
// - Every href is produced by the centralized safe builders in
//   public-actions.ts. A value that fails validation renders NO action.
// - No Connect button, no verification badges, no metrics — none of those
//   have a legitimate public contract yet (see BC_MOBILE_5D docs).

import { useState } from "react";
import { Download, Globe, Linkedin, Loader2, Mail, MapPin, Phone, Share2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  buildIdentityVCard,
  identityVcfFilename,
} from "@/lib/business-connect/mobile/identity.vcard";
import { reportIdentityMetric } from "@/lib/business-connect/mobile/identity.telemetry";
import {
  safeMailtoHref,
  safeTelHref,
  safeWebHref,
  webDisplay,
} from "@/lib/business-connect/mobile/public-actions";
import type { PublicIdentityCard } from "@/lib/business-connect/mobile/identity.types";

function initialsOf(name: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "…";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Share-or-download the vCard; returns the delivery channel used. */
async function deliverVcf(vcf: string, filename: string): Promise<"shared" | "downloaded"> {
  const file = new File([vcf], filename, { type: "text/vcard" });
  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: filename });
    return "shared";
  }
  const url = URL.createObjectURL(new Blob([vcf], { type: "text/vcard; charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return "downloaded";
}

/** A bio long enough to justify progressive disclosure. */
const BIO_COLLAPSE_THRESHOLD = 220;

const QUICK_ACTION_CLASS =
  "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-3 text-[13.5px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none";

const DETAIL_ROW_CLASS =
  "flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-[14px] text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none";

export function DigitalBusinessCard({
  card,
  publicUrl,
  showActions = true,
  onShare,
  nameAs = "p",
}: {
  card: PublicIdentityCard;
  /** Absolute /c/<token> URL recorded in the vCard; null in pure previews. */
  publicUrl: string | null;
  showActions?: boolean;
  onShare?: () => void;
  /** Recipient page renders the name as the page's single h1. */
  nameAs?: "h1" | "p";
}) {
  const t = useT();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [bioOpen, setBioOpen] = useState(false);

  const titleCompany = [card.jobTitle, card.companyName].filter(Boolean).join(" · ");

  // Centralized safe hrefs — an invalid value yields NO rendered action.
  const telHref = safeTelHref(card.primaryPhone);
  const mailtoHref = safeMailtoHref(card.primaryEmail);
  const webHref = safeWebHref(card.website);
  const linkedinHref = safeWebHref(card.linkedinUrl);
  const hasQuickAction = !!(telHref || mailtoHref || webHref);
  const hasDetails =
    !!(mailtoHref || telHref || webHref || linkedinHref) || !!(card.address || card.city);

  const bio = card.bio?.trim() ?? "";
  const bioCollapsible = bio.length > BIO_COLLAPSE_THRESHOLD;

  async function handleSaveContact() {
    const vcf = buildIdentityVCard(card, publicUrl);
    if (!vcf || saving) return;
    setSaving(true);
    setSaveError(false);
    setDelivered(false);
    const started = Date.now();
    reportIdentityMetric("PUBLIC_CARD_SAVE_CONTACT_TAPPED");
    try {
      await deliverVcf(vcf, identityVcfFilename(card.displayName));
      reportIdentityMetric("IDENTITY_LINK_SHARED", { latencyMs: Date.now() - started });
      setDelivered(true);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  const NameTag = nameAs;

  return (
    <article
      aria-label={t("bc.publicIdentity.cardRegion", {
        name: card.displayName ?? t("bc.mobile.me.cardSection.title"),
      })}
      className="overflow-hidden rounded-3xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] shadow-[var(--bc-mobile-shadow-v)]"
    >
      {/* 1–2. PERSON + PROFESSIONAL CONTEXT */}
      <div className="flex flex-col items-center px-6 pb-5 pt-8 text-center">
        {card.avatarUrl ? (
          <img
            src={card.avatarUrl}
            alt={card.displayName ?? ""}
            className="h-20 w-20 rounded-full object-cover ring-1 ring-[var(--bc-mobile-border)]"
            loading="lazy"
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid h-20 w-20 place-items-center rounded-full bg-[var(--bc-mobile-navy)] text-[22px] font-semibold text-[var(--bc-mobile-accent)]"
          >
            {initialsOf(card.displayName)}
          </div>
        )}

        <NameTag className="mt-4 max-w-full break-words text-[24px] font-semibold leading-tight tracking-tight text-[var(--bc-mobile-text)]">
          {card.displayName ?? t("bc.mobile.me.emptyName")}
        </NameTag>
        {titleCompany && (
          <p className="mt-1.5 max-w-full break-words text-[15px] text-[var(--bc-mobile-muted)]">
            {titleCompany}
          </p>
        )}
        {card.headline && (
          <p className="mt-3 line-clamp-3 max-w-[34ch] break-words text-[14px] leading-relaxed text-[var(--bc-mobile-muted)]">
            {card.headline}
          </p>
        )}
      </div>

      {/* 3. PRIMARY ACTION — Save Contact (truthful post-delivery hint). */}
      {showActions && (
        <div className="grid gap-2.5 px-5 pb-4">
          <button
            type="button"
            onClick={handleSaveContact}
            disabled={saving || !card.displayName}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--bc-mobile-text)] px-6 text-[15px] font-semibold text-[var(--bc-mobile-surface)] transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
          >
            {saving ? (
              <Loader2
                aria-hidden="true"
                className="h-4 w-4 animate-spin motion-reduce:animate-none"
                strokeWidth={1.8}
              />
            ) : (
              <Download aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            )}
            {t("bc.public.saveContact")}
          </button>
          <div aria-live="polite">
            {delivered && !saveError && (
              <p className="text-center text-[12.5px] text-[var(--bc-mobile-muted)]">
                {t("bc.publicIdentity.saveContactHint")}
              </p>
            )}
            {saveError && (
              <p role="alert" className="text-center text-[12.5px] text-[var(--bc-mobile-muted)]">
                {t("bc.mobile.me.saveContactError")}
              </p>
            )}
          </div>
          {onShare && (
            <button
              type="button"
              onClick={onShare}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-6 text-[14px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
            >
              <Share2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              {t("bc.publicIdentity.shareCard")}
            </button>
          )}
        </div>
      )}

      {/* 4. QUICK CONTACT ACTIONS — adaptive 1–3, safe-href gated. */}
      {hasQuickAction && (
        <div
          role="group"
          aria-label={t("bc.publicIdentity.contactActions")}
          className="flex gap-2 border-t border-[var(--bc-mobile-border)] px-5 py-4"
        >
          {telHref && (
            <a
              href={telHref}
              className={QUICK_ACTION_CLASS}
              onClick={() => reportIdentityMetric("PUBLIC_CARD_CALL_TAPPED")}
            >
              <Phone aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.8} />
              {t("bc.public.call")}
            </a>
          )}
          {mailtoHref && (
            <a
              href={mailtoHref}
              className={QUICK_ACTION_CLASS}
              onClick={() => reportIdentityMetric("PUBLIC_CARD_EMAIL_TAPPED")}
            >
              <Mail aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.8} />
              {t("bc.public.email")}
            </a>
          )}
          {webHref && (
            <a
              href={webHref}
              target="_blank"
              rel="noreferrer noopener"
              className={QUICK_ACTION_CLASS}
              onClick={() => reportIdentityMetric("PUBLIC_CARD_WEBSITE_TAPPED")}
            >
              <Globe aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.8} />
              {t("bc.public.website")}
            </a>
          )}
        </div>
      )}

      {/* 5. BIO — restrained, progressive disclosure for long text. */}
      {bio && (
        <div className="border-t border-[var(--bc-mobile-border)] px-6 py-4">
          <p
            className={`whitespace-pre-line break-words text-[13.5px] leading-relaxed text-[var(--bc-mobile-muted)] ${
              bioCollapsible && !bioOpen ? "line-clamp-4" : ""
            }`}
          >
            {bio}
          </p>
          {bioCollapsible && (
            <button
              type="button"
              onClick={() => setBioOpen((v) => !v)}
              className="mt-1.5 min-h-11 text-[13px] font-medium text-[var(--bc-mobile-text)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
            >
              {bioOpen ? t("bc.publicIdentity.bioLess") : t("bc.publicIdentity.bioMore")}
            </button>
          )}
        </div>
      )}

      {/* 6. CONTACT DETAILS — values + secondary channels. */}
      {hasDetails && (
        <ul className="grid gap-1 border-t border-[var(--bc-mobile-border)] px-5 py-4">
          {mailtoHref && card.primaryEmail && (
            <li>
              <a href={mailtoHref} className={DETAIL_ROW_CLASS}>
                <Mail
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-[var(--bc-mobile-muted)]"
                  strokeWidth={1.8}
                />
                <span className="min-w-0 break-all">{card.primaryEmail}</span>
              </a>
            </li>
          )}
          {telHref && card.primaryPhone && (
            <li>
              <a href={telHref} className={DETAIL_ROW_CLASS}>
                <Phone
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-[var(--bc-mobile-muted)]"
                  strokeWidth={1.8}
                />
                <span className="min-w-0 break-all">{card.primaryPhone}</span>
              </a>
            </li>
          )}
          {webHref && (
            <li>
              <a
                href={webHref}
                target="_blank"
                rel="noreferrer noopener"
                className={DETAIL_ROW_CLASS}
              >
                <Globe
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-[var(--bc-mobile-muted)]"
                  strokeWidth={1.8}
                />
                <span className="min-w-0 break-all">{webDisplay(webHref)}</span>
              </a>
            </li>
          )}
          {linkedinHref && (
            <li>
              <a
                href={linkedinHref}
                target="_blank"
                rel="noreferrer noopener"
                className={DETAIL_ROW_CLASS}
                onClick={() => reportIdentityMetric("PUBLIC_CARD_SOCIAL_TAPPED")}
              >
                <Linkedin
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-[var(--bc-mobile-muted)]"
                  strokeWidth={1.8}
                />
                <span className="min-w-0 break-all">LinkedIn</span>
              </a>
            </li>
          )}
          {(card.address || card.city) && (
            <li className="flex min-h-[44px] items-center gap-3 px-2 text-[14px] text-[var(--bc-mobile-muted)]">
              <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.8} />
              <span className="min-w-0 break-words">
                {[card.address, card.city].filter(Boolean).join(", ")}
              </span>
            </li>
          )}
        </ul>
      )}
    </article>
  );
}
