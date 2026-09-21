import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MemberScreen } from "@/components/member/MemberShell";
import { checkRenewalReminder } from "@/lib/member-app.functions";
import { MEMBER_MANIFEST_HREF } from "@/lib/pwa-manifest";
import { getConnectAppSocket } from "@/hooks/use-connect-app-socket";
import { toast } from "sonner";

export const Route = createFileRoute("/association")({
  ssr: false,
  head: () => ({
    meta: [
      { name: "theme-color", content: "#0B0F19" },
      { name: "apple-mobile-web-app-title", content: "CEO 1983" },
      { title: "Hiệp hội Doanh nhân CEO 1983" },
    ],
    links: [
      { rel: "manifest", href: MEMBER_MANIFEST_HREF },
      { rel: "icon", type: "image/png", sizes: "64x64", href: "/ceo1983-favicon.png" },
      { rel: "apple-touch-icon", href: "/ceo1983-favicon.png" },
    ],
  }),
  beforeLoad: async ({ location }) => {
    // Nếu đang ở màn hình đăng nhập Hiệp hội, KHÔNG BAO GIỜ redirect vòng lặp
    if (location.pathname === "/association/login" || location.pathname.startsWith("/association/login")) {
      return;
    }

    const hasLocal = typeof window !== "undefined" && Boolean(
      localStorage.getItem("vibe_token") || 
      localStorage.getItem("token") || 
      localStorage.getItem("access_token")
    );
    if (!hasLocal) {
      const searchStr = typeof (location as any).searchStr === "string" ? (location as any).searchStr : "";
      const target = location.pathname.startsWith("/association/login")
        ? "/association"
        : location.pathname + searchStr;

      throw redirect({
        to: "/association/login",
        search: {
          redirect: target,
        },
      });
    }
  },
  component: MemberRoot,
});

const REMINDER_KEY = "vba.renewal.reminderCheckedAt";

/** Runs the renewal-reminder check at most once per day per device. */
function useRenewalReminder() {
  const check = useServerFn(checkRenewalReminder);
  useEffect(() => {
    let last = 0;
    try {
      last = Number(localStorage.getItem(REMINDER_KEY) ?? 0);
    } catch {
      /* ignore */
    }
    if (Date.now() - last < 24 * 3600 * 1000) return;
    void check({})
      .then((res) => {
        try {
          localStorage.setItem(REMINDER_KEY, String(Date.now()));
        } catch {
          /* ignore */
        }
        if (res?.created) {
          // Let the notifications badge refresh.
          window.dispatchEvent(new Event("notifications-updated"));
        }
      })
      .catch(() => {
        /* silent — reminder is best-effort */
      });
  }, [check]);
}

function useAssociationRealtimeNotifications() {
  useEffect(() => {
    let socket: any = null;
    try {
      socket = getConnectAppSocket();
      if (!socket.connected) {
        socket.connect();
      }
    } catch {
      return;
    }

    const handleNewNotification = (data: any) => {
      try {
        if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
          navigator.vibrate([80, 50, 100]);
        }
      } catch {}

      window.dispatchEvent(new Event("notifications-updated"));

      const title = data?.title || "Thông báo từ Ban Thư Ký";
      const body = data?.body || "";
      toast.info(title, {
        description: body ? (body.length > 90 ? body.slice(0, 90) + "..." : body) : undefined,
        duration: 5000,
      });
    };

    const handleCount = () => {
      window.dispatchEvent(new Event("notifications-updated"));
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("notification:count", handleCount);
    socket.on("member:notification_new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("notification:count", handleCount);
      socket.off("member:notification_new", handleNewNotification);
    };
  }, []);
}

function MemberRoot() {
  const routerState = useRouterState();
  const isLoginPage = routerState.location.pathname.startsWith("/association/login");
  useRenewalReminder();
  useAssociationRealtimeNotifications();

  // Trang đăng nhập Hiệp hội hiển thị màn hình riêng, không hiển thị thanh Tab Bar hội viên
  if (isLoginPage) {
    return <Outlet />;
  }

  return (
    <MemberScreen>
      <Outlet />
    </MemberScreen>
  );
}
