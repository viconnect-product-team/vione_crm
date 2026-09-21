# NGUYÊN TẮC THIẾT KẾ KIẾN TRÚC & PHÂN TÍCH NGHIỆP VỤ HỆ THỐNG VIONE
## VIONE ECOSYSTEM — SA/BA ENGINEERING RULES, DOMAIN BOUNDARIES & SKILLS MATRIX
*Bộ Quy chuẩn Kỹ thuật Dành cho Chuyên gia Phân tích Nghiệp vụ (Master BA) và Kiến trúc sư Giải pháp (Solution Architect)*

---

## 📌 THÔNG TIN TÀI LIỆU & LỊCH SỬ PHIÊN BẢN

*   **Tên tài liệu:** Quy tắc Thiết kế Kiến trúc & Chuẩn mực Phân tích Nghiệp vụ (SA/BA Rules & Domain Boundaries)
*   **Mã tài liệu:** `VIONE-SABA-STD-05`
*   **Phiên bản:** `3.0.0` (Master BA Edition)
*   **Chủ trì biên soạn:** Hội đồng Kiến trúc & Đổi mới Sáng tạo ViOne (Architecture Review Board - ARB)
*   **Trạng thái:** Đã phê duyệt & Ban hành áp dụng bắt buộc (Mandatory Baseline)

---

## 📑 MỤC LỤC TỔNG THỂ

