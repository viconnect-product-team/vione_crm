import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import type {
  ActivityEntry,
  ActivityType,
  EventEntry,
  EventRole,
  PaymentEntry,
  PayMethod,
  PayStatus,
} from "./companies-history";

export type CompanyHistory = {
  activities: ActivityEntry[];
  events: EventEntry[];
  payments: PaymentEntry[];
};

function actType(category: string | null, action: string): ActivityType {
  const c = (category ?? "").toLowerCase();
  const a = (action ?? "").toLowerCase();
  if (c === "fee" || a.includes("thanh toán") || a.includes("payment")) return "payment";
  if (c === "event" || a.includes("sự kiện") || a.includes("event")) return "event";
  if (a.includes("email") || a.includes("bản tin")) return "email";
  if (a.includes("gọi") || a.includes("call")) return "call";
  if (a.includes("họp") || a.includes("meeting")) return "meeting";
  return "note";
}

function payMethod(m: string | null): PayMethod {
  switch ((m ?? "").toLowerCase()) {
    case "card":
      return "card";
    case "cash":
      return "cash";
    case "evoucher":
      return "evoucher";
    default:
      return "bank";
  }
}

function payStatus(s: string | null): PayStatus {
  switch ((s ?? "").toLowerCase()) {
    case "paid":
      return "paid";
    case "refunded":
      return "refunded";
    default:
      return "pending";
  }
}

function eventRole(ticket: string | null): EventRole {
  switch ((ticket ?? "").toLowerCase()) {
    case "sponsor":
      return "sponsor";
    case "speaker":
      return "speaker";
    case "partner":
      return "partner";
    default:
      return "attendee";
  }
}

/** Builds a company's real history from activity_log, event_registrations and invoices. */
export const getCompanyHistoryFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().min(1).max(128),
        code: z.string().max(64).default(""),
        name: z.string().max(300).default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<CompanyHistory> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const supabase = supabaseAdmin;

    // --- Activities: activity_log rows targeting this company (by code or name) ---
    const targets = [data.code, data.name].filter(Boolean);
    let activities: ActivityEntry[] = [];
    if (targets.length) {
      const { data: rows, error } = await supabase
        .from("activity_log")
        .select("code, user, action, target, category, at, created_at")
        .in("target", targets)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      activities = (rows ?? []).map((r: any) => ({
        id: r.code as string,
        type: actType(r.category as string | null, r.action as string),
        title: r.action as string,
        by: (r.user as string) ?? "—",
        detail: (r.target as string) ?? undefined,
        date: (r.created_at as string) ?? new Date().toISOString(),
      }));
    }

    // --- Events: registrations of this member, enriched with event details ---
    let events: EventEntry[] = [];
    if (data.code) {
      const { data: regs, error } = await supabase
        .from("event_registrations")
        .select("id, event_id, registered_at, status, ticket_type")
        .eq("member_code", data.code)
        .order("registered_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const eventIds = [...new Set((regs ?? []).map((r: any) => r.event_id as string).filter(Boolean))];
      const eventMap = new Map<string, { name: string; date: string; registered: number }>();
      if (eventIds.length) {
        const { data: evs } = await supabase
          .from("events")
          .select("id, name, date, registered")
          .in("id", eventIds);
        for (const e of evs ?? [])
          eventMap.set(e.id as string, {
            name: e.name as string,
            date: e.date as string,
            registered: Number(e.registered ?? 0),
          });
      }
      events = (regs ?? []).map((r: any) => {
        const ev = eventMap.get(r.event_id as string);
        return {
          id: r.id as string,
          name: ev?.name ?? (r.event_id as string) ?? "—",
          date: ev?.date ?? (r.registered_at as string) ?? new Date().toISOString(),
          role: eventRole(r.ticket_type as string | null),
          checkedIn: (r.status as string) === "checked-in" || (r.status as string) === "attended",
          attendees: ev?.registered ?? 0,
        };
      });
    }

    // --- Payments: invoices belonging to this member ---
    // (transactions has no member reference, so member-scoped payments come from invoices) ---
    let invs: Record<string, unknown>[] = [];
    if (data.id) {
      const { data: rows, error: invErr } = await supabase
        .from("invoices")
        .select("invoice_no, year, amount, due_date, paid_at, status, method")
        .eq("member_id", data.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (invErr) throw invErr;
      invs = rows ?? [];
    }
    const payments: PaymentEntry[] = (invs ?? []).map((i, idx) => ({
      id: (i.invoice_no as string) ?? `inv-${idx}`,
      invoice: (i.invoice_no as string) ?? "—",
      date: (i.paid_at as string) ?? (i.due_date as string) ?? new Date().toISOString(),
      kind: "fee",
      description: `Hội phí ${i.year ?? ""}`.trim(),
      amount: Number(i.amount ?? 0),
      method: payMethod(i.method as string | null),
      status: payStatus(i.status as string | null),
    }));

    // Always return the full schema with arrays (never null/undefined fields).
    return {
      activities: activities ?? [],
      events: events ?? [],
      payments: payments ?? [],
    };
  });
