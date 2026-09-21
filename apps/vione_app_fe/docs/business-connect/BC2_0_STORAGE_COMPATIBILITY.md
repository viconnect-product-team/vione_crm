# BC-2.0 — Storage Compatibility Preflight

## Current state

Business Card media is stored as **URL text** on `member_business_cards`:
`avatar_url`, `cover_url`, `company_logo_url`. There is **no dedicated
business-card storage bucket**. Existing buckets: `product-media` (private),
`association-logos` (private) — neither is owned by card identity.

**Implication:** current media has **no ownership coupling** to
`member_id`/`association_id`/`card_id` at the storage layer. Ownership migration
touches no storage path today → **compatible, no forced asset move**.

## Path ownership audit

| Path element used today  | Present? |
| ------------------------ | -------- |
| `association_id` in path | No       |
| `member_id` in path      | No       |
| `card_id` in path        | No       |
| `auth.uid()` in path     | No       |

(URLs are opaque text; no structured ownership path exists yet.)

## Future global-safe structure (design; adopt when a bucket is introduced)

```
business-card-media/
  {ownerUserId}/
    {cardId}/
      avatar/
      cover/
      company/
```

Requirements:

- Existing assets (external/text URLs) remain readable — dual-path: read old URL
  if present, write new structured path going forward.
- Delete/replace scoped by `{ownerUserId}` prefix → cannot cross users.
- Private assets via signed URLs; public assets only when `public_mode='public'`
  and intentionally exposed.
- Document legacy (URL-text) vs new (bucket path) dual behavior in BC-2.x.

## Verdict

**Compatible.** No storage change required for the ownership cutover; the future
bucket structure is deferred and additive.
