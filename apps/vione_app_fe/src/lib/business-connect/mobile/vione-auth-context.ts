const VIONE_CONTEXT_KEY = "bc.vione-app.context";

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Ghi nhớ thiết bị đã mở luồng ViOne App, độc lập với manifest đang được giữ. */
export function rememberVioneAppContext(): void {
  browserStorage()?.setItem(VIONE_CONTEXT_KEY, "1");
}

export function hasRememberedVioneAppContext(): boolean {
  return browserStorage()?.getItem(VIONE_CONTEXT_KEY) === "1";
}

export function isVioneStandaloneContext(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.matchMedia?.("(display-mode: standalone)").matches === true ||
      window.matchMedia?.("(display-mode: fullscreen)").matches === true ||
      window.matchMedia?.("(display-mode: minimal-ui)").matches === true ||
      (window.navigator as { standalone?: boolean }).standalone === true ||
      document.referrer.startsWith("android-app://")
    );
  } catch {
    return false;
  }
}

export function isConnectAppDestination(path: string): boolean {
  return path === "/connect-app" || path.startsWith("/connect-app/");
}

type VioneAuthSignals = {
  mobileParam: boolean;
  redirectPath: string;
  directAuth: boolean;
  remembered: boolean;
  standalone: boolean;
};

/** Quyết định giao diện đăng nhập mà không dựa vào manifest của trình duyệt.
 *
 * KHÔNG dùng `directAuth` trong điều kiện OR chung: signal này (`!redirectTo`)
 * bật true khi mở /auth trực tiếp (refresh, bookmark) mà không có redirect param,
 * khiến người dùng Dashboard bị đẩy sang màn ViOne ConnectApp sai.
 * directAuth chỉ có ý nghĩa khi standalone hoặc remembered — hai signal kia đã đủ.
 */
export function shouldUseVioneAuth(signals: VioneAuthSignals): boolean {
  if (typeof window !== "undefined") {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);
    if (!isMobile) return false;
  }
  return (
    signals.mobileParam ||
    signals.remembered ||
    signals.standalone ||
    isConnectAppDestination(signals.redirectPath)
  );
}

/** Trong ngữ cảnh ViOne, không để start_url cũ đưa người dùng trở lại `/m`. */
export function resolveVionePostLoginPath(
  redirectPath: string | null,
  useVioneAuth: boolean,
): string | null {
  if (useVioneAuth && !isConnectAppDestination(redirectPath ?? "")) return "/connect-app";
  return redirectPath;
}
