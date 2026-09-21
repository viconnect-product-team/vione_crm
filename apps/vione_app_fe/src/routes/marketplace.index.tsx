import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckSquare,
  Eye,
  Facebook,
  FileText,
  Globe,
  ImagePlus,
  LayoutGrid,
  List,
  MessageSquare,
  Package,
  Pin,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Square,
  Store,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { PageHeader, StatCard, Card, Pill } from "@/components/dashboard/PageKit";
import {
  EmptyState,
  NoSearchResult,
  ErrorState,
  ListSkeleton,
} from "@/components/dashboard/StateKit";
import { useFmt, useT, type TKey } from "@/lib/i18n";
import { useServerData } from "@/hooks/use-server-data";
import { useTableControls } from "@/hooks/use-table-controls";
import { Pagination } from "@/components/dashboard/DataTablePagination";
import {
  CATEGORIES,
  getSeller,
  type Product,
  type ProductCategoryKey,
  type ProductStatus,
} from "@/lib/marketplace-data";
import {
  listProductsFn,
  createProductFn,
  updateProductFn,
  deleteProductFn,
  deleteProductsFn,
  toggleSoldFn,
} from "@/lib/marketplace.functions";
import { CURRENT_USER_ID } from "@/lib/networking-data";
import { uploadProductMedia, signProductMediaPreview } from "@/lib/upload-media";
import { formatCurrencyInput, parseCurrencyInput, formatDisplayDate } from "@/lib/date-format";
import { resolveMediaUrl } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/marketplace/")({
  // NOTE: listProductsFn is auth-gated (requireSupabaseAuth). This is a public
  // (non-_authenticated) route, so calling it in the loader would 401 during
  // SSR/prerender. Data is fetched client-side after the session is available.
  component: MarketplacePage,
});

function MarketplacePage() {
  const listProducts = useServerFn(listProductsFn);
  const { data, loading, error, reload } = useServerData<Product[]>(() => listProducts(), []);

  if (loading && data.length === 0) {
    return (
      <AppShell>
        <div className="p-2">
          <ListSkeleton rows={6} />
        </div>
      </AppShell>
    );
  }
  if (error) {
    return (
      <AppShell>
        <ErrorState onRetry={reload} />
      </AppShell>
    );
  }
  return <MarketplaceContent all={data} reload={reload} />;
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

const PIN_STORAGE_KEY = "vba.mk.pinned";

type Sort = "newest" | "viewed" | "priceHigh" | "priceLow";

function sortProducts(list: Product[], sort: Sort): Product[] {
  const arr = [...list];
  switch (sort) {
    case "viewed":
      return arr.sort((a, b) => b.views - a.views);
    case "priceHigh":
      return arr.sort((a, b) => b.price - a.price);
    case "priceLow":
      return arr.sort((a, b) => a.price - b.price);
    case "newest":
    default:
      return arr.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      });
  }
}

const SORT_KEYS: { key: Sort; label: TKey }[] = [
  { key: "newest", label: "mk.sort.newest" },
  { key: "viewed", label: "mk.sort.viewed" },
  { key: "priceHigh", label: "mk.sort.priceHigh" },
  { key: "priceLow", label: "mk.sort.priceLow" },
];

const ICON_OPTIONS = ["🛍️", "💼", "💻", "📊", "🏢", "⚙️", "🌾", "📦", "🎯", "🚀", "🤝", "📱"];

