// BC-Mobile-8A — RPC mỏng cho hộp thư nội bộ (Inbox).
// Directs all requests to backend NestJS RESTful API.

import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "../../api-client";
import {
  DM_MAX_BODY_LEN,
  DM_PAGE_SIZE,
  type BcDmMessage,
  type BcDmResult,
  type BcDmThreadSummary,
} from "./dm.types";

export const bcDmThreadsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(
    async ({ context }): Promise<BcDmResult<{ threads: BcDmThreadSummary[] }>> => {
      try {
        const res = await fetchNestApiFromServer("/connect-app/dm/threads", context.token);
        if (Array.isArray(res)) return { ok: true, threads: res };
        if (res && res.ok && Array.isArray(res.threads)) return res;
        return { ok: true, threads: [] };
      } catch {
        return { ok: true, threads: [] };
      }
    },
  );

const openInput = z.object({ personId: z.string() });

export const bcDmOpenThreadFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) => openInput.parse(data))
  .handler(
    async ({ data, context }): Promise<BcDmResult<{ threadId: string }>> => {
      try {
        const res = await fetchNestApiFromServer("/connect-app/dm/threads", context.token, {
          method: "POST",
          body: JSON.stringify(data),
        });
        if (res && res.ok && res.threadId) return res;
        return { ok: false, error: "not_connected" };
      } catch {
        return { ok: false, error: "not_connected" };
      }
    },
  );

const threadInput = z.object({
  threadId: z.string(),
  limit: z.number().int().min(1).max(100).default(DM_PAGE_SIZE),
});

export const bcDmThreadFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((data) => threadInput.parse(data))
  .handler(
    async ({
      data,
      context,
    }): Promise<BcDmResult<{ thread: BcDmThreadSummary; messages: BcDmMessage[] }>> => {
      try {
        const res = await fetchNestApiFromServer(`/connect-app/dm/threads/${data.threadId}`, context.token);
        if (res && res.ok) return res;
        return { ok: false, error: "not_found" };
      } catch {
        return { ok: false, error: "not_found" };
      }
    },
  );

const sendInput = z.object({
  threadId: z.string(),
  body: z.string().max(DM_MAX_BODY_LEN + 200),
  clientToken: z.string(),
  replyTo: z
    .object({
      id: z.string(),
      senderName: z.string().optional(),
      preview: z.string().optional(),
    })
    .nullable()
    .optional(),
});

export const bcDmSendFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) => sendInput.parse(data))
  .handler(
    async ({ data, context }): Promise<BcDmResult<{ message: BcDmMessage }>> => {
      try {
        const { threadId, ...rest } = data;
        const res = await fetchNestApiFromServer(`/connect-app/dm/threads/${threadId}/messages`, context.token, {
          method: "POST",
          body: JSON.stringify(rest),
        });
        if (res && res.ok) return res;
        return { ok: false, error: "generic" as any };
      } catch {
        return { ok: false, error: "generic" as any };
      }
    },
  );

const reactInput = z.object({
  messageId: z.string(),
  emoji: z.string().min(1).max(10),
});

export const bcDmReactFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) => reactInput.parse(data))
  .handler(
    async ({ data, context }): Promise<BcDmResult<{ messageId: string; reactions: any[] }>> => {
      try {
        const res = await fetchNestApiFromServer(`/connect-app/dm/messages/${data.messageId}/reactions`, context.token, {
          method: "POST",
          body: JSON.stringify({ emoji: data.emoji }),
        });
        if (res && res.ok) return res;
        return { ok: false, error: "generic" as any };
      } catch {
        return { ok: false, error: "generic" as any };
      }
    },
  );

const markReadInput = z.object({ threadId: z.string() });

export const bcDmMarkReadFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) => markReadInput.parse(data))
  .handler(
    async ({ data, context }): Promise<BcDmResult<{ updated: number }>> => {
      try {
        const res = await fetchNestApiFromServer(`/connect-app/dm/threads/${data.threadId}/read`, context.token, {
          method: "POST",
        });
        return res ?? { ok: true, updated: 0 };
      } catch {
        return { ok: true, updated: 0 };
      }
    },
  );

const retractInput = z.object({ messageId: z.string().uuid() });

export const bcDmRetractFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) => retractInput.parse(data))
  .handler(
    async ({ data, context }): Promise<BcDmResult<{ message: BcDmMessage }>> => {
      try {
        const res = await fetchNestApiFromServer(`/connect-app/dm/messages/${data.messageId}`, context.token, {
          method: "DELETE",
        });
        return res ?? { ok: false, error: "not_found" };
      } catch {
        return { ok: false, error: "not_found" };
      }
    },
  );
