import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Bell, Eye, FileText, LogIn, Package, Plus, Store, UserX } from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, Pill, StatCard } from "@/components/dashboard/PageKit";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/dashboard/StateKit";
import { useFmt, useT, type TKey } from "@/lib/i18n";
import type { Product, ProductStatus, QuoteStatus } from "@/lib/marketplace-data";
import { listMyQuotesFn, listProductsFn } from "@/lib/marketplace.functions";
import { getNetworkStateFn } from "@/lib/networking.functions";
import { useSessionStatus } from "@/hooks/use-session-status";

const STATUS_COLOR: Record<ProductStatus, "success" | "neutral" | "warning"> = {
  active: "success",
  sold: "neutral",
  draft: "warning",
};
const STATUS_KEY: Record<ProductStatus, TKey> = {
  active: "mk.status.active",
  sold: "mk.status.sold",
  draft: "mk.status.draft",
};

const QUOTE_COLOR: Record<QuoteStatus, "primary" | "success" | "neutral" | "warning" | "danger"> = {
  sent: "neutral",
  viewing: "warning",
  confirmed: "success",
  rejected: "danger",
  cancelled: "danger",
};
const QUOTE_KEY: Record<QuoteStatus, TKey> = {
  sent: "mk.qs.sent",
  viewing: "mk.qs.viewing",
  confirmed: "mk.qs.confirmed",
  rejected: "mk.qs.rejected",
  cancelled: "mk.qs.cancelled",
};

export const Route = createFileRoute("/marketplace/workspace")({
  component: WorkspacePage,
  errorComponent: ({ error }) => (
    <AppShell>
      <Card className="p-6 text-sm text-destructive">{error.message}</Card>
    </AppShell>
  ),
});

type MyQuote = Awaited<ReturnType<typeof listMyQuotesFn>>[number];

type Tab = "listings" | "quotes";

