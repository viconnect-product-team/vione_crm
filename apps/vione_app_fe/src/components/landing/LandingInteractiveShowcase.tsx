import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  IdCard,
  Handshake,
  Calendar,
  Crown,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Radio,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";

export interface ShowcaseSlide {
  id: string;
  icon: any;
  tabLabel: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  peekStat: string;
  peekHighlight: string;
  highlights: string[];
  ctaLabel: string;
  ctaLink: string;
  accentColor: string;
  silverTone: "platinum" | "blue" | "purple" | "orange" | "gold";
  activeBorder: string;
  activeBg: string;
  iconBg: string;
  indicatorBg: string;
  badgeStyle: string;
  previewType: "card" | "b2b" | "event" | "perks";
}

const DEFAULT_SLIDES: ShowcaseSlide[] = [
  {
    id: "nfc-pass",
    icon: IdCard,
    tabLabel: "Thẻ VIP Số & NFC",
    badge: "1-TOUCH DIGITAL PASS",
    title: "Thẻ Định Danh Bạch Kim 1-Chạm NFC",
    subtitle: "Đồng bộ Apple Wallet & Google Wallet",
    description:
      "Đột phá thay thế hoàn toàn danh thiếp giấy truyền thống. Chạm nhẹ vào điện thoại đối tác để mở ngay profile cao cấp, danh mục sản phẩm và hồ sơ năng lực doanh nghiệp.",
    peekStat: "⚡ Tốc độ chạm 0.2s",
    peekHighlight: "Đồng bộ Apple & Google Wallet tức thì",
    highlights: [
      "Khắc laser kim loại Titanium & chip NFC siêu bền mã hóa bảo mật",
      "Cập nhật thông tin doanh nghiệp thời gian thực không bao giờ hết hạn",
      "Tích hợp QR động chống sao chép và chia sẻ đa nền tảng 1-chạm",
    ],
    ctaLabel: "Trải nghiệm Thẻ Số ngay →",
    ctaLink: "/connect-app/card-scan",
    accentColor: "from-white via-[#CBD5E1] to-[#94A3B8]",
    silverTone: "platinum",
    activeBorder: "border-slate-200 ring-2 ring-slate-300/40 shadow-[0_10px_30px_rgba(226,232,240,0.3),inset_0_0_20px_rgba(255,255,255,0.12)]",
    activeBg: "bg-gradient-to-br from-[#1E293B]/95 via-[#0F172A]/95 to-[#020617]",
    iconBg: "bg-gradient-to-br from-[#FFFFFF] via-[#CBD5E1] to-[#64748B] text-slate-950 font-black shadow-[0_0_16px_rgba(226,232,240,0.65)]",
    indicatorBg: "bg-gradient-to-r from-white via-slate-200 to-slate-400 shadow-[0_0_12px_#CBD5E1]",
    badgeStyle: "border-slate-300/50 bg-slate-200/15 text-slate-100",
    previewType: "card",
  },
  {
    id: "b2b-trade",
    icon: Handshake,
    tabLabel: "Sàn B2B & AI Match",
    badge: "AI MATCHMAKING ENGINE",
    title: "Sàn Giao Thương B2B & Trợ Lý AI Matchmaking",
    subtitle: "Kết nối chuỗi cung ứng khép kín >5.000 Tỷ VNĐ",
    description:
      "Hệ thống phân tích nhu cầu mua - bán - gọi vốn tự động đề xuất chính xác các Chủ tịch và CEO phù hợp nhất trong mạng lưới trong 3 giây, kèm phòng đàm phán bảo mật.",
    peekStat: "⚡ Khớp lệnh trong 3s",
    peekHighlight: "Chuỗi cung ứng khép kín >5.000 Tỷ VNĐ",
    highlights: [
      "AI thuật toán phân tích nhu cầu cung - cầu theo từng ngành hàng",
      "Cơ chế bảo chứng uy tín hội đồng thẩm định C-Level",
      "Deal Room đàm phán 1-1 riêng tư kèm mẫu hợp đồng pháp lý",
    ],
    ctaLabel: "Khám Phá Sàn B2B →",
    ctaLink: "/connect-app/network",
    accentColor: "from-[#FFFFFF] via-[#F6E1C3] to-[#D8B282]",
    silverTone: "gold",
    activeBorder: "border-[#D8B282] ring-2 ring-[#D8B282]/40 shadow-[0_10px_30px_rgba(216,178,130,0.35),inset_0_0_20px_rgba(216,178,130,0.18)]",
    activeBg: "bg-gradient-to-br from-[#121B2A]/95 via-[#0A101C]/95 to-[#040810]",
    iconBg: "bg-gradient-to-br from-[#FFFFFF] via-[#F6E1C3] to-[#D8B282] text-slate-950 font-black shadow-[0_0_16px_rgba(216,178,130,0.7)]",
    indicatorBg: "bg-gradient-to-r from-[#FFFFFF] via-[#F6E1C3] to-[#D8B282] shadow-[0_0_12px_#D8B282]",
    badgeStyle: "border-[#D8B282]/50 bg-[#D8B282]/15 text-[#F6E1C3]",
    previewType: "b2b",
  },
  {
    id: "qr-events",
    icon: Calendar,
    tabLabel: "Sự Kiện & Check-in QR",
    badge: "LIGHTNING CHECK-IN",
    title: "Hội Nghị Thượng Đỉnh & Check-in QR 1 Giây",
    subtitle: "Diễn đàn kết nối, Business Tour & Gala Dinner",
    description:
      "Đặt chỗ vé VIP, quản lý lịch trình tọa đàm và quét mã QR vé tại cửa trong 1 giây không cần xếp hàng. Tự động kết nối hồ sơ với toàn bộ đại biểu tham gia cùng sự kiện.",
    peekStat: "⚡ Check-in 1 giây",
    peekHighlight: "Tự động kết nối 500+ đại biểu C-Level",
    highlights: [
      "Check-in tức thì qua QR mã hóa bảo mật chống vé giả",
      "Xem danh sách đại biểu tham dự trước sự kiện để hẹn gặp B2B",
      "Tải tài liệu diễn đàn & hình ảnh sự kiện chất lượng cao",
    ],
    ctaLabel: "Xem Lịch Sự Kiện →",
    ctaLink: "/connect-app/calendar",
    accentColor: "from-[#FFFFFF] via-[#F6E1C3] to-[#D8B282]",
    silverTone: "gold",
    activeBorder: "border-[#D8B282] ring-2 ring-[#D8B282]/40 shadow-[0_10px_30px_rgba(216,178,130,0.35),inset_0_0_20px_rgba(216,178,130,0.18)]",
    activeBg: "bg-gradient-to-br from-[#121B2A]/95 via-[#0A101C]/95 to-[#040810]",
    iconBg: "bg-gradient-to-br from-[#FFFFFF] via-[#F6E1C3] to-[#D8B282] text-slate-950 font-black shadow-[0_0_16px_rgba(216,178,130,0.7)]",
    indicatorBg: "bg-gradient-to-r from-[#FFFFFF] via-[#F6E1C3] to-[#D8B282] shadow-[0_0_12px_#D8B282]",
    badgeStyle: "border-[#D8B282]/50 bg-[#D8B282]/15 text-[#F6E1C3]",
    previewType: "event",
  },
  {
    id: "vip-perks",
    icon: Crown,
    tabLabel: "Đặc Quyền C-Level",
    badge: "EXCLUSIVE PRIVILEGES",
    title: "Kho Đặc Quyền & Ưu Đãi Nội Bộ Độc Quyền",
    subtitle: "Voucher đối tác khách sạn 5 sao, tài chính & logistics",
    description:
      "Mạng lưới ưu đãi chéo giữa các doanh nghiệp hội viên: giảm giá 15% - 50% các dịch vụ golf, phòng chờ thương gia, khách sạn cao cấp, tư vấn thuế và kiểm toán độc quyền.",
    peekStat: "⚡ Tiết kiệm 15% - 50%",
    peekHighlight: "Phòng chờ VIP sân bay & Mastermind kín",
    highlights: [
      "Mở khóa hàng trăm đặc quyền dịch vụ cao cấp toàn quốc",
      "Chương trình giao lưu thể thao Golf & Mastermind kín định kỳ",
      "Bảo hộ bản quyền thương hiệu và xúc tiến truyền thông báo chí",
    ],
    ctaLabel: "Khám phá Đặc Quyền →",
    ctaLink: "/m/perks",
    accentColor: "from-[#FFFFFF] via-[#F6E1C3] to-[#D8B282]",
    silverTone: "gold",
    activeBorder: "border-[#D8B282] ring-2 ring-[#D8B282]/40 shadow-[0_10px_30px_rgba(216,178,130,0.35),inset_0_0_20px_rgba(216,178,130,0.18)]",
    activeBg: "bg-gradient-to-br from-[#18120B]/95 via-[#100C06]/95 to-[#060402]",
    iconBg: "bg-gradient-to-br from-[#FFFFFF] via-[#F6E1C3] to-[#D8B282] text-slate-950 font-black shadow-[0_0_16px_rgba(216,178,130,0.7)]",
    indicatorBg: "bg-gradient-to-r from-[#FFFFFF] via-[#F6E1C3] to-[#D8B282] shadow-[0_0_12px_#D8B282]",
    badgeStyle: "border-[#D8B282]/50 bg-[#D8B282]/15 text-[#F6E1C3]",
    previewType: "perks",
  },
];

