// Admin lookup for the renewal audit log.
// Migrated from Supabase client to NestJS REST API.
// Platform admins see every association; association admins are scoped to
// the associations they administer via memberships.role = 'admin'.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "./api-client";

export type AdminRenewalAuditRow = {
  id: string;
  eventType: "payment" | "idempotent_noop" | "failure";
  memberId: string | null;
  memberName: string | null;
  memberCode: string | null;
  associationId: string | null;
  associationName: string | null;
  reference: string;
  method: string | null;
  amountPaid: number;
  invoiceNo: string | null;
  previousTermEnd: string | null;
  newTermEnd: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  metadata: Record<string, any>;
  createdAt: string;
};

export type AdminRenewalAuditScope = {
  isPlatformAdmin: boolean;
  associations: { id: string; name: string }[];
};

/** Associations the caller may inspect. Empty list ⇒ not an admin. */
export const getRenewalAuditScopeFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<AdminRenewalAuditScope> => {
    const { token } = context as any;
    try {
      return await fetchNestApiFromServer<AdminRenewalAuditScope>(
        "/public/admin/renewal-scope",
        token,
      );
    } catch {
      return { isPlatformAdmin: false, associations: [] };
    }
  });

const querySchema = z.object({
  associationId: z.string().uuid().nullish(),
  memberId: z.string().uuid().nullish(),
  search: z.string().max(120).nullish(),
  eventType: z.enum(["payment", "idempotent_noop", "failure"]).nullish(),
  from: z.string().max(40).nullish(),
  to: z.string().max(40).nullish(),
  limit: z.number().int().min(1).max(500).nullish(),
});

export const searchRenewalAuditLogFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) => querySchema.parse(input ?? {}))
  .handler(async ({ context, data }): Promise<AdminRenewalAuditRow[]> => {
    const { token } = context as any;
    return fetchNestApiFromServer<AdminRenewalAuditRow[]>(
      "/public/admin/renewal-audit",
      token,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  });

