# Architecture & Tech-Debt Audit (2026-07)

> Tài liệu này tách riêng khỏi `docs/security-audit-2026-07.md` vì khác chủ đề:
> đây là **kiến trúc / nợ kỹ thuật**, không phải bảo mật. Nguyên tắc ghi chép
> giữ nguyên như file security audit: **chỉ ghi những gì đã làm thật**, mỗi mục
> kèm bằng chứng kiểm chứng được (đường dẫn file, kết quả gate), không mô tả suông.

## 1. Bối cảnh

Phạm vi đợt này:

- Tách 4 file server-function quá lớn trong `src/lib/` theo domain sub-feature.
- Dọn nợ kỹ thuật lint (bug rules-of-hooks + 7 lỗi lint còn lại).
- Viết unit test cho logic tài chính (fees / renewals).
- Phát hiện và fix **1 bug tính toán ngày tháng (leap-year)** trong lúc viết test.

## 2. Tách file lớn theo domain

Cơ chế giữ tương thích import cho cả 4 file: **barrel `index.ts`** trong thư mục
domain + **shim 1 dòng** tại đường dẫn cũ (`export * from "./<domain>";`) để mọi
`import` cũ tiếp tục hoạt động không đổi.

Bằng chứng shim (nội dung file cũ hiện tại):

```ts
// src/lib/member-app.functions.ts
export * from "./member-app";
```

| #   | File gốc                               | Số dòng gốc | Thư mục mới                     | Sub-feature files                                                                                                                                                               |
| --- | -------------------------------------- | ----------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `src/lib/member-app.functions.ts`      | 1313        | `src/lib/member-app/`           | `profile`, `history`, `renewal`, `events`, `notifications`, `opportunities`, `marketplace`, `messages`, `directory`, `content` (10 `*.functions.ts`) + `shared.ts` + `index.ts` |
| 2   | `src/lib/associations.functions.ts`    | 738         | `src/lib/associations/`         | `branding`, `domain`, `logo`, `membership`, `public` (5 `*.functions.ts`) + `index.ts`                                                                                          |
| 3   | `src/lib/member-identity.functions.ts` | 616         | `src/lib/member-identity-pass/` | `my-pass`, `admin`, `verify` (3 `*.functions.ts`) + `shared.ts` + `index.ts`                                                                                                    |
| 4   | `src/lib/member-account.functions.ts`  | 537         | `src/lib/member-account/`       | `assignment`, `status` (2 `*.functions.ts`) + `shared.server.ts` + `index.ts`                                                                                                   |

**Lý do đổi tên `member-identity` → `member-identity-pass`:** tránh trùng với module
helper đã tồn tại `src/lib/member-identity.ts`. Nếu giữ tên thư mục `member-identity/`
sẽ đụng độ đường dẫn với file helper cùng tên.

Bằng chứng số dòng gốc lấy từ git lịch sử (`git show <commit>:<path> | wc -l`):
member-app 1313, associations 738, member-identity 616, member-account 537.

## 3. Dọn nợ kỹ thuật lint

### 3.1 Bug rules-of-hooks

- **File:** `src/routes/opportunities.$id.edit.tsx`.
- **Trước:** 10 `useState` được gọi **sau** khối `if (!isOwner) return ...` → vi phạm
  Rules of Hooks (`react-hooks/rules-of-hooks`, 10 lỗi).
- **Sau:** chuyển toàn bộ hook lên **trước** early-return. Lint rule về 0.

### 3.2 7 lỗi lint đã sửa (1 bug thật + 6 style)

| File:dòng                                         | Loại                    | Ghi chú                                                          |
| ------------------------------------------------- | ----------------------- | ---------------------------------------------------------------- |
| `src/routes/segments.tsx:191`                     | `exhaustive-deps`       | **Bug thật** — thiếu `MEMBERS` trong deps của `useMemo`, đã thêm |
| `src/routes/documents.tsx:~237`                   | `exhaustive-deps`       | `isPinned` bọc `useCallback([pins])` rồi thêm vào deps           |
| `src/components/dashboard/MemberActivityFeed.tsx` | `no-unused-expressions` | ternary side-effect → `if/else`                                  |
| `src/routes/marketplace.$productId.tsx`           | `no-unused-expressions` | ternary/comma-expr → câu lệnh riêng                              |
| `src/routes/marketplace.tsx`                      | `no-unused-expressions` | ternary side-effect → `if/else`                                  |

> `src/routes/m.checkin.tsx:155` (`exhaustive-deps`) **cố ý giữ nguyên** với
> `eslint-disable` chủ đích — không tính là lỗi cần sửa.

