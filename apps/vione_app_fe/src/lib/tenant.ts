/**
 * Platform app hostnames that serve the main app (login/dashboard/PWA),
 * NOT a tenant landing page. Add custom domains used for the platform here.
 */
export const PLATFORM_APP_HOSTS = ["qlhh.demo.ubos.vn"];

/** Returns true for the platform's own app/preview hosts (not a tenant landing). */
export function hostIsAppDomain(hostname: string): boolean {
  const h = hostname.split(":")[0].toLowerCase();
  if (!h || h === "localhost" || /^[\d.]+$/.test(h)) return true;
  if (h.endsWith(".lovable.app") || h === "lovable.app") return true;
  if (PLATFORM_APP_HOSTS.includes(h)) return true;
  return false;
}

/** A tenant host is any custom domain/subdomain that isn't the platform app host. */
export function isTenantHost(hostname: string): boolean {
  return !hostIsAppDomain(hostname);
}

/** Canonical published PWA install URL, used as SSR/fallback default. */
export const CANONICAL_PWA_URL = "https://qlhh.lovable.app/m";

/**
 * Resolve the PWA install URL (QR/NFC target) for the current request.
 * Always points to `/m` on the active tenant/app hostname so members install
 * the correctly-branded PWA from the domain they're visiting. Falls back to the
 * canonical published URL during SSR or when no window is available.
 */
export function resolvePwaInstallUrl(origin?: string): string {
  const o = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  if (!o) return CANONICAL_PWA_URL;
  return `${o.replace(/\/$/, "")}/m`;
}
