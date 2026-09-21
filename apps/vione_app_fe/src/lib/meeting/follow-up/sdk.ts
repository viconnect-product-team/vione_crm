// BC-7.9 Turn B — Follow-up half of the MeetingOutcomeSDK surface.
// Framework-free wrapper around the server functions.

import {
  cancelMeetingFollowUpFn,
  createMeetingFollowUpFn,
  listMeetingFollowUpsFn,
  setMeetingFollowUpStatusFn,
  updateMeetingFollowUpFn,
} from "./functions";
import type {
  CancelMeetingFollowUpInput,
  CreateMeetingFollowUpInput,
  MeetingFollowUpDTO,
  SetMeetingFollowUpStatusInput,
  UpdateMeetingFollowUpInput,
} from "./types";

export interface MeetingFollowUpSDKType {
  listFollowUps(meetingId: string): Promise<MeetingFollowUpDTO[]>;
  createFollowUp(input: CreateMeetingFollowUpInput): Promise<MeetingFollowUpDTO>;
  updateFollowUp(input: UpdateMeetingFollowUpInput): Promise<MeetingFollowUpDTO>;
  setFollowUpStatus(input: SetMeetingFollowUpStatusInput): Promise<MeetingFollowUpDTO>;
  cancelFollowUp(input: CancelMeetingFollowUpInput): Promise<MeetingFollowUpDTO>;
}

export const MeetingFollowUpSDK: MeetingFollowUpSDKType = Object.freeze({
  listFollowUps: (meetingId: string) =>
    listMeetingFollowUpsFn({ data: { meetingId } }) as Promise<MeetingFollowUpDTO[]>,
  createFollowUp: (input: CreateMeetingFollowUpInput) =>
    createMeetingFollowUpFn({
      data: {
        meetingId: input.meetingId,
        title: input.title,
        ownerUserId: input.ownerUserId,
        description: input.description ?? null,
        priority: input.priority ?? null,
        dueAt: input.dueAt ?? null,
        outcomeId: input.outcomeId ?? null,
        clientRequestId: input.clientRequestId ?? null,
      },
    }) as Promise<MeetingFollowUpDTO>,
  updateFollowUp: (input: UpdateMeetingFollowUpInput) =>
    updateMeetingFollowUpFn({
      data: {
        followUpId: input.followUpId,
        expectedVersion: input.expectedVersion,
        title: input.title,
        description: input.description ?? null,
        clearDescription: input.clearDescription ?? false,
        priority: input.priority,
        dueAt: input.dueAt ?? null,
        clearDueAt: input.clearDueAt ?? false,
        ownerUserId: input.ownerUserId,
      },
    }) as Promise<MeetingFollowUpDTO>,
  setFollowUpStatus: (input: SetMeetingFollowUpStatusInput) =>
    setMeetingFollowUpStatusFn({
      data: {
        followUpId: input.followUpId,
        expectedVersion: input.expectedVersion,
        targetStatus: input.targetStatus,
      },
    }) as Promise<MeetingFollowUpDTO>,
  cancelFollowUp: (input: CancelMeetingFollowUpInput) =>
    cancelMeetingFollowUpFn({
      data: {
        followUpId: input.followUpId,
        expectedVersion: input.expectedVersion,
      },
    }) as Promise<MeetingFollowUpDTO>,
});

export const MEETING_FOLLOW_UP_SDK_METHODS = Object.freeze([
  "listFollowUps",
  "createFollowUp",
  "updateFollowUp",
  "setFollowUpStatus",
  "cancelFollowUp",
] as const);
