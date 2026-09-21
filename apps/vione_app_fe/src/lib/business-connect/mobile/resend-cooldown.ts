// Giới hạn tần suất gửi lại email (quên mật khẩu / đặt lại mật khẩu).
// Trạng thái được lưu cục bộ theo email nên vẫn giữ nguyên khi người dùng
// tải lại trang hoặc mở lại PWA — tránh gửi trùng nhiều lần.

import { useCallback, useEffect, useMemo, useState } from "react";

/** Khoảng chờ tối thiểu giữa 2 lần gửi (giây). */
export const RESEND_COOLDOWN_SECONDS = 60;
/** Số lần gửi tối đa trong một cửa sổ thời gian. */
export const RESEND_MAX_ATTEMPTS = 3;
/** Độ dài cửa sổ đếm số lần gửi (giây). */
export const RESEND_WINDOW_SECONDS = 15 * 60;
/** Thời gian khoá khi vượt quá số lần cho phép (giây). */
export const RESEND_LOCK_SECONDS = 15 * 60;

const PREFIX = "vba.resend.";

type Entry = { attempts: number; windowStart: number; lastSent: number };

function keyOf(scope: string, target: string): string {
  return `${PREFIX}${scope}:${target.trim().toLowerCase()}`;
}

function readEntry(key: string): Entry | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Entry>;
    if (
      typeof parsed?.attempts !== "number" ||
      typeof parsed?.windowStart !== "number" ||
      typeof parsed?.lastSent !== "number"
    ) {
      return null;
    }
    return {
      attempts: parsed.attempts,
      windowStart: parsed.windowStart,
      lastSent: parsed.lastSent,
    };
  } catch {
    return null;
  }
}

function writeEntry(key: string, entry: Entry): void {
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    /* bộ nhớ cục bộ không khả dụng → chỉ mất tính bền vững, không chặn luồng */
  }
}

export type ResendState = {
  /** Số giây còn lại trước khi được gửi tiếp (0 = gửi được ngay). */
  seconds: number;
  /** Đang bị khoá do vượt quá số lần cho phép trong cửa sổ. */
  locked: boolean;
  /** Số lần đã gửi trong cửa sổ hiện tại. */
  attempts: number;
};

/** Tính trạng thái hiện tại từ dữ liệu đã lưu. */
export function readResendState(scope: string, target: string, now = Date.now()): ResendState {
  if (!target.trim()) return { seconds: 0, locked: false, attempts: 0 };
  const entry = readEntry(keyOf(scope, target));
  if (!entry) return { seconds: 0, locked: false, attempts: 0 };

  const windowExpired = now - entry.windowStart >= RESEND_WINDOW_SECONDS * 1000;
  const attempts = windowExpired ? 0 : entry.attempts;

  if (!windowExpired && attempts >= RESEND_MAX_ATTEMPTS) {
    const remain = Math.ceil((entry.lastSent + RESEND_LOCK_SECONDS * 1000 - now) / 1000);
    if (remain > 0) return { seconds: remain, locked: true, attempts };
    return { seconds: 0, locked: false, attempts: 0 };
  }

  const remain = Math.ceil((entry.lastSent + RESEND_COOLDOWN_SECONDS * 1000 - now) / 1000);
  return { seconds: remain > 0 ? remain : 0, locked: false, attempts };
}

/** Ghi nhận một lần gửi thành công. */
export function markResendSent(scope: string, target: string, now = Date.now()): ResendState {
  if (!target.trim()) return { seconds: 0, locked: false, attempts: 0 };
  const key = keyOf(scope, target);
  const prev = readEntry(key);
  const windowExpired = !prev || now - prev.windowStart >= RESEND_WINDOW_SECONDS * 1000;
  const entry: Entry = {
    attempts: windowExpired ? 1 : prev.attempts + 1,
    windowStart: windowExpired ? now : prev.windowStart,
    lastSent: now,
  };
  writeEntry(key, entry);
  return readResendState(scope, target, now);
}

/** Xoá giới hạn (ví dụ sau khi đặt lại mật khẩu thành công). */
export function clearResendState(scope: string, target: string): void {
  try {
    localStorage.removeItem(keyOf(scope, target));
  } catch {
    /* ignore */
  }
}

/**
 * Hook đếm ngược cho nút "Gửi lại".
 * Trả về số giây còn lại, cờ khoá và hàm ghi nhận lần gửi mới.
 */
export function useResendCooldown(scope: string, target: string) {
  const [state, setState] = useState<ResendState>({ seconds: 0, locked: false, attempts: 0 });

  // Đọc lại trạng thái mỗi khi email thay đổi (chỉ chạy phía trình duyệt).
  useEffect(() => {
    setState(readResendState(scope, target));
  }, [scope, target]);

  // Đếm ngược mỗi giây khi đang trong thời gian chờ.
  useEffect(() => {
    if (state.seconds <= 0) return;
    const id = window.setInterval(() => {
      setState(readResendState(scope, target));
    }, 1000);
    return () => window.clearInterval(id);
  }, [scope, target, state.seconds]);

  const markSent = useCallback(() => {
    setState(markResendSent(scope, target));
  }, [scope, target]);

  const clear = useCallback(() => {
    clearResendState(scope, target);
    setState({ seconds: 0, locked: false, attempts: 0 });
  }, [scope, target]);

  return useMemo(
    () => ({
      seconds: state.seconds,
      locked: state.locked,
      attempts: state.attempts,
      remainingAttempts: Math.max(0, RESEND_MAX_ATTEMPTS - state.attempts),
      canSend: state.seconds <= 0,
      markSent,
      clear,
    }),
    [state, markSent, clear],
  );
}
