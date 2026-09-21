import { useEffect, useMemo, useState } from "react";
import { REVIEW_SEARCH_RESET } from "@/lib/review-search";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Building2,
  Check,
  Mail,
  MapPin,
  MessageSquare,
  ShoppingBag,
  Star,
  User,
  UserPlus,
  UserX,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useT, type TKey } from "@/lib/i18n";
import { EmptyState } from "@/components/dashboard/StateKit";
import type { Member } from "@/lib/members-data";
import { hydrateMembers } from "@/lib/members-data";
import { fetchNestApi } from "@/lib/api-client";
import {
  acceptRequest,
  cancelRequest,
  declineRequest,
  disconnect,
  getStatus,
  listSuggestions,
  refreshFromDb,
  sendRequest,
  subscribe,
  type ConnectionStatus,
} from "@/lib/networking-data";

const statusLabel: Record<ConnectionStatus, TKey> = {
  connected: "m360.net.status.connected",
  pending_outgoing: "m360.net.status.pending_outgoing",
  pending_incoming: "m360.net.status.pending_incoming",
  none: "m360.net.status.none",
};

const statusTone: Record<ConnectionStatus, string> = {
  connected: "bg-success/15 text-success",
  pending_outgoing: "bg-warning/15 text-warning",
  pending_incoming: "bg-primary/10 text-primary",
  none: "bg-secondary text-muted-foreground",
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .slice(-2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function StatusPill({ status }: { status: ConnectionStatus }) {
  const t = useT();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {t(statusLabel[status])}
    </span>
  );
}

/** Inline, permission-aware connection actions reusing the network store. */
function ConnectButtons({ member, compact = false }: { member: Member; compact?: boolean }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const status = getStatus(member.id);

  const run = async (fn: () => Promise<void> | void, okMsg?: string) => {
    setBusy(true);
    try {
      await fn();
      if (okMsg) toast.success(okMsg);
    } catch {
      toast.error(t("net.toast.actionFailed"));
    } finally {
      setBusy(false);
    }
  };

  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60";
  const primary = `${base} text-primary-foreground`;
  const ghost = `${base} border border-border bg-background text-foreground hover:bg-muted`;

  if (status === "connected") {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => run(() => disconnect(member.id))}
        className={`${ghost} text-destructive`}
      >
        <UserX className="h-3.5 w-3.5" />
        {t("net.action.disconnect")}
      </button>
    );
  }
  if (status === "pending_outgoing") {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => run(() => cancelRequest(member.id))}
        className={ghost}
      >
        <X className="h-3.5 w-3.5" />
        {t("net.action.cancel")}
      </button>
    );
  }
  if (status === "pending_incoming") {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => acceptRequest(member.id), t("net.action.accept"))}
          className={primary}
          style={{ background: "var(--gradient-primary)" }}
        >
          <Check className="h-3.5 w-3.5" />
          {t("net.action.accept")}
        </button>
        {!compact && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => declineRequest(member.id))}
            className={`${ghost} text-destructive`}
          >
            <X className="h-3.5 w-3.5" />
            {t("net.action.decline")}
          </button>
        )}
      </div>
    );
  }
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => run(() => sendRequest(member.id))}
      className={primary}
      style={{ background: "var(--gradient-primary)" }}
    >
      <UserPlus className="h-3.5 w-3.5" />
      {t("net.action.connect")}
    </button>
  );
}

/**
 * Premium networking / relationship experience for the Member 360 profile.
 * Reuses the existing network store + server functions and only derives
 * insights from data already loaded on the page. No new APIs.
 */
export function MemberNetworking({
  member,
  currentUserId,
  interactionsCount,
  eventsCount,
  reviewsCount,
  opportunitiesCount,
}: {
  member: Member;
  currentUserId: string;
  interactionsCount: number;
  eventsCount: number;
  reviewsCount: number;
  opportunitiesCount: number;
}) {
  const t = useT();
  const navigate = useNavigate();
  const [, force] = useState(0);

  // Keep the local card state in sync with the shared network store.
  useEffect(() => {
    const unsub = subscribe(() => force((x) => x + 1));
    return () => {
      unsub();
    };
  }, []);

  // Hydrate members + network state client-side (reuses existing server fns).
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const members = await fetchNestApi<Member[]>("/members");
        if (active && Array.isArray(members)) hydrateMembers(members);
      } catch {
        /* non-fatal: suggestions simply stay empty */
      }
      await refreshFromDb();
    })();
    return () => {
      active = false;
    };
  }, []);

  const isSelf = member.id === currentUserId;
  const profileStatus = getStatus(member.id);

  const suggestions = useMemo(
    () =>
      listSuggestions()
        .filter((m) => m.id !== member.id)
        .slice(0, 6),
    // Re-run whenever the store changes via the force counter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [member.id, profileStatus],
  );

  const insights = [
    { icon: MessageSquare, label: t("m360.net.insight.interactions"), value: interactionsCount },
    { icon: Star, label: t("m360.net.insight.reviews"), value: reviewsCount },
    { icon: MapPin, label: t("m360.net.insight.events"), value: eventsCount },
    { icon: ShoppingBag, label: t("m360.net.insight.opportunities"), value: opportunitiesCount },
  ];

  const goMessage = () => navigate({ to: "/network", search: { peer: member.id } });

  return (
    <div className="space-y-5">
      {/* Relationship + insights */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-foreground">{t("m360.net.relationship")}</h3>
          {isSelf ? (
            <span className="text-xs text-muted-foreground">{t("m360.net.self")}</span>
          ) : (
            <StatusPill status={profileStatus} />
          )}
        </div>

        {!isSelf && (
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={goMessage}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {t("net.action.message")}
            </button>
            <a
              href={`mailto:${member.email}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <Mail className="h-3.5 w-3.5" />
              {t("detail.email")}
            </a>
            <ConnectButtons member={member} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {insights.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.label} className="rounded-xl border border-border bg-secondary/30 p-3">
                <Icon className="mb-2 h-4 w-4 text-primary" />
                <div className="text-xl font-bold text-foreground">{it.value}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{it.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Suggested connections */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <h3 className="mb-4 text-base font-semibold text-foreground">
          {t("m360.net.suggestions")}
        </h3>
        {suggestions.length === 0 ? (
          <EmptyState
            icon={<UserPlus className="h-6 w-6" />}
            title={t("m360.net.emptySuggestions")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="flex flex-col rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-sm font-bold text-primary-foreground"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {initialsOf(s.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/members/$memberId"
                      params={{ memberId: s.id }}
                      search={REVIEW_SEARCH_RESET}
                      className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                    >
                      {s.name}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      {s.type === "company" ? (
                        <Building2 className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      <span className="truncate">{s.contact || t(s.level)}</span>
                    </div>
                  </div>
                  <StatusPill status={getStatus(s.id)} />
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground">
                    {t(s.level)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground">
                    <MapPin className="h-2.5 w-2.5" />
                    {t(s.region)}
                  </span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground">
                    {t(s.industry)}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <Link
                    to="/members/$memberId"
                    params={{ memberId: s.id }}
                    search={REVIEW_SEARCH_RESET}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    <User className="h-3.5 w-3.5" />
                    {t("m360.net.viewProfile")}
                  </Link>
                  <ConnectButtons member={s} compact />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
