# HƯỚNG DẪN SỬ DỤNG HỢP NHẤT HỆ THỐNG CRM & APP MOBILE VIONE (37 CHUYÊN ĐỀ)

**Mã tài liệu:** HDSD-VIONE-MASTER-6.0 | **Ngày ban hành:** 05/10/2026 | **Phiên bản:** 6.0 Enterprise

---

### DANH MỤC 37 CHUYÊN ĐỀ NGHIỆP VỤ (100% TEXT & WORKFLOW - ZERO 404 IMAGES)

#### 01. [CRM · XÁC THỰC] Đăng Nhập Quản Trị Hệ Thống CRM ViOne Phong Cách Sáng Sang Trọng
- **Mục tiêu:** Đăng nhập an toàn vào bảng điều hành số CRM ViOne qua tài khoản doanh nghiệp hoặc quản trị viên.
- **Đường dẫn:** `Trình duyệt Web Desktop -> Truy cập: https://14.225.217.232:5445/auth`
- **Các bước:**
  * Bước 1: Mở trình duyệt web (Google Chrome, Microsoft Edge, Safari) và truy cập địa chỉ https://14.225.217.232:5445/auth.
  * Bước 2: Giao diện đăng nhập phong cách Light Mode sang trọng xuất hiện với ảnh nền kiến trúc đô thị ngọc trai và khung viền Champagne Gold.
  * Bước 3: Nhập địa chỉ Email doanh nghiệp (ví dụ: admin@vione.vn) hoặc Số điện thoại vào ô Identifier.
  * Bước 4: Nhập Mật khẩu bảo mật và bấm nút "Đăng Nhập Vào Hệ Thống".
  * Bước 5: Hệ thống xác thực token JWT, lưu phiên an toàn và tự động chuyển hướng vào Bảng Điều Hành C-Level (/dashboard).
- **Lưu ý:** LƯU Ý BẢO MẬT: Sau 5 lần nhập sai mật khẩu liên tiếp, tài khoản sẽ tạm thời bị khóa trong 15 phút để phòng chống tấn công dò quét brute-force.
- **Mẹo C-Level:** MẸO SỬ DỤNG: Quản trị viên có thể sử dụng tính năng "Ghi nhớ đăng nhập" để duy trì phiên làm việc trong 30 ngày an toàn.

#### 02. [CRM · ĐIỀU HÀNH] Bảng Điều Hành Số C-Level Toàn Diện (Executive Dashboard)
- **Mục tiêu:** Cung cấp cho Ban Lãnh Đạo góc nhìn toàn cảnh về sức khỏe tài chính và hoạt động kinh doanh theo thời gian thực.
- **Đường dẫn:** `Thanh điều hướng bên trái (Sidebar) -> Chọn: Bảng Điều Hành (/dashboard)`
- **Các bước:**
  * Bước 1: Quan sát 4 thẻ KPI Metric Cards ở hàng đầu tiên: Tổng Doanh Thu, Khách Hàng Mới, Số Deal Đang Mở, Tỷ Lệ Chốt Deal Thành Công.
  * Bước 2: Chọn bộ lọc thời gian (Hôm nay, Tuần này, Tháng này, Năm nay) ở góc phải trên để xem biến động số liệu tương ứng.
  * Bước 3: Theo dõi biểu đồ cột và biểu đồ đường thể hiện Dòng tiền thu - chi lũy kế và Doanh số bán hàng thực tế qua 12 tháng.
  * Bước 4: Kiểm tra khối Cảnh báo Vận hành: Danh sách nhiệm vụ quá hạn, hợp đồng sắp đến ngày gia hạn và đề xuất chi chờ duyệt.
- **Lưu ý:** QUY TẮC ĐIỀU HÀNH: Mọi chỉ số KPI trên Dashboard được cập nhật trực tiếp từ CSDL PostgreSQL theo thời gian thực, không có độ trễ.
- **Mẹo C-Level:** MẸO LÃNH ĐẠO: Nhấp đúp vào bất kỳ thẻ KPI nào để chuyển thẳng đến danh sách chi tiết của phân hệ tương ứng.

#### 03. [CRM · KHÁCH HÀNG] Trung Tâm Quản Trị Khách Hàng B2B & Hồ Sơ 360° (Smart CRM)
- **Mục tiêu:** Quản lý toàn bộ cơ sở dữ liệu khách hàng doanh nghiệp tập trung, ngăn ngừa thất thoát tệp khách hàng.
- **Đường dẫn:** `Sidebar -> Quản Trị Khách Hàng -> Danh Sách Khách Hàng (/members hoặc /customers)`
- **Các bước:**
  * Bước 1: Sử dụng thanh tìm kiếm để tra cứu nhanh khách hàng theo Tên công ty, Mã số thuế hoặc Người liên hệ.
  * Bước 2: Sử dụng các nút Filter Chips để lọc theo nguồn chuyển đổi: Chạm thẻ NFC, Quét danh thiếp OCR, Mạng lưới B2B, hoặc Website Lead.
  * Bước 3: Nhấp vào nút "+ Thêm Khách Hàng" để mở form nhập liệu: Nhập Mã số thuế (hệ thống tự động tra cứu tên doanh nghiệp), Họ tên người liên hệ, Số điện thoại và Email.
  * Bước 4: Nhấp vào thẻ khách hàng để xem Hồ sơ 360 độ: Lịch sử báo giá, hợp đồng đã ký, tiến độ chăm sóc và điểm số tiềm năng AI Lead Score.
  * Bước 5: Bấm nút "Xuất Excel" nếu cần tải toàn bộ danh sách khách hàng phục vụ báo cáo.
- **Lưu ý:** QUY TẮC BẢO MẬT DỮ LIỆU: Nhân viên kinh doanh chỉ nhìn thấy khách hàng do chính mình phụ trách. Chỉ cấp Quản lý và Giám đốc mới có quyền xem toàn bộ khách hàng của công ty.
- **Mẹo C-Level:** MẸO SALES: Sử dụng nút "Sao chép AI Pitch" để tạo nhanh kịch bản gọi điện tư vấn cá nhân hóa cho từng khách hàng.

#### 04. [CRM · BÁN HÀNG] Phễu Bán Hàng & Cơ Hội Kinh Doanh Kanban Deals
- **Mục tiêu:** Kiểm soát nhịp độ chốt đơn, dự báo doanh số chính xác và phát hiện các cơ hội bị bỏ quên.
- **Đường dẫn:** `Sidebar -> Quản Trị Bán Hàng -> Phễu Cơ Hội (/deals hoặc /opportunities)`
- **Các bước:**
  * Bước 1: Quan sát giao diện phễu Kanban gồm 5 cột giai đoạn: [1. Mới tiếp cận] -> [2. Khảo sát nhu cầu] -> [3. Báo giá giải pháp] -> [4. Đàm phán điều khoản] -> [5. Chốt hợp đồng].
  * Bước 2: Mỗi card cơ hội hiển thị: Tên thương vụ, Tên khách hàng doanh nghiệp, Giá trị ngân sách dự kiến và Nhân viên phụ trách.
  * Bước 3: Khi tiến trình đàm phán có bước phát triển, nhấp giữ chuột vào card và kéo thả sang cột giai đoạn tiếp theo.
  * Bước 4: Khi kéo vào cột [5. Chốt hợp đồng]: Hệ thống tự động kích hoạt tạo phiếu thu tiền và gửi thông báo cho Kế toán xuất hóa đơn.
- **Lưu ý:** CẢNH BÁO SLA: Bất kỳ cơ hội nào nằm ở một giai đoạn quá 7 ngày mà không có cập nhật mới sẽ hiển thị viền đỏ cảnh báo bỏ quên deal.
- **Mẹo C-Level:** MẸO CHỐT SALES: AI Copilot tự động gợi ý thời điểm vàng để gửi báo giá và tỷ lệ thành công dự kiến của từng deal.

#### 05. [CRM · DOANH NGHIỆP] Quản Lý Doanh Nghiệp Thành Viên & Mạng Lưới Chi Nhánh
- **Mục tiêu:** Thiết lập cấu trúc tổ chức doanh nghiệp đa chi nhánh phục vụ quản trị phân tán.
- **Đường dẫn:** `Sidebar -> Thiết Lập Tổ Chức -> Doanh Nghiệp & Chi Nhánh (/companies)`
- **Các bước:**
  * Bước 1: Xem danh sách các pháp nhân công ty thành viên trong hệ thống.
  * Bước 2: Bấm vào chi nhánh để cấu hình thông tin: Địa chỉ thực tế, Số điện thoại văn phòng, Trưởng chi nhánh phụ trách.
  * Bước 3: Nhập Tọa độ định vị GPS (Latitude, Longitude) và Bán kính chấm công (50 mét) cho văn phòng chi nhánh.
  * Bước 4: Bấm "Lưu Cấu Hình" để kích hoạt địa điểm chấm công cho nhân sự tại chi nhánh đó.
