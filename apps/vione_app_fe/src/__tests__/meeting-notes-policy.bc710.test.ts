// BC-7.10 Turn B — Notes policy tests. Pure unit tests over authority,
// transitions, normalization, and error contract.

import { describe, it, expect } from "vitest";
import {
  MeetingCollaborationError,
  isKnownSharedNoteStatus,
  isAllowedSharedNoteTransition,
  normalizeNoteContent,
  canReadPrivateNote,
  canReadSharedNote,
  canManageSharedNoteDraft,
  canPublishSharedNote,
  deriveSharedNotePermissions,
  MEETING_NOTE_CONTENT_MAX,
  MEETING_SHARED_NOTE_STATUSES,
  type SharedNoteAuthorityCtx,
} from "@/lib/meeting/collaboration";

const ORG = "11111111-1111-1111-1111-111111111111";
const USER_A = "22222222-2222-2222-2222-222222222222";
const USER_B = "33333333-3333-3333-3333-333333333333";

const baseCtx = (over: Partial<SharedNoteAuthorityCtx> = {}): SharedNoteAuthorityCtx => ({
  viewerUserId: ORG,
  organizerUserId: ORG,
  isParticipant: true,
  meetingStatus: "scheduled",
  ...over,
});

describe("notes registry", () => {
  it("freezes shared-note statuses", () => {
    expect(MEETING_SHARED_NOTE_STATUSES).toEqual(["draft", "published"]);
    expect(isKnownSharedNoteStatus("draft")).toBe(true);
    expect(isKnownSharedNoteStatus("published")).toBe(true);
    expect(isKnownSharedNoteStatus("archived")).toBe(false);
  });

  it("only allows draft → published", () => {
    expect(isAllowedSharedNoteTransition("draft", "published")).toBe(true);
    expect(isAllowedSharedNoteTransition("draft", "draft")).toBe(false);
    expect(isAllowedSharedNoteTransition("published", "draft")).toBe(false);
    expect(isAllowedSharedNoteTransition("published", "published")).toBe(false);
  });
});

describe("normalizeNoteContent", () => {
  it("accepts empty content", () => {
    expect(normalizeNoteContent(null)).toBe("");
    expect(normalizeNoteContent(undefined)).toBe("");
    expect(normalizeNoteContent("")).toBe("");
  });

  it("preserves content up to the cap", () => {
    const s = "x".repeat(MEETING_NOTE_CONTENT_MAX);
    expect(normalizeNoteContent(s)).toHaveLength(MEETING_NOTE_CONTENT_MAX);
  });

  it("rejects content over the cap with MEETING_COLLABORATION_VALIDATION", () => {
    const s = "x".repeat(MEETING_NOTE_CONTENT_MAX + 1);
    try {
      normalizeNoteContent(s);
      throw new Error("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(MeetingCollaborationError);
      expect((e as MeetingCollaborationError).code).toBe("MEETING_COLLABORATION_VALIDATION");
    }
  });
});

describe("private-note authority is owner-only", () => {
  it("owner may read", () => {
    expect(canReadPrivateNote(USER_A, USER_A)).toBe(true);
  });
  it("organizer cannot read another participant's private note via policy", () => {
    // Organizer is another user relative to the note owner.
    expect(canReadPrivateNote(ORG, USER_A)).toBe(false);
  });
  it("participant cannot read another participant's private note", () => {
    expect(canReadPrivateNote(USER_B, USER_A)).toBe(false);
  });
});

describe("shared-note authority", () => {
  it("participants and organizer may read", () => {
    expect(canReadSharedNote(baseCtx({ viewerUserId: USER_A, isParticipant: true }))).toBe(true);
    expect(canReadSharedNote(baseCtx({ viewerUserId: ORG }))).toBe(true);
  });

  it("non-participants cannot read", () => {
    expect(canReadSharedNote(baseCtx({ viewerUserId: USER_B, isParticipant: false }))).toBe(false);
  });

  it("participants cannot edit or publish", () => {
    const ctx = baseCtx({ viewerUserId: USER_A, isParticipant: true });
    expect(canManageSharedNoteDraft(ctx, { noteStatus: "draft" })).toBe(false);
    expect(canPublishSharedNote(ctx, { noteStatus: "draft" })).toBe(false);
  });

  it("organizer may edit draft and publish it", () => {
    const ctx = baseCtx();
    expect(canManageSharedNoteDraft(ctx, { noteStatus: "draft" })).toBe(true);
    expect(canPublishSharedNote(ctx, { noteStatus: "draft" })).toBe(true);
  });

  it("published shared notes are locked (no edit, no re-publish)", () => {
    const ctx = baseCtx();
    expect(canManageSharedNoteDraft(ctx, { noteStatus: "published" })).toBe(false);
    expect(canPublishSharedNote(ctx, { noteStatus: "published" })).toBe(false);
  });

  it("cancelled meetings disable organizer writes", () => {
    const ctx = baseCtx({ meetingStatus: "cancelled" });
    expect(canManageSharedNoteDraft(ctx, { noteStatus: "draft" })).toBe(false);
    expect(canPublishSharedNote(ctx, { noteStatus: "draft" })).toBe(false);
  });

  it("derives full permission bundle for organizer with draft", () => {
    const perms = deriveSharedNotePermissions(baseCtx(), { noteStatus: "draft" });
    expect(perms).toEqual({
      canRead: true,
      canEditDraft: true,
      canPublish: true,
      canInitialize: true,
    });
  });

  it("derives read-only bundle for participant", () => {
    const perms = deriveSharedNotePermissions(
      baseCtx({ viewerUserId: USER_A, isParticipant: true }),
      { noteStatus: "draft" },
    );
    expect(perms).toEqual({
      canRead: true,
      canEditDraft: false,
      canPublish: false,
      canInitialize: false,
    });
  });

  it("locks permissions once published (organizer view)", () => {
    const perms = deriveSharedNotePermissions(baseCtx(), { noteStatus: "published" });
    expect(perms.canRead).toBe(true);
    expect(perms.canEditDraft).toBe(false);
    expect(perms.canPublish).toBe(false);
  });
});
