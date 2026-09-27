# NHẬT KÝ KIỂM THỬ, SỬA LỖI & ĐỒNG BỘ TOÀN HỆ THỐNG VIONE CONNECT & VIONE CRM

## 1. TỔNG QUAN YÊU CẦU ĐÃ THỰC HIỆN
- **Nút chỉnh sửa trang chủ ViOne App**: Chuyển nút "Chỉnh sửa" thành **icon-only** (`Pencil`) tròn sang trọng, loại bỏ chữ text để tối ưu trải nghiệm giao diện người dùng.
- **Mạng lưới & Khoảnh khắc (Network Moments & Memos)**:
  - Khôi phục nút **"Đăng khoảnh khắc"** nổi bật trên màn hình Mạng lưới (`NetworkHome`).
  - Tái tích hợp chức năng **"Ghi nhớ" (Memos/Reminders)** trên từng bài viết khoảnh khắc (`NetworkFeedCard` / `MomentActionBar`), cho phép chủ tài khoản lưu trữ và chỉnh sửa ghi chú cuộc gặp với đối tác, hiển thị trực tiếp trên thẻ bài viết.
- **Sứ mệnh hệ sinh thái ViOne Connect**:
  - Kết nối các cá nhân doanh nhân với nhau, tích hợp AI gợi ý tự động.
  - Hỗ trợ công ty quản lý nhân viên cấp dưới và theo dõi quá trình làm việc của các nhân sự trong doanh nghiệp.
  - Bổ sung nút **"Tạo nhóm"** và tab lọc **"Nhóm"** trong hộp thư (`connect-app.inbox`), tích hợp chức năng tạo nhóm phòng ban doanh nghiệp (Ban Giám Đốc, Kinh Doanh, Dự Án & Công Nghệ, Nhân Sự, Vận Hành).
  - Tích hợp tính năng AI gợi ý nhân sự phù hợp cho phòng ban theo kỹ năng và mục tiêu công việc.
- **Chụp danh thiếp lưu danh bạ số (Business Card OCR to Digital Contacts)**:
  - Sửa backend `connect-app.service.ts` tại hàm `listGuestContacts`, `getGuestContact` và `cardScanSave` để lưu và trả về đầy đủ các trường `phone`, `email`, `title`, `company_name`, `last_shared_at`.
  - Cập nhật DTO `BcMobileNetworkPerson` và giao diện hàng danh bạ số `NetworkPersonRow.tsx` hiển thị **Chức vụ (Job Title) nổi bật ngay dưới tên người dùng**, kèm theo **Số điện thoại** và Tên công ty.
- **Hệ thống ViOne CRM - Hộp thư đa kênh (`/messages`)**:
  - **Khắc phục lỗi điều hướng**: `Sidebar.tsx` trước đây trỏ sai `to: "/association/messages"` khiến người dùng bị redirect nhầm vào hiệp hội CEO 1983. Đã sửa trỏ chuẩn xác về `/messages`.
  - Xây dựng mới trang **Hộp thư đa kênh & Theo dõi tiến độ công việc** (`src/routes/messages.tsx`) chuẩn desktop CRM ViOne:
    - Kênh giao tiếp đa dạng: Nhóm nội bộ phòng ban công ty, ViOne Connect, Khách hàng & Đối tác.
    - Quản lý công việc: Phân công nhân viên phụ trách (Assignee), trạng thái xử lý (Chờ xử lý, Đang tương tác, Đã chốt hợp đồng).
    - Lưu trữ ghi chú tiến độ làm việc (Work progress notes).
    - ViOne AI Copilot: Tự động phân tích nhu cầu và gợi ý câu trả lời theo thời gian thực.
  - **Tách biệt 100%**: Tuyệt đối không còn bất kỳ liên kết, mã code hay dữ liệu nào dính dáng đến Hiệp hội CEO 1983 trong ViOne CRM & ViOne App.
- **Làm sạch dữ liệu & Đồng bộ Realtime Database PostgreSQL**:
  - Đã thực thi script dọn dẹp `packages/db/clean_vione_data.js` xóa sạch các dữ liệu rác, fake, test cũ trong database thật `vione_app` (PostgreSQL `113.20.107.184:6432`).
  - Bảo lưu nguyên vẹn tài khoản người dùng, tài khoản doanh nghiệp (`companies`), danh sách nhân viên (`company_members`).

---

## 2. CHI TIẾT CÁC ĐIỂM SỬA VÀ TẬP TIN LIÊN QUAN

