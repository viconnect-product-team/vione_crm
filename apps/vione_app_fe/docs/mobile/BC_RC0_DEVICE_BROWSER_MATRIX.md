# BC-RC0 — Device & Browser Coverage Matrix

Purpose: make the current coverage **visible and honest**. "DOM-tested" means layout/markup assertions in jsdom at fixed viewport widths; it is **not** device evidence. No physical-device evidence exists anywhere in the repository as of RC0.

## 1. Environment coverage summary

| Environment | Coverage to date | Evidence |
|---|---|---|
| Chromium (Playwright, sandbox, headless) | ⚠️ Partial — used for BRD/doc verification and some visual gates; no full-app walkthrough captured for BC surfaces | 1B/2B gate notes |
| jsdom viewport widths 375 / 390 / 430 / 480 px | ✅ Layout assertions only | `BC_MOBILE_1B_HOME_VISUAL_GATE.md`, `bcm1b` suite |
| Physical Android (Chrome) | ❌ None | — |
| Physical iOS (Safari) | ❌ None | — |
| Desktop Chrome / Safari / Firefox / Edge | ❌ None | — |
| PWA installed (iOS home screen / Android) | ❌ None | — |
| NFC hardware (real tag write + tap) | ❌ None | 5B/5C UAT gate OPEN |
| Camera capture (real card scan) | ❌ None | 4B UAT gate OPEN |

## 2. Surface × environment matrix

Legend: ✅ verified · ⚠️ partial (DOM/simulator only) · ❌ not tested · ➖ not applicable

| Surface | jsdom DOM | Chromium sandbox | Android Chrome (physical) | iOS Safari (physical) | Desktop browsers | PWA installed |
|---|---|---|---|---|---|---|
| `/connect-app` Home | ✅ 375–480px | ⚠️ | ❌ | ❌ | ➖ (mobile-first) | ❌ |
| Network list / person / timeline | ✅ | ⚠️ | ❌ | ❌ | ➖ | ❌ |
| Moment capture (camera/media) | ✅ markup | ⚠️ | ❌ | ❌ | ➖ | ❌ |
| Card scan (camera → OCR → review → save) | ✅ markup | ⚠️ | ❌ **gate OPEN** | ❌ **gate OPEN** | ➖ | ❌ |
| Me / identity / QR present | ✅ | ⚠️ | ❌ | ❌ | ➖ | ❌ |
| NFC write + tap | ➖ needs hardware | ➖ | ❌ **gate OPEN** | ➖ iOS limits (no Web NFC — documented) | ➖ | ➖ |
| Public card `/c/$token` (anonymous) | ✅ | ⚠️ | ❌ **gate OPEN** | ❌ **gate OPEN** | ❌ | ➖ |
| Connection handshake (two accounts) | ✅ suites | ⚠️ | ❌ **gate OPEN** | ❌ | ➖ | ❌ |
| Relationship intel 6A/6B/6C | ✅ | ⚠️ | ❌ **gate OPEN** | ❌ | ➖ | ❌ |
| Community 7A (directory/profile/connect) | ✅ | ⚠️ | ❌ **gate OPEN** | ❌ | ➖ | ❌ |
| Community 7B (events/opportunities/register/interest) | ✅ incl. cache-isolation | ⚠️ | ❌ **gate OPEN** | ❌ | ➖ | ❌ |
| Desktop `/business-connect/*` | ✅ | ⚠️ | ➖ | ➖ | ❌ | ➖ |

## 3. Known platform constraints (documented, not bugs)

- **iOS has no Web NFC** — NFC write/tap is Android-Chrome-only by platform design (5B capability matrix). iOS falls back to QR/share link.
- Background tag reading is OS-level and out of scope (5B non-goals).
- Camera capture requires HTTPS + permission grant; jsdom/sandbox cannot validate the real capture pipeline.

## 4. Minimum UAT matrix required before pilot

| Gate (from `BC_MOBILE_RELEASE_GATES.md`) | Minimum evidence required | Status |
|---|---|---|
| OCR / device / browser | Real card scan on ≥1 Android + ≥1 iOS device; capture → candidate → save end-to-end | **OPEN** |
| Physical NFC | Write tag from app on Android; tap with a second device; public card resolves | **OPEN** |
| Public Card device | `/c/$token` render + Save Contact (vCard) on Android + iOS | **OPEN** |
| Two-user Connection | Two live accounts: request → accept → connected state both sides | **OPEN** |
| Relationship Intelligence 6A/6B/6C | Recommendations render; dismiss/snooze; tel:/mailto: handoffs on device | **OPEN** |
| Community 7A | Directory → member profile → connect on device | **OPEN** |
| Community 7B | List/detail, register, check-in handoff, interest, account-switch spot check | **OPEN** |

Recommended minimum device set for pilot entry: 1× Android (current Chrome), 1× iPhone (current Safari), 1× desktop Chrome. PWA install smoke test on both phones.
