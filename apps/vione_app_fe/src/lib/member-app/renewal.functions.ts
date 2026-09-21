import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "@/lib/api-client";

// ---------- Membership / Renewal ----------
export type MyMembershipInvoice = {
  id: string;
  invoice: string;
  year: number | null;
  amount: number;
  status: "paid" | "pending" | "overdue";
  dueDate: string | null;
  paidAt: string | null;
};

export type MyMembership = {
  found: boolean;
  code: string;
  name: string;
  level: string | null;
  status: string | null;
  joinedAt: string | null;
  termEnd: string | null;
  newTermEnd: string | null;
  renewedAt: string | null;
  feeYear: number | null;
  feePaid: boolean;
  daysToExpiry: number | null;
  outstandingAmount: number;
  invoices: MyMembershipInvoice[];
};

/** Returns the signed-in member's membership status, renewal schedule and dues. */
export const getMyMembership = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<MyMembership> => {
    try {
      const res = await fetchNestApiFromServer<MyMembership>("/members/me/membership", context.token);
      return (
        res || {
          found: false,
          code: "",
          name: "",
          level: null,
          status: null,
          joinedAt: null,
          termEnd: null,
          newTermEnd: null,
          renewedAt: null,
          feeYear: null,
          feePaid: false,
          daysToExpiry: null,
          outstandingAmount: 0,
          invoices: [],
        }
      );
    } catch {
      return {
        found: false,
        code: "",
        name: "",
        level: null,
        status: null,
        joinedAt: null,
        termEnd: null,
        newTermEnd: null,
        renewedAt: null,
        feeYear: null,
        feePaid: false,
        daysToExpiry: null,
        outstandingAmount: 0,
        invoices: [],
      };
    }
  });

// ---------- Renewal history (detail) ----------
export type RenewalHistoryEntry = {
  id: string;
  invoice: string;
  year: number | null;
  amount: number;
  method: string | null;
  status: "paid" | "pending" | "overdue";
  paidAt: string | null;
  dueDate: string | null;
  termStart: string | null;
  termEnd: string | null;
  note: string | null;
};

/** Returns the signed-in member's detailed renewal history (paid & pending). */
export const getMyRenewalHistory = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<RenewalHistoryEntry[]> => {
    try {
      const res = await fetchNestApiFromServer<RenewalHistoryEntry[]>("/members/me/renewal-history", context.token);
      return res || [];
    } catch {
      return [];
    }
  });

// ---------- Renewal reminder (in-app notification) ----------
export type RenewalReminderResult = {
  created: boolean;
  daysToExpiry: number | null;
  termEnd: string | null;
};

export const checkRenewalReminder = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<RenewalReminderResult> => {
    try {
      const mem = await fetchNestApiFromServer<MyMembership>("/members/me/membership", context.token);
      return {
        created: false,
        daysToExpiry: mem?.daysToExpiry ?? null,
        termEnd: mem?.newTermEnd || mem?.termEnd || null,
      };
    } catch {
      return { created: false, daysToExpiry: null, termEnd: null };
    }
  });

// ---------- Renewal Quote ----------
export type RenewalQuote = {
  found: boolean;
  code: string;
  amount: number;
  outstanding: number;
  renewalFee: number;
  currentTermEnd: string | null;
  nextTermEnd: string | null;
  pendingInvoices: string[];
};

export const getRenewalQuote = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<RenewalQuote> => {
    try {
      const res = await fetchNestApiFromServer<RenewalQuote>("/members/me/renewal-quote", context.token);
      return (
        res || {
          found: false,
          code: "",
          amount: 0,
          outstanding: 0,
          renewalFee: 0,
          currentTermEnd: null,
          nextTermEnd: null,
          pendingInvoices: [],
        }
      );
    } catch {
      return {
        found: false,
        code: "",
        amount: 0,
        outstanding: 0,
        renewalFee: 0,
        currentTermEnd: null,
        nextTermEnd: null,
        pendingInvoices: [],
      };
    }
  });

export type RenewalPaymentResult = {
  success: boolean;
  reference: string;
  amountPaid: number;
  method: string;
  newTermEnd: string | null;
  error?: string;
};

const renewMethodSchema = z.enum(["bank", "card", "ewallet"]);

export const payMyRenewal = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        method: renewMethodSchema,
        correlationId: z.string().min(1).max(64).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<RenewalPaymentResult> => {
    try {
      return await fetchNestApiFromServer<RenewalPaymentResult>("/members/me/renewal-payment", context.token, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      return {
        success: false,
        reference: data.correlationId || "",
        amountPaid: 0,
        method: data.method,
        newTermEnd: null,
        error: err?.message || "Lỗi xử lý gia hạn",
      };
    }
  });

// ---------- Self-service audit log ----------
export type RenewalAuditEntry = {
  id: string;
  action: string;
  eventType: "payment" | "idempotent_noop" | "failure";
  status: "success" | "failure" | "idempotent_noop";
  reference: string;
  method: string | null;
  amountPaid: number;
  invoiceNo: string | null;
  previousTermEnd: string | null;
  newTermEnd: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  errorReason: string | null;
  correlationId: string | null;
  createdAt: string;
  metadata: Record<string, any>;
};

export const getMyRenewalAuditLog = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<RenewalAuditEntry[]> => {
    try {
      const res = await fetchNestApiFromServer<RenewalAuditEntry[]>("/members/me/renewal-audit", context.token);
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  });
