// BC-Mobile-7F — Nhắc nhở của khoảnh khắc (RPC mỏng).
// Directs all requests to backend NestJS RESTful API.

import { createServerFn } from "@tanstack/react-start";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "../../api-client";
import type {
  BcMobileMomentReminder,
  BcMobileMomentReminderResult,
} from "./moment-reminder.types";

export const bcMobileMomentRemindersFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data: any) => data)
  .handler(
    ({ data, context }): Promise<BcMobileMomentReminderResult<{ reminders: BcMobileMomentReminder[] }>> => {
      const { momentId, includeDone, limit } = data;
      const params = new URLSearchParams();
      if (momentId) params.append("momentId", momentId);
      if (includeDone !== undefined) params.append("includeDone", String(includeDone));
      if (limit !== undefined) params.append("limit", String(limit));
      const queryStr = params.toString();
      return fetchNestApiFromServer(
        `/connect-app/moment/reminders${queryStr ? `?${queryStr}` : ""}`,
        context.token,
        {
          method: "GET",
        },
      );
    },
  );

export const bcMobileMomentReminderCreateFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data: any) => data)
  .handler(
    ({ data, context }): Promise<BcMobileMomentReminderResult<{ reminder: BcMobileMomentReminder }>> => {
      const { momentId, ...rest } = data;
      return fetchNestApiFromServer(`/connect-app/moment/${momentId}/reminders`, context.token, {
        method: "POST",
        body: JSON.stringify(rest),
      });
    },
  );

export const bcMobileMomentReminderSetStatusFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data: any) => data)
  .handler(
    ({ data, context }): Promise<BcMobileMomentReminderResult<{ reminder: BcMobileMomentReminder }>> => {
      const { reminderId, status } = data;
      return fetchNestApiFromServer(`/connect-app/moment/reminders/${reminderId}/status`, context.token, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
  );

export const bcMobileMomentReminderDeleteFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data: any) => data)
  .handler(
    ({ data, context }): Promise<BcMobileMomentReminderResult<{ reminderId: string }>> => {
      const reminderId = typeof data === "string" ? data : data.reminderId;
      return fetchNestApiFromServer(`/connect-app/moment/reminders/${reminderId}`, context.token, {
        method: "DELETE",
      });
    },
  );
