import React, { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  InteractiveParticleNetworkCanvas,
  RgbGlitchWrapper,
  DecryptingText,
  CircuitSpotlightCard,
} from "./animations/CyberTechEffects";
import {
  Sparkles,
  ArrowRight,
  Play,
  X,
  Check,
  Sun,
  Moon,
  Contrast,
  Users,
  Building2,
  Globe2,
  TrendingUp,
  Award,
  Zap,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  CalendarCheck,
  MessagesSquare,
  BookOpen,
  BarChart3,
  Bot,
  PlugZap,
  Briefcase,
  Layers,
  HeartHandshake,
  Star,
  Network,
  Share2,
  FileText,
  Scroll,
} from "lucide-react";
import { toast } from "sonner";
import { useAutoHideHeader } from "./useAutoHideHeader";
import { ZenLayoutWrapper } from "./wrappers/ZenLayoutWrapper";
import { useDoorThemeSwitch } from "./DoorThemeTransition";

export type ThemeMode = "light" | "dark" | "contrast";

// =========================================================================
// LAYER 2: SLOW GOLDEN LIGHT PARTICLES (Heritage & Trust Atmosphere)
// =========================================================================
function GoldenHeritageParticles({ theme }: { theme: ThemeMode }) {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; size: number; duration: number }>
  >([]);

  useEffect(() => {
    const list = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 3,
      duration: 18 + Math.random() * 22,
    }));
    setParticles(list);
  }, []);

  if (theme === "contrast") return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[2] overflow-hidden opacity-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: theme === "dark" ? "#D4AF37" : "#C5A059",
            boxShadow:
              theme === "dark" ? "0 0 10px rgba(212,175,55,0.7)" : "0 0 6px rgba(197,160,89,0.5)",
          }}
          animate={{
            y: ["0px", "-50px", "0px"],
            opacity: [0.15, 0.75, 0.15],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// =========================================================================
// STARDUST CURSOR FOLLOWER (Golden Dust Trail)
// =========================================================================
function StardustCursorTrail({ theme }: { theme: ThemeMode }) {
  const [dots, setDots] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    let count = 0;
    const handleMove = (e: MouseEvent) => {
      count++;
      if (count % 3 !== 0) return; // throttle
      const newDot = { id: Date.now() + Math.random(), x: e.clientX, y: e.clientY };
      setDots((prev) => [...prev.slice(-12), newDot]);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  if (theme === "contrast") return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {dots.map((d) => (
        <motion.div
          key={d.id}
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute h-2 w-2 rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{
            left: d.x,
            top: d.y,
            backgroundColor: theme === "dark" ? "#F59E0B" : "#C5A059",
            boxShadow: theme === "dark" ? "0 0 8px #F59E0B" : "0 0 6px #C5A059",
          }}
        />
      ))}
    </div>
  );
}

// =========================================================================
// 3-LAYER BACKGROUND ARCHITECTURE (Strict Enterprise Rule)
// Layer 0: Unsplash real image (Antique library / parchment)
// Layer 1: Overlay Navy / Parchment opacity-80
// Layer 2: Floating Golden particles
// =========================================================================
function HeritageThreeLayerBackground({ theme }: { theme: ThemeMode }) {
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "45%"]);
  const blob1Y = useTransform(scrollYProgress, [0, 1], [-90, 140]);
  const blob2Y = useTransform(scrollYProgress, [0, 1], [120, -140]);
  const rot1 = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const rot2 = useTransform(scrollYProgress, [0, 1], [0, -180]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* LAYER 0: REAL IMAGE (Unsplash Luxury Library / Antique Parchment) WITH 50% SCROLL PARALLAX */}
      <motion.div style={{ y: bgY }} className="absolute -top-[25%] inset-x-0 h-[150%] w-full">
        <img
          src={
            theme === "dark"
              ? "https://images.unsplash.com/photo-1507842229452-6e274a2ff438?auto=format&fit=crop&w=2400&q=80"
              : theme === "contrast"
              ? "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=2400&q=80"
              : "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=2400&q=80"
          }
          alt="Heritage Library Archive"
          className="h-full w-full object-cover object-center filter brightness-[0.78] contrast-[1.1]"
        />
      </motion.div>

      {/* LAYER 1: OVERLAY (Parchment Be in Light / Midnight Navy in Dark / Solid in Contrast) */}
      <div
        className={`absolute inset-0 transition-colors duration-700 ${
          theme === "dark"
            ? "bg-[#070D1E]/90 backdrop-blur-[2px]"
            : theme === "contrast"
              ? "bg-white/95"
              : "bg-[#F7F4EB]/90 backdrop-blur-[1px]"
        }`}
      />

      {/* OPPOSING FLOATING DECORATIVE PARTICLES & WAX CRESTS (Z-AXIS PARALLAX) */}
      <motion.div
        style={{ y: blob1Y, rotate: rot1 }}
        className="absolute -top-10 left-[8%] h-72 w-72 rounded-full bg-gradient-to-br from-amber-500/10 to-yellow-600/5 blur-3xl pointer-events-none"
      />
      <motion.div
        style={{ y: blob2Y, rotate: rot2 }}
        className="absolute top-1/2 right-[6%] h-96 w-96 rounded-full bg-gradient-to-tl from-blue-900/15 to-amber-400/10 blur-3xl pointer-events-none"
      />

      {/* LAYER 2: GOLDEN PARTICLES */}
      <GoldenHeritageParticles theme={theme} />
    </div>
  );
}

