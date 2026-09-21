# BC-0.1 — Dependency Matrix

Classification legend:

- **A. Platform-ready** — uses `auth.uid()` / generic ownership; supports non-member users as-is.
- **B. Association-only** — requires `member_id` + `association_id` by design.
- **C. Needs adapter** — reusable but currently assumes member identity.
- **D. Must remain isolated** — official association lifecycle (fees, membership, identity pass).

RLS model codes: `uid` = `auth.uid()=user_id`; `member` = `current_member_id()`; `assoc` = `is_member_of/has_assoc_role/is_assoc_manager`; `anon` = public SELECT policy; `svc` = service-role mediated.

---

## Tables

| artifact                                        | type                                  | domain         | user_id dep                | member_id dep                         | association_id dep           | public access            | RLS model             | BC readiness | recommended action                                     | risk                 |
| ----------------------------------------------- | ------------------------------------- | -------------- | -------------------------- | ------------------------------------- | ---------------------------- | ------------------------ | --------------------- | ------------ | ------------------------------------------------------ | -------------------- |
| `members`                                       | table                                 | membership     | via `user_id` link         | is the identity                       | yes                          | no                       | assoc                 | B/D          | keep as association registry; BC users may have no row | high — identity gate |
| `member_business_cards`                         | table                                 | cards          | no                         | yes (`member_id=current_member_id()`) | yes                          | published+public (anon)  | member + assoc + anon | C            | add user-based ownership path for non-members          | high                 |
| `business_card_services` / `_needs` / `_skills` | table                                 | cards          | no                         | via card                              | via card                     | services/needs anon      | member(owner) + anon  | C            | follow card owner model                                | med                  |
| `business_card_leads`                           | table                                 | cards          | no                         | owner/requester `current_member_id()` | yes                          | no                       | member + assoc        | C            | needs user-id path                                     | med                  |
| `business_card_interactions`                    | table                                 | cards          | no                         | via `owns/manages_business_card`      | via card                     | no                       | member/manager        | C            | reuse w/ adapter                                       | low                  |
| `connections`                                   | table                                 | networking     | no                         | `owner_id=current_member_id()`        | yes                          | no                       | member                | B            | redesign for user-based peers                          | high                 |
| `messages`                                      | table                                 | networking     | no                         | member (assoc-scoped)                 | yes                          | no                       | assoc                 | B            | user-based DM model needed                             | high                 |
| `products`                                      | table                                 | marketplace    | no                         | `member_id`                           | yes                          | no                       | assoc + member        | C            | user-based seller path                                 | med                  |
| `meetings`                                      | table                                 | meetings       | no                         | no                                    | yes (`has_assoc_role`)       | no                       | assoc(admin)          | B            | admin-owned; adapter for user hosts                    | med                  |
| `email_campaigns`                               | table                                 | campaigns      | no                         | no                                    | yes (`has_assoc_role admin`) | no                       | assoc(admin)          | B            | association-scoped only                                | low                  |
| `member_identity_passes`                        | table                                 | identity       | no                         | member                                | yes                          | no (svc verify)          | member + assoc        | D            | keep isolated                                          | high                 |
| `card_settings`                                 | table                                 | cards(legacy)  | yes (`auth.uid()=user_id`) | no                                    | no                           | no                       | uid                   | A            | reuse unchanged                                        | low                  |
| `notifications`                                 | table                                 | notif (admin)  | no                         | no                                    | yes                          | no                       | assoc(admin)          | B            | assoc-scoped                                           | low                  |
| `member_notifications`                          | table                                 | notif (member) | no                         | `recipient_id=current_member_id()`    | yes                          | no                       | member                | C            | user-based inbox needed                                | med                  |
| `profiles`                                      | table                                 | account        | yes (`id=auth.uid()`)      | no                                    | no                           | no                       | uid                   | A            | reuse unchanged                                        | low                  |
| `user_roles`                                    | table                                 | roles          | yes                        | no                                    | no                           | no                       | uid/platform          | A            | reuse                                                  | low                  |
| `associations`                                  | table                                 | tenant         | no                         | no                                    | is the tenant                | landing_published (anon) | assoc + anon          | B            | tenant root                                            | low                  |
| `companies`(history)                            | derived from `members`/`activity_log` | companies      | no                         | member-derived                        | yes                          | no                       | assoc                 | C            | member-derived, needs adapter                          | med                  |

