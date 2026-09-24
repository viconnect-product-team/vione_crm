# TRỌN BỘ TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & KIẾN TRÚC CƠ SỞ DỮ LIỆU
## HỆ THỐNG LIÊN MINH VIONE CONNECT & CLB DOANH NHÂN CEO 1983

> **Dành cho:** Ban Lãnh Đạo, Chuyên Viên Nghiệp Vụ, Đội Ngũ Vận Hành & Lập Trình Viên.  
> **Tiêu chí biên soạn:** Chính xác 100% về mặt kỹ thuật (API, Bảng CSDL, Trường dữ liệu, Khóa ngoại, Phép JOIN), diễn đạt bằng **ngôn từ đời thường, hình tượng hoá trực quan** để bất kỳ ai không học IT cũng có thể hiểu tường tận cách hệ thống vận hành.

---

# PHẦN 1: GIẢI THÍCH BÌNH DÂN CÁC KHÁI NIỆM KỸ THUẬT CỐT LÕI
*(Dành cho người không chuyên về Công nghệ thông tin)*

Để hiểu được toàn bộ hệ thống lưu trữ và xử lý thông tin như thế nào, hãy hình dung hệ thống phần mềm giống như **Tòa Nhà Trụ Sở Hiệp Hội & Doanh Nghiệp**:

### 1. Cơ sở dữ liệu (Database) là gì?
* **Ví von đời thường:** Giống như một **Phòng Lưu Trữ Hồ Sơ Trung Tâm** của tòa nhà, nơi chứa tất cả thông tin về con người, tiền bạc, sự kiện và hợp đồng của CLB.
* **Tên trong hệ thống:** Hệ quản trị cơ sở dữ liệu quan hệ **PostgreSQL**.

### 2. Bảng (Table) là gì?
* **Ví von đời thường:** Trong phòng lưu trữ có nhiều **Tủ hồ sơ** riêng biệt. Mỗi tủ dán nhãn một loại tài liệu chuyên biệt:
  * Tủ `vione_users`: Đựng hồ sơ tài khoản đăng nhập (email, mật khẩu).
  * Tủ `members`: Đựng hồ sơ lý lịch hội viên CLB CEO 1983 (họ tên, công ty, chức vụ).
  * Tủ `events`: Đựng thông tin các sự kiện, hội thảo, đại hội gala.
  * Tủ `event_registrations`: Đựng danh sách vé và người đăng ký sự kiện.
  * Tủ `invoices`: Đựng sổ thu tiền hội phí và hóa đơn.
* **Mỗi dòng (Row / Record):** Là **một bộ hồ sơ cụ thể** của một người hay một sự kiện (ví dụ: hồ sơ của CEO Nguyễn Văn An).
* **Mỗi cột (Column / Field):** Là **từng ô mục cần điền** trên tờ khai hồ sơ đó (ví dụ: Họ tên, Số điện thoại, Email, Ngày sinh).

### 3. Khóa chính (Primary Key - PK / Cột `id`) là gì?
* **Ví von đời thường:** Giống như **Số Căn Cước Công Dân (CCCD)** duy nhất của mỗi công dân. Dù có 10 người cùng tên "Nguyễn Văn An", hệ thống vẫn phân biệt được nhờ mã số `id` này. Mã này không bao giờ trùng lặp (thường là chuỗi mã UUID ngẫu nhiên an toàn như `e71e8b9f-c824-4ad5-9ebc-fcb9441f5cb5`).

### 4. Khóa ngoại (Foreign Key - FK) là gì?
* **Ví von đời thường:** Giống như **dòng ghi "Họ tên chủ hộ" trên sổ hộ khẩu** hoặc **"Mã thẻ nhân viên"**. Ví dụ: Trong tủ Vé Sự Kiện `event_registrations`, mỗi tờ vé phải ghi rõ `event_id` (vé này xem sự kiện nào?) và `member_id` (vé này của ai?). Nhờ mã này mà máy tính biết tờ vé thuộc về ai mà không cần phải chép lại toàn bộ lý lịch của người đó vào tờ vé.

### 5. Bảng phụ / Bảng trung gian (Junction Table) là gì?
* **Ví von đời thường:** Hãy tưởng tượng: Một Hội viên có thể tham gia **nhiều Sự kiện**, và Một Sự kiện lại có **hàng trăm Hội viên** tham dự (Mối quan hệ Nhiều - Nhiều). Người ta không thể nhét danh sách 500 người vào 1 ô trong tờ sự kiện. Thay vào đó, ban thư ký lập ra một cuốn **"Sổ Điểm Danh / Cuống Vé"** đứng ở giữa. Cuốn sổ đó chính là **Bảng Trung Gian** (như bảng `event_registrations` hay `member_checkins`), mỗi dòng ghi: "Hội viên A đã đăng ký Sự kiện B vào lúc mấy giờ".

### 6. Phép `JOIN` (Ghép Bảng) trong cơ sở dữ liệu là gì?
* **Ví von đời thường:** Khi cần in danh sách đại biểu dự tiệc Gala có kèm Tên Công Ty và Số Điện Thoại:
  * Tủ Vé `event_registrations` chỉ có mã hội viên `member_id` và số vé.
  * Tủ Hội Viên `members` mới có Tên Công Ty và Chức Danh.
  * Hành động `JOIN` chính là thao tác người thư ký lấy tờ vé ra, nhìn thấy mã `member_id`, liền chạy sang tủ `members` rút đúng tờ hồ sơ có mã đó ra, rồi dùng **kẹp ghim kẹp 2 tờ giấy lại với nhau** để người đọc nhìn thấy trọn vẹn: *"Anh A - Giám đốc Công ty B - Giữ vé số 08 - Đã check-in lúc 07:30"*.

---

# PHẦN 2: BẢN ĐỒ KIẾN TRÚC 4 PHÂN HỆ PHẦN MỀM

Toàn bộ hệ thống liên minh ViOne Connect & CEO 1983 bao gồm 4 ứng dụng cốt lõi:

| STT | Phân Hệ | Đối Tượng Sử Dụng | Mục Đích Chính | Nền Tảng Kỹ Thuật |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Web CRM CEO 1983** | Ban Thư Ký, Chủ Tịch, Kế Toán Hiệp Hội CEO 1983 | Quản lý hội viên, phê duyệt hồ sơ gia nhập, tạo sự kiện, xuất vé QR, thu hội phí, điều hành hiệp hội. | Web Admin (React, Vite, TanStack Router, Nitro SSR), Port 5002/5444 |
| **2** | **App Hiệp Hội CEO 1983** | Hội viên CLB Doanh Nhân CEO 1983, Ban Truyền Thông | Tra cứu danh bạ hội viên, bấm "Gắn kết" hẹn gặp giao thương, xem lịch sử kết nối, nhận vé sự kiện & quét mã QR check-in đại biểu. | Mobile Web PWA & Android/iOS Native (Capacitor), Tên app: `CEO1983` |
| **3** | **App ViOne Connect (Business Connect)** | Cộng đồng Doanh nhân B2B, Người dùng thẻ NFC | Chạm danh thiếp thông minh NFC 1-chạm, trao đổi danh bạ điện tử 3D, chat trực tiếp, tạo cơ hội hợp tác kinh doanh B2B. | Mobile PWA & Android/iOS Native (Capacitor), Giao diện Titanium Vàng Đồng |
| **4** | **Web CRM ViOne** | Doanh nghiệp thành viên, Đội ngũ Kinh doanh | Quản trị khách hàng tiềm năng (Leads), quản lý đối tác, theo dõi hợp đồng, quản trị sản phẩm và chuỗi giao thương B2B khép kín. | Web CRM Doanh nghiệp Enterprise (163 bảng dữ liệu cô lập đa tenant), Port 5000/5001 |

