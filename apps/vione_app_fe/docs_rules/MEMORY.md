# FRONTEND MEMORY - VIONE APP FE

## Lịch sử phát triển & Cải tiến quan trọng
- **Ngày 09/10/2026**:
  - Tích hợp kiểm tra quyền doanh nghiệp: `hasCompanyWithStaff` ẩn thẻ Chấm công & Ký duyệt, hiển thị duy nhất thẻ Công việc khi người dùng chưa có công ty có nhân sự.
  - Tối ưu hóa trang chủ: Tab mặc định luôn là `Tất cả` (All), bố trí đầu tiên trên thanh điều hướng thời gian biểu.
  - Bổ sung banner đề xuất kết bạn qua danh bạ theo phong cách Zalo.
  - Sắp xếp tin nhắn thông minh trong Inbox: Tin nhắn mới nhất tự động đưa hội thoại lên đầu trang.
  - Tương tác thẻ cá nhân: Nhấp vào avatar đối phương ở cả danh sách tin nhắn và chi tiết phòng chat đều mở ra `PersonalProfileBottomSheet`.
  - Tái thiết kế AI Trợ lý: Giao diện tối giản sang trọng, hỗ trợ lịch sử trò chuyện đa phiên lưu `localStorage`, xóa lịch sử, tạo cuộc trò chuyện mới, nhận lệnh giọng nói tự động điều khiển 100%.
- **Ngày 10/10/2026**:
  - Triệt tiêu 100% Mock Data & Dữ liệu tĩnh hardcode trên toàn bộ Frontend (`apps/vione_app_fe`), kết nối trực tiếp PostgreSQL via NestJS backend.
  - Loại bỏ các mảng mock/fake tasks, fake customers, fake payments, fake leaves, dummy opportunities, fallback events ở 10 files trọng yếu (`CompanyTaskManagement.tsx`, `SmartCustomerCrmHub.tsx`, `payment-approvals.tsx`, `workflow.tsx`, `attendance.tsx`, `ExecutiveHome.tsx`, `ExecutiveDashboard.tsx`, `association.events.tsx`, `room-booking.functions.ts`, `data-pipeline-architecture.ts`).
  - Gỡ bỏ `dummyFallback` và các hàm `Math.max(..., 33/475M)` tại Executive Dashboard; số liệu KPI phản ánh 100% dữ liệu thực từ CSDL.
  - Triển khai component `EmptyState` chuẩn mực, sạch sẽ, có icon và hành động thêm mới khi CSDL rỗng.
  - Khối catch của mọi API calls gán state rỗng `[]`, không fallback về dữ liệu ảo.
  - Vượt qua kiểm tra type check `npx tsc --noEmit` đạt 0 errors (Exit code 0).
- **Ngày 10/10/2026 (Cập nhật Khẩn Cấp - BRD Master Enterprise 6.5)**:
  - Hoàn thiện toàn diện tài liệu Yêu Cầu Nghiệp Vụ Doanh Nghiệp (BRD Master 6.5) mô tả chi tiết 100% các chức năng thực tế của cả Hệ Thống Web CRM ViOne và App ViOne (Native & PWA).
  - Web CRM ViOne: Mô tả chi tiết 24 Modules nghiệp vụ (Executive Dashboard 360°, Smart CRM, B2B Accounts, Đa công ty Multi-Tenant, B2B Marketplace, RFQ, Cơ hội B2B, Kanban tasks, Workload Heatmap > 45h/tuần, Chấm công GPS ≤ 50m & AI FaceID ≥ 92%, Duyệt chi 3 cấp Napas VietQR 24/7 1s, Sổ quỹ thực tế, Sự kiện & QR check-in < 0.2s, Phòng họp, Cuộc gặp 1-1, Hộp thư Messenger 4 tabs & WebRTC, Khoảnh khắc B2B, AI Copilot Suite sinh file Excel/Word/PDF, Kho tài liệu, Thẻ NFC & chip 3D, Biểu quyết C-Level, Quản lý tài trợ, Phân quyền RBAC ma trận 7x6 & kiểm soát sở hữu dữ liệu `canEditRecord`, Cài đặt hệ thống, Báo cáo lưu lượng web & Audit Log ISO/IEC 27001).
  - App ViOne (Native & PWA): Kiến trúc 2 roles cốt lõi (Lãnh đạo CEO Suite vs Nhân viên/Đối tác nhận việc qua nút `[⚡ TIẾN HÀNH NHẬN VIỆC]`), 4 Tabs chính (Home, Network, Community, Profile Tôi), Nút V 3D trung tâm & VActionSheet, phân hệ 2 dạng cộng đồng tách biệt (B2B Networking vs Company Internal), hơn 18 modals nghiệp vụ, Trợ lý giọng nói AI Copilot 6.0 với dải sóng âm Holographic 16-bar, hệ sinh thái phân phối Dual APK (PWA 3.18 MB & Native 81.59 MB) cùng cấu hình iOS Safari WebClip Profile.
  - Chuẩn hóa 95 Quy tắc nghiệp vụ cốt lõi (BR-CRM, BR-WRK, BR-HRM, BR-FIN, BR-APP, BR-AI).
- **Ngày 10/10/2026 (Kiểm Thử Toàn Diện & Sửa Lỗi Hệ Thống trên Localhost:5137)**:
  - Cấu hình chuẩn hóa cổng phát triển: Frontend chạy trên `http://localhost:5137/` (Vite) và tích hợp proxy chuyển tiếp `/api` sang Backend NestJS cổng 4001, đảm bảo toàn bộ request từ Client đều thông qua một cổng duy nhất `localhost:5137`.
  - Sửa lỗi nghiêm trọng Enum Prisma (`packages/db/prisma/schema.prisma`): Bổ sung các giá trị `admin`, `member`, `quan_tri` vào `enum app_role` và sinh lại Prisma Client (`npx prisma generate`), triệt tiêu hoàn toàn lỗi crash hệ thống `Value 'admin' not found in enum 'app_role'`.
  - Chuẩn hóa JwtStrategy (`apps/vione_app_be/src/auth/jwt.strategy.ts`): Bổ sung trả về `email` và `name` trong object xác thực `req.user`.
  - Đồng bộ `API_BASE` trong `AuthContext.tsx`: Chuyển sang trả về chuỗi rỗng `''` trên client-side để tận dụng proxy `/api` của Vite trên `localhost:5137`, đồng bộ với `api-client.ts`.
  - Khắc phục lỗi tạo khách hàng (`apps/vione_app_be/src/connect-app/services/connect-customer.service.ts`): Ánh xạ an toàn các stage (`lead`, `negotiation`, `closed_won`, `closed_lost`) sang enum `bc_customer_stage` hợp lệ và xử lý alias `fullName`/`name`, ngăn chặn triệt để lỗi HTTP 500 khi thêm khách hàng.
  - Xây dựng kịch bản kiểm thử tự động toàn diện (`scripts/test_all_vione_system.js`): Thực thi 29 ca kiểm thử từ xác thực, phân quyền RBAC, kiểm tra validation, ngoại lệ, đến các phân hệ CRM, Kanban, Chấm công, Duyệt chi, Cuộc họp, Briefing, Danh tính số, Mạng lưới đối tác và Nhận việc.
  - Kết quả kiểm thử: **29/29 PASSED (100.0%)**.
  - Kiểm tra chất lượng code: Toàn bộ Backend và Frontend đều vượt qua `npx tsc --noEmit` đạt 0 lỗi (Exit code 0).