## Functions / RPC (SECURITY DEFINER)

| artifact                                                                           | type    | user_id    | member_id          | association_id  | BC readiness | note                          |
| ---------------------------------------------------------------------------------- | ------- | ---------- | ------------------ | --------------- | ------------ | ----------------------------- |
| `current_member_id()`                                                              | rpc     | yes        | outputs it         | yes             | B            | NULL for non-members          |
| `current_association_id()`                                                         | rpc     | yes        | no                 | outputs it      | B            | needs a membership            |
| `has_role` / `is_platform_admin`                                                   | rpc     | yes        | no                 | no              | A            | global roles                  |
| `has_assoc_role` / `is_assoc_manager` / `is_member_of`                             | rpc     | yes        | no                 | yes             | B            | tenant roles                  |
| `my_bc_admin_level` / `bc_admin_level`                                             | rpc     | yes        | no                 | via membership  | B/C          | card admin tier               |
| `owns_business_card` / `manages_business_card`                                     | rpc     | via member | yes                | via card        | C            | ownership predicate           |
| `net_send_request` / `net_accept` / `net_decline` / `net_remove_connection`        | rpc     | yes        | yes                | yes             | B            | fully member-based networking |
| `link_my_member_profile` / `unlink_my_member_profile` / `list_my_linkable_members` | rpc     | yes        | links member       | yes             | A→C          | bridges user↔member           |
| `handle_new_user`                                                                  | trigger | yes        | **no members row** | membership only | A            | see blockers                  |

## Server functions (`src/lib/*`)

| artifact                                                         | domain               | identity dep                                 | RLS/client             | BC readiness |
| ---------------------------------------------------------------- | -------------------- | -------------------------------------------- | ---------------------- | ------------ |
| `business-card.functions.ts` (my/save/publish/setPrimary/delete) | cards                | `resolveMemberId`                            | member RLS + svc audit | C            |
| `getPublicBusinessCardFn`                                        | cards                | none                                         | anon client + svc gate | A            |
| `business-card-admin.functions.ts`                               | cards                | `my_bc_admin_level` + `resolveCardListScope` | assoc RLS              | B            |
| `card.functions.ts` (`getCardSettings`/`getPublicCard`)          | cards(legacy)        | `context.userId`                             | uid RLS                | A            |
| `networking.functions.ts`                                        | networking           | `resolveMemberId(OrNull)`                    | member RLS             | B            |
| `marketplace.functions.ts`                                       | marketplace          | `resolveMemberId`                            | member/assoc RLS + svc | C            |
| `meetings.functions.ts`                                          | meetings             | none (RLS)                                   | assoc admin RLS        | B            |
| `campaigns.functions.ts`                                         | campaigns            | none (RLS)                                   | assoc admin RLS        | B            |
| `companies.functions.ts`                                         | companies            | none (RLS)                                   | assoc RLS              | C            |
| `ai.functions.ts`                                                | ai                   | `resolveAssociationId`                       | assoc + svc audit      | C            |
| `member-identity-pass/*`                                         | identity             | member / svc verify                          | member RLS + svc       | D            |
| `member-account/*`, `fees`, `renewals`, `finance`                | membership lifecycle | member/assoc                                 | assoc + svc            | D            |

## Routes

| route                                                  | public | guard          | identity dep    | BC readiness |
| ------------------------------------------------------ | ------ | -------------- | --------------- | ------------ |
| `/` `/landing` `/h/$slug`                              | yes    | none           | assoc slug      | A            |
| `/b/$slug` `/card/$code`                               | yes    | none           | none            | A            |
| `/verify`                                              | yes    | none           | none (svc)      | A/D          |
| `/m/*`                                                 | no     | auth-user only | member (per fn) | C            |
| `/companies/*` `/meetings` `/marketplace/*` `/network` | no     | auth           | assoc/member    | B/C          |
| `/ai`                                                  | no     | auth           | association     | C            |
| `/admin/business-cards*`                               | no     | bc admin tier  | assoc           | B            |
| `/platform/*`                                          | no     | platform admin | global          | A            |
