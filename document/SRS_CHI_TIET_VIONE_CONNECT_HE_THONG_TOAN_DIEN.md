# Software Requirements Specification (SRS)

# NỀN TẢNG SIÊU ỨNG DỤNG DOANH NGHIỆP VIONE & MẠNG LƯỚI GIAO THƯƠNG (VIONE ENTERPRISE & VIONE CONNECT)

---

## 1. TRANG BÌA (Cover Page)

* **Tên tài liệu:** Software Requirements Specification (Đặc tả Yêu cầu Phần mềm)
* **Tên dự án:** Nền Tảng Siêu Ứng Dụng Doanh Nghiệp ViOne & Mạng Lưới Giao Thương (ViOne Enterprise CRM & ViOne Connect App)
* **Mã tài liệu:** SRS-VIONE-MASTER-V2.0
* **Phiên bản:** 2.0 (Bản Master Đặc Tả Toàn Diện Không Bỏ Sót Chức Năng)
* **Ngày tạo:** 01/10/2026
* **Đơn vị phát triển / Người tạo:** Khối Công Nghệ & Kiến Trúc Giải Pháp — Công Ty Cổ Phần Công Nghệ ViOne (ViOne Corporation)
* **Trạng thái tài liệu:** Đã thẩm định & Sẵn sàng bàn giao vận hành

---

## 2. MỤC LỤC (Table of Contents)

> *Ghi chú dành cho Microsoft Word:* **Sử dụng tính năng Table of Contents của Word để generate tự động tại đây** (References -> Table of Contents -> Automatic Table).

---

## 3. GIỚI THIỆU (Introduction)

### 3.1. Mục đích (Purpose)
Tài liệu Đặc tả Yêu cầu Phần mềm (SRS) này xác định đầy đủ, chi tiết và chuẩn mực toàn bộ các yêu cầu chức năng, yêu cầu phi chức năng, kiến trúc cơ sở dữ liệu quan hệ và ma trận thao tác chi tiết (Xem, Sửa, Xóa, Hủy, Mua, Quét mã, Lưu, Quan tâm, Giao việc, Thông báo) cho **Hệ sinh thái Siêu Ứng Dụng Doanh Nghiệp ViOne (ViOne Ecosystem)**. Tài liệu là kim chỉ nam kỹ thuật chuẩn mực cho Solution Architect, BA, Developers và QA/Tester trong toàn bộ quá trình phát triển, kiểm thử hộp đen và bàn giao vận hành.

### 3.2. Phạm vi dự án (Project Scope)
Nền tảng ViOne là một hệ sinh thái chuyển đổi số doanh nghiệp toàn diện theo mô hình Siêu ứng dụng (Super-App), kết hợp hài hòa giữa năng lực quản trị vận hành nội bộ doanh nghiệp chuyên sâu và năng lực mở rộng mạng lưới giao thương liên doanh nghiệp B2B:
* **Hệ Điều Hành Quản Trị Doanh Nghiệp (ViOne Enterprise CRM):** Ứng dụng web dành riêng cho Ban Giám Đốc (CEO), Giám Đốc Kinh Doanh (CCO), Quản Lý Bán Hàng, Nhân Viên Kinh Doanh và Kế Toán Trưởng. Phân hệ cung cấp các công cụ quản trị khách hàng 360° (Accounts & Contacts), điều hành phễu bán hàng dạng bảng Kanban (Deals Pipeline), lập báo giá điện tử (Quotation) có chiết khấu, phê duyệt hợp đồng trực tuyến, quản lý công nợ và tự động đối soát gạch nợ hóa đơn qua cổng VietQR 24/7.
* **Mạng Lưới Giao Thương Số (ViOne Connect Mobile App & PWA):** Ứng dụng di động cao cấp chuẩn phong cách Titanium Trắng & Vàng Kim dành cho các nhà lãnh đạo doanh nghiệp và đội ngũ thương mại. Ứng dụng tích hợp Thẻ danh thiếp số 3D thông minh chạm chip NFC (ViCard), trạm thu thập khách hàng tiềm năng tự động (Leads Hub), công cụ tìm kiếm và ghép cặp đối tác B2B bằng thuật toán AI Matchmaking, đặt lịch hẹn giao thương bàn tròn 1-1 (Business Booking) và nhắn tin đàm phán hợp đồng thời gian thực mã hóa đầu cuối.

