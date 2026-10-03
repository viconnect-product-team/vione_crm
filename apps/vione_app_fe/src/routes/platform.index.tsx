import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Boxes,
  ShieldCheck,
  KeyRound,
  Users,
  Kanban,
  UserCheck,
  FileBarChart,
  Store,
  Wallet,
  Calendar,
  Sparkles,
  Building2,
  Lock,
  ArrowRight,
  CheckCircle2,
  Settings,
  Activity,
  Layers,
} from "lucide-react";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { Card, PageHeader, StatCard } from "@/components/dashboard/PageKit";
import { useRole } from "@/hooks/use-role";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/platform/")({
  component: PlatformModulesPage,
});

export interface PlatformModule {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string;
  route: string;
  icon: any;
  tone: "navy" | "gold" | "green" | "amber" | "rose" | "blue";
  activeRoles: string[];
  supportedActions: ("view" | "create" | "edit" | "delete" | "approve" | "export")[];
  stats: {
    totalRecords: string;
    activeUsers: string;
  };
}

export const PLATFORM_MODULES: PlatformModule[] = [
  {
    id: "mod-workflow",
    name: "Điều Hành & Quy Trình Công Việc",
    code: "WORKFLOW_OPS",
    category: "Vận Hành & Điều Hành",
    description: "Quản lý tiến độ công việc, luồng phối hợp liên phòng ban và tự động hóa xử lý tác vụ doanh nghiệp.",
    route: "/workflow",
    icon: Kanban,
    tone: "navy",
    activeRoles: ["CEO", "COO", "Sales Manager", "Staff"],
    supportedActions: ["view", "create", "edit", "delete", "approve", "export"],
    stats: { totalRecords: "24 quy trình", activeUsers: "18 người dùng" },
  },
  {
    id: "mod-attendance",
    name: "Nhân Sự & Giám Sát Chấm Công",
    code: "HR_ATTENDANCE",
    category: "Vận Hành & Điều Hành",
    description: "Chấm công định vị tại văn phòng, nhận diện chính chủ, phân ca làm việc và biểu đồ phân bổ tải việc.",
    route: "/attendance",
    icon: UserCheck,
    tone: "blue",
    activeRoles: ["CEO", "COO", "Staff"],
    supportedActions: ["view", "create", "edit", "approve", "export"],
    stats: { totalRecords: "12 ca làm việc", activeUsers: "25 nhân viên" },
  },
  {
    id: "mod-crm",
    name: "Khách Hàng & Cơ Hội Kinh Doanh",
    code: "CRM_OPPORTUNITIES",
    category: "Giao Thương & Khách Hàng",
    description: "Quản trị danh bạ khách hàng, hồ sơ liên hệ, phễu cơ hội kinh doanh và lịch sử chăm sóc đối tác.",
    route: "/members",
    icon: Users,
    tone: "gold",
    activeRoles: ["CEO", "Sales Manager", "Staff", "Partner"],
    supportedActions: ["view", "create", "edit", "delete", "export"],
    stats: { totalRecords: "150 khách hàng", activeUsers: "14 chuyên viên" },
  },
  {
    id: "mod-products",
    name: "Sàn Sản Phẩm & Dịch Vụ Doanh Nghiệp",
    code: "MARKETPLACE_PRODUCTS",
    category: "Giao Thương & Khách Hàng",
    description: "Niêm yết danh mục sản phẩm, giới thiệu giải pháp dịch vụ doanh nghiệp và tiếp nhận yêu cầu báo giá.",
    route: "/marketplace",
    icon: Store,
    tone: "green",
    activeRoles: ["CEO", "Sales Manager", "Partner"],
    supportedActions: ["view", "create", "edit", "delete", "export"],
    stats: { totalRecords: "178 sản phẩm", activeUsers: "32 doanh nghiệp" },
  },
  {
    id: "mod-finance",
    name: "Tài Chính & Phê Duyệt Ngân Sách",
    code: "FINANCE_APPROVALS",
    category: "Tài Chính & Kế Toán",
    description: "Quản lý dòng tiền thu - chi, lập kế hoạch ngân sách và quy trình phê duyệt chi tiền 3 cấp minh bạch.",
    route: "/payment-approvals",
    icon: Wallet,
    tone: "rose",
    activeRoles: ["CEO", "CFO", "COO"],
    supportedActions: ["view", "create", "edit", "approve", "export"],
    stats: { totalRecords: "85 khoản chi", activeUsers: "6 lãnh đạo" },
  },
  {
    id: "mod-events",
    name: "Sự Kiện & Điểm Danh Doanh Nghiệp",
    code: "EVENTS_CHECKIN",
    category: "Kết Nối & Hội Nghị",
    description: "Tổ chức hội thảo doanh nghiệp, quản lý vé mời, danh sách khách tham dự và điểm danh quét mã QR tức thì.",
    route: "/events",
    icon: Calendar,
    tone: "amber",
    activeRoles: ["CEO", "COO", "Sales Manager", "Staff", "Partner"],
    supportedActions: ["view", "create", "edit", "delete", "export"],
    stats: { totalRecords: "16 sự kiện", activeUsers: "450 lượt tham dự" },
  },
  {
    id: "mod-ai",
    name: "Trợ Lý Trí Tuệ Nhân Tạo AI Copilot",
    code: "AI_AUTOMATION",
    category: "Trí Tuệ Nhân Tạo & Tự Động Hóa",
    description: "AI đàm thoại điều hành, OCR quét danh thiếp thông minh, tự động hóa nhập liệu bảng tính và soạn thảo văn bản hợp đồng.",
    route: "/ai",
    icon: Sparkles,
    tone: "blue",
    activeRoles: ["CEO", "COO", "CFO", "Sales Manager", "Admin"],
    supportedActions: ["view", "create", "export"],
    stats: { totalRecords: "1,240 yêu cầu AI", activeUsers: "Toàn hệ thống" },
  },
  {
    id: "mod-company",
    name: "Quản Trị Doanh Nghiệp & Thành Viên",
    code: "COMPANY_MEMBERSHIP",
    category: "Quản Trị Tổ Chức",
    description: "Hồ sơ pháp lý doanh nghiệp, xếp hạng thẻ thành viên, theo dõi thời hạn và gia hạn dịch vụ tài khoản.",
    route: "/companies",
    icon: Building2,
    tone: "gold",
    activeRoles: ["CEO", "Admin", "Sales Manager"],
    supportedActions: ["view", "create", "edit", "delete", "export"],
    stats: { totalRecords: "48 doanh nghiệp", activeUsers: "Admin & CEO" },
  },
  {
    id: "mod-system",
    name: "Hạ Tầng, Bảo Mật & Nhật Ký Kiểm Toán",
    code: "SECURITY_AUDIT",
    category: "Quản Trị Hệ Thống",
    description: "Kiểm soát an toàn dữ liệu, giám sát phiên làm việc, lưu trữ nhật ký thao tác và bảo mật quyền truy cập RBAC.",
    route: "/activity",
    icon: Lock,
    tone: "navy",
    activeRoles: ["Admin", "CEO"],
    supportedActions: ["view", "export"],
    stats: { totalRecords: "15,800 bản ghi", activeUsers: "Ban Quản Trị" },
  },
];