- **Lưu ý:** LƯU Ý GPS: Tọa độ GPS của chi nhánh phải được lấy chính xác từ Google Maps để nhân viên chấm công không bị báo lỗi ngoài phạm vi.
- **Mẹo C-Level:** MẸO VẬN HÀNH: Có thể tạo không giới hạn chi nhánh cho một doanh nghiệp trong cùng một tài khoản quản trị.

#### 06. [CRM · THẺ THÔNG MINH] Quản Trị Thẻ Thông Minh NFC & Danh Thiếp Số 3D
- **Mục tiêu:** Số hóa hoàn toàn danh thiếp giấy truyền thống, trang bị thẻ thông minh NFC cho toàn bộ lãnh đạo và nhân sự.
- **Đường dẫn:** `Sidebar -> Công Nghệ Số -> Quản Lý Thẻ NFC (/cards)`
- **Các bước:**
  * Bước 1: Quét mã chip NFC vật lý qua đầu đọc thẻ hoặc nhập dãy mã Card UID vào hệ thống.
  * Bước 2: Gán mã thẻ cho nhân sự hoặc lãnh đạo tương ứng trong danh sách nhân viên.
  * Bước 3: Chọn gói mẫu thiết kế thẻ số (Executive Titanium, Champagne Gold hoặc Classic Black).
  * Bước 4: Nhấp "Kích Hoạt Thẻ": Hệ thống tự động liên kết chip NFC với đường dẫn danh thiếp điện tử công khai và sinh mã QR cá nhân.
- **Lưu ý:** QUY ĐỊNH BẢO MẬT: Khi nhân sự nghỉ việc, Quản trị viên chỉ cần bấm nút "Khóa Thẻ" để thu hồi quyền truy cập danh thiếp của nhân sự đó tức thì.
- **Mẹo C-Level:** MẸO QUẢNG BÁ: Thẻ NFC chạm được trên mọi dòng điện thoại iPhone và Android đời mới mà không cần cài đặt bất kỳ ứng dụng nào.

#### 07. [CRM · VẬN HÀNH] Quản Trị Quy Trình Công Việc & Giao Việc Tự Động (Workflows)
- **Mục tiêu:** Số hóa 100% các luồng giao việc nội bộ, triệt tiêu tình trạng trễ hạn và đùn đẩy trách nhiệm.
- **Đường dẫn:** `Sidebar -> Vận Hành & Quy Trình -> Quy Trình Công Việc (/workflow)`
- **Các bước:**
  * Bước 1: Bấm nút "+ Giao Nhiệm Vụ Mới" ở góc phải trên.
  * Bước 2: Điền thông tin công việc: Tiêu đề nhiệm vụ, Nội dung chi tiết, Phòng ban thực hiện, Người nhận việc chính, Người phối hợp.
  * Bước 3: Thiết lập Thời hạn hoàn thành (Deadline) và Mức độ ưu tiên (Khẩn cấp, Cao, Trung bình).
  * Bước 4: Bấm "Giao Việc": Hệ thống tự động gửi thông báo qua chuông web, email và mobile push notification đến nhân sự nhận việc.
  * Bước 5: Theo dõi tiến độ công việc trên bảng Kanban quy trình từ [Chờ làm] -> [Đang làm] -> [Chờ duyệt] -> [Hoàn thành].
- **Lưu ý:** LƯU Ý TIẾN ĐỘ: Nhiệm vụ sau khi được nhân viên báo hoàn thành phải được Trưởng bộ phận bấm "Nghiệm Thu" thì mới được tính vào KPI tháng.
- **Mẹo C-Level:** MẸO QUẢN TRỊ: Đính kèm tài liệu mẫu hoặc quy trình chuẩn vào mô tả nhiệm vụ để nhân viên mới dễ dàng thực hiện đúng chuẩn.

#### 08. [CRM · NHÂN SỰ] Giám Sát Tải Trọng & Khối Lượng Nhân Sự (Workload Heatmap)
- **Mục tiêu:** Cân bằng tải công việc giữa các phòng ban, ngăn ngừa tình trạng quá tải hoặc nhàn rỗi trong bộ máy.
- **Đường dẫn:** `Sidebar -> Vận Hành & Quy Trình -> Tải Trọng Nhân Sự (/workload)`
- **Các bước:**
  * Bước 1: Chọn phòng ban cần giám sát từ danh mục bộ lọc.
  * Bước 2: Quan sát Biểu đồ nhiệt (Workload Heatmap) hiển thị danh sách nhân sự cùng số lượng việc đang mở đồng thời (WIP).
  * Bước 3: Màu xanh lục biểu thị tải trọng tối ưu (1-3 việc); Màu vàng biểu thị tải trọng cao (4 việc); Màu đỏ biểu thị quá tải nguy hiểm (≥ 5 việc).
  * Bước 4: Nhấp vào nhân sự đang bị tô đỏ để xem danh sách các đầu việc đang xử lý và thực hiện điều chuyển bớt việc cho nhân sự khác.
- **Lưu ý:** QUY TẮC HIỆU SUẤT: Giữ số lượng việc đồng thời (WIP) của mỗi nhân sự ≤ 5 việc giúp tăng tốc độ hoàn thành công việc lên 40%.
- **Mẹo C-Level:** MẸO VẬN HÀNH: Giám đốc COO nên kiểm tra bản đồ nhiệt vào đầu mỗi tuần để phân bổ nguồn lực hợp lý.

#### 09. [CRM · CHẤM CÔNG] Chấm Công Định Vị GPS & Nhận Diện Khuôn Mặt AI (Attendance)
- **Mục tiêu:** Tự động hóa hoàn toàn quy trình điểm danh nhân sự, chống gian lận chấm công hộ.
- **Đường dẫn:** `Sidebar -> Nhân Sự & Tiền Lương -> Quản Lý Chấm Công (/attendance)`
- **Các bước:**
  * Bước 1: Xem bảng điểm danh hôm nay với các trạng thái: Đã Check-in, Đi Đúng Giờ, Đi Muộn, Nghỉ Phép, Chưa Có Mặt.
  * Bước 2: Nhấp vào từng bản ghi chấm công để xem chi tiết: Giờ Check-in chính xác đến từng giây, Tọa độ GPS và Ảnh chụp khuôn mặt selfie.
  * Bước 3: Xử lý các đơn xin nghỉ phép, xin đi muộn/về sớm của nhân viên trực tiếp trên giao diện duyệt đơn.
  * Bước 4: Vào cuối tháng, bấm nút "Tổng Hợp Bảng Công" để hệ thống tự động tính tổng ngày công, số lần đi muộn và trừ phép.
- **Lưu ý:** CẢNH BÁO GIAN LẬN: Hệ thống tự động gắn cờ cảnh báo nếu phát hiện thiết bị di động sử dụng phần mềm giả lập vị trí GPS (Fake GPS).
- **Mẹo C-Level:** MẸO TIẾT KIỆM: Bảng công tự động đồng bộ sang bảng lương giúp phòng kế toán tiết kiệm 80% thời gian tổng hợp mỗi kỳ.

#### 10. [CRM · TÀI CHÍNH] Phê Duyệt Tài Chính Thu Chi 3 Cấp & VietQR Napas (Approvals)
- **Mục tiêu:** Kiểm soát từng đồng chi phí doanh nghiệp, đảm bảo mọi khoản chi đều có đầy đủ chứng từ và chữ ký số phê duyệt.
- **Đường dẫn:** `Sidebar -> Tài Chính & Dòng Tiền -> Phê Duyệt Chi Tiền (/payment-approvals)`
- **Các bước:**
  * Bước 1: Nhân viên tạo đề xuất chi tiền (Cấp 1), đính kèm hóa đơn GTGT hoặc chứng từ thanh toán dạng ảnh/PDF.
  * Bước 2: Trưởng phòng kiểm tra tính hợp lý của khoản chi và bấm "Duyệt Cấp 2" (hoặc Từ chối kèm lý do).
  * Bước 3: Phiếu chi chuyển lên Giám đốc hoặc Kế toán trưởng xem xét hạn mức ngân sách và bấm "Phê Duyệt Cấp 3".
  * Bước 4: Sau khi Giám đốc duyệt, hệ thống tự động sinh Mã QR thanh toán VietQR Napas 24/7 chứa sẵn số tài khoản và nội dung chi.
  * Bước 5: Kế toán quét mã QR trên ứng dụng ngân hàng để chuyển tiền ngay lập tức, hệ thống tự động cập nhật phiếu chi sang "Đã Thanh Toán".
- **Lưu ý:** QUY TẮC BẤT DI BẤT DỊCH: Bất kỳ phiếu chi nào không có đính kèm chứng từ hợp lệ sẽ không thể chuyển sang bước duyệt của Giám đốc.
- **Mẹo C-Level:** MẸO KẾ TOÁN: Sử dụng mã VietQR Napas tự sinh giúp triệt tiêu 100% lỗi gõ nhầm số tài khoản hoặc sai lệch nội dung chuyển khoản.

