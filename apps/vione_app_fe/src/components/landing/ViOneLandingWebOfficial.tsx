import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Zap,
  Users,
  Building2,
  Phone,
  Mail,
  ChevronDown,
  Sparkles,
  BarChart3,
  Layers,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export function ViOneLandingWebOfficial() {
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    company: "",
    phone: "",
    email: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const handleTrialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim()) {
      toast.error("Vui lòng điền họ tên và số điện thoại.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      try {
        const leads = JSON.parse(localStorage.getItem("vione_trial_leads") || "[]");
        leads.unshift({ ...form, createdAt: new Date().toISOString() });
        localStorage.setItem("vione_trial_leads", JSON.stringify(leads));
      } catch {}
      toast.success("Đăng ký dùng thử thành công! Chuyên viên ViOne sẽ liên hệ kích hoạt tài khoản trong ít phút.");
      setForm({ fullName: "", company: "", phone: "", email: "" });
      setSubmitting(false);
      setTrialModalOpen(false);
    }, 600);
  };

  const scrollToPricing = () => {
    const el = document.getElementById("pricing-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto min-h-screen bg-white flex flex-col justify-start items-start font-sans selection:bg-yellow-500 selection:text-zinc-950">
      {/* ── 1. HEADER CHUẨN FIGMA VIONE ── */}
      <header className="self-stretch px-6 sm:px-12 lg:px-20 py-5 bg-white border-b border-zinc-200 flex justify-between items-center sticky top-0 z-50 shadow-2xs">
        <div className="flex justify-start items-center gap-2.5">
          <div className="size-8 bg-yellow-500 rounded-lg flex justify-center items-center shadow-xs">
            <span className="text-zinc-950 text-xl font-extrabold font-['Outfit']">V</span>
          </div>
          <span className="text-zinc-950 text-2xl font-extrabold font-['Outfit'] tracking-tight">Vione</span>
        </div>

        <nav className="hidden lg:flex justify-start items-center gap-8">
          <a href="#home" className="text-zinc-600 text-sm font-medium font-['Inter'] hover:text-zinc-950 transition">Trang chủ</a>
          <a href="#modules" className="text-zinc-600 text-sm font-medium font-['Inter'] hover:text-zinc-950 transition">Sản phẩm</a>
          <a href="#ai-features" className="text-zinc-600 text-sm font-medium font-['Inter'] hover:text-zinc-950 transition">Tính năng AI</a>
          <a href="#pricing-section" className="text-zinc-600 text-sm font-medium font-['Inter'] hover:text-zinc-950 transition">Bảng giá</a>
          <a href="#faq" className="text-zinc-600 text-sm font-medium font-['Inter'] hover:text-zinc-950 transition">FAQ</a>
        </nav>

        <div className="flex justify-start items-center gap-4">
          <Link
            to="/login"
            className="text-zinc-950 text-sm font-semibold font-['Inter'] hover:underline"
          >
            Đăng nhập
          </Link>
          <button
            type="button"
            onClick={() => setTrialModalOpen(true)}
            className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 rounded-md flex justify-center items-center text-zinc-950 text-sm font-semibold font-['Inter'] shadow-sm transition active:scale-95 cursor-pointer"
          >
            Dùng thử miễn phí
          </button>
        </div>
      </header>

      {/* ── 2. HERO SECTION VIONE ── */}
      <section id="home" className="self-stretch px-6 sm:px-12 lg:px-20 py-16 sm:py-24 bg-neutral-50 flex flex-col justify-start items-center gap-12 border-b border-zinc-200">
        <div className="self-stretch min-h-[640px] lg:h-[720px] px-4 sm:px-10 lg:px-20 bg-[radial-gradient(at_75%_45%,rgba(234,179,8,0.08),transparent_80%)] flex flex-col lg:flex-row justify-start items-center gap-10 overflow-hidden">
          {/* Hero Left Content */}
          <div className="w-full lg:w-[620px] flex flex-col justify-start items-start gap-6">
            <div className="px-3 py-1.5 bg-orange-100/80 rounded-full border border-amber-200 inline-flex justify-start items-center gap-2">
              <div className="size-2 bg-yellow-500 rounded-full animate-ping" />
              <div className="text-amber-700 text-xs font-bold font-['Inter'] uppercase tracking-wider">
                CREATIVE AUTOMATION PLATFORM
              </div>
            </div>

            <h1 className="self-stretch text-gray-900 text-4xl sm:text-5xl lg:text-[54px] font-extrabold font-['Inter'] leading-[1.15]">
              Nhân rộng tầm ảnh hưởng cùng Creator AI 5.0
            </h1>

            <p className="self-stretch text-slate-500 text-base font-normal font-['Inter'] leading-relaxed">
              Đột phá quy trình sáng tạo và tối ưu hóa chuyển đổi lượng người theo dõi thành doanh thu ổn định thông qua trợ lý ảo đa năng thế hệ mới.
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setTrialModalOpen(true)}
                className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 rounded-lg flex justify-start items-center gap-2 text-zinc-950 text-base font-bold font-['Inter'] shadow-md transition active:scale-95 cursor-pointer"
              >
                <span>Trải nghiệm sáng tạo</span>
                <ArrowRight className="size-4 text-zinc-950" />
              </button>

              <button
                type="button"
                onClick={scrollToPricing}
                className="px-8 py-4 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 flex justify-start items-start text-gray-900 text-base font-bold font-['Inter'] transition cursor-pointer"
              >
                Xem bảng giá Creator
              </button>
            </div>
          </div>

          {/* Hero Right: 3D Phone & Metrics Showcase */}
          <div className="flex-1 w-full relative min-h-[480px] lg:h-[560px] flex justify-center items-center">
            {/* Ambient Gold Glow */}
            <div className="size-56 left-[180px] top-[100px] absolute opacity-30 bg-yellow-500 rounded-full blur-[40px] pointer-events-none" />

            {/* Background Image / Portrait */}
            <img
              className="w-56 sm:w-64 h-[420px] left-[20px] sm:left-[30px] top-[40px] absolute rounded-3xl border border-slate-200 object-cover shadow-lg hidden sm:block"
              src="/landing_web_vione/SaaS_Portrait.png"
              alt="Creator AI"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80";
              }}
            />

            {/* Floating Card 1: Tương tác đa kênh */}
            <div className="w-52 p-3.5 left-[20px] sm:left-[220px] top-[30px] absolute bg-white rounded-2xl shadow-[0px_8px_20px_0px_rgba(0,0,0,0.08)] border border-yellow-500 flex flex-col justify-start items-start gap-1 z-30">
              <span className="text-amber-700 text-xs font-bold font-['Inter'] uppercase">TƯƠNG TÁC ĐA KÊNH</span>
              <span className="text-gray-900 text-xs font-semibold font-['Inter']">Trả lời tự động 5,400 tin nhắn fan hôm nay.</span>
            </div>

            {/* Floating Card 2: Xu thế mới */}
            <div className="w-48 p-3 left-[10px] sm:left-[60px] bottom-[30px] absolute bg-white rounded-xl border border-slate-200 flex flex-col justify-start items-start gap-1 z-30 shadow-md">
              <div className="inline-flex justify-start items-center gap-1.5">
                <div className="size-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-amber-700 text-xs font-bold font-['Inter'] uppercase">XU THẾ MỚI</span>
              </div>
              <span className="text-slate-600 text-xs font-medium font-['Inter']">Tối ưu phễu người hâm mộ</span>
            </div>

            {/* Centered Phone UI with Dynamic Island */}
            <div className="relative z-20 w-72 sm:w-80 h-[520px] p-3 bg-white rounded-[38px] shadow-[0px_16px_36px_0px_rgba(234,179,8,0.22)] border-[3px] border-yellow-500 flex flex-col justify-start items-start gap-2 overflow-hidden">
              {/* Phone Status Bar */}
              <div className="self-stretch px-3 py-1 flex justify-between items-center text-xs font-semibold text-gray-900">
                <span>09:41</span>
                <div className="w-16 h-4 bg-black rounded-full" />
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span>5G</span>
                  <div className="w-4 h-2 border border-black rounded-xs p-0.5">
                    <div className="h-full w-full bg-black rounded-2xs" />
                  </div>
                </div>
              </div>

              {/* App Header Inside Phone */}
              <div className="self-stretch px-2 flex justify-between items-center pb-1">
                <div className="flex items-center gap-1.5">
                  <div className="size-5 bg-yellow-500 rounded-xs flex justify-center items-center text-zinc-950 font-black text-[10px]">V</div>
                  <span className="text-gray-900 text-xs font-bold font-['Inter']">VIONE LIVE</span>
                </div>
                <div className="size-6 bg-slate-100 rounded-lg flex justify-center items-center">
                  <Sparkles className="size-3 text-yellow-600" />
                </div>
              </div>

              {/* Metrics Inside Phone */}
              <div className="self-stretch flex-1 flex flex-col justify-start items-start gap-3 overflow-hidden">
                <div className="self-stretch p-3.5 bg-orange-50 rounded-2xl border border-amber-200 flex flex-col justify-start items-start gap-1">
                  <div className="text-amber-700 text-[10px] font-semibold font-['Inter'] uppercase">TƯƠNG TÁC HÔM NAY</div>
                  <div className="text-amber-950 text-2xl font-black font-['Inter']">92.4k</div>
                  <div className="text-emerald-600 text-[10px] font-bold font-['Inter']">+15.8% so với chu kỳ trước</div>
                </div>

                <div className="self-stretch px-1 flex justify-between items-center">
                  <span className="text-gray-900 text-xs font-bold font-['Inter']">PHÂN TÍCH CONTENT</span>
                  <span className="text-yellow-600 text-[10px] font-bold font-['Inter']">Đang tối ưu</span>
                </div>

                {/* AI Tasks Progress */}
                <div className="self-stretch flex flex-col justify-start items-start gap-2">
                  <div className="self-stretch p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col justify-start items-start gap-1.5">
                    <div className="self-stretch flex justify-between items-center text-[10px] font-semibold text-gray-900">
                      <span>Tác vụ AI #1024 (Tạo kịch bản)</span>
                      <span className="text-yellow-600 font-bold">80%</span>
                    </div>
                    <div className="self-stretch h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[80%] h-full bg-yellow-500 rounded-full" />
                    </div>
                  </div>

                  <div className="self-stretch p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col justify-start items-start gap-1.5">
                    <div className="self-stretch flex justify-between items-center text-[10px] font-semibold text-gray-900">
                      <span>Tác vụ AI #1025 (Chuyển đổi lead)</span>
                      <span className="text-yellow-600 font-bold">55%</span>
                    </div>
                    <div className="self-stretch h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[55%] h-full bg-yellow-500 rounded-full" />
                    </div>
                  </div>

                  <div className="self-stretch p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col justify-start items-start gap-1.5">
                    <div className="self-stretch flex justify-between items-center text-[10px] font-semibold text-gray-900">
                      <span>Tác vụ AI #1026 (Đồng bộ CRM)</span>
                      <span className="text-yellow-600 font-bold">40%</span>
                    </div>
                    <div className="self-stretch h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[40%] h-full bg-yellow-500 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Home Indicator */}
              <div className="self-stretch pb-1 flex justify-center">
                <div className="w-28 h-1 bg-gray-900 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. MÔ ĐUN LIÊN KẾT (KIẾN TRÚC HOẠT ĐỘNG HỢP NHẤT) ── */}
      <section id="modules" className="self-stretch px-6 sm:px-12 lg:px-20 py-20 bg-white flex flex-col justify-start items-start gap-12 border-b border-zinc-200">
        <div className="flex flex-col justify-start items-start gap-3">
          <div className="text-yellow-600 text-sm font-bold font-mono tracking-widest uppercase">MÔ ĐUN LIÊN KẾT</div>
          <div className="text-zinc-950 text-3xl sm:text-4xl font-extrabold font-['Outfit']">
            Kiến Trúc Hoạt Động Hợp Nhất
          </div>
        </div>

        <div className="self-stretch grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-7 bg-neutral-50 rounded-2xl border border-zinc-200 flex flex-col justify-start items-start gap-5 hover:border-yellow-500/60 hover:shadow-md transition">
            <div className="size-12 bg-yellow-100 rounded-xl flex justify-center items-center text-zinc-950 text-sm font-extrabold font-['Outfit']">
              CRM
            </div>
            <div className="flex-1 flex flex-col justify-start items-start gap-2">
              <div className="text-zinc-950 text-xl font-bold font-['Outfit']">Vione CRM</div>
              <div className="text-zinc-600 text-sm font-normal font-['Inter'] leading-relaxed">
                Quản trị quan hệ khách hàng chuyên sâu, tự động hóa phễu bán hàng và tối ưu tỷ lệ chuyển đổi.
              </div>
            </div>
          </div>

          <div className="p-7 bg-neutral-50 rounded-2xl border border-zinc-200 flex flex-col justify-start items-start gap-5 hover:border-yellow-500/60 hover:shadow-md transition">
            <div className="size-12 bg-yellow-100 rounded-xl flex justify-center items-center text-zinc-950 text-sm font-extrabold font-['Outfit']">
              Work
            </div>
            <div className="flex-1 flex flex-col justify-start items-start gap-2">
              <div className="text-zinc-950 text-xl font-bold font-['Outfit']">Vione Work</div>
              <div className="text-zinc-600 text-sm font-normal font-['Inter'] leading-relaxed">
                Quản lý công việc, dự án và cộng tác nhóm không giới hạn không gian và thời gian.
              </div>
            </div>
          </div>

          <div className="p-7 bg-neutral-50 rounded-2xl border border-zinc-200 flex flex-col justify-start items-start gap-5 hover:border-yellow-500/60 hover:shadow-md transition">
            <div className="size-12 bg-yellow-100 rounded-xl flex justify-center items-center text-zinc-950 text-sm font-extrabold font-['Outfit']">
              F
            </div>
            <div className="flex-1 flex flex-col justify-start items-start gap-2">
              <div className="text-zinc-950 text-xl font-bold font-['Outfit']">Vione Finance</div>
              <div className="text-zinc-600 text-sm font-normal font-['Inter'] leading-relaxed">
                Theo dõi dòng tiền, hoạch định ngân sách và lập báo cáo tài chính thời gian thực.
              </div>
            </div>
          </div>

          <div className="p-7 bg-neutral-50 rounded-2xl border border-zinc-200 flex flex-col justify-start items-start gap-5 hover:border-yellow-500/60 hover:shadow-md transition">
            <div className="size-12 bg-yellow-100 rounded-xl flex justify-center items-center text-zinc-950 text-sm font-extrabold font-['Outfit']">
              HRM
            </div>
            <div className="flex-1 flex flex-col justify-start items-start gap-2">
              <div className="text-zinc-950 text-xl font-bold font-['Outfit']">Vione HRM</div>
              <div className="text-zinc-600 text-sm font-normal font-['Inter'] leading-relaxed">
                Quản lý nhân sự toàn diện từ tuyển dụng, chấm công đến tính lương tự động.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. AI WORKFLOW COPILOT ── */}
      <section id="ai-features" className="self-stretch px-6 sm:px-12 lg:px-20 py-20 bg-neutral-50 flex flex-col lg:flex-row justify-start items-center gap-12 border-b border-zinc-200">
        <div className="flex-1 flex flex-col justify-start items-start gap-6">
          <div className="text-yellow-600 text-sm font-bold font-mono tracking-widest uppercase">AI WORKFLOW COPILOT</div>
          <div className="text-zinc-950 text-3xl sm:text-4xl font-extrabold font-['Outfit']">
            Trợ Lý Thiết Lập Quy Trình Thông Minh
          </div>
          <div className="text-zinc-600 text-base font-normal font-['Inter'] leading-relaxed">
            AI tự động phân tích dữ liệu hiệu suất phòng ban để phát hiện điểm nghẽn và chủ động gợi ý các luồng tự động hóa tối ưu, giúp vận hành doanh nghiệp mượt mà.
          </div>
          <button
            type="button"
            onClick={() => setTrialModalOpen(true)}
            className="px-6 py-3 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg font-bold text-sm transition active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <span>Kích hoạt AI Copilot</span>
            <ArrowRight className="size-4" />
          </button>
        </div>

        <div className="flex-1 w-full h-80 sm:h-96 rounded-3xl overflow-hidden border border-zinc-200 shadow-md">
          <img
            className="w-full h-full object-cover"
            src="/landing_web_vione/Rectangle.png"
            alt="AI Workflow Copilot"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80";
            }}
          />
        </div>
      </section>

      {/* ── 5. GIÁM SÁT HOẠT ĐỘNG (DASHBOARD BANNER) ── */}
      <section className="self-stretch px-6 sm:px-12 lg:px-20 py-20 bg-white flex flex-col justify-start items-center gap-10 border-b border-zinc-200">
        <div className="flex flex-col justify-start items-center gap-3 text-center">
          <div className="text-yellow-600 text-sm font-bold font-mono tracking-widest uppercase">GIÁM SÁT HOẠT ĐỘNG</div>
          <div className="text-zinc-950 text-3xl sm:text-4xl font-extrabold font-['Outfit']">
            Kiểm Soát Vận Hành Tổng Thể
          </div>
        </div>

        <div className="w-full max-w-5xl rounded-2xl overflow-hidden border border-zinc-200 shadow-xl">
          <img
            className="w-full h-auto max-h-[480px] object-cover"
            src="/landing_web_vione/Rectangle (2).png"
            alt="Dashboard Vận Hành"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80";
            }}
          />
        </div>
      </section>

      {/* ── 6. 3 BƯỚC THIẾT LẬP ── */}
      <section className="self-stretch px-6 sm:px-12 lg:px-20 py-20 bg-neutral-50 flex flex-col justify-start items-start gap-12 border-b border-zinc-200">
        <div className="flex flex-col justify-start items-start gap-3">
          <div className="text-yellow-600 text-sm font-bold font-mono tracking-widest uppercase">3 BƯỚC THIẾT LẬP</div>
          <div className="text-zinc-950 text-3xl sm:text-4xl font-extrabold font-['Outfit']">
            Xây Dựng Quy Trình Tự Động Trong 5 Phút
          </div>
        </div>

        <div className="self-stretch grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-white rounded-2xl border border-zinc-200 flex flex-col justify-start items-start gap-4">
            <div className="text-yellow-600 text-5xl font-extrabold font-['Outfit']">01</div>
            <div className="text-zinc-950 text-xl font-bold font-['Outfit']">Lựa Chọn Trình Kích Hoạt</div>
            <div className="text-zinc-600 text-base font-normal font-['Inter'] leading-relaxed">
              Chọn sự kiện bắt đầu như: Khách hàng mới, Hóa đơn quá hạn, hay Đăng ký nghỉ phép.
            </div>
          </div>

          <div className="p-8 bg-white rounded-2xl border border-zinc-200 flex flex-col justify-start items-start gap-4">
            <div className="text-yellow-600 text-5xl font-extrabold font-['Outfit']">02</div>
            <div className="text-zinc-950 text-xl font-bold font-['Outfit']">Kết Nối Các Hành Động</div>
            <div className="text-zinc-600 text-base font-normal font-['Inter'] leading-relaxed">
              Thêm các hành động tiếp theo giữa các bộ phận để dữ liệu tự động đồng bộ liên thông.
            </div>
          </div>

          <div className="p-8 bg-white rounded-2xl border border-zinc-200 flex flex-col justify-start items-start gap-4">
            <div className="text-yellow-600 text-5xl font-extrabold font-['Outfit']">03</div>
            <div className="text-zinc-950 text-xl font-bold font-['Outfit']">Kích Hoạt & Giám Sát</div>
            <div className="text-zinc-600 text-base font-normal font-['Inter'] leading-relaxed">
              Để AI tự động hóa vận hành, theo dõi tiến độ công việc và cảnh báo điểm nghẽn.
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. VÌ SAO CHỌN NỀN TẢNG VIONE ── */}
      <section className="self-stretch px-6 sm:px-12 lg:px-20 py-20 bg-white flex flex-col justify-start items-start gap-12 border-b border-zinc-200">
        <div className="flex flex-col justify-start items-start gap-3">
          <div className="text-yellow-600 text-sm font-bold font-mono tracking-widest uppercase">GIÁ TRỊ DOANH NGHIỆP</div>
          <div className="text-zinc-950 text-3xl sm:text-4xl font-extrabold font-['Outfit']">
            Vì Sao Chọn Nền Tảng Vione?
          </div>
        </div>

        <div className="self-stretch grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col justify-start items-start gap-3">
            <div className="text-zinc-950 text-xl font-extrabold font-['Outfit']">Quản lý tập trung 360°</div>
            <div className="text-zinc-600 text-base font-normal font-['Inter'] leading-relaxed">
              Toàn bộ dữ liệu doanh nghiệp đồng bộ trên một nền tảng duy nhất, loại bỏ phân mảnh thông tin.
            </div>
          </div>

          <div className="flex flex-col justify-start items-start gap-3">
            <div className="text-zinc-950 text-xl font-extrabold font-['Outfit']">Quyết định dựa trên dữ liệu</div>
            <div className="text-zinc-600 text-base font-normal font-['Inter'] leading-relaxed">
              Hệ thống báo cáo thời gian thực trực quan giúp lãnh đạo đưa ra quyết định nhanh chóng, chính xác.
            </div>
          </div>

          <div className="flex flex-col justify-start items-start gap-3">
            <div className="text-zinc-950 text-xl font-extrabold font-['Outfit']">Tiết kiệm 40% thời gian</div>
            <div className="text-zinc-600 text-base font-normal font-['Inter'] leading-relaxed">
              Tự động hóa các tác vụ lặp đi lặp lại giúp đội ngũ tập trung vào các giá trị cốt lõi doanh nghiệp.
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. KHÁCH HÀNG THÀNH CÔNG (TESTIMONIAL) ── */}
      <section className="self-stretch px-6 sm:px-12 lg:px-20 py-20 bg-neutral-50 flex flex-col justify-start items-center gap-8 border-b border-zinc-200">
        <div className="text-yellow-600 text-sm font-bold font-mono tracking-widest uppercase">KHÁCH HÀNG THÀNH CÔNG</div>
        <div className="max-w-3xl text-center text-zinc-950 text-2xl sm:text-3xl font-extrabold font-['Outfit'] leading-snug">
          &quot;Từ khi áp dụng Vione, toàn bộ báo cáo tài chính và tiến độ dự án của 5 chi nhánh được tôi kiểm soát trực tiếp theo thời gian thực ngay trên điện thoại.&quot;
        </div>
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-full overflow-hidden bg-slate-200 border border-slate-300">
            <img src="/landing_web_vione/Ellipse.png" alt="Nguyễn Minh Đăng" className="w-full h-full object-cover" onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80";
            }} />
          </div>
          <div className="flex flex-col justify-start items-start">
            <span className="text-zinc-950 text-base font-bold font-['Outfit']">Ông Nguyễn Minh Đăng</span>
            <span className="text-zinc-600 text-sm font-normal font-['Inter']">CEO, Alpha Group</span>
          </div>
        </div>
      </section>

      {/* ── 9. BẢNG GIÁ DỊCH VỤ ── */}
      <section id="pricing-section" className="self-stretch px-6 sm:px-12 lg:px-20 py-20 bg-white flex flex-col justify-start items-start gap-12 border-b border-zinc-200">
        <div className="flex flex-col justify-start items-start gap-3">
          <div className="text-yellow-600 text-sm font-bold font-mono tracking-widest uppercase">BẢNG GIÁ DỊCH VỤ</div>
          <div className="text-zinc-950 text-3xl sm:text-4xl font-extrabold font-['Outfit']">
            Gói Giải Pháp Linh Hoạt
          </div>
        </div>

        <div className="self-stretch grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Plan 1 */}
          <div className="p-8 bg-neutral-50 rounded-2xl border border-zinc-200 flex flex-col justify-between gap-6 hover:shadow-md transition">
            <div className="space-y-4">
              <div>
                <div className="text-zinc-950 text-xl font-bold font-['Outfit']">Khởi nghiệp (Startup)</div>
                <p className="text-zinc-600 text-xs font-normal font-['Inter'] mt-1">Phù hợp cho các nhóm nhỏ muốn số hóa quy trình cơ bản.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-zinc-950 text-3xl sm:text-4xl font-extrabold font-['Outfit']">450.000đ</span>
                <span className="text-zinc-600 text-sm font-normal font-['Inter']">/tháng</span>
              </div>
              <div className="h-px bg-zinc-200" />
              <div className="space-y-3 text-sm text-zinc-600">
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-yellow-600 shrink-0" />
                  <span>Tối đa 15 thành viên</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-yellow-600 shrink-0" />
                  <span>Đầy đủ module Vione Work</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-yellow-600 shrink-0" />
                  <span>Dung lượng lưu trữ 10GB</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-yellow-600 shrink-0" />
                  <span>Hỗ trợ qua email</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTrialModalOpen(true)}
              className="w-full py-3 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-zinc-950 font-bold text-sm transition cursor-pointer"
            >
              Chọn gói Khởi nghiệp
            </button>
          </div>

          {/* Plan 2: Featured */}
          <div className="p-8 bg-white rounded-2xl border-2 border-yellow-500 shadow-xl flex flex-col justify-between gap-6 relative">
            <span className="absolute -top-3 right-6 px-3 py-1 bg-yellow-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider rounded-full shadow-xs">
              Phổ biến nhất
            </span>
            <div className="space-y-4">
              <div>
                <div className="text-zinc-950 text-xl font-bold font-['Outfit']">Tăng trưởng (Growth)</div>
                <p className="text-zinc-600 text-xs font-normal font-['Inter'] mt-1">Giải pháp toàn diện cho doanh nghiệp đang bứt phá.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-zinc-950 text-3xl sm:text-4xl font-extrabold font-['Outfit']">1.200.000đ</span>
                <span className="text-zinc-600 text-sm font-normal font-['Inter']">/tháng</span>
              </div>
              <div className="h-px bg-zinc-200" />
              <div className="space-y-3 text-sm text-zinc-600">
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-yellow-600 shrink-0" />
                  <span className="font-semibold text-zinc-900">Không giới hạn thành viên</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-yellow-600 shrink-0" />
                  <span>Trọn bộ 4 module chính</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-yellow-600 shrink-0" />
                  <span>Trợ lý AI Copilot cơ bản</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-yellow-600 shrink-0" />
                  <span>Dung lượng lưu trữ 100GB</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-yellow-600 shrink-0" />
                  <span>Hỗ trợ 24/7</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTrialModalOpen(true)}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold text-sm rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
            >
              Dùng thử miễn phí
            </button>
          </div>

          {/* Plan 3: Enterprise */}
          <div className="p-8 bg-neutral-50 rounded-2xl border border-zinc-200 flex flex-col justify-between gap-6 hover:shadow-md transition">
            <div className="space-y-4">
              <div>
                <div className="text-zinc-950 text-xl font-bold font-['Outfit']">Doanh nghiệp (Enterprise)</div>
                <p className="text-zinc-600 text-xs font-normal font-['Inter'] mt-1">Thiết kế riêng cho các tập đoàn lớn cần tùy biến sâu.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-zinc-950 text-3xl sm:text-4xl font-extrabold font-['Outfit']">Liên hệ</span>
              </div>
              <div className="h-px bg-zinc-200" />
              <div className="space-y-3 text-sm text-zinc-600">
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-yellow-600 shrink-0" />
                  <span>Hạ tầng máy chủ riêng biệt</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-yellow-600 shrink-0" />
                  <span>AI Copilot tùy biến sâu theo dữ liệu</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-yellow-600 shrink-0" />
                  <span>Bảo mật nâng cao &amp; SSO</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-yellow-600 shrink-0" />
                  <span>Kỹ sư hỗ trợ trực tiếp</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-yellow-600 shrink-0" />
                  <span>Tích hợp hệ thống ERP riêng</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTrialModalOpen(true)}
              className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg font-bold text-sm transition cursor-pointer"
            >
              Liên hệ tư vấn
            </button>
          </div>
        </div>
      </section>

      {/* ── 10. HỎI ĐÁP THƯỜNG GẶP (FAQ) ── */}
      <section id="faq" className="self-stretch px-6 sm:px-12 lg:px-20 py-20 bg-neutral-50 flex flex-col justify-start items-start gap-12 border-b border-zinc-200">
        <div className="flex flex-col justify-start items-start gap-3">
          <div className="text-yellow-600 text-sm font-bold font-mono tracking-widest uppercase">HỎI ĐÁP THƯỜNG GẶP</div>
          <div className="text-zinc-950 text-3xl sm:text-4xl font-extrabold font-['Outfit']">
            Câu Hỏi Thường Gặp
          </div>
        </div>

        <div className="self-stretch flex flex-col justify-start items-start gap-4">
          {[
            {
              q: "Vione có thể tích hợp với các hệ thống hiện tại của doanh nghiệp không?",
              a: "Có, Vione cung cấp hệ thống API mở mạnh mẽ giúp tích hợp mượt mà với SAP, Salesforce, các cổng thanh toán và các phần mềm chuyên dụng khác.",
            },
            {
              q: "Dữ liệu trên Vione được bảo mật như thế nào?",
              a: "Vione áp dụng tiêu chuẩn bảo mật ngân hàng quốc tế mã hóa AES-256, xác thực 2 lớp (2FA) và sao lưu dữ liệu tự động theo thời gian thực trên đám mây.",
            },
            {
              q: "Chúng tôi có được dùng thử phần mềm trước khi mua không?",
              a: "Vione cung cấp gói trải nghiệm miễn phí đầy đủ tính năng trong 14 ngày cho tối đa 10 thành viên để doanh nghiệp đánh giá mức độ phù hợp.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="self-stretch p-6 bg-white rounded-xl border border-zinc-200 flex flex-col justify-start items-start gap-2 shadow-2xs cursor-pointer"
              onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
            >
              <div className="self-stretch flex justify-between items-center text-zinc-950 text-base sm:text-lg font-bold font-['Outfit']">
                <span>{item.q}</span>
                <ChevronDown className={`size-5 text-zinc-500 transition-transform ${faqOpen === idx ? "rotate-180" : ""}`} />
              </div>
              {faqOpen === idx && (
                <div className="text-zinc-600 text-sm font-normal font-['Inter'] leading-relaxed pt-1">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 11. CTA BANNER (GOLD YELLOW) ── */}
      <section className="self-stretch px-6 sm:px-12 lg:px-20 py-20 bg-yellow-400 flex flex-col justify-start items-center gap-6 text-center">
        <h2 className="text-zinc-950 text-3xl sm:text-4xl font-extrabold font-['Outfit']">
          Bắt đầu kỷ nguyên quản trị tự động cùng Vione
        </h2>
        <p className="max-w-2xl text-zinc-800 text-base font-normal font-['Inter']">
          Tham gia cùng hàng nghìn doanh nghiệp Việt đang số hóa và bứt phá ngoạn mục bằng hệ thống Vione.
        </p>
        <button
          type="button"
          onClick={() => setTrialModalOpen(true)}
          className="px-8 py-4 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg text-base font-bold font-['Inter'] shadow-lg transition active:scale-95 cursor-pointer"
        >
          Đăng ký dùng thử miễn phí
        </button>
      </section>

      {/* ── 12. FOOTER VIONE ── */}
      <footer className="self-stretch px-6 sm:px-12 lg:px-20 pt-16 pb-10 bg-white border-t border-zinc-200 flex flex-col justify-start items-start gap-12 text-zinc-600">
        <div className="self-stretch flex flex-col lg:flex-row justify-between items-start gap-10">
          <div className="w-full lg:w-80 flex flex-col justify-start items-start gap-4">
            <div className="text-zinc-950 text-2xl font-extrabold font-['Outfit']">Vione</div>
            <div className="text-zinc-600 text-sm font-normal font-['Inter'] leading-relaxed">
              Hệ sinh thái quản trị doanh nghiệp toàn diện tích hợp AI thông minh, nâng cao hiệu quả vận hành và tối ưu nguồn lực.
            </div>
          </div>

          <div className="flex flex-wrap justify-start items-start gap-16">
            <div className="flex flex-col justify-start items-start gap-3">
              <div className="text-zinc-950 text-sm font-bold font-['Outfit']">Sản phẩm</div>
              <a href="#modules" className="text-zinc-600 text-sm font-normal font-['Inter'] hover:text-zinc-950 transition">Vione CRM</a>
              <a href="#modules" className="text-zinc-600 text-sm font-normal font-['Inter'] hover:text-zinc-950 transition">Vione Work</a>
              <a href="#modules" className="text-zinc-600 text-sm font-normal font-['Inter'] hover:text-zinc-950 transition">Vione Finance</a>
              <a href="#modules" className="text-zinc-600 text-sm font-normal font-['Inter'] hover:text-zinc-950 transition">Vione HRM</a>
            </div>

            <div className="flex flex-col justify-start items-start gap-3">
              <div className="text-zinc-950 text-sm font-bold font-['Outfit']">Liên hệ</div>
              <div className="text-zinc-600 text-sm font-normal font-['Inter']">Hotline: 1900 1234</div>
              <div className="text-zinc-600 text-sm font-normal font-['Inter']">Email: contact@vione.vn</div>
            </div>
          </div>
        </div>

        <div className="self-stretch flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-normal font-['Inter'] text-zinc-500 pt-6 border-t border-zinc-100">
          <div>© 2026 Vione. Bảo lưu mọi quyền.</div>
          <div>Điều khoản bảo mật · Quy chế sử dụng</div>
        </div>
      </footer>

      {/* ── MODAL ĐĂNG KÝ DÙNG THỬ VIONE ── */}
      {trialModalOpen && (
        <div
          className="fixed inset-0 z-[9999] grid place-items-center p-4 bg-black/70 backdrop-blur-xs"
          onClick={() => setTrialModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-zinc-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-lg font-extrabold text-zinc-950 font-['Outfit']">
                Đăng Ký Dùng Thử Vione
              </h3>
              <button
                type="button"
                onClick={() => setTrialModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTrialSubmit} className="space-y-3.5 pt-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 text-xs text-zinc-900 outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Số điện thoại *</label>
                <input
                  type="tel"
                  required
                  placeholder="0912 345 678"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 text-xs text-zinc-900 outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Tên doanh nghiệp</label>
                <input
                  type="text"
                  placeholder="Công ty TNHH Giải Pháp..."
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 text-xs text-zinc-900 outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Email công việc</label>
                <input
                  type="email"
                  placeholder="contact@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 text-xs text-zinc-900 outline-none focus:border-yellow-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold text-sm rounded-lg shadow-sm transition active:scale-95 cursor-pointer mt-2 disabled:opacity-50"
              >
                {submitting ? "Đang xử lý..." : "Kích hoạt 14 ngày miễn phí"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
