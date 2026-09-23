import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { useRole } from "@/hooks/use-role";
import { Link, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useServerData } from "@/hooks/use-server-data";
import { listMyAssociationsFn, type MyAssociation } from "@/lib/associations.functions";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";
import {
  LayoutDashboard,
  Users,
  Building2,
  Tags,
  RefreshCw,
  Calendar,
  ClipboardList,
  ScanLine,
  QrCode as QrCodeIcon,
  Handshake,
  Package,
  FileBarChart,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  PieChart,
  Bell,
  Mail,
  Newspaper,
  Gift,
  Award,
  Vote,
  Users2,
  FolderOpen,
  Settings,
  History,
  Sparkles,
  MessageSquare,
  Store,
  IdCard,
  Bookmark,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Contrast,
  ChevronUp,
  ChevronDown,
  LayoutTemplate,
} from "lucide-react";
import type { TKey } from "@/lib/i18n";
import type { LucideIcon } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useTheme } from "@/lib/theme";

type Item = { key: TKey; icon: LucideIcon; to?: string; label?: string };

const overview: Item[] = [{ key: "nav.dashboard", icon: LayoutDashboard, to: "/", label: "Bảng Điều Khiển Tổng Quan" }];

// 1. MẠNG LƯỚI VIONE CONNECT (Hệ sinh thái kết nối số)
const vioneConnectSuite: Item[] = [
  {
    key: "nav.vioneNfc" as TKey,
    icon: IdCard,
    to: "/admin/business-cards",
    label: "Thẻ Thông Minh NFC & QR",
  },
  {
    key: "nav.vioneMoments" as TKey,
    icon: Sparkles,
    to: "/news",
    label: "Khoảnh Khắc Doanh Nhân",
  },
  {
    key: "nav.vioneCommunities" as TKey,
    icon: Building2,
    to: "/platform",
    label: "Cộng Đồng & Chi Hội B2B",
  },
  {
    key: "nav.vioneIntroductions" as TKey,
    icon: Handshake,
    to: "/business-connect/connections",
    label: "Kết Nối B2B & Lời Giới Thiệu",
  },
  {
    key: "nav.vioneAi" as TKey,
    icon: Sparkles,
    to: "/ai",
    label: "AI Matchmaking Doanh Nghiệp",
  },
  {
    key: "nav.vioneNetwork" as TKey,
    icon: Users,
    to: "/network",
    label: "Mạng Lưới ViOne Connect",
  },
];

// 2. GIAO THƯƠNG & B2B DEALS
const vioneCommerce: Item[] = [
  {
    key: "nav.vioneMarketplace" as TKey,
    icon: Store,
    to: "/marketplace",
    label: "Sàn Marketplace B2B",
  },
  {
    key: "nav.vioneOpportunities" as TKey,
    icon: FileBarChart,
    to: "/opportunities",
    label: "Cơ Hội Giao Thương & Deals",
  },
  {
    key: "nav.vioneQuotes" as TKey,
    icon: ClipboardList,
    to: "/marketplace/my-quotes",
    label: "Yêu Cầu Báo Giá VIP",
  },
];

// 3. DOANH NGHIỆP & HỘI VIÊN VIONE
const vioneMembers: Item[] = [
  {
    key: "nav.vioneMemberList" as TKey,
    icon: Users,
    to: "/members",
    label: "Doanh Nhân & Thành Viên",
  },
  {
    key: "nav.vioneCompanyList" as TKey,
    icon: Building2,
    to: "/companies",
    label: "Hồ Sơ Doanh Nghiệp",
  },
  {
    key: "nav.vioneCardTiers" as TKey,
    icon: Tags,
    to: "/segments",
    label: "Hạng Thẻ (Gold / Titanium)",
  },
  {
    key: "nav.vioneRenew" as TKey,
    icon: RefreshCw,
    to: "/renewal",
    label: "Gia Hạn Thẻ & Dịch Vụ",
  },
];

// 4. SỰ KIỆN & XÚC TIẾN THƯƠNG MẠI
const vioneEvents: Item[] = [
  {
    key: "nav.vioneEventList" as TKey,
    icon: Calendar,
    to: "/events",
    label: "Lịch Sự Kiện B2B",
  },
  {
    key: "nav.vioneEventReg" as TKey,
    icon: ClipboardList,
    to: "/event-registrations",
    label: "Đăng Ký & Khách Mời",
  },
  {
    key: "nav.vioneCheckin" as TKey,
    icon: QrCodeIcon,
    to: "/checkin-qr",
    label: "Soát Vé NFC & QR Pass",
  },
];

