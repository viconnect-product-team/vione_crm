import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Users2,
  Briefcase,
  Layers,
  CalendarCheck,
  MessagesSquare,
  BookOpen,
  BarChart3,
  Bot,
  Building2,
  Users,
  Globe2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  IdCard,
  QrCode,
  Handshake,
  Award,
  ChevronRight,
  ExternalLink,
  Share2,
} from "lucide-react";
import { LuxuryLangSwitcher } from "@/components/LuxuryLangSwitcher";

export function Ceo1983BlueWhiteLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    company: "",
    industry: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const pillars = [
    {
      icon: Users,
      title: "Danh Bạ Hội Viên Số",
      desc: "Hồ sơ năng lực doanh nghiệp, danh thiếp số NFC, định danh lãnh đạo minh bạch và uy tín.",
      tag: "Trụ cột 01",
    },
    {
      icon: Handshake,
      title: "Giao Thương B2B Đa Chiều",
      desc: "Nhu cầu mua - bán, tìm kiếm nhà cung cấp, đấu thầu nội bộ và ghép nối đối tác tức thì.",
      tag: "Trụ cột 02",
    },
    {
      icon: CalendarCheck,
      title: "Sự Kiện & Diễn Đàn Kinh Doanh",
      desc: "Tổ chức hội thảo xúc tiến đầu tư, kết nối giao thương định kỳ, check-in QR 1 chạm.",
      tag: "Trụ cột 03",
    },
    {
      icon: IdCard,
      title: "Thẻ Hội Viên Thông Minh",
      desc: "Thẻ số NFC tích hợp Apple/Google Wallet, chia sẻ profile chỉ với một chạm lưng điện thoại.",
      tag: "Trụ cột 04",
    },
    {
      icon: Building2,
      title: "Gian Hàng Sản Phẩm Hội Viên",
      desc: "Không gian trưng bày sản phẩm chủ lực, chứng nhận chất lượng và ưu đãi độc quyền.",
      tag: "Trụ cột 05",
    },
    {
      icon: MessagesSquare,
      title: "Kết Nối Trực Tiếp & Họp Trực Tuyến",
      desc: "Trao đổi tin nhắn riêng tư, gọi thoại VoIP bảo mật doanh nghiệp theo tiêu chuẩn cao nhất.",
      tag: "Trụ cột 06",
    },
    {
      icon: BarChart3,
      title: "Báo Cáo & Thống Kê Tăng Trưởng",
      desc: "Đo lường giá trị giao thương thực tế, chỉ số tương tác và mở rộng mạng lưới kinh doanh.",
      tag: "Trụ cột 07",
    },
    {
      icon: ShieldCheck,
      title: "Bảo Hộ Pháp Lý & Cố Vấn Doanh Nghiệp",
      desc: "Hỗ trợ tư vấn chính sách, bảo vệ quyền lợi hội viên và kết nối chuyên gia đầu ngành.",
      tag: "Trụ cột 08",
    },
  ];

  const leaders = [
    {
      name: "Nguyễn Văn Tuấn",
      role: "Chủ Tịch CLB Doanh Nhân CEO 1983",
      company: "Tập Đoàn Đầu Tư Quốc Tế",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    },
    {
      name: "Lê Hoàng Long",
      role: "Tổng Thư Ký CLB CEO 1983",
      company: "Tập Đoàn Công Nghệ Hoàng Long",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    },
    {
      name: "Trần Thị Mai Phương",
      role: "Phó Chủ Tịch Xúc Tiến Thương Mại",
      company: "Công Ty Cổ Phần Xuất Nhập Khẩu Toàn Cầu",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    },
    {
      name: "Phạm Quang Huy",
      role: "Trưởng Ban Tài Chính & Đầu Tư",
      company: "Quỹ Đầu Tư Khởi Nghiệp CEO",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    },
  ];

  const stats = [
    { value: "500+", label: "Doanh nghiệp Hội viên" },
    { value: "2.400+", label: "Cơ hội giao thương B2B" },
    { value: "180+", label: "Sự kiện kết nối hàng năm" },
    { value: "99.6%", label: "Tỷ lệ gắn kết bền vững" },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-[#004B91] selection:text-white">
      {/* ── TOP HEADER / NAVIGATION (Royal Blue & White Theme) ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/ceo1983-logo.png"
              alt="CLB Doanh Nhân CEO 1983"
              className="h-12 sm:h-14 w-auto object-contain"
            />
            <div className="hidden sm:block leading-tight border-l border-slate-300 pl-3">
              <span className="block text-[14px] font-black tracking-tight text-[#004B91] uppercase">
                CLB DOANH NHÂN CEO 1983
              </span>
              <span className="block text-[11px] font-semibold text-slate-600 tracking-wider">
                Nâng Tầm Giá Trị • Tiên Phong Kết Nối
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-[14px] font-semibold text-slate-700">
            <a href="#about" className="hover:text-[#004B91] transition-colors">
              Giới thiệu
            </a>
            <a href="#ecosystem" className="hover:text-[#004B91] transition-colors">
              Hệ sinh thái
            </a>
            <a href="#smart-card" className="hover:text-[#004B91] transition-colors">
              Thẻ thông minh
            </a>
            <a href="#leadership" className="hover:text-[#004B91] transition-colors">
              Ban điều hành
            </a>
            <a href="#register" className="hover:text-[#004B91] transition-colors">
              Gia nhập CLB
            </a>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            <LuxuryLangSwitcher variant="subtle-blue" />
            <Link
              to="/association/login"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#004B91] hover:bg-[#003666] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#004B91]/20 active:scale-95 cursor-pointer"
            >
              <span>Đăng nhập</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Mở menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl">
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-sky-50 rounded-xl"
            >
              Giới thiệu
            </a>
            <a
              href="#ecosystem"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-sky-50 rounded-xl"
            >
              Hệ sinh thái
            </a>
            <a
              href="#smart-card"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-sky-50 rounded-xl"
            >
              Thẻ thông minh
            </a>
            <a
              href="#leadership"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-sky-50 rounded-xl"
            >
              Ban điều hành
            </a>
            <a
              href="#register"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-sky-50 rounded-xl"
            >
              Gia nhập CLB
            </a>
            <Link
              to="/association/login"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#004B91] text-white font-bold text-xs uppercase tracking-wider"
            >
              <span>Đăng nhập Cổng Hội Viên</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </header>

      {/* ── HERO SECTION (Clean White Background with Royal Blue Highlights) ── */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-sky-50/50 via-white to-white">
        {/* Decorative Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#004B91 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/80 border border-sky-300/80 text-[#004B91] text-xs font-bold shadow-2xs">
                <Sparkles className="h-4 w-4 text-[#004B91]" />
                <span>HỆ SINH THÁI DOANH NHÂN CEO 1983 • CHUẨN CEO1983.COM</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
                Cộng Đồng Doanh Nhân{" "}
                <span className="text-[#004B91]">CEO 1983</span> — Tiên Phong Kết Nối, Kiến Tạo Giá Trị
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Nền tảng hợp nhất quản trị hiệp hội, danh bạ hội viên số hóa, thẻ thông minh NFC và mạng lưới xúc tiến thương mại B2B dành riêng cho các chủ doanh nghiệp thế hệ 1983.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <a
                  href="#register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#004B91] hover:bg-[#003666] text-white font-bold text-sm transition-all shadow-lg shadow-[#004B91]/25 hover:shadow-xl hover:shadow-[#004B91]/35 cursor-pointer active:scale-95"
                >
                  <span>Đăng Ký Gia Nhập CLB</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  to="/association/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-[#004B91] bg-white hover:bg-sky-50 text-[#004B91] font-bold text-sm transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <IdCard className="h-4 w-4 text-[#004B91]" />
                  <span>Vào Cổng Hội Viên</span>
                </Link>
              </div>

              {/* Verified Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Xác thực pháp nhân 100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Bảo mật dữ liệu chuẩn ViOne</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Kết nối B2B thực chất</span>
                </div>
              </div>
            </div>

            {/* Right Visual Card Column */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md">
                {/* Decorative Glow */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-[#004B91]/20 to-sky-400/20 rounded-3xl blur-2xl opacity-70" />

                {/* Main 3D Card Mockup */}
                <div className="relative rounded-3xl border border-blue-900/40 bg-[#0B132B] p-6 shadow-2xl text-white">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src="/ceo1983-logo.png"
                        alt="CEO 1983"
                        className="h-10 w-auto object-contain bg-white/10 p-1 rounded-lg"
                      />
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-sky-400">
                          THẺ DOANH NHÂN ĐIỆN TỬ
                        </div>
                        <div className="text-[11px] text-slate-400">CLB DOANH NHÂN CEO 1983</div>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Công khai
                    </span>
                  </div>

                  <div className="mt-6 flex items-center gap-4">
                    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#004B91] border-2 border-white/20 text-white font-extrabold text-2xl shadow-lg">
                      L
                    </div>
                    <div>
                      <h3
                        className="text-xl font-black tracking-wide"
                        style={{
                          background:
                            "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 35%, #94A3B8 50%, #FFFFFF 70%, #CBD5E1 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.9))",
                        }}
                      >
                        Lê Hoàng Long
                      </h3>
                      <p className="text-xs font-medium text-slate-300 mt-0.5">
                        Tổng Thư Ký · Tập Đoàn Hoàng Long
                      </p>
                      <span className="mt-1.5 inline-block rounded-md bg-[#004B91]/40 border border-[#004B91] px-2 py-0.5 text-[10px] font-bold uppercase text-sky-300">
                        HỘI VIÊN CHÍNH THỨC
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl bg-[#060D1E]/90 border border-blue-900/60 p-3.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-sky-400" />
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">
                          Chạm thẻ NFC / QR Pass
                        </span>
                        <span className="font-semibold text-sky-300">/b/card-ceo-tongthuky</span>
                      </div>
                    </div>
                    <span className="rounded-lg bg-[#004B91] text-white px-2.5 py-1 text-[10.5px] font-bold shadow-xs">
                      1 Chạm
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Mã định danh: M1983-001</span>
                    <span className="text-sky-300 font-semibold">Tổ Chức Quý Hợi 1983</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS COUNTER BAR ── */}
      <section className="bg-[#004B91] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-blue-800">
            {stats.map((s, idx) => (
              <div key={idx} className={idx > 0 ? "pt-6 lg:pt-0" : ""}>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                  {s.value}
                </div>
                <div className="mt-2 text-xs sm:text-sm font-semibold text-sky-200">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8 ECOSYSTEM PILLARS (Section Structure from V1) ── */}
      <section id="ecosystem" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-[#004B91] text-xs font-bold uppercase tracking-wider">
              KIẾN TRÚC NỀN TẢNG
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              8 Phân Hệ Trụ Cột Của CLB Doanh Nhân CEO 1983
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Mô hình kết nối giao thương chuyên nghiệp, khép kín, ứng dụng công nghệ hiện đại giúp tối đa hóa cơ hội hợp tác và phát triển doanh nghiệp.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md hover:border-[#004B91]/60 transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-sky-50 text-[#004B91] group-hover:bg-[#004B91] group-hover:text-white transition-colors">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                        {p.tag}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-[#004B91] transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-[#004B91]">
                    <span>Khám phá tính năng</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SMART MEMBER CARD HIGHLIGHT ── */}
      <section id="smart-card" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-[#004B91] text-xs font-bold">
                <IdCard className="h-4 w-4 text-[#004B91]" />
                <span>CÔNG NGHỆ CHẠM THẺ NFC 1 CHẠM</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-snug">
                Thẻ Danh Thiếp Thông Minh & Thẻ Hội Viên VIP CEO 1983
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Tạm biệt danh thiếp giấy truyền thống dễ thất lạc. Mỗi hội viên CLB Doanh Nhân CEO 1983 được cấp một danh thiếp số độc bản, chạm trực tiếp vào điện thoại đối tác để truyền tải toàn bộ profile doanh nghiệp trong 1 giây.
              </p>
              <div className="space-y-3 text-xs sm:text-sm font-semibold text-slate-800">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#004B91] shrink-0" />
                  <span>Không cần cài đặt ứng dụng phức tạp đối với người nhận thẻ</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#004B91] shrink-0" />
                  <span>Tự do chỉnh sửa thông tin chức danh, website, dự án thời gian thực</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#004B91] shrink-0" />
                  <span>Đồng bộ danh bạ điện thoại trực tiếp chỉ với 1 nút bấm</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#004B91] shrink-0" />
                  <span>Tích hợp mã QR dự phòng cho các dòng máy không hỗ trợ NFC</span>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  to="/association/login"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#004B91] hover:bg-[#003666] text-white font-bold text-xs uppercase tracking-wider transition shadow-md"
                >
                  <span>Trải Nghiệm Thẻ Số Ngay</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="relative rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-xl max-w-md w-full text-center space-y-6">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-[#004B91] text-white shadow-lg">
                  <Zap className="h-10 w-10 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Chạm Lưng Điện Thoại — Kết Nối Vận May
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Công nghệ NFC tiêu chuẩn quốc tế ISO/IEC 14443 Type A
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-left space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Tương thích:</span>
                    <span className="font-bold text-slate-800">iOS & Android</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Tốc độ phản hồi:</span>
                    <span className="font-bold text-emerald-600">0.2 giây</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Bảo mật:</span>
                    <span className="font-bold text-[#004B91]">ViOne Secure Token</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BAN ĐIỀU HÀNH & HỘI VIÊN TIÊU BIỂU ── */}
      <section id="leadership" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-[#004B91] text-xs font-bold uppercase tracking-wider">
              LÃNH ĐẠO TIÊN PHONG
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Ban Chấp Hành CLB Doanh Nhân CEO 1983
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Tập hợp những nhà lãnh đạo tài năng, giàu tâm huyết, dẫn dắt câu lạc bộ phát triển vững mạnh và phụng sự cộng đồng doanh nhân.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {leaders.map((lead, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-xs hover:shadow-md transition-all group"
              >
                <img
                  src={lead.avatar}
                  alt={lead.name}
                  className="h-28 w-28 mx-auto rounded-full object-cover border-4 border-sky-100 group-hover:border-[#004B91] transition-colors shadow-md"
                />
                <h3 className="mt-4 font-extrabold text-base text-slate-900 group-hover:text-[#004B91] transition-colors">
                  {lead.name}
                </h3>
                <p className="text-xs font-semibold text-[#004B91] mt-0.5">{lead.role}</p>
                <p className="text-[11.5px] text-slate-500 mt-1">{lead.company}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REGISTRATION FORM (CTA Section) ── */}
      <section id="register" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border-2 border-[#004B91]/30 bg-gradient-to-b from-sky-50/50 to-white p-8 sm:p-12 shadow-xl">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#004B91] text-white text-xs font-bold">
                <Sparkles className="h-3.5 w-3.5" /> GIA NHẬP HỘI VIÊN
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Đăng Ký Tham Gia CLB Doanh Nhân CEO 1983
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Hãy trở thành một phần của mạng lưới tinh hoa doanh nhân sinh năm 1983 để cùng nhau bứt phá giao thương và kiến tạo di sản.
              </p>
            </div>

            {submitted ? (
              <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500 text-white mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-emerald-900">
                  Gửi Hồ Sơ Đăng Ký Thành Công!
                </h3>
                <p className="text-xs text-emerald-700 max-w-md mx-auto">
                  Ban Thư Ký CLB Doanh Nhân CEO 1983 sẽ liên hệ xác nhận hồ sơ của anh/chị trong vòng 24 giờ làm việc. Trân trọng cảm ơn!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Ví dụ: Nguyễn Văn A"
                      className="w-full h-11 px-4 rounded-xl border border-slate-300 text-sm focus:border-[#004B91] focus:ring-2 focus:ring-sky-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Ví dụ: 0983 19 1983"
                      className="w-full h-11 px-4 rounded-xl border border-slate-300 text-sm focus:border-[#004B91] focus:ring-2 focus:ring-sky-100 outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Email doanh nghiệp *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ceo@doanhnghiep.vn"
                      className="w-full h-11 px-4 rounded-xl border border-slate-300 text-sm focus:border-[#004B91] focus:ring-2 focus:ring-sky-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Tên doanh nghiệp / Công ty *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Công ty Cổ phần..."
                      className="w-full h-11 px-4 rounded-xl border border-slate-300 text-sm focus:border-[#004B91] focus:ring-2 focus:ring-sky-100 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Lĩnh vực hoạt động chính
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="Sản xuất, Công nghệ, Bất động sản, Bán lẻ, Xây dựng..."
                    className="w-full h-11 px-4 rounded-xl border border-slate-300 text-sm focus:border-[#004B91] focus:ring-2 focus:ring-sky-100 outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-[#004B91] hover:bg-[#003666] text-white font-bold text-sm uppercase tracking-wider transition-all shadow-lg shadow-[#004B91]/25 hover:shadow-xl cursor-pointer"
                  >
                    Gửi Hồ Sơ Xét Duyệt Hội Viên
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER (Standard CEO 1983 Footer) ── */}
      <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
            {/* Column 1: Brand Info */}
            <div className="space-y-4 md:col-span-1">
              <img
                src="/ceo1983-logo.png"
                alt="CLB Doanh Nhân CEO 1983"
                className="h-12 w-auto object-contain bg-white p-1 rounded-xl"
              />
              <p className="text-xs text-slate-400 leading-relaxed">
                Cộng đồng tinh hoa hội tụ các nhà lãnh đạo và chủ doanh nghiệp sinh năm 1983 trên toàn quốc.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Khám Phá
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#about" className="hover:text-white transition">
                    Về CLB CEO 1983
                  </a>
                </li>
                <li>
                  <a href="#ecosystem" className="hover:text-white transition">
                    8 Trụ cột hệ sinh thái
                  </a>
                </li>
                <li>
                  <a href="#smart-card" className="hover:text-white transition">
                    Thẻ danh thiếp số NFC
                  </a>
                </li>
                <li>
                  <a href="#leadership" className="hover:text-white transition">
                    Ban Chấp Hành
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Membership Portal */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Cổng Hội Viên
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/association/login" className="hover:text-white transition">
                    Đăng nhập tài khoản
                  </Link>
                </li>
                <li>
                  <Link to="/connect-app/activate" className="hover:text-white transition">
                    Kích hoạt tài khoản mới
                  </Link>
                </li>
                <li>
                  <Link to="/admin" className="hover:text-white transition">
                    Cổng quản trị CRM ViOne
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact Secretariat */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Ban Thư Ký CLB
              </h4>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-sky-400 shrink-0" />
                  <span>0983 19 1983</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-sky-400 shrink-0" />
                  <span>banthuky@ceo1983.vn</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>Tòa nhà CEO 1983, Cầu Giấy, Hà Nội</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div>
              © 2026 CLB Doanh Nhân CEO 1983. Nền tảng phát triển bởi ViOne Business Connection OS.
            </div>
            <div className="flex items-center gap-6">
              <a href="https://ceo1983.com" target="_blank" rel="noreferrer" className="hover:text-slate-400">
                ceo1983.com
              </a>
              <span>•</span>
              <a href="#privacy" className="hover:text-slate-400">
                Điều khoản & Bảo mật
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
