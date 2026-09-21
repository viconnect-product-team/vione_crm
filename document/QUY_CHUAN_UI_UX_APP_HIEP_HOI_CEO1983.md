# BỘ QUY CHUẨN THIẾT KẾ & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX RULES)
## ỨNG DỤNG HIỆP HỘI DOANH NHÂN CEO 1983 (PHƯƠNG ÁN 1: CLASSIC NAVY & GOLD)

> **Trạng thái tài liệu:** Chính thức ban hành & Phê duyệt (Approved)  
> **Phiên bản:** v1.0.0 — Áp dụng toàn diện cho phân hệ `/association/*`  
> **Phong cách nhận diện:** Classic Navy & Warm Amber Gold (Chuẩn Mực Doanh Nhân Lịch Lãm)  
> **Ngày ban hành:** 15/09/2026  

---

## 1. TỔNG QUAN VÀ TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY)

Ứng dụng Hiệp hội Doanh nhân CEO 1983 được định vị là **Cổng kết nối Giao thương Thượng đỉnh & Thẻ số Định danh VIP** dành riêng cho các Doanh nhân, Nhà sáng lập, Lãnh đạo doanh nghiệp sinh năm 1983 (Quý Hợi). 

### 1.1. 3 Giá Trị Cốt Lõi (Core Principles)
1. **Lịch Lãm & Đẳng Cấp Doanh Nhân (Executive Elegance):**
   - Lấy cảm hứng từ bộ nhận diện thương hiệu logo CEO 1983.
   - Sử dụng gam màu **Deep Cobalt Navy (`#003B95`, `#00224F`)** tượng trưng cho sự uy tín, vững chãi, kết hợp với **Warm Amber Gold (`#F59E0B`, `#D97706`)** tượng trưng cho thịnh vượng và tinh hoa thành công.
2. **Giao Thương Thực Chiến (B2B Commerce & Action-Driven):**
   - Đặt các tính năng kết nối B2B (Trao cơ hội, Đăng sản phẩm, Danh bạ hội viên, Thẻ số NFC/QR) ở vị trí trực quan, dễ thao tác với ngón tay cái (Thumb Zone).
3. **Trung Thực Dữ Liệu & Trải Nghiệm Mượt Mà (Data Integrity & Zero Waste Spacing):**
   - **Tuyệt đối không fake dữ liệu:** Không chèn dữ liệu mẫu giả định gây hiểu lầm cho người dùng. Dữ liệu trống phải được hiển thị bằng **Empty State** trang nhã, lịch sự.
   - **Bố cục liền mạch (Zero Gap down to Footer):** Không để khoảng trắng vô nghĩa giữa nội dung và thanh điều hướng chân trang. Các module nối tiếp tạo nhịp điệu thị giác phong phú.

---

## 2. HỆ THỐNG MÀU SẮC THƯƠNG HIỆU (DESIGN TOKENS & PALETTE)

### 2.1. Bảng Màu Chính (Primary Palette)
| Tên Màu | Mã HEX | Tailwind Class | Mục Đích Sử Dụng |
| :--- | :--- | :--- | :--- |
| **Deep Cobalt Navy** | `#003B95` | `bg-[#003B95]`, `text-[#003B95]` | Màu chủ đạo, Header, Nút chính, Huy hiệu |
| **Dark Luxury Navy** | `#00224F` | `bg-[#00224F]` | Nền gradient thẻ VIP, Header mờ |
| **Navy Hover / Active** | `#002B70` | `hover:bg-[#002B70]` | Trạng thái hover/active của các nút chính |
| **Warm Amber Gold** | `#F59E0B` | `text-amber-500`, `bg-amber-500` | Màu nhấn cao cấp, Huy hiệu VIP, Viền nổi bật |
| **Gold Dark / Bronze** | `#B45309` | `text-amber-800`, `text-[#B45309]` | Chữ tiêu đề trên nền sáng, viền badge |
| **Gold Soft Surface** | `#FEF3C7` | `bg-amber-50`, `bg-[#FEF3C7]` | Nền badge VIP, nền icon tính năng nhanh |

### 2.2. Bảng Màu Bổ Trợ & Trạng Thái (Semantic & Accents)
| Tên Màu | Mã HEX | Tailwind Class | Mục Đích Sử Dụng |
| :--- | :--- | :--- | :--- |
| **Emerald Online** | `#10B981` | `bg-emerald-500`, `bg-[#10B981]` | Chấm xanh online, Badge "Đã có vé VIP", "Miễn phí" |
| **Flame Orange** | `#EA580C` | `bg-[#EA580C]`, `text-[#EA580C]` | Badge số lượng mới, Khối Đăng sản phẩm, Hot deal |
| **Sky Verified** | `#0284C7` | `text-[#0284C7]`, `bg-sky-50` | Tích xanh tài khoản doanh nhân Verified |
| **Card Background Light** | `#FFFFFF` | `bg-white` | Nền thẻ nội dung sáng |
| **Card Background Dark** | `#0F172A` | `dark:bg-[#0F172A]` | Nền thẻ nội dung chế độ tối |
| **Border Soft** | `#E2E8F0` | `border-slate-200`, `dark:border-slate-800` | Đường kẻ phân tách nhẹ, viền thẻ |

---

## 3. QUY CHUẨN CÁC MODULE GIAO DIỆN (COMPONENT SPECIFICATIONS)

### 3.1. Cố Định Header Logo & Thông Báo (App Header)
- **Vị trí:** `sticky top-0 z-40`, tính toán tự động khoảng cách Safe Area (`env(safe-area-inset-top)`).
- **Logo:** Đặt Logo chính thức CLB Doanh Nhân CEO 1983 (`/ceo1983-logo.png`) ở bên trái, chiều cao cố định `40px - 44px`.
- **Nút Chuông Thông Báo:** Đặt góc phải, nền `bg-amber-50/70 dark:bg-[#14223E]`, viền `border-amber-500/30`. Badge đỏ/cam hiển thị số thông báo chưa đọc thật từ CRM (`unreadNotifCount`). Nếu bằng `0`, ẩn badge hoàn toàn.

### 3.2. Thẻ Hội Viên VIP Executive (Trang Chủ)
- **Kích thước & Kiểu dáng:** To rộng, bo góc `rounded-2xl`, bóng đổ `shadow-md`, viền `border-slate-200 dark:border-slate-800 hover:border-amber-500/50`.
- **Ảnh bìa (Cover Banner):** Chiều cao `80px - 96px`, nền gradient Navy `#00224F` sang `#003B95` kết hợp hình ảnh skyline doanh nghiệp mờ nhẹ.
- **Badge VIP trên ảnh bìa:** Góc trên bên phải đặt pill `VIP GOLD` nền vàng amber trong suốt với hiệu ứng blur.
- **Avatar dập viền nổi:** Avatar tròn kích thước `h-15 w-15`, đè lên nửa dưới ảnh bìa (`-mt-8`), viền trắng dập nổi `ring-3 ring-white dark:ring-[#0F172A]`, góc dưới có chấm online xanh ngọc `#10B981`.
- **Nút Xem thẻ VIP:** Nằm ngang hàng với avatar ở góc phải, nút bấm `Xem thẻ VIP ›` màu xanh navy liên kết trực tiếp sang `/association/card`.
- **Thông tin Doanh nhân:**
  - *Dòng 1:* Tên Công ty / Pháp nhân (uppercase, font-bold 11px, màu slate-500).
  - *Dòng 2:* Họ và tên Doanh nhân (font-black 16px) kèm icon **BadgeCheck** xanh verified.
  - *Dòng 3:* Chức danh (Chủ tịch HĐQT, Tổng Giám Đốc, Hội viên chính thức...).
  - *Dòng 4:* Mã hội viên dạng `M1983-xxx` kèm nút Copy mã có thông báo toast phản hồi.

### 3.3. Lưới 8 Tính Năng Nhanh (Quick Action Grid)
- **Bố cục:** Lưới 4 cột x 2 hàng, bo góc `rounded-3xl`, viền mềm.
- **Danh sách tính năng chuẩn:**
  1. `Thẻ hội viên` (`/association/card`)
  2. `Danh thiếp số` (`/association/business-cards`) — Badge "Mới"
  3. `Hội viên` (`/association/members`)
  4. `Sự kiện` (`/association/events`) — Badge số đếm sự kiện thực tế
  5. `Tin tức` (`/association/news`) — Badge số đếm tin tức
  6. `Tài liệu` (`/association/library`)
  7. `Liên hệ nhanh` (Mở modal liên hệ trực tiếp BQT & Hotline)
  8. `Ưu đãi hội viên` (`/association/perks`)
- **Hiệu ứng Micro-interaction:** Khi có thông báo mới, icon được bao bọc bởi ánh sáng lấp lánh nhẹ (Golden Snowflakes/Sparkle).

### 3.4. Khối 1: Sự Kiện Sắp Tới (Upcoming Events)
- **Tiêu đề khối:** "Sự kiện sắp tới" (`Upcoming Events`) kèm icon Lịch và Ngôi sao vàng kim `Sparkles`.
- **Poster dọc tỉ lệ 2:3:**
  - **Không hiển thị icon số / nhãn tuổi:** Gỡ bỏ hoàn toàn các nhãn 16+, 18+, 13+ ở góc trên trái.
  - **Tên sự kiện nằm trong ảnh:** Đặt tiêu đề sự kiện nằm trọn vẹn ở đáy ảnh poster với dải gradient đen mờ cao cấp (`from-black/95 via-black/40 to-black/10`), chữ trắng đậm viền nổi tương phản cao.
  - **Mini Countdown Badge:** Hiển thị thời gian đếm ngược trực tiếp trên góc trái ảnh (`⏳ Còn X ngày XX:YY:ZZ`).

### 3.5. Khối 2: Cơ Hội Giao Thương (Trade Opportunities)
- **Tiêu đề khối:** "Cơ hội giao thương" (`Trade Opportunities`) — loại bỏ hoàn toàn chữ B2B.
- **Bố cục:** 2 thẻ giao thương đối xứng ngang (Hợp tác đầu tư & Cung ứng vật tư).

### 3.6. Khối 3: Sản Phẩm Đáng Chú Ý (Notable Products)
- **Tiêu đề khối:** "Sản phẩm đáng chú ý" (`Notable Products`) kèm icon Vương miện hoàng gia `Crown`.
- **Gỡ bỏ nhãn `Ad`, `HOT`:** Thay thế bằng các nhãn chuẩn C-Level: `Đặc quyền CEO` và `Hội viên 1983`.
- **Thông tin sản phẩm:** Tên doanh nghiệp kèm tích xanh xác thực `BadgeCheck`, định dạng giá ưu đãi hội viên trang nhã.