### 3.3. Định nghĩa và thuật ngữ (Definitions & Acronyms)
* **Multi-Tenant:** Kiến trúc phần mềm đa người thuê, trong đó dữ liệu của mỗi công ty được cô lập độc lập tuyệt đối thông qua mã định danh `tenant_id`.
* **Row Level Security (RLS):** Cơ chế bảo mật dữ liệu ở cấp độ từng dòng trong cơ sở dữ liệu PostgreSQL.
* **ViCard 3D:** Danh thiếp số thông minh tích hợp hiệu ứng 3D ánh kim, liên kết với chip NFC vật lý và mã QR động.
* **Leads Hub:** Trung tâm tự động lưu trữ và phân loại đối tác tiềm năng sau mỗi lượt chạm thẻ NFC hoặc quét mã QR.
* **AI Matchmaking Engine:** Động cơ trí tuệ nhân tạo sử dụng thuật toán so khớp vector cosine để ghép nối nhu cầu cung ứng và tìm mua B2B.

---

## 4. MÔ TẢ TỔNG QUAN (Overall Description)

### 4.1. Bối cảnh hệ thống (System Perspective)
Hệ sinh thái ViOne được xây dựng theo kiến trúc phân tán hướng dịch vụ (Service-Oriented Architecture), vận hành trên hạ tầng đám mây với cơ sở dữ liệu tập trung được bảo vệ bởi công nghệ cô lập đa khách hàng (Multi-Tenancy):

```
[ViOne Enterprise Web CRM] ────┐
                               ├────► [API Gateway & Backend NestJS / Fastify] ◄────► [PostgreSQL Multi-Tenant]
[ViOne Connect Mobile App] ────┘                   │                                           │
                                                   ▼                                           ▼
                                    [Cổng Thanh Toán VietQR / Napas]             [Redis Caching & Pub/Sub Queue]
```

### 4.2. Chức năng của hệ thống (System Features)
* **Quản trị Khách hàng 360° & Leads Hub:** Quản lý tập trung hồ sơ doanh nghiệp đối tác, đầu mối liên hệ, lịch sử đơn hàng và trạm thu thập khách tiềm năng tự động từ lượt chạm thẻ NFC.
* **Phễu Bán hàng Trực quan (Deals Kanban):** Quản lý quy trình kinh doanh qua các giai đoạn (Khách tiềm năng ➔ Tiếp cận ➔ Báo giá ➔ Đàm phán ➔ Chốt đơn), kéo thả mượt mà và dự báo doanh số.
* **Báo giá B2B Điện tử & Ký số Hợp đồng:** Tạo báo giá chuyên nghiệp đa sản phẩm, tính toán tự động chiết khấu, thuế VAT, xem trước PDF chuẩn mẫu công ty và luồng duyệt ký số.
* **Tài chính, Hóa đơn & Gạch nợ VietQR 24/7:** Xuất hóa đơn kèm mã VietQR Napas động, tự động gạch nợ tức thì khi tiền về tài khoản ngân hàng và đồng bộ sang sổ quỹ.
* **Danh thiếp Số 3D (ViCard) & Ghi Chip NFC:** Danh thiếp 3D Titanium ánh kim, đọc/ghi chip NFC vật lý 1 chạm, tùy biến giao diện và trang web công khai `/card/:slug`.
* **Ghép Cặp Giao Thương Trí Tuệ Nhân Tạo (AI Engine):** Phân tích ngữ nghĩa nhu cầu Cung - Cầu và tự động chấm điểm độ tương thích (> 85%) để đề xuất đối tác cung ứng tối ưu.
* **Đặt Lịch Hẹn Bàn Tròn 1-1 (Business Booking):** Lên lịch hẹn làm việc, gặp gỡ đối tác bàn chiến lược hợp tác với cơ chế xác nhận hai chiều và đồng bộ lịch trình.
* **Nhắn tin Thương mại E2E Realtime:** Phòng trao đổi thông tin trực tiếp giữa người mua và người bán, bảo mật mã hóa và hỗ trợ đính kèm báo giá, hợp đồng.

### 4.3. Vai trò người dùng (User Classes and Characteristics)
1. **CEO / Chủ Tịch (Doanh Nghiệp Admin):** Toàn quyền kiểm soát dữ liệu công ty; xem báo cáo doanh thu tổng thể, duyệt hợp đồng lớn, quản lý cấu hình mẫu danh thiếp và phân quyền nhân sự.
2. **Giám Đốc Kinh Doanh (CCO):** Quản lý toàn bộ phễu bán hàng (Deals), phân bổ Leads cho nhân viên, duyệt báo giá chiết khấu, theo dõi KPI doanh số.
3. **Nhân Viên Sales:** Quản lý khách hàng do mình phụ trách, kéo thẻ thương vụ Kanban, tạo báo giá, sở hữu thẻ danh thiếp số ViCard và tiếp nhận khách tiềm năng từ Leads Hub.
4. **Kế Toán Trưởng:** Quản lý hóa đơn bán hàng, theo dõi công nợ, đối soát ngân hàng tự động qua VietQR và quản lý dòng tiền thu chi.

---

