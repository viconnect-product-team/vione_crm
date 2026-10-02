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
  Kanban,
  Activity,
  UserCheck,
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
import { useAuth } from "@/context/AuthContext";
import { ProfileMenu } from "@/components/dashboard/ProfileMenu";

type Item = { key: TKey; icon: LucideIcon; to?: string; label?: string; badge?: string | number };

// 4 Mục điều hướng cốt lõi theo thiết kế Vione CRM Figma
const vioneCoreNav: Item[] = [
  { key: "nav.dashboard", icon: LayoutDashboard, to: "/", label: "Tổng quan" },
  { key: "nav.vioneMemberList" as TKey, icon: Users, to: "/members", label: "Khách hàng (CRM)" },
  { key: "nav.vioneMessages" as TKey, icon: MessageSquare, to: "/messages", label: "Hộp thư đa kênh", badge: "12" },
  { key: "nav.vioneAi" as TKey, icon: Sparkles, to: "/ai", label: "Tự động hóa", badge: "New" },
];

const overview: Item[] = [{ key: "nav.dashboard", icon: LayoutDashboard, to: "/", label: "Tổng quan" }];

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

// QUY TRÌNH & VẬN HÀNH DOANH NGHIỆP (BRD ViOne Platform 5.0)
const vioneWorkflowSuite: Item[] = [
  {
    key: "nav.vioneWorkflow" as TKey,
    icon: Kanban,
    to: "/workflow",
    label: "Quy Trình & Công Việc",
    badge: "BPMN",
  },
  {
    key: "nav.vioneWorkload" as TKey,
    icon: Activity,
    to: "/workload",
    label: "Theo Dõi Nhân Viên & Tải Việc",
    badge: "Heatmap",
  },
  {
    key: "nav.vioneAttendance" as TKey,
    icon: UserCheck,
    to: "/attendance",
    label: "Chấm Công & Ca Làm Việc",
    badge: "GPS 50m",
  },
  {
    key: "nav.vioneApprovals" as TKey,
    icon: ShieldCheck,
    to: "/payment-approvals",
    label: "Phê Duyệt Chi Tiền 3 Cấp",
    badge: "3-Tier",
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
    key: "nav.vioneMeetings" as TKey,
    icon: Handshake,
    to: "/business-connect/meetings",
    label: "Quản Lý Cuộc Gặp",
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
  badge?: string | number;
}) {
  const t = useT();
  const Icon = item.icon;
  const active = isActive(pathname, item.to);
  const label = item.label || t(item.key);
  const badgeVal = item.badge ?? badge;
  const showBadge = badgeVal !== undefined && badgeVal !== null && badgeVal !== "";

  const cls = `group relative flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-all duration-150 outline outline-1 outline-offset-[-1px] cursor-pointer ${
    collapsed ? "justify-center px-2 py-2.5" : ""
  } ${
    active
      ? "bg-blue-600 text-white font-bold outline-blue-500 shadow-md shadow-blue-600/30"
      : "bg-transparent outline-transparent text-slate-300 hover:text-white hover:bg-slate-900 font-medium"
  }`;

  const renderBadge = () => {
    if (!showBadge) return null;
    if (collapsed) {
      return (
        <span
          className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full ${
            badgeVal === "New" ? "bg-amber-500" : "bg-blue-600"
          }`}
        />
      );
    }
    if (badgeVal === "New") {
      return (
        <div className="px-2 py-0.5 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
          <span className="text-white text-[10px] font-bold font-['Inter'] leading-none">New</span>
        </div>
      );
    }
    return (
      <div className="px-2 py-0.5 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
        <span className="text-white text-[10px] font-bold font-['Inter'] leading-none">{badgeVal}</span>
      </div>
    );
  };

  const inner = (
    <div className="flex items-center gap-3 w-full">
      <div className="size-4 shrink-0 flex items-center justify-center">
        <Icon
          className={`size-4 transition-colors ${
            active ? "text-white" : "text-slate-400 group-hover:text-white"
          }`}
          strokeWidth={active ? 2.2 : 1.9}
        />
      </div>
      {!collapsed && (
        <span
          className={`flex-1 truncate text-left font-['Inter'] text-[13.5px] ${
            active ? "text-white font-bold" : "text-slate-200 group-hover:text-white"
          }`}
        >
          {label}
        </span>
      )}
      {!collapsed && renderBadge()}
    </div>
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
    <div className={collapsed ? "px-2" : "px-3"}>
      {displayLabel &&
        (collapsed ? (
          <div className="mx-2 mb-2 mt-2 h-px bg-slate-800" />
        ) : (
          <div className="mb-2 mt-4 px-3 flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 select-none">
              {displayLabel}
            </span>
          </div>
        ))}
      <div className="space-y-1">
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

  // Keep sidebar at top on dashboard home
  useEffect(() => {
    if (pathname === "/" && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [pathname]);

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
      className={`${visibility} ${mobile ? "h-dvh" : "sticky top-0 h-dvh"} ${width} shrink-0 flex-col bg-slate-950 border-r border-slate-800/80 transition-[width] duration-[var(--motion-slow)] ease-out justify-between select-none text-white`}
    >
      {/* ── Top Header & Core Nav ─────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Logo */}
        <div
          className={`flex h-[76px] items-center gap-2.5 border-b border-slate-800/80 ${
            isCollapsed ? "justify-center px-2" : "px-6"
          }`}
        >
          <div className="w-8 h-8 bg-gradient-to-l from-blue-900 via-blue-600 to-blue-900 rounded-lg inline-flex flex-col justify-center items-center shrink-0 shadow-md">
            <span className="text-white text-lg font-extrabold font-['Inter'] leading-none">V</span>
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-white text-xl font-extrabold font-['Inter'] tracking-tight">Vione</span>
              <span className="rounded bg-blue-600/20 text-blue-400 text-[10px] font-bold px-1.5 py-0.5 border border-blue-500/30">
                CRM
              </span>
            </div>
          )}
          {!mobile && !isCollapsed && (
            <button
              onClick={toggle}
              aria-label={t("nav.collapse")}
              title={t("nav.collapse")}
              className="ml-auto shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-900 hover:text-white cursor-pointer"
            >
              <PanelLeftClose className="h-4 w-4" />
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
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-900 hover:text-white cursor-pointer"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Nav Container with Scroll */}
        <div
          ref={scrollRef}
          className="sidebar-scroll flex-1 space-y-4 overflow-y-auto py-5"
        >
          {/* Core 4 Vione CRM navigation items matching Figma design */}
          <div className={isCollapsed ? "px-2" : "px-3"}>
            {!isCollapsed && (
              <div className="mb-2 px-3 flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 select-none">
                  NGHIỆP VỤ CỐT LÕI
                </span>
              </div>
            )}
            <div className="space-y-1">
              {vioneCoreNav.map((it) => (
                <NavItem
                  key={it.key}
                  item={it}
                  pathname={pathname}
                  collapsed={isCollapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>

          {/* Divider */}
          {!isCollapsed && (
            <div className="px-6 pt-3 pb-1">
              <div className="h-px w-full bg-slate-800/80" />
            </div>
          )}

          {/* BRD Quy Trình & Vận Hành Doanh Nghiệp */}
          <Group
            label="QUY TRÌNH & VẬN HÀNH"
            items={vioneWorkflowSuite}
            pathname={pathname}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
          />

          {/* Additional CRM Modules */}
          <Group
            label="TIỆN ÍCH & GIAO THƯƠNG"
            items={vioneCommerce}
            pathname={pathname}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
          />

          <Group
            label="SỰ KIỆN & CHECK-IN B2B"
            items={vioneEvents}
            pathname={pathname}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
          />

          <Group
            label="TÀI CHÍNH & DOANH THU"
            items={vioneFinance}
            pathname={pathname}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
          />

          <Group
            label="CẤU HÌNH & HỆ THỐNG"
            items={vioneSystem}
            pathname={pathname}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      {/* ── Profile Footer matching user's design ──────────────────────── */}
      <div className={`border-t border-slate-800/80 bg-slate-950 w-full shrink-0 ${isCollapsed ? "p-2" : "p-3"}`}>
        <ProfileMenu variant="sidebar" collapsed={isCollapsed} />
      </div>
    </aside>
  );
}

/** Mini cycling icon button dùng khi sidebar thu gọn. */
function ThemeToggleIconBtn() {
  const { theme, toggle } = useTheme();
  const icons: Record<string, any> = { light: Sun, dark: Moon, contrast: Contrast };
  const Icon = icons[theme] || Sun;
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
