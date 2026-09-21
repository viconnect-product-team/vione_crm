import React from "react";
import { ArrowRight, ShieldCheck, CheckCircle2, Building2, Users, Award, ExternalLink, Sparkles, Globe2 } from "lucide-react";
import type { ThemeMode } from "./templates/LandingHero";

export interface BusinessConnectPartnersSectionProps {
  themeMode?: ThemeMode;
  onOpenDemo?: () => void;
}

export function BusinessConnectPartnersSection({
  themeMode = "dark",
  onOpenDemo,
}: BusinessConnectPartnersSectionProps) {
  const isDark = themeMode === "dark";
  const isContrast = themeMode === "contrast";

  const themeClass = (darkClass: string, lightClass: string, contrastClass?: string) => {
    if (isContrast && contrastClass) return contrastClass;
    if (isDark || isContrast) return darkClass;
    return lightClass;
  };

  return (
    <section
      id="partners"
      className={`py-24 sm:py-32 relative z-10 border-t transition-colors duration-500 overflow-hidden ${themeClass(
        "border-[#D8B282]/30",
        "border-[#D8B282]/30",
        "border-yellow-400/30"
      )}`}
    >


      {/* Ambient Radial Golden Aura */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            themeMode === "light"
              ? "radial-gradient(ellipse at center, rgba(254,243,199,0.3) 0%, transparent 75%)"
              : "radial-gradient(ellipse at center, rgba(245,158,11,0.15) 0%, transparent 75%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        {/* HEADER MATCHING EXACT USER REFERENCE IMAGE 1 */}
        <div
          className={`flex flex-col md:flex-row md:items-end justify-between pb-8 border-b gap-6 ${themeClass(
            "border-white/[0.12]",
            "border-slate-300",
            "border-white/20"
          )}`}
        >
          <div className="text-left space-y-2.5">
            <div
              className={`text-[11px] sm:text-xs font-black tracking-[0.25em] uppercase font-mono ${themeClass(
                "text-[#D8B282]",
                "text-[#78350F]",
                "text-yellow-300"
              )}`}
            >
              ĐƯỢC TIN TƯỞNG BỞI CÁC HIỆP HỘI VÀ DOANH NGHIỆP
            </div>
            <h2
              className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight ${themeClass(
                "text-white",
                "text-slate-950",
                "text-white"
              )}`}
              style={{ fontFamily: "'Be Vietnam Pro', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
            >
              Những tổ chức tiên phong đã lựa chọn
            </h2>
          </div>

          <div>
            <button
              type="button"
              onClick={onOpenDemo}
              className={`inline-flex items-center gap-2 text-xs sm:text-sm font-bold transition-all group cursor-pointer ${themeClass(
                "text-[#F6E1C3] hover:text-white",
                "text-amber-900 hover:text-amber-950 font-black",
                "text-yellow-300 hover:text-white"
              )}`}
            >
              <span>Xem tất cả khách hàng</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* HORIZONTAL LOGOS STRIP MATCHING EXACTLY IMAGE 1 */}
        <div
          className={`p-6 sm:p-8 rounded-3xl border-2 backdrop-blur-2xl shadow-2xl transition-all ${themeClass(
            "border-[#D8B282]/40 bg-gradient-to-r from-[#070D1F]/90 via-[#040814]/90 to-[#070D1F]/90 shadow-[0_20px_50px_rgba(0,0,0,0.85)]",
            "border-[#D8B282]/50 bg-gradient-to-r from-white/95 via-[#FFFDF9]/95 to-[#FBF5EC]/95 shadow-xl",
            "border-yellow-400 bg-black text-yellow-300"
          )}`}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-6 sm:gap-8 items-center justify-items-center text-center">
            {/* 1. VCCI */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer w-full">
              <div className="h-12 flex items-center justify-center">
                <div className="flex items-center gap-1">
                  <span className={`text-2xl sm:text-3xl font-black font-sans tracking-tighter transition-colors ${themeClass(
                    "text-white group-hover:text-[#F6E1C3]",
                    "text-slate-900 group-hover:text-amber-700",
                    "text-yellow-300"
                  )}`}>
                    V
                  </span>
                  <div className="relative flex items-center justify-center">
                    <span className={`text-2xl sm:text-3xl font-black font-sans tracking-tighter transition-colors ${themeClass(
                      "text-white group-hover:text-[#F6E1C3]",
                      "text-slate-900 group-hover:text-amber-700",
                      "text-yellow-300"
                    )}`}>
                      C
                    </span>
                    <span className="absolute w-2 h-2 rounded-full border border-amber-400 bg-amber-400/30" />
                  </div>
                  <span className={`text-2xl sm:text-3xl font-black font-sans tracking-tighter transition-colors ${themeClass(
                    "text-white group-hover:text-[#F6E1C3]",
                    "text-slate-900 group-hover:text-amber-700",
                    "text-yellow-300"
                  )}`}>
                    CI
                  </span>
                </div>
              </div>
              <span className={`text-[9.5px] font-mono tracking-wider uppercase font-semibold mt-1 ${themeClass("text-slate-400", "text-slate-600", "text-yellow-200")}`}>
                VIETNAM CHAMBER
              </span>
            </div>

            {/* 2. AmCham VIETNAM */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer w-full">
              <div className="h-12 flex items-center justify-center gap-2.5">
                <div className="w-8 h-8 rounded-full border-2 border-[#D8B282] p-0.5 flex flex-col justify-center gap-0.5 overflow-hidden shrink-0 group-hover:border-amber-300 transition-colors">
                  <div className={`w-full h-0.5 ${themeClass("bg-white/90", "bg-slate-700", "bg-yellow-200")}`} />
                  <div className="w-full h-0.5 bg-[#D8B282]" />
                  <div className={`w-full h-0.5 ${themeClass("bg-white/90", "bg-slate-700", "bg-yellow-200")}`} />
                  <div className="w-full h-0.5 bg-[#D8B282]" />
                </div>
                <div className="text-left">
                  <div className={`text-sm font-black font-sans tracking-tight leading-none ${themeClass(
                    "text-white group-hover:text-[#F6E1C3]",
                    "text-slate-900 group-hover:text-amber-700",
                    "text-yellow-300"
                  )}`}>
                    AmCham
                  </div>
                  <div className="text-[9px] font-bold tracking-widest text-[#D8B282] uppercase mt-0.5">
                    VIETNAM
                  </div>
                </div>
              </div>
              <span className={`text-[9.5px] font-mono tracking-wider uppercase font-semibold mt-1 ${themeClass("text-slate-400", "text-slate-600", "text-yellow-200")}`}>
                HOA KỲ
              </span>
            </div>

            {/* 3. EUROCHAM */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer w-full">
              <div className="h-12 flex items-center justify-center gap-2">
                <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
                  <span className="absolute -top-0.5 text-[8px] text-amber-500">★</span>
                  <span className="absolute -bottom-0.5 text-[8px] text-amber-500">★</span>
                  <span className="absolute -left-0.5 text-[8px] text-amber-500">★</span>
                  <span className="absolute -right-0.5 text-[8px] text-amber-500">★</span>
                  <span className="w-3.5 h-3.5 rounded-full border border-amber-500/60" />
                </div>
                <div className="text-left">
                  <div className={`text-xs sm:text-sm font-black font-sans tracking-tight leading-none ${themeClass(
                    "text-white group-hover:text-[#F6E1C3]",
                    "text-slate-900 group-hover:text-amber-700",
                    "text-yellow-300"
                  )}`}>
                    EUROCHAM
                  </div>
                  <div className={`text-[8px] font-medium uppercase mt-0.5 line-clamp-1 ${themeClass("text-slate-300", "text-slate-600", "text-yellow-200")}`}>
                    European Chamber
                  </div>
                </div>
              </div>
              <span className={`text-[9.5px] font-mono tracking-wider uppercase font-semibold mt-1 ${themeClass("text-slate-400", "text-slate-600", "text-yellow-200")}`}>
                CHÂU ÂU
              </span>
            </div>

            {/* 4. KOCHAM */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer w-full">
              <div className="h-12 flex items-center justify-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0284C7] to-[#E11D48] p-0.5 flex items-center justify-center shrink-0">
                  <div className={`w-full h-full rounded-full flex items-center justify-center ${themeClass("bg-[#050814]", "bg-white", "bg-black")}`}>
                    <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#E11D48] to-[#0284C7]" />
                  </div>
                </div>
                <div className="text-left">
                  <div className={`text-sm font-black font-sans tracking-tight leading-none ${themeClass(
                    "text-white group-hover:text-[#F6E1C3]",
                    "text-slate-900 group-hover:text-amber-700",
                    "text-yellow-300"
                  )}`}>
                    KOCHAM
                  </div>
                  <div className="text-[8px] font-medium text-[#D8B282] uppercase mt-0.5">
                    Korean Chamber
                  </div>
                </div>
              </div>
              <span className={`text-[9.5px] font-mono tracking-wider uppercase font-semibold mt-1 ${themeClass("text-slate-400", "text-slate-600", "text-yellow-200")}`}>
                HÀN QUỐC
              </span>
            </div>

            {/* 5. SINGAPORE BUSINESS FEDERATION */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer w-full">
              <div className="h-12 flex items-center justify-center gap-2">
                <div className="w-6 h-8 flex flex-col justify-center items-center shrink-0">
                  <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-[#E11D48] via-amber-400 to-[#F6E1C3] transform -rotate-12" />
                </div>
                <div className="text-left">
                  <div className={`text-xs font-black font-sans tracking-tight leading-none ${themeClass(
                    "text-white group-hover:text-[#F6E1C3]",
                    "text-slate-900 group-hover:text-amber-700",
                    "text-yellow-300"
                  )}`}>
                    SINGAPORE
                  </div>
                  <div className={`text-[8px] font-bold uppercase mt-0.5 ${themeClass("text-slate-300", "text-slate-600", "text-yellow-200")}`}>
                    BUSINESS FEDERATION
                  </div>
                </div>
              </div>
              <span className={`text-[9.5px] font-mono tracking-wider uppercase font-semibold mt-1 ${themeClass("text-slate-400", "text-slate-600", "text-yellow-200")}`}>
                SINGAPORE (SBF)
              </span>
            </div>

            {/* 6. AUSCHAM VIETNAM */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer w-full">
              <div className="h-12 flex items-center justify-center gap-2">
                <div className="w-7 h-7 rounded-full border-2 border-amber-500/80 flex items-center justify-center shrink-0">
                  <span className={`w-3.5 h-2 border-b-2 border-r-2 transform rotate-45 ${themeClass("border-white", "border-slate-800", "border-yellow-300")}`} />
                </div>
                <div className="text-left">
                  <div className={`text-xs sm:text-sm font-black font-sans tracking-tight leading-none ${themeClass(
                    "text-white group-hover:text-[#F6E1C3]",
                    "text-slate-900 group-hover:text-amber-700",
                    "text-yellow-300"
                  )}`}>
                    AUSCHAM
                  </div>
                  <div className="text-[8px] font-bold text-[#D8B282] uppercase mt-0.5">
                    VIETNAM
                  </div>
                </div>
              </div>
              <span className={`text-[9.5px] font-mono tracking-wider uppercase font-semibold mt-1 ${themeClass("text-slate-400", "text-slate-600", "text-yellow-200")}`}>
                AUSTRALIA
              </span>
            </div>

            {/* 7. VÀ NHIỀU TỔ CHỨC KHÁC */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-1 flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer w-full">
              <div className="h-12 flex items-center justify-center">
                <span className={`text-xs sm:text-sm font-bold transition-colors underline decoration-[#D8B282]/50 underline-offset-4 ${themeClass(
                  "text-[#F6E1C3] group-hover:text-white",
                  "text-amber-800 group-hover:text-amber-950",
                  "text-yellow-300 group-hover:text-yellow-100"
                )}`}>
                  và nhiều tổ chức khác
                </span>
              </div>
              <span className={`text-[9.5px] font-mono tracking-wider uppercase font-semibold mt-1 ${themeClass("text-amber-400", "text-amber-700", "text-yellow-300")}`}>
                300+ HIỆP HỘI
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
