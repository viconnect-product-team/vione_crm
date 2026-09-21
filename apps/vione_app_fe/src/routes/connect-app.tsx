// BC-Mobile-0B — /connect-app parent layout route.
// Auth-guarded (same pattern as /m), renders the BC mobile shell with its
// own PWA manifest. Legacy routes (/m/*, /business-connect/*) are untouched.

import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { BusinessConnectMobileShell } from "@/components/business-connect/mobile/BusinessConnectMobileShell";
import { ConnectAppRouteError } from "@/components/business-connect/mobile/ConnectAppRouteError";
import { BC_MANIFEST_HREF } from "@/lib/pwa-manifest";
import { rememberVioneAppContext } from "@/lib/business-connect/mobile/vione-auth-context";

export const Route = createFileRoute("/connect-app")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    rememberVioneAppContext();
    const token = typeof window !== "undefined" ? localStorage.getItem("vibe_token") : null;
    if (!token) {
      // Preserve the intended deep-link destination for post-auth return.
      throw redirect({ to: "/vione/login", search: { redirect: location.href } });
    }
  },
  head: () => ({
    // Dark navy chrome (status bar / browser UI) to match the Connect-app tone.
    meta: [
      { name: "theme-color", content: "#FAF8F5" },
      { name: "color-scheme", content: "dark" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    ],
    links: [{ rel: "manifest", href: BC_MANIFEST_HREF }],
  }),
  component: ConnectAppLayout,
  errorComponent: ConnectAppRouteError,
});

function ConnectAppLayout() {
  return (
    <BusinessConnectMobileShell>
      <Outlet />
    </BusinessConnectMobileShell>
  );
}