---

# PHẦN 2.1: MA TRẬN 11 QUY ĐỊNH NGHIỆP VỤ & PHÂN QUYỀN CỐT LÕI (MASTER BA SPECIFICATION)

Nhằm đảm bảo tính minh bạch, an toàn dữ liệu và phân tách thẩm quyền rõ ràng giữa Ban Quản Trị, các Ban chuyên trách và Hội viên, hệ thống hiệp hội tuân thủ nghiêm ngặt 11 quy định nghiệp vụ chuẩn mực sau:

| STT | Quy Định Nghiệp Vụ Cốt Lõi | Cơ Chế Xử Lý & Ràng Buộc Dữ Liệu Kỹ Thuật | Phân Hệ Triển Khai |
| :--- | :--- | :--- | :--- |
| **1** | **Bỏ doanh thu công ty ở màn Landing Page; chỉ gửi mail tài khoản khi Admin/BQT duyệt** | - Loại bỏ trường `revenue` (Doanh thu công ty) trên tất cả các form đăng ký Landing Page.<br>- Đơn gửi về bảng `members` mang trạng thái `status = 'pending'`. Không tự ý tạo tài khoản đăng nhập hay gửi email mật khẩu.<br>- Chỉ khi **Super Admin** hoặc **Ban Quản Trị** bấm nút **"Duyệt Gia Nhập"** trên Web CRM, hệ thống mới khởi tạo tài khoản trong `vione_users`, phát hành mã hội viên duy nhất và kích hoạt dịch vụ gửi Email thông báo kèm tài khoản/mật khẩu đăng nhập. | Web Landing Page, Web CRM CEO 1983, Mail Service |
| **2** | **Chỉ định người quét mã QR soát vé sự kiện (Chỉ Ban Truyền Thông được BQT phân công)** | - Mặc định trên App Mobile & Web, hội viên thường **hoàn toàn không hiển thị** nút hoặc giao diện camera quét mã QR.<br>- Chỉ những nhân sự thuộc **Ban Truyền Thông** VÀ được **Ban Quản Trị gán quyền cụ thể cho sự kiện đó** (lưu trong bảng `event_scanners`) mới xuất hiện biểu tượng camera quét QR soát vé.<br>- Khi quét, API `/api/events/:id/checkin` kiểm tra quyền `event_scanners.user_id = auth.uid()` trước khi xác nhận vé đại biểu thành công. | App Hiệp Hội CEO 1983, Web CRM CEO 1983 |
| **3** | **Thẩm quyền Gia Hạn Hội Viên** | - Chỉ **Ban Thành Viên** và **Super Admin** mới có thẩm quyền thực hiện thao tác gia hạn thời gian hội viên, điều chỉnh ngày hết hạn `expiry_date` và xác nhận trạng thái gia hạn niên liễm trên Web CRM. | Web CRM CEO 1983 (Phân hệ Hội viên) |
| **4** | **Phân quyền Phân hệ Tài Chính & Truyền Thông** | - **Phân hệ Tài Chính (Invoices, Quỹ, Báo cáo tài trợ):** Chỉ hiển thị và cho phép truy cập với Super Admin, Ban Quản Trị và các tài khoản thuộc **Ban Tài Chính**.<br>- **Phân hệ Truyền Thông (Tin tức, Bản tin, Đăng bài sự kiện):** Cho phép Super Admin, Ban Quản Trị và các tài khoản thuộc **Ban Truyền Thông** quản lý. | Web CRM CEO 1983 |
| **5** | **Quản trị Cuộc Họp Thông Minh (Online / Offline) & Điều Hướng Tin Nhắn** | - Chỉ Super Admin và Ban Quản Trị mới có quyền khởi tạo và quản lý phiên họp.<br>- Cuộc họp phân loại: `ONLINE` (gắn link Google Meet / Zoom) hoặc `OFFLINE` (địa điểm thực tế).<br>- Với cuộc họp **OFFLINE**, khi bấm "Phát hành thư mời", hệ thống tự động kích hoạt luồng push notification và gửi tin nhắn (In-app Message) chứa rõ: **Địa điểm tổ chức, Ngày giờ diễn ra, Bản đồ chỉ đường** trực tiếp đến hộp thư cá nhân của tất cả hội viên được triệu tập. | Web CRM & App Hiệp Hội CEO 1983 |
| **6** | **Kênh Kết Nối & Nhắn Tin B2B Trực Tiếp Trên Web CRM** | - Bổ sung module kết nối giao thương và chat trực tiếp ngay trên Web CRM, cho phép các hội viên và doanh nghiệp trao đổi thông tin, gửi hồ sơ năng lực và thảo luận hợp tác kinh doanh mà không cần rời màn hình làm việc. | Web CRM CEO 1983 |
| **7** | **Chuẩn Hóa Luồng "Cuộc Gặp" (Lên Lịch Hẹn Bàn 1-on-1)** | - Định danh luồng "Cuộc gặp" trên hệ thống chính là quy trình: **Gửi lời mời kết nối & Lên lịch hẹn gặp giao thương (1-on-1 Meeting)** đã được tối ưu trên App Hiệp Hội CEO 1983 (chọn thời gian, địa điểm, mục tiêu trao đổi và lưu vào nhật ký kết nối). | App Hiệp Hội CEO 1983 & Web CRM |
| **8** | **Cơ Chế Phê Duyệt Tài Khoản Doanh Nghiệp & Hồ Sơ Năng Lực** | - Hồ sơ năng lực doanh nghiệp khi đăng tải hoặc sửa đổi cần qua bộ lọc kiểm duyệt của Ban Thư Ký để đảm bảo chuẩn mực uy tín trước khi công khai lên sàn B2B. | Web CRM & App ViOne Connect |
| **9** | **Quyền Hạn Tối Cao Mặc Định (Super Admin & Ban Quản Trị)** | - Mặc định **Super Admin** và thành viên **Ban Quản Trị (Board of Directors)** có Full Quyền (View, Create, Update, Delete, Approve, Export, Manage Config) trên tất cả các phân hệ và dữ liệu của hiệp hội. | Toàn bộ 4 phân hệ phần mềm |
| **10** | **Phân Quyền Hội Viên Thường (Chỉ Xem Hiệp Hội - Chỉ Thao Tác Dữ Liệu Cá Nhân)** | - **QUYỀN XEM (Read-only):** Danh bạ hội viên, Danh bạ doanh nghiệp, Lịch sự kiện, Tổng quan sự kiện, Danh sách nhà tài trợ, Gói tài trợ, Báo cáo tài trợ công khai, Thông báo gửi tới tài khoản của mình, Tin tức/Bản tin, Quyền lợi hội viên, Phiên họp (xem lịch họp), Biểu quyết (chỉ được bỏ phiếu biểu quyết, KHÔNG ĐƯỢC tạo phiên biểu quyết).<br>- **QUYỀN THAO TÁC (Tạo/Sửa/Xóa dữ liệu cá nhân):** Đăng ký tham gia sự kiện, Quản trị Danh thiếp điện tử thông minh của tôi (My Smart Card), Gửi kết nối & Lên lịch cuộc gặp 1-on-1, Cài đặt nhật ký hoạt động cá nhân. | App Hiệp Hội CEO 1983 & Web Portal |
| **11** | **Chi Tiết Hóa Ma Trận Phân Quyền Theo Từng Hành Động Con (Sub-functions)** | - Bắt buộc phân rã chi tiết từng chức năng con: `VIEW` (Xem), `CREATE` (Thêm mới), `UPDATE` (Chỉnh sửa), `DELETE` (Xóa bỏ), `APPROVE` (Phê duyệt), `EXPORT` (Xuất báo cáo Excel/PDF), `SCAN_QR` (Soát vé QR) theo bảng ma trận RBAC bên dưới. | Toàn bộ 4 phân hệ phần mềm |

