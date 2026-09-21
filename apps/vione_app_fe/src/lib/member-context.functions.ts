// Unified server-side Member Context resolver for the Member PWA (/m/*).
//
// P0-A1 foundation. Consolidates the identity/tenant lookups
// behind a single NestJS server function that returns ONLY a member-safe DTO.

import { createServerFn } from "@tanstack/react-start";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "@/lib/api-client";

export type MemberContextDTO = {
  /** Stable member code used across the app (never the raw auth user id). */
  memberCode: string | null;
  /** Active association slug/id resolved server-side. */
  associationId: string | null;
  /** Display fields safe to render in the shell (no PII beyond name/email). */
  displayName: string;
  email: string;
  avatarUrl: string | null;
  /** Membership lifecycle state, as reported by the members table. */
  membershipStatus: "active" | "pending" | "suspended" | "expired" | "unknown";
  /** True when the member is allowed to perform authoring actions
   *  (renew, register, check-in, express interest, update profile). */
  canAct: boolean;
  /** Preferred locale from the profile row, if any. */
  locale: string | null;
};

export const getCurrentMemberContext = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }: any): Promise<MemberContextDTO> => {
    try {
      const token = context?.token;
      const res = await fetchNestApiFromServer<MemberContextDTO>("/members/me/context", token);
      if (res) {
        return {
          memberCode: res.memberCode ?? null,
          associationId: res.associationId ?? null,
          displayName: res.displayName || res.email || "",
          email: res.email || "",
          avatarUrl: res.avatarUrl ?? null,
          membershipStatus: res.membershipStatus ?? "unknown",
          canAct: Boolean(res.canAct),
          locale: res.locale ?? "vi",
        };
      }
    } catch {
      // Fallback
    }

    return {
      memberCode: null,
      associationId: null,
      displayName: "",
      email: "",
      avatarUrl: null,
      membershipStatus: "unknown",
      canAct: false,
      locale: "vi",
    };
  });
