# TÀI LIỆU YÊU CẦU NGHIỆP VỤ DOANH NGHIỆP (BRD MASTER 6.0)
## HỆ ĐIỀU HÀNH DOANH NGHIỆP TOÀN DIỆN VIONE & MẠNG XÃ HỘI GIAO THƯƠNG B2B VIONE CONNECT
### PHIÊN BẢN HỢP NHẤT TOÀN DIỆN 6.0 (THẨM ĐỊNH THỰC TẾ MÃ NGUỒN 100%)

---

### THÔNG TIN KIỂM SOÁT TÀI LIỆU (DOCUMENT CONTROL)
* **Tên dự án:** Hệ Sinh Thái Quản Trị Doanh Nghiệp Toàn Diện ViOne & Mạng Xã Hội Giao Thương Doanh Nhân ViOne Connect
* **Đơn vị phát triển:** Ban Công Nghệ & Chuyển Đổi Số — Tập Đoàn Công Nghệ VioConnect
* **Mã tài liệu:** `BRD-VIONE-ENTERPRISE-CONNECT-MASTER-V6.0`
* **Phiên bản:** `6.0 Master Official Release` (Thẩm định khớp 100% mã nguồn Frontend, Backend và Mobile App)
* **Ngày phát hành:** 05/10/2026
* **Cấp độ bảo mật:** TÀI LIỆU BẢO MẬT NỘI BỘ — LƯU HÀNH GIỚI HẠN
* **Trạng thái thẩm định:** Đã kiểm thử chức năng thực tế trên Web CRM (Port 5446/5445), PWA Web Mobile (/connect-app), và Mobile App Native (Android APK & iOS)

---

## BÁO CÁO THẨM ĐỊNH CHỨC NĂNG HỆ THỐNG VIONE_PROJECT VS TÀI LIỆU BRD CŨ (AUDIT REPORT)

### 1. Bối Cảnh Thẩm Định
Thực hiện rà soát chéo giữa toàn bộ mã nguồn thực tế của dự án `vione_project`:
- Backend NestJS (`apps/vione_app_be`): 18 modules nghiệp vụ, 50+ RESTful APIs, WebSocket Gateway Socket.IO, MinIO S3 Object Storage, kết nối PostgreSQL CSDL độc lập.
- Frontend Web CRM & PWA (`apps/vione_app_fe`): TanStack React Start, Vite, React 19, 235 routes, TailwindCSS 4, hỗ trợ chế độ kép Web CRM Doanh nghiệp và PWA Mobile App (/connect-app).
- Mobile Native App (`apps/mobile_vione`): React Native Expo SDK 52, 18 modals chuyên sâu, Bottom Sheet cử chỉ vuốt tay xuống, đăng nhập đa phương thức Email & Số điện thoại, 2 bản phân phối APK (`ViOne-PWA-latest.apk` 4.52 MB và `ViOne-Connect-latest.apk` 81.4 MB).
Đối chiếu trực tiếp với tài liệu BRD cũ (`document/BRD_VIONE_YEU_CAU_NGHIEP_VU_TOAN_DIEN.md`).

### 2. Các Khoảng Trống (Gaps) & Sai Lệch Đã Hiệu Chỉnh Trong BRD 6.0
1. **Phân định rõ ràng ranh giới sản phẩm ViOne vs Hiệp hội CEO 1983**:
   - *BRD cũ*: Bị pha tạp các nghiệp vụ đại hội biểu quyết, bỏ phiếu bầu cử, quay số may mắn, thẻ hội viên hiệp hội vốn thuộc phân hệ độc lập của CLB CEO 1983 (chạy trên port 5444).
   - *BRD 6.0 hiệu chỉnh*: Tách bạch tuyệt đối. ViOne tập trung 100% vào **Quản Trị Doanh Nghiệp C-Level** và **Mạng Xã Hội Giao Thương Doanh Nhân B2B (ViOne Connect)**.
2. **Cập nhật Luồng Đăng nhập Đa phương thức (Email & Số Điện Thoại)**:
   - *BRD cũ*: Chỉ mô tả đăng nhập bằng email cơ bản, không có hướng dẫn đăng nhập bằng số điện thoại.
   - *BRD 6.0 hiệu chỉnh*: Quy chuẩn hóa luồng đăng nhập chấp nhận cả Email hoặc Số điện thoại (9-12 chữ số), tra cứu chéo `users`, `members` và `member_business_cards`. Cho phép đăng ký tài khoản mới in-app trực tiếp, lưu phiên tự động.
3. **Cập nhật Bottom Sheet Thẻ Doanh Nhân Cong Tròn Vuốt Tay Xuống (Swipe-to-Dismiss)**:
   - *BRD cũ*: Mô tả thẻ hội viên dạng modal cố định thông thường.
   - *BRD 6.0 hiệu chỉnh*: Quy chuẩn hóa popup Bottom Sheet trượt từ dưới lên, bo góc cong tròn 28px, viền mạ vàng champagne, tích hợp bắt cử chỉ vuốt tay xuống (`PanResponder` swipe down) mượt mà để đóng tương tự nút ViOne trung tâm.
4. **Cập nhật Cơ Chế Thông Báo Cài Đặt PWA Cho iOS Safari & WebClip Profile**:
   - *BRD cũ*: Thiếu giải pháp PWA cho hệ điều hành iOS.
   - *BRD 6.0 hiệu chỉnh*: Bổ sung component `ViOnePwaInstallPrompt` tự động nhận diện iOS Safari để hiển thị banner hướng dẫn 3 bước; cung cấp cấu hình Apple WebClip (`.mobileconfig`) hỗ trợ cài đặt 1-chạm lên màn hình chính.
5. **Chuẩn hóa Ma Trận Phân Quyền RBAC 7 Nhóm Quyền x 6 Thao Tác Tại `/platform/permissions`**:
   - Phân quyền trực tiếp tại Chức năng Nền tảng với 7 vai trò: CEO, COO, CFO, Giám Đốc Kinh Doanh, Quản Trị Hệ Thống, Nhân Viên Chuyên Môn, Đối Tác & Khách Hàng.
6. **Chuẩn hóa 6 Năng Lực Trí Tuệ Nhân Tạo ViOne AI Copilot 5.0**:
   - Xác định rõ 6 năng lực AI kèm lưu vết kiểm toán (AI Audit Log).

---

## MỤC LỤC TỔNG QUAN

1. **Bối Cảnh Chiến Lược & Tầm Nhìn Hệ Sinh Thái ViOne Platform 6.0**
2. **Mục Tiêu Kinh Doanh SMART & Khung Lợi Tức Đầu Tư (ROI 3 Năm)**
3. **Phân Tích 8 Chân Dung Người Dùng (Personas) & User Roles**
4. **Mô Hình Nghiệp Vụ Hiện Tại (As-Is) vs Mục Tiêu (To-Be)**
5. **Quy Chuẩn 95 Quy Tắc Nghiệp Vụ Doanh Nghiệp Cốt Lõi (Business Rules)**
6. **Ma Trận Phân Quyền RBAC 7 Nhóm Quyền x 6 Thao Tác**
7. **Kiến Trúc Dữ Liệu Multi-Tenant & Thực Thể Nghiệp Vụ Cốt Lõi**
8. **Yêu Cầu Phi Chức Năng Cấp Doanh Nghiệp (Enterprise NFR)**
9. **Kế Hoạch Triển Khai, Quản Trị Rủi Ro & Tiêu Chuẩn Nghiệm Thu**

---

## 1. BỐI CẢNH CHIẾN LƯỢC & TẦM NHÌN HỆ SINH THÁI

### 1.1. Bối cảnh chuyển đổi số của Doanh nghiệp 2026
Bước sang năm 2026, các doanh nghiệp vừa và lớn tại Việt Nam đối mặt với 4 điểm nghẽn nghiêm trọng:
1. **Dữ liệu phân mảnh & rời rạc:** Phần mềm chấm công, chat Zalo, quản lý việc Trello/Excel, kế toán hóa đơn rời rạc khiến lãnh đạo C-Level mù mờ về sức khỏe doanh nghiệp thời gian thực.
2. **Lãng phí chi phí vận hành thủ công:** Ký duyệt giấy tờ thủ công, chuyển khoản ngân hàng đối soát chậm trễ gây thất thoát và lãng phí 35-40% nguồn lực lao động hữu ích.
3. **Đứt gãy mạng lưới kết nối giao thương B2B:** 88% danh thiếp giấy trao đổi tại hội thảo bị lãng quên hoặc vứt bỏ sau 1 tuần. Thiếu nền tảng số định danh uy tín để duy trì tương tác hợp tác.
4. **Truy cập di động thiếu đồng bộ:** Các hệ thống CRM truyền thống cồng kềnh, không tối ưu cho smartphone, thiếu tính năng làm việc offline và không có khả năng kết nối một chạm NFC.

### 1.2. Tầm nhìn & Sứ mệnh ViOne Platform 6.0
ViOne định vị là **Hệ Điều Hành Doanh Nghiệp Toàn Diện & Mạng Xã Hội Giao Thương Doanh Nhân Hợp Nhất**, gồm 3 trụ cột vững chắc:
- **Trụ cột 1: Web CRM Quản Trị Doanh Nghiệp C-Level:** Bảng điều hành C-Level Executive Dashboard, Đa chi nhánh Multi-Tenant, Quản lý phễu cơ hội kinh doanh B2B, Quy trình công việc Kanban, Quản trị nhân sự & chấm công GPS/FaceID, Duyệt chi 3 cấp Napas VietQR tự động.
- **Trụ cột 2: Ứng Dụng Di Động Doanh Nhân ViOne Connect:** Thiết kế Dark Obsidian & Champagne Gold thượng lưu, Thẻ Doanh nhân Titanium NFC & QR với Bottom Sheet vuốt tay xuống, Dải Story 24h, B2B Moments, Nurture List đối tác, Quét danh thiếp OCR, Hộp thư tin nhắn Messenger 4 danh mục, Sàn cơ hội & Showcase sản phẩm.
- **Trụ cột 3: Trí Tuệ Nhân Tạo ViOne AI Copilot 5.0:** Trợ lý ảo đàm thoại điều hành giọng nói tiếng Việt, nhận diện danh thiếp OCR, tự động đối soát Excel, trợ lý hợp đồng, ghép nối đối tác và cảnh báo vận hành quá hạn SLA.

---

## 2. MỤC TIÊU KINH DOANH SMART & KHUNG LỢI TỨC ĐẦU TƯ (ROI)

### 2.1. Mục tiêu SMART
* **Tiết kiệm 45% chi phí vận hành hành chính** nhờ số hóa 100% quy trình giao việc, chấm công, nộp đơn nghỉ phép và phê duyệt chi tiền.
* **Rút ngắn 60% chu kỳ bán hàng (Sales Cycle):** Phản hồi thông tin khách hàng tiềm năng dưới 15 phút; xuất bản báo giá điện tử trong 2 phút.
* **Tăng 4 lần hiệu suất kết nối B2B:** 100% lãnh đạo doanh nghiệp được cấp Danh thiếp số Titanium NFC, tăng 4 lần tỷ lệ chuyển đổi kết nối thành công.
* **Loại bỏ 100% sai sót đối soát tài chính:** Tự động hóa gạch nợ thanh toán thu chi qua mã chuyển khoản QR ngân hàng Napas 24/7.
* **Tự động hóa 90% công tác tổ chức sự kiện & hội thảo B2B:** Soát vé check-in tại cửa dưới 0.2 giây/người; cấp vé QR VIP tự động.

### 2.2. Khung tính toán Lợi tức Đầu tư (ROI) 3 năm

| Năm Tài Chính | Chi Phí Đầu Tư (VND) | Giá Trị Lợi Ích & Doanh Thu Tăng Thêm (VND) | Tỷ Lệ Lợi Tức ROI |
| :--- | :---: | :---: | :---: |
| **Năm 1** | 180,000,000 | 480,000,000 | **166.7%** |
| **Năm 2** | 60,000,000 | 720,000,000 | **300.0%** |
| **Năm 3** | 60,000,000 | 1,050,000,000 | **450.0%** |

---

## 3. PHÂN TÍCH 8 CHÂN DUNG NGƯỜI DÙNG (PERSONAS)

1. **Tổng Giám Đốc (CEO / Chairman):** Cần nắm bắt tức thời toàn bộ chỉ số kinh doanh, dòng tiền, duyệt chi từ xa mọi lúc mọi nơi trên smartphone và nhận báo cáo điều hành qua AI Copilot.
2. **Giám Đốc Vận Hành (COO):** Cần công cụ trực quan để điều phối quy trình công việc, cân bằng tải nhân sự, không để nhân viên quá tải hoặc ngồi chơi.
3. **Giám Đốc Tài Chính (CFO):** Cần kiểm soát chặt chẽ ngân sách từng phòng ban, thẩm tra đề nghị chi 3 cấp chống chi trùng hóa đơn, và dự phóng dòng tiền 90 ngày.
4. **Giám Đốc Kinh Doanh (Sales Manager / CSO):** Cần phễu quản trị khách hàng B2B, giám sát cơ hội thầu, khóa hạn mức chiết khấu theo thẩm quyền và xuất báo giá PDF chuyên nghiệp.
5. **Trưởng Phòng Nhân Sự (HR Manager):** Cần chấm công FaceID/GPS chống gian lận, duyệt đơn online và khóa bảng công tự động để tính lương chuẩn xác.
6. **Nhân Viên Chuyên Môn (Staff):** Cần danh sách công việc rõ ràng với checklist, hạn chót deadline, chấm công di động 1-chạm và lập đề nghị thanh toán nhanh chóng.
7. **Doanh Nhân / Đối Tác B2B (Business Member / Partner):** Cần chạm danh thiếp Titanium NFC để kết nối đối tác, tham gia sàn cơ hội B2B, quét vé sự kiện và mở rộng mạng lưới giao thương.
8. **Quản Trị Viên Hệ Thống (System Admin):** Cần quản lý cấu hình đa doanh nghiệp Multi-Tenant, phân quyền RBAC ma trận 7x6 và giám sát an toàn dữ liệu.

---

## 4. MÔ HÌNH NGHIỆP VỤ HIỆN TẠI (AS-IS) VS MỤC TIÊU (TO-BE)

### 4.1. Quy trình Quản trị Khách hàng B2B & Phễu Bán Hàng (CRM)
* **Hiện tại (As-Is):** Thông tin khách hàng ghi trong sổ tay hoặc file Excel riêng của từng sale; khi nhân viên nghỉ việc mang theo toàn bộ dữ liệu. Không đo lường được tỷ lệ chuyển đổi qua các giai đoạn.
* **Mục tiêu (To-Be):** Quản lý tập trung trên Phễu bán hàng Kanban. Lưu trữ toàn bộ lịch sử tương tác, báo giá, hợp đồng và hóa đơn. Phân quyền chặt chẽ theo nhân sự phụ trách.
* **Giá trị đột phá:** Tăng 35% tỷ lệ chốt deal, bảo toàn 100% tài sản dữ liệu khách hàng cho doanh nghiệp.

### 4.2. Quy trình Quản trị Quy trình Công việc & Vận hành (Work Management)
* **Hiện tại (As-Is):** Giao việc rời rạc qua nhóm chat Zalo/Telegram; tin nhắn bị trôi, không rõ ai chịu trách nhiệm chính, không đo lường được tải công việc. Dự án thường xuyên trễ hạn.
* **Mục tiêu (To-Be):** Quản lý tập trung trên Bảng Kanban kéo thả. Mọi công việc đều có người phụ trách chính, hạn chót rõ ràng và checklist kiểm tra. Tự động cảnh báo đỏ khi quá hạn. Biểu đồ Heatmap giám sát tải làm việc công bằng (cảnh báo khi > 45h/tuần).
* **Giá trị đột phá:** Tỷ lệ công việc hoàn thành đúng tiến độ đạt 98%, giảm 80% thời gian họp giao ban thủ công.

### 4.3. Quy trình Chấm công & Quản trị Nhân sự (HRM)
* **Hiện tại (As-Is):** Máy vân tay đặt tại cửa dễ hỏng hóc hoặc chấm công hộ. Cuối tháng chuyên viên HR mất 3-5 ngày dò file Excel thủ công, dễ phát sinh tranh chấp công phép.
* **Mục tiêu (To-Be):** Chấm công trên điện thoại di động: Định vị văn phòng GPS bán kính ≤ 50m kết hợp nhận diện khuôn mặt AI FaceID có phát hiện người thật (Liveness ≥ 92%). Đơn nghỉ phép nộp và duyệt online 1-chạm. Tự động tổng hợp và khóa bảng công lúc 23:59 ngày mùng 2 hàng tháng.
* **Giá trị đột phá:** Tiết kiệm 95% thời gian tổng hợp công của HR, triệt tiêu 100% gian lận chấm công.

### 4.4. Quy trình Phê duyệt Chi & Quản trị Dòng tiền (Finance)
* **Hiện tại (As-Is):** Đề nghị chi bằng giấy in ký tay; mất nhiều ngày chờ lãnh đạo ký duyệt. Chuyển khoản ngân hàng phải chụp ảnh ủy nhiệm chi gửi kế toán tra soát thủ công.
* **Mục tiêu (To-Be):** Phê duyệt chi điện tử 3 cấp: Người lập → Kế toán kiểm tra → Lãnh đạo phê duyệt trên di động. Quét chống chi trùng số hóa đơn. Sinh mã chuyển khoản QR ngân hàng Napas 24/7 tự động gạch nợ tức thời. Biểu đồ dự báo dòng tiền 30-90 ngày.
* **Giá trị đột phá:** Rút ngắn thời gian duyệt chi từ vài ngày xuống vài phút, loại bỏ 100% rủi ro chi trùng hóa đơn.

### 4.5. Quy trình Kết nối Giao thương & Thẻ Danh thiếp Doanh nhân (ViOne Connect)
* **Hiện tại (As-Is):** Sử dụng danh thiếp giấy tốn kém; 88% danh thiếp bị vứt bỏ sau sự kiện. Khi đổi chức vụ hoặc số điện thoại phải vứt bỏ toàn bộ thẻ cũ.
* **Mục tiêu (To-Be):** Thẻ Danh thiếp Titanium NFC vật lý độc bản mạ vàng. Chạm nhẹ vào điện thoại đối tác để mở hồ sơ số chuyên nghiệp mà đối tác không cần cài ứng dụng. Bấm 1-chạm để lưu danh bạ (.vcf). Bấm Thẻ Doanh Nhân trên app bật Bottom Sheet cong tròn vuốt tay xuống để đóng. Dải Story 24h và Nurture List nhắc nhở chăm sóc đối tác.
* **Giá trị đột phá:** Nâng tầm vị thế cá nhân doanh nhân, tiết kiệm 100% chi phí in ấn danh thiếp giấy.

---

## 5. QUY CHUẨN 95 QUY TẮC NGHIỆP VỤ CỐT LÕI (BUSINESS RULES)

### 5.1. Nhóm Quy Tắc Quản Trị Khách Hàng B2B & Bán Hàng (CRM)
* **BR-CRM-01 (Định danh doanh nghiệp):** Khách hàng doanh nghiệp bắt buộc có Mã số thuế duy nhất; hệ thống tự động ngăn chặn tạo trùng lặp.
* **BR-CRM-02 (Tiếp cận khách hàng):** Khách hàng tiềm năng mới phải được phân bổ tới nhân viên kinh doanh và liên hệ lần đầu trong tối đa 15 phút.
* **BR-CRM-03 (Hạn mức chiết khấu):** Nhân viên kinh doanh được chiết khấu tối đa 5%; mức 6-15% do Trưởng phòng duyệt; trên 15% bắt buộc do Tổng Giám Đốc duyệt.
* **BR-CRM-04 (Thời hạn hiệu lực báo giá):** Báo giá điện tử có hiệu lực mặc định 15 ngày; quá hạn hệ thống tự động khóa không cho ký hợp đồng nếu chưa gia hạn.
* **BR-CRM-05 (Chăm sóc đối tác định kỳ):** Nếu đối tác trong danh bạ quá 30 ngày không có tương tác, hệ thống tự động đưa vào danh sách "Cần giữ kết nối & chăm sóc" (Nurture List).
* **BR-CRM-06 (Bảo mật liên hệ):** Nhân viên kinh doanh chỉ được xem số điện thoại và email của khách hàng do mình phụ trách.
* **BR-CRM-07 (Khóa giao dịch khi nợ quá hạn):** Khách hàng có khoản nợ quá hạn trên 60 ngày sẽ bị tự động khóa quyền mua hàng mới.
* **BR-CRM-08 (Xuất dữ liệu an toàn):** Thao tác xuất Excel danh sách khách hàng giới hạn tối đa 500 dòng/lần và ghi nhật ký IP người dùng vào Audit Log.

### 5.2. Nhóm Quy Tắc Quy Trình Công Việc & Vận Hành (WRK)
* **BR-WRK-01 (Trách nhiệm công việc):** Mỗi thẻ việc tạo ra bắt buộc phải có ít nhất 01 người chịu trách nhiệm chính và 01 Hạn chót (Deadline).
* **BR-WRK-02 (Cảnh báo trễ hạn):** Trước 2 giờ đến hạn chót, hệ thống gửi thông báo nhắc việc; khi quá hạn thẻ việc tự động đổi sang màu đỏ cảnh báo.
* **BR-WRK-03 (Nghiệm thu công việc):** Công việc có tính chất kiểm tra chất lượng chỉ chuyển sang trạng thái Hoàn thành khi có sự phê duyệt của Người quản lý.
* **BR-WRK-04 (Số việc đồng thời ≤ 5):** Mỗi nhân sự không nên có quá 5 công việc ở trạng thái "Đang làm" cùng một thời điểm để đảm bảo chất lượng.
* **BR-WRK-05 (Khối lượng công việc nhân sự):** Nhân sự có tổng thời gian làm việc được giao vượt quá 45 giờ/tuần sẽ bị gắn cờ quá tải trên biểu đồ tải làm việc.
* **BR-WRK-06 (Phụ thuộc công việc):** Công việc B có liên kết phụ thuộc với công việc A sẽ không thể bắt đầu khi công việc A chưa hoàn thành.
* **BR-WRK-07 (Bình luận bất biến):** Trao đổi trong thẻ việc chỉ được chỉnh sửa hoặc xóa trong vòng 15 phút kể từ khi gửi; sau 15 phút sẽ khóa bất biến.

### 5.3. Nhóm Quy Tắc Chấm Công & Quản Trị Nhân Sự (HRM)
* **BR-HRM-01 (Định vị văn phòng):** Tọa độ GPS khi chấm công di động phải nằm trong bán kính tối đa 50 mét so với tọa độ văn phòng được cấu hình.
* **BR-HRM-02 (Nhận diện khuôn mặt AI):** Ảnh nhận diện chấm công phải đạt độ khớp khuôn mặt từ 92% trở lên và phát hiện khuôn mặt sống (chống chụp lại ảnh màn hình).
* **BR-HRM-03 (Đi muộn & Về sớm):** Chấm công vào sau giờ quy định 15 phút tính là Đi muộn; chấm công ra trước giờ quy định 15 phút tính là Về sớm.
* **BR-HRM-04 (Thời hạn nộp đơn nghỉ phép):** Đơn xin nghỉ phép năm phải nộp trước tối thiểu 24 giờ đối với nghỉ 1 ngày, và trước tối thiểu 3 ngày đối với nghỉ từ 2 ngày trở lên.
* **BR-HRM-05 (Khóa bảng chấm công tháng):** Bảng chấm công toàn công ty tự động khóa vào lúc 23:59 ngày mùng 2 hàng tháng.
* **BR-HRM-06 (Bảo mật phiếu lương):** Phiếu lương điện tử gửi tới từng nhân viên được mã hóa độc lập; nghiêm cấm nhân viên xem phiếu lương của người khác.
* **BR-HRM-07 (Thu hồi quyền khi thôi việc):** Khi nhân viên thôi việc, tài khoản truy cập hệ thống và quyền thẻ danh thiếp số tự động bị thu hồi lúc 17:30 ngày làm việc cuối.

### 5.4. Nhóm Quy Tắc Phê Duyệt Chi & Quản Trị Tài Chính (FIN)
* **BR-FIN-01 (Phê duyệt chi 3 cấp):** Mọi khoản chi tiền tuân thủ quy trình 3 cấp: Người lập đề xuất → Kế toán kiểm tra chứng từ → Lãnh đạo phê duyệt.
* **BR-FIN-02 (Hạn mức phê duyệt):** Trưởng phòng duyệt chi dưới 5 triệu VNĐ; Kế toán trưởng duyệt chi dưới 20 triệu VNĐ; trên 20 triệu VNĐ bắt buộc do Tổng Giám Đốc duyệt.
* **BR-FIN-03 (Chống chi trùng hóa đơn):** Hệ thống tự động quét số hóa đơn và mã cơ quan thuế của hóa đơn đầu vào; phát hiện trùng lặp sẽ lập tức khóa tờ trình chi.
* **BR-FIN-04 (Chuyển khoản QR ngân hàng):** Mã QR thanh toán là mã QR động chuẩn Napas, chứa đúng số tiền và nội dung thanh toán để tự động đối soát và xác nhận trong 1 giây.
* **BR-FIN-05 (Kiểm soát hạn mức ngân sách):** Hệ thống từ chối tạo đề xuất chi nếu khoản chi đó làm tổng chi vượt quá 100% ngân sách tháng của phòng ban đã được phê duyệt.
* **BR-FIN-06 (Thời hạn lưu trữ chứng từ):** Toàn bộ hóa đơn, ủy nhiệm chi và biên bản nghiệm thu điện tử được lưu trữ đám mây an toàn tối thiểu 10 năm.

### 5.5. Nhóm Quy Tắc Ứng Dụng Di Động & Danh Thiếp Số (APP)
* **BR-APP-01 (Đăng nhập đa phương thức):** Cho phép đăng nhập bằng Email hoặc Số điện thoại (9-12 chữ số). Tự động chuẩn hóa và tra cứu chéo `users`, `members` và `member_business_cards`.
* **BR-APP-02 (Popup Thẻ Doanh Nhân Vuốt Tay Xuống):** Chạm Thẻ Doanh Nhân trên trang chủ mở Bottom Sheet cong tròn 28px mạ vàng champagne, tích hợp cử chỉ vuốt tay xuống (`dy > 80` hoặc `vy > 0.6`) để đóng tự nhiên.
* **BR-APP-03 (Bảo mật chip NFC):** Mỗi thẻ Titanium NFC được nạp một mã token duy nhất liên kết với tài khoản; không ghi trực tiếp thông tin nhạy cảm vào chip.
* **BR-APP-04 (Khóa thẻ từ xa tức thì):** Khi người dùng báo mất thẻ trên ứng dụng, chip NFC tương ứng lập tức bị vô hiệu hóa truy cập trong vòng 1 giây.
* **BR-APP-05 (Vé QR soát vé động):** Mã QR vé sự kiện thay đổi mã bảo mật sau mỗi 30 giây để chống hành vi chụp ảnh màn hình bán lại vé.
* **BR-APP-06 (Tốc độ soát vé tại cổng):** Ứng dụng soát vé chuyên dụng xác thực thông tin đại biểu tại cổng an ninh dưới 0.2 giây/người.
* **BR-APP-07 (Quyền riêng tư vị trí):** Tính năng tìm đối tác gần bạn chỉ hiển thị khoảng cách ước tính (ví dụ: 500m) và cho phép người dùng bật chế độ ẩn danh bất kỳ lúc nào.
* **BR-APP-08 (Hoạt động ngoại tuyến):** Danh thiếp cá nhân, vé sự kiện và danh bạ gần nhất được lưu trong bộ nhớ tạm để hiển thị bình thường khi mất sóng internet.
* **BR-APP-09 (Thông báo cài PWA iOS Safari):** Tự động hiển thị banner hướng dẫn 3 bước cho người dùng iOS Safari chưa cài app standalone; cung cấp cấu hình Apple WebClip (`.mobileconfig`) cài đặt 1-chạm.

### 5.6. Nhóm Quy Tắc Trí Tuệ Nhân Tạo AI Copilot (AI)
* **BR-AI-01 (Phạm vi dữ liệu huấn luyện):** AI Copilot chỉ được truy xuất dữ liệu trong phạm vi doanh nghiệp người dùng có quyền; tuyệt đối không rò rỉ dữ liệu giữa các tenant.
* **BR-AI-02 (Độ chính xác OCR danh thiếp):** Năng lực nhận diện danh thiếp OCR phải đạt độ chính xác trích xuất trường thông tin tối thiểu 95%.
* **BR-AI-03 (Lưu vết kiểm toán AI Audit Log):** Mọi câu lệnh, phản hồi và hành động do AI đề xuất hoặc thực thi bắt buộc được ghi nhật ký kiểm toán bất biến.

---

## 6. MA TRẬN PHÂN QUYỀN RBAC NỀN TẢNG (7 NHÓM QUYỀN x 6 THAO TÁC)

| Nhóm Vai Trò Doanh Nghiệp | Xem | Tạo | Sửa | Xóa | Duyệt | Xuất Dữ Liệu |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Tổng Giám Đốc (CEO)** | ✓ | ✓ | ✓ | ✓ | ✓ (Toàn quyền) | ✓ |
| **Giám Đốc Vận Hành (COO)** | ✓ | ✓ | ✓ | Hạn chế | ✓ (Quy trình/Việc) | ✓ |
| **Giám Đốc Tài Chính (CFO)** | ✓ | ✓ | ✓ | Hạn chế | ✓ (Chi tiền/Sổ quỹ) | ✓ |
| **Giám Đốc Kinh Doanh (Sales Manager)** | ✓ | ✓ | ✓ | Hạn chế | ✓ (Báo giá/Deal) | ✓ (Có ghi log) |
| **Quản Trị Hệ Thống (System Admin)** | ✓ | ✓ | ✓ | ✓ | ✓ (Cấu hình) | ✓ |
| **Nhân Viên Chuyên Môn (Staff)** | ✓ (Phạm vi việc) | ✓ (Đề xuất) | ✓ (Bản thân) | ✗ | ✗ | ✗ |
| **Đối Tác & Khách Hàng (Partner/Customer)** | ✓ (Công khai) | ✓ (Tương tác) | ✓ (Hồ sơ riêng) | ✗ | ✗ | ✗ |

---

## 7. YÊU CẦU PHI CHỨC NĂNG CẤP DOANH NGHIỆP (ENTERPRISE NFR)

1. **Hiệu năng & Tải cao:**
   - Chịu tải đồng thời tối thiểu 10,000 người dùng trực tuyến (CCU).
   - Thời gian phản hồi API trung bình dưới 150ms đối với 95% tác vụ (p95 < 150ms).
   - Tốc độ soát vé QR Code tại cổng an ninh sự kiện dưới 0.2 giây/người.
2. **An toàn & Bảo mật:**
   - Mã hóa cơ sở dữ liệu ở trạng thái nghỉ bằng chuẩn quân đội AES-256.
   - Truyền tải dữ liệu qua giao thức mã hóa an toàn TLS 1.3.
   - Cơ chế giới hạn tần suất truy cập (Rate Limiting) 100 requests/phút/IP chống tấn công từ chối dịch vụ (DDoS).
   - Đóng dấu bản quyền (Watermark) bảo vệ hình ảnh danh thiếp và hồ sơ mật.
3. **Độ tin cậy & Dự phòng thảm họa:**
   - Cam kết độ sẵn sàng dịch vụ (SLA) tối thiểu 99.98%.
   - Sao lưu dữ liệu tự động hàng ngày lúc 03:00 AM; Mục tiêu điểm phục hồi RPO < 2 giờ, Mục tiêu thời gian phục hồi RTO < 30 phút.
4. **Cô lập dữ liệu Đa công ty (Multi-Tenant Isolation):**
   - Dữ liệu giữa các công ty thành viên được phân vùng cô lập tuyệt đối ở tầng cơ sở dữ liệu, đảm bảo không thể xem chéo dữ liệu của nhau.

---

## 8. KẾ HOẠCH TRIỂN KHAI & TIÊU CHUẨN NGHIỆM THU

* **Giai đoạn 1 (Tuần 1-2):** Khảo sát cấu trúc tổ chức, phân quyền RBAC và cấu hình hạ tầng đám mây cô lập.
* **Giai đoạn 2 (Tuần 3-4):** Làm sạch và nhập khẩu dữ liệu danh bạ khách hàng, danh mục sản phẩm, cấu hình định vị chấm công GPS.
* **Giai đoạn 3 (Tuần 5-6):** Đào tạo người dùng, bàn giao thẻ danh thiếp Titanium NFC và chạy thử nghiệm song song.
* **Giai đoạn 4 (Tuần 7-8):** Go-Live chính thức 100%, kích hoạt 6 năng lực AI Copilot và ký biên bản nghiệm thu bàn giao.

---

## 9. QUY CHUẨN NGHIỆP VỤ PHÂN HỆ CỘNG ĐỒNG B2B, NỘI BỘ DOANH NGHIỆP, HẸN GẶP TƯƠNG TÁC & AI COPILOT 5.0

### 9.1. Phân định rõ ràng 2 Kiểu Cộng Đồng (Dual-Community Architecture)
1. **Cộng Đồng Giao Lưu & Kết Nối Giao Thương B2B (`b2b_networking`)**:
   - **Mục đích:** Không gian kết nối mở giữa các Chủ doanh nghiệp, Giám đốc điều hành các công ty khác nhau nhằm chia sẻ cơ hội hợp tác, tìm kiếm đối tác và quảng bá sự kiện.
   - **Hành động nghiệp vụ (Action Buttons):**
     * `+ Đăng cơ hội`: Đăng cơ hội kinh doanh, hợp tác cung ứng, tìm kiếm nhà phân phối/đại lý.
     * `+ Đăng bài`: Đăng bài chia sẻ kiến thức, tin tức kinh doanh, hoạt động doanh nghiệp.
     * `+ Chia sẻ SK`: Chia sẻ các sự kiện nội bộ hoặc sự kiện từ bên ngoài vào cộng đồng (qua modal `ShareEventModal`).
   - **Cấu trúc Tab hiển thị:** `opportunities` (Cơ hội giao thương), `news` (Bảng tin), `events` (Sự kiện), `members` (Thành viên).
   - **Ràng buộc nghiêm ngặt:** TUYỆT ĐỐI KHÔNG có chức năng Giao việc cho nhân viên hay Giám sát CRM trong cộng đồng B2B.

2. **Cộng Đồng Nội Bộ Doanh Nghiệp (`company_internal`)**:
   - **Mục đích:** Không gian làm việc khép kín dành riêng cho Giám đốc và cán bộ nhân viên của một doanh nghiệp cụ thể.
   - **Hành động nghiệp vụ (Action Buttons):**
     * `+ Giao việc`: Giám đốc giao việc trực tiếp cho nhân viên, kèm deadline, mức độ ưu tiên và liên kết khách hàng CRM.
     * `+ Đăng bài`: Đăng thông báo nội bộ, văn hóa doanh nghiệp, vinh danh khen thưởng.
     * `+ Chia sẻ SK`: Sự kiện sinh nhật, đào tạo nội bộ, đại hội cổ đông, teambuilding công ty.
   - **Cấu trúc Tab hiển thị:** `tasks` (Quản lý công việc), `supervision` (Giám sát CRM), `news` (Bảng tin), `events` (Sự kiện), `members` (Nhân sự công ty).
   - **Quy trình Nhận việc 1-chạm:** Khi Giám đốc giao việc, nhân viên thấy công việc ở trạng thái `assigned` và có nút bấm nổi bật **[⚡ TIẾN HÀNH NHẬN VIỆC]**. Bấm nút $\rightarrow$ chuyển trạng thái sang `in_progress`, lưu timestamp `acceptedAt` và bắn thông báo thời gian thực đến Giám đốc.
   - **Ràng buộc nghiêm ngặt:** TUYỆT ĐỐI KHÔNG có chức năng Đăng cơ hội giao thương B2B trong cộng đồng nội bộ công ty.

