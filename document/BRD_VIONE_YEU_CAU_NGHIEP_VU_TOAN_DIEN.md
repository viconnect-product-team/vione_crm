# TÀI LIỆU YÊU CẦU NGHIỆP VỤ DOANH NGHIỆP (BRD MASTER)
## HỆ ĐIỀU HÀNH DOANH NGHIỆP TOÀN DIỆN & CRM HỢP NHẤT VIONE PLATFORM 5.0

---

### THÔNG TIN TÀI LIỆU (DOCUMENT CONTROL)
* **Đơn vị phát triển:** Ban Công Nghệ & Chuyển Đổi Số — Tập Đoàn Công Nghệ VioConnect
* **Tên dự án:** ViOne Platform 5.0 Enterprise Edition
* **Mã tài liệu:** `BRD-VIONE-ENTERPRISE-MASTER-V5.0`
* **Phiên bản:** `5.0 Master Release` (10 Chương Nghiệp Vụ & 80 Quy Tắc Nghiệp Vụ Cốt Lõi)
* **Ngày phát hành:** 02/10/2026
* **Cấp độ bảo mật:** TÀI LIỆU BẢO MẬT NỘI BỘ — LƯU HÀNH GIỚI HẠN
* **Trạng thái:** Đã thẩm định nghiệp vụ, thống nhất với các phòng ban 100%

---

## MỤC LỤC TỔNG QUAN

1. **Bối Cảnh Thị Trường, Tầm Nhìn Chiến Lược & Sứ Mệnh ViOne 5.0**
2. **Mục Tiêu Kinh Doanh SMART, Khung Lợi Tức Đầu Tư (ROI) & KPIs**
3. **Phân Tích Các Bên Liên Quan & 6 Chân Dung Người Dùng (Personas)**
4. **Mô Hình Nghiệp Vụ Hiện Tại (As-Is) vs Mục Tiêu (To-Be) Chuẩn BPMN 2.0**
5. **Bảng Quy Chuẩn 80 Quy Tắc Nghiệp Vụ Cốt Lõi (Business Rules BR-01 -> BR-80)**
6. **Ma Trận Phân Định Trách Nhiệm RACI Cho 25 Hoạt Động Vận Hành**
7. **Kiến Trúc Dữ Liệu & Thực Thể Nghiệp Vụ Cốt Lõi (Data & ERD Specs)**
8. **Yêu Cầu Phi Chức Năng Cấp Doanh Nghiệp (Enterprise NFR)**
9. **Kế Hoạch Phân Kỳ Triển Khai 8 Tuần & Quản Trị Rủi Ro Dự Án**
10. **Tiêu Chuẩn Nghiệm Thu Nghiệp Vụ & Ký Kết Bàn Giao Hệ Thống**

---

## 1. BỐI CẢNH THỊ TRƯỜNG, TẦM NHÌN CHIẾN LƯỢC & SỨ MỆNH VIONE 5.0

### 1.1. Bối cảnh chuyển đổi số của doanh nghiệp Việt Nam 2026
Bước sang năm 2026, các doanh nghiệp vừa và lớn tại Việt Nam đối mặt với 3 bài toán lớn:
1. **Dữ liệu phân mảnh:** Sử dụng nhiều phần mềm rời rạc khiến dữ liệu bị cô lập, báo cáo giao ban bị chậm trễ và sai lệch.
2. **Chi phí vận hành hành chính cao:** Quy trình giấy tờ ký tay, duyệt chi thủ công gây lãng phí 30-40% nguồn lực lao động hữu ích.
3. **Thiếu công cụ kết nối giao thương B2B hiện đại:** Danh thiếp giấy truyền thống gây lãng phí và đánh mất 88% cơ hội kết nối sau sự kiện.

### 1.2. Sứ mệnh của ViOne Platform 5.0
Hệ điều hành Doanh nghiệp Toàn diện & Nền tảng CRM Hợp nhất, tích hợp Trí tuệ nhân tạo (AI Copilot) và Thẻ thông minh Titanium NFC một chạm.

---

## 2. MỤC TIÊU KINH DOANH SMART & KHUNG LỢI TỨC ĐẦU TƯ (ROI)

### 2.1. Mục tiêu SMART
* Tiết kiệm 40% chi phí vận hành hành chính.
* Rút ngắn 50% chu kỳ bán hàng (Sales Cycle), phản hồi lead dưới 15 phút.
* Tăng 35% tỷ lệ khách hàng quay lại nhờ AI Churn Warning.
* Loại bỏ 100% sai sót đối soát tiền tệ nhờ VietQR Napas 24/7 gạch nợ tức thời.

### 2.2. Khung tính toán Lợi tức Đầu tư (ROI) 3 năm

