import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Minus, ShieldCheck, Users, Briefcase, Save, RefreshCw, Search } from "lucide-react";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { Card, PageHeader, Pill } from "@/components/dashboard/PageKit";
import { useRole } from "@/hooks/use-role";
import { baseLang, useLang, useT } from "@/lib/i18n";
import { useServerData } from "@/hooks/use-server-data";
import { listMembersFn, updateMemberRoleAndDeptFn } from "@/lib/members.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useTableControls } from "@/hooks/use-table-controls";
import { Pagination } from "@/components/dashboard/DataTablePagination";

export const Route = createFileRoute("/platform/permissions")({
  component: PlatformPermissionsPage,
});

type Access = "full" | "scoped" | "own" | "none";

type Row = {
  feature: { vi: string; en: string };
  platform_admin: Access;
  admin: Access;
  tong_thu_ky: Access;
  truong_ban_thanh_vien: Access;
  truong_ban_tai_chinh: Access;
  truong_ban_truyen_thong: Access;
  truong_ban_xuc_tien: Access;
  member: Access;
};

const ROWS: Row[] = [
  {
    feature: { vi: "Quản trị hệ thống & Cấu hình nền tảng", en: "Platform & system management" },
    platform_admin: "full",
    admin: "scoped",
    tong_thu_ky: "none",
    truong_ban_thanh_vien: "none",
    truong_ban_tai_chinh: "none",
    truong_ban_truyen_thong: "none",
    truong_ban_xuc_tien: "none",
    member: "none",
  },
  {
    feature: { vi: "Họp phòng ban & Lịch Zoom", en: "Department meetings & Zoom" },
    platform_admin: "full",
    admin: "full",
    tong_thu_ky: "full",
    truong_ban_thanh_vien: "scoped",
    truong_ban_tai_chinh: "scoped",
    truong_ban_truyen_thong: "scoped",
    truong_ban_xuc_tien: "scoped",
    member: "own",
  },
  {
    feature: { vi: "Quản lý hội viên & Phân ban", en: "Members & committee assignment" },
    platform_admin: "full",
    admin: "full",
    tong_thu_ky: "scoped",
    truong_ban_thanh_vien: "full",
    truong_ban_tai_chinh: "scoped",
    truong_ban_truyen_thong: "scoped",
    truong_ban_xuc_tien: "scoped",
    member: "own",
  },
  {
    feature: { vi: "Thu chi, Tạm ứng & Hóa đơn", en: "Finance, advances & invoices" },
    platform_admin: "full",
    admin: "full",
    tong_thu_ky: "scoped",
    truong_ban_thanh_vien: "scoped",
    truong_ban_tai_chinh: "full",
    truong_ban_truyen_thong: "scoped",
    truong_ban_xuc_tien: "scoped",
    member: "own",
  },
  {
    feature: { vi: "Sự kiện, Điểm danh QR & Xếp chỗ VIP", en: "Events, check-in QR & VIP seating" },
    platform_admin: "full",
    admin: "full",
    tong_thu_ky: "scoped",
    truong_ban_thanh_vien: "scoped",
    truong_ban_tai_chinh: "scoped",
    truong_ban_truyen_thong: "full",
    truong_ban_xuc_tien: "scoped",
    member: "own",
  },
  {
    feature: { vi: "Sàn cơ hội kinh doanh & Matching", en: "Opportunities marketplace & matching" },
    platform_admin: "full",
    admin: "full",
    tong_thu_ky: "scoped",
    truong_ban_thanh_vien: "scoped",
    truong_ban_tai_chinh: "scoped",
    truong_ban_truyen_thong: "scoped",
    truong_ban_xuc_tien: "full",
    member: "own",
  },
  {
    feature: { vi: "Biểu quyết & Bốc thăm trúng thưởng", en: "Voting & Lucky draw" },
    platform_admin: "full",
    admin: "full",
    tong_thu_ky: "full",
    truong_ban_thanh_vien: "scoped",
    truong_ban_tai_chinh: "scoped",
    truong_ban_truyen_thong: "scoped",
    truong_ban_xuc_tien: "scoped",
    member: "own",
  },
];

