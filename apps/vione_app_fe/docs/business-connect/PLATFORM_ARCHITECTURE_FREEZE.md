# Platform Architecture Freeze Statement (BC-0.5)

**This is the formal freeze of the Business Connect v1 Architecture.**

| Field                       | Value                                                                             |
| --------------------------- | --------------------------------------------------------------------------------- |
| Architecture version        | Business Connect v1 Architecture                                                  |
| Platform version            | ViOne Platform — BC-0 baseline                                                   |
| Freeze date                 | BC-0.5 (final pre-implementation step)                                            |
| ADR count                   | 10 (ADR-BC-001 … ADR-BC-010)                                                      |
| Decision documents          | 24 files under `docs/business-connect/`                                           |
| Frozen layers               | 5 (Core → Shared → Product Domains → Surfaces → Future)                           |
| Frozen ResourceScopes       | 5 (personal / community / association / platform / public)                        |
| Frozen authorization models | 4 (A personal, B association, C community, D public projection)                   |
| Frozen product surfaces     | 4 active-or-reserved (`/app`, `/m`, `/connect`, `/community`) + `/company` future |
| Frozen shared services      | 13 (SHARED_SERVICE_CATALOG)                                                       |

## Frozen decisions (summary)

1. Platform User ≠ Association Member; login requires no member row.
2. Global identity is additive (`user_profiles`); no fake members, no fake identity.
3. Business Card is a Shared Service, user-owned, ≠ Membership Identity.
4. Networking coexists (legacy + global + community); adapter, no rewrite/merge.
5. Marketplace = one engine, many scopes.
6. One AI Gateway, three personas.
7. Public access only via safe RPC/server-fn projection; raw anon grants removed.
8. Strict downward dependency; Platform Core has zero business logic.
9. Migrations must be additive, backward-compatible, idempotent, rollback-safe.
10. No big-bang; phases run in fixed order BC-1 → BC-11.

## Known risks (see BC_RISK_REGISTER)

Direct anon SELECT on card tables (Critical), member_id coupling in cards/
networking (High), split-domain drift, scope conflation, public projection parity.

## Known deferred items

- Wallet (Apple/Google) — deferred to post-v1 (not in BC-1…BC-11 critical path;
  optional add-on to Membership Identity / Business Card).
- Membership payment gateway — deferred; renewal flow works without live gateway.
- Enterprise/Healthcare/Education/CRM/HRM/ERP surfaces — future products.
- Community schema — boundaries frozen; schema designed in BC-6/BC-8.

## Future architecture items

Affiliate OS foundation (BC-10), community workspace (BC-8), enterprise multi-org
identity, cross-community federation, offline-first sync hardening.

## Statement

Effective from BC-0.5, all implementation (BC-1 onward) MUST conform to
`ENTERPRISE_ARCHITECTURE_SPECIFICATION.md` and its companion documents. Any
deviation requires a new ADR and Gate A re-approval.
