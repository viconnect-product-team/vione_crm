import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarCheck2,
  FileText,
  MessageSquare,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Star,
  UserPlus,
  Users,
  Wallet,
  ArrowUpRight,
  Activity as ActivityIcon,
  type LucideIcon,
} from "lucide-react";
import { useFmt, useT, type TKey } from "@/lib/i18n";
import { EmptyState, ListSkeleton } from "@/components/dashboard/StateKit";
import type { Member } from "@/lib/members-data";
import type { ReviewRow } from "@/lib/reviews.functions";
import type { Product } from "@/lib/marketplace-data";
import type { Interaction } from "@/lib/member-activity.functions";

type Tone = "primary" | "success" | "warning" | "muted";
type Category = "membership" | "networking" | "opportunities" | "events" | "reviews";

type FeedItem = {
  id: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  date: string; // ISO
  tone: Tone;
  category: Category;
  adminOnly?: boolean;
  ctaLabel?: string;
  ctaTo?: string;
  ctaParams?: Record<string, string>;
  onCta?: () => void;
};

const toneRing: Record<Tone, string> = {
  primary: "border-primary/30 bg-primary/10 text-primary",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  muted: "border-border bg-secondary text-muted-foreground",
};

const catLabel: Record<Category, TKey> = {
  membership: "m360.tab.membership",
  networking: "m360.tab.networking",
  opportunities: "m360.tab.opportunities",
  events: "m360.tab.events",
  reviews: "mdetail.reviews.type",
};

const intIcon: Record<Interaction["type"], LucideIcon> = {
  connect: UserPlus,
  message: MessageSquare,
  quote: FileText,
  meeting: Users,
  event: CalendarCheck2,
};
const intLabel: Record<Interaction["type"], TKey> = {
  connect: "mdetail.int.connect",
  message: "mdetail.int.message",
  quote: "mdetail.int.quote",
  meeting: "mdetail.int.meeting",
  event: "mdetail.int.event",
};
const intCategory: Record<Interaction["type"], Category> = {
  connect: "networking",
  message: "networking",
  quote: "opportunities",
  meeting: "networking",
  event: "events",
};

const FILTER_KEY = "vba.m360.feed.filter";

/**
 * Unified business activity feed for the Member 360 profile.
 * Combines every activity type ALREADY present in the loaded data into a single
 * chronological feed — no new backend calls, no fabricated events. Admin-only
 * fee/account events are hidden from non-admins. Filter selection persists in
 * localStorage.
 */
