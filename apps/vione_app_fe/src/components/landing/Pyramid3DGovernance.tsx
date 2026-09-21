import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Users2,
  Building2,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

type ThemeMode = "dark" | "light" | "contrast";

interface Pyramid3DGovernanceProps {
  themeMode: ThemeMode;
}

interface TierInfo {
  id: "apex" | "mid" | "base";
  badge: string;
  name: string;
  role: string;
  scale: string;
  cycle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  highlight1: string;
  highlight2: string;
  metrics: { label: string; value: string }[];
}

const TIERS: TierInfo[] = [
  {
    id: "apex",
    badge: "ĐỈNH THÁP • ĐIỀU PHỐI VỐN",
    name: "CỐ VẤN CHIẾN LƯỢC TOÀN CẦU",
    role: "Định hướng vĩ mô, điều phối nguồn vốn đầu tư và phê duyệt liên minh M&A cấp cao.",
    scale: ">5.000 TỶ VNĐ",
    cycle: "HỘI NGHỊ KÍN HÀNG QUÝ",
    icon: Crown,
    accent: "#F6E1C3",
    highlight1: "Top 1% C-Suite (Chủ tịch HĐQT, Quỹ PE/VC & Cố vấn cấp Quốc gia)",
    highlight2: "Deal Room mã hóa AES-256 & bảo trợ đầu tư chiến lược",
    metrics: [
      { label: "PIPELINE ĐẦU TƯ", value: "$200M+" },
      { label: "C-LEVEL", value: "TOP 1%" },
      { label: "BẢO MẬT", value: "AES-256" },
    ],
  },
  {
    id: "mid",
    badge: "THÂN THÁP • LIÊN MINH HIỆP HỘI",
    name: "HỘI ĐỒNG 300+ HIỆP HỘI",
    role: "Xúc tiến thương mại đa ngành, kết nối chuỗi cung ứng và điều phối giao thương liên tỉnh.",
    scale: "300+ HIỆP HỘI",
    cycle: "BIỂU QUYẾT BLOCKCHAIN",
    icon: Users2,
    accent: "#D8B282",
    highlight1: "300+ Hiệp hội Doanh nhân trên 63 tỉnh thành (HanoiBA, BNI, YBA...)",
    highlight2: "Khớp lệnh cung ứng AI tự động & biểu quyết số E-Voting",
    metrics: [
      { label: "TỈNH THÀNH", value: "63 / 63" },
      { label: "TÍN DỤNG", value: "HẠNG AA+" },
      { label: "KHỚP LỆNH", value: "< 4H" },
    ],
  },
  {
    id: "base",
    badge: "ĐẾ THÁP • NỀN TẢNG THƯƠNG MẠI",
    name: "10.000+ DOANH NGHIỆP THỰC CHIẾN",
    role: "Lực lượng sản xuất kinh doanh nòng cốt, thực thi giao dịch B2B và tạo dòng tiền thực.",
    scale: "10.000+ DOANH NGHIỆP",
    cycle: "GIAO THƯƠNG 24/7",
    icon: Building2,
    accent: "#D8B282",
    highlight1: "10.000+ Doanh nghiệp SME, Nhà máy sản xuất & Tổng thầu phân phối",
    highlight2: "Định danh NFC Titanium VIP, matching mua bán & bảo lãnh số 360°",
    metrics: [
      { label: "DOANH NGHIỆP", value: "10.000+" },
      { label: "GIAO DỊCH / NĂM", value: "120.000+" },
      { label: "XÁC THỰC", value: "100% E-KYC" },
    ],
  },
];