---

# PHẦN 2.2: MA TRẬN PHÂN QUYỀN CHI TIẾT THEO HÀNH ĐỘNG CON (GRANULAR RBAC MATRIX)

> **Ký hiệu viết tắt trong bảng:**  
> - **ADM**: Super Admin | **BQT**: Ban Quản Trị (Ban Chấp Hành) | **BTV**: Ban Thành Viên  
> - **BTC**: Ban Tài Chính | **BTT**: Ban Truyền Thông | **HVT**: Hội Viên Thường  
> - **[x]**: Có quyền thực hiện | **[-]**: Không có quyền truy cập/thao tác | **[Owner]**: Chỉ có quyền thao tác trên dữ liệu do chính mình tạo ra

| Nhóm Phân Hệ | Chức Năng Cha / Con | ADM | BQT | BTV | BTC | BTT | HVT |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Quản lý Hội viên** | • Xem danh sách & hồ sơ hội viên (`VIEW`) | [x] | [x] | [x] | [x] | [x] | [x] |
| | • Thêm mới / Đăng ký hội viên (`CREATE`) | [x] | [x] | [x] | [-] | [-] | [Owner] |
| | • Cập nhật thông tin hội viên (`UPDATE`) | [x] | [x] | [x] | [-] | [-] | [Owner] |
| | • Xóa hồ sơ hội viên (`DELETE`) | [x] | [x] | [-] | [-] | [-] | [-] |
| | • Duyệt hồ sơ & Cấp tài khoản (`APPROVE`) | [x] | [x] | [-] | [-] | [-] | [-] |
| | • Xuất danh bạ Excel (`EXPORT`) | [x] | [x] | [x] | [-] | [-] | [-] |
| **2. Gia hạn Hội viên** | • Xem lịch sử & tình trạng niên liễm (`VIEW`) | [x] | [x] | [x] | [x] | [-] | [Owner] |
| | • Thực hiện gia hạn niên liễm (`UPDATE/APPROVE`) | [x] | [-] | [x] | [-] | [-] | [-] |
| **3. Quản lý Doanh nghiệp** | • Xem thông tin doanh nghiệp (`VIEW`) | [x] | [x] | [x] | [x] | [x] | [x] |
| | • Tạo / Cập nhật hồ sơ doanh nghiệp (`CREATE/UPDATE`) | [x] | [x] | [x] | [-] | [-] | [Owner] |
| | • Xóa thông tin doanh nghiệp (`DELETE`) | [x] | [x] | [-] | [-] | [-] | [-] |
| **4. Quản lý Sự kiện** | • Xem danh sách & tổng quan sự kiện (`VIEW`) | [x] | [x] | [x] | [x] | [x] | [x] |
| | • Tạo mới sự kiện (`CREATE`) | [x] | [x] | [-] | [-] | [x] | [-] |
| | • Chỉnh sửa thông tin sự kiện (`UPDATE`) | [x] | [x] | [-] | [-] | [x] | [-] |
| | • Xóa / Hủy sự kiện (`DELETE`) | [x] | [x] | [-] | [-] | [-] | [-] |
| | • Đăng ký tham gia sự kiện (`REGISTER`) | [x] | [x] | [x] | [x] | [x] | [x] |
| | • Quét mã QR soát vé đại biểu (`SCAN_QR`) | [x] | [x] | [-] | [-] | [BTT Phân công] | [-] |
| | • Chỉ định nhân sự soát vé QR (`ASSIGN_SCANNER`)| [x] | [x] | [-] | [-] | [-] | [-] |
| **5. Tài trợ Sự kiện** | • Xem danh sách nhà tài trợ & gói tài trợ (`VIEW`)| [x] | [x] | [x] | [x] | [x] | [x] |
| | • Tạo & chỉnh sửa gói tài trợ (`CREATE/UPDATE`) | [x] | [x] | [-] | [x] | [x] | [-] |
| | • Báo cáo doanh thu & giải ngân tài trợ (`FIN_REPORT`)| [x] | [x] | [-] | [x] | [-] | [-] |
| **6. Tài chính & Hội phí** | • Xem sổ thu chi, hóa đơn hội phí (`VIEW`) | [x] | [x] | [-] | [x] | [-] | [Owner] |
| | • Tạo hóa đơn & đối soát Napas VietQR (`MUTATE`) | [x] | [x] | [-] | [x] | [-] | [-] |
| | • Xuất báo cáo tài chính (`EXPORT`) | [x] | [x] | [-] | [x] | [-] | [-] |
| **7. Quản lý Cuộc họp** | • Xem lịch cuộc họp (`VIEW`) | [x] | [x] | [x] | [x] | [x] | [x] |
| | • Tạo cuộc họp Online / Offline (`CREATE`) | [x] | [x] | [-] | [-] | [-] | [-] |
| | • Chỉnh sửa & Xóa phiên họp (`UPDATE/DELETE`) | [x] | [x] | [-] | [-] | [-] | [-] |
| | • Gửi thông báo & tin nhắn địa chỉ họp (`DISPATCH`)| [x] | [x] | [-] | [-] | [-] | [-] |
| **8. Tin tức & Truyền thông**| • Xem tin tức, sự kiện hiệp hội (`VIEW`) | [x] | [x] | [x] | [x] | [x] | [x] |
| | • Viết bài, duyệt & xuất bản tin tức (`PUBLISH`) | [x] | [x] | [-] | [-] | [x] | [-] |
| **9. Biểu quyết & Bầu cử** | • Xem nội dung phiên biểu quyết (`VIEW`) | [x] | [x] | [x] | [x] | [x] | [x] |
| | • Tạo phiên biểu quyết (`CREATE`) | [x] | [x] | [-] | [-] | [-] | [-] |
| | • Tham gia bỏ phiếu biểu quyết (`VOTE`) | [x] | [x] | [x] | [x] | [x] | [x] |
| **10. Kết nối & Cuộc gặp** | • Nhắn tin B2B trên Web CRM & App (`CHAT`) | [x] | [x] | [x] | [x] | [x] | [x] |
| | • Đặt lịch hẹn bàn giao thương 1-on-1 (`SCHEDULE`)| [x] | [x] | [x] | [x] | [x] | [x] |
| | • Quản lý nhật ký hoạt động cá nhân (`LOG`) | [x] | [x] | [x] | [x] | [x] | [Owner] |

