# Domain Boundary Matrix (FROZEN — BC-0.4)

Documentation-only. Each domain has exactly **one owner layer**. Product columns
mark how that product relates to the domain: **Own** = owns logic, **Reuse** =
consumes shared engine as-is, **Adapter** = consumes via adapter, **Scope** =
consumes under a specific ResourceScope, **—** = forbidden/not applicable.

| Domain              | Platform Core     | Shared Service       | Association                | Business Connect         | Community          | Future Enterprise | Status           | Owner                                 |
| ------------------- | ----------------- | -------------------- | -------------------------- | ------------------------ | ------------------ | ----------------- | ---------------- | ------------------------------------- |
| Authentication      | **Own**           | —                    | Reuse                      | Reuse                    | Reuse              | Reuse             | Frozen           | Platform Core                         |
| Profiles (Global)   | Identity          | **Own**              | Reuse                      | Reuse                    | Reuse              | Reuse             | Frozen           | Shared Service                        |
| Members             | —                 | —                    | **Own**                    | —                        | —                  | —                 | Frozen           | Association                           |
| Business Cards      | —                 | **Own**              | Scope(assoc)               | Scope(personal)          | Scope(community)   | Reuse             | Frozen           | Shared Service                        |
| Membership Identity | —                 | —                    | **Own**                    | —                        | —                  | —                 | Frozen           | Association                           |
| Networking          | —                 | **Own** (global)     | **Own** (legacy) + Adapter | Scope(community)+Adapter | Scope(community)   | Reuse             | Frozen (coexist) | Split: Shared + Association           |
| Marketplace         | —                 | **Own** (foundation) | Scope(assoc)               | Scope(business)          | Scope(community)   | Reuse             | Frozen           | Shared Service                        |
| Companies           | —                 | **Own**              | Reuse                      | Reuse                    | Reuse              | Reuse             | Frozen           | Shared Service                        |
| Meetings            | —                 | **Own**              | Scope(assoc)               | Scope(personal)          | Scope(community)   | Reuse             | Frozen           | Shared Service                        |
| Events              | —                 | **Own** (foundation) | Scope(assoc)               | Reuse                    | Scope(community)   | Reuse             | Frozen           | Shared Service                        |
| Campaigns           | —                 | —                    | **Own**                    | —                        | —                  | —                 | Frozen           | Association                           |
| Notifications       | **Own** (infra)   | **Own** (templates)  | Scope(assoc)               | Scope(personal)          | Scope(community)   | Reuse             | Frozen           | Split: Core infra + Shared templates  |
| Documents           | —                 | **Own**              | Scope(assoc)               | Scope(personal)          | Scope(community)   | Reuse             | Frozen           | Shared Service                        |
| AI                  | **Own** (Gateway) | **Own** (personas)   | Persona(assoc)             | Persona(business)        | Persona(community) | Reuse             | Frozen           | Split: Core gateway + Shared personas |
| Search              | **Own** (infra)   | **Own** (business)   | Reuse                      | Reuse                    | Reuse              | Reuse             | Frozen           | Split: Core infra + Shared queries    |
| Audit               | **Own**           | —                    | Scope(assoc)               | Scope(personal)          | Scope(community)   | Reuse             | Frozen           | Platform Core                         |
| Storage             | **Own**           | —                    | Reuse                      | Reuse                    | Reuse              | Reuse             | Frozen           | Platform Core                         |

## Notes

- **Split domains** (Networking, Notifications, AI, Search): infrastructure/global
  in the lower layer; product-specific composition in the upper layer. No merge of
  legacy association networking into global networking in BC-1 (adapter only).
- **Business Cards ≠ Membership Identity** — different owners; both consumed by
  products but never conflated (ADR-BC-007 §8, invariant 9).
- **Members / Membership Identity / Campaigns** are Association-owned and must not
  leak into Platform Core or Shared Services.
- Every "Scope(...)" cell resolves to the matching ResourceScope in
  RESOURCE_SCOPE_MATRIX.md.

## BC-4.0 delta — Business Meetings & Follow-up

- **Business Meetings** is a NEW distinct Platform domain (participant-scoped),
  separate from Association `meetings` (Association-owned), Association Events,
  Global Connections, Saved Cards, Business Interactions, and any future CRM.
- **Follow-up** is private, owner-scoped; never a shared/CRM task.
- Company & Association appear as **context only** on a meeting — no admin read,
  no dual-write, no company-wide calendar.
- Calendar integration is an adapter; the Business Meeting is source of truth.
