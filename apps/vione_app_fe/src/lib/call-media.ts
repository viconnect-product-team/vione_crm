/**
 * Utility for safe Camera & Microphone access across HTTPS and non-HTTPS (LAN IP) environments.
 * Modern browsers block navigator.mediaDevices.getUserMedia on non-secure contexts (HTTP).
 * This module provides:
 * 1. Native getUserMedia with legacy polyfills
 * 2. Virtual Mock MediaStream (Canvas HUD + Web Audio Stream) fallback so calls and recordings never crash
 * 3. Insecure context detection and Chrome flags guidance
 */

export function isHttpInsecureContext(): boolean {
  if (typeof window === "undefined") return false;
  if (window.isSecureContext) return false;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return false;
  return window.location.protocol !== "https:";
}

export function getInsecureContextHelp(): {
  title: string;
  steps: string[];
  currentOrigin: string;
} {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://<IP>:3000";
  return {
    title: "Mở quyền Camera & Micro khi truy cập qua IP nội bộ (HTTP)",
    currentOrigin: origin,
    steps: [
      "Mở trình duyệt Google Chrome trên điện thoại hoặc máy tính.",
      "Gõ vào thanh địa chỉ: chrome://flags/#unsafely-treat-insecure-origin-as-secure",
      `Bật mục này thành 'Enabled', sau đó dán địa chỉ IP vào ô trống: ${origin}`,
      "Bấm nút 'Relaunch' ở góc dưới màn hình để khởi động lại Chrome.",
      "Tải lại trang ViOne và cho phép quyền truy cập Camera & Micro.",
    ],
  };
}

/**
 * Creates an animated canvas video stream simulating a luxury video call HUD.
 */
export function createMockVideoStream(label: string = "Đối tác ViOne"): MediaStream {
  if (typeof document === "undefined") {
    return new MediaStream();
  }

  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d");

  let animFrameId: number;
  let angle = 0;

  const render = () => {
    if (!ctx) return;
    angle += 0.04;

    // Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, 640, 480);
    bgGrad.addColorStop(0, "#0a0e1a");
    bgGrad.addColorStop(0.5, "#141c2e");
    bgGrad.addColorStop(1, "#070a12");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 640, 480);

    // Animated Ambient Glow Rings
    const centerX = 320;
    const centerY = 220;
    const pulse = Math.sin(angle) * 15;

    ctx.save();
    ctx.strokeStyle = "rgba(216, 178, 130, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 90 + pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(246, 225, 195, 0.2)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, 120 - pulse / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Center VIP Avatar Badge
    ctx.fillStyle = "#1E293B";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#D8B282";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Initials
    ctx.fillStyle = "#F6E1C3";
    ctx.font = "bold 36px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const initial = (label.trim().charAt(0) || "V").toUpperCase();
    ctx.fillText(initial, centerX, centerY);

    // Label Text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 18px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(label, centerX, 320);

    // Subtitle & Status
    ctx.fillStyle = "#D8B282";
    ctx.font = "12px monospace";
    ctx.fillText("VIONE VIRTUAL CAMERA • SIMULATED FEED", centerX, 345);

    // Audio Wave Simulation Bar at Bottom
    ctx.fillStyle = "rgba(216, 178, 130, 0.7)";
    for (let i = 0; i < 24; i++) {
      const h = Math.abs(Math.sin(angle * 2 + i * 0.4)) * 24 + 4;
      ctx.fillRect(180 + i * 12, 420 - h / 2, 6, h);
    }

    animFrameId = requestAnimationFrame(render);
  };

  render();

  const stream = canvas.captureStream(25);
  // Store canceler on stream for cleanup
  (stream as any)._cleanupCanvas = () => {
    cancelAnimationFrame(animFrameId);
  };

  return stream;
}

/**
 * Creates a synthetic silent or ambient audio track via Web Audio API.
 */
export function createMockAudioStream(): MediaStream {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return new MediaStream();
    const ctx = new AudioCtx();
    const dest = ctx.createMediaStreamDestination();

    // Generate gentle subtle oscillator so WebRTC treats track as active
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime); // near silence
    osc.connect(gain);
    gain.connect(dest);
    osc.start();

    const stream = dest.stream;
    (stream as any)._cleanupAudio = () => {
      try {
        osc.stop();
        ctx.close();
      } catch {
        /* ignore */
      }
    };
    return stream;
  } catch {
    return new MediaStream();
  }
}

export interface SafeMediaResult {
  stream: MediaStream;
  isMock: boolean;
  reason?: string;
}

/**
 * Safe getUserMedia that never throws: falls back to legacy or virtual mock stream.
 */
export async function getSafeUserMedia(
  constraints: MediaStreamConstraints,
  userName?: string,
): Promise<SafeMediaResult> {
  // 1. Try standard modern mediaDevices if secure context or available
  if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return { stream, isMock: false };
    } catch (err: any) {
      console.warn("[SafeUserMedia] Native getUserMedia failed:", err?.message || err);
      // Fall through to fallback
    }
  }

  // 2. Try legacy vendor APIs
  if (typeof navigator !== "undefined") {
    const legacy =
      (navigator as any).getUserMedia ||
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia ||
      (navigator as any).msGetUserMedia;

    if (typeof legacy === "function") {
      try {
        const stream = await new Promise<MediaStream>((resolve, reject) => {
          legacy.call(navigator, constraints, resolve, reject);
        });
        return { stream, isMock: false };
      } catch (err: any) {
        console.warn("[SafeUserMedia] Legacy getUserMedia failed:", err?.message || err);
      }
    }
  }

  // 3. Fallback: Virtual Mock MediaStream
  console.info("[SafeUserMedia] Using virtual mock stream fallback (HTTP or device not found).");
  const compositeStream = new MediaStream();

  if (constraints.video) {
    const videoStream = createMockVideoStream(userName || "Tài khoản của bạn");
    videoStream.getVideoTracks().forEach((track) => compositeStream.addTrack(track));
  }

  if (constraints.audio) {
    const audioStream = createMockAudioStream();
    audioStream.getAudioTracks().forEach((track) => compositeStream.addTrack(track));
  }

  return {
    stream: compositeStream,
    isMock: true,
    reason: isHttpInsecureContext() ? "insecure_http" : "permission_denied_or_missing_hardware",
  };
}
