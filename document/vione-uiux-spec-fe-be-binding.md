# ĐẶC TẢ GIAO DIỆN & BẢN ĐỒ ÁNH XẠ LIÊN KẾT FE-BE CHUẨN MỰC
## VIONE ECOSYSTEM — UI/UX SPECIFICATION & FRONTEND-BACKEND DATA BINDING MAP
*Tài liệu Chuẩn mực Phân tích Nghiệp vụ (Master BA) — Hướng dẫn Hiện thực hóa Giao diện & Ánh xạ Dữ liệu Toàn diện*

---

## 📌 THÔNG TIN DỰ ÁN & LỊCH SỬ PHIÊN BẢN

*   **Tên dự án:** Hệ thống Kết nối và Số hóa Doanh nghiệp ViOne (ViOne Business Connect Ecosystem)
*   **Mã tài liệu:** `VIONE-UIUX-BIND-04`
*   **Phiên bản:** `3.0.0` (Master BA Edition)
*   **Chủ trì biên soạn:** Chuyên gia Phân tích Nghiệp vụ Trưởng (Lead Master BA) & Trưởng nhóm Thiết kế UI/UX (Lead UI/UX Designer)
*   **Trạng thái:** Đã nghiệm thu & Ban hành chính thức (Approved & Baselined)

---

## 📑 MỤC LỤC TỔNG THỂ

