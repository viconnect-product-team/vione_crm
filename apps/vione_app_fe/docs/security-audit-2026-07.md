# Security Audit — 2026-07

> Báo cáo này chỉ ghi những gì đã thực hiện và **đo được bằng chứng cứ** trong phiên làm việc.
> Mỗi mục kèm ít nhất một trong: đường dẫn migration/file, hoặc câu query xác minh + kết quả thực tế.

## 1. Bối cảnh

Trong phiên này có đúng **2 hạng mục công việc thật**:

1. **Audit RLS "orphaned permissive policy" + hàm `is_assoc_manager`**
   — kiểm tra xem có policy `USING (true)` hoặc grant lỏng cho `anon`, và xem
   hàm SECURITY DEFINER `is_assoc_manager` có đang bị `anon` gọi được không.
2. **Guard 2 tầng (policy + grant) + cổng CI/CD**
   — bổ sung `scripts/security-guard.sql` (kiểm tra cả `pg_policies` và
   `role_table_grants` theo whitelist) và đưa vào `.github/workflows/deploy.yml`
   làm cổng chặn trước khi build, kèm step verify-secrets.

Ngoài 2 hạng mục trên, không có thay đổi code/schema nào khác được thực hiện.

---

## 2. Danh sách finding

### Nhóm 1 — Đã fix

**F1. `is_assoc_manager(uuid)` (SECURITY DEFINER) đang EXECUTE được bởi `anon`.**

- Khắc phục — migration: `supabase/migrations/20260710050808_fc99f4cd-b371-4926-953b-995912c9fc14.sql`

  ```sql
  REVOKE EXECUTE ON FUNCTION public.is_assoc_manager(uuid) FROM anon, PUBLIC;
  GRANT  EXECUTE ON FUNCTION public.is_assoc_manager(uuid) TO authenticated, service_role;
  ```

- Query xác minh + kết quả (chạy trên DB thật, sau migration):

  ```sql
  SELECT p.proname,
         has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname='public' AND p.proname='is_assoc_manager';
  ```

  → `is_assoc_manager | anon_execute = false`

  Kiểm tra rộng toàn bộ hàm SECURITY DEFINER trong schema `public`:

  ```sql
  SELECT count(*) AS definer_anon_executable
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.prosecdef
    AND has_function_privilege('anon', p.oid, 'EXECUTE');
  ```

  → `definer_anon_executable = 0`

### Nhóm 2 — False positive (không cần fix)

**F2. Nghi ngờ tồn tại "orphaned permissive policy" (`USING (true)`) trên các bảng nghiệp vụ.**

- Query xác minh + kết quả:

  ```sql
  SELECT tablename, policyname, qual
  FROM pg_policies
  WHERE schemaname='public' AND qual ILIKE '%true%';
  ```

  → chỉ 1 dòng hợp lệ:
  `associations | Public can view published associations | (landing_published = true)`

  Đây là policy có chủ đích cho landing page công khai (chỉ hàng đã publish),
  **không phải** orphaned permissive policy. Không có bảng nghiệp vụ nào bị hở.

**F3. Nghi ngờ `anon` được cấp grant bảng ở tầng GRANT (bypass RLS reachability).**

- Query xác minh + kết quả:

  ```sql
  SELECT table_name, privilege_type
  FROM information_schema.role_table_grants
  WHERE table_schema='public' AND grantee='anon';
  ```

  → `[]` (0 dòng) — `anon` không có grant bảng nào ở schema `public`.

### Nhóm 3 — Cải thiện phòng ngừa (đã thêm)

**P1. Guard 3 tầng chống lộ dữ liệu cho `anon`.**

