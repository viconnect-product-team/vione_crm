# MÔ TẢ LUỒNG XỬ LÝ CHỨC NĂNG CODE - VIONE BACKEND

## 1. Luồng Xác thực Trạng thái Công ty & Nhân sự
- **Endpoint**: `GET /connect-app/community/company-staff-status`
- **Bộ điều khiển**: `CommunityController.getCompanyStaffStatus()`
- **Dịch vụ**: `CommunityService.getCompanyStaffStatus(userId)`
- **Quy trình xử lý**:
  1. Lấy thông tin người dùng từ JWT Token (`user.id`).
  2. Truy vấn danh sách các cộng đồng loại `company` mà người dùng là người sáng lập (`creator_id = userId`) hoặc quản trị viên cấp cao.
  3. Đếm số lượng thành viên/nhân sự thuộc các cộng đồng công ty đó (loại trừ chính chủ sở hữu).
  4. Nếu số lượng thành viên >= 1 -> Trả về `hasCompanyWithStaff: true, companyCount, totalStaffCount`.
  5. Nếu không -> Trả về `hasCompanyWithStaff: false`.

## 2. Luồng Giao việc & Theo dõi Tiến độ
- **Tạo & Giao việc**:
  - `POST /connect-app/community/:communityId/tasks`
  - Nhận thông tin: `title`, `description`, `assigneeId`, `deadline`, `department`, `priority`.
  - Khởi tạo `progress = 0`, `status = 'assigned'`.
  - Phát sự kiện WebSocket `notification` và `task_assigned` tới `assigneeId`.
- **Cập nhật Tiến độ**:
  - `PATCH /connect-app/community/:communityId/tasks/:taskId/progress`
  - Nhận thông tin: `progress` (0 - 100), `progressNote` (tùy chọn).
  - Tự động đồng bộ `status`:
    - `progress = 0` -> giữ `assigned` hoặc chuyển `in_progress` khi nhân viên bấm nhận việc.
    - `0 < progress < 100` -> `status = 'in_progress'`.
    - `progress = 100` -> `status = 'done'`.
  - Lưu vào cơ sở dữ liệu `company_tasks`.
  - Phát sự kiện WebSocket `task_progress_updated` tới người tạo việc/sếp để cập nhật dashboard ngay lập tức.
- **Import Danh sách Việc từ Excel**:
  - `POST /connect-app/community/:communityId/tasks/import-excel`
  - Nhận mảng `tasks: Array<{ title, department, assigneeName, deadline, priority, progress }>`
  - Xác thực và lưu hàng loạt vào DB, trả về số lượng bản ghi đã nhập thành công.
