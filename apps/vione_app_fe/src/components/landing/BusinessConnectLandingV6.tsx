import React, { useState, useRef } from "react";
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
  Shield,
  Award,
  CalendarCheck,
  MessagesSquare,
  PlugZap,
  Briefcase,
  HeartHandshake,
  Columns,
  Landmark,
} from "lucide-react";
import { toast } from "sonner";
import { useAutoHideHeader } from "./useAutoHideHeader";
import { DeepTechLayoutWrapper } from "./wrappers/DeepTechLayoutWrapper";
import { useDoorThemeSwitch } from "./DoorThemeTransition";

export type ThemeMode = "light" | "dark" | "contrast";

// =========================================================================
// 3-LAYER BACKGROUND: CORPORATE MONUMENT WITH 50% SCROLL PARALLAX
// Layer 0: Unsplash real image of architectural marble stone with 50% parallax
// Layer 1: Overlay Multiply blending stone grain with theme tone
// Layer 2: Opposing floating monolithic geometric stone blocks & dust flow
// =========================================================================
function MonumentThreeLayerBackground({ theme }: { theme: ThemeMode }) {
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "45%"]);
  const slab1Y = useTransform(scrollYProgress, [0, 1], [-90, 140]);
  const slab2Y = useTransform(scrollYProgress, [0, 1], [130, -130]);
  const rot1 = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const rot2 = useTransform(scrollYProgress, [0, 1], [0, -90]);

  if (theme === "contrast") {
    return <div className="pointer-events-none fixed inset-0 z-0 bg-white" />;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* LAYER 0: REAL STONE MONUMENT IMAGE WITH 50% SCROLL PARALLAX */}
      <motion.div style={{ y: bgY }} className="absolute -top-[25%] inset-x-0 h-[150%] w-full">
        <img
          src={
            theme === "dark"
              ? "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2400&q=80"
              : "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=2400&q=80"
          }
          alt="Corporate Monument Stone"
          className="h-full w-full object-cover object-center filter brightness-85 contrast-125"
        />
      </motion.div>

      {/* LAYER 1: OVERLAY MULTIPLY */}
      <div
        className={`absolute inset-0 transition-colors duration-500 mix-blend-multiply ${
          theme === "dark"
            ? "bg-[#0C0D0E]/95 bg-gradient-to-b from-[#1A1612]/80 via-[#0C0D0E]/95 to-black"
            : "bg-[#F7F5F0]/92 bg-gradient-to-b from-[#EFECE6]/80 via-[#F7F5F0]/92 to-[#E8E4DC]"
        }`}
      />

      {/* OPPOSING FLOATING MONOLITHIC GEOMETRIC SLABS (Z-AXIS PARALLAX) */}
      <motion.div
        style={{ y: slab1Y, rotate: rot1 }}
        className="absolute top-[18%] left-[7%] h-64 w-64 border-2 border-amber-600/20 bg-amber-900/10 backdrop-blur-sm hidden md:block"
      />
      <motion.div
        style={{ y: slab2Y, rotate: rot2 }}
        className="absolute top-[65%] right-[7%] h-72 w-72 border-2 border-stone-500/20 bg-stone-900/10 backdrop-blur-sm hidden md:block"
      />

      {/* LAYER 2: ANIMATED STONE DUST STREAM */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-y-0 w-full bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.3)_0%,transparent_70%)] blur-2xl"
        />
      </div>
    </div>
  );
}

