# Architecture Decision Index (FROZEN — BC-0.5)

Documentation-only. Canonical index of every frozen decision and its source doc.

## ADRs

| ADR        | Title                  | Decision (one line)                                            |
| ---------- | ---------------------- | -------------------------------------------------------------- |
| ADR-BC-001 | User/Member Separation | Platform User (`auth.uid()`) ≠ Association Member (`members`). |
| ADR-BC-002 | Global Identity        | Additive `user_profiles`; platform-level data only.            |
| ADR-BC-003 | Identity Compatibility | Staged, additive transition; legacy + global coexist.          |
| ADR-BC-004 | Ownership & RLS        | Four authorization models A/B/C/D per resource.                |
| ADR-BC-005 | Public Access          | Public reads via safe RPC/server-fn; no raw anon table grants. |
| ADR-BC-006 | Moderation Boundaries  | Owner vs association/community moderation separation.          |
| ADR-BC-007 | Domain Boundaries      | 3 layers; one owner per domain; downward deps.                 |
| ADR-BC-008 | Resource Scope         | 5 scopes: personal/community/association/platform/public.      |
| ADR-BC-009 | Product Surfaces       | `/app`, `/m`, `/connect`, `/community`, `/company`.            |
| ADR-BC-010 | Shared Services        | 13 reusable services; one Gateway/three AI personas.           |

## Supporting documents

| Doc                                                                      | Purpose                                  |
| ------------------------------------------------------------------------ | ---------------------------------------- |
| ENTERPRISE_ARCHITECTURE_SPECIFICATION                                    | Consolidated authoritative architecture. |
| PLATFORM_ARCHITECTURE_FREEZE                                             | Version + freeze statement.              |
| PLATFORM_LAYER_DIAGRAM                                                   | Canonical 3-layer diagram.               |
| PLATFORM_CAPABILITY_MATRIX                                               | Capability × surface × owner grid.       |
| DOMAIN_BOUNDARY_MATRIX                                                   | Domain × layer ownership.                |
| RESOURCE_SCOPE_MATRIX                                                    | Domain × scope mapping.                  |
| SHARED_SERVICE_CATALOG                                                   | Per-service contracts.                   |
| PRODUCT_BOUNDARY_GUIDE                                                   | Placement rules; product↔domain.         |
| IMPLEMENTATION_ROADMAP                                                   | BC-1…BC-11 phased plan.                  |
| IMPLEMENTATION_GATES                                                     | Gates A–G.                               |
| MIGRATION_GUIDELINES                                                     | Mandatory migration rules.               |
| BC_PHASE_ACCEPTANCE                                                      | DoR/DoD + 7 checklists per phase.        |
| BC_RISK_REGISTER                                                         | Enterprise risk register.                |
| GLOBAL_IDENTITY_CONTRACT                                                 | 12 identity invariants.                  |
| IDENTITY_HELPER_MATRIX                                                   | Planned identity helpers.                |
| BC0_PLATFORM_INVENTORY / DEPENDENCY_MATRIX / CALL_GRAPHS                 | BC-0.1 audit.                            |
| BC0_SECURITY_MATRIX / TEST_PLAN / BACKLOG / PUBLIC_ACCESS_HARDENING_PLAN | BC-0.3 security.                         |
| BC0_BLOCKERS_AND_RISKS                                                   | Running blockers/risks log (BC-0.1…0.5). |

## Frozen decision count

10 ADRs · 5 architecture layers · 5 resource scopes · 4 authorization models ·
4 product surfaces (+1 future) · 13 shared services · 11 implementation phases ·
7 gates. All frozen at BC-0.5.
