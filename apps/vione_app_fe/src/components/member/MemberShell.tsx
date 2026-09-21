import { type ReactNode, useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Calendar, MessageSquare, User, QrCode, ChevronLeft, WifiOff } from "lucide-react";
import { useT, useLang, type TKey } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import authBg from "@/assets/connect-auth-bg.jpg";

const NAVY = "#0A0A0B";
const emblem83 = "/ceo1983-emblem-8.png";

import { PullToRefresh } from "@/components/member/PullToRefresh";
import { useNavigate } from "@tanstack/react-router";
import { IncomingConnectionModal } from "@/components/member/IncomingConnectionModal";
import { IosInstallPrompt } from "@/components/member/IosInstallPrompt";
import { getConnectAppSocket } from "@/hooks/use-connect-app-socket";
import { toast } from "sonner";

/** Mobile-constrained container for the member app. */
export function MemberScreen({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const isContrast = theme === "contrast";
  const isLight = theme === "light";
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const currentTabIndex = tabs.findIndex((t) =>
    t.exact ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + "/")
  );

  const handleSwipeLeft = () => {
    if (currentTabIndex !== -1 && currentTabIndex < tabs.length - 1) {
      navigate({ to: tabs[currentTabIndex + 1].to as any });
    }
  };

  const handleSwipeRight = () => {
    if (currentTabIndex > 0) {
      navigate({ to: tabs[currentTabIndex - 1].to as any });
    }
  };

  useEffect(() => {
    const socket = getConnectAppSocket();

    const handleConnectionAccepted = (data: any) => {
      const partnerName =
        data?.accepterProfile?.display_name ||
        data?.accepterProfile?.name ||
        "Hội viên CEO 1983";
      const partnerAvatar =
        data?.accepterProfile?.avatar_url || data?.accepterProfile?.avatar;
      const partnerCode =
        data?.accepterProfile?.memberCode || data?.accepterProfile?.code;
      const partnerUserId = data?.accepterProfile?.userId;

      // 1. Lưu vào vba_notifications (đẩy về chuông thông báo hiệp hội)
      try {
        const newNotif = {
          id: `conn_acc_${Date.now()}`,
          title: "Lời mời kết nối đã được chấp nhận!",
          body: `${partnerName} đã đồng ý lời mời kết nối của bạn. Giờ đây hai bạn có thể trò chuyện và giao thương.`,
          createdAt: new Date().toISOString(),
          unread: true,
          type: "connection",
          avatar: partnerAvatar,
        };
        const rawNotifs = localStorage.getItem("vba_notifications");
        const notifs = rawNotifs ? JSON.parse(rawNotifs) : [];
        notifs.unshift(newNotif);
        localStorage.setItem("vba_notifications", JSON.stringify(notifs.slice(0, 50)));

        // 2. Lưu vào danh bạ kết nối vba_connected_members
        const rawConnected = localStorage.getItem("vba_connected_members");
        const connectedList = rawConnected ? JSON.parse(rawConnected) : [];
        if (partnerCode && !connectedList.includes(partnerCode)) connectedList.push(partnerCode);
        if (partnerUserId && !connectedList.includes(partnerUserId)) connectedList.push(partnerUserId);
        localStorage.setItem("vba_connected_members", JSON.stringify(connectedList));

        window.dispatchEvent(new CustomEvent("notifications-updated"));
        window.dispatchEvent(new CustomEvent("vba:conversation_updated"));
        window.dispatchEvent(new CustomEvent("vba:connection_accepted"));
      } catch {}

      // 3. Thông báo đẩy 2 chiều trên app
      toast.success(`${partnerName} đã đồng ý kết nối giao thương với bạn!`);
    };

    socket.on("connection:accepted", handleConnectionAccepted);

    return () => {
      socket.off("connection:accepted", handleConnectionAccepted);
    };
  }, []);

  return (
    <div className="vba-app relative h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[var(--vba-bg)] text-[var(--vba-text)] transition-colors duration-200">
      {/* Dynamic Background Mesh Overlay — only in dark luxury mode */}
      {!isContrast && !isLight && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
          <img
            src={authBg}
            alt=""
            width={1024}
            height={640}
            className="pointer-events-none absolute inset-x-0 top-0 h-[640px] w-full select-none object-cover opacity-35"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[var(--vba-bg)]/80 to-[var(--vba-bg)]" />
        </div>
      )}

      <div
        className={`relative z-10 mx-auto flex h-[100dvh] max-h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden border-x border-[var(--vba-border-soft)]/30 ${
          isContrast ? "bg-black" : isLight ? "bg-white" : "bg-[var(--vba-bg)]/90"
        } shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] backdrop-blur-sm`}
      >
        <OfflineBanner />
        <PullToRefresh
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          pathname={pathname}
          className="flex-1 pb-[calc(max(env(safe-area-inset-bottom,0px),20px)+72px)]"
        >
          {children}
        </PullToRefresh>
        <MemberTabBar />
        <IncomingConnectionModal />
        <IosInstallPrompt />
      </div>
    </div>
  );
}