### 3.7. Màn Hình Sự Kiện (`/association/events`) & Banner Royal Navy - Golden Swoosh
- **Gỡ bỏ khối cũ:** Loại bỏ hoàn toàn khối 3D Grand Gala Summit Stage Backdrop cũ.
- **Banner Sự Kiện phong cách Royal Navy & Golden Light Swooshes:**
  - Nền Deep Royal Navy Blue (`#040C20` -> `#091D54` -> `#020714`) kết hợp dải sóng lụa ánh kim Golden Swoosh vector SVG phát quang.
  - **Đồng hồ đếm ngược thời gian thực (Live Countdown Timer):** Hiển thị 4 ô số độc lập `[Ngày] : [Giờ] : [Phút] : [Giây]` viền vàng kim hổ phách bóng mờ, tự động cập nhật mỗi 1000ms.
  - Đồng bộ hiển thị đồng hồ đếm ngược trong cả Modal xem chi tiết sự kiện.

### 3.6. Khối Doanh Nghiệp Mới Gia Nhập
- Hiển thị 2 doanh nghiệp thành viên mới nhất từ API `listMembers`.
- Hiển thị Avatar/Logo công ty, Tên công ty (đậm) và Người đại diện.
- Nút "Xem danh bạ ›" liên kết sang `/association/members`.

### 3.7. Khối Tiện Ích Thẻ Thông Minh (Smart Card Utilities)
- Gồm 3 thẻ tiện ích:
  - 💳 **Chạm NFC:** Mở màn thẻ sẵn sàng truyền danh thiếp số qua giao tiếp chạm NFC.
  - 📱 **Apple / Google Wallet:** Mở màn thẻ kèm chức năng Add to Wallet.
  - 🔗 **QR Check-in:** Mở màn quét mã QR check-in sự kiện nhanh chóng tại sảnh tiếp đón.

### 3.8. Khối Tin Hoạt Động CLB
- Danh sách 2 tin bài mới nhất từ Ban Truyền thông & BQT.
- Nút "Xem tất cả ›" liên kết sang `/association/news`.

---

## 4. QUY CHUẨN THANH ĐIỀU HƯỚNG CHÂN TRANG (BOTTOM NAVIGATION BAR)

Thanh điều hướng chân trang (Bottom Bar) là thành phần then chốt trong điều hướng ứng dụng di động:

```
┌───────────────────────────────────────────────────────────────────────┐
│  [Trang chủ]    [Sự kiện]    ( 🔳 NÚT QR VIP )   [Gắn kết]   [Cá nhân] │
│      🏠            📅             💳               💬          👤    │
└───────────────────────────────────────────────────────────────────────┘
```

1. **Tab 1: Trang chủ (`/association`)**
   - Icon: `Home` (Lucide)
   - Trạng thái Active: Màu Cobalt Navy `#003B95` / Amber trên Dark mode.
2. **Tab 2: Sự kiện (`/association/events`)**
   - Icon: `Calendar` (Lucide)
   - Trạng thái Active: Màu Cobalt Navy `#003B95`. Thay thế hoàn toàn Tab Notifications cũ.
3. **Tab 3: Nút QR Thẻ VIP — Center Elevated Button (`/association/card`)**
   - Nút nổi tròn bo góc mềm ở chính giữa, nhô cao khỏi thanh bar `-mt-7` hoặc `-top-3.5`.
   - **Màu sắc biến thiên chuẩn mực theo từng phiên bản thiết kế:**
     - **Phương án 1 (Classic Navy & Gold):** Nền Gradient Deep Cobalt Navy `#00224F` sang `#003B95`, viền trắng `#FFFFFF`, icon `QrCode` màu trắng `#FFFFFF` sắc nét tinh tế.
     - **Phương án 2 (Digital Sapphire Tech):** Nền Sapphire `#0284C7`, viền Cyan sáng `#38BDF8`, icon `QrCode` màu trắng `#FFFFFF` sắc nét.
     - **Phương án 3 (B2B Commerce Focus):** Nền Cam B2B `#EA580C` hoặc Slate `#0F172A`, viền Cam `#FDBA74`, icon `QrCode` màu trắng / Cam.
   - Thao tác: Chạm mở ngay Thẻ số định danh & QR Code cá nhân phục vụ Check-in sự kiện và Trao đổi danh thiếp số.
4. **Tab 4: Gắn kết (`/association/messages`)**
   - Icon: `MessageSquare` (Lucide)
   - Quản lý tin nhắn hội thoại, trao đổi riêng tư và thông báo kết nối B2B.
5. **Tab 5: Cá nhân (`/association/profile`)**
   - Icon: `User` (Lucide)
   - Mở màn hồ sơ doanh nhân B2B, quản trị tài khoản, đổi theme và cài đặt.

---

## 5. NGUYÊN TẮC XỬ LÝ DỮ LIỆU THẬT & TRẠNG THÁI RỖNG (EMPTY STATE RULES)

> [!IMPORTANT]
> **QUY TẮC BẤT DI BẤT DỊCH:** Tuyệt đối không tự ý bịa đặt dữ liệu giả (fake dummy data) trong mã nguồn ứng dụng hiệp hội!

### 5.1. Quy Chuẩn Hiển Thị Empty State
Khi API backend trả về mảng dữ liệu rỗng (`length === 0`), giao diện BẮT BUỘC phải hiển thị một khối **Empty State** trang nhã theo mẫu sau:
1. **Icon đại diện:** Màu mờ nhạt (`text-slate-300 dark:text-slate-600`), kích thước vừa phải (`28px - 36px`).
2. **Khung bao:** Card bo tròn `rounded-2xl`, viền nét đứt `border border-dashed border-slate-200 dark:border-slate-800`, padding `p-5` hoặc `p-6`.
3. **Thông điệp ngắn gọn:** Font font-semibold 12px, nêu rõ hiện trạng (Ví dụ: *"Hiện chưa có sự kiện mới sắp diễn ra"*, *"Chưa có doanh nghiệp mới tuần này"*).
4. **Gợi ý hành động:** Dòng chữ phụ 11px hướng dẫn người dùng quay lại sau hoặc liên hệ ban tổ chức.

---

## 6. QUY TẮC HIỂN THỊ DARK MODE & CONTRAST

- **Light Mode (Mặc định):**
  - Nền trang: `#F8FAFC` hoặc `#F1F5F9`.
  - Nền thẻ: `#FFFFFF`, viền `#E2E8F0`.
  - Chữ chính: `#0F172A`, chữ phụ: `#64748B`.
- **Dark Mode (Doanh Nhân Thượng Đỉnh):**
  - Nền trang: `#070D1A` hoặc `#0B1329`.
  - Nền thẻ: `#0F172A`, viền `#1E293B`.
  - Chữ chính: `#FFFFFF`, chữ phụ: `#94A3B8`.
- **Contrast Mode:**
  - Nền đen tuyền `#000000`, viền sáng nét cao `#38BDF8` hoặc `#F59E0B`, tối ưu cho người dùng cần độ tương phản mạnh dưới ánh sáng mặt trời ngoài trời.

### 6.1. QUY CHUẨN ĐỘ TƯƠNG PHẢN & MÀU CHỮ TRÊN NỀN (STRICT RULEUI HIỆP HỘI CEO 1983)
> [!CRITICAL]
> **QUY TẮC BẤT KHẢ XÂM PHẠM VỀ NHẬN DIỆN THƯƠNG HIỆU & KHẢ NĂNG TRUY CẬP (A11Y):**
> 1. **NỀN XANH (Navy / Primary `#2E3192`, `#003B95`, `#19194D`, `bg-blue-*`):**
>    - Khi nền màu xanh thì TOÀN BỘ chữ (text), icon, nhãn tab, số đếm (counter badge) BẮT BUỘC là màu TRẮNG (`#FFFFFF` / `text-white font-bold`).
>    - **TUYỆT ĐỐI CẤM** chữ màu đen (`#000000` / `#0F172A`) trên nền xanh!
> 2. **NỀN ĐỎ (Alert / Notification Badges `bg-red-600`, `bg-red-500`, `#DC2626`):**
>    - Khi nền màu đỏ thì TOÀN BỘ chữ và số đếm BẮT BUỘC là màu TRẮNG (`#FFFFFF` / `text-white font-black`).
>    - **TUYỆT ĐỐI CẤM** chữ màu đen trên nền đỏ!
> 3. **MÀN HÌNH QUÉT QR CHECK-IN (`/association/checkin`):**
>    - Tab chuyển đổi active (Quét QR / Chạm NFC) và nút "Bật camera quét QR" BẮT BUỘC dùng nền xanh CEO `#2E3192` hover `#19194D`, chữ và icon màu TRẮNG (`#FFFFFF`).
>    - Khung viền góc và laser quét đồng bộ xanh CEO `#2E3192`.
>    - **TUYỆT ĐỐI CẤM** dùng nền vàng cam đi cùng chữ đen!
> 4. **NÚT BẤM CÓ SỰ KIỆN CLICK:**
>    - Toàn bộ nút có tương tác click đồng bộ nền xanh CEO `#2E3192` hover `#19194D`, chữ TRẮNG (`text-white font-bold`), trừ các nút đặc thù thanh toán.
> 5. **CẤM CSS GHI ĐÈ:**
>    - Tuyệt đối không viết CSS ép biến `.text-white` thành màu đen trong light mode. Mọi element có class `.text-white` hoặc nằm trên nền xanh/đỏ phải được đảm bảo hiển thị màu trắng tinh khôi `#FFFFFF !important`.

---

## 7. CHECKLIST KIỂM THỬ GIAO DIỆN (UI/UX QUALITY CHECKLIST)

Mọi lập trình viên và AI Agent khi thao tác trên app Hiệp hội phải đối chiếu checklist trước khi hoàn thành:
- [x] Logo CEO 1983 hiển thị sắc nét ở Header, không bị méo tỷ lệ.
- [x] Thẻ hội viên VIP có đủ Ảnh bìa Cover + Avatar tròn đè ảnh bìa + Tên công ty + Tên hội viên + Chức danh + Mã sao chép.
- [x] Không còn khoảng trắng trống rỗng thừa thãi ở chân trang (Zero whitespace gap).
- [x] Thanh Bottom Bar đủ 5 tab, nút giữa là nút QR Code Thẻ VIP (màu sắc theo từng phiên bản).
- [x] Tab thứ 2 trên Bottom Bar là Sự kiện (`/association/events`).
- [x] Mọi mục không có dữ liệu đều hiển thị Empty State lịch sự, không lỗi vỡ layout.
- [x] Nút bấm có hiệu ứng phản hồi `active:scale-95` mượt mà.
- [x] Không tự động chạy `git push` hay `git commit` vi phạm AGENTS.md.

