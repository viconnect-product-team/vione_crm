# BC-2.0 — Business Card Ownership Migration Design & Preflight

Status: **COMPLETE — design & measurement only, no cutover**
Date: 2026-07-13
Architecture: Business Connect v1 (FROZEN)
Prerequisites: BC-1.0 ✅ · BC-1.1 ✅ · BC-1.2 ✅ · Gate B ✅

> This phase measures, classifies and designs the safe **additive** migration
> that moves Business Card ownership from member-first to platform-user
> ownership. **No ownership cutover, no destructive change, no UI/route change.**

---

## 1. Domain audit — UI → server fn → helper/RPC → table → RLS

### Tables (all `public`)

| Table                        | Rows (live) | Key columns                                                                                                          | RLS        |
| ---------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------- | ---------- |
| `member_business_cards`      | 0           | id, association_id (NN), member_id (NN, text→members), slug (uniq), status, public_mode, card_kind, + profile fields | 7 policies |
| `business_card_skills`       | 0           | card_id→card (CASCADE), label, sort_order                                                                            | 3 policies |
| `business_card_services`     | 0           | card_id (CASCADE), title, description, category                                                                      | 3 policies |
| `business_card_needs`        | 0           | card_id (CASCADE), title, description, category                                                                      | 3 policies |
| `business_card_interactions` | 0           | card_id (CASCADE), interaction_type                                                                                  | 1 policy   |
| `business_card_leads`        | 0           | card*id (CASCADE), requester*\*, status                                                                              | 2 policies |
| `business_card_audit`        | 0           | card_id (SET NULL), event_type, actor_user_id, association_id                                                        | 1 policy   |

**No `owner_user_id` column exists today.** Ownership is derived purely from
`member_id → members.user_id`.

### Server functions

| Function                                                                                                                                                             | File                                  | Purpose                       | Ownership basis                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------- |
| `listMyBusinessCardsFn` / `getMyBusinessCardFn`                                                                                                                      | business-card.functions.ts            | authenticated builder read    | `member_id = current_member_id()` (via RLS)                                                    |
| `getBusinessCardPreviewFn`                                                                                                                                           | business-card.functions.ts            | owner preview                 | RLS                                                                                            |
| `getPublicBusinessCardFn`                                                                                                                                            | business-card.functions.ts            | public `/b/$slug`             | anon publishable client + RLS (published+public), members_only gated via admin existence check |
| `saveBusinessCardFn`                                                                                                                                                 | business-card.functions.ts            | create/update + child replace | RLS insert/update                                                                              |
| `setBusinessCardStatusFn` / `setPrimaryBusinessCardFn` / `deleteBusinessCardFn`                                                                                      | business-card.functions.ts            | lifecycle                     | RLS                                                                                            |
| lead/analytics fns (`listMyBusinessCardLeadsFn`, `updateBusinessCardLeadStatusFn`, `sendBusinessCardLeadReplyFn`, `processLeadWorkflowFn`, `getBusinessCardStatsFn`) | business-card.functions.ts            | leads + analytics             | RLS via parent                                                                                 |
| `listAllBusinessCardsFn`, `adminSetCardStatusFn`, `adminSetCardsStatusFn`, `getMyBcAdminLevelFn`, `listCardAuditFn`, `listBusinessCardAuditLogFn`                    | business-card-admin.functions.ts      | moderation + audit            | `is_assoc_manager` / `bc_admin_level`                                                          |
| `resolveBusinessCardOwnerContextFn`                                                                                                                                  | identity-bridge.functions.ts (BC-1.2) | read-only owner resolution    | unique `members.user_id` mapping only                                                          |

### Helpers / RPC

`current_member_id()`, `current_association_id()`, `is_assoc_manager()`,
`is_public_business_card()`, `owns_business_card()`, `manages_business_card()`,
`bc_admin_level()`/`my_bc_admin_level()`, `log_business_card_member_event()`,
`log_business_card_status_change()`, `notify_business_card_lead()`,
validation triggers (`validate_business_card`, `validate_business_card_lead`,
`validate_business_card_interaction`).

