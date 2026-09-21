import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  ArrowRight,
  Smartphone,
  Database,
  QrCode,
  Users,
  ShieldCheck,
  TrendingUp,
  Download,
  Building2,
  ExternalLink,
  Layers,
  CheckCircle2,
  Share2,
  Briefcase,
  Store,
  BarChart3,
  Calendar,
  Lock,
  ChevronRight,
  Menu,
  X,
  Award,
  Zap,
  Radio,
  Fingerprint,
  Check,
} from "lucide-react";

export function ViOneGoldWhiteLanding() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"app" | "crm" | "nfc">("app");
  const [typingIndex, setTypingIndex] = useState(0);
  const [nfcSimActive, setNfcSimActive] = useState(false);
  const [nfcTapped, setNfcTapped] = useState(false);

  // 3D Card Tilt state
  const [cardTilt, setCardTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const cardRef = useRef<HTMLDivElement>(null);

  const morphingWords = [
    "Doanh Nhân Tinh Hoa 5.0",
    "Hệ Thống CRM Hợp Nhất",
    "Danh Thiếp Titanium NFC 1-Chạm",
    "Hệ Điều Hành Giao Thương B2B",
  ];

  // Rotate hero dynamic word
  useEffect(() => {
    const timer = setInterval(() => {
      setTypingIndex((prev) => (prev + 1) % morphingWords.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [morphingWords.length]);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setCardTilt({ rotateX, rotateY, glareX, glareY });
  };

  const handleCardMouseLeave = () => {
    setCardTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  };

  const triggerNfcSimulation = () => {
    setNfcSimActive(true);
    setNfcTapped(false);
    setTimeout(() => {
      setNfcTapped(true);
      setTimeout(() => {
        setNfcSimActive(false);
      }, 3500);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#FCFBF8] text-neutral-900 font-sans selection:bg-[#EBD28F] selection:text-black overflow-x-hidden relative">
      {/* 5.0 Ambient Cyber-Gold Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-gradient-to-b from-amber-200/40 via-amber-100/20 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-80 right-[-150px] w-[500px] h-[500px] bg-amber-300/15 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute top-[800px] left-[-150px] w-[500px] h-[500px] bg-blue-400/10 blur-3xl rounded-full pointer-events-none" />

      {/* Top Banner Thông Báo 5.0 */}
      <div className="bg-gradient-to-r from-[#0C121E] via-[#162032] to-[#0C121E] text-white text-xs font-semibold py-2.5 px-4 text-center tracking-wide flex items-center justify-center gap-2 border-b border-amber-500/30 relative z-50 shadow-md">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
        </span>
        <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent font-bold">
          VIONE PLATFORM 5.0
        </span>
        <span className="text-slate-400 hidden sm:inline">•</span>
        <span className="text-slate-200 hidden sm:inline">
          HỆ ĐIỀU HÀNH KẾT NỐI DOANH NGHIỆP & CRM 163 BẢNG DỮ LIỆU CÔ LẬP
        </span>
        <a
          href="/connect-app"
          className="ml-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#DFB76C] to-[#B8860B] px-3 py-0.5 text-[11px] font-bold text-slate-950 hover:brightness-110 transition shadow-sm"
        >
          Trải nghiệm ngay <ArrowRight className="w-3 h-3" />
        </a>
      </div>

      {/* Navigation Bar 5.0 */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-[#EFE7D8]/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <a href="/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FDF6E2] via-[#E6C687] to-[#D4AF37] p-[1.5px] shadow-md shadow-amber-200/50 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-transparent" />
                <span className="font-black text-xl bg-gradient-to-r from-[#FDEABF] via-[#E2BA60] to-[#DFB76C] bg-clip-text text-transparent">
                  V
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-neutral-900">
                  ViOne
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-900 border border-amber-400/40 uppercase tracking-widest">
                  OS 5.0
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 font-medium tracking-wide">
                Business Connection OS
              </p>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-neutral-700">
            <a
              href="#ecosystem"
              className="hover:text-amber-700 transition duration-200 flex items-center gap-1.5"
            >
              <span>Hệ Sinh Thái</span>
            </a>
            <a
              href="#crm"
              className="hover:text-amber-700 transition duration-200 flex items-center gap-1.5"
            >
              <span>Quản Trị CRM</span>
              <span className="text-[9.5px] font-extrabold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full border border-amber-300/60">
                163 Tables
              </span>
            </a>
            <a
              href="#mobile-app"
              className="hover:text-amber-700 transition duration-200 flex items-center gap-1.5"
            >
              <span>Mobile App</span>
            </a>
            <a
              href="#nfc-card"
              className="hover:text-amber-700 transition duration-200 flex items-center gap-1.5"
            >
              <span>Danh Thiếp NFC</span>
            </a>
            <a
              href="#telemetry"
              className="hover:text-amber-700 transition duration-200 flex items-center gap-1.5"
            >
              <span>Hạ Tầng 5.0</span>
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="/?portal=crm"
              className="px-4 py-2.5 text-sm font-bold text-neutral-800 bg-neutral-100/90 hover:bg-neutral-200/80 rounded-xl border border-neutral-200/80 transition shadow-xs flex items-center gap-2"
            >
              <Database className="w-4 h-4 text-amber-700" />
              <span>Đăng Nhập CRM</span>
            </a>
            <a
              href="/connect-app"
              className="px-5 py-2.5 text-sm font-bold text-neutral-950 bg-gradient-to-r from-[#FDEABF] via-[#E2BA60] to-[#DFB76C] hover:brightness-105 rounded-xl border border-amber-300/80 shadow-md shadow-amber-300/30 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4 text-neutral-950" />
              <span>Vào ViOne App</span>
            </a>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden p-2 rounded-xl text-neutral-700 hover:bg-neutral-100 transition"
          >
            {mobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileNavOpen && (
          <div className="md:hidden border-b border-[#EFE7D8] bg-white/95 backdrop-blur-xl px-5 pt-3 pb-6 space-y-3 animate-in slide-in-from-top duration-200">
            <a
              href="#ecosystem"
              onClick={() => setMobileNavOpen(false)}
              className="block py-2 text-base font-semibold text-neutral-800 hover:text-amber-700"
            >
              Hệ Sinh Thái ViOne 5.0
            </a>
            <a
              href="#crm"
              onClick={() => setMobileNavOpen(false)}
              className="block py-2 text-base font-semibold text-neutral-800 hover:text-amber-700"
            >
              Hệ Thống CRM Cô Lập (163 Tables)
            </a>
            <a
              href="#mobile-app"
              onClick={() => setMobileNavOpen(false)}
              className="block py-2 text-base font-semibold text-neutral-800 hover:text-amber-700"
            >
              Ứng Dụng Di Động ViOne Connect
            </a>
            <a
              href="#nfc-card"
              onClick={() => setMobileNavOpen(false)}
              className="block py-2 text-base font-semibold text-neutral-800 hover:text-amber-700"
            >
              Danh Thiếp Titanium NFC 1-Chạm
            </a>
            <div className="pt-2 flex flex-col gap-2.5">
              <a
                href="/?portal=crm"
                className="w-full text-center py-2.5 rounded-xl border border-neutral-300 font-bold text-sm text-neutral-800 bg-neutral-50"
              >
                Vào Hệ Thống CRM
              </a>
              <a
                href="/connect-app"
                className="w-full text-center py-3 rounded-xl font-bold text-sm text-neutral-950 bg-gradient-to-r from-[#FDEABF] via-[#E2BA60] to-[#DFB76C] shadow-md shadow-amber-300/30"
              >
                Mở ViOne Connect App
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section 5.0 */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* 5.0 Futuristic Pill Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md border border-[#E8D4A2] shadow-sm text-xs font-bold text-neutral-800 hover:border-amber-400 transition cursor-default">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600"></span>
              </span>
              <span className="font-black tracking-wider text-amber-900">VIONE 5.0 NEXT-GEN</span>
              <span className="text-neutral-300">•</span>
              <span className="text-neutral-600 font-semibold">HỆ ĐIỀU HÀNH KẾT NỐI KINH DOANH & CRM CÔ LẬP</span>
            </div>

            {/* Main Headline with Kinetic Streaming Text */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-neutral-900 tracking-tight leading-[1.18]">
              Nền Tảng Hợp Nhất Thế Hệ Mới Cho{" "}
              <span className="block mt-2 min-h-[1.25em]">
                <span className="inline-block relative">
                  <span className="bg-gradient-to-r from-[#8C6207] via-[#D4AF37] to-[#B8860B] bg-clip-text text-transparent transition-all duration-500 drop-shadow-sm font-black">
                    {morphingWords[typingIndex]}
                  </span>
                  <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#DFB76C] to-transparent rounded-full" />
                </span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed font-normal">
              Giải pháp kép độc bản: <strong className="text-neutral-900 font-semibold">ViOne Connect</strong> (Mạng xã hội doanh nhân & danh thiếp Titanium NFC 1-chạm) kết hợp cùng <strong className="text-neutral-900 font-semibold">Enterprise CRM</strong> (Hệ quản trị 163 bảng dữ liệu cô lập an toàn).
            </p>

            {/* Hero CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/connect-app"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-base text-neutral-950 bg-gradient-to-r from-[#FDEABF] via-[#E2BA60] to-[#DFB76C] hover:brightness-105 shadow-xl shadow-amber-300/40 border border-amber-300 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 group"
              >
                <Smartphone className="w-5 h-5 text-neutral-950 group-hover:scale-110 transition" />
                <span>Trải Nghiệm ViOne Connect</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1.5 transition" />
              </a>

              <a
                href="/?portal=crm"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-base text-neutral-800 bg-white hover:bg-neutral-50 shadow-lg shadow-neutral-200/60 border border-neutral-200 transition-all flex items-center justify-center gap-2.5"
              >
                <Database className="w-5 h-5 text-amber-700" />
                <span>Quản Trị CRM (163 Tables)</span>
              </a>
            </div>

            {/* Live Telemetry Bar 5.0 */}
            <div id="telemetry" className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
              <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-[#EFE5D0] shadow-xs hover:border-amber-400/60 transition">
                <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
                  <span>HẠ TẦNG CRM</span>
                  <Database className="w-3.5 h-3.5 text-amber-700" />
                </div>
                <div className="text-2xl font-black text-neutral-900 tracking-tight mt-1">163+</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Bảng Schemas Cô Lập</div>
              </div>

              <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-[#EFE5D0] shadow-xs hover:border-amber-400/60 transition">
                <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
                  <span>DANH THIẾP SỐ</span>
                  <Fingerprint className="w-3.5 h-3.5 text-amber-700" />
                </div>
                <div className="text-2xl font-black text-neutral-900 tracking-tight mt-1">1-Chạm</div>
                <div className="text-[11px] text-amber-700 font-semibold mt-0.5">Titanium NFC NTAG216</div>
              </div>

              <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-[#EFE5D0] shadow-xs hover:border-amber-400/60 transition">
                <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
                  <span>MÃ HÓA KẾT NỐI</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-neutral-900 tracking-tight mt-1">SSL 5445</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Cổng Bảo Mật HTTPS</div>
              </div>

              <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-[#EFE5D0] shadow-xs hover:border-amber-400/60 transition">
                <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
                  <span>ĐỒNG BỘ ỨNG DỤNG</span>
                  <Radio className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-neutral-900 tracking-tight mt-1">Realtime</div>
                <div className="text-[11px] text-blue-600 font-semibold mt-0.5">Android APK & iOS IPA</div>
              </div>
            </div>
          </div>

          {/* Interactive 5.0 Cockpit Showcase */}
          <div className="mt-14 relative max-w-5xl mx-auto">
            <div className="rounded-[32px] p-2 sm:p-3 bg-gradient-to-b from-[#F2DFAC] via-[#DFB76C]/30 to-transparent border border-amber-300/80 shadow-2xl shadow-amber-200/20">
              <div className="bg-white rounded-[26px] p-6 sm:p-8 border border-neutral-200/70 overflow-hidden relative">
                {/* 5.0 Tabs switch */}
                <div className="flex flex-wrap items-center justify-center gap-2 pb-6 border-b border-neutral-100">
                  <button
                    onClick={() => setActiveTab("app")}
                    className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeTab === "app"
                        ? "bg-gradient-to-r from-[#FDEABF] via-[#E2BA60] to-[#DFB76C] text-neutral-950 shadow-md shadow-amber-200/50"
                        : "text-neutral-600 hover:text-neutral-900 bg-neutral-100/80"
                    }`}
                  >
                    1. Mạng Xã Hội ViOne Connect
                  </button>
                  <button
                    onClick={() => setActiveTab("crm")}
                    className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeTab === "crm"
                        ? "bg-gradient-to-r from-[#FDEABF] via-[#E2BA60] to-[#DFB76C] text-neutral-950 shadow-md shadow-amber-200/50"
                        : "text-neutral-600 hover:text-neutral-900 bg-neutral-100/80"
                    }`}
                  >
                    2. Web CRM Quản Trị Hợp Nhất (163 Tables)
                  </button>
                  <button
                    onClick={() => setActiveTab("nfc")}
                    className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeTab === "nfc"
                        ? "bg-gradient-to-r from-[#FDEABF] via-[#E2BA60] to-[#DFB76C] text-neutral-950 shadow-md shadow-amber-200/50"
                        : "text-neutral-600 hover:text-neutral-900 bg-neutral-100/80"
                    }`}
                  >
                    3. Danh Thiếp Số Titanium NFC 3D
                  </button>
                </div>

                {/* Tab 1: App View */}
                {activeTab === "app" && (
                  <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-left">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
                        <Smartphone className="w-3.5 h-3.5 text-amber-700" />
                        GIAO THƯƠNG DOANH NHÂN DI ĐỘNG 5.0
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                        Giao Thoa Giữa Mạng Xã Hội & Sàn B2B 5.0
                      </h3>
                      <p className="text-sm text-neutral-600 leading-relaxed">
                        Tích hợp đầy đủ tính năng: Đăng cơ hội hợp tác kinh doanh, bảng tin doanh nhân, nhắn tin đàm phán hợp đồng tức thì, phòng họp ảo kết nối giao thương 1-1, và ví số quản lý ưu đãi thành viên.
                      </p>
                      <ul className="space-y-2.5 text-sm text-neutral-700">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#C29329]" />
                          <span>Mã hóa bảo mật thông tin tài chính & hợp đồng thương vụ</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#C29329]" />
                          <span>Tự động đồng bộ Live Server: không cần cài lại APK khi nâng cấp</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#C29329]" />
                          <span>Hỗ trợ song song Android APK & iOS TestFlight chính thức</span>
                        </li>
                      </ul>
                      <div className="pt-3">
                        <a
                          href="/connect-app"
                          className="inline-flex items-center gap-2 text-sm font-bold text-amber-900 hover:text-amber-700 underline underline-offset-4"
                        >
                          Mở ngay ứng dụng ViOne Connect <ArrowRight className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    <div className="relative flex items-center justify-center p-6 bg-gradient-to-b from-neutral-50 to-amber-50/30 rounded-3xl border border-amber-100">
                      <div className="w-68 h-[450px] bg-neutral-950 rounded-[40px] p-3 shadow-2xl border-4 border-[#D4AF37] relative overflow-hidden flex flex-col justify-between">
                        {/* Mockup screen inside */}
                        <div className="w-full h-full bg-slate-950 rounded-[30px] overflow-hidden text-white flex flex-col justify-between p-4 text-left relative">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-[11px] text-amber-300 font-bold border-b border-white/10 pb-2">
                              <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                                ViOne Connect 5.0
                              </span>
                              <span className="text-[10px] text-slate-400">128 Active Deals</span>
                            </div>
                            <div className="text-sm font-black text-white">Mạng Xã Hội Doanh Nhân</div>
                            <div className="text-[11px] text-slate-400">Cộng đồng C-Level kết nối giao thương</div>
                            <div className="p-3 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-amber-300 uppercase">CƠ HỘI ĐỘC QUYỀN</span>
                                <span className="text-[10px] font-black text-emerald-400">2.5 TỶ VNĐ</span>
                              </div>
                              <div className="text-xs font-semibold text-slate-200">Hợp tác cung ứng vật tư chuỗi F&B toàn quốc</div>
                              <div className="text-[10px] text-slate-400">Đăng bởi: Tập đoàn Khang Thịnh • CEO 1983</div>
                            </div>
                          </div>
                          <a
                            href="/connect-app"
                            className="text-center py-2.5 bg-gradient-to-r from-[#DFB76C] to-[#C29329] text-neutral-950 rounded-xl text-xs font-black shadow hover:brightness-110 transition"
                          >
                            Chạm Để Vào Ứng Dụng
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: CRM View */}
                {activeTab === "crm" && (
                  <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-left">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
                        <Database className="w-3.5 h-3.5 text-amber-700" />
                        HỆ QUẢN TRỊ DOANH NGHIỆP CÔ LẬP
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                        Kế Thừa 100% Sức Mạnh CRM Hiệp Hội CEO 1983
                      </h3>
                      <p className="text-sm text-neutral-600 leading-relaxed">
                        Toàn bộ 163 bảng dữ liệu của CRM quản trị đã được clone độc lập vào cơ sở dữ liệu <strong className="text-neutral-900">vione_standalone_app</strong>. Vận hành trọn vẹn từ quản lý hội viên, chấm điểm tín nhiệm, điểm danh QR Check-in đến thu chi quỹ và tiếp thị tự động.
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-xs text-neutral-700 pt-1">
                        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80">
                          <div className="font-bold text-neutral-900 mb-1 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-amber-700" />
                            Quản Lý Hội Viên
                          </div>
                          <span>Hồ sơ năng lực, phân khúc hội viên, lịch sử đóng quỹ và gia hạn thẻ.</span>
                        </div>
                        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80">
                          <div className="font-bold text-neutral-900 mb-1 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-700" />
                            Sự Kiện & QR Check-in
                          </div>
                          <span>Tạo sự kiện, phát hành vé, quét mã QR check-in hội nghị tức thì.</span>
                        </div>
                        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80">
                          <div className="font-bold text-neutral-900 mb-1 flex items-center gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5 text-amber-700" />
                            Tài Chính & Thu Chi
                          </div>
                          <span>Báo cáo dòng tiền, gói tài trợ thương hiệu, hóa đơn và sao kê quỹ.</span>
                        </div>
                        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80">
                          <div className="font-bold text-neutral-900 mb-1 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                            Phân Quyền Đa Cấp
                          </div>
                          <span>Phân quyền chi tiết Super Admin, Officer, Quản trị viên và Hội viên.</span>
                        </div>
                      </div>
                      <div className="pt-2">
                        <a
                          href="/?portal=crm"
                          className="inline-flex items-center gap-2 text-sm font-bold text-amber-900 hover:text-amber-700 underline underline-offset-4"
                        >
                          Đăng nhập ngay hệ thống Quản Trị CRM <ArrowRight className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {/* CRM Dashboard Mockup */}
                    <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 shadow-xl space-y-3 font-mono text-xs text-white">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
                        <span className="font-bold text-amber-300 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                          ViOne CRM Control Panel 5.0
                        </span>
                        <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                          163 TABLES
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2.5 text-center">
                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                          <div className="text-slate-400 text-[10px]">Hội Viên</div>
                          <div className="text-lg font-black text-amber-300 mt-0.5">31 Active</div>
                        </div>
                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                          <div className="text-slate-400 text-[10px]">Cơ Hội B2B</div>
                          <div className="text-lg font-black text-emerald-400 mt-0.5">128+ Deals</div>
                        </div>
                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                          <div className="text-slate-400 text-[10px]">Database</div>
                          <div className="text-lg font-black text-white mt-0.5">Isolated</div>
                        </div>
                      </div>
                      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2 text-[11px] text-slate-300">
                        <div className="flex justify-between font-semibold">
                          <span className="text-slate-400">Database Schema:</span>
                          <span className="text-emerald-400 font-mono">vione_standalone_app</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Cổng HTTPS SSL:</span>
                          <span className="text-amber-300 font-semibold font-mono">5445 (HTTPS) / 5010</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Mạng Cô Lập:</span>
                          <span className="text-white font-mono">vione-standalone-network</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: NFC 3D View */}
                {activeTab === "nfc" && (
                  <div id="nfc-card" className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-left">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
                        <QrCode className="w-3.5 h-3.5 text-amber-700" />
                        DANH THIẾP TITANIUM THẾ HỆ 5.0
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                        Danh Thiếp Số NFC 1-Chạm — Khẳng Định Đẳng Cấp
                      </h3>
                      <p className="text-sm text-neutral-600 leading-relaxed">
                        Chạm nhẹ vào bất kỳ điện thoại thông minh nào (iPhone / Android) để trao đổi toàn bộ thông tin doanh nghiệp, profile C-Level, danh mục sản phẩm và mở cuộc đàm phán tức thời mà không cần cài thêm ứng dụng phụ.
                      </p>
                      <ul className="space-y-2.5 text-sm text-neutral-700">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#C29329]" />
                          <span>Chip NFC NTAG216 siêu nhạy, độ bền trên 10 năm</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#C29329]" />
                          <span>Tích hợp mã Dynamic QR tự động thay đổi theo bảo mật</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#C29329]" />
                          <span>Đồng bộ tức thì vào danh bạ điện thoại và hệ thống CRM</span>
                        </li>
                      </ul>

                      {/* Interactive Sim Button */}
                      <div className="pt-2 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={triggerNfcSimulation}
                          className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition active:scale-95 cursor-pointer flex items-center gap-2 shadow"
                        >
                          <Fingerprint className="w-4 h-4 text-amber-400" />
                          <span>Chạm Thử NFC (Simulate Tap)</span>
                        </button>
                        <a
                          href="/business-cards"
                          className="text-xs font-bold text-amber-900 hover:text-amber-700 underline underline-offset-4"
                        >
                          Bộ sưu tập thẻ
                        </a>
                      </div>

                      {nfcSimActive && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 font-medium animate-in fade-in">
                          {nfcTapped ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                              Kết nối thành công! Đã truyền toàn bộ danh bạ và đồng bộ vào CRM ViOne.
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                              Đang phát sóng NFC NTAG216... Chạm điện thoại vào thẻ!
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Interactive 3D Card Preview with Tilt */}
                    <div
                      ref={cardRef}
                      onMouseMove={handleCardMouseMove}
                      onMouseLeave={handleCardMouseLeave}
                      style={{ perspective: "1000px" }}
                      className="flex items-center justify-center p-6 cursor-pointer select-none"
                    >
                      <div
                        style={{
                          transform: `rotateX(${cardTilt.rotateX}deg) rotateY(${cardTilt.rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
                          transition: "transform 0.1s ease-out",
                        }}
                        className="w-84 sm:w-92 h-52 sm:h-56 rounded-2xl bg-gradient-to-tr from-[#E6C687] via-[#FFF3D1] to-[#C89B2B] p-[1.5px] shadow-2xl shadow-amber-300/40 relative overflow-hidden"
                      >
                        {/* Shifting Glare Overlay */}
                        <div
                          style={{
                            background: `radial-gradient(circle at ${cardTilt.glareX}% ${cardTilt.glareY}%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
                          }}
                          className="absolute inset-0 pointer-events-none z-20"
                        />

                        <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-black rounded-[15px] p-6 flex flex-col justify-between border border-amber-400/30 relative text-white">
                          {/* Card chip & logo */}
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#DFB76C] to-[#B8860B] flex items-center justify-center text-slate-950 font-black text-base shadow">
                                V
                              </div>
                              <div>
                                <div className="text-xs font-black tracking-wider text-amber-300">VIONE TITANIUM 5.0</div>
                                <div className="text-[9px] text-slate-400 font-semibold tracking-widest uppercase">EXECUTIVE PASS</div>
                              </div>
                            </div>
                            <QrCode className="w-7 h-7 text-amber-300 opacity-90" />
                          </div>

                          {/* Card details */}
                          <div className="space-y-1">
                            <div className="text-sm sm:text-base font-black text-white tracking-wide">
                              NGUYỄN VĂN AN
                            </div>
                            <div className="text-[11px] text-amber-200/90 font-medium">
                              Chủ Tịch HĐQT • ViOne Enterprise
                            </div>
                          </div>

                          {/* NFC Wireless Icon */}
                          <div className="flex justify-between items-center pt-2.5 border-t border-white/10 text-[10px] text-slate-400 font-mono">
                            <span>ID: VN-8899-VIP</span>
                            <span className="font-bold flex items-center gap-1.5 text-amber-300">
                              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> NFC TOUCH 5.0
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Trụ Cột Hợp Nhất 5.0 */}
      <section id="ecosystem" className="py-20 bg-white border-t border-b border-[#EFE7D8] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-xs font-extrabold text-amber-800 tracking-widest uppercase">
              KIẾN TRÚC NỀN TẢNG TOÀN DIỆN
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
              3 Trụ Cột Đột Phá Hợp Nhất Của ViOne
            </h3>
            <p className="text-base text-neutral-600">
              Mọi công cụ mà một doanh nghiệp hoặc hiệp hội cần để vận hành, kết nối giao thương và phát triển bền vững đều hội tụ tại đây.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Pillar 1 */}
            <div className="bg-[#FCFBF8] p-8 rounded-3xl border border-[#EBE1CD] hover:border-[#DFB76C] transition-all hover:shadow-xl hover:shadow-amber-100/50 group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FDF4DF] to-[#EBD28F] flex items-center justify-center text-amber-900 shadow-md shadow-amber-200/50 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-bold text-neutral-900">
                  1. ViOne Connect App
                </h4>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Mạng xã hội di động dành riêng cho giới tinh hoa doanh nhân. Trao đổi cơ hội giao thương, tổ chức sự kiện B2B, đăng ký gian hàng và mở rộng tệp đối tác chiến lược.
                </p>
                <ul className="space-y-2 text-xs text-neutral-700 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-700" /> Bảng tin & Đăng tải thương vụ
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-700" /> Chat đàm phán hợp đồng 1-1
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-700" /> Gian hàng Marketplace 5.0
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <a
                  href="/connect-app"
                  className="text-xs font-bold text-neutral-900 flex items-center gap-1 group-hover:text-amber-800 transition"
                >
                  Mở ứng dụng di động <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-gradient-to-b from-white to-[#FDF8EB] p-8 rounded-3xl border-2 border-[#DFB76C] shadow-xl shadow-amber-200/30 group flex flex-col justify-between relative">
              <div className="absolute -top-3.5 right-6 px-3 py-1 bg-gradient-to-r from-[#DFB76C] to-[#B8860B] text-neutral-950 text-[10px] font-black uppercase rounded-full shadow">
                HỆ QUẢN TRỊ ĐỘC LẬP
              </div>
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#DFB76C] to-[#B8860B] flex items-center justify-center text-neutral-950 shadow-md shadow-amber-300/60 group-hover:scale-110 transition-transform">
                  <Database className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-bold text-neutral-900">
                  2. Enterprise CRM Platform
                </h4>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Kế thừa toàn bộ hệ thống quản trị của CLB CEO 1983 với 163 bảng dữ liệu chuyên sâu. Chạy hoàn toàn trên máy chủ và database riêng biệt, không chịu phụ thuộc.
                </p>
                <ul className="space-y-2 text-xs text-neutral-700 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-700" /> Quản lý hội viên & phân nhóm tự động
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-700" /> Chấm điểm tín nhiệm & tài trợ
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-700" /> Quản lý dòng tiền, hội phí & sao kê
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <a
                  href="/?portal=crm"
                  className="text-xs font-bold text-amber-900 flex items-center gap-1 group-hover:underline transition"
                >
                  Truy cập cổng Quản Trị CRM <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-[#FCFBF8] p-8 rounded-3xl border border-[#EBE1CD] hover:border-[#DFB76C] transition-all hover:shadow-xl hover:shadow-amber-100/50 group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FDF4DF] to-[#EBD28F] flex items-center justify-center text-amber-900 shadow-md shadow-amber-200/50 group-hover:scale-110 transition-transform">
                  <QrCode className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-bold text-neutral-900">
                  3. Danh Thiếp Số Titanium NFC
                </h4>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Thiết bị định danh cao cấp mạ vàng ánh kim. 1 chạm chuyển toàn bộ hồ sơ kinh doanh và lưu danh bạ đối tác ngay trên sân golf, sự kiện hay phòng họp hội đồng.
                </p>
                <ul className="space-y-2 text-xs text-neutral-700 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-700" /> Khắc laser logo doanh nghiệp sang trọng
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-700" /> Dynamic QR dự phòng không cần NFC
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-700" /> Báo cáo thống kê lượt chạm theo ngày
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <a
                  href="/business-cards"
                  className="text-xs font-bold text-neutral-900 flex items-center gap-1 group-hover:text-amber-800 transition"
                >
                  Xem bộ sưu tập thẻ danh thiếp <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CRM Deep Dive Showcase Section */}
      <section id="crm" className="py-20 bg-[#FCFBF8] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#EAE0CB] shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 space-y-6 text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300/80">
                  <Database className="w-3.5 h-3.5 text-amber-800" />
                  HỆ THỐNG CRM QUẢN TRỊ CLONE TỪ HIỆP HỘI CEO 1983
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight leading-snug">
                  Độc Lập Dữ Liệu 100% — Toàn Quyền Kiểm Soát Doanh Nghiệp
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Hệ thống CRM ViOne đã hoàn thành việc nhân bản toàn bộ logic quản trị của Hiệp hội CEO 1983 nhưng chạy trên cơ sở dữ liệu riêng biệt <code className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 font-mono text-xs font-bold border border-amber-200">vione_standalone_app</code> (gồm 163 bảng dữ liệu).
                </p>

                <div className="space-y-3 text-sm">
                  <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-neutral-900">Bảo mật đa cấp độ:</strong> Dữ liệu hội viên và các thương vụ kinh doanh được mã hóa độc lập, không dùng chung database với bất kỳ phân hệ nào.
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-start gap-3">
                    <BarChart3 className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-neutral-900">Báo cáo thời gian thực:</strong> Tự động tính toán doanh thu, phí duy trì hội đồng, tỷ lệ tham gia sự kiện và đối soát hoa hồng giao thương.
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-4">
                  <a
                    href="/?portal=crm"
                    className="px-6 py-3 rounded-xl font-bold text-sm text-neutral-900 bg-gradient-to-r from-[#FDEABF] via-[#E2BA60] to-[#DFB76C] hover:brightness-105 shadow-md shadow-amber-300/40 border border-amber-300 flex items-center gap-2"
                  >
                    <span>Truy Cập Ngay Dashboard CRM</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="/members"
                    className="px-6 py-3 rounded-xl font-semibold text-sm text-neutral-800 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-300 flex items-center gap-2"
                  >
                    <span>Quản Lý Hội Viên</span>
                  </a>
                </div>
              </div>

              {/* CRM Feature Badges Column */}
              <div className="lg:col-span-6 grid grid-cols-2 gap-4 text-left">
                <div className="p-5 bg-[#FCFBF8] rounded-2xl border border-[#E9DEC7] shadow-sm space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-neutral-900">Hội Viên & Công Ty</h4>
                  <p className="text-xs text-neutral-500">Quản lý 360 độ lý lịch kinh doanh, chức vụ, lĩnh vực hoạt động và người đại diện.</p>
                </div>

                <div className="p-5 bg-[#FCFBF8] rounded-2xl border border-[#E9DEC7] shadow-sm space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-neutral-900">Sự Kiện & Check-in</h4>
                  <p className="text-xs text-neutral-500">Tạo lịch hội nghị, điểm danh QR đa luồng, cấp chứng nhận tham gia tự động.</p>
                </div>

                <div className="p-5 bg-[#FCFBF8] rounded-2xl border border-[#E9DEC7] shadow-sm space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                    <Store className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-neutral-900">Sàn Giao Thương</h4>
                  <p className="text-xs text-neutral-500">Kiểm duyệt cơ hội đầu tư, gian hàng sản phẩm và tính toán hoa hồng tiếp thị.</p>
                </div>

                <div className="p-5 bg-[#FCFBF8] rounded-2xl border border-[#E9DEC7] shadow-sm space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-neutral-900">Phân Quyền Admin</h4>
                  <p className="text-xs text-neutral-500">Phân quyền chi tiết cho ban thư ký, ban sự kiện và ban kiểm soát độc lập.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Download Section */}
      <section id="mobile-app" className="py-20 bg-white border-t border-[#EFE7D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-xs font-bold text-amber-800 tracking-widest uppercase">
              CÀI ĐẶT TRÊN THIẾT BỊ CỦA BẠN
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-neutral-900">
              Tải ViOne Connect Cho Android & iOS
            </h3>
            <p className="text-base text-neutral-600">
              Ứng dụng đã được đóng gói sẵn sàng. Cài đặt trực tiếp file APK hoặc tham gia chương trình trải nghiệm sớm qua Apple TestFlight.
            </p>
          </div>

          <div className="mt-12 max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
            {/* Android APK */}
            <div className="bg-[#FCFBF8] p-6 rounded-2xl border-2 border-amber-200/80 shadow-md hover:border-amber-400 transition space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800">
                  FILE APK MỚI NHẤT
                </span>
                <span className="text-xs text-neutral-500 font-mono">v1.0 (3.94 MB)</span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-neutral-900">Android Package (.APK)</h4>
                <p className="text-xs text-neutral-600 mt-1">
                  Đã biên dịch thành công tại thư mục release_apk. Cài đặt ngay lên mọi dòng máy Android.
                </p>
              </div>
              <div className="pt-2">
                <a
                  href="/release_apk/ViOne-Connect-latest.apk"
                  download="ViOne-Connect-latest.apk"
                  className="w-full py-3 rounded-xl font-bold text-sm text-neutral-900 bg-gradient-to-r from-[#FDEABF] via-[#E2BA60] to-[#DFB76C] hover:brightness-105 shadow flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải File Android APK</span>
                </a>
              </div>
            </div>

            {/* iOS TestFlight */}
            <div className="bg-[#FCFBF8] p-6 rounded-2xl border-2 border-amber-200/80 shadow-md hover:border-amber-400 transition space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-100 text-blue-800">
                  TESTFLIGHT / IPA
                </span>
                <span className="text-xs text-neutral-500 font-mono">iOS 16+</span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-neutral-900">Apple iOS (iPhone / iPad)</h4>
                <p className="text-xs text-neutral-600 mt-1">
                  Bundle ID: <code className="font-mono text-neutral-800 font-bold">ViOneBusinessConnect</code>. Tải trực tiếp qua hệ thống Apple TestFlight.
                </p>
              </div>
              <div className="pt-2">
                <a
                  href="https://appstoreconnect.apple.com/apps/6810608093/testflight/ios"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-xl font-bold text-sm text-neutral-800 bg-white hover:bg-neutral-50 border border-neutral-300 shadow-sm flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4 text-amber-700" />
                  <span>Mở Apple TestFlight</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#EFE7D8] pt-14 pb-10 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-neutral-100">
            {/* Col 1: Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#DFB76C] to-[#B8860B] flex items-center justify-center text-white font-extrabold text-sm shadow">
                  V
                </div>
                <span className="font-extrabold text-lg text-neutral-900">ViOne Platform</span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Hệ điều hành kết nối doanh nghiệp & Mạng xã hội doanh nhân đẳng cấp. Vận hành độc lập trên nền tảng đám mây và database cô lập.
              </p>
              <div className="text-[11px] text-neutral-500">
                Website: <a href="https://viconnect.vn" className="text-amber-800 font-semibold underline">viconnect.vn</a>
              </div>
            </div>

            {/* Col 2: Phân hệ */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-sm text-neutral-900 mb-2">Phân Hệ Nền Tảng</div>
              <div><a href="/connect-app" className="text-neutral-600 hover:text-amber-800">ViOne Connect App</a></div>
              <div><a href="/?portal=crm" className="text-neutral-600 hover:text-amber-800">Enterprise CRM Portal</a></div>
              <div><a href="/business-cards" className="text-neutral-600 hover:text-amber-800">Danh Thiếp Titanium NFC</a></div>
              <div><a href="/marketplace" className="text-neutral-600 hover:text-amber-800">Marketplace 5.0</a></div>
            </div>

            {/* Col 3: Quản trị CRM */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-sm text-neutral-900 mb-2">Mô-đun Quản Trị</div>
              <div><a href="/members" className="text-neutral-600 hover:text-amber-800">Quản Lý Hội Viên</a></div>
              <div><a href="/events" className="text-neutral-600 hover:text-amber-800">Tổ Chức Sự Kiện & Check-in</a></div>
              <div><a href="/opportunities" className="text-neutral-600 hover:text-amber-800">Cơ Hội Giao Thương B2B</a></div>
              <div><a href="/platform" className="text-neutral-600 hover:text-amber-800">Phân Quyền & Hạ Tầng</a></div>
            </div>

            {/* Col 4: Hỗ trợ & Kỹ thuật */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-sm text-neutral-900 mb-2">Hạ Tầng Kỹ Thuật</div>
              <div className="text-neutral-600">Máy chủ: 14.225.217.232</div>
              <div className="text-neutral-600">Cổng HTTPS SSL: 5445</div>
              <div className="text-neutral-600">Database: vione_standalone_app</div>
              <div className="text-neutral-600">Bảo mật: SSL 256-bit Encrypted</div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
            <div>
              © 2026 ViOne Platform & ViConnect.vn. Bản quyền thuộc về hệ sinh thái doanh nhân ViOne.
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-neutral-900">Điều khoản sử dụng</a>
              <a href="#" className="hover:text-neutral-900">Chính sách bảo mật</a>
              <a href="#" className="hover:text-neutral-900">Hỗ trợ kỹ thuật</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
