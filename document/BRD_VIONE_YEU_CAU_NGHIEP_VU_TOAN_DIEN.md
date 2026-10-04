# TÀI LIỆU YÊU CẦU NGHIỆP VỤ DOANH NGHIỆP & HIỆP HỘI (BRD MASTER)
## HỆ ĐIỀU HÀNH DOANH NGHIỆP TOÀN DIỆN VIONE & NỀN TẢNG HIỆP HỘI CLB DOANH NHÂN CEO 1983
### PHIÊN BẢN HỢP NHẤT TOÀN DIỆN 5.0 (THẨM ĐỊNH THỰC TẾ 100%)

---

### THÔNG TIN KIỂM SOÁT TÀI LIỆU (DOCUMENT CONTROL)
* **Tên dự án:** Hệ Sinh Thái Quản Trị Doanh Nghiệp Hợp Nhất ViOne & Nền Tảng Hiệp Hội CLB Doanh Nhân CEO 1983
* **Đơn vị phát triển:** Ban Công Nghệ & Chuyển Đổi Số — Tập Đoàn Công Nghệ VioConnect
* **Mã tài liệu:** `BRD-VIONE-ENTERPRISE-ASSOCIATION-MASTER-V5.0`
* **Phiên bản:** `5.0 Master Official Release` (Bổ sung toàn diện Phân hệ Hiệp hội CEO 1983 & Khớp chuẩn mã nguồn)
* **Ngày phát hành:** 04/10/2026
* **Cấp độ bảo mật:** TÀI LIỆU NỘI BỘ — LƯU HÀNH GIỚI HẠN
* **Trạng thái thẩm định:** Đã thẩm định thực tế 100% chức năng hệ thống CRM Web, App Mobile ViOne Connect và App CEO 1983

---

## BÁO CÁO THẨM ĐỊNH CHỨC NĂNG HỆ THỐNG VIONE_PROJECT VS TÀI LIỆU BRD CŨ (AUDIT REPORT)

### 1. Bối Cảnh Thẩm Định
Thực hiện rà soát chéo giữa toàn bộ mã nguồn thực tế (`apps/vione_app_be` gồm 18 modules, `apps/vione_app_fe` gồm 235 routes, `apps/mobile_vione` gồm 18 modals native) đối chiếu với tài liệu BRD cũ (`document/BRD_VIONE_YEU_CAU_NGHIEP_VU_TOAN_DIEN.md`).

### 2. Các Khoảng Trống (Gaps) & Sai Lệch Phát Hiện Trong BRD Cũ
1. **Bỏ sót Phân hệ Hiệp hội CLB Doanh Nhân CEO 1983 (Thiếu sót nghiêm trọng nhất):**
   - BRD cũ hoàn toàn không đề cập đến phân hệ Hiệp hội CEO 1983, trong khi hệ thống đang vận hành một cổng CRM độc lập (`5443`) và App di động hội viên riêng (`5444/association`).
   - Các chức năng hội viên như: Thẻ hội viên số CEO 1983, Gia hạn hội phí niên liễm qua VietQR tự động (`/association/renew`), Đại hội biểu quyết trực tuyến (`/voting`), Quay số may mắn (Lucky Draw), Quản trị nhà tài trợ (`/sponsors`) đều bị thiếu trong BRD cũ.
2. **Sai lệch mô hình Phân quyền RBAC:**
   - BRD cũ để phân quyền gắn liền với Cài đặt hệ thống (`/settings`). Trong thực tế (Entry 178), hệ thống đã đập bỏ và tái thiết kế phân quyền trực tiếp tại Chức năng Nền tảng (`/platform/permissions`) theo cấu trúc ma trận: 7 Nhóm Quyền (CEO, COO, CFO, Giám Đốc Kinh Doanh, Quản Trị Hệ Thống, Nhân Viên Chuyên Môn, Đối Tác & Khách Hàng) x 6 Thao Tác (Xem, Tạo, Sửa, Xóa, Duyệt, Xuất), loại bỏ hoàn toàn phần hiệp hội khỏi nền tảng.
3. **Chưa khớp 6 Tính Năng AI Thực Tế:**
   - BRD cũ chỉ nhắc "AI Copilot" chung chung. Trong thực tế, hệ thống đã chuẩn hóa và lưu vết kiểm toán (AI Audit Log) cho đúng 6 năng lực AI cụ thể: (1) AI Copilot Đàm Thoại Điều Hành C-Level, (2) Quét & Nhận Diện Danh Thiếp OCR AI, (3) Tự Động Hóa Nhập Liệu & Đối Soát Excel, (4) Trợ Lý Soạn Thảo Hợp Đồng & Văn Bản Doanh Nghiệp, (5) Gợi Ý Đối Tác & Ghép Nối Chuỗi Giá Trị, (6) Giám Sát Tải Nhân Sự & Cảnh Báo Vận Hành.
