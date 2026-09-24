# QUY CHUẨN THIẾT KẾ GIAO DIỆN (UI/UX) - WEB CRM VIONE
## HỆ THỐNG QUẢN TRỊ KINH DOANH, ĐỐI TÁC & MARKETPLACE DOANH NGHIỆP VIONE

> **Phiên bản:** v2.0 - Chuẩn Hóa Theo Chỉ Đạo Thiết Kế  
> **Áp dụng cho:** Phân hệ Web CRM ViOne (`vione_crm_fe`)  
> **Triết lý chủ đạo:** Chuẩn mực B2B, Công nghệ Hiện đại, Tinh gọn, Minh bạch, Năng suất.  
> **NGUYÊN TẮC CỐT LÕI:** "CÀNG ÍT MÀU - ÍT CHỮ CÀNG TỐT - CHUẨN HÓA DỮ LIỆU ĐỒNG NHẤT"

---

## 1. NGUYÊN TẮC BẮT BUỘC TOÀN HỆ THỐNG (STRICT STANDARDS)

1. **LOẠI BỎ TRIỆT ĐỂ MÀU CAM:**
   - Không sử dụng màu cam làm nền nút, màu chữ nổi hay viền component trên toàn bộ phân hệ CRM ViOne.
   - Thống nhất bảng màu sắc chuẩn công nghệ doanh nghiệp: Xanh Navy (`#003B95`), Nền Trắng (`#FFFFFF`), Viền xám mảnh (`#E2E8F0`).

2. **QUY TẮC NÚT BẤM (BUTTON DESIGN SYSTEM):**
   - **Nút Hành Động Trọng Yếu (Primary Action):** Nền Xanh Navy `#003B95`, Chữ Trắng (`text-white`). Dùng cho: Tạo đơn hàng, Đăng sản phẩm, Ký hợp đồng, Duyệt đối tác.
   - **Nút Tiện Ích & Điều Hướng (Secondary Action):** Nền Trắng (`bg-white`), Chữ Đen/Xám đậm (`text-slate-800`), Viền xám mỏng (`border border-slate-200`). Dùng cho: Lọc dữ liệu, Xuất Excel, Xem chi tiết, Đóng/Hủy.
   - **Trạng thái Đang Chọn / Hover:** Nền xanh nhẹ (`hover:bg-blue-50`), Chữ xanh (`text-[#003B95]`), Viền xanh (`border-blue-200`).

3. **CẤM CHÈN ICON VÀ NÚT CHỈNH SỬA BỪA BÃI:**
   - Không gắn icon bút vẽ, badge đè lên logo doanh nghiệp đối tác hoặc avatar của người dùng.
   - Click trực tiếp vào ảnh đại diện hoặc logo để thực hiện tải ảnh mới.
   - Các hành động biên tập dữ liệu phải thông qua các nút thao tác chuẩn ở thanh công cụ hoặc bảng danh sách.

4. **KÍCH THƯỚC NÚT VÀ CỤM ĐIỀU KHIỂN CỐ ĐỊNH:**
   - Tất cả các nút bấm, ô tìm kiếm và ô chọn bộ lọc (Select/Dropdown) trên cùng thanh điều hướng phải có chiều cao bằng nhau (`h-9` hoặc `h-10`).
   - Căn chỉnh thẳng hàng, không để nút to nút nhỏ gây mất cân đối thị giác.

---

## 2. BẢNG MÀU CHUẨN HỆ THỐNG CRM VIONE

| Tên Màu | Mã HEX | Tailwind Class | Vai Trò Thiết Kế |
| :--- | :--- | :--- | :--- |
| **ViOne Executive Blue** | `#003B95` | `bg-[#003B95]`, `text-[#003B95]` | Màu chủ đạo, nút hành động chính, active menu |
| **Pure White** | `#FFFFFF` | `bg-white` | Nền trang tổng quan, nền thẻ danh sách |
| **Light Slate** | `#F8FAFC` | `bg-slate-50` | Nền các thanh tìm kiếm, bộ lọc nâng cao |
| **Border Slate** | `#E2E8F0` | `border-slate-200` | Đường kẻ phân tách cột, viền nút trắng |
| **Dark Heading** | `#0F172A` | `text-slate-900` | Tiêu đề báo cáo, doanh thu, tên đối tác |
| **Muted Text** | `#64748B` | `text-slate-500` | Mã số thuế, ngày tạo, ghi chú phụ |
| **Hover Blue Tint** | `#EFF6FF` | `hover:bg-blue-50` | Hiệu ứng rê chuột trên các dòng dữ liệu |

---

## 3. QUY TRÌNH PHÂN QUYỀN & QUẢN TRỊ NGHIỆP VỤ

### 3.1. Phân Quyền Vai Trò (Roles & Permissions)
- **SuperAdmin / Admin Hệ Thống:** Toàn quyền cấu hình chiết khấu, quản trị tài khoản doanh nghiệp, xem toàn bộ báo cáo doanh thu và giao dịch sàn B2B.
- **Admin Doanh Nghiệp (Enterprise Manager):** Quản trị danh mục sản phẩm, nhân viên kinh doanh, đơn hàng nội bộ của doanh nghiệp mình.
- **Chuyên viên B2B / Sales:** Xem và chăm sóc khách hàng được phân công, tạo báo giá, theo dõi trạng thái cơ hội giao thương.

### 3.2. Quản Trị Marketplace & Báo Giá
- Không thêm các thông tin khuyến mãi nhấp nháy, sticker màu mè.
- Mọi giao dịch, hợp đồng và hóa đơn đều hiển thị tiền tệ VNĐ rõ ràng, có phân cách phần nghìn (`100.000.000 đ`).
