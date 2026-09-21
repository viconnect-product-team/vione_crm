# BC-RC1 — CHANGE MANIFEST

> Chế độ: **FIX-ONLY**. FEATURE FREEZE: ACTIVE.
> Manifest này được tạo **TRƯỚC** khi sửa bất kỳ dòng code nào (§3).
> Mọi file bị sửa trong RC1 phải có mục tương ứng tại đây. Không thay đổi nào ngoài manifest.

## Nguyên tắc phạm vi (§2)

- Chỉ sửa: S0-01, S2-01, S2-02 (baseline test), S4-01 (lint/prettier), và các drift contract tối thiểu bắt buộc để test guardrail xanh trở lại (graph boundary, RM barrel, auth allowlist).
- KHÔNG tạo phân hệ mới, KHÔNG thêm route, KHÔNG redesign UI, KHÔNG mở rộng surface công khai.
- KHÔNG sửa các vấn đề RC0 còn mở khác (S3-01 metadata 7B, S4-* content tests, S5-01 device gap...) — lùi sang phase sau.

## Phân loại test (§17)

- A = Test Drift (implementation đúng, hợp đồng đổi có chủ đích) → sửa test, giữ nguyên hợp đồng.
- B = Product Regression → sửa production tối thiểu.
- C = Stale/Legacy → cập nhật hoặc loại bỏ có biện minh.
- D = Environmental (staging e2e từ chối chạy trên prod host) → KHÔNG sửa, ghi nhận "not runnable locally by design".
- E = Flaky → vá ổn định tối thiểu hoặc ghi nhận.

Chi tiết: `docs/mobile/BC_RC1_TEST_FAILURE_LEDGER.md`.

---

## M-01 · S0-01 — Xác thực 2 AI endpoint card

| Trường | Giá trị |
|---|---|
| File sửa | `src/lib/card-ai.functions.ts` |
| Loại | Blocker bảo mật S0 |
| Vấn đề | `analyzeCardImage` và `recommendOptimalTemplate` không có middleware xác thực → gọi ẩn danh tiêu tốn quota AI, không có rate limit. |
| Thay đổi | (1) Thêm `.middleware([requireSupabaseAuth])` cho cả hai; (2) identity lấy từ `context.userId`/`context.supabase`, không bao giờ từ input client; (3) gắn rate limit canonical `checkAiRateLimit` (bucket theo userId; associationId resolve mềm, fallback bucket khi user chưa thuộc hiệp hội — giữ tương thích card builder); (4) giữ nguyên fail-closed khi thiếu `LOVABLE_API_KEY`. |
| Biện minh | Đóng lỗ hổng chi phí AI; rate limit gắn với danh tính đã xác thực (§7). |
| Blast radius | Chỉ 2 server functions; caller duy nhất là `AiCardImportModal` trong `/connect` (đã auth-guarded) → không đổi UX hợp lệ; anonymous giờ nhận 401. |
| Không tương thích ngược | Anonymous call bị chặn — đúng mục tiêu sửa. |
| Rủi ro | User chưa liên kết hội viên/hiệp hội: rate-limit fallback bucket, KHÔNG throw — tránh vỡ flow card builder. |
| Test | Cập nhật `src/__tests__/api-auth-guardrails.test.ts` (2 hàm rời khỏi allowlist, middleware được assert); thêm `src/__tests__/card-ai-auth.rc1.test.ts` (middleware + rate-limit wiring + không lộ provider secret phía client + fail-closed). |

## M-02 · S2-01 — Xác thực internal hooks bằng cron secret

| Trường | Giá trị |
|---|---|
| File sửa | `src/routes/api/public/hooks/outcome-consumer.ts`, `src/routes/api/public/hooks/timeline-projection.ts`, **mới** `src/lib/hooks/cron-auth.ts` |
| Loại | Blocker bảo mật S2 |
| Vấn đề | Hai hook xác thực bằng anon key công khai (`ANON_KEYS`) → bất kỳ ai cũng kích hoạt được internal job. |
| Thay đổi | (1) Tạo helper dùng chung `authorizeCronRequest(request, envVar)` — Bearer + timing-safe compare + fail-closed khi thiếu env (y hệt pattern `notification-runtime.ts`); (2) cả hai hook export `authorize()` và gọi nó TRƯỚC khi import consumer service (auth trước side-effect); (3) xoá hoàn toàn nhánh chấp nhận anon key; (4) tên env: `OUTCOME_CONSUMER_CRON_SECRET`, `TIMELINE_PROJECTION_CRON_SECRET`. |
| Biện minh | §11/§12: tái sử dụng pattern notification-runtime; caller nội bộ phải có secret riêng, không được dùng anon key. |
| Blast radius | 2 endpoint `/api/public/hooks/*`; external cron caller phải mang secret mới. |
| Không tương thích ngược | Caller cũ dùng anon key nhận 401 — đúng mục tiêu; pg_cron job hiện tại sẽ 401 → xử lý tại M-03. |
| Rủi ro | Quên provision secret → endpoint fail-closed (an toàn theo mặc định). |
| Test | Thêm `src/__tests__/hooks-cron-auth.rc1.test.ts`: thiếu header/sai secret/anon key/malformed/thiếu env đều từ chối; secret đúng được chấp nhận; auth chạy trước consumer logic (static order check). |

