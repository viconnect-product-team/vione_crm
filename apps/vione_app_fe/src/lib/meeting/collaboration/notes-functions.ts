// BC-7.10 Turn B — Authenticated server-function adapters for notes domains.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { MeetingPrivateNoteService, MeetingSharedNoteService } from "./notes-service.server";
import { MEETING_NOTE_CONTENT_MAX } from "./types";

type Ctx = { supabase: unknown; userId: string };

const uuid = z.string().uuid();

// ---------- Private ----------

const getPrivateSchema = z.object({ meetingId: uuid });
const upsertPrivateSchema = z.object({
  meetingId: uuid,
  content: z.string().max(MEETING_NOTE_CONTENT_MAX),
  expectedVersion: z.number().int().min(0).nullable(),
});

export const getMyPrivateNoteFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => getPrivateSchema.parse(d))
  .handler(async ({ context, data }) => {
    const c = context as unknown as Ctx;
    return MeetingPrivateNoteService.getMine(c.supabase as any, c.userId, data.meetingId);
  });

export const upsertPrivateNoteFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => upsertPrivateSchema.parse(d))
  .handler(async ({ context, data }) => {
    const c = context as unknown as Ctx;
    return MeetingPrivateNoteService.upsert(c.supabase as any, c.userId, data);
  });

// ---------- Shared ----------

const getSharedSchema = z.object({ meetingId: uuid });
const initSharedSchema = z.object({ meetingId: uuid });
const updateSharedSchema = z.object({
  meetingId: uuid,
  expectedVersion: z.number().int().min(1),
  content: z.string().max(MEETING_NOTE_CONTENT_MAX),
});
const publishSharedSchema = z.object({
  meetingId: uuid,
  expectedVersion: z.number().int().min(1),
});

export const getSharedNoteFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => getSharedSchema.parse(d))
  .handler(async ({ context, data }) => {
    const c = context as unknown as Ctx;
    return MeetingSharedNoteService.get(c.supabase as any, c.userId, data.meetingId);
  });

export const initSharedNoteFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => initSharedSchema.parse(d))
  .handler(async ({ context, data }) => {
    const c = context as unknown as Ctx;
    return MeetingSharedNoteService.getOrCreate(c.supabase as any, c.userId, data.meetingId);
  });

export const updateSharedNoteFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => updateSharedSchema.parse(d))
  .handler(async ({ context, data }) => {
    const c = context as unknown as Ctx;
    return MeetingSharedNoteService.updateDraft(c.supabase as any, c.userId, data);
  });

export const publishSharedNoteFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => publishSharedSchema.parse(d))
  .handler(async ({ context, data }) => {
    const c = context as unknown as Ctx;
    return MeetingSharedNoteService.publish(c.supabase as any, c.userId, data);
  });