// =========================================================================
// THEME-SWITCH: 2 SLIDING STONE SLABS SMASHING & SPLITTING VERTICALLY (Đá Sập)
// =========================================================================
function StoneSlabsThemeTransition({
  isSliding,
  theme,
}: {
  isSliding: boolean;
  theme: ThemeMode;
}) {
  if (!isSliding) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex flex-col">
      {/* Top Stone Slab sliding down */}
      <motion.div
        initial={{ y: "-100%" }}
        animate={{ y: ["-100%", "0%", "0%", "-100%"] }}
        transition={{
          duration: 0.75,
          times: [0, 0.45, 0.55, 1],
          ease: [0.77, 0, 0.175, 1],
        }}
        className={`h-1/2 w-full border-b-4 flex items-end justify-center pb-6 ${
          theme === "dark"
            ? "bg-[#181A1E] border-amber-500/50 shadow-2xl text-amber-400"
            : theme === "contrast"
              ? "bg-black border-white text-white"
              : "bg-[#E6E1D8] border-[#A89880] shadow-2xl text-[#5C4A32]"
        }`}
      >
        <div className="flex items-center gap-2 font-serif font-bold text-xs uppercase tracking-widest opacity-60">
          <Landmark className="h-4 w-4" />
          <span>THỂ CHẾ KẾT NỐI BỀN VỮNG</span>
        </div>
      </motion.div>

      {/* Bottom Stone Slab sliding up */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: ["100%", "0%", "0%", "100%"] }}
        transition={{
          duration: 0.75,
          times: [0, 0.45, 0.55, 1],
          ease: [0.77, 0, 0.175, 1],
        }}
        className={`h-1/2 w-full border-t-4 flex items-start justify-center pt-6 ${
          theme === "dark"
            ? "bg-[#181A1E] border-amber-500/50 shadow-2xl text-amber-400"
            : theme === "contrast"
              ? "bg-black border-white text-white"
              : "bg-[#E6E1D8] border-[#A89880] shadow-2xl text-[#5C4A32]"
        }`}
      >
        <div className="font-serif font-bold text-xs uppercase tracking-widest opacity-60">
          CHUYỂN GIAO THỂ CHẾ
        </div>
      </motion.div>
    </div>
  );
}

