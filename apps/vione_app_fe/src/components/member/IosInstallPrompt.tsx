import { useState, useEffect } from "react";
import { Share, PlusSquare, X, Smartphone, Sparkles } from "lucide-react";

export function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if device is iOS (iPhone/iPad/iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);

    // Check if already running in standalone mode (installed PWA)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    // Check if previously dismissed in this session or week
    const dismissed = localStorage.getItem("ceo1983_pwa_ios_dismissed");

    if (isIos && !isStandalone && !dismissed) {
      // Delay slightly so it doesn't conflict with initial page render
      const timer = setTimeout(() => setShowPrompt(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    try {
      localStorage.setItem("ceo1983_pwa_ios_dismissed", "true");
    } catch {}
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 z-[9990] animate-slide-up">
      <div className="rounded-3xl border border-amber-500/40 bg-slate-900/95 backdrop-blur-xl p-4 text-white shadow-2xl ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#003B95] to-amber-500 p-0.5 shadow-md shrink-0">
              <img
                src="/apple-touch-icon.png"
                alt="CEO 1983 App"
                className="h-full w-full rounded-[10px] object-cover"
              />
            </div>
            <div>
              <h4 className="text-xs font-black text-white flex items-center gap-1">
                <span>Cài Đặt App CEO 1983</span>
                <Sparkles className="h-3 w-3 text-amber-400" />
              </h4>
              <p className="text-[10.5px] text-amber-300 font-medium">
                Trải nghiệm toàn màn hình trên iOS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-2 rounded-2xl bg-white/5 p-3 text-[11.5px] text-slate-200 border border-white/5 my-2.5">
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-amber-500/20 text-amber-400 font-black text-[10px] shrink-0">
              1
            </span>
            <span className="flex items-center gap-1 flex-wrap">
              Bấm nút <Share className="inline h-3.5 w-3.5 text-blue-400 mx-0.5" /> (Chia sẻ) ở thanh dưới Safari
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-amber-500/20 text-amber-400 font-black text-[10px] shrink-0">
              2
            </span>
            <span className="flex items-center gap-1 flex-wrap">
              Chọn <PlusSquare className="inline h-3.5 w-3.5 text-amber-400 mx-0.5" /> <strong>Thêm vào MH chính</strong> (Add to Home Screen)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-amber-500/20 text-amber-400 font-black text-[10px] shrink-0">
              3
            </span>
            <span>
              Nhấn <strong>Thêm</strong> ở góc trên bên phải để mở app từ màn hình chính
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Smartphone className="h-3 w-3" />
            <span>Mượt mà như App Store</span>
          </span>
          <button
            type="button"
            onClick={handleDismiss}
            style={{ color: "#ffffff" }}
            className="rounded-xl bg-[#003B95] hover:bg-[#002B70] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition active:scale-95 cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
