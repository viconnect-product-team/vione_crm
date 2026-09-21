# Tech Debt Baseline

Tài liệu này ghi nhận baseline các cảnh báo lint được **cố ý hoãn xử lý**, để lần audit sau dễ theo dõi con số có phình to thêm không. Không được để nợ kỹ thuật âm thầm tăng lên.

## Baseline lint (cập nhật: 2026-07-10)

Đo bằng `npm run lint` sau khi đã xử lý: `prettier/prettier` (0), `react-hooks/rules-of-hooks` (0), unused eslint-disable directives (0).

| Rule                                   | Số lượng (baseline) | Trạng thái               |
| -------------------------------------- | ------------------- | ------------------------ |
| `@typescript-eslint/no-explicit-any`   | 78                  | Hoãn — không sửa đợt này |
| `react-refresh/only-export-components` | 14                  | Hoãn — không sửa đợt này |

### Nguyên tắc theo dõi

- **Không được vượt** con số baseline ở trên. PR nào làm tăng số lượng cần bị chặn hoặc giải trình.
- Khi giảm được, cập nhật lại bảng này để phản ánh baseline mới (chỉ đi xuống, không đi lên).
- `no-explicit-any`: ưu tiên thay `any` bằng kiểu cụ thể dần theo từng domain khi refactor, không làm hàng loạt.
- `only-export-components`: chủ yếu do route/file vừa export component vừa export helper — tách helper sang file riêng khi có dịp.

## Ghi chú các lỗi lint khác đang chờ duyệt (chưa quyết định)

- `@typescript-eslint/no-unused-expressions` (4): dùng ternary tạo side-effect thay cho `if` — style, không phải bug.
- `react-hooks/exhaustive-deps` (3): 1 false-positive an toàn (documents.tsx), 1 warning nhẹ có eslint-disable chủ đích (m.checkin.tsx), 1 **bug thật** thiếu dep `MEMBERS` (segments.tsx).