const ROLE_OPTIONS = [
  { value: "platform_admin", label: "Platform Admin" },
  { value: "admin", label: "Quản trị (Admin)" },
  { value: "tong_thu_ky", label: "Tổng thư ký" },
  { value: "truong_ban_thanh_vien", label: "Trưởng ban thành viên" },
  { value: "truong_ban_tai_chinh", label: "Trưởng ban tài chính" },
  { value: "truong_ban_truyen_thong", label: "Trưởng ban truyền thông" },
  { value: "truong_ban_xuc_tien", label: "Trưởng ban xúc tiến" },
  { value: "member", label: "Hội viên" },
];

const DEPARTMENT_OPTIONS = [
  "Ban Điều Hành",
  "Ban Quản Trị",
  "Ban Thư ký",
  "Ban Thành viên",
  "Ban Tài chính",
  "Ban Truyền thông",
  "Ban Xúc tiến thương mại",
  "Hội viên VIONE",
];

const ASSOCIATION_OPTIONS: { id: string; name: string; shortName: string }[] = [
  { id: "c1983000-0000-4000-8000-000000001983", name: "CLB Doanh Nhân CEO 1983", shortName: "CEO 1983" },
];

const TONE: Record<Access, { bg: string; fg: string }> = {
  full: { bg: "oklch(0.93 0.07 155)", fg: "oklch(0.40 0.16 155)" },
  scoped: { bg: "oklch(0.94 0.05 220)", fg: "oklch(0.42 0.15 220)" },
  own: { bg: "oklch(0.94 0.09 75)", fg: "oklch(0.45 0.14 65)" },
  none: { bg: "oklch(0.94 0.01 250)", fg: "oklch(0.55 0.02 250)" },
};

function Cell({ access, label }: { access: Access; label: string }) {
  const s = TONE[access];
  return (
    <td className="px-3 py-2.5 text-center">
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
        style={{ background: s.bg, color: s.fg }}
      >
        {access === "none" ? <Minus className="h-2.5 w-2.5" /> : <Check className="h-2.5 w-2.5" />}
        {label}
      </span>
    </td>
  );
}

