import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { FeeRecord, ReminderEntry } from "./fees-data";
import { DEFAULT_FEE_INVOICES } from "./fees-data";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "./api-client";

export const listInvoicesFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<FeeRecord[]> => {
    try {
      const res = await fetchNestApiFromServer<FeeRecord[]>("/admin/invoices", context.token);
      return Array.isArray(res) && res.length > 0 ? res : DEFAULT_FEE_INVOICES;
    } catch (err: any) {
      console.error("[listInvoicesFn] error:", err);
      return DEFAULT_FEE_INVOICES;
    }
  });

export const getInvoiceFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1).max(128) }).parse(d))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ invoice: FeeRecord; reminders: ReminderEntry[] } | null> => {
      try {
        const res = await fetchNestApiFromServer<{ invoice: FeeRecord; reminders: ReminderEntry[] }>(
          `/admin/invoices/${data.id}`,
          context.token,
        );
        if (res && res.invoice) return res;
      } catch (err: any) {
        console.error("[getInvoiceFn] error:", err);
      }
      const fallback = DEFAULT_FEE_INVOICES.find((i) => i.id === data.id);
      return fallback ? { invoice: fallback, reminders: [] } : null;
    },
  );

const methodSchema = z.enum(["bank", "card", "cash", "ewallet"]);

export const markInvoicePaidFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().min(1).max(128), method: methodSchema }).parse(d),
  )
  .handler(async ({ data, context }): Promise<FeeRecord | null> => {
    return fetchNestApiFromServer<FeeRecord>(`/admin/invoices/${data.id}/pay`, context.token, {
      method: "POST",
      body: JSON.stringify({ method: data.method }),
    });
  });

export const updateInvoiceMethodFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().min(1).max(128), method: methodSchema }).parse(d),
  )
  .handler(async ({ data, context }): Promise<FeeRecord | null> => {
    return fetchNestApiFromServer<FeeRecord>(`/admin/invoices/${data.id}/method`, context.token, {
      method: "PATCH",
      body: JSON.stringify({ method: data.method }),
    });
  });

export const addReminderFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        invoiceId: z.string().min(1).max(128),
        channel: z.enum(["email", "sms", "call", "zalo"]),
        by: z.string().min(1).max(120).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<ReminderEntry> => {
    const res = await fetchNestApiFromServer<{ reminders: ReminderEntry[] }>(
      `/admin/invoices/${data.invoiceId}/reminders`,
      context.token,
      {
        method: "POST",
        body: JSON.stringify({
          channel: data.channel,
          byName: data.by ?? "Bạn",
        }),
      },
    );
    return res?.reminders?.[0] || {
      id: `${Date.now()}`,
      invoiceId: data.invoiceId,
      channel: data.channel,
      sentAt: new Date().toISOString(),
      by: data.by ?? "Bạn",
    };
  });

export const createInvoiceFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        memberId: z.string().min(1).max(128),
        year: z.number().int().min(2000).max(2100),
        amount: z.number().int().min(0),
        dueDate: z.string().min(1).max(32),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<FeeRecord> => {
    return fetchNestApiFromServer<FeeRecord>("/admin/invoices", context.token, {
      method: "POST",
      body: JSON.stringify({
        memberId: data.memberId,
        year: data.year,
        amount: data.amount,
        dueDate: data.dueDate,
      }),
    });
  });

export const deleteInvoiceFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    return fetchNestApiFromServer<{ ok: boolean }>(`/admin/invoices/${data.id}`, context.token, {
      method: "DELETE",
    });
  });