## 5. MA TRẬN TOÀN BỘ HÀNH ĐỘNG CHỨC NĂNG (XEM, SỬA, XÓA, HỦY, MUA, QUÉT MÃ, LƯU, QUAN TÂM, GIAO VIỆC, THÔNG BÁO)

| Nhóm Hành Động | Phân Hệ Áp Dụng | Hành Động Chi Tiết | Role Thực Hiện | Quy Tắc Nghiệp Vụ & Ràng Buộc |
| :--- | :--- | :--- | :--- | :--- |
| **XEM (View/Read)** | Toàn hệ thống | - Xem hồ sơ khách hàng 360° (Accounts)<br>- Xem phễu bán hàng Deals Kanban<br>- Xem danh mục báo giá, hợp đồng ký số<br>- Xem hóa đơn, sổ quỹ thu chi công ty<br>- Xem danh bạ đối tác B2B trên mạng lưới | Mọi Role | - Sales chỉ xem khách hàng và thương vụ do chính mình phụ trách.<br>- CEO và CCO xem toàn bộ số liệu của công ty mình sở hữu.<br>- Bảo đảm cô lập 100% dữ liệu Multi-Tenant (`tenant_id`). |
| **SỬA (Edit/Update)** | Khách hàng, Deals, Báo giá | - Sửa thông tin liên hệ khách hàng<br>- Sửa giai đoạn thương vụ (kéo thả Kanban)<br>- Sửa đơn giá, tỷ lệ chiết khấu báo giá<br>- Sửa cấu hình giao diện danh thiếp 3D ViCard | Tác giả / Quản lý | - Sales sửa chiết khấu > 5% tự động kích hoạt luồng duyệt của CCO.<br>- Cập nhật giai đoạn Deal tự động tính lại dự báo doanh số thời gian thực. |
| **XÓA (Delete)** | Deals, Khách hàng, Báo giá | - Xóa thương vụ bị hủy bỏ<br>- Xóa người liên hệ trùng lặp trong Account<br>- Xóa báo giá bản nháp chưa gửi khách | Sales / CCO / CEO | - Áp dụng Soft Delete (`deleted_at`), lưu vết kiểm toán.<br>- Tuyệt đối không cho phép xóa hóa đơn đã gạch nợ thành công hoặc hợp đồng đã ký số. |
| **HỦY (Cancel)** | Lịch hẹn, Hóa đơn, Báo giá | - Hủy cuộc hẹn bàn tròn 1-1 (báo bận)<br>- Hủy hóa đơn xuất sai trước khi khách quét mã<br>- Hủy bản báo giá hết hiệu lực | Người tạo / Khách hàng | - Hủy cuộc hẹn gửi thông báo đẩy và email cập nhật lịch trình cho đối tác.<br>- Hủy hóa đơn lập tức vô hiệu hóa mã VietQR tương ứng. |
| **MUA (Buy/Checkout)** | Báo giá B2B, Vé sự kiện | - Khách hàng xác nhận mua theo báo giá B2B<br>- Mua vé tham dự Diễn đàn Doanh nghiệp ViOne<br>- Thanh toán đơn hàng qua cổng VietQR Napas | Khách hàng đối tác | - Thanh toán tự động gạch nợ 24/7 qua Webhook ngân hàng.<br>- Hệ thống tự động ghi 1 bút toán thu tiền vào Sổ quỹ nội bộ công ty. |
| **QUÉT MÃ (Scan QR/NFC)** | ViCard, Hóa đơn, Vé sự kiện | - Chạm thẻ nhựa ViCard ghi/đọc chip NFC vật lý<br>- Quét mã QR danh thiếp trên điện thoại đối tác<br>- Quét mã VietQR chuyển khoản thanh toán<br>- Quét mã QR soát vé đại biểu tại hội thảo | Người dùng / Khách hàng | - Chạm NFC mở ngay trang `/card/:slug` trên máy đối tác trong 0.5s.<br>- Quét vé hội thảo kiểm soát vào cửa và chống vé quét trùng lần 2. |
| **LƯU (Save/Bookmark)** | Leads Hub, Cơ hội Cung Cầu | - Tự động lưu thông tin khách vào Leads Hub khi chạm thẻ<br>- Lưu Bookmark cơ hội giao thương B2B quan tâm<br>- Lưu mẫu báo giá (Quotation Template) tái sử dụng | Doanh nhân / Sales | - Leads Hub tự động gán nguồn thu thập từ mã thẻ ViCard của Sales.<br>- Bookmark cách ly theo từng user cá nhân trong hệ thống. |
| **QUAN TÂM (Interest)** | Cung Cầu, Ghép cặp AI | - Bày tỏ quan tâm bài đăng tìm mua vật tư B2B<br>- Xác nhận quan tâm đề xuất ghép cặp của AI Engine<br>- Bấm thích và theo dõi khoảnh khắc doanh nghiệp | Doanh nhân thành viên | - Khi 2 bên cùng quan tâm, hệ thống mở phòng chat thương mại đàm phán.<br>- Điểm AI tương thích > 85% tự động gửi gợi ý thông minh. |
| **GIAO VIỆC (Assign/Dispatch)** | Phân bổ Leads, Soát vé | - CCO phân bổ khách tiềm năng (Leads) cho Sales chăm sóc<br>- Giao việc chuyên viên phụ trách thương vụ lớn (Deal Owner)<br>- Phân công nhân sự lễ tân trực cổng quét vé sự kiện | CCO / Ban Lãnh Đạo | - Sales nhận được thông báo đẩy tức thì khi được gán khách hàng mới.<br>- Nhân sự được phân công mới thấy tính năng quét vé QR trên ứng dụng. |
| **THÔNG BÁO (Notification)** | Toàn hệ thống | - Thông báo đẩy tức thì khi có Lead mới từ thao tác chạm thẻ<br>- Thông báo ngân hàng có tiền về tài khoản gạch nợ thành công<br>- Thông báo nhắc lịch hẹn bàn tròn 1-1 trước 2 tiếng<br>- Thông báo email xác nhận vé mời đại biểu cho khách | Hệ thống tự động | - Tích hợp Firebase Cloud Messaging (FCM) và WebSockets realtime.<br>- Gửi email tự động qua hệ thống Mailer chuyên nghiệp. |

