# MÔ TẢ LUỒNG XỬ LÝ CHỨC NĂNG CODE - FRONTEND VIONE

## 1. Luồng Điều khiển Giọng nói Trợ lý AI (100% Voice Automation)
- **Tệp nguồn**: `src/components/ai/ViOneVoiceAssistant.tsx`
- **Thư viện**: Web Speech API (`webkitSpeechRecognition`).
- **Quy trình nhận dạng và hành động**:
  1. Khi người dùng bấm mic và nói, kết quả giọng nói được chuyển thành chuỗi văn bản Tiếng Việt chuẩn hóa (`text.toLowerCase()`).
  2. Hệ thống phân tích từ khóa hành động:
     - Chấm công: `"chấm công"`, `"điểm danh"` -> kích hoạt hàm gọi callback/route tương ứng.
     - Duyệt chi / Ký duyệt: `"ký duyệt"`, `"duyệt chi"`, `"tài chính"` -> điều hướng/mở giao diện ký duyệt.
     - Giao việc: `"giao việc"`, `"tạo việc"`, `"công việc"` -> mở modal tạo hoặc xem công việc.
     - Tin nhắn: `"tin nhắn"`, `"chat"` -> chuyển sang tab nhắn tin.
     - Quét mã / Mã cá nhân: `"quét qr"`, `"mã qr"` -> mở trình quét / mã cá nhân.
  3. AI phản hồi xác nhận bằng giọng nói và hiển thị text trên giao diện.

## 2. Luồng Tiến độ & Nhập tệp Excel Công việc
- **Tệp nguồn**: `src/components/business-connect/mobile/WorkflowMobileSheet.tsx`
- **Các bước thực thi**:
  1. Hiển thị danh sách thẻ việc kèm thanh tiến độ 0-100%, trạng thái và ghi chú mới nhất.
  2. Bấm "Nhận việc": Gửi request cập nhật status `in_progress`, hiển thị toast thông báo realtime.
  3. Bấm "Cập nhật tiến độ": Mở dialog cho phép kéo/chọn % (25%, 50%, 75%, 100%) và điền ghi chú. Lưu và gửi cập nhật về backend.
  4. Bấm "Nhập từ Excel": Mở popup chọn cấu trúc mẫu (Kinh doanh, Kỹ thuật, Marketing, v.v.), parse danh sách và gửi bulk upload lên backend.
