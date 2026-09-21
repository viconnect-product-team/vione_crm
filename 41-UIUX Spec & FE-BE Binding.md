# ĐẶC TẢ GIAO DIỆN & BẢN ĐỒ LIÊN KẾT FE-BE DỰ ÁN VIONE
## VIONE BUSINESS CONNECT ECOSYSTEM — UI/UX SPEC & FE-BE BINDING STANDARD

---

## 📌 TRANG BÌA & THÔNG TIN DỰ ÁN

*   **Tên dự án:** Hệ thống Kết nối và Số hóa Doanh nghiệp ViOne (ViOne Business Connect Ecosystem)
*   **Tên tài liệu:** Đặc tả Giao diện Chi tiết & Bản đồ Ánh xạ Liên kết FE-BE (UI/UX Specification & FE-BE Data Binding Map)
*   **Mã tài liệu:** `VIONE-UIUX-BIND-04`
*   **Phiên bản:** `2.0.0`
*   **Ngày ban hành:** 08/09/2026
*   **Bộ phận biên soạn:** Phòng Nghiệp vụ & Kiến trúc Hệ thống (Senior BA / UI-UX Lead / SA Team)
*   **Trạng thái:** Đã phê duyệt & Ban hành chính thức (Approved & Baseline)
*   **Mức độ bảo mật:** Nội bộ (Internal Confidential)

### Lịch sử Thay đổi Phiên bản

| Phiên bản | Ngày | Tác giả | Trạng thái | Nội dung thay đổi |
| :--- | :--- | :--- | :--- | :--- |
| **0.1.0** | 25/08/2026 | BA Team | Nháp | Khởi thảo các quy tắc mô tả UI/UX và ranh giới validation. |
| **1.0.0** | 28/08/2026 | BA/SA Lead | Phê duyệt | Hoàn thiện tài liệu, xây dựng bản đồ mapping API cơ bản và nguyên tắc DRY UI. |
| **2.0.0** | 08/09/2026 | Senior BA/SA Lead | Phát hành | Mở rộng toàn diện đặc tả UI/UX và Binding Map cho toàn bộ 10 phân hệ dự án: Giao diện Đăng nhập đa kênh, Hồ sơ số & Thẻ NFC/QR, Quét QR live Zalo & Chụp OCR danh thiếp, Sàn B2B, Lịch hẹn 1-on-1, Điểm danh sự kiện, Cổng thẩm định hội viên CLB CEO 1983 / Hiệp hội, Chọn 8 ngôn ngữ i18n, Hệ thống Landing Modular và Bảng ma trận Validation 3 cấp độ. |

---

## 📑 MỤC LỤC TỔNG THỂ

