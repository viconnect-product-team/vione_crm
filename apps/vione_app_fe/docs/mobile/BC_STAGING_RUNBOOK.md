# BC — STAGING RUNBOOK (BC-INFRA-STG-01)

Tài liệu vận hành môi trường staging cho Business Connect PWA.
**Không bao giờ ghi giá trị bí mật vào tài liệu này — chỉ ghi TÊN biến.**

## 1. Kiến trúc mục tiêu

```text
Frontend staging (deploy riêng)
        |
        v
Supabase STAGING (ref riêng)
   |-- Auth (user tổng hợp RC2-*)
   |-- PostgreSQL + RLS
   |-- Storage buckets
   |-- RPC / functions
   `-- dữ liệu test tổng hợp
```

Tách biệt hoàn toàn với production: khác project ref, khác database, khác Auth
user, khác storage, khác service role key. Không dùng schema khác trong DB
production làm staging.

## 2. Mô hình triển khai hiện tại (đã kiểm chứng trong repo)

| Hạng mục | Cơ chế thực tế |
|---|---|
| Migration | 170 file SQL trong `supabase/migrations/`, chạy theo thứ tự tên file (timestamp). Đầu: `20260609011902_*.sql`. Cuối: `20260811113036_*.sql`. |
| Logic máy chủ | TanStack Start `createServerFn` + server routes `src/routes/api/**` (deploy cùng frontend). Không có thư mục `supabase/functions` → không có edge function cần deploy riêng. |
| Job nội bộ | `POST /api/public/hooks/notification-runtime`, `/outcome-consumer`, `/timeline-projection`, xác thực Bearer bằng cron secret. |
| Storage | Bucket dùng trong code: `product-media`, `association-logos`, `documents`, `relationship-moments`. |
| Cấu hình frontend | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`. |
| Guard môi trường test | `src/__tests__/helpers/test-env.ts` (`PRODUCTION_HOST_DENYLIST`, `requireStagingSupabase`). |
| CI | `.github/workflows/pr-integration.yml`, GitHub Environment `staging`. |

## 3. Biến môi trường (chỉ TÊN)

Xem `.env.staging.example`. Bắt buộc tối thiểu:
`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`SUPABASE_TEST_ENV=staging`, `VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY`, và trong CI:
`STAGING_SUPABASE_URL`, `STAGING_SUPABASE_PUBLISHABLE_KEY`,
`STAGING_SUPABASE_SERVICE_ROLE_KEY`.

Bí mật máy chủ theo RC1: `LOVABLE_API_KEY`,
`NOTIFICATION_RUNTIME_CRON_SECRET`, `OUTCOME_CONSUMER_CRON_SECRET`,
`TIMELINE_PROJECTION_CRON_SECRET`, `IDENTITY_QR_SIGNING_SECRET` — mỗi giá trị
phải sinh mới cho staging, không tái sử dụng giá trị production.

## 4. Tạo dự án staging

1. Tạo dự án Supabase mới, tên gợi ý `qlhh-staging`, region giống production.
2. Ghi lại project ref (khác ref production).
3. Xác nhận host staging KHÔNG nằm trong `PRODUCTION_HOST_DENYLIST`.
   Khuyến nghị host/alias chứa chuỗi `staging` để guard tự nhận diện.

## 5. Áp migration

```bash
supabase link --project-ref <STAGING_REF>
supabase db push            # chạy toàn bộ supabase/migrations theo thứ tự
```

Không dựng lại schema thủ công, không cherry-pick bảng. Nếu một migration lỗi:
điều tra thứ tự/phụ thuộc/extension/function; không sửa DB thủ công để ép xanh.

## 6. Kiểm tra đối tượng DB sau migration

Xác minh sự tồn tại các miền: business cards, connections, guest contacts,
graph nodes/edges & timeline, meeting moments + moment media, community,
members, events, event registrations, opportunities, opportunity interests,
notifications và bảng xử lý nội bộ.

```sql
select table_name from information_schema.tables
where table_schema = 'public' order by 1;

select relname, relrowsecurity from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' order by 1;

select schemaname, tablename, policyname, qual
from pg_policies where schemaname = 'public' order by 1,2,3;
```

Yêu cầu: RLS bật trên mọi bảng public; không tồn tại policy tạm `USING (true)`
ngoài các bảng công khai có chủ đích. Không nới policy vì lý do tiện test.

## 7. Storage

Tạo bucket staging (private trừ khi production để public):
`product-media`, `association-logos`, `documents`, `relationship-moments`.
Áp lại policy `storage.objects` bằng migration trong repo. Không copy object
production.

## 8. Server functions / job nội bộ

Không có edge function riêng: server logic deploy cùng frontend staging.
Sau deploy, kiểm tra 3 endpoint hook trả 401 khi thiếu Bearer và 200/202 khi
đúng cron secret staging.

## 9. Auth

- Bật email/password.
- Redirect URL: `https://<staging-host>/`, `https://<staging-host>/auth/callback`.
- Site URL trỏ host staging.
- Không import Auth user production.

## 10. Tài khoản test

Tạo bằng service role key staging (script chạy cục bộ, không commit giá trị):

```bash
# ví dụ: dùng supabase admin API createUser với email_confirm=true
# rc2-user-a@staging.invalid / rc2-user-b@staging.invalid / rc2-user-c@staging.invalid
```

Vai trò: A = golden path chính, B = user đối kháng/kiểm tra cô lập,
C = ngữ cảnh Community/member khác. Credential chỉ nằm trong secret store.

## 11. Seed dữ liệu tối thiểu

Tiền tố bắt buộc `RC2-` (ví dụ `RC2 Community A`). Gồm: 1 digital card công
khai, 1 connection A–B, 1 saved card, 1 guest contact, 1 community + biến thể
membership, 1 event, 1 opportunity. Không seed sẵn kết quả mà RC2 phải tự tạo.

## 12. Frontend staging

Deploy một bản frontend riêng, biến build trỏ 100% sang staging. Host staging
phải ổn định để dùng cho OAuth callback, Public Card `/b/<slug>`, QR, VCF và
Playwright. Không dùng localhost làm mục tiêu RC2 cuối cùng. QR sinh ở staging
phải trỏ host staging.

## 13. CI

GitHub Environment `staging` chứa 3 secret:
`STAGING_SUPABASE_URL`, `STAGING_SUPABASE_PUBLISHABLE_KEY`,
`STAGING_SUPABASE_SERVICE_ROLE_KEY`. Workflow đã sẵn `SUPABASE_TEST_ENV=staging`
và abort nếu URL trỏ host production — giữ nguyên, không nới lỏng.

## 14. Smoke checks (không phá huỷ)

1. `GET https://<staging-host>/` → 200.
2. `GET <SUPABASE_URL>/auth/v1/health` → 200.
3. Đăng nhập USER_A → `auth.uid()` khớp user tổng hợp.
4. `GET /api/public/hooks/outcome-consumer` không kèm Bearer → 401.
5. Public route `/b/<slug>` của card seed → 200.

## 15. Reset / dọn dẹp

Xoá theo tiền tố `RC2-`, hoặc `supabase db reset` trên staging rồi chạy lại
migration + seed. Không bao giờ chạy reset khi biến môi trường trỏ production.
