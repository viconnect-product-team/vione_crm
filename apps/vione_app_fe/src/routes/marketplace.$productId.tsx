import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { REVIEW_SEARCH_RESET } from "@/lib/review-search";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  Facebook,
  FileText,
  Globe,
  Layers,
  Loader2,
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Pin,
  Send,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  Trash2,
  User,
  X,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, Pill } from "@/components/dashboard/PageKit";
import { Skeleton, ErrorState } from "@/components/dashboard/StateKit";
import { useFmt, useT, type TKey } from "@/lib/i18n";
import { useServerData } from "@/hooks/use-server-data";
import {
  getSeller,
  type Product,
  type ProductStatus,
  type QuoteRequest,
  type QuoteStatus,
} from "@/lib/marketplace-data";
import {
  getProductFn,
  listProductsFn,
  createQuoteRequestFn,
  updateQuoteStatusFn,
  remindQuoteFn,
  deleteQuoteFn,
  toggleSoldFn,
  deleteProductFn,
} from "@/lib/marketplace.functions";
import { CURRENT_USER_ID } from "@/lib/networking-data";
import { resolveMediaUrl } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/marketplace/$productId")({
  validateSearch: (search: Record<string, unknown>): { quote?: boolean } =>
    search.quote === "1" || search.quote === true ? { quote: true } : {},
  // NOTE: getProductFn / listProductsFn are auth-gated (requireSupabaseAuth).
  // This is a public (non-_authenticated) route, so calling them in the loader
  // would 401 during SSR/prerender. Data is fetched client-side after the
  // session is available (see ProductDetailPage).
  component: ProductDetailPage,
});

function DetailLoading() {
  return (
    <AppShell>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </AppShell>
  );
}

function DetailError({ onRetry }: { onRetry: () => void }) {
  return (
    <AppShell>
      <ErrorState onRetry={onRetry} />
    </AppShell>
  );
}

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

export const QUOTE_STATUS_COLOR: Record<
  QuoteStatus,
  "primary" | "success" | "neutral" | "warning" | "danger"
> = {
  sent: "neutral",
  viewing: "warning",
  confirmed: "success",
  rejected: "danger",
  cancelled: "danger",
};
export const QUOTE_STATUS_KEY: Record<QuoteStatus, TKey> = {
  sent: "mk.qs.sent",
  viewing: "mk.qs.viewing",
  confirmed: "mk.qs.confirmed",
  rejected: "mk.qs.rejected",
  cancelled: "mk.qs.cancelled",
};

function NotFound() {
  const t = useT();
  return (
    <AppShell>
      <Card className="mx-auto max-w-md p-10 text-center">
        <h2 className="mb-2 text-xl font-bold text-foreground">404</h2>
        <p className="mb-6 text-sm text-muted-foreground">{t("mk.detail.notFound")}</p>
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("mk.detail.back")}
        </Link>
      </Card>
    </AppShell>
  );
}

