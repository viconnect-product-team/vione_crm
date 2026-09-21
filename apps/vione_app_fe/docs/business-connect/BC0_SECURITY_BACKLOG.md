# BC0_SECURITY_BACKLOG — Prioritized P0/P1 Hardening (BC-0.3)

Documentation-only. Findings ranked against gates: **A** BC-1 dev · **B** internal
demo · **C** external pilot · **D** production launch. Severity: Critical/High/Med/Low.
Blocking = the latest gate that must not pass with the finding open.

Format per finding: Severity · Exploit · Affected · Recommended phase · Impact · Blocking.

---

## P0 — Critical / High (address before external pilot at latest)

### SEC-01 — Direct anon SELECT on Business Card tables (P0-A)

- **Severity:** Critical.
- **Exploit:** anon scrapes raw `member_business_cards` rows (36 cols) +
  needs/services/skills, harvesting fields beyond the intended public projection
  (any private contact/analytics columns present on the row), bypassing
  `visibility_settings`.
- **Affected:** `member_business_cards`, `business_card_needs/services/skills`
  anon SELECT policies (verified present).
- **Recommended phase:** BC0_PUBLIC_ACCESS_HARDENING_PLAN stages 1–4.
- **Impact:** migration (drop policies) + code (server-fn projection) + tests.
- **Blocking:** **C (external pilot).** Acceptable for A/B behind internal-only data.

### SEC-02 — Unresolved legacy card ownership (case C)

- **Severity:** High.
- **Exploit:** ambiguous/guessed `owner_user_id` backfill assigns a card to the
  wrong user → privilege confusion / data disclosure.
- **Affected:** `member_business_cards` (legacy rows w/ `member_id`, null owner).
- **Recommended phase:** ADR-BC-003 stage 2 backfill (unique valid mapping only;
  report the rest).
- **Impact:** migration (additive column + guarded backfill) + report artifact + tests.
- **Blocking:** **A (BC-1 dev)** for the ownership-migration step; unresolved rows
  must be reported, never guessed.

### SEC-03 — Membership Identity pass exposure

- **Severity:** High.
- **Exploit:** pass secret / QR signature leaked via over-broad read or public
  path → forged verification.
- **Affected:** `member_identity_passes`, verify fns (SECURITY DEFINER + service).
- **Recommended phase:** confirm verify RPC returns safe fields only; ensure BC
  card QR is never treated as identity verification (invariant 9).
- **Impact:** audit + possible projection tightening + test.
- **Blocking:** **C.**

### SEC-04 — Campaign/lead PII scope

- **Severity:** High.
- **Exploit:** cross-member/cross-assoc read of `business_card_leads` (requester
  PII) or `email_campaigns` recipient lists.
- **Affected:** `business_card_leads`, `campaigns`/`email_campaigns`.
- **Recommended phase:** verify owner/manager-only reads hold under real separate
  JWTs (no anon — currently correct); add regression tests.
- **Impact:** tests (+ policy fix only if a gap is found).
- **Blocking:** **C.**

---

## P1 — Medium (address before production launch)

### SEC-05 — Cross-user / cross-association test coverage gap

- **Severity:** Med.
- **Exploit:** undetected RLS regression allows P3 (assoc B) to read assoc A data.
- **Affected:** all model-B tables + card family.
- **Recommended phase:** expand `multi-tenant-rls`/`rls-ownership` with **real
  separate sessions/JWTs** per persona (P0–P11).
- **Impact:** tests only.
- **Blocking:** **D.**

### SEC-06 — SECURITY DEFINER execute-grant review

- **Severity:** Med.
- **Exploit:** an over-granted definer fn (e.g. anon EXECUTE on a member helper)
  becomes an unauthenticated data/action path.
- **Affected:** all definer fns (db-functions list) — esp. `net_*`,
  `log_business_card_member_event`, `add_member_notification`, verify fns.
- **Recommended phase:** inventory EXECUTE grants; least-privilege per ADR-BC-004
  §9; each definer sets safe `search_path` (verified: all current ones do) and
  validates auth/role/scope internally.
- **Impact:** possible `REVOKE`/`GRANT` migration + tests.
- **Blocking:** **D.**

### SEC-07 — Admin/service-client authorization

- **Severity:** Med.
- **Exploit:** a `createServerFn` using `supabaseAdmin` without caller
  authorization becomes a public privileged endpoint on the published site.
- **Affected:** server fns importing `client.server` (e.g. public-card
  service-role gate, AI runtime override read).
- **Recommended phase:** confirm every admin-client server fn either is verified
  public-read-safe or gates on `requireSupabaseAuth` + role check.
- **Impact:** code review + tests (`api-auth-guardrails.test.ts` coverage).
- **Blocking:** **C** for any write path; **D** for reads.

### SEC-08 — Global user without member row behavior

- **Severity:** Med.
- **Exploit:** P1 hitting member-scoped RPC crashes or leaks instead of clean deny.
- **Affected:** `resolveMemberId` throw path, `net_*` "No member profile".
- **Recommended phase:** ensure BC (global) functions never require
  `current_member_id()`; explicit safe errors on association paths.
- **Impact:** code (BC functions use GlobalIdentityContext) + tests.
- **Blocking:** **A** for new BC features.

### SEC-09 — Public storage exposure (future card/community media)

- **Severity:** Med.
- **Exploit:** public bucket serving private media, or path-only trust letting a
  user write into another scope's folder.
- **Affected:** future global-profile/card/community buckets (current buckets are
  private — no current exposure).
- **Recommended phase:** storage contract in ADR-BC-004 §8 / matrix — server-
  validated path identity, signed URLs for private media.
- **Impact:** bucket + policy migration + tests when media features land.
- **Blocking:** **C** for any public media feature.

---

## Summary by gate

- **Before A (BC-1 dev):** SEC-02 (backfill guard), SEC-08 (global-user paths).
- **Before C (external pilot):** SEC-01, SEC-03, SEC-04, SEC-07(writes), SEC-09.
- **Before D (production):** SEC-05, SEC-06, SEC-07(reads), remaining P1.
