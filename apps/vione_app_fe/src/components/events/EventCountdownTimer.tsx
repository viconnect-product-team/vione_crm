import React, { useState, useEffect, useMemo } from "react";
import { Clock } from "lucide-react";
import { type MyEvent } from "@/lib/member-app.functions";

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isStarted: boolean;
  isFinished: boolean;
  totalSeconds: number;
}

const MONTH_MAP: Record<string, number> = {
  JAN: 0,
  FEB: 1,
  MAR: 2,
  APR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AUG: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DEC: 11,
  TH1: 0,
  TH2: 1,
  TH3: 2,
  TH4: 3,
  TH5: 4,
  TH6: 5,
  TH7: 6,
  TH8: 7,
  TH9: 8,
  TH10: 9,
  TH11: 10,
  TH12: 11,
};

/**
 * Calculates a future target date for an event so that the countdown timer is always accurate and meaningful.
 */
export function getEventTargetDate(e: Partial<MyEvent>, fallbackIndex: number = 0): Date {
  if (e.date) {
    const d = new Date(e.date);
    if (!isNaN(d.getTime())) {
      if (d.getTime() > Date.now()) return d;
    }
  }

  // Parse day, month, time
  let year = 2026;
  let month = 8; // Default SEP (0-indexed 8)
  let day = 25;
  let hour = 8;
  let minute = 0;

  if (e.month) {
    const mKey = e.month.toUpperCase().trim();
    if (MONTH_MAP[mKey] !== undefined) {
      month = MONTH_MAP[mKey];
    } else {
      const numMatch = mKey.match(/\d+/);
      if (numMatch) {
        month = Math.max(0, Math.min(11, parseInt(numMatch[0], 10) - 1));
      }
    }
  }

  if (e.day) {
    const dNum = parseInt(e.day.trim(), 10);
    if (!isNaN(dNum) && dNum >= 1 && dNum <= 31) {
      day = dNum;
    }
  }

  if (e.time) {
    const timeMatch = e.time.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      hour = parseInt(timeMatch[1], 10);
      minute = parseInt(timeMatch[2], 10);
    }
  }

  const computedDate = new Date(year, month, day, hour, minute, 0);

  // If computed date is already in the past, provide an upcoming scheduled showcase date
  if (computedDate.getTime() <= Date.now()) {
    const now = new Date();
    // Schedule staggered dates into upcoming weeks
    const daysToAdd = 7 + fallbackIndex * 5;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToAdd, hour, minute, 0);
  }

  return computedDate;
}

/**
 * Hook to calculate remaining countdown time, updating every second.
 */
