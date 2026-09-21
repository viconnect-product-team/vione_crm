// BC-Mobile-2E — Meeting Moment domain service (pure, dependency-injected).
//
// No Supabase imports, no React, no globals. All persistence and
// authorization flow through injected ports so the full prepare/finalize
// lifecycle is unit-testable without a database.

import {
  MOMENT_MAX_EVENT_NAME_LEN,
  MOMENT_MAX_NOTE_LEN,
  MOMENT_MAX_PHOTOS,
  MOMENT_MAX_PLACE_LABEL_LEN,
  isValidMomentPhotoCount,
  sanitizeMomentPlainText,
  validateMomentOccurredAt,
  type BcMobileMomentErrorCode,
  type BcMobileMomentPhotoSlot,
  type BcMobileMomentPrepareResult,
  type BcMobileMomentFinalizeResult,
  type BcMobileMomentUpdateResult,
  type BcMobileMomentDeleteResult,
  type BcMobileMomentStatus,
  type BcMobileMomentTargetKind,
} from "./moment.types";

// ── Ports ───────────────────────────────────────────────────────────────────

export type MomentTargetRef =
  | { kind: "connection"; userId: string }
  | { kind: "saved_card"; cardId: string }
  | { kind: "guest_contact"; guestContactId: string };

export type MomentDraftRow = {
  id: string;
  ownerUserId: string;
  targetKind: BcMobileMomentTargetKind;
  targetUserId: string | null;
  targetCardId: string | null;
  targetGuestContactId: string | null;
  occurredAt: string;
  eventName: string | null;
  placeLabel: string | null;
  note: string | null;
  status: BcMobileMomentStatus;
  clientToken: string;
};

export type MomentMediaSlotRow = {
  id: string;
  momentId: string;
  storagePath: string;
  sortOrder: number;
};

export interface MomentServiceDeps {
  /** Fail-closed person authorization (mirrors 2C). Must re-resolve the
   * opaque person id server-side; never trusts the client. */
  authorizePerson(input: {
    viewerId: string;
    personId: string;
  }): Promise<
    { ok: true; target: MomentTargetRef } | { ok: false; error: BcMobileMomentErrorCode }
  >;
  findDraftByToken(input: { ownerId: string; clientToken: string }): Promise<MomentDraftRow | null>;
  createDraft(input: {
    ownerId: string;
    target: MomentTargetRef;
    occurredAt: string;
    eventName: string | null;
    placeLabel: string | null;
    note: string | null;
    clientToken: string;
  }): Promise<MomentDraftRow>;
  updateDraftFields(input: {
    ownerId: string;
    momentId: string;
    occurredAt: string;
    eventName: string | null;
    placeLabel: string | null;
    note: string | null;
  }): Promise<void>;
  /** Replaces ALL media slot rows for a pending draft with fresh UUIDs and
   * server-generated storage paths. */
  replaceMediaSlots(input: {
    ownerId: string;
    momentId: string;
    count: number;
  }): Promise<MomentMediaSlotRow[]>;
  getMomentForOwner(input: { ownerId: string; momentId: string }): Promise<MomentDraftRow | null>;
  listMediaSlots(input: { momentId: string }): Promise<MomentMediaSlotRow[]>;
  /** Deletes the given media slot rows (not-uploaded leftovers) and flips a
   * pending draft to active. Idempotent. */
  finalizeDraft(input: {
    ownerId: string;
    momentId: string;
    keepMediaIds: string[];
    allMediaIds: string[];
  }): Promise<void>;
  /** BC-Mobile-7C — sửa nội dung một khoảnh khắc đã lưu (owner-scoped). */
  updateMomentFields(input: {
    ownerId: string;
    momentId: string;
    occurredAt: string;
    eventName: string | null;
    placeLabel: string | null;
    note: string | null;
  }): Promise<void>;
  /** BC-Mobile-7C — xoá hẳn khoảnh khắc: ảnh trong kho, hàng media, hàng moment. */
  deleteMomentCascade(input: {
    ownerId: string;
    momentId: string;
    storagePaths: string[];
  }): Promise<void>;
  /** BC-Mobile-7D — thêm chỗ ảnh mới vào một khoảnh khắc đã lưu. */
  appendMediaSlots(input: {
    ownerId: string;
    momentId: string;
    startSort: number;
    count: number;
  }): Promise<MomentMediaSlotRow[]>;
  /** BC-Mobile-7D — gỡ ảnh: tệp trong kho + hàng dữ liệu. */
  deleteMediaRows(input: {
    ownerId: string;
    momentId: string;
    mediaIds: string[];
    storagePaths: string[];
  }): Promise<void>;
  /** BC-Mobile-7D — ký URL xem tạm cho ảnh riêng tư. */
  signMediaUrls(input: { paths: string[] }): Promise<Record<string, string>>;