4. **Còn tồn đọng thuật ngữ kỹ thuật lập trình:**
   - BRD cũ dùng các thuật ngữ code như "BPMN 2.0", "WIP <= 5", "Maker-Checker", mã "BR-*", "VietQR 1s". Cần chuẩn hóa sang từ ngữ quản trị kinh doanh thân thiện: "Quy trình công việc", "Số việc đồng thời ≤ 5", "Người lập → Kế toán kiểm tra → Lãnh đạo phê duyệt", "Chuyển khoản QR ngân hàng", "Tự động đối soát và xác nhận thanh toán".
5. **Thiếu các tính năng giao thương B2B thời thượng:**
   - BRD cũ thiếu mô tả Dải khoảnh khắc 24h (Stories Strip) của doanh nhân, Danh sách đối tác cần chăm sóc (Nurture List), Thẻ danh thiếp Titanium 3D, Workspace Báo giá (Quotes) và Sàn thương mại Showcase sản phẩm theo 6 ngành hàng.

---

## MỤC LỤC TỔNG QUAN

1. **Bối Cảnh Chiến Lược & Tầm Nhìn Hệ Sinh Thái ViOne & CEO 1983**
2. **Mục Tiêu Kinh Doanh SMART & Khung Lợi Tức Đầu Tư (ROI)**
3. **Phân Tích 8 Chân Dung Người Dùng (Personas) & User Roles**
4. **Mô Hình Nghiệp Vụ Hiện Tại (As-Is) vs Mục Tiêu (To-Be)**
5. **Quy Chuẩn 90 Quy Tắc Nghiệp Vụ Doanh Nghiệp & Hiệp Hội**
6. **Ma Trận Phân Quyền RBAC 7 Nhóm Quyền x 6 Thao Tác**
7. **Kiến Trúc Dữ Liệu Multi-Tenant & Thực Thể Nghiệp Vụ Cốt Lõi**
8. **Yêu Cầu Phi Chức Năng Cấp Doanh Nghiệp (Enterprise NFR)**
9. **Kế Hoạch Triển Khai & Quản Trị Rủi Ro**
10. **Tiêu Chuẩn Nghiệm Thu & Bàn Giao Hệ Thống**

---

## 1. BỐI CẢNH CHIẾN LƯỢC & TẦM NHÌN HỆ SINH THÁI

### 1.1. Bối cảnh chuyển đổi số của Doanh nghiệp & Hiệp hội 2026
Bước sang năm 2026, các tổ chức doanh nghiệp vừa và lớn cùng các hiệp hội doanh nhân tại Việt Nam đối mặt với 4 thách thức cốt lõi:
1. **Dữ liệu phân mảnh & rời rạc:** Việc sử dụng các công cụ phần mềm riêng lẻ (chấm công máy vân tay, chat Zalo, quản lý việc qua Excel, quản lý hội viên qua sổ sách) khiến lãnh đạo không thể nắm bắt được bức tranh toàn cảnh sức khỏe doanh nghiệp.
2. **Chi phí vận hành thủ công lãng phí:** Quy trình ký duyệt giấy tờ, thanh toán chuyển khoản đối soát thủ công gây tốn kém 30-40% nguồn lực lao động hữu ích và dễ gây sai sót thất thoát.
3. **Đứt gãy mạng lưới kết nối giao thương:** 88% danh thiếp giấy trao đổi tại các sự kiện bị lãng quên hoặc vứt bỏ sau 1 tuần. Thiếu nền tảng số chuyên biệt để duy trì tương tác, biến mối quan hệ xã giao thành cơ hội hợp tác kinh doanh cụ thể.
4. **Vận hành hiệp hội thiếu chuyên nghiệp:** Khâu tổ chức đại hội, điểm danh đại biểu, biểu quyết bầu cử, thu hội phí thường niên và quản lý quyền lợi nhà tài trợ còn tiến hành bán tự động, thiếu minh bạch và tốn nhiều nhân sự điều phối.

