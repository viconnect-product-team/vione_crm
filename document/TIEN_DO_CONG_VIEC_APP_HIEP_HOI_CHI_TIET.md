# KẾ HOẠCH TIẾN ĐỘ & DANH MỤC TÍNH NĂNG HỢP NHẤT TOÀN DIỆN
**HỆ THỐNG SỐ HÓA HIỆP HỘI CLB DOANH NHÂN CEO 1983**  
**Dự án:** VIONE Ecosystem · **Phân hệ:** Hợp Nhất 100% **App Hội Viên** & **Web CRM Quản Trị**  
**Đơn vị chủ quản:** Ban Quản Trị & Ban Thư Ký CLB Doanh Nhân CEO 1983 (Trực thuộc HanoiBA)  
**Người phụ trách phát triển:** Phạm Văn Vũ · **Thời gian cập nhật:** Tháng 09/2026  

---

## 1. TỔNG QUAN HIỆN TRẠNG & TỶ LỆ HOÀN THIỆN TOÀN HỆ THỐNG

- **Tổng số phân hệ chức năng hợp nhất:** **24 phân hệ** (13 Phân hệ App Hội Viên + 11 Phân hệ Web CRM Quản Trị)
- **Tổng số hạng mục tính năng khảo sát & triển khai:** **127 tính năng**
- **Phân bổ theo 3 trạng thái chuẩn:**
  - 📋 **Khởi tạo:** **0 / 127 tính năng** (0%)
  - ⏳ **Inprocess (Đang hoàn thiện / Chờ thiết bị ngoại vi & Sandbox):** **4 / 127 tính năng** (3%)
  - ✅ **Done (Đã hoàn thành - Sẵn sàng nghiệm thu Production):** **123 / 127 tính năng** (**97%**)
- **Độ hoàn thiện mã nguồn trung bình:** **99%**

> [!NOTE]
> **Quy chuẩn 3 cột trạng thái tiến độ:**
> 1. **Khởi tạo (Planned / Backlog):** Hạng mục nằm trong kế hoạch ban đầu hoặc đang chuẩn bị hồ sơ kiến trúc.
> 2. **Inprocess (In Progress / Pending Sandbox):** Hạng mục mã nguồn đã code hoàn chỉnh trên môi trường Dev nhưng đang chờ thiết bị vật lý hoặc kết nối Sandbox ngoại vi (NFC thẻ kim loại thực tế, WebRTC gọi video giữa 2 điện thoại di động thật, Webhook gạch nợ tài khoản ngân hàng chính thức của CLB).
> 3. **Done (Completed / Production Ready):** Tính năng đã kiểm thử tự động E2E thành công, kiểm thử giao diện & API liên thông 100%, sẵn sàng bàn giao nghiệm thu.

---

## 2. BẢNG TỔNG HỢP TIẾN ĐỘ THEO PHÂN HỆ (APP HỘI VIÊN & WEB CRM)

| Mã Phân Hệ | Tên Phân Hệ Chức Năng | Nền Tảng | Tổng Số Task | Khởi tạo | Inprocess | Done | Tỷ Lệ Hoàn Thành |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **MOD-01** | Xác Thực, Đăng Nhập & Kích Hoạt Thẻ Hội Viên | **App Hội Viên** | 5 | 0 | 0 | **5** | **100%** |
| **MOD-02** | Thẻ Hội Viên Thông Minh & Danh Thiếp Điện Tử (Digital Card) | **App Hội Viên** | 5 | 0 | 0 | **5** | **100%** |
| **MOD-03** | Công Nghệ Chạm Thẻ Thông Minh NFC & Wallets | **App Hội Viên** | 2 | 0 | 2 | **0** | **0%** |
| **MOD-04** | Gắn Kết & Tin Nhắn Doanh Nhân Phong Cách Messenger VIP | **App Hội Viên** | 7 | 0 | 1 | **6** | **86%** |
| **MOD-05** | Danh Bạ Hội Viên, Mời Gia Nhập & Quản Lý Kết Nối | **App Hội Viên** | 4 | 0 | 0 | **4** | **100%** |
| **MOD-06** | Sàn Cơ Hội Giao Thương B2B & Gian Hàng Sản Phẩm | **App Hội Viên** | 10 | 0 | 0 | **10** | **100%** |
| **MOD-07** | Sự Kiện Tràn Viền, Check-in QR & Biểu Quyết Bầu Cử | **App Hội Viên** | 10 | 0 | 0 | **10** | **100%** |
| **MOD-08** | Thu & Đóng Hội Phí Tự Động Qua VietQR Napas 247 | **App Hội Viên** | 3 | 0 | 1 | **2** | **67%** |
| **MOD-09** | Trang Cá Nhân, Bố Cục Tin Tức 50% & Hỗ Trợ Ban Thư Ký | **App Hội Viên** | 5 | 0 | 0 | **5** | **100%** |
| **MOD-10** | Tách Biệt Độc Lập Luồng Thông Báo & Landing Page Điện Ảnh | **App Hội Viên** | 2 | 0 | 0 | **2** | **100%** |
| **MOD-11** | Đăng Ký Landing 3 Cấp, Onboarding, Quyền Riêng Tư & 7 Ban Ngành | **App Hội Viên** | 8 | 0 | 0 | **8** | **100%** |
| **MOD-12** | Nâng Cấp Toàn Diện 14 Tính Năng & Tinh Chỉnh Trải Nghiệm Doanh Nhân CEO 1983 | **App Hội Viên** | 16 | 0 | 0 | **16** | **100%** |
| **MOD-13** | Nâng Cấp 7 Tính Năng: HTTPS, Sự Kiện Banner Templates, Biểu Quyết, Lucky Draw, Sàn TMĐT Luxury, Bảng Tin Cơ Hội & iOS PWA | **App Hội Viên** | 7 | 0 | 0 | **7** | **100%** |
| **CRM-01** | Quy Chuẩn Phân Quyền Vai Trò Quản Trị (RBAC Matrix) | **Web CRM** | 4 | 0 | 0 | **4** | **100%** |
| **CRM-02** | Đăng Nhập Hệ Thống CRM Quản Trị Bảo Mật Xanh-Trắng | **Web CRM** | 3 | 0 | 0 | **3** | **100%** |
| **CRM-03** | Bảng Điều Khiển Tổng Quan (Dashboard) & Theo Dõi KPI | **Web CRM** | 4 | 0 | 0 | **4** | **100%** |
| **CRM-04** | Quản Trị Hội Viên, Xét Duyệt Hồ Sơ 360° & Cấp Tài Khoản Email | **Web CRM** | 6 | 0 | 0 | **6** | **100%** |
| **CRM-05** | Quản Trị Sự Kiện, Sơ Đồ Khán Phòng Cinema Hall & Quét QR Điểm Danh | **Web CRM** | 5 | 0 | 0 | **5** | **100%** |
| **CRM-06** | Quản Trị Bầu Cử Đại Hội, Biểu Quyết Tín Nhiệm & Vòng Quay Lucky Draw | **Web CRM** | 4 | 0 | 0 | **4** | **100%** |
| **CRM-07** | Quản Trị Sàn Marketplace, Kiểm Duyệt Sản Phẩm & Đẩy Lên App | **Web CRM** | 4 | 0 | 0 | **4** | **100%** |
| **CRM-08** | Giám Sát Cơ Hội Giao Thương B2B & Báo Cáo Giá Trị Deals | **Web CRM** | 3 | 0 | 0 | **3** | **100%** |
| **CRM-09** | Quản Trị Pháp Nhân Doanh Nghiệp Thành Viên & Bản Đồ Chuỗi Cung Ứng | **Web CRM** | 3 | 0 | 0 | **3** | **100%** |
| **CRM-10** | Quản Lý Sổ Quỹ Tài Chính, Đối Soát VietQR Tự Động & Niên Liễm | **Web CRM** | 4 | 0 | 0 | **4** | **100%** |
| **CRM-11** | Nhật Ký Kiểm Toán (Audit Trail), HTTPS & Sao Lưu Dữ Liệu | **Web CRM** | 3 | 0 | 0 | **3** | **100%** |
| **TỔNG CỘNG** | **Toàn Bộ 24 Phân Hệ App & CRM** | **All Platforms** | **127** | **0** | **4** | **123** | **97%** |

---

## 3. CHI TIẾT TỪNG TÍNH NĂNG THEO PHÂN HỆ VỚI 3 CỘT TRẠNG THÁI

