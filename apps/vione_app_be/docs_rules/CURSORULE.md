# CURSOR RULES - VIONE BACKEND (BE)

## 1. Kiến trúc hệ thống
- Framework: NestJS (TypeScript, Node.js).
- Cơ sở dữ liệu: PostgreSQL (Supabase / Local DB) với Knex.js / Prisma / Raw SQL Driver.
- Authentication: JWT + RBAC, xác thực qua `@UseGuards(JwtAuthGuard)`.
- Realtime: WebSocket Gateway (`ConnectAppGateway`) cho tin nhắn, thông báo, nhận việc và cập nhật tiến độ công việc.

## 2. Quy chuẩn thiết kế API
- Luôn đặt tiền tố API theo module: `/connect-app/...`
- DTO Validation: Sử dụng `class-validator` và `class-transformer` cho tất cả Request Body.
- Trả về cấu trúc response chuẩn: `{ success: boolean, data?: any, message?: string }`.
- Error Handling: Sử dụng NestJS `HttpException` (`BadRequestException`, `NotFoundException`, `UnauthorizedException`).

## 3. Quy chuẩn luồng Doanh nghiệp & Nhân sự
- Kiểm tra trạng thái công ty & nhân sự: Endpoint `/connect-app/community/company-staff-status`.
- Chỉ người dùng có công ty và có ít nhất 1 nhân sự (`hasCompanyWithStaff: true`) mới hiển thị chấm công và ký duyệt chi.
- Công việc & Giao việc (`company_tasks`): Hỗ trợ tiến độ (`progress`: 0-100), ghi chú tiến độ (`progress_note`), phòng ban (`department`), thông báo realtime khi giao việc và khi nhân viên nhận việc / báo cáo tiến độ.
- Import Excel: Hỗ trợ nạp danh sách công việc hàng loạt theo cấu trúc phòng ban doanh nghiệp thực tế.
