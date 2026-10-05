# QUY CHUẨN THIẾT KẾ GIAO DIỆN (UI/UX) - APP VIONE CONNECT & MOBILE VIONE
## HỆ SINH THÁI KẾT NỐI KINH DOANH, ĐIỀU HÀNH & GIÁM SÁT DOANH NGHIỆP TOÀN DIỆN (BRD MASTER 5.0)

> **Phiên bản:** v5.0 - Chuẩn Hóa Toàn Diện Theo BRD Master 5.0 & React Native Pure App  
> **Áp dụng cho:** Phân hệ App ViOne Connect (`vione_app_fe`) và App ViOne Native (`apps/mobile_vione`)  
> **Triết lý chủ đạo:** Đẳng cấp Doanh nhân C-Level, Tối giản, Tinh gọn, Công nghệ Hiện đại, Tốc độ cao, Nhìn thấu toàn bộ quy trình vận hành và tiến độ nhân sự của doanh nghiệp.  
> **NGUYÊN TẮC CỐT LÕI:** "KẾT NỐI GIAO THƯƠNG ĐỈNH CAO - QUAN TÂM NHÌN THẤU TOÀN BỘ QUY TRÌNH & THEO DÕI TIẾN ĐỘ NHÂN SỰ DOANH NGHIỆP"

---

## 1. NGUYÊN TẮC THIẾT KẾ CHUNG (CORE CONSTRAINTS)

1. **BẢN SẮC MÀU VÀNG NÂU / BRONZE GOLD & DARK LUXURY OBSIDIAN NAVY (EXECUTIVE OBSIDIAN NAVY & LUXURY GOLD PARITY):**
   - Nền tảng chủ đạo của ViOne Mobile & Web PWA là Executive Obsidian Navy (`#0B0F17`) kết hợp ánh Vàng Đồng Hoàng Gia (Warm Bronze Gold):
     - Background chính: `#0B0F17` (Dark) / `#FFFFFF` (Light), bề mặt card surface: `#0E1522` (Surface) & `#151D2C` (Surface 2), viền vàng tinh tế: `rgba(216, 178, 130, 0.18)` đến `rgba(216, 178, 130, 0.45)`.
     - Nút trung tâm ViOne: Kích thước chuẩn 58×58px tròn, gradient vàng hoàng gia `["#C29B69", "#F6E1C3", "#D8B282"]`, viền 2px (`#524128` Dark / `#FFF2DC` Light), lớp sheen ánh sáng và hiệu ứng phát sáng đa tầng (dual gold glow shadows).
     - Biểu tượng ViOne: Emblem 3D đa diện (`VIconMark.tsx`) với 6 dải chuyển sắc độc lập (`vi_p0` đến `vi_p5`) mô phỏng kim loại vát khối nổi chân thực, thay thế hoàn toàn chữ V dạng văn bản đơn giản.
     - Bộ icon điều hướng: Sử dụng vector SVG hình học chuẩn (`NavHomeIcon`, `NavNetworkIcon`, `NavCommunityIcon`, `NavMeIcon` trong `NavIcons.tsx`) đồng bộ 100% với PWA Web.
     - Màu vàng nhấn: `#D8B282`, vàng sáng: `#F6E1C3`, vàng sậm: `#C29B69`, nâu ấm: `#8C653B`.
     - Chữ chính: Trắng sáng `#FFFFFF` / `#F5F7FA`, chữ phụ `#F6E1C3`, chữ ghi chú `#94A3B8` / `#D4C3A3`.
   - Tuyệt đối loại bỏ nền đen kịt nguyên bản (`#0A0A0B`) và sắc xám xanh lệch tone (`#F8FAFC`) để đảm bảo chiều sâu chuẩn Obsidian Navy sang trọng.

2. **CHUẨN 2 TONE MÀU NÚT THỐNG NHẤT:**
   - **Primary Action (Nút V & CTA chính):** Gradient Vàng Nâu ViOne (`#F6E1C3` -> `#D8B282` -> `#C29B69` -> `#8C653B`), Chữ đen than `#050C15`, bóng đổ kim loại `0 4px 20px rgba(216, 178, 130, 0.45)`.
   - **Secondary Action (Nút phụ / Thao tác thường):** Nền bề mặt tối `#151D2C` hoặc `rgba(255, 255, 255, 0.04)`, Viền `rgba(216, 178, 130, 0.30)`, Chữ `#F5F7FA`.
   - **Hover / Selected State:** Nền vàng dịu (`rgba(216, 178, 130, 0.15)`), Chữ vàng đồng (`#D8B282`), Viền vàng `#D8B282`.

