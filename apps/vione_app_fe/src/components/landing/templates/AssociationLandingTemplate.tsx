import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LangSwitcher } from "@/components/LangSwitcher";
import {
  LandingHero,
  type LandingHeroProps,
  type ThemeMode,
} from "./LandingHero";
import {
  LandingChallenges,
  type LandingChallengesProps,
} from "./LandingChallenges";
import {
  LandingSolutions,
  type LandingSolutionsProps,
} from "./LandingSolutions";
import {
  LandingEcosystem,
  type LandingEcosystemProps,
} from "./LandingEcosystem";
import {
  LandingPartners,
  type LandingPartnersProps,
} from "./LandingPartners";
import {
  LandingTestimonials,
  type LandingTestimonialsProps,
} from "./LandingTestimonials";
import {
  LandingCtaBanner,
  type LandingCtaBannerProps,
} from "./LandingCtaBanner";
import {
  Menu,
  X,
  ArrowRight,
} from "lucide-react";
import { useT } from "@/lib/i18n";

export interface AssociationLandingProps {
  brand: {
    name: string;
    logoUrl?: string;
    tagline?: string;
    initials?: string;
  };
  themeVariant?: "cyber" | "luxury";
  hero: LandingHeroProps;
  challenges?: LandingChallengesProps;
  solutions?: LandingSolutionsProps;
  ecosystem?: LandingEcosystemProps;
  partners?: LandingPartnersProps;
  testimonials?: LandingTestimonialsProps;
  ctaBanner?: LandingCtaBannerProps;
  customSections?: React.ReactNode;
  onJoinClick?: () => void;
}

