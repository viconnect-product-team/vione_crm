# BC_MOBILE_2E_MOMENT_ARCHITECTURE

Status: FROZEN for BC-Mobile-2E (pre-migration audit, required by spec §3).
Scope: Meeting Moment — a private, owner-scoped encounter record between the
authenticated Business Connect user and ONE person in their Network.

## 1. Candidate model audit

| Candidate | Classification | Verdict | Reason |
| --- | --- | --- | --- |
| `business_card_interactions` (BC-2.6) | EXTEND_SAFELY candidate — **REJECTED** | Not used | Its authorization is `assertOwnedRelationship` against a `saved_business_cards` edge: it models the `c:` namespace ONLY. Meeting Moment must also cover `u:` accepted connections. It has no media model, no idempotency token, and is an immutable generic event log — adding photo/media/person-ref semantics would distort the canonical interaction model. |
| `graph_timeline_events` (BC-4.2) | REUSE_AS_IS candidate — **REJECTED as store** | Read-side only | A governed projection store: rows are emitted transactionally by domain writes with `dedupe_key`, never a user-content write target. Moments JOIN the Journey read model as their own source (§8), not by stuffing graph metadata. |
| `business_relationship_memories` (BC-9.1) | NOT_APPLICABLE | Not used | AI intelligence layer with embeddings and extraction receipts. Spec §34 forbids hidden AI side effects in 2E. |
| `saved_business_cards` | NOT_APPLICABLE | Referenced only | An edge, not an encounter record. |
| Storage conventions (`product-media`, `association-logos`) | REUSE_AS_IS (pattern) | YES | Private bucket + owner-prefixed path + short-TTL signed URL on every read. No public bucket URLs anywhere. |
| Client canvas compression (`AiCardImportModal`) | REUSE_AS_IS (pattern) | YES | `createImageBitmap` → canvas → JPEG re-encode strips EXIF (incl. GPS) by construction and bounds dimensions. Extracted into `moment-image.ts`. |

**Decision: NEW_DOMAIN_REQUIRED** — `business_relationship_moments` +
`business_relationship_moment_media` (naming follows
`business_relationship_memories`). Genuinely new canonical data: dual-namespace
person reference, 0–5 media, idempotent prepare/finalize lifecycle.

## 2. Domain model

```text
business_relationship_moments
  id, owner_user_id, target_kind('connection'|'saved_card'),
  target_user_id? / target_card_id?   (XOR enforced by CHECK)
  occurred_at, event_name? (≤120), place_label? (≤120), note? (≤1000),
  status('pending'|'active'), client_token (idempotency),
  created_at, updated_at
  UNIQUE (owner_user_id, client_token)

business_relationship_moment_media
  id, moment_id → moments (ON DELETE CASCADE), owner_user_id (denormalized),
  storage_path, media_type('image/jpeg'|'image/png'|'image/webp'),
  sort_order (0..4, UNIQUE per moment ⇒ hard cap of 5),
  width?, height?, byte_size?, created_at
```

- Required at save: authorized person + `occurred_at`. Photo/event/place/note
  are all optional ("Ghi nhanh không ảnh" is a first-class flow).
- `status='pending'` rows are upload drafts; `active` rows are Journey facts.
- No OCR dependency, no AI ingestion, no sharing, no social features.

## 3. Person identity & authorization (fail-closed, mirrors 2C)

- UI submits the SAME opaque `personId` (`u:<uuid>` | `c:<uuid>`).
- Server re-resolves independently (never trusts client):
  - `u:` → `GlobalConnectionService.getState` must be `accepted`, not blocked,
    not self → `target_kind='connection'`, `target_user_id=<uuid>`.
  - `c:` → owner-scoped `saved_business_cards` edge (non-archived) must exist →
    `target_kind='saved_card'`, `target_card_id=<uuid>`.
- Defense in depth: a `SECURITY DEFINER` validation trigger
  (`brm_validate_moment_target`, `set search_path = public`, EXECUTE revoked
  from public/anon/authenticated) re-checks the same authorization at the
  database layer, so even a hand-crafted PostgREST write with the owner's
  token cannot attach a Moment to an arbitrary identity.

## 4. RLS & ownership

