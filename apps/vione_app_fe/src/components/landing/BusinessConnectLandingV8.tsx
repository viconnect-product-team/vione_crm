import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
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
  Award,
} from "lucide-react";
import { toast } from "sonner";

type ThemeMode = "light" | "dark" | "contrast";

// =========================================================================
// V8: EXECUTIVE TITANIUM SUITE (Ultimate Corporate Synergy Flagship)
// =========================================================================
function ExecutiveTitaniumBackground({ theme }: { theme: ThemeMode }) {
  if (theme === "contrast") {
    return <div className="pointer-events-none fixed inset-0 z-0 bg-white" />;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className={`absolute inset-0 ${
          theme === "dark"
            ? "bg-[#090A0F] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]"
            : "bg-[#F8FAFC] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(203,213,225,0.4),rgba(255,255,255,0))]"
        }`}
      />
    </div>
  );
}

// 5 PROBLEMS - PART 1 EXACT
const PROBLEMS_DATA = [
  {
    num: "01",
    title: "Thông tin phân tán",
    desc: "Khó tìm đúng người trong mạng lưới do dữ liệu lưu trữ rải rác trên danh bạ, Zalo và nhiều file Excel rời rạc.",
  },
  {
    num: "02",
    title: "Khó duy trì quan hệ",
    desc: "Thiếu công cụ nhắc nhở và theo dõi tương tác, khiến sợi dây liên kết giữa các thành viên dần nguội lạnh.",
  },
  {
    num: "03",
    title: "Bỏ lỡ cơ hội",
    desc: "Không kịp nắm bắt cơ hội phù hợp khi hội viên có nhu cầu hợp tác hoặc cung ứng dịch vụ cấp thiết.",
  },
  {
    num: "04",
    title: "Thiếu kết nối thực chất",
    desc: "Nhiều sự kiện nhưng khó tạo giá trị sau sự kiện, giao lưu xã giao bề nổi thiếu cơ chế xúc tiến 1-on-1.",
  },
  {
    num: "05",
    title: "Khó đo lường hiệu quả",
    desc: "Không biết mối quan hệ mang lại giá trị gì, thiếu hệ thống số hóa ghi nhận doanh thu và cơ hội giao thương.",
  },
];

// 9 SOLUTIONS - PART 1 EXACT
const SOLUTIONS_DATA = [
  {
    icon: Users,
    title: "Quản lý hội viên",
    desc: "Hồ sơ 360°, phân nhóm thông minh, tra cứu nhanh năng lực doanh nghiệp và ban điều hành.",
  },
  {
    icon: Layers,
    title: "CRM & Quan hệ",
    desc: "Theo dõi lịch sử, ghi chú, nhắc nhở tương tác và quản lý mức độ gắn kết bền chặt.",
  },
  {
    icon: TrendingUp,
    title: "Cơ hội kinh doanh",
    desc: "Quản lý pipeline, matching thông minh, ghi nhận lời cảm ơn doanh thu và đo lường thành công.",
  },
  {
    icon: Calendar,
    title: "Sự kiện",
    desc: "Tổ chức, quản lý, kết nối trước - trong - sau sự kiện, check-in QR siêu tốc và sơ đồ chỗ ngồi VIP.",
  },
  {
    icon: Building2,
    title: "Cộng đồng & Nhóm",
    desc: "Không gian kết nối theo ngành, chủ đề chuyên sâu, phân ban chuyên môn và câu lạc bộ trực thuộc.",
  },
  {
    icon: BookOpen,
    title: "Tri thức & Nội dung",
    desc: "Chia sẻ chuyên gia, tài liệu hội thảo, thư viện biểu mẫu pháp lý và bản tin kinh tế độc quyền.",
  },
  {
    icon: BarChart3,
    title: "Báo cáo & Phân tích",
    desc: "Đo lường hiệu quả kết nối và ROI mạng lưới, bảng điều khiển KPI giao thương hiệp hội minh bạch.",
  },
  {
    icon: Bot,
    title: "AI Copilot",
    desc: "Tìm kiếm thông minh, gợi ý kết nối chuẩn xác theo ngành nghề và tóm tắt biên bản họp tự động.",
  },
  {
    icon: Share2,
    title: "Tích hợp & Mở rộng",
    desc: "Kết nối liền mạch với hệ thống khác CRM, email marketing, calendar và hóa đơn điện tử VAT.",
  },
];

const CLIENT_LOGOS = [
  "VCCI",
  "AmCham",
  "EuroCham",
  "KoCham",
  "Singapore Business Federation",
  "AusCham",
];

