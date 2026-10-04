# ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)
## HỆ ĐIỀU HÀNH DOANH NGHIỆP TOÀN DIỆN VIONE & NỀN TẢNG HIỆP HỘI CLB DOANH NHÂN CEO 1983
### TIÊU CHUẨN QUỐC TẾ IEEE 830-1998 (PHIÊN BẢN CHI TIẾT ĐẦY ĐỦ 100%)

---

### THÔNG TIN DỰ ÁN & KIỂM SOÁT TÀI LIỆU
* **Tên dự án:** Hệ Sinh Thái Quản Trị Doanh Nghiệp Hợp Nhất ViOne & Nền Tảng Hiệp Hội CLB Doanh Nhân CEO 1983
* **Mã tài liệu:** `SRS-VIONE-ENTERPRISE-IEEE830-V5.0`
* **Phiên bản:** `5.0 Master Release`
* **Tác giả:** Ban Kiến Trúc Hệ Thống (System Architect) & Senior Business Analyst (15 năm kinh nghiệm)
* **Ngày phát hành:** 04/10/2026
* **Cấp độ bảo mật:** TÀI LIỆU KỸ THUẬT NỘI BỘ — LƯU HÀNH BẢO MẬT
* **Mục tiêu cốt lõi:** Bóc tách toàn diện không bỏ sót bất kỳ chức năng nào theo nguyên tắc MECE.

---

## 1. GIỚI THIỆU CHUNG (INTRODUCTION)

### 1.1. Mục đích của tài liệu (Purpose)
Tài liệu Đặc tả Yêu cầu Phần mềm (SRS) này được biên soạn dựa trên tiêu chuẩn quốc tế **IEEE 830-1998** nhằm cung cấp bản mô tả toàn diện, chi tiết và có cấu trúc chặt chẽ về toàn bộ yêu cầu chức năng, yêu cầu phi chức năng, hành trình người dùng (User Journeys), ma trận phân quyền (RBAC), quy tắc nghiệp vụ và các giao tiếp hệ thống của Hệ sinh thái phần mềm hợp nhất **ViOne Platform & CLB Doanh Nhân CEO 1983**.

Tài liệu là cơ sở pháp lý và kỹ thuật cao nhất phục vụ:
1. Đội ngũ Kỹ sư Phát triển (Frontend, Backend, Mobile Engineers) triển khai chính xác 100% tính năng.
2. Đội ngũ Đảm bảo Chất lượng (QA/QC Engineers) thiết kế kịch bản kiểm thử toàn diện (E2E Test Cases).
3. Ban Lãnh đạo Khách hàng & Ban Điều hành Hiệp hội nghiệm thu bàn giao hệ thống.

### 1.2. Phạm vi dự án (Project Scope)
Hệ thống bao gồm 4 cấu phần phân lập nhưng đồng bộ dữ liệu thời gian thực:
1. **Web CRM Quản trị Doanh nghiệp ViOne Platform (`apps/vione_app_fe` - Port 5000 / 5445):** Phân hệ quản trị tập trung dành cho lãnh đạo C-Level và các phòng ban, hỗ trợ mô hình Đa công ty (Multi-Tenant), Quản trị quy trình công việc Kanban, Giám sát tải nhân sự, Bảng công GPS văn phòng & FaceID, Phê duyệt chi tiền 3 cấp, Sổ quỹ thu chi, Sàn thương mại B2B, Báo cáo tài chính, và Nhật ký kiểm toán 6 năng lực AI.
2. **Ứng dụng Di động Doanh nhân ViOne Connect (`apps/mobile_vione` Native React Native & PWA `/connect-app`):** Ứng dụng di động cao cấp chuẩn Dark Obsidian Luxury & Champagne Gold, cung cấp thẻ danh thiếp số Titanium 3D tích hợp chip NFC vật lý, quét danh thiếp OCR AI, B2B Moments, Stories 24h, Nurture List chăm sóc đối tác, hộp thư Messenger doanh nhân, và kết nối 1-on-1.
3. **Phân hệ Hiệp hội CLB Doanh Nhân CEO 1983 (`/association/*` & CRM Hiệp Hội Port 5443):** Bộ nhận diện Classic Navy & Amber Gold (`#003B95` & `#F59E0B`), quản lý hồ sơ hội viên CLB Doanh Nhân CEO 1983, thẻ hội viên số dập nổi logo 1983, sự kiện đại hội thường niên, soát vé QR check-in, đại hội biểu quyết trực tuyến (`/voting`), quay số may mắn (Lucky Draw), gia hạn hội phí niên liễm qua VietQR, và quản lý nhà tài trợ.
4. **Máy chủ Dịch vụ Backend NestJS API (`apps/vione_app_be` - Port 5001 / 5003):** 18 modules nghiệp vụ, kiến trúc Micro-modular, kết nối cơ sở dữ liệu PostgreSQL qua Prisma ORM, dịch vụ lưu trữ đám mây MinIO S3, cổng thanh toán VietQR Napas 24/7, và động cơ AI Copilot.

### 1.3. Định nghĩa, thuật ngữ và viết tắt (Definitions, Acronyms, and Abbreviations)

| Thuật Ngữ / Viết Tắt | Định Nghĩa Đầy Đủ | Diễn Giải Chi Tiết Trong Hệ Thống |
| :--- | :--- | :--- |
| **SRS** | Software Requirements Specification | Tài liệu đặc tả yêu cầu kỹ thuật phần mềm chuẩn IEEE 830. |
| **BRD** | Business Requirements Document | Tài liệu yêu cầu nghiệp vụ doanh nghiệp. |
| **MECE** | Mutually Exclusive, Collectively Exhaustive | Nguyên tắc phân rã: Không trùng lặp, Không bỏ sót. |
| **RBAC** | Role-Based Access Control | Kiểm soát truy cập dựa trên vai trò người dùng (Ma trận 7x6). |
| **Multi-Tenant** | Multi-Tenancy Architecture | Kiến trúc đa tổ chức, cô lập dữ liệu hoàn toàn giữa các doanh nghiệp. |
| **C-Level** | Chief Level Executives | Nhóm lãnh đạo cấp cao: CEO, COO, CFO, Sales Director. |
| **VietQR Napas 24/7** | Chuyển khoản QR ngân hàng | Chuẩn mã QR thanh toán liên ngân hàng Napas tự động gạch nợ. |
| **Liveness FaceID** | Nhận diện khuôn mặt sống | Thuật toán AI phát hiện người thật chống hành vi giả mạo bằng ảnh. |
| **NFC** | Near Field Communication | Công nghệ giao tiếp tầm ngắn nạp thẻ danh thiếp Titanium 1-chạm. |
| **vCard (.vcf)** | Virtual Contact File | Định dạng danh thiếp điện tử chuẩn quốc tế lưu thẳng danh bạ. |
| **Audit Trail** | Nhật ký kiểm toán hệ thống | Bản ghi nhật ký bất biến theo dõi toàn bộ thao tác thêm/sửa/xóa/duyệt. |
| **SLA** | Service Level Agreement | Cam kết chất lượng dịch vụ (Độ sẵn sàng hệ thống ≥ 99.98%). |
| **RPO / RTO** | Recovery Point / Time Objective | RPO: Điểm phục hồi dữ liệu (< 2h); RTO: Thời gian phục hồi (< 30m). |

---

## 2. MÔ TẢ TỔNG QUAN (OVERALL DESCRIPTION)

### 2.1. Danh sách User Roles & Chi tiết Quyền hạn (User Personas & Roles)

Hệ thống được thiết kế phục vụ **8 nhóm vai trò người dùng chính thức**, mỗi vai trò có phạm vi trách nhiệm và quyền hạn phân định rõ rệt:

1. **Tổng Giám Đốc (CEO - Chief Executive Officer):**
   - *Phạm vi quyền hạn:* Quyền hạn tối cao trên toàn bộ hệ thống doanh nghiệp (Toàn quyền Xem, Tạo, Sửa, Xóa, Duyệt, Xuất).
   - *Tính năng trọng tâm:* Bảng điều hành tổng quan KPI, phê duyệt đề xuất chi ngân sách lớn (> 20 triệu VNĐ), cấu hình chính sách chiết khấu, chỉ đạo tác nghiệp qua trợ lý AI Copilot, ký duyệt hợp đồng kinh tế và ban hành quyết định.
