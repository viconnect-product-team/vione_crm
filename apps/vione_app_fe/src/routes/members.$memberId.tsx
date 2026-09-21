import { createFileRoute, Link, notFound, useRouter, useRouterState } from "@tanstack/react-router";
import {
  parseReviewSearch,
  computeReviewSearchValidity,
  REVIEW_SEARCH_RESET,
  type ReviewSearch,
  type ReviewSort,
} from "@/lib/review-search";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Award,
  Briefcase,
  Building2,
  Calendar,
  CalendarCheck2,
  Clock,
  FolderOpen,
  Settings,
  CheckCircle2,
  Edit3,
  FileText,
  Globe,
  Hash,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Trash2,
  ShieldCheck,
  ShoppingBag,
  Star,
  User,
  UserPlus,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { AppShell } from "@/components/dashboard/AppShell";
import { useFmt, useT, type TKey } from "@/lib/i18n";
import { type Member, type MemberStatus } from "@/lib/members-data";
import { CURRENT_USER_ID } from "@/lib/networking-data";
import { getMemberFn, updateMemberContactFn } from "@/lib/members.functions";
import {
  listReviewsFn,
  addReviewFn,
  updateReviewFn,
  deleteReviewFn,
  type ReviewRow,
  type ReviewType,
} from "@/lib/reviews.functions";
import { type Product } from "@/lib/marketplace-data";
import { listProductsFn } from "@/lib/marketplace.functions";
import {
  listInteractionsWithFn,
  type Interaction,
  type InteractionPage,
} from "@/lib/member-activity.functions";
import { getMemberAccountStatusFn } from "@/lib/member-account.functions";
import { AccountStatusBadge } from "./members.index";
import { useRole } from "@/hooks/use-role";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/dashboard/StateKit";
import { MembershipTimeline } from "@/components/dashboard/MembershipTimeline";
import { MemberNetworking } from "@/components/dashboard/MemberNetworking";
import { MemberOpportunities } from "@/components/dashboard/MemberOpportunities";
import { MemberActivityFeed } from "@/components/dashboard/MemberActivityFeed";
import { AdminCardManagement } from "@/components/dashboard/AdminCardManagement";
import { SendEmailModal } from "@/components/dashboard/SendEmailModal";

export const Route = createFileRoute("/members/$memberId")({
  ssr: false,
  validateSearch: parseReviewSearch,
  loader: async ({ params }) => {
    const member = await getMemberFn({ data: { id: params.memberId } });
    if (!member) throw notFound();
    const { reviews, stats } = await listReviewsFn({ data: { sellerId: params.memberId } });
    const allProducts = await listProductsFn();
    const products = allProducts.filter((p) => p.sellerId === params.memberId);
    const interactions = await listInteractionsWithFn({
      data: { peerId: params.memberId, type: "all", offset: 0, limit: 10 },
    });
    return { member, reviews, stats, products, interactions };
  },
  component: MemberDetailPage,
  notFoundComponent: NotFound,
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    </AppShell>
  ),
});

function NotFound() {
  const t = useT();
  return (
    <AppShell>
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
        <h2 className="mb-2 text-xl font-bold text-foreground">404</h2>
        <p className="mb-6 text-sm text-muted-foreground">{t("detail.notFound")}</p>
        <Link
          to="/members"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("detail.back")}
        </Link>
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: MemberStatus }) {
  const t = useT();
  const map: Record<MemberStatus, { label: TKey; bg: string; fg: string }> = {
    active: { label: "status.active", bg: "oklch(0.93 0.07 155)", fg: "oklch(0.40 0.16 155)" },
    pending: { label: "status.pending", bg: "oklch(0.94 0.09 75)", fg: "oklch(0.45 0.14 65)" },
    expired: { label: "status.expired", bg: "oklch(0.93 0.06 25)", fg: "oklch(0.50 0.20 25)" },
  };
  const s = map[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} />
      {t(s.label)}
    </span>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 break-words text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <h3 className="mb-3 text-base font-semibold text-foreground">{title}</h3>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={i <= Math.round(rating) ? "text-warning" : "text-muted-foreground/30"}
          style={{
            width: size,
            height: size,
            fill: i <= Math.round(rating) ? "currentColor" : "none",
          }}
        />
      ))}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
  onClick,
}: {
  icon: typeof User;
  label: string;
  value: string;
  tone?: "neutral" | "ok" | "warn" | "danger";
  onClick?: () => void;
}) {
  const toneCls: Record<string, string> = {
    neutral: "text-foreground",
    ok: "text-success",
    warn: "text-warning",
    danger: "text-destructive",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left shadow-[var(--shadow-card)] transition-colors hover:border-primary/40 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-muted-foreground transition-colors group-hover:text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={`truncate text-base font-semibold ${toneCls[tone]}`}>{value}</span>
    </button>
  );
}