const TESTIMONIALS_DATA = [
  {
    quote:
      "Business Connect giúp Hiệp hội Du lịch chuyển đổi số toàn diện. Việc kết nối giữa hơn 1,200 doanh nghiệp hội viên diễn ra chuẩn xác và tạo ra doanh thu thực tế rõ rệt.",
    author: "Nguyễn Thị Lan",
    role: "Chủ tịch Hiệp hội Du lịch VN",
    badge: "1,200+ Hội viên",
  },
  {
    quote:
      "Hệ thống CRM và matching cơ hội kinh doanh giúp công ty tôi tìm được đúng các đối tác cung ứng tin cậy trong các hiệp hội công nghiệp lớn chỉ trong vài tuần.",
    author: "Trần Minh Quân",
    role: "CEO, Công ty Sản xuất Việt",
    badge: "Doanh nghiệp Tiêu biểu",
  },
  {
    quote:
      "Tôi tiết kiệm được 80% thời gian mở rộng quan hệ. Thay vì phát danh thiếp giấy tràn lan, Business Connect trao đúng giá trị cho đúng người lãnh đạo cần gặp.",
    author: "Lê Hoàng Anh",
    role: "Doanh nhân, Hội viên VIP",
    badge: "Hội viên VIP",
  },
];

export function BusinessConnectLandingV8() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [isDoorClosing, setIsDoorClosing] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoEmail, setDemoEmail] = useState("");
  const [demoName, setDemoName] = useState("");
  const [demoOrg, setDemoOrg] = useState("");

  const handleSetThemeWithDoor = (newTheme: ThemeMode) => {
    if (newTheme === theme) return;
    setIsDoorClosing(true);
    setTimeout(() => {
      setTheme(newTheme);
      setTimeout(() => {
        setIsDoorClosing(false);
      }, 600);
    }, 600);
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoEmail) {
      toast.error("Vui lòng nhập email doanh nghiệp!");
      return;
    }
    toast.success("Đặt lịch demo thành công! Ban tư vấn cấp cao ViOne sẽ liên hệ trong 15 phút.");
    setIsDemoModalOpen(false);
    setDemoEmail("");
    setDemoName("");
    setDemoOrg("");
  };

  const cardClasses = {
    light:
      "bg-white border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl",
    dark: "bg-[#11141E] border border-slate-800 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] hover:border-indigo-500/40 hover:shadow-[0_20px_35px_-5px_rgba(99,102,241,0.15)] transition-all duration-300 rounded-2xl",
    contrast: "bg-white border-2 border-black rounded-xl shadow-none",
  };

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 relative ${
        theme === "dark"
          ? "bg-[#090A0F] text-[#EDEDED]"
          : theme === "contrast"
            ? "bg-white text-black"
            : "bg-[#F8FAFC] text-slate-900"
      }`}
    >
      {/* Sliding Door Theme Transition */}
      <AnimatePresence>
        {isDoorClosing && (
          <div className="fixed inset-0 z-[999999] pointer-events-none flex">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.6, ease: [0.77, 0, 0.175, 1] }}
              className="w-1/2 h-full bg-[#11141E] border-r-2 border-indigo-500/40 shadow-2xl flex items-center justify-end pr-8"
            >
              <div className="w-1 h-32 bg-indigo-500/60 rounded-full" />
            </motion.div>
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: "0%" }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.6, ease: [0.77, 0, 0.175, 1] }}
              className="w-1/2 h-full bg-[#11141E] border-l-2 border-indigo-500/40 shadow-2xl flex items-center justify-start pl-8"
            >
              <div className="w-1 h-32 bg-indigo-500/60 rounded-full" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ExecutiveTitaniumBackground theme={theme} />

      {/* ========================================================================= */}
      {/* 1. HEADER (PART 1 EXACT) */}
      {/* ========================================================================= */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors ${
          theme === "dark"
            ? "bg-[#090A0F]/90 border-slate-800"
            : theme === "contrast"
              ? "bg-white border-b-2 border-black"
              : "bg-white/90 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/business-connect/v8" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-black text-lg shadow-md">
                V8
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight block">
                  BUSINESS CONNECT
                </span>
                <span className="text-[10px] tracking-widest uppercase font-semibold text-indigo-400">
                  Executive Titanium
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold tracking-wide">
              <a href="#giai-phap" className="hover:text-indigo-400 transition-colors">
                Giải pháp
              </a>
              <a href="#khach-hang" className="hover:text-indigo-400 transition-colors">
                Khách hàng
              </a>
              <a href="#cau-chuyen" className="hover:text-indigo-400 transition-colors">
                Câu chuyện
              </a>
              <a href="#bang-gia" className="hover:text-indigo-400 transition-colors">
                Bảng giá
              </a>
              <a href="#tai-nguyen" className="hover:text-indigo-400 transition-colors">
                Tài nguyên
              </a>
              <a href="#ve-chung-toi" className="hover:text-indigo-400 transition-colors">
                Về chúng tôi
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`flex items-center p-1 rounded-xl border ${
                theme === "dark"
                  ? "border-slate-800 bg-slate-900/60"
                  : "border-slate-200 bg-slate-100/80"
              }`}
            >
              <button
                onClick={() => handleSetThemeWithDoor("light")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${theme === "light" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"}`}
                title="Light Titanium"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleSetThemeWithDoor("dark")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${theme === "dark" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400"}`}
                title="Dark Obsidian"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleSetThemeWithDoor("contrast")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${theme === "contrast" ? "bg-black text-white" : "text-slate-400"}`}
                title="High Contrast"
              >
                <Contrast className="w-4 h-4" />
              </button>
            </div>

            <Link
              to="/auth"
              className="text-sm font-semibold px-3 py-2 hover:opacity-80 transition-opacity hidden sm:inline-block"
            >
              Đăng nhập
            </Link>

            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-wide shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2"
            >
              <span>Đặt demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION (PART 1 EXACT) */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-24 md:py-32 border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl">
            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" />
              NỀN TẢNG KẾT NỐI KINH DOANH THẾ HỆ MỚI
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8"
            >
              Hiểu đúng người. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">
                Mở ra cơ hội thật.
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-neutral-600 dark:text-neutral-300 font-normal leading-relaxed mb-10 max-w-3xl"
            >
              Business Connect giúp các hiệp hội, tổ chức và doanh nhân quản lý mối quan hệ, kết nối
              đúng người, đúng thời điểm và tạo ra nhiều cơ hội kinh doanh hơn với sức mạnh của AI.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 mb-16"
            >
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-3"
              >
                <span>Đặt demo ngay</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => toast.info("Video 2 phút đang chuẩn bị phát.")}
                className="px-7 py-4 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-base flex items-center gap-3 hover:opacity-90 transition-opacity"
              >
                <Play className="w-4 h-4 fill-current text-indigo-400" />
                <span>Xem video (2 phút)</span>
              </button>
            </motion.div>

            {/* 4 Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-indigo-500">
                  10,000+
                </div>
                <div className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Doanh nhân & Hội viên
                </div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">300+</div>
                <div className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Hiệp hội & Tổ chức
                </div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">50,000+</div>
                <div className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Kết nối được tạo
                </div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">20+</div>
                <div className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Quốc gia & vùng lãnh thổ
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PROBLEM SECTION (PART 1 EXACT - 5 CARDS) */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-24 border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase block mb-3">
              NHIỀU TỔ CHỨC VẪN ĐANG GẶP NHỮNG VẤN ĐỀ NÀY
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-2xl">
              Quản lý quan hệ kinh doanh vẫn còn nhiều thách thức
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {PROBLEMS_DATA.map((p, idx) => (
              <motion.div
                key={p.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className={`p-7 flex flex-col justify-between ${cardClasses[theme]}`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm mb-4">
                    {p.num}
                  </div>
                  <h3 className="text-lg font-bold tracking-tight mb-2">{p.title}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
                    {p.desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800 text-xs font-semibold text-indigo-400 flex items-center gap-1">
                  <span>Thách thức quản lý</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SOLUTION SECTION (PART 1 EXACT - 9 CARDS) */}
      {/* ========================================================================= */}
      <section
        id="giai-phap"
        className="relative z-10 py-24 border-b border-slate-200 dark:border-slate-800/80"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase block mb-3">
                GIẢI PHÁP BUSINESS CONNECT
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                Quản lý kết nối. Tạo ra cơ hội.
              </h2>
              <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 mt-4 max-w-3xl leading-relaxed">
                Một nền tảng toàn diện giúp hiệp hội, tổ chức và doanh nhân hiểu khách hàng, kết nối
                đúng người, xây dựng quan hệ bền vững và biến mối quan hệ thành cơ hội kinh doanh
                thực chất.
              </p>
            </div>
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="inline-flex items-center gap-2 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors whitespace-nowrap"
            >
              <span>Khám phá tính năng</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SOLUTIONS_DATA.map((sol, idx) => {
              const Icon = sol.icon;
              return (
                <motion.div
                  key={sol.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className={`p-8 ${cardClasses[theme]}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 text-indigo-400 flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight mb-3">{sol.title}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
                    {sol.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. ECOSYSTEM SECTION (PART 1 EXACT) */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-24 border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className={`p-10 md:p-16 rounded-3xl ${cardClasses[theme]}`}>
            <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase block mb-3">
              HỆ SINH THÁI KẾT NỐI KINH DOANH
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6">
              Cùng nhau tạo ra giá trị lớn hơn
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-4xl leading-relaxed mb-8">
              Business Connect kết nối hội viên, hiệp hội, doanh nghiệp, chuyên gia, đối tác, nhà
              đầu tư và các tổ chức quốc tế trong một hệ sinh thái mở, để cùng chia sẻ tri thức,
              nguồn lực và cơ hội kinh doanh.
            </p>

            <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-8 inline-block">
              <div className="text-sm md:text-base font-extrabold tracking-wider uppercase text-indigo-400">
                NHIỀU KẾT NỐI HƠN. NHIỀU CƠ HỘI HƠN. NHIỀU GIÁ TRỊ HƠN.
              </div>
            </div>

            <div>
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 transition-all"
              >
                <span>Xem hệ sinh thái</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CLIENT & TESTIMONIAL SECTION (PART 1 EXACT) */}
      {/* ========================================================================= */}
      <section
        id="khach-hang"
        className="relative z-10 py-24 border-b border-slate-200 dark:border-slate-800/80"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase block mb-2">
                ĐƯỢC TIN TƯỞNG BỞI CÁC HIỆP HỘI VÀ DOANH NGHIỆP
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Những tổ chức tiên phong đã lựa chọn
              </h3>
            </div>
            <a
              href="#tat-ca-khach-hang"
              className="text-sm font-bold text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả khách hàng</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-24">
            {CLIENT_LOGOS.map((name) => (
              <div
                key={name}
                className={`p-6 rounded-xl flex items-center justify-center text-center font-bold text-xs uppercase tracking-wider ${cardClasses[theme]}`}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Header 2 & 3 Reviews */}
          <div id="cau-chuyen" className="mb-12">
            <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase block mb-2">
              CÂU CHUYỆN THÀNH CÔNG
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Kết nối đúng. Tăng trưởng thật.
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS_DATA.map((t) => (
              <div
                key={t.author}
                className={`p-8 rounded-2xl flex flex-col justify-between ${cardClasses[theme]}`}
              >
                <div>
                  <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-6">
                    {t.badge}
                  </div>
                  <p className="text-base leading-relaxed italic mb-8">"{t.quote}"</p>
                </div>
                <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800">
                  <div className="font-extrabold text-base tracking-tight">{t.author}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FOOTER (PART 1 EXACT) */}
      {/* ========================================================================= */}
      <footer className="relative z-10 py-24 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6">
              Sẵn sàng mở ra nhiều cơ hội hơn?
            </h2>
            <p className="text-base sm:text-lg text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Hãy để Business Connect đồng hành cùng hiệp hội hoặc doanh nghiệp của bạn.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-3"
              >
                <span>Đặt demo ngay</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsDemoModalOpen(true)}
                className={`px-8 py-4 rounded-xl border ${
                  theme === "dark"
                    ? "border-slate-700 bg-slate-800/40"
                    : "border-slate-300 bg-white"
                } font-bold text-base hover:opacity-90 transition-opacity`}
              >
                Liên hệ tư vấn
              </button>
            </div>

            <div className="pt-10 border-t border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>© 2026 VIONE B2B PLATFORM. TẤT CẢ QUYỀN ĐƯỢC BẢO LƯU.</div>
              <div className="flex items-center gap-6">
                <span>EXECUTIVE TITANIUM SUITE</span>
                <span>ENTERPRISE SLA 99.9%</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* DEMO MODAL */}
      <AnimatePresence>
        {isDemoModalOpen && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDemoModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative z-10 w-full max-w-lg rounded-2xl bg-[#11141E] border border-slate-700 p-8 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold">Đăng Ký Đặt Lịch Demo</h3>
                  <p className="text-xs text-indigo-400 mt-1">
                    Dành riêng cho Lãnh đạo Hiệp hội & Doanh nghiệp
                  </p>
                </div>
                <button
                  onClick={() => setIsDemoModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleDemoSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    required
                    value={demoName}
                    onChange={(e) => setDemoName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-4 py-3 rounded-xl bg-[#090A0F] border border-slate-700 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email doanh nghiệp
                  </label>
                  <input
                    type="email"
                    required
                    value={demoEmail}
                    onChange={(e) => setDemoEmail(e.target.value)}
                    placeholder="ceo@enterprise.com"
                    className="w-full px-4 py-3 rounded-xl bg-[#090A0F] border border-slate-700 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tên Hiệp hội / Doanh nghiệp
                  </label>
                  <input
                    type="text"
                    required
                    value={demoOrg}
                    onChange={(e) => setDemoOrg(e.target.value)}
                    placeholder="Hiệp hội Doanh nghiệp TP.HCM"
                    className="w-full px-4 py-3 rounded-xl bg-[#090A0F] border border-slate-700 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all"
                  >
                    Xác nhận đặt demo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
