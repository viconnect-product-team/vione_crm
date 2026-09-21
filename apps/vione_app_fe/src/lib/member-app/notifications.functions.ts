import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "@/lib/api-client";

export type LeadWorkflowStatus =
  | "new"
  | "read"
  | "contacting"
  | "responded"
  | "won"
  | "lost"
  | "archived";

export type NotificationPriority = "high" | "medium" | "low";

export type MyNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  createdAt: string;
  type: "event" | "fee" | "opportunity" | "system" | "network" | "lead";
  unread: boolean;
  dismissed: boolean;
  priority: NotificationPriority;
  personal: boolean;
  refType?: string | null;
  refId?: string | null;
  leadStatus?: LeadWorkflowStatus | null;
  safeDisplayData?: any;
  notificationKind?: string;
};

// ---------- Notifications ----------
export const listMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<MyNotification[]> => {
    try {
      const items = await fetchNestApiFromServer<MyNotification[]>("/connect-app/me/notifications/member", context.token);
      return items || [];
    } catch {
      return [];
    }
  });

const bulkIdsSchema = z.object({ ids: z.array(z.string().uuid()) });

export const markAllNotificationsReadFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .handler(async ({ context }) => {
    try {
      await fetchNestApiFromServer("/connect-app/me/notifications/member/read-all", context.token, {
        method: "POST",
      });
      return { marked: 1, ids: [] };
    } catch {
      return { marked: 0, ids: [] };
    }
  });

export const unmarkAllNotificationsReadFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) => bulkIdsSchema.parse(data))
  .handler(async () => {
    return { restored: 0 };
  });

const markReadSchema = z.object({ id: z.string().uuid() });

export const markNotificationReadFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) => markReadSchema.parse(data))
  .handler(async ({ context, data }) => {
    try {
      await fetchNestApiFromServer("/connect-app/me/notifications/member/read", context.token, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return { marked: 1 };
    } catch {
      return { marked: 0 };
    }
  });

export const dismissNotificationFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) => markReadSchema.parse(data))
  .handler(async ({ context, data }) => {
    try {
      await fetchNestApiFromServer("/connect-app/me/notifications/member/dismiss", context.token, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return { dismissed: 1 };
    } catch {
      return { dismissed: 0 };
    }
  });

export const deleteNotificationFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) => markReadSchema.parse(data))
  .handler(async ({ context, data }) => {
    try {
      await fetchNestApiFromServer("/connect-app/me/notifications/member/delete", context.token, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return { deleted: 1 };
    } catch {
      return { deleted: 0 };
    }
  });


export const dismissAllNotificationsFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .handler(async ({ context }) => {
    try {
      await fetchNestApiFromServer("/connect-app/me/notifications/member/read-all", context.token, {
        method: "POST",
      });
      return { dismissed: 1, ids: [] };
    } catch {
      return { dismissed: 0, ids: [] };
    }
  });

export const restoreAllPersonalNotificationsFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) => bulkIdsSchema.parse(data))
  .handler(async () => {
    return { restored: 0 };
  });

const dismissBroadcastSchema = z.object({ ids: z.array(z.string().uuid()).min(1) });

export const dismissBroadcastNotificationsFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) => dismissBroadcastSchema.parse(data))
  .handler(async ({ context, data }) => {
    try {
      await fetchNestApiFromServer("/connect-app/me/notifications/member/dismiss-broadcast", context.token, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return { dismissed: data.ids.length };
    } catch {
      return { dismissed: 0 };
    }
  });

export const restoreNotificationFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) => markReadSchema.parse(data))
  .handler(async () => {
    return { restored: 0 };
  });

export const restoreBroadcastNotificationsFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) => dismissBroadcastSchema.parse(data))
  .handler(async () => {
    return { restored: 0 };
  });