---

## 6. YÊU CẦU CHỨC NĂNG CHI TIẾT (BẢNG USE CASES CỐT LÕI)

### 6.1. Bảng Use Case: UC-VIONE-01 — Quản Trị Khách Hàng 360° & Thu Thập Leads Hub

| Thuộc tính Use Case | Nội dung chi tiết |
| :--- | :--- |
| **ID** | **UC-VIONE-01** |
| **Tên chức năng** | Quản lý Hồ sơ Khách hàng 360° và Thu thập Khách tiềm năng tự động qua Leads Hub |
| **Người dùng (Actor)** | Nhân viên Sales, Giám đốc Kinh doanh (CCO), Khách hàng đối tác |
| **Tiền điều kiện (Pre-conditions)** | Người dùng đăng nhập hệ thống Web CRM hoặc Mobile App của doanh nghiệp mình. |
| **Luồng xử lý chính (Main Flow)** | 1. Sales sử dụng thẻ danh thiếp số ViCard chạm vào điện thoại đối tác tại hội nghị.<br>2. Trang danh thiếp công khai của Sales mở ra trên điện thoại đối tác. Đối tác nhập: Họ tên, Số điện thoại, Tên công ty và bấm "Gửi Thông Tin Kết Nối".<br>3. Hệ thống ghi nhận bản ghi mới vào bảng `connect_leads` với `status = 'new'`, gắn kèm `tenant_id` của công ty Sales.<br>4. App ViOne Connect của Sales lập tức nhận được thông báo đẩy: "Bạn có 1 Khách hàng tiềm năng mới từ Leads Hub!".<br>5. Sales mở danh sách Leads, xem thông tin và bấm nút "Chuyển thành Khách Hàng Chính Thức" (Convert to Account).<br>6. Hệ thống tự động tạo bản ghi trong bảng `crm_accounts` và `crm_contacts`, đồng thời tạo 1 cơ hội bán hàng mới trên phễu Kanban để nhân sự bắt đầu quy trình chăm sóc. |
| **Luồng thay thế / Ngoại lệ (Alternative Flows / Exceptions)** | - **Khách đã tồn tại:** Hệ thống nhận diện theo số điện thoại/email, đưa ra cảnh báo trùng lặp và hỏi người dùng có muốn gộp dữ liệu hay không. |
| **Hậu điều kiện (Post-conditions)** | Thông tin khách hàng được lưu trữ vĩnh viễn trong cơ sở dữ liệu nội bộ của công ty; không có bất kỳ rò rỉ nào sang các doanh nghiệp khác trong hệ thống. |

---

### 6.2. Bảng Use Case: UC-VIONE-02 — Điều Hành Phễu Bán Hàng Trực Quan (Deals Kanban)