export function AssociationLandingTemplate({
  brand,
  themeVariant = "luxury",
  hero,
  challenges,
  solutions,
  ecosystem,
  partners,
  testimonials,
  ctaBanner,
  customSections,
  onJoinClick,
}: AssociationLandingProps) {
  const t = useT();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // 3 Distinct Theme Modes: Obsidian (Dark), Ivory (Light), Onyx (Contrast)
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");

  const isDark = themeMode === "dark";
  const isContrast = themeMode === "contrast";

  const themeClass = (darkClass: string, lightClass: string, contrastClass?: string) => {
    if (isContrast && contrastClass) return contrastClass;
    if (isDark || isContrast) return darkClass;
    return lightClass;
  };

  const navLinks = [
    { label: t("landing.nav.solutions") || "Giải pháp", href: "#solutions" },
    { label: t("landing.nav.partners") || "Khách hàng", href: "#partners" },
    { label: t("landing.nav.testimonials") || "Câu chuyện", href: "#testimonials" },
    { label: t("landing.nav.ecosystem") || "Hệ sinh thái", href: "#ecosystem" },
    { label: t("landing.nav.challenges") || "Thách thức", href: "#challenges" },
  ];

  return (
    <div
      className={`min-h-screen relative transition-colors duration-500 selection:bg-amber-400 selection:text-slate-950 ${
        themeClass("bg-[#04060C] text-slate-100", "bg-[#FAF8F5] text-[#0F172A]", "bg-black text-white")
      }`}
      style={{ fontFamily: "'Be Vietnam Pro', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
    >
      {/* 1. EMBEDDED LUXURY FONTS */}
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600&display=swap');
        
        @keyframes shineSweep {
          0% { transform: translateX(-150%) skewX(-25deg); }
          100% { transform: translateX(250%) skewX(-25deg); }
        }
        .shine-sweep {
          position: relative;
          overflow: hidden;
        }
        .shine-sweep::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 60%;
          height: 100%;
          background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 100%);
          transform: translateX(-150%) skewX(-25deg);
          animation: shineSweep 4s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }
        `}
      </style>

      {/* Background Graphic Pattern & Radiant Golden Halos */}
      <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
        {/* Deep ambient golden auroras */}
        <div
          className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[1300px] h-[700px] rounded-full blur-[160px] transition-opacity duration-700 ${
            isDark
              ? "bg-gradient-to-b from-amber-500/20 via-yellow-600/10 to-transparent opacity-100"
              : isContrast
              ? "bg-white/10 opacity-50"
              : "bg-gradient-to-b from-amber-400/15 via-yellow-500/8 to-transparent opacity-60"
          }`}
        />
        <div
          className={`absolute top-1/4 -right-40 w-[700px] h-[700px] rounded-full blur-[180px] transition-opacity duration-700 ${
            isDark ? "bg-amber-600/12 opacity-100" : isContrast ? "opacity-0" : "bg-amber-600/6 opacity-50"
          }`}
        />
        <div
          className={`absolute top-1/2 -left-40 w-[700px] h-[700px] rounded-full blur-[180px] transition-opacity duration-700 ${
            isDark ? "bg-indigo-950/30 opacity-100" : isContrast ? "opacity-0" : "bg-amber-600/4 opacity-40"
          }`}
        />
        <div
          className={`absolute top-3/4 right-10 w-[600px] h-[600px] rounded-full blur-[160px] transition-opacity duration-700 ${
            isDark ? "bg-yellow-600/10 opacity-100" : isContrast ? "opacity-0" : "bg-yellow-600/5 opacity-40"
          }`}
        />

        {/* High-tech vector constellation & grid layer */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.14]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="bc-main-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(245, 158, 11, 0.25)" strokeWidth="0.8" />
              <circle cx="60" cy="0" r="1.5" fill="rgba(245, 158, 11, 0.6)" />
              <circle cx="0" cy="60" r="1.5" fill="rgba(245, 158, 11, 0.6)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bc-main-grid)" />
        </svg>

        {/* Floating golden star dust bokeh */}
        <div className="absolute top-[12%] left-[18%] w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_12px_#FCD34D] animate-pulse" />
        <div className="absolute top-[28%] right-[22%] w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_16px_#FBBF24] animate-pulse" style={{ animationDuration: "3s" }} />
        <div className="absolute top-[45%] left-[12%] w-1 h-1 rounded-full bg-amber-200 shadow-[0_0_8px_#FDE68A] animate-pulse" style={{ animationDuration: "4s" }} />
      </div>

      {/* Navigation Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl border-b transition-all duration-500 ${
          themeClass(
            "bg-[#04060C]/85 border-white/[0.08] shadow-lg",
            "bg-[#FFFFFF]/90 border-amber-900/10 shadow-sm",
            "bg-black/95 border-white/20"
          )
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo Brand */}
            <Link to="/landing" className="flex items-center gap-3.5 group">
              {brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="w-10 h-10 object-contain rounded-xl ring-1 ring-amber-400/30"
                />
              ) : (
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-base shadow-sm group-hover:scale-105 transition-transform ${
                    themeClass(
                      "bg-gradient-to-br from-[#F7D896] via-[#E2B755] to-[#C49338] text-slate-950 shadow-[0_0_20px_rgba(226,183,85,0.4)]",
                      "bg-gradient-to-br from-[#B18B44] to-[#8F6927] text-white",
                      "bg-white text-black"
                    )
                  }`}
                >
                  {brand.initials || "BC"}
                </div>
              )}
              <div>
                <span
                  className={`font-extrabold text-base sm:text-lg tracking-tight block leading-tight transition-colors ${
                    themeClass("text-white group-hover:text-amber-300", "text-[#0F172A] group-hover:text-[#B18B44]", "text-white")
                  }`}
                >
                  {brand.name}
                </span>
                {brand.tagline && (
                  <span
                    className={`text-[11px] block font-normal tracking-wide ${
                      themeClass("text-amber-200/60", "text-slate-500", "text-slate-400")
                    }`}
                  >
                    {brand.tagline}
                  </span>
                )}
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((item, idx) => (
                <a
                  key={idx}
                  href={item.href}
                  className={`text-xs sm:text-sm font-medium transition-colors relative py-1 hover:after:w-full after:w-0 after:h-0.5 after:bg-amber-400 after:absolute after:bottom-0 after:left-0 after:transition-all after:duration-300 ${
                    themeClass("text-slate-300 hover:text-amber-300", "text-[#334155] hover:text-[#B18B44]", "text-slate-200 hover:text-white")
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Right Action Tools */}
            <div className="hidden sm:flex items-center gap-3 sm:gap-4">
              {/* Language Switcher */}
              <div
                className={`rounded-full px-2 py-0.5 border transition-colors ${
                  themeClass("bg-[#0B0F19]/90 border-white/10 shadow-inner", "bg-slate-100 border-slate-200", "bg-zinc-900 border-white/20")
                }`}
              >
                <LangSwitcher themeMode={themeMode} />
              </div>

              {/* 3-Mode Theme Switcher Capsule */}
              <div
                className={`flex items-center rounded-full p-1 border transition-colors duration-500 ${
                  themeClass("border-white/15 bg-[#1F2026]/90", "border-slate-200 bg-[#E2E8F0]/60", "border-white/30 bg-zinc-900")
                }`}
              >
                <button
                  type="button"
                  onClick={() => setThemeMode("dark")}
                  className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                    themeMode === "dark" ? "bg-[#353840] text-white shadow-md" : themeClass("text-white/60 hover:text-white", "text-slate-600 hover:text-black", "text-white/60")
                  }`}
                >
                  🌙 Tối
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode("light")}
                  className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                    themeMode === "light" ? "bg-white text-slate-900 shadow-md font-extrabold" : themeClass("text-white/60 hover:text-white", "text-slate-600 hover:text-black", "text-white/60")
                  }`}
                >
                  ☀️ Sáng
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode("contrast")}
                  className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                    themeMode === "contrast"
                      ? "bg-white text-black font-extrabold shadow-md"
                      : themeClass("text-white/60 hover:text-white", "text-slate-600 hover:text-black", "text-slate-300")
                  }`}
                >
                  🌓 Tương phản
                </button>
              </div>

              {/* Sign In CTA */}
              <Link
                to="/auth"
                className={`text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full border transition-all ${
                  themeClass(
                    "text-slate-200 hover:text-white hover:bg-white/[0.06] border-transparent hover:border-white/10",
                    "text-slate-700 hover:text-slate-950 hover:bg-slate-100 border-transparent",
                    "text-white hover:bg-zinc-800 border-transparent"
                  )
                }`}
              >
                {t("landing.nav.signin") || "Đăng nhập"}
              </Link>

              {/* Primary Action Button */}
              {onJoinClick ? (
                <button
                  onClick={onJoinClick}
                  className={`shine-sweep inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full font-extrabold text-xs sm:text-sm transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-lg ${
                    themeClass(
                      "text-slate-950 bg-gradient-to-r from-[#F7D896] via-[#E2B755] to-[#C49338] hover:from-[#FFF0C7] hover:to-[#E2B755] shadow-[0_4px_25px_rgba(226,183,85,0.35)] hover:shadow-[0_6px_35px_rgba(226,183,85,0.5)]",
                      "text-white bg-slate-900 hover:bg-black shadow-md",
                      "text-black bg-white font-extrabold"
                    )
                  }`}
                >
                  <span>{t("landing.nav.demo") || "Đặt demo"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  to="/auth"
                  className={`shine-sweep inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full font-extrabold text-xs sm:text-sm transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-lg ${
                    themeClass(
                      "text-slate-950 bg-gradient-to-r from-[#F7D896] via-[#E2B755] to-[#C49338] hover:from-[#FFF0C7] hover:to-[#E2B755] shadow-[0_4px_25px_rgba(226,183,85,0.35)] hover:shadow-[0_6px_35px_rgba(226,183,85,0.5)]",
                      "text-white bg-slate-900 hover:bg-black shadow-md",
                      "text-black bg-white font-extrabold"
                    )
                  }`}
                >
                  <span>{t("landing.nav.demo") || "Đặt demo"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex sm:hidden items-center gap-3">
              <div
                className={`rounded-xl px-1.5 py-0.5 border ${
                  themeClass("bg-[#0B0F19]/90 border-white/10", "bg-slate-100 border-slate-200", "bg-zinc-900 border-white/20")
                }`}
              >
                <LangSwitcher themeMode={themeMode} />
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-xl border cursor-pointer ${
                  themeClass("bg-[#0B0F19] border-white/10 text-slate-300", "bg-slate-100 border-slate-200 text-slate-700", "bg-zinc-900 border-white/20 text-white")
                }`}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            className={`lg:hidden px-4 pt-3 pb-6 border-b space-y-3 ${
              themeClass("bg-[#070A12] border-white/10", "bg-white border-slate-200", "bg-black border-white/20")
            }`}
          >
            {/* Theme switcher on mobile */}
            <div className="flex items-center justify-around py-2 border-b border-white/10">
              <button
                type="button"
                onClick={() => setThemeMode("dark")}
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  themeMode === "dark" ? "bg-amber-400 text-black font-extrabold" : "text-slate-400"
                }`}
              >
                🌙 Tối
              </button>
              <button
                type="button"
                onClick={() => setThemeMode("light")}
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  themeMode === "light" ? "bg-amber-400 text-black font-extrabold" : "text-slate-400"
                }`}
              >
                ☀️ Sáng
              </button>
              <button
                type="button"
                onClick={() => setThemeMode("contrast")}
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  themeMode === "contrast" ? "bg-white text-black font-extrabold" : "text-slate-400"
                }`}
              >
                🌓 Tương phản
              </button>
            </div>

            {navLinks.map((item, idx) => (
              <a
                key={idx}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-sm font-medium py-2 border-b ${
                  themeClass("text-slate-300 hover:text-amber-400 border-white/[0.04]", "text-slate-700 hover:text-amber-600 border-slate-100", "text-white border-white/10")
                }`}
              >
                {item.label}
              </a>
            ))}
            <div className="pt-3 flex flex-col gap-2.5">
              <Link
                to="/auth"
                className={`text-center py-2.5 rounded-xl font-semibold text-sm border ${
                  themeClass("bg-white/[0.06] text-white border-white/10", "bg-slate-100 text-slate-800 border-slate-200", "bg-zinc-900 text-white border-white/20")
                }`}
              >
                {t("landing.nav.signin")}
              </Link>
              <Link
                to="/auth"
                className="text-center py-2.5 rounded-xl bg-gradient-to-r from-[#F7D896] via-[#E2B755] to-[#C49338] text-slate-950 font-extrabold text-sm shadow-md"
              >
                {t("landing.nav.demo")}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Sections */}
      <main className="relative">
        <div id="hero">
          <LandingHero {...hero} variant={themeVariant} themeMode={themeMode} />
        </div>

        {challenges && <LandingChallenges {...challenges} themeMode={themeMode} />}

        {solutions && <LandingSolutions {...solutions} themeMode={themeMode} />}

        {ecosystem && <LandingEcosystem {...ecosystem} themeMode={themeMode} />}

        {customSections}

        {partners && <LandingPartners {...partners} themeMode={themeMode} />}

        {testimonials && <LandingTestimonials {...testimonials} themeMode={themeMode} />}

        {ctaBanner && <LandingCtaBanner {...ctaBanner} themeMode={themeMode} />}
      </main>

      {/* Modern Footer */}
      <footer
        className={`py-16 text-xs sm:text-sm relative overflow-hidden border-t transition-colors duration-500 ${
          themeClass(
            "bg-[#030408] border-white/[0.08] text-slate-400",
            "bg-[#F1F5F9] border-slate-200 text-slate-600",
            "bg-black border-white/20 text-slate-400"
          )
        }`}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-14">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F7D896] via-[#E2B755] to-[#C49338] flex items-center justify-center font-black text-slate-950 text-sm shadow-sm">
                  {brand.initials || "BC"}
                </div>
                <span
                  className={`text-lg font-bold tracking-tight ${
                    themeClass("text-white", "text-[#0F172A]", "text-white")
                  }`}
                >
                  {brand.name}
                </span>
              </div>
              <p className="max-w-md text-xs leading-relaxed opacity-80">
                {brand.tagline ||
                  "Hệ điều hành hợp nhất quản lý hội viên, tổ chức sự kiện và kết nối giao thương đa chiều cho hiệp hội & cộng đồng doanh nhân."}
              </p>
              <div className="flex items-center gap-3 text-xs font-mono opacity-70">
                <span>© {new Date().getFullYear()} ViOne Platform</span>
                <span>•</span>
                <span className="text-emerald-500 font-semibold">ISO 27001 Certified</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider mb-4 text-[#C5A25D]">
                Giải pháp số
              </h4>
              <ul className="space-y-2.5 text-xs opacity-80">
                <li>
                  <a href="#solutions" className="hover:text-amber-400 transition-colors">
                    Quản lý hội viên
                  </a>
                </li>
                <li>
                  <a href="#solutions" className="hover:text-amber-400 transition-colors">
                    Danh thiếp số NFC
                  </a>
                </li>
                <li>
                  <a href="#solutions" className="hover:text-amber-400 transition-colors">
                    Sàn kết nối B2B
                  </a>
                </li>
                <li>
                  <a href="#solutions" className="hover:text-amber-400 transition-colors">
                    AI Copilot Matching
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider mb-4 text-[#C5A25D]">
                Hệ sinh thái
              </h4>
              <ul className="space-y-2.5 text-xs opacity-80">
                <li>
                  <Link to="/m" className="hover:text-amber-400 transition-colors">
                    ViOne Connect Mobile
                  </Link>
                </li>
                <li>
                  <Link to="/landing" className="hover:text-amber-400 transition-colors">
                    Business Connect
                  </Link>
                </li>
                <li>
                  <Link to="/landing/ceo1983" className="hover:text-amber-400 transition-colors">
                    CLB CEO 1983
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="hover:text-amber-400 transition-colors">
                    Cổng Ban Điều Hành
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs opacity-70">
            <div>Bản quyền thuộc về ViOne Ecosystem. Bảo lưu mọi quyền.</div>
            <div className="flex items-center gap-6">
              <Link to="/auth" className="hover:underline">
                Điều khoản
              </Link>
              <Link to="/auth" className="hover:underline">
                Chính sách bảo mật
              </Link>
              <Link to="/auth" className="hover:underline">
                Liên hệ kỹ thuật
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