### 9.2. Phân quyền Quản trị Cộng đồng "Gia Đình ViOne" Cho Admin Nền Tảng
- Tài khoản Quản trị viên hệ thống (Admin/Owner) khi truy cập cộng đồng "Gia đình ViOne" được định danh là Quản trị viên (`role = 'admin'`, `viewerRole = 'admin'`, `canEdit = true`).
- Hiển thị nút bấm quản trị **[⚙️ Chỉnh sửa cộng đồng]** mở modal `EditCommunityModal` cho phép Quản trị viên cập nhật: Tên cộng đồng, Ảnh đại diện (Logo), Ảnh bìa (Banner), Tagline khẩu hiệu, Giới thiệu chi tiết và Loại hình cộng đồng (`b2b_networking` hoặc `company_internal`).

### 9.3. Quy trình Quan tâm Cơ hội & Đề xuất Hẹn gặp Tương tác qua Chat
1. **Bày tỏ Quan tâm:** Khi một tài khoản xem chi tiết cơ hội của đối tác và bấm `[Quan tâm]`, hệ thống tự động hiển thị nút nổi bật **[📅 Nhắn tin hẹn gặp trao đổi cơ hội]** và bắn thông báo thời gian thực đến người đăng cơ hội.
2. **Gửi Đề xuất Hẹn gặp:** Bấm nút mở modal `ProposeOpportunityMeetingModal` cho phép chọn ngày, giờ, hình thức gặp mặt (Trực tiếp hoặc Online qua Video Call ViOne) và lời nhắn.
3. **Thẻ Tương tác trong Chat (`OpportunityMeetingProposalCard`):** Đề xuất được gửi thẳng vào luồng chat của người đăng dưới dạng Card tương tác chuyên biệt kèm 2 nút hành động:
   - **[Đồng ý hẹn]**: Khi người đăng bấm Đồng ý, cuộc gặp được lưu ngay vào `vba_scheduled_meetings`, kích hoạt sự kiện `meeting-scheduled`, tự động đưa vào Lịch trình công việc hôm nay trên trang chủ (`ExecutiveHome`), và bắn thông báo xác nhận cho cả hai bên.
   - **[Từ chối]**: Cập nhật trạng thái đề xuất thành đã từ chối và thông báo lịch sự cho đối tác.
4. **Theo dõi Đối tác Quan tâm:** Người đăng cơ hội có thể xem danh sách tất cả các đối tác đã bày tỏ quan tâm (`interestedMembers`) kèm chức năng kết nối và đề xuất hẹn gặp tức thì.

### 9.4. Lưu vết Ghi âm Khoảnh khắc (Voice Moments) & Đồng bộ Lịch sử Trang chủ
- Mọi khoảnh khắc có ghi âm giọng nói (`MomentVoiceNote`) sau khi hoàn tất được tự động lưu vào kho lịch sử bền vững `vba_voice_moments_history` và phát sự kiện `voice-moment-saved`.
- Trang chủ `ExecutiveHome` tích hợp tab danh mục thứ 4 **"🎙️ Ghi âm ({count})"** bên cạnh Hôm nay, Sắp tới, Lời nhắc, hiển thị danh sách các bản ghi âm kèm thời lượng, sóng âm trực quan và trình phát audio inline `handleTogglePlayVoice`.
- Người dùng có thể nghe lại mọi lúc các ghi chú giọng nói đã lưu vết tại các khoảnh khắc.

### 9.5. Nâng cấp Trí tuệ Nhân tạo ViOne AI Copilot 5.0 Thông Minh Toàn Năng
1. **Tìm & Phát lại Đoạn Ghi âm Khoảnh khắc:** Khi người dùng ra lệnh giọng nói *"tìm đoạn ghi âm tại khoảnh khắc"*, AI Copilot tự động quét kho lịch sử ghi âm, phản hồi bằng giọng nói và hiển thị thẻ Voice Moment Evidence có nút nghe lại trực tiếp.
2. **Quét Người dùng Quanh Đây Theo Bán Kính:** Khi người dùng hỏi *"quanh đây có ai dùng ViOne không"*, AI kích hoạt API `/connect-app/nearby-users` quét định vị người dùng trong bán kính địa lý (km), hiển thị danh sách người dùng lân cận hoặc phản hồi lịch sự kèm gợi ý; tích hợp thanh thông báo trạng thái vị trí thiết bị.
3. **Phân tích Động Cơ hội & Cuộc gặp (Dynamic Evidence Cards):**
   - Khi hỏi *"tôi được bao nhiêu quan tâm cơ hội của tôi"*, AI tính toán chính xác số lượt quan tâm thực tế và hiển thị thẻ cơ hội kèm nút xem đối tác.
   - Khi hỏi *"tôi có cuộc gặp nào không"*, AI tổng hợp lịch hẹn đã xác nhận kèm thẻ cuộc hẹn có nút vào phòng họp trực tuyến.
4. **Hệ thống Thông báo Đa Tương tác:** Tự động bắn thông báo đẩy và lưu thông báo hệ thống cho mọi tương tác: tin nhắn từ người lạ, có đối tác quan tâm cơ hội, nhận đề xuất hẹn gặp, đối tác đã đồng ý/từ chối lịch hẹn, kết nối thành công.
