import React, { useState } from "react";
import { Phone, Mail, Globe, Share2, RotateCw, Check, QrCode, Camera } from "lucide-react";
import { toast } from "sonner";
import { AssociationMemberQrModal } from "./AssociationMemberQrModal";
import { AssociationCardCaptureModal } from "./AssociationCardCaptureModal";

export interface Ceo1983BusinessCardVisitProps {
  name?: string;
  title?: string;
  phone?: string;
  email?: string;
  company?: string;
  website?: string;
  clubEmail?: string;
  qrValue?: string;
  avatarUrl?: string | null;
  cardCode?: string;
  className?: string;
  showActions?: boolean;
}

export function Ceo1983BusinessCardVisit({
  name = "NGUYEN VAN A",
  title = "Director",
  phone = "036xxxxxxx",
  email = "username@gmail.com",
  company = "CÂU LẠC BỘ CEO1983",
  website = "https://ceo1983club.com",
  clubEmail = "info@ceo1983club.com",
  qrValue,
  avatarUrl,
  cardCode,
  className = "",
  showActions = true,
}: Ceo1983BusinessCardVisitProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);

  const effectiveQr = qrValue || (cardCode ? `https://ceo1983club.com/card/${cardCode}` : `https://ceo1983club.com`);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(effectiveQr);
      setCopied(true);
      toast.success("Đã sao chép liên kết danh thiếp!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Không thể sao chép liên kết");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Danh thiếp ${name} - CLB CEO 1983`,
          text: `${name} · ${title} · ${company}`,
          url: effectiveQr,
        });
      } catch {
        // Share cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className={`w-full max-w-lg mx-auto ${className}`}>
      {/* 3D Perspective Card Container */}
      <div className="relative [perspective:1200px] w-full aspect-[16/10] sm:aspect-[1.7/1]">
        <div
          className={`relative w-full h-full duration-700 [transform-style:preserve-3d] transition-transform rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200/80 select-none ${
            isFlipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          {/* ==================================================================== */}
          {/* MẶT TRƯỚC (FRONT): CHUẨN 100% THƯƠNG HIỆU CEO 1983 BRANDBOOK        */}
          {/* ==================================================================== */}
          <div className="absolute inset-0 w-full h-full bg-white rounded-2xl overflow-hidden [backface-visibility:hidden] flex flex-col justify-between p-4 sm:p-6 shadow-sm">
            {/* Ảnh nền tùy chỉnh (Custom Captured / Uploaded Background) */}
            {customBgImage && (
              <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
                <img
                  src={customBgImage}
                  alt="Ảnh nền tùy chỉnh"
                  className="w-full h-full object-cover opacity-90"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCustomBgImage(null);
                    toast.info("Đã khôi phục nền gốc");
                  }}
                  className="absolute top-2.5 left-2.5 z-20 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] text-white hover:bg-black/80 transition-colors cursor-pointer"
                >
                  Xóa nền tùy chỉnh
                </button>
              </div>
            )}

            {/* Vòng tròn đồng tâm chìm (Concentric Watermark Waves) */}
            <svg
              className="absolute -top-10 -right-10 w-64 h-64 sm:w-80 sm:h-80 pointer-events-none opacity-45"
              viewBox="0 0 200 200"
              fill="none"
            >
              <circle cx="160" cy="40" r="30" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="160" cy="40" r="50" stroke="#E2E8F0" strokeWidth="1" />
              <circle cx="160" cy="40" r="70" stroke="#E2E8F0" strokeWidth="1" />
              <circle cx="160" cy="40" r="90" stroke="#E2E8F0" strokeWidth="1" />
              <circle cx="160" cy="40" r="110" stroke="#F1F5F9" strokeWidth="1.2" />
              <circle cx="160" cy="40" r="130" stroke="#F8FAFC" strokeWidth="1.2" />
              <circle cx="160" cy="40" r="150" stroke="#F1F5F9" strokeWidth="1.5" />
            </svg>

            {/* HEADER ROW: Logo chuẩn góc trên bên phải theo mẫu Brandbook */}
            <div className="relative z-10 flex items-start justify-end">
              {/* Logo chuẩn màu CEO 1983 từ Brandbook ở góc trên bên phải */}
              <div className="shrink-0">
                <img
                  src="/ceo1983-official-logo.png"
                  alt="Logo CLB Doanh Nhân CEO 1983"
                  className="h-9 sm:h-12 w-auto object-contain drop-shadow-xs"
                />
              </div>
            </div>

            {/* THÂN THẺ (MEMBER DETAILS) - Chuẩn nhận diện Brandbook Namecard */}
            <div className="relative z-10 my-auto pl-1 sm:pl-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-wide text-[#19194D] uppercase leading-tight font-sans">
                {name}
              </h1>
              <div className="text-xs sm:text-sm md:text-base font-bold text-[#EA580C] mt-1 tracking-wider uppercase">
                {title}
              </div>

              {/* Thông tin liên hệ điện thoại & email */}
              <div className="mt-3 sm:mt-5 space-y-1.5 sm:space-y-2 text-xs sm:text-[13px] text-[#1E293B]">
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 flex items-center justify-center text-[#19194D]">
                    <Phone className="w-3.5 h-3.5 stroke-[2.2]" />
                  </div>
                  <a href={`tel:${phone}`} className="font-semibold hover:text-[#EA580C] transition-colors">
                    {phone}
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 flex items-center justify-center text-[#19194D]">
                    <Mail className="w-3.5 h-3.5 stroke-[2.2]" />
                  </div>
                  <a href={`mailto:${email}`} className="font-medium hover:text-[#EA580C] transition-colors">
                    {email}
                  </a>
                </div>
              </div>
            </div>

            {/* DẢI SÓNG ORGANIC GÓC TRÁI DƯỚI & VIỀN CAM UỐN LƯỢN (CHÍNH XÁC BRANDBOOK) */}
            <div className="absolute bottom-0 left-0 right-0 w-full h-20 sm:h-24 pointer-events-none overflow-hidden rounded-b-2xl">
              <svg
                viewBox="0 0 500 120"
                preserveAspectRatio="none"
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Sóng xanh navy đậm góc trái dưới */}
                <path
                  d="M 0,40 C 25,65 50,120 135,120 L 0,120 Z"
                  fill="#1B2456"
                />
                <path
                  d="M 0,55 C 20,80 40,120 110,120 L 0,120 Z"
                  fill="#141B41"
                />
                {/* Cung dải lụa cam uốn lượn chạy dài sang phải */}
                <path
                  d="M 0,38 C 28,68 55,115 140,115 L 430,115 C 470,115 490,117 500,120"
                  stroke="#F58220"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M 0,34 C 28,65 58,113 145,113 L 425,113"
                  stroke="#FDBA74"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              </svg>
            </div>
          </div>

          {/* ==================================================================== */}
          {/* MẶT SAU (BACK): CHUẨN 100% ẢNH MẪU 2 VÀ BRANDBOOK                    */}
          {/* Nền xanh hoàng gia + Logo trắng + Khẩu hiệu cam "Kết nối bền - Phát triển vững" */}
          {/* ==================================================================== */}
          <div className="absolute inset-0 w-full h-full bg-[#24357B] text-white rounded-2xl overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center justify-center p-6 shadow-xl border border-blue-900">
            {/* Vòng tròn đồng tâm chìm ở viền phải */}
            <svg
              className="absolute -top-10 -right-16 w-72 h-72 sm:w-96 sm:h-96 pointer-events-none opacity-20"
              viewBox="0 0 200 200"
              fill="none"
            >
              <circle cx="160" cy="100" r="30" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="160" cy="100" r="50" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="160" cy="100" r="70" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="160" cy="100" r="90" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="160" cy="100" r="110" stroke="#FFFFFF" strokeWidth="1.2" />
              <circle cx="160" cy="100" r="130" stroke="#FFFFFF" strokeWidth="1.2" />
              <circle cx="160" cy="100" r="150" stroke="#FFFFFF" strokeWidth="1.5" />
            </svg>

            {/* Logo Trắng CEO 1983 Ở Giữa */}
            <div className="relative z-10 flex flex-col items-center">
              <img
                src="/brand-header-logo-white.png"
                alt="CLB Doanh Nhân CEO 1983"
                className="h-16 sm:h-22 w-auto object-contain drop-shadow-md"
              />

              {/* Khẩu hiệu màu cam chính thức */}
              <div className="mt-4 text-center">
                <span className="text-sm sm:text-base md:text-lg font-bold text-[#FFA500] tracking-wide drop-shadow-xs font-sans">
                  Kết nối bền - Phát triển vững
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CÁC NÚT ĐIỀU HƯỚNG VÀ HÀNH ĐỘNG DƯỚI DANH THIẾP */}
      {showActions && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {/* Nút lật mặt thẻ */}
          <button
            type="button"
            onClick={() => setIsFlipped(!isFlipped)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isFlipped ? "rotate-180" : ""} transition-transform`} />
            <span>{isFlipped ? "Xem Mặt Trước" : "Lật Mặt Sau"}</span>
          </button>

          {/* Nút Mã QR (Mở modal 2 tab: Mã QR của tôi & Quét QR) */}
          <button
            type="button"
            onClick={() => setQrModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#2E3192] hover:bg-[#19194D] text-white transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Mã QR</span>
          </button>

          {/* Nút Chụp / Tải ảnh nền danh thiếp (Khung ngắm 1.7:1 chuẩn) */}
          <button
            type="button"
            onClick={() => setCaptureModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Mở máy ảnh hoặc tải ảnh với khung ngắm vừa khít thẻ danh thiếp"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Chụp / Tải Nền</span>
          </button>

          {/* Chia sẻ danh thiếp */}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#19194D] to-[#252870] hover:brightness-110 text-white transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Chia Sẻ</span>
          </button>

          {/* Sao chép link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Đã chép</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>Sao Chép Link</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Modal Mã QR của tôi & Quét QR */}
      <AssociationMemberQrModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        memberCode={
          cardCode ||
          (typeof window !== "undefined"
            ? (() => {
                try {
                  const m = JSON.parse(localStorage.getItem("vba_my_member") || "null");
                  return m?.code || null;
                } catch {
                  return null;
                }
              })()
            : null) ||
          "M1983-292"
        }
        memberName={name}
        memberTitle={title}
        memberCompany={company}
        memberAvatar={avatarUrl}
      />

      {/* Modal Chụp Ảnh / Tải Nền Khung Ngắm Chuẩn 1.7:1 */}
      <AssociationCardCaptureModal
        open={captureModalOpen}
        onClose={() => setCaptureModalOpen(false)}
        onApplyBackground={(img) => setCustomBgImage(img)}
      />
    </div>
  );
}

