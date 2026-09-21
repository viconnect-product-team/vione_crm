# Platform Capability Matrix (FROZEN — BC-0.5)

Documentation-only. Legend: **Own** = owns logic · Reuse = consumes as-is ·
Scope(x) = consumes under ResourceScope x · Persona = AI persona · — = forbidden.
Status: Frozen unless marked. See DOMAIN_BOUNDARY_MATRIX for the domain-owner grid.

| Capability          | Platform Core        | Shared Service       | Association          | Member          | Business Connect         | Community          | Enterprise | Status       | Owner            |
| ------------------- | -------------------- | -------------------- | -------------------- | --------------- | ------------------------ | ------------------ | ---------- | ------------ | ---------------- |
| Business Card       | —                    | **Own**              | Scope(assoc)         | Scope(personal) | Scope(personal/global)   | Scope(community)   | Reuse      | Frozen       | Shared           |
| Networking          | —                    | **Own** (global)     | Own (legacy)+Adapter | legacy+global   | Scope(community)+Adapter | Scope(community)   | Reuse      | Frozen       | Shared+Assoc     |
| Companies           | —                    | **Own**              | Reuse                | Reuse           | Reuse                    | Reuse              | Reuse      | Frozen       | Shared           |
| Meetings            | —                    | **Own**              | Scope(assoc)         | Scope(personal) | Scope(personal)          | Scope(community)   | Reuse      | Frozen       | Shared           |
| Marketplace         | —                    | **Own** (foundation) | Scope(assoc)         | browse          | Scope(business)          | Scope(community)   | Reuse      | Frozen       | Shared           |
| Events              | —                    | **Own** (foundation) | Scope(assoc)         | attend          | Reuse                    | Scope(community)   | Reuse      | Frozen       | Shared           |
| Membership Identity | —                    | —                    | **Own**              | own             | —                        | —                  | —          | Frozen       | Association      |
| Wallet              | Billing found.       | Media/QR             | consume              | consume         | consume                  | consume            | consume    | **Deferred** | Shared (post-v1) |
| AI                  | **Own** (Gateway)    | **Own** (personas)   | Persona(assoc)       | Persona(assoc)  | Persona(business)        | Persona(community) | Reuse      | Frozen       | Core+Shared      |
| Notifications       | **Own** (infra)      | **Own** (templates)  | Scope(assoc)         | Scope(personal) | Scope(personal)          | Scope(community)   | Reuse      | Frozen       | Core+Shared      |
| Documents           | —                    | **Own**              | Scope(assoc)         | Scope(assoc)    | Scope(personal)          | Scope(community)   | Reuse      | Frozen       | Shared           |
| Analytics           | **Own** (foundation) | **Own** (business)   | Scope(assoc)         | —               | Scope(personal)          | Scope(community)   | Reuse      | Frozen       | Core+Shared      |
| Audit               | **Own**              | —                    | Scope(assoc)         | own             | Scope(personal)          | Scope(community)   | Reuse      | Frozen       | Core             |
| Storage             | **Own**              | —                    | Reuse                | Reuse           | Reuse                    | Reuse              | Reuse      | Frozen       | Core             |
| Realtime            | **Own**              | —                    | Reuse                | Reuse           | Reuse                    | Reuse              | Reuse      | Frozen       | Core             |
| Search              | **Own** (infra)      | **Own** (business)   | Reuse                | Reuse           | Reuse                    | Reuse              | Reuse      | Frozen       | Core+Shared      |

## Notes

- **Split capabilities** (Networking, AI, Notifications, Analytics, Search): infra
  in Core, business composition in Shared; never re-merge under delivery pressure.
- **Wallet** is the only Deferred capability; not on the BC-1…BC-11 critical path.
- Every Scope(x) resolves via server-side identity (RESOURCE_SCOPE_MATRIX).

## BC-4.0 delta

- **Business Meetings & Follow-up** (Shared Service over Core infra): planned,
  status CONDITIONAL GO at preflight. Reuses Notification, rate-limit,
  idempotency, telemetry, and Business Interaction infra via adapters. New ICS
  export utility required. No external calendar sync in MVP.