function ProductCard({
  product,
  onContact,
  onQuote,
  onEdit,
  onDelete,
  onToggleSold,
  selectable,
  selected,
  onToggleSelect,
  pinned,
  onTogglePin,
}: {
  product: Product;
  onContact: () => void;
  onQuote: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleSold: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  pinned?: boolean;
  onTogglePin?: () => void;
}) {
  const t = useT();

  const fmt = useFmt();
  const seller = getSeller(product.sellerId);
  const isMine = product.sellerId === CURRENT_USER_ID;

  return (
    <Card className={`flex flex-col overflow-hidden ${selected ? "ring-2 ring-destructive" : ""}`}>
      <Link
        to="/marketplace/$productId"
        params={{ productId: product.id }}
        className="relative flex h-32 items-center justify-center overflow-hidden text-5xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-secondary/30"
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
        {selectable && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSelect?.();
            }}
            aria-pressed={!!selected}
            className="absolute left-2 top-2 rounded-md bg-background/80 p-1 text-foreground backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t("mk.select")}
          >
            {selected ? (
              <CheckSquare className="h-5 w-5 text-destructive" aria-hidden="true" />
            ) : (
              <Square className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        )}
        {onTogglePin && !selectable && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTogglePin();
            }}
            aria-pressed={!!pinned}
            aria-label={t(pinned ? "mk.unpin" : "mk.pin")}
            className="absolute left-2 top-2 rounded-md bg-background/80 p-1 text-foreground backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Pin
              className={`h-4 w-4 ${pinned ? "fill-primary text-primary" : ""}`}
              aria-hidden="true"
            />
          </button>
        )}
        <div className="absolute right-2 top-2">
          <Pill color={STATUS_COLOR[product.status]}>{t(STATUS_KEY[product.status])}</Pill>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          <Pill color="primary">{t(product.category)}</Pill>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Eye className="h-3 w-3" aria-hidden="true" />
            {fmt.num(product.views)} {t("mk.views")}
          </span>
        </div>
        <Link
          to="/marketplace/$productId"
          params={{ productId: product.id }}
          className="mb-1 line-clamp-2 text-sm font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {product.title}
        </Link>
        <p className="mb-3 line-clamp-2 flex-1 text-xs text-muted-foreground">
          {product.description}
        </p>
        <div className="mb-3 flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-bold text-foreground">
            {fmt.money(product.price)}
            {product.unit && <span className="text-xs font-normal text-muted-foreground ml-1">/ {product.unit}</span>}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-muted-foreground line-through">
              {fmt.money(product.originalPrice)}
            </span>
          )}
        </div>
        <div className="mb-3 border-t border-border pt-3 text-[11px] text-muted-foreground flex items-center justify-between">
          <div className="truncate">
            <span className="font-semibold text-primary">Người đăng: </span>
            <span className="font-medium text-foreground">{product.sellerName || product.company || seller?.name || "Hội viên CLB"}</span>
            {product.company && product.sellerName && <span className="opacity-70"> ({product.company})</span>}
          </div>
          <span className="shrink-0 text-[10.5px] opacity-75">{fmt.date(product.createdAt)}</span>
        </div>
        {isMine ? (
          <div className="flex gap-2">
            <button
              onClick={onToggleSold}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {product.status === "sold" ? t("mk.action.markActive") : t("mk.action.markSold")}
            </button>
            <button
              onClick={onEdit}
              aria-label={t("mk.action.edit")}
              className="rounded-lg border border-border px-3 py-2 text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              onClick={onDelete}
              aria-label={t("mk.action.delete")}
              className="rounded-lg border border-destructive/30 px-3 py-2 text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="flex flex-1 gap-2">
            <button
              onClick={onEdit}
              title="Chỉnh sửa sản phẩm"
              aria-label={t("mk.action.edit")}
              className="rounded-lg border border-border px-3 py-2 text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              onClick={onQuote}
              disabled={product.status !== "active"}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              style={{ background: "var(--gradient-primary)" }}
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              {t("mk.detail.quoteBtn")}
            </button>
            <button
              onClick={onContact}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              {t("mk.action.contact")}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

function ProductRow({
  product,
  onContact,
  onQuote,
  onEdit,
  onDelete,
  onToggleSold,
  pinned,
  onTogglePin,
}: {
  product: Product;
  onContact: () => void;
  onQuote: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleSold: () => void;
  pinned?: boolean;
  onTogglePin?: () => void;
}) {
  const t = useT();
  const fmt = useFmt();
  const seller = getSeller(product.sellerId);
  const isMine = product.sellerId === CURRENT_USER_ID;

  return (
    <Card className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
      <Link
        to="/marketplace/$productId"
        params={{ productId: product.id }}
        className="relative flex h-14 w-14 shrink-0 overflow-hidden items-center justify-center rounded-xl text-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-secondary/30"
        style={{ background: "var(--gradient-card)" }}
        aria-hidden="true"
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
        <span aria-hidden="true" className="relative z-10">{product.emoji}</span>
      </Link>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Pill color="primary">{t(product.category)}</Pill>
          <Pill color={STATUS_COLOR[product.status]}>{t(STATUS_KEY[product.status])}</Pill>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Eye className="h-3 w-3" aria-hidden="true" />
            {fmt.num(product.views)} {t("mk.views")}
          </span>
        </div>
        <Link
          to="/marketplace/$productId"
          params={{ productId: product.id }}
          className="line-clamp-1 text-sm font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {product.title}
        </Link>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">{product.sellerName || product.company || seller?.name || "Hội viên"}</span>
          <span className="opacity-50"> • </span>
          {fmt.date(product.createdAt)}
        </div>
      </div>
      <div className="shrink-0 text-right text-sm font-bold text-foreground sm:w-36">
        <div>
          {fmt.money(product.price)}
          {product.unit && <span className="text-xs font-normal text-muted-foreground ml-1">/ {product.unit}</span>}
        </div>
        {product.originalPrice && product.originalPrice > product.price && (
          <div className="text-xs text-muted-foreground line-through font-normal">{fmt.money(product.originalPrice)}</div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {onTogglePin && (
          <button
            onClick={onTogglePin}
            aria-pressed={!!pinned}
            aria-label={t(pinned ? "mk.unpin" : "mk.pin")}
            className="rounded-lg border border-border p-2 text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Pin
              className={`h-3.5 w-3.5 ${pinned ? "fill-primary text-primary" : ""}`}
              aria-hidden="true"
            />
          </button>
        )}
        {isMine ? (
          <>
            <button
              onClick={onToggleSold}
              className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {product.status === "sold" ? t("mk.action.markActive") : t("mk.action.markSold")}
            </button>
            <button
              onClick={onEdit}
              aria-label={t("mk.action.edit")}
              className="rounded-lg border border-border p-2 text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              onClick={onDelete}
              aria-label={t("mk.action.delete")}
              className="rounded-lg border border-destructive/30 p-2 text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onEdit}
              title="Chỉnh sửa sản phẩm"
              aria-label={t("mk.action.edit")}
              className="rounded-lg border border-border p-2 text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              onClick={onQuote}
              disabled={product.status !== "active"}
              aria-label={t("mk.detail.quoteBtn")}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              style={{ background: "var(--gradient-primary)" }}
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t("mk.detail.quoteBtn")}</span>
            </button>
          </>
        )}
      </div>
    </Card>
  );
}

function ProductModal({
  product,
  onClose,
  onSaved,
}: {
  product?: Product;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const { user } = useAuth();
  const isEdit = !!product;
  const createFn = useServerFn(createProductFn);
  const updateFn = useServerFn(updateProductFn);
  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price ? formatCurrencyInput(product.price) : "");
  const [originalPrice, setOriginalPrice] = useState(product?.originalPrice ? formatCurrencyInput(product.originalPrice) : "");
  const [unit, setUnit] = useState(product?.unit ?? "");
  const [company, setCompany] = useState(product?.company ?? "");
  const [sellerName, setSellerName] = useState(product?.sellerName ?? (user?.user_metadata?.full_name || ""));
  const [sellerPhone, setSellerPhone] = useState(
    product?.sellerPhone ??
      ((user as any)?.phone || (user?.username && /^\d+$/.test(user.username) ? user.username : "")),
  );
  const [category, setCategory] = useState<ProductCategoryKey>(
    product?.category ?? "mk.cat.service",
  );
  const [emoji, setEmoji] = useState(product?.emoji ?? "🛍️");
  const initialImages = useMemo(() => {
    if (product?.imageUrls && product.imageUrls.length > 0) return product.imageUrls;
    const fallback = (product as any)?.imageUrl || (product as any)?.image || (product as any)?.image_url;
    return fallback ? [fallback] : [];
  }, [product]);
  const [imageUrls, setImageUrls] = useState<string[]>(initialImages);
  const [pdfUrl, setPdfUrl] = useState(product?.pdfUrl ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(product?.websiteUrl ?? "");
  const [facebookUrl, setFacebookUrl] = useState(product?.facebookUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  // Maps a stored value (bucket path) → short-lived signed URL for preview.
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const previewOf = (v: string) => previews[v] || resolveMediaUrl(v) || v;

  const activeSellerId = product?.sellerId || user?.id || CURRENT_USER_ID || "00000000-0000-4000-8000-000000000002";

  const handleImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const remaining = 10 - imageUrls.length;
      const picked = Array.from(files).slice(0, Math.max(0, remaining));
      const paths = await Promise.all(picked.map((f) => uploadProductMedia(f, activeSellerId)));
      const signed = await Promise.all(paths.map((p) => signProductMediaPreview(p)));
      setPreviews((prev) => {
        const next = { ...prev };
        paths.forEach((p, i) => (next[p] = signed[i]));
        return next;
      });
      setImageUrls((prev) => [...prev, ...paths]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handlePdf = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadProductMedia(file, activeSellerId);
      const signed = await signProductMediaPreview(path);
      setPreviews((prev) => ({ ...prev, [path]: signed }));
      setPdfUrl(path);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    const numPrice = parseCurrencyInput(price);
    if (!title.trim() || !description.trim() || !numPrice) {
      toast.error("Vui lòng nhập tên sản phẩm, mô tả và giá sản phẩm");
      return;
    }
    const numOrig = originalPrice ? parseCurrencyInput(originalPrice) : undefined;
    setBusy(true);
    try {
      const extra = {
        originalPrice: numOrig,
        memberPrice: numPrice,
        unit: unit.trim() || undefined,
        company: company.trim() || undefined,
        sellerName: sellerName.trim() || undefined,
        sellerPhone: sellerPhone.trim() || undefined,
        imageUrls,
        imageUrl: imageUrls[0] || undefined,
        pdfUrl: pdfUrl || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        facebookUrl: facebookUrl.trim() || undefined,
      };
      if (isEdit) {
        await updateFn({
          data: {
            id: product!.id,
            sellerId: activeSellerId,
            title,
            description,
            price: numPrice,
            category,
            emoji,
            ...extra,
          },
        });
        toast.success(t("mk.form.updated"));
      } else {
        await createFn({
          data: {
            sellerId: activeSellerId,
            title,
            description,
            price: numPrice,
            category,
            emoji,
            ...extra,
          },
        });
        toast.success(t("mk.form.created"));
      }
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi khi lưu sản phẩm");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">
            {t(isEdit ? "mk.form.editTitle" : "mk.form.title")}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="-mr-2 space-y-3 overflow-y-auto pr-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">
              {t("mk.form.titleField")} <span className="text-destructive">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("mk.form.titlePh")}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">
              {t("mk.form.desc")} <span className="text-destructive">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("mk.form.descPh")}
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Doanh nghiệp / Tổ chức
              </label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="VD: ViConnect Group"
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Đơn vị tính
              </label>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="VD: Cái, Hộp, Gói, Buổi, Tháng..."
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Người liên hệ / Đại diện bán
              </label>
              <input
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="VD: Nguyễn Văn A"
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Số điện thoại liên hệ
              </label>
              <input
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                placeholder="VD: 0912345678"
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Giá ưu đãi (VND) <span className="text-destructive">*</span>
              </label>
              <input
                value={price}
                onChange={(e) => setPrice(formatCurrencyInput(e.target.value))}
                placeholder="VD: 10.000.000"
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring font-mono"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Giá niêm yết (VND)
              </label>
              <input
                value={originalPrice}
                onChange={(e) => setOriginalPrice(formatCurrencyInput(e.target.value))}
                placeholder="VD: 12.000.000"
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring font-mono"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                {t("mk.form.cat")}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategoryKey)}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              >
                {CATEGORIES.map((c: any) => (
                  <option key={c} value={c}>
                    {t(c)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">
              {t("mk.form.icon")}
            </label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setEmoji(ic)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xl transition ${
                    emoji === ic
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Showcase images */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">
              {t("mk.form.images")}
            </label>
            <div className="flex flex-wrap gap-2">
              {imageUrls.map((url) => (
                <div
                  key={url}
                  className="group relative h-16 w-16 overflow-hidden rounded-lg border border-border bg-secondary/40"
                >
                  <img
                    src={previewOf(url)}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.opacity = "0.4";
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setImageUrls((p) => p.filter((u) => u !== url))}
                    className="absolute right-0.5 top-0.5 rounded bg-foreground/60 p-0.5 text-primary-foreground opacity-0 transition group-hover:opacity-100"
                    aria-label={t("mk.form.remove")}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {imageUrls.length < 10 && (
                <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground hover:bg-secondary">
                  <ImagePlus className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImages(e.target.files)}
                  />
                </label>
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{t("mk.form.imagesHint")}</p>
          </div>

          {/* PDF */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">
              {t("mk.form.pdf")}
            </label>
            {pdfUrl ? (
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <FileText className="h-4 w-4 text-primary" />
                <a
                  href={previewOf(pdfUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate text-primary hover:underline"
                >
                  {t("mk.form.viewPdf")}
                </a>
                <button
                  type="button"
                  onClick={() => setPdfUrl("")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary">
                <Upload className="h-4 w-4" />
                {t("mk.form.pdfHint")}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handlePdf(e.target.files)}
                />
              </label>
            )}
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-foreground">
                <Globe className="h-3.5 w-3.5" /> {t("mk.form.website")}
              </label>
              <input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://"
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-foreground">
                <Facebook className="h-3.5 w-3.5" /> {t("mk.form.facebook")}
              </label>
              <input
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/"
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {uploading && <p className="text-xs text-muted-foreground">{t("mk.form.uploading")}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
          >
            {t("mk.form.cancel")}
          </button>
          <button
            onClick={submit}
            disabled={busy || uploading || !title.trim() || !description.trim() || !price}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-50"
            style={{ background: "var(--gradient-primary)" }}
          >
            {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {t(isEdit ? "mk.form.save" : "mk.form.submit")}
          </button>
        </div>
      </Card>
    </div>
  );
}

type ProductActions = {
  onContact: () => void;
  onQuote: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleSold: () => void;
};

function DiscoverySection({
  title,
  products,
  pinned,
  onTogglePin,
  bind,
}: {
  title: string;
  products: Product[];
  pinned: Set<string>;
  onTogglePin: (id: string) => void;
  bind: (p: Product) => ProductActions;
}) {
  if (products.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            pinned={pinned.has(p.id)}
            onTogglePin={() => onTogglePin(p.id)}
            {...bind(p)}
          />
        ))}
      </div>
    </section>
  );
}

function MarketplaceContent({ all, reload }: { all: Product[]; reload: () => void }) {
  const { user } = useAuth();
  const t = useT();
  const fmt = useFmt();
  const navigate = useNavigate();
  const deleteFn = useServerFn(deleteProductFn);
  const bulkDeleteFn = useServerFn(deleteProductsFn);
  const toggleFn = useServerFn(toggleSoldFn);

  const [tab, setTab] = useState<"browse" | "mine">("browse");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<ProductCategoryKey | "all">("all");
  const [view, setView] = useState<"card" | "list">("card");
  const [sort, setSort] = useState<Sort>("newest");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkPending, setBulkPending] = useState(false);

  // Pinned listings persist locally (client-only preference, no backend).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PIN_STORAGE_KEY);
      if (raw) setPinned(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* ignore */
    }
  }, []);

  const togglePin = (id: string) =>
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const exitSelect = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const isMyProduct = (p: Product) => {
    if (user?.id && (p.sellerId === user.id || (p as any).seller_id === user.id)) return true;
    if (user?.email && p.sellerPhone === user.email) return true;
    if (user?.user_metadata?.full_name && p.sellerName === user.user_metadata.full_name) return true;
    return p.sellerId === CURRENT_USER_ID;
  };
  const mine = all.filter(isMyProduct);
  const active = all.filter((p) => p.status === "active");

  const hasFilters = cat !== "all" || query.trim() !== "" || pinnedOnly || sort !== "newest";

  const visible = useMemo(() => {
    let list = tab === "mine" ? mine : all;
    if (cat !== "all") list = list.filter((p) => p.category === cat);
    if (pinnedOnly) list = list.filter((p) => pinned.has(p.id));
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.sellerName?.toLowerCase().includes(q) ?? false) ||
          (p.company?.toLowerCase().includes(q) ?? false) ||
          (getSeller(p.sellerId)?.name.toLowerCase().includes(q) ?? false),
      );
    }
    return sortProducts(list, sort);
  }, [tab, cat, query, all, mine, sort, pinnedOnly, pinned]);

  const accessors = useMemo(
    () => ({
      title: (p: Product) => p.title,
      category: (p: Product) => p.category,
      price: (p: Product) => p.price,
      views: (p: Product) => p.views,
      status: (p: Product) => p.status,
      createdAt: (p: Product) => p.createdAt,
    }),
    [],
  );

  const tc = useTableControls(visible, accessors, {
    initialPageSize: 12,
    initialSortKey: "createdAt",
    initialSortDir: "desc",
  });

  // Discovery sections show only on the browse tab with no active filters.
  const browsePool = useMemo(() => all.filter((p) => p.sellerId !== CURRENT_USER_ID), [all]);
  const showDiscovery = tab === "browse" && !hasFilters;
  const featured = useMemo(
    () =>
      sortProducts(
        browsePool.filter((p) => p.status === "active"),
        "viewed",
      ).slice(0, 4),
    [browsePool],
  );
  const recent = useMemo(() => sortProducts(browsePool, "newest").slice(0, 4), [browsePool]);
  const popular = useMemo(() => sortProducts(browsePool, "viewed").slice(0, 4), [browsePool]);

  const totalValue = active.reduce((s, p) => s + p.price, 0);

  const bindCardActions = (p: Product) => ({
    onContact: () => navigate({ to: "/marketplace/$productId", params: { productId: p.id } }),
    onQuote: () =>
      navigate({
        to: "/marketplace/$productId",
        params: { productId: p.id },
        search: { quote: true },
      }),
    onEdit: () => setEditing(p),
    onDelete: () => setDeleting(p),
    onToggleSold: async () => {
      await toggleFn({ data: { id: p.id, sellerId: CURRENT_USER_ID } });
      reload();
    },
  });

  return (
    <AppShell>
      <PageHeader
        title={t("mk.title")}
        subtitle={t("mk.subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/marketplace/workspace"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              <Store className="h-4 w-4" />
              {t("mk.ws.nav")}
            </Link>
            <Link
              to="/marketplace/my-quotes"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              <FileText className="h-4 w-4" />
              {t("mk.myq.nav")}
            </Link>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Plus className="h-4 w-4" />
              {t("mk.action.new")}
            </button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t("mk.kpi.total")}
          value={fmt.num(all.length)}
          tone="primary"
          icon={<Store className="h-4 w-4" />}
        />
        <StatCard
          label={t("mk.kpi.active")}
          value={fmt.num(active.length)}
          tone="success"
          icon={<ShoppingBag className="h-4 w-4" />}
        />
        <StatCard
          label={t("mk.kpi.mine")}
          value={fmt.num(mine.length)}
          tone="info"
          icon={<Package className="h-4 w-4" />}
        />
        <StatCard
          label={t("mk.kpi.value")}
          value={fmt.money(totalValue)}
          tone="warning"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2 border-b border-border">
        {(["browse", "mine"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
              tab === k
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(k === "browse" ? "mk.tab.browse" : "mk.tab.mine")}
            {k === "mine" && mine.length > 0 && (
              <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground">
                {mine.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "mine" && mine.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {!selectMode ? (
            <button
              onClick={() => setSelectMode(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              {t("mk.select")}
            </button>
          ) : (
            <>
              <span className="text-xs font-semibold text-foreground">
                {t("mk.selectedCount", { n: selected.size })}
              </span>
              <button
                onClick={() => setSelected(new Set(visible.map((p) => p.id)))}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
              >
                {t("mk.selectAll")}
              </button>
              <button
                onClick={() => setSelected(new Set())}
                disabled={selected.size === 0}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
              >
                {t("mk.clearSel")}
              </button>
              <button
                onClick={() => setBulkConfirm(true)}
                disabled={selected.size === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t("mk.deleteSelected")}
              </button>
              <button
                onClick={exitSelect}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
              >
                {t("mk.selectDone")}
              </button>
            </>
          )}
        </div>
      )}

      <div className="sm:sticky sm:top-18 z-20 -mx-4 mb-4 space-y-3 bg-background/90 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-[var(--shadow-card)]">
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("mk.search")}
              aria-label={t("mk.search")}
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="mk-sort">
              {t("mk.sort.label")}
            </label>
            <select
              id="mk-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {SORT_KEYS.map((s) => (
                <option key={s.key} value={s.key}>
                  {t(s.label)}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
              <button
                onClick={() => setView("card")}
                aria-pressed={view === "card"}
                aria-label={t("mk.view.card")}
                className={`rounded-md p-1.5 transition ${
                  view === "card"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
              >
                <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
                aria-label={t("mk.view.list")}
                className={`rounded-md p-1.5 transition ${
                  view === "list"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
              >
                <List className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCat("all")}
            aria-pressed={cat === "all"}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              cat === "all"
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {t("mk.filter.all")}
          </button>
          {CATEGORIES.map((c: any) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              aria-pressed={cat === c}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                cat === c
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {t(c)}
            </button>
          ))}
          <button
            onClick={() => setPinnedOnly((v) => !v)}
            aria-pressed={pinnedOnly}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              pinnedOnly
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Pin className="h-3 w-3" aria-hidden="true" />
            {pinned.size > 0
              ? t("mk.filter.pinnedCount", { n: pinned.size })
              : t("mk.filter.pinned")}
          </button>
        </div>
      </div>

      {showDiscovery && browsePool.length > 0 && (
        <div className="mb-8 space-y-8">
          <DiscoverySection
            title={t("mk.section.featured")}
            products={featured}
            pinned={pinned}
            onTogglePin={togglePin}
            bind={bindCardActions}
          />
          <DiscoverySection
            title={t("mk.section.recent")}
            products={recent}
            pinned={pinned}
            onTogglePin={togglePin}
            bind={bindCardActions}
          />
          <DiscoverySection
            title={t("mk.section.popular")}
            products={popular}
            pinned={pinned}
            onTogglePin={togglePin}
            bind={bindCardActions}
          />
        </div>
      )}

      {(!showDiscovery || browsePool.length === 0) && (
        <>
          <p className="mb-3 text-xs font-medium text-muted-foreground" aria-live="polite">
            {t("mk.results", { n: visible.length })}
          </p>
          {visible.length === 0 ? (
            query.trim() || pinnedOnly || cat !== "all" ? (
              <NoSearchResult />
            ) : (
              <EmptyState
                title={t(tab === "mine" ? "mk.empty.mine" : "mk.empty.browse")}
                icon={<Store className="h-6 w-6" />}
              />
            )
          ) : view === "list" ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
              <div className="overflow-x-auto relative">
                <table className="w-full text-sm border-separate border-spacing-0">
                  <thead>
                    <tr className="border-b border-border bg-secondary/80 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      <th className="sticky left-0 z-20 w-[56px] min-w-[56px] max-w-[56px] bg-secondary px-3 py-3 text-center border-r border-b border-border">
                        STT
                      </th>
                      <th className="sticky left-[56px] z-20 min-w-[100px] bg-secondary px-4 py-3 border-r border-b border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                        Mã
                      </th>
                      <th className="px-4 py-3 border-b border-border">Sản phẩm / Dịch vụ</th>
                      <th className="px-4 py-3 border-b border-border">Danh mục</th>
                      <th className="px-4 py-3 border-b border-border text-right">Giá niêm yết</th>
                      <th className="px-4 py-3 border-b border-border">Người đăng</th>
                      <th className="px-4 py-3 border-b border-border">Trạng thái</th>
                      <th className="sticky right-0 z-20 min-w-[140px] bg-secondary px-4 py-3 text-right border-l border-b border-border shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)]">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tc.pageRows.map((p, idx) => {
                      const seller = getSeller(p.sellerId);
                      const isMine = p.sellerId === CURRENT_USER_ID;
                      return (
                        <tr
                          key={p.id}
                          className="group border-b border-border transition-all duration-150 hover:bg-secondary/60 cursor-pointer"
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest("a,button,input")) return;
                            navigate({ to: "/marketplace/$productId", params: { productId: p.id } });
                          }}
                        >
                          <td className="sticky left-0 z-10 w-[56px] min-w-[56px] max-w-[56px] bg-card group-hover:bg-muted/70 px-3 py-3 text-center text-xs font-medium text-muted-foreground border-r border-b border-border transition-colors">
                            {(tc.page - 1) * tc.pageSize + idx + 1}
                          </td>
                          <td className="sticky left-[56px] z-10 min-w-[100px] bg-card group-hover:bg-muted/70 px-4 py-3 font-mono text-[12px] font-semibold text-primary border-r border-b border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)] transition-colors">
                            SP-{p.id.slice(0, 6).toUpperCase()}
                          </td>
                          <td className="px-4 py-3 border-b border-border">
                            <div className="flex items-center gap-3">
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-secondary/40 flex items-center justify-center text-lg">
                                {(() => {
                                  const imgUrl = (p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls[0] : null) || (p as any).imageUrl;
                                  const resolved = resolveMediaUrl(imgUrl);
                                  if (resolved) {
                                    return (
                                      <img
                                        src={resolved}
                                        alt={p.title}
                                        className="absolute inset-0 h-full w-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLElement).style.display = "none";
                                        }}
                                      />
                                    );
                                  }
                                  return null;
                                })()}
                                <span className="relative z-10">{p.emoji || "🛍️"}</span>
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-foreground text-xs line-clamp-1">{p.title}</div>
                                <div className="text-[11px] text-muted-foreground line-clamp-1">{p.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs border-b border-border">
                            <Pill color="primary">{t(p.category)}</Pill>
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-foreground text-right border-b border-border font-mono">
                            <div>{fmt.money(p.price)}</div>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <div className="text-[11px] text-muted-foreground line-through font-normal">{fmt.money(p.originalPrice)}</div>
                            )}
                            {p.unit && <div className="text-[10px] text-muted-foreground font-normal">/ {p.unit}</div>}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground border-b border-border">
                            <div className="font-medium text-foreground">{p.sellerName || p.company || seller?.name || "Thành viên"}</div>
                            {p.sellerPhone && <div className="text-[11px] text-primary">{p.sellerPhone}</div>}
                            <div className="text-[10px] text-muted-foreground/70">{fmt.date(p.createdAt)}</div>
                          </td>
                          <td className="px-4 py-3 border-b border-border">
                            <Pill color={STATUS_COLOR[p.status]}>{t(STATUS_KEY[p.status])}</Pill>
                          </td>
                          <td className="sticky right-0 z-10 min-w-[140px] bg-card group-hover:bg-muted/70 px-4 py-3 text-right border-l border-b border-border shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)] transition-colors">
                            <div className="inline-flex items-center justify-end gap-1">
                              <Link
                                to="/marketplace/$productId"
                                params={{ productId: p.id }}
                                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                              <button
                                onClick={() => setEditing(p)}
                                title="Chỉnh sửa sản phẩm"
                                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              {isMine ? (
                                <button
                                  onClick={() => setDeleting(p)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-destructive/20 bg-background px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    navigate({
                                      to: "/marketplace/$productId",
                                      params: { productId: p.id },
                                      search: { quote: true },
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
                                  style={{ background: "var(--gradient-primary)" }}
                                >
                                  <FileText className="h-3.5 w-3.5" /> Báo giá
                                </button>
                              )}
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
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tc.pageRows.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    selectable={tab === "mine" && selectMode}
                    selected={selected.has(p.id)}
                    onToggleSelect={() => toggleSelect(p.id)}
                    pinned={pinned.has(p.id)}
                    onTogglePin={() => togglePin(p.id)}
                    {...bindCardActions(p)}
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
          )}
        </>
      )}

      {showModal && <ProductModal onClose={() => setShowModal(false)} onSaved={reload} />}
      {editing && (
        <ProductModal product={editing} onClose={() => setEditing(null)} onSaved={reload} />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("mk.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? `${deleting.emoji} ${deleting.title}` : ""}
              <br />
              {t("mk.delete.desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>{t("mk.delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deletePending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async (e) => {
                e.preventDefault();
                if (!deleting) return;
                setDeletePending(true);
                try {
                  await deleteFn({ data: { id: deleting.id, sellerId: CURRENT_USER_ID } });
                  toast.success(t("mk.deleted"));
                  setDeleting(null);
                  reload();
                } finally {
                  setDeletePending(false);
                }
              }}
            >
              {t("mk.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkConfirm} onOpenChange={(o) => !o && setBulkConfirm(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("mk.bulkDelete.title", { n: selected.size })}</AlertDialogTitle>
            <AlertDialogDescription>{t("mk.bulkDelete.desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkPending}>{t("mk.delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={bulkPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async (e) => {
                e.preventDefault();
                const ids = [...selected];
                if (!ids.length) return;
                setBulkPending(true);
                try {
                  await bulkDeleteFn({ data: { ids, sellerId: CURRENT_USER_ID } });
                  toast.success(t("mk.bulkDeleted", { n: ids.length }));
                  setBulkConfirm(false);
                  exitSelect();
                  reload();
                } finally {
                  setBulkPending(false);
                }
              }}
            >
              {t("mk.deleteSelected")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
