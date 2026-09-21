# Business Connect AI — Audit & Metering (BC-9.0 B1)

Audit rows record how a capability ran; they never carry raw context,
private-note content, prompts, secrets, or auth material.

## Allowed keys (`buildAuditRecord`)

```
capability, scopeType, modelPolicyClass, providerId, modelId,
promptVersion, policyVersion, latencyMs, tokensPrompt, tokensCompletion,
cacheHit, status, errorCode
```

Anything else is dropped by the allowlist projection.

## Forbidden keys (`AUDIT_FORBIDDEN_KEYS`)

```
prompt, context, contextEnvelope, safeFacts, privateNotes, private_note,
rawResponse, raw_context, apiKey, authorization, bearer, secret,
password, email, phone
```

If any of these appear in the shaped audit record `buildAuditRecord`
throws. The server-side `recordResult` wrapper double-checks the shaped
object before persisting.

## Where audit data lives

- Request-level: on `business_connect_ai_requests` (provider_id, model_id,
  latency_ms, actual_cost_millicents, estimated_cost_millicents, cache_hit,
  status, error_code, prompt/policy version, model policy class).
- Result-level: `meta.audit` on `business_connect_ai_results`.
- Tool-level: `business_connect_ai_tool_invocations` with `shapeToolSummary`
  applied before persistence (allowlist over counts / labels / status
  flags, no strings > 200 chars).

## Metering read model

Server-side analytics jobs (service role) may aggregate these tables. RLS
does not permit users to read other users' rows, so all cross-user
aggregation must be done via `service_role` or SECURITY DEFINER views
(introduced in Turn C when analytics UI ships).

## Private-notes exclusion

`business_meeting_private_notes` is never a source domain for intelligence
context (Turn A). B1 audit shaping never surfaces private-note fields.
Turn B2 tools will not include a private-notes read tool.
