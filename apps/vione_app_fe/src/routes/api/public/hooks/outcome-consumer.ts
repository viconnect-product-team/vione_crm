// BC-6.6 — Outcome Event Consumer scheduler entrypoint.
//
// Public HTTP endpoint (bypasses auth on /api/public/*). Auth convention
// (BC-8.1 / BC-RC1 S2-01): dedicated internal-hook cron secret via
// Authorization: Bearer <OUTCOME_CONSUMER_CRON_SECRET>, timing-safe compare,
// fail-closed when unset. Anon keys are NEVER accepted. Runs the consumer
// with the service-role admin client so it can invoke SECURITY DEFINER RPCs.
// No PII in responses.

import { createFileRoute } from "@tanstack/react-router";
import { authorizeCronRequest } from "@/lib/hooks/cron-auth.server";

const CRON_SECRET_ENV = "OUTCOME_CONSUMER_CRON_SECRET";

export function authorize(request: Request): boolean {
  return authorizeCronRequest(request, CRON_SECRET_ENV);
}

function unauthorized() {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

async function runConsumer(batch: number) {
  const [{ supabaseAdmin }, { OutcomeEventConsumer }] = await Promise.all([
    import("@/integrations/supabase/client.server"),
    import("@/lib/graph/introduction/outcome/consumer/consumer.service.server"),
  ]);
  const consumer = new OutcomeEventConsumer(supabaseAdmin);
  const startedAt = new Date();
  const batchId = `batch_${startedAt.getTime()}`;
  try {
    const report = await consumer.consumeBatch(batch);
    const finishedAt = new Date();
    // Record one row per adapter that participated + one aggregate scheduler-style row.
    const perAdapter = Object.entries(report.perAdapter);
    if (perAdapter.length === 0) {
      await supabaseAdmin
        .rpc("intro_ops_record_consumer_run", {
          _batch_id: batchId,
          _adapter_name: "",
          _started_at: startedAt.toISOString(),
          _finished_at: finishedAt.toISOString(),
          _status: "success",
          _events_claimed: report.claimed,
          _events_delivered: 0,
          _events_failed: 0,
          _events_deadlettered: 0,
          _error_code: undefined,
          _details: { deferred: report.deferred, finalized: report.finalized } as never,
        })
        .then(
          () => undefined,
          () => undefined,
        );
    } else {
      for (const [adapter, m] of perAdapter) {
        const status =
          m.deadLettered > 0
            ? "partial"
            : m.retried > 0 && m.delivered === 0
              ? "failed"
              : "success";
        await supabaseAdmin
          .rpc("intro_ops_record_consumer_run", {
            _batch_id: batchId,
            _adapter_name: adapter,
            _started_at: startedAt.toISOString(),
            _finished_at: finishedAt.toISOString(),
            _status: status,
            _events_claimed: report.claimed,
            _events_delivered: m.delivered,
            _events_failed: m.retried,
            _events_deadlettered: m.deadLettered,
            _error_code: undefined,
            _details: {} as never,
          })
          .then(
            () => undefined,
            () => undefined,
          );
      }
    }
    await supabaseAdmin
      .rpc("intro_ops_record_job_run", {
        _job_name: "outcome_consumer_batch",
        _started_at: startedAt.toISOString(),
        _finished_at: finishedAt.toISOString(),
        _status: "success",
        _rows_processed: report.claimed,
        _error_code: undefined,
        _error_message: undefined,
        _details: {
          delivered: report.delivered,
          retried: report.retried,
          deadLettered: report.deadLettered,
          deferred: report.deferred,
          finalized: report.finalized,
        } as never,
      })
      .then(
        () => undefined,
        () => undefined,
      );
    return report;
  } catch (e) {
    const finishedAt = new Date();
    await supabaseAdmin
      .rpc("intro_ops_record_job_run", {
        _job_name: "outcome_consumer_batch",
        _started_at: startedAt.toISOString(),
        _finished_at: finishedAt.toISOString(),
        _status: "failed",
        _rows_processed: 0,
        _error_code: "CONSUMER_ERROR",
        _error_message: (e as Error).message.slice(0, 500),
        _details: {} as never,
      })
      .then(
        () => undefined,
        () => undefined,
      );
    throw e;
  }
}

export const Route = createFileRoute("/api/public/hooks/outcome-consumer")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!authorize(request)) return unauthorized();

        let batch = 100;
        try {
          const body = (await request.json().catch(() => null)) as { batch?: number } | null;
          if (body?.batch && Number.isFinite(body.batch)) batch = Number(body.batch);
        } catch {
          /* empty body OK */
        }

        try {
          const report = await runConsumer(batch);
          return new Response(JSON.stringify({ ok: true, report }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (e) {
          console.error("outcome_consumer.route_error", (e as Error).message);
          return new Response(JSON.stringify({ ok: false, error: "internal_error" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
