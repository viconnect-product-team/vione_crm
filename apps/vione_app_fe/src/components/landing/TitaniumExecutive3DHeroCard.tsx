import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Crown,
  Smartphone,
  ShieldCheck,
  Sparkles,
  Zap,
  Lock,
  Wifi,
  QrCode,
  CheckCircle2,
  ArrowRight,
  Fingerprint,
} from "lucide-react";

type ThemeMode = "dark" | "light" | "contrast";

interface TitaniumExecutive3DHeroCardProps {
  themeMode: ThemeMode;
  onActivate?: () => void;
}

export function TitaniumExecutive3DHeroCard({
  themeMode,
  onActivate,
}: TitaniumExecutive3DHeroCardProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 28;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 28;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const themeClass = (darkClass: string, lightClass: string, contrastClass?: string) => {
    if (themeMode === "contrast" && contrastClass) return contrastClass;
    if (themeMode === "dark" || themeMode === "contrast") return darkClass;
    return lightClass;
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-5xl mx-auto py-8 sm:py-12 flex flex-col items-center justify-center select-none"
    >
      {/* Background Cosmic Energy Glow & High-Tech Particle Field */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(216,178,130,0.25)_0%,rgba(56,189,248,0.18)_40%,transparent_70%)] blur-[80px]" />
        <div className="absolute -top-8 left-1/4 w-80 h-80 rounded-full bg-amber-500/20 blur-[90px] animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute -bottom-8 right-1/4 w-96 h-96 rounded-full bg-cyan-500/20 blur-[90px] animate-pulse" style={{ animationDuration: "5s" }} />

        {/* Twinkling Energy Sparks */}
        <div className="absolute top-8 left-16 w-2 h-2 rounded-full bg-amber-300 animate-ping" style={{ animationDuration: "2s" }} />
        <div className="absolute top-20 right-20 w-2.5 h-2.5 rounded-full bg-cyan-300 animate-ping" style={{ animationDuration: "2.8s" }} />
        <div className="absolute bottom-10 left-1/3 w-2 h-2 rounded-full bg-[#F6E1C3] animate-ping" style={{ animationDuration: "2.4s" }} />
      </div>

      {/* 3D Gyroscopic Outer Orbital Rings */}
      <div className="absolute w-[560px] h-[560px] sm:w-[680px] sm:h-[680px] rounded-full border border-dashed border-[#D8B282]/30 animate-spin-slow pointer-events-none" />
      <div className="absolute w-[460px] h-[460px] sm:w-[560px] sm:h-[560px] rounded-full border border-dotted border-cyan-400/35 animate-spin-reverse pointer-events-none" />
      <div className="absolute w-[360px] h-[360px] sm:w-[440px] sm:h-[440px] rounded-full border border-[#F6E1C3]/20 animate-pulse pointer-events-none" />

      {/* 4 Floating Holographic Telemetry Satellites on Orbit */}
      <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mb-6 relative z-20">
        {[
          { label: "C-LEVEL VERIFIED", icon: Crown, color: "#D8B282", tag: "TOP 1% VIP" },
          { label: "DEAL ROOM >5.000 TỶ", icon: Sparkles, color: "#F6E1C3", tag: "CLOSED-LOOP" },
          { label: "NFC 1-CHẠM WALLET", icon: Smartphone, color: "#38BDF8", tag: "APPLE & GOOGLE" },
          { label: "BẢO MẬT AES-256 E2E", icon: ShieldCheck, color: "#34D399", tag: "SOC 2 TYPE II" },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={idx}
              animate={{
                y: [0, idx % 2 === 0 ? -5 : 5, 0],
              }}
              transition={{
                duration: 3 + idx * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`p-3 sm:p-3.5 rounded-2xl border backdrop-blur-xl flex items-center gap-3 shadow-lg transition-all hover:scale-105 ${themeClass(
                "bg-[#080E1C]/90 border-[#D8B282]/30 text-white shadow-[0_8px_25px_rgba(0,0,0,0.5)]",
                "bg-white/95 border-[#D8B282]/50 text-[#785124] shadow-[0_8px_25px_rgba(140,101,59,0.12)]",
                "bg-black border-yellow-400 text-yellow-300"
              )}`}
            >
              <div
                className="w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-md"
                style={{
                  borderColor: `${item.color}55`,
                  backgroundColor: `${item.color}15`,
                  color: item.color,
                }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 text-left">
                <span className="text-[9px] font-mono font-bold text-[#D8B282] uppercase tracking-wider block truncate">
                  {item.tag}
                </span>
                <p className="text-xs font-black tracking-tight truncate">{item.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main 3D Titanium Smart Pass Canvas with Dynamic Mouse Perspective Tilt */}
      <div
        style={{ perspective: "1200px" }}
        className="relative z-30 py-4 flex flex-col items-center justify-center cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          animate={{
            rotateY: isFlipped ? 180 + mousePos.x : mousePos.x,
            rotateX: -mousePos.y,
            y: isHovered ? -10 : [0, -12, 0],
          }}
          transition={{
            y: isHovered
              ? { duration: 0.25 }
              : { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
            rotateY: { type: "spring", stiffness: 300, damping: 25 },
            rotateX: { type: "spring", stiffness: 300, damping: 25 },
          }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative w-[340px] sm:w-[460px] md:w-[500px] aspect-[1.586/1] rounded-[28px] p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_50px_rgba(216,178,130,0.35)] border-2 border-[#D8B282]/80 overflow-hidden backdrop-blur-2xl transition-shadow group-hover:shadow-[0_30px_70px_rgba(216,178,130,0.5),0_0_60px_rgba(56,189,248,0.4)]"
        >
          {/* Card Front Face Background: Brushed Obsidian Titanium Metallic Mesh */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1C2438] via-[#0E1528] to-[#050812] pointer-events-none" />

          {/* Anisotropic Metallic Sheen & Gold Laser Edge Refraction */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(246,225,195,0.28)_0%,transparent_60%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.2)_0%,transparent_60%)] pointer-events-none" />

          {/* Microscopic Circuit Geometry Pattern */}
          <svg
            className="absolute inset-0 w-full h-full opacity-15 pointer-events-none"
            viewBox="0 0 500 315"
          >
            <path
              d="M0,150 L120,150 L160,190 L340,190 L380,150 L500,150"
              fill="none"
              stroke="#D8B282"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />
            <path
              d="M100,0 L100,80 L140,120 L360,120 L400,80 L400,0"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />
            <circle cx="160" cy="190" r="4" fill="#D8B282" />
            <circle cx="340" cy="190" r="4" fill="#D8B282" />
            <circle cx="140" cy="120" r="3.5" fill="#38BDF8" />
            <circle cx="360" cy="120" r="3.5" fill="#38BDF8" />
          </svg>

          {/* Real-time Laser Scan Bar Sweeping Across Card */}
          <motion.div
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent skew-x-12 pointer-events-none"
          />

          {/* Card Front Content Layout */}
          <div className="relative z-10 h-full flex flex-col justify-between text-white select-none">
            {/* Top Row: ViOne Crown Brand + Contactless Wave Icon */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFF5E6] via-[#D8B282] to-[#8C653B] flex items-center justify-center text-slate-950 shadow-md">
                  <Crown className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base sm:text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5E6] via-[#F6E1C3] to-[#D8B282]">
                      ViOne
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-[#D8B282]/50 bg-[#D8B282]/20 text-[#F6E1C3]">
                      TITANIUM PASS
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 tracking-wider block">
                    BUSINESS CONNECT NETWORK
                  </span>
                </div>
              </div>

              {/* NFC Contactless Wave & SOC2 Badge */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 border border-[#D8B282]/40 text-[#D8B282] text-[10px] font-mono font-bold">
                  <Wifi className="w-3.5 h-3.5 rotate-90" />
                  <span>NFC 1-CHẠM</span>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shadow-[0_0_10px_#34D399]" />
              </div>
            </div>

            {/* Middle Row: Gold Contactless EMV Smart Chip with Micro-Circuitry */}
            <div className="my-auto flex items-center justify-between pt-2">
              <div className="relative w-14 h-11 sm:w-16 sm:h-12 rounded-xl bg-gradient-to-tr from-[#E2B774] via-[#FCE4B8] to-[#996F34] border border-[#FFF5E6] p-1 shadow-md flex items-center justify-center">
                {/* Chip Internal Contact Grids */}
                <div className="w-full h-full rounded-lg border border-[#8C653B]/50 grid grid-cols-3 gap-0.5 p-0.5 opacity-80">
                  <div className="border-r border-b border-[#8C653B]/60" />
                  <div className="border-r border-b border-[#8C653B]/60" />
                  <div className="border-b border-[#8C653B]/60" />
                  <div className="border-r border-[#8C653B]/60" />
                  <div className="border-r border-[#8C653B]/60 bg-[#8C653B]/20" />
                  <div />
                </div>
                {/* Micro Quantum Pulsing Dot */}
                <div className="absolute w-2 h-2 rounded-full bg-cyan-400 animate-ping shadow-[0_0_6px_#38BDF8]" />
              </div>

              {/* Floating Holographic Security Stamp */}
              <div className="px-3 py-1.5 rounded-xl border border-cyan-400/40 bg-cyan-950/50 backdrop-blur-md flex items-center gap-2 shadow-inner">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <div className="text-left">
                  <span className="text-[8.5px] font-mono font-black text-cyan-300 block uppercase">
                    AES-256 E2E CIPHER
                  </span>
                  <span className="text-[8px] font-mono text-slate-400">SOC 2 TYPE II READY</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Card Serial + Cardholder C-Level Name */}
            <div>
              <div className="font-mono text-sm sm:text-base tracking-[0.22em] text-[#F6E1C3] font-bold drop-shadow flex items-center gap-3">
                <span>••••</span>
                <span>••••</span>
                <span>••••</span>
                <span className="text-white font-black">0019</span>
              </div>

              <div className="flex items-end justify-between mt-2 pt-2 border-t border-white/10">
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">
                    CARDHOLDER • C-LEVEL
                  </span>
                  <span className="text-xs sm:text-sm font-black uppercase text-white tracking-wide">
                    DOANH NHÂN HỘI VIÊN VIP
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">
                    NETWORK PASS
                  </span>
                  <span className="text-[11px] font-mono font-bold text-[#D8B282]">
                    VAL: 2026 - 2030
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dynamic Interactive Action Button Under Card */}
        <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onActivate) onActivate();
            }}
            className="px-7 py-3 rounded-full bg-gradient-to-r from-[#FFF5E6] via-[#D8B282] to-[#8C653B] text-slate-950 font-black text-xs font-mono uppercase tracking-wider shadow-[0_0_35px_rgba(216,178,130,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>KÍCH HOẠT THẺ TITANIUM (MIỄN PHÍ 30 NGÀY) →</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(!isFlipped);
            }}
            className="px-5 py-3 rounded-full border border-[#D8B282]/50 bg-black/60 text-[#F6E1C3] text-xs font-mono font-bold hover:bg-[#D8B282]/15 transition-all cursor-pointer flex items-center gap-2"
          >
            <Fingerprint className="w-4 h-4 text-[#D8B282]" />
            <span>{isFlipped ? "XEM MẶT TRƯỚC" : "LẬT XEM MẶT SAU 3D"}</span>
          </button>
        </div>

        <p className="text-[10px] font-mono text-[#D8B282]/80 mt-2 tracking-wider">
          ✦ RÊ CHUỘT ĐỂ XOAY NGHIÊNG 3D • CHẠM ĐỂ LẬT THẺ • ĐỒNG BỘ APPLE & GOOGLE WALLET ✦
        </p>
      </div>
    </div>
  );
}
