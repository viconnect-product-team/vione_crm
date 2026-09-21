// BC-Mobile-2B — one Network person row (Executive Minimal Luxury, ViOne).
//
// Presentation-only row over the FROZEN 2A contracts: avatar (with a quiet
// recency dot derived from the SAME canonical context timestamp), name,
// title · company, one relationship tag, and one right-aligned relationship
// signal (relative time + what it refers to). The whole row is exactly one
// navigable Link to Person Detail; the trailing glyph is decorative.

import { Link } from "@tanstack/react-router";
import { CalendarDays, Check, Clock, Loader2, MoreVertical, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { useFmt, useT, type TKey } from "@/lib/i18n";
import { useState } from "react";
import { useNetworkRowConnect } from "@/hooks/use-network-row-connect";
import { ConnectConfirmDialog } from "./ConnectConfirmDialog";
import { avatarOrDemo, demoAvatar } from "@/lib/business-connect/mobile/demo-avatars";
import type { BcMobileNetworkPerson } from "@/hooks/use-business-connect-network";

function initialsOf(name: string | null): string | null {
  if (!name) return null;
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || null;
}

const TAG_KEY: Record<string, TKey> = {
  connected: "bc.mobile.network.tag.connected",
  contact_shared: "bc.mobile.network.tag.shared",
  card_scanned: "bc.mobile.network.tag.scanned",
  saved_card: "bc.mobile.network.tag.saved",
};

const SIGNAL_KEY: Record<string, TKey> = {
  connected: "bc.mobile.network.signal.connected",
  contact_shared: "bc.mobile.network.signal.shared",
  card_scanned: "bc.mobile.network.signal.scanned",
  saved_card: "bc.mobile.network.signal.saved",
};

export function NetworkPersonRow({ person }: { person: BcMobileNetworkPerson }) {
  const t = useT();
  const fmt = useFmt();
  const name = person.displayName ?? t("bc.mobile.network.unknownPerson");
  const initials = initialsOf(person.displayName);
  const titleCompany = [person.headline, person.companyName].filter(Boolean).join(" · ");

  const kind = person.context?.kind ?? null;
  const at = person.context?.at ?? null;
  const tagKey = kind ? (TAG_KEY[kind] ?? null) : null;
  const signalKey = kind ? (SIGNAL_KEY[kind] ?? null) : null;
  const isOnline = Boolean((person as any)?.isOnline);
  const SignalIcon = kind === "connected" ? CalendarDays : Clock;

  return (
    <li>
      <Link
        to="/connect-app/network/$personId"
        params={{ personId: person.personId }}
        aria-label={name}
        className="flex min-h-[92px] items-center gap-3.5 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-3.5 py-3.5 transition-[background-color,transform,border-color] duration-150 ease-out active:scale-[0.995] active:bg-[var(--bc-mobile-surface-2)] hover:border-[var(--bc-mobile-accent)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        <span className="relative shrink-0">
          {person.avatarUrl ? (
            <img
              src={person.avatarUrl}
              alt=""
              loading="lazy"
              className="rounded-full object-cover ring-1 ring-[var(--bc-mobile-border)]"
              style={{ height: "56px", width: "56px" }}
            />
          ) : (
            <span
              aria-hidden="true"
              className="grid place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[16px] font-semibold text-[var(--bc-mobile-text)] ring-1 ring-[var(--bc-mobile-border)]"
              style={{ height: "56px", width: "56px" }}
            >
              {initials ?? "•"}
            </span>
          )}
          {isOnline && (
            <span
              aria-label="Đang trực tuyến"
              className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full ring-2 ring-[var(--bc-mobile-surface)] bg-[var(--bc-mobile-success,#22c55e)]"
            />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-semibold leading-snug text-[var(--bc-mobile-text)]">
            {name}
          </span>
          {titleCompany ? (
            <span className="mt-0.5 block truncate text-[13px] text-[var(--bc-mobile-muted)]">
              {titleCompany}
            </span>
          ) : null}
          {tagKey ? (
            <span className="mt-2 inline-flex max-w-full items-center truncate rounded-full border border-[var(--bc-mobile-accent)]/45 px-2.5 py-0.5 text-[11.5px] font-medium text-[var(--bc-mobile-accent)]">
              {t(tagKey)}
            </span>
          ) : null}
        </span>

        {at && signalKey ? (
          <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
            <span className="flex items-center gap-1.5">
              <SignalIcon
                aria-hidden="true"
                className="h-4 w-4 text-[var(--bc-mobile-accent)]"
                strokeWidth={1.8}
              />
              <span className="text-[13.5px] font-medium text-[var(--bc-mobile-accent)]">
                {fmt.rel(at)}
              </span>
            </span>
            <span className="text-[12px] text-[var(--bc-mobile-muted)]">{t(signalKey)}</span>
          </span>
        ) : null}

        <MoreVertical
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-[var(--bc-mobile-muted)]"
          strokeWidth={1.8}
        />
      </Link>

      <NetworkRowConnectActions person={person} />
    </li>
  );
}

/**
 * Inline connect actions — one quiet action strip under the row.
 * Truthful states only: invite / withdraw / accept + decline. Established
 * connections and people without a public card slug render nothing.
 */
function NetworkRowConnectActions({ person }: { person: BcMobileNetworkPerson }) {
  const t = useT();
  const eligible = person.relationshipKind !== "connection" && Boolean(person.cardSlug);
  const { state, connect, accept, decline, cancel, busy } = useNetworkRowConnect(
    person.cardSlug,
    eligible,
  );

  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!eligible || state === null) return null;

  const run = (mutation: { mutateAsync: () => Promise<unknown> }, successKey: TKey) => {
    void mutation
      .mutateAsync()
      .then(() => toast.success(t(successKey)))
      .catch(() => toast.error(t("bc.mobile.connection.error")));
  };

  const base =
    "inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-[13.5px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60 motion-reduce:transition-none";
  const primary = `${base} bc-cta-gold`;
  const quiet = `${base} bc-cta-gold-soft`;

  if (state === "none" || state === "saved") {
    return (
      <div className="mt-2 flex gap-2 px-1">
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirmOpen(true)}
          className={primary}
        >
          {busy ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          )}
          {t("bc.mobile.connection.connect")}
        </button>
        <ConnectConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          personLabel={person.displayName}
          busy={busy}
          onConfirm={() => {
            run(connect, "bc.mobile.connection.toast.sent");
            setConfirmOpen(false);
          }}
        />
      </div>
    );
  }

  if (state === "pending_sent") {
    return (
      <div className="mt-2 px-1">
        <p
          aria-live="polite"
          className="mb-1.5 text-[12.5px] text-[var(--bc-mobile-muted)]"
        >
          {t("bc.mobile.connection.status.label")}: {t("bc.mobile.connection.pending")}
        </p>
        <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => run(cancel, "bc.mobile.connection.toast.withdrawn")}
          className={quiet}
        >
          {busy ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          )}
          {t("bc.mobile.connection.withdraw")}
        </button>
        </div>
      </div>
    );
  }

  if (state === "pending_received") {
    return (
      <div className="mt-2 flex gap-2 px-1">
        <button
          type="button"
          disabled={busy}
          onClick={() => run(accept, "bc.mobile.connection.toast.accepted")}
          className={primary}
        >
          <Check aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
          {t("bc.mobile.connection.accept")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run(decline, "bc.mobile.connection.toast.declined")}
          className={quiet}
        >
          {t("bc.mobile.connection.decline")}
        </button>
      </div>
    );
  }

  return null;
}
