# Resource Scope Matrix (FROZEN — BC-0.4)

Maps every domain to its supported ResourceScope(s) (ADR-BC-008). **bold** =
primary/default scope. `(future)` = supported later, not in BC-1.

| Domain              | personal   | community  | association   | platform   | public            |
| ------------------- | ---------- | ---------- | ------------- | ---------- | ----------------- |
| Business Card       | **✔**      | ✔ (future) | ✔ (optional)  | —          | ✔ (optional, RPC) |
| Membership Identity | —          | —          | **✔**         | —          | ✔ (verify, RPC)   |
| Networking (global) | **✔**      | ✔ (future) | —             | —          | —                 |
| Networking (legacy) | —          | —          | **✔**         | —          | —                 |
| Marketplace         | ✔ (future) | ✔ (future) | **✔** (today) | —          | ✔ (optional)      |
| Events              | —          | ✔ (future) | **✔**         | ✔          | ✔ (optional)      |
| Meetings            | **✔**      | ✔ (future) | ✔             | —          | —                 |
| Documents           | ✔          | ✔ (future) | **✔**         | —          | ✔ (optional)      |
| Notifications       | **✔**      | ✔ (future) | ✔             | ✔          | —                 |
| AI                  | **✔**      | ✔ (future) | ✔             | ✔ (config) | —                 |
| Companies           | ✔          | ✔ (future) | ✔             | —          | ✔ (optional)      |
| Profiles (Global)   | **✔**      | —          | —             | —          | ✔ (RPC)           |
| Members             | —          | —          | **✔**         | —          | —                 |
| Search              | ✔          | ✔ (future) | ✔             | ✔          | ✔ (optional)      |
| Audit               | ✔          | ✔ (future) | ✔             | **✔**      | —                 |

## Per-domain scope flow (frozen; mirrors ADR-BC-007 §6)

- **Business Card:** personal → association (optional) → public (optional).
- **Marketplace:** association (today) → community (future) → personal (future) → public (optional).
- **Events:** association → community → platform.
- **Meetings:** personal → association → community.
- **Documents:** association → community → personal.
- **Notifications:** personal → association → community.
- **AI:** personal → association → community.

## Rules (frozen)

1. `public` is always a **projection via safe RPC/server-fn**, never a raw
   `TO anon` table grant (ADR-BC-005).
2. Scope identity (`owner_user_id` / `association_id` / `community_id` / role) is
   server-resolved (invariant 11).
3. Adding a scope to a domain later is additive and must not change existing
   scopes' owner/visibility (ADR-BC-003 staged-transition principle).
