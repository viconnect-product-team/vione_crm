import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Play, 
  ShieldCheck, 
  Bot, 
  Layers, 
  Cpu, 
  LineChart, 
  Users, 
  ChevronDown, 
  HelpCircle, 
  Clock, 
  Send, 
  X,
  Zap,
  Building2,
  Workflow
} from "lucide-react";

const SectionDivider: React.FC<{ label?: string }> = ({ label }) => (
  <div className="relative w-full py-4 flex items-center justify-center overflow-hidden bg-white">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#DFB76C]/50 to-transparent" />
      <div 
        className="absolute w-1/3 left-1/3 h-[2px] bg-gradient-to-r from-[#DFB76C] via-[#F5C542] to-[#D4AF37] blur-[2px]"
        style={{ animation: "laserGlow 3.5s ease-in-out infinite" }}
      />
    </div>
    {label && (
      <div className="relative z-10 px-4 py-1 rounded-full bg-white border border-[#DFB76C]/40 shadow-sm text-[10px] font-mono font-bold tracking-widest uppercase text-[#996515]">
        {label}
      </div>
    )}
  </div>
);

export const ViOneLandingWebOfficial: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<string>("Gói Giải Pháp Vione AI");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeHeroCard, setActiveHeroCard] = useState<0 | 1>(0);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    size: "15 - 50 người",
    note: "",
  });

  // 2-second continuous stack alternating animation
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroCard((prev) => (prev === 0 ? 1 : 0));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Text appearance / scroll reveal animation observer
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("vione-revealed");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    const elements = document.querySelectorAll(".vione-reveal");
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleOpenModal = (tier: string) => {
    setSelectedTier(tier);
    setIsSubmitted(false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      tier: selectedTier,
      createdAt: new Date().toISOString(),
    };
    try {
      const stored = JSON.parse(localStorage.getItem("vione_quote_leads") || "[]");
      stored.push(payload);
      localStorage.setItem("vione_quote_leads", JSON.stringify(stored));
    } catch (err) {
      console.error(err);
    }
    setIsSubmitted(true);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-[#DFB76C] selection:text-black">
      <style>{`
        @keyframes laserGlow {
          0%, 100% { opacity: 0.35; transform: scaleX(0.85); }
          50% { opacity: 0.95; transform: scaleX(1.1); }
        }
        .vione-reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }
        .vione-reveal.vione-revealed {
          opacity: 1;
          transform: translateY(0);
        }
        .vione-delay-100 { transition-delay: 100ms; }
        .vione-delay-200 { transition-delay: 200ms; }
        .vione-delay-300 { transition-delay: 300ms; }
        .vione-delay-400 { transition-delay: 400ms; }
        .vione-delay-500 { transition-delay: 500ms; }
      `}</style>

      {/* ================= 1. HEADER / NAVIGATION ================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex justify-between items-center">
          {/* Logo chuẩn vàng đồng ViOne */}
          <a href="#hero" className="flex items-center gap-3 group">
            <img
              src="/vione-wordmark.png"
              alt="ViOne Business Connect"
              className="h-8 sm:h-9 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <span className="px-2.5 py-0.5 bg-[#DFB76C]/15 border border-[#DFB76C]/40 text-[#996515] text-[11px] font-extrabold rounded-full font-mono">
              5.0 AI
            </span>
          </a>

          {/* Nav items */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
            <a href="#hero" className="hover:text-[#996515] transition-colors">Trang chủ</a>
            <a href="#modules" className="hover:text-[#996515] transition-colors">Sản phẩm</a>
            <a href="#ai-copilot" className="hover:text-[#996515] transition-colors">Tính năng AI</a>
            <a href="#workflow" className="hover:text-[#996515] transition-colors">Quy trình</a>
            <a href="#pricing" className="hover:text-[#996515] transition-colors">Bảng giá</a>
            <a href="#faq" className="hover:text-[#996515] transition-colors">FAQ</a>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Link to="/auth" className="px-4 py-2 text-sm font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-all">
              Đăng nhập
            </Link>
            <button 
              onClick={() => handleOpenModal("Gói Dùng Thử Miễn Phí")} 
              className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-bold rounded-xl shadow-lg shadow-zinc-950/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <span>Dùng thử miễn phí</span>
              <span className="text-[#DFB76C]">→</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ================= 2. HERO SECTION WITH 2s ALTERNATING STACK ANIMATION ================= */}
        <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-white via-neutral-50/50 to-white py-16 lg:py-24 border-b border-zinc-200">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#DFB76C]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 flex flex-col items-start gap-6 vione-reveal vione-revealed">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#DFB76C]/15 border border-[#DFB76C]/35 rounded-full text-[#8B6508] text-xs font-bold font-mono tracking-wider uppercase">
                <span className="size-2 rounded-full bg-[#DFB76C] animate-ping" />
                • TRÍ TUỆ NHÂN TẠO THẾ HỆ MỚI
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-outfit text-zinc-950 leading-[1.15] tracking-tight">
                Chạm đỉnh tương lai với{" "}
                <span className="bg-gradient-to-r from-[#DFB76C] via-[#E5A93C] to-[#B8860B] bg-clip-text text-transparent">
                  Vione AI 5.0
                </span>
              </h1>

              <p className="text-zinc-600 text-base sm:text-lg font-normal leading-relaxed max-w-xl">
                Tối ưu hóa quy trình vận hành toàn diện thông qua trợ lý trí tuệ nhân tạo thế hệ mới. Đưa ra quyết định thông minh hơn, nhanh hơn gấp 10 lần bằng một điểm chạm duy nhất.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => handleOpenModal("Trải Nghiệm Ngay")}
                  className="px-7 py-3.5 bg-gradient-to-r from-[#DFB76C] via-[#F5C542] to-[#C29B69] hover:from-[#F5C542] hover:to-[#DFB76C] text-zinc-950 font-extrabold text-base rounded-xl shadow-xl shadow-[#DFB76C]/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2.5"
                >
                  <span>Trải nghiệm ngay</span>
                  <ArrowRight className="size-5" />
                </button>
                <a
                  href="#ai-copilot"
                  className="px-6 py-3.5 bg-white border border-zinc-300 hover:border-zinc-400 text-zinc-800 font-bold text-base rounded-xl hover:bg-zinc-50 transition-all flex items-center gap-2"
                >
                  <Play className="size-4 text-[#996515] fill-[#996515]" />
                  <span>Xem video demo AI</span>
                </a>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-zinc-200/80 w-full max-w-lg">
                <div>
                  <div className="text-2xl font-extrabold font-outfit text-zinc-950">98.4%</div>
                  <div className="text-xs text-zinc-500 font-medium mt-0.5">Độ chính xác AI</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold font-outfit text-zinc-950">10x</div>
                  <div className="text-xs text-zinc-500 font-medium mt-0.5">Tốc độ xử lý tác vụ</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold font-outfit text-zinc-950">24/7</div>
                  <div className="text-xs text-zinc-500 font-medium mt-0.5">Vận hành tự động</div>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Animation Stack alternating every 2s */}
            <div className="lg:col-span-5 relative flex justify-center items-center min-h-[550px]">
              {/* Floating Card: Tương tác đa kênh */}
              <div className="absolute -top-3 -left-6 z-40 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-zinc-200 flex items-center gap-3 animate-bounce max-w-[240px]" style={{ animationDuration: "5s" }}>
                <div className="size-9 bg-[#DFB76C]/20 rounded-xl flex items-center justify-center text-[#8B6508] font-bold">
                  <Bot className="size-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-950 font-outfit">TƯƠNG TÁC ĐA KÊNH</div>
                  <div className="text-[11px] text-zinc-500 leading-tight">Tự động xử lý vận hành hôm nay</div>
                </div>
              </div>

              {/* Card 0: Mobile ViOne Real Screen (Alternates every 2s) */}
              <div 
                className="w-[285px] h-[525px] bg-zinc-950 rounded-[46px] p-2.5 border-[3px] flex flex-col justify-between cursor-pointer"
                style={{
                  position: "absolute",
                  transition: "all 0.75s cubic-bezier(0.34, 1.35, 0.64, 1)",
                  zIndex: activeHeroCard === 0 ? 30 : 10,
                  transform: activeHeroCard === 0 
                    ? "translate(0px, -6px) scale(1.04) rotate(0deg)" 
                    : "translate(48px, 22px) scale(0.91) rotate(3deg)",
                  boxShadow: activeHeroCard === 0 
                    ? "0 25px 50px -12px rgba(212, 175, 55, 0.45), 0 0 0 2px rgba(223, 183, 108, 0.6)" 
                    : "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                  borderColor: activeHeroCard === 0 ? "#DFB76C" : "#3f3f46",
                  filter: activeHeroCard === 0 ? "brightness(1)" : "brightness(0.82)",
                  willChange: "transform, z-index, box-shadow, filter"
                }}
                onClick={() => setActiveHeroCard(0)}
              >
                <div className="relative w-full h-full bg-[#0A0A0B] rounded-[36px] overflow-hidden flex flex-col">
                  {/* Dynamic Island / Notch */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-20 flex items-center justify-end pr-2">
                    <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  {/* Real Mobile App Screenshot */}
                  <img
                    src="/landing_web_vione/vione-mobile-real.png"
                    alt="ViOne Connect Mobile App"
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute("src", "/docs/images/evidence/app_vione_02_home_agenda.png");
                    }}
                  />
                  <div className="absolute bottom-3 inset-x-3 bg-zinc-950/90 backdrop-blur-md p-2.5 rounded-2xl border border-[#DFB76C]/35 text-white flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-[#DFB76C] font-bold">VIONE MOBILE APP</div>
                      <div className="text-xs font-bold font-outfit text-white">Giao Diện Thật 100%</div>
                    </div>
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Card 1: Vione CRM Executive Dashboard Real Screen (Alternates every 2s) */}
              <div 
                className="w-[360px] sm:w-[420px] h-[310px] sm:h-[350px] bg-zinc-950 rounded-3xl p-2.5 border-[3px] flex flex-col justify-between cursor-pointer"
                style={{
                  position: "absolute",
                  transition: "all 0.75s cubic-bezier(0.34, 1.35, 0.64, 1)",
                  zIndex: activeHeroCard === 1 ? 30 : 10,
                  transform: activeHeroCard === 1 
                    ? "translate(0px, -6px) scale(1.04) rotate(0deg)" 
                    : "translate(-50px, 32px) scale(0.91) rotate(-3deg)",
                  boxShadow: activeHeroCard === 1 
                    ? "0 25px 50px -12px rgba(212, 175, 55, 0.45), 0 0 0 2px rgba(223, 183, 108, 0.6)" 
                    : "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                  borderColor: activeHeroCard === 1 ? "#DFB76C" : "#3f3f46",
                  filter: activeHeroCard === 1 ? "brightness(1)" : "brightness(0.82)",
                  willChange: "transform, z-index, box-shadow, filter"
                }}
                onClick={() => setActiveHeroCard(1)}
              >
                <div className="relative w-full h-full bg-[#0A0A0B] rounded-2xl overflow-hidden flex flex-col border border-zinc-800">
                  {/* Browser Window Header */}
                  <div className="h-7 bg-zinc-900 border-b border-zinc-800 px-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="size-2 rounded-full bg-rose-500/80" />
                      <div className="size-2 rounded-full bg-amber-400/80" />
                      <div className="size-2 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[200px]">https://crm.vione.vn/dashboard</span>
                    <span className="text-[9px] font-mono text-[#DFB76C] font-bold">CRM LIVE</span>
                  </div>
                  {/* Real CRM Dashboard Screenshot */}
                  <img
                    src="/landing_web_vione/vione-crm-dashboard-real.png"
                    alt="Bảng Điều Hành Số Tổng Quát ViOne CRM"
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute("src", "/docs/images/evidence/crm_vione_02_dashboard.png");
                    }}
                  />
                  <div className="absolute bottom-3 inset-x-3 bg-zinc-950/90 backdrop-blur-md p-2.5 rounded-2xl border border-[#DFB76C]/35 text-white flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-[#DFB76C] font-bold">VIONE CRM DASHBOARD</div>
                      <div className="text-xs font-bold font-outfit text-white">Bảng Tổng Quát Doanh Nghiệp</div>
                    </div>
                    <div className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold">
                      98.4% KPI
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Card: Bảo mật */}
              <div className="absolute -bottom-4 -right-4 z-40 bg-zinc-950 text-white p-3 rounded-2xl shadow-xl border border-zinc-700 flex items-center gap-3">
                <div className="size-8 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center font-bold">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <div className="text-xs font-bold font-outfit text-white">BẢO MẬT CHUẨN AES-256</div>
                  <div className="text-[10px] text-zinc-400">Vận hành tự động 24/7</div>
                </div>
              </div>

              {/* 2s Cycle Indicator */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md">
                <span className={`h-1.5 rounded-full transition-all duration-500 ${activeHeroCard === 0 ? "w-6 bg-[#DFB76C]" : "w-2 bg-zinc-600"}`} />
                <span className={`h-1.5 rounded-full transition-all duration-500 ${activeHeroCard === 1 ? "w-6 bg-[#DFB76C]" : "w-2 bg-zinc-600"}`} />
                <span className="text-[10px] font-mono font-bold text-[#DFB76C] ml-1">ĐẢO LỚP 2S LIÊN TỤC</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 3. MÔ ĐUN LIÊN KẾT - KIẾN TRÚC HOẠT ĐỘNG HỢP NHẤT ================= */}
        <SectionDivider label="Kiến Trúc Hợp Nhất" />
        <section id="modules" className="py-20 lg:py-28 bg-white border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center max-w-3xl mx-auto mb-16 vione-reveal">
              <div className="text-[#996515] text-xs font-bold font-mono tracking-widest uppercase mb-3">MÔ ĐUN LIÊN KẾT</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit text-zinc-950 tracking-tight">
                Kiến Trúc Hoạt Động Hợp Nhất
              </h2>
              <p className="text-zinc-600 text-base mt-4">
                Kết nối liền mạch các phòng ban trọng yếu trên một nền tảng dữ liệu đồng nhất, xóa bỏ hoàn toàn ốc đảo thông tin.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: CRM */}
              <div className="p-8 bg-neutral-50 hover:bg-white rounded-2xl border border-zinc-200 hover:border-[#DFB76C]/60 hover:shadow-xl transition-all group flex flex-col justify-between vione-reveal vione-delay-100">
                <div>
                  <div className="size-12 bg-[#DFB76C]/15 group-hover:bg-[#DFB76C] text-[#8B6508] group-hover:text-zinc-950 rounded-xl flex items-center justify-center font-bold text-lg transition-colors mb-6 shadow-sm">
                    CRM
                  </div>
                  <h3 className="text-xl font-bold font-outfit text-zinc-950 mb-3">Vione CRM</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    Quản trị quan hệ khách hàng chuyên sâu, tự động hóa phễu bán hàng và tối ưu tỷ lệ chuyển đổi lead thành doanh thu.
                  </p>
                </div>
                <div className="pt-6 border-t border-zinc-200/60 mt-6 flex items-center text-xs font-bold text-[#996515] group-hover:text-[#7A5006]">
                  <span>Khám phá CRM</span>
                  <ArrowRight className="size-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 2: Work */}
              <div className="p-8 bg-neutral-50 hover:bg-white rounded-2xl border border-zinc-200 hover:border-[#DFB76C]/60 hover:shadow-xl transition-all group flex flex-col justify-between vione-reveal vione-delay-200">
                <div>
                  <div className="size-12 bg-[#DFB76C]/15 group-hover:bg-[#DFB76C] text-[#8B6508] group-hover:text-zinc-950 rounded-xl flex items-center justify-center font-bold text-lg transition-colors mb-6 shadow-sm">
                    Work
                  </div>
                  <h3 className="text-xl font-bold font-outfit text-zinc-950 mb-3">Vione Work</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    Quản lý công việc, dự án và cộng tác nhóm không giới hạn không gian và thời gian. Theo dõi tiến độ Gantt chuẩn xác.
                  </p>
                </div>
                <div className="pt-6 border-t border-zinc-200/60 mt-6 flex items-center text-xs font-bold text-[#996515] group-hover:text-[#7A5006]">
                  <span>Khám phá Work</span>
                  <ArrowRight className="size-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 3: Finance */}
              <div className="p-8 bg-neutral-50 hover:bg-white rounded-2xl border border-zinc-200 hover:border-[#DFB76C]/60 hover:shadow-xl transition-all group flex flex-col justify-between vione-reveal vione-delay-300">
                <div>
                  <div className="size-12 bg-[#DFB76C]/15 group-hover:bg-[#DFB76C] text-[#8B6508] group-hover:text-zinc-950 rounded-xl flex items-center justify-center font-bold text-lg transition-colors mb-6 shadow-sm">
                    Fin
                  </div>
                  <h3 className="text-xl font-bold font-outfit text-zinc-950 mb-3">Vione Finance</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    Theo dõi dòng tiền, hoạch định ngân sách chi tiêu và lập báo cáo tài chính thời gian thực, tích hợp VietQR thông minh.
                  </p>
                </div>
                <div className="pt-6 border-t border-zinc-200/60 mt-6 flex items-center text-xs font-bold text-[#996515] group-hover:text-[#7A5006]">
                  <span>Khám phá Finance</span>
                  <ArrowRight className="size-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 4: HRM */}
              <div className="p-8 bg-neutral-50 hover:bg-white rounded-2xl border border-zinc-200 hover:border-[#DFB76C]/60 hover:shadow-xl transition-all group flex flex-col justify-between vione-reveal vione-delay-400">
                <div>
                  <div className="size-12 bg-[#DFB76C]/15 group-hover:bg-[#DFB76C] text-[#8B6508] group-hover:text-zinc-950 rounded-xl flex items-center justify-center font-bold text-lg transition-colors mb-6 shadow-sm">
                    HRM
                  </div>
                  <h3 className="text-xl font-bold font-outfit text-zinc-950 mb-3">Vione HRM</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    Quản lý nhân sự toàn diện từ tuyển dụng, hợp đồng, chấm công định vị GPS đến tính lương và đánh giá hiệu suất KPI tự động.
                  </p>
                </div>
                <div className="pt-6 border-t border-zinc-200/60 mt-6 flex items-center text-xs font-bold text-[#996515] group-hover:text-[#7A5006]">
                  <span>Khám phá HRM</span>
                  <ArrowRight className="size-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 4. AI WORKFLOW COPILOT ================= */}
        <SectionDivider label="Trợ Lý Trí Tuệ Nhân Tạo" />
        <section id="ai-copilot" className="py-20 lg:py-28 bg-neutral-50 border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 flex flex-col items-start gap-5 vione-reveal">
              <div className="text-[#996515] text-xs font-bold font-mono tracking-widest uppercase">AI WORKFLOW COPILOT</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit text-zinc-950 tracking-tight leading-tight">
                Trợ Lý Thiết Lập Quy Trình Thông Minh
              </h2>
              <p className="text-zinc-600 text-base leading-relaxed">
                AI tự động phân tích dữ liệu hiệu suất phòng ban để phát hiện điểm nghẽn và chủ động gợi ý các luồng tự động hóa tối ưu, giúp vận hành doanh nghiệp mượt mà.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-zinc-800 font-medium">
                  <span className="size-5 rounded-full bg-[#DFB76C] text-zinc-950 flex items-center justify-center text-xs font-bold">✓</span>
                  Tự động hóa phân loại email, tin nhắn khách hàng 24/7
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-800 font-medium">
                  <span className="size-5 rounded-full bg-[#DFB76C] text-zinc-950 flex items-center justify-center text-xs font-bold">✓</span>
                  Phát hiện và cảnh báo sai lệch dòng tiền, nợ quá hạn
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-800 font-medium">
                  <span className="size-5 rounded-full bg-[#DFB76C] text-zinc-950 flex items-center justify-center text-xs font-bold">✓</span>
                  Kích hoạt workflow đa phòng ban theo điều kiện logic
                </div>
              </div>
              <button
                onClick={() => handleOpenModal("Tìm Hiểu AI Workflow")}
                className="mt-4 px-6 py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <span>Khám phá trợ lý AI</span>
                <ArrowRight className="size-4" />
              </button>
            </div>

            <div className="lg:col-span-6 vione-reveal vione-delay-200">
              <div className="relative rounded-3xl overflow-hidden border-2 border-[#DFB76C]/60 shadow-2xl shadow-[#DFB76C]/15 bg-zinc-950 group">
                {/* AI Talking Demo Video - Video có con AI nói chuyện */}
                <video
                  src="/landing_web_vione/video_vione_ai_copilot.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  className="w-full h-auto max-h-[460px] object-cover rounded-3xl"
                />
                {/* Floating Top Badge */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950/85 backdrop-blur-md border border-[#DFB76C]/40 text-white shadow-lg pointer-events-none">
                  <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-[#DFB76C] tracking-wide">
                    VIONE AI COPILOT ĐÀM THOẠI TRỰC TIẾP
                  </span>
                </div>
                {/* Bottom Bar Info */}
                <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-between px-3.5 py-2 rounded-2xl bg-zinc-950/90 backdrop-blur-md border border-zinc-800 text-white pointer-events-none">
                  <div>
                    <div className="text-xs font-bold font-outfit text-white">Trợ Lý Ảo ViOne Thông Minh</div>
                    <div className="text-[10px] text-zinc-400 font-mono">Nhận diện giọng nói & Hỗ trợ vận hành 24/7</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-[#DFB76C]/20 text-[#DFB76C] text-[10px] font-mono font-bold">
                    HD LIVE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 5. GIÁM SÁT HOẠT ĐỘNG ================= */}
        <SectionDivider label="Bảng Điều Hành Số" />
        <section className="py-20 lg:py-28 bg-white border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col items-center">
            <div className="text-center max-w-3xl mb-12 vione-reveal">
              <div className="text-[#996515] text-xs font-bold font-mono tracking-widest uppercase mb-3">GIÁM SÁT HOẠT ĐỘNG</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit text-zinc-950 tracking-tight">
                Kiểm Soát Vận Hành Tổng Thể
              </h2>
              <p className="text-zinc-600 text-base mt-4">
                Bảng điều hành thời gian thực phản ánh sức khỏe toàn diện của doanh nghiệp qua biểu đồ và chỉ số KPI trực quan.
              </p>
            </div>

            <div className="w-full rounded-2xl lg:rounded-3xl overflow-hidden border-2 border-zinc-200 shadow-2xl bg-white vione-reveal vione-delay-200">
              <img
                src="/landing_web_vione/operational-dashboard.png"
                alt="Kiểm Soát Vận Hành Tổng Thể Vione"
                className="w-full h-auto object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute("src", "/landing_web_vione/workflow-automation.png");
                }}
              />
            </div>
          </div>
        </section>

        {/* ================= 6. 3 BƯỚC THIẾT LẬP ================= */}
        <SectionDivider label="3 Bước Tự Động Hóa" />
        <section id="workflow" className="py-20 lg:py-28 bg-neutral-50 border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center max-w-3xl mx-auto mb-16 vione-reveal">
              <div className="text-[#996515] text-xs font-bold font-mono tracking-widest uppercase mb-3">3 BƯỚC THIẾT LẬP</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit text-zinc-950 tracking-tight">
                Xây Dựng Quy Trình Tự Động Trong 5 Phút
              </h2>
              <p className="text-zinc-600 text-base mt-4">
                Không cần viết code. Thiết lập quy trình làm việc tự động với giao diện kéo thả trực quan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between vione-reveal vione-delay-100 hover:-translate-y-1">
                <div>
                  <div className="text-[#DFB76C] text-5xl font-extrabold font-outfit mb-4">01</div>
                  <h3 className="text-xl font-bold font-outfit text-zinc-950 mb-3">Lựa Chọn Trình Kích Hoạt</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    Chọn sự kiện bắt đầu như: Khách hàng mới, Hóa đơn quá hạn, Yêu cầu tạm ứng hay Đăng ký nghỉ phép được gửi lên.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-100 text-xs font-mono font-bold text-zinc-400">BƯỚC KHỞI TẠO</div>
              </div>

              <div className="p-8 bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between vione-reveal vione-delay-200 hover:-translate-y-1">
                <div>
                  <div className="text-[#DFB76C] text-5xl font-extrabold font-outfit mb-4">02</div>
                  <h3 className="text-xl font-bold font-outfit text-zinc-950 mb-3">Kết Nối Các Hành Động</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    Thêm các hành động tiếp theo giữa các bộ phận để dữ liệu tự động đồng bộ liên thông, gửi thông báo phê duyệt tức thì.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-100 text-xs font-mono font-bold text-zinc-400">BƯỚC LIÊN THÔNG</div>
              </div>

              <div className="p-8 bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between vione-reveal vione-delay-300 hover:-translate-y-1">
                <div>
                  <div className="text-[#DFB76C] text-5xl font-extrabold font-outfit mb-4">03</div>
                  <h3 className="text-xl font-bold font-outfit text-zinc-950 mb-3">Kích Hoạt & Giám Sát</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    Để AI tự động hóa vận hành 24/7, theo dõi tiến độ công việc theo thời gian thực và cảnh báo các điểm nghẽn trước khi xảy ra sự cố.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-100 text-xs font-mono font-bold text-zinc-400">BƯỚC VẬN HÀNH</div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 7. GIÁ TRỊ DOANH NGHIỆP ================= */}
        <SectionDivider label="Lợi Ích Vượt Trội" />
        <section className="py-20 lg:py-28 bg-white border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center max-w-3xl mx-auto mb-16 vione-reveal">
              <div className="text-[#996515] text-xs font-bold font-mono tracking-widest uppercase mb-3">GIÁ TRỊ DOANH NGHIỆP</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit text-zinc-950 tracking-tight">
                Vì Sao Chọn Nền Tảng Vione?
              </h2>
              <p className="text-zinc-600 text-base mt-4">
                Đột phá hiệu suất tổ chức nhờ công nghệ tự động hóa hợp nhất chuẩn quốc tế.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 bg-neutral-50 rounded-2xl border border-zinc-200 vione-reveal vione-delay-100 hover:shadow-md hover:-translate-y-1 transition-all">
                <div className="size-12 bg-[#DFB76C]/20 text-[#8B6508] rounded-xl flex items-center justify-center font-bold text-xl mb-6">
                  360°
                </div>
                <h3 className="text-xl font-bold font-outfit text-zinc-950 mb-3">Quản lý tập trung 360°</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Toàn bộ dữ liệu khách hàng, dự án, doanh thu và nhân sự được đồng bộ trên một nền tảng duy nhất, loại bỏ hoàn toàn phân mảnh thông tin.
                </p>
              </div>

              <div className="p-8 bg-neutral-50 rounded-2xl border border-zinc-200 vione-reveal vione-delay-200 hover:shadow-md hover:-translate-y-1 transition-all">
                <div className="size-12 bg-[#DFB76C]/20 text-[#8B6508] rounded-xl flex items-center justify-center font-bold text-xl mb-6">
                  <LineChart className="size-6 text-[#996515]" />
                </div>
                <h3 className="text-xl font-bold font-outfit text-zinc-950 mb-3">Quyết định dựa trên dữ liệu</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Hệ thống báo cáo thông minh thời gian thực giúp ban lãnh đạo ra quyết định điều hành chính xác gấp 10 lần dựa trên dữ liệu định lượng.
                </p>
              </div>

              <div className="p-8 bg-neutral-50 rounded-2xl border border-zinc-200 vione-reveal vione-delay-300 hover:shadow-md hover:-translate-y-1 transition-all">
                <div className="size-12 bg-[#DFB76C]/20 text-[#8B6508] rounded-xl flex items-center justify-center font-bold text-xl mb-6">
                  <Zap className="size-6 text-[#996515]" />
                </div>
                <h3 className="text-xl font-bold font-outfit text-zinc-950 mb-3">Tiết kiệm 40% thời gian</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Tự động hóa triệt để các tác vụ hành chính lặp đi lặp lại giúp đội ngũ tập trung 100% vào việc sáng tạo và gia tăng giá trị kinh doanh.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 8. PHÙ HỢP NHIỀU MÔ HÌNH ================= */}
        <SectionDivider label="Mọi Mô Hình Hoạt Động" />
        <section className="py-20 lg:py-28 bg-neutral-50 border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1 vione-reveal vione-delay-200">
              <div className="rounded-3xl overflow-hidden border-2 border-zinc-200 shadow-2xl bg-white hover:scale-[1.01] transition-transform">
                <img
                  src="/landing_web_vione/business-laptop.png"
                  alt="Giải Pháp Cho Mọi Ngành Nghề Vione"
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute("src", "/landing_web_vione/operational-dashboard.png");
                  }}
                />
              </div>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col items-start gap-5 vione-reveal">
              <div className="text-[#996515] text-xs font-bold font-mono tracking-widest uppercase">PHÙ HỢP NHIỀU MÔ HÌNH</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit text-zinc-950 tracking-tight leading-tight">
                Giải Pháp Cho Mọi Ngành Nghề
              </h2>
              <p className="text-zinc-600 text-base leading-relaxed">
                Dù doanh nghiệp của bạn hoạt động trong lĩnh vực Thương mại, Dịch vụ, Công nghệ hay Sản xuất, Vione đều đáp ứng linh hoạt với kiến trúc module mở rộng.
              </p>
              <div className="space-y-4 pt-2">
                <div className="p-4 bg-white rounded-xl border border-zinc-200 text-sm text-zinc-700 shadow-sm">
                  <span className="font-bold text-zinc-950 block mb-1">• Doanh nghiệp Công nghệ & Dịch vụ:</span>
                  Quản lý dự án Agile mượt mà, kết nối dữ liệu từ phễu chuyển đổi sang báo cáo tài chính dự báo.
                </div>
                <div className="p-4 bg-white rounded-xl border border-zinc-200 text-sm text-zinc-700 shadow-sm">
                  <span className="font-bold text-zinc-950 block mb-1">• Doanh nghiệp Chuỗi & Bán lẻ:</span>
                  Quản lý tập trung chi nhánh, kiểm soát dòng tiền chi tiết và tự động tính KPI nhân viên.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 9. KHÁCH HÀNG THÀNH CÔNG ================= */}
        <SectionDivider label="Niềm Tin Khách Hàng" />
        <section className="py-20 lg:py-24 bg-white border-b border-zinc-200">
          <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center gap-8 vione-reveal">
            <div className="text-[#996515] text-xs font-bold font-mono tracking-widest uppercase">KHÁCH HÀNG THÀNH CÔNG</div>
            <blockquote className="text-2xl sm:text-3xl font-extrabold font-outfit text-zinc-950 leading-snug">
              &ldquo;Từ khi áp dụng Vione, toàn bộ báo cáo tài chính và tiến độ dự án của 5 chi nhánh được tôi kiểm soát trực tiếp theo thời gian thực ngay trên điện thoại.&rdquo;
            </blockquote>
            <div className="flex items-center gap-4 vione-reveal vione-delay-200">
              <img
                src="/landing_web_vione/avatar-ceo.png"
                alt="Ông Nguyễn Minh Đăng"
                className="size-14 rounded-full border-2 border-[#DFB76C] shadow-md object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute("src", "/landing_web_vione/professional-portrait.png");
                }}
              />
              <div className="text-left">
                <div className="text-zinc-950 text-base font-bold font-outfit">Ông Nguyễn Minh Đăng</div>
                <div className="text-zinc-500 text-xs font-medium font-mono">CEO, Alpha Group</div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 10. BẢNG GIÁ DỊCH VỤ - DOANH NGHIỆP TÙY BIẾN ================= */}
        <SectionDivider label="Gói Dịch Vụ Đầu Tư" />
        <section id="pricing" className="py-20 lg:py-28 bg-neutral-50 border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center max-w-3xl mx-auto mb-16 vione-reveal">
              <div className="text-[#996515] text-xs font-bold font-mono tracking-widest uppercase mb-3">BẢNG GIÁ DỊCH VỤ</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit text-zinc-950 tracking-tight">
                Gói Giải Pháp Linh Hoạt Cho Mọi Quy Mô
              </h2>
              <p className="text-zinc-600 text-base mt-4">
                Thiết kế chi phí theo đúng quy mô và lộ trình chuyển đổi số của doanh nghiệp. Liên hệ ngay để nhận báo giá chi tiết và chương trình ưu đãi độc quyền.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              {/* Gói 1: Startup */}
              <div className="p-8 lg:p-10 bg-white rounded-3xl border border-zinc-200 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between vione-reveal vione-delay-100">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold font-mono text-zinc-500 uppercase tracking-wider">GÓI KHỞI NGHIỆP</span>
                    <span className="px-3 py-1 bg-zinc-100 text-zinc-700 text-xs font-bold rounded-full">Startup</span>
                  </div>
                  <h3 className="text-2xl font-bold font-outfit text-zinc-950 mb-2">Khởi nghiệp (Startup)</h3>
                  <p className="text-zinc-600 text-sm mb-6">Phù hợp cho các nhóm nhỏ muốn số hóa quy trình cơ bản ban đầu.</p>

                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 mb-6">
                    <div className="text-xs text-zinc-500 font-medium">Chi phí đầu tư:</div>
                    <div className="text-2xl font-extrabold font-outfit text-zinc-950 mt-1">Báo Giá Theo Quy Mô</div>
                    <div className="text-xs text-[#996515] font-semibold mt-1">Tối ưu cho đội ngũ dưới 15 người</div>
                  </div>

                  <div className="space-y-3 text-sm text-zinc-700">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-[#DFB76C] shrink-0" />
                      <span>Tối đa 15 thành viên truy cập</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-[#DFB76C] shrink-0" />
                      <span>Đầy đủ module Vione Work & Tasks</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-[#DFB76C] shrink-0" />
                      <span>Dung lượng lưu trữ 10GB đám mây</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-[#DFB76C] shrink-0" />
                      <span>Hỗ trợ kỹ thuật qua Email & Ticket</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenModal("Gói Khởi Nghiệp (Startup)")}
                  className="mt-8 w-full py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-sm rounded-xl transition-all flex justify-center items-center gap-2"
                >
                  <span>Liên hệ nhận báo giá</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>

              {/* Gói 2: Growth */}
              <div className="p-8 lg:p-10 bg-zinc-950 text-white rounded-3xl border-2 border-[#DFB76C] shadow-2xl relative flex flex-col justify-between transform lg:-translate-y-2 vione-reveal vione-delay-200">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#DFB76C] via-[#F5C542] to-[#D4AF37] text-zinc-950 text-xs font-black uppercase rounded-full shadow-md font-mono">
                  ★ PHỔ BIẾN NHẤT
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4 mt-2">
                    <span className="text-sm font-bold font-mono text-[#DFB76C] uppercase tracking-wider">GÓI TĂNG TRƯỞNG</span>
                    <span className="px-3 py-1 bg-[#DFB76C]/20 text-[#DFB76C] text-xs font-bold rounded-full font-mono">Growth</span>
                  </div>
                  <h3 className="text-2xl font-bold font-outfit text-white mb-2">Tăng trưởng (Growth)</h3>
                  <p className="text-zinc-400 text-sm mb-6">Giải pháp toàn diện cho doanh nghiệp đang bứt phá mạnh mẽ.</p>

                  <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 mb-6">
                    <div className="text-xs text-zinc-400 font-medium">Chi phí đầu tư:</div>
                    <div className="text-2xl font-extrabold font-outfit text-[#DFB76C] mt-1">Tư Vấn 1-1 Chuyên Sâu</div>
                    <div className="text-xs text-zinc-300 font-semibold mt-1">Kèm gói tài trợ đào tạo onboarding</div>
                  </div>

                  <div className="space-y-3 text-sm text-zinc-300">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-[#DFB76C] shrink-0" />
                      <span>Không giới hạn thành viên tham gia</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-[#DFB76C] shrink-0" />
                      <span>Trọn bộ 4 module: CRM, Work, Fin, HRM</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-[#DFB76C] shrink-0" />
                      <span>Trợ lý AI Workflow Copilot thế hệ mới</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-[#DFB76C] shrink-0" />
                      <span>Dung lượng lưu trữ 100GB tốc độ cao</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-[#DFB76C] shrink-0" />
                      <span>Hỗ trợ chuyên gia 24/7 qua Hotline VIP</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenModal("Gói Tăng Trưởng (Growth)")}
                  className="mt-8 w-full py-3.5 bg-gradient-to-r from-[#DFB76C] via-[#F5C542] to-[#C29B69] hover:from-[#F5C542] hover:to-[#DFB76C] text-zinc-950 font-extrabold text-sm rounded-xl transition-all shadow-xl shadow-[#DFB76C]/25 flex justify-center items-center gap-2"
                >
                  <span>Nhận tư vấn & Báo giá ngay</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>

              {/* Gói 3: Enterprise */}
              <div className="p-8 lg:p-10 bg-white rounded-3xl border border-zinc-200 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between vione-reveal vione-delay-300">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold font-mono text-zinc-500 uppercase tracking-wider">DOANH NGHIỆP LỚN</span>
                    <span className="px-3 py-1 bg-zinc-100 text-zinc-700 text-xs font-bold rounded-full font-mono">Custom</span>
                  </div>
                  <h3 className="text-2xl font-bold font-outfit text-zinc-950 mb-2">Doanh nghiệp (Enterprise)</h3>
                  <p className="text-zinc-600 text-sm mb-6">Thiết kế riêng cho các tập đoàn lớn cần tùy biến sâu quy trình.</p>

                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 mb-6">
                    <div className="text-xs text-zinc-500 font-medium">Chi phí đầu tư:</div>
                    <div className="text-2xl font-extrabold font-outfit text-zinc-950 mt-1">Tùy Biến Theo Yêu Cầu</div>
                    <div className="text-xs text-[#996515] font-semibold mt-1">Khảo sát & Báo giá theo giải pháp</div>
                  </div>

                  <div className="space-y-3 text-sm text-zinc-700">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-[#DFB76C] shrink-0" />
                      <span>Hạ tầng máy chủ riêng biệt (On-Prem / Cloud)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-[#DFB76C] shrink-0" />
                      <span>AI Copilot huấn luyện riêng theo dữ liệu nội bộ</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-[#DFB76C] shrink-0" />
                      <span>Bảo mật nâng cao, xác thực SSO, MFA</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-[#DFB76C] shrink-0" />
                      <span>Tích hợp trực tiếp hệ thống SAP, Oracle ERP</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-[#DFB76C] shrink-0" />
                      <span>Kỹ sư trưởng bảo trợ vận hành tại chỗ</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenModal("Gói Doanh Nghiệp (Enterprise)")}
                  className="mt-8 w-full py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-sm rounded-xl transition-all flex justify-center items-center gap-2"
                >
                  <span>Liên hệ chuyên gia Enterprise</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 11. HỎI ĐÁP THƯỜNG GẶP (FAQ) ================= */}
        <SectionDivider label="Giải Đáp Thắc Mắc" />
        <section id="faq" className="py-20 lg:py-28 bg-white border-b border-zinc-200">
          <div className="max-w-4xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-16 vione-reveal">
              <div className="text-[#996515] text-xs font-bold font-mono tracking-widest uppercase mb-3">HỎI ĐÁP THƯỜNG GẶP</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit text-zinc-950 tracking-tight">
                Câu Hỏi Thường Gặp
              </h2>
              <p className="text-zinc-600 text-base mt-4">
                Giải đáp các thắc mắc phổ biến về triển khai và bảo mật hệ thống Vione.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "Vione có thể tích hợp với các hệ thống hiện tại của doanh nghiệp không?",
                  a: "Hoàn toàn được. Vione cung cấp chuẩn kết nối RESTful API và Webhook mở, cho phép đồng bộ dữ liệu hai chiều với các hệ thống ERP hàng đầu (như SAP, Oracle, Bravo), phần mềm kế toán (MISA, FAST) và các cổng thanh toán ngân hàng trực tuyến.",
                },
                {
                  q: "Dữ liệu trên Vione được bảo mật như thế nào?",
                  a: "Toàn bộ dữ liệu của doanh nghiệp được mã hóa chuẩn quân sự AES-256 ở trạng thái lưu trữ và giao thức TLS 1.3 khi truyền tải. Hệ thống hỗ trợ xác thực đa yếu tố (MFA), phân quyền chi tiết Role-Based Access Control (RBAC) và lưu vết audit log 100% mọi thao tác.",
                },
                {
                  q: "Chúng tôi có được dùng thử phần mềm trước khi mua không?",
                  a: "Có. Vione cung cấp chương trình dùng thử 14 ngày miễn phí với đầy đủ tính năng của cả 4 phân hệ (CRM, Work, Finance, HRM) và trợ lý AI Copilot. Đội ngũ chuyên gia của chúng tôi sẽ hướng dẫn thiết lập luồng vận hành ban đầu cho doanh nghiệp của bạn.",
                },
              ].map((item, idx) => (
                <div key={idx} className="border border-zinc-200 rounded-2xl overflow-hidden vione-reveal hover:border-[#DFB76C]/60 transition-colors">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-6 text-left font-bold font-outfit text-lg text-zinc-950 flex justify-between items-center bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
                  >
                    <span>{item.q}</span>
                    <span className={`text-xl font-mono transition-transform ${openFaq === idx ? "text-[#996515]" : "text-zinc-400"}`}>
                      {openFaq === idx ? "−" : "+"}
                    </span>
                  </button>
                  {openFaq === idx && (
                    <div className="p-6 text-zinc-600 text-sm leading-relaxed border-t border-zinc-100 bg-white">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= 12. BANNER CTA ================= */}
        <SectionDivider label="Bắt Đầu Ngay" />
        <section className="py-20 lg:py-24 bg-zinc-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-radial from-[#DFB76C]/20 via-transparent to-transparent opacity-30 pointer-events-none" />
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10 vione-reveal">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-outfit text-white tracking-tight mb-6">
              Bắt đầu kỷ nguyên quản trị tự động cùng Vione
            </h2>
            <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-8">
              Tham gia cùng hàng nghìn doanh nghiệp Việt đang số hóa và bứt phá ngoạn mục bằng hệ thống điều hành Vione AI 5.0.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 vione-reveal vione-delay-200">
              <button
                onClick={() => handleOpenModal("CTA Cuối Trang")}
                className="px-8 py-4 bg-gradient-to-r from-[#DFB76C] via-[#F5C542] to-[#C29B69] hover:from-[#F5C542] hover:to-[#DFB76C] text-zinc-950 font-extrabold text-base rounded-2xl shadow-xl shadow-[#DFB76C]/30 hover:scale-105 active:scale-95 transition-all"
              >
                Đăng ký dùng thử miễn phí
              </button>
              <Link
                to="/auth"
                className="px-8 py-4 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-white font-bold text-base rounded-2xl transition-all"
              >
                Đăng nhập hệ thống
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ================= 13. FOOTER ================= */}
      <footer className="bg-zinc-950 text-zinc-400 border-t border-zinc-800/80 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <img
                src="/vione-wordmark.png"
                alt="ViOne"
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed mb-4">
              Nền tảng quản trị và tự động hóa vận hành doanh nghiệp toàn diện bằng Trí tuệ Nhân tạo thế hệ mới.
            </p>
            <div className="text-xs text-zinc-600">
              © 2026 Vione. Bảo lưu mọi quyền.
            </div>
          </div>

          <div>
            <div className="text-white text-sm font-bold font-outfit uppercase tracking-wider mb-4">Sản Phẩm</div>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li><a href="#modules" className="hover:text-[#DFB76C] transition-colors">Vione CRM</a></li>
              <li><a href="#modules" className="hover:text-[#DFB76C] transition-colors">Vione Work</a></li>
              <li><a href="#modules" className="hover:text-[#DFB76C] transition-colors">Vione Finance</a></li>
              <li><a href="#modules" className="hover:text-[#DFB76C] transition-colors">Vione HRM</a></li>
              <li><a href="#ai-copilot" className="hover:text-[#DFB76C] transition-colors">AI Workflow Copilot</a></li>
            </ul>
          </div>

          <div>
            <div className="text-white text-sm font-bold font-outfit uppercase tracking-wider mb-4">Tài Nguyên</div>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li><a href="#pricing" className="hover:text-[#DFB76C] transition-colors">Bảng giá dịch vụ</a></li>
              <li><a href="#faq" className="hover:text-[#DFB76C] transition-colors">Câu hỏi thường gặp</a></li>
              <li><Link to="/auth" className="hover:text-[#DFB76C] transition-colors">Cổng Quản Trị CRM</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-white text-sm font-bold font-outfit uppercase tracking-wider mb-4">Liên Hệ</div>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li>Hotline: <span className="text-white font-semibold">1900 1234</span> (24/7)</li>
              <li>Email: <span className="text-white font-semibold">contact@vione.vn</span></li>
              <li>Văn phòng: Tầng 12, Tòa nhà Công Nghệ ViOne, Hà Nội</li>
              <li className="pt-2">
                <span className="inline-block px-2.5 py-1 bg-[#DFB76C]/10 border border-[#DFB76C]/30 rounded-md text-[#DFB76C] text-[11px]">
                  Thời gian hỗ trợ: 8:00 - 22:00
                </span>
              </li>
            </ul>
          </div>
        </div>
      </footer>

      {/* ================= 14. MODAL BÁO GIÁ DOANH NGHIỆP ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-[#DFB76C]/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition-colors"
            >
              <X className="size-6" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <img
                src="/vione-wordmark.png"
                alt="ViOne"
                className="h-9 w-auto object-contain"
              />
              <div className="pl-3 border-l border-zinc-700">
                <h3 className="text-lg font-bold font-outfit text-white">Yêu Cầu Báo Giá & Tư Vấn 1-1</h3>
                <p className="text-xs text-[#DFB76C] font-mono">{selectedTier}</p>
              </div>
            </div>

            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Họ và tên đại diện *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 focus:border-[#DFB76C] rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#DFB76C]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Số điện thoại *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0901 234 567"
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 focus:border-[#DFB76C] rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#DFB76C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Email doanh nghiệp *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ceo@company.com"
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 focus:border-[#DFB76C] rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#DFB76C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Tên công ty / Doanh nghiệp</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Tập đoàn Alpha"
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 focus:border-[#DFB76C] rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#DFB76C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Quy mô nhân sự</label>
                    <select
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 focus:border-[#DFB76C] rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#DFB76C]"
                    >
                      <option value="Dưới 15 người">Dưới 15 người</option>
                      <option value="15 - 50 người">15 - 50 người</option>
                      <option value="50 - 200 người">50 - 200 người</option>
                      <option value="Trên 200 người">Trên 200 người (Tập đoàn)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Nhu cầu tính năng / Lời nhắn</label>
                  <textarea
                    rows={2}
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Tôi muốn tư vấn tích hợp AI CRM và quản lý tài chính..."
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 focus:border-[#DFB76C] rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#DFB76C]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-[#DFB76C] via-[#F5C542] to-[#C29B69] hover:from-[#F5C542] hover:to-[#DFB76C] text-zinc-950 font-extrabold text-sm rounded-xl shadow-xl shadow-[#DFB76C]/25 transition-all"
                >
                  Gửi Yêu Cầu Nhận Báo Giá Ngay
                </button>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="size-16 bg-[#DFB76C]/20 text-[#DFB76C] rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-[#DFB76C]/40">
                  ✓
                </div>
                <h4 className="text-xl font-bold font-outfit text-white mb-2">Gửi Yêu Cầu Thành Công!</h4>
                <p className="text-sm text-zinc-300">
                  Chuyên viên tư vấn ViOne sẽ liên hệ qua điện thoại/email trong vòng 15 phút để gửi bảng báo giá tùy biến.
                </p>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="mt-6 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Đóng cửa sổ
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