3. **BỐ CỤC IDENTITY GREETING & AVATAR ĐỘC LẬP:**
   - Ảnh bìa Hero Banner (`vba-hero.jpg`) có gradient phủ tối sang trọng.
   - Nút chỉnh sửa bút chì (`Pencil`) đặt riêng góc trên phải ảnh bìa, không che lấp Avatar hoặc Logo.
   - Avatar doanh nhân hình tròn đặt độc lập bên phải khối thông tin, viền mạ vàng kép (`2px solid #D8B282`).

4. **100% PARITY GIỮA REACT NATIVE APP & RESPONSIVE PWA:**
   - **Màn hình Đăng nhập (LoginScreen vs ConnectAppSignIn):**
     * Ảnh nền sang trọng `connect-auth-bg.jpg` phủ vignette tối.
     * Chuyển đổi ngôn ngữ (VI / EN).
     * Hai nút đăng nhập mạng xã hội dạng kéo dài: Google & Apple.
     * Divider "HOẶC" viền mạ vàng.
     * Form email/mật khẩu với icon chìm, checkbox ghi nhớ đăng nhập mạ vàng, nút gradient vàng ViOne.
     * Nút Đăng ký tài khoản doanh nhân, Khám phá Web Landing ViOne, và Nút Chạm thẻ NFC / Quét QR.
   - **Màn hình Trang chủ (HomeScreen vs ExecutiveHome):**
     * Header thương hiệu: Logo ViOne wordmark + Lời chào theo thời gian thực + Chuông thông báo đính badge.
     * Thẻ Doanh nhân ViOne: Ảnh bìa + Avatar viền vàng + Tên + Số điện thoại.
     * Bộ 3 Tabs lịch trình: Hôm nay / Sắp tới / Nhắc l�       * Tiêu đề phân hệ 'Network' kèm nút thêm kết nối UserPlus và subtitle số kết nối thực tế kèm số đối tác cần chăm sóc (`X kết nối • 3 cần chăm sóc`).
       * **Khoảnh Khắc Doanh Nhân 24h (Stories Strip):** Dải story ngang trên đầu màn hình với nút `+ Đăng story` / `Đăng khoảnh khắc` mở `CreateStoryModal.tsx` (soạn nội dung, chọn ảnh, gắn hashtag B2B `#Cơ hội hợp tác`, `#Xúc tiến đầu tư`); danh sách thẻ story với avatar viền vàng, tag chủ đề và thời gian; chạm vào story mở `StoryViewerModal.tsx` toàn màn hình chạy tiến độ tự động (0-100%), nút thả tim và chia sẻ.
       * **Khách Hàng & Đối Tác Cần Chăm Sóc (Nurture List):** Khối "CẦN GIỮ KẾT NỐI & CHĂM SÓC" cảnh báo đối tác 14 ngày chưa tương tác, chờ duyệt hợp đồng hoặc hồ sơ đấu thầu; tích hợp 3 phím tắt nhanh 1-chạm: `Hẹn 1-1`, `Nhắn tin`, `Gọi`.
       * Bộ 5 Category Tabs đồng bộ PWA: [Mạng lưới] [Khách hàng] [Gợi ý] [Tin nhắn] [Lời mời].
       * Quản lý khách hàng B2B: Pipeline phân loại giá trị hợp đồng, người liên hệ, mức ưu tiên.
       * Hộp thư doanh nghiệp tích hợp in-app: 4 danh mục (Tất cả, Chưa đọc, Nhóm, Tin nhắn chờ) & ChatThreadModal, CreateGroupModal.
    - **Nút V Phát Sáng Ở Giữa & Action Sheet 1-Chạm (CustomBottomTabBar & VActionSheet):**
       * Nút V nhô cao ở giữa (`-18px`), chuẩn kích thước tròn 58×58px với gradient hoàng kim ViOne `["#C29B69", "#F6E1C3", "#D8B282"]`, viền 2px (`#524128` Dark / `#FFF2DC` Light), vầng sáng kép `boxShadow` / `elevation: 12`, lớp sheen ánh sáng và biểu tượng 3D sculpted `VIconMark.tsx` (6 gradients kim loại đa chiều `vi_p0` -> `vi_p5`).
       * Action Sheet nền Obsidian Dark Navy với watermark biểu tượng ViOne 3D chìm (`<VIconMark size={140} opacity={0.06} />`) sang trọng.
       * Thẻ danh tính C-Level: Avatar, Họ tên, Chức vụ, Doanh nghiệp, Huy hiệu 'DOANH NHÂN VIONE XÁC THỰC', Địa điểm, Website.
       * **Hero Gold CTA: 'Đưa mã QR của bạn'** với nền gradient vàng hoàng kim ViOne, mở `MyQrModal` sinh mã QR danh thiếp cá nhân tức thì.
       * **Quét mã QR ('ScanQrModal'):** Mở camera native quét mã QR đối tác với khung ngắm viewfinder, tia laser quét chuyển động, nút bật/tắt đèn flash và hỗ trợ nhập mã thủ công.
       * Các thao tác kết nối khác: 'Chạm thẻ NFC', 'Quét danh thiếp AI', 'Ghi chú cuộc gặp'.
       * Bộ 3 Quick Tiles: 'Danh thiếp số', 'Ví thẻ', 'Bảo mật'.
       * Phân hệ Vận hành & Giám sát doanh nghiệp: Chấm công GPS, Quy trình BPMN Kanban, Phê duyệt chi 3 cấp.
    - **Màn hình Cộng đồng (CommunityScreen vs CommunityHome):**
       * Header thương hiệu ViOne + Tiêu đề 'Cộng đồng' kèm subtitle 'Thành viên · Sự kiện · Cơ hội'.
       * **Nút '+ Tạo nhóm' mạ vàng** trên Header mở `CreateCommunityGroupModal.tsx` khởi tạo liên minh/cộng đồng doanh nghiệp mới với tên nhóm, phân loại ngành nghề, tôn chỉ và tự động cấp quyền Ban Điều Hành.
       * Ô tìm kiếm cộng đồng, liên minh doanh nghiệp, sự kiện B2B.
       * Bộ 4 Tabs phân loại: [Tất cả] [Đã tham gia] [Ban Điều Hành] [Sự kiện B2B].
       * Thẻ liên minh doanh nhân xác thực & Thẻ sự kiện B2B cấp mã vé QR điện tử tức thì.
       * **Phân hệ 'Cơ Hội Kinh Doanh Trong Cộng Đồng' (`CommunityOpportunitiesSection` parity):** Banner chỉ số cơ hội B2B đang mở, danh sách thẻ cơ hội (quy mô 15 tỷ, 850 triệu, 5.2 tỷ), thời hạn, và nút hành động "Quan tâm" gửi hồ sơ năng lực 1-chạm.
    - **Màn hình Tôi / Profile (ProfileScreen vs MeScreen):**
       * Thẻ Hero Doanh Nhân ViOne: Avatar viền vàng, Chức vụ, Công ty, Email, Điện thoại.
       * Bộ 4 Nút thao tác nhanh: [Chia sẻ link] [Mã QR của tôi] [Thẻ NFC] [Xem trước].
       * Thẻ danh thiếp điện tử Titanium 3D: Chip thông minh, chỉ báo NFC, mã số doanh nhân VIONE-XXXX, nút mở QR.
       * Khối 'Về tôi & Năng lực doanh nghiệp': Kinh nghiệm 15+ năm, 500+ đối tác, 20+ dự án B2B, Lĩnh vực quan tâm.
       * Thông tin liên hệ & Cài đặt bảo mật (Xác thực 2 lớp, AI Personalization, Đăng xuất).
    - **Thanh điều hướng dưới đáy (CustomBottomTabBar vs BusinessConnectBottomNav):**
       * Nền Obsidian Navy `#0B0F17` (Dark) / `#FFFFFF` (Light), viền trên mạ vàng tinh tế `rgba(216, 178, 130, 0.18)`.
       * Vạch chỉ báo tab đang chọn: Dải gradient ngang 24×3px `["#F6E1C3", "#E6C59E", "#D8B282", "#C29B69"]` đặt ở mép trên cùng tab.
       * Bộ 4 icon điều hướng: Vector SVG chuẩn hình học `NavHomeIcon`, `NavNetworkIcon`, `NavCommunityIcon`, `NavMeIcon` (`NavIcons.tsx`).
       * Tab đang active có pill highlight màu `rgba(216, 178, 130, 0.22)`, chữ đậm 10.5px màu `#D8B282` (Dark) / `#A3703C` (Light).
       * Nút V mạ vàng nổi bật ở chính giữa với hiệu ứng vầng sáng hoàng kim phát sáng rực rỡ và biểu tượng 3D `VIconMark`.

