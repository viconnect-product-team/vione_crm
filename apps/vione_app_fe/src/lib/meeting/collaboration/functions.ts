// BC-7.10 Turn A — Authenticated server-function adapters for agenda domain.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { MeetingAgendaService } from "./service.server";
import { MEETING_AGENDA_STATUSES } from "./types";

type Ctx = { supabase: unknown; userId: string };

const uuid = z.string().uuid();
const status = z.enum(MEETING_AGENDA_STATUSES);

const listSchema = z.object({ meetingId: uuid });

const createSchema = z.object({
  meetingId: uuid,
  title: z.string().min(1).max(240),
  description: z.string().max(2000).nullish(),
  parentId: uuid.nullish(),
  estimatedMinutes: z
    .number()
    .int()
    .min(0)
    .max(24 * 60)
    .nullish(),
  ownerUserId: uuid.nullish(),
  linkedFollowUpId: uuid.nullish(),
});

const updateSchema = z.object({
  itemId: uuid,
  expectedVersion: z.number().int().min(1),
  title: z.string().min(1).max(240).optional(),
  description: z.string().max(2000).nullish(),
  clearDescription: z.boolean().nullish(),
  estimatedMinutes: z
    .number()
    .int()
    .min(0)
    .max(24 * 60)
    .nullish(),
  clearEstimatedMinutes: z.boolean().nullish(),
  ownerUserId: uuid.nullish(),
  clearOwner: z.boolean().nullish(),
  linkedFollowUpId: uuid.nullish(),
  clearLinkedFollowUp: z.boolean().nullish(),
});

const setStatusSchema = z.object({
  itemId: uuid,
  expectedVersion: z.number().int().min(1),
  nextStatus: status,
});

const reorderSchema = z.object({
  meetingId: uuid,
  parentId: uuid.nullish(),
  orderedIds: z.array(uuid).min(1),
  expectedVersions: z.array(z.number().int().min(1)).min(1),
});

const deleteSchema = z.object({
  itemId: uuid,
  expectedVersion: z.number().int().min(1),
});

export const listMeetingAgendaFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => listSchema.parse(d))
  .handler(async ({ context, data }) => {
    const c = context as unknown as Ctx;
    return MeetingAgendaService.listAgenda(c.supabase as any, c.userId, data.meetingId);
  });

export const createAgendaItemFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ context, data }) => {
    const c = context as unknown as Ctx;
    return MeetingAgendaService.createItem(c.supabase as any, c.userId, {
      meetingId: data.meetingId,
      title: data.title,
      description: data.description ?? null,
      parentId: data.parentId ?? null,
      estimatedMinutes: data.estimatedMinutes ?? null,
      ownerUserId: data.ownerUserId ?? null,
      linkedFollowUpId: data.linkedFollowUpId ?? null,
    });
  });

export const updateAgendaItemFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ context, data }) => {
    const c = context as unknown as Ctx;
    return MeetingAgendaService.updateItem(c.supabase as any, c.userId, {
      itemId: data.itemId,
      expectedVersion: data.expectedVersion,
      title: data.title,
      description: data.description ?? undefined,
      clearDescription: data.clearDescription ?? false,
      estimatedMinutes: data.estimatedMinutes ?? undefined,
      clearEstimatedMinutes: data.clearEstimatedMinutes ?? false,
      ownerUserId: data.ownerUserId ?? undefined,
      clearOwner: data.clearOwner ?? false,
      linkedFollowUpId: data.linkedFollowUpId ?? undefined,
      clearLinkedFollowUp: data.clearLinkedFollowUp ?? false,
    });
  });

export const setAgendaItemStatusFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => setStatusSchema.parse(d))
  .handler(async ({ context, data }) => {
    const c = context as unknown as Ctx;
    return MeetingAgendaService.setItemStatus(c.supabase as any, c.userId, data);
  });

export const reorderAgendaFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => reorderSchema.parse(d))
  .handler(async ({ context, data }) => {
    const c = context as unknown as Ctx;
    return MeetingAgendaService.reorderAgenda(c.supabase as any, c.userId, {
      meetingId: data.meetingId,
      parentId: data.parentId ?? null,
      orderedIds: data.orderedIds,
      expectedVersions: data.expectedVersions,
    });
  });

export const deleteAgendaItemFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => deleteSchema.parse(d))
  .handler(async ({ context, data }) => {
    const c = context as unknown as Ctx;
    return MeetingAgendaService.deleteItem(c.supabase as any, c.userId, data);
  });
