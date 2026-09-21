# PLATFORM BASELINE MANIFEST — v1.0

**Document ID:** PBM-1.0
**Type:** Immutable engineering baseline snapshot (documentation only)
**Captured after:** Gate A — Architecture Approved
**Captured before:** BC-1 (Global Identity) implementation
**Rule:** No code, no migration, no DB change. Every metric below is read directly from the current repository. Anything not measurable from the repo is marked **Not Measured**.

---

## 1. Platform Identity

| Field                | Value                                           |
| -------------------- | ----------------------------------------------- |
| Platform Name        | ViOne AI Business Platform (Business Connect)  |
| Architecture Version | Business Connect v1 Architecture                |
| Baseline Version     | PBM-1.0                                         |
| Release Name         | ViOne Platform — BC-0 Baseline                 |
| Architecture Status  | Frozen (BC-0.5)                                 |
| Gate Status          | Gate A — Architecture Approved (2026-07-13)     |
| Date                 | 2026-07-13                                      |
| Git Branch           | `edit/edt-be8b109e-9b37-43c5-bce6-36c16277049a` |
| Git Commit SHA       | `611afd55527b2b26b9488415e49594140bc18e4f`      |
| Git Tag              | Not Measured (no tag present)                   |
| Repository Root      | `/dev-server`                                   |

---

## 2. Repository Snapshot

**Top-level folders:** `src`, `docs`, `scripts`, `supabase`, `public`, `node_modules` + config (`package.json`, `vite.config.ts`, `nitro.config.ts`, `wrangler.jsonc`, `tsconfig.json`, `components.json`, `Dockerfile`, `docker-compose.yml`).

**Source tree (`src/`):** `__tests__`, `assets`, `components` (checkin, dashboard, landing, member, platform, ui), `hooks`, `integrations` (lovable, supabase), `lib` (associations, member-account, member-app, member-identity-pass), `routes`.

| Metric                                     | Count                                                                         |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| Source files (`.ts`/`.tsx`)                | 365                                                                           |
| Components (`.tsx` under `components/`)    | 109                                                                           |
| Hooks                                      | 9                                                                             |
| Routes (files under `src/routes/`)         | 81                                                                            |
| Layout routes                              | `__root.tsx`, `m.tsx` (+ dynamic segment layouts)                             |
| Providers                                  | Root providers in `__root.tsx` / `router.tsx` (QueryClient, Router, Supabase) |
| Shared libraries (`src/lib/` files)        | 137                                                                           |
| Server-function modules (`*.functions.ts`) | 59                                                                            |
| Server-only modules (`*.server.ts`)        | 7                                                                             |
| Utilities                                  | Included in `src/lib` (137)                                                   |
| Test files                                 | 27                                                                            |
| Generated files                            | `routeTree.gen.ts`, `integrations/supabase/types.ts`                          |
| Migration files                            | 98                                                                            |
| BC-0 docs                                  | 35 (`docs/business-connect/`)                                                 |

---

## 3. Database Snapshot

| Metric                      | Value                                                                          |
| --------------------------- | ------------------------------------------------------------------------------ |
| Migration files             | 98                                                                             |
| Tables (public)             | 54                                                                             |
| RLS-enabled tables          | 54 (100%)                                                                      |
| Enums                       | 1 (`app_role`)                                                                 |
| Views                       | 0                                                                              |
| Functions (public)          | 34                                                                             |
| SECURITY DEFINER functions  | 28                                                                             |
| Triggers (non-internal)     | 48                                                                             |
| Indexes (public)            | 134                                                                            |
| Policies (public)           | 180                                                                            |
| — anon policies             | 6                                                                              |
| — authenticated policies    | 179                                                                            |
| Storage buckets             | 2 (`product-media`, `association-logos`)                                       |
| Storage policies            | 8                                                                              |
| Extensions                  | 5 (`plpgsql`, `pgcrypto`, `uuid-ossp`, `pg_stat_statements`, `supabase_vault`) |
| pgvector                    | Not installed                                                                  |
| Realtime publication tables | 5 (`quote_requests`, `connections`, `messages`, `attendees`, `checkin_logs`)   |

---

## 4. Identity Snapshot

**Current identity model (tables):** `auth.users` → `profiles`, `members`, `member_identity_passes`, `member_business_cards`, `card_settings`, `user_roles`, `bc_admin_grants`.