| Năm Tài Chính | Chi Phí Đầu Tư (VND) | Giá Trị Lợi Ích & Doanh Thu Tăng Thêm (VND) | Tỷ Lệ ROI |
| :--- | :--- | :--- | :--- |
| **Năm 1** | 180,000,000 | 440,000,000 | **144.4%** |
| **Năm 2** | 60,000,000 | 680,000,000 | **283.3%** |
| **Năm 3** | 60,000,000 | 950,000,000 | **416.7%** |

---

## 3. PHÂN TÍCH 6 CHÂN DUNG NGƯỜI DÙNG (PERSONAS)

1. **CEO Nguyễn Minh Đăng:** Cần kiểm soát tổng thể sức khỏe doanh nghiệp 24/7 trên smartphone, duyệt chi từ xa và nhận báo cáo tóm tắt bằng AI.
2. **CFO Trần Thu Hà:** Cần kiểm soát ngân sách chi tiêu, phê duyệt điện tử 3 cấp và theo dõi dòng tiền thực thu - chi tức thời.
3. **Sales Director Lê Quốc Dũng:** Cần quản lý phễu lead, giám sát đường ống bán hàng Kanban và khóa hạn mức chiết khấu theo phân quyền.
4. **HR Manager Vũ Mai Anh:** Cần chấm công FaceID/GPS chống gian lận, duyệt đơn nghỉ phép online và tính lương tự động trong 10 giây.
5. **Operations Staff Đặng Nam:** Cần danh sách công việc rõ ràng với checklist, hạn chót deadline và nhắc việc tự động không bị trôi việc.
6. **B2B Partner Phạm Long:** Cần chạm danh thiếp Titanium NFC 1-giây để lưu liên hệ, trao đổi qua chat mã hóa và thanh toán VietQR siêu tốc.

---

## 4. MÔ HÌNH NGHIỆP VỤ HIỆN TẠI (AS-IS) VS MÔ HÌNH MỤC TIÊU (TO-BE)

### 4.1. Quy trình: Quản Trị Bán Hàng & Phễu Lead 360°

* **Mô hình hiện tại (As-Is):** Ghi chép danh sách khách hàng trên sổ tay hoặc các tệp Excel phân mảnh. Thông tin lead từ website, quảng cáo bị trôi, mất trung bình 24-48 giờ mới liên hệ lại. Báo giá soạn thủ công trên Word/Excel dễ sai đơn giá, không kiểm soát được mức chiết khấu của nhân viên.
* **Mô hình mục tiêu (To-Be):** Lead từ Landing Web và đa kênh đổ về tập trung vào ViOne CRM trong 1 giây, tự động phân bổ Round-Robin cho Sales. Báo giá điện tử B2B tạo trong 2 phút theo chuẩn giá niêm yết, kiểm soát chiết khấu tự động, gửi email đính kèm PDF có chữ ký số sang trọng.
* **Giá trị đột phá:** Rút ngắn 85% thời gian phản hồi khách hàng (dưới 15 phút), tỷ lệ chốt Deal tăng 35%, loại bỏ 100% rủi ro mất mát dữ liệu khách hàng khi nhân viên Sales nghỉ việc.

---

### 4.2. Quy trình: Quản Lý Công Việc & Dự Án Vận Hành

* **Mô hình hiện tại (As-Is):** Giao việc chủ yếu qua nhóm chat Zalo, Messenger; tin nhắn trôi nhanh, không rõ ai chịu trách nhiệm chính, không có hạn chót cụ thể. Không có công cụ đo lường tải công việc, người làm việc quá tải, người ngồi rảnh rỗi. Dự án thường xuyên bị trễ hạn từ vài tuần đến vài tháng.
* **Mô hình mục tiêu (To-Be):** Quản lý tập trung trên Bảng Kanban kéo thả và Biểu đồ phụ thuộc Gantt Chart. Mọi công việc đều có người phụ trách, hạn chót Deadline và checklist rõ ràng. Hệ thống tự động cảnh báo đỏ khi có nguy cơ trễ hạn. Biểu đồ Heatmap giám sát tải công việc công bằng.
* **Giá trị đột phá:** Tỷ lệ dự án hoàn thành đúng tiến độ cam kết tăng từ 60% lên 98%, giảm 90% các cuộc họp giao ban mất thời gian, minh bạch năng suất từng cá nhân.

---

### 4.3. Quy trình: Quản Trị Nhân Sự & Chấm Công Tính Lương

* **Mô hình hiện tại (As-Is):** Chấm công bằng máy vân tay đặt tại cửa hay bị lỗi cảm biến hoặc nhân viên chấm công hộ nhau. Cuối tháng chuyên viên HR mất 3-5 ngày dò sổ chấm công thủ công bằng Excel, dễ xảy ra sai sót và tranh chấp công phép. Phiếu lương in giấy tốn kém, không bảo mật.
* **Mô hình mục tiêu (To-Be):** Chấm công định vị GPS kết hợp nhận diện khuôn mặt AI trên điện thoại di động trong 1 giây. Đơn xin nghỉ phép, đổi ca nộp và duyệt online 1-chạm. Bộ máy Payroll Engine tự động tính lương và thuế TNCN chuẩn xác trong 10 giây. Phát hành E-Payslip bảo mật đến từng máy cá nhân.
* **Giá trị đột phá:** Tiết kiệm 95% thời gian làm lương hàng tháng của bộ phận HR, loại bỏ hoàn toàn gian lận chấm công, nâng cao độ hài lòng và niềm tin của người lao động.

