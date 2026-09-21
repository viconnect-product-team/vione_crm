import React, { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  InvertCursor40px,
  KineticTurntableTypography,
  ImageMaskRevealSection,
  HorizontalParallaxScroller,
} from "./animations/EditorialBrutalismEffects";
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
  Droplets,
  Activity,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { useAutoHideHeader } from "./useAutoHideHeader";
import { EditorialLayoutWrapper } from "./wrappers/EditorialLayoutWrapper";
import { useDoorThemeSwitch } from "./DoorThemeTransition";

export type ThemeMode = "light" | "dark" | "contrast";

// =========================================================================
// LAYER 2: RAINDROPS ON GLASS CANVAS (Rain streaks streaming down glass)
// =========================================================================
function RainOnGlassCanvas({ theme }: { theme: ThemeMode }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (theme === "contrast") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Stream raindrops
    const drops = Array.from({ length: 35 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      len: 15 + Math.random() * 25,
      speed: 1.5 + Math.random() * 2.5,
      opacity: 0.15 + Math.random() * 0.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.lineWidth = 1.2;
      for (const d of drops) {
        ctx.strokeStyle =
          theme === "dark"
            ? `rgba(56, 189, 248, ${d.opacity * 0.8})`
            : `rgba(14, 116, 144, ${d.opacity * 0.6})`;

        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + 0.5, d.y + d.len);
        ctx.stroke();

        d.y += d.speed;
        if (d.y > height) {
          d.y = -d.len;
          d.x = Math.random() * width;
        }
      }

      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [theme]);

  if (theme === "contrast") return null;

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[2] opacity-30" />;
}

// =========================================================================
// 3-LAYER BACKGROUND: EXECUTIVE GLASS DASHBOARD WITH 50% SCROLL PARALLAX
// Layer 0: Unsplash real image of night financial district with 50% parallax
// Layer 1: Heavy blur overlay + deep crystal indigo/slate gradients
// Layer 2: Raindrops on glass + opposing floating prismatic light blobs
// =========================================================================
function ExecutiveGlassThreeLayerBackground({ theme }: { theme: ThemeMode }) {
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "45%"]);
  const prism1Y = useTransform(scrollYProgress, [0, 1], [-100, 150]);
  const prism2Y = useTransform(scrollYProgress, [0, 1], [140, -130]);
  const rot1 = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const rot2 = useTransform(scrollYProgress, [0, 1], [0, -120]);

  if (theme === "contrast") {
    return <div className="pointer-events-none fixed inset-0 z-0 bg-white" />;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* LAYER 0: REAL FINANCIAL SKYLINE WITH 50% SCROLL PARALLAX */}
      <motion.div style={{ y: bgY }} className="absolute -top-[25%] inset-x-0 h-[150%] w-full">
        <img
          src={
            theme === "dark"
              ? "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=2400&q=80"
              : "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2400&q=80"
          }
          alt="Financial District Skyline"
          className="h-full w-full object-cover object-center filter brightness-75"
        />
      </motion.div>

      {/* LAYER 1: HEAVY BLUR OVERLAY (blur-3xl + backdrop tint) */}
      <div
        className={`absolute inset-0 transition-colors duration-700 backdrop-blur-3xl ${
          theme === "dark"
            ? "bg-[#0B0F19]/85 bg-gradient-to-b from-indigo-950/40 via-[#0B0F19]/90 to-[#05070D]"
            : "bg-[#F1F5F9]/85 bg-gradient-to-b from-slate-200/50 via-[#F1F5F9]/90 to-[#E2E8F0]"
        }`}
      />

      {/* OPPOSING FLOATING PRISMATIC LIGHT BLOBS (Z-AXIS PARALLAX) */}
      <motion.div
        style={{ y: prism1Y, rotate: rot1 }}
        className="absolute top-[15%] left-[8%] h-80 w-80 rounded-full bg-gradient-to-tr from-cyan-500/20 via-sky-400/15 to-transparent blur-3xl pointer-events-none"
      />
      <motion.div
        style={{ y: prism2Y, rotate: rot2 }}
        className="absolute top-[60%] right-[10%] h-96 w-96 rounded-full bg-gradient-to-bl from-indigo-600/20 via-purple-500/10 to-transparent blur-3xl pointer-events-none"
      />

      {/* LAYER 2: RAINDROPS ON GLASS */}
      <RainOnGlassCanvas theme={theme} />
    </div>
  );
}

