import { useState, useEffect } from "react";
import { Sparkles, Moon, Star } from "lucide-react";

export type EventThemeType = "mid-autumn" | "national-day" | "tet" | "none";

const EVENT_THEME_STORAGE_KEY = "vba_event_theme_disabled";
const EVENT_THEME_TYPE_KEY = "vba_event_theme_type";
const EVENT_THEME_ENABLED_KEY = "vba_event_theme_enabled";

export function isEventThemeEnabled(): boolean {
  if (typeof window === "undefined") return false;
  // Mặc định tạm thời tắt theme Trung thu theo chuẩn CEO 1983 Classic Navy & Gold
  // Chỉ bật khi người dùng chủ động kích hoạt từ Trang Cá Nhân
  const explicitEnabled = localStorage.getItem(EVENT_THEME_ENABLED_KEY) === "true";
  const explicitDisabled = localStorage.getItem(EVENT_THEME_STORAGE_KEY) === "true";
  return explicitEnabled && !explicitDisabled;
}

export function setEventThemeEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  if (enabled) {
    localStorage.setItem(EVENT_THEME_ENABLED_KEY, "true");
    localStorage.removeItem(EVENT_THEME_STORAGE_KEY);
  } else {
    localStorage.setItem(EVENT_THEME_STORAGE_KEY, "true");
    localStorage.removeItem(EVENT_THEME_ENABLED_KEY);
  }
  window.dispatchEvent(new CustomEvent("vba-event-theme-changed", { detail: { enabled } }));
}

export function getActiveEventThemeType(): EventThemeType {
  if (typeof window === "undefined") return "mid-autumn";
  return (localStorage.getItem(EVENT_THEME_TYPE_KEY) as EventThemeType) || "mid-autumn";
}

export function setActiveEventThemeType(type: EventThemeType) {
  if (typeof window === "undefined") return;
  localStorage.setItem(EVENT_THEME_TYPE_KEY, type);
  window.dispatchEvent(new CustomEvent("vba-event-theme-changed", { detail: { type } }));
}

/**
 * Seasonal Event Header Decorator
 * Renders charming festival elements (e.g. Mid-Autumn Star Lanterns, Golden Moon, Twinkles)
 * at the top of the association mobile header.
 */
export function SeasonalEventHeader() {
  const [enabled, setEnabled] = useState(isEventThemeEnabled());
  const [themeType, setThemeType] = useState<EventThemeType>(getActiveEventThemeType());

  useEffect(() => {
    const handleThemeChange = () => {
      setEnabled(isEventThemeEnabled());
      setThemeType(getActiveEventThemeType());
    };
    window.addEventListener("vba-event-theme-changed", handleThemeChange);
    return () => window.removeEventListener("vba-event-theme-changed", handleThemeChange);
  }, []);

  if (!enabled || themeType === "none") return null;

  if (themeType === "mid-autumn") {
    return (
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-24 overflow-hidden select-none"
        aria-hidden="true"
      >
        {/* Subtle moon glow in upper right */}
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-amber-400/20 blur-2xl animate-pulse" />

        {/* Miniature crescent moon & stars */}
        <div className="absolute right-12 top-2 flex items-center gap-1 opacity-70">
          <Moon className="h-4 w-4 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] fill-amber-200/40" />
          <Star className="h-2 w-2 text-yellow-200 animate-ping opacity-75" />
        </div>

        {/* Left Hanging Star Lantern (Đèn lồng ông sao truyền thống) */}
        <div className="absolute left-2.5 top-0 flex flex-col items-center">
          {/* Lantern Cord */}
          <div className="h-4 w-[1px] bg-gradient-to-b from-amber-400/80 to-red-500/80" />

          {/* Star Lantern Graphic */}
          <div
            className="relative flex items-center justify-center animate-bounce"
            style={{ animationDuration: "3.5s" }}
          >
            {/* Outer Glow */}
            <div className="absolute h-9 w-9 rounded-full bg-red-500/25 blur-sm" />

            {/* Star Body with Red & Gold Frame */}
            <svg
              width="34"
              height="34"
              viewBox="0 0 100 100"
              className="drop-shadow-[0_2px_8px_rgba(239,68,68,0.7)]"
            >
              {/* Outer bamboo ring */}
              <circle cx="50" cy="50" r="42" fill="none" stroke="#F59E0B" strokeWidth="4" />
              {/* 5-pointed star */}
              <polygon
                points="50,5 64,36 98,36 71,57 81,91 50,70 19,91 29,57 2,36 36,36"
                fill="url(#lanternRedGold)"
                stroke="#FDE047"
                strokeWidth="3"
              />
              {/* Star Center Circle */}
              <circle cx="50" cy="50" r="14" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2.5" />
              <text x="50" y="55" textAnchor="middle" fontSize="12" fontWeight="900" fill="#DC2626">
                ★
              </text>
              <defs>
                <linearGradient id="lanternRedGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="50%" stopColor="#F97316" />
                  <stop offset="100%" stopColor="#EAB308" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {/* Lantern Tassels */}
          <div className="flex gap-1 -mt-0.5">
            <div className="h-3 w-[1.5px] bg-amber-400/90 rounded-full" />
            <div className="h-4 w-[1.5px] bg-red-500/90 rounded-full" />
            <div className="h-3 w-[1.5px] bg-amber-400/90 rounded-full" />
          </div>
        </div>

        {/* Right Hanging Star Lantern */}
        <div className="absolute right-2 top-0 flex flex-col items-center">
          <div className="h-5 w-[1px] bg-gradient-to-b from-amber-400/80 to-red-500/80" />
          <div
            className="relative flex items-center justify-center animate-bounce"
            style={{ animationDuration: "4s", animationDelay: "0.5s" }}
          >
            <div className="absolute h-8 w-8 rounded-full bg-amber-500/25 blur-sm" />
            <svg
              width="28"
              height="28"
              viewBox="0 0 100 100"
              className="drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]"
            >
              <circle cx="50" cy="50" r="42" fill="none" stroke="#EF4444" strokeWidth="4" />
              <polygon
                points="50,5 64,36 98,36 71,57 81,91 50,70 19,91 29,57 2,36 36,36"
                fill="url(#lanternGoldRed)"
                stroke="#FDE047"
                strokeWidth="3"
              />
              <circle cx="50" cy="50" r="14" fill="#FEF3C7" stroke="#D97706" strokeWidth="2.5" />
              <text x="50" y="55" textAnchor="middle" fontSize="12" fontWeight="900" fill="#B45309">
                ★
              </text>
              <defs>
                <linearGradient id="lanternGoldRed" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="70%" stopColor="#EF4444" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex gap-1 -mt-0.5">
            <div className="h-3.5 w-[1.5px] bg-red-500/90 rounded-full" />
            <div className="h-4.5 w-[1.5px] bg-amber-400/90 rounded-full" />
            <div className="h-3.5 w-[1.5px] bg-red-500/90 rounded-full" />
          </div>
        </div>

        {/* Delicate floating sparkles */}
        <div className="absolute left-1/3 top-2 flex items-center gap-1 opacity-60">
          <Sparkles
            className="h-3 w-3 text-amber-300 animate-spin"
            style={{ animationDuration: "12s" }}
          />
        </div>
      </div>
    );
  }

  return null;
}
