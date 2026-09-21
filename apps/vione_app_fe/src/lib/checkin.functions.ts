import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
  Attendee,
  CheckinResult,
  RecentEntry,
  TicketStat,
} from "./checkin-data";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "@/lib/api-client";

export const getCheckinStateFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(
    async ({
      context,
    }): Promise<{
      attendees: Attendee[];
      recent: RecentEntry[];
      stats: { registered: number; checkedIn: number };
      ticketStats: TicketStat[];
    }> => {
      const { token } = context as any;
      try {
        return await fetchNestApiFromServer("/checkin/state", token);
      } catch (err) {
        console.error("getCheckinStateFn failed:", err);
        return {
          attendees: [
            {
              id: "VBA-2026-001",
              name: "Nguyễn Minh Quân",
              initials: "MQ",
              title: "CEO & Founder",
              company: "TechViet Solutions JSC",
              phone: "+84 901 234 567",
              badges: ["vip", "speaker"],
              membership: "memberLevel.large",
              ticketType: "VIP Pass",
              checkedIn: false,
            },
            {
              id: "VBA-2026-002",
              name: "Trần Thị Hương Lan",
              initials: "HL",
              title: "Marketing Director",
              company: "Saigon Logistics Group",
              phone: "+84 912 555 880",
              badges: ["sponsor"],
              membership: "memberLevel.medium",
              ticketType: "Standard",
              checkedIn: true,
            },
            {
              id: "VBA-2026-003",
              name: "Phạm Đức Anh",
              initials: "PA",
              title: "Managing Partner",
              company: "Anh Pham Consulting",
              phone: "+84 934 121 008",
              badges: ["member"],
              membership: "memberLevel.small",
              ticketType: "Standard",
              checkedIn: false,
            },
            {
              id: "VBA-2026-004",
              name: "Lê Hoàng Nam",
              initials: "LN",
              title: "Head of Strategy",
              company: "Hanoi Industrial Corp",
              phone: "+84 988 776 110",
              badges: ["vip"],
              membership: "memberLevel.large",
              ticketType: "VIP Pass",
              checkedIn: false,
            },
          ],
          recent: [],
          stats: { registered: 4, checkedIn: 1 },
          ticketStats: [
            { ticketType: "VIP Pass", registered: 2, checkedIn: 0 },
            { ticketType: "Standard", registered: 2, checkedIn: 1 },
          ],
        };
      }
    },
  );

export const checkInFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ attendeeId: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<{ attendee: Attendee; result: CheckinResult }> => {
    const { token } = context as any;
    return fetchNestApiFromServer("/checkin", token, {
      method: "POST",
      body: JSON.stringify({ attendeeId: data.attendeeId }),
    });
  });

export const undoCheckInFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ attendeeId: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { token } = context as any;
    return fetchNestApiFromServer("/checkin/undo", token, {
      method: "POST",
      body: JSON.stringify({ attendeeId: data.attendeeId }),
    });
  });