/** Shows a thin banner when the device loses its network connection. */
function OfflineBanner() {
  const t = useT();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-[var(--vba-gold)] px-4 py-1.5 text-[11px] font-semibold text-[#071322]">
      <WifiOff className="h-3.5 w-3.5" />
      {t("m.shell.offline")}
    </div>
  );
}

/** Simple top bar with optional back button. */
export function MemberHeader({
  title,
  subtitle,
  back,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}) {
  const t = useT();
  return (
    <header
      className="sticky top-0 z-50 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-[var(--vba-border-soft)] bg-[var(--vba-bg-2)]/95 px-4 backdrop-blur-md"
      style={{
        paddingTop:
          "var(--bc-mobile-safe-top-compact, calc(max(env(safe-area-inset-top, 0px), 16px) + 4px))",
        minHeight:
          "calc(var(--bc-mobile-safe-top-compact, calc(max(env(safe-area-inset-top, 0px), 16px) + 4px)) + var(--bc-mobile-header-h, 56px))",
      }}
    >
      <div className="flex w-9 items-center">
        {back ? (
          <button
            onClick={() => window.history.back()}
            aria-label={t("m.shell.back")}
            className="grid h-9 w-9 place-items-center rounded-full text-[var(--vba-gold)] transition hover:bg-card/5 cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      <div className="min-w-0 text-center">
        <h1 className="truncate text-[15px] font-semibold text-[var(--vba-text)]">{title}</h1>
        {subtitle ? (
          <p className="truncate text-[11px] text-[var(--vba-text-muted)]">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex min-w-[36px] items-center justify-end">{right}</div>
    </header>
  );
}

const tabs = [
  { to: "/association", label: "m.shell.tab_home", icon: Home, exact: true },
  { to: "/association/events", label: "m.events.title", icon: Calendar },
  { to: "/association/card", label: "m.shell.tab_qr", icon: QrCode, center: true },
  { to: "/association/messages", label: "m.shell.tab_messages", icon: MessageSquare },
  { to: "/association/profile", label: "m.shell.tab_profile", icon: User },
] satisfies { to: string; label: TKey; icon: typeof Home; exact?: boolean; center?: boolean }[];

function useVirtualKeyboard() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName?.toLowerCase();
      const isInput = tag === "input" || tag === "textarea" || target.isContentEditable;
      if (isInput) {
        setKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement;
        const tag = active?.tagName?.toLowerCase();
        const isInput = tag === "input" || tag === "textarea" || (active as HTMLElement)?.isContentEditable;
        if (!isInput) {
          setKeyboardOpen(false);
        }
      }, 100);
    };

    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);

    const vv = window.visualViewport;
    if (!vv) {
      return () => {
        window.removeEventListener("focusin", handleFocusIn);
        window.removeEventListener("focusout", handleFocusOut);
      };
    }

    const handleResize = () => {
      const diff = window.innerHeight - vv.height - (vv.offsetTop || 0);
      if (diff > 140) {
        setKeyboardOpen(true);
      } else {
        const active = document.activeElement;
        const tag = active?.tagName?.toLowerCase();
        const isInput = tag === "input" || tag === "textarea" || (active as HTMLElement)?.isContentEditable;
        if (!isInput) {
          setKeyboardOpen(false);
        }
      }
    };

    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);
    return () => {
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
    };
  }, []);

  return keyboardOpen;
}

