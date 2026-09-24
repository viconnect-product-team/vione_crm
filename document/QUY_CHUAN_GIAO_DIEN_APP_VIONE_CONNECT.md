# QUY CHUẨN THIẾT KẾ GIAO DIỆN (UI/UX) - APP VIONE CONNECT
## HỆ SINH THÁI KẾT NỐI KINH DOANH & GIAO THƯƠNG DOANH NGHIỆP TOÀN DIỆN

> **Phiên bản:** v2.0 - Chuẩn Hóa Theo Chỉ Đạo Thiết Kế  
> **Áp dụng cho:** Phân hệ App ViOne Connect (`vione_app_fe`)  
> **Triết lý chủ đạo:** Đẳng cấp, Tối giản, Tinh gọn, Công nghệ Hiện đại, Tốc độ cao.  
> **NGUYÊN TẮC CỐT LÕI:** "CÀNG ÍT MÀU - ÍT CHỮ CÀNG TỐT - TẬP TRUNG TƯƠNG TÁC DOANH NGHIỆP"

---

## 1. NGUYÊN TẮC THIẾT KẾ CHUNG (CORE CONSTRAINTS)

1. **LOẠI BỎ MÀU CAM BỪA BÃI:**
   - Tuyệt đối cấm sử dụng các nút bấm, khung viền hoặc khối nền màu cam lòe loẹt.
   - Giữ giao diện mang bản sắc công nghệ - tài chính tin cậy (Deep Blue & Clean White).

2. **CHUẨN 2 TONE MÀU NÚT THỐNG NHẤT:**
   - **Primary Action (Nút chính / CTA):** Nền Xanh Đậm `#003B95` (hoặc `#0F52BA`), Chữ trắng (`text-white`), viền không có hoặc viền xanh đồng màu.
   - **Secondary Action (Nút phụ / Tiện ích):** Nền Trắng (`bg-white`), Chữ Đen/Xám đậm (`text-slate-800`), Viền xám mỏng (`border border-slate-200`).
   - **Hover / Selected State:** Nền xanh dịu (`hover:bg-blue-50`), Chữ xanh (`text-[#003B95]`), Viền xanh mỏng (`border-blue-200`).

3. **CẤM CHÈN ICON VÀ NÚT CHỈNH SỬA VÀO ẢNH:**
   - Không đặt icon cây bút hay máy ảnh đè lên Avatar, Logo, hay Cover Photo.
   - Cho phép click trực tiếp vào Avatar hoặc Ảnh bìa để kích hoạt mở trình chọn tệp upload ngay lập tức.
   - Nút chỉnh sửa thông tin đặt riêng biệt, rõ ràng, không lẫn lộn với ảnh.

4. **KÍCH THƯỚC NÚT ĐỒNG NHẤT (UNIFORM BUTTONS):**
   - Các nút trong nhóm điều khiển hoặc danh thiếp phải có kích thước cố định bằng nhau, không nút dài nút ngắn lệch lạc.
   - Sử dụng CSS Grid (`grid-cols-2`, `grid-cols-3`) với chiều cao cố định (`h-10` / `h-11`).

---

## 2. BẢNG MÀU HỆ THỐNG VIONE (PALETTE SPECIFICATIONS)

| Nhãn Màu | Mã HEX | Tailwind Class | Ứng Dụng Thực Tế |
| :--- | :--- | :--- | :--- |
| **ViOne Navy Blue** | `#003B95` | `bg-[#003B95]`, `text-[#003B95]` | Nút Quét QR, Nút Xác nhận chính, Tiêu đề thương hiệu |
| **Pure White** | `#FFFFFF` | `bg-white` | Nền màn hình, nền card, nền nút tiện ích |
| **Surface Gray** | `#F8FAFC` | `bg-slate-50` | Nền các khối phụ, nền thanh tìm kiếm |
| **Border Soft** | `#E2E8F0` | `border-slate-200` | Đường viền các nút trắng, viền phân cách card |
| **Text Primary** | `#0F172A` | `text-slate-900` | Tên doanh nghiệp, tên CEO, tiêu đề module |
| **Text Secondary** | `#475569` | `text-slate-600` | Mô tả sản phẩm, thông tin địa chỉ |
| **Blue Hover** | `#EFF6FF` | `hover:bg-blue-50` | Hiệu ứng rê chuột, mục đang chọn |

---

## 3. QUY CHUẨN THÀNH PHẦN (COMPONENT STANDARDS)

### 3.1. Header & Nhận Diện ViOne
- Logo chuẩn ViOne Connect đặt trang nhã ở góc trái.
- Không thêm các câu slogan dài dòng hoặc text phụ làm rối thanh điều hướng.
- Bên phải là nút thông báo với badge số thực tế và công cụ tìm kiếm nhanh.

### 3.2. Danh Thiếp Số ViOne (Digital Business Card)
- **Mặt thẻ danh thiếp:**
  - Tên doanh nghiệp hiển thị to, rõ nét, font chữ đậm để dễ nhận diện trong giao tiếp B2B.
  - Logo và mã QR nhúng chìm vào nền thẻ, không đóng khung viền nổi cộm.
  - Bỏ trường email và chức vụ hiển thị trực tiếp trên mặt trước thẻ nhằm giữ độ thoáng tối đa.
- **Dưới thẻ danh thiếp:**
  - Bỏ trường số điện thoại liên hệ thừa thãi.
  - Nút Quét QR và Nút Chụp danh thiếp nằm song song hàng trên (2 cột cân đối).
  - Các nút Sao chép link, Chia sẻ, Chỉnh sửa nằm hàng dưới (3 cột bằng nhau, nền trắng chữ đen).

### 3.3. Marketplace & Cơ Hội Giao Thương
- Hiển thị giá trị giao dịch rõ ràng, định dạng tiền tệ VNĐ chuẩn (`150.000.000 đ`).
- Thẻ sản phẩm tối giản: Ảnh sản phẩm, Tên sản phẩm, Giá bán, Nút liên hệ trực tiếp.
- Bỏ các hiệu ứng nhấp nháy, sticker màu mè không phục vụ trải nghiệm người dùng.

### 3.4. Trải Nghiệm Tải Ảnh & Logo
- Upload hoàn tất phải hiển thị ngay lập tức (zero delay preview bằng data URL).
- Logo doanh nghiệp trên banner có bóng đổ tự nhiên (`drop-shadow`) để phân tách rõ ràng với ảnh nền.
