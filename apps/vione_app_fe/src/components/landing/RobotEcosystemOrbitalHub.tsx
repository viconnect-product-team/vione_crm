import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Smartphone,
  Handshake,
  Bot,
  CalendarCheck,
  Lock,
  BookOpen,
  BarChart3,
  PlugZap,
  CheckCircle2,
  Sparkles,
  Zap,
  Radio,
  X,
  Target,
} from "lucide-react";

type ThemeMode = "dark" | "light" | "contrast";

export interface EcosystemModule {
  id: string;
  num: string;
  name: string;
  sub: string;
  metric: string;
  metricLabel: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  features: string[];
}

export const ECOSYSTEM_MODULES: EcosystemModule[] = [
  {
    id: "m1",
    num: "01",
    name: "QUẢN TRỊ HỘI VIÊN 360°",
    sub: "Cấu Trúc Tổ Chức & Chi Hội",
    metric: "100% SỐ HÓA",
    metricLabel: "Phân Quyền Đa Cấp",
    badge: "BIOMETRIC 360°",
    icon: Users,
    accent: "#D8B282",
    features: ["Cơ cấu BCH & Ban ngành", "Phân quyền chi hội tự động", "Gia hạn hội viên 1-chạm"],
  },
  {
    id: "m2",
    num: "02",
    name: "TITANIUM NFC 1-CHẠM",
    sub: "Apple & Google Wallet Ready",
    metric: "<0.5S",
    metricLabel: "Tốc Độ Đồng Bộ",
    badge: "NFC CHIP PASS",
    icon: Smartphone,
    accent: "#F6E1C3",
    features: ["Chạm thẻ mở Profile VIP", "Tích hợp ví Apple/Google", "Mã hóa E2E chống giả mạo"],
  },
  {
    id: "m3",
    num: "03",
    name: "SÀN GIAO THƯƠNG B2B",
    sub: "Khớp Lệnh Chuỗi Cung Ứng",
    metric: ">5.000 TỶ",
    metricLabel: "Khớp Lệnh Khép Kín",
    badge: "INTERNAL TRADING",
    icon: Handshake,
    accent: "#FFFFFF",
    features: ["Sàn cung ứng nội bộ", "Khớp lệnh mua - bán thực", "Triệt tiêu phí trung gian"],
  },
  {
    id: "m4",
    num: "04",
    name: "AI MATCHMAKING KERNEL",
    sub: "Ghép Nối Đối Tác Thông Minh",
    metric: "<1.2S",
    metricLabel: "Thuật Toán Match",
    badge: "NEURAL MATCH",
    icon: Bot,
    accent: "#D8B282",
    features: ["Phân tích nhu cầu tự động", "Radar đề xuất đối tác chuẩn", "Cảnh báo cơ hội giao thương"],
  },
  {
    id: "m5",
    num: "05",
    name: "SỰ KIỆN & CHECK-IN QR",
    sub: "Đại Hội & Biểu Quyết Số",
    metric: "1 GIÂY",
    metricLabel: "Check-in Quang Học",
    badge: "E-VOTING AUDIT",
    icon: CalendarCheck,
    accent: "#F6E1C3",
    features: ["Check-in QR 1 giây/khách", "Biểu quyết trực tiếp minh bạch", "Xuất báo cáo niên khóa ngay"],
  },
  {
    id: "m6",
    num: "06",
    name: "DEAL ROOM 1:1 MÃ HÓA",
    sub: "Phòng Thương Vụ Bí Mật",
    metric: "AES-256",
    metricLabel: "Mã Hóa Cấp Ngân Hàng",
    badge: "ZERO KNOWLEDGE",
    icon: Lock,
    accent: "#FFFFFF",
    features: ["Kênh đàm phán riêng tư 1:1", "Ký kết thỏa thuận số hóa", "Bảo mật bí mật thương vụ"],
  },
  {
    id: "m7",
    num: "07",
    name: "CỔNG TRI THỨC DOANH NGHIỆP",
    sub: "Thư Viện Pháp Lý & Quản Trị",
    metric: "500+ CHỦ ĐỀ",
    metricLabel: "Tài Liệu Thực Chiến",
    badge: "KNOWLEDGE HUB",
    icon: BookOpen,
    accent: "#C29B69",
    features: ["Thư viện pháp lý & thuế", "Tiêu chuẩn ngành & biểu mẫu", "Khóa đào tạo C-Level thực chiến"],
  },
  {
    id: "m8",
    num: "08",
    name: "DÒNG TIỀN & QUYẾT TOÁN",
    sub: "Đối Soát Tài Chính Tự Động",
    metric: "REALTIME",
    metricLabel: "Minh Bạch Niên Khóa",
    badge: "AUTO CASHFLOW",
    icon: BarChart3,
    accent: "#D8B282",
    features: ["Cổng thanh toán trực tuyến", "Tự động xuất biên lai hội phí", "Báo cáo quỹ hiệp hội minh bạch"],
  },
  {
    id: "m9",
    num: "09",
    name: "OPEN API & ERP MESH",
    sub: "Kết Nối Đa Nền Tảng Doanh Nghiệp",
    metric: "REST & GQL",
    metricLabel: "Đồng Bộ 2 Chiều",
    badge: "API GATEWAY",
    icon: PlugZap,
    accent: "#F6E1C3",
    features: ["Tương thích ERP / CRM / POS", "Kết nối Open Banking", "Webhooks đồng bộ tức thời"],
  },
];

