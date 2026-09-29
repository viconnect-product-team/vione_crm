import { useEffect, useState, useMemo } from "react";
import {
  Award,
  CalendarDays,
  Check,
  CheckSquare,
  Gift,
  Search,
  Sparkles,
  Square,
  Trash2,
  Building2,
  DollarSign,
  Layers,
  X,
} from "lucide-react";
import { fetchNestApi } from "@/lib/api-client";
import { type EventSponsorItem } from "@/lib/events.functions";
import { type Sponsor, type SponsorPackage } from "@/lib/sponsors.functions";
import { useFmt } from "@/lib/i18n";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const TIER_META: Record<
  string,
  {
    name: string;
    icon: string;
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
    cardBorder: string;
    gradient: string;
  }
> = {
  platinum: {
    name: "Kim Cương (Platinum)",
    icon: "💎",
    bg: "bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-500/30",
    badgeBg: "bg-sky-500/15",
    cardBorder: "border-sky-500/40",
    gradient: "from-sky-500/10 via-indigo-500/5 to-transparent",
  },
  gold: {
    name: "Vàng (Gold)",
    icon: "🥇",
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/30",
    badgeBg: "bg-amber-500/15",
    cardBorder: "border-amber-500/40",
    gradient: "from-amber-500/10 via-yellow-500/5 to-transparent",
  },
  silver: {
    name: "Bạc (Silver)",
    icon: "🥈",
    bg: "bg-zinc-500/10",
    text: "text-zinc-700 dark:text-zinc-300",
    border: "border-zinc-500/30",
    badgeBg: "bg-zinc-500/15",
    cardBorder: "border-zinc-500/40",
    gradient: "from-zinc-500/10 via-slate-500/5 to-transparent",
  },
  bronze: {
    name: "Đồng (Bronze)",
    icon: "🥉",
    bg: "bg-orange-500/10",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-500/30",
    badgeBg: "bg-orange-500/15",
    cardBorder: "border-orange-500/40",
    gradient: "from-orange-500/10 via-amber-700/5 to-transparent",
  },
};

const DEFAULT_TIER = {
  name: "Đồng hành",
  icon: "⭐",
  bg: "bg-primary/10",
  text: "text-primary",
  border: "border-primary/30",
  badgeBg: "bg-primary/15",
  cardBorder: "border-primary/40",
  gradient: "from-primary/10 to-transparent",
};

const FALLBACK_PACKAGES: SponsorPackage[] = [
  {
    id: "PKG-PLATINUM-CASH",
    tier: "platinum",
    price: 200000000,
    packageType: "cash",
    available: 2,
    sold: 1,
    benefits: [
      "Logo độc quyền tại vị trí trung tâm sân khấu",
      "1 bàn tiệc VIP 10 khách danh dự",
      "Bài phát biểu 10 phút tại lễ khai mạc",
      "Phát video phóng sự doanh nghiệp trên màn hình LED",
    ],
  },
  {
    id: "PKG-GOLD-INKIND",
    tier: "gold",
    price: 100000000,
    packageType: "in_kind",
    inKindDescription: "Tài trợ 200 bộ quà tặng cao cấp cho toàn bộ CEO & C-Level tham dự",
    available: 5,
    sold: 2,
    benefits: [
      "Đặt gian hàng trải nghiệm sản phẩm tại sảnh chính",
      "Logo trên backdrop & ấn phẩm truyền thông",
      "5 vé VIP tham dự toàn bộ chương trình",
      "Giới thiệu sản phẩm trong tài liệu sự kiện",
    ],
  },
  {
    id: "PKG-SILVER-CASH",
    tier: "silver",
    price: 50000000,
    packageType: "cash",
    available: 10,
    sold: 3,
    benefits: [
      "Logo trên website và thư mời đại biểu",
      "3 vé VIP hàng ghế đầu",
      "Trưng bày ấn phẩm brochure tại quầy check-in",
    ],
  },
  {
    id: "PKG-BRONZE-INKIND",
    tier: "bronze",
    price: 20000000,
    packageType: "in_kind",
    inKindDescription: "Tài trợ toàn bộ teabreak, tiệc trà & cà phê cao cấp giờ giải lao",
    available: 15,
    sold: 4,
    benefits: [
      "Bảng tên nhà tài trợ tại khu vực Tea-break",
      "2 vé tham dự sự kiện",
      "Logo trong clip tổng kết sự kiện",
    ],
  },
];