// =========================================================================
// SECTION TRANSITION: SCROLL HIJACKING ASYMMETRIC STICKY CONTAINER
// =========================================================================
function AsymmetricScrollHijackSectionV6({
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
    num: "I",
    title: "Thông tin phân tán",
    tagline: "Khó tìm đúng người",
    desc: "Khó tìm đúng người trong mạng lưới do dữ liệu lưu trữ rải rác trên danh bạ, Zalo và nhiều file Excel rời rạc.",
  },
  {
    num: "II",
    title: "Khó duy trì quan hệ",
    tagline: "Thiếu công cụ nhắc nhở và theo dõi tương tác",
    desc: "Thiếu công cụ nhắc nhở và theo dõi tương tác, khiến sợi dây liên kết giữa các thành viên dần nguội lạnh.",
  },
  {
    num: "III",
    title: "Bỏ lỡ cơ hội",
    tagline: "Không kịp nắm bắt cơ hội phù hợp",
    desc: "Không kịp nắm bắt cơ hội phù hợp khi hội viên có nhu cầu hợp tác hoặc cung ứng dịch vụ cấp thiết.",
  },
  {
    num: "IV",
    title: "Thiếu kết nối thực chất",
    tagline: "Nhiều sự kiện nhưng khó tạo giá trị sau sự kiện",
    desc: "Nhiều sự kiện nhưng khó tạo giá trị sau sự kiện, giao lưu xã giao bề nổi thiếu cơ chế xúc tiến 1-on-1.",
  },
  {
    num: "V",
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

export function BusinessConnectLandingV6() {
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
    <DeepTechLayoutWrapper
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
              ? "bg-[#0C0D0E]/90 backdrop-blur-md border-b border-amber-600/20 py-3"
              : theme === "contrast"
                ? "bg-white border-b-2 border-black py-3"
                : "bg-[#F7F5F0]/90 backdrop-blur-md border-b border-[#D8D2C6] py-3"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div
              className={`h-10 w-10 flex items-center justify-center border-2 font-serif font-bold transition ${
                theme === "dark"
                  ? "border-amber-500/50 bg-[#16181C] text-amber-400 shadow-[0_0_15px_rgba(217,119,6,0.2)]"
                  : theme === "contrast"
                    ? "border-black bg-black text-white"
                    : "border-[#8C6D46] bg-[#EAE5DB] text-[#4E3921]"
              }`}
            >
              <Columns className="h-5 w-5" />
            </div>
            <div>
              <div className="font-serif font-bold tracking-wider text-sm uppercase">
                BUSINESS CONNECT
              </div>
              <div className="text-[10px] font-mono tracking-widest text-amber-500 uppercase">
                MONUMENT • V6
              </div>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-8 text-sm font-serif font-semibold">
            <a href="#giai-phap" className="hover:text-amber-500 transition">
              Giải pháp
            </a>
            <a href="#khach-hang" className="hover:text-amber-500 transition">
              Khách hàng
            </a>
            <a href="#cau-chuyen" className="hover:text-amber-500 transition">
              Câu chuyện
            </a>
            <a href="#he-sinh-thai" className="hover:text-amber-500 transition">
              Hệ sinh thái
            </a>
            <a href="#van-de" className="hover:text-amber-500 transition">
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
              <Link to="/business-connect/v5" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v5</Link>
              <Link to="/business-connect/v6" className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow">v6 ★</Link>
              <Link to="/business-connect/v7" className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 hover:text-amber-300">v7</Link>
            </div>

            {/* Theme switcher */}
            <div
              className={`flex items-center border p-1 rounded-lg ${
                theme === "dark"
                  ? "border-amber-600/30 bg-[#16181C]"
                  : theme === "contrast"
                    ? "border-black bg-white"
                    : "border-[#D8D2C6] bg-[#EAE5DB]"
              }`}
            >
              <button
                onClick={() => handleSwitchTheme("light")}
                title="Đá cẩm thạch (Marble White)"
                className={`p-1.5 rounded transition ${
                  theme === "light"
                    ? "bg-[#D5CEBF] text-black shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleSwitchTheme("dark")}
                title="Đen Obsidian (Bronze)"
                className={`p-1.5 rounded transition ${
                  theme === "dark"
                    ? "bg-amber-500 text-black shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleSwitchTheme("contrast")}
                title="Khối Trắng/Đen (Contrast)"
                className={`p-1.5 rounded transition ${
                  theme === "contrast" ? "bg-black text-white" : "opacity-60 hover:opacity-100"
                }`}
              >
                <Contrast className="h-3.5 w-3.5" />
              </button>
            </div>

            <Link
              to="/auth"
              className="hidden sm:inline-block px-3 py-1.5 text-xs font-serif font-bold uppercase tracking-wider"
            >
              Đăng nhập
            </Link>

            <button
              onClick={() => setShowDemoModal(true)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-serif font-bold uppercase tracking-wider transition-all duration-300 ${
                theme === "dark"
                  ? "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:shadow-[0_0_30px_rgba(245,158,11,0.55)]"
                  : theme === "contrast"
                    ? "border-2 border-black bg-black text-white"
                    : "bg-[#7A6448] text-white shadow-md hover:bg-[#68533A]"
              }`}
            >
              <span>Đặt demo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. HERO SECTION (ASYMMETRIC GRID: 7 vs 5 + OVERLAPPING MONOLITHIC STATS)
      ========================================================================= */}
      <AsymmetricScrollHijackSectionV6 className="pt-24 sm:pt-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* ASYMMETRIC COL 7: MONUMENTAL HERO */}
          <div className="lg:col-span-7 z-10 text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border mb-6 text-xs font-serif font-bold uppercase tracking-widest border-amber-600/40 bg-amber-600/10 text-amber-500">
              <Sparkles className="h-3.5 w-3.5" />
              <span>NỀN TẢNG KẾT NỐI KINH DOANH THẾ HỆ MỚI</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold tracking-tight leading-[1.08] mb-6">
              Hiểu đúng người. <br />
              <span
                className={
                  theme === "dark"
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500"
                    : theme === "contrast"
                      ? "text-black underline underline-offset-8"
                      : "text-transparent bg-clip-text bg-gradient-to-r from-[#8C6D46] to-[#4E3921]"
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
                className={`inline-flex items-center gap-3 px-8 py-4 text-sm font-serif font-bold uppercase tracking-wider transition-all duration-300 transform hover:-translate-y-0.5 ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-bold shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_40px_rgba(245,158,11,0.6)]"
                    : theme === "contrast"
                      ? "border-2 border-black bg-black text-white"
                      : "bg-[#7A6448] text-white shadow-xl hover:bg-[#68533A]"
                }`}
              >
                <span>Đặt demo ngay</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => setShowVideoModal(true)}
                className={`inline-flex items-center gap-3 px-7 py-4 text-sm font-serif font-bold uppercase tracking-wider border transition ${
                  theme === "dark"
                    ? "border-amber-600/30 bg-[#16181C] text-white hover:bg-[#202328]"
                    : theme === "contrast"
                      ? "border-2 border-black bg-white text-black"
                      : "border-[#BDB4A5] bg-[#EAE5DB] text-[#4E3921] hover:bg-[#DFD9CE]"
                }`}
              >
                <Play className="h-4 w-4 fill-current text-amber-500" />
                <span>Xem video (2 phút)</span>
              </button>
            </div>
          </div>

          {/* ASYMMETRIC COL 5: MONOLITHIC SLAB TABLET */}
          <div className="lg:col-span-5 relative">
            <div
              className={`p-7 border-2 font-serif text-xs transition ${
                theme === "dark"
                  ? "bg-[#14161A] border-amber-600/40 shadow-[10px_10px_0px_0px_rgba(217,119,6,0.35)]"
                  : theme === "contrast"
                    ? "bg-white border-4 border-black"
                    : "bg-[#ECE6DC] border-[#BDB4A5] shadow-[10px_10px_0px_0px_rgba(0,0,0,0.18)]"
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-current/15 mb-4">
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-amber-500" />
                  <span className="font-bold text-amber-500 uppercase tracking-widest">
                    THỂ CHẾ KẾT NỐI SỐ
                  </span>
                </div>
                <span className="text-[10px] font-mono opacity-60">CHUẨN HOÁ B2B</span>
              </div>

              <div className="space-y-3 text-left">
                <div className="p-3 border border-current/15 bg-current/5">
                  <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                    I. ĐỊNH DANH HỘI VIÊN VIP 360°
                  </div>
                  <div className="text-xs font-sans mt-1">Hồ sơ năng lực xác thực đa chiều cấp hiệp hội</div>
                  <div className="text-[10px] opacity-70 mt-1">Độ tin cậy xác minh: 100%</div>
                </div>

                <div className="p-3 border border-current/15 bg-current/5">
                  <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                    II. MẠNG LƯỚI GIAO THƯƠNG ĐỘC QUYỀN
                  </div>
                  <div className="text-xs font-sans mt-1">Khớp nối cơ hội chiến lược giữa các chủ tịch tập đoàn</div>
                  <div className="text-[10px] opacity-70 mt-1">Hỗ trợ biên bản ghi nhớ số hoá</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* OVERLAPPING STATS BAR - PIERCING UPWARD WITH NEGATIVE MARGIN */}
        <div
          className={`-mt-6 sm:-mt-10 lg:-mt-14 relative z-20 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 p-6 sm:p-8 border-2 text-left font-serif ${
            theme === "dark"
              ? "bg-[#14161A] border-amber-600/30 shadow-[8px_8px_0px_0px_rgba(217,119,6,0.35)]"
              : theme === "contrast"
                ? "bg-white border-2 border-black"
                : "bg-[#ECE6DC] border-[#BDB4A5] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)]"
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
      </AsymmetricScrollHijackSectionV6>

      {/* =========================================================================
          3. PROBLEM SECTION (ASYMMETRIC STICKY LEFT COL 4 vs OVERLAPPING CARDS COL 8)
      ========================================================================= */}
      <AsymmetricScrollHijackSectionV6 id="van-de">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ASYMMETRIC STICKY LEFT COLUMN */}
          <div className="lg:col-span-4 lg:sticky lg:top-8 text-left">
            <div className="text-xs font-serif font-bold uppercase tracking-widest text-amber-500 mb-2">
              NHIỀU TỔ CHỨC VẪN ĐANG GẶP NHỮNG VẤN ĐỀ NÀY
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-4">
              Quản lý quan hệ kinh doanh vẫn còn nhiều thách thức
            </h2>
            <p className="text-sm opacity-80 leading-relaxed mb-6 font-sans">
              Các tổ chức kết nối thường tốn hàng trăm giờ chuẩn bị sự kiện nhưng thiếu hạ tầng số
              để biến mối quan hệ giao tiếp ban đầu thành hợp đồng hợp tác có giá trị.
            </p>
            <div className="p-4 border-2 border-amber-600/30 bg-amber-900/10 font-serif text-xs text-amber-400">
              THỰC TRẠNG: 5 Thách thức cốt lõi của các hiệp hội
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
                  className={`p-7 border-2 transition-all duration-300 cursor-pointer ${
                    isOffset ? "md:-mt-6 lg:-mt-10" : ""
                  } ${
                    theme === "dark"
                      ? "bg-[#14161A] border-amber-600/20 hover:border-amber-500 hover:shadow-[6px_6px_0px_0px_rgba(217,119,6,0.35)]"
                      : theme === "contrast"
                        ? "bg-white border-2 border-black"
                        : "bg-[#ECE6DC] border-[#BDB4A5] shadow-md hover:border-[#4E3921]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-serif font-bold text-amber-500">[{p.num}]</span>
                    <span className="text-[10px] font-mono opacity-50 uppercase">CHALLENGE</span>
                  </div>
                  <h3 className="text-lg font-serif font-bold mb-2">{p.title}</h3>
                  <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-3">
                    {p.tagline}
                  </div>
                  <p className="text-xs sm:text-sm opacity-80 leading-relaxed font-sans">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </AsymmetricScrollHijackSectionV6>

      {/* =========================================================================
          4. SOLUTION SECTION (ASYMMETRIC COL 5 SPOTLIGHT vs COL 7 MODULE TILES)
      ========================================================================= */}
      <AsymmetricScrollHijackSectionV6 id="giai-phap">
        <div className="mb-10 text-left">
          <div className="text-xs font-serif font-bold uppercase tracking-widest text-amber-500 mb-2">
            GIẢI PHÁP BUSINESS CONNECT
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-3">
            Quản lý kết nối. Tạo ra cơ hội.
          </h2>
          <p className="text-sm sm:text-base opacity-80 max-w-3xl leading-relaxed font-sans">
            Một nền tảng toàn diện giúp hiệp hội, tổ chức và doanh nhân hiểu khách hàng, kết nối
            đúng người, xây dựng quan hệ bền vững và biến mối quan hệ thành cơ hội kinh doanh thực
            chất.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ASYMMETRIC STICKY SPOTLIGHT CARD */}
          <div className="lg:col-span-5 lg:sticky lg:top-8 text-left">
            <div
              className={`p-8 border-2 font-serif ${
                theme === "dark"
                  ? "bg-[#14161A] border-amber-600/40 shadow-[10px_10px_0px_0px_rgba(217,119,6,0.35)]"
                  : theme === "contrast"
                    ? "bg-white border-2 border-black"
                    : "bg-[#ECE6DC] border-[#BDB4A5] shadow-xl"
              }`}
            >
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase text-amber-500 mb-4">
                <Sparkles className="h-4 w-4" />
                <span>NỀN TẢNG BỀN VỮNG CHO HIỆP HỘI</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                Chuẩn mực quản trị quan hệ hội viên cấp lãnh đạo
              </h3>
              <p className="text-xs sm:text-sm opacity-80 leading-relaxed mb-6 font-sans">
                Được kiến tạo dựa trên chuẩn mực giao thương quốc tế, Business Connect cung cấp một
                không gian số hoá bảo mật tuyệt đối cho mọi liên minh doanh nghiệp.
              </p>
              <div className="space-y-2 border-t border-current/15 pt-4 text-xs font-sans">
                <div className="flex justify-between">
                  <span className="opacity-70">HỒ SƠ HỘI VIÊN 360°</span>
                  <span className="text-amber-500 font-bold">XÁC MINH</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">XÚC TIẾN B2B 1-ON-1</span>
                  <span className="text-amber-500 font-bold">TỰ ĐỘNG</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">HỘI NGHỊ & ĐẠI HỘI NFC</span>
                  <span className="text-amber-500 font-bold">CHUẨN HOÁ</span>
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
                  className={`p-6 border-2 transition-all duration-300 ${
                    theme === "dark"
                      ? "bg-[#14161A] border-amber-600/20 hover:border-amber-500 hover:shadow-[6px_6px_0px_0px_rgba(217,119,6,0.3)]"
                      : theme === "contrast"
                        ? "bg-white border-2 border-black"
                        : "bg-[#ECE6DC] border-[#BDB4A5] shadow-md hover:border-[#4E3921]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`h-11 w-11 border flex items-center justify-center ${
                        theme === "dark"
                          ? "border-amber-600/40 bg-amber-600/10 text-amber-500"
                          : theme === "contrast"
                            ? "border-2 border-black bg-black text-white"
                            : "border-[#8C6D46] bg-[#D8D2C6] text-[#4E3921]"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-mono opacity-50">#0{idx + 1}</span>
                  </div>
                  <h3 className="text-base font-serif font-bold mb-1.5">{s.title}</h3>
                  <p className="text-xs opacity-80 leading-relaxed font-sans">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </AsymmetricScrollHijackSectionV6>

      {/* =========================================================================
          5. ECOSYSTEM SECTION (OVERLAPPING PIERCING BANNER)
      ========================================================================= */}
      <AsymmetricScrollHijackSectionV6 id="he-sinh-thai">
        <div
          className={`p-8 sm:p-12 border-2 relative overflow-hidden ${
            theme === "dark"
              ? "bg-[#14161A] border-amber-600/30 shadow-[10px_10px_0px_0px_rgba(217,119,6,0.35)]"
              : theme === "contrast"
                ? "bg-white border-2 border-black"
                : "bg-[#ECE6DC] border-[#BDB4A5] shadow-2xl"
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 text-left">
              <div className="text-xs font-serif font-bold uppercase tracking-widest text-amber-500 mb-2">
                HỆ SINH THÁI KẾT NỐI KINH DOANH
              </div>
              <h2 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight mb-4">
                Cùng nhau tạo ra giá trị lớn hơn
              </h2>
              <p className="text-sm sm:text-base opacity-80 leading-relaxed mb-6 font-sans">
                Business Connect kết nối hội viên, hiệp hội, doanh nghiệp, chuyên gia, đối tác, nhà
                đầu tư và các tổ chức quốc tế trong một hệ sinh thái mở, để cùng chia sẻ tri thức,
                nguồn lực và cơ hội kinh doanh.
              </p>

              <div
                className={`p-4 border inline-block mb-6 ${
                  theme === "dark"
                    ? "bg-black border-amber-600/40 text-amber-400 font-bold shadow-[6px_6px_0px_0px_rgba(217,119,6,0.2)]"
                    : theme === "contrast"
                      ? "bg-black text-white"
                      : "bg-[#D8D2C6] border-[#8C6D46] text-[#4E3921] font-bold"
                }`}
              >
                <div className="text-xs sm:text-sm font-serif font-bold tracking-widest uppercase">
                  NHIỀU KẾT NỐI HƠN. NHIỀU CƠ HỘI HƠN. NHIỀU GIÁ TRỊ HƠN.
                </div>
              </div>
            </div>

            {/* ASYMMETRIC RIGHT PIERCING BOX */}
            <div className="lg:col-span-4 lg:-mt-10 font-serif">
              <div
                className={`p-6 border-2 text-left ${
                  theme === "dark"
                    ? "bg-black/80 border-amber-600/40 shadow-xl"
                    : theme === "contrast"
                      ? "bg-black text-white"
                      : "bg-[#F7F5F0] border-[#BDB4A5] shadow-lg"
                }`}
              >
                <div className="text-xs uppercase tracking-widest text-amber-500 mb-2 font-bold">
                  THỂ CHẾ LIÊN MINH
                </div>
                <div className="text-lg font-bold mb-3">Xúc Tiến Thương Mại Bền Vững</div>
                <p className="text-xs opacity-80 mb-6 font-sans">
                  Thiết lập chuẩn mực hợp tác giữa các câu lạc bộ doanh nhân hàng đầu và mạng lưới
                  ngoại giao thương mại quốc tế.
                </p>
                <button
                  onClick={() => setShowDemoModal(true)}
                  className="inline-flex items-center gap-2 text-xs font-serif font-bold uppercase tracking-wider text-amber-500 hover:underline"
                >
                  <span>Xem hồ sơ hệ sinh thái</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </AsymmetricScrollHijackSectionV6>

      {/* =========================================================================
          6. CLIENTS & TESTIMONIALS (OVERLAPPING ASYMMETRIC MONOLITH CARDS)
      ========================================================================= */}
      <AsymmetricScrollHijackSectionV6 id="khach-hang">
        <div className="mb-8 text-left">
          <div className="text-xs font-serif font-bold uppercase tracking-widest text-amber-500 mb-2">
            ĐƯỢC TIN TƯỞNG BỞI CÁC HIỆP HỘI VÀ DOANH NGHIỆP
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
            Những tổ chức tiên phong đã lựa chọn
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-16 font-serif">
          {LOGOS.map((l) => (
            <div
              key={l.name}
              className={`p-5 border-2 text-center transition hover:border-amber-500 ${
                theme === "dark"
                  ? "bg-[#14161A] border-amber-600/20"
                  : theme === "contrast"
                    ? "bg-white border-2 border-black"
                    : "bg-[#ECE6DC] border-[#BDB4A5] shadow-sm"
              }`}
            >
              <div className="font-bold text-base">{l.name}</div>
              <div className="text-[10px] opacity-60 leading-tight mt-1 font-sans">{l.label}</div>
            </div>
          ))}
        </div>

        <div id="cau-chuyen" className="mb-8 text-left">
          <div className="text-xs font-serif font-bold uppercase tracking-widest text-amber-500 mb-2">
            CÂU CHUYỆN THÀNH CÔNG
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
            Kết nối đúng. Tăng trưởng thật.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-serif">
          {REVIEWS.map((r, idx) => (
            <div
              key={r.author}
              className={`p-7 border-2 flex flex-col justify-between relative ${
                idx === 1 ? "md:-mt-6" : ""
              } ${
                theme === "dark"
                  ? "bg-[#14161A] border-amber-600/20 shadow-xl"
                  : theme === "contrast"
                    ? "bg-white border-2 border-black"
                    : "bg-[#ECE6DC] border-[#BDB4A5] shadow-lg"
              }`}
            >
              <div className="absolute -top-3 left-6 px-3 py-0.5 border text-[10px] font-serif font-bold uppercase bg-amber-500 text-black border-amber-400">
                CASE_STUDY_0{idx + 1}
              </div>
              <p className="text-xs sm:text-sm italic leading-relaxed mb-6 opacity-90 pt-2 font-sans">
                "{r.quote}"
              </p>
              <div className="pt-4 border-t border-current/10 text-left">
                <div className="font-bold text-sm">{r.author}</div>
                <div className="text-xs opacity-70 font-sans">
                  {r.role}, {r.org}
                </div>
              </div>
            </div>
          ))}
        </div>
      </AsymmetricScrollHijackSectionV6>

      {/* =========================================================================
          7. FOOTER
      ========================================================================= */}
      <footer
        className={`py-20 px-4 sm:px-6 lg:px-8 border-t relative z-20 ${
          theme === "dark"
            ? "border-amber-600/20 bg-black"
            : theme === "contrast"
              ? "border-black bg-black text-white"
              : "border-[#D8D2C6] bg-[#EAE5DB]"
        }`}
      >
        <div className="max-w-7xl mx-auto text-center font-serif">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Sẵn sàng mở ra nhiều cơ hội hơn?</h2>
          <p className="text-sm sm:text-base opacity-75 max-w-2xl mx-auto mb-8 font-sans">
            Hãy để Business Connect đồng hành cùng hiệp hội hoặc doanh nghiệp của bạn.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <button
              onClick={() => setShowDemoModal(true)}
              className={`inline-flex items-center gap-2 px-7 py-3.5 text-xs font-serif font-bold uppercase tracking-wider ${
                theme === "dark"
                  ? "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:shadow-[0_0_30px_rgba(245,158,11,0.55)]"
                  : theme === "contrast"
                    ? "bg-white text-black border-2 border-white"
                    : "bg-[#7A6448] text-white shadow-md hover:bg-[#68533A]"
              }`}
            >
              <span>Đặt demo ngay</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                toast.success("Cảm ơn bạn! Chuyên viên tư vấn sẽ liên hệ trong vòng 24 giờ.");
              }}
              className={`px-6 py-3.5 text-xs font-serif font-bold uppercase tracking-wider border ${
                theme === "dark"
                  ? "border-amber-600/30 bg-[#16181C] text-white hover:bg-[#202328]"
                  : theme === "contrast"
                    ? "border-2 border-white bg-black text-white"
                    : "border-[#8C6D46] bg-[#ECE6DC] text-[#4E3921] hover:bg-[#DFD9CE]"
              }`}
            >
              Liên hệ tư vấn
            </button>
          </div>

          <div className="text-xs opacity-50 border-t border-current/10 pt-8 font-mono">
            © {new Date().getFullYear()} Business Connect. Monument Edition V6.
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
              className={`relative w-full max-w-lg p-8 border-2 font-serif ${
                theme === "dark"
                  ? "bg-[#14161A] border-amber-600/50 text-white shadow-[0_0_40px_rgba(217,119,6,0.35)]"
                  : theme === "contrast"
                    ? "bg-white text-black border-4 border-black"
                    : "bg-[#ECE6DC] text-[#332A1F] border-[#8C6D46] shadow-2xl"
              }`}
            >
              <button
                onClick={() => setShowDemoModal(false)}
                className="absolute top-4 right-4 p-2 opacity-60 hover:opacity-100"
              >
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-2xl font-bold mb-2">Đăng Ký Trải Nghiệm Demo</h3>
              <p className="text-sm opacity-75 mb-6 font-sans">
                Chuyên viên cấp cao sẽ liên hệ trực tiếp để giới thiệu giải pháp phù hợp nhất.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Đăng ký thành công! Chúng tôi sẽ liên hệ trong vòng 24 giờ.");
                  setShowDemoModal(false);
                }}
                className="space-y-4 text-left font-sans"
              >
                <div>
                  <label className="block text-xs font-serif font-bold uppercase tracking-wider mb-1 opacity-80">
                    Họ và tên
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full px-4 py-3 border border-current/20 bg-current/5 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-serif font-bold uppercase tracking-wider mb-1 opacity-80">
                    Doanh nghiệp / Hiệp hội
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="VD: Công ty TNHH Cung Ứng..."
                    className="w-full px-4 py-3 border border-current/20 bg-current/5 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-serif font-bold uppercase tracking-wider mb-1 opacity-80">
                    Số điện thoại
                  </label>
                  <input
                    required
                    type="tel"
                    placeholder="VD: 0987654321"
                    className="w-full px-4 py-3 border border-current/20 bg-current/5 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 text-xs font-serif font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-bold hover:brightness-105 transition mt-4 shadow-lg"
                >
                  Xác Nhận Đăng Ký
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showVideoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative w-full max-w-4xl bg-black border-2 border-amber-600/40 p-8 flex flex-col items-center justify-center text-white aspect-video shadow-[0_0_50px_rgba(217,119,6,0.35)]">
              <button
                onClick={() => setShowVideoModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
              <Play className="h-16 w-16 text-amber-500 mb-4 animate-pulse" />
              <div className="text-xl font-serif font-bold">
                Giới Thiệu Nền Tảng Business Connect (2 Phút)
              </div>
              <div className="text-sm text-amber-500/80 mt-2 font-mono">
                Đang khởi tạo trình chiếu chuyên biệt...
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </DeepTechLayoutWrapper>
  );
}
