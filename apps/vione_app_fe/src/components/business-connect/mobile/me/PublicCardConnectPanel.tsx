// BC-Mobile-5E — Connection Handshake panel on /c/:token.
//
// The PUBLIC card's only interactive relationship surface. Anonymous viewers
// get a sign-in CTA whose continuation is the SAME internal /c/<token> path
// (validated same-origin by the auth route — no open redirect). Authenticated
// viewers see the viewer-relative handshake state resolved server-side from
// the opaque token; the owner id never exists in this bundle.
//
// States: none → Connect | outgoing_pending → Pending + Withdraw |
// incoming_pending → Accept + Decline | connected → quiet status |
// self / unavailable → nothing (neutral).

import { CircleCheck, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { useSessionStatus } from "@/hooks/use-session-status";
import { useIdentityConnection } from "@/hooks/use-identity-connection";
import { reportIdentityMetric } from "@/lib/business-connect/mobile/identity.telemetry";

const PRIMARY_BTN =
  "flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--bc-mobile-text)] px-6 text-[15px] font-semibold text-[var(--bc-mobile-surface)] transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none";
const SECONDARY_BTN =
  "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-4 text-[14px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none";

function failToast(t: ReturnType<typeof useT>) {
  reportIdentityMetric("PUBLIC_CARD_CONNECT_FAILED");
  toast.error(t("bc.mobile.connection.error"));
}

export function PublicCardConnectPanel({ token }: { token: string }) {
  const t = useT();
  const session = useSessionStatus();

  // Hold render until the session is known — never flash the wrong CTA.
  if (session === "checking") return null;

  if (session === "anonymous") {
    // Plain anchor by design: the public recipient page must render outside a
    // router context (shared with router-free previews/tests), and a full
    // navigation into the auth flow is desirable. The continuation is built
    // from the fixed internal prefix + the hex token — never external input.
    return (
      <section className="px-1">
        <a
          href={`/auth?redirect=${encodeURIComponent(`/c/${token}`)}`}
          className={PRIMARY_BTN}
          onClick={() => reportIdentityMetric("PUBLIC_CARD_CONNECT_TAPPED")}
        >
          <UserPlus aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          {t("bc.mobile.connection.signIn")}
        </a>
      </section>
    );
  }

  return <AuthenticatedConnectPanel token={token} />;
}

function AuthenticatedConnectPanel({ token }: { token: string }) {
  const t = useT();
  const { stateQuery, send, accept, decline, withdraw, busy } = useIdentityConnection(token, true);

  // While the state resolves (or the read failed neutrally), render nothing —
  // the card itself is already fully usable.
  const state = stateQuery.data;
  if (!state) return null;
  if (state.state === "self" || state.state === "unavailable") return null;

  if (state.state === "connected") {
    return (
      <section
        aria-label={t("bc.mobile.connection.connected")}
        className="flex items-center justify-center gap-2 px-1 py-1 text-[13.5px] font-medium text-[var(--bc-mobile-muted)]"
      >
        <CircleCheck aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
        {t("bc.mobile.connection.connected")}
      </section>
    );
  }

  if (state.state === "outgoing_pending") {
    return (
      <section className="grid gap-2 px-1">
        <p
          aria-live="polite"
          className="flex items-center justify-center gap-2 py-1 text-[13.5px] font-medium text-[var(--bc-mobile-muted)]"
        >
          <CircleCheck aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          {t("bc.mobile.connection.pending")}
        </p>
        {state.connectionId ? (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              withdraw.mutate(state.connectionId!, {
                onSuccess: () => {
                  reportIdentityMetric("CONNECTION_REQUEST_WITHDRAWN");
                  toast.success(t("bc.mobile.connection.toast.withdrawn"));
                },
                onError: () => failToast(t),
              })
            }
            className={SECONDARY_BTN}
          >
            {withdraw.isPending ? (
              <Loader2
                aria-hidden="true"
                className="h-4 w-4 animate-spin motion-reduce:animate-none"
                strokeWidth={1.8}
              />
            ) : null}
            {t("bc.mobile.connection.withdraw")}
          </button>
        ) : null}
      </section>
    );
  }

  if (state.state === "incoming_pending" && state.connectionId) {
    const connectionId = state.connectionId;
    return (
      <section className="flex gap-2 px-1">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            accept.mutate(connectionId, {
              onSuccess: () => {
                reportIdentityMetric("CONNECTION_REQUEST_ACCEPTED");
                toast.success(t("bc.mobile.connection.toast.accepted"));
              },
              onError: () => failToast(t),
            })
          }
          className={PRIMARY_BTN}
        >
          {accept.isPending ? (
            <Loader2
              aria-hidden="true"
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              strokeWidth={1.8}
            />
          ) : null}
          {t("bc.mobile.connection.accept")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            decline.mutate(connectionId, {
              onSuccess: () => {
                reportIdentityMetric("CONNECTION_REQUEST_DECLINED");
                toast.success(t("bc.mobile.connection.toast.declined"));
              },
              onError: () => failToast(t),
            })
          }
          className={SECONDARY_BTN}
        >
          {t("bc.mobile.connection.decline")}
        </button>
      </section>
    );
  }

  // state === "none" — the primary handshake action.
  return (
    <section className="px-1">
      <button
        type="button"
        disabled={busy}
        aria-label={t("bc.mobile.connection.connectAria")}
        onClick={() => {
          reportIdentityMetric("PUBLIC_CARD_CONNECT_TAPPED");
          send.mutate(undefined, {
            onSuccess: () => {
              reportIdentityMetric("PUBLIC_CARD_CONNECT_SENT");
              toast.success(t("bc.mobile.connection.toast.sent"));
            },
            onError: () => failToast(t),
          });
        }}
        className={PRIMARY_BTN}
      >
        {send.isPending ? (
          <Loader2
            aria-hidden="true"
            className="h-4 w-4 animate-spin motion-reduce:animate-none"
            strokeWidth={1.8}
          />
        ) : (
          <UserPlus aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
        )}
        {t("bc.mobile.connection.connect")}
      </button>
    </section>
  );
}
