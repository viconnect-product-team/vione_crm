# HƯỚNG DẪN SỬ DỤNG CHI TIẾT HỆ THỐNG WEB CRM QUẢN TRỊ HIỆP HỘI CLB CEO 1983
**Phân hệ:** Web CRM Admin Portal — **Đơn vị vận hành:** Ban Quản Trị & Ban Thư Ký CLB Doanh Nhân CEO 1983  
**Nền tảng công nghệ:** VIONE Ecosystem Pro — **Phiên bản:** v2.6.0 Pro  
**Ngày cập nhật:** 18/09/2026 — **Môi trường:** Live Production Staging (`http://14.225.217.232:5000/auth`)  
**Tài liệu kèm ảnh chụp thực tế 100% mọi chức năng đang vận hành trong hệ thống**

---

## 📑 MỤC LỤC CHI TIẾT

1. [DANH MỤC TÀI KHOẢN VẬN HÀNH & PHÂN QUYỀN QUẢN TRỊ (RBAC)](#1-danh-mục-tài-khoản-vận-hành--phân-quyền-quản-trị-rbac)
2. [ĐĂNG NHẬP HỆ THỐNG & GIAO DIỆN CHUẨN XANH - TRẮNG SANG TRỌNG](#2-đăng-nhập-hệ-thống--giao-diện-chuẩn-xanh---trắng-sang-trọng)
3. [BẢNG ĐIỀU KHIỂN TỔNG QUAN (DASHBOARD) & THEO DÕI CHỈ SỐ KPI](#3-bảng-điều-khiển-tổng-quan-dashboard--theo-dõi-chỉ-số-kpi)
4. [QUẢN TRỊ DANH BẠ HỘI VIÊN & HỒ SƠ DOANH NGHIỆP 360°](#4-quản-trị-danh-bạ-hội-viên--hồ-sơ-doanh-nghiệp-360)
   - 4.1. Tiếp nhận hồ sơ đăng ký mới từ Landing Page & App
   - 4.2. Xem Drawer chi tiết hồ sơ hội viên
   - 4.3. Thao tác Phê duyệt (Approve) & Từ chối (Reject)
   - 4.4. Phân bổ Ban chuyên môn, Gán vai trò & Phân quyền
   - 4.5. Khóa, Mở khóa tài khoản & Xuất dữ liệu Excel
5. [QUẢN TRỊ SỰ KIỆN, SƠ ĐỒ KHÁN PHÒNG & QUÉT MÃ QR CHECK-IN CỔNG](#5-quản-trị-sự-kiện-sơ-đồ-khán-phòng--quét-mã-qr-check-in-cổng)
   - 5.1. Danh sách sự kiện & Bộ lọc trạng thái
   - 5.2. Tạo Mới Sự Kiện (Banner, Lịch trình, Diễn giả, Cấu hình vé VietQR)
   - 5.3. Cấu hình Sơ đồ Khán phòng (Cinema Seating Map)
   - 5.4. Quản lý Danh sách Đăng ký & Quét mã QR Điểm danh tốc độ cao
6. [QUẢN TRỊ SÀN GIAO THƯƠNG MARKETPLACE (KIỂM DUYỆT & ĐỒNG BỘ APP)](#6-quản-trị-sàn-giao-thương-marketplace-kiểm-duyệt--đồng-bộ-app)
   - 6.1. Kiểm duyệt sản phẩm đăng tải từ App hội viên
   - 6.2. Ẩn / Khóa / Mở sản phẩm & Gắn nhãn sản phẩm tiêu biểu
7. [QUẢN TRỊ CƠ HỘI KẾT NỐI GIAO THƯƠNG B2B (BUSINESS MATCHING SYNC)](#7-quản-trị-cơ-hội-kết-nối-giao-thương-b2b-business-matching-sync)
   - 7.1. Giám sát các luồng nhu cầu Cần Mua - Cần Bán
   - 7.2. Theo dõi các thương vụ Claim thành công & Thống kê giá trị giao dịch
8. [QUẢN LÝ HOẠT ĐỘNG SỰ KIỆN: BÌNH CHỌN TRỰC TIẾP & BỐC THĂM MAY MẮN](#8-quản-lý-hoạt-động-sự-kiện-bình-chọn-trực-tiếp--bốc-thăm-may-mắn)
   - 8.1. Thiết lập phiên biểu quyết Live Voting thời gian thực
   - 8.2. Cấu hình vòng quay may mắn Lucky Draw
9. [QUẢN TRỊ DOANH NGHIỆP THÀNH VIÊN (COMPANIES MANAGEMENT)](#9-quản-trị-doanh-nghiệp-thành-viên-companies-management)
10. [QUẢN LÝ TÀI CHÍNH & HỘI PHÍ THƯỜNG NIÊN & THU CHI (FINANCE & DUES)](#10-quản-lý-tài-chính--hội-phí-thường-niên--thu-chi-finance--dues)
    - 10.1. Theo dõi BẢNG HỘI PHÍ hội viên theo niên độ
    - 10.2. Bật / Tắt Gạch nợ Hội phí (Fee Toggle) sau khi đối soát sao kê
11. [QUẢN LÝ TIN TỨC, NGHỊ QUYẾT & TRUYỀN THÔNG (NEWS & MEDIA)](#11-quản-lý-tin-tức-nghị-quyết--truyền-thông-news--media)
12. [CẤU HÌNH HỆ THỐNG, TÀI KHOẢN VIETQR THỤ HƯỞNG & NHẬT KÝ KIỂM TOÁN](#12-cấu-hình-hệ-thống-tài-khoản-vietqr-thụ-hưởng--nhật-ký-kiểm-toán)

---

## 1. DANH MỤC TÀI KHOẢN VẬN HÀNH & PHÂN QUYỀN QUẢN TRỊ (RBAC)

Hệ thống Web CRM Quản trị áp dụng mô hình phân quyền chặt chẽ Role-Based Access Control:

| STT | Vai Trò Quản Trị | Tài Khoản Email | Mật Khẩu | Quyền Hạn Nghiệp Vụ |
|:---:|---|---|:---:|---|
| 1 | **Quản Trị Viên Cấp Cao (Super Admin)** | `admin@connect.vn` | `123456` | Toàn quyền kiểm soát hệ thống: Cấu hình hệ thống, duyệt hội viên, tài chính, kiểm toán logs |
| 2 | **Tổng Thư Ký CLB (Executive Admin)** | `ceo.tongthuky@ceo1983.com` | `123456` | Điều phối hoạt động, thẩm định hồ sơ hội viên mới, xuất bản tin tức, tạo sự kiện |
| 3 | **Trưởng Ban Sự Kiện (Event Manager)** | `events@ceo1983.com` | `123456` | Tạo và quản lý sự kiện, cấu hình khán phòng, quét mã QR check-in, vận hành Voting & Lucky Draw |
| 4 | **Trưởng Ban Tài Chính (Finance Manager)** | `finance@ceo1983.com` | `123456` | QUẢN LÝ HỘI PHÍ, đối soát sao kê ngân hàng VietQR, gạch nợ hội phí, báo cáo thu chi |

![CRM: Phân quyền vai trò và phân bổ ban ngành](images/evidence/02_crm_members_roles_permission.png)
*Hình 1.1: Giao diện quản lý vai trò và phân quyền hạn người dùng trên hệ thống CRM.*

---

## 2. ĐĂNG NHẬP HỆ THỐNG & GIAO DIỆN CHUẨN XANH - TRẮNG SANG TRỌNG

1. Truy cập cổng Web CRM tại địa chỉ: `http://14.225.217.232:5000/auth`.
2. Giao diện Đăng nhập được thiết kế chuẩn **Xanh Navy - Trắng ngà**, loại bỏ hoàn toàn các thương hiệu không liên quan, làm nổi bật nhận diện Hiệp hội Doanh nghiệp & VIONE Platform:
   - Biểu tượng huy hiệu hiệp hội trang trọng.
   - Trường nhập Email quản trị viên.
   - Trường nhập Mật khẩu bảo mật.
   - Nút bấm **"Đăng Nhập Quản Trị"** với hiệu ứng chuyển động mượt mà.
3. Sau khi xác thực thành công, hệ thống điều hướng trực tiếp vào Bảng điều khiển Tổng quan (Dashboard).

![Màn hình Đăng nhập Web CRM Xanh - Trắng sang trọng](images/evidence/01_crm_login_blue_white.png)
*Hình 2.1: Màn hình Đăng nhập CRM quản trị chuẩn nhận diện Xanh - Trắng sang trọng.*

---

## 3. BẢNG ĐIỀU KHIỂN TỔNG QUAN (DASHBOARD) & THEO DÕI CHỈ SỐ KPI

Bảng điều khiển Tổng quan (`/`) cung cấp cho Ban Lãnh đạo CLB cái nhìn toàn cảnh về tình hình vận hành:
- **Thẻ KPI Hội Viên:** Tổng số hội viên chính thức, số lượng hồ sơ mới chờ thẩm định trong tuần, tỷ lệ tăng trưởng thành viên.
- **Thẻ KPI Sự Kiện:** Số sự kiện đang mở đăng ký, tổng số lượng vé đã phát hành, doanh thu vé sự kiện thu qua VietQR.
- **Thẻ KPI Kết Nối Giao Thương (B2B):** Số lượng cơ hội kinh doanh đang mở, số thương vụ đã được kết nối (Claimed), ước tính tổng giá trị giao dịch nội khối.
- **Biểu đồ Tài chính & Hội phí:** Tỷ lệ hội viên đã hoàn thành hội phí năm hiện tại so với cùng kỳ.

![Bảng điều khiển Tổng quan Dashboard KPI CRM](images/evidence/sub_06_crm_dashboard_kpi.png)
*Hình 3.1: Bảng điều khiển CRM Dashboard với các chỉ số KPI thời gian thực về Hội viên, Sự kiện và Giao thương.*

---

## 4. QUẢN TRỊ DANH BẠ HỘI VIÊN & HỒ SƠ DOANH NGHIỆP 360°

### 4.1. Tiếp Nhận Hồ Sơ Đăng Ký Mới Từ Landing Page & App
1. Truy cập menu bên trái: **"Hội viên" ➔ "Danh sách Hội viên"** (`/members`).
2. Bảng danh sách hội viên hiển thị đầy đủ các cột thông tin:
   - Họ và tên, Avatar doanh nhân.
   - Tên công ty pháp nhân, Mã số thuế.
   - Ban chuyên môn sinh hoạt.
   - Ngày nộp hồ sơ đăng ký.
   - Trạng thái: **"Chờ phê duyệt"** (màu vàng), **"Đang hoạt động"** (màu xanh), **"Tạm khóa"** (màu đỏ).

![CRM: Danh sách Quản lý Hội viên](images/evidence/sub_07_crm_members_list.png)
*Hình 4.1: Màn hình CRM Quản lý Danh bạ Hội viên và danh sách hồ sơ mới tiếp nhận.*

---

### 4.2. Xem Drawer Chi Tiết Hồ Sơ Hội Viên 360°
1. Nhấp chuột vào bất kỳ dòng hội viên nào trong danh sách.
2. Drawer thông tin chi tiết trượt ra từ bên phải màn hình:
   - **Hồ sơ cá nhân:** CCCD/Hộ chiếu, ngày sinh, số điện thoại, email.
   - **Hồ sơ pháp nhân:** Giấy phép ĐKKD, vốn điều lệ, lĩnh vực kinh doanh, website.
   - **Tư cách hội viên:** Số thẻ hội viên dự kiến, người giới thiệu gia nhập CLB.

![CRM: Drawer Chi Tiết Hồ Sơ Hội Viên 360 độ](images/evidence/sub_08_crm_member_detail_drawer.png)
*Hình 4.2: Drawer xem chi tiết hồ sơ hội viên phục vụ thẩm định tư cách doanh nghiệp.*

---

### 4.3. Thao Tác Phê Duyệt (Approve) & Từ Chối (Reject)
1. Trong Drawer chi tiết hoặc tại cột thao tác nhanh trên danh sách:
   - Nhấp nút **"Phê duyệt (Approve)"**:
     - Hệ thống hiển thị hộp thoại xác nhận.
     - Sau khi bấm xác nhận: Trạng thái chuyển sang **"Hoạt động (Active)"**.
     - CSDL tự động kích hoạt tài khoản đăng nhập trên Mobile App cho hội viên.
     - Sinh Thẻ Hội Viên VIP Kỹ Thuật Số kèm mã định danh độc bản.
   - Nhấp nút **"Từ chối (Reject)"**:
     - Nhập lý do từ chối (vd: Không đúng đối tượng quy chế, thông tin pháp nhân chưa hợp lệ).
     - Hệ thống lưu vết lý do và thông báo cho doanh nghiệp.

![CRM: Thao tác Bấm nút Phê duyệt (Approve) Hội viên](images/evidence/sub_09_crm_approve_action.png)
*Hình 4.3: Thao tác phê duyệt hội viên chính thức trên Web CRM.*

![CRM: Trạng thái Hội viên đã được Phê duyệt Thành công](images/evidence/sub_09_crm_approve_action.png)
*Hình 4.4: Thông báo xác nhận phê duyệt thành công - Hội viên được cấp quyền truy cập Mobile App ngay lập tức.*

---

### 4.4. Phân Bổ Ban Chuyên Môn & Gán Vai Trò
1. Trong form chỉnh sửa hội viên, chọn tab **"Tổ chức & Ban ngành"**.
2. Chọn Ban chuyên môn trực thuộc: Ban Xúc tiến Thương mại, Ban Sự kiện, Ban Truyền thông, Ban Tài chính - Kiểm tra.
3. Gán chức danh trong hiệp hội: Chủ tịch, Phó chủ tịch, Ủy viên BCH, Trưởng ban, Hội viên chính thức.
4. Nhấn **"Lưu thông tin"**. Chức danh và phù hiệu này lập tức hiển thị trên Thẻ VIP và App điện thoại của hội viên.

---

### 4.5. Khóa, Mở Khóa Tài Khoản & Xuất Dữ Liệu Excel
1. **Khóa / Tạm dừng tài khoản:**
   - Đối với các hội viên vi phạm quy chế hoặc NỢ HỘI PHÍ quá hạn, chọn thao tác **"Khóa tài khoản"**.
   - Hội viên sẽ không thể đăng nhập vào App cho đến khi được mở khóa.
2. **Xuất Danh sách Hội viên ra Excel:**
   - Nhấn nút **"Xuất Excel"** ở góc trên bảng.
   - Hệ thống kết xuất file `.xlsx` chuẩn hóa chứa đầy đủ danh bạ phục vụ in ấn hoặc lưu trữ hành chính.

---

## 5. QUẢN TRỊ SỰ KIỆN, SƠ ĐỒ KHÁN PHÒNG & QUÉT MÃ QR CHECK-IN CỔNG

### 5.1. Danh Sách Sự Kiện & Bộ Lọc Trạng Thái
1. Truy cập menu bên trái: **"Sự kiện" ➔ "Danh sách Sự kiện"** (`/events`).
2. Giao diện hiển thị danh sách các sự kiện lớn nhỏ của hiệp hội:
   - Tên chương trình, Ngày giờ tổ chức, Địa điểm tổ chức.
   - Số lượng đại biểu đăng ký / Tổng sức chứa khán phòng.
   - Trạng thái: Nháp, Đang mở đăng ký, Đang diễn ra, Đã kết thúc.

![CRM: Danh sách Quản lý Sự kiện Hiệp hội](images/evidence/sub_27_crm_events_management.png)
*Hình 5.1: Màn hình CRM Quản lý Sự kiện tổng hợp toàn bộ các chương trình hội thảo và đại hội.*

---

### 5.2. Tạo Mới Sự Kiện (Banner, Lịch Trình, Diễn Giả & Cấu Hình Vé VietQR)
1. Nhấn nút **"+ Tạo Sự Kiện Mới"**.
2. Modal Tạo sự kiện mở ra với các tab thiết lập:
   - **Thông tin chung:** Tiêu đề sự kiện, thời gian bắt đầu, thời gian kết thúc, địa chỉ trung tâm hội nghị.
   - **Hình ảnh truyền thông:** Tải lên Banner sự kiện (chuẩn 1920x1080) và ảnh đại diện.
   - **Lịch trình (Agenda):** Thêm các khung giờ hoạt động (Đón khách, Khai mạc, Tọa đàm, Trao kỷ niệm chương, Tiệc giao lưu).
   - **Diễn giả (Keynote Speakers):** Tải ảnh chân dung, nhập họ tên và chức danh các chuyên gia.
   - **Cấu hình Vé & VietQR:**
     - Tùy chọn Vé Miễn Phí (dành riêng hội viên CLB) hoặc Vé Có Phí (nhập đơn giá vé).
     - Thiết lập số lượng vé tối đa được phép phát hành.
3. Nhấn **"Xuất bản Sự kiện"**: Dữ liệu đồng bộ sang App di động của tất cả hội viên trong vòng 1 giây.

![CRM: Modal Tạo Sự Kiện Mới](images/evidence/03_crm_event_create_modal.png)
*Hình 5.2: Modal tạo sự kiện với đầy đủ cấu hình thời gian, địa điểm, diễn giả và giá vé VietQR.*

---

### 5.3. Cấu Hình Sơ Đồ Khán Phòng (Cinema Seating Map)
1. Trong màn hình quản lý sự kiện, chọn tab **"Sơ đồ Chỗ Ngồi (Seating Map)"**.
2. Công cụ đồ họa trực quan cho phép ban tổ chức:
   - Phân chia các hàng ghế: Hàng A, B (Khu vực VIP - Ban Lãnh đạo), Hàng C, D (Khu vực Khách mời danh dự), Hàng E trở đi (Hội viên tiêu chuẩn).
   - Đặt màu sắc phân biệt từng hạng ghế.
   - Khi hội viên đăng ký trên App, số ghế đã chọn sẽ chuyển sang màu xám để tránh trùng lặp.

![CRM: Cấu hình Sơ đồ Khán phòng Cinema Map](images/evidence/sub_28_crm_seating_cinema_map.png)
*Hình 5.3: Công cụ thiết lập sơ đồ khán phòng và gán vị trí ghế ngồi trực quan.*

---

### 5.4. Quản Lý Danh Sách Đăng Ký & Quét Mã QR Điểm Danh Tốc Độ Cao
1. **Danh sách Đăng ký:** Xem chi tiết từng đại biểu đã nhận vé, thời gian chuyển khoản VietQR và số ghế.
2. **Quét Mã QR Điểm Danh (Check-in):**
   - Ban tổ chức tại cổng đón tiếp mở màn hình **"Điểm danh QR"** trên điện thoại hoặc máy tính bảng kết nối CRM.
   - Hướng camera vào Mã QR trên Vé Điện Tử (Ticket Pass) của đại biểu.
   - Hệ thống phát âm thanh "Bíp" xác nhận thành công, màn hình hiển thị ngay: Tên doanh nhân, Công ty, Số ghế và đổi trạng thái sang **"Đã điểm danh"**.
   - Ngăn chặn hoàn toàn tình trạng vé giả hoặc quét trùng lặp 2 lần.

---

## 6. QUẢN TRỊ SÀN GIAO THƯƠNG MARKETPLACE (KIỂM DUYỆT & ĐỒNG BỘ APP)

### 6.1. Kiểm Duyệt Sản Phẩm Đăng Tải Từ App Hội Viên
1. Truy cập CRM menu **"Sàn Giao thương B2B" ➔ "Sản phẩm"** (`/marketplace`).
2. Danh sách sản phẩm do các doanh nghiệp tự đăng từ App hiển thị chi tiết:
   - Ảnh sản phẩm, Tên mặt hàng, Tên công ty cung ứng.
   - Đơn giá thị trường và Mức giá ưu đãi riêng cho hội viên CEO 1983.
3. Ban Thư ký duyệt nội dung:
   - Kiểm tra tính phù hợp của hình ảnh và quy chuẩn thông tin.
   - Bấm **"Phê duyệt"** để sản phẩm xuất hiện trên trang nhất của chợ App.

![CRM: Kiểm duyệt và Quản trị Sàn giao thương Marketplace](images/evidence/sub_37_crm_marketplace_sync.png)
*Hình 6.1: Giao diện CRM Quản trị Marketplace - Kiểm soát chất lượng sản phẩm hội viên.*

---

### 6.2. Ẩn / Khóa / Mở Sản Phẩm & Gắn Nhãn Tiêu Biểu
- **Gắn nhãn Sản phẩm Nổi bật:** Ghim các sản phẩm tiêu biểu lên đầu danh mục Marketplace trên App.
- **Tạm dừng / Khóa sản phẩm:** Khi sản phẩm hết hàng hoặc nhận phản ánh chất lượng từ các hội viên khác, quản trị viên có thể bấm **"Tạm dừng hiển thị"**.

---

## 7. QUẢN TRỊ CƠ HỘI KẾT NỐI GIAO THƯƠNG B2B (BUSINESS MATCHING SYNC)

### 7.1. Giám Sát Các Luồng Nhu Cầu Cần Mua - Cần Bán
1. Truy cập CRM menu **"Kết nối Kinh doanh"** (`/opportunities`).
2. Theo dõi các bài đăng nhu cầu của doanh nghiệp thành viên:
   - Thống kê các ngành nghề đang có nhu cầu tìm thầu phụ nhiều nhất.
   - Kiểm soát tính xác thực của các bài đăng có ngân sách lớn.

![CRM: Giám sát Cơ hội Kết nối Giao thương B2B](images/evidence/sub_42_crm_opportunities_sync.png)
*Hình 7.1: Màn hình CRM Quản lý Bảng tin Cơ hội Kinh doanh và nhu cầu kết nối.*

---

### 7.2. Theo Dõi Thương Vụ Claim Thành Công & Thống Kê Giao Dịch
- Theo dõi các cơ hội đã được hội viên khác nhấn **"Claim Deal"** để hỗ trợ xúc tiến khi cần.
- Tổng hợp báo cáo giá trị hợp đồng ký kết nội khối định kỳ để báo cáo Đại hội Hiệp hội.

---

## 8. QUẢN LÝ HOẠT ĐỘNG SỰ KIỆN: BÌNH CHỌN TRỰC TIẾP & BỐC THĂM MAY MẮN

### 8.1. Thiết Lập Phiên Biểu Quyết Live Voting Thời Gian Thực
1. Truy cập CRM menu **"Hoạt động Sự kiện" ➔ "Biểu quyết & Bầu cử"** (`/voting`).
2. Nhấn **"+ Tạo Phiên Biểu Quyết"**:
   - Nhập nội dung câu hỏi biểu quyết (vd: *"Thông qua Nghị quyết Phương hướng Hoạt động Nhiệm kỳ 2026-2031"*).
   - Nhập các phương án lựa chọn: Đồng ý / Không đồng ý / Ý kiến khác.
3. Khi MC tuyên bố bắt đầu biểu quyết, quản trị viên bấm **"Kích hoạt Phiên bỏ phiếu"**:
   - App của toàn thể hội viên có mặt tại hội trường tự động mở màn hình bỏ phiếu.
   - Màn hình CRM hiển thị biểu đồ tròn kết quả nhảy số thời gian thực để trình chiếu trực tiếp lên màn hình LED sân khấu.

![CRM: Quản lý Phiên Biểu Quyết Live Voting và Quay số Lucky Draw](images/evidence/crm_12_voting_luckydraw.png)
*Hình 8.1: Màn hình điều phối phiên biểu quyết trực tiếp và vòng quay may mắn trên CRM.*

---

### 8.2. Cấu Hình Vòng Quay May Mắn Lucky Draw
1. Chọn tab **"Lucky Draw (Quay số trúng thưởng)"**.
2. Nhập danh sách các giải thưởng: Giải Đặc biệt, Giải Nhất, Giải Nhì, Giải Khuyến khích.
3. Đồng bộ danh sách mã vé của các đại biểu đã check-in thành công qua cổng.
4. Nhấn **"Bắt đầu quay số"** để hiển thị hiệu ứng quay thưởng kịch tính trên sân khấu.

---

## 9. QUẢN TRỊ DOANH NGHIỆP THÀNH VIÊN (COMPANIES MANAGEMENT)

1. Truy cập CRM menu **"Doanh nghiệp"** (`/companies`).
2. Quản lý toàn bộ hồ sơ pháp nhân của các công ty hội viên trong hiệp hội:
   - Tên công ty đầy đủ theo giấy phép, Tên viết tắt, Tên thương mại.
   - Mã số thuế, Ngày thành lập, Địa chỉ đăng ký kinh doanh.
   - Quy mô nhân sự, Vốn điều lệ, Xếp hạng quy mô (SME / Tập đoàn).
   - Danh sách các hội viên trực thuộc công ty này.

![CRM: Quản lý Doanh nghiệp Thành viên](images/evidence/crm_09_companies_management.png)
*Hình 9.1: Màn hình CRM Quản lý Hồ sơ Pháp nhân các Doanh nghiệp thành viên.*

---

## 10. QUẢN LÝ TÀI CHÍNH & HỘI PHÍ THƯỜNG NIÊN & THU CHI (FINANCE & DUES)

### 10.1. Theo Dõi BẢNG HỘI PHÍ Hội Viên Theo Niên Độ
1. Truy cập CRM menu **"Tài chính & Hội phí" ➔ "QUẢN LÝ HỘI PHÍ"** (`/fees`).
2. Bảng theo dõi hiển thị tình trạng đóng hội phí của từng doanh nghiệp:
   - Kỳ đóng phí: Niên độ 2026 - 2027.
   - Mức phí hội phí quy định (vd: 10.000.000 VNĐ / năm).
   - Ngày đóng gần nhất, Ngày hết hạn hiệu lực thẻ.
   - Trạng thái: **"Đã hoàn thành"** (màu xanh), **"Sắp đến hạn"** (màu cam), **"Quá hạn"** (màu đỏ).

![CRM: QUẢN LÝ HỘI PHÍ THƯỜNG NIÊN](images/evidence/sub_50_crm_fees_management.png)
*Hình 10.1: Bảng theo dõi tình hình ĐÓNG HỘI PHÍ và thực hiện nghĩa vụ hội phí của các doanh nghiệp.*

---

### 10.2. Bật / Tắt Gạch Nợ Hội Phí (Fee Toggle) Sau Khi Đối Soát Sao Kê
1. Khi doanh nghiệp chuyển khoản hội phí qua VietQR hoặc tài khoản ngân hàng của CLB:
   - Ban Kế toán kiểm tra sao kê ngân hàng khớp số tiền và cú pháp.
2. Tìm đến dòng của doanh nghiệp trên bảng `/fees`.
3. **Thao tác Gạch nợ (Fee Toggle):**
   - Bật chuyển công tắc gạch nợ sang trạng thái **"BẬT (Đã nộp)"**.
   - Hệ thống tự động ghi nhận biên lai thu phí vào sổ quỹ kế toán.
   - **Đồng bộ tức thì sang App:** Thời hạn trên Thẻ Hội Viên VIP của doanh nhân được cộng thêm +1 năm hiệu lực.

![CRM: Thao tác Bật/Tắt Gạch nợ Hội phí](images/evidence/sub_51_crm_companies_fee_toggle.png)
*Hình 10.2: Công tắc gạch nợ hội phí trên CRM - Cập nhật tự động quyền lợi và hạn thẻ VIP trên App.*

---

## 11. QUẢN LÝ TIN TỨC, NGHỊ QUYẾT & TRUYỀN THÔNG (NEWS & MEDIA)

1. Truy cập CRM menu **"Truyền thông & Tin tức"** (`/news`).
2. Nhấn nút **"+ Soạn Tin Mới"**:
   - Nhập Tiêu đề bản tin hoạt động hiệp hội.
   - Chọn Chuyên mục: Tin Đại hội, Bản tin Xúc tiến Thương mại, Quyết định Ban Chấp Hành, Tin Doanh nghiệp Hội viên.
   - Tải lên ảnh bìa và các hình ảnh phóng sự chất lượng cao.
   - Soạn thảo nội dung bài viết với trình soạn thảo phong phú (Rich Text Editor).
3. Tùy chọn **"Gửi Thông Báo Đẩy (Push Notification) Tới App"**:
   - Khi tích chọn mục này và nhấn **"Xuất bản"**, toàn bộ điện thoại của hội viên sẽ nhận được thông báo về tin tức mới.

![CRM: Quản lý Tin tức, Bài viết và Truyền thông](images/evidence/crm_13_news_management.png)
*Hình 11.1: Trình quản lý và xuất bản tin tức, nghị quyết hiệp hội đến ứng dụng di động.*

---

## 12. CẤU HÌNH HỆ THỐNG, TÀI KHOẢN VIETQR THỤ HƯỞNG & NHẬT KÝ KIỂM TOÁN

### 12.1. Cấu Hình Tài Khoản VietQR Thụ Hưởng
1. Truy cập CRM menu **"Cài đặt Hệ thống" ➔ "Tài chính & Thanh toán"**.
2. Thiết lập thông tin tài khoản ngân hàng chính thức của CLB Doanh nhân CEO 1983:
   - Tên ngân hàng thụ hưởng (vd: Vietcombank, MB Bank, Techcombank).
   - Số tài khoản ngân hàng.
   - Tên chủ tài khoản: `CLB DOANH NHAN CEO 1983` hoặc đại diện được ủy quyền.
   - Cú pháp quy định thanh toán tự động cho Vé sự kiện và Hội phí.
3. Nhấn **"Lưu cấu hình"**: Toàn bộ mã QR động sinh ra trên App và Web sẽ tự động trỏ về tài khoản này.

---

### 12.2. Quản Lý Danh Sách Quản Trị Viên & Nhật Ký Kiểm Toán (Audit Logs)
1. **Quản lý Tài khoản Quản trị:** Cấp phát tài khoản mới cho cán bộ thư ký, khóa tài khoản nhân sự nghỉ việc.
2. **Nhật ký Kiểm toán (Audit Logs):**
   - Hệ thống tự động ghi lại mọi thao tác quan trọng: Ai duyệt hội viên, ai gạch nợ hội phí, ai tạo sự kiện, vào thời gian nào kèm địa chỉ IP truy cập.
   - Đảm bảo tính minh bạch và an toàn tuyệt đối cho cơ sở dữ liệu hiệp hội.

---
*Tài liệu được biên soạn và chuẩn hóa bởi Ban Công nghệ & Kỹ thuật VIONE - Hiệp hội Doanh nhân CEO 1983.*