2. **Giám Đốc Vận Hành (COO - Chief Operating Officer):**
   - *Phạm vi quyền hạn:* Toàn quyền quản trị quy trình công việc và dự án vận hành.
   - *Tính năng trọng tâm:* Thiết lập quy trình công việc Kanban, phân bổ nhiệm vụ, giám sát khối lượng công việc nhân sự (Workload Heatmap), cảnh báo quá tải nhân sự (> 45h/tuần), nghiệm thu kết quả công việc.
3. **Giám Đốc Tài Chính (CFO - Chief Financial Officer):**
   - *Phạm vi quyền hạn:* Toàn quyền quản trị tài chính, dòng tiền và ngân sách.
   - *Tính năng trọng tâm:* Phê duyệt chi tiền 3 cấp (Kế toán kiểm tra chứng từ & Lãnh đạo duyệt), kiểm soát chống chi trùng hóa đơn, theo dõi sổ quỹ thu/chi, phân tích dòng tiền thực tế và dự phóng dòng tiền 30-90 ngày tới.
4. **Giám Đốc Kinh Doanh (Sales Manager / Director):**
   - *Phạm vi quyền hạn:* Quản lý phễu khách hàng B2B, cơ hội đấu thầu và đội ngũ kinh doanh.
   - *Tính năng trọng tâm:* Phân bổ lead tự động (Round-Robin), giám sát đường ống bán hàng, xét duyệt báo giá chiết khấu 6-15%, quản trị gian hàng sản phẩm B2B và ký duyệt báo giá PDF.
5. **Trưởng Phòng Nhân Sự (HR Manager):**
   - *Phạm vi quyền hạn:* Quản trị hồ sơ nhân sự, chấm công và chính sách lao động.
   - *Tính năng trọng tâm:* Cấu hình tọa độ định vị GPS văn phòng (bán kính ≤ 50m), đào tạo mẫu khuôn mặt AI FaceID, phê duyệt đơn xin nghỉ phép/đổi ca, tự động tổng hợp và khóa bảng công lúc 23:59 ngày mùng 2 hàng tháng, phát hành phiếu lương điện tử E-Payslip.
6. **Nhân Viên Chuyên Môn (Staff):**
   - *Phạm vi quyền hạn:* Thực thi tác nghiệp trong phạm vi công việc được phân công.
   - *Tính năng trọng tâm:* Chấm công di động bằng GPS & FaceID, nhận thẻ việc trên Kanban, cập nhật checklist tiến độ, lập tờ trình đề nghị thanh toán chi phí, nộp đơn nghỉ phép online.
7. **Đối Tác B2B & Hội Viên CLB Doanh Nhân CEO 1983 (Partner / Member):**
   - *Phạm vi quyền hạn:* Tham gia mạng lưới kết nối giao thương và hoạt động phong trào hiệp hội.
   - *Tính năng trọng tâm:* Sở hữu Thẻ danh thiếp số 3D Titanium NFC, đăng bài B2B Moments, đăng Stories 24h, đặt lịch hẹn gặp 1-1 Online/Offline, nộp hồ sơ chào thầu cơ hội kinh doanh, đăng ký sự kiện và quét vé QR, tham gia biểu quyết đại hội trực tuyến, đóng hội phí niên liễm qua VietQR.
8. **Quản Trị Viên Hệ Thống (System Admin):**
   - *Phạm vi quyền hạn:* Quản trị kỹ thuật hạ tầng, danh mục đa công ty và bảo mật.
   - *Tính năng trọng tâm:* Khởi tạo công ty thành viên Multi-Tenant, cấu hình Ma trận phân quyền RBAC 7x6, quản lý khóa chip NFC, giám sát Audit Trail và nhật ký kiểm toán AI.

### 2.2. Ma Trận Phân Quyền RBAC Nền Tảng (7 Nhóm Quyền x 6 Thao Tác)

| Phân Hệ / Module Chức Năng | CEO | COO | CFO | Sales | Admin | Staff | Partner/Member |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **01. Quản Trị Hệ Thống & Multi-Tenant** | Toàn quyền | Xem | Xem | Xem | Toàn quyền | ✗ | ✗ |
| **02. Phân Quyền RBAC & Phân Vai Trò** | Duyệt | Xem | Xem | Xem | Cấu hình | ✗ | ✗ |
| **03. Quản Trị Danh Bạ Thành Viên 360°** | Toàn quyền | Xem | Xem | Xem/Tạo | Toàn quyền | Xem nội bộ | Xem công khai |
| **04. Quản Trị Công Ty Thành Viên** | Toàn quyền | Xem | Xem | Xem | Toàn quyền | ✗ | Xem đối tác |
| **05. Sàn Cơ Hội Kinh Doanh B2B** | Toàn quyền | Xem/Duyệt | Xem | Toàn quyền | Quản trị | Tạo/Xem | Tham gia thầu |
| **06. Sàn Sản Phẩm & Báo Giá Quotes** | Toàn quyền | Xem | Xem/Duyệt | Toàn quyền | Quản trị | Xem/Báo giá | Mua sắm/Hỏi giá |
| **07. Quản Lý Sự Kiện & Soát Vé QR** | Toàn quyền | Điều phối | Kiểm soát | Phối hợp | Cấu hình | Check-in | Đăng ký vé |
| **08. Quy Trình Công Việc Kanban** | Giám sát | Toàn quyền | Xem | Tạo việc | Cấu hình | Thực hiện | ✗ |
| **09. Giám Sát Tải Nhân Sự Workload** | Giám sát | Toàn quyền | Xem | Xem team | Cấu hình | Xem bản thân | ✗ |
| **10. Chấm Công GPS & AI FaceID** | Giám sát | Xem | Xem | Xem team | Cấu hình | Chấm công | ✗ |
| **11. Phê Duyệt Chi Tiền 3 Cấp** | Duyệt cuối | Thẩm tra | Kiểm tra | Lập đề xuất | Cấu hình | Lập đề xuất | ✗ |
| **12. Sổ Quỹ Thu Chi & Dòng Tiền** | Toàn quyền | Xem | Toàn quyền | Xem doanh thu | Quản trị | ✗ | ✗ |
| **13. Trí Tuệ Nhân Tạo AI Copilot** | Toàn quyền | Sử dụng | Sử dụng | Sử dụng | Cấu hình | Hạn chế | Hạn chế |
| **14. Danh Thiếp Số 3D Titanium NFC** | Toàn quyền | Sở hữu | Sở hữu | Sở hữu | Cấp phát | Sở hữu | Sở hữu |

*Ghi chú các thao tác chuẩn:* **Xem (Read) · Tạo (Create) · Sửa (Update) · Xóa (Delete) · Duyệt (Approve) · Xuất (Export).**

### 2.3. Môi Trường Hoạt Động (Operating Environment)
* **Hạ tầng máy chủ (Server OS & Hosting):**
  - Hệ điều hành: Ubuntu Linux 22.04 LTS (x86_64).
  - Ảo hóa: Docker Engine 26.0+ & Docker Compose v2.
  - Reverse Proxy & Tường lửa: Nginx 1.24+ hỗ trợ HTTP/2, TLS 1.3, SSL tự động gia hạn, bảo vệ chống DDoS bằng fail2ban và Rate-limit.
* **Tầng Cơ sở Dữ liệu & Lưu trữ (Data Layer):**
  - Hệ quản trị CSDL: PostgreSQL 15 Enterprise chạy trên cổng bảo mật chuyên dụng.
  - ORM Engine: Prisma ORM 5.x bảo đảm Type-safe từ Schema đến Controller.
  - Lưu trữ tệp tin nhị phân: MinIO S3 Compatible Object Storage mã hóa phân vùng.
* **Nền tảng Web Client (Web Application):**
  - Trình duyệt hỗ trợ: Google Chrome (phiên bản ≥ 115), Microsoft Edge (≥ 115), Mozilla Firefox (≥ 118), Apple Safari (≥ 16).
  - Độ phân giải tối ưu: 1920x1080 (FHD Desktop), 1440x900 (Laptop), 1366x768 (Standard).
* **Nền tảng Thiết bị Di động (Mobile Native & PWA):**
  - iOS: Phiên bản iOS 15.0 trở lên (tương thích iPhone SE đến iPhone 16 Pro Max).
  - Android: Phiên bản Android 11.0 (API Level 30) trở lên (Samsung, Xiaomi, Oppo, Pixel...).
  - Công nghệ di động: Expo SDK 52 Native kết hợp React Native Architecture mới.

### 2.4. Ánh Xạ Hành Trình Người Dùng (End-to-End User Journey Mapping)

