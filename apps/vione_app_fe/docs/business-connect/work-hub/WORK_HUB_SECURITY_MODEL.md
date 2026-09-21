# Work Hub — Security & PII Model (BC-8.0)

## Authentication

Every Hub server function uses `.middleware([requireSupabaseAuth])`. No
unauthenticated entrypoints exist. Anonymous callers receive `401`.

## Authorization

The Hub never bypasses RLS. All reads use the caller's authenticated
Supabase client. `supabaseAdmin` is never imported by any Hub module.
Viewer isolation is guaranteed by RLS on each canonical source table.

## PII suppression

The repository projects only allowlisted columns (ids, statuses, dates,
counterpart display fields). Explicitly excluded: note bodies, shared
notes, private notes, outcome summaries, calendar payloads, event
`payload_json`, raw tokens, tenant metadata.

Resolvers may only place values into `WorkHubDisplayData` (counterpart
handle, display name, avatar URL, allowlisted scalars). Fabricating a
new PII channel requires updating the DTO type, the resolver, and this
document in the same change.

## Mutations

The SDK exposes read-only methods. Inline mutations are limited to the
`WORK_HUB_INLINE_MUTATION_CAPABILITIES` allowlist and always execute
against the canonical domain SDK — the Hub never writes.

## Cursors

Base64-encoded JSON. Stamped with `registryVersion`. Never include
user ids, tenant ids, or free-form text.