**Identity helper inventory (SECURITY DEFINER, public schema):**
`current_member_id`, `current_association_id`, `set_active_association`, `is_member_of`, `has_role`, `has_assoc_role`, `is_assoc_manager`, `is_platform_admin`, `bc_admin_level`, `my_bc_admin_level`, `owns_business_card`, `manages_business_card`, `is_public_business_card`, `link_my_member_profile`, `unlink_my_member_profile`, `list_my_linkable_members`, `handle_new_user`, `set_member_code`.

**Server-side auth primitives:** `requireSupabaseAuth` (middleware), `attachSupabaseAuth` (client bearer), `current-member.functions.ts` (member resolution).

**Baseline note:** Identity is still coupled to `members` rows (BC-0.1 blocker). BC-1 introduces the additive Platform User / `user_profiles` separation per ADR-BC-001/002.

---

## 5. Platform Domains

| Domain                       | Status                                           |
| ---------------------------- | ------------------------------------------------ |
| Association                  | Implemented                                      |
| Business Card                | Implemented                                      |
| Networking                   | Implemented                                      |
| Marketplace                  | Implemented                                      |
| Companies                    | Implemented                                      |
| Meetings                     | Implemented                                      |
| Campaigns / Email Marketing  | Implemented                                      |
| Notifications                | Implemented                                      |
| Documents                    | Implemented                                      |
| Fees / Finance               | Implemented                                      |
| Events (+ tickets, check-in) | Implemented                                      |
| AI Assistant                 | Implemented (real provider enabled)              |
| Membership Identity (passes) | Implemented                                      |
| QR                           | Implemented                                      |
| NFC                          | Partial (scanner hook present; device-dependent) |
| Verification                 | Implemented (`/verify`)                          |
| Wallet (Apple/Google)        | Architecture only (deferred post-v1)             |
| Payment gateway (renewals)   | Partial (status tracking; live gateway deferred) |

---

## 6. Shared Service Inventory

Shared business services live in `src/lib/*.functions.ts` (59 modules). Representative set:

| Service                                          | Purpose                            | Consumers                 | Dependencies               | Status      |
| ------------------------------------------------ | ---------------------------------- | ------------------------- | -------------------------- | ----------- |
| `business-card.functions`                        | Card CRUD, publish, primary, leads | Member PWA, Admin, Public | Supabase RLS, audit fn     | Implemented |
| `business-card-admin.functions`                  | Admin card governance + audit      | Admin surfaces            | `bc_admin_grants`, audit   | Implemented |
| `events.functions`                               | Event + ticket lifecycle           | Events, Check-in          | Realtime, QR               | Implemented |
| `checkin.functions` / `member-checkin.functions` | QR/NFC check-in                    | Check-in surfaces         | Realtime                   | Implemented |
| `ai.functions` / `ai-audit.functions`            | Gateway chat + audit               | `/ai`, platform           | AI Gateway, `app_settings` | Implemented |
| `associations/*.functions`                       | Branding, domain, logo, membership | Admin, public             | Storage, RLS               | Implemented |
| `member-app/*.functions`                         | Member PWA surfaces (12 modules)   | Member PWA                | Members, RLS               | Implemented |
| `renewals.functions`                             | Renewal + reminders                | Renewal flow              | Invoices                   | Partial     |
| `networking.functions`                           | Peer connections                   | Network                   | `net_*` RPCs               | Implemented |
| `member-identity-pass/*.functions`               | Passes, verify                     | Wallet/verify             | Passes table               | Implemented |

Full list: 59 `.functions.ts` modules + 7 `.server.ts` privileged helpers.

---

## 7. Product Surface Inventory

**Total routes: 81.** Surfaces:

| Surface           | Namespace                                                         | Notes                                               |
| ----------------- | ----------------------------------------------------------------- | --------------------------------------------------- |
| Association Admin | `/` desktop routes                                                | members, events, fees, finance, sponsors, marketing |
| Member PWA        | `/m.*` (26 routes)                                                | mobile-first native-feel                            |
| Public Web        | `/landing`, `/demo`, `/install`                                   | acquisition                                         |
| Business Card     | `/business-cards`, `/m.business-cards`, `/card.$code`, `/b.$slug` | user + public                                       |
| Verify            | `/verify`                                                         | pass verification                                   |
| AI                | `/ai`, `/platform.ai-audit`                                       | assistant + audit                                   |
| Marketplace       | `/marketplace.*`                                                  | products, quotes, workspace                         |
| Companies         | `/companies`, `/companies.$companyId`                             | directory                                           |
| Meetings          | `/meetings`                                                       | scheduling                                          |
| Platform Admin    | `/platform.*`                                                     | admins, permissions, audit, ai-audit                |

