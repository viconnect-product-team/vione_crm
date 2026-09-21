# BC-RC0 — Pilot Scope Definition

Defines exactly what a controlled pilot covers. Anything not listed as INCLUDED is excluded by default. Feature freeze remains ACTIVE; this document narrows scope, it does not expand it.

## 1. Pilot entry surface

**Single pilot entry: `/connect-app` (mobile PWA).**
- `/connect/*` (legacy, orphaned from nav) — **EXCLUDED** from pilot; left routable for existing deep links, not promoted.
- `/business-connect/*` (desktop) — **EXCLUDED** from pilot v1; revisit post-pilot.
- `/m/*` (member portal) — **OUT OF SCOPE** of Business Connect pilot entirely.

## 2. INCLUDED in pilot

| Surface | Routes | Notes |
|---|---|---|
| Executive Home | `/connect-app` | After RC1 harness repair |
| Network | `/connect-app/network`, `/$personId`, `/requests` | Read + request actions |
| Moments (V) | `/connect-app/moment`, `/moment/$personId` | Capture + journey |
| Card scan | `/connect-app/card-scan` | After RC0-S0-01 fix (auth on AI endpoints) |
| Me / identity / QR / share | `/connect-app/me`, `/me/card` | + privacy sheets |
| NFC tags | `/connect-app/nfc-tags` | Android only (platform constraint) |
| Relationship intel & actions | surfaces inside Home/Network (6A/6B/6C) | Deterministic + grounded AI, dismiss/snooze |
| Community | `/connect-app/community`, `/$communityId`, `/members`, `/members/$memberRef` | 7A |
| Community events & opportunities | `/connect-app/community/$communityId/events[/$eventRef]`, `/opportunities[/$opportunityRef]` | 7B; register + interest + check-in handoff; **no cancel-registration (spec-deferred, documented)** |
| Public digital card | `/c/$token` (anonymous) | noindex, fail-closed |
| Guest contact exchange | `/api/public/card/$slug/contact`, `/api/public/identity/$token/contact`, VCF endpoints | rate-limited |
| Connection handshake | within Network/public card (5E) | opaque tokens |

## 3. EXCLUDED from pilot

| Area | Reason |
|---|---|
| Legacy `/connect/*` tree | superseded; orphaned from nav (RC0-S3-03) |
| Desktop `/business-connect/*` tree (Work Hub, memory explorer, introductions workspaces, meetings workspace) | desktop pilot is a later decision; layout lacks route guard (RC0-S3-02) |
| Introductions ops/analytics/deliveries consoles | admin/ops surfaces, not pilot-user value |
| Relationship Memory explorer UI | desktop-only surface (BC-9.1 C1) |
| Meetings domain UI | not part of mobile pilot surface |
| Marketplace, Referral, Invitation, Chat, AI Chat, Community Feed, Community AI, Event Recommendations, Opportunity Matching, Follow | **FEATURE FREEZE — do not build** |
| Generic `/ai` assistant + its mock provider | different product, not Business Connect |
| Event creation / opportunity creation | explicitly deferred (7B stop condition) |

## 4. Pilot preconditions (all must be true)

1. **RC0-S0-01 fixed** — AI endpoints require auth + per-user rate limit.
2. **RC0-S2-01 fixed** — internal hooks use cron secret, not anon key.
3. **RC0-S2-02 fixed** — automated test baseline green again (or every remaining red individually documented as non-product with owner + date).
4. Lint gate green (prettier autofix + 4 minors).
5. Route metadata fixed (4× 7B routes + `me/card` + `/card/$code`).
6. **7/7 UAT gates** in `BC_RC0_DEVICE_BROWSER_MATRIX.md` §4 completed and evidenced.
7. Pilot cohort ≤ agreed size; rollback plan = revert publish + feature flags unchanged.
8. Staging environment provisioned OR staging e2e suites formally deferred with sign-off.

## 5. Pilot success signals (observability already in code)

- Telemetry allowlists only (no PII): community `COMMUNITY_*`, personalization, card-scan funnel metrics.
- Ops tables exist for introductions/notification runtimes (consumer runs, deadletters) — monitor during pilot.
- No new telemetry may be added during pilot prep (feature freeze).
