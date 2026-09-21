import { createServerFn } from "@tanstack/react-start";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "@/lib/api-client";

// ---------- History (transactions + activity) ----------
export type MyHistoryActivity = {
  id: string;
  type: "payment" | "event" | "email" | "call" | "meeting" | "note";
  title: string;
  detail: string | null;
  date: string;
};

export type MyHistoryPayment = {
  id: string;
  invoice: string;
  description: string;
  amount: number;
  status: "paid" | "pending" | "refunded";
  date: string;
};

export type MyHistoryEvent = {
  id: string;
  name: string;
  date: string;
  checkedIn: boolean;
};

export type MyHistory = {
  activities: MyHistoryActivity[];
  payments: MyHistoryPayment[];
  events: MyHistoryEvent[];
};

/** Returns the signed-in member's own recent transactions, events and activity. */
export const getMyHistory = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<MyHistory> => {
    try {
      const res = await fetchNestApiFromServer<MyHistory>("/members/me/history", context.token);
      return {
        activities: res?.activities || [],
        payments: res?.payments || [],
        events: res?.events || [],
      };
    } catch {
      return { activities: [], payments: [], events: [] };
    }
  });