1. [QUY CHUẨN THIẾT KẾ & HỆ THỐNG DESIGN TOKENS HAI PHÂN HỆ](#1-quy-chuẩn-thiết-kế--hệ-thống-design-tokens-hai-phân-hệ)
   - 1.1 Ngôn ngữ Nhận diện 1: Royal Blue & Pure White (CRM & App Hiệp hội `/association`)
   - 1.2 Ngôn ngữ Nhận diện 2: Luxury Dark & Champagne Gold (Mạng xã hội `/connect-app`)
   - 1.3 Quy chuẩn Kiểu chữ (Typography) & Thành phần Tương tác Cốt lõi
2. [TIÊU CHUẨN BẢNG DỮ LIỆU CỐ ĐỊNH (STICKY DATA TABLE STANDARD)](#2-tiêu-chuẩn-bảng-dữ-liệu-cố-định-sticky-data-table-standard)
3. [BẢN ĐỒ ÁNH XẠ DỮ LIỆU CHI TIẾT (FRONTEND-BACKEND BINDING MAP)](#3-bản-đồ-ánh-xạ-dữ-liệu-chi-tiết-frontend-backend-binding-map)
   - 3.1 [UI-01]: Cổng Đăng nhập Di động Chuẩn hóa (`/auth/mobile/`)
   - 3.2 [UI-02]: Trang chủ Hội viên & Bảng tin Hoạt động (`/association`, `/association/news`)
   - 3.3 [UI-03]: Danh bạ Hội viên & Tra cứu Đối tác (`/association/members`)
   - 3.4 [UI-04]: Lịch Sự kiện, Vé QR & Trạm Điểm danh (`/association/events`, `/checkin`)
   - 3.5 [UI-05]: Cổng NỘP HỘI PHÍ Trực tuyến VietQR (`/association/renew/pay`)
   - 3.6 [UI-06]: Thẻ Hội viên VIP & Thẻ Visit Card Doanh Nhân (`/association/card`)
   - 3.7 [UI-07]: Bảng tin B2B Moments & Feed Giao thương (`/connect-app/moment`)
   - 3.8 [UI-08]: Hộp thư Trò chuyện Realtime (`/connect-app/inbox`)
   - 3.9 [UI-09]: Điều phối Lịch hẹn B2B 1-on-1 (`/business-connect/meetings`)
   - 3.10 [UI-10]: CRM Báo cáo Tài chính Đa chiều (`/finance-report`)
4. [MA TRẬN PHÂN ĐỊNH RANH GIỚI VALIDATION (3 TẦNG BẢO VỆ)](#4-ma-trận-phân-định-ranh-giới-validation-3-tầng-bảo-vệ)
5. [DANH MỤC THÀNH PHẦN GIAO DIỆN TÁI SỬ DỤNG (DRY UI COMPONENTS)](#5-danh-mục-thành-phần-giao-diện-tái-sử-dụng-dry-ui-components)

---

# 1. QUY CHUẨN THIẾT KẾ & HỆ THỐNG DESIGN TOKENS HAI PHÂN HỆ

Hệ sinh thái ViOne áp dụng triết lý phân tách giao diện trực quan nhằm mang lại trải nghiệm tối ưu cho từng nhóm đối tượng người dùng:

```
┌─────────────────────────────────────────────────────────┐   ┌─────────────────────────────────────────────────────────┐
│     HỆ THỐNG CRM & APP HIỆP HỘI (/association)          │   │        MẠNG XÃ HỘI VIONE CONNECT (/connect-app)         │
│         [Royal Blue & Pure White Standard]              │   │            [Luxury Dark & Champagne Gold]               │
│                                                         │   │                                                         │
│  • Màu chủ đạo: Royal Blue (#004B91, #0284C7)           │   │  • Nền chính: Obsidian Black (#0A0A0C, #121216)         │
│  • Nền giao diện: Soft Light Blue (#F0F7FF, #FFFFFF)    │   │  • Điểm nhấn: Champagne Gold (#E5B869, #D4AF37)         │
│  • Cảm giác: Trang trọng, chính thống, chuẩn hiệp hội   │   │  • Cảm giác: Sang trọng, đẳng cấp doanh nhân, công nghệ │
│  • Đối tượng: BCH, Thư ký, Kế toán & Hội viên CLB       │   │  • Đối tượng: Toàn thể cộng đồng doanh nhân cả nước     │
└─────────────────────────────────────────────────────────┘   └─────────────────────────────────────────────────────────┘
```

## 1.1 Ngôn ngữ Nhận diện 1: Soft Sky Blue, Pure White & Obsidian (CRM & App Hiệp hội `/association`)
- **Tôn chỉ Màu sắc App Hiệp hội CEO 1983**: Bảng màu tối giản, sang trọng gồm Xanh da trời dịu nhẹ (Soft Luminous Sky/Ice Blue), Trắng và Đen than Obsidian (`#0B0F19`), tuyệt đối không dùng màu vàng/cam (amber/gold), ngoại trừ:
  - *Màu xanh lá (`#10B981` / Emerald)*: Hoạt động, điểm danh thành công, đã tiếp nhận.
  - *Màu đỏ (`#EF4444` / Crimson)*: Cảnh báo, quá hạn, chưa đọc, nguy hiểm.
- **Dark Mode (`.vba-app`)**:
  - *Nền chính*: Obsidian Charcoal `#0B0F19`, Nền phụ `#080C14`.
  - *Thẻ Card / Surface*: Kính mờ cao cấp `#111622` / `#151C2C`, viền kính băng `rgba(186, 230, 253, 0.15)`.
  - *Primary Accent*: Soft Ice Sky `#7DD3FC` (Sky-300) dịu mắt, thanh thoát, không bị đậm gắt.
  - *Secondary Accent*: Frost Blue `#BAE6FD` (Sky-200).
  - *Nút bấm & Badge chính (`.vba-gold-grad`)*: Gradient `linear-gradient(135deg, #38BDF8 0%, #7DD3FC 100%)` với chữ đậm tối `#071322` tạo độ tương phản cao, hiện đại.
  - *Hiệu ứng chữ phát sáng (`.vba-gold-text`)*: Gradient `linear-gradient(135deg, #FFFFFF 0%, #BAE6FD 45%, #7DD3FC 100%)`.
- **Light Mode (`html:not(.dark) .vba-app`)**:
  - *Nền chính*: Executive Pure White `#FFFFFF`, Nền phụ `#F8FAFC`.
  - *Thẻ Card*: Trắng `#FFFFFF`, viền xanh nhẹ `rgba(14, 165, 233, 0.14)`.
  - *Primary Accent*: `#0EA5E9` (Sky-500) kết hợp `#38BDF8` (Sky-400), xóa bỏ hoàn toàn navy đậm `#1D4ED8`.
  - *Nút bấm*: `linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)`, chữ trắng `#FFFFFF`.

## 1.2 Ngôn ngữ Nhận diện 2: Luxury Dark & Champagne Gold (Mạng xã hội `/connect-app`)
- **Primary Surface**: `#0A0A0C` (Obsidian Base) kết hợp `#16161A` (Card Surface).
- **Primary Accent**: `#E5B869` (Champagne Gold) và `#F5D485` (Light Gold) - Dùng cho viền Card, Chữ nổi bật, Nút chạm NFC.
- **Glassmorphism**: Lớp phủ kính mờ `backdrop-blur-md bg-white/5 border border-white/10`.

## 1.3 Quy chuẩn Kiểu chữ (Typography)
- Phông chữ tiêu chuẩn: `Plus Jakarta Sans` kết hợp `Inter` (Hỗ trợ hiển thị tiếng Việt hoàn hảo, không lỗi dấu).
- Kích thước:
  - *Tiêu đề H1*: 24px - 32px (Bold 700)
  - *Tiêu đề H2 / Card Title*: 18px - 20px (Semi-bold 600)
  - *Văn bản thân (Body)*: 14px - 15px (Regular 400 / Medium 500)
  - *Nhãn phụ / Ghi chú (Caption)*: 12px - 13px (Regular 400)

---

# 2. TIÊU CHUẨN BẢNG DỮ LIỆU CỐ ĐỊNH (STICKY DATA TABLE STANDARD)

Mọi màn hình danh sách trên hệ thống Web CRM (`/members`, `/companies`, `/fees`, `/events`, `/income`, `/expenses`) bắt buộc tuân thủ cấu trúc bảng cố định 3 vùng:

1. **Vùng Cố định Bên Trái (Sticky Left Columns)**:
   - Cột STT: Rộng 56px, `sticky left-0 bg-white z-20`.
   - Cột Mã định danh (Mã hội viên / Mã HĐ): Rộng 120px, `sticky left-[56px] bg-white z-20 font-mono font-semibold`.
2. **Vùng Nội dung Cuộn Ngang (Scrollable Content Area)**:
   - Các cột: Họ tên, Tên công ty, Ngành nghề, Số điện thoại, Email, Ngày tham gia, Hạn thẻ, Trạng thái.
3. **Vùng Cố định Bên Phải (Sticky Right Action Column)**:
   - Cột Thao tác: Rộng 120px, `sticky right-0 bg-white shadow-[-4px_0_8px_rgba(0,0,0,0.05)] z-20`.
   - Chứa mặc định 2 nút thao tác nhanh:
     - Nút Chỉnh sửa: Icon `Pencil` màu xanh dương.
     - Nút Xóa / Khóa: Icon `Trash2` màu đỏ nhạt.

---

# 3. BẢN ĐỒ ÁNH XẠ DỮ LIỆU CHI TIẾT (FE-BE BINDING MAP)

| Màn hình (Screen / Route) | Cấu phần Giao diện (UI Component) | Tác vụ Người dùng (User Action) | API Endpoint Backend | Bảng CSDL (DB Table & Columns) | Quy tắc Ràng buộc (Validation / Rule) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **/auth/mobile/** | Form Đăng nhập Mobile | Nhập mã hội viên & mật khẩu | `POST /api/auth/mobile/login` | `members.code`, `auth.users.password_hash` | Mã không được để trống, định dạng `M1983-xxx` |
| **/auth/mobile/** | Modal Quét Thẻ NFC | Chạm thẻ NFC hoặc quét QR | `POST /api/auth/mobile/card-scan` | `business_identities.nfc_token` | Token hợp lệ trong 60 giây, chống replay attack |
| **/association** | Dashboard Di động | Xem tổng quan hội viên | `GET /api/members/me` | `members (code, name, term_end, status)` | Tự động tính trạng thái `due` nếu `term_end <= 30d` |
| **/association/news** | Danh sách Bản tin | Xem tin hoạt động | `GET /api/news` | `news (id, title, content, created_at)` | Lọc theo `association_id`, phân trang 10 tin/trang |
| **/association/members**| Danh bạ Hội viên | Tìm kiếm đối tác theo ngành | `GET /api/members?status=active` | `members (name, company, phone, email)` | Chỉ hiển thị hội viên có `status = 'active'` |
| **/association/events** | Danh sách Sự kiện | Nhấn "Đăng ký tham dự" | `POST /api/events/register` | `event_registrations (event_id, member_id)` | Kiểm tra `capacity`, sinh `qr_payload` ngẫu nhiên |
| **/checkin** | Trạm Quét QR Lễ tân | Quét mã QR của đại biểu | `POST /api/events/checkin-verify`| `event_registrations (checked_in_at, status)` | Nhận diện trong < 200ms, chống quét trùng lặp |
| **/association/renew/pay**| Màn hình NỘP HỘI PHÍ| Quét mã VietQR chuyển khoản | `GET /api/fees/invoices/my-latest`| `invoices (amount, invoice_no, due_date)` | VietQR Napas 247 đúng số tài khoản và cú pháp |
| **/association/renew/result**| Kết quả Gia hạn | Xem chứng nhận gia hạn | `GET /api/renewal/status` | `members.term_end`, `renewal_audit_log` | Hạn thẻ tự động cộng thêm đúng 1 năm (`+1 year`) |
| **/association/card** | Thẻ Visit Card Doanh Nhân | Chạm lật thẻ & Tải vCard | `GET /api/public/card/{slug}.vcf` | `members`, `member_business_cards` | Trả về chuẩn `text/vcard; charset=utf-8` |
| **/connect-app/moment** | Bảng tin B2B Social | Đăng bài nhu cầu hợp tác | `POST /api/moments` | `business_relationship_moments` | Ràng buộc `brm_target_xor` (`target_kind = connection`)|
| **/connect-app/network**| Mạng lưới Doanh nhân | Nhấn "Gửi lời mời kết nối" | `POST /api/connections/request` | `connections (owner_id, peer_id, status)` | Trạng thái ban đầu `pending`, sau duyệt `accepted` |
| **/connect-app/inbox** | Khung chat 1-on-1 | Gửi tin nhắn tức thời | `POST /api/messages/direct` | `direct_messages (thread_id, body)` | Realtime WebSocket, mã hóa ký tự UTF-8 |
| **/business-connect/meetings**| Lên lịch hẹn B2B | Đề xuất khung giờ họp 1-1 | `POST /api/meetings/schedule` | `business_meetings (status, meeting_type)` | Enum hợp lệ: `networking`, `in_person`, `confirmed` |
| **/finance-report** | Báo cáo Tài chính CRM | Xem sổ cái thu chi | `GET /api/finance/ledger` | `transactions (type, amount, date)` | Tính cân đối: `Tổng Thu - Tổng Chi = Tồn Quỹ` |

---

# 4. MA TRẬN PHÂN ĐỊNH RANH GIỚI VALIDATION (3 TẦNG BẢO VỆ)

Để bảo đảm hệ thống vận hành mượt mà, ngăn ngừa lỗi 100% trước khi lưu vào CSDL, hệ thống áp dụng kiến trúc kiểm định 3 lớp:

```
┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
│     TẦNG 1: CLIENT-SIDE   │      │     TẦNG 2: BACKEND DTO   │      │     TẦNG 3: DATABASE      │
│      (Zod Form Resolver)  │ ───► │      (NestJS Class-Val)   │ ───► │     (Postgres Constraints)│
│  • Báo lỗi ngay tức thì   │      │  • Kiểm tra logic nghiệp vụ│     │  • Ràng buộc toàn vẹn     │
│  • Kiểm tra rỗng, định dạng│     │  • Kiểm tra quyền hạn RBAC │      │  • Khóa ngoại, Check-cons │
└───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘
```

1. **Tầng 1 (Client Fast Feedback)**: Sử dụng React Hook Form kết hợp Zod schema kiểm tra số điện thoại (10 chữ số), định dạng email chuẩn, số tiền phải lớn hơn 0, mã số thuế gồm 10-13 chữ số.
2. **Tầng 2 (Dual Validation - NestJS Pipes)**: Kiểm tra chéo dữ liệu tại Backend, xác minh chữ ký JWT, bảo đảm người dùng không giả mạo số tiền NỘP HỘI PHÍ hoặc tự ý thay đổi vai trò Admin.
3. **Tầng 3 (Deep Database Integrity)**: Toàn vẹn dữ liệu ở cấp độ cơ sở dữ liệu với các ràng buộc:
   - `invoices_status_check`: Chỉ nhận `'paid'`, `'unpaid'`, `'overdue'`.
   - `brm_target_xor`: Không bao giờ cho phép bản ghi moment mồ côi không có đối tượng liên kết.
   - `FOREIGN KEY ON DELETE CASCADE`: Khi xóa một sự kiện, toàn bộ đăng ký của sự kiện đó tự động được dọn dẹp sạch sẽ.

---

# 5. DANH MỤC THÀNH PHẦN GIAO DIỆN TÁI SỬ DỤNG (DRY UI COMPONENTS)

Để duy trì tính nhất quán giao diện trên toàn bộ 220+ trang web và ứng dụng, các components cốt lõi sau được đóng gói dùng chung:

1. **`MemberShell.tsx`**: Khung bao giao diện ứng dụng di động Hiệp hội (`/association`), tích hợp sẵn thanh tiêu đề thương hiệu động và Bottom Navigation 5 tab chuẩn xác.
2. **`ViOneLogo.tsx`**: Logo vector SVG độc bản của ViOne với chữ "O" khuyết góc và chấm kim cương, tự động đổi màu theo theme.
3. **`CinemaSeatingMap.tsx`**: Bàn cờ ghế khán phòng và dải ghế sân khấu VIP (`SK-01` đến `SK-06`), hỗ trợ phóng to thu nhỏ (Pan/Zoom) và gán đại biểu tức thì.
4. **`AuthCardScanSheet.tsx`**: Modal quét thẻ thông minh NFC / QR Code tốc độ cao, tích hợp camera zxing nhận diện mã đa định dạng.
5. **`StatusBadge.tsx`**: Huy hiệu hiển thị trạng thái chuẩn hóa màu sắc cho 4 trạng thái hội phí (*Renewed, Due, Overdue, Upcoming*) và trạng thái hóa đơn (*Paid, Unpaid*).
