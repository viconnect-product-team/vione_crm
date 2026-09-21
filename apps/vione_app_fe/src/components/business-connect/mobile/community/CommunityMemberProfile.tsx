// BC-Mobile-7A — Community member profile (privacy-safe).
// Shows base member fields + owner-published card fields ONLY. The connect CTA
// goes through the frozen 5E handshake (server resolves the platform identity;
// the client never sees user ids). Never renders email/phone/address.

import { Link } from "@tanstack/react-router";
import { CalendarDays, Globe, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useRef } from "react";
import { useLang, useT } from "@/lib/i18n";
import { useCommunityMemberProfile } from "@/hooks/use-community";
import { reportCommunityMetric } from "@/lib/business-connect/mobile/community.telemetry";
import { BusinessConnectTopBar } from "../BusinessConnectTopBar";
import { CommunityError, CommunityListSkeleton } from "./CommunityHome";

export function CommunityMemberProfile({
  communityId,
  memberRef,
}: {
  communityId: string;
  memberRef: string;
}) {
  const t = useT();
  const { profile, unavailable, initialLoading, coreError, retry, connect } =
    useCommunityMemberProfile(communityId, memberRef);
  const opened = useRef(false);

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    reportCommunityMetric("COMMUNITY_MEMBER_PROFILE_OPENED");
  }, []);

  return (
    <>
      <BusinessConnectTopBar back title={t("bc.mobile.community.members")} />
      <main id="bc-mobile-community-member" className="contents">
        {initialLoading ? (
          <div className="mt-4">
            <CommunityListSkeleton />
          </div>
        ) : coreError ? (
          <CommunityError onRetry={retry} />
        ) : unavailable || !profile ? (
          <section className="mt-14">
            <p className="max-w-[34ch] text-[15px] leading-relaxed text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.community.member.unavailable")}
            </p>
          </section>
        ) : (
          <>
            <section className="mt-6 flex flex-col items-center text-center">
              {profile.member.avatarUrl ? (
                <img
                  src={profile.member.avatarUrl}
                  alt=""
                  className="h-24 w-24 rounded-full border border-[var(--bc-mobile-border)] object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="grid h-24 w-24 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)]"
                >
                  <UserRound
                    className="h-10 w-10 text-[var(--bc-mobile-muted)]"
                    strokeWidth={1.4}
                  />
                </div>
              )}
              <h1 className="mt-4 text-[24px] font-semibold leading-tight tracking-tight text-[var(--bc-mobile-text)]">
                {profile.member.displayName}
              </h1>
              {profile.member.jobTitle || profile.member.companyName ? (
                <p className="mt-1 text-[14px] text-[var(--bc-mobile-muted)]">
                  {[profile.member.jobTitle, profile.member.companyName]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
              <p className="mt-2 text-[12px] text-[var(--bc-mobile-muted)]">
                {profile.communityName}
                {profile.regionLabel ? ` · ${profile.regionLabel}` : ""}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3 py-1 text-[12px] font-medium text-[var(--bc-mobile-text)]">
                <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.6} />
                {t(
                  profile.member.role === "admin"
                    ? "bc.mobile.community.role.admin"
                    : "bc.mobile.community.role.member",
                )}
              </span>
            </section>

            <ConnectionCta
              state={profile.connection.state}
              canConnect={profile.canConnect}
              busy={connect.isPending}
              failed={connect.isError}
              communityId={communityId}
              onConnect={() => {
                reportCommunityMetric("COMMUNITY_CONNECT_OPENED");
                connect.mutate(undefined, {
                  onSuccess: () => reportCommunityMetric("COMMUNITY_CONNECT_SENT"),
                  onError: () => reportCommunityMetric("COMMUNITY_CONNECT_FAILED"),
                });
              }}
            />

            {profile.headline ? (
              <p className="mt-6 text-center text-[15px] font-medium leading-relaxed text-[var(--bc-mobile-text)]">
                {profile.headline}
              </p>
            ) : null}

            {profile.bio ? (
              <p className="mt-4 text-[14px] leading-relaxed text-[var(--bc-mobile-muted)]">
                {profile.bio}
              </p>
            ) : null}

            {profile.website ? (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex min-h-[52px] items-center gap-3 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-4 transition-colors duration-150 hover:bg-[var(--bc-mobile-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
              >
                <Globe
                  aria-hidden="true"
                  className="h-4.5 w-4.5 shrink-0 text-[var(--bc-mobile-navy)]"
                  strokeWidth={1.6}
                />
                <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[var(--bc-mobile-text)]">
                  {profile.website.replace(/^https?:\/\//, "")}
                </span>
              </a>
            ) : null}

            <MembershipHistory entries={profile.history} />
          </>
        )}
      </main>
    </>
  );
}

function MembershipHistory({
  entries,
}: {
  entries: {
    communityId: string;
    communityName: string;
    joinedAt: string | null;
    role: string;
    isCurrent: boolean;
  }[];
}) {
  const t = useT();
  const { lang } = useLang();
  const locale = lang === "en" ? "en-US" : "vi-VN";

  return (
    <section className="mt-7">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.community.member.history.title")}
      </h2>
      {entries.length === 0 ? (
        <p className="mt-3 text-[14px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.community.member.history.empty")}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {entries.map((e: any) => (
            <li
              key={e.communityId}
              className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-[var(--bc-mobile-text)]">
                    {e.communityName}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--bc-mobile-muted)]">
                    <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.6} />
                    {e.joinedAt
                      ? `${t("bc.mobile.community.member.history.joined")} ${new Date(e.joinedAt).toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" })}`
                      : t("bc.mobile.community.member.history.unknownDate")}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-[var(--bc-mobile-border)] px-2.5 py-1 text-[11px] font-medium text-[var(--bc-mobile-muted)]">
                  {t(
                    e.role === "admin"
                      ? "bc.mobile.community.role.admin"
                      : "bc.mobile.community.role.member",
                  )}
                </span>
              </div>
              {e.isCurrent ? (
                <p className="mt-2 text-[11px] font-medium text-[var(--bc-mobile-navy)]">
                  {t("bc.mobile.community.member.history.current")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ConnectionCta({
  state,
  canConnect,
  busy,
  failed,
  communityId: _communityId,
  onConnect,
}: {
  state: string;
  canConnect: boolean;
  busy: boolean;
  failed: boolean;
  communityId: string;
  onConnect: () => void;
}) {
  const t = useT();

  if (state === "self" || state === "unavailable") return null;

  if (state === "connected") {
    return (
      <p className="mt-5 text-center text-[13px] font-medium text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.community.connected")}
      </p>
    );
  }
  if (state === "outgoing_pending") {
    return (
      <p className="mt-5 text-center text-[13px] font-medium text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.community.requestSent")}
      </p>
    );
  }
  if (state === "incoming_pending") {
    return (
      <div className="mt-5 text-center">
        <Link
          to="/connect-app/network/requests"
          className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--bc-mobile-navy)] px-5 text-[14px] font-medium text-[var(--bc-mobile-navy)] transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
        >
          {t("bc.mobile.community.requestReceived")}
        </Link>
      </div>
    );
  }

  if (!canConnect) return null;

  return (
    <div className="mt-5 flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onConnect}
        disabled={busy}
        className="inline-flex min-h-[46px] items-center rounded-full bc-cta-gold px-6 text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60 motion-reduce:transition-none"
      >
        {busy ? t("bc.mobile.community.connect.sending") : t("bc.mobile.community.connect")}
      </button>
      {failed ? (
        <p role="alert" className="text-[12px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.community.connect.failed")}
        </p>
      ) : null}
    </div>
  );
}