#### 11. [CRM · SỔ QUỸ] Sổ Quỹ Thu Chi & Báo Cáo Dòng Tiền Thời Gian Thực (Cash Flow)
- **Mục tiêu:** Cung cấp bức tranh tài chính trung thực, minh bạch về dòng tiền ròng của doanh nghiệp.
- **Đường dẫn:** `Sidebar -> Tài Chính & Dòng Tiền -> Sổ Quỹ Thu Chi (/income hoặc /finance)`
- **Các bước:**
  * Bước 1: Xem số dư tồn quỹ hiện tại chia theo Quỹ Tiền Mặt và Quỹ Ngân Hàng.
  * Bước 2: Lọc danh sách giao dịch theo Loại (Phiếu Thu, Phiếu Chi), Danh mục (Bán hàng, Tiếp khách, Lương, Mặt bằng) và Thời gian.
  * Bước 3: Nhấp vào từng giao dịch để xem phiếu thu/chi điện tử có chữ ký số của người lập, kế toán và thủ quỹ.
  * Bước 4: Xuất sổ cái thu chi ra tệp Excel (.xlsx) theo mẫu chuẩn kế toán doanh nghiệp Việt Nam.
- **Lưu ý:** LƯU Ý ĐỐI SOÁT: Thủ quỹ bắt buộc phải đối chiếu số dư sổ sách trên hệ thống với số dư sao kê ngân hàng điện tử vào cuối mỗi ngày.
- **Mẹo C-Level:** MẸO QUẢN TRỊ: Biểu đồ dòng tiền dự báo tự động cảnh báo trước 15 ngày nếu doanh nghiệp có nguy cơ bị âm dòng tiền hoạt động.

#### 12. [CRM · GIAO THƯƠNG] Sàn Giao Thương B2B & Gian Hàng Sản Phẩm Doanh Nghiệp
- **Mục tiêu:** Mở rộng kênh phân phối, tăng doanh thu bán hàng thông qua mạng lưới đối tác trong hệ sinh thái.
- **Đường dẫn:** `Sidebar -> Mạng Lưới B2B -> Sàn Sản Phẩm (/marketplace)`
- **Các bước:**
  * Bước 1: Bấm nút "+ Đăng Sản Phẩm Mới" ở góc màn hình.
  * Bước 2: Điền thông tin: Tên sản phẩm, Ngành hàng chủ lực, Đơn vị tính, Mô tả quy cách kỹ thuật.
  * Bước 3: Nhập 2 mức giá: Giá Niêm Yết Công Khai và Giá Ưu Đãi VIP Dành Riêng Cho Đối Tác B2B.
  * Bước 4: Tải lên hình ảnh sản phẩm chất lượng cao (hệ thống tự động nén tối ưu dung lượng).
  * Bước 5: Bấm "Xuất Bản Sản Phẩm": Sản phẩm sẽ xuất hiện ngay trên gian hàng chung của cộng đồng doanh nhân.
- **Lưu ý:** CHÍNH SÁCH GIÁ B2B: Mức giá ưu đãi B2B chỉ hiển thị với các đối tác đã xác thực doanh nghiệp thành công.
- **Mẹo C-Level:** MẸO BÁN HÀNG: Cập nhật chính sách chiết khấu số lượng lớn để kích thích các doanh nghiệp khác đặt hàng làm quà tặng hoặc cung ứng định kỳ.

#### 13. [CRM · SỰ KIỆN] Quản Trị Sự Kiện Doanh Nghiệp & Soát Vé QR Tự Động
- **Mục tiêu:** Chuyên nghiệp hóa công tác tổ chức sự kiện, kiểm soát an ninh cửa ra vào chính xác.
- **Đường dẫn:** `Sidebar -> Mạng Lưới B2B -> Sự Kiện Doanh Nghiệp (/events)`
- **Các bước:**
  * Bước 1: Bấm "+ Tạo Sự Kiện Mới" và nhập: Tên sự kiện, Thời gian diễn ra, Địa điểm tổ chức, Quy mô khách mời.
  * Bước 2: Thiết lập các hạng vé: Vé Thường (Miễn phí) hoặc Vé VIP B2B (Có thu phí).
  * Bước 3: Bấm "Xuất Bản": Hệ thống tự động gửi thư mời kèm mã QR cá nhân hóa đến danh bạ đối tác.
  * Bước 4: Tại cửa đón tiếp: Lễ tân dùng camera điện thoại quét mã QR của khách, màn hình báo "Check-in Thành Công" trong 0.2 giây.
- **Lưu ý:** QUY TRÌNH CHECK-IN: Mỗi mã QR chỉ có giá trị check-in một lần duy nhất để chống việc quay vòng vé lậu.
- **Mẹo C-Level:** MẸO TỔ CHỨC: Tích hợp vòng quay may mắn (Lucky Draw) tự động quay số theo mã vé của các khách đã check-in thực tế.

#### 14. [CRM · BIỂU QUYẾT] Quản Lý Biểu Quyết Số & Đại Hội Cổ Đông Trực Tuyến
- **Mục tiêu:** Tổ chức các cuộc họp biểu quyết trực tuyến minh bạch, loại bỏ hoàn toàn việc kiểm phiếu thủ công.
- **Đường dẫn:** `Sidebar -> Quản Trị C-Level -> Biểu Quyết & Bầu Cử (/voting)`
- **Các bước:**
  * Bước 1: Bấm "+ Tạo Phiên Biểu Quyết Mới" và nhập tiêu đề phiên họp (ví dụ: Thông qua kế hoạch kinh doanh năm 2027).
  * Bước 2: Thiết lập danh sách các phương án lựa chọn: [Đồng ý], [Không đồng ý], [Ý kiến khác].
  * Bước 3: Gán trọng số biểu quyết: Biểu quyết theo số cổ phần sở hữu hoặc theo nguyên tắc 1 người 1 phiếu.
  * Bước 4: Mở cổng biểu quyết: Cổ đông hoặc thành viên HĐQT đăng nhập và bấm chọn phương án trực tiếp trên app.
  * Bước 5: Đóng cổng và công bố kết quả: Hệ thống tự động vẽ biểu đồ tỷ lệ % biểu quyết tức thì.
- **Lưu ý:** TÍNH BẤT BIẾN: Kết quả phiếu bầu sau khi gửi sẽ được mã hóa bằng chữ ký số bảo mật, không ai có thể can thiệp hay sửa đổi kết quả.
- **Mẹo C-Level:** MẸO PHÁP LÝ: Xuất biên bản kiểm phiếu có đóng dấu mộc điện tử để lưu vào hồ sơ pháp lý công ty hợp lệ.

#### 15. [CRM · HOA HỒNG] Quản Lý Chiết Khấu, Chính Sách Hoa Hồng & Điểm Thưởng B2B
- **Mục tiêu:** Kích thích mạng lưới đối tác giới thiệu khách hàng mới thông qua chính sách trả thưởng minh bạch.
- **Đường dẫn:** `Sidebar -> Quản Trị Bán Hàng -> Hoa Hồng & Điểm Thưởng (/perks hoặc /commissions)`
- **Các bước:**
  * Bước 1: Cấu hình tỷ lệ hoa hồng cho từng nhóm sản phẩm: Hoa hồng bán hàng trực tiếp (10%) và Hoa hồng giới thiệu đối tác B2B (5%).
  * Bước 2: Khi hợp đồng được chuyển sang trạng thái "Đã Thanh Toán", hệ thống tự động tính số tiền hoa hồng cho người giới thiệu.
  * Bước 3: Xem bảng tổng hợp công nợ hoa hồng phải trả cho các đối tác môi giới theo tháng.
  * Bước 4: Bấm "Phê Duyệt Trả Thưởng": Hệ thống sinh lệnh chuyển tiền tự động qua VietQR đến tài khoản của đối tác.
- **Lưu ý:** QUY ĐỊNH CHI TRẢ: Hoa hồng chỉ được tất toán khi hợp đồng gốc đã thu đủ 100% tiền từ khách hàng.
- **Mẹo C-Level:** MẸO ĐỐI TÁC: Quy đổi hoa hồng thành Điểm thưởng B2B (V-Points) để thanh toán các dịch vụ khác trong hệ sinh thái với mức ưu đãi 10%.