// 5. TÀI CHÍNH & TĂNG TRƯỞNG
const vioneFinance: Item[] = [
  {
    key: "nav.vioneRevenue" as TKey,
    icon: Wallet,
    to: "/fees",
    label: "Doanh Thu & Phí Dịch Vụ",
  },
  {
    key: "nav.vioneCashflow" as TKey,
    icon: ArrowDownCircle,
    to: "/income",
    label: "Sổ Quỹ Thu - Chi",
  },
  {
    key: "nav.vioneGrowthReport" as TKey,
    icon: PieChart,
    to: "/finance-report",
    label: "Báo Cáo Tăng Trưởng",
  },
];

// 6. CẤU HÌNH & BẢO MẬT
const vioneSystem: Item[] = [
  {
    key: "nav.vioneSettings" as TKey,
    icon: Settings,
    to: "/settings",
    label: "Cài Đặt Nền Tảng",
  },
  {
    key: "nav.vioneLandingTpl" as TKey,
    icon: LayoutTemplate,
    to: "/admin/landing-templates",
    label: "Landing Page Doanh Nghiệp",
  },
  {
    key: "nav.vioneAudit" as TKey,
    icon: History,
    to: "/activity",
    label: "Nhật Ký Kiểm Toán",
  },
  {
    key: "nav.vionePermissions" as TKey,
    icon: ShieldCheck,
    to: "/platform/permissions",
    label: "Ma Trận Phân Quyền",
  },
];

const COLLAPSE_KEY = "vba.sidebar.collapsed";

function isActive(pathname: string | undefined, to?: string) {
  if (!to || !pathname) return false;
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(to + "/");
}

function NavItem({
  item,
  pathname,
  collapsed,
  onNavigate,
  badge,
}: {
  item: Item;
  pathname: string | undefined;
  collapsed: boolean;
  onNavigate?: () => void;
  badge?: number;
}) {
  const t = useT();
  const Icon = item.icon;
  const active = isActive(pathname, item.to);
  const label = item.label || t(item.key);
  const showBadge = !!badge && badge > 0;
  const badgeText = badge && badge > 99 ? "99+" : String(badge ?? 0);
  const cls = `group relative flex w-full items-center gap-3 rounded-lg py-2 text-[13px] outline-none transition-[background-color,color] duration-[var(--motion-fast)] ease-out focus-visible:ring-2 focus-visible:ring-sidebar-ring ${
    collapsed ? "justify-center px-0" : "pl-3.5 pr-3"
  } ${
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
  }`;
  const badgeEl = showBadge ? (
    collapsed ? (
      <span className="vba-badge-pop absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-sidebar" />
    ) : (
      <span className="vba-badge-pop ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
        {badgeText}
      </span>
    )
  ) : null;
  const inner = (
    <>
      {active && !collapsed && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
      )}
      {active && collapsed && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
      )}
      <Icon
        className={`h-[18px] w-[18px] shrink-0 transition-transform duration-[var(--motion-fast)] ease-out ${
          active ? "text-sidebar-primary" : "group-hover:translate-x-0.5"
        }`}
        strokeWidth={active ? 2.4 : 1.9}
      />
      {!collapsed && <span className="flex-1 truncate text-left font-medium">{label}</span>}
      {badgeEl}
    </>
  );
  if (item.to) {
    return (
      <Link
        to={item.to}
        data-active={active ? "true" : undefined}
        className={cls}
        onClick={onNavigate}
        title={collapsed ? label : undefined}
      >
        {inner}
      </Link>
    );
  }
  return (
    <button
      data-active={active ? "true" : undefined}
      className={cls}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
    >
      {inner}
    </button>
  );
}

function Group({
  label,
  items,
  pathname,
  collapsed,
  onNavigate,
  badges,
}: {
  label?: string;
  items: Item[];
  pathname: string | undefined;
  collapsed: boolean;
  onNavigate?: () => void;
  badges?: Record<string, number>;
}) {
  const t = useT();
  const displayLabel = label ? (label.startsWith("nav.") ? t(label as TKey) : label) : undefined;
  return (
    <div className={collapsed ? "px-2.5" : "px-3"}>
      {displayLabel &&
        (collapsed ? (
          <div className="mx-2 mb-1.5 mt-1 h-px bg-sidebar-border/50" />
        ) : (
          <div className="mb-1.5 px-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-sidebar-foreground/50 flex items-center justify-between">
            <span>{displayLabel}</span>
          </div>
        ))}
      <div className="space-y-[3px]">
        {items.map((it) => (
          <NavItem
            key={it.key}
            item={it}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={onNavigate}
            badge={it.to ? badges?.[it.to] : undefined}
          />
        ))}
      </div>
    </div>
  );
}

