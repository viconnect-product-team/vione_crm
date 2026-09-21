// BC-Mobile-7B — Community Events list ("CỘNG ĐỒNG NÀY SẮP CÓ HOẠT ĐỘNG GÌ?").
// Two truthful tabs (Sắp tới / Đã đăng ký), chronological order, editorial
// rows with a restrained date block. No feed, no AI ranking, no fake states.

import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFmt, useT } from "@/lib/i18n";
import { useCommunityEvents } from "@/hooks/use-community-activity";
import { reportCommunityMetric } from "@/lib/business-connect/mobile/community.telemetry";
import { eventDateParts } from "@/lib/business-connect/mobile/community-activity.service";
import type {
  CommunityEventSummaryDTO,
  CommunityEventsTabDTO,
} from "@/lib/business-connect/mobile/community-activity.types";
import { BusinessConnectTopBar } from "../BusinessConnectTopBar";
import { CommunityError } from "./CommunityHome";

/** Localized short month from a month number — clean, single-line, non-wrapping on mobile */
export function monthLabel(locale: string, month: number): string {
  if (month < 1 || month > 12) return "";
  if (locale.startsWith("vi")) {
    return `Thg ${month}`;
  }
  return new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(2000, month - 1, 1)).toUpperCase();
}

export function ActivityListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="mt-3 space-y-4">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3.5">
          <div className="h-12 w-11 animate-pulse rounded-2xl bg-[var(--bc-mobile-surface-2)]" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-3/5 animate-pulse rounded-full bg-[var(--bc-mobile-surface-2)]" />
            <div className="h-3 w-2/5 animate-pulse rounded-full bg-[var(--bc-mobile-surface-2)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CommunityEvents({ communityId }: { communityId: string }) {
  const t = useT();
  const [tab, setTab] = useState<CommunityEventsTabDTO>("upcoming");
  const events = useCommunityEvents(communityId, tab);
  const opened = useRef(false);

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    reportCommunityMetric("COMMUNITY_EVENTS_OPENED");
  }, []);

  const tabs: { id: CommunityEventsTabDTO; label: string }[] = [
    { id: "upcoming", label: t("bc.mobile.community.events.tab.upcoming") },
    { id: "registered", label: t("bc.mobile.community.events.tab.registered") },
  ];

  return (
    <>
      <BusinessConnectTopBar back title={t("bc.mobile.community.events.title")} />
      <main id="bc-mobile-community-events" className="contents">
        <h1 className="mt-4 text-[28px] font-semibold leading-snug tracking-tight text-[var(--bc-mobile-text)]">
          {t("bc.mobile.community.events.title")}
        </h1>

        <div
          role="tablist"
          aria-label={t("bc.mobile.community.events.title")}
          className="mt-3.5 flex gap-2"
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`inline-flex min-h-[36px] items-center rounded-full px-4 text-[13px] font-medium transition-all duration-150 focus-visible:outline-none cursor-pointer ${
                tab === item.id
                  ? "border border-[var(--bc-mobile-border-gold)] bg-[var(--bc-mobile-accent-grad)] text-black shadow-sm font-bold"
                  : "border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-muted)] hover:border-[var(--bc-mobile-accent)] hover:text-[var(--bc-mobile-text)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {events.initialLoading ? (
          <ActivityListSkeleton />
        ) : events.coreError ? (
          <CommunityError onRetry={events.retry} />
        ) : events.unavailable ? (
          <section className="mt-14">
            <p className="max-w-[34ch] text-[15px] leading-relaxed text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.community.unavailable")}
            </p>
          </section>
        ) : events.events.length === 0 ? (
          <section className="mt-14">
            <p className="max-w-[34ch] text-[15px] leading-relaxed text-[var(--bc-mobile-muted)]">
              {tab === "registered"
                ? t("bc.mobile.community.events.empty.registered")
                : t("bc.mobile.community.events.empty")}
            </p>
          </section>
        ) : (
          <>
            <ul
              aria-label={t("bc.mobile.community.events.listLabel")}
              aria-busy={events.isLoadingMore}
              className="mt-2 divide-y divide-[var(--bc-mobile-border)]"
            >
              {events.events.map((e: any) => (
                <EventRow key={e.eventRef} communityId={communityId} event={e} />
              ))}
            </ul>
            {events.hasMore ? (
              <div className="mt-2 flex min-h-[52px] items-center justify-center">
                <button
                  type="button"
                  onClick={events.loadMore}
                  disabled={events.isLoadingMore}
                  className="inline-flex min-h-[44px] items-center rounded-lg px-4 text-[14px] font-medium text-[var(--bc-mobile-muted)] transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)] hover:text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60 motion-reduce:transition-none"
                >
                  {events.isLoadingMore
                    ? t("bc.mobile.community.loadingMore")
                    : t("bc.mobile.community.loadMore")}
                </button>
              </div>
            ) : null}
          </>
        )}
      </main>
    </>
  );
}

function EventRow({
  communityId,
  event,
}: {
  communityId: string;
  event: CommunityEventSummaryDTO;
}) {
  const t = useT();
  const fmt = useFmt();
  const parts = eventDateParts(event.startAt);
  const meta = [event.locationLabel, event.formatLabel].filter(Boolean).join(" · ");

  return (
    <li>
      <Link
        to="/connect-app/community/$communityId/events/$eventRef"
        params={{ communityId, eventRef: event.eventRef }}
        aria-label={`${t("bc.mobile.community.events.openEvent")}: ${event.title}`}
        className="flex min-h-[68px] items-center gap-3.5 py-3 transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
      >
        <div
          aria-hidden="true"
          className="flex h-[52px] w-[52px] min-w-[52px] shrink-0 flex-col items-center justify-center rounded-full border border-[var(--bc-mobile-border)] bg-gradient-to-b from-[var(--bc-mobile-surface-2)] to-[rgba(216,178,130,0.08)] shadow-xs transition-transform"
        >
          <span className="text-[17px] font-extrabold leading-none text-[var(--bc-mobile-text)]">
            {parts?.day ?? "--"}
          </span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--bc-mobile-muted)] whitespace-nowrap">
            {parts ? monthLabel(fmt.locale, parts.month) : ""}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium text-[var(--bc-mobile-text)]">
            {event.title}
          </p>
          {meta ? (
            <p className="mt-0.5 truncate text-[13px] text-[var(--bc-mobile-muted)]">{meta}</p>
          ) : null}
          <EventStateChips event={event} />
        </div>
        <ChevronRight
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-[var(--bc-mobile-muted)]"
          strokeWidth={1.8}
        />
      </Link>
    </li>
  );
}

export function EventStateChips({ event }: { event: CommunityEventSummaryDTO }) {
  const t = useT();
  if (event.registrationState === "registered") {
    return (
      <span className="mt-1.5 inline-flex rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--bc-mobile-navy)]">
        {t("bc.mobile.community.events.registeredBadge")}
      </span>
    );
  }
  if (event.registrationState === "cancelled") {
    return (
      <span className="mt-1.5 inline-flex rounded-full border border-[var(--bc-mobile-border)] px-2 py-0.5 text-[11px] font-medium text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.community.events.cancelled")}
      </span>
    );
  }
  if (event.capacityState === "full") {
    return (
      <span className="mt-1.5 inline-flex rounded-full border border-[var(--bc-mobile-border)] px-2 py-0.5 text-[11px] font-medium text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.community.events.full")}
      </span>
    );
  }
  return null;
}
