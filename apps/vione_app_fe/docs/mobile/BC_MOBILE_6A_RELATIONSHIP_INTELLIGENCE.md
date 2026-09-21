# BC-Mobile-6A — Relationship Intelligence Engine & Calm Home Suggestions

Status: FROZEN contract. Date: 2026-08.

6A adds ONE capability: privacy-preserving **reconnection suggestions** derived
from deterministic relationship evidence. It creates NO new identity, NO new
connection model, NO scoring black box, and NO new data collection — every
signal is a timestamp the platform already owns.

---

## 1. Signal model (deterministic, transparent)

Evidence per person = timestamps ONLY, from viewer-owned edges:

| Source | Edge timestamp | Evidence kind |
|---|---|---|
| Accepted connection (3.1A) | `connected_at` | `connected` |
| Saved business card (3.0) | `saved_at` | `card_saved` |
| Guest contact (3B/5D) | `first_shared_at` | `contact_shared` (`card_scanned` when source = card scan) |
| Moments (2D) | latest `occurred_at` per person | `moment` |

`lastMeaningfulInteraction = max(origin, latest moment)`. Derived signal:
`daysSinceLastInteraction`. Configuration constants are frozen in
`RELATIONSHIP_INTELLIGENCE_CONFIG` (reconnect ≥ 45 days, recent-interaction
suppression < 7 days, home cap 3, snooze 7 days, AI timeout 5s).

Selection guards — ALL must pass, otherwise the engine stays silent:
1. evidence exists (no last interaction ⇒ NO recommendation),
2. not suppressed by a recent interaction,
3. staleness ≥ threshold,
4. no active dismissal for the exact (person, type) pair.

Ranking: staleness DESC, tie → personId ASC. Deterministic — same inputs
always yield the same output. AI never influences selection or ranking.

## 2. Privacy contract

- All reads are viewer-scoped (`owner_id`/`user_id = viewer`) or fail-closed
  single-person authorization (accepted pair / owned saved card / owned guest).
- Counterpart display data comes from privacy-safe public summaries
  (PUBLISHED + PUBLIC projection) — the same port as 5E.
- DTOs carry: personId, display fields, structured reason (kind + days +
  evidenceKind), wording. NEVER: notes, photos, OCR text, tags, contact
  details, owner_user_id, scores, or probabilities.
- AI prompt payload = `{ promptVersion, locale, signals: { daysSinceLastInteraction } }`.
  No name, no id, no free text can enter the prompt by construction.

## 3. AI wording (optional enhancement, strict validation)

- Gateway: Lovable AI (Gemini), `response_format: json_object`, 5s timeout.
- Output schema is strict (unknown keys rejected).
- Grounding: every number in the text must equal a supplied value; URLs,
  HTML, and markdown are rejected.
- ANY failure (timeout, schema, grounding, disabled) ⇒ null ⇒ the UI renders
  the deterministic i18n template. The feature never blocks on AI.

## 4. Surfaces

- **Executive Home** — "V · Gợi ý hôm nay": ≤3 calm rows (avatar, name,
  one-line suggestion, truth reason "Dấu mốc gần nhất · N ngày trước"), row
  links to Person Detail, per-row dismiss. Error ⇒ section hides + quiet
  Retry; sibling Home content is unaffected. Empty ⇒ section hidden.
- **Person Detail** — "V · Gợi ý": at most ONE suggestion, fail-closed; any
  parse/authorization/evidence failure renders nothing.
- **Dismiss** — snoozes the exact (person, reconnect) pair for 7 days
  (owner-scoped table `relationship_recommendation_dismissals`, upsert).

## 5. Invalidation

- Moment saved (`MomentComposer.finish`) ⇒ invalidate rel-intel root.
- Connection accept/decline (5E `use-network-requests`) ⇒ invalidate root.
- Dismiss ⇒ invalidate root.

## 6. Telemetry

Allowlisted names only: `RELATIONSHIP_RECOMMENDATION_REQUESTED`,
`_RENDERED`, `_DISMISSED`, `_RENDER_BLOCKED_MISSING_EVIDENCE`,
`RELATIONSHIP_AI_GROUNDING_REJECTED`, `RELATIONSHIP_AI_FALLBACK_USED`.
Never names, ids, tokens, or payloads.

## 7. Out of scope (deferred)

Milestone-decay suggestion types beyond reconnect, push surfacing,
dismissal management UI, cross-surface dedup beyond the (person, type) key.
