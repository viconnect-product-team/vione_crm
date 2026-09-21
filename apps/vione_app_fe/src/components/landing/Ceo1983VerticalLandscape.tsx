import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  Send, 
  ChevronDown, 
  Mail, 
  Phone, 
  Building2, 
  User, 
  Briefcase,
  ShieldCheck,
  Award,
  ArrowRight,
  Globe,
  Users,
  Compass,
  Star,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { submitClubApplication } from "@/lib/club-application.functions";

/** 6 Scene Steps for Continuous Vertical Journey */
const SCENE_STEPS = [
  { id: "sky", num: "01", label: "Tầm Nhìn", title: "Khởi Nguyên Bầu Trời" },
  { id: "birds", num: "02", label: "Đồng Hành", title: "Đàn Chim 1983 Bay Cao" },
  { id: "kites", num: "03", label: "Khát Vọng", title: "Cánh Diều Vươn Xa" },
  { id: "villas", num: "04", label: "Thịnh Vượng", title: "Quần Thể Doanh Nghiệp" },
  { id: "water", num: "05", label: "Dòng Chảy", title: "Mặt Nước Vô Cực" },
  { id: "leadership", num: "06", label: "Bản Lĩnh", title: "Đại Dương Sâu Thẳm" },
];

export function Ceo1983VerticalLandscape() {
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [regModalOpen, setRegModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State with Industry field
  const [form, setForm] = useState({
    fullName: "",
    company: "",
    phone: "",
    email: "",
    title: "Chủ tịch / Tổng Giám Đốc",
    industry: "",
  });

  // Track global scroll
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      const totalDocHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalDocHeight > 0 ? Math.min(1, Math.max(0, current / totalDocHeight)) : 0;
      
      setScrollY(current);
      setScrollProgress(progress);

      // Determine active scene based on continuous percentage
      if (progress < 0.16) setActiveStepIndex(0);
      else if (progress < 0.33) setActiveStepIndex(1);
      else if (progress < 0.50) setActiveStepIndex(2);
      else if (progress < 0.68) setActiveStepIndex(3);
      else if (progress < 0.84) setActiveStepIndex(4);
      else setActiveStepIndex(5);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToStep = (index: number) => {
    const totalDocHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetY = (index / (SCENE_STEPS.length - 1)) * totalDocHeight;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.company.trim() || !form.phone.trim() || !form.industry.trim()) {
      toast.error("Vui lòng điền đầy đủ họ tên, doanh nghiệp, số điện thoại và lĩnh vực hoạt động.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await submitClubApplication({
        data: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          company: form.company.trim(),
          title: form.title.trim() || "Chủ tịch / Tổng Giám Đốc",
          industry: form.industry.trim(),
          clubSlug: "ceo-1983",
        },
      });

      if (res?.ok) {
        // Đóng popup luôn theo yêu cầu
        setRegModalOpen(false);
        const registeredEmail = form.email.trim() || form.phone.trim();
        setForm({
          fullName: "",
          company: "",
          phone: "",
          email: "",
          title: "Chủ tịch / Tổng Giám Đốc",
          industry: "",
        });
        toast.success("Gửi hồ sơ đăng ký thành công!", {
          description: `Tài khoản đã được khởi tạo (${registeredEmail}). Mật khẩu bảo mật ngẫu nhiên đã được gửi vào Email của bạn. Vui lòng kiểm tra email để đăng nhập vào App Hiệp Hội.`,
          duration: 8000,
        });
      } else {
        toast.error(res?.message || "Gửi hồ sơ thất bại, vui lòng kiểm tra lại thông tin.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Không thể kết nối đến máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative w-full overflow-x-hidden font-sans bg-white text-slate-900 select-none">
      <style>{`
        @keyframes subtleDrift {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-8px) scale(1.01); }
        }
        @keyframes auraGlow {
          0%, 100% { opacity: 0.3; filter: drop-shadow(0 0 20px rgba(245, 158, 11, 0.3)); }
          50% { opacity: 0.6; filter: drop-shadow(0 0 40px rgba(245, 158, 11, 0.5)); }
        }
      `}</style>

      {/* ── TOP NAVIGATION BAR (CỐ ĐỊNH, SÁNG & SẮC NÉT) ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3.5 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-3">
          <img 
            src="/ceo1983-official-logo.png" 
            alt="CLB Doanh Nhân CEO 1983" 
            className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm"
          />
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-black tracking-wider uppercase text-[#003B95]">
              CLB Doanh Nhân CEO 1983
            </span>
            <span className="text-[10px] font-semibold tracking-wide text-slate-500">
              Trực thuộc Hội Doanh nghiệp Trẻ Hà Nội (HanoiBA)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-4">
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/80">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Mạng Lưới Quý Hợi 1983</span>
          </div>

          <Link
            to="/association/login"
            className="text-xs font-bold px-4 py-2 rounded-full text-slate-700 hover:text-[#003B95] hover:bg-sky-50 transition border border-transparent hover:border-sky-200"
          >
            Đăng Nhập
          </Link>

          <button
            onClick={() => setRegModalOpen(true)}
            className="text-xs font-black px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 shadow-md shadow-amber-400/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            ✦ Đăng Ký Hội Viên
          </button>
        </div>
      </header>

      {/* ── FLOATING SCENE NAVIGATOR (RIGHT DOCK) ── */}
      <nav 
        aria-label="Scene Navigator"
        className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-end gap-2 pointer-events-auto"
      >
        <div className="flex flex-col items-center gap-2.5 py-3.5 px-2.5 rounded-full bg-white/90 backdrop-blur-2xl border border-slate-200/90 shadow-xl text-slate-800">
          {SCENE_STEPS.map((step, idx) => {
            const isActive = activeStepIndex === idx;
            return (
              <button
                key={step.id}
                onClick={() => scrollToStep(idx)}
                className="group relative flex items-center justify-center p-1.5 focus:outline-none cursor-pointer"
                title={`${step.num} — ${step.title}`}
              >
                {/* Floating tooltip on hover */}
                <div className="absolute right-9 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 shadow-xl border bg-white text-slate-900 border-slate-200">
                  <span className="text-amber-500 font-bold mr-1">{step.num}</span>
                  {step.title}
                </div>

                {/* Dot */}
                <div
                  className={`rounded-full transition-all duration-300 ${
                    isActive
                      ? "w-3.5 h-3.5 bg-amber-400 ring-4 ring-amber-400/30 scale-125 shadow-md shadow-amber-400/80"
                      : "w-2 h-2 bg-slate-300 group-hover:bg-[#003B95]"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </nav>

      {/* =====================================================================================
          SECTION 01: KHỞI NGUYÊN BẦU TRỜI (SKY & VISION)
          - Tone màu sáng, nền trắng chủ đạo, phối xanh và vàng kim đan xen
      ===================================================================================== */}
      <section className="relative min-h-[95vh] flex flex-col justify-between overflow-hidden pt-28 pb-16 bg-white">
        {/* Daylight Skyline Background with Crisp Illustration Effect */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000 opacity-30"
          style={{
            backgroundImage: "url('/ceo1983_hero_daylight_skyline.jpg')",
          }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/80 via-white/95 to-[#F0F7FF]" />

        {/* Golden Sun & Blue Ambient Aura */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[450px] h-[250px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Content Box with High-Contrast Typography */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center my-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 bg-blue-50 border border-blue-200 text-[#003B95] shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Thế Hệ Doanh Nhân Quý Hợi 1983 · HanoiBA</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.12] mb-6 text-slate-950">
            BẢN LĨNH TIÊN PHONG <br />
            <span className="bg-gradient-to-r from-[#003B95] via-[#0284C7] to-amber-500 bg-clip-text text-transparent">
              VƯƠN TẦM THỊNH VƯỢNG
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl font-semibold max-w-3xl mx-auto leading-relaxed mb-8 text-slate-700">
            Hành trình kết nối cộng đồng doanh nhân và lãnh đạo doanh nghiệp tuổi 1983 ưu tú. 
            Cùng nhau sẻ chia giá trị, cộng hưởng cơ hội kinh doanh và kiến tạo di sản bền vững cho cộng đồng.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setRegModalOpen(true)}
              className="px-8 py-3.5 rounded-full font-black text-sm tracking-wide bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 shadow-xl shadow-amber-400/30 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <Star className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>Gia Nhập CLB CEO 1983</span>
            </button>
            <button
              onClick={() => scrollToStep(1)}
              className="flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-xs tracking-wider border-2 border-[#003B95]/30 bg-white/90 text-[#003B95] hover:bg-sky-50 hover:border-[#003B95] transition cursor-pointer shadow-sm"
            >
              <span>Khám Phá Hành Trình</span>
              <ChevronDown className="w-4 h-4 text-amber-500 animate-bounce" />
            </button>
          </div>
        </div>

        {/* ── ORGANIC SVG WAVE DIVIDER (UỐN LƯỢN ĐỘC ĐÁO CHUYỂN TIẾP SANG SECTION 02) ── */}
        <div className="relative z-10 w-full overflow-hidden leading-none mt-auto">
          <svg viewBox="0 0 1440 120" fill="none" className="w-full h-16 sm:h-24 md:h-28 preserve-3d">
            <path
              d="M0,32L48,42.7C96,53,192,75,288,80C384,85,480,75,576,58.7C672,43,768,21,864,21.3C960,21,1056,43,1152,53.3C1248,64,1344,64,1392,64L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
              fill="#E0F2FE"
              fillOpacity="0.5"
            />
            <path
              d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
              fill="#F0F7FF"
              fillOpacity="1"
            />
          </svg>
        </div>
      </section>

      {/* =====================================================================================
          SECTION 02: ĐÀN CHIM 1983 (BIRDS & TOGETHERNESS)
          - Tone màu sáng #F0F7FF, thẻ card bo hữu cơ sắc nét
      ===================================================================================== */}
      <section className="relative py-20 px-6 bg-[#F0F7FF]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-black tracking-widest uppercase px-4 py-1.5 rounded-full border bg-white text-[#003B95] border-blue-200 shadow-sm">
              Trụ Cột 01 · Gắn Kết & Sức Mạnh Bầy Đàn
            </span>
            <h2 className="text-3xl sm:text-5xl font-black mt-4 mb-4 text-slate-950">
              ĐÀN CHIM 1983 — BAY CAO & BẢN LĨNH
            </h2>
            <p className="text-sm sm:text-base font-semibold leading-relaxed text-slate-700">
              Muốn đi nhanh hãy đi một mình, muốn đi xa hãy đi cùng nhau. Tại CLB CEO 1983, mỗi doanh nhân là một cánh chim đầu đàn kiên định, sẻ chia luồng gió thị trường để cùng nhau vượt ngàn dặm giông bão.
            </p>
          </div>

          {/* Asymmetrical Curved Organic Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: "Cộng Đồng Doanh Nhân CEO 1983",
                desc: "Mạng lưới lãnh đạo tuổi 1983 phủ khắp các lĩnh vực then chốt: sản xuất, bất động sản, logistics, công nghệ, tài chính.",
              },
              {
                icon: ShieldCheck,
                title: "Vị Thế Trực Thuộc HanoiBA",
                desc: "Hưởng trọn nguồn lực kết nối kinh doanh, giao thương cấp bộ ngành và tổ chức xúc tiến thương mại quốc tế.",
              },
              {
                icon: Award,
                title: "Chia Sẻ Tri Thức Đỉnh Cao",
                desc: "Các buổi Mastermind chuyên sâu, giải quyết bài toán quản trị thực chiến từ các chủ tịch và chuyên gia đầu ngành.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-8 transition-all duration-300 hover:-translate-y-1.5 border border-slate-200/90 shadow-xl shadow-blue-900/5 bg-white text-slate-900 hover:border-amber-400 hover:shadow-2xl hover:shadow-amber-500/10 rounded-[28px_14px_28px_14px]"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-400 flex items-center justify-center text-slate-950 font-bold mb-5 shadow-md shadow-amber-400/30">
                  <item.icon className="w-6 h-6 text-slate-950" />
                </div>
                <h3 className="text-xl font-black mb-2 text-slate-950">{item.title}</h3>
                <p className="text-sm font-medium leading-relaxed text-slate-600">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── ORGANIC SVG WAVE DIVIDER NỐI SANG SECTION 03 (WHITE) ── */}
        <div className="w-full overflow-hidden leading-none mt-16 -mb-20">
          <svg viewBox="0 0 1440 120" fill="none" className="w-full h-16 sm:h-24 preserve-3d">
            <path
              d="M0,40 C320,100 420,0 720,50 C1020,100 1120,10 1440,60 L1440,120 L0,120 Z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      </section>

      {/* =====================================================================================
          SECTION 03: CÁNH DIỀU KHÁT VỌNG (KITES & AMBITION)
          - Nền trắng tinh khôi, hình ảnh hoạt họa công nghệ rõ nét
      ===================================================================================== */}
      <section className="relative pt-28 pb-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="w-full lg:w-1/2">
            <span className="text-xs font-black tracking-widest uppercase px-4 py-1.5 rounded-full border bg-blue-50 text-[#003B95] border-blue-200">
              Trụ Cột 02 · Khát Vọng & Đổi Mới Sáng Tạo
            </span>
            <h2 className="text-3xl sm:text-5xl font-black mt-4 mb-5 leading-tight text-slate-950">
              NHỮNG CÁNH DIỀU <br />
              <span className="bg-gradient-to-r from-[#003B95] via-[#0284C7] to-amber-500 bg-clip-text text-transparent">
                ĐÓN GIÓ VƯƠN XA
              </span>
            </h2>
            <p className="text-base font-semibold leading-relaxed mb-6 text-slate-700">
              Gió càng ngược, diều càng bay cao. Đối với thế hệ lãnh đạo 1983, thách thức kinh tế và sự biến chuyển công nghệ chính là bệ phóng hoàn hảo để tái cơ cấu mô hình, vươn tầm khẳng định vị thế.
            </p>

            <ul className="space-y-3.5 mb-8 text-sm">
              {[
                "Chuyển đổi số toàn diện mô hình vận hành và kinh doanh B2B.",
                "Thúc đẩy đổi mới sáng tạo, ứng dụng giải pháp công nghệ tiên phong.",
                "Hỗ trợ các dự án mở rộng thị trường và liên minh đầu tư chiến lược.",
              ].map((point, i) => (
                <li key={i} className="flex items-center gap-3 font-semibold text-slate-800">
                  <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-amber-600 font-bold" />
                  </div>
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => setRegModalOpen(true)}
              className="px-7 py-3 rounded-full font-bold text-xs tracking-wider bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 shadow-lg shadow-amber-400/25 hover:scale-105 transition-all cursor-pointer"
            >
              ✦ Đăng Ký Tham Gia Diễn Đàn
            </button>
          </div>

          <div className="w-full lg:w-1/2">
            <div className="p-3 border-2 border-slate-200/80 shadow-2xl relative overflow-hidden bg-white rounded-[28px_14px_28px_14px]">
              <img 
                src="/landing/sunny_breeze_innovation_hub.jpg" 
                alt="Khát vọng đổi mới sáng tạo CEO 1983" 
                className="w-full h-80 sm:h-96 object-cover rounded-[22px_10px_22px_10px]"
              />
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 text-slate-900 shadow-lg">
                <p className="font-black text-[#003B95] text-xs uppercase tracking-wider">Tầm Nhìn 2026 - 2030</p>
                <p className="text-slate-700 text-xs font-semibold mt-0.5">Xây dựng liên minh 1.000 doanh nghiệp tăng trưởng bứt phá bền vững.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── ORGANIC SVG WAVE DIVIDER NỐI SANG SECTION 04 (#F8FAFC) ── */}
        <div className="w-full overflow-hidden leading-none mt-20 -mb-20">
          <svg viewBox="0 0 1440 120" fill="none" className="w-full h-16 sm:h-24 preserve-3d">
            <path
              d="M0,60 C360,0 480,100 840,40 C1200,-20 1320,80 1440,30 L1440,120 L0,120 Z"
              fill="#F8FAFC"
            />
          </svg>
        </div>
      </section>

      {/* =====================================================================================
          SECTION 04: QUẦN THỂ THỊNH VƯỢNG (VILLAS & ECOSYSTEM)
          - Khung bo hữu cơ hiện đại, giao diện trắng & xanh dương đậm
      ===================================================================================== */}
      <section className="relative pt-28 pb-20 px-6 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-black tracking-widest uppercase px-4 py-1.5 rounded-full border bg-white text-[#003B95] border-blue-200 shadow-sm">
              Trụ Cột 03 · Quần Thể Giao Thương Thịnh Vượng
            </span>
            <h2 className="text-3xl sm:text-5xl font-black mt-4 mb-4 text-slate-950">
              HỆ SINH THÁI DOANH NGHIỆP TOÀN DIỆN
            </h2>
            <p className="text-base font-semibold leading-relaxed text-slate-700">
              Kết nối chuỗi cung ứng thực chiến, xúc tiến hợp tác liên ngành và bảo trợ thương mại cho các hội viên.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 sm:p-10 border border-slate-200/90 shadow-xl shadow-slate-200/50 bg-white text-slate-900 rounded-[32px_16px_32px_16px] hover:border-[#003B95]/40 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-400 text-slate-950 font-bold flex items-center justify-center mb-5 shadow-md shadow-amber-400/30">
                <Building2 className="w-6 h-6 text-slate-950" />
              </div>
              <h3 className="text-2xl font-black mb-3 text-slate-950">Xúc Tiến Thương Mại B2B Nội Bộ</h3>
              <p className="text-sm font-medium leading-relaxed mb-6 text-slate-600">
                Ưu tiên sử dụng sản phẩm và dịch vụ của các doanh nghiệp hội viên với cơ chế ưu đãi đặc quyền, tối ưu chi phí và tăng trưởng doanh thu vượt bậc.
              </p>
              <div className="flex items-center gap-2 text-sm font-black text-[#003B95] hover:text-amber-600 transition">
                <span>Khám phá danh bạ giao thương</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <div className="p-8 sm:p-10 border border-slate-200/90 shadow-xl shadow-slate-200/50 bg-white text-slate-900 rounded-[16px_32px_16px_32px] hover:border-[#003B95]/40 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#003B95] to-[#0284C7] text-white font-bold flex items-center justify-center mb-5 shadow-md shadow-blue-900/20">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black mb-3 text-slate-950">Quỹ Hợp Tác Đầu Tư & Bảo Trợ</h3>
              <p className="text-sm font-medium leading-relaxed mb-6 text-slate-600">
                Tập hợp nguồn lực vốn thông minh, liên kết đầu tư dự án bất động sản công nghiệp, sản xuất và các thương vụ M&A quy mô lớn.
              </p>
              <div className="flex items-center gap-2 text-sm font-black text-[#003B95] hover:text-amber-600 transition">
                <span>Tham gia liên minh đầu tư</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* ── ORGANIC SVG WAVE DIVIDER NỐI SANG SECTION 05 (WHITE) ── */}
        <div className="w-full overflow-hidden leading-none mt-20 -mb-20">
          <svg viewBox="0 0 1440 120" fill="none" className="w-full h-16 sm:h-24 preserve-3d">
            <path
              d="M0,30 C300,90 500,10 800,60 C1100,110 1300,20 1440,50 L1440,120 L0,120 Z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      </section>

      {/* =====================================================================================
          SECTION 05 & 06: MẶT NƯỚC VÔ CỰC & BẢN LĨNH ĐẠI DƯƠNG (LEADERSHIP)
          - Tinh thần lãnh đạo kiên cường, chữ số sắc nét, độ tương phản cao
      ===================================================================================== */}
      <section className="relative pt-28 pb-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs font-black tracking-widest uppercase px-4 py-1.5 rounded-full border bg-blue-50 text-[#003B95] border-blue-200">
            Trụ Cột 04 · Bản Lĩnh Đáy Đại Dương
          </span>
          <h2 className="text-3xl sm:text-5xl font-black mt-4 mb-6 leading-tight text-slate-950">
            BẢN LĨNH LÃNH ĐẠO <br />
            <span className="bg-gradient-to-r from-[#003B95] via-[#0284C7] to-amber-500 bg-clip-text text-transparent">
              VƯỢT NGÀN TRÙNG SÓNG GIÓ
            </span>
          </h2>
          <p className="text-base font-semibold leading-relaxed max-w-3xl mx-auto mb-10 text-slate-700">
            Ở tầng nước sâu thẳm nhất, áp lực lớn nhất lại chính là nơi kết tinh những viên kim cương sáng nhất. 
            Thế hệ CEO 1983 trui rèn bản lĩnh để vững vàng lèo lái con thuyền doanh nghiệp vươn ra biển lớn.
          </p>

          <div className="p-8 sm:p-12 border-2 border-slate-200 shadow-2xl max-w-4xl mx-auto mb-12 bg-gradient-to-br from-white to-[#F0F7FF] rounded-[32px]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-4xl sm:text-5xl font-black text-amber-500">100%</p>
                <p className="text-xs font-bold mt-1 text-slate-800">Doanh nhân tuổi 1983</p>
              </div>
              <div>
                <p className="text-4xl sm:text-5xl font-black text-amber-500">2023</p>
                <p className="text-xs font-bold mt-1 text-slate-800">Năm thành lập</p>
              </div>
              <div>
                <p className="text-4xl sm:text-5xl font-black text-amber-500">100%</p>
                <p className="text-xs font-bold mt-1 text-slate-800">Hội viên xác thực KYC</p>
              </div>
              <div>
                <p className="text-4xl sm:text-5xl font-black text-[#003B95]">HanoiBA</p>
                <p className="text-xs font-bold mt-1 text-slate-800">Tổ chức trực thuộc</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setRegModalOpen(true)}
            className="px-10 py-4 rounded-full font-black text-sm tracking-wider bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 shadow-2xl shadow-amber-400/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            ✦ ĐĂNG KÝ GIA NHẬP CLB CEO 1983 NGAY
          </button>
        </div>
      </section>

      {/* ── FOOTER ĐỒNG BỘ (SÁNG SỦA, RÕ RÀNG) ── */}
      <footer className="py-12 px-6 border-t border-slate-200 bg-slate-50 text-slate-700">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
          <div className="flex items-center gap-3">
            <img src="/ceo1983-official-logo.png" alt="Logo" className="h-10 w-auto object-contain" />
            <div>
              <p className="font-bold text-slate-900 text-sm">CLB Doanh Nhân CEO 1983 — HanoiBA</p>
              <p className="text-xs text-slate-500">Hệ sinh thái kết nối & chuyển đổi số doanh nghiệp</p>
            </div>
          </div>
          <div className="flex items-center gap-5 font-semibold">
            <Link to="/association" className="hover:text-[#003B95] transition">App Hiệp Hội</Link>
            <Link to="/association/login" className="hover:text-[#003B95] transition">Đăng Nhập</Link>
            <button 
              onClick={() => setRegModalOpen(true)} 
              className="text-amber-600 font-bold hover:underline cursor-pointer"
            >
              Gia Nhập CLB
            </button>
          </div>
        </div>
      </footer>

      {/* =====================================================================================
          REGISTRATION MODAL (POPUP ĐĂNG KÝ HỘI VIÊN)
          - Có trường Lĩnh Vực Hoạt Động
          - Bấm gửi đóng popup luôn, toast thông báo mật khẩu mặc định 123456
      ===================================================================================== */}
      {regModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl bg-white text-slate-900 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setRegModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
                  ✦ Hồ Sơ Gia Nhập CLB CEO 1983
                </span>
                <h3 className="text-2xl font-black text-slate-950">Gia Nhập CLB CEO 1983</h3>
                <p className="text-xs font-medium text-slate-600 mt-1">
                  Trở thành hội viên chính thức trong mạng lưới doanh nhân tuổi 1983 (HanoiBA).
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Họ và Tên Doanh Nhân *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="VD: Nguyễn Văn Hưng"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs focus:border-[#003B95] focus:bg-white focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Doanh Nghiệp *</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Tên công ty..."
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs focus:border-[#003B95] focus:bg-white focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Chức Vụ</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Chủ tịch / CEO"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs focus:border-[#003B95] focus:bg-white focus:outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Số Điện Thoại *</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="0912 345 678"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs focus:border-[#003B95] focus:bg-white focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Email Nhận Mật Khẩu *</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="ceo@company.vn"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs focus:border-[#003B95] focus:bg-white focus:outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                {/* TRƯỜNG LĨNH VỰC HOẠT ĐỘNG */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Lĩnh Vực Hoạt Động *</label>
                  <div className="relative">
                    <Compass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="VD: Bất động sản, Sản xuất, Công nghệ, Thương mại..."
                      value={form.industry}
                      onChange={(e) => setForm({ ...form, industry: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs focus:border-[#003B95] focus:bg-white focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200/80 text-blue-900 text-[11.5px] flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-[#003B95] shrink-0 mt-0.5" />
                  <span>
                    Hệ thống sẽ cấp tài khoản và gửi chuỗi mật khẩu bảo mật ngẫu nhiên trực tiếp vào hòm thư Email của Anh/Chị.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-3.5 rounded-xl font-black text-xs tracking-wide bg-gradient-to-r from-[#003B95] via-[#004dc7] to-[#003B95] text-white shadow-lg shadow-blue-900/30 hover:shadow-blue-600/40 hover:brightness-110 active:scale-98 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <span>Đang xử lý cấp tài khoản...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Gửi Hồ Sơ & Nhận Mật Khẩu Qua Email</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ceo1983VerticalLandscape;