- Owner-private by default: all four policies scope `owner_user_id =
  auth.uid()`. The counterpart receives NOTHING (no photo, note, place).
- Media policies require BOTH `owner_user_id = auth.uid()` AND a moment owned
  by `auth.uid()` (EXISTS subquery).
- GRANTs: `authenticated` gets SELECT/INSERT/UPDATE/DELETE; `service_role`
  ALL; no `anon` grants.

## 5. Storage model

- NEW private bucket `relationship-moments` (no public URLs, ever).
- Path: `<owner_user_id>/<moment_id>/<media_id>.jpg` — server-generated from
  UUIDs only; client file names never influence the path (path-traversal and
  overwrite-of-foreign-Moment are impossible: storage RLS pins
  `(storage.foldername(name))[1] = auth.uid()::text`).
- Reads: short-TTL (1h) signed URLs, re-signed per Journey page render —
  mirrors the `product-media` convention.

## 6. Image pipeline (client, `moment-image.ts`)

- Accept: JPEG/PNG/WebP only. SVG rejected (scriptable), HEIC/HEIF rejected
  truthfully (`createImageBitmap` decode failure → unsupported error, no
  false claim of support).
- Limits: ≤ 5 photos; source ≤ 20 MB each; processed longest edge ≤ 2048px;
  JPEG q≈0.85 targeting ≲2 MB (soft target, no hard fail on legitimate
  photos).
- EXIF: canvas re-encode drops ALL EXIF including GPS by construction.
  Location is an explicit `place_label` typed by the user; no EXIF-derived
  geolocation is ever persisted.
- Camera: `input[type=file][accept="image/*"][capture="environment"]` —
  permission requested ONLY after the explicit "Chụp ảnh" tap. No persistent
  camera session, no background capture, no facial processing.

## 7. Save transaction & idempotency

```text
prepare (server fn)                upload (client)            finalize (server fn)
authorize person                   compress+validate           owner + still pending
upsert draft by                    put each photo to its       drop media rows not uploaded
(owner, client_token)              UUID storage path           status pending → active
insert media slot rows             (concurrency ≤ 2)
return {momentId, paths}
```

- Idempotency: `client_token` (UUID per composer mount) + UNIQUE
  `(owner_user_id, client_token)`. Repeated tap / retry / reconnect re-prepares
  the SAME draft instead of duplicating. If the draft is already `active`,
  prepare is a no-op returning success.
- Failure matrix: DB-success+photo-failure → draft stays `pending`, user
  retries only missing uploads, nothing claims success. Photo-success+DB-
  failure → finalize retry is safe. Re-prepare of a draft replaces its media
  slot rows (new media ids/paths).
- Abandoned-upload cleanup (documented limitation): `pending` drafts older
  than 24h and their storage objects are eligible for a future scheduled
  purge; media DB rows cascade on moment delete. No uncontrolled growth path
  is introduced in 2E (max 5 objects per draft, owner-isolated).

## 8. Journey integration (amends 2D contract §2/§5)

- New canonical source: owner's OWN active moments for the resolved person
  (both namespaces). New item kind `meeting_moment` → UI kind `"moment"`.
- Merge: composite opaque cursor `base64({g, ge, o})` —
  `g` = BC-4.2 graph keyset cursor (u: only), `ge` = emitted-within-current-
  graph-page skip count, `o` = consumed offset into the bounded local list
  (card_saved milestone + moments, ≤101, sorted occurred_at DESC, id DESC).
  Each request reads at most ONE graph page + ONE indexed moments query.
  Exact global ordering, every Moment appears exactly once, no write-on-read.
- Moment DTO on Journey items (whitelist extension, owner-only data):
  `{ title, placeLabel, note, photoUrl (signed), photoCount }`. Title falls
  back deterministically to i18n "Một lần gặp gỡ" — never AI-generated.
- Privacy: the Journey surface is owner-scoped end-to-end (auth middleware +
  owner-scoped queries), so the owner's own private note MAY render there.
  It stays absent from Public Card, other users' Network, and anon routes.

## 9. Boundaries (NOT in 2E)

OCR, Guest Contact, facial recognition/tagging, AI notes/analysis, automatic
Relationship Memory ingestion, sharing with the counterpart, public gallery,
likes/comments, maps/geolocation, full offline sync, follow-up task creation.