export function Sidebar({
  mobile = false,
  onNavigate,
}: { mobile?: boolean; onNavigate?: () => void } = {}) {
  const t = useT();
  const { isPlatformAdmin, isAdmin, roles } = useRole();
  const isTongThuKy = roles.some((r) => String(r) === "tong_thu_ky");
  const isBanThanhVien = roles.some((r) => String(r) === "truong_ban_thanh_vien");
  const isBanTaiChinh = roles.some((r) => String(r) === "truong_ban_tai_chinh");
  const isBanTruyenThong = roles.some((r) => String(r) === "truong_ban_truyen_thong");
  const isBanXucTien = roles.some((r) => String(r) === "truong_ban_xuc_tien");

  // Scoped permissions according to the permission matrix:
  const canViewMembers = isPlatformAdmin || isAdmin || isTongThuKy || isBanThanhVien;
  const canViewEvents = isPlatformAdmin || isAdmin || isTongThuKy || isBanTruyenThong || isBanXucTien;
  const canViewSponsors = isPlatformAdmin || isAdmin || isTongThuKy || isBanTaiChinh;
  const canViewFinance = isPlatformAdmin || isAdmin || isTongThuKy || isBanTaiChinh;
  const canViewComm = isPlatformAdmin || isAdmin || isTongThuKy || isBanTruyenThong;
  const canViewGovernance = isPlatformAdmin || isAdmin || isTongThuKy || isBanThanhVien;
  const canViewNetwork = isPlatformAdmin || isAdmin || isTongThuKy || isBanXucTien;
  const canViewBusinessConnect = isPlatformAdmin || isAdmin || isTongThuKy || isBanXucTien;
  const canViewSystem = isPlatformAdmin || isAdmin;

  const pathname = useRouterState({ select: (s) => s?.location?.pathname });

  const fetchMine = useServerFn(listMyAssociationsFn);
  const { data: myAssocs, reload } = useServerData<MyAssociation[]>(() => fetchMine(), []);
  const activeAssoc = myAssocs?.find((a) => a.isActive) ?? myAssocs?.[0];
  const brandName = activeAssoc?.name ?? t("brand.name");

  const unreadNotify = useUnreadNotifications();
  const badges: Record<string, number> = { "/notifications": unreadNotify };

  useEffect(() => {
    const onChange = () => reload();
    window.addEventListener("association-changed", onChange);
    return () => window.removeEventListener("association-changed", onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Collapse only applies to the desktop sidebar; the mobile drawer is always full.
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [bottomExpanded, setBottomExpanded] = useState(false);

  useEffect(() => {
    if (mobile) return;
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, [mobile]);

  // Restore scroll position & auto-scroll active item into view
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("crm_sidebar_scroll_top");
      if (saved && scrollRef.current) {
        scrollRef.current.scrollTop = Number(saved);
      }
    } catch {
      /* ignore */
    }

    const timer = setTimeout(() => {
      const activeEl = scrollRef.current?.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    try {
      sessionStorage.setItem("crm_sidebar_scroll_top", String(e.currentTarget.scrollTop));
    } catch {
      /* ignore */
    }
  };

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const isCollapsed = !mobile && collapsed;
  const visibility = mobile ? "flex" : "hidden lg:flex";
  const width = isCollapsed ? "w-[72px]" : "w-[260px]";

  return (
    <aside
      className={`${visibility} ${mobile ? "h-dvh" : "sticky top-0 h-dvh"} ${width} shrink-0 flex-col border-r border-sidebar-border transition-[width] duration-[var(--motion-slow)] ease-out`}
      style={{ background: "var(--gradient-sidebar)" }}
    >
      {/* Logo */}
      <div
        className={`flex h-[72px] items-center gap-3 border-b border-sidebar-border ${
          isCollapsed ? "justify-center px-2" : "px-5"
        }`}
      >
        {activeAssoc?.logoUrl ? (
          <img
            src={activeAssoc.logoUrl}
            alt={brandName}
            className="h-10 w-10 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold text-primary-foreground"
            style={{ background: "var(--gradient-card)" }}
          >
            VBA
          </div>
        )}
        {!isCollapsed && (
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[13.5px] font-extrabold tracking-wide text-sidebar-foreground flex items-center gap-1.5">
              <span>ViOne Connect</span>
              <span className="rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-black px-1.5 py-0.5 border border-amber-500/30">
                CRM 5.0
              </span>
            </div>
            <div className="truncate text-[10px] font-semibold text-sidebar-foreground/60 uppercase tracking-wider mt-0.5">
              Hệ Điều Hành Doanh Nhân
            </div>
          </div>
        )}
        {!mobile && !isCollapsed && (
          <button
            onClick={toggle}
            aria-label={t("nav.collapse")}
            title={t("nav.collapse")}
            className="shrink-0 rounded-lg p-1.5 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <PanelLeftClose className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>

      {/* Collapsed expand button */}
      {!mobile && isCollapsed && (
        <div className="flex justify-center pt-2">
          <button
            onClick={toggle}
            aria-label={t("nav.expand")}
            title={t("nav.expand")}
            className="rounded-lg p-1.5 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          </button>
        </div>
      )}

      {/* Nav */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="sidebar-scroll flex-1 space-y-5 overflow-y-auto py-4"
      >
        <Group
          items={overview}
          pathname={pathname}
          collapsed={isCollapsed}
          onNavigate={onNavigate}
        />

        {/* 1. MẠNG LƯỚI VIONE CONNECT */}
        <Group
          label="MẠNG LƯỚI VIONE CONNECT"
          items={vioneConnectSuite}
          pathname={pathname}
          collapsed={isCollapsed}
          onNavigate={onNavigate}
        />

        {/* 2. GIAO THƯƠNG & B2B DEALS */}
        <Group
          label="GIAO THƯƠNG & B2B DEALS"
          items={vioneCommerce}
          pathname={pathname}
          collapsed={isCollapsed}
          onNavigate={onNavigate}
        />

        {/* 3. DOANH NGHIỆP & HỘI VIÊN VIONE */}
        <Group
          label="DOANH NGHIỆP & THÀNH VIÊN"
          items={vioneMembers}
          pathname={pathname}
          collapsed={isCollapsed}
          onNavigate={onNavigate}
        />

        {/* 4. SỰ KIỆN & XÚC TIẾN */}
        <Group
          label="SỰ KIỆN & CHECK-IN B2B"
          items={vioneEvents}
          pathname={pathname}
          collapsed={isCollapsed}
          onNavigate={onNavigate}
        />

        {/* 5. TÀI CHÍNH & TĂNG TRƯỞNG */}
        <Group
          label="TÀI CHÍNH & DOANH THU"
          items={vioneFinance}
          pathname={pathname}
          collapsed={isCollapsed}
          onNavigate={onNavigate}
        />

        {/* 6. CẤU HÌNH & BẢO MẬT */}
        <Group
          label="CẤU HÌNH & HỆ THỐNG"
          items={vioneSystem}
          pathname={pathname}
          collapsed={isCollapsed}
          onNavigate={onNavigate}
        />
      </div>

      {/* Theme switcher & Enterprise bar — có thể thu nhỏ cố định hoặc phóng to */}
      {isCollapsed ? (
        <div className="flex items-center justify-center border-t border-sidebar-border pb-2 pt-3 px-2">
          <ThemeToggleIconBtn />
        </div>
      ) : !bottomExpanded ? (
        /* Cố định thu nhỏ: thanh ngang nhỏ gọn, tiết kiệm diện tích tối đa */
        <div className="border-t border-sidebar-border px-3 py-2.5">
          <div className="flex w-full items-center justify-between gap-2">
            <ThemeSwitcher />
            <button
              type="button"
              onClick={() => setBottomExpanded(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary transition hover:bg-primary/20 cursor-pointer"
              title="Mở rộng xem gói Enterprise"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="truncate max-w-[68px]">Enterprise</span>
              <ChevronUp className="h-3.5 w-3.5 opacity-70" />
            </button>
          </div>
        </div>
      ) : (
        /* Trạng thái mở rộng: hiển thị đầy đủ Theme Switcher và Card Enterprise với nút thu nhỏ */
        <>
          <div className="flex items-center border-t border-sidebar-border px-4 pb-2 pt-3">
            <div className="flex w-full items-center justify-between">
              <span className="text-[11px] font-medium text-sidebar-foreground/60">
                {t("theme.label")}
              </span>
              <div className="flex items-center gap-2">
                <ThemeSwitcher />
                <button
                  type="button"
                  onClick={() => setBottomExpanded(false)}
                  className="rounded-lg p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer"
                  title="Thu nhỏ cố định"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 pt-1">
            <div
              className="relative overflow-hidden rounded-xl border border-border/10 p-4 text-primary-foreground shadow-[var(--shadow-card)]"
              style={{ background: "var(--gradient-card)" }}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <div className="text-[13px] font-semibold">{t("upgrade.title")}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setBottomExpanded(false)}
                  className="rounded-md p-1 text-primary-foreground/70 transition hover:bg-white/10 hover:text-white cursor-pointer"
                  title="Thu nhỏ cố định"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mb-3 text-[11px] leading-relaxed text-primary-foreground/85">
                {t("upgrade.body")}
              </p>
              <button className="w-full rounded-lg bg-card/15 py-2 text-xs font-semibold backdrop-blur transition hover:bg-card/25 cursor-pointer">
                {t("upgrade.cta")}
              </button>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

/** Mini cycling icon button dùng khi sidebar thu gọn. */
function ThemeToggleIconBtn() {
  const { theme, toggle } = useTheme();
  const icons = { light: Sun, dark: Moon, contrast: Contrast };
  const Icon = icons[theme];
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Đổi giao diện"
      title="Đổi giao diện"
      className="flex h-9 w-9 items-center justify-center rounded-full text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