### MOD-01: Xác Thực, Đăng Nhập & Kích Hoạt Thẻ Hội Viên (App Hội Viên)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 1 | **AUTH-01** | Đăng nhập đa kênh (Số điện thoại / Mã hội viên / Email) | Phạm Văn Vũ | **Cao** | Màn hình Đăng nhập (/association/login) | `POST /api/auth/login, POST /api/auth/refresh` |  |  | ✅ | Đã test thành công trên cả Mobile và Desktop. Tự động nhận diện session đăng nhập. |
| 2 | **AUTH-02** | Đăng ký tài khoản hội viên mới & Form hồ sơ pháp nhân | Phạm Văn Vũ | **Cao** | Màn hình Đăng ký (/association/register) | `POST /api/auth/register, POST /api/members/apply` |  |  | ✅ | Form nhập liệu đầy đủ: Tên doanh nghiệp, MST, Lĩnh vực, Chức vụ, Nhu cầu kết nối. |
| 3 | **AUTH-03** | Popup Quên mật khẩu & Gửi OTP qua SMS | Phạm Văn Vũ | **Trung bình** | Popup Quên mật khẩu (/association/login) | `POST /api/auth/forgot-password, POST /api/auth/verify-otp` |  |  | ✅ | Luồng OTP giả lập hoạt động trơn tru. Khi triển khai live cần kích hoạt Brandname SMS. |
| 4 | **AUTH-04** | Popup Đổi mật khẩu & Quản lý phiên đăng nhập thiết bị | Phạm Văn Vũ | **Cao** | Popup Đổi mật khẩu (/association/settings) | `PUT /api/auth/password, GET /api/auth/sessions` |  |  | ✅ | Bảo mật mã hóa bcrypt, kiểm tra độ mạnh mật khẩu và hiển thị danh sách thiết bị đang login. |
| 5 | **AUTH-05** | Cài đặt PWA lên màn hình chính (iOS Add to Home / Android Install) | Phạm Văn Vũ | **Cao** | Popup / Banner Cài đặt (/install) | `Web App Manifest, Service Worker caching` |  |  | ✅ | Hỗ trợ offline caching, icon độ nét cao, tương thích chuẩn PWA của Google và Apple. |

### MOD-02: Thẻ Hội Viên Thông Minh & Danh Thiếp Điện Tử (Digital Card) (App Hội Viên)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 6 | **CARD-01** | Hiển thị Thẻ Hội Viên VIP (Dấu tích xanh, Mã M1983, Avatar, Pháp nhân) | Phạm Văn Vũ | **Cao** | Màn hình Thẻ Hội Viên (/association/card) | `GET /api/connect-app/me, GET /api/members/me` |  |  | ✅ | Thiết kế sang trọng chuẩn Doanh nhân Navy & Gold, hiển thị thời hạn hội viên và chức vụ. |
| 7 | **CARD-02** | Cấu trúc Hồ sơ Doanh nhân ngay bên dưới Thẻ hội viên | Phạm Văn Vũ | **Cao** | Màn hình Thẻ Hội Viên (/association/card) | `GET /api/connect-app/me, GET /api/members/me` |  |  | ✅ | Giao diện liền mạch, trực quan, không còn nút bấm rời rạc ngoài luồng. |
| 8 | **CARD-03** | Tích hợp Mạng xã hội & Ví điện tử (Facebook, Zalo, LinkedIn, Apple/Google Wallet) | Phạm Văn Vũ | **Cao** | Màn hình Thẻ Hội Viên (/association/card) | `GET /api/connect-app/me, PUT /api/connect-app/me/socials` |  |  | ✅ | Hỗ trợ mở link trực tiếp ứng dụng Facebook/Zalo native trên điện thoại. |
| 9 | **CARD-04** | Nâng cấp Danh thiếp số công khai chuẩn nhận diện CLB CEO 1983 | Phạm Văn Vũ | **Cao** | Trang Public Card (/card/$code) | `GET /api/business-cards/code/:code` |  |  | ✅ | Trang danh thiếp số sang trọng, hiển thị chính xác mọi trường dữ liệu của từng doanh nhân. |
| 10 | **CARD-05** | Nút "Xem danh thiếp số" trong Hồ sơ hội viên | Phạm Văn Vũ | **Cao** | Modal MemberProfileModal (/association/members, /messages) | `GET /api/members/:id` |  |  | ✅ | Chuyển đổi luồng 1 chạm mượt mà sang danh thiếp số của đối tác. |

### MOD-03: Công Nghệ Chạm Thẻ Thông Minh NFC & Wallets (App Hội Viên)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 11 | **NFC-01** | Popup Radar quét và Chạm kết nối NFC một chạm | Phạm Văn Vũ | **Cao** | Popup Chạm Thẻ NFC (/association/card, /profile) | `Web NFC API (NDEFReader / NDEFWriter)` |  | ⏳ |  | Giao diện radar quét và API đọc/ghi vCard qua Web NFC đã code hoàn thiện, test giả lập thành công; CHƯA TEST ĐƯỢC CHẠM THỰC TẾ THẺ VẬT LÝ NTAG213/215 TRÊN MÁY TÍNH (cần thiết bị smartphone Android/iOS có chip NFC và phôi thẻ vật lý). |
| 12 | **NFC-02** | Ghi URL Danh thiếp doanh nhân vào phôi thẻ NFC kim loại / gỗ | Phạm Văn Vũ | **Trung bình** | Popup Quản lý Thẻ NFC (/association/card) | `POST /api/connect-app/nfc/write-url` |  | ⏳ |  | Sẵn sàng ghi đè NDEF payload URL danh thiếp cá nhân hóa khi có phôi thẻ vật lý. |

### MOD-04: Gắn Kết & Tin Nhắn Doanh Nhân Phong Cách Messenger VIP (App Hội Viên)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 13 | **MSG-01** | Danh sách cuộc trò chuyện, hiển thị snippet tin nhắn mới nhất & tab "Chưa đọc" | Phạm Văn Vũ | **Cao** | Màn hình Hộp thư (/association/messages) | `GET /api/connect-app/dm/threads` |  |  | ✅ | Hiển thị Avatar, Tên hội viên, Snippet tin nhắn mới nhất, huy hiệu Hệ thống, nhãn Chưa đọc trực quan. |
| 14 | **MSG-02** | Giao diện Chat 1-1 phong cách Messenger (Bong bóng #0084FF, Avatar đối tác, Timestamps) | Phạm Văn Vũ | **Cao** | Màn hình Chat chi tiết (/association/messages?thread=xxx) | `GET /api/connect-app/dm/threads/:id/messages, POST /api/connect-app/dm/threads/:id/messages` |  |  | ✅ | Thiết kế giống Messenger 100%, hỗ trợ gửi văn bản, link, hình ảnh và thư mời họp B2B. |
| 15 | **MSG-03** | Thu hồi tin nhắn đã gửi (Recall Message) & Cơ chế nhảy top luồng chat | Phạm Văn Vũ | **Cao** | Màn hình Chat chi tiết & Hộp thư | `DELETE /api/connect-app/dm/member/messages/:messageId` |  |  | ✅ | Khi thu hồi, tin nhắn đổi thành viền mảnh "Bạn đã thu hồi một tin nhắn", ngoài danh sách lập tức nhảy lên đầu. |
| 16 | **MSG-04** | Thanh tương tác nhanh nằm ngang (Thả 6 emoji cảm xúc 😊 & Menu ⋯) | Phạm Văn Vũ | **Trung bình** | Bong bóng chat (/association/messages) | `POST /api/connect-app/dm/messages/:id/reaction` |  |  | ✅ | Nút icon nằm ngang cạnh bong bóng, hover hiển thị mượt mà, reaction pill đính góc bong bóng. |
| 17 | **MSG-05** | Gọi thoại & Gọi video doanh nhân WebRTC 1-1 và phòng họp nhóm | Phạm Văn Vũ | **Trung bình** | Popup Call WebRTC (/association/messages) | `WebRTC Signaling Gateway, Socket.io (webrtc:offer, webrtc:answer, webrtc:candidate)` |  | ⏳ |  | Backend signaling gateway và giao diện phòng gọi UI đã hoàn thành; CHƯA TEST ĐƯỢC END-TO-END TRÊN MẠNG THỰC TẾ (cần 2 thiết bị vật lý có camera/mic và cấu hình STUN/TURN server thực tế). |
| 18 | **MSG-06** | Tạo nhóm chat phong cách Messenger (CreateGroupChatModal: gợi ý tên, icon, carousel chip thành viên) | Phạm Văn Vũ | **Cao** | Màn hình Hộp thư & Popup Tạo nhóm (/association/messages) | `POST /api/connect-app/dm/messages, LocalStorage group sync` |  |  | ✅ | Trải nghiệm tạo nhóm mượt mà y hệt Messenger, có tab lọc "Nhóm" riêng, nút "Tạo nhóm" trên thanh hoạt động. |
| 19 | **MSG-07** | Xem thành viên nhóm (GroupMembersModal) & Tin nhắn hệ thống [system] căn giữa | Phạm Văn Vũ | **Cao** | Màn hình Chat nhóm (/association/messages?thread=group_xxx) | `GET /api/connect-app/dm/messages, Member Directory sync` |  |  | ✅ | Đã hoàn thiện và kiểm thử đạt chuẩn 100%. |

### MOD-05: Danh Bạ Hội Viên, Mời Gia Nhập & Quản Lý Kết Nối (App Hội Viên)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 20 | **DIR-01** | Danh bạ Hội viên Doanh nhân, tìm kiếm theo tên, công ty và lọc theo ngành nghề | Phạm Văn Vũ | **Cao** | Màn hình Danh bạ (/association/members) | `GET /api/members, GET /api/members/industries` |  |  | ✅ | Tìm kiếm không dấu, lọc theo 12 phân khúc ngành hàng, hiển thị mã thẻ và công ty. |
| 21 | **DIR-02** | Tính năng Mời Hội Viên Mới vào CLB CEO 1983 (Invite Modal) | Phạm Văn Vũ | **Cao** | Modal Mời Hội Viên (/association/members) | `GET /api/connect-app/referral, POST /api/connect-app/invite` |  |  | ✅ | Tăng trưởng mạng lưới hội viên tự nhiên thông qua mã giới thiệu định danh của từng chủ doanh nghiệp. |
| 22 | **DIR-03** | Popup Hồ sơ năng lực hội viên chi tiết khi bấm vào Avatar | Phạm Văn Vũ | **Cao** | Modal MemberProfileModal (/association/members, /messages) | `GET /api/members/:id, GET /api/members/:id/profile` |  |  | ✅ | Cung cấp ảnh bìa, avatar, chức vụ, MST, số điện thoại bảo mật, email và nhu cầu B2B. |
| 23 | **DIR-04** | Nút chuyển đổi trạng thái Kết nối <-> Hủy kết nối thông minh (1 Chạm) | Phạm Văn Vũ | **Cao** | Modal MemberProfileModal & Danh sách hội viên | `POST /api/connect-app/network/connect, POST /api/connect-app/network/disconnect` |  |  | ✅ | Nếu đã kết nối: Nút chuyển thành "HỦY KẾT NỐI" (viền đỏ). Nếu chưa kết nối: Nút hiển thị "KẾT NỐI NGAY" (màu xanh). |

### MOD-06: Sàn Cơ Hội Giao Thương B2B & Gian Hàng Sản Phẩm (App Hội Viên)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 24 | **B2B-01** | Sàn B2B Marketplace phong cách E-Commerce Luxury | Phạm Văn Vũ | **Cao** | Màn hình Sản phẩm (/association/products) | `GET /api/connect-app/products, GET /api/marketplace/products` |  |  | ✅ | Trưng bày hình ảnh sản phẩm, mức chiết khấu nội bộ CLB và nút liên hệ mua hàng 1 chạm. |
| 25 | **B2B-02** | Header tìm kiếm thông minh & Dropdown danh mục ngành hàng | Phạm Văn Vũ | **Cao** | Màn hình Sản phẩm (/association/products) | `GET /api/categories, Fuse.js Search Engine` |  |  | ✅ | Tìm kiếm tức thời theo tên sản phẩm, công ty, ngành nghề; bộ lọc theo giá và độ phổ biến. |
| 26 | **B2B-03** | Bố cục 3 Section phân trang độc lập (Mới đăng, Xem nhiều, Doanh nghiệp nổi bật) | Phạm Văn Vũ | **Cao** | Màn hình Sản phẩm (/association/products) | `association.products.tsx Section Controllers` |  |  | ✅ | Mỗi section phân trang độc lập, hiển thị hồ sơ pháp nhân và nút Xem gian hàng showroom. |
| 27 | **B2B-04** | Modal Đăng sản phẩm 2 phần với tải ảnh độ nét cao | Phạm Văn Vũ | **Cao** | Modal Đăng Sản Phẩm (/association/products) | `POST /api/connect-app/products, POST /api/upload/file` |  |  | ✅ | Form chia 2 khối: Khối 1 Ảnh + Tên + Danh mục; Khối 2 Giá niêm yết + Ưu đãi hội viên + Mô tả. |
| 28 | **B2B-05** | Modal Chi tiết sản phẩm & Định dạng giá tiền VND thông minh | Phạm Văn Vũ | **Cao** | Modal Chi Tiết SP (/association/products) | `GET /api/products/:id, Intl.NumberFormat` |  |  | ✅ | Hiển thị giá gốc, giá ưu đãi hội viên, nút Chat trực tiếp với chủ doanh nghiệp. |
| 29 | **B2B-06** | Menu 3 chấm chỉnh sửa và xóa bài đăng sản phẩm | Phạm Văn Vũ | **Trung bình** | Thẻ Sản phẩm (/association/products) | `PUT /api/connect-app/products/:id, DELETE /api/connect-app/products/:id` |  |  | ✅ | Chỉ hiển thị nút sửa/xóa với sản phẩm do chính hội viên đăng tải. |
| 30 | **B2B-07** | Đồng bộ & Kiểm duyệt sản phẩm trên Web CRM | Phạm Văn Vũ | **Cao** | CRM Sàn Giao Thương (/marketplace) | `GET/PUT /api/crm/marketplace/products` |  |  | ✅ | Quản trị CRM kiểm soát chất lượng hàng hóa niêm yết trong nội khối hiệp hội. |
| 31 | **B2B-08** | Bảng tin Cơ hội B2B Social Feed với bộ đếm lượt xem realtime | Phạm Văn Vũ | **Cao** | Màn hình Cơ hội B2B (/association/opportunities) | `GET /api/opportunities, POST /api/opportunities/:id/view` |  |  | ✅ | Phân loại tin theo Chào mua / Chào bán / Hợp tác đầu tư, kèm giá trị hợp đồng dự kiến. |
| 32 | **B2B-09** | Modal Đăng tin Cơ hội giao thương & Đính kèm hồ sơ năng lực | Phạm Văn Vũ | **Cao** | Modal Tạo Cơ Hội (/association/opportunities) | `POST /api/connect-app/opportunities, POST /api/upload/file` |  |  | ✅ | Đính kèm tài liệu PDF hồ sơ năng lực, ảnh chụp dự án và thông tin liên hệ trực tiếp. |
| 33 | **B2B-10** | Modal Danh sách thành viên Quan tâm cơ hội kèm nút Gọi/Email/Chat | Phạm Văn Vũ | **Cao** | Modal Đối tác quan tâm (/association/opportunities) | `GET /api/opportunities/:id/interests` |  |  | ✅ | Thúc đẩy xúc tiến thương mại B2B thực chất giữa các chủ doanh nghiệp trong CLB. |

### MOD-07: Sự Kiện Tràn Viền, Check-in QR & Biểu Quyết Bầu Cử (App Hội Viên)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 34 | **EVT-01** | CRM Modal Tạo sự kiện với mẫu Template theo loại hình (Forum, Workshop, Networking, Training) | Phạm Văn Vũ | **Cao** | Tạo Sự Kiện CRM (/events/new, EventWizard) | `apps/vione_app_fe/src/lib/event-type-templates.ts, EventWizard.tsx` |  |  | ✅ | Chuẩn hóa quy trình tạo sự kiện chuyên nghiệp cho Ban Sự Kiện CLB. |
| 35 | **EVT-02** | CRM Cấu hình Giá vé: Case 1 Miễn phí (0đ) & Case 2 Thu phí (500.000 VNĐ) | Phạm Văn Vũ | **Cao** | Modal Tạo Sự Kiện CRM (/events) | `POST /api/events, event.ticketPrice configuration` |  |  | ✅ | Đồng bộ cấu hình giá vé tức thời sang Mobile App. |
| 36 | **EVT-03** | CRM Sơ đồ Khán phòng Cinema Hall Seating Map kéo thả ghế ngồi | Phạm Văn Vũ | **Cao** | Sơ đồ Khán phòng CRM (/events/seating) | `CinemaSeatingMap.tsx, Pointer drag coordinates` |  |  | ✅ | Hỗ trợ kéo thả tự do, thêm bớt hàng ghế và căn đều vị trí sân khấu. |
| 37 | **EVT-04** | CRM Quản lý Danh sách Đại biểu & Máy quét mã QR Điểm danh tốc độ cao | Phạm Văn Vũ | **Cao** | Điểm danh CRM (/events/checkin, /events/:id/attendees) | `POST /api/events/:id/checkin, HTML5 QR Scanner` |  |  | ✅ | Ngăn chặn vé giả, chống quét trùng lặp và thống kê lượng khách thời gian thực. |
| 38 | **EVT-05** | App Màn hình Danh sách Sự kiện tràn viền hiển thị thẻ Miễn phí 0đ và Có phí | Phạm Văn Vũ | **Cao** | Màn hình Sự kiện (/association/events) | `GET /api/events, association.events.tsx` |  |  | ✅ | Phân loại rõ ràng nhãn Miễn phí 0đ và nhãn 500.000 đ / vé. |
| 39 | **EVT-06** | App Modal Chi tiết Sự kiện Miễn phí & Nhận vé Pass tức thì kèm Lucky #XXXX | Phạm Văn Vũ | **Cao** | Modal Đăng ký Sự Kiện (/association/events) | `POST /api/events/:id/register, lucky_number generator` |  |  | ✅ | Tự động gửi vé chi tiết vào mục Thông Báo và Tin Nhắn của hội viên. |
| 40 | **EVT-07** | App Modal Chi tiết Sự kiện Thu phí & Cổng thanh toán VietQR Napas 247 | Phạm Văn Vũ | **Cao** | Modal Thanh Toán Sự Kiện (/association/events) | `POST /api/events/:id/register, VietQR Generator` |  |  | ✅ | Mã VietQR chứa sẵn số tiền và cú pháp chuyển khoản tự động, quét thanh toán trong 3 giây. |
| 41 | **EVT-08** | App Màn hình Quản lý Thẻ vé Check-in của tôi với mã QR động | Phạm Văn Vũ | **Cao** | Màn hình Check-in (/association/checkin) | `GET /api/members/me/tickets, QRCode Canvas` |  |  | ✅ | Hiển thị số ghế, tên sự kiện, ngày giờ và số may mắn bốc thăm. |
| 42 | **EVT-09** | App & CRM Hệ thống Biểu quyết Trực tiếp (Live Voting) thời gian thực | Phạm Văn Vũ | **Cao** | CRM (/voting) & App (/association/voting, /notifications) | `POST /api/voting/sessions, Socket.io voting:started` |  |  | ✅ | Bỏ phiếu bí mật, mã hóa kết quả, trực quan hóa tỷ lệ tán thành. |
| 43 | **EVT-10** | App & CRM Vòng quay May mắn (Lucky Draw) & Thẻ thông báo chúc mừng mạ vàng VIP | Phạm Văn Vũ | **Cao** | CRM (/voting) & App (/association/notifications) | `POST /api/voting/lucky-draw/notify, event_registrations.lucky_number` |  |  | ✅ | Tạo không khí hào hứng, sôi nổi tại các đêm Gala đại hội. |

### MOD-08: Thu & Đóng Hội Phí Tự Động Qua VietQR Napas 247 (App Hội Viên)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 44 | **FEE-01** | Thông báo nhắc nợ hội phí niên khóa & Hóa đơn điện tử trong tin nhắn | Phạm Văn Vũ | **Cao** | Tin nhắn hệ thống Ban Thư Ký (/association/messages) | `GET /api/members/me/fee` |  |  | ✅ | Thông báo định kỳ kèm số tiền và nút mở thanh toán trực tiếp. |
| 45 | **FEE-02** | Sinh mã VietQR Napas 247 chuẩn quốc gia (Số tiền + Cú pháp tự động) | Phạm Văn Vũ | **Cao** | Popup Thanh toán Hội phí VietQR (/association/card, /profile) | `POST /api/members/me/fee/vietqr` |  |  | ✅ | Sinh mã QR chuẩn Vietcombank/MBBank, quét bằng mọi app ngân hàng không cần gõ tay. |
| 46 | **FEE-03** | Webhook gạch nợ tự động & Xuất hóa đơn VAT điện tử | Phạm Văn Vũ | **Cao** | Lịch sử thanh toán & Trạng thái hội viên | `POST /api/webhooks/vietqr/payment, GET /api/members/me/invoices` |  | ⏳ |  | Logic webhook gạch nợ tự động và gia hạn thẻ đã code xong; CHƯA TEST ĐƯỢC LUỒNG THANH TOÁN TIỀN THẬT qua cổng ngân hàng (cần môi trường sandbox ngân hàng Vietcombank/MBBank hoặc tài khoản thanh toán live có webhook). |

### MOD-09: Trang Cá Nhân, Bố Cục Tin Tức 50% & Hỗ Trợ Ban Thư Ký (App Hội Viên)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 47 | **PRF-01** | Quản lý thông tin cá nhân, cập nhật avatar, ảnh bìa & quyền riêng tư | Phạm Văn Vũ | **Cao** | Màn hình Trang cá nhân (/association/profile) | `GET /api/connect-app/me, PUT /api/connect-app/me, POST /api/upload/file` |  |  | ✅ | Đã bổ sung popup chỉnh sửa trực tiếp, hỗ trợ upload ảnh bìa và avatar lên MinIO. |
| 48 | **NEWS-01** | Thiết kế Bố cục Tin tức Tỷ lệ 50% Ảnh & 50% Nội dung | Phạm Văn Vũ | **Cao** | Màn hình Tin tức Hiệp Hội (/association/news) | `GET /api/content/news` |  |  | ✅ | Giao diện phong cách tạp chí doanh nhân hiện đại, tương thích hoàn hảo trên di động. |
| 49 | **PRF-02** | Tính năng Hướng dẫn sử dụng App Doanh nhân (Có ảnh demo & tải Word/PDF) | Phạm Văn Vũ | **Cao** | Modal UserGuideModal (/association/profile) | `Tích hợp trực tiếp trên Frontend, liên kết tải file DOCX và PDF` |  |  | ✅ | Gồm 6 tab chi tiết, ảnh minh họa quy trình, ghi chú Pro-Tip và nút tải Word/PDF trực tiếp. |
| 50 | **PRF-03** | Tính năng Liên hệ Ban Thư Ký CLB CEO 1983 (Hotline, Zalo OA & Gửi Form) | Phạm Văn Vũ | **Trung bình** | Modal ContactSupportModal (/association/profile) | `POST /api/connect-app/support/inquiry` |  |  | ✅ | Cung cấp Hotline 24/7, Tổng đài 1900.6883, Zalo OA và form tiếp nhận phản hồi tức thì. |
| 51 | **PRF-04** | Bộ chuyển đổi Chế độ giao diện (Sáng / Tối / Tương phản) & 8 Ngôn ngữ | Phạm Văn Vũ | **Cao** | Trang cá nhân & Cài đặt (/association/profile, /settings) | `Theme Context & i18n Engine (8 Ngôn ngữ: VI, EN, JA, KO, ZH, FR, DE, ES)` |  |  | ✅ | Chuyển đổi giao diện và ngôn ngữ mượt mà không cần tải lại trang. |

### MOD-10: Tách Biệt Độc Lập Luồng Thông Báo & Landing Page Điện Ảnh (App Hội Viên)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 52 | **NOTIF-01** | Tách biệt độc lập 100% luồng Thông báo giữa ViOne và Hiệp hội CEO 1983 | Phạm Văn Vũ | **Cao** | Màn hình Thông báo (/association/notifications & /notifications) | `GET /api/connect-app/notifications, GET /api/connect-app/member/notifications` |  |  | ✅ | Đảm bảo 2 ứng dụng hoạt động độc lập tuyệt đối, không trùng lặp hay rò rỉ dữ liệu thông báo nội bộ. |
| 53 | **LAND-01** | Landing Page Điện Ảnh Siêu Thực 6 Cảnh Cuộn Mượt Mà (Cinematic Scroll Journey) | Phạm Văn Vũ | **Cao** | Trang chủ Landing (/landing/ceo1983/cinematic & /landing?theme=ceo1983-cinematic) | `TanStack Router, CSS Parallax, Organic SVG Mask & Caustics Shaders` |  |  | ✅ | Tạo hiệu ứng thị giác đỉnh cao, tôn vinh đẳng cấp và tầm nhìn chiến lược của CLB Doanh Nhân CEO 1983. |

### MOD-11: Đăng Ký Landing 3 Cấp, Onboarding, Quyền Riêng Tư & 7 Ban Ngành (App Hội Viên)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 54 | **LAND-02** | Popup Đăng ký hội viên mới không bị đóng & Tra cứu 3 trạng thái (Chờ duyệt / Đã duyệt / Cần bổ sung) | Phạm Văn Vũ | **Cao** | Modal Đăng ký (/landing/ceo/v1) | `GET/POST /api/connect-app/club-registration/status` |  |  | ✅ | Ứng viên luôn chủ động theo dõi được tiến độ xét duyệt hồ sơ từ CRM. |
| 55 | **ONB-01** | Onboarding tạo tài khoản hội viên mới & Tự động đăng nhập vào App Hiệp hội sau khi CRM duyệt | Phạm Văn Vũ | **Cao** | Modal Kích hoạt tài khoản (/landing/ceo/v1) | `POST /api/auth/register, POST /api/auth/login` |  |  | ✅ | Trải nghiệm mượt mà không cần gửi OTP hoặc chờ email thủ công. |
| 56 | **PRIV-01** | Quét mã QR & Chạm thẻ NFC hiển thị Avatar và các trường theo Cài đặt riêng tư đối tác | Phạm Văn Vũ | **Cao** | Modal Quét QR/NFC (AssociationQrScanModal) | `GET /api/business-cards/code/:code` |  |  | ✅ | Tuân thủ đúng quyền riêng tư card_settings khi kết nối. |
| 57 | **CONN-01** | Popup Nhận yêu cầu kết nối tức thời (Realtime Incoming Connection) hiển thị theo quyền riêng tư | Phạm Văn Vũ | **Cao** | Modal Toàn cục IncomingConnectionModal (/association/*) | `Socket.io connection:requested, POST /api/connect-app/connections/:id/accept` |  |  | ✅ | Gắn toàn cục tại MemberShell.tsx hoạt động trên toàn bộ phân hệ /association. |
| 58 | **SUPP-01** | Danh mục Liên hệ & Hỗ trợ đầy đủ 7 Ban Ngành Chuyên Trách CLB Doanh Nhân CEO 1983 | Phạm Văn Vũ | **Cao** | Modal Liên hệ (ContactSupportModal) | `POST /api/connect-app/support/inquiry` |  |  | ✅ | Cung cấp danh bạ chính thức 7 ban ngành hỗ trợ hội viên. |
| 59 | **GUIDE-01** | Sổ tay Hướng dẫn sử dụng chuẩn hóa: Gỡ bỏ lọc tin nhắn, thêm Quyền riêng tư, Kết nối tức thời & 7 Ban ngành | Phạm Văn Vũ | **Trung bình** | Modal HDSD (UserGuideModal) | `Frontend Component UserGuideModal (16 mục hướng dẫn)` |  |  | ✅ | Tài liệu hướng dẫn trực quan, chuẩn xác 100% với luồng ứng dụng thực tế. |
| 60 | **QR-01** | Quét mã QR Hội viên phần cứng Native (Google Code Scanner Integration) | Phạm Văn Vũ | **Cao** | Modal Quét QR Hội Viên (AssociationMemberQrModal) | `com.google.android.gms:play-services-code-scanner, AndroidNative.scanQr()` |  |  | ✅ | Camera mở tức thì, tự động lấy nét và nhận diện mã QR với tốc độ phần cứng cao cấp. |
| 61 | **QR-02** | Căn giữa tuyệt đối Modal Quét QR & Mã QR Thẻ trên màn hình điện thoại (CSS Grid Safe-Area) | Phạm Văn Vũ | **Cao** | Modal AssociationQrScanModal & AssociationMemberQrModal | `CSS Grid place-items-center, 100dvh & env(safe-area-inset)` |  |  | ✅ | Đã kiểm tra căn giữa tuyệt đối 100% trên các kích thước màn hình điện thoại. |

### MOD-12: Nâng Cấp Toàn Diện 14 Tính Năng & Tinh Chỉnh Trải Nghiệm Doanh Nhân CEO 1983 (App Hội Viên)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 62 | **AUTO-01** | Landing Page Polling 4s tự động nhận diện phê duyệt & Điều hướng đăng nhập | Phạm Văn Vũ | **Cao** | Modal Trạng thái & Kích hoạt (/landing/ceo1983/cinematic) | `GET /connect-app/club-registration/status, Polling Interval 4000ms` |  |  | ✅ | Không cần người dùng thao tác F5 hay bấm kiểm tra lại, trải nghiệm tự động hoàn toàn. |
| 63 | **AUTH-06** | Bắt buộc đăng nhập sau khi duyệt hồ sơ (Prefill username, Không bypass login) | Phạm Văn Vũ | **Cao** | Màn hình Đăng nhập (/association/login) | `POST /auth/login` |  |  | ✅ | Bảo vệ an toàn danh tính, đảm bảo phiên đăng nhập được xác thực chính chủ. |
| 64 | **PROF-05** | Đồng bộ dữ liệu Profile thời gian thực giữa Home & Profile (Loại bỏ "Lê Hoàng Long") | Phạm Văn Vũ | **Cao** | Trang chủ (/association) & Trang cá nhân (/association/profile) | `GET /connect-app/me, LocalStorage vba.profile` |  |  | ✅ | Đồng bộ 100% dữ liệu hội viên thực tế trên mọi màn hình. |
| 65 | **QR-03** | Khung ngắm Camera in-modal & Gỡ bỏ hook native text scanner trên Trang chủ | Phạm Văn Vũ | **Cao** | AssociationMemberQrModal.tsx & MainActivity.java | `HTML5 MediaDevices, NativeBridge cleanup` |  |  | ✅ | Khung ngắm camera gọn gàng, không giật lag, không cướp quyền hiển thị. |
| 66 | **CONN-02** | Handshake kết nối 2 chiều: Tự đóng QR modal người quét & Bật IncomingConnectionModal đối tác | Phạm Văn Vũ | **Cao** | AssociationMemberQrModal & IncomingConnectionModal | `Socket.io connection:requested` |  |  | ✅ | Trải nghiệm kết nối 2 chiều tức thì, tự động đóng cửa sổ quét. |
| 67 | **OPP-02** | Sàn Cơ hội B2B hiển thị ảnh tải lên, tab "Cơ hội của tôi", sort mới nhất & Ngày đăng | Phạm Văn Vũ | **Cao** | Màn hình Cơ hội B2B (/association/opportunities) | `GET/POST /opportunities, connect-app.service.ts` |  |  | ✅ | Sàn giao thương B2B chuyên nghiệp, cá nhân hóa quản lý tin đăng. |
| 68 | **PROD-02** | Gian hàng sản phẩm 2 cột chuẩn e-commerce, cách ly bookmark theo User & Tab tôi đăng | Phạm Văn Vũ | **Cao** | Màn hình Sản phẩm (/association/products) | `GET /marketplace/products, LocalStorage vba_interested_products_${userId}` |  |  | ✅ | Giao diện thương mại điện tử 2 cột hiện đại, bảo mật bookmark cá nhân. |
| 69 | **EVT-04** | Thẻ sự kiện Poster 2:3 có nhãn độ tuổi (16+, 18+, 13+) & Backdrop sân khấu /events | Phạm Văn Vũ | **Cao** | Trang chủ (/association) & Màn hình Sự kiện (/association/events) | `Frontend Component & CSS Styling` |  |  | ✅ | Chuẩn hóa thiết kế theo phong cách poster giải trí cao cấp Image 1. |
| 70 | **HOME-02** | Cấu trúc thứ tự khối Trang chủ chuẩn: Sự kiện -> Cơ hội -> Sản phẩm | Phạm Văn Vũ | **Cao** | Trang chủ (/association) | `association.index.tsx layout` |  |  | ✅ | Luồng thị giác và ưu tiên thông tin chuẩn logic kinh doanh CLB. |
| 71 | **NOTIF-02** | Cách ly thông báo theo User, lọc bỏ dữ liệu sự kiện rác cũ & Lời chào mừng chính thức | Phạm Văn Vũ | **Cao** | Hộp thông báo (/association/messages) | `connect-app.service.ts getNotifications` |  |  | ✅ | Hộp thư thông báo sạch sẽ, cá nhân hóa 100% cho từng hội viên. |
| 72 | **MSG-08** | Khử trùng lặp tin nhắn (Deduplication), Socket realtime & Xóa badge unread khi mở thread | Phạm Văn Vũ | **Cao** | Màn hình Chat (/association/messages) | `Socket.io member:message_received, mergedMessages deduplication` |  |  | ✅ | Trải nghiệm nhắn tin mượt mà, không lag, không trùng lặp. |
| 73 | **MSG-09** | Thanh nhập tin nhắn Mobile với nút (+) mở rộng & Popup Cuộc gọi tương tác | Phạm Văn Vũ | **Cao** | Màn hình Chat (/association/messages) | `Mobile Chat Input Expander & Call Modal interactive controls` |  |  | ✅ | Tối ưu hóa layout di động và hoàn thiện UX cuộc gọi. |
| 74 | **PROF-06** | Đồng bộ Menu cá nhân chuẩn Image 3 & Phím tắt (+) tạo nhanh Danh thiếp số | Phạm Văn Vũ | **Cao** | Trang cá nhân (/association/profile) & /association/business-cards | `Navigation & query params action=create` |  |  | ✅ | Tiện ích 1 chạm tạo nhanh danh thiếp số cho doanh nhân. |
| 75 | **NEWS-02** | Tab kép Tin tức CLB & Sự kiện Hiệp Hội trong /association/news | Phạm Văn Vũ | **Cao** | Màn hình Tin tức (/association/news) | `GET /api/content/news, listMyEvents` |  |  | ✅ | Trải nghiệm đọc tin và theo dõi sự kiện đa năng trong một màn hình. |
| 76 | **SEC-02** | Đổi mật khẩu (/users/change-password), khóa nút Đăng xuất & Vô hiệu hóa tài khoản | Phạm Văn Vũ | **Cao** | Màn hình Cài đặt Bảo mật (/association/settings) | `POST /users/change-password, POST /users/deactivate` |  |  | ✅ | Quy chuẩn bảo mật nghiêm ngặt, tuân thủ an toàn thông tin. |
| 77 | **CRM-01** | Phân quyền Sidebar CRM theo vai trò, ẩn "Quyền của tôi" & Sơ đồ rạp chiếu kéo thả ghế sân khấu | Phạm Văn Vũ | **Cao** | Sidebar CRM & CinemaSeatingMap (/events/seating) | `Sidebar role-based permission matrix, Pointer drag coordinates` |  |  | ✅ | Quản trị CRM phân quyền chặt chẽ và tùy biến sơ đồ khán phòng linh hoạt. |

### MOD-13: Nâng Cấp 7 Tính Năng: HTTPS, Sự Kiện Banner Templates, Biểu Quyết, Lucky Draw, Sàn TMĐT Luxury, Bảng Tin Cơ Hội & iOS PWA (App Hội Viên)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 78 | **REQ-01** | Cấu hình HTTPS SSL & Kịch bản Fast Deploy cho Web CRM và App Hiệp Hội | Phạm Văn Vũ | **Cao** | Server Dev (14.225.217.232) | `deploy/ssl/nginx.conf, deploy-ssl.ps1, fast-deploy.ps1 -EnableHttps` |  |  | ✅ | Hỗ trợ cả HTTP và HTTPS qua SSL Nginx Reverse Proxy, sẵn sàng đẩy lên server dev. |
| 79 | **REQ-02** | Thiết kế Banner và Bố cục Text riêng cho từng loại Sự kiện (Forum, Workshop, Networking, Training) | Phạm Văn Vũ | **Cao** | Tạo Sự Kiện CRM (/events/new, EventWizard) | `apps/vione_app_fe/src/lib/event-type-templates.ts, EventWizard.tsx` |  |  | ✅ | Banner bố cục text tương ứng chuẩn từng thể loại sự kiện, xem trước tức thời khi tạo. |
| 80 | **REQ-03** | Thông báo Biểu Quyết Sự Kiện đẩy thời gian thực về App Hiệp Hội | Phạm Văn Vũ | **Cao** | Tạo Biểu Quyết CRM (/voting) & Màn hình Thông báo App (/association/notifications) | `POST /api/voting/sessions, connect-app.service.ts, association.notifications.tsx` |  |  | ✅ | Hội viên nhận thông báo ngay trên App Hiệp hội và click bình chọn thời gian thực. |
| 81 | **REQ-04** | Quay Thưởng May Mắn (Lucky Draw) từ CRM, Số Vé May Mắn Random & Thông Báo Chúc Mừng | Phạm Văn Vũ | **Cao** | Quay số trúng thưởng (/voting) & Thông báo App (/association/notifications) | `public.event_registrations.lucky_number, POST /api/voting/lucky-draw/notify` |  |  | ✅ | Đã backfill số may mắn cho toàn bộ đăng ký cũ. Thông báo trúng thưởng thẻ vàng sang trọng. |
| 82 | **REQ-05** | Sàn Giao Thương Thương Mại Điện Tử Luxury E-Commerce với 3 Section Phân Trang | Phạm Văn Vũ | **Cao** | Màn hình Sản phẩm (/association/products) | `GET /api/products, GET /api/marketplace/products, association.products.tsx` |  |  | ✅ | Phân trang độc lập từng section, hiển thị giá ưu đãi hội viên và nút xem gian hàng doanh nghiệp. |
| 83 | **REQ-06** | Bảng Tin Trao Cơ Hội Giao Thương: Phân Trang, Đếm Lượt Xem & Danh Sách Người Quan Tâm Cho Chủ Bài | Phạm Văn Vũ | **Cao** | Màn hình Trao Cơ Hội (/association/opportunities) | `GET /api/opportunities, POST /api/opportunities/:id/view, GET /api/opportunities/:id/interests` |  |  | ✅ | Chủ bài đăng nắm bắt danh sách đối tác quan tâm và kết nối xúc tiến thương mại tức thì. |
| 84 | **REQ-07** | Cấu Hình PWA Hoàn Chỉnh Cho App Hiệp Hội (Tương Thích Mọi Thiết Bị iOS & Android) | Phạm Văn Vũ | **Cao** | App Hiệp Hội (/association) | `public/manifest.webmanifest, public/sw.js, register-sw.ts, IosInstallPrompt.tsx` |  |  | ✅ | Người dùng iOS trải nghiệm ứng dụng toàn màn hình mượt mà như app tải từ App Store. |

### CRM-01: Quy Chuẩn Phân Quyền Vai Trò Quản Trị (RBAC Matrix) (Web CRM)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 85 | **RBAC-01** | Ma trận 5 cấp bậc vai trò quản trị (Super Admin, Platform Admin, Executive Admin, Event Manager, Finance Manager) | Phạm Văn Vũ | **Cao** | Giao diện Phân quyền & Sidebar CRM | `GET /api/users/roles, PUT /api/users/:id/role` |  |  | ✅ | Đã hoàn thiện ma trận phân quyền 5 cấp bậc theo đúng quy chuẩn an ninh thông tin. |
| 86 | **RBAC-02** | Cấu hình Sidebar CRM theo vai trò: Ẩn "Quyền của tôi", chỉ hiển thị các module được cấp phép | Phạm Văn Vũ | **Cao** | Sidebar CRM (/dashboard, /members, /events, /marketplace, /opportunities) | `Sidebar role-based permission filter` |  |  | ✅ | Ẩn các menu không thuộc thẩm quyền, ngăn chặn truy cập trái phép. |
| 87 | **RBAC-03** | Kiểm soát quyền thực thi API qua JwtAuthGuard & RoleGuard trên NestJS | Phạm Văn Vũ | **Cao** | Toàn bộ endpoint CRM Backend | `@Roles() Decorator, RolesGuard, JwtAuthGuard` |  |  | ✅ | Xác thực chặt chẽ token và quyền hạn trước khi cho phép thực thi API. |
| 88 | **RBAC-04** | Phân quyền nhanh và khóa/mở khóa tài khoản trực tiếp trong Drawer chi tiết hội viên | Phạm Văn Vũ | **Cao** | Drawer Hội Viên CRM (/members) | `PATCH /api/members/:id/status, PUT /api/users/:id/role` |  |  | ✅ | Quản trị viên có thể đổi vai trò và khóa/mở tài khoản tức thì. |

### CRM-02: Đăng Nhập Hệ Thống CRM Quản Trị Bảo Mật Xanh-Trắng (Web CRM)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 89 | **AUTH-CRM-01** | Giao diện đăng nhập chuẩn doanh nghiệp Xanh-Trắng, loại bỏ triệt để logo và text ViOne | Phạm Văn Vũ | **Cao** | Màn hình Đăng nhập CRM (/auth) | `POST /api/auth/login` |  |  | ✅ | Giao diện thương hiệu Xanh-Trắng sang trọng kèm huy hiệu bảo mật ShieldCheck. |
| 90 | **AUTH-CRM-02** | Cơ chế xác thực JWT Admin, kiểm tra tài khoản hoạt động và cấp session bảo mật | Phạm Văn Vũ | **Cao** | Màn hình Đăng nhập CRM (/auth) | `POST /api/auth/login, POST /api/auth/refresh` |  |  | ✅ | Hỗ trợ lưu token bảo mật trong cookie httpOnly và localStorage. |
| 91 | **AUTH-CRM-03** | Bảo mật phiên làm việc: Tự động hết hạn phiên và đăng xuất khi đổi mật khẩu từ xa | Phạm Văn Vũ | **Trung bình** | Cổng CRM Toàn Cục | `POST /api/auth/logout, Middleware session check` |  |  | ✅ | Tự động hủy session khi phát hiện đăng nhập trái phép hoặc token hết hạn. |

### CRM-03: Bảng Điều Khiển Tổng Quan (Dashboard) & Theo Dõi KPI (Web CRM)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 92 | **DASH-01** | 4 Khối chỉ số KPI trọng điểm: Tổng hội viên, Niên liễm đã thu, Sự kiện đã tổ chức, Deals giao thương | Phạm Văn Vũ | **Cao** | Bảng điều khiển (/dashboard) | `GET /api/crm/dashboard/kpi-summary` |  |  | ✅ | Cập nhật realtime các chỉ số tăng trưởng trọng yếu của CLB CEO 1983. |
| 93 | **DASH-02** | Biểu đồ tăng trưởng hội viên theo tháng và phân bổ theo 7 Ban Ngành Chuyên Trách | Phạm Văn Vũ | **Cao** | Bảng điều khiển (/dashboard) | `GET /api/crm/dashboard/member-growth-chart` |  |  | ✅ | Biểu đồ trực quan hóa cơ cấu ngành nghề và xu hướng gia nhập của hội viên. |
| 94 | **DASH-03** | Bảng xếp hạng doanh nghiệp tiêu biểu và top kết nối giao thương B2B thành công | Phạm Văn Vũ | **Trung bình** | Bảng điều khiển (/dashboard) | `GET /api/crm/dashboard/top-businesses` |  |  | ✅ | Tôn vinh các doanh nghiệp tích cực trao đổi cơ hội và tham gia sự kiện. |
| 95 | **DASH-04** | Khối cảnh báo nhanh: Hồ sơ hội viên chờ duyệt, vé sự kiện sắp khai mạc và phản hồi cần xử lý | Phạm Văn Vũ | **Cao** | Bảng điều khiển (/dashboard) | `GET /api/crm/dashboard/action-alerts` |  |  | ✅ | Giúp ban thư ký không bỏ sót hồ sơ đăng ký hoặc sự kiện quan trọng. |

### CRM-04: Quản Trị Hội Viên, Xét Duyệt Hồ Sơ 360° & Cấp Tài Khoản Email (Web CRM)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 96 | **MEM-CRM-01** | Bảng dữ liệu hội viên đa năng: Data Table phân trang, sắp xếp, tìm kiếm họ tên/công ty/MST | Phạm Văn Vũ | **Cao** | Quản trị Hội Viên (/members) | `GET /api/members, GET /api/members/search` |  |  | ✅ | Hỗ trợ tìm kiếm siêu tốc, lọc theo nhiều tiêu chí kết hợp. |
| 97 | **MEM-CRM-02** | Bộ lọc thông minh theo 7 Ban Ngành Chuyên Trách và Trạng thái nộp hội phí | Phạm Văn Vũ | **Cao** | Quản trị Hội Viên (/members) | `GET /api/members?department=...&feeStatus=...` |  |  | ✅ | Dễ dàng phân loại hội viên theo từng ban chuyên môn và tình trạng đóng phí. |
| 98 | **MEM-CRM-03** | Drawer thẩm định hồ sơ 360°: Hiển thị đầy đủ thông tin cá nhân, pháp nhân, MST, CCCD, ảnh đại diện | Phạm Văn Vũ | **Cao** | Drawer Chi Tiết Hội Viên (/members) | `GET /api/members/:id/detail-360` |  |  | ✅ | Xem toàn diện lý lịch doanh nhân, năng lực doanh nghiệp và minh chứng đính kèm. |
| 99 | **MEM-CRM-04** | Thao tác Phê duyệt (Approve) tự động cấp mã hội viên M1983-xxx và sinh tài khoản đăng nhập vione_users | Phạm Văn Vũ | **Cao** | Drawer Chi Tiết Hội Viên (/members) | `POST /api/members/:id/approve` |  |  | ✅ | Tự động tạo account trên bảng vione_users và liên kết member_id chính xác. |
| 100 | **MEM-CRM-05** | Tự động gửi Email thông báo kích hoạt kèm tài khoản đăng nhập và hướng dẫn các bước tiếp theo | Phạm Văn Vũ | **Cao** | Hệ thống gửi Mail tự động | `POST /api/notifications/send-welcome-email` |  |  | ✅ | Đã kiểm thử email gửi tự động với 2 hình ảnh minh chứng thực tế (Hình 2.4 và 2.5). |
| 101 | **MEM-CRM-06** | Thao tác Từ chối (Reject) kèm lý do chi tiết & Xuất danh bạ hội viên ra file Excel tiêu chuẩn | Phạm Văn Vũ | **Trung bình** | Drawer Chi Tiết Hội Viên (/members) | `POST /api/members/:id/reject, GET /api/members/export-excel` |  |  | ✅ | Gửi lý do từ chối để ứng viên bổ sung hồ sơ; hỗ trợ trích xuất báo cáo danh bạ. |

### CRM-05: Quản Trị Sự Kiện, Sơ Đồ Khán Phòng Cinema Hall & Quét QR Điểm Danh (Web CRM)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 102 | **EVT-CRM-01** | Khởi tạo sự kiện mới với Catalog mẫu theo 4 loại hình (Forum, Workshop, Networking, Training) | Phạm Văn Vũ | **Cao** | Tạo Sự Kiện CRM (/events/new, EventWizard) | `POST /api/events, event-type-templates.ts` |  |  | ✅ | Tự động gợi ý tiêu đề chuẩn, tagline, địa điểm, sức chứa và nội dung chương trình. |
| 103 | **EVT-CRM-02** | Tự động render Live Banner Preview và dàn trang text theo loại hình sự kiện đã chọn | Phạm Văn Vũ | **Cao** | EventWizard.tsx Live Preview | `Frontend Template Renderer` |  |  | ✅ | Xem trước banner chuyên nghiệp ngay khi nhập liệu trước khi xuất bản. |
| 104 | **EVT-CRM-03** | Sơ đồ khán phòng Cinema Seating Map kéo thả ghế ngồi, phân khu Bàn VIP và Ghế Tiêu Chuẩn | Phạm Văn Vũ | **Cao** | Sơ đồ Khán Phòng (/events/seating) | `CinemaSeatingMap.tsx, PUT /api/events/:id/seating-map` |  |  | ✅ | Kéo thả xếp chỗ thông minh, hiển thị tên doanh nhân trên từng vị trí ghế. |
| 105 | **EVT-CRM-04** | Quản lý danh sách đại biểu đăng ký vé: Họ tên, Doanh nghiệp, Mã vé, Mã Lucky Draw #XXXX | Phạm Văn Vũ | **Cao** | Danh sách Đại biểu (/events/:id/attendees) | `GET /api/events/:id/registrations` |  |  | ✅ | Quản lý hạn mức vé miễn phí (0đ) và vé có phí; theo dõi trạng thái thanh toán. |
| 106 | **EVT-CRM-05** | Cổng soát vé Check-in QR tốc độ cao 1 giây, tự động ghi nhận điểm danh và chống quét trùng | Phạm Văn Vũ | **Cao** | Cổng Điểm Danh (/events/checkin) | `POST /api/events/:id/checkin, HTML5 QR Scanner` |  |  | ✅ | Tốc độ quét phản hồi 1s, hiển thị popup chúc mừng đại biểu bước vào khán phòng. |

### CRM-06: Quản Trị Bầu Cử Đại Hội, Biểu Quyết Tín Nhiệm & Vòng Quay Lucky Draw (Web CRM)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 107 | **VOTE-CRM-01** | Thiết lập kỳ biểu quyết tín nhiệm: Tạo phiên bỏ phiếu, danh sách ứng cử viên và phương án bầu cử | Phạm Văn Vũ | **Cao** | Quản trị Biểu Quyết (/voting) | `POST /api/voting/sessions` |  |  | ✅ | Cấu hình thời gian mở/đóng hòm phiếu điện tử và số lượng phiếu bầu tối đa. |
| 108 | **VOTE-CRM-02** | Giám sát kết quả bỏ phiếu thời gian thực (Live Voting Realtime Chart qua Socket.io) | Phạm Văn Vũ | **Cao** | Màn hình Kết Quả Biểu Quyết (/voting) | `Socket.io voting:started, voting:result_updated` |  |  | ✅ | Biểu đồ cột realtime hiển thị tỷ lệ tán thành công khai, minh bạch. |
| 109 | **VOTE-CRM-03** | Đẩy thông báo biểu quyết tức thì về App Hội Viên để tham gia bỏ phiếu 1 chạm | Phạm Văn Vũ | **Cao** | Quản trị Biểu Quyết (/voting) | `POST /api/voting/sessions/:id/broadcast` |  |  | ✅ | Tất cả hội viên tham dự sự kiện nhận thông báo đẩy về hòm thư để vote ngay. |
| 110 | **VOTE-CRM-04** | Vận hành Vòng quay May mắn (Lucky Draw), quay số theo mã vé #XXXX và bắn thông báo mạ vàng VIP | Phạm Văn Vũ | **Cao** | Lucky Draw Modal (/voting) | `POST /api/voting/lucky-draw/notify` |  |  | ✅ | Quay số ngẫu nhiên minh bạch, tự động gửi thông báo chúc mừng mạ vàng VIP đến người trúng. |

### CRM-07: Quản Trị Sàn Marketplace, Kiểm Duyệt Sản Phẩm & Đẩy Lên App (Web CRM)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 111 | **MKT-CRM-01** | Hàng đợi thẩm định sản phẩm do hội viên đăng tải từ App Hiệp Hội | Phạm Văn Vũ | **Cao** | Sàn Giao Thương CRM (/marketplace) | `GET /api/crm/marketplace/products?status=pending` |  |  | ✅ | Tiếp nhận yêu cầu xuất bản sản phẩm mới của các doanh nghiệp thành viên. |
| 112 | **MKT-CRM-02** | Đánh giá tiêu chuẩn xuất xứ, chứng chỉ chất lượng và thẩm định chính sách chiết khấu VIP nội bộ | Phạm Văn Vũ | **Cao** | Drawer Thẩm Định Sản Phẩm (/marketplace) | `GET /api/crm/marketplace/products/:id` |  |  | ✅ | Đảm bảo sản phẩm có nguồn gốc uy tín và ưu đãi giá độc quyền cho hội viên CLB. |
| 113 | **MKT-CRM-03** | Phê duyệt xuất bản (Publish) gán nhãn "Đã Xác Thực CLB CEO 1983" và đồng bộ lên Sàn App | Phạm Văn Vũ | **Cao** | Sàn Giao Thương CRM (/marketplace) | `PUT /api/crm/marketplace/products/:id/approve` |  |  | ✅ | Sản phẩm sau khi duyệt sẽ hiển thị lập tức tại 3 section phân trang trên App. |
| 114 | **MKT-CRM-04** | Giám sát và điều phối các yêu cầu báo giá sỉ B2B giữa các doanh nghiệp | Phạm Văn Vũ | **Trung bình** | Sàn Giao Thương CRM (/marketplace) | `GET /api/crm/marketplace/inquiries` |  |  | ✅ | Thống kê nhu cầu mua bán sỉ và kết nối ban xúc tiến thương mại hỗ trợ. |

### CRM-08: Giám Sát Cơ Hội Giao Thương B2B & Báo Cáo Giá Trị Deals (Web CRM)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 115 | **OPP-CRM-01** | Tiếp nhận và phân loại nhu cầu hợp tác giao thương B2B (Chào mua, Chào bán, Tìm đối tác liên doanh) | Phạm Văn Vũ | **Cao** | Cơ Hội Giao Thương CRM (/opportunities) | `GET /api/crm/opportunities` |  |  | ✅ | Phân loại theo lĩnh vực, ngành nghề kinh doanh và khoảng ngân sách đề xuất. |
| 116 | **OPP-CRM-02** | Theo dõi trạng thái kết nối, lượt tương tác realtime và danh sách đối tác quan tâm | Phạm Văn Vũ | **Cao** | Chi Tiết Cơ Hội (/opportunities/:id) | `GET /api/crm/opportunities/:id/interests` |  |  | ✅ | Giám sát mức độ quan tâm của cộng đồng đối với từng cơ hội kinh doanh. |
| 117 | **OPP-CRM-03** | Thống kê và báo cáo tổng hợp quy mô kinh tế, tổng giá trị deals giao thương thành công của Hiệp Hội | Phạm Văn Vũ | **Cao** | Báo Cáo Giao Thương (/opportunities/reports) | `GET /api/crm/opportunities/kpi-reports` |  |  | ✅ | Cung cấp số liệu chính xác phục vụ báo cáo đại hội và vinh danh hội viên. |

### CRM-09: Quản Trị Pháp Nhân Doanh Nghiệp Thành Viên & Bản Đồ Chuỗi Cung Ứng (Web CRM)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 118 | **CORP-01** | Danh mục hồ sơ pháp nhân doanh nghiệp thành viên, tra cứu thông tin mã số thuế và vốn điều lệ | Phạm Văn Vũ | **Cao** | Hồ Sơ Doanh Nghiệp (/businesses) | `GET /api/crm/businesses, GET /api/tax-lookup/:taxCode` |  |  | ✅ | Lưu trữ thông tin giấy phép kinh doanh, người đại diện pháp luật và quy mô công ty. |
| 119 | **CORP-02** | Bản đồ chuỗi cung ứng nội bộ và ma trận liên kết tiêu dùng chéo giữa 7 Ban Ngành Chuyên Trách | Phạm Văn Vũ | **Trung bình** | Bản Đồ Chuỗi Cung Ứng (/supply-chain) | `GET /api/crm/supply-chain-matrix` |  |  | ✅ | Nhận diện các mắt xích cung ứng tiềm năng giữa các thành viên CLB CEO 1983. |
| 120 | **CORP-03** | Quản lý liên kết đa tài khoản lãnh đạo / nhân sự chủ chốt với cùng một pháp nhân doanh nghiệp | Phạm Văn Vũ | **Trung bình** | Chi Tiết Doanh Nghiệp (/businesses/:id) | `POST /api/crm/businesses/:id/link-member` |  |  | ✅ | Cho phép nhiều đại diện lãnh đạo cùng sinh hoạt trong CLB dưới một pháp nhân. |

### CRM-10: Quản Lý Sổ Quỹ Tài Chính, Đối Soát VietQR Tự Động & Niên Liễm (Web CRM)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 121 | **FIN-01** | Bảng theo dõi niên liễm theo từng năm tài chính của toàn bộ hội viên (Đã nộp / Chưa nộp / Quá hạn) | Phạm Văn Vũ | **Cao** | Quản Lý Niên Liễm (/finance/membership-fees) | `GET /api/crm/finance/fees` |  |  | ✅ | Theo dõi chi tiết hạn mức hội phí thường niên và trạng thái hoàn thành nghĩa vụ tài chính. |
| 122 | **FIN-02** | Cơ chế đối soát giao dịch VietQR Napas 247 tự động, đối chiếu số tiền và cú pháp chuyển khoản | Phạm Văn Vũ | **Cao** | Đối Soát VietQR (/finance/reconciliation) | `POST /api/crm/finance/reconcile-vietqr` |  |  | ✅ | Tự động bắt khớp mã giao dịch Napas 247 và gạch nợ tức thì cho hội viên. |
| 123 | **FIN-03** | Lập phiếu thu / phiếu chi và quản lý sổ quỹ thu chi kế toán minh bạch | Phạm Văn Vũ | **Cao** | Sổ Quỹ Kế Toán (/finance/cashbook) | `POST /api/crm/finance/cashbook/entry` |  |  | ✅ | Lưu trữ chứng từ số thu - chi, định khoản kế toán rõ ràng phục vụ kiểm toán. |
| 124 | **FIN-04** | Xuất báo cáo tài chính định kỳ chuẩn mực phục vụ Ban Kiểm Soát CLB | Phạm Văn Vũ | **Cao** | Báo Cáo Tài Chính (/finance/reports) | `GET /api/crm/finance/export-financial-report` |  |  | ✅ | Trích xuất file Excel / PDF báo cáo tài chính minh bạch cho Ban Thường Trực. |

### CRM-11: Nhật Ký Kiểm Toán (Audit Trail), HTTPS & Sao Lưu Dữ Liệu (Web CRM)

| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | API Mapped | Khởi tạo | Inprocess | Done | Ghi Chú |
|:---:|---|---|:---:|:---:|---|---|:---:|:---:|:---:|:---:|
| 125 | **SEC-CRM-01** | Nhật ký kiểm toán an ninh bất biến (Audit Trail ghi nhận mọi thao tác create/update/delete) | Phạm Văn Vũ | **Cao** | Nhật Ký Kiểm Toán (/audit-logs) | `GET /api/crm/audit-logs, AuditInterceptor` |  |  | ✅ | Lưu trữ địa chỉ IP, thời gian, tài khoản thực hiện và nội dung thay đổi dữ liệu. |
| 126 | **SEC-CRM-02** | Cấu hình HTTPS SSL Reverse Proxy Docker (:5443 CRM, :5444 App) bảo mật đường truyền | Phạm Văn Vũ | **Cao** | Hạ Tầng Mạng & Server Dev | `Nginx SSL Reverse Proxy, deploy-ssl.ps1` |  |  | ✅ | Mã hóa SSL/TLS 1.3 cho toàn bộ kết nối giữa trình duyệt và máy chủ. |
| 127 | **SEC-CRM-03** | Lịch sao lưu cơ sở dữ liệu PostgreSQL tự động và cơ chế khôi phục thảm họa (Disaster Recovery) | Phạm Văn Vũ | **Cao** | Hạ Tầng CSDL | `Cron pg_dump, backup-db.ps1` |  |  | ✅ | Đảm bảo an toàn dữ liệu tuyệt đối, định kỳ backup và lưu trữ an toàn. |

