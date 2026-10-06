/**
 * Nháp cục bộ cho màn "Lưu khoảnh khắc".
 * Hỗ trợ lưu nhiều bản nháp riêng biệt độc lập (mỗi bản có ID và timestamp riêng),
 * không ghi đè lên bản nháp cũ.
 * Chỉ lưu nội dung văn bản (thời gian, sự kiện, địa điểm, ghi chú) trên trình duyệt.
 */
export type MomentDraft = {
  id: string;
  occurredLocal: string;
  eventName: string;
  placeLabel: string;
  note: string;
  /** Lựa chọn nhắc nhở kèm theo (chỉ là ý định — nhắc nhở thật chỉ tạo khi lưu khoảnh khắc). */
  reminderEnabled: boolean;
  reminderAtLocal: string;
  reminderLabel: string;
  createdAt: number;
  updatedAt: number;
};

const PREFIX_LIST = "bc.moment.drafts.v2:";
const LEGACY_PREFIX = "bc.moment.draft.v1:";
/** Nháp cũ hơn 30 ngày được xem là hết hạn. */
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function listKey(personId: string) {
  return `${PREFIX_LIST}${personId}`;
}

export function isDraftEmpty(d: Partial<MomentDraft>) {
  return (
    !d.eventName?.trim() &&
    !d.placeLabel?.trim() &&
    !d.note?.trim() &&
    !d.reminderEnabled
  );
}

/**
 * Lấy toàn bộ danh sách các bản nháp độc lập của personId (mới nhất xếp trước)
 */
export function listMomentDrafts(personId: string): MomentDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(listKey(personId));
    let list: MomentDraft[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        list = parsed.filter(
          (d) => typeof d === "object" && d !== null && Date.now() - (d.updatedAt || 0) <= MAX_AGE_MS,
        );
      }
    }

    // Tương thích ngược: nếu có bản nháp cũ v1, chuyển đổi thành 1 bản nháp riêng
    const legacyRaw = window.localStorage.getItem(`${LEGACY_PREFIX}${personId}`);
    if (legacyRaw && list.length === 0) {
      try {
        const legacy = JSON.parse(legacyRaw);
        if (legacy && !isDraftEmpty(legacy)) {
          const migrated: MomentDraft = {
            id: `legacy-${Date.now()}`,
            occurredLocal: legacy.occurredLocal || "",
            eventName: legacy.eventName || "",
            placeLabel: legacy.placeLabel || "",
            note: legacy.note || "",
            reminderEnabled: Boolean(legacy.reminderEnabled),
            reminderAtLocal: legacy.reminderAtLocal || "",
            reminderLabel: legacy.reminderLabel || "",
            createdAt: legacy.updatedAt || Date.now(),
            updatedAt: legacy.updatedAt || Date.now(),
          };
          list.push(migrated);
          window.localStorage.setItem(listKey(personId), JSON.stringify(list));
          window.localStorage.removeItem(`${LEGACY_PREFIX}${personId}`);
        }
      } catch {
        /* ignore */
      }
    }

    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

/**
 * Đọc bản nháp mới nhất (để khôi phục mặc định khi mở màn)
 */
export function readMomentDraft(personId: string): MomentDraft | null {
  const all = listMomentDrafts(personId);
  return all.length > 0 ? all[0] : null;
}

/**
 * Lưu thành một BẢN NHÁP MỚI RIÊNG BIỆT (không ghi đè lên bản nháp cũ)
 */
export function saveAsNewMomentDraft(
  personId: string,
  draft: Omit<MomentDraft, "id" | "createdAt" | "updatedAt">,
): MomentDraft | null {
  if (typeof window === "undefined" || isDraftEmpty(draft)) return null;
  try {
    const all = listMomentDrafts(personId);
    const now = Date.now();
    const newDraft: MomentDraft = {
      ...draft,
      id: `draft-${now}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };

    // Giữ tối đa 20 bản nháp gần nhất
    const updatedList = [newDraft, ...all.slice(0, 19)];
    window.localStorage.setItem(listKey(personId), JSON.stringify(updatedList));
    return newDraft;
  } catch {
    return null;
  }
}

/**
 * Cập nhật một bản nháp cụ thể theo ID hoặc tạo mới nếu chưa có
 */
export function writeMomentDraft(
  personId: string,
  draft: Omit<MomentDraft, "updatedAt" | "createdAt" | "id"> & { id?: string; createdAt?: number },
) {
  if (typeof window === "undefined") return;
  try {
    if (isDraftEmpty(draft)) return;
    const all = listMomentDrafts(personId);
    const now = Date.now();

    if (draft.id) {
      const idx = all.findIndex((d) => d.id === draft.id);
      if (idx !== -1) {
        all[idx] = {
          ...all[idx],
          ...draft,
          id: draft.id,
          updatedAt: now,
        };
        window.localStorage.setItem(listKey(personId), JSON.stringify(all));
        return;
      }
    }

    // Nếu không có id hoặc không tìm thấy, lưu thành bản nháp mới
    saveAsNewMomentDraft(personId, draft);
  } catch {
    /* ignore */
  }
}

/**
 * Xóa một bản nháp cụ thể theo ID
 */
export function deleteMomentDraft(personId: string, draftId: string) {
  if (typeof window === "undefined") return;
  try {
    const all = listMomentDrafts(personId);
    const filtered = all.filter((d) => d.id !== draftId);
    window.localStorage.setItem(listKey(personId), JSON.stringify(filtered));
  } catch {
    /* ignore */
  }
}

/**
 * Xóa toàn bộ các bản nháp của personId
 */
export function clearMomentDraft(personId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(listKey(personId));
    window.localStorage.removeItem(`${LEGACY_PREFIX}${personId}`);
  } catch {
    /* ignore */
  }
}
