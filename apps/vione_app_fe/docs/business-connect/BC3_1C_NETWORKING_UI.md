# BC-3.1C — Global Business Networking Management UI

## Scope

The management surface for Global Business Networking. Lets an authenticated
platform user review and act on their connections and pending requests. No new
domain logic — this slice is presentation + hooks over the BC-3.1B SDK.

## Surfaces (routes)

- `/connect/network` — tabbed layout shell (`connect.network.tsx`).
- `/connect/network/connections` — accepted (mutual) connections.
- `/connect/network/requests/incoming` — incoming pending requests.
- `/connect/network/requests/sent` — outgoing pending requests.
- `/connect/network/` — redirects to `/connections`.

All routes are `ssr: false` (authenticated, user-specific data).

## Layers

```
Route (thin)  →  NetworkSectionView (presentation)
                    ↓
              use-global-network hooks (useNetworkSection / useNetworkMutations)
                    ↓
              GlobalNetworkSDK  (network.sdk.ts, client façade)
                    ↓
              *.functions.ts server functions  → service → repository / RPC
```

UI code never touches the service, repository, or supabase client directly.
The only client entry point is `GlobalNetworkSDK` via the hook layer.

## Sections

`NetworkSection = "connections" | "incoming" | "sent"`. Each section shares one
renderer (`NetworkSectionView`) and differs only in loader + contextual actions:

| Section     | Loader         | Actions                  |
| ----------- | -------------- | ------------------------ |
| connections | `listAccepted` | View profile, Disconnect |
| incoming    | `listIncoming` | Accept, Decline          |
| sent        | `listOutgoing` | Cancel                   |

## Counterpart hydration

Rows carry only `counterpartUserId`. The hook batch-resolves privacy-safe
PUBLIC summaries (`resolvePublicCounterpartsFn` → `member_business_cards`,
gated by `public_mode`/`status`). No private data is projected: name, headline,
company name, avatar, and public card slug only. Missing summaries render a
neutral fallback.

## State handling

`useNetworkSection` distinguishes first-load (`loading` → skeleton) from
background refresh (`refreshing` → inline spinner + `aria-busy`). Errors render
`ErrorState` with retry; empty lists render section-specific `EmptyState`.

## Mutations

`useNetworkMutations` performs optimistic row removal, success toasts, and maps
thrown `NETWORK_*` codes to i18n via `networkErrorTKey`. A single `busyId`
disables the acting row while in flight.

## i18n

All strings live under the `connect.network.*` namespace (vi + en). No
hardcoded UI text. Error copy is derived from stable domain codes, never raw
SQL/RLS text.