---

# PHẦN 2.3: DANH MỤC 4 BỘ TÀI LIỆU SRS ĐẶC TẢ CHI TIẾT ĐÃ XUẤT BẢN WORD (.DOCX) & MARKDOWN (.MD)

Toàn bộ hệ thống đã được biên soạn và xuất bản thành 4 tập tài liệu SRS độc lập, chuyên sâu với đầy đủ định dạng Microsoft Word (.docx) và Markdown (.md) chuẩn ISO/IEC/IEEE 29148:

1. **[Tập 1: SRS Cổng Quản Trị Trung Tâm Web CRM CEO 1983](file:///d:/download/VICONNECT/CEO_VIONE_PROJECT/vione_project/document/SRS_01_Web_CRM_CEO1983.docx)**  
   - File Word: `SRS_01_Web_CRM_CEO1983.docx` (32.2 KB) | Markdown: `SRS_01_Web_CRM_CEO1983.md` (10.9 KB)  
   - Nội dung chính: 6 vai trò người dùng, 28 chức năng cha con, 5 quy trình nghiệp vụ cốt lõi, từ điển dữ liệu PostgreSQL 10 bảng chi tiết, ma trận ERD, danh mục 30+ RESTful API, kịch bản kiểm thử UAT.
2. **[Tập 2: SRS Ứng Dụng Di Động App Hiệp Hội CEO 1983](file:///d:/download/VICONNECT/CEO_VIONE_PROJECT/vione_project/document/SRS_02_App_Hiep_Hoi_CEO1983.docx)**  
   - File Word: `SRS_02_App_Hiep_Hoi_CEO1983.docx` (21.8 KB) | Markdown: `SRS_02_App_Hiep_Hoi_CEO1983.md` (7.7 KB)  
   - Nội dung chính: Đặc tả 5 Tab màn hình chính, luồng quét mã QR độc quyền cho Ban Truyền Thông được chỉ định, luồng đặt lịch hẹn bàn 1-1 ("Cuộc gặp"), luồng nhận tin nhắn họp Offline, biểu quyết điện tử, kịch bản UAT.
3. **[Tập 3: SRS Ứng Dụng Di Động ViOne Connect (Business Connect)](file:///d:/download/VICONNECT/CEO_VIONE_PROJECT/vione_project/document/SRS_03_App_ViOne_Connect.docx)**  
   - File Word: `SRS_03_App_ViOne_Connect.docx` (19.2 KB) | Markdown: `SRS_03_App_ViOne_Connect.md` (4.3 KB)  
   - Nội dung chính: Danh thiếp 3D Gyroscope công nghệ cảm ứng NFC 1-chạm, thuật toán AI Matchmaking gợi ý đối tác theo ngành nghề, Leads Hub, lịch hẹn giao thương B2B, kịch bản UAT.
4. **[Tập 4: SRS Hệ Thống Quản Trị Doanh Nghiệp ViOne Enterprise CRM](file:///d:/download/VICONNECT/CEO_VIONE_PROJECT/vione_project/document/SRS_04_Web_CRM_ViOne.docx)**  
   - File Word: `SRS_04_Web_CRM_ViOne.docx` (19.7 KB) | Markdown: `SRS_04_Web_CRM_ViOne.md` (4.6 KB)  
   - Nội dung chính: Kiến trúc 163 bảng dữ liệu cô lập Multi-tenant theo `tenant_id`, chuỗi quản trị bán hàng B2B khép kín (Khách hàng tiềm năng -> Báo giá -> Hợp đồng -> Hóa đơn Napas VietQR tự động gạch nợ -> Doanh thu), AI Sales Copilot.

> [!TIP]
> **Đã khắc phục 100% sự cố vỡ bảng trên Microsoft Word:**  
> Hệ thống sinh tài liệu tự động đã được tái cấu trúc hoàn toàn bộ sinh mã OpenXML: chuyển đổi triệt để từ đơn vị phần trăm tương đối không tương thích sang đơn vị đo tuyệt đối chuẩn trang A4 DXA (9,200 twips), thiết lập cố định `layout: TableLayoutType.FIXED`, chỉ định `columnWidths` trên bảng và đo kích thước `size: dxa` trên từng ô (Cell). Nhờ đó, tất cả các bảng dữ liệu khi mở trên Microsoft Word 2016, 2019, 2021, Office 365 và Google Docs đều hiển thị chuẩn xác, canh lề hoàn hảo, không còn hiện tượng chữ bị co lại 1 ký tự/dòng.

---

# PHẦN 3: ĐẶC TẢ CHI TIẾT TỪNG PHÂN HỆ & CHỨC NĂNG

---

## PHÂN HỆ 1: QUẢN LÝ TÀI KHOẢN, XÁC THỰC & PHÂN QUYỀN (AUTHENTICATION & RBAC)

### 1.1 Ý nghĩa thực tế:
Giống như bảo vệ ở cổng tòa nhà: kiểm tra chứng minh thư, cấp thẻ ra vào và phân loại ai là **Hội viên thường**, ai là **Ban Quản Trị (Admin)**, ai thuộc **Ban Truyền Thông** để cho phép sử dụng các tính năng tương ứng (ví dụ: chỉ Ban Truyền Thông mới được quét mã QR soát vé sự kiện).

### 1.2 Danh mục API Backend:
* `POST /api/auth/login`: Xác thực đăng nhập bằng Email/Mã hội viên + Mật khẩu. Trả về JWT Access Token.
* `POST /api/auth/register`: Đăng ký tài khoản người dùng mới.
* `POST /api/auth/refresh`: Cấp mới token khi phiên đăng nhập sắp hết hạn.
* `GET /api/users/me`: Lấy thông tin chi tiết người dùng đang đăng nhập kèm quyền hạn.

### 1.3 Bảng CSDL Chính: `vione_users` (Ngăn tủ tài khoản người dùng)
| Tên Cột (Field) | Kiểu Dữ Liệu | Bắt Buộc? | Giải Thích Dễ Hiểu |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Có | Mã căn cước số duy nhất của tài khoản (Khóa chính PK). |
| `email` | `VARCHAR(255)` | Có | Địa chỉ email đăng nhập của người dùng (Duy nhất). |
| `password_hash`| `VARCHAR(255)` | Có | Mật khẩu đã được mã hóa bảo mật (không ai đọc trộm được). |
| `full_name` | `VARCHAR(255)` | Không | Họ và tên đầy đủ hiển thị của người dùng. |
| `phone` | `VARCHAR(20)` | Không | Số điện thoại liên hệ cá nhân. |
| `avatar_url` | `TEXT` | Không | Đường link ảnh đại diện đại biểu. |
| `role` | `VARCHAR(50)` | Có | Vai trò: `superadmin`, `admin`, `member`, `truong_ban_truyen_thong`... |
| `is_active` | `BOOLEAN` | Có | Tài khoản đang hoạt động (`true`) hay bị khóa (`false`). |
| `created_at` | `TIMESTAMPTZ` | Có | Ngày giờ tạo tài khoản. |

### 1.4 Bảng Phụ / Bảng Trung Gian: `user_roles` & `auth_sessions`
* **`user_roles`**: Bảng gán nhiều vai trò cho một người (Ví dụ: Vừa là `member`, vừa kiêm nhiệm `ban_truyen_thong`).
  * Khóa ngoại `user_id` nối sang `vione_users.id`.
  * Cột `role_code` lưu mã vai trò: `ADMIN`, `MEMBER`, `MEDIA_STAFF`, `BOARD_DIRECTOR`.
* **`auth_sessions`**: Ghi nhớ thiết bị đăng nhập (Điện thoại iPhone, máy tính bảng Android) để duy trì đăng nhập an toàn.

### 1.5 Phép Ghép Bảng (JOIN Query) khi xác thực đăng nhập:
```sql
SELECT 
    u.id, u.email, u.full_name, u.role, u.avatar_url,
    m.member_code, m.company_name, m.position_title, m.status AS membership_status
FROM vione_users u
LEFT JOIN members m ON u.id = m.user_id
WHERE u.email = 'ceo@company.com';
```
> **Giải thích bình dân:** Máy tính lấy tờ khai đăng nhập trong tủ `vione_users` khớp với email vừa nhập, sau đó dùng mã `user_id` chạy sang tủ `members` kẹp tờ lý lịch hội viên vào. Nhờ đó, ngay khi đăng nhập xong, ứng dụng biết ngay anh này tên gì, công ty nào, mã hội viên là bao nhiêu.

---

## PHÂN HỆ 2: HỒ SƠ HỘI VIÊN & QUY TRÌNH XÉT DUYỆT GIA NHẬP (MEMBER MANAGEMENT)

### 2.1 Ý nghĩa thực tế:
Dành cho CLB CEO 1983 quản lý danh bạ hội viên chính thức, và tiếp nhận hồ sơ đăng ký của các CEO bên ngoài nộp đơn xét duyệt vào CLB.

### 2.2 Danh mục API Backend:
* `GET /api/members`: Lấy toàn bộ danh bạ hội viên có lọc theo ngành nghề, chi hội, tình trạng đóng phí.
* `GET /api/members/:id`: Xem chi tiết hồ sơ năng lực 1 hội viên (tiểu sử, sản phẩm, doanh nghiệp).
* `POST /api/members/apply`: Ứng viên nộp đơn xin gia nhập CLB từ Web Landing Figma.
* `POST /api/admin/members/:id/approve`: Ban Chấp Hành duyệt đơn gia nhập, tự động cấp mã hội viên `M1983-xxx` và mật khẩu gửi về Email.

### 2.3 Bảng CSDL Chính: `members` (Ngăn tủ hồ sơ Hội viên)
| Tên Cột (Field) | Kiểu Dữ Liệu | Bắt Buộc? | Giải Thích Dễ Hiểu |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Có | Mã hồ sơ hội viên (Khóa chính PK). |
| `user_id` | `UUID` | Không | Nối sang tài khoản đăng nhập `vione_users.id`. |
| `member_code` | `VARCHAR(50)` | Có | Mã hội viên độc quyền (Ví dụ: `M1983-001`, `M1983-088`). |
| `full_name` | `VARCHAR(255)` | Có | Họ và tên của CEO. |
| `company_name` | `VARCHAR(255)` | Có | Tên công ty / Doanh nghiệp đại diện. |
| `position_title`| `VARCHAR(150)` | Không | Chức vụ (Chủ tịch HĐQT, Tổng Giám Đốc, CEO). |
| `industry` | `VARCHAR(100)` | Không | Ngành nghề kinh doanh (Bất động sản, Công nghệ, Y tế...). |
| `bio` | `TEXT` | Không | Lời giới thiệu bản thân và triết lý kinh doanh. |
| `avatar_url` | `TEXT` | Không | Ảnh chân dung đại diện sang trọng. |
| `qr_code_url` | `TEXT` | Không | Mã QR định danh hội viên dùng cho check-in & trao đổi danh bạ. |
| `nfc_card_uid` | `VARCHAR(100)` | Không | Mã chip vật lý của thẻ Titanium NFC cấp phát cho hội viên. |
| `status` | `VARCHAR(30)` | Có | Trạng thái: `active` (Chính thức), `pending` (Đang xét duyệt), `inactive` (Tạm dừng). |
| `joined_at` | `TIMESTAMPTZ` | Không | Ngày chính thức được kết nạp vào CLB. |

### 2.4 Bảng Phụ / Bảng Trung Gian: `company_members` & `memberships`
* **`company_members`**: Liên kết hội viên với thông tin doanh nghiệp chi tiết (Mã số thuế, Địa chỉ trụ sở, Giấy phép kinh doanh).
* **`memberships`**: Quản lý gói hội viên (Hội viên VIP Kim Cương, Hội viên Vàng, Hội viên Sáng Lập, Thời hạn thẻ đến ngày nào).

### 2.5 Phép Ghép Bảng (JOIN Query) khi xem danh bạ hội viên:
```sql
SELECT 
    m.id, m.member_code, m.full_name, m.company_name, m.position_title, m.avatar_url,
    card.nfc_uid, card.public_slug,
    ms.tier_name, ms.expires_at
FROM members m
LEFT JOIN member_business_cards card ON m.id = card.member_id
LEFT JOIN memberships ms ON m.id = ms.member_id
WHERE m.status = 'active'
ORDER BY m.member_code ASC;
```

---

## PHÂN HỆ 3: DANH THIẾP THÔNG MINH & THẺ VẬT LÝ NFC 1-CHẠM (SMART NFC CARD)

### 3.1 Ý nghĩa thực tế:
Hội viên cầm chiếc thẻ danh thiếp Titanium NFC dập biểu tượng số 8 của CLB CEO 1983 chạm vào lưng điện thoại của đối tác. Điện thoại đối tác lập tức mở ra trang Profile doanh nhân cực kỳ đẳng cấp mà không cần cài app, cho phép lưu danh bạ điện thoại danh bạ 1 giây (file .VCF).

### 3.2 Danh mục API Backend:
* `GET /api/business-cards/:code`: Đọc thông tin danh thiếp khi quét mã QR hoặc chạm thẻ NFC.
* `PUT /api/business-cards/my-card`: Hội viên tự chỉnh sửa thông tin danh thiếp của mình.
* `POST /api/business-cards/lead`: Đối tác để lại thông tin liên hệ (Name, Phone, Lời nhắn) sau khi xem danh thiếp.

### 3.3 Bảng CSDL Chính: `member_business_cards` (Ngăn tủ Danh Thiếp Số)
| Tên Cột (Field) | Kiểu Dữ Liệu | Bắt Buộc? | Giải Thích Dễ Hiểu |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Có | Mã thẻ danh thiếp số. |
| `member_id` | `UUID` | Có | Nối sang hồ sơ hội viên `members.id`. |
| `public_slug` | `VARCHAR(100)` | Có | Đường dẫn link rút gọn (Ví dụ: `connect.vn/c/nguyenvanan`). |
| `nfc_uid` | `VARCHAR(100)` | Không | Mã định danh phần cứng của chip NFC trên thẻ vật lý. |
| `card_theme` | `VARCHAR(50)` | Có | Giao diện thẻ: `gold-titanium`, `royal-blue`, `obsidian-black`. |
| `headline` | `VARCHAR(255)` | Không | Câu slogan giới thiệu ấn tượng. |
| `social_links` | `JSONB` | Không | Các link mạng xã hội (Zalo, Facebook, LinkedIn, Website công ty). |
| `view_count` | `INTEGER` | Có | Số lượt người khác đã chạm hoặc quét danh thiếp này. |

### 3.4 Bảng Phụ / Bảng Trung Gian: `business_card_interactions` & `business_card_leads`
* **`business_card_interactions`**: Nhật ký mỗi lần thẻ được chạm (Lưu ngày giờ, vị trí GPS nếu được cấp phép, loại thiết bị).
* **`business_card_leads`**: Danh sách khách hàng và đối tác đã bấm "Để lại liên hệ" trên danh thiếp của hội viên.

---

## PHÂN HỆ 4: KẾT NỐI GIAO THƯƠNG, HẸN GẶP B2B & LỊCH SỬ GẮN KẾT (B2B NETWORKING)

### 4.1 Ý nghĩa thực tế:
Đây là chức năng người dùng vừa phản ánh: Khi hội viên mở danh bạ, bấm nút **"Gắn kết"** với một CEO khác, nhập lời mời hẹn gặp giao thương (Ví dụ: *"Hẹn anh cà phê 9h sáng thứ Sáu trao đổi về dự án phần mềm"*). Hệ thống sẽ gửi thông báo đến đối tác, lưu vào lịch sử kết nối để 2 bên theo dõi tiến độ gắn kết.

### 4.2 Danh mục API Backend:
* `POST /api/connections/request`: Gửi lời mời kết nối kèm mục đích gặp gỡ.
* `GET /api/connections/sent`: Lấy danh sách toàn bộ các lời mời kết nối mình đã gửi đi.
* `GET /api/connections/received`: Lấy danh sách các lời mời kết nối người khác gửi đến mình.
* `PUT /api/connections/:id/respond`: Chấp nhận hoặc từ chối lời mời gắn kết.

### 4.3 Bảng CSDL Chính: `business_connections` / `consult_requests` (Ngăn tủ Lời Mời Giao Thương)
| Tên Cột (Field) | Kiểu Dữ Liệu | Bắt Buộc? | Giải Thích Dễ Hiểu |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Có | Mã yêu cầu kết nối (Khóa chính PK). |
| `sender_member_id` | `UUID` | Có | Mã hội viên người bấm gửi lời mời kết nối. |
| `target_member_id` | `UUID` | Có | Mã hội viên người được nhận lời mời kết nối. |
| `purpose` | `TEXT` | Có | **Nội dung đề xuất / Mục đích cuộc gặp** (Lưu đúng lời nhắn người dùng nhập). |
| `opportunity_id` | `UUID` | Không | Mã cơ hội giao thương liên kết (nếu có chọn). |
| `status` | `VARCHAR(30)` | Có | Trạng thái: `pending` (Chờ duyệt), `accepted` (Đã đồng ý), `rejected` (Từ chối). |
| `scheduled_at` | `TIMESTAMPTZ` | Không | Ngày giờ dự kiến diễn ra cuộc gặp 1-1. |
| `meeting_location` | `VARCHAR(255)` | Không | Địa điểm hẹn gặp (Văn phòng, Quán cà phê, Online Zoom). |
| `created_at` | `TIMESTAMPTZ` | Có | Ngày giờ gửi lời mời gắn kết. |

### 4.4 Bảng Phụ / Bảng Trung Gian: `communication_messages` (Tin nhắn trao đổi)
* Khi 2 hội viên đã chấp nhận kết nối, toàn bộ tin nhắn chat qua lại giữa 2 người được lưu trong bảng này, liên kết bằng mã `connection_id`.

### 4.5 Phép Ghép Bảng (JOIN Query) khi hiển thị Lịch Sử Kết Nối (Tab "Đã gửi kết nối"):
```sql
SELECT 
    c.id, c.purpose, c.status, c.created_at,
    target.member_code, target.full_name AS target_name,
    target.company_name AS target_company, target.position_title AS target_title,
    target.avatar_url AS target_avatar
FROM business_connections c
INNER JOIN members target ON c.target_member_id = target.id
WHERE c.sender_member_id = 'c4d1...-id-cua-nguoi-dung'
ORDER BY c.created_at DESC;
```
> **Giải thích bình dân:** Máy tính mở tủ `business_connections` lấy các phiếu kết nối do chính tôi gửi, sau đó cầm mã `target_member_id` chạy sang tủ `members` kẹp đúng tờ hồ sơ của người nhận vào để hiển thị lên màn hình: Tôi đã gửi cho anh Nguyễn Văn An (Công ty An Phát), nội dung hẹn gặp là gì, lúc mấy giờ, đang chờ anh ấy đồng ý hay đã đồng ý.

---

## PHÂN HỆ 5: SỰ KIỆN, VÉ ĐIỆN TỬ & QUÉT MÃ QR SOÁT VÉ (EVENTS & CHECK-IN)

### 5.1 Ý nghĩa thực tế:
Dành cho CLB CEO 1983 tổ chức các đại hội Gala, diễn đàn doanh nhân, tiệc giao thương B2B.
* **Hội viên thường:** Vào xem danh sách sự kiện, bấm đăng ký vé, nhận mã vé điện tử và mã QR vé cá nhân.
* **Hội viên Ban Truyền Thông:** Cầm app mở chức năng quét camera. Khi quét vào mã QR trên vé của đại biểu, app lập tức bung modal hiển thị toàn bộ thông tin vé (Tên đại biểu, Chức vụ, Công ty, Bàn VIP số mấy, Số may mắn trúng thưởng, Đã check-in chưa) và bấm nút xác nhận cho đại biểu vào cửa.

### 5.2 Danh mục API Backend:
* `GET /api/events`: Lấy danh sách sự kiện của CLB.
* `POST /api/events/:id/register`: Hội viên đăng ký vé tham dự sự kiện.
* `GET /api/events/checkin/lookup?code=REG-xxx`: Ban Truyền Thông tra cứu mã vé để xem trước thông tin vé.
* `POST /api/events/checkin/confirm`: Ban Truyền Thông xác nhận đóng dấu check-in cho vé đại biểu.

### 5.3 Bảng CSDL Chính: `events` & `event_registrations` (Tủ Sự Kiện & Tủ Cuống Vé)

#### Bảng `events` (Thông tin Sự Kiện):
| Tên Cột (Field) | Kiểu Dữ Liệu | Bắt Buộc? | Giải Thích Dễ Hiểu |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Có | Mã định danh sự kiện. |
| `title` | `VARCHAR(255)` | Có | Tên sự kiện (Ví dụ: "Đại Hội Hội Viên CEO 1983 Toàn Quốc 2026"). |
| `start_time` | `TIMESTAMPTZ` | Có | Ngày giờ bắt đầu đón khách. |
| `end_time` | `TIMESTAMPTZ` | Có | Ngày giờ kết thúc sự kiện. |
| `location_name` | `VARCHAR(255)` | Có | Tên địa điểm (Trung tâm Hội nghị Quốc Gia). |
| `address` | `TEXT` | Không | Địa chỉ chi tiết nơi diễn ra sự kiện. |
| `capacity` | `INTEGER` | Có | Sức chứa tối đa (Ví dụ: 500 khách). |
| `banner_url` | `TEXT` | Không | Ảnh banner áp phích sự kiện. |
| `is_published` | `BOOLEAN` | Có | Đã công khai cho hội viên đăng ký chưa. |

#### Bảng `event_registrations` (Cuống Vé Đại Biểu Đăng Ký):
| Tên Cột (Field) | Kiểu Dữ Liệu | Bắt Buộc? | Giải Thích Dễ Hiểu |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Có | Mã cuống vé duy nhất. |
| `event_id` | `UUID` | Có | Khóa ngoại nối sang `events.id` (Vé sự kiện nào). |
| `member_id` | `UUID` | Có | Khóa ngoại nối sang `members.id` (Vé của hội viên nào). |
| `ticket_code` | `VARCHAR(50)` | Có | Mã vé in trên QR (Ví dụ: `REG-EVT1-1983`, `TKT-8888`). |
| `ticket_type` | `VARCHAR(50)` | Có | Hạng vé: `VIP Standard Pass`, `VVIP Diamond Pass`, `General`. |
| `seat_assignment`| `VARCHAR(100)`| Không | Vị trí bàn tiệc / Ghế ngồi (Ví dụ: "Bàn VIP 08 - Ghế 02"). |
| `lucky_number` | `VARCHAR(50)` | Không | Số may mắn bốc thăm trúng thưởng (Ví dụ: `#1983`). |
| `qr_code_payload`| `TEXT` | Có | Nội dung chuỗi mã QR dùng để quét. |
| `is_checked_in` | `BOOLEAN` | Có | Đã quét vé vào cửa chưa (`true` / `false`). |
| `checked_in_at` | `TIMESTAMPTZ` | Không | Thời điểm chính xác đại biểu bước qua cửa soát vé. |
| `scanned_by_user_id`| `UUID` | Không | Mã nhân viên Ban Truyền Thông đã thực hiện quét vé này. |

### 5.4 Bảng Phụ: `member_checkins` (Nhật ký lịch sử điểm danh)
* Lưu vết chi tiết từng lượt quét: quét bằng phương thức nào (Camera QR hay Chạm thẻ NFC), IP máy quét, kết quả hợp lệ hay vé đã sử dụng trước đó.

### 5.5 Phép Ghép Bảng (JOIN Query) khi Ban Truyền Thông Quét Mã Vé:
```sql
SELECT 
    reg.ticket_code, reg.ticket_type, reg.seat_assignment, reg.lucky_number,
    reg.is_checked_in, reg.checked_in_at,
    m.full_name AS attendee_name, m.company_name AS attendee_company,
    m.position_title AS attendee_position, u.phone AS attendee_phone,
    e.title AS event_title, e.start_time AS event_date, e.location_name AS event_location,
    scanner.full_name AS scanned_by_name
FROM event_registrations reg
INNER JOIN events e ON reg.event_id = e.id
INNER JOIN members m ON reg.member_id = m.id
LEFT JOIN vione_users u ON m.user_id = u.id
LEFT JOIN vione_users scanner ON reg.scanned_by_user_id = scanner.id
WHERE reg.ticket_code = 'REG-EV1-983';
```
> **Giải thích bình dân:** Khi camera điện thoại đọc được dòng chữ `REG-EV1-983`, máy chủ lập tức lấy cuống vé đó ra, kẹp chung với thông tin Sự kiện (ở đâu, mấy giờ), kẹp chung với Lý lịch hội viên (anh này tên gì, làm tổng giám đốc công ty nào, số điện thoại mấy). Nhờ vậy, màn hình điện thoại của Ban Truyền Thông hiện lên đầy đủ cả thẻ vé lẫn chân dung đại biểu để đối soát chính xác 100%.

---

## PHÂN HỆ 6: TÀI CHÍNH, HỘI PHÍ & HÓA ĐƠN ĐIỆN TỬ (FINANCE & INVOICES)

### 6.1 Ý nghĩa thực tế:
CLB CEO 1983 và ViOne tự động phát hành thông báo đóng hội phí thường niên, tạo mã thanh toán VietQR động (chuyển khoản quét mã là tiền vào đúng tài khoản kèm cú pháp tự động gạch nợ), xuất biên lai điện tử.

### 6.2 Danh mục API Backend:
* `GET /api/fees/my-invoices`: Hội viên xem hóa đơn hội phí của mình.
* `POST /api/fees/vietqr/generate`: Tạo mã QR chuyển khoản ngân hàng có sẵn số tiền và nội dung.
* `POST /api/webhooks/bank-payment`: Ngân hàng tự động báo về khi có tiền vào tài khoản để hệ thống tự động kích hoạt gia hạn thẻ hội viên.

### 6.3 Bảng CSDL Chính: `invoices` (Ngăn tủ Sổ Hóa Đơn & Hội Phí)
| Tên Cột (Field) | Kiểu Dữ Liệu | Bắt Buộc? | Giải Thích Dễ Hiểu |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Có | Mã hóa đơn duy nhất. |
| `invoice_no` | `VARCHAR(50)` | Có | Số hóa đơn (Ví dụ: `INV-2026-00893`). |
| `member_id` | `UUID` | Có | Nối sang `members.id` (Hóa đơn gửi cho ai). |
| `amount` | `DECIMAL(15,2)`| Có | Số tiền hội phí phải nộp (Ví dụ: 10,000,000 VNĐ). |
| `fee_type` | `VARCHAR(50)` | Có | Loại phí: `ANNUAL_MEMBERSHIP` (Hội phí thường niên), `EVENT_TICKET` (Vé gala). |
| `payment_status`| `VARCHAR(30)` | Có | Tình trạng: `unpaid` (Chưa nộp), `paid` (Đã nộp), `expired` (Quá hạn). |
| `vietqr_url` | `TEXT` | Không | Link ảnh mã VietQR tự động sinh ra. |
| `paid_at` | `TIMESTAMPTZ` | Không | Ngày giờ tiền vào tài khoản ngân hàng CLB. |
| `bank_ref_code` | `VARCHAR(100)`| Không | Mã giao dịch ngân hàng khớp lệnh. |

---

## PHÂN HỆ 7: SÀN GIAO THƯƠNG SỐ & BÁO GIÁ SẢN PHẨM B2B (B2B MARKETPLACE)

### 7.1 Ý nghĩa thực tế:
Khu chợ số nội bộ của CLB CEO 1983 và ViOne. Các doanh nghiệp hội viên đăng bán các sản phẩm/dịch vụ thế mạnh của mình, cấp ưu đãi độc quyền cho hội viên cùng CLB, gửi yêu cầu báo giá và ký hợp đồng cung ứng.

### 7.2 Danh mục API Backend:
* `GET /api/marketplace/products`: Xem danh mục sản phẩm của các doanh nghiệp thành viên.
* `POST /api/marketplace/products`: Hội viên đăng tải sản phẩm mới.
* `POST /api/marketplace/quotes/request`: Gửi phiếu yêu cầu báo giá B2B cho đối tác.

### 7.3 Bảng CSDL Chính: `products` (Ngăn tủ Sản Phẩm & Dịch Vụ)
| Tên Cột (Field) | Kiểu Dữ Liệu | Bắt Buộc? | Giải Thích Dễ Hiểu |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Có | Mã sản phẩm. |
| `company_id` | `UUID` | Có | Thuộc sở hữu của công ty nào. |
| `title` | `VARCHAR(255)` | Có | Tên sản phẩm / giải pháp dịch vụ. |
| `description` | `TEXT` | Không | Mô tả tính năng và thông số kỹ thuật. |
| `price` | `DECIMAL(15,2)`| Không | Giá bán niêm yết công khai. |
| `member_discount`| `DECIMAL(5,2)` | Không | Tỷ lệ chiết khấu đặc quyền cho hội viên CEO 1983 (Ví dụ: 15%). |
| `images` | `JSONB` | Không | Bộ sưu tập hình ảnh thực tế của sản phẩm. |
| `is_verified` | `BOOLEAN` | Có | Đã được Ban Kiểm Soát CLB thẩm định chất lượng chưa. |

---

## PHÂN HỆ 8: VĂN BẢN QUY CHẾ, NGHỊ QUYẾT & BẦU CỬ BIỂU QUYẾT (DOCUMENTS & VOTING)

### 8.1 Ý nghĩa thực tế:
CLB CEO 1983 công khai các văn bản điều lệ, nghị quyết Ban Chấp Hành, và tổ chức biểu quyết điện tử minh bạch (ví dụ: Biểu quyết bầu Chủ Tịch mới, lấy ý kiến sửa đổi điều lệ CLB) ngay trên app điện thoại.

### 8.2 Danh mục API Backend:
* `GET /api/documents`: Tải văn bản, điều lệ, biểu mẫu hiệp hội.
* `GET /api/voting/sessions`: Xem các phiên bầu cử biểu quyết đang mở.
* `POST /api/voting/ballot/cast`: Hội viên bỏ phiếu biểu quyết kín trên app.

### 8.3 Bảng CSDL Chính: `voting_sessions` & `voting_ballots`
* **`voting_sessions`**: Thông tin kỳ biểu quyết (Tiêu đề, Thời gian mở/đóng hòm phiếu, Tỷ lệ biểu quyết đạt yêu cầu).
* **`voting_ballots`**: Hòm phiếu điện tử (Mã hội viên tham gia bỏ phiếu, lựa chọn Đồng ý/Không đồng ý/Bỏ phiếu trắng, Mã băm bảo mật chống sửa đổi kết quả).

---

# PHẦN 4: BẢNG TỔNG HỢP TOÀN BỘ CÁC BẢNG DỮ LIỆU & QUAN HỆ GHÉP NỐI (ERD OVERVIEW)

Để dễ hình dung toàn bộ cơ sở dữ liệu liên kết với nhau ra sao, bảng tổng hợp dưới đây liệt kê các "mối tơ duyên" giữa các ngăn tủ:

| Bảng Chính (A) | Bảng Liên Quan (B) | Cột Dùng Ghép Nối (`ON A = B`) | Ý Nghĩa Thực Tế Đời Thường |
| :--- | :--- | :--- | :--- |
| `vione_users` | `members` | `vione_users.id = members.user_id` | Một tài khoản đăng nhập gắn liền với 1 tờ lý lịch hội viên. |
| `members` | `member_business_cards` | `members.id = member_business_cards.member_id` | Mỗi hội viên sở hữu 1 danh thiếp điện tử thông minh NFC. |
| `members` | `business_connections` | `members.id = business_connections.sender_member_id` | Ai là người bấm gửi lời mời gắn kết hẹn gặp giao thương. |
| `members` | `business_connections` | `members.id = business_connections.target_member_id` | Ai là người nhận được lời mời gắn kết. |
| `events` | `event_registrations` | `events.id = event_registrations.event_id` | Sự kiện nào phát hành ra những chiếc vé này. |
| `members` | `event_registrations` | `members.id = event_registrations.member_id` | Tấm vé này thuộc quyền sở hữu của hội viên nào. |
| `event_registrations` | `vione_users` | `event_registrations.scanned_by_user_id = vione_users.id` | Ai là người trong Ban Truyền Thông đã quét tấm vé này. |
| `members` | `invoices` | `members.id = invoices.member_id` | Phiếu thu hội phí này xuất cho hội viên nào nộp tiền. |
| `company_members` | `products` | `company_members.id = products.company_id` | Doanh nghiệp hội viên nào đang bán sản phẩm này trên sàn. |

---

# PHẦN 5: KẾT LUẬN & HƯỚNG DẪN BÀN GIAO CHO VẬN HÀNH

1. **Về tính đồng bộ giao diện**:
   - Khi người dùng ở app mobile CEO 1983 bấm *"Đăng ký hội viên mới"* sẽ dẫn thẳng đến Web Landing CEO 1983 chuẩn Figma (`node-id=187-197`) với đầy đủ hiệu ứng chữ động Kinetic, thẻ VIP 3D và form đăng ký nộp hồ sơ xét duyệt.
   - Khi người dùng ở app mobile ViOne Connect bấm *"Đăng ký tài khoản mới"* sẽ dẫn thẳng đến Web Landing ViOne Connect chuẩn Figma (`node-id=187-985`) mang phong cách Trắng Titanium và Vàng Đồng Ánh Kim.
2. **Về luồng dữ liệu**:
   - Dữ liệu người dùng nộp đơn tại Landing Page sẽ tự động lưu vào bảng `members` với trạng thái `pending`.
   - Ban Thư Ký mở Web CRM duyệt hồ sơ thì trạng thái chuyển thành `active`, đồng thời hệ thống tự động sinh tài khoản `vione_users`, phát hành cuống thẻ `member_business_cards` và gửi email chúc mừng kèm mật khẩu về điện thoại đại biểu.
   - Khi tham dự sự kiện, Ban Truyền Thông quét mã QR vé tại cổng, máy chủ kiểm tra bảng `event_registrations` để hiển thị ngay thông tin vé hợp lệ và ghi nhận `is_checked_in = true`.
