import React from "react";
import { Database, Users, TrendingDown, Contact2, BarChart2, Clock, HeartHandshake, EyeOff, Search } from "lucide-react";
import type { ThemeMode } from "./LandingHero";

export interface ChallengeItem {
  id: string;
  number: string;
  title: string;
  desc: string;
  icon?: React.ReactNode;
}

export interface LandingChallengesProps {
  tag: string;
  title: string;
  items: ChallengeItem[];
  themeMode?: ThemeMode;
}

export function LandingChallenges({ tag, title, items, themeMode = "dark" }: LandingChallengesProps) {
  const isDark = themeMode === "dark";
  const isContrast = themeMode === "contrast";

  const themeClass = (darkClass: string, lightClass: string, contrastClass?: string) => {
    if (isContrast && contrastClass) return contrastClass;
    if (isDark || isContrast) return darkClass;
    return lightClass;
  };

  const defaultIcons = [
    <Search className={`w-5 h-5 ${themeClass("text-[#E8C986]", "text-amber-700", "text-amber-300")}`} />,
    <Clock className={`w-5 h-5 ${themeClass("text-[#E8C986]", "text-amber-700", "text-amber-300")}`} />,
    <TrendingDown className={`w-5 h-5 ${themeClass("text-[#E8C986]", "text-amber-700", "text-amber-300")}`} />,
    <HeartHandshake className={`w-5 h-5 ${themeClass("text-[#E8C986]", "text-amber-700", "text-amber-300")}`} />,
    <EyeOff className={`w-5 h-5 ${themeClass("text-[#E8C986]", "text-amber-700", "text-amber-300")}`} />,
  ];

  return (
    <section
      id="challenges"
      className={`py-24 md:py-32 relative overflow-hidden transition-colors duration-500 ${
        themeClass("bg-[#05070E]", "bg-[#F8FAFC]", "bg-black")
      }`}
    >
      {/* Top & Bottom Golden Laser Dividers */}
      <div
        className={`absolute top-0 left-0 right-0 h-[1px] ${
          themeClass(
            "bg-gradient-to-r from-transparent via-[#C5A25D]/40 to-transparent",
            "bg-gradient-to-r from-transparent via-amber-600/25 to-transparent",
            "bg-gradient-to-r from-transparent via-amber-400 to-transparent"
          )
        }`}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 h-[1px] ${
          themeClass(
            "bg-gradient-to-r from-transparent via-[#C5A25D]/40 to-transparent",
            "bg-gradient-to-r from-transparent via-amber-600/25 to-transparent",
            "bg-gradient-to-r from-transparent via-amber-400 to-transparent"
          )
        }`}
      />

      {/* Clean Subtle Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] rounded-full blur-[160px] ${
            isDark ? "bg-amber-500/10" : isContrast ? "bg-amber-500/15" : "bg-amber-500/5"
          }`}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold tracking-widest uppercase font-mono border backdrop-blur-md shadow-sm ${
              themeClass(
                "border-[#C5A25D]/50 text-[#E8C986] bg-[#C5A25D]/15 shadow-[0_0_15px_rgba(197,162,93,0.15)]",
                "border-amber-700/30 text-amber-900 bg-amber-50/80",
                "border-amber-400 text-amber-300 bg-black shadow-[0_0_15px_rgba(251,191,36,0.3)]"
              )
            }`}
          >
            <span>{tag || "NHIỀU TỔ CHỨC VẪN ĐANG GẶP NHỮNG VẤN ĐỀ NÀY"}</span>
          </div>
          <h2
            className={`text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-[1.16] ${
              themeClass(
                "text-transparent bg-clip-text bg-[linear-gradient(180deg,#FFFFFF_0%,#F8F3E8_25%,#E5D4B2_55%,#BCA16B_85%,#876F3E_100%)] drop-shadow-[0_4px_20px_rgba(0,0,0,0.85)]",
                "text-slate-900",
                "text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]"
              )
            }`}
            style={{ fontFamily: "'Be Vietnam Pro', 'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            {title || "Quản lý quan hệ kinh doanh vẫn còn nhiều thách thức"}
          </h2>
        </div>

        {/* 5-Column Horizontal Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              className={`p-6 rounded-2xl border transition-all duration-300 group hover:-translate-y-1.5 flex flex-col justify-between backdrop-blur-md ${
                themeClass(
                  "bg-[#0B0F19]/90 border-white/[0.09] hover:border-[#C5A25D]/60 hover:bg-[#11172A] shadow-xl hover:shadow-[0_15px_35px_rgba(197,162,93,0.15)]",
                  "bg-white border-slate-200/80 hover:border-amber-500/50 hover:bg-slate-50 shadow-md hover:shadow-xl",
                  "bg-zinc-950 border-white/20 hover:border-amber-400 hover:bg-zinc-900 shadow-2xl hover:shadow-[0_0_25px_rgba(251,191,36,0.25)]"
                )
              }`}
            >
              <div>
                {/* Icon Header */}
                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 group-hover:scale-110 transition-all shadow-inner ${
                    themeClass(
                      "bg-[#141B2D] border-white/10 group-hover:border-[#C5A25D]/60",
                      "bg-amber-50 border-amber-200 group-hover:border-amber-500",
                      "bg-zinc-900 border-white/20 group-hover:border-amber-400"
                    )
                  }`}
                >
                  {item.icon || defaultIcons[idx % defaultIcons.length]}
                </div>

                {/* Title */}
                <h3
                  className={`text-base sm:text-lg font-bold mb-2.5 transition-colors leading-snug ${
                    themeClass(
                      "text-white group-hover:text-[#E8C986]",
                      "text-slate-900 group-hover:text-amber-800",
                      "text-white group-hover:text-amber-300"
                    )
                  }`}
                >
                  {item.title}
                </h3>

                {/* Description */}
                <p
                  className={`text-xs sm:text-sm leading-relaxed font-normal ${
                    themeClass("text-slate-300/90", "text-slate-600", "text-slate-300")
                  }`}
                >
                  {item.desc}
                </p>
              </div>

              <div
                className={`mt-6 pt-3.5 border-t flex items-center justify-between text-[10.5px] font-mono ${
                  themeClass(
                    "border-white/[0.08] text-slate-400",
                    "border-slate-100 text-slate-500",
                    "border-white/10 text-slate-400"
                  )
                }`}
              >
                <span>VẤN ĐỀ {item.number || `0${idx + 1}`}</span>
                <span className={`font-bold ${themeClass("text-[#E8C986]", "text-amber-700", "text-amber-300")}`}>
                  CẦN GIẢI PHÁP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


