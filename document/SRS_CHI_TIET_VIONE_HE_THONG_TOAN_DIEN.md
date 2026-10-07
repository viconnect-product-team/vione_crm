# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) TOÀN DIỆN HỆ THỐNG VÀ APP VIONE
## CHUẨN QUỐC TẾ IEEE 830 - PHÂN RÃ MECE CHI TIẾT KHÔNG BỎ SÓT CHỨC NĂNG
**Dự án:** Hệ Thống Quản Trị Doanh Nghiệp Toàn Diện ViOne & Mạng Xã Hội Giao Thương Doanh Nhân B2B ViOne Connect  
**Mã tài liệu:** SRS-VIONE-MASTER-6.0 | **Ngày ban hành:** 05/10/2026 | **Phiên bản:** 6.0 Enterprise  
**Đơn vị thực hiện:** Senior Business Analyst & Solution Architect Team (15 năm kinh nghiệm)

---

## MỤC LỤC TỔNG QUAN

1. [PHẦN 1: GIỚI THIỆU CHUNG (INTRODUCTION)](#phần-1-giới-thiệu-chung-introduction)
   - 1.1 Mục Đích Tài Liệu
   - 1.2 Phạm Vi Dự Án
   - 1.3 Thuật Ngữ Và Viết Tắt (Definitions & Acronyms)
2. [PHẦN 2: MÔ TẢ TỔNG QUAN HỆ THỐNG (OVERALL DESCRIPTION)](#phần-2-mô-tả-tổng-quan-hệ-thống-overall-description)
   - 2.1 Danh Sách & Quyền Hạn Toàn Bộ User Roles
   - 2.2 Ánh Xạ 5 Hành Trình Người Dùng Toàn Diện (User Journeys)
   - 2.3 Môi Trường Hoạt Động & Yêu Cầu Hạ Tầng (Operating Environment)
3. [PHẦN 3: ĐẶC TẢ YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)](#phần-3-đặc-tả-yêu-cầu-chức-năng-chi-tiết-functional-requirements)
   - *Phân hệ I: Web CRM ViOne Platform (21 Phân hệ)*
   - *Phân hệ II: Mobile App ViOne Connect Native & PWA (11 Phân hệ)*
4. [PHẦN 4: YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)](#phần-4-yêu-cầu-phi-chức-năng-non-functional-requirements---nfr)
   - 4.1 Hiệu Năng Hệ Thống (Performance)
   - 4.2 Bảo Mật & Tuân Thủ (Security & Compliance)
   - 4.3 Tính Khả Dụng & Trải Nghiệm (Usability)
   - 4.4 Độ Tin Cậy & Khôi Phục Thảm Họa (Reliability & Disaster Recovery)
5. [PHẦN 5: YÊU CẦU GIAO TIẾP VÀ TÍCH HỢP HỆ THỐNG (SYSTEM INTERFACES)](#phần-5-yêu-cầu-giao-tiếp-và-tích-hợp-hệ-thống-system-interfaces)

---

### PHẦN 1: GIỚI THIỆU CHUNG (INTRODUCTION)

#### 1.1 Mục Đích Tài Liệu
Tài liệu Software Requirements Specification (SRS) này được biên soạn bởi Senior Business Analyst và System Architect theo chuẩn quốc tế **IEEE 830-1998 (Recommended Practice for Software Requirements Specifications)**. Tài liệu đặc tả chi tiết, toàn diện và đầy đủ 100% tất cả các yêu cầu chức năng (FR) và phi chức năng (NFR) cho Hệ thống Quản trị Doanh nghiệp ViOne CRM và Ứng dụng Di động ViOne Connect. Đây là căn cứ kỹ thuật duy nhất phục vụ công tác phát triển mã nguồn, kiểm thử chấp nhận (UAT), nghiệm thu và bàn giao hệ thống cho Chủ đầu tư.

#### 1.2 Phạm Vi Dự Án
Phạm vi dự án bao gồm hai trụ cột công nghệ hợp nhất:
1. **Nền Tảng Quản Trị Doanh Nghiệp ViOne CRM (Web Portal):** Bộ công cụ quản trị B2B toàn diện gồm Quản lý quan hệ khách hàng, Phễu bán hàng Kanban Deals, Quản trị quy trình tự động, Chấm công định vị GPS & FaceID, Phê duyệt tài chính 3 cấp, Đối soát ngân hàng VietQR, Sàn giao thương B2B, Trí tuệ nhân tạo AI Copilot 5.0, và Ma trận phân quyền 7x6 theo kiến trúc Multi-Tenant (21 Phân hệ).
2. **Ứng Dụng Di Động ViOne Connect (Mobile App Native & PWA):** Ứng dụng di động cao cấp dành cho lãnh đạo C-Level, tích hợp danh thiếp số NFC, Thẻ doanh nhân mở Bottom Sheet vuốt tay xuống, Sàn kết nối cung cầu B2B, Kênh chat trực tiếp gửi thẻ đề xuất hẹn gặp ghim lịch điều hành, Phân hệ cộng đồng 2 kiểu (B2B vs Nội bộ), Nhật ký ghi âm khoảnh khắc điều hành, Trợ lý AI Copilot 5.0 đa tác vụ tìm kiếm bằng giọng nói và quét đối tác quanh đây, Trung tâm duyệt hồ sơ 1-chạm di động và giải pháp cài đặt 1-chạm độc quyền cho iOS (.mobileconfig) (11 Phân hệ).

#### 1.3 Thuật Ngữ Và Viết Tắt
- **CRM:** Customer Relationship Management (Quản lý quan hệ khách hàng).
- **ERP:** Enterprise Resource Planning (Hoạch định tài nguyên doanh nghiệp).
- **RBAC:** Role-Based Access Control (Kiểm soát truy cập dựa trên vai trò).
- **NFC:** Near Field Communication (Giao tiếp trường gần - Chạm truyền dữ liệu).
- **OCR:** Optical Character Recognition (Nhận dạng ký tự quang học).
- **MECE:** Mutually Exclusive, Collectively Exhaustive (Không trùng lặp, Không bỏ sót).
- **PWA:** Progressive Web App (Ứng dụng web tiến bộ).
- **JWT:** JSON Web Token (Chuẩn xác thực phân tán an toàn).

---

### PHẦN 2: MÔ TẢ TỔNG QUAN HỆ THỐNG (OVERALL DESCRIPTION)

#### 2.1 Danh Sách & Quyền Hạn Toàn Bộ User Roles
Hệ thống xác định 7 nhóm vai trò chuẩn mực:
1. **System Administrator (Super Admin):** Quản trị toàn bộ nền tảng, quản lý danh sách tenant, cấu hình ma trận phân quyền hệ thống, xem nhật ký kiểm toán toàn diện.
2. **Tổng Giám Đốc / Chủ Tịch (CEO):** Xem toàn bộ bảng điều hành số C-Level, phê duyệt tài chính cấp cao nhất (Cấp 3), ra quyết định giao việc, kích hoạt biểu quyết số.
3. **Giám Đốc Vận Hành (COO):** Giám sát khối lượng công việc và nhiệt tải nhân sự (Workload Heatmap), thiết lập quy trình tự động, quản lý chấm công nhân sự.
4. **Giám Đốc Tài Chính / Kế Toán Trưởng (CFO / Chief Accountant):** Kiểm soát sổ quỹ thu chi, dòng tiền, phê duyệt tài chính Cấp 2 và Cấp 3, cấu hình cổng VietQR đối soát tự động.
5. **Giám Đốc Kinh Doanh / Trưởng Phòng Sales (Sales Manager):** Quản lý toàn bộ phễu bán hàng Kanban Deals, quản trị hồ sơ khách hàng 360 độ, phân bổ khách hàng cho sales.
6. **Nhân Viên Chuyên Môn / Kinh Doanh (Staff / Sales Executive):** Chăm sóc khách hàng được phân bổ, cập nhật giai đoạn deal, đề xuất phiếu chi (Cấp 1), chấm công di động.
7. **Hội Viên Doanh Nhân / Đối Tác (Partner / Member):** Sử dụng App ViOne Connect, sở hữu danh thiếp số NFC, đăng tin nhu cầu mua bán, tham gia sự kiện và kết nối 1-on-1.

#### 2.2 Ánh Xạ 5 Hành Trình Người Dùng Toàn Diện (User Journeys)
1. **Hành trình Quản trị & Điều hành Doanh nghiệp (CEO/COO):** Đăng nhập Web CRM -> Xem KPI Dashboard -> Kiểm tra cảnh báo tải việc nhân sự -> Duyệt phiếu chi ngân sách Cấp 3 -> Kích hoạt cuộc họp biểu quyết số.
2. **Hành trình Bán hàng B2B & Chăm sóc Khách hàng (Sales Executive):** Nhận lead mới -> Chấm điểm AI Lead Score -> Gọi điện / Email tư vấn -> Kéo deal qua các giai đoạn Kanban -> Chốt hợp đồng thành công.
3. **Hành trình Kiểm soát Dòng tiền & Thanh toán (Kế toán trưởng):** Nhận thông báo đề xuất chi -> Thẩm định hóa đơn chứng từ -> Trình duyệt Giám đốc -> Sinh mã VietQR chuyển khoản -> Đối soát gạch nợ tự động.
4. **Hành trình Giao thương Di động & Chạm Danh thiếp NFC (Doanh nhân C-Level):** Mở App ViOne -> Chạm thẻ mở Bottom Sheet vuốt tay -> Chạm NFC chia sẻ danh thiếp số -> Quét danh thiếp đối tác bằng OCR -> Lưu vào CRM.
5. **Hành trình Tham gia Sự kiện & QR Check-in (Khách mời sự kiện):** Khám phá sự kiện trên App -> Đăng ký nhận vé QR VIP -> Đến hội trường -> Quét mã QR tại bàn lễ tân điểm danh trong 1 giây.

---

### PHẦN 3: ĐẶC TẢ YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)

#### MODULE 01: XÁC THỰC, ĐĂNG NHẬP & QUẢN LÝ PHIÊN C-LEVEL
*Mục tiêu Epic:* Quản trị danh tính và phiên truy cập bảo mật đa kênh trên Web CRM

##### FR-01.01 - Đăng nhập Quản trị Đa phương thức (Email, SĐT, Google, Apple OAuth)
- **Actor:** Admin, Ban Giám Đốc, Kế toán, Quản lý chi nhánh, Nhân viên
- **Input:** Identifier (Email hoặc Số điện thoại 9-12 chữ số), Mật khẩu (tối thiểu 8 ký tự), hoặc OAuth Authorization Code, reCAPTCHA v3 token.
- **Logic Xử Lý:**
  1. Hệ thống tiếp nhận payload và chuẩn hóa định dạng (lowercase email, chuẩn hóa SĐT +84).
  2. Kiểm tra Rate Limiting (tối đa 5 lần thử sai trong 15 phút trên 1 địa chỉ IP).
  3. Kiểm tra người dùng trong CSDL PostgreSQL qua NestJS AuthService, đối soát mật khẩu đã băm bcrypt.
  4. Khởi tạo cặp JWT token: Access Token (HS256, hạn 60 phút) và Refresh Token (hạn 30 ngày) lưu phiên an toàn.
  5. Trả về thông tin hồ sơ tài khoản (User Profile, vai trò RBAC, danh sách quyền) và thiết lập HttpOnly cookie nếu trên môi trường HTTPS.
- **Output:** JSON chứa access_token, refresh_token, thông tin user và chuyển hướng vào /dashboard.
- **Luồng Ngoại Lệ (Exception Handling):** Tài khoản không tồn tại hoặc sai mật khẩu: Báo lỗi mã 401 "Thông tin đăng nhập không chính xác". Khóa tài khoản sau 5 lần nhập sai.
- **RESTful API Endpoint:** `POST /api/auth/login`

##### FR-01.02 - Xác thực Đăng nhập Hai Lớp (MFA) & Cấp lại Mật khẩu OTP
- **Actor:** Toàn bộ người dùng hệ thống
- **Input:** Email hoặc Số điện thoại đã đăng ký, mã OTP 6 chữ số.
- **Logic Xử Lý:**
  1. Người dùng gửi yêu cầu quên mật khẩu hoặc kích hoạt MFA.
  2. Hệ thống sinh mã OTP 6 số ngẫu nhiên với thời gian sống TTL 5 phút, lưu cache Redis.
  3. Gửi OTP qua cổng SMS Viettel/FPT hoặc Email SMTP doanh nghiệp.
  4. Người dùng nhập mã OTP để xác thực, nếu đúng cho phép nhập mật khẩu mới và hủy toàn bộ phiên cũ.
- **Output:** Mã OTP gửi đến thiết bị; sau xác thực thành công cho phép đặt lại mật khẩu mới.
- **Luồng Ngoại Lệ (Exception Handling):** Mã OTP quá hạn (sau 5 phút) hoặc nhập sai quá 3 lần: Yêu cầu tạo mã OTP mới.
- **RESTful API Endpoint:** `POST /api/auth/forgot-password, POST /api/auth/verify-otp`


#### MODULE 02: BẢNG ĐIỀU HÀNH SỐ C-LEVEL (EXECUTIVE DASHBOARD)
*Mục tiêu Epic:* Tổng hợp chỉ số KPI, dòng tiền, hiệu suất bán hàng và cảnh báo điều hành

##### FR-02.01 - Tổng hợp Chỉ số Điều hành Thời Gian Thực (KPI Metric Cards)
- **Actor:** CEO, COO, CFO, Quản trị hệ thống
- **Input:** Bộ lọc thời gian (Hôm nay, Tuần này, Tháng này, Quý, Năm, Tùy chọn).
- **Logic Xử Lý:**
  1. Tiếp nhận tham số thời gian và tenant_id từ JWT context.
  2. Thực thi truy vấn tổng hợp từ các bảng deals, customers, cash_flow, attendance.
  3. Tính toán 4 chỉ số KPI then chốt: Tổng doanh thu, Số khách hàng mới, Số thỏa thuận mở, Tỷ lệ chốt deal.
  4. Tính toán phần trăm tăng trưởng so với kỳ trước và trả về cho giao diện biểu đồ.
- **Output:** Dữ liệu số liệu KPI, tỷ lệ % tăng giảm và trạng thái biểu đồ realtime.
- **Luồng Ngoại Lệ (Exception Handling):** Không có dữ liệu trong khoảng thời gian chọn: Trả về 0 kèm thông báo trạng thái rỗng.
- **RESTful API Endpoint:** `GET /api/dashboard/metrics?period=month`

##### FR-02.02 - Biểu đồ Dòng Tiền & Doanh Thu Tích Lũy
- **Actor:** Ban Giám Đốc, CFO, Kế toán trưởng
- **Input:** Năm tài chính, loại báo cáo (Dòng tiền ròng, Doanh thu, Chi phí).
- **Logic Xử Lý:**
  1. Truy vấn sổ cái thu chi từ bảng financial_transactions nhóm theo 12 tháng.
  2. Tính toán tổng thu, tổng chi và dòng tiền lũy kế theo từng chu kỳ.
  3. Trả về mảng dữ liệu phục vụ biểu đồ cột và biểu đồ đường.
- **Output:** Mảng dữ liệu 12 tháng { month, revenue, expense, net_cashflow }.
- **Luồng Ngoại Lệ (Exception Handling):** Lỗi kết nối CSDL tài chính: Trả về dữ liệu cache gần nhất kèm cảnh báo.
- **RESTful API Endpoint:** `GET /api/dashboard/cashflow-chart`


#### MODULE 03: QUẢN TRỊ KHÁCH HÀNG B2B & LEAD 360° (SMART CRM)
*Mục tiêu Epic:* Hồ sơ khách hàng doanh nghiệp 360 độ, nguồn chuyển đổi và chấm điểm tiềm năng AI

##### FR-03.01 - Quản lý Danh sách & Hồ sơ Khách hàng B2B 360 Độ
- **Actor:** Giám đốc kinh doanh, Nhân viên kinh doanh, Quản trị viên
- **Input:** Từ khóa tìm kiếm, bộ lọc nguồn (NFC Tap, Quét OCR, B2B Network, Website), phân loại nhóm.
- **Logic Xử Lý:**
  1. Tiếp nhận bộ lọc và phân trang (page, limit).
  2. Truy vấn bảng customers kết hợp thông tin liên hệ, lịch sử đơn hàng, công nợ và tương tác.
  3. Trả về danh sách khách hàng có phân trang, định dạng số điện thoại và điểm tiềm năng AI.
- **Output:** Bảng danh sách khách hàng đầy đủ thông tin định danh, doanh thu và hành động nhanh.
- **Luồng Ngoại Lệ (Exception Handling):** Truy vấn vượt quá phạm vi chi nhánh được phân quyền: Chặn truy cập theo ma trận RBAC.
- **RESTful API Endpoint:** `GET /api/connect-app/customers`

##### FR-03.02 - Thêm mới & Cập nhật Hồ sơ Khách hàng B2B
- **Actor:** Nhân viên kinh doanh, Trưởng phòng
- **Input:** Tên công ty, Mã số thuế, Người liên hệ, Chức vụ, Số điện thoại, Email, Ngành nghề, Địa chỉ, Ghi chú.
- **Logic Xử Lý:**
  1. Kiểm tra tính hợp lệ dữ liệu (Mã số thuế đúng 10-13 số, Email hợp lệ, SĐT đúng chuẩn).
  2. Kiểm tra trùng lặp mã số thuế hoặc số điện thoại trong cùng doanh nghiệp.
  3. Thêm mới bản ghi vào bảng customers, tự động gán người phụ trách là user đang thao tác.
  4. Kích hoạt Trợ lý AI tính điểm tiềm năng ban đầu dựa trên quy mô công ty và ngành nghề.
- **Output:** Hồ sơ khách hàng mới tạo thành công kèm mã định danh UUID duy nhất.
- **Luồng Ngoại Lệ (Exception Handling):** Trùng mã số thuế: Báo lỗi "Doanh nghiệp đã tồn tại trong hệ thống" kèm liên kết đến hồ sơ cũ.
- **RESTful API Endpoint:** `POST /api/connect-app/customers, PUT /api/connect-app/customers/:id`

##### FR-03.03 - Xuất Báo Cáo Khách Hàng Ra File Excel/CSV
- **Actor:** Giám đốc kinh doanh, Admin
- **Input:** Điều kiện lọc khách hàng cần xuất báo cáo.
- **Logic Xử Lý:**
  1. Kiểm tra quyền "Xuất dữ liệu" (Export) của người dùng theo vai trò.
  2. Thu thập toàn bộ bản ghi thỏa mãn điều kiện lọc.
  3. Sinh file Excel định dạng chuẩn UTF-8 chứa đầy đủ trường dữ liệu kinh doanh.
  4. Ghi nhật ký kiểm toán hành vi xuất dữ liệu nhạy cảm vào audit_logs.
- **Output:** Tải xuống trực tiếp file Excel (.xlsx).
- **Luồng Ngoại Lệ (Exception Handling):** Tài khoản không có quyền Export: Trả về mã lỗi 403 Forbidden.
- **RESTful API Endpoint:** `GET /api/connect-app/customers/export`


#### MODULE 04: QUẢN TRỊ CƠ HỘI BÁN HÀNG & PHỄU KANBAN DEALS
*Mục tiêu Epic:* Quản lý các thỏa thuận thương mại qua các giai đoạn phễu kinh doanh

##### FR-04.01 - Hiển thị Phễu Bán hàng Trực quan Dạng Bảng Kanban Deals
- **Actor:** Sales Manager, Sales Executive, Giám đốc
- **Input:** Bộ lọc giai đoạn deal, khoảng giá trị ngân sách, người phụ trách.
- **Logic Xử Lý:**
  1. Truy vấn các cơ hội từ bảng opportunities theo tenant_id.
  2. Phân loại cơ hội vào 5 cột tương ứng: Mới tiếp cận, Khảo sát nhu cầu, Báo giá, Đàm phán, Chốt hợp đồng.
  3. Tính toán tổng giá trị ngân sách của từng cột phễu và tỷ lệ chuyển đổi trung bình.
- **Output:** Giao diện bảng kéo thả Kanban chứa các card thỏa thuận kinh doanh.
- **Luồng Ngoại Lệ (Exception Handling):** Không có quyền xem deal của nhân viên khác: Chỉ hiển thị các deal do chính mình phụ trách.
- **RESTful API Endpoint:** `GET /api/opportunities/kanban`

##### FR-04.02 - Kéo Thả Cập Nhật Giai Đoạn Cơ Hội (Drag & Drop Deal)
- **Actor:** Nhân viên kinh doanh, Quản lý
- **Input:** ID cơ hội (deal_id), giai đoạn đích (target_stage), lý do chuyển giai đoạn.
- **Logic Xử Lý:**
  1. Kiểm tra quyền sở hữu hoặc quyền quản lý trên cơ hội.
  2. Cập nhật trường stage trong bảng opportunities.
  3. Nếu chuyển sang "Chốt hợp đồng thành công": Tự động kích hoạt luồng tạo phiếu thu và thông báo tới kế toán.
  4. Nếu chuyển sang "Thất bại": Bắt buộc nhập lý do thua deal để AI phân tích nguyên nhân.
- **Output:** Trạng thái giai đoạn cơ hội được cập nhật tức thời trên giao diện.
- **Luồng Ngoại Lệ (Exception Handling):** Kéo deal vào trạng thái Thất bại nhưng bỏ trống lý do: Chặn thao tác và yêu cầu nhập lý do.
- **RESTful API Endpoint:** `PATCH /api/opportunities/:id/stage`


#### MODULE 05: QUẢN LÝ DOANH NGHIỆP THÀNH VIÊN & CHI NHÁNH
*Mục tiêu Epic:* Quản lý thông tin pháp nhân doanh nghiệp, cấu trúc tổ chức và các văn phòng chi nhánh

##### FR-05.01 - Danh Sách Doanh Nghiệp & Mạng Lưới Chi Nhánh Trực Thuộc
- **Actor:** System Admin, Ban Giám Đốc
- **Input:** Bộ lọc trạng thái hoạt động, khu vực địa lý, từ khóa tên công ty.
- **Logic Xử Lý:**
  1. Truy vấn bảng companies và branches có phân trang.
  2. Trả về thông tin mã số thuế, đại diện pháp luật, số lượng nhân sự và trạng thái kích hoạt.
  3. Cung cấp chức năng tạo chi nhánh mới gắn liền với định vị tọa độ GPS văn phòng.
- **Output:** Bảng danh sách các pháp nhân và sơ đồ chi nhánh trực thuộc.
- **Luồng Ngoại Lệ (Exception Handling):** Lỗi truy vấn CSDL: Báo lỗi hệ thống và tải dữ liệu từ cache.
- **RESTful API Endpoint:** `GET /api/companies, GET /api/companies/:id/branches`


#### MODULE 06: QUẢN TRỊ THẺ THÔNG MINH NFC & DANH THIẾP SỐ 3D
*Mục tiêu Epic:* Cấp phát, cấu hình và quản lý vòng đời thẻ thông minh doanh nhân NFC

##### FR-06.01 - Cấu Hình & Khởi Tạo Thẻ Thông Minh NFC (Smart Card Management)
- **Actor:** Admin, Lãnh đạo doanh nghiệp
- **Input:** Mã định danh thẻ (Card UID), ID chủ thẻ, mẫu thiết kế (Titanium, Gold, Platinum).
- **Logic Xử Lý:**
  1. Đọc mã chip NFC qua đầu đọc thẻ hoặc nhập mã thẻ vật lý.
  2. Kiểm tra tính duy nhất của mã thẻ trong bảng member_business_cards.
  3. Khởi tạo liên kết giữa chip NFC và đường dẫn danh thiếp điện tử công khai (/card/:code).
  4. Sinh mã QR tương ứng và lưu trữ cấu hình bảo mật vào CSDL.
- **Output:** Thẻ thông minh được kích hoạt thành công, sẵn sàng chạm chia sẻ thông tin.
- **Luồng Ngoại Lệ (Exception Handling):** Mã chip NFC đã được gắn cho người khác: Báo lỗi "Thẻ đã được kích hoạt trên hệ thống".
- **RESTful API Endpoint:** `POST /api/cards/assign, GET /api/cards`


#### MODULE 07: QUẢN TRỊ QUY TRÌNH CÔNG VIỆC & GIAO VIỆC TỰ ĐỘNG
*Mục tiêu Epic:* Phân bổ công việc theo phòng ban, thiết lập hạn chót (Deadline) và đánh giá tiến độ

##### FR-07.01 - Khởi Tạo & Giao Nhiệm Vụ Công Việc (Task Assignment)
- **Actor:** Trưởng phòng, Quản lý dự án, Giám đốc
- **Input:** Tiêu đề nhiệm vụ, mô tả, phòng ban, người thực hiện chính, người phối hợp, hạn chót (Deadline), độ ưu tiên (Khẩn cấp, Cao, Thường).
- **Logic Xử Lý:**
  1. Kiểm tra các trường thông tin bắt buộc và thời hạn deadline phải sau thời điểm hiện tại.
  2. Thêm mới bản ghi vào bảng tasks với trạng thái ban đầu là "Chờ thực hiện".
  3. Bắn thông báo thời gian thực qua WebSocket và gửi email nhắc việc đến người được giao nhiệm vụ.
  4. Cập nhật tự động vào lịch làm việc cá nhân của nhân sự.
- **Output:** Nhiệm vụ được tạo thành công, xuất hiện trên bảng Kanban công việc của phòng ban.
- **Luồng Ngoại Lệ (Exception Handling):** Người được giao không thuộc phòng ban quản lý: Báo lỗi phân quyền giao việc.
- **RESTful API Endpoint:** `POST /api/operations/tasks`

##### FR-07.02 - Giám Sát Khối Lượng Công Việc & Tải Trọng Nhân Sự (Workload Heatmap)
- **Actor:** Giám đốc vận hành (COO), Trưởng phòng
- **Input:** Phòng ban cần xem xét, khoảng thời gian đánh giá.
- **Logic Xử Lý:**
  1. Truy vấn toàn bộ các nhiệm vụ đang mở và tiến độ thực tế của từng nhân viên.
  2. Tính toán tổng số việc đang xử lý đồng thời (WIP) của từng người.
  3. Nếu một nhân sự có trên 5 đầu việc phức tạp đồng thời, hệ thống tô màu đỏ cảnh báo quá tải (Overload Heatmap) để quản lý điều chuyển công việc.
- **Output:** Biểu đồ nhiệt phân bố khối lượng công việc trực quan.
- **Luồng Ngoại Lệ (Exception Handling):** Dữ liệu phân tích trống: Hiển thị trạng thái phân bổ cân bằng.
- **RESTful API Endpoint:** `GET /api/operations/workload`


#### MODULE 08: QUẢN TRỊ NHÂN SỰ & CHẤM CÔNG TỰ ĐỘNG (HRM & ATTENDANCE)
*Mục tiêu Epic:* Chấm công định vị GPS di động, nhận diện khuôn mặt và tổng hợp bảng công tính lương

##### FR-08.01 - Chấm Công Định Vị GPS Văn Phòng & FaceID
- **Actor:** Nhân viên, Cán bộ quản lý
- **Input:** Tọa độ GPS thiết bị di động (latitude, longitude), ảnh chụp khuôn mặt selfie.
- **Logic Xử Lý:**
  1. Hệ thống tiếp nhận tọa độ GPS và tính toán khoảng cách Euclidean/Haversine tới tâm chi nhánh văn phòng đã cấu hình.
  2. Kiểm tra bán kính cho phép (mặc định ≤ 50 mét).
  3. Kiểm tra ảnh selfie với ảnh mẫu hồ sơ nhân sự qua dịch vụ đối soát sinh trắc học.
  4. Ghi nhận thời gian Check-in/Check-out vào bảng attendance_logs kèm trạng thái "Đúng giờ" hoặc "Đi muộn".
- **Output:** Xác nhận chấm công thành công kèm mốc thời gian và vị trí chi nhánh.
- **Luồng Ngoại Lệ (Exception Handling):** Tọa độ GPS nằm ngoài bán kính cho phép (> 50m): Từ chối chấm công kèm thông báo "Bạn đang ở ngoài khu vực văn phòng".
- **RESTful API Endpoint:** `POST /api/operations/attendance/check-in`

##### FR-08.02 - Tổng Hợp Bảng Công & Xuất Dữ Liệu Tính Lương
- **Actor:** Phòng Nhân sự, Kế toán
- **Input:** Tháng, năm cần tổng hợp công, bộ phận phòng ban.
- **Logic Xử Lý:**
  1. Truy vấn toàn bộ dữ liệu chấm công trong tháng của nhân viên.
  2. Tính toán tổng số công chuẩn, số ngày nghỉ phép có lương/không lương, số lần đi muộn/về sớm.
  3. Xuất bảng dữ liệu tổng hợp phục vụ thanh toán tiền lương.
- **Output:** Bảng tổng hợp công chi tiết từng ngày và tệp Excel báo cáo.
- **Luồng Ngoại Lệ (Exception Handling):** Dữ liệu công chưa được chốt: Hiển thị cảnh báo bảng công đang mở.
- **RESTful API Endpoint:** `GET /api/operations/attendance/monthly-summary`


#### MODULE 09: PHÊ DUYỆT TÀI CHÍNH THU CHI 3 CẤP & VIETQR NAPAS
*Mục tiêu Epic:* Quy trình kiểm soát chi phí chặt chẽ, phê duyệt trực tuyến và đối soát thanh toán tự động

##### FR-09.01 - Quy Trình Tạo & Phê Duyệt Phiếu Chi 3 Cấp
- **Actor:** Cấp 1: Nhân viên tạo đề xuất -> Cấp 2: Trưởng phòng kiểm duyệt -> Cấp 3: Giám đốc/Kế toán trưởng duyệt chi
- **Input:** Số tiền chi, lý do chi, hóa đơn chứng từ đính kèm (.pdf/.png), tài khoản thụ hưởng.
- **Logic Xử Lý:**
  1. Nhân viên tạo phiếu đề xuất chi tiền, đính kèm hóa đơn chứng từ.
  2. Hệ thống chuyển phiếu sang trạng thái "Chờ Trưởng phòng duyệt", gửi thông báo push notification.
  3. Trưởng phòng kiểm tra tính hợp lý và bấm "Duyệt" -> Phiếu chuyển sang "Chờ Lãnh đạo phê duyệt".
  4. Giám đốc duyệt chi -> Kế toán thực hiện chi tiền và sinh mã VietQR Napas để chuyển khoản tự động.
- **Output:** Phiếu chi chuyển sang trạng thái "Đã thanh toán", tiền trừ vào sổ quỹ.
- **Luồng Ngoại Lệ (Exception Handling):** Cấp 2 hoặc Cấp 3 bấm "Từ chối": Phiếu chuyển sang trạng thái "Bị từ chối" kèm lý do bắt buộc và hoàn về cho người lập.
- **RESTful API Endpoint:** `POST /api/operations/approvals, PATCH /api/operations/approvals/:id`

##### FR-09.02 - Tích Hợp Thanh Toán VietQR Tự Động Đối Soát Gạch Nợ
- **Actor:** Hệ thống, Kế toán
- **Input:** Mã giao dịch, số tiền thanh toán, nội dung chuyển khoản.
- **Logic Xử Lý:**
  1. Sinh mã QR động chuẩn VietQR Napas 24/7 chứa mã hóa hóa đơn.
  2. Khách hàng hoặc đối tác quét mã chuyển khoản qua ứng dụng ngân hàng.
  3. Webhook ngân hàng bắn thông báo biến động số dư về API hệ thống.
  4. Hệ thống đối soát mã hóa đơn trong nội dung chuyển tiền, tự động cập nhật hóa đơn sang "Đã thanh toán" trong 1 giây mà không cần con người can thiệp.
- **Output:** Hóa đơn được gạch nợ tự động, sinh biên lai điện tử gửi email khách hàng.
- **Luồng Ngoại Lệ (Exception Handling):** Số tiền chuyển khoản không khớp với giá trị hóa đơn: Ghi nhận trạng thái "Thanh toán thiếu/thừa" và báo động cho kế toán xử lý thủ công.
- **RESTful API Endpoint:** `POST /api/finance/vietqr/webhook`


#### MODULE 10: SỔ QUỸ THU CHI & QUẢN TRỊ DÒNG TIỀN DOANH NGHIỆP
*Mục tiêu Epic:* Quản lý sổ quỹ tiền mặt, tài khoản ngân hàng và báo cáo dòng tiền thời gian thực

##### FR-10.01 - Quản Lý Sổ Quỹ Tiền Mặt & Tài Khoản Ngân Hàng
- **Actor:** Kế toán trưởng, Giám đốc tài chính (CFO)
- **Input:** Kỳ báo cáo, bộ lọc quỹ tiền mặt hoặc tài khoản ngân hàng.
- **Logic Xử Lý:**
  1. Truy vấn các giao dịch thu chi đã được phê duyệt trong kỳ.
  2. Tính toán số dư đầu kỳ, tổng phát sinh tăng, tổng phát sinh giảm và số dư cuối kỳ.
  3. Đối chiếu số liệu với sao kê ngân hàng điện tử.
- **Output:** Sổ quỹ thu chi chi tiết từng giao dịch và số dư tồn quỹ khả dụng.
- **Luồng Ngoại Lệ (Exception Handling):** Chênh lệch số dư sổ sách và thực tế: Bật cảnh báo điều chỉnh sổ quỹ.
- **RESTful API Endpoint:** `GET /api/finance/cashflow`


#### MODULE 11: SÀN GIAO THƯƠNG B2B & QUẢN LÝ GIAN HÀNG SẢN PHẨM
*Mục tiêu Epic:* Đăng tải sản phẩm, quản lý danh mục hàng hóa và xúc tiến thương mại giữa các doanh nghiệp

##### FR-11.01 - Đăng Tải & Quản Lý Sản Phẩm Doanh Nghiệp (Marketplace)
- **Actor:** Đại diện doanh nghiệp, Nhân viên bán hàng
- **Input:** Tên sản phẩm, ngành hàng, giá niêm yết, giá ưu đãi B2B, đơn vị tính, mô tả chi tiết, hình ảnh minh họa (.png, .jpg).
- **Logic Xử Lý:**
  1. Kiểm tra thông tin sản phẩm và nén ảnh tự động trước khi lưu trữ vào bucket MinIO.
  2. Thêm mới bản ghi vào bảng products với thông tin doanh nghiệp sở hữu.
  3. Niêm yết sản phẩm lên Sàn giao thương B2B ViOne Marketplace cho toàn bộ cộng đồng tiếp cận.
- **Output:** Sản phẩm được phê duyệt và hiển thị trực tiếp trên sàn thương mại B2B.
- **Luồng Ngoại Lệ (Exception Handling):** Ảnh tải lên vượt quá dung lượng cho phép (> 10MB): Báo lỗi kích thước tệp.
- **RESTful API Endpoint:** `POST /api/marketplace/products, GET /api/marketplace/products`


#### MODULE 12: QUẢN LÝ CƠ HỘI GIAO THƯƠNG & MỜI THẦU B2B
*Mục tiêu Epic:* Đăng tin tìm kiếm nhà cung cấp, mời thầu và kết nối cung cầu chuỗi giá trị

##### FR-12.01 - Đăng Tin Nhu Cầu Mua Hàng & Mời Thầu (B2B Demand & RFQ)
- **Actor:** Lãnh đạo doanh nghiệp, Trưởng phòng mua hàng
- **Input:** Tiêu đề nhu cầu, lĩnh vực ngành nghề, ngân sách dự kiến, thời hạn nhận báo giá, yêu cầu tiêu chuẩn kỹ thuật.
- **Logic Xử Lý:**
  1. Kiểm tra tính xác thực của thông tin doanh nghiệp đăng tin.
  2. Lưu trữ nhu cầu vào bảng opportunities với phân loại "Tìm nhà cung cấp".
  3. Trợ lý AI tự động quét từ khóa và gửi thông báo gợi ý đến các doanh nghiệp cung ứng phù hợp trong hệ thống.
- **Output:** Tin mời thầu được phát sóng trên bảng tin giao thương.
- **Luồng Ngoại Lệ (Exception Handling):** Hạn nhận báo giá trước ngày hiện tại: Báo lỗi thời hạn không hợp lệ.
- **RESTful API Endpoint:** `POST /api/opportunities`


#### MODULE 13: QUẢN LÝ SỰ KIỆN DOANH NGHIỆP & QR CHECK-IN ĐIỂM DANH
*Mục tiêu Epic:* Khởi tạo hội thảo xúc tiến thương mại, bán vé và quét mã QR điểm danh tại quầy lễ tân

##### FR-13.01 - Khởi Tạo & Quản Lý Sự Kiện Doanh Nghiệp
- **Actor:** Ban tổ chức, Quản trị viên
- **Input:** Tên sự kiện, thời gian bắt đầu/kết thúc, địa điểm tổ chức, sơ đồ khán phòng, số lượng vé tối đa, giá vé (hoặc miễn phí).
- **Logic Xử Lý:**
  1. Kiểm tra lịch tổ chức không bị trùng lặp phòng hội nghị.
  2. Lưu trữ sự kiện vào bảng events, tự động sinh trang đăng ký tham dự công khai.
  3. Thiết lập chính sách vé và sơ đồ ghế ngồi.
- **Output:** Sự kiện được công bố, mở cổng đăng ký vé cho các doanh nghiệp.
- **Luồng Ngoại Lệ (Exception Handling):** Số lượng vé vượt quá sức chứa địa điểm: Cảnh báo vượt quá tải trọng hội trường.
- **RESTful API Endpoint:** `POST /api/events, GET /api/events`

##### FR-13.02 - Quét Mã QR Check-in Điểm Danh Khách Mời Tức Thì
- **Actor:** Lễ tân, Ban tổ chức sự kiện
- **Input:** Mã QR trên vé điện tử của khách mời qua camera hoặc đầu đọc mã vạch.
- **Logic Xử Lý:**
  1. Giải mã payload trong mã QR để trích xuất vé ID và mã khách mời.
  2. Kiểm tra tính hợp lệ của vé trong bảng event_registrations.
  3. Nếu vé hợp lệ và chưa điểm danh: Cập nhật trạng thái "Đã check-in" kèm mốc thời gian thực, hiển thị thông tin chào mừng C-Level trên màn hình lễ tân.
  4. Nếu vé đã được sử dụng trước đó: Báo động đỏ cảnh báo vé trùng lặp.
- **Output:** Xác nhận check-in thành công kèm số ghế ngồi của khách.
- **Luồng Ngoại Lệ (Exception Handling):** Vé không tồn tại hoặc đã check-in trước đó: Báo lỗi vé không hợp lệ.
- **RESTful API Endpoint:** `POST /api/events/checkin`


#### MODULE 14: QUẢN LÝ CUỘC GẶP KẾT NỐI DOANH NHÂN 1-ON-1
*Mục tiêu Epic:* Đặt lịch hẹn làm việc, kết nối đối tác chiến lược và biên bản cuộc gặp

##### FR-14.01 - Đặt Lịch Hẹn & Phê Duyệt Cuộc Gặp 1-1 (One-on-One Meetings)
- **Actor:** Lãnh đạo doanh nghiệp, Hội viên C-Level
- **Input:** Đối tác cần gặp, chủ đề trao đổi, thời gian đề xuất, địa điểm (Online hoặc Trực tiếp).
- **Logic Xử Lý:**
  1. Kiểm tra lịch rảnh của cả hai bên để tránh xung đột lịch trình.
  2. Tạo bản ghi cuộc gặp trong bảng meetings với trạng thái "Chờ xác nhận".
  3. Gửi thông báo trực tiếp đến đối tác kèm lựa chọn "Đồng ý" hoặc "Đề xuất giờ khác".
  4. Khi đối tác đồng ý: Tự động thêm vào lịch làm việc trên điện thoại của cả hai bên.
- **Output:** Lịch hẹn được xác lập thành công.
- **Luồng Ngoại Lệ (Exception Handling):** Đối tác từ chối cuộc hẹn: Cập nhật trạng thái và thông báo lý do.
- **RESTful API Endpoint:** `POST /api/meetings, PATCH /api/meetings/:id`


#### MODULE 15: HỘP THƯ ĐA KÊNH & CHAT TRỰC TIẾP MESSENGER
*Mục tiêu Epic:* Hệ thống nhắn tin trao đổi kinh doanh thời gian thực, mã hóa đầu cuối giữa các CEO

##### FR-15.01 - Nhắn Tin Trao Đổi Kinh Doanh Trực Tiếp & Chat Nhóm
- **Actor:** Toàn bộ người dùng được phân quyền
- **Input:** ID người nhận hoặc ID nhóm, nội dung văn bản, tệp đính kèm, hình ảnh.
- **Logic Xử Lý:**
  1. Mã hóa nội dung tin nhắn trước khi truyền qua kênh bảo mật WebSocket Socket.IO.
  2. Lưu trữ tin nhắn vào bảng direct_messages hoặc group_messages.
  3. Phát sự kiện thời gian thực (event new_message) tới client người nhận.
  4. Nếu người nhận đang offline: Tự động kích hoạt thông báo đẩy (Push Notification) qua dịch vụ Apple APNs hoặc Google FCM.
- **Output:** Tin nhắn hiển thị tức thì trên cửa sổ trò chuyện của hai bên.
- **Luồng Ngoại Lệ (Exception Handling):** Tệp đính kèm chứa mã độc hoặc vượt quá 25MB: Chặn tải lên.
- **RESTful API Endpoint:** `POST /api/connect-app/dm/messages, WebSocket event: message:send`


#### MODULE 16: TRÍ TUỆ NHÂN TẠO VIONE AI COPILOT 5.0
*Mục tiêu Epic:* 6 Năng lực AI chuyên biệt: Đàm thoại điều hành, OCR danh thiếp, nhập liệu Excel, soạn hợp đồng, gợi ý đối tác và giám sát tải

##### FR-16.01 - Trợ Lý AI Copilot Đàm Thoại Điều Hành & Báo Cáo Doanh Nghiệp
- **Actor:** CEO, Ban Lãnh Đạo C-Level
- **Input:** Câu lệnh giọng nói hoặc văn bản tự nhiên (Ví dụ: "Tóm tắt doanh thu tháng này và công nợ khách hàng lớn nhất").
- **Logic Xử Lý:**
  1. Tiếp nhận câu hỏi và chuyển văn bản qua bộ xử lý ngôn ngữ tự nhiên NLP.
  2. Xác thực quyền dữ liệu của người hỏi (chỉ truy vấn dữ liệu trong phạm vi tenant được phép).
  3. Tự động sinh câu lệnh truy vấn CSDL an toàn (Text-to-SQL an toàn) để trích xuất số liệu thực tế.
  4. Tổng hợp thông tin và định dạng câu trả lời súc tích theo văn phong C-Level.
  5. Ghi nhật ký vào bảng ai_audit_logs.
- **Output:** Bản tóm tắt số liệu điều hành kèm biểu đồ và gợi ý hành động tiếp theo.
- **Luồng Ngoại Lệ (Exception Handling):** Câu hỏi yêu cầu dữ liệu vượt quá quyền hạn: Trả lời "Bạn không có quyền truy cập dữ liệu tài chính này".
- **RESTful API Endpoint:** `POST /api/ai/chat`

##### FR-16.02 - Quét & Nhận Diện Danh Thiếp OCR AI Tự Động Nhập CRM
- **Actor:** Sales Executive, Lãnh đạo
- **Input:** Ảnh chụp danh thiếp giấy từ camera hoặc tệp ảnh (.jpg, .png).
- **Logic Xử Lý:**
  1. Tiếp nhận hình ảnh và tiền xử lý (cân chỉnh góc nghiêng, tăng độ tương phản).
  2. Gọi mô hình OCR nhận diện ký tự quang học trích xuất toàn bộ text trên danh thiếp.
  3. Ứng dụng mô hình AI phân loại thông tin thành các trường cấu trúc: Họ tên, Chức vụ, Tên công ty, Số điện thoại, Email, Địa chỉ, Website.
  4. Hiển thị form xem trước cho người dùng xác nhận và lưu thẳng vào hệ thống CRM.
- **Output:** Hồ sơ khách hàng mới được tạo tự động chỉ sau 2 giây quét ảnh.
- **Luồng Ngoại Lệ (Exception Handling):** Ảnh quá mờ không đọc được chữ: Báo lỗi "Ảnh mờ, vui lòng chụp lại danh thiếp".
- **RESTful API Endpoint:** `POST /api/ai/ocr-business-card`


#### MODULE 17: KHO TÀI LIỆU SỐ DOANH NGHIỆP & VĂN BẢN MẪU
*Mục tiêu Epic:* Quản trị văn bản số, hợp đồng mẫu, tài liệu đào tạo và phân quyền truy cập

##### FR-17.01 - Lưu Trữ & Phân Quyền Tài Liệu Số (Document Management)
- **Actor:** Admin, Văn phòng doanh nghiệp
- **Input:** Tệp tài liệu (.pdf, .docx, .xlsx), thư mục lưu trữ, quyền xem/sửa.
- **Logic Xử Lý:**
  1. Kiểm tra dung lượng và định dạng tệp tải lên.
  2. Tải tệp lên kho lưu trữ MinIO/S3 với đường dẫn phân cấp theo tenant.
  3. Lưu trữ metadata vào bảng documents kèm cấu hình phân quyền truy cập.
  4. Cung cấp liên kết tải xuống an toàn có thời hạn (Signed URL).
- **Output:** Tài liệu được lưu trữ và lập chỉ mục tìm kiếm toàn văn.
- **Luồng Ngoại Lệ (Exception Handling):** Người dùng không có quyền truy cập tài liệu mật: Chặn tải tệp.
- **RESTful API Endpoint:** `POST /api/documents, GET /api/documents`


#### MODULE 18: BIỂU QUYẾT SỐ & KHẢO SÁT DOANH NGHIỆP C-LEVEL
*Mục tiêu Epic:* Bỏ phiếu biểu quyết đại hội cổ đông, lấy ý kiến ban điều hành minh bạch, tức thời

##### FR-18.01 - Khởi Tạo & Tham Gia Biểu Quyết Số Trực Tuyến (Digital Voting)
- **Actor:** Chủ tịch, Ban Kiểm Soát, Thành viên biểu quyết
- **Input:** Nội dung biểu quyết, các phương án lựa chọn, thời gian bắt đầu/kết thúc, trọng số phiếu.
- **Logic Xử Lý:**
  1. Khởi tạo phiên biểu quyết trong bảng voting_sessions.
  2. Thành viên đăng nhập và thực hiện bỏ phiếu xác thực bằng mật khẩu hoặc sinh trắc học.
  3. Hệ thống ghi nhận phiếu bầu vào bảng votes với cơ chế mã hóa chống sửa đổi kết quả.
  4. Tự động kiểm phiếu và công bố tỷ lệ biểu quyết thời gian thực trên màn hình lớn.
- **Output:** Kết quả biểu quyết minh bạch kèm biên bản kiểm phiếu tự động.
- **Luồng Ngoại Lệ (Exception Handling):** Một tài khoản cố tình bỏ phiếu lần thứ 2: Hệ thống từ chối và thông báo "Bạn đã thực hiện biểu quyết".
- **RESTful API Endpoint:** `POST /api/voting, POST /api/voting/:id/vote`


#### MODULE 19: QUẢN TRỊ NỀN TẢNG, MA TRẬN PHÂN QUYỀN RBAC 7X6 & MULTI-TENANT
*Mục tiêu Epic:* Quản lý ma trận phân quyền 7 nhóm quyền x 6 thao tác, cách ly dữ liệu nhiều doanh nghiệp

##### FR-19.01 - Cấu Hình Ma Trận Phân Quyền 7 Nhóm Quyền x 6 Thao Tác (RBAC Matrix)
- **Actor:** System Admin, Quản trị viên cấp cao
- **Input:** Module chức năng (9 module), Nhóm vai trò (CEO, COO, CFO, Sales Manager, Admin, Staff, Partner), Thao tác (Xem, Tạo, Sửa, Xóa, Duyệt, Xuất).
- **Logic Xử Lý:**
  1. Hệ thống hiển thị ma trận lưới phân quyền trực quan tại /platform/permissions.
  2. Quản trị viên bật/tắt các ô checkbox quyền tương ứng cho từng vai trò.
  3. Lưu trữ cấu hình phân quyền vào CSDL bảng role_permissions và đồng bộ vào bộ nhớ đệm phân quyền của NestJS Guards.
  4. Áp dụng hiệu lực tức thời cho mọi phiên đăng nhập của người dùng thuộc vai trò đó.
- **Output:** Ma trận quyền được lưu trữ, kiểm soát chặt chẽ từng hành động nhỏ nhất của người dùng.
- **Luồng Ngoại Lệ (Exception Handling):** Tự ý xóa quyền Quản trị của chính mình: Chặn thao tác để tránh khóa hệ thống.
- **RESTful API Endpoint:** `POST /api/platform/permissions/matrix, GET /api/platform/permissions/matrix`

##### FR-19.02 - Quản Trị Kiến Trúc Đa Khách Thuê (Multi-Tenant Isolation)
- **Actor:** System Admin
- **Input:** Mã định danh tenant (tenant_id), cấu hình giới hạn tài nguyên (storage, user limit).
- **Logic Xử Lý:**
  1. Mọi truy vấn CSDL đều bắt buộc áp dụng bộ lọc tenant_id = current_tenant_id qua Prisma Middleware.
  2. Tách biệt hoàn toàn kho lưu trữ tệp trên MinIO/S3 theo tiền tố tenant.
  3. Đảm bảo dữ liệu kinh doanh của doanh nghiệp này tuyệt đối không thể bị truy cập bởi doanh nghiệp khác.
- **Output:** Dữ liệu được cách ly an toàn 100% giữa các tổ chức.
- **Luồng Ngoại Lệ (Exception Handling):** Cố tình truy vấn chéo tenant: Trả về lỗi 403 Forbidden và kích hoạt ghi log cảnh báo an ninh.
- **RESTful API Endpoint:** `POST /api/platform/tenants`


#### MODULE 20: CÀI ĐẶT HỆ THỐNG, NHẬN DIỆN THƯƠNG HIỆU & TÍCH HỢP
*Mục tiêu Epic:* Tùy biến tên miền, logo doanh nghiệp, hotline, slogan và cấu hình cổng dịch vụ thứ ba

##### FR-20.01 - Tùy Biến Thương Hiệu & Cài Đặt Hệ Thống CRM
- **Actor:** Admin doanh nghiệp
- **Input:** Website chính hệ thống (websiteUrl), Hotline hỗ trợ, Slogan thương hiệu, Logo tải lên (.png).
- **Logic Xử Lý:**
  1. Kiểm tra tính hợp lệ của đường dẫn URL và số hotline.
  2. Tải logo lên bucket lưu trữ và cập nhật cấu hình hệ thống trong bảng system_settings.
  3. Lưu trữ bền vững vào localStorage và phát sự kiện association-changed đồng bộ giao diện toàn hệ thống trong thời gian thực.
  4. Cập nhật thanh điều hướng Sidebar và trang đăng nhập theo thương hiệu riêng của doanh nghiệp.
- **Output:** Giao diện hệ thống cập nhật nhận diện thương hiệu tức thì.
- **Luồng Ngoại Lệ (Exception Handling):** Định dạng logo không đúng chuẩn: Yêu cầu chọn tệp ảnh PNG/SVG.
- **RESTful API Endpoint:** `POST /api/settings/branding, GET /api/settings`


#### MODULE 21: NHẬT KÝ KIỂM TOÁN & AI AUDIT LOG (SECURITY & COMPLIANCE)
*Mục tiêu Epic:* Ghi nhận toàn bộ hành vi người dùng, lịch sử gọi AI và kiểm soát an ninh ISO/IEC 27001

##### FR-21.01 - Nhật Ký Kiểm Toán Hoạt Động & Kiểm Soát An Ninh (Audit Trail)
- **Actor:** Admin, Bộ phận An ninh mạng, Kiểm toán nội bộ
- **Input:** Bộ lọc thời gian, loại hành động (Đăng nhập, Tạo mới, Sửa, Xóa, Xuất dữ liệu), người thực hiện.
- **Logic Xử Lý:**
  1. Mọi yêu cầu HTTP thay đổi trạng thái (POST, PUT, DELETE) tự động được bắt bởi NestJS AuditInterceptor.
  2. Trích xuất địa chỉ IP, User-Agent, ID người dùng, payload và phản hồi.
  3. Ghi bản ghi bất biến vào bảng audit_logs với cơ chế cấm xóa sửa.
  4. Cung cấp màn hình tra cứu kiểm toán để phục vụ thanh tra an toàn thông tin.
- **Output:** Bảng nhật ký kiểm toán minh bạch, phục vụ truy vết sự cố.
- **Luồng Ngoại Lệ (Exception Handling):** Cố tình xóa sửa nhật ký kiểm toán: Hệ thống từ chối mọi câu lệnh xóa bảng audit_logs.
- **RESTful API Endpoint:** `GET /api/platform/audit-logs`


#### MODULE 22: XÁC THỰC DI ĐỘNG & ĐĂNG KÝ TÀI KHOẢN IN-APP
*Mục tiêu Epic:* Đăng ký và đăng nhập tức thì ngay trong ứng dụng di động, không redirect ra ngoài

##### FR-22.01 - Đăng Ký Tài Khoản In-App Đa Phương Thức (Email & SĐT)
- **Actor:** Người dùng mới, Doanh nhân cài app
- **Input:** Họ và tên, Email hoặc Số điện thoại, Tên công ty/Doanh nghiệp, Mật khẩu, Xác nhận mật khẩu.
- **Logic Xử Lý:**
  1. Người dùng chọn nút "Tạo tài khoản mới" ngay tại màn hình đăng nhập in-app (không chuyển hướng ra web landing).
  2. Kiểm tra tính hợp lệ dữ liệu nhập liệu trên client và gửi yêu cầu đăng ký lên backend.
  3. Hệ thống khởi tạo tài khoản mới trong CSDL, tự động sinh hồ sơ danh thiếp số ban đầu.
  4. Tự động lưu phiên xác thực vào AsyncStorage và đưa người dùng thẳng vào Trang chủ ứng dụng.
- **Output:** Tài khoản được kích hoạt và đăng nhập thành công vào app di động.
- **Luồng Ngoại Lệ (Exception Handling):** Email hoặc SĐT đã tồn tại: Báo lỗi "Tài khoản đã tồn tại, vui lòng đăng nhập".
- **RESTful API Endpoint:** `POST /api/auth/register`


#### MODULE 23: TRANG CHỦ DOANH NHÂN & THẺ HỘI VIÊN VUỐT TAY XUỐNG
*Mục tiêu Epic:* Dashboard điều hành di động, Thẻ Doanh nhân NFC và Bottom Sheet vuốt tay mượt mà

##### FR-23.01 - Tương Tác Thẻ Doanh Nhân Mở Bottom Sheet Bo Tròn 36px Vuốt Tay
- **Actor:** Lãnh đạo doanh nghiệp sử dụng Mobile App
- **Input:** Thao tác chạm (Tap) vào thẻ doanh nhân trên màn hình chính; Cử chỉ vuốt ngón tay xuống (Swipe Down).
- **Logic Xử Lý:**
  1. Khi người dùng chạm vào Thẻ Doanh Nhân mạ vàng tại trang chủ, hệ thống kích hoạt Bottom Sheet trượt mượt mà từ dưới lên.
  2. Giao diện được bo tròn cong 36px sang trọng, viền vàng champagne, hiển thị mã QR định danh và các phím tắt chia sẻ.
  3. Tích hợp bộ điều khiển cử chỉ PanResponder: Người dùng có thể đặt ngón tay và vuốt nhẹ xuống dưới để đóng popup tự nhiên tương tự giao diện iOS gốc cao cấp.
- **Output:** Bottom Sheet mở/đóng mượt mà theo thao tác chạm và vuốt tay.
- **Luồng Ngoại Lệ (Exception Handling):** Vuốt không đủ khoảng cách ngưỡng (< 50px): Tự động nảy ngược trở lại vị trí mở ban đầu.
- **RESTful API Endpoint:** `In-app Component: MemberCardBottomSheet.tsx`


#### MODULE 24: TRUNG TÂM HÀNH ĐỘNG 1-CHẠM VIONE MẠ VÀNG (VACTIONSHEET)
*Mục tiêu Epic:* Nút tròn V trung tâm mạ vàng nổi bật mở bảng điều khiển siêu tốc các tác vụ lãnh đạo

##### FR-24.01 - Kích Hoạt Nút ViOne Trung Tâm Mở VActionSheet
- **Actor:** Doanh nhân sử dụng ứng dụng di động
- **Input:** Chạm vào nút tròn ViOne dập nổi 3D vector vàng kim champagne ở giữa thanh điều hướng đáy.
- **Logic Xử Lý:**
  1. Hệ thống bật bảng điều khiển VActionSheet nổi với hiệu ứng làm mờ nền kính Obsidian.
  2. Cung cấp 6 lối tắt hành động siêu tốc: Quét danh thiếp OCR, Chấm công định vị GPS, Phê duyệt chi tiền, Đăng nhu cầu B2B, Tạo cuộc hẹn 1-1, Gọi trợ lý AI Copilot.
  3. Chạm vào bất kỳ nút nào sẽ chuyển hướng ngay đến modal nghiệp vụ tương ứng.
- **Output:** Menu hành động 1-chạm xuất hiện tức thì với hiệu ứng đổ bóng phát quang kép.
- **Luồng Ngoại Lệ (Exception Handling):** Chạm vào vùng ngoài bảng điều khiển: Tự động đóng action sheet mượt mà.
- **RESTful API Endpoint:** `In-app Component: VActionSheet.tsx`


#### MODULE 25: MẠNG LƯỚI ĐỐI TÁC, STORIES 24H & QUÉT DANH THIẾP OCR
*Mục tiêu Epic:* Kết nối cộng đồng doanh nhân, chia sẻ khoảnh khắc kinh doanh 24h và số hóa danh thiếp giấy

##### FR-25.01 - Bản Tin Khoảnh Khắc Doanh Nhân 24 Giờ (B2B Stories Strip)
- **Actor:** Doanh nhân, Hội viên mạng lưới
- **Input:** Ảnh chụp hoạt động kinh doanh, nội dung chú thích ngắn, thời lượng hiển thị 24h.
- **Logic Xử Lý:**
  1. Người dùng đăng ảnh khoảnh khắc lên dải Stories tại đầu tab Network.
  2. Hệ thống nén ảnh và gán thời hạn hết hạn sau đúng 24 giờ kể từ thời điểm đăng.
  3. Các đối tác trong mạng lưới chạm vào avatar để xem trình chiếu toàn màn hình câu chuyện của doanh nghiệp.
- **Output:** Story hiển thị trên dải tin 24h và tự động ẩn khi hết hạn.
- **Luồng Ngoại Lệ (Exception Handling):** Hết hạn 24 giờ: Chuyển story vào kho lưu trữ cá nhân, không hiển thị công khai.
- **RESTful API Endpoint:** `POST /api/connect-app/moments/story, GET /api/connect-app/moments/stories`


#### MODULE 26: HỒ SƠ DANH TÍNH SỐ, DANH THIẾP TITANIUM 3D & CHIA SẺ CHẠM NFC
*Mục tiêu Epic:* Danh thiếp số 3D lật mặt sang trọng, chạm NFC một chạm và bảo vệ quyền riêng tư C-Level

##### FR-26.01 - Danh Thiếp Số Titanium 3D Lật Mặt & Chia Sẻ NFC Một Chạm
- **Actor:** Lãnh đạo doanh nghiệp
- **Input:** Thao tác chạm để lật thẻ 3D; đưa điện thoại lại gần thiết bị hỗ trợ NFC.
- **Logic Xử Lý:**
  1. Thẻ danh thiếp số hiển thị với hiệu ứng 3D lật mặt trước và mặt sau mượt mà.
  2. Mặt trước hiển thị ảnh chân dung, họ tên, chức vụ, tên công ty và huy hiệu xác thực.
  3. Mặt sau hiển thị mã QR định danh và thông tin kết nối nhanh (Gọi điện, Mail, Viber, WhatsApp, Telegram).
  4. Khi chạm vào điện thoại đối tác qua chip NFC, tự động mở trang danh thiếp công khai và tải danh bạ vCard (.vcf) vào danh bạ máy đối tác chỉ trong 1 giây.
- **Output:** Đối tác nhận được toàn bộ thông tin liên hệ mà không cần cài đặt ứng dụng.
- **Luồng Ngoại Lệ (Exception Handling):** Thiết bị đối tác không có chip NFC: Quét mã QR thay thế mượt mà.
- **RESTful API Endpoint:** `GET /card/:code, GET /api/cards/vcard/:code`


#### MODULE 27: GIẢI PHÁP CÀI ĐẶT PWA 1-CHẠM TRÊN IOS (APPLE WEBCLIP PROFILE)
*Mục tiêu Epic:* Cài đặt trực tiếp ứng dụng ViOne Connect lên Màn hình chính iPhone/iPad tương tự file APK Android

##### FR-27.01 - Cài Đặt PWA Độc Quyền Qua File Cấu Hình Apple (.mobileconfig)
- **Actor:** Người dùng thiết bị Apple iOS (iPhone/iPad)
- **Input:** Nhấp vào liên kết tải file vione_ios_install.mobileconfig từ trình duyệt Safari.
- **Logic Xử Lý:**
  1. Người dùng mở link tải file cấu hình chuẩn Apple Configuration Profile.
  2. Safari hiển thị hộp thoại: "Trang web này đang cố tải về một hồ sơ cấu hình. Cho phép?".
  3. Người dùng chọn "Cho phép" -> Mở Cài đặt máy -> "Đã tải về hồ sơ" -> Nhấn "Cài đặt".
  4. iOS tự động tạo biểu tượng ViOne Connect vàng kim ra Màn hình chính (Home Screen).
  5. Khi nhấp vào biểu tượng, ứng dụng khởi chạy ở chế độ Toàn màn hình Native (FullScreen), loại bỏ hoàn toàn thanh địa chỉ trình duyệt Safari.
- **Output:** Ứng dụng ViOne Connect được cài đặt ra màn hình chính tương tự như cài app từ App Store.
- **Luồng Ngoại Lệ (Exception Handling):** Tải bằng trình duyệt Chrome trên iOS: Hiển thị hướng dẫn chuyển sang mở bằng Safari để cài profile.
- **RESTful API Endpoint:** `Static Asset: /vione_ios_install.mobileconfig`


#### MODULE 28: PHÂN HỆ QUẢN TRỊ CỘNG ĐỒNG 2 KIỂU (B2B NETWORKING & COMPANY INTERNAL)
*Mục tiêu Epic:* Phân định logic hiển thị, cơ chế tương tác và bảo mật giữa 2 mô hình cộng đồng kèm quyền Quản trị viên/Chủ sở hữu chỉnh sửa thông tin cộng đồng

##### FR-28.01 - Phân Định Phân Hệ 2 Kiểu Cộng Đồng (B2B Networking vs Company Internal)
- **Actor:** Doanh nhân, Hội viên, Quản trị viên cộng đồng, Nhân viên nội bộ
- **Input:** Mã định danh cộng đồng (communityId), loại cộng đồng (community_type: b2b_networking | company_internal), vai trò thành viên (role).
- **Logic Xử Lý:**
  1. Hệ thống nạp dữ liệu cộng đồng từ bảng vba_communities và kiểm tra trường community_type.
  2. Nếu là b2b_networking: Kích hoạt tab Giao thương B2B, hiển thị nút "Đăng cơ hội kinh doanh" (Buy/Sell Leads), cho phép chia sẻ bài viết, chia sẻ sự kiện ngoài vào bảng tin cộng đồng qua ShareEventModal.
  3. Nếu là company_internal: Ẩn toàn bộ tính năng đăng cơ hội B2B thương mại tự do; kích hoạt luồng "Giao việc & Phân công nhiệm vụ", nút 1-chạm [⚡ TIẾN HÀNH NHẬN VIỆC] (claim task) trực tiếp trên bài đăng công việc, tích hợp liên kết giám sát tiến độ CRM và báo cáo nội bộ.
  4. Kiểm tra quyền thành viên: Người dùng chỉ được xem và tương tác trong cộng đồng nội bộ khi đã được ban quản trị phê duyệt làm thành viên chính thức (is_active = true).
- **Output:** Giao diện cộng đồng tự động render đúng các phím chức năng, biểu mẫu đăng bài và quyền hạn tương ứng theo từng mô hình.
- **Luồng Ngoại Lệ (Exception Handling):** Người dùng ngoài cố tình truy cập cộng đồng company_internal: Hệ thống chặn hiển thị và trả về cảnh báo "Cộng đồng nội bộ bảo mật, bạn cần yêu cầu quyền truy cập".
- **RESTful API Endpoint:** `GET /api/connect-app/communities/:id, GET /api/connect-app/communities`

##### FR-28.02 - Quyền Quản Trị Cộng Đồng & Chỉnh Sửa Thông Tin (Edit Community Modal)
- **Actor:** Admin / Owner cộng đồng (Ví dụ: Cộng đồng Gia đình ViOne có canEdit: true, role: "admin")
- **Input:** Dữ liệu chỉnh sửa gồm: Tên cộng đồng, Mô tả chi tiết, Ảnh đại diện (Avatar), Ảnh bìa (Cover Banner), Phân loại cộng đồng (b2b_networking / company_internal), Quy tắc tham gia.
- **Logic Xử Lý:**
  1. Kiểm tra quyền hạn của người dùng đối với cộng đồng (role === "admin" || role === "owner" hoặc canEdit === true).
  2. Nếu hợp lệ, hiển thị nút quản trị [⚙️ Chỉnh sửa cộng đồng] nổi bật trên trang chi tiết cộng đồng.
  3. Nhấp nút kích hoạt popup EditCommunityModal tải sẵn dữ liệu hiện tại của cộng đồng.
  4. Người dùng thay đổi thông tin, tải ảnh mới lên bucket lưu trữ MinIO/S3 và nhấn "Lưu thay đổi".
  5. Backend kiểm tra quyền xác thực, cập nhật bản ghi trong bảng vba_communities, đồng thời phát sự kiện realtime cập nhật giao diện người dùng.
- **Output:** Thông tin cộng đồng được cập nhật tức thì trên toàn hệ thống và ứng dụng di động.
- **Luồng Ngoại Lệ (Exception Handling):** Người dùng không có quyền admin: Nút chỉnh sửa bị ẩn hoàn toàn; backend trả về lỗi 403 Forbidden nếu cố tình gọi API.
- **RESTful API Endpoint:** `PATCH /api/connect-app/communities/:id, POST /api/connect-app/upload`


#### MODULE 29: QUY TRÌNH BÀY TỎ QUAN TÂM CƠ HỘI & HẸN GẶP TRAO ĐỔI B2B QUA CHAT
*Mục tiêu Epic:* Kết nối giao thương trực tiếp từ tin đăng cơ hội kinh doanh sang phòng chat riêng 1-1, trao đổi đề xuất hẹn gặp và tự động ghim lịch vào Trang chủ điều hành C-Level

##### FR-29.01 - Khởi Tạo Đề Xuất Hẹn Gặp B2B Từ Tin Đăng Cơ Hội
- **Actor:** Doanh nhân, Đối tác mua/bán, Nhà đầu tư
- **Input:** Bấm nút [📅 Nhắn tin hẹn gặp trao đổi cơ hội] tại chi tiết cơ hội B2B; Thời gian hẹn (meeting_time), Địa điểm / Hình thức (Gặp trực tiếp / Trực tuyến Google Meet / Zoom), Nội dung tóm tắt nhu cầu hợp tác.
- **Logic Xử Lý:**
  1. Hệ thống tiếp nhận thao tác, kiểm tra hoặc tự động tạo cuộc trò chuyện riêng 1-1 (Direct Chat Thread) giữa người quan tâm và chủ nhân bài đăng cơ hội.
  2. Mở hộp thoại ProposeOpportunityMeetingModal với thông tin cơ hội được nạp sẵn tự động.
  3. Người dùng chọn thời gian, địa điểm gặp gỡ và nhập lời mời trao đổi.
  4. Khi bấm gửi, hệ thống khởi tạo bản ghi đề xuất hẹn gặp trong CSDL, đồng thời gửi một tin nhắn định dạng thẻ tương tác đặc biệt OpportunityMeetingProposalCard vào phòng chat.
- **Output:** Thẻ đề xuất hẹn gặp hiển thị nổi bật trong khung chat với đầy đủ thông tin cơ hội, thời gian, địa điểm và hai nút hành động: [Đồng ý hẹn] và [Từ chối / Đổi giờ].
- **Luồng Ngoại Lệ (Exception Handling):** Chủ tin tự gửi hẹn gặp cho chính mình: Hệ thống cảnh báo "Bạn không thể gửi đề xuất hẹn gặp cho bài đăng của chính mình".
- **RESTful API Endpoint:** `POST /api/connect-app/inbox/messages, POST /api/connect-app/opportunities/:id/propose-meeting`

##### FR-29.02 - Xác Nhận Đề Xuất Hẹn Gặp & Tự Động Ghim Lịch Điều Hành Hôm Nay (Executive Home)
- **Actor:** Chủ bài đăng cơ hội (bên nhận đề xuất)
- **Input:** Thao tác bấm nút [Đồng ý hẹn] trên thẻ OpportunityMeetingProposalCard trong phòng chat.
- **Logic Xử Lý:**
  1. Hệ thống cập nhật trạng thái đề xuất thành accepted (Đã xác nhận).
  2. Tự động khởi tạo sự kiện lịch trình vào bảng vba_calendar_events / personal_agenda của cả hai bên.
  3. Tự động ghim lịch hẹn vào danh mục "Lịch trình hôm nay" tại màn hình chính ExecutiveHome của ứng dụng di động và Web CRM.
  4. Kích hoạt dịch vụ WebSocket gửi thông báo tức thời (Push Notification) đến điện thoại của người gửi đề xuất: "Đối tác đã chấp thuận lịch hẹn trao đổi cơ hội!".
- **Output:** Thẻ trong chat chuyển sang trạng thái "Đã chốt lịch hẹn"; lịch hẹn hiển thị đồng bộ trong Lịch trình hôm nay của cả 2 doanh nhân.
- **Luồng Ngoại Lệ (Exception Handling):** Cuộc hẹn đã bị hủy hoặc đối tác đã bấm từ chối trước đó: Hiển thị thông báo trạng thái cập nhật và vô hiệu hóa nút bấm.
- **RESTful API Endpoint:** `PATCH /api/connect-app/inbox/meeting-proposals/:id/accept`


#### MODULE 30: NHẬT KÝ GHI ÂM KHOẢNH KHẮC ĐIỀU HÀNH & KÝ ỨC GIỌNG NÓI (VOICE MOMENTS HISTORY)
*Mục tiêu Epic:* Thu âm tức thời các chỉ đạo điều hành, ý tưởng kinh doanh, cuộc họp đàm phán và lưu trữ vào CSDL kèm giao diện nghe lại trực tiếp (inline player) trên App di động

##### FR-30.01 - Thu Âm & Lưu Trữ Khoảnh Khắc Giọng Nói C-Level
- **Actor:** Lãnh đạo doanh nghiệp, Giám đốc điều hành
- **Input:** Nhấn nút micro ghi âm tại Trung tâm hành động VActionSheet hoặc widget ghi âm nhanh; luồng âm thanh định dạng audio/m4a, webm hoặc mp3; Tiêu đề/Ghi chú tóm tắt.
- **Logic Xử Lý:**
  1. Ứng dụng kích hoạt micro thiết bị thông qua MediaRecorder API hoặc React Native Audio Recorder.
  2. Hiển thị đồ thị sóng âm realtime (waveform animation) và đồng hồ đếm thời lượng ghi âm.
  3. Khi kết thúc, người dùng nhấn "Lưu bản ghi", file âm thanh được nén và tải lên kho lưu trữ MinIO/S3.
  4. Lưu thông tin metadata vào bảng CSDL vba_voice_moments_history gồm: user_id, audio_url, duration_seconds, file_size, tags, transcript_preview và thời gian tạo.
- **Output:** Bản ghi âm được lưu trữ bền vững với mã UUID duy nhất.
- **Luồng Ngoại Lệ (Exception Handling):** Quyền truy cập micro bị từ chối: Hiển thị hướng dẫn cấp quyền Micro trong Cài đặt thiết bị.
- **RESTful API Endpoint:** `POST /api/connect-app/voice-moments/upload, POST /api/connect-app/voice-moments`

##### FR-30.02 - Phân Mục Thứ 4 "Ghi Âm" & Trình Phát Âm Thanh Trực Tiếp (Inline Audio Player)
- **Actor:** Lãnh đạo C-Level, Quản trị viên
- **Input:** Chọn tab "Lịch sử" trên Trang chủ ExecutiveHome -> Chuyển sang phân mục thứ 4 "🎙️ Ghi âm" (bên cạnh Lịch sử công việc, Lịch sử cuộc gọi, Lịch sử duyệt).
- **Logic Xử Lý:**
  1. Hệ thống truy vấn danh sách các bản ghi âm từ bảng vba_voice_moments_history theo user_id hiện tại.
  2. Hiển thị danh sách bản ghi gồm: Tên đoạn ghi âm, Thời lượng (phút:giây), Ngày giờ thu âm, dung lượng tệp.
  3. Tích hợp Trình phát âm thanh trực tiếp (Inline Audio Player) với nút Play/Pause, thanh kéo tua âm thanh và điều chỉnh âm lượng.
  4. Cung cấp nút chia sẻ nội bộ hoặc tải tệp âm thanh gốc về máy.
- **Output:** Người dùng nghe lại toàn bộ các chỉ đạo bằng giọng nói ngay trên màn hình chính mà không cần mở ứng dụng ngoài.
- **Luồng Ngoại Lệ (Exception Handling):** Tệp âm thanh bị lỗi đường truyền: Tự động thử lại hoặc hiển thị tùy chọn tải lại bản ghi.
- **RESTful API Endpoint:** `GET /api/connect-app/voice-moments`


#### MODULE 31: TRỢ LÝ GIÁM ĐỐC AI COPILOT 5.0 ĐA TÁC VỤ & TÌM KIẾM GIỌNG NÓI
*Mục tiêu Epic:* Siêu trợ lý điều hành doanh nghiệp tích hợp đa mô hình ngôn ngữ lớn (LLM), truy vấn âm thanh bằng giọng nói, quét đối tác quanh đây và phân tích động kèm Evidence Cards

##### FR-31.01 - Tìm Kiếm Đoạn Ghi Âm Theo Lệnh Giọng Nói (Voice-Driven Audio Search)
- **Actor:** CEO, Lãnh đạo doanh nghiệp
- **Input:** Khẩu lệnh giọng nói hoặc văn bản tự nhiên (Ví dụ: "Tìm đoạn ghi âm tuần trước tôi nói về hợp đồng với đối tác Hòa Phát").
- **Logic Xử Lý:**
  1. Trợ lý AI nhận diện giọng nói qua Speech-to-Text (Whisper / Google STT).
  2. Trích xuất thực thể thời gian, từ khóa ngữ nghĩa và đối tượng nhắc tới.
  3. Truy vấn bảng vba_voice_moments_history kết hợp vector embedding nội dung transcript.
  4. Trả về đúng đoạn ghi âm khớp nhất kèm mốc thời gian phát chính xác.
- **Output:** Thẻ phát âm thanh trực tiếp hiển thị ngay trong hội thoại AI với nút nghe đúng vị trí được hỏi.
- **Luồng Ngoại Lệ (Exception Handling):** Không tìm thấy bản ghi âm phù hợp: AI phản hồi thông minh và gợi ý mở rộng khoảng thời gian tìm kiếm.
- **RESTful API Endpoint:** `POST /api/connect-app/ai/voice-search`

##### FR-31.02 - Quét Tìm Đối Tác & Người Dùng ViOne Quanh Đây Theo Bán Kính GPS
- **Actor:** Doanh nhân đang đi công tác, tham gia sự kiện triển lãm
- **Input:** Tọa độ GPS hiện tại (Latitude, Longitude), bán kính quét lựa chọn (1km, 5km, 10km, 20km).
- **Logic Xử Lý:**
  1. Người dùng bật tính năng "Tìm đối tác quanh đây" trên AI Copilot hoặc tab Network.
  2. Ứng dụng xin quyền vị trí và gửi tọa độ địa lý lên backend.
  3. Hệ thống sử dụng thuật toán tính khoảng cách không gian (PostGIS ST_DWithin / Haversine) quét danh sách người dùng ViOne đang bật chế độ kết nối xung quanh.
  4. Trả về danh sách đối tác gồm họ tên, công ty, ngành nghề kinh doanh, khoảng cách (ví dụ: cách bạn 350m) và bản đồ nhiệt trực quan.
- **Output:** Danh sách hồ sơ đối tác gần nhất kèm phím tắt chạm kết nối, gửi lời chào hoặc hẹn cà phê 1-chạm.
- **Luồng Ngoại Lệ (Exception Handling):** Người dùng tắt chia sẻ vị trí: Hệ thống bảo mật ẩn vị trí và chỉ hiển thị đối tác trong cùng thành phố/tỉnh.
- **RESTful API Endpoint:** `POST /api/connect-app/partners/nearby`

##### FR-31.03 - Phân Tích Động Cơ Hội Kinh Doanh Kèm Evidence Cards & Bắn Thông Báo Đa Tương Tác
- **Actor:** Giám đốc điều hành, Trưởng phòng kinh doanh
- **Input:** Yêu cầu phân tích phễu bán hàng, cơ hội B2B hoặc báo cáo tài chính.
- **Logic Xử Lý:**
  1. AI Copilot phân tích dữ liệu thực tế từ CRM và cơ hội giao thương B2B.
  2. Tự động sinh các thẻ bằng chứng dữ liệu trực quan (Evidence Cards) gồm số liệu tăng trưởng, bảng đối soát và biểu đồ mini.
  3. Đưa ra gợi ý hành động chiến lược (Actionable Insights).
  4. Hỗ trợ cơ chế bắn thông báo đa tương tác (Interactive Push Notifications) với các nút hành động nhanh ngay trên thông báo điện thoại (Duyệt ngay / Nhắn tin / Xem chi tiết).
- **Output:** Hội thoại tư vấn phân tích chuyên sâu kèm Evidence Cards và thông báo đẩy tương tác.
- **Luồng Ngoại Lệ (Exception Handling):** Dữ liệu chưa đủ chu kỳ phân tích: AI hiển thị cảnh báo mức độ tin cậy của dữ liệu và đề xuất nhập bổ sung.
- **RESTful API Endpoint:** `POST /api/ai/analyze-opportunities, POST /api/notifications/interactive-push`


#### MODULE 32: BẢNG ĐIỀU HÀNH LỊCH TRÌNH TÁC NGHIỆP HÔM NAY & DUYỆT HỒ SƠ C-LEVEL MOBILE (EXECUTIVE HOME & APPROVALS)
*Mục tiêu Epic:* Trung tâm điều hành di động hợp nhất toàn bộ lịch trình công việc, các cuộc hẹn đối tác B2B và phê duyệt hồ sơ giấy tờ mọi lúc mọi nơi cho lãnh đạo bận rộn

##### FR-32.01 - Lịch Trình Tác Nghiệp Hôm Nay (Today's Executive Agenda)
- **Actor:** CEO, Lãnh đạo doanh nghiệp
- **Input:** Mở màn hình chính ExecutiveHome trên App ViOne Connect.
- **Logic Xử Lý:**
  1. Hệ thống tự động truy vấn và tổng hợp 3 nguồn lịch trình trong ngày hôm nay:
     - Lịch họp nội bộ và công việc được giao từ module Quản lý công việc CRM.
     - Lịch hẹn gặp đối tác giao thương B2B đã được cả hai bên xác nhận (từ Module 29).
     - Sự kiện hội thảo, gala doanh nhân mà người dùng đã đăng ký vé QR.
  2. Hiển thị dạng dòng thời gian (Timeline) rõ ràng theo từng khung giờ: Sáng, Chiều, Tối.
  3. Nhấp vào mỗi thẻ lịch trình mở ngay chi tiết cuộc họp, phòng họp trực tuyến hoặc vị trí trên Google Maps.
- **Output:** Lịch trình hôm nay toàn diện, cập nhật theo thời gian thực không bỏ sót sự kiện.
- **Luồng Ngoại Lệ (Exception Handling):** Không có lịch trình trong ngày: Hiển thị thông điệp "Hôm nay bạn không có lịch trình nào, tận hưởng một ngày làm việc hiệu quả!".
- **RESTful API Endpoint:** `GET /api/connect-app/executive/today-agenda`

##### FR-32.02 - Trung Tâm Duyệt Hồ Sơ Nhanh Di Động (Approvals Mobile Sheet)
- **Actor:** Ban Giám Đốc, Kế toán trưởng, Trưởng bộ phận
- **Input:** Chạm vào biểu tượng "Duyệt hồ sơ" hoặc thẻ số lượng cần duyệt trên ExecutiveHome.
- **Logic Xử Lý:**
  1. Mở giao diện Approvals Mobile Sheet hiển thị danh sách các hồ sơ đang chờ ký duyệt: Đơn nghỉ phép nhân viên, Đề xuất chi tiền tạm ứng, Hóa đơn thanh toán, Hợp đồng kinh tế.
  2. Phân loại theo mức độ khẩn cấp (Khẩn cấp, Bình thường) và số tiền.
  3. Cung cấp 2 phím tắt hành động 1-chạm: [Phê duyệt ngay] (kèm mã PIN hoặc FaceID) và [Từ chối / Yêu cầu giải trình].
  4. Ghi nhận nhật ký kiểm toán và tự động đồng bộ trạng thái về Web CRM trong thời gian thực.
- **Output:** Hồ sơ được phê duyệt lập tức, thông báo tự động chuyển đến nhân viên đề xuất.
- **Luồng Ngoại Lệ (Exception Handling):** Không đủ hạn mức phê duyệt: Hiển thị thông báo chuyển hồ sơ lên cấp phê duyệt cao hơn (CEO/CFO).
- **RESTful API Endpoint:** `GET /api/connect-app/approvals/pending, POST /api/connect-app/approvals/:id/decide`


#### MODULE 33: BẮT TAY KẾT NỐI SONG PHƯƠNG QR THỜI GIAN THỰC & TRÌNH CHỈNH SỬA HỒ SƠ NATIVE PARITY
*Mục tiêu Epic:* Cơ chế kết nối song phương qua WebSocket khi quét QR, bộ công cụ cập nhật danh tính số C-Level thuần Native và Trợ lý AI Copilot đa năng

##### FR-33.01 - Bắt Tay Kết Nối Song Phương Thời Gian Thực (Bilateral QR Handshake Flow)
- **Actor:** Hai doanh nhân quét mã QR của nhau (Web PWA và Native Mobile)
- **Input:** Doanh nhân A quét mã QR của Doanh nhân B, gửi sự kiện WebSocket qr:connect.
- **Logic Xử Lý:**
  1. Doanh nhân A mở ScanQrModal quét mã QR của Doanh nhân B.
  2. Ứng dụng phát sự kiện WebSocket "qr:connect" tới ConnectAppGateway.
  3. Gateway nhận diện socket của Doanh nhân B và emit sự kiện "connection:incoming".
  4. Màn hình Doanh nhân B tự động hiển thị IncomingQrConnectionModal (Mobile) hoặc IncomingConnectionModal (Web) với thông tin hồ sơ của A.
  5. Doanh nhân B bấm [Đồng ý kết nối] -> phát "connection:respond" (accepted). Gateway cập nhật kết nối hai chiều trong CSDL, bắn thông báo xác nhận cho A và mở luồng chat 1-1.
- **Output:** Kết nối song phương xác lập thành công tức thì trên cả 2 thiết bị.
- **Luồng Ngoại Lệ (Exception Handling):** Doanh nhân B từ chối: Phát "connection:respond" (declined), đóng modal và không lưu kết nối.
- **RESTful API Endpoint:** `WS qr:connect, WS connection:incoming, WS connection:respond, WS connection:accepted`

##### FR-33.02 - Trình Chỉnh Sửa Hồ Sơ Cá Nhân Doanh Nhân Thuần Native (Native Edit Profile Parity)
- **Actor:** Doanh nhân thành viên C-Level
- **Input:** Bấm nút [Chỉnh sửa] trên màn hình ProfileScreen Native.
- **Logic Xử Lý:**
  1. Mở EditProfileModal thuần Native với đầy đủ 8 trường thông tin chuẩn Web: Họ tên hiển thị, Chức danh, Tên doanh nghiệp, Ngành nghề, Số điện thoại, Email, Website, Tiểu sử.
  2. Người dùng chỉnh sửa và bấm [Lưu thay đổi].
  3. Ứng dụng gọi API PATCH /users/profile (hoặc lưu offline cache AsyncStorage).
  4. Cập nhật hồ sơ trong AuthContext, đồng bộ danh thiếp số 3D Titanium và làm mới giao diện Profile tức thì.
- **Output:** Thông tin cá nhân và danh thiếp doanh nhân được cập nhật chuẩn xác 100%.
- **Luồng Ngoại Lệ (Exception Handling):** Dữ liệu không hợp lệ (email sai định dạng): Báo lỗi tại trường nhập liệu tương ứng.
- **RESTful API Endpoint:** `PATCH /api/users/profile, GET /api/users/me`

##### FR-33.03 - Trợ Lý AI Copilot Đa Năng Dynamic Nắm Trọn Vẹn Dữ Liệu Nền Tảng
- **Actor:** Toàn bộ người dùng hệ thống
- **Input:** Câu hỏi của người dùng về sự kiện, cộng đồng, tài khoản, cơ hội kinh doanh (Text hoặc Voice).
- **Logic Xử Lý:**
  1. Tiếp nhận câu hỏi tại ViOneVoiceAssistantModal (Mobile) hoặc ViOneVoiceAssistant (Web).
  2. Backend AiService phân tích ý định động, truy xuất CSDL thời gian thực: sự kiện đang diễn ra, danh sách cộng đồng đã tham gia, chỉ số kết nối tài khoản, cơ hội kinh doanh mới.
  3. Tổng hợp câu trả lời tự nhiên như Chief of Staff, kèm Evidence Cards và Suggested Actions 1-chạm.
  4. Giao diện modal tối ưu: Header không đè lấn sóng micro, Footer nhập liệu luôn cố định ở đáy.
- **Output:** Phản hồi thông thái, chính xác 100% dữ liệu nền tảng, không rập khuôn.
- **Luồng Ngoại Lệ (Exception Handling):** Mất kết nối mạng: Chuyển sang bộ dữ liệu fallback nội bộ thông minh.
- **RESTful API Endpoint:** `POST /api/ai/chat`

##### FR-33.04 - Cổng Thông Tin Website Chính Thức ViConnect (https://viconnect.vn/) Tại Màn Hình Đăng Nhập
- **Actor:** Khách vãng lai, Đối tác, Doanh nhân C-Level.
- **Input:** Chạm/Nhấp vào nút "Website chính thức" trên màn hình đăng nhập (Web PWA hoặc Mobile Native App).
- **Logic Xử Lý:**
  1. Giao diện đăng nhập khởi tạo nút liên kết tại Header với icon Globe và nhãn hiển thị: "Website chính thức".
  2. Khi người dùng nhấp:
     - Trên Web PWA: Mở tab mới của trình duyệt điều hướng an toàn tới `https://viconnect.vn/` (`target="_blank" rel="noopener noreferrer"`).
     - Trên Mobile Native App: Kích hoạt module `Linking.openURL('https://viconnect.vn/')` mở trình duyệt ngoại vi an toàn của thiết bị.
  3. Duy trì trạng thái phiên đăng nhập của ứng dụng mà không gây xung đột hay thoát app.
- **Output:** Người dùng truy cập trực tiếp Website chính thức ViConnect tìm hiểu giải pháp nền tảng.
- **Luồng Ngoại Lệ:** Thiết bị không có trình duyệt mặc định: Hiển thị thông báo hướng dẫn hoặc mở WebView nội bộ an toàn.
- **Client Route:** `/auth` (PWA) & `LoginScreen` (Native).

##### FR-33.05 - Hệ Thống Cấp Quyền & Đẩy Thông Báo Ra Màn Hình Khóa Thiết Bị (Lockscreen Push Notifications)
- **Actor:** Người dùng đã đăng nhập hệ sinh thái ViOne.
- **Input:** Tương tác cấp quyền thông báo hệ thống (Notification Permission); Các sự kiện thời gian thực phát sinh (Cuộc gọi đến, Tin nhắn mới, Bình luận mới, Yêu cầu kết nối, Chạm NFC, Cập nhật CRM).
- **Logic Xử Lý:**
  1. Khi người dùng truy cập: Component `NotificationPromptBanner` kiểm tra quyền `Notification.permission`. Nếu trạng thái là `default`, hiển thị banner mạ vàng Champagne Gold mời cấp quyền 1-chạm.
  2. Khi người dùng bấm "Bật thông báo ngay": Gọi `Notification.requestPermission()`. Nếu được cấp (`granted`), phát sự kiện `vione_notification_permission_changed` và kích hoạt Service Worker (`public/sw.js`).
  3. Service Worker cài đặt listener cho 2 sự kiện:
     - `push`: Tiếp nhận payload thông báo từ máy chủ hoặc local background worker.
     - `notificationclick`: Đóng thông báo và tự động `clients.focus()` hoặc `clients.openWindow(url)` điều hướng trực tiếp vào màn hình nghiệp vụ tương ứng (chat thread, cuộc gọi, moment detail).
  4. Trình phát âm thanh Web Audio Chime (`playNotificationChime`): Khởi tạo AudioContext phát sóng âm chuông ngân cho cuộc gọi (`call`), tin nhắn (`message`), và thông báo chung (`notification`).
  5. Hàm đẩy thông báo màn hình khóa `sendExternalNotification()`:
     - Gọi `navigator.serviceWorker.ready.then(reg => reg.showNotification(title, options))`.
     - Đính kèm mẫu rung phần cứng `vibrate: [400, 200, 400, 200, 400, 200, 400]` cho cuộc gọi hoặc `[200, 100, 200]` cho tin nhắn.
  6. Trung tâm quản trị & kiểm thử tại Tab Tôi: Card "Thông báo hệ thống & Cuộc gọi" hiển thị huy hiệu trạng thái trực tiếp, nút cấp quyền và nút "Gửi thông báo thử nghiệm" kiểm tra trực tiếp trên thiết bị.
- **Output:** Mọi cảnh báo cuộc gọi, tin nhắn, bình luận, kết nối được hiển thị ngay tức thì trên màn hình khóa và thanh trạng thái điện thoại kèm âm thanh và rung phản hồi.
- **Luồng Ngoại Lệ:** Người dùng chặn thông báo (`denied`): Hiển thị hướng dẫn mở lại quyền trong cài đặt trình duyệt / thiết bị.
- **RESTful / WebSocket Event:** WebSocket `connection:incoming`, `call:offer`, `message:new`, `moment:comment:added`.

---

### PHẦN 4: YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)

#### 4.1 Hiệu Năng Hệ Thống (Performance)
- **Thời gian phản hồi API (API Response Time):** 95% các yêu cầu truy vấn API thông thường phải phản hồi dưới 300ms; các truy vấn báo cáo tổng hợp phức tạp không quá 1.5 giây.
- **Khả năng chịu tải đồng thời (Concurrency):** Hệ thống phục vụ tối thiểu 10.000 người dùng hoạt động đồng thời (Concurrent Users) trên cụm máy chủ phân tán mà không suy giảm hiệu năng.
- **Thời gian tải trang Web & App (Page Load Speed):** Chỉ số Largest Contentful Paint (LCP) dưới 2.0 giây, First Input Delay (FID) dưới 100ms trên kết nối 4G tiêu chuẩn.

#### 4.2 Bảo Mật & Tuân Thủ (Security & Compliance)
- **Mã hóa dữ liệu (Data Encryption):** Dữ liệu lưu trữ (Data-at-rest) được mã hóa bằng chuẩn AES-256; dữ liệu đường truyền (Data-in-transit) bắt buộc mã hóa qua giao thức TLS 1.3 / HTTPS.
- **Phòng chống tấn công an ninh mạng:** Tích hợp bộ lọc WAF phòng chống 100% các lỗ hổng OWASP Top 10 (SQL Injection, XSS, CSRF, SSRF, Broken Authentication).
- **Chính sách mật khẩu & Phiên làm việc:** Mật khẩu băm qua thuật toán bcrypt (cost factor 10); phiên đăng nhập JWT hết hạn sau 60 phút, tự động làm mới qua Refresh Token.

#### 4.3 Tính Khả Dụng & Trải Nghiệm (Usability)
- **Thiết kế giao diện:** Tuân thủ tiêu chuẩn giao diện thượng lưu Dark Obsidian & Champagne Gold, tương thích hoàn hảo từ màn hình máy tính 4K, Laptop đến Smartphone viền mỏng.
- **Khả năng truy cập đa nền tảng:** Hỗ trợ đầy đủ Web Desktop, Mobile App iOS (TestFlight / IPA / WebClip) và Android (APK Standalone).

#### 4.4 Độ Tin Cậy & Khôi Phục Thảm Họa (Reliability & Disaster Recovery)
- **Chỉ số sẵn sàng (High Availability):** Đạt mức Uptime tối thiểu 99.9% (không quá 8.76 giờ gián đoạn/năm).
- **Sao lưu dữ liệu tự động (Backup Policy):** Sao lưu toàn bộ CSDL PostgreSQL mỗi 6 giờ một lần; lưu trữ dự phòng tại hạ tầng đám mây độc lập.
- **Thời gian khôi phục thảm họa (RTO & RPO):** RPO (Mất mát dữ liệu tối đa) ≤ 15 phút; RTO (Thời gian phục hồi dịch vụ) ≤ 30 phút.

---

### PHẦN 5: YÊU CẦU GIAO TIẾP VÀ TÍCH HỢP HỆ THỐNG (SYSTEM INTERFACES)
1. **Cổng Thanh Toán & Ngân Hàng Số VietQR / PayOS:** Tích hợp sinh mã QR thanh toán Napas 24/7 và nhận Webhook thông báo giao dịch tự động gạch nợ trong 1 giây.
2. **Cổng Tin Nhắn SMS OTP & Viễn Thông:** Tích hợp API SMS Brandname của Viettel / FPT / VNPT phục vụ gửi mã xác thực đăng nhập và bảo mật hai lớp.
3. **Dịch Vụ Email SMTP Doanh Nghiệp:** Tích hợp máy chủ SMTP gửi thư chào hàng, hợp đồng kinh tế và hóa đơn điện tử tự động.
4. **Hạ Tầng Lưu Trữ Đối Tượng MinIO / S3:** Lưu trữ phân tán tài liệu doanh nghiệp, ảnh danh thiếp OCR và hợp đồng scan.
5. **Cổng Tích Hợp Trí Tuệ Nhân Tạo AI Copilot:** Kết nối mô hình ngôn ngữ lớn (LLM OpenAI / Gemini / Ollama) xử lý đàm thoại điều hành và OCR tài liệu.
