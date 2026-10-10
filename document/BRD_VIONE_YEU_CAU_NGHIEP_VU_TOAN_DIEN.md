# TÀI LIỆU YÊU CẦU NGHIỆP VỤ DOANH NGHIỆP TOÀN DIỆN (BRD MASTER 6.5)
## HỆ ĐIỀU HÀNH DOANH NGHIỆP TOÀN DIỆN VIONE & MẠNG XÃ HỘI GIAO THƯƠNG DOANH NHÂN VIONE CONNECT
### PHIÊN BẢN HỢP NHẤT TOÀN DIỆN 6.5 (THẨM ĐỊNH THỰC TẾ MÃ NGUỒN 100% - ZERO MOCK DATA)

---

### THÔNG TIN KIỂM SOÁT TÀI LIỆU (DOCUMENT CONTROL)
* **Tên dự án:** Hệ Sinh Thái Quản Trị Doanh Nghiệp Toàn Diện ViOne & Mạng Xã Hội Giao Thương Doanh Nhân ViOne Connect
* **Đơn vị phát triển:** Ban Công Nghệ & Chuyển Đổi Số — Tập Đoàn Công Nghệ VioConnect
* **Mã tài liệu:** `BRD-VIONE-ENTERPRISE-CONNECT-MASTER-V6.5`
* **Phiên bản:** `6.5 Master Enterprise Release` (Thẩm định khớp 100% mã nguồn Backend NestJS, Frontend Web CRM, Database PostgreSQL và Mobile App Native / PWA)
* **Ngày phát hành:** 10/10/2026
* **Cấp độ bảo mật:** TÀI LIỆU BẢO MẬT NỘI BỘ — LƯU HÀNH GIỚI HẠN
* **Trạng thái thẩm định:** Đã kiểm thử chức năng thực tế trên Web CRM (Port 5446/5445), PWA Web Mobile (/connect-app), và Mobile App Native (Android Release APK & iOS WebClip)

---

## MỤC LỤC TỔNG QUAN

1. **BÁO CÁO THẨM ĐỊNH HIỆN TRẠNG & TUYÊN NGÔN 5 NGUYÊN TẮC BẤT BIẾN**
2. **BỐI CẢNH CHIẾN LƯỢC, TẦM NHÌN & MỤC TIÊU KINH DOANH SMART**
3. **PHÂN TÍCH 8 CHÂN DUNG NGƯỜI DÙNG & MÔ HÌNH VẬN HÀNH (AS-IS VS TO-BE)**
4. **MÔ TẢ CHI TIẾT 24 MODULES HỆ THỐNG WEB CRM VIONE (DOANH NGHIỆP)**
5. **MÔ TẢ CHI TIẾT TOÀN DIỆN CÁC CHỨC NĂNG CỦA ỨNG DỤNG DI ĐỘNG APP VIONE (NATIVE & PWA)**
6. **HỆ THỐNG 95 QUY TẮC NGHIỆP VỤ CỐT LÕI (BUSINESS RULES - 6 NHÓM)**
7. **MA TRẬN PHÂN QUYỀN RBAC 7 NHÓM VAI TRÒ x 6 THAO TÁC & QUY TẮC SỞ HỮU DỮ LIỆU**
8. **YÊU CẦU PHI CHỨC NĂNG (ENTERPRISE NFR) & KIẾN TRÚC DỮ LIỆU THỰC TẾ**
9. **KẾ HOẠCH TRIỂN KHAI, ĐỐI SOÁT & TIÊU CHUẨN NGHIỆM THU**

---

## 1. BÁO CÁO THẨM ĐỊNH HIỆN TRẠNG & TUYÊN NGÔN 5 NGUYÊN TẮC BẤT BIẾN

### 1.1. Báo cáo thẩm định hiện trạng mã nguồn
Toàn bộ tài liệu BRD Master 6.5 được thẩm định chéo trực tiếp trên mã nguồn thực tế của hệ sinh thái ViOne:
- **Backend NestJS (`apps/vione_app_be`):** 18 modules nghiệp vụ, tầng Repository Pattern chuẩn Enterprise bóc tách 100% raw SQL khỏi Domain Services, hệ thống DTOs độc lập (Single Responsibility Principle) tích hợp `class-validator`, `VietnameseValidationPipe`, bộ lọc bắt lỗi `AllExceptionsFilter` trả về JSON envelope đồng bộ, kết nối CSDL PostgreSQL độc lập qua Prisma ORM, dịch vụ lưu trữ MinIO S3 Object Storage, và Socket.IO WebSockets Gateway.
- **Frontend Web CRM & PWA (`apps/vione_app_fe`):** TanStack React Start, Vite, React 19, TailwindCSS 4, hỗ trợ chế độ kép Web CRM Doanh nghiệp và PWA Mobile App (`/connect-app`).
- **Mobile Native App (`apps/mobile_vione`):** Ứng dụng thuần Native React Native (Expo SDK 52) với Hermes JS Engine, đóng gói sẵn bytecode ngoại tuyến, tích hợp `expo-camera`, `StickyBrandHeader`, Logo vector mạ vàng `ViOneLogo.tsx` 53x20, và hơn 18 modals nghiệp vụ chuyên sâu.

### 1.2. Tuyên ngôn 5 Nguyên Tắc Kỹ Thuật Bất Biến (Strict Engineering & Product Principles)
1. **100% CSDL Thực Tế PostgreSQL - Tuyệt Đối Không Mock Data / Fake Data:**
   - Nghiêm cấm mọi hình thức hardcode dữ liệu tĩnh, tạo mảng giả lập (`INITIAL_*`, `MOCK_*`, `fallbackList`, `dummyFallback`) ở tất cả các component Frontend.
   - Nghiêm cấm sử dụng các hàm giả lập chỉ số (`Math.max(dbValue, 33)`, `Math.max(..., 475000000)`) để "làm đẹp" số liệu KPI khi CSDL chưa có dữ liệu. Mọi chỉ số KPI, biểu đồ, bảng danh sách phản ánh 100% bản ghi thực từ PostgreSQL; nếu CSDL trống thì hiển thị giá trị 0 hoặc giao diện **EmptyState** chuẩn mực.
2. **Nhận Diện Thương Hiệu Champagne Gold Thượng Lưu (Nghiêm Cấm Màu Cam & Xanh Hiệp Hội):**
   - Bộ nhận diện độc quyền của ViOne là **Vàng Đồng Champagne Gold** (`#DFB76C`, `#D4AF37`, `#F5C542`, `#B8860B`) phối hợp cùng nền **Đen Thạch Anh Obsidian Navy** (`#0B0F17`, `#0E1522`) hoặc **Trắng Ngọc Trai Tinh Tế** (`#FFFFFF`).
   - Nghiêm cấm tuyệt đối việc sử dụng màu cam (`orange-*`, `amber-600/700`) hoặc màu xanh blue hiệp hội cũ (`#0052CC`, `#003B95`).
3. **Phân Quyền Realtime UI & Phân Quyền Sở Hữu Dữ Liệu Chặt Chẽ (Data Ownership):**
   - **Chỉ có 2 vai trò to nhất hệ thống:** Role **Quản Trị (`quan_tri`)** (to nhất toàn hệ thống) và Role **Admin (`admin`)** (to thứ hai). Tuyệt đối không tồn tại role "Platform Admin".
   - **Quy tắc sở hữu dữ liệu:** Không tài khoản nào được phép chỉnh sửa bản ghi do tài khoản khác tạo ra (`canEditRecord(user, recordCreatorId)`), **TRỪ KHI** tài khoản đó mang role Quản Trị hoặc Admin.
   - **Realtime UI Sync:** Khi phân quyền thay đổi, giao diện tự động ẩn ngay các nút bấm, tabs mà không cần người dùng reload trang.
4. **Phân Lập Tuyệt Đối Giao Việc vs Nhận Việc:**
   - Chức năng Giao việc chỉ hiển thị cho Role Quản Trị, Role Admin và người thiết lập công ty tại cộng đồng (`isAssigner`).
   - Các tài khoản role nhân viên/thành viên thường bị ẩn hoàn toàn tab Giao việc & nút Giao việc mới; chỉ thấy tab "⚡ Nhận việc (Việc của tôi)" để tiếp nhận task qua nút **`[⚡ TIẾN HÀNH NHẬN VIỆC]`**, cập nhật tiến độ % (0-100%) và gửi báo cáo.
5. **Hệ Sinh Thái Phân Phối Đa Nền Tảng (Dual APK & iOS WebClip):**
   - Bản **PWA APK Siêu Tốc (~3.18 MB)** đóng gói qua Capacitor Android (`release_apk/ViOne-PWA-latest.apk`).
   - Bản **Native Standalone APK (~81.59 MB)** đóng gói qua React Native Gradle Release (`release_apk/ViOne-Connect-latest.apk`) chạy độc lập offline không phụ thuộc Metro server.
   - Bản **iOS Safari WebClip Profile (`.mobileconfig`)** cho phép người dùng iPhone cài đặt ứng dụng 1-chạm ra Màn hình chính tương tự file APK trên Android.

---

## 2. BỐI CẢNH CHIẾN LƯỢC, TẦM NHÌN & MỤC TIÊU KINH DOANH SMART

### 2.1. Bối cảnh chuyển đổi số của Doanh nghiệp 2026
Bước sang năm 2026, các doanh nghiệp tại Việt Nam đối mặt với 4 thách thức vận hành lớn:
1. **Dữ liệu phân mảnh:** Sử dụng nhiều công cụ rời rạc (Zalo để giao việc, Excel tính lương, máy vân tay chấm công, giấy tờ trình ký) khiến lãnh đạo C-Level mù mờ về sức khỏe doanh nghiệp thời gian thực.
2. **Lãng phí chi phí hành chính:** Quy trình ký duyệt giấy tờ thủ công, đối soát chuyển khoản chậm trễ gây thất thoát 35-40% nguồn lực hữu ích.
3. **Đứt gãy giao thương B2B:** 88% danh thiếp giấy trao đổi tại sự kiện bị lãng quên hoặc vứt bỏ sau 1 tuần. Thiếu nền tảng số định danh uy tín để kết nối và duy trì tương tác hợp tác.
4. **Trải nghiệm di động thiếu đồng bộ:** Các hệ thống CRM truyền thống cồng kềnh, không tối ưu cho smartphone, thiếu tính năng làm việc ngoại tuyến và không có khả năng kết nối một chạm NFC.

