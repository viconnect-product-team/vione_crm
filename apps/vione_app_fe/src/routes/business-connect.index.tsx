import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { WorkHubPage } from "@/components/business-connect/work-hub/WorkHubPage";
import { BusinessConnectLanding } from "@/components/landing/BusinessConnectLanding";
import { BusinessConnectLandingV2 } from "@/components/landing/BusinessConnectLandingV2";
import { BusinessConnectLandingV3 } from "@/components/landing/BusinessConnectLandingV3";
import { BusinessConnectLandingV4 } from "@/components/landing/BusinessConnectLandingV4";
import { BusinessConnectLandingV5 } from "@/components/landing/BusinessConnectLandingV5";
import { BusinessConnectLandingV6 } from "@/components/landing/BusinessConnectLandingV6";
import { BusinessConnectLandingV7 } from "@/components/landing/BusinessConnectLandingV7";
import { AppShell } from "@/components/dashboard/AppShell";
import { Sparkles, LayoutDashboard } from "lucide-react";

export const Route = createFileRoute("/business-connect/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Business Connect — Hệ Điều Hành Kết Nối Kinh Doanh & Hiệp Hội" },
      {
        name: "description",
        content:
          "Nền tảng hợp nhất quản lý hội viên 360°, kết nối giao thương B2B, sự kiện thông minh và AI Copilot.",
      },
    ],
  }),
  component: BusinessConnectHubPage,
});

function BusinessConnectHubPage() {
  const [selectedVersion, setSelectedVersion] = useState<"v1" | "v2" | "v3" | "v4" | "v5" | "v6" | "v7" | "workhub">("v2");

  return (
    <div className="relative min-h-screen bg-[#02040A]">
      {/* Switcher bar at top */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-[#D8B282]/30 bg-[#02040A]/95 px-4 sm:px-6 py-2.5 backdrop-blur-xl flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#F6E1C3]">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Business Connect • VIONE Platform</span>
        </div>

        {/* 7 Version Switcher & Work Hub Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-medium text-slate-400 mr-1 hidden sm:inline">7 Mẫu Giao Diện:</span>
          
          {/* V1 Thành Phố */}
          <button
            type="button"
            onClick={() => setSelectedVersion("v1")}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
              selectedVersion === "v1"
                ? "bg-gradient-to-r from-[#F6E1C3] via-[#D8B282] to-[#8C653B] text-slate-950 shadow-md ring-2 ring-[#D8B282]/50"
                : "text-slate-400 hover:text-white border border-white/10"
            }`}
          >
            <span>v1 Thành Phố</span>
          </button>

          {/* V2 Cổ Tích Phép Thuật */}
          <button
            type="button"
            onClick={() => setSelectedVersion("v2")}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
              selectedVersion === "v2"
                ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-emerald-950 shadow-md ring-2 ring-emerald-300"
                : "text-slate-400 hover:text-emerald-300 border border-emerald-500/30"
            }`}
          >
            <span>v2 Cổ Tích</span>
          </button>

          {/* V3 Comic Pop Art */}
          <button
            type="button"
            onClick={() => setSelectedVersion("v3")}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
              selectedVersion === "v3"
                ? "bg-[#FFE600] text-black shadow-[2px_2px_0px_#000] border-2 border-black font-black"
                : "text-slate-400 hover:text-[#FFE600] border border-yellow-500/40"
            }`}
          >
            <span>v3 Comic</span>
          </button>

          {/* V4 Mưa & Kính */}
          <button
            type="button"
            onClick={() => setSelectedVersion("v4")}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
              selectedVersion === "v4"
                ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-md ring-2 ring-cyan-400/50 backdrop-blur-md"
                : "text-slate-400 hover:text-cyan-400 border border-cyan-900/40"
            }`}
          >
            <span>v4 Mưa Kính</span>
          </button>

          {/* V5 Deep Tech */}
          <button
            type="button"
            onClick={() => setSelectedVersion("v5")}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
              selectedVersion === "v5"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-md ring-2 ring-orange-400/50"
                : "text-slate-400 hover:text-orange-400 border border-orange-900/40"
            }`}
          >
            <span>v5 Deep Tech</span>
          </button>

          {/* V6 Kim Tự Tháp */}
          <button
            type="button"
            onClick={() => setSelectedVersion("v6")}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
              selectedVersion === "v6"
                ? "bg-gradient-to-r from-[#D4AF37] via-[#C59B27] to-[#8C653B] text-slate-950 shadow-md ring-2 ring-[#D4AF37]/50"
                : "text-slate-400 hover:text-[#D4AF37] border border-[#D4AF37]/30"
            }`}
          >
            <span>v6 Kim Tự Tháp</span>
          </button>

          {/* V7 Bong Bóng Bay */}
          <button
            type="button"
            onClick={() => setSelectedVersion("v7")}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
              selectedVersion === "v7"
                ? "bg-gradient-to-r from-sky-400 via-pink-400 to-amber-300 text-slate-950 shadow-md ring-2 ring-pink-400/50"
                : "text-slate-400 hover:text-pink-300 border border-pink-500/30"
            }`}
          >
            <span>v7 Bong Bóng</span>
          </button>

          <span className="w-px h-4 bg-white/20 mx-1 hidden sm:inline" />

          {/* Work Hub */}
          <button
            type="button"
            onClick={() => setSelectedVersion("workhub")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold transition-all cursor-pointer ${
              selectedVersion === "workhub"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-slate-400 hover:text-white border border-white/10"
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Bàn làm việc Work Hub</span>
          </button>
        </div>
      </div>

      {/* Render Selected View */}
      {selectedVersion === "v1" && (
        <div className="w-full overflow-x-hidden">
          <BusinessConnectLanding />
        </div>
      )}

      {selectedVersion === "v2" && (
        <div className="w-full overflow-x-hidden">
          <BusinessConnectLandingV2 />
        </div>
      )}

      {selectedVersion === "v3" && (
        <div className="w-full overflow-x-hidden">
          <BusinessConnectLandingV3 />
        </div>
      )}

      {selectedVersion === "v4" && (
        <div className="w-full overflow-x-hidden">
          <BusinessConnectLandingV4 />
        </div>
      )}

      {selectedVersion === "v5" && (
        <div className="w-full overflow-x-hidden">
          <BusinessConnectLandingV5 />
        </div>
      )}

      {selectedVersion === "v6" && (
        <div className="w-full overflow-x-hidden">
          <BusinessConnectLandingV6 />
        </div>
      )}

      {selectedVersion === "v7" && (
        <div className="w-full overflow-x-hidden">
          <BusinessConnectLandingV7 />
        </div>
      )}

      {selectedVersion === "workhub" && (
        <AppShell>
          <div className="max-w-6xl mx-auto px-4 py-6">
            <WorkHubPage />
          </div>
        </AppShell>
      )}
    </div>
  );
}