#### 16. [CRM · QUYỀN LỢI] Quản Trị Quyền Lợi Thành Viên & Hạng Đối Tác Chiến Lược
- **Mục tiêu:** Chăm sóc và giữ chân các khách hàng VIP và đối tác chiến lược quan trọng nhất của doanh nghiệp.
- **Đường dẫn:** `Sidebar -> Quản Trị Khách Hàng -> Hạng Đối Tác & Quyền Lợi (/benefits hoặc /tiers)`
- **Các bước:**
  * Bước 1: Thiết lập 4 Hạng Đối Tác: Bạc (Silver), Vàng (Gold), Bạch Kim (Platinum), Kim Cương (Diamond).
  * Bước 2: Cài đặt hạn mức doanh số tích lũy để thăng hạng (ví dụ: Đạt 500 triệu/năm tự động lên hạng Gold).
  * Bước 3: Gán các đặc quyền cho từng hạng: Mức chiết khấu mua hàng, Vé mời sự kiện VIP thường niên, Ưu tiên hỗ trợ kỹ thuật 24/7.
  * Bước 4: Theo dõi bảng xếp hạng thăng/hạ hạng của các đối tác theo chu kỳ đánh giá năm.
- **Lưu ý:** THÔNG BÁO THĂNG HẠNG: Hệ thống tự động gửi thư chúc mừng và trao chứng nhận điện tử đến tài khoản đối tác ngay khi được nâng hạng.
- **Mẹo C-Level:** MẸO CSKH: Tặng quà sinh nhật doanh nghiệp tự động cho các đối tác từ hạng Platinum trở lên để gia tăng sự gắn kết.

#### 17. [CRM · HỢP ĐỒNG] Quản Trị Hợp Đồng Kinh Tế Điện Tử & Chữ Ký Số
- **Mục tiêu:** Quản lý toàn bộ vòng đời hợp đồng kinh tế an toàn, không lo thất lạc hoặc quên gia hạn.
- **Đường dẫn:** `Sidebar -> Quản Trị Bán Hàng -> Hợp Đồng Kinh Tế (/contracts)`
- **Các bước:**
  * Bước 1: Bấm "+ Tạo Hợp Đồng Mới" và chọn Mẫu hợp đồng chuẩn (Hợp đồng mua bán, Cung cấp dịch vụ, Đại lý phân phối).
  * Bước 2: Điền thông tin pháp nhân khách hàng: Tên công ty, Đại diện ký, Giá trị hợp đồng, Thời hạn hiệu lực.
  * Bước 3: Tải lên bản thảo hợp đồng dạng PDF hoặc sử dụng mẫu soạn thảo trực tiếp trên hệ thống.
  * Bước 4: Gửi yêu cầu ký số: Hai bên đại diện pháp luật sử dụng chứng thư số USB Token hoặc Chữ ký số SmartCA để ký trực tiếp.
  * Bước 5: Hợp đồng đã ký được lưu trữ trên hạ tầng phân tán MinIO có mã băm toàn vẹn (SHA-256).
- **Lưu ý:** CẢNH BÁO HẾT HẠN: Hệ thống tự động gửi email và thông báo cho Trưởng phòng kinh doanh trước 30 ngày đối với các hợp đồng sắp hết hiệu lực.
- **Mẹo C-Level:** MẸO PHÁP CHẾ: Mọi lịch sử xem, tải xuống và chỉnh sửa hợp đồng đều được lưu vết kiểm toán bất biến.

#### 18. [CRM · PHÂN QUYỀN] Ma Trận Phân Quyền 7 Nhóm Quyền x 6 Thao Tác (RBAC Matrix)
- **Mục tiêu:** Bảo vệ dữ liệu bí mật kinh doanh, phân định quyền hạn minh bạch và chặt chẽ.
- **Đường dẫn:** `Sidebar -> Quản Trị Nền Tảng -> Ma Trận Phân Quyền (/platform/permissions)`
- **Các bước:**
  * Bước 1: Quan sát bảng ma trận phân quyền lưới trực quan gồm 9 Module nghiệp vụ theo hàng dọc và 7 Nhóm vai trò theo hàng ngang (CEO, COO, CFO, Sales Manager, Admin, Staff, Partner).
  * Bước 2: Trong mỗi ô giao nhau, có 6 thao tác cụ thể: [Xem] [Tạo] [Sửa] [Xóa] [Duyệt] [Xuất].
  * Bước 3: Nhấp chuột vào các ô checkbox để bật hoặc tắt từng quyền hạn cụ thể cho từng vai trò.
  * Bước 4: Bấm nút "Lưu Ma Trận Quyền": Cấu hình mới sẽ có hiệu lực ngay lập tức trên toàn hệ thống mà không cần người dùng đăng xuất.
- **Lưu ý:** NGUYÊN TẮC AN TOÀN: Tuyệt đối không cấp quyền [Xóa] và [Duyệt] cho nhóm vai trò Nhân viên chuyên môn (Staff).
- **Mẹo C-Level:** MẸO PHÂN QUYỀN: Có thể gán nhiều vai trò khác nhau cho cùng một người dùng nếu nhân sự đó kiêm nhiệm nhiều vị trí.

#### 19. [CRM · TRÍ TUỆ NHÂN TẠO] Nhật Ký Kiểm Toán & 6 Năng Lực AI Copilot 5.0 (AI Audit)
- **Mục tiêu:** Minh bạch hóa các hoạt động của trí tuệ nhân tạo, tối ưu hóa chi phí vận hành AI.
- **Đường dẫn:** `Sidebar -> Quản Trị Nền Tảng -> Nhật Ký AI Audit (/platform/ai-audit)`
- **Các bước:**
  * Bước 1: Xem bảng nhật ký chi tiết các lần gọi AI của toàn bộ người dùng trong công ty.
  * Bước 2: Lọc theo 6 Năng lực AI chuyên biệt: [1. Copilot Đàm Thoại] [2. Quét Danh Thiếp OCR] [3. Đối Soát Excel] [4. Soạn Thảo Hợp Đồng] [5. Ghép Nối Đối Tác B2B] [6. Giám Sát Tải Vận Hành].
  * Bước 3: Nhấp vào từng dòng để xem: Thời gian gọi, Người gọi, Câu lệnh đầu vào (Prompt), Phản hồi của AI và Số lượng Token tiêu thụ.
  * Bước 4: Xem biểu đồ tổng hợp mức độ sử dụng AI và đánh giá mức độ tiết kiệm thời gian cho doanh nghiệp.
- **Lưu ý:** BẢO MẬT DỮ LIỆU AI: Trợ lý AI ViOne được huấn luyện trong môi trường đóng riêng tư của doanh nghiệp, cam kết không sử dụng dữ liệu kinh doanh của khách hàng để huấn luyện mô hình công cộng.
- **Mẹo C-Level:** MẸO HIỆU QUẢ: Xem lại các câu lệnh (prompts) hiệu quả của đồng nghiệp trong nhật ký để học hỏi cách ra lệnh cho AI tối ưu nhất.

#### 20. [CRM · KẾT NỐI VẬN HÀNH] Vận Hành Kết Nối & Giới Thiệu Doanh Nghiệp (C-Level Operations)
- **Mục tiêu:** Ghi nhận và vinh danh các cơ hội kinh doanh được trao đi trong cộng đồng doanh nghiệp.
- **Đường dẫn:** `Sidebar -> Quản Trị Nền Tảng -> Vận Hành Kết Nối (/platform/introduction-operations)`
- **Các bước:**
  * Bước 1: Xem danh sách các cơ hội kết nối đối tác được trao đổi giữa các doanh nghiệp thành viên.
  * Bước 2: Theo dõi trạng thái kết nối: Mới giới thiệu, Đã liên hệ, Đang đàm phán, Đã ký hợp đồng thành công.
  * Bước 3: Ghi nhận Tổng giá trị giao dịch thành công (Thank You Note) mang lại doanh thu thực tế.
  * Bước 4: Bảng xếp hạng Top Doanh nhân tích cực trao cơ hội kết nối kinh doanh nhất trong tháng.
- **Lưu ý:** TÍNH XÁC THỰC: Giá trị hợp đồng thành công chỉ được ghi nhận khi cả bên giới thiệu và bên nhận cơ hội cùng bấm xác nhận.
- **Mẹo C-Level:** MẸO GIAO THƯƠNG: Doanh nghiệp trao đi nhiều cơ hội kết nối sẽ được hệ thống AI ưu tiên hiển thị ở vị trí nổi bật trên Sàn B2B.

#### 21. [CRM · KIỂM TOÁN GIA HẠN] Lịch Sử Gia Hạn & Kiểm Toán Thu Phí Nền Tảng (Renewal Audit)
- **Mục tiêu:** Đảm bảo hệ thống vận hành liên tục không bị gián đoạn do hết hạn dịch vụ.
- **Đường dẫn:** `Sidebar -> Quản Trị Nền Tảng -> Lịch Sử Gia Hạn (/platform/renewal-audit)`
- **Các bước:**
  * Bước 1: Xem thời hạn sử dụng bản quyền gói dịch vụ ViOne của doanh nghiệp và các chi nhánh.
  * Bước 2: Hệ thống tự động gửi thông báo nhắc gia hạn trước 30 ngày, 15 ngày và 7 ngày trước khi hết hạn.
  * Bước 3: Bấm nút "Gia Hạn Dịch Vụ": Chọn gói thời gian (1 năm, 2 năm, 5 năm) và sinh mã VietQR thanh toán tự động.
  * Bước 4: Sau khi chuyển khoản thành công, hệ thống tự động cộng thêm thời gian bản quyền và xuất hóa đơn điện tử gửi về email.
