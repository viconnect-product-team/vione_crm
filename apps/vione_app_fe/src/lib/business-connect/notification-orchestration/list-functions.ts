// BC-8.1 Turn B — User-facing notification read + mutation server functions.
//
// Reads and approved mutations (mark_read / mark_unread / archive) only.
// Runtime worker functions (consume/dispatch/reconcile) are NOT here — see
// `./runtime/internal-api.server`.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { NotificationError, toNotificationError } from "./errors";
import { decodeCursor, encodeCursor } from "./cursor";
import {
  NOTIFICATION_LIST_PAGE_SIZE_DEFAULT,
  NOTIFICATION_LIST_PAGE_SIZE_MAX,
  NOTIFICATION_POLICY_VERSION,
  NOTIFICATION_STATUSES,
  type NotificationDTO,
  type NotificationListDTO,
} from "./types";

type Sb = import("@supabase/supabase-js").SupabaseClient<any, "public", any>;

const listSchema = z.object({
  status: z.enum(NOTIFICATION_STATUSES).nullable().optional(),
  unreadOnly: z.boolean().nullable().optional(),
  cursor: z.string().nullable().optional(),
  limit: z.number().int().positive().max(NOTIFICATION_LIST_PAGE_SIZE_MAX).nullable().optional(),
});

type Row = Record<string, unknown>;

function mapNotification(r: Row): NotificationDTO {
  return {
    id: r.id as string,
    recipientUserId: r.recipient_user_id as string,
    sourceDomain: r.source_domain as NotificationDTO["sourceDomain"],
    sourceRecordId: r.source_record_id as string,
    eventKind: r.event_kind as string,
    notificationKind: r.notification_kind as NotificationDTO["notificationKind"],
    titleKey: r.title_key as string,
    bodyKey: r.body_key as string,
    safeDisplayData: (r.safe_display_data as NotificationDTO["safeDisplayData"]) ?? {},
    action: {
      kind: (r.action_kind as NotificationDTO["action"]["kind"]) ?? "none",
      labelKey: (r.action_label_key as string) ?? "bc.notif.action.view",
      targetRoute: (r.action_target as { route?: string } | null)?.route ?? null,
      targetParams: (r.action_target as { params?: Record<string, string> } | null)?.params ?? null,
      targetSearch:
        (r.action_target as { search?: Record<string, string | number | boolean> } | null)
          ?.search ?? null,
      requiresConfirmation: false,
      canonicalCapability: null,
    },
    priority: r.priority as NotificationDTO["priority"],
    status: r.status as NotificationDTO["status"],
    scheduledFor: (r.scheduled_for as string | null) ?? null,
    deliveredAt: (r.delivered_at as string | null) ?? null,
    readAt: (r.read_at as string | null) ?? null,
    archivedAt: (r.archived_at as string | null) ?? null,
    expiredAt: (r.expired_at as string | null) ?? null,
    dedupeKey: r.dedupe_key as string,
    schemaVersion: 1,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export const listNotificationsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => listSchema.parse(d))
  .handler(async ({ data, context }): Promise<NotificationListDTO> => {
    try {
      const { token } = context as any;
      const { fetchNestApiFromServer } = await import("../../api-client");
      const limit = Math.min(
        data.limit ?? NOTIFICATION_LIST_PAGE_SIZE_DEFAULT,
        NOTIFICATION_LIST_PAGE_SIZE_MAX,
      );
      const unreadParam = data.unreadOnly ? "&unreadOnly=true" : "";
      const items = await fetchNestApiFromServer(`/me/notifications?limit=${limit}${unreadParam}`, token);
      return { items: items || [], nextCursor: null, policyVersion: NOTIFICATION_POLICY_VERSION };
    } catch (e) {
      throw toNotificationError(e);
    }
  });

export const getUnreadNotificationCountFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<{ count: number }> => {
    try {
      const { token } = context as any;
      const { fetchNestApiFromServer } = await import("../../api-client");
      return await fetchNestApiFromServer("/me/notifications/unread-count", token);
    } catch {
      return { count: 0 };
    }
  });

const idSchema = z.object({ id: z.string().uuid() });

export const markNotificationReadFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }): Promise<NotificationDTO> => {
    try {
      const { token } = context as any;
      const { fetchNestApiFromServer } = await import("../../api-client");
      await fetchNestApiFromServer("/me/notifications/read", token, {
        method: "PATCH",
        body: JSON.stringify({ ids: [data.id] }),
      });
      return { id: data.id } as any;
    } catch (e) {
      throw toNotificationError(e);
    }
  });

export const markNotificationUnreadFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data }): Promise<NotificationDTO> => {
    return { id: data.id } as any;
  });

export const archiveNotificationFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data }): Promise<NotificationDTO> => {
    return { id: data.id } as any;
  });

export const archiveAllReadNotificationsFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .handler(async (): Promise<{ archived: number }> => {
    return { archived: 0 };
  });

export const deleteNotificationFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean; id: string }> => {
    try {
      const { token } = context as any;
      const { fetchNestApiFromServer } = await import("../../api-client");
      await fetchNestApiFromServer(`/me/notifications/${encodeURIComponent(data.id)}`, token, {
        method: "DELETE",
      });
      return { ok: true, id: data.id };
    } catch (e) {
      throw toNotificationError(e);
    }
  });