---

### 4.4. Quy trình: Quản Trị Tài Chính & Dòng Tiền Thực Thu - Chi

* **Mô hình hiện tại (As-Is):** Đề nghị thanh toán bằng giấy tờ in ký tay rườm rà, mất nhiều ngày chờ lãnh đạo có mặt tại văn phòng để ký duyệt. Thu tiền chuyển khoản ngân hàng phải chụp ảnh ủy nhiệm chi gửi kế toán tra soát thủ công mất thời gian. Không nắm được dự báo dòng tiền tương lai.
* **Mô hình mục tiêu (To-Be):** Phê duyệt chi tiền điện tử 3 cấp (Maker - Checker - Approver) trực tiếp trên smartphone mọi lúc mọi nơi. Tích hợp cổng thanh toán VietQR Napas 24/7 tự động gạch nợ trong 1 giây. Biểu đồ Cashflow thời gian thực và AI dự báo dòng tiền trong 90 ngày tới.
* **Giá trị đột phá:** Rút ngắn thời gian duyệt chi từ vài ngày xuống còn vài phút, quản trị thanh khoản chủ động 24/7, loại bỏ 100% nguy cơ chi trùng hóa đơn hoặc đứt gãy dòng tiền.

---

### 4.5. Quy trình: Kết Nối Giao Thương & Danh Thiếp Doanh Nhân

* **Mô hình hiện tại (As-Is):** Sử dụng danh thiếp giấy truyền thống; tốn hàng triệu đồng in ấn mỗi năm nhưng 88% danh thiếp giấy bị vứt vào sọt rác sau 1 tuần. Khi đổi chức vụ hoặc số điện thoại phải vứt bỏ toàn bộ số thẻ cũ. Trong sự kiện phải gõ tay từng số điện thoại để lưu danh bạ.
* **Mô hình mục tiêu (To-Be):** Trang bị Thẻ Danh thiếp Titanium NFC vật lý độc bản mạ vàng. Chạm nhẹ vào smartphone đối tác để mở Portfolio số chuyên nghiệp trong 1 giây mà đối tác không cần cài app. Đối tác bấm 1-chạm để lưu danh bạ tự động (.vcf). Cập nhật thông tin thẻ tức thì không cần in lại.
* **Giá trị đột phá:** Nâng tầm vị thế thương hiệu cá nhân của doanh nhân lên tầm cao mới, tiết kiệm 100% chi phí in ấn danh thiếp giấy, tỷ lệ chuyển đổi kết nối đối tác thành công tăng 4 lần.

---

## 5. BẢNG QUY CHUẨN 80 QUY TẮC NGHIỆP VỤ CỐT LÕI (BUSINESS RULES BR-01 -> BR-80)

