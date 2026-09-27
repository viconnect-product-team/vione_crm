import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

export type Transaction = {
  id: string;
  date: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  method: "bank" | "card" | "cash";
  status: "completed" | "pending";
  advanceAmount?: number;
  refundAmount?: number;
  invoiceUrl?: string;
  recipient?: string;
};

type Row = Record<string, unknown>;

function mapTx(tx: Row): Transaction {
  return {
    id: tx.code as string,
    date: tx.date ? (tx.date instanceof Date ? tx.date.toISOString().slice(0, 10) : String(tx.date).slice(0, 10)) : "",
    type: tx.type as Transaction["type"],
    category: tx.category as string,
    description: (tx.description as string) ?? "",
    amount: Number(tx.amount ?? 0),
    method: tx.method as Transaction["method"],
    status: tx.status as Transaction["status"],
    advanceAmount: Number(tx.advance_amount ?? 0),
    refundAmount: Number(tx.refund_amount ?? 0),
    invoiceUrl: (tx.invoice_url as string) ?? "",
    recipient: (tx.recipient as string) ?? "",
  };
}

import { fetchNestApiFromServer } from "./api-client";

export const listTransactionsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<Transaction[]> => {
    try {
      const res = await fetchNestApiFromServer<Transaction[]>("/admin/transactions", context.token);
      if (Array.isArray(res) && res.length > 0) {
        return res;
      }
      return [];
    } catch {
      return [];
    }
  });

const txInput = z.object({
  date: z.string().min(1).max(40),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1).max(100),
  description: z.string().max(500).default(""),
  amount: z.number().min(0).max(1e12).default(0),
  method: z.enum(["bank", "card", "cash"]),
  status: z.enum(["completed", "pending"]),
  advanceAmount: z.number().min(0).default(0),
  refundAmount: z.number().min(0).default(0),
  invoiceUrl: z.string().default(""),
  recipient: z.string().default(""),
});

export const createTransactionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => txInput.parse(d))
  .handler(async ({ data, context }): Promise<Transaction> => {
    const res = await fetchNestApiFromServer<Transaction>("/admin/transactions", context.token, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res;
  });

export const updateTransactionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => txInput.extend({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<Transaction> => {
    const res = await fetchNestApiFromServer<Transaction>(`/admin/transactions/${data.id}`, context.token, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res;
  });

export const deleteTransactionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    await fetchNestApiFromServer(`/admin/transactions/${data.id}`, context.token, {
      method: "DELETE",
    });
    return { ok: true };
  });