---

## 8. QUY CHUẨN TƯƠNG THÍCH ĐA THIẾT BỊ, THAO TÁC 1 TAY & ĐIỀU KHIỂN BÀN PHÍM ẢO (MANDATORY MOBILE RULES)

> [!IMPORTANT]
> **4 QUY TẮC BẮT BUỘC TRÊN TẤT CẢ CÁC MÀN HÌNH MOBILE:**

### 8.1. Tương Thích Safe Area Insets & Z-Index Đa Dòng Điện Thoại
- **Header:** Bắt buộc có `z-index: 40` hoặc `z-index: 50` và đệm trên `padding-top: max(env(safe-area-inset-top, 0px), 16px)`. Đảm bảo thanh tiêu đề, nút Back và avatar không bao giờ bị che khuất bởi Status Bar (đồng hồ, biểu tượng pin, sóng mạng, tai thỏ hay Dynamic Island).
- **Footer / Khung Chat / Action Bar:** Bắt buộc có đệm dưới `padding-bottom: max(env(safe-area-inset-bottom, 0px), 20px)`. Đảm bảo các nút tương tác, thanh nhập tin nhắn và nút gửi không bao giờ bị che khuất bởi 3 phím điều hướng Android (Vuông, Tròn, Tam giác) hoặc thanh gạt Home Indicator của iOS.

### 8.2. Thiết Kế Thao Tác 1 Tay Thuận Tiện (One-Handed Usability / Thumb Zone)
- Bố trí toàn bộ các nút bấm tương tác quan trọng, thanh điều hướng 5 tabs, các bộ lọc pills, nút Gửi tin nhắn và các nút xác nhận CTA ở nửa dưới màn hình (vùng hoạt động tự nhiên của ngón tay cái).
- Hạn chế tối đa việc bắt người dùng phải với ngón tay lên góc trên màn hình để thực hiện tác vụ chính.

### 8.3. Chuẩn Hóa Card Sự Kiện, Biểu Tượng Người & Nút Hành Động Icon-Only
- **Biểu tượng số người đăng ký:** BẮT BUỘC dùng biểu tượng Người (`Users`), TUYỆT ĐỐI KHÔNG dùng biểu tượng ngọn lửa (`Flame`) gây hiểu nhầm về tính chất sự kiện.
- **Nút Xem chi tiết:** Chuyển thành nút Icon-Only vuông gọn `h-7 w-7` với icon con mắt `Eye` sắc nét, tooltip `title="Xem chi tiết"`, nền xanh CEO `#2E3192` icon trắng.
- **Nút Đăng ký tham gia:** Chuyển thành nút Icon-Only vuông gọn `h-7 w-7` với icon vé `Ticket`, tooltip `title="Đăng ký tham gia"`, nền xanh CEO `#2E3192` icon trắng.
- **Nút Hủy đăng ký:** BẮT BUỘC chỉ sử dụng 1 ICON DUY NHẤT (icon `X`), kích thước `h-7 w-7`, TUYỆT ĐỐI KHÔNG ĐỂ CHỮ "HỦY" hay "ĐANG HỦY" gây thô kệch và làm lệch tỷ lệ giao diện.
- **Đồng bộ chiều cao hàng nút:** Toàn bộ cụm hành động bên phải thẻ sự kiện (nút Chi tiết, nút Đăng ký, badge Đã đăng ký, nút Hủy) đạt chuẩn chiều cao đồng nhất `h-7` (28px).

### 8.4. Input Tìm Kiếm & Kiểm Soát Bàn Phím Ảo (Search & Virtual Keyboard)
- **Input Tìm kiếm:** TUYỆT ĐỐI KHÔNG ĐƯỢC CÓ BORDER HOVER (`border-none hover:border-transparent focus:ring-0 outline-none`). Loại bỏ mọi hiệu ứng đổi màu viền khi hover/focus gây chớp nháy viền trên thiết bị di động.
- **Bắt buộc ẩn Footer khi nhập liệu:** Khi người dùng chạm/focus vào bất kỳ ô nhập liệu nào (`input`, `textarea`, `contenteditable`) hoặc khi bàn phím ảo hiển thị, thanh Footer / Bottom Tab Bar BẮT BUỘC PHẢI ẨN ĐI NGAY LẬP TỨC (`display: none !important`). Tuyệt đối không để footer của app bị bàn phím ảo đẩy trồi lên trên bàn phím gây che khuất nội dung.

