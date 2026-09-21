import { useEffect, useMemo, useState } from "react";
import { REVIEW_SEARCH_RESET } from "@/lib/review-search";
import { Link } from "@tanstack/react-router";
import {
  Archive,
  Building2,
  CalendarDays,
  CheckCircle2,
  Eye,
  Layers,
  MapPin,
  Pencil,
  Plus,
  Share2,
  ShoppingBag,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useFmt, useT, type TKey } from "@/lib/i18n";
import { EmptyState } from "@/components/dashboard/StateKit";
import type { Member } from "@/lib/members-data";
import type { Product } from "@/lib/marketplace-data";
import type { Interaction } from "@/lib/member-activity.functions";
import { listConnections, subscribe } from "@/lib/networking-data";

const statusLabel: Record<Product["status"], TKey> = {
  active: "mk.status.active",
  sold: "mk.status.sold",
  draft: "mk.status.draft",
};
const statusTone: Record<Product["status"], string> = {
  active: "bg-success/15 text-success",
  sold: "bg-primary/10 text-primary",
  draft: "bg-secondary text-muted-foreground",
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .slice(-2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-3">
      <Icon className="mb-2 h-4 w-4 text-primary" />
      <div className="text-xl font-bold text-foreground">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

/**
 * Business collaboration hub for the Member 360 Opportunities section.
 * Derives everything from data already loaded on the page (products +
 * interactions) plus the shared network store. No new backend calls.
 */
export function MemberOpportunities({
  member,
  currentUserId,
  products,
  interactions,
}: {
  member: Member;
  currentUserId: string;
  products: Product[];
  interactions: Interaction[];
}) {
  const t = useT();
  const fmt = useFmt();
  const [, force] = useState(0);
  const isOwner = currentUserId === member.id;

  useEffect(() => {
    const unsub = subscribe(() => force((x) => x + 1));
    return () => {
      unsub();
    };
  }, []);

  const stats = useMemo(() => {
    const active = products.filter((p) => p.status === "active").length;
    const closed = products.filter((p) => p.status === "sold").length;
    const views = products.reduce((sum, p) => sum + (p.views ?? 0), 0);
    const interest = interactions.filter((i) => i.type === "quote").length;
    return { active, closed, views, interest };
  }, [products, interactions]);

  const insights = useMemo(() => {
    if (products.length === 0) return null;
    const byCat = new Map<Product["category"], number>();
    for (const p of products) byCat.set(p.category, (byCat.get(p.category) ?? 0) + 1);
    const topCategory = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const avgViews = Math.round(stats.views / products.length);
    return { topCategory, avgViews };
  }, [products, stats.views]);

  const interested = useMemo(
    () => interactions.filter((i) => i.type === "quote").slice(0, 6),
    [interactions],
  );

  // Related members: reuse the already-hydrated network store (current user's
  // connections). Empty until the network state is loaded elsewhere — no extra
  // request is issued here.
  const related = useMemo(
    () =>
      listConnections()
        .filter((m) => m.id !== member.id)
        .slice(0, 6),
    [member.id],
  );

  const share = (id: string) => {
    const url = `${window.location.origin}/marketplace/${id}`;
    if (navigator.clipboard) void navigator.clipboard.writeText(url);
    toast.success(t("m360.opp.share.copied"));
  };

  if (products.length === 0 && interested.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-card)]">
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title={t("m360.opp.empty.title")}
          description={t("m360.opp.empty.desc")}
          action={
            isOwner ? (
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Plus className="h-4 w-4" />
                {t("m360.opp.empty.cta")}
              </Link>
            ) : undefined
          }
        />
      </section>
    );
  }

  return (
    <div className="space-y-5">
      {/* 1. Opportunity dashboard */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryTile
            icon={ShoppingBag}
            label={t("m360.opp.summary.published")}
            value={String(products.length)}
          />
          <SummaryTile
            icon={CheckCircle2}
            label={t("m360.opp.summary.active")}
            value={String(stats.active)}
          />
          <SummaryTile
            icon={Archive}
            label={t("m360.opp.summary.closed")}
            value={String(stats.closed)}
          />
          <SummaryTile
            icon={Users}
            label={t("m360.opp.summary.interested")}
            value={String(stats.interest)}
          />
          <SummaryTile
            icon={Eye}
            label={t("m360.opp.summary.views")}
            value={fmt.num(stats.views)}
          />
        </div>
      </section>

      {/* 2. Published opportunities */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <h3 className="mb-4 text-base font-semibold text-foreground">{t("m360.opp.published")}</h3>
        {products.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("mdetail.products.empty")}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
              >
                <div
                  className="flex h-28 items-center justify-center text-5xl"
                  style={{ background: "var(--gradient-card)" }}
                >
                  {p.emoji}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone[p.status]}`}
                    >
                      {t(statusLabel[p.status])}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      {fmt.num(p.views)}
                    </span>
                  </div>
                  <Link
                    to="/marketplace/$productId"
                    params={{ productId: p.id }}
                    className="line-clamp-2 text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {p.title}
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground">
                      {t(p.category)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground">
                      <MapPin className="h-2.5 w-2.5" />
                      {t(member.region)}
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground">
                      {t(member.industry)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {t("m360.opp.publishDate")}: {fmt.date(p.createdAt)}
                  </div>
                  <div className="mt-auto pt-3">
                    <div className="text-base font-bold" style={{ color: "var(--primary)" }}>
                      {fmt.money(p.price)}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        to="/marketplace/$productId"
                        params={{ productId: p.id }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {t("m360.opp.action.view")}
                      </Link>
                      {isOwner && (
                        <Link
                          to="/marketplace/$productId"
                          params={{ productId: p.id }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {t("m360.opp.action.edit")}
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => share(p.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        {t("m360.opp.action.share")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Interested opportunities */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <h3 className="mb-4 text-base font-semibold text-foreground">{t("m360.opp.interested")}</h3>
        {interested.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("m360.opp.emptyInterested")}
          </p>
        ) : (
          <ol className="space-y-3">
            {interested.map((it) => (
              <li
                key={it.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-secondary/30 p-3"
              >
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                  <Layers className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{it.title}</p>
                  {it.detail && (
                    <p className="line-clamp-1 text-xs text-muted-foreground">{it.detail}</p>
                  )}
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {fmt.date(it.at)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* 4. Collaboration insights */}
      {insights && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="mb-4 text-base font-semibold text-foreground">{t("m360.opp.insights")}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <Layers className="mb-2 h-4 w-4 text-primary" />
              <div className="text-sm font-bold text-foreground">
                {insights.topCategory ? t(insights.topCategory) : t("m360.opp.none")}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {t("m360.opp.insight.topCategory")}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <Building2 className="mb-2 h-4 w-4 text-primary" />
              <div className="text-sm font-bold text-foreground">{t(member.industry)}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {t("m360.opp.insight.industry")}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <TrendingUp className="mb-2 h-4 w-4 text-primary" />
              <div className="text-sm font-bold text-foreground">{fmt.num(insights.avgViews)}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {t("m360.opp.insight.avgViews")}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. Related members */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <h3 className="mb-4 text-base font-semibold text-foreground">{t("m360.opp.related")}</h3>
        {related.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("m360.opp.emptyRelated")}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {related.map((m) => (
              <Link
                key={m.id}
                to="/members/$memberId"
                params={{ memberId: m.id }}
                search={REVIEW_SEARCH_RESET}
                className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3 transition-colors hover:border-primary/40"
              >
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold text-primary-foreground"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {initialsOf(m.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">{m.name}</div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="truncate">{t(m.industry)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
