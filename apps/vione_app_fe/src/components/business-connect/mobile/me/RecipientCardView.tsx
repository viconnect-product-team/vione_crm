// BC-Mobile-5A/5D — /c/:token recipient experience.
//
// ONE recipient experience for every transport (QR scan, NFC tap, shared
// link): lightweight by design — no authenticated Connect App shell, no
// Network/Journey/Moment widgets, no bottom nav. Renders the privacy-filtered
// DigitalBusinessCard for valid tokens and ONE neutral unavailable state for
// everything else (invalid, revoked, rotated-away, disabled identity) so the
// page never reveals whether a user, identity, or token ever existed.
//
// 5D additions: Share Card (Web Share API → copy fallback), Share Contact
// back (3B Guest Contact Exchange, progressive disclosure), and a discreet
// Business Connect attribution. The opaque token is never rendered.

import { useState } from "react";
import { ShieldOff } from "lucide-react";
import { useT } from "@/lib/i18n";
import { DigitalBusinessCard } from "./DigitalBusinessCard";
import { IdentityShareContactPanel } from "./IdentityShareContactPanel";
import { PublicCardConnectPanel } from "./PublicCardConnectPanel";
import { reportIdentityMetric } from "@/lib/business-connect/mobile/identity.telemetry";
import type { PublicIdentityResult } from "@/lib/business-connect/mobile/identity.types";

export function RecipientCardView({
  result,
  publicUrl,
  token,
}: {
  result: PublicIdentityResult | null;
  publicUrl: string;
  /** Opaque share token — forwarded to the exchange endpoint, never shown. */
  token: string;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  if (!result || result.state !== "public") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[var(--bc-mobile-bg,var(--bc-mobile-surface-2))] px-6 text-center">
        <ShieldOff
          aria-hidden="true"
          className="h-10 w-10 text-[var(--bc-mobile-muted)]"
          strokeWidth={1.5}
        />
        <h1 className="mt-4 text-[19px] font-semibold tracking-tight text-[var(--bc-mobile-text)]">
          {t("bc.public.unavailable.title")}
        </h1>
        <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-[var(--bc-mobile-muted)]">
          {t("bc.public.unavailable.body")}
        </p>
      </main>
    );
  }

  const card = result.card;
  const ownerName = card.displayName ?? t("bc.mobile.me.cardSection.title");

  async function handleShareCard() {
    reportIdentityMetric("PUBLIC_CARD_SHARE_CARD_TAPPED");
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: ownerName, url: publicUrl });
        return;
      }
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // User dismissed the share sheet or clipboard is unavailable — the
      // canonical URL remains on the page; no error surface needed.
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-5 py-10">
      <DigitalBusinessCard
        card={card}
        publicUrl={publicUrl}
        nameAs="h1"
        onShare={() => void handleShareCard()}
      />

      {/* BC-Mobile-5E — explicit handshake. Anonymous viewers get a sign-in
          CTA with same-origin continuation; authenticated viewers see the
          viewer-relative state. Self / unavailable render nothing. */}
      <PublicCardConnectPanel token={token} />

      <div aria-live="polite" className="min-h-4 text-center">
        {copied && (
          <p className="text-[12.5px] text-[var(--bc-mobile-muted)]">
            {t("bc.publicIdentity.copied")}
          </p>
        )}
      </div>

      <IdentityShareContactPanel token={token} ownerName={ownerName} />

      <footer className="mt-4 text-center">
        <p className="text-[12px] text-[var(--bc-mobile-muted)]">
          <a href="/" className="font-medium underline-offset-2 hover:underline">
            Business Connect
          </a>
          <span aria-hidden="true"> · </span>
          {t("bc.publicIdentity.attribution")}
        </p>
        <p className="mt-1">
          <a
            href="/"
            className="inline-flex min-h-11 items-center text-[12px] text-[var(--bc-mobile-muted)] underline-offset-2 hover:underline"
          >
            {t("bc.publicIdentity.createYours")}
          </a>
        </p>
      </footer>
    </main>
  );
}