| Mã Quy Tắc | Tên Quy Chuẩn | Logic Xử Lý & Điều Kiện Kích Hoạt | Mức Độ |
| :--- | :--- | :--- | :--- |
| **BR-CRM-01** | Định danh Khách hàng | Mỗi khách hàng doanh nghiệp B2B bắt buộc phải có Mã số thuế (MST) duy nhất; hệ thống tự động ngăn chặn trùng lặp. | Nghiêm trọng (Khóa) |
| **BR-CRM-02** | Phân bổ Lead tự động | Lead mới từ Landing Page phải được hệ thống phân bổ theo vòng tròn Round-Robin tới Sales trong vòng 60 giây. | Cao |
| **BR-CRM-03** | Thời hạn tiếp cận Lead | Nhân viên Sales được phân bổ Lead phải thực hiện cuộc gọi hoặc gửi email đầu tiên trong tối đa 15 phút. | Nghiêm trọng |
| **BR-CRM-04** | Quy tắc chuyển đổi Deal | Lead chỉ được phép chuyển thành Deal khi đã xác thực đủ: Người liên hệ có thẩm quyền, Nhu cầu cụ thể và Ngân sách. | Trung bình |
| **BR-CRM-05** | Hạn mức chiết khấu Sales | Nhân viên kinh doanh chỉ được chiết khấu tối đa 5%; mức chiết khấu 6-15% phải do Trưởng phòng duyệt, trên 15% phải do CEO duyệt. | Nghiêm trọng (Khóa) |
| **BR-CRM-06** | Thời hạn hiệu lực báo giá | Mọi báo giá B2B xuất ra hệ thống mặc định có hiệu lực 15 ngày; quá 15 ngày hệ thống tự động khóa không cho ký hợp đồng nếu chưa gia hạn. | Cao |
| **BR-CRM-07** | Ghi nhật ký tương tác | Mọi cuộc gặp, cuộc gọi với khách hàng phải được cập nhật tóm tắt nội dung vào Activity Timeline trong vòng 24 giờ. | Cao |
| **BR-CRM-08** | Cảnh báo nợ khó đòi | Khách hàng có khoản nợ quá hạn trên 60 ngày sẽ tự động bị khóa quyền tạo Deal mới hoặc mua thêm hàng hóa/dịch vụ. | Nghiêm trọng (Khóa) |
| **BR-CRM-09** | Quyền sở hữu khách hàng | Nếu nhân viên Sales không phát sinh bất kỳ tương tác nào với khách hàng trong 45 ngày, quyền sở hữu tự động quay về kho chung. | Cao |
| **BR-CRM-10** | Quy định lý do mất Deal | Khi chuyển trạng thái Deal sang "Lost", nhân viên bắt buộc phải chọn lý do từ danh mục chuẩn (Giá cao, Thiếu tính năng, Chọn đối thủ...). | Bắt buộc |
| **BR-CRM-11** | Tự động tạo mã hợp đồng | Số hợp đồng kinh tế được sinh tự động theo định dạng: `HD-{YYYY}-{TENANT}-{STT}` và không được phép sửa tay. | Bắt buộc |
| **BR-CRM-12** | Xác thực hai yếu tố báo giá | Báo giá có giá trị trên 500 triệu VNĐ khi xuất bản bắt buộc phải xác thực mã OTP gửi về số điện thoại của Kế toán trưởng. | Nghiêm trọng |
| **BR-CRM-13** | Bảo mật thông tin liên hệ | Chuyên viên chỉ được xem số điện thoại và email của khách hàng do mình phụ trách; không được xem khách hàng của nhóm khác. | Nghiêm trọng (Bảo mật) |
| **BR-CRM-14** | Chấm điểm tiềm năng Lead | Thuật toán AI tự động tính điểm Lead Score từ 0-100; Lead trên 80 điểm bắt buộc phải ưu tiên xử lý trước. | Trung bình |
| **BR-CRM-15** | Tự động gửi email cảm ơn | Sau khi ký hợp đồng thành công, hệ thống tự động gửi email chào mừng và thư ngỏ của CEO tới đại diện khách hàng trong 5 phút. | Tiêu chuẩn |
| **BR-CRM-16** | Theo dõi giá trị vòng đời LTV | Hệ thống tự động cộng dồn doanh số của khách hàng qua mọi năm để cập nhật thứ hạng Hội viên (Bạc, Vàng, Kim Cương). | Tiêu chuẩn |
| **BR-CRM-17** | Xuất dữ liệu có kiểm soát | Thao tác xuất file Excel khách hàng bị giới hạn tối đa 500 dòng/lần và ghi nhật ký IP, người dùng vào Audit Trail. | Nghiêm trọng (Bảo mật) |
| **BR-CRM-18** | Đồng bộ danh bạ di động | Dữ liệu khách hàng đồng bộ xuống app di động ViOne Connect phải được mã hóa AES-256 trong bộ nhớ tạm SQLite. | Nghiêm trọng (Bảo mật) |
| **BR-CRM-19** | Quy tắc gắn nhãn Tags | Mỗi khách hàng phải gắn tối thiểu 01 nhãn ngành nghề và 01 nhãn quy mô doanh nghiệp để phục vụ phân khúc tiếp thị. | Bắt buộc |
| **BR-CRM-20** | Khảo sát sau chốt đơn CSAT | Sau 7 ngày kể từ khi hợp đồng có hiệu lực, hệ thống tự động kích hoạt tin nhắn khảo sát mức độ hài lòng khách hàng. | Tiêu chuẩn |
| **BR-WRK-01** | Bắt buộc có người phụ trách | Mọi thẻ công việc (Task) tạo ra bắt buộc phải có ít nhất 01 người chịu trách nhiệm chính (Assignee) và 01 Hạn chót (Deadline). | Bắt buộc |
| **BR-WRK-02** | Cảnh báo vi phạm tiến độ | Trước 2 giờ đến hạn chót, hệ thống tự động gửi thông báo nhắc việc; khi quá hạn, thẻ việc tự động đổi sang màu đỏ rực. | Cao |
| **BR-WRK-03** | Quy trình nghiệm thu việc | Công việc có tính chất kiểm tra chất lượng chỉ được chuyển sang "Done" khi có sự phê duyệt (Approve) của Quản lý dự án. | Cao |
| **BR-WRK-04** | Giới hạn công việc đang làm (WIP) | Mỗi nhân viên không được phép có quá 5 công việc ở trạng thái "In Progress" cùng một thời điểm để tránh quá tải. | Trung bình |
| **BR-WRK-05** | Kiểm soát hạn mức ngân sách | Tổng chi phí thực tế ghi nhận vào các công việc không được vượt quá 100% ngân sách đã duyệt của dự án nếu chưa có phụ lục duyệt thêm. | Nghiêm trọng (Khóa) |
| **BR-WRK-06** | Phụ thuộc công việc Gantt | Công việc B có liên kết phụ thuộc (Finish-to-Start) với công việc A sẽ không được phép bấm bắt đầu khi công việc A chưa Done. | Cao |
| **BR-WRK-07** | Ghi giờ Timesheet thực tế | Bản ghi thời gian làm việc (Timesheet) nhập thủ công không được lùi quá 48 giờ so với thời điểm phát sinh. | Trung bình |
| **BR-WRK-08** | Bảo quản tệp đính kèm | Tệp tin đính kèm vào công việc bị giới hạn dung lượng tối đa 100MB/tệp và tự động quét mã độc virus trước khi lưu. | Bảo mật |
| **BR-WRK-09** | Lưu trữ dự án hoàn thành | Dự án chỉ được phép chuyển sang trạng thái "Archived" khi 100% công việc con đã đóng và các khoản tạm ứng đã quyết toán. | Cao |
| **BR-WRK-10** | Quyền xem Cổng khách Guest | Tài khoản khách mời (Guest) chỉ được xem thanh tiến độ tổng thể và mốc Milestone; ẩn 100% tài chính và thảo luận nội bộ. | Nghiêm trọng (Bảo mật) |
| **BR-WRK-11** | Tự động tạo việc định kỳ | Công việc định kỳ lặp lại theo tuần/tháng sẽ được sinh ra trước 24 giờ so với thời điểm bắt đầu theo lịch cấu hình. | Tiêu chuẩn |
| **BR-WRK-12** | Bình luận bất biến | Bình luận trao đổi trong thẻ công việc chỉ được phép chỉnh sửa hoặc xóa trong vòng 15 phút kể từ khi gửi; sau 15 phút sẽ khóa bất biến. | Kiểm toán |
| **BR-WRK-13** | Xếp hạng ưu tiên công việc | Công việc gắn nhãn "Khẩn Cấp" tự động đẩy lên vị trí cao nhất trên bảng Kanban của nhân viên phụ trách. | Cao |
| **BR-WRK-14** | Cảnh báo quá tải Workload | Nhân sự có tổng số giờ làm việc được giao vượt quá 45 giờ/tuần sẽ bị hệ thống gắn cờ quá tải trên biểu đồ Heatmap. | Trung bình |
| **BR-WRK-15** | Tự động đóng nhiệm vụ con | Khi chuyển trạng thái công việc cha sang "Done", toàn bộ các mục Checklist con chưa tích chọn sẽ hiển thị hộp thoại xác nhận bắt buộc. | Bắt buộc |
| **BR-HRM-01** | Định vị GPS chấm công | Tọa độ GPS khi chấm công di động phải nằm trong bán kính tối đa 50 mét so với tọa độ văn phòng/chi nhánh được cấu hình. | Nghiêm trọng (Khóa) |
| **BR-HRM-02** | Nhận diện khuôn mặt AI | Ảnh nhận diện chấm công phải đạt độ khớp khuôn mặt từ 92% trở lên và phát hiện khuôn mặt sống (Liveness Detection chống ảnh chụp lại). | Nghiêm trọng (Chống gian lận) |
| **BR-HRM-03** | Quy tắc đi muộn về sớm | Chấm công vào sau giờ quy định 15 phút tính là "Đi muộn"; rời khỏi vị trí trước giờ quy định 15 phút tính là "Về sớm". | Cao |
| **BR-HRM-04** | Thời hạn nộp đơn nghỉ phép | Đơn xin nghỉ phép năm phải nộp trước tối thiểu 24 giờ đối với nghỉ 1 ngày, và trước tối thiểu 3 ngày đối với nghỉ từ 2 ngày trở lên. | Cao |
| **BR-HRM-05** | Cộng dồn quỹ phép năm | Mỗi tháng làm việc đủ công được cộng 01 ngày phép năm; ngày phép tồn năm trước chỉ được chuyển tiếp tối đa 5 ngày sang quý 1 năm sau. | Tiêu chuẩn |
| **BR-HRM-06** | Phê duyệt làm thêm giờ OT | Giờ làm thêm OT chỉ được tính vào bảng lương khi có Đơn đăng ký OT đã được Trưởng phòng phê duyệt trước ca làm việc. | Nghiêm trọng |
| **BR-HRM-07** | Khấu trừ thuế TNCN lũy tiến | Hệ thống tự động áp dụng biểu thuế thu nhập cá nhân lũy tiến 7 bậc và trừ các khoản giảm trừ gia cảnh chuẩn mực theo luật thuế hiện hành. | Pháp lý bắt buộc |
| **BR-HRM-08** | Cảnh báo hết hạn hợp đồng | Trước 30 ngày hợp đồng lao động hết hạn, hệ thống tự động gửi thông báo tới Trưởng phòng HR và nhân viên để thực hiện quy trình tái ký. | Cao |
| **BR-HRM-09** | Bảo mật phiếu lương E-Payslip | Phiếu lương điện tử gửi tới từng nhân viên phải được mã hóa riêng; nghiêm cấm việc nhân viên xem được lương của người khác. | Nghiêm trọng (Bảo mật) |
| **BR-HRM-10** | Quy trình thu hồi quyền khi nghỉ | Khi nhân viên thôi việc, tài khoản truy cập hệ sinh thái ViOne và thẻ Titanium NFC phải được thu hồi tự động lúc 17:30 ngày làm việc cuối. | Nghiêm trọng (Bảo mật) |
| **BR-HRM-11** | Giới hạn giờ OT theo luật | Hệ thống tự động chặn đăng ký làm thêm giờ nếu nhân viên đã tích lũy đủ 40 giờ OT trong tháng hoặc 200 giờ OT trong năm. | Pháp lý bắt buộc |
| **BR-HRM-12** | Xử lý khiếu nại chấm công | Nhân viên có quyền gửi khiếu nại quên chấm công trong vòng 48 giờ kèm lý do và minh chứng để Trưởng phòng xác nhận bổ sung. | Trung bình |
| **BR-HRM-13** | Xác thực CCCD gắn chip | Hồ sơ nhân sự số hóa bắt buộc phải có ảnh quét CCCD gắn chip 2 mặt và số định danh cá nhân hợp lệ. | Bắt buộc |
| **BR-HRM-14** | Khóa bảng chấm công tháng | Bảng chấm công toàn công ty tự động khóa vào 23:59 ngày mùng 2 hàng tháng; sau thời điểm này chỉ có Giám đốc HR mới được mở sửa. | Nghiêm trọng (Khóa) |
| **BR-HRM-15** | Đổi ca trực linh hoạt | Hai nhân viên cùng bộ phận được phép gửi yêu cầu đổi ca trực cho nhau trên app nhưng phải hoàn thành trước giờ vào ca 4 tiếng. | Tiêu chuẩn |
| **BR-FIN-01** | Nguyên tắc phê duyệt chi 3 cấp | Mọi khoản chi tiền phải tuân thủ quy trình 3 cấp: Nhân viên đề xuất (Maker) -> Kế toán trưởng kiểm soát (Checker) -> CEO duyệt (Approver). | Nghiêm trọng (Kiểm soát) |
| **BR-FIN-02** | Hạn mức phê duyệt theo chức danh | Trưởng phòng được duyệt chi dưới 5 triệu; Kế toán trưởng duyệt chi dưới 20 triệu; trên 20 triệu bắt buộc phải do Tổng Giám Đốc ký duyệt. | Nghiêm trọng (Khóa) |
| **BR-FIN-03** | Thanh toán VietQR Napas 24/7 | Mã QR thanh toán phải là mã QR động chuẩn Napas, chứa đúng số tiền và cú pháp giao dịch duy nhất để gạch nợ tự động trong 1 giây. | Tiêu chuẩn |
| **BR-FIN-04** | Kiểm soát hạn mức ngân sách | Hệ thống tự động từ chối tạo đề xuất chi nếu khoản chi đó làm tổng chi của phòng ban vượt quá 100% ngân sách tháng đã phê duyệt. | Nghiêm trọng (Khóa) |
| **BR-FIN-05** | Hạn thời gian quyết toán tạm ứng | Nhân viên nhận tiền tạm ứng công tác phải hoàn thành chứng từ quyết toán trong vòng tối đa 7 ngày làm việc sau khi kết thúc chuyến đi. | Cao |
| **BR-FIN-06** | Đối soát khớp lệnh ngân hàng | Các giao dịch thu chi ngân hàng phải được tự động đối soát với sổ kế toán nội bộ; sai lệch trên 1,000 VNĐ phải được đưa vào danh sách cảnh báo. | Cao |
| **BR-FIN-07** | Chống chi trùng hóa đơn | Hệ thống tự động quét số hóa đơn và mã cơ quan thuế của hóa đơn đầu vào; phát hiện trùng lặp số hóa đơn sẽ lập tức khóa đề nghị chi. | Nghiêm trọng (Chống gian lận) |
| **BR-FIN-08** | Cảnh báo dòng tiền âm dự báo | Khi biểu đồ dự phóng dòng tiền 30 ngày tới chạm ngưỡng số dư tối thiểu an toàn (Safety Buffer), hệ thống kích hoạt cảnh báo đỏ gửi CFO. | Cao |
| **BR-FIN-09** | Tự động xuất hóa đơn điện tử | Hóa đơn điện tử chỉ được phát hành khi giao dịch bán hàng đã nhận đủ 100% tiền thanh toán hoặc có hợp đồng trả chậm được duyệt. | Pháp lý bắt buộc |
| **BR-FIN-10** | Bảo toàn quỹ tiền mặt tại két | Số dư quỹ tiền mặt tại két văn phòng không được vượt quá định mức 50 triệu VNĐ vào cuối ngày; phần vượt phải nộp vào tài khoản ngân hàng. | Cao |
| **BR-FIN-11** | Phân loại dòng tiền 3 hoạt động | Toàn bộ phiếu thu chi phải được gắn mã dòng tiền: Hoạt động Kinh doanh (CFO), Hoạt động Đầu tư (CFI), Hoạt động Tài chính (CFF). | Bắt buộc |
| **BR-FIN-12** | Thời hạn lưu trữ chứng từ kế toán | Toàn bộ ảnh chụp hóa đơn, ủy nhiệm chi, biên bản nghiệm thu điện tử được lưu trữ bất biến trên hệ thống đám mây tối thiểu 10 năm. | Pháp lý bắt buộc |
| **BR-FIN-13** | Xác thực OTP lệnh chuyển tiền | Lệnh chuyển tiền qua cổng Open Banking ra bên ngoài hệ thống bắt buộc phải xác thực mã Smart OTP trên thiết bị di động của Chủ tài khoản. | Nghiêm trọng (Bảo mật) |
| **BR-FIN-14** | Tính điểm hòa vốn tự động | Mỗi đầu sản phẩm mới đưa vào kinh doanh bắt buộc phải khai báo biến phí và định phí để hệ thống tự động tính sản lượng hòa vốn. | Tiêu chuẩn |
| **BR-FIN-15** | Khóa sổ kế toán định kỳ | Sổ nhật ký thu chi tự động khóa vào ngày cuối cùng của tháng; các bút toán điều chỉnh sau thời điểm này phải ghi nhận vào tháng tiếp theo. | Kiểm toán |
| **BR-APP-01** | Mã hóa chip NFC vật lý | Mỗi thẻ Titanium NFC vật lý được nạp một chuỗi token mã hóa duy nhất liên kết với tài khoản; không ghi trực tiếp thông tin nhạy cảm vào chip. | Nghiêm trọng (Bảo mật) |
| **BR-APP-02** | Khóa thẻ NFC từ xa tức thì | Khi người dùng báo mất thẻ trên app, chip NFC tương ứng phải bị vô hiệu hóa truy cập ngay lập tức trên toàn cầu trong vòng 1 giây. | Nghiêm trọng (Bảo mật) |
| **BR-APP-03** | Mã QR Code vé sự kiện động | Mã QR soát vé check-in trên ứng dụng phải là mã QR động thay đổi mã bảo mật sau mỗi 30 giây để chống hành vi chụp ảnh màn hình bán lại vé. | Chống gian lận |
| **BR-APP-04** | Tốc độ quét check-in cửa | Ứng dụng soát vé chuyên dụng của Ban tổ chức phải giải mã và xác thực thông tin đại biểu tại cổng an ninh dưới 0.2 giây/người. | Hiệu năng |
| **BR-APP-05** | Xác thực sinh trắc học bắt buộc | Mở ứng dụng hoặc thực hiện lệnh thanh toán trên di động bắt buộc phải xác thực qua FaceID, Vân tay hoặc mã PIN 6 số. | Bảo mật |
| **BR-APP-06** | Mã hóa trò chuyện đầu cuối | Nội dung tin nhắn trò chuyện 1-1 giữa các doanh nhân phải được mã hóa End-to-End Encryption; máy chủ trung gian không thể đọc được nội dung. | Bảo mật |
| **BR-APP-07** | Chế độ hoạt động ngoại tuyến Offline | Ứng dụng phải lưu trữ danh thiếp cá nhân, vé sự kiện và danh bạ gần nhất trong bộ nhớ cache để hoạt động bình thường khi mất sóng internet. | Khả dụng |
| **BR-APP-08** | Quyền riêng tư vị trí GPS | Tính năng tìm đối tác gần bạn (GPS Nearby) chỉ chia sẻ khoảng cách ước tính (Ví dụ: 500m) và cho phép người dùng bật chế độ ẩn danh bất kỳ lúc nào. | Quyền riêng tư |
| **BR-APP-09** | Kiểm soát số lượng vé sự kiện | Hệ thống tự động khóa cổng đăng ký khi số lượng vé phát hành đạt trần sức chứa khán phòng đã thiết lập; tự động chuyển sang hàng đợi chờ. | Kiểm soát |
| **BR-APP-10** | Bảo vệ thông tin cá nhân hội viên | Số điện thoại và email cá nhân của hội viên chỉ hiển thị cho người khác khi hội viên đó bật công tắc "Cho Phép Hiển Thị Công Khai". | Quyền riêng tư |
| **BR-APP-11** | Tự động đồng bộ khi có mạng | Mọi thao tác ghi chú, tạo việc ngoại tuyến phải được tự động đẩy lên máy chủ đám mây ngay khi điện thoại kết nối lại internet trong 3 giây. | Toàn vẹn dữ liệu |
| **BR-APP-12** | Xác thực tích xanh doanh nhân | Huy hiệu Tích Xanh Doanh Nhân chỉ được cấp khi doanh nghiệp đã xác thực giấy phép ĐKKD và CCCD người đại diện pháp luật hợp lệ. | Uy tín thương hiệu |
| **BR-APP-13** | Xóa tài khoản theo tiêu chuẩn Apple/Google | Ứng dụng phải có nút chức năng cho phép người dùng tự xóa hoàn toàn tài khoản và dữ liệu cá nhân theo quy định của App Store và Google Play. | Tuân thủ chợ ứng dụng |
| **BR-APP-14** | Giới hạn kích thước tệp gửi qua chat | Tệp tin tài liệu gửi trong tin nhắn chat bị giới hạn tối đa 50MB/tệp; hình ảnh tự động tối ưu hóa kích thước hiển thị mà vẫn sắc nét. | Hiệu năng |
| **BR-APP-15** | Tự hủy phiên đăng nhập lạ | Khi phát hiện tài khoản đăng nhập trên một thiết bị di động mới ở tọa độ địa lý bất thường, hệ thống tự động đăng xuất khỏi thiết bị cũ và gửi cảnh báo SMS. | An ninh mạng |