// =========================================================================
// THEME-SWITCH: WIPE FOG TRANSITION (Blur 100% + Squeegee Sweeping Horizontal)
// =========================================================================
function WipeFogThemeTransition({ isWiping, theme }: { isWiping: boolean; theme: ThemeMode }) {
  if (!isWiping) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {/* 100% Foggy blur screen */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 0.75, times: [0, 0.3, 0.7, 1] }}
        className="absolute inset-0 bg-white/70 dark:bg-black/80 backdrop-blur-3xl"
      />

      {/* Squeegee Wiper Blade sweeping from left to right */}
      <motion.div
        initial={{ left: "-10%" }}
        animate={{ left: "110%" }}
        transition={{ duration: 0.65, ease: [0.65, 0, 0.35, 1] }}
        className="absolute top-0 bottom-0 w-8 -translate-x-1/2 flex items-center justify-center"
      >
        <div className="h-full w-1.5 bg-gradient-to-b from-cyan-400 via-sky-300 to-indigo-500 shadow-[0_0_25px_rgba(56,189,248,0.9)]" />
        <div className="absolute top-1/2 -translate-y-1/2 p-2 rounded-full bg-cyan-500 text-white shadow-lg">
          <Droplets className="h-4 w-4" />
        </div>
      </motion.div>
    </div>
  );
}

