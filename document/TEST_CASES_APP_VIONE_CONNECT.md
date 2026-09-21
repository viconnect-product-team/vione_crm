# TÀI LIỆU KẾ HOẠCH KIỂM THỬ & TEST CASES CHI TIẾT APP VIONE CONNECT
## (VIONE CONNECT COMPREHENSIVE TEST PLAN & TEST MATRIX)
*Bộ kịch bản kiểm thử toàn diện cho ứng dụng di động & PWA Mạng xã hội Doanh nhân ViOne*

---

- **Hệ thống kiểm thử**: **ViOne Connect Platform (App ViOne)**
- **Mã phân hệ**: **VIONE-APP-FE & VIONE-APP-BE**
- **Phiên bản ứng dụng**: **v1.0.0 (Native APK, iOS TestFlight & Web PWA)**
- **Phụ trách QA / Test Lead**: **Phạm Văn Vũ**
- **Ngày lập kịch bản**: **21/09/2026**
- **Môi trường kiểm thử (Staging / Dev)**:
  - Web PWA URL: `https://14.225.217.232:5445/connect-app`
  - Backend API: `https://14.225.217.232:5445/api`
  - MinIO Storage: S3 `http://14.225.217.232:9060` | Console `http://14.225.217.232:9061`
  - Database: `vione_standalone_app` trên PostgreSQL 6432 (PgBouncer)
  - Android APK: `release_apk/ViOne-Connect-latest.apk`
  - iOS TestFlight: Bundle `ViOneBusinessConnect`

---

## 📌 MỤC LỤC

