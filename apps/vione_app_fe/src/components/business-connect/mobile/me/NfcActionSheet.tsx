// Contextual NFC entry point for the Me quick-action row.
//
// A physical NFC tap can mean two different things: reading SOMEONE ELSE's
// card/badge (→ connection request, BC-Mobile-5E) or writing MY OWN share
// link onto a tag (→ NFC writer, BC-Mobile-5B). The row cannot guess, so this
// sheet asks once and routes to the canonical flow — no new backend behavior.

import { useEffect, useState } from "react";
import { ChevronRight, Nfc, Radio, UserPlus } from "lucide-react";
import { useT } from "@/lib/i18n";
import { MeSheet } from "./MeSheet";
import { detectNfcCapability } from "@/lib/nfc/capability";

const OPTION =
  "flex w-full items-center gap-3 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-4 py-3.5 text-left transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none";

export function NfcActionSheet({
  onConnect,
  onShare,
  onClose,
}: {
  onConnect: () => void;
  onShare: () => void;
  onClose: () => void;
}) {
  const t = useT();
  // Capability is detected after hydration — SSR has no navigator.
  const [nfcAvailable, setNfcAvailable] = useState(true);
  useEffect(() => {
    setNfcAvailable(detectNfcCapability() !== "UNSUPPORTED");
  }, []);

  return (
    <MeSheet
      title={t("bc.mobile.me.nfc.choose.title")}
      subtitle={t("bc.mobile.me.nfc.choose.subtitle")}
      onClose={onClose}
    >
      <div className="grid gap-2.5 pb-2">
        <button type="button" onClick={onConnect} className={OPTION}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-accent)]">
            <UserPlus aria-hidden="true" className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-[var(--bc-mobile-text)]">
              {t("bc.mobile.me.nfc.choose.connect.title")}
            </span>
            <span className="mt-0.5 block text-[12.5px] leading-snug text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.me.nfc.choose.connect.desc")}
            </span>
          </span>
          <ChevronRight
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-[var(--bc-mobile-muted)]"
            strokeWidth={1.8}
          />
        </button>

        <button type="button" onClick={onShare} className={OPTION}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-accent)]">
            <Radio aria-hidden="true" className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-[var(--bc-mobile-text)]">
              {t("bc.mobile.me.nfc.choose.share.title")}
            </span>
            <span className="mt-0.5 block text-[12.5px] leading-snug text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.me.nfc.choose.share.desc")}
            </span>
          </span>
          <ChevronRight
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-[var(--bc-mobile-muted)]"
            strokeWidth={1.8}
          />
        </button>

        {/* Real capability detection — never promise a tap the device can't do. */}
        {!nfcAvailable && (
          <p className="flex items-start gap-2 rounded-2xl bg-[var(--bc-mobile-surface-2)] px-4 py-3 text-[12.5px] leading-snug text-[var(--bc-mobile-muted)]">
            <Nfc aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} />
            {t("bc.mobile.me.nfc.choose.unsupported")}
          </p>
        )}
      </div>
    </MeSheet>
  );
}
