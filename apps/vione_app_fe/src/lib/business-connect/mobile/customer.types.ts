// BC-Mobile-8A — "Khách hàng của tôi" (client-safe types).
//
// Nhóm khách hàng là nhóm RIÊNG TƯ của chủ tài khoản, tách hẳn khỏi Cộng đồng
// và khỏi Network: một người có thể là khách hàng mà chưa từng là kết nối, và
// ngược lại. Người được gắn nhãn KHÔNG hề biết mình nằm trong danh sách này.

export const CUSTOMER_STAGES = [
  "prospect",
  "consulting",
  "won",
  "nurturing",
  "inactive",
] as const;

export type BcCustomerStage = (typeof CUSTOMER_STAGES)[number];

export const CUSTOMER_LOG_KINDS = [
  "call",
  "meeting",
  "email",
  "message",
  "note",
  "stage_change",
] as const;

export type BcCustomerLogKind = (typeof CUSTOMER_LOG_KINDS)[number];

export const CUSTOMER_MAX_NOTE_LEN = 1000;
export const CUSTOMER_MAX_NAME_LEN = 160;
export const CUSTOMER_MAX_SOURCE_LEN = 120;
/** Trần giá trị hợp đồng dự kiến (đơn vị tiền tệ đã chọn). */
export const CUSTOMER_MAX_VALUE = 999_999_999_999;
/** Nhãn phân nhóm khách hàng (chiến dịch, ngành, mức ưu tiên…). */
export const CUSTOMER_MAX_TAG_NAME_LEN = 40;
export const CUSTOMER_MAX_TAGS_PER_CUSTOMER = 8;
export const CUSTOMER_MAX_TAGS_PER_OWNER = 60;

export type BcCustomerTag = {
  id: string;
  name: string;
  normalizedName: string;
  /** Số khách hàng đang gắn nhãn này. */
  count: number;
  createdAt: string;
  updatedAt: string;
};

export function normalizeCustomerTagName(input: string): string {
  return input
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .slice(0, CUSTOMER_MAX_TAG_NAME_LEN);
}

export type BcCustomer = {
  id: string;
  personId: string;
  displayName: string | null;
  companyName: string | null;
  stage: BcCustomerStage;
  expectedValue: number | null;
  currency: string;
  sourceLabel: string | null;
  note: string | null;
  nextActionAt: string | null;
  lastContactAt: string | null;
  /** Nhãn đang gắn cho khách hàng này (id trong danh mục nhãn riêng). */
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
};

/**
 * Nhịp chăm sóc mặc định theo giai đoạn (số ngày tới lần chăm sóc kế tiếp).
 * "Ngừng" không tự đặt lịch nhắc.
 */
export const CUSTOMER_STAGE_CADENCE_DAYS: Record<BcCustomerStage, number | null> = {
  prospect: 3,
  consulting: 7,
  won: 30,
  nurturing: 45,
  inactive: null,
};

/** Việc cần làm gợi ý theo giai đoạn (khoá i18n). */
export const CUSTOMER_STAGE_TASK_TKEY: Record<BcCustomerStage, string> = {
  prospect: "bc.mobile.customers.task.prospect",
  consulting: "bc.mobile.customers.task.consulting",
  won: "bc.mobile.customers.task.won",
  nurturing: "bc.mobile.customers.task.nurturing",
  inactive: "bc.mobile.customers.task.inactive",
};

/** Mốc chăm sóc kế tiếp tính từ một thời điểm gốc theo giai đoạn. */
export function nextActionForStage(
  stage: BcCustomerStage,
  fromMs: number = Date.now(),
): string | null {
  const days = CUSTOMER_STAGE_CADENCE_DAYS[stage];
  if (days === null) return null;
  return new Date(fromMs + days * 24 * 60 * 60_000).toISOString();
}

