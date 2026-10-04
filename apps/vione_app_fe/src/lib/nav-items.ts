import {
  LayoutDashboard,
  Users,
  Building2,
  Tags,
  RefreshCw,
  Calendar,
  ClipboardList,
  ScanLine,
  QrCode,
  Handshake,
  Package,
  FileBarChart,
  Wallet,
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
  ShieldCheck,
  UserCog,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TKey } from "@/lib/i18n";

export type NavItem = {
  key: TKey;
  icon: LucideIcon;
  to: string;
  label?: string;
  platformOnly?: boolean;
};

export type NavGroup = {
  label?: string;
  groupKey?: TKey;
  items: NavItem[];
  platformOnly?: boolean;
};

/**
 * Danh sách phân nhóm điều hướng chuẩn của Hệ thống ViOne CRM
 * Đồng bộ chính xác 100% với Sidebar và Breadcrumbs
 */
export const navGroups: NavGroup[] = [
  {
    label: "NGHIỆP VỤ CỐT LÕI",
    items: [
      { key: "nav.dashboard", icon: LayoutDashboard, to: "/", label: "Tổng quan" },
      { key: "nav.vioneMemberList" as TKey, icon: Users, to: "/members", label: "Khách hàng (CRM)" },
      { key: "nav.vioneMessages" as TKey, icon: MessageSquare, to: "/messages", label: "Hộp thư đa kênh" },
      { key: "nav.vioneAi" as TKey, icon: Sparkles, to: "/ai", label: "Tự động hóa" },
      { key: "nav.vioneCompanyList" as TKey, icon: Building2, to: "/companies", label: "Hồ sơ doanh nghiệp" },
      { key: "nav.vioneCardTiers" as TKey, icon: Tags, to: "/segments", label: "Hạng thẻ (Gold / Titanium)" },
      { key: "nav.vioneRenew" as TKey, icon: RefreshCw, to: "/renewal", label: "Gia hạn thẻ & dịch vụ" },
    ],
  },
  {
    label: "TIỆN ÍCH & GIAO THƯƠNG",
    items: [
      { key: "nav.vioneMarketplace" as TKey, icon: Store, to: "/marketplace", label: "Sàn Sản Phẩm & Dịch Vụ" },
      { key: "nav.vioneOpportunities" as TKey, icon: FileBarChart, to: "/opportunities", label: "Cơ Hội Giao Thương & Hợp Tác" },
      { key: "nav.vioneQuotes" as TKey, icon: ClipboardList, to: "/marketplace/my-quotes", label: "Yêu Cầu Báo Giá VIP" },
    ],
  },
  {
    label: "SỰ KIỆN & ĐIỂM DANH",
    items: [
      { key: "nav.vioneEventList" as TKey, icon: Calendar, to: "/events", label: "Lịch Sự Kiện" },
      { key: "nav.vioneEventReg" as TKey, icon: ClipboardList, to: "/event-registrations", label: "Đăng Ký & Khách Mời" },
      { key: "nav.vioneCheckin" as TKey, icon: QrCode, to: "/checkin-qr", label: "Soát Vé NFC & QR Pass" },
      { key: "eventsOverview.title" as TKey, icon: Calendar, to: "/events-overview", label: "Tổng quan sự kiện" },
      { key: "nav.checkin" as TKey, icon: ScanLine, to: "/checkin", label: "Máy quét soát vé" },
    ],
  },
  {
    label: "TÀI CHÍNH & DOANH THU",
    items: [
      { key: "nav.vioneRevenue" as TKey, icon: Wallet, to: "/fees", label: "Doanh Thu & Phí Dịch Vụ" },
      { key: "nav.vioneCashflow" as TKey, icon: ArrowLeftRight, to: "/income", label: "Sổ Quỹ Thu - Chi" },
      { key: "nav.vioneGrowthReport" as TKey, icon: PieChart, to: "/finance-report", label: "Báo Cáo Tăng Trưởng" },
    ],
  },
  {
    label: "CẤU HÌNH & HỆ THỐNG",
    items: [
      { key: "nav.vioneSettings" as TKey, icon: Settings, to: "/settings", label: "Cài Đặt Hệ Thống" },
      { key: "nav.vioneAudit" as TKey, icon: History, to: "/activity", label: "Nhật Ký Kiểm Toán" },
      { key: "nav.account" as TKey, icon: UserCog, to: "/account-settings", label: "Tài khoản cá nhân" },
      { key: "nav.platform" as TKey, icon: ShieldCheck, to: "/platform", label: "Quản trị Nền Tảng & Phân Quyền", platformOnly: true },
    ],
  },
];
