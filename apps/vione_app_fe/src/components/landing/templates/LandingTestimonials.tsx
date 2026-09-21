import React from "react";
import { Quote, CheckCircle2 } from "lucide-react";
import type { ThemeMode } from "./LandingHero";

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role: string;
  avatarText?: string;
  avatarUrl?: string;
}

export interface LandingTestimonialsProps {
  tag: string;
  title: string;
  testimonials: TestimonialItem[];
  themeMode?: ThemeMode;
}

export function LandingTestimonials({
  tag,
  title,
  testimonials,
  themeMode = "light",
}: LandingTestimonialsProps) {
  const isDark = themeMode === "dark";
  const isContrast = themeMode === "contrast";

  const themeClass = (darkClass: string, lightClass: string, contrastClass?: string) => {
    if (isContrast && contrastClass) return contrastClass;
    if (isDark || isContrast) return darkClass;
    return lightClass;
  };

  return (
    <section
      id="testimonials"
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

      {/* Giant Stylized Gold Quote Watermark & Clean Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Giant Metallic Quotation Mark */}
        <div
          className={`absolute -top-12 -right-8 font-serif text-[320px] select-none pointer-events-none leading-none ${
            themeClass("text-amber-500/[0.04]", "text-amber-900/[0.03]", "text-white/[0.05]")
          }`}
        >
          “
        </div>
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] rounded-full blur-[170px] ${
            isDark ? "bg-amber-500/10" : isContrast ? "bg-amber-500/15" : "bg-amber-500/5"
          }`}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-left max-w-2xl mb-16 space-y-3">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold tracking-widest uppercase font-mono border backdrop-blur-md shadow-sm ${
              themeClass(
                "border-[#C5A25D]/50 text-[#E8C986] bg-[#C5A25D]/15 shadow-[0_0_15px_rgba(197,162,93,0.15)]",
                "border-amber-700/30 text-amber-900 bg-amber-50/80",
                "border-amber-400 text-amber-300 bg-black shadow-[0_0_15px_rgba(251,191,36,0.3)]"
              )
            }`}
          >
            <span>{tag || "CÂU CHUYỆN THÀNH CÔNG"}</span>
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
            {title || "Kết nối đúng.\nTăng trưởng thật."}
          </h2>
        </div>

        {/* 3 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={t.id || idx}
              className={`p-7 sm:p-8 rounded-2xl border transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5 backdrop-blur-md ${
                themeClass(
                  "bg-[#0B0F19]/95 border-white/[0.09] hover:border-[#C5A25D]/60 shadow-xl hover:shadow-[0_15px_35px_rgba(197,162,93,0.15)]",
                  "bg-white border-slate-200/90 hover:border-amber-500/50 shadow-md hover:shadow-xl",
                  "bg-zinc-950 border-white/20 hover:border-amber-400 shadow-2xl hover:shadow-[0_0_25px_rgba(251,191,36,0.25)]"
                )
              }`}
            >
              <div>
                <p
                  className={`text-sm sm:text-base leading-relaxed italic mb-8 font-normal ${
                    themeClass("text-slate-200", "text-slate-700", "text-slate-200")
                  }`}
                >
                  "{t.quote}"
                </p>
              </div>

              <div
                className={`flex items-center gap-3.5 pt-4 border-t ${
                  themeClass("border-white/[0.08]", "border-slate-100", "border-white/10")
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shadow-md shrink-0 ${
                    themeClass(
                      "bg-gradient-to-br from-[#F7D896] via-[#E2B755] to-[#C49338] text-slate-950",
                      "bg-amber-100 text-amber-900 border border-amber-300",
                      "bg-white text-black font-extrabold"
                    )
                  }`}
                >
                  {t.avatarText || t.author.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3
                    className={`text-sm sm:text-base font-bold flex items-center gap-1.5 truncate transition-colors ${
                      themeClass(
                        "text-white group-hover:text-[#E8C986]",
                        "text-slate-900 group-hover:text-amber-800",
                        "text-white group-hover:text-amber-300"
                      )
                    }`}
                  >
                    <span>{t.author}</span>
                  </h3>
                  <p
                    className={`text-xs truncate mt-0.5 ${
                      themeClass("text-slate-400", "text-slate-500", "text-slate-400")
                    }`}
                  >
                    {t.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}


