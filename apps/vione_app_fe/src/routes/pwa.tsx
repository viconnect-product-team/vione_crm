import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/pwa")({
  head: () => ({
    meta: [
      { title: "Cài đặt PWA ViOne Connect — Chạy Mượt Mà Như Ứng Dụng Gốc" },
    ],
  }),
  component: PwaRedirectPage,
});

function PwaRedirectPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos =
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);

    if (isIos) {
      void navigate({ to: "/ios" });
    } else {
      void navigate({ to: "/install" });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#07090E] flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D8B282] border-t-transparent" />
        <p className="text-xs text-[#F3E5AB]">Đang chuyển hướng đến trang cài đặt ViOne PWA...</p>
      </div>
    </div>
  );
}