/** Số ngày còn lại (âm = đã quá hạn) tới lần chăm sóc kế tiếp. */
export function daysUntilNextAction(
  customer: BcCustomer,
  nowMs: number = Date.now(),
): number | null {
  if (!customer.nextActionAt) return null;
  const ms = Date.parse(customer.nextActionAt);
  if (!Number.isFinite(ms)) return null;
  return Math.ceil((ms - nowMs) / (24 * 60 * 60_000));
}

/** Việc cần làm đang tới hạn (trong 3 ngày tới) hoặc đã quá hạn. */
export function isCustomerTaskDue(customer: BcCustomer, nowMs: number = Date.now()): boolean {
  if (customer.stage === "inactive") return false;
  const days = daysUntilNextAction(customer, nowMs);
  if (days === null) return isCustomerOverdue(customer, nowMs);
  return days <= 3;
}

export type BcCustomerLog = {
  id: string;
  customerId: string;
  kind: BcCustomerLogKind;
  body: string | null;
  fromStage: BcCustomerStage | null;
  toStage: BcCustomerStage | null;
  occurredAt: string;
};

export type BcCustomerErrorCode =
  | "invalid_input"
  | "relationship_not_authorized"
  | "already_exists"
  | "duplicate_tag"
  | "not_found"
  | "unavailable";

export type BcCustomerResult<T> = ({ ok: true } & T) | { ok: false; error: BcCustomerErrorCode };

export function sanitizeCustomerText(raw: string | null | undefined, max: number): string | null {
  if (!raw) return null;
  // eslint-disable-next-line no-control-regex
  const cleaned = raw
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
  return cleaned ? cleaned.slice(0, max) : null;
}

export function personIdFromCustomerRow(row: {
  target_kind: string;
  target_user_id: string | null;
  target_card_id: string | null;
  target_guest_id: string | null;
}): string {
  if (row.target_kind === "connection") return `u:${row.target_user_id}`;
  if (row.target_kind === "guest_contact") return `g:${row.target_guest_id}`;
  return `c:${row.target_card_id}`;
}

/** Ngày quá hạn chăm sóc (dùng cho cảnh báo "cần liên hệ lại"). */
export function isCustomerOverdue(customer: BcCustomer, nowMs: number = Date.now()): boolean {
  if (customer.stage === "inactive") return false;
  if (customer.nextActionAt) return Date.parse(customer.nextActionAt) < nowMs;
  const last = customer.lastContactAt ?? customer.createdAt;
  const ms = Date.parse(last);
  return Number.isFinite(ms) && nowMs - ms > 30 * 24 * 60 * 60_000;
}

// ── Điểm đau & nhu cầu khách hàng ───────────────────────────────────────────

export const CUSTOMER_NEED_KINDS = ["pain", "need"] as const;
export const CUSTOMER_NEED_PRIORITIES = ["low", "medium", "high"] as const;
export const CUSTOMER_NEED_MAX_BODY_LEN = 500;
export const CUSTOMER_MAX_NEEDS_PER_CUSTOMER = 30;

export type BcCustomerNeedKind = (typeof CUSTOMER_NEED_KINDS)[number];
export type BcCustomerNeedPriority = (typeof CUSTOMER_NEED_PRIORITIES)[number];

export type BcCustomerNeed = {
  id: string;
  customerId: string;
  kind: BcCustomerNeedKind;
  body: string;
  priority: BcCustomerNeedPriority;
  status: "open" | "resolved";
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Nguồn dữ liệu dùng để sinh gợi ý nhãn. */
export type BcCustomerTagSuggestSources = {
  note: boolean;
  logs: boolean;
  needs: boolean;
};

/** Một lần hệ thống gợi ý nhãn (lưu lại để chủ tài khoản xem lại). */
export type BcCustomerTagSuggestionRun = {
  id: string;
  customerId: string;
  createdAt: string;
  suggestions: { name: string; reason: string; confidence?: number }[];
};

/** Phản hồi Đúng/Sai của chủ tài khoản cho một nhãn được gợi ý. */
export type BcCustomerTagSuggestionFeedback = {
  tagName: string;
  verdict: "good" | "bad";
};
