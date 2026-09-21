import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { submitClubApplication, checkClubRegistrationStatus } from "@/lib/club-application.functions";
import {
  Crown,
  ShieldCheck,
  Zap,
  Users,
  Building2,
  TrendingUp,
  Award,
  Lock,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Globe2,
  GraduationCap,
  Sparkles,
  X,
  RotateCw,
  QrCode,
  Briefcase,
  Layers,
  Compass,
} from "lucide-react";

/** ========================================================================= */
/** KINETIC TEXT REVEAL COMPONENTS (HIỆU ỨNG CHỮ XUẤT HIỆN TỪ TỪ ĐA DẠNG)      */
/** ========================================================================= */

/** Staggered Word-by-Word Text Reveal */
function KineticWordsReveal({
  text,
  className = "",
  delay = 0,
  stagger = 0.05,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={`inline-block ${className}`}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{
            duration: 0.6,
            delay: delay + i * stagger,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="inline-block mr-[0.28em] will-change-transform"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/** Dynamic Keyword Rotator (Luân chuyển từ khóa hành động) */
function RotatingKeywordHero({
  words,
  className = "",
}: {
  words: string[];
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [words.length]);

  return (
    <span className={`inline-block relative h-[1.3em] overflow-hidden align-top ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: "100%", opacity: 0, filter: "blur(4px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-100%", opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#FBBF24] font-black drop-shadow-xs"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Animated Section Heading với dải viền vàng tự vẽ */
function SectionTitleReveal({
  tag,
  title,
  subtitle,
  center = true,
}: {
  tag: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={`mb-12 sm:mb-16 ${center ? "text-center mx-auto max-w-3xl" : "max-w-2xl"}`}>
      {/* Huy hiệu nhỏ viền vàng */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold tracking-widest uppercase font-mono bg-blue-50/90 text-[#003B95] border border-blue-200/80 shadow-xs mb-3.5"
      >
        <span className="w-2 h-2 rounded-full bg-[#D97706] animate-ping" />
        <span>{tag}</span>
      </motion.div>

      {/* Tiêu đề chính xuất hiện từ từ */}
      <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#0F172A] uppercase leading-tight font-sans">
        <KineticWordsReveal text={title} />
      </h2>

      {/* Dải line vàng kim tự vẽ */}
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        whileInView={{ width: center ? "120px" : "80px", opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        className={`h-1 bg-gradient-to-r from-[#003B95] via-[#F59E0B] to-[#003B95] rounded-full my-4 ${
          center ? "mx-auto" : ""
        }`}
      />

      {/* Đoạn giới thiệu bổ trợ */}
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-sm sm:text-base md:text-lg text-[#475569] font-medium leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

/** ========================================================================= */
/** 3D TITANIUM VIP CARD (INTERACTIVE GYRO & FLIP)                           */
/** ========================================================================= */
function HeroTitaniumVipCard() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotateX(((y - centerY) / centerY) * -10);
    setRotateY(((x - centerX) / centerX) * 10);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      className="relative w-full max-w-[420px] aspect-[1.62/1] [perspective:1400px] cursor-pointer group"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      {/* Outer Golden Glow & Pulse Aura */}
      <div className="absolute -inset-2 bg-gradient-to-r from-[#003B95]/20 via-[#F59E0B]/30 to-[#003B95]/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity animate-pulse duration-1000" />

      {/* 3D Card Container */}
      <motion.div
        animate={{
          rotateX: isFlipped ? 0 : rotateX,
          rotateY: isFlipped ? 180 : rotateY,
        }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative w-full h-full duration-700 [transform-style:preserve-3d] rounded-2xl shadow-2xl shadow-blue-950/20 select-none"
      >
        {/* ================================================================ */}
        {/* FRONT: MẶT TRƯỚC THẺ TITANIUM VIP PASS                          */}
        {/* ================================================================ */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0A192F] text-white rounded-2xl overflow-hidden [backface-visibility:hidden] p-5 sm:p-6 border border-amber-400/40 flex flex-col justify-between shadow-inner">
          {/* Subtle Concentric Rings Watermark */}
          <svg
            className="absolute -right-8 -top-8 w-52 h-52 pointer-events-none opacity-20"
            viewBox="0 0 200 200"
            fill="none"
          >
            <circle cx="100" cy="100" r="30" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="100" cy="100" r="50" stroke="#F59E0B" strokeWidth="1" />
            <circle cx="100" cy="100" r="70" stroke="#F59E0B" strokeWidth="1" />
            <circle cx="100" cy="100" r="90" stroke="#F59E0B" strokeWidth="1.2" />
          </svg>

          {/* Top Row: VIP Badge & Logo */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-300">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black tracking-widest text-amber-300 uppercase block">
                  TITANIUM VIP PASS
                </span>
                <span className="text-[9px] text-slate-300 font-medium">CLB CEO 1983 • HANOIBA</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 border border-white/20 text-[10px] font-mono text-white">
              <Zap className="w-3 h-3 text-amber-300" />
              <span>NFC TOUCH</span>
            </div>
          </div>

          {/* Middle: Member Name & Chip Emblem */}
          <div className="relative z-10 my-auto">
            <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/80 shadow-md mb-2 flex items-center justify-center opacity-90">
              <div className="w-6 h-4 border border-amber-900/40 rounded-xs grid grid-cols-2 gap-0.5 p-0.5">
                <div className="bg-amber-700/30 rounded-xs" />
                <div className="bg-amber-700/30 rounded-xs" />
              </div>
            </div>
            <div className="text-[11px] font-mono text-amber-200/90 font-semibold tracking-wider">
              EXECUTIVE MEMBER
            </div>
            <div className="text-lg sm:text-xl font-black text-white tracking-wide uppercase font-sans">
              DOANH NHÂN QUÝ HỢI
            </div>
          </div>

          {/* Bottom: ID Code & Flip Hint */}
          <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-300">
            <span className="font-bold text-amber-300">ID: 1983-HNBA-8888</span>
            <span className="text-[10px] text-amber-400/90 flex items-center gap-1 font-semibold group-hover:underline">
              <RotateCw className="w-3 h-3 animate-spin" style={{ animationDuration: "6s" }} />
              Chạm lật thẻ ↺
            </span>
          </div>
        </div>

        {/* ================================================================ */}
        {/* BACK: MẶT SAU THẺ VIP (XANH HOÀNG GIA & QR BẢO MẬT)              */}
        {/* ================================================================ */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#003B95] via-[#1E40AF] to-[#0A2540] text-white rounded-2xl overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] p-5 sm:p-6 border border-amber-300/50 flex flex-col justify-between shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/15 pb-2">
            <span className="text-xs font-mono font-bold text-amber-300 uppercase">
              XÁC THỰC HỘI VIÊN CHÍNH THỨC
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="flex items-center gap-4 my-auto">
            <div className="w-20 h-20 bg-white rounded-xl p-1.5 flex items-center justify-center shadow-lg shrink-0">
              <QrCode className="w-full h-full text-[#003B95]" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-200 uppercase">Bảo Chứng Tín Nhiệm HanoiBA</div>
              <div className="text-[11px] text-slate-200 mt-1 leading-snug">
                Quét mã để kết nối Deal B2B khép kín và lưu danh thiếp số vào Apple / Google Wallet.
              </div>
              <div className="mt-2 text-[10px] font-mono text-amber-300 font-semibold">
                TIÊU CHUẨN AA+ QUỐC GIA
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] font-medium text-blue-200">
            Chạm một lần nữa để quay lại mặt trước ↺
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/** ========================================================================= */
/** MAIN COMPONENT: CEO1983 BLUE-WHITE-GOLD LANDING                          */
/** ========================================================================= */
export function Ceo1983BlueWhiteGoldLanding() {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Tra cứu hồ sơ & Auto-polling 4s
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusQuery, setStatusQuery] = useState("");
  const [statusResult, setStatusResult] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [autoPolling, setAutoPolling] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (statusModalOpen && autoPolling && statusQuery.trim()) {
      interval = setInterval(async () => {
        try {
          const q = statusQuery.trim();
          const res = await checkClubRegistrationStatus({
            data: {
              phone: q.includes("@") ? undefined : q,
              email: q.includes("@") ? q : undefined,
            },
          });
          if (res) {
            setStatusResult(res);
            if (res.status === "approved" || res.isApproved) {
              setAutoPolling(false);
              toast.success("Hồ sơ của bạn đã được Ban Thư ký phê duyệt chính thức!");
            }
          }
        } catch {}
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [statusModalOpen, autoPolling, statusQuery]);

  const handleCheckStatus = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = statusQuery.trim();
    if (!q) {
      toast.error("Vui lòng nhập số điện thoại hoặc email đã nộp hồ sơ");
      return;
    }
    setCheckingStatus(true);
    try {
      const res = await checkClubRegistrationStatus({
        data: {
          phone: q.includes("@") ? undefined : q,
          email: q.includes("@") ? q : undefined,
        },
      });
      setStatusResult(res);
      if (res && res.found) {
        if (res.status === "pending" || !res.isApproved) {
          setAutoPolling(true);
          toast.info("Đang tự động theo dõi tiến độ xét duyệt (cập nhật mỗi 4 giây)...");
        } else if (res.status === "approved" || res.isApproved) {
          setAutoPolling(false);
          toast.success("Chúc mừng! Hồ sơ của bạn đã được phê duyệt.");
        }
      } else {
        setAutoPolling(false);
        toast.error("Không tìm thấy hồ sơ với thông tin này. Bạn có thể nộp hồ sơ mới!");
      }
    } catch {
      toast.error("Không thể kết nối máy chủ kiểm tra trạng thái.");
    } finally {
      setCheckingStatus(false);
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    company: "",
    title: "",
    revenue: "10 - 50 Tỷ VNĐ",
    industry: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.company.trim()) {
      toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitClubApplication({
        data: {
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          company: formData.company,
          title: formData.title || "CEO / C-Level",
          revenue: formData.revenue,
          industry: formData.industry,
          clubSlug: "ceo-1983",
        },
      });

      if (res.ok) {
        toast.success("Nộp hồ sơ thành công!", {
          description: "Ban Thư Ký CLB CEO 1983 sẽ liên hệ thẩm định trong vòng 24 giờ làm việc.",
        });
        setModalOpen(false);
        setFormData({
          fullName: "",
          phone: "",
          email: "",
          company: "",
          title: "",
          revenue: "10 - 50 Tỷ VNĐ",
          industry: "",
        });
      }
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans selection:bg-[#F59E0B] selection:text-white relative overflow-x-hidden">
      {/* Ambient Radial Gradient Overlays (Tông Xanh - Trắng - Vàng Kim) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-blue-100/60 via-amber-50/40 to-transparent blur-3xl opacity-80" />
        <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-blue-100/40 blur-3xl rounded-full" />
        <div className="absolute top-[60%] left-[-10%] w-[500px] h-[500px] bg-amber-100/40 blur-3xl rounded-full" />
      </div>

      {/* ===================================================================== */}
      {/* TOP NAVBAR (STICKY FROSTED GLASS - TRẮNG XANH VÀNG)                  */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-50 w-full bg-white/85 backdrop-blur-xl border-b border-blue-100/80 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Tổ chức */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/ceo1983-official-logo.png"
              alt="Logo CLB Doanh Nhân CEO 1983"
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-xs"
            />
            <div className="hidden sm:block">
              <div className="text-xs font-black text-[#003B95] tracking-wider uppercase">
                CLB DOANH NHÂN CEO 1983
              </div>
              <div className="text-[10px] text-[#64748B] font-semibold tracking-tight">
                Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs sm:text-[13px] font-bold text-[#334155]">
            <a href="#about" className="hover:text-[#003B95] transition-colors">
              Về CEO 1983
            </a>
            <a href="#values" className="hover:text-[#003B95] transition-colors">
              4 Trụ Cột
            </a>
            <a href="#stats" className="hover:text-[#003B95] transition-colors">
              Thống Kê
            </a>
            <a href="#leadership" className="hover:text-[#003B95] transition-colors">
              Ban Lãnh Đạo
            </a>
            <a href="#ecosystem" className="hover:text-[#003B95] transition-colors">
              Hệ Sinh Thái
            </a>
            <a href="#process" className="hover:text-[#003B95] transition-colors">
              Quy Trình VIP
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => {
                setStatusModalOpen(true);
                setStatusResult(null);
              }}
              className="px-3 py-2 rounded-xl text-xs sm:text-[12.5px] font-bold text-slate-700 hover:text-[#003B95] hover:bg-slate-100 transition-colors border border-slate-200/80 cursor-pointer flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-[#003B95]" />
              <span className="hidden sm:inline">Tra Cứu Hồ Sơ</span>
              <span className="sm:hidden">Tra cứu</span>
            </button>

            <Link
              to="/association/login"
              className="px-3.5 py-2 rounded-xl text-xs sm:text-[12.5px] font-bold text-[#003B95] hover:bg-blue-50 transition-colors border border-blue-200/80 cursor-pointer"
            >
              Đăng Nhập App
            </Link>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="relative group overflow-hidden px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-[13px] font-black text-white bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#D97706] bg-[length:200%_auto] hover:bg-right transition-all duration-500 shadow-md shadow-amber-500/25 active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5 text-white animate-bounce" />
              <span>GIA NHẬP VIP →</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* SECTION 1: HERO SECTION (XANH - TRẮNG - VÀNG KIM HIỆN ĐẠI)            */}
      {/* ===================================================================== */}
      <section id="about" className="relative z-10 pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Cột trái: Văn bản & Hiệu ứng chữ xuất hiện từ từ */}
            <div className="lg:col-span-7 text-center lg:text-left">
              {/* Huy hiệu HanoiBA với hiệu ứng phát sáng */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold font-mono tracking-wider bg-blue-50 border border-blue-200 text-[#003B95] shadow-xs mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-[#D97706] animate-ping" />
                <span>★ TRỰC THUỘC HỘI DOANH NHÂN TRẺ HÀ NỘI (HANOIBA)</span>
              </motion.div>

              {/* Tiêu đề chính động: Kinetic Typography */}
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-[#0F172A] uppercase tracking-tight leading-[1.15] font-sans">
                <span className="block text-slate-800">
                  <KineticWordsReveal text="LIÊN MINH DOANH NHÂN 1983" delay={0.1} />
                </span>
                <span className="block text-[#003B95] mt-1">
                  <KineticWordsReveal text="HỘI TỤ ĐỈNH CAO —" delay={0.3} />
                </span>
                <span className="block mt-1">
                  <RotatingKeywordHero
                    words={[
                      "GẮN KẾT BỀN VỮNG",
                      "HỢP LỰC DOANH NHÂN",
                      "GIAO THƯƠNG THỰC CHẤT",
                      "TIÊN PHONG SỐ HÓA",
                    ]}
                  />
                </span>
              </h1>

              {/* Đoạn mô tả với Fade In */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="mt-6 text-base sm:text-lg md:text-xl text-[#475569] font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0"
              >
                Vòng tròn liên minh <strong className="text-[#003B95]">200+ Chủ tịch & CEO Quý Hợi 1983</strong>. Mở khóa
                chuỗi cung ứng khép kín <strong className="text-[#D97706]">&gt;5.000 Tỷ VNĐ</strong> tại giai đoạn vàng sự
                nghiệp cùng nền tảng số hóa độc bản.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.65 }}
                className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-4"
              >
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="px-7 py-3.5 rounded-2xl text-sm sm:text-base font-black text-white bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#D97706] hover:shadow-xl hover:shadow-amber-500/30 transition-all active:scale-95 cursor-pointer flex items-center gap-2 border border-amber-300"
                >
                  <Crown className="w-4 h-4 text-white" />
                  <span>ĐĂNG KÝ GIA NHẬP CLB VIP →</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStatusModalOpen(true);
                    setStatusResult(null);
                  }}
                  className="px-5 py-3.5 rounded-2xl text-sm sm:text-base font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all border border-slate-200/90 shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-[#D97706]" />
                  <span>Tra Cứu Tiến Độ</span>
                </button>

                <Link
                  to="/association/login"
                  className="px-6 py-3.5 rounded-2xl text-sm sm:text-base font-bold text-[#003B95] bg-white hover:bg-blue-50/80 transition-all border border-blue-200/80 shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-[#003B95]" />
                  <span>Mở Cổng Hội Viên App</span>
                </Link>
              </motion.div>

              {/* Điểm bảo chứng nhanh (Trust badges) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.85 }}
                className="mt-8 sm:mt-10 pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs sm:text-[13px] font-bold text-[#64748B]"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D97706]" />
                  <span>100% Thẩm Định Doanh Nghiệp</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#003B95]" />
                  <span>Bảo Chứng HanoiBA</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Thẻ Titanium NFC 1-Chạm</span>
                </div>
              </motion.div>
            </div>

            {/* Cột phải: 3D Titanium VIP Card Interactive */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <HeroTitaniumVipCard />

              {/* Gợi ý tương tác */}
              <p className="mt-4 text-xs font-mono font-semibold text-[#64748B] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                Rê chuột tạo hiệu ứng 3D & chạm để lật mặt thẻ
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 2: STATS COUNTER & METRICS (THỐNG KÊ ẤN TƯỢNG)               */}
      {/* ===================================================================== */}
      <section id="stats" className="relative z-10 py-16 bg-white border-y border-blue-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                num: "200+",
                title: "CEO Đồng Niên",
                desc: "Chủ tịch & TGĐ đã thẩm định",
                color: "text-[#003B95]",
                border: "border-blue-200",
              },
              {
                num: ">5.000 Tỷ",
                title: "VND Giao Thương",
                desc: "Chuỗi cung ứng khép kín",
                color: "text-[#D97706]",
                border: "border-amber-200",
              },
              {
                num: "+35%",
                title: "Tăng Trưởng B2B",
                desc: "Ưu đãi đặc quyền nội bộ",
                color: "text-[#003B95]",
                border: "border-blue-200",
              },
              {
                num: "100%",
                title: "Thẩm Định Minh Bạch",
                desc: "Bảo chứng uy tín C-Level",
                color: "text-emerald-600",
                border: "border-emerald-200",
              },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.12 }}
                whileHover={{ y: -6 }}
                className={`p-6 rounded-2xl bg-gradient-to-b from-white to-slate-50 border ${stat.border} shadow-sm text-center relative overflow-hidden group`}
              >
                {/* Micro Animated Background Circle */}
                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-slate-100/60 group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

                <div className={`text-3xl sm:text-4xl lg:text-5xl font-black font-sans ${stat.color} tracking-tight`}>
                  {stat.num}
                </div>
                <div className="text-sm sm:text-base font-black text-slate-800 mt-2 uppercase tracking-wide">
                  {stat.title}
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">{stat.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 3: 4 TRỤ CỘT HÀNH ĐỘNG / GIÁ TRỊ CỐT LÕI (CORE VALUES)       */}
      {/* ===================================================================== */}
      <section id="values" className="relative z-10 py-20 sm:py-28 bg-[#F0F6FF]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitleReveal
            tag="TÔN CHỈ HOẠT ĐỘNG"
            title="4 Trụ Cột Hành Động Đồng Niên"
            subtitle="Nền tảng gắn kết vững bền, tương trợ lẫn nhau giữa 200+ Chủ tịch và Tổng Giám đốc sinh năm 1983."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
            {[
              {
                num: "01",
                title: "Gắn Kết Bền Lâu",
                badge: "100% TIN CẬY",
                tags: ["Đồng Niên 1983", "Quản Trị Thực Chiến"],
                icon: <Users className="w-6 h-6 text-[#003B95]" />,
                accentBg: "bg-blue-50 border-blue-200 text-[#003B95]",
              },
              {
                num: "02",
                title: "Học Tập Liên Tục",
                badge: "TOP ĐẦU NGÀNH",
                tags: ["Shark & Cố Vấn", "Chiến Lược Dòng Tiền"],
                icon: <GraduationCap className="w-6 h-6 text-[#D97706]" />,
                accentBg: "bg-amber-50 border-amber-200 text-[#D97706]",
              },
              {
                num: "03",
                title: "Đổi Mới Sáng Tạo",
                badge: "AI & TITANIUM NFC",
                tags: ["NFC 1-Chạm", "Tự Động Hóa E2E"],
                icon: <Zap className="w-6 h-6 text-[#003B95]" />,
                accentBg: "bg-blue-50 border-blue-200 text-[#003B95]",
              },
              {
                num: "04",
                title: "Phát Triển Bền Vững",
                badge: ">5.000 TỶ B2B",
                tags: ["Chuỗi Cung Ứng", "Trách Nhiệm Xã Hội"],
                icon: <Globe2 className="w-6 h-6 text-[#D97706]" />,
                accentBg: "bg-amber-50 border-amber-200 text-[#D97706]",
              },
            ].map((pillar, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: idx * 0.15 }}
                whileHover={{ y: -8 }}
                className="p-7 rounded-3xl bg-white border border-blue-100 shadow-lg shadow-blue-900/5 hover:border-amber-400/80 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Top Gold Border Light Sweep */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border ${pillar.accentBg}`}>
                      {pillar.badge}
                    </span>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 group-hover:scale-110 transition-transform">
                      {pillar.icon}
                    </div>
                  </div>

                  <span className="text-4xl font-black font-serif text-slate-300 group-hover:text-[#D97706] transition-colors">
                    {pillar.num}
                  </span>

                  <h3 className="text-xl font-black text-slate-900 mt-2 uppercase font-sans leading-snug">
                    {pillar.title}
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {pillar.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700"
                      >
                        <CheckCircle2 className="w-3 h-3 text-[#D97706]" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
                  <span className="font-bold text-[#003B95]">HẢI TRÌNH ĐỒNG NIÊN</span>
                  <span className="font-semibold text-[#D97706]">CEO 1983</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 4: BAN LÃNH ĐẠO & CỐ VẤN CHIẾN LƯỢC (LEADERSHIP)             */}
      {/* ===================================================================== */}
      <section id="leadership" className="relative z-10 py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitleReveal
            tag="GƯƠNG MẶT ĐẦU TÀU NHIỆM KỲ 2025 - 2028"
            title="Ban Lãnh Đạo & Cố Vấn Chiến Lược"
            subtitle="Đội ngũ lãnh đạo bản lĩnh, điều hành các tập đoàn đa ngành, bảo chứng bởi Hội Doanh Nhân Trẻ Hà Nội."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Anh Lê Hoàng Long",
                role: "Chủ Tịch CLB Doanh Nhân CEO 1983",
                company: "Chủ tịch HĐQT Tập Đoàn Đầu Tư Long Thành",
                quote: "Kết nối thực chất, giao thương giá trị và xây dựng nền tảng thịnh vượng cho doanh nhân Quý Hợi.",
                avatarBg: "from-blue-600 to-indigo-800",
                badge: "CHỦ TỊCH NHIỆM KỲ",
              },
              {
                name: "Ban Thường Trực CLB",
                role: "Phó Chủ Tịch & Ban Thư Ký",
                company: "Đại diện các khối ngành Trọng Điểm",
                quote: "Điều phối mạng lưới xúc tiến thương mại B2B, thẩm định chất lượng và hỗ trợ hội viên 24/7.",
                avatarBg: "from-amber-500 to-amber-700",
                badge: "BAN THƯỜNG TRỰC",
              },
              {
                name: "Hội Đồng Cố Vấn Cấp Cao",
                role: "Chuyên Gia & Shark Đồng Hành",
                company: "Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)",
                quote: "Tư vấn chiến lược tái cấu trúc vốn, quản trị rủi ro và xúc tiến thị trường quốc tế.",
                avatarBg: "from-slate-700 to-slate-900",
                badge: "CỐ VẤN CHIẾN LƯỢC",
              },
            ].map((lead, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.18 }}
                whileHover={{ y: -6 }}
                className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-md hover:border-amber-400/80 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${lead.avatarBg} text-white flex items-center justify-center font-black text-2xl shadow-md`}
                    >
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        {lead.badge}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 mt-1">{lead.name}</h3>
                      <div className="text-xs font-bold text-[#003B95]">{lead.role}</div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 font-medium italic leading-relaxed">
                    "{lead.quote}"
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/80 text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>{lead.company}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 5: HỆ SINH THÁI DOANH NHÂN 1983 (ECOSYSTEM CONSTELLATION)     */}
      {/* ===================================================================== */}
      <section id="ecosystem" className="relative z-10 py-20 sm:py-28 bg-[#F0F6FF]/60 border-t border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitleReveal
            tag="HỆ SINH THÁI DOANH NHÂN 1983"
            title="Cùng Nhau Tạo Ra Giá Trị Lớn Hơn"
            subtitle="200+ DOANH NGHIỆP • 8 KHỐI VỆ TINH • BẢO CHỨNG TÍN DỤNG AA+"
          />

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { title: "Bất Động Sản & Xây Dựng", count: "48 Doanh Nghiệp", icon: <Building2 className="w-5 h-5 text-[#003B95]" /> },
              { title: "Công Nghệ & AI", count: "35 Doanh Nghiệp", icon: <Zap className="w-5 h-5 text-[#D97706]" /> },
              { title: "Tài Chính & Đầu Tư", count: "28 Doanh Nghiệp", icon: <TrendingUp className="w-5 h-5 text-[#003B95]" /> },
              { title: "Sản Xuất & Chế Biến", count: "32 Doanh Nghiệp", icon: <Layers className="w-5 h-5 text-[#D97706]" /> },
              { title: "Thương Mại & Logistics", count: "41 Doanh Nghiệp", icon: <Compass className="w-5 h-5 text-[#003B95]" /> },
              { title: "Y Tế & Chăm Sóc Sức Khỏe", count: "19 Doanh Nghiệp", icon: <Briefcase className="w-5 h-5 text-[#D97706]" /> },
              { title: "Giáo Dục & Đào Tạo", count: "16 Doanh Nghiệp", icon: <GraduationCap className="w-5 h-5 text-[#003B95]" /> },
              { title: "F&B & Khách Sạn Nghỉ Dưỡng", count: "22 Doanh Nghiệp", icon: <Award className="w-5 h-5 text-[#D97706]" /> },
            ].map((sector, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{ y: -4, borderColor: "#F59E0B" }}
                className="p-5 rounded-2xl bg-white border border-blue-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="p-3 w-fit rounded-xl bg-slate-50 border border-slate-100 mb-3">
                  {sector.icon}
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-sm sm:text-base leading-snug">{sector.title}</h4>
                  <div className="text-xs font-mono font-bold text-[#D97706] mt-1">{sector.count}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 6: QUY TRÌNH 4 BƯỚC NHẬN THẺ VIP PASS (PROCESS TIMELINE)       */}
      {/* ===================================================================== */}
      <section id="process" className="relative z-10 py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitleReveal
            tag="QUY TRÌNH XÉT DUYỆT BẢO MẬT"
            title="4 Bước Nhận Thẻ VIP Pass"
            subtitle="Quy trình tuyển chọn nghiêm ngặt nhằm bảo toàn giá trị cốt lõi và sự tin cậy tuyệt đối giữa các thành viên."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {[
              {
                step: "01",
                title: "Nộp Hồ Sơ Online",
                desc: "Đăng ký thông tin doanh nghiệp, doanh thu và định danh C-Level trong 2 phút.",
                badge: "C-LEVEL ONLY",
              },
              {
                step: "02",
                title: "Thẩm Định Đồng Niên",
                desc: "Ban Thư Ký CLB và Hội Doanh Nhân Trẻ Hà Nội bảo chứng thẩm định trong 24 giờ.",
                badge: "1983 QUÝ HỢI",
              },
              {
                step: "03",
                title: "Cấp Thẻ Titanium NFC",
                desc: "Chế tác thẻ kim loại định danh, khắc tên riêng và trao tại kỳ Gala chính thức.",
                badge: "CHIP TITANIUM",
              },
              {
                step: "04",
                title: "Kích Hoạt Deal Kín",
                desc: "Mở khóa phòng giao thương 1:1, chuỗi cung ứng khép kín >5.000 Tỷ VNĐ.",
                badge: ">5.000 TỶ VNĐ",
              },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-xs relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-black font-mono text-[#003B95]">{step.step}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      {step.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 uppercase font-sans mb-2">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">{step.desc}</p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-200 text-[11px] font-bold text-[#D97706] uppercase">
                  BƯỚC {idx + 1} TIẾN TRÌNH
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 7: MASTER CTA BOX (ĐĂNG KÝ GIA NHẬP)                           */}
      {/* ===================================================================== */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-white to-[#F0F6FF]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="p-8 sm:p-14 rounded-3xl bg-gradient-to-br from-[#0A192F] via-[#003B95] to-[#1E293B] text-white shadow-2xl relative overflow-hidden text-center border-2 border-amber-400/50"
          >
            {/* Glowing Auroras */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/20 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/20 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase">
                ĐẶC QUYỀN DOANH NHÂN QUÝ HỢI
              </span>

              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase mt-6 tracking-tight font-sans leading-tight">
                Đừng Để Doanh Nghiệp Của Bạn Đơn Độc Giữa Biển Lớn
              </h2>

              <p className="mt-4 text-sm sm:text-base text-slate-200 font-medium leading-relaxed">
                Gia nhập cộng đồng 200+ C-Level 1983, sở hữu Thẻ Titanium NFC 1-Chạm và mở khóa chuỗi cung ứng
                khép kín ngay hôm nay.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="px-8 py-4 rounded-2xl text-sm sm:text-base font-black text-white bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#D97706] hover:shadow-2xl hover:shadow-amber-500/40 transition-all active:scale-95 cursor-pointer flex items-center gap-2 border border-amber-300"
                >
                  <Crown className="w-5 h-5 text-white" />
                  <span>NỘP HỒ SƠ XÉT DUYỆT VIP NGAY →</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* FOOTER                                                                */}
      {/* ===================================================================== */}
      <footer className="relative z-10 bg-white border-t border-slate-200 py-12 text-slate-600 text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/ceo1983-official-logo.png"
              alt="Logo CEO 1983"
              className="h-9 w-auto object-contain"
            />
            <div>
              <div className="font-bold text-slate-900">CLB Doanh Nhân CEO 1983</div>
              <div className="text-xs text-slate-500">Trực thuộc Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)</div>
            </div>
          </div>

          <div className="text-center sm:text-right text-xs text-slate-500 font-medium">
            © 2026 CLB CEO 1983. Nền tảng kết nối tinh hoa doanh nhân Lợn Vàng 1983.
          </div>
        </div>
      </footer>

      {/* ===================================================================== */}
      {/* MODAL ĐĂNG KÝ XÉT DUYỆT VIP                                           */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-blue-100 overflow-hidden"
            >
              {/* Header Modal */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D97706] font-mono uppercase">
                    <Crown className="w-4 h-4" />
                    ĐĂNG KÝ HỘI VIÊN VIP
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">Gia Nhập CLB CEO 1983</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dành riêng cho Chủ tịch, TGĐ sinh năm 1983 (Quý Hợi)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và Tên *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Lê Hoàng Long"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số điện thoại / Zalo *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0912 345 678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="ceo@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Doanh Nghiệp & Chức Vụ *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Chủ tịch HĐQT - Tập đoàn ABC"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Quy mô Doanh Thu Năm
                    </label>
                    <select
                      value={formData.revenue}
                      onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003B95]"
                    >
                      <option value="Dưới 10 Tỷ VNĐ">Dưới 10 Tỷ VNĐ</option>
                      <option value="10 - 50 Tỷ VNĐ">10 - 50 Tỷ VNĐ</option>
                      <option value="50 - 200 Tỷ VNĐ">50 - 200 Tỷ VNĐ</option>
                      <option value="Trên 200 Tỷ VNĐ">Trên 200 Tỷ VNĐ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lĩnh vực hoạt động
                    </label>
                    <input
                      type="text"
                      placeholder="Bất động sản, Công nghệ..."
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl text-sm font-black text-white bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#D97706] hover:brightness-105 active:scale-98 transition-all shadow-md shadow-amber-500/25 cursor-pointer disabled:opacity-70"
                  >
                    {submitting ? "Đang gửi hồ sơ..." : "GỬI HỒ SƠ XÉT DUYỆT NGAY →"}
                  </button>
                  <p className="text-[11px] text-center text-slate-500 mt-2">
                    Thông tin được bảo mật theo quy chế thẩm định của Hội Doanh Nhân Trẻ Hà Nội.
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* MODAL TRA CỨU TIẾN ĐỘ HỒ SƠ (AUTO POLLING 4S)                         */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {statusModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-7 border border-blue-100 overflow-hidden"
            >
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003B95] font-mono uppercase">
                    <Compass className="w-4 h-4" />
                    TRA CỨU HỒ SƠ HỘI VIÊN
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">Kiểm Tra Tiến Độ Xét Duyệt</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nhập số điện thoại hoặc email quý Anh/Chị đã đăng ký
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStatusModalOpen(false);
                    setAutoPolling(false);
                  }}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCheckStatus} className="mt-5 space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={statusQuery}
                    onChange={(e) => setStatusQuery(e.target.value)}
                    placeholder="Ví dụ: 0912345678 hoặc ceo@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:border-transparent"
                  />
                  {statusQuery && (
                    <button
                      type="button"
                      onClick={() => setStatusQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={checkingStatus}
                  className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[#003B95] to-[#1E40AF] hover:brightness-105 active:scale-98 transition-all shadow-md shadow-blue-900/20 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {checkingStatus ? (
                    <span>Đang kiểm tra dữ liệu...</span>
                  ) : (
                    <>
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Tra cứu tiến độ hồ sơ</span>
                    </>
                  )}
                </button>
              </form>

              {/* Status Result Display */}
              {statusResult && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  {statusResult.found ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600">Trạng thái hồ sơ:</span>
                        {statusResult.status === "approved" || statusResult.isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ĐÃ PHÊ DUYỆT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black">
                            <RotateCw className="w-3 h-3 animate-spin text-amber-600" />
                            ĐANG XÉT DUYỆT
                          </span>
                        )}
                      </div>

                      {statusResult.name && (
                        <div className="text-xs text-slate-700">
                          <strong>Ứng viên:</strong> {statusResult.name}
                        </div>
                      )}
                      {statusResult.company && (
                        <div className="text-xs text-slate-700">
                          <strong>Doanh nghiệp:</strong> {statusResult.company}
                        </div>
                      )}
                      {statusResult.memberCode && (
                        <div className="text-xs text-slate-700">
                          <strong>Mã hội viên:</strong>{" "}
                          <span className="font-mono font-bold text-[#003B95]">
                            {statusResult.memberCode}
                          </span>
                        </div>
                      )}

                      {autoPolling && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#D97706] font-medium pt-1">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                          </span>
                          <span>Hệ thống đang tự động cập nhật tiến độ mỗi 4 giây...</span>
                        </div>
                      )}

                      {statusResult.status === "approved" || statusResult.isApproved ? (
                        <div className="pt-2">
                          <Link
                            to="/association/login"
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                          >
                            <span>Đăng nhập nhận thẻ VIP ngay →</span>
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-center">
                      <p className="text-xs text-rose-700 font-medium">
                        Không tìm thấy hồ sơ với thông tin vừa nhập. Quý Anh/Chị có thể bấm nút dưới đây để nộp hồ sơ mới.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusModalOpen(false);
                          setModalOpen(true);
                        }}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-black text-[#D97706] hover:underline"
                      >
                        + Nộp hồ sơ xét duyệt hội viên mới ngay
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
