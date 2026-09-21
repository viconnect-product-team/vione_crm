// BC-Mobile-4A — live viewfinder with automatic shutter.
//
// Opens the rear camera, samples the framed region a few times per second and
// fires one automatic shot once the card looks bright, sharp and steady for
// AUTO_CAPTURE_STABLE_FRAMES consecutive samples. Manual shutter stays
// available; nothing is uploaded or stored here — the captured JPEG is handed
// to the existing scan flow exactly like a picked file.

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, ShieldAlert, X } from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";
import {
  AUTO_CAPTURE_STABLE_FRAMES,
  analyzeCardFrame,
  toGrayscale,
  type CardFrameReason,
} from "@/lib/business-connect/mobile/card-auto-capture";

const SAMPLE_W = 96;
const SAMPLE_H = 60;
const SAMPLE_INTERVAL_MS = 120;

const REASON_KEY: Record<CardFrameReason, TKey> = {
  dark: "bc.mobile.cardScan.auto.hint.dark",
  glare: "bc.mobile.cardScan.auto.hint.glare",
  blurry: "bc.mobile.cardScan.auto.hint.blurry",
  empty: "bc.mobile.cardScan.auto.hint.empty",
  motion: "bc.mobile.cardScan.auto.hint.motion",
  ok: "bc.mobile.cardScan.auto.hint.ok",
};

