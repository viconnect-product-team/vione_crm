// BC-7.5B — Relationship Timeline Projection scheduler entrypoint.
//
// Public HTTP endpoint (bypasses auth on /api/public/*). Auth convention
// (BC-8.1 / BC-RC1 S2-01): dedicated internal-hook cron secret via
// Authorization: Bearer <TIMELINE_PROJECTION_CRON_SECRET>, timing-safe
// compare, fail-closed when unset. Anon keys are NEVER accepted. Runs the
// projection with the service-role admin client so it can insert into
// `graph_timeline_events` via `graph_record_timeline_event`.

import { createFileRoute } from "@tanstack/react-router";
import { authorizeCronRequest } from "@/lib/hooks/cron-auth.server";

const CRON_SECRET_ENV = "TIMELINE_PROJECTION_CRON_SECRET";

export function authorize(request: Request): boolean {
  return authorizeCronRequest(request, CRON_SECRET_ENV);
}

function unauthorized() {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/hooks/timeline-projection")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!authorize(request)) {
          return unauthorized();
        }

        let batch = 100;
        try {
          const body = (await request.json().catch(() => null)) as { batch?: number } | null;
          if (body?.batch && Number.isFinite(body.batch)) {
            batch = Math.min(Math.max(Number(body.batch), 1), 500);
          }
        } catch {
          /* empty body OK */
        }

        try {
          const [{ supabaseAdmin }, { RelationshipTimelineProjectionConsumer }] = await Promise.all(
            [
              import("@/integrations/supabase/client.server"),
              import("@/lib/graph/timeline-projection/projection.server"),
            ],
          );
          const consumer = new RelationshipTimelineProjectionConsumer(supabaseAdmin);
          const report = await consumer.consumeBatch(batch);
          return new Response(JSON.stringify({ ok: true, report }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (e) {
          console.error("timeline_projection.route_error", (e as Error).message);
          return new Response(JSON.stringify({ ok: false, error: "internal_error" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
