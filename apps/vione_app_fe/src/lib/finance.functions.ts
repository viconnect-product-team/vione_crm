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

export const listTransactionsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<Transaction[]> => {
    const { data, error } = await getDb(context)
      .from("transactions")
      .select("*")
      .order("date", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: any) => mapTx(r as Row));
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
    const { genCode, logActivity } = await import("./crud.server");
    const code = genCode(data.type === "income" ? "THU" : "CHI");
    const dbPayload = {
      code,
      date: data.date,
      type: data.type,
      category: data.category,
      description: data.description,
      amount: data.amount,
      method: data.method,
      status: data.status,
      advance_amount: data.advanceAmount,
      refund_amount: data.refundAmount,
      invoice_url: data.invoiceUrl || `/invoices/${code}.pdf`,
      recipient: data.recipient,
    };
    const { data: row, error } = await getDb(context)
      .from("transactions")
      .insert(dbPayload)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await logActivity(getDb(context), { action: "Tạo giao dịch", target: code, category: "fee" });
    return mapTx(row);
  });

export const updateTransactionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => txInput.extend({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<Transaction> => {
    const { logActivity } = await import("./crud.server");
    const { id, advanceAmount, refundAmount, invoiceUrl, ...rest } = data;
    const dbUpdate = {
      ...rest,
      advance_amount: advanceAmount,
      refund_amount: refundAmount,
      invoice_url: invoiceUrl,
      recipient: data.recipient,
    };
    const { data: row, error } = await getDb(context)
      .from("transactions")
      .update(dbUpdate)
      .eq("code", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await logActivity(getDb(context), {
      action: "Cập nhật giao dịch",
      target: id,
      category: "fee",
    });
    return mapTx(row);
  });

export const deleteTransactionFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const { logActivity } = await import("./crud.server");
    const { error } = await getDb(context).from("transactions").delete().eq("code", data.id);
    if (error) throw new Error(error.message);
    await logActivity(getDb(context), {
      action: "Xóa giao dịch",
      target: data.id,
      category: "fee",
    });
    return { ok: true };
  });