### 2.2. Tầm nhìn 3 Trụ Cột Hợp Nhất ViOne Platform
ViOne định vị là **Hệ Điều Hành Doanh Nghiệp Toàn Diện & Mạng Xã Hội Giao Thương Doanh Nhân Hợp Nhất**, gồm 3 trụ cột:
- **Trụ cột 1: Web CRM Quản Trị Doanh Nghiệp C-Level:** Bảng điều hành C-Level Executive Dashboard, Đa chi nhánh Multi-Tenant, Quản lý phễu khách hàng B2B, Quy trình công việc Kanban, Quản trị nhân sự & chấm công GPS/FaceID, Duyệt chi 3 cấp Napas VietQR tự động.
- **Trụ cột 2: Ứng Dụng Di Động Doanh Nhân ViOne Connect:** Thiết kế Dark Obsidian & Champagne Gold thượng lưu, Thẻ Doanh nhân Titanium NFC & QR với Bottom Sheet vuốt tay xuống, Dải Story 24h, B2B Moments, Pipeline khách hàng CRM B2B, Quét danh thiếp OCR, Hộp thư tin nhắn Messenger 4 danh mục, Sàn cơ hội & Showcase sản phẩm.
- **Trụ cột 3: Trí Tuệ Nhân Tạo ViOne AI Copilot 6.0:** Trợ lý ảo đàm thoại điều hành giọng nói tiếng Việt, nhận diện danh thiếp OCR, tự động xuất file Excel, Word, PDF động từ CSDL PostgreSQL, ghép nối đối tác và cảnh báo vận hành quá hạn SLA.

### 2.3. Mục tiêu SMART & Khung ROI 3 năm
* **Tiết kiệm 45% chi phí vận hành hành chính** nhờ số hóa 100% quy trình giao việc, chấm công, nộp đơn nghỉ phép và phê duyệt chi tiền.
* **Rút ngắn 60% chu kỳ bán hàng (Sales Cycle):** Phản hồi thông tin khách hàng tiềm năng dưới 15 phút; xuất bản báo giá điện tử trong 2 phút.
* **Tăng 4 lần hiệu suất kết nối B2B:** 100% lãnh đạo doanh nghiệp được cấp Danh thiếp số Titanium NFC, tăng 4 lần tỷ lệ chuyển đổi kết nối thành công.
* **Loại bỏ 100% sai sót đối soát tài chính:** Tự động hóa gạch nợ thanh toán thu chi qua mã chuyển khoản QR ngân hàng Napas 24/7 trong 1 giây.
* **Tự động hóa 90% công tác tổ chức sự kiện & hội thảo B2B:** Soát vé check-in tại cửa dưới 0.2 giây/người; cấp vé QR VIP tự động.

| Năm Tài Chính | Chi Phí Đầu Tư (VND) | Giá Trị Lợi Ích & Doanh Thu Tăng Thêm (VND) | Tỷ Lệ Lợi Tức ROI |
| :--- | :---: | :---: | :---: |
| **Năm 1** | 180,000,000 | 480,000,000 | **166.7%** |
| **Năm 2** | 60,000,000 | 720,000,000 | **300.0%** |
| **Năm 3** | 60,000,000 | 1,050,000,000 | **450.0%** |

---

## 3. PHÂN TÍCH 8 CHÂN DUNG NGƯỜI DÙNG & MÔ HÌNH VẬN HÀNH (AS-IS VS TO-BE)

### 3.1. Phân tích 8 Chân Dung Người Dùng (Personas)
1. **Role Quản Trị (`quan_tri`):** Vai trò cao nhất toàn hệ thống, toàn quyền quản trị nền tảng, thiết lập phân quyền RBAC ma trận, xem và **chỉnh sửa mọi bản ghi do bất kỳ ai tạo ra**.
2. **Role Admin (`admin`):** Vai trò cao thứ hai toàn hệ thống, điều hành vận hành, được phép giao việc, xem và **chỉnh sửa bản ghi do các tài khoản khác tạo ra**.
3. **Tổng Giám Đốc / Chủ Tịch (CEO):** Cần nắm bắt tức thời toàn bộ chỉ số kinh doanh, dòng tiền, duyệt chi từ xa mọi lúc mọi nơi trên smartphone và nhận báo cáo điều hành qua AI Copilot.
4. **Giám Đốc Vận Hành (COO):** Cần công cụ trực quan để điều phối quy trình công việc, cân bằng tải nhân sự (Workload Heatmap), không để nhân viên quá tải (> 45h/tuần).
5. **Giám Đốc Tài Chính (CFO):** Cần kiểm soát chặt chẽ ngân sách từng phòng ban, thẩm tra đề nghị chi 3 cấp chống chi trùng hóa đơn, và dự phóng dòng tiền thu chi thực tế.
6. **Giám Đốc Kinh Doanh (Sales Manager):** Cần phễu quản trị khách hàng Smart CRM 360°, giám sát cơ hội thầu, khóa hạn mức chiết khấu và xuất báo giá PDF chuyên nghiệp.
7. **Nhân Viên Chuyên Môn (Staff):** Cần danh sách công việc rõ ràng với checklist, hạn chót deadline, tiếp nhận việc bằng nút **`[⚡ TIẾN HÀNH NHẬN VIỆC]`**, cập nhật tiến độ % (0-100%) và nộp đơn nghỉ phép online.
8. **Doanh Nhân / Đối Tác B2B (Partner):** Cần chạm danh thiếp Titanium NFC để kết nối đối tác, tham gia sàn cơ hội B2B, trao đổi đề xuất hẹn gặp 1-1 qua chat và mở rộng mạng lưới giao thương.

### 3.2. Mô hình As-Is vs To-Be trên 5 Luồng Nghiệp Vụ Cốt Lõi
* **Quản trị Khách hàng CRM:** As-Is ghi chép rời rạc trong sổ tay/Excel $\rightarrow$ To-Be quản lý tập trung trên Phễu bán hàng Smart CRM 360°, chấm điểm AI Lead Score, tự động nhắc nhở SLA.
* **Quy trình Công việc Workflow:** As-Is giao việc trôi trên Zalo/Telegram $\rightarrow$ To-Be bảng Kanban kéo thả, checklist 100% mới cho hoàn tất, phát sáng đỏ cảnh báo quá hạn.
* **Chấm công HRM:** As-Is máy vân tay dễ gian lận và tốn công dò Excel $\rightarrow$ To-Be định vị GPS văn phòng ≤ 50m kết hợp AI FaceID liveness ≥ 92%, khóa công tự động lúc 23:59 ngày mùng 2 hàng tháng.
* **Phê duyệt Chi Tiền:** As-Is đề nghị chi in giấy ký tay mất vài ngày $\rightarrow$ To-Be duyệt điện tử 3 cấp Maker-Checker-Approver, Napas VietQR gạch nợ tự động trong 1 giây, khử trùng hóa đơn.
* **Giao thương Doanh nhân:** As-Is danh thiếp giấy tốn kém, 88% bị vứt bỏ $\rightarrow$ To-Be thẻ Titanium NFC chạm mở hồ sơ số không cần cài app, 1-chạm lưu danh bạ .vcf, đề xuất hẹn gặp tương tác qua chat.

---

## 4. MÔ TẢ CHI TIẾT 24 MODULES HỆ THỐNG WEB CRM VIONE (DOANH NGHIỆP)

Hệ thống Web CRM ViOne (`apps/vione_app_fe`) bao quát trọn vẹn 24 modules nghiệp vụ chuyên sâu, kết nối trực tiếp CSDL PostgreSQL qua NestJS Backend RESTful APIs, hoàn toàn không có dữ liệu mock:

### Module 01: Bảng Điều Hành Lãnh Đạo Tổng Quan (Executive Overview Dashboard 360°)
- **Mục tiêu:** Cung cấp cho Ban Lãnh Đạo (CEO, COO, CFO) cái nhìn 360 độ về toàn bộ hoạt động kinh doanh, tài chính và nhân sự của doanh nghiệp theo thời gian thực.
- **Tính năng chi tiết:**
  * **Khối KPI Thời Gian Thực:** Thống kê Doanh thu ròng, Tăng trưởng, Tổng khách hàng, Hiệu suất dự án, Tỷ lệ chuyên cần nhân sự. Dữ liệu được tính toán 100% từ PostgreSQL, triệt tiêu hoàn toàn `Math.max` và `dummyFallback`.
  * **Phân Tích Lưu Lượng Web Landing Doanh Nghiệp:** Tích hợp 3 bộ lọc thời gian tương tác (Ngày, Tuần, Tháng); biểu đồ AreaChart mạ vàng Champagne Gold biểu diễn biến động truy cập; bảng xếp hạng Top trang đích truy cập nhiều nhất và tỷ lệ thiết bị (Mobile vs Desktop) từ bảng `landing_page_visits`. Nút xuất Excel phân tích lưu lượng.
  * **Báo Cáo Sổ Cái Thu - Chi Thực Tế:** Bộ chuyển đổi Tuần / Tháng; biểu đồ BarChart dòng tiền đa màu; bảng cơ cấu chi phí theo danh mục (Lương, Vận hành, Tiếp thị, Công tác); thanh đo tiến độ thu hồi công nợ. Nút xuất Excel sổ cái thu chi.
  * **Danh Mục Sản Phẩm & Dịch Vụ Chủ Lực:** Hiển thị thanh tiến độ doanh thu niêm yết, số lượng sản phẩm đang giao dịch trên sàn Marketplace, liên kết trực tiếp tới `/marketplace`.
  * **Nhiệm Vụ Điều Hành Khẩn Cấp (Urgent Tasks):** Nạp danh sách các công việc sắp hoặc đã quá hạn từ `/operations/workflow/tasks` kèm badge cảnh báo đỏ, người phụ trách và nút xem chi tiết.
  * **Quy chuẩn hiển thị:** Toàn bộ bảng dữ liệu tự động sắp xếp theo `createdAt DESC` (bản ghi mới nhất luôn nằm trên đầu); tích hợp component `DashboardCellTooltip` tự động cắt chuỗi dài với dấu `...` và hiển thị tooltip nổi cao cấp khi rê chuột.

### Module 02: Quản Trị Khách Hàng Thông Minh (Smart Customer CRM Hub & Hồ Sơ 360°)
- **Mục tiêu:** Thu thập, quản trị và tối ưu hóa tỷ lệ chuyển đổi khách hàng từ mọi điểm chạm (NFC Tap, Quét thẻ OCR, Mạng lưới B2B, Website Lead).
- **Tính năng chi tiết:**
  * **4 Thẻ Chỉ Số Phễu Pipeline:** Tổng khách hàng, Lead nóng AI (AI Lead Score ≥ 80), Cảnh báo quá hạn SLA chăm sóc, Tổng giá trị deal tiềm năng.
  * **Bộ Lọc Đa Chiều:** Lọc theo nguồn chuyển đổi (NFC Tap, Quét thẻ OCR, B2B Network, Website Lead); Lọc theo giai đoạn phễu bán hàng (Tiếp cận, Tư vấn & Báo giá, Đàm phán HĐ, Ký kết thành công); Lọc theo nhịp chăm sóc SLA (Bình thường vs Cảnh báo đỏ).
  * **Hồ Sơ Khách Hàng 360 Độ:** Hiển thị điểm tiềm năng AI Lead Score, lịch sử nhật ký chăm sóc (Touchpoint Logs), thông tin liên hệ, quy mô deal, người phụ trách.
  * **Hành Động Nhanh 1-Chạm:** Gọi điện thoại trực tiếp, Gửi Email, Sao chép AI Sales Pitch 1-chạm, Thêm khách hàng mới (`handleAddCustomer` gọi `POST /connect-app/customers` ghi trực tiếp vào CSDL), Xuất báo cáo CSV.

