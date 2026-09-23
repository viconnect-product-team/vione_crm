import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Eye,
  Plus,
  FileText,
  Heart,
  ImagePlus,
  Trash2,
  X,
  PackageCheck,
  Building2,
  Phone,
  Send,
  CheckCircle2,
  Calendar,
  Pencil,
  MoreVertical,
  Store,
  BadgeCheck,
  Globe,
  Users,
  LayoutGrid,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Flame,
  Award,
  Sparkles,
  Check,
  MessageSquare,
  ShoppingCart,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Share2,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { exportProductsToExcel, type ParsedProductItem } from "@/lib/marketplace-excel";
import { ProductExcelModal } from "@/components/dashboard/ProductExcelModal";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import { listMyProducts, requestQuote, getMyMember, type MyProduct, type MyMember } from "@/lib/member-app.functions";
import { fetchNestApi, resolveMediaUrl } from "@/lib/api-client";
import { useT, useFmt, useLang } from "@/lib/i18n";
import { useAuth } from "@/context/AuthContext";

function normalizeCategory(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/&/g, "va")
    .replace(/[^a-z0-9]/g, "");
}

function matchCategory(productCat: string, filterCat: string): boolean {
  if (!productCat || !filterCat) return false;
  const pNorm = normalizeCategory(productCat);
  const fNorm = normalizeCategory(filterCat);
  if (pNorm.includes(fNorm) || fNorm.includes(pNorm)) return true;

  const CATEGORY_MAP: Record<string, string[]> = {
    tech: ["congnghe", "phanmem", "it", "tech", "technology", "software"],
    realestate: ["batdongsan", "xaydung", "realestate", "property", "construction"],
    manufacturing: ["sanxuat", "congnghiep", "manufacturing", "industry", "production"],
    finance: ["taichinh", "dautu", "finance", "investment", "banking"],
    services: ["dichvu", "dulich", "service", "services", "tourism", "hospitality"],
    retail: ["hangtieudung", "banle", "retail", "consumer", "fmcg", "commerce", "trade"],
  };

  for (const group of Object.values(CATEGORY_MAP)) {
    const matchesFilter = group.some((keyword) => fNorm.includes(keyword) || keyword.includes(fNorm));
    const matchesProduct = group.some((keyword) => pNorm.includes(keyword) || keyword.includes(pNorm));
    if (matchesFilter && matchesProduct) return true;
  }
  return false;
}

function formatCurrencyInput(val: string): string {
  const digits = val.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("vi-VN");
}

function formatSmartProductPrice(rawPrice: string | number | undefined | null): string {
  if (!rawPrice) return "Liên hệ";
  if (typeof rawPrice === "string") {
    if (rawPrice.includes("Tỷ") || rawPrice.includes("Tr") || rawPrice.toLowerCase().includes("thương lượng") || rawPrice.toLowerCase().includes("liên hệ")) {
      return rawPrice;
    }
  }
  const num = typeof rawPrice === "number" ? rawPrice : Number(String(rawPrice).replace(/\D/g, ""));
  if (isNaN(num) || num <= 0) return typeof rawPrice === "string" && rawPrice.trim() ? rawPrice : "Liên hệ";
  if (num >= 1_000_000_000) {
    const billions = num / 1_000_000_000;
    return `${billions % 1 === 0 ? billions : billions.toFixed(1).replace(".0", "")} Tỷ đ`;
  }
  if (num >= 1_000_000) {
    const millions = num / 1_000_000;
    return `${millions % 1 === 0 ? millions : millions.toFixed(1).replace(".0", "")} Tr đ`;
  }
  return `${num.toLocaleString("vi-VN")} đ`;
}

async function compressImage(file: File, maxWidth = 1024, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } else {
          resolve((e.target?.result as string) || "");
        }
      };
      img.onerror = () => resolve((e.target?.result as string) || "");
      img.src = (e.target?.result as string) || "";
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

export const Route = createFileRoute("/association/products")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      action: (search.action as string) || undefined,
    };
  },
  component: ProductsScreen,
});

