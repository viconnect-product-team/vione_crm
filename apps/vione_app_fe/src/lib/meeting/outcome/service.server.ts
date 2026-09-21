// BC-7.9 Turn A — Meeting Outcome service. Validates input, calls RPCs,
// maps stable errors, and produces safe DTOs. No UI concerns.

import type { SupabaseClient } from "@supabase/supabase-js";
import { MeetingOutcomeError, mapMeetingOutcomeError } from "./errors";
import { isKnownOutcomeType } from "./registry";
import { MeetingOutcomeRepository, toOutcomeDTO, type OutcomeRow } from "./repository.server";
import {
  MEETING_OUTCOME_SUMMARY_MAX,
  type CreateMeetingOutcomeInput,
  type FinalizeMeetingOutcomeInput,
  type MeetingOutcomeDTO,
  type UpdateMeetingOutcomeInput,
} from "./types";

type Sb = SupabaseClient<any, any, any>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertMeetingId(id: string): void {
  if (!UUID_RE.test(id)) throw new MeetingOutcomeError("MEETING_OUTCOME_NOT_FOUND");
}

function normalizeSummary(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = String(v).trim();
  if (t.length === 0) return null;
  if (t.length > MEETING_OUTCOME_SUMMARY_MAX) {
    throw new MeetingOutcomeError("MEETING_OUTCOME_INVALID_SUMMARY");
  }
  return t;
}

export const MeetingOutcomeService = {
  async getOutcome(
    sb: Sb,
    viewerUserId: string,
    meetingId: string,
  ): Promise<MeetingOutcomeDTO | null> {
    assertMeetingId(meetingId);
    const row = await MeetingOutcomeRepository.getByMeetingId(sb, meetingId);
    return row ? toOutcomeDTO(row, viewerUserId) : null;
  },

  async createOutcome(
    sb: Sb,
    viewerUserId: string,
    input: CreateMeetingOutcomeInput,
  ): Promise<MeetingOutcomeDTO> {
    assertMeetingId(input.meetingId);
    if (!isKnownOutcomeType(input.outcomeType)) {
      throw new MeetingOutcomeError("MEETING_OUTCOME_INVALID_TYPE");
    }
    const summary = normalizeSummary(input.summary ?? null);
    const clientRequestId =
      input.clientRequestId != null && String(input.clientRequestId).trim() !== ""
        ? String(input.clientRequestId).trim().slice(0, 200)
        : null;
    let row: OutcomeRow;
    try {
      row = await MeetingOutcomeRepository.rpcCreate(sb, {
        meetingId: input.meetingId,
        outcomeType: input.outcomeType,
        summary,
        clientRequestId,
      });
    } catch (e) {
      throw mapMeetingOutcomeError(e);
    }
    return toOutcomeDTO(row, viewerUserId);
  },

  async updateOutcome(
    sb: Sb,
    viewerUserId: string,
    input: UpdateMeetingOutcomeInput,
  ): Promise<MeetingOutcomeDTO> {
    assertMeetingId(input.meetingId);
    if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 1) {
      throw new MeetingOutcomeError("MEETING_OUTCOME_VERSION_CONFLICT");
    }
    if (input.outcomeType != null && !isKnownOutcomeType(input.outcomeType)) {
      throw new MeetingOutcomeError("MEETING_OUTCOME_INVALID_TYPE");
    }
    let summaryArg: string | null | undefined;
    if (input.clearSummary) {
      summaryArg = null;
    } else if (input.summary !== undefined) {
      summaryArg = normalizeSummary(input.summary);
    }
    let row: OutcomeRow;
    try {
      row = await MeetingOutcomeRepository.rpcUpdate(sb, {
        meetingId: input.meetingId,
        expectedVersion: input.expectedVersion,
        outcomeType: input.outcomeType,
        summary: summaryArg,
        clearSummary: input.clearSummary === true,
      });
    } catch (e) {
      throw mapMeetingOutcomeError(e);
    }
    return toOutcomeDTO(row, viewerUserId);
  },

  async finalizeOutcome(
    sb: Sb,
    viewerUserId: string,
    input: FinalizeMeetingOutcomeInput,
  ): Promise<MeetingOutcomeDTO> {
    assertMeetingId(input.meetingId);
    if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 1) {
      throw new MeetingOutcomeError("MEETING_OUTCOME_VERSION_CONFLICT");
    }
    let row: OutcomeRow;
    try {
      row = await MeetingOutcomeRepository.rpcFinalize(sb, {
        meetingId: input.meetingId,
        expectedVersion: input.expectedVersion,
      });
    } catch (e) {
      throw mapMeetingOutcomeError(e);
    }
    return toOutcomeDTO(row, viewerUserId);
  },
};
