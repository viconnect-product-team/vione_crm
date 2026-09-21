// BC-7.9 — MeetingOutcomeSDK public surface.
// Turn A: outcome methods. Turn B: extended with follow-up methods (frozen).

import {
  createMeetingOutcomeFn,
  finalizeMeetingOutcomeFn,
  getMeetingOutcomeFn,
  updateMeetingOutcomeFn,
} from "./functions";
import type {
  CreateMeetingOutcomeInput,
  FinalizeMeetingOutcomeInput,
  MeetingOutcomeDTO,
  UpdateMeetingOutcomeInput,
} from "./types";
import {
  MeetingFollowUpSDK,
  MEETING_FOLLOW_UP_SDK_METHODS,
  type MeetingFollowUpSDKType,
} from "../follow-up/sdk";

export interface MeetingOutcomeSDKType extends MeetingFollowUpSDKType {
  getOutcome(meetingId: string): Promise<MeetingOutcomeDTO | null>;
  createOutcome(input: CreateMeetingOutcomeInput): Promise<MeetingOutcomeDTO>;
  updateOutcome(input: UpdateMeetingOutcomeInput): Promise<MeetingOutcomeDTO>;
  finalizeOutcome(input: FinalizeMeetingOutcomeInput): Promise<MeetingOutcomeDTO>;
}

export const MeetingOutcomeSDK: MeetingOutcomeSDKType = Object.freeze({
  getOutcome: (meetingId: string) =>
    getMeetingOutcomeFn({ data: { meetingId } }) as Promise<MeetingOutcomeDTO | null>,
  createOutcome: (input: CreateMeetingOutcomeInput) =>
    createMeetingOutcomeFn({
      data: {
        meetingId: input.meetingId,
        outcomeType: input.outcomeType,
        summary: input.summary ?? null,
        clientRequestId: input.clientRequestId ?? null,
      },
    }) as Promise<MeetingOutcomeDTO>,
  updateOutcome: (input: UpdateMeetingOutcomeInput) =>
    updateMeetingOutcomeFn({
      data: {
        meetingId: input.meetingId,
        expectedVersion: input.expectedVersion,
        outcomeType: input.outcomeType ?? null,
        summary: input.summary ?? null,
        clearSummary: input.clearSummary ?? false,
      },
    }) as Promise<MeetingOutcomeDTO>,
  finalizeOutcome: (input: FinalizeMeetingOutcomeInput) =>
    finalizeMeetingOutcomeFn({
      data: {
        meetingId: input.meetingId,
        expectedVersion: input.expectedVersion,
      },
    }) as Promise<MeetingOutcomeDTO>,
  // ── Turn B: follow-up surface ─────────────────────────────────────────
  listFollowUps: MeetingFollowUpSDK.listFollowUps,
  createFollowUp: MeetingFollowUpSDK.createFollowUp,
  updateFollowUp: MeetingFollowUpSDK.updateFollowUp,
  setFollowUpStatus: MeetingFollowUpSDK.setFollowUpStatus,
  cancelFollowUp: MeetingFollowUpSDK.cancelFollowUp,
});

export const MEETING_OUTCOME_SDK_METHODS = Object.freeze([
  "getOutcome",
  "createOutcome",
  "updateOutcome",
  "finalizeOutcome",
  ...MEETING_FOLLOW_UP_SDK_METHODS,
] as const);
