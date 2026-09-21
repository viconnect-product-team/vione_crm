/**
 * Nháp cục bộ cho màn "Lưu khoảnh khắc".
 * Chỉ lưu nội dung văn bản (thời gian, sự kiện, địa điểm, ghi chú) trên trình duyệt.
 * KHÔNG lưu ảnh: ảnh là dữ liệu nhị phân tạm thời, không phù hợp localStorage.
 */
export type MomentDraft = {
  occurredLocal: string;
  eventName: string;
  placeLabel: string;
  note: string;
  /** Lựa chọn nhắc nhở kèm theo (chỉ là ý định — nhắc nhở thật chỉ tạo khi lưu khoảnh khắc). */
  reminderEnabled: boolean;
  reminderAtLocal: string;
  reminderLabel: string;
  updatedAt: number;
};

const PREFIX = "bc.moment.draft.v1:";
/** Nháp cũ hơn 7 ngày được xem là hết hạn. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function key(personId: string) {
  return `${PREFIX}${personId}`;
}

export function isDraftEmpty(d: Omit<MomentDraft, "updatedAt">) {
  return (
    !d.eventName.trim() && !d.placeLabel.trim() && !d.note.trim() && !d.reminderEnabled
  );
}

export function readMomentDraft(personId: string): MomentDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(personId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MomentDraft>;
    if (typeof parsed?.updatedAt !== "number") return null;
    if (Date.now() - parsed.updatedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(key(personId));
      return null;
    }
    return {
      occurredLocal: typeof parsed.occurredLocal === "string" ? parsed.occurredLocal : "",
      eventName: typeof parsed.eventName === "string" ? parsed.eventName : "",
      placeLabel: typeof parsed.placeLabel === "string" ? parsed.placeLabel : "",
      note: typeof parsed.note === "string" ? parsed.note : "",
      reminderEnabled: parsed.reminderEnabled === true,
      reminderAtLocal: typeof parsed.reminderAtLocal === "string" ? parsed.reminderAtLocal : "",
      reminderLabel: typeof parsed.reminderLabel === "string" ? parsed.reminderLabel : "",
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function writeMomentDraft(personId: string, draft: Omit<MomentDraft, "updatedAt">) {
  if (typeof window === "undefined") return;
  try {
    if (isDraftEmpty(draft)) {
      window.localStorage.removeItem(key(personId));
      return;
    }
    window.localStorage.setItem(
      key(personId),
      JSON.stringify({ ...draft, updatedAt: Date.now() } satisfies MomentDraft),
    );
  } catch {
    /* bộ nhớ đầy hoặc bị chặn: bỏ qua, không chặn thao tác người dùng */
  }
}

export function clearMomentDraft(personId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(personId));
  } catch {
    /* bỏ qua */
  }
}