- **Lưu ý:** LƯU Ý THỜI HẠN: Sau ngày hết hạn 15 ngày mà chưa gia hạn, hệ thống sẽ chuyển sang chế độ chỉ đọc (Read-only) để bảo vệ an toàn dữ liệu.
- **Mẹo C-Level:** MẸO TIẾT KIỆM: Gia hạn gói dịch vụ từ 2 năm trở lên được giảm giá 20% và tặng kèm thẻ thông minh NFC cao cấp.

#### 22. [CRM · CÀI ĐẶT] Cài Đặt Hệ Thống, Nhận Diện Thương Hiệu & Logo Tùy Biến
- **Mục tiêu:** Cá nhân hóa giao diện phần mềm hoàn toàn theo bản sắc thương hiệu riêng của doanh nghiệp.
- **Đường dẫn:** `Sidebar -> Cài Đặt Hệ Thống (/settings)`
- **Các bước:**
  * Bước 1: Nhập Tên doanh nghiệp chính thức và Tên viết tắt hiển thị.
  * Bước 2: Nhập Website chính hệ thống (websiteUrl) có gắn liên kết kiểm tra xem trước bên ngoài.
  * Bước 3: Nhập Hotline chăm sóc khách hàng và Slogan thương hiệu.
  * Bước 4: Tải lên Logo chính thức của công ty dạng tệp PNG hoặc SVG trong suốt.
  * Bước 5: Bấm "Lưu Cài Đặt": Hệ thống tự động cập nhật logo lên thanh Sidebar và trang đăng nhập toàn diện trong thời gian thực.
- **Lưu ý:** QUY CHUẨN LOGO: Logo tải lên nên có tỷ lệ ngang hoặc vuông, kích thước tối thiểu 500x500px trên nền trong suốt để hiển thị sắc nét nhất.
- **Mẹo C-Level:** MẸO THƯƠNG HIỆU: Cài đặt đầy đủ hotline và website giúp nâng cao uy tín thương hiệu trong mắt đối tác khi chia sẻ danh thiếp điện tử.

#### 23. [APP · ĐĂNG NHẬP] Đăng Nhập Ứng Dụng Di Động ViOne Connect (Mobile Login)
- **Mục tiêu:** Đăng nhập vào ứng dụng ViOne Connect trên điện thoại di động mọi lúc mọi nơi.
- **Đường dẫn:** `Mở App ViOne Connect trên điện thoại -> Màn hình Đăng nhập (/vione/login hoặc /connect-app/sign-in)`
- **Các bước:**
  * Bước 1: Mở ứng dụng ViOne Connect hoặc truy cập đường dẫn PWA https://14.225.217.232:5445/vione/login.
  * Bước 2: Giao diện nền đen Obsidian thượng lưu xuất hiện với logo ViOne Business Connect mạ vàng sang trọng.
  * Bước 3: Nhập Email hoặc Số điện thoại di động đã đăng ký (9-12 chữ số).
  * Bước 4: Nhập Mật khẩu (có nút ẩn/hiện) hoặc chọn nhận mã OTP qua tin nhắn SMS.
  * Bước 5: Bấm nút gradient mạ vàng "Đăng Nhập Ngay" để vào thẳng Trang chủ ứng dụng.
- **Lưu ý:** HỖ TRỢ ĐĂNG NHẬP: Người dùng có thể đăng nhập bằng cả Email hoặc Số điện thoại mà không cần nhớ chính xác tên đăng nhập.
- **Mẹo C-Level:** MẸO TIỆN LỢI: Bật tính năng đăng nhập bằng FaceID hoặc Vân tay để mở app chỉ trong 0.5 giây trong các lần sau.

#### 24. [APP · ĐĂNG KÝ] Đăng Ký Tài Khoản Mới Trực Tiếp In-App (Mobile Register)
- **Mục tiêu:** Cho phép doanh nhân mới tạo tài khoản và tham gia mạng lưới giao thương tức thì.
- **Đường dẫn:** `Màn hình Đăng nhập -> Bấm nút: "Tạo tài khoản mới"`
- **Các bước:**
  * Bước 1: Tại màn hình đăng nhập, nhấp vào liên kết "Tạo tài khoản mới" ở phía dưới.
  * Bước 2: Giao diện đăng ký in-app mở ra mượt mà: Nhập Họ và tên đầy đủ của doanh nhân.
  * Bước 3: Nhập Địa chỉ Email hoặc Số điện thoại chính chủ.
  * Bước 4: Nhập Tên doanh nghiệp / Công ty đang điều hành.
  * Bước 5: Thiết lập Mật khẩu và Xác nhận mật khẩu (tối thiểu 8 ký tự).
  * Bước 6: Bấm "Đăng Ký & Đăng Nhập Ngay": Hệ thống tự động tạo tài khoản, lưu phiên và đưa người dùng vào Trang chủ.
- **Lưu ý:** QUY TRÌNH LIỀN MẠCH: Toàn bộ quá trình tạo tài khoản nằm trọn vẹn trong trải nghiệm in-app, tuyệt đối không mở các trang web tiếp thị bên ngoài.
- **Mẹo C-Level:** MẸO HỒ SƠ: Sau khi đăng ký, hãy vào mục Hồ sơ cá nhân để cập nhật ảnh đại diện và chức danh giúp đối tác dễ nhận diện.

#### 25. [APP · TRANG CHỦ] Trang Chủ Doanh Nhân ViOne Connect & Lịch Trình Điều Hành Đa Nguồn Hôm Nay
- **Mục tiêu:** Cung cấp cho doanh nhân bảng tin điều hành toàn diện, tích hợp Lịch gặp 1-1, Cơ hội kinh doanh mới từ cộng đồng và Sự kiện hội thảo trong ngày.
- **Đường dẫn:** `Thanh điều hướng đáy -> Chạm vào Tab: Trang Chủ (Home) -> Chọn Tab [Hôm nay]`
- **Các bước:**
  * Bước 1: Header trên cùng hiển thị Lời chào cá nhân hóa theo thời gian thực và Avatar mạ vàng bấm mở Profile Drawer.
  * Bước 2: Quan sát Thẻ Hội Viên Doanh Nhân mạ vàng nổi bật ở vị trí trung tâm hiển thị: Họ tên, Chức vụ, Tên công ty và Mã số thẻ.
  * Bước 3: Sử dụng 4 Tab lịch trình điều hành: [Hôm nay ({tổng số})], [Sắp tới], [Lời nhắc] và [🎙️ Ghi âm].
  * Bước 4: Tại Tab [Hôm nay], hệ thống tự động phân loại và hiển thị 3 khối nội dung trọng tâm:
    - **1. LỊCH GẶP HÔM NAY:** Toàn bộ cuộc gặp 1-1 và họp đối tác đã chốt lịch, kèm thông tin đối tác, thời gian, phím gọi trực tiếp Google Meet (online) hoặc Gọi điện thoại (offline), và nút Đổi lịch hẹn.
    - **2. CƠ HỘI MỚI TỪ CỘNG ĐỒNG:** Hiển thị thẻ cơ hội kinh doanh mới nhất trong ngày kèm tag cộng đồng, huy hiệu "CƠ HỘI MỚI", tổ chức, giá trị deal ước tính, nút [Xem chi tiết cơ hội] và nút [Vào Cộng đồng] để kết nối nhanh chóng.
    - **3. SỰ KIỆN HÔM NAY:** Danh sách hội thảo, diễn đàn doanh nhân trong ngày kèm đếm ngược giờ và thông tin phòng họp.
  * Bước 5: Xem khối Giám sát Vận hành C-Level: Điểm danh nhân sự, phê duyệt tài chính và tiến độ công việc Kanban.
  * Bước 6: Thanh định vị AI: Tích hợp nút [📍 Bật vị trí] màu vàng Champagne Gold để quét người dùng ViOne quanh đây.
- **Lưu ý:** ĐỒNG BỘ THỜI GIAN THỰC & ĐIỀU HƯỚNG LIỀN MẠCH: Bấm "Xem chi tiết" cơ hội sẽ mở bảng chi tiết kèm nút chuyển thẳng vào trang Cộng đồng. Tab bình luận khoảnh khắc (Moments) hỗ trợ nhập thông minh chuẩn Facebook (Avatar thật, khay icon emoji, đính kèm ảnh, trả lời đa tầng).
- **Mẹo C-Level:** MẸO LÃNH ĐẠO: Chạm vào tab [🎙️ Ghi âm] để nghe lại các đoạn ghi âm khoảnh khắc với sóng âm và trình phát inline tiện lợi.

