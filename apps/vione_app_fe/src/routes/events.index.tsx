import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  CalendarDays,
  Download,
  LayoutGrid,
  List,
  Eye,
  MapPin,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/AppShell";
import { PageHeader, StatCard } from "@/components/dashboard/PageKit";
import { EmptyState, NoSearchResult } from "@/components/dashboard/StateKit";
import { CrudModal, type CrudField, type CrudValues } from "@/components/dashboard/CrudModal";
import { EventWizard } from "@/components/dashboard/EventWizard";
import { TruncatedText } from "@/components/dashboard/TruncatedText";
import { useTableControls } from "@/hooks/use-table-controls";
import { Pagination } from "@/components/dashboard/DataTablePagination";
import {
  type EventItem,
} from "@/lib/events.functions";
import { fetchNestApi } from "@/lib/api-client";
import {
  getEventView,
  setEventView,
  getEventFilters,
  saveEventFilter,
  deleteEventFilter,
  type EventView,
  type EventSavedFilter,
} from "@/lib/event-prefs";
import { useFmt, useT, type TKey } from "@/lib/i18n";
import { downloadCsv } from "@/lib/csv";

export const Route = createFileRoute("/events/")({
  ssr: false,
  loader: async () => {
    try {
      const res = await fetchNestApi<EventItem[]>("/events");
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },
  component: EventsPage,
});

type Bucket = "all" | "today" | "week" | "upcoming" | "past";

const STATUS_TONE: Record<EventItem["status"], { bg: string; fg: string }> = {
  upcoming: { bg: "oklch(0.93 0.05 255)", fg: "oklch(0.45 0.16 265)" },
  ongoing: { bg: "oklch(0.93 0.07 155)", fg: "oklch(0.40 0.16 155)" },
  completed: { bg: "oklch(0.94 0.005 260)", fg: "oklch(0.50 0.02 260)" },
  cancelled: { bg: "oklch(0.94 0.06 25)", fg: "oklch(0.50 0.20 25)" },
};
const STATUS_KEY: Record<EventItem["status"], TKey> = {
  upcoming: "events.status.upcoming",
  ongoing: "events.status.ongoing",
  completed: "events.status.completed",
  cancelled: "events.status.cancelled",
};
const TYPE_KEY: Record<EventItem["type"], TKey> = {
  forum: "events.type.forum",
  workshop: "events.type.workshop",
  networking: "events.type.networking",
  training: "events.type.training",
};
// Decorative branded covers per event type — purely visual, no fabricated data.
const TYPE_COVER: Record<EventItem["type"], string> = {
  forum: "linear-gradient(135deg, oklch(0.55 0.18 265), oklch(0.62 0.16 300))",
  workshop: "linear-gradient(135deg, oklch(0.55 0.15 195), oklch(0.60 0.14 235))",
  networking: "linear-gradient(135deg, oklch(0.58 0.16 330), oklch(0.60 0.16 20))",
  training: "linear-gradient(135deg, oklch(0.55 0.15 155), oklch(0.60 0.14 195))",
};

const EVENT_FALLBACK_IMAGES: Record<string, string> = {
  forum: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80",
  workshop: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1000&auto=format&fit=crop&q=80",
  networking: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1000&auto=format&fit=crop&q=80",
  training: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1000&auto=format&fit=crop&q=80",
  default: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1000&auto=format&fit=crop&q=80",
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function bucketOf(iso: string): Exclude<Bucket, "all"> {
  const today = startOfDay(new Date());
  const d = startOfDay(new Date(iso));
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "past";
  if (diffDays === 0) return "today";
  if (diffDays <= 7) return "week";
  return "upcoming";
}

function getEffectiveStatus(e: { status?: EventItem["status"]; date: string }): EventItem["status"] {
  if (e.status === "cancelled") return "cancelled";
  if (e.status === "ongoing") return "ongoing";
  const today = startOfDay(new Date()).getTime();
  const d = startOfDay(new Date(e.date)).getTime();
  if (d < today) return "completed";
  return e.status || "upcoming";
}

function EventsPage() {
  const t = useT();
  const fmt = useFmt();
  const router = useRouter();
  const events = Route.useLoaderData() as EventItem[];

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<EventItem["status"] | "all">("all");
  const [type, setType] = useState<EventItem["type"] | "all">("all");
  const [bucket, setBucket] = useState<Bucket>("all");
  const [view, setView] = useState<EventView>("cards");
  const [savedFilters, setSavedFilters] = useState<EventSavedFilter[]>([]);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setView(getEventView());
    setSavedFilters(getEventFilters());
  }, []);

  const changeView = (v: EventView) => {
    setView(v);
    setEventView(v);
  };

  const fields: CrudField[] = [
    { name: "name", label: t("events.col.event"), type: "text", required: true },
    { name: "image", label: "Ảnh banner sự kiện", type: "image" },
    { name: "date", label: t("events.col.date"), type: "date", required: true },
    { name: "location", label: t("events.col.location"), type: "text" },
    { name: "capacity", label: t("events.kpi.capacity"), type: "number" },
    {
      name: "type",
      label: t("events.col.type"),
      type: "select",
      options: [
        { value: "forum", label: t("events.type.forum") },
        { value: "workshop", label: t("events.type.workshop") },
        { value: "networking", label: t("events.type.networking") },
        { value: "training", label: t("events.type.training") },
      ],
    },
    {
      name: "status",
      label: t("events.col.status"),
      type: "select",
      options: [
        { value: "upcoming", label: t("events.status.upcoming") },
        { value: "ongoing", label: t("events.status.ongoing") },
        { value: "completed", label: t("events.status.completed") },
        { value: "cancelled", label: t("events.status.cancelled") },
      ],
    },
  ];

  const onSubmit = async (v: CrudValues) => {
    setSubmitting(true);
    try {
      const payload = {
        ...v,
        capacity: v.capacity ? Number(v.capacity) : 0,
      };
      if (editing) {
        await fetchNestApi(`/events/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success(t("common.updated"));
      } else {
        await fetchNestApi("/events", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success(t("common.created"));
      }
      setOpen(false);
      setEditing(null);
      await router.invalidate();
    } catch (err: any) {
      console.error("[Events] Submit error:", err);
      toast.error(err?.message || t("common.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (e: EventItem) => {
    if (!window.confirm(t("events.deleteConfirm", { name: e.name }))) return;
    setDeletingId(e.id);
    try {
      await fetchNestApi(`/events/${e.id}`, { method: "DELETE" });
      toast.success(t("events.deleted"));
      await router.invalidate();
    } catch (err: any) {
      console.error("[Events] Delete error:", err);
      toast.error(err?.message || t("events.deleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  const bucketCounts = useMemo(() => {
    const c: Record<Bucket, number> = {
      all: events.length,
      today: 0,
      week: 0,
      upcoming: 0,
      past: 0,
    };
    for (const e of events) c[bucketOf(e.date)]++;
    return c;
  }, [events]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return events
      .filter((e: any) => {
        if (status === "all") return true;
        const eff = getEffectiveStatus(e);
        return eff === status || e.status === status;
      })
      .filter((e: any) => (type === "all" ? true : e.type === type))
      .filter((e: any) => (bucket === "all" ? true : bucketOf(e.date) === bucket))
      .filter(
        (e) => !ql || e.name.toLowerCase().includes(ql) || e.location.toLowerCase().includes(ql),
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [q, status, type, bucket, events]);

  const accessors = useMemo(
    () => ({
      name: (e: EventItem) => e.name,
      date: (e: EventItem) => e.date,
      type: (e: EventItem) => e.type,
      location: (e: EventItem) => e.location,
      status: (e: EventItem) => e.status,
      registered: (e: EventItem) => e.registered,
      capacity: (e: EventItem) => e.capacity,
    }),
    [],
  );

  const tc = useTableControls(filtered, accessors, {
    initialPageSize: 10,
    initialSortKey: "date",
    initialSortDir: "asc",
  });

  // Featured = soonest upcoming, non-cancelled event (visual highlight only).
  const featured = useMemo(() => {
    const today = startOfDay(new Date()).getTime();
    return events
      .filter((e: any) => e.status !== "cancelled" && startOfDay(new Date(e.date)).getTime() >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [events]);

  const totalReg = events.reduce((s, e) => s + e.registered, 0);
  const totalCap = events.reduce((s, e) => s + e.capacity, 0);

  const hasActiveFilter = q.trim() !== "" || status !== "all" || type !== "all" || bucket !== "all";

  const applySaved = (f: EventSavedFilter) => {
    setQ(f.q);
    setStatus((f.status as EventItem["status"] | "all") || "all");
    setType((f.type as EventItem["type"] | "all") || "all");
    setBucket((f.bucket as Bucket) || "all");
  };

  const onSaveFilter = () => {
    const name = window.prompt(t("events.saveFilterPrompt"));
    if (!name || !name.trim()) return;
    const next = saveEventFilter({
      id: `${Date.now()}`,
      name: name.trim(),
      q,
      status,
      type,
      bucket,
    });
    setSavedFilters(next);
    toast.success(t("events.filterSaved"));
  };

  const onDeleteFilter = (id: string) => {
    setSavedFilters(deleteEventFilter(id));
    toast.success(t("events.filterDeleted"));
  };

  const clearFilters = () => {
    setQ("");
    setStatus("all");
    setType("all");
    setBucket("all");
  };

  const handleExport = () => {
    downloadCsv("events", filtered, [
      { header: "Name", value: (e) => e.name },
      { header: "Date", value: (e) => e.date },
      { header: "Location", value: (e) => e.location },
      { header: "Type", value: (e) => e.type },
      { header: "Status", value: (e) => e.status },
      { header: "Registered", value: (e) => e.registered },
      { header: "Capacity", value: (e) => e.capacity },
    ]);
  };

  const buckets: { key: Bucket; label: TKey }[] = [
    { key: "all", label: "events.bucket.all" },
    { key: "today", label: "events.bucket.today" },
    { key: "week", label: "events.bucket.week" },
    { key: "upcoming", label: "events.bucket.upcoming" },
    { key: "past", label: "events.bucket.past" },
  ];

  return (
    <AppShell>
      <PageHeader
        title={t("events.title")}
        subtitle={t("events.subtitle")}
        actions={
          <>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-[var(--shadow-card)] hover:bg-muted"
            >
              <Download className="h-4 w-4 text-muted-foreground" />
              {t("common.export")}
            </button>
            <button
              onClick={() => {
                setWizardOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Plus className="h-4 w-4" />
              {t("events.create")}
            </button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t("events.kpi.total")}
          value={events.length}
          icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
        />
        <StatCard
          label={t("events.kpi.upcoming")}
          value={events.filter((e: any) => getEffectiveStatus(e) === "upcoming").length}
          tone="info"
          icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
        />
        <StatCard
          label={t("events.kpi.totalReg")}
          value={fmt.num(totalReg)}
          hint={
            totalCap > 0
              ? t("events.kpi.fillRate", { n: Math.round((totalReg / totalCap) * 100) })
              : undefined
          }
          tone="success"
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
        />
        <StatCard
          label={t("events.kpi.capacity")}
          value={fmt.num(totalCap)}
          tone="warning"
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
        />
      </div>

      {/* Featured event */}
      {featured && (
        <FeaturedCard
          event={featured}
          onOpen={() =>
            router.navigate({ to: "/events/$eventId", params: { eventId: featured.id } })
          }
        />
      )}

      {/* Sticky search + controls */}
      <div className="sm:sticky sm:top-18 z-20 mb-5 rounded-2xl border border-border bg-card/90 p-3 shadow-[var(--shadow-card)] backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full min-w-0 sm:min-w-[220px] sm:flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("events.searchPh")}
              className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:h-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as EventItem["type"] | "all")}
              className="h-11 min-w-0 rounded-lg border border-border bg-background px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:h-10"
            >
              <option value="all">{t("events.filter.allTypes")}</option>
              <option value="forum">{t("events.type.forum")}</option>
              <option value="workshop">{t("events.type.workshop")}</option>
              <option value="networking">{t("events.type.networking")}</option>
              <option value="training">{t("events.type.training")}</option>
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EventItem["status"] | "all")}
              className="h-11 min-w-0 rounded-lg border border-border bg-background px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:h-10"
            >
              <option value="all">{t("common.allStatuses")}</option>
              <option value="upcoming">{t("events.status.upcoming")}</option>
              <option value="ongoing">{t("events.status.ongoing")}</option>
              <option value="completed">{t("events.status.completed")}</option>
              <option value="cancelled">{t("events.status.cancelled")}</option>
            </select>

            {/* View toggle */}
            <div className="col-span-2 flex items-center gap-1 rounded-lg border border-border bg-background p-1 sm:col-span-1">
              <button
                type="button"
                onClick={() => changeView("table")}
                aria-label="Xem bảng"
                aria-pressed={view === "table"}
                title="Xem bảng"
                className={`grid h-9 flex-1 place-items-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:h-8 sm:w-8 sm:flex-none ${
                  view === "table"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => changeView("cards")}
                aria-label={t("events.view.cards")}
                aria-pressed={view === "cards"}
                title={t("events.view.cards")}
                className={`grid h-9 flex-1 place-items-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:h-8 sm:w-8 sm:flex-none ${
                  view === "cards"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => changeView("calendar")}
                aria-label={t("events.view.calendar")}
                aria-pressed={view === "calendar"}
                title={t("events.view.calendar")}
                className={`grid h-9 flex-1 place-items-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:h-8 sm:w-8 sm:flex-none ${
                  view === "calendar"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Time buckets */}
        <div className="-mx-3 mt-3 flex items-center gap-2 overflow-x-auto px-3 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
          {buckets.map((b) => (
            <button
              key={b.key}
              type="button"
              onClick={() => setBucket(b.key)}
              aria-pressed={bucket === b.key}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:py-1.5 ${
                bucket === b.key
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(b.label)} ({bucketCounts[b.key]})
            </button>
          ))}
          <span className="ml-auto shrink-0 pl-2 text-xs text-muted-foreground">
            {t("events.results", { n: filtered.length })}
          </span>
        </div>

        {/* Saved filters */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {savedFilters.map((f) => (
            <span
              key={f.id}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-background py-1 pl-3 pr-1 text-xs font-medium text-foreground"
            >
              <button type="button" onClick={() => applySaved(f)} className="hover:text-primary">
                {f.name}
              </button>
              <button
                type="button"
                onClick={() => onDeleteFilter(f.id)}
                aria-label={t("events.filterDeleted")}
                className="grid h-5 w-5 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
          {hasActiveFilter && (
            <>
              <button
                type="button"
                onClick={onSaveFilter}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <Star className="h-3 w-3" aria-hidden="true" /> {t("events.saveFilter")}
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" aria-hidden="true" /> {t("mdetail.reviews.clear")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        hasActiveFilter ? (
          <NoSearchResult />
        ) : (
          <EmptyState
            icon={<CalendarDays className="h-6 w-6" />}
            title={t("events.empty")}
            action={
              <button
                onClick={() => {
                  setWizardOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Plus className="h-4 w-4" /> {t("events.create")}
              </button>
            }
          />
        )
      ) : view === "table" ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto relative">
            <table className="w-full min-w-[1100px] whitespace-nowrap text-sm border-separate border-spacing-0">
              <thead>
                <tr className="border-b border-border bg-secondary/80 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="sticky left-0 z-20 w-[56px] min-w-[56px] max-w-[56px] bg-secondary px-3 py-3 text-center border-r border-b border-border">
                    STT
                  </th>
                  <th className="sticky left-[56px] z-20 min-w-[100px] bg-secondary px-4 py-3 border-r border-b border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                    Mã
                  </th>
                  <th className="px-4 py-3 border-b border-border">Tên sự kiện</th>
                  <th className="px-4 py-3 border-b border-border">Thời gian & Địa điểm</th>
                  <th className="px-4 py-3 border-b border-border">Phân loại</th>
                  <th className="px-4 py-3 border-b border-border">Đăng ký / Sức chứa</th>
                  <th className="px-4 py-3 border-b border-border">Trạng thái</th>
                  <th className="sticky right-0 z-20 min-w-[140px] bg-secondary px-4 py-3 text-right border-l border-b border-border shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {tc.pageRows.map((e: any, idx: number) => {
                  const tone = STATUS_TONE[e.status as keyof typeof STATUS_TONE] ?? STATUS_TONE.upcoming;
                  const d = new Date(e.date);
                  return (
                    <tr
                      key={e.id}
                      className="group border-b border-border transition-all duration-150 hover:bg-secondary/60 cursor-pointer"
                      onClick={(evt) => {
                        if ((evt.target as HTMLElement).closest("a,button")) return;
                        router.navigate({ to: "/events/$eventId", params: { eventId: e.id } });
                      }}
                    >
                      <td className="sticky left-0 z-10 w-[56px] min-w-[56px] max-w-[56px] bg-card group-hover:bg-muted/70 px-3 py-3 text-center text-xs font-medium text-muted-foreground border-r border-b border-border transition-colors">
                        {(tc.page - 1) * tc.pageSize + idx + 1}
                      </td>
                      <td className="sticky left-[56px] z-10 min-w-[100px] bg-card group-hover:bg-muted/70 px-4 py-3 font-mono text-[12px] font-semibold text-primary border-r border-b border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)] transition-colors">
                        EV-{e.id.slice(0, 6).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 border-b border-border">
                        <div className="flex items-center gap-3">
                          <img
                            src={(e as any).imageUrl || (e as any).image || (e as any).bannerUrl || (e as any).coverUrl || EVENT_FALLBACK_IMAGES[e.type] || EVENT_FALLBACK_IMAGES.default}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg object-cover border border-border shadow-xs"
                            onError={(evt) => { evt.currentTarget.src = EVENT_FALLBACK_IMAGES.default; }}
                          />
                          <div>
                            <TruncatedText text={e.name} maxWidth="max-w-[280px]" className="font-semibold text-foreground text-xs" />
                            <TruncatedText text={e.description} maxWidth="max-w-[280px]" className="text-[11px] text-muted-foreground" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs border-b border-border">
                        <div className="font-medium text-foreground">
                          {d.toLocaleDateString("vi-VN")} {e.time ? `• ${e.time}` : ""}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <TruncatedText text={e.location || "Online"} maxWidth="max-w-[300px]" />
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b border-border">
                        <span className="inline-flex rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {t(TYPE_KEY[e.type as EventItem["type"]] ?? "events.type.forum")}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b border-border">
                        <div className="text-xs font-semibold text-foreground">
                          {e.registered} / {e.capacity}
                        </div>
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary mt-1">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${Math.min(100, Math.round((e.registered / (e.capacity || 1)) * 100))}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b border-border">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ background: tone.bg, color: tone.fg }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone.fg }} />
                          {t(STATUS_KEY[e.status as EventItem["status"]] ?? "events.status.upcoming")}
                        </span>
                      </td>
                      <td className="sticky right-0 z-10 min-w-[140px] bg-card group-hover:bg-muted/70 px-4 py-3 text-right border-l border-b border-border shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)] transition-colors">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            to="/events/$eventId"
                            params={{ eventId: e.id }}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => {
                              setEditing(e);
                              setOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(e)}
                            disabled={deletingId === e.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-destructive/20 bg-background px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={tc.page}
            pageCount={tc.pageCount}
            pageSize={tc.pageSize}
            total={tc.total}
            from={tc.from}
            to={tc.to}
            onPage={tc.setPage}
            onPageSize={tc.setPageSize}
          />
        </div>
      ) : view === "cards" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {tc.pageRows.map((e: any) => (
              <EventCard
                key={e.id}
                event={e}
                deleting={deletingId === e.id}
                onEdit={() => {
                  setEditing(e);
                  setOpen(true);
                }}
                onDelete={() => onDelete(e)}
              />
            ))}
          </div>
          <Pagination
            page={tc.page}
            pageCount={tc.pageCount}
            pageSize={tc.pageSize}
            total={tc.total}
            from={tc.from}
            to={tc.to}
            onPage={tc.setPage}
            onPageSize={tc.setPageSize}
          />
        </div>
      ) : (
        <CalendarView events={filtered} />
      )}

      <CrudModal
        open={open}
        title={editing ? t("common.editTitle") : t("events.create")}
        fields={fields}
        initial={editing ? (editing as unknown as CrudValues) : undefined}
        submitting={submitting}
        submitLabel={editing ? t("common.save") : t("common.create")}
        cancelLabel={t("common.cancel")}
        onSubmit={onSubmit}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
      />

      <EventWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreated={(ev) => {
          setWizardOpen(false);
          router.invalidate();
          router.navigate({ to: "/events/$eventId", params: { eventId: ev.id } });
        }}
      />
    </AppShell>
  );
}

function CapacityBar({ registered, capacity }: { registered: number; capacity: number }) {
  const t = useT();
  const pct = capacity > 0 ? Math.min(100, Math.round((registered / capacity) * 100)) : 0;
  const spots = Math.max(0, capacity - registered);
  const full = capacity > 0 && registered >= capacity;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{t("events.col.reg")}</span>
        <span className="font-semibold text-foreground">
          {registered}/{capacity}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: full ? "oklch(0.55 0.2 25)" : "var(--gradient-primary)",
          }}
        />
      </div>
      <p className="mt-1 text-[11px] font-medium text-muted-foreground">
        {full ? t("events.full") : t("events.spotsLeft", { n: spots })}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status?: EventItem["status"] }) {
  const t = useT();
  const validStatus: EventItem["status"] =
    status && STATUS_TONE[status] ? status : "upcoming";
  const s = STATUS_TONE[validStatus] ?? STATUS_TONE.upcoming;
  const labelKey = STATUS_KEY[validStatus] ?? "events.status.upcoming";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} aria-hidden="true" />
      {t(labelKey)}
    </span>
  );
}

function EventCard({
  event: e,
  deleting,
  onEdit,
  onDelete,
}: {
  event: EventItem;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const fmt = useFmt();
  const eventImg = (e as any).imageUrl || (e as any).image || (e as any).bannerUrl || (e as any).coverUrl || EVENT_FALLBACK_IMAGES[e.type] || EVENT_FALLBACK_IMAGES.default;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)]">
      <div className="relative h-36 overflow-hidden" style={{ background: TYPE_COVER[e.type] ?? TYPE_COVER.forum }}>
        <img
          src={eventImg}
          alt={e.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(evt) => { evt.currentTarget.src = EVENT_FALLBACK_IMAGES.default; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
        <div className="absolute left-3 top-3">
          <StatusPill status={getEffectiveStatus(e)} />
        </div>
        <span className="absolute right-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground backdrop-blur">
          {t(TYPE_KEY[e.type] ?? "events.type.forum")}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <Link
            to="/events/$eventId"
            params={{ eventId: e.id }}
            className="line-clamp-2 text-base font-semibold text-foreground transition hover:text-primary"
          >
            {e.name}
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              aria-label={t("common.edit")}
              title={t("common.edit")}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>
            {e.status !== "cancelled" && (
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                aria-label={t("events.delete")}
                title={t("events.delete")}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {fmt.date(e.date)}
        </div>
        <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{e.location || "—"}</span>
        </div>
        <div className="mt-auto">
          <CapacityBar registered={e.registered} capacity={e.capacity} />
        </div>
      </div>
    </article>
  );
}

function FeaturedCard({ event: e, onOpen }: { event: EventItem; onOpen: () => void }) {
  const t = useT();
  const fmt = useFmt();
  const featImg = (e as any).imageUrl || (e as any).image || (e as any).bannerUrl || (e as any).coverUrl || EVENT_FALLBACK_IMAGES[e.type] || EVENT_FALLBACK_IMAGES.default;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="mb-5 block w-full overflow-hidden rounded-3xl border border-border text-left shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-glow)]"
    >
      <div className="relative grid gap-0 md:grid-cols-[1.1fr_1fr]">
        <div className="relative min-h-[180px] p-6 overflow-hidden" style={{ background: TYPE_COVER[e.type] }}>
          <img
            src={featImg}
            alt={e.name}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
            onError={(evt) => { evt.currentTarget.src = EVENT_FALLBACK_IMAGES.default; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="relative z-10 flex h-full flex-col">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-background/85 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> {t("events.featured")}
            </span>
            <h2 className="mt-auto text-2xl font-bold text-primary-foreground drop-shadow-sm">
              {e.name}
            </h2>
            <div className="mt-2 flex flex-wrap gap-3 text-sm font-medium text-primary-foreground/90">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" aria-hidden="true" /> {fmt.date(e.date)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" aria-hidden="true" /> {e.location || "—"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-4 bg-card p-6">
          <div className="flex items-center gap-2">
            <StatusPill status={e.status} />
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(TYPE_KEY[e.type])}
            </span>
          </div>
          <CapacityBar registered={e.registered} capacity={e.capacity} />
          <span
            className="inline-flex w-fit items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            {t("events.viewDetail")}
          </span>
        </div>
      </div>
    </button>
  );
}

function CalendarView({ events }: { events: EventItem[] }) {
  const t = useT();
  const fmt = useFmt();
  const [cursor, setCursor] = useState(() => {
    const first = events[0] ? new Date(events[0].date) : new Date();
    return new Date(first.getFullYear(), first.getMonth(), 1);
  });

  const byDay = useMemo(() => {
    const m = new Map<string, EventItem[]>();
    for (const e of events) {
      const key = new Date(e.date).toDateString();
      const arr = m.get(key) ?? [];
      arr.push(e);
      m.set(key, arr);
    }
    return m;
  }, [events]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const weekdays =
    fmt.locale === "en-US"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const todayKey = new Date().toDateString();

  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)] sm:p-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          aria-label="‹"
          className="grid h-10 w-10 place-items-center rounded-lg border border-border text-base font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          ‹
        </button>
        <h3 className="text-sm font-semibold text-foreground">
          {cursor.toLocaleDateString(fmt.locale, { month: "long", year: "numeric" })}
        </h3>
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          aria-label="›"
          className="grid h-10 w-10 place-items-center rounded-lg border border-border text-base font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[11px]">
        {weekdays.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date)
            return <div key={`e${i}`} className="min-h-[52px] rounded-lg sm:min-h-[76px]" />;
          const dayEvents = byDay.get(date.toDateString()) ?? [];
          const isToday = date.toDateString() === todayKey;
          return (
            <div
              key={date.toISOString()}
              className={`min-h-[52px] rounded-lg border p-1 text-left sm:min-h-[76px] sm:p-1.5 ${
                isToday ? "border-primary bg-primary/5" : "border-border bg-background"
              }`}
            >
              <span
                className={`text-[11px] font-semibold ${isToday ? "text-primary" : "text-muted-foreground"}`}
              >
                {date.getDate()}
              </span>
              {/* Mobile: compact color dots */}
              {dayEvents.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                  {dayEvents.slice(0, 4).map((e: any) => (
                    <span
                      key={e.id}
                      title={e.name}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: TYPE_COVER[e.type as EventItem["type"]] }}
                    />
                  ))}
                </div>
              )}
              {/* sm+: labelled chips */}
              <div className="mt-1 hidden space-y-1 sm:block">
                {dayEvents.slice(0, 2).map((e: any) => (
                  <div
                    key={e.id}
                    title={e.name}
                    className="truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground"
                    style={{ background: TYPE_COVER[e.type as EventItem["type"]] }}
                  >
                    {e.name}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="px-1 text-[10px] font-medium text-muted-foreground">
                    +{dayEvents.length - 2}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("events.calendar.noEvents")}
        </p>
      )}
    </div>
  );
}