| Thuộc tính Use Case | Nội dung chi tiết |
| :--- | :--- |
| **ID** | **UC-VIONE-02** |
| **Tên chức năng** | Quản lý phễu cơ hội kinh doanh dạng bảng Kanban kéo thả và Dự báo doanh số |
| **Người dùng (Actor)** | Nhân viên Sales, Giám đốc Kinh doanh (CCO), Tổng Giám Đốc (CEO) |
| **Tiền điều kiện (Pre-conditions)** | Doanh nghiệp đã thiết lập các giai đoạn phễu bán hàng (Stages) trên Web CRM. |
| **Luồng xử lý chính (Main Flow)** | 1. Người dùng mở mục "Phễu Bán Hàng (Deals)" trên Web CRM. Bảng Kanban hiển thị các cột: *Tiếp cận ➔ Xác định nhu cầu ➔ Gửi báo giá ➔ Đàm phán ➔ Chốt đơn thành công (Won)*.<br>2. Mỗi thương vụ được hiển thị dạng thẻ (Card) bao gồm: Tên thương vụ, Khách hàng, Giá trị tiền tệ ước tính, Sales phụ trách.<br>3. Khi thương vụ có tiến triển, Sales dùng chuột nhấp giữ thẻ thương vụ và kéo thả sang cột giai đoạn tiếp theo.<br>4. Hệ thống gọi API `PUT /api/crm/deals/:id/stage`, cập nhật trạng thái mới vào cơ sở dữ liệu.<br>5. Tổng giá trị phễu (Pipeline Value) và tỷ lệ chuyển đổi ở đầu mỗi cột tự động tính toán lại tức thì theo thời gian thực.<br>6. Ban giám đốc xem biểu đồ dự báo doanh thu do AI phân tích dựa trên xác suất thành công của từng cột. |
| **Luồng thay thế / Ngoại lệ (Alternative Flows / Exceptions)** | - **Thương vụ thất bại:** Kéo thẻ sang cột "Thất bại (Lost)", hệ thống hiển thị popup bắt buộc chọn lý do thất bại (Giá cao, Đối thủ, Hoãn dự án...) để phục vụ báo cáo. |
| **Hậu điều kiện (Post-conditions)** | Dữ liệu tiến độ bán hàng được cập nhật đồng bộ; ban lãnh đạo nắm bắt chính xác sức khỏe kinh doanh của doanh nghiệp. |

---

### 6.3. Bảng Use Case: UC-VIONE-03 — Khách (Non-Member) Đăng Ký Hội Thảo & Soát Vé QR

| Thuộc tính Use Case | Nội dung chi tiết |
| :--- | :--- |
| **ID** | **UC-VIONE-03** |
| **Tên chức năng** | Khách mời bên ngoài đăng ký tham gia hội thảo doanh nghiệp và điểm danh quét QR |
| **Người dùng (Actor)** | Khách mời (Lê Thị Thủy), Ban Tổ Chức Hội Thảo, Nhân sự Lễ tân |
| **Tiền điều kiện (Pre-conditions)** | Hội thảo / Diễn đàn doanh nghiệp đã được xuất bản công khai trên cổng web ViOne. |
| **Luồng xử lý chính (Main Flow)** | 1. Khách mở landing page diễn đàn doanh nghiệp, bấm "Đăng Ký Tham Dự".<br>2. Điền thông tin: Họ tên (Lê Thị Thủy), Số điện thoại (0912345678), **bắt buộc nhập Email `thuylt313@gmail.com`**, Tên công ty (Dược Phẩm Thủy Lê), Chức vụ (Giám đốc).<br>3. Chọn loại vé (Vé đại biểu miễn phí hoặc Vé VIP có tiệc tối quét mã VietQR).<br>4. Bấm nút "Hoàn Tất Đăng Ký".<br>5. Hệ thống sinh mã vé điện tử duy nhất và lưu vào cơ sở dữ liệu.<br>6. **KẾT QUẢ BẮT BUỘC: Hệ thống tự động đẩy Template email xác nhận tham dự hội thảo kèm mã vé QR điện tử về hòm thư `thuylt313@gmail.com`**.<br>7. Vào ngày diễn ra hội thảo, khách xuất trình mã QR trong email cho lễ tân tại bàn đón tiếp.<br>8. Lễ tân quét mã QR: Màn hình hiện viền xanh "HỢP LỆ - Đại biểu Lê Thị Thủy - Ghế VIP Hàng A-12".<br>9. Lễ tân bấm "Xác nhận vào cửa", hệ thống cập nhật `is_checked_in = true`. |
| **Luồng thay thế / Ngoại lệ (Alternative Flows / Exceptions)** | - **Vé quét trùng lần 2:** Hệ thống phát chuông cảnh báo đỏ và hiển thị: "Vé này đã được check-in vào cửa lúc [HH:mm]".<br>- **Email sai định dạng:** Báo lỗi đỏ dưới ô Email và chặn không cho gửi form. |
| **Hậu điều kiện (Post-conditions)** | Khách nhận được vé mời đầy đủ qua email; Ban Tổ Chức kiểm soát chính xác 100% quân số đại biểu tham dự. |

---

### 6.4. Bảng Use Case: UC-VIONE-04 — Soạn Thảo Báo Giá B2B Điện Tử & Duyệt Ký Số Hợp Đồng