function PlatformPermissionsPage() {
  const t = useT();
  const { lang } = useLang();
  const { isPlatformAdmin, loading } = useRole();

  const fetchMembers = useServerFn(listMembersFn);
  const { data: members, loading: loadingMembers, reload } = useServerData<any[]>(() => fetchMembers(), []);
  const updateRoleDept = useServerFn(updateMemberRoleAndDeptFn);

  const [edits, setEdits] = useState<Record<string, { role: string; department: string; associationId: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filterAssoc, setFilterAssoc] = useState("all");
  const [filterRole, setFilterRole] = useState("all");

  const filteredMembers = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return (members || []).filter((m: any) => {
      const mAssoc = edits[m.id]?.associationId ?? m.associationId ?? m.association_id ?? "c1983000-0000-4000-8000-000000001983";
      if (filterAssoc !== "all" && mAssoc !== filterAssoc) return false;
      const mRole = edits[m.id]?.role ?? m.executiveRole ?? m.role ?? "member";
      if (filterRole !== "all" && mRole !== filterRole) return false;
      if (!ql) return true;
      return (
        (m.name || "").toLowerCase().includes(ql) ||
        (m.code || "").toLowerCase().includes(ql) ||
        (m.email || "").toLowerCase().includes(ql) ||
        (m.phone || "").toLowerCase().includes(ql)
      );
    });
  }, [members, q, filterAssoc, filterRole, edits]);

  const accessors = useMemo(
    () => ({
      code: (m: any) => m.code,
      name: (m: any) => m.name,
      email: (m: any) => m.email,
      role: (m: any) => edits[m.id]?.role ?? m.executiveRole ?? m.role ?? "member",
      association: (m: any) => edits[m.id]?.associationId ?? m.associationId ?? m.association_id ?? "",
    }),
    [edits],
  );

  const tc = useTableControls(filteredMembers, accessors, {
    initialPageSize: 10,
    initialSortKey: "name",
    initialSortDir: "asc",
  });

  const handleRoleChange = (memberId: string, currentRole: string, currentDept: string, currentAssoc: string, newRole: string) => {
    setEdits(prev => ({
      ...prev,
      [memberId]: {
        role: newRole,
        department: prev[memberId]?.department || currentDept || "Hội viên VIONE",
        associationId: prev[memberId]?.associationId || currentAssoc || "c1983000-0000-4000-8000-000000001983",
      }
    }));
  };

  const handleDeptChange = (memberId: string, currentRole: string, currentDept: string, currentAssoc: string, newDept: string) => {
    setEdits(prev => ({
      ...prev,
      [memberId]: {
        role: prev[memberId]?.role || currentRole || "member",
        department: newDept,
        associationId: prev[memberId]?.associationId || currentAssoc || "c1983000-0000-4000-8000-000000001983",
      }
    }));
  };

  const handleAssocChange = (memberId: string, currentRole: string, currentDept: string, currentAssoc: string, newAssoc: string) => {
    setEdits(prev => ({
      ...prev,
      [memberId]: {
        role: prev[memberId]?.role || currentRole || "member",
        department: prev[memberId]?.department || currentDept || "Hội viên VIONE",
        associationId: newAssoc,
      }
    }));
  };

  const handleSave = async (member: any) => {
    const edit = edits[member.id];
    const roleToSave = edit?.role || member.executiveRole || member.role || "member";
    const deptToSave = edit?.department || member.department || "Hội viên VIONE";
    const assocToSave = edit?.associationId || member.associationId || member.association_id || "c1983000-0000-4000-8000-000000001983";

    try {
      setSavingId(member.id);
      await updateRoleDept({
        data: {
          memberId: member.id,
          executiveRole: roleToSave,
          department: deptToSave,
          associationId: assocToSave,
        }
      });
      toast.success(`Đã cập nhật phân quyền cho [${member.name}] thành công!`);
      await reload();
    } catch (e: any) {
      toast.error(e?.message || "Lỗi khi cập nhật phân quyền.");
    } finally {
      setSavingId(null);
    }
  };

  if (!loading && !isPlatformAdmin) {
    return (
      <PlatformShell>
        <Card className="p-10 text-center text-sm text-muted-foreground">
          <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          {t("platform.forbidden")}
        </Card>
      </PlatformShell>
    );
  }

  const legend: { key: Access; label: string }[] = [
    { key: "full", label: "Toàn quyền (Full)" },
    { key: "scoped", label: "Phạm vi ban (Scoped)" },
    { key: "own", label: "Chỉ cá nhân (Own)" },
    { key: "none", label: "Không có quyền (None)" },
  ];

  return (
    <PlatformShell>
      <PageHeader
        title="Ma Trận & Phân Quyền Ban Điều Hành"
        subtitle="Cấu hình quyền thao tác trực tiếp cho các tài khoản hội viên và hiệp hội trên toàn hệ thống"
      />

      {/* Section 1: Interactive Member Role & Department Assignment */}
      <Card className="mb-8 p-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Phân Quyền Thao Tác Trực Tiếp Cho Tài Khoản
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
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên, mã hội viên, email, số điện thoại..."
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div className="w-[180px]">
            <select
              value={filterAssoc}
              onChange={(e) => setFilterAssoc(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary outline-none"
            >
              <option value="all">Tất cả hiệp hội</option>
              {ASSOCIATION_OPTIONS.map((assoc) => (
                <option key={assoc.id} value={assoc.id}>
                  {assoc.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-[180px]">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary outline-none"
            >
              <option value="all">Tất cả vai trò</option>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
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
                <th className="sticky left-[56px] z-20 min-w-[110px] bg-secondary px-4 py-3 text-left border-r border-b border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                  Mã
                </th>
                <th className="px-4 py-3 text-left border-b border-border">Hội viên / Doanh nghiệp</th>
                <th className="px-4 py-3 text-left border-b border-border">Email / Liên hệ</th>
                <th className="px-4 py-3 text-left border-b border-border">Hiệp hội / Tổ chức</th>
                <th className="px-4 py-3 text-left border-b border-border">Chức danh / Vai trò Type</th>
                <th className="px-4 py-3 text-left border-b border-border">Phòng ban phụ trách</th>
                <th className="sticky right-0 z-20 min-w-[120px] bg-secondary px-4 py-3 text-center border-l border-b border-border shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)]">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {loadingMembers ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground text-xs">
                    Đang tải danh sách tài khoản...
                  </td>
                </tr>
              ) : tc.pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground text-xs">
                    Không tìm thấy tài khoản phù hợp
                  </td>
                </tr>
              ) : (
                tc.pageRows.map((m: any, idx: number) => {
                  const currentRole = edits[m.id]?.role ?? m.executiveRole ?? m.role ?? "member";
                  const currentDept = edits[m.id]?.department ?? m.department ?? "Hội viên VIONE";
                  const currentAssoc = edits[m.id]?.associationId ?? m.associationId ?? m.association_id ?? "c1983000-0000-4000-8000-000000001983";
                  const isChanged = edits[m.id] !== undefined;
                  const isSaving = savingId === m.id;

                  return (
                    <tr key={m.id} className="group hover:bg-secondary/20 transition-colors">
                      <td className="sticky left-0 z-10 w-[56px] min-w-[56px] max-w-[56px] bg-card group-hover:bg-muted/70 px-3 py-3 text-center text-xs font-medium text-muted-foreground border-r border-b border-border transition-colors">
                        {(tc.page - 1) * tc.pageSize + idx + 1}
                      </td>
                      <td className="sticky left-[56px] z-10 min-w-[110px] bg-card group-hover:bg-muted/70 px-4 py-3 font-mono text-[12px] font-semibold text-primary border-r border-b border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)] transition-colors">
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
                          value={currentAssoc}
                          onChange={(e) => handleAssocChange(m.id, m.executiveRole, m.department, m.associationId || m.association_id, e.target.value)}
                          className="w-full text-xs font-semibold rounded-lg border border-border bg-primary/5 text-primary px-2.5 py-1.5 focus:border-primary outline-none"
                        >
                          {ASSOCIATION_OPTIONS.map((assoc) => (
                            <option key={assoc.id} value={assoc.id}>
                              {assoc.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 border-b border-border">
                        <select
                          value={currentRole}
                          onChange={(e) => handleRoleChange(m.id, m.executiveRole, m.department, m.associationId || m.association_id, e.target.value)}
                          className="w-full text-xs font-medium rounded-lg border border-border bg-background px-2.5 py-1.5 focus:border-primary outline-none"
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 border-b border-border">
                        <select
                          value={currentDept}
                          onChange={(e) => handleDeptChange(m.id, m.executiveRole, m.department, m.associationId || m.association_id, e.target.value)}
                          className="w-full text-xs font-medium rounded-lg border border-border bg-background px-2.5 py-1.5 focus:border-primary outline-none"
                        >
                          {DEPARTMENT_OPTIONS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="sticky right-0 z-10 min-w-[120px] bg-card group-hover:bg-muted/70 px-4 py-3 text-center border-l border-b border-border shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)] transition-colors">
                        <button
                          type="button"
                          onClick={() => handleSave(m)}
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

      {/* Section 2: Full 8-Role Permission Matrix */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-foreground">
          Ma Trận Chi Tiết Phân Quyền 8 Cấp Bậc
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {legend.map((l) => {
            const s = TONE[l.key];
            return (
              <span
                key={l.key}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: s.bg, color: s.fg }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} />
                {l.label}
              </span>
            );
          })}
        </div>
      </div>

      <Card className="overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 text-left">Chức năng hệ thống</th>
                <th className="px-3 py-3 text-center">Platform Admin</th>
                <th className="px-3 py-3 text-center">Quản trị</th>
                <th className="px-3 py-3 text-center">Tổng thư ký</th>
                <th className="px-3 py-3 text-center">TB Thành viên</th>
                <th className="px-3 py-3 text-center">TB Tài chính</th>
                <th className="px-3 py-3 text-center">TB T.Thông</th>
                <th className="px-3 py-3 text-center">TB Xúc tiến</th>
                <th className="px-3 py-3 text-center">Hội viên</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium text-foreground text-xs">
                    {r.feature[baseLang(lang)]}
                  </td>
                  <Cell access={r.platform_admin} label="Toàn quyền" />
                  <Cell access={r.admin} label="Quản trị" />
                  <Cell access={r.tong_thu_ky} label={legend.find((l) => l.key === r.tong_thu_ky)!.label} />
                  <Cell access={r.truong_ban_thanh_vien} label={legend.find((l) => l.key === r.truong_ban_thanh_vien)!.label} />
                  <Cell access={r.truong_ban_tai_chinh} label={legend.find((l) => l.key === r.truong_ban_tai_chinh)!.label} />
                  <Cell access={r.truong_ban_truyen_thong} label={legend.find((l) => l.key === r.truong_ban_truyen_thong)!.label} />
                  <Cell access={r.truong_ban_xuc_tien} label={legend.find((l) => l.key === r.truong_ban_xuc_tien)!.label} />
                  <Cell access={r.member} label={legend.find((l) => l.key === r.member)!.label} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PlatformShell>
  );
}