---

## 2. BẢNG MÀU HỆ THỐNG VIONE (PALETTE SPECIFICATIONS)

| Nhãn Màu | Mã HEX | Tailwind / React Native Token | Ứng Dụng Thực Tế |
| :--- | :--- | :--- | :--- |
| **Dark Obsidian Navy (Nền chính)** | `#0B0F17` | `Colors.background`, `var(--bc-mobile-bg)` | Nền toàn bộ ứng dụng, Bottom Nav bar |
| **Surface Dark (Thẻ & Khối)** | `#0E1522` | `Colors.surface`, `var(--bc-mobile-surface)` | Thẻ doanh nhân, Thẻ Insight, Ops Cards |
| **Surface Dark 2 (Sub-card)** | `#151D2C` | `Colors.surface2`, `var(--bc-mobile-surface-2)` | Thẻ con nghiệp vụ, ô nhập liệu input |
| **ViOne Bronze Gold** | `#D8B282` | `Colors.gold`, `var(--bc-mobile-accent)` | Nút V trung tâm, huy hiệu VIP, viền active |
| **Gold Light Champagne** | `#F6E1C3` | `Colors.goldLight`, `var(--bc-gold-300)` | Đỉnh gradient, tiêu đề sáng, text highlight |
| **Gold Deep Amber** | `#C29B69` | `Colors.goldDark`, `var(--bc-gold-600)` | Thân gradient nút V, viền thẻ nổi bật |
| **Rich Brown Accent** | `#8C653B` | `Colors.goldBrown`, `var(--bc-gold-700)` | Đáy gradient nút Vàng Nâu ViOne |
| **V-Button Border Dark** | `#524128` | `Colors.vButtonBorder` | Viền 2px bao quanh nút V trung tâm (Dark) |
| **Pure White Text** | `#FFFFFF` | `Colors.textPrimary` | Tiêu đề chính, tên doanh nhân |
| **Muted Gold/Gray Text** | `#94A3B8` / `#D4C3A3` | `Colors.textMuted` | Nhãn phụ, mốc thời gian, địa điểm |
| **Border Subtle** | `rgba(216, 178, 130, 0.18)` | `Colors.surfaceBorder` | Viền ngăn cách card hairline |
| **Border Gold Accent** | `rgba(216, 178, 130, 0.45)` | `Colors.surfaceBorderGold` | Viền nhấn mạnh thẻ danh thiếp & nút V |