export function LandingInteractiveShowcase({ themeMode = "light" }: { themeMode?: "dark" | "light" | "contrast" }) {
  const [activeIndex, setActiveIndex] = useState(1); // Active on B2B match matching image 3
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<number | null>(null);
  const [cardFlip, setCardFlip] = useState(false);

  // Auto-slide every 7s unless user interacts
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % DEFAULT_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [isHovered]);

  const current = DEFAULT_SLIDES[activeIndex];
  const Icon = current.icon;

  const nextSlide = () => setActiveIndex((prev) => (prev + 1) % DEFAULT_SLIDES.length);
  const prevSlide = () => setActiveIndex((prev) => (prev - 1 + DEFAULT_SLIDES.length) % DEFAULT_SLIDES.length);

  const getSlideMotionProps = (idx: number): any => {
    switch (idx) {
      case 0: // NFC Card: 3D Hyperspace Warp & Gravitational Snap
        return {
          initial: { opacity: 0, scale: 0.72, rotateZ: -7, filter: "blur(12px)" },
          animate: { opacity: 1, scale: 1, rotateZ: 0, filter: "blur(0px)" },
          exit: { opacity: 0, scale: 1.25, rotateZ: 5, filter: "blur(10px)" },
          transition: { type: "spring", stiffness: 120, damping: 18, mass: 0.9 },
        };
      case 1: // B2B Match: Quantum Stargate Singularity Iris Unfold
        return {
          initial: { opacity: 0, clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)", scale: 0.85 },
          animate: { opacity: 1, clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", scale: 1 },
          exit: { opacity: 0, clipPath: "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)", scale: 0.9 },
          transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
        };
      case 2: // Events: Cybernetic Laser Curtain Sweep
        return {
          initial: { opacity: 0, clipPath: "inset(0 0 100% 0)", filter: "brightness(1.8)" },
          animate: { opacity: 1, clipPath: "inset(0 0 0% 0)", filter: "brightness(1)" },
          exit: { opacity: 0, clipPath: "inset(100% 0 0 0)", filter: "brightness(1.4)" },
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
        };
      case 3: // Perks: Prismatic Holographic Tilt & Unfold
      default:
        return {
          initial: { opacity: 0, rotateY: 30, scale: 0.88, filter: "blur(8px)" },
          animate: { opacity: 1, rotateY: 0, scale: 1, filter: "blur(0px)" },
          exit: { opacity: 0, rotateY: -25, scale: 0.92, filter: "blur(8px)" },
          transition: { duration: 0.5, ease: "easeOut" },
        };
    }
  };

  const themeClass = (darkClass: string, lightClass: string, contrastClass?: string) => {
    if (themeMode === "contrast" && contrastClass) return contrastClass;
    if (themeMode === "dark" || themeMode === "contrast") return darkClass;
    return lightClass;
  };

  return (
    <div
      className={`relative w-full rounded-[36px] border p-6 sm:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.85)] backdrop-blur-3xl overflow-hidden transition-colors duration-500 ${themeClass(
        "border-[#D8B282]/40 bg-gradient-to-b from-[#0C1424]/95 via-[#070D1A]/98 to-[#03060E] text-white",
        "border-[#D8B282]/50 bg-white/95 text-[#181512] shadow-[0_20px_60px_rgba(140,101,59,0.12)]",
        "border-yellow-400 bg-black text-yellow-300"
      )}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dynamic Keyframes for 3D Vibration & Glow Pulses */}
      <style>
        {`
          @keyframes vibrateCard {
            0% { transform: translateY(-4px) rotateX(4deg) scale(1.03); box-shadow: 0 0 25px rgba(216,178,130,0.5); }
            25% { transform: translateY(-5px) rotateX(3deg) scale(1.035) rotateY(1deg); box-shadow: 0 0 35px rgba(216,178,130,0.7); }
            50% { transform: translateY(-4px) rotateX(4deg) scale(1.03) rotateY(-1deg); box-shadow: 0 0 30px rgba(216,178,130,0.6); }
            75% { transform: translateY(-5px) rotateX(5deg) scale(1.035) rotateY(1deg); box-shadow: 0 0 40px rgba(216,178,130,0.75); }
            100% { transform: translateY(-4px) rotateX(4deg) scale(1.03); box-shadow: 0 0 25px rgba(216,178,130,0.5); }
          }
          .animate-vibrate-glow:hover {
            animation: vibrateCard 0.45s ease-in-out infinite alternate;
          }
        `}
      </style>

      {/* Ambient Radial Mesh Lighting */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-b from-[#D8B282]/20 via-amber-500/10 to-transparent blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#D8B282]/10 blur-[150px] pointer-events-none" />

      {/* 1. Header Row Matching Reference Image 3 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6 mb-8 relative z-10">
        <div className="text-left space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-[#D8B282]">
            <Sparkles className="h-4 w-4 text-[#D8B282] animate-pulse" />
            <span>ĐỘT PHÁ CÔNG NGHỆ 2026</span>
          </div>
          <h3
            className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${themeClass(
              "text-white",
              "text-[#181512]",
              "text-yellow-300"
            )}`}
          >
            Trải Nghiệm Hệ Sinh Thái Số Hóa Phá Cách
          </h3>
        </div>

        {/* Carousel Navigation Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Slide trước"
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all cursor-pointer hover:scale-105 active:scale-95 ${themeClass(
              "border-white/20 bg-white/5 hover:bg-white/15 hover:border-[#D8B282] text-white shadow-lg",
              "border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-900 shadow-xs",
              "border-yellow-400 bg-black text-yellow-300 hover:bg-yellow-400/20"
            )}`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Slide tiếp theo"
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all cursor-pointer hover:scale-105 active:scale-95 ${themeClass(
              "border-white/20 bg-white/5 hover:bg-white/15 hover:border-[#D8B282] text-white shadow-lg",
              "border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-900 shadow-xs",
              "border-yellow-400 bg-black text-yellow-300 hover:bg-yellow-400/20"
            )}`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 2. 4 Metallic Silver 3D Categories: Bạc Sáng, Xanh Bạc, Tím Bạc, Cam Bạc */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 relative z-10">
        {DEFAULT_SLIDES.map((slide, idx) => {
          const TabIcon = slide.icon;
          const isActive = idx === activeIndex;
          const isItemHovered = hoveredTab === idx;

          return (
            <motion.div
              key={slide.id}
              onMouseEnter={() => setHoveredTab(idx)}
              onMouseLeave={() => setHoveredTab(null)}
              onClick={() => setActiveIndex(idx)}
              className="relative cursor-pointer group"
            >
              <div
                className={`relative rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between overflow-hidden animate-vibrate-glow ${
                  isActive
                    ? themeClass(
                        `border-2 ${slide.activeBorder} ${slide.activeBg} scale-[1.02]`,
                        `border-2 ${slide.activeBorder} bg-white shadow-[0_10px_25px_rgba(140,101,59,0.2)] text-[#181512] scale-[1.02]`,
                        "border-2 border-yellow-400 bg-black text-yellow-300"
                      )
                    : themeClass(
                        "border border-white/12 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/40 text-slate-300",
                        "border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 hover:border-slate-400",
                        "border border-yellow-400/40 bg-zinc-950 text-yellow-200"
                      )
                }`}
              >
                {/* Glowing Top Edge Reflection */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/70 to-transparent" />

                <div className="flex items-center gap-3">
                  {/* Inner Square Icon with Silver-Tinted Metallic Finish */}
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all shadow-md ${
                      isActive
                        ? slide.iconBg
                        : themeClass(
                            "bg-white/10 text-white/80 group-hover:text-white group-hover:bg-white/20",
                            "bg-slate-200 text-slate-800",
                            "bg-zinc-800 text-yellow-300"
                          )
                    }`}
                  >
                    <TabIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p
                      className={`text-xs sm:text-sm font-black truncate leading-tight ${
                        isActive ? themeClass("text-white", "text-[#181512]", "text-yellow-300") : "text-slate-300"
                      }`}
                    >
                      {slide.tabLabel}
                    </p>
                    <p
                      className={`text-[10.5px] font-mono tracking-wider font-bold mt-0.5 ${
                        isActive ? "text-slate-300" : "text-slate-400"
                      }`}
                    >
                      0{idx + 1} / 04
                    </p>
                  </div>
                </div>

                {/* Secret Peek Expandable Micro-Information on Hover */}
                <AnimatePresence>
                  {(isItemHovered || isActive) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-3 pt-2.5 border-t border-white/10 text-left"
                    >
                      <span className="text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1 truncate">
                        <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                        {slide.peekStat}
                      </span>
                      <p className="text-[9.5px] text-slate-300 truncate mt-0.5 opacity-90">{slide.peekHighlight}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Active Indicator Underline Bar */}
                {isActive && (
                  <span className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full ${slide.indicatorBg}`} />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 3. Slide Content Showcase Arena */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          {...getSlideMotionProps(activeIndex)}
          className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-[420px] relative z-10"
        >
          {/* Left Column: Feature Descriptions matching Image 3 */}
          <div className="lg:col-span-6 text-left space-y-4">
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] font-mono font-bold tracking-wider uppercase ${themeClass(
                `border-white/40 bg-white/10 ${current.badgeStyle} shadow-[0_0_15px_rgba(255,255,255,0.15)]`,
                "border-[#D8B282]/60 bg-[#F6E1C3]/30 text-[#8C653B]",
                "border-yellow-400 bg-yellow-400/20 text-yellow-300"
              )}`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{current.badge}</span>
            </div>

            <h4
              className={`text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight ${themeClass(
                "text-white",
                "text-[#181512]",
                "text-yellow-300"
              )}`}
            >
              {current.title}
            </h4>

            <p className="text-sm sm:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
              {current.subtitle}
            </p>

            <p
              className={`text-xs sm:text-sm leading-relaxed font-normal ${themeClass(
                "text-slate-300",
                "text-[#4A3F35]",
                "text-yellow-100"
              )}`}
            >
              {current.description}
            </p>

            {/* Glowing 3 Bullet Checkpoints */}
            <div className="space-y-3 pt-2">
              {current.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-3 text-xs sm:text-[13px]">
                  <div className="w-4 h-4 rounded-full bg-[#D8B282]/20 border border-[#D8B282] flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_8px_rgba(216,178,130,0.4)]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#F6E1C3]" />
                  </div>
                  <span className={`font-medium ${themeClass("text-slate-200", "text-[#181512]", "text-white")}`}>
                    {h}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="pt-4 flex items-center gap-4">
              <Link
                to={current.ctaLink}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-black text-xs uppercase bg-gradient-to-r from-[#F6E1C3] via-[#D8B282] to-[#8C653B] text-slate-950 shadow-[0_0_30px_rgba(216,178,130,0.5)] hover:shadow-[0_0_45px_rgba(216,178,130,0.8)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <span>{current.ctaLabel}</span>
              </Link>
            </div>
          </div>

          {/* Right Column: 3D Interactive Mockup Showcase */}
          <div className="lg:col-span-6 flex items-center justify-center">
            {/* 1. Sàn B2B Live Deal Room Card (Champagne Gold Theme) */}
            {current.previewType === "b2b" && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md rounded-3xl border-2 border-[#D8B282]/50 bg-gradient-to-b from-[#121B2A] via-[#0A101C] to-[#050811] p-6 sm:p-7 text-white shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(216,178,130,0.2)] space-y-4 backdrop-blur-xl text-left"
              >
                {/* Live Match Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-[#D8B282]/20">
                  <span className="text-xs font-mono font-bold text-[#F6E1C3] flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-[#D8B282] animate-pulse" /> AI MATCHMAKING 98%
                  </span>
                  <span className="text-[10px] px-3 py-1 rounded-full bg-[#D8B282]/20 border border-[#D8B282]/40 text-[#F6E1C3] font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F6E1C3] animate-ping" />
                    Đang diễn ra
                  </span>
                </div>

                {/* Opportunity Title */}
                <div className="space-y-1.5">
                  <p className="text-xs font-mono text-[#D8B282]/80">Cơ hội giao thương B2B</p>
                  <p className="text-sm sm:text-base font-bold text-white leading-snug">
                    Cung ứng hệ thống ERP &amp; Hạ tầng Cloud Server cho tập đoàn bán lẻ 50 chi nhánh
                  </p>
                </div>

                {/* Budget Row */}
                <div className="flex items-center justify-between text-xs bg-black/50 p-3.5 rounded-2xl border border-[#D8B282]/20">
                  <span className="text-slate-300 font-medium">Ngân sách dự kiến:</span>
                  <span className="font-mono font-black text-[#F6E1C3] text-sm">2.500.000.000 đ</span>
                </div>

                {/* Action Deal Room Button */}
                <Link
                  to="/connect-app/network"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#F6E1C3] via-[#D8B282] to-[#8C653B] text-slate-950 font-black text-xs shadow-[0_10px_25px_rgba(216,178,130,0.35)] hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Vào Deal Room Đàm Phán Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )}

            {/* 2. Platinum Titanium VIP Pass with 3D Holographic Flip */}
            {current.previewType === "card" && (
              <div
                onClick={() => setCardFlip(!cardFlip)}
                className="group relative w-full max-w-md h-64 rounded-3xl cursor-pointer perspective-1000 select-none transition-transform duration-500 hover:scale-105"
              >
                <div
                  className="relative w-full h-full rounded-3xl p-7 border-2 border-slate-300 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(226,232,240,0.3)] flex flex-col justify-between overflow-hidden text-left"
                  style={{
                    background: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 35%, #94A3B8 70%, #CBD5E1 100%)",
                  }}
                >
                  {/* Card Grain Overlay */}
                  <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />

                  {/* Top Row: Executive Gold & NFC Active */}
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-slate-950 fill-current" />
                      <span className="text-xs font-black tracking-widest text-slate-950 uppercase">
                        TITANIUM VIP PASS
                      </span>
                    </div>
                    <span className="flex items-center gap-1.5 text-[9.5px] font-mono font-bold px-2.5 py-1 rounded-md bg-slate-950/15 border border-slate-950/30 text-slate-950">
                      <Radio className="w-3 h-3 text-slate-950 animate-pulse" /> NFC ACTIVE
                    </span>
                  </div>

                  {/* Card Center: Member Info */}
                  <div className="z-10 my-auto">
                    <p className="text-[10px] font-mono font-black text-slate-900 uppercase tracking-wider">
                      DOANH NHÂN QUÝ HỢI 1983
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-0.5">
                      LÊ HOÀNG LONG
                    </p>
                    <p className="text-xs text-slate-900 font-bold">Chủ Tịch HĐQT - TẬP ĐOÀN TINH HOA</p>
                  </div>

                  {/* Card Bottom */}
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-900 z-10 border-t border-slate-950/20 pt-2.5">
                    <span>ID: 1983-MM-8989</span>
                    <span className="text-slate-950 font-black animate-pulse">Chạm 1-Giây NFC ↺</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. QR Event Ticket Check-in Scanner (Champagne Gold Theme) */}
            {current.previewType === "event" && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md rounded-3xl border-2 border-[#D8B282]/50 bg-gradient-to-b from-[#121B2A] via-[#0A101C] to-[#050811] p-6 sm:p-7 text-white shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(216,178,130,0.2)] space-y-4 backdrop-blur-xl text-left"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#D8B282]/20">
                  <span className="text-xs font-mono font-bold text-[#F6E1C3] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#D8B282]" /> VÉ VIP SUMMIT 2026
                  </span>
                  <span className="text-[10px] px-3 py-1 rounded-full bg-[#D8B282]/30 border border-[#D8B282]/40 text-[#F6E1C3] font-mono font-bold">
                    ĐÃ XÁC NHẬN
                  </span>
                </div>
                <div>
                  <p className="text-base font-bold text-white">Diễn Đàn Doanh Nghiệp Trẻ Thủ Đô &amp; Gala Dinner</p>
                  <p className="text-xs text-[#D8B282]/80 mt-1">18:00 · 28/09/2026 · JW Marriott Hotel</p>
                </div>
                <div className="flex items-center gap-4 bg-black/50 p-4 rounded-2xl border border-[#D8B282]/20">
                  <div className="w-14 h-14 bg-white rounded-xl p-1.5 shrink-0 flex items-center justify-center shadow-lg relative overflow-hidden">
                    <div className="absolute inset-x-0 h-1 bg-[#D8B282] animate-bounce" />
                    <span className="text-[9px] font-mono font-black text-slate-950 text-center leading-none">
                      QR PASS [1s]
                    </span>
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="font-mono font-bold text-white">Mã vé: HN-VIP-2026-99</p>
                    <p className="text-[#F6E1C3] text-[11px] font-medium">Sẵn sàng quét Check-in tại cổng VIP</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 4. C-Level Vault Perks (Champagne Gold Theme) */}
            {current.previewType === "perks" && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md rounded-3xl border-2 border-[#D8B282]/50 bg-gradient-to-b from-[#18120B] via-[#100C06] to-[#060402] p-6 sm:p-7 text-white shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(216,178,130,0.25)] space-y-4 backdrop-blur-xl text-left"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#D8B282]/20">
                  <span className="text-xs font-mono font-bold text-[#F6E1C3] flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-[#D8B282]" /> ĐẶC QUYỀN HỘI VIÊN VIP
                  </span>
                  <span className="text-[10px] px-3 py-1 rounded-full bg-[#D8B282]/30 border border-[#D8B282]/40 text-[#F6E1C3] font-mono font-bold">
                    Mở Khóa 100%
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-white">Gói Ưu Đãi Golf &amp; Nghỉ Dưỡng 5 Sao Toàn Quốc</p>
                  <p className="text-xs text-[#D8B282]/80">Giảm 35% chi phí dịch vụ &amp; tặng 1 giờ phòng chờ VIP sân bay</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#D8B282]/15 border border-[#D8B282]/30 text-xs flex items-center justify-between">
                  <span className="text-slate-300">Mã kích hoạt ưu đãi:</span>
                  <span className="font-mono font-black text-[#F6E1C3]">VIONE-VIP-PERK</span>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
