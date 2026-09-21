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

const overview: Item[] = [{ key: "nav.dashboard", icon: LayoutDashboard, to: "/" }];
const members: Item[] = [
  { key: "nav.members", icon: Users, to: "/members" },
  { key: "nav.companies", icon: Building2, to: "/companies" },
  { key: "nav.memberSeg", icon: Tags, to: "/segments" },
  { key: "nav.renewal", icon: RefreshCw, to: "/renewal" },
];
const events: Item[] = [
  { key: "nav.events", icon: Calendar, to: "/events" },
  { key: "eventsOverview.title", icon: Calendar, to: "/events-overview" },
  { key: "nav.eventReg", icon: ClipboardList, to: "/event-registrations" },
  { key: "nav.checkin", icon: ScanLine, to: "/checkin" },
  { key: "checkinQr.title", icon: QrCodeIcon, to: "/checkin-qr" },
];
const sponsors: Item[] = [
  { key: "nav.sponsors", icon: Handshake, to: "/sponsors" },
  { key: "nav.sponsorPkg", icon: Package, to: "/sponsor-packages" },
  { key: "nav.sponsorReport", icon: FileBarChart, to: "/sponsor-report" },
];
const finance: Item[] = [
  { key: "nav.fee", icon: Wallet, to: "/fees" },
  { key: "nav.income", icon: ArrowDownCircle, to: "/income" },
  { key: "nav.expenses" as TKey, icon: ArrowUpCircle, to: "/expenses" },
  { key: "nav.financeReport", icon: PieChart, to: "/finance-report" },
];
const comm: Item[] = [
  { key: "nav.notify", icon: Bell, to: "/notifications" },
  { key: "nav.email", icon: Mail, to: "/email-marketing" },
  { key: "nav.news", icon: Newspaper, to: "/news" },
  { key: "nav.perks", icon: Gift, to: "/perks" },
  { key: "nav.benefits", icon: Award, to: "/benefits" },
];
const governance: Item[] = [
  { key: "nav.governance", icon: Vote, to: "/voting" },
  { key: "nav.meeting", icon: Users2, to: "/meetings" },
  { key: "nav.documents", icon: FolderOpen, to: "/documents" },
];
const network: Item[] = [
  { key: "nav.network", icon: MessageSquare, to: "/network" },
  { key: "nav.businessCards", icon: IdCard, to: "/business-cards" },
  { key: "nav.marketplace", icon: Store, to: "/marketplace" },
  { key: "nav.opportunities", icon: Sparkles, to: "/opportunities" },
];
const businessConnect: Item[] = [
  { key: "nav.bc.overview", icon: LayoutDashboard, to: "/business-connect" },
  { key: "nav.bc.myCard", icon: IdCard, to: "/business-connect/my-card" },
  { key: "nav.bc.saved", icon: Bookmark, to: "/business-connect/saved-cards" },
  { key: "nav.bc.connections", icon: Handshake, to: "/business-connect/connections" },
  { key: "nav.bc.meetings", icon: Users2, to: "/business-connect/meetings" },
  {
    key: "nav.landingTemplates" as TKey,
    icon: LayoutTemplate,
    to: "/admin/landing-templates",
    label: "Template Landing",
  },
];
const system: Item[] = [
  { key: "nav.settings", icon: Settings, to: "/settings" },
  { key: "nav.activity", icon: History, to: "/activity" },
];
const platform: Item[] = [{ key: "nav.platform", icon: ShieldCheck, to: "/platform" }];
const admin: Item[] = [
  {
    key: "nav.bcAdmin",
    icon: IdCard,
    to: "/admin/business-cards",
    label: "Quản lý Thẻ Doanh Nhân",
  },
  {
    key: "nav.landingTemplates" as TKey,
    icon: LayoutTemplate,
    to: "/admin/landing-templates",
    label: "Template Landing",
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
  label?: TKey;
  items: Item[];
  pathname: string | undefined;
  collapsed: boolean;
  onNavigate?: () => void;
  badges?: Record<string, number>;
}) {
  const t = useT();
  return (
    <div className={collapsed ? "px-2.5" : "px-3"}>
      {label &&
        (collapsed ? (
          <div className="mx-2 mb-1.5 mt-1 h-px bg-sidebar-border/50" />
        ) : (
          <div className="mb-1 px-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/45">
            {t(label)}
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
            <div className="truncate text-[13px] font-semibold text-sidebar-foreground">
              {brandName}
            </div>
            <div className="truncate text-[11px] text-sidebar-foreground/60">
              {t("brand.tagline")}
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
        {canViewMembers && (
          <Group
            label="nav.group.members"
            items={members}
            pathname={pathname}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        )}
        {canViewEvents && (
          <Group
            label="nav.group.events"
            items={events}
            pathname={pathname}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        )}
        {canViewSponsors && (
          <Group
            label="nav.group.sponsors"
            items={sponsors}
            pathname={pathname}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        )}
        {canViewFinance && (
          <Group
            label="nav.group.finance"
            items={finance}
            pathname={pathname}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        )}
        {canViewComm && (
          <Group
            label="nav.group.comm"
            items={comm}
            pathname={pathname}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
            badges={badges}
          />
        )}
        {canViewGovernance && (
          <Group
            label="nav.group.governance"
            items={governance}
            pathname={pathname}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        )}
        {canViewNetwork && (
          <Group
            label="nav.group.network"
            items={network}
            pathname={pathname}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        )}
        {canViewBusinessConnect && (
          <Group
            label="nav.group.bc"
            items={businessConnect}
            pathname={pathname}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        )}
        {canViewSystem && (
          <Group
            label="nav.group.system"
            items={system}
            pathname={pathname}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        )}
        {(isAdmin || isPlatformAdmin) && (
          <Group
            label="nav.group.admin"
            items={admin}
            pathname={pathname}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        )}
        {isPlatformAdmin && (
          <Group
            label="nav.group.platform"
            items={platform}
            pathname={pathname}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        )}
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
