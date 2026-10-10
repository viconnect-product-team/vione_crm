# BACKEND MEMORY - VIONE APP BE

## Nhật ký thay đổi & Tóm tắt kiến trúc Backend
- **Ngày 09/10/2026**:
  - Bổ sung schema `public.company_tasks` với các trường `progress` (int 0-100), `progress_note` (text), `department` (text).
  - Tích hợp endpoint `/connect-app/community/company-staff-status`: Đếm số lượng nhân sự trực thuộc cộng đồng/công ty do người dùng sáng lập/quản lý để quyết định cờ `hasCompanyWithStaff`.
  - Bổ sung endpoint cập nhật tiến độ công việc `PATCH /connect-app/community/:communityId/tasks/:taskId/progress`: Cập nhật % tiến độ, ghi chú, trạng thái `in_progress` / `done`, phát socket realtime tới quản lý/sếp và người giao việc.
  - Bổ sung endpoint import Excel `POST /connect-app/community/:communityId/tasks/import-excel`: Cho phép nạp hàng loạt công việc chia theo phòng ban (Kinh doanh, Kỹ thuật, Marketing, Kế toán, Nhân sự) vào hệ thống.
  - Bổ sung Realtime Gateway thông báo khi giao việc mới (`task_assigned`), nhận việc (`task_accepted`) và cập nhật tiến độ (`task_progress_updated`).
