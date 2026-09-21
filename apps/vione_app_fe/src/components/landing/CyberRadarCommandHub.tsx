import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useTime, useTransform, useAnimationFrame } from "framer-motion";
import {
  Disc,
  Crown,
  Users,
  Building2,
  Coins,
  Award,
  Globe2,
  UserCheck,
  Zap,
  ArrowRight,
  Cpu,
  Briefcase,
  Layers,
  Activity,
  Target,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface CyberRadarCommandHubProps {
  themeMode: "dark" | "light" | "contrast";
  onOpenDemoModal?: () => void;
}

interface AllianceTarget {
  id: number;
  name: string;
  category: string;
  shortTag: string;
  role: string;
  metric: string;
  matchScore: string;
  scale: string;
  responseTime: string;
  description: string;
  capabilities: string[];
  actionLabel: string;
  icon: React.ElementType;
  x: string;
  y: string;
  angle: number;
  color: string;
}

const ALLIANCE_TARGETS: AllianceTarget[] = [
  {
    id: 0,
    name: "Cố Vấn C-Level",
    category: "BAN CỐ VẤN & CHIẾN LƯỢC CẤP CAO",
    shortTag: "TOP 1% C-SUITE",
    role: "QUẢN TRỊ, M&A & CHIẾN LƯỢC VỐN",
    metric: "TOP 1%",
    matchScore: "99.8%",
    scale: ">1.000 Tỷ VNĐ",
    responseTime: "< 5 phút",
    description: "Đội ngũ chuyên gia và cựu lãnh đạo tập đoàn đa ngành, cố vấn tái cấu trúc, mua bán sáp nhập và hoạch định nguồn vốn tăng trưởng.",
    capabilities: [
      "Thẩm định thương vụ M&A và cố vấn chiến lược độc quyền",
      "Kết nối nguồn vốn tư nhân (PE) & quỹ đầu tư mạo hiểm (VC)",
      "Tái cấu trúc bộ máy quản trị chuẩn niêm yết quốc tế",
    ],
    actionLabel: "YÊU CẦU CỐ VẤN 1:1",
    icon: UserCheck,
    x: "50%",
    y: "12%",
    angle: 0,
    color: "#F6E1C3",
  },
  {
    id: 1,
    name: "HanoiBA",
    category: "HỘI DOANH NHÂN TRẺ HÀ NỘI",
    shortTag: "BẢO CHỨNG HANOIBA",
    role: "1.000+ DOANH NGHIỆP THỦ ĐÔ",
    metric: "99.8%",
    matchScore: "99.9%",
    scale: ">2.500 Tỷ Giao Thương",
    responseTime: "Tức thì",
    description: "Tổ chức hội viên nòng cốt trực thuộc Hội Doanh Nhân Trẻ Hà Nội, liên minh các thương hiệu đầu ngành với chuỗi cung ứng khép kín.",
    capabilities: [
      "Bảo chứng tín nhiệm doanh nhân và kết nối cung ứng chéo",
      "Xúc tiến thương mại định kỳ với hơn 1.000 doanh nghiệp C-Level",
      "Đặc quyền tham gia các phiên đàm phán hợp đồng khối lớn",
    ],
    actionLabel: "KẾT NỐI HỘI VIÊN HANOIBA",
    icon: Users,
    x: "82%",
    y: "28%",
    angle: 60,
    color: "#D8B282",
  },
  {
    id: 2,
    name: "300+ Hiệp Hội",
    category: "LIÊN MINH HIỆP HỘI 63 TỈNH THÀNH",
    shortTag: "63 TỈNH THÀNH",
    role: "MẠNG LƯỚI TOÀN QUỐC",
    metric: "300+",
    matchScore: "98.5%",
    scale: "50.000+ Doanh Nghiệp",
    responseTime: "< 1 giây",
    description: "Hệ thống trạm vệ tinh kết nối 300+ hiệp hội và câu lạc bộ doanh nghiệp trên toàn quốc, hỗ trợ thông thương hàng hóa liên vùng.",
    capabilities: [
      "Mở rộng thị trường phân phối tới 63 tỉnh thành tức thời",
      "Hợp tác chuỗi cung ứng vùng và tối ưu logistics liên tỉnh",
      "Biểu quyết số V-Voting và đồng bộ dữ liệu hội viên chuẩn hóa",
    ],
    actionLabel: "KHÁM PHÁ MẠNG LƯỚI 300+ HIỆP HỘI",
    icon: Building2,
    x: "82%",
    y: "72%",
    angle: 120,
    color: "#FFFFFF",
  },
  {
    id: 3,
    name: "Khối Ngân Hàng",
    category: "ĐỊNH CHẾ TÀI CHÍNH & TÍN DỤNG",
    shortTag: "TÍN DỤNG AA+",
    role: "BẢO LÃNH THANH TOÁN & ESCROW",
    metric: "<2S",
    matchScore: "99.5%",
    scale: "Hạn mức tới 50 Tỷ",
    responseTime: "< 2 giây",
    description: "Liên minh các ngân hàng thương mại hàng đầu cung cấp dịch vụ bảo lãnh giao thương, tài trợ chuỗi cung ứng (SCF) và tài khoản Escrow.",
    capabilities: [
      "Bảo lãnh hợp đồng B2B không cần thế chấp tài sản truyền thống",
      "Tài trợ vốn lưu động nhanh dựa trên lịch sử giao thương ViOne",
      "Cổng thanh toán tự động và đối soát tài chính minh bạch",
    ],
    actionLabel: "KÍCH HOẠT HẠN MỨC BẢO LÃNH",
    icon: Coins,
    x: "50%",
    y: "88%",
    angle: 180,
    color: "#D8B282",
  },
  {
    id: 4,
    name: "Quỹ Đầu Tư",
    category: "QUỸ PE/VC & TĂNG TRƯỞNG QUỐC TẾ",
    shortTag: "DEAL >5K TỶ",
    role: "VENTURE MATCH & M&A",
    metric: "$200M+",
    matchScore: "97.9%",
    scale: "Deal 50 - 5.000 Tỷ",
    responseTime: "Theo lịch hẹn",
    description: "Mạng lưới các quỹ đầu tư tư nhân và đầu tư mạo hiểm hàng đầu, tìm kiếm cơ hội rót vốn tăng trưởng và thoái vốn chiến lược.",
    capabilities: [
      "Tham gia phòng Deal Room 1:1 bảo mật tuyệt đối với nhà đầu tư",
      "Tư vấn cấu trúc vốn vòng Series A, B và chiến lược IPO",
      "Thẩm định tài chính và định giá doanh nghiệp độc lập",
    ],
    actionLabel: "VÀO PHÒNG DEAL ROOM 1:1",
    icon: Award,
    x: "18%",
    y: "72%",
    angle: 240,
    color: "#F6E1C3",
  },
  {
    id: 5,
    name: "Sàn Quốc Tế",
    category: "XÚC TIẾN THƯƠNG MẠI TOÀN CẦU",
    shortTag: "XUẤT KHẨU TOÀN CẦU",
    role: "20+ THỊ TRƯỜNG QUỐC TẾ",
    metric: "GLOBAL",
    matchScore: "96.5%",
    scale: "Kim ngạch >$150M",
    responseTime: "< 24 giờ",
    description: "Cổng xúc tiến giao thương xuyên biên giới, kết nối các nhà mua hàng quốc tế (Mỹ, EU, Nhật Bản, Hàn Quốc, ASEAN) với doanh nghiệp Việt.",
    capabilities: [
      "Hỗ trợ thủ tục hải quan và chứng chỉ xuất khẩu quốc tế",
      "Hợp đồng thương mại điện tử song ngữ tích hợp chữ ký số",
      "Kết nối trực tiếp đối tác thu mua OEM/ODM không qua trung gian",
    ],
    actionLabel: "MỞ GIAN HÀNG QUỐC TẾ",
    icon: Globe2,
    x: "18%",
    y: "28%",
    angle: 300,
    color: "#FFFFFF",
  },
];

const CAPITAL_SECTORS = [
  { id: 0, label: "Chuỗi Cung Ứng", pct: 42, color: "#F59E0B", icon: Briefcase, flow: ">2.100 Tỷ VNĐ", growth: "+38% YoY" },
  { id: 1, label: "Công Nghệ AI", pct: 26, color: "#EA580C", icon: Cpu, flow: ">1.300 Tỷ VNĐ", growth: "+52% YoY" },
  { id: 2, label: "Bất Động Sản", pct: 18, color: "#D97706", icon: Building2, flow: ">900 Tỷ VNĐ", growth: "+19% YoY" },
  { id: 3, label: "Vốn & C-Level", pct: 14, color: "#C2410C", icon: Coins, flow: ">700 Tỷ VNĐ", growth: "+45% YoY" },
];

export function CyberRadarCommandHub({
  themeMode,
  onOpenDemoModal,
}: CyberRadarCommandHubProps) {
  const [lockedIndex, setLockedIndex] = useState<number>(0);
  const [hoveredSector, setHoveredSector] = useState<number | null>(null);
  const [isManualPause, setIsManualPause] = useState<boolean>(false);
  const manualTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Full radar cycle: 6 nodes * 4s = 24000ms (exact 4s per 60 degrees!)
  const CYCLE_MS = 24000;
  const STEP_MS = 4000;

  const time = useTime();
  // Continuous smooth 360 degree rotation over 24 seconds (exact 4s per 60 degrees!)
  const beamRotate = useTransform(time, (t) => {
    return ((t % CYCLE_MS) / CYCLE_MS) * 360;
  });

  // Exactly at each 4-second mark as the beam touches the node (0s, 4s, 8s, 12s, 16s, 20s):
  useAnimationFrame((t) => {
    if (isManualPause) return;
    const currentStep = Math.floor((t % CYCLE_MS) / STEP_MS) % ALLIANCE_TARGETS.length;
    setLockedIndex((prev) => (prev !== currentStep ? currentStep : prev));
  });

  const handleSelectNode = (idx: number) => {
    setLockedIndex(idx);
    setIsManualPause(true);
    if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
    manualTimerRef.current = setTimeout(() => {
      setIsManualPause(false);
    }, 8000);
  };

  const activeTarget = ALLIANCE_TARGETS[lockedIndex] || ALLIANCE_TARGETS[0];
  const ActiveIcon = activeTarget.icon;

  const isLight = themeMode === "light";

  // Node coordinates for SVG laser beam
  const radarCoords = [
    { cx: 160, cy: 38 },  // 0: Cố Vấn C-Level
    { cx: 262, cy: 90 },  // 1: HanoiBA
    { cx: 262, cy: 230 }, // 2: 300+ Hiệp Hội
    { cx: 160, cy: 282 }, // 3: Khối Ngân Hàng
    { cx: 58, cy: 230 },  // 4: Quỹ Đầu Tư
    { cx: 58, cy: 90 },   // 5: Sàn Quốc Tế
  ];
  const currentCoord = radarCoords[lockedIndex] || radarCoords[0];

  return (
    <div className="w-full relative z-10">
      {/* Header with High Contrast in Light Theme */}
      <div className="text-center mb-8">
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-mono font-bold uppercase tracking-wider mb-2.5 backdrop-blur-md shadow-sm ${
            isLight
              ? "bg-[#FFF7ED] border-[#F59E0B]/50 text-[#EA580C]"
              : "bg-[#D8B282]/15 border-[#D8B282]/35 text-[#F6E1C3]"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isLight ? "bg-[#EA580C] shadow-[0_0_8px_#EA580C]" : "bg-[#D8B282]"} animate-pulse`} />
          <span>RADAR ĐIỀU HÀNH • VI ONE NETWORK 360°</span>
        </div>

        <h2
          className={`text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight ${
            isLight ? "text-[#0A0F1D]" : "text-white"
          }`}
        >
          RADAR QUÉT LIÊN MINH GIAO THƯƠNG 360°
        </h2>

        {/* Dynamic Telemetry Badges */}
        <div className="mt-3 flex flex-wrap justify-center items-center gap-2.5">
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold border shadow-xs flex items-center gap-1.5 ${
              isLight
                ? "bg-[#FFF7ED] border-[#F59E0B]/40 text-[#EA580C]"
                : "bg-[#D8B282]/15 border-[#D8B282]/30 text-[#F6E1C3]"
            }`}
          >
            <Target className={`w-3.5 h-3.5 ${isLight ? "text-[#EA580C]" : "text-[#D8B282]"}`} />
            QUÉT ĐỐI TÁC CHÍNH XÁC
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold border shadow-xs flex items-center gap-1.5 ${
              isLight
                ? "bg-white border-[#EA580C]/40 text-[#C2410C] shadow-sm"
                : "bg-white/10 border-white/20 text-white"
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isLight ? "text-[#EA580C]" : "text-[#D8B282]"}`} />
            TƯƠNG THÍCH 99.8%
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold border shadow-xs flex items-center gap-1.5 ${
              isLight
                ? "bg-[#FFF7ED] border-[#F59E0B]/40 text-[#EA580C]"
                : "bg-[#D8B282]/15 border-[#D8B282]/30 text-[#F6E1C3]"
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${isLight ? "text-[#EA580C]" : "text-[#D8B282]"}`} />
            300+ HIỆP HỘI
          </span>
        </div>
      </div>

      {/* Main Command Grid: Left Radar Centerpiece + Right Target Intelligence Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-8">
        {/* Left (7 cols): High-Tech Circular Radar Centerpiece without blinding bloom */}
        <div
          className={`lg:col-span-7 p-5 sm:p-7 rounded-3xl border backdrop-blur-2xl relative overflow-hidden flex flex-col items-center justify-between ${
            isLight
              ? "border-2 border-[#F59E0B]/50 bg-white/98 shadow-[0_15px_40px_rgba(245,158,11,0.12)]"
              : "border-[#D8B282]/30 bg-[#080D1A]/95 shadow-2xl"
          }`}
        >
          {/* Top Bar of Radar */}
          <div className="w-full flex items-center justify-between mb-2 border-b border-[#D8B282]/20 pb-3">
            <div className="flex items-center gap-2">
              <Disc className={`w-4 h-4 ${isLight ? "text-[#EA580C]" : "text-[#D8B282]"} animate-spin`} style={{ animationDuration: "8s" }} />
              <span
                className={`text-xs font-mono font-bold uppercase tracking-wider ${
                  isLight ? "text-[#EA580C]" : "text-[#F6E1C3]"
                }`}
              >
                RADAR QUÉT ĐỐI TÁC TỰ ĐỘNG
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Animated Equalizer Frequency Bars in Vibrant Orange/Gold */}
              <div className="flex items-end gap-0.5 h-4">
                {[8, 14, 6, 16, 10, 12].map((h, i) => (
                  <motion.span
                    key={i}
                    animate={{ height: [h, Math.max(3, (h * 1.4) % 16), h] }}
                    transition={{ duration: 0.9 + i * 0.15, repeat: Infinity, ease: "easeInOut" }}
                    className={`w-1 rounded-full ${isLight ? "bg-gradient-to-t from-[#EA580C] to-[#F59E0B]" : "bg-[#D8B282]"}`}
                    style={{ height: h }}
                  />
                ))}
              </div>
              <span
                className={`text-[10px] font-mono font-bold flex items-center gap-1.5 ml-1 ${
                  isLight ? "text-[#EA580C]" : "text-[#F6E1C3]"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isLight ? "bg-[#EA580C] shadow-[0_0_6px_#EA580C]" : "bg-[#D8B282]"}`} />
                HOẠT ĐỘNG
              </span>
            </div>
          </div>

          {/* The Circular Radar Screen (Crisp lines without glowing bloom) */}
          <div className="relative w-72 h-72 sm:w-84 sm:h-84 my-2 flex items-center justify-center">
            {/* SVG Radar Grids & Sweep */}
            <svg viewBox="0 0 320 320" className="w-full h-full">
              <defs>
                <radialGradient id="cyberRadarSweepGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={isLight ? "#EA580C" : "#D8B282"} stopOpacity={isLight ? "0.3" : "0.25"} />
                  <stop offset="70%" stopColor={isLight ? "#F59E0B" : "#F6E1C3"} stopOpacity="0.1" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>

              {/* Concentric Calibration Rings (Sharp lines, no glow) */}
              <circle cx="160" cy="160" r="148" fill="none" stroke={isLight ? "#F59E0B" : "#D8B282"} strokeWidth="1" strokeDasharray="6 6" opacity={isLight ? 0.35 : 0.25} />
              <circle cx="160" cy="160" r="108" fill="none" stroke={isLight ? "#F59E0B" : "#D8B282"} strokeWidth="1" strokeDasharray="4 4" opacity={isLight ? 0.45 : 0.35} />
              <circle cx="160" cy="160" r="68" fill="none" stroke={isLight ? "#F59E0B" : "#D8B282"} strokeWidth="1" opacity={isLight ? 0.6 : 0.45} />

              {/* Crosshairs */}
              <line x1="160" y1="12" x2="160" y2="308" stroke={isLight ? "#F59E0B" : "#D8B282"} strokeWidth="1" strokeDasharray="2 4" opacity={isLight ? 0.35 : 0.2} />
              <line x1="12" y1="160" x2="308" y2="160" stroke={isLight ? "#F59E0B" : "#D8B282"} strokeWidth="1" strokeDasharray="2 4" opacity={isLight ? 0.35 : 0.2} />

              {/* Compass Ticks */}
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i * 360) / 24;
                const isMajor = i % 6 === 0;
                const rad = (angle * Math.PI) / 180;
                const x1 = 160 + Math.cos(rad) * 142;
                const y1 = 160 + Math.sin(rad) * 142;
                const x2 = 160 + Math.cos(rad) * (isMajor ? 150 : 146);
                const y2 = 160 + Math.sin(rad) * (isMajor ? 150 : 146);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isMajor ? (isLight ? "#EA580C" : "#8C531B") : (isLight ? "#F59E0B" : "#D8B282")}
                    strokeWidth={isMajor ? 1.5 : 0.8}
                    opacity={isMajor ? 0.75 : 0.3}
                  />
                );
              })}

              {/* Clean Line connecting Center to Current Locked Target */}
              <g className="transition-all duration-300">
                <line
                  x1="160"
                  y1="160"
                  x2={currentCoord.cx}
                  y2={currentCoord.cy}
                  stroke={isLight ? "#EA580C" : "#D8B282"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.8"
                />
                <line
                  x1="160"
                  y1="160"
                  x2={currentCoord.cx}
                  y2={currentCoord.cy}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                  className="animate-laser-conduit"
                />
                {/* Target reticle */}
                <circle cx={currentCoord.cx} cy={currentCoord.cy} r="22" stroke={isLight ? "#EA580C" : "#D8B282"} strokeWidth="1.5" fill="none" opacity="0.9" />
                <circle cx={currentCoord.cx} cy={currentCoord.cy} r="28" stroke={isLight ? "#F59E0B" : "#D8B282"} strokeWidth="1" strokeDasharray="4 4" fill="none" className="animate-spin" style={{ animationDuration: "8s" }} />
                <line x1={currentCoord.cx - 8} y1={currentCoord.cy} x2={currentCoord.cx + 8} y2={currentCoord.cy} stroke={isLight ? "#EA580C" : "#D8B282"} strokeWidth="1.2" />
                <line x1={currentCoord.cx} y1={currentCoord.cy - 8} x2={currentCoord.cx} y2={currentCoord.cy + 8} stroke={isLight ? "#EA580C" : "#D8B282"} strokeWidth="1.2" />
              </g>

              {/* Sweeping Laser Wedge in Clean Gold/Orange: exactly 4s per node (24s / 360deg) */}
              <motion.g style={{ rotate: beamRotate, transformOrigin: "160px 160px" }}>
                <path d="M160,160 L160,15 A145,145 0 0,0 57.5,57.5 Z" fill="url(#cyberRadarSweepGrad)" />
                <line x1="160" y1="160" x2="160" y2="15" stroke={isLight ? "#EA580C" : "#D8B282"} strokeWidth="2" strokeLinecap="round" opacity="0.9" />
                <circle cx="160" cy="15" r="3" fill={isLight ? "#EA580C" : "#FFFFFF"} />
              </motion.g>
            </svg>

            {/* Center ViOne Crown Quantum Nucleus */}
            <div className={`absolute inset-0 m-auto w-13 h-13 rounded-full flex flex-col items-center justify-center shadow-md z-10 border-2 border-white ${
              isLight ? "bg-gradient-to-br from-[#FFF7ED] via-[#F59E0B] to-[#EA580C] text-white" : "bg-gradient-to-br from-[#FFF5E6] via-[#D8B282] to-[#8C653B] text-slate-950"
            }`}>
              <Crown className="w-4.5 h-4.5 fill-current" />
              <span className="text-[7.5px] font-black uppercase tracking-tighter">VIONE</span>
            </div>

            {/* 6 Target Nodes Distributed on Radar */}
            {ALLIANCE_TARGETS.map((target, idx) => {
              const TargetIcon = target.icon;
              const isLocked = lockedIndex === idx;

              return (
                <div
                  key={target.id}
                  onClick={() => handleSelectNode(idx)}
                  style={{
                    left: target.x,
                    top: target.y,
                    transform: `translate(-50%, -50%) ${isLocked ? "scale(1.2)" : "scale(1)"}`,
                    zIndex: isLocked ? 40 : 10,
                  }}
                  className="absolute cursor-pointer transition-all duration-300 group"
                >
                  {/* Node Circle */}
                  <div
                    className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                      isLocked
                        ? isLight
                          ? "bg-[#EA580C] border-white text-white shadow-[0_4px_15px_rgba(234,88,12,0.4)] ring-4 ring-[#F59E0B]/50"
                          : "bg-[#141E33] border-[#F6E1C3] text-white shadow-md ring-2 ring-[#D8B282]/50"
                        : isLight
                        ? "bg-white border-2 border-[#F59E0B]/60 text-[#EA580C] hover:border-[#EA580C] hover:bg-[#FFF7ED] shadow-sm"
                        : "bg-[#080D1A] border-[#D8B282]/40 text-[#D8B282] hover:border-[#F6E1C3] shadow-xs"
                    }`}
                  >
                    <TargetIcon className={`w-4 h-4 transition-transform ${isLocked ? "scale-110" : ""}`} />
                  </div>

                  {/* Clean Node Label */}
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-0.5 rounded-md border text-[9px] font-mono whitespace-nowrap transition-all duration-300 flex items-center gap-1 ${
                      isLocked
                        ? isLight
                          ? "bg-[#EA580C] border-white text-white font-black shadow-md"
                          : "bg-[#0A0F1D] border-[#D8B282] text-[#F6E1C3] font-bold shadow-md"
                        : isLight
                        ? "bg-white/98 border border-[#F59E0B]/40 text-[#0F172A] font-bold shadow-xs"
                        : "bg-black/85 border-[#D8B282]/30 text-slate-200 font-medium opacity-85"
                    }`}
                  >
                    {isLocked && <span className={`w-1.5 h-1.5 rounded-full ${isLight ? "bg-white" : "bg-[#D8B282]"} shrink-0`} />}
                    <span>{target.name}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Live Target Hint */}
          <div className="w-full mt-2 pt-2 border-t border-[#D8B282]/20 flex items-center justify-between text-xs">
            <span className={`font-mono text-[10px] ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              BẤM VÀO TỪNG NODE HOẶC ĐỂ RADAR QUÉT TỰ ĐỘNG
            </span>
            <span className={`font-mono font-bold text-[10px] ${isLight ? "text-[#EA580C]" : "text-[#F6E1C3]"}`}>
              MỤC TIÊU 0{lockedIndex + 1}/06
            </span>
          </div>
        </div>

        {/* Right (5 cols): Dynamic Target Intelligence Dossier (HIỂN THỊ THÔNG TIN KHI RADAR QUÉT TỚI) */}
        <div
          onMouseEnter={() => setIsManualPause(true)}
          onMouseLeave={() => setIsManualPause(false)}
          className={`lg:col-span-5 p-6 sm:p-7 rounded-3xl border backdrop-blur-2xl relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${
            isLight
              ? "border-2 border-[#F59E0B]/50 bg-white/98 shadow-[0_15px_40px_rgba(245,158,11,0.12)]"
              : "border-[#D8B282]/35 bg-[#080D1A]/95 shadow-2xl"
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTarget.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28 }}
              className="flex flex-col h-full justify-between"
            >
              <div>
                {/* Header Tag of Target */}
                <div className="flex items-center justify-between border-b border-[#D8B282]/20 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                        isLight ? "bg-[#FFF7ED] text-[#EA580C]" : "bg-[#D8B282]/20 text-[#F6E1C3]"
                      }`}
                    >
                      <ActiveIcon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
                        isLight ? "text-[#EA580C]" : "text-[#D8B282]"
                      }`}
                    >
                      {activeTarget.category}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      isLight
                        ? "bg-[#FFF7ED] border-[#F59E0B]/40 text-[#EA580C]"
                        : "bg-[#D8B282]/15 border-[#D8B282]/35 text-[#F6E1C3]"
                    }`}
                  >
                    {activeTarget.shortTag}
                  </span>
                </div>

                {/* Target Title & Role */}
                <h3
                  className={`text-xl sm:text-2xl font-black uppercase tracking-tight ${
                    isLight ? "text-[#0A0F1D]" : "text-white"
                  }`}
                >
                  {activeTarget.name}
                </h3>
                <p
                  className={`text-xs font-mono font-bold mt-1 ${
                    isLight ? "text-[#EA580C]" : "text-[#F6E1C3]"
                  }`}
                >
                  {activeTarget.role}
                </p>

                {/* Description */}
                <p
                  className={`text-xs sm:text-sm mt-3 leading-relaxed ${
                    isLight ? "text-slate-700" : "text-slate-300"
                  }`}
                >
                  {activeTarget.description}
                </p>

                {/* Telemetry Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 my-4">
                  <div
                    className={`p-2.5 rounded-xl border text-center ${
                      isLight ? "bg-[#FAF7F2] border-[#F59E0B]/30" : "bg-white/5 border-white/10"
                    }`}
                  >
                    <span className={`text-[9px] font-mono block ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      TƯƠNG THÍCH
                    </span>
                    <span
                      className={`text-sm font-black font-mono mt-0.5 block ${
                        isLight ? "text-[#EA580C]" : "text-[#F6E1C3]"
                      }`}
                    >
                      {activeTarget.matchScore}
                    </span>
                  </div>

                  <div
                    className={`p-2.5 rounded-xl border text-center ${
                      isLight ? "bg-[#FAF7F2] border-[#F59E0B]/30" : "bg-white/5 border-white/10"
                    }`}
                  >
                    <span className={`text-[9px] font-mono block ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      QUY MÔ
                    </span>
                    <span
                      className={`text-xs font-black font-mono mt-0.5 block truncate ${
                        isLight ? "text-[#0A0F1D]" : "text-white"
                      }`}
                    >
                      {activeTarget.scale}
                    </span>
                  </div>

                  <div
                    className={`p-2.5 rounded-xl border text-center ${
                      isLight ? "bg-[#FAF7F2] border-[#F59E0B]/30" : "bg-white/5 border-white/10"
                    }`}
                  >
                    <span className={`text-[9px] font-mono block ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      PHẢN HỒI
                    </span>
                    <span
                      className={`text-sm font-black font-mono mt-0.5 block ${
                        isLight ? "text-[#EA580C]" : "text-[#F6E1C3]"
                      }`}
                    >
                      {activeTarget.responseTime}
                    </span>
                  </div>
                </div>

                {/* Key Capabilities Checklist */}
                <div className="space-y-2 border-t border-[#D8B282]/20 pt-3">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${isLight ? "text-[#C2410C] font-bold" : "text-slate-400"}`}>
                    ĐẶC QUYỀN HỢP TÁC CHIẾN LƯỢC:
                  </span>
                  {activeTarget.capabilities.map((cap, cIdx) => (
                    <div key={cIdx} className="flex items-start gap-2 text-xs">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? "text-[#EA580C]" : "text-[#D8B282]"}`}
                      />
                      <span className={`font-medium leading-snug ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                        {cap}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-[#D8B282]/20">
                <button
                  type="button"
                  onClick={onOpenDemoModal}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-[#F97316] via-[#EA580C] to-[#D97706] text-white hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-[0_8px_25px_rgba(234,88,12,0.35)]"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>{activeTarget.actionLabel}</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* =========================================================================
          LUÂN CHUYỂN VỐN B2B (>5.000 TỶ) - CHUYỂN XUỐNG DƯỚI ĐỔI CHỖ CHO POPUP THÔNG TIN
          ========================================================================= */}
      <div
        className={`w-full p-6 sm:p-8 rounded-3xl border backdrop-blur-2xl shadow-2xl mb-8 ${
          isLight
            ? "border-2 border-[#F59E0B]/50 bg-white/98 shadow-[0_15px_40px_rgba(245,158,11,0.12)]"
            : "border-[#D8B282]/30 bg-[#080D1A]/95"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-[#D8B282]/20 pb-4 gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isLight ? "bg-[#FFF7ED] text-[#EA580C]" : "bg-[#D8B282]/15 text-[#F6E1C3]"}`}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base sm:text-lg font-black uppercase tracking-tight ${isLight ? "text-[#0A0F1D]" : "text-white"}`}>
                LUÂN CHUYỂN VỐN B2B KHÉP KÍN & CHUỖI CUNG ỨNG
              </h3>
              <p className={`text-xs font-mono ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                DÒNG CHẢY GIAO THƯƠNG THỰC CHẤT NỘI KHỐI LIÊN MINH
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold self-start sm:self-auto border ${
              isLight
                ? "bg-[#FFF7ED] border-[#F59E0B]/40 text-[#EA580C]"
                : "bg-[#D8B282]/15 border-[#D8B282]/35 text-[#F6E1C3]"
            }`}
          >
            TỔNG QUY MÔ &gt;5.000 TỶ VNĐ
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Donut Turbine Chart (4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                {/* Segment 1: 42% (Gold) */}
                <circle
                  cx="100"
                  cy="100"
                  r="68"
                  fill="none"
                  stroke={isLight ? "#F59E0B" : "#D8B282"}
                  strokeWidth="18"
                  strokeDasharray="179 248"
                  strokeDashoffset="0"
                  className="transition-all duration-300"
                />
                {/* Segment 2: 26% (Orange) */}
                <circle
                  cx="100"
                  cy="100"
                  r="68"
                  fill="none"
                  stroke={isLight ? "#EA580C" : "#F6E1C3"}
                  strokeWidth="18"
                  strokeDasharray="111 316"
                  strokeDashoffset="-179"
                  className="transition-all duration-300"
                />
                {/* Segment 3: 18% (Amber) */}
                <circle
                  cx="100"
                  cy="100"
                  r="68"
                  fill="none"
                  stroke={isLight ? "#D97706" : "#C29B69"}
                  strokeWidth="18"
                  strokeDasharray="77 350"
                  strokeDashoffset="-290"
                  className="transition-all duration-300"
                />
                {/* Segment 4: 14% (Deep Orange/Red) */}
                <circle
                  cx="100"
                  cy="100"
                  r="68"
                  fill="none"
                  stroke={isLight ? "#C2410C" : "#8C653B"}
                  strokeWidth="18"
                  strokeDasharray="60 367"
                  strokeDashoffset="-367"
                  className="transition-all duration-300"
                />
              </svg>

              {/* Inside Turbine Core */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <p
                  className={`text-2xl font-black ${
                    isLight ? "text-[#EA580C]" : "text-transparent bg-clip-text bg-gradient-to-r from-white via-[#F6E1C3] to-[#D8B282]"
                  }`}
                >
                  &gt;5.000
                </p>
                <p
                  className={`text-[9.5px] font-mono font-bold uppercase tracking-wider ${
                    isLight ? "text-[#D97706]" : "text-[#D8B282]"
                  }`}
                >
                  TỶ GIAO THƯƠNG
                </p>
              </div>
            </div>
          </div>

          {/* 4 Sector Cards (8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {CAPITAL_SECTORS.map((sec) => {
              const SecIcon = sec.icon;
              const isHov = hoveredSector === sec.id;

              return (
                <div
                  key={sec.id}
                  onMouseEnter={() => setHoveredSector(sec.id)}
                  onMouseLeave={() => setHoveredSector(null)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isHov
                      ? isLight
                        ? "bg-white border-2 border-[#EA580C] shadow-md scale-[1.01]"
                        : "bg-[#D8B282]/15 border-[#D8B282] scale-[1.01]"
                      : isLight
                      ? "bg-white/90 border-2 border-[#F59E0B]/30 hover:border-[#EA580C]"
                      : "bg-black/30 border-white/10 hover:border-[#D8B282]/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isLight ? "bg-[#FFF7ED] text-[#EA580C]" : "bg-[#D8B282]/20 text-[#F6E1C3]"
                        }`}
                      >
                        <SecIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className={`text-xs font-bold block ${isLight ? "text-[#0A0F1D]" : "text-white"}`}>
                          {sec.label}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-600 font-bold">{sec.growth}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-mono font-bold block ${isLight ? "text-[#EA580C]" : "text-[#F6E1C3]"}`}>
                        {sec.pct}%
                      </span>
                      <span className={`text-[10px] font-mono ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                        {sec.flow}
                      </span>
                    </div>
                  </div>

                  {/* Progress Fill Bar */}
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? "bg-slate-200" : "bg-white/10"}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${sec.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: sec.id * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: sec.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
