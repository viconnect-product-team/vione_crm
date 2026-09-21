// BC-Mobile-7B — Community Event Detail.
// Canonical fields only (the events domain has no time/description/agenda —
// never fabricated). One primary action: Đăng ký (canonical registration via
// the validated server adapter). Registered viewers get the canonical
// /m/checkin handoff. No attendee directory, no feed.

import { Link } from "@tanstack/react-router";
import { CalendarDays, Handshake, MapPin, QrCode, Tag, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFmt, useT } from "@/lib/i18n";
import { useCommunityEventDetail } from "@/hooks/use-community-activity";
import { reportCommunityMetric } from "@/lib/business-connect/mobile/community.telemetry";
import { BusinessConnectTopBar } from "../BusinessConnectTopBar";
import { CommunityError } from "./CommunityHome";
import { ActivityListSkeleton, EventStateChips } from "./CommunityEvents";

export function CommunityEventDetail({
  communityId,
  eventRef,
}: {
  communityId: string;
  eventRef: string;
}) {
  const t = useT();
  const fmt = useFmt();
  const { detail, unavailable, initialLoading, coreError, retry, register, cancelRegistration } =
    useCommunityEventDetail(communityId, eventRef);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const opened = useRef(false);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    reportCommunityMetric("COMMUNITY_EVENT_OPENED");
  }, []);

  useEffect(() => {
    if (register.isSuccess) {
      reportCommunityMetric("COMMUNITY_EVENT_REGISTERED");
      statusRef.current?.focus();
    }
  }, [register.isSuccess]);

  useEffect(() => {
    if (cancelRegistration.isSuccess) {
      setConfirmCancel(false);
      statusRef.current?.focus();
    }
  }, [cancelRegistration.isSuccess]);

  const cancelErrorKey = cancelRegistration.isError
    ? cancelRegistration.error instanceof Error &&
      cancelRegistration.error.message.includes("community_event_cancel_closed")
      ? "bc.mobile.community.events.cancelClosed"
      : "bc.mobile.community.events.cancelFailed"
    : null;

  const onRegister = () => {
    reportCommunityMetric("COMMUNITY_EVENT_REGISTER_SELECTED");
    register.mutate();
  };

  const registerErrorKey = register.isError
    ? register.error instanceof Error && register.error.message.includes("community_event_full")
      ? "bc.mobile.community.events.registerFull"
      : register.error instanceof Error &&
          register.error.message.includes("community_event_registration_closed")
        ? "bc.mobile.community.events.registerClosed"
        : register.error instanceof Error &&
            register.error.message.includes("community_event_register_unavailable")
          ? "bc.mobile.community.events.registerFailed"
          : "bc.mobile.community.events.registerFailed"
    : null;

  return (
    <>
      <BusinessConnectTopBar back title={t("bc.mobile.community.events.title")} />
      <main id="bc-mobile-community-event-detail" className="contents">
        {initialLoading ? (
          <div className="mt-4">
            <ActivityListSkeleton rows={3} />
          </div>
        ) : coreError ? (
          <CommunityError onRetry={retry} />
        ) : unavailable || !detail ? (
          <section className="mt-14 flex flex-col items-center text-center px-4">
            <p className="max-w-[34ch] text-[15px] leading-relaxed text-[var(--bc-mobile-muted)]">
              Sự kiện hiện không khả dụng hoặc đã kết thúc.
            </p>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="mt-5 inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] px-6 py-2.5 text-[14px] font-bold text-[#050c15] shadow-md shadow-[#D8B282]/25 cursor-pointer"
            >
              Quay lại danh sách sự kiện
            </button>
          </section>
        ) : (
          <>
            <header className="mt-5">
              <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-[var(--bc-mobile-text)]">
                {detail.event.title}
              </h1>
              <p className="mt-1.5 text-[14px] text-[var(--bc-mobile-muted)]">
                <time dateTime={detail.event.startAt}>{fmt.date(detail.event.startAt)}</time>
                {detail.event.locationLabel ? ` · ${detail.event.locationLabel}` : ""}
              </p>
              <div className="mt-2">
                <EventStateChips event={detail.event} />
              </div>
            </header>

            {/* Primary action area — one clear action only. */}
            <section className="mt-5" aria-label={t("bc.mobile.community.events.register")}>
              <p ref={statusRef} tabIndex={-1} role="status" aria-live="polite" className="sr-only">
                {cancelRegistration.isSuccess
                  ? t("bc.mobile.community.events.cancelSuccess")
                  : register.isSuccess
                    ? t("bc.mobile.community.events.registerSuccess")
                    : ""}
              </p>
              {detail.event.registrationState === "registered" ? (
                <>
                  <Link
                    to="/m/checkin"
                    className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-4 transition-colors duration-150 hover:bg-[var(--bc-mobile-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
                  >
                    <QrCode
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 text-[var(--bc-mobile-navy)]"
                      strokeWidth={1.6}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-medium text-[var(--bc-mobile-text)]">
                        {t("bc.mobile.community.events.checkin")}
                      </span>
                      <span className="block text-[12px] text-[var(--bc-mobile-muted)]">
                        {t("bc.mobile.community.events.checkinDesc")}
                      </span>
                    </span>
                  </Link>
                  {confirmCancel ? (
                    <div className="mt-3 rounded-2xl border border-[var(--bc-mobile-border)] p-4">
                      <p className="text-[13.5px] text-[var(--bc-mobile-text)]">
                        {t("bc.mobile.community.events.cancelConfirm")}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmCancel(false)}
                          disabled={cancelRegistration.isPending}
                          className="min-h-11 flex-1 rounded-full border border-[var(--bc-mobile-border)] text-[14px] font-medium text-[var(--bc-mobile-text)] disabled:opacity-60"
                        >
                          {t("bc.mobile.community.events.cancelKeep")}
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelRegistration.mutate()}
                          disabled={cancelRegistration.isPending}
                          className="min-h-11 flex-1 rounded-full bg-[var(--destructive)] text-[14px] font-semibold text-[var(--destructive-foreground)] disabled:opacity-60"
                        >
                          {cancelRegistration.isPending
                            ? t("bc.mobile.community.events.cancelling")
                            : t("bc.mobile.community.events.cancelConfirmCta")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmCancel(true)}
                      className="mt-3 min-h-11 w-full rounded-2xl border border-[var(--bc-mobile-border)] text-[14px] font-medium text-[var(--bc-mobile-muted)] transition-colors hover:text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
                    >
                      {t("bc.mobile.community.events.cancelRegistration")}
                    </button>
                  )}
                  {cancelErrorKey ? (
                    <p role="alert" className="mt-2 text-[13px] text-[var(--bc-mobile-muted)]">
                      {t(cancelErrorKey)}
                    </p>
                  ) : null}
                </>
              ) : detail.canRegister ? (
                <>
                  <button
                    type="button"
                    onClick={onRegister}
                    disabled={register.isPending}
                    className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bc-cta-gold px-4 text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] focus-visible:ring-offset-2 disabled:opacity-60 motion-reduce:transition-none"
                  >
                    {register.isPending
                      ? t("bc.mobile.community.events.registering")
                      : t("bc.mobile.community.events.register")}
                  </button>
                  {registerErrorKey ? (
                    <p role="alert" className="mt-2 text-[13px] text-[var(--bc-mobile-muted)]">
                      {t(registerErrorKey)}
                    </p>
                  ) : null}
                </>
              ) : detail.event.registrationState === "full" ? (
                <p className="text-[14px] text-[var(--bc-mobile-muted)]">
                  {t("bc.mobile.community.events.full")}
                </p>
              ) : detail.event.registrationState === "cancelled" ? (
                <p className="text-[14px] text-[var(--bc-mobile-muted)]">
                  {t("bc.mobile.community.events.cancelled")}
                </p>
              ) : (
                <p className="text-[14px] text-[var(--bc-mobile-muted)]">
                  {t("bc.mobile.community.events.closed")}
                </p>
              )}
            </section>

            <section className="mt-7">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--bc-mobile-muted)]">
                {t("bc.mobile.community.events.info")}
              </h2>
              <dl className="mt-2 divide-y divide-[var(--bc-mobile-border)] border-y border-[var(--bc-mobile-border)]">
                <InfoRow
                  icon={<CalendarDays className="h-4.5 w-4.5" strokeWidth={1.6} />}
                  label={t("bc.mobile.community.events.date")}
                  value={fmt.date(detail.event.startAt)}
                />
                {detail.event.locationLabel ? (
                  <InfoRow
                    icon={<MapPin className="h-4.5 w-4.5" strokeWidth={1.6} />}
                    label={t("bc.mobile.community.events.location")}
                    value={detail.event.locationLabel}
                  />
                ) : null}
                {detail.event.formatLabel ? (
                  <InfoRow
                    icon={<Tag className="h-4.5 w-4.5" strokeWidth={1.6} />}
                    label={t("bc.mobile.community.events.format")}
                    value={detail.event.formatLabel}
                  />
                ) : null}
                <div className="flex min-h-[48px] items-center gap-3 py-2.5">
                  <span aria-hidden="true" className="shrink-0 text-[var(--bc-mobile-muted)]">
                    <Users className="h-4.5 w-4.5" strokeWidth={1.6} />
                  </span>
                  <dt className="w-24 shrink-0 text-[13px] text-[var(--bc-mobile-muted)]">
                    {t("bc.mobile.community.events.community")}
                  </dt>
                  <dd className="min-w-0 flex-1 text-[14px] font-medium">
                    <Link
                      to="/connect-app/community/$communityId"
                      params={{ communityId }}
                      className="text-[var(--bc-mobile-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
                    >
                      {detail.communityName}
                    </Link>
                  </dd>
                </div>
              </dl>
            </section>

            {/* Đơn vị đồng hành & Nhà tài trợ */}
            <section className="mt-6 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-4 shadow-sm">
              <h2 className="text-[15px] font-semibold text-[var(--bc-mobile-text)] flex items-center gap-2">
                <Handshake className="h-4 w-4 text-[var(--bc-mobile-accent)]" />
                <span>Nhà Tài Trợ & Đơn Vị Đồng Hành</span>
              </h2>
              <div className="mt-3 divide-y divide-[var(--bc-mobile-border)]">
                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-400 font-bold text-xs flex items-center justify-center">
                      ST
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-[var(--bc-mobile-text)]">
                        Tập đoàn Công nghệ SunTech Global
                      </div>
                      <div className="text-[11px] text-[var(--bc-mobile-muted)]">
                        Nguyễn Văn Hùng (Chủ tịch HĐQT)
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400">
                    💎 Bạch Kim
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center">
                      HG
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-[var(--bc-mobile-text)]">
                        Trầm Hương & Yến Sào Hoàng Gia
                      </div>
                      <div className="text-[11px] text-[var(--bc-mobile-muted)]">
                        200 hộp quà tặng VIP cho C-Level
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400">
                    🥇 Vàng
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 font-bold text-xs flex items-center justify-center">
                      TP
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-[var(--bc-mobile-text)]">
                        TPBank - Khối SME
                      </div>
                      <div className="text-[11px] text-[var(--bc-mobile-muted)]">
                        Tài trợ hạ tầng Livestream & Âm thanh
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-300">
                    🥈 Bạc
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-orange-500/10 text-orange-400 font-bold text-xs flex items-center justify-center">
                      AR
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-[var(--bc-mobile-text)]">
                        Artisan Coffee & Roastery
                      </div>
                      <div className="text-[11px] text-[var(--bc-mobile-muted)]">
                        Quầy pha chế Espresso & Teabreak
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400">
                    🥉 Đồng
                  </span>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-h-[48px] items-center gap-3 py-2.5">
      <span aria-hidden="true" className="shrink-0 text-[var(--bc-mobile-muted)]">
        {icon}
      </span>
      <dt className="w-24 shrink-0 text-[13px] text-[var(--bc-mobile-muted)]">{label}</dt>
      <dd className="min-w-0 flex-1 text-[14px] font-medium text-[var(--bc-mobile-text)]">
        {value}
      </dd>
    </div>
  );
}
