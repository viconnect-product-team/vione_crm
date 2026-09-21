import { useEffect, useState } from "react";
import { fetchNestApi } from "@/lib/api-client";

export type AppRole = "platform_admin" | "admin" | "moderator" | "member";

export type RoleState = {
  roles: AppRole[];
  isPlatformAdmin: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  loading: boolean;
};

// Fetches current user's roles from NestJS /users/me (including platform_admin and association admin rights).
export function useRole(): RoleState {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await fetchNestApi("/users/me");
        if (!active) return;
        if (me?.roles && Array.isArray(me.roles)) {
          const set = new Set<AppRole>(me.roles as AppRole[]);
          if (set.has("platform_admin")) {
            set.add("admin");
          }
          setRoles(Array.from(set));
        } else {
          setRoles([]);
        }
      } catch {
        if (active) setRoles([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const isPlatformAdmin = roles.includes("platform_admin");
  const isAdmin = isPlatformAdmin || roles.includes("admin");
  const isModerator = isAdmin || roles.includes("moderator");

  return {
    roles,
    isPlatformAdmin,
    isAdmin,
    isModerator,
    loading,
  };
}

