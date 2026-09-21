# PLATFORM METRICS BASELINE — PBM-1.0

**Snapshot:** 2026-07-13 · **Commit:** `611afd55527b2b26b9488415e49594140bc18e4f`
All values read directly from the repository and database. These are the **immutable comparison keys** for PBM-1.1 / PBM-2.0 / PBM-3.0.

## Codebase

| Metric                                     | Value |
| ------------------------------------------ | ----- |
| Source files (.ts/.tsx)                    | 365   |
| Components                                 | 109   |
| Hooks                                      | 9     |
| Routes                                     | 81    |
| Server-function modules (`*.functions.ts`) | 59    |
| Server-only modules (`*.server.ts`)        | 7     |
| Lib files                                  | 137   |
| Test files                                 | 27    |
| Runtime dependencies                       | 61    |
| Dev dependencies                           | 27    |

## Database

| Metric                     | Value  |
| -------------------------- | ------ |
| Migrations                 | 98     |
| Tables (public)            | 54     |
| RLS-enabled tables         | 54     |
| Enums                      | 1      |
| Views                      | 0      |
| DB functions               | 34     |
| SECURITY DEFINER functions | 28     |
| Triggers (non-internal)    | 48     |
| Indexes                    | 134    |
| Policies                   | 180    |
| Anon policies              | 6      |
| Authenticated policies     | 179    |
| Extensions                 | 5      |
| pgvector                   | absent |

## Storage & Realtime

| Metric           | Value                                                                        |
| ---------------- | ---------------------------------------------------------------------------- |
| Storage buckets  | 2 (`product-media`, `association-logos`)                                     |
| Storage policies | 8                                                                            |
| Realtime tables  | 5 (`quote_requests`, `connections`, `messages`, `attendees`, `checkin_logs`) |

## Domains & AI

| Metric                    | Value                                      |
| ------------------------- | ------------------------------------------ |
| Domains total             | 18                                         |
| Domains implemented       | 14                                         |
| Domains partial           | 3 (NFC, renewals payment, wallet-adjacent) |
| Domains architecture-only | 1 (Wallet)                                 |
| AI capabilities           | 6                                          |
| AI providers              | 1 real + mock fallback                     |
| Themes                    | 1                                          |

## Governance docs

| Metric         | Value               |
| -------------- | ------------------- |
| BC-0 documents | 35                  |
| ADRs           | 10 (ADR-BC-001…010) |
| Gates defined  | 7 (A–G)             |
| Phases planned | 11 (BC-1…BC-11)     |

## Machine-readable baseline block

```json
{
  "baseline": "PBM-1.0",
  "commit": "611afd55527b2b26b9488415e49594140bc18e4f",
  "source_files": 365,
  "components": 109,
  "hooks": 9,
  "routes": 81,
  "server_fn_modules": 59,
  "server_only_modules": 7,
  "lib_files": 137,
  "tests": 27,
  "migrations": 98,
  "tables": 54,
  "rls_tables": 54,
  "enums": 1,
  "views": 0,
  "db_functions": 34,
  "secdef_functions": 28,
  "triggers": 48,
  "indexes": 134,
  "policies": 180,
  "anon_policies": 6,
  "authed_policies": 179,
  "extensions": 5,
  "pgvector": false,
  "storage_buckets": 2,
  "storage_policies": 8,
  "realtime_tables": 5,
  "domains_total": 18,
  "domains_implemented": 14,
  "ai_capabilities": 6,
  "overall_health": 7.7,
  "architecture": "Business Connect v1"
}
```

Not Measured (require tooling not run at baseline): typecheck pass/fail, coverage %, bundle size, chunk sizes, runtime latency.

## BC-2.1A delta (2026-07-13)

Additive only — no cutover:

- `member_business_cards`: +1 nullable column `owner_user_id` (FK auth.users, ON DELETE SET NULL).
- +4 indexes (`mbc_owner_idx`, `mbc_owner_status_idx`, `mbc_owner_assoc_idx`, `mbc_pub_slug_status_idx`).
- Policies unchanged (legacy authoritative). Global ownership not active.

## BC-2.1B delta (2026-07-13)

Additive tracking + tooling — no cutover:

- +2 tables: `business_card_ownership_backfill_runs`, `business_card_ownership_backfill_items` (platform-admin read RLS).
- +2 functions: `run_business_card_ownership_backfill(text)`, `rollback_business_card_ownership_backfill(uuid)` (SECURITY DEFINER, PUBLIC execute revoked).
- +2 indexes on item tracker (`bcobi_run_idx`, `bcobi_card_idx`).
- Backfill counters (production): eligible=0, updated=0, skipped=0, exceptions=0.
- Card policies unchanged; global ownership still inactive.
