import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Apple,
  Smartphone,
  Share,
  PlusSquare,
  MoreVertical,
  Download,
  Check,
  AlertTriangle,
  Copy,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { QrCanvas } from "@/components/member/QrCanvas";
import { resolvePwaInstallUrl, CANONICAL_PWA_URL } from "@/lib/tenant";

const appIcon = "/apple-touch-icon.png?v=vione_gold_crown";

export const Route = createFileRoute("/install")({
  head: () => ({
    meta: [
      { title: "Cài đặt ứng dụng ViOne Connect — Nền Tảng Doanh Nghiệp Việt Nam" },
      {
        name: "description",
        content:
          "Hướng dẫn cài đặt ứng dụng ViOne Connect lên màn hình chính cho iPhone, iPad và Android. Tải nhanh không qua kho ứng dụng, chạy mượt toàn màn hình.",
      },
    ],
  }),
  component: InstallPage,
});

function InstallPage() {
  const [appUrl, setAppUrl] = useState(CANONICAL_PWA_URL);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppUrl(resolvePwaInstallUrl());

      const ua = window.navigator.userAgent.toLowerCase();
      const inApp =
        /zalo|fbav|fban|messenger|instagram|line|micromessenger|tiktok|bytedance/i.test(ua);
      setIsInAppBrowser(inApp);

      const ios =
        /iphone|ipad|ipod/.test(ua) ||
        (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
      setIsIosDevice(ios);
    }
  }, []);

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 selection:bg-[#D8B282]/30 selection:text-[#F3E5AB]">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-[#D8B282]/15 blur-[120px]" />
        <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-[#996515]/10 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {/* ⚠️ CẢNH BÁO MỞ TRONG ZALO / MESSENGER NẾU CÓ */}
        {isInAppBrowser && (
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
                  Trình duyệt này <strong>không hỗ trợ</strong> lưu ứng dụng ra Màn hình chính.
                </p>
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-md bg-black/40 px-2.5 py-1 text-[11px] font-bold text-amber-300 border border-amber-500/30">
                    👉 Chạm dấu [ ••• ] ở góc trên cùng bên phải ➔ Chọn "Mở bằng trình duyệt Safari" (hoặc Chrome)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-black transition hover:bg-amber-400 active:scale-95 cursor-pointer"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? "Đã chép link!" : "Chép link để dán"}</span>
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
                src={appIcon}
                alt="ViOne App Icon"
                className="h-full w-full object-cover"
                width={96}
                height={96}
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute("src", "/app-icon.png");
                }}
              />
            </div>
            <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-[#D8B282] text-xs font-black text-black shadow-md">
              ★
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D8B282]/40 bg-[#D8B282]/15 px-3 py-1 text-xs font-bold text-[#F3E5AB]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Nền Tảng Doanh Nghiệp Số Hàng Đầu</span>
          </div>

          <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Cài Đặt Ứng Dụng <span className="text-[#E5C158]">ViOne Connect</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-md">
            Cài đặt ứng dụng lên màn hình chính để truy cập danh thiếp số NFC, mạng lưới doanh nhân,
            sự kiện B2B và ưu đãi — nhanh như app native thật, không cần qua App Store.
          </p>

          {/* Quick Action Buttons */}
          <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/connect-app"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D8B282] via-[#E5C158] to-[#D8B282] px-5 py-2.5 text-xs font-black text-black shadow-[0_4px_20px_rgba(216,178,130,0.35)] transition hover:brightness-110 active:scale-95"
            >
              <span>Mở Ứng Dụng Ngay</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            {isIosDevice ? (
              <a
                href="/vione_ios_install.mobileconfig"
                download="vione_ios_install.mobileconfig"
                className="inline-flex items-center gap-2 rounded-xl border border-[#D8B282]/40 bg-white/10 px-4 py-2.5 text-xs font-bold text-[#F3E5AB] transition hover:bg-white/15 active:scale-95"
              >
                <Apple className="h-4 w-4 text-[#D8B282]" />
                <span>Cài Đặt Cấu Hình iOS (.mobileconfig)</span>
              </a>
            ) : (
              <a
                href="/vione.apk"
                download="vione.apk"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/15 active:scale-95"
              >
                <Smartphone className="h-4 w-4 text-emerald-400" />
                <span>Tải File APK Android</span>
              </a>
            )}
          </div>
        </div>

        {/* HƯỚNG DẪN CHI TIẾT THEO THIẾT BỊ */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {/* iOS Card */}
          <div
            className={`rounded-3xl border p-5 sm:p-6 transition-all backdrop-blur-xl ${
              isIosDevice
                ? "border-[#D8B282] bg-[#120E0A]/95 shadow-[0_10px_35px_rgba(216,178,130,0.2)] ring-1 ring-[#D8B282]/40"
                : "border-white/10 bg-white/5 opacity-85 hover:opacity-100"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#D8B282]/20 text-[#E5C158]">
                  <Apple className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-white">iPhone / iPad (iOS)</h2>
                  <p className="text-[11px] text-slate-400">Trình duyệt Safari</p>
                </div>
              </div>
              {isIosDevice && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-400 border border-emerald-500/30">
                  Thiết bị của bạn
                </span>
              )}
            </div>

            <ol className="space-y-3.5">
              <li className="flex items-start gap-3 text-xs leading-relaxed text-slate-300">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#D8B282]/20 text-[11px] font-black text-[#E5C158] border border-[#D8B282]/40 mt-0.5">
                  1
                </span>
                <div>
                  Mở trang này bằng trình duyệt <strong>Safari</strong> trên iPhone.
                </div>
              </li>
              <li className="flex items-start gap-3 text-xs leading-relaxed text-slate-300">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#D8B282]/20 text-[11px] font-black text-[#E5C158] border border-[#D8B282]/40 mt-0.5">
                  2
                </span>
                <div>
                  Chạm nút <span className="text-blue-400 font-bold inline-flex items-center gap-1"><Share className="h-3 w-3 inline" /> "Chia sẻ"</span> (mũi tên hướng lên) ở thanh đáy Safari.
                </div>
              </li>
              <li className="flex items-start gap-3 text-xs leading-relaxed text-slate-300">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#D8B282]/20 text-[11px] font-black text-[#E5C158] border border-[#D8B282]/40 mt-0.5">
                  3
                </span>
                <div>
                  Cuộn xuống chọn <span className="text-[#F3E5AB] font-bold inline-flex items-center gap-1"><PlusSquare className="h-3 w-3 inline" /> "Thêm vào MH chính"</span> (Add to Home Screen).
                </div>
              </li>
              <li className="flex items-start gap-3 text-xs leading-relaxed text-slate-300">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#D8B282]/20 text-[11px] font-black text-[#E5C158] border border-[#D8B282]/40 mt-0.5">
                  4
                </span>
                <div>
                  Nhấn <strong>"Thêm" (Add)</strong> ở góc phải trên. Icon ViOne vàng kim sẽ xuất hiện ngay trên màn hình chính!
                </div>
              </li>
            </ol>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
              <Link
                to="/ios"
                className="text-xs font-bold text-[#E5C158] hover:underline flex items-center gap-1"
              >
                <span>Xem hướng dẫn chi tiết hình ảnh iOS</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Android Card */}
          <div
            className={`rounded-3xl border p-5 sm:p-6 transition-all backdrop-blur-xl ${
              !isIosDevice
                ? "border-emerald-500/60 bg-[#0B1510]/95 shadow-[0_10px_35px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30"
                : "border-white/10 bg-white/5 opacity-85 hover:opacity-100"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <Smartphone className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-white">Điện Thoại Android</h2>
                  <p className="text-[11px] text-slate-400">Trình duyệt Chrome</p>
                </div>
              </div>
              {!isIosDevice && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-400 border border-emerald-500/30">
                  Thiết bị của bạn
                </span>
              )}
            </div>

            <ol className="space-y-3.5">
              <li className="flex items-start gap-3 text-xs leading-relaxed text-slate-300">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-[11px] font-black text-emerald-400 border border-emerald-500/40 mt-0.5">
                  1
                </span>
                <div>
                  Mở trang này bằng trình duyệt <strong>Google Chrome</strong>.
                </div>
              </li>
              <li className="flex items-start gap-3 text-xs leading-relaxed text-slate-300">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-[11px] font-black text-emerald-400 border border-emerald-500/40 mt-0.5">
                  2
                </span>
                <div>
                  Nhấn vào biểu tượng <span className="font-bold text-white"><MoreVertical className="h-3 w-3 inline" /> 3 chấm</span> ở góc trên bên phải.
                </div>
              </li>
              <li className="flex items-start gap-3 text-xs leading-relaxed text-slate-300">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-[11px] font-black text-emerald-400 border border-emerald-500/40 mt-0.5">
                  3
                </span>
                <div>
                  Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong>.
                </div>
              </li>
              <li className="flex items-start gap-3 text-xs leading-relaxed text-slate-300">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-[11px] font-black text-emerald-400 border border-emerald-500/40 mt-0.5">
                  4
                </span>
                <div>
                  Nhấn <strong>Xác nhận</strong> — ứng dụng được cài đặt như app gốc tức thì!
                </div>
              </li>
            </ol>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
              <a
                href="/vione.apk"
                download="vione.apk"
                className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Hoặc bấm để tải file APK cài trực tiếp</span>
                <Download className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* QR CARD DÀNH CHO MÁY TÍNH / THIẾT BỊ KHÁC */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-md">
          <div className="text-xs font-bold uppercase tracking-wider text-[#F3E5AB]">
            Quét mã QR bằng Camera điện thoại để mở nhanh
          </div>
          <div className="mt-4 flex justify-center">
            <div className="rounded-2xl bg-white p-3 shadow-xl">
              <QrCanvas value={appUrl} size={190} />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-400 break-all">{appUrl}</p>
        </div>
      </div>
    </div>
  );
}
