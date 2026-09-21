import React from "react";
import { ArrowRight, Play, Sparkles, Globe2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

export type ThemeMode = "dark" | "light" | "contrast";

export interface LandingHeroProps {
  badge: string;
  title: string;
  titleGradientText?: string;
  subtitle: string;
  ctaPrimaryText: string;
  ctaPrimaryLink?: string;
  onCtaPrimaryClick?: () => void;
  ctaSecondaryText?: string;
  ctaSecondaryLink?: string;
  onCtaSecondaryClick?: () => void;
  stats: Array<{
    value: string;
    label: string;
    icon?: React.ReactNode;
  }>;
  variant?: "cyber" | "luxury";
  themeMode?: ThemeMode;
}

export function LandingHero({
  badge,
  title,
  titleGradientText,
  subtitle,
  ctaPrimaryText,
  ctaPrimaryLink = "/auth",
  onCtaPrimaryClick,
  ctaSecondaryText = "Xem video (2 phút)",
  ctaSecondaryLink = "#solutions",
  onCtaSecondaryClick,
  stats,
  themeMode = "dark",
}: LandingHeroProps) {
  const isDark = themeMode === "dark";
  const isContrast = themeMode === "contrast";

  const themeClass = (darkClass: string, lightClass: string, contrastClass?: string) => {
    if (isContrast && contrastClass) return contrastClass;
    if (isDark || isContrast) return darkClass;
    return lightClass;
  };

  return (
    <section
      className={`relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden transition-colors duration-500 ${themeClass("bg-[#050811]", "bg-[#FAF8F5]", "bg-black")
        }`}
    >
      {/* Clean, Elegant, Subtle Hero Background Mesh Tied to Theme Mode */}
      <div className="absolute inset-0 top-0 left-0 w-full h-[950px] pointer-events-none z-0 overflow-hidden">
        <img
          src={
            isContrast
              ? "/landing/ceo1983-contrast.jpg"
              : isDark
                ? "/landing/ceo1983-hero-bg.jpg"
                : "/landing/business-hero-light.jpg"
          }
          alt="Business Connect Hero Background"
          className={`w-full h-full object-cover object-top transition-all duration-700 ${isContrast
              ? "opacity-60"
              : isDark
                ? "opacity-65 mix-blend-lighten"
                : "opacity-85"
            }`}
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0) 100%)",
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0) 100%)",
          }}
        />
      </div>

      {/* Soft Ambient Gold Glow & Clean Atmosphere */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className={`absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] blur-[140px] transition-opacity duration-700 ${isDark
              ? "bg-gradient-to-b from-amber-400/20 via-yellow-600/10 to-transparent opacity-80"
              : isContrast
                ? "bg-white/10 opacity-30"
                : "bg-gradient-to-b from-amber-400/15 via-yellow-500/10 to-transparent opacity-60"
            }`}
        />

        {/* Ambient Subtle Gold Ring */}
        <div
          className={`absolute top-24 right-[12%] w-[420px] h-[420px] rounded-full border pointer-events-none ${isDark ? "border-amber-400/15" : isContrast ? "border-white/15" : "border-amber-600/10"
            }`}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Split Screen 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center mb-16">
          {/* Left Column: Typography & CTAs (6 cols) */}
          <div className="lg:col-span-6 text-left space-y-6">
            {/* Eyebrow Badge */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] sm:text-xs font-bold tracking-widest uppercase font-mono transition-colors duration-500 ${themeClass(
                "border-[#C5A25D]/50 bg-[#C5A25D]/15 text-[#E8C986] backdrop-blur-md shadow-[0_0_20px_rgba(197,162,93,0.2)]",
                "border-[#C5A25D]/50 bg-[#FEF3C7]/80 text-[#92400E] shadow-xs",
                "border-white/40 bg-white/10 text-white"
              )
                }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E8C986]" />
              <span>{badge || "NỀN TẢNG KẾT NỐI KINH DOANH THẾ HỆ MỚI"}</span>
            </div>

            {/* Display Headline */}
            <h1
              className={`text-4xl sm:text-5xl lg:text-[54px] xl:text-[58px] font-black tracking-tight leading-[1.14] uppercase transition-all duration-500 pb-1 ${themeClass(
                "text-transparent bg-clip-text bg-[linear-gradient(180deg,#FFFFFF_0%,#F8F3E8_25%,#E5D4B2_55%,#BCA16B_85%,#876F3E_100%)] drop-shadow-[0_4px_25px_rgba(0,0,0,0.85)]",
                "text-[#0F172A] drop-shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
                "text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.2)]"
              )
                }`}
              style={{ fontFamily: "'Be Vietnam Pro', 'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              <span className="block">{title || "Hiểu đúng người."}</span>
              <span
                className={`block mt-1 ${themeClass(
                  "text-transparent bg-clip-text bg-gradient-to-r from-[#F7D896] via-[#E2B755] to-[#C49338]",
                  "text-transparent bg-clip-text bg-gradient-to-r from-[#B45309] via-[#D97706] to-[#92400E]",
                  "text-white"
                )
                  }`}
              >
                {titleGradientText || "Mở ra cơ hội thật."}
              </span>
            </h1>

            {/* Subtitle Description */}
            <p
              className={`text-base sm:text-lg max-w-xl leading-relaxed font-normal transition-colors duration-500 ${themeClass("text-slate-300", "text-[#475569]", "text-slate-200")
                }`}
            >
              {subtitle ||
                "Business Connect giúp các hiệp hội, tổ chức và doanh nghiệp quản lý mối quan hệ, kết nối đúng người, đúng thời điểm và tạo ra nhiều cơ hội kinh doanh hơn với sức mạnh của AI."}
            </p>

            {/* CTA Buttons Row */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {onCtaPrimaryClick ? (
                <button
                  onClick={onCtaPrimaryClick}
                  className={`shine-sweep inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-extrabold text-sm sm:text-base transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-xl ${themeClass(
                    "bg-gradient-to-r from-[#F7D896] via-[#E2B755] to-[#C49338] hover:from-[#FFF0C7] hover:to-[#E2B755] text-slate-950 shadow-[0_4px_30px_rgba(226,183,85,0.4)]",
                    "bg-gradient-to-r from-[#1E293B] to-[#0F172A] text-white shadow-slate-900/20 hover:from-black hover:to-black",
                    "bg-white text-black font-extrabold shadow-lg"
                  )
                    }`}
                >
                  <span>{ctaPrimaryText || "Đặt demo ngay"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  to={ctaPrimaryLink as any}
                  className={`shine-sweep inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-extrabold text-sm sm:text-base transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-xl ${themeClass(
                    "bg-gradient-to-r from-[#F7D896] via-[#E2B755] to-[#C49338] hover:from-[#FFF0C7] hover:to-[#E2B755] text-slate-950 shadow-[0_4px_30px_rgba(226,183,85,0.4)]",
                    "bg-gradient-to-r from-[#1E293B] to-[#0F172A] text-white shadow-slate-900/20 hover:from-black hover:to-black",
                    "bg-white text-black font-extrabold shadow-lg"
                  )
                    }`}
                >
                  <span>{ctaPrimaryText || "Đặt demo ngay"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              {ctaSecondaryText &&
                (onCtaSecondaryClick ? (
                  <button
                    onClick={onCtaSecondaryClick}
                    className={`inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full font-bold text-sm sm:text-base border transition-all cursor-pointer shadow-sm ${themeClass(
                      "border-[#C5A25D]/40 hover:border-[#E8C986] bg-[#0B0F19]/90 hover:bg-[#121827] text-white backdrop-blur-md",
                      "border-slate-300 bg-white hover:bg-slate-50 text-[#0F172A]",
                      "border-white/40 bg-white/10 text-white hover:bg-white/20"
                    )
                      }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-300">
                      <Play className="w-3 h-3 fill-amber-300 text-amber-300 ml-0.5" />
                    </span>
                    <span>{ctaSecondaryText}</span>
                  </button>
                ) : (
                  <a
                    href={ctaSecondaryLink}
                    className={`inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full font-bold text-sm sm:text-base border transition-all cursor-pointer shadow-sm ${themeClass(
                      "border-[#C5A25D]/40 hover:border-[#E8C986] bg-[#0B0F19]/90 hover:bg-[#121827] text-white backdrop-blur-md",
                      "border-slate-300 bg-white hover:bg-slate-50 text-[#0F172A]",
                      "border-white/40 bg-white/10 text-white hover:bg-white/20"
                    )
                      }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-300">
                      <Play className="w-3 h-3 fill-amber-300 text-amber-300 ml-0.5" />
                    </span>
                    <span>{ctaSecondaryText}</span>
                  </a>
                ))}
            </div>

            {/* Horizontal Stats Strip (Left Column) */}
            <div className="pt-8 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-left">
                  <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#F7D896] via-[#E2B755] to-[#C49338]">
                    {stat.value}
                  </div>
                  <div
                    className={`text-xs font-medium mt-1 leading-tight ${themeClass("text-slate-400", "text-[#64748B]", "text-slate-300")
                      }`}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Dual Device Mockup & Script Typography (6 cols) */}
          <div className="lg:col-span-6 relative">
            {/* Script Handwriting Watermark Accent */}
            <div className="absolute -top-9 right-4 font-serif italic text-amber-300 text-sm sm:text-base tracking-wide z-20 pointer-events-none drop-shadow-[0_2px_10px_rgba(245,158,11,0.4)] flex items-center gap-1.5">
              <span>✨ People Create Opportunities</span>
            </div>

            {/* Desktop Dashboard Screen Frame */}
            <div
              className={`relative rounded-3xl p-3 border shadow-[0_30px_90px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-all duration-500 ${themeClass(
                "bg-gradient-to-b from-white/15 via-white/5 to-white/[0.02] border-amber-400/30",
                "bg-white border-amber-900/15 shadow-[0_15px_50px_rgba(0,0,0,0.08)]",
                "bg-zinc-900 border-white/30"
              )
                }`}
            >
              <div
                className={`rounded-2xl overflow-hidden border ${themeClass("bg-[#070A12] border-white/[0.08]", "bg-slate-50 border-slate-200", "bg-black border-white/20")
                  }`}
              >
                {/* Header Window Bar */}
                <div
                  className={`flex items-center justify-between px-4 py-3 border-b text-xs ${themeClass("bg-[#0B0F1A] border-white/[0.08]", "bg-white border-slate-200", "bg-zinc-900 border-white/20")
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/90 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/90 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/90 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <span
                      className={`ml-2 font-extrabold tracking-wide flex items-center gap-1.5 ${themeClass("text-white", "text-slate-900", "text-white")
                        }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      BUSINESS CONNECT OS
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-[10px] font-bold border border-amber-400/40">
                      NV
                    </div>
                    <span
                      className={`text-[11px] font-semibold hidden sm:inline ${themeClass("text-slate-300", "text-slate-700", "text-slate-200")
                        }`}
                    >
                      Nguyễn Văn Minh (VIP)
                    </span>
                  </div>
                </div>

                {/* Dashboard Main View Mockup */}
                <div
                  className={`p-4 sm:p-5 space-y-4 text-left ${themeClass(
                    "bg-gradient-to-b from-[#070A12] to-[#04060C]",
                    "bg-gradient-to-b from-white to-slate-50",
                    "bg-black"
                  )
                    }`}
                >
                  {/* Top Headline Inside Screen */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4
                        className={`text-sm sm:text-base font-bold ${themeClass("text-white", "text-slate-900", "text-white")
                          }`}
                      >
                        Kết nối hôm nay — Tạo giá trị ngày mai
                      </h4>
                      <p
                        className={`text-[11px] ${themeClass("text-slate-400", "text-slate-500", "text-slate-400")
                          }`}
                      >
                        Mạng lưới kết nối giao thương thông minh bằng AI
                      </p>
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono font-bold flex items-center gap-1 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      LIVE RADAR
                    </span>
                  </div>

                  {/* 3 Metric Pills */}
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                    <div
                      className={`p-3 rounded-xl border transition-all ${themeClass(
                        "bg-[#0B0F19]/90 border-white/[0.08] hover:border-amber-400/30",
                        "bg-white border-slate-200 hover:border-amber-600/30 shadow-xs",
                        "bg-zinc-900 border-white/20"
                      )
                        }`}
                    >
                      <span className={`text-[10px] block font-medium ${themeClass("text-slate-400", "text-slate-500", "text-slate-400")}`}>
                        Hội viên
                      </span>
                      <span className={`text-sm sm:text-base font-extrabold ${themeClass("text-white", "text-slate-900", "text-white")}`}>
                        12,480
                      </span>
                      <span className="text-[9px] text-emerald-500 block font-semibold">+12% tháng này</span>
                    </div>
                    <div
                      className={`p-3 rounded-xl border transition-all ${themeClass(
                        "bg-[#0B0F19]/90 border-white/[0.08] hover:border-amber-400/30",
                        "bg-white border-slate-200 hover:border-amber-600/30 shadow-xs",
                        "bg-zinc-900 border-white/20"
                      )
                        }`}
                    >
                      <span className={`text-[10px] block font-medium ${themeClass("text-slate-400", "text-slate-500", "text-slate-400")}`}>
                        Cơ hội KD
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-amber-500">
                        320
                      </span>
                      <span className="text-[9px] text-amber-500 block font-semibold">+24% khớp nối</span>
                    </div>
                    <div
                      className={`p-3 rounded-xl border transition-all ${themeClass(
                        "bg-[#0B0F19]/90 border-white/[0.08] hover:border-amber-400/30",
                        "bg-white border-slate-200 hover:border-amber-600/30 shadow-xs",
                        "bg-zinc-900 border-white/20"
                      )
                        }`}
                    >
                      <span className={`text-[10px] block font-medium ${themeClass("text-slate-400", "text-slate-500", "text-slate-400")}`}>
                        Sự kiện
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-indigo-400">
                        48
                      </span>
                      <span className="text-[9px] text-indigo-400 block font-semibold">+18% tham gia</span>
                    </div>
                  </div>

                  {/* AI Matching Opportunities Card */}
                  <div
                    className={`p-3.5 rounded-xl border ${themeClass(
                      "bg-gradient-to-r from-amber-950/30 via-[#0B0F1A] to-[#0B0F1A] border-amber-400/30 shadow-inner",
                      "bg-amber-50/80 border-amber-300 shadow-xs",
                      "bg-zinc-900 border-white/20"
                    )
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Gợi ý cơ hội phù hợp với bạn
                      </span>
                      <span className="text-[9px] text-amber-400 font-mono font-bold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                        AI MATCH 98%
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div
                        className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${themeClass(
                          "bg-black/40 text-slate-200 border-white/[0.04] hover:border-amber-400/30",
                          "bg-white text-slate-800 border-slate-200 hover:border-amber-500",
                          "bg-black text-white border-white/20"
                        )
                          }`}
                      >
                        <span className="truncate">🏢 Tìm đối tác phân phối tại Singapore (Thực phẩm & Đồ uống)</span>
                        <span className="text-amber-400 font-bold ml-2 shrink-0">Kết nối →</span>
                      </div>
                      <div
                        className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${themeClass(
                          "bg-black/40 text-slate-200 border-white/[0.04] hover:border-amber-400/30",
                          "bg-white text-slate-800 border-slate-200 hover:border-amber-500",
                          "bg-black text-white border-white/20"
                        )
                          }`}
                      >
                        <span className="truncate">🤝 Kết nối với Hiệp hội Doanh nghiệp EU (Công nghệ cao)</span>
                        <span className="text-amber-400 font-bold ml-2 shrink-0">Kết nối →</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Smartphone Mockup (Overlay Bottom-Right) */}
              <div className="hidden sm:block absolute -right-6 -bottom-8 w-56 lg:w-64 rounded-3xl p-2.5 bg-gradient-to-b from-[#F7D896]/40 via-[#0B0F1A] to-[#04060C] border-2 border-amber-300/60 shadow-[0_30px_70px_rgba(0,0,0,0.95)] backdrop-blur-3xl z-30 transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <div
                  className={`rounded-2xl p-3.5 border text-left space-y-2.5 ${themeClass("bg-[#070A12] border-white/[0.08]", "bg-white border-slate-200", "bg-black border-white/20")
                    }`}
                >
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                    <span className="text-[10px] text-amber-400 font-mono font-bold tracking-wider">
                      VIONE MOBILE ID
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      NFC ON
                    </span>
                  </div>

                  {/* Glowing 3D Globe Visual representation */}
                  <div className="h-24 rounded-xl bg-gradient-to-b from-amber-950/40 via-[#090D18] to-[#04060C] border border-amber-400/30 flex flex-col items-center justify-center text-center p-2 relative overflow-hidden">
                    <Globe2 className="w-10 h-10 text-amber-300 animate-[spin_40s_linear_infinite] mb-1 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
                    <p className="text-[10px] font-bold text-white">Kết nối Không giới hạn</p>
                    <p className="text-[8px] text-amber-300/90 font-mono">Cơ hội toàn cầu theo thời gian thực</p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-300 pt-1">
                    <span>Mạng lưới đối tác</span>
                    <span className="text-amber-300 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" /> 1-Tap Connect
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Golden Floor Spotlight Reflection */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-4/5 h-16 bg-amber-500/25 rounded-full blur-2xl pointer-events-none -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
