# BC-6.6 — Security

## Trust boundary

Consumer runs only under `service_role`:

- `supabaseAdmin` client
- SECURITY DEFINER RPCs (`outcome_consumer_*`, `outcome_dispatch_record`)
- `outcome_event_dispatches` table denies `anon` + `authenticated`

## HTTP entrypoint

`POST /api/public/hooks/outcome-consumer` — public path (bypasses auth per
`/api/public/*` convention) BUT verifies caller in-handler by matching
`apikey` header against `SUPABASE_PUBLISHABLE_KEY` /
`VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_ANON_KEY`. Rejects with 401 on mismatch.

## Public SDK

`IntroductionOutcomeSDK` surface is UNCHANGED. No consumer, replay, or
receipt operation is exposed to end-user clients.

## PII

Envelope fields exclude names/emails/phone/notes/graph path. Adapters and
audit logs contain ids + enums + timestamps only.

## Replay

Admin/service only. Not callable via public SDK or authenticated route.
