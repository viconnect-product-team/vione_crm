# HƯỚNG DẪN SỬ DỤNG CHI TIẾT ỨNG DỤNG DI ĐỘNG HIỆP HỘI DOANH NHÂN CEO 1983
**Phân hệ:** Mobile App Hiệp Hội (iOS & Android) — **Đơn vị vận hành:** CLB Doanh Nhân CEO 1983  
**Nền tảng công nghệ:** VIONE Ecosystem Pro — **Phiên bản:** v2.6.0  
**Ngày cập nhật:** 18/09/2026 — **Môi trường:** Live Production Staging  
**Tài liệu kèm ảnh chụp thực tế 100% (Bao gồm các màn hình liên kết CRM Quản Trị tương ứng)**

---

## 📑 MỤC LỤC CHI TIẾT

1. [DANH MỤC TÀI KHOẢN VẬN HÀNH & KIỂM THỬ THỰC TẾ](#1-danh-mục-tài-khoản-vận-hành--kiểm-thử-thực-tế)
2. [QUY TRÌNH GIA NHẬP: LANDING PAGE ➔ CRM PHÊ DUYỆT ➔ KÍCH HOẠT TÀI KHOẢN APP](#2-quy-trình-gia-nhập-landing-page--crm-phê-duyệt--kích-hoạt-tài-khoản-app)
3. [ĐĂNG NHẬP, KHÔI PHỤC THÔNG TIN & TRANG CHỦ (HOME DASHBOARD)](#3-đăng-nhập-khôi-phục-thông-tin--trang-chủ-home-dashboard)
4. [THẺ HỘI VIÊN VIP KỸ THUẬT SỐ, QUÉT RADAR NFC & DANH THIẾP SỐ CÔNG KHAI](#4-thẻ-hội-viên-vip-kỹ-thuật-số-quét-radar-nfc--danh-thiếp-số-công-khai)
5. [QUẢN LÝ SỰ KIỆN: CHI TIẾT SỰ KIỆN, MUA VÉ VIETQR, CHECK-IN & HOẠT ĐỘNG (KÈM ẢNH CRM LIÊN QUAN)](#5-quản-lý-sự-kiện-chi-tiết-sự-kiện-mua-vé-vietqr-check-in--hoạt-động-kèm-ảnh-crm-liên-quan)
6. [SÀN GIAO THƯƠNG MARKETPLACE: DANH MỤC, THÊM MỚI, XÓA & CHỈNH SỬA SẢN PHẨM (KÈM ẢNH CRM LIÊN QUAN)](#6-sàn-giao-thương-marketplace-danh-mục-thêm-mới-xóa--chỉnh-sửa-sản-phẩm-kèm-ảnh-crm-liên-quan)
7. [BẢNG TIN CƠ HỘI KẾT NỐI KINH DOANH: ĐĂNG MỚI, CHỈNH SỬA, ĐÓNG & NHẬN DEAL (KÈM ẢNH CRM LIÊN QUAN)](#7-bảng-tin-cơ-hội-kết-nối-kinh-doanh-đăng-mới-chỉnh-sửa-đóng--nhận-deal-kèm-ảnh-crm-liên-quan)
8. [DANH BẠ HỘI VIÊN, HỒ SƠ DOANH NGHIỆP 360°, KẾT NỐI & MỜI HỘI VIÊN](#8-danh-bạ-hội-viên-hồ-sơ-doanh-nghiệp-360-kết-nối--mời-hội-viên)
9. [HỘP THƯ TIN NHẮN, TẠO NHÓM, CHAT 1-1, GỬI ĐỊNH VỊ GPS & GỌI ĐIỆN MESSENGER](#9-hộp-thư-tin-nhắn-tạo-nhóm-chat-1-1-gửi-định-vị-gps--gọi-điện-messenger)
10. [MENU CÁ NHÂN, DANH THIẾP SỐ, KÊNH TRỢ GIÚP & ĐỌC HƯỚNG DẪN SỬ DỤNG TRỰC TIẾP TRONG APP](#10-menu-cá-nhân-danh-thiếp-số-kênh-trợ-giúp--đọc-hướng-dẫn-sử-dụng-trực-tiếp-trong-app)
11. [QUẢN LÝ HỘI PHÍ THƯỜNG NIÊN (KÈM ẢNH CRM LIÊN QUAN)](#11-quản-lý-hội-phí-thường-niên-kèm-ảnh-crm-liên-quan)

---

## 1. DANH MỤC TÀI KHOẢN VẬN HÀNH & KIỂM THỬ THỰC TẾ

Hệ thống được thiết lập sẵn các tài khoản demo chuẩn để kiểm thử toàn bộ luồng nghiệp vụ giữa CRM và App:

| STT | Vai Trò | Email Đăng Nhập | Mật Khẩu | Pháp Nhân Doanh Nghiệp | Phạm Vi Kiểm Thử |
|:---:|---|---|:---:|---|---|
| 1 | **Quản Trị Viên (Admin CRM)** | `admin@connect.vn` | `123456` | VIONE Platform Holdings | Quản trị CRM: duyệt hội viên, tạo sự kiện, duyệt bài marketplace, đối soát phí |
| 2 | **Tổng Thư Ký CLB (Executive)** | `ceo.tongthuky@ceo1983.com` | `123456` | Ban Chấp Hành CEO 1983 | Điều hành hiệp hội, kiểm duyệt bài viết, xuất bản tin tức |
| 3 | **Hội Viên Doanh Nhân Mới (User A)** | `ceo.namhai@vione.app` | `123456` | Nam Hải Group | Test luồng duyệt hội viên, kích hoạt thẻ VIP, tạo sản phẩm, claim cơ hội |
| 4 | **Hội Viên Doanh Nhân 1 (User B)** | `ceo.member1@ceo1983.com` | `123456` | CP Xây Dựng 1983 | Test luồng Chat 1-1, gửi định vị công ty, gọi thoại, đăng bài marketplace |
| 5 | **Hội Viên Doanh Nhân 2 (User C)** | `ceo.member2@ceo1983.com` | `123456` | Logistics 1983 Toàn Cầu | Test nhận thông báo sự kiện, đăng ký vé VietQR, bình chọn trực tiếp |

---

## 2. QUY TRÌNH GIA NHẬP: LANDING PAGE ➔ CRM PHÊ DUYỆT ➔ KÍCH HOẠT TÀI KHOẢN APP

### 2.1. Thao Tác Trên Cổng Thông Tin Landing Page (Dành cho Doanh Nhân Mới)
1. Doanh nhân truy cập cổng thông tin CLB CEO 1983 tại địa chỉ Landing Page.
2. Tìm hiểu tôn chỉ hoạt động, điều lệ hiệp hội và các quyền lợi kết nối B2B.
3. Nhấp chọn nút **"Đăng ký gia nhập CLB CEO 1983"** trên thanh điều hướng hoặc banner chính.
4. Điền đầy đủ thông tin pháp nhân:
   - Tên doanh nghiệp, Mã số thuế (MST), Địa chỉ trụ sở.
   - Họ tên người đại diện pháp luật, Chức vụ, Số điện thoại di động, Email công vụ.
   - Ban chuyên môn mong muốn sinh hoạt (Ban Xúc tiến Thương mại, Ban Sự kiện, Ban Tài chính, v.v.).
5. Nhấn **"Gửi hồ sơ thẩm định"** và nhận mã tra cứu tiến độ tự động.

![Giao diện Cổng thông tin Landing Page CLB CEO 1983](images/evidence/sub_01_landing_header_hero.png)
*Hình 2.1: Giao diện Cổng thông tin Landing Page CLB CEO 1983 với nút Đăng ký tham gia.*

![Modal Tiếp nhận Form Đăng ký Hội viên Mới](images/evidence/sub_03_landing_registration_modal.png)
*Hình 2.2: Form đăng ký trực tuyến tiếp nhận thông tin pháp nhân và hồ sơ doanh nghiệp.*

![Màn hình Tra cứu Tiến độ Thẩm định Hồ sơ](images/evidence/sub_04_landing_status_polling.png)
*Hình 2.3: Màn hình kiểm tra trạng thái phê duyệt hồ sơ dành cho doanh nghiệp đăng ký mới.*

---

### 2.2. Thao Tác Phê Duyệt Của Ban Thư Ký Trên Web CRM (Luồng CRM Liên Quan Trực Tiếp)
1. Ban Thư ký đăng nhập hệ thống Web CRM (`http://14.225.217.232:5000/auth`) bằng tài khoản Quản trị.
2. Điều hướng vào menu **"Quản lý Hội viên"** (`/members`).
3. Danh sách hồ sơ mới hiển thị với nhãn trạng thái màu vàng: **"Chờ xét duyệt"**.
4. Nhấp vào dòng hội viên để mở **Drawer Hồ sơ Chi tiết 360°**, kiểm tra MST, giấy phép ĐKKD và năng lực doanh nghiệp.
5. Nhấp nút **"Phê duyệt Hội viên (Approve)"**.
6. **Cơ chế đồng bộ tự động:**
   - CSDL cập nhật trạng thái hội viên sang `Active` (Hoạt động).
   - Hệ thống tự động khởi tạo Thẻ Hội Viên VIP Kỹ Thuật Số với Mã ID độc bản (`CEO-1983-xxx`).
   - Cấp quyền đăng nhập tức thì trên Ứng dụng Di động (Mobile App) cho hội viên.

![CRM: Danh sách Hội viên tiếp nhận hồ sơ chờ duyệt](images/evidence/sub_07_crm_members_list.png)
*Hình 2.4: Màn hình CRM Quản lý Hội viên hiển thị danh sách hồ sơ đăng ký mới cần thẩm định.*

![CRM: Drawer kiểm tra chi tiết hồ sơ doanh nghiệp và tư cách hội viên](images/evidence/sub_08_crm_member_detail_drawer.png)
*Hình 2.5: Drawer chi tiết hồ sơ hội viên trên CRM phục vụ thẩm định năng lực trước khi kích hoạt.*

![CRM: Thao tác bấm nút Phê duyệt (Approve) cấp quyền vào App](images/evidence/sub_09_crm_approve_action.png)
*Hình 2.6: Thao tác bấm nút Phê duyệt trên CRM - Kích hoạt quyền đăng nhập App di động cho hội viên.*

---

## 3. ĐĂNG NHẬP, KHÔI PHỤC THÔNG TIN & TRANG CHỦ (HOME DASHBOARD)

### 3.1. Đăng Nhập Ứng Dụng Mobile App
1. Mở ứng dụng **CEO 1983** trên điện thoại iOS (TestFlight/App Store) hoặc Android (APK/Google Play).
2. Nhập Email hoặc Số điện thoại đã được đăng ký và phê duyệt.
3. Nhập Mật khẩu (mặc định ban đầu do hệ thống cấp: `123456` hoặc mật khẩu cá nhân).
4. Nhấn **"Đăng nhập"**.
5. Trường hợp quên mật khẩu: Bấm liên kết **"Quên mật khẩu?"** hoặc bấm nút **"Hỗ trợ Thư ký"** để được cấp lại mật khẩu xác thực qua SMS/Email.

![Màn hình Đăng nhập App Di động Hiệp hội CEO 1983](images/evidence/sub_10_app_login_screen.png)
*Hình 3.1: Màn hình Đăng nhập chuyên biệt cho Hội viên Hiệp hội Doanh nhân CEO 1983.*

![Nhập thông tin xác thực đăng nhập vào hệ thống](images/evidence/sub_11_app_login_credentials.png)
*Hình 3.2: Điền thông tin Email/SĐT và mật khẩu để bắt đầu phiên làm việc an toàn.*

---

### 3.2. Trang Chủ Hội Viên (Home Dashboard)
Trang chủ được thiết kế theo phong cách hiện đại với đầy đủ công cụ điều hướng:
- **Header Định danh Doanh nhân:** Hiển thị Logo hiệp hội, Tên hội viên, Doanh nghiệp và Huy hiệu Ban chấp hành/Hội viên chính thức.
- **Top Carousel Banner:** Hiển thị các sự kiện Đại hội, Hội thảo Xúc tiến thương mại mới nhất có ảnh sắc nét.
- **Thanh Điều hướng Nhanh (Quick Actions):**
  - Quét QR Điểm danh / Kết nối nhanh.
  - Sự kiện sắp tới & Đặt vé.
  - Sàn Marketplace mua bán B2B nội bộ.
  - Bảng tin Cơ hội kết nối giao thương (Matching).
  - Danh bạ Doanh nhân & Ban ngành.
- **Tóm tắt Chỉ số Cá nhân:** Số lượng kết nối thành công, số tin nhắn chưa đọc, sự kiện đã đăng ký.

![Giao diện Trang chủ Hội viên CEO 1983](images/evidence/sub_12_app_home_top_banner.png)
*Hình 3.3: Giao diện Trang chủ App với Banner Sự kiện nổi bật và các lối tắt chức năng.*

---

## 4. THẺ HỘI VIÊN VIP KỸ THUẬT SỐ, QUÉT RADAR NFC & DANH THIẾP SỐ CÔNG KHAI

### 4.1. Thẻ Hội Viên VIP Kỹ Thuật Số (Digital VIP Card)
1. Tại Trang chủ hoặc mục Cá nhân, chạm vào biểu tượng **"Thẻ Hội Viên"**.
2. Thẻ hiển thị thiết kế mạ vàng 3D sang trọng:
   - Logo Hiệp hội Doanh nhân CEO 1983.
   - Họ tên Doanh nhân, Tên Công ty, Chức danh.
   - Hạng thẻ: **VIP Gold / Diamond Member**.
   - Mã định danh hội viên duy nhất: `CEO-1983-xxx`.
   - Thời hạn hiệu lực của hội phí (Hạn thẻ).
3. **Mã QR Độc Bản:** Dùng để đối tác quét kết nối trực tiếp hoặc quét điểm danh vào cổng sự kiện của hiệp hội.

![Thẻ Hội Viên VIP Kỹ Thuật Số CLB Doanh Nhân CEO 1983](images/evidence/sub_13_app_vip_card_front.png)
*Hình 4.1: Thẻ Hội Viên VIP 3D với mã QR định danh và thời hạn hiệu lực của thẻ.*

---

### 4.2. Quét Radar NFC & Kết Nối Doanh Nhân Lân Cận
1. Tại màn hình Thẻ hoặc Trang chủ, bấm chọn biểu tượng **"Radar NFC"**.
2. Ứng dụng kích hoạt sóng quét lân cận (Bluetooth BLE / Định vị hội trường sự kiện):
   - Quét và hiển thị avatar các doanh nhân CEO 1983 đang có mặt trong bán kính sự kiện.
   - Cho phép chạm 2 điện thoại có hỗ trợ NFC để trao đổi danh thiếp số tức thì không cần kết bạn thủ công.

![Modal Quét Radar NFC tìm kiếm đối tác lân cận](images/evidence/sub_14_app_nfc_radar_modal.png)
*Hình 4.2: Tính năng Radar NFC quét tìm doanh nhân cùng hiệp hội trong bán kính sự kiện.*

---

### 4.3. Danh Thiếp Số Điện Tử Công Khai (Public Digital Business Card)
1. Bấm nút **"Chia sẻ Danh thiếp số"**.
2. Ứng dụng tạo đường dẫn trang web công khai (vd: `https://app.ceo1983.vn/card/namhai`).
3. Đối tác ngoài hiệp hội có thể quét mã QR này để:
   - Lưu danh bạ (vCard) trực tiếp vào điện thoại chỉ với 1 chạm.
   - Xem catalogue sản phẩm và hồ sơ năng lực công ty.
   - Gửi yêu cầu hợp tác kinh doanh.

![Trang Danh thiếp số Doanh nhân công khai](images/evidence/sub_15_app_public_digital_card.png)
*Hình 4.3: Trang Danh thiếp số chia sẻ đa nền tảng giúp mở rộng mạng lưới giao thương.*

---

## 5. QUẢN LÝ SỰ KIỆN: CHI TIẾT SỰ KIỆN, MUA VÉ VIETQR, CHECK-IN & HOẠT ĐỘNG (KÈM ẢNH CRM LIÊN QUAN)

### 5.1. Luồng CRM Cấu Hình & Quản Trị Sự Kiện (Chức năng CRM tương ứng)
Để sự kiện xuất hiện trên App, Ban tổ chức thực hiện các bước trên Web CRM:
1. Truy cập CRM menu **"Quản lý Sự kiện"** (`/events`).
2. Bấm nút **"Tạo Sự kiện Mới"**:
   - Nhập Tiêu đề sự kiện, Địa điểm tổ chức, Thời gian bắt đầu/kết thúc.
   - Tải lên Banner sự kiện (tỷ lệ 16:9 chất lượng cao).
   - Nhập danh sách Diễn giả (Speaker) và Lịch trình chi tiết (Agenda).
   - Cấu hình loại vé: Vé Miễn phí dành cho Hội viên chính thức hoặc Vé Thu phí (nhập giá vé VNĐ).
   - Cấu hình Sơ đồ Khán phòng (Cinema Hall Seating Map): Phân hàng ghế VIP, Hạng Thương gia, Tiêu chuẩn.
3. Xuất bản sự kiện: Sự kiện ngay lập tức đồng bộ thời gian thực sang App hội viên.

![CRM: Quản lý danh sách sự kiện và thiết lập tổ chức](images/evidence/sub_27_crm_events_management.png)
*Hình 5.1: Màn hình CRM Quản lý Sự kiện - Nơi tạo và điều phối các sự kiện của CLB.*

![CRM: Thiết lập Sơ đồ Khán phòng Cinema Map và vị trí ghế ngồi](images/evidence/sub_28_crm_seating_cinema_map.png)
*Hình 5.2: Công cụ cấu hình sơ đồ khán phòng và chỗ ngồi sự kiện trên hệ thống Web CRM.*

---

### 5.2. Xem Danh Sách Sự Kiện Trên App Hội Viên
1. Trên thanh điều hướng đáy (Bottom Bar), chọn tab **"Sự kiện"**.
2. Giao diện hiển thị danh sách các sự kiện được phân loại rõ ràng:
   - Tab **Sắp diễn ra:** Các chương trình sắp tổ chức trong tháng.
   - Tab **Đang diễn ra:** Các chương trình đang chạy trong ngày để hội viên vào check-in.
   - Tab **Đã tham gia:** Lịch sử các sự kiện hội viên từng dự.
3. Bộ lọc theo danh mục: Đại hội thường niên, Caravan xúc tiến, Talkshow doanh nhân, Gala kết nối.

![Danh sách Sự kiện trên App Hiệp hội](images/evidence/sub_29_app_events_screen.png)
*Hình 5.3: Màn hình danh sách Sự kiện với thẻ hình ảnh trực quan và trạng thái sự kiện.*

---

### 5.3. Xem Chi Tiết Sự Kiện (Event Detail Modal)
1. Nhấp vào bất kỳ sự kiện nào trong danh sách.
2. Màn hình Chi tiết Sự kiện mở ra cung cấp toàn bộ dữ liệu:
   - **Banner và Tiêu đề:** Hình ảnh chủ đạo sắc nét, thời gian và địa chỉ tổ chức cụ thể kèm bản đồ dẫn đường.
   - **Nội dung chương trình (Agenda):** Lịch trình chi tiết từng khung giờ (Đón khách, Khai mạc, Tọa đàm, Ký kết hợp tác, Tiệc tối).
   - **Danh sách Diễn giả (Keynote Speakers):** Ảnh đại diện, họ tên, chức vụ và chuyên đề thuyết trình.
   - **Quyền lợi đại biểu:** Tài liệu độc quyền, tea-break, quà tặng lưu niệm.
   - **Sơ đồ khán phòng:** Vị trí khán phòng và phân khu chỗ ngồi.
3. Nhấn nút **"Đăng ký tham dự"** ở chân trang.

![Modal Chi tiết Sự kiện trên App Hiệp hội](images/evidence/sub_30_app_event_detail_modal.png)
*Hình 5.4: Chi tiết sự kiện với đầy đủ lịch trình, diễn giả, quyền lợi và sơ đồ chỗ ngồi.*

---

### 5.4. Đăng Ký Vé, Thanh Toán VietQR & Nhận Vé Điện Tử (Ticket Pass)
1. Trường hợp sự kiện có thu phí:
   - Hệ thống mở popup **Thanh toán Chuyển khoản VietQR**.
   - Hiển thị Mã QR động kèm đầy đủ: Số tài khoản ngân hàng thụ hưởng của CLB, Tên ngân hàng, Số tiền vé, Cú pháp chuyển khoản chuẩn tự động (vd: `VE-1983-NAMHAI`).
   - Hội viên mở ứng dụng ngân hàng quét mã và xác nhận chuyển khoản.
2. Sau khi xác nhận đăng ký thành công:
   - Hệ thống cấp ngay **Vé Điện Tử Chính Thức (Ticket Pass)** lưu trong mục **"Vé của tôi"**.
   - Vé hiển thị: Tên sự kiện, Mã vé số, Số ghế phân bổ trong khán phòng.
   - **Mã QR Check-in Tốc độ cao:** Khi đến cổng sự kiện, hội viên chỉ cần mở vé này để Ban tổ chức quét mã check-in qua máy quét hoặc điện thoại CRM.

![Modal Thanh toán Vé qua Mã VietQR Ngân hàng](images/evidence/08_app_vietqr_payment_modal.png)
*Hình 5.5: Cổng thanh toán VietQR động tạo mã chuyển khoản tự động kèm cú pháp chuẩn.*

![Vé Điện Tử Ticket Pass có Mã QR Check-in](images/evidence/sub_31_app_event_ticket_pass.png)
*Hình 5.6: Vé điện tử chính thức kèm mã QR định danh phục vụ check-in nhanh tại quầy sự kiện.*

---

### 5.5. Bình Chọn Trực Tiếp (Live Voting) & Bốc Thăm May Mắn (Lucky Draw)
Khi sự kiện đang diễn ra trong hội trường:
1. **Bình chọn Trực tiếp (Live Voting):**
   - Ban tổ chức kích hoạt câu hỏi biểu quyết từ CRM (vd: Bầu cử Ban chấp hành, Bình chọn Doanh nghiệp Xuất sắc).
   - Ứng dụng hội viên lập tức rung và hiển thị màn hình Bình chọn.
   - Hội viên chọn phương án và nhấn **"Bỏ phiếu"**. Kết quả được tổng hợp thời gian thực hiển thị trên màn hình LED sân khấu.
2. **Quay Số Trúng Thưởng (Lucky Draw):**
   - Mã vé sự kiện của hội viên tự động được đưa vào vòng quay may mắn.
   - Hội viên theo dõi vòng quay ngẫu nhiên và nhận thông báo trúng thưởng ngay trên điện thoại.

![Tính năng Bình chọn Trực tiếp Live Voting trong sự kiện](images/evidence/sub_32_app_event_live_voting.png)
*Hình 5.7: Màn hình bỏ phiếu trực tiếp thời gian thực dành cho đại biểu tham dự đại hội.*

![Tính năng Quay số May mắn Lucky Draw sự kiện](images/evidence/sub_33_app_event_lucky_draw.png)
*Hình 5.8: Vòng quay may mắn Lucky Draw trao thưởng cho đại biểu tham dự.*

---

## 6. SÀN GIAO THƯƠNG MARKETPLACE: DANH MỤC, THÊM MỚI, XÓA & CHỈNH SỬA SẢN PHẨM (KÈM ẢNH CRM LIÊN QUAN)

### 6.1. Luồng CRM Kiểm Duyệt & Quản Trị Gian Hàng (Chức năng CRM tương ứng)
1. Ban quản trị truy cập CRM menu **"Sàn Giao thương B2B"** (`/marketplace`).
2. Xem toàn bộ sản phẩm/dịch vụ do các doanh nghiệp hội viên đăng tải từ App.
3. Ban quản trị có quyền:
   - **Phê duyệt:** Đưa sản phẩm lên vị trí nổi bật trên App.
   - **Gắn nhãn Khuyến mãi:** Kích hoạt ưu đãi đặc quyền cho hội viên CLB.
   - **Khóa / Ẩn sản phẩm:** Tạm dừng hiển thị các bài đăng không phù hợp quy chế.

![CRM: Kiểm duyệt và đồng bộ danh mục sản phẩm Marketplace](images/evidence/sub_37_crm_marketplace_sync.png)
*Hình 6.1: Giao diện CRM Quản trị Sàn giao thương - Kiểm duyệt và điều phối sản phẩm hội viên.*

---

### 6.2. Xem Lưới Danh Mục Sản Phẩm Trên App Hội Viên
1. Trên thanh điều hướng đáy, chọn tab **"Marketplace"**.
2. Duyệt sản phẩm theo dạng lưới 2 cột bắt mắt kèm ảnh bìa, tên sản phẩm, giá bán niêm yết và mức giá ưu đãi nội bộ.
3. Thanh lọc nhanh theo Danh mục ngành hàng:
   - Xây dựng & Vật liệu
   - Công nghệ thông tin & Viễn thông
   - Dịch vụ Pháp lý, Thuế & Kế toán
   - Bất động sản & Cho thuê văn phòng
   - Quà tặng doanh nghiệp & Tiêu dùng

![Lưới Danh mục Sản phẩm Marketplace trên App](images/evidence/sub_34_app_products_grid.png)
*Hình 6.2: Lưới danh mục sản phẩm/dịch vụ B2B do các doanh nghiệp hội viên cung ứng.*

---

### 6.3. Đăng Thêm Mới Sản Phẩm / Dịch Vụ (Create Product)
1. Tại tab Marketplace, nhấn nút **"+ Đăng Sản Phẩm"** (nút nổi tròn góc dưới phải).
2. Modal **"Đăng Sản Phẩm Mới"** mở ra:
   - **Ảnh sản phẩm:** Nhấp chọn để tải ảnh chất lượng cao từ thư viện điện thoại hoặc chụp ảnh trực tiếp.
   - **Tên sản phẩm / Dịch vụ:** Nhập tiêu đề rõ ràng (tối đa 100 ký tự).
   - **Danh mục ngành hàng:** Chọn danh mục phù hợp trong danh sách thả xuống.
   - **Giá niêm yết:** Nhập đơn giá bán ra thị trường (VNĐ).
   - **Ưu đãi cho Hội viên CEO 1983:** Nhập % chiết khấu hoặc quà tặng dành riêng cho anh chị em trong CLB.
   - **Mô tả chi tiết:** Giới thiệu thông số kỹ thuật, quy cách đóng gói, chính sách bảo hành.
   - **Số điện thoại / Zalo phụ trách:** Hotline kinh doanh tiếp nhận đơn.
3. Nhấn **"Đăng tải ngay"**. Sản phẩm xuất hiện ngay trong gian hàng của doanh nghiệp.

![Modal Đăng Thêm Mới Sản Phẩm Dịch Vụ](images/evidence/sub_35_app_product_create_modal.png)
*Hình 6.3: Form đăng tải sản phẩm mới đầy đủ hình ảnh, giá niêm yết và ưu đãi hội viên.*

---

### 6.4. Xem Chi Tiết Sản Phẩm (Product Detail Modal)
1. Nhấp vào bất kỳ sản phẩm nào trên lưới.
2. Modal Chi tiết Sản phẩm hiển thị:
   - Trình xem ảnh phóng to, thông tin nhà sản xuất (Tên công ty hội viên, Logo, Đánh giá uy tín).
   - Bảng giá ưu đãi độc quyền cho thành viên CLB.
   - Nút **"Gọi điện đặt hàng"** và **"Nhắn tin thương thảo"**: Chạm để mở ngay cuộc trò chuyện trực tiếp với chủ doanh nghiệp.

![Modal Xem Chi Tiết Sản Phẩm](images/evidence/sub_36_app_product_detail_modal.png)
*Hình 6.4: Chi tiết sản phẩm kèm thông tin nhà cung cấp và nút kết nối giao thương.*

---

### 6.5. Thao Tác CHỈNH SỬA & XÓA Sản Phẩm (Thao Tác Menu 3 Chấm)
Đối với các sản phẩm do chính doanh nghiệp của bạn đăng tải:
1. Mở màn hình Chi tiết sản phẩm hoặc vào mục **"Sản phẩm của tôi"**.
2. Trên góc trên bên phải của thẻ sản phẩm, nhấp vào biểu tượng **Menu 3 chấm (`...`)**.
3. Menu thao tác trượt lên với 2 tùy chọn:
   - **Chỉnh sửa sản phẩm:** Mở lại form để cập nhật lại giá bán, thay đổi ảnh mô tả hoặc bổ sung chương trình ưu đãi mới ➔ Nhấn **"Lưu thay đổi"**.
   - **Xóa sản phẩm:** Hiển thị hộp thoại cảnh báo: *"Bạn có chắc chắn muốn xóa sản phẩm này khỏi Sàn giao thương?"* ➔ Nhấn **"Xác nhận xóa"** để gỡ hoàn toàn sản phẩm khỏi hệ thống.

![Thao tác Menu 3 chấm: Chỉnh sửa và Xóa sản phẩm](images/evidence/sub_38_app_product_3dots_actions.png)
*Hình 6.5: Menu 3 chấm thao tác Quản trị sản phẩm: Chỉnh sửa nội dung hoặc Xóa bài đăng.*

---

## 7. BẢNG TIN CƠ HỘI KẾT NỐI KINH DOANH: ĐĂNG MỚI, CHỈNH SỬA, ĐÓNG & NHẬN DEAL (KÈM ẢNH CRM LIÊN QUAN)

### 7.1. Luồng CRM Giám Sát & Thống Kê Giao Thương B2B (Chức năng CRM tương ứng)
1. Ban quản trị truy cập CRM menu **"Cơ hội Kinh doanh"** (`/opportunities`).
2. Theo dõi lưu lượng nhu cầu mua - bán phát sinh trong nội bộ hiệp hội.
3. Giám sát các thương vụ đã được hội viên kết nối thành công, tổng hợp báo cáo định kỳ về giá trị giao thương đạt được của CLB.

![CRM: Giám sát và đồng bộ cơ hội kết nối giao thương B2B](images/evidence/sub_42_crm_opportunities_sync.png)
*Hình 7.1: Giao diện CRM Giám sát dòng chảy cơ hội giao thương và nhu cầu hợp tác.*

---

### 7.2. Xem Bảng Tin Cơ Hội Kinh Doanh Trên App Hội Viên
1. Trên thanh điều hướng đáy, chọn tab **"Cơ hội"** (Matching Leads).
2. Bảng tin hiển thị danh sách các bài đăng nhu cầu thực tế từ các doanh nghiệp thành viên:
   - **Nhu cầu Cần Mua:** Doanh nghiệp tìm nguồn cung ứng hàng hóa, nhà thầu phụ, vật tư.
   - **Nhu cầu Cần Bán / Cung ứng:** Doanh nghiệp cung ứng năng lực sản xuất, giải pháp độc quyền.
   - **Hợp tác Đầu tư / Đại lý:** Tìm kiếm đối tác nhượng quyền, phân phối vùng miền.
3. Mỗi thẻ cơ hội ghi rõ: Tiêu đề nhu cầu, Ngân sách dự kiến, Thời hạn hoàn thành và Doanh nghiệp đăng bài.

![Bảng tin Cơ hội Kinh doanh Business Matching trên App](images/evidence/sub_39_app_opportunities_feed.png)
*Hình 7.2: Bảng tin cơ hội kinh doanh B2B cập nhật liên tục từ các doanh nghiệp hội viên.*

---

### 7.3. Đăng Mới Cơ Hội Kinh Doanh (Create Opportunity)
1. Tại tab Cơ hội, nhấn nút **"+ Tạo Cơ Hội"**.
2. Điền thông tin vào Modal tạo cơ hội:
   - **Tiêu đề cơ hội:** Tóm tắt ngắn gọn nhu cầu (vd: *"Tìm nhà thầu thi công nội thất văn phòng 500m2 tại Cầu Giấy"*).
   - **Loại cơ hội:** Chọn Cần Mua / Cần Bán / Hợp tác Dự án.
   - **Ngân sách dự kiến (VNĐ):** Nhập khoảng ngân sách (vd: 500.000.000đ - 1.000.000.000đ).
   - **Hạn chót tiếp nhận hồ sơ:** Chọn ngày kết thúc tiếp nhận chào giá.
   - **Mô tả yêu cầu chi tiết:** Tiêu chuẩn chất lượng, hồ sơ năng lực cần nộp, tiến độ mong muốn.
3. Nhấn **"Đăng bài kết nối"**. Bài viết hiển thị ngay lập tức trên Bảng tin cho toàn bộ hội viên thấy.

![Modal Đăng mới Cơ hội Kinh doanh](images/evidence/sub_40_app_opportunity_create_modal.png)
*Hình 7.3: Form đăng tải nhu cầu kết nối kinh doanh với đầy đủ ngân sách và thời hạn.*

---

### 7.4. Xem Chi Tiết Cơ Hội & Nhận Kết Nối (Claim Deal)
1. Nhấp vào thẻ cơ hội bất kỳ trên Bảng tin.
2. Màn hình Chi tiết hiển thị thông tin đầy đủ và tên doanh nghiệp mời thầu/hợp tác.
3. **Thao tác Nhận Cơ Hội (Claim Opportunity):**
   - Nếu doanh nghiệp của bạn có năng lực đáp ứng, nhấn nút **"Nhận Cơ Hội Kết Nối (Claim Deal)"**.
   - Hệ thống tự động xác nhận kết nối và mở ngay kênh chat 1-1 riêng tư giữa 2 doanh nghiệp để gửi hồ sơ báo giá.
   - Trạng thái cơ hội cập nhật số lượt đối tác đã tiếp cận.

![Chi tiết Cơ hội Kinh doanh và Nút Nhận Cơ Hội (Claim Deal)](images/evidence/sub_41_app_opportunity_detail_modal.png)
*Hình 7.4: Chi tiết cơ hội kinh doanh kèm nút nhận kết nối và thương thảo trực tiếp.*

---

### 7.5. Thao Tác CHỈNH SỬA & ĐÓNG / XÓA Cơ Hội Kinh Doanh
Đối với cơ hội do chính doanh nghiệp của bạn đăng:
1. Mở bài đăng cơ hội của bạn.
2. Nhấp vào menu tùy chọn ở góc bài viết:
   - **Chỉnh sửa nội dung:** Bổ sung yêu cầu kỹ thuật, thay đổi mức ngân sách hoặc gia hạn thời gian tiếp nhận chào giá.
   - **Đóng cơ hội (Closed):** Đánh dấu đã tìm được đối tác thành công để ngừng tiếp nhận thêm đề xuất mới.
   - **Xóa bài đăng:** Hủy bỏ bài đăng khi không còn nhu cầu.

---

## 8. DANH BẠ HỘI VIÊN, HỒ SƠ DOANH NGHIỆP 360°, KẾT NỐI & MỜI HỘI VIÊN

### 8.1. Danh Bạ Hội Viên Doanh Nhân
1. Chọn tab **"Hội viên"** trên thanh điều hướng đáy.
2. Danh bạ số hiển thị danh sách toàn thể thành viên CLB CEO 1983:
   - Avatar doanh nhân, Họ và tên, Chức vụ trong ban lãnh đạo hiệp hội.
   - Tên pháp nhân công ty, Ngành nghề kinh doanh chính.
   - Thanh tìm kiếm thông minh: Tìm theo tên doanh nhân, tên công ty, hoặc mã số thuế.
   - Bộ lọc theo Chi hội / Ban chuyên môn (Ban Xây dựng, Ban Tài chính, Ban Thương mại,...).

![Danh bạ Hội viên Doanh nhân Hiệp hội CEO 1983](images/evidence/sub_16_app_members_directory.png)
*Hình 8.1: Danh bạ hội viên với công cụ tìm kiếm và lọc theo ngành nghề chuyên môn.*

---

### 8.2. Xem Hồ Sơ Doanh Nghiệp 360° (Member Profile Modal)
1. Nhấp vào tên hoặc ảnh của bất kỳ hội viên nào trong danh bạ.
2. Modal Hồ sơ Doanh nghiệp 360° mở ra:
   - **Thông tin Doanh nhân:** Ảnh chân dung, tiểu sử tóm tắt, vai trò trong hiệp hội.
   - **Hồ sơ Pháp nhân Công ty:** Giới thiệu quy mô công ty, MST, website chính thức, địa chỉ trụ sở.
   - **Danh mục Sản phẩm cung ứng:** Các sản phẩm tiêu biểu của doanh nghiệp trên Marketplace.
   - **Phương thức liên hệ trực tiếp:** Số điện thoại, Email, mạng xã hội và nút bấm gọi/chat.

![Hồ sơ Doanh nghiệp Chi tiết 360 độ của Hội viên](images/evidence/sub_17_app_member_profile_modal.png)
*Hình 8.2: Hồ sơ chi tiết hội viên với đầy đủ năng lực doanh nghiệp và thông tin liên hệ.*

---

### 8.3. Thao Tác BẬT/TẮT KẾT NỐI (Connect Toggle) & MỜI HỘI VIÊN MỚI
1. **Bật/Tắt Kết nối (Connect Toggle):**
   - Trên hồ sơ hội viên, nhấn nút **"Kết nối"**.
   - Trạng thái chuyển sang **"Đang kết nối"** (Connected), cho phép hai bên xem đầy đủ danh thiếp nội bộ và bắt đầu gửi tin nhắn trực tiếp không giới hạn.
   - Có thể chạm lại để ngắt kết nối khi cần thiết.
2. **Mời Hội Viên Mới Tham Gia CLB (Invite Member):**
   - Tại đầu danh bạ, nhấn nút **"+ Mời Hội Viên Mới"**.
   - Modal hiển thị mã giới thiệu cá nhân và liên kết mời tham gia CLB.
   - Nhấn **"Sao chép liên kết"** hoặc **"Chia sẻ qua Zalo/Facebook"** để giới thiệu các doanh nhân chất lượng gia nhập CLB CEO 1983.

![Thao tác Bật/Tắt Kết nối Hội viên](images/evidence/sub_18_app_connection_toggle.png)
*Hình 8.3: Nút toggle Kết nối đối tác giúp mở rộng mạng lưới giao thương nội bộ.*

![Modal Mời Hội Viên Mới Gia Nhập Hiệp Hội](images/evidence/sub_19_app_invite_member_modal.png)
*Hình 8.4: Tính năng Mời doanh nhân mới gia nhập hiệp hội bằng mã QR và liên kết giới thiệu.*

---

## 9. HỘP THƯ TIN NHẮN, TẠO NHÓM, CHAT 1-1, GỬI ĐỊNH VỊ GPS & GỌI ĐIỆN MESSENGER

### 9.1. Hộp Thư Đến & Tạo Nhóm Đàm Thoại Mới
1. Chọn biểu tượng **Tin nhắn (Messenger)** ở thanh điều hướng.
2. Danh sách các cuộc trò chuyện gần nhất hiển thị:
   - Avatar đối tác, tên công ty, nội dung tin nhắn mới nhất và thời gian gửi.
   - Chấm xanh báo hiệu đối tác đang trực tuyến (Online).
3. **Tạo Nhóm Đàm Thoại (Create Group):**
   - Nhấn biểu tượng dấu **"+"** góc trên phải.
   - Đặt tên nhóm dự án (vd: *"Tổ hợp Thầu Dự Án Xây Dựng 1983"*).
   - Chọn các doanh nhân từ danh bạ để thêm vào nhóm ➔ Nhấn **"Tạo nhóm"**.

![Hộp thư Tin nhắn Messenger trên App](images/evidence/sub_20_app_messages_inbox.png)
*Hình 9.1: Hộp thư đến quản lý toàn bộ các luồng hội thoại cá nhân và hội nhóm dự án.*

![Modal Tạo Nhóm Đàm Thoại Dự Án Mới](images/evidence/sub_21_app_create_group_modal.png)
*Hình 9.2: Form tạo nhóm chat đàm thoại nhiều thành viên theo dự án hoặc ban ngành.*

---

### 9.2. Trò Chuyện Trực Tiếp 1-1 & Khung Công Cụ Mở Rộng
1. Nhấp vào cuộc trò chuyện với một hội viên để mở phòng chat riêng tư.
2. Hệ thống hỗ trợ đầy đủ các tính năng trò chuyện cao cấp:
   - Nhắn tin văn bản thời gian thực kèm trạng thái "Đã gửi", "Đã nhận", "Đã xem".
   - Bấm nút **"+" (Khung công cụ mở rộng)** cạnh ô nhập văn bản để:
     - Gửi tài liệu hợp đồng, hồ sơ năng lực định dạng PDF/Word/Excel.
     - Chụp ảnh trực tiếp công trình, nhà máy hoặc gửi ảnh từ thư viện.

![Trò chuyện Trực tiếp 1-1 với Bong bóng Tin nhắn](images/evidence/sub_22_app_chat_1on1_bubble.png)
*Hình 9.3: Giao diện Chat 1-1 với bố cục tin nhắn chuyên nghiệp và bảo mật cao.*

![Khung công cụ mở rộng gửi hình ảnh và tệp tài liệu](images/evidence/sub_23_app_chat_input_expander.png)
*Hình 9.4: Khung công cụ mở rộng hỗ trợ chia sẻ tệp tài liệu, hình ảnh và định vị GPS.*

---

### 9.3. Gửi Định Vị Trụ Sở Công Ty (Location Pin) & Thu Hồi Tin Nhắn
1. **Gửi Định Vị Trụ Sở (Location Pin):**
   - Trong khung công cụ mở rộng, chọn biểu tượng **"Vị trí"**.
   - Ứng dụng lấy tọa độ GPS chính xác của bạn hoặc cho phép ghim địa chỉ trụ sở công ty.
   - Thẻ vị trí gửi vào đoạn chat với nút bấm **"Mở chỉ đường trên Bản đồ"** giúp đối tác lái xe đến thẳng văn phòng của bạn.
2. **Thu Hồi Tin Nhắn:**
   - Trường hợp gửi nhầm nội dung, nhấn giữ vào tin nhắn đó và chọn **"Thu hồi tin nhắn"**.
   - Hệ thống xóa nội dung ở cả hai phía người gửi và người nhận.

![Chia sẻ Định vị Trụ sở Công ty trong Chat](images/evidence/sub_24_app_chat_location_pin.png)
*Hình 9.5: Tính năng gửi ghim vị trí trụ sở công ty hỗ trợ đối tác đến làm việc.*

![Tính năng Thu hồi Tin nhắn đã gửi](images/evidence/sub_25_app_chat_recalled_msg.png)
*Hình 9.6: Trạng thái tin nhắn đã được thu hồi an toàn.*

---

### 9.4. Cuộc Gọi Thoại / Video Trực Tiếp Trên App (Call Popup)
1. Ở góc trên màn hình chat, nhấp vào biểu tượng **Chiếc điện thoại (Cuộc gọi)**.
2. Popup cuộc gọi hiển thị thông tin doanh nhân đang gọi đến.
3. Hai bên kết nối đàm thoại âm thanh chất lượng cao để trao đổi nhanh công việc mà không tốn cước viễn thông truyền thống.

![Popup Cuộc gọi Thoại Messenger trên App](images/evidence/sub_26_app_chat_call_popup.png)
*Hình 9.7: Giao diện thực hiện cuộc gọi thoại trực tiếp giữa các hội viên doanh nhân.*

---

## 10. MENU CÁ NHÂN, DANH THIẾP SỐ, KÊNH TRỢ GIÚP & ĐỌC HƯỚNG DẪN SỬ DỤNG TRỰC TIẾP TRONG APP

### 10.1. Menu Cá Nhân & Danh Thiếp Số
1. Chọn tab **"Cá nhân"** (Tài khoản) ở góc dưới cùng bên phải.
2. Màn hình quản trị tài khoản cung cấp:
   - Thông tin cá nhân, chức vụ và gói hội viên hiện tại.
   - **Kho Danh thiếp số:** Quản lý danh thiếp cá nhân và danh thiếp doanh nghiệp.
   - Lịch sử tham gia các hoạt động và huy hiệu cống hiến.

![Menu Quản trị Cá nhân và Tài khoản Hội viên](images/evidence/sub_43_app_profile_menu.png)
*Hình 10.1: Menu quản lý tài khoản cá nhân, bảo mật và các tiện ích mở rộng.*

![Kho Quản lý Danh thiếp số Điện tử](images/evidence/sub_44_app_digital_business_cards.png)
*Hình 10.2: Danh sách các danh thiếp số công vụ của doanh nhân trong hệ thống.*

---

### 10.2. Kênh Trợ Giúp & Liên Hệ Ban Thư Ký CLB
1. Trong menu Cá nhân, chọn **"Liên hệ Ban Thư ký"**.
2. Modal hỗ trợ hiển thị:
   - Hotline tiếp nhận hỗ trợ 24/7 của Văn phòng Hiệp hội CEO 1983.
   - Kênh Zalo Official Account chính thức.
   - Form gửi kiến nghị trực tiếp lên Ban Chấp Hành CLB.

![Modal Liên hệ và Tiếp nhận Trợ giúp từ Ban Thư ký](images/evidence/sub_45_app_contact_secretariat_modal.png)
*Hình 10.3: Kênh trợ giúp nhanh kết nối trực tiếp với Ban Thư ký CLB CEO 1983.*

---

### 10.3. Đọc Hướng Dẫn Sử Dụng Trực Tiếp Trong App (In-App PDF Viewer)
1. Trong menu Cá nhân, chọn **"Hướng dẫn sử dụng"**.
2. Hệ thống tích hợp sẵn trình xem tài liệu nội bộ:
   - Đọc trực tiếp cuốn cẩm nang hướng dẫn sử dụng đầy đủ hình ảnh ngay trên điện thoại mà không cần tải thêm ứng dụng ngoài.
   - Hỗ trợ phóng to, thu nhỏ, lật trang mượt mà và nút tải file về máy.

![Trình Xem Tài Liệu Hướng Dẫn Sử Dụng Tích Hợp Trong App](images/evidence/sub_46_app_user_guide_modal.png)
*Hình 10.4: Trình đọc tài liệu cẩm nang hướng dẫn sử dụng tích hợp trực tiếp trên ứng dụng.*

---

### 10.4. Cài Đặt Mật Khẩu, Bảo Mật, Thông Báo & Bảng Tin Hoạt Động
1. **Bảo mật & Đổi mật khẩu:** Cập nhật mật khẩu mới định kỳ để bảo vệ tài khoản doanh nghiệp.
2. **Trung tâm Thông báo:** Lưu trữ các thông báo nhắc nhở lịch sự kiện, thông báo duyệt sản phẩm, thông báo kết nối mới.
3. **Bảng tin CLB (News Screen):** Cập nhật tin tức đại hội, quyết định kết nạp hội viên mới, các chương trình caravan xúc tiến thương mại.

![Cài đặt Mật khẩu và Bảo mật Tài khoản](images/evidence/sub_47_app_settings_password_security.png)
*Hình 10.5: Màn hình thiết lập mật khẩu mới và chính sách an toàn thông tin.*

![Trung tâm Thông báo Đẩy trên App](images/evidence/sub_48_app_notifications_screen.png)
*Hình 10.6: Trung tâm tiếp nhận và lưu trữ thông báo hoạt động của hội viên.*

![Bảng tin Tin tức và Hoạt động của Hiệp hội](images/evidence/sub_49_app_news_screen.png)
*Hình 10.7: Bảng tin tổng hợp các tin tức, phóng sự và văn bản chỉ đạo của CLB.*

---

## 11. QUẢN LÝ HỘI PHÍ THƯỜNG NIÊN (KÈM ẢNH CRM LIÊN QUAN)

### 11.1. Tra Cứu & NỘP HỘI PHÍ Trên App
1. Trong mục Thẻ hội viên hoặc menu Cá nhân, chọn **"Hội phí thường niên"**.
2. Kiểm tra ngày hết hạn hội phí và số tiền phí duy trì tư cách hội viên theo quy chế.
3. Quét mã VietQR của Ban Tài chính CLB để chuyển khoản gia hạn.

---

### 11.2. Luồng CRM Đối Soát & Gạch Nợ Hội Phí (Chức năng CRM tương ứng)
1. Ban Kế toán đăng nhập CRM menu **"Quản lý Hội phí & Hội phí"** (`/fees`).
2. Kiểm tra danh sách doanh nghiệp đến kỳ gia hạn và đối chiếu sao kê tài khoản ngân hàng.
3. **Thao tác Gạch nợ (Fee Toggle):**
   - Bật chuyển công tắc trạng thái hội phí sang **"Đã hoàn thành"**.
   - Thời hạn hiệu lực trên Thẻ Hội Viên VIP của hội viên trên App lập tức tự động gia hạn thêm +1 năm tương ứng.

![CRM: Quản lý danh sách ĐÓNG HỘI PHÍ của các doanh nghiệp](images/evidence/sub_50_crm_fees_management.png)
*Hình 11.1: Màn hình CRM Quản lý Hội phí theo dõi tình hình NỘP HỘI PHÍ của các công ty thành viên.*

![CRM: Thao tác Bật/Tắt Gạch nợ Hội phí để gia hạn Thẻ VIP trên App](images/evidence/sub_51_crm_companies_fee_toggle.png)
*Hình 11.2: Công tắc gạch nợ hội phí trên CRM - Tự động đồng bộ gia hạn hiệu lực thẻ trên App di động.*

---
*Tài liệu được biên soạn và chuẩn hóa bởi Ban Công nghệ & Kỹ thuật VIONE - Hiệp hội Doanh nhân CEO 1983.*
