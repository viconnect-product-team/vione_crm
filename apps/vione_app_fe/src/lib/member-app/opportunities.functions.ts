import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "@/lib/api-client";

export type MyOpportunity = {
  id: string;
  tag: string;
  title: string;
  company: string;
  time: string;
  color?: string;
  interested: boolean;
  posterId?: string;
  posterCode?: string;
  posterName?: string;
  posterCompany?: string;
  posterPhone?: string;
  posterAvatar?: string;
  image?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactTitle?: string | null;
  description?: string;
  value?: string;
  estimatedValue?: number;
  budgetMin?: number;
  budgetMax?: number;
  views?: number;
  claimed?: boolean;
  claimedById?: string;
  claimedByName?: string;
  claimedAt?: string;
  claimedPhone?: string;
  claimedCompany?: string;
  status?: string;
};

// ---------- Opportunities ----------
export const listMyOpportunities = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<MyOpportunity[]> => {
    return fetchNestApiFromServer("/opportunities/my-opportunities", context.token);
  });

export const expressInterest = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        opportunityId: z.string().min(1).max(64),
        message: z.string().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    return fetchNestApiFromServer("/opportunities/express-interest", context.token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });
