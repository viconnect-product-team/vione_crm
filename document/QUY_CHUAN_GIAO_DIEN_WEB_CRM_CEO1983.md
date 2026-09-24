# QUY CHUẨN THIẾT KẾ GIAO DIỆN (UI/UX) - WEB CRM CEO 1983
## HỆ THỐNG QUẢN TRỊ ĐIỀU HÀNH & HỘI VIÊN DÀNH CHO BAN QUẢN TRỊ CLB DOANH NHÂN CEO 1983

> **Phiên bản:** v2.0 - Chuẩn Hóa Theo Chỉ Đạo Thiết Kế  
> **Áp dụng cho:** Phân hệ Web CRM Quản trị CLB CEO 1983 (`ceo1983_crm_fe`)  
> **Triết lý chủ đạo:** Nghiêm túc, Minh bạch, Chuẩn xác, Tối giản, Không rườm rà.  
> **NGUYÊN TẮC CỐT LÕI:** "CÀNG ÍT MÀU - ÍT CHỮ CÀNG TỐT - TỐI ƯU HÓA QUẢN TRỊ B2B"

---

## 1. NGUYÊN TẮC THIẾT KẾ BẮT BUỘC (CRITICAL MANDATES)

1. **TUYỆT ĐỐI KHÔNG DÙNG NÚT HAY VIỀN MÀU CAM:**
   - Tất cả các nút bấm trên giao diện CRM chỉ được sử dụng 2 dạng:
     - **Dạng 1 (Nút thao tác chính - Primary CTA):** Nền Xanh Navy `#003B95`, Chữ Trắng (`text-white`), hover đậm hơn (`hover:bg-[#002B70]`). Dùng cho: Duyệt hồ sơ, Xuất báo cáo, Lưu cấu hình, Tạo sự kiện.
     - **Dạng 2 (Nút phụ / Nút lọc / Xuất file / Hủy):** Nền Trắng (`bg-white`), Chữ Đen/Xám đậm (`text-slate-800`), Viền xám mỏng (`border border-slate-200`).
   - **Trạng thái Hover/Active:** Nền xanh nhẹ (`hover:bg-blue-50`), Chữ xanh (`text-[#003B95]`), Viền xanh (`border-blue-200`).

2. **ĐỒNG BỘ KÍCH THƯỚC NÚT VÀ CỤM ĐIỀU KHIỂN:**
   - Chiều cao các nút bấm, ô tìm kiếm và ô chọn bộ lọc (Select/Dropdown) phải bằng nhau tuyệt đối (`h-9` hoặc `h-10`).
   - Khoảng cách giữa các phần tử đều đặn (`gap-2` hoặc `gap-3`), bố trí cân đối theo chuẩn Desktop Dashboard.

3. **GIAO DIỆN TỐI GIẢN (MINIMALISTIC DATA TABLES):**
   - Bảng dữ liệu nền trắng phẳng, đường kẻ mỏng `border-slate-100`, dòng chẵn lẻ dịu mắt.
   - Không chèn các icon trang trí vô nghĩa vào avatar hội viên, tiêu đề cột hay các ô dữ liệu.
   - Text ngắn gọn, xúc tích, đúng thuật ngữ nghiệp vụ.

---

## 2. QUY CHUẨN ĐẶC THÙ NGHIỆP VỤ & PHÂN QUYỀN (BUSINESS RULES & RBAC)

### 2.1. Tiếp Nhận Đăng Ký & Duyệt Hội Viên
- **Bỏ trường Doanh thu:** Không yêu cầu hiển thị hay bắt buộc trường doanh thu trên form đăng ký ngoài landing page web.
- **Quy trình gửi Email tài khoản:**
  - Tuyệt đối KHÔNG tự động gửi email thông tin tài khoản ngay khi người dùng điền form.
  - CHỈ KHI Admin hoặc người thuộc Ban Quản Trị bấm nút **"Duyệt Hồ Sơ"** trong CRM thì hệ thống mới kích hoạt gửi email thông báo chào mừng kèm thông tin đăng nhập và mật khẩu khởi tạo.

### 2.2. Phân Quyền Quét QR Sự Kiện
- Không mở tính năng Quét QR check-in cho tất cả mọi người khi có sự kiện.
- **Quyền hạn:**
  - Admin và các thành viên Ban Quản Trị: Luôn có toàn quyền quản trị và quét mã QR.
  - Ban Truyền Thông: Được hệ thống cho phép quét QR check-in sự kiện khi được phân công.
  - Những người khác: Chỉ hiển thị nút quét QR sự kiện khi được Ban Quản Trị chỉ định cụ thể trong danh sách ban tổ chức.

### 2.3. Phân Quyền Gia Hạn Hội Viên
- Chỉ có **Ban Thành Viên** và **Admin** mới có quyền thao tác gia hạn hội viên, cấp lại thẻ và điều chỉnh ngày hết hạn.

### 2.4. Phân Quyền Tài Chính & Báo Cáo Thu Chi
- Chỉ hiển thị phân hệ Quản lý Tài chính đối với:
  - Admin & Ban Quản Trị
  - Thành viên thuộc **Ban Tài Chính**
- Các ban khác và hội viên thông thường hoàn toàn không thấy menu và dữ liệu tài chính.

### 2.5. Phân Quyền Quản Trị Cuộc Họp
- Cuộc họp Ban Quản Trị chỉ hiển thị cho Admin và các thành viên Ban Quản Trị.
- Cuộc họp toàn thể hội viên hiển thị công khai trên lịch sinh hoạt.

---

## 3. BẢNG MÀU CHUẨN HỆ THỐNG WEB CRM

| Tên Màu | Mã HEX | Tailwind Class | Áp Dụng |
| :--- | :--- | :--- | :--- |
| **CRM Navy Brand** | `#003B95` | `bg-[#003B95]`, `text-[#003B95]` | Thanh Sidebar, Nút Duyệt, Nút Thêm Mới |
| **Clean White** | `#FFFFFF` | `bg-white` | Nền trang, nền bảng, nền nút phụ |
| **Table Header Gray** | `#F8FAFC` | `bg-slate-50` | Nền hàng tiêu đề bảng danh sách |
| **Border Divider** | `#E2E8F0` | `border-slate-200` | Viền ô nhập liệu, viền phân tách các thẻ thống kê |
| **Dark Text** | `#0F172A` | `text-slate-900` | Số liệu thống kê, tên hội viên |
| **Muted Text** | `#64748B` | `text-slate-500` | Ngày tham gia, mã định danh, mô tả |
| **Subtle Hover** | `#EFF6FF` | `hover:bg-blue-50` | Highlight dòng bảng khi rê chuột, nút active |
