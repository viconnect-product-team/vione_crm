import { createServerFn } from "@tanstack/react-start";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";

// ---------- Member directory ----------
export type DirectoryMember = {
  code: string;
  name: string;
  company?: string | null;
  companyName?: string | null;
  contact?: string | null;
  personName?: string | null;
  personTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  about?: string | null;
  address?: string | null;
  website?: string | null;
  industry: string;
  region: string;
  type: "company" | "individual";
  verified: boolean;
  userId?: string | null;
  avatar?: string | null;
};

import { fetchNestApiFromServer } from "@/lib/api-client";

export const listMembers = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<DirectoryMember[]> => {
    return fetchNestApiFromServer("/members/directory", context.token);
  });