---

## 6. MA TRẬN PHÂN ĐỊNH TRÁCH NHIỆM RACI CHO 25 HOẠT ĐỘNG VẬN HÀNH

| Hoạt Động Nghiệp Vụ | CEO | CFO | Sales | HR | PM | Staff | IT/Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tiếp nhận & Thẩm định Lead mới từ Landing Web | R | A | C | I | I | I | I |
| Phê duyệt Báo giá bán hàng có chiết khấu cao | C | A | R | I | I | I | I |
| Ký kết Hợp đồng kinh tế thương mại B2B | A | R | C | C | I | I | I |
| Khởi tạo Dự án & Phân bổ cấu trúc WBS | A | C | I | I | R | I | I |
| Phê duyệt nghiệm thu kết quả công việc Task | I | I | I | I | A | R | I |
| Chấm công hàng ngày & Nộp đơn xin nghỉ phép | I | I | I | I | A | R | I |
| Tổng hợp bảng công & Tính lương tự động | A | I | I | R | I | I | C |
| Phê duyệt Bảng lương & Chi trả thu nhập | A | I | I | C | I | I | R |
| Lập Đề nghị thanh toán chi phí vận hành | I | I | I | I | R | I | I |
| Kiểm soát & Phê duyệt phiếu chi tiền 3 cấp | A | C | I | I | I | I | R |
| Đối soát dòng tiền ngân hàng & Gạch nợ VietQR | I | I | I | I | I | I | R |
| Kích hoạt & Cấp phát Thẻ Titanium NFC hội viên | I | A | I | C | I | I | R |
| Đăng tin nhu cầu mua bán trên Sàn B2B | I | C | R | I | I | I | I |
| Tổ chức sự kiện & Quét vé QR Check-in | A | C | I | R | I | I | I |
| Cấu hình Phân quyền RBAC & Quản trị Multi-Tenant | A | C | I | I | I | I | I |