#### 26. [APP · THẺ DOANH NHÂN] Bottom Sheet Thẻ Doanh Nhân Bo Tròn 36px Tích Hợp Vuốt Tay Xuống
- **Mục tiêu:** Mở nhanh mã QR định danh và các công cụ chia sẻ danh thiếp chỉ với một thao tác chạm.
- **Đường dẫn:** `Trang Chủ App Mobile -> Chạm vào: Thẻ Hội Viên Doanh Nhân`
- **Các bước:**
  * Bước 1: Chạm trực tiếp vào Thẻ Hội Viên Doanh Nhân trên màn hình Trang Chủ.
  * Bước 2: Một bảng điều khiển (Bottom Sheet) vuốt mượt mà từ cạnh dưới màn hình lên với góc bo cong tròn 36px sang trọng.
  * Bước 3: Bottom Sheet hiển thị: Mã QR cá nhân hóa, Nút [Chạm NFC Một Chạm], Nút [Chia Sẻ vCard] và Nút [Gửi Qua Zalo/Tin Nhắn].
  * Bước 4: Để đóng bảng điều khiển: Đặt ngón tay lên thanh gạt ngang trên đỉnh popup và vuốt nhẹ xuống dưới (Swipe Down), popup sẽ trượt xuống đóng lại mượt mà.
- **Lưu ý:** CỬ CHỈ VUỐT TAY TỰ NHIÊN: Tính năng vuốt tay xuống (Swipe Down gesture) mang lại trải nghiệm mượt mà, chuẩn mực như các ứng dụng gốc iOS cao cấp nhất.
- **Mẹo C-Level:** MẸO GIAO TIẾP: Khi đi dự tiệc hoặc hội thảo, chỉ cần mở sẵn Bottom Sheet này để đối tác quét mã QR kết nối ngay lập tức.

#### 27. [APP · NÚT V TRUNG TÂM] Bảng Điều Khiển Nhanh Nút ViOne Mạ Vàng Trung Tâm (VActionSheet)
- **Mục tiêu:** Thực hiện siêu tốc các tác vụ lãnh đạo quan trọng nhất chỉ với 1 lần chạm ngón tay.
- **Đường dẫn:** `Thanh điều hướng đáy -> Chạm vào: Nút tròn chữ V màu vàng kim ở chính giữa`
- **Các bước:**
  * Bước 1: Chạm vào nút tròn ViOne dập nổi ánh kim vàng Champagne ở giữa thanh điều hướng đáy.
  * Bước 2: Màn hình kích hoạt hiệu ứng kính mờ (Obsidian Glassmorphism) và hiển thị Bảng điều khiển VActionSheet.
  * Bước 3: Chọn 1 trong 6 tác vụ nhanh:
  • [1. Quét Danh Thiếp OCR]: Chụp ảnh danh thiếp giấy để AI tự động lưu vào CRM.
  • [2. Chấm Công Định Vị GPS]: Điểm danh văn phòng chỉ với 1 chạm.
  • [3. Phê Duyệt Chi Tiền]: Duyệt nhanh các phiếu chi ngân sách khẩn cấp.
  • [4. Đăng Nhu Cầu Mua/Bán]: Phát sóng tin mời thầu hoặc chào hàng B2B.
  • [5. Hẹn Gặp 1-on-1]: Xếp lịch làm việc nhanh với một CEO đối tác.
  • [6. Trợ Lý AI Copilot]: Mở đàm thoại trực tiếp với trợ lý thông minh.
  * Bước 4: Chạm vào vùng nền tối để đóng Action Sheet.
- **Lưu ý:** THIẾT KẾ ĐỘC QUYỀN: Nút ViOne trung tâm được chế tác với biểu tượng vector VIconMark 3D đa tầng gradient, tuyệt đối không phải chữ text thông thường.
- **Mẹo C-Level:** MẸO TIỆN ÍCH: Đây là phím tắt quyền năng nhất trên app giúp các CEO tiết kiệm thời gian thao tác tới 70%.

#### 28. [APP · ĐỐI TÁC] Mạng Lưới Đối Tác & Bản Tin Khoảnh Khắc 24h (Network & Stories)
- **Mục tiêu:** Mở rộng mạng lưới quan hệ chiến lược và duy trì tương tác thường xuyên với các đối tác chủ chốt.
- **Đường dẫn:** `Thanh điều hướng đáy -> Chạm vào Tab: Mạng Lưới (Network)`
- **Các bước:**
  * Bước 1: Header màn hình hiển thị Avatar tròn mạ vàng của bạn, bên cạnh nút Quét card.
  * Bước 2: Dải Stories 24h trên đầu hiển thị thẻ Tạo tin 24h (lấy ảnh thật và tên thật của bạn) cùng avatar các doanh nhân vừa đăng tải hoạt động mới. Chạm vào avatar để xem trình chiếu toàn màn hình.
  * Bước 3: Khối banner AI Copilot Matcher gợi ý các đối tác có độ tương thích kinh doanh cao.
  * Bước 4: Danh sách "Chăm Sóc Đối Tác" hiển thị các mối quan hệ quan trọng kèm ngày tương tác gần nhất và các phím tắt: [Gọi Điện] [Nhắn Tin] [Hẹn Gặp 1-1].
  * Bước 5: Bộ lọc ngành nghề chuẩn màu Nâu Gradient ViOne cho phép lọc nhanh đối tác theo chuyên môn.
- **Lưu ý:** QUY TẮC TIN 24H: Các khoảnh khắc Stories sẽ tự động biến mất sau đúng 24 giờ kể từ thời điểm đăng tải.
- **Mẹo C-Level:** MẸO DUY TRÌ QUAN HỆ: Nhắn tin chúc mừng hoặc tương tác với Story của đối tác là cách tự nhiên nhất để mở đầu một cơ hội làm ăn mới.

#### 29. [APP · 2 KIỂU CỘNG ĐỒNG] Phân Hệ 2 Kiểu Cộng Đồng Doanh Nghiệp (B2B Networking vs Công Ty Nội Bộ)
- **Mục tiêu:** Phục vụ đồng thời hai nhu cầu cốt lõi của doanh nghiệp: Kết nối giao thương bên ngoài và Giao việc quản trị bên trong.
- **Đường dẫn:** `Thanh điều hướng đáy -> Chạm Tab: Cộng Đồng (Community)`
- **Các bước:**
  * Bước 1: Tại màn hình danh sách cộng đồng, nhận diện 2 loại hình qua huy hiệu nổi bật: [🤝 MẠNG LƯỚI B2B] hoặc [🏢 CÔNG TY NỘI BỘ].
  * Bước 2: Khi truy cập Cộng Đồng B2B Networking:
  • Nút hành động trên Header: `+ Đăng cơ hội`, `+ Đăng bài`, `+ Chia sẻ SK`.
  • Các Tab nghiệp vụ: [Cơ hội], [Bảng tin], [Sự kiện], [Thành viên].
  • Tuyệt đối KHÔNG có tính năng giao việc nhân sự hay giám sát trong cộng đồng B2B.
  * Bước 3: Khi truy cập Cộng Đồng Nội Bộ Công Ty:
  • Nút hành động trên Header: `+ Giao việc`, `+ Đăng bài`, `+ Chia sẻ SK`.
  • Các Tab nghiệp vụ: [Công việc], [Giám sát CRM], [Bảng tin], [Sự kiện], [Nhân sự].
  • Tuyệt đối KHÔNG có tính năng đăng cơ hội giao thương B2B trong cộng đồng công ty.
  * Bước 4: Chia sẻ sự kiện đối tác ngoài: Bấm `+ Chia sẻ SK` -> Nhập link sự kiện bên ngoài vào modal ShareEventModal để quảng bá cho thành viên.
- **Lưu ý:** QUY TẮC PHÂN LẬP NGHIÊM NGẶT: Hệ thống kiểm soát quyền chặt chẽ theo loại hình cộng đồng, không cho phép giao việc nhân viên trong cộng đồng giao lưu B2B và không đăng tin thầu rao bán trong cộng đồng nội bộ.
- **Mẹo C-Level:** MẸO ĐIỀU HÀNH: Giám đốc tạo một cộng đồng công ty để tập hợp toàn bộ nhân viên và tham gia các cộng đồng B2B để săn cơ hội thầu.

