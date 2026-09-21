# TÀI LIỆU HƯỚNG DẪN SỬ DỤNG ỨNG DỤNG DOANH NHÂN VIONE CONNECT
## (VIONE CONNECT MOBILE WEB APP & SMART DIGITAL PROFILE)
*Hệ điều hành kết nối thông minh & Mạng xã hội doanh nhân đẳng cấp*

---

- **Hệ thống**: **ViOne Connect Platform**
- **Phân hệ tài liệu**: **Ứng dụng Hội viên & Mạng xã hội Doanh nhân ViOne (ViOne App)**
- **Phiên bản ứng dụng**: **v1.0.0 (Bản Native APK & iOS TestFlight + PWA Web App)**
- **Tác giả / Phụ trách**: **Phạm Văn Vũ**
- **Cập nhật ngày**: **21/09/2026**
- **Môi trường Server**: `https://14.225.217.232:5445/connect-app` | Domain: `https://viconnect.vn/`
- **Cơ sở dữ liệu độc lập**: `vione_standalone_app` (PostgreSQL / PgBouncer 6432)
- **MinIO Object Storage**: Port `9060` (S3 API) & Port `9061` (Web Console)

---

## 📌 MỤC LỤC

1. [TỔNG QUAN VỀ ỨNG DỤNG VIONE CONNECT](#1-tổng-quan-về-ứng-dụng-vione-connect)
   - 1.1. Mục đích & Giá trị cốt lõi
   - 1.2. Các nền tảng hỗ trợ (Mobile Web, Android APK, iOS TestFlight)
   - 1.3. Thông tin kết nối & Địa chỉ truy cập
2. [HƯỚNG DẪN CÀI ĐẶT & TRUY CẬP](#2-hướng-dẫn-cài-đặt--truy-cập)
   - 2.1. Truy cập qua Trình duyệt Web (PWA)
   - 2.2. Cài đặt ứng dụng Android (.APK)
   - 2.3. Cài đặt ứng dụng iOS (Apple TestFlight)
3. [TÀI KHOẢN & ĐĂNG NHẬP (AUTHENTICATION)](#3-tài-khoản--đăng-nhập-authentication)
   - 3.1. Đăng nhập hệ thống (`/vione/login`)
   - 3.2. Tính năng Quét danh thiếp đăng nhập (`AuthCardScanSheet`)
   - 3.3. Ghi nhớ tài khoản & Xử lý hết hạn phiên
4. [TRANG CHỦ ĐIỀU HÀNH EXECUTIVE TODAY (`/connect-app`)](#4-trang-chủ-điều-hành-executive-today-connect-app)
   - 4.1. Thanh tác vụ nhanh & Lời chào điều hành
   - 4.2. Lịch trình hôm nay (Today Agenda & Reminders)
   - 4.3. Gợi ý kết nối thông minh AI Match Highlights
   - 4.4. Dòng hoạt động gần đây (Recent Interactions)
5. [NÚT KẾT NỐI TRUNG TÂM ("V" QUICK ACTION BUTTON)](#5-nút-kết-nối-trung-tâm-v-quick-action-button)
   - 5.1. Chạm để kết nối - Tap To Connect (NFC / QR / vCard)
   - 5.2. Quét danh thiếp giấy thông minh (OCR Business Card Scanner)
   - 5.3. Tạo khoảnh khắc tương tác nhanh (Quick Moment)
6. [QUẢN LÝ MẠNG LƯỚI QUAN HỆ (`/connect-app/network`)](#6-quản-lý-mạng-lưới-quan-hệ-connect-appnetwork)
   - 6.1. Danh bạ quan hệ đối tác (Active Connections)
   - 6.2. Yêu cầu kết nối gửi đi & nhận về (Connection Requests)
   - 6.3. Hồ sơ chi tiết đối tác (Person Detail & 360° Profile)
   - 6.4. Ghi chú cá nhân & Hành trình kết nối (`PersonJourney`, `PersonNotes`)
7. [KHOẢNH KHẮC DOANH NHÂN & BẢNG TIN B2B (`/connect-app/moment`)](#7-khoảnh-khắc-doanh-nhân--bảng-tin-b2b-connect-appmoment)
   - 7.1. Tạo bài đăng khoảnh khắc hợp tác (`MomentComposer`)
   - 7.2. Gắn thẻ đối tác, chèn ảnh, ghi âm giọng nói (Voice Note)
   - 7.3. Thiết lập lịch hẹn nhắc nhở chăm sóc đối tác tự động
8. [TRÒ CHUYỆN & ĐÀM PHÁN TRỰC TIẾP (`/connect-app/inbox`)](#8-trò-chuyện--đàm-phán-trực-tiếp-connect-appinbox)
   - 8.1. Danh sách luồng trò chuyện (Chat Threads)
   - 8.2. Nhắn tin thời gian thực (Realtime WebSocket Socket.io)
   - 8.3. Trao đổi hồ sơ năng lực & danh thiếp số trong khung chat
9. [CỘNG ĐỒNG & CƠ HỘI GIAO THƯƠNG B2B (`/connect-app/community`)](#9-cộng-đồng--cơ-hội-giao-thương-b2b-connect-appcommunity)
   - 9.1. Khám phá thành viên trong hệ sinh thái
   - 9.2. Cơ hội kinh doanh (B2B Opportunities & Leads)
   - 9.3. Lịch sự kiện & Điểm danh vé QR tốc độ cao
10. [TRUNG TÂM THẺ SỐ & THIẾT LẬP CÁ NHÂN (`/connect-app/me`)](#10-trung-tâm-thẻ-số--thiết-lập-cá-nhân-connect-appme)
    - 10.1. Quản lý danh thiếp điện tử đa năng (Multi-cards)
    - 10.2. Kích hoạt & Đồng bộ thẻ Titanium NFC (`/connect-app/activate`)
    - 10.3. Đổi ảnh đại diện, ảnh bìa (Đồng bộ MinIO Storage)
    - 10.4. Quản lý bảo mật, đổi mật khẩu & Quản lý phiên đăng nhập
11. [CÂU HỎI THƯỜNG GẶP (FAQ) & XỬ LÝ SỰ CỐ](#11-câu-hỏi-thường-gặp-faq--xử-lý-sự-cố)

---

# 1. TỔNG QUAN VỀ ỨNG DỤNG VIONE CONNECT

### 1.1. Mục đích & Giá trị cốt lõi
**ViOne Connect** là ứng dụng di động dành riêng cho giới chủ doanh nghiệp, nhà đầu tư và các thành viên trong cộng đồng doanh nhân. Ứng dụng tập trung vào 4 giá trị đột phá:
1. **Danh thiếp Titanium NFC thông minh**: Chạm nhẹ thẻ vào điện thoại đối tác để mở ngay Profile đa năng mà đối tác không cần cài đặt ứng dụng.
2. **Quản trị quan hệ đối tác 360° (Personal B2B CRM)**: Lưu trữ lịch sử gặp gỡ, ghi chú hợp đồng, ghi âm trao đổi, nhắc lịch tái kết nối.
3. **Mạng xã hội xúc tiến thương mại B2B**: Chia sẻ khoảnh khắc hợp tác, đăng tải nhu cầu cung - cầu, tìm kiếm đối tác chiến lược theo thuật toán gợi ý AI.
4. **Hệ thống liên lạc thời gian thực**: Trò chuyện mã hóa, thông báo cuộc gọi và điều phối lịch hẹn 1-on-1.

### 1.2. Các nền tảng hỗ trợ
- **Web App / PWA**: Chạy mượt mà trên Safari (iOS), Chrome (Android, macOS, Windows) tại `https://14.225.217.232:5445/connect-app`.
- **Android Native (.APK)**: Tệp đóng gói cài đặt trực tiếp không cần Google Play Store.
- **Apple iOS**: Đã cấu hình Bundle ID `ViOneBusinessConnect`, kiểm thử qua hệ thống **Apple TestFlight**.

### 1.3. Thông tin kết nối máy chủ
* **Địa chỉ truy cập HTTPS**: `https://14.225.217.232:5445/connect-app`
* **Trang đích giới thiệu (Landing Page)**: `https://14.225.217.232:5445/landing/vione`
* **Cơ sở dữ liệu**: Độc lập `vione_standalone_app` (PostgreSQL 6432)
* **Kho lưu trữ hình ảnh & tài liệu**: MinIO S3 Server độc lập (Port 9060 / 9061)

---

# 2. HƯỚNG DẪN CÀI ĐẶT & TRUY CẬP

### 2.1. Truy cập qua Trình duyệt Web (PWA)
1. Mở trình duyệt (Safari trên iPhone hoặc Chrome trên Android).
2. Nhập liên kết: `https://14.225.217.232:5445/connect-app`
3. Nếu trình duyệt hiển thị cảnh báo chứng chỉ bảo mật (do dùng chứng chỉ tự cấp phát của máy chủ thử nghiệm), chọn **"Nâng cao" (Advanced)** ➔ Chọn **"Tiếp tục truy cập" (Proceed to 14.225.217.232)**.
4. **Cài đặt lên màn hình chính (Add to Home Screen)**:
   - **Trên iOS Safari**: Bấm vào biểu tượng chia sẻ (mũi tên hướng lên) ở thanh điều hướng dưới ➔ Chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
   - **Trên Android Chrome**: Bấm vào biểu tượng 3 chấm ở góc trên bên phải ➔ Chọn **"Thêm vào Màn hình chính" / "Cài đặt ứng dụng"**.

### 2.2. Cài đặt ứng dụng Android (.APK)
1. Truy cập trang Landing Page tại: `https://14.225.217.232:5445/landing/vione`
2. Kéo xuống mục **"Cài Đặt Ứng Dụng Di Động"**.
3. Bấm vào nút **"Tải File Android APK"** (Tệp `ViOne-Connect-latest.apk`).
4. Mở tệp vừa tải xuống trên điện thoại Android, cho phép quyền *"Cài đặt từ nguồn không xác định"* nếu được hỏi.
5. Ứng dụng ViOne Connect sẽ xuất hiện với biểu tượng chữ **V Vàng Đồng** trên màn hình điện thoại.

### 2.3. Cài đặt ứng dụng iOS (Apple TestFlight)
1. Cài đặt ứng dụng **TestFlight** từ App Store trên iPhone.
2. Mở đường dẫn TestFlight từ Landing Page hoặc thư mời qua Apple:
   `https://appstoreconnect.apple.com/apps/6810608093/testflight/ios`
3. Chọn **Cài đặt (Install)** bản build mới nhất của **ViOneBusinessConnect**.

---

# 3. TÀI KHOẢN & ĐĂNG NHẬP (AUTHENTICATION)

### 3.1. Đăng nhập hệ thống (`/vione/login`)
1. Truy cập ứng dụng, hệ thống sẽ tự động điều hướng tới `/vione/login` nếu người dùng chưa có phiên làm việc.
2. Nhập thông tin:
   - **Email / Tên đăng nhập**: Ví dụ `admin@vione.com` hoặc email đã đăng ký.
   - **Mật khẩu**: Mật khẩu của tài khoản.
3. Tích chọn **"Ghi nhớ tài khoản"** để tự động duy trì đăng nhập cho các phiên sau mà không cần nhập lại.
4. Bấm **"Đăng Nhập"**.

### 3.2. Tính năng Quét danh thiếp đăng nhập (`AuthCardScanSheet`)
- Ứng dụng hỗ trợ đăng nhập nhanh bằng cách quét mã QR trên thẻ danh thiếp Titanium NFC đã kích hoạt.
- Bấm vào nút **"Quét Thẻ Đăng Nhập"** tại màn hình đăng nhập ➔ Camera sẽ bật lên ➔ Đưa mã QR thẻ vào khung quét để xác thực tự động.

### 3.3. Ghi nhớ tài khoản & Xử lý hết hạn phiên
- Token đăng nhập được lưu trữ an toàn trong bộ nhớ cục bộ `localStorage` (`vibe_token`).
- Nếu phiên hết hạn (Session Expired), hệ thống sẽ thông báo rõ ràng và đưa người dùng về trang đăng nhập kèm tham số để tự động quay lại trang đang xem dở sau khi đăng nhập thành công.

---

# 4. TRANG CHỦ ĐIỀU HÀNH EXECUTIVE TODAY (`/connect-app`)

Giao diện trang chủ được thiết kế theo phong cách tinh hoa (Executive Dashboard) với tông màu vàng đồng Champagne `#DFB76C` phối trên nền trắng cao cấp:

### 4.1. Thanh tác vụ nhanh & Lời chào điều hành
- Hiển thị ảnh đại diện, chức danh và lời chào cá nhân hóa theo từng thời điểm trong ngày (Buổi sáng, Buổi chiều, Buổi tối).
- Chỉ số nhanh: Số lượt chạm thẻ (Card Views), Số kết nối mới (New Connections), Cuộc hẹn hôm nay (Meetings Scheduled).

### 4.2. Lịch trình hôm nay (Today Agenda & Reminders)
- Tổng hợp các cuộc hẹn giao thương 1-on-1 đã xác nhận trong ngày.
- Danh sách nhắc nhở đối tác cần chăm sóc (Follow-up reminders) được sinh ra từ các bài viết Moment trước đó.
- Nút bấm nhanh để gọi điện thoại, nhắn tin Zalo hoặc mở bản đồ chỉ đường tới vị trí họp.

### 4.3. Gợi ý kết nối thông minh AI Match Highlights
- Thuật toán AI phân tích lĩnh vực kinh doanh, nhu cầu tìm kiếm và cung cấp dịch vụ giữa các doanh nhân để đưa ra danh sách đề xuất đối tác tương thích cao nhất (% Match Score).
- Người dùng có thể bấm xem chi tiết bản phân tích tương hợp (AiMatchDetailSheet) và bấm nút **"Kết Nối Ngay"**.

### 4.4. Dòng hoạt động gần đây (Recent Interactions)
- Hiển thị danh sách các khoảnh khắc, hoạt động gặp gỡ của bạn bè trong mạng lưới.
- Thao tác tương tác nhanh: Thả tim, bình luận và chia sẻ cơ hội kinh doanh.

---

# 5. NÚT KẾT NỐI TRUNG TÂM ("V" QUICK ACTION BUTTON)

Nút tròn chữ **V Vàng Đồng** nằm ở chính giữa thanh điều hướng dưới (Bottom Navigation Bar) là phím tắt thần tốc cho mọi hoạt động ngoại giao của doanh nhân:

### 5.1. Chạm để kết nối - Tap To Connect (`TapToConnectSheet`)
Khi bấm vào nút V:
1. **Mã QR Động Cá Nhân**: Hiện mã QR độc quyền trỏ về trang Profile số của bạn (`/card/$code`). Người đối diện chỉ cần dùng Camera điện thoại quét mã là mở ra toàn bộ thông tin.
2. **NFC Handoff**: Hướng dẫn chạm thẻ Titanium NFC vào mặt lưng điện thoại đối tác.
3. **Lưu Danh Bạ (Save to Contacts - vCard)**: Người đối diện có thể bấm nút để tải ngay tệp `.vcf` lưu đầy đủ Tên, Số điện thoại, Email, Chức danh, Tên công ty vào danh bạ điện thoại máy chỉ với 1 cú chạm.

### 5.2. Quét danh thiếp giấy thông minh (OCR Business Card Scanner)
1. Chọn tùy chọn **"Quét Danh Thiếp Giấy"** từ menu nút V.
2. Hướng camera vào danh thiếp giấy truyền thống của đối tác hoặc tải ảnh danh thiếp từ thư viện.
3. Trí tuệ nhân tạo OCR sẽ tự động quét, nhận dạng và bóc tách các trường: Họ tên, Số điện thoại, Email, Tên doanh nghiệp, Địa chỉ.
4. Bấm **"Lưu Vào Mạng Lưới"** để tạo ngay hồ sơ liên hệ trong ViOne Connect.

### 5.3. Tạo khoảnh khắc tương tác nhanh (Quick Moment)
- Mở bảng soạn thảo nhanh để lưu giữ hình ảnh bắt tay, ký hợp đồng hoặc cuộc hẹn cà phê ngoại giao vừa diễn ra.

---

# 6. QUẢN LÝ MẠNG LƯỚI QUAN HỆ (`/connect-app/network`)

### 6.1. Danh bạ quan hệ đối tác (Active Connections)
- Danh sách toàn bộ các doanh nhân đã kết nối thành công.
- Bộ lọc thông minh theo: Ngành nghề, Khu vực địa lý, Mức độ ưu tiên, Nhãn phân loại (VIP, Khách hàng, Đối tác chiến lược).
- Thanh tìm kiếm tức thời theo tên người hoặc tên công ty.

### 6.2. Yêu cầu kết nối gửi đi & nhận về (Connection Requests)
- **Đã nhận (Received)**: Xem danh sách những người muốn kết nối với bạn kèm lời nhắn giới thiệu ➔ Bấm **"Đồng ý"** hoặc **"Bỏ qua"**.
- **Đã gửi (Sent)**: Theo dõi trạng thái các lời mời kết nối bạn đã gửi tới đối tác khác.

### 6.3. Hồ sơ chi tiết đối tác (Person Detail & 360° Profile)
Khi bấm vào một đối tác, màn hình hiển thị toàn diện:
- Thông tin doanh nhân: Ảnh đại diện, Chức vụ, Doanh nghiệp, Lĩnh vực.
- Điểm mạnh năng lực & Danh mục sản phẩm cung ứng.
- Lịch sử tương tác qua từng thời kỳ: Các lần chạm thẻ, các cuộc họp, các ghi chú đã lưu.

### 6.4. Ghi chú cá nhân & Hành trình kết nối (`PersonJourney`, `PersonNotes`)
- **Ghi chú bảo mật**: Chỉ một mình bạn nhìn thấy các ghi chú này (Ví dụ: *"Anh Nam thích chơi Golf, đang có kế hoạch mở rộng nhà xưởng vào quý 4"*).
- **Thiết lập chu kỳ chăm sóc**: Đặt lịch nhắc hệ thống tự động thông báo sau 15 ngày, 30 ngày hoặc 60 ngày để gửi lời hỏi thăm đối tác.

---

# 7. KHOẢNH KHẮC DOANH NHÂN & BẢNG TIN B2B (`/connect-app/moment`)

Khác với mạng xã hội giải trí thông thường, **Khoảnh Khắc ViOne** tập trung phục vụ mục tiêu kết nối giao thương:

### 7.1. Tạo bài đăng khoảnh khắc hợp tác (`MomentComposer`)
1. Bấm vào nút Tạo khoảnh khắc trên trang chủ hoặc trang Network.
2. Nhập nội dung chia sẻ: Bắt tay hợp tác, ký biên bản ghi nhớ, tham quan nhà máy, tham gia sự kiện.
3. Chọn đối tượng xem: Công khai toàn hệ sinh thái ViOne hoặc Chỉ mạng lưới thân thiết.

### 7.2. Gắn thẻ đối tác, chèn ảnh, ghi âm giọng nói (Voice Note)
- **Gắn thẻ doanh nhân (Tag Person)**: Chọn chính xác người bạn vừa gặp để bài viết hiển thị trên cả dòng thời gian của họ.
- **Trình tải ảnh tối ưu (`MomentPhotoCropper`)**: Cắt chỉnh ảnh vuông vắn chuyên nghiệp, nén tự động và lưu trữ an toàn trên MinIO Server.
- **Voice Note**: Nhấn giữ nút ghi âm để đính kèm đoạn âm thanh ngắn chia sẻ cảm nghĩ nhanh sau cuộc gặp.

### 7.3. Thiết lập lịch hẹn nhắc nhở chăm sóc đối tác tự động
- Tại bước soạn bài, người dùng có thể kích hoạt tùy chọn *"Nhắc tôi liên hệ lại sau"* ➔ Chọn ngày giờ cụ thể ➔ Hệ thống sẽ tự động thêm vào danh sách nhắc hẹn trên trang chủ.

---

# 8. TRÒ CHUYỆN & ĐÀM PHÁN TRỰC TIẾP (`/connect-app/inbox`)

### 8.1. Danh sách luồng trò chuyện (Chat Threads)
- Hiển thị danh sách các cuộc hội thoại 1-on-1 giữa bạn và các doanh nhân khác.
- Hiển thị chỉ báo trạng thái đã đọc/chưa đọc, tin nhắn mới nhất và thời gian gửi.

### 8.2. Nhắn tin thời gian thực (Realtime WebSocket Socket.io)
- Tin nhắn gửi và nhận tức thời không cần tải lại trang thông qua kênh kết nối Socket.io nội bộ.
- Hỗ trợ gửi văn bản, biểu tượng cảm xúc và gửi ảnh đính kèm.

### 8.3. Trao đổi hồ sơ năng lực & danh thiếp số trong khung chat
- Tích hợp nút chia sẻ nhanh Thẻ doanh nhân điện tử ngay trong khung chat để đối tác lưu danh bạ trực tiếp.

---

# 9. CỘNG ĐỒNG & CƠ HỘI GIAO THƯƠNG B2B (`/connect-app/community`)

### 9.1. Khám phá thành viên trong hệ sinh thái
- Xem danh sách thành viên mở rộng ngoài mạng lưới trực tiếp của bạn.
- Lọc theo ngành nghề (Bất động sản, Công nghệ, Xây dựng, Tài chính, Bán lẻ, Y tế...).

### 9.2. Cơ hội kinh doanh (B2B Opportunities & Leads)
- **Đăng nhu cầu mua**: Tìm kiếm nguồn hàng, nhà cung cấp, đối tác gia công.
- **Đăng năng lực bán**: Giới thiệu gói giải pháp, ưu đãi B2B dành riêng cho cộng đồng ViOne.
- **Bấm gửi báo giá / Đề xuất hợp tác**: Kết nối trực tiếp người mua và người bán.

### 9.3. Lịch sự kiện & Điểm danh vé QR tốc độ cao
- Xem danh sách các hội thảo xúc tiến, gala giao thương, workshop đào tạo sắp diễn ra.
- Đăng ký tham gia ➔ Nhận vé điện tử có mã QR.
- Tại cửa sự kiện: Đưa mã QR cho ban tổ chức quét để điểm danh tức thì (Fast QR Check-in).

---

# 10. TRUNG TÂM THẺ SỐ & THIẾT LẬP CÁ NHÂN (`/connect-app/me`)

### 10.1. Quản lý danh thiếp điện tử đa năng (Multi-cards)
- Doanh nhân có thể tạo và quản lý nhiều danh thiếp khác nhau phục vụ các vai trò khác nhau (Ví dụ: Thẻ Chủ tịch Công ty A, Thẻ Cố vấn Quỹ Đầu tư B).
- Tùy chỉnh màu sắc, giao diện thẻ (Titanium Gold, Obsidian Black, Pure Platinum).

### 10.2. Kích hoạt & Đồng bộ thẻ Titanium NFC (`/connect-app/activate`)
1. Nhận thẻ vật lý ViOne Titanium NFC do ban quản trị cấp.
2. Mở màn hình `/connect-app/activate`.
3. Quét mã kích hoạt in trên phong bao thẻ hoặc nhập chuỗi ký tự bí mật.
4. Chọn Thẻ số trên app muốn liên kết vào thẻ cứng vật lý ➔ Thẻ cứng lập tức được đồng bộ dữ liệu.

### 10.3. Đổi ảnh đại diện, ảnh bìa (Đồng bộ MinIO Storage)
- Bấm vào biểu tượng máy ảnh trên Avatar hoặc Ảnh bìa.
- Chọn ảnh chụp chân dung chuyên nghiệp ➔ Hệ thống xử lý và tải lên MinIO S3 an toàn.

### 10.4. Quản lý bảo mật, đổi mật khẩu & Quản lý phiên đăng nhập
- **Đổi mật khẩu**: Cập nhật mật khẩu định kỳ để bảo vệ tài khoản.
- **Quản lý phiên đăng nhập (`/connect-app/me/sessions`)**: Xem danh sách các thiết bị đang đăng nhập tài khoản của bạn (iPhone, Samsung, Máy tính Chrome...) và bấm nút *"Đăng xuất khỏi thiết bị khác"* nếu phát hiện nghi vấn.

---

# 11. CÂU HỎI THƯỜNG GẶP (FAQ) & XỬ LÝ SỰ CỐ

### Q1: Người nhận chạm thẻ của tôi nhưng điện thoại họ không phản hồi thì xử lý thế nào?
* **Trả lời**:
  1. Với iPhone (từ iPhone Xr/Xs trở lên): Vị trí chip đọc NFC nằm ở **đỉnh đầu máy cạnh camera**. Hãy chạm nhẹ đầu thẻ vào phần đỉnh lưng iPhone.
  2. Với Android: Kiểm tra xem người nhận đã bật tính năng **NFC** trong menu cài đặt nhanh hay chưa. Vị trí chip NFC thường nằm ở chính giữa lưng máy.
  3. Nếu máy không hỗ trợ NFC: Lật mặt sau thẻ để người nhận quét **Mã QR Khắc Laser** bằng camera thông thường.

### Q2: Tôi bị mất thẻ cứng Titanium NFC thì có nguy cơ lộ thông tin không?
* **Trả lời**: Hoàn toàn không. Thẻ NFC chỉ chứa đường dẫn liên kết tới Profile công khai của bạn. Nếu bị mất thẻ, bạn chỉ cần vào `/connect-app/me` ➔ Chọn mục thẻ bị mất và bấm **"Hủy kích hoạt thẻ" (Deactivate)**, thẻ bị mất sẽ lập tức trở thành thẻ trắng vô hiệu.

### Q3: Ứng dụng báo lỗi "Không thể tải ảnh / Mạng không khả dụng"?
* **Trả lời**: Kiểm tra lại kết nối mạng 4G/Wifi. Đảm bảo cổng HTTPS `5445` và cổng MinIO `9060` của server dev đang hoạt động bình thường. Nếu xuất hiện cảnh báo SSL, hãy bấm *"Tiếp tục truy cập an toàn"* trên trình duyệt.
