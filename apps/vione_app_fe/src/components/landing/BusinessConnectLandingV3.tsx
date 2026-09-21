import React, { useState, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  LiquidAuroraBackground,
  HolographicFoilCard,
  GooeySvgMorphEcosystem,
  MagnifyingGlassLensStat,
} from "./animations/FluidGlassEffects";
import {
  Sparkles,
  ArrowRight,
  Play,
  X,
  Sun,
  Moon,
  Contrast,
  Users,
  Building2,
  TrendingUp,
  Globe2,
  Calendar,
  Layers,
  BookOpen,
  BarChart3,
  Bot,
  Share2,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Terminal,
  Grid,
  Zap,
  Award,
  CalendarCheck,
  MessagesSquare,
  PlugZap,
  Briefcase,
  HeartHandshake,
  Activity,
  Cpu,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { useAutoHideHeader } from "./useAutoHideHeader";
import { HeritageLayoutWrapper } from "./wrappers/HeritageLayoutWrapper";
import { useDoorThemeSwitch } from "./DoorThemeTransition";

export type ThemeMode = "light" | "dark" | "contrast";

// =========================================================================
// 3-LAYER BACKGROUND: VERCEL / STRIPE TECHNICAL EDITORIAL WITH 50% SCROLL PARALLAX
// Layer 0: Real Unsplash grayscale architecture image scrolling at 50% speed
// Layer 1: Overlay precision technical grid
// Layer 2: Opposing floating HUD crosshairs, code badges & vignette glow
// =========================================================================
function EditorialThreeLayerBackground({ theme }: { theme: ThemeMode }) {
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "45%"]);
  const hud1Y = useTransform(scrollYProgress, [0, 1], [-90, 140]);
  const hud2Y = useTransform(scrollYProgress, [0, 1], [130, -120]);
  const rot1 = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const rot2 = useTransform(scrollYProgress, [0, 1], [0, -180]);

  if (theme === "contrast") {
    return <div className="pointer-events-none fixed inset-0 z-0 bg-white" />;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* LAYER 0: REAL ARCHITECTURE IMAGE WITH 50% SCROLL PARALLAX */}
      <motion.div style={{ y: bgY }} className="absolute -top-[25%] inset-x-0 h-[150%] w-full">
        <img
          src={
            theme === "dark"
              ? "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2400&q=80"
              : "https://images.unsplash.com/photo-1554469384-e58fac16e23a?auto=format&fit=crop&w=2400&q=80"
          }
          alt="Technical Architecture"
          className="h-full w-full object-cover object-center grayscale contrast-125 opacity-25"
        />
      </motion.div>

      {/* LAYER 1: OVERLAY (Grid Pattern & Base Color) */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          theme === "dark"
            ? "bg-[#09090B]/90 bg-[linear-gradient(to_right,#ffffff0f_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0f_1px,transparent_1px)] bg-[size:36px_36px]"
            : "bg-[#FAFAFA]/90 bg-[linear-gradient(to_right,#0000000d_1px,transparent_1px),linear-gradient(to_bottom,#0000000d_1px,transparent_1px)] bg-[size:36px_36px]"
        }`}
      />

      {/* OPPOSING FLOATING DECORATIVE HUD BADGES & CROSSHAIRS (Z-AXIS PARALLAX) */}
      <motion.div
        style={{ y: hud1Y, rotate: rot1 }}
        className="absolute top-[18%] left-[6%] border border-orange-500/20 bg-orange-500/5 p-4 backdrop-blur-sm hidden md:block"
      >
        <div className="flex items-center gap-2 text-[10px] font-mono text-orange-500">
          <Terminal className="h-3.5 w-3.5 animate-pulse" />
          <span>SYS.TELEMETRY: RUNNING</span>
        </div>
        <div className="text-[9px] font-mono text-zinc-500 mt-1">NODE_P2P_MESH: READY</div>
      </motion.div>

      <motion.div
        style={{ y: hud2Y, rotate: rot2 }}
        className="absolute top-[65%] right-[7%] border border-zinc-500/20 bg-zinc-800/10 p-4 backdrop-blur-sm hidden md:block"
      >
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
          <Radio className="h-3.5 w-3.5 text-orange-400 animate-spin" />
          <span>NET.LATENCY: 12ms</span>
        </div>
        <div className="text-[9px] font-mono text-zinc-500 mt-1">AI_MATCHING: 99.8%</div>
      </motion.div>

      {/* LAYER 2: EDGE VIGNETTE GLOW */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          theme === "dark"
            ? "bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)] shadow-[inset_0_0_120px_rgba(249,115,22,0.12)]"
            : "bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.08)_100%)]"
        }`}
      />
    </div>
  );
}

