import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "@/lib/api-client";

export type LinkableMember = {
  id: string;
  code: string;
  name: string;
  email: string;
  associationId: string;
  associationName: string;
  alreadyLinked: boolean;
};

/** Members matching the signed-in account's email that can be linked. */
export const listLinkableMembersFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<LinkableMember[]> => {
    try {
      const res = await fetchNestApiFromServer<LinkableMember[]>("/members/me/linkable", context.token);
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  });

/** Link the current account to a member profile (email must match). */
export const linkMyMemberProfileFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ memberId: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }): Promise<{ memberId: string }> => {
    return await fetchNestApiFromServer<{ memberId: string }>("/members/me/link", context.token, {
      method: "POST",
      body: JSON.stringify({ memberId: data.memberId }),
    });
  });

/** Unlink a member profile from the current account. */
export const unlinkMyMemberProfileFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ memberId: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }): Promise<void> => {
    await fetchNestApiFromServer<{ success: boolean }>("/members/me/unlink", context.token, {
      method: "POST",
      body: JSON.stringify({ memberId: data.memberId }),
    });
  });
