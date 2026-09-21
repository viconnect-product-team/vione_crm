# BC Enterprise Risk Register (FROZEN — BC-0.5)

Documentation-only. Consolidates R1–R18 from `BC0_BLOCKERS_AND_RISKS.md` and
SEC-01…09 from `BC0_SECURITY_BACKLOG.md` into one enterprise register.
L = Likelihood, I = Impact (Low/Med/High). Target = phase where mitigated.

| ID        | Category        | Risk                                                | L    | I        | Mitigation                                              | Owner        | Target     |
| --------- | --------------- | --------------------------------------------------- | ---- | -------- | ------------------------------------------------------- | ------------ | ---------- |
| E-ARCH-1  | Architecture    | Business logic leaks into Platform Core             | Med  | High     | Gate A review; dependency-direction check per phase     | Architecture | All        |
| E-ARCH-2  | Architecture    | Split domains re-merge (Networking/AI/Notif/Search) | Med  | Med      | Enforce infra/composition split in review               | Architecture | BC-4/BC-9  |
| E-ID-1    | Identity        | Non-member login blocked by member-required flows   | High | High     | BC-1 global identity + helpers before feature work      | Identity     | BC-1       |
| E-ID-2    | Identity        | Fake `members`/fake identity created as shortcut    | Med  | High     | Contract invariants; code review; no-fake tests         | Identity     | BC-1       |
| E-MIG-1   | Migration       | Non-additive/rename breaks `/app` or `/m`           | Med  | High     | MIGRATION_GUIDELINES; Gate D rollback rehearsal         | Eng          | All        |
| E-MIG-2   | Migration       | Card ownership backfill ambiguity                   | High | Med      | Backfill unique valid mappings only; report rest        | Eng          | BC-2       |
| E-SEC-1   | Security/Public | Raw anon SELECT on card tables (SEC-01)             | High | Critical | RPC projection parity, then remove anon policy          | Security     | BC-11      |
| E-SEC-2   | Security        | Saved-card / connection privacy leakage             | Med  | High     | Owner-only RLS + tests                                  | Security     | BC-3/BC-4  |
| E-RLS-1   | RLS             | Cross-scope role bleed (assoc/community/platform)   | Med  | High     | Distinct role tables + has_role guards; isolation tests | Security     | BC-6       |
| E-RLS-2   | RLS             | Missing GRANT/POLICY on new table                   | Med  | High     | Migration checklist; re-read SQL before submit          | Eng          | All        |
| E-PERF-1  | Performance     | Missing indexes on new FKs / global directory scans | Med  | Med      | Index rule in guidelines; load smoke at Gate F          | Eng          | BC-4/BC-11 |
| E-PUB-1   | Public Data     | Public projection exposes PII/private fields        | Med  | High     | Explicit column projection; parity review               | Security     | BC-2/BC-11 |
| E-AI-1    | AI              | Persona permission bleed / fallback masked          | Med  | Med      | Persona isolation + audit tagging (`ai_request_audit`)  | AI/Security  | BC-9       |
| E-STO-1   | Storage         | Public/anon buckets or unvalidated paths            | Low  | High     | No anon buckets; path validation                        | Security     | BC-8/BC-10 |
| E-TEST-1  | Testing         | a11y/RLS regressions slip to prod                   | Med  | Med      | CI a11y+security gates; regression suite per phase      | Eng          | All        |
| E-OPS-1   | Operations      | No rehearsed rollback / no monitoring at pilot      | Med  | High     | Rollback runbook + alerts required at Gate F            | Ops          | BC-5+      |
| E-COM-1   | Architecture    | Community drifts into an Association clone          | Med  | Med      | Distinct roles/membership; boundary review              | Architecture | BC-6/BC-8  |
| E-ROUTE-1 | Architecture    | `/connect` `/community` namespace collision         | Low  | Med      | Reserved namespaces frozen; created only in BC-5/BC-8   | Eng          | BC-5/BC-8  |

## Top pre-BC-1 blockers (carried)

- **E-SEC-1** confirm public-card RPC output parity before scheduling anon removal.
- **E-MIG-2** approve "unique valid mapping only" backfill policy.
- **E-ID-1** BC-1 global identity is a hard prerequisite for BC-2+.

## BC-2.0 update — Card Ownership Preflight (2026-07-13)

- **E-MIG-2 (backfill ambiguity):** downgraded to L=Low for current data —
  preflight measured **0 cards** (0 eligible, 0 blocking). Classifier
  (`sql/business-card-ownership-preflight.sql`) is the standing gate; re-run
  before BC-2.1. Category A only is ever backfilled; C/D/E block.
- **E-PUB-1 (public projection):** parity confirmed P0/P1-free —
  `getPublicBusinessCardFn` field set matches the public route; public path keys
  on slug/status/public_mode, ownership-agnostic. No anon policy removed.
- **New — E-MIG-3 (owner-reassignment):** client-set owner mitigated by
  `WITH CHECK (owner_user_id = auth.uid())`; L=Low I=High; Target BC-2.1.
- **New — E-SEQ-1 (global-card nullability):** global cards need
  `member_id`/`association_id` nullable — deferred beyond BC-2.1; cards stay
  NOT NULL until then. L=Low I=Med; Target BC-2.x.
- **New — E-ROLL-1 (rollback isolation):** `bc_ownership_migration_runs` marker
  - `owner_user_id = r.owner_user_id` predicate preserves manual remediation.
    L=Low I=High; Target BC-2.1.
- **E-MIG-2 CLOSED for BC-2.1B:** deterministic backfill shipped as
  `run_business_card_ownership_backfill`; category-A only, exact row-count
  assertion aborts on drift, `owner_user_id IS NULL` no-overwrite guard.
  Production no-op (0 cards). Fixture rehearsal confirmed A eligible; B/C/D/E
  skipped.
- **E-ROLL-1 CLOSED for BC-2.1B:** rollback isolates migration-owned unchanged
  assignments via `_items` tracker (`current = assigned` predicate); manual
  reassignments preserved (tested). Not auto-executed in production.

## BC-4.0 risks (Business Meetings)

- **R-MTG-1 (open):** reschedule race → mitigated by immutable versioned
  proposals + `MEETING_STALE_VERSION` + row-locked RPCs.
- **R-MTG-2 (open):** privacy leakage of notes/URL/hidden contact via
  notifications → mitigated by privacy-safe payload contract (no notes/URL by
  default).
- **R-MTG-3 (open):** domain drift into CRM/chat/calendar → mitigated by frozen
  boundary matrix delta; follow-ups owner-only, no shared tasks.
- **R-MTG-4 (open):** naive timezone handling → mitigated by UTC + IANA contract.
- **R-MTG-5 (deferred):** external calendar sync corruption → deferred beyond
  MVP; meeting remains source of truth, tokens in integration boundary.