### Routes / components

`business-cards.tsx` (desktop builder), `m.business-cards.tsx` (mobile),
`b.$slug.tsx` (public), `admin.business-cards.tsx` + `admin.business-cards.audit.tsx`.
Sharing: `business-card-nfc.ts`, vCard/QR generation. Member 360 embeds preview.

### Storage

No dedicated business-card bucket. Media stored as **URL text**
(`avatar_url`, `cover_url`, `company_logo_url`). Existing buckets:
`product-media` (private), `association-logos` (private). See
`BC2_0_STORAGE_COMPATIBILITY.md`.

---

## 2–3. Classification (real data, via read-only preflight)

Executed `docs/business-connect/sql/business-card-ownership-preflight.sql`:

```json
{
  "totalCards": 0,
  "resolvableUnique": 0,
  "memberWithoutUser": 0,
  "orphanMemberReference": 0,
  "ambiguousUserMapping": 0,
  "associationMismatch": 0,
  "alreadyGlobalCompatible": 0,
  "unknown": 0,
  "eligibleBackfillCount": 0,
  "blockingCount": 0
}
```

**Interpretation:** the production Business Card dataset is currently empty
(0 cards; 3 members, 1 user-linked). There are **no rows to backfill and no
blocking anomalies**. The migration therefore starts from a clean slate — the
additive schema + RLS transition can ship with zero data-migration risk, and
the deterministic backfill will be a no-op on first run. The preflight remains
the authoritative gate to re-run immediately before BC-2.1 in case data lands.

See `BC2_0_CARD_DATA_CLASSIFICATION.md` for category definitions.

---

## 4–13. Designs

- Additive schema → `BC2_0_BACKFILL_DESIGN.md` §Schema
- Deterministic backfill + rollback → `BC2_0_BACKFILL_DESIGN.md`
- Dual-read resolver freeze → `BC2_0_RLS_TRANSITION_DESIGN.md` §Dual-read
- Mutation compatibility matrix → `BC2_0_RLS_TRANSITION_DESIGN.md` §Mutation matrix
- Public parity → `BC2_0_PUBLIC_CARD_PARITY_MATRIX.md`
- Future RLS transition → `BC2_0_RLS_TRANSITION_DESIGN.md`
- Create-card behavior → `BC2_0_RLS_TRANSITION_DESIGN.md` §Create
- Storage → `BC2_0_STORAGE_COMPATIBILITY.md`
- Performance → `BC2_0_MIGRATION_RUNBOOK.md` §Performance
- Security tests → `BC2_0_SECURITY_TEST_PLAN.md`

---

## 16. Gate result

### **GO** (clean-slate GO)

| Metric                | Value                                                               |
| --------------------- | ------------------------------------------------------------------- |
| totalCards            | 0                                                                   |
| eligibleBackfillCount | 0                                                                   |
| blockingCount         | 0                                                                   |
| classification        | all categories = 0                                                  |
| public parity         | adequate — projection matches public route field set (P0/P1 = none) |
| storage compatibility | compatible — URL-text media, no bucket ownership coupling           |
| rollback              | reliable — backfill writes are isolable via migration-run marker    |

**Recommended BC-2.1 scope:** apply the additive schema migration
(`owner_user_id uuid NULL` + indexes, additive moderation columns deferred),
add owner-priority RLS **alongside** legacy policies, wire dual-read resolver
into read paths, and run the deterministic backfill (no-op on current data).
Re-run this preflight immediately before BC-2.1; if any row lands in category
C/D/E, downgrade to **CONDITIONAL GO** and migrate only category A.

**Approvals still required:** Gate C sign-off before BC-2.1 executes any
migration.

## 17. Acceptance

No ownership cutover · no destructive change · no UI/route change · classification
from real data · backfill deterministic + rollback-safe · public parity measured ·
RLS design implementation-ready · cross-user/cross-association tests specified.
