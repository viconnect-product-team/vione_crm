// BC-3.1D — Business Profile connect actions.
// Reusable, viewer-aware relationship control for the public Business Profile
// (/b/$slug). Renders lifecycle actions from the composed viewer-safe state and
// never exposes owner ids or raw connection data. Save Card and Connect are
// independent surfaces. Accessible: labelled group, aria-live status, confirm
// dialogs (focus-trapped) for destructive actions.

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Clock, Loader2, UserPlus, X } from "lucide-react";
import { ConfirmDialog } from "@/components/member/ConfirmDialog";
import { useBusinessProfileRelationship } from "@/hooks/use-profile-connect";
import { useT, type TKey } from "@/lib/i18n";

const STATUS_TKEY: Partial<Record<string, TKey>> = {
  pending_sent: "connect.profile.status.pendingSent",
  pending_received: "connect.profile.status.pendingReceived",
  connected: "connect.profile.status.connected",
  blocked: "connect.profile.status.blocked",
  self: "connect.profile.status.self",
  unavailable: "connect.profile.status.unavailable",
};

const btnBase =
  "inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vba-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--vba-bg-2)] disabled:opacity-60";
const btnGold = `${btnBase} vba-gold-grad text-[var(--vba-bg)]`;
const btnGhost = `${btnBase} border border-[var(--vba-line)] text-[var(--vba-text)] hover:bg-[var(--vba-bg-3)]`;
const btnDanger = `${btnBase} border border-destructive/40 text-destructive hover:bg-destructive/10`;

export function BusinessProfileRelationshipActions({ cardSlug }: { cardSlug: string }) {
  const t = useT();
  const { state, loading, pending, actions } = useBusinessProfileRelationship(cardSlug);
  const [confirm, setConfirm] = useState<null | "disconnect" | "decline">(null);

  if (loading) {
    return (
      <div className="mt-4 h-9" aria-hidden="true">
        <div className="h-9 w-40 animate-pulse rounded-xl bg-[var(--vba-bg-3)]" />
      </div>
    );
  }

  const es = state.effectiveState;
  if (es === "self") return null;

  const busy = pending !== null;
  const statusKey = STATUS_TKEY[es];

  return (
    <section
      className="mt-4"
      role="group"
      aria-label={t("connect.profile.section.title")}
      aria-busy={busy}
    >
      {es === "anonymous" && (
        <Link to="/auth" search={{ redirect: `/b/${cardSlug}` }} className={btnGold}>
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {t("connect.profile.action.signIn")}
        </Link>
      )}

      {es === "none" && (
        <button type="button" className={btnGold} disabled={busy} onClick={() => actions.connect()}>
          {pending === "connect" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <UserPlus className="h-4 w-4" aria-hidden="true" />
          )}
          {t("connect.profile.action.connect")}
        </button>
      )}

      {es === "pending_sent" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--vba-text-muted)]">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {t("connect.profile.status.pendingSent")}
          </span>
          <button
            type="button"
            className={btnGhost}
            disabled={busy}
            onClick={() => actions.cancel()}
          >
            {pending === "cancel" && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {t("connect.profile.action.cancel")}
          </button>
        </div>
      )}

      {es === "pending_received" && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={btnGold}
            disabled={busy}
            onClick={() => actions.accept()}
          >
            {pending === "accept" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="h-4 w-4" aria-hidden="true" />
            )}
            {t("connect.profile.action.accept")}
          </button>
          <button
            type="button"
            className={btnGhost}
            disabled={busy}
            onClick={() => setConfirm("decline")}
          >
            {pending === "decline" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <X className="h-4 w-4" aria-hidden="true" />
            )}
            {t("connect.profile.action.decline")}
          </button>
        </div>
      )}

      {es === "connected" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--vba-gold)]">
            <Check className="h-4 w-4" aria-hidden="true" />
            {t("connect.profile.status.connected")}
          </span>
          <button
            type="button"
            className={btnDanger}
            disabled={busy}
            onClick={() => setConfirm("disconnect")}
          >
            {pending === "disconnect" && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {t("connect.profile.action.disconnect")}
          </button>
        </div>
      )}

      {(es === "blocked" || es === "unavailable") && statusKey && (
        <p className="text-[13px] text-[var(--vba-text-muted)]">{t(statusKey)}</p>
      )}

      {/* Accessible live status for assistive tech. */}
      <p className="sr-only" role="status" aria-live="polite">
        {busy ? t("connect.profile.aria.busy") : statusKey ? t(statusKey) : ""}
      </p>

      <ConfirmDialog
        open={confirm === "disconnect"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t("connect.profile.confirm.disconnect.title")}
        description={t("connect.profile.confirm.disconnect.desc")}
        confirmLabel={t("connect.profile.action.disconnect")}
        destructive
        onConfirm={() => {
          setConfirm(null);
          void actions.disconnect();
        }}
      />
      <ConfirmDialog
        open={confirm === "decline"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t("connect.profile.confirm.decline.title")}
        description={t("connect.profile.confirm.decline.desc")}
        confirmLabel={t("connect.profile.action.decline")}
        destructive
        onConfirm={() => {
          setConfirm(null);
          void actions.decline();
        }}
      />
    </section>
  );
}
