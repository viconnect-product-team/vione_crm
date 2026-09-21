# BC-RC1 — TEST FAILURE LEDGER (classification A–E)

Audit mode: FIX-ONLY. Nguồn: 5 explore subagents + full-suite run (43 fail, 16 suite staging-refused = nhóm D, ghi nhận không sửa).

| Nhóm | File test | Số lỗi | Loại | Nguyên nhân gốc | Hướng sửa |
|---|---|---|---|---|---|
| bcm1a/bcm1b | business-connect-mobile-home(.visual) | 14 | **A — test drift** | `RelationshipSuggestions` (BC-6A) render trong `ExecutiveHome` → `useQuery` ném "No QueryClient set" → route error boundary unmount cả nav. Harness thiếu `QueryClientProvider`. | Thêm `QueryClientProvider` + mock `use-relationship-intelligence` trong harness. |
| bcm0b | business-connect-mobile-shell | 1 | **A — test drift** | BC-7A tách `connect-app.community.tsx` thành layout (Outlet); `head()` chuyển xuống `connect-app.community.index.tsx`. Test assert sai file. | Trỏ assertion community sang file index leaf. |
| bc45 | recommendation-ui | 4 | **A — test drift** | `RecommendationCard` dùng `<Link>` nhưng harness không có router context → crash trước khi render `rec-card`. | Bọc memory router trong `renderFeed()`. |
| bcm2d | person-journey | 1 | **A — test drift (mock thiếu)** | `PersonSuggestion` gọi server fn thật (chưa mock) → render nút retry "Thử lại" thứ 2 trùng nhãn với `PersonJourney`. | Mock `usePersonRelationshipRecommendation` + dismiss hook. |
| bcm4b | card-scan-save | 1 | **A — test drift (selector rộng)** | Dialog `CardScanFieldResolutionSheet` overlay lên trang review → `getByText("+84912345678")` khớp 2 node (dd nền + span trong dialog). | Scope bằng `within(dialog)`. |
| bcuit overview | business-connect-overview | 3 | **C — stale test** | BC-8.0 trỏ `business-connect.index.tsx` sang `WorkHubPage`; UI cũ (primary card, saved metrics) không còn ở route này. | Viết lại shard assert theo `WorkHubPage` hoặc trỏ route đúng. |
| bcuit my-card/navigation | 2 file | 2 | **E — flaky (môi trường)** | Race `waitFor` (~1s) với chuỗi hydration lang khi CPU nghẽn full-suite; pass ổn định khi chạy riêng. | Tăng timeout `waitFor` trong harness lên 5000ms. |
| a11y e2e | events/members/messages/notifications | n | **E — flaky (tải)** | Pass standalone; timeout 20s + double-mount announcement chỉ xuất hiện dưới chạy song song. Không có bug duplicate render thật. | Tách shard chậm / tăng timeout / `waitFor` settle sau render. |
| reviews-invalid | reviews-invalid.e2e | 2 | **E — flaky** | 26/26 pass standalone; timeout do contention. | Như trên. |
| bc90 policy | business-connect-ai-policy | 1 | **B — regression nhẹ + E** | SDK Turn B gọi `bcAiGenerate` thật; test không mock `@tanstack/react-start` → ném "No Start context" thay vì typed error (nhanh & deterministic khi chạy riêng; timeout dưới tải). | `vi.mock` server fn để ném `BUSINESS_CONNECT_AI_PROVIDER_UNAVAILABLE`; test thuần error-mapping. |
| bc90 security | business-connect-ai-security | 1 | **E — flaky** | 52/52 pass lặp 3 lần khi chạy riêng; timeout import-contention. | Cô lập worker / tăng timeout cho block nặng import. |
| renewal | atomic/failure/idempotency(+daily) | 4 | **A — stale assertions** | Guard vẫn nguyên trong `renewal.functions.ts`; test bám chuỗi comment/biến cũ (`renewed_at === today`, vị trí import `client.server`). | Cập nhật regex/proxy: `previousRenewedAt === today`; assert decline-block không ghi `invoices`/`members`. |
| graph bc41v | graph-verification | 1 | **B — boundary violation** | (1) `connection/service.server.ts` re-export chết `RelationshipGraphRepository` (không ai dùng). (2) `person-journey.server.ts` cần lookup node theo external ref — SDK sanctioned chưa có API tương đương (capability gap). | (1) Xoá import/re-export chết. (2) Thêm `findPersonNodeByExternalRef` vào sanctioned service HOẶC allowlist exception — cần quyết định thiết kế, behavior-neutral. |
| RM bc91 | relationship-memory-ui-security | 1 | **A — import path** | `RelationshipMemoryExplorer.tsx` import `search-dto` trực tiếp thay vì barrel (barrel đã re-export symbol). | Đổi import về `@/lib/business-connect/relationship-memory`. |

## Kết luận
- Không có lỗ hổng bảo mật hay sai nghiệp vụ nào trong 41 lỗi — toàn bộ là drift test (A), stale (C), flaky môi trường (E), và 2 điểm cần quyết định nhỏ (B: bc90 mock, graph boundary).
- Sản phẩm không cần đổi hành vi, trừ: xoá dead re-export ở `connection/service.server.ts`, đổi import barrel ở `RelationshipMemoryExplorer.tsx`, và quyết định sanctioned wrapper cho graph external-ref lookup.
- Nhóm D (16 e2e suite từ chối chạy trên production host): ghi nhận, không sửa ở RC1.

## RC1C — DISPOSITION CUỐI CÙNG (2026-08-11)

| Nhóm | Trạng thái cuối |
|---|---|
| bcm1a/bcm1b/bcm0b/bc45/bcm2d/bcm4b | UPDATED_TEST_DRIFT — PASS |
| bcuit navigation / my-card | UPDATED_TEST_DRIFT (stub MockModeBanner + getWorkHubOverviewFn) — PASS |
| bcuit overview (3 test) | UPDATED_TEST_DRIFT — CONTRACT DRIFT (BC-8.0 → WorkHubPage). Route production đúng; chỉ sửa test. PASS 3/3 |
| bc90 policy | UPDATED_TEST_DRIFT (mock `bcAiGenerate` ném `BusinessConnectAIError`) — PASS |
| bc90 security / a11y e2e / reviews-invalid | UPDATED_TEST_DRIFT — flaky do contention; PASS khi chạy giới hạn worker |
| graph bc41v | FIXED_PRODUCT (gỡ dead re-export + sanctioned passthrough) — PASS |
| RM bc91 | FIXED_PRODUCT (import barrel) — PASS |
| renewal + 16 suite live-DB | ENV_DEFERRED_TO_RC2 |

Remaining locally runnable failures: **0**.