#### Hành trình 1: Tổng Giám Đốc (CEO) — Điều Hành Chiến Lược & Phê Duyệt 1-Chạm
1. **Khởi đầu ngày mới:** CEO mở ứng dụng ViOne trên điện thoại bằng sinh trắc học FaceID. Trang chủ Executive Home hiển thị thẻ Insight Card tóm tắt sức khỏe doanh nghiệp: Số dư dòng tiền hiện tại, Doanh số hôm nay, và 3 việc khẩn cấp cần phê duyệt.
2. **Họp giao ban & Chỉ đạo chiến lược:** CEO mở màn hình Trợ lý AI Copilot (`/ai`), ra lệnh bằng giọng nói: "Tóm tắt tình hình các dự án đang có nguy cơ trễ hạn trong tuần này". AI quét biểu đồ quy trình công việc và phản hồi danh sách 2 dự án cần can thiệp.
3. **Phê duyệt chi tiền từ xa:** CEO nhận thông báo đẩy (Push Notification) có một tờ trình chi mua sắm thiết bị trị giá 45 triệu VNĐ đã qua bước Kế toán kiểm tra chứng từ hợp lệ. CEO bấm mở tờ trình, xem hóa đơn quét sạch không bị trùng lặp, nhấn nút "Phê Duyệt". Hệ thống tự động kích hoạt tạo mã chuyển khoản QR ngân hàng Napas 24/7.
4. **Giao tiếp đối tác tại hội nghị:** Trong buổi tiệc ngoại giao, CEO chạm nhẹ thẻ Titanium NFC vào điện thoại đối tác để mở hồ sơ năng lực số, đối tác bấm 1-chạm lưu danh bạ CEO vào điện thoại.
5. **Kết thúc ngày:** CEO xem biểu đồ dự phóng dòng tiền 90 ngày tới để hoạch định nguồn vốn đầu tư.

#### Hành trình 2: Giám Đốc Vận Hành (COO) — Điều Phối Quy Trình & Cân Bằng Tải
1. **Bắt đầu ca:** Đăng nhập vào Web CRM ViOne (`/workflow`), quan sát Bảng Kanban trực quan.
2. **Phát hiện nút thắt cổ chai:** Nhận thấy cột "Kiểm tra chất lượng" có 6 tác vụ dồn ứ. COO mở biểu đồ tải làm việc Workload Heatmap (`/workload`), phát hiện chuyên viên kỹ thuật A đang phải gánh 48 giờ việc/tuần (cảnh báo đỏ quá tải), trong khi chuyên viên B chỉ có 20 giờ việc/tuần.
3. **Tái phân bổ nguồn lực:** COO thực hiện thao tác kéo thả chuyển giao 2 tác vụ từ A sang B trên giao diện trực quan. Cả hai nhân sự nhận thông báo cập nhật việc ngay lập tức trên app di động.
4. **Kiểm soát chất lượng:** COO mở tác vụ hoàn thành, kiểm tra danh mục checklist đã đạt 100%, nhấn "Phê Duyệt Nghiệm Thu" để đóng thẻ việc.

#### Hành trình 3: Giám Đốc Tài Chính (CFO) — Thẩm Tra Chi & Quản Trị Thanh Khoản
1. **Kiểm tra sổ quỹ đầu ngày:** Đăng nhập Web CRM (`/income`, `/expenses`), rà soát các khoản tiền thực thu từ khách hàng qua cổng VietQR Napas đêm qua đã tự động gạch nợ chính xác 100% không lệch 1 đồng.
2. **Thẩm tra tờ trình chi (Bước Checker):** Mở phân hệ Phê duyệt chi (`/payment-approvals`). Hệ thống tự động cảnh báo một hóa đơn tiếp khách số `HD-00921` có dấu hiệu trùng số hóa đơn đã thanh toán tháng trước. CFO từ chối tờ trình chi và ghi chú lý do hoàn trả cho nhân viên.
3. **Phê duyệt chi thường xuyên:** Duyệt các khoản chi hợp lệ dưới 20 triệu VNĐ theo phân cấp hạn mức.
4. **Báo cáo tài chính & Danh mục sản phẩm:** Mở `/finance-report`, phân tích tỷ suất sinh lời của 6 ngành hàng chủ lực trên sàn Marketplace để tư vấn chiến lược kinh doanh cho CEO.

#### Hành trình 4: Nhân Viên Chuyên Môn (Staff) — Chấm Công, Nhận Việc & Quyết Toán
1. **Chấm công đầu ngày:** Khi bước vào sảnh văn phòng (GPS đo được cách tâm văn phòng 15m ≤ 50m), nhân viên mở app ViOne, camera trước bật lên, nhận diện khuôn mặt AI FaceID xác thực trong 1 giây (độ khớp 96%, phát hiện người thật liveness PASS). Màn hình báo "Chấm công thành công 08:25 AM".
2. **Thực hiện nhiệm vụ:** Mở thẻ công việc được giao trên điện thoại, xem danh sách checklist các hạng mục cần làm. Khi hoàn thành từng mục, nhân viên tích chọn và đính kèm ảnh bằng chứng.
3. **Lập đề nghị thanh toán:** Mua sắm văn phòng phẩm hết 1.2 triệu VNĐ, nhân viên chụp ảnh hóa đơn GTGT, điền nội dung và bấm "Gửi Đề Xuất Chi". Trạng thái chuyển sang "Chờ Kế toán kiểm tra".
4. **Đăng ký nghỉ phép:** Cần nghỉ phép 1 ngày vào tuần sau, nhân viên chọn ngày, lý do và gửi đơn online. Trưởng phòng nhận thông báo và duyệt ngay trong 5 phút.

#### Hành trình 5: Hội Viên CLB Doanh Nhân CEO 1983 — Tham Gia Đại Hội & Giao Thương
1. **Đăng nhập chuyên biệt:** Hội viên truy cập cổng riêng `/association/login`, đăng nhập bằng mã hội viên `M1983-007`.
2. **Check-in Đại hội thường niên:** Đến địa điểm tổ chức sự kiện, hội viên mở Thẻ vé QR Code động trên app. Nhân viên an ninh dùng máy quét chuyên dụng quét mã vé, màn hình hiện "Xác thực Đại biểu Phạm Long - Bàn VIP 02" trong 0.15 giây.
3. **Biểu quyết trực tuyến:** Trong phiên đại hội bầu cử Ban Chấp Hành, MC thông báo mở cổng bầu cử. Hội viên mở mục `/association/voting`, tích chọn danh sách 15 ứng viên tín nhiệm và nhấn "Bỏ Phiếu". Kết quả kiểm phiếu hiển thị trực tiếp lên màn hình LED hội trường sau 30 giây.
4. **Gia hạn hội phí niên liễm:** Nhận thông báo hội phí năm mới, hội viên mở `/association/renew`, quét mã VietQR ngân hàng trên app banking. Sau 1 giây, hệ thống tự động xác nhận đã đóng phí và gia hạn thẻ hội viên đến 31/12/2027.

---

## 3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS - MECE)

### MODULE 01: QUẢN TRỊ HỆ THỐNG, ĐA CÔNG TY MULTI-TENANT & PHÂN QUYỀN RBAC

#### FR-01.01: Đăng Nhập Đa Nhận Diện & Xác Thực 2FA
* **Actor:** Toàn bộ User Roles.
* **Mô tả chi tiết:**
  - *Input:* Tên đăng nhập / Email / Số điện thoại / Mã định danh cá nhân + Mật khẩu tài khoản (+ Mã OTP 6 chữ số nếu kích hoạt 2FA).
  - *Xử lý logic:* Backend NestJS kiểm tra định danh qua `LocalAuthGuard`, giải băm mật khẩu bằng Bcrypt (`rounds: 10`). Nếu mật khẩu chính xác, kiểm tra trạng thái kích hoạt tài khoản. Nếu bật 2FA, sinh mã OTP thời hạn 5 phút gửi qua Email/SMS. Khi xác thực thành công, sinh cặp mã khóa JWT (Access Token thời hạn 1 ngày, Refresh Token thời hạn 7 ngày lưu trữ trong Cookie an toàn `HttpOnly`).
  - *Output:* Token xác thực, thông tin User Profile, phân quyền RBAC và chuyển hướng vào màn hình tương ứng.
