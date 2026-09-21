import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ActivityLog } from "@/lib/extra-data";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "@/lib/api-client";

export const listActivityLogFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<ActivityLog[]> => {
    const data = await fetchNestApiFromServer("/ai/activity-log", context.token) as any[];
    return (data ?? []).map((l: any) => ({
      id: l.code ?? l.id,
      user: l.user,
      action: l.action,
      target: l.target,
      category: l.category as ActivityLog["category"],
      at: l.at,
      ip: l.ip,
    }));
  });

// Audit log is system-written; only deletion (cleanup) is allowed.
export const deleteActivityFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    await fetchNestApiFromServer(`/ai/activity-log/${data.id}`, context.token, { method: "DELETE" });
    return { ok: true };
  });

export const clearActivityFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<{ ok: boolean }> => {
    await fetchNestApiFromServer("/ai/activity-log/clear", context.token, { method: "POST", body: "{}" });
    return { ok: true };
  });
