/**
 * notifications.functions.ts
 * Server functions cho thông báo quản trị CRM — gọi NestJS REST API, hỗ trợ realtime & routing.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Notification } from "@/lib/extra-data";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "./api-client";

export const listNotificationsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => (d ? z.object({ appScope: z.string().optional(), associationId: z.string().optional() }).optional().parse(d) : undefined))
  .handler(async ({ data, context }): Promise<Notification[]> => {
    try {
      const params = new URLSearchParams();
      if (data?.appScope) params.set("appScope", data.appScope);
      if (data?.associationId) params.set("associationId", data.associationId);
      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await fetchNestApiFromServer<Notification[]>(`/admin/notifications${query}`, context.token);
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.warn("[listNotificationsFn] Error fetching notifications from Nest API:", err);
      return [];
    }
  });

const notifInput = z.object({
  title: z.string().min(1).max(300),
  body: z.string().max(2000).default(""),
  audience: z.enum(["all", "members", "sponsors", "staff"]).default("all"),
  channel: z.enum(["inapp", "email", "sms"]).default("inapp"),
  appScope: z.enum(["crm", "vione_app", "association_app", "all"]).default("all"),
  targetApp: z.enum(["crm", "vione_app", "association_app", "all"]).default("all"),
  status: z.enum(["sent", "scheduled", "draft"]).default("sent"),
  associationId: z.string().optional(),
});

export const createNotificationFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => notifInput.parse(d))
  .handler(async ({ data, context }): Promise<Notification> => {
    return fetchNestApiFromServer<Notification>("/admin/notifications", context.token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

export const updateNotificationFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => notifInput.extend({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<Notification> => {
    return fetchNestApiFromServer<Notification>(`/admin/notifications/${encodeURIComponent(data.id)}`, context.token, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  });

// Mark a draft/scheduled notification as sent.
export const sendNotificationFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<Notification> => {
    return fetchNestApiFromServer<Notification>(`/admin/notifications/${encodeURIComponent(data.id)}/send`, context.token, {
      method: "POST",
    });
  });

export const deleteNotificationFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    return fetchNestApiFromServer<{ ok: boolean }>(`/admin/notifications/${encodeURIComponent(data.id)}`, context.token, {
      method: "DELETE",
    });
  });
