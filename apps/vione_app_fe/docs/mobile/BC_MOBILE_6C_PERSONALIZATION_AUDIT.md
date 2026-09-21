# BC-Mobile-6C — Personalization Audit

Date: 2026-08-10 · Status: FROZEN · Scope: current Relationship Intelligence (6A) + Actions (6B) implementation, classified for the 6C preference layer.

## 1. Where Relationship Intelligence surfaces today

| Surface | File | What it renders |
| --- | --- | --- |
| Home — V section | `src/components/business-connect/mobile/RelationshipSuggestions.tsx` | ≤3 calm reconnect rows (V · Gợi ý), dismiss X, open → person |
| Person Detail — V section | `src/components/business-connect/mobile/PersonSuggestion.tsx` | 1 reconnect row + dismiss + action sheet trigger |
| Action sheet | `src/components/business-connect/mobile/RelationshipActionSheet.tsx` | CALL / EMAIL / MOMENT quick actions |
| Person suggestion inline actions | `PersonSuggestion.tsx` (inline icon buttons) | CALL / EMAIL / MOMENT |
| Me tab | `src/routes/connect-app.me.tsx` | No V/Intel entry point today |

All surfaces reuse 5-tab IA (Home · Network · V · Community · Me) and `--bc-mobile-*` semantic tokens. No new tab/route needed beyond a Me settings leaf.

## 2. Where actions & dismiss live today

| Signal | Location today |
| --- | --- |
| Dismiss (per person, type=reconnect) | Table `relationship_recommendation_dismissals` (owner-scoped, `dismissed_until`, 7-day snooze) via `bcRelationshipDismissRecommendationFn` |
| Recommendation opened (telemetry only) | `RELATIONSHIP_RECOMMENDATION_OPENED` in `relationship-intelligence.telemetry.ts` — console allowlist, NOT persisted |
| Action selected (telemetry only) | `RELATIONSHIP_ACTION_SELECTED` — console allowlist, NOT persisted |
| Server read of dismissals | `relationship-intelligence.server.ts` `readDismissals()` |
| Action availability | `resolveRelationshipActions` (pure, 6B) — availability is authoritative |

**Gap 6C closes:** OPENED / ACTION_SELECTED are currently telemetry-only; 6C introduces a minimal, owner-scoped, allowlisted interaction event table so adaptation is durable and resettable. Per-person dismissals stay in the 6A table (explicit user state with natural expiry, not inferred personalization).

## 3. Preference store decision

`user_settings` exists (voting_open_pref only) and `gn_notification_prefs` / `business_notification_preferences` are notification-domain stores. None fit: notification prefs govern delivery channels, not recommendation behavior; `user_settings` is an unrelated single-purpose row.

**Decision:** new narrow domain tables (like the 6A dismissals table):

- `relationship_intelligence_preferences` — one row per viewer; explicit switches + enums; no free text, no JSON blobs.
- `relationship_intelligence_interactions` — append-only behavioral events (kind + optional recommendation_type + timestamp); **no personId** (global adaptation does not need per-person history → data minimization §24/§25).

Both owner-scoped RLS (`viewer_user_id = auth.uid()`), matching the 6A dismissals pattern. Multi-tenant scope: **platform-user global** (identical to 6A dismissals `owner_user_id`).

## 4. Existing thresholds that become explicit preferences

From `RELATIONSHIP_INTELLIGENCE_CONFIG` (frozen in 6A):

| 6A constant | Value | 6C mapping |
| --- | --- | --- |
| `RECONNECT_AFTER_DAYS` | 45 | Cadence NORMAL baseline. MORE_OFTEN=30, LESS_OFTEN=60 |
| `RECENT_INTERACTION_SUPPRESS_DAYS` | 7 | Unchanged (safety suppression, not a preference) |
| `MAX_HOME_RECOMMENDATIONS` | 3 | Unchanged (layout cap) |
| `DISMISS_SNOOZE_DAYS` | 7 | Unchanged (6A contract) |

Only the reconnect threshold becomes user-influenceable — via a single `RECONNECT_AFTER_DAYS` override passed into the unchanged pure `selectReconnectCandidate(evidence, dismissals, nowMs, config)` (config is already a parameter).

## 5. Existing dismissal behavior that personalization may affect

- Per-person snooze (`dismissed_until`) remains **authoritative and unchanged** — personalization never widens, shortens, or bypasses it.
- NEW: aggregated dismiss *patterns* (ratio of dismissed vs opened reconnect suggestions in a 90-day window) may shift the viewer's effective cadence one step quieter (45→60) — global, reversible, and only in AUTO mode.

## 6. Learning-safe signals (classified)

| Signal | Class | Reason / use |
| --- | --- | --- |
| `recommendation_opened` (viewer taps a reconnect row) | BEHAVIORAL_SAFE | Coarse interest; counts toward open ratio |
| `recommendation_dismissed` | BEHAVIORAL_SAFE | Coarse rejection; counts toward dismiss ratio (global only, no personId) |
| `action_call_selected` / `action_email_selected` | BEHAVIORAL_SAFE | Channel habit for action ORDERING (call vs email) |
| `action_moment_selected` | BEHAVIORAL_SAFE | Recorded but NEVER influences contact-action ordering (§32) |
| `action_person_opened` | BEHAVIORAL_SAFE | Reserved/parity with telemetry; recorded, unused in v1 ranking |
| Master switch ON/OFF | EXPLICIT_SAFE | recommendations_enabled |
| Type-level OFF (reconnect) | EXPLICIT_SAFE | reconnect_enabled |
| Cadence choice auto/more/normal/less | EXPLICIT_SAFE | reconnect_cadence |
| Preferred action auto/call/email | EXPLICIT_SAFE | preferred_contact_action |
| Learning switch | EXPLICIT_SAFE | behavioral_adaptation_enabled |
| Reset action | EXPLICIT_SAFE | deletes prefs row + interactions |

## 7. FORBIDDEN signals (never read, stored, or inferred)

- Private notes, moment content/captions, tags, photos, attachments
- Email/message/call CONTENT or metadata beyond the viewer's own tap events
- Contact details (phone/email values), addresses
- Per-person interaction history (no personId on events)
- Business value, deal size, seniority, social status, "person importance", lead quality
- Inferred urgency/probability/scores; any per-person ranking by value
- Cross-account or cross-association aggregation

Enforcement: CHECK-constrained enum columns only; `relationship_intelligence_interactions` has no text/payload column at all; `functions.ts` Zod-allowlists every input.

## 8. Existing user-control / settings surfaces

`connect-app.me.tsx` has SectionCard rows (Account, Card & NFC, Notifications, Preferences, Support). 6C adds ONE row in a new "V · Gợi ý" SectionCard linking to `/connect-app/me/intel-settings` (dedicated page, not a sheet — enough controls to deserve a page, keeps Me calm).

## 9. Query-count / performance notes

6A today: Home compose = 4 queries (connections, saved cards, guests, moments) + dismissals + AI wording. 6C adds ≤2 bounded reads per compose (prefs row + 90-day interaction window, both indexed) and only when AUTO+learning are on for the interaction read. Person compose: +2. Documented and verified in closure report.

## 10. Failure policy (unchanged from 6A)

Prefs or interactions read failure → `null` → deterministic defaults (recommendations ON, cadence NORMAL 45d, action auto/default order). Recommendation surfaces keep failing closed; personalization fails OPEN to defaults. Telemetry: `PERSONALIZATION_FALLBACK_DEFAULT`.