function MemberTabBar() {
  const t = useT();
  const { lang } = useLang();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const keyboardOpen = useVirtualKeyboard();
  const [isMidAutumn, setIsMidAutumn] = useState(false);

  const tabLabels: Record<string, { vi: string; en: string }> = {
    "/association": { vi: "Trang chủ", en: "Home" },
    "/association/events": { vi: "Sự kiện", en: "Events" },
    "/association/card": { vi: "Thẻ 83", en: "Card 83" },
    "/association/messages": { vi: "Tin nhắn", en: "Messages" },
    "/association/profile": { vi: "Cá nhân", en: "Profile" },
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const check = () => {
        const enabled = localStorage.getItem("vba_event_theme_enabled") === "true";
        const disabled = localStorage.getItem("vba_event_theme_disabled") === "true";
        const type = localStorage.getItem("vba_event_theme_type") || "mid-autumn";
        setIsMidAutumn(enabled && !disabled && type === "mid-autumn");
      };
      check();
      window.addEventListener("vba-event-theme-changed", check);
      return () => window.removeEventListener("vba-event-theme-changed", check);
    }
  }, []);

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  // Automatically hide bottom tab bar when mobile keyboard is open or user is typing
  if (keyboardOpen) return null;

  return (
    <nav className="vba-bottom-bar fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] pointer-events-none transition-all duration-200">
      <div
        className={`pointer-events-auto relative flex items-end justify-around border-t bg-white/95 dark:bg-[var(--vba-bg-2)]/95 px-2 pb-[max(env(safe-area-inset-bottom,0px),20px)] pt-2 backdrop-blur-md transition-all ${
          isMidAutumn
            ? "border-amber-400/40 shadow-[0_-6px_24px_rgba(245,158,11,0.22)]"
            : "border-slate-200 dark:border-[var(--vba-border-soft)] shadow-lg"
        }`}
      >
        {/* Festive Mid-Autumn Corner Dangling Lantern */}
        {isMidAutumn && (
          <div
            className="pointer-events-none absolute left-2 -top-3.5 flex flex-col items-center select-none"
            aria-hidden="true"
          >
            <span className="text-[14px] animate-bounce filter drop-shadow-[0_2px_6px_rgba(239,68,68,0.7)]" style={{ animationDuration: "3s" }}>
              🏮
            </span>
          </div>
        )}

        {/* Festive Mid-Autumn Corner Moon Rabbit */}
        {isMidAutumn && (
          <div
            className="pointer-events-none absolute right-2.5 -top-3.5 flex flex-col items-center select-none"
            aria-hidden="true"
          >
            <span className="text-[13px] animate-pulse filter drop-shadow-[0_2px_6px_rgba(251,191,36,0.8)]">
              🥮
            </span>
          </div>
        )}

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.to, tab.exact);

          if (tab.center) {
            return (
              <div key={tab.to} className="relative flex flex-1 flex-col items-center justify-end">
                <Link
                  to={tab.to}
                  aria-label={t(tab.label)}
                  className="-mt-7 relative flex flex-col items-center group"
                >
                  {/* Mid-Autumn Full Moon Aura Halo */}
                  {isMidAutumn && (
                    <span className="absolute inset-0 -top-1 rounded-full bg-amber-400/30 blur-md animate-pulse pointer-events-none" />
                  )}
                  <span
                    className="relative grid h-14 w-14 place-items-center rounded-2xl shadow-[0_8px_24px_-6px_rgba(0,59,149,0.7)] group-hover:scale-105 group-active:scale-95 transition-transform overflow-hidden p-2.5"
                    style={{
                      background: "linear-gradient(135deg, #19194D 0%, #2E3192 100%)",
                      border: "2.5px solid #FFFFFF",
                      boxShadow: "0 4px 14px rgba(0, 59, 149, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.2)",
                    }}
                  >
                    <QrCode
                      className="h-7 w-7"
                      style={{
                        color: "#FFFFFF",
                        stroke: "#FFFFFF",
                        strokeWidth: 2.2,
                        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))",
                      }}
                    />
                    {isMidAutumn && (
                      <span className="absolute -top-1.5 -right-1.5 text-[10px] select-none" aria-hidden="true">
                        🌕
                      </span>
                    )}
                  </span>
                </Link>
              </div>
            );
          }

          // Custom seasonal tab badges
          let seasonalBadge: ReactNode = null;
          if (isMidAutumn) {
            if (tab.to.includes("notifications")) {
              seasonalBadge = (
                <span className="absolute -top-1 -right-1 text-[9px] animate-bounce select-none" style={{ animationDuration: "2.4s" }} aria-hidden="true">
                  🏮
                </span>
              );
            } else if (tab.to.includes("messages")) {
              seasonalBadge = (
                <span className="absolute -top-1.5 -right-1.5 text-[9px] animate-pulse select-none" aria-hidden="true">
                  🐰
                </span>
              );
            } else if (tab.to.includes("profile")) {
              seasonalBadge = (
                <span className="absolute -top-1.5 -right-1.5 text-[9px] animate-wiggle select-none" aria-hidden="true">
                  ✨
                </span>
              );
            }
          }

          return (
            <Link key={tab.to} to={tab.to} className="relative flex flex-1 flex-col items-center justify-end gap-1 py-1 transition-colors">
              <div className="relative">
                <Icon
                  className="h-5 w-5 transition-colors"
                  style={{ color: active ? "#2E3192" : "var(--vba-text-dim)" }}
                />
                {seasonalBadge}
              </div>
              <span
                className={`text-[10px] transition-colors ${active ? "font-bold text-[#2E3192] dark:text-blue-400" : "font-medium text-[var(--vba-text-dim)]"}`}
              >
                {lang === "en" ? tabLabels[tab.to]?.en || t(tab.label) : tabLabels[tab.to]?.vi || t(tab.label)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Reusable section heading with optional "see all" link. */
export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[15px] font-bold text-[var(--vba-text)]">{title}</h2>
      {action}
    </div>
  );
}