const FALLBACK_SPONSORS: Sponsor[] = [
  {
    id: "SP-001",
    name: "Tập đoàn Công nghệ SunTech Global",
    tier: "platinum",
    sponsorType: "regular",
    packageType: "cash",
    contact: "Nguyễn Văn Hùng (Chủ tịch HĐQT)",
    email: "hung.nv@suntech-global.vn",
    phone: "0908 123 456",
    amount: 200000000,
    events: 8,
    since: "2023-01-15",
    status: "active",
  },
  {
    id: "SP-002",
    name: "Công ty Cổ phần Trầm Hương & Yến Sào Hoàng Gia",
    tier: "gold",
    sponsorType: "regular",
    packageType: "in_kind",
    inKindDescription: "200 bộ quà tặng Yến Sào & Trầm Hương Thượng Hạng dành tặng tất cả CEO",
    contact: "Trần Mai Phương (Tổng Giám Đốc)",
    email: "phuong.tm@hoanggiagroup.vn",
    phone: "0912 345 678",
    amount: 100000000,
    events: 5,
    since: "2023-06-20",
    status: "active",
  },
  {
    id: "SP-003",
    name: "Ngân hàng TMCP Tiên Phong (TPBank) - Khối SME",
    tier: "silver",
    sponsorType: "regular",
    packageType: "cash",
    contact: "Lê Minh Tuấn (GĐ Khối KHDN)",
    email: "tuanlm@tpb.com.vn",
    phone: "0983 999 888",
    amount: 50000000,
    events: 3,
    since: "2024-02-10",
    status: "active",
  },
  {
    id: "SP-004",
    name: "Chuỗi Cà Phê Đặc Sản Artisan Roastery",
    tier: "bronze",
    sponsorType: "new",
    packageType: "in_kind",
    inKindDescription: "Toàn bộ quầy Barista pha cà phê tươi hảo hạng & bánh ngọt Teabreak cho 300 khách",
    contact: "Phạm Thu Hà (Nhà Sáng Lập)",
    email: "ha.pham@artisancoffee.vn",
    phone: "0934 567 890",
    amount: 20000000,
    events: 2,
    since: "2024-05-18",
    status: "active",
  },
];

