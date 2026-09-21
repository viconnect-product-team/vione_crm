# BC-3.0 — Implementation Runbook (Preflight Output)

Architecture Version: **Business Connect v1 (FROZEN)**. Runbook for the BC-3.1+
implementation phase. **No code/schema is shipped in BC-3.0.**

## 1. Gate decision

| Criterion                                                               | Result |
| ----------------------------------------------------------------------- | ------ |
| Legacy & global identity spaces separable (member id vs `auth.uid()`)   | ✅     |
| No dual-write / no big-bang migration required                          | ✅     |
| Reusable infra identified (auth, identity, notifications, rate limiter) | ✅     |
| RLS/privacy model participant-scoped, anon-denied                       | ✅     |
| State machine fully specified with rejected transitions                 | ✅     |
| Security test plan implementation-ready                                 | ✅     |

**Verdict: GO for BC-3.1.**

## 2. Implementation order (future phases)

1. **BC-3.1A — Schema foundation (additive). ✅ DONE.** `user_connections` +
   `user_connection_events` + `global_connection_mutations`, status/transition triggers +
   partial unique pair-key index + grants + participant RLS + SECURITY DEFINER mutation
   functions + `src/lib/global-network/` domain foundation. No UI. See
   `BC3_1A_SCHEMA_RLS_STATE_MACHINE.md`, `BC3_1A_MIGRATION_VERIFICATION.md`,
   `BC3_1A_RLS_TEST_REPORT.md`, `BC3_1A_CONCURRENCY_AND_IDEMPOTENCY.md`.
2. **BC-3.1B — Service layer. ✅ DONE.** `GlobalConnectionRepository` →
   `GlobalConnectionService` → `GlobalConnectionSDK`; `requireGlobalNetworkUser()`;
   12 authenticated server fns; `resolveRelationshipState` read adapter.
3. **BC-3.1C — Management UI. ✅ DONE.** `GlobalNetworkSDK` client façade +
   `use-global-network` hooks + `NetworkSectionView` + `/connect/network`
   (connections / incoming / sent) tabbed surface. Accept/Decline/Cancel/
   Disconnect/Block wired; privacy-safe counterpart hydration; a11y + i18n.
   Legacy Member Networking untouched. See `BC3_1C_NETWORKING_UI.md`,
   `BC3_1C_QUERY_AND_MUTATION_CONTRACT.md`,
   `BC3_1C_PRIVACY_AND_ACCESSIBILITY_REVIEW.md`.
4. **BC-3.1D — Business Profile connect integration. ✅ DONE.** Global
   networking state + lifecycle actions on the public `/b/$slug` profile via
   `ProfileConnectSDK` + `useBusinessProfileRelationship` +
   `BusinessProfileRelationshipActions`. Owner resolved server-side (Identity
   Bridge); viewer-safe DTOs; participant validation on id-based actions; SSR/
   SEO preserved. See `BC3_1D_BUSINESS_PROFILE_CONNECT.md`.
5. **BC-3.5 — Rate limiting + block + abuse controls hardening + full test suite.**

## 3. Migration & rollback

- **Additive only.** New table + triggers + policies; **zero** changes to `connections`,
  `messages`, `net_*` RPCs, `members`, or `memberships`.
- **Rollback:** drop `user_connections` + its triggers/policies/index and the new
  service module. Legacy networking is entirely unaffected because it shares no rows,
  no RPCs, and no id space.
- **No backfill.** Legacy association connections are **not** copied into `user_connections`.

## 4. Guardrails carried into implementation

- Do not replace `connections`/`net_*`.
- Do not require `current_member_id()` for global networking.
- Do not create fake member rows.
- Do not duplicate `saved_business_cards`; saved card ≠ connection.
- No messaging / followers / feed / CRM / marketplace / community.
- Never trust client `requester_user_id`.
- Do not change Association Directory or Member Networking UI.

## 5. Exit criteria for BC-3.0 (this phase)

- [x] Audit + classification of current networking (`BC3_0_GLOBAL_NETWORKING_PREFLIGHT.md`).
- [x] Domain contract + data model + source taxonomy (`BC3_0_NETWORKING_DOMAIN_CONTRACT.md`).
- [x] Legacy↔global read adapter design (`BC3_0_LEGACY_GLOBAL_ADAPTER.md`).
- [x] RLS & privacy matrix (`BC3_0_RLS_AND_PRIVACY_MATRIX.md`).
- [x] Connection state machine (`BC3_0_CONNECTION_STATE_MACHINE.md`).
- [x] Security & abuse test plan (`BC3_0_SECURITY_TEST_PLAN.md`).
- [x] Runbook + gate (this document).

**STOP after BC-3.0.** No implementation until the gate is accepted.