| Thuộc tính Use Case | Nội dung chi tiết |
| :--- | :--- |
| **ID** | **UC-VIONE-04** |
| **Tên chức năng** | Tạo báo giá bán hàng B2B có chiết khấu, xuất PDF chuẩn mẫu và luồng duyệt hợp đồng |
| **Người dùng (Actor)** | Nhân viên Sales, Giám đốc Kinh doanh (CCO), Khách hàng |
| **Tiền điều kiện (Pre-conditions)** | Danh mục sản phẩm/dịch vụ của công ty đã được thiết lập giá niêm yết trong cơ sở dữ liệu. |
| **Luồng xử lý chính (Main Flow)** | 1. Sales mở chi tiết thương vụ trên Web CRM, nhấn "Tạo Báo Giá Mới".<br>2. Chọn các sản phẩm từ danh mục, nhập số lượng, áp dụng mức chiết khấu thương mại (Ví dụ: 5%) và chọn thuế suất VAT (10%).<br>3. Hệ thống tính toán chính xác tổng tiền: `Tổng = Tiền hàng - Tiền chiết khấu + Thuế VAT`.<br>4. Sales nhấn "Xem Trước Báo Giá", hệ thống sinh bản xem trước PDF chuẩn form công ty có logo và điều khoản thanh toán.<br>5. Nếu chiết khấu vượt quá 5%, hệ thống kích hoạt luồng phê duyệt gửi thông báo đến CCO.<br>6. CCO bấm "Phê Duyệt Phát Hành", hệ thống tự động gửi email báo giá chính thức kèm đường link ký số trực tuyến đến khách hàng. |
| **Luồng thay thế / Ngoại lệ (Alternative Flows / Exceptions)** | - **Từ chối chiết khấu:** CCO bấm "Từ chối" kèm ghi chú yêu cầu Sales đàm phán lại. Báo giá chuyển về trạng thái `draft`. |
| **Hậu điều kiện (Post-conditions)** | Báo giá hợp lệ được lưu trong bảng `crm_quotations`, sẵn sàng chuyển đổi thành hợp đồng chính thức khi khách hàng đồng ý. |

---

### 6.5. Bảng Use Case: UC-VIONE-05 — Hóa Đơn & Cổng Thanh Toán VietQR Tự Động Gạch Nợ 24/7

| Thuộc tính Use Case | Nội dung chi tiết |
| :--- | :--- |
| **ID** | **UC-VIONE-05** |
| **Tên chức năng** | Phát hành hóa đơn điện tử có mã VietQR Napas và tự động đối soát gạch nợ qua Webhook |
| **Người dùng (Actor)** | Kế Toán Trưởng, Khách hàng thanh toán, Hệ thống Ngân hàng (Webhook) |
| **Tiền điều kiện (Pre-conditions)** | Tài khoản ngân hàng doanh nghiệp đã tích hợp thành công Webhook biến động số dư VietQR Napas 24/7. |
| **Luồng xử lý chính (Main Flow)** | 1. Kế toán trưởng nhấn "Xuất Hóa Đơn Thanh Toán" trên Web CRM.<br>2. Hệ thống sinh mã VietQR chuẩn Napas 24/7 có chứa thông tin tài khoản công ty, số tiền chính xác và cú pháp: `VIONE [Mã_Hóa_Đơn]`.<br>3. Khách hàng dùng app ngân hàng quét mã VietQR và thực hiện lệnh chuyển khoản.<br>4. Ngân hàng gửi Webhook thanh toán tức thì tới Backend ViOne `/api/finance/vietqr/webhook`.<br>5. Backend đối khớp chính xác mã hóa đơn và số tiền chuyển về.<br>6. Hệ thống thực hiện chuỗi tác vụ tự động trong 1 giây:<br>- Cập nhật hóa đơn sang trạng thái `paid` (Đã thanh toán).<br>- Tự động ghi 1 bút toán thu vào Sổ quỹ tài chính nội bộ công ty.<br>- Cập nhật trạng thái thương vụ liên quan sang `Won` (Thành công).<br>- Gửi thông báo đẩy đến điện thoại của Sales và Kế toán báo có tiền về tài khoản. |
| **Luồng thay thế / Ngoại lệ (Alternative Flows / Exceptions)** | - **Khách chuyển sai số tiền hoặc sai cú pháp:** Đánh dấu giao dịch vào mục "Chờ đối soát thủ công" để kế toán xác nhận bằng tay. |
| **Hậu điều kiện (Post-conditions)** | Doanh nghiệp thu hồi công nợ nhanh chóng, giảm thiểu 100% sai sót đối soát kế toán thủ công. |

---

