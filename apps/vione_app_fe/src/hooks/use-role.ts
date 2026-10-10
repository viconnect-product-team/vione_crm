import { useCallback, useEffect, useState } from "react";
import { fetchNestApi } from "@/lib/api-client";

export type SrsRole = "ADM" | "BQT" | "BTV" | "BTC" | "BTT" | "HVT";
export type AppRole = "quan_tri" | "admin" | "platform_admin" | "moderator" | "member" | string;

export type CurrentUserInfo = {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  roles?: string[];
  companyName?: string;
  executiveRole?: string;
  avatar_url?: string;
};

export type RoleState = {
  roles: AppRole[];
  srsRole: SrsRole;
  currentUser: CurrentUserInfo | null;
  /** Role Quản trị - Vai trò cao nhất toàn hệ thống */
  isQuanTri: boolean;
  /** Role Admin - Vai trò cao thứ hai toàn hệ thống (bao gồm Quản trị và Admin) */
  isAdmin: boolean;
  /** @deprecated Dùng isQuanTri thay thế. Giữ lại để tương thích các component cũ */
  isPlatformAdmin: boolean;
  isModerator: boolean;
  isBQT: boolean;
  isBTV: boolean;
  isBTC: boolean;
  isBTT: boolean;
  isHVT: boolean;
  canManageMembers: boolean;
  canApproveMembers: boolean;
  canRenewMembers: boolean;
  canManageFinance: boolean;
  canManageMedia: boolean;
  canManageEvents: boolean;
  canScanQR: boolean;
  canManageSystem: boolean;
  /**
   * Phân quyền dữ liệu: Không cho tài khoản khác chỉnh sửa bản ghi do chính tài khoản đó tạo ra
   * TRỪ KHI có role Quản trị hoặc role Admin mới được chỉnh sửa bản ghi của tài khoản khác.
   */
  canEditRecord: (recordCreatedById?: string | number | null) => boolean;
  /**
   * Phân quyền giao việc: Chỉ có role Quản trị, role Admin và người thiết lập công ty ở cộng đồng
   * mới được hiển thị chức năng giao việc. Các role nhỏ không nhìn thấy chức năng giao việc.
   */
  canAssignTask: (communityCreatorId?: string | number | null, isCompanyFounder?: boolean) => boolean;
  loading: boolean;
  setRoleOverride: (role: SrsRole) => void;
  reloadRole: () => Promise<void>;
};

