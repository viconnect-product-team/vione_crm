// BC-Mobile-7F — Nhắc nhở gắn với khoảnh khắc (client-safe types).
//
// Nhắc nhở là dữ liệu riêng tư của chủ khoảnh khắc: không hiển thị cho người
// đối diện, không tạo thông báo đẩy ở giai đoạn này — đây là danh sách việc
// cần làm hiển thị ngay trong ứng dụng.

export const MOMENT_REMINDER_MAX_LABEL_LEN = 200;
export const MOMENT_REMINDER_MAX_PER_MOMENT = 5;
/** Chỉ cho phép hẹn trong vòng 2 năm tới. */
export const MOMENT_REMINDER_MAX_AHEAD_MS = 2 * 365.25 * 24 * 60 * 60_000;

export type BcMobileMomentReminderStatus = "pending" | "done" | "cancelled";

export type BcMobileMomentReminder = {
  id: string;
  momentId: string;
  remindAt: string;
  label: string | null;
  status: BcMobileMomentReminderStatus;
  completedAt: string | null;
};

export type BcMobileMomentReminderErrorCode =
  | "invalid_input"
  | "invalid_remind_at"
  | "limit_reached"
  | "not_found"
  | "unavailable";

export type BcMobileMomentReminderResult<T> =
  | ({ ok: true } & T)
  | { ok: false; error: BcMobileMomentReminderErrorCode };

export function sanitizeReminderLabel(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // eslint-disable-next-line no-control-regex
  const cleaned = raw.replace(/[\u0000-\u001F\u007F]/g, " ").trim();
  return cleaned ? cleaned.slice(0, MOMENT_REMINDER_MAX_LABEL_LEN) : null;
}

export function validateRemindAt(
  iso: string,
  nowMs: number = Date.now(),
): { ok: true; remindAt: string } | { ok: false } {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return { ok: false };
  // Cho phép lệch nhỏ về quá khứ (người dùng chọn "hôm nay").
  if (ms < nowMs - 60_000) return { ok: false };
  if (ms > nowMs + MOMENT_REMINDER_MAX_AHEAD_MS) return { ok: false };
  return { ok: true, remindAt: new Date(ms).toISOString() };
}
