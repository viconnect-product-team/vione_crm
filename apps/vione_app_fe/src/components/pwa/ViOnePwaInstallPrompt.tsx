import { useState, useEffect } from "react";
import {
  Share,
  PlusSquare,
  X,
  Smartphone,
  Sparkles,
  Download,
  CheckCircle2,
  ChevronRight,
  Apple,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";

export function ViOnePwaInstallPrompt() {
  const [showBanner, setShowBanner] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Kiểm tra URL query params: nếu có ?install=1 hoặc ?pwa=1 hoặc ?ios=1 thì mở thẳng modal hướng dẫn lớn
    const searchParams = new URLSearchParams(window.location.search);
    const forceInstall =
      searchParams.get("install") === "1" ||
      searchParams.get("pwa") === "1" ||
      searchParams.get("ios") === "1";

    // 2. Kiểm tra thiết bị có đang chạy ở chế độ Standalone (PWA đã cài) hay không
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandalone && !forceInstall) {
      return; // Đã cài PWA rồi thì không hiện thông báo
    }

    // 3. Nhận diện thiết bị iOS & In-App browser
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos =
      /iphone|ipad|ipod/.test(userAgent) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
    setIsIosDevice(isIos);

    const inApp =
      /zalo|fbav|fban|messenger|instagram|line|micromessenger|tiktok|bytedance/i.test(userAgent);
    setIsInAppBrowser(inApp);

    if (forceInstall) {
      setShowGuideModal(true);
      return;
    }

    // 4. Kiểm tra xem người dùng đã tạm ẩn thông báo chưa (nếu forceInstall thì bỏ qua)
    const dismissedTime = localStorage.getItem("vione_pwa_prompt_dismissed_time");
    if (dismissedTime) {
      const hoursPassed = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60);
      if (hoursPassed < 24) {
        return;
      }
    }

    // 5. Bắt sự kiện beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Nếu là iOS và chưa ở chế độ standalone thì tự động hiển thị thông báo sau 1s
    if (isIos) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    setShowGuideModal(false);
    try {
      localStorage.setItem("vione_pwa_prompt_dismissed_time", Date.now().toString());
    } catch {}
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          setShowBanner(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error("Lỗi kích hoạt cài đặt PWA:", err);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  if (!showBanner && !showGuideModal) return null;

  return (
    <>
      {/* 1. BOTTOM BANNER THÔNG BÁO CÀI ĐẶT SANG TRỌNG VIỀN VÀNG */}
      {showBanner && !showGuideModal && (
        <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-5 sm:w-[440px] z-[9990] animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="relative overflow-hidden rounded-3xl border-2 border-[#D4AF37]/50 bg-[#120E0A]/95 backdrop-blur-2xl p-4 text-white shadow-[0_12px_45px_rgba(0,0,0,0.9)] ring-2 ring-[#D4AF37]/30">
            {/* Ambient Gold Glow effect */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#D4AF37]/20 blur-2xl" />

            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-[#FAF3DD] via-[#D8B282] to-[#996515] p-[1.5px] shadow-lg">
                  <div className="h-full w-full rounded-[14px] bg-[#1A130D] flex items-center justify-center overflow-hidden">
                    <img
                      src="/apple-touch-icon.png?v=vione_gold_crown"
                      alt="ViOne App"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).setAttribute("src", "/app-icon.png");
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37] text-[9px] font-black text-black">
                    ★
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-sm font-black tracking-wide text-[#F3E5AB]">
                      Cài Đặt App ViOne
                    </h4>
                    <span className="rounded-full bg-[#D4AF37]/20 px-2 py-0.5 text-[9.5px] font-bold text-[#E5C158] border border-[#D4AF37]/30">
                      Toàn Màn Hình
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-tight text-slate-300">
                    {isIosDevice
                      ? "Cài đặt ngay lên màn hình chính iPhone để trải nghiệm siêu tốc, không cần App Store."
                      : "Cài đặt ứng dụng trực tiếp lên thiết bị, mở nhanh không cần trình duyệt."}
                  </p>
                </div>
              </div>

              {/* Nút đóng */}
              <button
                type="button"
                onClick={handleDismiss}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-slate-400 hover:text-white transition active:scale-90 cursor-pointer"
                title="Đóng thông báo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Các điểm nổi bật */}
            <div className="mt-3 grid grid-cols-3 gap-2 border-y border-white/5 py-2 text-[10.5px] text-slate-300">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-[#D4AF37]" />
                <span>Toàn màn hình</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-[#D4AF37]" />
                <span>Mở siêu tốc</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-[#D4AF37]" />
                <span>Không cần tải App</span>
              </div>
            </div>

            {/* Nút hành động */}
            <div className="mt-3 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handleDismiss}
                className="px-3 py-1.5 text-[11.5px] font-medium text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                Để sau
              </button>

              <button
                type="button"
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#D8B282] via-[#E5C158] to-[#D8B282] px-4 py-2 text-xs font-bold text-[#1A120B] shadow-[0_4px_16px_rgba(216,178,130,0.35)] transition-all hover:brightness-110 active:scale-95 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Cài Đặt Ngay</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MODAL HƯỚNG DẪN CÀI ĐẶT TRỰC QUAN TO RÕ RÀNG Ở GIỮA MÀN HÌNH */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-[460px] overflow-hidden rounded-[28px] border-2 border-[#D4AF37]/60 bg-[#120E0A] p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.95)] ring-2 ring-[#D4AF37]/30 animate-in zoom-in-95 duration-200">
            {/* Ambient Glow */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#D4AF37]/20 blur-3xl" />

            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#D8B282] to-[#996515] p-0.5 shadow-md shrink-0">
                  <img
                    src="/apple-touch-icon.png?v=vione_gold_crown"
                    alt="ViOne App"
                    className="h-full w-full rounded-[14px] object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute("src", "/app-icon.png");
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#F3E5AB] flex items-center gap-1.5">
                    <span>Hướng Dẫn Cài Đặt ViOne</span>
                    <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                  </h3>
                  <p className="text-[11.5px] text-slate-300">
                    {isIosDevice
                      ? "Cài đặt lên Màn hình chính iPhone / iPad"
                      : "Cài đặt ứng dụng lên thiết bị của bạn"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ⚠️ CẢNH BÁO NẾU MỞ TRONG ZALO / MESSENGER */}
            {isInAppBrowser && (
              <div className="mt-3 rounded-xl border border-amber-500/50 bg-amber-950/80 p-3 text-[11px] text-amber-200">
                <div className="flex items-center gap-2 font-bold text-amber-100">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Bạn đang mở bằng Zalo / Messenger</span>
                </div>
                <p className="mt-1 leading-relaxed text-amber-200/90">
                  Vui lòng bấm vào dấu <strong>[ ••• ]</strong> ở góc trên bên phải màn hình và chọn{" "}
                  <strong>"Mở bằng trình duyệt Safari"</strong> để cài đặt.
                </p>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-black"
                >
                  {copiedLink ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedLink ? "Đã chép link!" : "Chép link để dán vào Safari"}</span>
                </button>
              </div>
            )}

            {/* Các bước hướng dẫn */}
            <div className="mt-4 space-y-3 rounded-2xl bg-white/5 p-4 border border-[#D4AF37]/20 text-[12.5px] text-slate-200">
              {/* Bước 1 */}
              <div className="flex items-start gap-3">
                <div className="grid h-6 w-6 place-items-center rounded-full bg-[#D4AF37]/20 text-[#E5C158] font-black text-xs shrink-0 mt-0.5 border border-[#D4AF37]/40">
                  1
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white flex items-center gap-1.5 flex-wrap">
                    <span>Chạm vào nút</span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/20 px-2 py-0.5 text-blue-400 font-bold border border-blue-400/30">
                      <Share className="h-3.5 w-3.5" /> Chia sẻ
                    </span>
                    <span>ở thanh dưới Safari</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    (Hoặc ở góc trên bên phải nếu bạn đang dùng iPad)
                  </p>
                </div>
              </div>

              {/* Bước 2 */}
              <div className="flex items-start gap-3">
                <div className="grid h-6 w-6 place-items-center rounded-full bg-[#D4AF37]/20 text-[#E5C158] font-black text-xs shrink-0 mt-0.5 border border-[#D4AF37]/40">
                  2
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white flex items-center gap-1.5 flex-wrap">
                    <span>Cuộn xuống và chọn</span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#D4AF37]/20 px-2 py-0.5 text-[#F3E5AB] font-bold border border-[#D4AF37]/30">
                      <PlusSquare className="h-3.5 w-3.5" /> Thêm vào MH chính
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    (Tên tiếng Anh: <strong>"Add to Home Screen"</strong>)
                  </p>
                </div>
              </div>

              {/* Bước 3 */}
              <div className="flex items-start gap-3">
                <div className="grid h-6 w-6 place-items-center rounded-full bg-[#D4AF37]/20 text-[#E5C158] font-black text-xs shrink-0 mt-0.5 border border-[#D4AF37]/40">
                  3
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white flex items-center gap-1 flex-wrap">
                    <span>Nhấn nút</span>
                    <span className="rounded-md bg-blue-600 px-2 py-0.5 text-white font-bold">
                      Thêm (Add)
                    </span>
                    <span>ở góc trên bên phải</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Biểu tượng ViOne mạ vàng sẽ xuất hiện ngay trên màn hình chính của bạn.
                  </p>
                </div>
              </div>
            </div>

            {/* Nút phụ: Cài qua MobileConfig */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-[#D8B282]/15 to-[#996515]/20 p-2.5 text-[11px] text-slate-300 border border-[#D4AF37]/30">
              <span className="flex items-center gap-1.5 text-[#F3E5AB] font-medium">
                <Apple className="h-3.5 w-3.5 shrink-0 text-[#D8B282]" />
                <span>Hoặc cài bằng Cấu hình Apple:</span>
              </span>
              <a
                href="/vione_ios_install.mobileconfig"
                download="vione_ios_install.mobileconfig"
                className="shrink-0 ml-2 inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#D8B282] to-[#E5C158] px-2.5 py-1 text-[10.5px] font-black text-black hover:brightness-110 transition cursor-pointer"
              >
                <Download className="h-3 w-3" />
                <span>Tải Cấu Hình</span>
              </a>
            </div>

            {/* Nút hoàn tất */}
            <div className="mt-4">
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full rounded-xl bg-gradient-to-r from-[#D8B282] via-[#E5C158] to-[#D8B282] py-2.5 text-xs font-black text-[#1A120B] shadow-[0_4px_16px_rgba(216,178,130,0.35)] transition hover:brightness-110 active:scale-95 cursor-pointer text-center"
              >
                Tôi Đã Hiểu & Đã Thêm Vào Màn Hình Chính
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
