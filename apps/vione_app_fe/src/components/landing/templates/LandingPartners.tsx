import React from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import type { ThemeMode } from "./LandingHero";

export interface PartnerItem {
  id: string;
  name: string;
  category?: string;
  badge?: string;
}

export interface LandingPartnersProps {
  tag: string;
  title: string;
  partners?: PartnerItem[];
  allPartnersLinkText?: string;
  themeMode?: ThemeMode;
}

export function LandingPartners({
  tag,
  title,
  allPartnersLinkText = "Xem tất cả khách hàng",
  partners = [
    { id: "vcci", name: "VCCI", category: "Liên đoàn Thương mại & Công nghiệp VN" },
    { id: "amcham", name: "AmCham Vietnam", category: "Hiệp hội Doanh nghiệp Hoa Kỳ" },
    { id: "eurocham", name: "EUROCHAM", category: "Hiệp hội Doanh nghiệp Châu Âu" },
    { id: "kocham", name: "KOCHAM", category: "Hiệp hội Doanh nghiệp Hàn Quốc" },
    { id: "sbf", name: "SINGAPORE Business Federation", category: "Liên đoàn DN Singapore" },
    { id: "auscham", name: "AUSCHAM Vietnam", category: "Hiệp hội Doanh nghiệp Úc" },
  ],
  themeMode = "dark",
}: LandingPartnersProps) {
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
      className={`py-20 md:py-28 relative overflow-hidden transition-colors duration-500 ${
        themeClass("bg-[#04060C]", "bg-[#FFFFFF]", "bg-black")
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

      {/* Background Graphic Texture: Clean Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full blur-[160px] ${
            isDark ? "bg-amber-500/10" : isContrast ? "bg-amber-500/15" : "bg-amber-500/5"
          }`}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header with Title on Left & Link on Right */}
        <div
          className={`flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b gap-4 ${
            themeClass("border-white/[0.08]", "border-slate-200", "border-white/20")
          }`}
        >
          <div className="text-left space-y-3">
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold tracking-widest uppercase font-mono border backdrop-blur-md shadow-sm ${
                themeClass(
                  "border-[#C5A25D]/50 text-[#E8C986] bg-[#C5A25D]/15 shadow-[0_0_15px_rgba(197,162,93,0.15)]",
                  "border-amber-700/30 text-amber-900 bg-amber-50/80",
                  "border-amber-400 text-amber-300 bg-black shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                )
              }`}
            >
              <span>{tag || "ĐƯỢC TIN TƯỞNG BỞI CÁC HIỆP HỘI VÀ DOANH NGHIỆP"}</span>
            </div>
            <h2
              className={`text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight leading-tight ${
                themeClass(
                  "text-transparent bg-clip-text bg-[linear-gradient(180deg,#FFFFFF_0%,#F8F3E8_25%,#E5D4B2_55%,#BCA16B_85%,#876F3E_100%)] drop-shadow-[0_4px_20px_rgba(0,0,0,0.85)]",
                  "text-slate-900",
                  "text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                )
              }`}
              style={{ fontFamily: "'Be Vietnam Pro', 'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              {title || "Những tổ chức tiên phong đã lựa chọn"}
            </h2>
          </div>

          <div>
            <a
              href="#all-partners"
              className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-colors group cursor-pointer ${
                themeClass("text-[#E8C986] hover:text-amber-200", "text-amber-800 hover:text-amber-950", "text-amber-300 hover:text-white")
              }`}
            >
              <span>{allPartnersLinkText}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Minimalist Monochrome Logo Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5 items-center">
          {partners.map((p) => (
            <div
              key={p.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col items-center justify-center text-center group h-28 backdrop-blur-md hover:-translate-y-1 ${
                themeClass(
                  "bg-[#0B0F19]/90 border-white/[0.09] hover:border-[#C5A25D]/60 hover:bg-[#121828] shadow-lg hover:shadow-[0_10px_25px_rgba(197,162,93,0.15)]",
                  "bg-slate-50 border-slate-200/90 hover:border-amber-500/50 hover:bg-white shadow-sm hover:shadow-lg",
                  "bg-zinc-950 border-white/20 hover:border-amber-400 hover:bg-zinc-900 shadow-xl"
                )
              }`}
            >
              <span
                className={`font-extrabold text-base sm:text-lg font-sans tracking-tight transition-colors ${
                  themeClass("text-white group-hover:text-[#E8C986]", "text-slate-800 group-hover:text-amber-800", "text-white group-hover:text-amber-300")
                }`}
              >
                {p.name}
              </span>
              <span
                className={`text-[10.5px] mt-1 line-clamp-1 font-medium ${
                  themeClass("text-slate-400", "text-slate-500", "text-slate-400")
                }`}
              >
                {p.category}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}