function WorkspacePage() {
  const t = useT();
  const fmt = useFmt();
  const listProducts = useServerFn(listProductsFn);
  const listMyQuotes = useServerFn(listMyQuotesFn);
  const getNetworkState = useServerFn(getNetworkStateFn);
  const sessionStatus = useSessionStatus();

  const [tab, setTab] = useState<Tab>("listings");
  const [memberId, setMemberId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [quotes, setQuotes] = useState<MyQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [net, prods, myQuotes] = await Promise.all([
        getNetworkState(),
        listProducts(),
        listMyQuotes(),
      ]);
      setMemberId(net.currentMemberId ?? null);
      setProducts(prods);
      setQuotes(myQuotes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [getNetworkState, listProducts, listMyQuotes]);

  useEffect(() => {
    if (sessionStatus === "authenticated") void refresh();
    else if (sessionStatus === "anonymous") setLoading(false);
  }, [sessionStatus, refresh]);

  const myListings = useMemo(
    () => (memberId ? products.filter((p) => p.sellerId === memberId) : []),
    [products, memberId],
  );

  const stats = useMemo(() => {
    const published = myListings.length;
    const active = myListings.filter((p) => p.status === "active").length;
    const sold = myListings.filter((p) => p.status === "sold").length;
    return { published, active, sold, quotesSent: quotes.length };
  }, [myListings, quotes]);

  // Auth gate — server functions require an authenticated session.
  if (sessionStatus === "anonymous") {
    return (
      <AppShell>
        <BackLink t={t} />
        <Header t={t} />
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <LogIn className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="text-base font-semibold text-foreground">{t("mk.myq.authTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("mk.myq.authDesc")}</p>
          </div>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {t("mk.myq.authCta")}
          </Link>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <BackLink t={t} />
      <Header t={t} />

      {/* Summary cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label={t("mk.ws.stat.published")}
          value={stats.published}
          tone="primary"
          icon={<Store className="h-4 w-4" aria-hidden="true" />}
        />
        <StatCard
          label={t("mk.ws.stat.active")}
          value={stats.active}
          tone="success"
          icon={<Package className="h-4 w-4" aria-hidden="true" />}
        />
        <StatCard
          label={t("mk.ws.stat.sold")}
          value={stats.sold}
          tone="info"
          icon={<Eye className="h-4 w-4" aria-hidden="true" />}
        />
        <StatCard
          label={t("mk.ws.stat.quotesSent")}
          value={stats.quotesSent}
          tone="warning"
          icon={<FileText className="h-4 w-4" aria-hidden="true" />}
        />
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label={t("mk.ws.title")}
        className="mb-4 inline-flex rounded-xl border border-border bg-card p-1"
      >
        <TabButton
          active={tab === "listings"}
          onClick={() => setTab("listings")}
          label={`${t("mk.ws.tab.listings")} (${stats.published})`}
        />
        <TabButton
          active={tab === "quotes"}
          onClick={() => setTab("quotes")}
          label={`${t("mk.ws.tab.quotes")} (${stats.quotesSent})`}
        />
      </div>

      {loading ? (
        <Card className="p-5">
          <ListSkeleton rows={5} />
        </Card>
      ) : error ? (
        <Card className="p-4">
          <ErrorState description={error} onRetry={() => void refresh()} />
        </Card>
      ) : !memberId ? (
        <Card className="p-4">
          <EmptyState
            icon={<UserX className="h-6 w-6" />}
            title={t("mk.ws.identityTitle")}
            description={t("mk.ws.identityDesc")}
          />
        </Card>
      ) : tab === "listings" ? (
        myListings.length === 0 ? (
          <Card className="p-4">
            <EmptyState
              icon={<Store className="h-6 w-6" />}
              title={t("mk.ws.listings.empty")}
              action={
                <Link
                  to="/marketplace"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {t("mk.ws.listings.emptyCta")}
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {myListings.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl" aria-hidden="true">
                    {p.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {p.title}
                      </div>
                      <Pill color={STATUS_COLOR[p.status]}>{t(STATUS_KEY[p.status])}</Pill>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                      <span>{t(p.category)}</span>
                      <span className="font-semibold text-foreground">{fmt.money(p.price)}</span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3 w-3" aria-hidden="true" />
                        {p.views} {t("mk.ws.views")}
                      </span>
                    </div>
                    <div className="mt-2">
                      <Link
                        to="/marketplace/$productId"
                        params={{ productId: p.id }}
                        className="inline-flex items-center gap-1.5 rounded-lg px-1 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("mk.ws.view")}
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : quotes.length === 0 ? (
        <Card className="p-4">
          <EmptyState icon={<FileText className="h-6 w-6" />} title={t("mk.myq.empty")} />
        </Card>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <Card key={q.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-3xl" aria-hidden="true">
                  {q.productEmoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {q.productTitle}
                    </div>
                    <Pill color={QUOTE_COLOR[q.status]}>{t(QUOTE_KEY[q.status])}</Pill>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-foreground">{q.message}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Package className="h-3 w-3" aria-hidden="true" />
                      {q.quantity} ×
                    </span>
                    <span>
                      {t("mk.myq.sentAt")}: {fmt.date(q.createdAt)}
                    </span>
                    {q.reminderCount > 0 && (
                      <span className="inline-flex items-center gap-1 font-medium text-warning">
                        <Bell className="h-3 w-3" aria-hidden="true" />
                        {q.reminderCount} {t("mk.qs.reminders")}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <Link
                      to="/marketplace/$productId"
                      params={{ productId: q.productId }}
                      className="inline-flex items-center gap-1.5 rounded-lg px-1 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("mk.myq.viewProduct")}
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function BackLink({ t }: { t: (k: TKey) => string }) {
  return (
    <Link
      to="/marketplace"
      className="mb-4 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {t("mk.detail.back")}
    </Link>
  );
}

function Header({ t }: { t: (k: TKey) => string }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("mk.ws.title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("mk.ws.subtitle")}</p>
    </div>
  );
}

function TabButton({
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
      role="tab"
      aria-selected={active}
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
