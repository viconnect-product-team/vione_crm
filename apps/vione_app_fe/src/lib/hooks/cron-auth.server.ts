// BC-RC1 (S2-01) — Shared internal-hook authorization helper.
//
// Convention (established by BC-8.1 notification-runtime): every internal
// runtime/worker hook under /api/public/hooks/* requires its OWN dedicated
// cron secret via `Authorization: Bearer <secret>`, compared timing-safely.
// Anon keys are NEVER accepted. When the env secret is unset the helper
// fails closed (deny all) — an endpoint without a configured secret is
// unreachable rather than open.

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; ++i) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * True only when the request carries `Authorization: Bearer <secret>` where
 * <secret> exactly matches the configured environment variable.
 */
export function authorizeCronRequest(request: Request, secretEnvVar: string): boolean {
  const secret = process.env[secretEnvVar];
  if (!secret) return false; // fail-closed: no secret configured → deny all
  const header = request.headers.get("authorization") ?? "";
  const match = /^bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return false;
  return safeEqual(match[1].trim(), secret);
}