// =========================================================================
// SECTION TRANSITION: SCROLL HIJACKING ASYMMETRIC STICKY CONTAINER
// =========================================================================
function AsymmetricScrollHijackSectionV4({
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
  const rotateX = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [6, 0, 0, -6]);
  const clipPath = useTransform(
    scrollYProgress,
    [0, 0.15, 0.85, 1],
    [
      "inset(4% 3% 4% 3% round 32px)",
      "inset(0% 0% 0% 0% round 0px)",
      "inset(0% 0% 0% 0% round 0px)",
      "inset(4% 3% 4% 3% round 32px)",
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
    id: 1,
    title: "Thông tin phân tán",
    tagline: "Khó tìm đúng người",
    desc: "Khó tìm đúng người trong mạng lưới do dữ liệu lưu trữ rải rác trên danh bạ, Zalo và nhiều file Excel rời rạc.",
  },
  {
    id: 2,
    title: "Khó duy trì quan hệ",
    tagline: "Thiếu công cụ nhắc nhở và theo dõi tương tác",
    desc: "Thiếu công cụ nhắc nhở và theo dõi tương tác, khiến sợi dây liên kết giữa các thành viên dần nguội lạnh.",
  },
  {
    id: 3,
    title: "Bỏ lỡ cơ hội",
    tagline: "Không kịp nắm bắt cơ hội phù hợp",
    desc: "Không kịp nắm bắt cơ hội phù hợp khi hội viên có nhu cầu hợp tác hoặc cung ứng dịch vụ cấp thiết.",
  },
  {
    id: 4,
    title: "Thiếu kết nối thực chất",
    tagline: "Nhiều sự kiện nhưng khó tạo giá trị sau sự kiện",
    desc: "Nhiều sự kiện nhưng khó tạo giá trị sau sự kiện, giao lưu xã giao bề nổi thiếu cơ chế xúc tiến 1-on-1.",
  },
  {
    id: 5,
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

export function BusinessConnectLandingV4() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const { isTransitioning, targetTheme, switchTheme } = useDoorThemeSwitch(theme, setTheme);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const { isVisible: isHeaderVisible, isAtTop } = useAutoHideHeader();

  const handleSwitchTheme = (nextTheme: ThemeMode) => {
    switchTheme(nextTheme);
  };

  return (
    <EditorialLayoutWrapper
      theme={theme}
      isThemeTransitioning={isTransitioning}
      targetTheme={targetTheme}
    >
      <InvertCursor40px />

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
              ? "bg-[#0B0F19]/70 backdrop-blur-xl border-b border-white/10 py-3"
              : theme === "contrast"
                ? "bg-white border-b-2 border-black py-3"
                : "bg-white/70 backdrop-blur-xl border-b border-slate-200 py-3"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center border backdrop-blur-md transition ${
                theme === "dark"
                  ? "bg-white/10 border-white/20 text-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                  : theme === "contrast"
                    ? "bg-black border-black text-white"
                    : "bg-white/80 border-slate-300 text-sky-700 shadow-sm"
              }`}
            >
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold tracking-tight text-sm uppercase">BUSINESS CONNECT</div>
              <div className="text-[10px] tracking-widest text-cyan-500 font-mono uppercase">
                GLASS DASHBOARD • V4
              </div>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-8 text-sm font-medium">
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
              <Link to="/business-connect/v4" className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow">v4 ★</Link>
              <Link to="/business-connect/v5" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v5</Link>
              <Link to="/business-connect/v6" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v6</Link>
              <Link to="/business-connect/v7" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v7</Link>
            </div>

            {/* Theme Switcher */}
            <div
              className={`flex items-center border p-1 rounded-xl backdrop-blur-md ${
                theme === "dark"
                  ? "border-white/15 bg-white/5"
                  : theme === "contrast"
                    ? "border-black bg-white"
                    : "border-slate-300 bg-white/70"
              }`}
            >
              <button
                onClick={() => handleSwitchTheme("light")}
                title="Bạc sáng (Light)"
                className={`p-1.5 rounded-lg transition ${
                  theme === "light"
                    ? "bg-white text-black shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleSwitchTheme("dark")}
                title="Kính đen (Dark)"
                className={`p-1.5 rounded-lg transition ${
                  theme === "dark"
                    ? "bg-white/20 text-cyan-300 shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleSwitchTheme("contrast")}
                title="Phẳng (Contrast)"
                className={`p-1.5 rounded-lg transition ${
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
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                theme === "dark"
                  ? "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:shadow-[0_0_30px_rgba(245,158,11,0.55)]"
                  : theme === "contrast"
                    ? "bg-black text-white border-2 border-black"
                    : "bg-slate-900 text-white shadow-md hover:bg-slate-800"
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
      <AsymmetricScrollHijackSectionV4 className="pt-24 sm:pt-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* ASYMMETRIC COL 7: EXECUTIVE GLASS HERO */}
          <div className="lg:col-span-7 z-10 text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6 text-xs font-bold uppercase tracking-widest backdrop-blur-md border-white/20 bg-white/5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>NỀN TẢNG KẾT NỐI KINH DOANH THẾ HỆ MỚI</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6">
              Hiểu đúng người. <br />
              <span
                className={
                  theme === "dark"
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-400"
                    : theme === "contrast"
                      ? "text-black underline underline-offset-8"
                      : "text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-700"
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
                className={`inline-flex items-center gap-3 rounded-xl px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 transform hover:-translate-y-0.5 ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-bold shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_40px_rgba(245,158,11,0.6)]"
                    : theme === "contrast"
                      ? "bg-black text-white border-2 border-black"
                      : "bg-slate-900 text-white shadow-xl hover:bg-slate-800"
                }`}
              >
                <span>Đặt demo ngay</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => setShowVideoModal(true)}
                className={`inline-flex items-center gap-3 rounded-xl px-7 py-4 text-sm font-bold uppercase tracking-wider border backdrop-blur-md transition ${
                  theme === "dark"
                    ? "border-white/20 bg-white/5 text-white hover:bg-white/10"
                    : theme === "contrast"
                      ? "border-2 border-black bg-white text-black"
                      : "border-slate-300 bg-white/70 text-slate-800 hover:bg-white"
                }`}
              >
                <Play className="h-4 w-4 fill-current text-cyan-400" />
                <span>Xem video (2 phút)</span>
              </button>
            </div>
          </div>

          {/* ASYMMETRIC COL 5: ACRYLIC GLASS EXECUTIVE COCKPIT */}
          <div className="lg:col-span-5 relative">
            <div
              className={`p-6 sm:p-7 rounded-3xl border backdrop-blur-2xl transition ${
                theme === "dark"
                  ? "bg-white/5 border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
                  : theme === "contrast"
                    ? "bg-white border-2 border-black"
                    : "bg-white/80 border-slate-200 shadow-xl"
              }`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-current/10 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.8)] animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    EXECUTIVE_AI_ROUTER
                  </span>
                </div>
                <span className="text-[10px] font-mono opacity-60">PRISM_STATUS: NOMINAL</span>
              </div>

              <div className="space-y-3 text-left">
                <div className="p-3.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                  <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                    ĐỐI TÁC CUNG ỨNG NĂNG LƯỢNG MẶT TRỜI
                  </div>
                  <div className="text-xs font-medium mt-1">Đã gợi ý kết nối với 3 tập đoàn FDI Nhật Bản</div>
                  <div className="text-[10px] opacity-70 mt-1">Chỉ số gắn kết hiệp hội: 96%</div>
                </div>

                <div className="p-3.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                  <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                    DEAL FLOW B2B TỰ ĐỘNG
                  </div>
                  <div className="text-xs font-medium mt-1">Giá trị giao dịch dự kiến: 45 Tỷ VND</div>
                  <div className="text-[10px] opacity-70 mt-1">Tự động ghi chú và nhắc nhở cuộc họp ban điều hành</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* OVERLAPPING STATS GRID - PIERCING UPWARD WITH NEGATIVE MARGIN */}
        <div
          className={`-mt-6 sm:-mt-10 lg:-mt-14 relative z-20 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 p-6 sm:p-8 rounded-3xl border text-left backdrop-blur-2xl ${
            theme === "dark"
              ? "bg-white/5 border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]"
              : theme === "contrast"
                ? "bg-white border-2 border-black"
                : "bg-white/80 border-white/80 shadow-xl"
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
      </AsymmetricScrollHijackSectionV4>

      {/* =========================================================================
          3. PROBLEM SECTION (ASYMMETRIC STICKY LEFT COL 4 vs OVERLAPPING CARDS COL 8)
      ========================================================================= */}
      <AsymmetricScrollHijackSectionV4 id="van-de">
        <ImageMaskRevealSection>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ASYMMETRIC STICKY LEFT COLUMN */}
            <div className="lg:col-span-4 lg:sticky lg:top-8 text-left">
              <div className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">
                NHIỀU TỔ CHỨC VẪN ĐANG GẶP NHỮNG VẤN ĐỀ NÀY
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Quản lý quan hệ kinh doanh vẫn còn nhiều thách thức
              </h2>
              <p className="text-sm opacity-80 leading-relaxed mb-6">
                Các tổ chức kết nối thường tốn hàng trăm giờ chuẩn bị sự kiện nhưng thiếu hạ tầng số
                để biến mối quan hệ giao tiếp ban đầu thành hợp đồng hợp tác có giá trị.
              </p>
              <div className="p-4 rounded-2xl border border-cyan-400/30 bg-cyan-500/5 backdrop-blur-md text-xs text-cyan-300">
                AUDIT: 5 Thách thức lớn trong vận hành hội viên
              </div>
            </div>

            {/* ASYMMETRIC OVERLAPPING RIGHT COLUMN */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {PROBLEMS_DATA.map((p, idx) => {
                const isHovered = hoveredCard === p.id;
                const isOffset = idx % 2 === 1;
                return (
                  <div
                    key={p.id}
                    onMouseEnter={() => setHoveredCard(p.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className={`p-7 rounded-3xl border transition-all duration-300 backdrop-blur-xl relative overflow-hidden ${
                      isOffset ? "md:-mt-6 lg:-mt-10" : ""
                    } ${
                      theme === "dark"
                        ? `bg-white/5 border-white/10 hover:border-cyan-400/60 ${
                            isHovered ? "shadow-[0_0_30px_rgba(6,182,212,0.25)]" : ""
                          }`
                        : theme === "contrast"
                          ? "bg-white border-2 border-black"
                          : "bg-white/75 border-white/80 shadow-lg hover:shadow-2xl"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold tracking-widest opacity-60">
                        VẤN ĐỀ #0{p.id}
                      </span>
                      <div
                        className={`h-7 w-7 rounded-full border flex items-center justify-center text-xs backdrop-blur-md ${
                          theme === "dark"
                            ? "border-cyan-400/40 text-cyan-300"
                            : "border-slate-300 text-slate-700"
                        }`}
                      >
                        0{p.id}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold mb-2">{p.title}</h3>
                    <div
                      className={`text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-cyan-400" : "text-sky-700"
                      }`}
                    >
                      {p.tagline}
                    </div>
                    <p className="text-xs sm:text-sm opacity-80 leading-relaxed">{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </ImageMaskRevealSection>
      </AsymmetricScrollHijackSectionV4>

      {/* =========================================================================
          4. SOLUTION SECTION (ASYMMETRIC COL 5 SPOTLIGHT vs COL 7 MODULE TILES)
      ========================================================================= */}
      <AsymmetricScrollHijackSectionV4 id="giai-phap">
        <div className="mb-10 text-left">
          <div className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">
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
              className={`p-8 rounded-3xl border backdrop-blur-2xl ${
                theme === "dark"
                  ? "bg-white/5 border-cyan-400/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                  : theme === "contrast"
                    ? "bg-white border-2 border-black"
                    : "bg-white/85 border-slate-200 shadow-xl"
              }`}
            >
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase text-cyan-400 mb-4">
                <Sparkles className="h-4 w-4" />
                <span>KIẾN TRÚC MÔ-ĐUN KẾT NỐI SỐ</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                Mạng lưới hội viên 360° với cơ chế ghép đôi thông minh
              </h3>
              <p className="text-xs sm:text-sm opacity-80 leading-relaxed mb-6">
                Mọi đại biểu và hội viên đều sở hữu một thẻ định danh số và hồ sơ năng lực xác thực,
                tự động đồng bộ và bảo mật dữ liệu tuyệt đối.
              </p>
              <div className="space-y-2 border-t border-current/10 pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="opacity-70">QUẢN TRỊ HỘI VIÊN 360°</span>
                  <span className="text-cyan-400 font-bold">KÍCH HOẠT</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">MATCHING CUNG - CẦU B2B</span>
                  <span className="text-cyan-400 font-bold">TỰ ĐỘNG</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">CHECK-IN QR / NFC</span>
                  <span className="text-cyan-400 font-bold">CHẠM 1 GIÂY</span>
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
                  className={`p-6 rounded-3xl border transition-all duration-300 group backdrop-blur-xl ${
                    theme === "dark"
                      ? "bg-white/5 border-white/10 hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                      : theme === "contrast"
                        ? "bg-white border-2 border-black"
                        : "bg-white/75 border-white/80 shadow-md hover:shadow-lg"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`h-11 w-11 rounded-2xl border flex items-center justify-center transition backdrop-blur-md ${
                        theme === "dark"
                          ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-400 group-hover:text-black"
                          : theme === "contrast"
                            ? "border-2 border-black bg-black text-white"
                            : "border-sky-300 bg-sky-50 text-sky-700 group-hover:bg-sky-600 group-hover:text-white"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono opacity-50">#0{idx + 1}</span>
                  </div>
                  <h3 className="text-base font-bold mb-1.5">{s.title}</h3>
                  <p className="text-xs opacity-80 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </AsymmetricScrollHijackSectionV4>

      {/* =========================================================================
          5. ECOSYSTEM SECTION (OVERLAPPING PIERCING BANNER)
      ========================================================================= */}
      <AsymmetricScrollHijackSectionV4 id="he-sinh-thai">
        <div
          className={`p-8 sm:p-12 rounded-3xl border relative overflow-hidden backdrop-blur-2xl ${
            theme === "dark"
              ? "bg-white/5 border-white/15 shadow-2xl"
              : theme === "contrast"
                ? "bg-white border-2 border-black"
                : "bg-white/85 border-white shadow-2xl"
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 text-left">
              <div className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">
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
                className={`p-4 rounded-2xl inline-block border mb-6 backdrop-blur-md ${
                  theme === "dark"
                    ? "bg-white/5 border-cyan-400/40 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                    : theme === "contrast"
                      ? "bg-black text-white"
                      : "bg-sky-50 border-sky-300 text-sky-900 font-bold"
                }`}
              >
                <div className="text-xs sm:text-sm font-bold tracking-widest uppercase">
                  NHIỀU KẾT NỐI HƠN. NHIỀU CƠ HỘI HƠN. NHIỀU GIÁ TRỊ HƠN.
                </div>
              </div>
            </div>

            {/* ASYMMETRIC RIGHT PIERCING BOX */}
            <div className="lg:col-span-4 lg:-mt-10">
              <div
                className={`p-6 rounded-3xl border text-left backdrop-blur-2xl ${
                  theme === "dark"
                    ? "bg-black/60 border-cyan-400/30 shadow-xl"
                    : theme === "contrast"
                      ? "bg-black text-white"
                      : "bg-slate-50 border-slate-300 shadow-lg"
                }`}
              >
                <div className="text-xs uppercase tracking-widest text-cyan-400 mb-2 font-bold">
                  KẾT NỐI ĐA NỀN TẢNG
                </div>
                <div className="text-lg font-bold mb-3">Tích Hợp Sâu CRM & API Mở</div>
                <p className="text-xs opacity-80 mb-6">
                  Đồng bộ dữ liệu liên minh kinh doanh với các hệ thống ERP, CRM và cổng thanh toán
                  hội viên an toàn.
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
          {/* Kinetic Turntable Typography */}
          <KineticTurntableTypography />
        </div>
      </AsymmetricScrollHijackSectionV4>

      {/* =========================================================================
          6. CLIENTS & TESTIMONIALS (OVERLAPPING ASYMMETRIC GLASS CARDS)
      ========================================================================= */}
      <AsymmetricScrollHijackSectionV4 id="khach-hang">
        <div className="mb-8 text-left">
          <div className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">
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
              className={`p-5 rounded-2xl border text-center backdrop-blur-md transition hover:border-cyan-400 ${
                theme === "dark"
                  ? "bg-white/5 border-white/10"
                  : theme === "contrast"
                    ? "bg-white border-2 border-black"
                    : "bg-white/70 border-slate-200"
              }`}
            >
              <div className="font-bold text-base">{l.name}</div>
              <div className="text-[10px] opacity-60 leading-tight mt-1">{l.label}</div>
            </div>
          ))}
        </div>

        <div id="cau-chuyen" className="mb-8 text-left">
          <div className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">
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
              className={`p-7 rounded-3xl border flex flex-col justify-between backdrop-blur-xl relative ${
                idx === 1 ? "md:-mt-6" : ""
              } ${
                theme === "dark"
                  ? "bg-white/5 border-white/10 shadow-xl"
                  : theme === "contrast"
                    ? "bg-white border-2 border-black"
                    : "bg-white/80 border-white shadow-lg"
              }`}
            >
              <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full border text-[10px] font-bold uppercase bg-cyan-500 text-black border-cyan-400">
                CASE_STUDY_0{idx + 1}
              </div>
              <p className="text-xs sm:text-sm italic leading-relaxed mb-6 opacity-90 pt-2">
                "{r.quote}"
              </p>
              <div className="pt-4 border-t border-current/10 text-left">
                <div className="font-bold text-sm">{r.author}</div>
                <div className="text-xs opacity-70">
                  {r.role}, {r.org}
                </div>
              </div>
            </div>
          ))}
        </div>
      </AsymmetricScrollHijackSectionV4>

      {/* HORIZONTAL PARALLAX SCROLLER (BRUTALIST REVIEW SLIDER) */}
      <HorizontalParallaxScroller items={REVIEWS} />

      {/* =========================================================================
          7. FOOTER
      ========================================================================= */}
      <footer
        className={`py-20 px-4 sm:px-6 lg:px-8 border-t relative z-20 ${
          theme === "dark"
            ? "border-white/10 bg-[#070A10]"
            : theme === "contrast"
              ? "border-black bg-black text-white"
              : "border-slate-200 bg-slate-100"
        }`}
      >
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Sẵn sàng mở ra nhiều cơ hội hơn?</h2>
          <p className="text-sm sm:text-base opacity-75 max-w-2xl mx-auto mb-8">
            Hãy để Business Connect đồng hành cùng hiệp hội hoặc doanh nghiệp của bạn.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <button
              onClick={() => setShowDemoModal(true)}
              className={`inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-xs font-bold uppercase tracking-wider ${
                theme === "dark"
                  ? "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-bold shadow-[0_0_25px_rgba(245,158,11,0.4)]"
                  : theme === "contrast"
                    ? "bg-white text-black border-2 border-white"
                    : "bg-slate-900 text-white shadow-md"
              }`}
            >
              <span>Đặt demo ngay</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                toast.success("Cảm ơn bạn! Chuyên viên tư vấn sẽ liên hệ trong vòng 24 giờ.");
              }}
              className={`px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider border backdrop-blur-md ${
                theme === "dark"
                  ? "border-white/20 bg-white/5 text-white hover:bg-white/10"
                  : theme === "contrast"
                    ? "border-2 border-white bg-black text-white"
                    : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
              }`}
            >
              Liên hệ tư vấn
            </button>
          </div>

          <div className="text-xs opacity-50 border-t border-current/10 pt-8">
            © {new Date().getFullYear()} Business Connect. Glass Dashboard Edition V4.
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-lg p-8 rounded-3xl border backdrop-blur-2xl shadow-2xl ${
                theme === "dark"
                  ? "bg-[#0F172A]/90 border-white/20 text-white shadow-[0_0_50px_rgba(6,182,212,0.3)]"
                  : theme === "contrast"
                    ? "bg-white text-black border-2 border-black"
                    : "bg-white/95 text-slate-900 border-white"
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
                className="space-y-4 text-left"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">
                    Họ và tên
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-sm focus:outline-none focus:border-cyan-400"
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
                    className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-sm focus:outline-none focus:border-cyan-400"
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
                    className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-sm focus:outline-none focus:border-cyan-400"
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
            <div className="relative w-full max-w-4xl bg-slate-950 border border-white/20 rounded-3xl p-8 flex flex-col items-center justify-center text-white aspect-video shadow-2xl">
              <button
                onClick={() => setShowVideoModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
              <Play className="h-16 w-16 text-cyan-400 mb-4 animate-pulse" />
              <div className="text-xl font-bold">Giới Thiệu Nền Tảng Business Connect (2 Phút)</div>
              <div className="text-sm text-slate-400 mt-2">Đang tải video chất lượng cao...</div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </EditorialLayoutWrapper>
  );
}