1. [RANH GIỚI MIỀN NGHIỆP VỤ CỐT LÕI (CORE DOMAIN BOUNDARIES)](#1-ranh-giới-miền-nghiệp-vụ-cốt-lõi-core-domain-boundaries)
   - 1.1 Miền Định danh & Xác thực (Identity & Authentication Domain)
   - 1.2 Miền Quản trị Hiệp hội & Hội viên (Association & Membership Domain)
   - 1.3 Miền Tài chính & Hội phí (Finance & Renewal Domain)
   - 1.4 Miền Sự kiện & Khán phòng (Events & Check-in Domain)
   - 1.5 Miền Giao thương & Mạng lưới B2B (Networking & Matchmaking Domain)
2. [CÁC NGUYÊN TẮC THIẾT KẾ KIẾN TRÚC BẮT BUỘC (MANDATORY ARCHITECTURAL RULES)](#2-các-nguyên-tắc-thiết-kế-kiến-trúc-bắt-buộc)
   - 2.1 Nguyên tắc Cô lập Dữ liệu Đa Tổ chức (Multi-Tenant Isolation)
   - 2.2 Nguyên tắc Vết Kiểm toán Bất biến (Immutable Audit Trail)
   - 2.3 Nguyên tắc Tính toán Hạn kép & Nhất quán Tài chính
   - 2.4 Nguyên tắc Tương thích Ngược URL (`/m/*` ➔ `/association/*`)
3. [DANH MỤC CÁC MẪU CHỐNG CHỈ ĐỊNH (ANTI-PATTERNS TO REJECT)](#3-danh-mục-các-mẫu-chống-chỉ-định-anti-patterns-to-reject)
4. [TIÊU CHUẨN ĐỊNH NGHĨA HOÀN THÀNH (DEFINITION OF DONE - DOD) CHO USER STORIES](#4-tiêu-chuẩn-định-nghĩa-hoàn-thành-definition-of-done---dod-cho-user-stories)

---

# 1. RANH GIỚI MIỀN NGHIỆP VỤ CỐT LÕI (CORE DOMAIN BOUNDARIES)

Để đảm bảo hệ thống không bị biến thành một "khối mã nguồn rối rắm" (Monolithic Spaghetti), hệ sinh thái ViOne được phân chia thành 5 miền nghiệp vụ độc lập (Bounded Contexts) theo chuẩn Domain-Driven Design (DDD):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 VIONE CORE DOMAIN MAP                                  │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
│ 1. IDENTITY & AUTH       │ 2. ASSOCIATION & MEMBER  │ 3. FINANCE & RENEWAL             │
│  • auth.users            │  • associations          │  • invoices                      │
│  • business_identities   │  • members               │  • renewal_audit_log             │
│  • user_roles            │  • member_applications   │  • transactions                  │
│  • JWT & Session revoke  │  • association_benefits  │  • VietQR Napas Gateway          │
├──────────────────────────┴──────────────────────────┴──────────────────────────────────┤
│ 4. EVENTS & AUDITORIUM                              │ 5. NETWORKING & B2B SOCIAL       │
│  • events                                           │  • connections                   │
│  • event_registrations (QR Payload)                 │  • direct_messages               │
│  • CinemaSeatingMap (SK-01 .. SK-06)                │  • business_meetings (1-on-1)    │
│  • Checkin Speed Gate (< 200ms)                     │  • business_relationship_moments │
└─────────────────────────────────────────────────────┴──────────────────────────────────┘
```

## 1.1 Miền Định danh & Xác thực (Identity & Authentication)
- **Thực thể gốc**: `auth.users`, `business_identities`, `user_roles`.
- **Trách nhiệm**: Cấp phát định danh toàn cầu, quản lý JWT token, xử lý đăng nhập đa kênh (Google SSO, Apple ID, Thẻ NFC, Mã thẻ hội viên), kiểm tra phân quyền RBAC.
- **Ranh giới**: Không chứa bất kỳ trường dữ liệu nào liên quan đến nghiệp vụ đóng phí hay điểm danh sự kiện.

## 1.2 Miền Quản trị Hiệp hội & Hội viên (Association & Membership)
- **Thực thể gốc**: `associations`, `members`, `member_applications`, `association_benefits`, `perks`.
- **Trách nhiệm**: Quản lý vòng đời hội viên từ ứng viên nộp đơn từ Landing Page, thẩm định, cấp mã số `M1983-xxx`, lưu trữ hồ sơ doanh nghiệp và bổ nhiệm vai trò Ban Chấp Hành.
- **Ranh giới**: Phụ thuộc vào Miền Định danh để biết tài khoản nào đang thao tác.

## 1.3 Miền Tài chính & Hội phí (Finance & Renewal)
- **Thực thể gốc**: `invoices`, `renewal_audit_log`, `transactions`.
- **Trách nhiệm**: Phát hành hóa đơn thu phí, tích hợp cổng thanh toán VietQR Napas 247, tiếp nhận Webhook ngân hàng và kích hoạt nghiệp vụ kéo dài hạn thẻ (`term_end = term_end + 1 year`).
- **Ranh giới**: Tuyệt đối không can thiệp trực tiếp vào giao diện hiển thị mà chỉ phát sự kiện `MEMBER_RENEWED` qua Message Bus.

## 1.4 Miền Sự kiện & Khán phòng (Events & Auditorium)
- **Thực thể gốc**: `events`, `event_registrations`, `event_ticket_types`.
- **Trách nhiệm**: Tạo sự kiện, quản lý hạn mức đại biểu, phân bổ chỗ ngồi sân khấu VIP (`SK-01` đến `SK-06`), sinh mã vé điện tử QR cá nhân và trạm quét check-in tốc độ cao tại cổng đón tiếp.

## 1.5 Miền Giao thương & Mạng lưới B2B (Networking & B2B Social)
- **Thực thể gốc**: `connections`, `direct_messages`, `business_meetings`, `business_relationship_moments`.
- **Trách nhiệm**: Quản lý mối quan hệ giao thương giữa các chủ doanh nghiệp, bảng tin B2B Moments, tin nhắn trực tiếp mã hóa và lịch hẹn gặp gỡ 1-on-1.

---

# 2. CÁC NGUYÊN TẮC THIẾT KẾ KIẾN TRÚC BẮT BUỘC

## 2.1 Nguyên tắc Cô lập Dữ liệu Đa Tổ chức (Multi-Tenant Isolation)
- **Quy tắc vàng**: Mọi bảng dữ liệu nghiệp vụ đều phải có trường `association_id UUID NOT NULL`.
- **Thực thi**:
  - Tầng Cơ sở dữ liệu: Thiết lập chính sách PostgreSQL Row Level Security (RLS).
  - Tầng Backend NestJS: Mọi query Prisma bắt buộc phải có điều kiện `WHERE association_id = context.association_id`.
  - Nghiêm cấm tuyệt đối việc bỏ sót điều kiện `association_id` dẫn đến rò rỉ dữ liệu giữa CLB CEO 1983 và các hiệp hội khác.

## 2.2 Nguyên tắc Vết Kiểm toán Bất biến (Immutable Audit Trail)
- Mọi thao tác làm thay đổi dữ liệu nhạy cảm (Bổ nhiệm Ban Chấp Hành, Thay đổi trạng thái Hội viên, GIA HẠN HỘI PHÍ, Đổi vai trò Admin) bắt buộc phải ghi 1 bản ghi vào bảng `activity_log` hoặc `renewal_audit_log`.
- Bản ghi kiểm toán bắt buộc phải chứa: `actor_id` (người thực hiện), `timestamp`, `ip_address`, `action`, `target_id`, `details`.
- Không được phép tồn tại bất kỳ API nào cho phép `UPDATE` hoặc `DELETE` trên bảng audit log.

## 2.3 Nguyên tắc Tính toán Hạn kép & Nhất quán Tài chính
- Trạng thái hạn thẻ hội viên phải luôn được tính toán nhất quán dựa trên ngày hiện tại (`CURRENT_DATE`):
  - `renewed`: Đã hoàn tất đóng phí kỳ này (`renewed_at IS NOT NULL`).
  - `due`: Còn trong vòng 30 ngày đến ngày hết hạn (`term_end - CURRENT_DATE <= 30` và `> 0`).
  - `overdue`: Đã quá ngày hết hạn mà chưa gia hạn (`term_end < CURRENT_DATE`).
  - `upcoming`: Còn trên 30 ngày hết hạn.
- Khi thanh toán thành công, hạn thẻ bắt buộc phải tăng thêm chính xác 1 năm (`INTERVAL '1 year'`), không được làm tròn sai lệch ngày.

## 2.4 Nguyên tắc Tương thích Ngược URL (`/m/*` ➔ `/association/*`)
- Nhằm bảo đảm người dùng không bị gián đoạn khi truy cập qua các link cũ đã lưu:
  - Tất cả route `/m/*` phải giữ nguyên cơ chế chuyển tiếp Client Redirect 301 tự động sang `/association/*`.
  - Mọi tài liệu nghiệp vụ và hướng dẫn sử dụng từ phiên bản này trở đi chỉ được phép hướng dẫn người dùng vào `/association/*` và `/auth/mobile/`.

---

# 3. DANH MỤC CÁC MẪU CHỐNG CHỈ ĐỊNH (ANTI-PATTERNS TO REJECT)

Hội đồng Kiến trúc (ARB) và Lead Master BA sẽ **TỪ CHỐI NGAY LẬP TỨC (REJECT GATE)** các đề xuất kỹ thuật vi phạm các lỗi sau:

1. ❌ **Hardcoded Tenant ID**: Viết cứng mã UUID của Hiệp hội trong code thay vì đọc từ `tenant context`.
2. ❌ **Bỏ qua Ràng buộc Cơ sở dữ liệu (Database Bypass)**: Tự ý bỏ các câu lệnh `CHECK CONSTRAINT` (như `invoices_status_check`, `brm_target_xor`) để code chạy tạm thời.
3. ❌ **Xóa cứng Dữ liệu Nghiệp vụ (Hard Delete)**: Xóa thẳng tay hội viên hoặc hóa đơn bằng lệnh `DELETE FROM members` trong production thay vì chuyển `status = 'resigned'` hoặc `status = 'archived'`.
4. ❌ **Viết hoa thường lộn xộn trong URL**: Tạo các URL như `/Auth/Mobile` hoặc `/Association/News` thay vì chuẩn kebab-case chữ thường `/auth/mobile` và `/association/news`.
5. ❌ **Đổi Màu Nhận Diện Tùy Tiện**: Vi phạm bảng màu quy chuẩn Phiên bản 1 (Classic Navy & Gold) của CLB Doanh Nhân CEO 1983: Deep Cobalt Navy (`#003B95` / `#002B70`) kết hợp Warm Amber Gold (`#F59E0B` / `#D97706` / `#EA580C`) và logo dập nổi CEO 1983; hoặc dùng lại các tone màu sky xanh lơ cũ.

---

# 4. TIÊU CHUẨN ĐỊNH NGHĨA HOÀN THÀNH (DOD) CHO USER STORIES

Một User Story chỉ được coi là hoàn tất và sẵn sàng nghiệm thu (Ready for UAT) khi thỏa mãn toàn bộ 7 tiêu chí trong bảng kiểm sau:

- [x] **1. Tài liệu Hóa Đầy Đủ**: Có kịch bản nghiệm thu rõ ràng (Gherkin format Given-When-Then) trong tài liệu SRS.
- [x] **2. Ràng Buộc Dữ Liệu Chặt Chẽ**: Schema DB có đầy đủ khóa ngoại, index tìm kiếm và check constraint ngăn chặn dữ liệu bẩn.
- [x] **3. UI/UX Chuẩn Nhận Diện**: Tuân thủ đúng bảng màu (Phiên bản 1: Navy & Gold `#003B95` kết hợp `#F59E0B` cho Hiệp hội CEO 1983; Đen Vàng `#0A0A0B` / `#D8B282` cho ViOne Connect), có hiệu ứng loading skeleton và thông báo toast Sonner.
- [x] **4. Xử Lý Lỗi Toàn Diện**: Có xử lý màn hình trống (Empty State), lỗi mất mạng, lỗi 403 không có quyền và lỗi 404 không tìm thấy dữ liệu.
- [x] **5. Kiểm Toán An Ninh (Audit Log)**: Mọi thao tác thay đổi dữ liệu nhạy cảm đều được ghi log bất biến.
- [x] **6. Kiểm Thử Tự Động (E2E Test)**: Có kịch bản kiểm thử tự động trong bộ test suite và chạy Pass 100%.
- [x] **7. Tài Liệu Hóa Trong File Excel**: Được liệt kê đầy đủ mã WBS trong file Excel PM Matrix và có Test Case tương ứng trong file Excel QA Suite.
