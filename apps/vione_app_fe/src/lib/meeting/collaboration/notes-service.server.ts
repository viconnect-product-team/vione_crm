// BC-7.10 Turn B — Meeting Notes services. Validates input, calls RPCs,
// maps stable errors, produces safe DTOs. Two separate services enforce
// the private/shared security boundary at the type level.

import type { SupabaseClient } from "@supabase/supabase-js";
import { MeetingCollaborationError, mapMeetingCollaborationError } from "./errors";
import { normalizeNoteContent } from "./notes-policy";
import {
  MeetingPrivateNoteRepository,
  MeetingSharedNoteRepository,
  toPrivateNoteDTO,
  toSharedNoteDTO,
} from "./notes-repository.server";
import type {
  MeetingPrivateNoteDTO,
  MeetingSharedNoteDTO,
  PublishSharedNoteInput,
  UpdateSharedNoteInput,
  UpsertPrivateNoteInput,
} from "./types";

type Sb = SupabaseClient<any, any, any>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function assertUuid(v: string): void {
  if (!UUID_RE.test(v)) throw new MeetingCollaborationError("MEETING_COLLABORATION_NOT_FOUND");
}

function assertVersion(v: number): void {
  if (!Number.isInteger(v) || v < 1) {
    throw new MeetingCollaborationError("MEETING_COLLABORATION_VERSION_CONFLICT");
  }
}

// ---------- Private ----------

export const MeetingPrivateNoteService = {
  /** Owner-only read. Returns null on first access (no note yet). */
  async getMine(
    sb: Sb,
    _viewerUserId: string,
    meetingId: string,
  ): Promise<MeetingPrivateNoteDTO | null> {
    assertUuid(meetingId);
    try {
      const row = await MeetingPrivateNoteRepository.getMine(sb, meetingId);
      return row ? toPrivateNoteDTO(row) : null;
    } catch (e) {
      throw mapMeetingCollaborationError(e);
    }
  },

  async upsert(
    sb: Sb,
    _viewerUserId: string,
    input: UpsertPrivateNoteInput,
  ): Promise<MeetingPrivateNoteDTO> {
    assertUuid(input.meetingId);
    if (input.expectedVersion != null) {
      if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 0) {
        throw new MeetingCollaborationError("MEETING_COLLABORATION_VERSION_CONFLICT");
      }
    }
    const content = normalizeNoteContent(input.content);
    try {
      const row = await MeetingPrivateNoteRepository.rpcUpsert(sb, {
        meetingId: input.meetingId,
        content,
        expectedVersion: input.expectedVersion,
      });
      return toPrivateNoteDTO(row);
    } catch (e) {
      throw mapMeetingCollaborationError(e);
    }
  },
};

// ---------- Shared ----------

export const MeetingSharedNoteService = {
  /** RLS-scoped: participant / organizer / admin. */
  async get(
    sb: Sb,
    _viewerUserId: string,
    meetingId: string,
  ): Promise<MeetingSharedNoteDTO | null> {
    assertUuid(meetingId);
    try {
      const row = await MeetingSharedNoteRepository.getByMeetingId(sb, meetingId);
      return row ? toSharedNoteDTO(row) : null;
    } catch (e) {
      throw mapMeetingCollaborationError(e);
    }
  },

  /** Organizer only. Idempotent. */
  async getOrCreate(
    sb: Sb,
    _viewerUserId: string,
    meetingId: string,
  ): Promise<MeetingSharedNoteDTO> {
    assertUuid(meetingId);
    try {
      const row = await MeetingSharedNoteRepository.rpcGetOrCreate(sb, meetingId);
      return toSharedNoteDTO(row);
    } catch (e) {
      throw mapMeetingCollaborationError(e);
    }
  },

  async updateDraft(
    sb: Sb,
    _viewerUserId: string,
    input: UpdateSharedNoteInput,
  ): Promise<MeetingSharedNoteDTO> {
    assertUuid(input.meetingId);
    assertVersion(input.expectedVersion);
    const content = normalizeNoteContent(input.content);
    try {
      const row = await MeetingSharedNoteRepository.rpcUpdate(sb, {
        meetingId: input.meetingId,
        expectedVersion: input.expectedVersion,
        content,
      });
      return toSharedNoteDTO(row);
    } catch (e) {
      throw mapMeetingCollaborationError(e);
    }
  },

  async publish(
    sb: Sb,
    _viewerUserId: string,
    input: PublishSharedNoteInput,
  ): Promise<MeetingSharedNoteDTO> {
    assertUuid(input.meetingId);
    assertVersion(input.expectedVersion);
    try {
      const row = await MeetingSharedNoteRepository.rpcPublish(sb, input);
      return toSharedNoteDTO(row);
    } catch (e) {
      throw mapMeetingCollaborationError(e);
    }
  },
};
