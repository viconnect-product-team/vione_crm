// BC-Mobile-1A/1B — Business Connect Executive Home.
//
// Home is not a dashboard. It is a quiet executive briefing: who you are,
// what deserves attention today (max 3 items), and the fastest way to
// connect (V). All data flows through useBusinessConnectHome() — a thin
// composition over LIVE backend contracts. No mocks, no KPI tiles, no
// charts, no carousels, no fake badges.
//
// BC-Mobile-1B (visual polish only — 1A runtime/data contracts frozen):
// Executive Minimal Luxury. 80–90% neutral surface, navy typography,
// champagne used only as a micro accent (V marker, unread indicator).
// Today reads as an editorial briefing (hairline dividers), not CRM cards.

import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  Handshake,
  MapPin,
  MessageSquare,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  User,
  Users,
  Video,
} from "lucide-react";
import { useState, useEffect } from "react";
import { HomeNotificationsMenu } from "./HomeNotificationsMenu";
import { hasTKey, useFmt, useLang, useT, type TKey } from "@/lib/i18n";
import { getVNTimeGreeting } from "@/lib/utils";
import {
  useBusinessConnectHome,
  type BcMobileHomeIdentity,
  type BcMobileTodayItem,
} from "@/hooks/use-business-connect-home";
import { useTodayRelationshipRecommendations } from "@/hooks/use-relationship-intelligence";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import { useMyIdentity } from "@/hooks/use-my-identity";
import { useVSheet } from "@/hooks/use-v-sheet";
import { useTodayPreferences } from "@/hooks/use-today-preferences";
import {
  applyTodayPreferences,
  isDefaultTodayPreferences,
} from "@/lib/business-connect/mobile/today-preferences";

import { fetchNestApi, resolveMediaUrl } from "@/lib/api-client";
import { avatarOrDemo, demoAvatar } from "@/lib/business-connect/mobile/demo-avatars";
import { RelationshipSuggestions } from "./RelationshipSuggestions";
import { ViOneLogo } from "./ViOneLogo";
import { QuickMeetIcon, QuickScanIcon, QuickCardIcon } from "./NavIcons";
import { TodayCustomizeSheet } from "./TodayCustomizeSheet";
import { TodayItem } from "./TodayItem";
import { VIconMark } from "./VIconMark";
import { EventDetailMobileSheet } from "./EventDetailMobileSheet";

export type CrmEvent = {
  id: string;
  title?: string | null;
  name?: string | null;
  date?: string | null;
  startDate?: string | null;
  start_date?: string | null;
  location?: string | null;
  venue?: string | null;
  status?: string | null;
  type?: string | null;
  description?: string | null;
  associationId?: string | null;
  associationName?: string | null;
  communityName?: string | null;
  associationLogo?: string | null;
};

export const getEventDate = (ev: CrmEvent): Date | null => {
  const d = ev.date || ev.startDate || ev.start_date;
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
};

export const isEventToday = (ev: CrmEvent): boolean => {
  const dt = getEventDate(ev);
  if (!dt) return false;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return dt >= todayStart && dt <= todayEnd;
};