### Module 03: Quản Lý Khách Hàng Doanh Nghiệp B2B (Enterprise Accounts & B2B Pipeline)
- **Mục tiêu:** Quản lý cơ sở dữ liệu đối tác doanh nghiệp, khách hàng tổ chức và chuỗi cung ứng.
- **Tính năng chi tiết:**
  * Quản lý danh bạ doanh nghiệp đối tác: Tên công ty, Mã số thuế, Ngành nghề, Địa chỉ trụ sở, Đại diện pháp luật, Hotline.
  * Phễu cơ hội B2B (Deals Pipeline): Kéo thả Kanban qua các giai đoạn đàm phán, tính toán tự động giá trị hợp đồng dự kiến và xác suất chốt deal thành công.

### Module 04: Quản Lý Đa Công Ty & Chi Nhánh (Multi-Tenant Companies & Branches)
- **Mục tiêu:** Quản trị mô hình tập đoàn, công ty mẹ - con và mạng lưới chi nhánh trên cùng một nền tảng.
- **Tính năng chi tiết:**
  * Phân vùng dữ liệu cô lập tuyệt đối giữa các công ty thành viên (Tenant Isolation).
  * Quản lý danh sách chi nhánh, cấu hình phòng ban, phân quyền Giám đốc chi nhánh.

### Module 05: Sàn Thương Mại B2B & Quản Lý Sản Phẩm (B2B Marketplace & Catalog)
- **Mục tiêu:** Số hóa danh mục sản phẩm/dịch vụ của doanh nghiệp và kết nối giao thương trong cộng đồng B2B.
- **Tính năng chi tiết:**
  * Quản lý danh mục sản phẩm/dịch vụ: Hình ảnh, giá niêm yết, quy cách đóng gói, thông số kỹ thuật, số lượng tồn kho.
  * Quy trình Yêu Cầu Báo Giá (RFQ - Request For Quote): Đối tác gửi yêu cầu báo giá trực tuyến; hệ thống tự động phát thông báo 2 chiều đến người bán và người mua.

### Module 06: Quản Lý Cơ Hội Giao Thương B2B (Opportunities & Tenders)
- **Mục tiêu:** Đăng tải và tìm kiếm các cơ hội hợp tác kinh doanh, mời thầu, tìm kiếm đại lý phân phối.
- **Tính năng chi tiết:**
  * Đăng tin cơ hội thầu: Ngành nghề, ngân sách dự kiến, phạm vi kết nối, thời hạn chào thầu, tiêu chuẩn hồ sơ.
  * Quản lý hồ sơ năng lực chào thầu (Claims), đăng ký bày tỏ quan tâm, quản lý tài liệu đính kèm.

### Module 07: Quản Trị Quy Trình Công Việc Kanban (Workflow Tasks & Checklist)
- **Mục tiêu:** Số hóa toàn bộ quy trình giao việc, thực hiện và nghiệm thu công việc trong doanh nghiệp.
- **Tính năng chi tiết:**
  * Bảng Kanban 4 cột chuẩn: Cần làm (To Do) $\rightarrow$ Đang làm (In Progress) $\rightarrow$ Chờ duyệt (Review) $\rightarrow$ Hoàn thành (Done).
  * Hạn chót Deadline: Tự động cảnh báo phát sáng đỏ khi công việc bị trễ hạn.
  * Ràng buộc Checklist: Công việc chỉ được phép kéo sang cột Hoàn thành (Done) khi toàn bộ các đầu mục trong Checklist đã được tick chọn 100% (BR-WRK-07).
  * Phân quyền sửa task: Tuân thủ nghiêm ngặt quy tắc sở hữu dữ liệu (`canEditRecord`), chỉ người tạo task hoặc tài khoản có role Quản Trị / Admin mới được mở modal chỉnh sửa nội dung công việc.

### Module 08: Giám Sát Tải Công Việc Nhân Sự (Workload Heatmap Analytics)
- **Mục tiêu:** Theo dõi và cân bằng khối lượng công việc của toàn bộ cán bộ nhân viên, chống quá tải và chống bỏ sót nhân sự.
- **Tính năng chi tiết:**
  * Ma trận nhiệt (Heatmap) thể hiện tổng số giờ làm việc được giao theo tuần của từng nhân viên.
  * Ngưỡng cảnh báo đỏ: Tự động gắn cờ cảnh báo đỏ khi nhân sự có tổng thời gian làm việc vượt quá 45 giờ/tuần (BR-WRK-05).
  * Báo cáo thống kê hiệu suất KPI hoàn thành công việc theo từng phòng ban.

### Module 09: Quản Trị Chấm Công & Hiện Diện Nhân Sự (HRM Attendance & Leaves)
- **Mục tiêu:** Tự động hóa công tác chấm công, quản lý chuyên cần và giải quyết các đơn từ hành chính.
- **Tính năng chi tiết:**
  * Giám sát chấm công thời gian thực kết nối trực tiếp bảng `member_checkins`.
  * Định vị văn phòng GPS: Yêu cầu tọa độ nằm trong bán kính ≤ 50m so với tọa độ văn phòng (BR-HRM-01).
  * Nhận diện khuôn mặt AI FaceID: Yêu cầu độ khớp khuôn mặt ≥ 92% và phát hiện khuôn mặt sống (BR-HRM-02).
  * Nút tương tác "Chấm Công AI FaceID & GPS" trên Web CRM cho phép ghi nhận tức thời dữ liệu công.
  * Quy trình nộp và duyệt đơn nghỉ phép / làm việc từ xa / công tác online 1-chạm.
  * Tự động tổng hợp và khóa bảng công lúc 23:59 ngày mùng 2 hàng tháng; nút xuất Excel bảng công chuẩn.

### Module 10: Phê Duyệt Chi Tiền 3 Cấp & Quản Trị Dòng Tiền (Payment Approvals)
- **Mục tiêu:** Kiểm soát chặt chẽ ngân sách chi tiêu, ngăn ngừa thất thoát tài chính và tự động hóa thanh toán.
- **Tính năng chi tiết:**
  * Quy trình phê duyệt 3 cấp nghiêm ngặt: Người lập đề xuất (Maker) $\rightarrow$ Kế toán kiểm tra chứng từ (Checker) $\rightarrow$ Lãnh đạo phê duyệt (Approver).
  * Hạn mức phân quyền tự động: Dưới 5 triệu VNĐ (Trưởng phòng duyệt), từ 5 đến 20 triệu VNĐ (Kế toán trưởng duyệt), trên 20 triệu VNĐ (bắt buộc Tổng Giám Đốc duyệt) (BR-FIN-02).
  * Chống chi trùng số hóa đơn: Hệ thống tự động quét và chặn tạo tờ trình nếu số hóa đơn hoặc mã cơ quan thuế đã tồn tại trên hệ thống (BR-FIN-03).
  * Thanh toán thông minh VietQR Napas 24/7: Sinh mã QR chuyển khoản ngân hàng động chứa số tiền và nội dung tờ trình, tự động gạch nợ tức thời trong 1 giây.
  * Nút xuất Excel danh sách các tờ trình chi tiền.

### Module 11: Sổ Quỹ Thu - Chi & Quản Trị Tài Chính Doanh Nghiệp (Finance & Cashflow)
- **Mục tiêu:** Quản trị dòng tiền thu chi thực tế của doanh nghiệp, theo dõi công nợ và kế hoạch tài chính.
- **Tính năng chi tiết:**
  * Quản lý phiếu thu, phiếu chi, dòng tiền ròng thu chi thực tế theo Tuần/Tháng từ bảng `transactions` và `invoices`.
  * Phân loại chi phí theo danh mục (Lương, Thuê văn phòng, Marketing, Mua sắm trang thiết bị).
  * Báo cáo tỷ lệ thu hồi công nợ và dự phóng dòng tiền 30 - 90 ngày.

### Module 12: Quản Lý Sự Kiện & Hội Thảo B2B (Events Management)
- **Mục tiêu:** Tổ chức, quản lý và tự động hóa công tác truyền thông, đăng ký và soát vé sự kiện doanh nghiệp.
- **Tính năng chi tiết:**
  * Khởi tạo sự kiện: Tên sự kiện, banner, lịch trình diễn giả, địa điểm tổ chức, phân loại vé VIP / Tiêu chuẩn.
  * Khối 3D Coverflow 5 sự kiện tiêu điểm: Lấy dữ liệu thực từ CSDL, tự động ẩn khi không có sự kiện.
  * Soát vé an ninh bằng mã QR Code siêu tốc dưới 0.2 giây/người.
  * Luồng hủy đăng ký sự kiện 1-chạm: Cho phép người tham dự hủy vé, tự động hoàn lại suất vé cho cộng đồng và gửi thông báo xác nhận.

### Module 13: Đặt Phòng Họp & Lịch Công Tác (Meeting Rooms Booking)
- **Mục tiêu:** Quản lý tài nguyên phòng họp vật lý và phòng họp trực tuyến của doanh nghiệp.
- **Tính năng chi tiết:**
  * Danh mục phòng họp: Sức chứa, danh sách trang thiết bị (máy chiếu, micro, màn hình LED, thiết bị cầu truyền hình).
  * Đặt phòng linh hoạt: Đặt phòng họp trực tiếp (Offline) hoặc phòng trực tuyến (tự động đính kèm liên kết Google Meet / Zoom).
  * Quy trình phê duyệt phòng họp và giải quyết xung đột lịch họp tự động.

### Module 14: Cuộc Gặp 1-1 Doanh Nhân B2B (1-on-1 Business Meetings)
- **Mục tiêu:** Thiết lập các cuộc gặp kết nối kinh doanh sâu giữa hai lãnh đạo doanh nghiệp.
- **Tính năng chi tiết:**
  * Form đặt lịch hẹn 1-1: Chọn ngày, khung giờ (09:00 - 17:00), hình thức gặp mặt (Phòng tiếp khách VIP Lounge hoặc Video Call trực tuyến).
  * Theo dõi lịch sử và tiến độ hợp tác sau các cuộc gặp gỡ.

### Module 15: Hộp Thư Đa Kênh Messenger & Trò Chuyện B2B (Direct Messages)
- **Mục tiêu:** Kênh giao tiếp nội bộ và trao đổi công việc bảo mật tức thời giữa các thành viên doanh nghiệp và đối tác.
- **Tính năng chi tiết:**
  * 4 danh mục chuẩn: Tất cả, Chưa đọc, Nhóm, Tin nhắn chờ.
  * Hiển thị đầy đủ 100% các cuộc hội thoại mà chính tài khoản đã chủ động nhắn tin tới (`lastMessageFromMe`).
  * Danh sách hội thoại luôn sắp xếp tin nhắn mới nhất lên đầu (`lastMessageAt DESC`).
  * Nhấp vào avatar đối phương ở danh sách hoặc thanh tiêu đề phòng chat đều mở ra Bottom Sheet danh thiếp cá nhân.
  * Đàm thoại WebRTC trực tiếp: Cuộc gọi thoại và video call chất lượng cao, tích hợp khử tiếng vọng (`echoCancellation`) và lọc tạp âm (`noiseSuppression`).

