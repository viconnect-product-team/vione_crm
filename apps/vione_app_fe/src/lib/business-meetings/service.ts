// BC-4.1B — BusinessMeetingService.
// The authoritative APPLICATION service for Business Meetings.
// Responsibilities:
//   • require an active platform meeting user (no member row needed)
//   • validate + normalize input server-side (never trust client identity)
//   • delegate every lifecycle MUTATION to the authoritative BC-4.1A
//     business_meeting_* SECURITY DEFINER RPCs (state machine lives in the DB)
//   • delegate every ordinary READ to MeetingRepository
//   • compose participant-safe DTOs (detail / list / counts) with viewer
//     capabilities + privacy-safe counterpart summaries
//   • map raw DB/RLS errors to stable typed domain errors + emit safe telemetry
//
// It NEVER queries business_meeting_* tables directly and NEVER duplicates the
// state machine. Statically imports NO *.server module → safe from
// *.functions.ts. Target resolution + counterpart projection (which need the
// service-role client) are injected by the server-function handler.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { BusinessMeetingError, toBusinessMeetingError } from "./errors";
import { requireGlobalMeetingUser } from "./identity";
import { requireMeetingProposalEligibility } from "./eligibility";
import { MeetingRepository } from "./repository";
import { deriveMeetingViewerCapabilities } from "./capabilities";
import { withMeetingTelemetry } from "./telemetry";
import type {
  BusinessMeetingMutationResult,
  BusinessMeetingStatus,
  CreateDraftInput,
  MeetingCountsDTO,
  MeetingCounterpartSummary,
  MeetingDetailDTO,
  MeetingListItemDTO,
  MeetingListOptions,
  MeetingReasonInput,
  MeetingMutationOptions,
  ProposeInput,
  ProposeNewTimeInput,
} from "./types";

type DB = SupabaseClient<Database>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TEXT_MAX = 2000;

/** Resolvers injected by the (server-only) handler; keeps the service client-safe. */
export type MeetingServiceDeps = {
  /** slug → authoritative target owner (service-role read). */
  resolveTarget: (slug: string) => Promise<{ ownerUserId: string; cardId: string }>;
  /** privacy-safe counterpart summaries for a set of user ids. */
  projectCounterparts: (
    userIds: readonly string[],
  ) => Promise<Map<string, MeetingCounterpartSummary>>;
};

function assertMeetingId(v: unknown): string {
  if (typeof v !== "string" || !UUID.test(v)) {
    throw new BusinessMeetingError("MEETING_NOT_FOUND");
  }
  return v;
}

function cleanText(v: string | null | undefined, max = TEXT_MAX): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim().slice(0, max);
  return t.length ? t : undefined;
}

function assertIso(
  v: unknown,
  code: BusinessMeetingError["code"] = "MEETING_TIME_INVALID",
): string {
  if (typeof v !== "string" || Number.isNaN(Date.parse(v))) {
    throw new BusinessMeetingError(code);
  }
  return v;
}

function assertTimeRange(startAt: string, endAt: string): void {
  if (Date.parse(endAt) <= Date.parse(startAt)) {
    throw new BusinessMeetingError("MEETING_TIME_INVALID");
  }
}

import { safeRandomUUID } from "@/lib/utils";

function resolveMutationKey(key: string | undefined): string {
  if (typeof key === "string" && key.trim().length >= 8 && key.length <= 200) {
    return key.trim();
  }
  return safeRandomUUID();
}

function parseMutationResult(json: unknown): BusinessMeetingMutationResult {
  const obj = (json ?? {}) as Record<string, unknown>;
  const meetingId = String(obj.meetingId ?? obj.meeting_id ?? "");
  const status = (obj.status as BusinessMeetingStatus) ?? "draft";
  const versionRaw = obj.version ?? obj.activeProposalVersion ?? obj.active_proposal_version;
  const version = typeof versionRaw === "number" ? versionRaw : undefined;
  return { meetingId, status, version };
}

