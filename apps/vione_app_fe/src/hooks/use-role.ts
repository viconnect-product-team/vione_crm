import { useEffect, useState } from "react";
import { fetchNestApi } from "@/lib/api-client";

export type SrsRole = "ADM" | "BQT" | "BTV" | "BTC" | "BTT" | "HVT";
export type AppRole = "platform_admin" | "admin" | "moderator" | "member" | string;

export type RoleState = {
  roles: AppRole[];
  srsRole: SrsRole;
  isPlatformAdmin: boolean;
  isAdmin: boolean;
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
  loading: boolean;
  setRoleOverride: (role: SrsRole) => void;
};

// Fetches current user's roles from NestJS /users/me and member profile per SRS specification.
export function useRole(): RoleState {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [srsRole, setSrsRole] = useState<SrsRole>("HVT");
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

    // ADM (Super Admin / Platform Admin)
    if (rList.includes("platform_admin") || rList.includes("superadmin") || primaryRole === "platform_admin" || primaryRole === "superadmin") {
      return "ADM";
    }

    // BQT (Ban Quản Trị / Ban Chấp Hành / Chủ Tịch / Tổng Thư Ký)
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

    // Mặc định: HVT (Hội Viên Thường)
    return "HVT";
  };

  useEffect(() => {
    let active = true;
    (async () => {
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

        if (!active) return;

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
          set.add("platform_admin");
          set.add("admin");
        } else if (computedSrs === "BQT") {
          set.add("admin");
        }
        setRoles(Array.from(set));
      } catch {
        if (active) {
          setRoles([]);
          setSrsRole("HVT");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setRoleOverride = (newRole: SrsRole) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("vba_crm_role_override", newRole);
      setSrsRole(newRole);
      window.dispatchEvent(new Event("role-changed"));
    }
  };

  const isPlatformAdmin = srsRole === "ADM";
  const isBQT = srsRole === "BQT" || isPlatformAdmin;
  const isBTV = srsRole === "BTV" || isBQT;
  const isBTC = srsRole === "BTC" || isBQT;
  const isBTT = srsRole === "BTT" || isBQT;
  const isHVT = srsRole === "HVT";
  const isAdmin = isPlatformAdmin || isBQT;
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

  return {
    roles,
    srsRole,
    isPlatformAdmin,
    isAdmin,
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
    loading,
    setRoleOverride,
  };
}

