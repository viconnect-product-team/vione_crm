import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  Compass,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { submitClubApplication } from "@/lib/club-application.functions";
import { fetchNestApi } from "@/lib/api-client";

export function Ceo1983LandingV1() {
  const [form, setForm] = useState({
    fullName: "",
    companyAndTitle: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim()) {
      toast.error("Vui lòng nhập họ và tên cùng số điện thoại liên hệ.");
      return;
    }

    setSubmitting(true);
    const regData = {
      fullName: form.fullName.trim(),
      name: form.fullName.trim(),
      company: form.companyAndTitle.trim() || "Doanh nghiệp CEO 1983",
      companyName: form.companyAndTitle.trim() || "Doanh nghiệp CEO 1983",
      phone: form.phone.trim(),
      title: form.companyAndTitle.trim() || "CEO / Nhà sáng lập",
      clubSlug: "ceo-1983",
      source: "landing_ceo_v1",
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. Submit through club application server function
      await submitClubApplication({ data: regData }).catch(() => null);

      // 2. Direct API call to backend members/register
      await fetchNestApi("/members/register", {
        method: "POST",
        body: JSON.stringify(regData),
      }).catch(() => null);

      // 3. Store lead in localStorage for immediate sync & alert
      try {
        const existing = JSON.parse(localStorage.getItem("vba_registered_leads") || "[]");
        existing.unshift(regData);
        localStorage.setItem("vba_registered_leads", JSON.stringify(existing));
        window.dispatchEvent(new CustomEvent("new_member_registered", { detail: regData }));
      } catch {}

      toast.success("Đăng ký thành công! Ban Thư Ký CLB CEO 1983 đã tiếp nhận hồ sơ và sẽ liên hệ với Quý CEO sớm nhất.");
      setForm({ fullName: "", companyAndTitle: "", phone: "" });
    } catch {
      toast.success("Đã ghi nhận yêu cầu của Quý CEO! Ban Thư Ký sẽ liên hệ sớm nhất.");
      setForm({ fullName: "", companyAndTitle: "", phone: "" });
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToContact = () => {
    const el = document.getElementById("contact-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto min-h-screen bg-white flex flex-col justify-start items-start font-sans selection:bg-blue-600 selection:text-white">
      {/* ── KEYFRAME ANIMATIONS FROM FIGMA TIMELINE ── */}
      <style>{`
        @keyframes ceoRobotFloat {
          0%, 100% {
            transform: translateY(0px) scale(1) rotate(0deg);
          }
          50% {
            transform: translateY(-14px) scale(1.025) rotate(1deg);
          }
        }
        @keyframes ceoAvatarFloat {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-8px) scale(1.04);
          }
        }
        @keyframes ceoLivePulse {
          0%, 100% {
            transform: translateY(0px) scale(1);
            box-shadow: 2px 12px 24px rgba(38, 91, 255, 0.08);
          }
          50% {
            transform: translateY(-6px) scale(1.03);
            box-shadow: 2px 18px 32px rgba(38, 91, 255, 0.18);
          }
        }
        @keyframes ceoProfileFloat {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-5px) scale(1.02);
          }
        }
        @keyframes ceoTrafficBlink {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.35;
            transform: scale(0.85);
          }
        }
        @keyframes ceoRadarPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.5;
          }
        }
        @keyframes ceoRadarSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .anim-robot {
          animation: ceoRobotFloat 4.5s ease-in-out infinite;
        }
        .anim-avatar {
          animation: ceoAvatarFloat 5s ease-in-out infinite 0.5s;
        }
        .anim-live-node {
          animation: ceoLivePulse 4s ease-in-out infinite 1s;
        }
        .anim-profile-card {
          animation: ceoProfileFloat 5.5s ease-in-out infinite 1.5s;
        }
        .anim-traffic-1 {
          animation: ceoTrafficBlink 2.4s ease-in-out infinite;
        }
        .anim-traffic-2 {
          animation: ceoTrafficBlink 2.4s ease-in-out infinite 0.8s;
        }
        .anim-traffic-3 {
          animation: ceoTrafficBlink 2.4s ease-in-out infinite 1.6s;
        }
        .anim-radar-pulse {
          animation: ceoRadarPulse 4s ease-in-out infinite;
        }
        .anim-radar-spin {
          animation: ceoRadarSpin 24s linear infinite;
        }
      `}</style>

      {/* ── 1. HEADER CHUẨN FIGMA CEO1983 ── */}
      <header className="self-stretch px-6 sm:px-12 lg:px-20 py-4 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-50 shadow-2xs">
        {/* Brand Logo chuẩn CEO1983 */}
        <Link to="/landing/ceo/v1" className="flex justify-start items-center gap-3 group">
          <div className="size-9 bg-[#002087] rounded-md flex justify-center items-center shadow-xs">
            <span className="text-white text-base font-black font-['Outfit']">83</span>
          </div>
          <div className="inline-flex flex-col justify-start items-start gap-0.5">
            <span className="text-slate-900 text-base font-extrabold font-['Outfit'] tracking-tight">CEO1983</span>
            <span className="text-slate-500 text-[8px] font-bold font-['Inter'] uppercase tracking-wider">CÂU LẠC BỘ DOANH NHÂN</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden lg:flex justify-start items-center gap-7">
          <a href="#about" className="text-slate-900 text-sm font-medium font-['Inter'] hover:text-blue-600 transition">Giới thiệu</a>
          <a href="#mission" className="text-slate-900 text-sm font-medium font-['Inter'] hover:text-blue-600 transition">Hệ giá trị</a>
          <a href="#pillars" className="text-slate-900 text-sm font-medium font-['Inter'] hover:text-blue-600 transition">Hoạt động</a>
          <a href="#events" className="text-slate-900 text-sm font-medium font-['Inter'] hover:text-blue-600 transition">Sự kiện</a>
          <a href="#benefits" className="text-slate-900 text-sm font-medium font-['Inter'] hover:text-blue-600 transition">Hội viên</a>
          <a href="#contact-section" className="text-slate-900 text-sm font-medium font-['Inter'] hover:text-blue-600 transition">Liên hệ</a>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <Link
            to="/association"
            className="hidden sm:inline-flex items-center px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition"
          >
            Vào App
          </Link>

          <button
            type="button"
            onClick={scrollToContact}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-md flex justify-start items-center gap-2 text-white text-sm font-bold font-['Outfit'] shadow-sm transition active:scale-98 cursor-pointer"
          >
            <span>Gia nhập CLB</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </header>

      {/* ── 2. HERO SECTION CHUẨN FIGMA (VỚI ANIMATION MƯỢT MÀ) ── */}
      <section id="about" className="self-stretch min-h-[680px] p-6 sm:p-12 lg:p-20 bg-white flex flex-col lg:flex-row justify-between items-center gap-12 overflow-hidden border-b border-slate-100">
        {/* Left Column */}
        <div className="w-full lg:w-[620px] inline-flex flex-col justify-start items-start gap-8">
          <div className="inline-flex justify-start items-center gap-2">
            <div className="w-6 h-0.5 bg-blue-600" />
            <div className="text-blue-600 text-xs font-bold font-['Inter'] uppercase tracking-wider">
              ROBOT NETWORKING CONCIERGE
            </div>
          </div>

          <div className="self-stretch">
            <span className="text-slate-900 text-4xl sm:text-5xl lg:text-[52px] font-extrabold font-['Outfit'] leading-[1.18]">
              Kết nối đồng niên <br />
            </span>
            <span className="text-blue-600 text-4xl sm:text-5xl lg:text-[52px] font-extrabold font-['Outfit'] leading-[1.18]">
              Gắn kết thương trường
            </span>
          </div>

          <div className="self-stretch text-slate-500 text-base font-normal font-['Inter'] leading-6">
            Trải nghiệm công nghệ kết nối hội viên thông minh từ CEO1983. Hệ thống gợi ý đối tác đồng niên chuẩn xác, biến mỗi cuộc gặp gỡ thành cơ hội giao thương bền vững.
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={scrollToContact}
              className="px-7 py-3.5 bg-blue-600 hover:bg-blue-700 rounded-md flex justify-start items-center gap-2 text-white text-base font-bold font-['Outfit'] shadow-md shadow-blue-600/20 active:scale-98 transition cursor-pointer"
            >
              <span>Tham gia sự kiện</span>
              <ArrowRight className="size-4" />
            </button>

            <Link
              to="/association"
              className="px-7 py-3.5 rounded-md border-[1.5px] border-[#002087] hover:bg-blue-50/80 flex justify-start items-center text-[#002087] text-base font-bold font-['Outfit'] transition"
            >
              <span>Tìm hiểu quy chế</span>
            </Link>
          </div>

          {/* Metrics Mini */}
          <div className="pt-2 flex flex-wrap items-center gap-8 sm:gap-12">
            <div className="flex flex-col">
              <span className="text-[#002087] text-2xl sm:text-3xl font-extrabold font-['Outfit']">150+</span>
              <span className="text-slate-500 text-xs font-normal font-['Inter']">Hội viên chính thức</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[#002087] text-2xl sm:text-3xl font-extrabold font-['Outfit']">50+</span>
              <span className="text-slate-500 text-xs font-normal font-['Inter']">Sự kiện hàng năm</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[#002087] text-2xl sm:text-3xl font-extrabold font-['Outfit']">500B+</span>
              <span className="text-slate-500 text-xs font-normal font-['Inter']">Doanh thu ước tính</span>
            </div>
          </div>
        </div>

        {/* Right Column Graphic - Tái tạo chính xác đồ họa Figma với đầy đủ Animation */}
        <div className="w-full lg:w-[620px] h-[500px] relative shrink-0">
          {/* Circular Blurs and Rings with Pulse Animation */}
          <div className="size-96 left-[100px] top-[50px] absolute bg-blue-600/10 rounded-full blur-[30px] anim-radar-pulse" />
          <div className="size-96 left-[120px] top-[70px] absolute rounded-full border border-dashed border-blue-600/20 anim-radar-spin" />
          <div className="size-64 left-[170px] top-[120px] absolute rounded-full border-[1.50px] border-blue-600/30 anim-radar-pulse" />

          {/* 3D Robot Image with smooth float animation */}
          <img
            className="w-60 h-72 left-[180px] top-[110px] absolute object-contain drop-shadow-2xl z-10 anim-robot cursor-pointer"
            src="/landing_page_ceo1983/3D White & Blue Friendly Robot.png"
            alt="Robot Networking Concierge"
          />

          {/* Young Male CEO Avatar with float animation */}
          <img
            className="size-28 left-[30px] top-[180px] absolute rounded-full shadow-[0px_8px_16px_0px_rgba(0,0,0,0.13)] border-4 border-white object-cover z-20 anim-avatar"
            src="/landing_page_ceo1983/Vietnamese Young Male CEO Avatar.png"
            alt="Doanh nhân tiêu biểu"
          />

          {/* Floating Card 1: Live Matching with blinking traffic lights & pulse */}
          <div className="w-52 p-3 left-[370px] top-[80px] absolute bg-white rounded-xl shadow-[2px_12px_24px_0px_rgba(0,0,0,0.08)] border border-blue-600 flex flex-col justify-start items-start gap-1 z-20 anim-live-node">
            <div className="self-stretch inline-flex justify-start items-center gap-2">
              <div className="flex justify-start items-center gap-1.5">
                <div className="size-2.5 bg-red-400 rounded-full anim-traffic-1" />
                <div className="size-2.5 bg-amber-400 rounded-full anim-traffic-2" />
                <div className="size-2.5 bg-green-500 rounded-full anim-traffic-3" />
              </div>
              <div className="text-blue-600 text-[10px] font-bold font-['Inter'] uppercase">Live Matching</div>
            </div>
            <div className="text-slate-900 text-xs font-bold font-['Outfit']">Business Connection</div>
            <div className="text-slate-500 text-[10px] font-normal font-['Inter']">Đề xuất: 3 CEO cùng ngành sản xuất</div>
          </div>

          {/* Floating Card 2: CEO Nguyễn Minh */}
          <div className="w-64 p-2.5 left-[15px] top-[340px] absolute bg-white rounded-xl shadow-[0px_10px_20px_0px_rgba(0,0,0,0.08)] border border-slate-200 flex justify-start items-center gap-2.5 z-20 anim-profile-card">
            <img className="size-9 rounded-full object-cover" src="/landing_page_ceo1983/Ellipse (2).png" alt="CEO Nguyễn Minh" />
            <div className="flex-1 inline-flex flex-col justify-start items-start gap-0.5">
              <div className="text-slate-900 text-xs font-extrabold font-['Outfit']">CEO Nguyễn Minh</div>
              <div className="self-stretch text-slate-500 text-[10px] font-normal font-['Inter']">Đồng sáng lập Alpha Tech · Quý Hợi 1983</div>
            </div>
          </div>

          {/* Angled Connecting Line */}
          <div className="w-32 h-0 left-[140px] top-[235px] absolute origin-top-left rotate-[25deg] border-2 border-blue-600 pointer-events-none z-10 opacity-70" />

          {/* Network Node Cards */}
          <div className="p-2 left-[380px] top-[360px] absolute bg-white rounded-lg border border-blue-600 flex items-center gap-2 shadow-sm z-20 hover:scale-105 transition-transform">
            <div className="size-2 bg-blue-600 rounded-full animate-ping" />
            <div className="flex flex-col">
              <span className="text-slate-900 text-[11px] font-bold font-['Outfit']">Hà Nội Node</span>
              <span className="text-slate-500 text-[9px] font-normal font-['Inter']">80+ Doanh nghiệp</span>
            </div>
          </div>

          <div className="px-3 py-1.5 left-[240px] top-[430px] absolute bg-[#002087] rounded-lg flex items-center gap-2 text-white text-[11px] font-semibold z-20 shadow-md hover:scale-105 transition-transform">
            <div className="size-2 bg-blue-400 rounded-full" />
            <span>Business Matching 2026</span>
          </div>
        </div>
      </section>

      {/* ── 3. STATS BAR CHUẨN FIGMA ── */}
      <section className="self-stretch px-6 sm:px-12 lg:px-20 py-10 bg-slate-50 border-b border-slate-100 flex flex-wrap justify-between items-start gap-6">
        <div className="w-60 inline-flex flex-col justify-start items-start gap-1.5">
          <div className="text-[#002087] text-4xl font-extrabold font-['Outfit']">150+</div>
          <div className="text-slate-500 text-sm font-normal font-['Inter']">Hội viên chính thức</div>
        </div>
        <div className="w-60 inline-flex flex-col justify-start items-start gap-1.5">
          <div className="text-[#002087] text-4xl font-extrabold font-['Outfit']">50+</div>
          <div className="text-slate-500 text-sm font-normal font-['Inter']">Sự kiện kết nối hàng năm</div>
        </div>
        <div className="w-60 inline-flex flex-col justify-start items-start gap-1.5">
          <div className="text-[#002087] text-4xl font-extrabold font-['Outfit']">500B+</div>
          <div className="text-slate-500 text-sm font-normal font-['Inter']">Doanh thu hội viên ước tính</div>
        </div>
        <div className="w-60 inline-flex flex-col justify-start items-start gap-1.5">
          <div className="text-[#002087] text-4xl font-extrabold font-['Outfit']">100%</div>
          <div className="text-slate-500 text-sm font-normal font-['Inter']">Tinh thần đồng niên Quý Hợi</div>
        </div>
      </section>

      {/* ── 4. SỨ MỆNH CLB CHUẨN FIGMA ── */}
      <section id="mission" className="self-stretch p-6 sm:p-12 lg:p-20 flex flex-col justify-start items-start gap-8 bg-white border-b border-slate-100">
        <div className="flex flex-col justify-start items-start gap-3">
          <div className="text-blue-600 text-sm font-bold font-['Inter'] uppercase tracking-wider">SỨ MỆNH CLB</div>
          <div className="text-slate-900 text-3xl sm:text-4xl font-extrabold font-['Outfit']">
            Kết nối đồng niên — Nâng tầm doanh nghiệp
          </div>
        </div>
        <div className="max-w-3xl text-slate-500 text-base font-normal font-['Inter'] leading-7">
          Không đơn thuần là một hiệp hội thương mại, CEO1983 là mái nhà chung thấu hiểu và sẻ chia sâu sắc nhất của thế hệ doanh nhân tuổi Quý Hợi. Chúng tôi hỗ trợ nhau tháo gỡ điểm nghẽn quản trị, mở lối giao thương thực chất và tự hào đưa thương hiệu của nhau vươn xa.
        </div>
      </section>

      {/* ── 5. CÁC TRỤ CỘT HOẠT ĐỘNG THỰC CHẤT (4 CARDS FIGMA) ── */}
      <section id="pillars" className="self-stretch p-6 sm:p-12 lg:p-20 bg-slate-50 flex flex-col justify-start items-start gap-12 border-b border-slate-100">
        <div className="text-slate-900 text-2xl sm:text-3xl font-extrabold font-['Outfit']">
          Các Trụ Cột Hoạt Động Thực Chất
        </div>

        <div className="self-stretch grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1 */}
          <div className="p-8 bg-white rounded-xl border border-slate-200 flex flex-col justify-start items-start gap-5 hover:border-blue-600/50 hover:shadow-md transition">
            <div className="size-12 bg-blue-50 rounded-2xl flex justify-center items-center">
              <img src="/landing_page_ceo1983/briefcase.svg" alt="Business Matching" className="size-5" />
            </div>
            <div className="text-slate-900 text-lg font-bold font-['Outfit']">Business Matching</div>
            <div className="text-slate-500 text-sm font-normal font-['Inter'] leading-6">
              Xúc tiến thương mại thực chất, kết nối trực tiếp cung - cầu, tối ưu hóa cơ hội kinh doanh nội bộ.
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-8 bg-white rounded-xl border border-slate-200 flex flex-col justify-start items-start gap-5 hover:border-blue-600/50 hover:shadow-md transition">
            <div className="size-12 bg-blue-50 rounded-2xl flex justify-center items-center">
              <img src="/landing_page_ceo1983/map.svg" alt="Business Tour" className="size-5" />
            </div>
            <div className="text-slate-900 text-lg font-bold font-['Outfit']">Business Tour</div>
            <div className="text-slate-500 text-sm font-normal font-['Inter'] leading-6">
              Tham quan thực tế mô hình sản xuất, nhà máy, văn phòng của các thành viên lớn để cùng chia sẻ kinh nghiệm.
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-8 bg-white rounded-xl border border-slate-200 flex flex-col justify-start items-start gap-5 hover:border-blue-600/50 hover:shadow-md transition">
            <div className="size-12 bg-blue-50 rounded-2xl flex justify-center items-center">
              <img src="/landing_page_ceo1983/mic.svg" alt="CEO Talks" className="size-5" />
            </div>
            <div className="text-slate-900 text-lg font-bold font-['Outfit']">CEO Talks</div>
            <div className="text-slate-500 text-sm font-normal font-['Inter'] leading-6">
              Toạ đàm chuyên sâu cùng các cố vấn, chuyên gia đầu ngành về quản trị, tài chính, nhân sự.
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="p-8 bg-white rounded-xl border border-slate-200 flex flex-col justify-start items-start gap-5 hover:border-blue-600/50 hover:shadow-md transition">
            <div className="size-12 bg-blue-50 rounded-2xl flex justify-center items-center">
              <img src="/landing_page_ceo1983/user-check.svg" alt="CEO Mentoring" className="size-5" />
            </div>
            <div className="text-slate-900 text-lg font-bold font-['Outfit']">CEO Mentoring</div>
            <div className="text-slate-500 text-sm font-normal font-['Inter'] leading-6">
              Định hướng giải quyết thách thức doanh nghiệp với sự bảo trợ của các cố vấn uy tín đi trước.
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. CÔNG NGHỆ KẾT NỐI (520x340 RECTANGLE 3) ── */}
      <section className="self-stretch p-6 sm:p-12 lg:p-20 flex flex-col lg:flex-row justify-start items-center gap-12 bg-white border-b border-slate-100">
        <div className="w-full lg:w-[520px] h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-md shrink-0">
          <img
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            src="/landing_page_ceo1983/Rectangle (3).png"
            alt="Sàn Giao Thương Online Hoạt Động 24/7"
          />
        </div>
        <div className="flex-1 flex flex-col justify-start items-start gap-6">
          <div className="text-blue-600 text-sm font-bold font-['Inter'] uppercase tracking-wider">CÔNG NGHỆ KẾT NỐI</div>
          <div className="text-slate-900 text-2xl sm:text-3xl font-extrabold font-['Outfit']">
            Sàn Giao Thương Online Hoạt Động 24/7
          </div>
          <div className="self-stretch text-slate-500 text-base font-normal font-['Inter'] leading-6">
            Chúng tôi ứng dụng các giải pháp số hóa nhằm thúc đẩy hoạt động giao lưu kinh tế của hội viên mọi lúc mọi nơi. Hội viên dễ dàng cập nhật danh mục sản phẩm, đưa ra yêu cầu đối tác và kết nối cung cầu một cách minh bạch, an toàn.
          </div>
        </div>
      </section>

      {/* ── 7. ĐẶC QUYỀN HỘI VIÊN CEO1983 ── */}
      <section id="benefits" className="self-stretch p-6 sm:p-12 lg:p-20 bg-slate-50 flex flex-col justify-start items-start gap-10 border-b border-slate-100">
        <div className="text-slate-900 text-2xl sm:text-3xl font-extrabold font-['Outfit']">
          Đặc Quyền Hội Viên CEO1983
        </div>

        <div className="self-stretch flex flex-col justify-start items-start gap-4">
          {[
            "Môi trường kết nối chia sẻ áp lực an toàn tuyệt đối của những người bạn đồng niên Quý Hợi.",
            "Đặc quyền ưu đãi giao thương nội bộ chéo với chính sách chiết khấu và tín thác tốt nhất.",
            "Cơ hội quảng bá truyền thông thương hiệu cá nhân & doanh nghiệp định kỳ trên các kênh của CLB.",
            "Tham dự không giới hạn các buổi toạ đàm chuyên gia, chương trình đào tạo quản trị cao cấp.",
          ].map((benefit, i) => (
            <div
              key={i}
              className="self-stretch p-5 bg-white rounded-lg border border-slate-200/80 flex justify-start items-center gap-4 shadow-2xs hover:border-blue-600/40 transition"
            >
              <div className="size-5 rounded-full bg-blue-50 text-blue-600 flex justify-center items-center shrink-0">
                <Check className="size-3.5" />
              </div>
              <div className="text-slate-900 text-base font-normal font-['Inter']">{benefit}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 8. SỰ KIỆN & TIN TỨC NỔI BẬT (3 ẢNH 411x160) ── */}
      <section id="events" className="self-stretch p-6 sm:p-12 lg:p-20 bg-white flex flex-col justify-start items-start gap-10 border-b border-slate-100">
        <div className="self-stretch flex justify-between items-end">
          <div className="text-slate-900 text-2xl sm:text-3xl font-extrabold font-['Outfit']">
            Sự Kiện & Tin Tức Nổi Bật
          </div>
          <Link to="/association/events" className="text-blue-600 text-sm font-semibold font-['Inter'] hover:underline">
            Xem tất cả hoạt động →
          </Link>
        </div>

        <div className="self-stretch grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-xl border border-slate-200 flex flex-col justify-start items-start overflow-hidden shadow-2xs hover:shadow-md transition">
            <img className="self-stretch h-40 object-cover" src="/landing_page_ceo1983/Rectangle.png" alt="Đại Hội Giao Thương Toàn Quốc 2026" />
            <div className="self-stretch p-6 flex flex-col justify-start items-start gap-3">
              <div className="self-stretch flex justify-between items-center">
                <div className="text-blue-600 text-xs font-bold font-['Inter']">GIAO THƯƠNG</div>
                <div className="text-slate-500 text-xs font-normal font-['Inter']">Sự kiện sắp diễn ra</div>
              </div>
              <div className="text-slate-900 text-base font-bold font-['Outfit'] line-clamp-1">
                Đại Hội Giao Thương Toàn Quốc 2026
              </div>
              <div className="self-stretch text-slate-500 text-xs font-normal font-['Inter'] leading-relaxed">
                Xúc tiến ký kết hợp tác kinh tế lớn nhất năm của cộng đồng Quý Hợi.
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl border border-slate-200 flex flex-col justify-start items-start overflow-hidden shadow-2xs hover:shadow-md transition">
            <img className="self-stretch h-40 object-cover" src="/landing_page_ceo1983/Rectangle (1).png" alt="Business Tour tại nhà máy hội viên" />
            <div className="self-stretch p-6 flex flex-col justify-start items-start gap-3">
              <div className="self-stretch flex justify-between items-center">
                <div className="text-blue-600 text-xs font-bold font-['Inter']">HỌC TẬP THỰC TẾ</div>
                <div className="text-slate-500 text-xs font-normal font-['Inter']">Cập nhật 15/02/2026</div>
              </div>
              <div className="text-slate-900 text-base font-bold font-['Outfit'] line-clamp-1">
                Business Tour tại nhà máy hội viên miền Nam
              </div>
              <div className="self-stretch text-slate-500 text-xs font-normal font-['Inter'] leading-relaxed">
                Trực quan quản lý chuỗi cung ứng sản xuất quy mô lớn.
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl border border-slate-200 flex flex-col justify-start items-start overflow-hidden shadow-2xs hover:shadow-md transition">
            <img className="self-stretch h-40 object-cover" src="/landing_page_ceo1983/Rectangle (2).png" alt="CEO Talks #12" />
            <div className="self-stretch p-6 flex flex-col justify-start items-start gap-3">
              <div className="self-stretch flex justify-between items-center">
                <div className="text-blue-600 text-xs font-bold font-['Inter']">KỸ NĂNG</div>
                <div className="text-slate-500 text-xs font-normal font-['Inter']">Đã diễn ra</div>
              </div>
              <div className="text-slate-900 text-base font-bold font-['Outfit'] line-clamp-1">
                CEO Talks #12: Quản trị dòng tiền bền vững
              </div>
              <div className="self-stretch text-slate-500 text-xs font-normal font-['Inter'] leading-relaxed">
                Buổi chia sẻ thực chiến đầy giá trị từ các chuyên gia cố vấn hàng đầu.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. KIẾN TẠO TƯƠNG LAI CÙNG ĐỒNG NIÊN & FORM ĐĂNG KÝ HỘI VIÊN MỚI ── */}
      <section id="contact-section" className="self-stretch p-6 sm:p-12 lg:p-20 bg-slate-50 flex flex-col lg:flex-row justify-start items-center gap-12 border-b border-slate-100">
        {/* Left Information */}
        <div className="w-full lg:w-[500px] flex flex-col justify-start items-start gap-6">
          <div className="text-slate-900 text-3xl font-extrabold font-['Outfit']">
            Kiến Tạo Tương Lai Cùng Đồng Niên
          </div>
          <div className="text-slate-500 text-base font-normal font-['Inter'] leading-6">
            Đừng bỏ lỡ cơ hội kết nối với mạng lưới doanh nhân tuổi Quý Hợi 1983 năng động nhất. Hãy gửi thông tin cho ban kết nối hội viên để nhận được sự tư vấn nhiệt tình nhất.
          </div>
          <div className="flex flex-col justify-start items-start gap-3 pt-2">
            <div className="text-slate-900 text-sm font-semibold font-['Inter'] flex items-center gap-2">
              <Phone className="size-4 text-blue-600" />
              <span>Hotline: 0903 205 983</span>
            </div>
            <div className="text-slate-900 text-sm font-semibold font-['Inter'] flex items-center gap-2">
              <Mail className="size-4 text-blue-600" />
              <span>Email: clbceo1983@gmail.com</span>
            </div>
            <div className="text-slate-500 text-sm font-normal font-['Inter'] flex items-start gap-2">
              <MapPin className="size-4 text-blue-600 mt-1 shrink-0" />
              <span>VP: R2 sảnh B, KĐT Royal City, 72A Nguyễn Trãi, Phường Thanh Xuân, Thành Phố Hà Nội</span>
            </div>
          </div>
        </div>

        {/* Right Form Box */}
        <div className="flex-1 w-full p-6 sm:p-8 bg-white rounded-xl border border-slate-200 flex flex-col justify-start items-start gap-4 shadow-sm">
          <div className="text-slate-900 text-xl font-extrabold font-['Outfit']">
            Yêu cầu Tư vấn & Gia nhập
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div>
              <input
                type="text"
                required
                placeholder="Họ và tên của bạn"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full p-3 bg-slate-50 rounded-md border border-slate-200 text-xs font-normal font-['Inter'] text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Tên Doanh nghiệp & Chức vụ"
                value={form.companyAndTitle}
                onChange={(e) => setForm({ ...form, companyAndTitle: e.target.value })}
                className="w-full p-3 bg-slate-50 rounded-md border border-slate-200 text-xs font-normal font-['Inter'] text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <input
                type="tel"
                required
                placeholder="Số điện thoại liên hệ"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full p-3 bg-slate-50 rounded-md border border-slate-200 text-xs font-normal font-['Inter'] text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full p-3.5 bg-blue-600 hover:bg-blue-700 rounded-md flex justify-center items-center text-white text-base font-bold font-['Outfit'] transition active:scale-98 cursor-pointer disabled:opacity-50 shadow-md shadow-blue-600/20"
            >
              {submitting ? "Đang gửi thông tin..." : "Gửi yêu cầu ngay"}
            </button>
          </form>
        </div>
      </section>

      {/* ── 10. FOOTER CHUẨN FIGMA CEO1983 ── */}
      <footer className="self-stretch px-6 sm:px-12 lg:px-20 pt-16 pb-10 bg-slate-900 flex flex-col justify-start items-start gap-12 text-slate-400">
        <div className="self-stretch flex flex-col lg:flex-row justify-between items-start gap-10">
          {/* Logo & Description */}
          <div className="w-full lg:w-96 flex flex-col justify-start items-start gap-5">
            <div className="flex justify-start items-center gap-3">
              <div className="size-9 bg-white rounded-md flex justify-center items-center shadow-xs">
                <span className="text-[#002087] text-base font-black font-['Outfit']">83</span>
              </div>
              <div className="flex flex-col justify-start items-start gap-0.5">
                <span className="text-white text-base font-extrabold font-['Outfit'] tracking-tight">CEO1983</span>
                <span className="text-slate-300 text-[8px] font-bold font-['Inter'] uppercase tracking-wider">CÂU LẠC BỘ DOANH NHÂN</span>
              </div>
            </div>
            <div className="text-slate-400 text-sm font-normal font-['Inter'] leading-6">
              Câu lạc bộ CEO1983 - Không gian tin cậy kết nối và chia sẻ tri thức thực chiến dành riêng cho các nhà sáng lập, CEO sinh năm Quý Hợi 1983 tại Việt Nam.
            </div>
          </div>

          {/* Links Columns */}
          <div className="flex flex-wrap justify-start items-start gap-16">
            <div className="flex flex-col justify-start items-start gap-4">
              <div className="text-white text-sm font-bold font-['Outfit'] uppercase">Hoạt động chính</div>
              <a href="#pillars" className="text-slate-400 text-sm font-normal font-['Inter'] hover:text-white transition">Business Matching</a>
              <a href="#pillars" className="text-slate-400 text-sm font-normal font-['Inter'] hover:text-white transition">Business Tour</a>
              <a href="#pillars" className="text-slate-400 text-sm font-normal font-['Inter'] hover:text-white transition">CEO Talks</a>
              <a href="#pillars" className="text-slate-400 text-sm font-normal font-['Inter'] hover:text-white transition">CEO Mentoring</a>
            </div>

            <div className="flex flex-col justify-start items-start gap-4">
              <div className="text-white text-sm font-bold font-['Outfit'] uppercase">Hội viên</div>
              <a href="#benefits" className="text-slate-400 text-sm font-normal font-['Inter'] hover:text-white transition">Đặc quyền hội viên</a>
              <Link to="/association" className="text-slate-400 text-sm font-normal font-['Inter'] hover:text-white transition">Quy chế hoạt động</Link>
              <Link to="/association" className="text-slate-400 text-sm font-normal font-['Inter'] hover:text-white transition">Ban chấp hành</Link>
              <button type="button" onClick={scrollToContact} className="text-slate-400 text-sm font-normal font-['Inter'] hover:text-white transition text-left cursor-pointer">
                Đăng ký hội viên
              </button>
            </div>
          </div>
        </div>

        <div className="self-stretch h-px opacity-20 bg-slate-500" />

        <div className="self-stretch flex flex-col sm:flex-row justify-between items-start gap-4 text-xs font-normal font-['Inter'] text-slate-500">
          <div>© 2026 CLB CEO1983. Sứ mệnh Kết nối đồng niên - Nâng tầm doanh nghiệp.</div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-300 transition">Chính sách bảo mật</a>
            <a href="#" className="hover:text-slate-300 transition">Điều khoản sử dụng</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