function QuoteModal({
  product,
  onClose,
  onChanged,
}: {
  product: Product;
  onClose: () => void;
  onChanged: () => void;
}) {
  const t = useT();
  const fmt = useFmt();
  const createQuote = useServerFn(createQuoteRequestFn);
  const [qty, setQty] = useState("1");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Keyboard-safe modal: focus first field on open, close on Escape, trap Tab.
  useEffect(() => {
    firstFieldRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button,[href],input,textarea,select,[tabindex]:not([tabindex="-1"])',
      );
      if (!nodes || nodes.length === 0) return;
      const list = Array.from(nodes) as HTMLElement[];
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async () => {
    if (!contact.trim() || !message.trim() || busy) return;
    setBusy(true);
    try {
      await createQuote({
        data: {
          productId: product.id,
          buyerId: CURRENT_USER_ID,
          quantity: Number(qty) || 1,
          contact,
          message,
        },
      });
      onChanged();
      setSent(true);
      toast.success(t("mk.quote.success"));
      setTimeout(onClose, 1500);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("mk.quote.title")}
        className="relative z-10 w-full max-w-lg"
      >
        <Card className="max-h-[92vh] overflow-y-auto rounded-b-none p-6 sm:rounded-2xl">
          <div className="mb-1 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-foreground">{t("mk.quote.title")}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("mk.quote.subtitle")}</p>
            </div>
            <button
              onClick={onClose}
              aria-label={t("mk.form.cancel")}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {sent ? (
            <div className="py-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-9 w-9 text-success" aria-hidden="true" />
              </div>
              <div className="text-base font-semibold text-foreground">{t("mk.quote.success")}</div>
              <p className="mt-1 text-sm text-muted-foreground">{t("mk.quote.successDesc")}</p>
            </div>
          ) : (
            <>
              <div className="mb-5 mt-4 rounded-xl border border-border bg-secondary/40 p-3">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("mk.quote.summaryLabel")}
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{ background: "var(--gradient-card)" }}
                    aria-hidden="true"
                  >
                    {product.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {product.title}
                    </div>
                    <div className="text-xs text-muted-foreground">{t(product.category)}</div>
                  </div>
                  <div className="shrink-0 text-sm font-bold" style={{ color: "var(--primary)" }}>
                    {fmt.money(product.price)}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="quote-qty"
                    className="mb-1 block text-xs font-semibold text-foreground"
                  >
                    {t("mk.quote.qty")}
                  </label>
                  <input
                    id="quote-qty"
                    ref={firstFieldRef}
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="min-h-11 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label
                    htmlFor="quote-contact"
                    className="mb-1 block text-xs font-semibold text-foreground"
                  >
                    {t("mk.quote.contact")}
                  </label>
                  <input
                    id="quote-contact"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={t("mk.quote.contactPh")}
                    className="min-h-11 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t("mk.quote.contactHint")}
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="quote-message"
                    className="mb-1 block text-xs font-semibold text-foreground"
                  >
                    {t("mk.quote.message")}
                  </label>
                  <textarea
                    id="quote-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("mk.quote.messagePh")}
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={onClose}
                  disabled={busy}
                  className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  {t("mk.form.cancel")}
                </button>
                <button
                  onClick={submit}
                  disabled={!contact.trim() || !message.trim() || busy}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      {t("mk.quote.sending")}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" aria-hidden="true" />
                      {t("mk.quote.submit")}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function QuoteStatusActions({
  quoteId,
  status,
  reminderCount,
  onChanged,
}: {
  quoteId: string;
  status: QuoteStatus;
  reminderCount: number;
  onChanged: () => void;
}) {
  const t = useT();
  const updateStatus = useServerFn(updateQuoteStatusFn);
  const remind = useServerFn(remindQuoteFn);
  const del = useServerFn(deleteQuoteFn);
  const [busy, setBusy] = useState(false);

  const set = async (next: QuoteStatus) => {
    setBusy(true);
    try {
      await updateStatus({ data: { id: quoteId, status: next } });
      onChanged();
      toast.success(t("mk.qs.updated"));
    } finally {
      setBusy(false);
    }
  };

  const sendReminder = async () => {
    setBusy(true);
    try {
      await remind({ data: { id: quoteId } });
      onChanged();
      toast.success(t("mk.qs.reminded"));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(t("mk.qs.confirmDelete"))) return;
    setBusy(true);
    try {
      await del({ data: { id: quoteId } });
      onChanged();
      toast.success(t("mk.qs.deleted"));
    } finally {
      setBusy(false);
    }
  };

  const open = status !== "confirmed" && status !== "rejected" && status !== "cancelled";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {open && status === "sent" && (
        <button
          onClick={() => set("viewing")}
          disabled={busy}
          className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
        >
          {t("mk.qs.markViewing")}
        </button>
      )}
      {open && (
        <button
          onClick={sendReminder}
          disabled={busy}
          className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
        >
          {t("mk.qs.remind")}
          {reminderCount > 0 ? ` (${reminderCount})` : ""}
        </button>
      )}
      {open && (
        <button
          onClick={() => set("confirmed")}
          disabled={busy}
          className="rounded-lg bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success hover:bg-success/25 disabled:opacity-50"
        >
          {t("mk.qs.confirm")}
        </button>
      )}
      {open && (
        <button
          onClick={() => set("rejected")}
          disabled={busy}
          className="rounded-lg bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50"
        >
          {t("mk.qs.reject")}
        </button>
      )}
      <button
        onClick={remove}
        disabled={busy}
        className="rounded-lg border border-destructive/30 px-2.5 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
      >
        {t("mk.qs.delete")}
      </button>
    </div>
  );
}

const PIN_STORAGE_KEY = "vba.mk.pinned";

function ProductDetailPage() {
  const { productId } = Route.useParams();
  const getProduct = useServerFn(getProductFn);
  const listProducts = useServerFn(listProductsFn);
  const { data, loading, error, reload } = useServerData<{
    product: Product;
    quotes: QuoteRequest[];
    allProducts: Product[];
  } | null>(async () => {
    const [res, allProducts] = await Promise.all([
      getProduct({ data: { id: productId } }),
      listProducts(),
    ]);
    if (!res) return null;
    return { ...res, allProducts };
  }, null);

  if (loading && !data) return <DetailLoading />;
  if (error) return <DetailError onRetry={reload} />;
  if (!data) return <NotFound />;
  return <ProductDetailContent {...data} reload={reload} />;
}

function ProductDetailContent({
  product,
  quotes,
  allProducts,
  reload,
}: {
  product: Product;
  quotes: QuoteRequest[];
  allProducts: Product[];
  reload: () => void;
}) {
  const t = useT();
  const fmt = useFmt();
  const navigate = useNavigate();
  const { quote: quoteParam } = Route.useSearch();
  const [showQuote, setShowQuote] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggleSold = useServerFn(toggleSoldFn);
  const deleteProduct = useServerFn(deleteProductFn);

  useEffect(() => {
    if (quoteParam) setShowQuote(true);
  }, [quoteParam]);

  // Pinned listings are a client-only preference shared with the list page.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PIN_STORAGE_KEY);
      if (raw) setPinned((JSON.parse(raw) as string[]).includes(product.id));
    } catch {
      /* ignore */
    }
  }, [product.id]);

  const togglePin = () => {
    try {
      const raw = localStorage.getItem(PIN_STORAGE_KEY);
      const set = new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
      if (set.has(product.id)) set.delete(product.id);
      else set.add(product.id);
      localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify([...set]));
      setPinned(set.has(product.id));
    } catch {
      /* ignore */
    }
  };

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: product.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(t("mk.detail.shareCopied"));
      }
    } catch {
      /* user dismissed */
    }
  };

  const onToggleSold = async () => {
    setBusy(true);
    try {
      await toggleSold({ data: { id: product.id, sellerId: CURRENT_USER_ID } });
      reload();
      toast.success(t("mk.form.updated"));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!confirm(t("mk.delete.desc"))) return;
    setBusy(true);
    try {
      await deleteProduct({ data: { id: product.id, sellerId: CURRENT_USER_ID } });
      toast.success(t("mk.deleted"));
      navigate({ to: "/marketplace" });
    } finally {
      setBusy(false);
    }
  };

  // Polling: refresh quote requests every 15 s (replaces Supabase realtime channel)
  useEffect(() => {
    const id = setInterval(() => reload(), 15_000);
    return () => clearInterval(id);
  }, [reload]);


  const seller = getSeller(product.sellerId);
  const isMine = product.sellerId === CURRENT_USER_ID;

  // Related listings derived from the already-loaded product list (no new API):
  // same category, excluding this one, active listings first.
  const related = allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .sort(
      (a, b) => Number(b.status === "active") - Number(a.status === "active") || b.views - a.views,
    )
    .slice(0, 4);

  const initials = seller
    ? seller.name
        .split(" ")
        .slice(-2)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
    : "";

  const canQuote = !isMine && product.status === "active";
  // A buyer's own pending request (if RLS surfaces it) drives the "already requested" state.
  const myQuote = !isMine
    ? quotes.find(
        (q) => q.buyerId === CURRENT_USER_ID && q.status !== "cancelled" && q.status !== "rejected",
      )
    : undefined;
  const alreadyRequested = Boolean(myQuote);

  const SummaryCard = ({
    icon,
    label,
    value,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
  }) => (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span aria-hidden="true">{icon}</span>
        {label}
      </div>
      <div className="truncate text-sm font-bold text-foreground">{value}</div>
    </div>
  );

  return (
    <AppShell>
      <Link
        to="/marketplace"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("mk.detail.back")}
      </Link>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-5 lg:col-span-2">
          <Card className="overflow-hidden">
            <div
              className="relative flex h-48 items-center justify-center overflow-hidden text-7xl sm:h-64 bg-secondary/30"
              style={{ background: "var(--gradient-card)" }}
            >
              {(() => {
                const imgUrl = (product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : null) || (product as any).imageUrl;
                const resolved = resolveMediaUrl(imgUrl);
                if (resolved) {
                  return (
                    <img
                      src={resolved}
                      alt={product.title}
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  );
                }
                return null;
              })()}
              <span aria-hidden="true" className="relative z-10 drop-shadow-md">{product.emoji}</span>
              <div className="absolute right-3 top-3 flex items-center gap-1.5">
                <button
                  onClick={togglePin}
                  aria-pressed={pinned}
                  aria-label={t(pinned ? "mk.unpin" : "mk.pin")}
                  className="rounded-lg bg-background/80 p-2 text-foreground backdrop-blur hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Pin
                    className={`h-4 w-4 ${pinned ? "fill-primary text-primary" : ""}`}
                    aria-hidden="true"
                  />
                </button>
                <button
                  onClick={share}
                  aria-label={t("mk.detail.share")}
                  className="rounded-lg bg-background/80 p-2 text-foreground backdrop-blur hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Pill color="primary">{t(product.category)}</Pill>
                <Pill color={STATUS_COLOR[product.status]}>{t(STATUS_KEY[product.status])}</Pill>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Eye className="h-3 w-3" aria-hidden="true" />
                  {fmt.num(product.views)} {t("mk.views")}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Calendar className="h-3 w-3" aria-hidden="true" />
                  {fmt.date(product.createdAt)}
                </span>
              </div>
              <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
                {product.title}
              </h1>
              <div className="mb-4 flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-bold" style={{ color: "var(--primary)" }}>
                  {fmt.money(product.price)}
                  {product.unit && <span className="text-sm font-normal text-muted-foreground ml-1.5">/ {product.unit}</span>}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-base text-muted-foreground line-through">
                    {fmt.money(product.originalPrice)}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {(product.sellerName || seller?.name) && (
                  <div className="inline-flex items-center gap-2">
                    <User className="h-4 w-4" aria-hidden="true" />
                    <span className="font-medium text-foreground">{product.sellerName || seller?.name}</span>
                  </div>
                )}
                {product.company && (
                  <div className="inline-flex items-center gap-2">
                    <Building2 className="h-4 w-4" aria-hidden="true" />
                    <span className="font-medium text-foreground">{product.company}</span>
                  </div>
                )}
                {product.sellerPhone && (
                  <div className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    <a href={`tel:${product.sellerPhone}`} className="font-medium text-primary hover:underline">
                      {product.sellerPhone}
                    </a>
                  </div>
                )}
              </div>

              {/* Permission-aware owner actions */}
              {isMine && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                  <button
                    onClick={onToggleSold}
                    disabled={busy}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  >
                    {product.status === "sold"
                      ? t("mk.action.markActive")
                      : t("mk.action.markSold")}
                  </button>
                  <Link
                    to="/marketplace"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("mk.action.edit")}
                  </Link>
                  <button
                    onClick={onDelete}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("mk.action.delete")}
                  </button>
                </div>
              )}
            </div>
          </Card>

          {/* Business summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard
              icon={<Tag className="h-3 w-3" />}
              label={t("mk.form.price")}
              value={fmt.money(product.price)}
            />
            <SummaryCard
              icon={<ShieldCheck className="h-3 w-3" />}
              label={t("mk.qs.status")}
              value={t(STATUS_KEY[product.status])}
            />
            <SummaryCard
              icon={<Layers className="h-3 w-3" />}
              label={t("mk.form.cat")}
              value={t(product.category)}
            />
            <SummaryCard
              icon={<Eye className="h-3 w-3" />}
              label={t("mk.views")}
              value={fmt.num(product.views)}
            />
            {isMine && (
              <SummaryCard
                icon={<ShoppingBag className="h-3 w-3" />}
                label={t("mk.detail.quotes")}
                value={fmt.num(quotes.length)}
              />
            )}
            {seller && (
              <SummaryCard
                icon={<User className="h-3 w-3" />}
                label={t("mk.postedBy")}
                value={seller.name}
              />
            )}
          </div>

          <Card className="p-6">
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
              <FileText className="h-4 w-4" />
              {t("mk.detail.about")}
            </h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
              {product.description}
            </p>
          </Card>

          {product.imageUrls?.length ||
          product.pdfUrl ||
          product.websiteUrl ||
          product.facebookUrl ? (
            <Card className="space-y-4 p-6">
              {product.imageUrls && product.imageUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {product.imageUrls.map((url) => {
                    const resolved = resolveMediaUrl(url) || url;
                    return (
                      <a
                        key={url}
                        href={resolved}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-lg border border-border bg-secondary/20"
                      >
                        <img
                          src={resolved}
                          alt={product.title}
                          className="h-32 w-full object-cover transition hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.opacity = "0.4";
                          }}
                        />
                      </a>
                    );
                  })}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {product.pdfUrl && (
                  <a
                    href={product.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    <FileText className="h-4 w-4 text-primary" /> {t("mk.form.viewPdf")}
                  </a>
                )}
                {product.websiteUrl && (
                  <a
                    href={product.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    <Globe className="h-4 w-4 text-primary" /> {t("mk.form.visitWebsite")}
                  </a>
                )}
                {product.facebookUrl && (
                  <a
                    href={product.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    <Facebook className="h-4 w-4 text-primary" /> Facebook
                  </a>
                )}
              </div>
            </Card>
          ) : null}

          {isMine && (
            <Card className="p-6">
              <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
                <ShoppingBag className="h-4 w-4" />
                {t("mk.detail.quotes")}
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold">
                  {quotes.length}
                </span>
              </h3>
              {quotes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-10 text-center">
                  <ShoppingBag
                    className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-muted-foreground">{t("mk.detail.noQuotes")}</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {quotes.map((q) => {
                    const buyer = getSeller(q.buyerId);
                    const buyerInitials = buyer
                      ? buyer.name
                          .split(" ")
                          .slice(-2)
                          .map((p) => p[0])
                          .join("")
                          .toUpperCase()
                      : "?";
                    return (
                      <div key={q.id} className="py-4">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground"
                              style={{ background: "var(--gradient-primary)" }}
                              aria-hidden="true"
                            >
                              {buyerInitials}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-foreground">
                                {buyer?.name ?? t("mk.quote.requester")}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {q.quantity} ×
                              </div>
                            </div>
                          </div>
                          <div className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {fmt.date(q.createdAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" aria-hidden="true" />
                          {q.contact}
                        </div>
                        <p className="mt-1.5 rounded-lg bg-secondary/40 p-2.5 text-sm text-foreground">
                          {q.message}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Pill color={QUOTE_STATUS_COLOR[q.status]}>
                            {t(QUOTE_STATUS_KEY[q.status])}
                          </Pill>
                          <QuoteStatusActions
                            quoteId={q.id}
                            status={q.status}
                            reminderCount={q.reminderCount}
                            onChanged={reload}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {related.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                <Store className="h-4 w-4" aria-hidden="true" />
                {t("mk.detail.related")}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {related.map((p) => {
                  const rs = getSeller(p.sellerId);
                  return (
                    <Link
                      key={p.id}
                      to="/marketplace/$productId"
                      params={{ productId: p.id }}
                      className="group flex items-center gap-3 rounded-xl border border-border p-3 transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                        style={{ background: "var(--gradient-card)" }}
                        aria-hidden="true"
                      >
                        {p.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-1 text-sm font-semibold text-foreground group-hover:text-primary">
                          {p.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {fmt.money(p.price)}
                          {rs && <span className="opacity-50"> • {rs.name}</span>}
                        </div>
                      </div>
                      <ArrowRight
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </Link>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Side */}
        <div className="space-y-5">
          {seller && (
            <Card className="p-5">
              <h3 className="mb-3 text-base font-semibold text-foreground">
                {t("mk.detail.seller")}
              </h3>
              <div className="flex items-start gap-3">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-primary-foreground"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/members/$memberId"
                    params={{ memberId: seller.id }}
                    search={REVIEW_SEARCH_RESET}
                    className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {seller.name}
                  </Link>
                  <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <ShieldCheck className="h-3 w-3" />
                    {t("mk.detail.relatedSellerInfo")}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  {seller.type === "company" ? (
                    <Building2 className="h-3.5 w-3.5" />
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                  <span className="text-foreground">{t(seller.industry)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-foreground">{t(seller.region)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span className="text-foreground">{seller.contact}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <a href={`mailto:${seller.email}`} className="text-primary hover:underline">
                    {seller.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span className="text-foreground">{seller.phone}</span>
                </div>
              </div>
            </Card>
          )}

          {isMine ? (
            <Card className="flex items-start gap-3 p-5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {t("mk.detail.ownListing")}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("mk.detail.ownListingDesc")}
                </p>
              </div>
            </Card>
          ) : (
            <Card className="space-y-3 p-5">
              {alreadyRequested ? (
                <div className="rounded-xl border border-success/30 bg-success/10 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-success"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground">
                        {t("mk.detail.alreadyRequested")}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t("mk.detail.alreadyRequestedDesc")}
                      </p>
                      {myQuote && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Pill color={QUOTE_STATUS_COLOR[myQuote.status]}>
                            {t(QUOTE_STATUS_KEY[myQuote.status])}
                          </Pill>
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {fmt.date(myQuote.createdAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Link
                    to="/marketplace/my-quotes"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {t("mk.detail.viewMyQuotes")}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              ) : product.status !== "active" ? (
                <div className="rounded-xl border border-border bg-secondary/40 p-4 text-center">
                  <div className="text-sm font-semibold text-foreground">
                    {t("mk.detail.unavailable")}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("mk.detail.unavailableDesc")}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setShowQuote(true)}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  {t("mk.detail.quoteBtn")}
                </button>
              )}
              <button
                onClick={() =>
                  navigate({
                    to: "/network",
                    search: { peer: product.sellerId, product: product.id },
                  })
                }
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                {t("mk.detail.contactBtn")}
              </button>
            </Card>
          )}
        </div>
      </div>

      {/* Sticky mobile CTA bar — offset above the AppShell BottomNav so it
          never overlaps the bottom navigation (nav owns the safe-area inset). */}
      <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-2 border-y border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        {isMine ? (
          <>
            <button
              onClick={onToggleSold}
              disabled={busy}
              className="min-h-11 flex-1 rounded-xl border border-border px-4 text-sm font-semibold text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {product.status === "sold" ? t("mk.action.markActive") : t("mk.action.markSold")}
            </button>
            <Link
              to="/marketplace"
              aria-label={t("mk.action.edit")}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border px-4 text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Link>
          </>
        ) : (
          <>
            {alreadyRequested ? (
              <Link
                to="/marketplace/my-quotes"
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-success/40 bg-success/10 px-4 text-sm font-semibold text-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {t("mk.detail.alreadyRequested")}
              </Link>
            ) : (
              <button
                onClick={() => setShowQuote(true)}
                disabled={!canQuote}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                style={{ background: "var(--gradient-primary)" }}
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                {canQuote ? t("mk.detail.quoteBtn") : t("mk.detail.unavailable")}
              </button>
            )}
            <button
              onClick={() =>
                navigate({
                  to: "/network",
                  search: { peer: product.sellerId, product: product.id },
                })
              }
              aria-label={t("mk.detail.contactBtn")}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border px-4 text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      {/* Spacer so the sticky CTA + bottom nav never cover content on mobile */}
      <div className="h-36 lg:hidden" aria-hidden="true" />

      {showQuote && (
        <QuoteModal product={product} onClose={() => setShowQuote(false)} onChanged={reload} />
      )}
    </AppShell>
  );
}
