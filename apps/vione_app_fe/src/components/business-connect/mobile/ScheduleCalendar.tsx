// Xem lịch — /connect-app/calendar
//
// Lịch làm việc & sự kiện của người dùng tổng hợp từ:
// 1. Sự kiện đã lưu / thêm vào lịch (vione_saved_calendar_events)
// 2. Sự kiện đã đăng ký tham gia từ hệ sinh thái (/events)
// 3. Cuộc gặp & việc cần theo dõi (Work Hub / useBusinessConnectHome)

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CalendarPlus, RefreshCw } from "lucide-react";
import { useFmt, useT } from "@/lib/i18n";
import { useBusinessConnectHome, type BcMobileTodayItem } from "@/hooks/use-business-connect-home";
import { fetchNestApi } from "@/lib/api-client";
import { getSavedCalendarEvents, type SavedCalendarEvent } from "@/lib/business-connect/mobile/calendar-storage";
import { TodayItem } from "./TodayItem";
import { EventDetailMobileSheet } from "./EventDetailMobileSheet";
import type { CrmEvent } from "./ExecutiveHome";

type Filter = "all" | "event" | "meeting" | "follow_up";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "event", label: "Sự kiện" },
  { id: "meeting", label: "Cuộc gặp" },
  { id: "follow_up", label: "Cần theo dõi" },
];

function itemDate(item: BcMobileTodayItem): Date | null {
  const raw = item.startsAt ?? item.dueAt;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function matchesFilter(item: BcMobileTodayItem, filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "event") return item.kind === "calendar" || item.id.startsWith("event:");
  if (filter === "meeting") return item.kind === "meeting";
  if (filter === "follow_up") return item.kind === "follow_up";
  return true;
}