### 3.3 Baseline nợ kỹ thuật còn lại

Còn **92** (đúng baseline): `@typescript-eslint/no-explicit-any` (78) +
`react-refresh/only-export-components` (14). Chi tiết & nguyên tắc theo dõi ở
`docs/tech-debt.md` — không lặp lại tại đây.

## 4. Bug phát hiện khi viết test: leap-year trong gia hạn hội viên

**Mô tả:** `renewMembershipFn` và `bulkRenewMembershipFn` dùng
`date.setFullYear(getFullYear() + 1)` trên `term_end = 29/2` của năm nhuận. Vì năm
đích không có ngày 29/2, JS rollover thành **01/3 năm sau** thay vì 28/2 → ngày gia
hạn sai.

**Fix:** hàm dùng chung `addOneYear(date)` trong `src/lib/renewals-calc.ts`. Sau khi
`setFullYear(+1)`, nếu `getMonth()` đổi ngoài ý muốn (dấu hiệu rollover do thiếu 29/2)
thì `setDate(0)` lùi về ngày cuối tháng gốc → ra 28/2. Thay cả 2 chỗ đang lặp logic
trong `renewMembershipFn` và `bulkRenewMembershipFn`.

**Bằng chứng test khóa hành vi đúng** (`src/lib/renewals-calc.test.ts`):

```
addOneYear(2028-02-29) → 2029-02-28   // năm nhuận → năm không nhuận
addOneYear(2024-02-29) → 2025-02-28   // năm nhuận → năm không nhuận
addOneYear(2027-06-15) → 2028-06-15   // ngày thường, hành vi không đổi
```

**Mức độ ảnh hưởng:** bug tồn tại từ trước, ảnh hưởng **mọi hội viên có `term_end`
đúng 29/2** khi gia hạn sang năm không nhuận. Query đếm trên production
(`SELECT count(*) FILTER (WHERE term_end::text LIKE '%-02-29') FROM public.members`)
tại thời điểm audit: **0 / 2 hội viên** khớp — chưa có bản ghi thực tế nào bị ảnh
hưởng. Vẫn nên kiểm tra lại khi dữ liệu production tăng lên (xem mục 7).

## 5. Tách file tính toán thuần cho testability

Tách các hàm thuần ra khỏi `*.functions.ts` để test **không kéo `createServerFn`/SSR
graph** (TanStack/Supabase side-effects) vào test:

| File mới                   | Hàm export                                           |
| -------------------------- | ---------------------------------------------------- |
| `src/lib/renewals-calc.ts` | `mapMember`, `daysBetween`, `addOneYear`, `toRecord` |
| `src/lib/fees-calc.ts`     | `mapMember`, `mapInvoice`, `mapReminder`             |

`renewals.functions.ts` và `fees.functions.ts` import lại từ 2 file này (giữ nguyên
hành vi runtime). `mapMember` được giữ trùng lặp có chủ đích ở cả 2 file calc.

> `mapInvoice` với `amount = undefined` **cố ý giữ `NaN`** (không thêm fallback) — test
> khóa theo `NaN` kèm comment: đây là tín hiệu lỗi dữ liệu nguồn không che giấu, không
> phải bug.

## 6. Trạng thái 3 gate

| Gate               | Kết quả                                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `npx tsc --noEmit` | ✅ 0 lỗi                                                                                                                           |
| `npx vitest run`   | ✅ **350 pass / 350** (tăng 16 test mới: `renewals-calc.test.ts` + `fees-calc.test.ts`)                                            |
| `npm run lint`     | ⚠️ 93 problems = 78 `no-explicit-any` + 14 `only-export-components` (baseline 92) + 1 `exhaustive-deps` cố ý giữ ở `m.checkin.tsx` |

## 7. Khuyến nghị cho lần sau

1. **`no-explicit-any` (78)** vẫn treo — giảm dần theo từng domain khi refactor, không
   làm hàng loạt. Chi tiết ở `docs/tech-debt.md`.
2. **Kiểm tra dữ liệu production cho bug leap-year:** query hiện cho 0 bản ghi khớp
   nhưng dữ liệu còn nhỏ (2 hội viên). Chạy lại query đếm `term_end LIKE '%-02-29'`
   định kỳ / trước mỗi mùa gia hạn để đảm bảo không có bản ghi bị tính sai lịch sử.
3. **Giữ tách biệt tài liệu theo chủ đề:** `docs/security-audit-2026-07.md` (bảo mật)
   và `docs/architecture-audit-2026-07.md` (kiến trúc/tech-debt) nay tách riêng — lần
   audit sau nên tiếp tục giữ tách biệt thay vì gộp chung.