  now(): number;

  newId(): string;
}

// ── Prepare ─────────────────────────────────────────────────────────────────

export type PrepareMomentInput = {
  viewerId: string;
  personId: string;
  occurredAt: string;
  eventName?: string | null;
  placeLabel?: string | null;
  note?: string | null;
  photoCount: number;
  clientToken: string;
};

/**
 * Idempotent draft upsert keyed by (owner, clientToken):
 * - active draft already exists → replay success (double-tap / retry after
 *   a completed save).
 * - pending draft exists → refresh fields + fresh upload slots (retry after
 *   a partial upload failure).
 * - otherwise → create the draft.
 */
export async function prepareMoment(
  deps: MomentServiceDeps,
  input: PrepareMomentInput,
): Promise<BcMobileMomentPrepareResult> {
  if (!isValidMomentPhotoCount(input.photoCount)) return { ok: false, error: "photo_count" };

  const occurred = validateMomentOccurredAt(input.occurredAt, deps.now());
  if (!occurred.ok) return { ok: false, error: "invalid_occurred_at" };

  const eventName = input.eventName
    ? sanitizeMomentPlainText(input.eventName, MOMENT_MAX_EVENT_NAME_LEN) || null
    : null;
  const placeLabel = input.placeLabel
    ? sanitizeMomentPlainText(input.placeLabel, MOMENT_MAX_PLACE_LABEL_LEN) || null
    : null;
  const note = input.note ? sanitizeMomentPlainText(input.note, MOMENT_MAX_NOTE_LEN) || null : null;

  const authz = await deps.authorizePerson({ viewerId: input.viewerId, personId: input.personId });
  if (!authz.ok) return { ok: false, error: authz.error };

  const existing = await deps.findDraftByToken({
    ownerId: input.viewerId,
    clientToken: input.clientToken,
  });

  if (existing && existing.status === "active") {
    return { ok: true, alreadySaved: true, momentId: existing.id, photos: [] };
  }

  let draft: MomentDraftRow;
  if (existing) {
    await deps.updateDraftFields({
      ownerId: input.viewerId,
      momentId: existing.id,
      occurredAt: occurred.occurredAt,
      eventName,
      placeLabel,
      note,
    });
    draft = existing;
  } else {
    draft = await deps.createDraft({
      ownerId: input.viewerId,
      target: authz.target,
      occurredAt: occurred.occurredAt,
      eventName,
      placeLabel,
      note,
      clientToken: input.clientToken,
    });
  }

  const slots = await deps.replaceMediaSlots({
    ownerId: input.viewerId,
    momentId: draft.id,
    count: input.photoCount,
  });

  const photos: BcMobileMomentPhotoSlot[] = slots.map((s) => ({
    mediaId: s.id,
    storagePath: s.storagePath,
    sortOrder: s.sortOrder,
  }));

  return { ok: true, alreadySaved: false, momentId: draft.id, photos };
}

// ── Finalize ────────────────────────────────────────────────────────────────

export type FinalizeMomentInput = {
  viewerId: string;
  momentId: string;
  uploadedMediaIds: string[];
};

/**
 * Owner-scoped finalize. Drops slot rows the client never uploaded (partial
 * upload failure) and flips pending → active. Replays are safe: an active
 * Moment short-circuits.
 */
