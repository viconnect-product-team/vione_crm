# BC-3.1D — Business Profile Connect Integration

**Architecture Version:** Business Connect v1 — FROZEN
**Status:** Implemented

## Objective

Integrate Global Business Networking state and lifecycle actions into the
public Business Profile route (`/b/$slug`) while preserving SSR, SEO, and
privacy. The profile page becomes an entry point for sending, accepting,
declining, cancelling, and dissolving global connections — without leaking
owner identity or duplicating the BC-3.0 state machine.

## Layering

```
/b/$slug (SSR route, public loader — unchanged)
  └─ CardView
       ├─ SaveCardButton              (independent "Saved card" surface)
       └─ BusinessProfileRelationshipActions   (NEW — connect lifecycle)
            └─ useBusinessProfileRelationship   (hook: session + state + mutations)
                 └─ ProfileConnectSDK           (client façade)
                      └─ *.functions.ts         (authenticated RPC adapters)
                           └─ profile-connect.server.ts   (server-only composition)
                                ├─ resolveBusinessCardOwnerContext (Identity Bridge)
                                ├─ resolveRelationshipState        (BC-3.1B compose)
                                ├─ GlobalConnectionService         (BC-3.1B lifecycle)
                                └─ RelationshipService.exists      (saved-card read)
```

No new SQL, no new RLS, no new state machine. All lifecycle transitions flow
through the frozen BC-3.1A SECURITY DEFINER RPCs via `GlobalConnectionService`.

## Files

| File                                                            | Role                                                                                     |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/lib/business-card/profile-connect.types.ts`                | Viewer-safe DTOs (no owner/target ids).                                                  |
| `src/lib/business-card/profile-connect.server.ts`               | Server-only composition: owner resolution, state compose, participant validation.        |
| `src/lib/business-card/profile-connect.functions.ts`            | 6 authenticated `createServerFn` adapters.                                               |
| `src/lib/business-card/profile-connect.sdk.ts`                  | Stable client façade (`ProfileConnectSDK`).                                              |
| `src/hooks/use-profile-connect.ts`                              | `useBusinessProfileRelationship` — session detection, mutation keys, toasts, error→i18n. |
| `src/components/connect/BusinessProfileRelationshipActions.tsx` | Reusable, accessible relationship control.                                               |
| `src/routes/b.$slug.tsx`                                        | Wires the control into `CardView` (Save + Connect independent).                          |
| `src/lib/i18n.ts`                                               | `connect.profile.*` keys (vi + en).                                                      |

## Security & privacy invariants

1. **Owner resolved server-side only.** The client sends the card `slug`; the
   authoritative owner is resolved via `resolveBusinessCardOwnerContext`
   (owner_user_id → legacy member fallback) using the service-role client for
   the ownership read alone. A client-supplied user id is never trusted.
2. **No identity leakage.** DTOs (`BusinessProfileRelationshipState`) carry
   only `viewer`, `savedCard`, a direction-aware minimal `connection`
   projection, and `effectiveState`. No `owner_user_id`, `target_user_id`,
   `counterpartUserId`, pair columns, blocker identity, or mutation keys.
3. **Participant validation.** Every connection-id action
   (`accept/decline/cancel/disconnect`) re-resolves the target from the slug
   and asserts the connection's counterpart equals that owner
   (`assertProfileParticipant`) → `NETWORK_NOT_PARTICIPANT` otherwise. This
   blocks replaying a valid connection id against an unrelated profile.
4. **Neutral unavailability.** Unpublished / unresolved-ownership targets
   collapse to `effectiveState: "unavailable"` with no reason leaked.
5. **Stable errors.** Raw SQL/RLS text never reaches the client; thrown errors
   carry `NETWORK_*` codes mapped to i18n via `networkErrorTKey`.

## SSR / SEO

The route loader, `head()` metadata, and public card projection are unchanged.
`BusinessProfileRelationshipActions` is a client interaction surface: it renders
a deterministic loading skeleton on first paint (identical server/client) and
resolves the viewer session in `useEffect`, so it neither blocks SSR nor causes
hydration mismatch. It contributes no crawlable content and does not affect
canonical/OG tags.

## Effective-state → UI matrix

| effectiveState            | UI                                               |
| ------------------------- | ------------------------------------------------ |
| `anonymous`               | "Sign in to connect" → `/auth?redirect=/b/$slug` |
| `self`                    | control hidden                                   |
| `none`                    | **Connect**                                      |
| `pending_sent`            | status + **Withdraw request**                    |
| `pending_received`        | **Accept** / **Decline** (confirm)               |
| `connected`               | status + **Disconnect** (confirm)                |
| `blocked` / `unavailable` | neutral status text                              |

## Accessibility

- Actions wrapped in a labelled `role="group"` with `aria-busy` during
  mutations.
- `role="status" aria-live="polite"` announces status/busy transitions.
- Destructive actions (decline, disconnect) use the focus-trapped
  `ConfirmDialog` (Escape/Tab handled by Radix AlertDialog).
- All controls are keyboard reachable with visible `focus-visible` rings.

## Verification

- `tsgo --noEmit`: 0 errors.
- `scripts/check-i18n.mjs`: OK (vi + en parity).
- `src/__tests__/business-profile-connect.bc31d.test.ts`: SDK surface, module
  boundary (no static `.server` imports), DTO privacy, participant-validation
  guardrails.
