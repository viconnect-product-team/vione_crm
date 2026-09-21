import { useEffect, useRef, useState } from "react";
import { decodeQrFromImage, decodeFromCanvas } from "@/lib/qr-image-decoder";

export type ScannerStatus = "idle" | "starting" | "scanning" | "denied" | "unsupported" | "error";

interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: ImageBitmapSource | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): Promise<DetectedBarcode[]>;
}
type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => BarcodeDetectorLike;

type TorchTrack = MediaStreamTrack;
interface TorchCapabilities {
  torch?: boolean;
}

/**
 * Play a crisp subtle success chime on QR detection (Web Audio API)
 */
function playSuccessBeep() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08); // E6

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
    setTimeout(() => ctx.close().catch(() => {}), 150);
  } catch {
    /* ignore audio policy errors */
  }
}

/**
 * Real-time camera QR scanner with Zalo/Banking-app grade dual-resolution square cropping.
 * 1. Native BarcodeDetector (hardware accelerated)
 * 2. High-res Center-Square Crop (guarantees small/dense QR codes inside the square viewfinder are sharp)
 * 3. Full-Frame Canvas Decoder (detects QR anywhere on screen)
 * 4. Audio Beep & Haptic Vibration on detection
 */
export function useQrScanner(opts: {
  active: boolean;
  onDetect: (value: string) => void;
  torch?: boolean;
  facingMode?: "environment" | "user";
}) {
  const { active, onDetect, torch = false, facingMode = "environment" } = opts;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trackRef = useRef<TorchTrack | null>(null);
  const onDetectRef = useRef(onDetect);
  onDetectRef.current = onDetect;
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [hasTorch, setHasTorch] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const retry = () => setRetryNonce((n) => n + 1);

  useEffect(() => {
    if (!active) {
      setStatus("idle");
      return;
    }
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    let lastValue = "";
    let lastTime = 0;

    const triggerDetect = (val: string) => {
      const now = Date.now();
      if (val && (val !== lastValue || now - lastTime > 2000)) {
        lastValue = val;
        lastTime = now;

        // 1. Audio chime
        playSuccessBeep();

        // 2. Haptic feedback on mobile if supported
        if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
          try {
            navigator.vibrate([50, 30, 50]);
          } catch {
            /* ignore */
          }
        }

        // 3. Callback
        onDetectRef.current(val);
      }
    };

    async function getCameraStream(): Promise<MediaStream> {
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

      // 1. Mobile-friendly ideal 720p without rigid min bounds (prevents OverconstrainedError in portrait orientation)
      try {
        return await getMedia({
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

      // 2. Simple facingMode
      try {
        return await getMedia({
          video: { facingMode },
          audio: false,
        });
      } catch {
        /* fallback */
      }

      // 3. Fallback to any camera
      return await getMedia({
        video: true,
        audio: false,
      });
    }

    async function start() {
      const hasMedia =
        typeof navigator !== "undefined" &&
        (navigator.mediaDevices?.getUserMedia ||
          (navigator as any)?.getUserMedia ||
          (navigator as any)?.webkitGetUserMedia);

      if (!hasMedia) {
        setStatus("unsupported");
        return;
      }
      setStatus("starting");

      try {
        stream = await getCameraStream();
      } catch (e) {
        if (stopped) return;
        const err = e as DOMException;
        setStatus(err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError" ? "denied" : "error");
        return;
      }

      if (stopped) {
        if (stream) {
          stream.getTracks().forEach((t) => {
            try {
              t.stop();
              t.enabled = false;
            } catch {}
          });
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        return;
      }

      const videoTrack = stream.getVideoTracks()[0] as TorchTrack | undefined;
      trackRef.current = videoTrack ?? null;

      // Check torch capability
      if (videoTrack?.getCapabilities) {
        const caps = videoTrack.getCapabilities() as TorchCapabilities;
        setHasTorch(Boolean(caps?.torch));
      }

      const bindStreamToVideo = async () => {
        const video = videoRef.current;
        if (!video || !stream) return false;
        if (video.srcObject !== stream) {
          video.srcObject = stream;
          video.setAttribute("playsinline", "true");
          video.setAttribute("webkit-playsinline", "true");
          video.muted = true;
          video.autoplay = true;
          try {
            await video.play();
          } catch {
            /* autoplay guard */
          }
        }
        return video.videoWidth > 0 && video.readyState >= 2;
      };

      await bindStreamToVideo();

      // Wait for video stream to initialize and keep binding if element mounted later
      const waitForVideo = async (maxWaitMs = 3000): Promise<boolean> => {
        const startT = Date.now();
        while (Date.now() - startT < maxWaitMs) {
          if (stopped) return false;
          const isReady = await bindStreamToVideo();
          if (isReady) return true;
          await new Promise((r) => setTimeout(r, 50));
        }
        await bindStreamToVideo();
        return true;
      };

      await waitForVideo();
      if (stopped) {
        if (stream) {
          stream.getTracks().forEach((t) => {
            try {
              t.stop();
              t.enabled = false;
            } catch {}
          });
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        return;
      }

      setStatus("scanning");

      const Ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
      let nativeDetector: BarcodeDetectorLike | null = null;
      if (Ctor) {
        try {
          nativeDetector = new Ctor({ formats: ["qr_code"] });
        } catch {
          nativeDetector = null;
        }
      }

      // Two dedicated scratch canvases for dual-pass scanning
      // Canvas 1: Center Square Crop (high pixel density on the QR code inside the viewfinder)
      const cropCanvas = document.createElement("canvas");
      const cropCtx = cropCanvas.getContext("2d", { willReadFrequently: true });

      // Canvas 2: Full Frame (scaled to optimal 800px)
      const fullCanvas = document.createElement("canvas");
      const fullCtx = fullCanvas.getContext("2d", { willReadFrequently: true });

      let isDecoding = false;
      let frameCounter = 0;

      const scanLoop = async () => {
        if (stopped || !videoRef.current) return;
        const v = videoRef.current;

        if (v.readyState >= 2 && v.videoWidth > 0 && !isDecoding) {
          isDecoding = true;
          frameCounter++;

          try {
            const vw = v.videoWidth;
            const vh = v.videoHeight;

            // 1. Try native BarcodeDetector directly on video if available
            if (nativeDetector) {
              try {
                const codes = await nativeDetector.detect(v);
                if (codes.length > 0 && codes[0].rawValue) {
                  triggerDetect(codes[0].rawValue);
                  isDecoding = false;
                  if (!stopped) raf = requestAnimationFrame(scanLoop);
                  return;
                }
              } catch {
                /* continue to canvas decoder */
              }
            }

            // 2. High-density Center-Square Crop (Focus Region)
            // Extract the center 65% square matching the visual viewfinder box
            if (cropCtx) {
              const squareSize = Math.min(vw, vh);
              const cropSize = Math.floor(squareSize * 0.7);
              const sx = Math.floor((vw - cropSize) / 2);
              const sy = Math.floor((vh - cropSize) / 2);

              const targetCropDim = Math.min(cropSize, 720);
              if (cropCanvas.width !== targetCropDim || cropCanvas.height !== targetCropDim) {
                cropCanvas.width = targetCropDim;
                cropCanvas.height = targetCropDim;
              }

              cropCtx.drawImage(v, sx, sy, cropSize, cropSize, 0, 0, targetCropDim, targetCropDim);
              const cropResult = await decodeFromCanvas(cropCanvas);
              if (cropResult) {
                triggerDetect(cropResult);
                isDecoding = false;
                if (!stopped) raf = requestAnimationFrame(scanLoop);
                return;
              }
            }

            // 3. Full Frame scan every 2 frames for peripheral QR detection
            if (fullCtx && frameCounter % 2 === 0) {
              const maxDim = 800;
              const scale = Math.min(1, maxDim / Math.max(vw, vh));
              const fw = Math.max(1, Math.floor(vw * scale));
              const fh = Math.max(1, Math.floor(vh * scale));

              if (fullCanvas.width !== fw || fullCanvas.height !== fh) {
                fullCanvas.width = fw;
                fullCanvas.height = fh;
              }

              fullCtx.drawImage(v, 0, 0, fw, fh);
              const fullResult = await decodeFromCanvas(fullCanvas);
              if (fullResult) {
                triggerDetect(fullResult);
                isDecoding = false;
                if (!stopped) raf = requestAnimationFrame(scanLoop);
                return;
              }
            }
          } catch {
            /* Frame did not contain recognizable QR code */
          } finally {
            isDecoding = false;
          }
        }

        if (!stopped) {
          raf = requestAnimationFrame(scanLoop);
        }
      };

      raf = requestAnimationFrame(scanLoop);
    }

    void start();

    return () => {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
      if (stream) {
        stream.getTracks().forEach((t) => {
          try {
            t.stop();
            t.enabled = false;
          } catch {}
        });
        stream = null;
      }
      if (trackRef.current) {
        try {
          trackRef.current.stop();
          trackRef.current.enabled = false;
        } catch {}
        trackRef.current = null;
      }
      if (videoRef.current) {
        try {
          videoRef.current.srcObject = null;
          videoRef.current.pause();
        } catch {}
      }
      setStatus("idle");
    };
  }, [active, facingMode, retryNonce]);

  // Torch / flashlight control
  useEffect(() => {
    const track = trackRef.current;
    if (!track || status !== "scanning") return;
    const caps = track.getCapabilities?.() as TorchCapabilities | undefined;
    if (caps?.torch) {
      track
        .applyConstraints({ advanced: [{ torch }] } as unknown as MediaTrackConstraints)
        .catch(() => {});
    }
  }, [torch, status]);

  // High-reliability static image file scan helper
  const scanImageFile = async (file: File | Blob | string): Promise<string | null> => {
    const res = await decodeQrFromImage(file);
    if (res) {
      playSuccessBeep();
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        try {
          navigator.vibrate([50, 30, 50]);
        } catch {
          /* ignore */
        }
      }
      onDetectRef.current(res);
    }
    return res;
  };

  return { videoRef, status, hasTorch, scanImageFile, retry };
}

