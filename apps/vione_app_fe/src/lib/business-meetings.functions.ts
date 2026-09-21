// BC-4.1B — Business Meetings authenticated server-function adapters.
// The client → server boundary for Business Meetings. Every function:
//   • runs under requireSupabaseAuth (RLS as the caller; userId = context.userId)
//   • validates input with Zod (never trusts client identity/target)
//   • builds the server-only deps (target resolution + counterpart projection)
//     via `await import()` so no *.server module enters the client graph
//   • delegates to the BusinessMeetingSDK / BusinessMeetingService
//   • surfaces stable typed domain errors (raw SQL/RLS never leaks)
//
// This is the Business Connect meeting surface — fully isolated from the legacy
// association `meetings.functions.ts`.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { createBusinessMeetingSDK } from "./business-meetings/sdk";
import type { MeetingServiceDeps } from "./business-meetings/service";
import { BUSINESS_MEETING_TYPES, BUSINESS_MEETING_LOCATION_TYPES } from "./business-meetings/types";
import type {
  BusinessMeetingMutationResult,
  MeetingCountsDTO,
  MeetingDetailDTO,
  MeetingListItemDTO,
} from "./business-meetings/types";

type Ctx = { supabase?: unknown; userId: string };

/** Build the server-only resolvers, then bind an SDK to the caller. */
async function sdkFor(context: Ctx) {
  const { resolveMeetingTargetByCardSlug, projectCounterpartSummaries } =
    await import("./business-meetings/target.server");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const deps: MeetingServiceDeps = {
    resolveTarget: resolveMeetingTargetByCardSlug,
    projectCounterparts: projectCounterpartSummaries,
  };

  const db = (context.supabase as any) || supabaseAdmin;
  return createBusinessMeetingSDK(db, context.userId, deps);
}

const mutationKey = z.string().min(8).max(200).optional();
const uuid = z.string().uuid();
const iso = z.string().min(1).max(40);
const version = z.number().int().min(1);

// ── Mutations ────────────────────────────────────────────────────────────────

const createDraftInput = z.object({
  targetCardSlug: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  description: z.string().max(2000).nullish(),
  meetingType: z.enum(BUSINESS_MEETING_TYPES),
  timezone: z.string().min(1).max(64),
  source: z.object({ type: z.string().max(40), id: z.string().max(128).nullish() }).nullish(),
  mutationKey,
});

export const createMeetingDraftFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => createDraftInput.parse(d))
  .handler(async ({ data, context }): Promise<BusinessMeetingMutationResult> => {
    const sdk = await sdkFor(context as unknown as Ctx);

    return sdk.createDraft(data as any);
  });

const proposeInput = z.object({
  meetingId: uuid,
  startAt: iso,
  endAt: iso,
  timezone: z.string().min(1).max(64),
  locationType: z.enum(BUSINESS_MEETING_LOCATION_TYPES),
  locationText: z.string().max(2000).nullish(),
  meetingUrl: z.string().max(1000).nullish(),
  proposalMessage: z.string().max(2000).nullish(),
  mutationKey,
});

export const proposeMeetingTimeFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => proposeInput.parse(d))
  .handler(async ({ data, context }): Promise<BusinessMeetingMutationResult> => {
    const sdk = await sdkFor(context as unknown as Ctx);
    return sdk.propose(data);
  });

const proposeNewTimeInput = z.object({
  meetingId: uuid,
  baseVersion: version,
  startAt: iso,
  endAt: iso,
  timezone: z.string().min(1).max(64),
  locationType: z.enum(BUSINESS_MEETING_LOCATION_TYPES),
  locationText: z.string().max(2000).nullish(),
  meetingUrl: z.string().max(1000).nullish(),
  proposalMessage: z.string().max(2000).nullish(),
  mutationKey,
});

export const rescheduleMeetingFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => proposeNewTimeInput.parse(d))
  .handler(async ({ data, context }): Promise<BusinessMeetingMutationResult> => {
    const sdk = await sdkFor(context as unknown as Ctx);
    const { meetingId, baseVersion, ...rest } = data;
    return sdk.proposeNewTime(meetingId, baseVersion, rest);
  });

const acceptInput = z.object({ meetingId: uuid, proposalVersion: version, mutationKey });