---

## 8. Security Snapshot

| Metric                            | Value                                                                       |
| --------------------------------- | --------------------------------------------------------------------------- |
| RLS-enabled tables                | 54 / 54                                                                     |
| Public (anon-accessible) policies | 6                                                                           |
| Authenticated policies            | 179                                                                         |
| SECURITY DEFINER functions        | 28                                                                          |
| Service-role usage                | `*.server.ts` (7 modules) + `client.server.ts`                              |
| Admin-client functions            | `business-card-admin`, `ai` runtime override reads, platform admin          |
| Accepted warnings                 | Anon SELECT limited to public projections (cards/landing) per ADR-BC-005    |
| Deferred risks                    | E-\* risk IDs in `BC0_BLOCKERS_AND_RISKS.md`; live payment gateway deferred |

No raw `anon` grants on business tables; public exposure via vetted policies/RPC only.

---

## 9. Testing Snapshot

| Layer               | Status                                                                             |
| ------------------- | ---------------------------------------------------------------------------------- |
| Typecheck           | Not Measured (run by harness at build)                                             |
| Unit                | Present (`fees-calc`, `renewals-calc`, `review-search`, `ai-*`, identity)          |
| Integration / RLS   | Present (`multi-tenant-rls`, `rls-ownership`, `rls-anon-exposure`, `rls-realtime`) |
| E2E                 | Present (wizard flow, scoping, networking, company history)                        |
| Accessibility (axe) | Present (notifications, events, members, messages, event-wizard)                   |
| Security            | Present (`security-hardening`, `api-auth-guardrails`)                              |
| Coverage %          | Not Measured                                                                       |
| Test files total    | 27                                                                                 |
| Known failures      | Not Measured                                                                       |
| Known exclusions    | E2E requiring signed-in session run partially in CI                                |

---

## 10. Performance Snapshot

| Metric              | Value                                                  |
| ------------------- | ------------------------------------------------------ |
| Bundle size         | Not Measured                                           |
| Largest routes      | Not Measured                                           |
| Largest chunks      | Not Measured                                           |
| Realtime channels   | 5 tables published                                     |
| Known polling       | `use-unread-notifications`, `use-session-status`       |
| Promise.all usage   | Present in loaders/functions (Not quantified)          |
| Known N+1 risks     | Audit-log name resolution (mitigated by batch lookups) |
| Known optimizations | TanStack Query loader prefetch; indexes (134)          |

---

## 11. AI Snapshot

| Aspect        | Value                                                                           |
| ------------- | ------------------------------------------------------------------------------- |
| Gateway       | Lovable AI Gateway                                                              |
| Providers     | Real provider enabled (`google/gemini-3-flash-preview`); mock fallback          |
| Capabilities  | Chat assistant, audit trail                                                     |
| Memory        | `ai-session-memory` (tested)                                                    |
| Workflow      | `ai-workflows` (tested)                                                         |
| Knowledge     | `ai-context-builder` (tested)                                                   |
| Prompt system | Persona-based (per BC-0.4: three personas, one gateway)                         |
| Tool registry | `ai-tools` (tested)                                                             |
| Streaming     | Not Measured                                                                    |
| Guardrails    | `ai-gateway-security` (tested); `ai_request_audit`, provider/fallback UI status |

---

## 12. Platform Metrics (baseline counts)

| Metric                  | Count                                                    |
| ----------------------- | -------------------------------------------------------- |
| Tables                  | 54                                                       |
| Routes                  | 81                                                       |
| Components              | 109                                                      |
| Hooks                   | 9                                                        |
| Server-function modules | 59                                                       |
| RPC / DB functions      | 34 (28 SECURITY DEFINER)                                 |
| Shared services         | 59 modules                                               |
| AI capabilities         | 6 (chat, memory, workflow, knowledge, tools, guardrails) |
| Themes                  | 1 (semantic-token design system)                         |
| Storage buckets         | 2                                                        |
| Policies                | 180                                                      |
| Tests                   | 27                                                       |
| Migrations              | 98                                                       |

---

## 13. Known Technical Debt (accepted)

- **Architecture:** Identity coupled to `members` (resolved in BC-1).
- **Security:** Live payment gateway deferred; anon public projections must stay whitelist-only.
- **Performance:** Bundle/route sizing not yet measured; polling on 2 hooks.
- **Testing:** Coverage % not measured; session-gated E2E partial in CI.
- **Migration:** 98 migrations — additive only; no squash performed (intentional).
- **Deferred BC phases:** Wallet (post-v1); BC-2…BC-11 not started.

