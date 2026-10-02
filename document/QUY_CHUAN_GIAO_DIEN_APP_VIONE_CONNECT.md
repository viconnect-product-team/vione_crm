# QUY CHUẨN THIẾT KẾ GIAO DIỆN (UI/UX) - APP VIONE CONNECT & MOBILE VIONE
## HỆ SINH THÁI KẾT NỐI KINH DOANH, ĐIỀU HÀNH & GIÁM SÁT DOANH NGHIỆP TOÀN DIỆN (BRD MASTER 5.0)

> **Phiên bản:** v5.0 - Chuẩn Hóa Toàn Diện Theo BRD Master 5.0 & React Native Pure App  
> **Áp dụng cho:** Phân hệ App ViOne Connect (`vione_app_fe`) và App ViOne Native (`apps/mobile_vione`)  
> **Triết lý chủ đạo:** Đẳng cấp Doanh nhân C-Level, Tối giản, Tinh gọn, Công nghệ Hiện đại, Tốc độ cao, Nhìn thấu toàn bộ quy trình vận hành và tiến độ nhân sự của doanh nghiệp.  
> **NGUYÊN TẮC CỐT LÕI:** "KẾT NỐI GIAO THƯƠNG ĐỈNH CAO - QUAN TÂM NHÌN THẤU TOÀN BỘ QUY TRÌNH & THEO DÕI TIẾN ĐỘ NHÂN SỰ DOANH NGHIỆP"

---

## 1. NGUYÊN TẮC THIẾT KẾ CHUNG (CORE CONSTRAINTS)

1. **BẢN SẮC MÀU VÀNG NÂU / BRONZE GOLD & DARK LUXURY OBSIDIAN (LUXURY GOLD BUTTON & DARK PWA PARITY):**
   - Nền tảng chủ đạo của ViOne Mobile là Dark Luxury Obsidian (`#0A0A0B`) kết hợp ánh Vàng Đồng Hoàng Gia (Warm Bronze Gold):
     - Background chính: `#0A0A0B`, bề mặt card surface: `#12151F` & `#181D2A`.
     - Gradient nút V & CTA chính: `linear-gradient(135deg, #F6E1C3 0%, #D8B282 45%, #C29B69 70%, #8C653B 100%)`.
     - Màu vàng nhấn: `#D8B282`, vàng sáng: `#F6E1C3`, viền vàng: `rgba(216, 178, 130, 0.45)`.
     - Chữ chính: Trắng sáng `#FFFFFF` / `#F5F7FA`, chữ phụ `#F6E1C3`, chữ ghi chú `#94A3B8` / `#D4C3A3`.
   - Tuyệt đối cấm sử dụng nền trắng sáng `#FFFFFF` hay chữ đen `#0F172A` làm tone giao diện chính (tránh làm sai lệch hoàn toàn nhận diện Dark Luxury của ViOne Connect).

