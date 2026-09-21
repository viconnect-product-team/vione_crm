/**
 * System Notification & Device Media Permission Manager
 * Enables external background push notifications, sound, and mic access like Messenger / Zalo.
 */

export type NotificationPermissionState = "default" | "granted" | "denied" | "unsupported";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return "unsupported";
  try {
    const result = await Notification.requestPermission();
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

/**
 * Trigger an external system notification (shown on phone/OS lock screen & desktop notifications)
 */
export function sendExternalNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    url?: string;
    vibrate?: number[];
  },
) {
  if (getNotificationPermission() !== "granted") return;

  try {
    const notif = new Notification(title, {
      body: options?.body,
      icon: options?.icon || "/app-icon.png",
      tag: options?.tag || "vione-dm",
      vibrate: options?.vibrate || [200, 100, 200],
    } as NotificationOptions);

    if (options?.url) {
      notif.onclick = () => {
        window.focus();
        window.location.href = options.url!;
        notif.close();
      };
    }
  } catch (err) {
    console.warn("[sendExternalNotification] failed", err);
  }
}