* **Luồng ngoại lệ:** Nhập sai mật khẩu quá 5 lần liên tiếp sẽ tự động khóa tài khoản tạm thời trong 15 phút để chống tấn công Brute-force; Mất kết nối internet hiển thị thông báo lỗi mạng.
* **API Endpoint:** `POST /api/auth/login` · `POST /api/auth/verify-2fa`

#### FR-01.02: Đăng Nhập Một Chạm Mạng Xã Hội (Google & Apple OAuth 2.0)
* **Actor:** Toàn bộ User Roles.
* **Mô tả chi tiết:**
  - *Input:* Token nhận dạng từ Google Sign-In hoặc Apple Identity Provider.
  - *Xử lý logic:* Backend giải mã token ID Token, trích xuất email và họ tên. Nếu email đã tồn tại, liên kết tài khoản và phát hành JWT phiên làm việc; nếu chưa tồn tại, tự động tạo tài khoản mới với vai trò mặc định (Partner/Guest).
  - *Output:* Phiên làm việc hợp lệ và điều hướng vào trang chủ.
* **Luồng ngoại lệ:** Token OAuth hết hạn hoặc bị từ chối quyền truy cập hiển thị thông báo "Xác thực bên thứ ba thất bại".
* **API Endpoint:** `POST /api/auth/oauth/google` · `POST /api/auth/oauth/apple`

#### FR-01.03: Cấu Hình Ma Trận Phân Quyền RBAC 7 Nhóm Quyền x 6 Thao Tác
* **Actor:** Quản Trị Viên Hệ Thống (System Admin), Tổng Giám Đốc (CEO).
* **Mô tả chi tiết:**
  - *Input:* Ma trận bật/tắt (Toggle) 6 thao tác (Xem, Tạo, Sửa, Xóa, Duyệt, Xuất) trên 14 phân hệ nghiệp vụ cho 7 nhóm vai trò doanh nghiệp.
  - *Xử lý logic:* Lưu cấu hình ma trận phân quyền vào CSDL. Khi người dùng thực hiện bất kỳ hành động nào, middleware kiểm tra quyền hạn tương ứng trước khi xử lý controller.
  - *Output:* Ma trận quyền cập nhật tức thời, thông báo "Cập nhật phân quyền thành công".
* **Luồng ngoại lệ:** Admin không thể tự tước quyền Quản trị của chính mình để tránh tình trạng hệ thống không còn người quản trị (Deadlock).
* **API Endpoint:** `GET /api/platform/permissions/matrix` · `PUT /api/platform/permissions/matrix`

#### FR-01.04: Quản Trị Doanh Nghiệp Đa Công Ty (Multi-Tenancy)
* **Actor:** Quản Trị Viên Hệ Thống (System Admin).
* **Mô tả chi tiết:**
  - *Input:* Tên công ty, Mã số thuế, Logo, Địa chỉ, Người đại diện pháp luật, Gói đăng ký dịch vụ.
  - *Xử lý logic:* Tạo bản ghi trong bảng `companies`, sinh mã `tenant_id` duy nhất. Thiết lập phân vùng lưu trữ MinIO S3 riêng biệt cho công ty.
  - *Output:* Hồ sơ công ty được tạo mới, sẵn sàng phân bổ tài khoản người dùng trực thuộc.
* **Luồng ngoại lệ:** Mã số thuế bị trùng với công ty đã có trong hệ thống báo lỗi 409 Conflict.
* **API Endpoint:** `POST /api/companies` · `GET /api/companies` · `PUT /api/companies/:id`

---

### MODULE 02: QUẢN TRỊ HỒ SƠ DOANH NGHIỆP & DANH BẠ HỘI VIÊN 360°

#### FR-02.01: Quản Trị Danh Bạ Hội Viên & Tìm Kiếm Đa Tiêu Chí
* **Actor:** Toàn bộ User Roles (phân quyền theo vai trò).
* **Mô tả chi tiết:**
  - *Input:* Từ khóa tìm kiếm, Bộ lọc theo nhóm ngành nghề, Bộ lọc theo cấp bậc hội viên, Trạng thái hoạt động.
  - *Xử lý logic:* Thực hiện truy vấn cơ sở dữ liệu có phân trang (Pagination 20 bản ghi/trang), sắp xếp theo thứ tự ưu tiên hoặc ngày gia nhập.
  - *Output:* Bảng danh sách hội viên kèm ảnh đại diện, chức vụ, tên công ty và huy hiệu xác thực.
* **API Endpoint:** `GET /api/members` · `GET /api/members/:id`

#### FR-02.02: Xem Drawer Chi Tiết Hồ Sơ 360° Hội Viên
* **Actor:** CEO, COO, CFO, Sales Manager, Admin.
* **Mô tả chi tiết:**
  - *Input:* Thao tác nhấp chuột vào một dòng thành viên trong danh bạ.
  - *Xử lý logic:* Mở thanh trượt (Drawer) từ mép phải màn hình, tải thông tin toàn diện: Tiểu sử, Thông tin liên hệ, Lịch sử tham gia sự kiện, Lịch sử nộp hội phí, Danh sách sản phẩm niêm yết, và Nhật ký tương tác.
  - *Output:* Giao diện Drawer hiển thị tức thì dưới 0.3 giây.
* **API Endpoint:** `GET /api/members/:id/profile-360`

#### FR-02.03: Phê Duyệt Hội Viên Mới & Cấp Phát Mã Số Tự Động
* **Actor:** Quản Trị Viên (Admin), Ban Thư Ký Hiệp Hội.
* **Mô tả chi tiết:**
  - *Input:* Hồ sơ đăng ký gia nhập của doanh nghiệp (kèm ảnh ĐKKD, CCCD).
  - *Xử lý logic:* Thẩm định tính hợp lệ, nhấn nút "Phê Duyệt". Hệ thống sinh mã hội viên tự động định dạng `M1983-XXX`, kích hoạt tài khoản và gửi email chào mừng kèm mật khẩu khởi tạo qua SMTP.
  - *Output:* Trạng thái chuyển thành "Đã xác thực", hội viên có thể đăng nhập ngay lập tức.
* **API Endpoint:** `POST /api/members/:id/approve`

---

### MODULE 03: DANH THIẾP SỐ 3D TITANIUM & TÍCH HỢP CHIP VẬT LÝ NFC

#### FR-03.01: Hiển Thị Thẻ Danh Thiếp 3D Titanium Mạ Vàng
* **Actor:** Toàn bộ Doanh nhân & Hội viên.
* **Mô tả chi tiết:**
  - *Input:* Thao tác mở mục "Danh thiếp của tôi" trên ứng dụng di động.
  - *Xử lý logic:* Kết xuất (Render) thẻ danh thiếp đồ họa 3D xoay lật 2 mặt với hiệu ứng ánh kim Titanium mạ vàng Champagne sang trọng, hiển thị Họ tên, Chức vụ, Logo doanh nghiệp, và Mã QR động.
  - *Output:* Thẻ 3D hiển thị mượt mà 60fps trên màn hình di động.
* **API Endpoint:** `GET /api/business-cards/me`

#### FR-03.02: Liên Kết & Khóa Chip NFC Vật Lý Từ Xa
* **Actor:** Doanh nhân sở hữu thẻ, Admin.
* **Mô tả chi tiết:**
  - *Input:* Chạm thẻ NFC vật lý vào đầu đọc NFC của điện thoại; hoặc nhấn nút "Khóa thẻ" khi bị mất.
  - *Xử lý logic:* Nạp chuỗi Token định danh duy nhất vào chip NFC; khi báo khóa thẻ, hệ thống chuyển cờ trạng thái `is_locked = true`. Mọi thao tác chạm thẻ sau đó sẽ hiện thông báo "Thẻ đã bị vô hiệu hóa bởi chủ sở hữu".
  - *Output:* Xác nhận kích hoạt hoặc khóa thẻ thành công trong 1 giây.
* **API Endpoint:** `POST /api/business-cards/nfc/link` · `POST /api/business-cards/nfc/lock`

#### FR-03.03: Xuất Danh Bạ Điện Tử Chuẩn Quốc Tế vCard (.vcf)
* **Actor:** Đối tác quét danh thiếp.
* **Mô tả chi tiết:**
  - *Input:* Nhấn nút "Lưu Danh Bạ" trên trang web danh thiếp công khai.
  - *Xử lý logic:* Sinh tệp tin định dạng chuẩn `vCard 3.0` chứa đầy đủ: Họ tên, Chức danh, Công ty, Số điện thoại, Email, Địa chỉ, Website và Ảnh đại diện Base64. Trình duyệt điện thoại tự động mở ứng dụng Danh bạ mặc định (iOS Contacts / Google Contacts).
  - *Output:* Tệp `.vcf` tải về và mở sẵn sàng lưu 1-chạm.
