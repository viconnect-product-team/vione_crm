/**
 * System Notification & Device Media Permission Manager
 * Enables external background push notifications, sound, and phone lock screen alerts like Messenger / Zalo.
 */

export type NotificationPermissionState = "default" | "granted" | "denied" | "unsupported";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Play a short subtle chime for notifications
 */
export function playNotificationChime(kind: "call" | "message" | "alert" = "message") {
  try {
    if (typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (kind === "call") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    /* ignore audio autoplay restrictions */
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return "unsupported";
  try {
    const result = await Notification.requestPermission();
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("vione_notification_permission_changed", { detail: { state: result } })
      );
    }
    if (result === "granted") {
      playNotificationChime("alert");
      void sendExternalNotification("🔔 Thông báo hệ thống ViOne đã kích hoạt", {
        body: "Bạn sẽ nhận được cảnh báo cuộc gọi đến, tin nhắn và bình luận trực tiếp trên màn hình điện thoại.",
        tag: "vione-permission-welcome",
        url: "/connect-app",
      });
    }
    return result;
  } catch {
    return "denied";
  }
}

export async function requestMicrophonePermission(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop stream immediately after permission check
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}

export interface ExternalNotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  vibrate?: number[];
  requireInteraction?: boolean;
  silent?: boolean;
  data?: any;
}

/**
 * Trigger an external system notification (shown on phone/OS lock screen & desktop notifications)
 */
export async function sendExternalNotification(
  title: string,
  options?: ExternalNotificationOptions,
) {
  if (getNotificationPermission() !== "granted") return;

  const vibratePattern = options?.vibrate || [200, 100, 200];

  // Haptic feedback on phone if browser/device supports it
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(vibratePattern);
    } catch {}
  }

  // Play audio chime
  if (!options?.silent) {
    playNotificationChime(options?.requireInteraction ? "call" : "message");
  }

  const notifOptions: NotificationOptions & { vibrate?: number[] } = {
    body: options?.body,
    icon: options?.icon || "/app-icon.png",
    badge: options?.badge || "/app-icon.png",
    tag: options?.tag || `vione-${Date.now()}`,
    vibrate: vibratePattern,
    requireInteraction: options?.requireInteraction ?? false,
    silent: options?.silent ?? false,
    data: {
      url: options?.url || (typeof window !== "undefined" ? window.location.href : "/connect-app"),
      ...options?.data,
    },
  };

  // 1. Try Service Worker showNotification first (Standard for Android/iOS lock screen)
  try {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && "showNotification" in reg) {
        await reg.showNotification(title, notifOptions);
        return;
      }
    }
  } catch (swErr) {
    console.debug("[sendExternalNotification] ServiceWorker notification fallback:", swErr);
  }

  // 2. Fallback to standard new Notification
  try {
    const notif = new Notification(title, notifOptions);
    if (options?.url) {
      notif.onclick = () => {
        if (typeof window !== "undefined") {
          window.focus();
          window.location.href = options.url!;
        }
        notif.close();
      };
    }
  } catch (err) {
    console.warn("[sendExternalNotification] Notification constructor failed:", err);
  }
}

/**
 * Send incoming call phone alert
 */
export function sendCallNotification(callerName: string, callType: "audio" | "video", callId?: string) {
  const isVideo = callType === "video";
  return sendExternalNotification(
    isVideo ? `📹 Cuộc gọi Video từ ${callerName || "Đối tác ViOne"}` : `📞 Cuộc gọi thoại từ ${callerName || "Đối tác ViOne"}`,
    {
      body: "Chạm vào để nghe máy ngay trên ViOne Connect",
      icon: "/app-icon.png",
      tag: `call-${callId || Date.now()}`,
      vibrate: [400, 200, 400, 200, 400, 200, 400],
      requireInteraction: true,
      url: "/connect-app/inbox",
    },
  );
}

/**
 * Send direct message alert
 */
export function sendMessageNotification(senderName: string, text: string, threadId: string, avatarUrl?: string) {
  return sendExternalNotification(`💬 ${senderName || "Tin nhắn mới"}`, {
    body: text || "Đã gửi cho bạn một tin nhắn",
    icon: avatarUrl || "/app-icon.png",
    tag: `dm-${threadId}`,
    url: `/connect-app/inbox/${threadId}`,
    vibrate: [250, 100, 250],
  });
}

/**
 * Send comment alert
 */
export function sendCommentNotification(authorName: string, commentText: string, momentId?: string) {
  return sendExternalNotification(`💬 Bình luận mới từ ${authorName || "Hội viên ViOne"}`, {
    body: commentText || "Đã bình luận vào bài viết của bạn",
    icon: "/app-icon.png",
    tag: `comment-${momentId || Date.now()}`,
    url: momentId ? `/connect-app/moment/${momentId}` : "/connect-app",
    vibrate: [200, 100, 200],
  });
}

/**
 * Send connection request alert
 */
export function sendConnectionNotification(senderName: string, company?: string) {
  return sendExternalNotification(`🤝 Lời mời kết nối từ ${senderName || "Hội viên ViOne"}`, {
    body: company ? `${company} gửi lời mời kết nối kinh doanh với bạn.` : "Gửi lời mời kết nối kinh doanh với bạn.",
    icon: "/app-icon.png",
    tag: "connection-request",
    url: "/connect-app/network?tab=requests",
    vibrate: [300, 100, 300],
  });
}
