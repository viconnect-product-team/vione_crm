# BC-INFRA-STG-01 — STAGING READINESS CLOSURE REPORT

Ngày: 2026-08-11 · Mode: INFRA-ONLY · Feature freeze: ACTIVE

## Verdict

**BC-INFRA-STG-01 CONDITIONAL PASS — MANUAL PROVISIONING REMAINS**

Toàn bộ phần hạ tầng có thể làm bằng repo/tài liệu đã hoàn tất. Việc tạo dự án
Supabase staging (control-plane) và cấu hình GitHub Environment nằm ngoài quyền
của môi trường thực thi hiện tại — chỉ có đúng một backend production được quản
lý. Không dự án staging nào được tạo, và không hề giả vờ đã tạo.

## Production isolation

VERIFIED (không đổi). `PRODUCTION_HOST_DENYLIST` trong
`src/__tests__/helpers/test-env.ts` giữ nguyên, không bị nới lỏng. Không có
migration/seed/mutating test nào chạy vào production trong turn này.

## Staging project

MANUAL_PROVISIONING_REQUIRED. Chưa tồn tại project ref staging.

## Frontend staging

NOT PROVISIONED. Yêu cầu và cấu hình đã ghi trong runbook §12.

## Database / Migration status

PENDING. Nguồn migration đã kiểm kê: 170 file trong `supabase/migrations/`,
đầu `20260609011902_*.sql`, cuối `20260811113036_*.sql`. Quy trình áp dụng:
`supabase db push` (không dựng schema thủ công, không cherry-pick).

## RLS

PENDING trên staging. Truy vấn xác minh (`pg_class.relrowsecurity`,
`pg_policies`) đã ghi trong runbook §6. Không policy nào bị nới lỏng.

## Storage

PENDING. Danh sách bucket bắt buộc rút từ code: `product-media`,
`association-logos`, `documents`, `relationship-moments`. Không copy object
production.

## Server / edge functions

Repo **không có** `supabase/functions/*`. Logic máy chủ chạy qua
`createServerFn` và server routes `src/routes/api/**`, deploy cùng frontend
staging. Do đó không có bước deploy edge function riêng.

## Auth

PENDING. Cấu hình email/password + redirect URL staging theo runbook §9.

## USER_A / USER_B / USER_C

NOT CREATED. Chỉ danh tính tổng hợp, tạo bằng service role staging, credential
lưu trong secret store (tên biến trong `.env.staging.example`).

## Synthetic seed state

NOT SEEDED. Bộ dữ liệu tối thiểu và tiền tố `RC2-` đã đặc tả (runbook §11).

## AI / internal secrets

Tên bắt buộc: `LOVABLE_API_KEY`, `NOTIFICATION_RUNTIME_CRON_SECRET`,
`OUTCOME_CONSUMER_CRON_SECRET`, `TIMELINE_PROJECTION_CRON_SECRET`,
`IDENTITY_QR_SIGNING_SECRET`. Giá trị staging phải sinh mới. Ràng buộc RC1 giữ
nguyên trong code: endpoint AI yêu cầu auth, job nội bộ không chấp nhận anon key.

## GitHub staging environment

INFRA READY / SECRETS MISSING. `.github/workflows/pr-integration.yml` đã dùng
Environment `staging`, đặt `SUPABASE_TEST_ENV=staging`, kiểm tra đủ 3 secret.

## Production deny guard

PASS. Workflow abort khi `STAGING_SUPABASE_URL` chứa host production; test
`src/__tests__/test-env-guard.test.ts` khẳng định guard từ chối host production
kể cả khi có `SUPABASE_TEST_ENV=staging`.

## Test environment flag

Đã đặc tả `SUPABASE_TEST_ENV=staging`; chưa set trong runtime hiện tại vì chưa
có backend staging.

## Smoke tests / Auth smoke

NOT RUN (không có target staging). Quy trình 5 bước đã ghi runbook §14.

## Production coupling

Không phát hiện đường ghi nào của staging chạm production, vì staging chưa tồn
tại. Mọi biến backend trong sandbox vẫn trỏ production và bị guard chặn ở test.

## Secret leak check

VERIFIED. Tài liệu và template chỉ chứa TÊN biến. Service role/AI/cron secret
chỉ đọc qua `process.env` trong handler máy chủ, không vào bundle frontend.

## Remaining blockers (manual)

1. Tạo dự án Supabase staging riêng, ghi lại project ref.
2. Áp 170 migration bằng `supabase db push`, xác minh bảng/RLS/policy/storage.
3. Tạo 4 bucket staging và áp policy storage.
4. Nạp tên secret theo `.env.staging.example` vào runtime staging + GitHub
   Environment `staging` (3 secret `STAGING_*`).
5. Bật Auth email/password, cấu hình Site URL + redirect staging.
6. Tạo USER_A/B/C tổng hợp, lưu credential trong secret store.
7. Seed dữ liệu `RC2-` tối thiểu.
8. Deploy frontend staging trỏ 100% backend staging, chốt canonical host.
9. Chạy smoke + auth smoke theo runbook §14.

## RC2 unlock status

**NO** — RC2 vẫn khoá cho tới khi 9 mục thủ công ở trên hoàn tất và validation
được chạy lại.
