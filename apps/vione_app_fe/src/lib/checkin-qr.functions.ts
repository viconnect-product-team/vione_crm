import { createServerFn } from "@tanstack/react-start";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "@/lib/api-client";

export type CheckinQrEvent = {
  id: string;
  name: string;
  date: string;
  location: string;
  status: string;
  registered: number;
  capacity: number;
  checkedIn: number;
};

export const getCheckinQrEventsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<CheckinQrEvent[]> => {
    const { token } = context as any;
    try {
      return await fetchNestApiFromServer("/checkin/qr-events", token);
    } catch (err) {
      console.error("getCheckinQrEventsFn failed:", err);
      return [];
    }
  });