// Fetches current user's roles from NestJS /users/me and member profile per SRS specification.
export function useRole(): RoleState {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [srsRole, setSrsRole] = useState<SrsRole>("HVT");
  const [currentUser, setCurrentUser] = useState<CurrentUserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const resolveSrsRole = (rawRoles: string[], user: any, member: any): SrsRole => {
    // 1. Check local override for testing
    if (typeof window !== "undefined") {
      const savedOverride = localStorage.getItem("vba_crm_role_override") as SrsRole;
      if (savedOverride && ["ADM", "BQT", "BTV", "BTC", "BTT", "HVT"].includes(savedOverride)) {
        return savedOverride;
      }
    }

    const rList = rawRoles.map((r) => String(r).toLowerCase());
    const execRole = String(member?.executiveRole || user?.executiveRole || "").toLowerCase();
    const dept = String(member?.department || user?.department || "").toLowerCase();
    const primaryRole = String(user?.role || member?.role || "").toLowerCase();

    // ADM (Role Quản trị - Vai trò cao nhất toàn hệ thống)
    if (
      rList.includes("quan_tri") ||
      rList.includes("platform_admin") ||
      rList.includes("superadmin") ||
      primaryRole === "quan_tri" ||
      primaryRole === "platform_admin" ||
      primaryRole === "superadmin"
    ) {
      return "ADM";
    }

    // BQT (Role Admin - Ban Quản Trị / Ban Chấp Hành / Chủ Tịch / Tổng Thư Ký)
    if (
      rList.includes("admin") ||
      rList.includes("bqt") ||
      rList.includes("board_director") ||
      rList.includes("tong_thu_ky") ||
      primaryRole === "admin" ||
      primaryRole === "association_admin" ||
      execRole.includes("quản trị") ||
      execRole.includes("chủ tịch") ||
      execRole.includes("tổng thư ký") ||
      execRole.includes("president") ||
      dept.includes("quản trị") ||
      dept.includes("thường trực")
    ) {
      return "BQT";
    }

    // BTV (Ban Thành Viên)
    if (
      rList.includes("btv") ||
      rList.includes("truong_ban_thanh_vien") ||
      rList.includes("ban_thanh_vien") ||
      execRole.includes("thành viên") ||
      dept.includes("thành viên")
    ) {
      return "BTV";
    }

    // BTC (Ban Tài Chính)
    if (
      rList.includes("btc") ||
      rList.includes("truong_ban_tai_chinh") ||
      rList.includes("ban_tai_chinh") ||
      execRole.includes("tài chính") ||
      dept.includes("tài chính")
    ) {
      return "BTC";
    }

    // BTT (Ban Truyền Thông)
    if (
      rList.includes("btt") ||
      rList.includes("truong_ban_truyen_thong") ||
      rList.includes("ban_truyen_thong") ||
      execRole.includes("truyền thông") ||
      dept.includes("truyền thông")
    ) {
      return "BTT";
    }

    // Mặc định: HVT (Hội Viên Thường / Role nhỏ)
    return "HVT";
  };

  const syncUserRoles = useCallback(async () => {
    try {
      let me: any = null;
      let member: any = null;

      try {
        me = await fetchNestApi("/users/me");
      } catch {
        // ignore
      }

      if (typeof window !== "undefined") {
        try {
          const rawMem = localStorage.getItem("vba_my_member");
          if (rawMem) member = JSON.parse(rawMem);
        } catch {}
      }

      const roleArr: string[] = [];
      if (me?.roles && Array.isArray(me.roles)) {
        roleArr.push(...me.roles);
      }
      if (me?.role) roleArr.push(me.role);
      if (member?.executiveRole) roleArr.push(member.executiveRole);

      const computedSrs = resolveSrsRole(roleArr, me, member);
      setSrsRole(computedSrs);

      const set = new Set<AppRole>(roleArr as AppRole[]);
      if (computedSrs === "ADM") {
        set.add("quan_tri");
        set.add("admin");
      } else if (computedSrs === "BQT") {
        set.add("admin");
      }
      setRoles(Array.from(set));

      if (me) {
        setCurrentUser({
          id: me.id,
          name: me.name || member?.name,
          username: me.username,
          email: me.email || member?.email,
          role: me.role,
          roles: me.roles || [],
          companyName: me.companyName || member?.companyName,
          executiveRole: me.executiveRole || member?.executiveRole,
          avatar_url: me.avatar_url || member?.avatar_url,
        });
      }
    } catch {
      setRoles([]);
      setSrsRole("HVT");
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncUserRoles();

    // Lắng nghe sự kiện thay đổi quyền hoặc tài khoản để re-render và ẩn giao diện ngay lập tức
    const handleRoleChanged = () => {
      syncUserRoles();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("role-changed", handleRoleChanged);
      window.addEventListener("auth-changed", handleRoleChanged);
      window.addEventListener("storage", handleRoleChanged);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("role-changed", handleRoleChanged);
        window.removeEventListener("auth-changed", handleRoleChanged);
        window.removeEventListener("storage", handleRoleChanged);
      }
    };
  }, [syncUserRoles]);

  const setRoleOverride = (newRole: SrsRole) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("vba_crm_role_override", newRole);
      setSrsRole(newRole);
      window.dispatchEvent(new Event("role-changed"));
    }
  };

  // Role Quản trị là to nhất (ADM)
  const isQuanTri = srsRole === "ADM";
  // Role Admin là to nhì (BQT hoặc Quản trị)
  const isAdmin = isQuanTri || srsRole === "BQT";
  // Tương thích ngược: isPlatformAdmin trỏ tới isQuanTri
  const isPlatformAdmin = isQuanTri;

  const isBQT = isAdmin;
  const isBTV = srsRole === "BTV" || isBQT;
  const isBTC = srsRole === "BTC" || isBQT;
  const isBTT = srsRole === "BTT" || isBQT;
  const isHVT = srsRole === "HVT";
  const isModerator = isAdmin || isBTV || isBTC || isBTT;

  // Granular RBAC Matrix per SRS Part 2.2
  const canManageMembers = isBQT || srsRole === "BTV";
  const canApproveMembers = isBQT;
  const canRenewMembers = isBQT || srsRole === "BTV";
  const canManageFinance = isBQT || srsRole === "BTC";
  const canManageMedia = isBQT || srsRole === "BTT";
  const canManageEvents = isBQT || srsRole === "BTT";
  const canScanQR = isBQT || srsRole === "BTT";
  const canManageSystem = isBQT;

  /**
   * Phân quyền dữ liệu:
   * Không cho tài khoản khác chỉnh sửa bản ghi do chính tài khoản đó tạo ra
   * TRỪ KHI có role Quản trị hoặc role Admin mới được chỉnh sửa bản ghi do tài khoản khác tạo ra.
   */
  const canEditRecord = (recordCreatedById?: string | number | null): boolean => {
    if (isQuanTri || isAdmin) return true;
    if (!currentUser?.id || !recordCreatedById) return false;
    return String(currentUser.id) === String(recordCreatedById);
  };

  /**
   * Phân quyền chức năng Giao việc:
   * Chỉ có role Quản trị và role Admin cùng role mà tài khoản đó thiết lập công ty ở cộng đồng
   * thì mới hiện ở giao diện. Các tài khoản thuộc role nhỏ sẽ không nhìn thấy chức năng giao việc.
   */
  const canAssignTask = (communityCreatorId?: string | number | null, isCompanyFounder?: boolean): boolean => {
    if (isQuanTri || isAdmin) return true;
    if (isCompanyFounder) return true;
    if (currentUser?.id && communityCreatorId && String(currentUser.id) === String(communityCreatorId)) {
      return true;
    }
    return false;
  };

  return {
    roles,
    srsRole,
    currentUser,
    isQuanTri,
    isAdmin,
    isPlatformAdmin,
    isModerator,
    isBQT,
    isBTV,
    isBTC,
    isBTT,
    isHVT,
    canManageMembers,
    canApproveMembers,
    canRenewMembers,
    canManageFinance,
    canManageMedia,
    canManageEvents,
    canScanQR,
    canManageSystem,
    canEditRecord,
    canAssignTask,
    loading,
    setRoleOverride,
    reloadRole: syncUserRoles,
  };
}

