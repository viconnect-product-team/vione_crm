# QUY CHUẨN THIẾT KẾ GIAO DIỆN (UI/UX) - APP HIỆP HỘI CEO 1983
## HỆ THỐNG ỨNG DỤNG DI ĐỘNG DÀNH RIÊNG CHO HỘI VIÊN CLB DOANH NHÂN CEO 1983

> **Phiên bản:** v2.0 - Chuẩn Hóa Theo Chỉ Đạo Thiết Kế  
> **Áp dụng cho:** Phân hệ App Hiệp hội Doanh nhân CEO 1983 (`/association/*`)  
> **Triết lý chủ đạo:** Đẳng cấp Doanh nhân, Tối giản, Tinh tế, Sang trọng, Hiện đại.  
> **NGUYÊN TẮC CỐT LÕI:** "CÀNG ÍT MÀU - ÍT CHỮ CÀNG TỐT - TẬP TRUNG TRẢI NGHIỆM VÀ HIỆU QUẢ"

---

## 1. NGUYÊN TẮC BẤT DI BẤT DỊCH (STRICT RULES - ZERO EXCEPTION)

1. **TUYỆT ĐỐI CẤM MÀU CAM:**
   - Cấm dùng màu cam (`#EA580C`, `#F97316`, `#D97706`, `amber`, `orange`) làm màu nút, viền nút, hoặc nền thẻ chính.
   - Không phối màu lòe loẹt, chắp vá làm mất vẻ sang trọng của ứng dụng doanh nhân cấp cao.

2. **QUY CHUẨN 2 TONE MÀU NÚT DUY NHẤT:**
   - **Loại 1 (Nút Hành Động Chính / Primary CTA):** Nền Xanh Navy `#003B95` (hoặc `#00224F`), Chữ Trắng (`text-white`), đổ bóng nhẹ trang nhã (`shadow-sm shadow-[#003B95]/20`).
   - **Loại 2 (Nút Tiện Ích / Secondary / Action chuẩn):** Nền Trắng (`bg-white`), Chữ Đen/Xám đậm (`text-slate-800`), Viền xám mỏng tinh tế (`border border-slate-200 hover:border-slate-300`).
   - **Trạng thái Đang Chọn / Hover:** Nền xanh dương rất nhạt (`hover:bg-blue-50/80`), Chữ xanh đậm (`text-[#003B95]`), Viền xanh nhẹ (`border-blue-200`).

3. **CẤM TỰ Ý CHÈN ICON VÀ BADGE RÁC:**
   - Không tự ý thêm icon camera, cây bút, icon chỉnh sửa hoặc badge đè lên Avatar, Logo công ty, hay Ảnh bìa.
   - Tương tác thông minh: Người dùng click trực tiếp vào Ảnh đại diện hoặc Ảnh bìa để mở trình chọn file upload. Chỉ mở popup chỉnh sửa khi bấm đúng nút "Chỉnh sửa".

4. **KÍCH THƯỚC NÚT ĐỒNG BỘ:**
   - Các nút trong cùng một hàng/khối tiện ích phải có kích thước cố định, chiều cao bằng nhau (`h-10` hoặc `h-11`), chia theo lưới đối xứng (`grid-cols-2`, `grid-cols-3`).

---

## 2. BẢNG MÃ MÀU THƯƠNG HIỆU CHUẨN (DESIGN PALETTE)

| Mã Màu | Mã HEX | Tailwind Class | Quy Cách Áp Dụng |
| :--- | :--- | :--- | :--- |
| **Deep Executive Navy** | `#003B95` | `bg-[#003B95]`, `text-[#003B95]` | Màu thương hiệu chủ đạo, Nút Quét QR, Nút Lưu chính |
| **Midnight Navy** | `#00224F` | `bg-[#00224F]` | Nền header, gradient thẻ VIP doanh nhân |
| **Pure White** | `#FFFFFF` | `bg-white` | Nền nút thứ cấp, nền thẻ card, nền popup |
| **Slate Dark (Text)** | `#0F172A` | `text-slate-900` | Tiêu đề chính, tên hội viên, tên công ty |
| **Slate Body (Text)** | `#334155` | `text-slate-700` | Văn bản hiển thị, nhãn dữ liệu |
| **Slate Muted** | `#64748B` | `text-slate-500` | Chú thích phụ, trạng thái ngày giờ |
| **Slate Border** | `#E2E8F0` | `border-slate-200` | Đường kẻ và viền nút nhẹ nhàng |
| **Soft Blue Hover** | `#EFF6FF` | `hover:bg-blue-50` | Trạng thái di chuột, tab đang kích hoạt |

---

## 3. QUY CHUẨN CÁC THÀNH PHẦN GIAO DIỆN (COMPONENTS)

### 3.1. Header Ứng Dụng (Top Navigation Bar)
- **Logo:** Sử dụng logo chuẩn CEO 1983 (`/ceo1983-logo.png`), chiều cao chuẩn `36px - 40px`.
- **Cấm hoàn toàn:** Không hiển thị bất kỳ dòng chữ "Official App", "App Hiệp Hội", hay text mô tả thừa thãi bên cạnh hoặc phía dưới logo. Logo đặt sạch sẽ, rõ nét.
- **Tiện ích bên phải:** Nút chuông thông báo (kèm số lượng unread thật) và Nút chuyển đổi Dark/Light mode tối giản.