2. **CHUẨN 2 TONE MÀU NÚT THỐNG NHẤT:**
   - **Primary Action (Nút V & CTA chính):** Gradient Vàng Nâu ViOne (`#F6E1C3` -> `#D8B282` -> `#C29B69` -> `#8C653B`), Chữ đen than `#050C15`, bóng đổ kim loại `0 4px 20px rgba(216, 178, 130, 0.45)`.
   - **Secondary Action (Nút phụ / Thao tác thường):** Nền bề mặt tối `#181D2A` hoặc `rgba(255, 255, 255, 0.04)`, Viền `rgba(216, 178, 130, 0.30)`, Chữ `#F5F7FA`.
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
     * Bộ 3 Tabs lịch trình: Hôm nay / Sắp tới / Nhắc lịch với tab active nền gradient vàng chữ đen.
     * Thẻ Insight: "SỐ CƠ HỘI KẾT NỐI TIỀM NĂNG" (15 cơ hội kết nối tiềm năng cao).
     * Bộ 3 Phím tắt Quick Actions: "Cuộc gặp 1-1", "Quét thẻ", "Thẻ của tôi".
     * Khối Điều hành & Giám sát vận hành doanh nghiệp BRD: Chấm công GPS & AI FaceID, Tiến độ nhân sự Kanban/WIP, Phê duyệt chi 3 cấp.
   - **Màn hình Network (NetworkScreen vs NetworkHome):**
      * Header thương hiệu: Wordmark ViOne + Lời chào thời gian thực + Nút Hộp thư tin nhắn (kèm badge đếm số tin chưa đọc thời gian thực, 1-chạm chuyển ngay sang tab Tin nhắn) + Chuông thông báo.
      * Tiêu đề phân hệ 'Network' kèm nút thêm kết nối UserPlus và subtitle số kết nối thực tế kèm số đối tác cần chăm sóc (`X kết nối • 3 cần chăm sóc`).
      * **Khoảnh Khắc Doanh Nhân 24h (Stories Strip):** Dải story ngang trên đầu màn hình với nút `+ Đăng story` / `Đăng khoảnh khắc` mở `CreateStoryModal.tsx` (soạn nội dung, chọn ảnh, gắn hashtag B2B `#Cơ hội hợp tác`, `#Xúc tiến đầu tư`); danh sách thẻ story với avatar viền vàng, tag chủ đề và thời gian; chạm vào story mở `StoryViewerModal.tsx` toàn màn hình chạy tiến độ tự động (0-100%), nút thả tim và chia sẻ.
      * **Khách Hàng & Đối Tác Cần Chăm Sóc (Nurture List):** Khối "CẦN GIỮ KẾT NỐI & CHĂM SÓC" cảnh báo đối tác 14 ngày chưa tương tác, chờ duyệt hợp đồng hoặc hồ sơ đấu thầu; tích hợp 3 phím tắt nhanh 1-chạm: `Hẹn 1-1`, `Nhắn tin`, `Gọi`.
      * Bộ 5 Category Tabs đồng bộ PWA: [Mạng lưới] [Khách hàng] [Gợi ý] [Tin nhắn] [Lời mời].
      * Quản lý khách hàng B2B: Pipeline phân loại giá trị hợp đồng, người liên hệ, mức ưu tiên.
      * Hộp thư doanh nghiệp tích hợp in-app: 4 danh mục (Tất cả, Chưa đọc, Nhóm, Tin nhắn chờ) & ChatThreadModal, CreateGroupModal.
    - **Nút V Phát Sáng Ở Giữa & Action Sheet 1-Chạm (CustomBottomTabBar & VActionSheet):**
      * Nút V nhô cao ở giữa (`-18px`) với vòng hào quang phát sáng đa tầng `vBtnGlowRing` (`shadowRadius: 16`, `shadowOpacity: 0.85`, `elevation: 12`, viền `rgba(246, 225, 195, 0.6)`), mặt nút mạ gradient vàng hoàng gia dập nổi chữ V sắc nét.
      * Action Sheet nền Obsidian Dark với watermark chữ V chìm 3D sang trọng.
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
     * Nền tối `#0A0A0B`, viền trên mạ vàng `rgba(216, 178, 130, 0.18)`.
     * Vạch chỉ báo tab đang chọn màu vàng `#D8B282`.
     * Nút V mạ vàng nổi bật ở chính giữa với hiệu ứng vầng sáng hoàng kim phát sáng rực rỡ.

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
| **`CardScanReviewModal.tsx`** | `BusinessCardReviewForm.tsx` & `CardScanFlow.tsx` | Chụp danh thiếp giấy với khung camera native, mô phỏng OCR trích xuất thông tin tự động, biểu mẫu duyệt & chỉnh sửa họ tên, công ty, email, SĐT và lưu thẳng vào danh bạ đối tác. |
| **`EventDetailModal.tsx`** | `CommunityEventDetail.tsx` & `EventDetailMobileSheet.tsx` | Xem chi tiết sự kiện B2B, nghị trình thời gian thực (Agenda timeline), diễn giả C-Level, chỉ đường Google Maps, đồng bộ lịch và cấp thẻ vé VIP Dynamic QR Check-in (`VIONE-TICKET-XXXX`). |
| **`OpportunityDetailModal.tsx`** | `CommunityOpportunityDetail.tsx` | Xem chi tiết dự án & gói thầu B2B (quy mô 15 tỷ, 850 triệu, 5.2 tỷ), tiêu chí kỹ thuật, đầu mối mua hàng và biểu mẫu nộp hồ sơ năng lực & báo giá B2B trực tiếp. |
| **`CreateOpportunityModal.tsx`** | `CreateOpportunityModal.tsx` | Biểu mẫu cho phép doanh nhân đăng tải dự án/nhu cầu mua sắm B2B mới, phân loại lĩnh vực, chọn ngân sách dự kiến, thời hạn nhận thầu và công bố lên mạng lưới liên minh. |
| **`ScheduleMeetingModal.tsx`** | `ScheduleCalendar.tsx` & `PersonPlanSheet.tsx` | Lên lịch hẹn cuộc gặp 1-1 giữa hai doanh nhân: chọn ngày, khung giờ (09:00, 10:30, 14:00, 15:30, 17:00), hình thức trực tiếp (Offline) hoặc trực tuyến (Google Meet bảo mật), địa điểm & nội dung thảo luận. |
| **`PostMomentModal.tsx`** | `PostMomentModal.tsx` & `MomentComposer.tsx` | Đăng bài chia sẻ khoảnh khắc giao thương, hợp đồng ký kết mới kèm hashtag ngành nghề (`#Ký kết đối tác`, `#Xúc tiến đầu tư`), đính kèm hình ảnh thực tế và tùy chọn phạm vi hiển thị (Toàn mạng lưới vs Nội bộ liên minh). |
| **`MomentCommentModal.tsx`** | `MomentCommentSheet.tsx` & `MomentCommentTree.tsx` | Xem cây bình luận thảo luận B2B dưới mỗi khoảnh khắc, hỗ trợ các biểu tượng tương tác nhanh (`👍 Chúc mừng`, `🤝 Hợp tác`, `👏 Tuyệt vời`, `💡 Tiềm năng`) và gửi phản hồi thời gian thực. |
| **`IdentityPrivacyModal.tsx`** | `IdentityPrivacySheet.tsx` | Bảng điều khiển quyền riêng tư doanh nghiệp: bật/tắt hiển thị SĐT cho người chưa kết nối, ẩn/hiện email công việc, kiểm soát quyền mời hẹn 1-1, cho phép AI Copilot ghép cặp cơ hội và chống sao chép thẻ danh thiếp. |
| **`CardVaultModal.tsx`** | `CardVaultManageSheet.tsx` & `PublicCardConnectPanel.tsx` | Ví lưu trữ danh thiếp điện tử của tất cả đối tác đã thu thập (qua QR, NFC, OCR); hỗ trợ tìm kiếm đa tiêu chí, phân loại thẻ VIP và xuất tệp danh bạ chuẩn vCard (.vcf) lưu vào máy. |


