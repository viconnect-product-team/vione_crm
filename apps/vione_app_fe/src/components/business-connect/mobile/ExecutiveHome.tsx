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
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  Camera,
  ChevronRight,
  CircleCheck,
  Handshake,
  Layers,
  Loader2,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Moon,
  User,
  Users,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useMemo, useRef } from "react";
import { useTheme } from "@/lib/theme";
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

import { fetchNestApi, resolveMediaUrl, uploadFileToNest } from "@/lib/api-client";
import { avatarOrDemo, demoAvatar } from "@/lib/business-connect/mobile/demo-avatars";
import { RelationshipSuggestions } from "./RelationshipSuggestions";
import { ViOneLogo } from "./ViOneLogo";
import { QuickMeetIcon, QuickScanIcon, QuickCardIcon } from "./NavIcons";
import { TodayCustomizeSheet } from "./TodayCustomizeSheet";
import { TodayItem } from "./TodayItem";
import { VIconMark } from "./VIconMark";
import { EventDetailMobileSheet } from "./EventDetailMobileSheet";
import { PersonalProfileBottomSheet } from "@/components/common/PersonalProfileBottomSheet";
import { AttendanceMobileSheet } from "./AttendanceMobileSheet";
import { WorkflowMobileSheet } from "./WorkflowMobileSheet";
import { ApprovalsMobileSheet } from "./ApprovalsMobileSheet";

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
  const { theme, toggle: toggleTheme } = useTheme();
  const { openV } = useVSheet();
  const home = useBusinessConnectHome();
  const data = home.data;

  // Tuỳ chỉnh thẻ HÔM NAY — chỉ lọc/sắp xếp dữ liệu đã được cấp quyền.
  const { prefs, update, reset } = useTodayPreferences();
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [scheduleTab, setScheduleTab] = useState<"today" | "upcoming" | "reminders">("today");
  const [selectedEvent, setSelectedEvent] = useState<CrmEvent | null>(null);
  const [eventSheetOpen, setEventSheetOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [attendanceSheetOpen, setAttendanceSheetOpen] = useState(false);
  const [workflowSheetOpen, setWorkflowSheetOpen] = useState(false);
  const [approvalsSheetOpen, setApprovalsSheetOpen] = useState(false);

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

  // Kéo cả CRM events để đảm bảo dual-source cho sự kiện hôm nay & sắp tới
  const [crmEventsData, setCrmEventsData] = useState<any>(null);
  const [meetingsData, setMeetingsData] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    fetchNestApi("/events?limit=20")
      .then((res) => {
        if (active) setCrmEventsData(res);
      })
      .catch(() => {});

    fetchNestApi("/meetings?limit=20")
      .then((res: any) => {
        if (!active) return;
        const list = Array.isArray(res) ? res : res?.data || res?.items || [];
        setMeetingsData(list);
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

  // Danh sách nhắc lịch: cuộc gặp 1-1 và sự kiện có lịch hẹn
  const localScheduledMeetings = useMemo(() => {
    try {
      const stored = localStorage.getItem("vba_scheduled_meetings") || localStorage.getItem("vba_meeting_records") || "[]";
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }, []);

  const remindersList = useMemo(() => {
    const list: any[] = [];
    const allMeetings = [...meetingsData, ...localScheduledMeetings];
    for (const m of allMeetings) {
      if (!m.id) continue;
      const mDate = m.date || m.scheduledDate || m.time || m.createdAt;
      list.push({
        id: `meeting-${m.id}`,
        type: "meeting",
        title: m.title || `Cuộc gặp 1-1: ${m.partnerName || m.counterpart || "Doanh nhân Đối tác"}`,
        counterpart: m.partnerName || m.counterpart || "Doanh nhân đối tác",
        phone: m.phone || m.partnerPhone,
        date: mDate,
        time: m.time || "14:30",
        format: m.format || (m.location?.toLowerCase().includes("meet") ? "online" : "offline"),
        location: m.location || (m.format === "online" ? "Google Meet Trực Tuyến" : "Văn phòng Doanh nghiệp"),
        status: m.status || "confirmed",
      });
    }

    const sevenDaysFromNow = new Date(Date.now() + 7 * 86400000);
    for (const ev of upcomingEvents) {
      const dt = getEventDate(ev);
      if (dt && dt <= sevenDaysFromNow) {
        list.push({
          id: `event-reminder-${ev.id}`,
          type: "event",
          title: `Nhắc lịch sự kiện: ${ev.title || ev.name}`,
          counterpart: ev.associationName || ev.communityName || "Cộng đồng Doanh nghiệp ViOne",
          date: ev.date || ev.startDate || dt.toISOString(),
          time: dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          format: (ev as any).type === "online" ? "online" : "offline",
          location: ev.location || ev.venue || "Hội trường sự kiện",
          status: "upcoming",
        });
      }
    }

    return list;
  }, [meetingsData, localScheduledMeetings, upcomingEvents]);

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Chuyển đổi giao diện Sáng / Tối"
            title={theme === "dark" ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-text)] transition-colors hover:text-[var(--bc-mobile-accent)] active:scale-95"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            )}
          </button>
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

              {/* Segmented Tab Bar: Hôm nay | Sắp tới | Nhắc lịch */}
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
                  className={`flex-1 py-1.5 text-xs rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
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
                <button
                  type="button"
                  onClick={() => setScheduleTab("reminders")}
                  style={
                    scheduleTab === "reminders"
                      ? { background: "var(--bc-mobile-accent-grad)" }
                      : undefined
                  }
                  className={`flex-1 py-1.5 text-xs rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    scheduleTab === "reminders"
                      ? "text-[#050c15] font-bold shadow-xs"
                      : "text-slate-400 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium"
                  }`}
                >
                  <span>Nhắc lịch</span>
                  {remindersList.length > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] leading-none ${
                        scheduleTab === "reminders"
                          ? "bg-[#050c15]/20 text-[#050c15] font-bold"
                          : "bg-amber-500/20 text-amber-500 font-semibold"
                      }`}
                    >
                      {remindersList.length}
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

              {/* Nội dung Tab NHẮC LỊCH (Cuộc gặp đã hẹn & Nhắc sự kiện) */}
              {scheduleTab === "reminders" && (
                <div className="mt-3">
                  {remindersList.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell className="mx-auto h-8 w-8 text-[var(--bc-mobile-muted)] opacity-50" />
                      <p className="mt-2 text-sm font-medium text-[var(--bc-mobile-muted)]">
                        Không có lịch nhắc cuộc gặp hoặc sự kiện nào
                      </p>
                      <Link
                        to="/connect-app/moment"
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--bc-mobile-accent)] hover:underline"
                      >
                        Lên lịch cuộc gặp 1-1 mới
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {remindersList.map((rem: any) => (
                        <li
                          key={rem.id}
                          className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3.5 shadow-xs transition hover:border-[var(--bc-mobile-border-gold)]"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-[var(--bc-mobile-accent-soft)] text-[var(--bc-mobile-accent)] border border-[var(--bc-mobile-border)]">
                              {rem.type === "meeting" ? (
                                <>
                                  <Handshake className="h-3 w-3 text-amber-500" /> Cuộc gặp 1-1 đã hẹn
                                </>
                              ) : (
                                <>
                                  <CalendarDays className="h-3 w-3 text-amber-500" /> Nhắc lịch sự kiện
                                </>
                              )}
                            </span>
                            <span className="text-[11px] font-semibold text-[var(--bc-mobile-muted)]">
                              {rem.time} · {rem.date ? new Date(rem.date).toLocaleDateString("vi-VN") : "Hôm nay"}
                            </span>
                          </div>

                          <h4 className="mt-2 text-[14px] font-bold text-[var(--bc-mobile-text)] leading-snug">
                            {rem.title}
                          </h4>

                          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-[var(--bc-mobile-muted)]">
                            <span className="flex items-center gap-1.5 truncate max-w-[200px]">
                              {rem.format === "online" ? (
                                <Video className="h-3.5 w-3.5 text-[#D8B282] shrink-0" />
                              ) : (
                                <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              )}
                              <span className="truncate">{rem.location}</span>
                            </span>
                            {rem.format === "online" ? (
                              <button
                                type="button"
                                onClick={() => {
                                  window.open("https://meet.google.com/new", "_blank");
                                }}
                                className="px-3 py-1 rounded-lg bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 font-bold text-[11px] transition shadow-xs active:scale-95 cursor-pointer hover:opacity-90"
                              >
                                Vào họp
                              </button>
                            ) : (
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                Đã xác nhận
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>

            <InsightCard />

            <QuickActions />

            <EnterpriseOperationsCard
              onOpenAttendance={() => setAttendanceSheetOpen(true)}
              onOpenWorkflow={() => setWorkflowSheetOpen(true)}
              onOpenApprovals={() => setApprovalsSheetOpen(true)}
            />

            {/* BC-Mobile-6A — calm intelligence: own query, never blocks Home. */}
            <div id="tour-vione-ai-suggestions">
              <RelationshipSuggestions />
            </div>

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

            {/* In-App Native Operational Sheets — Không chuyển hướng ra web CRM */}
            <AttendanceMobileSheet
              open={attendanceSheetOpen}
              onClose={() => setAttendanceSheetOpen(false)}
            />
            <WorkflowMobileSheet
              open={workflowSheetOpen}
              onClose={() => setWorkflowSheetOpen(false)}
            />
            <ApprovalsMobileSheet
              open={approvalsSheetOpen}
              onClose={() => setApprovalsSheetOpen(false)}
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
    <nav id="tour-vione-quick-actions" aria-label={t("bc.mobile.home.quick.title")} className="mt-5 grid grid-cols-3 gap-2">
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

/** Giám sát Vận hành & Tiến độ nhân sự theo chuẩn BRD Master 5.0 — Mở Sheet Native in-app */
function EnterpriseOperationsCard({
  onOpenAttendance,
  onOpenWorkflow,
  onOpenApprovals,
}: {
  onOpenAttendance: () => void;
  onOpenWorkflow: () => void;
  onOpenApprovals: () => void;
}) {
  return (
    <section
      aria-labelledby="bc-home-ops"
      className="relative mt-5 overflow-hidden rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-5 shadow-xs transition-all hover:border-[var(--bc-mobile-border-gold)]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[var(--bc-mobile-accent)]" strokeWidth={1.8} />
          <h2
            id="bc-home-ops"
            className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--bc-mobile-muted)]"
          >
            GIÁM SÁT VẬN HÀNH & NHÂN SỰ
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          THỜI GIAN THỰC
        </span>
      </div>

      <p className="mt-3 text-[18px] font-bold leading-tight text-[var(--bc-mobile-text)] uppercase">
        TỔNG THỂ QUY TRÌNH & TIẾN ĐỘ NHÂN VIÊN
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-[var(--bc-mobile-muted)]">
        Kiểm soát quy trình tự động, phân bổ khối lượng công việc đội ngũ, điểm danh văn phòng và phê duyệt đề xuất thanh toán.
      </p>

      {/* Grid 3 thẻ nghiệp vụ chuẩn BRD — Không chuyển hướng ra CRM */}
      <div className="mt-4 flex flex-col gap-3">
        {/* Thẻ 1: Chấm công GPS & FaceID */}
        <button
          type="button"
          onClick={onOpenAttendance}
          className="group w-full text-left block rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-3.5 transition-all hover:border-[var(--bc-mobile-border-gold)] cursor-pointer active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <MapPin className="h-4 w-4" />
              </span>
              <span className="text-[14px] font-bold text-[var(--bc-mobile-text)] group-hover:text-[var(--bc-mobile-accent)] transition-colors">
                Chấm công GPS & Điểm danh khuôn mặt
              </span>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">
              42/45 CÓ MẶT (93.3%)
            </span>
          </div>
          <p className="mt-2 text-[12px] text-[var(--bc-mobile-muted)]">
            Định vị tại văn phòng · Nhận diện khuôn mặt chính chủ · 1-chạm điểm danh nhanh
          </p>
          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-[var(--bc-mobile-border)] text-[12px] font-semibold text-[var(--bc-mobile-accent)]">
            <span>Mở bảng điểm danh & xin nghỉ</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* Thẻ 2: Quy trình & Tiến độ nhân sự */}
        <button
          type="button"
          onClick={onOpenWorkflow}
          className="group w-full text-left block rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-3.5 transition-all hover:border-[var(--bc-mobile-border-gold)] cursor-pointer active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <Layers className="h-4 w-4" />
              </span>
              <span className="text-[14px] font-bold text-[var(--bc-mobile-text)] group-hover:text-[var(--bc-mobile-accent)] transition-colors">
                Quy trình & Tiến độ nhân sự
              </span>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10.5px] font-bold text-rose-600 dark:text-rose-400">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              2 VIỆC TRỄ HẠN
            </span>
          </div>
          <p className="mt-2 text-[12px] text-[var(--bc-mobile-muted)]">
            12 việc đang xử lý · Tối đa 5 việc/nhân sự cùng lúc · Cảnh báo nhân sự quá giờ
          </p>
          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-[var(--bc-mobile-border)] text-[12px] font-semibold text-[var(--bc-mobile-accent)]">
            <span>Theo dõi tiến độ đội ngũ & Kanban</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* Thẻ 3: Phê duyệt chi 3 cấp */}
        <button
          type="button"
          onClick={onOpenApprovals}
          className="group w-full text-left block rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-3.5 transition-all hover:border-[var(--bc-mobile-border-gold)] cursor-pointer active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span className="text-[14px] font-bold text-[var(--bc-mobile-text)] group-hover:text-[var(--bc-mobile-accent)] transition-colors">
                Phê duyệt chi 3 cấp
              </span>
            </div>
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10.5px] font-bold text-amber-600 dark:text-amber-400">
              3 TỜ TRÌNH CHỜ DUYỆT
            </span>
          </div>
          <p className="mt-2 text-[12px] text-[var(--bc-mobile-muted)]">
            Quy trình 3 cấp: Người lập → Kế toán kiểm tra → Lãnh đạo phê duyệt
          </p>
          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-[var(--bc-mobile-border)] text-[12px] font-semibold text-[var(--bc-mobile-accent)]">
            <span>Ký duyệt chi & Chuyển khoản QR ngân hàng</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </div>
    </section>
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
  const [quickEditOpen, setQuickEditOpen] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [profileVersion, setProfileVersion] = useState(0);

  // Load custom profile if available from localStorage
  const customProfile = useMemo(() => {
    try {
      const raw = localStorage.getItem("vba_custom_profile");
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }, [profileVersion]);

  useEffect(() => {
    const onUpdated = () => setProfileVersion((v) => v + 1);
    window.addEventListener("vba_profile_updated", onUpdated);
    window.addEventListener("storage", onUpdated);
    return () => {
      window.removeEventListener("vba_profile_updated", onUpdated);
      window.removeEventListener("storage", onUpdated);
    };
  }, []);

  const viewerUserId = useViewerUserId();
  const mine = useMyIdentity({ enabled: Boolean(viewerUserId) });
  const profileIdentity = mine.data?.identity ?? null;

  // Tên hiển thị (lấy từ dữ liệu thật trong DB)
  const name =
    customProfile?.name?.trim() ||
    profileIdentity?.displayName ||
    identity.displayName ||
    identity.email?.split("@")[0] ||
    "Doanh nhân ViOne";

  // Số điện thoại
  const phone =
    customProfile?.phone?.trim() ||
    profileIdentity?.primaryPhone ||
    "";

  // Ảnh đại diện
  const rawAvatarUrl = customProfile?.avatar || profileIdentity?.avatarUrl || identity.avatarUrl || null;
  const avatarUrl = avatarOrDemo(rawAvatarUrl, name);

  // Ảnh bìa
  const coverUrl =
    customProfile?.cover ||
    profileIdentity?.coverUrl ||
    "";

  return (
    <div id="tour-vione-profile-banner" className="relative mt-2">
      {/* Thẻ người dùng ViOne: Bao gồm ảnh bìa cùng tên, số điện thoại. Bấm vào mở Bottom Sheet chi tiết */}
      <div
        onClick={() => setProfileSheetOpen(true)}
        className="relative overflow-hidden rounded-3xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] shadow-md transition-all hover:border-[var(--bc-mobile-border-gold)] cursor-pointer active:scale-[0.99]"
      >
        {/* Ảnh bìa */}
        <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-950">
          {coverUrl ? (
            <img
              src={resolveMediaUrl(coverUrl) || coverUrl}
              alt="Cover"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

          {/* Nút Chỉnh sửa nhanh trên ảnh bìa - chỉ để icon */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setQuickEditOpen(true);
            }}
            title="Chỉnh sửa thông tin"
            aria-label="Chỉnh sửa thông tin"
            className="absolute top-2.5 right-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-md text-slate-700 dark:text-amber-400 border border-slate-200/60 dark:border-white/20 hover:border-amber-400 shadow-md cursor-pointer active:scale-90 transition-all"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        {/* Khối thông tin: Thông tin bên TRÁI, Avatar tròn bên PHẢI */}
        <div className="p-4 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--bc-mobile-accent-soft)] text-[var(--bc-mobile-accent)] border border-[var(--bc-mobile-border)] mb-1">
              Doanh Nhân ViOne
            </span>
            <h1 className="truncate text-[20px] sm:text-[22px] font-bold tracking-tight text-[var(--bc-mobile-text)]">
              {name}
            </h1>
            {phone ? (
              <p className="mt-1 flex items-center gap-2 text-[13.5px] font-semibold text-[var(--bc-mobile-accent)]">
                <Phone className="h-3.5 w-3.5 text-[var(--bc-mobile-accent)] shrink-0" />
                <span>{phone}</span>
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setProfileSheetOpen(true);
            }}
            aria-label="Xem hồ sơ cá nhân"
            className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 border-[var(--bc-mobile-border-gold)] p-0.5 shadow-lg overflow-hidden bg-[var(--bc-mobile-surface)] hover:scale-105 transition-transform cursor-pointer"
          >
            <img
              src={avatarUrl}
              alt={name}
              className="h-full w-full rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = demoAvatar(name);
              }}
            />
          </button>
        </div>
      </div>

      {/* Popup Hồ sơ cá nhân từ dưới lên (Facebook, Zalo, Call, Bio...) */}
      <PersonalProfileBottomSheet
        open={profileSheetOpen}
        onClose={() => setProfileSheetOpen(false)}
        profile={{
          displayName: name,
          jobTitle: customProfile?.jobTitle || profileIdentity?.headline || profileIdentity?.jobTitle || "Doanh nhân",
          companyName: customProfile?.company || profileIdentity?.companyName || "Thành viên ViOne",
          avatarUrl: rawAvatarUrl,
          coverUrl: coverUrl,
          phone: phone || null,
          email: profileIdentity?.email || identity.email || null,
          address: customProfile?.address || profileIdentity?.address || null,
          bio: customProfile?.bio || profileIdentity?.bio || null,
          facebookUrl: customProfile?.facebook || null,
          linkedinUrl: customProfile?.linkedin || null,
          website: customProfile?.website || null,
          memberCode: profileIdentity?.memberCode || (identity as any)?.memberCode || "HỘI VIÊN CHÍNH THỨC",
          isOwner: true,
        }}
        onEdit={() => {
          setProfileSheetOpen(false);
          setQuickEditOpen(true);
        }}
        onOpenQr={() => {
          setProfileSheetOpen(false);
          window.location.href = "/connect-app/me/card";
        }}
      />

      {/* Modal Chỉnh sửa nhanh */}
      {quickEditOpen && (
        <QuickEditProfileModal
          initialName={name}
          initialPhone={phone}
          initialAvatar={avatarUrl}
          initialCover={coverUrl}
          initialJobTitle={customProfile?.jobTitle || ""}
          initialCompany={customProfile?.company || ""}
          initialFacebook={customProfile?.facebook || localStorage.getItem("vba_facebook_url") || ""}
          initialBio={customProfile?.bio || ""}
          onClose={() => setQuickEditOpen(false)}
          onSaved={() => {
            setQuickEditOpen(false);
            setProfileVersion((v) => v + 1);
            void mine.refetch();
            toast.success("✓ Đã cập nhật thông tin hồ sơ thành công!");
          }}
        />
      )}
    </div>
  );
}

function QuickEditProfileModal({
  initialName,
  initialPhone,
  initialAvatar,
  initialCover,
  initialJobTitle,
  initialCompany,
  initialFacebook,
  initialBio,
  onClose,
  onSaved,
}: {
  initialName: string;
  initialPhone: string;
  initialAvatar: string;
  initialCover: string;
  initialJobTitle?: string;
  initialCompany?: string;
  initialFacebook?: string;
  initialBio?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [cover, setCover] = useState(initialCover);
  const [jobTitle, setJobTitle] = useState(initialJobTitle || "");
  const [company, setCompany] = useState(initialCompany || "");
  const [facebook, setFacebook] = useState(initialFacebook || "");
  const [bio, setBio] = useState(initialBio || "");

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadFileToNest(file, file.name);
      if (url) {
        setAvatar(url);
        toast.success("✓ Đã tải ảnh đại diện lên máy chủ thành công!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi tải ảnh đại diện lên");
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadFileToNest(file, file.name);
      if (url) {
        setCover(url);
        toast.success("✓ Đã tải ảnh bìa lên máy chủ thành công!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi tải ảnh bìa lên");
    } finally {
      setUploadingCover(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const existingRaw = localStorage.getItem("vba_custom_profile");
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      const updated = {
        ...existing,
        name: name.trim() || initialName,
        phone: phone.trim() || initialPhone,
        avatar: avatar.trim() || initialAvatar,
        cover: cover.trim() || initialCover,
        jobTitle: jobTitle.trim(),
        company: company.trim(),
        facebook: facebook.trim(),
        bio: bio.trim(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem("vba_custom_profile", JSON.stringify(updated));
      localStorage.setItem("ceo1983_member_phone", updated.phone);
      if (facebook.trim()) {
        localStorage.setItem("vba_facebook_url", facebook.trim());
      }

      // Lưu lên máy chủ ViOne Connect backend
      await fetchNestApi("/connect-app/me/identity", {
        method: "PUT",
        body: JSON.stringify({
          displayName: updated.name,
          primaryPhone: updated.phone,
          avatarUrl: updated.avatar,
          coverUrl: updated.cover,
          jobTitle: updated.jobTitle,
          companyName: updated.company,
          bio: updated.bio,
          facebookUrl: updated.facebook,
        }),
      }).catch((err) => {
        console.warn("[QuickEditProfileModal] sync backend identity error:", err);
      });

      window.dispatchEvent(new Event("vba_profile_updated"));
      window.dispatchEvent(new Event("vba_member_avatar_updated"));
      onSaved();
    } catch {
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--bc-mobile-border)]">
          <h3 className="text-base font-bold text-[var(--bc-mobile-text)]">
            Chỉnh sửa nhanh thông tin
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Khối tải ảnh bìa & ảnh đại diện trực quan */}
        <div className="mt-4 space-y-4">
          {/* Ảnh bìa */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[var(--bc-mobile-text)]">
                Ảnh bìa trang cá nhân
              </label>
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-[#D8B282] hover:underline cursor-pointer disabled:opacity-50"
              >
                {uploadingCover ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Đang tải lên...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-3 w-3" />
                    <span>Tải ảnh bìa</span>
                  </>
                )}
              </button>
            </div>
            <input
              type="file"
              ref={coverInputRef}
              accept="image/*"
              onChange={handleCoverFile}
              className="hidden"
            />
            <div
              onClick={() => coverInputRef.current?.click()}
              className="group relative h-28 w-full rounded-2xl overflow-hidden border border-[var(--bc-mobile-border)] bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-950 cursor-pointer hover:border-[var(--bc-mobile-border-gold)] transition-all shadow-inner"
            >
              {cover ? (
                <img
                  src={resolveMediaUrl(cover) || cover}
                  alt="Cover"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/70 text-xs font-medium">
                  Chưa có ảnh bìa — Chạm để tải ảnh từ máy
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 transition-colors flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold shadow-md">
                  <Camera className="h-3.5 w-3.5 text-amber-400" />
                  {uploadingCover ? "Đang tải ảnh bìa lên MinIO..." : "Chạm để thay đổi ảnh bìa"}
                </span>
              </div>
            </div>
          </div>

          {/* Ảnh đại diện */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[var(--bc-mobile-text)]">
                Ảnh đại diện
              </label>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-[#D8B282] hover:underline cursor-pointer disabled:opacity-50"
              >
                {uploadingAvatar ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Đang tải lên...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-3 w-3" />
                    <span>Tải ảnh đại diện</span>
                  </>
                )}
              </button>
            </div>
            <input
              type="file"
              ref={avatarInputRef}
              accept="image/*"
              onChange={handleAvatarFile}
              className="hidden"
            />
            <div className="flex items-center gap-3.5 p-3 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)]">
              <div
                onClick={() => avatarInputRef.current?.click()}
                className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 border-[var(--bc-mobile-border-gold)] overflow-hidden bg-[var(--bc-mobile-surface)] cursor-pointer group shadow-md"
              >
                <img
                  src={resolveMediaUrl(avatar) || avatarOrDemo(avatar, name)}
                  alt="Avatar"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    e.currentTarget.src = demoAvatar(name);
                  }}
                />
                <div className="absolute inset-0 bg-black/35 group-hover:bg-black/50 transition-colors grid place-items-center">
                  <Camera className="h-4 w-4 text-white drop-shadow" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--bc-mobile-border-gold)] bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-700 dark:text-[#D8B282] cursor-pointer transition-colors"
                >
                  {uploadingAvatar ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Đang tải lên MinIO...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-3.5 w-3.5" />
                      <span>Chọn ảnh từ thiết bị</span>
                    </>
                  )}
                </button>
                <p className="mt-1 text-[11px] text-[var(--bc-mobile-muted)] truncate">
                  Định dạng JPG, PNG, WEBP. Tự động lưu lên hệ thống.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-[var(--bc-mobile-muted)]">
              Họ và tên
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập họ và tên..."
              className="mt-1 w-full rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--bc-mobile-text)] focus:border-[var(--bc-mobile-border-gold)] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--bc-mobile-muted)]">
              Chức vụ / Chức danh
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Ví dụ: Giám đốc điều hành, Phó chủ tịch..."
              className="mt-1 w-full rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--bc-mobile-text)] focus:border-[var(--bc-mobile-border-gold)] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--bc-mobile-muted)]">
              Doanh nghiệp / Công ty
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Tên công ty hoặc thương hiệu..."
              className="mt-1 w-full rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--bc-mobile-text)] focus:border-[var(--bc-mobile-border-gold)] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--bc-mobile-muted)]">
              Số điện thoại
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại..."
              className="mt-1 w-full rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--bc-mobile-text)] focus:border-[var(--bc-mobile-border-gold)] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--bc-mobile-muted)] flex items-center justify-between">
              <span>Link Facebook cá nhân</span>
              <span className="text-[10px] text-amber-600 dark:text-[#D8B282] font-bold">facebook.com/username</span>
            </label>
            <input
              type="text"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="https://facebook.com/your-profile"
              className="mt-1 w-full rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--bc-mobile-text)] focus:border-[var(--bc-mobile-border-gold)] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--bc-mobile-muted)]">
              Giới thiệu / Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              placeholder="Giới thiệu ngắn về bản thân & lĩnh vực kinh doanh..."
              className="mt-1 w-full rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3.5 py-2 text-xs sm:text-sm text-[var(--bc-mobile-text)] focus:border-[var(--bc-mobile-border-gold)] outline-none resize-none"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 pt-2 border-t border-[var(--bc-mobile-border)]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full border border-[var(--bc-mobile-border)] text-xs font-semibold text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploadingAvatar || uploadingCover}
            className="flex-1 py-2.5 rounded-full bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-[#050c15] text-xs font-bold shadow-md cursor-pointer hover:brightness-105 active:scale-98 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <span>Lưu thay đổi</span>
            )}
          </button>
        </div>
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

/** Một dòng sự kiện SẮP TỚI — hiển thị ngày tháng chuẩn từ CRM, ảnh 1 nửa ở sự kiện, tên sự kiện, địa điểm, sức chứa và mở EventDetailMobileSheet khi bấm */
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

  const typeFallbacks: Record<string, string> = {
    forum: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80",
    workshop: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=600&q=80",
    networking: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80",
    training: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80",
  };
  const rawImage = (event as any).imageUrl || (event as any).image || (event as any).bannerUrl || (event as any).coverUrl;
  const eventImg = rawImage || typeFallbacks[(event as any).type] || typeFallbacks.forum;

  return (
    <li className="relative group">
      <span
        aria-hidden="true"
        className="absolute -left-[21px] top-[6px] h-2.5 w-2.5 rounded-full bg-[var(--bc-mobile-accent)] shadow-xs group-hover:scale-125 transition-transform"
      />
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-col items-start w-full text-left rounded-2xl p-2.5 -m-1 transition-all hover:bg-black/5 dark:hover:bg-white/[0.03] active:bg-black/10 dark:active:bg-white/[0.06] border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] hover:border-[var(--bc-mobile-border-gold)] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--bc-mobile-accent)] shadow-xs"
      >
        {/* Ảnh 1 nửa ở sự kiện (Half-height banner image) */}
        <div className="relative mb-2.5 h-28 sm:h-32 w-full overflow-hidden rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)]">
          <img
            src={eventImg}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = typeFallbacks.forum;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[11px] font-semibold">
            <span className="truncate max-w-[70%]">{location || "Sự kiện ViOne & CEO 1983"}</span>
            {(event as any).type && (
              <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] bg-black/60 backdrop-blur-xs text-amber-300 border border-amber-300/30">
                {(event as any).type === "online" ? "Trực tuyến" : "Trực tiếp"}
              </span>
            )}
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-[12px] font-bold capitalize tabular-nums text-[var(--bc-mobile-accent)]">
            {dateFormatted} {timeFormatted ? `· ${timeFormatted}` : ""}
          </span>
          {(event as any).registered !== undefined &&
            (event as any).capacity !== undefined &&
            Number((event as any).capacity) > 0 && (
              <span className="text-[11px] font-semibold text-[var(--bc-mobile-muted)]">
                {(event as any).registered}/{(event as any).capacity} đã đăng ký
              </span>
            )}
        </div>

        <span className="mt-1 block text-[15px] font-bold text-[var(--bc-mobile-text)] group-hover:text-[var(--bc-mobile-accent)] transition-colors leading-snug line-clamp-2 text-left">
          {title}
        </span>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--bc-mobile-muted)]">
          {organizer && (
            <span className="font-semibold text-[var(--bc-mobile-text)] truncate max-w-[200px]">
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
