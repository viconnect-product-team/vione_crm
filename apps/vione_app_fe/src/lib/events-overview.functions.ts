import { createServerFn } from "@tanstack/react-start";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "@/lib/api-client";

export type EventOverviewRow = {
  id: string;
  name: string;
  date: string;
  location: string;
  status: string;
  capacity: number;
  registrations: number;
  confirmed: number;
  cancelled: number;
  attended: number;
};

export const getEventsOverviewFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<EventOverviewRow[]> => {
    const { token } = context as any;
    try {
      return await fetchNestApiFromServer("/events/overview", token);
    } catch (err) {
      console.error("getEventsOverviewFn failed:", err);
      return [];
    }
  });