### 6.6. Bảng Use Case: UC-VIONE-06 — Cấu Hình Danh Thiếp 3D (ViCard) & Ghi Chip Thẻ NFC Vật Lý

| Thuộc tính Use Case | Nội dung chi tiết |
| :--- | :--- |
| **ID** | **UC-VIONE-06** |
| **Tên chức năng** | Tùy biến danh thiếp số 3D phủ Titanium ánh kim và nạp dữ liệu vào thẻ thông minh NFC |
| **Người dùng (Actor)** | Doanh nhân, Nhân sự công ty, Quản trị viên Doanh nghiệp |
| **Tiền điều kiện (Pre-conditions)** | Điện thoại có hỗ trợ tính năng NFC và thẻ nhựa NFC ViCard trắng. |
| **Luồng xử lý chính (Main Flow)** | 1. Người dùng mở app ViOne Connect, vào mục "Danh Thiếp ViCard".<br>2. Chọn chủ đề thiết kế 3D (Titanium Trắng ngọc trai hoặc Obsidian Đen Nhũ Vàng), tải ảnh chân dung, logo doanh nghiệp, các liên kết mạng xã hội.<br>3. Kiểm tra mô hình 3D tương tác của tấm thẻ lấp lánh ánh kim khi xoay điện thoại.<br>4. Nhấn nút "Ghi Dữ Liệu Lên Thẻ NFC Vật Lý", áp sát thẻ nhựa ViCard vào mặt lưng điện thoại.<br>5. Hệ thống ghi đường dẫn định danh số (`https://vione.vn/card/:slug`) vào bộ nhớ chip NFC trong 0.5 giây.<br>6. Ứng dụng phát thông báo thành công: "Thẻ danh thiếp số ViCard của bạn đã sẵn sàng kết nối giao thương!". |
| **Luồng thay thế / Ngoại lệ (Alternative Flows / Exceptions)** | - **Lỗi ghi thẻ do lệch vị trí:** Ứng dụng thông báo lỗi và yêu cầu áp thẻ cố định lại ở cụm ăng-ten NFC. |
| **Hậu điều kiện (Post-conditions)** | Thẻ vật lý NFC và danh thiếp số 3D được đồng bộ hoàn hảo, sẵn sàng sử dụng để kết nối đối tác. |

---

### 6.7. Bảng Use Case: UC-VIONE-07 — Ghép Cặp Đối Tác Tự Động Bằng Trí Tuệ Nhân Tạo (AI Engine)

| Thuộc tính Use Case | Nội dung chi tiết |
| :--- | :--- |
| **ID** | **UC-VIONE-07** |
| **Tên chức năng** | Phân tích ngữ nghĩa nhu cầu Cung - Cầu và gợi ý kết nối đối tác B2B bằng thuật toán AI |
| **Người dùng (Actor)** | Doanh nghiệp thành viên mạng lưới ViOne Connect, Hệ sinh thái AI |
| **Tiền điều kiện (Pre-conditions)** | Doanh nghiệp đã cập nhật đầy đủ hồ sơ năng lực và ngành nghề hoạt động trên ViOne Connect. |
| **Luồng xử lý chính (Main Flow)** | 1. Doanh nghiệp A đăng tải nhu cầu tìm mua vật tư trên ViOne Connect bằng ngôn ngữ tự nhiên.<br>2. Động cơ AI phân tích ngữ nghĩa nội dung và quét toàn bộ cơ sở dữ liệu năng lực doanh nghiệp trong hệ thống.<br>3. Thuật toán tính toán điểm tương thích (Match Score) dựa trên ngành nghề, năng lực sản xuất, quy mô dự án và vị trí địa lý.<br>4. Với các kết quả có điểm tương thích trên 85%, hệ thống tự động đẩy thông báo gợi ý thông minh cho cả hai bên.<br>5. Doanh nghiệp bấm vào gợi ý để xem hồ sơ năng lực chi tiết của đối tác và tiến hành gửi lời mời kết nối kinh doanh. |
| **Luồng thay thế / Ngoại lệ (Alternative Flows / Exceptions)** | - **Điểm tương thích < 80%:** Hiển thị bài đăng trên Bảng tin Giao thương công khai để các đối tác khác chủ động tiếp cận. |
| **Hậu điều kiện (Post-conditions)** | Giảm thiểu 90% thời gian tìm kiếm nhà cung cấp; tạo ra các liên minh chuỗi cung ứng thực chất cho doanh nghiệp. |

---

### 6.8. Bảng Use Case: UC-VIONE-08 — Lên Lịch Hẹn Bàn Tròn 1-1 & Nhắn Tin Đàm Phán Mã Hóa E2E

