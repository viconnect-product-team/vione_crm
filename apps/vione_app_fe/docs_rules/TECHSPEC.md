# TECHSPEC - FRONTEND VIONE (FE PWA)

## 1. Cấu trúc Component & Routing
- `src/routes/connect-app.index.tsx` & `src/components/business-connect/mobile/ExecutiveHome.tsx`:
  - Mặc định danh mục chọn luôn là `all` (Tất cả).
  - Trạng thái `hasCompanyWithStaff`: Gọi `GET /connect-app/community/company-staff-status`.
  - Nếu `hasCompanyWithStaff = true`: Render 3 thẻ tiện ích Doanh nghiệp (Chấm công, Tiến độ nhân sự, Ký duyệt chi).
  - Nếu `hasCompanyWithStaff = false`: Chỉ render 1 thẻ "Công việc & Tiến độ" (Workflow).
  - Banner khám phá danh bạ kiểu Zalo kích hoạt `PersonalProfileBottomSheet` hoặc tìm bạn bè.
- `src/routes/connect-app.inbox.*`:
  - Sắp xếp cuộc trò chuyện có tin nhắn mới nhất lên đầu tiên.
  - Avatar người nhắn tin kích hoạt `PersonalProfileBottomSheet` để mở thông tin danh thiếp.
- `src/components/ai/ViOneVoiceAssistant.tsx`:
  - Giao diện Executive tinh gọn, loại bỏ các nút phân loại rườm rà.
  - Lịch sử trò chuyện đa phiên lưu trữ tại `localStorage ('vione_ai_web_sessions_v2')`.
  - Nút thêm cuộc trò chuyện mới (+), nút xóa lịch sử trò chuyện.
  - Nhận diện giọng nói tiếng Việt 100%, thực thi lệnh điều hướng, mở chấm công, duyệt chi, tạo việc.
- `src/components/business-connect/mobile/WorkflowMobileSheet.tsx`:
  - Thanh tiến độ công việc trực quan (0% - 100%).
  - Nút "Nhận việc" cho nhân sự khi công việc ở trạng thái `assigned`.
  - Modal cập nhật % tiến độ kèm ghi chú phản hồi cho sếp.
  - Modal Import Excel mẫu công việc doanh nghiệp theo phòng ban.
