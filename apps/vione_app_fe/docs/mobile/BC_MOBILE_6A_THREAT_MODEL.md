# BC-Mobile-6A — Threat Model

| Threat | Mitigation |
|---|---|
| Cross-viewer data access | Every data port receives the server-verified viewer id; person-detail path is fail-closed (accepted pair / owned edge only). Test: cross-viewer boundary + fail-closed suites. |
| Private content leaks into DTO/AI | Evidence = timestamps only; person projection = public summaries; AI payload = numbers + locale (no name/id/free text by construction). Test: DTO forbidden-keys scan + prompt-payload shape test. |
| AI hallucination | Strict JSON schema; grounding rejects numbers not in the supplied signal set, URLs, HTML, markdown. Rejection ⇒ deterministic i18n template. Test: grounding suite. |
| Prompt injection | Model input contains no attacker-controlled text (numbers + locale only). Model output is parsed as strict JSON and validated before display — treated as data, never rendered as HTML. |
| AI availability/abuse | 5s timeout; any failure ⇒ fallback; AI never affects selection/ranking. No user-facing error path depends on the gateway. |
| Enumeration via person endpoint | Invalid/unauthorized personId ⇒ ONE neutral `{ recommendation: null }`; no port is touched before parse; no error differentiation. |
| Dismissal tampering | Owner-scoped table, RLS, upsert by (owner, person, type); server actor from `requireSupabaseAuth`, never client input. |
| Telemetry PII | Allowlisted metric names, count/surface/reason fields only. |