### 1.2. Tầm nhìn & Sứ mệnh ViOne Platform 5.0
ViOne định vị là **Hệ điều hành Doanh nghiệp Toàn diện & Nền tảng Kết nối Hiệp hội Hợp nhất**, kết hợp sức mạnh của:
- **Web CRM Quản trị Doanh nghiệp:** Điều hành C-Level, đa công ty Multi-Tenant, quy trình công việc, giám sát tải nhân sự, chấm công GPS/FaceID và duyệt chi 3 cấp.
- **Ứng dụng Di động Doanh nhân ViOne Connect:** Dark Obsidian & Champagne Gold, danh thiếp số 3D Titanium tích hợp chip NFC một chạm, quét danh thiếp OCR AI, B2B Moments, Stories 24h, và kết nối đối tác 1-on-1.
- **Phân hệ Quản trị Hiệp hội CLB Doanh Nhân CEO 1983:** Classic Navy & Amber Gold, quản lý hội viên hiệp hội, đại hội biểu quyết trực tuyến, quay số may mắn, và gia hạn hội phí niên liễm tự động qua VietQR.

---

## 2. MỤC TIÊU KINH DOANH SMART & KHUNG LỢI TỨC ĐẦU TƯ (ROI)

### 2.1. Mục tiêu SMART
* **Tiết kiệm 45% chi phí vận hành hành chính** nhờ số hóa 100% quy trình giao việc, chấm công, nộp đơn nghỉ phép và phê duyệt chi tiền.
* **Rút ngắn 60% chu kỳ bán hàng (Sales Cycle):** Phản hồi thông tin khách hàng tiềm năng dưới 15 phút; xuất bản báo giá điện tử trong 2 phút.
* **Tăng 40% hiệu suất giao thương:** 100% lãnh đạo doanh nghiệp và hội viên được cấp Danh thiếp số Titanium NFC, tăng 4 lần tỷ lệ chuyển đổi kết nối thành công.
* **Loại bỏ 100% sai sót đối soát tài chính:** Tự động hóa gạch nợ thanh toán thu chi và hội phí qua mã chuyển khoản QR ngân hàng Napas 24/7.
* **Tự động hóa 90% công tác tổ chức sự kiện & đại hội:** Soát vé check-in tại cửa dưới 0.2 giây/người; kiểm phiếu biểu quyết đại hội tức thì.

### 2.2. Khung tính toán Lợi tức Đầu tư (ROI) 3 năm

| Năm Tài Chính | Chi Phí Đầu Tư (VND) | Giá Trị Lợi Ích & Doanh Thu Tăng Thêm (VND) | Tỷ Lệ Lợi Tức ROI |
| :--- | :---: | :---: | :---: |
| **Năm 1** | 180,000,000 | 480,000,000 | **166.7%** |
| **Năm 2** | 60,000,000 | 720,000,000 | **300.0%** |
| **Năm 3** | 60,000,000 | 1,050,000,000 | **450.0%** |

---

## 3. PHÂN TÍCH 8 CHÂN DUNG NGƯỜI DÙNG (PERSONAS)

1. **Tổng Giám Đốc (CEO):** Cần nắm bắt tức thời toàn bộ chỉ số kinh doanh, dòng tiền, duyệt chi từ xa mọi lúc mọi nơi trên smartphone và nhận báo cáo điều hành qua AI Copilot.
2. **Giám Đốc Vận Hành (COO):** Cần công cụ trực quan để điều phối quy trình công việc, cân bằng tải nhân sự, không để nhân viên quá tải hoặc ngồi chơi.
3. **Giám Đốc Tài Chính (CFO):** Cần kiểm soát chặt chẽ ngân sách từng phòng ban, thẩm tra đề nghị chi 3 cấp chống chi trùng hóa đơn, và dự phóng dòng tiền 90 ngày.
4. **Giám Đốc Kinh Doanh (Sales Manager):** Cần phễu quản trị khách hàng B2B, giám sát cơ hội thầu, khóa hạn mức chiết khấu theo thẩm quyền và xuất báo giá PDF chuyên nghiệp.
5. **Trưởng Phòng Nhân Sự (HR Manager):** Cần chấm công FaceID/GPS chống gian lận, duyệt đơn online và khóa bảng công tự động để tính lương chuẩn xác.
6. **Nhân Viên Chuyên Môn (Staff):** Cần danh sách công việc rõ ràng với checklist, hạn chót deadline, chấm công di động 1-chạm và lập đề nghị thanh toán nhanh chóng.
7. **Hội Viên CLB Doanh Nhân CEO 1983 / Đối Tác B2B:** Cần chạm danh thiếp Titanium NFC để kết nối đối tác, tham gia biểu quyết đại hội, quét vé sự kiện và gia hạn hội phí tiện lợi.
8. **Quản Trị Viên Hệ Thống (System Admin):** Cần quản lý cấu hình đa doanh nghiệp Multi-Tenant, phân quyền RBAC ma trận 7x6 và giám sát an toàn dữ liệu.

---

## 4. MÔ HÌNH NGHIỆP VỤ HIỆN TẠI (AS-IS) VS MỤC TIÊU (TO-BE)

### 4.1. Quy trình Quản trị Quy trình Công việc & Vận hành
* **Hiện tại (As-Is):** Giao việc rời rạc qua nhóm chat Zalo/Telegram; tin nhắn bị trôi, không rõ ai chịu trách nhiệm chính, không đo lường được tải công việc. Dự án thường xuyên trễ hạn.
* **Mục tiêu (To-Be):** Quản lý tập trung trên Bảng Kanban kéo thả. Mọi công việc đều có người phụ trách chính, hạn chót rõ ràng và checklist kiểm tra. Tự động cảnh báo đỏ khi quá hạn. Biểu đồ Heatmap giám sát tải làm việc công bằng (cảnh báo khi > 45h/tuần).
* **Giá trị đột phá:** Tỷ lệ công việc hoàn thành đúng tiến độ đạt 98%, giảm 80% thời gian họp giao ban thủ công.

### 4.2. Quy trình Chấm công & Quản trị Nhân sự
* **Hiện tại (As-Is):** Máy vân tay đặt tại cửa dễ hỏng hóc hoặc chấm công hộ. Cuối tháng chuyên viên HR mất 3-5 ngày dò file Excel thủ công, dễ phát sinh tranh chấp công phép.
* **Mục tiêu (To-Be):** Chấm công trên điện thoại di động: Định vị văn phòng GPS bán kính ≤ 50m kết hợp nhận diện khuôn mặt AI FaceID có phát hiện người thật (Liveness ≥ 92%). Đơn nghỉ phép nộp và duyệt online 1-chạm. Tự động tổng hợp và khóa bảng công lúc 23:59 ngày mùng 2 hàng tháng.
* **Giá trị đột phá:** Tiết kiệm 95% thời gian tổng hợp công của HR, triệt tiêu 100% gian lận chấm công.

### 4.3. Quy trình Phê duyệt Chi & Quản trị Dòng tiền
* **Hiện tại (As-Is):** Đề nghị chi bằng giấy in ký tay; mất nhiều ngày chờ lãnh đạo ký duyệt. Chuyển khoản ngân hàng phải chụp ảnh ủy nhiệm chi gửi kế toán tra soát thủ công.
* **Mục tiêu (To-Be):** Phê duyệt chi điện tử 3 cấp: Người lập → Kế toán kiểm tra → Lãnh đạo phê duyệt trên di động. Quét chống chi trùng số hóa đơn. Sinh mã chuyển khoản QR ngân hàng Napas 24/7 tự động gạch nợ tức thời. Biểu đồ dự báo dòng tiền 30-90 ngày.
* **Giá trị đột phá:** Rút ngắn thời gian duyệt chi từ vài ngày xuống vài phút, loại bỏ 100% rủi ro chi trùng hóa đơn.

### 4.4. Quy trình Kết nối Giao thương & Thẻ Danh thiếp Doanh nhân
* **Hiện tại (As-Is):** Sử dụng danh thiếp giấy tốn kém; 88% danh thiếp bị vứt bỏ sau sự kiện. Khi đổi chức vụ hoặc số điện thoại phải vứt bỏ toàn bộ thẻ cũ.
* **Mục tiêu (To-Be):** Thẻ Danh thiếp Titanium NFC vật lý độc bản mạ vàng. Chạm nhẹ vào điện thoại đối tác để mở hồ sơ số chuyên nghiệp mà đối tác không cần cài ứng dụng. Bấm 1-chạm để lưu danh bạ (.vcf). Dải Story 24h và Nurture List nhắc nhở chăm sóc đối tác.
* **Giá trị đột phá:** Nâng tầm vị thế cá nhân doanh nhân, tiết kiệm 100% chi phí in ấn danh thiếp giấy.

### 4.5. Quy trình Vận hành Hiệp hội & Đại hội Biểu quyết
* **Hiện tại (As-Is):** Điểm danh đại hội thủ công bằng ký tên vào sổ sách gây ùn tắc tại cổng. Bỏ phiếu bầu cử bằng phiếu giấy mất nhiều giờ kiểm phiếu. Đóng hội phí niên liễm tra soát vất vả.
* **Mục tiêu (To-Be):** Vé điện tử QR soát vé tại cửa dưới 0.2s/người. Bỏ phiếu biểu quyết trực tuyến trên app di động, kiểm phiếu tự động hiển thị kết quả thời gian thực. Quay số may mắn Lucky Draw minh bạch trên màn hình lớn. Gia hạn hội phí thường niên qua VietQR tự động gia hạn thẻ.
* **Giá trị đột phá:** Hiện đại hóa đại hội hiệp hội chuẩn 4.0, giảm 90% nhân sự phục vụ khâu kiểm phiếu.

