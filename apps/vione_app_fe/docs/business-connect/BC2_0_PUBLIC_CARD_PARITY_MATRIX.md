# BC-2.0 — Public Business Card Parity Matrix

Compares **A. current public route path** (`b.$slug.tsx` → `getPublicBusinessCardFn`,
anon publishable client, RLS `status='published' AND public_mode='public'`) vs
**B. safe projection** the resolver-based path must preserve after migration.

Ownership migration must not change what the public sees. The public path keys
on `slug`/`status`/`public_mode` — **never** on `member_id` or `owner_user_id` —
so it is ownership-agnostic by construction.

## Field-by-field parity

| Field                                                            | Current projection                   | Post-migration | Parity |
| ---------------------------------------------------------------- | ------------------------------------ | -------------- | ------ |
| identity (display_name)                                          | ✅                                   | ✅             | OK     |
| professional_title / headline                                    | ✅                                   | ✅             | OK     |
| company_name                                                     | ✅                                   | ✅             | OK     |
| avatar_url / cover_url / company_logo_url                        | ✅                                   | ✅             | OK     |
| bio                                                              | ✅                                   | ✅             | OK     |
| website / work_email / work_phone                                | ✅                                   | ✅             | OK     |
| social (zalo/linkedin/facebook/youtube/tiktok)                   | ✅                                   | ✅             | OK     |
| address / map_url                                                | ✅                                   | ✅             | OK     |
| skills                                                           | ✅ (child, RLS via parent)           | ✅             | OK     |
| services                                                         | ✅                                   | ✅             | OK     |
| needs                                                            | ✅                                   | ✅             | OK     |
| CTA (cta_settings)                                               | ✅ (via card)                        | ✅             | OK     |
| theme/branding (theme_id, custom_brand_color, branding_settings) | ✅                                   | ✅             | OK     |
| public_mode                                                      | ✅                                   | ✅             | OK     |
| visibility_settings                                              | ✅ (normalized)                      | ✅             | OK     |
| association verification badge                                   | derived from association (read-only) | unchanged      | OK     |
| unavailable states (`members_only`, `not_found`)                 | ✅ (admin existence check)           | ✅             | OK     |
| SEO/head metadata (`/b/$slug` head)                              | ✅ derived from card                 | ✅             | OK     |

## Gap classification

- **P0 (blocks migration):** none.
- **P1 (blocks removal of raw anon SELECT):** the current path relies on the anon
  publishable client + anon RLS policy for the happy path. Removing that raw anon
  access would require routing all public reads through `getPublicBusinessCardFn`
  service projection first. **Out of scope for BC-2.0/2.1 — do not remove public
  policies.**
- **P2 (non-blocking):** none identified.

## Rules honored

- Public access stays **separate** from owner/moderation policies.
- No public policy is removed in BC-2.0.
- `/b/$slug` URL and behavior remain stable.
