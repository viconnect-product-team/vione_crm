import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Building2,
  Calendar,
  CalendarCheck,
  ClipboardList,
  DollarSign,
  FileText,
  Handshake,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Users,
  UserCheck,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { KpiCard, MiniKpiCard } from "@/components/dashboard/KpiCard";
import { ExecutiveDashboard } from "@/components/dashboard/ExecutiveDashboard";
import { useT } from "@/lib/i18n";
import type { TKey } from "@/lib/i18n";
import { getDashboardStatsFn, type DashboardStats } from "@/lib/dashboard.functions";
import { resolveAssociationByHostFn, type PublicAssociation } from "@/lib/associations.functions";
import { AssociationLandingView } from "@/components/landing/AssociationLandingView";
import { TenantNotFound } from "@/components/landing/TenantNotFound";
import { isTenantHost } from "@/lib/tenant";
import { getPostLoginRouteFn } from "@/lib/landing-route.functions";

export const Route = createFileRoute("/")({
  loader: async (): Promise<{ tenant: PublicAssociation | null; tenantHost: string | null }> => {
    const host = typeof window !== "undefined" ? window.location.host : undefined;
    const tenantHost = host && isTenantHost(host) ? host : null;
    try {
      const tenant = await resolveAssociationByHostFn({ data: { host } });
      if (tenantHost && !tenant) {
        // Custom/tenant host that resolved to no association — likely a
        // misconfigured domain or missing slug mapping.
        console.warn(
          "[tenant-resolve] no association for tenant host",
          JSON.stringify({ host: tenantHost }),
        );
      }
      return { tenant, tenantHost };
    } catch (e) {
      // Never blank the app if tenant resolution fails (e.g. env/runtime issue).
      console.error(
        "[tenant-resolve] failed",
        JSON.stringify({ host: host ?? null, error: e instanceof Error ? e.message : String(e) }),
      );
      return { tenant: null, tenantHost };
    }
  },
  component: Index,
  errorComponent: ({ error }) => (
    <AppShell>
      <div
        role="alert"
        className="rounded-2xl border border-border bg-card p-6 text-sm text-destructive"
      >
        {error.message}
      </div>
    </AppShell>
  ),
});

