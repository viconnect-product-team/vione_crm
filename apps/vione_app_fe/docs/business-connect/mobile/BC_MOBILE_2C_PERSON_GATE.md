# BC-Mobile-2C — Person Detail Foundation · GATE REPORT

**Status:** GO · 2026-07-15
**Scope delivered:** `/connect-app/network/$personId` is now a live, read-only
person detail surface for both relationship kinds (`u:` connection, `c:` saved
card), with fail-closed authorization, visibility-gated contact actions, and a
unified unavailable state.

## Deliverables

| Item | File |
| --- | --- |
| Data contract (frozen) | `docs/business-connect/mobile/BC_MOBILE_2C_PERSON_DATA_CONTRACT.md` |
| Resolution hook + DTO + sanitizers | `src/hooks/use-business-connect-person.ts` |
| Person Detail UI | `src/components/business-connect/mobile/PersonDetail.tsx` |
| Route (replaces 2A placeholder) | `src/routes/connect-app.network.$personId.tsx` |
| Bilingual copy (19 new keys, vi/en) | `src/lib/i18n.ts` |
| Test shard (34 tests) | `src/__tests__/business-connect-mobile-person.bcm2c.test.tsx` |

**Side fix (pre-existing, unrelated to 2C):** the desktop navigation shard
(`business-connect-navigation.bcuit.test.tsx`) still asserted 6 tabs; the nav
has legitimately had 7 since BC-9.1 added Relationship Memory. Updated the
stale assertion — no app code changed.

## Data contract audit (pre-implementation)

- `$personId` format re-verified against the frozen 2A contract (`u:<uuid>` /
  `c:<uuid>`); strict regex parse, everything else → invalid.
- Authorization sources traced to RLS-bounded code paths:
  - `u:` → `getConnectionStateFn` (zod-uuid, `requireSupabaseAuth`) +
    `getConnectionByIdFn` (participant-scoped). Only `accepted` + not blocked
    passes.
  - `c:` → `SavedCardSDK.search` (`saved_by_user_id = auth.uid()`, non-archived
    default). The viewer owning the edge IS the authorization.
- Contact channels: `BusinessCardSDK.getPublic` reads with an anon-key client —
  DB policies (`member_business_cards`: `status='published' AND
  public_mode='public'` for non-owners, confirmed via `pg_policies`) are the
  hard gate; `visibilitySettings.showContact/showSocial` applied on top,
  mirroring `/b/{slug}`.
- **Timeline preview: NOT_AVAILABLE** — the only client-side person-node
  resolver is the write-path `registerNode` (get-or-create). Resolving another
  person's node from a read page would be a write-on-read side effect;
  deferred until a read-only node-ref resolver exists.
- **Next meeting context: NOT_AVAILABLE** — meeting workspace participant
  previews expose an opaque `handle`, not a user id (anti-enumeration by
  design). No truthful per-person join exists on a safe boundary.

## Runtime behavior

- Identity hero (avatar → name → title · company → relationship narrative) →
  contact actions (Call / Email / Website / Card — only real, cleared fields)
  → relationship narrative section → optional social section. Nothing
  decorative; empty sections do not render.
- Unified unavailable state for invalid id, pending/blocked/none pair,
  stranger's saved card, removed edge — no reason codes, no existence leaks.
- Loading skeleton (aria-busy, sr-only label, motion-reduce safe); transport
  error state with retry (query invalidation).
- URL sanitization: `tel:`/`mailto:` allowlists, http(s)-only via URL parser
  (javascript:/data:/protocol-relative/userinfo rejected), host-only labels.

## Verification

- **New shard:** 34/34 passed — parse, sanitizers (injection vectors),
  visibility gating, both resolution paths, fail-closed matrix, privacy (no
  notes/tags/ids in DOM or DTO), DTO whitelist (exact key sets), one-h1,
  labelled links, bilingual, axe = 0 (loaded connection / loaded saved /
  unavailable).
- **Full mobile + navigation regression:** 152/152 passed
  (`business-connect-mobile*` ×5, home ×2, navigation ×1).
- **Screenshots:** not captured — the managed auth session is `signed_out`
  this turn, so authenticated end-to-end rendering was not available.
  `Authenticated path: UNVERIFIED` via browser; behavior is instead proven by
  the jsdom shards above, which mock only the SDK module boundaries and run
  the real hook, DTO, gating, and rendering code.

## Acceptance criteria (contract §11)

1..9 — met (see shard). Criterion 10 (previous shards green) — met, 152/152.

## Deferred (unchanged from contract §12)

Timeline preview (needs read-only node resolver), next meeting context (needs
truthful per-person meeting contract), connect/save/message/block actions,
relationship memory surfaces, deep links from notifications.