---

## 2. BẢNG MÀU HỆ THỐNG VIONE (PALETTE SPECIFICATIONS)

| Nhãn Màu | Mã HEX | Tailwind / React Native Token | Ứng Dụng Thực Tế |
| :--- | :--- | :--- | :--- |
| **Dark Obsidian (Nền chính)** | `#0A0A0B` | `Colors.background`, `var(--bc-mobile-bg)` | Nền toàn bộ ứng dụng, Bottom Nav bar |
| **Surface Dark (Thẻ & Khối)** | `#12151F` | `Colors.surface`, `var(--bc-mobile-surface)` | Thẻ doanh nhân, Thẻ Insight, Ops Cards |
| **Surface Dark 2 (Sub-card)** | `#181D2A` | `Colors.surface2`, `var(--bc-mobile-surface-2)` | Thẻ con nghiệp vụ, ô nhập liệu input |
| **ViOne Bronze Gold** | `#D8B282` | `Colors.gold`, `var(--bc-mobile-accent)` | Nút V trung tâm, huy hiệu VIP, viền active |
| **Gold Light Champagne** | `#F6E1C3` | `Colors.goldLight`, `var(--bc-gold-300)` | Đỉnh gradient, tiêu đề sáng, text highlight |
| **Gold Deep Amber** | `#C29B69` | `Colors.goldDark`, `var(--bc-gold-600)` | Thân gradient nút V, viền thẻ nổi bật |
| **Rich Brown Accent** | `#8C653B` | `Colors.goldBrown`, `var(--bc-gold-700)` | Đáy gradient nút Vàng Nâu ViOne |
| **Pure White Text** | `#FFFFFF` | `Colors.textPrimary` | Tiêu đề chính, tên doanh nhân |
| **Muted Gold/Gray Text** | `#94A3B8` / `#D4C3A3` | `Colors.textMuted` | Nhãn phụ, mốc thời gian, địa điểm |
| **Border Subtle** | `rgba(255, 255, 255, 0.08)` | `Colors.surfaceBorder` | Viền ngăn cách card hairline |
| **Border Gold Accent** | `rgba(216, 178, 130, 0.45)` | `Colors.surfaceBorderGold` | Viền nhấn mạnh thẻ danh thiếp & nút V |