function Corner({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-7 w-7 border-[var(--bc-mobile-accent)] ${className}`}
    />
  );
}

export function LiveCardAutoCapture({
  onCaptured,
  onCancel,
  onManualFallback,
}: {
  onCaptured: (file: File) => void;
  onCancel: () => void;
  /** Human chose the native camera input instead of the live viewfinder. */
  onManualFallback: () => void;
}) {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const prevRef = useRef<Uint8Array | null>(null);
  const stableRef = useRef(0);
  const shotRef = useRef(false);
  const [reason, setReason] = useState<CardFrameReason>("empty");
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  /** Truthful permission lifecycle for the live viewfinder. */
  const [permission, setPermission] = useState<
    "requesting" | "granted" | "denied" | "unsupported" | "error"
  >("requesting");
  const [attempt, setAttempt] = useState(0);
  const [shooting, setShooting] = useState(false);

  const capture = useCallback(() => {
    if (shotRef.current) return;
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
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
      0.92,
    );
  }, [onCaptured]);

  // Open the camera; always release the tracks on unmount. Re-runs on retry.
  useEffect(() => {
    let cancelled = false;
    setPermission("requesting");
    setReady(false);
    async function start() {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) setPermission("unsupported");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        // The <video> element only mounts once permission is "granted", so the
        // stream is attached by the effect below — not here (videoRef is null).
        setPermission("granted");
      } catch (err) {
        if (cancelled) return;
        const name = (err as { name?: string } | null)?.name ?? "";
        if (
          name === "NotAllowedError" ||
          name === "PermissionDeniedError" ||
          name === "SecurityError"
        ) {
          setPermission("denied");
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setPermission("unsupported");
        } else {
          setPermission("error");
        }
      }
    }
    void start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [attempt]);

  // Attach the live stream once the viewfinder is actually mounted, then wait
  // for real frames (videoWidth > 0) before the sampling loop starts.
  useEffect(() => {
    if (permission !== "granted") return undefined;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return undefined;
    let cancelled = false;
    video.srcObject = stream;
    video.muted = true;
    video.setAttribute("playsinline", "true");
    void video.play().catch(() => undefined);
    function markReady() {
      if (!cancelled && video && video.videoWidth > 0) setReady(true);
    }
    video.addEventListener("loadedmetadata", markReady);
    video.addEventListener("playing", markReady);
    markReady();
    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", markReady);
      video.removeEventListener("playing", markReady);
    };
  }, [permission, attempt]);


  // Sampling loop — only while the stream is live and no shot has fired.
  useEffect(() => {
    if (!ready) return undefined;
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_W;
    canvas.height = SAMPLE_H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const id = window.setInterval(() => {
      const video = videoRef.current;
      if (!ctx || !video || !video.videoWidth || shotRef.current) return;
      // Region of interest: the centred 1.586:1 card frame (80% of width).
      const roiW = video.videoWidth * 0.8;
      const roiH = Math.min(roiW / 1.586, video.videoHeight * 0.8);
      const roiX = (video.videoWidth - roiW) / 2;
      const roiY = (video.videoHeight - roiH) / 2;
      ctx.drawImage(video, roiX, roiY, roiW, roiH, 0, 0, SAMPLE_W, SAMPLE_H);
      const gray = toGrayscale(ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data);
      const result = analyzeCardFrame(gray, SAMPLE_W, SAMPLE_H, prevRef.current);
      prevRef.current = gray;
      setReason(result.reason);
      stableRef.current = result.ok ? stableRef.current + 1 : 0;
      setProgress(Math.min(1, stableRef.current / AUTO_CAPTURE_STABLE_FRAMES));
      if (stableRef.current >= AUTO_CAPTURE_STABLE_FRAMES) capture();
    }, SAMPLE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [ready, capture]);

  // Permission guidance panel — shown until the live stream is actually running.
  if (permission !== "granted") {
    const copy =
      permission === "requesting"
        ? {
            title: "bc.mobile.cardScan.perm.requestingTitle" as TKey,
            desc: "bc.mobile.cardScan.perm.requestingDesc" as TKey,
          }
        : permission === "denied"
          ? {
              title: "bc.mobile.cardScan.perm.deniedTitle" as TKey,
              desc: "bc.mobile.cardScan.perm.deniedDesc" as TKey,
            }
          : permission === "unsupported"
            ? {
                title: "bc.mobile.cardScan.perm.unsupportedTitle" as TKey,
                desc: "bc.mobile.cardScan.perm.unsupportedDesc" as TKey,
              }
            : {
                title: "bc.mobile.cardScan.perm.errorTitle" as TKey,
                desc: "bc.mobile.cardScan.perm.errorDesc" as TKey,
              };
    const steps: TKey[] =
      permission === "denied"
        ? [
            "bc.mobile.cardScan.perm.step.ios",
            "bc.mobile.cardScan.perm.step.android",
            "bc.mobile.cardScan.perm.step.reload",
          ]
        : [];

    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-center bg-[var(--bc-mobile-bg)] px-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bc-cam-perm-title"
          className="mx-auto w-full max-w-[340px] rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-5"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)]">
            {permission === "requesting" ? (
              <Loader2
                className="h-5 w-5 animate-spin text-[var(--bc-mobile-accent)] motion-reduce:animate-none"
                strokeWidth={1.8}
                aria-hidden
              />
            ) : (
              <ShieldAlert
                className="h-5 w-5 text-[var(--bc-mobile-accent)]"
                strokeWidth={1.8}
                aria-hidden
              />
            )}
          </span>
          <h2
            id="bc-cam-perm-title"
            className="mt-3 text-[16px] font-semibold text-[var(--bc-mobile-text)]"
          >
            {t(copy.title)}
          </h2>
          <p
            role="status"
            aria-live="polite"
            className="mt-1.5 text-[13px] leading-relaxed text-[var(--bc-mobile-muted)]"
          >
            {t(copy.desc)}
          </p>

          {steps.length > 0 ? (
            <ol className="mt-3 grid gap-2 border-t border-[var(--bc-mobile-border-subtle)] pt-3">
              {steps.map((key) => (
                <li key={key} className="text-[12px] leading-relaxed text-[var(--bc-mobile-muted)]">
                  {t(key)}
                </li>
              ))}
            </ol>
          ) : null}

          <div className="mt-4 grid gap-2">
            {permission !== "requesting" && permission !== "unsupported" ? (
              <button
                type="button"
                onClick={() => setAttempt((n) => n + 1)}
                className="bc-cta-gold flex h-11 items-center justify-center rounded-full px-6 text-[14px] font-semibold"
              >
                {t("bc.mobile.cardScan.perm.retry")}
              </button>
            ) : null}
            {permission !== "requesting" ? (
              <button
                type="button"
                onClick={onManualFallback}
                className="flex h-11 items-center justify-center gap-2 rounded-full border border-[var(--bc-mobile-border)] px-6 text-[14px] font-medium text-[var(--bc-mobile-text)]"
              >
                <Camera className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                {t("bc.mobile.cardScan.perm.manual")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onCancel}
              className="flex h-10 items-center justify-center gap-2 rounded-full px-6 text-[13px] font-medium text-[var(--bc-mobile-muted)]"
            >
              <X className="h-4 w-4" strokeWidth={1.8} aria-hidden />
              {t("bc.mobile.cardScan.auto.close")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        aria-label={t("bc.mobile.cardScan.auto.videoLabel")}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/35" aria-hidden />

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-6">
        <div
          role="img"
          aria-label={t("bc.mobile.cardScan.frameLabel")}
          className="relative aspect-[1.586/1] w-full max-w-[340px] rounded-2xl border border-white/25"
        >
          <Corner className="left-2.5 top-2.5 rounded-tl-xl border-l-2 border-t-2" />
          <Corner className="right-2.5 top-2.5 rounded-tr-xl border-r-2 border-t-2" />
          <Corner className="bottom-2.5 left-2.5 rounded-bl-xl border-b-2 border-l-2" />
          <Corner className="bottom-2.5 right-2.5 rounded-br-xl border-b-2 border-r-2" />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1 origin-left rounded-full bg-[var(--bc-mobile-accent)] transition-[transform] duration-150"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
        <p
          role="status"
          aria-live="polite"
          className="mt-5 rounded-full bg-black/55 px-4 py-2 text-center text-[13px] font-medium text-white"
        >
          {shooting ? t("bc.mobile.cardScan.auto.capturing") : t(REASON_KEY[reason])}
        </p>
      </div>

      <div
        className="relative z-10 px-6 pt-4"
        style={{
          paddingBottom: "calc(var(--bc-mobile-safe-bottom) + 24px)",
        }}
      >
        <div className="mx-auto grid w-full max-w-[340px] gap-3">
          <button
            type="button"
            onClick={capture}
            disabled={shooting}
            className="bc-cta-gold mx-auto flex h-12 min-w-[220px] items-center justify-center gap-2 rounded-full px-10 text-[15px] font-semibold disabled:opacity-60"
          >
            <Camera className="h-5 w-5" strokeWidth={1.8} aria-hidden />
            {t("bc.mobile.cardScan.auto.manual")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="mx-auto flex h-11 min-w-[220px] items-center justify-center gap-2 rounded-full border border-white/25 px-10 text-[14px] font-medium text-white"
          >
            <X className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            {t("bc.mobile.cardScan.auto.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