export function ExecutiveHome() {
  const t = useT();
  const { openV } = useVSheet();
  const home = useBusinessConnectHome();
  const data = home.data;

  // Tuỳ chỉnh thẻ HÔM NAY — chỉ lọc/sắp xếp dữ liệu đã được cấp quyền.
  const { prefs, update, reset } = useTodayPreferences();
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [scheduleTab, setScheduleTab] = useState<"today" | "upcoming">("today");
  const [selectedEvent, setSelectedEvent] = useState<CrmEvent | null>(null);
  const [eventSheetOpen, setEventSheetOpen] = useState(false);

  const handleOpenEvent = (ev: CrmEvent) => {
    setSelectedEvent(ev);
    setEventSheetOpen(true);
  };

  const handleOpenTodayItem = (item: BcMobileTodayItem) => {
    if (item.id.startsWith("event:")) {
      const rawId = item.id.replace("event:", "");
      const found = crmList.find((c) => String(c.id) === rawId);
      if (found) {
        handleOpenEvent(found);
        return;
      }
    }
    handleOpenEvent({
      id: item.id.replace("event:", ""),
      title: item.titleKey,
      location: item.descriptionKey,
      communityName: item.counterpartDisplayName,
      startDate: item.startsAt,
    });
  };

  // Kéo cả CRM events để đảm bảo dual-source cho sự kiện hôm nay & sắp tới (an toàn không throw khi thiếu QueryClientProvider)
  const [crmEventsData, setCrmEventsData] = useState<any>(null);

  useEffect(() => {
    let active = true;
    fetchNestApi("/events?limit=20")
      .then((res) => {
        if (active) setCrmEventsData(res);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const crmList: CrmEvent[] = Array.isArray(crmEventsData)
    ? crmEventsData
    : ((crmEventsData as any)?.data ?? (crmEventsData as any)?.items ?? []);

  const crmTodayItems: BcMobileTodayItem[] = crmList
    .filter((ev) => isEventToday(ev))
    .map((ev) => {
      const dt = getEventDate(ev);
      return {
        id: `event:${ev.id}`,
        kind: "meeting" as const,
        category: "upcoming" as const,
        urgency: "high" as const,
        titleKey: ev.title || ev.name || "Sự kiện hôm nay",
        descriptionKey: ev.location || ev.venue || "Sự kiện cộng đồng",
        counterpartDisplayName: ev.associationName || ev.communityName || "Cộng đồng",
        startsAt: dt ? dt.toISOString() : null,
        dueAt: null,
        action: {
          labelKey: "bc.workHub.action.view",
          targetRoute: "/events/$eventId",
          targetParams: { eventId: String(ev.id) },
          targetSearch: null,
          canRoute: true,
        },
      };
    });

  const rawPool = data?.today.pool ?? data?.today.items ?? [];
  const mergedTodayPool = [...rawPool];
  for (const crmItem of crmTodayItems) {
    if (
      !mergedTodayPool.some(
        (p) => p.id === crmItem.id || (p.titleKey && p.titleKey === crmItem.titleKey),
      )
    ) {
      mergedTodayPool.unshift(crmItem);
    }
  }

  const todayPool = mergedTodayPool;
  const todayItems = applyTodayPreferences(todayPool, prefs);
  const customized = !isDefaultTodayPreferences(prefs);

  // Danh sách sự kiện SẮP TỚI (CRM events có ngày tương lai > hôm nay)
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const upcomingEvents: CrmEvent[] = crmList
    .filter((ev) => {
      const dt = getEventDate(ev);
      if (!dt) return false;
      return dt > todayEnd;
    })
    .sort((a, b) => {
      const da = getEventDate(a)?.getTime() ?? 0;
      const db = getEventDate(b)?.getTime() ?? 0;
      return da - db;
    });

  const unread = data?.unreadNotificationCount ?? null;

  return (
    <>
      {/* Sticky Header thương hiệu chung */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between border-b border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)]/95 backdrop-blur-md px-5 -mx-4"
        style={{
          paddingTop: "var(--bc-mobile-safe-top-compact)",
          minHeight: "calc(var(--bc-mobile-safe-top-compact) + var(--bc-mobile-header-h))",
        }}
      >
        <div className="relative inline-flex flex-none flex-col items-start gap-0.5 py-1.5">
          <ViOneLogo className="h-5 w-auto" />
          <p className="relative -mt-px flex w-fit items-center whitespace-nowrap font-['Inter-Light',Helvetica] text-xs font-medium leading-4 tracking-[0] text-[var(--bc-mobile-muted)]">
            {getVNTimeGreeting()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <HomeNotificationsMenu unreadCount={unread} />
        </div>
      </header>

      <main id="bc-mobile-home" className="contents">
        {home.isPending || (!data && !home.isError) ? (
          <HomeSkeleton />
        ) : home.isError || !data ? (
          <HomeCoreError onRetry={() => home.refetch()} />
        ) : (
          <div className="bc-home-enter">
            <Greeting identity={data.identity} />

            <section aria-labelledby="bc-home-today" className="mt-8">
              {/* Header */}
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--bc-mobile-muted)]">
                    {scheduleTab === "today"
                      ? t("bc.mobile.home.today.label")
                      : "Lịch trình sắp tới"}
                  </div>
                  <h2
                    id="bc-home-today"
                    className="text-[20px] font-semibold text-[var(--bc-mobile-text)]"
                  >
                    {scheduleTab === "today" ? <TodayDate /> : "Sự kiện sắp diễn ra"}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {scheduleTab === "today" && (
                    <button
                      type="button"
                      onClick={() => setCustomizeOpen(true)}
                      aria-label={t("bc.mobile.home.today.customize.open")}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[var(--bc-mobile-muted)] transition-colors hover:text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                    >
                      <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} />
                    </button>
                  )}

                  <Link
                    to="/connect-app/calendar"
                    className="inline-flex items-center gap-0.5 text-[12.5px] font-medium text-[var(--bc-mobile-muted)] transition-colors hover:text-[var(--bc-mobile-text)] focus-visible:outline-none"
                  >
                    {t("bc.mobile.home.today.viewCalendar")}
                    <ChevronRight
                      aria-hidden="true"
                      className="h-3.5 w-3.5 opacity-80"
                      strokeWidth={2}
                    />
                  </Link>
                </div>
              </div>

              {/* Segmented Tab Bar */}
              <div className="mt-3 flex items-center rounded-xl bg-[var(--bc-mobile-surface-2)] p-1 border border-[var(--bc-mobile-border)]">
                <button
                  type="button"
                  onClick={() => setScheduleTab("today")}
                  style={
                    scheduleTab === "today"
                      ? { background: "var(--bc-mobile-accent-grad)" }
                      : undefined
                  }
                  className={`flex-1 py-1.5 text-xs rounded-lg transition-all text-center cursor-pointer ${
                    scheduleTab === "today"
                      ? "text-[#050c15] font-bold shadow-xs"
                      : "text-slate-400 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium"
                  }`}
                >
                  Hôm nay {todayItems.length > 0 ? `(${todayItems.length})` : ""}
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleTab("upcoming")}
                  style={
                    scheduleTab === "upcoming"
                      ? { background: "var(--bc-mobile-accent-grad)" }
                      : undefined
                  }
                  className={`flex-1 py-1.5 text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    scheduleTab === "upcoming"
                      ? "text-[#050c15] font-bold shadow-xs"
                      : "text-slate-400 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium"
                  }`}
                >
                  <span>Sắp tới</span>
                  {upcomingEvents.length > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] leading-none ${
                        scheduleTab === "upcoming"
                          ? "bg-[#050c15]/20 text-[#050c15] font-bold"
                          : "bg-[var(--bc-mobile-accent-soft)] text-[var(--bc-mobile-accent)] font-semibold"
                      }`}
                    >
                      {upcomingEvents.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Nội dung Tab HÔM NAY */}
              {scheduleTab === "today" && (
                <>
                  {customized ? (
                    <p className="mt-2 text-[12px] text-[var(--bc-mobile-muted)]">
                      {t("bc.mobile.home.today.customize.active")}
                    </p>
                  ) : null}

                  {data.today.status === "error" ? (
                    <TodayError onRetry={() => home.refetch()} />
                  ) : todayPool.length === 0 || todayItems.length === 0 ? (
                    <TodayEmpty onOpenV={openV} />
                  ) : (
                    <>
                      <ul className="mt-1 divide-y divide-[var(--bc-mobile-border)]">
                        {todayItems.map((item) => (
                          <TodayItem key={item.id} item={item} onSelect={handleOpenTodayItem} />
                        ))}
                      </ul>
                      <TodayPrimaryAction items={todayItems} onOpenV={openV} />
                    </>
                  )}
                </>
              )}

              {/* Nội dung Tab SẮP TỚI */}
              {scheduleTab === "upcoming" && (
                <div className="mt-3">
                  {upcomingEvents.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm font-medium text-[var(--bc-mobile-muted)]">
                        Chưa có sự kiện hoặc lịch trình sắp tới
                      </p>
                      <Link
                        to="/connect-app/calendar"
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--bc-mobile-accent)] hover:underline"
                      >
                        Xem lịch hoạt động
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ) : (
                    <>
                      <ul className="mt-4 space-y-3.5 border-l border-[var(--bc-mobile-border-gold)] pl-4">
                        {upcomingEvents.slice(0, 5).map((ev) => (
                          <UpcomingEventTimelineRow
                            key={ev.id}
                            event={ev}
                            onSelect={() => handleOpenEvent(ev)}
                          />
                        ))}
                      </ul>

                      <Link
                        to="/connect-app/calendar"
                        className="mt-4 flex min-h-[42px] w-full items-center justify-between rounded-xl px-4 py-2.5 border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] transition-all hover:border-[var(--bc-mobile-border-gold)] text-xs font-medium text-[var(--bc-mobile-text)]"
                      >
                        <span className="flex items-center gap-2 text-[var(--bc-mobile-text)]">
                          <CalendarDays className="h-4 w-4 text-[var(--bc-mobile-accent)]" />
                          <span>Xem tất cả ({upcomingEvents.length}) sự kiện trong lịch</span>
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-[var(--bc-mobile-accent)]" />
                      </Link>
                    </>
                  )}
                </div>
              )}
            </section>

            <InsightCard />

            <QuickActions />

            {/* BC-Mobile-6A — calm intelligence: own query, never blocks Home. */}
            <RelationshipSuggestions />

            <TodayCustomizeSheet
              open={customizeOpen}
              onOpenChange={setCustomizeOpen}
              prefs={prefs}
              onChange={update}
              onReset={reset}
            />

            <EventDetailMobileSheet
              open={eventSheetOpen}
              onOpenChange={setEventSheetOpen}
              event={selectedEvent}
            />
          </div>
        )}
      </main>
    </>
  );
}

/** Ngày hôm nay theo locale hiện hành — không hardcode chuỗi. */
function TodayDate() {
  const fmt = useFmt();
  const label = new Date().toLocaleDateString(fmt.locale, {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  return <span className="capitalize">{label}</span>;
}

function NotificationsLink({ unreadCount }: { unreadCount: number | null }) {
  return <HomeNotificationsMenu unreadCount={unreadCount} />;
}

function QuickActions() {
  const t = useT();
  const items = [
    {
      to: "/connect-app/moment",
      Icon: QuickMeetIcon,
      label: t("bc.mobile.home.quick.meet"),
    },
    {
      to: "/connect-app/card-scan",
      Icon: QuickScanIcon,
      label: t("bc.mobile.home.quick.scan"),
    },
    {
      to: "/connect-app/me/card",
      Icon: QuickCardIcon,
      label: t("bc.mobile.home.quick.card"),
    },
  ];

  return (
    <nav aria-label={t("bc.mobile.home.quick.title")} className="mt-5 grid grid-cols-3 gap-2">
      {items.map(({ to, Icon, label }) => (
        <Link
          key={to}
          to={to as any}
          className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] py-3.5 px-1 text-center shadow-xs transition-all hover:border-[var(--bc-mobile-border-gold)] active:scale-[0.98]"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--bc-mobile-accent-soft)] border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-accent)] group-hover:border-[var(--bc-mobile-border-gold)] group-hover:scale-105 transition-all">
            <Icon className="h-5 w-5 text-[var(--bc-mobile-accent)]" />
          </span>
          <span className="text-[12.5px] font-semibold text-[var(--bc-mobile-text)] truncate max-w-full group-hover:text-[var(--bc-mobile-accent)] transition-colors">
            {label}
          </span>
        </Link>
      ))}
    </nav>
  );
}

/** Một dòng lịch trình HÔM NAY — mốc thời gian bên trái, nội dung bên phải. */
function TodayTimelineRow({ item }: { item: BcMobileTodayItem }) {
  const t = useT();
  const fmt = useFmt();
  const title = hasTKey(item.titleKey) ? t(item.titleKey as TKey) : item.titleKey;
  const time = item.startsAt
    ? new Date(item.startsAt).toLocaleTimeString(fmt.locale, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : item.dueAt
      ? new Date(item.dueAt).toLocaleDateString(fmt.locale, { day: "numeric", month: "short" })
      : null;
  const subtitle = item.counterpartDisplayName;
  const detail =
    item.descriptionKey && hasTKey(item.descriptionKey)
      ? t(item.descriptionKey as TKey)
      : (item.descriptionKey ?? null);
  const canRoute = item.action.canRoute && item.action.targetRoute;

  const body = (
    <div className="flex flex-col items-start min-w-0 flex-1">
      <span
        aria-hidden="true"
        className="absolute -left-[21px] top-[6px] h-2.5 w-2.5 rounded-full bg-[var(--bc-mobile-accent)] shadow-[0_0_8px_rgba(234,154,65,0.6)]"
      />
      {time ? (
        <span className="text-[13.5px] font-semibold leading-tight tabular-nums text-[var(--bc-mobile-accent)]">
          {time}
        </span>
      ) : null}
      <span className="mt-1 block truncate text-[15px] font-semibold text-[var(--bc-mobile-text)]">
        {title}
      </span>
      {subtitle ? (
        <span className="mt-0.5 block truncate text-[13px] text-[var(--bc-mobile-muted)]">
          {subtitle}
        </span>
      ) : null}
      {detail ? (
        <span className="mt-1.5 flex items-center gap-1 text-[12.5px] text-[var(--bc-mobile-muted)]">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
          <span className="truncate">{detail}</span>
        </span>
      ) : null}
    </div>
  );

  return (
    <li className="relative">
      {canRoute ? (
        <Link
          to={item.action.targetRoute as any}
          params={(item.action.targetParams ?? {}) as any}
          search={(item.action.targetSearch ?? {}) as any}
          className="flex flex-col items-start w-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)]"
        >
          {body}
        </Link>
      ) : (
        <div className="flex flex-col items-start w-full">{body}</div>
      )}
    </li>
  );
}

/** Primary V CTA row when Today is populated */
function TodayPrimaryAction({
  items: _items,
  onOpenV,
}: {
  items: BcMobileTodayItem[];
  onOpenV: () => void;
}) {
  const t = useT();
  return (
    <div className="mt-4 text-center">
      <button
        type="button"
        onClick={onOpenV}
        className="inline-flex min-h-[44px] items-center gap-1.5 text-[13px] font-medium text-[var(--bc-mobile-muted)] transition-colors hover:text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)]"
      >
        <VMarker />
        <span>{t("bc.mobile.home.v.open")}</span>
      </button>
    </div>
  );
}

/** Insight — số cơ hội kết nối tiềm năng, lấy từ chính nguồn gợi ý 6A. */
function InsightCard() {
  const t = useT();
  const { lang } = useLang();
  const { recommendations, initialLoading, error } = useTodayRelationshipRecommendations(lang);
  if (initialLoading) return null;
  const isEmpty = Boolean(error) || recommendations.length === 0;

  const headline = isEmpty
    ? t("bc.mobile.home.insight.emptyHeadline")
    : t("bc.mobile.home.insight.headline", { count: recommendations.length });

  const parts = headline.split(/(\d+)/);

  return (
    <div
      aria-labelledby="bc-home-insight"
      className="relative mt-5 overflow-hidden rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-5 shadow-sm transition-all hover:border-[var(--bc-mobile-border-gold)]"
    >
      <div className="relative z-10 flex items-center gap-2">
        <Sparkles
          aria-hidden="true"
          className="h-4 w-4 text-[var(--bc-mobile-accent)]"
          strokeWidth={1.6}
        />
        <h2
          id="bc-home-insight"
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--bc-mobile-muted)]"
        >
          {t("bc.mobile.home.insight.label")}
        </h2>
      </div>
      <p className="relative z-10 mt-4 max-w-[17ch] text-[21px] font-bold leading-[1.3] text-[var(--bc-mobile-text)] uppercase">
        {isEmpty
          ? t("bc.mobile.home.insight.emptyHeadline")
          : parts.map((part, index) =>
              /^\d+$/.test(part) ? (
                <span key={index} className="text-[var(--bc-mobile-accent)] font-extrabold">
                  {part}
                </span>
              ) : (
                part
              ),
            )}
      </p>
      <p className="relative z-10 mt-2 max-w-[22ch] text-[13.5px] leading-relaxed text-[var(--bc-mobile-muted)]">
        {isEmpty ? t("bc.mobile.home.insight.emptyBody") : t("bc.mobile.home.insight.body")}
      </p>
      <Link
        to="/connect-app/network"
        search={{ tab: "suggestions" }}
        className="relative z-10 mt-4 inline-flex min-h-[44px] items-center gap-2 text-[14px] font-semibold text-[var(--bc-mobile-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)]"
      >
        {isEmpty ? t("bc.mobile.home.insight.emptyCta") : t("bc.mobile.home.insight.cta")}
        <ArrowRight
          aria-hidden="true"
          className="h-4 w-4 text-[var(--bc-mobile-accent)]"
          strokeWidth={2}
        />
      </Link>
    </div>
  );
}

// ── Header affordances ───────────────────────────────────────────────────────

function initialsOf(identity: BcMobileHomeIdentity | null): string | null {
  const name = identity?.displayName ?? identity?.email ?? null;
  if (!name) return null;
  const words = name
    .trim()
    .split(/[\s@]+/)
    .filter(Boolean);
  if (words.length === 0) return null;
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || null;
}

// ── Sections ─────────────────────────────────────────────────────────────────

function Greeting({ identity }: { identity: BcMobileHomeIdentity }) {
  const name = identity.displayName ?? identity.email ?? "Thành viên";
  const viewerUserId = useViewerUserId();
  const mine = useMyIdentity({ enabled: Boolean(viewerUserId) });
  const profileIdentity = mine.data?.identity ?? null;
  const initials = initialsOf(profileIdentity || identity);
  const rawAvatarUrl = profileIdentity?.avatarUrl ?? identity.avatarUrl ?? null;
  const avatarUrl = avatarOrDemo(rawAvatarUrl, name);
  const role = [profileIdentity?.jobTitle, profileIdentity?.companyName]
    .filter((p): p is string => Boolean(p && p.trim()))
    .join(" · ");

  return (
    <div className="relative mt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="mt-0.5 truncate text-[26px] font-semibold tracking-tight text-[var(--bc-mobile-text)]">
            {name}
          </h1>
          {role ? (
            <p className="mt-0.5 truncate text-[14px] font-normal text-[var(--bc-mobile-muted)]">
              {role}
            </p>
          ) : null}
        </div>

        <Link
          to="/connect-app/me"
          aria-label="Hồ sơ cá nhân"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] overflow-hidden"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = demoAvatar(name);
              }}
            />
          ) : (
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[14px] font-semibold text-[var(--bc-mobile-ivory)]">
              {initials ?? <User className="h-5 w-5" strokeWidth={1.6} />}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}

/**
 * CTA chính của thẻ HÔM NAY khi chưa có cuộc họp có thể mở — giữ đúng khối
 * nút vàng full-width của thiết kế, nhưng nội dung trung thực (mở V).
 */
function VPrimaryAction({ onOpenV }: { onOpenV: () => void }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onOpenV}
      className="mt-5 flex min-h-[48px] w-full items-center justify-between rounded-xl px-4 py-3 border border-[var(--bc-mobile-border)] bg-slate-50 dark:bg-white/[0.03] backdrop-blur-md transition-all hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:border-[var(--bc-mobile-border-gold)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D8B282] active:scale-98 cursor-pointer"
    >
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] p-1 shadow-xs"
      >
        <VIconMark size={18} />
      </span>
      <span className="font-bold text-sm bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] bg-clip-text text-transparent text-center">
        {t("bc.mobile.home.v.open")}
      </span>
      <ArrowRight className="h-4 w-4 text-[var(--bc-mobile-accent)]" strokeWidth={2} />
    </button>
  );
}

/** Small champagne V glyph — the only accent marker on Home. */
function VMarker() {
  return (
    <span
      aria-hidden="true"
      className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] p-0.5 shadow-xs"
    >
      <VIconMark size={14} />
    </span>
  );
}

/** Một dòng sự kiện SẮP TỚI — hiển thị ngày tháng chuẩn từ CRM, tên sự kiện, địa điểm, sức chứa và mở EventDetailMobileSheet khi bấm */
function UpcomingEventTimelineRow({ event, onSelect }: { event: CrmEvent; onSelect?: () => void }) {
  const fmt = useFmt();
  const dt = getEventDate(event);
  const dateFormatted = dt
    ? dt.toLocaleDateString(fmt.locale, {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Sắp diễn ra";

  const timeFormatted =
    dt && (dt.getHours() !== 0 || dt.getMinutes() !== 0)
      ? dt.toLocaleTimeString(fmt.locale, { hour: "2-digit", minute: "2-digit" })
      : null;

  const title = event.title || event.name || "Sự kiện";
  const organizer = event.associationName || event.communityName || null;
  const location = event.location || event.venue || null;

  return (
    <li className="relative group">
      <span
        aria-hidden="true"
        className="absolute -left-[21px] top-[6px] h-2.5 w-2.5 rounded-full bg-[var(--bc-mobile-accent)] shadow-xs group-hover:scale-125 transition-transform"
      />
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-col items-start w-full text-left rounded-lg p-2 -m-1 transition-all hover:bg-black/5 dark:hover:bg-white/[0.03] active:bg-black/10 dark:active:bg-white/[0.06] border border-transparent active:border-[var(--bc-mobile-border-active)] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--bc-mobile-accent)]"
      >
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-[12px] font-bold capitalize tabular-nums text-[var(--bc-mobile-accent)]">
            {dateFormatted} {timeFormatted ? `· ${timeFormatted}` : ""}
          </span>
          {(event as any).type && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--bc-mobile-accent-soft)] text-[var(--bc-mobile-accent)] border border-[var(--bc-mobile-border)]">
              {(event as any).type === "online"
                ? "Trực tuyến"
                : (event as any).type === "offline"
                  ? "Trực tiếp"
                  : (event as any).type}
            </span>
          )}
        </div>

        <span className="mt-1 block text-[14px] font-semibold text-[var(--bc-mobile-text)] group-hover:text-[var(--bc-mobile-accent)] transition-colors leading-snug line-clamp-2 text-left">
          {title}
        </span>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--bc-mobile-muted)]">
          {organizer && (
            <span className="font-medium text-[var(--bc-mobile-text)] truncate max-w-[180px]">
              {organizer}
            </span>
          )}
          {location && (
            <span className="flex items-center gap-1 truncate max-w-[220px]">
              <MapPin
                aria-hidden="true"
                className="h-3 w-3 shrink-0 text-[var(--bc-mobile-accent)]"
                strokeWidth={1.6}
              />
              <span className="truncate">{location}</span>
            </span>
          )}
          {(event as any).registered !== undefined &&
            (event as any).capacity !== undefined &&
            Number((event as any).capacity) > 0 && (
              <span className="text-[11px] text-[var(--bc-mobile-muted)]">
                {(event as any).registered}/{(event as any).capacity} đã đăng ký
              </span>
            )}
        </div>
      </button>
    </li>
  );
}

function TodayEmpty({ onOpenV }: { onOpenV: () => void }) {
  const t = useT();
  return (
    <div className="mt-8 flex flex-col items-center px-2 pb-4 text-center">
      <CircleCheck
        aria-hidden="true"
        className="h-7 w-7 text-[var(--bc-mobile-accent)]"
        strokeWidth={1.5}
      />
      <p className="mt-3 text-[15px] font-medium text-[var(--bc-mobile-text)]">
        {t("bc.mobile.home.empty.title")}
      </p>
      <p className="mx-auto mt-1 max-w-[32ch] text-[13px] leading-relaxed text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.home.empty.body")}
      </p>
      <button
        type="button"
        onClick={onOpenV}
        className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-[14px] font-medium text-[var(--bc-mobile-accent)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
      >
        <VMarker />
        <span>{t("bc.mobile.home.empty.cta")}</span>
      </button>
    </div>
  );
}

function TodayError({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <div role="alert" className="mt-4 flex items-center justify-between gap-3 py-1">
      <p className="text-[13px] text-[var(--bc-mobile-muted)]">{t("bc.mobile.home.error.today")}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
      >
        <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
        {t("bc.mobile.home.error.retry")}
      </button>
    </div>
  );
}

function HomeCoreError({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <div role="alert" className="mt-16 flex flex-col items-center px-2 text-center">
      <p className="text-[15px] font-medium text-[var(--bc-mobile-text)]">
        {t("bc.mobile.home.error.title")}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-[14px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
      >
        <RefreshCw aria-hidden="true" className="h-4 w-4" />
        {t("bc.mobile.home.error.retry")}
      </button>
    </div>
  );
}

/** Quiet skeleton matching the final layout; shell + nav stay interactive. */
function HomeSkeleton() {
  const t = useT();
  const bar = "animate-pulse rounded bg-[var(--bc-mobile-surface-2)] motion-reduce:animate-none";
  return (
    <div role="status" aria-label={t("bc.mobile.home.loading")} aria-busy="true" className="mt-5">
      <div className={`h-3.5 w-24 ${bar}`} />
      <div className={`mt-2 h-7 w-44 ${bar}`} />
      <div className={`mt-8 h-3 w-14 ${bar}`} />
      <div className="mt-1 divide-y divide-[var(--bc-mobile-border)]">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-3.5 py-4">
            <div className={`h-10 w-10 shrink-0 rounded-full ${bar}`} />
            <div className="flex-1">
              <div className={`h-4 w-3/5 ${bar}`} />
              <div className={`mt-1.5 h-3 w-2/5 ${bar}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
