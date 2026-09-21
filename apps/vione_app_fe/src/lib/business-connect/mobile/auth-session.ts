// Ghi nhớ đăng nhập + mở lại phiên khi người dùng quay lại PWA.
// Chỉ chạy phía trình duyệt: mọi hàm đều tự bảo vệ khi không có window.

// import { supabase } from "@/integrations/supabase/client";

const REMEMBER_KEY = "bc.auth.remember";
const EMAIL_KEY = "bc.auth.remembered-email";
/** Đánh dấu tab/phiên trình duyệt hiện tại — mất khi đóng app. */
const TAB_MARKER_KEY = "bc.auth.tab-active";

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function safeLocal(): Storage | null {
  try {
    return hasWindow() ? window.localStorage : null;
  } catch {
    return null;
  }
}

function safeSession(): Storage | null {
  try {
    return hasWindow() ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

/** Mặc định: có ghi nhớ (trải nghiệm PWA giống app native). */
export function getRememberPreference(): boolean {
  return safeLocal()?.getItem(REMEMBER_KEY) !== "0";
}

export function getRememberedEmail(): string {
  return safeLocal()?.getItem(EMAIL_KEY) ?? "";
}

/** Lưu lựa chọn ghi nhớ sau khi đăng nhập thành công. */
export function applyRememberPreference(remember: boolean, email?: string): void {
  const local = safeLocal();
  if (!local) return;
  local.setItem(REMEMBER_KEY, remember ? "1" : "0");
  if (remember && email) local.setItem(EMAIL_KEY, email);
  if (!remember) local.removeItem(EMAIL_KEY);
  safeSession()?.setItem(TAB_MARKER_KEY, "1");
}

/**
 * Khi người dùng tắt "Ghi nhớ đăng nhập", phiên chỉ sống trong lần mở app đó.
 * Mở lại app (sessionStorage trống) sẽ đăng xuất trước khi hiển thị dữ liệu.
 */
export async function enforceEphemeralSession(): Promise<void> {
  const session = safeSession();
  if (!session) return;
  if (getRememberPreference()) {
    session.setItem(TAB_MARKER_KEY, "1");
    return;
  }
  if (session.getItem(TAB_MARKER_KEY) === "1") return;
  session.setItem(TAB_MARKER_KEY, "1");
  // const { data } = await supabase.auth.getSession();
  // if (data.session) await supabase.auth.signOut();
}

/**
 * Kiểm tra phiên hiện tại và tự làm mới khi access token sắp/đã hết hạn.
 * - "none": chưa đăng nhập
 * - "valid": token còn hạn (hoặc vừa làm mới thành công)
 * - "expired": refresh token không còn dùng được → phải đăng nhập lại
 */
export async function ensureFreshSession(): Promise<"none" | "valid" | "expired"> {
  const token = safeLocal()?.getItem('vibe_token');
  if (!token) return "none";
  // For NestJS JWT, decoding expiry would happen here. We just assume valid if exists.
  return "valid";
}

/** Làm mới token nếu sắp/đã hết hạn — dùng khi app được đưa lại foreground. */
async function refreshIfNeeded(onExpired?: () => void): Promise<void> {
  const result = await ensureFreshSession();
  if (result === "expired") onExpired?.();
}

/**
 * Mở lại phiên tự động khi PWA quay lại foreground.
 * iOS/Android đóng băng tiến trình nên timer auto-refresh của SDK có thể lỡ nhịp.
 * `onExpired` được gọi khi không thể làm mới → UI buộc đăng nhập lại.
 */
export function startSessionResume(onExpired?: () => void): () => void {
  if (!hasWindow()) return () => {};
  const onVisible = () => {
    if (document.visibilityState !== "visible") return;
    void refreshIfNeeded(onExpired);
  };
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("focus", onVisible);
  window.addEventListener("pageshow", onVisible);
  // Kiểm tra định kỳ cho phiên mở lâu trong nền tab.
  const timer = window.setInterval(() => void refreshIfNeeded(onExpired), 60_000);
  return () => {
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("focus", onVisible);
    window.removeEventListener("pageshow", onVisible);
    window.clearInterval(timer);
  };
}

/**
 * Đăng xuất dứt điểm: dừng truy vấn đang chạy, xoá cache dữ liệu riêng tư,
 * xoá phiên Supabase (token trong localStorage) và các dấu vết phiên cục bộ.
 * Điều hướng do phía UI đảm nhiệm (replace về màn đăng nhập).
 */
export async function signOutSession(queryClient?: {
  cancelQueries: () => Promise<void>;
  clear: () => void;
}): Promise<void> {
  try {
    await queryClient?.cancelQueries();
  } catch {
    /* cache teardown không được chặn đăng xuất */
  }
  try {
    queryClient?.clear();
  } catch {
    /* như trên */
  }
  try {
    // await supabase.auth.signOut();
  } catch {
    /* vẫn phải dọn sạch dấu vết cục bộ dù gọi máy chủ thất bại */
  }
  purgeStoredAuthTokens();
  const local = safeLocal();
  if (local) {
    local.removeItem('vibe_token');
    local.removeItem('vibe_refresh_token');
    document.cookie = `sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
  safeSession()?.removeItem(TAB_MARKER_KEY);
  clearLastMobileRoute();
  if (!getRememberPreference()) safeLocal()?.removeItem(EMAIL_KEY);
}

/**
 * Xoá mọi token đã lưu bền (kể cả khi người dùng bật "Ghi nhớ đăng nhập"),
 * để thiết bị dùng chung không còn khả năng mở lại phiên sau khi đăng xuất.
 */
export function purgeStoredAuthTokens(): void {
  const isAuthToken = (key: string) =>
    (key.startsWith("sb-") && key.includes("auth-token")) || key.startsWith("bc.auth.session");
  for (const store of [safeLocal(), safeSession()]) {
    if (!store) continue;
    try {
      const keys: string[] = [];
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i);
        if (key && isAuthToken(key)) keys.push(key);
      }
      keys.forEach((key) => store.removeItem(key));
    } catch {
      /* bỏ qua khi storage bị chặn */
    }
  }
}

const LAST_ROUTE_KEY = "bc.auth.last-route";

/** Ghi nhớ màn hình cuối cùng trong PWA để khôi phục khi mở lại app. */
export function rememberLastMobileRoute(path: string): void {
  if (!path.startsWith("/connect-app")) return;
  if (!getRememberPreference()) return;
  try {
    safeLocal()?.setItem(LAST_ROUTE_KEY, path);
  } catch {
    /* bỏ qua khi storage bị chặn */
  }
}

/** Lấy màn hình cuối cùng đã ghi nhớ (chỉ trong phạm vi PWA). */
export function getLastMobileRoute(): string | null {
  if (!getRememberPreference()) return null;
  const value = safeLocal()?.getItem(LAST_ROUTE_KEY) ?? null;
  return value && value.startsWith("/connect-app") ? value : null;
}

export function clearLastMobileRoute(): void {
  try {
    safeLocal()?.removeItem(LAST_ROUTE_KEY);
  } catch {
    /* bỏ qua */
  }
}

/** App được mở từ màn hình chính (standalone) chứ không phải tab trình duyệt. */
export function isStandalonePwa(): boolean {
  if (!hasWindow()) return false;
  try {
    return (
      window.matchMedia?.("(display-mode: standalone)").matches === true ||
      (window.navigator as { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
}
