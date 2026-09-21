import { useState, useEffect } from "react";
import { Bell, BellRing, X, CheckCircle2 } from "lucide-react";
import {
  getNotificationPermission,
  requestNotificationPermission,
  requestMicrophonePermission,
  isNotificationSupported,
} from "@/lib/notification-permissions";

export function NotificationPermissionBanner() {
  const [permission, setPermission] = useState<string>("granted");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isNotificationSupported()) {
      setPermission("unsupported");
      return;
    }
    const current = getNotificationPermission();
    setPermission(current);
  }, []);

  if (permission === "granted" || permission === "unsupported" || dismissed) {
    return null;
  }

  const handleRequest = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    // Also proactively request microphone permission for instant voice & call readiness
    void requestMicrophonePermission();
  };

  return (
    <div className="mx-3 my-2 flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-600/15 p-3 text-[12px] text-slate-900 dark:text-white backdrop-blur-md shadow-md animate-fade-in">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-500 dark:text-[#F7D896]">
          <BellRing className="h-4 w-4 animate-bounce" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 dark:text-[#F7D896] leading-tight truncate">
            Bật thông báo tin nhắn & cuộc gọi
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight truncate">
            Nhận chuông cuộc gọi và tin nhắn ngay cả khi khóa màn hình
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleRequest}
          className="rounded-xl bg-gradient-to-r from-[#F7D896] to-[#C49338] px-3 py-1.5 text-[11px] font-extrabold text-slate-950 shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          Bật ngay
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Đóng"
          className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
