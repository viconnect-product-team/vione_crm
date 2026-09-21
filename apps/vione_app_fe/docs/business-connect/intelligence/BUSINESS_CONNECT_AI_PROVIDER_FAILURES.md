# BC-9.0 B3 — Provider Failure Matrix

Every provider failure surfaces as a typed `BusinessConnectAIError` whose
`code` is in the frozen `BUSINESS_CONNECT_AI_ERROR_CODES` contract. The
runtime never retries destructive operations; only 429 / 5xx are retryable
with backoff, and only for the generation call itself.

## Selection layer (`selectProvider`)

Deterministic priority: `local_private → cloud_private → cloud_general`,
gated by the capability's `BUSINESS_CONNECT_AI_MODEL_POLICY`. Verified
outcomes:

| Scenario                                                  | Outcome                                                 | Test                         |
| --------------------------------------------------------- | ------------------------------------------------------- | ---------------------------- |
| No healthy provider                                       | `unavailable / no_healthy_provider`                     | `[unsupported provider]`     |
| Healthy provider lacks structured output                  | `unavailable / structured_output_unsupported` (or skip) | `[schema failure surrogate]` |
| Only `cloud_general` healthy, capability disallows public | `unavailable / policy_forbidden_public`                 | `[policy forbidden]`         |
| `LOVABLE_API_KEY` missing on server                       | Throws `PROVIDER_UNAVAILABLE` inside gateway build      | `[unavailable provider]`     |

## Execution layer

| Failure                                          | Emitted code                               | Behaviour                                       |
| ------------------------------------------------ | ------------------------------------------ | ----------------------------------------------- |
| Provider 429                                     | `BUSINESS_CONNECT_AI_RATE_LIMITED`         | Surfaced to user; caller may retry with backoff |
| Provider 5xx                                     | `BUSINESS_CONNECT_AI_PROVIDER_UNAVAILABLE` | Same                                            |
| Wall-clock exceeded / provider timeout           | `BUSINESS_CONNECT_AI_TIMEOUT`              | Request transitions to `failed` with code       |
| Malformed / no-object model response             | `BUSINESS_CONNECT_AI_INVALID_RESPONSE`     | One repair retry then fail                      |
| Tool call denied / errored                       | `BUSINESS_CONNECT_AI_TOOL_FAILED`          | Loop terminates; recorded in audit              |
| Context serialise > `MAX_CONTEXT_ENVELOPE_CHARS` | `BUSINESS_CONNECT_AI_CONTEXT_TOO_LARGE`    | Request rejected before provider call           |
| Result row stale after generation                | `BUSINESS_CONNECT_AI_RESULT_STALE`         | Regeneration triggered on next fetch            |
| Anything else                                    | `BUSINESS_CONNECT_AI_INTERNAL_ERROR`       | Persisted; not surfaced verbatim to the user    |

## Non-terminal → terminal boundary

- Only 429 and 5xx are retryable. Every 4xx (bad model, unsupported field,
  schema-rejected input, context too large) is terminal — the runtime
  never rewrites the request and re-submits.
- On terminal failure the row transitions `running -> failed` with the
  typed `error_code`; the SDK surfaces the code to the UI so the surface
  can render the correct message. Providers' raw error text is not
  returned to the client.

## Verification

`business-connect-ai-security.bc90.test.ts` — `provider failure matrix`
section proves:

- Every failure surface has a code in the frozen error contract.
- `buildBusinessConnectAIGateway` throws `BusinessConnectAIError` with a
  typed code when the API key is missing.
- `selectProvider` returns the expected outcome for each health matrix.