export function EventSponsorPackageSelector({
  value = [],
  onChange,
}: {
  eventId?: string;
  value: EventSponsorItem[];
  onChange: (sponsors: EventSponsorItem[]) => void;
}) {
  const fmt = useFmt();
  const [sponsorsList, setSponsorsList] = useState<Sponsor[]>([]);
  const [packagesList, setPackagesList] = useState<SponsorPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterTier, setFilterTier] = useState<string>("all");

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const [sponsorsRes, packagesRes] = await Promise.all([
          fetchNestApi<Sponsor[]>("/sponsors").catch(() => []),
          fetchNestApi<SponsorPackage[]>("/sponsors/packages").catch(() => []),
        ]);
        if (active) {
          const validSponsors = Array.isArray(sponsorsRes) && sponsorsRes.length > 0 ? sponsorsRes : FALLBACK_SPONSORS;
          const validPackages = Array.isArray(packagesRes) && packagesRes.length > 0 ? packagesRes : FALLBACK_PACKAGES;
          setSponsorsList(validSponsors);
          setPackagesList(validPackages);
        }
      } catch (err) {
        console.error("[EventSponsorPackageSelector] Load error:", err);
        if (active) {
          setSponsorsList(FALLBACK_SPONSORS);
          setPackagesList(FALLBACK_PACKAGES);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  const safeSelected = Array.isArray(value) ? value : [];

  // Filtered sponsors for multi-select
  const filteredSponsors = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sponsorsList.filter((s) => {
      if (filterTier !== "all" && s.tier !== filterTier) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.contact && s.contact.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.inKindDescription && s.inKindDescription.toLowerCase().includes(q))
      );
    });
  }, [sponsorsList, query, filterTier]);

  // Find the best matching package for a sponsor
  const findMatchingPackage = (s: Sponsor) => {
    const matched =
      packagesList.find((p) => p.tier === s.tier && p.packageType === s.packageType) ||
      packagesList.find((p) => p.tier === s.tier) ||
      packagesList[0];
    return matched;
  };

  // Toggle selection for a sponsor (Multi-select)
  const handleToggleSponsor = (s: Sponsor) => {
    const existingIndex = safeSelected.findIndex(
      (item) => item.sponsorId === s.id || item.sponsorName === s.name
    );

    if (existingIndex >= 0) {
      // Remove from selected list
      onChange(safeSelected.filter((_, idx) => idx !== existingIndex));
    } else {
      // Add with their designated sponsorship package
      const matchedPkg = findMatchingPackage(s);
      const tierMeta = TIER_META[s.tier] || DEFAULT_TIER;

      const newItem: EventSponsorItem = {
        name: s.name,
        sponsorId: s.id,
        sponsorName: s.name,
        packageId: matchedPkg?.id,
        packageName: matchedPkg
          ? `${(TIER_META[matchedPkg.tier] || DEFAULT_TIER).name} - ${matchedPkg.packageType === "in_kind" ? "Hiện vật" : "Tiền mặt"}`
          : tierMeta.name,
        tier: (matchedPkg?.tier || s.tier) as any,
        packageType: matchedPkg?.packageType || s.packageType || "cash",
        amount: Number(matchedPkg?.price ?? s.amount ?? 0),
        inKindDescription: s.inKindDescription || matchedPkg?.inKindDescription || "",
        benefits: matchedPkg?.benefits || [],
      };
      onChange([...safeSelected, newItem]);
    }
  };

  // Change sponsorship package for a selected sponsor
  const handleSwitchPackage = (sponsorId: string, packageId: string) => {
    const pkg = packagesList.find((p) => p.id === packageId);
    if (!pkg) return;

    const tierMeta = TIER_META[pkg.tier] || DEFAULT_TIER;

    onChange(
      safeSelected.map((item) => {
        if (item.sponsorId !== sponsorId) return item;
        return {
          ...item,
          packageId: pkg.id,
          packageName: `${tierMeta.name} - ${pkg.packageType === "in_kind" ? "Hiện vật" : "Tiền mặt"}`,
          tier: pkg.tier as any,
          packageType: pkg.packageType,
          amount: Number(pkg.price || 0),
          inKindDescription: pkg.inKindDescription || item.inKindDescription || "",
          benefits: pkg.benefits || [],
        };
      })
    );
  };

  // Update in-kind description
  const handleUpdateInKindDescription = (sponsorId: string, text: string) => {
    onChange(
      safeSelected.map((item) => {
        if (item.sponsorId !== sponsorId) return item;
        return { ...item, inKindDescription: text };
      })
    );
  };

  // Update custom amount if negotiated
  const handleUpdateAmount = (sponsorId: string, amount: number) => {
    onChange(
      safeSelected.map((item) => {
        if (item.sponsorId !== sponsorId) return item;
        return { ...item, amount };
      })
    );
  };

  // Remove a sponsor
  const handleRemove = (sponsorId: string) => {
    onChange(safeSelected.filter((item) => item.sponsorId !== sponsorId));
  };

  // Select all available sponsors
  const handleSelectAllAvailable = () => {
    const newItems: EventSponsorItem[] = [];

    // Keep existing
    const existingIds = new Set(safeSelected.map((i) => i.sponsorId));
    newItems.push(...safeSelected);

    for (const s of filteredSponsors) {
      if (!existingIds.has(s.id)) {
        const matchedPkg = findMatchingPackage(s);
        const tierMeta = TIER_META[s.tier] || DEFAULT_TIER;
        newItems.push({
          name: s.name,
          sponsorId: s.id,
          sponsorName: s.name,
          packageId: matchedPkg?.id,
          packageName: matchedPkg
            ? `${(TIER_META[matchedPkg.tier] || DEFAULT_TIER).name} - ${matchedPkg.packageType === "in_kind" ? "Hiện vật" : "Tiền mặt"}`
            : tierMeta.name,
          tier: (matchedPkg?.tier || s.tier) as any,
          packageType: matchedPkg?.packageType || s.packageType || "cash",
          amount: Number(matchedPkg?.price ?? s.amount ?? 0),
          inKindDescription: s.inKindDescription || matchedPkg?.inKindDescription || "",
          benefits: matchedPkg?.benefits || [],
        });
      }
    }
    onChange(newItems);
  };

  // Deselect all sponsors
  const handleDeselectAll = () => {
    onChange([]);
  };

  // Quick calculations
  const totalValue = safeSelected.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const cashTotal = safeSelected
    .filter((s) => s.packageType === "cash")
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const inKindTotal = safeSelected
    .filter((s) => s.packageType === "in_kind")
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card/60 p-4 shadow-xs">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-foreground">
                  Nhà tài trợ & Gói đồng hành
                </h4>
                {safeSelected.length > 1 ? (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 text-xs font-bold cursor-help hover:bg-primary/25 transition">
                          {safeSelected.length} nhà tài trợ (Rê chuột xem tất cả)
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="z-50 max-w-sm rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-2xl">
                        <div className="text-[11px] font-bold text-foreground mb-1 pb-1 border-b border-border">
                          Danh sách {safeSelected.length} nhà tài trợ đã chọn:
                        </div>
                        <ul className="text-xs space-y-1.5 max-h-48 overflow-y-auto">
                          {safeSelected.map((item, idx) => {
                            const meta = TIER_META[item.tier || "bronze"] || DEFAULT_TIER;
                            return (
                              <li key={item.sponsorId} className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-foreground truncate">
                                  {idx + 1}. {item.sponsorName}
                                </span>
                                <span className={`text-[10px] font-bold shrink-0 ${meta.text}`}>
                                  {meta.name} ({fmt.money(item.amount || 0)})
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {safeSelected.length} nhà tài trợ
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Chọn các nhà tài trợ bên dưới; gói tài trợ của từng nhà tài trợ sẽ xuất hiện ngay tại popup
              </p>
            </div>
          </div>
        </div>

        {safeSelected.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
              <DollarSign className="h-3.5 w-3.5" />
              Tổng: {fmt.money(totalValue)}
            </span>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
              <span>(Tiền mặt: {fmt.money(cashTotal)}</span>
              <span>•</span>
              <span>Hiện vật: {fmt.money(inKindTotal)})</span>
            </div>
          </div>
        )}
      </div>

      {/* 1. SECTION: GÓI TÀI TRỢ HIỂN THỊ TRỰC TIẾP TẠI POPUP (KHI ĐÃ CHỌN NHÀ TÀI TRỢ) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Gói tài trợ đi kèm cho sự kiện này ({safeSelected.length})</span>
          </div>
          {safeSelected.length > 0 && (
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-[11px] font-semibold text-destructive hover:underline cursor-pointer"
            >
              Gỡ tất cả
            </button>
          )}
        </div>

        {safeSelected.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground mb-2">
              <Building2 className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              Chưa chọn nhà tài trợ nào cho sự kiện
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-md mx-auto">
              Hãy tick chọn nhà tài trợ ở danh sách bên dưới. Gói tài trợ tương ứng sẽ được tự động hiển thị trực quan ngay tại đây.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {safeSelected.map((item) => {
              const tierKey = item.tier || "bronze";
              const meta = TIER_META[tierKey] || DEFAULT_TIER;
              const originalSponsor = sponsorsList.find((s) => s.id === item.sponsorId);

              return (
                <div
                  key={item.sponsorId}
                  className={`rounded-xl border ${meta.cardBorder} bg-gradient-to-r ${meta.gradient} p-3.5 shadow-xs transition-all`}
                >
                  {/* Sponsor Header */}
                  <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-border/60">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`grid h-9 w-9 place-items-center rounded-xl border text-sm font-bold shrink-0 ${meta.bg} ${meta.text} ${meta.border}`}
                      >
                        {meta.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-bold text-sm text-foreground truncate" title={item.sponsorName}>
                            {item.sponsorName}
                          </h5>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${meta.badgeBg} ${meta.text} ${meta.border}`}
                          >
                            {meta.name}
                          </span>
                        </div>
                        {originalSponsor?.contact && (
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {originalSponsor.contact} • {originalSponsor.phone || originalSponsor.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(item.sponsorId || "")}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition cursor-pointer shrink-0"
                      title="Gỡ nhà tài trợ này khỏi sự kiện"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Package Details Box (Hiển thị gói tài trợ trực tiếp tại popup) */}
                  <div className="mt-3 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-card/90 rounded-lg p-2.5 border border-border">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            Gói tài trợ:
                          </span>
                          <span className="font-bold text-xs text-foreground">
                            {item.packageName || meta.name}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.packageType === "in_kind"
                                ? "bg-purple-500/15 text-purple-700 dark:text-purple-300"
                                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            }`}
                          >
                            {item.packageType === "in_kind" ? (
                              <>
                                <Gift className="h-3 w-3" /> Tài trợ Hiện vật
                              </>
                            ) : (
                              <>
                                <DollarSign className="h-3 w-3" /> Tài trợ Tiền mặt
                              </>
                            )}
                          </span>
                        </div>

                        {/* Package benefits list */}
                        {item.benefits && item.benefits.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.benefits.map((b: string, bIdx: number) => (
                              <span
                                key={bIdx}
                                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-secondary/80 text-muted-foreground font-medium"
                              >
                                <Check className="h-2.5 w-2.5 text-primary shrink-0" />
                                <span className="truncate max-w-[240px]">{b}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Package Switcher Dropdown */}
                      <div className="shrink-0 flex items-center gap-2">
                        <label className="text-[10px] font-semibold text-muted-foreground hidden sm:inline">
                          Đổi gói:
                        </label>
                        <select
                          value={item.packageId || ""}
                          onChange={(e) => handleSwitchPackage(item.sponsorId || "", e.target.value)}
                          className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs font-semibold text-foreground focus:border-ring focus:outline-none cursor-pointer"
                        >
                          {packagesList.map((pkg) => {
                            const pMeta = TIER_META[pkg.tier] || DEFAULT_TIER;
                            return (
                              <option key={pkg.id} value={pkg.id}>
                                {pMeta.icon} {pMeta.name} ({fmt.money(pkg.price)}) -{" "}
                                {pkg.packageType === "in_kind" ? "Hiện vật" : "Tiền mặt"}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    {/* Financial value or in-kind description */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 rounded-lg bg-card/70 border border-border px-3 py-1.5">
                        <span className="text-[11px] font-medium text-muted-foreground shrink-0">
                          Giá trị tài trợ:
                        </span>
                        <input
                          type="number"
                          value={item.amount || 0}
                          onChange={(e) => handleUpdateAmount(item.sponsorId || "", Number(e.target.value) || 0)}
                          className="h-6 w-full rounded bg-transparent text-xs font-bold text-primary focus:outline-none"
                        />
                        <span className="text-[11px] font-bold text-primary shrink-0">₫</span>
                      </div>

                      {item.packageType === "in_kind" ? (
                        <div className="flex items-center gap-2 rounded-lg bg-card/70 border border-border px-3 py-1.5">
                          <Gift className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                          <input
                            type="text"
                            placeholder="Mô tả hiện vật tài trợ..."
                            value={item.inKindDescription || ""}
                            onChange={(e) => handleUpdateInKindDescription(item.sponsorId || "", e.target.value)}
                            className="h-6 w-full rounded bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-lg bg-card/70 border border-border px-3 py-1.5 text-xs text-muted-foreground">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Chuyển khoản trực tiếp vào quỹ sự kiện</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. SECTION: TRÌNH CHỌN ĐA CHỌN NHÀ TÀI TRỢ (MULTI-SELECT SPONSOR PICKER) */}
      <div className="pt-3 border-t border-border space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>Danh mục nhà tài trợ (Click để chọn vào sự kiện)</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSelectAllAvailable}
              className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
            >
              Chọn tất cả
            </button>
            <span className="text-muted-foreground text-xs">•</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Bỏ chọn tất cả
            </button>
          </div>
        </div>

        {/* Search & Tier Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm nhà tài trợ theo tên công ty, đại diện, sản phẩm..."
              className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs focus:border-ring focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar">
            {["all", "platinum", "gold", "silver", "bronze"].map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setFilterTier(tier)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer shrink-0 ${
                  filterTier === tier
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {tier === "all" ? "Tất cả" : (TIER_META[tier] || DEFAULT_TIER).name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Multi-select Checklist Grid */}
        <div className="max-h-64 overflow-y-auto space-y-1.5 rounded-xl border border-border bg-background/50 p-2">
          {loading ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Đang tải danh sách nhà tài trợ & gói đồng hành...
            </div>
          ) : filteredSponsors.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground italic">
              Không tìm thấy nhà tài trợ phù hợp với bộ lọc
            </div>
          ) : (
            filteredSponsors.map((s) => {
              const isSelected = safeSelected.some(
                (item) => item.sponsorId === s.id || item.sponsorName === s.name
              );
              const meta = TIER_META[s.tier] || DEFAULT_TIER;

              return (
                <div
                  key={s.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSponsor(s);
                  }}
                  className={`flex items-center justify-between gap-3 p-2.5 rounded-lg text-xs transition cursor-pointer select-none ${
                    isSelected
                      ? "bg-primary/10 border border-primary/40 shadow-xs"
                      : "hover:bg-muted/70 border border-border/40 bg-card"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Checkbox Icon */}
                    <div className="shrink-0 text-primary">
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground/60" />
                      )}
                    </div>

                    {/* Sponsor Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground truncate">{s.name}</span>
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold border ${meta.bg} ${meta.text} ${meta.border}`}
                        >
                          {meta.icon} {meta.name}
                        </span>
                        {s.packageType === "in_kind" ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                            <Gift className="h-3 w-3" /> Hiện vật
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <DollarSign className="h-3 w-3" /> Tiền mặt
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate mt-0.5">
                        <span>{s.contact}</span>
                        <span>•</span>
                        <span className="font-semibold text-foreground">{fmt.money(s.amount)}</span>
                        {s.inKindDescription && (
                          <>
                            <span>•</span>
                            <span className="italic truncate max-w-[200px]" title={s.inKindDescription}>
                              {s.inKindDescription}
                            </span>
                          </>
                        )}
                        {(s as any).assignedEvent && (
                          <span className="text-[10px] text-muted-foreground">
                            (Đồng hành: {(s as any).assignedEvent.name})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="shrink-0 text-right">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
                        <Check className="h-3.5 w-3.5" /> Đã chọn
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-muted-foreground hover:text-primary">
                        + Chọn
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