#### 30. [APP · GIAO VIỆC NỘI BỘ] Quy Trình Giao Việc & Nhận Việc 1-Chạm Trong Cộng Đồng Công Ty
- **Mục tiêu:** Số hóa 100% quy trình làm việc trong doanh nghiệp, kiểm soát thời gian thực việc nhận và hoàn thành công việc.
- **Đường dẫn:** `Cộng Đồng Nội Bộ Công Ty -> Tab: Công Việc (Tasks) & Tab: Giám Sát (Supervision)`
- **Các bước:**
  * Bước 1: Giám đốc bấm nút "+ Giao việc" trên Header hoặc trong Tab Công việc -> Mở form giao việc chi tiết.
  * Bước 2: Nhập: Tiêu đề công việc, Mô tả nhiệm vụ, Chọn nhân viên phụ trách từ danh sách công ty, Thiết lập Thời hạn hoàn thành (Deadline), Chọn khách hàng CRM liên quan.
  * Bước 3: Gửi công việc: Nhân viên phụ trách nhận được thông báo thời gian thực. Khi mở Tab Công việc, công việc hiển thị ở trạng thái "Chờ nhận việc" kèm nút bấm nổi bật [⚡ TIẾN HÀNH NHẬN VIỆC].
  * Bước 4: Nhân viên bấm [⚡ TIẾN HÀNH NHẬN VIỆC]: Trạng thái công việc chuyển ngay sang "Đang làm" (in_progress), hệ thống ghi nhận chính xác mốc thời gian nhận việc (acceptedAt) và bắn thông báo xác nhận về máy Giám đốc.
  * Bước 5: Giám đốc mở Tab "Giám Sát": Theo dõi ma trận nhân sự, danh sách khách hàng từng nhân viên đang chăm sóc, giai đoạn phễu và hoạt động thực tế.
- **Lưu ý:** KIỂM SOÁT THỜI GIAN THỰC: Giám đốc biết chính xác nhân viên đã bấm nhận việc hay chưa thông qua nút [⚡ TIẾN HÀNH NHẬN VIỆC] và mốc thời gian acceptedAt.
- **Mẹo C-Level:** MẸO VẬN HÀNH: Liên kết công việc với khách hàng CRM giúp nhân viên mở trực tiếp hồ sơ khách hàng chỉ với 1 chạm ngay trong chi tiết công việc.

#### 31. [APP · QUẢN TRỊ CỘNG ĐỒNG] Quyền Quản Trị Cộng Đồng Gia Đình ViOne Cho Admin Nền Tảng
- **Mục tiêu:** Trao toàn quyền quản trị cộng đồng trung tâm Gia đình ViOne cho các tài khoản quản trị viên nền tảng.
- **Đường dẫn:** `Cộng Đồng Gia Đình ViOne -> Bấm nút: [⚙️ Chỉnh sửa cộng đồng] trên Header`
- **Các bước:**
  * Bước 1: Đăng nhập bằng tài khoản Quản trị viên (Admin/Owner) và truy cập cộng đồng "Gia đình ViOne".
  * Bước 2: Hệ thống tự động nhận diện quyền Quản trị viên (canEdit = true, viewerRole = "admin") và hiển thị nút mạ vàng [⚙️ Chỉnh sửa cộng đồng]. Trong tab Thành viên, tài khoản được gắn nhãn "Quản trị viên".
  * Bước 3: Nhấp vào [⚙️ Chỉnh sửa cộng đồng] để mở modal EditCommunityModal chuyên dụng.
  * Bước 4: Chỉnh sửa các trường thông tin: Tên cộng đồng, Tải lên Ảnh đại diện (Logo) mới, Tải lên Ảnh bìa (Banner) mới, Cập nhật Khẩu hiệu (Tagline), Mô tả chi tiết và Loại hình cộng đồng.
  * Bước 5: Bấm "Lưu Thay Đổi": Thông tin cộng đồng được cập nhật ngay lập tức lên CSDL và đồng bộ tới toàn bộ thành viên.
- **Lưu ý:** QUYỀN HẠN BẢO MẬT: Nút [⚙️ Chỉnh sửa cộng đồng] chỉ hiển thị với các tài khoản Admin hoặc Chủ sở hữu cộng đồng. Thành viên thông thường chỉ có quyền xem.
- **Mẹo C-Level:** MẸO THẨM MỸ: Ảnh bìa cộng đồng nên có tỷ lệ 16:9 chất lượng cao và ảnh đại diện logo tròn để hiển thị đẹp nhất trên màn hình điện thoại.

#### 32. [APP · CƠ HỘI B2B & HẸN GẶP] Quy Trình Quan Tâm Cơ Hội B2B & Đề Xuất Hẹn Gặp Qua Thẻ Chat Tương Tác
- **Mục tiêu:** Biến cơ hội kinh doanh thành các cuộc gặp mặt thực tế 1-on-1, xúc tiến giao thương nhanh chóng.
- **Đường dẫn:** `Cộng Đồng B2B -> Tab Cơ Hội -> Xem Chi Tiết Cơ Hội -> Bấm [Quan tâm]`
- **Các bước:**
  * Bước 1: Xem chi tiết một cơ hội kinh doanh trên Sàn Cơ Hội B2B.
  * Bước 2: Bấm nút [Quan tâm]: Hệ thống ghi nhận lượt quan tâm, bắn thông báo cho người đăng cơ hội và hiển thị thêm nút nổi bật [📅 Nhắn tin hẹn gặp trao đổi cơ hội].
  * Bước 3: Bấm nút [📅 Nhắn tin hẹn gặp trao đổi cơ hội] -> Mở modal ProposeOpportunityMeetingModal: Chọn Ngày hẹn, Giờ hẹn, Hình thức gặp (Trực tiếp hoặc Video Call ViOne) và Lời nhắn hợp tác -> Bấm "Gửi Đề Xuất Hẹn Gặp".
  * Bước 4: Thẻ tương tác OpportunityMeetingProposalCard xuất hiện trong luồng chat của người đăng với 2 nút: [Đồng ý hẹn] và [Từ chối].
  * Bước 5: Khi người đăng bấm [Đồng ý hẹn]: Cuộc gặp tự động được lưu vào CSDL lịch trình, kích hoạt sự kiện meeting-scheduled, xuất hiện ngay trong Tab [Hôm nay] trên Trang chủ ExecutiveHome của cả hai bên, đồng thời bắn thông báo xác nhận.
  * Bước 6: Đối với Người Đăng Cơ Hội: Có thể xem danh sách toàn bộ đối tác quan tâm (interestedMembers) kèm thông tin công ty và nút hẹn gặp nhanh.
- **Lưu ý:** TỰ ĐỘNG HÓA LỊCH TRÌNH: Khi bấm [Đồng ý hẹn], cuộc gặp được ghim thẳng vào lịch trình làm việc trang chủ mà không cần nhập liệu thủ công.
- **Mẹo C-Level:** MẸO KẾT NỐI: Người đăng cơ hội nên kiểm tra thường xuyên danh sách đối tác quan tâm để chủ động đề xuất lịch hẹn với các đối tác tiềm năng nhất.

#### 33. [APP · GHI ÂM KHOẢNH KHẮC] Lưu Vết Ghi Âm Khoảnh Khắc (Voice Moments) & Danh Mục Lịch Sử Trang Chủ
- **Mục tiêu:** Lưu giữ những ghi chú giọng nói quan trọng và giúp lãnh đạo dễ dàng nghe lại mọi lúc mọi nơi.
- **Đường dẫn:** `Đăng Khoảnh Khắc -> Thu âm giọng nói -> Trang Chủ ExecutiveHome -> Tab: [🎙️ Ghi âm]`
- **Các bước:**
  * Bước 1: Khi tạo bài viết hoặc khoảnh khắc trong ứng dụng, người dùng bấm vào biểu tượng Micro để thu âm giọng nói (MomentVoiceNote).
  * Bước 2: Sau khi thu âm và đăng khoảnh khắc thành công, tệp âm thanh tự động được lưu vết vào kho lưu trữ lịch sử vba_voice_moments_history và phát sự kiện voice-moment-saved.
  * Bước 3: Mở Trang chủ ExecutiveHome: Quan sát thanh tab lịch trình có thêm danh mục thứ 4 [🎙️ Ghi âm ({count})] bên cạnh Hôm nay, Sắp tới, Lời nhắc.
  * Bước 4: Nhấp vào Tab [🎙️ Ghi âm]: Danh sách toàn bộ các bản ghi âm khoảnh khắc xuất hiện kèm ngày giờ thu âm, thời lượng, trích đoạn nội dung và sóng âm trực quan.
  * Bước 5: Bấm nút Play/Pause trên từng bản ghi âm để nghe lại giọng nói trực tiếp với trình phát audio inline handleTogglePlayVoice.
- **Lưu ý:** LƯU VẾT BỀN VỮNG: Mọi bản ghi âm giọng nói đều được lưu vết thời gian thực, đảm bảo không bị thất lạc khi chuyển đổi qua lại giữa các màn hình.
- **Mẹo C-Level:** MẸO GHI CHÚ: Sử dụng ghi âm khoảnh khắc để ghi lại các ý tưởng kinh doanh chớp nhoáng hoặc tóm tắt nhanh sau các cuộc họp đối tác.

