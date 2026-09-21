// BC-7.9 Turn B — Authenticated server-function adapters for follow-up.
// Every function runs under requireSupabaseAuth (RLS as caller). No admin
// client, no client-supplied identity.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "@/lib/api-client";
import {
  MEETING_FOLLOW_UP_PRIORITIES,
  MEETING_FOLLOW_UP_TITLE_MAX,
  MEETING_FOLLOW_UP_DESCRIPTION_MAX,
} from "./types";

const uuid = z.string().uuid();
const priority = z.enum(MEETING_FOLLOW_UP_PRIORITIES);
const isoDate = z.string().refine((v) => Number.isFinite(Date.parse(v)), "invalid date");

const createSchema = z.object({
  meetingId: uuid,
  title: z.string().min(1).max(MEETING_FOLLOW_UP_TITLE_MAX),
  ownerUserId: uuid,
  description: z.string().max(MEETING_FOLLOW_UP_DESCRIPTION_MAX).nullish(),
  priority: priority.nullish(),
  dueAt: isoDate.nullish(),
  outcomeId: uuid.nullish(),
  clientRequestId: z.string().min(1).max(200).nullish(),
});

const updateSchema = z.object({
  followUpId: uuid,
  expectedVersion: z.number().int().min(1),
  title: z.string().min(1).max(MEETING_FOLLOW_UP_TITLE_MAX).optional(),
  description: z.string().max(MEETING_FOLLOW_UP_DESCRIPTION_MAX).nullish(),
  clearDescription: z.boolean().nullish(),
  priority: priority.optional(),
  dueAt: isoDate.nullish(),
  clearDueAt: z.boolean().nullish(),
  ownerUserId: uuid.optional(),
});

const setStatusSchema = z.object({
  followUpId: uuid,
  expectedVersion: z.number().int().min(1),
  targetStatus: z.enum(["in_progress", "completed"]),
});

const cancelSchema = z.object({
  followUpId: uuid,
  expectedVersion: z.number().int().min(1),
});

export const listMeetingFollowUpsFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ meetingId: uuid }).parse(d))
  .handler(async ({ context, data }) => {
    const { token } = context as any;
    try {
      return await fetchNestApiFromServer(`/meetings/${data.meetingId}/follow-ups`, token);
    } catch (err) {
      console.error("listMeetingFollowUpsFn error:", err);
      return [];
    }
  });

export const createMeetingFollowUpFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { token } = context as any;
    return fetchNestApiFromServer(`/meetings/${data.meetingId}/follow-ups`, token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

export const updateMeetingFollowUpFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { token } = context as any;
    return fetchNestApiFromServer(`/meetings/follow-ups/${data.followUpId}/status`, token, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  });

export const setMeetingFollowUpStatusFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => setStatusSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { token } = context as any;
    return fetchNestApiFromServer(`/meetings/follow-ups/${data.followUpId}/status`, token, {
      method: "PATCH",
      body: JSON.stringify({ status: data.targetStatus }),
    });
  });

export const cancelMeetingFollowUpFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => cancelSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { token } = context as any;
    return fetchNestApiFromServer(`/meetings/follow-ups/${data.followUpId}/status`, token, {
      method: "PATCH",
      body: JSON.stringify({ status: "cancelled" }),
    });
  });