export function ScheduleCalendar() {
  const t = useT();
  const fmt = useFmt();
  const home = useBusinessConnectHome();
  const [filter, setFilter] = useState<Filter>("all");

  // Sự kiện đã lưu cá nhân
  const [savedEvents, setSavedEvents] = useState<SavedCalendarEvent[]>(() => getSavedCalendarEvents());

  // Lắng nghe thay đổi từ các modal sự kiện khác
  useEffect(() => {
    const handleUpdate = () => {
      setSavedEvents(getSavedCalendarEvents());
    };
    window.addEventListener("vione:calendar-updated", handleUpdate);
    return () => window.removeEventListener("vione:calendar-updated", handleUpdate);
  }, []);

  // Lấy danh sách sự kiện từ backend /events để kiểm tra các sự kiện đã đăng ký
  const [crmEvents, setCrmEvents] = useState<CrmEvent[]>([]);
  useEffect(() => {
    let active = true;
    fetchNestApi<any[]>("/events")
      .then((res) => {
        if (active && Array.isArray(res)) {
          setCrmEvents(res);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Modal xem chi tiết sự kiện khi bấm từ lịch
  const [selectedEvent, setSelectedEvent] = useState<CrmEvent | null>(null);
  const [isEventSheetOpen, setIsEventSheetOpen] = useState(false);

  // Chuyển đổi sự kiện đã lưu và sự kiện đã đăng ký thành TodayItem
  const eventItems: BcMobileTodayItem[] = useMemo(() => {
    const list: BcMobileTodayItem[] = [];
    const seenIds = new Set<string>();

    for (const s of savedEvents) {
      seenIds.add(s.id);
      list.push({
        id: `event:${s.id}`,
        kind: "calendar",
        titleKey: s.title,
        descriptionKey: s.location || (s.isOnline ? "Sự kiện trực tuyến" : "Sự kiện kết nối"),
        startsAt: s.startsAt,
        dueAt: s.startsAt,
        category: "upcoming",
        urgency: "normal",
        counterpartDisplayName: s.organizer || "ViOne Event",
        action: {
          labelKey: "bc.workHub.action.view",
          targetRoute: null,
          targetParams: null,
          targetSearch: null,
          canRoute: false,
        },
      });
    }

    for (const e of crmEvents) {
      if (seenIds.has(e.id)) continue;
      const isReg =
        (typeof window !== "undefined" && localStorage.getItem(`bc_event_reg_${e.id}`) === "true") ||
        (e as any).registered;
      if (isReg) {
        seenIds.add(e.id);
        const startsAt = e.date || (e as any).startDate || new Date().toISOString();
        list.push({
          id: `event:${e.id}`,
          kind: "calendar",
          titleKey: e.title || (e as any).name || "Sự kiện doanh nghiệp",
          descriptionKey: e.location || (e.type === "online" ? "Sự kiện trực tuyến" : "Sự kiện trực tiếp"),
          startsAt,
          dueAt: startsAt,
          category: "upcoming",
          urgency: "normal",
          counterpartDisplayName: e.associationName || (e as any).communityName || "ViOne Event",
          action: {
            labelKey: "bc.workHub.action.view",
            targetRoute: "/events/$eventId",
            targetParams: { eventId: String(e.id) },
            targetSearch: null,
            canRoute: true,
          },
        });
      }
    }

    return list;
  }, [savedEvents, crmEvents]);

  // Hợp nhất dữ liệu: Work Hub hôm nay + Toàn bộ sự kiện đã lưu và đăng ký
  const pool = useMemo(() => {
    const homePool = home.data?.today.pool ?? [];
    return [...eventItems, ...homePool];
  }, [eventItems, home.data?.today.pool]);

  const dataError = home.data?.today.status === "error";

  const { groups, undated } = useMemo(() => {
    const filtered = pool.filter((i) => matchesFilter(i, filter));
    const map = new Map<string, { date: Date; items: BcMobileTodayItem[] }>();
    const noDate: BcMobileTodayItem[] = [];
    for (const item of filtered) {
      const d = itemDate(item);
      if (!d) {
        noDate.push(item);
        continue;
      }
      const key = dayKey(d);
      const bucket = map.get(key);
      if (bucket) bucket.items.push(item);
      else map.set(key, { date: d, items: [item] });
    }
    const sorted = [...map.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
    for (const g of sorted) {
      g.items.sort((a, b) => {
        const da = itemDate(a)?.getTime() ?? 0;
        const db = itemDate(b)?.getTime() ?? 0;
        return da - db;
      });
    }
    return { groups: sorted, undated: noDate };
  }, [pool, filter]);

  const total = groups.reduce((n, g) => n + g.items.length, 0) + undated.length;

  function dayLabel(date: Date): string {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (dayKey(date) === dayKey(today)) return t("bc.mobile.calendar.day.today");
    if (dayKey(date) === dayKey(tomorrow)) return t("bc.mobile.calendar.day.tomorrow");
    return date.toLocaleDateString(fmt.locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  const handleSelectItem = (item: BcMobileTodayItem) => {
    if (item.id.startsWith("event:")) {
      const eventId = item.id.replace(/^event:/, "");
      const matched = crmEvents.find((e) => e.id === eventId);
      const savedMatched = savedEvents.find((s) => s.id === eventId);
      if (matched) {
        setSelectedEvent(matched);
      } else if (savedMatched) {
        setSelectedEvent({
          id: savedMatched.id,
          title: savedMatched.title,
          date: savedMatched.startsAt,
          location: savedMatched.location || "ViOne Center",
          type: savedMatched.isOnline ? "online" : "offline",
          associationName: savedMatched.organizer,
          description: savedMatched.description,
        });
      }
      setIsEventSheetOpen(true);
    }
  };

  return (
    <div className="pt-5 pb-12">
      <section className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--bc-mobile-border-gold)] text-[var(--bc-mobile-accent)] bg-[var(--bc-mobile-surface-2)]"
        >
          <CalendarDays className="h-[18px] w-[18px]" strokeWidth={1.6} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-[20px] font-semibold leading-tight text-[var(--bc-mobile-text)]">
            {t("bc.mobile.calendar.title")}
          </h1>
          <p className="mt-0.5 text-[12.5px] text-[var(--bc-mobile-muted)]">
            Lịch cuộc gặp, việc cần theo dõi và sự kiện đã lưu của bạn.
          </p>
        </div>
      </section>

      {/* Bộ lọc tab */}
      <div
        role="tablist"
        aria-label={t("bc.mobile.calendar.filter.label")}
        className="mt-4 flex flex-wrap gap-2"
      >
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.id)}
              style={active ? { background: "var(--bc-mobile-accent-grad)" } : undefined}
              className={`inline-flex min-h-[34px] items-center rounded-full px-3.5 text-[12.5px] font-semibold transition-all cursor-pointer ${
                active
                  ? "text-[#050c15] shadow-xs"
                  : "border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] text-slate-400 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="mt-3 text-[12px] text-[var(--bc-mobile-muted)]">
        {home.isPending && eventItems.length === 0
          ? t("bc.mobile.calendar.loading")
          : t("bc.mobile.calendar.count", { count: total })}
      </p>

      {home.isError && dataError && eventItems.length === 0 ? (
        <section role="alert" className="mt-6 text-center">
          <p className="text-[13.5px] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.calendar.error")}
          </p>
          <button
            type="button"
            onClick={() => void home.refetch()}
            className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--bc-mobile-border-gold)] px-4 text-[13px] font-medium text-[var(--bc-mobile-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)]"
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            {t("bc.mobile.calendar.retry")}
          </button>
        </section>
      ) : total === 0 ? (
        <section className="mt-8 rounded-3xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-accent)]">
            <CalendarPlus className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <p className="text-[15px] font-bold text-[var(--bc-mobile-text)]">
            Chưa có lịch hẹn hoặc sự kiện nào
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--bc-mobile-muted)] max-w-xs mx-auto">
            Khi bạn lưu sự kiện hoặc thiết lập lịch hẹn công việc, mọi kế hoạch sẽ hiển thị gọn gàng tại đây.
          </p>
        </section>
      ) : (
        <div className="mt-5 space-y-7">
          {groups.map((g) => (
            <section key={dayKey(g.date)}>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--bc-mobile-accent)]">
                {dayLabel(g.date)}
              </h2>
              <ul className="mt-3 space-y-3 border-l-2 border-[var(--bc-mobile-border-gold)] pl-3.5">
                {g.items.map((item) => (
                  <TodayItem key={item.id} item={item} onSelect={handleSelectItem} />
                ))}
              </ul>
            </section>
          ))}

          {undated.length > 0 ? (
            <section>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--bc-mobile-muted)]">
                {t("bc.mobile.calendar.undated")}
              </h2>
              <ul className="mt-3 space-y-3 border-l-2 border-[var(--bc-mobile-border)] pl-3.5">
                {undated.map((item) => (
                  <TodayItem key={item.id} item={item} onSelect={handleSelectItem} />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}

      {/* Sheet xem chi tiết sự kiện khi bấm từ lịch */}
      {selectedEvent && (
        <EventDetailMobileSheet
          open={isEventSheetOpen}
          onOpenChange={setIsEventSheetOpen}
          event={selectedEvent}
          onRegisteredChange={() => {
            setSavedEvents(getSavedCalendarEvents());
          }}
        />
      )}
    </div>
  );
}