### 8.5. Quy Chuẩn Favicon & Nhận Diện Tab Trình Duyệt CEO 1983
- Mọi trang của phân hệ Hiệp hội (`/association/*`, `/association/login`, `/verify`, `landing/ceo1983`) BẮT BUỘC sử dụng Favicon riêng của CLB Doanh Nhân CEO 1983 ([`/ceo1983-favicon.png`](file:///d:/download/VICONNECT/VIONE_PROJECT/vione_app/apps/vione_app_fe/public/ceo1983-favicon.png)) trên nền trắng bo góc sang trọng.
- TUYỆT ĐỐI KHÔNG để biểu tượng chữ V của ViOne hiển thị ở góc tab trình duyệt khi người dùng đang ở trong không gian Hiệp hội CEO 1983.

---

## 9. QUY CHUẨN MODAL QR, TRANG XÁC THỰC CÔNG KHAI & ICON MOBILE NATIVE

### 9.1. Căn Giữa Modal QR Thẻ Hội Viên (Strict Modal Viewport Centering)
- **Cơ chế Portal:** Modal xem mã QR trên thẻ hội viên (`association.card.tsx`) và modal chỉnh sửa thông tin thẻ (`EditCardModal`) BẮT BUỘC phải được đưa vào React Portal (`createPortal(..., document.body)`).
- **Lý do kỹ thuật:** Khi modal render trong cây DOM con của `MemberScreen`, thuộc tính `backdrop-filter` và `max-w-[480px]` cùng vị trí cuộn của `<main>` tạo ra containing block cục bộ, khiến `position: fixed` bị kẹt và lệch tâm màn hình điện thoại.
- **Quy chuẩn hiển thị:**
  + Lớp phủ nền: `fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in`.
  + Khung thẻ QR: `mx-auto w-full max-w-[320px] rounded-3xl border border-slate-700/60 bg-slate-900/95 p-6 text-center shadow-2xl animate-in zoom-in-95`.
  + Vùng canvas QR: Nền trắng `bg-white p-3.5 rounded-2xl shadow-lg` để camera điện thoại của người đối diện quét nhạy và nhận diện mã tức thì.
  + Nhãn thông tin: Tên hội viên chữ trắng `text-white font-bold`, mã hội viên chữ xanh `text-blue-400 font-semibold`, trạng thái màu xanh ngọc `text-emerald-400`, nút đóng `X` bo tròn nổi bật.

### 9.2. Cô Lập Trang Xác Thực Công Khai (`/verify`) - Tách Biệt Tuyệt Đối ViOne
- **Nguyên tắc phân lập hệ sinh thái:** App Hiệp hội CLB Doanh Nhân CEO 1983 là thực thể độc lập. TUYỆT ĐỐI KHÔNG ĐƯỢC có bất kỳ liên kết, nút bấm hoặc điều hướng nào dẫn sang App ViOne Connect (`/` hoặc `/connect-app`).
- **Logo nhận diện:** Trang `/verify` BẮT BUỘC hiển thị Logo chính thức CLB Doanh Nhân CEO 1983 (`/ceo1983-official-logo.png`). CẤM sử dụng logo hoặc biểu tượng ViOne (`/app-icon.png`).
- **Nút "Về trang chủ":** BẮT BUỘC điều hướng về `/association` với nhãn `Về trang chủ Hiệp hội CEO 1983` (áp dụng cho cả màn hình xác thực hợp lệ, màn hình chưa có mã, và màn hình thẻ không hợp lệ/hết hạn).
- **Thiết kế thương hiệu:** Nền đen doanh nhân `#0A0A0B`, thẻ kính mờ `bg-white/[0.04] border-white/10`, chữ vàng hổ phách `#E6C687` và xanh CEO `#2E3192`, chữ trắng độ tương phản cao, badge trạng thái hợp lệ màu ngọc lục bảo `emerald-400`.

### 9.3. Bộ Biểu Tượng Ứng Dụng (App Icon) Native Cho Android & iOS
- **Mã nguồn Mobile tách biệt:**
  + `apps/mobile_ceo1983/`: Dành riêng cho Hiệp hội CLB Doanh Nhân CEO 1983 (`vn.ceo1983.app`).
  + `apps/mobile_vione/`: Dành riêng cho Mạng xã hội ViOne Connect (`com.vione.app`).
- **Bảo lưu đường dẫn Live Testapp:** Cấu hình `REMOTE_URL` trong `capacitor.config.ts` của `apps/mobile_ceo1983` giữ nguyên `http://14.225.217.232:5000/association` để phục vụ link testapp như cũ.
- **Quy chuẩn đồ họa App Icon:**
  + Sử dụng chính Logo chính thức CEO 1983 đặt trang trọng trên nền trắng thuần khiết `#FFFFFF` (tỉ lệ 1:1, căn giữa an toàn trong vòng tròn safe-zone 66% để không bị cắt xén khi các launcher Android bo tròn hoặc iOS bo squircle).
  + Android mipmaps: Đồng bộ đầy đủ 5 mật độ (`mipmap-mdpi`, `mipmap-hdpi`, `mipmap-xhdpi`, `mipmap-xxhdpi`, `mipmap-xxxhdpi`) với 3 biến thể: `ic_launcher.png` (icon vuông), `ic_launcher_round.png` (icon tròn bo viền tròn dest-in), `ic_launcher_foreground.png` (icon adaptive lớp trên trong suốt).
  + iOS Assets: `AppIcon-512@2x.png` (1024x1024) trong `AppIcon.appiconset`.
  + Root Assets: `icon.png` (1024x1024), `adaptive-icon.png` (1024x1024), `favicon.png` (192x192).

---

## 10. QUY CHUẨN KHỬ TRÙNG LẶP THÔNG BÁO, INPUT PLACEHOLDER, THOÁT MODAL & PRESENCE TIN NHẮN THỜI GIAN THỰC

### 10.1. Khử Trùng LẶp Thông Báo Đa Bảng (Notification Deduplication)
- **Nguyên nhân cốt lõi:** Hệ thống có 2 bảng lưu thông báo (`public.business_notifications` và `public.member_notifications`), ngoài ra còn có bản ghi thông báo động từ `events` và `opportunities`. Khi query gộp dễ bị nhân đôi một thông báo nếu không có deduplication.
- **Quy chuẩn Backend:** Bắt buộc áp dụng cơ chế Composite Key Deduplication trong `connect-app.service.ts`:
  + Khóa định danh: `id:${item.id}`, `ref:${item.refType}:${item.refId}`, `src:${item.sourceRecordId}`.
  + Khóa nội dung chuẩn hóa: `text:${normTitle}|${normBody}|${dayKey}` để loại bỏ hoàn toàn các thông báo gửi trùng cùng nội dung trong cùng ngày.
- **Quy chuẩn Frontend:** Sử dụng client-side deduplication memo trong `association.notifications.tsx` làm chốt chặn an toàn thứ hai.

### 10.2. Thu Gọn Chiều Cao Thẻ Thông Báo & Sự Kiện (Compact Mobile Cards)
- **Thẻ thông báo:** Giảm padding từ `p-4` xuống `p-2.5 sm:p-3`, icon box giảm còn 34px (`h-8.5 w-8.5`), chữ tóm tắt nội dung gọn gàng, giảm tổng chiều cao ~35% để màn hình hiển thị được nhiều thông báo hơn mà không cần cuộn nhiều.
- **Thẻ sự kiện:** Giảm padding xuống `p-2.5 sm:p-3`, ảnh thu nhỏ về `h-16 w-16` (64x64px), hàng nút tác vụ chuẩn `h-7`, tối ưu hoá tỷ lệ hiển thị trên màn hình di động nhỏ gọn.

### 10.3. Ô Nhập Liệu Không Giật Viền Hover & Placeholder Rõ Nét
- **Xóa viền hover:** Toàn bộ ô `input`, `textarea`, `select` trong modal chỉnh sửa tài khoản/hồ sơ (`association.profile.tsx`) và danh thiếp (`association.business-cards.tsx`) tuyệt đối không đổi màu viền khi hover (`hover:border-slate-200 dark:hover:border-slate-700`), chỉ đổi màu viền xanh CEO `#003B95` khi `focus`.
- **Placeholder rõ nét:** Mọi ô nhập liệu bắt buộc có placeholder hướng dẫn cụ thể với màu tương phản cao `placeholder:text-slate-500 dark:placeholder:text-slate-400`, tuyệt đối không để placeholder bị mờ tịt không thấy chữ.

### 10.4. Cơ Chế Thoát Modal Chỉnh Sửa App Hiệp Hội (Action Param Clearance)
- **Nguyên tắc đóng modal:** Khi modal chỉnh sửa được kích hoạt bởi URL query parameter (ví dụ `?tab=cards&action=edit`), khi người dùng bấm nút Đóng (X), nút Hủy ("Hủy"), hoặc sau khi lưu thành công, component BẮT BUỘC phải thực hiện xóa tham số `action` khỏi URL:
  ```ts
  navigate({ search: (prev: any) => { const { action, ...rest } = prev; return rest; } });
  ```
- Tuyệt đối không để sót `action=edit` trên URL gây kích hoạt lại `useEffect` và kẹt trong modal không thoát được.

### 10.5. Lọc Danh Sách Tin Nhắn & Chấm Xanh Online Realtime
- **Lọc hội viên trong danh sách trò chuyện:** Chỉ hiển thị những người đã kết nối thành công (`user_connections.status = 'accepted'`) VÀ đã có tin nhắn trao đổi (`latest.text.trim().length > 0`).
- **Dải hội viên hoạt động trên đỉnh:** Chỉ hiển thị những người đã có tin nhắn, không đổ toàn bộ danh bạ hội viên.
- **Chấm xanh trạng thái trực tuyến:**
  + CHỈ HIỂN THỊ khi tài khoản đó ĐANG ONLINE THỰC SỰ thông qua WebSocket presence (`presence:user_online` / `presence:user_offline` từ `ConnectAppGateway`) và kiểm tra `isUserOnline(userId)`.
  + Khi người dùng offline: Không hiển thị chấm xanh trên avatar, trạng thái hiển thị chấm xám kèm text "Không trực tuyến".
  + TUYỆT ĐỐI CẤM gán cứng chấm xanh "Đang hoạt động" cho tất cả người dùng.

---

## 11. QUY CHUẨN GIAO DIỆN TIN NHẮN CHUẨN MESSENGER (MESSAGING UI/UX STANDARDS)

### 11.1. Bong Bóng Tin Nhắn Đã Gửi (Sent Message Bubble)
- **Chiều cao thấp chuẩn Messenger (Compact Height):**
  + Giảm padding từ `px-3.5 py-2` xuống `px-3 py-1.5`, chữ `leading-snug`, tối ưu hoá diện tích hiển thị bong bóng tin nhắn.
  + Khối thời gian và trạng thái "✓✓ Đã xem" được lồng gọn gàng ngay dưới nội dung với cỡ chữ siêu gọn `text-[9.5px]`, `pt-0.5`, loại bỏ hoàn toàn thẻ div padding dày cộp tách rời làm phình to bong bóng tin nhắn.
- **Bỏ màu nền & Chữ đen sắc nét (No Background Tint & Pure Black Text):**
  + Bong bóng tin nhắn BỎ HOÀN TOÀN MÀU NỀN (`bg-transparent`), giữ viền xanh thương hiệu `border border-[#003B95]` tinh tế và rõ nét.
  + Chữ tin nhắn BẮT BUỘC có màu ĐEN thuần túy (`color: #000000 !important`, `text-black`), không bị chuyển thành màu trắng hay xám nhạt khi ở các chế độ hiển thị khác nhau.
  + Thời gian gửi hiển thị xám đậm `color: #64748b`, trạng thái `✓✓ Đã xem` màu xanh thương hiệu `color: #003B95 font-bold`.

### 11.2. Ô Nhập Tin Nhắn Không Viền (Borderless Chat Input)
- **Thiết kế tối giản hiện đại:**
  + Ô nhập tin nhắn tại thanh nhập đáy (`association.messages.tsx`) loại bỏ hoàn toàn viền: `border-0 border-none outline-none ring-0 focus:ring-0 shadow-none`.
  + Nền bo tròn dạng viên thuốc `bg-slate-100 dark:bg-white/[0.06] rounded-2xl px-4 py-2`, đem lại cảm giác thanh thoát, hiện đại như Messenger / Telegram.

### 11.3. Trích Xuất Tên Người Thật Trên Dải Avatar Hội Viên (Real Person Name Extraction)
- **Loại bỏ hậu tố công ty / nền tảng:**
  + Đối với các tài khoản có tên kèm công ty hoặc hệ thống (như `"Phạm Văn Vũ - ViOne Platform"` hoặc `"Nguyễn Văn A - CEO1983"`), hàm `cleanPersonName` tự động cắt bỏ phần hậu tố sau dấu gạch ngang (`-`).
  + Hàm `getShortName` lấy tên người thật (ví dụ: `"Văn Vũ"` thay vì lấy chữ `"Platform"` ở cuối cùng).

### 11.4. Sắp Xếp Cuộc Trò Chuyện Theo Thời Gian Mới Nhất Lên Đầu (Strict Latest-First Sorting)
- **Ưu tiên thời gian thực:**
  + Danh sách cuộc trò chuyện sắp xếp giảm dần theo thời gian tin nhắn mới nhất `timeB - timeA`.
  + Tin nhắn mới nhất (ví dụ: 2 phút trước) luôn lập tức nổi lên vị trí đầu tiên, không bị các thông báo hệ thống cũ hơn (19 giờ trước) chèn lên trên.

### 11.5. Hệ Thống 5 Danh Mục Tab Phân Loại Tin Nhắn (5 Category Tabs)
- **Tất cả (All):** Bao gồm toàn bộ các cuộc trò chuyện đã có tương tác, tin nhắn trao đổi hoặc phản hồi (`Boolean(c.last && c.last.trim())` hoặc tin nhắn hệ thống). Tuyệt đối không hiển thị liên hệ rỗng chưa từng phát sinh hội thoại.
- **Bạn bè (Connected Friends):** Danh sách hội viên chính thức đã kết nối thành công (`isConnected = true`).
- **Chưa đọc (Unread):** Danh sách các cuộc trò chuyện đang có tin nhắn mới chưa xem (`unread > 0`).
- **Hệ thống (System):** Tin nhắn thông báo từ Ban Thư Ký CLB, Quản trị viên, hoặc thông báo hóa đơn nộp phí (`isSystem = true`).
- **Tin nhắn chờ (Pending Requests):** Tin nhắn gửi đến từ những người chưa kết nối (`!isConnected`). Khi danh sách trống, BẮT BUỘC hiển thị duy nhất câu thông báo: *"Bạn không có tin nhắn chờ"*.

### 11.6. Bộ Lọc Đa Chiều & Dải Ký Tự Chữ Cái A-Z (Multi-Dimensional Filter System)
- **Dải chữ cái A-Z trượt ngang (`ALPHABET_LETTERS`):** Cho phép chạm nhanh vào bất kỳ ký tự nào từ A đến Z để lọc hội thoại theo chữ cái đầu của tên hội viên (đã chuẩn hóa qua hàm `getNormalizedFirstChar` xử lý tiếng Việt có dấu).
- **5 Chế độ Sắp xếp (Multi-Mode Sorting):**
  1. *Mới nhất (Newest)*: Ưu tiên cuộc trò chuyện có tương tác gần nhất lên đầu.
  2. *Cũ nhất (Oldest)*: Sắp xếp theo mốc thời gian tăng dần.
  3. *Tên A → Z (Alphabetical Ascending)*: Sắp xếp danh bạ theo thứ tự bảng chữ cái tăng dần.
  4. *Tên Z → A (Alphabetical Descending)*: Sắp xếp theo thứ tự bảng chữ cái giảm dần.
  5. *Ưu tiên chưa đọc (Unread First)*: Đưa các cuộc trò chuyện có tin nhắn chưa đọc lên vị trí ưu tiên số 1.
- **Bộ lọc Online:** Lọc nhanh danh sách các hội viên đang có kết nối trực tuyến realtime.
- **Tìm kiếm đa năng:** Hỗ trợ tìm kiếm realtime theo tên hội viên, nội dung tin nhắn, mã hội viên hoặc tên doanh nghiệp.

---

## 12. THAO TÁC 1 TAY DYNAMIC KHÔNG NÚT NỔI (BUTTON-FREE DYNAMIC ERGONOMICS)

### 12.1. Loại Bỏ Hoàn Toàn Nút Nổi Trợ Năng
- Tuyệt đối không đặt nút nổi trợ năng (Floating Thumb Hub) cố định trên màn hình gây vướng tầm nhìn và che khuất nội dung của hội viên.
- Toàn bộ thao tác một tay được kích hoạt dynamic qua cử chỉ ngón tay cái tự nhiên.

### 12.2. Kích Hoạt Chế Độ Reachability (Kéo Nửa Màn Hình Xuống) Bằng Cử Chỉ
- **Cử chỉ mép đáy:** Vuốt xuống từ mép đáy màn hình (khu vực thanh điều hướng chân trang 110px: `startY >= window.innerHeight - 110 && diffY > 30`) để kích hoạt Reachability mà không cần bất kỳ nút bấm nào.
- **Cử chỉ đỉnh:** Vuốt trượt mạnh từ đỉnh màn hình xuống cũng kích hoạt chế độ này.
- **Hành vi hiển thị:** Toàn bộ nửa trên màn hình (thanh tìm kiếm, tiêu đề, bộ lọc) trượt xuống `35vh` nằm gọn trong vùng với tới tự nhiên của ngón tay cái.
- **Thu gọn nhanh:** Chạm nhẹ hoặc vuốt lên trên vùng mờ 35vh ở đỉnh để lập tức thu gọn màn hình về trạng thái ban đầu.

### 12.3. Cử Chỉ Vuốt Mép Cạnh Trái (Edge Swipe Back)
- Khi ngón tay vuốt từ mép trái màn hình sang phải (`startX <= 35 && diffX > 45`), hệ thống tự động gọi `window.history.back()`, mang lại trải nghiệm mượt mà như app native iOS/Android.

### 12.4. Cử Chỉ Vuốt Ngang Chuyển Tab (Horizontal Swipe Navigation)
- Vuốt sang trái hoặc phải trên màn hình để chuyển tab nhịp nhàng giữa: Trang chủ ↔ Sự kiện ↔ Thẻ số ↔ Tin nhắn ↔ Cá nhân.

---

## 13. HƯỚNG DẪN SỬ DỤNG 14 CHUYÊN ĐỀ & ĐỒNG BỘ TRANG CÁ NHÂN

### 13.1. Modal Hướng Dẫn Sử Dụng 14 Chuyên Đề Thực Chiến
- Hệ thống hỗ trợ 14 chuyên đề nghiệp vụ đầy đủ:
  1. *Đăng nhập & Kích hoạt Thẻ VIP Executive* (`login-card.svg`).
  2. *Thao tác 1 tay & Cử chỉ Dynamic* (`one-handed-reachability.svg`).
  3. *Danh thiếp số & Chạm kết nối NFC* (`smart-card-nfc.svg`).
  4. *Tin nhắn Messenger & Phân loại 5 Danh mục* (`chat-messenger.svg`).
  5. *Danh bạ hội viên & Kết nối 2 chiều* (`directory-network.svg`).
  6. *Sự kiện CLB & Check-in QR 1 giây* (`events-checkin.svg`).
  7. *Cơ hội kinh doanh & Đăng sản phẩm B2B* (`b2b-marketplace.svg`).
  8. *Hội phí thường niên & VietQR tự động* (`annual-fee-vietqr.svg`).
  9. *Biểu quyết & Bầu cử trực tuyến* (`voting-election.svg`).
  10. *Đổi ảnh bìa & Cá nhân hóa hồ sơ VIP* (`profile-cover.svg`).
  11. *Trung tâm thông báo & Quản lý hóa đơn* (`notifications-bills.svg`).
  12. *Chế độ hiển thị & Theme lễ hội* (`theme-display.svg`).
  13. *Tra cứu điều lệ & Thư viện tài liệu* (`documents-library.svg`).
  14. *Bảo mật tài khoản & Quản lý phiên* (`security-sessions.svg`).
- Mỗi chuyên đề đi kèm hình ảnh mockup vector SVG chuẩn thương hiệu CEO 1983, hướng dẫn chi tiết từng bước, và mẹo thực chiến.

### 13.2. Chuẩn Hóa Giao Diện Đơn Nhất Tại Trang Cá Nhân
- Loại bỏ hoàn toàn 2 thẻ nhanh thừa ("Hướng dẫn sử dụng" và "Liên hệ Ban Thư Ký") ở chân trang gần nút Đăng xuất.
- Duy trì duy nhất danh mục Cài đặt chuẩn ở phần trên của trang cá nhân, bảo đảm giao diện gọn gàng, không trùng lặp chức năng.

---

## 14. QUY CHUẨN THIẾT KẾ POSTER & MODAL CHI TIẾT SỰ KIỆN / CƠ HỘI B2B (POSTER LAYOUT STANDARDS)

### 14.1. Thẻ Danh Sách Chuẩn Poster (Poster Card - Ảnh 3)
- **Áp dụng đồng bộ:** Phân hệ Sự kiện (`/association/events`) và Trao cơ hội kinh doanh (`/association/opportunities`).
- **Cấu trúc Thẻ Poster:**
  1. **Ảnh Banner Poster 16:9:** Đặt trên đỉnh thẻ (`aspect-[16/9] w-full object-cover`), góc trên có pill badge phân loại/thể loại, nút lưu/bookmark, và số lượng đã đăng ký (`[Users] N`).
  2. **Tiêu đề Doanh Nhân:** Phông chữ đậm nét, tối đa 2 dòng `line-clamp-2`, phân cấp thị giác nổi bật với tên người đại diện/công ty.
  3. **Thanh 3 Cột Metadata Cân Xứng (3-Column Metric Bar):**
     - Đặt phía dưới tiêu đề, chia đều 3 cột với **2 đường vạch ngăn cách đứng** (`divide-x divide-slate-100 dark:divide-slate-800`):
     - *Cột 1:* `THỜI GIAN` hoặc `HẠN CHÓT` (Icon lịch `Calendar` / `Clock` + thời gian định dạng DD/MM/YYYY).
     - *Cột 2:* `ĐỊA ĐIỂM` hoặc `ĐỊA BÀN` (Icon vị trí `MapPin` + thành phố/địa bàn).
     - *Cột 3:* `ĐỐI TƯỢNG` (Icon đối tượng `Users` + nhóm hội viên/doanh nghiệp hướng tới).

### 14.2. Modal Chi Tiết Chuẩn Poster (Detail Modal - Ảnh 4)
- **Cấu trúc Modal Chi Tiết:**
  1. **Header Poster Toàn Cảnh:** Ảnh banner sự kiện/dự án lớn bo tròn hoặc tràn viền trên, nút đóng `X` cố định góc trên phải.
  2. **Thanh Metadata 3 Cột Ngang:** Tái khẳng định Thời gian, Địa điểm, Đối tượng trước khi vào nội dung chi tiết.
  3. **Đoạn Văn Bối Cảnh (Context Narrative):** Nội dung mô tả tổng quan sự kiện, ý nghĩa hoặc thông điệp kết nối B2B.
  4. **Dải Phân Cách Nét Đứt:** Dòng kẻ nét đứt trang trọng `----------------` phân tách rõ ràng giữa phần dẫn nhập và các thông tin chi tiết.
  5. **Các Khối Keypoint Nổi Bật (Highlighted Keypoint Bullets):**
     - Bo góc mềm mại `rounded-2xl`, nền nhẹ tương phản (`bg-blue-50/60` hoặc `bg-slate-50 dark:bg-slate-800/60`).
     - *Keypoint 1:* Thời gian & Lịch trình cụ thể.
     - *Keypoint 2:* Địa điểm & Hướng dẫn di chuyển.
     - *Keypoint 3:* Kinh phí / Ưu đãi hội viên CEO 1983 kèm **Liên kết nhóm Zalo sự kiện** (`Tham gia nhóm Zalo kết nối`).
     - *Keypoint 4:* Đầu mối liên hệ ban tổ chức (Họ tên, hotline trực tiếp).
  6. **Đường Link Đăng Ký Trực Tuyến:** Khối liên kết riêng biệt dẫn tới trang đăng ký chính thức hoặc cổng đối tác.
  7. **Cụm Nút CTA Hành Động Đáy:**
     - Nút 1: Nút kết nối Zalo / Nhắn tin trao đổi (`bg-emerald-600` hoặc viền xanh Navy).
     - Nút 2: Nút hành động chính "Đăng ký tham gia ngay" / "Bày tỏ quan tâm" (Nền xanh Navy `#003B95` chữ trắng sắc nét).

---

## 15. QUY CHUẨN QUẢN LÝ KẾT NỐI VĨNH VIỄN & KHÓA CUỘN NỀN MODAL MOBILE

### 15.1. Vòng Đời Kết Nối & Hủy Kết Bạn Vĩnh Viễn (Persistent Connection Lifecycle)
- **Cơ chế Tombstone Storage:** Khi người dùng bấm "Hủy kết bạn" hoặc "Hủy kết nối" tại modal hồ sơ (`MemberProfileModal.tsx`) hay danh bạ (`association.members.tsx`), hệ thống BẮT BUỘC:
  1. Ghi nhận mã hội viên / user ID vào danh sách `vba.disconnected_members` trong `localStorage`.
  2. Xóa khỏi danh sách `vba.connected_members`.
  3. Phát CustomEvent `vba.connection.changed` và `storage` event để cập nhật đồng thời mọi tab và component đang mở.
- **Quyền Ưu Tiên Tuyệt Đối Khi Kiểm Tra Trạng Thái:**
  - Mọi hàm kiểm tra bạn bè (`checkIsFriend`) và modal hồ sơ (`MemberProfileModal`) phải kiểm tra `vba.disconnected_members` ĐẦU TIÊN. Nếu ID/Mã nằm trong danh sách này thì LUÔN trả về `false` (chưa kết nối).
  - TUYỆT ĐỐI CẤM gán cứng `initialConnected={true}` trong bất kỳ component nào mở từ tin nhắn, danh bạ hay trang chủ.

### 15.2. Khóa Cuộn Nền & Căn Giữa Modal Mobile (Body Scroll Lock & Full Centering)
- **Khóa Cuộn Nền (Body Scroll Lock):**
  - Mọi modal pop-up toàn màn hình trên mobile khi mở BẮT BUỘC set `document.body.style.overflow = "hidden"` để ngăn trang nền bị giật cuộn khi người dùng cuộn nội dung trong modal.
  - Khi modal đóng (unmount), bắt buộc hoàn trả `document.body.style.overflow = ""`.
- **Căn Giữa 100% Tuyệt Đối:**
  - Bọc modal bằng `fixed inset-0 z-[9999] grid place-items-center w-full h-[100dvh] overflow-y-auto` hoặc bọc qua React Portal (`createPortal(..., document.body)`).
  - Hộp nội dung modal đặt `w-full max-w-lg mx-auto` với padding hợp lý, footer nút bấm cố định hoặc nằm trong luồng cuộn tự nhiên.

---

## 16. QUY CHUẨN PHÂN LUỒNG & BẢO MẬT THÔNG BÁO (NOTIFICATION ISOLATION)
- **Thuộc tính phân vùng (`app_scope`):** Mọi thông báo xuất phát từ hoạt động của Hiệp hội/CLB CEO 1983 (Sự kiện, Cơ hội giao thương, Tin tức, Điểm danh QR) BẮT BUỘC mang giá trị `app_scope = 'association_app'`.
- **Tại ViOne Connect App:**
  - ViOne Notification Hub hoàn toàn bỏ qua mọi thông báo có `app_scope = 'association_app'`.
  - Không để rò rỉ dữ liệu hoặc badge đỏ của CLB sang ứng dụng doanh nghiệp nền tảng.
- **Tại CEO 1983 App:**
  - Notification Hub lọc chặt chẽ chỉ tiếp nhận thông báo liên quan đến hội viên CLB CEO 1983 (theo user_id, email, số điện thoại hoặc broadcast cộng đồng).
  - Tiêu đề và nhãn người gửi hiển thị chuẩn: "CLB Doanh Nhân CEO 1983" hoặc "Ban Thư Ký CEO 1983", tuyệt đối không hiển thị tên hệ thống "ViOne".

---

## 17. QUY CHUẨN GIAO DIỆN SỰ KIỆN FULL-IMAGE BANNER & THANH 3 CỘT (CHUẨN ẢNH 3)
- **Ảnh Banner 16:9 với Chữ Nằm Hoàn Toàn Bên Trong:**
  - Tiêu đề sự kiện và slogan phong cách doanh nhân ("GẮN KẾT THỊNH VƯỢNG · ĐỈNH CAO DOANH NHÂN HỘI TỤ") được đặt trực tiếp bên trong lớp phủ gradient tối (`bg-gradient-to-t from-black/90 via-black/45 to-black/20`) ở đáy ảnh 16:9.
  - Loại bỏ hoàn toàn khối văn bản thừa bên ngoài ảnh poster.
- **Thanh 3 Cột Metadata Dính Liền (Attached Metric Strip):**
  - Đặt trực tiếp dưới ảnh banner poster, chia đều 3 cột với đường phân cách mờ:
    1. `THỜI GIAN`: Giờ phút & ngày diễn ra sự kiện.
    2. `ĐỊA ĐIỂM`: Tên tòa nhà/khách sạn (ví dụ: Keangnam Hà Nội).
    3. `ĐỐI TƯỢNG`: Phân hạng tham dự ("Hội viên CEO 1983").
- **Loại Bỏ Nút CTA Thừa Ở Chân Thẻ Danh Sách:**
  - Không đặt nút "Chi tiết sự kiện" hay "Đăng ký" ở chân thẻ ngoài danh sách `/association/events` để tạo bố cục thanh thoát, chuẩn giao diện tạp chí doanh nhân cao cấp.
  - Toàn bộ thẻ là liên kết mở Modal xem chi tiết sự kiện toàn cảnh.

---

## 18. QUY CHUẨN THẺ HỘI VIÊN & HỒ SƠ EXECUTIVE TRỰC DIỆN (`association.card.tsx`)
- **Vị trí Hồ Sơ Executive:**
  - Khối thông tin chức danh, doanh nghiệp và tiểu sử doanh nhân được đưa trực tiếp xuống ngay dưới thẻ hội viên kim loại ảo (`vba-member-card`), tạo sự liền mạch thị giác 100%.
- **Mã QR Khắc Trực Tiếp Trên Ảnh Bìa:**
  - QR Code kích thước gọn đẹp `h-16 w-16` được tích hợp trang trọng ngay góc phải của ảnh bìa Cover Banner với viền vàng Amber mạ sáng.
- **Hệ Thống Tiện Ích Đa Kênh Tích Hợp:**
  - Nút sao chép liên kết danh thiếp công khai chuẩn CEO 1983 (`/card/:code`).
  - Nút tích hợp Apple Wallet & Google Wallet lưu trữ thẻ thông minh.
  - Nút chia sẻ Chạm NFC một chạm kết nối.
  - Dải liên kết mạng xã hội chính thức: Facebook, Zalo, LinkedIn, Website doanh nghiệp.

---

## 19. QUY CHUẨN BỐ CỤC TIN TỨC 50% ẢNH SPLIT & MODAL PREVIEW (`association.news.tsx`)
- **Tỉ Lệ 50% Ảnh - 50% Nội Dung:**
  - Thẻ tin tức danh sách được thiết kế chia đôi: 50% diện tích là ảnh phóng viên sắc nét tỉ lệ doanh nghiệp kèm badge thể loại, 50% diện tích là Tiêu đề tin, Đoạn trích dẫn, Lượt xem và Ngày đăng.
- **Modal Chi Tiết Chuẩn Tạp Chí Doanh Nhân:**
  - Khi bấm vào tin tức, Modal hiển thị ảnh banner lớn sắc nét, thông tin tác giả ("Ban Truyền Thông CEO 1983"), thời gian đăng, nội dung bài viết định dạng phân đoạn rõ ràng và nút "Chia sẻ tin tức".

---

## 20. QUY CHUẨN HÀNH TRÌNH ĐIỆN ẢNH 6 TẦNG SIÊU THỰC (6-SCENE CINEMATIC LANDING)
- **Đường dẫn truy cập:** `/landing/ceo1983/cinematic` (và `/landing?template=ceo1983-cinematic`).
- **Triết Lý Chuyển Cảnh Tự Nhiên (Organic Flow Transitions):**
  - Tuyệt đối không dùng các khối hộp chữ nhật ngăn cách thô cứng (`no rectangle dividing blocks`).
  - Sử dụng các đường cong SVG hữu cơ (Organic SVG Wave/Cloud Paths) và hiệu ứng chuyển sắc tự nhiên từ tầng không gian này sang tầng không gian kế tiếp.
- **Hành Trình 6 Tầng Không Gian:**
  1. *Scene 1: Bầu Trời Vô Tận (Endless Sky)* - Tầm nhìn chiến lược, mây trôi bồng bềnh, ánh dương hội tụ.
  2. *Scene 2: Chim Ưng Sải Cánh (Eagles Soaring)* - Biểu tượng thủ lĩnh tiên phong, vượt qua bão tố.
  3. *Scene 3: Cánh Diều Khát Vọng (Soaring Kites)* - Tinh thần doanh nhân Quý Hợi 1983, vươn cao đón gió lớn.
  4. *Scene 4: Biệt Thự Ven Biển (Coastal Villas)* - Phong cách sống thượng lưu, không gian đàm đạo tinh hoa.
  5. *Scene 5: Lướt Sóng Tiên Phong (Waterfront Surf)* - Bản lĩnh đương đầu thử thách, tốc độ và bản lĩnh thương trường.
  6. *Scene 6: Lòng Đại Dương & Cá Mập Thống Lĩnh (Deep Ocean Apex Predator)* - Sức mạnh tiềm ẩn, chiều sâu nội lực và tinh hoa lãnh đạo dẫn dắt thị trường.
- **Hệ Thống Âm Thanh Môi Trường Web Audio API Tự Thân (Ambient Sound Synthesizer):**
  - Tự động tổng hợp âm thanh gió biển, sóng vỗ và tiếng ngân vang huyền bí thông qua Web Audio API Oscillator & Buffer Nodes trực tiếp trong trình duyệt, không phụ thuộc file mp3 ngoài, bảo đảm 100% không lỗi 404 hay CORS.

---

## 21. QUY CHUẨN MỜI HỘI VIÊN VÀ BỐ CỤC SẢN PHẨM B2B
- **Nút "Mời vào CLB CEO 1983" (`association.members.tsx`):**
  - Nút bấm nổi bật nền Cobalt Navy kết hợp viền vàng mạ sang trọng.
  - Kích hoạt Modal Mời Hội Viên (`InviteMemberModal.tsx`) với:
    - Mã QR tham gia CLB độc quyền của hội viên giới thiệu.
    - Link giới thiệu định danh (`/join?ref=...`).
    - Nút gửi lời mời nhanh qua tin nhắn Zalo và SMS với văn mẫu lịch lãm.
- **Bố Cục Sàn Sản Phẩm B2B (`association.products.tsx`):**
  - Nút "Đăng sản phẩm" được đưa xuống nằm ngay cạnh thanh tìm kiếm, giúp người dùng thao tác tiện lợi bằng ngón tay cái mà không che khuất tiêu đề trang.

---

## 22. QUY CHUẨN CARD VISIT CEO 1983 CHUẨN THIẾT KẾ VẬT LÝ (`Ceo1983BusinessCardVisit.tsx`)
- **Tỉ lệ chuẩn danh thiếp quốc tế:** Tỉ lệ 16:10 / 1.7:1 (tiêu chuẩn card visit doanh nhân), responsive mượt mà từ màn hình di động nhỏ nhất tới desktop.
- **Mặt trước danh thiếp (Front Side):**
  - **Header trái:** "CÂU LẠC BỘ CEO1983" (Font Sans-Serif hoa, màu xanh navy `#19194D`), bên dưới là email `info@ceo1983club.com` và website `https://ceo1983club.com`.
  - **Header phải:** Biểu tượng số 8 cách điệu 2 màu + chữ "CEO" (navy) "1983" (cam `#EA580C`); phía sau tỏa ra các đường tròn đồng tâm mờ mô phỏng sóng lan tỏa thương hiệu.
  - **Thân danh thiếp (Body):** Họ tên doanh nhân in hoa Navy lớn (`#19194D`), chức danh (Director / Chủ tịch / CEO) màu cam rực rỡ (`#EA580C`), thông tin hotline và email có icon điện thoại / phong thư đi kèm.
  - **Góc trái dưới (Organic Wave Ribbon):** Mảng sóng uốn lượn màu xanh navy đậm (`#1B2456`) tại góc dưới bên trái, viền trên là dải ruy băng màu cam (`#F58220`) uốn cong mềm mại chạy dọc xuống cạnh đáy sang phải, tái hiện 100% bản vẽ thiết kế card visit thực tế của CLB.
- **Mặt sau danh thiếp (Back Side):**
  - Nền gradient kim loại tối sang trọng viền vàng hổ phách, logo số 8 trung tâm, mã QR vCard cá nhân có animation nhún nhảy để quét kết nối danh bạ điện thoại trực tiếp, kèm châm ngôn giá trị cốt lõi: *"Tâm - Tầm - Tín - Thịnh"*.
- **Bộ công cụ tương tác:**
  - Nút lật mặt sau / mặt trước 3D (3D Card Flip).
  - Nút chia sẻ danh thiếp qua native Web Share API.
  - Nút sao chép liên kết danh thiếp điện tử.

---

## 23. QUY CHUẨN TINH GỌN TRANG CHỦ, POSTER SỰ KIỆN & BIỂU TƯỢNG HÌNH SỐ 8
- **Gỡ bỏ Landing Web Banner tại Trang Chủ (`association.index.tsx`):**
  - Trang chủ hiệp hội tập trung vào các tính năng hội viên cốt lõi, loại bỏ hoàn toàn banner landing web.
- **Tinh gọn Thẻ Sự Kiện Trang Chủ (`association.index.tsx`):**
  - Thu nhỏ diện tích thẻ sự kiện, chỉ hiển thị thumbnail ngày, thời gian và tên sự kiện; loại bỏ icon bookmark và dải metadata 3 cột rườm rà.
- **Giao diện Danh Sách Sự Kiện Chuẩn Poster 16:9 (`association.events.tsx`):**
  - Ảnh poster sự kiện tràn viền full-bleed; dải metadata 3 cột (Thời gian, Địa điểm, Đối tượng) nằm trực tiếp trên nền ảnh với hiệu ứng kính mờ tối (`bg-black/60 backdrop-blur-md border-t border-white/15`), chữ trắng và vàng hổ phách nổi bật trên nền ảnh, không đặt trên nền trắng.
- **Animation Nhún Nhảy Mã QR & Nút "Xem QR" Phóng To:**
  - Mã QR trên ảnh bìa hồ sơ/thẻ có hiệu ứng nhún nhảy nhẹ nhàng (`.animate-subtle-bounce`), bên dưới có nút bấm "Xem QR" để phóng to modal xem chi tiết và tải ảnh mã QR.
- **Biểu Tượng Web & App Mobile Số 8 Độc Lập:**
  - Bỏ chữ "CEO1983", chỉ sử dụng duy nhất biểu tượng cách điệu hình số 8 kép (`/ceo1983-emblem-8.png`) cho favicon web, apple-touch-icon, app-icon, và icon Android APK/Capacitor.

---

## 24. QUY CHUẨN BANNER & SẢN PHẨM ĐÁNG CHÚ Ý C-LEVEL
- **Banner Tối Giản Ít Chữ (Minimalist Executive Banner):**
  - Giảm thiểu tối đa mật độ chữ trên banner. Giữ lại duy nhất khẩu hiệu doanh nhân cô đọng và widget đếm ngược thời gian thực.
  - Loại bỏ hoàn toàn các khẩu hiệu bán lẻ đại trà, không nhồi nhét từ ngữ hoa mỹ rườm rà.
- **Khối Sản Phẩm Đáng Chú Ý Chuẩn Doanh Nhân:**
  - Tuyệt đối không dùng các nhãn bán lẻ "Đặc quyền...", "Ad", "HOT" hay badge giật nhảy.
  - Sử dụng viền kim loại champagne mỏng tinh xảo (`border-amber-500/20`), nhãn đối tác Verified xanh dương nhã nhặn, và hiển thị phân cấp giá niêm yết kết hợp giá ưu đãi hội viên rõ ràng, minh bạch.
- **Tiện Ích Hội Viên Gọn Đẹp:**
  - Khối Tiện ích được trình bày dạng card phẳng sang trọng, loại bỏ icon quà nhún nhảy `animate-bounce` và hiệu ứng ping gây mất tập trung.

---

## 25. QUY CHUẨN ĐỒNG BỘ CRUD CƠ HỘI GIAO THƯƠNG & SẢN PHẨM 100% DATABASE
- **Toàn Vẹn Dữ Liệu Thực Tế (Data Integrity):**
  - Không sử dụng bất kỳ mảng mock hay fallback giả lập nào cho danh sách cơ hội và sản phẩm. Tất cả dữ liệu phải được lưu và nạp trực tiếp từ PostgreSQL thông qua NestJS REST API.
- **Quyền Chỉnh Sửa & Xóa Của Tác Giả (Author Ownership):**
  - Hệ thống tự động đối soát thông tin tác giả qua mã hội viên, user ID, số điện thoại hoặc tên doanh nghiệp (`checkIsMine`, `checkIsProductOwner`).
  - Nếu là người tạo: hiển thị nút "Sửa" (`Pencil`) và "Xóa" (`Trash2`) trên cả card danh sách và modal xem chi tiết.
  - Modal Chỉnh sửa hỗ trợ cập nhật tiêu đề, danh mục, ngân sách/giá bán, đơn vị tính, mô tả và liên hệ; gọi API `PATCH` và reload giao diện ngay lập tức.
  - Nút Xóa có hộp thoại xác nhận an toàn, gọi API `DELETE` và xóa bản ghi vĩnh viễn khỏi hệ thống.

---

## 26. QUY CHUẨN POPUP CHỤP DANH THIẾP VIEWPORT CĂN GIỮA
- **React Portal & Z-Index Cao Nhất (`z-[99999]`):**
  - Modal chụp danh thiếp (`AssociationCardCaptureModal.tsx`) bắt buộc phải đóng gói qua React Portal `createPortal(..., document.body)` để tách biệt khỏi cây DOM của trang, ngăn chặn triệt để hiện tượng bị thanh điều hướng di động (`z-50`) che khuất đáy modal.
- **Căn Giữa Tuyệt Đối Trên Màn Hình Di Động:**
  - Sử dụng khung bọc `fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md` kết hợp `my-auto`, đảm bảo popup luôn nằm ngay chính giữa màn hình của mọi dòng điện thoại thông minh (iPhone, Android).
- **Bảng Màu Deep Obsidian & Champagne Gold:**
  - Khung ngắm và bảng điều khiển sử dụng nền đen sâu Deep Obsidian (`#0C1322`), viền vàng kim Champagne (`#D4AF37`), nút chụp ảnh thiết kế 2 vòng tròn tinh tế tạo cảm giác máy ảnh cơ cao cấp.

---

## 27. QUY CHUẨN THẺ SẢN PHẨM DẠNG NGANG TRANG CHỦ (HORIZONTAL PRODUCT CARDS)
- **Toàn Ảnh Kiểu Ngang Bên Trái (Dominant Photo Frame):**
  - Chiếm ưu thế thị giác lớn (62% - 66% bề ngang thẻ). Ảnh hiển thị sắc nét, tràn viền kết hợp lớp chuyển sắc mờ nhẹ sang mép phải.
- **Lề Thông Tin Tinh Giản Bên Phải (Right Margin Strip):**
  - Chỉ bố trí một số ít thông tin cốt lõi (Tên công ty/thương hiệu, Tên sản phẩm, Giá ưu đãi hội viên).
- **Hài Hòa Giữa Chữ Nghiêng & Chữ Đứng (Harmonious Typography):**
  - Chữ nghiêng (*italic*): Dành cho tên doanh nghiệp/thương hiệu (*Tập đoàn công nghệ...*) và nhãn *Giá hội viên*.
  - Chữ đứng (regular/bold): Dành cho tên sản phẩm và con số giá bán, tạo phong thái đĩnh đạc, chuẩn gu C-Level.

---

## 28. QUY CHUẨN NỘI DUNG SỰ KIỆN SÁT FOOTER ẢNH & COUNTDOWN SỐ THUẦN
- **Căn Sát Chân Ảnh (Bottom-Anchored Content):**
  - Toàn bộ nội dung chính (Badge danh mục, Tiêu đề sự kiện, Ngày giờ & Địa điểm, và Countdown timer) được gom trọn vẹn ở dải chân ảnh (footer) trên nền gradient đen mờ chuyển tiếp (`from-black/95 via-black/80 to-transparent`).
  - Thân ảnh phía trên giải phóng tối đa tầm nhìn để làm nổi bật hình ảnh và vệt sáng vàng kim (Golden Swoosh).
- **Đồng Hồ Đếm Ngược Số Thuần (Borderless Pure Numbers):**
  - Loại bỏ hoàn toàn 4 khung hộp có viền (`border-none`, `bg-transparent`).
  - Thu nhỏ kích thước tinh tế, chỉ hiển thị số thuần túy kèm ký hiệu đơn vị thời gian ngắn gọn (`font-mono text-[13px] text-amber-300`, ví dụ: `12d : 08h : 45m : 30s`).

---

## 29. QUY CHUẨN SỰ KIỆN SẮP TỚI TRANG CHỦ RỘNG & THẤP HƠN
- **Tỉ Lệ Thẻ Ngang Rộng (Wider & Shorter Cinematic Aspect Ratio):**
  - Chuyển đổi từ tỉ lệ đứng cao hẹp `aspect-[2/3]` sang tỉ lệ ngang `aspect-[16/10] sm:aspect-[16/9]`.
  - Giảm chiều cao chiếm dụng màn hình, mở rộng bề ngang giúp poster hiển thị điện ảnh hơn, tên sự kiện và countdown mini gắn trực tiếp trên ảnh.

---

## 30. QUY CHUẨN 100% POPUP CĂN GIỮA MÀN HÌNH MOBILE, UI SỰ KIỆN TỐI GIẢN & SẢN PHẨM VUÔNG TRANG CHỦ (17/09/2026)
- **Chuẩn Căn Giữa Tuyệt Đối Cho Mọi Modal / Popup Trên Mobile (Strict Center Modal Rule):**
  - Mọi modal popup (Tạo nhóm chat `CreateGroupChatModal`, Thành viên nhóm `GroupMembersModal`, Bộ lọc & Sắp xếp `filterModalOpen`, Quét QR, Báo giá, Đăng sản phẩm...) BẮT BUỘC:
    1. Render qua React Portal: `createPortal(..., document.body)` để thoát khỏi mọi bẫy stacking context, CSS containment và cuộn của màn hình cha.
    2. Lớp nền toàn màn hình cố định: `fixed inset-0 z-[99999] flex items-center justify-center p-3.5 sm:p-4 bg-black/80 backdrop-blur-md`.
    3. Hộp thoại card nổi chính giữa: `relative w-full max-w-[390px] sm:max-w-lg max-h-[86dvh] my-auto rounded-3xl overflow-hidden shadow-2xl`. Tuyệt đối CẤM để `p-0` và `h-full` trên mobile làm mất đi hình hài popup nổi.
    4. Tự động khóa cuộn trang nền (`document.body.style.overflow = "hidden"`) khi modal mở và khôi phục khi đóng.
- **UI Sự Kiện Trang Chủ Tinh Giản (Minimal Event Card Home):**
  - Thẻ sự kiện trang chủ (`association.index.tsx`) chỉ giữ lại duy nhất:
    1. Huy hiệu đếm ngược thời gian thực `<EventCountdownMiniBadge />`.
    2. Tên sự kiện in đậm nổi bật (`font-black text-white line-clamp-2`).
  - Loại bỏ hoàn toàn thông tin ngày tháng, thứ, địa điểm bên dưới để tạo sự gọn gàng, thanh thoát.
- **UI Sản Phẩm Trang Chủ Hình Vuông (Square Product Grid Home):**
  - Chuyển sang bố cục lưới 2 cột các thẻ vuông (`grid grid-cols-2 gap-2.5 sm:gap-3`) với khung hình tỷ lệ `aspect-square`.
  - Xóa bỏ hoàn toàn lớp mờ trắng chuyển tiếp (`bg-gradient-to-r from-transparent to-white`).
  - Xóa bỏ hoàn toàn tên thương hiệu / nhãn "CRN 1983" / "CEO 1983".
  - Dải chân ảnh chỉ hiển thị duy nhất: Tên sản phẩm và Giá bán hội viên rõ ràng trên nền gradient tối mờ.




---

## 31. QUY CHUẨN BANNER KHUYẾN MẠI TRANG CHỦ, MÀN HÌNH TIN TỨC ĐƠN & TAB CÁ NHÂN (17/09/2026)
- **Bộ 3 Thẻ Banner Khuyến Mại & Giao Thương Trang Chủ (`association.index.tsx`):**
  - Thẻ Ưu đãi Hội viên & Đối tác: Chiếm trọn bề ngang, vương miện vàng, badge `+Hot` đỏ nổi bật, ảnh quà tặng 3D `vba-gift.png` chuyển động nhịp nhàng, nút "Xem ưu đãi ngay" xanh navy.
  - Lưới 2 thẻ Giao thương: "TRAO CƠ HỘI" (🤝 Animated Emoji, badge `+Mới`, "Khám phá ngay") và "ĐĂNG SẢN PHẨM" (📦 Animated Emoji, badge `+Mới`, "Đăng ngay" xanh navy).
- **Màn Hình Tin Tức CLB Thuần Túy (`association.news.tsx`):**
  - Loại bỏ hoàn toàn tab Sự kiện và thanh chuyển tab; chỉ hiển thị danh sách bài viết Tin tức CLB kèm modal đọc bài viết chi tiết.
- **Tối Giản Phân Hệ Menu Tab Cá Nhân (`association.profile.tsx`):**
  - Không đặt phân hệ "Tin tức & Sự kiện" trong tab Cá nhân nhằm tối ưu luồng trải nghiệm, tránh trùng lặp tính năng với thanh điều hướng chính.

---

## 32. QUY CHUẨN TÊN SỰ KIỆN NGOÀI BANNER & LƯỢC BỎ SẢN PHẨM ĐÁNG CHÚ Ý TRANG CHỦ (17/09/2026)
- **Tên Sự Kiện Nằm Ngoài Banner (`association.events.tsx`):**
  - Banner chữ nhật giữ vai trò là poster thị giác nghệ thuật: ảnh nền, dải sáng vàng, thể loại, bộ đếm ngược countdown không border và ngày/giờ địa điểm.
  - Bỏ huy hiệu `CEO 1983` ở góc trái trên để banner thoáng đãng.
  - Tên sự kiện (`e.title`) được đưa ra ngoài, đặt ngay bên dưới banner card với typography in đậm, độ tương phản cao, dễ đọc trên cả 2 chế độ Light/Dark.
- **Trang Chủ Tối Giản Không Khối Sản Phẩm Đáng Chú Ý (`association.index.tsx`):**
  - Xóa bỏ danh mục 4 thẻ vuông sản phẩm đáng chú ý khỏi trang chủ; việc xem và đăng sản phẩm được dẫn thông qua nút "ĐĂNG SẢN PHẨM" hoặc phân hệ gian hàng riêng biệt.

---

## 33. QUY CHUẨN KIỂM SOÁT TOÀN VẸN TYPESCRIPT & TRIỆT TIÊU RUNTIME CRASH (17/09/2026)
- **Chuẩn Hóa Khai Báo Hook Đa Ngôn Ngữ & Ngữ Cảnh:**
  - `Sidebar.tsx`: Khai báo `const t = useT();` ngay tại component gốc `Sidebar` để cung cấp hàm dịch cho toàn bộ nhãn điều hướng, thương hiệu và mô tả nâng cấp.
  - `association.index.tsx`: Import và gọi `const { user } = useAuth();` để tránh lỗi tham chiếu `user is not defined`.
- **Hoàn Thiện Bộ Xử Lý Sự Kiện Mẫu Báo Giá & Đăng Bài:**
  - `association.products.tsx`: Cung cấp hàm `handleOpenQuoteModal(product)` và `handleSubmitQuote(e)` để phục vụ modal yêu cầu báo giá.
  - `association.profile.tsx`: Bổ sung state `isPublishing` cho tiến trình tải ảnh và đăng bài viết lên bảng tin.
- **Chuẩn Hóa Thuộc Tính SVG Trong React:**
  - Dùng `stopOpacity` thay thế cho `stopColorOpacity` trong các thẻ `<stop>` của SVG LinearGradient.
- **Quy Trình Kiểm Tra Tĩnh:** Chạy `npx tsc --noEmit` đạt 0 lỗi trước khi xuất bản bản build frontend và đóng gói Docker image.

---

## 34. QUY CHUẨN ĐỒNG BỘ 14 TÍNH NĂNG & NÂNG CẤP THẨM MỸ C-LEVEL (ISSUE 128 - 17/09/2026)
- **Menu 3 Chấm (...) Dropdown Cho Bài Đăng Chính Chủ:**
  - Thẻ sản phẩm (`association.products.tsx`) và cơ hội (`association.opportunities.tsx`) thuộc quyền sở hữu (`isMine`) đặt dropdown 3 chấm `...` ở góc trên bên phải ảnh/thẻ, chứa 2 tùy chọn "Chỉnh sửa" và "Xóa".
  - Loại bỏ hoàn toàn các nút inline thô ở chân thẻ; bộ lọc danh mục hỗ trợ song ngữ (`matchCategory`).
  - Hỗ trợ tải ảnh thật từ máy tính/điện thoại (`<input type="file" accept="image/*">`) và xem trước an toàn qua `resolveMediaUrl`.
- **Trang Chủ Hiển Thị Tối Đa 5 Sự Kiện Tỷ Lệ Ngang Điện Ảnh:**
  - Khối Sự kiện sắp tới mở rộng slice từ 3 lên 5 sự kiện; tỷ lệ khung hình ngang `aspect-[4/3] sm:aspect-[16/10]`.
  - Thay nút `•••` thô bằng nút "Xem tất cả" kèm icon `ChevronRight` trang nhã.
  - Trang danh sách sự kiện (`association.events.tsx`) dọn sạch bên ngoài poster, đưa toàn bộ Tiêu đề, Countdown timer thời gian thực và nút "Xem chi tiết" vào trong overlay chân ảnh trên nền gradient đen mờ.
- **Đồng Bộ Avatar Realtime Event Bus:**
  - Sử dụng key `vba_member_avatar_photo` và sự kiện `vba_member_avatar_updated` để cập nhật ảnh đại diện trên Trang chủ và Header ngay lập tức khi đổi avatar ở Profile mà không cần tải lại trang.
- **Tinh Gọn Menu Cá Nhân:**
  - Gỡ bỏ icon `+` thừa trên dòng "Quản lý Danh thiếp số" trong tab Profile (`association.profile.tsx`), chỉ giữ lại mũi tên điều hướng.
- **Modal Hội Viên Căn Giữa Fail-Safe:**
  - `MemberProfileModal.tsx` sử dụng cấu trúc lưới `fixed inset-0 z-[99999] grid place-items-center w-full h-[100dvh] min-h-[100dvh] p-3.5 sm:p-4 my-auto overflow-y-auto` đảm bảo luôn ở chính giữa trục dọc/ngang màn hình mobile.
- **100% Camera In-App HTML5:**
  - Loại bỏ hoàn toàn `AndroidNative.scanQr` trong `AssociationQrScanModal.tsx` và `AssociationMemberQrModal.tsx`, sử dụng camera HTML5 WebRTC nội bộ mượt mà, không phụ thuộc Google Play Services.
- **Xóa Cuộc Trò Chuyện & Tin Nhắn Bền Vững:**
  - Blacklist `vba_deleted_convs` client-side lọc sạch `allConversations`, chống hồi sinh cuộc trò chuyện đã xóa sau khi tải lại trang; xóa tin nhắn phía tôi cập nhật triệt để `localMessages` và localStorage.
- **Modal Chụp Danh Thiếp Trắng & Xanh Navy #003B95:**
  - Thay đổi nền tối `#0C1322` sang Trắng & Xanh Navy viền vàng kim hổ phách sang trọng (`AssociationCardCaptureModal.tsx`); toast notification `sonner.tsx` đồng bộ chuẩn màu CEO 1983 Navy Blue & Amber Gold.
- **Nâng Cấp Nền Tảng Quản Trị Web CRM:**
  - **Sidebar CRM:** Phân quyền ẩn các nhóm menu `network`, `businessConnect`, `system` theo vai trò người dùng.
  - **Cơ hội CRM:** Tải file ảnh thật từ máy tính và đồng bộ trường ảnh `image`/`imageUrl`.
  - **Quản lý Hội phí:** Gắn kết nối sự kiện `handleRemind` vào cả dạng thẻ và bảng kèm fallback mã/tên hội viên; khắc phục cột tài khoản bị để trống bằng fallback logic trong `admin.service.ts`.
  - **Doanh nghiệp:** Lưu `feePaid` và `feeYear` vào cơ sở dữ liệu PostgreSQL, cung cấp toggle trạng thái đóng phí nhanh `onToggleFee` và bộ lọc phí.
  - **Sơ đồ khán phòng CinemaSeatingMap:** Mở rộng canvas banquet `h-[640px]`, clamp tọa độ kéo thả `y: 95%`, khoảng đệm hàng ghế `pb-16 min-h-[300px]` và nút `+ Thêm hàng ghế bên dưới`.