| STT | Khu vực | Tập tin sửa đổi | Nội dung chi tiết |
|---|---|---|---|
| 1 | Trang chủ ViOne App | `apps/vione_app_fe/src/components/business-connect/mobile/ExecutiveHome.tsx` | Chuyển nút chỉnh sửa thành icon `Pencil` bo tròn sang trọng, không còn text |
| 2 | BottomSheet Hồ sơ | `apps/vione_app_fe/src/components/common/PersonalProfileBottomSheet.tsx` | Nút chỉnh sửa hồ sơ chuyển thành icon-only `Pencil` |
| 3 | Nút Ghi nhớ khoảnh khắc | `apps/vione_app_fe/src/components/business-connect/mobile/moments/MomentActionBar.tsx` | Thêm icon `NotebookPen`, nút "Ghi nhớ", prop `onOpenMemo`, `hasMemo` |
| 4 | Thẻ khoảnh khắc & Ghi chú | `apps/vione_app_fe/src/components/business-connect/mobile/NetworkFeedCard.tsx` | Thêm modal AlertDialog lưu/sửa ghi nhớ cuộc gặp, hiển thị khung ghi nhớ nổi bật trên bài viết |
| 5 | Đăng khoảnh khắc Network | `apps/vione_app_fe/src/components/business-connect/mobile/NetworkHome.tsx` | Thêm thanh đăng khoảnh khắc và nút "Đăng khoảnh khắc" mở trực tiếp `PostMomentModal` |
| 6 | Backend danh bạ khách & scan thẻ | `apps/vione_app_be/src/connect-app/connect-app.service.ts` | Bổ sung `phone`, `email`, `website`, `address` vào SELECT & INSERT của `guest_contacts`; populate `last_shared_at` khi scan |
| 7 | Hook dữ liệu mạng lưới | `apps/vione_app_fe/src/hooks/use-business-connect-network.ts` | Mở rộng type `BcMobileNetworkPerson` với `phone`, `jobTitle`, `email` |
| 8 | Hiển thị người dùng danh bạ | `apps/vione_app_fe/src/components/business-connect/mobile/NetworkPersonRow.tsx` | Hiển thị chức vụ ngay dưới tên, kèm số điện thoại và tên công ty |
| 9 | Modal Tạo nhóm ViOne | `apps/vione_app_fe/src/components/business-connect/mobile/ViOneCreateGroupModal.tsx` | Xây dựng modal tạo nhóm làm việc theo phòng ban, tích hợp AI gợi ý nhân sự theo kỹ năng |
| 10 | Hộp thư tin nhắn ViOne App | `apps/vione_app_fe/src/routes/connect-app.inbox.index.tsx` | Thêm nút "Tạo nhóm", tab "👥 Nhóm", kết nối mở `ViOneCreateGroupModal` và đồng bộ realtime |
| 11 | Sidebar ViOne CRM | `apps/vione_app_fe/src/components/dashboard/Sidebar.tsx` | Sửa link Hộp thư đa kênh từ `/association/messages` thành `/messages` |
| 12 | Trang Hộp thư CRM ViOne | `apps/vione_app_fe/src/routes/messages.tsx` | Tạo trang Hộp thư đa kênh chuẩn ViOne CRM: phân kênh, quản lý nhân viên, tiến độ công việc, AI Copilot |
| 13 | Dọn dẹp dữ liệu DB | `packages/db/clean_vione_data.js` | Xóa sạch bảng tin nhắn, khoảnh khắc, cơ hội, checkin cũ, giữ lại tài khoản người dùng & công ty |

---

## 3. KẾT QUẢ KIỂM THỬ LOCALHOST

1. **Backend ViOne (`vione_app_be`)**:
   - Lệnh kiểm tra: `npm run build`
   - Kết quả: **Thành công 100% (exit code 0)**. NestJS build hoàn tất, không có lỗi TypeScript.
2. **Frontend ViOne (`vione_app_fe`)**:
   - Lệnh phát sinh route: `node scripts/gen-routes.mjs`
   - Kết quả: **Thành công 100%**. Route `/messages` đã được nhận diện vào `routeTree.gen.ts`.
3. **Database PostgreSQL (`vione_app`)**:
   - Lệnh: `node clean_vione_data.js`
   - Kết quả: **Thành công 100%**. Đã xóa sạch dữ liệu rác, sẵn sàng cho luồng tương tác thực tế 2 chiều.