### Module 16: Khoảnh Khắc Doanh Nhân B2B (Moments & Social Feeds)
- **Mục tiêu:** Mạng xã hội thu nhỏ cho doanh nghiệp chia sẻ tin tức, văn hóa, thành tựu và câu chuyện kinh doanh.
- **Tính năng chi tiết:**
  * Soạn thảo và đăng tải bài viết: Hỗ trợ văn bản, đính kèm nhiều ảnh chụp từ camera hoặc thư viện, video và ghi âm giọng nói.
  * Tương tác C-Level: Thả tim/thích, bình luận phân cấp, gắn thẻ đối tác doanh nhân và chia sẻ bài viết vào cộng đồng.

### Module 17: Trí Tuệ Nhân Tạo Doanh Nghiệp (ViOne AI Copilot Suite)
- **Mục tiêu:** Trợ lý ảo AI thông minh toàn năng hỗ trợ đàm thoại điều hành và tự động hóa tác vụ văn phòng cho lãnh đạo.
- **Tính năng chi tiết:**
  * Đàm thoại điều hành bằng giọng nói tiếng Việt tự nhiên: Nhận diện ý định điều hành, tra cứu công việc hôm nay, phân tích chuyên cần nhân sự, tìm kiếm khách hàng tiềm năng.
  * Nhận diện và trích xuất danh thiếp OCR độ chính xác ≥ 95%.
  * Bộ công cụ sinh tài liệu đa dạng: Xuất Excel (`.xlsx` phối màu Navy & Champagne Gold sang trọng), Word (`.docx` chuẩn Office Open XML), và PDF (`.pdf` chuẩn PDF-1.4) trực tiếp từ CSDL PostgreSQL.
  * Quản lý phiên hội thoại đa dạng, lưu lịch sử chat, nhận diện chính xác danh tính và vai trò tài khoản đăng nhập để tư vấn đúng thẩm quyền.

### Module 18: Kho Tài Liệu Số Doanh Nghiệp (Digital Library)
- **Mục tiêu:** Lưu trữ, quản lý và phân quyền truy cập kho tri thức và tài liệu pháp lý của doanh nghiệp.
- **Tính năng chi tiết:**
  * Lưu trữ hợp đồng mẫu, catalogue sản phẩm, tài liệu đào tạo, quy chế công ty.
  * Phân quyền bảo mật: Xem trực tuyến, Tải về, hoặc Khóa truy cập theo vai trò người dùng; ghi nhận lịch sử tải tài liệu.

### Module 19: Quản Lý Thẻ Thông Minh NFC & Danh Thiếp Số 3D (Smart Cards & NFC Chips)
- **Mục tiêu:** Quản lý vòng đời thẻ thông minh Titanium mạ vàng cấp phát cho cán bộ lãnh đạo.
- **Tính năng chi tiết:**
  * Quản lý kho thẻ vật lý, liên kết chip NFC với tài khoản doanh nhân.
  * Tính năng khóa thẻ từ xa tức thì trong 1 giây khi phát hiện thất lạc thẻ (BR-APP-04).
  * Thống kê số lượt chạm thẻ NFC và số lượt đối tác quét mã QR để lưu danh bạ.

### Module 20: Biểu Quyết Số C-Level (Executive Voting & Resolution)
- **Mục tiêu:** Tổ chức các cuộc biểu quyết, lấy ý kiến Hội đồng quản trị, Đại hội cổ đông hoặc Ban điều hành công ty.
- **Tính năng chi tiết:**
  * Khởi tạo phiên biểu quyết: Nội dung nghị quyết, thời hạn biểu quyết, danh sách cử tri có quyền biểu quyết.
  * Bỏ phiếu điện tử bảo mật, mã hóa kết quả, tự động tổng hợp tỷ lệ tán thành và xuất biên bản kiểm phiếu.

### Module 21: Quản Lý Tài Trợ & Đặc Quyền Doanh Nghiệp (Sponsorships & Member Perks)
- **Mục tiêu:** Quản trị các gói tài trợ sự kiện và mạng lưới đặc quyền ưu đãi chéo giữa các doanh nghiệp.
- **Tính năng chi tiết:**
  * Quản lý các gói tài trợ (Kim Cương, Vàng, Bạc, Đồng), phân bổ vị trí logo và quyền lợi truyền thông.
  * Danh mục mã ưu đãi, voucher chiết khấu dành riêng cho cán bộ nhân viên của các doanh nghiệp đối tác.

### Module 22: Phân Quyền Nền Tảng RBAC Ma Trận Thực Tế (Permissions Matrix)
- **Mục tiêu:** Kiểm soát truy cập và bảo mật dữ liệu dựa trên vai trò theo ma trận 7 nhóm quyền x 6 thao tác.
- **Tính năng chi tiết:**
  * Ma trận phân quyền trực quan: 7 nhóm vai trò (CEO, COO, CFO, Sales Manager, Quản Trị / Admin, Staff, Partner) x 6 thao tác (Xem, Tạo, Sửa, Xóa, Duyệt, Xuất Dữ Liệu).
  * Cơ chế phản ứng giao diện động (Reactive State): Thay đổi quyền hạn tại tab Quản lý tài khoản sẽ cập nhật ngay lập tức số lượng và quyền hạn tại tab Nhóm quyền mà không cần reload trang.
  * Kiểm soát quyền sở hữu dữ liệu (`canEditRecord`): Khóa quyền sửa dữ liệu của người khác đối với mọi tài khoản, trừ Role Quản Trị và Role Admin.
  * Phân lập giao diện Giao việc (chỉ cấp quản lý) vs Nhận việc (dành cho nhân sự).

### Module 23: Cài Đặt Hệ Thống & Cổng Thanh Toán (System Settings)
- **Mục tiêu:** Cấu hình tham số vận hành, nhận diện thương hiệu và tích hợp các dịch vụ bên thứ ba.
- **Tính năng chi tiết:**
  * Tùy biến thông tin thương hiệu: Tên miền Website chính (`websiteUrl`), Hotline CSKH, Slogan.
  * Quản lý Logo động: Tải lên logo mới, tự động phát sự kiện `association-changed` cập nhật thời gian thực lên thanh Sidebar CRM và lưu trữ bền vững.
  * Cấu hình cổng thanh toán VietQR / PayOS, cấu hình lưu trữ MinIO S3, cấu hình máy chủ gửi email SMTP.

### Module 24: Báo Cáo Phân Tích Lưu Lượng Web & Nhật Ký Kiểm Toán (Web Traffic Analytics & Audit Log)
- **Mục tiêu:** Đo lường hiệu quả các kênh tiếp thị số và giám sát an toàn thông tin theo tiêu chuẩn ISO/IEC 27001.
- **Tính năng chi tiết:**
  * Báo cáo lưu lượng truy cập web landing page theo Ngày, Tuần, Tháng từ CSDL PostgreSQL thực tế.
  * Nhật ký kiểm toán an toàn hệ thống (Audit Log): Ghi nhận bất biến 100% các hành động đăng nhập, đổi mật khẩu, phân quyền, giao dịch tài chính, xuất dữ liệu và lịch sử các câu lệnh AI Copilot (AI Audit Log).

---

## 5. MÔ TẢ CHI TIẾT TOÀN DIỆN CÁC CHỨC NĂNG CỦA ỨNG DỤNG DI ĐỘNG APP VIONE (NATIVE & PWA)

Ứng dụng di động ViOne Connect được cung cấp đồng thời trên hai phiên bản: **Bản thuần Native React Native (`apps/mobile_vione`)** và **Bản Web PWA Mobile (`/connect-app`)**, đảm bảo tính tương đồng 100% (Design & Feature Parity) về giao diện, tính năng và luồng xử lý:

### 5.1. Kiến Trúc 2 Role Người Dùng Cốt Lõi (Two Core Roles Architecture)
Ứng dụng được thiết kế tối ưu hóa theo 2 đối tượng người dùng chính:
1. **Role 1 (Lãnh đạo, Giám đốc, CEO):**
   - ViOne gói gọn toàn bộ công việc điều hành vào một ứng dụng di động tinh gọn.
   - Trí tuệ nhân tạo AI Copilot 6.0 đóng vai trò như **Thư ký riêng toàn năng**: (a) Giao việc thông minh cho nhân sự bằng giọng nói hoặc chat lệnh ngắn, (b) Giám sát quá trình và tiến độ công việc của toàn bộ nhân viên công ty, (c) Quản trị và tối ưu hóa lịch trình, cảnh báo xung đột và bảo vệ sức khỏe CEO, (d) Mở rộng mạng lưới kết nối đối tác B2B cấp cao.
   - **Quy chuẩn Chấm công Lãnh đạo:** Tuyệt đối không để tính năng tự chấm công cá nhân cho CEO. Chức năng chuyển thành chế độ **Theo Dõi Giờ Giấc & Chuyên Cần Nhân Sự Doanh Nghiệp**: Chỉ hiển thị khi có cộng đồng công ty và có nhân viên trực thuộc.
2. **Role 2 (Nhân viên nội bộ / Bạn bè, Đối tác):**
   - **Nhân viên:** Nhận việc do sếp giao qua thông báo chuông, bấm nút **`[⚡ TIẾN HÀNH NHẬN VIỆC]`** để tiếp nhận, cập nhật thanh tiến độ % (0-100%) kèm báo cáo giải trình, nộp danh sách việc hàng loạt từ tệp Excel.
   - **Bạn bè, Đối tác B2B:** Lưu và đồng bộ danh bạ điện thoại, trao đổi Danh thiếp số Titanium NFC / QR Code, lên lịch hẹn giao thương 1-on-1.

---

