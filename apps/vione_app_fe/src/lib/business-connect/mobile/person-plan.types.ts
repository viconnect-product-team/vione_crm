// BC-Mobile-6D — Kế hoạch riêng theo từng người (client-safe types).
//
// Hai loại kế hoạch CÁ NHÂN, riêng tư của chủ sở hữu:
// - follow_up: việc cần theo dõi với một người trong mạng lưới.
// - meeting:   cuộc gặp DỰ KIẾN do chính chủ sở hữu ghi lại.
//
// Sự thật quan trọng: đây KHÔNG phải lời mời họp. Hệ thống không gửi thông
// báo, không tạo lịch mời cho người đối diện — UI phải nói đúng điều đó.

export const PERSON_PLAN_MAX_TITLE_LEN = 120;
export const PERSON_PLAN_MAX_NOTE_LEN = 500;
export const PERSON_PLAN_MAX_LOCATION_LEN = 120;
/** Chỉ cho phép hẹn trong vòng 2 năm tới. */
export const PERSON_PLAN_MAX_AHEAD_MS = 2 * 365.25 * 24 * 60 * 60_000;

export type BcMobilePersonPlanKind = "follow_up" | "meeting";
export type BcMobilePersonPlanStatus = "pending" | "done" | "cancelled";

export type BcMobilePersonPlan = {
  id: string;
  kind: BcMobilePersonPlanKind;
  personId: string;
  dueAt: string;
  title: string | null;
  note: string | null;
  locationLabel: string | null;
  status: BcMobilePersonPlanStatus;
  completedAt: string | null;
};

export type BcMobilePersonPlanErrorCode =
  | "invalid_input"
  | "invalid_due_at"
  | "relationship_not_authorized"
  | "not_found"
  | "unavailable";

export type BcMobilePersonPlanResult<T> =
  | ({ ok: true } & T)
  | { ok: false; error: BcMobilePersonPlanErrorCode };

export function sanitizePlanText(raw: string | null | undefined, max: number): string | null {
  if (!raw) return null;
  // eslint-disable-next-line no-control-regex
  const cleaned = raw.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, max) : null;
}

export function validatePlanDueAt(
  iso: string,
  nowMs: number = Date.now(),
): { ok: true; dueAt: string } | { ok: false } {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return { ok: false };
  if (ms < nowMs - 60_000) return { ok: false };
  if (ms > nowMs + PERSON_PLAN_MAX_AHEAD_MS) return { ok: false };
  return { ok: true, dueAt: new Date(ms).toISOString() };
}

/** personId đối xứng với 2C: `u:` | `c:` | `g:`. */
export function personIdFromTarget(row: {
  target_kind: string;
  target_user_id: string | null;
  target_card_id: string | null;
  target_guest_id: string | null;
}): string {
  if (row.target_kind === "connection") return `u:${row.target_user_id}`;
  if (row.target_kind === "guest_contact") return `g:${row.target_guest_id}`;
  return `c:${row.target_card_id}`;
}