---

## 3. PHÂN HỆ ĐIỀU HÀNH & THEO DÕI TIẾN ĐỘ DOANH NGHIỆP (BRD MASTER 5.0)

### 3.1. Chấm Công Di Động GPS & AI FaceID (Module HRM)
- **Quy tắc BR-HRM-01:** Bán kính định vị GPS tại trụ sở hoặc chi nhánh $\le 50\text{m}$.
- **Quy tắc BR-HRM-02:** Độ khớp khuôn mặt và kiểm tra liveness thực tế $\ge 92\%$. Chống giả mạo bằng ảnh in, video phát lại hoặc mặt nạ 3D.
- **Thống kê thời gian thực:** Hiển thị số lượng nhân sự có mặt / tổng nhân sự (Ví dụ: 42/45 có mặt - 93.3%). Nút điểm danh 1-chạm kích hoạt camera nhận diện khuôn mặt và GPS tức thì.

### 3.2. Quy Trình Vận Hành BPMN & Tiến Độ Nhân Sự (Module Workflow & Workload)
- **Quy tắc BR-WRK-01:** 100% công việc phải có người phụ trách (Assignee) và thời hạn hoàn thành (Deadline).
- **Quy tắc BR-WRK-02:** Cảnh báo đỏ phát sáng (Glowing Red Pulse) lập tức khi công việc bị quá hạn.
- **Quy tắc BR-WRK-06:** Giới hạn công việc đang xử lý (WIP Limit $\le 5$) cho mỗi nhân viên, ngăn ngừa nghẽn cổ chai và quá tải.
- **Quy tắc BR-WRK-14:** Cảnh báo quá tải nhân sự (Workload Overload Alert) khi tổng giờ làm việc vượt quá 45 giờ/tuần.

### 3.3. Phê Duyệt Chi 3 Cấp (Module Finance & Approvals)
- **Quy tắc BR-FIN-01:** Quy trình kiểm soát 3 cấp nghiêm ngặt: Maker (Lập đề xuất) $\rightarrow$ Checker (Kế toán trưởng kiểm tra) $\rightarrow$ Approver (CFO / CEO phê duyệt).
- **Quy tắc BR-FIN-02:** Phân định thẩm quyền phê duyệt:
  - Chi phí $< 5.000.000$ đ: Trưởng bộ phận duyệt.
  - Chi phí $5.000.000 - 20.000.000$ đ: Giám đốc Tài chính (CFO) duyệt.
  - Chi phí $> 20.000.000$ đ: Bắt buộc Tổng Giám Đốc (CEO) trực tiếp ký số và phê duyệt trên App.
- **Quy tắc BR-FIN-06:** Tích hợp cổng Napas VietQR 24/7 gạch nợ tức thì 1 giây sau khi CEO ký duyệt.

---

## 4. DANH MỤC THÀNH PHẦN ĐỒNG BỘ 100% PARITY GIỮA WEB PWA & REACT NATIVE APP