interface RobotEcosystemOrbitalHubProps {
  themeMode: ThemeMode;
  onActivateDemo?: () => void;
}

export function RobotEcosystemOrbitalHub({
  themeMode,
  onActivateDemo,
}: RobotEcosystemOrbitalHubProps) {
  // Currently hovered module index
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Dynamic Cursor Coordinates for floating HUD tooltip
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Robot active push wave sequence state
  const [pushSequence, setPushSequence] = useState<number>(-1);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [waveCount, setWaveCount] = useState<number>(0);

  // Mobile selected module
  const [mobileSelectedIdx, setMobileSelectedIdx] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Launch sequential push wave animation
  const triggerSequentialPush = () => {
    setIsPushing(true);
    setPushSequence(-1);
    setWaveCount((c) => c + 1);

    // Push each node sequentially: 0 -> 1 -> 2 -> ... -> 8
    ECOSYSTEM_MODULES.forEach((_, idx) => {
      setTimeout(() => {
        setPushSequence(idx);
      }, idx * 160);
    });

    // Settle wave
    setTimeout(() => {
      setPushSequence(99); // all active
      setIsPushing(false);
    }, ECOSYSTEM_MODULES.length * 160 + 300);
  };

  // Auto trigger push wave on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerSequentialPush();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
  };

  const themeClass = (darkClass: string, lightClass: string, contrastClass?: string) => {
    if (themeMode === "contrast" && contrastClass) return contrastClass;
    if (themeMode === "dark" || themeMode === "contrast") return darkClass;
    return lightClass;
  };

  const activeModule =
    hoveredIdx !== null
      ? ECOSYSTEM_MODULES[hoveredIdx]
      : mobileSelectedIdx !== null
      ? ECOSYSTEM_MODULES[mobileSelectedIdx]
      : null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full max-w-6xl mx-auto py-12 flex flex-col items-center justify-center select-none"
    >
      {/* High-Tech Kernel Status Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8 relative z-20">
        <div
          className={`px-5 py-2 rounded-2xl border backdrop-blur-xl flex items-center gap-3 shadow-lg ${themeClass(
            "bg-[#091124]/90 border-[#D8B282]/40 text-[#F6E1C3]",
            "bg-white/95 border-[#D8B282]/60 text-[#785124] shadow-md",
            "bg-black border-yellow-400 text-yellow-300"
          )}`}
        >
          <div className="relative w-3 h-3">
            <span className="absolute inset-0 rounded-full bg-[#D8B282] animate-ping opacity-75" />
            <span className="relative block w-3 h-3 rounded-full bg-[#D8B282] shadow-[0_0_10px_#D8B282]" />
          </div>
          <span className="text-xs font-mono font-bold tracking-wider">
            VIONE OS 4.0 • ROBOT CORE ONLINE
          </span>
          <span className="w-1 h-3 bg-white/20" />
          <span className="text-[11px] font-mono opacity-80">9/9 MODULES ORBITING</span>
        </div>

        <button
          type="button"
          onClick={triggerSequentialPush}
          className="px-4 py-2 rounded-2xl border border-[#D8B282]/40 bg-[#D8B282]/10 text-[#F6E1C3] hover:bg-[#D8B282]/20 text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer hover:scale-105 active:scale-95"
        >
          <Zap className="w-3.5 h-3.5 text-[#D8B282] animate-pulse" />
          <span>{isPushing ? "ĐANG ĐẨY NĂNG LƯỢNG..." : "TÁI KÍCH HOẠT XUNG ĐẨY 9 KHỐI"}</span>
        </button>
      </div>

      {/* Background Cosmic Energy Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full bg-[radial-gradient(circle_at_center,rgba(216,178,130,0.18)_0%,transparent_70%)] blur-[90px]" />
      </div>

      {/* =========================================================================
          THE 360-DEGREE ORBITAL ARENA
          Desktop: 680px diameter (Radius = 270px)
          Tablet: 560px diameter (Radius = 220px)
          Mobile: 380px diameter (Radius = 145px)
          ========================================================================= */}
      <div className="relative w-[370px] h-[370px] sm:w-[560px] sm:h-[560px] md:w-[680px] md:h-[680px] flex items-center justify-center my-4">
        {/* Orbital Distance Guide Rings */}
        <div className="absolute inset-0 rounded-full border border-dashed border-[#D8B282]/35 animate-spin-slow pointer-events-none" />
        <div className="absolute inset-8 sm:inset-12 md:inset-14 rounded-full border border-dotted border-[#D8B282]/25 animate-spin-reverse pointer-events-none" />
        <div className="absolute inset-20 sm:inset-28 md:inset-32 rounded-full border border-white/10 animate-pulse pointer-events-none" />

        {/* Ambient Radar Sweep Laser Line */}
        <div
          className="absolute inset-0 rounded-full animate-radar-sweep pointer-events-none opacity-30"
          style={{
            background:
              "conic-gradient(from 0deg at 50% 50%, rgba(216,178,130,0.2) 0deg, rgba(246,225,195,0.1) 35deg, transparent 40deg)",
          }}
        />

        {/* SVG Laser Conduit Lines Connecting Robot Center to Each of the 9 Nodes */}
        <svg
          viewBox="0 0 680 680"
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        >
          <defs>
            <filter id="conduitGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {ECOSYSTEM_MODULES.map((mod, i) => {
            const angleDeg = i * (360 / 9) - 90;
            const angleRad = (angleDeg * Math.PI) / 180;
            const cx = 340;
            const cy = 340;
            const radius = 248;
            const x = cx + Math.cos(angleRad) * radius;
            const y = cy + Math.sin(angleRad) * radius;

            const isCurrentHovered = hoveredIdx === i || mobileSelectedIdx === i;
            const isPushed = pushSequence >= i;

            return (
              <g key={i}>
                {/* Connecting Laser Beam */}
                <line
                  x1={cx}
                  y1={cy}
                  x2={x}
                  y2={y}
                  stroke={isCurrentHovered ? mod.accent : "#D8B282"}
                  strokeWidth={isCurrentHovered ? "3.5" : "1.2"}
                  strokeDasharray={isCurrentHovered ? "6 3" : "4 6"}
                  opacity={isCurrentHovered ? 0.95 : isPushed ? 0.45 : 0.15}
                  filter="url(#conduitGlow)"
                  className={isCurrentHovered ? "animate-laser-conduit" : ""}
                />

                {/* Pulsing Energy Particle moving from center to node */}
                {isCurrentHovered && (
                  <circle
                    cx={x}
                    cy={y}
                    r="6"
                    fill={mod.accent}
                    className="animate-ping"
                    opacity="0.8"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* =========================================================================
            CENTER: THE COSMIC CYBER ROBOT (HẠT NHÂN ĐIỀU PHỐI)
            ========================================================================= */}
        <div
          onClick={triggerSequentialPush}
          className="relative z-30 w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full flex items-center justify-center cursor-pointer group"
          title="Chạm vào Robot để phát xung năng lượng đẩy 9 module"
        >
          {/* Shockwave expanding wave on click / push */}
          {isPushing && (
            <>
              <div className="absolute -inset-8 rounded-full border-2 border-[#D8B282] animate-ping pointer-events-none" />
              <div
                className="absolute -inset-16 rounded-full border border-[#F6E1C3] animate-ping pointer-events-none"
                style={{ animationDelay: "0.18s" }}
              />
            </>
          )}

          {/* Jet Plasma Aura Beneath Robot */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-20 h-10 bg-[#D8B282]/20 rounded-full blur-xl animate-pulse pointer-events-none" />

          {/* Floating Robot Body Frame with Gold Ring */}
          <motion.div
            animate={{
              y: [0, -10, 0],
              scale: isPushing ? [1, 1.08, 1] : 1,
            }}
            transition={{
              y: { duration: 3.8, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 0.3 },
            }}
            className="relative w-full h-full rounded-full p-2.5 bg-gradient-to-tr from-[#0F1D38] via-[#081226] to-[#040814] border-2 border-[#D8B282] shadow-[0_0_35px_rgba(216,178,130,0.35),inset_0_0_35px_rgba(216,178,130,0.4)] flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform"
          >
            {/* Robot SVG Illustration */}
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
              <defs>
                <linearGradient id="orbitRobotArmorGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FFF9EE" />
                  <stop offset="35%" stopColor="#F6E1C3" />
                  <stop offset="70%" stopColor="#D8B282" />
                  <stop offset="100%" stopColor="#0B132B" />
                </linearGradient>
                <linearGradient id="orbitCyberVisorGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8C653B" />
                  <stop offset="50%" stopColor="#D8B282" />
                  <stop offset="100%" stopColor="#FFF5E6" />
                </linearGradient>
                <linearGradient id="orbitChestCoreGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FFF5E6" />
                  <stop offset="40%" stopColor="#F6E1C3" />
                  <stop offset="70%" stopColor="#D8B282" />
                  <stop offset="100%" stopColor="#C29B69" />
                </linearGradient>
                <filter id="orbitNeonVisorGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Shoulders & Armor Plating */}
              <path
                d="M38,165 Q100,138 162,165 L172,195 Q100,182 28,195 Z"
                fill="url(#orbitRobotArmorGrad)"
                stroke="#FFF5E6"
                strokeWidth="2.4"
              />
              <circle
                cx="48"
                cy="170"
                r="9"
                fill="#D8B282"
                opacity="0.9"
              />
              <circle
                cx="152"
                cy="170"
                r="9"
                fill="#D8B282"
                opacity="0.9"
              />

              {/* Helmet Shell */}
              <ellipse
                cx="100"
                cy="94"
                rx="56"
                ry="53"
                fill="url(#orbitRobotArmorGrad)"
                stroke="#FFF5E6"
                strokeWidth="3"
              />

              {/* Antennas */}
              <line
                x1="44"
                y1="94"
                x2="30"
                y2="80"
                stroke="#D8B282"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="28" cy="78" r="4.5" fill="#F6E1C3" className="animate-ping" />
              <line
                x1="156"
                y1="94"
                x2="170"
                y2="80"
                stroke="#D8B282"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="172" cy="78" r="4.5" fill="#F6E1C3" className="animate-ping" />

              {/* Visor */}
              <rect
                x="54"
                y="72"
                width="92"
                height="40"
                rx="19"
                fill="#030A17"
                stroke="#D8B282"
                strokeWidth="2.5"
              />
              <path
                d="M58,86 Q100,72 142,86 Q100,100 58,86 Z"
                fill="url(#orbitCyberVisorGrad)"
                opacity="0.95"
              />

              {/* Scanning laser beam in visor */}
              <g className="animate-pulse">
                <line
                  x1="68"
                  y1="92"
                  x2="132"
                  y2="92"
                  stroke="#FFF"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
                <circle cx="100" cy="92" r="4.5" fill="#FFF" className="animate-ping" />
              </g>

              {/* Chest Quantum Core */}
              <g className="animate-pulse">
                <rect
                  x="84"
                  y="134"
                  width="32"
                  height="12"
                  rx="6"
                  fill="url(#orbitChestCoreGrad)"
                  stroke="#FFF"
                  strokeWidth="1.5"
                />
                <circle cx="100" cy="140" r="3.5" fill="#FFF" />
              </g>
            </svg>

            {/* Bottom Chest Badge */}
            <div className="absolute bottom-2.5 inset-x-0 flex justify-center pointer-events-none">
              <span className="px-2.5 py-0.5 rounded-full text-[7.5px] font-mono font-black tracking-widest bg-black/95 border border-[#D8B282] text-[#F6E1C3] shadow-md uppercase">
                ROBOT AI CORE
              </span>
            </div>
          </motion.div>
        </div>

        {/* =========================================================================
            9 ORBITAL NODES (BAO QUANH ROBOT THÀNH 1 HÌNH TRÒN)
            ========================================================================= */}
        {ECOSYSTEM_MODULES.map((mod, i) => {
          const MIcon = mod.icon;
          const angleDeg = i * (360 / 9) - 90;
          const angleRad = (angleDeg * Math.PI) / 180;

          // Responsive percentage radius for CSS positioning
          // Center is (50%, 50%), radius is ~36.5%
          const xPct = 50 + Math.cos(angleRad) * 36.5;
          const yPct = 50 + Math.sin(angleRad) * 36.5;

          const isCurrentHovered = hoveredIdx === i || mobileSelectedIdx === i;
          const isPushed = pushSequence >= i;

          return (
            <motion.div
              key={mod.id}
              style={{
                left: `${xPct}%`,
                top: `${yPct}%`,
                transform: "translate(-50%, -50%)",
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={
                isPushed
                  ? {
                      scale: isCurrentHovered ? 1.25 : 1,
                      opacity: 1,
                    }
                  : { scale: 0.3, opacity: 0.3 }
              }
              transition={{
                duration: 0.45,
                delay: i * 0.08,
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => {
                setMobileSelectedIdx(mobileSelectedIdx === i ? null : i);
              }}
              className="absolute z-20 cursor-pointer group flex flex-col items-center justify-center transition-transform"
            >
              {/* Outer Glowing Energy Ripple when Hovered or Active */}
              {isCurrentHovered && (
                <>
                  <div
                    className="absolute -inset-3 rounded-full animate-ping pointer-events-none opacity-75"
                    style={{ backgroundColor: `${mod.accent}30` }}
                  />
                  <div
                    className="absolute -inset-5 rounded-full border border-dashed animate-spin-slow pointer-events-none"
                    style={{ borderColor: mod.accent }}
                  />
                </>
              )}

              {/* Node Icon Circle */}
              <div
                className={`relative w-11 h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-300 shadow-xl ${
                  isCurrentHovered
                    ? themeMode === "light"
                      ? "scale-110 shadow-[0_0_30px_rgba(249,115,22,0.6)] ring-4 ring-[#F97316]/30"
                      : "scale-110 shadow-[0_0_30px_rgba(216,178,130,0.8)] ring-4 ring-white/40"
                    : "hover:scale-105"
                }`}
                style={{
                  backgroundColor: themeMode === "light"
                    ? (isCurrentHovered ? "#FFF7ED" : "#FFFFFF")
                    : (isCurrentHovered ? "#091224" : "#060A14"),
                  borderColor: themeMode === "light"
                    ? (isCurrentHovered ? "#EA580C" : "#F59E0B")
                    : (isCurrentHovered ? "#FFF5E6" : `${mod.accent}80`),
                  color: themeMode === "light"
                    ? (isCurrentHovered ? "#EA580C" : "#D97706")
                    : mod.accent,
                }}
              >
                {/* Module Number Tiny Chip */}
                <span
                  className="absolute -top-1.5 px-1.5 py-0.2 rounded-full text-[8px] font-mono font-black border"
                  style={{
                    backgroundColor: themeMode === "light" ? "#FFF7ED" : "#03060D",
                    borderColor: themeMode === "light" ? "#F97316" : mod.accent,
                    color: themeMode === "light" ? "#EA580C" : mod.accent,
                  }}
                >
                  #{mod.num}
                </span>

                <MIcon className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" />

                {/* Active telemetry ping dot */}
                <span
                  className="absolute bottom-0 right-0 w-2 h-2 rounded-full animate-ping"
                  style={{ backgroundColor: themeMode === "light" ? "#EA580C" : mod.accent }}
                />
              </div>

              {/* Short Module Label Pill */}
              <div
                className={`mt-1.5 px-2 py-0.5 rounded-md border text-[8.5px] sm:text-[9.5px] font-mono font-bold whitespace-nowrap transition-all ${
                  isCurrentHovered
                    ? themeMode === "light"
                      ? "bg-gradient-to-r from-[#F97316] to-[#D97706] text-white border-transparent shadow-md scale-105 font-black"
                      : "bg-black/95 text-white border-white shadow-lg scale-105"
                    : themeClass(
                        "bg-black/85 text-slate-200 border-[#D8B282]/40",
                        "bg-white/95 text-[#0F172A] border-2 border-[#F59E0B]/60 shadow-[0_2px_10px_rgba(245,158,11,0.2)] font-black",
                        "bg-black text-yellow-300 border-yellow-400"
                      )
                }`}
              >
                {mod.badge}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Interactive Helper Text */}
      <p
        className={`text-xs font-mono mt-4 flex items-center gap-1.5 tracking-wider font-bold ${themeClass(
          "text-[#D8B282]",
          "text-[#EA580C] font-black",
          "text-yellow-300"
        )}`}
      >
        <Sparkles className={`w-3.5 h-3.5 animate-pulse ${themeClass("text-[#D8B282]", "text-[#EA580C]", "text-yellow-300")}`} />
        <span>RÊ CHUỘT VÀO TỪNG ICON ĐỂ XEM NỘI DUNG CHI TIẾT TẠI CON TRỎ CHUỘT</span>
      </p>

      {/* =========================================================================
          DYNAMIC CURSOR-TRACKING FLOATING HUD TOOLTIP
          "khi người dùng di chuột vào thì mới hiện ra nội dung ứng ứng icon tại con trỏ chuột"
          ========================================================================= */}
      <AnimatePresence>
        {hoveredIdx !== null && activeModule && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            style={{
              position: "fixed",
              left:
                typeof window !== "undefined" && cursorPos.x > window.innerWidth - 360
                  ? cursorPos.x - 340
                  : cursorPos.x + 20,
              top:
                typeof window !== "undefined" && cursorPos.y > window.innerHeight - 280
                  ? cursorPos.y - 250
                  : cursorPos.y + 20,
              pointerEvents: "none",
              zIndex: 9999,
              backgroundColor: themeMode === "light" ? "rgba(255, 255, 255, 0.98)" : "rgba(5, 10, 22, 0.96)",
              borderColor: themeMode === "light" ? "#EA580C" : activeModule.accent,
              boxShadow: themeMode === "light"
                ? "0 15px 45px rgba(234, 88, 12, 0.25), 0 0 20px rgba(245, 158, 11, 0.2)"
                : `0 0 35px ${activeModule.accent}45, 0 20px 50px rgba(0,0,0,0.9)`,
            }}
            className="w-76 sm:w-84 p-5 rounded-3xl border-2 backdrop-blur-2xl select-none text-left"
          >
            {/* Sci-Fi Corner Brackets */}
            <div className={`absolute top-2 left-2 w-2.5 h-2.5 border-t-2 border-l-2 ${themeMode === "light" ? "border-[#EA580C]/70" : "border-white/60"}`} />
            <div className={`absolute top-2 right-2 w-2.5 h-2.5 border-t-2 border-r-2 ${themeMode === "light" ? "border-[#EA580C]/70" : "border-white/60"}`} />
            <div className={`absolute bottom-2 left-2 w-2.5 h-2.5 border-b-2 border-l-2 ${themeMode === "light" ? "border-[#EA580C]/70" : "border-white/60"}`} />
            <div className={`absolute bottom-2 right-2 w-2.5 h-2.5 border-b-2 border-r-2 ${themeMode === "light" ? "border-[#EA580C]/70" : "border-white/60"}`} />

            {/* Header: Module Number & Badge */}
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full border"
                style={{
                  color: themeMode === "light" ? "#EA580C" : activeModule.accent,
                  borderColor: themeMode === "light" ? "#F97316" : `${activeModule.accent}60`,
                  backgroundColor: themeMode === "light" ? "#FFF7ED" : `${activeModule.accent}15`,
                }}
              >
                MODULE #{activeModule.num} • {activeModule.badge}
              </span>
              <div className={`flex items-center gap-1.5 text-[9px] font-mono ${themeClass("text-[#F6E1C3]", "text-[#EA580C] font-black")}`}>
                <span className={`w-2 h-2 rounded-full animate-ping ${themeClass("bg-[#D8B282]", "bg-[#EA580C]")}`} />
                <span>ONLINE</span>
              </div>
            </div>

            {/* Module Title & Subtitle */}
            <h4 className={`text-base font-black uppercase tracking-tight ${themeClass("text-white", "text-[#0F172A]")}`}>
              {activeModule.name}
            </h4>
            <p className={`text-xs font-medium mt-0.5 ${themeClass("text-slate-300", "text-[#475569]")}`}>{activeModule.sub}</p>

            {/* Metric Highlight Box */}
            <div className={`my-3 p-2.5 rounded-xl border flex items-center justify-between ${themeClass("bg-white/5 border-white/10", "bg-[#FAF7F2] border-[#F59E0B]/30")}`}>
              <span className={`text-xs font-mono uppercase ${themeClass("text-slate-400", "text-[#64748B] font-bold")}`}>
                {activeModule.metricLabel}:
              </span>
              <span
                className="text-base font-black font-mono tracking-tight"
                style={{ color: themeMode === "light" ? "#EA580C" : activeModule.accent }}
              >
                {activeModule.metric}
              </span>
            </div>

            {/* 3 Checklist Features */}
            <div className={`space-y-1.5 border-t pt-2.5 ${themeClass("border-white/10", "border-[#F59E0B]/20")}`}>
              {activeModule.features.map((feat, fIdx) => (
                <div key={fIdx} className="flex items-center gap-2 text-xs">
                  <CheckCircle2
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: themeMode === "light" ? "#EA580C" : activeModule.accent }}
                  />
                  <span className={`font-medium ${themeClass("text-slate-200", "text-[#1E293B]")}`}>{feat}</span>
                </div>
              ))}
            </div>

            {/* Telemetry Footer */}
            <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[9px] font-mono ${themeClass("border-white/10 text-[#D8B282]", "border-[#F59E0B]/20 text-[#EA580C] font-bold")}`}>
              <span>⚡ VIONE KERNEL ACTIVE</span>
              <span>LATENCY &lt;0.05MS</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Fallback Docked Card (When touched on mobile) */}
      {mobileSelectedIdx !== null && activeModule && (
        <div className="lg:hidden w-full max-w-md mt-6 p-5 rounded-3xl border-2 backdrop-blur-2xl bg-[#060D1A]/95 text-left relative shadow-2xl">
          <button
            type="button"
            onClick={() => setMobileSelectedIdx(null)}
            className="absolute top-4 right-4 p-1 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full border"
              style={{
                color: activeModule.accent,
                borderColor: `${activeModule.accent}60`,
                backgroundColor: `${activeModule.accent}15`,
              }}
            >
              MODULE #{activeModule.num} • {activeModule.badge}
            </span>
          </div>

          <h4 className="text-lg font-black uppercase text-white">{activeModule.name}</h4>
          <p className="text-xs text-slate-300 mt-0.5">{activeModule.sub}</p>

          <div className="my-3 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-400">
              {activeModule.metricLabel}:
            </span>
            <span
              className="text-lg font-black font-mono"
              style={{ color: activeModule.accent }}
            >
              {activeModule.metric}
            </span>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-white/10">
            {activeModule.features.map((feat, fIdx) => (
              <div key={fIdx} className="flex items-center gap-2 text-xs">
                <CheckCircle2
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: activeModule.accent }}
                />
                <span className="font-medium text-slate-200">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
