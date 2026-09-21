# BC-6.4 — Introduction Outcome & Success Tracking

## Purpose

Track what happens after an introduction is delivered, as a separate domain
from Introduction Request and Introduction Delivery.

## Domain separation

- `introduction_requests` → "Did the intermediary agree to help?"
- `introduction_deliveries` → "Was the introduction actually delivered?"
- `introduction_outcomes` → "What happened after delivery?" (this slice)

## State machine

```
pending ──► resolved (connected | progressed | not_connected)
pending ──► expired  (closed_no_outcome)
```

`resolved` and `expired` are terminal (`trg_io_terminal` blocks any UPDATE from
those states).

## Outcome creation policy

One outcome per delivery. Created via `intro_outcome_create_on_ack(delivery_id)`
on delivery acknowledgment. Idempotent (returns existing row if present).

## Observation window

`expires_at = acknowledged_at + 60 days`. Enforced by:

- `intro_outcome_expire(outcome_id)` — lazy per-record expiry
- `intro_outcome_expire_sweep(limit)` — bounded scheduled sweep

## Canonical connection observation

`intro_outcome_observe_connection(outcome_id)` scans `user_connections` for an
accepted edge between requester and target, timestamped **after** delivery ack.
Resulting outcome: `resolved / connected / observed_connection`.

Attribution wording is **observed after introduction**, not caused-by.

## Manual outcomes

| Action                          | Authorized              | Result                                                      |
| ------------------------------- | ----------------------- | ----------------------------------------------------------- |
| `intro_outcome_mark_progressed` | requester, intermediary | `resolved / progressed / declared_{requester,intermediary}` |
| `intro_outcome_mark_no_outcome` | requester only          | `resolved / not_connected / declared_requester`             |

## RLS & privilege matrix

| Role          | SELECT                                       | INSERT/UPDATE/DELETE |
| ------------- | -------------------------------------------- | -------------------- |
| anon          | none                                         | none                 |
| authenticated | requester ∨ intermediary ∨ target (own rows) | denied — RPCs only   |
| service_role  | ALL                                          | ALL                  |

All mutations go through `SECURITY DEFINER` RPCs. Direct INSERT/UPDATE/DELETE is
denied by policy AND the terminal-state trigger.

## SDK surface (frozen)

`IntroductionOutcomeSDK`: `getOutcome`, `listRequesterOutcomes`,
`listIntermediaryOutcomes`, `markProgressed`, `markNoOutcome`,
`getIntermediaryImpact`.
System-only (`observeConnection`, `expireOutcome`, `createOnAcknowledged`) are
NOT exposed on the SDK.

## Analytics (aggregate only)

- Connection conversion = `connected` / `acknowledged deliveries`
- Progression rate = `(connected + progressed)` / `acknowledged deliveries`
- Delivery completion = `acknowledged` / `delivered`

No AI score. No leaderboard. No CRM automation.

## Deferred scope

Messaging, AI success scoring, AI-generated follow-up, automatic connection
creation, automatic meeting booking, CRM opportunity automation, revenue
attribution, public intermediary ranking, reputation score.
