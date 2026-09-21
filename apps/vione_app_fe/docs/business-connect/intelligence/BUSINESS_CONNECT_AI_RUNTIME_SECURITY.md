# BC-9.0 B3 — Runtime Security Proofs

## Threat model

BC-9.0 Intelligence exposes read-only, advisory AI capabilities over the
Business Connect graph. The runtime must resist:

| Threat                                                                        | Mitigation                                                                                                                                             | Proof                                                                                                                |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Anonymous access                                                              | `requireSupabaseAuth` middleware on every server fn + `assertViewerDerivedFromServerContext`                                                           | `bc90.security` `[anonymous denied]`, `[cross-tenant denied]`                                                        |
| Cross-tenant leakage                                                          | Viewer is derived server-side and hashed into `tenantScopeOpaque`; idempotency signature includes tenant hash                                          | `[cache/request/result isolation]`                                                                                   |
| Hidden data leakage (private notes, hidden contacts, raw inbox, raw audit)    | Structural: no tool declares an excluded source domain; runtime: envelope redaction, source-domain projection filter                                   | `[hidden meeting/follow-up denied]`, `[hidden relationship denied]`, `[hidden profile denied]`, repository-wide gate |
| Raw auth uid / tenant uid / provider secret in prompts, tools, results, audit | Redaction throws on forbidden keys; audit builder is allowlist-only                                                                                    | `[raw auth ids absent]`, `[raw tenant ids absent]`, `[provider secrets absent]`                                      |
| Internal RPC / table names in client-safe modules                             | `import.meta.glob` grep gate                                                                                                                           | `[internal rpc names absent]`, `[internal table names absent]`                                                       |
| Model-driven mutation                                                         | SDK method allowlist, tool registry `readOnly=true`, tool names must start with `list_` / `get_`                                                       | `[mutation execution impossible]`, `[mutation tool impossible]`                                                      |
| Model-driven identity spoof (impersonate, asUser, viewerId in tool input)     | Executor `BANNED_INPUT_KEYS` reject list runs before schema parse                                                                                      | `[model authority spoof rejected]`                                                                                   |
| Unknown tool call                                                             | Executor `getBusinessConnectAITool` → `unknown_tool` deny                                                                                              | `[tool authorization enforced]`                                                                                      |
| Prompt injection via context / user query                                     | Both wrapped in explicit "untrusted data" fenced blocks in `prompt-envelope.ts`                                                                        | `[injection defense]`, `[query envelope]`                                                                            |
| Fabricated citations / hallucinated ids                                       | `validateBusinessConnectAIFactuality` cross-checks every citation `sourceRef.id` against envelope refs                                                 | `factuality validator …`                                                                                             |
| PII leakage in model output                                                   | `validateBusinessConnectAIPrivacy` regex sweep for UUID / email / phone / private-note / auth markers                                                  | `privacy validator …`                                                                                                |
| Accept / reject / replay by non-owner                                         | RPC `bcai_get_owned_result` scopes to `viewer.userId`; `acceptResult`, `rejectResult`, `getOwnedResult` all called through `requireSupabaseAuth` chain | `[accept/reject/replay ownership]`                                                                                   |

## Structural invariants

1. `BUSINESS_CONNECT_AI_TOOLS` — 11 tools, all `readOnly: true`, all named
   `list_*` / `get_*`. No tool declares an excluded source domain.
2. `BUSINESS_CONNECT_AI_SDK_METHODS` — frozen 11-method allowlist; contains
   no `create|update|delete|write|send|publish` verbs.
3. Every client-safe file under `src/lib/business-connect/intelligence/**`
   contains **zero** references to `LOVABLE_API_KEY`, `bcai_claim_request`,
   `bcai_transition_request`, `bcai_requests`, or `bcai_results`.
4. `src/lib/business-connect-ai.functions.ts` names `requireSupabaseAuth` on
   every RPC (5+ occurrences enforced).
5. Audit records are constructed by `buildAuditRecord`, whose output is
   restricted to `AUDIT_ALLOWED_KEYS` and rejects any `AUDIT_FORBIDDEN_KEYS`.

## Runtime invariants

- Viewer context is derived exclusively from `context.userId` inside the
  server function handler and never accepted from the model.
- Tool inputs are pre-validated: identity fields → deny; schema mismatch →
  deny; budget exhaustion → deny.
- Facts returned to the model are projected FROM the envelope by
  `sourceDomain` in the tool's allowlist. Facts outside the allowlist are
  physically absent from the tool's response.
- Every generation path calls `redactBusinessConnectAIContext` before the
  envelope is serialised, which asserts the safe-fact shape and forbidden
  key list.

## Verification

`src/__tests__/business-connect-ai-security.bc90.test.ts` — 52 assertions
covering all rows above. Run with:

```
bunx vitest run src/__tests__/business-connect-ai-security.bc90.test.ts
```