#### 34. [APP · AI COPILOT] Trí Tuệ Nhân Tạo ViOne AI Copilot 5.0 Thông Minh Toàn Năng
- **Mục tiêu:** Cung cấp trợ lý điều hành giọng nói tiếng Việt toàn năng, hỗ trợ tối đa cho các quyết định của lãnh đạo C-Level.
- **Đường dẫn:** `Trang Chủ -> Bấm nút Micro AI hoặc Chạm nút ViOne mạ vàng -> Chọn: Trợ Lý AI Copilot`
- **Các bước:**
  * Bước 1: Chạm vào biểu tượng Trợ lý AI ViOne Copilot để mở cửa sổ đàm thoại giọng nói thông minh.
  * Bước 2: Tìm kiếm đoạn ghi âm khoảnh khắc: Ra lệnh bằng giọng nói: "tìm đoạn ghi âm tại khoảnh khắc" -> AI tự động quét kho lịch sử ghi âm, phản hồi giọng nói và hiển thị thẻ Voice Moment Evidence có nút nghe lại và thanh sóng âm trực tiếp trong hộp thoại AI.
  * Bước 3: Quét người dùng ViOne quanh đây: Hỏi AI: "quanh đây có ai dùng ViOne không" -> AI kích hoạt định vị trong bán kính (km), yêu cầu cấp quyền vị trí, hiển thị danh sách người dùng lân cận hoặc phản hồi lịch sự kèm gợi ý mở rộng bán kính.
  * Bước 4: Phân tích động cơ hội kinh doanh: Hỏi AI: "tôi được bao nhiêu quan tâm cơ hội của tôi" -> AI tính toán chính xác số lượt và hiển thị thẻ Opportunity Evidence Cards kèm nút [Xem đối tác quan tâm] và [Hẹn gặp].
  * Bước 5: Kiểm tra cuộc gặp điều hành: Hỏi AI: "tôi có cuộc gặp nào không" -> AI tổng hợp chi tiết các cuộc gặp đã xác nhận và hiển thị thẻ Meeting Evidence Cards kèm nút [Vào phòng họp video] và [Xem lịch].
  * Bước 6: Đa thông báo tương tác: Hệ thống tự động bắn thông báo thời gian thực cho mọi tương tác (tin nhắn người lạ, đối tác quan tâm cơ hội, đề xuất hẹn gặp, đối tác đồng ý hẹn, kết nối thành công).
- **Lưu ý:** DYNAMIC TOÀN DIỆN: AI Copilot tuyệt đối không lặp lại câu hỏi của người dùng và luôn đưa ra số liệu thực tế kèm thẻ bằng chứng tương tác (Evidence Cards).
- **Mẹo C-Level:** MẸO RA LỆNH: Có thể hỏi AI bất kỳ câu hỏi nào về lịch trình hôm nay, tình hình chấm công nhân sự, hay duyệt chi ngân sách.

#### 35. [APP · DANH TÍNH SỐ] Hồ Sơ Danh Tính Số C-Level, Danh Thiếp Titanium 3D & Chia Sẻ Chạm NFC
- **Mục tiêu:** Khẳng định vị thế uy tín của doanh nhân và quản lý toàn bộ thông tin kết nối cá nhân.
- **Đường dẫn:** `Thanh điều hướng đáy -> Chạm vào Tab: Tôi (Me Profile)`
- **Các bước:**
  * Bước 1: Xem Card "DANH TÍNH SỐ": Hiển thị ảnh chân dung lãnh đạo, họ tên, chức vụ, tên công ty và chữ ký V mạ vàng dập chìm.
  * Bước 2: Sử dụng 2 nút gradient vàng nổi bật: [QR Của Tôi] để phóng to mã QR và [Chạm NFC] để sẵn sàng chia sẻ danh thiếp.
  * Bước 3: Card "LIÊN HỆ NHANH" với 5 nút tương tác trực tiếp một chạm: [Gọi Điện] [Gửi Email] [Viber] [WhatsApp] [Telegram].
  * Bước 4: Mở "Ví Danh Thiếp Đối Tác" để xem và tải về danh bạ vCard của tất cả những người mình đã từng chạm thẻ giao lưu.
  * Bước 5: Cấu hình "Quyền Riêng Tư": Chọn ẩn hoặc hiện số điện thoại cá nhân khi người lạ quét thẻ.
- **Lưu ý:** QUYỀN RIÊNG TƯ TUYỆT ĐỐI: Những trường thông tin bạn đã bấm "Ẩn" trong cài đặt quyền riêng tư sẽ không bao giờ hiển thị khi người khác quét thẻ của bạn.
- **Mẹo C-Level:** MẸO ĐẲNG CẤP: Chuyển đổi giữa chế độ Sáng Tinh Tế và Tối Huyền Bí Obsidian tùy theo sở thích và hoàn cảnh sử dụng.

#### 36. [APP · CÀI ĐẶT IOS] Cài Đặt PWA 1-Chạm Trên iPhone / iPad (Apple WebClip Profile)
- **Mục tiêu:** Giúp người dùng iPhone cài đặt app ViOne Connect nhanh chóng chỉ với 1 click mà không cần qua App Store.
- **Đường dẫn:** `Trình duyệt Safari trên iPhone -> Truy cập trang /install hoặc tải file: /vione_ios_install.mobileconfig`
- **Các bước:**
  * Bước 1: Mở liên kết /install trên trình duyệt Safari của iPhone.
  * Bước 2: Hoặc tải file cấu hình /vione_ios_install.mobileconfig -> Safari hỏi: "Trang web này đang cố tải về một hồ sơ cấu hình. Bạn có muốn cho phép không?" -> Bấm "Cho phép" (Allow).
  * Bước 3: Mở ứng dụng "Cài đặt" (Settings) trên iPhone -> Chạm vào mục "Đã tải về hồ sơ" (Profile Downloaded) ở ngay đầu.
  * Bước 4: Nhấn nút "Cài đặt" (Install) ở góc phải trên -> Nhập Mật khẩu máy -> Tiếp tục bấm "Cài đặt".
  * Bước 5: Biểu tượng ứng dụng ViOne Connect màu vàng kim sẽ xuất hiện ngay lập tức trên Màn hình chính của iPhone.
  * Bước 6: Chạm vào biểu tượng để mở app: Ứng dụng chạy toàn màn hình Native siêu mượt, loại bỏ hoàn toàn thanh địa chỉ Safari.
- **Lưu ý:** BẮT BUỘC DÙNG SAFARI: Thao tác tải và cài đặt hồ sơ cấu hình trên iOS bắt buộc phải thực hiện qua trình duyệt Safari mặc định của Apple. Nếu mở qua Zalo/FB, hãy bấm [•••] chọn Mở bằng Safari.
- **Mẹo C-Level:** MẸO ĐỘT PHÁ: Giải pháp này giúp người dùng iOS cài đặt app dễ dàng như cài file APK trên Android, không lo bị thu hồi chứng chỉ doanh nghiệp.

#### 37. [APP · HỘP THƯ & CUỘC GỌI] Hộp Thư Trực Tiếp & Cuộc Gọi WebRTC Thoại & Video Real Dual-Theme
- **Mục tiêu:** Trao đổi hợp tác làm ăn nhanh chóng, thực hiện cuộc gọi chất lượng cao với âm thanh rõ nét.
- **Đường dẫn:** `Thanh điều hướng đáy -> Chạm vào biểu tượng: Hộp Thư (Inbox)`
- **Các bước:**
  * Bước 1: Xem danh sách các cuộc trò chuyện chia theo các Tab: [Tất Cả] [Chưa Đọc] [Nhóm Dự Án] [Tin Nhắn Chờ].
  * Bước 2: Chạm vào cuộc trò chuyện để mở cửa sổ chat với đối tác. Nhận diện các thẻ tương tác hẹn gặp trao đổi cơ hội với nút [Đồng ý hẹn] và [Từ chối].
  * Bước 3: Gọi thoại WebRTC (Voice Call): Chạm biểu tượng Điện thoại -> Cuộc gọi kết nối tức thì, giọng nói đàm thoại hai chiều rõ nét qua Web Audio API không bị chặn autoplay.
  * Bước 4: Gọi video WebRTC (Video Call): Chạm biểu tượng Camera -> Khởi tạo video hai chiều sắc nét với tính năng khử tiếng vọng và lọc tiếng ồn.
  * Bước 5: Thiết kế Full Dual-Theme: Giao diện cuộc gọi hỗ trợ hoàn hảo cả Theme Sáng (nền trắng ngọc trai mạ vàng đồng, tên đối phương màu đen obsidian sắc nét) và Theme Tối (Obsidian Navy chữ trắng tinh khôi).
- **Lưu ý:** KẾT NỐI ÂM THANH THỰC TẾ: Công nghệ Web Audio API định tuyến luồng âm thanh trực tiếp từ microphone đối phương, đảm bảo nghe thấy giọng nói 100%.
- **Mẹo C-Level:** MẸO BẬT ÂM THANH: Nếu trình duyệt có chính sách hạn chế autoplay, ứng dụng trang bị sẵn nút "🔊 Bật âm thanh đối phương" để mở tiếng ngay tức thì.

