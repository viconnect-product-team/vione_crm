// BC-3.1F — Global networking abuse & notification server-function adapters.
// Routed through NestJS API.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "@/lib/api-client";
import { GN_REPORT_CATEGORIES } from "./global-network/abuse.types";
import type { GnNotificationDTO, GnNotificationPrefs } from "./global-network/abuse.types";

const uuid = z.string().uuid();

export const reportUserFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        reportedUserId: uuid,
        category: z.enum(GN_REPORT_CATEGORIES),
        details: z.string().max(2000).optional(),
        connectionId: uuid.nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ reportId: string }> => {
    return await fetchNestApiFromServer<{ reportId: string }>(
      "/connect-app/network/abuse/reports",
      context.token,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  });

export const listNetworkNotificationsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator(
    (input: unknown) =>
      z
        .object({ limit: z.number().int().min(1).max(100).optional() })
        .optional()
        .parse(input) ?? {},
  )
  .handler(async ({ data, context }): Promise<GnNotificationDTO[]> => {
    try {
      const url = data.limit ? `/connect-app/me/notifications?limit=${data.limit}` : "/connect-app/me/notifications";
      const res = await fetchNestApiFromServer<GnNotificationDTO[]>(url, context.token);
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  });

export const countUnreadNotificationsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<{ count: number }> => {
    try {
      return await fetchNestApiFromServer<{ count: number }>(
        "/connect-app/me/notifications/unread-count",
        context.token,
      );
    } catch {
      return { count: 0 };
    }
  });

export const markNotificationsReadFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator(
    (input: unknown) =>
      z
        .object({ ids: z.array(uuid).max(200).optional() })
        .optional()
        .parse(input) ?? {},
  )
  .handler(async ({ data, context }): Promise<{ updated: number }> => {
    return await fetchNestApiFromServer<{ updated: number }>(
      "/connect-app/me/notifications/read",
      context.token,
      {
        method: "PATCH",
        body: JSON.stringify({ ids: data.ids }),
      },
    );
  });

export const getNotificationPrefsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<GnNotificationPrefs> => {
    try {
      return await fetchNestApiFromServer<GnNotificationPrefs>(
        "/connect-app/me/notifications/prefs",
        context.token,
      );
    } catch {
      return {
        connectionRequest: true,
        connectionAccepted: true,
        connectionStatusUpdate: true,
      };
    }
  });

export const setNotificationPrefsFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        connectionRequest: z.boolean(),
        connectionAccepted: z.boolean(),
        connectionStatusUpdate: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<GnNotificationPrefs> => {
    return await fetchNestApiFromServer<GnNotificationPrefs>(
      "/connect-app/me/notifications/prefs",
      context.token,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );
  });