const TONE_BADGES: Record<string, { bg: string; fg: string }> = {
  navy: { bg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300", fg: "text-slate-700 dark:text-slate-300" },
  gold: { bg: "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300", fg: "text-amber-700 dark:text-amber-300" },
  green: { bg: "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300", fg: "text-emerald-700 dark:text-emerald-300" },
  amber: { bg: "bg-orange-100 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300", fg: "text-orange-700 dark:text-orange-300" },
  rose: { bg: "bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300", fg: "text-rose-700 dark:text-rose-300" },
  blue: { bg: "bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300", fg: "text-blue-700 dark:text-blue-300" },
};

const ACTION_LABELS: Record<string, string> = {
  view: "Xem",
  create: "Tạo mới",
  edit: "Chỉnh sửa",
  delete: "Xóa",
  approve: "Phê duyệt",
  export: "Xuất dữ liệu",
};

function PlatformModulesPage() {
  const t = useT();
  const { isAdmin, loading: roleLoading } = useRole();

  if (!roleLoading && !isAdmin) {
    return (
      <PlatformShell>
        <Card className="p-10 text-center text-sm text-muted-foreground">
          <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          {t("platform.forbidden")}
        </Card>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell>
      <PageHeader
        title="Danh Mục Chức Năng Nền Tảng Doanh Nghiệp"
        subtitle="Quản lý toàn diện các phân hệ cốt lõi ViOne Platform và thiết lập phân quyền thao tác RBAC chuẩn hóa theo từng chức năng"
        actions={
          <Link
            to="/platform/permissions"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:brightness-105 transition-all"
          >
            <KeyRound className="h-4 w-4" /> Ma Trận Phân Quyền RBAC
          </Link>
        }
      />

      {/* Thống kê nhanh nền tảng */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard
          label="Chức Năng Nền Tảng"
          value={PLATFORM_MODULES.length}
          tone="primary"
          icon={<Boxes className="h-4 w-4" />}
        />
        <StatCard
          label="Nhóm Quyền Chuẩn RBAC"
          value={7}
          tone="warning"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <StatCard
          label="Quyền Thao Tác Chi Tiết"
          value={42}
          tone="success"
          icon={<KeyRound className="h-4 w-4" />}
        />
        <StatCard
          label="Bảo Mật & Phân Quyền"
          value="100% Khép Kín"
          tone="info"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
      </div>

      {/* Grid danh sách chức năng nền tảng */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {PLATFORM_MODULES.map((mod) => {
          const Icon = mod.icon;
          const tone = TONE_BADGES[mod.tone] || TONE_BADGES.navy;

          return (
            <Card
              key={mod.id}
              className="flex flex-col justify-between p-5 border border-border hover:border-primary/50 transition-all hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl ${tone.bg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                    {mod.code}
                  </span>
                </div>

                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {mod.category}
                </div>
                <h3 className="text-base font-bold text-foreground mb-2 leading-snug">
                  {mod.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                  {mod.description}
                </p>

                {/* Các thao tác được hỗ trợ */}
                <div className="mb-3">
                  <div className="text-[11px] font-semibold text-foreground/80 mb-1.5 flex items-center gap-1">
                    <KeyRound className="h-3 w-3 text-primary" />
                    Thao tác phân quyền:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {mod.supportedActions.map((act) => (
                      <span
                        key={act}
                        className="text-[10.5px] px-2 py-0.5 rounded-full bg-secondary/80 text-foreground font-medium"
                      >
                        {ACTION_LABELS[act] || act}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Nhóm quyền đang được cấp phép */}
                <div className="mb-4">
                  <div className="text-[11px] font-semibold text-foreground/80 mb-1.5 flex items-center gap-1">
                    <Users className="h-3 w-3 text-primary" />
                    Nhóm quyền truy cập:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {mod.activeRoles.map((r) => (
                      <span
                        key={r}
                        className="text-[10.5px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <Link
                  to="/platform/permissions"
                  search={{ module: mod.id } as any}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Cấu hình phân quyền
                </Link>
                <Link
                  to={mod.route as any}
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Mở chức năng <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </PlatformShell>
  );
}
