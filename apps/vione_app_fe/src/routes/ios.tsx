import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Apple,
  Share,
  PlusSquare,
  CheckCircle2,
  Download,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Smartphone,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { QrCanvas } from "@/components/member/QrCanvas";
import { resolvePwaInstallUrl, CANONICAL_PWA_URL } from "@/lib/tenant";

export const Route = createFileRoute("/ios")({
  head: () => ({
    meta: [
      { title: "Cài đặt ứng dụng ViOne Connect cho iPhone & iPad (iOS)" },
      {
        name: "description",
        content:
          "Hướng dẫn cài đặt ứng dụng ViOne Connect lên Màn hình chính iPhone, iPad trong 3 bước đơn giản. Chạy mượt mà toàn màn hình, không cần qua App Store.",
      },
    ],
  }),
  component: IosInstallPage,
});

function IosInstallPage() {
  const [appUrl, setAppUrl] = useState(CANONICAL_PWA_URL);
  const [isInApp, setIsInApp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isIos, setIsIos] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setAppUrl(resolvePwaInstallUrl());

    const ua = window.navigator.userAgent.toLowerCase();
    // Phát hiện In-App Browser (Zalo, Facebook, Messenger, Instagram, TikTok, Line, WeChat)
    const inApp =
      /zalo|fbav|fban|messenger|instagram|line|micromessenger|tiktok|bytedance/i.test(ua);
    setIsInApp(inApp);

    const iosCheck =
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
    setIsIos(iosCheck);
  }, []);

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 selection:bg-[#D8B282]/30 selection:text-[#F3E5AB]">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-[#D8B282]/15 blur-[120px]" />
        <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-[#996515]/10 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        {/* ⚠️ CẢNH BÁO MỞ TRONG ZALO / MESSENGER NẾU CÓ */}
        {isInApp && (
          <div className="mb-6 rounded-2xl border-2 border-amber-500/60 bg-amber-950/80 p-4 text-amber-200 shadow-[0_8px_30px_rgba(245,158,11,0.25)] backdrop-blur-md animate-in fade-in duration-300">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500 text-black">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-black text-amber-100 uppercase tracking-wide">
                  Bạn đang mở bằng trình duyệt In-App (Zalo / Messenger)
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-amber-200/90">
                  Trình duyệt này <strong>không hỗ trợ</strong> tính năng cài đặt vào Màn hình chính
                  iOS.
                </p>
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-md bg-black/40 px-2.5 py-1 text-[11px] font-bold text-amber-300 border border-amber-500/30">
                    👉 Bấm dấu [ ••• ] ở góc trên phải ➔ Chọn "Mở bằng Safari"
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-black transition hover:bg-amber-400 active:scale-95 cursor-pointer"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Đã chép link!" : "Chép link để dán vào Safari"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HEADER BRANDING */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#FAF3DD] via-[#D8B282] to-[#996515] p-[2px] shadow-[0_12px_40px_rgba(216,178,130,0.4)]">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[22px] bg-[#120E0A]">
              <img
                src="/apple-touch-icon.png?v=vione_gold_crown"
                alt="ViOne App Icon"
                className="h-full w-full object-cover"
                width={96}
                height={96}
              />
            </div>
            <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-[#D8B282] text-xs font-black text-black shadow-md">
              ★
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D8B282]/40 bg-[#D8B282]/15 px-3 py-1 text-xs font-bold text-[#F3E5AB]">
            <Apple className="h-3.5 w-3.5" />
            <span>Dành Riêng Cho iPhone & iPad (iOS)</span>
          </div>

          <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Cài Đặt Ứng Dụng <span className="text-[#E5C158]">ViOne Connect</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-md">
            Trải nghiệm ứng dụng mượt mà, toàn màn hình Native, nhận thông báo tức thời và mở nhanh
            từ Màn hình chính không cần App Store.
          </p>
        </div>

        {/* HƯỚNG DẪN 3 BƯỚC CÀI ĐẶT TRỰC QUAN (CỰC TO & RÕ RÀNG) */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-[#D8B282]/40 bg-[#120E0A]/95 p-6 shadow-2xl backdrop-blur-xl ring-1 ring-[#D8B282]/20">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#D8B282]/20 text-[#E5C158] font-bold">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="text-base font-black text-[#F3E5AB]">
                Hướng Dẫn Cài Đặt Trong 3 Bước (Safari)
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Miễn phí 100%
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {/* Bước 1 */}
            <div className="flex items-start gap-4 rounded-2xl bg-white/5 p-4 border border-white/5 transition hover:border-[#D8B282]/30">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#D8B282] to-[#996515] text-xs font-black text-black shadow-md mt-0.5">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap text-sm font-bold text-white">
                  <span>Chạm vào nút</span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/20 px-2.5 py-1 text-blue-400 font-extrabold border border-blue-400/40">
                    <Share className="h-4 w-4" /> Chia sẻ (Share)
                  </span>
                  <span>ở thanh công cụ đáy Safari</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  (Biểu tượng ô vuông có mũi tên chỉ lên ở giữa dưới màn hình iPhone, hoặc ở góc
                  phải trên iPad)
                </p>
              </div>
            </div>

            {/* Bước 2 */}
            <div className="flex items-start gap-4 rounded-2xl bg-white/5 p-4 border border-white/5 transition hover:border-[#D8B282]/30">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#D8B282] to-[#996515] text-xs font-black text-black shadow-md mt-0.5">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap text-sm font-bold text-white">
                  <span>Cuộn xuống danh sách và chọn</span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#D8B282]/20 px-2.5 py-1 text-[#F3E5AB] font-extrabold border border-[#D8B282]/40">
                    <PlusSquare className="h-4 w-4 text-[#D8B282]" /> Thêm vào MH chính
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  (Tên tiếng Anh trên máy là <strong>"Add to Home Screen"</strong>)
                </p>
              </div>
            </div>

            {/* Bước 3 */}
            <div className="flex items-start gap-4 rounded-2xl bg-white/5 p-4 border border-white/5 transition hover:border-[#D8B282]/30">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#D8B282] to-[#996515] text-xs font-black text-black shadow-md mt-0.5">
                3
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap text-sm font-bold text-white">
                  <span>Nhấn nút</span>
                  <span className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    Thêm (Add)
                  </span>
                  <span>ở góc trên cùng bên phải màn hình</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Xong! Biểu tượng ViOne mạ vàng sẽ xuất hiện ngay trên Màn hình chính của bạn.
                </p>
              </div>
            </div>
          </div>

          {/* CÁCH 2: TẢI PROFILE APPLE CONFIG 1-CHẠM */}
          <div className="mt-6 rounded-2xl border border-[#D8B282]/30 bg-gradient-to-r from-[#996515]/20 via-[#D8B282]/15 to-[#996515]/20 p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
              <div>
                <h4 className="text-xs font-black text-[#F3E5AB] uppercase tracking-wide flex items-center gap-1.5">
                  <span>Cách 2: Tải Cấu Hình Apple WebClip (.mobileconfig)</span>
                </h4>
                <p className="mt-0.5 text-[11px] text-slate-300">
                  Cài đặt icon ứng dụng tự động qua Hồ sơ cấu hình Apple chính thức.
                </p>
              </div>
              <a
                href="/vione_ios_install.mobileconfig"
                download="vione_ios_install.mobileconfig"
                className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D8B282] via-[#E5C158] to-[#D8B282] px-4 py-2 text-xs font-bold text-black shadow-md transition hover:brightness-110 active:scale-95"
              >
                <Download className="h-4 w-4" />
                <span>Tải Hồ Sơ Cài Đặt</span>
              </a>
            </div>
          </div>
        </div>

        {/* NÚT THAO TÁC NHANH */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            to="/connect-app"
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#D8B282] via-[#E5C158] to-[#D8B282] py-3.5 px-5 text-sm font-black text-black shadow-[0_6px_25px_rgba(216,178,130,0.4)] transition hover:brightness-110 active:scale-95"
          >
            <span>Mở Ứng Dụng Ngay Trên Web</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 py-3.5 px-5 text-sm font-bold text-white transition hover:bg-white/15 active:scale-95 cursor-pointer"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Đã sao chép liên kết!" : "Sao Chép Link Cài Đặt"}</span>
          </button>
        </div>

        {/* MÃ QR CHO THIẾT BỊ KHÁC */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Hoặc Quét Mã QR Bằng Camera iPhone Để Cài Đặt
          </h3>
          <div className="mt-4 flex justify-center">
            <div className="rounded-2xl bg-white p-3 shadow-lg">
              <QrCanvas value={appUrl} size={180} />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-400 break-all">{appUrl}</p>
        </div>
      </div>
    </div>
  );
}