| Thành Phần Native (`apps/mobile_vione`) | Thành Phần Web PWA Tương Ứng | Chức Năng Chi Tiết |
| :--- | :--- | :--- |
| **`CustomerDetailModal.tsx`** | `CustomerDetailSheet.tsx` & `CustomersPanel.tsx` | Quản lý thông tin khách hàng B2B, quy mô thương vụ, giai đoạn đàm phán, gắn tag nhãn, ghi chú chăm sóc & nút nhanh Gọi/Nhắn tin/Hẹn 1-1. |
| **`CardScanReviewModal.tsx`** | `BusinessCardReviewForm.tsx` & `CardScanFlow.tsx` | Chụp danh thiếp giấy với khung camera native, AI OCR trích xuất thông tin tự động, bóc tách SĐT/Email/Tên lưu danh bạ VÀ tích hợp Switch lưu thẳng thành Khách Hàng Tiềm Năng (Lead) với Tier (Hot Lead, VIP C-Level, Nổi bật, Cần care 24h), Giai đoạn CRM, Giá trị thương vụ (Deal Value), Nhân sự phụ trách (PIC) và Hạn xử lý tiếp theo. |
| **`StaffDailyActivityModal.tsx`** | `StaffDailyActivitySheet.tsx` & `OperationsStaffPanel.tsx` | Giám sát hoạt động nhân sự trong ngày dành cho Cấp bậc Giám đốc / Lãnh đạo C-Level: KPI thời gian thực (tổng nhân sự, có mặt, đi gặp khách hàng, tại VP, tỷ lệ hoàn thành việc), xem lịch trình gặp khách chi tiết, tiến độ checklist BPMN, lịch sử check-in GPS và 2 nút gọi điện / nhắc việc tức thì. |
| **`EventDetailModal.tsx`** | `CommunityEventDetail.tsx` & `EventDetailMobileSheet.tsx` | Xem chi tiết sự kiện B2B, nghị trình thời gian thực (Agenda timeline), diễn giả C-Level, chỉ đường Google Maps, đồng bộ lịch và cấp thẻ vé VIP Dynamic QR Check-in (`VIONE-TICKET-XXXX`). |
| **`OpportunityDetailModal.tsx`** | `CommunityOpportunityDetail.tsx` | Xem chi tiết dự án & gói thầu B2B (quy mô 15 tỷ, 850 triệu, 5.2 tỷ), tiêu chí kỹ thuật, đầu mối mua hàng và biểu mẫu nộp hồ sơ năng lực & báo giá B2B trực tiếp. |
| **`CreateOpportunityModal.tsx`** | `CreateOpportunityModal.tsx` | Biểu mẫu cho phép doanh nhân đăng tải dự án/nhu cầu mua sắm B2B mới, phân loại lĩnh vực, chọn ngân sách dự kiến, thời hạn nhận thầu và công bố lên mạng lưới liên minh. |
| **`ScheduleMeetingModal.tsx`** | `ScheduleCalendar.tsx` & `PersonPlanSheet.tsx` | Lên lịch hẹn cuộc gặp 1-1 giữa hai doanh nhân: chọn ngày, khung giờ (09:00, 10:30, 14:00, 15:30, 17:00), hình thức trực tiếp (Offline) hoặc trực tuyến (Google Meet bảo mật), địa điểm & nội dung thảo luận. |
| **`PostMomentModal.tsx`** | `PostMomentModal.tsx` & `MomentComposer.tsx` | Đăng bài chia sẻ khoảnh khắc giao thương, hợp đồng ký kết mới kèm hashtag ngành nghề (`#Ký kết đối tác`, `#Xúc tiến đầu tư`), đính kèm hình ảnh thực tế và tùy chọn phạm vi hiển thị (Toàn mạng lưới vs Nội bộ liên minh). |
| **`MomentCommentModal.tsx`** | `MomentCommentSheet.tsx` & `MomentCommentTree.tsx` | Xem cây bình luận thảo luận B2B dưới mỗi khoảnh khắc, hỗ trợ các biểu tượng tương tác nhanh (`👍 Chúc mừng`, `🤝 Hợp tác`, `👏 Tuyệt vời`, `💡 Tiềm năng`) và gửi phản hồi thời gian thực. |
| **`IdentityPrivacyModal.tsx`** | `IdentityPrivacySheet.tsx` | Bảng điều khiển quyền riêng tư doanh nghiệp: bật/tắt hiển thị SĐT cho người chưa kết nối, ẩn/hiện email công việc, kiểm soát quyền mời hẹn 1-1, cho phép AI Copilot ghép cặp cơ hội và chống sao chép thẻ danh thiếp. |
| **`CardVaultModal.tsx`** | `CardVaultManageSheet.tsx` & `PublicCardConnectPanel.tsx` | Ví lưu trữ danh thiếp điện tử của tất cả đối tác đã thu thập (qua QR, NFC, OCR); hỗ trợ tìm kiếm đa tiêu chí, phân loại thẻ VIP và xuất tệp danh bạ chuẩn vCard (.vcf) lưu vào máy. |

---

## 5. CÁC NÂNG CẤP ĐỘT PHÁ C-LEVEL & DOANH NGHIỆP THÁNG 10/2026

### 5.1. Phân Hệ Giám Sát Hoạt Động Nhân Sự Trong Ngày Dành Cho Cấp Bậc Giám Đốc
- **Mục tiêu cốt lõi:** Cho phép Giám đốc / Ban Lãnh đạo nắm bắt thấu đáo hoạt động nhân sự trong ngày: ai đang đi gặp khách hàng/đối tác, ai đang làm việc tại văn phòng, các nhiệm vụ trọng tâm và tiến độ thực tế, cảnh báo vắng mặt không phép.
- **Thẻ Truy Cập Nhanh Tại Trang Chủ (`HomeScreen.tsx`):**
  - Khối Điều hành & Giám sát vận hành bổ sung thẻ thứ 4: *"Giám sát hoạt động nhân sự trong ngày"* hiển thị số lượng nhân sự đang đi gặp đối tác (ví dụ: `8 Đang gặp đối tác`), chạm vào mở ngay `StaffDailyActivityModal`.