### 5.2. Tab 1: Trang Chủ Executive Home & Briefing Lãnh Đạo
- **Thanh Header Thương Hiệu Dính (`StickyBrandHeader`):** Cố định trên đỉnh 4 tabs với logo vector mạ vàng `ViOneLogo.tsx` tỷ lệ chuẩn 53x20, lời chào theo thời gian thực (Buổi sáng / Buổi chiều / Buổi tối), nút chuyển đổi Theme Sáng/Tối vuông bo góc 32x32 mạ vàng, nền mờ kính `rgba(11, 15, 23, 0.95)` và viền dưới tinh tế.
- **Thanh Định Vị AI GPS:** Hiển thị vị trí thực tế của thiết bị kèm nút bật định vị, phục vụ các tính năng quét đối tác quanh đây và định vị văn phòng.
- **Khối Bàn Điều Hành Lãnh Đạo (CEO Suite) & Lịch Trình Công Việc (Editorial Schedule):**
  * Hiển thị ngày tháng năm tiếng Việt năng động kèm nút "Xem lịch" mở modal `ScheduleCalendarModal` (khớp 100% web `/connect-app/calendar`).
  * 5 Tabs phân đoạn: `Tất cả` (mặc định mở đầu tiên), `Hôm nay (N)`, `Sắp tới (N)`, `Nhắc lịch (N)`, và `🎙️ Ghi âm (N)` (tích hợp trình phát sóng âm inline audio wave player `handleTogglePlayVoice`).
  * Tùy chỉnh Briefing Hôm Nay (`TodayCustomizeSheet`): Cho phép lãnh đạo bật/tắt các danh mục hiển thị, sắp xếp thứ tự ưu tiên và giới hạn số lượng mục.
- **Thẻ Giám Sát Vận Hành & Nhân Sự C-Level (Enterprise Operations Card):**
  * **Điều kiện hiển thị:** Chỉ tài khoản có cộng đồng doanh nghiệp và có nhân sự trực thuộc (`hasCompanyWithStaff === true`) mới hiển thị thẻ này. Nếu tài khoản chưa có công ty có nhân viên, tự động ẩn và chỉ hiển thị duy nhất thẻ "Công việc & Tiến độ".
  * Đèn xanh nhấp nháy "HOẠT ĐỘNG" kèm 3 ô thống kê tương tác: (1) Giờ giấc chuyên cần nhân sự (chấm công GPS $\le 50\text{m}$ & AI FaceID), (2) Quy trình BPMN & nhân sự quá tải, (3) Phê duyệt chi 3 cấp VietQR. Bấm vào từng ô mở modal điều hành tương ứng.
- **Thẻ Cơ Hội Kết Nối Tiềm Năng (Insight Card):** Thông báo số lượng cơ hội kết nối tiềm năng cao kèm nút CTA "Khám phá ngay".
- **3 Lối Tắt Tác Vụ Nhanh (Quick Actions):**
  * Nút "Gặp gỡ" (icon `QuickMeetIcon`): Mở modal đăng khoảnh khắc doanh nhân (`PostMomentModal`).
  * Nút "Quét & Kết nối" (icon `QuickScanIcon`): Mở máy ảnh quét danh thiếp OCR AI (`CardScanReviewModal`).
  * Nút "Danh thiếp của tôi" (icon `QuickCardIcon`): Mở Bottom Sheet danh thiếp số cá nhân.
- **Khối Gợi Ý Đối Tác Hôm Nay (AI Partner Matcher):**
  * Tiêu đề `V · GỢI Ý HÔM NAY (AI)` với biểu tượng Sparkles mạ vàng.
  * 2 Thanh Filter Chips đa chiều luôn hiển thị: Lọc theo phạm vi không gian (Tất cả, Gần tôi, Cùng TP, Toàn quốc) & Lọc theo lĩnh vực và chuỗi giá trị (Công nghệ & AI, Bất động sản, Tài chính, Y tế, Bán lẻ...).
  * Danh sách đối tác tiềm năng từ CSDL kèm điểm tương thích Match Score và nút bấm kết nối nhanh.

---

### 5.3. Tab 2: Mạng Lưới Giao Thương B2B & Hộp Thư Messenger
- **Bộ Chuyển Đổi Phân Hệ Trên Header:** `[ 👥 Đối tác ]` vs `[ 💬 Tin nhắn ]` (đính kèm huy hiệu đỏ đếm số tin nhắn chưa đọc).
- **Dải Khoảnh Khắc 24h (Stories Strip):** Thanh cuộn ngang hiển thị thẻ "Tạo tin 24h" với avatar thật của tài khoản và danh sách các story 24h của mạng lưới đối tác. Bấm vào mở trình xem toàn màn hình `StoryViewerModal`.
- **Phân Hệ Đối Tác & Quản Trị Khách Hàng CRM B2B:**
  * 4 Thẻ chỉ số Pipeline điều hành mạ vàng Champagne Gold: Quy mô cơ hội, Đang đàm phán, Tỷ lệ chốt deal, Lịch chăm sóc tuần.
  * Thanh lọc giai đoạn phễu (Stage Filter Pills): Tất cả, Đàm phán, Đề xuất, Ký kết.
  * Stepper tiến trình thương lượng 4 bước tương tác: Tiếp cận $\rightarrow$ Tư vấn & Báo giá $\rightarrow$ Đàm phán HĐ $\rightarrow$ Ký kết thành công (1-chạm chuyển giai đoạn).
  * Chỉ báo sức khỏe thương vụ (Deal Health): Nóng (90%), Ổn định (70%), Cần chăm sóc (40%).
  * Dòng thời gian nhật ký chăm sóc đa kênh (Touchpoint Logs) kèm 4 phím tắt: `+ Cuộc gọi`, `+ Hẹn 1-1`, `+ Báo giá`, `+ Tin nhắn`.
  * Máy quét danh thiếp OCR AI (`CardScanReviewModal`): Chụp ảnh danh thiếp bằng camera máy, AI trích xuất 7 trường (Họ tên, chức vụ, công ty, SĐT, Email, địa chỉ, website), cho phép sửa và lưu thẳng vào danh bạ CRM.
  * Banner đề xuất kết bạn qua danh bạ điện thoại kiểu Zalo (`ContactsDiscoveryModal`).
- **Phân Hệ Hộp Thư Tin Nhắn Messenger:**
  * Tìm kiếm hội thoại, nút `+ Tạo nhóm` (`CreateGroupModal`).
  * 4 Tabs danh mục chuẩn: **Tất cả** (chứa 100% hội thoại mà chính tài khoản đã nhắn tin tới `lastMessageFromMe`, có nội dung trao đổi, nhóm, người đã kết nối), **Chưa đọc**, **Nhóm**, **Tin nhắn chờ**.
  * Quy tắc sắp xếp: Tin nhắn mới nhất luôn đưa lên vị trí đầu tiên (`lastMessageAt DESC`).
  * Nhấp vào Avatar đối phương (ở danh sách hoặc trong phòng chat) đều mở Bottom Sheet danh thiếp cá nhân.
  * Khung chat thời gian thực (`ChatThreadModal`): Bong bóng chat phân biệt rõ ràng (Vàng Hổ Phách căn phải cho tin nhắn của mình, Trắng Slate căn trái cho đối tác), thời gian, tick 2 chiều, phản hồi tức thì 0ms.
  * Thẻ đề xuất hẹn gặp 1-1 tương tác trong chat (`OpportunityMeetingProposalCard`): Có 2 nút bấm **`[⚡ ĐỒNG Ý HẸN]`** (tự động ghim lịch vào Executive Home và gửi thông báo 2 bên) và `[Từ chối]`.
  * Đàm thoại WebRTC trực tiếp: Cuộc gọi thoại và video call thời gian thực, khử tiếng vọng và lọc tạp âm.

---

### 5.4. Nút V Trung Tâm 3D & Bảng Hành Động VActionSheet
- **Nút V Trung Tâm:** Hình tròn 58x58 mạ vàng kim champagne dập nổi 3D `VIconMark.tsx` (sử dụng vector `react-native-svg`), viền kim loại kép, bóng đổ phát quang lan tỏa và hiệu ứng phản chiếu ánh kim lộng lẫy.
- **Bảng Hành Động 1-Chạm (`VActionSheet`):** Bấm nút V mở bảng điều khiển nổi từ dưới lên:
  * **Nhóm Bàn Làm Việc Lãnh Đạo (CEO Suite):** Lối tắt mở Giao việc nhân sự (`AssignTaskModal`), Giám sát tiến độ nhân viên (`StaffDailyActivityModal`), và Theo dõi giờ giấc nhân sự (`AttendanceModal`).
  * **Nhóm Giao Thương Doanh Nhân:** Lối tắt Quét danh thiếp OCR, Mở thẻ danh thiếp số, Lên lịch hẹn gặp 1-1 (`ScheduleMeetingModal`), Đăng cơ hội hợp tác (`CreateOpportunityModal`), Đăng khoảnh khắc (`PostMomentModal`), và Kích hoạt Trợ lý giọng nói AI Copilot.

---

### 5.5. Tab 3: Cộng Đồng Doanh Nghiệp 2 Phân Hệ (Dual-Community Architecture)
Ứng dụng phân lập rạch ròi 2 dạng cộng đồng với quyền hạn và luồng hành động hoàn toàn tách biệt:
1. **Cộng Đồng Mạng Lưới Doanh Nhân B2B (`b2b_networking`):**
   - **Mục đích:** Giao lưu, kết nối kinh doanh, tìm kiếm đối tác và quảng bá sự kiện giữa các Chủ tịch, CEO các công ty khác nhau.
   - **3 Nút Hành Động:** `+ Đăng cơ hội` (mở `CreateOpportunityModal`), `+ Đăng bài`, `+ Chia sẻ SK` (từ bên ngoài vào qua `ShareEventModal`).
   - **Tabs:** Cơ hội giao thương, Tin tức, Sự kiện, Thành viên.
   - **Ràng buộc:** Tuyệt đối không có giao việc nhân sự hay giám sát nội bộ.
2. **Cộng Đồng Nội Bộ Doanh Nghiệp (`company_internal`):**
   - **Mục đích:** Không gian làm việc khép kín của Giám đốc và cán bộ nhân viên trong một công ty.
   - **3 Nút Hành Động:** `+ Giao việc` (mở `AssignTaskModal`), `+ Đăng bài` (mở `CreateNewsModal`), `+ Chia sẻ SK`.
   - **Tabs:** Quản lý công việc (nhận việc 1-chạm), Giám sát CRM, Tin tức, Sự kiện, Nhân sự công ty.
   - **Quy Trình Nhận Việc 1-Chạm:** Khi Giám đốc giao việc, nhân viên thấy công việc ở trạng thái `assigned` có nút vàng nổi bật **`[⚡ TIẾN HÀNH NHẬN VIỆC]`**. Bấm nút $\rightarrow$ chuyển trạng thái sang `in_progress`, ghi nhận timestamp `acceptedAt` và bắn thông báo chuông đến Giám đốc; Modal "Cập nhật tiến độ" cho phép chọn % (0-100%) và gửi báo cáo; Modal "Nhập từ Excel" cho phép nạp danh sách việc theo phòng ban.
   - **Ràng buộc:** Tuyệt đối không đăng cơ hội giao thương B2B trong cộng đồng công ty.
- **Quản Trị Cộng Đồng Cho Quản Trị Viên/Admin:**
  * Nút bấm quản trị **`[⚙️ Chỉnh sửa cộng đồng]`** mở modal `EditCommunityModal` cho phép Quản trị viên cập nhật: Tên cộng đồng, Ảnh đại diện, Ảnh bìa, Tagline, Giới thiệu và Loại hình cộng đồng.
  * Modal mời thành viên (`CommunityInviteModal`): Tạo mã QR mời vào cộng đồng và sao chép liên kết mời tiện lợi.

