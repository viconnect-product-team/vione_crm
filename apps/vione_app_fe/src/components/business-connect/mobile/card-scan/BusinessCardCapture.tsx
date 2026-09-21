// BC-Mobile-4A — Live in-frame business card capture.
// Streams rear camera directly inside the gold-cornered viewfinder frame.
// Supports manual snap, live auto-shutter on steady frame, camera flip, torch, and file upload.

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Sun, Crop, ScanLine, ShieldCheck, Zap, RefreshCw, ZapOff, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  AUTO_CAPTURE_STABLE_FRAMES,
  analyzeCardFrame,
  toGrayscale,
  type CardFrameReason,
} from "@/lib/business-connect/mobile/card-auto-capture";

/** Gold corner bracket — decorative alignment affordance. */
function Corner({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-7 w-7 border-[var(--bc-mobile-accent)] ${className}`}
    />
  );
}

export function BusinessCardCapture({
  onCaptured,
  onLibrary,
  error,
  autoCapture,
  onAutoCaptureChange,
}: {
  onCaptured: (file: File) => void;
  onLibrary: () => void;
  /** Auto-shutter preference (live viewfinder fires on a steady, sharp card). */
  autoCapture: boolean;
  onAutoCaptureChange: (next: boolean) => void;
  /** Already-translated, human-readable validation error (announced by parent). */
  error?: string | null;
}) {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const shotRef = useRef(false);
  const stableRef = useRef(0);
  const prevRef = useRef<Uint8Array | null>(null);

  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torch, setTorch] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<"starting" | "live" | "denied" | "unsupported" | "error">("starting");
  const [hintReason, setHintReason] = useState<CardFrameReason>("empty");
  const [shooting, setShooting] = useState(false);

  const [retryNonce, setRetryNonce] = useState(0);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const tips = [
    { icon: Sun, label: t("bc.mobile.cardScan.tip.light") },
    { icon: Crop, label: t("bc.mobile.cardScan.tip.flat") },
    { icon: ScanLine, label: t("bc.mobile.cardScan.tip.sharp") },
  ];

  const captureFrame = useCallback(() => {
    if (shotRef.current) return;
    const video = videoRef.current;

    // If live camera is available and has active video stream
    if (cameraStatus === "live" && video && video.videoWidth > 0) {
      shotRef.current = true;
      setShooting(true);

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        shotRef.current = false;
        setShooting(false);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            shotRef.current = false;
            setShooting(false);
            return;
          }
          onCaptured(new File([blob], `card-${Date.now()}.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.95,
      );
      return;
    }

    // Fallback: Trigger device camera input directly so user is never stuck
    cameraInputRef.current?.click();
  }, [cameraStatus, onCaptured]);

  // Start live camera stream
  useEffect(() => {
    let cancelled = false;
    shotRef.current = false;
    setShooting(false);
    stableRef.current = 0;
    setCameraStatus("starting");

    async function initCamera() {
      const hasMedia =
        typeof navigator !== "undefined" &&
        (navigator.mediaDevices?.getUserMedia ||
          (navigator as any)?.getUserMedia ||
          (navigator as any)?.webkitGetUserMedia);

      if (!hasMedia) {
        if (!cancelled) setCameraStatus("unsupported");
        return;
      }

      // Stop previous tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const getMedia = (c: MediaStreamConstraints) => {
        if (navigator?.mediaDevices?.getUserMedia) {
          return navigator.mediaDevices.getUserMedia(c);
        }
        const legacy =
          (navigator as any)?.getUserMedia ||
          (navigator as any)?.webkitGetUserMedia ||
          (navigator as any)?.mozGetUserMedia;
        if (legacy) {
          return new Promise<MediaStream>((res, rej) => legacy.call(navigator, c, res, rej));
        }
        return Promise.reject(new Error("No camera support"));
      };

      try {
        let stream: MediaStream | null = null;
        // 1. Mobile-friendly 720p without rigid min bounds (prevents OverconstrainedError in portrait orientation)
        try {
          stream = await getMedia({
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch {
          /* fallback */
        }

        if (!stream) {
          try {
            stream = await getMedia({
              video: { facingMode },
              audio: false,
            });
          } catch {
            /* fallback */
          }
        }

        if (!stream) {
          stream = await getMedia({ video: true, audio: false });
        }

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack?.getCapabilities) {
          const caps = videoTrack.getCapabilities() as any;
          setHasTorch(Boolean(caps?.torch));
        }

        const bindVideo = () => {
          const video = videoRef.current;
          if (video && stream) {
            if (video.srcObject !== stream) {
              video.srcObject = stream;
              video.setAttribute("playsinline", "true");
              video.setAttribute("webkit-playsinline", "true");
              video.muted = true;
              video.autoplay = true;
              video.play().catch(() => {});
            }
            return true;
          }
          return false;
        };

        bindVideo();

        // Wait up to 3.5s for video frames
        const startT = Date.now();
        while (Date.now() - startT < 3500) {
          if (cancelled) return;
          if (bindVideo() && videoRef.current && videoRef.current.videoWidth > 0) {
            break;
          }
          await new Promise((r) => setTimeout(r, 60));
        }

        if (!cancelled) {
          setCameraStatus("live");
        }
      } catch (err: any) {
        if (cancelled) return;
        if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
          setCameraStatus("denied");
        } else {
          setCameraStatus("error");
        }
      }
    }

    void initCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode, retryNonce]);

  // Torch control
  useEffect(() => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        void track.applyConstraints({
          advanced: [{ torch } as any],
        });
      } catch {
        /* ignore */
      }
    }
  }, [torch, hasTorch]);

  // Auto-capture frame analysis loop
  useEffect(() => {
    if (cameraStatus !== "live" || !autoCapture || shooting) return;

    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = 96;
    sampleCanvas.height = 60;
    const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
    if (!sampleCtx) return;

    let intervalId: any = null;

    const checkFrame = () => {
      if (shotRef.current || shooting) return;
      const video = videoRef.current;
      if (!video || !video.videoWidth || video.readyState < 2) return;

      try {
        sampleCtx.drawImage(video, 0, 0, sampleCanvas.width, sampleCanvas.height);
        const imgData = sampleCtx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height);
        const gray = toGrayscale(imgData.data);
        const analysis = analyzeCardFrame(gray, sampleCanvas.width, sampleCanvas.height, prevRef.current);
        prevRef.current = gray;
        setHintReason(analysis.reason);

        if (analysis.reason === "ok") {
          stableRef.current += 1;
          if (stableRef.current >= AUTO_CAPTURE_STABLE_FRAMES) {
            captureFrame();
          }
        } else {
          stableRef.current = 0;
        }
      } catch {
        /* ignore analysis error */
      }
    };

    intervalId = setInterval(checkFrame, 150);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [cameraStatus, autoCapture, shooting, captureFrame]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col pb-36">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 sm:px-6 pb-6">
        <p className="mt-1 text-center text-[15px] font-medium text-[var(--bc-mobile-text)]">
          {t("bc.mobile.cardScan.guide")}
        </p>
        <p className="mt-1 text-center text-[13px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.cardScan.lead")}
        </p>

        {/* Live Camera Viewfinder Frame */}
        <div
          role="img"
          aria-label={t("bc.mobile.cardScan.frameLabel")}
          className="relative mx-auto mt-5 aspect-[1.586/1] w-full max-w-[360px] rounded-3xl border-2 border-[var(--bc-mobile-border)] bg-black overflow-hidden shadow-2xl"
        >
          {/* Live Video Feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            aria-hidden="true"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              cameraStatus === "live" ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Golden Corner Alignment Brackets */}
          <Corner className="left-3 top-3 rounded-tl-xl border-l-3 border-t-3" />
          <Corner className="right-3 top-3 rounded-tr-xl border-r-3 border-t-3" />
          <Corner className="bottom-3 left-3 rounded-bl-xl border-b-3 border-l-3" />
          <Corner className="bottom-3 right-3 rounded-br-xl border-b-3 border-r-3" />

          {/* Guide Line / Laser Scanner */}
          {cameraStatus === "live" && (
            <>
              <span
                aria-hidden
                className="absolute inset-x-6 top-1/2 h-px bg-[linear-gradient(90deg,transparent,var(--bc-mobile-accent),transparent)] opacity-60 pointer-events-none"
              />
              <div className="absolute inset-x-8 top-3 h-0.5 animate-[scan_2.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-[var(--bc-mobile-accent)] to-transparent opacity-80 pointer-events-none shadow-[0_0_12px_var(--bc-mobile-accent)]" />
            </>
          )}

          {/* Top Controls Overlay: Flip & Torch */}
          {cameraStatus === "live" && (
            <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
              {hasTorch && (
                <button
                  type="button"
                  onClick={() => setTorch((v) => !v)}
                  aria-label="Bật/Tắt đèn flash"
                  className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-colors cursor-pointer shadow-md ${
                    torch
                      ? "bg-[var(--bc-mobile-accent)] text-slate-950 ring-2 ring-[var(--bc-mobile-accent)]/50"
                      : "bg-black/60 text-white hover:bg-black/80"
                  }`}
                >
                  {torch ? <Zap className="h-4 w-4 fill-current" /> : <ZapOff className="h-4 w-4" />}
                </button>
              )}
              <button
                type="button"
                onClick={() => setFacingMode((m) => (m === "environment" ? "user" : "environment"))}
                aria-label="Đổi camera"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition-colors cursor-pointer shadow-md"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Fallback / Loading overlay */}
          {cameraStatus !== "live" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-[var(--bc-mobile-surface-2)]">
              {cameraStatus === "starting" ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--bc-mobile-accent)]" />
                  <p className="text-xs font-semibold text-[var(--bc-mobile-text)]">Đang kết nối camera live...</p>
                </div>
              ) : cameraStatus === "denied" ? (
                <div className="flex flex-col items-center gap-2">
                  <Camera className="h-7 w-7 text-amber-500" />
                  <p className="text-xs font-semibold text-[var(--bc-mobile-text)]">Quyền truy cập camera bị từ chối</p>
                  <p className="text-[11px] text-[var(--bc-mobile-muted)] max-w-[220px]">
                    Vui lòng cấp quyền camera trong trình duyệt hoặc chọn ảnh danh thiếp từ thư viện.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 px-3">
                  <div className="p-2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    <Camera className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold text-[var(--bc-mobile-text)]">
                    {typeof window !== "undefined" && !window.isSecureContext
                      ? "Chụp ảnh danh thiếp bằng Camera"
                      : "Đặt danh thiếp trong khung"}
                  </p>
                  <p className="text-[11px] text-[var(--bc-mobile-muted)] max-w-[270px] leading-relaxed text-center">
                    {typeof window !== "undefined" && !window.isSecureContext
                      ? "Nhấn nút bên dưới để mở trực tiếp máy ảnh thiết bị chụp danh thiếp và số hoá tự động."
                      : "Chụp hoặc tải ảnh danh thiếp để số hoá tự động"}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white shadow-md cursor-pointer hover:brightness-105 active:scale-95 transition-all"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Mở Máy Ảnh Chụp Ngay</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onLibrary()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] text-[var(--bc-mobile-text)] hover:opacity-80 active:scale-95 transition-all"
                    >
                      <ImagePlus className="h-3.5 w-3.5 text-amber-500" />
                      <span>Chọn từ thư viện</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Live Auto-capture hint chip */}
          {cameraStatus === "live" && autoCapture && (
            <div className="absolute bottom-2.5 inset-x-0 flex justify-center pointer-events-none z-20">
              <span className="px-3 py-1 rounded-full bg-black/75 text-[11px] font-semibold text-white backdrop-blur-md shadow-lg border border-white/10 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>
                  {hintReason === "ok"
                    ? "Giữ yên máy để tự động chụp..."
                    : hintReason === "dark"
                      ? "Thiếu sáng, hãy bật đèn flash"
                      : hintReason === "glare"
                        ? "Tránh bóng loá phản chiếu"
                        : hintReason === "blurry"
                          ? "Giữ chắc tay để lấy nét"
                          : "Đặt danh thiếp vào giữa khung"}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* 3 Truthful Tips */}
        <ul className="mx-auto mt-4 grid w-full max-w-[360px] grid-cols-3 gap-2">
          {tips.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-2 py-2.5 text-center shadow-xs"
            >
              <Icon
                className="h-4 w-4 text-[var(--bc-mobile-accent)]"
                strokeWidth={1.8}
                aria-hidden
              />
              <span className="text-[11px] leading-tight text-[var(--bc-mobile-muted)]">
                {label}
              </span>
            </li>
          ))}
        </ul>

        {/* Auto Capture Toggle */}
        <div className="mx-auto mt-3 flex w-full max-w-[360px] items-center gap-3 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-3.5 py-3 shadow-xs">
          <Zap
            className={`h-4 w-4 ${autoCapture ? "text-[var(--bc-mobile-accent)]" : "text-[var(--bc-mobile-muted)]"}`}
            strokeWidth={1.8}
            aria-hidden
          />
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-[var(--bc-mobile-text)]">
              {t("bc.mobile.cardScan.auto.toggle")}
            </span>
            <span className="block text-[11px] leading-tight text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.cardScan.auto.toggleHint")}
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={autoCapture}
            aria-label={t("bc.mobile.cardScan.auto.toggle")}
            onClick={() => onAutoCaptureChange(!autoCapture)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
              autoCapture
                ? "bg-[var(--bc-mobile-accent)]"
                : "bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)]"
            }`}
          >
            <span
              aria-hidden
              className={`absolute top-1/2 h-4.5 w-4.5 -translate-y-1/2 rounded-full bg-white transition-[left] shadow-sm ${
                autoCapture ? "left-[22px]" : "left-1"
              }`}
              style={{ height: 18, width: 18 }}
            />
          </button>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 text-center text-[13px] font-medium text-[var(--bc-mobile-danger)]"
          >
            {error}
          </p>
        ) : null}
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-6 pt-4 pb-6 border-t border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)]/95 backdrop-blur-md"
        style={{
          paddingBottom: "calc(var(--bc-mobile-nav-h) + var(--bc-mobile-safe-bottom) + 12px)",
        }}
      >
        <div className="mx-auto grid w-full max-w-[360px] gap-2.5">
          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-[var(--bc-mobile-muted)]">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" strokeWidth={1.8} aria-hidden />
            {t("bc.mobile.cardScan.privacy")}
          </p>

          <div className="flex items-center gap-3">
            {/* Take Photo Button */}
            <button
              type="button"
              onClick={captureFrame}
              disabled={shooting}
              className="flex-1 flex h-13 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 font-bold text-[15px] shadow-lg hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
            >
              {shooting ? (
                <Loader2 className="h-5 w-5 animate-spin text-slate-950" />
              ) : (
                <Camera className="h-5 w-5 text-slate-950" />
              )}
              <span>{t("bc.mobile.cardScan.takePhoto")}</span>
            </button>

            {/* Choose from Library Button */}
            <button
              type="button"
              onClick={onLibrary}
              className="flex h-13 w-13 items-center justify-center rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-text)] hover:opacity-80 active:scale-[0.98] transition-all cursor-pointer shrink-0 shadow-sm"
              title={t("bc.mobile.cardScan.choosePhoto")}
              aria-label={t("bc.mobile.cardScan.choosePhoto")}
            >
              <ImagePlus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Hidden file input for native camera fallback */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onCaptured(file);
          }
          e.target.value = "";
        }}
      />
    </div>
  );
}

