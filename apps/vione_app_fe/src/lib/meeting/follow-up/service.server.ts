// BC-7.9 Turn B — Meeting Follow-up service. Validates input, calls RPCs,
// maps stable errors, and produces safe DTOs. No UI concerns.

import type { SupabaseClient } from "@supabase/supabase-js";
import { MeetingFollowUpError, mapMeetingFollowUpError } from "./errors";
import { isKnownFollowUpPriority } from "./registry";
import {
  MeetingFollowUpRepository,
  toFollowUpDTO,
  type FollowUpDtoCtx,
  type FollowUpRow,
} from "./repository.server";
import {
  MEETING_FOLLOW_UP_DESCRIPTION_MAX,
  MEETING_FOLLOW_UP_TITLE_MAX,
  type CancelMeetingFollowUpInput,
  type CreateMeetingFollowUpInput,
  type MeetingFollowUpDTO,
  type MeetingFollowUpPriority,
  type SetMeetingFollowUpStatusInput,
  type UpdateMeetingFollowUpInput,
} from "./types";

type Sb = SupabaseClient<any, any, any>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUuid(
  id: string,
  code:
    | "MEETING_FOLLOW_UP_NOT_FOUND"
    | "MEETING_FOLLOW_UP_INVALID_OWNER"
    | "MEETING_FOLLOW_UP_INVALID_OUTCOME",
): void {
  if (!UUID_RE.test(id)) throw new MeetingFollowUpError(code);
}

function assertVersion(v: number): void {
  if (!Number.isInteger(v) || v < 1) {
    throw new MeetingFollowUpError("MEETING_FOLLOW_UP_VERSION_CONFLICT");
  }
}

function normalizeTitle(v: string): string {
  const t = (v ?? "").toString().trim();
  if (t.length < 1 || t.length > MEETING_FOLLOW_UP_TITLE_MAX) {
    throw new MeetingFollowUpError("MEETING_FOLLOW_UP_INVALID_TITLE");
  }
  return t;
}

function normalizeDescription(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = String(v).trim();
  if (t.length === 0) return null;
  if (t.length > MEETING_FOLLOW_UP_DESCRIPTION_MAX) {
    throw new MeetingFollowUpError("MEETING_FOLLOW_UP_INVALID_TITLE");
  }
  return t;
}

function normalizePriority(
  v: MeetingFollowUpPriority | undefined,
): MeetingFollowUpPriority | undefined {
  if (v == null) return undefined;
  if (!isKnownFollowUpPriority(v)) {
    throw new MeetingFollowUpError("MEETING_FOLLOW_UP_INVALID_PRIORITY");
  }
  return v;
}

function normalizeDueAt(v: string | null | undefined): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const ms = Date.parse(s);
  if (!Number.isFinite(ms)) {
    throw new MeetingFollowUpError("MEETING_FOLLOW_UP_INVALID_STATE");
  }
  return new Date(ms).toISOString();
}

function normalizeClientRequestId(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = String(v).trim();
  if (!t) return null;
  return t.slice(0, 200);
}

function dtoCtx(
  viewerUserId: string,
  organizerUserId: string,
  isMeetingParticipant: boolean,
  now?: Date,
): FollowUpDtoCtx {
  return { viewerUserId, organizerUserId, isMeetingParticipant, now };
}