* **API Endpoint:** `GET /api/business-cards/public-card/:code/vcard`

---

### MODULE 04: MẠNG XÃ HỘI DOANH NHÂN, KHOẢNH KHẮC & KẾT NỐI GIAO THƯƠNG

#### FR-04.01: Dải Khoảnh Khắc 24H (Stories Strip) & Trình Xem Toàn Màn Hình
* **Actor:** Doanh nhân, Hội viên.
* **Mô tả chi tiết:**
  - *Input:* Thao tác lướt dải Story tròn trên đầu Tab Mạng Lưới; bấm vào một Story để xem.
  - *Xử lý logic:* Tải danh sách Story còn hiệu lực (dưới 24 giờ kể từ khi đăng). Mở trình xem toàn màn hình với thanh tiến độ tự động chạy từ 0-100% trong 5 giây/ảnh. Hỗ trợ chạm giữ để tạm dừng, vuốt sang để chuyển Story tiếp theo, và nút thả tim tương tác.
  - *Output:* Trải nghiệm lướt Story mượt mà không giật lag.
* **API Endpoint:** `GET /api/connect-app/stories` · `POST /api/connect-app/stories/:id/like`

#### FR-04.02: Đăng Khoảnh Khắc 24H (Create Story Modal)
* **Actor:** Doanh nhân, Hội viên.
* **Mô tả chi tiết:**
  - *Input:* Ảnh chụp từ camera/thư viện, chú thích (caption), gắn nhãn hashtag ngành nghề (`#Ký kết đối tác`, `#Xúc tiến đầu tư`, `#Giao thương B2B`).
  - *Xử lý logic:* Nén ảnh tối ưu kích thước, tải lên MinIO S3, lưu bản ghi có mốc thời gian tự động hủy sau 24 giờ.
  - *Output:* Story mới xuất hiện ngay lập tức trên dải đầu bảng tin.
* **API Endpoint:** `POST /api/connect-app/stories`

#### FR-04.03: Khối Đối Tác Cần Giữ Kết Nối & Chăm Sóc (Nurture List)
* **Actor:** Doanh nhân C-Level.
* **Mô tả chi tiết:**
  - *Input:* Danh sách đối tác trong mạng lưới đã kết nối.
  - *Xử lý logic:* Thuật toán tự động quét lịch sử tin nhắn, cuộc gọi và cuộc gặp. Nếu đối tác quá 30 ngày chưa có tương tác, tự động đưa vào danh sách cảnh báo "Cần giữ kết nối & chăm sóc" kèm 3 nút hành động nhanh: [Hẹn 1-1], [Nhắn tin], [Gọi điện].
  - *Output:* Panel nhắc việc trực quan giúp doanh nhân không đánh mất mối quan hệ giá trị.
* **API Endpoint:** `GET /api/connect-app/network/nurture-list`

#### FR-04.04: Đặt Lịch Hẹn Kinh Doanh 1-1 (Schedule Meeting Modal)
* **Actor:** Doanh nhân C-Level, Hội viên.
* **Mô tả chi tiết:**
  - *Input:* Đối tác muốn hẹn, Ngày hẹn, Khung giờ (09:00 - 17:00), Hình thức: [Offline Lounge VIP] hoặc [Online Google Meet], Địa điểm / Link phòng họp, Nội dung trao đổi.
  - *Xử lý logic:* Kiểm tra tính khả dụng trong lịch trình của đối tác; tạo lời mời hẹn gặp, gửi thông báo đẩy đến điện thoại đối tác để xác nhận. Tự động đồng bộ vào lịch trình cá nhân C-Level khi được chấp thuận.
  - *Output:* Lịch hẹn được ghi nhận, trạng thái "Chờ đối tác xác nhận".
* **API Endpoint:** `POST /api/meetings` · `GET /api/meetings`

---

### MODULE 05: HỘP THƯ DOANH NHÂN & TRAO ĐỔI B2B TRỰC TUYẾN

#### FR-05.01: Hộp Thư Phân Loại 4 Danh Mục & Đếm Tin Chưa Đọc
* **Actor:** Toàn bộ User Roles.
* **Mô tả chi tiết:**
  - *Input:* Thao tác mở tab Tin nhắn.
  - *Xử lý logic:* Phân luồng tin nhắn thành 4 tab rõ ràng: [Tất cả], [Khách hàng B2B], [Nội bộ công ty], [Hệ thống thông báo]. Đếm tổng số tin nhắn chưa đọc hiển thị lên huy hiệu đỏ tại Header.
  - *Output:* Danh sách cuộc trò chuyện cập nhật theo thời gian thực.
* **API Endpoint:** `GET /api/connect-app/dm/threads`

#### FR-05.02: Trò Chuyện 1-1 & Nhóm Mã Hóa Đầu Cuối
* **Actor:** Doanh nhân, Nhân viên.
* **Mô tả chi tiết:**
  - *Input:* Tin nhắn văn bản, emoji, tệp tin PDF/Word/Excel (tối đa 50MB), hình ảnh.
  - *Xử lý logic:* Truyền tải tin nhắn qua giao thức WebSocket (Socket.io) thời gian thực, lưu trữ cơ sở dữ liệu có mã hóa. Hỗ trợ hiển thị trạng thái "Đã gửi", "Đã nhận", "Đã xem".
  - *Output:* Tin nhắn gửi đi tức thời dưới 100ms.
* **API Endpoint:** `POST /api/connect-app/dm/messages` · WebSocket Gateway `/chat`

---

### MODULE 06: SÀN THƯƠNG MẠI ĐIỆN TỬ & ĐẤU THẦU DỰ ÁN B2B

#### FR-06.01: Sàn Trưng Bày Sản Phẩm & Dịch Vụ Theo 6 Ngành Hàng
* **Actor:** Toàn bộ User Roles, Khách hàng B2B.
* **Mô tả chi tiết:**
  - *Input:* Bộ lọc ngành hàng (Công nghệ & AI, Chuỗi cung ứng & Bán lẻ, Quỹ đầu tư & Vốn, Xây dựng & BĐS, Nông sản & Thực phẩm, Y tế & Giáo dục).
  - *Xử lý logic:* Hiển thị danh mục sản phẩm dạng lưới thẻ (Grid view), gồm ảnh đại diện, giá niêm yết, tên doanh nghiệp cung cấp, huy hiệu xác thực và thanh tiến độ giao dịch.
  - *Output:* Danh mục sản phẩm phong phú, tốc độ tải trang nhanh.
* **API Endpoint:** `GET /api/products` · `GET /api/products/:id`

#### FR-06.02: Yêu Cầu Báo Giá Điện Tử B2B (Quotes Workspace)
* **Actor:** Khách hàng B2B, Doanh nghiệp mua hàng.
* **Mô tả chi tiết:**
  - *Input:* Số lượng đặt hàng dự kiến, yêu cầu tùy biến kỹ thuật, địa chỉ giao hàng, thời hạn cần hàng.
  - *Xử lý logic:* Tạo bản ghi yêu cầu báo giá chuyển thẳng vào Workspace của bộ phận Kinh doanh doanh nghiệp cung ứng. Nhân viên kinh doanh áp dụng chính sách chiết khấu hợp lệ, sinh file báo giá điện tử có chữ ký số và gửi email PDF cho khách hàng trong 2 phút.
  - *Output:* Báo giá điện tử chuyên nghiệp định dạng PDF chuẩn A4.
* **API Endpoint:** `POST /api/marketplace/quotes` · `GET /api/marketplace/quotes/:id`

#### FR-06.03: Đăng Tải & Nộp Hồ Sơ Gói Thầu / Cơ Hội Kinh Doanh B2B
* **Actor:** Doanh nghiệp có nhu cầu mua sắm / Nhà thầu cung ứng.
* **Mô tả chi tiết:**
  - *Input:* Tên gói thầu, Ngân sách dự kiến (ví dụ: 15 tỷ, 850 triệu, 5.2 tỷ), Phạm vi giao hàng, Tiêu chí kỹ thuật, Thời hạn đóng thầu.
  - *Xử lý logic:* Kiểm duyệt nội dung gói thầu, phát hành lên Sàn Cơ Hội Kinh Doanh (`/opportunities`). Các doanh nghiệp đạt chuẩn bấm "Nộp Hồ Sơ Năng Lực" đính kèm báo giá chào thầu.
  - *Output:* Gói thầu mở công khai, danh sách hồ sơ chào thầu được bảo mật đến ngày mở thầu.