---

### 5.6. Tab 4: Trang Cá Nhân "Tôi" - Danh Tính Số Thượng Lưu
- **Thẻ Định Danh Doanh Nhân Titanium 3D:** Ảnh chân dung lãnh đạo, chức vụ, tên công ty, chữ ký chìm V, 2 nút vàng gradient `[QR của tôi]` & `[Chạm NFC]`, liên kết `Xem hồ sơ >`.
- **Card Liên Hệ Nhanh (Quick Contact):** Lưới 5 kênh tương tác trực tiếp qua hệ thống `Linking`: Gọi điện thoại, Email, Viber, WhatsApp, Telegram.
- **Khối Trưng Bày Doanh Nghiệp (Showcase):** Lĩnh vực kinh doanh & sản phẩm chủ lực, Khách hàng & đối tác dấu ấn với logo chuẩn mạ vàng.
- **Bộ Chuyển Đổi Ngôn Ngữ (Language Switcher):** Hỗ trợ 8 ngôn ngữ quốc tế (`VI`, `EN`, `KM`, `MY`, `LO`, `JA`, `KO`, `ZH`) kèm cờ quốc gia, lưu trạng thái vào `AsyncStorage`.
- **Bật/Tắt Quả Cầu AI ViOne Nổi (Switch):** Cho phép ẩn hoặc hiện nút bong bóng trợ lý AI nổi trên màn hình ứng dụng.
- **Trung Tâm Bảo Mật & Phiên Đăng Nhập (`AccountSecurityModal`):** Đổi mật khẩu tài khoản, bật/tắt xác thực 2 lớp (2FA), danh sách thiết bị đang đăng nhập và nút đăng xuất thiết bị khác.
- **Quản Lý Thẻ & Chip NFC (`NfcTagsModal`):** Danh sách thẻ NFC vật lý đã liên kết, số lượt chạm, đổi tên thẻ và nút thu hồi thẻ (revoke) khi bị thất lạc.
- **Ví Lưu Danh Thiếp Đối Tác vCard (`CardVaultModal`):** Lưu trữ danh thiếp đối tác dạng thẻ Titanium đen vàng sang trọng, tìm kiếm nhanh và xuất danh bạ vCard (.vcf).
- **Cài Đặt Quyền Riêng Tư (`IdentityPrivacyModal`):** Ẩn/hiện số điện thoại và email với người chưa kết nối, bật/tắt nhận lời mời họp 1-1, đóng dấu watermark bảo mật danh thiếp.

---

### 5.7. Siêu Trợ Lý Điều Khiển Bằng Giọng Nói AI Copilot 6.0
- **Dải Sóng Âm Holographic & Breathing Aura:** Dải sóng 16-Bar Voice Wave Spectrum chuyển động theo nhịp tần số khi AI đang nghe hoặc phản hồi, kết hợp vòng hào quang thở Breathing Aura Champagne Gold `#DFB76C`.
- **Điều Khiển Ứng Dụng Bằng Giọng Nói 100% (Voice Automation):** Tự động nhận lệnh tiếng Việt và kích hoạt trực tiếp các thao tác trong app: Chấm công, Duyệt chi, Giao việc cho nhân viên, Xem tiến độ việc, Quét mã QR, Mở mã cá nhân, Tra cứu lịch trình hôm nay.
- **Trí Tuệ Đàm Thoại Tự Nhiên & Xuất File Đa Dạng:**
  * Nắm vững 100% nghiệp vụ nền tảng ViOne, trả lời thông minh mọi câu hỏi chuyên môn cũng như tư vấn quản trị, đàm phán, sức khỏe điều hành.
  * Bộ công cụ tạo file đa dạng: Tự động sinh và cung cấp thẻ tải trực tiếp các tệp Excel (`.xlsx`), Word (`.docx`), PDF (`.pdf`) từ dữ liệu PostgreSQL thực tế.
  * Quản lý phiên hội thoại đa dạng, lưu lịch sử chat vào bộ nhớ cục bộ, nút tạo cuộc chat mới và nút xóa lịch sử.

---

### 5.8. Hệ Sinh Thái Phân Phối Đa Nền Tảng (Dual APK & iOS WebClip)
- **Bản PWA APK Siêu Tốc (~3.18 MB):** Đóng gói qua Capacitor Android, tối ưu hóa tốc độ tải, dung lượng nhẹ, hỗ trợ đầy đủ quyền Camera, Micro và WebRTC.
- **Bản Native Standalone APK (~81.59 MB):** Đóng gói qua React Native Gradle Release, tích hợp sẵn Hermes JS bytecode, vận hành mượt mà ngoại tuyến, tải và cài đặt độc lập không cần Metro server.
- **Bản iOS PWA WebClip Profile (`vione_ios_install.mobileconfig`):** Cung cấp hồ sơ cấu hình Apple WebClip tải qua Safari, cho phép người dùng iPhone cài đặt ứng dụng ViOne toàn màn hình ra Màn hình chính chỉ với 1-chạm tương tự file APK trên Android.

---

## 6. HỆ THỐNG 95 QUY TẮC NGHIỆP VỤ CỐT LÕI (BUSINESS RULES - 6 NHÓM)

### 6.1. Nhóm Quy Tắc Quản Trị Khách Hàng B2B & Bán Hàng (BR-CRM)
* **BR-CRM-01:** Khách hàng doanh nghiệp bắt buộc có Mã số thuế duy nhất; hệ thống tự động ngăn chặn tạo trùng lặp.
* **BR-CRM-02:** Khách hàng tiềm năng mới phải được phân bổ tới nhân viên kinh doanh và liên hệ lần đầu trong tối đa 15 phút.
* **BR-CRM-03:** Nhân viên kinh doanh được chiết khấu tối đa 5%; mức 6-15% do Trưởng phòng duyệt; trên 15% bắt buộc do Tổng Giám Đốc duyệt.
* **BR-CRM-04:** Báo giá điện tử có hiệu lực mặc định 15 ngày; quá hạn hệ thống tự động khóa không cho ký hợp đồng nếu chưa gia hạn.
* **BR-CRM-05:** Nếu đối tác trong danh bạ quá 30 ngày không có tương tác, hệ thống tự động đưa vào danh sách "Cần giữ kết nối & chăm sóc" (Nurture List).
* **BR-CRM-06:** Nhân viên kinh doanh chỉ được xem số điện thoại và email của khách hàng do mình phụ trách.
* **BR-CRM-07:** Khách hàng có khoản nợ quá hạn trên 60 ngày sẽ bị tự động khóa quyền mua hàng mới.
* **BR-CRM-08:** Thao tác xuất Excel danh sách khách hàng giới hạn tối đa 500 dòng/lần và ghi nhật ký IP người dùng vào Audit Log.
* **BR-CRM-09:** Điểm tiềm năng AI Lead Score được tự động tính toán lại mỗi khi có tương tác mới (cuộc gọi, email, báo giá).
* **BR-CRM-10:** Khách hàng không có người phụ trách trong 7 ngày tự động chuyển về quỹ khách hàng chung (Unassigned Pool).
* **BR-CRM-11:** Mọi cập nhật thông tin khách hàng từ di động phải đồng bộ hai chiều tức thời về Web CRM.
* **BR-CRM-12:** Khách hàng tạo từ quét danh thiếp OCR phải gắn nhãn nguồn "Card Scan" và lưu ảnh danh thiếp gốc.
* **BR-CRM-13:** Không được phép xóa vĩnh viễn khách hàng đã phát sinh hợp đồng; chỉ được phép chuyển trạng thái Lưu trữ.
* **BR-CRM-14:** Báo giá gửi cho khách hàng bắt buộc xuất dưới định dạng PDF có mã QR xác thực tính toàn vẹn.
* **BR-CRM-15:** Khi deal chuyển sang trạng thái "Thành công (Won)", hệ thống tự động tạo hợp đồng nháp và thông báo cho kế toán.

### 6.2. Nhóm Quy Tắc Quy Trình Công Việc & Vận Hành (BR-WRK)
* **BR-WRK-01:** Mỗi thẻ việc tạo ra bắt buộc phải có ít nhất 01 người chịu trách nhiệm chính và 01 Hạn chót (Deadline).
* **BR-WRK-02:** Trước 2 giờ đến hạn chót, hệ thống gửi thông báo nhắc việc; khi quá hạn thẻ việc tự động đổi sang màu đỏ cảnh báo.
* **BR-WRK-03:** Công việc có tính chất kiểm tra chất lượng chỉ chuyển sang trạng thái Hoàn thành khi có sự phê duyệt của Người quản lý.
* **BR-WRK-04:** Mỗi nhân sự không nên có quá 5 công việc ở trạng thái "Đang làm" cùng một thời điểm để đảm bảo chất lượng.
* **BR-WRK-05:** Nhân sự có tổng thời gian làm việc được giao vượt quá 45 giờ/tuần sẽ bị gắn cờ quá tải trên biểu đồ tải làm việc.
* **BR-WRK-06:** Công việc B có liên kết phụ thuộc với công việc A sẽ không thể bắt đầu khi công việc A chưa hoàn thành.
* **BR-WRK-07:** Thẻ việc chỉ được phép kéo sang cột "Hoàn thành" khi toàn bộ các đầu mục trong Checklist đã được tick hoàn tất 100%.
* **BR-WRK-08:** Trao đổi trong thẻ việc chỉ được chỉnh sửa hoặc xóa trong vòng 15 phút kể từ khi gửi; sau 15 phút sẽ khóa bất biến.
* **BR-WRK-09:** Khi nhân viên bấm "Tiến hành nhận việc", trạng thái task tự động chuyển sang `in_progress` và lưu timestamp nhận việc.
* **BR-WRK-10:** Nhân viên có thể gửi ghi chú cập nhật tiến độ % (0-100%); hệ thống tự động thông báo cho người giao việc.
* **BR-WRK-11:** Cho phép nhập danh sách công việc hàng loạt từ tệp Excel theo cơ cấu phòng ban chuẩn.
* **BR-WRK-12:** Chỉ người tạo task hoặc Quản Trị / Admin mới có quyền chỉnh sửa nội dung hoặc xóa công việc (`canEditRecord`).
* **BR-WRK-13:** Bảng công việc mặc định luôn hiển thị các công việc mới tạo lên đầu tiên (`createdAt DESC`).
* **BR-WRK-14:** Công việc bị quá hạn quá 3 ngày sẽ tự động báo cáo lên cấp Giám đốc điều hành (COO).
* **BR-WRK-15:** Đính kèm tệp trong công việc giới hạn tối đa 50MB/tệp và tự động quét virus trước khi lưu trữ.

