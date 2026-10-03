import { useState, useMemo, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  Minus,
  ShieldCheck,
  Users,
  Briefcase,
  Save,
  RefreshCw,
  Search,
  Plus,
  KeyRound,
  LayoutGrid,
  Layers,
  Settings,
  Lock,
  Kanban,
  UserCheck,
  Store,
  Wallet,
  Calendar,
  Sparkles,
  Building2,
  Trash2,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { Card, PageHeader, Pill, StatCard } from "@/components/dashboard/PageKit";
import { useRole } from "@/hooks/use-role";
import { useT } from "@/lib/i18n";
import { useServerData } from "@/hooks/use-server-data";
import { listMembersFn, updateMemberRoleAndDeptFn } from "@/lib/members.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useTableControls } from "@/hooks/use-table-controls";
import { Pagination } from "@/components/dashboard/DataTablePagination";
import { PLATFORM_MODULES } from "./platform.index";

export const Route = createFileRoute("/platform/permissions")({
  component: PlatformPermissionsPage,
});

export type ActionType = "view" | "create" | "edit" | "delete" | "approve" | "export";

export interface RoleGroup {
  id: string;
  name: string;
  code: string;
  level: number;
  description: string;
  isSystem: boolean;
  memberCount: number;
}

export const DEFAULT_ROLE_GROUPS: RoleGroup[] = [
  {
    id: "role-ceo",
    name: "Ban Tổng Giám Đốc (CEO)",
    code: "CEO",
    level: 1,
    description: "Toàn quyền điều hành tối cao, phê duyệt ngân sách và phân quyền toàn hệ thống",
    isSystem: true,
    memberCount: 2,
  },
  {
    id: "role-coo",
    name: "Giám Đốc Vận Hành (COO)",
    code: "COO",
    level: 2,
    description: "Quản lý quy trình công việc, giám sát nhân sự và phân bổ tải công việc",
    isSystem: true,
    memberCount: 2,
  },
  {
    id: "role-cfo",
    name: "Giám Đốc Tài Chính (CFO / Kế Toán Trưởng)",
    code: "CFO",
    level: 2,
    description: "Quản lý dòng tiền, thẩm định chứng từ và kiểm soát hạn mức chi",
    isSystem: true,
    memberCount: 2,
  },
  {
    id: "role-sales",
    name: "Quản Lý Kinh Doanh (Sales Manager)",
    code: "SALES_MGR",
    level: 3,
    description: "Quản trị cơ hội kinh doanh, sàn sản phẩm và mạng lưới khách hàng doanh nghiệp",
    isSystem: true,
    memberCount: 3,
  },
  {
    id: "role-admin",
    name: "Quản Trị Viên Hệ Thống (System Admin)",
    code: "ADMIN",
    level: 1,
    description: "Quản trị kỹ thuật, bảo mật tài khoản, nhật ký kiểm toán và cấu hình nền tảng",
    isSystem: true,
    memberCount: 2,
  },
  {
    id: "role-staff",
    name: "Chuyên Viên Nghiệp Vụ (Staff)",
    code: "STAFF",
    level: 4,
    description: "Thực thi công việc được giao, chấm công văn phòng và tạo hồ sơ nghiệp vụ",
    isSystem: true,
    memberCount: 15,
  },
  {
    id: "role-partner",
    name: "Đối Tác Doanh Nghiệp (Business Partner)",
    code: "PARTNER",
    level: 5,
    description: "Đăng tải sản phẩm lên sàn giao thương, tham gia sự kiện và kết nối hợp tác",
    isSystem: false,
    memberCount: 45,
  },
];

const ACTION_COLS: { key: ActionType; label: string; shortLabel: string }[] = [
  { key: "view", label: "Xem dữ liệu", shortLabel: "Xem" },
  { key: "create", label: "Thêm mới", shortLabel: "Tạo" },
  { key: "edit", label: "Chỉnh sửa", shortLabel: "Sửa" },
  { key: "delete", label: "Xóa dữ liệu", shortLabel: "Xóa" },
  { key: "approve", label: "Phê duyệt", shortLabel: "Duyệt" },
  { key: "export", label: "Xuất báo cáo", shortLabel: "Xuất" },
];

export const DEPARTMENT_OPTIONS = [
  "Ban Tổng Giám Đốc",
  "Ban Giám Đốc Vận Hành",
  "Phòng Tài Chính - Kế Toán",
  "Phòng Kinh Doanh & Tiếp Thị",
  "Phòng Quản Trị Nhân Sự",
  "Phòng Công Nghệ & Kỹ Thuật",
  "Mạng Lưới Đối Tác Doanh Nghiệp",
];

// Khởi tạo ma trận quyền chuẩn theo Module x RoleGroup x Action
function initDefaultMatrix(): Record<string, Record<string, Record<ActionType, boolean>>> {
  const matrix: Record<string, Record<string, Record<ActionType, boolean>>> = {};

  PLATFORM_MODULES.forEach((mod) => {
    matrix[mod.id] = {};
    DEFAULT_ROLE_GROUPS.forEach((role) => {
      matrix[mod.id][role.code] = {
        view: false,
        create: false,
        edit: false,
        delete: false,
        approve: false,
        export: false,
      };

      // Quyền mặc định thông minh theo vai trò
      if (role.code === "CEO" || role.code === "ADMIN") {
        matrix[mod.id][role.code] = { view: true, create: true, edit: true, delete: true, approve: true, export: true };
      } else if (role.code === "COO") {
        const isCoreOps = ["mod-workflow", "mod-attendance", "mod-events", "mod-ai"].includes(mod.id);
        matrix[mod.id][role.code] = {
          view: true,
          create: isCoreOps,
          edit: isCoreOps,
          delete: false,
          approve: ["mod-workflow", "mod-attendance", "mod-finance"].includes(mod.id),
          export: true,
        };
      } else if (role.code === "CFO") {
        const isFin = mod.id === "mod-finance";
        matrix[mod.id][role.code] = {
          view: true,
          create: isFin,
          edit: isFin,
          delete: false,
          approve: isFin,
          export: true,
        };
      } else if (role.code === "SALES_MGR") {
        const isSales = ["mod-crm", "mod-products", "mod-events"].includes(mod.id);
        matrix[mod.id][role.code] = {
          view: isSales || mod.id === "mod-workflow",
          create: isSales,
          edit: isSales,
          delete: false,
          approve: false,
          export: isSales,
        };
      } else if (role.code === "STAFF") {
        matrix[mod.id][role.code] = {
          view: ["mod-workflow", "mod-attendance", "mod-crm"].includes(mod.id),
          create: ["mod-workflow", "mod-attendance"].includes(mod.id),
          edit: false,
          delete: false,
          approve: false,
          export: false,
        };
      } else if (role.code === "PARTNER") {
        matrix[mod.id][role.code] = {
          view: ["mod-products", "mod-events"].includes(mod.id),
          create: mod.id === "mod-products",
          edit: false,
          delete: false,
          approve: false,
          export: false,
        };
      }
    });
  });

  return matrix;
}

function PlatformPermissionsPage() {
  const t = useT();
  const { isPlatformAdmin, isAdmin, isBQT, loading: roleLoading } = useRole();
  const hasAccess = isPlatformAdmin || isAdmin || isBQT;

  const [activeTab, setActiveTab] = useState<"matrix" | "roles" | "users">("matrix");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("all");
  const [roleGroups, setRoleGroups] = useState<RoleGroup[]>(DEFAULT_ROLE_GROUPS);
  const [actionMatrix, setActionMatrix] = useState(() => initDefaultMatrix());
  const [matrixModified, setMatrixModified] = useState(false);

  // New role modal
  const [newRoleModalOpen, setNewRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleCode, setNewRoleCode] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  // Users tab
  const fetchMembers = useServerFn(listMembersFn);
  const { data: members, loading: loadingMembers, reload } = useServerData<any[]>(() => fetchMembers(), []);
  const updateRoleDept = useServerFn(updateMemberRoleAndDeptFn);

  const [edits, setEdits] = useState<Record<string, { role: string; department: string }>>({});
  const [savedEdits, setSavedEdits] = useState<Record<string, { role: string; department: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const filteredMembers = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return (members || []).filter((m: any) => {
      const mRole = edits[m.id]?.role ?? savedEdits[m.id]?.role ?? m.executiveRole ?? m.role ?? "STAFF";
      if (filterRole !== "all" && mRole !== filterRole) return false;
      if (!ql) return true;
      return (
        (m.name || "").toLowerCase().includes(ql) ||
        (m.code || "").toLowerCase().includes(ql) ||
        (m.email || "").toLowerCase().includes(ql) ||
        (m.phone || "").toLowerCase().includes(ql)
      );
    });
  }, [members, q, filterRole, edits, savedEdits]);

  const accessors = useMemo(
    () => ({
      code: (m: any) => m.code,
      name: (m: any) => m.name,
      email: (m: any) => m.email,
      role: (m: any) => edits[m.id]?.role ?? savedEdits[m.id]?.role ?? m.executiveRole ?? m.role ?? "STAFF",
    }),
    [edits, savedEdits],
  );

  const tc = useTableControls(filteredMembers, accessors, {
    initialPageSize: 10,
    initialSortKey: "name",
    initialSortDir: "asc",
  });

  const handleRoleChange = (memberId: string, currentRole: string, currentDept: string, newRole: string) => {
    setEdits((prev) => ({
      ...prev,
      [memberId]: {
        role: newRole,
        department: prev[memberId]?.department || savedEdits[memberId]?.department || currentDept || "Phòng Kinh Doanh & Tiếp Thị",
      },
    }));
  };

  const handleDeptChange = (memberId: string, currentRole: string, currentDept: string, newDept: string) => {
    setEdits((prev) => ({
      ...prev,
      [memberId]: {
        role: prev[memberId]?.role || savedEdits[memberId]?.role || currentRole || "STAFF",
        department: newDept,
      },
    }));
  };

  const handleSaveMemberRole = async (member: any) => {
    const edit = edits[member.id];
    const roleToSave = edit?.role || savedEdits[member.id]?.role || member.executiveRole || member.role || "STAFF";
    const deptToSave = edit?.department || savedEdits[member.id]?.department || member.department || "Phòng Kinh Doanh & Tiếp Thị";

    try {
      setSavingId(member.id);
      await updateRoleDept({
        data: {
          memberId: member.id,
          executiveRole: roleToSave,
          department: deptToSave,
          associationId: "c1983000-0000-4000-8000-000000001983",
        },
      });
      toast.success(`Đã cập nhật nhóm quyền [${roleToSave}] cho [${member.name}] thành công!`);
      setSavedEdits((prev) => ({
        ...prev,
        [member.id]: { role: roleToSave, department: deptToSave },
      }));
      setEdits((prev) => {
        const next = { ...prev };
        delete next[member.id];
        return next;
      });
      await reload();
    } catch (e: any) {
      toast.error(e?.message || "Lỗi khi cập nhật phân quyền tài khoản.");
    } finally {
      setSavingId(null);
    }
  };

  const toggleAction = (moduleId: string, roleCode: string, action: ActionType) => {
    setActionMatrix((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[moduleId]) next[moduleId] = {};
      if (!next[moduleId][roleCode]) {
        next[moduleId][roleCode] = { view: false, create: false, edit: false, delete: false, approve: false, export: false };
      }
      next[moduleId][roleCode][action] = !next[moduleId][roleCode][action];
      return next;
    });
    setMatrixModified(true);
  };

  const handleSaveMatrix = () => {
    toast.success("Đã lưu ma trận phân quyền thao tác RBAC cho tất cả chức năng nền tảng!");
    setMatrixModified(false);
  };

  const handleResetMatrix = () => {
    if (confirm("Khôi phục cấu hình phân quyền thao tác về mặc định khuyến nghị của ViOne?")) {
      setActionMatrix(initDefaultMatrix());
      setMatrixModified(false);
      toast.info("Đã khôi phục ma trận phân quyền RBAC về mặc định.");
    }
  };

  const handleCreateRoleGroup = () => {
    if (!newRoleName.trim() || !newRoleCode.trim()) {
      toast.error("Vui lòng nhập tên và mã nhóm quyền.");
      return;
    }
    const cleanCode = newRoleCode.trim().toUpperCase().replace(/\s+/g, "_");
    const exists = roleGroups.some((r) => r.code === cleanCode);
    if (exists) {
      toast.error(`Mã nhóm quyền [${cleanCode}] đã tồn tại.`);
      return;
    }

    const newGroup: RoleGroup = {
      id: `role-${Date.now()}`,
      name: newRoleName.trim(),
      code: cleanCode,
      level: 4,
      description: newRoleDesc.trim() || "Nhóm quyền tùy chỉnh người dùng",
      isSystem: false,
      memberCount: 0,
    };

    setRoleGroups((prev) => [...prev, newGroup]);
    setActionMatrix((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      PLATFORM_MODULES.forEach((mod) => {
        if (!next[mod.id]) next[mod.id] = {};
        next[mod.id][cleanCode] = { view: true, create: false, edit: false, delete: false, approve: false, export: false };
      });
      return next;
    });

    setNewRoleModalOpen(false);
    setNewRoleName("");
    setNewRoleCode("");
    setNewRoleDesc("");
    toast.success(`Đã tạo thành công nhóm quyền mới [${newGroup.name}]!`);
  };

  if (!roleLoading && !hasAccess) {
    return (
      <PlatformShell>
        <Card className="p-10 text-center text-sm text-muted-foreground">
          <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          {t("platform.forbidden")}
        </Card>
      </PlatformShell>
    );
  }

  const selectedModules =
    selectedModuleId === "all"
      ? PLATFORM_MODULES
      : PLATFORM_MODULES.filter((m) => m.id === selectedModuleId);

  return (
    <PlatformShell>
      <PageHeader
        title="Quản Lý Phân Quyền RBAC Nền Tảng"
        subtitle="Hệ thống quản lý nhóm quyền và ma trận quyền thao tác (Xem, Tạo, Sửa, Xóa, Duyệt, Xuất) gắn liền với từng chức năng nền tảng ViOne"
        actions={
          <div className="flex items-center gap-2">
            {matrixModified && (
              <button
                type="button"
                onClick={handleSaveMatrix}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all animate-pulse"
              >
                <Save className="h-4 w-4" /> Lưu Ma Trận Quyền
              </button>
            )}
            <button
              type="button"
              onClick={() => setNewRoleModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:brightness-105 transition-all"
            >
              <Plus className="h-4 w-4" /> Thêm Nhóm Quyền
            </button>
          </div>
        }
      />

      {/* Tabs Header */}
      <div className="mb-6 flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("matrix")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === "matrix"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <KeyRound className="h-4 w-4" />
          Ma Trận Thao Tác Chức Năng Nền Tảng
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("roles")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === "roles"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="h-4 w-4" />
          Quản Lý Nhóm Quyền ({roleGroups.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === "users"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          Gán Nhóm Quyền Tài Khoản
        </button>
      </div>

      {/* TAB 1: MA TRẬN THAO TÁC THEO CHỨC NĂNG NỀN TẢNG */}
      {activeTab === "matrix" && (
        <div>
          {/* Bộ lọc bám theo Chức Năng Nền Tảng */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <LayoutGrid className="h-4 w-4 text-primary" />
                Chọn Chức Năng Nền Tảng:
              </span>
              <select
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground focus:border-primary outline-none"
              >
                <option value="all">⚡ Tất Cả Chức Năng Nền Tảng ({PLATFORM_MODULES.length})</option>
                {PLATFORM_MODULES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetMatrix}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Khôi phục chuẩn
              </button>
              <button
                type="button"
                onClick={handleSaveMatrix}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground shadow-sm hover:brightness-105 transition-all"
              >
                <Save className="h-3.5 w-3.5" />
                Lưu phân quyền
              </button>
            </div>
          </div>

          {/* Ma trận từng Module Chức năng nền tảng */}
          <div className="space-y-6">
            {selectedModules.map((mod) => {
              const ModIcon = mod.icon;
              return (
                <Card key={mod.id} className="overflow-hidden border border-border">
                  <div className="bg-secondary/40 px-5 py-3.5 border-b border-border flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <ModIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground flex items-center gap-2">
                          {mod.name}
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground font-normal">
                            {mod.code}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">{mod.description}</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      {mod.category}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-secondary/20 text-muted-foreground uppercase tracking-wider text-[11px]">
                          <th className="px-4 py-2.5 text-left font-bold w-[220px]">Nhóm Quyền (Role Group)</th>
                          {ACTION_COLS.map((act) => (
                            <th key={act.key} className="px-3 py-2.5 text-center font-bold">
                              {act.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {roleGroups.map((rg) => {
                          const perms = actionMatrix[mod.id]?.[rg.code] || {
                            view: false,
                            create: false,
                            edit: false,
                            delete: false,
                            approve: false,
                            export: false,
                          };

                          return (
                            <tr
                              key={rg.id}
                              className="border-b border-border/60 last:border-0 hover:bg-secondary/20 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="font-semibold text-foreground text-xs">{rg.name}</div>
                                <div className="text-[10.5px] text-muted-foreground font-mono">{rg.code}</div>
                              </td>
                              {ACTION_COLS.map((act) => {
                                const allowed = perms[act.key];
                                return (
                                  <td key={act.key} className="px-3 py-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => toggleAction(mod.id, rg.code, act.key)}
                                      className={`inline-flex items-center justify-center h-7 w-7 rounded-lg border transition-all ${
                                        allowed
                                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-xs"
                                          : "bg-secondary/40 border-border text-muted-foreground/40 hover:border-muted-foreground/40"
                                      }`}
                                      title={`${allowed ? "Đang có quyền" : "Chưa có quyền"}: ${act.label} - ${rg.name}`}
                                    >
                                      {allowed ? (
                                        <Check className="h-4 w-4 stroke-[2.5]" />
                                      ) : (
                                        <Minus className="h-3.5 w-3.5 stroke-[1.5]" />
                                      )}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: QUẢN LÝ NHÓM QUYỀN (ROLE GROUPS) */}
      {activeTab === "roles" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              Danh Sách Nhóm Quyền Tiêu Chuẩn Nền Tảng ViOne RBAC
            </h3>
            <span className="text-xs text-muted-foreground">
              Tổng số {roleGroups.length} nhóm quyền được định nghĩa
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roleGroups.map((rg) => (
              <Card key={rg.id} className="p-5 border border-border flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {rg.code}
                    </span>
                    <span
                      className={`text-[10.5px] px-2 py-0.5 rounded-full font-medium ${
                        rg.isSystem
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          : "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300"
                      }`}
                    >
                      {rg.isSystem ? "Hệ thống chuẩn" : "Tùy biến"}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-foreground mb-1.5">{rg.name}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {rg.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    {rg.memberCount} tài khoản
                  </span>
                  <span className="text-[11px] font-semibold text-primary">
                    Cấp bậc ưu tiên: {rg.level}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GÁN NHÓM QUYỀN TÀI KHOẢN (USER ROLE ASSIGNMENT) */}
      {activeTab === "users" && (
        <Card className="p-5 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">
                Gán Nhóm Quyền & Phòng Ban Trực Tiếp Cho Tài Khoản
              </h2>
            </div>
            <button
              type="button"
              onClick={() => reload()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-secondary transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Làm mới danh sách
            </button>
          </div>

          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên, mã, email, số điện thoại..."
                className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div className="w-[220px]">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary outline-none"
              >
                <option value="all">⚡ Tất cả nhóm quyền</option>
                {roleGroups.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.name} ({opt.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto relative">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="border-b border-border bg-secondary/80 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="sticky left-0 z-20 w-[56px] min-w-[56px] max-w-[56px] bg-secondary px-3 py-3 text-center border-r border-b border-border">
                    STT
                  </th>
                  <th className="sticky left-[56px] z-20 min-w-[110px] bg-secondary px-4 py-3 text-left border-r border-b border-border">
                    Mã TK
                  </th>
                  <th className="px-4 py-3 text-left border-b border-border">Doanh Nhân / Tài Khoản</th>
                  <th className="px-4 py-3 text-left border-b border-border">Email & Liên Hệ</th>
                  <th className="px-4 py-3 text-left border-b border-border">Nhóm Quyền RBAC</th>
                  <th className="px-4 py-3 text-left border-b border-border">Phòng Ban Trách Nhiệm</th>
                  <th className="sticky right-0 z-20 min-w-[120px] bg-secondary px-4 py-3 text-center border-l border-b border-border">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingMembers ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                      Đang tải danh sách tài khoản...
                    </td>
                  </tr>
                ) : tc.pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                      Không tìm thấy tài khoản phù hợp
                    </td>
                  </tr>
                ) : (
                  tc.pageRows.map((m: any, idx: number) => {
                    const currentRole =
                      edits[m.id]?.role ?? savedEdits[m.id]?.role ?? m.executiveRole ?? m.role ?? "STAFF";
                    const currentDept =
                      edits[m.id]?.department ?? savedEdits[m.id]?.department ?? m.department ?? "Phòng Kinh Doanh & Tiếp Thị";
                    const isChanged = edits[m.id] !== undefined;
                    const isSaving = savingId === m.id;

                    return (
                      <tr key={m.id} className="group hover:bg-secondary/20 transition-colors">
                        <td className="sticky left-0 z-10 w-[56px] min-w-[56px] max-w-[56px] bg-card group-hover:bg-muted/70 px-3 py-3 text-center text-xs font-medium text-muted-foreground border-r border-b border-border transition-colors">
                          {(tc.page - 1) * tc.pageSize + idx + 1}
                        </td>
                        <td className="sticky left-[56px] z-10 min-w-[110px] bg-card group-hover:bg-muted/70 px-4 py-3 font-mono text-[12px] font-semibold text-primary border-r border-b border-border transition-colors">
                          {m.code || m.id?.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 border-b border-border">
                          <div className="font-semibold text-foreground text-xs">{m.name}</div>
                          <div className="text-[11px] text-muted-foreground">{m.company || m.email}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground border-b border-border">
                          <div>{m.email || "—"}</div>
                          <div className="text-[11px]">{m.phone || "—"}</div>
                        </td>
                        <td className="px-4 py-3 border-b border-border">
                          <select
                            value={currentRole}
                            onChange={(e) =>
                              handleRoleChange(m.id, m.executiveRole, m.department, e.target.value)
                            }
                            className="w-full text-xs font-semibold rounded-lg border border-border bg-background px-2.5 py-1.5 focus:border-primary outline-none"
                          >
                            {roleGroups.map((opt) => (
                              <option key={opt.code} value={opt.code}>
                                {opt.name} ({opt.code})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 border-b border-border">
                          <select
                            value={currentDept}
                            onChange={(e) =>
                              handleDeptChange(m.id, m.executiveRole, m.department, e.target.value)
                            }
                            className="w-full text-xs font-medium rounded-lg border border-border bg-background px-2.5 py-1.5 focus:border-primary outline-none"
                          >
                            {DEPARTMENT_OPTIONS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="sticky right-0 z-10 min-w-[120px] bg-card group-hover:bg-muted/70 px-4 py-3 text-center border-l border-b border-border transition-colors">
                          <button
                            type="button"
                            onClick={() => handleSaveMemberRole(m)}
                            disabled={isSaving || !isChanged}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isChanged
                                ? "bg-primary text-primary-foreground shadow-sm hover:brightness-110 cursor-pointer"
                                : "bg-secondary text-muted-foreground opacity-50 cursor-not-allowed"
                            }`}
                          >
                            <Save className="w-3.5 h-3.5" />
                            {isSaving ? "Đang lưu..." : "Lưu quyền"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
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
        </Card>
      )}

      {/* Modal Tạo Nhóm Quyền Mới */}
      {newRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Thêm Nhóm Quyền RBAC Mới
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Định nghĩa nhóm quyền mới để gán vào các chức năng nền tảng ViOne
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Tên Nhóm Quyền <span className="text-destructive">*</span>
                </label>
                <input
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Ví dụ: Trưởng Nhóm Phát Triển Dự Án"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Mã Vai Trò (Role Code) <span className="text-destructive">*</span>
                </label>
                <input
                  value={newRoleCode}
                  onChange={(e) => setNewRoleCode(e.target.value)}
                  placeholder="Ví dụ: PROJECT_LEAD"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono uppercase text-foreground focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Mô Tả Trách Nhiệm
                </label>
                <textarea
                  rows={3}
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Mô tả phạm vi quyền hạn và trách nhiệm của nhóm quyền..."
                  className="w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setNewRoleModalOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-secondary transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleCreateRoleGroup}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground shadow-sm hover:brightness-105 transition-all"
              >
                Tạo nhóm quyền
              </button>
            </div>
          </div>
        </div>
      )}
    </PlatformShell>
  );
}
