import React, { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
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
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck,
  MessagesSquare,
  PlugZap,
  Briefcase,
  HeartHandshake,
  Cpu,
  Terminal,
  Server,
  Zap,
  Radio,
  Binary,
} from "lucide-react";
import { toast } from "sonner";
import { useAutoHideHeader } from "./useAutoHideHeader";
import { GlassLayoutWrapper } from "./wrappers/GlassLayoutWrapper";
import { useDoorThemeSwitch } from "./DoorThemeTransition";

export type ThemeMode = "light" | "dark" | "contrast";

// =========================================================================
// 3-LAYER BACKGROUND: DEEP TECH DATA WITH 50% SCROLL PARALLAX
// Layer 0: Real Unsplash image of Data Center / Processor Chip with 50% parallax
// Layer 1: Overlay covering 90% of image, revealing server blink lights
// Layer 2: Subtle circuit board grid pattern & opposing floating cyber telemetry HUD
// =========================================================================
function DeepTechThreeLayerBackground({ theme }: { theme: ThemeMode }) {
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "45%"]);
  const hud1Y = useTransform(scrollYProgress, [0, 1], [-90, 140]);
  const hud2Y = useTransform(scrollYProgress, [0, 1], [130, -130]);
  const rot1 = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const rot2 = useTransform(scrollYProgress, [0, 1], [0, -180]);

  if (theme === "contrast") {
    return <div className="pointer-events-none fixed inset-0 z-0 bg-black" />;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* LAYER 0: REAL IMAGE WITH 50% SCROLL PARALLAX */}
      <motion.div style={{ y: bgY }} className="absolute -top-[25%] inset-x-0 h-[150%] w-full">
        <img
          src={
            theme === "dark"
              ? "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=2400&q=80"
              : "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=2400&q=80"
          }
          alt="Data Center Core"
          className="h-full w-full object-cover object-center filter brightness-[0.65] contrast-125"
        />
      </motion.div>

      {/* LAYER 1: OVERLAY */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          theme === "dark"
            ? "bg-[#030712]/92 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.18),transparent_60%)]"
            : "bg-[#F8FAFC]/94 bg-[radial-gradient(ellipse_at_top_right,rgba(148,163,184,0.2),transparent_60%)]"
        }`}
      />

      {/* OPPOSING FLOATING CYBER TELEMETRY ELEMENTS (Z-AXIS PARALLAX) */}
      <motion.div
        style={{ y: hud1Y, rotate: rot1 }}
        className="absolute top-[20%] left-[6%] border border-cyan-500/30 bg-cyan-950/20 p-4 font-mono text-[10px] text-cyan-400 backdrop-blur-sm hidden md:block"
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-3 w-3 animate-pulse" />
          <span>PORT: 8080 // ONLINE</span>
        </div>
        <div className="text-[9px] text-zinc-500 mt-1">PEER_SYNC: VERIFIED</div>
      </motion.div>

      <motion.div
        style={{ y: hud2Y, rotate: rot2 }}
        className="absolute top-[62%] right-[8%] border border-pink-500/30 bg-pink-950/20 p-4 font-mono text-[10px] text-pink-400 backdrop-blur-sm hidden md:block"
      >
        <div className="flex items-center gap-2">
          <Cpu className="h-3 w-3 text-pink-400 animate-spin" />
          <span>NEURAL_DISPATCH: 100%</span>
        </div>
        <div className="text-[9px] text-zinc-500 mt-1">BLOCK_HASH: #983F01</div>
      </motion.div>

      {/* LAYER 2: CIRCUIT BOARD GRID */}
      <div
        className={`absolute inset-0 opacity-15 pointer-events-none ${
          theme === "dark"
            ? "bg-[linear-gradient(to_right,#00F0FF_1px,transparent_1px),linear-gradient(to_bottom,#00F0FF_1px,transparent_1px)] bg-[size:48px_48px]"
            : "bg-[linear-gradient(to_right,#475569_1px,transparent_1px),linear-gradient(to_bottom,#475569_1px,transparent_1px)] bg-[size:48px_48px]"
        }`}
      />
    </div>
  );
}

// =========================================================================
// THEME-SWITCH: CIRCUIT TRACE TRANSITION (Neon line drawing across screen)
// =========================================================================
function CircuitTraceThemeTransition({
  isTracing,
  theme,
}: {
  isTracing: boolean;
  theme: ThemeMode;
}) {
  if (!isTracing) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {/* Neon Cyber Laser Sweep */}
      <motion.div
        initial={{ left: "-100%", top: "0%" }}
        animate={{ left: "200%", top: "100%" }}
        transition={{ duration: 0.65, ease: [0.65, 0, 0.35, 1] }}
        className="absolute h-[3px] w-[200vw] -rotate-45 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_35px_rgba(6,182,212,1)]"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0.6, 0] }}
        transition={{ duration: 0.65, times: [0, 0.3, 0.7, 1] }}
        className={`absolute inset-0 ${
          theme === "dark" ? "bg-cyan-950/30" : theme === "contrast" ? "bg-black/40" : "bg-white/40"
        }`}
      />
    </div>
  );
}

// =========================================================================
// SECTION TRANSITION: SCROLL HIJACKING ASYMMETRIC STICKY CONTAINER
// =========================================================================
function AsymmetricScrollHijackSectionV5({
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

  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.92, 1, 1, 0.91]);
  const rotateX = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [6, 0, 0, -6]);
  const clipPath = useTransform(
    scrollYProgress,
    [0, 0.15, 0.85, 1],
    [
      "polygon(0 4%, 100% 0, 100% 96%, 0 100%)",
      "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
      "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
      "polygon(0 0, 100% 4%, 100% 100%, 0 96%)",
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

// 5 PROBLEMS - EXACT PART 1
const PROBLEMS_DATA = [
  {
    num: "01",
    title: "Thông tin phân tán",
    tagline: "Khó tìm đúng người",
    desc: "Khó tìm đúng người trong mạng lưới do dữ liệu lưu trữ rải rác trên danh bạ, Zalo và nhiều file Excel rời rạc.",
    code: "ERR_DISPERSED_DATA",
  },
  {
    num: "02",
    title: "Khó duy trì quan hệ",
    tagline: "Thiếu công cụ nhắc nhở và theo dõi tương tác",
    desc: "Thiếu công cụ nhắc nhở và theo dõi tương tác, khiến sợi dây liên kết giữa các thành viên dần nguội lạnh.",
    code: "ERR_DROPPED_RELATIONS",
  },
  {
    num: "03",
    title: "Bỏ lỡ cơ hội",
    tagline: "Không kịp nắm bắt cơ hội phù hợp",
    desc: "Không kịp nắm bắt cơ hội phù hợp khi hội viên có nhu cầu hợp tác hoặc cung ứng dịch vụ cấp thiết.",
    code: "ERR_MISSED_DEALS",
  },
  {
    num: "04",
    title: "Thiếu kết nối thực chất",
    tagline: "Nhiều sự kiện nhưng khó tạo giá trị sau sự kiện",
    desc: "Nhiều sự kiện nhưng khó tạo giá trị sau sự kiện, giao lưu xã giao bề nổi thiếu cơ chế xúc tiến 1-on-1.",
    code: "ERR_SHALLOW_NET",
  },
  {
    num: "05",
    title: "Khó đo lường hiệu quả",
    tagline: "Không biết mối quan hệ mang lại giá trị gì",
    desc: "Không biết mối quan hệ mang lại giá trị gì, thiếu hệ thống số hóa ghi nhận doanh thu và cơ hội giao thương.",
    code: "ERR_METRICS_NULL",
  },
];

// 9 SOLUTIONS - EXACT PART 1
const SOLUTIONS_DATA = [
  {
    icon: Users,
    title: "Quản lý hội viên",
    desc: "Hồ sơ 360°, phân nhóm thông minh, tra cứu nhanh năng lực doanh nghiệp và ban điều hành.",
    code: "MODULE_MEMBERS_360",
  },
  {
    icon: HeartHandshake,
    title: "CRM & Quan hệ",
    desc: "Theo dõi lịch sử, ghi chú, nhắc nhở tương tác và quản lý mức độ gắn kết bền chặt.",
    code: "MODULE_RELATION_CRM",
  },
  {
    icon: Briefcase,
    title: "Cơ hội kinh doanh",
    desc: "Quản lý pipeline, matching nhu cầu cung - cầu, xúc tiến thương mại và tìm kiếm đối tác B2B.",
    code: "MODULE_DEAL_PIPELINE",
  },
  {
    icon: CalendarCheck,
    title: "Sự kiện",
    desc: "Tổ chức, quản lý đại biểu, check-in QR/NFC một chạm, kết nối trước - trong - sau sự kiện.",
    code: "MODULE_SMART_EVENTS",
  },
  {
    icon: MessagesSquare,
    title: "Cộng đồng & Nhóm",
    desc: "Không gian kết nối theo ngành nghề, phân ban chuyên môn và câu lạc bộ doanh nhân chiến lược.",
    code: "MODULE_CHAPTERS_NET",
  },
  {
    icon: BookOpen,
    title: "Tri thức & Nội dung",
    desc: "Chia sẻ kinh nghiệm chuyên gia, tài liệu pháp lý, chuẩn mực quản trị và báo cáo ngành độc quyền.",
    code: "MODULE_KNOWLEDGE_VAULT",
  },
  {
    icon: BarChart3,
    title: "Báo cáo & Phân tích",
    desc: "Đo lường hiệu quả kết nối, lưu lượng giao thương, tần suất tương tác và tỷ suất hoàn vốn ROI.",
    code: "MODULE_METRICS_ANALYTICS",
  },
  {
    icon: Bot,
    title: "AI Copilot",
    desc: "Tìm kiếm ngữ nghĩa, gợi ý kết nối chuẩn xác, tóm tắt hồ sơ năng lực và trợ lý kinh doanh AI.",
    code: "MODULE_AI_COPILOT",
  },
  {
    icon: PlugZap,
    title: "Tích hợp & Mở rộng",
    desc: "Kết nối liền mạch với hệ sinh thái CRM, email, calendar và API mở tiêu chuẩn quốc tế.",
    code: "MODULE_OPEN_API_MESH",
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

export function BusinessConnectLandingV5() {
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
    <GlassLayoutWrapper
      theme={theme}
      isThemeTransitioning={isTransitioning}
      targetTheme={targetTheme}
    >

      {/* =========================================================================
          1. HEADER
      ========================================================================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isHeaderVisible ? "translate-y-0" : "-translate-y-full pointer-events-none"
        } ${
          isAtTop
            ? "bg-transparent py-5"
            : theme === "dark"
              ? "bg-[#030712]/80 backdrop-blur-md border-b border-cyan-500/20 py-3"
              : theme === "contrast"
                ? "bg-black border-b-2 border-[#00FF66] py-3 text-[#00FF66]"
                : "bg-white/80 backdrop-blur-md border-b border-slate-200 py-3"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center border font-mono font-bold transition ${
                theme === "dark"
                  ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  : theme === "contrast"
                    ? "bg-[#00FF66] text-black border-[#00FF66]"
                    : "bg-slate-900 border-slate-700 text-white"
              }`}
            >
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold tracking-tight text-sm uppercase">BUSINESS CONNECT</div>
              <div className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
                DEEP TECH • V5
              </div>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-8 text-sm font-medium font-mono">
            <a href="#giai-phap" className="hover:text-cyan-400 transition">
              Giải pháp
            </a>
            <a href="#khach-hang" className="hover:text-cyan-400 transition">
              Khách hàng
            </a>
            <a href="#cau-chuyen" className="hover:text-cyan-400 transition">
              Câu chuyện
            </a>
            <a href="#he-sinh-thai" className="hover:text-cyan-400 transition">
              Hệ sinh thái
            </a>
            <a href="#van-de" className="hover:text-cyan-400 transition">
              Vấn đề
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Version Switcher Pills */}
            <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto py-0.5">
              <Link to="/business-connect/v1" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v1</Link>
              <Link to="/business-connect/v2" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v2</Link>
              <Link to="/business-connect/v3" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v3</Link>
              <Link to="/business-connect/v4" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v4</Link>
              <Link to="/business-connect/v5" className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow">v5 ★</Link>
              <Link to="/business-connect/v6" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v6</Link>
              <Link to="/business-connect/v7" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v7</Link>
            </div>

            {/* Theme switcher */}
            <div
              className={`flex items-center border p-1 rounded-xl font-mono ${
                theme === "dark"
                  ? "border-white/10 bg-white/5"
                  : theme === "contrast"
                    ? "border-[#00FF66] bg-black text-[#00FF66]"
                    : "border-slate-300 bg-white"
              }`}
            >
              <button
                onClick={() => handleSwitchTheme("light")}
                title="Nhôm nguyên khối (Light)"
                className={`p-1.5 rounded-lg transition ${
                  theme === "light"
                    ? "bg-slate-200 text-black shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleSwitchTheme("dark")}
                title="Đen Neon (Dark)"
                className={`p-1.5 rounded-lg transition ${
                  theme === "dark"
                    ? "bg-cyan-500/20 text-cyan-300 shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleSwitchTheme("contrast")}
                title="Terminal (Contrast)"
                className={`p-1.5 rounded-lg transition ${
                  theme === "contrast" ? "bg-[#00FF66] text-black" : "opacity-60 hover:opacity-100"
                }`}
              >
                <Terminal className="h-3.5 w-3.5" />
              </button>
            </div>

            <Link
              to="/auth"
              className="hidden sm:inline-block px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider"
            >
              Đăng nhập
            </Link>

            <button
              onClick={() => setShowDemoModal(true)}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-300 ${
                theme === "dark"
                  ? "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:shadow-[0_0_30px_rgba(245,158,11,0.55)]"
                  : theme === "contrast"
                    ? "bg-[#00FF66] text-black border-2 border-[#00FF66]"
                    : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              <span>Đặt demo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. HERO SECTION (ASYMMETRIC GRID: 7 vs 5 + OVERLAPPING STATS)
      ========================================================================= */}
      <AsymmetricScrollHijackSectionV5 className="pt-24 sm:pt-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* ASYMMETRIC COL 7: DEEP TECH HERO */}
          <div className="lg:col-span-7 z-10 text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6 text-xs font-mono font-bold uppercase tracking-widest border-cyan-500/40 bg-cyan-500/10 text-cyan-400">
              <Zap className="h-3.5 w-3.5" />
              <span>NỀN TẢNG KẾT NỐI KINH DOANH THẾ HỆ MỚI</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6">
              Hiểu đúng người. <br />
              <span
                className={
                  theme === "dark"
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500"
                    : theme === "contrast"
                      ? "text-[#00FF66] underline underline-offset-8"
                      : "text-slate-900"
                }
              >
                Mở ra cơ hội thật.
              </span>
            </h1>

            <p className="text-base sm:text-lg leading-relaxed max-w-2xl mb-8 opacity-85">
              Business Connect giúp các hiệp hội, tổ chức và doanh nhân quản lý mối quan hệ, kết nối
              đúng người, đúng thời điểm và tạo ra nhiều cơ hội kinh doanh hơn với sức mạnh của AI.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setShowDemoModal(true)}
                className={`inline-flex items-center gap-3 rounded-xl px-8 py-4 text-sm font-mono font-bold uppercase tracking-wider transition-all duration-300 transform hover:-translate-y-0.5 ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-bold shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_40px_rgba(245,158,11,0.6)]"
                    : theme === "contrast"
                      ? "bg-[#00FF66] text-black border-2 border-[#00FF66]"
                      : "bg-slate-900 text-white hover:bg-slate-800 shadow-lg"
                }`}
              >
                <span>Đặt demo ngay</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => setShowVideoModal(true)}
                className={`inline-flex items-center gap-3 rounded-xl px-7 py-4 text-sm font-mono font-bold uppercase tracking-wider border transition ${
                  theme === "dark"
                    ? "border-white/20 bg-white/5 text-white hover:bg-white/10"
                    : theme === "contrast"
                      ? "border-2 border-[#00FF66] bg-black text-[#00FF66]"
                      : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                <Play className="h-4 w-4 fill-current text-cyan-400" />
                <span>Xem video (2 phút)</span>
              </button>
            </div>
          </div>

          {/* ASYMMETRIC COL 5: HOLOGRAPHIC HUD CONSOLE */}
          <div className="lg:col-span-5 relative">
            <div
              className={`p-6 sm:p-7 rounded-2xl border font-mono text-xs transition ${
                theme === "dark"
                  ? "bg-[#050C1A]/90 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.25)]"
                  : theme === "contrast"
                    ? "bg-black border-2 border-[#00FF66] text-[#00FF66]"
                    : "bg-white border-slate-300 shadow-xl"
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-current/15 mb-4">
                <div className="flex items-center gap-2">
                  <Binary className="h-4 w-4 text-cyan-400" />
                  <span className="font-bold text-cyan-400 uppercase">SYS_TELEMETRY: RUNNING</span>
                </div>
                <span className="text-[10px] opacity-60">KERNEL: v5.2</span>
              </div>

              <div className="space-y-3 text-left">
                <div className="p-3 border border-current/10 bg-current/5 rounded-lg">
                  <div className="text-[10px] text-cyan-400 uppercase">TOPIC_MATCH // FDI_JAPAN</div>
                  <div className="text-xs font-bold mt-1">Đã khớp 5 cơ hội cung ứng chuỗi bán lẻ quốc tế</div>
                  <div className="text-[10px] opacity-70 mt-1">Trọng số phân loại: 0.994</div>
                </div>

                <div className="p-3 border border-current/10 bg-current/5 rounded-lg">
                  <div className="text-[10px] text-cyan-400 uppercase">CRM_EVENT_BROADCAST</div>
                  <div className="text-xs font-bold mt-1">Đã gửi thông báo nhắc lịch họp ban chấp hành</div>
                  <div className="text-[10px] opacity-70 mt-1">Tỷ lệ mở thông báo: 94.2%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* OVERLAPPING STATS BAR - PIERCING UPWARD WITH NEGATIVE MARGIN */}
        <div
          className={`-mt-6 sm:-mt-10 lg:-mt-14 relative z-20 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 p-6 sm:p-8 rounded-2xl border text-left font-mono ${
            theme === "dark"
              ? "bg-[#050C1A]/95 border-cyan-500/30 shadow-[0_10px_30px_rgba(6,182,212,0.2)]"
              : theme === "contrast"
                ? "bg-black border-2 border-[#00FF66] text-[#00FF66]"
                : "bg-white border-slate-300 shadow-xl"
          }`}
        >
          <div>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight">10,000+</div>
            <div className="text-xs uppercase tracking-wider opacity-70 mt-1">
              Doanh nhân & Hội viên
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight">300+</div>
            <div className="text-xs uppercase tracking-wider opacity-70 mt-1">
              Hiệp hội & Tổ chức
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight">50,000+</div>
            <div className="text-xs uppercase tracking-wider opacity-70 mt-1">Kết nối được tạo</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight">20+</div>
            <div className="text-xs uppercase tracking-wider opacity-70 mt-1">
              Quốc gia & vùng lãnh thổ
            </div>
          </div>
        </div>
      </AsymmetricScrollHijackSectionV5>

      {/* =========================================================================
          3. PROBLEM SECTION (ASYMMETRIC STICKY LEFT COL 4 vs OVERLAPPING CARDS COL 8)
      ========================================================================= */}
      <AsymmetricScrollHijackSectionV5 id="van-de">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ASYMMETRIC STICKY LEFT COLUMN */}
          <div className="lg:col-span-4 lg:sticky lg:top-8 text-left">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 mb-2">
              NHIỀU TỔ CHỨC VẪN ĐANG GẶP NHỮNG VẤN ĐỀ NÀY
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Quản lý quan hệ kinh doanh vẫn còn nhiều thách thức
            </h2>
            <p className="text-sm opacity-80 leading-relaxed mb-6 font-mono">
              Các tổ chức kết nối thường tốn hàng trăm giờ chuẩn bị sự kiện nhưng thiếu hạ tầng số
              để biến mối quan hệ giao tiếp ban đầu thành hợp đồng hợp tác có giá trị.
            </p>
            <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 font-mono text-xs text-cyan-300">
              AUDIT: 5 Điểm nghẽn nghiêm trọng trong quản trị quan hệ
            </div>
          </div>

          {/* ASYMMETRIC OVERLAPPING RIGHT COLUMN */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
            {PROBLEMS_DATA.map((p, idx) => {
              const isHovered = hoveredProblem === p.num;
              const isOffset = idx % 2 === 1;
              return (
                <div
                  key={p.num}
                  onMouseEnter={() => setHoveredProblem(p.num)}
                  onMouseLeave={() => setHoveredProblem(null)}
                  className={`p-7 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    isOffset ? "md:-mt-6 lg:-mt-10" : ""
                  } ${
                    theme === "dark"
                      ? "bg-[#050C1A]/90 border-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]"
                      : theme === "contrast"
                        ? "bg-black border-2 border-[#00FF66] text-[#00FF66]"
                        : "bg-white border-slate-300 shadow-lg hover:border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="text-cyan-400 font-bold">[{p.code}]</span>
                    <span className="opacity-50">#{p.num}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 font-sans">{p.title}</h3>
                  <div className="text-xs text-cyan-300 mb-3">{p.tagline}</div>
                  <p className="text-xs sm:text-sm opacity-80 leading-relaxed font-sans">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </AsymmetricScrollHijackSectionV5>

      {/* =========================================================================
          4. SOLUTION SECTION (ASYMMETRIC COL 5 SPOTLIGHT vs COL 7 MODULE TILES)
      ========================================================================= */}
      <AsymmetricScrollHijackSectionV5 id="giai-phap">
        <div className="mb-10 text-left">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 mb-2">
            GIẢI PHÁP BUSINESS CONNECT
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Quản lý kết nối. Tạo ra cơ hội.
          </h2>
          <p className="text-sm sm:text-base opacity-80 max-w-3xl leading-relaxed">
            Một nền tảng toàn diện giúp hiệp hội, tổ chức và doanh nhân hiểu khách hàng, kết nối
            đúng người, xây dựng quan hệ bền vững và biến mối quan hệ thành cơ hội kinh doanh thực
            chất.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ASYMMETRIC STICKY SPOTLIGHT CARD */}
          <div className="lg:col-span-5 lg:sticky lg:top-8 text-left">
            <div
              className={`p-8 rounded-2xl border font-mono ${
                theme === "dark"
                  ? "bg-[#050C1A] border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.25)]"
                  : theme === "contrast"
                    ? "bg-black border-2 border-[#00FF66] text-[#00FF66]"
                    : "bg-white border-slate-300 shadow-xl"
              }`}
            >
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase text-cyan-400 mb-4">
                <Sparkles className="h-4 w-4" />
                <span>HẠ TẦNG KẾT NỐI DOANH NGHIỆP</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 font-sans">
                Hệ điều hành xúc tiến thương mại và hội viên toàn diện
              </h3>
              <p className="text-xs sm:text-sm opacity-80 leading-relaxed mb-6 font-sans">
                Mỗi hội viên là một nút mạng phân tán trong mạng lưới tin cậy, tự động ghép đôi cơ
                hội kinh doanh thông qua thuật toán AI ngữ nghĩa.
              </p>
              <div className="space-y-2 border-t border-current/15 pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="opacity-70">PROFILE 360° ENGINE</span>
                  <span className="text-cyan-400 font-bold">ONLINE</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">DEAL ROUTING PROTOCOL</span>
                  <span className="text-cyan-400 font-bold">VERIFIED</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">AI GRAPH MATCHING</span>
                  <span className="text-cyan-400 font-bold">0.03s</span>
                </div>
              </div>
            </div>
          </div>

          {/* ASYMMETRIC MODULE CARDS */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {SOLUTIONS_DATA.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className={`p-6 rounded-2xl border transition-all duration-300 ${
                    theme === "dark"
                      ? "bg-[#050C1A]/90 border-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                      : theme === "contrast"
                        ? "bg-black border-2 border-[#00FF66] text-[#00FF66]"
                        : "bg-white border-slate-200 shadow-md hover:border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`h-11 w-11 rounded-xl border flex items-center justify-center ${
                        theme === "dark"
                          ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                          : theme === "contrast"
                            ? "border-2 border-[#00FF66] bg-[#00FF66] text-black"
                            : "border-slate-300 bg-slate-100 text-slate-800"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono opacity-50">[{s.code}]</span>
                  </div>
                  <h3 className="text-base font-bold mb-1.5 font-sans">{s.title}</h3>
                  <p className="text-xs opacity-80 leading-relaxed font-sans">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </AsymmetricScrollHijackSectionV5>

      {/* =========================================================================
          5. ECOSYSTEM SECTION (OVERLAPPING PIERCING BANNER)
      ========================================================================= */}
      <AsymmetricScrollHijackSectionV5 id="he-sinh-thai">
        <div
          className={`p-8 sm:p-12 rounded-2xl border relative overflow-hidden ${
            theme === "dark"
              ? "bg-[#050C1A] border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.2)]"
              : theme === "contrast"
                ? "bg-black border-2 border-[#00FF66] text-[#00FF66]"
                : "bg-white border-slate-300 shadow-2xl"
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 text-left">
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 mb-2">
                HỆ SINH THÁI KẾT NỐI KINH DOANH
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
                Cùng nhau tạo ra giá trị lớn hơn
              </h2>
              <p className="text-sm sm:text-base opacity-80 leading-relaxed mb-6">
                Business Connect kết nối hội viên, hiệp hội, doanh nghiệp, chuyên gia, đối tác, nhà
                đầu tư và các tổ chức quốc tế trong một hệ sinh thái mở, để cùng chia sẻ tri thức,
                nguồn lực và cơ hội kinh doanh.
              </p>

              <div
                className={`p-4 rounded-xl inline-block border mb-6 font-mono ${
                  theme === "dark"
                    ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                    : theme === "contrast"
                      ? "bg-[#00FF66] text-black font-bold"
                      : "bg-slate-100 border-slate-300 text-slate-900 font-bold"
                }`}
              >
                <div className="text-xs sm:text-sm font-bold tracking-widest uppercase">
                  NHIỀU KẾT NỐI HƠN. NHIỀU CƠ HỘI HƠN. NHIỀU GIÁ TRỊ HƠN.
                </div>
              </div>
            </div>

            {/* ASYMMETRIC RIGHT PIERCING BOX */}
            <div className="lg:col-span-4 lg:-mt-10 font-mono">
              <div
                className={`p-6 rounded-2xl border text-left ${
                  theme === "dark"
                    ? "bg-black/80 border-cyan-500/40 shadow-xl"
                    : theme === "contrast"
                      ? "bg-black border-2 border-[#00FF66] text-[#00FF66]"
                      : "bg-slate-50 border-slate-300 shadow-lg"
                }`}
              >
                <div className="text-xs uppercase tracking-widest text-cyan-400 mb-2 font-bold">
                  API & DATA MESH
                </div>
                <div className="text-lg font-bold mb-3 font-sans">Chuẩn Kết Nối Toàn Cầu</div>
                <p className="text-xs opacity-80 mb-6 font-sans">
                  Sẵn sàng tích hợp RESTful API và GraphQL với các cổng dữ liệu hội viên quốc tế và
                  liên đoàn thương mại.
                </p>
                <button
                  onClick={() => setShowDemoModal(true)}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 hover:underline"
                >
                  <span>Xem tài liệu tích hợp</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </AsymmetricScrollHijackSectionV5>

      {/* =========================================================================
          6. CLIENTS & TESTIMONIALS (OVERLAPPING ASYMMETRIC CYBER CARDS)
      ========================================================================= */}
      <AsymmetricScrollHijackSectionV5 id="khach-hang">
        <div className="mb-8 text-left">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 mb-2">
            ĐƯỢC TIN TƯỞNG BỞI CÁC HIỆP HỘI VÀ DOANH NGHIỆP
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Những tổ chức tiên phong đã lựa chọn
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-16 font-mono">
          {LOGOS.map((l) => (
            <div
              key={l.name}
              className={`p-5 rounded-xl border text-center transition hover:border-cyan-400 ${
                theme === "dark"
                  ? "bg-[#050C1A] border-cyan-500/20"
                  : theme === "contrast"
                    ? "bg-black border-2 border-[#00FF66] text-[#00FF66]"
                    : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              <div className="font-bold text-base font-sans">{l.name}</div>
              <div className="text-[10px] opacity-60 leading-tight mt-1">{l.label}</div>
            </div>
          ))}
        </div>

        <div id="cau-chuyen" className="mb-8 text-left">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 mb-2">
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
              className={`p-7 rounded-2xl border flex flex-col justify-between relative ${
                idx === 1 ? "md:-mt-6" : ""
              } ${
                theme === "dark"
                  ? "bg-[#050C1A] border-cyan-500/20 shadow-xl"
                  : theme === "contrast"
                    ? "bg-black border-2 border-[#00FF66] text-[#00FF66]"
                    : "bg-white border-slate-200 shadow-lg"
              }`}
            >
              <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase bg-cyan-500 text-black border-cyan-400">
                CASE_STUDY_0{idx + 1}
              </div>
              <p className="text-xs sm:text-sm italic leading-relaxed mb-6 opacity-90 pt-2">
                "{r.quote}"
              </p>
              <div className="pt-4 border-t border-current/10 text-left font-mono">
                <div className="font-bold text-sm font-sans">{r.author}</div>
                <div className="text-xs opacity-70">
                  {r.role}, {r.org}
                </div>
              </div>
            </div>
          ))}
        </div>
      </AsymmetricScrollHijackSectionV5>

      {/* =========================================================================
          7. FOOTER
      ========================================================================= */}
      <footer
        className={`py-20 px-4 sm:px-6 lg:px-8 border-t relative z-20 ${
          theme === "dark"
            ? "border-cyan-500/20 bg-black"
            : theme === "contrast"
              ? "border-2 border-[#00FF66] bg-black text-[#00FF66]"
              : "border-slate-200 bg-slate-100"
        }`}
      >
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Sẵn sàng mở ra nhiều cơ hội hơn?</h2>
          <p className="text-sm sm:text-base opacity-75 max-w-2xl mx-auto mb-8">
            Hãy để Business Connect đồng hành cùng hiệp hội hoặc doanh nghiệp của bạn.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-12 font-mono">
            <button
              onClick={() => setShowDemoModal(true)}
              className={`inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-xs font-bold uppercase tracking-wider ${
                theme === "dark"
                  ? "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:shadow-[0_0_30px_rgba(245,158,11,0.55)]"
                  : theme === "contrast"
                    ? "bg-[#00FF66] text-black border-2 border-[#00FF66]"
                    : "bg-slate-900 text-white shadow-md hover:bg-slate-800"
              }`}
            >
              <span>Đặt demo ngay</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                toast.success("Cảm ơn bạn! Chuyên viên tư vấn sẽ liên hệ trong vòng 24 giờ.");
              }}
              className={`px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${
                theme === "dark"
                  ? "border-white/20 bg-white/5 text-white hover:bg-white/10"
                  : theme === "contrast"
                    ? "border-2 border-[#00FF66] bg-black text-[#00FF66]"
                    : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
              }`}
            >
              Liên hệ tư vấn
            </button>
          </div>

          <div className="text-xs opacity-50 font-mono border-t border-current/10 pt-8">
            © {new Date().getFullYear()} Business Connect. Deep Tech Edition V5.
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-lg p-8 rounded-2xl border ${
                theme === "dark"
                  ? "bg-[#0B1528] border-cyan-500/40 text-white shadow-[0_0_40px_rgba(6,182,212,0.3)]"
                  : theme === "contrast"
                    ? "bg-black border-2 border-[#00FF66] text-[#00FF66]"
                    : "bg-white text-slate-900 border-slate-300 shadow-2xl"
              }`}
            >
              <button
                onClick={() => setShowDemoModal(false)}
                className="absolute top-4 right-4 p-2 opacity-60 hover:opacity-100"
              >
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-2xl font-bold mb-2">Đăng Ký Trải Nghiệm Demo</h3>
              <p className="text-sm opacity-75 mb-6">
                Chuyên viên cấp cao sẽ liên hệ trực tiếp để giới thiệu giải pháp phù hợp nhất.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Đăng ký thành công! Chúng tôi sẽ liên hệ trong vòng 24 giờ.");
                  setShowDemoModal(false);
                }}
                className="space-y-4 text-left font-mono"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">
                    Họ và tên
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full px-4 py-3 rounded-xl border border-current/20 bg-current/5 text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">
                    Doanh nghiệp / Hiệp hội
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="VD: Công ty TNHH Cung Ứng..."
                    className="w-full px-4 py-3 rounded-xl border border-current/20 bg-current/5 text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">
                    Số điện thoại
                  </label>
                  <input
                    required
                    type="tel"
                    placeholder="VD: 0987654321"
                    className="w-full px-4 py-3 rounded-xl border border-current/20 bg-current/5 text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] transition mt-4"
                >
                  Xác Nhận Đăng Ký
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showVideoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative w-full max-w-4xl bg-black border border-cyan-500/30 rounded-2xl p-8 flex flex-col items-center justify-center text-white aspect-video shadow-[0_0_50px_rgba(6,182,212,0.3)]">
              <button
                onClick={() => setShowVideoModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
              <Play className="h-16 w-16 text-cyan-400 mb-4 animate-pulse" />
              <div className="text-xl font-bold">Giới Thiệu Nền Tảng Business Connect (2 Phút)</div>
              <div className="text-sm text-cyan-400/80 mt-2 font-mono">
                Đang khởi tạo luồng dữ liệu bảo mật...
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </GlassLayoutWrapper>
  );
}