export async function finalizeMoment(
  deps: MomentServiceDeps,
  input: FinalizeMomentInput,
): Promise<BcMobileMomentFinalizeResult> {
  const moment = await deps.getMomentForOwner({
    ownerId: input.viewerId,
    momentId: input.momentId,
  });
  if (!moment) return { ok: false, error: "not_found" };
  if (moment.status === "active") return { ok: true, momentId: moment.id };

  const slots = await deps.listMediaSlots({ momentId: moment.id });
  const slotIds = new Set(slots.map((s) => s.id));
  const keep = input.uploadedMediaIds.filter((id) => slotIds.has(id));
  if (keep.length > MOMENT_MAX_PHOTOS) return { ok: false, error: "photo_count" };

  await deps.finalizeDraft({
    ownerId: input.viewerId,
    momentId: moment.id,
    keepMediaIds: keep,
    allMediaIds: slots.map((s) => s.id),
  });

  return { ok: true, momentId: moment.id };
}

/** Server-generated, traversal-proof storage path. Only UUIDs — never any
 * client-supplied file name. */
export function momentStoragePath(input: {
  ownerId: string;
  momentId: string;
  mediaId: string;
}): string {
  return `${input.ownerId}/${input.momentId}/${input.mediaId}.jpg`;
}

// ── BC-Mobile-7C — Sửa / Xoá khoảnh khắc đã lưu ─────────────────────────────
//
// Cùng posture với prepare/finalize: owner-scoped, fail-closed, không tin dữ
// liệu client. Người liên quan (target) là bất biến — muốn đổi người thì tạo
// khoảnh khắc mới.

export type UpdateMomentInput = {
  viewerId: string;
  momentId: string;
  occurredAt: string;
  eventName?: string | null;
  placeLabel?: string | null;
  note?: string | null;
};

export async function updateMoment(
  deps: MomentServiceDeps,
  input: UpdateMomentInput,
): Promise<BcMobileMomentUpdateResult> {
  const occurred = validateMomentOccurredAt(input.occurredAt, deps.now());
  if (!occurred.ok) return { ok: false, error: "invalid_occurred_at" };

  const moment = await deps.getMomentForOwner({
    ownerId: input.viewerId,
    momentId: input.momentId,
  });
  if (!moment) return { ok: false, error: "not_found" };

  const eventName = input.eventName
    ? sanitizeMomentPlainText(input.eventName, MOMENT_MAX_EVENT_NAME_LEN) || null
    : null;
  const placeLabel = input.placeLabel
    ? sanitizeMomentPlainText(input.placeLabel, MOMENT_MAX_PLACE_LABEL_LEN) || null
    : null;
  const note = input.note ? sanitizeMomentPlainText(input.note, MOMENT_MAX_NOTE_LEN) || null : null;

  await deps.updateMomentFields({
    ownerId: input.viewerId,
    momentId: moment.id,
    occurredAt: occurred.occurredAt,
    eventName,
    placeLabel,
    note,
  });

  return { ok: true, momentId: moment.id };
}

export type DeleteMomentInput = { viewerId: string; momentId: string };

/** Xoá hẳn và không thể hoàn tác. Idempotent: xoá một khoảnh khắc đã biến mất
 * trả về not_found chứ không ném lỗi. */
export async function deleteMoment(
  deps: MomentServiceDeps,
  input: DeleteMomentInput,
): Promise<BcMobileMomentDeleteResult> {
  const moment = await deps.getMomentForOwner({
    ownerId: input.viewerId,
    momentId: input.momentId,
  });
  if (!moment) return { ok: false, error: "not_found" };

  const slots = await deps.listMediaSlots({ momentId: moment.id });
  await deps.deleteMomentCascade({
    ownerId: input.viewerId,
    momentId: moment.id,
    storagePaths: slots.map((s) => s.storagePath),
  });

  return { ok: true, momentId: moment.id };
}

// ── BC-Mobile-7D — Sửa ảnh của khoảnh khắc đã lưu ───────────────────────────
//
// Chủ sở hữu có thể gỡ từng ảnh hoặc tải thêm ảnh mới (tổng vẫn ≤ giới hạn).
// Đường dẫn kho ảnh luôn do máy chủ sinh; client không bao giờ chọn được path.

export type MomentPhotoRef = {
  mediaId: string;
  storagePath: string;
  sortOrder: number;
  url: string | null;
};

export type BcMobileMomentPhotosResult =
  | { ok: true; momentId: string; photos: MomentPhotoRef[]; max: number }
  | { ok: false; error: BcMobileMomentErrorCode };

export type BcMobileMomentPhotoSlotsResult =
  | { ok: true; momentId: string; photos: BcMobileMomentPhotoSlot[] }
  | { ok: false; error: BcMobileMomentErrorCode };

