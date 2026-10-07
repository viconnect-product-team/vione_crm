/**
 * Tiện ích truy cập Camera & Microphone thực tế cho ViOne WebRTC Calls.
 * Ưu tiên 100% phần cứng Microphone & Webcam thật của thiết bị.
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
    title: "Cấp quyền Camera & Micro để đàm thoại trực tiếp",
    currentOrigin: origin,
    steps: [
      "Mở trình duyệt Google Chrome trên thiết bị.",
      "Gõ vào thanh địa chỉ: chrome://flags/#unsafely-treat-insecure-origin-as-secure",
      `Bật 'Enabled' và nhập địa chỉ hiện tại: ${origin}`,
      "Bấm nút 'Relaunch' ở góc dưới để khởi động lại Chrome.",
      "Tải lại trang và nhấn 'Cho phép' khi trình duyệt hỏi quyền truy cập Micro & Camera.",
    ],
  };
}

/**
 * Tạo canvas hiển thị hồ sơ đối tác sang trọng khi thiết bị không trang bị camera phần cứng
 */
export function createLuxuryAvatarStream(label: string = "Doanh nhân ViOne"): MediaStream {
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
    angle += 0.03;

    // Sang trọng ViOne Obsidian Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 640, 480);
    bgGrad.addColorStop(0, "#070B12");
    bgGrad.addColorStop(0.5, "#0E1522");
    bgGrad.addColorStop(1, "#04070D");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 640, 480);

    const centerX = 320;
    const centerY = 210;
    const pulse = Math.sin(angle) * 10;

    // Viền Vàng Đồng Champagne Gold
    ctx.save();
    ctx.strokeStyle = "rgba(223, 183, 108, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 80 + pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(246, 225, 195, 0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, 105 - pulse / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Huy hiệu trung tâm
    ctx.fillStyle = "#162032";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 65, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#D8B282";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Chữ cái đại diện
    ctx.fillStyle = "#F6E1C3";
    ctx.font = "bold 38px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const initial = (label.trim().charAt(0) || "V").toUpperCase();
    ctx.fillText(initial, centerX, centerY);

    // Tên đối tác
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 18px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(label, centerX, 315);

    // Trạng thái mã hóa
    ctx.fillStyle = "#D8B282";
    ctx.font = "12px sans-serif";
    ctx.fillText("VIONE ENCRYPTED DIRECT VOICE CALL", centerX, 342);

    animFrameId = requestAnimationFrame(render);
  };

  render();

  const stream = canvas.captureStream(25);
  (stream as any)._cleanupCanvas = () => {
    cancelAnimationFrame(animFrameId);
  };

  return stream;
}

/**
 * Synthetic subtle audio track khi thiết bị hoàn toàn không tìm thấy micro
 */
export function createMockAudioStream(): MediaStream {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return new MediaStream();
    const ctx = new AudioCtx();
    const dest = ctx.createMediaStreamDestination();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    gain.gain.setValueAtTime(0.00001, ctx.currentTime);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();

    const stream = dest.stream;
    (stream as any)._cleanupAudio = () => {
      try {
        osc.stop();
        ctx.close();
      } catch {}
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
 * Lấy Micro và Camera thật từ thiết bị người dùng.
 * Tự động tối ưu âm thanh (khử tiếng vang, lọc tạp âm) để đàm thoại rõ ràng 100%.
 */
export async function getSafeUserMedia(
  constraints: MediaStreamConstraints,
  userName?: string,
): Promise<SafeMediaResult> {
  // Cấu hình âm thanh chuẩn chất lượng cao cho đàm thoại doanh nhân
  const enhancedConstraints: MediaStreamConstraints = {
    audio: constraints.audio
      ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          ...(typeof constraints.audio === "object" ? constraints.audio : {}),
        }
      : false,
    video: constraints.video,
  };

  // 1. Thử gọi API chuẩn modern mediaDevices
  if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(enhancedConstraints);
      return { stream, isMock: false };
    } catch (err: any) {
      console.warn("[SafeUserMedia] Primary getUserMedia error:", err?.name, err?.message);

      // Nếu yêu cầu cả video lẫn audio bị lỗi (ví dụ không có webcam), thử lại chỉ với Microphone
      if (constraints.video && constraints.audio) {
        try {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            audio: enhancedConstraints.audio,
            video: false,
          });
          // Thêm avatar video stream làm hình nền nếu đối tác không có webcam
          const placeholderVideo = createLuxuryAvatarStream(userName || "Bạn");
          placeholderVideo.getVideoTracks().forEach((vt) => audioOnlyStream.addTrack(vt));
          return { stream: audioOnlyStream, isMock: false };
        } catch {}
      }

      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        return {
          stream: new MediaStream(),
          isMock: true,
          reason: "permission_denied",
        };
      }
    }
  }

  // 2. Thử legacy vendor APIs
  if (typeof navigator !== "undefined") {
    const legacy =
      (navigator as any).getUserMedia ||
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia ||
      (navigator as any).msGetUserMedia;

    if (typeof legacy === "function") {
      try {
        const stream = await new Promise<MediaStream>((resolve, reject) => {
          legacy.call(navigator, enhancedConstraints, resolve, reject);
        });
        return { stream, isMock: false };
      } catch {}
    }
  }

  // 3. Fallback an toàn nếu hoàn toàn không có quyền hoặc không có thiết bị
  const compositeStream = new MediaStream();
  if (constraints.video) {
    const videoStream = createLuxuryAvatarStream(userName || "Tài khoản của bạn");
    videoStream.getVideoTracks().forEach((track) => compositeStream.addTrack(track));
  }
  if (constraints.audio) {
    const audioStream = createMockAudioStream();
    audioStream.getAudioTracks().forEach((track) => compositeStream.addTrack(track));
  }

  return {
    stream: compositeStream,
    isMock: true,
    reason: isHttpInsecureContext() ? "insecure_http" : "permission_denied",
  };
}