### 6.3. Nhóm Quy Tắc Chấm Công & Quản Trị Nhân Sự (BR-HRM)
* **BR-HRM-01:** Tọa độ GPS khi chấm công di động phải nằm trong bán kính tối đa 50 mét so với tọa độ văn phòng được cấu hình.
* **BR-HRM-02:** Ảnh nhận diện chấm công phải đạt độ khớp khuôn mặt từ 92% trở lên và phát hiện khuôn mặt sống (chống chụp lại màn hình).
* **BR-HRM-03:** Chấm công vào sau giờ quy định 15 phút tính là Đi muộn; chấm công ra trước giờ quy định 15 phút tính là Về sớm.
* **BR-HRM-04:** Đơn xin nghỉ phép năm phải nộp trước tối thiểu 24 giờ đối với nghỉ 1 ngày, và trước tối thiểu 3 ngày đối với nghỉ từ 2 ngày trở lên.
* **BR-HRM-05:** Bảng chấm công toàn công ty tự động khóa vào lúc 23:59 ngày mùng 2 hàng tháng.
* **BR-HRM-06:** Phiếu lương điện tử gửi tới từng nhân viên được mã hóa độc lập; nghiêm cấm nhân viên xem phiếu lương của người khác.
* **BR-HRM-07:** Khi nhân viên thôi việc, tài khoản truy cập hệ thống và quyền thẻ danh thiếp số tự động bị thu hồi lúc 17:30 ngày làm việc cuối.
* **BR-HRM-08:** Tuyệt đối không để tính năng tự chấm công cá nhân cho CEO/Lãnh đạo; chuyển sang chế độ theo dõi chuyên cần nhân sự công ty.
* **BR-HRM-09:** Nhân viên đi muộn quá 3 lần trong tháng sẽ bị gửi cảnh báo tự động về email cá nhân và quản lý trực tiếp.
* **BR-HRM-10:** Cho phép chấm công nhiều ca linh hoạt (Ca sáng, Ca chiều, Ca đêm) theo phân ca của quản lý.
* **BR-HRM-11:** Đơn nghỉ phép đã duyệt tự động trừ vào số ngày phép năm còn lại của nhân viên.
* **BR-HRM-12:** Xuất bảng chấm công định dạng Excel chuẩn có đầy đủ công chuẩn, đi muộn, về sớm, nghỉ phép và làm thêm giờ.
* **BR-HRM-13:** Dữ liệu GPS và FaceID chỉ được sử dụng cho mục đích xác thực chấm công, không dùng để theo dõi vị trí liên tục.
* **BR-HRM-14:** Hỗ trợ chấm công ngoại tuyến khi mất mạng và tự động đồng bộ khi có kết nối trở lại.
* **BR-HRM-15:** Trưởng phòng có quyền chấm công thủ công thay thế khi nhân viên gặp sự cố thiết bị (kèm lý do và bằng chứng).

### 6.4. Nhóm Quy Tắc Phê Duyệt Chi & Quản Trị Tài Chính (BR-FIN)
* **BR-FIN-01:** Mọi khoản chi tiền tuân thủ quy trình 3 cấp: Người lập đề xuất $\rightarrow$ Kế toán kiểm tra chứng từ $\rightarrow$ Lãnh đạo phê duyệt.
* **BR-FIN-02:** Hạn mức duyệt chi: Dưới 5 triệu (Trưởng phòng), 5-20 triệu (Kế toán trưởng), trên 20 triệu (Tổng Giám Đốc).
* **BR-FIN-03:** Hệ thống tự động quét số hóa đơn và mã cơ quan thuế của hóa đơn đầu vào; phát hiện trùng lặp sẽ lập tức khóa tờ trình chi.
* **BR-FIN-04:** Mã QR thanh toán là mã QR động chuẩn Napas 24/7, chứa đúng số tiền và nội dung để tự động gạch nợ trong 1 giây.
* **BR-FIN-05:** Hệ thống từ chối tạo đề xuất chi nếu khoản chi đó làm tổng chi vượt quá 100% ngân sách tháng của phòng ban đã được duyệt.
* **BR-FIN-06:** Toàn bộ hóa đơn, ủy nhiệm chi và biên bản nghiệm thu điện tử được lưu trữ an toàn tối thiểu 10 năm.
* **BR-FIN-07:** Sau khi lãnh đạo ký duyệt, tờ trình chi được khóa chỉnh sửa và chuyển thẳng sang trạng thái Chờ thanh toán.
* **BR-FIN-08:** Mỗi lần thanh toán thành công, hệ thống tự động ghi nhận vào sổ cái phiếu chi thực tế và cập nhật dòng tiền ròng.
* **BR-FIN-09:** Cho phép đính kèm nhiều hóa đơn/chứng từ dạng ảnh hoặc PDF vào một tờ trình chi.
* **BR-FIN-10:** Báo cáo dòng tiền thực tế được tổng hợp theo thời gian thực từ CSDL PostgreSQL, không dùng dữ liệu giả lập.
* **BR-FIN-11:** Cảnh báo đỏ khi quỹ tiền mặt hoặc số dư tài khoản ngân hàng giảm xuống dưới mức dự phòng tối thiểu.
* **BR-FIN-12:** Hạn mức tạm ứng công tác tối đa không vượt quá 80% chi phí dự toán được duyệt.
* **BR-FIN-13:** Thời hạn hoàn ứng công tác tối đa trong vòng 5 ngày làm việc kể từ khi kết thúc đợt công tác.
* **BR-FIN-14:** Cho phép xuất danh sách các khoản chi được duyệt ra file Excel chuẩn định dạng kế toán.
* **BR-FIN-15:** Nghiêm cấm chia nhỏ một khoản chi lớn thành nhiều khoản chi nhỏ dưới 20 triệu nhằm né tránh cấp duyệt của Tổng Giám Đốc.

### 6.5. Nhóm Quy Tắc Ứng Dụng Di Động & Danh Thiếp Số (BR-APP)
* **BR-APP-01:** Cho phép đăng nhập bằng Email hoặc Số điện thoại (9-12 chữ số). Tự động tra cứu chéo các bảng định danh.
* **BR-APP-02:** Chạm Thẻ Doanh Nhân trên trang chủ mở Bottom Sheet cong tròn mạ vàng, tích hợp cử chỉ vuốt tay xuống để đóng tự nhiên.
* **BR-APP-03:** Mỗi thẻ Titanium NFC được nạp một mã token duy nhất liên kết với tài khoản; không ghi thông tin nhạy cảm vào chip.
* **BR-APP-04:** Khi người dùng báo mất thẻ trên ứng dụng, chip NFC tương ứng lập tức bị vô hiệu hóa truy cập trong vòng 1 giây.
* **BR-APP-05:** Mã QR vé sự kiện thay đổi mã bảo mật sau mỗi 30 giây để chống hành vi chụp ảnh màn hình bán lại vé.
* **BR-APP-06:** Ứng dụng soát vé chuyên dụng xác thực thông tin đại biểu tại cổng an ninh dưới 0.2 giây/người.
* **BR-APP-07:** Tính năng tìm đối tác gần bạn chỉ hiển thị khoảng cách ước tính và cho phép bật chế độ ẩn danh bất kỳ lúc nào.
* **BR-APP-08:** Danh thiếp cá nhân, vé sự kiện và danh bạ gần nhất được lưu trong bộ nhớ tạm để hiển thị bình thường khi mất sóng internet.
* **BR-APP-09:** Tự động hiển thị banner hướng dẫn 3 bước cho người dùng iOS Safari; cung cấp file cấu hình Apple WebClip cài đặt 1-chạm.
* **BR-APP-10:** Hộp thư tin nhắn (Messenger) phải hiển thị đầy đủ các cuộc trò chuyện do chính mình chủ động gửi đi (`lastMessageFromMe`).
* **BR-APP-11:** Danh sách tin nhắn bắt buộc sắp xếp theo thời gian tin nhắn mới nhất lên đầu trang (`lastMessageAt DESC`).
* **BR-APP-12:** Chạm vào Avatar người đang nhắn tin ở bất kỳ vị trí nào đều mở ra Bottom Sheet hồ sơ doanh nhân cá nhân.
* **BR-APP-13:** Thẻ đề xuất hẹn gặp 1-1 trong chat có 2 nút [Đồng ý hẹn] và [Từ chối]; đồng ý sẽ tự động ghim lịch vào Executive Home.
* **BR-APP-14:** Mọi đoạn ghi âm giọng nói tại khoảnh khắc sau khi đăng bài được tự động lưu vào kho lịch sử để nghe lại trên trang chủ.
* **BR-APP-15:** Modal đăng khoảnh khắc cho phép chụp ảnh trực tiếp từ camera phần cứng của thiết bị (WebRTC trên PWA, `expo-camera` trên Native).
* **BR-APP-16:** Người tham gia có thể hủy đăng ký sự kiện 1-chạm, hoàn lại suất tham dự và gửi thông báo xác nhận.
* **BR-APP-17:** Nút V mạ vàng 3D trung tâm mở VActionSheet 1-chạm kết nối đầy đủ các tác vụ điều hành và giao thương.
* **BR-APP-18:** Toàn bộ ảnh media hiển thị trên ứng dụng Native bắt buộc đi qua hàm chuẩn hóa `resolveMediaUrl(url)`.
* **BR-APP-19:** Tab danh mục công việc trên trang chủ mặc định luôn mở và hiển thị đầu tiên là "Tất cả" (All).
* **BR-APP-20:** Tích hợp banner và modal đề xuất kết bạn qua danh bạ điện thoại theo phong cách Zalo (`ContactsDiscoveryModal`).

### 6.6. Nhóm Quy Tắc Trí Tuệ Nhân Tạo AI Copilot (BR-AI)
* **BR-AI-01:** AI Copilot chỉ được truy xuất dữ liệu trong phạm vi doanh nghiệp người dùng có quyền; tuyệt đối không rò rỉ dữ liệu giữa các tenant.
* **BR-AI-02:** Năng lực nhận diện danh thiếp OCR phải đạt độ chính xác trích xuất trường thông tin tối thiểu 95%.
* **BR-AI-03:** Mọi câu lệnh, phản hồi và hành động do AI đề xuất hoặc thực thi bắt buộc được ghi nhật ký kiểm toán bất biến (AI Audit Log).
* **BR-AI-04:** AI nhận diện danh tính và vai trò của tài khoản đăng nhập hiện tại để xưng hô chuẩn mực và tư vấn đúng thẩm quyền.
* **BR-AI-05:** AI hỗ trợ xuất báo cáo Excel, Word, PDF động từ CSDL PostgreSQL thực tế và cung cấp thẻ tải tệp trực tiếp trong khung chat.
* **BR-AI-06:** AI hỗ trợ điều khiển ứng dụng bằng giọng nói tiếng Việt 100% (chấm công, giao việc, duyệt chi, quét QR).
* **BR-AI-07:** Khi người dùng hỏi về bạn bè hoặc khách hàng, AI báo cáo trung thực số liệu thực tế từ CSDL, không được bịa số liệu.
* **BR-AI-08:** Hiển thị hiệu ứng gõ chữ Typewriter Streaming mượt mà kèm con trỏ nhấp nháy khi AI phản hồi văn bản.
* **BR-AI-09:** Khi người dùng ra lệnh "tìm đoạn ghi âm tại khoảnh khắc", AI tự động truy xuất kho ghi âm và phát lại đoạn audio.
* **BR-AI-10:** Khi người dùng hỏi "quanh đây có ai dùng ViOne không", AI quét định vị người dùng trong bán kính địa lý và hiển thị thẻ kết nối.
* **BR-AI-11:** AI tự động phát hiện lịch họp dồn dập của CEO và đề xuất giãn lịch nghỉ ngơi 15 phút để bảo vệ sức khỏe điều hành.
* **BR-AI-12:** AI tự động phân tích lệnh giao việc bằng giọng nói thành các trường có cấu trúc: Người nhận, Tiêu đề, Hạn chót, Mức độ ưu tiên.
* **BR-AI-13:** Quản lý lịch sử hội thoại AI đa phiên, hỗ trợ tạo cuộc trò chuyện mới và xóa lịch sử trò chuyện.
* **BR-AI-14:** Tích hợp cổng LLM Gateway ngoài kết hợp bộ suy luận Dynamic Inference nội bộ, không bao giờ trả lời rập khuôn thụ động.
* **BR-AI-15:** Giao diện AI tối giản sang trọng với dải sóng Holographic 16-bar Voice Wave Spectrum và vòng hào quang Breathing Aura.

