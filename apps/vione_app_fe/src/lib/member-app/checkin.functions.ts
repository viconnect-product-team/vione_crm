import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "@/lib/api-client";

export type CheckinStatus = "success" | "already" | "invalid";

/** Stable, safe error codes surfaced to the client. */
export type CheckinErrorCode =
  | "invalid_payload"
  | "member_not_found"
  | "membership_inactive"
  | "event_not_found"
  | "association_mismatch"
  | "backend_unavailable";

export class CheckinError extends Error {
  code: CheckinErrorCode;
  constructor(code: CheckinErrorCode) {
    super(code);
    this.code = code;
    this.name = "CheckinError";
  }
}

export type MyCheckinRecord = {
  id: string;
  eventId: string | null;
  eventTitle: string;
  status: CheckinStatus;
  method: "qr" | "nfc";
  at: string; // ISO
};

export const getMyCheckinState = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<MyCheckinRecord[]> => {
    try {
      const records = await fetchNestApiFromServer<MyCheckinRecord[]>("/checkin/my-checkins", context.token);
      return records || [];
    } catch {
      return [];
    }
  });

const checkinInput = z
  .object({
    payload: z.string().trim().min(1).max(2000),
    method: z.enum(["qr", "nfc"]),
  })
  .strict();

export const checkInMyself = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((raw: unknown) => {
    const parsed = checkinInput.safeParse(raw);
    if (!parsed.success) throw new CheckinError("invalid_payload");
    return parsed.data;
  })
  .handler(async ({ data, context }): Promise<MyCheckinRecord> => {
    try {
      return await fetchNestApiFromServer<MyCheckinRecord>("/checkin/record", context.token, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("member_not_found")) throw new CheckinError("member_not_found");
      if (msg.includes("membership_inactive")) throw new CheckinError("membership_inactive");
      if (msg.includes("event_not_found")) throw new CheckinError("event_not_found");
      if (msg.includes("association_mismatch")) throw new CheckinError("association_mismatch");
      if (msg.includes("invalid_payload")) throw new CheckinError("invalid_payload");
      throw new CheckinError("backend_unavailable");
    }
  });
