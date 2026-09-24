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
  PhoneCall,
  Mail,
  Globe2,
  Flame,
  Clock,
  Compass,
} from "lucide-react";

export function ViOneGoldWhiteLanding() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"app" | "crm" | "nfc">("app");
  const [typingIndex, setTypingIndex] = useState(0);
  const [nfcSimActive, setNfcSimActive] = useState(false);
  const [nfcTapped, setNfcTapped] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  // 3D Card Tilt state
  const [cardTilt, setCardTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const cardRef = useRef<HTMLDivElement>(null);

  const morphingWords = [
    "Doanh Nhân Tinh Hoa 5.0",
    "Danh Thiếp Titanium NFC 1-Chạm",
    "Hệ Thống CRM Hợp Nhất 163 Bảng",
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
    setContactSaved(false);
    setTimeout(() => {
      setNfcTapped(true);
      setTimeout(() => {
        setContactSaved(true);
        setTimeout(() => {
          setNfcSimActive(false);
        }, 4000);
      }, 1000);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-neutral-900 font-sans selection:bg-[#25AAE1]/30 selection:text-[#2E3192] overflow-x-hidden relative">
      {/* Ambient Brand Blue & Cyan Glows (Navy #2E3192 & Cyan #25AAE1) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-gradient-to-b from-[#25AAE1]/15 via-[#2E3192]/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-80 right-[-150px] w-[500px] h-[500px] bg-[#25AAE1]/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute top-[800px] left-[-150px] w-[500px] h-[500px] bg-[#2E3192]/8 blur-3xl rounded-full pointer-events-none" />

      {/* Top Banner Thông Báo 5.0 (Navy #2E3192 + Cyan #25AAE1 + Orange #F7941D) */}
      <div className="bg-gradient-to-r from-[#19194D] via-[#2E3192] to-[#19194D] text-white text-xs font-semibold py-2.5 px-4 text-center tracking-wide flex items-center justify-center gap-2 border-b border-[#25AAE1]/30 relative z-50 shadow-md">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F7941D] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F7941D]"></span>
        </span>
        <span className="bg-gradient-to-r from-sky-200 via-sky-100 to-white bg-clip-text text-transparent font-black tracking-wider">
          VIONE PLATFORM 5.0
        </span>
        <span className="text-white/40 hidden sm:inline">•</span>
        <span className="text-sky-100 hidden sm:inline">
          HỆ ĐIỀU HÀNH KẾT NỐI DOANH NGHIỆP & CRM 163 BẢNG DỮ LIỆU CÔ LẬP
        </span>
        <a
          href="/association/login"
          className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#F7941D] hover:bg-[#E68310] px-3 py-0.5 text-[11px] font-black text-white transition shadow-sm"
        >
          Trải nghiệm ngay <ArrowRight className="w-3 h-3" />
        </a>
      </div>

      {/* Navigation Bar 5.0 */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo ViOne */}
          <a href="/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2E3192] to-[#25AAE1] p-[2px] shadow-md shadow-[#2E3192]/25 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-[#2E3192] rounded-[14px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#25AAE1]/40 to-transparent" />
                <span className="font-black text-2xl text-white tracking-tighter">
                  V
                </span>
                <span className="absolute bottom-1 right-1.5 h-1.5 w-1.5 rounded-full bg-[#F7941D]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-[#2E3192]">
                  ViOne<span className="text-[#25AAE1]">Connect</span>
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#25AAE1]/15 text-[#2E3192] border border-[#25AAE1]/40 uppercase tracking-widest">
                  OS 5.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                Business Connection OS & CRM
              </p>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700">
            <a
              href="#ecosystem"
              className="hover:text-[#2E3192] transition duration-200 flex items-center gap-1.5"
            >
              <span>Hệ Sinh Thái</span>
            </a>
            <a
              href="#crm"
              className="hover:text-[#2E3192] transition duration-200 flex items-center gap-1.5"
            >
              <span>Quản Trị CRM</span>
              <span className="text-[9.5px] font-extrabold bg-blue-50 text-[#2E3192] px-1.5 py-0.2 rounded-full border border-[#25AAE1]/30">
                163 Tables
              </span>
            </a>
            <a
              href="#mobile-app"
              className="hover:text-[#2E3192] transition duration-200 flex items-center gap-1.5"
            >
              <span>Mobile App</span>
            </a>
            <a
              href="#nfc-card"
              className="hover:text-[#2E3192] transition duration-200 flex items-center gap-1.5"
            >
              <span>Danh Thiếp NFC</span>
            </a>
            <a
              href="#comparison"
              className="hover:text-[#2E3192] transition duration-200 flex items-center gap-1.5"
            >
              <span>So Sánh</span>
            </a>
          </nav>

          {/* Action CTAs: Navy Outline & Brand Orange CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="/association/login"
              className="px-4 py-2.5 text-sm font-bold text-[#2E3192] bg-blue-50/80 hover:bg-blue-100/80 rounded-xl border border-[#2E3192]/20 transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Database className="w-4 h-4 text-[#2E3192]" />
              <span>Đăng Nhập CRM</span>
            </a>
            <a
              href="/association/login"
              className="px-5 py-2.5 text-sm font-bold text-white bg-[#F7941D] hover:bg-[#E68310] rounded-xl border border-amber-600/30 shadow-md shadow-[#F7941D]/25 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Smartphone className="w-4 h-4 text-white" />
              <span>Vào ViOne App</span>
            </a>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden p-2 rounded-xl text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
          >
            {mobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileNavOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white/98 backdrop-blur-xl px-5 pt-3 pb-6 space-y-3 animate-in slide-in-from-top duration-200">
            <a
              href="#ecosystem"
              onClick={() => setMobileNavOpen(false)}
              className="block py-2 text-base font-semibold text-slate-800 hover:text-[#2E3192]"
            >
              Hệ Sinh Thái ViOne 5.0
            </a>
            <a
              href="#crm"
              onClick={() => setMobileNavOpen(false)}
              className="block py-2 text-base font-semibold text-slate-800 hover:text-[#2E3192]"
            >
              Hệ Thống CRM Cô Lập (163 Tables)
            </a>
            <a
              href="#mobile-app"
              onClick={() => setMobileNavOpen(false)}
              className="block py-2 text-base font-semibold text-slate-800 hover:text-[#2E3192]"
            >
              Ứng Dụng Di Động ViOne Connect
            </a>
            <a
              href="#nfc-card"
              onClick={() => setMobileNavOpen(false)}
              className="block py-2 text-base font-semibold text-slate-800 hover:text-[#2E3192]"
            >
              Danh Thiếp Titanium NFC 1-Chạm
            </a>
            <div className="pt-2 flex flex-col gap-2.5">
              <a
                href="/association/login"
                className="w-full text-center py-2.5 rounded-xl border border-[#2E3192]/30 font-bold text-sm text-[#2E3192] bg-blue-50/60"
              >
                Vào Hệ Thống CRM
              </a>
              <a
                href="/association/login"
                className="w-full text-center py-3 rounded-xl font-bold text-sm text-white bg-[#F7941D] hover:bg-[#E68310] shadow-md shadow-[#F7941D]/25"
              >
                Mở ViOne Connect App
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section 5.0 */}
      <section className="relative pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Cột trái: Headline & CTAs */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              {/* 5.0 Futuristic Pill Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-50/80 backdrop-blur-md border border-[#25AAE1]/30 shadow-xs text-xs font-bold text-[#2E3192] hover:border-[#25AAE1] transition cursor-default">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F7941D] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F7941D]"></span>
                </span>
                <span className="font-black tracking-wider text-[#2E3192]">VIONE 5.0 NEXT-GEN</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-semibold">HỆ ĐIỀU HÀNH KẾT NỐI KINH DOANH & CRM CÔ LẬP</span>
              </div>

              {/* Main Headline with Kinetic Streaming Text */}
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.16]">
                Chuyển Đổi Số Giao Thương Cho{" "}
                <span className="block mt-2 min-h-[1.25em]">
                  <span className="inline-block relative">
                    <span className="bg-gradient-to-r from-[#2E3192] via-[#25AAE1] to-[#2E3192] bg-clip-text text-transparent transition-all duration-500 drop-shadow-xs font-black">
                      {morphingWords[typingIndex]}
                    </span>
                    <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-[#2E3192] via-[#25AAE1] to-[#F7941D] rounded-full" />
                  </span>
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Giải pháp kép đột phá: <strong className="text-[#2E3192] font-bold">Thẻ Danh Thiếp Titanium NFC 1-Chạm</strong> kết hợp <strong className="text-[#25AAE1] font-bold">Ứng Dụng Di Động ViOne</strong> và <strong className="text-slate-900 font-bold">Nền Tảng Enterprise CRM</strong> (163 bảng dữ liệu cô lập đa doanh nghiệp).
              </p>

              {/* Hero CTAs: Brand Orange & Navy */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  type="button"
                  onClick={triggerNfcSimulation}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl font-black text-sm sm:text-base text-white bg-[#F7941D] hover:bg-[#E68310] hover:shadow-xl hover:shadow-[#F7941D]/30 border border-amber-600/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 group cursor-pointer active:scale-95"
                >
                  <Zap className="w-5 h-5 text-white group-hover:scale-110 transition" />
                  <span>Chạm Thử Thẻ NFC 1-Chạm</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1.5 transition" />
                </button>

                <a
                  href="/association/login"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl font-bold text-sm sm:text-base text-[#2E3192] bg-white hover:bg-blue-50 shadow-md shadow-slate-200/80 border border-[#2E3192]/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
                >
                  <Smartphone className="w-5 h-5 text-[#25AAE1]" />
                  <span>Vào Ứng Dụng ViOne</span>
                </a>
              </div>

              {/* Live Telemetry Bar 5.0 */}
              <div id="telemetry" className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#25AAE1] transition">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>HẠ TẦNG CRM</span>
                    <Database className="w-3.5 h-3.5 text-[#2E3192]" />
                  </div>
                  <div className="text-xl font-black text-[#2E3192] tracking-tight mt-1">163+</div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Bảng Schemas Cô Lập</div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#25AAE1] transition">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>DANH THIẾP SỐ</span>
                    <Fingerprint className="w-3.5 h-3.5 text-[#25AAE1]" />
                  </div>
                  <div className="text-xl font-black text-[#25AAE1] tracking-tight mt-1">1-Chạm</div>
                  <div className="text-[11px] text-slate-600 font-semibold mt-0.5">Titanium NFC NTAG216</div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#25AAE1] transition">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>MÃ HÓA BẢO MẬT</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-xl font-black text-slate-800 tracking-tight mt-1">SSL 5445</div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Cổng HTTPS An Toàn</div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#25AAE1] transition">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>ĐỒNG BỘ APP</span>
                    <Radio className="w-3.5 h-3.5 text-[#F7941D]" />
                  </div>
                  <div className="text-xl font-black text-[#F7941D] tracking-tight mt-1">Realtime</div>
                  <div className="text-[11px] text-slate-600 font-semibold mt-0.5">Android APK & iOS IPA</div>
                </div>
              </div>
            </div>

            {/* Cột phải: 3D Titanium NFC Card Simulator (Navy #2E3192 + Cyan #25AAE1 + Orange #F7941D) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div
                ref={cardRef}
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
                onClick={triggerNfcSimulation}
                style={{
                  transform: `perspective(1000px) rotateX(${cardTilt.rotateX}deg) rotateY(${cardTilt.rotateY}deg)`,
                  transition: "transform 0.15s ease-out",
                }}
                className="relative w-full max-w-[420px] aspect-[1.58/1] rounded-2xl cursor-pointer group select-none shadow-2xl shadow-[#2E3192]/20"
              >
                {/* Aura Glow */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-[#2E3192] via-[#25AAE1] to-[#F7941D] rounded-3xl blur-lg opacity-40 group-hover:opacity-75 transition-opacity" />

                {/* Card Surface */}
                <div className="relative w-full h-full bg-gradient-to-br from-[#19194D] via-[#2E3192] to-[#0A192F] rounded-2xl p-6 text-white overflow-hidden border border-[#25AAE1]/40 flex flex-col justify-between">
                  {/* Subtle Geometric Circuits in Cyan */}
                  <svg className="absolute -right-10 -bottom-10 w-64 h-64 opacity-15 pointer-events-none" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="40" stroke="#25AAE1" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
                    <circle cx="100" cy="100" r="70" stroke="#25AAE1" strokeWidth="1" fill="none" />
                    <circle cx="100" cy="100" r="95" stroke="#25AAE1" strokeWidth="1.5" fill="none" />
                  </svg>

                  {/* Top Bar */}
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-sm">
                        V
                      </div>
                      <div>
                        <span className="text-[11px] font-black tracking-widest text-[#25AAE1] uppercase block">
                          VIONE TITANIUM NFC
                        </span>
                        <span className="text-[9px] text-slate-300 font-medium">BUSINESS CONNECTION OS</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-mono text-white">
                      <Zap className="w-3 h-3 text-[#F7941D]" />
                      <span>1-TOUCH</span>
                    </div>
                  </div>

                  {/* Middle: NFC Chip & Waves */}
                  <div className="relative z-10 my-auto flex items-center justify-between">
                    <div>
                      {/* Metallic Chip */}
                      <div className="w-11 h-8 rounded-lg bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/80 shadow-md mb-2 flex items-center justify-center opacity-95">
                        <div className="w-7 h-5 border border-amber-900/40 rounded-xs grid grid-cols-2 gap-0.5 p-0.5">
                          <div className="bg-amber-700/30 rounded-xs" />
                          <div className="bg-amber-700/30 rounded-xs" />
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-[#25AAE1] font-semibold tracking-wider">
                        EXECUTIVE DIGITAL CARD
                      </div>
                      <div className="text-xl font-black text-white tracking-wide uppercase">
                        VŨ MINH KHÁNH
                      </div>
                      <div className="text-[12px] text-sky-200 font-medium">
                        Chủ Tịch HĐQT • ViOne Global
                      </div>
                    </div>

                    {/* QR Code Mini */}
                    <div className="p-1.5 rounded-xl bg-white text-slate-950 shadow-md">
                      <QrCode className="w-10 h-10" />
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/15 text-[10px] font-mono text-slate-300">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-ping" />
                      ID: VIONE-VIP-8888
                    </span>
                    <span className="text-[#F7941D] font-bold">Chạm để chia sẻ tức thì →</span>
                  </div>

                  {/* Interactive Glare */}
                  <div
                    style={{
                      background: `radial-gradient(circle at ${cardTilt.glareX}% ${cardTilt.glareY}%, rgba(255,255,255,0.25) 0%, transparent 60%)`,
                    }}
                    className="absolute inset-0 pointer-events-none"
                  />
                </div>
              </div>

              {/* Gợi ý tương tác */}
              <p className="mt-4 text-xs font-mono font-semibold text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#F7941D]" />
                Rê chuột tạo hiệu ứng 3D & Chạm để mô phỏng truyền danh bạ
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modal Mô Phỏng Chạm Thẻ NFC 1-Chạm Sang Điện Thoại */}
      {nfcSimActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-200 relative overflow-hidden">
            <button
              onClick={() => setNfcSimActive(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {!contactSaved ? (
              <div className="py-8 space-y-4">
                <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-[#25AAE1]/20 animate-ping" />
                  <div className="absolute inset-2 rounded-full bg-[#2E3192]/20 animate-pulse" />
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-[#2E3192] to-[#25AAE1] flex items-center justify-center text-white shadow-xl">
                    <Zap className="w-8 h-8 text-[#F7941D] animate-bounce" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-[#2E3192]">
                  ĐANG KẾT NỐI SÓNG NFC 1-TOUCH...
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Đang truyền tải hồ sơ danh thiếp số thông minh từ thẻ Titanium sang thiết bị di động của đối tác không cần cài app.
                </p>
              </div>
            ) : (
              <div className="py-4 space-y-5 animate-in zoom-in-95 duration-300">
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-md">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    ĐÃ TRUYỀN DANH THIẾP THÀNH CÔNG!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Hồ sơ doanh nghiệp & danh bạ đã sẵn sàng lưu vào điện thoại
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/70 border border-[#2E3192]/20 text-left space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#2E3192] to-[#25AAE1] text-white flex items-center justify-center font-bold text-lg">
                      VMK
                    </div>
                    <div>
                      <div className="font-black text-sm text-[#2E3192]">VŨ MINH KHÁNH</div>
                      <div className="text-xs text-slate-600">Chủ Tịch HĐQT • ViOne Global</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <PhoneCall className="w-3.5 h-3.5 text-[#25AAE1]" />
                      <span>0988 888 888</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-[#F7941D]" />
                      <span>ceo@vione.vn</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setNfcSimActive(false)}
                    className="flex-1 py-3 rounded-xl bg-[#2E3192] hover:bg-[#19194D] text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    Lưu Vào Danh Bạ Điện Thoại (.VCF)
                  </button>
                  <button
                    onClick={() => setNfcSimActive(false)}
                    className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Counter & Metrics (Thống Kê Thực Tế) */}
      <section className="relative z-10 py-14 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                num: "10,000+",
                label: "Doanh Nhân & Lãnh Đạo Cấp Cao",
                desc: "Sử dụng thẻ ViOne kết nối mỗi ngày",
                icon: Users,
                color: "text-[#2E3192]",
              },
              {
                num: "500+",
                label: "Hiệp Hội & Câu Lạc Bộ Doanh Nghiệp",
                desc: "Quản trị danh bạ số & check-in sự kiện",
                icon: Building2,
                color: "text-[#25AAE1]",
              },
              {
                num: "2,500,000+",
                label: "Lượt Chạm Danh Thiếp NFC",
                desc: "Chia sẻ dữ liệu B2B không khoảng cách",
                icon: Zap,
                color: "text-[#F7941D]",
              },
              {
                num: "99.8%",
                label: "Tỷ Lệ Đối Tác Hài Lòng",
                desc: "Gia tăng 3.8x tỷ lệ phản hồi kinh doanh",
                icon: Award,
                color: "text-emerald-600",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-[#25AAE1] transition-all transform hover:-translate-y-1 text-center sm:text-left"
              >
                <div className={`p-2.5 rounded-xl bg-blue-50/80 w-fit mx-auto sm:mx-0 mb-3 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
                  {stat.num}
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 mt-1">
                  {stat.label}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {stat.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Tứ Đại Trụ Cột Nền Tảng ViOne (4 Core Pillars) */}
      <section id="ecosystem" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold font-mono tracking-wider bg-blue-50 text-[#2E3192] border border-[#25AAE1]/30 uppercase">
              TỨ ĐẠI TRỤ CỘT HỆ SINH THÁI
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tight">
              Giải Pháp Toàn Diện Cho Doanh Nghiệp & Hiệp Hội
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-[#2E3192] via-[#25AAE1] to-[#F7941D] rounded-full mx-auto" />
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
              Không chỉ là danh thiếp điện tử, ViOne mang đến giải pháp chuyển đổi số khép kín từ khâu kết nối giao tiếp đến quản trị dữ liệu CRM và xúc tiến thương mại B2B.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Thẻ Danh Thiếp Titanium NFC",
                badge: "CHẠM 1 GIÂY",
                desc: "Chia sẻ danh thiếp số chuyên nghiệp chỉ bằng một cú chạm nhẹ vào điện thoại đối tác. Không cần cài ứng dụng, cập nhật thông tin không giới hạn trọn đời.",
                features: ["Tích hợp danh bạ VCF 1-click", "Portfolio & Profile PDF", "Mạng xã hội & Video giới thiệu"],
                icon: Fingerprint,
                badgeBg: "bg-blue-50 text-[#2E3192] border-[#2E3192]/30",
                iconColor: "text-[#2E3192]",
              },
              {
                title: "Hệ Thống CRM 163 Bảng Cô Lập",
                badge: "QUẢN TRỊ DOANH NGHIỆP",
                desc: "Hệ thống CRM chuyên sâu với 163 schema bảng dữ liệu được cô lập tuyệt đối cho từng doanh nghiệp. Lưu trữ lịch sử giao thương, phễu bán hàng và nhắc việc tự động.",
                features: ["Tự động lưu contact sau chạm thẻ", "Phân nhóm khách hàng & Lead", "Quản lý hợp đồng & doanh thu"],
                icon: Database,
                badgeBg: "bg-sky-50 text-[#25AAE1] border-[#25AAE1]/30",
                iconColor: "text-[#25AAE1]",
              },
              {
                title: "Nền Tảng Hiệp Hội & Sự Kiện",
                badge: "SỐ HÓA HIỆP HỘI",
                desc: "Quản trị danh bạ hội viên thông minh cho các CLB Doanh nghiệp. Hệ thống Check-in QR chống gian lận, biểu quyết trực tuyến minh bạch và bảng tin hoạt động.",
                features: ["Check-in QR sự kiện 1 giây", "Biểu quyết số minh bạch", "Cổng thông tin & danh bạ hội viên"],
                icon: Building2,
                badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-300",
                iconColor: "text-emerald-600",
              },
              {
                title: "Sàn Giao Thương B2B Thực Chất",
                badge: "KẾT NỐI DOANH SỐ",
                desc: "Đăng tải nhu cầu mua - bán, tìm kiếm nhà cung ứng uy tín và ký kết thương vụ ngay trong cộng đồng doanh nhân xác thực. Mở rộng chuỗi cung ứng khép kín.",
                features: ["Đăng nhu cầu mua/bán B2B", "Khớp lệnh đối tác tự động", "Bảo chứng uy tín từ hiệp hội"],
                icon: Store,
                badgeBg: "bg-amber-50 text-[#F7941D] border-[#F7941D]/30",
                iconColor: "text-[#F7941D]",
              },
            ].map((pillar, i) => (
              <div
                key={i}
                className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm hover:border-[#25AAE1] hover:shadow-xl hover:shadow-[#2E3192]/10 transition-all transform hover:-translate-y-1.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl bg-blue-50/80 ${pillar.iconColor}`}>
                      <pillar.icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase ${pillar.badgeBg}`}>
                      {pillar.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    {pillar.desc}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  {pillar.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#25AAE1] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Trải Nghiệm Đa Nền Tảng (Cockpit Showcase) */}
      <section id="crm" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[32px] p-2 sm:p-3 bg-gradient-to-b from-[#2E3192]/20 via-[#25AAE1]/15 to-transparent border border-[#25AAE1]/40 shadow-xl">
            <div className="bg-white rounded-[26px] p-6 sm:p-10 border border-slate-200 overflow-hidden">
              {/* Tabs Switch */}
              <div className="flex flex-wrap items-center justify-center gap-2 pb-8 border-b border-slate-200">
                {[
                  { id: "app", label: "1. Ứng Dụng Di Động ViOne", icon: Smartphone },
                  { id: "crm", label: "2. Hệ Thống Web CRM (163 Tables)", icon: Database },
                  { id: "nfc", label: "3. Bộ Sưu Tập Thẻ Titanium NFC", icon: Fingerprint },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-[#2E3192] text-white shadow-md shadow-[#2E3192]/25"
                        : "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab 1: App View */}
              {activeTab === "app" && (
                <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-10 items-center text-left">
                  <div className="space-y-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#2E3192] text-xs font-bold border border-[#2E3192]/30">
                      <Smartphone className="w-3.5 h-3.5 text-[#25AAE1]" />
                      ỨNG DỤNG DI ĐỘNG NATIVE VI ONE
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      Mạng Xã Hội Doanh Nhân & Sàn Giao Thương B2B Trên Điện Thoại
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Ứng dụng ViOne Connect mang lại trải nghiệm tiện ích vượt bậc: quét danh thiếp giấy bằng AI OCR, check-in sự kiện 1 giây, trao đổi cơ hội kinh doanh và trợ lý giọng nói AI điều hướng thông minh.
                    </p>
                    <ul className="space-y-3 text-sm text-slate-700">
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#2E3192]" />
                        <span>Trợ lý điều hướng giọng nói AI thông minh độc quyền</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#25AAE1]" />
                        <span>Quét danh thiếp giấy truyền thống lưu danh bạ tức thì</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#F7941D]" />
                        <span>Hỗ trợ cả Android (Google Play & APK) và iOS (App Store)</span>
                      </li>
                    </ul>
                    <div className="pt-2">
                      <a
                        href="/association/login"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F7941D] hover:bg-[#E68310] text-white font-bold text-sm shadow-md transition active:scale-95 cursor-pointer"
                      >
                        Khám phá ViOne App ngay <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  <div className="relative flex items-center justify-center p-6 bg-gradient-to-b from-blue-50/50 to-slate-100 rounded-3xl border border-slate-200">
                    <div className="w-68 h-[440px] bg-slate-950 rounded-[40px] p-3 shadow-2xl border-4 border-[#2E3192] relative overflow-hidden flex flex-col justify-between">
                      <div className="w-full h-full bg-slate-900 rounded-[30px] overflow-hidden text-white flex flex-col justify-between p-4 text-left relative">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[11px] text-sky-300 font-bold border-b border-white/10 pb-2">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                              ViOne App 5.0
                            </span>
                            <span className="text-[10px] text-slate-400">128 Cơ Hội Mới</span>
                          </div>
                          <div className="text-sm font-black text-white">Mạng Xã Hội Doanh Nhân</div>
                          <div className="text-[11px] text-slate-400">Kết nối & xúc tiến thương mại C-Level</div>
                          <div className="p-3 rounded-2xl bg-slate-800/90 border border-[#25AAE1]/30 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-[#F7941D] uppercase">CƠ HỘI ĐỘC QUYỀN</span>
                              <span className="text-[10px] font-black text-emerald-400">2.5 TỶ VNĐ</span>
                            </div>
                            <div className="text-xs font-semibold text-slate-200">Cung ứng vật tư dự án F&B toàn quốc</div>
                            <div className="text-[10px] text-slate-400">Đăng bởi: Tập đoàn Khang Thịnh • CEO 1983</div>
                          </div>
                        </div>
                        <a
                          href="/association/login"
                          className="text-center py-2.5 bg-[#F7941D] text-white rounded-xl text-xs font-black shadow hover:bg-[#E68310] transition"
                        >
                          Mở App Trải Nghiệm →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: CRM View */}
              {activeTab === "crm" && (
                <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-10 items-center text-left">
                  <div className="space-y-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#2E3192] text-xs font-bold border border-[#2E3192]/30">
                      <Database className="w-3.5 h-3.5 text-[#2E3192]" />
                      ENTERPRISE CRM CLOUD
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      Cơ Sở Dữ Liệu 163 Bảng Cô Lập & Tự Động Hóa Bán Hàng
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Mỗi doanh nghiệp sở hữu một tenant schema cô lập hoàn toàn, đảm bảo tính bảo mật dữ liệu cấp ngân hàng. Tự động hóa tiếp nhận khách hàng từ cú chạm danh thiếp đầu tiên đến giai đoạn chốt hợp đồng.
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="font-bold text-[#2E3192]">Bảo Mật Schema Cô Lập</div>
                        <div className="text-slate-500 mt-0.5">Không trộn lẫn dữ liệu giữa các doanh nghiệp</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="font-bold text-[#25AAE1]">Phân Tích Dashboard 360°</div>
                        <div className="text-slate-500 mt-0.5">Biểu đồ doanh thu & tỷ lệ chuyển đổi realtime</div>
                      </div>
                    </div>
                    <div className="pt-2">
                      <a
                        href="/association/login"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2E3192] hover:bg-[#19194D] text-white font-bold text-sm shadow-md transition cursor-pointer"
                      >
                        Đăng Nhập Cổng CRM <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-xs font-mono text-slate-400 ml-2">crm.vione.vn/dashboard</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                        163 Tables Online
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-800">
                        <div className="text-slate-400 text-[10px]">Tổng Khách Hàng</div>
                        <div className="text-base font-bold text-white mt-0.5">1,420</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-800">
                        <div className="text-slate-400 text-[10px]">Giao Thương Tháng</div>
                        <div className="text-base font-bold text-emerald-400 mt-0.5">18.6 Tỷ</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-800">
                        <div className="text-slate-400 text-[10px]">Tỷ Lệ Chốt Sale</div>
                        <div className="text-base font-bold text-[#F7941D] mt-0.5">42.8%</div>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs space-y-2">
                      <div className="text-[11px] font-bold text-[#25AAE1]">QUY TRÌNH TỰ ĐỘNG HÓA PIPELINE</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <span>Chạm Thẻ NFC → Thu Thập Lead</span>
                        <span className="text-emerald-400 font-bold">100% Tự động</span>
                      </div>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-[#2E3192] to-[#25AAE1] h-full w-4/5" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: NFC Cards View */}
              {activeTab === "nfc" && (
                <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-10 items-center text-left">
                  <div className="space-y-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-[#F7941D] text-xs font-bold border border-[#F7941D]/30">
                      <Fingerprint className="w-3.5 h-3.5 text-[#F7941D]" />
                      BỘ SƯU TẬP THẺ CHẾ TÁC CAO CẤP
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      Đẳng Cấp Thượng Lưu — Công Nghệ NFC Không Tiếp Xúc
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Chế tác từ Titanium nguyên khối, mạ khắc laser tinh xảo kết hợp chip NTAG216 tốc độ phản hồi 0.1s. Chống nước tuyệt đối, bảo mật chống sao chép và độ bền lên tới hơn 10 năm.
                    </p>
                    <div className="space-y-2.5 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2E3192]" />
                        <span>Thẻ Kim Loại Titanium Đen / Xanh Navy Doanh Nhân</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#25AAE1]" />
                        <span>Thẻ Gỗ Sinh Thái Tự Nhiên Thân Thiện Môi Trường</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#F7941D]" />
                        <span>Thẻ dán NFC Touch Tag gắn lưng điện thoại tiện dụng</span>
                      </div>
                    </div>
                    <div className="pt-2">
                      <a
                        href="/association/login"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F7941D] hover:bg-[#E68310] text-white font-bold text-sm shadow-md transition cursor-pointer"
                      >
                        Đặt Hàng Thẻ Theo Yêu Cầu <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  <div className="p-8 rounded-3xl bg-gradient-to-br from-[#19194D] to-[#2E3192] text-white text-center shadow-xl border border-[#25AAE1]/40 space-y-4">
                    <div className="text-xs font-mono tracking-widest text-[#25AAE1] uppercase">
                      CHIP NXP NTAG216 CHÍNH HÃNG
                    </div>
                    <div className="text-3xl font-black text-white">0.1 GIÂY PHẢN HỒI</div>
                    <p className="text-xs text-slate-300 max-w-sm mx-auto">
                      Tương thích 100% các dòng iPhone từ Xs/Xr đến iPhone 16 Pro Max và mọi điện thoại Android có NFC trên toàn cầu.
                    </p>
                    <div className="pt-2 flex justify-center gap-3">
                      <div className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-mono">100k+ Lượt Ghi</div>
                      <div className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-mono">Kháng Nước IP68</div>
                      <div className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-mono">10 Năm Độ Bền</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: So Sánh Thẻ Giấy Truyền Thống vs Danh Thiếp Số ViOne */}
      <section id="comparison" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold font-mono tracking-wider bg-blue-50 text-[#2E3192] border border-[#25AAE1]/30 uppercase">
              BẢNG SO SÁNH NĂNG LỰC
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight">
              Tại Sao Doanh Nhân Đều Chuyển Sang Thẻ ViOne?
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-[#2E3192] via-[#25AAE1] to-[#F7941D] rounded-full mx-auto" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Tiêu Chí Đánh Giá</th>
                  <th className="py-4 px-6 text-slate-400">Danh Thiếp Giấy Cũ</th>
                  <th className="py-4 px-6 text-[#2E3192] bg-blue-50/60 font-black">Danh Thiếp ViOne 5.0</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  {
                    crit: "Trải nghiệm kết nối",
                    paper: "Phải gõ từng số điện thoại để lưu",
                    vione: "Chạm 1 giây lưu ngay vào danh bạ điện thoại",
                  },
                  {
                    crit: "Cập nhật thông tin",
                    paper: "Phải vứt bỏ và in lại toàn bộ khi đổi chức vụ/SĐT",
                    vione: "Cập nhật online tức thì, thay đổi không giới hạn",
                  },
                  {
                    crit: "Tích hợp hồ sơ năng lực",
                    paper: "Chỉ in được họ tên, chức danh và địa chỉ",
                    vione: "Đính kèm Profile PDF, Catalogue, Video, Mạng xã hội",
                  },
                  {
                    crit: "Đồng bộ CRM Khách hàng",
                    paper: "Thất lạc danh bạ sau các cuộc hội nghị",
                    vione: "Tự động ghi nhớ đối tác vào CRM 163 bảng",
                  },
                  {
                    crit: "Chi phí dài hạn",
                    paper: "Tốn hàng triệu đồng in ấn hàng năm",
                    vione: "Đầu tư một lần, sử dụng vĩnh viễn trọn đời",
                  },
                  {
                    crit: "Bảo vệ môi trường",
                    paper: "88% thẻ giấy bị vứt vào sọt rác sau 1 tuần",
                    vione: "100% Không dùng giấy, bền vững và hiện đại",
                  },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6 font-bold text-slate-800">{row.crit}</td>
                    <td className="py-4 px-6 text-slate-500 flex items-center gap-2">
                      <X className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{row.paper}</span>
                    </td>
                    <td className="py-4 px-6 font-bold text-[#2E3192] bg-blue-50/40">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 stroke-[3] shrink-0" />
                        <span>{row.vione}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 7: Mobile App Download & Ecosystem */}
      <section id="mobile-app" className="py-20 bg-gradient-to-br from-[#19194D] via-[#2E3192] to-[#19194D] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#25AAE1_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <span className="px-3.5 py-1.5 rounded-full bg-[#25AAE1]/20 text-[#25AAE1] border border-[#25AAE1]/40 text-xs font-mono font-bold uppercase">
                TẢI ỨNG DỤNG VIONE CONNECT
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-tight">
                Mở Cánh Cửa Kết Nối Mọi Thương Vụ B2B Trên Smartphone
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
                Cài đặt ứng dụng ViOne Connect để đồng bộ thẻ thông minh, quản lý danh bạ đối tác kinh doanh, check-in sự kiện và nhận thông báo cơ hội hợp tác mới nhất.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <a
                  href="/association/login"
                  className="px-6 py-3.5 rounded-2xl bg-[#F7941D] hover:bg-[#E68310] text-white font-black text-sm flex items-center gap-3 shadow-lg shadow-[#F7941D]/30 transition active:scale-95"
                >
                  <Smartphone className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-wider font-semibold opacity-90">Tải ngay cho</div>
                    <div className="text-sm font-black">Android (APK & CH Play)</div>
                  </div>
                </a>

                <a
                  href="/association/login"
                  className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-black text-sm flex items-center gap-3 transition active:scale-95"
                >
                  <Globe2 className="w-5 h-5 text-[#25AAE1]" />
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-wider font-semibold opacity-90">Tải ngay cho</div>
                    <div className="text-sm font-black">iOS (App Store & TestFlight)</div>
                  </div>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="p-6 rounded-3xl bg-white text-slate-950 shadow-2xl text-center space-y-4 max-w-xs w-full">
                <div className="p-3 rounded-2xl bg-blue-50 border border-[#25AAE1]/30 inline-block">
                  <QrCode className="w-40 h-40 text-[#2E3192]" />
                </div>
                <div>
                  <div className="font-black text-base text-[#2E3192]">QUÉT MÃ TẢI APP</div>
                  <div className="text-xs text-slate-500 mt-0.5">Dành cho cả iPhone và Android</div>
                </div>
                <div className="text-[11px] font-mono text-emerald-600 font-bold bg-emerald-50 py-1.5 rounded-lg">
                  Phiên bản 5.0.2 • Cập nhật mới nhất
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 8: Call to Action Banner (Navy to Cyan with Orange CTA) */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-[#2E3192] via-[#25AAE1] to-[#2E3192] text-white text-center shadow-xl space-y-6 relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto space-y-3">
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">
                Sẵn Sàng Nâng Tầm Vị Thế Doanh Nghiệp?
              </h2>
              <p className="text-sm sm:text-base text-sky-100 leading-relaxed">
                Gia nhập mạng lưới hơn 10,000+ doanh nhân và 500+ tổ chức hiệp hội đang chuyển đổi số thành công cùng ViOne Platform.
              </p>
            </div>
            <div className="relative z-10 flex flex-wrap justify-center gap-4 pt-2">
              <a
                href="/association/login"
                className="px-8 py-4 rounded-2xl bg-[#F7941D] hover:bg-[#E68310] text-white font-black text-base shadow-xl shadow-[#F7941D]/30 transition transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                Trải Nghiệm ViOne Ngay →
              </a>
              <a
                href="/association/login"
                className="px-8 py-4 rounded-2xl bg-white text-[#2E3192] hover:bg-blue-50 font-bold text-base shadow-lg transition active:scale-95 cursor-pointer"
              >
                Liên Hệ Tư Vấn Doanh Nghiệp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Hoàn Chỉnh */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-14 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2E3192] to-[#25AAE1] flex items-center justify-center text-white font-black text-base">
                  V
                </div>
                <span className="font-black text-lg text-white tracking-tight">
                  ViOne<span className="text-[#25AAE1]">Connect</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hệ điều hành kết nối kinh doanh thế hệ mới, thẻ danh thiếp thông minh Titanium NFC và hệ thống quản trị CRM cô lập 163 bảng dữ liệu.
              </p>
            </div>

            <div>
              <div className="font-bold text-white uppercase tracking-wider mb-3">Hệ Sinh Thái</div>
              <ul className="space-y-2">
                <li><a href="#nfc-card" className="hover:text-white transition">Thẻ Danh Thiếp Titanium NFC</a></li>
                <li><a href="#crm" className="hover:text-white transition">Hệ Thống Enterprise CRM</a></li>
                <li><a href="#mobile-app" className="hover:text-white transition">ViOne Connect Mobile App</a></li>
                <li><a href="#ecosystem" className="hover:text-white transition">Sàn Giao Thương B2B</a></li>
              </ul>
            </div>

            <div>
              <div className="font-bold text-white uppercase tracking-wider mb-3">Hỗ Trợ & Pháp Lý</div>
              <ul className="space-y-2">
                <li><a href="/verify" className="hover:text-white transition">Xác Thực Thẻ & Bảo Hành</a></li>
                <li><a href="#" className="hover:text-white transition">Chính Sách Bảo Mật Dữ Liệu</a></li>
                <li><a href="#" className="hover:text-white transition">Điều Khoản Dịch Vụ 5.0</a></li>
                <li><a href="#" className="hover:text-white transition">Hướng Dẫn Cài Đặt Ứng Dụng</a></li>
              </ul>
            </div>

            <div>
              <div className="font-bold text-white uppercase tracking-wider mb-3">Liên Hệ Trực Tiếp</div>
              <div className="space-y-2 text-slate-300">
                <div>Hotline: <strong className="text-white">1900 6868</strong></div>
                <div>Email: <strong className="text-white">support@vione.vn</strong></div>
                <div>Địa chỉ: Tòa nhà ViOne Tower, Hà Nội, Việt Nam</div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
            <div>
              © 2026 ViOne Connect Global Corp. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Hệ Thống 163 Bảng CRM Online
              </span>
              <span>Phiên bản 5.0.2</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Alias export for backwards compatibility
export const ViOneBrandLanding = ViOneGoldWhiteLanding;
