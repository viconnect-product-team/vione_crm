# TECHSPEC - MOBILE NATIVE VIONE

## 1. Màn hình & Thành phần chính
- `src/screens/home/HomeScreen.tsx`:
  - `activeTab`: Khởi tạo mặc định luôn là `'all'` (Tất cả).
  - Trạng thái `hasCompanyWithStaff`: Gọi `GET /connect-app/community/company-staff-status`.
  - Truyền prop `hasCompanyWithStaff` xuống `ExecutiveCenterSection` và `VActionSheet`.
  - Tích hợp banner và modal `ContactsDiscoveryModal` đề xuất kết bạn qua số điện thoại theo phong cách Zalo.
- `src/screens/home/components/ExecutiveCenterSection.tsx`:
  - Khi `hasCompanyWithStaff === true`: Hiển thị 3 ô (Chấm công, Tiến độ nhân sự, Ký duyệt chi).
  - Khi `hasCompanyWithStaff === false`: Chỉ hiển thị 1 ô lớn tràn viền "Công việc & Tiến độ" (Workflow).
- `src/screens/network/NetworkScreen.tsx` & `ChatThreadModal.tsx`:
  - Danh sách tin nhắn sắp xếp `lastMessageAt` mới nhất lên đầu tiên.
  - Bấm vào Avatar của người đang trò chuyện sẽ mở ngay `MemberCardBottomSheet`.
- `src/components/ai/ViOneVoiceAssistantModal.tsx`:
  - Thiết kế Minimalist Executive, không chi tiết rườm rà.
  - Quản lý đa phiên hội thoại lưu trong `AsyncStorage` (`@vione_ai_sessions_v2`).
  - Hỗ trợ xem lịch sử, xóa lịch sử, tạo đoạn chat mới (+).
  - Nhận diện giọng nói và tự động thực thi 100% các hành động: Chấm công, duyệt chi, giao việc, xem tiến độ, quét mã QR, xem lịch biểu.
- `src/components/WorkflowModal.tsx`:
  - Hiển thị thanh tiến độ %, nút "Nhận việc", modal cập nhật % tiến độ kèm ghi chú và chức năng Import công việc từ file mẫu Excel.
