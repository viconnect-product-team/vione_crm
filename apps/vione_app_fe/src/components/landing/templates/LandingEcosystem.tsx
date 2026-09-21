import React, { useState } from "react";
import {
  Building2,
  Users,
  Briefcase,
  GraduationCap,
  Coins,
  Landmark,
  Globe2,
  Handshake,
  ArrowRight,
  Hexagon,
  Sparkles,
  Zap,
} from "lucide-react";
import type { ThemeMode } from "./LandingHero";

export interface EcosystemNode {
  id: string;
  name: string;
  desc?: string;
  count?: string;
  icon?: React.ReactNode;
}

export interface LandingEcosystemProps {
  tag: string;
  title: string;
  subtitle: string;
  nodes?: EcosystemNode[];
  ctaLinkText?: string;
  themeMode?: ThemeMode;
}

export function LandingEcosystem({
  tag,
  title,
  subtitle,
  nodes,
  ctaLinkText = "Xem hệ sinh thái",
  themeMode = "dark",
}: LandingEcosystemProps) {
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isDark = themeMode === "dark";
  const isContrast = themeMode === "contrast";

  const themeClass = (darkClass: string, lightClass: string, contrastClass?: string) => {
    if (isContrast && contrastClass) return contrastClass;
    if (isDark || isContrast) return darkClass;
    return lightClass;
  };

  // Inner ring nodes (4 items, radius ~130px)
  const innerNodes = [
    { id: "inner-1", name: "Hiệp hội Doanh nghiệp", count: "300+ Hiệp hội", desc: "Quản trị hội viên 360°, tổ chức đại hội & giao thương B2B", icon: <Landmark className="w-3.5 h-3.5 text-amber-400" /> },
    { id: "inner-2", name: "Câu lạc bộ CEO", count: "10,000+ Lãnh đạo", desc: "Không gian kết nối kín C-Level, chia sẻ kinh nghiệm thực chiến", icon: <Users className="w-3.5 h-3.5 text-amber-300" /> },
    { id: "inner-3", name: "Tập đoàn Sản xuất", count: "500+ Nhà máy", desc: "Chuỗi cung ứng khép kín, tối ưu chi phí nguyên phụ liệu", icon: <Building2 className="w-3.5 h-3.5 text-amber-400" /> },
    { id: "inner-4", name: "Đối tác Công nghệ", count: "200+ Tech Partners", desc: "Tích hợp AI, ERP, CRM, định danh số NFC & Blockchain", icon: <Handshake className="w-3.5 h-3.5 text-amber-300" /> },
  ];

  // Outer ring nodes (4 items, radius ~205px)
  const outerNodes = [
    { id: "outer-1", name: "Quỹ Đầu tư & Vườn ươm", count: "40+ Quỹ Đầu tư", desc: "Matching vốn đầu tư, cố vấn thoái vốn và M&A chiến lược", icon: <Coins className="w-3.5 h-3.5 text-amber-400" /> },
    { id: "outer-2", name: "Tổ chức Xúc tiến", count: "20+ Quốc gia", desc: "Kết nối thị trường quốc tế, thương mại hóa sản phẩm Việt", icon: <Globe2 className="w-3.5 h-3.5 text-amber-300" /> },
    { id: "outer-3", name: "Chuyên gia & Cố vấn", count: "5,000+ Mentors", desc: "Tư vấn quản trị, tái cấu trúc tài chính & luật doanh nghiệp", icon: <GraduationCap className="w-3.5 h-3.5 text-amber-400" /> },
    { id: "outer-4", name: "Cơ quan Quản lý", count: "Liên đoàn VCCI & HanoiBA", desc: "Bảo chứng uy tín pháp lý và định hướng phát triển bền vững", icon: <Briefcase className="w-3.5 h-3.5 text-amber-300" /> },
  ];

  return (
    <section
      id="ecosystem"
      className="py-24 md:py-32 relative overflow-hidden transition-colors duration-500 bg-[#03060F] text-white"
    >
      {/* Inline Orbit Keyframes Style */}
      <style>{`
        @keyframes orbitClockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbitCounterClockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .orbit-spin-slow {
          animation: orbitClockwise 45s linear infinite;
        }
        .orbit-spin-reverse-slow {
          animation: orbitCounterClockwise 65s linear infinite;
        }
        .orbit-counter-item-slow {
          animation: orbitCounterClockwise 45s linear infinite;
        }
        .orbit-counter-item-reverse {
          animation: orbitClockwise 65s linear infinite;
        }
        .orbit-paused {
          animation-play-state: paused !important;
        }
      `}</style>

      {/* Top & Bottom Golden Laser Dividers */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#F7D896]/60 to-transparent z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#F7D896]/60 to-transparent z-20" />

      {/* LUXURY RADAR NEBULA & CONSTELLATION GRID BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="/landing/ceo1983-radar-bg.jpg"
          alt="Radar Nebula Constellation"
          className="w-full h-full object-cover object-center opacity-50 mix-blend-screen"
        />
        {/* Atmospheric Dark & Golden Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#03060F] via-[#03060F]/60 to-[#03060F]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#03060F]/80 via-transparent to-[#03060F]/80" />

        {/* Ambient Cosmic Galaxy Aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] rounded-full bg-gradient-to-tr from-amber-500/25 via-yellow-600/15 to-transparent blur-[180px] pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Heading & Description (4 cols) */}
          <div className="lg:col-span-4 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold tracking-widest uppercase font-mono border border-amber-400/60 text-[#F7D896] bg-amber-500/25 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{tag || "HỆ SINH THÁI KẾT NỐI KINH DOANH"}</span>
            </div>

            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-[1.22] text-white drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)] overflow-visible pb-2 pt-0.5"
              style={{ fontFamily: "'Be Vietnam Pro', 'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFFFFF] via-[#FFF8E7] to-[#F7D896] inline-block pb-1">
                {title || "Cùng nhau tạo ra giá trị lớn hơn"}
              </span>
            </h2>

            <p className="text-sm sm:text-base leading-relaxed font-normal text-slate-200">
              {subtitle ||
                "Business Connect kết nối hội viên, hiệp hội, doanh nghiệp, chuyên gia, đối tác, nhà đầu tư và các tổ chức quốc tế trong một hệ sinh thái mở, để cùng chia sẻ tri thức, nguồn lực và cơ hội kinh doanh."}
            </p>

            {/* Orbit Controls Hint & Action */}
            <div className="pt-2 flex items-center gap-4">
              <a
                href="#solutions"
                className="inline-flex items-center gap-2 text-sm font-extrabold text-[#F7D896] hover:text-amber-200 transition-colors group cursor-pointer"
              >
                <span>{ctaLinkText}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform text-amber-400" />
              </a>

              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 transition-colors cursor-pointer"
              >
                {isPaused ? "▶ Tiếp tục xoay" : "⏸ Tạm dừng"}
              </button>
            </div>
          </div>

          {/* Center Column: Rotating Orbit Constellation Radar (5 cols) */}
          <div
            className="lg:col-span-5 relative flex items-center justify-center min-h-[480px] sm:min-h-[520px]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Ambient Concentric Orbit Rings Background */}
            <div className="absolute w-[460px] h-[460px] rounded-full border border-amber-400/30 pointer-events-none shadow-[0_0_40px_rgba(245,158,11,0.12)]" />
            <div className="absolute w-[300px] h-[300px] rounded-full border border-amber-400/40 border-dashed pointer-events-none shadow-[0_0_25px_rgba(245,158,11,0.1)]" />
            <div className="absolute w-[170px] h-[170px] rounded-full border border-amber-400/50 pointer-events-none" />

            {/* Central Hexagon Pulsing Core */}
            <div className="relative z-30 w-22 h-22 sm:w-26 sm:h-26 rounded-3xl flex flex-col items-center justify-center p-2 text-center border-2 border-amber-300 bg-gradient-to-br from-[#F7D896] via-[#E2B755] to-[#C49338] text-slate-950 shadow-[0_0_50px_rgba(247,216,150,0.8)] group hover:scale-110 transition-transform cursor-pointer">
              <Hexagon className="w-6 h-6 fill-current mb-0.5 text-slate-950" />
              <span className="text-[10px] sm:text-[11px] font-black leading-tight tracking-tight uppercase text-slate-950">
                BUSINESS<br />CONNECT
              </span>
              <div className="absolute -inset-2 rounded-3xl border border-amber-400/60 animate-ping pointer-events-none opacity-30" />
            </div>

            {/* INNER ORBIT RING (Clockwise Rotation, Radius: 150px) */}
            <div
              className={`absolute inset-0 m-auto w-[300px] h-[300px] rounded-full pointer-events-none flex items-center justify-center orbit-spin-slow z-20 ${
                isPaused ? "orbit-paused" : ""
              }`}
            >
              {[
                { ...innerNodes[0], x: 0, y: -150 },
                { ...innerNodes[1], x: 150, y: 0 },
                { ...innerNodes[2], x: 0, y: 150 },
                { ...innerNodes[3], x: -150, y: 0 },
              ].map((node, i) => (
                <div
                  key={node.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: "50%",
                    top: "50%",
                    marginLeft: `${node.x}px`,
                    marginTop: `${node.y}px`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveNode(i);
                    }}
                    className={`pointer-events-auto flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[11px] sm:text-xs font-bold transition-all cursor-pointer backdrop-blur-2xl orbit-counter-item-slow ${
                      isPaused ? "orbit-paused" : ""
                    } ${
                      activeNode === i
                        ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-white shadow-[0_0_30px_rgba(251,191,36,0.9)] scale-110 z-40"
                        : "bg-[#090E1C]/95 border-amber-400/60 hover:border-amber-300 text-white hover:bg-[#141E34] shadow-[0_6px_30px_rgba(0,0,0,0.95)] hover:scale-105"
                    }`}
                    title={node.desc}
                  >
                    <span className="p-1 rounded-full bg-amber-500/25 text-amber-300">{node.icon}</span>
                    <span className="whitespace-nowrap font-medium text-slate-100">{node.name}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* OUTER ORBIT RING (Counter-Clockwise Rotation, Radius: 230px, Staggered 45°) */}
            <div
              className={`absolute inset-0 m-auto w-[460px] h-[460px] rounded-full pointer-events-none flex items-center justify-center orbit-spin-reverse-slow z-10 ${
                isPaused ? "orbit-paused" : ""
              }`}
            >
              {[
                { ...outerNodes[0], x: 163, y: -163 },
                { ...outerNodes[1], x: 163, y: 163 },
                { ...outerNodes[2], x: -163, y: 163 },
                { ...outerNodes[3], x: -163, y: -163 },
              ].map((node, i) => (
                <div
                  key={node.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: "50%",
                    top: "50%",
                    marginLeft: `${node.x}px`,
                    marginTop: `${node.y}px`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveNode(i + 4);
                    }}
                    className={`pointer-events-auto flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[11px] sm:text-xs font-bold transition-all cursor-pointer backdrop-blur-2xl orbit-counter-item-reverse ${
                      isPaused ? "orbit-paused" : ""
                    } ${
                      activeNode === i + 4
                        ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-white shadow-[0_0_30px_rgba(251,191,36,0.9)] scale-110 z-40"
                        : "bg-[#070B18]/95 border-amber-400/50 hover:border-amber-300 text-white hover:bg-[#121A2E] shadow-[0_8px_35px_rgba(0,0,0,0.98)] hover:scale-105"
                    }`}
                    title={node.desc}
                  >
                    <span className="p-1 rounded-full bg-amber-500/25 text-amber-300">{node.icon}</span>
                    <span className="whitespace-nowrap font-medium text-slate-100">{node.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Dynamic Detail Panel / 3-Tier Slogan (3 cols) */}
          <div className="lg:col-span-3 lg:border-l lg:border-white/15 lg:pl-8 text-left space-y-4">
            <div className="space-y-3 font-mono font-black text-lg sm:text-xl tracking-wider uppercase leading-tight text-transparent bg-clip-text bg-gradient-to-r from-[#F7D896] via-[#E2B755] to-[#C49338]">
              <p className="border-b border-white/15 pb-2">NHIỀU KẾT NỐI HƠN</p>
              <p className="border-b border-white/15 pb-2">NHIỀU CƠ HỘI HƠN</p>
              <p>NHIỀU GIÁ TRỊ HƠN</p>
            </div>

            {activeNode !== null ? (
              <div className="p-4 rounded-2xl bg-white/[0.06] border border-amber-400/40 backdrop-blur-md animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {activeNode < 4
                      ? innerNodes[activeNode].count
                      : outerNodes[activeNode - 4].count}
                  </span>
                </div>
                <h4 className="text-sm font-black text-white mt-1">
                  {activeNode < 4
                    ? innerNodes[activeNode].name
                    : outerNodes[activeNode - 4].name}
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {activeNode < 4
                    ? innerNodes[activeNode].desc
                    : outerNodes[activeNode - 4].desc}
                </p>
              </div>
            ) : (
              <p className="text-xs sm:text-sm leading-relaxed font-normal pt-2 text-slate-300/90">
                Xây dựng mạng lưới quan hệ chiến lược đa tầng, biến mỗi lần chạm danh thiếp thành hợp
                đồng giao thương thực tế.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
