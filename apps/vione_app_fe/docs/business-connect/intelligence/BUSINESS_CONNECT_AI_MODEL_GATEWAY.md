# Business Connect AI — Model Gateway (BC-9.0 B1)

The gateway policy layer is a pure module:
`src/lib/business-connect/intelligence/runtime/model-gateway.ts`.

## Selection algorithm

`selectProvider(capability, providerHealth[])`:

1. Load the capability's `BUSINESS_CONNECT_AI_MODEL_POLICY` from Turn A —
   an ordered preference list of model policy classes.
2. Walk the list in order. For each class, find healthy providers.
3. Skip any class whose healthy providers do **not** support structured
   output (all BC-9.0 capabilities require structured output).
4. Return the first eligible provider or an `"unavailable"` decision.

## Private-first invariant

Capabilities whose `BUSINESS_CONNECT_AI_MODEL_POLICY` does **not** include
`cloud_general` never fall back to a general-purpose public model, even when
`cloud_general` is the only healthy option. In that case `selectProvider`
returns `{ outcome: "unavailable", reason: "policy_forbidden_public" }` and
the SDK surfaces `BUSINESS_CONNECT_AI_PROVIDER_UNAVAILABLE`.

This is tested in `business-connect-ai-persistence.bc90.test.ts`:

> `private-only capability rejects cloud_general even when it is the only healthy option`

## Structured-output gate

Any capability that expects Zod-schema payloads is skipped for a provider
class that lacks structured-output support. This prevents shipping
free-text responses through the JSON validator on Turn B2.

## Reuse of existing gateway

Turn B2 will wire this decision into the existing Lovable AI Gateway helper
(`ai-sdk-lovable-gateway` knowledge). B1 does not import the AI SDK — the
policy module is provider-agnostic so it can be unit-tested and reused.

## Errors

Stable error contract via `BusinessConnectAIError`:

- `BUSINESS_CONNECT_AI_PROVIDER_UNAVAILABLE` — no healthy eligible provider.
- `BUSINESS_CONNECT_AI_TIMEOUT` — request exceeded `REQUEST_TIMEOUT_MS[cap]`
  (Turn B2 enforcement).
- `BUSINESS_CONNECT_AI_CONTEXT_TOO_LARGE` — envelope exceeded
  `MAX_CONTEXT_ENVELOPE_CHARS`.
