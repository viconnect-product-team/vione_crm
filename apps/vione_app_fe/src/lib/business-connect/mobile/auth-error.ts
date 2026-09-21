// Phân loại lỗi đăng nhập để hiển thị thông báo + hành động phù hợp.
// Không phụ thuộc React: chỉ trả về khoá i18n để UI dịch.

export type AuthErrorKind =
  | "network" // mất mạng / máy chủ không phản hồi
  | "denied" // người dùng huỷ hoặc từ chối cấp quyền
  | "callback" // quay lại từ nhà cung cấp nhưng phiên không hợp lệ
  | "credentials" // sai email/mật khẩu
  | "unconfirmed" // chưa xác nhận email
  | "rateLimit" // thử quá nhiều lần
  | "unknown";

export type AuthErrorInfo = {
  kind: AuthErrorKind;
  /** Khoá i18n cho nội dung hiển thị. */
  messageKey: string;
  /** Khoá i18n cho gợi ý xử lý (có thể bỏ trống). */
  hintKey?: string;
  /** Cho phép hiển thị nút thử lại. */
  retryable: boolean;
  /** Khoá i18n cho nhãn CTA phụ (quên mật khẩu / gửi lại xác nhận). */
  secondaryKey?: string;
  secondaryAction?: "forgotPassword" | "resendConfirm";
  /** Thông điệp gốc từ máy chủ (chỉ dùng để ghi log, không bắt buộc hiển thị). */
  raw?: string;
};

function messageOf(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const m = (error as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "";
}

function statusOf(error: unknown): number | undefined {
  if (error && typeof error === "object" && "status" in error) {
    const s = (error as { status?: unknown }).status;
    if (typeof s === "number") return s;
  }
  return undefined;
}

/** Trình duyệt đang offline → luôn coi là lỗi mạng. */
function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export function classifyAuthError(
  error: unknown,
  context: { provider?: "google" | "apple" | "password" } = {},
): AuthErrorInfo {
  const raw = messageOf(error);
  const text = raw.toLowerCase();
  const status = statusOf(error);

  if (
    isOffline() ||
    text.includes("failed to fetch") ||
    text.includes("networkerror") ||
    text.includes("network request failed") ||
    text.includes("timeout") ||
    text.includes("timed out") ||
    status === 0 ||
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return {
      kind: "network",
      messageKey: "bc.mobile.auth.err.network",
      hintKey: "bc.mobile.auth.err.networkHint",
      retryable: true,
      raw,
    };
  }

  if (
    text.includes("access_denied") ||
    text.includes("denied") ||
    text.includes("cancel") ||
    text.includes("closed by user") ||
    text.includes("popup closed") ||
    text.includes("popup_blocked") ||
    text.includes("user aborted")
  ) {
    return {
      kind: "denied",
      messageKey: "bc.mobile.auth.err.denied",
      hintKey: "bc.mobile.auth.err.deniedHint",
      retryable: true,
      raw,
    };
  }

  if (
    text.includes("invalid state") ||
    text.includes("state mismatch") ||
    text.includes("code verifier") ||
    text.includes("pkce") ||
    text.includes("invalid_grant") ||
    text.includes("callback") ||
    text.includes("redirect_uri") ||
    text.includes("no session") ||
    text.includes("exchange")
  ) {
    return {
      kind: "callback",
      messageKey: "bc.mobile.auth.err.callback",
      hintKey: "bc.mobile.auth.err.callbackHint",
      retryable: true,
      raw,
    };
  }

  if (text.includes("email not confirmed") || text.includes("not confirmed")) {
    return {
      kind: "unconfirmed",
      messageKey: "bc.mobile.auth.err.unconfirmed",
      retryable: false,
      raw,
    };
  }

  if (status === 429 || text.includes("rate limit") || text.includes("too many")) {
    return {
      kind: "rateLimit",
      messageKey: "bc.mobile.auth.err.rateLimit",
      hintKey: "bc.mobile.auth.err.rateLimitHint",
      retryable: false,
      raw,
    };
  }

  if (
    context.provider === "password" &&
    (status === 400 ||
      text.includes("invalid login") ||
      text.includes("invalid credentials") ||
      text.includes("invalid email or password"))
  ) {
    return {
      kind: "credentials",
      messageKey: "bc.mobile.auth.err.credentials",
      retryable: false,
      secondaryKey: "bc.mobile.auth.forgot",
      secondaryAction: "forgotPassword",
      raw,
    };
  }

  return {
    kind: "unknown",
    messageKey:
      context.provider === "google"
        ? "bc.mobile.auth.googleError"
        : context.provider === "apple"
          ? "bc.mobile.auth.appleError"
          : "auth.genericError",
    retryable: true,
    raw,
  };
}