---

## 7. MA TRẬN PHÂN QUYỀN RBAC 7 NHÓM VAI TRÒ x 6 THAO TÁC & QUY TẮC SỞ HỮU DỮ LIỆU

### 7.1. Ma trận phân quyền 7 nhóm vai trò x 6 thao tác
Hệ thống chuẩn hóa phân quyền trực tiếp tại Chức năng Nền tảng theo ma trận chặt chẽ:

| Nhóm Vai Trò Doanh Nghiệp | Xem | Tạo | Sửa | Xóa | Duyệt | Xuất Dữ Liệu |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Role Quản Trị (`quan_tri`)** | ✓ | ✓ | ✓ (Toàn quyền) | ✓ (Toàn quyền) | ✓ (Toàn quyền) | ✓ (Toàn bộ) |
| **Role Admin (`admin`)** | ✓ | ✓ | ✓ (Toàn quyền) | Hạn chế | ✓ (Điều hành) | ✓ (Toàn bộ) |
| **Tổng Giám Đốc (CEO)** | ✓ | ✓ | ✓ | ✓ | ✓ (Toàn quyền) | ✓ |
| **Giám Đốc Vận Hành (COO)** | ✓ | ✓ | ✓ | Hạn chế | ✓ (Quy trình/Việc) | ✓ |
| **Giám Đốc Tài Chính (CFO)** | ✓ | ✓ | ✓ | Hạn chế | ✓ (Chi tiền/Sổ quỹ) | ✓ |
| **Giám Đốc Kinh Doanh (Sales Manager)** | ✓ | ✓ | ✓ | Hạn chế | ✓ (Báo giá/Deal) | ✓ (Có ghi log) |
| **Nhân Viên Chuyên Môn (Staff)** | ✓ (Phạm vi việc) | ✓ (Đề xuất) | ✓ (Bản thân) | ✗ | ✗ | ✗ |
| **Đối Tác & Khách Hàng (Partner)** | ✓ (Công khai) | ✓ (Tương tác) | ✓ (Hồ sơ riêng) | ✗ | ✗ | ✗ |

### 7.2. Quy tắc Phân quyền Sở hữu Dữ liệu Bắt Buộc (Data Ownership Rule)
- Nghiêm cấm bất kỳ tài khoản nào chỉnh sửa bản ghi do tài khoản khác tạo ra (`canEditRecord(user, recordCreatorId)`), **TRỪ KHI** tài khoản đó mang role **Quản Trị (`quan_tri`)** hoặc **Admin (`admin`)**.
- Mọi hành vi vi phạm tại tầng Backend sẽ lập tức trả về mã lỗi HTTP `403 Forbidden` kèm thông điệp từ chối rõ ràng.
- Giao diện người dùng tự động ẩn các nút chỉnh sửa (nút Bút chì, nút Sửa) đối với các bản ghi không thuộc quyền sở hữu của tài khoản đăng nhập.

### 7.3. Phân lập giao diện Giao việc vs Nhận việc
- **Chức năng Giao việc:** CHỈ hiển thị trên giao diện đối với Role Quản Trị, Role Admin và người thiết lập công ty tại cộng đồng (`isAssigner`). Các tài khoản role nhân viên/thành viên thường bị ẩn hoàn toàn tab Giao việc & nút Giao việc mới.
- **Chức năng Nhận việc:** Các tài khoản role nhỏ chỉ nhìn thấy tab "⚡ Nhận việc (Việc của tôi)" để tiếp nhận công việc qua nút **`[⚡ TIẾN HÀNH NHẬN VIỆC]`**, cập nhật tiến độ % (0-100%) và gửi báo cáo hoàn thành.

---

## 8. YÊU CẦU PHI CHỨC NĂNG (ENTERPRISE NFR) & KIẾN TRÚC DỮ LIỆU THỰC TẾ

### 8.1. Hiệu năng & Tải cao (Performance & Scalability)
- Khả năng chịu tải đồng thời tối thiểu **10,000 người dùng trực tuyến (CCU)** mà không suy giảm hiệu năng.
- Thời gian phản hồi API trung bình dưới **150ms** đối với 95% tác vụ (p95 < 150ms).
- Tốc độ quét mã QR xác thực soát vé tại cổng an ninh sự kiện dưới **0.2 giây/người**.
- Thời gian tải trang web ban đầu dưới 1.5 giây trên kết nối 4G/Wifi tiêu chuẩn.

### 8.2. An toàn & Bảo mật (Security & Compliance)
- Mã hóa toàn bộ cơ sở dữ liệu ở trạng thái nghỉ (Data at Rest) bằng chuẩn quân đội **AES-256**.
- Truyền tải dữ liệu qua giao thức mã hóa mạng an toàn **TLS 1.3**.
- Cơ chế giới hạn tần suất truy cập (Rate Limiting) 100 requests/phút/IP chống tấn công từ chối dịch vụ (DDoS).
- Đóng dấu bản quyền chìm (Watermark) bảo vệ hình ảnh danh thiếp số và tài liệu nội bộ mật.
- Xác thực phân tán an toàn bằng cặp khóa JWT (Access Token 60 phút + Refresh Token 30 ngày) có hỗ trợ xác thực hai lớp (2FA TOTP).

### 8.3. Độ tin cậy & Dự phòng thảm họa (Reliability & Disaster Recovery)
- Cam kết độ sẵn sàng dịch vụ (SLA) tối thiểu **99.98%**.
- Tự động sao lưu dữ liệu toàn bộ hệ thống hàng ngày lúc 03:00 AM.
- Mục tiêu điểm phục hồi dữ liệu: **RPO < 2 giờ**.
- Mục tiêu thời gian phục hồi hệ thống: **RTO < 30 phút**.

### 8.4. Cô lập dữ liệu Đa doanh nghiệp (Multi-Tenant Data Isolation)
- Dữ liệu giữa các công ty thành viên được phân vùng cô lập tuyệt đối ở tầng cơ sở dữ liệu PostgreSQL.
- Nghiêm cấm bất kỳ truy vấn nào có khả năng rò rỉ dữ liệu chéo giữa các doanh nghiệp độc lập.

### 8.5. Nguyên Tắc CSDL Thực Tế 100% & EmptyState Sạch Sẽ (Strict Database-Driven Architecture)
- Toàn bộ dữ liệu hiển thị trên Web CRM và Mobile App bắt buộc phải được truy vấn từ CSDL PostgreSQL thông qua NestJS Backend RESTful APIs.
- Khi CSDL chưa có dữ liệu hoặc danh sách trả về rỗng (`length === 0`), BẮT BUỘC hiển thị component `EmptyState` sạch sẽ, tinh tế chuẩn phong cách ViOne Luxury (icon minh họa Lucide, tiêu đề thông báo rõ ràng, phụ đề hướng dẫn nhẹ nhàng, và nút kêu gọi hành động [Tạo mới] nếu người dùng có quyền).
- Khối `catch` khi gọi API thất bại phải gán `setState([])` và hiển thị thông báo lỗi thân thiện thay vì fallback về danh sách giả lập.

---

## 9. KẾ HOẠCH TRIỂN KHAI, ĐỐI SOÁT & TIÊU CHUẨN NGHIỆM THU

### 9.1. Kế hoạch triển khai 4 giai đoạn
* **Giai đoạn 1 (Tuần 1-2) — Khảo sát & Thiết lập Hạ tầng:** Khảo sát cấu trúc tổ chức doanh nghiệp, phân quyền ma trận RBAC, cấu hình môi trường PostgreSQL Standalone, MinIO S3 Storage và NestJS Backend.
* **Giai đoạn 2 (Tuần 3-4) — Chuẩn Hóa Dữ Liệu & Cấu Hình Nghiệp Vụ:** Nhập khẩu dữ liệu danh bạ khách hàng, danh mục sản phẩm, cấu hình tọa độ định vị văn phòng chấm công GPS và cài đặt hạn mức duyệt chi 3 cấp.
* **Giai đoạn 3 (Tuần 5-6) — Thử Nghiệm Song Song & Cấp Phát Thẻ NFC:** Cấp phát thẻ Titanium NFC mạ vàng cho Ban Lãnh Đạo, cài đặt bản Release APK trên thiết bị Android và phân phối cấu hình WebClip cho iOS; chạy thử nghiệm song song chấm công và duyệt chi.
* **Giai đoạn 4 (Tuần 7-8) — Go-Live Toàn Diện & Ký Biên Bản Nghiệm Thu:** Chuyển đổi chính thức 100% sang hệ điều hành ViOne, kích hoạt Trợ lý AI Copilot 6.0 và bàn giao toàn bộ tài liệu kỹ thuật.

### 9.2. Tiêu chuẩn nghiệm thu kỹ thuật (Acceptance Criteria)
1. 100% chức năng của 24 Modules Web CRM và Ứng dụng di động ViOne Connect vận hành ổn định, không có lỗi nghiêm trọng (Zero Critical Bugs).
2. Toàn bộ mã nguồn vượt qua kiểm tra tĩnh `npx tsc --noEmit` đạt 0 lỗi (Exit code 0).
3. Backend NestJS biên dịch thành công qua `nest build` đạt Exit code 0.
4. Triệt tiêu 100% dữ liệu mock/fake trên giao diện người dùng; toàn bộ dữ liệu phản ánh chính xác CSDL PostgreSQL.
5. Cung cấp đầy đủ bộ đôi bản phân phối ứng dụng di động: Release APK Native (81.59 MB), Release APK PWA (3.18 MB) và cấu hình iOS WebClip Profile.
