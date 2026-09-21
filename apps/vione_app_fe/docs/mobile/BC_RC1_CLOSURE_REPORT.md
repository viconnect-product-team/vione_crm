# BC-RC1 — CLOSURE REPORT

Ngày đóng: 2026-08-11 · Mode: FIX-ONLY · Feature freeze: ACTIVE

## 1. Executive verdict

**BC-RC1 PASS — SECURITY BLOCKERS REMEDIATED, BASELINE GREEN.**
S0 = 0, S1 = 0, S2 = 0. Không còn test chạy được cục bộ nào đỏ. Các suite phụ thuộc live DB được hoãn tường minh sang RC2.

## 2. Feature-freeze compliance

Không thêm tính năng, không đổi IA route, không đổi hành vi Business Connect, không đổi kiến trúc backend. Thay đổi sản phẩm duy nhất: 2 boundary fix (RC1B) + 3 sửa lint an toàn (comment disable có lý do + bỏ escape thừa trong regex, tập ký tự không đổi).

## 3. RC1 timeline

RC0 audit → RC1 (bảo mật S0-01/S2-01 + ledger) → RC1B (áp ledger fixes) → RC1C (harness overview, lint, closure).

## 4. Initial RC0 findings

1× S0 (AI endpoint không xác thực), 2× S2 (cron anon key, 41 test đỏ), 362 lỗi lint, 18 open issues.

## 5–6. S0-01 remediation + evidence

`analyzeCardImage`, `recommendOptimalTemplate` gắn `requireSupabaseAuth` + rate limit; identity lấy từ context xác thực; secret provider chỉ ở server.
Evidence: `card-ai-auth.rc1.test.ts` + `api-auth-guardrails.test.ts` PASS.

## 7–8. S2-01 remediation + evidence

`outcome-consumer`, `timeline-projection` yêu cầu Bearer cron-secret riêng; anon key bị từ chối; pg_cron job dùng anon key đã gỡ.
Evidence: `hooks-cron-auth.rc1.test.ts` PASS.

Tổng khối bảo mật + guard: **272/272 PASS** (5 suite).

## 9–11. S2-02 accounting

- RC0: 41 fail. RC1B: còn 27 → 3. RC1C: 0 test chạy cục bộ còn đỏ.
- Product defects fixed: **2** (dead re-export `connection/service.server.ts`; import barrel `RelationshipMemoryExplorer.tsx` + sanctioned `findPersonNodeByExternalRef`).
- Test/harness drift corrected: **~25** (bcm1a, bcm1b, bcm0b, bc45, bcm2d, bcm4b, renewal static invariants, bcuit navigation/my-card/overview, bc90 policy).
- Legacy handled: 0.
- Environment deferred to RC2: **16 suite** live-DB E2E (renewal ×8, rls ×3, multi-tenant, platform-identity, business-cards-scoping, company-history-networking, networking-invite).
- Remaining locally runnable failures: **0**.

## 12–14. 3 overview failures + root cause + remediation

Root cause: **UPDATED_TEST_DRIFT — CONTRACT DRIFT**, không phải lỗi router. BC-8.0 đã trỏ `/business-connect` sang `WorkHubPage`; test vẫn assert bề mặt overview cũ (primary card, saved metrics). Route production đúng, không có `<html>` lồng nhau ở runtime thật (cảnh báo jsdom do RTL mount document shell).
Remediation: chỉ sửa test. Shard nay bảo vệ invariant thật của landing: (1) summary count đến từ DTO SDK, (2) previews rỗng → empty state chuẩn, (3) lỗi backend → vùng lỗi có retry và **không** làm mất nav shell. Server fn được stub ở ranh giới module (jsdom không fetch `/_serverFn`), đúng DTO thật. Không có hack production, không NODE_ENV check.

## 15. Renewal environment-deferred group

Giữ nguyên `ENV_DEFERRED_TO_RC2`: 8 suite renewal live-DB (10 static test PASS, 8 skip). Không mock DB, không làm giả xanh.

## 16–18. Contract guards

graph boundary (bc41v), Relationship Memory barrel (bc91), API guardrail: **PASS**, không nới lỏng.

## 19–21. Lint / prettier

- Trước: 365 error. Sau: **0 error / 45 warning** (warning nằm trong baseline `docs/tech-debt.md`).
- Formatting-only: phần lớn diff do `eslint --fix` (prettier) trên toàn repo — không đổi ngữ nghĩa.
- Semantic (3 file): `guest-contact.ts`, `vcard.ts` thêm `eslint-disable-next-line no-control-regex` kèm lý do bảo mật (regex giữ nguyên); `relationship-intelligence.ai.server.ts` bỏ escape thừa `\[` trong character class (tập ký tự khớp không đổi).
- Không sửa cấu hình lint/prettier, không tắt rule toàn cục.

## 22. Local Business Connect regression

Full suite: **2644 PASS / 101 skip / 9 fail dưới tải song song**; chạy lại độc lập 9 test này: 8 PASS (flaky do contention), 1 thật (bc90 policy) đã sửa bằng mock server fn → **0 lỗi chạy được cục bộ**. 16 suite live-DB lỗi ở mức file, hoãn RC2.

## 23–27. Gates

Security regression PASS · TypeScript (tsgo) PASS · i18n PASS (3685 key) · lint 0 error · production build PASS.

## 28. DB/schema impact

Không migration mới trong RC1C. RC1 trước đó chỉ gỡ pg_cron job dùng anon key.

## 29–32. Remaining severities

S0 = 0 · S1 = 0 · S2 = 0 · S3/S4 giữ nguyên (không xử lý theo freeze).

## 33–34. Staging & UAT

16 suite live-DB, thiết bị/trình duyệt thật, UAT staging: **vẫn OPEN**, thuộc phạm vi RC2.

## 35–37. RC2 unlock & verdict

**RC2 UNLOCKED.** Next phase đề xuất: BC-RC2 — STAGING INTEGRATION + AUTHENTICATED E2E (chưa bắt đầu).

**BC-RC1 PASS — SECURITY BLOCKERS REMEDIATED, BASELINE GREEN.**
