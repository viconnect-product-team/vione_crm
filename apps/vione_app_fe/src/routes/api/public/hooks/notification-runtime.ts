// BC-8.1 §Phase-0 — Notification runtime scheduler entrypoint.
//
// SECURITY: server-only cron secret via Authorization: Bearer <secret>.
// The Supabase anon apikey is PUBLIC and is NOT accepted as authorization
// for privileged runtime workers. Callers (pg_cron, external scheduler)
// must present NOTIFICATION_RUNTIME_CRON_SECRET.
//
// Actions (allowlist, frozen):
//   ?action=consume    → outbox → notifications
//   ?action=dispatch   → claim + send channel dispatches
//   ?action=schedule   → claim + fulfill schedules
//   ?action=reconcile  → recover stuck + expiry
//
// No secret material, PII or payload bodies are logged or returned.

import { createFileRoute } from "@tanstack/react-router";

const ACTIONS = new Set(["consume", "dispatch", "schedule", "reconcile"] as const);
type Action = "consume" | "dispatch" | "schedule" | "reconcile";

// simple in-process concurrency guard — bounded worker semantics
const inFlight = new Set<Action>();

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function unauthorized() {
  return json({ error: "unauthorized" }, 401);
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export function authorize(request: Request): boolean {
  const secret = process.env.NOTIFICATION_RUNTIME_CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(header);
  if (!m) return false;
  const presented = m[1].trim();
  if (!presented) return false;
  return timingSafeEqual(presented, secret);
}

export const ACTION_ALLOWLIST = Object.freeze(Array.from(ACTIONS));

async function handle(request: Request) {
  if (!authorize(request)) return unauthorized();

  const url = new URL(request.url);
  const rawAction = url.searchParams.get("action") ?? "consume";
  if (!ACTIONS.has(rawAction as Action)) {
    return json({ error: "unsupported_action" }, 400);
  }
  const action = rawAction as Action;
  const batch = Math.min(
    Math.max(Number.parseInt(url.searchParams.get("batch") ?? "100", 10) || 100, 1),
    500,
  );

  if (inFlight.has(action)) {
    return json({ action, skipped: "already_running" }, 202);
  }
  inFlight.add(action);

  const [{ supabaseAdmin }, api] = await Promise.all([
    import("@/integrations/supabase/client.server"),
    import("@/lib/business-connect/notification-orchestration/runtime/internal-api.server"),
  ]);

  const t0 = Date.now();
  try {
    let r: unknown;
    if (action === "consume")
      r = await api.consumeNotificationOutboxBatch(supabaseAdmin, { batch });
    else if (action === "dispatch")
      r = await api.dispatchNotificationBatch(supabaseAdmin, { batch });
    else if (action === "schedule")
      r = await api.claimAndFulfillSchedulesBatch(supabaseAdmin, { batch });
    else r = await api.reconcileNotificationRuntime(supabaseAdmin);
    // Safe metadata only — never echo request headers or secrets.
    return json({ action, elapsedMs: Date.now() - t0, ok: true, result: r });
  } catch (err) {
    console.error("notification runtime failure", { action, message: (err as Error).message });
    return json({ action, error: "runtime_failure" }, 500);
  } finally {
    inFlight.delete(action);
  }
}

export const Route = createFileRoute("/api/public/hooks/notification-runtime")({
  server: {
    handlers: {
      // POST is preferred. GET kept only for scheduler contracts that require it.
      POST: ({ request }) => handle(request),
      GET: ({ request }) => handle(request),
    },
  },
});
