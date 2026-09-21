import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getVNTimeGreeting(): string {
  const utc = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
  const vnTime = new Date(utc + 3600000 * 7);
  const hour = vnTime.getHours();
  if (hour >= 5 && hour < 12) {
    return "Chào buổi sáng,";
  } else if (hour >= 12 && hour < 18) {
    return "Chào buổi chiều,";
  } else {
    return "Chào buổi tối,";
  }
}

export function safeRandomUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      /* fallback */
    }
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Global browser polyfill for non-secure HTTP origins (e.g. IP-based access)
if (typeof window !== "undefined") {
  try {
    const w = window as any;
    if (!w.crypto) {
      w.crypto = {};
    }
    if (typeof w.crypto.randomUUID !== "function") {
      w.crypto.randomUUID = function () {
        return safeRandomUUID() as `${string}-${string}-${string}-${string}-${string}`;
      };
    }
  } catch {
    /* ignore */
  }
}

