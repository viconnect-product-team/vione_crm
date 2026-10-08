# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & KIẾN TRÚC DỮ LIỆU
## ỨNG DỤNG MẠNG LƯỚI GIAO THƯƠNG VIONE CONNECT (BUSINESS CONNECT)

### 1. Khái Niệm Bình Dân Cho Người Không Học IT:
ViOne Connect là công cụ hỗ trợ doanh nhân **kết nối không biên giới**.
* Mỗi khi doanh nhân chạm thẻ danh thiếp Titanium NFC vào điện thoại của khách hàng, máy tính mở tủ `member_business_cards` để tải trang giới thiệu 3D lung linh.
* Khi khách hàng bấm "Lưu danh bạ", máy chủ đóng gói thông tin thành file danh bạ điện thoại (.VCF) để nạp thẳng vào danh bạ iPhone/Android.
* Khi khách hàng điền form để lại số điện thoại, máy tính ghi một dòng vào tủ `business_card_leads` để chủ thẻ biết có khách hàng tiềm năng vừa liên hệ.

---

### 2. Danh Mục APIs & Bảng Cơ Sở Dữ Liệu:
1. **Quản lý Danh thiếp số**:
   - Bảng chính: `member_business_cards`
   - Bảng phụ: `business_card_interactions` (nhật ký lượt chạm), `business_card_leads` (khách để lại liên hệ).
   - Ghép bảng: `member_business_cards JOIN members ON member_business_cards.member_id = members.id`.
2. **Ghép đôi Giao thương B2B (AI Matchmaking)**:
   - Bảng `business_card_services` (các dịch vụ công ty tôi cung cấp).
   - Bảng `business_card_needs` (những gì công ty tôi đang cần tìm kiếm thu mua).
   - Ghép nối: Máy tính so khớp từ khóa giữa 2 bảng này để gợi ý 2 doanh nghiệp kết nối với nhau.

---

### 3. Định Dạng Đóng Gói Ứng Dụng Di Động Android (Dual APK Release):
1. **Bản APK Native Standalone (`ViOne-Connect-latest.apk` - ~81.57 MB)**:
   - Mã nguồn: `apps/mobile_vione` (React Native 0.76.7, Expo SDK 52, Hermes Engine).
   - Quy trình build: Lệnh `./build-apk.ps1 -Release` thực thi Gradle `assembleRelease`.
   - Vị trí tệp xuất xưởng: `release_apk/ViOne-Connect-latest.apk` và `apps/vione_app_fe/public/ViOne-Connect-latest.apk`.
   - Đặc điểm: Hoạt động thuần Native 100%, hiệu năng 60-120fps, đóng gói sẵn bytecode JS offline, hỗ trợ đầy đủ camera native quét QR/OCR, cảm biến NFC, thông báo đẩy màn hình khóa.
2. **Bản APK PWA Siêu Tốc (`ViOne-PWA-latest.apk` - ~3.18 MB)**:
   - Mã nguồn: `apps/vione_app_fe` (TanStack React Start, Capacitor Android).
   - Quy trình build: `npx cap sync android` và chạy Gradle `assembleRelease` tại `apps/vione_app_fe/android`.
   - Vị trí tệp xuất xưởng: `release_apk/ViOne-PWA-latest.apk` và `apps/vione_app_fe/public/ViOne-PWA-latest.apk`.
   - Đặc điểm: Kích thước siêu nhẹ (~3.18 MB), tải và cài đặt trong 3 giây, tự động cập nhật giao diện thời gian thực qua server, hỗ trợ WebRTC call 2 chiều.

---

### 4. Hệ Thống Điều Khiển Giọng Nói AI Toàn Năng (Dynamic Voice AI Assistant):
1. **Tự Động Gửi Tin Nhắn Bằng Giọng Nói**:
   - Khái niệm: Lãnh đạo ra lệnh *"nhắn tin cho [Tên người nhận] nội dung..."*, AI tự động phân giải tài khoản nhận từ danh bạ/kết nối/CSDL `vione_users`.
   - API backend: `POST /connect-app/ai/send-message`.
   - Bảng CSDL: `direct_messages`, `direct_message_threads`, `business_notifications`.
   - Ghi chú: Kèm metadata giọng nói AI `[Gửi bởi ViOne AI Assistant theo lệnh giọng nói của...]`, bắn chuông ưu tiên cao và hỗ trợ nghe lại bản ghi giọng nói AI.
2. **Chia Sẻ Cơ Hội Kinh Doanh Vào AI & Gửi Lời Chào Giọng Nói Vào Tin Nhắn Chờ**:
   - Khái niệm: Khi xem cơ hội cộng đồng, bấm nút `[🤖 Nhờ AI Gửi Voice]` hoặc ra lệnh *"bạn hãy gửi tôi lời chào mong muốn quan tâm cơ hội của tài khoản abc..."*.
   - AI tự động soạn thảo lời chào quan tâm hợp tác chuẩn C-Level, kèm bản ghi âm giọng nói AI (TTS audio note).
   - API backend: `POST /connect-app/ai/express-opportunity-voice`.
   - Hộp thư đích: Gửi thẳng vào mục Tin nhắn chờ (`is_request = true`) của chủ cơ hội.
   - Bảng CSDL: `direct_messages`, `direct_message_threads`, `business_notifications`, `business_opportunity_interests`.

