import React, { useState } from "react";
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

export const ViOneLandingWebOfficial: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<string>("Gói Giải Pháp Vione AI");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    size: "15 - 50 người",
    note: "",
  });

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
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-amber-500 selection:text-black">
      {/* ================= 1. HEADER / NAVIGATION ================= */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex justify-between items-center">
          {/* Logo */}
          <a href="#hero" className="flex items-center gap-3 group">
            <div className="size-10 bg-amber-500 rounded-xl flex justify-center items-center shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
              <span className="text-zinc-950 text-2xl font-extrabold font-outfit">V</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-950 text-2xl font-extrabold font-outfit tracking-tight">Vione</span>
              <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-bold rounded-full font-mono">5.0 AI</span>
            </div>
          </a>

          {/* Nav items */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
            <a href="#hero" className="hover:text-amber-600 transition-colors">Trang chủ</a>
            <a href="#modules" className="hover:text-amber-600 transition-colors">Sản phẩm</a>
            <a href="#ai-copilot" className="hover:text-amber-600 transition-colors">Tính năng AI</a>
            <a href="#workflow" className="hover:text-amber-600 transition-colors">Quy trình</a>
            <a href="#pricing" className="hover:text-amber-600 transition-colors">Bảng giá</a>
            <a href="#faq" className="hover:text-amber-600 transition-colors">FAQ</a>
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
              <span className="text-amber-400">→</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ================= 2. HERO SECTION WITH 4.8s KEYFRAME POP-UP ANIMATION ================= */}
        <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-white via-neutral-50/50 to-white py-16 lg:py-24 border-b border-zinc-200">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 flex flex-col items-start gap-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-full text-amber-800 text-xs font-bold font-mono tracking-wider uppercase">
                <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                • TRÍ TUỆ NHÂN TẠO THẾ HỆ MỚI
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-outfit text-zinc-950 leading-[1.15] tracking-tight">
                Chạm đỉnh tương lai với{" "}
                <span className="bg-gradient-to-r from-amber-500 via-yellow-600 to-amber-600 bg-clip-text text-transparent">
                  Vione AI 5.0
                </span>
              </h1>

              <p className="text-zinc-600 text-base sm:text-lg font-normal leading-relaxed max-w-xl">
                Tối ưu hóa quy trình vận hành toàn diện thông qua trợ lý trí tuệ nhân tạo thế hệ mới. Đưa ra quyết định thông minh hơn, nhanh hơn gấp 10 lần bằng một điểm chạm duy nhất.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => handleOpenModal("Trải Nghiệm Ngay")}
                  className="px-7 py-3.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950 font-extrabold text-base rounded-xl shadow-xl shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2.5"
                >
                  <span>Trải nghiệm ngay</span>
                  <ArrowRight className="size-5" />
                </button>
                <a
                  href="#ai-copilot"
                  className="px-6 py-3.5 bg-white border border-zinc-300 hover:border-zinc-400 text-zinc-800 font-bold text-base rounded-xl hover:bg-zinc-50 transition-all flex items-center gap-2"
                >
                  <Play className="size-4 text-amber-600 fill-amber-600" />
                  <span>Xem video giới thiệu</span>
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

            {/* Right Column: 3D Animation Stack */}
            <div className="lg:col-span-5 relative flex justify-center items-center min-h-[520px]">
              {/* Portrait Behind (Pops forward every 4.8s) */}
              <div 
                className="absolute left-4 top-4 w-[280px] h-[460px] rounded-3xl overflow-hidden border-2 border-amber-500/40 cursor-pointer transition-all"
                style={{
                  animation: "vionePopForward 4.8s cubic-bezier(0.22, 1, 0.36, 1) infinite",
                  willChange: "transform, z-index, box-shadow"
                }}
              >
                <img
                  src="/landing_web_vione/professional-portrait.png"
                  alt="Doanh nhân thành đạt Vione AI"
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute("src", "/landing_web_vione/saas-portrait.png");
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-xs font-mono font-bold text-amber-400">CREATOR AI 5.0</div>
                  <div className="text-sm font-bold font-outfit leading-tight mt-0.5">Nhân rộng tầm ảnh hưởng doanh nghiệp</div>
                </div>
              </div>

              {/* Floating Card: Tương tác đa kênh */}
              <div className="absolute -top-4 -left-6 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-zinc-200 flex items-center gap-3 animate-bounce max-w-[240px]" style={{ animationDuration: "5s" }}>
                <div className="size-9 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 font-bold">
                  <Bot className="size-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-950 font-outfit">TƯƠNG TÁC ĐA KÊNH</div>
                  <div className="text-[11px] text-zinc-500 leading-tight">Tự động trả lời 5,400 tin nhắn hôm nay</div>
                </div>
              </div>

              {/* Front Smartphone Frame */}
              <div className="relative z-20 w-[270px] h-[520px] bg-zinc-950 rounded-[44px] p-3 shadow-2xl border-4 border-zinc-800 flex flex-col justify-between">
                <div className="relative w-full h-full bg-zinc-900 rounded-[34px] overflow-hidden flex flex-col text-white p-4">
                  {/* Status bar */}
                  <div className="flex justify-between items-center text-xs text-zinc-400 pb-2">
                    <span className="font-mono font-bold text-white text-[11px]">09:41</span>
                    <div className="w-16 h-3.5 bg-black rounded-full mx-auto" />
                    <div className="flex items-center gap-1.5">
                      <img src="/landing_web_vione/ios-signal.svg" alt="Signal" className="h-2.5 opacity-80" onError={(e) => { (e.target as HTMLElement).style.display = "none"; }} />
                      <img src="/landing_web_vione/ios-wifi-signal.svg" alt="WiFi" className="h-2.5 opacity-80" onError={(e) => { (e.target as HTMLElement).style.display = "none"; }} />
                      <img src="/landing_web_vione/ios-battery-full.svg" alt="Battery" className="h-2.5 opacity-80" onError={(e) => { (e.target as HTMLElement).style.display = "none"; }} />
                    </div>
                  </div>

                  {/* Header inside phone */}
                  <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className="size-6 bg-amber-500 rounded-lg flex items-center justify-center text-black font-extrabold text-xs">V</div>
                      <span className="text-xs font-extrabold tracking-tight font-outfit">VIONE MOBILE</span>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] font-bold rounded-full font-mono">LIVE AI</span>
                  </div>

                  {/* Card: Hiệu suất hôm nay */}
                  <div className="mt-3 p-3 bg-zinc-800/80 rounded-2xl border border-zinc-700/60">
                    <div className="text-[10px] text-zinc-400 font-mono">HIỆU SUẤT HÔM NAY</div>
                    <div className="text-2xl font-extrabold font-outfit text-amber-400 mt-0.5 flex items-baseline gap-2">
                      98.4%
                      <span className="text-[10px] font-bold text-emerald-400 font-mono">+12.5%</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1">Đang tối ưu 3 luồng vận hành</div>
                  </div>

                  {/* Realtime AI Bot Tasks */}
                  <div className="mt-3 flex-1 flex flex-col gap-2">
                    <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">TIẾN TRÌNH AI BOT</div>

                    <div className="p-2.5 bg-zinc-800/60 rounded-xl border border-zinc-700/40">
                      <div className="flex justify-between text-[11px] font-medium">
                        <span className="truncate">Báo cáo tài chính tháng 2</span>
                        <span className="text-amber-400 font-mono font-bold">100%</span>
                      </div>
                      <div className="w-full bg-zinc-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full w-full" />
                      </div>
                    </div>

                    <div className="p-2.5 bg-zinc-800/60 rounded-xl border border-zinc-700/40">
                      <div className="flex justify-between text-[11px] font-medium">
                        <span className="truncate">Phản hồi Hotline CSKH</span>
                        <span className="text-amber-400 font-mono font-bold">86%</span>
                      </div>
                      <div className="w-full bg-zinc-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full w-[86%]" />
                      </div>
                    </div>

                    <div className="p-2.5 bg-zinc-800/60 rounded-xl border border-zinc-700/40">
                      <div className="flex justify-between text-[11px] font-medium">
                        <span className="truncate">Đồng bộ API SAP ERP</span>
                        <span className="text-amber-400 font-mono font-bold">72%</span>
                      </div>
                      <div className="w-full bg-zinc-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full w-[72%]" />
                      </div>
                    </div>
                  </div>

                  {/* Phone bottom action */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleOpenModal("Vione Mobile Demo")}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition-all shadow-md flex justify-center items-center gap-1"
                    >
                      <span>Mở Trợ Lý Copilot</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating Card: Bảo mật */}
              <div className="absolute -bottom-4 -right-4 z-30 bg-zinc-950 text-white p-3 rounded-2xl shadow-xl border border-zinc-700 flex items-center gap-3">
                <div className="size-8 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center font-bold">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <div className="text-xs font-bold font-outfit text-white">BẢO MẬT CHUẨN AES-256</div>
                  <div className="text-[10px] text-zinc-400">Vận hành tự động 24/7</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 3. MÔ ĐUN LIÊN KẾT - KIẾN TRÚC HOẠT ĐỘNG HỢP NHẤT ================= */}
        <section id="modules" className="py-20 lg:py-28 bg-white border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="text-amber-600 text-xs font-bold font-mono tracking-widest uppercase mb-3">MÔ ĐUN LIÊN KẾT</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit text-zinc-950 tracking-tight">
                Kiến Trúc Hoạt Động Hợp Nhất
              </h2>
              <p className="text-zinc-600 text-base mt-4">
                Kết nối liền mạch các phòng ban trọng yếu trên một nền tảng dữ liệu đồng nhất, xóa bỏ hoàn toàn ốc đảo thông tin.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: CRM */}
              <div className="p-8 bg-neutral-50 hover:bg-white rounded-2xl border border-zinc-200 hover:border-amber-500/50 hover:shadow-xl transition-all group flex flex-col justify-between">
                <div>
                  <div className="size-12 bg-amber-100 group-hover:bg-amber-500 text-amber-800 group-hover:text-black rounded-xl flex items-center justify-center font-bold text-lg transition-colors mb-6 shadow-sm">
                    CRM
                  </div>
                  <h3 className="text-xl font-bold font-outfit text-zinc-950 mb-3">Vione CRM</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    Quản trị quan hệ khách hàng chuyên sâu, tự động hóa phễu bán hàng và tối ưu tỷ lệ chuyển đổi lead thành doanh thu.
                  </p>
                </div>
                <div className="pt-6 border-t border-zinc-200/60 mt-6 flex items-center text-xs font-bold text-amber-600 group-hover:text-amber-700">
                  <span>Khám phá CRM</span>
                  <ArrowRight className="size-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 2: Work */}
              <div className="p-8 bg-neutral-50 hover:bg-white rounded-2xl border border-zinc-200 hover:border-amber-500/50 hover:shadow-xl transition-all group flex flex-col justify-between">
                <div>
                  <div className="size-12 bg-amber-100 group-hover:bg-amber-500 text-amber-800 group-hover:text-black rounded-xl flex items-center justify-center font-bold text-lg transition-colors mb-6 shadow-sm">
                    Work
                  </div>
                  <h3 className="text-xl font-bold font-outfit text-zinc-950 mb-3">Vione Work</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    Quản lý công việc, dự án và cộng tác nhóm không giới hạn không gian và thời gian. Theo dõi tiến độ Gantt chuẩn xác.
                  </p>
                </div>
                <div className="pt-6 border-t border-zinc-200/60 mt-6 flex items-center text-xs font-bold text-amber-600 group-hover:text-amber-700">
                  <span>Khám phá Work</span>
                  <ArrowRight className="size-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 3: Finance */}
              <div className="p-8 bg-neutral-50 hover:bg-white rounded-2xl border border-zinc-200 hover:border-amber-500/50 hover:shadow-xl transition-all group flex flex-col justify-between">
                <div>
                  <div className="size-12 bg-amber-100 group-hover:bg-amber-500 text-amber-800 group-hover:text-black rounded-xl flex items-center justify-center font-bold text-lg transition-colors mb-6 shadow-sm">
                    Fin
                  </div>
                  <h3 className="text-xl font-bold font-outfit text-zinc-950 mb-3">Vione Finance</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    Theo dõi dòng tiền, hoạch định ngân sách chi tiêu và lập báo cáo tài chính thời gian thực, tích hợp VietQR thông minh.
                  </p>
                </div>
                <div className="pt-6 border-t border-zinc-200/60 mt-6 flex items-center text-xs font-bold text-amber-600 group-hover:text-amber-700">
                  <span>Khám phá Finance</span>
                  <ArrowRight className="size-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 4: HRM */}
              <div className="p-8 bg-neutral-50 hover:bg-white rounded-2xl border border-zinc-200 hover:border-amber-500/50 hover:shadow-xl transition-all group flex flex-col justify-between">
                <div>
                  <div className="size-12 bg-amber-100 group-hover:bg-amber-500 text-amber-800 group-hover:text-black rounded-xl flex items-center justify-center font-bold text-lg transition-colors mb-6 shadow-sm">
                    HRM
                  </div>
                  <h3 className="text-xl font-bold font-outfit text-zinc-950 mb-3">Vione HRM</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    Quản lý nhân sự toàn diện từ tuyển dụng, hợp đồng, chấm công định vị GPS đến tính lương và đánh giá hiệu suất KPI tự động.
                  </p>
                </div>
                <div className="pt-6 border-t border-zinc-200/60 mt-6 flex items-center text-xs font-bold text-amber-600 group-hover:text-amber-700">
                  <span>Khám phá HRM</span>
                  <ArrowRight className="size-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 4. AI WORKFLOW COPILOT ================= */}
        <section id="ai-copilot" className="py-20 lg:py-28 bg-neutral-50 border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 flex flex-col items-start gap-5">
              <div className="text-amber-600 text-xs font-bold font-mono tracking-widest uppercase">AI WORKFLOW COPILOT</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit text-zinc-950 tracking-tight leading-tight">
                Trợ Lý Thiết Lập Quy Trình Thông Minh
              </h2>
              <p className="text-zinc-600 text-base leading-relaxed">
                AI tự động phân tích dữ liệu hiệu suất phòng ban để phát hiện điểm nghẽn và chủ động gợi ý các luồng tự động hóa tối ưu, giúp vận hành doanh nghiệp mượt mà.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-zinc-800 font-medium">
                  <span className="size-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-xs font-bold">✓</span>
                  Tự động hóa phân loại email, tin nhắn khách hàng 24/7
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-800 font-medium">
                  <span className="size-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-xs font-bold">✓</span>
                  Phát hiện và cảnh báo sai lệch dòng tiền, nợ quá hạn
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-800 font-medium">
                  <span className="size-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-xs font-bold">✓</span>
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

            <div className="lg:col-span-6">
              <div className="rounded-3xl overflow-hidden border-2 border-zinc-200 shadow-2xl bg-white hover:scale-[1.01] transition-transform">
                <img
                  src="/landing_web_vione/workflow-automation.png"
                  alt="AI Workflow Copilot Vione"
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute("src", "/landing_web_vione/operational-dashboard.png");
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ================= 5. GIÁM SÁT HOẠT ĐỘNG ================= */}
        <section className="py-20 lg:py-28 bg-white border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col items-center">
            <div className="text-center max-w-3xl mb-12">
              <div className="text-amber-600 text-xs font-bold font-mono tracking-widest uppercase mb-3">GIÁM SÁT HOẠT ĐỘNG</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit text-zinc-950 tracking-tight">
                Kiểm Soát Vận Hành Tổng Thể
              </h2>
              <p className="text-zinc-600 text-base mt-4">
                Bảng điều hành thời gian thực phản ánh sức khỏe toàn diện của doanh nghiệp qua biểu đồ và chỉ số KPI trực quan.
              </p>
            </div>

            <div className="w-full rounded-2xl lg:rounded-3xl overflow-hidden border-2 border-zinc-200 shadow-2xl bg-white">
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
        <section id="workflow" className="py-20 lg:py-28 bg-neutral-50 border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="text-amber-600 text-xs font-bold font-mono tracking-widest uppercase mb-3">3 BƯỚC THIẾT LẬP</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit text-zinc-950 tracking-tight">
                Xây Dựng Quy Trình Tự Động Trong 5 Phút
              </h2>
              <p className="text-zinc-600 text-base mt-4">
                Không cần viết code. Thiết lập quy trình làm việc tự động với giao diện kéo thả trực quan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
                <div>
                  <div className="text-amber-500 text-5xl font-extrabold font-outfit mb-4">01</div>
                  <h3 className="text-xl font-bold font-outfit text-zinc-950 mb-3">Lựa Chọn Trình Kích Hoạt</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    Chọn sự kiện bắt đầu như: Khách hàng mới, Hóa đơn quá hạn, Yêu cầu tạm ứng hay Đăng ký nghỉ phép được gửi lên.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-100 text-xs font-mono font-bold text-zinc-400">BƯỚC KHỞI TẠO</div>
              </div>

              <div className="p-8 bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
                <div>
                  <div className="text-amber-500 text-5xl font-extrabold font-outfit mb-4">02</div>
                  <h3 className="text-xl font-bold font-outfit text-zinc-950 mb-3">Kết Nối Các Hành Động</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    Thêm các hành động tiếp theo giữa các bộ phận để dữ liệu tự động đồng bộ liên thông, gửi thông báo phê duyệt tức thì.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-100 text-xs font-mono font-bold text-zinc-400">BƯỚC LIÊN THÔNG</div>
              </div>

              <div className="p-8 bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
                <div>
                  <div className="text-amber-500 text-5xl font-extrabold font-outfit mb-4">03</div>
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
        <section className="py-20 lg:py-28 bg-white border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="text-amber-600 text-xs font-bold font-mono tracking-widest uppercase mb-3">GIÁ TRỊ DOANH NGHIỆP</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit text-zinc-950 tracking-tight">
                Vì Sao Chọn Nền Tảng Vione?
              </h2>
              <p className="text-zinc-600 text-base mt-4">
                Đột phá hiệu suất tổ chức nhờ công nghệ tự động hóa hợp nhất chuẩn quốc tế.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 bg-neutral-50 rounded-2xl border border-zinc-200">
                <div className="size-12 bg-amber-500/20 text-amber-700 rounded-xl flex items-center justify-center font-bold text-xl mb-6">
                  360°
                </div>
                <h3 className="text-xl font-bold font-outfit text-zinc-950 mb-3">Quản lý tập trung 360°</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Toàn bộ dữ liệu khách hàng, dự án, doanh thu và nhân sự được đồng bộ trên một nền tảng duy nhất, loại bỏ hoàn toàn phân mảnh thông tin.
                </p>
              </div>

              <div className="p-8 bg-neutral-50 rounded-2xl border border-zinc-200">
                <div className="size-12 bg-amber-500/20 text-amber-700 rounded-xl flex items-center justify-center font-bold text-xl mb-6">
                  <LineChart className="size-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold font-outfit text-zinc-950 mb-3">Quyết định dựa trên dữ liệu</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Hệ thống báo cáo thông minh thời gian thực giúp ban lãnh đạo ra quyết định điều hành chính xác gấp 10 lần dựa trên dữ liệu định lượng.
                </p>
              </div>

              <div className="p-8 bg-neutral-50 rounded-2xl border border-zinc-200">
                <div className="size-12 bg-amber-500/20 text-amber-700 rounded-xl flex items-center justify-center font-bold text-xl mb-6">
                  <Zap className="size-6 text-amber-600" />
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
        <section className="py-20 lg:py-28 bg-neutral-50 border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
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

            <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col items-start gap-5">
              <div className="text-amber-600 text-xs font-bold font-mono tracking-widest uppercase">PHÙ HỢP NHIỀU MÔ HÌNH</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit text-zinc-950 tracking-tight leading-tight">
                Giải Pháp Cho Mọi Ngành Nghề
              </h2>
              <p className="text-zinc-600 text-base leading-relaxed">
                Dù doanh nghiệp của bạn hoạt động trong lĩnh vực Thương mại, Dịch vụ, Công nghệ hay Sản xuất, Vione đều đáp ứng linh hoạt với kiến trúc module mở rộng.
              </p>
              <div className="space-y-4 pt-2">
                <div className="p-4 bg-white rounded-xl border border-zinc-200 text-sm text-zinc-700">
                  <span className="font-bold text-zinc-950 block mb-1">• Doanh nghiệp Công nghệ & Dịch vụ:</span>
                  Quản lý dự án Agile mượt mà, kết nối dữ liệu từ phễu chuyển đổi sang báo cáo tài chính dự báo.
                </div>
                <div className="p-4 bg-white rounded-xl border border-zinc-200 text-sm text-zinc-700">
                  <span className="font-bold text-zinc-950 block mb-1">• Doanh nghiệp Chuỗi & Bán lẻ:</span>
                  Quản lý tập trung chi nhánh, kiểm soát dòng tiền chi tiết và tự động tính KPI nhân viên.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 9. KHÁCH HÀNG THÀNH CÔNG ================= */}
        <section className="py-20 lg:py-24 bg-white border-b border-zinc-200">
          <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center gap-8">
            <div className="text-amber-600 text-xs font-bold font-mono tracking-widest uppercase">KHÁCH HÀNG THÀNH CÔNG</div>
            <blockquote className="text-2xl sm:text-3xl font-extrabold font-outfit text-zinc-950 leading-snug">
              &ldquo;Từ khi áp dụng Vione, toàn bộ báo cáo tài chính và tiến độ dự án của 5 chi nhánh được tôi kiểm soát trực tiếp theo thời gian thực ngay trên điện thoại.&rdquo;
            </blockquote>
            <div className="flex items-center gap-4">
              <img
                src="/landing_web_vione/avatar-ceo.png"
                alt="Ông Nguyễn Minh Đăng"
                className="size-14 rounded-full border-2 border-amber-500 shadow-md object-cover"
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
        <section id="pricing" className="py-20 lg:py-28 bg-neutral-50 border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="text-amber-600 text-xs font-bold font-mono tracking-widest uppercase mb-3">BẢNG GIÁ DỊCH VỤ</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit text-zinc-950 tracking-tight">
                Gói Giải Pháp Linh Hoạt Cho Mọi Quy Mô
              </h2>
              <p className="text-zinc-600 text-base mt-4">
                Thiết kế chi phí theo đúng quy mô và lộ trình chuyển đổi số của doanh nghiệp. Liên hệ ngay để nhận báo giá chi tiết và chương trình ưu đãi độc quyền.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              {/* Gói 1: Startup */}
              <div className="p-8 lg:p-10 bg-white rounded-3xl border border-zinc-200 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
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
                    <div className="text-xs text-amber-600 font-semibold mt-1">Tối ưu cho đội ngũ dưới 15 người</div>
                  </div>

                  <div className="space-y-3 text-sm text-zinc-700">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-amber-500 shrink-0" />
                      <span>Tối đa 15 thành viên truy cập</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-amber-500 shrink-0" />
                      <span>Đầy đủ module Vione Work & Tasks</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-amber-500 shrink-0" />
                      <span>Dung lượng lưu trữ 10GB đám mây</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-amber-500 shrink-0" />
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
              <div className="p-8 lg:p-10 bg-zinc-950 text-white rounded-3xl border-2 border-amber-500 shadow-2xl relative flex flex-col justify-between transform lg:-translate-y-2">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 text-xs font-black uppercase rounded-full shadow-md font-mono">
                  ★ PHỔ BIẾN NHẤT
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4 mt-2">
                    <span className="text-sm font-bold font-mono text-amber-400 uppercase tracking-wider">GÓI TĂNG TRƯỞNG</span>
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full font-mono">Growth</span>
                  </div>
                  <h3 className="text-2xl font-bold font-outfit text-white mb-2">Tăng trưởng (Growth)</h3>
                  <p className="text-zinc-400 text-sm mb-6">Giải pháp toàn diện cho doanh nghiệp đang bứt phá mạnh mẽ.</p>

                  <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 mb-6">
                    <div className="text-xs text-zinc-400 font-medium">Chi phí đầu tư:</div>
                    <div className="text-2xl font-extrabold font-outfit text-amber-400 mt-1">Tư Vấn 1-1 Chuyên Sâu</div>
                    <div className="text-xs text-zinc-300 font-semibold mt-1">Kèm gói tài trợ đào tạo onboarding</div>
                  </div>

                  <div className="space-y-3 text-sm text-zinc-300">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-amber-400 shrink-0" />
                      <span>Không giới hạn thành viên tham gia</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-amber-400 shrink-0" />
                      <span>Trọn bộ 4 module: CRM, Work, Fin, HRM</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-amber-400 shrink-0" />
                      <span>Trợ lý AI Workflow Copilot thế hệ mới</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-amber-400 shrink-0" />
                      <span>Dung lượng lưu trữ 100GB tốc độ cao</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-amber-400 shrink-0" />
                      <span>Hỗ trợ chuyên gia 24/7 qua Hotline VIP</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenModal("Gói Tăng Trưởng (Growth)")}
                  className="mt-8 w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950 font-extrabold text-sm rounded-xl transition-all shadow-xl shadow-amber-500/25 flex justify-center items-center gap-2"
                >
                  <span>Nhận tư vấn & Báo giá ngay</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>

              {/* Gói 3: Enterprise */}
              <div className="p-8 lg:p-10 bg-white rounded-3xl border border-zinc-200 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
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
                    <div className="text-xs text-amber-600 font-semibold mt-1">Khảo sát & Báo giá theo giải pháp</div>
                  </div>

                  <div className="space-y-3 text-sm text-zinc-700">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-amber-500 shrink-0" />
                      <span>Hạ tầng máy chủ riêng biệt (On-Prem / Cloud)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-amber-500 shrink-0" />
                      <span>AI Copilot huấn luyện riêng theo dữ liệu nội bộ</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-amber-500 shrink-0" />
                      <span>Bảo mật nâng cao, xác thực SSO, MFA</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-amber-500 shrink-0" />
                      <span>Tích hợp trực tiếp hệ thống SAP, Oracle ERP</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-amber-500 shrink-0" />
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
        <section id="faq" className="py-20 lg:py-28 bg-white border-b border-zinc-200">
          <div className="max-w-4xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <div className="text-amber-600 text-xs font-bold font-mono tracking-widest uppercase mb-3">HỎI ĐÁP THƯỜNG GẶP</div>
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
                <div key={idx} className="border border-zinc-200 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-6 text-left font-bold font-outfit text-lg text-zinc-950 flex justify-between items-center bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
                  >
                    <span>{item.q}</span>
                    <span className={`text-xl font-mono transition-transform ${openFaq === idx ? "text-amber-600" : "text-zinc-400"}`}>
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
        <section className="py-20 lg:py-24 bg-zinc-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-radial from-amber-500/20 via-transparent to-transparent opacity-30 pointer-events-none" />
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-outfit text-white tracking-tight mb-6">
              Bắt đầu kỷ nguyên quản trị tự động cùng Vione
            </h2>
            <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-8">
              Tham gia cùng hàng nghìn doanh nghiệp Việt đang số hóa và bứt phá ngoạn mục bằng hệ thống điều hành Vione AI 5.0.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4">
              <button
                onClick={() => handleOpenModal("CTA Cuối Trang")}
                className="px-8 py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950 font-extrabold text-base rounded-2xl shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all"
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
              <div className="size-8 bg-amber-500 rounded-lg flex items-center justify-center text-black font-extrabold text-lg">V</div>
              <span className="text-white text-xl font-extrabold font-outfit tracking-tight">Vione</span>
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
              <li><a href="#modules" className="hover:text-amber-400 transition-colors">Vione CRM</a></li>
              <li><a href="#modules" className="hover:text-amber-400 transition-colors">Vione Work</a></li>
              <li><a href="#modules" className="hover:text-amber-400 transition-colors">Vione Finance</a></li>
              <li><a href="#modules" className="hover:text-amber-400 transition-colors">Vione HRM</a></li>
              <li><a href="#ai-copilot" className="hover:text-amber-400 transition-colors">AI Workflow Copilot</a></li>
            </ul>
          </div>

          <div>
            <div className="text-white text-sm font-bold font-outfit uppercase tracking-wider mb-4">Tài Nguyên</div>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li><a href="#pricing" className="hover:text-amber-400 transition-colors">Bảng giá dịch vụ</a></li>
              <li><a href="#faq" className="hover:text-amber-400 transition-colors">Câu hỏi thường gặp</a></li>
              <li><Link to="/auth" className="hover:text-amber-400 transition-colors">Cổng Quản Trị CRM</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-white text-sm font-bold font-outfit uppercase tracking-wider mb-4">Liên Hệ</div>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li>Hotline: <span className="text-white font-semibold">1900 1234</span> (24/7)</li>
              <li>Email: <span className="text-white font-semibold">contact@vione.vn</span></li>
              <li>Văn phòng: Tầng 12, Tòa nhà Công Nghệ ViOne, Hà Nội</li>
              <li className="pt-2">
                <span className="inline-block px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-400 text-[11px]">
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
          <div className="relative w-full max-w-lg bg-zinc-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition-colors"
            >
              <X className="size-6" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="size-10 bg-amber-500 rounded-xl flex items-center justify-center text-black font-extrabold text-xl">V</div>
              <div>
                <h3 className="text-xl font-bold font-outfit text-white">Yêu Cầu Báo Giá & Tư Vấn 1-1</h3>
                <p className="text-xs text-amber-400 font-mono">{selectedTier}</p>
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
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 focus:border-amber-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 focus:border-amber-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 focus:border-amber-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 focus:border-amber-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Quy mô nhân sự</label>
                    <select
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 focus:border-amber-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 focus:border-amber-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950 font-extrabold text-sm rounded-xl shadow-xl shadow-amber-500/25 transition-all"
                >
                  Gửi Yêu Cầu Nhận Báo Giá Ngay
                </button>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="size-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-amber-500/40">
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