export const acceptMeetingFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => acceptInput.parse(d))
  .handler(async ({ data, context }): Promise<BusinessMeetingMutationResult> => {
    const sdk = await sdkFor(context as unknown as Ctx);
    const res = await sdk.accept(data.meetingId, data.proposalVersion, { mutationKey: data.mutationKey });
    try {
      const { logActivity } = await import("./crud.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const db = ((context as any).supabase as any) || supabaseAdmin;
      await logActivity(db, {
        action: "Chấp nhận cuộc họp",
        target: data.meetingId,
        category: "meeting",
        user: (context as any).user?.email || "admin@connect.vn",
      });
    } catch {}
    return res;
  });

const declineInput = z.object({
  meetingId: uuid,
  proposalVersion: version,
  reason: z.string().max(500).nullish(),
  mutationKey,
});

export const declineMeetingFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => declineInput.parse(d))
  .handler(async ({ data, context }): Promise<BusinessMeetingMutationResult> => {
    const sdk = await sdkFor(context as unknown as Ctx);
    const res = await sdk.decline(data.meetingId, data.proposalVersion, {
      reason: data.reason,
      mutationKey: data.mutationKey,
    });
    try {
      const { logActivity } = await import("./crud.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const db = ((context as any).supabase as any) || supabaseAdmin;
      await logActivity(db, {
        action: "Từ chối cuộc họp",
        target: data.meetingId,
        category: "meeting",
        user: (context as any).user?.email || "admin@connect.vn",
      });
    } catch {}
    return res;
  });

const tentativeInput = z.object({ meetingId: uuid, proposalVersion: version, mutationKey });

export const tentativelyAcceptMeetingFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => tentativeInput.parse(d))
  .handler(async ({ data, context }): Promise<BusinessMeetingMutationResult> => {
    const sdk = await sdkFor(context as unknown as Ctx);
    return sdk.tentativelyAccept(data.meetingId, data.proposalVersion, {
      mutationKey: data.mutationKey,
    });
  });

const cancelInput = z.object({
  meetingId: uuid,
  reason: z.string().max(500).nullish(),
  expectedVersion: version.optional(),
  mutationKey,
});

export const cancelMeetingFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => cancelInput.parse(d))
  .handler(async ({ data, context }): Promise<BusinessMeetingMutationResult> => {
    const sdk = await sdkFor(context as unknown as Ctx);
    const res = await sdk.cancel(data.meetingId, {
      reason: data.reason,
      expectedVersion: data.expectedVersion,
      mutationKey: data.mutationKey,
    });
    try {
      const { logActivity } = await import("./crud.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const db = ((context as any).supabase as any) || supabaseAdmin;
      await logActivity(db, {
        action: "Hủy cuộc họp",
        target: data.meetingId,
        category: "meeting",
        user: (context as any).user?.email || "admin@connect.vn",
      });
    } catch {}
    return res;
  });

const finalizeInput = z.object({
  meetingId: uuid,
  expectedVersion: version.optional(),
  mutationKey,
});

export const completeMeetingFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => finalizeInput.parse(d))
  .handler(async ({ data, context }): Promise<BusinessMeetingMutationResult> => {
    const sdk = await sdkFor(context as unknown as Ctx);
    return sdk.complete(data.meetingId, {
      expectedVersion: data.expectedVersion,
      mutationKey: data.mutationKey,
    });
  });

export const markMeetingNoShowFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => finalizeInput.parse(d))
  .handler(async ({ data, context }): Promise<BusinessMeetingMutationResult> => {
    const sdk = await sdkFor(context as unknown as Ctx);
    return sdk.markNoShow(data.meetingId, {
      expectedVersion: data.expectedVersion,
      mutationKey: data.mutationKey,
    });
  });

// ── Reads ────────────────────────────────────────────────────────────────────

const listInput = z
  .object({
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional(),
  })
  .optional();

export const getMeetingDetailFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ meetingId: uuid }).parse(d))
  .handler(async ({ data, context }): Promise<MeetingDetailDTO> => {
    const sdk = await sdkFor(context as unknown as Ctx);
    return sdk.getDetail(data.meetingId);
  });

export const listUpcomingMeetingsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => listInput.parse(d))
  .handler(async ({ data, context }): Promise<MeetingListItemDTO[]> => {
    const sdk = await sdkFor(context as unknown as Ctx);
    return sdk.listUpcoming(data ?? undefined);
  });

export const listPendingMeetingsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => listInput.parse(d))
  .handler(async ({ data, context }): Promise<MeetingListItemDTO[]> => {
    const sdk = await sdkFor(context as unknown as Ctx);
    return sdk.listPending(data ?? undefined);
  });

export const listPastMeetingsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => listInput.parse(d))
  .handler(async ({ data, context }): Promise<MeetingListItemDTO[]> => {
    const sdk = await sdkFor(context as unknown as Ctx);
    return sdk.listPast(data ?? undefined);
  });

export const countMeetingsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<MeetingCountsDTO> => {
    const sdk = await sdkFor(context as unknown as Ctx);
    return sdk.counts();
  });

export const listCancelledMeetingsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => listInput.parse(d))
  .handler(async ({ data, context }): Promise<MeetingListItemDTO[]> => {
    const sdk = await sdkFor(context as unknown as Ctx);
    return sdk.listCancelled(data ?? undefined);
  });

export const getMeetingProposalHistoryFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ meetingId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const sdk = await sdkFor(context as unknown as Ctx);
    return sdk.getProposalHistory(data.meetingId);
  });
