# Work Hub — Data Flow (BC-8.0)

```
UI (WorkHubPage)
  └─ hooks (useWorkHubOverview, useWorkHubItems)
       └─ WorkHubSDK (client-safe barrel)
            └─ server functions (requireSupabaseAuth)
                 └─ WorkHubService (composition, pure resolvers + policy)
                      ├─ WorkHubRepository (six bounded RLS reads)
                      │    └─ canonical Business Connect tables
                      └─ item-resolver + priority-policy (pure)
```

- Reads are fan-out then reduce: at most one bounded query per source
  per request. No N+1.
- Failures degrade to `[]`; the Hub never throws to the UI for a source
  outage. Verified in `work-hub-verification.bc80f.test.ts`.
- Overview and Items share the same resolver output, so summary counts
  and category previews are always parity-consistent.
- Mutations are routed to canonical domain SDKs. The Hub never writes.