function fmtMoney(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)} tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} tr`;
  return n.toLocaleString("vi-VN");
}

function BarList({
  title,
  items,
  total,
  labelFn,
}: {
  title: string;
  items: { key: string; count: number }[];
  total: number;
  labelFn: (k: string) => string;
}) {
  const t = useT();
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("dash.empty")}</p>
      ) : (
        <div className="space-y-3">
          {items.map((i) => (
            <div key={i.key}>
              <div className="mb-1 flex items-center justify-between text-[13px]">
                <span className="font-medium text-foreground">{labelFn(i.key)}</span>
                <span className="text-muted-foreground">
                  {i.count}
                  {total > 0 && (
                    <span className="ml-1 text-[11px]">
                      ({Math.round((i.count / total) * 100)}%)
                    </span>
                  )}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(i.count / max) * 100}%`,
                    background: "var(--gradient-primary)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GrowthBars({ data }: { data: DashboardStats["growth"] }) {
  const t = useT();
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{t("dash.growthTitle")}</h3>
      <div className="flex h-44 items-end justify-between gap-3">
        {data.map((d) => (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${(d.count / max) * 100}%`,
                  minHeight: d.count > 0 ? "6px" : "2px",
                  background: "var(--gradient-primary)",
                }}
                title={`${d.count}`}
              />
            </div>
            <span className="text-[11px] font-semibold text-foreground">{d.count}</span>
            <span className="text-[10px] text-muted-foreground">{d.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Index() {
  const { tenant, tenantHost } = Route.useLoaderData();

  // If an auth callback (code/token) is present, let the normal auth flow run
  // so sessions are established before we redirect.
  const hasCallback = hasAuthCallbackParams();
  const navigate = useNavigate();



  // Force root to connect-app for mobile or Capacitor users unless explicit CRM portal
  useEffect(() => {
    try {
      if (hasCallback) return;
      const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const isCrmPort =
        typeof window !== "undefined" &&
        (window.location.port === "5446" || window.location.hostname.includes("crm"));
      if (isCrmPort && typeof window !== "undefined") {
        sessionStorage.setItem("crm_portal", "1");
      }
      const isCrmPortal =
        search?.get("portal") === "crm" ||
        isCrmPort ||
        (typeof window !== "undefined" && sessionStorage.getItem("crm_portal") === "1");
      const isCeo1983 =
        typeof window !== "undefined" &&
        (import.meta.env.VITE_APP_SCOPE === "association_app" ||
          window.location.port === "5002" ||
          window.location.hostname.includes("ceo1983"));

      if (isCeo1983 && window.location.pathname === "/") {
        navigate({ to: "/association", replace: true });
        return;
      }
    } catch {
      /* ignore */
    }
  }, [hasCallback, navigate]);

  // Session guard: on any host (including custom tenant domains), an
  // authenticated user that lands on "/" is routed to their role home:
  // members → /m, admins → /. Covers OAuth flows whose redirect_uri returns
  // to the origin "/". While we resolve, hold render to avoid a content flash.
  // On the plain app host (no tenant landing), an anonymous visitor should be
  // sent to /landing instead of flashing the empty admin dashboard.
  const isDedicatedCrm = typeof window !== "undefined" && (window.location.port === "5446" || window.location.hostname.includes("crm"));
  const status = usePostLoginRedirect(!tenant && !tenantHost && !isDedicatedCrm);
  // Hold render until we know the session status so a logged-in member never
  // flashes (or gets stuck on) TenantNotFound before the role redirect fires.
  if (status === "checking" || status === "redirecting") return <RedirectGuard />;
  if (tenant) return <AssociationLandingView a={tenant} />;
  if (tenantHost) return <TenantNotFound host={tenantHost} />;
  return <Dashboard />;
}

function RedirectGuard() {
  const t = useT();
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        {t("acct.loading")}
      </div>
    </div>
  );
}

function hasAuthCallbackParams(): boolean {
  if (typeof window === "undefined") return false;
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return Boolean(
    search.get("code") || search.get("token_hash") || hash.get("access_token") || hash.get("code"),
  );
}

// Process an auth callback (magic link / OAuth) that landed on "/".
// PKCE (?code=) and implicit (#access_token) flows are both handled so the
// session is established before we decide what to render.
async function consumeAuthCallback(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  let established = false;
  try {
    const token = search.get("token") || hash.get("access_token") || search.get("access_token");
    const refreshToken = hash.get("refresh_token") || search.get("refresh_token");
    if (token) {
      localStorage.setItem("vibe_token", token);
      document.cookie = `sb-access-token=${token}; path=/; max-age=604800; SameSite=Lax`;
      if (refreshToken) {
        localStorage.setItem("vibe_refresh_token", refreshToken);
        document.cookie = `sb-refresh-token=${refreshToken}; path=/; max-age=2592000; SameSite=Lax`;
      }
      established = true;
    }
  } catch (e) {
    console.error("[auth-callback] failed", e instanceof Error ? e.message : String(e));
  }
  // Strip auth params from the URL so refreshes/links stay clean.
  if (established) {
    window.history.replaceState({}, "", window.location.pathname);
  }
  return established;
}

function usePostLoginRedirect(redirectAnonToLanding = false) {
  const navigate = useNavigate();
  const resolveRoute = useServerFn(getPostLoginRouteFn);
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<"checking" | "redirecting" | "idle">("checking");

  useEffect(() => {
    let active = true;
    async function route() {
      if (authStatus === 'loading') {
        setStatus("checking");
        return;
      }

      const isCrmPortal =
        typeof window !== "undefined" &&
        (new URLSearchParams(window.location.search).get("portal") === "crm" ||
          sessionStorage.getItem("crm_portal") === "1" ||
          window.location.port === "5446" ||
          window.location.hostname.includes("crm"));

      if (authStatus === 'out') {
        if (isCrmPortal) {
          setStatus("idle");
          return;
        }
        if (redirectAnonToLanding) {
          setStatus("redirecting");
          navigate({ to: "/landing" });
          return;
        }
        setStatus("idle");
        return;
      }
      
      if (authStatus === 'in') {
        // Authenticated users stay on the main CRM dashboard
        setStatus("idle");
        return;
      }
    }
    void route();
    return () => {
      active = false;
    };
  }, [authStatus, navigate, redirectAnonToLanding, resolveRoute]);

  return status;
}

function Dashboard() {
  const { status } = useAuth();
  const authReady = status === 'in';

  return (
    <AppShell>
      <ExecutiveDashboard authReady={authReady} />
    </AppShell>
  );
}