---

## 14. Architecture Freeze Confirmation

| Item                 | Frozen | Source                                     |
| -------------------- | ------ | ------------------------------------------ |
| Architecture         | ✅     | PLATFORM_ARCHITECTURE_FREEZE (BC-0.5)      |
| Identity             | ✅     | GLOBAL_IDENTITY_CONTRACT (BC-0.2)          |
| Scope                | ✅     | RESOURCE_SCOPE_MATRIX (BC-0.4)             |
| Capability           | ✅     | PLATFORM_CAPABILITY_MATRIX (BC-0.5)        |
| Migration strategy   | ✅     | MIGRATION_GUIDELINES                       |
| Engineering playbook | ✅     | BC0_PLATFORM_ENGINEERING_PLAYBOOK (BC-0.6) |

---

## 15. Platform Health Score

Scale 1–10.

| Dimension                  | Score   | Rationale                                                                       |
| -------------------------- | ------- | ------------------------------------------------------------------------------- |
| Architecture               | 9       | Fully frozen, 10 ADRs, layered contract; identity refactor still pending        |
| Security                   | 8       | 100% RLS, 180 policies, only 6 anon; live payment path deferred                 |
| Maintainability            | 8       | Clear layering, 59 focused service modules; 137 lib files need periodic pruning |
| Testability                | 7       | 27 tests across all layers incl. a11y/RLS; coverage % unmeasured                |
| Performance                | 6       | Indexed + query-loader design; no bundle/perf measurement yet                   |
| Scalability                | 8       | Scope model + realtime + additive migrations; single theme/tenant paths mature  |
| Developer Experience       | 8       | i18n/a11y/build gates, playbook, gen-routes; strict build enforced              |
| AI Readiness               | 8       | Real provider live, audited, tested guardrails; streaming unverified            |
| Business Connect Readiness | 7       | Gate A signed, architecture frozen; BC-1 identity work not begun                |
| **Overall**                | **7.7** | Strong, well-governed baseline ready to enter BC-1                              |

---

## 16. Future Comparison Keys (immutable)

PBM-1.1 / PBM-2.0 / PBM-3.0 MUST compare against these baseline values:

```
tables=54  routes=81  components=109  hooks=9
server_fn_modules=59  db_functions=34  secdef=28
policies=180  anon_policies=6  authed_policies=179
rls_tables=54  indexes=134  triggers=48  enums=1  views=0
migrations=98  tests=27  storage_buckets=2  storage_policies=8
realtime_tables=5  extensions=5  pgvector=absent
overall_health=7.7  architecture=Business Connect v1
commit=611afd55527b2b26b9488415e49594140bc18e4f
```

---

## 17. Deliverables

Created alongside this manifest:

- `PLATFORM_BASELINE_MANIFEST_v1.0.md` (this file)
- `PLATFORM_HEALTH_REPORT.md`
- `PLATFORM_METRICS_BASELINE.md`
- `PLATFORM_TECH_DEBT_REGISTER.md`
- `PLATFORM_RELEASE_BASELINE.md`

---

## Acceptance

Pure documentation. No implementation, no inferred data. Every metric read from the current repository; unavailable metrics marked **Not Measured**. Stop after PBM-1.0.

**Return summary**

- Platform Baseline Version: **PBM-1.0**
- Architecture Version: **Business Connect v1**
- Health Score: **7.7 / 10**
- Business Connect Readiness: **7 / 10 (Gate A signed, ready for BC-1)**
- Recommended next phase: **BC-1 — Global Identity**

## PBM delta log

- **BC-4.0 (preflight):** Business Meetings & Follow-up domain designed and
  validated. Gate: **CONDITIONAL GO** (external calendar sync + shared notes
  deferred; no privacy/state-machine/timezone blocker). No schema/UI shipped.
  Deliverables: BC4_0_MEETINGS_PREFLIGHT, MEETING_DOMAIN_CONTRACT, STATE_MACHINE,
  PARTICIPANT_AND_PRIVACY_MODEL, FOLLOWUP_MODEL, TIMEZONE_AND_CALENDAR_CONTRACT,
  NOTIFICATION_AND_REMINDER_CONTRACT, SECURITY_TEST_PLAN, IMPLEMENTATION_RUNBOOK.
  Next: BC-4.1A (schema/RLS/state machine/proposal versioning) after approvals.
