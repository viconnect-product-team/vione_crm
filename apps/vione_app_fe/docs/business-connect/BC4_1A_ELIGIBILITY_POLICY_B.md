# BC-4.1A — Eligibility (Policy B)

A user may **propose** a meeting to a target only when at least one trusted
relationship exists. Resolved server-side in `business_meeting_propose` and
mirrored by the pure classifier in `src/lib/business-meetings/eligibility.ts`.

## Policy B sources (any one is sufficient)

1. **Accepted Global Connection** — an `accepted` row in `user_connections` for
   the `(low, high)` pair → classified `global_connection` (preferred).
2. **Saved Business Card** — the proposer has saved the target's card
   (`saved_business_cards` resolving to the target `owner_user_id`) →
   `saved_card`.

If neither exists → not eligible → `MEETING_NOT_ELIGIBLE`.

## Explicitly NOT sufficient (deferred / non-authorizing)

Shared Association membership, shared Company context, and public profile
visibility do **not** grant proposal eligibility in this slice. They are context
only and classify as `null`.

## Blocking baseline

If the pair is `blocked` in `user_connections`, proposal is rejected
(`MEETING_BLOCKED`) regardless of any prior eligibility source. Blocking a pair
does not retroactively delete confirmed meetings but prevents new proposals and
reschedules.

## Classifier contract

`classifyEligibility(hasAcceptedConnection, hasSavedCard)`:

- `(true, *)` → `"global_connection"`
- `(false, true)` → `"saved_card"`
- `(false, false)` → `null`