// =========================================================================
// THEME-SWITCH: 3D BOOK FLIP TRANSITION
// =========================================================================
function BookFlipThemeTransition({ isFlipping, theme }: { isFlipping: boolean; theme: ThemeMode }) {
  if (!isFlipping) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden [perspective:1800px]">
      {/* Book Spine shadow */}
      <div className="absolute inset-y-0 left-1/2 w-8 -translate-x-1/2 bg-black/40 blur-md z-10" />

      {/* Turning 3D Page */}
      <motion.div
        initial={{ rotateY: 0, transformOrigin: "left center" }}
        animate={{ rotateY: -180 }}
        transition={{ duration: 0.65, ease: [0.65, 0, 0.35, 1] }}
        className={`relative h-full w-1/2 left-1/2 [transform-style:preserve-3d] shadow-[0_25px_60px_rgba(0,0,0,0.6)] ${
          theme === "dark"
            ? "bg-gradient-to-r from-[#0F172A] to-[#1E293B] border-l border-[#D4AF37]/50 text-[#D4AF37]"
            : theme === "contrast"
              ? "bg-black text-white border-l-2 border-white"
              : "bg-gradient-to-r from-[#ECE4D0] to-[#FAF7EE] border-l border-[#C5A059]/40 text-[#5C3D1E]"
        }`}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 opacity-40">
          <Scroll className="h-16 w-16 mb-4 animate-pulse" />
          <div className="font-serif text-lg tracking-widest uppercase">Lật Mở Hồ Sơ Di Sản</div>
        </div>
      </motion.div>
    </div>
  );
}

