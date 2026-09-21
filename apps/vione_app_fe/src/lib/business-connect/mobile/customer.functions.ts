// BC-Mobile-8A — RPC mỏng cho "Khách hàng của tôi".
// Directs all requests to backend NestJS RESTful API.

import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "../../api-client";
import {
  CUSTOMER_MAX_NAME_LEN,
  CUSTOMER_MAX_NOTE_LEN,
  CUSTOMER_MAX_SOURCE_LEN,
  CUSTOMER_MAX_TAG_NAME_LEN,
  CUSTOMER_MAX_TAGS_PER_CUSTOMER,
  CUSTOMER_NEED_MAX_BODY_LEN,
  CUSTOMER_STAGES,
  CUSTOMER_NEED_KINDS,
  CUSTOMER_NEED_PRIORITIES,
  type BcCustomer,
  type BcCustomerLog,
  type BcCustomerTag,
  type BcCustomerTagSuggestionRun,
  type BcCustomerTagSuggestionFeedback,
  type BcCustomerNeed,
  type BcCustomerResult,
} from "./customer.types";

const personIdSchema = z.string().min(2).max(120);
const stageSchema = z.enum(CUSTOMER_STAGES);
const isoSchema = z.string().min(4).max(40);

// ── List ────────────────────────────────────────────────----------------────
export const bcMobileCustomersFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<BcCustomerResult<{ customers: BcCustomer[] }>> => {
    return fetchNestApiFromServer("/connect-app/customer", context.token);
  });

// ── Create ──────────────────────────────────────────────────────────────────
const createInput = z.object({
  personId: personIdSchema,
  displayName: z.string().max(CUSTOMER_MAX_NAME_LEN + 40).nullish(),
  companyName: z.string().max(CUSTOMER_MAX_NAME_LEN + 40).nullish(),
  stage: stageSchema.default("prospect"),
  expectedValue: z.number().nullish(),
  currency: z.enum(["VND", "USD"]).default("VND"),
  sourceLabel: z.string().max(CUSTOMER_MAX_SOURCE_LEN + 40).nullish(),
  note: z.string().max(CUSTOMER_MAX_NOTE_LEN + 200).nullish(),
  nextActionAt: isoSchema.nullish(),
});

export const bcMobileCustomerCreateFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) => createInput.parse(data))
  .handler(async ({ data, context }): Promise<BcCustomerResult<{ customer: BcCustomer }>> => {
    return fetchNestApiFromServer("/connect-app/customer", context.token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

// ── Update ──────────────────────────────────────────────────────────────────
const updateInput = z.object({
  customerId: z.string().uuid(),
  stage: stageSchema.optional(),
  expectedValue: z.number().nullish(),
  currency: z.enum(["VND", "USD"]).optional(),
  sourceLabel: z.string().max(CUSTOMER_MAX_SOURCE_LEN + 40).nullish(),
  note: z.string().max(CUSTOMER_MAX_NOTE_LEN + 200).nullish(),
  nextActionAt: isoSchema.nullish(),
});

export const bcMobileCustomerUpdateFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) => updateInput.parse(data))
  .handler(async ({ data, context }): Promise<BcCustomerResult<{ customer: BcCustomer }>> => {
    const { customerId, ...rest } = data;
    return fetchNestApiFromServer(`/connect-app/customer/${customerId}`, context.token, {
      method: "PATCH",
      body: JSON.stringify(rest),
    });
  });

// ── Delete ──────────────────────────────────────────────────────────────────
export const bcMobileCustomerDeleteFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) => z.object({ customerId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<BcCustomerResult<Record<string, never>>> => {
    return fetchNestApiFromServer(`/connect-app/customer/${data.customerId}`, context.token, {
      method: "DELETE",
    });
  });

// ── Care log ────────────────────────────────────────────────────────────────
export const bcMobileCustomerLogsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((data) => z.object({ customerId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<BcCustomerResult<{ logs: BcCustomerLog[] }>> => {
    return fetchNestApiFromServer(`/connect-app/customer/${data.customerId}/logs`, context.token);
  });

const logInput = z.object({
  customerId: z.string().uuid(),
  kind: z.enum(["call", "meeting", "email", "message", "note"]),
  body: z.string().max(CUSTOMER_MAX_NOTE_LEN + 200).nullish(),
  occurredAt: isoSchema.nullish(),
});

export const bcMobileCustomerLogAddFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) => logInput.parse(data))
  .handler(async ({ data, context }): Promise<BcCustomerResult<{ log: BcCustomerLog }>> => {
    const { customerId, ...rest } = data;
    return fetchNestApiFromServer(`/connect-app/customer/${customerId}/logs`, context.token, {
      method: "POST",
      body: JSON.stringify(rest),
    });
  });

// ── Nhãn / phân nhóm khách hàng ─────────────────────────────────────────────
export const bcMobileCustomerTagsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<BcCustomerResult<{ tags: BcCustomerTag[] }>> => {
    return fetchNestApiFromServer("/connect-app/customer/tags", context.token);
  });

const tagNameSchema = z.string().min(1).max(CUSTOMER_MAX_TAG_NAME_LEN + 40);

export const bcMobileCustomerTagCreateFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) => z.object({ name: tagNameSchema }).parse(data))
  .handler(async ({ data, context }): Promise<BcCustomerResult<{ tag: BcCustomerTag }>> => {
    return fetchNestApiFromServer("/connect-app/customer/tags", context.token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

export const bcMobileCustomerTagRenameFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) =>
    z.object({ tagId: z.string().uuid(), name: tagNameSchema }).parse(data),
  )
  .handler(async ({ data, context }): Promise<BcCustomerResult<{ tag: BcCustomerTag }>> => {
    const { tagId, ...rest } = data;
    return fetchNestApiFromServer(`/connect-app/customer/tags/${tagId}`, context.token, {
      method: "PATCH",
      body: JSON.stringify(rest),
    });
  });

export const bcMobileCustomerTagDeleteFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) => z.object({ tagId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<BcCustomerResult<Record<string, never>>> => {
    return fetchNestApiFromServer(`/connect-app/customer/tags/${data.tagId}`, context.token, {
      method: "DELETE",
    });
  });

export const bcMobileCustomerSetTagsFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) =>
    z
      .object({
        customerId: z.string().uuid(),
        names: z.array(tagNameSchema).max(CUSTOMER_MAX_TAGS_PER_CUSTOMER * 3),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<BcCustomerResult<{ tagIds: string[] }>> => {
    const { customerId, ...rest } = data;
    return fetchNestApiFromServer(`/connect-app/customer/${customerId}/tags`, context.token, {
      method: "PUT",
      body: JSON.stringify(rest),
    });
  });

// ── Điểm đau & nhu cầu ──────────────────────────────────────────────────────
export const bcMobileCustomerNeedsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((data) => z.object({ customerId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<BcCustomerResult<{ needs: BcCustomerNeed[] }>> => {
    return fetchNestApiFromServer(`/connect-app/customer/${data.customerId}/needs`, context.token);
  });

export const bcMobileCustomerNeedAddFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) =>
    z
      .object({
        customerId: z.string().uuid(),
        kind: z.enum(CUSTOMER_NEED_KINDS),
        body: z.string().min(1).max(CUSTOMER_NEED_MAX_BODY_LEN),
        priority: z.enum(CUSTOMER_NEED_PRIORITIES).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<BcCustomerResult<{ need: BcCustomerNeed }>> => {
    const { customerId, ...rest } = data;
    return fetchNestApiFromServer(`/connect-app/customer/${customerId}/needs`, context.token, {
      method: "POST",
      body: JSON.stringify(rest),
    });
  });

export const bcMobileCustomerNeedUpdateFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) =>
    z
      .object({
        needId: z.string().uuid(),
        body: z.string().max(CUSTOMER_NEED_MAX_BODY_LEN).optional(),
        priority: z.enum(CUSTOMER_NEED_PRIORITIES).optional(),
        status: z.enum(["open", "resolved"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<BcCustomerResult<{ need: BcCustomerNeed }>> => {
    const { needId, ...rest } = data;
    return fetchNestApiFromServer(`/connect-app/customer/needs/${needId}`, context.token, {
      method: "PATCH",
      body: JSON.stringify(rest),
    });
  });

export const bcMobileCustomerNeedDeleteFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) => z.object({ needId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<BcCustomerResult<Record<string, never>>> => {
    return fetchNestApiFromServer(`/connect-app/customer/needs/${data.needId}`, context.token, {
      method: "DELETE",
    });
  });

// ── AI Tag Suggestion ──
export const bcMobileCustomerTagSuggestFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) =>
    z
      .object({
        customerId: z.string().uuid(),
        sources: z
          .object({ note: z.boolean(), logs: z.boolean(), needs: z.boolean() })
          .partial()
          .optional(),
      })
      .parse(data),
  )
  .handler(
    async ({
      data,
      context,
    }): Promise<
      BcCustomerResult<{
        runId: string | null;
        suggestions: { name: string; reason: string; existing: boolean; confidence: number }[];
      }>
    > => {
      const { customerId, ...rest } = data;
      return fetchNestApiFromServer(`/connect-app/customer/${customerId}/tag-suggestions`, context.token, {
        method: "POST",
        body: JSON.stringify(rest),
      });
    },
  );

export const bcMobileCustomerTagSuggestHistoryFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((data) => z.object({ customerId: z.string().uuid() }).parse(data))
  .handler(
    async ({ data, context }): Promise<BcCustomerResult<{ runs: BcCustomerTagSuggestionRun[] }>> => {
      return fetchNestApiFromServer(`/connect-app/customer/${data.customerId}/tag-suggestions/history`, context.token);
    },
  );

export const bcMobileCustomerTagSuggestFeedbackFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data) =>
    z
      .object({
        customerId: z.string().uuid(),
        runId: z.string().uuid().nullish(),
        tagName: z.string().trim().min(1).max(48),
        verdict: z.enum(["good", "bad"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<BcCustomerResult<Record<string, never>>> => {
    const { customerId, ...rest } = data;
    return fetchNestApiFromServer(`/connect-app/customer/${customerId}/tag-suggestions/feedback`, context.token, {
      method: "POST",
      body: JSON.stringify(rest),
    });
  });

export const bcMobileCustomerTagSuggestFeedbackListFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((data) => z.object({ customerId: z.string().uuid() }).parse(data))
  .handler(
    async ({
      data,
      context,
    }): Promise<BcCustomerResult<{ feedback: BcCustomerTagSuggestionFeedback[] }>> => {
      return fetchNestApiFromServer(`/connect-app/customer/${data.customerId}/tag-suggestions/feedback`, context.token);
    },
  );