// =========================================================================
// THEME-SWITCH: 5-VERTICAL SHUTTER BLINDS (Màn trập)
// =========================================================================
function ShutterBlindsThemeTransition({
  isDropping,
  theme,
}: {
  isDropping: boolean;
  theme: ThemeMode;
}) {
  if (!isDropping) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: "-100%" }}
          animate={{ y: ["-100%", "0%", "0%", "-100%"] }}
          transition={{
            duration: 0.7,
            times: [0, 0.4, 0.6, 1],
            delay: i * 0.04,
            ease: [0.65, 0, 0.35, 1],
          }}
          className={`flex-1 h-full border-r ${
            theme === "dark"
              ? "bg-[#09090B] border-orange-500/30"
              : theme === "contrast"
                ? "bg-black border-white"
                : "bg-zinc-900 border-zinc-700"
          }`}
        />
      ))}
    </div>
  );
}

// =========================================================================
// SECTION TRANSITION: SCROLL HIJACKING ASYMMETRIC STICKY CONTAINER
// =========================================================================
function AsymmetricScrollHijackSectionV3({
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

  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.93, 1, 1, 0.91]);
  const rotateY = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [-5, 0, 0, 5]);
  const clipPath = useTransform(
    scrollYProgress,
    [0, 0.15, 0.85, 1],
    [
      "inset(4% 2% 4% 2% round 0px)",
      "inset(0% 0% 0% 0% round 0px)",
      "inset(0% 0% 0% 0% round 0px)",
      "inset(4% 2% 4% 2% round 0px)",
    ],
  );
  const yContent = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [40, 0, 0, -40]);

  return (
    <div ref={containerRef} id={id} className="relative min-h-[190vh] sm:min-h-[220vh] w-full">
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden [perspective:1400px]">
        <motion.div
          style={{
            scale,
            rotateY,
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

// 5 PROBLEMS - EXACT PART 1
const PROBLEMS_DATA = [
  {
    num: "01",
    title: "Thông tin phân tán",
    tagline: "Khó tìm đúng người",
    desc: "Khó tìm đúng người trong mạng lưới do dữ liệu lưu trữ rải rác trên danh bạ, Zalo và nhiều file Excel rời rạc.",
  },
  {
    num: "02",
    title: "Khó duy trì quan hệ",
    tagline: "Thiếu công cụ nhắc nhở và theo dõi tương tác",
    desc: "Thiếu công cụ nhắc nhở và theo dõi tương tác, khiến sợi dây liên kết giữa các thành viên dần nguội lạnh.",
  },
  {
    num: "03",
    title: "Bỏ lỡ cơ hội",
    tagline: "Không kịp nắm bắt cơ hội phù hợp",
    desc: "Không kịp nắm bắt cơ hội phù hợp khi hội viên có nhu cầu hợp tác hoặc cung ứng dịch vụ cấp thiết.",
  },
  {
    num: "04",
    title: "Thiếu kết nối thực chất",
    tagline: "Nhiều sự kiện nhưng khó tạo giá trị sau sự kiện",
    desc: "Nhiều sự kiện nhưng khó tạo giá trị sau sự kiện, giao lưu xã giao bề nổi thiếu cơ chế xúc tiến 1-on-1.",
  },
  {
    num: "05",
    title: "Khó đo lường hiệu quả",
    tagline: "Không biết mối quan hệ mang lại giá trị gì",
    desc: "Không biết mối quan hệ mang lại giá trị gì, thiếu hệ thống số hóa ghi nhận doanh thu và cơ hội giao thương.",
  },
];

// 9 SOLUTIONS - EXACT PART 1
const SOLUTIONS_DATA = [
  {
    icon: Users,
    title: "Quản lý hội viên",
    desc: "Hồ sơ 360°, phân nhóm thông minh, tra cứu nhanh năng lực doanh nghiệp và ban điều hành.",
  },
  {
    icon: HeartHandshake,
    title: "CRM & Quan hệ",
    desc: "Theo dõi lịch sử, ghi chú, nhắc nhở tương tác và quản lý mức độ gắn kết bền chặt.",
  },
  {
    icon: Briefcase,
    title: "Cơ hội kinh doanh",
    desc: "Quản lý pipeline, matching nhu cầu cung - cầu, xúc tiến thương mại và tìm kiếm đối tác B2B.",
  },
  {
    icon: CalendarCheck,
    title: "Sự kiện",
    desc: "Tổ chức, quản lý đại biểu, check-in QR/NFC một chạm, kết nối trước - trong - sau sự kiện.",
  },
  {
    icon: MessagesSquare,
    title: "Cộng đồng & Nhóm",
    desc: "Không gian kết nối theo ngành nghề, phân ban chuyên môn và câu lạc bộ doanh nhân chiến lược.",
  },
  {
    icon: BookOpen,
    title: "Tri thức & Nội dung",
    desc: "Chia sẻ kinh nghiệm chuyên gia, tài liệu pháp lý, chuẩn mực quản trị và báo cáo ngành độc quyền.",
  },
  {
    icon: BarChart3,
    title: "Báo cáo & Phân tích",
    desc: "Đo lường hiệu quả kết nối, lưu lượng giao thương, tần suất tương tác và tỷ suất hoàn vốn ROI.",
  },
  {
    icon: Bot,
    title: "AI Copilot",
    desc: "Tìm kiếm ngữ nghĩa, gợi ý kết nối chuẩn xác, tóm tắt hồ sơ năng lực và trợ lý kinh doanh AI.",
  },
  {
    icon: PlugZap,
    title: "Tích hợp & Mở rộng",
    desc: "Kết nối liền mạch với hệ sinh thái CRM, email, calendar và API mở tiêu chuẩn quốc tế.",
  },
];

// 6 LOGOS
const LOGOS = [
  { name: "VCCI", label: "Liên đoàn Thương mại & Công nghiệp VN" },
  { name: "AmCham", label: "Hiệp hội Doanh nghiệp Hoa Kỳ" },
  { name: "EuroCham", label: "Hiệp hội Doanh nghiệp Châu Âu" },
  { name: "KoCham", label: "Hiệp hội Doanh nghiệp Hàn Quốc" },
  { name: "SBF", label: "Singapore Business Federation" },
  { name: "AusCham", label: "Hiệp hội Doanh nghiệp Úc" },
];

// 3 TESTIMONIALS
const REVIEWS = [
  {
    quote:
      "Business Connect đã giúp Hiệp hội chuyển đổi số toàn diện công tác hội viên. Tỷ lệ kết nối thành công giữa các doanh nghiệp du lịch tăng hơn 300% chỉ sau một kỳ đại hội.",
    author: "Nguyễn Thị Lan",
    role: "Chủ tịch",
    org: "Hiệp hội Du lịch Việt Nam",
  },
  {
    quote:
      "Tính năng AI matching mở ra cho công ty tôi 5 hợp đồng cung ứng chiến lược trong nước và khu vực. Khả năng theo dõi cơ hội và nhắc lịch chăm sóc quan hệ cực kỳ tinh tế.",
    author: "Trần Minh Quân",
    role: "CEO",
    org: "Công ty Sản xuất Việt",
  },
  {
    quote:
      "Một nền tảng chuẩn mực cho giới doanh nhân cấp cao. Thiết kế trang trọng, bảo mật và mang lại giá trị thiết thực cho từng buổi kết nối giao thương.",
    author: "Lê Hoàng Anh",
    role: "Doanh nhân",
    org: "Hội viên VIP Câu lạc bộ Doanh nghiệp",
  },
];

export function BusinessConnectLandingV3() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const { isTransitioning, targetTheme, switchTheme } = useDoorThemeSwitch(theme, setTheme);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [hoveredProblem, setHoveredProblem] = useState<string | null>(null);

  const { isVisible: isHeaderVisible, isAtTop } = useAutoHideHeader();

  const handleSwitchTheme = (nextTheme: ThemeMode) => {
    switchTheme(nextTheme);
  };

  return (
    <HeritageLayoutWrapper
      theme={theme}
      isThemeTransitioning={isTransitioning}
      targetTheme={targetTheme}
    >
      {/* DYNAMIC FLUID LIQUID AURORA MESH */}
      <LiquidAuroraBackground />

      {/* =========================================================================
          1. HEADER
      ========================================================================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 ${
          isHeaderVisible ? "translate-y-0" : "-translate-y-full pointer-events-none"
        } ${
          isAtTop
            ? "bg-transparent py-5"
            : theme === "dark"
              ? "bg-[#09090B]/90 backdrop-blur-md border-b border-zinc-800 py-3"
              : theme === "contrast"
                ? "bg-white border-b-2 border-black py-3"
                : "bg-white/90 backdrop-blur-md border-b border-zinc-200 py-3"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div
              className={`h-9 w-9 flex items-center justify-center font-bold text-sm border ${
                theme === "dark"
                  ? "bg-orange-500 text-black border-orange-400"
                  : theme === "contrast"
                    ? "bg-black text-white border-black"
                    : "bg-black text-white border-black"
              }`}
            >
              BC
            </div>
            <div>
              <div className="font-bold tracking-tight text-sm uppercase">BUSINESS CONNECT</div>
              <div className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                EDITORIAL • V3
              </div>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-8 text-sm font-semibold">
            <a href="#giai-phap" className="hover:text-orange-500 transition">
              Giải pháp
            </a>
            <a href="#khach-hang" className="hover:text-orange-500 transition">
              Khách hàng
            </a>
            <a href="#cau-chuyen" className="hover:text-orange-500 transition">
              Câu chuyện
            </a>
            <a href="#he-sinh-thai" className="hover:text-orange-500 transition">
              Hệ sinh thái
            </a>
            <a href="#van-de" className="hover:text-orange-500 transition">
              Vấn đề
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Version Switcher Pills */}
            <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto py-0.5">
              <Link to="/business-connect/v1" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v1</Link>
              <Link to="/business-connect/v2" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v2</Link>
              <Link to="/business-connect/v3" className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow">v3 ★</Link>
              <Link to="/business-connect/v4" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v4</Link>
              <Link to="/business-connect/v5" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v5</Link>
              <Link to="/business-connect/v6" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v6</Link>
              <Link to="/business-connect/v7" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v7</Link>
            </div>

            {/* Theme switcher */}
            <div
              className={`flex items-center border p-1 rounded-lg ${
                theme === "dark"
                  ? "border-zinc-800 bg-zinc-900"
                  : theme === "contrast"
                    ? "border-black bg-white"
                    : "border-zinc-200 bg-zinc-100"
              }`}
            >
              <button
                onClick={() => handleSwitchTheme("light")}
                className={`p-1.5 rounded transition ${
                  theme === "light"
                    ? "bg-white text-black shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleSwitchTheme("dark")}
                className={`p-1.5 rounded transition ${
                  theme === "dark"
                    ? "bg-zinc-800 text-orange-400 shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleSwitchTheme("contrast")}
                className={`p-1.5 rounded transition ${
                  theme === "contrast" ? "bg-black text-white" : "opacity-60 hover:opacity-100"
                }`}
              >
                <Contrast className="h-3.5 w-3.5" />
              </button>
            </div>

            <Link
              to="/auth"
              className="hidden sm:inline-block px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
            >
              Đăng nhập
            </Link>

            <button
              onClick={() => setShowDemoModal(true)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-150 active:translate-x-0.5 active:translate-y-0.5 ${
                theme === "dark"
                  ? "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-bold border border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:shadow-[0_0_30px_rgba(245,158,11,0.55)]"
                  : theme === "contrast"
                    ? "bg-black text-white border-2 border-black"
                    : "bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
              }`}
            >
              <span>Đặt demo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. HERO SECTION (ASYMMETRIC GRID: 7 vs 5 + OVERLAPPING STATS BENTO)
      ========================================================================= */}
      <AsymmetricScrollHijackSectionV3 className="pt-24 sm:pt-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* ASYMMETRIC COL 7: EDITORIAL HERO CONTENT */}
          <div className="lg:col-span-7 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 border text-xs font-mono font-bold uppercase tracking-widest mb-6 border-current/20">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              <span>NỀN TẢNG KẾT NỐI KINH DOANH THẾ HỆ MỚI</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.06] mb-6">
              Hiểu đúng người. <br />
              <span
                className={
                  theme === "dark"
                    ? "text-orange-500"
                    : theme === "contrast"
                      ? "underline decoration-4"
                      : "text-zinc-950"
                }
              >
                Mở ra cơ hội thật.
              </span>
            </h1>

            <p className="text-base sm:text-lg leading-relaxed opacity-85 max-w-2xl mb-8">
              Business Connect giúp các hiệp hội, tổ chức và doanh nhân quản lý mối quan hệ, kết nối
              đúng người, đúng thời điểm và tạo ra nhiều cơ hội kinh doanh hơn với sức mạnh của AI.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setShowDemoModal(true)}
                className={`inline-flex items-center gap-3 px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-150 active:translate-x-1 active:translate-y-1 ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-bold border border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.6)]"
                    : theme === "contrast"
                      ? "bg-black text-white border-2 border-black"
                      : "bg-black text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)]"
                }`}
              >
                <span>Đặt demo ngay</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => setShowVideoModal(true)}
                className="inline-flex items-center gap-3 px-7 py-4 text-sm font-bold uppercase tracking-wider border border-current/30 hover:bg-current/5 transition active:translate-x-1 active:translate-y-1"
              >
                <Play className="h-4 w-4 fill-current text-orange-500" />
                <span>Xem video (2 phút)</span>
              </button>
            </div>
          </div>

          {/* ASYMMETRIC COL 5: LIVE EDITORIAL TELEMETRY CONSOLE */}
          <div className="lg:col-span-5 relative">
            <div
              className={`p-6 sm:p-7 border font-mono text-xs transition-all ${
                theme === "dark"
                  ? "bg-zinc-950/90 border-zinc-700 shadow-[10px_10px_0px_0px_rgba(249,115,22,0.3)]"
                  : theme === "contrast"
                    ? "bg-white border-2 border-black"
                    : "bg-white border-zinc-300 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.15)]"
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-current/15 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-orange-500 ml-2">
                    AI_DISCOVERY_ENGINE
                  </span>
                </div>
                <span className="text-[10px] opacity-60">STATUS: ACTIVE</span>
              </div>

              <div className="space-y-3">
                <div className="p-3 border border-current/10 bg-current/5 rounded">
                  <div className="text-[10px] text-orange-400 uppercase tracking-wider">
                    TARGET: DOANH NGHIỆP CUNG ỨNG LOGISTICS
                  </div>
                  <div className="text-xs font-bold mt-1">Đã khớp 4 đối tác chiến lược tại Hà Nội & HCM</div>
                  <div className="text-[10px] opacity-70 mt-1">Độ chính xác hồ sơ năng lực: 98.6%</div>
                </div>

                <div className="p-3 border border-current/10 bg-current/5 rounded">
                  <div className="text-[10px] text-orange-400 uppercase tracking-wider">
                    DEAL PIPELINE VỪA KHỞI TẠO
                  </div>
                  <div className="text-xs font-bold mt-1">Biên bản ghi nhớ hợp tác thương mại 1.8M USD</div>
                  <div className="text-[10px] opacity-70 mt-1">Tự động đẩy vào CRM và lịch nhắc tiếp cận</div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-current/10 text-[11px]">
                  <span className="text-orange-500 font-bold">SMART_RECOMMENDATIONS: ON</span>
                  <span className="opacity-70">LATENCY: 0.04s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* OVERLAPPING STATS BENTO WITH MAGNIFYING LENS */}
        <div
          className={`-mt-6 sm:-mt-10 lg:-mt-14 relative z-20 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 p-6 sm:p-8 border ${
            theme === "dark"
              ? "bg-zinc-900 border-zinc-700 shadow-[8px_8px_0px_0px_rgba(245,158,11,0.35)]"
              : theme === "contrast"
                ? "bg-white border-2 border-black"
                : "bg-white border-zinc-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.18)]"
          }`}
        >
          <MagnifyingGlassLensStat number="10,000+" label="Doanh nhân & Hội viên" />
          <MagnifyingGlassLensStat number="300+" label="Hiệp hội & Tổ chức" />
          <MagnifyingGlassLensStat number="50,000+" label="Kết nối được tạo" />
          <MagnifyingGlassLensStat number="20+" label="Quốc gia & vùng lãnh thổ" />
        </div>
      </AsymmetricScrollHijackSectionV3>

      {/* =========================================================================
          3. PROBLEM SECTION (ASYMMETRIC STICKY LEFT COL 4 vs OVERLAPPING CARDS COL 8)
      ========================================================================= */}
      <AsymmetricScrollHijackSectionV3 id="van-de">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ASYMMETRIC STICKY LEFT COLUMN */}
          <div className="lg:col-span-4 lg:sticky lg:top-8">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-orange-500 mb-2">
              NHIỀU TỔ CHỨC VẪN ĐANG GẶP NHỮNG VẤN ĐỀ NÀY
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Quản lý quan hệ kinh doanh vẫn còn nhiều thách thức
            </h2>
            <p className="text-sm opacity-80 leading-relaxed mb-6">
              Các tổ chức kết nối thường tốn hàng trăm giờ chuẩn bị sự kiện nhưng thiếu hạ tầng số
              để biến mối quan hệ giao tiếp ban đầu thành hợp đồng hợp tác có giá trị.
            </p>
            <div className="p-4 border border-orange-500/30 bg-orange-500/5 font-mono text-xs text-orange-400">
              AUDIT_STATUS: 5 Bottlenecks Detected
            </div>
          </div>

          {/* ASYMMETRIC OVERLAPPING RIGHT COLUMN */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {PROBLEMS_DATA.map((p, idx) => {
              const isHovered = hoveredProblem === p.num;
              const isOffset = idx % 2 === 1;
              return (
                <div
                  key={p.num}
                  onMouseEnter={() => setHoveredProblem(p.num)}
                  onMouseLeave={() => setHoveredProblem(null)}
                  className={`p-7 border transition-all duration-200 cursor-pointer ${
                    isOffset ? "md:-mt-6 lg:-mt-10" : ""
                  } ${
                    theme === "dark"
                      ? "bg-zinc-900/95 border-zinc-700 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-[8px_8px_0px_0px_rgba(249,115,22,0.4)] hover:border-orange-500"
                      : theme === "contrast"
                        ? "bg-white border-2 border-black hover:bg-zinc-100"
                        : "bg-white border-zinc-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.12)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.25)] hover:border-black"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-orange-500">({p.num})</span>
                    <span className="text-[10px] font-mono opacity-50 uppercase">CHALLENGE</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{p.title}</h3>
                  <div className="text-xs font-mono font-semibold text-orange-400 mb-3">
                    {p.tagline}
                  </div>
                  <p className="text-xs sm:text-sm opacity-80 leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </AsymmetricScrollHijackSectionV3>

      {/* =========================================================================
          4. SOLUTION SECTION (ASYMMETRIC COL 5 SPOTLIGHT vs COL 7 MODULE TILES)
      ========================================================================= */}
      <AsymmetricScrollHijackSectionV3 id="giai-phap">
        <div className="mb-10">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-orange-500 mb-2">
            GIẢI PHÁP BUSINESS CONNECT
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Quản lý kết nối. Tạo ra cơ hội.
          </h2>
          <p className="text-sm sm:text-base opacity-80 max-w-3xl leading-relaxed">
            Một nền tảng toàn diện giúp hiệp hội, tổ chức và doanh nhân hiểu khách hàng, kết nối
            đúng người, xây dựng quan hệ bền vững và biến mối quan hệ thành cơ hội kinh doanh thực
            chất.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ASYMMETRIC STICKY SPOTLIGHT CARD OVERLAPPING INWARD */}
          <div className="lg:col-span-5 lg:sticky lg:top-8">
            <div
              className={`p-8 border ${
                theme === "dark"
                  ? "bg-zinc-950 border-orange-500/40 shadow-[10px_10px_0px_0px_rgba(249,115,22,0.3)]"
                  : theme === "contrast"
                    ? "bg-white border-2 border-black"
                    : "bg-white border-zinc-400 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.2)]"
              }`}
            >
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase text-orange-500 mb-4">
                <Sparkles className="h-4 w-4" />
                <span>KIẾN TRÚC MÔ-ĐUN HỢP NHẤT</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                Hệ sinh thái thông minh điều hướng cơ hội 1-on-1
              </h3>
              <p className="text-xs sm:text-sm opacity-80 leading-relaxed mb-6">
                Mọi hội viên và đại biểu tham dự đều có một định danh số tin cậy. Dữ liệu tương tác
                được đồng bộ theo thời gian thực tới ban điều hành hiệp hội.
              </p>
              <div className="space-y-2 border-t border-current/15 pt-4 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="opacity-70">CRM ENGINE</span>
                  <span className="text-orange-500 font-bold">READY</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">DEAL PIPELINE</span>
                  <span className="text-orange-500 font-bold">AUTOMATED</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">NFC/QR EVENT CHECKIN</span>
                  <span className="text-orange-500 font-bold">INSTANT</span>
                </div>
              </div>
            </div>
          </div>

          {/* ASYMMETRIC MODULE CARDS - OVERLAPPING ONTO BORDER */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {SOLUTIONS_DATA.map((s, idx) => {
              const Icon = s.icon;
              return (
                <HolographicFoilCard
                  key={s.title}
                  className={`p-6 border transition-all duration-150 ${
                    theme === "dark"
                      ? "bg-zinc-900/90 border-zinc-700 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.08)] hover:border-amber-400 hover:shadow-[6px_6px_0px_0px_rgba(245,158,11,0.3)]"
                      : theme === "contrast"
                        ? "bg-white border-2 border-black"
                        : "bg-white border-zinc-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 border border-current/20 text-amber-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-mono opacity-50">#0{idx + 1}</span>
                  </div>
                  <h3 className="text-base font-bold mb-1.5">{s.title}</h3>
                  <p className="text-xs opacity-80 leading-relaxed">{s.desc}</p>
                </HolographicFoilCard>
              );
            })}
          </div>
        </div>
      </AsymmetricScrollHijackSectionV3>

      {/* =========================================================================
          5. ECOSYSTEM SECTION (OVERLAPPING PIERCING BANNER)
      ========================================================================= */}
      <AsymmetricScrollHijackSectionV3 id="he-sinh-thai">
        <div
          className={`p-8 sm:p-12 border relative overflow-hidden ${
            theme === "dark"
              ? "bg-zinc-900 border-zinc-700 shadow-[12px_12px_0px_0px_rgba(249,115,22,0.35)]"
              : theme === "contrast"
                ? "bg-white border-2 border-black"
                : "bg-white border-zinc-300 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)]"
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8">
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-orange-500 mb-2">
                HỆ SINH THÁI KẾT NỐI KINH DOANH
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Cùng nhau tạo ra giá trị lớn hơn
              </h2>
              <p className="text-sm sm:text-base opacity-80 leading-relaxed mb-6">
                Business Connect kết nối hội viên, hiệp hội, doanh nghiệp, chuyên gia, đối tác, nhà
                đầu tư và các tổ chức quốc tế trong một hệ sinh thái mở, để cùng chia sẻ tri thức,
                nguồn lực và cơ hội kinh doanh.
              </p>

              <div
                className={`p-4 border inline-block mb-6 ${
                  theme === "dark"
                    ? "bg-black border-orange-500/50 text-orange-400"
                    : theme === "contrast"
                      ? "bg-black text-white"
                      : "bg-zinc-100 border-black font-bold"
                }`}
              >
                <div className="text-xs sm:text-sm font-mono font-bold uppercase tracking-widest">
                  NHIỀU KẾT NỐI HƠN. NHIỀU CƠ HỘI HƠN. NHIỀU GIÁ TRỊ HƠN.
                </div>
              </div>

              {/* Scroll-Triggered SVG Gooey Morphing Droplet Bursting into Pipes */}
              <GooeySvgMorphEcosystem />
            </div>

            {/* ASYMMETRIC RIGHT PIERCING BOX */}
            <div className="lg:col-span-4 lg:-mt-12">
              <div
                className={`p-6 border ${
                  theme === "dark"
                    ? "bg-black/80 border-orange-500/40 shadow-[6px_6px_0px_0px_rgba(249,115,22,0.3)]"
                    : theme === "contrast"
                      ? "bg-black text-white"
                      : "bg-zinc-50 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]"
                }`}
              >
                <div className="text-xs font-mono uppercase tracking-widest text-orange-400 mb-2">
                  TIÊU CHUẨN KẾT NỐI
                </div>
                <div className="text-lg font-bold mb-3">Mở rộng không giới hạn</div>
                <p className="text-xs opacity-80 mb-6">
                  Sẵn sàng tích hợp API với các hiệp hội quốc tế, liên minh thương mại và hệ sinh
                  thái quản trị doanh nghiệp.
                </p>
                <button
                  onClick={() => setShowDemoModal(true)}
                  className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-orange-500 hover:underline"
                >
                  <span>Xem tài liệu tích hợp</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </AsymmetricScrollHijackSectionV3>

      {/* =========================================================================
          6. CLIENTS & TESTIMONIALS (OVERLAPPING ASYMMETRIC QUOTES)
      ========================================================================= */}
      <AsymmetricScrollHijackSectionV3 id="khach-hang">
        <div className="mb-8">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-orange-500 mb-2">
            ĐƯỢC TIN TƯỞNG BỞI CÁC HIỆP HỘI VÀ DOANH NGHIỆP
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Những tổ chức tiên phong đã lựa chọn
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
          {LOGOS.map((l) => (
            <div
              key={l.name}
              className={`p-5 border text-center ${
                theme === "dark"
                  ? "bg-zinc-900 border-zinc-800"
                  : theme === "contrast"
                    ? "bg-white border-2 border-black"
                    : "bg-white border-zinc-200"
              }`}
            >
              <div className="text-base font-bold">{l.name}</div>
              <div className="text-[10px] opacity-60 mt-1 leading-tight">{l.label}</div>
            </div>
          ))}
        </div>

        <div id="cau-chuyen" className="mb-8">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-orange-500 mb-2">
            CÂU CHUYỆN THÀNH CÔNG
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Kết nối đúng. Tăng trưởng thật.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((r, idx) => (
            <div
              key={r.author}
              className={`p-7 border flex flex-col justify-between relative ${
                idx === 1 ? "md:-mt-6" : ""
              } ${
                theme === "dark"
                  ? "bg-zinc-900 border-zinc-700 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.08)]"
                  : theme === "contrast"
                    ? "bg-white border-2 border-black"
                    : "bg-white border-zinc-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)]"
              }`}
            >
              <div className="absolute -top-3 left-6 px-2 py-0.5 border text-[10px] font-mono uppercase bg-orange-500 text-black border-orange-400 font-bold">
                VERIFIED_CASE_0{idx + 1}
              </div>
              <p className="text-xs sm:text-sm leading-relaxed mb-6 opacity-90 pt-2">"{r.quote}"</p>
              <div className="border-t border-current/15 pt-4">
                <div className="font-bold text-sm">{r.author}</div>
                <div className="text-xs opacity-70">
                  {r.role}, {r.org}
                </div>
              </div>
            </div>
          ))}
        </div>
      </AsymmetricScrollHijackSectionV3>

      {/* =========================================================================
          7. FOOTER
      ========================================================================= */}
      <footer
        className={`py-20 px-4 sm:px-6 lg:px-8 border-t ${
          theme === "dark"
            ? "border-zinc-800 bg-black"
            : theme === "contrast"
              ? "border-black bg-black text-white"
              : "border-zinc-200 bg-zinc-100"
        }`}
      >
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Sẵn sàng mở ra nhiều cơ hội hơn?</h2>
          <p className="text-sm sm:text-base opacity-75 max-w-2xl mx-auto mb-8">
            Hãy để Business Connect đồng hành cùng hiệp hội hoặc doanh nghiệp của bạn.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <button
              onClick={() => setShowDemoModal(true)}
              className={`inline-flex items-center gap-2 px-7 py-3.5 text-xs font-bold uppercase tracking-wider ${
                theme === "dark"
                  ? "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-bold border border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:shadow-[0_0_30px_rgba(245,158,11,0.55)]"
                  : theme === "contrast"
                    ? "bg-white text-black border-2 border-white"
                    : "bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
              }`}
            >
              <span>Đặt demo ngay</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                toast.success("Cảm ơn bạn! Chuyên viên tư vấn sẽ liên hệ trong vòng 24 giờ.");
              }}
              className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider border border-current/30 hover:bg-current/5"
            >
              Liên hệ tư vấn
            </button>
          </div>

          <div className="text-xs opacity-50 font-mono border-t border-current/10 pt-8">
            © {new Date().getFullYear()} Business Connect. Editorial Edition V3.
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-lg p-8 border ${
                theme === "dark"
                  ? "bg-zinc-900 border-zinc-700 text-white shadow-[10px_10px_0px_0px_rgba(249,115,22,0.5)]"
                  : theme === "contrast"
                    ? "bg-white text-black border-2 border-black"
                    : "bg-white text-black border-2 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,0.25)]"
              }`}
            >
              <button
                onClick={() => setShowDemoModal(false)}
                className="absolute top-4 right-4 p-2 opacity-60 hover:opacity-100"
              >
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-xl font-bold mb-2">Đăng Ký Trải Nghiệm Demo</h3>
              <p className="text-xs opacity-75 mb-6">
                Chuyên viên cấp cao sẽ liên hệ trực tiếp để giới thiệu giải pháp phù hợp nhất.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Đăng ký thành công! Chúng tôi sẽ liên hệ trong vòng 24 giờ.");
                  setShowDemoModal(false);
                }}
                className="space-y-4 text-left"
              >
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-1">
                    Họ và tên
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full px-4 py-2.5 border bg-transparent text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-1">
                    Doanh nghiệp / Hiệp hội
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="VD: Công ty TNHH Cung Ứng..."
                    className="w-full px-4 py-2.5 border bg-transparent text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-1">
                    Số điện thoại
                  </label>
                  <input
                    required
                    type="tel"
                    placeholder="VD: 0987654321"
                    className="w-full px-4 py-2.5 border bg-transparent text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-bold shadow-md hover:shadow-lg transition mt-4"
                >
                  Xác Nhận Đăng Ký
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showVideoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div className="relative w-full max-w-4xl bg-black border border-white/20 p-8 flex flex-col items-center justify-center text-white aspect-video">
              <button
                onClick={() => setShowVideoModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
              <Play className="h-16 w-16 text-orange-500 mb-4 animate-pulse" />
              <div className="text-lg font-bold">Giới Thiệu Nền Tảng Business Connect (2 Phút)</div>
              <div className="text-xs text-zinc-400 mt-1">Đang kết nối luồng trình chiếu...</div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </HeritageLayoutWrapper>
  );
}
