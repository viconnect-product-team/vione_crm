import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ThemeMode } from "./LandingHero";

export interface LandingCtaBannerProps {
  title: string;
  subtitle: string;
  btnDemoText: string;
  btnDemoLink?: string;
  onDemoClick?: () => void;
  btnAppText?: string;
  btnAppLink?: string;
  onAppClick?: () => void;
  themeMode?: ThemeMode;
}

export function LandingCtaBanner({
  title,
  subtitle,
  btnDemoText = "Đặt demo ngay",
  btnDemoLink = "/auth",
  onDemoClick,
  btnAppText = "Liên hệ tư vấn",
  btnAppLink = "/contact",
  onAppClick,
  themeMode = "light",
}: LandingCtaBannerProps) {
  const isDark = themeMode === "dark";
  const isContrast = themeMode === "contrast";

  const themeClass = (darkClass: string, lightClass: string, contrastClass?: string) => {
    if (isContrast && contrastClass) return contrastClass;
    if (isDark || isContrast) return darkClass;
    return lightClass;
  };

  return (
    <section
      className={`py-24 md:py-32 relative overflow-hidden transition-colors duration-500 ${
        themeClass("bg-[#04060C]", "bg-[#FFFFFF]", "bg-black")
      }`}
    >
      {/* Top Golden Laser Divider */}
      <div
        className={`absolute top-0 left-0 right-0 h-[1px] ${
          themeClass(
            "bg-gradient-to-r from-transparent via-[#C5A25D]/40 to-transparent",
            "bg-gradient-to-r from-transparent via-amber-600/25 to-transparent",
            "bg-gradient-to-r from-transparent via-amber-400 to-transparent"
          )
        }`}
      />

      {/* Background Outer Supernova Burst */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[600px] rounded-full blur-[190px] pointer-events-none z-0 ${
          isDark
            ? "bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-600/20"
            : isContrast
            ? "bg-amber-500/25"
            : "bg-amber-400/10"
        }`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div
          className={`relative rounded-3xl p-8 sm:p-14 lg:p-16 overflow-hidden border backdrop-blur-2xl transition-all duration-500 ${
            themeClass(
              "bg-gradient-to-r from-[#141828] via-[#090C16] to-[#141828] border-[#C5A25D]/50 shadow-[0_30px_90px_rgba(0,0,0,0.85),0_0_50px_rgba(197,162,93,0.15)]",
              "bg-gradient-to-r from-amber-50 via-white to-amber-50 border-amber-300/80 shadow-[0_20px_60px_rgba(245,158,11,0.15)]",
              "bg-zinc-950 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.3)]"
            )
          }`}
        >
          {/* Luxury Sweeping Gold Nebula Ribbon Asset */}
          <img
            src="/landing/business-cta-bg.jpg"
            alt="CTA Banner Background"
            className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-700 ${
              isDark
                ? "opacity-40 mix-blend-screen"
                : isContrast
                ? "opacity-25 mix-blend-screen"
                : "opacity-15 mix-blend-multiply"
            }`}
          />

          {/* Inner SVG Diamond Mesh Pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cta-diamonds" width="24" height="24" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="12" height="12" fill="none" stroke="rgba(245, 158, 11, 0.6)" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cta-diamonds)" />
          </svg>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Content (8 cols) */}
            <div className="lg:col-span-8 text-left space-y-6">
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
                {title || "Sẵn sàng mở ra nhiều cơ hội hơn?"}
              </h2>

              <p
                className={`text-base sm:text-lg max-w-xl leading-relaxed font-normal ${
                  themeClass("text-slate-300", "text-slate-700", "text-slate-300")
                }`}
              >
                {subtitle || "Hãy để Business Connect đồng hành cùng hiệp hội hoặc doanh nghiệp của bạn."}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                {onDemoClick ? (
                  <button
                    onClick={onDemoClick}
                    className={`inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-extrabold text-sm sm:text-base transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-lg ${
                      themeClass(
                        "text-slate-950 bg-gradient-to-r from-[#F7D896] via-[#E2B755] to-[#C49338] hover:from-[#FFF0C7] hover:to-[#E2B755] shadow-[0_4px_30px_rgba(226,183,85,0.4)]",
                        "text-white bg-slate-900 hover:bg-black shadow-md",
                        "text-black bg-white font-extrabold shadow-[0_0_25px_rgba(255,255,255,0.3)]"
                      )
                    }`}
                  >
                    <span>{btnDemoText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <Link
                    to={btnDemoLink as any}
                    className={`inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-extrabold text-sm sm:text-base transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-lg ${
                      themeClass(
                        "text-slate-950 bg-gradient-to-r from-[#F7D896] via-[#E2B755] to-[#C49338] hover:from-[#FFF0C7] hover:to-[#E2B755] shadow-[0_4px_30px_rgba(226,183,85,0.4)]",
                        "text-white bg-slate-900 hover:bg-black shadow-md",
                        "text-black bg-white font-extrabold shadow-[0_0_25px_rgba(255,255,255,0.3)]"
                      )
                    }`}
                  >
                    <span>{btnDemoText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}

                {onAppClick ? (
                  <button
                    onClick={onAppClick}
                    className={`inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm sm:text-base backdrop-blur-md transition-all cursor-pointer shadow-sm ${
                      themeClass(
                        "text-white border border-[#C5A25D]/40 hover:border-[#E8C986] bg-[#0B0F19]/90 hover:bg-[#141B2D]",
                        "text-slate-900 border border-slate-300 hover:border-slate-500 bg-white hover:bg-slate-50",
                        "text-white border border-white/40 hover:border-white bg-zinc-900 hover:bg-black"
                      )
                    }`}
                  >
                    <span>{btnAppText}</span>
                  </button>
                ) : (
                  <a
                    href={btnAppLink}
                    className={`inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm sm:text-base backdrop-blur-md transition-all cursor-pointer shadow-sm ${
                      themeClass(
                        "text-white border border-[#C5A25D]/40 hover:border-[#E8C986] bg-[#0B0F19]/90 hover:bg-[#141B2D]",
                        "text-slate-900 border border-slate-300 hover:border-slate-500 bg-white hover:bg-slate-50",
                        "text-white border border-white/40 hover:border-white bg-zinc-900 hover:bg-black"
                      )
                    }`}
                  >
                    <span>{btnAppText}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Right Side Slogan (4 cols) */}
            <div
              className={`lg:col-span-4 lg:border-l lg:pl-10 text-left ${
                themeClass("lg:border-white/[0.08]", "lg:border-amber-200", "lg:border-white/20")
              }`}
            >
              <div
                className={`font-mono text-xs sm:text-sm space-y-1 tracking-widest uppercase font-bold ${
                  themeClass("text-[#E8C986]", "text-amber-800", "text-amber-300")
                }`}
              >
                <p>PEOPLE</p>
                <p>IDEAS</p>
                <p>OPPORTUNITIES</p>
                <p className={`pt-1 ${themeClass("text-white/90", "text-slate-800", "text-white")}`}>A BETTER</p>
                <p className={`${themeClass("text-white/90", "text-slate-800", "text-white")}`}>TOMORROW</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}


