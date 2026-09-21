import { useMemo } from "react";
import {
  CalendarCheck2,
  FileText,
  MessageSquare,
  RefreshCw,
  ShoppingBag,
  Star,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useFmt, useT, type TKey } from "@/lib/i18n";
import { EmptyState, ListSkeleton } from "@/components/dashboard/StateKit";
import type { Member } from "@/lib/members-data";
import type { ReviewRow } from "@/lib/reviews.functions";
import type { Product } from "@/lib/marketplace-data";
import type { Interaction } from "@/lib/member-activity.functions";

type Tone = "primary" | "success" | "warning" | "muted";

type TimelineEvent = {
  id: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  date: string; // ISO
  tone: Tone;
  adminOnly?: boolean;
};

const toneRing: Record<Tone, string> = {
  primary: "border-primary/30 bg-primary/10 text-primary",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  muted: "border-border bg-secondary text-muted-foreground",
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

/**
 * Reusable, permission-aware membership timeline.
 * Events are derived ONLY from data already loaded on the Member 360 page —
 * no new backend calls, no fabricated sensitive events. Fee/account events
 * are flagged adminOnly and hidden from non-admins.
 */
export function MembershipTimeline({
  member,
  reviews = [],
  products = [],
  interactions = [],
  isAdmin = false,
  loading = false,
  limit,
}: {
  member: Member;
  reviews?: ReviewRow[];
  products?: Product[];
  interactions?: Interaction[];
  isAdmin?: boolean;
  loading?: boolean;
  limit?: number;
}) {
  const t = useT();
  const fmt = useFmt();

  const events = useMemo(() => {
    const list: TimelineEvent[] = [];

    // Public: joined the association.
    if (member.joinedAt) {
      list.push({
        id: "joined",
        icon: UserPlus,
        title: t("m360.timeline.joined"),
        description: t("m360.timeline.joinedDesc"),
        date: member.joinedAt,
        tone: "primary",
      });
    }

    // Public: membership renewal (only when real renewal data exists).
    if (member.renewedAt) {
      list.push({
        id: "renewed",
        icon: RefreshCw,
        title: t("m360.timeline.renewed"),
        description: member.newTermEnd
          ? t("m360.timeline.renewedDesc", {
              0: new Date(member.newTermEnd).toLocaleDateString("vi-VN"),
            })
          : undefined,
        date: member.renewedAt,
        tone: "success",
      });
    }

    // Admin-only: fee/payment milestone. Uses the fee year as the reference
    // date; no amounts or payment identifiers are exposed.
    list.push({
      id: "fee",
      icon: Wallet,
      title: member.feePaid
        ? t("m360.timeline.feePaid", { 0: member.feeYear })
        : t("m360.timeline.feeDue", { 0: member.feeYear }),
      date: `${member.feeYear}-01-01T00:00:00.000Z`,
      tone: member.feePaid ? "success" : "warning",
      adminOnly: true,
    });

    // Public: opportunities / products published.
    for (const p of products) {
      if (!p.createdAt) continue;
      list.push({
        id: `product-${p.id}`,
        icon: ShoppingBag,
        title: t("m360.timeline.product"),
        description: p.title,
        date: p.createdAt,
        tone: "muted",
      });
    }

    // Public: reviews / networking feedback received.
    for (const r of reviews) {
      if (!r.createdAt) continue;
      list.push({
        id: `review-${r.id}`,
        icon: Star,
        title: t("m360.timeline.review"),
        description: r.comment,
        date: r.createdAt,
        tone: "muted",
      });
    }

    // Public: event participation + networking interactions.
    for (const it of interactions) {
      if (!it.at) continue;
      list.push({
        id: `int-${it.id}`,
        icon: intIcon[it.type],
        title: t(intLabel[it.type]),
        description: it.title,
        date: it.at,
        tone: it.type === "event" ? "primary" : "muted",
      });
    }

    const visible = isAdmin ? list : list.filter((e: any) => !e.adminOnly);
    visible.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return typeof limit === "number" ? visible.slice(0, limit) : visible;
  }, [member, reviews, products, interactions, isAdmin, limit, t]);

  if (loading) {
    return <ListSkeleton rows={5} />;
  }

  if (events.length === 0) {
    return (
      <EmptyState icon={<CalendarCheck2 className="h-6 w-6" />} title={t("m360.timeline.empty")} />
    );
  }

  return (
    <ol className="relative space-y-5 border-l border-border pl-6">
      {events.map((e: any) => {
        const Icon = e.icon;
        return (
          <li key={e.id} className="relative">
            <span
              className={`absolute -left-[31px] grid h-7 w-7 place-items-center rounded-full border ${(toneRing as any)[e.tone]}`}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{e.title}</span>
                {e.adminOnly && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {t("m360.timeline.internal")}
                  </span>
                )}
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {fmt.date(e.date)}
                </span>
              </div>
              {e.description && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{e.description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
