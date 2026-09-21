# BC-3.0 — RLS & Privacy Matrix (Global Networking)

Architecture Version: **Business Connect v1 (FROZEN)**. Policy design only.

## 1. Roles

- `anon` — unauthenticated. **No access** to `user_connections`.
- `authenticated` — platform user (`auth.uid()`), participant-scoped.
- `service_role` — server/admin maintenance only.
- Platform admin — via `is_platform_admin()` for moderation reads (audit surface only).

## 2. `user_connections` grants (design)

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_connections TO authenticated;
GRANT ALL ON public.user_connections TO service_role;
-- NO grant to anon. Global connections are never anon-readable.
```

Contrast with the legacy `connections` table's historical `GRANT SELECT ... TO anon`

- `USING (true)` policy — that pattern is **explicitly rejected** here.

## 3. RLS policies (participant-scoped)

| Op     | Who                  | Predicate                                                                                                   |
| ------ | -------------------- | ----------------------------------------------------------------------------------------------------------- |
| SELECT | participant          | `auth.uid() IN (requester_user_id, recipient_user_id)`                                                      |
| SELECT | platform admin       | `is_platform_admin()` (moderation/audit only)                                                               |
| INSERT | requester            | `auth.uid() = requester_user_id AND requester <> recipient`                                                 |
| UPDATE | participant          | `auth.uid() IN (requester_user_id, recipient_user_id)` (transition guard trigger enforces actor-per-status) |
| DELETE | none (authenticated) | disallowed — lifecycle uses status transitions, not row deletes; hard delete via `service_role` only        |

Notes:

- Mutations are funneled through `SECURITY DEFINER` service functions / RPCs that
  re-check actor + current status; broad `authenticated` UPDATE is defence-in-depth,
  not the primary gate.
- `requester_user_id` is **always** taken from `auth.uid()` server-side — never from
  the client payload. Client-supplied `requester_user_id` is ignored.

## 4. Field-level privacy

| Field                                     | Requester sees | Recipient sees | Third party / anon     |
| ----------------------------------------- | -------------- | -------------- | ---------------------- |
| status / requested_at / responded_at      | yes            | yes            | no                     |
| counterpart public profile                | yes            | yes            | per profile visibility |
| private notes / tags / relationship score | own only       | own only       | never                  |
| source_id (private resource)              | never raw      | never raw      | never                  |

Relationship intelligence (scores, saved-card tags, interaction notes) is
**owner-private** and never exposed to the counterpart via networking.

## 5. Abuse & privacy controls (design)

- **Block** hides the blocker from the blocked user's suggestions and prevents new
  requests; block state is not disclosed as "blocked" to the blocked party.
- **Rate limiting** on `sendRequest` via `check_and_increment_sync_rate`-style
  counter keyed by `requester_user_id` (per-window cap).
- **Duplicate/reverse-duplicate** prevented by the partial unique pair-key index.
- **Enumeration protection**: target resolution goes through discoverable profiles
  only; no confirmation of account existence for non-discoverable users.
- **No message content** stored — BC-3 has no messaging surface.

## 6. Verification hooks

Cross-user and cross-tenant tests (see security test plan) must prove: a
non-participant cannot SELECT a connection row; anon gets zero rows; client-forged
`requester_user_id` is overridden; private metadata never crosses to the counterpart.