### 3.2. Thẻ Hội Viên Trang Chủ (Member Executive Card)
- **Ảnh Bìa (Cover):** Click trực tiếp vào ảnh bìa để đổi ảnh bìa. Không thêm bất kỳ icon chỉnh sửa nào lên ảnh.
- **Ảnh Đại Diện (Avatar):** Click trực tiếp vào avatar để đổi ảnh đại diện. Không chèn icon hay badge chỉnh sửa lên avatar.
- **Logo Doanh Nghiệp Trên Ảnh Bìa:** Đặt góc trên/dưới có bóng đổ mờ (`drop-shadow-md`) để logo luôn nổi bật và sắc nét trên mọi loại ảnh bìa sáng/tối.
- **Nút "Chỉnh sửa":**
  - Đặt nằm ở footer thẻ hội viên.
  - Định dạng: Nền trắng, chữ đen `text-slate-800`, viền `border-slate-200`, bo góc tròn thanh lịch (`rounded-xl`).
  - Tuyệt đối không dùng nền cam, không dùng viền cam.

### 3.3. Màn Hình Danh Thiếp Điện Tử (`/association/card`)
1. **Thiết Kế Mặt Thẻ:**
   - **Tên công ty:** Làm chữ to, đậm, rõ ràng (`text-sm sm:text-base font-black text-slate-800`), khẳng định uy tín doanh nghiệp.
   - **Logo & Mã QR:** Đặt chìm tự nhiên xuống nền thẻ, không có border dày viền trắng hay background thô bao quanh.
   - **Tối giản thông tin trên mặt thẻ:** Bỏ trường Email và Chức vụ khỏi mặt thẻ chính để thẻ thoáng, chuẩn nhận diện cao cấp.
2. **Khu Vực Phía Dưới Thẻ:**
   - Bỏ trường số điện thoại/hotline liên hệ thừa thãi.
   - **Hàng 1 (Hành Động Đặc Biệt - 2 Cột Cân Bằng):**
     - `[Quét QR]` (Nền Navy `#003B95`, chữ trắng) đặt cạnh `[Chụp danh thiếp]` (Thiết kế thanh lịch, viền chuẩn, chữ đen).
   - **Hàng 2 (Tiện Ích - 3 Cột Cố Định Bằng Nhau):**
     - `[Chỉnh sửa hồ sơ]`, `[Chia sẻ]`, `[Sao chép link]` có kích thước bằng nhau, đồng bộ 100% chuẩn: Nền trắng, chữ đen, viền xám nhẹ (`bg-white text-slate-800 border-slate-200`).
3. **Popup Cài Đặt Riêng Tư (Privacy Settings Modal):**
   - Toggle Switch: Trạng thái tắt phải là màu xám trung tính (`bg-slate-300`), nút gạt trắng (`bg-white`). Tuyệt đối không để switch bị tàng hình màu trắng trên nền trắng. Không có viền đen thô xung quanh nút switch.

### 3.4. Cụm Tính Năng Nhanh Trang Chủ (Quick Action Bar)
- **Bỏ:** Tính năng "Thẻ hội viên" (đã có thẻ to ngay trang chủ).
- **Thêm:** Tính năng "Lịch sử" (`/association/history`, icon đồng hồ lịch sử `History`).
- **Liên hệ nhanh:** Mở danh bạ kết nối hỗ trợ 8 Ban chuyên môn:
  1. Ban Thường Trực & Ban Quản Trị
  2. Ban Thư Ký & Vận Hành
  3. Ban Thành Viên & Thẩm Định
  4. Ban Tài Chính & Ngân Sách
  5. Ban Truyền Thông & Sự Kiện
  6. Ban Xúc Tiến Thương Mại B2B & Đầu Tư
  7. Ban Kiểm Soát & Pháp Chế
  8. Ban Đào Tạo & Chuyển Đổi Số

---

## 4. QUY CHUẨN PHÂN QUYỀN TRUY CẬP (RBAC & ACCESS CONTROL)

| Vai Trò | Quét QR Sự Kiện | Quản Trị Hội Viên | Tài Chính / Ngân Sách | Cuộc Họp BQT | Xúc Tiến B2B |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Admin & Ban Quản Trị** | **TOÀN QUYỀN** | **TOÀN QUYỀN** | **TOÀN QUYỀN** | **TOÀN QUYỀN** | **TOÀN QUYỀN** |
| **Ban Truyền Thông** | Được phân quyền | Xem danh bạ | Ẩn | Chỉ cuộc họp mở | Đăng tin & duyệt bài |
| **Ban Thành Viên** | Ẩn | Thẩm định & Gia hạn | Ẩn | Chỉ cuộc họp mở | Sử dụng |
| **Ban Tài Chính** | Ẩn | Xem hội phí | Toàn quyền xem quỹ | Chỉ cuộc họp mở | Sử dụng |
| **Hội Viên Thường** | Chỉ khi được chỉ định | Xem danh bạ mở | Ẩn | Ẩn | Trao cơ hội & Mua sắm |

> **Lưu ý kỹ thuật:** Tài khoản có email thuộc ban quản trị hoặc role `admin` / `superadmin` / `board_of_directors` mặc định luôn có toàn quyền hiển thị nút Quét QR và các chức năng giám sát sự kiện và tất cả chức năng của app ceo1983

## 5. QUY CHUẨN CHIA SẺ CƠ HỘI 
**Không làm background màu xanh đen tối:** 
**Hạn chế dùng nhiều chữ:**
	

## 6. QUY CHUẨN MARKETPLACE
**Không làm background quảng cáo màu xanh đen tối:** 

## 7. QUY CHUẨN SỰ KIỆN
**Bỏ border viền cam ở slide sự kiện:**
## 8. Quy chuẩn màu theme sáng
** Bất kỳ popup nào cũng không để nền xanh chữ đen khi theme sáng:**

