# Member PWA — Member Context (P0-A1)

## Server-derived identity

Every Member PWA server function already runs behind `requireSupabaseAuth`
(see `src/integrations/supabase/auth-middleware.ts`). The middleware:

1. Rejects unauthenticated requests with `401 Unauthorized`.
2. Attaches an RLS-scoped `supabase` client bound to the caller.
3. Exposes `userId` and validated JWT `claims`.

Identity fan-out from `userId` is centralized in two helpers:

- `resolveAssociationId(supabase, userId)` — `src/lib/member-app/shared.ts`
- `resolveMemberCode(supabase, userId)` — `src/lib/member-identity.ts`
  (strict `user_id` link, never email-based, never "first member" fallback)

## Unified DTO

`getCurrentMemberContext` (`src/lib/member-context.functions.ts`) returns:

```ts
type MemberContextDTO = {
  memberCode: string | null;
  associationId: string | null;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  membershipStatus: "active" | "pending" | "suspended" | "expired" | "unknown";
  canAct: boolean; // active membership required to author mutations
  locale: string | null;
};
```

The DTO deliberately omits: raw `auth.uid()`, tenant ownership records, role
grants, audit fields, payment-provider metadata, and any arbitrary JSON.

## Rules the client MUST NOT break

- Never send `memberId`, `associationId`, `ownerId`, `tenantId`, or `role`
  from the client and expect the server to trust them. Every server function
  re-derives these from `userId`.
- Never persist identity/tenant in `localStorage` as the source of truth.
  Client caches are UI-only (theme, filter prefs, offline read cache).
- Fail-closed default: when `memberCode` is null, mutations must throw
  `ERR_NO_MEMBER_PROFILE` (already enforced by `registerForEvent`,
  `expressInterest`, `sendMessage`, `payMyRenewal`, etc.).
- Authoring actions gate on `canAct === true`; UI must render a
  read-only/upsell state when it is false.

## Where the DTO is consumed

P0-A1 exposes the DTO but does not rewire every screen. P0-A2 will replace
per-route ad-hoc `getMyMember` calls in the shell with a single
`useMemberContext()` hook so `/m/*` routes share one cached identity query
key `["member", "context"]`.