---

## 7. YÊU CẦU PHI CHỨC NĂNG CẤP DOANH NGHIỆP (ENTERPRISE NFR)

* **Hiệu năng & Khả năng chịu tải:** Đáp ứng trên 10,000 người dùng đồng thời, thời gian phản hồi API trung bình dưới 150ms, SLA cam kết 99.98%.
* **Bảo mật & An toàn thông tin:** Mã hóa cơ sở dữ liệu AES-256, truyền tải TLS 1.3, xác thực 2FA/MFA bắt buộc, kiểm toán Audit Trail bất biến.
* **Sao lưu & Dự phòng thảm họa:** Sao lưu tự động toàn phần vào 03:00 AM hàng ngày và vi sai mỗi 2 giờ; cam kết RPO < 2 giờ, RTO < 30 phút.
* **Kiến trúc Multi-tenancy:** Dữ liệu từng doanh nghiệp được cô lập tuyệt đối ở tầng cơ sở dữ liệu với khóa bảo mật riêng biệt.

---

## 8. KẾ HOẠCH TRIỂN KHAI 8 TUẦN & TIÊU CHUẨN NGHIỆM THU

* **Giai đoạn 1 (Tuần 1-2):** Khảo sát hiện trạng, cấu hình hạ tầng đám mây cô lập và thiết lập tên miền riêng.
* **Giai đoạn 2 (Tuần 3-4):** Làm sạch và nhập khẩu dữ liệu khách hàng, nhân sự, sản phẩm từ Excel cũ; phân quyền RBAC.
* **Giai đoạn 3 (Tuần 5-6):** Đào tạo người dùng theo phân hệ, kích hoạt thẻ Titanium NFC và vận hành thử nghiệm song song.
* **Giai đoạn 4 (Tuần 7-8):** Go-Live chính thức 100%, kích hoạt Trí tuệ nhân tạo AI Copilot và ký biên bản nghiệm thu bàn giao.