export const MeetingFollowUpService = {
  async listFollowUps(
    sb: Sb,
    ctx: FollowUpDtoCtx,
    meetingId: string,
  ): Promise<MeetingFollowUpDTO[]> {
    assertUuid(meetingId, "MEETING_FOLLOW_UP_NOT_FOUND");
    const rows = await MeetingFollowUpRepository.listByMeeting(sb, meetingId);
    return rows.map((r: any) => toFollowUpDTO(r, ctx));
  },

  async createFollowUp(
    sb: Sb,
    ctx: FollowUpDtoCtx,
    input: CreateMeetingFollowUpInput,
  ): Promise<MeetingFollowUpDTO> {
    assertUuid(input.meetingId, "MEETING_FOLLOW_UP_NOT_FOUND");
    assertUuid(input.ownerUserId, "MEETING_FOLLOW_UP_INVALID_OWNER");
    if (input.outcomeId) assertUuid(input.outcomeId, "MEETING_FOLLOW_UP_INVALID_OUTCOME");
    const title = normalizeTitle(input.title);
    const description = normalizeDescription(input.description ?? null);
    const priority = normalizePriority(input.priority) ?? "normal";
    const dueAt = normalizeDueAt(input.dueAt ?? null);
    const cri = normalizeClientRequestId(input.clientRequestId ?? null);
    let row: FollowUpRow;
    try {
      row = await MeetingFollowUpRepository.rpcCreate(sb, {
        meetingId: input.meetingId,
        title,
        ownerUserId: input.ownerUserId,
        description,
        priority,
        dueAt,
        outcomeId: input.outcomeId ?? null,
        clientRequestId: cri,
      });
    } catch (e) {
      throw mapMeetingFollowUpError(e);
    }
    return toFollowUpDTO(row, ctx);
  },

  async updateFollowUp(
    sb: Sb,
    ctx: FollowUpDtoCtx,
    input: UpdateMeetingFollowUpInput,
  ): Promise<MeetingFollowUpDTO> {
    assertUuid(input.followUpId, "MEETING_FOLLOW_UP_NOT_FOUND");
    assertVersion(input.expectedVersion);
    if (input.ownerUserId) assertUuid(input.ownerUserId, "MEETING_FOLLOW_UP_INVALID_OWNER");
    const title = input.title != null ? normalizeTitle(input.title) : undefined;
    let description: string | null | undefined;
    if (input.clearDescription) description = null;
    else if (input.description !== undefined) description = normalizeDescription(input.description);
    const priority = normalizePriority(input.priority);
    let dueAt: string | null | undefined;
    if (input.clearDueAt) dueAt = null;
    else if (input.dueAt !== undefined) dueAt = normalizeDueAt(input.dueAt);

    let row: FollowUpRow;
    try {
      row = await MeetingFollowUpRepository.rpcUpdate(sb, {
        followUpId: input.followUpId,
        expectedVersion: input.expectedVersion,
        title,
        description,
        clearDescription: input.clearDescription === true,
        priority,
        dueAt,
        clearDueAt: input.clearDueAt === true,
        ownerUserId: input.ownerUserId,
      });
    } catch (e) {
      throw mapMeetingFollowUpError(e);
    }
    return toFollowUpDTO(row, ctx);
  },

  async setFollowUpStatus(
    sb: Sb,
    ctx: FollowUpDtoCtx,
    input: SetMeetingFollowUpStatusInput,
  ): Promise<MeetingFollowUpDTO> {
    assertUuid(input.followUpId, "MEETING_FOLLOW_UP_NOT_FOUND");
    assertVersion(input.expectedVersion);
    if (input.targetStatus !== "in_progress" && input.targetStatus !== "completed") {
      throw new MeetingFollowUpError("MEETING_FOLLOW_UP_INVALID_STATE");
    }
    let row: FollowUpRow;
    try {
      row = await MeetingFollowUpRepository.rpcSetStatus(sb, input);
    } catch (e) {
      throw mapMeetingFollowUpError(e);
    }
    return toFollowUpDTO(row, ctx);
  },

  async cancelFollowUp(
    sb: Sb,
    ctx: FollowUpDtoCtx,
    input: CancelMeetingFollowUpInput,
  ): Promise<MeetingFollowUpDTO> {
    assertUuid(input.followUpId, "MEETING_FOLLOW_UP_NOT_FOUND");
    assertVersion(input.expectedVersion);
    let row: FollowUpRow;
    try {
      row = await MeetingFollowUpRepository.rpcCancel(sb, input);
    } catch (e) {
      throw mapMeetingFollowUpError(e);
    }
    return toFollowUpDTO(row, ctx);
  },
};
