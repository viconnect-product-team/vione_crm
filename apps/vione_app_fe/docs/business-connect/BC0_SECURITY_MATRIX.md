# BC0_SECURITY_MATRIX — Ownership, RLS & Public Access Audit (BC-0.3)

Documentation-only. Per-artifact audit grounded in `pg_policies`, storage
policies, and db-functions re-verified this turn. Grants column: the DB role
lacks `information_schema.role_table_grants` visibility (empty result, consistent
with BC-0.1), so GRANTs are inferred from observed RLS role targets.

Legend — Future model: A=personal, B=association, C=community, D=public projection.
Risk: L/M/H/Critical. Phase: when the change lands (BC-0.3 doc only → BC-1+).

## Personal / platform (auth.uid())

| Artifact        | Owner/scope          | SELECT      | INSERT/UPDATE/DELETE | Anon | SECURITY DEFINER / admin                | Sensitive fields       | Future model           | Risk                 |
| --------------- | -------------------- | ----------- | -------------------- | ---- | --------------------------------------- | ---------------------- | ---------------------- | -------------------- |
| `profiles`      | `id=auth.uid()`      | own         | own                  | none | `handle_new_user` (definer, insert)     | email, full_name       | A (kept, not extended) | L                    |
| `card_settings` | `user_id=auth.uid()` | own         | own                  | none | none                                    | theme/config           | A                      | L                    |
| `user_roles`    | user/platform        | own + admin | admin                | none | `has_role`, `handle_new_user` (definer) | role (priv-esc target) | A                      | M (keep off profile) |

## Association scope

| Artifact                               | Owner/scope                   | SELECT          | Writes                   | Anon          | Definer/admin                                         | Sensitive                      | Future              | Risk |
| -------------------------------------- | ----------------------------- | --------------- | ------------------------ | ------------- | ----------------------------------------------------- | ------------------------------ | ------------------- | ---- |
| `members`                              | assoc + `current_member_id()` | member/manager  | manager/owner            | none (verify) | `set_member_code`, `link_my_member_profile` (definer) | email, code, level, fee status | B                   | M    |
| `member_identity_passes`               | member scoped                 | owner/manager   | manager                  | none          | verify fns (definer, service)                         | pass secret, QR signature      | B + D(verify)       | H    |
| `member_identity_events`               | member scoped                 | owner/manager   | system                   | none          | validate triggers                                     | event audit                    | B                   | M    |
| `products` (Marketplace)               | member scoped                 | members/public? | `products_member_insert` | check         | `resolveMemberId` path                                | pricing                        | B (global deferred) | M    |
| fees/renewals/invoices                 | assoc scoped                  | member/manager  | manager                  | none          | —                                                     | amounts                        | B                   | M    |
| `connections` (assoc net)              | `current_member_id()`         | owner/platform  | owner                    | none          | `net_*` (definer)                                     | relationship graph             | B (legacy, keep)    | M    |
| `messages`                             | participant scoped            | participant     | participant              | none          | —                                                     | message body                   | B/A                 | M    |
| `notifications`/`member_notifications` | recipient scoped              | recipient       | system                   | none          | `add_member_notification` (definer)                   | notification body              | B/A                 | L    |
| `companies`                            | assoc/member                  | scoped          | scoped                   | check         | —                                                     | company data                   | B                   | L    |
| `meetings`                             | assoc scoped                  | member/manager  | manager                  | none          | —                                                     | agenda                         | B                   | L    |
| `campaigns`/`email_campaigns`          | assoc admin                   | manager         | manager                  | none          | —                                                     | recipient lists, PII           | B                   | H    |

## Business Card family (transition-critical)

| Artifact                     | SELECT policies (verified)                                                                                                                             | Writes                                              | Anon              | Definer                                                           | Sensitive                                   | Future      | Risk         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ----------------- | ----------------------------------------------------------------- | ------------------------------------------- | ----------- | ------------ |
| `member_business_cards`      | Owner(`member_id=current_member_id()`), Manager(`is_assoc_manager`), **Public(`status='published' AND public_mode='public'`, `{anon,authenticated}`)** | Owner insert/update/delete, Manager moderate UPDATE | **YES — raw row** | `is_public_business_card`, `owns/manages_business_card` (definer) | raw 36 cols incl. private contact/analytics | A+D         | **Critical** |
| `business_card_needs`        | owner ALL, manager read, **Public(`is_public_business_card`) `{anon,authenticated}`**                                                                  | owner                                               | **YES**           | definer helpers                                                   | —                                           | D(public)   | H            |
| `business_card_services`     | owner ALL, manager read, **Public(anon)**                                                                                                              | owner                                               | **YES**           | definer                                                           | pricing                                     | D(public)   | H            |
| `business_card_skills`       | owner ALL, manager read, **Public(anon)**                                                                                                              | owner                                               | **YES**           | definer                                                           | —                                           | D(public)   | M            |
| `business_card_leads`        | owner/requester/manager                                                                                                                                | owner/manager update                                | **none**          | `notify_business_card_lead`, `validate_*` (definer)               | requester PII, contact                      | A/B private | H            |
| `business_card_interactions` | owner/manager                                                                                                                                          | insert (validated)                                  | **none**          | `validate_business_card_interaction` (definer)                    | analytics                                   | A private   | M            |
| `business_card_audit`        | owner/manager                                                                                                                                          | system                                              | **none**          | `log_business_card_*` (definer)                                   | before/after diffs, actor                   | A/B private | M            |

## Storage (verified `storage.objects` policies)

| Bucket              | Public? | SELECT                                                               | Write                                | Anon     | Path identity       | Future                       | Risk |
| ------------------- | ------- | -------------------------------------------------------------------- | ------------------------------------ | -------- | ------------------- | ---------------------------- | ---- |
| `product-media`     | private | auth via membership (`current_member_id()` folder or platform admin) | owner folder = `current_member_id()` | **none** | folder[1]=member id | B; add card/community scopes | M    |
| `association-logos` | private | member of assoc (folder[1]=assoc id)                                 | admin of assoc                       | **none** | folder[1]=assoc id  | B                            | L    |

**No anon storage SELECT exists** — good baseline; future public card media must be
explicit and intentional (ADR-BC-005 / §8 storage contract).

## Public / anon summary

- **Direct anon table exposure exists** on `member_business_cards` + needs/services/
  skills (raw rows). This is the top hardening target (ADR-BC-005, backlog P0-A).
- No anon exposure on leads, interactions, audit, storage — correct.

## Future-table placeholders (no policies yet)

`user_profiles`(A), `saved_business_cards`(A), `user_connections`(A dual-participant),
`communities`/`community_members`/community content(C + D public profile) — all to
be created in BC-1+ following ADR-BC-004 model assignment.
