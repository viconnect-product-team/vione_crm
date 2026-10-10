# MÔ TẢ LUỒNG XỬ LÝ CHỨC NĂNG CODE - MOBILE NATIVE VIONE

## 1. Luồng Trợ lý Giọng nói AI (100% Voice Action Automation)
- **Tệp nguồn**: `src/components/ai/ViOneVoiceAssistantModal.tsx`
- **Cách thức hoạt động**:
  1. Sử dụng Speech-to-Text native/web audio capture hoặc mô phỏng lệnh thoại thời gian thực qua mic input.
  2. Bóc tách lệnh theo mẫu câu doanh nghiệp:
     - "Chấm công / Điểm danh": Kích hoạt `onOpenAttendance()`.
     - "Ký duyệt / Phê duyệt / Duyệt chi": Kích hoạt `onOpenApprovals()`.
     - "Giao việc / Tạo công việc": Kích hoạt `onOpenAssignTask()`.
     - "Tiến độ / Công việc": Kích hoạt `onOpenWorkflow()`.
     - "Lịch trình / Lịch hôm nay": Kích hoạt `onOpenCalendar()`.
     - "Mã cá nhân / QR của tôi": Kích hoạt `onOpenMyQr()`.
     - "Quét mã QR": Kích hoạt `onOpenScanQr()`.
     - "Nhắn tin / Mạng lưới": Kích hoạt `onNavigateToTab('Network')`.
  3. Đóng modal hoặc thông báo âm thanh/phản hồi trực tiếp trên màn hình.
  4. Lưu trạng thái phiên trò chuyện vào `AsyncStorage` key `@vione_ai_sessions_v2`.

## 2. Luồng Giao việc & Cập nhật Tiến độ Doanh nghiệp
- **Tệp nguồn**: `src/components/WorkflowModal.tsx`
- **Quy trình tương tác**:
  1. Hiển thị danh sách thẻ việc trực quan với thanh tiến độ % (0 - 100%) và nhãn phòng ban.
  2. Với các việc được giao mới (`assigned`), hiển thị nút "Nhận việc". Nhấn nút sẽ đổi trạng thái sang `in_progress` và phát thông báo.
  3. Nút "Cập nhật tiến độ" mở Modal cho phép chọn % tiến độ và nhập ghi chú thực tế. Dữ liệu được đồng bộ lên backend và cập nhật tức thì.
  4. Nút "Nhập từ Excel" mở Modal nhập danh sách công việc hàng loạt theo cấu trúc phòng ban (Kinh doanh, Kỹ thuật, Marketing, v.v.).
