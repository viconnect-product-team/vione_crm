import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "@/lib/api-client";
import { MEETING_OUTCOME_TYPES } from "./types";

const uuid = z.string().uuid();
const outcomeType = z.enum(MEETING_OUTCOME_TYPES);

const createSchema = z.object({
  meetingId: uuid,
  outcomeType,
  summary: z.string().max(4000).nullish(),
  clientRequestId: z.string().min(1).max(200).nullish(),
});

const updateSchema = z.object({
  meetingId: uuid,
  expectedVersion: z.number().int().min(1),
  outcomeType: outcomeType.nullish(),
  summary: z.string().max(4000).nullish(),
  clearSummary: z.boolean().nullish(),
});

const finalizeSchema = z.object({
  meetingId: uuid,
  expectedVersion: z.number().int().min(1),
});

export const getMeetingOutcomeFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ meetingId: uuid }).parse(d))
  .handler(async ({ context, data }) => {
    const { token } = context as any;
    return fetchNestApiFromServer(`/meetings/${data.meetingId}/outcome`, token);
  });

export const createMeetingOutcomeFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { token } = context as any;
    return fetchNestApiFromServer(`/meetings/${data.meetingId}/outcome`, token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

export const updateMeetingOutcomeFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { token } = context as any;
    return fetchNestApiFromServer(`/meetings/${data.meetingId}/outcome`, token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

export const finalizeMeetingOutcomeFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => finalizeSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { token } = context as any;
    return fetchNestApiFromServer(`/meetings/${data.meetingId}/outcome`, token, {
      method: "POST",
      body: JSON.stringify({ ...data, outcomeStatus: "finalized" }),
    });
  });