export const BusinessMeetingService = {
  // ── Mutations (delegated to authoritative RPCs) ────────────────────────────

  /**
   * Create a DRAFT meeting toward the resolved owner of a Business Card slug.
   * Target is resolved server-side (never trusted). Policy B eligibility is
   * pre-checked here for a stable early error; the DB RPC re-enforces it.
   */
  async createDraft(
    supabase: DB,
    userId: string | null | undefined,
    deps: MeetingServiceDeps,
    input: CreateDraftInput,
  ): Promise<BusinessMeetingMutationResult> {
    const me = await requireGlobalMeetingUser(supabase, userId);
    const slug = typeof input?.targetCardSlug === "string" ? input.targetCardSlug.trim() : "";
    if (!slug) throw new BusinessMeetingError("MEETING_TARGET_NOT_FOUND");
    const title = cleanText(input?.title, 300);
    if (!title) throw new BusinessMeetingError("MEETING_UNKNOWN");
    const mutationKey = resolveMutationKey(input?.mutationKey);

    return withMeetingTelemetry("create_draft", mutationKey, async () => {
      const target = await deps.resolveTarget(slug);
      if (target.ownerUserId === me.userId) {
        throw new BusinessMeetingError("MEETING_PARTICIPANT_INVALID");
      }
      // Defense-in-depth: fail fast before touching the RPC.
      await requireMeetingProposalEligibility(supabase, me.userId, target.ownerUserId);
      const { data, error } = await supabase.rpc("business_meeting_create_draft", {
        _target_user_id: target.ownerUserId,
        _title: title,
        _description: cleanText(input?.description),
        _meeting_type: input.meetingType,
        _timezone: input?.timezone,
        _source_type: input?.source?.type,
        _source_id: input?.source?.id ?? target.cardId,
        _mutation_key: mutationKey,
      });
      if (error) throw toBusinessMeetingError(error);
      return parseMutationResult(data);
    });
  },

  /** Organizer proposes the first concrete time for a draft meeting. */
  async propose(
    supabase: DB,
    userId: string | null | undefined,
    input: ProposeInput,
  ): Promise<BusinessMeetingMutationResult> {
    await requireGlobalMeetingUser(supabase, userId);
    const meetingId = assertMeetingId(input?.meetingId);
    const startAt = assertIso(input?.startAt);
    const endAt = assertIso(input?.endAt);
    assertTimeRange(startAt, endAt);
    const mutationKey = resolveMutationKey(input?.mutationKey);
    return withMeetingTelemetry("propose", meetingId, async () => {
      const { data, error } = await supabase.rpc("business_meeting_propose", {
        _meeting_id: meetingId,
        _start_at: startAt,
        _end_at: endAt,
        _timezone: input.timezone,
        _location_type: input.locationType,
        _location_text: cleanText(input?.locationText),
        _meeting_url: cleanText(input?.meetingUrl, 1000),
        _proposal_message: cleanText(input?.proposalMessage),
        _mutation_key: mutationKey,
      });
      if (error) throw toBusinessMeetingError(error);
      return parseMutationResult(data);
    });
  },

  /** Reschedule: propose a NEW versioned time against a known base version. */
  async proposeNewTime(
    supabase: DB,
    userId: string | null | undefined,
    meetingId: string,
    baseVersion: number,
    input: ProposeNewTimeInput,
  ): Promise<BusinessMeetingMutationResult> {
    await requireGlobalMeetingUser(supabase, userId);
    const id = assertMeetingId(meetingId);
    if (!Number.isInteger(baseVersion) || baseVersion < 1) {
      throw new BusinessMeetingError("MEETING_STALE_VERSION");
    }
    const startAt = assertIso(input?.startAt);
    const endAt = assertIso(input?.endAt);
    assertTimeRange(startAt, endAt);
    const mutationKey = resolveMutationKey(input?.mutationKey);
    return withMeetingTelemetry("reschedule", id, async () => {
      const { data, error } = await supabase.rpc("business_meeting_propose_new_time", {
        _meeting_id: id,
        _base_version: baseVersion,
        _start_at: startAt,
        _end_at: endAt,
        _timezone: input.timezone,
        _location_type: input.locationType,
        _location_text: cleanText(input?.locationText),
        _meeting_url: cleanText(input?.meetingUrl, 1000),
        _proposal_message: cleanText(input?.proposalMessage),
        _mutation_key: mutationKey,
      });
      if (error) throw toBusinessMeetingError(error);
      return parseMutationResult(data);
    });
  },

  /** Invited participant accepts the active proposal (version-guarded). */
  async accept(
    supabase: DB,
    userId: string | null | undefined,
    meetingId: string,
    proposalVersion: number,
    options?: MeetingMutationOptions,
  ): Promise<BusinessMeetingMutationResult> {
    await requireGlobalMeetingUser(supabase, userId);
    const id = assertMeetingId(meetingId);
    if (!Number.isInteger(proposalVersion) || proposalVersion < 1) {
      throw new BusinessMeetingError("MEETING_STALE_VERSION");
    }
    const mutationKey = resolveMutationKey(options?.mutationKey);
    return withMeetingTelemetry("accept", id, async () => {
      const { data, error } = await supabase.rpc("business_meeting_accept", {
        _meeting_id: id,
        _proposal_version: proposalVersion,
        _mutation_key: mutationKey,
      });
      if (error) throw toBusinessMeetingError(error);
      return parseMutationResult(data);
    });
  },

  /** Invited participant declines the active proposal (version-guarded). */
  async decline(
    supabase: DB,
    userId: string | null | undefined,
    meetingId: string,
    proposalVersion: number,
    input?: MeetingReasonInput,
  ): Promise<BusinessMeetingMutationResult> {
    await requireGlobalMeetingUser(supabase, userId);
    const id = assertMeetingId(meetingId);
    if (!Number.isInteger(proposalVersion) || proposalVersion < 1) {
      throw new BusinessMeetingError("MEETING_STALE_VERSION");
    }
    const mutationKey = resolveMutationKey(input?.mutationKey);
    return withMeetingTelemetry("decline", id, async () => {
      const { data, error } = await supabase.rpc("business_meeting_decline", {
        _meeting_id: id,
        _proposal_version: proposalVersion,
        _reason: cleanText(input?.reason, 500),
        _mutation_key: mutationKey,
      });
      if (error) throw toBusinessMeetingError(error);
      return parseMutationResult(data);
    });
  },

  /**
   * BC-7.6 — Invited participant marks themselves tentative on the active
   * proposal. Participant-level operation only: meeting.status stays
   * `proposed`; the DB RPC updates the caller's response row and re-checks
   * the confirmation policy under lock (tentative never satisfies it).
   */
  async tentativelyAccept(
    supabase: DB,
    userId: string | null | undefined,
    meetingId: string,
    proposalVersion: number,
    options?: MeetingMutationOptions,
  ): Promise<BusinessMeetingMutationResult> {
    await requireGlobalMeetingUser(supabase, userId);
    const id = assertMeetingId(meetingId);
    if (!Number.isInteger(proposalVersion) || proposalVersion < 1) {
      throw new BusinessMeetingError("MEETING_STALE_VERSION");
    }
    const mutationKey = resolveMutationKey(options?.mutationKey);
    return withMeetingTelemetry("tentative", id, async () => {
      // Typed once the BC-7.6 migration lands (see MEETING_REQUEST_LIFECYCLE.md).
      const rpc = supabase.rpc as unknown as (
        name: string,
        params: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>;
      const { data, error } = await rpc("business_meeting_tentatively_accept", {
        _meeting_id: id,
        _proposal_version: proposalVersion,
        _mutation_key: mutationKey,
      });
      if (error) throw toBusinessMeetingError(error as never);
      return parseMutationResult(data);
    });
  },

  /** Organizer cancels a proposed/confirmed meeting. */
  async cancel(
    supabase: DB,
    userId: string | null | undefined,
    meetingId: string,
    input?: MeetingReasonInput & { expectedVersion?: number },
  ): Promise<BusinessMeetingMutationResult> {
    await requireGlobalMeetingUser(supabase, userId);
    const id = assertMeetingId(meetingId);
    const mutationKey = resolveMutationKey(input?.mutationKey);
    return withMeetingTelemetry("cancel", id, async () => {
      const { data, error } = await supabase.rpc("business_meeting_cancel", {
        _meeting_id: id,
        _reason: cleanText(input?.reason, 500),
        _expected_version:
          typeof input?.expectedVersion === "number" ? input.expectedVersion : undefined,
        _mutation_key: mutationKey,
      });
      if (error) throw toBusinessMeetingError(error);
      return parseMutationResult(data);
    });
  },

  /** Either participant marks a confirmed meeting completed. */
  async complete(
    supabase: DB,
    userId: string | null | undefined,
    meetingId: string,
    options?: MeetingMutationOptions & { expectedVersion?: number },
  ): Promise<BusinessMeetingMutationResult> {
    await requireGlobalMeetingUser(supabase, userId);
    const id = assertMeetingId(meetingId);
    const mutationKey = resolveMutationKey(options?.mutationKey);
    return withMeetingTelemetry("complete", id, async () => {
      const { data, error } = await supabase.rpc("business_meeting_complete", {
        _meeting_id: id,
        _expected_version:
          typeof options?.expectedVersion === "number" ? options.expectedVersion : undefined,
        _mutation_key: mutationKey,
      });
      if (error) throw toBusinessMeetingError(error);
      return parseMutationResult(data);
    });
  },

  /** Either participant marks a confirmed meeting as a no-show. */
  async markNoShow(
    supabase: DB,
    userId: string | null | undefined,
    meetingId: string,
    options?: MeetingMutationOptions & { expectedVersion?: number },
  ): Promise<BusinessMeetingMutationResult> {
    await requireGlobalMeetingUser(supabase, userId);
    const id = assertMeetingId(meetingId);
    const mutationKey = resolveMutationKey(options?.mutationKey);
    return withMeetingTelemetry("mark_no_show", id, async () => {
      const { data, error } = await supabase.rpc("business_meeting_mark_no_show", {
        _meeting_id: id,
        _expected_version:
          typeof options?.expectedVersion === "number" ? options.expectedVersion : undefined,
        _mutation_key: mutationKey,
      });
      if (error) throw toBusinessMeetingError(error);
      return parseMutationResult(data);
    });
  },

  // ── Reads (delegated to MeetingRepository, composed into safe DTOs) ─────────

  /** Full participant-authorized detail with capabilities + counterpart. */
  async getDetail(
    supabase: DB,
    userId: string | null | undefined,
    deps: Pick<MeetingServiceDeps, "projectCounterparts">,
    meetingId: string,
  ): Promise<MeetingDetailDTO> {
    const me = await requireGlobalMeetingUser(supabase, userId);
    const id = assertMeetingId(meetingId);
    return withMeetingTelemetry("get_detail", id, async () => {
      const meeting = await MeetingRepository.findById(supabase, me.userId, id);
      if (!meeting) throw new BusinessMeetingError("MEETING_NOT_FOUND");
      const [participants, activeProposal, viewerRole] = await Promise.all([
        MeetingRepository.getParticipants(supabase, id),
        MeetingRepository.getActiveProposal(supabase, id),
        MeetingRepository.getViewerRole(supabase, me.userId, id),
      ]);
      if (viewerRole === null) throw new BusinessMeetingError("MEETING_NOT_PARTICIPANT");
      const counterpartId = participants.find((p) => p.userId !== me.userId)?.userId ?? null;
      const counterpartMap = counterpartId
        ? await deps.projectCounterparts([counterpartId])
        : new Map<string, MeetingCounterpartSummary>();
      return {
        meeting,
        participants,
        activeProposal,
        viewerRole,
        counterpart: counterpartId ? (counterpartMap.get(counterpartId) ?? null) : null,
        capabilities: deriveMeetingViewerCapabilities({ status: meeting.status, viewerRole }),
      } satisfies MeetingDetailDTO;
    });
  },

  async listUpcoming(
    supabase: DB,
    userId: string | null | undefined,
    deps: Pick<MeetingServiceDeps, "projectCounterparts">,
    options?: MeetingListOptions,
  ): Promise<MeetingListItemDTO[]> {
    const me = await requireGlobalMeetingUser(supabase, userId);
    return composeMeetingList(supabase, me.userId, deps, "list", () =>
      MeetingRepository.listUpcoming(supabase, me.userId, options),
    );
  },

  async listPending(
    supabase: DB,
    userId: string | null | undefined,
    deps: Pick<MeetingServiceDeps, "projectCounterparts">,
    options?: MeetingListOptions,
  ): Promise<MeetingListItemDTO[]> {
    const me = await requireGlobalMeetingUser(supabase, userId);
    return composeMeetingList(supabase, me.userId, deps, "list", () =>
      MeetingRepository.listPending(supabase, me.userId, options),
    );
  },

  async listPast(
    supabase: DB,
    userId: string | null | undefined,
    deps: Pick<MeetingServiceDeps, "projectCounterparts">,
    options?: MeetingListOptions,
  ): Promise<MeetingListItemDTO[]> {
    const me = await requireGlobalMeetingUser(supabase, userId);
    return composeMeetingList(supabase, me.userId, deps, "list", () =>
      MeetingRepository.listPast(supabase, me.userId, options),
    );
  },

  async listCancelled(
    supabase: DB,
    userId: string | null | undefined,
    deps: Pick<MeetingServiceDeps, "projectCounterparts">,
    options?: MeetingListOptions,
  ): Promise<MeetingListItemDTO[]> {
    const me = await requireGlobalMeetingUser(supabase, userId);
    return composeMeetingList(supabase, me.userId, deps, "list", () =>
      MeetingRepository.listCancelled(supabase, me.userId, options),
    );
  },

  /** Immutable proposal history (ordered by version) + public proposer summaries. */
  async getProposalHistory(
    supabase: DB,
    userId: string | null | undefined,
    deps: Pick<MeetingServiceDeps, "projectCounterparts">,
    meetingId: string,
  ): Promise<import("./types").ProposalHistoryDTO> {
    const me = await requireGlobalMeetingUser(supabase, userId);
    const id = assertMeetingId(meetingId);
    return withMeetingTelemetry("get_detail", id, async () => {
      const viewerRole = await MeetingRepository.getViewerRole(supabase, me.userId, id);
      if (viewerRole === null) throw new BusinessMeetingError("MEETING_NOT_PARTICIPANT");
      const meeting = await MeetingRepository.findById(supabase, me.userId, id);
      if (!meeting) throw new BusinessMeetingError("MEETING_NOT_FOUND");
      const proposals = await MeetingRepository.getProposalHistory(supabase, id);
      const proposerIds = Array.from(
        new Set(proposals.map((p) => p.proposedByUserId).filter(Boolean)),
      );
      const map = proposerIds.length
        ? await deps.projectCounterparts(proposerIds)
        : new Map<string, MeetingCounterpartSummary>();
      const proposers: Record<string, MeetingCounterpartSummary> = {};
      for (const [uid, summary] of map) proposers[uid] = summary;
      return { activeVersion: meeting.activeProposalVersion, proposals, proposers };
    });
  },

  async counts(supabase: DB, userId: string | null | undefined): Promise<MeetingCountsDTO> {
    const me = await requireGlobalMeetingUser(supabase, userId);
    return withMeetingTelemetry("count", null, () =>
      MeetingRepository.countByStatus(supabase, me.userId),
    );
  },
};

// ── internal ────────────────────────────────────────────────────────────────

async function composeMeetingList(
  supabase: DB,
  userId: string,
  deps: Pick<MeetingServiceDeps, "projectCounterparts">,
  op: "list",
  fetch: () => Promise<import("./types").BusinessMeetingDTO[]>,
): Promise<MeetingListItemDTO[]> {
  return withMeetingTelemetry(
    op,
    null,
    async () => {
      const meetings = await fetch();
      if (meetings.length === 0) return [];
      const roleAndProposal = await Promise.all(
        meetings.map(async (m) => {
          const [viewerRole, participants, activeProposal] = await Promise.all([
            MeetingRepository.getViewerRole(supabase, userId, m.id),
            MeetingRepository.getParticipants(supabase, m.id),
            MeetingRepository.getActiveProposal(supabase, m.id),
          ]);
          const counterpartId = participants.find((p) => p.userId !== userId)?.userId ?? null;
          const viewerResponseStatus =
            participants.find((p) => p.userId === userId)?.responseStatus ?? null;
          return { m, viewerRole, activeProposal, counterpartId, viewerResponseStatus };
        }),
      );
      const counterpartIds = roleAndProposal
        .map((r: any) => r.counterpartId)
        .filter((v): v is string => Boolean(v));
      const counterparts = await deps.projectCounterparts(counterpartIds);
      return roleAndProposal.map(
        ({ m, viewerRole, activeProposal, counterpartId, viewerResponseStatus }) => ({
          id: m.id,
          title: m.title,
          status: m.status,
          meetingType: m.meetingType,
          timezone: m.timezone,
          startAt: activeProposal?.startAt ?? null,
          endAt: activeProposal?.endAt ?? null,
          locationType: activeProposal?.locationType ?? null,
          activeProposalVersion: m.activeProposalVersion,
          viewerRole,
          viewerResponseStatus,
          counterpart: counterpartId ? (counterparts.get(counterpartId) ?? null) : null,
          capabilities: deriveMeetingViewerCapabilities({ status: m.status, viewerRole }),
        }),
      );
    },
    (items) => ({ itemCount: items.length }),
  );
}
