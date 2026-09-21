import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { RenewalRecord } from "./renewal-data";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { addOneYear, toRecord, type Row } from "./renewals-calc";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

const codeFromId = (id: string) => id.replace(/^RNW-/, "");

const NO_PERMISSION =
  "Không thể cập nhật hội viên — bạn không có quyền quản trị trong không gian làm việc này.";

import { fetchNestApiFromServer } from "@/lib/api-client";

export const listRenewalsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<RenewalRecord[]> => {
    const token = (context as any)?.token;
    try {
      const nestMembers = await fetchNestApiFromServer<any[]>("/members", token);
      if (Array.isArray(nestMembers) && nestMembers.length > 0) {
        return nestMembers.map((r: any) => toRecord(r as Row));
      }
    } catch (e) {
      console.warn("Fallback to db for listRenewals:", e);
    }

    const { getActiveAssociationId } = await import("./assoc-scope.server");
    const activeId = await getActiveAssociationId(getDb(context));
    let query = getDb(context).from("members").select("*").order("code", { ascending: true });
    if (activeId) query = query.eq("association_id", activeId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => toRecord(r as Row));
  });

export const renewMembershipFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<RenewalRecord> => {
    const code = codeFromId(data.id);
    const token = (context as any)?.token;
    try {
      const renewed = await fetchNestApiFromServer<any>(`/members/${code}/renew`, token, {
        method: "POST",
      });
      if (renewed) {
        return toRecord(renewed as Row);
      }
    } catch (e) {
      console.warn("Fallback to db for renewMembership:", e);
    }

    const { data: cur, error: cErr } = await getDb(context)
      .from("members")
      .select("term_end")
      .eq("code", code)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!cur) throw new Error("Không tìm thấy hội viên.");
    const base = (cur as Row).term_end ? new Date((cur as Row).term_end as string) : new Date();
    const newEnd = addOneYear(base).toISOString().slice(0, 10);

    const { data: row, error } = await getDb(context)
      .from("members")
      .update({
        new_term_end: newEnd,
        renewed_at: new Date().toISOString().slice(0, 10),
        fee_paid: true,
        payment_status: "paid",
      })
      .eq("code", code)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error(NO_PERMISSION);
    return toRecord(row as Row);
  });

export const bulkRenewMembershipFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({ ids: z.array(z.string().min(1).max(128)).min(1).max(500) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ renewed: number }> => {
    const codes = data.ids.map(codeFromId);
    const { data: rows, error: cErr } = await getDb(context)
      .from("members")
      .select("code, term_end, renewed_at")
      .in("code", codes);
    if (cErr) throw new Error(cErr.message);
    const today = new Date().toISOString().slice(0, 10);
    let renewed = 0;
    for (const row of (rows ?? []) as Row[]) {
      if (row.renewed_at) continue;
      const base = row.term_end ? new Date(row.term_end as string) : new Date();
      const newEnd = addOneYear(base).toISOString().slice(0, 10);
      const { data: upd, error } = await getDb(context)
        .from("members")
        .update({
          new_term_end: newEnd,

          renewed_at: today,
          fee_paid: true,
          payment_status: "paid",
        })
        .eq("code", row.code as string)
        .select("code");
      if (error) throw new Error(error.message);
      if (!upd || upd.length === 0) throw new Error(NO_PERMISSION);
      renewed += 1;
    }
    return { renewed };
  });

export const sendRenewalReminderFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<RenewalRecord> => {
    const code = codeFromId(data.id);
    const token = (context as any)?.token;
    try {
      const reminded = await fetchNestApiFromServer<any>(`/members/${code}/remind`, token, {
        method: "POST",
      });
      if (reminded) {
        return toRecord(reminded as Row);
      }
    } catch (e) {
      console.warn("Fallback to db for sendRenewalReminder:", e);
    }

    const { data: cur, error: cErr } = await getDb(context)
      .from("members")
      .select("reminder_count")
      .eq("code", code)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!cur) throw new Error("Không tìm thấy hội viên.");
    const next = (((cur as Row).reminder_count as number) ?? 0) + 1;
    const { data: row, error } = await getDb(context)
      .from("members")
      .update({
        reminder_count: next,
        last_reminder: new Date().toISOString().slice(0, 10),
      })
      .eq("code", code)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error(NO_PERMISSION);
    return toRecord(row as Row);
  });

export const cancelRenewalFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<RenewalRecord> => {
    const code = codeFromId(data.id);
    const { data: row, error } = await getDb(context)
      .from("members")
      .update({
        new_term_end: null,
        renewed_at: null,
      })
      .eq("code", code)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error(NO_PERMISSION);
    return toRecord(row as Row);
  });

export const setPaymentStatusFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().min(1).max(128),
        status: z.enum(["unpaid", "pending", "paid"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<RenewalRecord> => {
    const code = codeFromId(data.id);
    const { data: row, error } = await getDb(context)
      .from("members")
      .update({
        payment_status: data.status,
        fee_paid: data.status === "paid",
      })
      .eq("code", code)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error(NO_PERMISSION);
    return toRecord(row as Row);
  });