export async function listMomentPhotos(
  deps: MomentServiceDeps,
  input: { viewerId: string; momentId: string },
): Promise<BcMobileMomentPhotosResult> {
  const moment = await deps.getMomentForOwner({
    ownerId: input.viewerId,
    momentId: input.momentId,
  });
  if (!moment) return { ok: false, error: "not_found" };

  const slots = await deps.listMediaSlots({ momentId: moment.id });
  const signed = await deps.signMediaUrls({ paths: slots.map((s) => s.storagePath) });
  return {
    ok: true,
    momentId: moment.id,
    max: MOMENT_MAX_PHOTOS,
    photos: slots.map((s) => ({
      mediaId: s.id,
      storagePath: s.storagePath,
      sortOrder: s.sortOrder,
      url: signed[s.storagePath] ?? null,
    })),
  };
}

/** Tạo chỗ trống để client tải ảnh mới lên (chưa hiển thị cho tới khi commit). */
export async function addMomentPhotoSlots(
  deps: MomentServiceDeps,
  input: { viewerId: string; momentId: string; count: number },
): Promise<BcMobileMomentPhotoSlotsResult> {
  if (!Number.isInteger(input.count) || input.count < 1 || input.count > MOMENT_MAX_PHOTOS) {
    return { ok: false, error: "photo_count" };
  }
  const moment = await deps.getMomentForOwner({
    ownerId: input.viewerId,
    momentId: input.momentId,
  });
  if (!moment) return { ok: false, error: "not_found" };

  const existing = await deps.listMediaSlots({ momentId: moment.id });
  if (existing.length + input.count > MOMENT_MAX_PHOTOS) {
    return { ok: false, error: "photo_count" };
  }
  const startSort = existing.reduce((max, s) => Math.max(max, s.sortOrder + 1), 0);
  const slots = await deps.appendMediaSlots({
    ownerId: input.viewerId,
    momentId: moment.id,
    startSort,
    count: input.count,
  });
  return {
    ok: true,
    momentId: moment.id,
    photos: slots.map((s) => ({
      mediaId: s.id,
      storagePath: s.storagePath,
      sortOrder: s.sortOrder,
    })),
  };
}

/** Dọn các chỗ trống mà client không tải lên được (tải hỏng / mất mạng). */
export async function commitMomentPhotos(
  deps: MomentServiceDeps,
  input: {
    viewerId: string;
    momentId: string;
    addedMediaIds: string[];
    uploadedMediaIds: string[];
  },
): Promise<BcMobileMomentUpdateResult> {
  const moment = await deps.getMomentForOwner({
    ownerId: input.viewerId,
    momentId: input.momentId,
  });
  if (!moment) return { ok: false, error: "not_found" };

  const slots = await deps.listMediaSlots({ momentId: moment.id });
  const uploaded = new Set(input.uploadedMediaIds);
  const drop = slots.filter((s) => input.addedMediaIds.includes(s.id) && !uploaded.has(s.id));
  if (drop.length > 0) {
    await deps.deleteMediaRows({
      ownerId: input.viewerId,
      momentId: moment.id,
      mediaIds: drop.map((s) => s.id),
      storagePaths: drop.map((s) => s.storagePath),
    });
  }
  return { ok: true, momentId: moment.id };
}

/** Gỡ hẳn một ảnh khỏi khoảnh khắc (xoá cả tệp trong kho riêng tư). */
export async function removeMomentPhoto(
  deps: MomentServiceDeps,
  input: { viewerId: string; momentId: string; mediaId: string },
): Promise<BcMobileMomentUpdateResult> {
  const moment = await deps.getMomentForOwner({
    ownerId: input.viewerId,
    momentId: input.momentId,
  });
  if (!moment) return { ok: false, error: "not_found" };

  const slots = await deps.listMediaSlots({ momentId: moment.id });
  const hit = slots.find((s) => s.id === input.mediaId);
  if (!hit) return { ok: false, error: "not_found" };

  await deps.deleteMediaRows({
    ownerId: input.viewerId,
    momentId: moment.id,
    mediaIds: [hit.id],
    storagePaths: [hit.storagePath],
  });
  return { ok: true, momentId: moment.id };
}
