# BC-6.8 — Smart Introduction Ops Security

## Access Model

- `platform` scope: requires `has_role(auth.uid(), 'platform_admin')`.
- `association` scope: requires association-admin membership for the given
  `association_id`.
- `getIntroOpsAccessFn` returns `{ canReadPlatform, associationIds[] }` used
  by the UI to gate the scope switcher. Never trust this on the server — every
  read RPC re-checks the caller.

## RLS & Function Security

- All ops tables (`introduction_ops_alerts`, `introduction_ops_job_runs`,
  `introduction_ops_consumer_runs`) have `FORCE RLS ENABLE` with **deny-all**
  base policies. Access is exclusively via SECURITY DEFINER RPCs.
- Every RPC starts with:
  ```sql
  perform intro_ops_assert_scope(_scope, _association_id);
  ```
  which raises `insufficient_privilege` on any mismatch.
- `GRANT EXECUTE` on RPCs is limited to `authenticated`; `service_role` for
  the recorder RPCs only.

## Mutation Surface

Only two mutations exist:

- `acknowledge_intro_ops_alert(alert_id)`
- `resolve_intro_ops_alert(alert_id)`
  Both re-derive scope from the alert row and re-check the caller.

## PII Boundary

No RPC returns node ids, user ids beyond alert actor stamps
(`acknowledged_by`, `resolved_by`), request ids, or free-text. Alert
`context` is a whitelisted set of numeric observation keys.

## Client Boundary

UI imports only `SmartIntroductionOpsSDK` and hooks in
`src/hooks/use-introduction-ops.ts`. Direct server-function or Supabase
imports from the route file are a lint-visible regression.