- **Thành Phần Modal Chi Tiết (`StaffDailyActivityModal.tsx`):**
  - **KPI Metrics Header:** Tổng nhân sự (45), Có mặt (42), Đang gặp khách hàng (8), Tại văn phòng (34), Tỷ lệ hoàn thành công việc (82.5%).
  - **Bộ Lọc Phân Loại 3 Trạng Thái:** `[Tất cả nhân sự]` `[🏢 Tại văn phòng]` `[🤝 Đang gặp đối tác]`.
  - **Tìm Kiếm Đa Tiêu Chí:** Tìm theo tên nhân viên, chức vụ, phòng ban, tên đối tác đang tiếp xúc.
  - **Thẻ Thông Tin Nhân Sự Toàn Diện:**
    * Avatar, Họ tên, Phòng ban & Chức danh.
    * Chấm trạng thái động: Xanh lục (Tại văn phòng), Hổ phách/Vàng (Đang gặp đối tác), Xám (Chưa check-in).
    * Khối Lịch Trình Gặp Khách: Tên đối tác/khách hàng, Địa điểm tiếp xúc, Khung giờ cuộc hẹn, Mục tiêu làm việc.
    * Khối Tiến Độ Công Việc BPMN: Thanh tiến độ hoàn thành, danh sách checklist các đầu việc trong ngày.
    * Nhật Ký GPS Check-in: Tọa độ, địa chỉ điểm danh gần nhất, thời gian check-in.
    * 2 Nút Hành Động Nhanh 1-Chạm: Gọi điện thoại trực tiếp (`tel:`) và Nhắc việc qua hệ thống.

### 5.2. Mở Rộng Luồng Quét Danh Thiếp AI OCR Lưu Khách Hàng Tiềm Năng (Lead Pipeline)
- **Vấn đề giải quyết:** Trước đây khi nhân viên chụp danh thiếp, hệ thống chỉ bóc tách tên và số điện thoại lưu vào danh bạ thông thường, làm đứt gãy luồng CRM và bỏ lỡ các khách hàng tiềm năng.
- **Giải pháp triển khai (`CardScanReviewModal.tsx`):**
  - Bổ sung Switch trực quan: *"Lưu thành Khách Hàng Tiềm Năng (Lead)"*.
  - **Phân Hạng Tier Khách Hàng:**
    * ⭐ `Hot Lead`: Khách hàng có nhu cầu bức thiết, ngân sách đã duyệt.
    * 💎 `VIP C-Level`: Lãnh đạo cấp cao, đối tác chiến lược quy mô lớn.
    * 🌟 `Nổi bật`: Khách hàng tiềm năng cần ưu tiên theo dõi.
    * 🎯 `Cần care 24h`: Cần gọi điện hoặc gửi đề xuất trong vòng 24 giờ.
  - **Giai Đoạn CRM Pipeline:** `prospect` (Tiếp cận), `proposal` (Gửi báo giá / giải pháp), `negotiation` (Đàm phán).
  - **Giá Trị Thương Vụ (Deal Value):** Nhập số tiền thương vụ dự kiến (triệu / tỷ VNĐ) hiển thị nổi bật màu vàng kim.
  - **Nhân Sự Phụ Trách (PIC):** Chỉ định nhân viên phụ trách chăm sóc khách hàng.
  - **Nhu Cầu Ban Đầu & Hạn Hành Động:** Ghi chú nhu cầu cốt lõi và thời hạn cần phản hồi tiếp theo.
  - **Đồng Bộ Dữ Liệu Tự Động:** Khi bấm Lưu, hệ thống gọi đồng thời `cardScanApi.saveCard` (lưu ví thẻ & danh bạ) và `customerApi.createCustomer` (tạo bản ghi trong CRM Pipeline), đảm bảo dữ liệu thật xuất hiện ngay trong hệ thống CRM mà không bị chững luồng.

### 5.3. Phân Hệ Chăm Sóc Khách Hàng Tiềm Năng Tại Tab Cộng Đồng (`CommunityScreen.tsx`)
- **Khôi phục Tab Trọng Tâm:** Bổ sung Tab `{ id: "leads", label: "🎯 Khách hàng tiềm năng & Cần care" }` bên cạnh các tab Liên minh, Ban Điều Hành, Sự kiện.
- **Hero Banner Pipeline:**
  - Tổng số lượng Leads, số Hot Leads, Tổng giá trị thương vụ dự kiến (6.15 Tỷ VNĐ).
  - Nút *"Quét Card"* tích hợp trên Hero Banner cho phép mở ngay `CardScanReviewModal` để nạp lead tức thì.