1. [PHẦN 1: HỆ THỐNG THIẾT KẾ & QUY CHUẨN DESIGN SYSTEM (UI/UX DESIGN TOKENS)](#phần-1-hệ-thống-thiết-kế--quy-chuẩn-design-system)
   - 1.1 Triết lý Thiết kế: Luxury Dark Theme & Ánh kim Champagne Gold
   - 1.2 Bảng màu Chuẩn (Color Palette & Tokens)
   - 1.3 Quy chuẩn Kiểu chữ (Typography Hierarchy)
   - 1.4 Hiệu ứng Chiều sâu, Kính mờ (Glassmorphism) & Micro-animations
2. [PHẦN 2: TIÊU CHUẨN BA ĐẶC TẢ CẤU PHẦN GIAO DIỆN TRÊN SRS](#phần-2-tiêu-chuẩn-ba-đặc-tả-cấu-phần-giao-diện-trên-srs)
   - 2.1 Tiêu chí nghiệm thu mô tả UI (Acceptance Criteria for UI Descriptions)
   - 2.2 Bảng đối chiếu: Mô tả Sơ sài (Bị Reject) vs Mô tả Chuẩn mực (Đạt chuẩn Senior BA)
3. [PHẦN 3: BẢN ĐỒ ÁNH XẠ DỮ LIỆU LIÊN KẾT FE-BE (DATA BINDING MAP)](#phần-3-bản-đồ-ánh-xạ-dữ-liệu-liên-kết-fe-be)
   - 3.1 [M-01]: Màn hình Đăng nhập Đa kênh (Google SSO, Apple ID, Email)
   - 3.2 [M-02]: Trang chủ Di động & Activity Briefing (Work Hub, Today Tasks)
   - 3.3 [M-03]: Thẻ Danh thiếp Thông minh & Chạm 1-Tap NFC
   - 3.4 [M-04]: Quét QR Trực tiếp Live Camera (Zalo-style) & OCR Danh thiếp Giấy
   - 3.5 [M-05]: Hồ sơ Hội viên & Bộ chuyển đổi Đa ngôn ngữ (8 Ngôn ngữ)
   - 3.6 [M-06]: Sàn Giao thương B2B (Đăng tin Cung - Cầu & AI Matching)
   - 3.7 [M-07]: Điều phối Cuộc hẹn Giao thương 1-on-1 (Propose & Confirm)
   - 3.8 [M-08]: Quản trị Sự kiện, Vé điện tử & Check-in QR/NFC
   - 3.9 [M-09]: Cổng Thẩm định & Phê duyệt Hội viên (CRM Web & Mobile Admin)
   - 3.10 [M-10]: Hệ thống Template Landing Page Modular (ViOne & CEO 1983)
4. [PHẦN 4: MA TRẬN PHÂN ĐỊNH RANH GIỚI VALIDATION (CLIENT VS SERVER)](#phần-4-ma-trận-phân-định-ranh-giới-validation)
   - 4.1 Phân cấp 3 cấp độ Validation: UX Fast Feedback, Dual-validation, Deep Backend
   - 4.2 Bảng ma trận chi tiết theo từng đối tượng dữ liệu
5. [PHẦN 5: KIẾN TRÚC DRY UI COMPONENTS & QUY TẮC TÁI SỬ DỤNG](#phần-5-kiến-trúc-dry-ui-components--quy-tắc-tái-sử-dụng)
   - 5.1 Danh mục Thành phần Dùng chung (Core Reusable Components)
   - 5.2 Quyền tự chủ Tối ưu UX (UX Refactoring Autonomy)
   - 5.3 Cổng Kiểm soát Trùng lặp Giao diện (Reject Gate DRY-UI)

---

# PHẦN 1: HỆ THỐNG THIẾT KẾ & QUY CHUẨN DESIGN SYSTEM

## 1.1 Triết lý Thiết kế: Luxury Dark Theme & Ánh kim Champagne Gold
Dự án ViOne phục vụ phân khúc Doanh nhân, Chủ tịch tập đoàn, CEO và Lãnh đạo Hiệp hội cấp cao. Giao diện toàn hệ thống áp dụng triết lý **Luxury Modernism**:
- **Không gian nền sâu thẳm**: Sử dụng các gam màu đen huyền bí `#0B0C10` và xanh bóng đêm obsidian `#090D16`, `#0F172A` làm nền chủ đạo, mang lại cảm giác bảo mật, đẳng cấp và tập trung cao độ.
- **Điểm nhấn Kim loại Quý (Champagne Gold / Metallic Bronze)**: Các đường viền (borders), nút hành động chính (Primary CTA), biểu tượng VIP sử dụng dải màu gradient ánh kim vàng óng (`#D4AF37`, `#F59E0B`, `#C5A880`) tạo sự thịnh vượng, uy tín của giới doanh nhân.
- **Độ tương phản cao & Công thái học di động**: Mọi thành phần tương tác trên Mobile App được thiết kế với chiều cao ngón tay tối thiểu 44px (Tap Target Size), giảm thiểu thao tác cuộn (Zero-scroll Mobile Login).

## 1.2 Bảng màu Chuẩn (Color Palette Tokens)

| Tên Token | Mã màu Hex / HSL | Ứng dụng trong Giao diện |
| :--- | :--- | :--- |
| `--bg-luxury-base` | `#0B0C10` | Nền chính của Landing Page CEO 1983, Mobile App & Header |
| `--bg-luxury-surface` | `#111827` / `#1F2937` | Nền của Thẻ (Cards), Hộp thoại Modal, Bottom Sheet |
| `--bg-luxury-elevated` | `#1E293B` | Nền của Ô nhập liệu (Inputs), Dropdowns, Hover states |
| `--accent-gold-primary` | `#D4AF37` / `#F59E0B` | Nút bấm chính, Viền viền thẻ VIP, Icon nổi bật |
| `--accent-gold-gradient`| `linear-gradient(135deg, #FDE68A 0%, #D4AF37 50%, #92400E 100%)` | Huy hiệu Hội viên Chính thức, Laser Scanner Bar, Hero Header |
| `--text-luxury-heading`| `#F9FAFB` | Tiêu đề chính H1, H2, Tên Doanh nhân |
| `--text-luxury-body`   | `#D1D5DB` | Văn bản nội dung, Mô tả cơ hội kinh doanh |
| `--text-luxury-muted`  | `#9CA3AF` | Nhãn phụ, Thời gian, Số lượng đếm |
| `--status-success`     | `#10B981` (Emerald) | Đã phê duyệt, Check-in thành công, B2B Khớp lệnh |
| `--status-warning`     | `#F59E0B` (Amber) | Chờ xét duyệt hồ sơ, Đề xuất đang chờ phản hồi |
| `--status-danger`      | `#EF4444` (Rose) | Từ chối hồ sơ, Hủy lịch hẹn, Lỗi kết nối |

## 1.3 Quy chuẩn Kiểu chữ (Typography Hierarchy)
- **Font chữ Chủ đạo**: Google Fonts `Outfit`, `Plus Jakarta Sans`, `Inter`.
- **Cấp bậc văn bản**:
  - `Display / Hero Title`: 32px – 44px (Mobile), 48px – 64px (Desktop), Weight 700/800, Tracking tight.
  - `Section Header (H2)`: 22px – 28px, Weight 700, Gold gradient text.
  - `Card Title (H3)`: 16px – 18px, Weight 600, Text white.
  - `Body Text`: 14px – 15px, Line-height 1.5, Text neutral-200.
  - `Caption / Badge`: 11px – 12px, Weight 600, Uppercase, Tracking wider.

## 1.4 Hiệu ứng Kính mờ (Glassmorphism) & Micro-animations
- **Hiệu ứng Kính mờ (Backdrop Blur)**: Mọi Modal, Bottom Sheet, Floating Action Bar sử dụng `backdrop-blur-md bg-black/60 border border-white/10`.
- **Hiệu ứng Quét Laser (Zalo-style Scanner)**: Thanh quét tia đỏ/vàng lướt từ trên xuống dưới liên tục `animation: scan-laser 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`.
- **Hiệu ứng Chạm Sóng NFC (Ripple Waves)**: 3 vòng tròn đồng tâm mở rộng và mờ dần `scale(1) -> scale(2.2), opacity 0.8 -> 0` khi kích hoạt NFC Listener.

---

# PHẦN 2: TIÊU CHUẨN BA ĐẶC TẢ CẤU PHẦN GIAO DIỆN TRÊN SRS

Để đảm bảo Dev-FE và các AI Sub-agent triển khai chính xác 100% không cần phỏng đoán, mọi đặc tả cấu phần UI của BA phải tuân thủ chuẩn Senior BA:

## 2.1 Tiêu chí Nghiệm thu Mô tả UI
1. **Nguồn cấp dữ liệu (Data Source)**: Phải chỉ rõ dữ liệu tĩnh (static enum) hay dữ liệu động từ API nào (`GET /...`).
2. **Trạng thái Đầy đủ (UI States)**: Phải mô tả đủ 5 trạng thái: `Initial / Empty`, `Loading / Skeleton`, `Success / Data Rendered`, `Error / Retry`, `Disabled / Read-only`.
3. **Phản hồi Tương tác (Interaction Feedback)**: Phải chỉ rõ hiệu ứng khi Click/Tap: Mở Sheet, rung xúc giác Haptic, Toast thông báo, hoặc Điều hướng.

## 2.2 Bảng Đối chiếu Chất lượng Mô tả BA

| Thành phần UI | Mô tả Sơ sài (Bị Reject) | Mô tả Chuẩn mực (Senior BA Accept) |
| :--- | :--- | :--- |
| **Dropdown Ngôn ngữ** | "Người dùng chọn ngôn ngữ ở góc trên." | "Lưới chọn 8 Ngôn ngữ tại Modal [LanguagePickerModal] trong màn hình Profile: Hiển thị 8 quốc kỳ và tên bản ngữ (`vi`, `en`, `km`, `my`, `lo`, `ja`, `ko`, `zh`). Item đang chọn hiển thị viền vàng và icon checkmark. Click cập nhật ngay lập tức vào Local Storage `app_locale` và gọi `i18n.changeLanguage(code)`." |
| **Nút Quét QR / NFC** | "Bấm nút để quét mã." | "Nút tròn nổi (Floating Action Button) chính giữa thanh điều hướng đáy: Biểu tượng Scanner mạ vàng. Nhấp vào mở Action Sheet với 2 tab: Tab 1 Quét QR qua Live Camera Zalo (tự động nhận diện chuỗi URL vione.app/c/...), Tab 2 Chạm thẻ thông minh 1-Tap NFC. Hỗ trợ nút Bật/Tắt đèn Flash và chọn ảnh từ thư viện." |
| **Bảng Duyệt Hội viên** | "Admin xem danh sách và bấm nút duyệt." | "Bảng danh sách đơn đăng ký gia nhập CLB CEO 1983 tại [Web CRM /members]: Tab lọc 'Chờ xét duyệt' (`status=PENDING`). Cột thông tin: Họ tên, Doanh nghiệp, Chức vụ, Chi hội đăng ký, Ngày nộp. Nút 'Phê duyệt' mở Dialog xác nhận: tự động sinh mã hội viên gợi ý (VD: `CEO1983-HN-088`), cho phép gán Chi hội và gửi email chúc mừng kèm tài khoản kích hoạt." |

---

# PHẦN 3: BẢN ĐỒ ÁNH XẠ DỮ LIỆU LIÊN KẾT FE-BE (DATA BINDING MAP)

Bản đồ dưới đây là **Kim chỉ nam Duy nhất (Single Source of Truth)** ánh xạ trực tiếp từ hành động người dùng trên màn hình giao diện sang API Backend và DTO tương ứng.

```
+-----------------------------------------------------------------------------------+
|                            VIONE FE-BE DATA BINDING MAP                           |
+-----------------------------------------------------------------------------------+
| [UI Component / Action]                                                           |
|       │                                                                           |
|       ▼                                                                           |
| [Zod Schema Client Validation] ──► (Invalid) ──► Show In-line Error Tooltip       |
|       │ (Valid)                                                                   |
|       ▼                                                                           |
| [HTTP Request: Endpoint + Method + Auth Header Bearer JWT]                        |
|       │                                                                           |
|       ▼                                                                           |
| [NestJS Controller DTO Validation] ──► (Invalid) ──► Return 400 Bad Request       |
|       │ (Valid)                                                                   |
|       ▼                                                                           |
| [Service Domain Logic + Prisma Transaction]                                       |
|       │                                                                           |
|       ▼                                                                           |
| [Display-Ready JSON Response] ──► React Query Cache Invalidation ──► UI Transition |
+-----------------------------------------------------------------------------------+
```

---

## 3.1 [M-01]: Màn hình Đăng nhập Đa kênh (Mobile Sign-In)

### 3.1.1 Giao diện & Thành phần
- **Component Path:** [ConnectAppSignIn.tsx](file:///d:/download/VICONNECT/VIONE_PROJECT/vione_app/apps/vione_app_fe/src/components/business-connect/mobile/ConnectAppSignIn.tsx)
- **Định tuyến Route:** `/m/auth/login` hoặc `/connect-app/auth/login`
- **Bố cục:** Zero-scroll compact layout, Logo ViOne mạ vàng nổi bật, 2 nút SSO lớn (Google, Apple), Form Email/Password, Nút Quên mật khẩu & Chuyển đổi Đăng ký.

### 3.1.2 Bảng Ánh xạ Dữ liệu (Binding Table)
| Nút / Sự kiện Trigger | Method & Endpoint | Payload Gửi đi (Request DTO) | Dữ liệu Trả về (Response DTO) | Trạng thái Xử lý (On Success) |
| :--- | :--- | :--- | :--- | :--- |
| **Click "Tiếp tục với Google"** | `POST /api/v1/auth/google` | `{ idToken: "eyJhbGciOi..." }` | `{ accessToken: "...", user: { id, email, fullName, role, memberCode } }` | Lưu JWT vào `localStorage` & `SecureStorage`, định tuyến vào `/m` hoặc `/connect-app`. |
| **Click "Đăng nhập bằng Apple"** | `POST /api/v1/auth/apple` | `{ identityToken: "...", authorizationCode: "..." }` | `{ accessToken: "...", user: { ... } }` | Lưu JWT, cập nhật trạng thái phiên, chuyển hướng trang chủ. |
| **Submit Form "Đăng nhập"** | `POST /api/v1/auth/login` | `{ email: "ceo@corp.vn", password: "••••••••", rememberMe: true }` | `{ accessToken: "...", user: { ... }, activeSessionId: "sess_123" }` | Hiển thị Toast "Đăng nhập thành công", chuyển hướng trang chủ di động. |
| **Click "Quên mật khẩu?"** | `POST /api/v1/auth/forgot-password` | `{ email: "ceo@corp.vn" }` | `{ success: true, message: "OTP_SENT" }` | Chuyển sang màn hình nhập mã OTP 6 chữ số. |

---

## 3.2 [M-02]: Trang chủ Di động & Activity Briefing (Work Hub)

### 3.2.1 Giao diện & Thành phần
- **Component Path:** `apps/vione_app_fe/src/routes/m.index.tsx` & `connect-app.index.tsx`
- **Bố cục:** Header chào mừng Doanh nhân (Avatar, Tên, Mã Hội viên VIP), Thẻ Pass QR Danh thiếp nhanh, Thanh công cụ Chạm NFC / Quét mã, Khối "Việc hôm nay (Work Hub)" và Danh sách sự kiện sắp diễn ra.

### 3.2.2 Bảng Ánh xạ Dữ liệu (Binding Table)
| Nút / Sự kiện Trigger | Method & Endpoint | Payload Gửi đi | Dữ liệu Trả về | Trạng thái Xử lý (On Success) |
| :--- | :--- | :--- | :--- | :--- |
| **Mount Screen (Vào trang chủ)** | `GET /api/v1/connect-app/briefing` | *None (Headers: Bearer Token)* | `{ profile: { fullName, avatarUrl, memberCode, tier }, todayTasks: [...], pendingMeetingsCount: 2, unreadNotifications: 5 }` | Render thẻ VIP Member Pass, hiển thị Badge đỏ tại Icon Thông báo, render danh sách task vào `TodayItem`. |
| **Kéo làm mới (Pull-to-refresh)** | `GET /api/v1/connect-app/briefing` | *None* | `{ ...briefingData }` | Cập nhật lại React Query Cache `['briefing']`, tắt hiệu ứng xoay spinner sau 300ms. |
| **Click vào Cuộc hẹn chờ xử lý** | `GET /api/v1/meetings/:id` | *Query params* | `{ id, title, partner: { fullName, company }, proposedSlots: [...] }` | Mở Bottom Sheet xem chi tiết và duyệt lịch hẹn 1-on-1. |

---

## 3.3 [M-03]: Thẻ Danh thiếp Thông minh & Chạm 1-Tap NFC

### 3.3.1 Giao diện & Thành phần
- **Component Path:** [TapToConnectSheet.tsx](file:///d:/download/VICONNECT/VIONE_PROJECT/vione_app/apps/vione_app_fe/src/components/business-connect/mobile/TapToConnectSheet.tsx) & [AuthCardScanSheet.tsx](file:///d:/download/VICONNECT/VIONE_PROJECT/vione_app/apps/vione_app_fe/src/components/business-connect/mobile/AuthCardScanSheet.tsx)
- **Bố cục:** Modal Kính mờ trượt từ đáy, Hình minh họa thẻ NFC phát sóng vòng tròn (Animated Pulse Waves), Trạng thái "Đang sẵn sàng chạm thẻ..." chuyển sang "Đã kết nối thành công!".

### 3.3.2 Bảng Ánh xạ Dữ liệu (Binding Table)
| Nút / Sự kiện Trigger | Method & Endpoint | Payload Gửi đi | Dữ liệu Trả về | Trạng thái Xử lý (On Success) |
| :--- | :--- | :--- | :--- | :--- |
| **Native NFC Tag Detected** | `POST /api/v1/cards/tap-exchange` | `{ nfcUid: "04:5A:B2:C1:...", targetCardSlug: "nguyen-van-a-ceo" }` | `{ success: true, targetUser: { id, fullName, title, companyName, phone, email, avatarUrl, bio }, exchangedAt: "2026-09-08T..." }` | Rung phản hồi haptic `Haptics.impact({ style: ImpactStyle.Heavy })`, phát âm thanh chuông kết nối, lưu tự động vào Danh bạ đối tác `person_nodes`. |
| **Click "Lưu vào Danh bạ Điện thoại"** | *Client Local Action* | `{ vCardData: "BEGIN:VCARD..." }` | *Native OS Contact API* | Mở ứng dụng Danh bạ mặc định của iOS/Android với toàn bộ thông tin điền sẵn. |

---

## 3.4 [M-04]: Quét QR Trực tiếp Live Camera (Zalo-Style) & OCR Danh thiếp Giấy

### 3.4.1 Giao diện & Thành phần
- **Component Path:** `apps/vione_app_fe/src/components/business-connect/mobile/ScannerModal.tsx`
- **Bố cục:** Toàn màn hình (Full-screen Camera Preview), 4 góc căn nét vàng kim sang trọng (Corner brackets), Thanh laser đỏ/vàng quét liên tục từ trên xuống, Nút Bật đèn Flash, Nút Chọn ảnh từ thư viện, Tab chuyển đổi giữa "Quét mã QR" và "Chụp danh thiếp giấy (OCR)".

### 3.4.2 Bảng Ánh xạ Dữ liệu (Binding Table)
| Nút / Sự kiện Trigger | Method & Endpoint | Payload Gửi đi | Dữ liệu Trả về | Trạng thái Xử lý (On Success) |
| :--- | :--- | :--- | :--- | :--- |
| **Live QR Code Decoded** | `GET /api/v1/cards/resolve?url=...` | `{ rawPayload: "https://vione.app/c/ceo-1983-tran-hung" }` | `{ isValid: true, cardType: "MEMBER_PROFILE", profileData: { id, fullName, company, phone, email, avatarUrl } }` | Dừng camera stream, rung haptic, tự động chuyển hướng đến màn hình xem Hồ sơ số của đối tác. |
| **Chụp ảnh danh thiếp (OCR Snap)** | `POST /api/v1/ocr/business-card` | `FormData: { file: (Binary Image Bitmap), quality: "high" }` | `{ status: "SUCCESS", extracted: { fullName: "Trần Văn Hùng", companyName: "Tập đoàn ABC", position: "Chủ tịch HĐQT", phone: "0912345678", email: "hungtv@abc.vn", address: "Hà Nội" }, confidenceScore: 0.96 }` | Mở Form xác nhận thông tin đã bóc tách, cho phép Doanh nhân chỉnh sửa nhanh trước khi bấm "Lưu vào Danh bạ". |
| **Xác nhận lưu danh thiếp OCR** | `POST /api/v1/contacts/person-nodes` | `{ fullName: "Trần Văn Hùng", companyName: "Tập đoàn ABC", phone: "0912345678", email: "hungtv@abc.vn", cardImageUrl: "https://s3.../card1.jpg" }` | `{ id: "node_999", message: "CONTACT_SAVED" }` | Đóng Scanner Modal, hiển thị Toast "Đã lưu danh thiếp vào Sổ tay Doanh nhân", reload danh sách đối tác. |

---

## 3.5 [M-05]: Hồ sơ Hội viên & Bộ chuyển đổi Đa ngôn ngữ (8 Ngôn ngữ)

### 3.5.1 Giao diện & Thành phần
- **Component Path:** `apps/vione_app_fe/src/routes/m.profile.tsx` & `connect-app.me.index.tsx`
- **Bố cục:** Ảnh bìa doanh nghiệp, Avatar mạ viền vàng, Mã QR cá nhân, Danh sách menu chức năng: Thông tin cá nhân, Doanh nghiệp của tôi, Cài đặt bảo mật, **Ngôn ngữ hệ thống (Lưới 8 quốc gia)**, Đăng xuất.

### 3.5.2 Bảng Ánh xạ Dữ liệu (Binding Table)
| Nút / Sự kiện Trigger | Method & Endpoint | Payload Gửi đi | Dữ liệu Trả về | Trạng thái Xử lý (On Success) |
| :--- | :--- | :--- | :--- | :--- |
| **Chọn Ngôn ngữ (Lưới 8 cờ)** | *Client i18n Action* & `POST /api/v1/users/me/preferences` | `{ preferredLanguage: "ja" }` *(hoặc vi, en, km, my, lo, ko, zh)* | `{ success: true, preferredLanguage: "ja" }` | Lưu `app_locale="ja"` vào Local Storage, kích hoạt `i18n.changeLanguage("ja")`, toàn bộ giao diện chuyển ngữ ngay tức thì không cần tải lại trang. |
| **Cập nhật Hồ sơ Doanh nhân** | `PUT /api/v1/users/me/profile` | `{ fullName: "...", title: "CEO", companyName: "...", bio: "...", socialLinks: { linkedin, zalo, website } }` | `{ success: true, updatedProfile: { ... } }` | Hiển thị Toast "Cập nhật hồ sơ thành công", đồng bộ dữ liệu hiển thị trên Danh thiếp số. |
| **Tải lên Avatar / Ảnh bìa** | `POST /api/v1/media/upload` | `FormData: { file: (Image), type: "AVATAR" }` | `{ fileUrl: "https://storage.vione.vn/avatars/u_123.webp" }` | Cập nhật ngay ảnh đại diện trên giao diện, tự động tối ưu hóa WebP chuẩn kích thước. |

---

## 3.6 [M-06]: Sàn Giao thương B2B (Đăng tin Cung - Cầu & AI Matching)

### 3.6.1 Giao diện & Thành phần
- **Component Path:** `apps/vione_app_fe/src/routes/b2b.index.tsx` & `apps/vione_app_fe/src/routes/m.b2b.tsx`
- **Bố cục:** Thanh tìm kiếm đa năng kèm bộ lọc ngành nghề (Xây dựng, Bất động sản, Công nghệ, Nông nghiệp...), 2 Tab lớn: "Nhu cầu Mua / Cần Tìm Đối Tác (DEMAND)" và "Sản phẩm Cung Ứng / Năng Lực (SUPPLY)", Nút Đăng tin nổi mạ vàng.

### 3.6.2 Bảng Ánh xạ Dữ liệu (Binding Table)
| Nút / Sự kiện Trigger | Method & Endpoint | Payload Gửi đi | Dữ liệu Trả về | Trạng thái Xử lý (On Success) |
| :--- | :--- | :--- | :--- | :--- |
| **Tìm kiếm & Lọc cơ hội B2B** | `GET /api/v1/b2b/opportunities` | `Query: { type: "DEMAND", industry: "TECH", page: 1, limit: 10 }` | `{ items: [ { id, title, budget, description, creator: { fullName, company } } ], totalCount: 45, cursor: "..." }` | Render danh sách cơ hội giao thương dạng Card sang trọng với tag ngành nghề rõ ràng. |
| **Submit Form "Đăng tin B2B mới"** | `POST /api/v1/b2b/opportunities` | `{ title: "Tìm nhà cung cấp vật liệu xây dựng", type: "DEMAND", industryCode: "CONSTRUCTION", budgetMin: 500000000, budgetMax: 2000000000, validUntil: "2026-12-31" }` | `{ id: "b2b_789", status: "ACTIVE", matchedSuppliersCount: 4 }` | Đóng Modal đăng tin, hiển thị thông báo "Đăng tin thành công! AI đã tìm thấy 4 nhà cung cấp tiềm năng trong Hiệp hội", chuyển về danh sách tin của tôi. |
| **Click "Kết nối / Gửi chào giá"** | `POST /api/v1/b2b/opportunities/:id/connect` | `{ proposalMessage: "Chào anh, công ty tôi chuyên phân phối...", quotationUrl: "https://..." }` | `{ connectionId: "conn_111", status: "PENDING" }` | Chuyển nút thành "Đã gửi đề xuất kết nối", mở luồng Chat trực tiếp với chủ tin đăng. |

---

## 3.7 [M-07]: Điều phối Cuộc hẹn Giao thương 1-on-1 (Propose & Confirm)

### 3.7.1 Giao diện & Thành phần
- **Component Path:** `apps/vione_app_fe/src/components/business-connect/meetings/ProposeMeetingModal.tsx`
- **Bố cục:** Form chọn đối tác, Tiêu đề cuộc gặp, Địa điểm (Trực tiếp tại văn phòng / Online qua Google Meet / Zoom), Lưới chọn tối đa 3 khung giờ đề xuất (Multi-slot selection).

### 3.7.2 Bảng Ánh xạ Dữ liệu (Binding Table)
| Nút / Sự kiện Trigger | Method & Endpoint | Payload Gửi đi | Dữ liệu Trả về | Trạng thái Xử lý (On Success) |
| :--- | :--- | :--- | :--- | :--- |
| **Submit "Gửi lời mời gặp 1-on-1"** | `POST /api/v1/meetings/propose` | `{ targetUserId: "usr_partner", title: "Thảo luận hợp tác phân phối độc quyền", locationType: "OFFLINE", locationAddress: "Tầng 12, Keangnam Landmark", proposedSlots: [ { startAt: "2026-09-15T09:00:00Z", endAt: "2026-09-15T10:30:00Z" }, { startAt: "2026-09-16T14:00:00Z", endAt: "2026-09-16T15:30:00Z" } ] }` | `{ meetingId: "mtg_456", status: "PROPOSED", message: "PROPOSAL_DISPATCHED" }` | Đóng Modal, gửi thông báo đẩy (Push Notification) đến đối tác, chèn lịch hẹn vào trạng thái "Chờ phản hồi". |
| **Đối tác Click "Chấp nhận khung giờ 1"** | `POST /api/v1/meetings/:id/accept` | `{ selectedSlotId: "slot_01", note: "Tôi sẽ có mặt đúng giờ." }` | `{ meetingId: "mtg_456", status: "CONFIRMED", confirmedSlot: { ... } }` | Trạng thái chuyển thành "Đã chốt lịch" (Xanh lá), tự động đồng bộ sự kiện vào Google Calendar / Apple Calendar của cả hai bên. |
| **Đối tác Click "Từ chối / Đề xuất giờ khác"** | `POST /api/v1/meetings/:id/decline` | `{ reason: "Bận công tác", counterSlots: [ ... ] }` | `{ meetingId: "mtg_456", status: "RESCHEDULED" }` | Cập nhật trạng thái, thông báo lại cho người khởi tạo cuộc hẹn. |

---

## 3.8 [M-08]: Quản trị Sự kiện, Vé điện tử & Check-in QR/NFC

### 3.8.1 Giao diện & Thành phần
- **Component Path:** `apps/vione_app_fe/src/routes/events.index.tsx` & `apps/vione_app_fe/src/routes/m.events.tsx`
- **Bố cục:** Banner sự kiện nổi bật (Hình ảnh chất lượng cao, Thời gian, Địa điểm), Số lượng chỗ còn lại (Live seat counter), Nút "Đăng ký tham gia", Vé điện tử E-Ticket chứa mã QR mã hóa động.

### 3.8.2 Bảng Ánh xạ Dữ liệu (Binding Table)
| Nút / Sự kiện Trigger | Method & Endpoint | Payload Gửi đi | Dữ liệu Trả về | Trạng thái Xử lý (On Success) |
| :--- | :--- | :--- | :--- | :--- |
| **Click "Đăng ký tham gia Sự kiện"** | `POST /api/v1/events/:id/register` | `{ dietaryRequirement: "VEGETARIAN", companionCount: 0 }` | `{ ticketId: "tkt_888", qrCodeString: "VIONE-EVT-888-HASH", seatNumber: "A-12", status: "CONFIRMED" }` | Hiển thị Vé điện tử VIP chứa mã QR, nút "Thêm vào Apple Wallet / Google Wallet", hiển thị số ghế được phân bổ. |
| **Ban Tổ chức Quét QR Check-in** | `POST /api/v1/events/:id/checkin` | `{ qrCodeString: "VIONE-EVT-888-HASH" }` | `{ success: true, attendee: { fullName: "Nguyễn Văn A", company: "CEO Corp", seatNumber: "A-12" }, checkinTime: "2026-09-20T08:15:00Z" }` | Màn hình Admin hiện tick xanh lớn: "Chào mừng Doanh nhân Nguyễn Văn A - Ghế A-12", phát âm thanh "Welcome", cập nhật sĩ số tham gia tức thì. |

---

## 3.9 [M-09]: Cổng Thẩm định & Phê duyệt Hội viên (CRM Web & Mobile Admin)

### 3.9.1 Giao diện & Thành phần
- **Component Path:** `apps/vione_app_fe/src/routes/members.index.tsx`
- **Bố cục Web CRM:** Bảng dữ liệu chuyên nghiệp (Data Table), Bộ lọc trạng thái (`PENDING`, `APPROVED`, `REJECTED`), Bộ lọc Chi hội (Hà Nội, TP.HCM, Đà Nẵng, Quốc tế), Modal Phê duyệt & Cấp mã hội viên, Xem chi tiết Đăng ký kinh doanh đính kèm.

### 3.9.2 Bảng Ánh xạ Dữ liệu (Binding Table)
| Nút / Sự kiện Trigger | Method & Endpoint | Payload Gửi đi | Dữ liệu Trả về | Trạng thái Xử lý (On Success) |
| :--- | :--- | :--- | :--- | :--- |
| **Lọc danh sách "Chờ xét duyệt"** | `GET /api/v1/members` | `Query: { status: "PENDING", branchId: "hn_branch", page: 1, limit: 20 }` | `{ members: [ { id, fullName, companyName, taxCode, position, submittedAt } ], total: 12 }` | Render danh sách ứng viên đăng ký kèm badge cảnh báo vàng cam. |
| **Bấm nút "Phê duyệt Hội viên"** | `POST /api/v1/members/:id/approve` | `{ memberCode: "CEO1983-HN-099", branchId: "hn_branch", assignedTier: "OFFICIAL_VIP", sendWelcomeEmail: true }` | `{ success: true, member: { id, memberCode, status: "APPROVED" } }` | Đóng Modal, đổi trạng thái sang "Đã phê duyệt" (Xanh lá), tự động gửi email chào mừng kèm link tải ứng dụng và mã kích hoạt thẻ NFC. |
| **Bấm nút "Từ chối hồ sơ"** | `POST /api/v1/members/:id/reject` | `{ reason: "Chưa đủ thâm niên doanh nghiệp theo điều lệ CLB", allowReapplyAfterDays: 90 }` | `{ success: true, status: "REJECTED" }` | Cập nhật trạng thái hồ sơ, gửi email phản hồi lý do lịch sự và hướng dẫn nộp lại. |

---

## 3.10 [M-10]: Hệ thống Template Landing Page Modular (ViOne & CEO 1983)

### 3.10.1 Giao diện & Thành phần
- **Component Path:** [AssociationLandingTemplate.tsx](file:///d:/download/VICONNECT/VIONE_PROJECT/vione_app/apps/vione_app_fe/src/components/landing/templates/AssociationLandingTemplate.tsx) & [Ceo1983Landing.tsx](file:///d:/download/VICONNECT/VIONE_PROJECT/vione_app/apps/vione_app_fe/src/components/landing/Ceo1983Landing.tsx)
- **Bố cục:** Navbar cố định (Logo, Menu 6 mục, Nút Đăng ký), Hero Banner ấn tượng, Khối Thách thức & Nỗi đau Doanh nghiệp, Khối Giải pháp Hệ sinh thái, Khối Đội ngũ Lãnh đạo / Đối tác Chiến lược, Khối Cảm nhận Doanh nhân (Testimonials), CTA Banner chân trang & Footer.

### 3.10.2 Bảng Ánh xạ Dữ liệu (Binding Table)
| Nút / Sự kiện Trigger | Method & Endpoint | Payload Gửi đi | Dữ liệu Trả về | Trạng thái Xử lý (On Success) |
| :--- | :--- | :--- | :--- | :--- |
| **Chuyển đổi Ngôn ngữ Landing** | *Client i18n Action* | *Key: `landing.nav.*`, `landing.hero.*`* | *JSON dictionary tương ứng* | Chuyển toàn bộ nội dung Hero, Khối Giải pháp, Đối tác sang ngôn ngữ được chọn mà không đổi cấu trúc DOM. |
| **Click "Đăng ký Gia nhập CLB"** | `POST /api/v1/public/leads/club-registration` | `{ fullName: "Trần Anh Tuấn", phone: "0988776655", email: "tuan.ta@vinacorp.vn", companyName: "VinaCorp", position: "CEO", clubSlug: "ceo-1983" }` | `{ success: true, leadId: "lead_555", message: "Hồ sơ của bạn đã được gửi đến Ban Thư ký CLB CEO 1983." }` | Hiển thị Dialog chúc mừng sang trọng, gửi tin nhắn SMS xác nhận đã nhận đơn ứng tuyển. |

---

# PHẦN 4: MA TRẬN PHÂN ĐỊNH RANH GIỚI VALIDATION (CLIENT VS SERVER)

Hệ thống ViOne thiết lập ranh giới kiểm tra dữ liệu 3 cấp độ nghiêm ngặt nhằm triệt tiêu lỗ hổng bảo mật và tối ưu trải nghiệm người dùng:

```
+---------------------------------------------------------------------------------------+
|                             3-TIER VALIDATION ARCHITECTURE                            |
+---------------------------------------------------------------------------------------+
|  TIER 1: CLIENT-SIDE (UX Fast Feedback)                                               |
|  - React Hook Form + Zod Schemas                                                      |
|  - In-line realtime regex checks (Email, Phone, Tax Code)                             |
|  - Empty required field prevention, Button disabled state                             |
+-------------------------------------------┬-------------------------------------------+
                                            │ (Pass)
                                            ▼
+---------------------------------------------------------------------------------------+
|  TIER 2: DUAL-VALIDATION (Edge & Controller Level)                                    |
|  - NestJS ValidationPipe + Class-Validator / Zod DTOs                                 |
|  - Date range logic: `endAt > startAt`, `minDuration >= 15m`, `maxDuration <= 8h`     |
|  - File upload restrictions: Image mime-types, Max size <= 10MB                        |
+-------------------------------------------┬-------------------------------------------+
                                            │ (Pass)
                                            ▼
+---------------------------------------------------------------------------------------+
|  TIER 3: DEEP BACKEND (Domain Logic & Database Isolation)                             |
|  - Meeting Room & Time Conflict detection in Prisma Transaction                       |
|  - Event Seat Capacity locking (`current_seats < max_capacity`)                       |
|  - Member Code Uniqueness & Tax Code deduplication across tenant                      |
|  - Role-Based Access Control (RBAC) & Active Session Revocation verification          |
+---------------------------------------------------------------------------------------+
```

## 4.2 Bảng Ma trận Kiểm tra Dữ liệu Chi tiết

| Trường Dữ liệu / Nghiệp vụ | Client-Side (FE) | Dual-Validation (FE + BE) | Deep Backend (Chỉ BE) |
| :--- | :--- | :--- | :--- |
| **Email Doanh nghiệp** | Regex format chuẩn RFC 5322, không chứa khoảng trắng. | Kiểm tra độ dài `5 <= length <= 100`. | Kiểm tra tính duy nhất trong hệ thống (Check duplicate `users.email`). |
| **Số điện thoại** | Regex số điện thoại di động Việt Nam & Quốc tế (`+84...`). | Bắt buộc là chuỗi ký tự số `9-15` chữ số. | Kiểm tra liên kết tài khoản và lịch sử xác thực OTP. |
| **Mã số Thuế Doanh nghiệp** | Regex độ dài 10 số hoặc 13 số có dấu gạch ngang. | Kiểm tra checksum MST chuẩn của Tổng cục Thuế. | Kiểm tra hồ sơ doanh nghiệp đã đăng ký trong hiệp hội trước đó chưa. |
| **Khung giờ Họp 1-on-1** | Thời gian bắt đầu phải lớn hơn thời điểm hiện tại (`> now()`). | `endAt > startAt`, thời lượng từ 15 phút đến 8 tiếng. | Truy vấn khóa dòng (Row lock) xem đối tác có bị trùng lịch hẹn khác đã chốt không. |
| **Đăng ký Ghế Sự kiện** | Disable nút nếu client nhận thấy `seatsLeft == 0`. | Kiểm tra mã sự kiện hợp lệ và còn hạn đăng ký. | Khóa giao dịch `$transaction` đếm số lượng vé thực tế trong DB để tránh vượt số lượng (Overbooking). |
| **Cấp Mã Hội viên** | Gợi ý format tiền tố theo Chi hội (VD: `CEO1983-HN-`). | Độ dài mã từ 6 đến 30 ký tự, không chứa ký tự đặc biệt. | Ràng buộc Unique Constraint trong bảng `members.member_code` cấp độ DB. |

---

# PHẦN 5: KIẾN TRÚC DRY UI COMPONENTS & QUY TẮC TÁI SỬ DỤNG

Để ngăn chặn tuyệt đối tình trạng mã nguồn bị phình to do duplicate components, dự án ViOne áp dụng kỷ luật **DRY (Don't Repeat Yourself) UI Component System**:

## 5.1 Danh mục Thành phần Dùng chung (Core Reusable Components)

```
apps/vione_app_fe/src/components/
├── landing/
│   ├── templates/
│   │   └── AssociationLandingTemplate.tsx  <-- Template gốc cho mọi Hiệp hội & CLB
│   ├── sections/
│   │   ├── LandingHero.tsx                <-- Hero section tái sử dụng
│   │   ├── LandingChallenges.tsx          <-- Khối thách thức doanh nghiệp
│   │   ├── LandingSolutions.tsx           <-- Khối giải pháp số hóa
│   │   ├── LandingEcosystem.tsx           <-- Khối hệ sinh thái kết nối
│   │   ├── LandingPartners.tsx            <-- Khối đối tác & cố vấn
│   │   ├── LandingTestimonials.tsx        <-- Khối cảm nhận hội viên
│   │   └── LandingCtaBanner.tsx           <-- Khối kêu gọi hành động chân trang
├── business-connect/
│   ├── mobile/
│   │   ├── ConnectAppSignIn.tsx           <-- Màn hình đăng nhập dùng chung cho cả 2 app
│   │   ├── TapToConnectSheet.tsx          <-- Bottom sheet chạm NFC
│   │   ├── AuthCardScanSheet.tsx          <-- Bottom sheet quét mã xác thực
│   │   ├── ScannerModal.tsx               <-- Bộ quét Live QR Camera & OCR danh thiếp
│   │   └── MemberCard.tsx                 <-- Thẻ hiển thị doanh nhân chuẩn hóa
│   └── common/
│       ├── LanguageSelector.tsx           <-- Bộ chọn 8 ngôn ngữ
│       └── StatusBadge.tsx                <-- Huy hiệu trạng thái chuẩn hóa
```

## 5.2 Quyền Tự chủ Tối ưu UX (UX Refactoring Autonomy)
Lập trình viên Frontend (Dev-FE) và AI Sub-agent có quyền chủ động cải tiến bố cục giao diện theo các nguyên tắc sau mà không cần chờ phê duyệt lại từ BA:
1. **Chuyển đổi Modal sang Bottom Sheet trên Mobile**: Nếu người dùng truy cập từ thiết bị có màn hình `<= 768px`, các Modal dạng Popup ở giữa màn hình phải tự động chuyển thành Bottom Sheet trượt từ cạnh đáy lên với tay cầm kéo (Drag handle).
2. **Skeleton Loading Shimmer**: Mọi bảng dữ liệu và danh sách Card khi đang ở trạng thái `isLoading` bắt buộc hiển thị khung xương chuyển động mờ ảo (Shimmer Skeleton) thay vì icon xoay tròn đơn điệu.
3. **Phản hồi Rung Haptic**: Tích hợp rung phản hồi nhẹ khi người dùng bấm các nút hành động quan trọng (Chạm NFC, Quét QR thành công, Đổi ngôn ngữ, Duyệt đơn).

## 5.3 Cổng Kiểm soát Trùng lặp Giao diện (Reject Gate DRY-UI)
- **Quy tắc 80% Tương đồng**: Nếu một PR tạo mới một file component mà 80% cấu trúc JSX/CSS tương đồng với component đã có trong `@/components/`, PR đó sẽ bị **REJECT NGAY LẬP TỨC**.
- **Giải pháp bắt buộc**: Refactor component cũ bằng cách bổ sung thêm `props` hoặc `variant` (Ví dụ: `variant="luxury" | "modern" | "compact"`).

---

## 📌 PHÊ DUYỆT & KÝ TÊN BÀN GIAO

| Vai trò | Đại diện | Chữ ký & Ngày |
| :--- | :--- | :--- |
| **Lead Business Analyst (BA)** | Senior BA Team | *Đã ký xác nhận* — 08/09/2026 |
| **Lead Solution Architect (SA)** | Senior SA Team | *Đã ký xác nhận* — 08/09/2026 |
| **Lead Frontend Engineer** | FE Core Team | *Đã tiếp nhận & Áp dụng* — 08/09/2026 |
| **Lead Quality Assurance (QA)** | QA/QC Team | *Đã phê duyệt bộ kịch bản test* — 08/09/2026 |