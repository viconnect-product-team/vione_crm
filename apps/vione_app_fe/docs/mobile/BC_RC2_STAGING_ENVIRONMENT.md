# BC-RC2 — STAGING ENVIRONMENT REPORT

Ngày: 2026-08-11 · Mode: STAGING VERIFICATION · Feature freeze: ACTIVE
Phân loại môi trường: **BLOCKED**

## 1. Kết luận nhanh

Không tồn tại backend staging riêng biệt cho dự án. Backend duy nhất mà môi trường thực thi
truy cập được chính là **backend production** — host này nằm trong `PRODUCTION_HOST_DENYLIST`
của `src/__tests__/helpers/test-env.ts`, nên 16 suite live-DB tự từ chối chạy (đúng thiết kế).
RC2 không thể tạo bằng chứng L2/L3 hợp lệ mà không vi phạm §4 (cấm mock, cấm chạy vào production).

## 2. Kiểm kê tài nguyên (chỉ ghi TÊN, không ghi giá trị bí mật)

| Hạng mục | Tên biến / nguồn | Trạng thái |
|---|---|---|
| Frontend preview | Preview URL của dự án | CÓ (trỏ backend production) |
| Frontend published | Published URL | CÓ (production) |
| Supabase URL runtime | `SUPABASE_URL` / `VITE_SUPABASE_URL` | CÓ — **là host production** |
| Staging Supabase URL | `STAGING_SUPABASE_URL` | **KHÔNG CÓ** |
| Staging anon key | `STAGING_SUPABASE_PUBLISHABLE_KEY` | **KHÔNG CÓ** |
| Staging service role | `STAGING_SUPABASE_SERVICE_ROLE_KEY` | **KHÔNG CÓ** |
| Cờ môi trường test | `SUPABASE_TEST_ENV` | **KHÔNG ĐẶT** (cần `staging`) |
| Service role hiện có | `SUPABASE_SERVICE_ROLE_KEY` | CÓ nhưng thuộc **production** → cấm dùng cho test |
| Tài khoản test A/B/C | `TEST_USER_*` | **KHÔNG CÓ** |
| Phiên trình duyệt xác thực | `LOVABLE_BROWSER_AUTH_STATUS` | `signed_out` → không có session thật |
| Storage / server functions / OCR gateway / cron secrets | chỉ tồn tại trên production | Không có bản staging |

## 3. Production-resource coupling check

Mọi biến backend trong sandbox đều trỏ tới host production `…supabase.co` của dự án.
Không phát hiện request test nào đã thực sự đánh vào production: guard
`requireStagingSupabase()` chặn trước, và 16 suite live-DB dừng ở mức file.
Vì vậy **không ghi nhận S2 blocker do coupling**, nhưng ghi nhận **thiếu tách môi trường** —
đây chính là nguyên nhân RC2 bị chặn.

## 4. Hạ tầng CI đã sẵn sàng cho RC2

`.github/workflows/pr-integration.yml` đã có job dùng GitHub Environment `staging`, đọc
`STAGING_SUPABASE_URL` / `_PUBLISHABLE_KEY` / `_SERVICE_ROLE_KEY`, và abort nếu URL trỏ host
production. Nghĩa là **thiếu duy nhất tài nguyên staging**, không thiếu hạ tầng test.

## 5. Điều kiện để mở khoá RC2

1. Cấp một dự án Supabase **staging** riêng (tách hoàn toàn khỏi production).
2. Áp toàn bộ migration của repo lên staging và xác minh function/trigger/index/RLS/policy/storage policy.
3. Nạp 3 secret staging vào CI/môi trường chạy test + đặt `SUPABASE_TEST_ENV=staging`.
4. Tạo 3 tài khoản test tổng hợp USER_A / USER_B / USER_C trên staging (không dùng user thật).
5. Trỏ một frontend staging (preview build) vào backend staging để chạy authenticated E2E.

Khi đủ 5 điều kiện, RC2 chạy được nguyên vẹn theo §7–§40 mà không cần đổi code sản phẩm.

## 6. Việc KHÔNG làm (tuân thủ §4)

Không mock Supabase, không giả auth, không tắt RLS, không hardcode identity, không chạy suite
mutating vào production, không bịa bằng chứng L2/L3.

---

## 7. Cập nhật provisioning — BC-INFRA-STG-01 (2026-08-11)

Phần §1–§6 ở trên GIỮ NGUYÊN làm bằng chứng gốc: RC2 = BLOCKED.

Trạng thái mới sau turn hạ tầng BC-INFRA-STG-01:

| Hạng mục | Trạng thái |
|---|---|
| Dự án Supabase staging | CHƯA TẠO — cần thao tác thủ công (control-plane ngoài quyền môi trường) |
| Kiểm kê migration | XONG — 170 file, đầu `20260609011902`, cuối `20260811113036` |
| Danh sách bucket bắt buộc | XONG — product-media, association-logos, documents, relationship-moments |
| Edge function riêng | KHÔNG CÓ — server logic chạy qua createServerFn / routes `src/routes/api/**` |
| Template biến môi trường | XONG — `.env.staging.example` (chỉ TÊN biến) |
| Runbook staging | XONG — `docs/mobile/BC_STAGING_RUNBOOK.md` |
| Báo cáo readiness | XONG — `docs/mobile/BC_INFRA_STG_01_CLOSURE_REPORT.md` |
| Guard chặn production | GIỮ NGUYÊN, không nới lỏng |
| RC2 | VẪN KHOÁ |

Verdict hạ tầng: **BC-INFRA-STG-01 CONDITIONAL PASS — MANUAL PROVISIONING REMAINS**.