- **Bộ Lọc Phân Hạng Tier Nhanh:** `[Tất cả]` `[⭐ Hot Lead]` `[💎 VIP C-Level]` `[🎯 Cần care 24h]` `[🌟 Nổi bật]`.
- **Thẻ Lead Trực Quan & Tương Tác 1-Chạm:**
  - Hiển thị đầy đủ: Họ tên, Chức vụ, Công ty, Badge Tier sắc nét, Giai đoạn deal, Giá trị thương vụ (VND), Nhân sự phụ trách (PIC), Nhu cầu ban đầu và Thời hạn xử lý.
  - 3 Nút Hành Động Nhanh:
    1. **Gọi điện:** Kích hoạt cuộc gọi trực tiếp qua giao thức `tel:`.
    2. **Nhắn tin:** Mở kênh đàm thoại B2B trực tiếp.
    3. **Hẹn 1-1:** Mở `ScheduleMeetingModal` lên lịch hẹn gặp chính thức.

### 5.4. Khôi Phục Bộ Lọc Phạm Vi & Chuỗi Giá Trị Tại "V · Gợi Ý Hôm Nay" (`HomeScreen.tsx`)
- **Khối Gợi Ý Đối Tác AI:** Phân hệ "V · Gợi ý hôm nay" trên trang chủ được bổ sung 2 thanh Filter Chips ngang:
  - **Thanh 1 - Lọc Phạm Vi Không Gian:**
    * `[ Tất cả phạm vi ]`: Toàn bộ đối tác đề xuất.
    * `[ 📍 Gần tôi (10km) ]`: Đối tác trong bán kính 10km (thuận tiện hẹn gặp trực tiếp).
    * `[ 🏢 Cùng thành phố ]`: Đối tác cùng địa bàn tỉnh/thành phố.
    * `[ 🌐 Toàn quốc ]`: Đối tác trên quy mô toàn quốc.
  - **Thanh 2 - Lọc Chuỗi Giá Trị & Ngành Nghề:**
    * `[ Tất cả ngành ]` `[ 📦 Chuỗi cung ứng & Bán lẻ ]` `[ 💻 Công nghệ & AI ]` `[ 💎 Quỹ đầu tư & Vốn ]` `[ 🏗️ Xây dựng ]` `[ 📢 Truyền thông B2B ]`.
- **Tối Ưu Hiệu Năng:** Dữ liệu được tính toán và lọc tức thì qua hook `useMemo`, chuyển động mượt mà 60fps khi người dùng chọn qua lại giữa các chip lọc.

### 5.5. Hệ Thống Theme Động Sáng & Tối (Luxury Executive Light & Dark Obsidian Theme)
- **Triết lý Thiết Kế:**
  - Cung cấp trải nghiệm thị giác thượng lưu với 2 chế độ:
    1. **Dark Obsidian (Mặc định):** Đen thạch anh sâu thẳm `#0A0A0B`, card surface `#12151F` & `#181D2A`, ánh vàng đồng Bronze Gold `#D8B282`.
    2. **Luxury Executive Light:** Trắng kem tinh khôi `#F8FAFC`, card surface `#FFFFFF`, viền ấm áp `rgba(180, 130, 80, 0.25)`, vàng đồng đậm nét `#B48250` / `#94632B`, chữ đen than sang trọng `#0F172A`.
- **ThemeContext & Quản Lý Trạng Thái (`ThemeContext.tsx`):**
  - Cung cấp context `useTheme()` với các thuộc tính: `isDark`, `themeMode` (`dark` / `light` / `system`), bảng màu động `colors`, hàm `toggleTheme()`, hàm `setThemeMode()`.
  - Lưu trạng thái lựa chọn của người dùng vào bộ nhớ cục bộ `AsyncStorage` qua key `@vione_app_theme`.
  - Tự động đồng bộ màu của thanh trạng thái hệ điều hành (`StatusBar style={isDark ? "light" : "dark"}`).
- **Theme Switcher 1-Chạm:**
  - Nút chuyển đổi biểu tượng Mặt Trời ☀️ / Mặt Trăng 🌙 đặt trực tiếp trên Header trang chủ `HomeScreen.tsx`, bấm chuyển chế độ tức thì không cần vào trang cài đặt phức tạp.