## M-03 · S2-01 — Vô hiệu hoá pg_cron job gọi bằng anon key

| Trường | Giá trị |
|---|---|
| File sửa | **mới** `supabase/migrations/<ts>_rc1_unschedule_timeline_projection.sql` |
| Loại | Migration thu hẹp phạm vi (§13) |
| Vấn đề | `cron.schedule('relationship_timeline_projection_minutely', ...)` (migration 20260715112354) gọi hook bằng anon key → sau M-02 sẽ 401 mỗi phút (noise + job chết). |
| Thay đổi | `SELECT cron.unschedule('relationship_timeline_projection_minutely');` kèm comment: re-arm là yêu cầu deploy (cấu hình lại bằng `TIMELINE_PROJECTION_CRON_SECRET`). |
| Biện minh | Không xoá bảng, không sửa dữ liệu, chỉ gỡ scheduler dùng credential đã bị loại bỏ. |
| Blast radius | Projection timeline quan hệ ngừng chạy định kỳ cho tới khi re-arm; endpoint vẫn hoạt động khi được gọi đúng secret. |
| Không tương thích ngược | Có (job dừng) — chấp nhận được trong RC, ghi vào closure report + RC1 deploy notes. |
| Rủi ro | Dashboard timeline quan hệ có thể trễ dữ liệu — không ảnh hưởng tính đúng đắn (projection là read-model). |
| Test | Không có runtime test (external scheduler); kiểm chứng bằng migration áp dụng thành công. |

## M-04 · S2-02 — Phục hồi baseline test

| Trường | Giá trị |
|---|---|
| File sửa | Các file test liệt kê trong `BC_RC1_TEST_FAILURE_LEDGER.md` + tối đa 2 sửa production ranh giới (xem M-05/M-06) |
| Loại | Test governance |
| Thay đổi | Sửa theo phân loại A/C/E từng failure; B (regression thật) chỉ sửa production khi có bằng chứng và ghi rõ tại đây trước khi sửa. |
| Test | Toàn bộ suite phải xanh trừ nhóm D (staging-gated, ghi nhận). |

## M-05 · Contract — ranh giới graph internals (graph-verification.bc41v)

| Trường | Giá trị |
|---|---|
| File sửa | Tối đa các file consumer vi phạm (ví dụ `src/lib/business-connect/mobile/person-journey.server.ts`, `src/lib/connection/service.server.ts`) — chỉ đổi đường import sang entrypoint được phép. |
| Loại | Architectural correction |
| Biện minh | Test guardrail đang đỏ; import sang module được phép với cùng symbol → không đổi hành vi runtime. |
| Blast radius | Chỉ đường import. Test: `graph-verification.bc41v` xanh. |

## M-06 · Contract — RM client-safe barrel (relationship-memory-ui-security.bc91)

| Trường | Giá trị |
|---|---|
| File sửa | `src/components/business-connect/relationship-memory/RelationshipMemoryExplorer.tsx` (đổi import `search-dto` sang barrel). |
| Loại | Architectural correction |
| Biện minh | Guardrail đỏ; barrel đã re-export symbol → đổi dòng import, không đổi hành vi. |
| Blast radius | 1 dòng import. Test: `relationship-memory-ui-security.bc91` xanh. |

## M-07 · S4-01 — Lint/prettier baseline

| Trường | Giá trị |
|---|---|
| File sửa | Các file có formatting drift (`eslint --fix` thuần prettier) |
| Loại | Toolchain baseline |
| Thay đổi | Chạy fix tự động; KHÔNG chỉnh tay nội dung logic. Lỗi không auto-fix được (≤4) xử lý riêng hoặc ghi nhận với baseline chính xác. |
| Test | `bun run lint` exit 0 hoặc baseline được ghi rõ trong closure report. |

## Ngoài phạm vi RC1 (ghi nhận, KHÔNG sửa)

- S3-01 metadata/noindex route 7B · S4-* content/dead-tests · S5-01 physical device gap · S5-02 UAT · D-group staging e2e.