- File: `scripts/security-guard.sql`
  - Tầng 1 (policy): quét `pg_policies` tìm policy có role `anon`/`public` ngoài whitelist.
  - Tầng 2 (grant): quét `information_schema.role_table_grants` cho `anon` ngoài whitelist.
  - Tầng 3 (function EXECUTE): quét `has_function_privilege('anon', oid, 'EXECUTE')`
    cho mọi hàm SECURITY DEFINER trong `public`, fail nếu `count(*) > 0`
    (`generic_anon_definer_execute_exposure`). Đây là tầng guard **trực tiếp** cho
    fix F1 (`is_assoc_manager`) — trước đây chỉ xác minh thủ công, nay đã tự động hoá.
  - Whitelist khởi đầu **chỉ gồm `associations`** (comment trong file:
    `-- Initial whitelist: ONLY \`associations\``).
  - Bất kỳ bảng/hàm ngoài whitelist bị `anon` với tới → guard fail (exit ≠ 0).
- Kết quả chạy thật (sau khi thêm tầng 3):
  `psql -v ON_ERROR_STOP=1 -f scripts/security-guard.sql`
  → `NOTICE: Security guard passed: all targeted findings remain fixed.` (0 vi phạm)

**P2. Cổng CI/CD chặn trước build.**

- File: `.github/workflows/deploy.yml` — thứ tự step (theo `grep name:`):
  `Checkout → Set up Node.js → Install dependencies → Lint → Type check →`
  **`Verify required Supabase secrets are present`** `→ Run tests (e2e) →`
  `Install psql client →` **`Run security regression guard`** `→`
  `Build and push Docker image → Deploy on server via SSH`.
- Guard chạy bằng `psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f scripts/security-guard.sql`
  — nằm **trước** step build, nên guard fail sẽ chặn deploy.

**P3. Step verify-secrets (chống "fake pass" do vitest skip khi thiếu secret).**

- File: `.github/workflows/deploy.yml`, step `Verify required Supabase secrets are present`:

  ```bash
  missing=()
  [ -z "$SUPABASE_URL" ] && missing+=("SUPABASE_URL")
  [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] && missing+=("SUPABASE_SERVICE_ROLE_KEY")
  [ -z "$SUPABASE_PUBLISHABLE_KEY" ] && missing+=("SUPABASE_PUBLISHABLE_KEY")
  if [ ${#missing[@]} -gt 0 ]; then
    echo "::error::Missing required secrets, e2e RLS tests would silently skip: ${missing[*]}"
    exit 1
  fi
  ```

---

## 3. Trạng thái hiện tại (đo được)

| Kiểm tra                                             | Query                                                        | Kết quả                                            |
| ---------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------- |
| `is_assoc_manager` gọi được bởi `anon`               | `has_function_privilege('anon', oid, 'EXECUTE')`             | `false`                                            |
| Hàm SECURITY DEFINER `anon` gọi được (toàn `public`) | `count(*) … prosecdef AND has_function_privilege('anon', …)` | `0`                                                |
| Policy lỏng `USING (true)`                           | `pg_policies … qual ILIKE '%true%'`                          | 1 dòng hợp lệ (`associations`, landing đã publish) |
| Grant bảng cho `anon`                                | `role_table_grants … grantee='anon'`                         | `[]` (0)                                           |

---

## 4. Khuyến nghị cho lần audit sau

- **Kiểm soát whitelist theo review**: mỗi lần thêm bảng vào whitelist của
  `security-guard.sql` phải kèm lý do + policy tương ứng, review 2 người.
- **Bắt buộc secrets cho e2e**: đảm bảo `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_DB_URL` luôn có trong GitHub Secrets để
  bộ 39 test e2e không bị skip âm thầm (step verify-secrets đã chặn, cần duy trì).
- **Audit định kỳ cột grant cho `anon`**: nếu sau này landing cần thêm dữ liệu công
  khai, chỉ cấp SELECT theo cột cụ thể (không cấp table-wide) và cập nhật guard.

> Ghi chú: khuyến nghị "mở rộng guard sang tầng function EXECUTE" ở bản trước **đã được
> thực hiện ngay** trong phiên này (xem Mục 2 — P1, tầng 3), nên không còn nằm trong
> danh sách khuyến nghị cho lần sau.