* **API Endpoint:** `POST /api/opportunities` · `POST /api/opportunities/:id/bid`

---

### MODULE 07: QUẢN TRỊ SỰ KIỆN, SƠ ĐỒ KHÁN PHÒNG & SOÁT VÉ QR CHECK-IN

#### FR-07.01: Thiết Lập Sơ Đồ Chỗ Ngồi Khán Phòng (Cinema Seating Map)
* **Actor:** Ban Tổ Chức Sự Kiện, Quản Trị Viên (Admin).
* **Mô tả chi tiết:**
  - *Input:* Ma trận hàng ghế (A, B, C...) và số thứ tự ghế (01-30), Phân loại hạng ghế: [Ghế VIP Kim Cương], [Ghế Đại Biểu Vàng], [Ghế Khách Mời Tiêu Chuẩn].
  - *Xử lý logic:* Vẽ sơ đồ chỗ ngồi đồ họa trực quan. Khi đại biểu chọn ghế, khóa tạm thời ghế đó trong 10 phút để đại biểu hoàn tất thủ tục thanh toán vé.
  - *Output:* Sơ đồ khán phòng hiển thị trạng thái ghế Trống (Xanh), Đang giữ (Vàng), Đã bán (Đỏ).
* **API Endpoint:** `GET /api/events/:id/seats` · `POST /api/events/:id/seats/lock`

#### FR-07.02: Cấp Phát Vé Điện Tử & Cổng Soát Vé Check-In An Ninh
* **Actor:** Đại biểu tham dự, Nhân viên an ninh soát vé.
* **Mô tả chi tiết:**
  - *Input:* Mã vé điện tử dạng QR Code hiển thị trên ứng dụng của đại biểu.
  - *Xử lý logic:* Mã QR là mã động thay đổi mã băm bảo mật sau mỗi 30 giây để chống chụp ảnh bán lại vé. Thiết bị của nhân viên an ninh quét mã QR, giải mã và đối soát với cơ sở dữ liệu trong 0.15 giây.
  - *Output:* Màn hình hiện màu xanh "HỢP LỆ - Chào mừng Đại biểu [Tên], Bàn VIP [Số]", cửa an ninh mở; nếu vé đã check-in trước đó báo chuông đỏ "VÉ ĐÃ SỬ DỤNG".
* **API Endpoint:** `POST /api/events/checkin/verify`

---

### MODULE 08: ĐẠI HỘI, BIỂU QUYẾT TRỰC TUYẾN & QUAY SỐ MAY MẮN

#### FR-08.01: Đại Hội Biểu Quyết Trực Tuyến Thời Gian Thực
* **Actor:** Đoàn Chủ Tịch Đại Hội, Đại biểu chính thức.
* **Mô tả chi tiết:**
  - *Input:* Nội dung dự thảo nghị quyết đại hội hoặc danh sách ứng viên bầu cử; Lựa chọn của đại biểu: [Tán thành], [Không tán thành], [Không có ý kiến].
  - *Xử lý logic:* Xác thực đại biểu có tư cách hợp lệ (đã hoàn thành đóng hội phí thường niên), ghi nhận phiếu bầu bất biến. Tính toán tỷ lệ phần trăm biểu quyết và truyền dữ liệu thời gian thực qua WebSocket lên màn hình máy chiếu hội trường.
  - *Output:* Biểu đồ cột/tròn kết quả biểu quyết nhảy số trực tiếp trên màn hình sân khấu.
* **API Endpoint:** `POST /api/voting/ballots` · `GET /api/voting/:id/results`

#### FR-08.02: Hệ Thống Quay Số May Mắn Đại Hội (Lucky Draw)
* **Actor:** Ban Tổ Chức, Toàn thể đại biểu.
* **Mô tả chi tiết:**
  - *Input:* Danh sách mã số may mắn của các đại biểu đã check-in tại cổng; Cơ cấu giải thưởng (Giải Đặc Biệt, Giải Nhất, Giải Nhì...).
  - *Xử lý logic:* Thuật toán sinh số ngẫu nhiên mật mã (Cryptographically Secure PRNG), hiệu ứng cuộn số 3D hồi hộp trên màn hình lớn. Đại biểu trúng giải tự động bị loại khỏi danh sách quay của các giải tiếp theo.
  - *Output:* Hiệu ứng pháo hoa chúc mừng kèm tên và ảnh đại biểu trúng thưởng.
* **API Endpoint:** `POST /api/voting/lucky-draw/spin`

---

### MODULE 09: QUẢN TRỊ QUY TRÌNH CÔNG VIỆC & DỰ ÁN VẬN HÀNH

#### FR-09.01: Quản Trị Quy Trình Công Việc Trên Bảng Kanban Kéo Thả
* **Actor:** COO, Quản Lý Dự Án, Nhân Viên Phụ Trách.
* **Mô tả chi tiết:**
  - *Input:* Các cột trạng thái quy trình: [Chờ xử lý] → [Đang làm] → [Kiểm tra chất lượng] → [Hoàn thành].
  - *Xử lý logic:* Kéo thả thẻ việc giữa các cột; kiểm tra điều kiện chuyển cột (ví dụ: chuyển sang Hoàn thành bắt buộc 100% mục checklist con đã tích chọn).
  - *Output:* Vị trí thẻ việc cập nhật ngay lập tức trên màn hình của toàn bộ thành viên dự án.
* **API Endpoint:** `GET /api/operations/workflow/tasks` · `PATCH /api/operations/workflow/tasks/:id/move`

#### FR-09.02: Giám Sát Phân Bổ Tải Nhân Sự (Workload Heatmap)
* **Actor:** Tổng Giám Đốc, Giám Đốc Vận Hành (COO).
* **Mô tả chi tiết:**
  - *Input:* Lịch làm việc tuần và tổng số giờ ước tính của các thẻ việc giao cho từng nhân sự.
  - *Xử lý logic:* Tính toán tổng giờ làm/tuần. Nếu tổng giờ ≤ 40h: hiển thị màu xanh (Bình thường); 41-45h: màu vàng (Bận rộn); > 45h: màu đỏ rực (Cảnh báo quá tải).
  - *Output:* Bản đồ nhiệt (Heatmap) giúp lãnh đạo cân bằng tải công bằng, chống quá tải nhân sự.
* **API Endpoint:** `GET /api/operations/workload/matrix`

---

### MODULE 10: CHẤM CÔNG THÔNG MINH & QUẢN TRỊ NHÂN SỰ

#### FR-10.01: Chấm Công Di Động GPS Văn Phòng & AI FaceID Liveness
* **Actor:** Toàn thể nhân viên doanh nghiệp.
* **Mô tả chi tiết:**
  - *Input:* Tọa độ GPS thời gian thực của điện thoại + Ảnh chụp khuôn mặt trực tiếp từ camera trước.
  - *Xử lý logic:* 
    1. Kiểm tra khoảng cách Haversine giữa GPS điện thoại và tọa độ văn phòng: Nếu khoảng cách > 50 mét, từ chối chấm công kèm thông báo "Bạn đang ở ngoài phạm vi văn phòng (cách ... mét)".
    2. Nếu GPS hợp lệ, chuyển ảnh lên AI Engine so khớp với ảnh hồ sơ nhân sự (độ khớp yêu cầu ≥ 92%), đồng thời thuật toán Liveness Detection phân tích cử động mắt và độ sâu ánh sáng để chống dùng ảnh chụp lại màn hình.
  - *Output:* Ghi nhận bản ghi chấm công: Ngày, Giờ vào/ra, Tọa độ GPS, Ảnh chụp, và trạng thái [Đúng giờ / Đi muộn / Về sớm].
* **API Endpoint:** `POST /api/operations/attendance/checkin`

#### FR-10.02: Khóa Bảng Chấm Công Tự Động & Phát Hành Phiếu Lương
* **Actor:** Trưởng Phòng Nhân Sự (HR Manager), CFO.
* **Mô tả chi tiết:**
  - *Input:* Dữ liệu chấm công toàn bộ nhân viên trong tháng.
  - *Xử lý logic:* Đúng 23:59 ngày mùng 2 hàng tháng, hệ thống tự động khóa sổ bảng công. Bộ máy tính lương tự động tính ngày công thực tế, trừ số phút đi muộn, cộng giờ làm thêm OT được duyệt, trừ biểu thuế TNCN lũy tiến 7 bậc và bảo hiểm xã hội. Phát hành phiếu lương điện tử E-Payslip bảo mật đến tài khoản từng cá nhân.
  - *Output:* Bảng lương toàn công ty hoàn thành trong 10 giây; nhân viên nhận phiếu lương bí mật trên điện thoại.