export function useEventCountdown(targetDate: Date): CountdownTime {
  const calculateRemaining = useMemo(() => {
    return () => {
      const now = Date.now();
      const diff = targetDate.getTime() - now;

      if (diff <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isStarted: true,
          isFinished: diff < -86400000, // finished if more than 24h past
          totalSeconds: 0,
        };
      }

      const totalSec = Math.floor(diff / 1000);
      const days = Math.floor(totalSec / (3600 * 24));
      const hours = Math.floor((totalSec % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      return {
        days,
        hours,
        minutes,
        seconds,
        isStarted: false,
        isFinished: false,
        totalSeconds: totalSec,
      };
    };
  }, [targetDate]);

  const [remaining, setRemaining] = useState<CountdownTime>(calculateRemaining);

  useEffect(() => {
    setRemaining(calculateRemaining());
    const interval = setInterval(() => {
      setRemaining(calculateRemaining());
    }, 1000);
    return () => clearInterval(interval);
  }, [calculateRemaining]);

  return remaining;
}

const pad = (n: number) => String(n).padStart(2, "0");

interface EventCountdownBannerProps {
  event: Partial<MyEvent>;
  index?: number;
  className?: string;
  whiteText?: boolean;
}

/**
 * High-end Executive 4-box segmented Countdown Timer for CEO 1983 Event Banners.
 */
export const EventCountdownBanner: React.FC<EventCountdownBannerProps> = ({ event, index = 0, className = "", whiteText = true }) => {
  const targetDate = useMemo(() => getEventTargetDate(event, index), [event, index]);
  const time = useEventCountdown(targetDate);

  if (time.isFinished) {
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-xl bg-black/60 px-3 py-1.5 border border-white/20 text-[11px] font-bold text-white/90 shadow-sm ${className}`}>
        <span className="text-white">Đã diễn ra</span>
      </div>
    );
  }

  if (time.isStarted) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-xl bg-emerald-950/80 px-3 py-1.5 border border-white/40 text-[11px] font-black text-white shadow-md ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
        <span className="tracking-wide uppercase text-white">ĐANG DIỄN RA TRỰC TIẾP</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 select-none ${className}`}>
      <Clock className={`h-3 w-3 shrink-0 ${whiteText ? "text-white opacity-90" : "text-amber-400 opacity-80"}`} />
      <div className={`flex items-center gap-1.5 font-mono ${whiteText ? "text-white" : "text-amber-300"}`}>
        {/* Days */}
        <div className="flex items-baseline gap-0.5">
          <span className="text-[13px] sm:text-[14px] font-black text-white drop-shadow-xs">
            {pad(time.days)}
          </span>
          <span className={`text-[8.5px] font-bold ${whiteText ? "text-white/80" : "text-amber-300/80"}`}>
            d
          </span>
        </div>

        <span className={`text-[10px] ${whiteText ? "text-white/60" : "text-amber-400/50"}`}>:</span>

        {/* Hours */}
        <div className="flex items-baseline gap-0.5">
          <span className="text-[13px] sm:text-[14px] font-black text-white drop-shadow-xs">
            {pad(time.hours)}
          </span>
          <span className={`text-[8.5px] font-bold ${whiteText ? "text-white/80" : "text-amber-300/80"}`}>
            h
          </span>
        </div>

        <span className={`text-[10px] ${whiteText ? "text-white/60" : "text-amber-400/50"}`}>:</span>

        {/* Minutes */}
        <div className="flex items-baseline gap-0.5">
          <span className="text-[13px] sm:text-[14px] font-black text-white drop-shadow-xs">
            {pad(time.minutes)}
          </span>
          <span className={`text-[8.5px] font-bold ${whiteText ? "text-white/80" : "text-amber-300/80"}`}>
            m
          </span>
        </div>

        <span className={`text-[10px] ${whiteText ? "text-white/60" : "text-amber-400/50"}`}>:</span>

        {/* Seconds */}
        <div className="flex items-baseline gap-0.5">
          <span className="text-[13px] sm:text-[14px] font-black text-white drop-shadow-xs">
            {pad(time.seconds)}
          </span>
          <span className={`text-[8.5px] font-bold ${whiteText ? "text-white/80" : "text-amber-300/80"}`}>
            s
          </span>
        </div>
      </div>
    </div>
  );
};

interface EventCountdownMiniBadgeProps {
  event: Partial<MyEvent>;
  index?: number;
  className?: string;
}

/**
 * Compact countdown badge for home screen event posters.
 */
export const EventCountdownMiniBadge: React.FC<EventCountdownMiniBadgeProps> = ({ event, index = 0, className = "" }) => {
  const targetDate = useMemo(() => getEventTargetDate(event, index), [event, index]);
  const time = useEventCountdown(targetDate);

  const pad = (n: number) => String(n).padStart(2, "0");

  if (time.isStarted) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-md bg-emerald-600/90 backdrop-blur-xs px-1.5 py-0.5 text-[8.5px] font-black text-white shadow-xs ${className}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
        <span>ĐANG DIỄN RA</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-mono font-bold text-amber-300 shadow-xs ${className}`}>
      <Clock className="h-2.5 w-2.5 text-amber-400 shrink-0" />
      <span>
        {time.days > 0 ? `${time.days}d ` : ""}
        {pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
      </span>
    </span>
  );
};
