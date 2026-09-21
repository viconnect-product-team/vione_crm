# BUSINESS_CARD_CAPABILITY — Shared Service Registration (BC-2.1D)

Business Card is registered as a **version 1 shared Platform service** via
`registerCapability` in `src/lib/business-card/business-card.capability.ts`
(ADR-BC-010). Importing that module records the capability in the
behavior-free `service-registry`; it changes no runtime behavior.

## Registration

- `id`: `business-card`
- `layer`: `shared` (sits above Core, below product surfaces — ADR-BC-007)
- `version`: `1`
- `sdk`: `BusinessCardSDK` (the one entrypoint consumers must use)
- `capabilities`: get, list, create, update, delete, publish, hide, share,
  getPublic, generateVCard, generateQR, resolveOwner
- `consumers`: marketplace, association, community, ai (+ crm, affiliate)

## Layering (post BC-2.1D extraction)

```text
Product surfaces ── consume ──▶ BusinessCardSDK
                                     │
                                     ▼
                           Server functions (thin adapters)
                                     │
                                     ▼
                  Service layer (business-card / lead / interaction)
                                     │
                                     ▼
                  Repository layer (ONLY table access)
                                     │
                                     ▼
                        Supabase tables (RLS enforced)
```

Contract: no behavior changes, no RLS changes — pure architecture extraction.