* **API Endpoint:** `POST /api/operations/attendance/lock-month` · `GET /api/operations/attendance/payroll`

---

### MODULE 11: PHÊ DUYỆT CHI TIỀN 3 CẤP & QUẢN TRỊ DÒNG TIỀN

#### FR-11.01: Lập Đề Xuất Chi Tiền & Quét Chống Chi Trùng Hóa Đơn
* **Actor:** Nhân viên lập đề xuất chi.
* **Mô tả chi tiết:**
  - *Input:* Danh mục chi phí, Số tiền đề xuất, Nội dung giải trình, Ảnh chụp hóa đơn GTGT, Mã số thuế đơn vị bán, Số hóa đơn.
  - *Xử lý logic:* Động cơ kiểm toán tự động quét đối chiếu số hóa đơn và mã cơ quan thuế với toàn bộ các khoản chi lịch sử trong 5 năm qua. Nếu phát hiện trùng lặp, lập tức khóa nút gửi và hiển thị cảnh báo đỏ "Hóa đơn này đã được thanh toán tại tờ trình chi số #... ngày ...".
  - *Output:* Tờ trình chi hợp lệ được tạo, chuyển sang bước "Kế toán kiểm tra chứng từ".
* **API Endpoint:** `POST /api/operations/finance/approvals`

#### FR-11.02: Quy Trình Phê Duyệt Chi Tiền 3 Cấp & Thanh Toán VietQR Ngân Hàng
* **Actor:** Nhân viên lập (Maker) → Kế toán kiểm tra (Checker) → Lãnh đạo duyệt (Approver).
* **Mô tả chi tiết:**
  - *Input:* Thao tác ký duyệt của từng cấp theo phân cấp hạn mức (Dưới 5 triệu: Trưởng phòng; Dưới 20 triệu: Kế toán trưởng; Trên 20 triệu: Tổng Giám Đốc).
  - *Xử lý logic:* Khi Lãnh đạo bấm "Phê Duyệt", hệ thống tự động gọi API Ngân hàng sinh mã chuyển khoản QR ngân hàng Napas 24/7 chứa chính xác số tiền và cú pháp giao dịch duy nhất. Thủ quỹ quét mã thanh toán từ app ngân hàng; hệ thống ngân hàng bắn Webhook về máy chủ trong 1 giây để tự động gạch nợ và chuyển trạng thái tờ trình sang "Đã giải ngân".
  - *Output:* Khoản chi được quyết toán tức thì, ghi nhận ngay vào Sổ quỹ chi (`/expenses`).
* **API Endpoint:** `POST /api/operations/finance/approvals/:id/approve` · `GET /api/operations/finance/approvals/:id/qr`

---

### MODULE 12: PHÂN HỆ HIỆP HỘI CLB DOANH NHÂN CEO 1983

#### FR-12.01: Thẻ Hội Viên Điện Tử CEO 1983 & Quyền Lợi Hội Viên
* **Actor:** Hội viên CLB Doanh Nhân CEO 1983.
* **Mô tả chi tiết:**
  - *Input:* Đăng nhập vào cổng Hiệp hội `/association`.
  - *Xử lý logic:* Hiển thị Thẻ hội viên số Classic Navy & Amber Gold dập nổi logo CEO 1983, Mã hội viên (VD: `M1983-001`), Chức vụ (Chủ Tịch, Phó Chủ Tịch, Tổng Thư Ký, Hội Viên Chính Thức), Ngày hết hạn hội phí, và mã QR tích hợp NFC. Hiển thị danh mục đặc quyền ưu đãi dành riêng cho hội viên.
  - *Output:* Thẻ hội viên danh giá, sang trọng.
* **API Endpoint:** `GET /api/association/card` · `GET /api/association/benefits`

#### FR-12.02: Đóng & Gia Hạn Hội Phí Niên Liễm Qua VietQR Tự Động
* **Actor:** Hội viên CLB Doanh Nhân CEO 1983.
* **Mô tả chi tiết:**
  - *Input:* Thao tác bấm "Gia Hạn Hội Phí" trên màn hình `/association/renew`.
  - *Xử lý logic:* Hiển thị mức hội phí niên liễm chuẩn kèm mã VietQR Napas ngân hàng của CLB Doanh Nhân CEO 1983. Khi hội viên chuyển khoản thành công, hệ thống nhận tín hiệu gạch nợ tự động gia hạn thẻ thêm 365 ngày, xuất biên lai thu tiền điện tử và gửi thông báo chúc mừng.
  - *Output:* Thẻ hội viên được gia hạn ngay lập tức mà không cần thư ký can thiệp thủ công.
* **API Endpoint:** `POST /api/association/renew/checkout` · `GET /api/association/renew/status`

---

### MODULE 13: TRÍ TUỆ NHÂN TẠO AI COPILOT & TỰ ĐỘNG HÓA VẬN HÀNH

#### FR-13.01: AI Copilot Đàm Thoại Điều Hành Chiến Lược C-Level
* **Actor:** CEO, COO, CFO, Quản Trị Viên.
* **Mô tả chi tiết:**
  - *Input:* Câu hỏi hoặc yêu cầu điều hành bằng ngôn ngữ tự nhiên (tiếng Việt).
  - *Xử lý logic:* Tích hợp mô hình ngôn ngữ lớn (LLM) kết hợp cơ sở tri thức nghiệp vụ nội bộ (RAG). Trợ lý AI phân tích dữ liệu bán hàng, công việc, tài chính và đưa ra câu trả lời súc tích kèm số liệu trích dẫn cụ thể.
  - *Output:* Câu trả lời thông minh, bảng phân tích số liệu hoặc bản thảo văn bản chỉ đạo.
* **API Endpoint:** `POST /api/ai/chat`

#### FR-13.02: Máy Quét OCR AI Nhận Diện Danh Thiếp Đối Tác
* **Actor:** Doanh nhân, Nhân viên kinh doanh.
* **Mô tả chi tiết:**
  - *Input:* Ảnh chụp danh thiếp giấy truyền thống từ camera điện thoại.
  - *Xử lý logic:* Thuật toán thị giác máy tính OCR AI tự động nhận diện và bóc tách chuẩn xác 7 trường thông tin: Họ tên, Chức vụ, Tên công ty, Số điện thoại, Email, Địa chỉ văn phòng, và Website.
  - *Output:* Điền tự động vào biểu mẫu lưu khách hàng mới trong 1 giây, cho phép người dùng chỉnh sửa trước khi lưu.
* **API Endpoint:** `POST /api/ai/card-ocr`

#### FR-13.03: Nhật Ký Kiểm Toán Năng Lực AI (AI Audit Log)
* **Actor:** Quản Trị Viên (Admin), CEO.
* **Mô tả chi tiết:**
  - *Input:* Mọi tác vụ AI được kích hoạt trong hệ thống.
  - *Xử lý logic:* Tự động ghi nhật ký bất biến vào cơ sở dữ liệu phân loại chuẩn 6 nhóm năng lực: (1) AI Copilot đàm thoại điều hành, (2) Quét danh thiếp OCR AI, (3) Tự động hóa Excel, (4) Soạn thảo hợp đồng, (5) Gợi ý đối tác chuỗi giá trị, (6) Giám sát tải nhân sự.
  - *Output:* Bảng nhật ký kiểm toán minh bạch tại `/platform/ai-audit` phục vụ công tác thanh tra dữ liệu.
* **API Endpoint:** `GET /api/ai/audit-logs`

---

### MODULE 14: KHO TÀI LIỆU & HỢP ĐỒNG ĐIỆN TỬ

#### FR-14.01: Quản Trị Kho Văn Kiện & Hợp Đồng Phân Quyền
* **Actor:** Toàn bộ User Roles.
* **Mô tả chi tiết:**
  - *Input:* Tệp tin văn kiện, hợp đồng kinh tế, điều lệ hiệp hội, quyết định bổ nhiệm (PDF, Docx, Xlsx).
  - *Xử lý logic:* Phân loại theo thư mục và cấp độ bảo mật (Công khai, Nội bộ, Tuyệt mật). Lưu trữ an toàn trên MinIO S3 có mã hóa.
  - *Output:* Kho tài liệu số hóa tìm kiếm tức thì theo từ khóa và nhãn tag.
