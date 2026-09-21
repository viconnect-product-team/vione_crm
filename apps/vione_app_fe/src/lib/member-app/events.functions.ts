import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";

export type MyEvent = {
  id: string;
  day: string;
  month: string;
  title: string;
  time: string;
  place: string;
  registered: boolean;
  date?: string;
  isToday?: boolean;
  communityName?: string | null;
  associationName?: string | null;
  associationId?: string | null;
  image?: string | null;
  banner?: string | null;
  ticketPrice?: number;
  fee?: number;
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

import { fetchNestApiFromServer } from "@/lib/api-client";

// ---------- Events ----------

export const listMyEvents = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<MyEvent[]> => {
    return fetchNestApiFromServer("/events/my-events", context.token);
  });

export const registerForEvent = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        eventId: z.string().min(1).max(64),
        fullName: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        company: z.string().optional(),
        position: z.string().optional(),
        ticketCount: z.number().int().min(1).max(100).optional(),
        ticketType: z.string().optional(),
        note: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean; message?: string; registrationId?: string }> => {
    return fetchNestApiFromServer(`/events/${encodeURIComponent(data.eventId)}/register`, context.token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

export const cancelEventRegistration = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ eventId: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    return fetchNestApiFromServer(`/events/${encodeURIComponent(data.eventId)}/cancel`, context.token, {
      method: "POST",
    });
  });