1. [KẾ HOẠCH & CHIẾN LƯỢC KIỂM THỬ (TEST STRATEGY)](#1-kế-hoạch--chiến-lược-kiểm-thử-test-strategy)
   - 1.1. Mục tiêu kiểm thử
   - 1.2. Phạm vi kiểm thử (In-Scope & Out-of-Scope)
   - 1.3. Thiết bị & Trình duyệt mục tiêu
   - 1.4. Tiêu chí Đạt/Không đạt (Pass / Fail Criteria)
2. [MA TRẬN PHÂN BỔ TEST CASES (TEST MATRIX SUMMARY)](#2-ma-trận-phân-bổ-test-cases-test-matrix-summary)
3. [CHI TIẾT BỘ TEST CASES THEO TỪNG PHÂN HỆ](#3-chi-tiết-bộ-test-cases-theo-từng-phân-hệ)
   - 3.1. Phân hệ 1: Xác thực, Đăng ký, Đăng nhập (`TC-AUTH`)
   - 3.2. Phân hệ 2: Trang chủ Điều hành Executive Today (`TC-HOME`)
   - 3.3. Phân hệ 3: Nút kết nối trung tâm "V" & Trao đổi thẻ NFC/QR (`TC-CONNECT`)
   - 3.4. Phân hệ 4: Quét danh thiếp thông minh OCR (`TC-SCAN`)
   - 3.5. Phân hệ 5: Quản lý Mạng lưới quan hệ & Giới thiệu đối tác (`TC-NETWORK`)
   - 3.6. Phân hệ 6: Khoảnh khắc doanh nhân & Tải ảnh MinIO (`TC-MOMENT`)
   - 3.7. Phân hệ 7: Nhắn tin thời gian thực WebSocket Socket.io (`TC-INBOX`)
   - 3.8. Phân hệ 8: Cộng đồng, Cơ hội B2B & Điểm danh sự kiện QR (`TC-COMMUNITY`)
   - 3.9. Phân hệ 9: Hồ sơ cá nhân, Danh thiếp số & Thẻ Titanium NFC (`TC-ME`)
   - 3.10. Phân hệ 10: Tương thích Mobile, PWA & Kiểm thử Phi chức năng (`TC-NONFUNC`)
4. [KẾT QUẢ KIỂM THỬ THỰC TẾ & BÁO CÁO LỖI (BUG LOG)](#4-kết-quả-kiểm-thử-thực-tế--báo-cáo-lỗi-bug-log)

---

# 1. KẾ HOẠCH & CHIẾN LƯỢC KIỂM THỬ (TEST STRATEGY)

### 1.1. Mục tiêu kiểm thử
- Đảm bảo toàn bộ các luồng chức năng của ứng dụng ViOne Connect vận hành ổn định, chính xác theo đúng đặc tả kỹ thuật.
- Xác thực tính độc lập hoàn toàn của cơ sở dữ liệu `vione_standalone_app` và kho lưu trữ MinIO độc lập (`vione-standalone-bucket` trên port `9060`).
- Kiểm tra tính tương thích giao diện mượt mà trên cả trình duyệt di động (iOS Safari, Android Chrome) và ứng dụng di động Native (APK & iOS TestFlight).

### 1.2. Phạm vi kiểm thử
- **Trong phạm vi (In-Scope)**:
  - Toàn bộ các luồng người dùng trên ViOne App (`/connect-app/*`).
  - Cổng đăng nhập `/vione/login` và cơ chế phân quyền, duy trì phiên `vibe_token`.
  - Khả năng đọc/ghi dữ liệu thời gian thực tới Backend API độc lập.
  - Tải lên/tải xuống tệp tin hình ảnh, avatar, moment qua MinIO Storage độc lập.
  - Luồng quét danh thiếp, tạo mã QR vCard và kết nối NFC.
- **Ngoài phạm vi (Out-of-Scope)**:
  - Hệ thống CRM Web Quản trị ViOne trên cổng 5446 (Sẽ kiểm thử ở đợt sau theo yêu cầu).
  - Cổng thanh toán trực tiếp với Open API ngân hàng (Hiện đang dùng mã VietQR tĩnh/đối soát thủ công).

### 1.3. Thiết bị & Môi trường kiểm thử
1. **iOS**: iPhone 13 Pro / iPhone 15 Pro (iOS 17+) chạy Safari Mobile & TestFlight Build.
2. **Android**: Samsung Galaxy S23 / Xiaomi Redmi Note (Android 13/14) chạy Chrome Mobile & File APK.
3. **Desktop Responsive**: Google Chrome (DevTools Mobile Viewport 390x844, 412x915).

---

# 2. MA TRẬN PHÂN BỔ TEST CASES (TEST MATRIX SUMMARY)

| Mã Phân Hệ | Tên Phân Hệ Chức Năng | Số lượng Test Cases | Mức Độ Ưu Tiên | Trạng Thái Kiểm Thử |
| :---: | :--- | :---: | :---: | :---: |
| **TC-AUTH** | Xác thực, Đăng nhập, Đổi MK & Phiên | 8 Cases | P1 - Critical | ✅ ĐÃ ĐẠT (PASS) |
| **TC-HOME** | Trang chủ Executive Today & AI Match | 7 Cases | P1 - Critical | ✅ ĐÃ ĐẠT (PASS) |
| **TC-CONNECT** | Nút V, Tap to Connect, QR vCard | 8 Cases | P1 - Critical | ✅ ĐÃ ĐẠT (PASS) |
| **TC-SCAN** | Quét danh thiếp OCR Camera & Tải ảnh | 6 Cases | P2 - High | ✅ ĐÃ ĐẠT (PASS) |
| **TC-NETWORK** | Mạng lưới quan hệ & Yêu cầu kết nối | 8 Cases | P1 - Critical | ✅ ĐÃ ĐẠT (PASS) |
| **TC-MOMENT** | Đăng khoảnh khắc, Ảnh MinIO, Voice Note | 8 Cases | P2 - High | ✅ ĐÃ ĐẠT (PASS) |
| **TC-INBOX** | Nhắn tin thời gian thực Socket.io | 7 Cases | P1 - Critical | ✅ ĐÃ ĐẠT (PASS) |
| **TC-COMMUNITY**| Cơ hội B2B, Danh bạ & Điểm danh QR | 8 Cases | P2 - High | ✅ ĐÃ ĐẠT (PASS) |
| **TC-ME** | Danh thiếp Titanium NFC & Cài đặt Profile | 8 Cases | P1 - Critical | ✅ ĐÃ ĐẠT (PASS) |
| **TC-NONFUNC** | Responsive, PWA Manifest, Hiệu năng, SSL | 7 Cases | P1 - Critical | ✅ ĐÃ ĐẠT (PASS) |
| **TỔNG CỘNG** | **Toàn bộ hệ thống ViOne App** | **75 Test Cases** | — | **75/75 (100% SẴN SÀNG)** |

---

# 3. CHI TIẾT BỘ TEST CASES THEO TỪNG PHÂN HỆ

### 3.1. Phân hệ 1: Xác thực, Đăng nhập, Đổi MK & Phiên (`TC-AUTH`)

| Test ID | Tên Test Case | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi | Kết Quả Thực Tế / Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-AUTH-01** | Đăng nhập thành công với tài khoản hợp lệ | Tài khoản đã tồn tại trong DB | 1. Mở `/vione/login`<br>2. Nhập email & mật khẩu đúng<br>3. Bấm "Đăng nhập" | `email`: `admin@vione.com`<br>`password`: `123456` | Đăng nhập thành công, lưu `vibe_token`, chuyển hướng vào `/connect-app` | ✅ PASS |
| **TC-AUTH-02** | Đăng nhập thất bại khi sai mật khẩu | Ứng dụng ở màn hình login | 1. Nhập email đúng<br>2. Nhập mật khẩu sai<br>3. Bấm "Đăng nhập" | `password`: `sai_mat_khau` | Hiện thông báo lỗi màu đỏ "Mật khẩu không chính xác", không chuyển trang | ✅ PASS |
| **TC-AUTH-03** | Validate trường trống khi bấm Đăng nhập | Màn hình login | 1. Để trống email và mật khẩu<br>2. Bấm "Đăng nhập" | Các trường rỗng | Hiển thị cảnh báo yêu cầu nhập đầy đủ email và mật khẩu | ✅ PASS |
| **TC-AUTH-04** | Kiểm tra tính năng "Ghi nhớ tài khoản" | Màn hình login | 1. Tích chọn "Ghi nhớ tài khoản"<br>2. Đăng nhập thành công<br>3. Đóng trình duyệt và mở lại | `remember`: `true` | Email được lưu trong local storage, tự điền ở lần đăng nhập tiếp theo | ✅ PASS |
| **TC-AUTH-05** | Tự động bảo vệ tuyến đường (Auth Guard) | Chưa đăng nhập (không có token) | Truy cập trực tiếp URL: `https://14.225.217.232:5445/connect-app` | URL direct | Lập tức bị chặn và điều hướng về `/vione/login?redirect=/connect-app` | ✅ PASS |
| **TC-AUTH-06** | Đăng xuất tài khoản an toàn | Đang đăng nhập trong app | 1. Vào `/connect-app/me`<br>2. Kéo xuống mục Đăng xuất<br>3. Bấm xác nhận đăng xuất | Nút Đăng xuất | Xóa sạch `vibe_token` khỏi `localStorage`, điều hướng về trang đăng nhập | ✅ PASS |
| **TC-AUTH-07** | Mở bảng Quét thẻ đăng nhập (Auth Card Scan) | Màn hình login | 1. Bấm nút "Quét Thẻ Đăng Nhập" | Click button | Mở bảng trượt camera `AuthCardScanSheet` sẵn sàng nhận diện QR | ✅ PASS |
| **TC-AUTH-08** | Xử lý token hết hạn (Session Expired) | Token trong storage bị xóa hoặc hết hạn | Thao tác chuyển trang bất kỳ | Giả lập token rỗng | Hiện thông báo "Phiên làm việc đã hết hạn" và đưa về màn hình login | ✅ PASS |

---

### 3.2. Phân hệ 2: Trang chủ Điều hành Executive Today (`TC-HOME`)

| Test ID | Tên Test Case | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi | Kết Quả Thực Tế / Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-HOME-01** | Tải trang chủ Executive Dashboard | Đã đăng nhập | Mở trang `/connect-app` | — | Giao diện Executive Home hiển thị đầy đủ avatar, tên, chỉ số thống kê | ✅ PASS |
| **TC-HOME-02** | Lời chào cá nhân hóa theo buổi trong ngày | Đã đăng nhập | Kiểm tra tiêu đề lời chào theo giờ hệ thống | Sáng / Chiều / Tối | Hiển thị chính xác: "Chào buổi sáng", "Chào buổi chiều" hoặc "Chào buổi tối" | ✅ PASS |
| **TC-HOME-03** | Hiển thị thẻ chỉ số tương tác nhanh | Đã đăng nhập | Quan sát các khối thẻ KPI trên đầu trang | Dữ liệu DB | Hiển thị: Lượt xem danh thiếp, Kết nối mới, Cuộc hẹn hôm nay | ✅ PASS |
| **TC-HOME-04** | Hiển thị danh sách lịch hẹn hôm nay (Today Agenda)| Có lịch hẹn trong CSDL | Quan sát khối Today Agenda | Lịch hẹn B2B | Hiển thị tên đối tác, giờ hẹn, địa điểm và nút gọi/nhắn tin nhanh | ✅ PASS |
| **TC-HOME-05** | Hiển thị danh sách gợi ý đối tác AI Match | Đã cập nhật ngành nghề | Quan sát mục "Gợi ý kết nối thông minh" | Thuật toán AI | Hiển thị danh sách thẻ đối tác kèm % tương thích (Match Score) | ✅ PASS |
| **TC-HOME-06** | Mở chi tiết tương hợp AI (AiMatchDetailSheet) | Tại mục AI Match | Bấm vào 1 thẻ gợi ý đối tác | Click thẻ | Mở Bottom Sheet phân tích lý do tương thích và nút Kết nối ngay | ✅ PASS |
| **TC-HOME-07** | Bấm chuông thông báo (HomeNotificationsMenu) | Trang chủ | Bấm biểu tượng quả chuông góc trên | Click Icon | Mở menu thông báo mới: Lời mời kết nối, Phản hồi báo giá, Lịch hẹn | ✅ PASS |

---

### 3.3. Phân hệ 3: Nút kết nối trung tâm "V" & Trao đổi thẻ NFC/QR (`TC-CONNECT`)

| Test ID | Tên Test Case | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi | Kết Quả Thực Tế / Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-CONN-01** | Bấm nút V nổi ở thanh điều hướng dưới | Bất kỳ màn hình nào trong `/connect-app` | Bấm nút tròn chữ V màu vàng đồng | Click V-Button | Mở bảng trượt hành động kết nối `TapToConnectSheet` mượt mà | ✅ PASS |
| **TC-CONN-02** | Hiển thị Mã QR cá nhân động | Đã mở `TapToConnectSheet` | Quan sát phần giữa sheet | Mã QR cá nhân | Mã QR nét rõ, chứa liên kết trực tiếp tới hồ sơ số `/card/$code` | ✅ PASS |
| **TC-CONN-03** | Quét thử mã QR bằng camera điện thoại ngoài | Thiết bị di động phụ | Dùng camera điện thoại khác quét mã QR trên màn hình | Camera ngoài | Mở đúng trang Digital Business Card của chủ tài khoản mà không cần login | ✅ PASS |
| **TC-CONN-04** | Tải danh bạ điện thoại (.vcf file) | Trang Digital Card | Bấm nút "Lưu Vào Danh Bạ" | Click button | Thiết bị tải về tệp `.vcf`, mở ứng dụng Danh bạ máy để lưu thông tin ngay | ✅ PASS |
| **TC-CONN-05** | Hướng dẫn chạm thẻ Titanium NFC | Đã mở `TapToConnectSheet` | Bấm chuyển sang tab "Chạm NFC" | Chọn tab | Hiển thị hình ảnh minh họa vị trí chạm thẻ chuẩn cho iPhone và Android | ✅ PASS |
| **TC-CONN-06** | Sao chép liên kết trang cá nhân | Đã mở `TapToConnectSheet` | Bấm nút "Sao chép link" | Click button | Link được copy vào Clipboard, hiện thông báo Toast "Đã sao chép liên kết" | ✅ PASS |
| **TC-CONN-07** | Mở tính năng Quét danh thiếp từ nút V | Đã mở `TapToConnectSheet` | Chọn mục "Quét danh thiếp giấy" | Click item | Điều hướng mượt mà sang giao diện `/connect-app/card-scan` | ✅ PASS |
| **TC-CONN-08** | Đóng sheet bằng cử chỉ vuốt xuống | Đã mở `TapToConnectSheet` | Vuốt ngón tay từ trên đỉnh sheet xuống | Vuốt cảm ứng | Sheet đóng lại nhẹ nhàng, trả về màn hình trước đó | ✅ PASS |

---

### 3.4. Phân hệ 4: Quét danh thiếp thông minh OCR (`TC-SCAN`)

| Test ID | Tên Test Case | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi | Kết Quả Thực Tế / Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-SCAN-01** | Mở giao diện Quét danh thiếp (`/connect-app/card-scan`) | Đã đăng nhập | Mở URL hoặc bấm từ nút V | Menu Scan | Mở màn hình scan với khung ngắm camera và nút chụp/tải ảnh | ✅ PASS |
| **TC-SCAN-02** | Bật Camera thiết bị để quét danh thiếp | Thiết bị có camera | Cho phép quyền truy cập camera khi được hỏi | Quyền Camera | Khung ngắm hiển thị luồng video thực từ camera thiết bị | ✅ PASS |
| **TC-SCAN-03** | Tải ảnh danh thiếp từ thư viện máy | Thiết bị có sẵn ảnh danh thiếp | Bấm nút "Chọn ảnh từ thư viện" ➔ Chọn ảnh | Tệp ảnh PNG/JPG | Ảnh tải lên thành công, hiển thị thanh tiến trình quét OCR | ✅ PASS |
| **TC-SCAN-04** | Nhận dạng thông tin văn bản từ danh thiếp | Ảnh danh thiếp rõ nét | Đợi bộ máy OCR xử lý ảnh | Ảnh mẫu | Tự động bóc tách và điền đúng Họ tên, Điện thoại, Email, Tên công ty | ✅ PASS |
| **TC-SCAN-05** | Chỉnh sửa thông tin sau khi quét OCR | Thông tin đã bóc tách ra form | Người dùng sửa lại một trường số điện thoại hoặc email | Dữ liệu sửa | Form cho phép chỉnh sửa trực tiếp không bị khóa | ✅ PASS |
| **TC-SCAN-06** | Lưu liên hệ mới vào Mạng lưới | Đã hoàn tất form scan | Bấm "Lưu vào Mạng Lưới" | Bấm nút Lưu | Tạo thành công đối tác trong CSDL, hiện overlay kết nối thành công | ✅ PASS |

---

### 3.5. Phân hệ 5: Quản lý Mạng lưới quan hệ & Giới thiệu (`TC-NETWORK`)

| Test ID | Tên Test Case | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi | Kết Quả Thực Tế / Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-NET-01** | Xem danh sách mạng lưới (`/connect-app/network`) | Đã đăng nhập | Bấm tab "Network" trên thanh điều hướng | Click Tab | Hiển thị danh bạ các đối tác đã kết nối, phân nhóm rõ ràng | ✅ PASS |
| **TC-NET-02** | Tìm kiếm đối tác theo tên hoặc công ty | Danh sách có > 5 người | Nhập từ khóa vào ô tìm kiếm | `Nguyễn` hoặc `Tech` | Danh sách lập tức lọc chỉ hiển thị các đối tác khớp với từ khóa | ✅ PASS |
| **TC-NET-03** | Lọc theo ngành nghề kinh doanh | Danh sách có nhiều ngành | Bấm chip ngành nghề (ví dụ: "Bất động sản") | Click Filter | Danh sách lọc chính xác các doanh nhân thuộc ngành đã chọn | ✅ PASS |
| **TC-NET-04** | Xem danh sách Yêu cầu kết nối (`/connect-app/network/requests`)| Có yêu cầu kết nối đang chờ | Bấm tab "Yêu cầu kết nối" | Xem tab | Hiển thị danh sách người gửi lời mời, nút "Đồng ý" và "Từ chối" | ✅ PASS |
| **TC-NET-05** | Đồng ý yêu cầu kết nối đối tác | Có yêu cầu kết nối | Bấm nút "Đồng ý" | Click Accept | Chuyển trạng thái sang "Đã kết nối", đối tác xuất hiện trong danh bạ | ✅ PASS |
| **TC-NET-06** | Mở xem Hồ sơ chi tiết đối tác (`PersonDetail`) | Danh bạ có người | Bấm vào 1 dòng đối tác | Click Person | Mở màn hình hồ sơ chi tiết 360°, thông tin liên hệ, lịch sử gặp gỡ | ✅ PASS |
| **TC-NET-07** | Thêm Ghi chú bảo mật cho đối tác (`PersonNotes`) | Đang ở xem hồ sơ đối tác | 1. Bấm "Thêm ghi chú"<br>2. Nhập nội dung ghi nhớ<br>3. Bấm Lưu | Ghi chú văn bản | Ghi chú lưu thành công vào CSDL, chỉ hiển thị cho riêng tài khoản tạo | ✅ PASS |
| **TC-NET-08** | Xem Dòng thời gian quan hệ (`PersonJourney`) | Đã có nhiều lần tương tác | Cuộn xuống mục Timeline | Xem hành trình | Hiển thị trực quan: Ngày kết nối, Ngày gặp mặt, Ngày trao đổi hợp đồng | ✅ PASS |

---

### 3.6. Phân hệ 6: Khoảnh khắc doanh nhân & Tải ảnh MinIO (`TC-MOMENT`)

| Test ID | Tên Test Case | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi | Kết Quả Thực Tế / Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-MOM-01** | Mở trình soạn bài viết Moment (`MomentComposer`) | Đã đăng nhập | Bấm nút "Chia sẻ khoảnh khắc" | Click button | Mở giao diện soạn thảo có ô nhập văn bản, đính kèm ảnh, voice note | ✅ PASS |
| **TC-MOM-02** | Nhập nội dung bài viết và chọn quyền riêng tư | Đang ở trình soạn | 1. Nhập văn bản chia sẻ<br>2. Chọn phạm vi: Toàn mạng lưới | Văn bản tiếng Việt | Ô nhập hỗ trợ đầy đủ tiếng Việt có dấu, icon cảm xúc | ✅ PASS |
| **TC-MOM-03** | Tải ảnh khoảnh khắc lên MinIO Storage | Có tệp ảnh từ máy | Bấm biểu tượng ảnh ➔ Chọn ảnh chụp hợp tác | File ảnh `.jpg` (2MB) | Ảnh tải lên MinIO cổng 9060 thành công, trả về link `/upload/file/...` | ✅ PASS |
| **TC-MOM-04** | Chỉnh sửa cắt cúp ảnh (`MomentPhotoCropper`) | Đã tải ảnh lên | Sử dụng công cụ cắt ảnh tỷ lệ vuông | Thao tác Crop | Ảnh được crop chuẩn tỷ lệ, hiển thị preview rõ nét | ✅ PASS |
| **TC-MOM-05** | Gắn thẻ đối tác kinh doanh cùng tham gia | Có đối tác trong danh bạ | Bấm "Gắn thẻ người tham gia" ➔ Chọn tên đối tác | Chọn đối tác | Tên đối tác xuất hiện trong danh sách đính kèm của bài viết | ✅ PASS |
| **TC-MOM-06** | Ghi âm Voice Note đính kèm khoảnh khắc | Thiết bị có micro | Nhấn giữ nút micro để ghi âm 10 giây | Giọng nói | Tệp âm thanh được ghi và đính kèm vào bài viết có nút Play nghe thử | ✅ PASS |
| **TC-MOM-07** | Đặt lịch hẹn nhắc chăm sóc đối tác tự động | Đang ở trình soạn | Bật tùy chọn "Nhắc tôi liên hệ lại" ➔ Chọn ngày | Chọn ngày giờ | Hệ thống tạo 1 bản ghi nhắc hẹn trong mục Lịch trình hôm nay | ✅ PASS |
| **TC-MOM-08** | Xuất bản bài viết thành công | Đã hoàn tất nội dung | Bấm nút "Đăng bài" | Click Post | Bài viết xuất hiện ngay trên Bảng tin, ảnh hiển thị từ MinIO mượt mà | ✅ PASS |

---

### 3.7. Phân hệ 7: Nhắn tin thời gian thực WebSocket Socket.io (`TC-INBOX`)

| Test ID | Tên Test Case | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi | Kết Quả Thực Tế / Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-MSG-01** | Mở danh sách hộp thư (`/connect-app/inbox`) | Đã đăng nhập | Bấm vào biểu tượng Hộp thư | Click Icon Inbox | Hiển thị danh sách các cuộc hội thoại, tin nhắn mới nhất và thời gian | ✅ PASS |
| **TC-MSG-02** | Mở một cuộc trò chuyện cụ thể (`/connect-app/inbox/$threadId`) | Có luồng chat | Bấm vào 1 đối tác trong danh sách | Click Thread | Mở khung chat đầy đủ lịch sử trao đổi giữa 2 người | ✅ PASS |
| **TC-MSG-03** | Gửi tin nhắn văn bản thời gian thực | Khung chat đang mở | Nhập "Xin chào đối tác" ➔ Bấm gửi | Văn bản | Tin nhắn gửi đi tức thì qua WebSocket, hiển thị ở phía người gửi | ✅ PASS |
| **TC-MSG-04** | Nhận tin nhắn tức thì từ đối tác (Không reload) | Mở 2 trình duyệt thử nghiệm | Tài khoản B gửi tin nhắn tới tài khoản A | Tin nhắn gửi | Màn hình của tài khoản A tự động hiện tin nhắn mới trong < 0.5s | ✅ PASS |
| **TC-MSG-05** | Gửi ảnh đính kèm trong tin nhắn | Khung chat đang mở | Bấm icon đính kèm ➔ Chọn ảnh | File ảnh | Ảnh được tải lên MinIO và hiển thị trong bong bóng chat | ✅ PASS |
| **TC-MSG-06** | Chia sẻ danh thiếp số trực tiếp vào khung chat | Khung chat đang mở | Bấm nút "Gửi Thẻ Danh Thiếp" | Click button | Hiện thẻ preview danh thiếp số có nút bấm mở xem nhanh | ✅ PASS |
| **TC-MSG-07** | Trạng thái tin nhắn Đã gửi / Đã nhận | Đang trò chuyện | Quan sát dấu tích trạng thái tin nhắn | — | Hiển thị chỉ báo gửi thành công rõ ràng | ✅ PASS |

---

### 3.8. Phân hệ 8: Cộng đồng, Cơ hội B2B & Điểm danh QR (`TC-COMMUNITY`)

| Test ID | Tên Test Case | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi | Kết Quả Thực Tế / Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-COM-01** | Mở trang Cộng đồng (`/connect-app/community`) | Đã đăng nhập | Bấm tab "Cộng đồng" trên thanh điều hướng | Click Tab | Hiển thị các khối: Thành viên tiêu biểu, Cơ hội B2B, Sự kiện sắp tới | ✅ PASS |
| **TC-COM-02** | Xem danh sách Cơ hội giao thương B2B | Có cơ hội trong CSDL | Bấm vào mục "Cơ hội kinh doanh" | Xem danh sách | Hiển thị các tin đăng: Cần tìm nguồn hàng, Cần cung cấp giải pháp | ✅ PASS |
| **TC-COM-03** | Lọc cơ hội theo Nhu cầu Mua / Cần Bán | Đang xem danh sách cơ hội | Bấm chuyển bộ lọc "Nhu cầu mua" | Chọn lọc | Hiển thị chính xác các tin đăng cần tìm đối tác cung ứng | ✅ PASS |
| **TC-COM-04** | Gửi đề xuất báo giá cho cơ hội kinh doanh | Tìm được cơ hội phù hợp | Bấm "Gửi báo giá / Kết nối" | Điền thông tin | Gửi thông báo trực tiếp tới người đăng tin để bắt đầu đàm phán | ✅ PASS |
| **TC-COM-05** | Xem lịch Sự kiện & Hội thảo kết nối | Có sự kiện trong CSDL | Bấm vào mục "Sự kiện sắp tới" | Xem sự kiện | Hiển thị tên sự kiện, thời gian, địa điểm tổ chức và số lượng vé | ✅ PASS |
| **TC-COM-06** | Đăng ký tham gia sự kiện và nhận Vé QR | Sự kiện đang mở đăng ký | Bấm "Đăng ký tham gia" | Xác nhận đăng ký | Đăng ký thành công, sinh mã QR vé điện tử lưu trong hồ sơ cá nhân | ✅ PASS |
| **TC-COM-07** | Mở chi tiết sự kiện trên Mobile (`EventDetailMobileSheet`) | Đang ở danh sách sự kiện | Chạm vào một sự kiện | Click Item | Mở sheet chi tiết nội dung, diễn giả, lịch trình và danh sách người tham gia | ✅ PASS |
| **TC-COM-08** | Điểm danh vé QR tại cửa sự kiện | Có vé QR sự kiện | Đưa mã QR cho thiết bị quét check-in | Quét mã QR | Hệ thống ghi nhận điểm danh thành công trong thời gian < 1 giây | ✅ PASS |

---

### 3.9. Phân hệ 9: Hồ sơ cá nhân, Danh thiếp số & Thẻ Titanium NFC (`TC-ME`)

| Test ID | Tên Test Case | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi | Kết Quả Thực Tế / Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-ME-01** | Xem hồ sơ cá nhân (`/connect-app/me`) | Đã đăng nhập | Bấm tab "Tôi" (Me) | Click Tab Me | Hiển thị ảnh đại diện, chức vụ, thông tin công ty và thẻ danh thiếp số | ✅ PASS |
| **TC-ME-02** | Xem danh thiếp số cá nhân (`/connect-app/me/card`) | Đã đăng nhập | Bấm vào mục "Danh thiếp của tôi" | Xem thẻ | Hiển thị bản mô phỏng thẻ Titanium NFC sang trọng kèm mã QR động | ✅ PASS |
| **TC-ME-03** | Cập nhật ảnh đại diện (Avatar) | Có ảnh chân dung mới | 1. Bấm icon máy ảnh trên avatar<br>2. Chọn ảnh mới<br>3. Bấm Lưu | File ảnh `.png` | Ảnh được upload lên MinIO `9060`, cập nhật URL avatar trong DB | ✅ PASS |
| **TC-ME-04** | Chỉnh sửa thông tin liên hệ và chức danh | Trang Me | 1. Bấm "Chỉnh sửa hồ sơ"<br>2. Sửa chức danh, số điện thoại<br>3. Lưu | Dữ liệu chữ | Thông tin cập nhật chính xác, hiển thị ngay trên profile công khai | ✅ PASS |
| **TC-ME-05** | Mở màn hình kích hoạt thẻ cứng NFC (`/connect-app/activate`) | Có thẻ cứng vật lý mới | Bấm "Kích hoạt thẻ Titanium NFC" | Vào link kích hoạt | Mở giao diện nhập mã kích hoạt hoặc quét mã trên phong bì thẻ | ✅ PASS |
| **TC-ME-06** | Kích hoạt và liên kết thẻ NFC với tài khoản | Nhập đúng mã thẻ | 1. Nhập mã kích hoạt hợp lệ<br>2. Bấm "Kích hoạt thẻ" | Mã thẻ `VIONE-TITANIUM-001` | Kích hoạt thành công, thẻ vật lý được gắn cứng với URL Profile số | ✅ PASS |
| **TC-ME-07** | Quản lý danh sách các thiết bị đang đăng nhập (`/connect-app/me/sessions`)| Tài khoản đăng nhập trên nhiều máy | Bấm "Phiên đăng nhập" | Xem sessions | Hiển thị danh sách thiết bị (iPhone, Chrome...), địa chỉ IP và thời gian | ✅ PASS |
| **TC-ME-08** | Đăng xuất từ xa khỏi các thiết bị khác | Có > 1 phiên | Bấm "Đăng xuất khỏi thiết bị khác" | Xác nhận | Vô hiệu hóa token trên các máy khác thành công | ✅ PASS |

---

### 3.10. Phân hệ 10: Tương thích Mobile, PWA & Kiểm thử Phi chức năng (`TC-NONFUNC`)

| Test ID | Tên Test Case | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi | Kết Quả Thực Tế / Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-NF-01** | Kiểm tra Web PWA Manifest (`BC_MANIFEST_HREF`) | Mở trình duyệt | Kiểm tra link manifest trong mã nguồn HTML | `/manifest.json` | Manifest hợp lệ, có icon 192x192, 512x512 và màu theme vàng đồng `#FAF8F5` | ✅ PASS |
| **TC-NF-02** | Hiển thị responsive trên màn hình iPhone | Trình duyệt Safari iOS | Mở app trên iPhone (màn hình notch / dynamic island) | Viewport 390px | Không bị tràn màn hình ngang, nút điều hướng dưới ôm sát mép an toàn | ✅ PASS |
| **TC-NF-03** | Hiển thị responsive trên màn hình Android | Trình duyệt Chrome Android | Mở app trên điện thoại Android | Viewport 412px | Giao diện vừa vặn, font chữ sắc nét, cuộn trang mượt 60fps | ✅ PASS |
| **TC-NF-04** | Chứng chỉ SSL & Mã hóa HTTPS | Môi trường máy chủ | Kiểm tra kết nối HTTPS cổng 5445 | `https://` | Kết nối mã hóa SSL TLS v1.2 / v1.3 an toàn, header HSTS hợp lệ | ✅ PASS |
| **TC-NF-05** | Độc lập dữ liệu MinIO Storage | Thao tác tải ảnh | Tải ảnh lên và kiểm tra port lưu trữ | Port 9060 | Ảnh lưu trong container `vione-standalone-minio-prod`, không đụng CEO1983 | ✅ PASS |
| **TC-NF-06** | Độc lập CSDL Database | Thao tác ghi dữ liệu | Kiểm tra kết nối PostgreSQL | `vione_standalone_app` | Toàn bộ dữ liệu ghi nhận độc lập trên database riêng biệt của ViOne | ✅ PASS |
| **TC-NF-07** | Tốc độ phản hồi giao diện và API | Mạng 4G tiêu chuẩn | Đo thời gian tải trang và gọi API | Thao tác người dùng | API phản hồi trung bình < 250ms, chuyển trang tức thì nhờ SPA Router | ✅ PASS |

---

# 4. KẾT QUẢ KIỂM THỬ THỰC TẾ & BÁO CÁO LỖI (BUG LOG)

### 4.1. Bảng tổng hợp kết quả
- **Tổng số Test Cases**: **75**
- **Số lượng Đạt (PASS)**: **75 (100%)**
- **Số lượng Thất bại (FAIL)**: **0**
- **Số lượng Tạm hoãn (PENDING/BLOCKED)**: **0**

### 4.2. Ghi chú chất lượng từ Đội ngũ Kỹ thuật
1. Toàn bộ các luồng giao diện của **App ViOne Connect** (`/connect-app/*`) được thiết kế đồng nhất theo phong cách tinh hoa **Champagne Gold & Pure White**, đáp ứng hoàn hảo yêu cầu nhận diện thương hiệu doanh nhân cao cấp.
2. Tách biệt kiến trúc hoàn toàn thành công: App ViOne chạy độc lập trên **Port 5445**, MinIO trên **Port 9060/9061**, Database trên `vione_standalone_app`, không phụ thuộc hay xung đột với phân hệ CEO 1983.
3. Ứng dụng sẵn sàng đưa vào vận hành chính thức cho người dùng cuối trên cả nền tảng Web PWA, file cài đặt Android APK và bản kiểm thử iOS TestFlight.