* **API Endpoint:** `GET /api/documents` · `POST /api/documents` · `GET /api/documents/:id`

---

## 4. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

### 4.1. Hiệu Năng & Khả Năng Mở Rộng (Performance & Scalability)
* **Thời gian phản hồi API:** Tối đa 150ms đối với 95% các yêu cầu truy vấn thông thường (p95 < 150ms); tối đa 500ms đối với các báo cáo tài chính phức tạp.
* **Khả năng chịu tải đồng thời:** Hệ thống chịu tải tối thiểu 10,000 người dùng hoạt động đồng thời (CCU) mà không bị suy giảm hiệu năng.
* **Tốc độ soát vé QR Code:** Thời gian giải mã và xác thực vé check-in tại cửa an ninh đại hội không vượt quá 0.2 giây/người.
* **Thời gian tải trang Web (Page Load):** Lần tải đầu tiên dưới 1.5 giây; các lần chuyển trang nội bộ SPA dưới 0.3 giây nhờ kiến trúc TanStack Cache.

### 4.2. An Toàn & Bảo Mật Hệ Thống (Security Requirements)
* **Mã hóa dữ liệu:** Toàn bộ dữ liệu nhạy cảm (mật khẩu, thông tin cá nhân, số dư tài chính) được mã hóa ở trạng thái nghỉ (Data at Rest) bằng thuật toán chuẩn quân đội AES-256. Toàn bộ dữ liệu truyền trên đường truyền (Data in Transit) bắt buộc sử dụng giao thức TLS 1.3 với chứng chỉ SSL hợp lệ.
* **Kiểm soát truy cập:** Xác thực người dùng qua mã khóa JWT lưu trữ trong Cookie an toàn (`HttpOnly`, `Secure`, `SameSite=Lax`) chống tấn công XSS và trộm cắp phiên làm việc.
* **Bảo vệ chống tấn công mạng:**
  - Tích hợp lớp phòng thủ chống tấn công từ chối dịch vụ (DDoS) bằng kỹ thuật giới hạn tần suất (Rate Limiting) tối đa 100 requests/phút/IP.
  - Chống tấn công giả mạo yêu cầu (CSRF) và tiêm mã độc (SQL Injection) 100% thông qua tầng trừu tượng Prisma ORM có tham số hóa truy vấn.
* **Đóng dấu bản quyền danh tính (Watermark):** Hình ảnh danh thiếp và tài liệu mật khi hiển thị tự động được nhúng watermark bán trong suốt chứa mã định danh người xem để chống rò rỉ chụp ảnh màn hình.

### 4.3. Tính Khả Dụng & Trải Nghiệm Người Dùng (Usability)
* **Thiết kế thân thiện di động (Mobile-First):** Giao diện ứng dụng di động tối ưu cho thao tác bằng một tay (One-Hand Thumb Zone); các nút bấm chính (như nút V mạ vàng) đặt ở vị trí ngón tay cái dễ tiếp cận nhất.
* **Hỗ trợ đa ngôn ngữ:** Hỗ trợ song ngữ chuẩn Tiếng Việt và Tiếng Anh.
* **Chế độ hiển thị cao cấp:** Hỗ trợ mượt mà cả Giao diện Tối sang trọng (Dark Obsidian Luxury cho Doanh nhân) và Giao diện Sáng tinh tế (Classic Light cho Khối Văn phòng).

### 4.4. Độ Tin Cậy & Dự Phòng Thảm Họa (Reliability & Disaster Recovery)
* **Cam kết độ sẵn sàng (SLA):** Đạt tối thiểu 99.98% thời gian hoạt động liên tục (Uptime) trong năm.
* **Chính sách sao lưu tự động:** Cơ sở dữ liệu được sao lưu toàn phần (Full Backup) vào 03:00 AM hàng ngày và sao lưu vi sai (Differential Backup) mỗi 2 giờ. Bản sao lưu được mã hóa và lưu trữ tại cụm máy chủ dự phòng tách biệt về mặt địa lý.
* **Chỉ số phục hồi:** Mục tiêu điểm phục hồi RPO < 2 giờ; Mục tiêu thời gian phục hồi RTO < 30 phút khi xảy ra sự cố phần cứng.

---

## 5. YÊU CẦU GIAO TIẾP HỆ THỐNG & TÍCH HỢP (SYSTEM INTERFACES)

### 5.1. Cổng Thanh Toán Chuyển Khoản QR Ngân Hàng (VietQR Napas 24/7)
* **Đơn vị cung cấp:** Mạng lưới chuyển mạch tài chính quốc gia Napas / Open Banking API.
* **Mục đích:** Tự động sinh mã VietQR động chứa đúng số tiền và nội dung thanh toán cho các khoản thu: Phí hội viên thường niên, Vé sự kiện, và Đề nghị thanh toán chi phí. Nhận tín hiệu Webhook tức thời để tự động gạch nợ sau 1 giây.

### 5.2. Dịch Vụ Thư Điện Tử Thông Báo (SMTP & SendGrid API)
* **Đơn vị cung cấp:** SendGrid / Amazon SES / Máy chủ SMTP nội bộ doanh nghiệp.
* **Mục đích:** Gửi email kích hoạt tài khoản hội viên mới, gửi mã OTP khôi phục mật khẩu, gửi báo giá điện tử B2B đính kèm tệp PDF, và thư mời tham dự đại hội.

### 5.3. Dịch Vụ Tin Nhắn SMS OTP Thương Hiệu (SMS Brandname)
* **Đơn vị cung cấp:** Viettel Telecom / VNPT Business SMS.
* **Mục đích:** Xác thực giao dịch phê duyệt chi ngân sách lớn (> 20 triệu VNĐ) và xác minh số điện thoại chính chủ của đại biểu tham gia bầu cử đại hội.

### 5.4. Hệ Thống Lưu Trữ Đám Mây Đối Tượng (MinIO S3 Object Storage)
* **Đơn vị cung cấp:** Cụm máy chủ lưu trữ MinIO S3 phân tán.
* **Mục đích:** Lưu trữ toàn bộ ảnh đại diện, ảnh danh thiếp, ảnh chụp nhận diện khuôn mặt chấm công, hợp đồng kinh tế và tài liệu sự kiện với cơ chế cấp phát đường dẫn truy cập có chữ ký tạm thời (Presigned URL) bảo mật.

### 5.5. Dịch Vụ Thông Báo Đẩy Di Động (Push Notifications)
* **Đơn vị cung cấp:** Expo Push Notification Service & Firebase Cloud Messaging (FCM).
* **Mục đích:** Bắn thông báo đẩy tức thời tới màn hình khóa điện thoại của lãnh đạo và nhân viên khi có: Tờ trình chi mới cần duyệt, Lời mời hẹn gặp 1-1, Nhắc việc sắp đến hạn chót, và Tin nhắn mới.

### 5.6. Động Cơ Trí Tuệ Nhân Tạo (AI Intelligence Engine)
* **Đơn vị cung cấp:** Google Gemini Pro API / OpenAI LLM kết hợp OCR Tesseract Engine.
* **Mục đích:** Cung cấp năng lực đàm thoại điều hành C-Level cho AI Copilot, trích xuất dữ liệu danh thiếp OCR, và phân tích phát hiện rủi ro quá tải nhân sự.

---

## 6. KÝ DUYỆT ĐẶC TẢ YÊU CẦU & BÀN GIAO KỸ THUẬT

Tài liệu Đặc tả Yêu cầu Phần mềm (SRS) này đã được rà soát chéo giữa Ban Công Nghệ VioConnect và đại diện Ban Điều Hành Doanh Nghiệp & Hiệp Hội, thống nhất áp dụng làm tiêu chuẩn cơ sở nghiệm thu bàn giao 100% tính năng phần mềm.

| Đại Diện Ban Dự Án / Kỹ Thuật | Trưởng Ban Đảm Bảo Chất Lượng (QA) | Giám Đốc Công Nghệ (CTO) |
| :---: | :---: | :---: |
| 



**Nguyễn Minh Đăng**
Senior BA / System Architect | 



**Trần Thu Hà**
QA Lead / Test Manager | 



**Lê Quốc Dũng**
Chief Technology Officer |