| Thuộc tính Use Case | Nội dung chi tiết |
| :--- | :--- |
| **ID** | **UC-VIONE-08** |
| **Tên chức năng** | Đặt lịch hẹn gặp đối tác bàn chiến lược và chat đàm phán hợp đồng mã hóa E2E |
| **Người dùng (Actor)** | Hai doanh nhân tham gia kết nối và đàm phán thương mại |
| **Tiền điều kiện (Pre-conditions)** | Cả hai doanh nhân đều có tài khoản đã xác thực trên mạng lưới ViOne Connect. |
| **Luồng xử lý chính (Main Flow)** | 1. Doanh nhân A xem danh thiếp số của Doanh nhân B, bấm "Đặt Lịch Hẹn Giao Thương".<br>2. Chọn ngày giờ hẹn, chọn hình thức (trực tiếp tại văn phòng hoặc họp video trực tuyến) và gửi lời mời.<br>3. Doanh nhân B bấm "Đồng ý", hệ thống tự động sinh link phòng họp ảo và đồng bộ sự kiện vào Google/Apple Calendar của cả hai người.<br>4. Trước giờ gặp, hai bên mở phòng chat bảo mật mã hóa đầu cuối (E2E) trên ViOne Connect để trao đổi tài liệu, đính kèm báo giá hoặc hợp đồng kinh tế. |
| **Luồng thay thế / Ngoại lệ (Alternative Flows / Exceptions)** | - **Báo bận:** Doanh nhân B bấm "Đề xuất giờ khác" hoặc "Từ chối" kèm lý do. Hệ thống thông báo ngay cho bên gửi để sắp xếp lại. |
| **Hậu điều kiện (Post-conditions)** | Lịch hẹn được thiết lập chuyên nghiệp; quá trình đàm phán hợp đồng diễn ra bảo mật tuyệt đối. |

---

## 7. YÊU CẦU PHI CHỨC NĂNG (Non-Functional Requirements)

* **Hiệu năng (Performance):** Truy vấn dữ liệu CRM dưới 150ms; đọc ghi danh thiếp NFC dưới 80ms; xử lý Webhook ngân hàng dưới 1.0s; phục vụ đồng thời 5,000+ doanh nghiệp trên cùng cụm hạ tầng với độ trễ ổn định.
* **Bảo mật Multi-Tenant (Security):** Áp dụng Row Level Security (RLS) tại cơ sở dữ liệu kết hợp Tenant Guard Middleware, ngăn chặn 100% rò rỉ dữ liệu giữa các công ty; mã hóa AES-256 data-at-rest; mã hóa TLS 1.3 data-in-transit; Audit Log bất biến.
* **Tính khả dụng (Usability):** Chuẩn thiết kế Titanium Trắng Ánh Kim & Vàng Gold sang trọng; thao tác kéo thả Kanban mượt mà; hỗ trợ song ngữ Tiếng Việt và Tiếng Anh hoàn chỉnh.
* **Khả năng bảo trì (Maintainability):** Kiến trúc Monorepo phân lớp độc lập, 100% mã nguồn TypeScript Strict Mode, tự động hóa CI/CD không có thời gian chết (Zero-downtime).

---

## 8. THIẾT KẾ CƠ SỞ DỮ LIỆU ĐA DOANH NGHIỆP (DATABASE SCHEMA)

Cơ sở dữ liệu PostgreSQL của ViOne quản lý 10 bảng thực thể cốt lõi cô lập theo `tenant_id`:
1. `tenants`: id (UUID, PK), company_name, tax_code (Unique), subdomain (Unique), subscription_plan, status.
2. `vione_users`: id (UUID, PK), tenant_id (FK), email (Unique), password_hash, full_name, phone, role (CEO/CCO/SALES/ACCOUNTANT), must_change_password.
3. `crm_accounts`: id (UUID, PK), tenant_id (FK), account_name, tax_code, phone, website, industry, assigned_sales_id (FK).
4. `crm_contacts`: id (UUID, PK), account_id (FK), full_name, position, phone, email.
5. `crm_deals`: id (UUID, PK), tenant_id (FK), deal_name, account_id (FK), stage_id, expected_revenue, probability, assigned_to (FK).
6. `crm_quotations`: id (UUID, PK), deal_id (FK), subtotal, discount_amount, vat_amount, total_amount, status, approved_by.
7. `crm_invoices`: id (UUID, PK), invoice_number (Unique), deal_id (FK), amount, vietqr_payload, status, paid_at.
8. `connect_cards`: id (UUID, PK), user_id (FK, Unique), slug (Unique), nfc_chip_id, card_theme, view_count.
9. `connect_leads`: id (UUID, PK), tenant_id (FK), captured_by_card_id (FK), lead_name, lead_phone, lead_company, status.
10. `connect_appointments`: id (UUID, PK), sender_id (FK), receiver_id (FK), meeting_time, meeting_type, location_or_url, status.
