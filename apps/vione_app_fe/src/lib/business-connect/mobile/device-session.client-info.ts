// Phiên & thiết bị — nhận dạng thiết bị phía trình duyệt.
// Chỉ dùng dữ liệu công khai của trình duyệt: không thu thập PII, không vân tay.

import type { DeviceDescriptor } from "./device-session.types";
import { safeRandomUUID } from "@/lib/utils";

const DEVICE_KEY = "bc.device.key";

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function randomKey(): string {
  return safeRandomUUID();
}

/** Khoá thiết bị bền trong localStorage (mất khi người dùng xoá dữ liệu trình duyệt). */
export function getDeviceKey(): string | null {
  if (!hasWindow()) return null;
  try {
    const existing = window.localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const created = randomKey();
    window.localStorage.setItem(DEVICE_KEY, created);
    return created;
  } catch {
    return null;
  }
}

function detectBrowser(ua: string): string | null {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\//i.test(ua) || /opera/i.test(ua)) return "Opera";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  return null;
}

function detectPlatform(ua: string): string | null {
  if (/iphone/i.test(ua)) return "iPhone";
  if (/ipad/i.test(ua)) return "iPad";
  if (/android/i.test(ua)) return "Android";
  if (/mac os x/i.test(ua)) return "macOS";
  if (/windows/i.test(ua)) return "Windows";
  if (/linux/i.test(ua)) return "Linux";
  return null;
}

/** Mô tả thiết bị hiện tại để hiển thị trong danh sách phiên. */
export function describeCurrentDevice(): DeviceDescriptor | null {
  const deviceKey = getDeviceKey();
  if (!deviceKey || !hasWindow()) return null;
  const ua = window.navigator.userAgent ?? "";
  const platform = detectPlatform(ua);
  const browser = detectBrowser(ua);
  let isStandalone = false;
  try {
    isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  } catch {
    isStandalone = false;
  }
  const label = [platform, browser].filter(Boolean).join(" · ") || "Thiết bị";
  return { deviceKey, label, platform, browser, isStandalone };
}
