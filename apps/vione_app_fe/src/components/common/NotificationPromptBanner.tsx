import React, { useEffect, useState } from "react";
import { BellRing, X, Sparkles, Check } from "lucide-react";
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendExternalNotification,
  type NotificationPermissionState,
} from "@/lib/notification-permissions";
import { toast } from "sonner";

export function NotificationPromptBanner() {
  const [permission, setPermission] = useState<NotificationPermissionState>("unsupported");
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const current = getNotificationPermission();
    setPermission(current);

    const isDismissed = sessionStorage.getItem("vione_notif_prompt_dismissed") === "true";
    if (current === "default" && !isDismissed) {
      // Delay slightly for smooth initial rendering
      const timer = setTimeout(() => {
        setDismissed(false);
      }, 2500);
      return () => clearTimeout(timer);
    }

    const handlePermChange = (e: any) => {
      const next = e?.detail?.state || getNotificationPermission();
      setPermission(next);
      if (next === "granted") {
        setDismissed(true);
      }
    };

    window.addEventListener("vione_notification_permission_changed", handlePermChange);
    return () => {
      window.removeEventListener("vione_notification_permission_changed", handlePermChange);
    };
  }, []);

  if (dismissed || permission !== "default") {
    return null;
  }

  const handleGrant = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    setDismissed(true);
    sessionStorage.setItem("vione_notif_prompt_dismissed", "true");

    if (res === "granted") {
      toast.success("Đã bật thông báo hệ thống thành công!");
      sendExternalNotification("🔔 Thông báo hệ thống ViOne đã kích hoạt", {
        body: "Bạn sẽ nhận được cảnh báo cuộc gọi đến, tin nhắn và bình luận trực tiếp trên màn hình điện thoại.",
        url: "/connect-app",
      });
    } else if (res === "denied") {
      toast.error("Bạn đã từ chối nhận thông báo. Bạn có thể bật lại trong phần Cài đặt trình duyệt.");
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("vione_notif_prompt_dismissed", "true");
  };

  return (
    <aside
      aria-label="Cấp quyền thông báo hệ thống"
      className="fixed top-3 inset-x-3 z-50 mx-auto max-w-[440px] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div className="relative overflow-hidden rounded-2xl border border-amber-400/40 bg-white/95 dark:bg-[#0C111C]/95 backdrop-blur-xl p-3.5 shadow-2xl text-slate-900 dark:text-white ring-1 ring-black/5">
        {/* Glow ambient background */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-amber-400/20 blur-2xl" />

        <div className="flex items-start gap-3 relative z-10">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 shadow-md">
            <BellRing className="h-5 w-5 animate-bounce" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold tracking-tight text-slate-950 dark:text-white">
                Bật thông báo trên màn hình
              </span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-300">
              Nhận cuộc gọi đến, tin nhắn đối tác và bình luận trực tiếp trên màn hình khóa điện thoại.
            </p>

            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={handleGrant}
                className="flex-1 py-1.5 px-3 rounded-lg bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 font-extrabold text-[11.5px] shadow-sm hover:brightness-105 active:scale-95 transition cursor-pointer text-center"
              >
                Bật thông báo ngay
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[11.5px] hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition cursor-pointer"
              >
                Để sau
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Đóng"
            className="absolute top-0 right-0 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition active:scale-95 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