function ProductsScreen() {
  const t = useT();
  const fmt = useFmt();
  const { lang } = useLang();
  const isEn = lang === "en";
  const search = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchProducts = useServerFn(listMyProducts);
  const doQuote = useServerFn(requestQuote);
  const fetchMember = useServerFn(getMyMember);
  const { data: initialProducts, loading, reload } = useServerData<MyProduct[]>(() => fetchProducts(), []);
  const { data: member } = useServerData<MyMember | null>(() => fetchMember(), null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [postModalOpen, setPostModalOpen] = useState(() => search?.action === "create");
  const [editingProduct, setEditingProduct] = useState<MyProduct | null>(null);
  const [activeProductMenuId, setActiveProductMenuId] = useState<string | null>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (search?.action === "create") {
      setPostModalOpen(true);
    }
  }, [search?.action]);

  // Category & User-isolated Interested state (prevents new accounts from inheriting old favorites)
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const userStorageKey = `vba_interested_products_${(member as any)?.userId || (member as any)?.id || member?.code || "user"}`;
  const [interestedIds, setInterestedIds] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(userStorageKey);
      setInterestedIds(stored ? JSON.parse(stored) : []);
    } catch {
      setInterestedIds([]);
    }
  }, [userStorageKey]);

  const toggleInterest = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setInterestedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(userStorageKey, JSON.stringify(next));
      } catch {}
      toast.success(next.includes(id) ? (isEn ? "Added to interested list" : "Đã thêm vào danh mục Đã quan tâm") : (isEn ? "Removed from interested list" : "Đã bỏ khỏi danh mục Đã quan tâm"));
      return next;
    });
  };

  // Quote Request Modal state
  const [quoteProduct, setQuoteProduct] = useState<MyProduct | null>(null);
  const [quoteQty, setQuoteQty] = useState("1");
  const [quotePhone, setQuotePhone] = useState("0988 123 456");
  const [quoteNote, setQuoteNote] = useState("");
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);

  // Author/Admin Quotes Inspection state
  const [viewingQuotesProduct, setViewingQuotesProduct] = useState<MyProduct | null>(null);
  const [productQuotes, setProductQuotes] = useState<any[]>([]);
  const [loadingProductQuotes, setLoadingProductQuotes] = useState(false);

  const handleOpenQuoteModal = (p: MyProduct) => {
    setQuoteProduct(p);
    setQuoteQty("1");
    setQuoteNote("");
    if (member?.phone || (user as any)?.phone) {
      setQuotePhone(member?.phone || (user as any)?.phone);
    }
  };

  const handleOpenProductQuotes = async (p: MyProduct) => {
    setViewingQuotesProduct(p);
    setLoadingProductQuotes(true);
    try {
      const res = await fetchNestApi<any>(`/marketplace/products/${p.id}`);
      if (res && res.quotes) {
        setProductQuotes(Array.isArray(res.quotes) ? res.quotes : []);
      } else {
        setProductQuotes([]);
      }
    } catch {
      setProductQuotes([]);
    } finally {
      setLoadingProductQuotes(false);
    }
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteProduct) return;
    setQuoteSubmitting(true);
    try {
      await fetchNestApi(`/marketplace/quotes`, {
        method: "POST",
        body: JSON.stringify({
          productId: quoteProduct.id,
          quantity: parseInt(quoteQty, 10) || 1,
          phone: quotePhone,
          message: quoteNote || "Hội viên yêu cầu báo giá VIP",
        }),
      });
      toast.success(isEn ? "Quote request sent successfully!" : "Đã gửi yêu cầu báo giá thành công!");
      setQuoteProduct(null);
    } catch (err: any) {
      toast.error(err?.message || "Không thể gửi yêu cầu báo giá, vui lòng thử lại sau!");
    } finally {
      setQuoteSubmitting(false);
    }
  };

  // Company Storefront modal state
  const [viewingCompany, setViewingCompany] = useState<{
    name: string;
    avatarUrl?: string | null;
    bio?: string;
    industry?: string;
    phone?: string;
    website?: string;
  } | null>(null);
  const [companyCatFilter, setCompanyCatFilter] = useState<string>("all");
  const [wishlistCartOpen, setWishlistCartOpen] = useState(false);
  const [excelImportOpen, setExcelImportOpen] = useState(false);

  const handleImportExcelProducts = async (importedItems: ParsedProductItem[]) => {
    for (const item of importedItems) {
      const payload = {
        name: item.title,
        title: item.title,
        description: item.description || item.title,
        price: item.price,
        originalPrice: item.originalPrice || item.price,
        memberPrice: item.memberPrice || item.price,
        unit: item.unit || "Gói",
        currency: "VND",
        category: item.categoryName || "Dịch vụ",
        status: "active",
        imageUrl: item.imageUrl || null,
        imageUrls: item.imageUrl ? [item.imageUrl] : [],
        company: item.company || member?.title || "CLB Doanh Nhân CEO 1983",
        sellerId: user?.id || (member as any)?.userId || (member as any)?.id || "ceo1983",
      };
      try {
        await fetchNestApi("/products", { method: "POST", body: JSON.stringify(payload) });
      } catch {
        await fetchNestApi("/marketplace/products", { method: "POST", body: JSON.stringify(payload) }).catch(() => {});
      }
    }
    reload();
  };

  // Lock body scroll when modal is open to ensure 100% stable centering on mobile
  useEffect(() => {
    if (quoteProduct || postModalOpen || editingProduct || viewingCompany || viewingQuotesProduct || wishlistCartOpen || excelImportOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [quoteProduct, postModalOpen, editingProduct, viewingCompany, viewingQuotesProduct, wishlistCartOpen, excelImportOpen]);

  // Form states for posting product with full CRM pricing fields & Company storefront
  const [formPhoto, setFormPhoto] = useState("");
  const [formName, setFormName] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formCompanyIntro, setFormCompanyIntro] = useState("");
  const [formCompanySize, setFormCompanySize] = useState("10 - 50 nhân sự");
  const [formCategory, setFormCategory] = useState("Công nghệ & Phần mềm");
  const [formOriginalPrice, setFormOriginalPrice] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formUnit, setFormUnit] = useState("Gói");
  const [formCurrency, setFormCurrency] = useState("VND");
  const [formDesc, setFormDesc] = useState("");
  const [creatingProduct, setCreatingProduct] = useState(false);

  // Form states for editing product
  const [editPhoto, setEditPhoto] = useState("");
  const [editName, setEditName] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editCategory, setEditCategory] = useState("Công nghệ & Phần mềm");
  const [editOriginalPrice, setEditOriginalPrice] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editUnit, setEditUnit] = useState("Gói");
  const [editCurrency, setEditCurrency] = useState("VND");
  const [editDesc, setEditDesc] = useState("");
  const [updatingProduct, setUpdatingProduct] = useState(false);

  const isAdmin = Boolean(
    (user as any)?.role === "admin" ||
    (user as any)?.role === "platform_admin" ||
    (member as any)?.role === "admin" ||
    (member as any)?.role === "association_admin" ||
    (member as any)?.executiveRole
  );

  // Check if current user is the actual creator/author of this product
  const checkIsProductAuthor = (p: MyProduct) => {
    if (!member && !user) return false;
    const currentUserId = user?.id || (member as any)?.userId || (member as any)?.id;
    return Boolean(
      (currentUserId && p.sellerId && String(p.sellerId).toLowerCase() === String(currentUserId).toLowerCase()) ||
      ((member as any)?.userId && p.sellerId && String(p.sellerId).toLowerCase() === String((member as any).userId).toLowerCase()) ||
      ((member as any)?.id && p.sellerId && String(p.sellerId).toLowerCase() === String((member as any).id).toLowerCase()) ||
      (member?.code && p.sellerId && String(p.sellerId).toLowerCase() === String(member.code).toLowerCase()) ||
      (member?.name && p.sellerName && p.sellerName.toLowerCase().trim() === member.name.toLowerCase().trim()) ||
      ((user as any)?.name && p.sellerName && p.sellerName.toLowerCase().trim() === (user as any).name.toLowerCase().trim()) ||
      ((user as any)?.user_metadata?.full_name && p.sellerName && p.sellerName.toLowerCase().trim() === (user as any).user_metadata.full_name.toLowerCase().trim()) ||
      (member?.name && p.company && p.company.toLowerCase().trim() === member.name.toLowerCase().trim()) ||
      (member?.title && p.company && p.company.toLowerCase().trim() === member.title.toLowerCase().trim())
    );
  };

  const checkCanManageProduct = (p: MyProduct) => {
    return checkIsProductAuthor(p) || isAdmin;
  };

  const checkIsProductOwner = checkIsProductAuthor;

  const allProducts = useMemo(() => {
    const arr = [...(initialProducts || [])];
    arr.sort((a, b) => {
      const timeA = a.time ? new Date(a.time).getTime() : 0;
      const timeB = b.time ? new Date(b.time).getTime() : 0;
      return timeB - timeA;
    });
    return arr;
  }, [initialProducts]);

  const totalProducts = allProducts.length;
  const totalInterested = interestedIds.length;
  const totalViews = useMemo(() => {
    return allProducts.reduce((sum, p) => sum + (p.views || 1), 0);
  }, [allProducts]);

  const list = useMemo(() => {
    return allProducts.filter((p) => {
      const matchesSearch = !q || (p.name + p.company + p.category).toLowerCase().includes(q.toLowerCase());
      if (!matchesSearch) return false;
      if (selectedCategory === "all") return true;
      if (selectedCategory === "my_products") {
        return checkIsProductOwner(p);
      }
      if (selectedCategory === "interested") return interestedIds.includes(p.id);
      return matchCategory(p.category, selectedCategory);
    });
  }, [allProducts, q, selectedCategory, interestedIds, member]);

  const myProductsCount = useMemo(() => {
    return allProducts.filter((p) => checkIsProductOwner(p)).length;
  }, [allProducts, member]);

  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [sortMode, setSortMode] = useState<"newest" | "most_viewed" | "price_asc" | "price_desc">("newest");
  const [pageNew, setPageNew] = useState(1);
  const [pagePopular, setPagePopular] = useState(1);
  const [pageCompanies, setPageCompanies] = useState(1);
  const [pageFilter, setPageFilter] = useState(1);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const PAGE_SIZE = 4;
  const FILTER_PAGE_SIZE = 6;
  const COMPANY_PAGE_SIZE = 3;

  const categoriesList = useMemo(() => [
    { id: "all", label: isEn ? "All" : "Tất cả", count: allProducts.length },
    { id: "my_products", label: isEn ? "My Products" : "Của tôi", count: myProductsCount },
    { id: "interested", label: isEn ? "Interested" : "Đã quan tâm", count: interestedIds.length },
    { id: "Công nghệ & Phần mềm", label: isEn ? "Technology" : "Công nghệ & Phần mềm" },
    { id: "Bất động sản & Xây dựng", label: isEn ? "Real Estate" : "Bất động sản & Xây dựng" },
    { id: "Sản xuất & Công nghiệp", label: isEn ? "Manufacturing" : "Sản xuất & Công nghiệp" },
    { id: "Tài chính & Đầu tư", label: isEn ? "Finance" : "Tài chính & Đầu tư" },
    { id: "Dịch vụ & Du lịch", label: isEn ? "Services & Tourism" : "Dịch vụ & Du lịch" },
    { id: "Hàng tiêu dùng & Bán lẻ", label: isEn ? "Consumer Goods" : "Hàng tiêu dùng & Bán lẻ" },
  ], [isEn, allProducts.length, myProductsCount, interestedIds.length]);

  // Section 1: Sản phẩm mới đăng
  const newestProducts = useMemo(() => {
    return [...list].sort((a, b) => {
      const tA = a.time ? new Date(a.time).getTime() : 0;
      const tB = b.time ? new Date(b.time).getTime() : 0;
      return tB - tA;
    });
  }, [list]);

  // Section 2: Sản phẩm được xem nhiều nhất
  const popularProducts = useMemo(() => {
    return [...list].sort((a, b) => {
      const vA = a.views || 0;
      const vB = b.views || 0;
      return vB - vA;
    });
  }, [list]);

  // Section 3: Doanh nghiệp / Công ty nổi bật nhất (1 hội viên đại diện cho 1 công ty)
  const featuredCompanies = useMemo(() => {
    const map = new Map<string, { company: string; repName: string; category: string; count: number; totalViews: number; avatar: string; sampleProduct: MyProduct }>();
    for (const p of allProducts) {
      const key = (p.company || "CLB Doanh Nhân CEO 1983").trim();
      if (!map.has(key)) {
        map.set(key, {
          company: key,
          repName: (p as any).contactName || (p as any).sellerName || "Hội viên CLB CEO 1983",
          category: p.category || "Doanh nghiệp thành viên",
          count: 1,
          totalViews: p.views || 1,
          avatar: p.imageUrl || "",
          sampleProduct: p,
        });
      } else {
        const curr = map.get(key)!;
        curr.count += 1;
        curr.totalViews += (p.views || 1);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count || b.totalViews - a.totalViews);
  }, [allProducts]);

  const startEditProduct = (p: MyProduct, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditingProduct(p);
    setEditPhoto(p.imageUrl || "");
    setEditName(p.name || "");
    setEditCompany(p.company || member?.title || "");
    setEditCategory(p.category || "Công nghệ & Phần mềm");
    setEditPrice(p.memberPrice || p.price || "");
    setEditOriginalPrice(p.originalPrice || "");
    setEditUnit("Gói");
    setEditCurrency("VND");
    setEditDesc("");
  };

  const handleDeleteProduct = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi sàn giao thương không?")) return;
    try {
      await fetchNestApi(`/products/${id}`, { method: "DELETE" }).catch(() =>
        fetchNestApi(`/marketplace/products/${id}`, { method: "DELETE" })
      );
      toast.success("Đã xóa sản phẩm thành công!");
      if (editingProduct?.id === id) setEditingProduct(null);
      reload();
    } catch {
      toast.error("Không thể xóa sản phẩm. Vui lòng thử lại!");
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editName.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm!");
      return;
    }
    setUpdatingProduct(true);
    const cleanPrice = Number(editPrice.replace(/\D/g, "")) || 0;
    const cleanOriginalPrice = Number(editOriginalPrice.replace(/\D/g, "")) || cleanPrice;

    try {
      await fetchNestApi(`/products/${editingProduct.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editName.trim(),
          title: editName.trim(),
          description: editDesc.trim(),
          price: cleanPrice,
          originalPrice: cleanOriginalPrice,
          memberPrice: cleanPrice,
          category: editCategory,
          imageUrl: editPhoto || null,
          company: editCompany.trim(),
        }),
      }).catch(() =>
        fetchNestApi(`/marketplace/products/${editingProduct.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: editName.trim(),
            name: editName.trim(),
            description: editDesc.trim(),
            price: cleanPrice,
            originalPrice: cleanOriginalPrice,
            category: editCategory,
            imageUrl: editPhoto || null,
            company: editCompany.trim(),
          }),
        })
      );
      toast.success("Đã cập nhật thông tin sản phẩm thành công!");
      setEditingProduct(null);
      reload();
    } catch {
      toast.error("Không thể cập nhật sản phẩm. Vui lòng thử lại!");
    } finally {
      setUpdatingProduct(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error(isEn ? "Please enter product name!" : "Vui lòng nhập tên sản phẩm!");
      return;
    }
    setCreatingProduct(true);
    const cleanPrice = Number(formPrice.replace(/\D/g, "")) || 0;
    const cleanOriginalPrice = Number(formOriginalPrice.replace(/\D/g, "")) || cleanPrice;

    const payload = {
      name: formName.trim(),
      title: formName.trim(),
      description: formDesc.trim(),
      price: cleanPrice,
      originalPrice: cleanOriginalPrice,
      memberPrice: cleanPrice,
      unit: formUnit,
      currency: formCurrency,
      category: formCategory,
      status: "active",
      imageUrl: formPhoto || null,
      imageUrls: formPhoto ? [formPhoto] : [],
      company: formCompany.trim() || member?.title || "CLB Doanh Nhân CEO 1983",
      companyIntro: formCompanyIntro.trim(),
      companySize: formCompanySize,
      sellerId: user?.id || (member as any)?.userId || (member as any)?.id || "ceo1983",
    };

    try {
      try {
        await fetchNestApi("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } catch (err1: any) {
        console.warn("POST /products error, trying /marketplace/products fallback:", err1?.message);
        await fetchNestApi("/marketplace/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      toast.success(isEn ? "Product posted successfully!" : "Đã đăng sản phẩm thành công lên sàn!");
      setPostModalOpen(false);
      setFormPhoto("");
      setFormName("");
      setFormCompany("");
      setFormCompanyIntro("");
      setFormCompanySize("10 - 50 nhân sự");
      setFormOriginalPrice("");
      setFormPrice("");
      setFormUnit("Gói");
      setFormCurrency("VND");
      setFormDesc("");
      reload();
    } catch (err: any) {
      console.error("handleCreateProduct error:", err);
      toast.error(err?.message || (isEn ? "Could not post product" : "Không thể đăng sản phẩm. Vui lòng thử lại!"));
    } finally {
      setCreatingProduct(false);
    }
  };

  const renderCard = (p: MyProduct) => {
    const isAuthor = checkIsProductAuthor(p);
    const canManage = checkCanManageProduct(p);
    const isInterested = interestedIds.includes(p.id);
    const menuOpen = activeProductMenuId === p.id;
    const mediaImg = resolveMediaUrl(p.imageUrl) || p.imageUrl || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80";

    return (
      <div
        key={p.id}
        className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-md hover:border-[#003B95]/40 transition-all duration-300"
      >
        <div>
          {/* Product Image Box */}
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
            <img
              src={mediaImg}
              alt={p.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {/* Category Tag Overlay */}
            <span className="absolute left-2 top-2 rounded-full bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[9px] font-bold text-white tracking-wide">
              {p.category || "Dịch vụ"}
            </span>

            {/* Interest Heart Button */}
            <button
              type="button"
              onClick={(e) => toggleInterest(p.id, e)}
              className={`absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full backdrop-blur-xs transition cursor-pointer shadow-xs ${
                isInterested
                  ? "bg-rose-500 text-white shadow-rose-500/30"
                  : "bg-white/80 dark:bg-slate-900/80 text-slate-500 hover:text-rose-500"
              }`}
              title={isInterested ? "Đã lưu quan tâm" : "Lưu quan tâm"}
            >
              <Heart className={`h-3.5 w-3.5 ${isInterested ? "fill-white" : ""}`} />
            </button>

            {/* Owner/Admin action menu button */}
            {canManage && (
              <div className="absolute left-2 bottom-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveProductMenuId(menuOpen ? null : p.id);
                    }}
                    className="grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white hover:bg-black transition cursor-pointer"
                    title="Tùy chọn"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </button>
                  {menuOpen && (
                    <div
                      className="absolute left-0 bottom-7 w-28 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-30 animate-scale-in"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          setActiveProductMenuId(null);
                          startEditProduct(p, e);
                        }}
                        className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Pencil className="h-3 w-3 text-blue-500" />
                        <span>Sửa tin</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          setActiveProductMenuId(null);
                          handleDeleteProduct(p.id, e);
                        }}
                        className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Xóa tin</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Corner Perk Badge: Liên kết trực tiếp đến ưu đãi App Hiệp Hội (/association/perks) */}
            <Link
              to="/association/perks"
              onClick={(e) => e.stopPropagation()}
              className="absolute right-2 bottom-2 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:scale-105 active:scale-95 text-white px-2 py-0.5 text-[9px] font-black shadow-md shadow-amber-500/30 transition border border-amber-300/40"
              title="Ưu đãi độc quyền liên kết App Hiệp Hội"
            >
              <Sparkles className="h-2.5 w-2.5 text-amber-200 fill-amber-200 animate-pulse" />
              <span>Ưu đãi VIP</span>
            </Link>
          </div>

          {/* Product Details Info */}
          <div className="p-3">
            {/* Company & Seller Name */}
            <div className="flex items-center justify-between gap-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate mb-1">
              <span className="flex items-center gap-1 truncate max-w-[60%]">
                <Building2 className="h-3 w-3 shrink-0 text-[#003B95] dark:text-amber-400" />
                <span className="truncate">{p.company || "CLB Doanh Nhân CEO 1983"}</span>
              </span>
              <span className="shrink-0 text-amber-600 dark:text-amber-400 font-semibold normal-case truncate max-w-[40%]">
                Đăng bởi: {p.sellerName || "Hội viên"}
              </span>
            </div>

            {/* Product Title */}
            <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover:text-[#003B95] dark:group-hover:text-amber-400 transition mb-2">
              {p.name}
            </h4>

            {/* Price section: VIP Member Price in prominent Red/Amber */}
            <div className="space-y-0.5 mb-2">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-amber-400">
                  {formatSmartProductPrice(p.memberPrice || p.price)}
                </span>
                {p.originalPrice && p.originalPrice !== p.memberPrice && (
                  <span className="text-[10px] text-slate-400 line-through">
                    {formatSmartProductPrice(p.originalPrice)}
                  </span>
                )}
              </div>
              <span className="inline-block text-[9.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                Ưu đãi độc quyền CEO 1983
              </span>
            </div>

            {/* Views counter & contact */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{p.views || 1} lượt xem</span>
              </span>
              <span className="text-[9.5px] font-medium text-slate-500">
                {(p as any).unit ? `ĐVT: ${(p as any).unit}` : "Báo giá VIP"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: Phân quyền tác giả vs khách hàng */}
        <div className="p-2.5 pt-0">
          {isAuthor ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenProductQuotes(p)}
                className="flex-1 h-8.5 px-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 text-[11px] font-bold text-amber-700 dark:text-amber-300 text-center flex items-center justify-center gap-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition cursor-pointer shrink-0"
                title="Xem danh sách người quan tâm & yêu cầu báo giá"
              >
                <Users className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="truncate">Người quan tâm</span>
              </button>
              <button
                type="button"
                onClick={(e) => startEditProduct(p, e)}
                className="h-8.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 shrink-0"
                title="Chỉnh sửa sản phẩm"
              >
                <Pencil className="h-3 w-3 text-blue-500" />
                <span>Sửa</span>
              </button>
              <button
                type="button"
                onClick={(e) => handleDeleteProduct(p.id, e)}
                className="h-8.5 w-8.5 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold text-rose-600 transition active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                title="Xóa sản phẩm"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenQuoteModal(p)}
                style={{ color: "#ffffff" }}
                className="flex-1 h-8.5 px-3 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white text-[11px] font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send className="h-3 w-3 text-amber-300 shrink-0" />
                <span className="truncate">Nhận báo giá VIP</span>
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleOpenProductQuotes(p)}
                  className="h-8.5 w-8.5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition cursor-pointer flex items-center justify-center shrink-0"
                  title="Xem yêu cầu báo giá (Quyền Admin)"
                >
                  <Users className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="vba-animate pb-24 text-slate-900 dark:text-white">
      {/* 20px Header Bar: CEO1983 Trắng Xanh Đơn Giản */}
      <div className="h-[20px] w-full bg-gradient-to-r from-blue-50 via-white to-sky-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-blue-100/80 dark:border-blue-950/40 flex items-center justify-between px-3 text-[10px] font-semibold text-blue-900 dark:text-blue-200 select-none">
        <span className="flex items-center gap-1 font-bold tracking-wider text-[#003B95] dark:text-blue-400">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#003B95] animate-pulse"></span>
          CEO 1983
        </span>
        <span className="text-[9px] text-blue-600/80 dark:text-blue-300/70 font-medium">
          Marketplace & Tiếp Thị Liên Kết 5.0
        </span>
      </div>

      <MemberHeader
        title={isEn ? "Marketplace 5.0" : "Marketplace"}
        back
      />

      {/* KPI / Statistics Bar (Tổng đang có, đã quan tâm, đã xem) */}
      <div className="px-4 pt-3">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xs">
          <div className="text-center border-r border-slate-100 dark:border-slate-800 pr-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isEn ? "Total Products" : "Tổng sản phẩm"}
            </div>
            <div className="mt-1 text-lg font-black text-[#003B95] dark:text-amber-400">
              {totalProducts}
            </div>
            <div className="text-[9.5px] text-slate-500 dark:text-slate-400">
              {isEn ? "Live on market" : "Đang có trên sàn"}
            </div>
          </div>

          <div className="text-center border-r border-slate-100 dark:border-slate-800 px-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isEn ? "Interested" : "Đã quan tâm"}
            </div>
            <div className="mt-1 text-lg font-black text-rose-500">
              {totalInterested}
            </div>
            <div className="text-[9.5px] text-slate-500 dark:text-slate-400">
              {isEn ? "Quote requests" : "Yêu cầu báo giá"}
            </div>
          </div>

          <div className="text-center pl-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isEn ? "Views" : "Đã xem"}
            </div>
            <div className="mt-1 text-lg font-black text-emerald-500">
              {totalViews}
            </div>
            <div className="text-[9.5px] text-slate-500 dark:text-slate-400">
              {isEn ? "Store visits" : "Lượt truy cập"}
            </div>
          </div>
        </div>
      </div>

      {/* Header: Sàn Thương Mại Điện Tử (Search ở giữa, Icon Menu bên trái, Icon Giỏ Hàng Quan Tâm, Filter & Đăng SP bên phải) */}
      <div className="px-4 pt-3 flex items-center gap-2 relative">
        {/* Left Category Dropdown Menu Button (Requirement 4) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
            className={`h-10 w-10 rounded-2xl grid place-items-center transition cursor-pointer border ${
              categoryMenuOpen || selectedCategory !== "all"
                ? "bg-[#003B95] text-white border-[#003B95] shadow-sm"
                : "bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/10 hover:bg-slate-200"
            }`}
            title="Danh mục sản phẩm"
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
          {categoryMenuOpen && (
            <div
              className="absolute left-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-scale-in max-h-84 overflow-y-auto"
            >
              <div className="px-3.5 py-1.5 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Danh mục thương mại</span>
                <button
                  type="button"
                  onClick={() => setCategoryMenuOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {categoriesList.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setCategoryMenuOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 text-left text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-[#003B95]/10 text-[#003B95] dark:text-amber-400 font-bold border-l-3 border-[#003B95]"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="truncate">{cat.label}</span>
                  {cat.count !== undefined && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                      {cat.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center Search Input (Requirement 4) */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPageFilter(1);
            }}
            placeholder={isEn ? "Search products, services, companies..." : "Tìm sản phẩm, dịch vụ, doanh nghiệp..."}
            className="w-full rounded-2xl border-0 bg-slate-100 dark:bg-white/[0.06] py-2.5 pl-10 pr-8 text-[12.5px] text-slate-900 dark:text-white placeholder:text-slate-400 outline-none ring-0 focus:ring-0 shadow-none"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setPageFilter(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Nút Quan Tâm kiểu Giỏ Hàng eCommerce đặt ngang thanh tìm kiếm */}
        <button
          type="button"
          onClick={() => setWishlistCartOpen(true)}
          className="relative h-10 px-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/40 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center gap-1.5 text-xs font-bold transition active:scale-95 cursor-pointer shrink-0 shadow-xs"
          title="Giỏ hàng sản phẩm quan tâm"
        >
          <ShoppingCart className="h-4.5 w-4.5 text-amber-500" />
          <span className="hidden sm:inline">Quan tâm</span>
          {interestedIds.length > 0 && (
            <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black grid place-items-center animate-pulse">
              {interestedIds.length}
            </span>
          )}
        </button>

        {/* Right: Filter Icon & Post Product (Requirement 4) */}
        <div className="relative flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterMenuOpen(!filterMenuOpen)}
            className={`h-10 w-10 rounded-2xl grid place-items-center transition cursor-pointer border ${
              filterMenuOpen || sortMode !== "newest"
                ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                : "bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/10 hover:bg-slate-200"
            }`}
            title="Bộ lọc & Sắp xếp"
          >
            <SlidersHorizontal className="h-4.5 w-4.5" />
          </button>
          {filterMenuOpen && (
            <div
              className="absolute right-0 top-12 w-52 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-scale-in"
            >
              <div className="px-3.5 py-1 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                Sắp xếp theo
              </div>
              {[
                { id: "newest", label: "Mới đăng nhất" },
                { id: "most_viewed", label: "Xem nhiều nhất" },
                { id: "price_asc", label: "Giá: Thấp đến cao" },
                { id: "price_desc", label: "Giá: Cao đến thấp" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSortMode(s.id as any);
                    setFilterMenuOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between cursor-pointer ${
                    sortMode === s.id
                      ? "bg-[#003B95]/10 text-[#003B95] dark:text-amber-400 font-bold"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{s.label}</span>
                  {sortMode === s.id && <Check className="h-3.5 w-3.5 text-amber-500" />}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => exportProductsToExcel(allProducts)}
            className="h-10 px-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-1.5 text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
            title="Xuất danh sách sản phẩm ra file Excel"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setExcelImportOpen(true)}
            className="h-10 px-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-1.5 text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
            title="Nhập danh sách sản phẩm từ file Excel"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Nhập Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setPostModalOpen(true)}
            style={{ color: "#ffffff" }}
            className="h-10 px-3.5 rounded-2xl bg-[#003B95] hover:bg-[#002B70] text-white flex items-center gap-1.5 text-[12px] font-bold shadow-md transition active:scale-95 cursor-pointer whitespace-nowrap"
            title="Đăng sản phẩm"
          >
            <Plus className="h-4 w-4 text-amber-300" />
            <span className="hidden sm:inline">Đăng SP</span>
          </button>
        </div>
      </div>

      {/* Quick Category Tab Pills */}
      <div className="flex items-center gap-2 px-4 pt-3 overflow-x-auto no-scrollbar">
        {categoriesList.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                active
                  ? "bg-[#003B95] text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
              style={active ? { backgroundColor: "#003B95", color: "#FFFFFF" } : undefined}
            >
              <span style={active ? { color: "#FFFFFF" } : undefined}>{cat.label}</span>
              {cat.count !== undefined && (
                <span
                  className={`grid h-4.5 min-w-4.5 px-1.5 place-items-center rounded-full text-[10px] font-black ${
                    active
                      ? "bg-white/25 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                  }`}
                  style={active ? { color: "#FFFFFF" } : undefined}
                >
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── PR SECTION: VIDEO SHOWCASE REEL & AFFILIATE B2B 5.0 (KHÔNG PHÂN TRANG) ── */}
      <div className="px-4 pt-3">
        <div className="relative overflow-hidden rounded-3xl border border-blue-200/60 dark:border-blue-900/40 bg-gradient-to-br from-[#001D4A] via-[#003B95] to-[#0A2540] text-white shadow-lg p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Video Pitch Showcase */}
            <div className="relative aspect-[16/9] sm:aspect-[4/3] w-full sm:w-48 rounded-2xl overflow-hidden bg-black/60 shrink-0 border border-white/20 shadow-md group">
              <video
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                poster="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&auto=format&fit=crop&q=80"
                autoPlay
                loop
                muted={isVideoMuted}
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                <span>CEO Live</span>
              </div>
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsVideoMuted(!isVideoMuted)}
                  className="h-6 w-6 rounded-full bg-black/70 hover:bg-black text-white grid place-items-center transition cursor-pointer"
                  title={isVideoMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                >
                  {isVideoMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                </button>
              </div>
            </div>

            {/* Content & Affiliate Pitch */}
            <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-blue-950 text-[10px] font-black uppercase tracking-wider shadow-xs">
                  Affiliate 15% - 25%
                </span>
                <span className="text-[11px] text-blue-200 font-semibold flex items-center gap-1">
                  <BadgeCheck className="h-3.5 w-3.5 text-amber-400" />
                  Bảo trợ CLB CEO 1983
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white leading-snug">
                Sàn Thương Mại & Tiếp Thị Liên Kết 5.0
              </h3>
              <p className="text-xs text-blue-100/80 leading-relaxed line-clamp-2">
                Hội viên chia sẻ sản phẩm, nhận hoa hồng kết nối tức thì và tiếp cận mạng lưới 100+ doanh nghiệp hàng đầu.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <Link
                  to="/association/perks"
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-blue-950 text-xs font-bold shadow-xs transition active:scale-95 flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3 text-blue-950" />
                  <span>Xem Ưu Đãi VIP</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: "CEO 1983 Marketplace",
                        text: "Khám phá Sàn Thương Mại & Affiliate CLB CEO 1983",
                        url: window.location.href,
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Đã sao chép liên kết Marketplace!");
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition active:scale-95 flex items-center gap-1 cursor-pointer"
                >
                  <Share2 className="h-3 w-3" />
                  <span>Chia sẻ link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SÀN GIAO THƯƠNG VỚI 3 SECTION PHÂN TRANG (Requirement 4) */}
      <div className="mt-4 px-3.5 space-y-6">
        {loading && (
          <p className="py-10 text-center text-xs text-slate-400">
            {isEn ? "Loading products..." : t("m.products.loading")}
          </p>
        )}

        {/* TRƯỜNG HỢP CÓ TÌM KIẾM HOẶC LỌC DANH MỤC RIÊNG */}
        {(q || selectedCategory !== "all") ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Search className="h-4 w-4 text-[#003B95] dark:text-amber-400" />
                  <span>
                    {q ? `Kết quả tìm kiếm cho "${q}"` : `Danh mục: ${categoriesList.find((c) => c.id === selectedCategory)?.label}`}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">Tìm thấy {list.length} sản phẩm phù hợp</p>
              </div>
              {(q || selectedCategory !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    setSelectedCategory("all");
                  }}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Xóa lọc
                </button>
              )}
            </div>

            {list.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
                <p className="text-xs text-slate-400">Không tìm thấy sản phẩm nào phù hợp</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {list
                    .slice((pageFilter - 1) * FILTER_PAGE_SIZE, pageFilter * FILTER_PAGE_SIZE)
                    .map((p) => renderCard(p))}
                </div>

                {/* Phân trang Section Tìm kiếm / Lọc */}
                {list.length > FILTER_PAGE_SIZE && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                    <span className="text-[11px]">
                      Trang <b>{pageFilter}</b> / {Math.ceil(list.length / FILTER_PAGE_SIZE)} ({list.length} sản phẩm)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={pageFilter <= 1}
                        onClick={() => setPageFilter((prev) => Math.max(1, prev - 1))}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                        title="Trang trước"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={pageFilter >= Math.ceil(list.length / FILTER_PAGE_SIZE)}
                        onClick={() => setPageFilter((prev) => Math.min(Math.ceil(list.length / FILTER_PAGE_SIZE), prev + 1))}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                        title="Trang sau"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            {/* SECTION 1: SẢN PHẨM MỚI ĐĂNG (CÓ PHÂN TRANG) */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 p-3.5 sm:p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/15 text-amber-500">
                    <Flame className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">
                      Sản phẩm mới đăng
                    </h3>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                      Cập nhật liên tục từ các doanh nhân CLB CEO 1983
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-bold font-mono">
                  {newestProducts.length} SP
                </span>
              </div>

              {/* Grid 2 Cột */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {newestProducts
                  .slice((pageNew - 1) * PAGE_SIZE, pageNew * PAGE_SIZE)
                  .map((p) => renderCard(p))}
              </div>

              {/* Phân trang Section 1 */}
              {newestProducts.length > PAGE_SIZE && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                  <span className="text-[11px]">
                    Trang <b>{pageNew}</b> / {Math.ceil(newestProducts.length / PAGE_SIZE)} ({newestProducts.length} sản phẩm)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={pageNew <= 1}
                      onClick={() => setPageNew((prev) => Math.max(1, prev - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                      title="Trang trước"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={pageNew >= Math.ceil(newestProducts.length / PAGE_SIZE)}
                      onClick={() => setPageNew((prev) => Math.min(Math.ceil(newestProducts.length / PAGE_SIZE), prev + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                      title="Trang sau"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: SẢN PHẨM ĐƯỢC XEM NHIỀU NHẤT (CÓ PHÂN TRANG) */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 p-3.5 sm:p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">
                      Sản phẩm được xem nhiều nhất
                    </h3>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                      Sản phẩm thịnh hành và được hội viên quan tâm hàng đầu
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 text-xs font-bold font-mono">
                  Trending
                </span>
              </div>

              {/* Grid 2 Cột */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {popularProducts
                  .slice((pagePopular - 1) * PAGE_SIZE, pagePopular * PAGE_SIZE)
                  .map((p) => renderCard(p))}
              </div>

              {/* Phân trang Section 2 */}
              {popularProducts.length > PAGE_SIZE && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                  <span className="text-[11px]">
                    Trang <b>{pagePopular}</b> / {Math.ceil(popularProducts.length / PAGE_SIZE)} ({popularProducts.length} sản phẩm)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={pagePopular <= 1}
                      onClick={() => setPagePopular((prev) => Math.max(1, prev - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                      title="Trang trước"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={pagePopular >= Math.ceil(popularProducts.length / PAGE_SIZE)}
                      onClick={() => setPagePopular((prev) => Math.min(Math.ceil(popularProducts.length / PAGE_SIZE), prev + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                      title="Trang sau"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: DOANH NGHIỆP / CÔNG TY NỔI BẬT NHẤT (1 người đại diện cho 1 công ty dùng) */}
            <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-white dark:via-slate-900 to-amber-500/10 p-3.5 sm:p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500 text-white shadow-xs">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">
                      Doanh nghiệp nổi bật nhất
                    </h3>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                      Mỗi hội viên đại diện cho một doanh nghiệp tiêu biểu trong CLB
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold font-mono">
                  {featuredCompanies.length} Công ty
                </span>
              </div>

              {/* Danh sách công ty nổi bật */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {featuredCompanies
                  .slice((pageCompanies - 1) * COMPANY_PAGE_SIZE, pageCompanies * COMPANY_PAGE_SIZE)
                  .map((comp) => (
                    <div
                      key={comp.company}
                      className="flex flex-col justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-[#003B95]/50 transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                            <img
                              src={resolveMediaUrl(comp.avatar) || comp.avatar || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&auto=format&fit=crop&q=80"}
                              alt={comp.company}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                              {comp.company}
                            </h4>
                            <span className="text-[10.5px] text-slate-500 truncate block">
                              {comp.category}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2 text-[11px] space-y-1 mb-3">
                          <div className="flex justify-between text-slate-600 dark:text-slate-300">
                            <span>Người đại diện:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{comp.repName}</span>
                          </div>
                          <div className="flex justify-between text-slate-600 dark:text-slate-300">
                            <span>Sản phẩm niêm yết:</span>
                            <span className="font-mono font-bold text-[#003B95] dark:text-amber-400">{comp.count} sản phẩm</span>
                          </div>
                          <div className="flex justify-between text-slate-600 dark:text-slate-300">
                            <span>Tổng lượt xem:</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{comp.totalViews}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setViewingCompany({
                            name: comp.company,
                            avatarUrl: comp.avatar,
                            industry: comp.category,
                          });
                        }}
                        style={{ color: "#ffffff" }}
                        className="w-full py-2 px-3 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Store className="h-3.5 w-3.5 text-amber-300" />
                        <span>Xem gian hàng</span>
                      </button>
                    </div>
                  ))}
              </div>

              {/* Phân trang Section 3 */}
              {featuredCompanies.length > COMPANY_PAGE_SIZE && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                  <span className="text-[11px]">
                    Trang <b>{pageCompanies}</b> / {Math.ceil(featuredCompanies.length / COMPANY_PAGE_SIZE)} ({featuredCompanies.length} doanh nghiệp)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={pageCompanies <= 1}
                      onClick={() => setPageCompanies((prev) => Math.max(1, prev - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                      title="Trang trước"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={pageCompanies >= Math.ceil(featuredCompanies.length / COMPANY_PAGE_SIZE)}
                      onClick={() => setPageCompanies((prev) => Math.min(Math.ceil(featuredCompanies.length / COMPANY_PAGE_SIZE), prev + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                      title="Trang sau"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── FOOTER BANNER: COMPACT MODERN STRIP ── */}
      <div className="mt-6 mb-4 px-4">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#003B95]/10 dark:bg-amber-400/10 grid place-items-center shrink-0">
              <Store className="h-4 w-4 text-[#003B95] dark:text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center justify-center sm:justify-start gap-1.5">
                <span>CEO 1983 Marketplace</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold">5.0</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sàn giao thương B2B & liên kết giá trị doanh nghiệp hội viên
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => exportProductsToExcel(allProducts)}
              className="h-8 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              <span>Xuất Excel</span>
            </button>
            <Link
              to="/association/perks"
              className="h-8 px-3 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Ưu đãi VIP</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── MODAL ĐĂNG SẢN PHẨM: ĐÃ SỬA THEME SÁNG TRANG NHÃ & CHÍNH GIỮA MÀN MOBILE ── */}
      {mounted && postModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] grid place-items-center p-3 sm:p-4 bg-black/80 backdrop-blur-md w-full h-[100dvh] overflow-y-auto animate-fade-in"
          onClick={() => setPostModalOpen(false)}
        >
          <div
            className="my-auto w-full max-w-[440px] max-h-[85dvh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-[14.5px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-[#003B95] dark:text-amber-400" />
                {isEn ? "Post New Product / Service" : "Đăng Sản Phẩm / Dịch Vụ Mới"}
              </h3>
              <button
                type="button"
                onClick={() => setPostModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 [scrollbar-width:thin]">
                {/* ── PHẦN 1: THÔNG TIN DOANH NGHIỆP & GIAN HÀNG ── */}
                <div className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 p-3.5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#003B95] dark:text-amber-400">
                    <Store className="h-4 w-4 text-[#003B95] dark:text-amber-400" />
                    <span>1. Thông tin Doanh Nghiệp & Gian Hàng</span>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {isEn ? "Company / Brand Name *" : "Tên Doanh Nghiệp / Thương Hiệu *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      placeholder={isEn ? "Company name" : "Ví dụ: Công ty Cổ phần Công nghệ ABC"}
                      className="w-full rounded-xl border-0 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#003B95]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {isEn ? "Employee Scale" : "Quy mô nhân sự"}
                      </label>
                      <select
                        value={formCompanySize}
                        onChange={(e) => setFormCompanySize(e.target.value)}
                        className="w-full rounded-xl border-0 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-white outline-none ring-1 ring-slate-200 dark:ring-slate-700"
                      >
                        <option value="Dưới 10 nhân sự">Dưới 10 nhân sự</option>
                        <option value="10 - 50 nhân sự">10 - 50 nhân sự</option>
                        <option value="50 - 200 nhân sự">50 - 200 nhân sự</option>
                        <option value="200 - 500 nhân sự">200 - 500 nhân sự</option>
                        <option value="Trên 500 nhân sự">Trên 500 nhân sự</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {isEn ? "Industry" : "Lĩnh vực chính"}
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full rounded-xl border-0 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-white outline-none ring-1 ring-slate-200 dark:ring-slate-700"
                      >
                        <option value="Công nghệ & Phần mềm">Công nghệ & Phần mềm</option>
                        <option value="Bất động sản & Xây dựng">Bất động sản & Xây dựng</option>
                        <option value="Sản xuất & Công nghiệp">Sản xuất & Công nghiệp</option>
                        <option value="Tài chính & Đầu tư">Tài chính & Đầu tư</option>
                        <option value="Dịch vụ & Du lịch">Dịch vụ & Du lịch</option>
                        <option value="Hàng tiêu dùng & Bán lẻ">Hàng tiêu dùng & Bán lẻ</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {isEn ? "Company Bio / Intro" : "Giới thiệu ngắn về doanh nghiệp"}
                    </label>
                    <textarea
                      rows={2}
                      value={formCompanyIntro}
                      onChange={(e) => setFormCompanyIntro(e.target.value)}
                      placeholder="Giới thiệu năng lực cung ứng, giấy phép hoặc kinh nghiệm thị trường..."
                      className="w-full rounded-xl border-0 bg-white dark:bg-slate-800 p-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none ring-1 ring-slate-200 dark:ring-slate-700 resize-none"
                    />
                  </div>
                </div>

                {/* ── PHẦN 2: THÔNG TIN SẢN PHẨM / DỊCH VỤ ── */}
                <div className="rounded-2xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20 p-3.5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <PackageCheck className="h-4 w-4" />
                    <span>2. Thông tin Sản Phẩm / Dịch Vụ</span>
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {isEn ? "Product Image (Clear & Required)" : "Ảnh sản phẩm (Bắt buộc & Rõ nét)"}
                    </label>
                    {formPhoto ? (
                      <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <img
                          src={formPhoto}
                          alt="Ảnh sản phẩm"
                          className="h-36 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormPhoto("")}
                          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-black/75 text-white hover:bg-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/40 p-4 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-slate-800/70 transition">
                        <ImagePlus className="h-6 w-6 text-[#003B95] dark:text-amber-400 mb-1" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {isEn ? "Click to upload product image" : "Chọn ảnh sản phẩm tải lên"}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const compressed = await compressImage(file);
                              if (compressed) setFormPhoto(compressed);
                            } catch {
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === "string") setFormPhoto(reader.result);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {isEn ? "Product / Service Name *" : "Tên sản phẩm / Dịch vụ *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={isEn ? "e.g. Enterprise Cloud Solution..." : "Ví dụ: Gói giải pháp chuyển đổi số doanh nghiệp..."}
                      className="w-full rounded-xl border-0 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none ring-1 ring-slate-200 dark:ring-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {isEn ? "Listed Price (Original)" : "Giá niêm yết (Gốc)"}
                      </label>
                      <input
                        type="text"
                        value={formOriginalPrice}
                        onChange={(e) => setFormOriginalPrice(formatCurrencyInput(e.target.value))}
                        placeholder="Ví dụ: 20.000.000 đ"
                        className="w-full rounded-xl border-0 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {isEn ? "VIP Member Price *" : "Giá ưu đãi Hội viên *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={formPrice}
                        onChange={(e) => setFormPrice(formatCurrencyInput(e.target.value))}
                        placeholder="Ví dụ: 15.000.000 đ"
                        className="w-full rounded-xl border-0 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {isEn ? "Unit" : "Đơn vị tính"}
                      </label>
                      <input
                        type="text"
                        value={formUnit}
                        onChange={(e) => setFormUnit(e.target.value)}
                        placeholder="Gói / Chiếc / Tháng"
                        className="w-full rounded-xl border-0 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {isEn ? "Currency" : "Tiền tệ"}
                      </label>
                      <select
                        value={formCurrency}
                        onChange={(e) => setFormCurrency(e.target.value)}
                        className="w-full rounded-xl border-0 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none ring-1 ring-slate-200 dark:ring-slate-700 cursor-pointer"
                      >
                        <option value="VND">VNĐ</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {isEn ? "Description & Quality Commitment" : "Mô tả sản phẩm & Cam kết chất lượng"}
                    </label>
                    <textarea
                      rows={2}
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      placeholder={isEn ? "Describe specs, warranty, exclusive member discounts..." : "Mô tả thông số, chính sách bảo hành, ưu đãi riêng cho hội viên CEO 1983..."}
                      className="w-full rounded-xl border-0 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none ring-1 ring-slate-200 dark:ring-slate-700 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900/50">
                <button
                  type="submit"
                  style={{ color: "#ffffff" }}
                  className="w-full rounded-xl bg-[#003B95] hover:bg-[#002B70] py-2.5 text-xs font-bold text-white shadow-md shadow-[#003B95]/20 active:scale-98 transition cursor-pointer"
                >
                  {isEn ? "Publish Product to Marketplace" : "Đăng Sản Phẩm Lên Gian Hàng"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── INTERACTIVE MODAL NHẬN BÁO GIÁ VIP (React Portal) ── */}
      {mounted && quoteProduct && createPortal(
        <div
          className="fixed inset-0 z-[9999] grid place-items-center p-3 sm:p-4 bg-black/80 backdrop-blur-md w-full h-[100dvh] overflow-y-auto animate-fade-in"
          onClick={() => setQuoteProduct(null)}
        >
          <div
            className="my-auto w-full max-w-[420px] max-h-[85dvh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-[14.5px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#003B95] dark:text-amber-400" />
                {isEn ? "Request VIP Quotation" : "Yêu Cầu Báo Giá VIP"}
              </h3>
              <button
                type="button"
                onClick={() => setQuoteProduct(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitQuote} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 [scrollbar-width:thin]">
                {/* Product Summary Preview */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/30">
                  <img
                    src={quoteProduct.imageUrl || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80"}
                    alt=""
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{quoteProduct.name}</p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 truncate">{quoteProduct.company}</p>
                    <p className="text-[11px] font-bold text-rose-500">{quoteProduct.price || (isEn ? "Contact for price" : "Giá ưu đãi hội viên")}</p>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isEn ? "Desired Quantity / Scope" : "Số lượng dự kiến / Quy mô nhu cầu"}
                  </label>
                  <input
                    type="text"
                    required
                    value={quoteQty}
                    onChange={(e) => setQuoteQty(e.target.value)}
                    placeholder="Ví dụ: 1 gói, 50 bộ, triển khai 1 năm..."
                    className="w-full rounded-xl border-0 bg-slate-100 dark:bg-white/[0.06] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none ring-0 focus:ring-0"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isEn ? "Contact Phone / Zalo" : "Số điện thoại / Zalo liên hệ của bạn *"}
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={quotePhone}
                      onChange={(e) => setQuotePhone(e.target.value)}
                      placeholder="0988 123 456"
                      className="w-full rounded-xl border-0 bg-slate-100 dark:bg-white/[0.06] py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-white outline-none ring-0 focus:ring-0"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isEn ? "Specific Requirements / Note" : "Yêu cầu chi tiết / Ghi chú"}
                  </label>
                  <textarea
                    rows={2}
                    value={quoteNote}
                    onChange={(e) => setQuoteNote(e.target.value)}
                    placeholder={isEn ? "Specific business requirements..." : "Ghi chú thêm về yêu cầu kỹ thuật, thời gian giao hàng..."}
                    className="w-full rounded-xl border-0 bg-slate-100 dark:bg-white/[0.06] p-3 text-xs text-slate-900 dark:text-white outline-none ring-0 focus:ring-0 resize-none"
                  />
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900/50">
                <button
                  type="submit"
                  disabled={quoteSubmitting}
                  style={{ color: "#ffffff" }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#003B95] hover:bg-[#002B70] py-2.5 text-xs font-bold text-white shadow-md shadow-[#003B95]/20 active:scale-98 transition cursor-pointer disabled:opacity-60"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{quoteSubmitting ? (isEn ? "Sending request..." : "Đang gửi...") : (isEn ? "Send Quote Request Now" : "Gửi Yêu Cầu Báo Giá")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL XEM DANH SÁCH NGƯỜI QUAN TÂM & YÊU CẦU BÁO GIÁ SẢN PHẨM ── */}
      {mounted && viewingQuotesProduct && createPortal(
        <div
          className="fixed inset-0 z-[9999] grid place-items-center p-3 sm:p-4 bg-black/80 backdrop-blur-md w-full h-[100dvh] overflow-y-auto animate-fade-in"
          onClick={() => setViewingQuotesProduct(null)}
        >
          <div
            className="my-auto w-full max-w-[500px] max-h-[85dvh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="min-w-0 flex-1 pr-2">
                <h3 className="text-[14.5px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-500" />
                  <span>Hội viên quan tâm / Báo giá</span>
                </h3>
                <p className="text-xs text-slate-400 truncate mt-0.5">{viewingQuotesProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingQuotesProduct(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {loadingProductQuotes ? (
                <p className="text-xs text-slate-400 text-center py-6">Đang tải danh sách người quan tâm...</p>
              ) : productQuotes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Chưa có yêu cầu báo giá nào</p>
                  <p className="text-[11px] text-slate-400 mt-1">Khi có hội viên gửi yêu cầu báo giá hoặc bấm quan tâm, thông tin liên hệ sẽ xuất hiện tại đây.</p>
                </div>
              ) : (
                productQuotes.map((q: any) => (
                  <div key={q.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[#003B95] text-amber-300 font-bold flex items-center justify-center text-xs shrink-0">
                          {q.buyerName ? q.buyerName.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{q.buyerName || "Hội viên CLB"}</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{q.buyerCompany || "Hội viên CEO 1983"}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 shrink-0">
                        {fmt.rel(q.createdAt)}
                      </span>
                    </div>

                    {q.quantity && (
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        <strong>Số lượng / Quy mô:</strong> {q.quantity}
                      </p>
                    )}

                    {(q.note || q.message) && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 italic">
                        "{q.note || q.message}"
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/40">
                      <div className="text-xs text-slate-500">
                        {q.phone && <span>SĐT: <strong className="text-emerald-600 dark:text-emerald-400">{q.phone}</strong></span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {q.phone && (
                          <a
                            href={`tel:${q.phone}`}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-600 transition"
                          >
                            <Phone className="h-3 w-3" />
                            <span>Gọi</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setViewingQuotesProduct(null);
                            navigate({ to: "/association/messages", search: { peerCode: q.buyerId || q.phone } });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#003B95] text-white text-[11px] font-bold flex items-center gap-1 hover:bg-[#002B70] transition cursor-pointer"
                        >
                          <MessageSquare className="h-3 w-3" />
                          <span>Nhắn tin</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL CHỈNH SỬA SẢN PHẨM: DÀNH CHO NGƯỜI TẠO ĐĂNG ── */}
      {mounted && editingProduct && createPortal(
        <div
          className="fixed inset-0 z-[9999] grid place-items-center p-3 sm:p-4 bg-black/80 backdrop-blur-md w-full h-[100dvh] overflow-y-auto animate-fade-in"
          onClick={() => setEditingProduct(null)}
        >
          <div
            className="my-auto w-full max-w-[440px] max-h-[85dvh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-[14.5px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil className="h-5 w-5 text-[#003B95] dark:text-amber-400" />
                {isEn ? "Edit Product / Service" : "Chỉnh Sửa Sản Phẩm / Dịch Vụ"}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 [scrollbar-width:thin]">
                {/* Image upload / preview */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isEn ? "Product Image" : "Hình ảnh đại diện sản phẩm"}
                  </label>
                  <input
                    type="file"
                    ref={editImageInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const compressed = await compressImage(file);
                        if (compressed) setEditPhoto(compressed);
                      } catch {
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === "string") setEditPhoto(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {editPhoto ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                      <img
                        src={resolveMediaUrl(editPhoto) || editPhoto}
                        alt="Preview"
                        className="w-full h-36 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setEditPhoto("")}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow cursor-pointer transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => editImageInputRef.current?.click()}
                      className="w-full rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 p-4 text-center hover:border-amber-500/50 hover:bg-amber-500/5 transition cursor-pointer flex flex-col items-center justify-center gap-1.5"
                    >
                      <ImagePlus className="h-6 w-6 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {isEn ? "Click to upload new image" : "Chọn ảnh từ thiết bị (JPG, PNG, WebP)"}
                      </span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isEn ? "Product Name *" : "Tên sản phẩm / giải pháp *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="VD: Dịch vụ tư vấn giải pháp AI..."
                    className="w-full rounded-xl border-0 bg-slate-100 dark:bg-white/[0.06] px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none ring-0 focus:ring-0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isEn ? "Company" : "Tên doanh nghiệp"}
                    </label>
                    <input
                      type="text"
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      placeholder="VD: Công ty TNHH ABC"
                      className="w-full rounded-xl border-0 bg-slate-100 dark:bg-white/[0.06] px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none ring-0 focus:ring-0"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isEn ? "Category" : "Ngành hàng"}
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full rounded-xl border-0 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none ring-0 focus:ring-0"
                    >
                      <option value="Công nghệ & Phần mềm">Công nghệ & Phần mềm</option>
                      <option value="Bất động sản & Xây dựng">Bất động sản & Xây dựng</option>
                      <option value="Sản xuất & Công nghiệp">Sản xuất & Công nghiệp</option>
                      <option value="Tài chính & Đầu tư">Tài chính & Đầu tư</option>
                      <option value="Dịch vụ & Du lịch">Dịch vụ & Du lịch</option>
                      <option value="Hàng tiêu dùng & Bán lẻ">Hàng tiêu dùng & Bán lẻ</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isEn ? "Original Price" : "Giá niêm yết (VNĐ)"}
                    </label>
                    <input
                      type="text"
                      value={editOriginalPrice}
                      onChange={(e) => setEditOriginalPrice(formatCurrencyInput(e.target.value))}
                      placeholder="VD: 50.000.000"
                      className="w-full rounded-xl border-0 bg-slate-100 dark:bg-white/[0.06] px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none ring-0 focus:ring-0"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isEn ? "Member Price *" : "Giá ưu đãi hội viên *"}
                    </label>
                    <input
                      type="text"
                      value={editPrice}
                      onChange={(e) => setEditPrice(formatCurrencyInput(e.target.value))}
                      placeholder="VD: 35.000.000"
                      className="w-full rounded-xl border-0 bg-slate-100 dark:bg-white/[0.06] px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none ring-0 focus:ring-0"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isEn ? "Description / Specs" : "Mô tả / Thông số / Ưu đãi"}
                  </label>
                  <textarea
                    rows={2}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Giới thiệu điểm nổi bật, chính sách bảo hành, hỗ trợ hội viên..."
                    className="w-full rounded-xl border-0 bg-slate-100 dark:bg-white/[0.06] p-3 text-xs text-slate-900 dark:text-white outline-none ring-0 focus:ring-0 resize-none"
                  />
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900/50 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  {isEn ? "Cancel" : "Hủy"}
                </button>
                <button
                  type="submit"
                  disabled={updatingProduct}
                  style={{ color: "#ffffff" }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#003B95] hover:bg-[#002B70] py-2.5 text-xs font-bold text-white shadow-md shadow-[#003B95]/20 active:scale-98 transition cursor-pointer disabled:opacity-60"
                >
                  <span>{updatingProduct ? (isEn ? "Saving..." : "Đang lưu...") : (isEn ? "Save Changes" : "Lưu Thay Đổi")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL GIAN HÀNG DOANH NGHIỆP (COMPANY STOREFRONT) ── */}
      {mounted && viewingCompany && createPortal(
        <div
          className="fixed inset-0 z-[9999] grid place-items-center p-3 sm:p-4 bg-black/80 backdrop-blur-md w-full h-[100dvh] overflow-y-auto animate-fade-in"
          onClick={() => setViewingCompany(null)}
        >
          <div
            className="my-auto w-full max-w-[480px] max-h-[88dvh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Storefront Header with Royal Blue Gradient */}
            <div className="relative bg-gradient-to-r from-[#003B95] via-[#002B70] to-[#1E3A8A] p-5 text-white shrink-0">
              <button
                type="button"
                onClick={() => setViewingCompany(null)}
                className="absolute right-3.5 top-3.5 grid h-8 w-8 place-items-center rounded-full bg-black/35 text-white hover:bg-black/60 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 mt-1">
                <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-white/10 border-2 border-white/30 shrink-0 shadow-md">
                  <img
                    src={viewingCompany.avatarUrl || "/ceo1983-official-logo.png"}
                    alt={viewingCompany.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="text-sm sm:text-base font-black text-white truncate drop-shadow-xs">
                      {viewingCompany.name}
                    </h2>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-400/25 border border-amber-300/40 px-2 py-0.5 text-[9px] font-bold text-amber-300">
                      <BadgeCheck className="h-3 w-3 text-amber-400" /> Xác thực CEO 1983
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-100/80 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>{viewingCompany.industry || "Doanh nghiệp thành viên"}</span>
                    <span>•</span>
                    <span>Hội viên chính thức CLB CEO 1983</span>
                  </p>
                </div>
              </div>

              {/* Bio / Intro */}
              <div className="mt-3.5 rounded-xl bg-white/10 backdrop-blur-xs p-2.5 text-[11px] text-white/90 leading-relaxed border border-white/10">
                {viewingCompany.bio || `Doanh nghiệp thành viên chính thức CLB Doanh Nhân CEO 1983. Cam kết cung ứng giải pháp và sản phẩm chất lượng cao với chính sách ưu đãi đặc quyền cho các hội viên.`}
              </div>
            </div>

            {/* Storefront Products Catalog */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 [scrollbar-width:thin]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Store className="h-4 w-4 text-[#003B95] dark:text-amber-400" />
                  <span>Danh Mục Sản Phẩm ({allProducts.filter(p => p.company?.toLowerCase() === viewingCompany.name.toLowerCase()).length})</span>
                </h3>
                <span className="text-[10px] text-slate-400">Cam kết bảo trợ CLB</span>
              </div>

              {allProducts.filter(p => p.company?.toLowerCase() === viewingCompany.name.toLowerCase()).length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Gian hàng hiện đang chuẩn bị thêm sản phẩm mới.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {allProducts
                    .filter(p => p.company?.toLowerCase() === viewingCompany.name.toLowerCase())
                    .map((p) => (
                      <div
                        key={p.id}
                        className="flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 overflow-hidden"
                      >
                        <div className="aspect-square w-full rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 mb-2">
                          <img
                            src={resolveMediaUrl(p.imageUrl) || p.imageUrl || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80"}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[11.5px] font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                          {p.name}
                        </p>
                        <p className="text-[12px] font-black text-red-600 dark:text-amber-400 mt-1 whitespace-normal break-words leading-tight">
                          {formatSmartProductPrice(p.memberPrice || p.price)}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setViewingCompany(null);
                            handleOpenQuoteModal(p);
                          }}
                          className="mt-2 w-full py-1 rounded-lg bg-[#003B95] text-white text-[10.5px] font-bold hover:bg-[#002B70] transition cursor-pointer"
                        >
                          Nhận báo giá
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL GIỎ HÀNG QUAN TÂM (WISHLIST CART MODAL) ── */}
      {mounted && wishlistCartOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] grid place-items-center p-3 sm:p-4 bg-black/80 backdrop-blur-md w-full h-[100dvh] overflow-y-auto animate-fade-in"
          onClick={() => setWishlistCartOpen(false)}
        >
          <div
            className="my-auto w-full max-w-[480px] max-h-[88dvh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-[#002B70] to-[#003B95] p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400 text-blue-950 font-bold shadow-xs">
                  <ShoppingCart className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">Giỏ Hàng Quan Tâm</h3>
                  <p className="text-[11px] text-blue-100/80">
                    {interestedIds.length} sản phẩm đã đánh dấu quan tâm
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWishlistCartOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-black/35 text-white hover:bg-black/60 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 [scrollbar-width:thin]">
              {interestedIds.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <ShoppingCart className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-1" />
                  <p className="text-xs font-semibold">Bạn chưa lưu sản phẩm nào vào danh sách quan tâm.</p>
                  <p className="text-[11px] text-slate-500">Bấm biểu tượng trái tim trên các sản phẩm để lưu lại tại đây.</p>
                </div>
              ) : (
                allProducts
                  .filter((p) => interestedIds.includes(p.id))
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-[#003B95]/40 transition"
                    >
                      <div className="h-16 w-16 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                        <img
                          src={resolveMediaUrl(p.imageUrl) || p.imageUrl || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80"}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-[#003B95] dark:text-amber-400 block truncate">
                          {p.company || "CLB CEO 1983"}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {p.name}
                        </h4>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span className="text-xs font-black text-rose-600 dark:text-amber-400">
                            {formatSmartProductPrice(p.memberPrice || p.price)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setWishlistCartOpen(false);
                            handleOpenQuoteModal(p);
                          }}
                          className="py-1 px-2.5 rounded-lg bg-[#003B95] text-white text-[10.5px] font-bold hover:bg-[#002B70] transition cursor-pointer"
                        >
                          Báo giá VIP
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleInterest(p.id)}
                          className="text-[10px] text-rose-500 hover:underline text-center cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
              <Link
                to="/association/perks"
                onClick={() => setWishlistCartOpen(false)}
                className="text-xs font-bold text-[#003B95] dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Xem ưu đãi VIP</span>
              </Link>
              <button
                type="button"
                onClick={() => setWishlistCartOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ProductExcelModal
        open={excelImportOpen}
        onClose={() => setExcelImportOpen(false)}
        onImportProducts={handleImportExcelProducts}
      />
    </div>
  );
}
