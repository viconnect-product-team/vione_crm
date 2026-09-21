import { QrCode, Wifi, ScanLine } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useQrScanner, type ScannerStatus } from "@/hooks/use-qr-scanner";
import { useNfcScanner } from "@/hooks/use-nfc-scanner";

type Props = {
  mode: "qr" | "nfc";
  onScan: (value: string) => void;
  onSimulate: () => void;
};

function qrStatusKey(status: ScannerStatus) {
  switch (status) {
    case "starting":
      return "checkin.cam.starting" as const;
    case "scanning":
      return "checkin.cam.scanning" as const;
    case "denied":
      return "checkin.cam.denied" as const;
    case "unsupported":
      return "checkin.cam.unsupported" as const;
    case "error":
      return "checkin.cam.error" as const;
    default:
      return "checkin.qr_hint" as const;
  }
}

export function Scanner({ mode, onScan, onSimulate }: Props) {
  const t = useT();
  const { videoRef, status: qrStatus } = useQrScanner({ active: mode === "qr", onDetect: onScan });
  const { status: nfcStatus } = useNfcScanner({ active: mode === "nfc", onDetect: onScan });

  const live = mode === "qr" ? qrStatus === "scanning" : nfcStatus === "scanning";
  const qrFallback = qrStatus === "unsupported" || qrStatus === "denied" || qrStatus === "error";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[oklch(0.18_0.05_265)] to-[oklch(0.22_0.06_265)] p-6 text-primary-foreground shadow-[var(--shadow-elevated)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {mode === "qr" ? <QrCode className="h-5 w-5" /> : <Wifi className="h-5 w-5" />}
          <h2 className="text-base font-semibold">
            {mode === "qr" ? t("checkin.scan_qr") : t("checkin.tap_nfc")}
          </h2>
        </div>
        <span className="flex items-center gap-2 rounded-full bg-card/10 px-3 py-1 text-[11px] font-medium">
          <span className="relative flex h-2 w-2">
            {live && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${live ? "bg-success" : "bg-card/40"}`}
            />
          </span>
          {live ? t("checkin.live") : t("checkin.continuous")}
        </span>
      </div>

      {mode === "qr" ? (
        <div
          onClick={onSimulate}
          title="Bấm vào khung hình để mô phỏng quét QR thành công (Chế độ Dev)"
          className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-xl bg-foreground/60 cursor-pointer group/cam"
        >
          {/* Live camera feed */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              qrStatus === "scanning" ? "opacity-100" : "opacity-0"
            }`}
          />
          {/* Fallback backdrop when the camera isn't running */}
          {qrStatus !== "scanning" && (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,oklch(0.30_0.08_270)_0%,oklch(0.12_0.04_265)_70%)]" />
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(oklch(0.6_0.15_280)_1px,transparent_1px),linear-gradient(90deg,oklch(0.6_0.15_280)_1px,transparent_1px)",
                  backgroundSize: "32px 32px",
                }}
              />
            </>
          )}
          {/* Scanning frame */}
          <div className="absolute inset-10 rounded-2xl border-2 border-border/30">
            <span className="absolute -left-1 -top-1 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-primary-glow" />
            <span className="absolute -right-1 -top-1 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-primary-glow" />
            <span className="absolute -bottom-1 -left-1 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-primary-glow" />
            <span className="absolute -bottom-1 -right-1 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-primary-glow" />
            {qrStatus === "scanning" && (
              <span className="pointer-events-none absolute inset-x-2 top-2 h-1 animate-[scan_2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-primary-glow to-transparent shadow-[0_0_18px_oklch(0.62_0.22_285)]" />
            )}
          </div>
          {qrStatus !== "scanning" && (
            <ScanLine className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-primary-foreground/30" />
          )}
        </div>
      ) : (
        <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center rounded-xl bg-foreground/40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,oklch(0.35_0.18_285)_0%,oklch(0.12_0.04_265)_70%)]" />
          {nfcStatus === "scanning" &&
            [0, 1, 2].map((i) => (
              <span
                key={i}
                className="absolute h-40 w-40 animate-ping rounded-full border-2 border-primary-glow opacity-60"
                style={{ animationDelay: `${i * 0.6}s`, animationDuration: "2.4s" }}
              />
            ))}
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow shadow-[0_0_60px_oklch(0.62_0.22_285_/_0.6)]">
            <Wifi className="h-14 w-14 -rotate-90 text-primary-foreground" />
          </div>
        </div>
      )}

      <p
        className="mt-5 text-center text-sm text-primary-foreground/80"
        role="status"
        aria-live="polite"
      >
        {mode === "qr"
          ? t(qrStatusKey(qrStatus))
          : nfcStatus === "unsupported"
            ? "Thiết bị hoặc trình duyệt chưa hỗ trợ Web NFC (hỗ trợ Google Chrome trên Android)"
            : nfcStatus === "insecure"
              ? "Chạm NFC yêu cầu kết nối bảo mật HTTPS"
              : nfcStatus === "denied"
                ? "Quyền truy cập NFC bị từ chối trong trình duyệt"
                : nfcStatus === "error"
                  ? "Không thể bật NFC. Hãy bật NFC trong Cài đặt của máy"
                  : "Sẵn sàng quét NFC — Áp thẻ vào giữa mặt lưng điện thoại"}
      </p>

      <button
        onClick={onSimulate}
        className="mx-auto mt-4 flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-200 backdrop-blur transition hover:bg-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 cursor-pointer"
      >
        <ScanLine className="h-3.5 w-3.5 text-emerald-300" />
        ⚡ Quét mã QR thành công ngay (Bypass Dev)
      </button>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0.2; }
          50% { transform: translateY(calc(100% - 0.5rem)); opacity: 1; }
          100% { transform: translateY(0); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