type TabKey =
  | "overview"
  | "membership"
  | "fees"
  | "events"
  | "networking"
  | "opportunities"
  | "documents"
  | "activity"
  | "settings";

function MemberDetailPage() {
  const t = useT();
  const fmt = useFmt();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const { member, reviews, stats, products, interactions } = Route.useLoaderData() as {
    member: Member;
    reviews: ReviewRow[];
    stats: { count: number; avg: number };
    products: Product[];
    interactions: InteractionPage;
  };
  const [tab, setTab] = useState<TabKey>("overview");
  const { isAdmin } = useRole();
  const acctStatusFn = useServerFn(getMemberAccountStatusFn);
  const { data: acctStatus } = useQuery({
    queryKey: ["member-account-status", member.id],
    queryFn: () => acctStatusFn({ data: { memberId: member.id } }),
    enabled: isAdmin,
  });
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);
  const [activityFilter, setActivityFilter] = useState<"all" | Interaction["type"]>("all");
  const ACTIVITY_PAGE_SIZE = 10;

  const fetchInteractions = useServerFn(listInteractionsWithFn);
  const [activityItems, setActivityItems] = useState<Interaction[]>(interactions.items);
  const [activityStats] = useState(interactions.stats);
  const [activityHasMore, setActivityHasMore] = useState(interactions.hasMore);
  const [activityLoading, setActivityLoading] = useState(false);

  const loadActivity = async (filter: "all" | Interaction["type"], offset: number) => {
    setActivityLoading(true);
    try {
      const page = await fetchInteractions({
        data: { peerId: member.id, type: filter, offset, limit: ACTIVITY_PAGE_SIZE },
      });
      setActivityItems((prev) => (offset === 0 ? page.items : [...prev, ...page.items]));
      setActivityHasMore(page.hasMore);
    } finally {
      setActivityLoading(false);
    }
  };

  const changeActivityFilter = (f: "all" | Interaction["type"]) => {
    setActivityFilter(f);
    setActivityItems([]);
    setActivityHasMore(false);
    void loadActivity(f, 0);
  };

  // Infinite scroll: load the next page when the sentinel enters the viewport.
  const activitySentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = activitySentinelRef.current;
    if (!el || tab !== "activity" || !activityHasMore || activityLoading) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void loadActivity(activityFilter, activityItems.length);
    });
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, activityHasMore, activityLoading, activityFilter, activityItems.length]);

  const saveContact = useServerFn(updateMemberContactFn);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openEmail, setOpenEmail] = useState(false);
  const [form, setForm] = useState({
    email: member.email,
    phone: member.phone,
    address: member.address,
  });

  const handleSaveContact = async () => {
    setSaving(true);
    try {
      await saveContact({
        data: {
          id: member.id,
          email: form.email,
          phone: form.phone,
          address: form.address,
        },
      });
      await router.invalidate();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const addReview = useServerFn(addReviewFn);
  const updateReview = useServerFn(updateReviewFn);
  const deleteReview = useServerFn(deleteReviewFn);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [editType, setEditType] = useState<ReviewType>("service");
  const { reviewFilter, reviewSort } = Route.useSearch();
  const setReviewFilter = (v: "all" | ReviewType) =>
    navigate({ to: ".", search: (prev: ReviewSearch) => ({ ...prev, reviewFilter: v }) });
  const setReviewSort = (v: ReviewSort) =>
    navigate({ to: ".", search: (prev: ReviewSearch) => ({ ...prev, reviewSort: v }) });
  const rawSearchStr = useRouterState({ select: (s) => s.location.searchStr });
  // Only validate params that are actually present in the URL — an absent param
  // is fine (falls back to default). A present-but-invalid param is a 400.
  const reviewSearchValidity = useMemo(
    () => computeReviewSearchValidity(rawSearchStr),
    [rawSearchStr],
  );
  const [newType, setNewType] = useState<ReviewType>("service");
  const [reviewPage, setReviewPage] = useState(1);
  const REVIEWS_PER_PAGE = 5;

  const sortedReviews = useMemo(() => {
    const arr = reviews.filter((r) => reviewFilter === "all" || r.reviewType === reviewFilter);
    if (reviewSort === "highest") arr.sort((a, b) => b.rating - a.rating);
    else if (reviewSort === "lowest") arr.sort((a, b) => a.rating - b.rating);
    else arr.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return arr;
  }, [reviews, reviewSort, reviewFilter]);

  const reviewPageCount = Math.max(1, Math.ceil(sortedReviews.length / REVIEWS_PER_PAGE));
  const pagedReviews = useMemo(
    () => sortedReviews.slice((reviewPage - 1) * REVIEWS_PER_PAGE, reviewPage * REVIEWS_PER_PAGE),
    [sortedReviews, reviewPage],
  );

  useEffect(() => {
    setReviewPage(1);
  }, [reviewSort, reviewFilter, reviews.length]);

  const handleAddReview = async () => {
    if (newComment.trim().length === 0) return;
    setSubmittingReview(true);
    try {
      await addReview({
        data: {
          sellerId: member.id,
          reviewerId: CURRENT_USER_ID,
          rating: newRating,
          comment: newComment.trim(),
          reviewType: newType,
        },
      });
      setNewComment("");
      setNewRating(5);
      setNewType("service");
      await router.invalidate();
    } finally {
      setSubmittingReview(false);
    }
  };

  const startEditReview = (r: ReviewRow) => {
    setEditingReviewId(r.id);
    setEditRating(r.rating);
    setEditComment(r.comment);
    setEditType(r.reviewType);
  };

  const handleUpdateReview = async () => {
    if (!editingReviewId || editComment.trim().length === 0) return;
    setSubmittingReview(true);
    try {
      await updateReview({
        data: {
          id: editingReviewId,
          reviewerId: CURRENT_USER_ID,
          rating: editRating,
          comment: editComment.trim(),
          reviewType: editType,
        },
      });
      setEditingReviewId(null);
      await router.invalidate();
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm(t("mdetail.reviews.deleteConfirm"))) return;
    await deleteReview({ data: { id, reviewerId: CURRENT_USER_ID } });
    await router.invalidate();
  };

  const cancelEdit = () => {
    setForm({ email: member.email, phone: member.phone, address: member.address });
    setEditing(false);
  };

  const activeProducts = products.filter((p) => p.status === "active").length;

  // Renewal state derived from the member term end (same logic as the member list).
  const renewalDays = member.termEnd
    ? Math.ceil((new Date(member.termEnd).getTime() - Date.now()) / 86_400_000)
    : null;
  const renewalKind: "ok" | "soon" | "overdue" | "none" =
    renewalDays == null ? "none" : renewalDays < 0 ? "overdue" : renewalDays <= 30 ? "soon" : "ok";
  const renewalTone: Record<typeof renewalKind, { bg: string; fg: string }> = {
    ok: { bg: "oklch(0.94 0.05 155)", fg: "oklch(0.44 0.14 155)" },
    soon: { bg: "oklch(0.95 0.08 75)", fg: "oklch(0.48 0.14 65)" },
    overdue: { bg: "oklch(0.94 0.06 25)", fg: "oklch(0.52 0.20 25)" },
    none: { bg: "oklch(0.96 0 0)", fg: "oklch(0.52 0 0)" },
  };
  const renewalLabel: Record<typeof renewalKind, TKey> = {
    ok: "mlist.renewal.ok",
    soon: "mlist.renewal.soon",
    overdue: "mlist.renewal.overdue",
    none: "mlist.renewal.none",
  };

  // Membership tenure in a human-friendly form.
  const tenureMonths = Math.max(
    0,
    Math.floor((Date.now() - new Date(member.joinedAt).getTime()) / (86_400_000 * 30.44)),
  );
  const tenureYears = Math.floor(tenureMonths / 12);
  const tenureRemMonths = tenureMonths % 12;

  const recentActivity = activityItems.slice(0, 4);

  const initials = member.name
    .split(" ")
    .slice(-2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const eventsAttended = activityStats.byType.event;
  const tabs: { key: TabKey; label: TKey; icon: typeof User; count?: number }[] = [
    { key: "overview", label: "m360.tab.overview", icon: User },
    { key: "membership", label: "m360.tab.membership", icon: ShieldCheck },
    { key: "fees", label: "m360.tab.fees", icon: Wallet },
    { key: "events", label: "m360.tab.events", icon: CalendarCheck2, count: eventsAttended },
    { key: "networking", label: "m360.tab.networking", icon: Star, count: reviews.length },
    {
      key: "opportunities",
      label: "m360.tab.opportunities",
      icon: ShoppingBag,
      count: products.length,
    },
    { key: "documents", label: "m360.tab.documents", icon: FileText },
    { key: "activity", label: "m360.tab.activity", icon: CalendarCheck2 },
    ...(isAdmin
      ? [{ key: "settings" as TabKey, label: "m360.tab.settings" as TKey, icon: ShieldCheck }]
      : []),
  ];

  const intIcon: Record<Interaction["type"], typeof User> = {
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

  const activityTypes: Interaction["type"][] = ["connect", "message", "quote", "meeting", "event"];
  const activityWeekCount = activityStats.week;
  const activityMonthCount = activityStats.month;

  return (
    <AppShell>
      <Link
        to="/members"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("detail.back")}
      </Link>

      {/* Header card */}
      <div
        className="relative mb-5 overflow-hidden rounded-2xl border border-border p-6 shadow-[var(--shadow-card)]"
        style={{ background: "var(--gradient-card)" }}
      >
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-card/15 text-2xl font-bold text-primary-foreground backdrop-blur">
            {initials}
          </div>
          <div className="min-w-0 flex-1 text-primary-foreground">
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-card/15 px-2.5 py-0.5 font-mono text-[11px] font-semibold backdrop-blur">
              {member.code}
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{member.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-primary-foreground/85">
              <span className="inline-flex items-center gap-1.5">
                {member.type === "company" ? (
                  <Building2 className="h-3.5 w-3.5" />
                ) : (
                  <User className="h-3.5 w-3.5" />
                )}
                {t(member.type === "company" ? "type.company" : "type.individual")}
              </span>
              <span className="opacity-50">•</span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t(member.level)}
              </span>
              <span className="opacity-50">•</span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {t(member.region)}
              </span>
              <span className="opacity-50">•</span>
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-current text-warning" />
                {stats.avg.toFixed(1)} ({stats.count})
              </span>
              <span className="opacity-50">•</span>
              <span className="inline-flex items-center gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5" />
                {activeProducts} {t("mdetail.products.count")}
              </span>
              {member.executiveRole && (
                <>
                  <span className="opacity-50">•</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-amber-300">
                    <Award className="h-3.5 w-3.5" />
                    {member.executiveRole}
                  </span>
                </>
              )}
              {member.department && (
                <>
                  <span className="opacity-50">•</span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-amber-200">
                    <Briefcase className="h-3.5 w-3.5" />
                    {member.department}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <StatusBadge status={member.status} />
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  background: renewalTone[renewalKind].bg,
                  color: renewalTone[renewalKind].fg,
                }}
              >
                <Clock className="h-3 w-3" />
                {t(renewalLabel[renewalKind])}
              </span>
              {isAdmin && acctStatus && <AccountStatusBadge status={acctStatus} />}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate({ to: "/network", search: { peer: member.id } })}
                className="inline-flex items-center gap-1.5 rounded-lg bg-card/15 px-3 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur hover:bg-card/25"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {t("detail.message")}
              </button>
              <button
                onClick={() => setOpenEmail(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 text-xs font-semibold text-primary hover:bg-card/90"
              >
                <Mail className="h-3.5 w-3.5" />
                {t("detail.sendEmail")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <SummaryCard
          icon={ShieldCheck}
          label={t("m360.summary.membership")}
          value={t(
            member.status === "active"
              ? "status.active"
              : member.status === "pending"
                ? "status.pending"
                : "status.expired",
          )}
          onClick={() => setTab("membership")}
        />
        <SummaryCard
          icon={Wallet}
          label={t("m360.summary.fee")}
          value={member.feePaid ? t("mlist.feePaid") : t("mlist.feeDue")}
          tone={member.feePaid ? "ok" : "danger"}
          onClick={() => setTab("fees")}
        />
        <SummaryCard
          icon={Clock}
          label={t("m360.summary.renewal")}
          value={
            renewalDays == null
              ? t("mlist.renewal.none")
              : renewalDays < 0
                ? t("mlist.renewal.overdue")
                : `${renewalDays}d`
          }
          tone={renewalKind === "overdue" ? "danger" : renewalKind === "soon" ? "warn" : "neutral"}
          onClick={() => setTab("membership")}
        />
        <SummaryCard
          icon={CalendarCheck2}
          label={t("m360.summary.events")}
          value={String(eventsAttended)}
          onClick={() => setTab("events")}
        />
        <SummaryCard
          icon={ShoppingBag}
          label={t("m360.summary.opportunities")}
          value={String(products.length)}
          onClick={() => setTab("opportunities")}
        />
        <SummaryCard
          icon={FolderOpen}
          label={t("m360.summary.documents")}
          value="0"
          onClick={() => setTab("documents")}
        />
        {isAdmin && acctStatus && (
          <SummaryCard
            icon={Settings}
            label={t("m360.summary.account")}
            value={acctStatus}
            onClick={() => setTab("settings")}
          />
        )}
      </div>

      {/* Sticky sub-navigation */}
      <div className="sm:sticky sm:top-18 z-20 mb-5 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card/95 p-1 shadow-[var(--shadow-card)] backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tb) => {
          const Icon = tb.icon;
          const active = tab === tb.key;
          return (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "text-primary-foreground shadow-[var(--shadow-glow)]"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
              style={active ? { background: "var(--gradient-primary)" } : undefined}
            >
              <Icon className="h-4 w-4" />
              {t(tb.label)}
              {tb.count != null && (
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    active ? "bg-card/25" : "bg-secondary text-foreground"
                  }`}
                >
                  {tb.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Section title={t("detail.about")}>
              <p className="py-2 text-sm leading-relaxed text-foreground">{member.about}</p>
            </Section>

            <Section title={t("detail.companyInfo")}>
              <InfoRow icon={Briefcase} label={t("detail.industry")} value={t(member.industry)} />
              <InfoRow icon={ShieldCheck} label={t("detail.level")} value={t(member.level)} />
              {member.taxCode && (
                <InfoRow icon={Hash} label={t("detail.taxCode")} value={member.taxCode} />
              )}
              {member.website && (
                <InfoRow
                  icon={Globe}
                  label={t("detail.website")}
                  value={
                    <a
                      href={member.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {member.website}
                    </a>
                  }
                />
              )}
              {member.employees != null && (
                <InfoRow
                  icon={Users}
                  label={t("detail.employees")}
                  value={`${member.employees.toLocaleString("vi-VN")}`}
                />
              )}
              <InfoRow
                icon={Calendar}
                label={t("detail.joined")}
                value={new Date(member.joinedAt).toLocaleDateString("vi-VN")}
              />
            </Section>
          </div>

          <div className="space-y-5">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">
                  {t("detail.contactInfo")}
                </h3>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    {t("detail.edit")}
                  </button>
                )}
              </div>
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t("detail.email")}
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t("detail.phone")}
                    </label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t("detail.address")}
                    </label>
                    <input
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSaveContact}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      {saving ? t("detail.saving") : t("detail.save")}
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                    >
                      {t("detail.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  <InfoRow icon={User} label={t("detail.contactPerson")} value={member.contact} />
                  <InfoRow
                    icon={Mail}
                    label={t("detail.email")}
                    value={
                      <a href={`mailto:${member.email}`} className="text-primary hover:underline">
                        {member.email}
                      </a>
                    }
                  />
                  <InfoRow icon={Phone} label={t("detail.phone")} value={member.phone} />
                  <InfoRow icon={MapPin} label={t("detail.address")} value={member.address} />
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">
                  {t("m360.recentActivity")}
                </h3>
                <button
                  type="button"
                  onClick={() => setTab("activity")}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {t("m360.viewAll")}
                </button>
              </div>
              {recentActivity.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t("m360.recentActivity.empty")}
                </p>
              ) : (
                <ol className="space-y-3">
                  {recentActivity.map((it) => {
                    const Icon = intIcon[it.type];
                    return (
                      <li key={it.id} className="flex items-start gap-3">
                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{it.title}</p>
                          <p className="text-[11px] text-muted-foreground">{fmt.date(it.at)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          </div>
        </div>
      )}

      {tab === "membership" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Section title={t("m360.membership.title")}>
              <InfoRow
                icon={member.type === "company" ? Building2 : User}
                label={t("detail.industry")}
                value={t(member.type === "company" ? "type.company" : "type.individual")}
              />
              <InfoRow icon={ShieldCheck} label={t("detail.level")} value={t(member.level)} />
              <InfoRow icon={Briefcase} label={t("detail.industry")} value={t(member.industry)} />
              <InfoRow icon={MapPin} label={t("detail.region")} value={t(member.region)} />
              <InfoRow
                icon={Calendar}
                label={t("detail.joined")}
                value={new Date(member.joinedAt).toLocaleDateString("vi-VN")}
              />
              <InfoRow
                icon={Clock}
                label={t("m360.membership.memberSince")}
                value={
                  tenureYears > 0
                    ? `${tenureYears} ${t("m360.years")}${tenureRemMonths > 0 ? ` ${tenureRemMonths} ${t("m360.months")}` : ""}`
                    : `${tenureMonths} ${t("m360.months")}`
                }
              />
            </Section>
          </div>
          <div className="space-y-5">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <h3 className="mb-4 text-base font-semibold text-foreground">
                {t("m360.summary.renewal")}
              </h3>
              <div className="flex items-center gap-3">
                <span
                  className="grid h-11 w-11 place-items-center rounded-full"
                  style={{
                    background: renewalTone[renewalKind].bg,
                    color: renewalTone[renewalKind].fg,
                  }}
                >
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {t(renewalLabel[renewalKind])}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t("m360.membership.termEnd")}:{" "}
                    {member.termEnd
                      ? new Date(member.termEnd).toLocaleDateString("vi-VN")
                      : t("m360.membership.notSet")}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {tab === "fees" && (
        <Section title={t("detail.fee")}>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{
                  background: member.feePaid ? "oklch(0.93 0.07 155)" : "oklch(0.93 0.06 25)",
                  color: member.feePaid ? "oklch(0.40 0.16 155)" : "oklch(0.50 0.20 25)",
                }}
              >
                {member.feePaid ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
              </div>
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t("detail.feeYear")} {member.feeYear}
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {member.feePaid ? t("detail.feePaid") : t("detail.feeUnpaid")}
                </div>
              </div>
            </div>
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </div>
        </Section>
      )}

      {tab === "events" && (
        <section className="rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-card)]">
          <EmptyState
            icon={<CalendarCheck2 className="h-6 w-6" />}
            title={t("m360.events.empty")}
          />
        </section>
      )}

      {tab === "documents" && (
        <section className="rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-card)]">
          <EmptyState icon={<FolderOpen className="h-6 w-6" />} title={t("m360.documents.empty")} />
        </section>
      )}

      {tab === "settings" &&
        (isAdmin ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Section title={t("m360.settings.title")}>
              <InfoRow
                icon={Settings}
                label={t("m360.summary.account")}
                value={acctStatus ?? t("m360.membership.notSet")}
              />
              <InfoRow icon={Hash} label={t("detail.contactPerson")} value={member.contact} />
              <InfoRow icon={Mail} label={t("detail.email")} value={member.email} />
            </Section>
            <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <h3 className="mb-3 text-base font-semibold text-foreground">
                {t("m360.settings.notes")}
              </h3>
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("m360.settings.notesEmpty")}
              </p>
            </section>
            <div className="lg:col-span-2">
              <AdminCardManagement memberId={member.id} />
            </div>
          </div>
        ) : (
          <section className="rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-card)]">
            <EmptyState
              icon={<ShieldCheck className="h-6 w-6" />}
              title={t("m360.settings.adminOnly")}
            />
          </section>
        ))}

      {tab === "opportunities" && (
        <MemberOpportunities
          member={member}
          currentUserId={CURRENT_USER_ID}
          products={products}
          interactions={activityItems}
        />
      )}

      {tab === "networking" && !reviewSearchValidity.ok && (
        <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto max-w-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
              {t("mdetail.reviews.invalid.code")}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-foreground">
              {t("mdetail.reviews.invalid.title")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("mdetail.reviews.invalid.desc")}
            </p>
            <ul className="mt-3 inline-block text-left text-xs text-muted-foreground">
              {reviewSearchValidity.errors.map((e: any) => (
                <li key={e.path}>• {e.message}</li>
              ))}
            </ul>
            <div className="mt-5">
              <Link
                to="."
                search={REVIEW_SEARCH_RESET}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t("mdetail.reviews.invalid.reset")}
              </Link>
            </div>
          </div>
        </section>
      )}
      {tab === "networking" && reviewSearchValidity.ok && (
        <div className="space-y-5">
          <MemberNetworking
            member={member}
            currentUserId={CURRENT_USER_ID}
            interactionsCount={activityStats.all}
            eventsCount={activityStats.byType.event}
            reviewsCount={reviews.length}
            opportunitiesCount={products.length}
          />
          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="mb-5 flex items-center gap-4 border-b border-border pb-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground">{stats.avg.toFixed(1)}</div>
                <StarRow rating={stats.avg} />
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {stats.count} {t("mdetail.reviews.summary")}
                </div>
              </div>
              {reviews.length > 0 && (
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <label className="text-[11px] text-muted-foreground">
                    {t("mdetail.reviews.filterBy")}
                  </label>
                  <select
                    value={reviewFilter}
                    onChange={(e) => setReviewFilter(e.target.value as typeof reviewFilter)}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-ring focus:outline-none"
                  >
                    <option value="all">{t("mdetail.reviews.type.all")}</option>
                    <option value="service">{t("mdetail.reviews.type.service")}</option>
                    <option value="event">{t("mdetail.reviews.type.event")}</option>
                    <option value="networking">{t("mdetail.reviews.type.networking")}</option>
                  </select>
                  <label className="text-[11px] text-muted-foreground">
                    {t("mdetail.reviews.sortBy")}
                  </label>
                  <select
                    value={reviewSort}
                    onChange={(e) => setReviewSort(e.target.value as typeof reviewSort)}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-ring focus:outline-none"
                  >
                    <option value="recent">{t("mdetail.reviews.sort.recent")}</option>
                    <option value="highest">{t("mdetail.reviews.sort.highest")}</option>
                    <option value="lowest">{t("mdetail.reviews.sort.lowest")}</option>
                  </select>
                  {(reviewFilter !== "all" || reviewSort !== "recent" || reviewPage !== 1) && (
                    <button
                      type="button"
                      onClick={() => {
                        setReviewFilter("all");
                        setReviewSort("recent");
                        setReviewPage(1);
                      }}
                      className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      {t("mdetail.reviews.clear")}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Active filter/sort chips */}
            {(reviewFilter !== "all" || reviewSort !== "recent") && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {reviewFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {t("mdetail.reviews.filterBy")}{" "}
                    {t(`mdetail.reviews.type.${reviewFilter}` as TKey)}
                    <button
                      type="button"
                      aria-label={t("mdetail.reviews.clear")}
                      onClick={() => {
                        setReviewFilter("all");
                        setReviewPage(1);
                      }}
                      className="ml-0.5 rounded-full hover:text-primary/70"
                    >
                      ×
                    </button>
                  </span>
                )}
                {reviewSort !== "recent" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {t("mdetail.reviews.sortBy")} {t(`mdetail.reviews.sort.${reviewSort}` as TKey)}
                    <button
                      type="button"
                      aria-label={t("mdetail.reviews.clear")}
                      onClick={() => {
                        setReviewSort("recent");
                        setReviewPage(1);
                      }}
                      className="ml-0.5 rounded-full hover:text-primary/70"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Add review form */}
            {member.id !== CURRENT_USER_ID && (
              <div className="mb-5 rounded-xl border border-border bg-secondary/30 p-4">
                <div className="mb-2 text-sm font-semibold text-foreground">
                  {t("mdetail.reviews.addTitle")}
                </div>
                <div className="mb-3 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewRating(i)}
                      aria-label={`${i}`}
                    >
                      <Star
                        className={i <= newRating ? "text-warning" : "text-muted-foreground/30"}
                        style={{
                          width: 22,
                          height: 22,
                          fill: i <= newRating ? "currentColor" : "none",
                        }}
                      />
                    </button>
                  ))}
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <label className="text-[11px] text-muted-foreground">
                    {t("mdetail.reviews.type")}
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as ReviewType)}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-ring focus:outline-none"
                  >
                    <option value="service">{t("mdetail.reviews.type.service")}</option>
                    <option value="event">{t("mdetail.reviews.type.event")}</option>
                    <option value="networking">{t("mdetail.reviews.type.networking")}</option>
                  </select>
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t("mdetail.reviews.placeholder")}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleAddReview}
                    disabled={submittingReview || newComment.trim().length === 0}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {submittingReview ? t("detail.saving") : t("mdetail.reviews.submit")}
                  </button>
                </div>
              </div>
            )}

            {reviews.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t("mdetail.reviews.empty")}
              </p>
            ) : (
              <>
                <div className="divide-y divide-border">
                  {pagedReviews.map((r: any) => {
                    const ini = r.reviewerName
                      ? r.reviewerName
                          .split(" ")
                          .slice(-2)
                          .map((p: string) => p[0])
                          .join("")
                          .toUpperCase()
                      : "?";
                    return (
                      <div key={r.id} className="flex gap-3 py-4">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground"
                          style={{ background: "var(--gradient-primary)" }}
                        >
                          {ini}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {r.reviewerName || "—"}
                            </span>
                            <StarRow rating={r.rating} size={12} />
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              {t(`mdetail.reviews.type.${r.reviewType}` as TKey)}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {fmt.date(r.createdAt)}
                            </span>
                            {r.reviewerId === CURRENT_USER_ID && editingReviewId !== r.id && (
                              <span className="ml-auto flex items-center gap-1">
                                <button
                                  onClick={() => startEditReview(r)}
                                  title={t("mdetail.reviews.edit")}
                                  className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteReview(r.id)}
                                  title={t("mdetail.reviews.delete")}
                                  className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </span>
                            )}
                          </div>
                          {editingReviewId === r.id ? (
                            <div className="mt-2 rounded-xl border border-border bg-secondary/30 p-3">
                              <div className="mb-2 flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setEditRating(i)}
                                    aria-label={`${i}`}
                                  >
                                    <Star
                                      className={
                                        i <= editRating
                                          ? "text-warning"
                                          : "text-muted-foreground/30"
                                      }
                                      style={{
                                        width: 18,
                                        height: 18,
                                        fill: i <= editRating ? "currentColor" : "none",
                                      }}
                                    />
                                  </button>
                                ))}
                              </div>
                              <select
                                value={editType}
                                onChange={(e) => setEditType(e.target.value as ReviewType)}
                                className="mb-2 rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
                              >
                                <option value="service">{t("mdetail.reviews.type.service")}</option>
                                <option value="event">{t("mdetail.reviews.type.event")}</option>
                                <option value="networking">
                                  {t("mdetail.reviews.type.networking")}
                                </option>
                              </select>
                              <textarea
                                value={editComment}
                                onChange={(e) => setEditComment(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                              />
                              <div className="mt-2 flex justify-end gap-2">
                                <button
                                  onClick={() => setEditingReviewId(null)}
                                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground"
                                >
                                  {t("mdetail.reviews.cancel")}
                                </button>
                                <button
                                  onClick={handleUpdateReview}
                                  disabled={submittingReview || editComment.trim().length === 0}
                                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                                  style={{ background: "var(--gradient-primary)" }}
                                >
                                  {t("mdetail.reviews.save")}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-1 text-sm text-foreground">{r.comment}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {reviewPageCount > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                      disabled={reviewPage === 1}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-50"
                    >
                      {t("mdetail.reviews.prev")}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {t("mdetail.reviews.pageOf", { 0: reviewPage, 1: reviewPageCount })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setReviewPage((p) => Math.min(reviewPageCount, p + 1))}
                      disabled={reviewPage === reviewPageCount}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-50"
                    >
                      {t("mdetail.reviews.next")}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {tab === "activity" && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="mb-4 text-base font-semibold text-foreground">
            {t("m360.timeline.title")}
          </h3>
          <MemberActivityFeed
            member={member}
            reviews={reviews}
            products={products}
            interactions={activityItems}
            isAdmin={isAdmin}
            loading={activityLoading && activityItems.length === 0}
            onSelectInteraction={setSelectedInteraction}
          />
          <div ref={activitySentinelRef} className="h-1" />
          {activityHasMore && !activityLoading && (
            <button
              type="button"
              onClick={() => loadActivity(activityFilter, activityItems.length)}
              className="mt-4 w-full rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-secondary/50"
            >
              {t("mdetail.activity.loadMore")}
            </button>
          )}
        </section>
      )}

      <Dialog open={!!selectedInteraction} onOpenChange={(o) => !o && setSelectedInteraction(null)}>
        <DialogContent className="max-w-md">
          {selectedInteraction && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = intIcon[selectedInteraction.type];
                    return <Icon className="h-4 w-4 text-primary" />;
                  })()}
                  {t("mdetail.int.detailTitle")}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("mdetail.int.type")}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {t(intLabel[selectedInteraction.type])}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("mdetail.int.time")}</span>
                  <span className="font-medium text-foreground">
                    {fmt.date(selectedInteraction.at)}
                  </span>
                </div>
                <div>
                  <p className="mb-1 text-muted-foreground">{t("mdetail.int.content")}</p>
                  <p className="font-semibold text-foreground">{selectedInteraction.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                    {selectedInteraction.detail || t("mdetail.int.noContent")}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <SendEmailModal
        open={openEmail}
        onClose={() => setOpenEmail(false)}
        recipientName={member.name}
        recipientEmail={member.email}
      />
    </AppShell>
  );
}
