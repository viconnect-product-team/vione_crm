import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "ViOne Connect App — Nền Tảng Doanh Nghiệp Việt Nam" },
    ],
  }),
  component: AppRedirectPage,
});

function AppRedirectPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    void navigate({ to: "/connect-app" });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#07090E] flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D8B282] border-t-transparent" />
        <p className="text-xs text-[#F3E5AB]">Đang mở ứng dụng ViOne Connect...</p>
      </div>
    </div>
  );
}
