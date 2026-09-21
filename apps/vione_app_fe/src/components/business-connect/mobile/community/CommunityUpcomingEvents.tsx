// BC-Mobile-7B — Module "Sắp diễn ra" gắn ngay trong màn Cộng đồng.
// Hiển thị thời gian, trạng thái đăng ký thật (canonical) và nút Đăng ký tại chỗ.
// Không tạo backend sự kiện song song: dùng đúng preview + registerForEvent của 7B.

import { Link } from "@tanstack/react-router";
import { CalendarDays, Check, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useFmt, useT } from "@/lib/i18n";
import {
  useCommunityActivityPreview,
  useCommunityEventRegistration,
} from "@/hooks/use-community-activity";
import { eventDateParts } from "@/lib/business-connect/mobile/community-activity.service";
import type { CommunityEventSummaryDTO } from "@/lib/business-connect/mobile/community-activity.types";
import type { CommunitySummaryDTO } from "@/lib/business-connect/mobile/community.types";
import { monthLabel } from "./CommunityEvents";

export function CommunityUpcomingEvents({
  communities,
}: {
  communities: CommunitySummaryDTO[];
}) {
  const t = useT();
  const list = communities.slice(0, 4);
  const [empty, setEmpty] = useState<Record<string, boolean>>({});
  const allEmpty = list.every((c) => empty[c.communityId]);

  if (list.length === 0 || allEmpty) return null;

  return (
    <section aria-label={t("bc.mobile.community.upcoming")} className="mt-5">
      <h2 className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.community.upcoming")}
      </h2>
      <div className="mt-3 space-y-2.5">
        {list.map((c: any) => (
          <CommunityUpcomingGroup
            key={c.communityId}
            community={c}
            onEmpty={(isEmpty) =>
              setEmpty((prev) =>
                prev[c.communityId] === isEmpty ? prev : { ...prev, [c.communityId]: isEmpty },
              )
            }
          />
        ))}
      </div>
    </section>
  );
}

function CommunityUpcomingGroup({
  community,
  onEmpty,
}: {
  community: CommunitySummaryDTO;
  onEmpty: (empty: boolean) => void;
}) {
  const { preview, initialLoading } = useCommunityActivityPreview(community.communityId);
  const events = preview?.nextEvents ?? [];

  useEffect(() => {
    if (!initialLoading) onEmpty(events.length === 0);
  }, [initialLoading, events.length, onEmpty]);

  if (initialLoading || events.length === 0) return null;

  return (
    <>
      {events.slice(0, 2).map((ev: any) => (
        <UpcomingEventCard
          key={ev.eventRef}
          communityId={community.communityId}
          communityName={community.name}
          event={ev}
        />
      ))}
    </>
  );
}

function UpcomingEventCard({
  communityId,
  communityName,
  event,
}: {
  communityId: string;
  communityName: string;
  event: CommunityEventSummaryDTO;
}) {
  const t = useT();
  const fmt = useFmt();
  const parts = eventDateParts(event.startAt);
  // Persist "Đã đăng ký" badge even after useMutation.isSuccess resets on re-render
  const [registeredLocally, setRegisteredLocally] = useState(false);
  const register = useCommunityEventRegistration(communityId, event.eventRef, () =>
    setRegisteredLocally(true),
  );
  const state =
    registeredLocally || register.isSuccess || event.registrationState === "registered"
      ? "registered"
      : event.registrationState;

  const dateLabel = parts
    ? new Intl.DateTimeFormat(fmt.locale, {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(`${event.startAt}T00:00:00`))
    : event.startAt;

  const errorKey = register.isError
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
    <article className="rounded-2xl bc-translucent-card p-3.5">
      <div className="flex items-start gap-3.5">
        <div
          aria-hidden="true"
          className="flex h-[52px] w-[52px] min-w-[52px] shrink-0 flex-col items-center justify-center rounded-full border border-[var(--bc-mobile-border)] bg-gradient-to-b from-[var(--bc-mobile-surface-2)] to-[rgba(216,178,130,0.08)] shadow-xs transition-transform"
        >
          <span className="text-[17px] font-extrabold leading-none text-[var(--bc-mobile-accent)]">{parts?.day ?? "--"}</span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--bc-mobile-muted)] whitespace-nowrap">
            {parts ? monthLabel(fmt.locale, parts.month) : ""}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <Link
            to="/connect-app/community/$communityId/events/$eventRef"
            params={{ communityId, eventRef: event.eventRef }}
            className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
          >
            <p className="line-clamp-2 text-[15px] font-medium leading-snug text-[var(--bc-mobile-text)]">
              {event.title}
            </p>
          </Link>
          <p className="mt-1 flex items-center gap-1.5 truncate text-[12.5px] text-[var(--bc-mobile-muted)]">
            <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.7} />
            {dateLabel}
          </p>
          {event.locationLabel ? (
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px] text-[var(--bc-mobile-muted)]">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.7} />
              {event.locationLabel}
            </p>
          ) : null}
          <p className="mt-0.5 truncate text-[12px] text-[var(--bc-mobile-muted)]">
            {communityName}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <StatusChip state={state} />
        {state === "available" ? (
          <button
            type="button"
            onClick={() => register.mutate()}
            disabled={register.isPending}
            className="inline-flex min-h-[40px] items-center rounded-full bc-cta-gold px-4 text-[13px] font-semibold transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60 motion-reduce:transition-none"
          >
            {register.isPending
              ? t("bc.mobile.community.events.registering")
              : t("bc.mobile.community.events.register")}
          </button>
        ) : (
          <Link
            to="/connect-app/community/$communityId/events/$eventRef"
            params={{ communityId, eventRef: event.eventRef }}
            className="inline-flex min-h-[40px] items-center rounded-full border border-[var(--bc-mobile-border)] px-4 text-[13px] font-medium text-[var(--bc-mobile-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
          >
            {t("bc.mobile.community.events.openEvent")}
          </Link>
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {register.isSuccess ? t("bc.mobile.community.events.registerSuccess") : ""}
      </p>
      {errorKey ? (
        <p role="alert" className="mt-2 text-[12.5px] text-[var(--bc-mobile-muted)]">
          {t(errorKey)}
        </p>
      ) : null}
    </article>
  );
}

function StatusChip({ state }: { state: CommunityEventSummaryDTO["registrationState"] }) {
  const t = useT();
  if (state === "registered") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bc-mobile-accent)]/15 px-2.5 py-1 text-[11.5px] font-medium text-[var(--bc-mobile-accent)]">
        <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
        {t("bc.mobile.community.events.registeredBadge")}
      </span>
    );
  }
  const key =
    state === "full"
      ? "bc.mobile.community.events.full"
      : state === "closed"
        ? "bc.mobile.community.events.closed"
        : state === "cancelled"
          ? "bc.mobile.community.events.cancelled"
          : "bc.mobile.community.events.spotsOpen";
  return (
    <span className="inline-flex rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--bc-mobile-muted)]">
      {t(key)}
    </span>
  );
}
