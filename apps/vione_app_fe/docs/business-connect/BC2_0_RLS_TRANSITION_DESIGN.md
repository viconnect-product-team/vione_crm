# BC-2.0 — RLS Transition, Dual-Read & Mutation Design

**Design only. No policy applied in BC-2.0.**

## Dual-read resolver (frozen contract)

Resolver priority:

1. Valid `owner_user_id` → `global_user`
2. `owner_user_id IS NULL` + unique valid member→user mapping → `legacy_member`
3. No trustworthy mapping → `unresolved`

Result shape:

```ts
{
  cardId: string,
  ownerUserId?: string,
  memberId?: string,
  associationId?: string,
  ownershipMode: "global_user" | "legacy_member" | "unresolved"
}
```

Implemented (read-only) via BC-1.2 `resolveBusinessCardOwnerContext`. Extend it in
BC-2.1 to prefer `owner_user_id` when present.

Rules:

- `owner_user_id` is **authoritative** when present.
- Compatibility derivation is **read-only**.
- `unresolved` grants **no mutation rights**.
- Association admin is **never** an ownership fallback.

## Future RLS policies (apply in BC-2.1, ALONGSIDE legacy)

```sql
-- OWNER (global)
CREATE POLICY "Owner reads own cards (global)" ON public.member_business_cards
  FOR SELECT TO authenticated USING (owner_user_id = auth.uid());
CREATE POLICY "Owner inserts own card (global)" ON public.member_business_cards
  FOR INSERT TO authenticated WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "Owner updates own card (global)" ON public.member_business_cards
  FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());        -- prevents owner reassignment
CREATE POLICY "Owner archives own card (global)" ON public.member_business_cards
  FOR DELETE TO authenticated USING (owner_user_id = auth.uid());

-- LEGACY COMPATIBILITY (temporary; only when not yet migrated)
-- keep existing member-based policies unchanged; they already express:
--   owner_user_id IS NULL AND member_id = current_member_id()
--                          AND association_id = current_association_id()
-- (add the owner_user_id IS NULL guard to legacy UPDATE/INSERT in BC-2.1).

-- MODERATION (separate from ownership) — unchanged is_assoc_manager policy + platform.
```

Requirements enforced:

- `WITH CHECK (owner_user_id = auth.uid())` prevents reassigning ownership.
- Client cannot choose `owner_user_id` — server sets it (`= auth.uid()`).
- No broad cross-tenant `OR` policy.
- Public access stays separate (existing anon SELECT policy untouched).
- Child tables (`skills/services/needs/interactions/leads`) derive ownership
  **through parent card** — policies reference the parent via `owns_business_card`
  / `manages_business_card`, extended to also accept `owner_user_id = auth.uid()`.

## Mutation compatibility matrix

Personas: **GO** global owner · **LM** legacy member owner · **AM** assoc manager ·
**XAM** unrelated assoc manager · **PM** platform moderator · **XU** unrelated user ·
**UR** unresolved card.

| Action                              | Current             | Transitional    | Target         | GO  | LM  | AM            | XAM | PM  | XU  | UR              |
| ----------------------------------- | ------------------- | --------------- | -------------- | --- | --- | ------------- | --- | --- | --- | --------------- |
| create card                         | member RLS          | owner or legacy | owner          | ✅  | ✅  | ❌            | ❌  | ❌  | ❌  | —               |
| update content                      | member RLS          | owner∥legacy    | owner          | ✅  | ✅  | ❌            | ❌  | ❌  | ❌  | ❌              |
| publish/hide/archive                | member RLS          | owner∥legacy    | owner          | ✅  | ✅  | ❌            | ❌  | ❌  | ❌  | ❌              |
| change slug                         | member RLS          | owner∥legacy    | owner          | ✅  | ✅  | ❌            | ❌  | ❌  | ❌  | ❌              |
| privacy/CTA settings                | member RLS          | owner∥legacy    | owner          | ✅  | ✅  | ❌            | ❌  | ❌  | ❌  | ❌              |
| media upload/delete                 | member RLS          | owner∥legacy    | owner          | ✅  | ✅  | ❌            | ❌  | ❌  | ❌  | ❌              |
| skills/services/needs               | member RLS (parent) | owner∥legacy    | owner (parent) | ✅  | ✅  | ❌            | ❌  | ❌  | ❌  | ❌              |
| analytics (read)                    | owner RLS           | owner∥legacy    | owner          | ✅  | ✅  | own assoc     | ❌  | ✅  | ❌  | ❌              |
| leads                               | owner RLS           | owner∥legacy    | owner          | ✅  | ✅  | ❌            | ❌  | ❌  | ❌  | ❌              |
| association verification/moderation | `is_assoc_manager`  | unchanged       | unchanged      | ❌  | ❌  | ✅(own assoc) | ❌  | ✅  | ❌  | AM of its assoc |
| platform suspension                 | platform admin      | unchanged       | unchanged      | ❌  | ❌  | ❌            | ❌  | ✅  | ❌  | ✅(PM)          |

**Ownership and moderation remain separate** — a manager moderates but never owns.

## Future create-card behavior (design; not implemented)

**Global Business Connect user:** `owner_user_id = auth.uid()`, `member_id = NULL`,
`association_id = NULL`, requires `user_profile`, **no fake member created**.

**Association-linked card:** `owner_user_id = auth.uid()`, `member_id`
server-resolved, `association_id` server-resolved; link must be explicit & valid.

> Requires `member_id`/`association_id` to become nullable in a later phase for
> global cards — **NOT** part of BC-2.0/2.1 (they stay NOT NULL until then).
> This is flagged as a sequencing dependency in the risk register.