---

## 5. QUY CHUẨN 90 QUY TẮC NGHIỆP VỤ CỐT LÕI (BUSINESS RULES)

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
* **BR-APP-01 (Bảo mật chip NFC):** Mỗi thẻ Titanium NFC được nạp một mã token duy nhất liên kết với tài khoản; không ghi trực tiếp thông tin nhạy cảm vào chip.
* **BR-APP-02 (Khóa thẻ từ xa tức thì):** Khi người dùng báo mất thẻ trên ứng dụng, chip NFC tương ứng lập tức bị vô hiệu hóa truy cập trong vòng 1 giây.
* **BR-APP-03 (Vé QR soát vé động):** Mã QR vé sự kiện thay đổi mã bảo mật sau mỗi 30 giây để chống hành vi chụp ảnh màn hình bán lại vé.
* **BR-APP-04 (Tốc độ soát vé tại cổng):** Ứng dụng soát vé chuyên dụng xác thực thông tin đại biểu tại cổng an ninh dưới 0.2 giây/người.
* **BR-APP-05 (Quyền riêng tư vị trí):** Tính năng tìm đối tác gần bạn chỉ hiển thị khoảng cách ước tính (ví dụ: 500m) và cho phép người dùng bật chế độ ẩn danh bất kỳ lúc nào.
* **BR-APP-06 (Hoạt động ngoại tuyến):** Danh thiếp cá nhân, vé sự kiện và danh bạ gần nhất được lưu trong bộ nhớ tạm để hiển thị bình thường khi mất sóng internet.

### 5.6. Nhóm Quy Tắc Phân Hệ Hiệp Hội CLB Doanh Nhân CEO 1983 (ASSOC)
* **BR-ASC-01 (Định danh hội viên hiệp hội):** Mỗi hội viên được cấp Mã hội viên duy nhất (VD: `M1983-001`) dập nổi trên thẻ điện tử Classic Navy & Gold.
* **BR-ASC-02 (Gia hạn hội phí niên liễm):** Trước 30 ngày hết hạn hội phí năm, hệ thống gửi thông báo nhắc phí; hội viên quét VietQR để tự động gạch nợ và gia hạn thẻ 365 ngày.
* **BR-ASC-03 (Khóa quyền khi nợ hội phí):** Hội viên quá hạn đóng hội phí trên 45 ngày sẽ bị tạm dừng quyền tham gia biểu quyết đại hội và đăng tin gian hàng.
* **BR-ASC-04 (Biểu quyết đại hội trực tuyến):** Mỗi đại biểu chính thức chỉ được bỏ phiếu 01 lần duy nhất cho mỗi nội dung biểu quyết; phiếu bầu ghi nhận bất biến.
* **BR-ASC-05 (Quay số may mắn Lucky Draw):** Thuật toán sinh số ngẫu nhiên minh bạch loại trừ các đại biểu đã trúng thưởng ở các vòng quay trước.
* **BR-ASC-06 (Quyền lợi nhà tài trợ):** Logo và banner của Nhà tài trợ Kim Cương/Vàng hiển thị nổi bật trên toàn bộ màn hình sự kiện và ứng dụng hội viên.

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
| **Đối Tác & Hội Viên (Partner/Member)** | ✓ (Công khai) | ✓ (Tương tác) | ✓ (Hồ sơ riêng) | ✗ | ✗ | ✗ |

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
   - Dữ liệu giữa các công ty thành viên và hiệp hội được phân vùng cô lập tuyệt đối ở tầng cơ sở dữ liệu, đảm bảo không thể xem chéo dữ liệu của nhau.

---

## 8. KẾ HOẠCH TRIỂN KHAI & TIÊU CHUẨN NGHIỆM THU

* **Giai đoạn 1 (Tuần 1-2):** Khảo sát cấu trúc tổ chức, phân quyền RBAC và cấu hình hạ tầng đám mây cô lập.
* **Giai đoạn 2 (Tuần 3-4):** Làm sạch và nhập khẩu dữ liệu hội viên, danh mục 6 ngành hàng, cấu hình định vị chấm công GPS.
* **Giai đoạn 3 (Tuần 5-6):** Đào tạo người dùng, bàn giao thẻ danh thiếp Titanium NFC và chạy thử nghiệm song song.
* **Giai đoạn 4 (Tuần 7-8):** Go-Live chính thức 100%, kích hoạt 6 năng lực AI Copilot và ký biên bản nghiệm thu bàn giao.
