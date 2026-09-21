// Phiên & thiết bị — RPC mỏng (thin wrappers only).
// Directs all requests to backend NestJS RESTful API.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "../../api-client";
import type { DeviceSessionInfo } from "./device-session.types";

const deviceKeySchema = z.string().min(6).max(120);

const listSchema = z.object({ deviceKey: deviceKeySchema.nullable().optional() });

const heartbeatSchema = z.object({
  deviceKey: deviceKeySchema,
  label: z.string().max(120).nullable().optional(),
  platform: z.string().max(60).nullable().optional(),
  browser: z.string().max(60).nullable().optional(),
  isStandalone: z.boolean().optional(),
});

const revokeSchema = z.object({
  sessionId: z.string().uuid(),
  deviceKey: deviceKeySchema.nullable().optional(),
});

export const bcDeviceSessionsListFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((data: unknown) => listSchema.parse(data))
  .handler(async ({ data, context }): Promise<DeviceSessionInfo[]> => {
    const queryParams = new URLSearchParams();
    if (data.deviceKey) queryParams.set("deviceKey", data.deviceKey);
    const queryString = queryParams.toString();
    return fetchNestApiFromServer(
      `/connect-app/me/device-sessions${queryString ? `?${queryString}` : ""}`,
      context.token,
    );
  });

export const bcDeviceSessionTouchFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data: unknown) => heartbeatSchema.parse(data))
  .handler(
    ({ data, context }): Promise<{ revoked: boolean }> =>
      fetchNestApiFromServer("/connect-app/me/device-sessions/touch", context.token, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  );

export const bcDeviceSessionRevokeFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data: unknown) => revokeSchema.parse(data))
  .handler(async ({ data, context }): Promise<DeviceSessionInfo> => {
    const queryParams = new URLSearchParams();
    if (data.deviceKey) queryParams.set("deviceKey", data.deviceKey);
    const queryString = queryParams.toString();
    return fetchNestApiFromServer(
      `/connect-app/me/device-sessions/${data.sessionId}${queryString ? `?${queryString}` : ""}`,
      context.token,
      {
        method: "DELETE",
      },
    );
  });