export function MemberActivityFeed({
  member,
  reviews = [],
  products = [],
  interactions = [],
  isAdmin = false,
  loading = false,
  onSelectInteraction,
}: {
  member: Member;
  reviews?: ReviewRow[];
  products?: Product[];
  interactions?: Interaction[];
  isAdmin?: boolean;
  loading?: boolean;
  onSelectInteraction?: (it: Interaction) => void;
}) {
  const t = useT();
  const fmt = useFmt();

  const items = useMemo<FeedItem[]>(() => {
    const list: FeedItem[] = [];

    // Membership — joined.
    if (member.joinedAt) {
      list.push({
        id: "joined",
        icon: UserPlus,
        title: t("m360.timeline.joined"),
        description: t("m360.timeline.joinedDesc"),
        date: member.joinedAt,
        tone: "primary",
        category: "membership",
      });
    }
    // Membership — renewal (only when real renewal data exists).
    if (member.renewedAt) {
      list.push({
        id: "renewed",
        icon: RefreshCw,
        title: t("m360.timeline.renewed"),
        description: member.newTermEnd
          ? t("m360.timeline.renewedDesc", { 0: fmt.date(member.newTermEnd) })
          : undefined,
        date: member.renewedAt,
        tone: "success",
        category: "membership",
      });
    }
    // Membership — fee milestone (admin only, no amounts exposed).
    list.push({
      id: "fee",
      icon: Wallet,
      title: member.feePaid
        ? t("m360.timeline.feePaid", { 0: member.feeYear })
        : t("m360.timeline.feeDue", { 0: member.feeYear }),
      date: `${member.feeYear}-01-01T00:00:00.000Z`,
      tone: member.feePaid ? "success" : "warning",
      category: "membership",
      adminOnly: true,
    });

    // Opportunities — published products.
    for (const p of products) {
      if (!p.createdAt) continue;
      list.push({
        id: `product-${p.id}`,
        icon: ShoppingBag,
        title: t("m360.timeline.product"),
        description: p.title,
        date: p.createdAt,
        tone: "muted",
        category: "opportunities",
        ctaLabel: t("m360.opp.action.view"),
        ctaTo: "/marketplace/$productId",
        ctaParams: { productId: p.id },
      });
    }

    // Reviews received.
    for (const r of reviews) {
      if (!r.createdAt) continue;
      list.push({
        id: `review-${r.id}`,
        icon: Star,
        title: t("m360.timeline.review"),
        description: r.comment,
        date: r.createdAt,
        tone: "muted",
        category: "reviews",
      });
    }

    // Networking / events / opportunity interactions.
    for (const it of interactions) {
      if (!it.at) continue;
      const cat = intCategory[it.type];
      list.push({
        id: `int-${it.id}`,
        icon: intIcon[it.type],
        title: t(intLabel[it.type]),
        description: it.detail ?? it.title,
        date: it.at,
        tone: it.type === "event" ? "primary" : "muted",
        category: cat,
        ctaLabel: t("mdetail.int.viewDetail"),
        onCta: onSelectInteraction ? () => onSelectInteraction(it) : undefined,
      });
    }

    const visible = isAdmin ? list : list.filter((e: any) => !e.adminOnly);
    visible.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return visible;
  }, [member, reviews, products, interactions, isAdmin, t, fmt, onSelectInteraction]);

  // Categories present in the data — drives the filter chips.
  const presentCategories = useMemo(() => {
    const set = new Set<Category>();
    for (const it of items) set.add(it.category);
    return (
      ["membership", "networking", "opportunities", "events", "reviews"] as Category[]
    ).filter((c) => set.has(c));
  }, [items]);

  const [filter, setFilter] = useState<"all" | Category>("all");
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(FILTER_KEY) as "all" | Category | null;
      if (saved) setFilter(saved);
    } catch {
      /* ignore */
    }
  }, []);
  const changeFilter = (f: "all" | Category) => {
    setFilter(f);
    try {
      localStorage.setItem(FILTER_KEY, f);
    } catch {
      /* ignore */
    }
  };
  // Reset a persisted filter that no longer has data.
  useEffect(() => {
    if (filter !== "all" && !presentCategories.includes(filter)) setFilter("all");
  }, [filter, presentCategories]);

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  );

  // Highlights — derived only from loaded data.
  const highlights = useMemo(() => {
    const last = items[0];
    const now = Date.now();
    const monthCount = items.filter((i) => now - new Date(i.date).getTime() <= 30 * 864e5).length;
    const byCat = new Map<Category, number>();
    for (const i of items) byCat.set(i.category, (byCat.get(i.category) ?? 0) + 1);
    let topCat: Category | null = null;
    let topN = 0;
    for (const [c, n] of byCat) {
      if (n > topN) {
        topN = n;
        topCat = c;
      }
    }
    const recentOpp = items.find((i) => i.category === "opportunities");
    const newestConn = items.find((i) => i.id.startsWith("int-") && i.category === "networking");
    return { last, monthCount, topCat, recentOpp, newestConn };
  }, [items]);

  if (loading) {
    return <ListSkeleton rows={6} />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ActivityIcon className="h-6 w-6" />}
        title={t("m360.feed.empty.title")}
        description={t("m360.feed.empty.desc")}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Highlights */}
      <div className="flex flex-wrap gap-2">
        {highlights.last && (
          <HighlightChip
            icon={Sparkles}
            label={t("m360.feed.hl.last")}
            value={fmt.rel(highlights.last.date) || fmt.date(highlights.last.date)}
          />
        )}
        <HighlightChip
          icon={ActivityIcon}
          label={t("m360.feed.hl.month")}
          value={String(highlights.monthCount)}
        />
        {highlights.topCat && (
          <HighlightChip
            icon={ArrowUpRight}
            label={t("m360.feed.hl.topCategory")}
            value={t((catLabel as any)[highlights.topCat])}
          />
        )}
        {highlights.recentOpp && (
          <HighlightChip
            icon={ShoppingBag}
            label={t("m360.feed.hl.recentOpp")}
            value={highlights.recentOpp.description ?? "—"}
          />
        )}
        {highlights.newestConn && (
          <HighlightChip
            icon={UserPlus}
            label={t("m360.feed.hl.newestConn")}
            value={fmt.rel(highlights.newestConn.date) || fmt.date(highlights.newestConn.date)}
          />
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={filter === "all"}
          onClick={() => changeFilter("all")}
          label={`${t("mdetail.activity.filterAll")} (${items.length})`}
        />
        {presentCategories.map((c: any) => {
          const n = items.filter((i) => i.category === c).length;
          return (
            <FilterChip
              key={c}
              active={filter === c}
              onClick={() => changeFilter(c)}
              label={`${t((catLabel as any)[c])} (${n})`}
            />
          );
        })}
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {t("mdetail.activity.emptyFilter")}
        </p>
      ) : (
        <ol className="relative space-y-4 border-l border-border pl-6">
          {filtered.map((e: any) => {
            const Icon = e.icon;
            return (
              <li key={e.id} className="relative">
                <span
                  className={`absolute -left-[31px] grid h-7 w-7 place-items-center rounded-full border ${(toneRing as any)[e.tone]}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="rounded-xl border border-border bg-secondary/30 p-3 transition hover:border-primary/40 hover:bg-secondary/50">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {t((catLabel as any)[e.category])}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{e.title}</span>
                    {e.adminOnly && (
                      <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
                        {t("m360.timeline.internal")}
                      </span>
                    )}
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {fmt.rel(e.date) || fmt.date(e.date)}
                    </span>
                  </div>
                  {e.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {e.description}
                    </p>
                  )}
                  {e.ctaTo && e.ctaParams ? (
                    <Link
                      to={e.ctaTo}
                      params={e.ctaParams}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                    >
                      {e.ctaLabel} <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  ) : e.onCta ? (
                    <button
                      type="button"
                      onClick={e.onCta}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                    >
                      {e.ctaLabel} <ArrowUpRight className="h-3 w-3" />
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function HighlightChip({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-[var(--shadow-card)]">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-xs font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