export function Pyramid3DGovernance({ themeMode }: Pyramid3DGovernanceProps) {
  const [activeTierId, setActiveTierId] = useState<"apex" | "mid" | "base">("apex");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 16;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const themeClass = (darkClass: string, lightClass: string, contrastClass?: string) => {
    if (themeMode === "contrast" && contrastClass) return contrastClass;
    if (themeMode === "dark" || themeMode === "contrast") return darkClass;
    return lightClass;
  };

  const activeTier = TIERS.find((t) => t.id === activeTierId) || TIERS[0];
  const ActiveIcon = activeTier.icon;

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-5xl mx-auto py-2 select-none"
    >
      {/* Golden Ambient Glow & Animated GIF Hologram Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        <img
          src="/landing/luxury-gold-grid.gif"
          alt="Pyramid Holographic Gold Grid"
          className="w-full h-full object-cover opacity-20 dark:opacity-30 mix-blend-screen scale-110 filter brightness-110 contrast-125"
        />
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[450px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(216,178,130,0.18)_0%,transparent_70%)] blur-[80px]" />
      </div>

      {/* Header Badge */}
      <div className="flex flex-col items-center mb-6 text-center relative z-10">
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${themeClass(
            "bg-[#D8B282]/15 border-[#D8B282]/40 text-[#F6E1C3]",
            "bg-[#D8B282]/20 border-[#8C531B]/40 text-[#7C2D12]",
            "bg-yellow-400/20 border-yellow-400 text-yellow-300"
          )}`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D8B282]" />
          <span>MÔ HÌNH QUẢN TRỊ KIM TỰ THÁP 3D VIONE</span>
        </div>
        <p
          className={`text-xs sm:text-sm font-medium mt-1.5 max-w-md ${themeClass(
            "text-slate-300",
            "text-[#1E293B] font-semibold",
            "text-white"
          )}`}
        >
          Ba tầng năng lực vận hành thực thi, kết nối đa chiều và tối ưu hóa
          nguồn lực doanh nghiệp.
        </p>
      </div>

      {/* Main Grid: 3D Canvas Left + Concise Dossier Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch relative z-10">
        {/* LEFT: 3D Pyramid Canvas */}
        <div
          className={`lg:col-span-5 p-5 rounded-3xl border backdrop-blur-2xl flex flex-col items-center justify-between min-h-[390px] shadow-xl relative overflow-hidden ${themeClass(
            "border-[#D8B282]/30 bg-[#070D18]/90",
            "border-[#D8B282]/50 bg-white/95 shadow-lg",
            "border-yellow-400 bg-black text-yellow-300"
          )}`}
        >
          {/* Animated 3D Cyber GIF Layer inside Canvas */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <img
              src="/landing/luxury-gold-grid.gif"
              alt="Hologram Gold Grid"
              className="w-full h-full object-cover opacity-25 dark:opacity-40 mix-blend-screen scale-125"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070D18] via-transparent to-[#070D18]/60 pointer-events-none" />
          </div>

          {/* Animated Radial Radar Rings */}
          <div className="absolute inset-2 rounded-full border border-dashed border-[#D8B282]/15 animate-spin-slow pointer-events-none z-[1]" />
          <div className="absolute inset-10 rounded-full border border-[#D8B282]/10 pointer-events-none z-[1]" />

          <div className="w-full flex justify-between items-center text-[10px] font-mono text-[var(--bc-mobile-muted,#8C653B)] uppercase tracking-wider mb-2 relative z-10">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D8B282] animate-ping" />
              TƯƠNG TÁC 3D
            </span>
            <span>CHỌN TẦNG ĐỂ XEM</span>
          </div>

          {/* 3D Viewport */}
          <div
            style={{ perspective: "1200px" }}
            className="relative w-full flex items-center justify-center my-auto py-2"
          >
            <motion.div
              animate={{
                rotateX: 12 - mousePos.y * 0.6,
                rotateY: mousePos.x * 0.8,
              }}
              transition={{ type: "spring", stiffness: 240, damping: 26 }}
              style={{ transformStyle: "preserve-3d" }}
              className="relative w-full flex flex-col items-center gap-1"
            >
              {/* ── ĐỈNH THÁP (Apex) ── */}
              <motion.div
                animate={{
                  y: activeTierId === "apex" ? -10 : 0,
                  scale: activeTierId === "apex" ? 1.08 : 1,
                }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                onClick={() => setActiveTierId("apex")}
                style={{ transformStyle: "preserve-3d", zIndex: 30 }}
                className="relative cursor-pointer flex flex-col items-center group"
              >
                <div
                  className={`relative flex items-center justify-center transition-all ${
                    activeTierId === "apex"
                      ? "drop-shadow-[0_0_26px_rgba(246,225,195,0.95)]"
                      : "opacity-90 hover:opacity-100"
                  }`}
                  style={{
                    width: 170,
                    height: 104,
                    background:
                      "linear-gradient(160deg, #FFFFFF 0%, #FBF0D8 25%, #E5C294 55%, #B38246 80%, #7A5322 100%)",
                    clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                    transform: "translateZ(38px)",
                    filter: activeTierId === "apex"
                      ? "drop-shadow(0 8px 22px rgba(216,178,130,0.8))"
                      : "drop-shadow(0 4px 10px rgba(0,0,0,0.4))",
                  }}
                >
                  <div
                    className="absolute flex flex-col items-center gap-0.5"
                    style={{ top: "54%", transform: "translateY(-50%)" }}
                  >
                    <Crown className="w-5 h-5 text-slate-950 drop-shadow-sm" />
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-950 leading-none">
                      ĐỈNH THÁP
                    </span>
                  </div>
                  {activeTierId === "apex" && (
                    <div
                      className="absolute inset-0 border-2 border-white/80 animate-pulse"
                      style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }}
                    />
                  )}
                </div>
              </motion.div>

              {/* ── THÂN THÁP (Mid) ── */}
              <motion.div
                animate={{
                  y: activeTierId === "mid" ? -5 : 0,
                  scale: activeTierId === "mid" ? 1.05 : 1,
                }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                onClick={() => setActiveTierId("mid")}
                style={{ transformStyle: "preserve-3d", zIndex: 20, marginTop: -6 }}
                className="relative cursor-pointer flex flex-col items-center group"
              >
                <div
                  className={`relative flex items-center justify-center transition-all ${
                    activeTierId === "mid"
                      ? "drop-shadow-[0_0_24px_rgba(216,178,130,0.75)]"
                      : "opacity-90 hover:opacity-100"
                  }`}
                  style={{
                    width: 250,
                    height: 94,
                    background:
                      "linear-gradient(160deg, #243550 0%, #1A2840 30%, #0F1A2E 60%, #080F1D 100%)",
                    clipPath: "polygon(16% 0%, 84% 0%, 100% 100%, 0% 100%)",
                    transform: "translateZ(20px)",
                    filter: activeTierId === "mid"
                      ? "drop-shadow(0 6px 18px rgba(216,178,130,0.6))"
                      : "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
                  }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 pt-2">
                    <Users2 className="w-5 h-5 text-[#F6E1C3] drop-shadow" />
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-[#F6E1C3] leading-none">
                      THÂN THÁP
                    </span>
                    <span className="text-[7.5px] font-mono text-[#D8B282] leading-none mt-0.5">
                      300+ Hiệp Hội
                    </span>
                  </div>
                  <div className="absolute top-0 inset-x-[16%] h-[1.5px] bg-gradient-to-r from-transparent via-[#F6E1C3]/80 to-transparent" />
                  {activeTierId === "mid" && (
                    <div
                      className="absolute inset-0 border border-[#F6E1C3]/70 animate-pulse"
                      style={{ clipPath: "polygon(16% 0%, 84% 0%, 100% 100%, 0% 100%)" }}
                    />
                  )}
                </div>
              </motion.div>

              {/* ── ĐẾ THÁP (Base) ── */}
              <motion.div
                animate={{
                  y: activeTierId === "base" ? 3 : 0,
                  scale: activeTierId === "base" ? 1.04 : 1,
                }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                onClick={() => setActiveTierId("base")}
                style={{ transformStyle: "preserve-3d", zIndex: 10, marginTop: -6 }}
                className="relative cursor-pointer flex flex-col items-center group"
              >
                <div
                  className={`relative flex items-center justify-center transition-all ${
                    activeTierId === "base"
                      ? "drop-shadow-[0_0_24px_rgba(216,178,130,0.7)]"
                      : "opacity-90 hover:opacity-100"
                  }`}
                  style={{
                    width: 320,
                    height: 94,
                    background:
                      "linear-gradient(160deg, #2D1E0E 0%, #1E1308 30%, #120A05 60%, #090503 100%)",
                    clipPath: "polygon(11% 0%, 89% 0%, 100% 100%, 0% 100%)",
                    transform: "translateZ(8px)",
                    filter: activeTierId === "base"
                      ? "drop-shadow(0 6px 18px rgba(216,178,130,0.5))"
                      : "drop-shadow(0 4px 10px rgba(0,0,0,0.6))",
                  }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 pt-2">
                    <Building2 className="w-5 h-5 text-[#D8B282] drop-shadow" />
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-[#D8B282] leading-none">
                      ĐẾ THÁP
                    </span>
                    <span className="text-[7.5px] font-mono text-[#E5C294] leading-none mt-0.5">
                      10.000+ Doanh Nghiệp
                    </span>
                  </div>
                  <div className="absolute top-0 inset-x-[11%] h-[1.5px] bg-gradient-to-r from-transparent via-[#D8B282]/70 to-transparent" />
                  {activeTierId === "base" && (
                    <div
                      className="absolute inset-0 border border-[#D8B282]/50 animate-pulse"
                      style={{ clipPath: "polygon(11% 0%, 89% 0%, 100% 100%, 0% 100%)" }}
                    />
                  )}
                </div>
              </motion.div>

              {/* Glowing Pedestal Reflection */}
              <div
                className="mt-1 pointer-events-none opacity-30"
                style={{
                  width: 320,
                  height: 16,
                  background:
                    "radial-gradient(ellipse at center, rgba(216,178,130,0.7) 0%, transparent 70%)",
                  filter: "blur(6px)",
                }}
              />
            </motion.div>
          </div>

          {/* Quick Select Buttons */}
          <div className="mt-3 flex items-center gap-2 w-full justify-center">
            {TIERS.map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => setActiveTierId(tier.id)}
                className={`flex-1 max-w-[100px] py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer text-center ${
                  activeTierId === tier.id
                    ? themeMode === "light"
                      ? "bg-gradient-to-r from-[#F97316] via-[#EA580C] to-[#D97706] text-white shadow-md font-black scale-105"
                      : "bg-gradient-to-r from-[#F6E1C3] via-[#D8B282] to-[#B38246] text-slate-950 shadow-md font-extrabold scale-102"
                    : themeClass(
                        "bg-white/10 text-slate-300 hover:bg-white/15",
                        "bg-white text-[#475569] border border-[#F59E0B]/30 hover:border-[#EA580C] hover:text-[#EA580C]"
                      )
                }`}
              >
                {tier.id === "apex" ? "Đỉnh Tháp" : tier.id === "mid" ? "Thân Tháp" : "Đế Tháp"}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Compact, High-Impact Governance Dossier */}
        <div
          className={`lg:col-span-7 p-5 sm:p-6 rounded-3xl border backdrop-blur-2xl shadow-xl flex flex-col justify-between ${themeClass(
            "border-[#D8B282]/35 bg-[#070D18]/95",
            "border-2 border-[#F59E0B]/60 bg-white/98 text-[#0F172A] shadow-[0_15px_40px_rgba(245,158,11,0.15)]",
            "border-yellow-400 bg-black text-yellow-300"
          )}`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTier.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full justify-between gap-4"
            >
              {/* Header Info */}
              <div>
                <div className="flex items-center justify-between border-b border-[#D8B282]/25 pb-3.5 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
                      style={{
                        backgroundColor: themeMode === "light" ? "#FFF7ED" : `${activeTier.accent}20`,
                        color: themeMode === "light" ? "#EA580C" : activeTier.accent,
                        border: themeMode === "light" ? "1.5px solid rgba(249, 115, 22, 0.4)" : `1.5px solid ${activeTier.accent}50`,
                      }}
                    >
                      <ActiveIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span
                        className={`text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${themeClass(
                          "bg-[#D8B282]/15 border-[#D8B282]/40 text-[#F6E1C3]",
                          "bg-gradient-to-r from-[#FFF7ED] to-[#FEF3C7] border-[#F97316]/50 text-[#EA580C] font-black shadow-xs"
                        )}`}
                      >
                        {activeTier.badge}
                      </span>
                      <h3
                        className={`text-base sm:text-lg font-black uppercase tracking-tight mt-1 ${themeClass(
                          "text-white",
                          "text-[#0F172A]"
                        )}`}
                      >
                        {activeTier.name}
                      </h3>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[9.5px] font-mono block ${themeClass(
                        "text-slate-400",
                        "text-[#64748B] font-bold"
                      )}`}
                    >
                      QUY MÔ
                    </span>
                    <p
                      className="text-sm sm:text-base font-black font-mono tracking-tight"
                      style={{ color: themeMode === "light" ? "#EA580C" : activeTier.accent }}
                    >
                      {activeTier.scale}
                    </p>
                  </div>
                </div>

                {/* Role description */}
                <p
                  className={`text-xs sm:text-[13px] leading-relaxed mb-3.5 ${themeClass(
                    "text-slate-300",
                    "text-[#334155] font-medium"
                  )}`}
                >
                  {activeTier.role}
                </p>

                {/* 3 Metric Pills */}
                <div className="grid grid-cols-3 gap-2.5 mb-3.5">
                  {activeTier.metrics.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border text-center transition-all ${themeClass(
                        "bg-white/[0.04] border-white/10",
                        "bg-[#FAF7F2] border-[#F59E0B]/40 shadow-xs"
                      )}`}
                    >
                      <span
                        className={`text-[8.5px] font-mono uppercase block ${themeClass(
                          "text-slate-400",
                          "text-[#64748B] font-bold"
                        )}`}
                      >
                        {m.label}
                      </span>
                      <p
                        className="text-sm sm:text-base font-black font-mono tracking-tight mt-0.5"
                        style={{ color: themeMode === "light" ? "#D97706" : activeTier.accent }}
                      >
                        {m.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* 2 Focused Highlights */}
                <div className="space-y-2 pt-1 border-t border-[#D8B282]/20">
                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2.5 ${themeClass(
                      "bg-white/[0.03] border-white/10",
                      "bg-white border-[#F59E0B]/30 shadow-xs"
                    )}`}
                  >
                    <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 ${themeClass("text-[#D8B282]", "text-[#EA580C]")}`} />
                    <div>
                      <span
                        className={`text-[10px] font-mono font-black uppercase tracking-wider block ${themeClass(
                          "text-[#F6E1C3]",
                          "text-[#EA580C]"
                        )}`}
                      >
                        THÀNH PHẦN NÒNG CỐT
                      </span>
                      <p
                        className={`text-xs mt-0.5 leading-snug ${themeClass(
                          "text-slate-300",
                          "text-[#334155] font-medium"
                        )}`}
                      >
                        {activeTier.highlight1}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2.5 ${themeClass(
                      "bg-white/[0.03] border-white/10",
                      "bg-white border-[#F59E0B]/30 shadow-xs"
                    )}`}
                  >
                    <TrendingUp className={`w-4 h-4 shrink-0 mt-0.5 ${themeClass("text-[#D8B282]", "text-[#EA580C]")}`} />
                    <div>
                      <span
                        className={`text-[10px] font-mono font-black uppercase tracking-wider block ${themeClass(
                          "text-[#F6E1C3]",
                          "text-[#EA580C]"
                        )}`}
                      >
                        CƠ CHẾ VẬN HÀNH SỐ
                      </span>
                      <p
                        className={`text-xs mt-0.5 leading-snug ${themeClass(
                          "text-slate-300",
                          "text-[#334155] font-medium"
                        )}`}
                      >
                        {activeTier.highlight2}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Footer */}
              <div className="pt-3 border-t border-[#D8B282]/20 flex items-center justify-between text-[11px] font-mono">
                <span
                  className={`flex items-center gap-1.5 ${themeClass(
                    "text-slate-400",
                    "text-[#475569] font-semibold"
                  )}`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${themeClass("text-[#D8B282]", "text-[#EA580C]")}`} />
                  XÁC THỰC: <strong>E-KYC B2B BIOMETRIC</strong>
                </span>
                <span className={`font-bold ${themeClass("text-[#F6E1C3]", "text-[#EA580C] font-black")}`}>
                  CHU KỲ: {activeTier.cycle}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