// =========================================================================
// SECTION TRANSITION: SCROLL HIJACKING ASYMMETRIC STICKY CONTAINER
// =========================================================================
function AsymmetricScrollHijackSection({
  children,
  id,
  className = "",
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.93, 1, 1, 0.9]);
  const rotateX = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [6, 0, 0, -6]);
  const clipPath = useTransform(
    scrollYProgress,
    [0, 0.15, 0.85, 1],
    [
      "inset(4% 2% 4% 2% round 28px)",
      "inset(0% 0% 0% 0% round 0px)",
      "inset(0% 0% 0% 0% round 0px)",
      "inset(4% 2% 4% 2% round 28px)",
    ],
  );
  const yContent = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [40, 0, 0, -40]);

  return (
    <div ref={containerRef} id={id} className="relative min-h-[190vh] sm:min-h-[220vh] w-full">
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden [perspective:1400px]">
        <motion.div
          style={{
            scale,
            rotateX,
            clipPath,
            y: yContent,
          }}
          className={`relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 max-h-[96vh] overflow-y-auto lg:overflow-visible no-scrollbar ${className}`}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

const LegacyRevealSection = AsymmetricScrollHijackSection;

// =========================================================================
// 5 ENTERPRISE PROBLEMS (Wax Seal & Dossier Archive Cards)
// =========================================================================
const PROBLEMS = [
  {
    id: 1,
    num: "01",
    title: "Thông tin phân tán",
    tagline: "Khó tìm đúng người",
    desc: "Dữ liệu đối tác, hội viên lưu trữ rải rác trên sổ tay, Zalo, danh thiếp giấy và file Excel rời rạc. Khi cần tìm người phù hợp thì mất nhiều thời gian hoặc không tìm ra.",
    seal: "SEAL_DISPERSED",
  },
  {
    id: 2,
    num: "02",
    title: "Khó duy trì quan hệ",
    tagline: "Thiếu công cụ nhắc nhở và theo dõi tương tác",
    desc: "Không có hệ thống lưu lại lịch sử tiếp xúc, ghi chú quan trọng và nhắc nhở chăm sóc định kỳ, khiến các mối quan hệ quý giá dần bị lãng quên.",
    seal: "SEAL_RETENTION",
  },
  {
    id: 3,
    num: "03",
    title: "Bỏ lỡ cơ hội",
    tagline: "Không kịp nắm bắt cơ hội phù hợp",
    desc: "Nhu cầu hợp tác, dự án kinh doanh xuất hiện nhưng không có cơ chế matching kịp thời giữa bên có nhu cầu và bên có năng lực cung ứng.",
    seal: "SEAL_OPPORTUNITY",
  },
  {
    id: 4,
    num: "04",
    title: "Thiếu kết nối thực chất",
    tagline: "Nhiều sự kiện nhưng khó tạo giá trị sau sự kiện",
    desc: "Giao lưu bề nổi, trao đổi danh thiếp hình thức mà thiếu cơ chế thiết lập cuộc hẹn 1-on-1 theo đúng năng lực cung ứng.",
    seal: "SEAL_CONNECTION",
  },
  {
    id: 5,
    num: "05",
    title: "Khó đo lường hiệu quả",
    tagline: "Không biết mối quan hệ mang lại giá trị gì",
    desc: "Ban lãnh đạo và doanh nhân không đo lường được ROI, doanh số giao thương và giá trị thực tế do các mối quan hệ tạo ra.",
    seal: "SEAL_ANALYTICS",
  },
];

// =========================================================================
// 9 ENTERPRISE SOLUTIONS (Gold Framed Executive Cards)
// =========================================================================
const SOLUTIONS = [
  {
    id: 1,
    num: "01",
    title: "Quản lý hội viên",
    desc: "Hồ sơ 360°, phân nhóm thông minh, phân quyền đa cấp bậc và tự động hóa kỳ hội phí.",
    icon: Users,
  },
  {
    id: 2,
    num: "02",
    title: "CRM & Quan hệ",
    desc: "Theo dõi lịch sử gặp gỡ, ghi chú chi tiết, nhắc nhở định kỳ và chấm điểm gắn kết đối tác.",
    icon: HeartHandshake,
  },
  {
    id: 3,
    num: "03",
    title: "Cơ hội kinh doanh",
    desc: "Quản lý pipeline, matching nhu cầu cung - cầu, xúc tiến thương mại và tìm kiếm đối tác B2B.",
    icon: Briefcase,
  },
  {
    id: 4,
    num: "04",
    title: "Sự kiện",
    desc: "Tổ chức, quản lý đại biểu, check-in QR/NFC một chạm, kết nối trước - trong - sau sự kiện.",
    icon: CalendarCheck,
  },
  {
    id: 5,
    num: "05",
    title: "Cộng đồng & Nhóm",
    desc: "Không gian kết nối theo ngành nghề, phân ban chuyên môn và câu lạc bộ doanh nhân chiến lược.",
    icon: MessagesSquare,
  },
  {
    id: 6,
    num: "06",
    title: "Tri thức & Nội dung",
    desc: "Chia sẻ kinh nghiệm chuyên gia, tài liệu pháp lý, chuẩn mực quản trị và báo cáo ngành độc quyền.",
    icon: BookOpen,
  },
  {
    id: 7,
    num: "07",
    title: "Báo cáo & Phân tích",
    desc: "Đo lường hiệu quả kết nối, lưu lượng giao thương, tần suất tương tác và tỷ suất hoàn vốn ROI.",
    icon: BarChart3,
  },
  {
    id: 8,
    num: "08",
    title: "AI Copilot",
    desc: "Tìm kiếm ngữ nghĩa, gợi ý kết nối chuẩn xác, tóm tắt hồ sơ năng lực và trợ lý kinh doanh AI.",
    icon: Bot,
  },
  {
    id: 9,
    num: "09",
    title: "Tích hợp & Mở rộng",
    desc: "Kết nối liền mạch với hệ sinh thái CRM, email, calendar và API mở tiêu chuẩn quốc tế.",
    icon: PlugZap,
  },
];

// =========================================================================
// 6 PARTNER LOGOS
// =========================================================================
const CLIENT_LOGOS = [
  { name: "VCCI", label: "Liên đoàn Thương mại & Công nghiệp VN", icon: Building2 },
  { name: "AmCham", label: "Hiệp hội Doanh nghiệp Hoa Kỳ", icon: Globe2 },
  { name: "EuroCham", label: "Hiệp hội Doanh nghiệp Châu Âu", icon: Award },
  { name: "KoCham", label: "Hiệp hội Doanh nghiệp Hàn Quốc", icon: Building2 },
  { name: "SBF", label: "Singapore Business Federation", icon: Globe2 },
  { name: "AusCham", label: "Hiệp hội Doanh nghiệp Úc", icon: Award },
];

// =========================================================================
// 3 CLIENT SUCCESS STORIES
// =========================================================================
const TESTIMONIALS = [
  {
    quote:
      "Business Connect đã giúp Hiệp hội chuyển đổi số toàn diện công tác hội viên. Tỷ lệ kết nối thành công giữa các doanh nghiệp du lịch tăng hơn 300% chỉ sau một kỳ đại hội.",
    author: "Nguyễn Thị Lan",
    role: "Chủ tịch",
    org: "Hiệp hội Du lịch Việt Nam",
    initials: "NL",
  },
  {
    quote:
      "Tính năng AI matching mở ra cho công ty tôi 5 hợp đồng cung ứng chiến lược trong nước và khu vực. Khả năng theo dõi cơ hội và nhắc lịch chăm sóc quan hệ cực kỳ tinh tế.",
    author: "Trần Minh Quân",
    role: "CEO & Sáng lập",
    org: "Công ty Sản xuất Việt",
    initials: "MQ",
  },
  {
    quote:
      "Một nền tảng chuẩn mực cho giới doanh nhân cấp cao. Thiết kế trang trọng, bảo mật và mang lại giá trị thiết thực cho từng buổi kết nối giao thương.",
    author: "Lê Hoàng Anh",
    role: "Doanh nhân & Ủy viên",
    org: "Hội viên VIP Câu lạc bộ Doanh nghiệp",
    initials: "HA",
  },
];

export function BusinessConnectLandingV2() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const { isTransitioning, targetTheme, switchTheme } = useDoorThemeSwitch(theme, setTheme);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [hoveredProblem, setHoveredProblem] = useState<number | null>(null);

  const { isVisible: isHeaderVisible, isAtTop } = useAutoHideHeader();

  const handleSwitchTheme = (nextTheme: ThemeMode) => {
    switchTheme(nextTheme);
  };

  return (
    <ZenLayoutWrapper
      theme={theme}
      isThemeTransitioning={isTransitioning}
      targetTheme={targetTheme}
    >
      {/* INTERACTIVE PARTICLE NETWORK CANVAS (CYBERNETIC REPULSE FORCE FIELD) */}
      <InteractiveParticleNetworkCanvas />

      {/* STARDUST CURSOR PARTICLES */}
      <StardustCursorTrail theme={theme} />

      {/* =========================================================================
          1. HEADER (STRICT CORPORATE PADDING & B2B COPY)
      ========================================================================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isHeaderVisible ? "translate-y-0" : "-translate-y-full pointer-events-none"
        } ${
          isAtTop
            ? "bg-transparent py-5"
            : theme === "dark"
              ? "bg-[#070D1E]/90 backdrop-blur-md border-b border-[#D4AF37]/20 py-3 shadow-lg"
              : theme === "contrast"
                ? "bg-white border-b-2 border-black py-3"
                : "bg-[#F7F4EB]/90 backdrop-blur-md border-b border-[#C5A059]/30 py-3 shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo with RGB Glitch */}
          <Link to="/" className="flex items-center gap-3 group">
            <RgbGlitchWrapper>
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center border transition-all duration-300 ${
                  theme === "dark"
                    ? "border-[#D4AF37] bg-[#0A1128] text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                    : theme === "contrast"
                      ? "border-2 border-black bg-black text-white"
                      : "border-[#C5A059] bg-[#FAF7EE] text-[#8C653B] shadow-sm"
                }`}
              >
                <Building2 className="h-5 w-5" />
              </div>
            </RgbGlitchWrapper>
            <div>
              <div
                className={`text-base font-bold tracking-wider uppercase font-serif ${
                  theme === "dark"
                    ? "text-[#D4AF37]"
                    : theme === "contrast"
                      ? "text-black"
                      : "text-[#1C1917]"
                }`}
              >
                BUSINESS CONNECT
              </div>
              <div
                className={`text-[9px] tracking-widest uppercase font-sans font-semibold ${
                  theme === "dark"
                    ? "text-[#D4AF37]/70"
                    : theme === "contrast"
                      ? "text-zinc-600"
                      : "text-[#8C653B]"
                }`}
              >
                HERITAGE & TRUST • V2
              </div>
            </div>
          </Link>

          {/* 6 Nav Links: CHÍNH XÁC 100% THEO ẢNH GỐC */}
          <nav className="hidden xl:flex items-center gap-8 text-sm font-medium font-sans">
            <a href="#giai-phap" className="hover:opacity-75 transition">
              Giải pháp
            </a>
            <a href="#khach-hang" className="hover:opacity-75 transition">
              Khách hàng
            </a>
            <a href="#cau-chuyen" className="hover:opacity-75 transition">
              Câu chuyện
            </a>
            <a href="#bang-gia" className="hover:opacity-75 transition">
              Bảng giá
            </a>
            <a href="#tai-nguyen" className="hover:opacity-75 transition">
              Tài nguyên
            </a>
            <a href="#ve-chung-toi" className="hover:opacity-75 transition">
              Về chúng tôi
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Switcher */}
            <div
              className={`flex items-center rounded-full border p-1 ${
                theme === "dark"
                  ? "border-[#D4AF37]/40 bg-[#0A1128]"
                  : theme === "contrast"
                    ? "border-black bg-white"
                    : "border-[#D9CDB8] bg-[#EFE9DD]"
              }`}
            >
              <button
                onClick={() => handleSwitchTheme("light")}
                title="Private Banking (Sáng)"
                className={`rounded-full p-1.5 transition ${
                  theme === "light"
                    ? "bg-[#C5A059] text-white shadow"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleSwitchTheme("dark")}
                title="Midnight Navy (Tối)"
                className={`rounded-full p-1.5 transition ${
                  theme === "dark"
                    ? "bg-[#D4AF37] text-black shadow"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleSwitchTheme("contrast")}
                title="Báo chí (Tương phản cao)"
                className={`rounded-full p-1.5 transition ${
                  theme === "contrast"
                    ? "bg-black text-white shadow"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <Contrast className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Version Switcher Pills */}
            <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto py-0.5">
              <Link to="/business-connect/v1" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v1</Link>
              <Link to="/business-connect/v2" className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow">v2 ★</Link>
              <Link to="/business-connect/v3" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v3</Link>
              <Link to="/business-connect/v4" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v4</Link>
              <Link to="/business-connect/v5" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v5</Link>
              <Link to="/business-connect/v6" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v6</Link>
              <Link to="/business-connect/v7" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v7</Link>
            </div>

            <Link
              to="/auth"
              className="hidden sm:inline-flex rounded-xl px-4 py-2 text-xs font-bold font-sans uppercase tracking-wider hover:opacity-75 transition"
            >
              Đăng nhập
            </Link>
            <button
              onClick={() => setShowDemoModal(true)}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold font-sans tracking-wide uppercase transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer ${
                theme === "dark"
                  ? "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:brightness-105"
                  : theme === "contrast"
                    ? "border-2 border-black bg-black text-white hover:bg-zinc-800"
                    : "bg-gradient-to-r from-[#C5A059] to-[#8C653B] text-white shadow-md hover:shadow-lg"
              }`}
            >
              <span>Đặt demo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. HERO SECTION: EXACT PART 1 COPY & STATS
      ========================================================================= */}
      <LegacyRevealSection className="pt-36 sm:pt-44 pb-20 text-center">
        {/* Tagline */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6 text-xs font-bold uppercase tracking-widest font-mono">
          <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
          <DecryptingText text="NỀN TẢNG KẾT NỐI KINH DOANH THẾ HỆ MỚI" speed={22} />
        </div>

        {/* Headline */}
        <h1
          className={`text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight font-serif max-w-5xl mx-auto leading-[1.15] mb-6 ${
            theme === "dark" ? "text-white" : theme === "contrast" ? "text-black" : "text-[#1C1917]"
          }`}
        >
          Hiểu đúng người. <br className="hidden sm:inline" />
          <span
            className={`${
              theme === "dark"
                ? "text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FFF2B2] to-[#D4AF37]"
                : theme === "contrast"
                  ? "text-black underline underline-offset-8"
                  : "text-transparent bg-clip-text bg-gradient-to-r from-[#A47A3E] to-[#5C3D1E]"
            }`}
          >
            Mở ra cơ hội thật.
          </span>
        </h1>

        {/* Subtext */}
        <p
          className={`text-lg sm:text-xl font-sans max-w-3xl mx-auto leading-relaxed mb-10 ${
            theme === "dark"
              ? "text-slate-300"
              : theme === "contrast"
                ? "text-zinc-800"
                : "text-[#4A453E]"
          }`}
        >
          Business Connect giúp các hiệp hội, tổ chức và doanh nhân quản lý mối quan hệ, kết nối
          đúng người, đúng thời điểm và tạo ra nhiều cơ hội kinh doanh hơn với sức mạnh của AI.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-20">
          <RgbGlitchWrapper>
            <button
              onClick={() => setShowDemoModal(true)}
              className={`inline-flex items-center gap-3 rounded-xl px-8 py-4 text-sm font-bold uppercase tracking-wider font-sans transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer ${
                theme === "dark"
                  ? "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-bold shadow-[0_0_30px_rgba(245,158,11,0.45)]"
                  : theme === "contrast"
                    ? "border-2 border-black bg-black text-white hover:bg-zinc-800"
                    : "bg-gradient-to-r from-[#C5A059] to-[#8C653B] text-white shadow-xl hover:shadow-2xl"
              }`}
            >
              <span>Đặt demo ngay</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </RgbGlitchWrapper>

          <button
            onClick={() => setShowVideoModal(true)}
            className={`inline-flex items-center gap-3 rounded-xl px-7 py-4 text-sm font-bold uppercase tracking-wider font-sans border transition-all duration-300 ${
              theme === "dark"
                ? "border-[#D4AF37]/40 bg-[#0A1128]/60 text-white hover:bg-[#0A1128]"
                : theme === "contrast"
                  ? "border-2 border-black bg-white text-black hover:bg-zinc-100"
                  : "border-[#C5A059]/40 bg-[#FAF7EE] text-[#5C3D1E] hover:bg-[#F3EDE0]"
            }`}
          >
            <Play className="h-4 w-4 fill-current text-[#D4AF37]" />
            <span>Xem video (2 phút)</span>
          </button>
        </div>

        {/* 4 Corporate Stats Grid */}
        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-2xl border text-left ${
            theme === "dark"
              ? "bg-[#0A1128]/80 border-[#D4AF37]/30 shadow-2xl backdrop-blur-md"
              : theme === "contrast"
                ? "bg-white border-2 border-black"
                : "bg-[#FAF7EE]/90 border-[#D9CDB8] shadow-lg backdrop-blur-md"
          }`}
        >
          <div>
            <div
              className={`text-3xl sm:text-4xl font-bold font-serif ${
                theme === "dark"
                  ? "text-[#D4AF37]"
                  : theme === "contrast"
                    ? "text-black"
                    : "text-[#8C653B]"
              }`}
            >
              10,000+
            </div>
            <div className="text-xs font-sans uppercase tracking-wider opacity-75 mt-1">
              Doanh nhân & Hội viên
            </div>
          </div>
          <div>
            <div
              className={`text-3xl sm:text-4xl font-bold font-serif ${
                theme === "dark"
                  ? "text-[#D4AF37]"
                  : theme === "contrast"
                    ? "text-black"
                    : "text-[#8C653B]"
              }`}
            >
              300+
            </div>
            <div className="text-xs font-sans uppercase tracking-wider opacity-75 mt-1">
              Hiệp hội & Tổ chức
            </div>
          </div>
          <div>
            <div
              className={`text-3xl sm:text-4xl font-bold font-serif ${
                theme === "dark"
                  ? "text-[#D4AF37]"
                  : theme === "contrast"
                    ? "text-black"
                    : "text-[#8C653B]"
              }`}
            >
              50,000+
            </div>
            <div className="text-xs font-sans uppercase tracking-wider opacity-75 mt-1">
              Kết nối được tạo
            </div>
          </div>
          <div>
            <div
              className={`text-3xl sm:text-4xl font-bold font-serif ${
                theme === "dark"
                  ? "text-[#D4AF37]"
                  : theme === "contrast"
                    ? "text-black"
                    : "text-[#8C653B]"
              }`}
            >
              20+
            </div>
            <div className="text-xs font-sans uppercase tracking-wider opacity-75 mt-1">
              Quốc gia & vùng lãnh thổ
            </div>
          </div>
        </div>
      </LegacyRevealSection>

      {/* =========================================================================
          3. PROBLEM SECTION: 5 WAX SEAL ARCHIVE CARDS
      ========================================================================= */}
      <LegacyRevealSection id="van-de">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-bold font-serif uppercase tracking-widest text-[#D4AF37] mb-2">
            NHIỀU TỔ CHỨC VẪN ĐANG GẶP NHỮNG VẤN ĐỀ NÀY
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif tracking-tight">
            Quản lý quan hệ kinh doanh vẫn còn nhiều thách thức
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PROBLEMS.map((p) => {
            const isHovered = hoveredProblem === p.id;
            const CardWrapper = (theme === "dark" ? CircuitSpotlightCard : "div") as any;
            return (
              <CardWrapper
                key={p.id}
                onMouseEnter={() => setHoveredProblem(p.id)}
                onMouseLeave={() => setHoveredProblem(null)}
                className={`group relative p-8 rounded-2xl border transition-all duration-300 cursor-pointer ${
                  theme === "dark"
                    ? "bg-[#0A1128]/70 border-[#D4AF37]/30 hover:border-[#D4AF37] hover:shadow-[0_0_25px_rgba(212,175,55,0.25)]"
                    : theme === "contrast"
                      ? "bg-white border-2 border-black hover:bg-zinc-50"
                      : "bg-[#FAF7EE] border-[#D9CDB8] hover:border-[#C5A059] hover:shadow-xl"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-serif text-xs font-bold tracking-widest text-[#D4AF37]">
                    MỤC {p.num}
                  </span>
                  {/* Wax Seal Icon */}
                  <div
                    className={`h-8 w-8 rounded-full border flex items-center justify-center text-xs font-serif ${
                      theme === "dark"
                        ? "border-[#D4AF37]/50 bg-[#070D1E] text-[#D4AF37]"
                        : "border-[#C5A059] bg-[#ECE4D0] text-[#5C3D1E]"
                    }`}
                  >
                    §
                  </div>
                </div>

                <h3 className="text-xl font-bold font-serif mb-2">{p.title}</h3>
                <div
                  className={`text-sm font-semibold mb-4 ${
                    theme === "dark" ? "text-amber-400" : "text-amber-800"
                  }`}
                >
                  {p.tagline}
                </div>

                {/* Text description revealed elegantly on hover / click */}
                <p
                  className={`text-sm leading-relaxed transition-opacity duration-300 ${
                    isHovered ? "opacity-100" : "opacity-80"
                  }`}
                >
                  {p.desc}
                </p>
              </CardWrapper>
            );
          })}
        </div>
      </LegacyRevealSection>

      {/* =========================================================================
          4. SOLUTION SECTION: 9 GOLD-FRAMED ENTERPRISE CARDS
      ========================================================================= */}
      <LegacyRevealSection id="giai-phap">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-bold font-serif uppercase tracking-widest text-[#D4AF37] mb-2">
            GIẢI PHÁP BUSINESS CONNECT
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif tracking-tight mb-4">
            Quản lý kết nối. Tạo ra cơ hội.
          </h2>
          <p className="text-base sm:text-lg opacity-80 leading-relaxed mb-6">
            Một nền tảng toàn diện giúp hiệp hội, tổ chức và doanh nhân hiểu khách hàng, kết nối
            đúng người, xây dựng quan hệ bền vững và biến mối quan hệ thành cơ hội kinh doanh thực
            chất.
          </p>
          <a
            href="#he-sinh-thai"
            className="inline-flex items-center gap-2 text-sm font-bold font-serif uppercase tracking-wider text-[#D4AF37] hover:underline"
          >
            <span>Khám phá tính năng</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SOLUTIONS.map((s) => {
            const IconComponent = s.icon;
            return (
              <div
                key={s.id}
                className={`p-8 rounded-2xl border transition-all duration-300 group hover:-translate-y-1 ${
                  theme === "dark"
                    ? "bg-[#0A1128]/70 border-[#D4AF37]/30 hover:border-[#D4AF37] hover:shadow-[0_0_30px_rgba(212,175,55,0.2)]"
                    : theme === "contrast"
                      ? "bg-white border-2 border-black hover:bg-zinc-50"
                      : "bg-[#FAF7EE] border-[#D9CDB8] hover:border-[#C5A059] hover:shadow-xl"
                }`}
              >
                <div className="flex items-center justify-between mb-5">
                  <div
                    className={`h-12 w-12 rounded-xl border flex items-center justify-center transition-all duration-300 ${
                      theme === "dark"
                        ? "border-[#D4AF37]/50 bg-[#070D1E] text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black"
                        : theme === "contrast"
                          ? "border-2 border-black bg-black text-white"
                          : "border-[#C5A059] bg-[#FAF7EE] text-[#8C653B] group-hover:bg-[#C5A059] group-hover:text-white"
                    }`}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <span className="font-serif text-xs font-bold opacity-50 tracking-widest">
                    {s.num}
                  </span>
                </div>
                <h3 className="text-xl font-bold font-serif mb-2">{s.title}</h3>
                <p className="text-sm opacity-80 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </LegacyRevealSection>

      {/* =========================================================================
          5. ECOSYSTEM SECTION: CONSTELLATION NETWORK VISUAL
      ========================================================================= */}
      <LegacyRevealSection id="he-sinh-thai">
        <div
          className={`p-10 sm:p-16 rounded-3xl border relative overflow-hidden text-center ${
            theme === "dark"
              ? "bg-[#0A1128]/90 border-[#D4AF37]/40 shadow-2xl"
              : theme === "contrast"
                ? "bg-white border-2 border-black"
                : "bg-[#FAF7EE] border-[#D9CDB8] shadow-2xl"
          }`}
        >
          <div className="text-xs font-bold font-serif uppercase tracking-widest text-[#D4AF37] mb-3">
            HỆ SINH THÁI KẾT NỐI KINH DOANH
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold font-serif tracking-tight mb-4">
            Cùng nhau tạo ra giá trị lớn hơn
          </h2>
          <p className="text-base sm:text-lg opacity-80 max-w-3xl mx-auto leading-relaxed mb-8">
            Business Connect kết nối hội viên, hiệp hội, doanh nghiệp, chuyên gia, đối tác, nhà đầu
            tư và các tổ chức quốc tế trong một hệ sinh thái mở, để cùng chia sẻ tri thức, nguồn lực
            và cơ hội kinh doanh.
          </p>

          <div
            className={`p-6 rounded-2xl inline-block border mb-10 ${
              theme === "dark"
                ? "bg-[#070D1E] border-[#D4AF37]/50 text-[#D4AF37]"
                : theme === "contrast"
                  ? "bg-black text-white border-black"
                  : "bg-[#EFE9DD] border-[#C5A059] text-[#5C3D1E]"
            }`}
          >
            <div className="text-sm sm:text-base font-bold font-serif tracking-widest uppercase">
              NHIỀU KẾT NỐI HƠN. NHIỀU CƠ HỘI HƠN. NHIỀU GIÁ TRỊ HƠN.
            </div>
          </div>

          <div>
            <button
              onClick={() => setShowDemoModal(true)}
              className="inline-flex items-center gap-2 text-sm font-bold font-serif uppercase tracking-wider text-[#D4AF37] hover:underline"
            >
              <span>Xem hệ sinh thái</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </LegacyRevealSection>

      {/* =========================================================================
          6. CLIENTS & TESTIMONIALS: 6 LOGOS & 3 CEO STORIES
      ========================================================================= */}
      <LegacyRevealSection id="khach-hang">
        {/* Header 1: Logos */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="text-xs font-bold font-serif uppercase tracking-widest text-[#D4AF37] mb-2">
            ĐƯỢC TIN TƯỞNG BỞI CÁC HIỆP HỘI VÀ DOANH NGHIỆP
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
            Những tổ chức tiên phong đã lựa chọn
          </h2>
        </div>

        {/* 6 Logos Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 mb-20">
          {CLIENT_LOGOS.map((c) => {
            const LogoIcon = c.icon;
            return (
              <div
                key={c.name}
                className={`p-6 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition duration-300 hover:border-[#D4AF37] ${
                  theme === "dark"
                    ? "bg-[#0A1128]/60 border-[#D4AF37]/20"
                    : theme === "contrast"
                      ? "bg-white border-2 border-black"
                      : "bg-[#FAF7EE] border-[#D9CDB8]"
                }`}
              >
                <LogoIcon className="h-7 w-7 text-[#D4AF37]" />
                <div className="font-serif font-bold text-base">{c.name}</div>
                <div className="text-[10px] opacity-60 leading-tight">{c.label}</div>
              </div>
            );
          })}
        </div>

        {/* Header 2: Stories */}
        <div id="cau-chuyen" className="text-center max-w-3xl mx-auto mb-12 pt-8">
          <div className="text-xs font-bold font-serif uppercase tracking-widest text-[#D4AF37] mb-2">
            CÂU CHUYỆN THÀNH CÔNG
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
            Kết nối đúng. Tăng trưởng thật.
          </h2>
        </div>

        {/* 3 Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.author}
              className={`p-8 rounded-2xl border flex flex-col justify-between ${
                theme === "dark"
                  ? "bg-[#0A1128]/70 border-[#D4AF37]/30 shadow-xl"
                  : theme === "contrast"
                    ? "bg-white border-2 border-black"
                    : "bg-[#FAF7EE] border-[#D9CDB8] shadow-lg"
              }`}
            >
              <div className="mb-6 font-serif italic text-sm sm:text-base leading-relaxed opacity-90">
                "{t.quote}"
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-current/10">
                <div
                  className={`h-10 w-10 rounded-full border flex items-center justify-center font-serif text-sm font-bold ${
                    theme === "dark"
                      ? "border-[#D4AF37] bg-[#070D1E] text-[#D4AF37]"
                      : "border-[#C5A059] bg-[#EFE9DD] text-[#5C3D1E]"
                  }`}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="font-serif font-bold text-sm">{t.author}</div>
                  <div className="text-xs opacity-70">
                    {t.role}, {t.org}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </LegacyRevealSection>

      {/* =========================================================================
          7. FOOTER: EXACT PART 1 COPY
      ========================================================================= */}
      <footer
        className={`py-20 px-4 sm:px-6 lg:px-8 border-t ${
          theme === "dark"
            ? "border-[#D4AF37]/20 bg-[#050A17]"
            : theme === "contrast"
              ? "border-black bg-black text-white"
              : "border-[#D9CDB8] bg-[#FAF7EE]"
        }`}
      >
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold font-serif mb-4">
            Sẵn sàng mở ra nhiều cơ hội hơn?
          </h2>
          <p className="text-sm sm:text-base opacity-75 max-w-2xl mx-auto mb-8">
            Hãy để Business Connect đồng hành cùng hiệp hội hoặc doanh nghiệp của bạn.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <button
              onClick={() => setShowDemoModal(true)}
              className={`inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-xs font-bold uppercase tracking-wider font-sans cursor-pointer ${
                theme === "dark"
                  ? "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-bold shadow-lg hover:brightness-105"
                  : theme === "contrast"
                    ? "border-2 border-white bg-white text-black hover:bg-zinc-200"
                    : "bg-gradient-to-r from-[#C5A059] to-[#8C653B] text-white shadow-lg"
              }`}
            >
              <span>Đặt demo ngay</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                toast.success("Cảm ơn bạn! Chuyên viên tư vấn sẽ liên hệ trong vòng 24 giờ.");
              }}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-xs font-bold uppercase tracking-wider font-sans border border-current/30 hover:bg-current/5 transition"
            >
              Liên hệ tư vấn
            </button>
          </div>

          <div className="text-xs opacity-50 font-sans border-t border-current/10 pt-8">
            © {new Date().getFullYear()} Business Connect. Bản quyền thuộc về hệ thống VIONE B2B
            Platform.
          </div>
        </div>
      </footer>

      {/* =========================================================================
          MODALS: DEMO & VIDEO
      ========================================================================= */}
      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-lg p-8 rounded-2xl border shadow-2xl ${
                theme === "dark"
                  ? "bg-[#0A1128] border-[#D4AF37]/50 text-white"
                  : theme === "contrast"
                    ? "bg-white text-black border-2 border-black"
                    : "bg-[#FAF7EE] text-[#1C1917] border-[#D9CDB8]"
              }`}
            >
              <button
                onClick={() => setShowDemoModal(false)}
                className="absolute top-4 right-4 p-2 rounded-lg opacity-60 hover:opacity-100"
              >
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-xl font-bold font-serif mb-2">Đăng Ký Trải Nghiệm Demo</h3>
              <p className="text-xs opacity-75 mb-6">
                Chuyên viên cấp cao sẽ liên hệ trực tiếp để giới thiệu giải pháp phù hợp nhất.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Đăng ký thành công! Chúng tôi sẽ liên hệ trong vòng 24 giờ.");
                  setShowDemoModal(false);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                    Họ và tên
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full px-4 py-2.5 rounded-lg border bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                    Doanh nghiệp / Hiệp hội
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="VD: Công ty TNHH Cung Ứng..."
                    className="w-full px-4 py-2.5 rounded-lg border bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                    Số điện thoại
                  </label>
                  <input
                    required
                    type="tel"
                    placeholder="VD: 0987654321"
                    className="w-full px-4 py-2.5 rounded-lg border bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 hover:brightness-105 transition mt-4 cursor-pointer"
                >
                  Xác Nhận Đăng Ký
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showVideoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/20">
              <button
                onClick={() => setShowVideoModal(false)}
                className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="aspect-video flex flex-col items-center justify-center text-white p-8">
                <Play className="h-16 w-16 text-[#D4AF37] mb-4 animate-pulse" />
                <div className="font-serif text-lg">
                  Giới Thiệu Nền Tảng Business Connect (2 Phút)
                </div>
                <div className="text-xs text-white/60 mt-1">
                  Đang nạp luồng video chất lượng cao...
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </ZenLayoutWrapper>
  );
}
