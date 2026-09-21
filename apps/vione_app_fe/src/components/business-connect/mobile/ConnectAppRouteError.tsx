// Ranh giới lỗi cấp /connect-app: giữ nguyên khung app (bottom nav), hiển thị
// thông báo tiếng Việt và cho phép thử lại tại chỗ thay vì màn lỗi trắng.
import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export function ConnectAppRouteError({
  error,
  reset,
}: {
  error: unknown;
  reset: () => void;
}) {
  const t = useT();
  useEffect(() => {
    // Ghi log chi tiết để chẩn đoán (thông báo mặc định không nêu nguyên nhân).
    console.error("[connect-app] route error", error);
    const msg = error instanceof Error ? error.message : String(error ?? "");
    if (msg.includes("Unauthorized") || msg.includes("Invalid local token")) {
      if (typeof window !== "undefined") {
        localStorage.removeItem('vibe_token');
        localStorage.removeItem('vibe_refresh_token');
        document.cookie = `sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        document.cookie = `sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        window.location.href = `/auth?reason=expired&redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }
    }
  }, [error]);

  const message = error instanceof Error ? error.message : String(error ?? "");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" aria-hidden />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-foreground">{t("bc.mobile.routeError.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("bc.mobile.routeError.description")}
        </p>
        {message ? (
          <p className="pt-1 text-xs text-muted-foreground/70 break-words">{message}</p>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button onClick={reset} className="gap-2">
          <RotateCcw className="size-4" aria-hidden />
          {t("bc.mobile.routeError.retry")}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (typeof window !== "undefined") window.location.reload();
          }}
        >
          {t("bc.mobile.routeError.reload")}
        </Button>
      </div>
    </div>
  );
}
