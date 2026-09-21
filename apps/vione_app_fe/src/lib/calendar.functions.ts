// BC-7.7 Turn B1 — Calendar authenticated server-function adapters.
// Every function runs under requireNestAuth. All queries go through NestJS API.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "@/lib/api-client";
import type {
  AvailabilityPreferencesDTO,
  AvailabilitySlotDTO,
  CalendarProjectionDTO,
  MeetingTimeProposalDTO,
  MeetingTimeProposalResponseDTO,
} from "@/lib/meeting/calendar/types";
import { validateUpdatePreferences } from "@/lib/meeting/calendar/preferences.service";

const iso = z.string().min(1).max(40);
const uuid = z.string().uuid();
const tz = z.string().min(1).max(64);

// ── Preferences ─────────────────────────────────────────────────────────────

export const getMyAvailabilityPreferencesFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<AvailabilityPreferencesDTO | null> => {
    try {
      return await fetchNestApiFromServer<AvailabilityPreferencesDTO | null>(
        "/meetings/availability/preferences",
        context.token,
      );
    } catch {
      return null;
    }
  });

const updatePrefsInput = z.object({
  timezone: tz,
  workingDays: z.array(z.number().int().min(1).max(7)).min(1),
  workingHours: z
    .array(
      z.object({
        day: z.number().int().min(1).max(7),
        start: z.string().regex(/^\d{2}:\d{2}$/),
        end: z.string().regex(/^\d{2}:\d{2}$/),
      }),
    )
    .min(1),
  minimumNoticeMinutes: z.number().int().min(0).max(10080),
  defaultMeetingDurationMinutes: z.number().int().min(15).max(480),
  bufferBeforeMinutes: z.number().int().min(0).max(240),
  bufferAfterMinutes: z.number().int().min(0).max(240),
  expectedVersion: z.number().int().min(1).nullish(),
});

export const updateAvailabilityPreferencesFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => updatePrefsInput.parse(d))
  .handler(async ({ data, context }): Promise<AvailabilityPreferencesDTO> => {
    validateUpdatePreferences(data as any);
    return await fetchNestApiFromServer<AvailabilityPreferencesDTO>(
      "/meetings/availability/preferences",
      context.token,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  });

// ── Availability ────────────────────────────────────────────────────────────

const findAvailabilityInput = z.object({
  meetingId: uuid.optional(),
  participantUserIds: z.array(uuid).min(1).max(10),
  fromDate: iso,
  toDate: iso,
  durationMinutes: z.number().int().min(15).max(480),
  organizerTimezone: tz,
});

export const findCommonAvailabilityFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => findAvailabilityInput.parse(d))
  .handler(async ({ data, context }): Promise<AvailabilitySlotDTO[]> => {
    try {
      const res = await fetchNestApiFromServer<AvailabilitySlotDTO[]>(
        "/meetings/availability/find-common",
        context.token,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  });

// ── Proposals ───────────────────────────────────────────────────────────────

const createProposalsInput = z.object({
  meetingId: uuid,
  proposals: z
    .array(z.object({ startAt: iso, endAt: iso, timezone: tz }))
    .min(1)
    .max(5),
  clientRequestId: z.string().min(8).max(80).optional(),
});

export const createTimeProposalsFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => createProposalsInput.parse(d))
  .handler(async ({ data, context }): Promise<MeetingTimeProposalDTO[]> => {
    return await fetchNestApiFromServer<MeetingTimeProposalDTO[]>(
      "/meetings/time-proposals",
      context.token,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  });

// ── List proposals / projections (UI read helpers) ─────────────────────────

const listProposalsInput = z.object({ meetingId: uuid });

export const listMeetingTimeProposalsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => listProposalsInput.parse(d))
  .handler(async ({ data, context }): Promise<MeetingTimeProposalDTO[]> => {
    try {
      const res = await fetchNestApiFromServer<MeetingTimeProposalDTO[]>(
        `/meetings/${data.meetingId}/time-proposals`,
        context.token,
      );
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  });

export const listMeetingProjectionsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => listProposalsInput.parse(d))
  .handler(async ({ data, context }): Promise<CalendarProjectionDTO[]> => {
    try {
      const res = await fetchNestApiFromServer<CalendarProjectionDTO[]>(
        `/meetings/${data.meetingId}/projections`,
        context.token,
      );
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  });

const respondInput = z.object({
  proposalId: uuid,
  response: z.enum(["available", "unavailable", "tentative"]),
});

export const respondToTimeProposalFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => respondInput.parse(d))
  .handler(async ({ data, context }): Promise<MeetingTimeProposalResponseDTO> => {
    return await fetchNestApiFromServer<MeetingTimeProposalResponseDTO>(
      `/meetings/time-proposals/${data.proposalId}/respond`,
      context.token,
      {
        method: "POST",
        body: JSON.stringify({ response: data.response }),
      },
    );
  });

const selectInput = z.object({
  proposalId: uuid,
  expectedMeetingVersion: z.number().int().min(0).nullish(),
});

export const selectTimeProposalFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => selectInput.parse(d))
  .handler(async ({ data, context }): Promise<MeetingTimeProposalDTO> => {
    return await fetchNestApiFromServer<MeetingTimeProposalDTO>(
      `/meetings/time-proposals/${data.proposalId}/select`,
      context.token,
      {
        method: "POST",
      },
    );
  });

