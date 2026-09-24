import "@/lib/utils";
import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useRouterState,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  enforceEphemeralSession,
  ensureFreshSession,
  startSessionResume,
  rememberLastMobileRoute,
  getLastMobileRoute,
  isStandalonePwa,
  signOutSession,
} from "@/lib/business-connect/mobile/auth-session";
import { bcDeviceSessionTouchFn } from "@/lib/business-connect/mobile/device-session.functions";
import { describeCurrentDevice } from "@/lib/business-connect/mobile/device-session.client-info";
import { useEffect, useState } from "react";
import { LangContext, isLang, type Lang } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { registerServiceWorker } from "@/lib/register-sw";
import { isTenantHost } from "@/lib/tenant";

const LANG_STORAGE_KEY = "vba.lang";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}
import { Toaster } from "@/components/ui/sonner";
import { MockModeBanner } from "@/components/MockModeBanner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function RootErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    // Log the raw thrown value: some throws are non-Error (undefined/null),
    // which otherwise surface as an opaque "Uncaught undefined".
    console.error("[root-error]", error);
  }, [error]);

  const message = error instanceof Error ? error.message : String(error ?? "Unknown error");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Đã xảy ra lỗi</h1>
        <p className="mt-2 break-words text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              reset();
              void router.invalidate();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Thử lại
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      // PWA: lock scale to prevent pinch/double-tap zoom in the installed app.
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
      },
      { title: "ViOne — Nền Tảng Chuyển Đổi Số & Kết Nối Doanh Nghiệp Toàn Diện" },
      {
        name: "description",
        content:
          "Hệ sinh thái quản trị doanh nghiệp toàn diện, danh thiếp số thông minh và tự động hóa quy trình cùng ViOne AI Copilot.",
      },
      { name: "author", content: "ViOne Platform" },
      { name: "theme-color", content: "#EAB308" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "ViOne App" },
      { property: "og:title", content: "ViOne — Nền Tảng Chuyển Đổi Số & Kết Nối Doanh Nghiệp Toàn Diện" },
      {
        property: "og:description",
        content:
          "Hệ sinh thái quản trị doanh nghiệp toàn diện, danh thiếp số thông minh và tự động hóa quy trình cùng ViOne AI Copilot.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@ViOne" },
      { name: "twitter:title", content: "ViOne — Nền Tảng Chuyển Đổi Số & Kết Nối Doanh Nghiệp Toàn Diện" },
      {
        name: "twitter:description",
        content:
          "Hệ sinh thái quản trị doanh nghiệp toàn diện, danh thiếp số thông minh và tự động hóa quy trình cùng ViOne AI Copilot.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/11601df2-fd5a-495c-904f-bde8bbc684fd/id-preview-179ada85--17365608-e269-4b6f-a8cb-7c9e19a52b0f.lovable.app-1777802264595.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/11601df2-fd5a-495c-904f-bde8bbc684fd/id-preview-179ada85--17365608-e269-4b6f-a8cb-7c9e19a52b0f.lovable.app-1777802264595.png",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/vione-favicon.svg" },
      { rel: "icon", type: "image/svg+xml", href: "/vione-favicon.svg" },
      { rel: "shortcut icon", href: "/vione-favicon.svg" },
      // Web fonts for Business Card industry templates.
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href:
          "https://fonts.googleapis.com/css2?" +
          "family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&" +
          "family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&" +
          "family=Inter:wght@400;500;600;700;800&" +
          "family=Playfair+Display:wght@500;600;700&" +
          "family=Cormorant+Garamond:wght@500;600;700&" +
          "family=DM+Serif+Display&" +
          "family=Instrument+Serif&" +
          "family=Space+Grotesk:wght@400;500;600;700&" +
          "family=Manrope:wght@400;500;600;700&" +
          "family=JetBrains+Mono:wght@400;500;700&" +
          "display=swap&subset=vietnamese,latin-ext",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: RootErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  const redirectScript = `(${String(function () {
    // Synchronously apply theme (defaulting to dark).
    try {
      var savedTheme = localStorage.getItem("vba.theme");
      var theme = (savedTheme === "light" || savedTheme === "dark" || savedTheme === "contrast") ? savedTheme : "dark";
      var doc = document.documentElement;
      doc.classList.toggle("dark", theme === "dark" || theme === "contrast");
      doc.classList.toggle("hc", theme === "contrast");
      doc.dataset.theme = theme;
      doc.style.colorScheme = theme === "light" ? "light" : "dark";
    } catch (e) {
      /* ignore */
    }
  })})();`;

  return (
    <html lang="en" className="dark" data-theme="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: redirectScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { useConnectAppRealtimeNotifications } from "@/hooks/use-connect-app-realtime-notifications";
import { GlobalIncomingCallModal } from "@/components/business-connect/mobile/inbox/GlobalIncomingCallModal";

function GlobalRealtimeNotifications() {
  const { status } = useAuth();
  if (status !== "in") return null;
  return <AuthenticatedRealtimeNotifications />;
}

function AuthenticatedRealtimeNotifications() {
  useConnectAppRealtimeNotifications();
  return <GlobalIncomingCallModal />;
}

function RootComponent() {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(LANG_STORAGE_KEY);
        if (isLang(saved)) return saved;
      } catch {
        /* ignore */
      }
    }
    return "vi";
  });
  const [queryClient] = useState(makeQueryClient);

  // Register service worker for offline support (guarded: prod only).
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Stale-deploy recovery: when a new build ships, cached HTML/JS can point at
  // chunk URLs that no longer exist. The dynamic import rejects and the page
  // dies with a blank/error screen. Reload once (guarded) to pick up the new
  // asset manifest instead of leaving the user stuck.
  useEffect(() => {
    const isChunkError = (value: unknown) => {
      const msg = value instanceof Error ? value.message : String(value ?? "");
      return /dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk .* failed/i.test(
        msg,
      );
    };
    const recover = (value: unknown) => {
      if (!isChunkError(value)) return;
      try {
        if (sessionStorage.getItem("app:chunk-reload") === "1") return;
        sessionStorage.setItem("app:chunk-reload", "1");
      } catch {
        return;
      }
      window.location.reload();
    };
    const onError = (e: ErrorEvent) => recover(e.error ?? e.message);
    const onRejection = (e: PromiseRejectionEvent) => recover(e.reason);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    // A clean load means the app is healthy again — clear the guard.
    const clear = window.setTimeout(() => {
      try {
        sessionStorage.removeItem("app:chunk-reload");
      } catch {
        /* storage unavailable */
      }
    }, 5000);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      window.clearTimeout(clear);
    };
  }, []);

  // PWA: block zoom gestures on standalone.
  useEffect(() => {
    const preventGesture = (e: Event) => e.preventDefault();
    let lastTouchEnd = 0;
    const onTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = now;
      detachPinchGuard();
    };
    const onPinchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    let pinchGuardAttached = false;
    function attachPinchGuard() {
      if (pinchGuardAttached) return;
      pinchGuardAttached = true;
      document.addEventListener("touchmove", onPinchMove, { passive: false });
    }
    function detachPinchGuard() {
      if (!pinchGuardAttached) return;
      pinchGuardAttached = false;
      document.removeEventListener("touchmove", onPinchMove);
    }
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) attachPinchGuard();
    };
    document.addEventListener("gesturestart", preventGesture);
    document.addEventListener("gesturechange", preventGesture);
    document.addEventListener("gestureend", preventGesture);
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: false });
    document.addEventListener("touchcancel", detachPinchGuard, { passive: true });
    return () => {
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", detachPinchGuard);
      detachPinchGuard();
    };
  }, []);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (isLang(saved)) {
        setLangState(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Reflect on <html lang> + persist on change
  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = l;
    }
  };

  // Dynamic Favicon Switcher: CEO 1983 for association routes, ViOne for ViOne routes
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const isAssociation =
      currentPath.startsWith("/association") ||
      currentPath === "/verify" ||
      currentPath.startsWith("/landing/ceo1983");

    const targetFavicon = isAssociation ? "/ceo1983-favicon.png" : "/favicon.png";
    const targetApple = isAssociation ? "/ceo1983-favicon.png" : "/apple-touch-icon.png";

    const iconLinks = document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']");
    if (iconLinks.length > 0) {
      iconLinks.forEach((l) => {
        l.href = targetFavicon;
      });
    } else {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = targetFavicon;
      document.head.appendChild(link);
    }

    const appleLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if (appleLink) {
      appleLink.href = targetApple;
    }
  }, [currentPath]);

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          {/* Global Luxury Ambient Glowing Backgrounds */}
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
            <div className="luxury-glow-1" />
            <div className="luxury-glow-2" />
          </div>
          <MockModeBanner />
          <AuthProvider>
            <GlobalRealtimeNotifications />
            <AuthGate>
              <Outlet />
            </AuthGate>
          </AuthProvider>
          <Toaster position="top-right" />
        </ThemeProvider>
      </QueryClientProvider>
    </LangContext.Provider>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { status, user, logout } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [expired, setExpired] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);



  useEffect(() => {
    const stopResume = startSessionResume(() => {
      setExpired(true);
      // Removed status="out" set here since AuthContext handles it, but could trigger a logout.
    });
    return stopResume;
  }, []);

  // Phiên & thiết bị: ghi nhận thiết bị hiện tại và tự đăng xuất khi bị ngắt từ xa.
  useEffect(() => {
    if (status !== "in") return;
    let active = true;
    async function beat() {
      const device = describeCurrentDevice();
      if (!device) return;
      try {
        const result = await bcDeviceSessionTouchFn({ data: device });
        if (active && result.revoked) {
          await signOutSession();
          logout();
        }
      } catch {
        /* nhịp ghi nhận thiết bị không được chặn ứng dụng */
      }
    }
    void beat();
    const timer = window.setInterval(() => void beat(), 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [status]);

  // Ghi nhớ màn hình cuối trong PWA và khôi phục khi mở lại app từ start_url.
  useEffect(() => {
    if (status !== "in") return;
    rememberLastMobileRoute(pathname + window.location.search);
  }, [status, pathname]);

  const [resumed, setResumed] = useState(false);
  useEffect(() => {
    if (resumed) return;
    if (status !== "in") return;
    setResumed(true);
    if (pathname !== "/connect-app") return;
    if (!isStandalonePwa()) return;
    const last = getLastMobileRoute();
    if (!last || last === pathname) return;
    navigate({ to: last, replace: true });
  }, [status, pathname, resumed, navigate]);

  // On a tenant custom domain/subdomain, the home route shows a public landing.
  const [tenantHost, setTenantHost] = useState(false);
  useEffect(() => {
    setTenantHost(isTenantHost(window.location.hostname));
  }, []);

  // Public routes: auth screen, the member PWA, the install landing page,
  // the marketing landing page, and the QR-opened membership card.
  const isPublic =
    pathname === "/" ||
    pathname === "/auth" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/install" ||
    pathname.startsWith("/landing") ||
    pathname === "/demo" ||
    pathname.startsWith("/h/") ||
    pathname === "/m" ||
    pathname.startsWith("/m/") ||
    pathname.startsWith("/card/") ||
    pathname === "/verify" ||
    pathname.startsWith("/association") ||
    pathname.startsWith("/vione") ||
    pathname.startsWith("/connect-app") ||
    pathname.startsWith("/business-connect") ||
    (pathname === "/" && tenantHost);

  useEffect(() => {
    if (status === "out" && !isPublic) {
      const search = window.location.pathname + window.location.search;
      if (pathname.startsWith("/association") && !pathname.startsWith("/association/login")) {
        navigate({
          to: "/association/login" as any,
          search: {
            redirect: search,
          } as any,
          replace: true,
        });
      } else if (pathname.startsWith("/connect-app") && !pathname.startsWith("/vione/login")) {
        navigate({
          to: "/vione/login" as any,
          search: {
            redirect: search,
          } as any,
          replace: true,
        });
      } else if (!pathname.startsWith("/association/login") && !pathname.startsWith("/vione/login")) {
        navigate({
          to: "/auth",
          search: {
            redirect: search,
            portal: "crm" as const,
            ...(expired ? { reason: "expired" as const } : {}),
          },
          replace: true,
        });
      }
    }
  }, [status, isPublic, navigate, expired, pathname]);

  if (isPublic) return <>{children}</>;

  if (isMounted && status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isMounted && status === "out") return null;
  return <>{children}</>;
}
