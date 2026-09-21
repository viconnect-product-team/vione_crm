# TÀI LIỆU THIẾT KẾ KỸ THUẬT & DANH MỤC API CHUẨN MỰC
## VIONE ECOSYSTEM — TECHNICAL ARCHITECTURE & API CONTRACT SPECIFICATION
*Tài liệu Đặc tả Kiến trúc Phần mềm & Hợp đồng API (API Contracts) Dành cho Đội ngũ Backend, Frontend, Mobile Dev và QA*

---

## 📌 MỤC LỤC

1. [KIẾN TRÚC HỆ THỐNG & CÔNG NGHỆ (SYSTEM ARCHITECTURE)](#1-kiến-trúc-hệ-thống--công-nghệ)
   - 1.1. Cấu trúc Monorepo & Phân ranh trách nhiệm
   - 1.2. Hạ tầng Dịch vụ & Cơ chế Multi-Tenant
   - 1.3. Cơ chế Bảo mật & Quy chuẩn Headers
2. [DANH MỤC API CHI TIẾT THEO PHÂN HỆ (API CATALOG)](#2-danh-mục-api-chi-tiết-theo-phân-hệ)
   - 2.1. Phân hệ Xác thực & Quản lý Phiên (Auth & Mobile Login)
   - 2.2. Phân hệ Quản lý Hội viên & Thẩm định (Members & Applications)
   - 2.3. Phân hệ Sự kiện, Khán phòng & Điểm danh QR (Events & Check-in)
   - 2.4. Phân hệ Tài chính, Hội phí & Cổng VietQR (Fees, Invoices & Webhooks)
   - 2.5. Phân hệ Quyền lợi & Đặc quyền Đối tác (Benefits & Perks)
   - 2.6. Phân hệ Sàn Giao thương B2B (Marketplace & Quotes)
   - 2.7. Phân hệ Mạng xã hội Doanh nhân (B2B Moments & Feed)
   - 2.8. Phân hệ Kết nối & Nhắn tin Realtime (Connections & Direct Messages)
   - 2.9. Phân hệ Điều phối Cuộc hẹn B2B (Business Meetings 1-on-1)
   - 2.10. Phân hệ Danh tính số & Thẻ Thông minh NFC (Smart Cards & NFC)
3. [MÔ HÌNH DỮ LIỆU & RÀNG BUỘC CƠ SỞ DỮ LIỆU (DATABASE SCHEMA & CONSTRAINTS)](#3-mô-hình-dữ-liệu--ràng-buộc-cơ-sở-dữ-liệu)
4. [HỆ THỐNG WEBSOCKET & TỰ ĐỘNG HÓA NOTIFICATION](#4-hệ-thống-websocket--tự-động-hóa-notification)
5. [QUY TRÌNH BIÊN DỊCH & TRIỂN KHAI (BUILD & DEPLOYMENT)](#5-quy-trình-biên-dịch--triển-khai)

---

# 1. KIẾN TRÚC HỆ THỐNG & CÔNG NGHỆ

## 1.1. Cấu trúc Monorepo & Phân ranh trách nhiệm
Dự án được tổ chức theo kiến trúc Monorepo chuẩn mực với Yarn Workspaces:
```
vione_app/
├── apps/
│   ├── vione_app_fe/        # Frontend: TanStack Start / React 19 / Vite / TailwindCSS / Nitro SSR
│   ├── vione_app_be/        # Backend: NestJS / Prisma ORM / WebSockets / Passport JWT
│   └── mobile/              # Mobile Native Wrapper: Capacitor 8 (Android & iOS)
├── packages/
│   ├── db/                  # Prisma Schema, Database Migrations, Seeders
│   └── shared/              # Shared TypeScript Types, DTOs, Enums, Locales (8 languages)
└── document/                # Tài liệu phân tích nghiệp vụ, tài liệu kỹ thuật, Excel matrices
```

## 1.2. Hạ tầng Dịch vụ & Cơ chế Multi-Tenant
- **Database Engine**: PostgreSQL 16+ với các phần mở rộng `uuid-ossp`, `pgcrypto`.
- **Cache & Message Broker**: Redis 7.2 (Quản lý phiên, giới hạn tần suất gọi API `sync_rate_limits`, Pub/Sub Realtime).
- **Cơ chế Đa Hiệp hội (Multi-Tenant)**: Mọi bảng dữ liệu nghiệp vụ (`members`, `events`, `invoices`, `products`, `connections`) đều bắt buộc chứa cột `association_id UUID NOT NULL` với chính sách Row Level Security (RLS) bảo đảm cô lập dữ liệu tuyệt đối giữa các tổ chức.

## 1.3. Cơ chế Bảo mật & Quy chuẩn Headers
Mọi request gửi tới Backend (ngoại trừ các endpoint công khai như Landing, xem thông tin thẻ công khai) bắt buộc phải truyền header:
```http
Content-Type: application/json
Authorization: Bearer <JWT_ACCESS_TOKEN>
x-association-id: <ASSOCIATION_UUID>
```

Mã phản hồi chuẩn RESTful:
- `200 OK`: Truy vấn hoặc xử lý thành công.
- `201 Created`: Tạo mới bản ghi thành công.
- `400 Bad Request`: Payload không hợp lệ hoặc vi phạm kiểm tra tính hợp lệ dữ liệu.
- `401 Unauthorized`: Token không hợp lệ hoặc đã hết hạn.
- `403 Forbidden`: Người dùng không có quyền (RBAC) thực hiện thao tác.
- `404 Not Found`: Không tìm thấy tài nguyên.
- `409 Conflict`: Vi phạm ràng buộc duy nhất (Unique Constraint) trong cơ sở dữ liệu.
- `500 Internal Server Error`: Lỗi hệ thống ngoài dự kiến.

---

# 2. DANH MỤC API CHI TIẾT THEO PHÂN HỆ

## 2.1. Phân hệ Xác thực & Quản lý Phiên (Auth & Mobile Login)

### 1. `POST /api/auth/mobile/login`
- **Mô tả**: Đăng nhập chuyên dụng dành cho ứng dụng di động Hiệp hội (`/auth/mobile`).
- **Phân quyền**: Công khai.
- **Request Body**:
```json
{
  "identifier": "M1983-002",
  "password": "SecurePassword@1983",
  "association_id": "c1983000-0000-4000-8000-000000001983"
}
```
- **Response 200 OK**:
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "refresh_token": "def50200...",
  "mustChangePassword": false,
  "user": {
    "id": "00000000-0000-4000-8000-000000000002",
    "member_code": "M1983-002",
    "full_name": "James Nguyễn",
    "role": "bch_pho_chu_tich",
    "status": "active",
    "mustChangePassword": false,
    "term_end": "2027-09-13",
    "association": {
      "id": "c1983000-0000-4000-8000-000000001983",
      "name": "CLB Doanh Nhân CEO 1983",
      "slug": "ceo1983"
    }
  }
}
```
> **Lưu ý nghiệp vụ Bảo mật Onboarding**: Nếu tài khoản hội viên mới (`user_profiles.onboarding_status === 'new'`), cờ `mustChangePassword` sẽ trả về `true`. Ứng dụng App Hiệp Hội tự động phát hiện cờ này và điều hướng bắt buộc sang `/association/settings?action=change_password&required=true`. Sau khi đổi mật khẩu thành công (`onboarding_status = 'completed'`), hệ thống tự động đăng xuất và điều hướng ra màn hình đăng nhập để xác thực lại.

### 2. `POST /api/auth/mobile/card-scan`
- **Mô tả**: Đăng nhập nhanh bằng thẻ vật lý NFC hoặc quét mã QR in trên thẻ hội viên.
- **Request Body**:
```json
{
  "card_token": "VIONE-CARD-TOKEN-ABCXYZ-9988",
  "device_id": "iPhone-15-Pro-Max-Device-UID"
}
```
- **Response 200 OK**: Trả về `access_token` và nạp tự động thông tin hội viên tương ứng.

### 3. `POST /api/auth/register`
- **Mô tả**: Đăng ký tài khoản người dùng mới trên hệ sinh thái ViOne / CEO 1983. Sau khi tạo user trong DB, hệ thống tự động gửi email chào mừng kích hoạt tài khoản chuẩn nhận diện thương hiệu HanoiBA CEO 1983 (`sendAppWelcomeRegistrationEmail`) tới địa chỉ email đăng ký.
- **Request Body**:
```json
{
  "email": "member.new@example.com",
  "password": "SecurePassword@123",
  "fullName": "Trần Thị Mai",
  "phone": "0988776655",
  "association_id": "c1983000-0000-4000-8000-000000001983"
}
```
- **Response 201 Created**:
```json
{
  "success": true,
  "message": "Đăng ký tài khoản thành công. Email chào mừng và hướng dẫn kích hoạt đã được gửi tới hòm thư của bạn.",
  "user": {
    "id": "uuid-user-id",
    "email": "member.new@example.com",
    "fullName": "Trần Thị Mai",
    "phone": "0988776655"
  }
}
```

---

## 2.2. Phân hệ Quản lý Hội viên & Thẩm định (Members & Applications)

### 1. `GET /api/members`
- **Mô tả**: Lấy danh sách hội viên hiệp hội, hỗ trợ bộ lọc và phân trang.
- **Query Params**:
  - `status`: `active` | `due` | `overdue` | `renewed` | `all`
  - `type`: `company` (tự động gom nhóm các loại `company`, `enterprise`, `corporate`) | `individual` | `all`
  - `industry`: Tên ngành nghề (ví dụ: `Technology`, `Real Estate`)
  - `page`: Số trang (mặc định: `1`)
  - `limit`: Số bản ghi mỗi trang (mặc định: `20`)
- **Response 200 OK**:
```json
{
  "data": [
    {
      "id": "MEM-1983-100",
      "code": "M1983-100",
      "name": "Tập đoàn Công nghệ Kho Group",
      "contact": "Đặng Minh Khôi",
      "company": "Tập đoàn Công nghệ Kho Group",
      "email": "khoi.dang@khogroup.vn",
      "phone": "0912345678",
      "type": "company",
      "level": "memberLevel.large",
      "industry": "ind.it",
      "region": "region.north",
      "status": "active",
      "term_end": "2027-09-13",
      "taxCode": "0109988776",
      "website": "https://khoiminh.tech",
      "employees": 250,
      "address": "Tầng 12 ViOne Tech Hub, Cầu Giấy, Hà Nội",
      "about": "Hệ sinh thái phần mềm quản trị toàn diện và chuyển đổi số cho doanh nghiệp SME."
    }
  ],
  "pagination": { "total": 17, "page": 1, "limit": 50, "totalPages": 1 }
}
```

### 2. `POST /api/member-applications/approve`
- **Mô tả**: Thư ký / Chủ tịch phê duyệt hồ sơ ứng viên và cấp mã hội viên chính thức.
- **Request Body**:
```json
{
  "application_id": "f1a2b3c4-0000-4000-8000-000000000001",
  "member_code": "M1983-099",
  "type": "corporate",
  "level": "member",
  "industry": "Công nghệ thông tin",
  "region": "Hà Nội",
  "term_end": "2027-09-13",
  "executive_role": "Hội viên chính thức"
}
```
- **Response 201 Created**:
```json
{
  "success": true,
  "message": "Đã phê duyệt thành công hồ sơ và cấp mã hội viên M1983-099",
  "member_id": "MEM-1983-099"
}
```

### 3. `PATCH /api/members/me/profile` & `POST /api/members/me/profile`
- **Mô tả**: Cập nhật hồ sơ cá nhân và thông tin hội viên của chính tài khoản đăng nhập hiện tại. Tự động đồng bộ xuyên suốt 4 bảng CSDL: `vione_users`, `user_profiles`, `members`, `member_business_cards`.
- **Headers**:
  - `Authorization: Bearer <jwt_token>` hoặc Cookie `auth_token`
- **Request Body**:
```json
{
  "full_name": "Nguyễn Minh Khôi",
  "position": "Tổng Giám Đốc",
  "company_name": "Tập đoàn Công nghệ Kho Group",
  "phone": "0912345678",
  "email": "khoi.dang@khogroup.vn",
  "address": "Tầng 12 ViOne Tech Hub, Cầu Giấy, Hà Nội",
  "website": "https://khoiminh.tech",
  "bio": "Chuyên gia chuyển đổi số và phát triển phần mềm doanh nghiệp.",
  "avatar_url": "data:image/jpeg;base64,..."
}
```
- **Response 200 OK**:
```json
{
  "success": true,
  "message": "Cập nhật hồ sơ hội viên thành công",
  "data": {
    "user_id": "usr-1983-001",
    "member_id": "MEM-1983-100",
    "full_name": "Nguyễn Minh Khôi",
    "position": "Tổng Giám Đốc",
    "company_name": "Tập đoàn Công nghệ Kho Group",
    "phone": "0912345678",
    "avatar_url": "data:image/jpeg;base64,..."
  }
}
```

---

## 2.3. Phân hệ Sự kiện, Khán phòng & Điểm danh QR (Events & Check-in)

### 1. `POST /api/events`
- **Mô tả**: Tạo sự kiện hoặc hội thảo giao thương mới.
- **Request Body**:
```json
{
  "name": "Diễn đàn Giao thương & Gala Doanh nhân CEO 1983",
  "date": "2026-09-20",
  "location": "Trung tâm Hội nghị Quốc gia, Hà Nội",
  "capacity": 250,
  "fee": 0,
  "status": "published"
}
```
- **Response 201 Created**: Sinh `id: EVT-CEO1983-2026-GALA`.

### 2. `POST /api/events/checkin-verify`
- **Mô tả**: Trạm lễ tân quét camera nhận diện mã QR của đại biểu và xác nhận vào cửa.
- **Request Body**:
```json
{
  "qr_payload": "QR-CEO1983-EVT-001",
  "event_id": "EVT-CEO1983-2026-GALA",
  "device_name": "Tablet-Lễ-Tân-Cổng-1"
}
```
- **Response 200 OK**:
```json
{
  "success": true,
  "member_name": "James Nguyễn",
  "member_code": "M1983-002",
  "seat_assignment": "VIP-SK-02",
  "checked_in_at": "2026-09-20T08:15:30.000Z",
  "message": "Điểm danh thành công"
}
```

### 3. `POST /api/events/:id/register`
- **Mô tả**: Hội viên đăng ký tham gia sự kiện Hiệp hội trên di động.
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Response 200 OK**:
```json
{
  "ok": true,
  "registrationId": "REG-M1983-EVT-01"
}
```

### 4. `POST /api/events/:id/cancel`
- **Mô tả**: Hội viên chủ động hủy đăng ký tham gia sự kiện.
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Xử lý**: Cập nhật trạng thái vé `status = 'cancelled'` trong bảng `public.event_registrations`, trừ số lượng `registered = GREATEST(0, registered - 1)` trên bảng `public.events`, và phát thông báo xác nhận hủy thành công.
- **Response 200 OK**:
```json
{
  "ok": true,
  "cancelled": true
}
```

### 5. `GET /api/events/:id/seating-map` & Sơ đồ Ghế Khán Phòng Tương Tác (Manual Floor Seating)
- **Mô tả**: Quản lý và trực quan hóa sơ đồ chỗ ngồi sự kiện. Hỗ trợ 2 chế độ hiển thị:
  1. **Xem theo hàng cố định (Cinema Rows)**: Phân bổ hàng ghế chữ cái (A, B, C...) kèm chỉ số ghế và danh mục (VIP/Standard).
  2. **Xếp ghế bằng tay dưới sân khấu (Interactive Draggable Floor Canvas)**: Cho phép Ban tổ chức dùng chuột/chạm kéo thả tự do tọa độ `(x, y)` từng ghế khán phòng, thêm ghế VIP/Tiêu chuẩn tức thì và căn đều khoảng cách.
- **Thẻ Sự Kiện & Bố Cục Section Đa Dạng (Event Section Architecture & Visual Poster Card)**: 
  - Danh sách sự kiện App Hiệp Hội được cấu trúc hóa theo từng Section chuyên biệt rõ ràng:
    1. **Đại Hội & Gala Toàn Thể**: Hero Poster lớn tỷ lệ vàng (h-64/h-72), viền vàng kim hoàng gia `border-amber-400/50`, ánh kim amber glow, badge Tiêu Điểm Thượng Đỉnh.
    2. **Hội Thảo & Workshop Chuyên Đề**: Lưới Grid 2 cột sắc nét trên màn hình rộng, badge Xanh dương tri thức.
    3. **Tọa Đàm & Giao Thương B2B**: Bố cục thẻ xúc tiến thương mại đối tác, badge Xanh ngọc phát triển.
    4. **Sinh Hoạt Định Kỳ & Coffee CEO**: Bố cục thẻ thân mật thường nhật, badge Tím sang trọng.
  - Tối giản 100% text thân thẻ ngoài danh sách (không có text rườm rà dưới thân thẻ), chuyển thành poster hội trường sang trọng `rounded-3xl` với Date Badge trắng đỏ chuẩn quốc tế (Tháng/Ngày/Thứ), Badge trạng thái `✓ Đã đăng ký`/Giá vé/Miễn phí + Bookmark góc trên phải, và capsule mờ tối hiển thị đồng hồ + bộ đếm ngược countdown timer + category ở đáy. Nhấp vào thẻ để mở Modal chi tiết toàn diện.

---

## 2.4. Phân hệ Tài chính, Hội phí & Cổng VietQR (Fees, Invoices & Webhooks)

### 0. `GET /api/admin/invoices`
- **Mô tả**: Truy vấn danh sách hóa đơn toàn hệ thống cho quản trị viên CRM.
- **Ràng buộc Schema PostgreSQL**:
  - Mã hội viên và số điện thoại được liên kết từ bảng `members` (`m.code`, `m.phone`). Bảng `vione_users` không chứa cột `code` và `phone`. Query bắt buộc sử dụng `COALESCE(m.code, '')` và `COALESCE(m.phone, '')` để tránh lỗi PostgreSQL 42703.

### 1. `POST /api/fees/invoices/generate`
- **Mô tả**: Phát hành HÓA ĐƠN HỘI PHÍ cho hội viên.
- **Request Body**:
```json
{
  "member_id": "MEM-1983-099",
  "year": 2026,
  "amount": 10000000,
  "due_date": "2026-09-28",
  "method": "bank"
}
```
- **Response 201 Created**:
```json
{
  "invoice_no": "INV-2026-099",
  "amount": 10000000,
  "status": "unpaid",
  "vietqr_url": "https://img.vietqr.io/image/MBBANK-0988776655-compact2.png?amount=10000000&addInfo=CEO1983%20M1983-099%20RENEW"
}
```

### 2. `POST /api/webhooks/payment/vietqr`
- **Mô tả**: Webhook tiếp nhận tín hiệu chuyển khoản thành công từ ngân hàng/cổng thanh toán.
- **Request Body**:
```json
{
  "transaction_id": "TXN-VIONE-998822",
  "amount": 10000000,
  "content": "CEO1983 M1983-005 RENEW",
  "bank_brand": "MBBANK",
  "timestamp": "2026-09-13T10:00:00Z"
}
```
- **Logic xử lý backend**:
  1. Trích xuất mã hội viên `M1983-005`.
  2. Bắt đầu transaction nguyên tử:
     - `UPDATE invoices SET status='paid', paid_at=CURRENT_DATE`
     - `UPDATE members SET term_end=term_end + INTERVAL '1 year', renewed_at=CURRENT_DATE`
     - `INSERT INTO renewal_audit_log (event_type='payment', amount_paid=10000000, reference='TXN-VIONE-998822')`
  3. Bắn thông báo Socket Realtime tới màn hình `/association/renew/result`.

---

## 2.5. Phân hệ Quyền lợi & Đặc quyền Đối tác (Benefits & Perks)

### 1. `GET /api/benefits`
- **Mô tả**: Lấy danh sách quyền lợi chính thức của hội viên từ bảng `public.association_benefits`.
- **Response 200 OK**:
```json
[
  {
    "id": "b1a2c3d4-0000-4000-8000-000000000001",
    "title_vi": "Xúc tiến thương mại & Kết nối B2B toàn quốc",
    "desc_vi": "Tham gia mạng lưới giao thương hơn 500+ doanh nghiệp thành viên CEO 1983.",
    "sort_order": 1
  }
]
```

### 2. `GET /api/members/benefits/admin`
- **Mô tả**: Danh sách quyền lợi quản trị (trang `/benefits`), hỗ trợ song ngữ `titleVi`, `titleEn`, `descVi`, `descEn`, sắp xếp `sortOrder`.
- **Response 200 OK**:
```json
[
  {
    "id": "82eecea0-b47c-4657-ad25-a6802a4fd1ed",
    "titleVi": "Giao thương đồng niên 1983",
    "titleEn": "1983 Peer Trade & Network",
    "descVi": "Môi trường tin cậy kết nối cùng thế hệ doanh nhân Quý Hợi",
    "descEn": "Trusted networking among 1983 entrepreneurs",
    "sortOrder": 1
  }
]
```

### 3. `POST /api/members/benefits/admin`
- **Mô tả**: Tạo mới quyền lợi hội viên trong CRM Admin.
- **Request Body**:
```json
{
  "titleVi": "Đào tạo lãnh đạo & Cố vấn chiến lược",
  "titleEn": "Leadership Coaching & Strategy Mentorship",
  "descVi": "Chuỗi hội thảo chuyên đề hàng quý cùng chuyên gia đầu ngành",
  "descEn": "Quarterly strategic seminars with leading industry experts",
  "sortOrder": 5
}
```

### 4. `PUT /api/members/benefits/admin/:id` & `DELETE /api/members/benefits/admin/:id`
- **Mô tả**: Cập nhật hoặc xóa quyền lợi hội viên khỏi hệ thống.


---

## 2.6. Phân hệ Sàn Giao thương B2B (Marketplace & Opportunities)

### 1. `POST /api/marketplace/products`
- **Mô tả**: Đăng bán sản phẩm / dịch vụ của doanh nghiệp lên chợ thương mại nội bộ.
- **Request Body**:
```json
{
  "title": "Hệ sinh thái Chuyển đổi số Doanh nghiệp ViOne",
  "description": "Giải pháp CRM kết nối hội viên và sàn thương mại B2B toàn diện",
  "price": 45000000,
  "category": "Phần mềm B2B",
  "status": "active"
}
```

### 2. `GET /api/marketplace/products` & `GET /api/marketplace/products/:id`
- **Mô tả**: Lấy danh sách hoặc chi tiết sản phẩm. Hệ thống tự động LEFT JOIN với `members` và `vione_users` để trả về đầy đủ định danh người đăng (`sellerName`, `sellerAvatar`, `sellerPhone`, `sellerCompany`), hỗ trợ hiển thị thẻ sản phẩm và danh bạ người yêu cầu báo giá (`quotes`).

### 3. `GET /api/opportunities` & `GET /api/opportunities/:id`
- **Mô tả**: Lấy danh sách hoặc chi tiết cơ hội giao thương B2B. Hệ thống LEFT JOIN với bảng `members` và `vione_users` để trả về thông tin người khởi tạo (`posterName`, `posterAvatar`, `posterPhone`, `posterCompany`) cùng danh sách người quan tâm (`interests`).

### 4. `GET /api/opportunities/:id/interests`
- **Mô tả**: Endpoint chuyên biệt trả về danh sách hội viên bày tỏ sự quan tâm đến cơ hội, gồm: `memberName`, `memberAvatar`, `memberPhone`, `memberEmail`, `company`, `expressedAt`.

### 5. `POST /api/public/club-registration`
- **Mô tả**: Nhận hồ sơ đăng ký từ Landing Page CEO v1 (`/landing/ceo/v1`). Bổ sung trường `industry` (Lĩnh vực hoạt động). Hệ thống tự động tạo hồ sơ hội viên và cấp tài khoản đăng nhập tức thì với mật khẩu mặc định an toàn là `123456` (được mã hóa bằng bcrypt). Người dùng có thể đăng nhập ngay vào App Hiệp Hội bằng SĐT/Email.

---

## 2.7. Phân hệ Mạng xã hội Doanh nhân (B2B Moments & Feed)

### 1. `POST /api/moments`
- **Mô tả**: Đăng bài viết chia sẻ cơ hội giao thương trên `/connect-app/moment`.
- **Request Body**:
```json
{
  "target_kind": "connection",
  "event_name": "Tìm kiếm đối tác AI ERP",
  "note": "Doanh nghiệp chúng tôi đang tìm kiếm đối tác cung ứng giải pháp AI Logistics.",
  "status": "active"
}
```

---

---

## 2.8. Phân hệ Kết nối Doanh nhân & Nhắn tin Realtime (Network Connections & Direct Messages)

### 1. `POST /api/connect-app/network/requests` (hoặc `/api/network/requests`)
- **Mô tả**: Gửi lời mời kết nối kinh doanh từ tài khoản hiện tại tới đối tác đích (`targetUserId`). Hệ thống tự động ghi nhận vào bảng `public.user_connections` với trạng thái `pending`, đồng thời bắn thông báo real-time qua WebSocket và lưu trữ vào `public.business_notifications` cùng `public.member_notifications` với `action_target: { route: "/connect-app/network", search: { tab: "requests" } }`.
- **Request Body**:
```json
{
  "targetUserId": "00000000-0000-4000-8000-000000000001"
}
```
- **Response (200 OK)**:
```json
{
  "ok": true,
  "connectionId": "c8a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "status": "pending",
  "message": "Đã gửi lời mời kết nối thành công"
}
```

### 2. `GET /api/connect-app/network/requests/incoming`
- **Mô tả**: Lấy danh sách các lời mời kết nối gửi đến tài khoản hiện tại đang ở trạng thái `pending`.
- **Response (200 OK)**:
```json
[
  {
    "id": "c8a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "counterpartUserId": "00000000-0000-4000-8000-000000000002",
    "status": "pending",
    "createdAt": "2026-09-13T08:00:00.000Z"
  }
]
```

### 3. `PATCH /api/connect-app/network/connections/:id`
- **Mô tả**: Chấp thuận (`status: "accepted"`) hoặc từ chối (`status: "declined"`) lời mời kết nối. Khi chấp thuận, hai tài khoản trở thành bạn bè kết nối chính thức trong tab Mạng lưới (Network).
- **Request Body**:
```json
{
  "status": "accepted"
}
```

### 4. `POST /api/connect-app/network/connections/resolve`
- **Mô tả**: Phân giải danh tính an toàn công khai (tên hiển thị thực tế, ảnh đại diện, chức danh, công ty) cho danh sách `userIds`.
- **Request Body**:
```json
{
  "userIds": ["00000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000002"]
}
```
- **Response (200 OK)**:
```json
[
  {
    "userId": "00000000-0000-4000-8000-000000000001",
    "displayName": "Trần Tuấn Anh",
    "avatarUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    "headline": "Platform Administrator",
    "companyName": "ViConnect Holdings"
  }
]
```

### 5. `GET /api/connect-app/network/recommendations/today`
- **Mô tả**: Trả về danh sách gợi ý kết nối AI thông minh hôm nay dựa trên vị trí địa lý, quy mô doanh nghiệp và chức vụ (C-Level, Founder, Giám đốc), tích hợp tính năng tự động hiển thị trên Trang chủ và tab Mạng lưới.

### 6. `POST /api/messages/direct`
- **Mô tả**: Gửi tin nhắn trao đổi 1-on-1 trong `/connect-app/inbox`.
- **Request Body**:
```json
{
  "thread_id": "b8c9d0e1-0000-4000-8000-000000000010",
  "sender_user_id": "00000000-0000-4000-8000-000000000002",
  "body": "Chào anh Tuấn Anh, tuần tới mình sắp xếp buổi B2B 1-1 tại Keangnam nhé!"
}
```

### 7. `GET /api/connect-app/dm/member/conversations`
- **Mô tả**: Lấy danh sách hội thoại của thành viên trong Hiệp hội (`/association/messages`). Tự động nhận diện tài khoản người dùng, ghim kênh chính thức "Ban Thư Ký CLB Doanh Nhân CEO 1983" (admin) lên vị trí đầu tiên (`isSystem: true`, avatar `/ceo1983-logo.png`).
- **Response (200 OK)**:
```json
[
  {
    "peerCode": "admin",
    "peerName": "Ban Thư Ký CLB Doanh Nhân CEO 1983",
    "avatarUrl": "/ceo1983-logo.png",
    "lastMessage": "Thông báo: Nộp HỘI PHÍ THƯỜNG NIÊN 2026...",
    "lastTime": "2026-09-13T10:00:00.000Z",
    "unreadCount": 1,
    "isSystem": true
  },
  {
    "peerCode": "M1983-002",
    "peerName": "James Nguyễn",
    "avatarUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    "lastMessage": "Tuần tới anh em mình cafe nhé!",
    "lastTime": "2026-09-13T09:30:00.000Z",
    "unreadCount": 0,
    "isSystem": false
  }
]
```

### 8. `GET /api/connect-app/dm/member/messages?peerCode={code}`
- **Mô tả**: Lấy lịch sử tin nhắn 1-on-1 giữa thành viên hiện tại và đối tác `peerCode` (hoặc kênh hệ thống `admin`).
- **Hỗ trợ thẻ thông báo giao dịch Zalo OA (`ZaloTransactionCard`)**:
  Khi tin nhắn chứa định dạng:
  `[action:payment|amount=20000000|code=HD-2026-001|title=HỘI PHÍ THƯỜNG NIÊN 2026|dueDate=31/03/2026]`
  Hệ thống tự động hiển thị thẻ thông báo giao dịch chuẩn Zalo Official Account với thông tin chuyển khoản MB Bank (`198388889999`), nút bật mã VietQR, nút tải ảnh QR và sao chép số tài khoản.
- **Hỗ trợ thẻ thư mời họp (`action:meeting`)**:
  `[action:meeting|title=Đại hội Thường niên 2026|time=08:30 - 15/04/2026|location=Keangnam Landmark 72|link=https://meet.google.com/ceo-1983]`



---

## 2.9. Phân hệ Điều phối Cuộc hẹn B2B (Business Meetings 1-on-1)

### 1. `POST /api/meetings/schedule`
- **Mô tả**: Khởi tạo lịch hẹn gặp mặt B2B tại `/business-connect/meetings`.
- **Request Body**:
```json
{
  "association_id": "c1983000-0000-4000-8000-000000001983",
  "organizer_user_id": "00000000-0000-4000-8000-000000000002",
  "title": "B2B 1-on-1: Hợp tác triển khai AI ERP",
  "description": "Thảo luận phương án tích hợp hệ sinh thái giải pháp",
  "meeting_type": "networking",
  "status": "confirmed",
  "timezone": "Asia/Ho_Chi_Minh",
  "source_type": "association"
}
```

---

## 2.10. Phân hệ Danh tính số & Thẻ Thông minh NFC (Smart Cards & NFC)

### 1. `GET /api/public/card/{slug}.vcf`
- **Mô tả**: Xuất file vCard 3.0 chuẩn quốc tế để người dùng quét QR lưu thẳng vào danh bạ điện thoại thông minh.
- **Response**: Trả về `Content-Type: text/vcard; charset=utf-8` chứa đầy đủ họ tên, công ty, hotline, chức danh và logo.

---

## 2.11. Phân hệ Sơ đồ Bàn tiệc Gala & Phân bổ Chỗ ngồi VIP (VIP Seating & Table Distribution)

### 1. `POST /api/events/:eventId/seating/allocate`
- **Mô tả**: Phân bổ tự động hoặc chỉ định thủ công đại biểu/hội viên VIP vào sơ đồ bàn tiệc.
- **Request Body**:
```json
{
  "event_id": "c1983000-0000-4000-8000-000000001983",
  "registration_id": "d0000000-0000-4000-8000-000000000001",
  "table_number": "VIP-01",
  "seat_number": "A1",
  "tier": "diamond_sponsor",
  "dietary_notes": "Ăn chay dưỡng sinh, không hành tỏi"
}
```
- **Kiosk Realtime Routing**: Khi đại biểu quét QR check-in thành công tại quầy lễ tân, WebSocket gateway kích hoạt sự kiện `EVENT_SEATING_LOCATED`, hiển thị trực quan bản đồ hội trường dẫn đường tới đúng bàn tiệc.

---

## 2.12. Động cơ Điều phối Thông báo Đa kênh (Multi-Channel Notification Orchestration Engine)

### 1. `POST /api/notifications/dispatch`
- **Mô tả**: Gửi thông báo phân tầng qua 5 kênh: Push Notification (Firebase FCM), In-App (Realtime Supabase), SMS Brandname, Email (SendGrid/Amazon SES), và Zalo ZNS (Zalo Notification Service).
- **Quy tắc Kiểm duyệt & Ràng buộc Hệ thống**:
  - `priority`: Chỉ chấp nhận 4 mức độ theo check constraint cơ sở dữ liệu: `['critical', 'high', 'normal', 'informational']`.
  - `status`: Tuân thủ nghiêm ngặt enum: `['pending', 'scheduled', 'delivered', 'read', 'archived', 'expired', 'cancelled']`.
  - Không có trường `is_read` boolean; chuyển trạng thái đã đọc bằng `status = 'read'` và cập nhật `read_at = NOW()`.
  - **Deduplication Engine**: Hash MD5 nội dung + recipient + time bucket (5 phút) để triệt tiêu spam tin nhắn trùng lặp.
  - **DND Filter**: Bộ lọc giờ cấm làm phiền (22:00 - 07:00). Các tin mức `normal` và `informational` tự động dời lịch sang 07:30 sáng hôm sau. Mức `critical` được bypass DND.
  - **Exponential Backoff Retry**: Tự động retry tối đa 3 lần với khoảng cách 1s, 4s, 16s nếu nhà mạng trả về lỗi timeout.

---

## 2.13. Động cơ Bầu cử Số & Biểu quyết Đại hội (Digital Election, Voting Tokens & Quorum Engine)

### 1. `POST /api/elections/:electionId/vote`
- **Mô tả**: Bỏ phiếu tín nhiệm BCH hoặc biểu quyết nghị quyết đại hội trực tuyến với chữ ký số token.
- **Request Body**:
```json
{
  "election_id": "e1983000-0000-4000-8000-000000000001",
  "voter_id": "00000000-0000-4000-8000-000000000002",
  "ballot": [
    { "candidate_id": "cand_01", "vote": "agree", "weight": 1.0 },
    { "candidate_id": "cand_02", "vote": "agree", "weight": 1.0 }
  ],
  "voting_token": "VT-HASH-SECURE-983F12"
}
```
- **Quorum Engine**: Tự động tính toán tỷ lệ đại biểu tham dự hợp lệ trên tổng số hội viên chính thức có quyền biểu quyết. Chỉ công nhận kết quả khi Quorum >= 51% (hoặc 65% với sửa đổi điều lệ).
- **Anti-Fraud & Audit**: Mỗi lá phiếu được băm mật mã (SHA-256) ghi nhận vào audit log bất biến, đảm bảo nguyên tắc bỏ phiếu kín nhưng kiểm phiếu minh bạch tuyệt đối.

---

## 2.14. Sổ cái Kế toán Đa quỹ & Đối soát Ngân hàng Tự động (Multi-Fund Ledger & Reconciliation)

### 1. `POST /api/accounting/reconcile`
- **Mô tả**: Đối soát sao kê ngân hàng theo thời gian thực và phân bổ dòng tiền vào các quỹ nghiệp vụ độc lập.
- **Request Body**:
```json
{
  "transaction_ref": "VCB-8839219382",
  "amount": 10000000,
  "payer_content": "CEO1983 M1983-005 RENEW",
  "bank_code": "VCB",
  "fund_distribution": {
    "operating_fund": 7000000,
    "charity_fund": 2000000,
    "investment_fund": 1000000
  }
}
```
- **Xử lý Nộp Thừa / Nộp Thiếu**:
  - *Nộp thừa*: Tự động tất toán hóa đơn hiện tại, phần chênh lệch thặng dư được tự động ghi có vào tài khoản tạm ứng (`advance_balance`) của hội viên để cấn trừ vào hội phí năm tiếp theo.
  - *Nộp thiếu*: Chuyển trạng thái hóa đơn sang `partially_paid`, gửi thông báo ZNS/SMS nhắc số tiền còn thiếu kèm mã VietQR chênh lệch.

---

## 2.15. Cấp phát Thẻ cứng NFC/RFID & Apple Wallet Pass (.pkpass)

### 1. `GET /api/public/card/:slug/apple-wallet`
- **Mô tả**: Tạo và ký số file `.pkpass` chuẩn Apple Wallet để người dùng bấm thêm trực tiếp vào ví iPhone/Apple Watch.
- **Cấu trúc Thẻ Thông minh**:
  - Header: Logo hiệp hội, loại hội viên (Kim Cương / Vàng).
  - Primary Field: Họ và tên hội viên, chức vụ doanh nghiệp.
  - Auxiliary Fields: Mã số hội viên, niên khóa, điểm uy tín B2B.
  - Barcode: Mã QR chuẩn ISO/IEC 18004 hỗ trợ check-in tốc độ cao tại sự kiện.
  - NFC Payload: Payload NDEF URL mã hóa RSA để tap-to-connect tức thì khi chạm vào điện thoại khác.

---

## 2.16. Sàn B2B RFQ Đấu thầu & Ký kết Biên bản Ghi nhớ MOU số (B2B RFQ & Digital MOU)

### 1. `POST /api/b2b/rfq/create`
- **Mô tả**: Doanh nghiệp đăng tải nhu cầu chào mua (Request for Quotation) với tiêu chuẩn kỹ thuật, ngân sách dự kiến và hạn đóng thầu.
- **Quy trình Đấu thầu Minh bạch**: Các nhà cung cấp trong hiệp hội gửi báo giá cạnh tranh bí mật. Khi mở thầu, người mua chọn đối tác phù hợp nhất.
- **Ký kết Hợp đồng / Biên bản Ghi nhớ MOU điện tử qua OTP**:
  - Hệ thống sinh file hợp đồng nguyên tắc PDF có mã băm bảo mật SHA-256.
  - Hai bên xác thực ký hợp đồng bằng mã OTP 6 số gửi qua SMS/Email đã đăng ký.
  - Hợp đồng có giá trị pháp lý nội bộ và được lưu trữ trên kho lưu trữ mã hóa bất biến.

---

## 2.17. Phân quyền Granular RBAC tới từng Nút bấm (Button-Level UI Permission Policy)

### 1. Ma trận Phân quyền & Đánh giá Chính sách (Policy Evaluator)
Hệ thống áp dụng cơ chế đánh giá quyền hạn 3 lớp:
1. **Role Level**: Admin > Board of Directors (BCH) > Official Member > Guest.
2. **Resource Action**: `read`, `create`, `update`, `delete`, `export`, `approve`, `override_fee`.
3. **Button-Level Directive (`v-can` / `usePermission`)**: 
   - Ẩn hoàn toàn hoặc vô hiệu hóa (`disabled`) nút bấm xóa thành viên, phê duyệt tài chính, hoặc xuất dữ liệu nếu người dùng không sở hữu quyền tương ứng.
   - Bất kỳ hành động can thiệp trái phép qua DevTools/Postman đều bị chặn lập tức ở tầng Guard Middleware của NestJS với mã lỗi `403 Forbidden`.

---

## 2.18. Kiến trúc Landing Page Business Connect V1 - V7 & Tiêu chuẩn Visual-First (Creative Landing Architecture)

### 1. Advanced Scroll & Section Transition Rules
- **Advanced Scroll Architecture**: Bắt buộc bọc các section trong kiến trúc cuộn nâng cao (`useScroll`, `useTransform` của Framer Motion, kết hợp `perspective: 1000px`, `clip-path: inset()`, `sticky top-0`). Tuyệt đối không dùng cuộn CSS mặc định cho hiệu ứng chuyển section.
- **Quy tắc Visual thay thế Text**: Tuyệt đối không render "rừng chữ". Tại section "Vấn đề" (5 items) và "Giải pháp" (9 items), toàn bộ mô tả dài được thay thế bằng hình ảnh/GIF/Icon tương tác động. Nội dung chi tiết chỉ hiển thị qua Tooltip, Popover, hoặc modal hover/click.
- **Đồng bộ 3 Theme Modes**: Mỗi phiên bản cung cấp 3 chế độ hiển thị chuyên biệt:
  - *Light Mode*: Phong cách thanh lịch, tương phản sáng rõ ràng, không dùng chữ vàng trên nền sáng.
  - *Dark Mode*: Đậm chất nghệ thuật và chiều sâu không gian (sao đêm, neon, cyber, bọt khí sinh học).
  - *High Contrast*: Tối giản, nét vẽ rõ ràng, triệt tiêu hiệu ứng mờ nhòe hỗ trợ người dùng đặc biệt.

### 2. Chi tiết 7 Phiên bản Sáng tạo (Creative Editions)
1. **V1 - Tiên Hiệp & Tu Tiên**: Thăng tiên Parallax (Z-axis scale / trồi Y xuyên sương mù), luồng linh khí viền thẻ, mực ngấm.
2. **V2 - Cổ Tích Nhiệm Màu**: Lật sách 3D (`perspective: 1000px`, `rotateY(-180deg)`), 5 lọ thuốc phép tương tác sủi bọt bung text, đũa phép Magic Wand rắc bụi sao (Stardust).
3. **V3 - Hoạt Hình & Comic**: Khung tranh rơi nảy (Panel drop bounce `spring: 0.6`), halftone dots pattern, speed action lines, bong bóng thoại (Speech bubble) popover, nút hiệu ứng BAM/POW.
4. **V4 - Mưa & Kính Đọng Nước**: Wipe fog clip-path (`clip-path: inset()`), gạt nước lộ nội dung bên trong, lau sương mù kính (Fog wipe reveal), giọt nước lồi 3D méo icon bên dưới.
5. **V5 - Deep Tech & Cybernetics**: Glitch snap, interactive neural network canvas, terminal decoder (chạy chuỗi mã ngẫu nhiên rồi dịch thành tiếng Việt), chuột spotlight soi rọi bo mạch.
6. **V6 - Kim Tự Tháp**: Cửa đá hầm mộ đóng sập mở toang, bọ hung Scarab cursor thả bụi cát trọng lực, giải mã ký tự tượng hình Hieroglyphs xoay chuyển sang tiếng Việt.
7. **V7 - Bong Bóng Bay**: Bubble lift-off (trôi từ dưới lên trong khối cầu `border-radius: 50%` rồi nổ scale 100vw bung ra section), bọt xà phòng trôi nổi toàn trang, click nổ confetti.

---

## 2.19. Kiến trúc Biểu quyết Đa Nền tảng & Đồng bộ Thông báo Thời gian thực (Multi-App Voting & Realtime Synchronization)

### 1. Mô hình Biểu quyết 3 Điểm chạm (Triple-Surface Voting Architecture)
Hệ thống kết nối và đồng bộ hóa tuyệt đối luồng biểu quyết (Polls/Voting) trên cả 3 bề mặt ứng dụng:
- **CRM Web Admin (`/voting`)**: Ban quản trị tạo cuộc biểu quyết, chọn phân khúc đối tượng tham gia (`all`, `members`, `non_members`), theo dõi thống kê phiếu bầu theo từng kênh, và kích hoạt "Kết thúc biểu quyết".
- **ViOne Connect App (`/connect-app/notifications`)**: Người dùng nhận thông báo biểu quyết có gắn thẻ tương tác (`interactive_poll`), bình chọn trực tiếp 1-click với thẻ nhận diện nguồn `📱 ViOne App`.
- **Hiệp hội App (`/association/notifications` & `/m/notifications`)**: Hội viên nhận thông báo tương tác, bình chọn trực tiếp 1-click với thẻ nhận diện nguồn `🏛️ Hiệp hội App`.

### 2. Cơ chế Phân định Nguồn bỏ phiếu (Source App Attribution)
- **Database Schema**: Bảng `public.poll_votes` được bổ sung trường `source_app VARCHAR(50) DEFAULT 'vione_app'`.
- **Phân loại Kênh bỏ phiếu**:
  - `'vione_app'`: Bỏ phiếu từ ứng dụng mạng xã hội doanh nhân ViOne Connect.
  - `'association_app'`: Bỏ phiếu từ ứng dụng hội viên Hiệp hội doanh nghiệp.
  - `'crm'`: Bỏ phiếu trực tiếp từ cổng quản trị CRM Web.
- **Thống kê Thời gian thực (Real-time Contribution Aggregation)**:
  - Tự động đếm tổng số phiếu và số phiếu riêng lẻ theo từng kênh (`vioneVotes`, `associationVotes`, `crmVotes`) cho từng phương án lựa chọn.
  - Hiển thị thanh tỷ lệ kênh tham gia trên giao diện CRM: `📱 ViOne: X`, `🏛️ Hiệp hội: Y`, `💻 CRM: Z`.

### 3. Tự động hóa Thông báo Khi Khởi tạo và Khi Kết thúc
- **Khi Tạo Cuộc Biểu quyết Mới (`POST /api/voting/polls`)**:
  - Dựa trên `targetAudience` (Tất cả / Chỉ Hội viên / Khách & Đối tác), hệ thống truy vấn danh sách người dùng thụ hưởng.
  - Đẩy thông báo tức thời vào `public.business_notifications` (`notification_kind: 'interactive_poll'`, `event_kind: 'poll_created'`) và `public.member_notifications` (`ref_type: 'poll'`).
  - Dữ liệu `safe_display_data` chứa danh sách phương án, cho phép biểu quyết ngay trên màn hình thông báo mà không cần chuyển trang.
- **Khi Kết thúc Biểu quyết (`POST /api/voting/polls/:id/close`)**:
  - Trạng thái cuộc biểu quyết được cập nhật thành `closed`.
  - Hệ thống tự động phân tích và xác định phương án chiến thắng (Winner), tính toán tỷ lệ % và cơ cấu nguồn tham gia.
  - Tự động phát thông báo kết quả đóng biểu quyết (`event_kind: 'poll_closed'`, `notification_kind: 'poll_result'`) đến toàn bộ người dùng liên quan trên ViOne App và Hiệp hội App.
  - **Hiển thị Thẻ Kết quả Chung cuộc**: Thẻ thông báo trên ViOne App và Hiệp hội App tự động chuyển sang giao diện kết quả:
    - Biểu tượng cúp vàng 🏆 và tiêu đề phương án chiến thắng.
    - Thanh phần trăm kết quả của tất cả các phương án.
    - Huy hiệu tổng số lượt bầu và bảng cơ cấu tỷ lệ người tham gia từ ViOne App vs Hiệp hội App.
    - CRM Admin hiển thị huy hiệu "Đã kết thúc", khóa thao tác bỏ phiếu và làm nổi bật phương án chiến thắng.

---

# 3. MÔ HÌNH DỮ LIỆU & RÀNG BUỘC CƠ SỞ DỮ LIỆU

Bảng tóm tắt các ràng buộc nghiệp vụ (Constraints) then chốt trong PostgreSQL đã được kiểm chứng qua bộ kiểm thử E2E:
- **`demo_requests_status_check`**: `CHECK (status IN ('new', 'contacted', 'scheduled', 'completed', 'cancelled'))`
- **`members_required_columns`**: Bắt buộc có giá trị khi khởi tạo: `type` (official/honorary/candidate), `level` (general/gold/diamond), `industry`, `region`, `status` (active/official/pending), `joined_at`, `fee_year`.
- **`invoices_status_check`**: `CHECK (status IN ('paid', 'unpaid', 'overdue'))`
- **`invoices_method_check`**: `CHECK (method IN ('bank', 'card', 'cash', 'ewallet'))`
- **`renewal_audit_log_event_type_check`**: `CHECK (event_type IN ('payment', 'idempotent_noop', 'failure'))`
- **`activity_log_category_check`**: `CHECK (category IN ('auth', 'member', 'fee', 'event', 'system'))`
- **`brm_target_xor`**: Ràng buộc nghiêm ngặt chỉ được phép một trong 3 loại: `connection` (có `target_user_id`), hoặc `saved_card` (có `target_card_id`), hoặc `guest_contact` (có `target_guest_id`).
- **`business_meetings_enums`**:
  - `status`: `draft`, `proposed`, `confirmed`, `declined`, `cancelled`, `completed`, `no_show`.
  - `meeting_type`: `in_person`, `video_call`, `phone_call`, `business_lunch`, `demo`, `consultation`, `networking`.
  - `source_type`: `association`, `global_connection`, `saved_card`, `company`, `event`, `qr`, `nfc`, `manual`, `referral`.
- **`business_notifications_constraints`**:
  - `priority`: `CHECK (priority IN ('critical', 'high', 'normal', 'informational'))` (Tuyệt đối không dùng `'urgent'`).
  - `status`: `CHECK (status IN ('pending', 'scheduled', 'delivered', 'read', 'archived', 'expired', 'cancelled'))`.
  - Không tồn tại cột `is_read`; theo dõi đã đọc qua `status = 'read'` và `read_at IS NOT NULL`.
- **Nguyên tắc Đồng bộ bắt buộc (Documentation & Memory Sync)**: Khi có bất kỳ thay đổi về Schema, Route, hoặc Business Flow, đội ngũ phát triển/AI bắt buộc phải cập nhật đồng thời `MEMORY.md`, `.cursorrules` và tài liệu kỹ thuật tại `document/`.


---

# 4. HỆ THỐNG WEBSOCKET & TỰ ĐỘNG HÓA NOTIFICATION

Hệ thống sử dụng WebSocket Gateway (Socket.IO) tích hợp với Supabase Realtime cho các luồng sự kiện tức thì:
- **`EVENT_MEMBER_RENEWED`**: Bắn tới màn hình hội viên khi thanh toán VietQR thành công để cập nhật giao diện không cần reload.
- **`EVENT_QR_CHECKIN_SUCCESS`**: Bắn tới màn hình điều phối khán phòng của Ban Tổ chức khi đại biểu quét vé vào cửa.
- **`EVENT_B2B_MESSAGE_RECEIVED`**: Đẩy tin nhắn tức thời tới màn hình chat của đối tác kèm âm thanh thông báo.
- **`EVENT_MEETING_CONFIRMED`**: Kích hoạt worker tự động sinh file iCal `.ics` và gửi email đính kèm lịch làm việc.
- **`EVENT_SEATING_LOCATED`**: Đẩy bản đồ dẫn đường bàn tiệc tới smartphone đại biểu ngay khi check-in thành công.
- **`EVENT_VOTE_RECORDED`**: Cập nhật biểu đồ tỷ lệ biểu quyết thời gian thực trên màn hình LED đại hội.

---

# 5. QUY TRÌNH BIÊN DỊCH & TRIỂN KHAI

## 5.1. Biên dịch Frontend & Sinh cây Tuyến đường
```bash
# Di chuyển vào thư mục frontend
cd apps/vione_app_fe

# Sinh cây tuyến đường TanStack Router bảo đảm nhận diện /auth/mobile và /association/*
npm run routes:gen

# Kiểm tra tính toàn vẹn đa ngôn ngữ
npm run i18n:check

# Đóng gói Production Bundle với bộ nhớ Node mở rộng
npm run build
```

## 5.2. Khởi chạy Backend NestJS
```bash
cd apps/vione_app_be
npm run build
npm run start:prod
```

## 5.3. Đóng gói Ứng dụng Di động Capacitor Android APK
```bash
cd apps/vione_app_fe
npx cap sync android
cd android && ./gradlew assembleRelease
```

## 5.4. Hệ Thống Kiểm Thử Toàn Diện 138 Luồng Tích Hợp (138 Deep Integration Test Flows)
Hệ thống được xác thực qua 2 bộ kịch bản kiểm thử tích hợp sâu cấp độ Senior QA/Lead Architect với tỷ lệ vượt qua đạt **100% (138/138 Flows Passed)** đối với PostgreSQL thực tế và toàn bộ logic nghiệp vụ:

### 1. Bộ Kiểm Thử Master 110 Luồng (`scratch/test_110_deep_flows.js`) - 110/110 Passed
- **Nhóm 1 (Flows 001 - 010)**: Web Landing & Thu thập Khách hàng tiềm năng (Public bypass, đổi theme, đăng ký demo, liên hệ, chuyển đổi hiệp hội).
- **Nhóm 2 (Flows 011 - 025)**: CRM Quản lý Hội viên & Phân ban BCH (CRUD hội viên, phê duyệt/từ chối, bổ nhiệm BCH, lọc ban ngành, xuất nhập Excel).
- **Nhóm 3 (Flows 026 - 040)**: CRM QUẢN LÝ HỘI PHÍ, Thu phí VietQR & Kế toán (Sinh hóa đơn, mã VietQR, webhook thanh toán, ghi log KIỂM TOÁN HỘI PHÍ).
- **Nhóm 4 (Flows 041 - 055)**: CRM Quản lý Sự kiện & Điểm danh QR Check-in (Vòng đời sự kiện, cấu hình vé, sinh vé QR, check-in thời gian thực, phân tích tỷ lệ tham dự).
- **Nhóm 5 (Flows 056 - 070)**: CRM Quyền lợi, Nhà tài trợ & Sàn B2B Marketplace (Cấp nhà tài trợ, quyền lợi song ngữ, vòng đời sản phẩm active/sold/draft, thu thập lead kết nối).
- **Nhóm 6 (Flows 071 - 085)**: App Hiệp Hội Doanh Nhân `/association/*` (Thẻ hội viên số, trao đổi QR, bầu cử số, tin tức nội bộ, tài liệu hiệp hội, kết nối networking).
- **Nhóm 7 (Flows 086 - 100)**: ViOne Connect Mạng Xã Hội B2B `/connect-app/*` (Bảng tin B2B, Moments đa ảnh, đặt lịch hẹn 1-on-1, chat tin nhắn đối tác, định tuyến thông báo).
- **Nhóm 8 (Flows 101 - 110)**: Bảo Mật, Phân Quyền RBAC, API Guards & Phục Hồi Dữ Liệu (Phân quyền Admin/Board/Member/Guest, bảo vệ route, khôi phục bản ghi đã xóa mềm, kiểm toán hệ thống).

### 2. Bộ Kiểm Thử 28 Phân Hệ Nghiệp Vụ Chuyên Sâu (`scratch/test_deep_subfeatures_suite.js`) - 28/28 Passed
- **Phân hệ 1 (4 Flows)**: Sơ đồ bàn tiệc VIP Gala, kiểm tra xung đột chỗ ngồi, chỉ định đại biểu Kim Cương, điều hướng Kiosk Check-in thời gian thực.
- **Phân hệ 2 (4 Flows)**: Điều phối thông báo đa kênh, lọc giờ cấm làm phiền DND, chống trùng lặp Deduplication, cơ chế Retry Exponential Backoff.
- **Phân hệ 3 (4 Flows)**: Đại hội biểu quyết số, xác thực mã Token, kiểm soát túc số Quorum >= 51%, băm mật mã Audit Log chống gian lận.
- **Phân hệ 4 (4 Flows)**: Kế toán đa quỹ tài chính (Quỹ vận hành, Quỹ thiện nguyện, Quỹ đầu tư), đối soát giao dịch nộp thừa (chuyển tạm ứng) và nộp thiếu (nhắc nợ ZNS).
- **Phân hệ 5 (4 Flows)**: Thẻ cứng thông minh NFC/RFID, đồng bộ Apple Wallet Pass .pkpass, ghi nhận lịch sử chạm Tap-to-Connect.
- **Phân hệ 6 (4 Flows)**: Sàn B2B RFQ, chào thầu cạnh tranh, lựa chọn nhà thầu chiến thắng, ký biên bản ghi nhớ MOU điện tử bằng OTP an toàn.
- **Phân hệ 7 (4 Flows)**: Phân quyền Granular RBAC tới từng nút bấm (Button-Level Policy), kiểm soát ma trận quyền CRUD, chặn truy cập trái phép 403 Forbidden.

Lệnh thực thi kiểm thử toàn bộ 138 luồng:
```bash
node scratch/test_110_deep_flows.js
node scratch/test_deep_subfeatures_suite.js
```

---

# 6. HỆ THỐNG BIỂU QUYẾT ĐA NỀN TẢNG & GHI NHẬN NGUỒN ỨNG DỤNG (MULTI-APP VOTING & ATTRIBUTION)

## 6.1. Kiến Trúc Luồng Bỏ Phiếu Đa Kênh
Hệ thống cho phép cử tri và hội viên tham gia bỏ phiếu/biểu quyết đồng thời từ 3 nền tảng khác nhau:
1. **ViOne Mobile App (`vione_app`)**: Hội viên doanh nhân bỏ phiếu trên ứng dụng di động cá nhân.
2. **Cổng Thông Tin Hiệp Hội (`association_app`)**: Đại biểu đăng nhập và bỏ phiếu trên cổng web portal của hiệp hội.
3. **Bàn Kiểm Phiếu CRM (`crm`)**: Ban Thư ký/Ban Kiểm tra hỗ trợ đại biểu thao tác trực tiếp tại hội trường.

## 6.2. CSDL & Ràng Buộc Trường `source_app`
- Bảng `public.poll_votes` được bổ sung cột:
  ```sql
  ALTER TABLE public.poll_votes ADD COLUMN IF NOT EXISTS source_app VARCHAR(50) DEFAULT 'crm';
  ```
- Ràng buộc giá trị hợp lệ: `source_app IN ('vione_app', 'association_app', 'crm')`.

## 6.3. API Contract Bỏ Phiếu & Đóng Hòm Phiếu
### 1. `POST /api/voting/polls/:pollId/vote`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Request Body**:
  ```json
  {
    "optionId": "00000000-0000-4000-8000-000000000001",
    "memberId": "M1983-001",
    "source_app": "vione_app"
  }
  ```
- **Xử lý**:
  - Xác thực cử tri thuộc đối tượng tham gia (`target_audience`).
  - Kiểm tra chống bỏ phiếu lần 2 (`Anti-Double Voting`).
  - Băm SHA-256 nội dung lá phiếu để đảm bảo tính ẩn danh và bất biến.
  - Ghi nhận `source_app` tương ứng.

### 2. `POST /api/voting/polls/:pollId/close`
- **Xử lý**:
  - Niêm phong hòm phiếu điện tử, chuyển trạng thái `status = 'closed'`.
  - Tự động tổng hợp kết quả (tổng phiếu, tỷ lệ %, phân loại phiếu theo `source_app`).
  - Xác định ứng viên/phương án chiến thắng.
  - Phát sóng thông báo kết thúc đa kênh (`Push Notification & WebSocket`) về cả 3 ứng dụng: CRM, ViOne App, Hiệp Hội App kèm huy hiệu chiến thắng 🏆.

---

# 7. KIẾN TRÚC & TRIẾT LÝ THIẾT KẾ BỘ LANDING PAGE DOANH NGHIỆP BUSINESS CONNECT (V1 - V8)

Toàn bộ các phiên bản Landing Page từ V1 đến V8 tuân thủ **Quy tắc Thiết kế Tuyệt đối (Premium B2B)**:
- **Khách hàng mục tiêu**: CEO, Chủ tịch, Giám đốc, Lãnh đạo Hiệp hội & Doanh nghiệp hàng đầu.
- **Tính thẩm mỹ**: Sang trọng, nghiêm túc, đẳng cấp tập đoàn; không dùng yếu tố game/hoạt hình/giải trí.
- **Cấu trúc chuẩn mực**: Bắt buộc chia rõ các section với khoảng cách lớn (`py-24`), chia cột grid khoa học.
- **Nội dung 100% đồng nhất (Part 1 Copy)**:
  - Header: Giải pháp | Khách hàng | Câu chuyện | Bảng giá | Tài nguyên | Về chúng tôi || Đăng nhập | [Đặt demo ->]
  - Hero: Tagline, Headline "Hiểu đúng người. Mở ra cơ hội thật.", Subtext, CTAs, 4 Thống kê (10,000+ | 300+ | 50,000+ | 20+).
  - Problem: 5 Thách thức doanh nghiệp (Thông tin phân tán, Khó duy trì quan hệ, Bỏ lỡ cơ hội, Thiếu kết nối thực chất, Khó đo lường hiệu quả).
  - Solution: 9 Tính năng doanh nghiệp (Quản lý hội viên, CRM & Quan hệ, Cơ hội kinh doanh, Sự kiện, Cộng đồng & Nhóm, Tri thức & Nội dung, Báo cáo & Phân tích, AI Copilot, Tích hợp & Mở rộng).
  - Ecosystem: Hệ sinh thái mở, Highlight "NHIỀU KẾT NỐI HƠN. NHIỀU CƠ HỘI HƠN. NHIỀU GIÁ TRỊ HƠN."
  - Clients & Reviews: 6 Logo tổ chức lớn (VCCI, AmCham, EuroCham, KoCham, SBF, AusCham) + 3 Đánh giá từ Lãnh đạo.
  - Footer: Kêu gọi hành động & Đặt demo.

### Danh Mục 8 Phiên Bản Thiết Kế Chuyên Sâu:
1. **V1 - Executive Zen (`/business-connect/v1`)**: Phong cách Aman Resorts, gradient sương khói chậm, đường viền thẻ phát sáng xử lý dữ liệu, chuyển theme kèm hiệu ứng cánh cửa đá khép mở.
2. **V2 - Heritage & Trust (`/business-connect/v2`)**: Phong cách Private Banking/Luật, nền Parchment be nhạt, Midnight Navy, hạt ánh sáng vàng kim lơ lửng, thẻ hồ sơ mạ vàng, chuyển cảnh Legacy Reveal.
3. **V3 - Premium Editorial (`/business-connect/v3`)**: Phong cách Stripe/Vercel, đường lưới kỹ thuật chính xác, viền cứng sắc nét, chuyển cảnh Snap & Slide, thẻ đẩy khối Offset Shadow.
4. **V4 - Executive Glass Dashboard (`/business-connect/v4`)**: Phong cách Glassmorphism đa tầng, bokeh đô thị tài chính làm mờ sâu, thẻ kính mờ bóng bẩy, cuộn xếp lớp Stacking Cards.
5. **V5 - Cyber Neural Command (`/business-connect/v5`)**: Radar mạng lưới B2B, canvas liên kết nơ-ron điều phối cơ hội giao thương.
6. **V6 - Corporate Monument (`/business-connect/v6`)**: Phong cách tượng đài kiến trúc, nền đá cẩm thạch Marble White / đen Obsidian điểm vàng đồng Bronze, hình học đa diện 3D xoay chậm, hiệu ứng cánh cửa đá khép mở khi đổi theme.
7. **V7 - Fluid Analytics (`/business-connect/v7`)**: Phong cách Fluid Mesh Gradient, nền trắng sứ / xanh đại dương thẫm, ranh giới sóng dẻo Wave Morphing, thẻ bo góc lớn rounded-3xl.
8. **V8 - Executive Titanium Suite (`/business-connect/v8`)**: Flagship tích hợp tối thượng, thiết kế Titanium sang trọng, đồng bộ đa ứng dụng CRM - ViOne - Hiệp Hội.

---

# 8. MA TRẬN KIỂM THỬ ISO/IEC/IEEE 29119-3 & KẾ HOẠCH PHẠM VI WBS PMBOK

Hệ thống được chuẩn hóa tài liệu kiểm thử và ước lượng công việc cấp tập đoàn:
1. **`VIONE_COMPREHENSIVE_TEST_CASES_SUITE_10000_CASES.xlsx`**:
   - Tuân thủ tiêu chuẩn quốc tế ISO/IEC/IEEE 29119-3.
   - 10 Sheets nghiệp vụ chuyên sâu, hơn **10,000 test cases thực tế 100% không trùng lặp**.
   - Bao phủ toàn diện: VIEW (danh sách, chi tiết, mobile, responsive), CRUD, SEARCH (debounce, full-text unaccent), FILTER (faceted, saved filters), SORT, EXPORT (Excel formatted, PDF), IMPORT, PERMISSIONS RBAC, REALTIME, CONCURRENCY, OFFLINE SYNC, SECURITY (XSS, SQLi, Brute Force), và VOTING SOURCE ATTRIBUTION.
2. **`VIONE_WBS_FEATURE_MATRIX_AND_ESTIMATION_CHI_TIET.xlsx`**:
   - Tuân thủ tiêu chuẩn quản trị dự án PMBOK / ISO 21500.
   - 10 Phân hệ nghiệp vụ với **1,000+ gói công việc chi tiết (Work Packages)**.
   - Phân rã đầy đủ 5 giai đoạn: Kiến trúc & Schema -> Giao diện Frontend -> Logic Backend CSDL -> Tích hợp & Bảo mật -> Kiểm thử E2E & UAT.
   - Ước lượng chi tiết Man-days cho Frontend, Backend, QA, xác định rõ Actor, Priority, Route/Endpoint và Deliverables.

---

# 9. KIẾN TRÚC PHÁ VỠ CẤU TRÚC DOM LANDING V2-V7 & PHÂN HỆ HIỆP HỘI (CEO 1983)

### 9.1. Kiến Trúc Landing Page Đột Phá (V2 - V7)
- **Bố Cục Bất Đối Xứng (Asymmetric Grid)**: Triệt để loại bỏ bố cục 50/50 truyền thống. Áp dụng CSS Grid bất đối xứng `grid-cols-12` (`col-span-7` vs `col-span-5` hoặc `col-span-4` vs `col-span-8`).
- **Phần Tử Đè Lớp (Overlapping Elements)**: Sử dụng negative margins (`-mt-14` đến `-mt-24`), `relative z-20` đâm xuyên qua các section lân cận và đè lên background layers.
- **Scroll Hijacking (Framer Motion 3D Mapping)**:
  - Container cha có chiều cao kéo dài (`190vh` - `220vh`).
  - Container con cố định màn hình `sticky top-0 h-screen overflow-hidden perspective-[1400px]`.
  - Mapping tiến độ cuộn chuột `useScroll({ target: containerRef })` qua `useTransform` vào các hiệu ứng:
    - `clipPath`: Quét màn mở dần hoặc mở theo hình khối.
    - `scale`: Thu nhỏ/phóng to mượt mà (`0.88 -> 1.0 -> 0.94`).
    - `rotateX` / `rotateY`: Xoay 3D tạo chiều sâu không gian.
    - `yContent`: Đẩy nội dung trượt lướt mượt mà.
- **Parallax Chiều Sâu Trục Z**:
  - Layer 0 (Background Image): Cuộn trễ hơn 50% so với tốc độ cuộn chuột.
  - Layer 1 (Nội dung chính): Hiển thị sắc nét, tương phản cao.
  - Layer Decorative: Các hạt ánh sáng, HUD grid, và liquid blobs bay lơ lửng ngược chiều.

### 9.2. Phân Hệ Đăng Nhập Độc Lập Tam Phân (Web CRM, ViOne Mobile & Hiệp Hội CEO 1983)
- **Biểu Tượng Thương Hiệu Chính Thức**: `/ceo1983-logo.png` áp dụng đồng bộ toàn bộ app hiệp hội; `/vione-logo.svg` và `ViOneLogo` áp dụng cho ViOne.
- **Tách Biệt Xác Thực 3 Màn Độc Lập (Không dùng chung nút/tab chuyển mobile)**: 
  - **Màn Đăng nhập Hệ thống Web CRM riêng**: `/auth` (hoặc `/auth?portal=crm`) - Giao diện quản trị viên hệ thống CRM, Email/Username + Mật khẩu, Google & Apple OAuth, ThemeSwitcher.
  - **Màn Đăng nhập App ViOne Mobile riêng**: `/vione/login` - Giao diện ViOne Mobile thuần túy độc quyền (nền đen `#0A0A0B`, chữ đồng `#D8B282`, hình nền `connect-auth-bg.jpg`, Logo ViOne Business Connect, quét danh thiếp NFC/QR code, Google/Apple OAuth). Hoàn toàn không có tab hay nút chuyển sang Hiệp hội.
  - **Màn Đăng nhập App Hiệp hội CEO 1983 riêng**: `/association/login` - Giao diện hội viên CLB Doanh Nhân CEO 1983 độc quyền (nhận diện xanh Navy `#0B0F19`, Logo CEO 1983, form Email/Mã hội viên + Mật khẩu, kích hoạt tài khoản hội viên). Hoàn toàn không có nút chuyển sang ViOne.
  - **Bảo Vệ Độc Lập Tuyệt Đối Route Hiệp Hội (`/association`)**: Loại bỏ hoàn toàn bẫy redirect sang ViOne (`isVioneLaunch` / `isVioneStandaloneContext`) trong `association.tsx`. Mọi truy cập chưa đăng nhập tại `/association/*` trên cả Web, PWA và Native APK đều được điều hướng chuẩn xác về `/association/login`. File cấu hình APK CEO 1983 (`capacitor.config.json`) trỏ trực tiếp về `http://14.225.217.232:5000/association`, đảm bảo khi tải và mở app native luôn hiển thị 100% giao diện Hiệp hội CEO 1983.
- **Cài Đặt & Ảnh Đại Diện (`/association/settings`)**:
  - Route độc lập, loại bỏ việc bấm nút Cài đặt bị chuyển hướng về ViOne.
  - Upload avatar trực tiếp lên MinIO bucket `vione-media` / `avatars`, đồng bộ tự động qua 3 bảng `user_profiles`, `business_identities`, `vione_users`.
- **Nhắn Tin & Thẻ Thao Tác Trực Tiếp (`/association/messages`)**:
  - Nhắn tin 1-1 với hội viên hiệp hội, chọn hội viên khởi tạo chat.
  - Thẻ Hành Động Thanh Toán (`[action:payment|...]`): Tự động hiển thị thẻ VietQR với số tiền, nội dung, hạn nộp, nút mở popup quét mã QR và tải ảnh QR.
  - Thẻ Hành Động Cuộc Họp (`[action:meeting|...]`): Hiển thị thẻ thư mời họp với thời gian, địa điểm, và nút bấm xác nhận tham gia trực tiếp.
- **Kết Nối Hội Viên 2 Chiều (`/association/members`)**:
  - 3 Tab quản lý: "Tất cả", "Bạn bè", "Đang chờ kết nối".
  - Đầy đủ tính năng gửi lời mời, hủy lời mời đã gửi, đồng ý kết nối, và hủy kết bạn 2 chiều.
  - Sửa lỗi notification nhận thông báo kết nối: Chuẩn hóa ép kiểu `memberRecipientId::text` và cơ chế fallback thông tin người gửi.

### 9.3. Đồng Bộ Thông Báo & Nhắc Phí Từ CRM
- Khi CRM gửi thông báo hoặc nhắc phí quá hạn:
  1. Ghi nhận vào `member_notifications` (App Hiệp hội).
  2. Ghi nhận vào `business_notifications` (App ViOne).
  3. Đẩy template tin nhắn tương tác `[action:payment|...]` vào bảng `messages` để hội viên có thể thao tác ngay trong hội thoại chat.

### 9.4. Chuẩn Hóa Thương Hiệu & Nút Bấm
- **Nút Lưu ViOne**: Nền đen mờ cao cấp (`bg-[#121214]`), viền vàng đồng mảnh (`border-[#D4AF37]/50`), chữ vàng đồng sáng (`text-[#F5E0A3]`), không dùng nền xanh đen.
- **Logo ViOne**: Loại bỏ path chữ 'v' lồng bên trong chữ 'O' tại component `ViOneLogo.tsx`.

### 9.5. Kiến Trúc Nâng Cấp Toàn Diện App Hiệp Hội Doanh Nhân CEO 1983 (13 Hạng Mục)
- **1. Header & Nhận diện Logo**:
  - Logo CEO 1983 được phóng to tối ưu hiển thị (`h-12 w-auto max-w-[170px]`), loại bỏ toàn bộ các chuỗi text rườm rà xung quanh để định vị thương hiệu sắc nét và sang trọng ngay khi mở ứng dụng.
- **2. Tiêu chuẩn UX/UI Đa Thiết Bị (iOS, Android, Xiaomi)**:
  - Áp dụng hệ thống biến CSS safe-area insets: `env(safe-area-inset-top)` và `env(safe-area-inset-bottom)`.
  - Phân tầng Typography theo chuẩn Apple Human Interface Guidelines: font `-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter`, độ nổi (contrast) cao, nền frosted glass mờ ảo tự nhiên (`backdrop-blur-md`).
- **3. Điều Hướng Cố Định & Né Bàn Phím Ảo (Keyboard-Avoiding Navigation)**:
  - Tích hợp hook `useVirtualKeyboard` theo dõi sự kiện resize của `window.visualViewport`. Khi người dùng gõ phím trên thiết bị di động, Footer TabBar tự động ẩn/né mượt mà, loại bỏ triệt để hiện tượng footer bị đẩy đè lên ô nhập liệu hoặc thanh gửi tin nhắn.
  - Loại bỏ hoàn toàn khối preview thẻ QR pass to choán chỗ trên hero trang chủ, chỉ duy trì duy nhất nút quét QR tại trung tâm Footer TabBar.
- **4. Thẻ Hội Viên Luxury & Tương Phản Chuẩn**:
  - Toàn bộ thông tin hội viên trên thẻ (Họ tên, Mã số, Chức vụ, Hạn thẻ) được ép kiểu chữ trắng thuần `#FFFFFF` (`text-white`, `text-white/90`, `text-white/70`).
  - Áp dụng hiệu ứng ánh kim lướt qua (`vba-shine`) và lớp nền sang trọng trên tất cả các chủ đề thẻ (Classic, Gold Luxury, Sapphire, Emerald, Obsidian).
- **5. Kết Nối Bạn Bè & Nhắn Tin Messenger Chuẩn Facebook**:
  - Khắc phục lỗi backend `sendMemberMessage`: định danh linh hoạt `myCode` dựa trên `user_id`, `id` hoặc `email` trong bảng `members`, cho phép gửi tin nhắn tức thì cho bất kỳ hội viên nào.
  - Giao diện cuộc gọi điện thoại và video call chuẩn Messenger: Modal `MessengerCallModal` với chuông reo sinh động, biểu tượng mã hóa đầu cuối E2E, vòng sóng âm lan tỏa (wave pulse), bộ đếm thời gian trò chuyện, nút bật/tắt micro, chuyển đổi camera, bật loa ngoài và ngắt kết nối.
- **6. Thông Báo Badge Hoạt Họa Click-to-Dismiss**:
  - Đổi tên "đặc quyền" thành "ưu đãi".
  - Các nút chức năng nhanh (Danh thiếp số, Sự kiện, Tin tức, Ưu đãi, Ban thư ký) sở hữu badge số thông báo kèm hiệu ứng hoạt họa nhấp nháy/nhún nhảy (`animate-bounce`).
  - Người dùng click vào xem thì hiệu ứng và badge số mới biến mất, trạng thái được lưu bền vững vào `localStorage`.
- **7 & 12. Trang Cá Nhân Chuẩn Facebook 100% & Tối Giản Ngôn Ngữ**:
  - Tái hiện cấu trúc trang cá nhân Facebook Mobile Profile: Ảnh bìa (Cover photo) toàn chiều ngang, avatar nổi bo tròn chồng lên ảnh bìa kèm biểu tượng máy ảnh, tiểu sử bio, nút nổi bật "+ Thêm vào tin", "Chỉnh sửa trang cá nhân", mục Chi tiết giới thiệu, lưới bạn bè 6 ô với số lượng bạn chung, thanh công cụ "Bạn đang nghĩ gì?" và dòng thời gian bài viết.
  - Bộ chọn ngôn ngữ tối giản: Không dùng màu sắc cầu vồng, hiển thị cờ và tên ngôn ngữ đang chọn (`🇻🇳 Tiếng Việt`), chọn thì mở dropdown xuống dưới.
- **8. Đa Dạng Hóa Icon Quyền Lợi**:
  - Thay thế icon trái tim đơn điệu bằng bộ icon tương xứng theo ngữ cảnh: `Handshake` (Hợp tác kết nối), `BookOpen` (Đào tạo & Hội thảo), `TrendingUp` (Xúc tiến thương mại), `Gift` (Quà tặng & Ưu đãi), `Award` (Vinh danh & Bổ nhiệm), `ShieldCheck` (Bảo trợ & Quyền lợi pháp lý), `Sparkles` (Đặc quyền VIP).
- **9. Chuẩn Hóa Màu Sắc Trang Xem Tin Tức**:
  - Thay thế tông vàng nâu cũ `#D8B282`/`#F6E1C3` bằng giao diện Slate tối thanh lịch (`#0B1220`), viền thẻ sắc nét, tiêu đề trắng đậm, badge phân loại Xanh dương hoàng gia (Royal Blue `bg-blue-600`), nút thao tác đóng bài viết tuân thủ bảng màu chuẩn 5 màu (Trắng, Xanh dương, Đen, Xanh lá, Đỏ).
- **10. Sự Kiện Nổi Bật Kèm Bộ Đếm & Số Lượng Đăng Ký**:
  - Nút "Xem tất cả" tích hợp số đếm trực quan `(3)`.
  - Mỗi thẻ sự kiện hiển thị sinh động số lượng doanh nhân đã xác nhận tham dự (`🔥 48 doanh nhân đã đăng ký`) kích thích tinh thần kết nối giao thương.
- **11. Danh Thiếp Số Trực Quan (Mini Digital Card) & Sửa Lỗi Tải Ảnh**:
  - Thay vì danh sách đơn điệu, mỗi danh thiếp được trình bày dưới dạng Mini Digital Card trực quan với dải màu gradient header, avatar nổi bo tròn, thông tin liên hệ, hộp hiển thị đường dẫn công khai `/b/{slug}` kèm nút 1 chạm sao chép link (`Copy`).
  - Khắc phục triệt để lỗi không hiển thị ảnh khi xem công khai bằng cách áp dụng hàm `resolveMediaUrl` cho avatarUrl và coverUrl trong `PublicDigitalCard.tsx`, `b.$slug.tsx`, `CardPreviewModal.tsx`, `association.business-cards.tsx` và `api-client.ts`.
- **13. Theme Sự Kiện Lễ Hội (Tết Trung Thu) & Toggle Quản Lý**:
  - Tạo component `SeasonalEventHeader` trang trí các yếu tố lễ hội Trung Thu truyền thống Việt Nam: Đèn lồng ông sao đung đưa (`animate-bounce`), dây tua rua đỏ vàng, vầng trăng rực sáng (`animate-pulse`) và các vì sao lấp lánh.
  - Cho phép hội viên chủ động bật hoặc tắt theme sự kiện thông qua công tắc Switch tại trang Cá nhân, cập nhật trạng thái thời gian thực thông qua `CustomEvent`.
  - Kênh CRM đổi tên thành "Kênh thông báo hệ thống", giải mã an toàn `safeDecode` các chuỗi URL encoded tiếng Việt (`H%E1%BB%8Dp...`) trên thư mời họp và thông báo giao dịch.

### 9.6. Chuẩn Hóa Thông Báo Đa Kênh CRM - Hiệp Hội, Luồng Chat Tối Ưu & Trải Nghiệm Tương Tác
- **1. Phân Phối Thông Báo Đa Kênh CRM -> Hiệp Hội**:
  - `admin.service.ts`: Khi gửi thông báo (`status = 'sent'`), hàm `dispatchBroadcastToMembersAndUsers` tự động ghi nhận vào cả `public.member_notifications` (cho từng hội viên trong `public.members`) và `public.business_notifications` (cho từng người dùng trong `public.profiles` / `auth.users`) kèm `dedupe_key`.
  - `connect-app.service.ts`: `listMyMemberNotifications` truy vấn song song `public.notifications` (phạm vi `association_app`, `all`, `crm`), deduplicate với thông báo cá nhân, và tính toán trạng thái chưa đọc `unread: !isDismissed` dựa trên danh sách `broadcast_notification_dismissals`.
  - `association.tsx`: Đăng ký socket listener thông qua hook `useAssociationRealtimeNotifications`, tự động hiển thị toast và phát CustomEvent `notifications-updated` để các trang con tự nạp lại dữ liệu âm thầm.
- **2. Khắc Phục Lỗi Đường Dẫn Ưu Đãi Hội Viên**:
  - Cập nhật nút tính năng nhanh trỏ chính xác về `/association/perks`.
  - Tạo route alias `/association/benefits` tự động redirect 301 sang `/association/perks` tại `beforeLoad` bảo đảm không phát sinh lỗi 404.
- **3. Tối Ưu Hóa Tần Suất Làm Mới Màn Hình Nhắn Tin**:
  - Loại bỏ hoàn toàn các hàm `setInterval` gọi lại API định kỳ (2.5 - 3s) trong `association.messages.tsx`, chấm dứt hiện tượng giật lag và nhấp nháy màn hình.
  - Sử dụng sự kiện `focus` của trình duyệt để nạp lại dữ liệu âm thầm kết hợp với WebSocket realtime (`dm:message_received`, `dm:thread_updated`, `dm:message_read`) để hiển thị tin nhắn mới tức thời.
- **4. Căn Giữa & Đồng Bộ Màu Sắc Modal "Liên Hệ Nhanh"**:
  - `AssociationContactSheet.tsx` được căn giữa tuyệt đối (`items-center justify-center p-4`), loại bỏ căn dính đáy (`items-end`).
  - Toàn bộ các mã màu vàng/cam hổ phách được chuyển hóa sang màu xanh Sky Blue hoàng gia (`from-sky-500 via-sky-600 to-blue-600`), nhãn nút hiển thị chuẩn hóa là `"Liên hệ nhanh"`.
- **5. Nâng Cao Tương Phản Huy Hiệu Tin Tức & Icon Sự Kiện**:
  - Huy hiệu danh mục trong `association.news.tsx` chuyển sang phong cách pill nổi bật: nền xanh sáng, viền đậm, chữ xanh đậm in hoa siêu đậm (`font-extrabold`).
  - Biểu tượng "Sự kiện nổi bật" trên trang chủ được nâng cấp thành khối bo góc vuông gradient sắc nét với biểu tượng lịch viền dày.
- **6. Thao Tác Xóa Thông Báo Trực Quan**:
  - Bổ sung biểu tượng thùng rác `Trash2` màu đỏ hồng (`text-rose-500`) trên từng thẻ thông báo để xóa nhanh tức thì.
  - Thanh tác vụ dưới đáy và nút thao tác trên header được đổi sang chức năng "Xóa" với biểu tượng `Trash2`, tích hợp modal xác nhận xóa an toàn.


## 15.8 Tinh Chỉnh UI/UX Chuẩn Hóa Bộ Nhận Diện CEO 1983 (2026-09-14)
- **Borderless Search Input**: Bỏ hoàn toàn viền focus và ring shadow trên ô tìm kiếm tin nhắn (`/association/messages`) qua `.borderless-search-input` và CSS exclusion `.vba-app input:not(.borderless-search-input):focus-visible`.
- **Icon Sự Kiện Nổi Bật**: Chuyển từ container gradient xanh đặc sang icon Calendar phẳng (`text-sky-600 dark:text-sky-400`), đồng bộ 100% format không viền và sắc độ êm dịu với icon Crown mục "Ưu đãi Hội viên & Đối tác".
- **Nút "Xem" Thư Viện Tài Liệu**: Chuyển từ `bg-sky-500/10 text-sky-600` mờ nhạt sang nút pill đậm `bg-sky-600 hover:bg-sky-700 text-white font-extrabold` độ tương phản cao trên nền thẻ trắng.

## 15.9 Khắc Phục Triệt Để Luồng Đăng Nhập CRM & Ngăn Chặn Điều Hướng Lệch Sang ViOne (2026-09-14)
- **Bảo Vệ Độc Lập Tuyệt Đối Cổng Đăng Nhập CRM (`/auth`)**:
  - Không tự động chuyển hướng sang `/vione/login` khi tham số `redirect` chứa `/connect-app`.
  - Sau khi đăng nhập thành công, `goPostLogin()` đưa Quản trị viên vào thẳng CRM Dashboard (`/`).
- **Xóa Bỏ Các Cơ Chế Cưỡng Bức Chuyển Hướng Mobile Sang ViOne**:
  - Gỡ bỏ `location.replace("/connect-app")` trong inline script khởi tạo của `__root.tsx`.
  - Gỡ bỏ `navigate({ to: "/connect-app" })` trên `routes/index.tsx` và `AuthGate`.
  - Đảm bảo Quản trị viên và người dùng có thể sử dụng CRM Dashboard trên cả máy tính, tablet và điện thoại di động mà không bị gián đoạn.


## 18. QUY TRÌNH SỰ KIỆN, TIN NHẮN THANH TOÁN VIETQR & THÔNG BÁO THU PHÍ (CẬP NHẬT 2026)

### 18.1. Điều phối Khởi chạy Ứng dụng Mobile
- **Capacitor Mobile Native**: `apps/mobile/capacitor.config.ts` trỏ trực tiếp `REMOTE_URL = 'http://14.225.217.232:5000/connect-app'`.
- **Trình duyệt Di động**: Khi người dùng di động mở `/` mà không có cờ `portal=crm`, hệ thống tự động điều hướng sang `/connect-app`, loại bỏ hoàn toàn tình trạng mở nhầm trang landing hệ thống `/landing`.
- **Cổng Quản trị CRM**: Truy cập qua `/auth?portal=crm`, sau khi đăng nhập duy trì tại `/?portal=crm` với `sessionStorage.crm_portal = '1'`.

### 18.2. Nghiệp vụ Sự kiện Hiệp hội (`/association/events`)
- **API Đăng ký Sự kiện**: `POST /api/events/:id/register`
  - Body: `{ fullName, phone, email, company, position, ticketCount, ticketType, note }`
  - Cơ chế thanh toán tự động: Backend tính tổng phí (Đơn giá 500.000 đ × Số vé), sinh mã hóa đơn `EV-[MÃ]` và mã VietQR `https://img.vietqr.io/image/MB-1983000000-compact2.png?amount=[TIỀN]&addInfo=[MÃ]`.
  - Tự động đẩy 2 tin nhắn vào bảng `public.messages` từ `ADMIN` tới mã hội viên:
    1. Tin nhắn văn bản thông báo tiếp nhận đăng ký kèm thông tin cá nhân và số lượng vé.
    2. Thẻ thanh toán VietQR dạng `[action:payment|amount:...|invoice:...|qr:...|due:...|desc:...]` hiển thị trực tiếp trong khung chat hội viên.
  - Tự động tạo bản ghi thông báo trong `public.member_notifications` và `public.business_notifications`.

### 18.3. Nghiệp vụ Thông báo & Điều hướng Thanh toán (`/association/notifications`)
- Modal xem chi tiết thông báo (`NotificationDetailModal`) cho phép xem toàn văn thông báo kèm người gửi và thời gian gửi.
- Tự động nhận diện thông báo có phí: kiểm tra `category === 'fee'`, `notificationKind === 'overdue_payment_reminder'`, hoặc chuỗi chứa các từ khóa thu phí/hội phí/hội phí/sự kiện/hóa đơn.
- Cung cấp nút nổi bật **"Thanh toán ngay"** trên cả thẻ danh sách và trong modal chi tiết, tự động điều hướng vào trang thanh toán hội phí `/association/renew` hoặc khung chat thanh toán `/association/messages?peerCode=admin`.

### 11.23 Chuẩn hóa UI/UX Tối giản Mobile & Điều hướng Ứng dụng Hội viên (15/09/2026)
1. **Thông báo Hội viên (`/association/notifications`)**:
   - Loại bỏ các icon thao tác trùng lặp ở góc trên cùng bên phải.
   - Hàng nút hành động dưới thẻ gồm các nút compact đồng nhất: "Xem chi tiết", "Ẩn", "Xóa" và "Thanh toán ngay" (khi có phí).
2. **Khung chat Hội viên (`/association/messages`)**:
   - Nút quay lại trên header chat sử dụng duy nhất icon `ChevronLeft` kích thước lớn (`h-6 w-6`), lược bỏ chữ để tối ưu không gian hiển thị danh tính đối tác và trạng thái trực tuyến.
3. **Danh thiếp số (`/association/business-cards`)**:
   - `MemberHeader` được trang bị nút quay lại (`back`), đảm bảo trải nghiệm liền mạch khi mở từ menu hoặc trang chủ.
4. **Sự kiện Hội viên (`/association/events`)**:
   - Tinh gọn thanh tiêu đề bằng cách bỏ icon quét QR trùng lặp ngang hàng với chữ "Sự kiện".

---

## 19. KIẾN TRÚC 100% HTTPS-ONLY & PHÂN TÁCH TRIỂN KHAI ĐỘC LẬP (CẬP NHẬT 09/2026)

### 19.1. Kiến Trúc Bảo Mật 100% HTTPS-Only & Khóa Toàn Diện Plain HTTP
- **Chuyển Hướng 301 Cổng 80**: Server block Nginx Reverse Proxy (`deploy/ssl/nginx.conf`) lắng nghe toàn bộ request cổng 80 và thực hiện `return 301 https://$host$request_uri;`. Toàn bộ HTTP trần bị triệt tiêu hoàn toàn.
- **HSTS Header**: Áp dụng `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;` trên tất cả các cổng SSL (443, 5443, 5444).
- **Cách Ly Cổng Nội Bộ (Loopback Isolation)**:
  - Cấu hình Docker Compose của CRM (`deploy/vione/docker-compose.yml`) bind cổng `127.0.0.1:5000:8080` (Frontend) và `127.0.0.1:5001:4000` (Backend).
  - Cấu hình Docker Compose của CEO 1983 (`deploy/ceo1983/docker-compose.yml`) bind cổng `127.0.0.1:5002:8080` (Frontend) và `127.0.0.1:5003:4000` (Backend).
  - Ngăn chặn mọi truy cập trực tiếp từ Internet vào cổng HTTP trần nội bộ; toàn bộ lưu lượng công khai bắt buộc phải đi qua Nginx SSL Reverse Proxy.
- **Cổng Dịch Vụ Công Khai**:
  - `https://14.225.217.232:5443`: Cổng SSL chuyên biệt cho Hệ thống Web CRM & Landing.
  - `https://14.225.217.232:5444`: Cổng SSL chuyên biệt cho Phân hệ Ứng dụng Hội viên CEO 1983.
  - `https://14.225.217.232/`: Cổng SSL chuẩn 443 định tuyến hợp nhất.

### 19.2. Phân Tách Hai Lệnh Triển Khai Độc Lập
1. **Triển khai Phân hệ Hội viên CEO 1983 (`deploy-ceo1983.ps1`)**:
   - Chỉ biên dịch và cập nhật container `ceo1983-frontend-prod` và `ceo1983-backend-prod` trên cổng 5444 HTTPS.
   - Lệnh nhanh: `npm run deploy:ceo1983` hoặc `.\deploy-ceo1983.ps1`.
   - Hỗ trợ cờ `-FrontendOnly -SkipWebBuild` để cập nhật giao diện trong vài giây: `npm run deploy:ceo1983:fe`.
2. **Triển khai Hệ thống Quản trị Web CRM (`deploy-crm.ps1`)**:
   - Chỉ biên dịch và cập nhật container `vione-frontend-prod` và `vione-backend-prod` trên cổng 5443 HTTPS.
   - Lệnh nhanh: `npm run deploy:crm` hoặc `.\deploy-crm.ps1`.
   - Hỗ trợ cờ `-FrontendOnly -SkipWebBuild`: `npm run deploy:crm:fe`.

---

## 20. ĐẶC TẢ LANDING CEO 1983 V1 (`/landing/ceo/v1`) — ĐỒ HỌA UỐN LƯỢN & DUAL SKY THEME

### 20.1. Ngôn Ngữ Thiết Kế Hữu Cơ (Organic Curved Aesthetics)
- **Triệt tiêu 100% khối chữ nhật vuông vức**: Không sử dụng các khối thẻ vuông vức cơ bản (rectangular grid blocks).
- **Đường phân cách uốn lượn đa tầng SVG (Smooth Multi-Layer Wave Dividers)**: Giữa mỗi phân cảnh sử dụng các dải sóng SVG mềm mại (`<svg viewBox="0 0 1440 120">`), tạo cảm giác không gian bầu trời và đại dương liên tục không vết cắt.
- **Thẻ Card Bo Góc Bất Đối Xứng Hữu Cơ**: Sử dụng cấu trúc bo viền `rounded-[40px_16px_40px_16px]` kết hợp hiệu ứng kính mờ đa tầng Glassmorphism và viền gradient vàng hổ phách.
- **Logo Thương Hiệu**: Sử dụng duy nhất logo chính thức `/ceo1983-official-logo.png`.

### 20.2. Hệ Thống Hai Theme Bầu Trời (Dual Sky Themes)
1. **Theme Trời Tối (Cosmos Night Sky)**:
   - Nền: Bầu trời đêm huyền ảo đầy sao và đường chân trời thành phố lung linh (`/ceo1983_hero_cosmos_skyline.jpg`).
   - Tông màu: Deep Midnight Navy, Sapphire Blue, Warm Amber Gold (`#F59E0B`), điểm nhấn vệt sáng neon vàng kim.
   - Thẻ card: Kính đen mờ ngọc bích `bg-slate-950/70 border-amber-500/30`.
2. **Theme Trời Sáng (Daylight Azure Sky)**:
   - Nền: Bầu trời bình minh quang đãng, mây trắng bồng bềnh và ánh nắng rực rỡ (`/ceo1983_hero_daylight_skyline.jpg`).
   - Tông màu: Light Sky Blue (`#F0F9FF`), Pure White, Deep Navy typography (`#0F172A`), Golden Sun accents (`#D97706`).
   - Thẻ card: Pha lê trắng ngọc trai `bg-white/85 border-amber-400/40 text-slate-900`.
3. **Bộ Chuyển Đổi Theme Tương Tác**:
   - Nút công tắc chuyển Theme tại Header (desktop/mobile) và thanh điều hướng nổi (Floating Bottom Dock).
   - Tự động ghi nhớ lựa chọn vào `localStorage.getItem("ceo1983_v1_theme")`.

---

## 21. QUY CHUẨN MỞ CỔNG TƯỜNG LỬA (FIREWALL & UFW) VÀ CHẨN ĐOÁN KẾT NỐI HTTPS MÁY CHỦ DEV

### 21.1. Phân Tích Sự Cố 'ERR_CONNECTION_REFUSED' & Console DevTools Trống
- Khi trình duyệt truy cập `https://14.225.217.232:5443` và nhận thông báo `ERR_CONNECTION_REFUSED`:
  - **Bản chất mạng**: Đây là phản hồi từ chối kết nối ở tầng mạng TCP (gói tin RST từ hệ điều hành máy chủ), xảy ra trước khi bắt tay SSL/TLS hay truyền tải HTTP request.
  - **Lý do Console DevTools trống**: Do không có bất kỳ phản hồi HTTP/HTML hay tệp Javascript nào được tải về từ máy chủ, Console trình duyệt tự nhiên sẽ hoàn toàn trống trơn.

### 21.2. Quy Trình Tự Động Mở Cổng Trong `deploy/ssl/deploy-ssl.ps1`
1. **Tự động mở cổng hệ điều hành Ubuntu**:
   - `ufw allow 5443/tcp`
   - `ufw allow 5444/tcp`
   - `ufw reload`
   - `iptables -I INPUT -p tcp --dport 5443 -j ACCEPT`
   - `iptables -I INPUT -p tcp --dport 5444 -j ACCEPT`
2. **Kiểm tra chẩn đoán thực tế ngay trong phiên SSH**:
   - Chờ `sleep 2` để Nginx worker ổn định.
   - Hiển thị danh sách container: `docker ps -a --filter name=vione-ssl-proxy`.
   - Hiển thị log cảnh báo nếu có: `docker logs --tail 10 vione-ssl-proxy`.
   - Kiểm thử nội bộ: `curl -k -s -I https://127.0.0.1:5443/` và `https://127.0.0.1:5444/` để xác thực mã phản hồi HTTP trực tiếp từ máy chủ.

### 21.3. Lưu Ý Đối Với Cloud Security Group (Viettel IDC / VNPT Cloud)
- Nếu sau khi mở UFW trên máy chủ mà kết nối từ bên ngoài Internet vẫn bị TIMEOUT hoặc REFUSED:
  - Quản trị viên hạ tầng cần truy cập Cổng quản trị Cloud Portal của nhà cung cấp (Viettel IDC Dashboard) ➔ Mục **Network / Security Groups** ➔ Thêm luật **Inbound Rule** cho phép:
    * Port Range: `5443`, Protocol: `TCP`, Source: `0.0.0.0/0`
    * Port Range: `5444`, Protocol: `TCP`, Source: `0.0.0.0/0`

---

## 22. ĐẶC TẢ PHÂN TÁCH 3 HỆ THỐNG ĐỘC LẬP & BẢO MẬT HTTPS CHO VIONE APP (MẠNG XÃ HỘI)

### 22.1. Ma Trận 3 Hệ Thống Độc Lập Trong Monorepo
Hệ thống được cấu hình phân tách rành mạch thành 3 ứng dụng độc lập, mỗi ứng dụng sở hữu container Docker, cổng nội bộ và cổng HTTPS SSL Reverse Proxy riêng biệt:

| Phân hệ / Ứng dụng | Scope Mã Nguồn | Route Chính | Cổng HTTP Nội Bộ | Cổng HTTPS SSL Proxy | Tên Container Docker | Kịch Bản Triển Khai |
|---|---|---|---|---|---|---|
| **Web CRM Quản trị & Landing** | `crm_platform` | `/auth`, `/`, `/landing` | 5004 / 5005 | **5443** | `crm-frontend-prod`, `crm-backend-prod` | `deploy-crm.ps1` (`npm run deploy:crm`) |
| **App Hiệp Hội CEO 1983** | `association_app` | `/association` | 5002 / 5003 | **5444** | `ceo1983-frontend-prod`, `ceo1983-backend-prod` | `deploy-ceo1983.ps1` (`npm run deploy:ceo1983`) |
| **ViOne App (Mạng Xã Hội)** | `vione_app` | `/connect-app` | 5000 / 5001 | **5445** | `vione-frontend-prod`, `vione-backend-prod` | `deploy-vione.ps1` (`npm run deploy:vione`) |

### 22.2. Tính Độc Lập Tuyệt Đối Của ViOne App
- **ViOne App - Mạng Xã Hội Doanh Nhân ViOne Connect**:
  - Phục vụ hội viên kết nối giao thương cá nhân, đăng bài khoảnh khắc (Moments), quét danh thiếp số NFC/QR, nhắn tin trò chuyện 1-1, và điều phối cuộc hẹn B2B.
  - Hoạt động tách biệt hoàn toàn khỏi hệ thống Web CRM Quản trị.
  - Cổng kết nối bảo mật: `https://14.225.217.232:5445` hoặc `https://dev-vione.14-225-217-232.sslip.io:5445`.

### 22.3. Khắc Phục Lỗi Carriage Return '\r' Khi Triển Khai Qua SSH
- Lệnh SSH từ máy trạm Windows PowerShell được chuẩn hóa qua tệp thực thi `deploy/ssl/setup-ssl.sh` và lệnh lọc ký tự kết thúc dòng:
  `sed -i "s/\r$//" ~/ssl-proxy/setup-ssl.sh; bash ~/ssl-proxy/setup-ssl.sh`
  đảm bảo môi trường Linux thực thi chính xác 100% không phát sinh lỗi `cd: $'/root/ssl-proxy\r': No such file or directory`.

---

## 23. ĐẶC TẢ TRIỆT TIÊU LỖI MIXED CONTENT & ĐỊNH TUYẾN TOÀN DIỆN REVERSE PROXY TRÊN HTTPS

### 23.1. Phân Tích Hiện Tượng & Nguyên Nhân Mixed Content (`blocked:mixed-content`)
- **Hiện tượng**:
  - Khi người dùng truy cập `https://14.225.217.232:5444/association/login`, trang web tải giao diện tốt nhưng khi ấn Đăng nhập thì thông báo lỗi `Failed to fetch / bc.mobile.auth.err.networkHint`.
  - Trên bảng điều khiển trình duyệt (F12 ➔ Network tab), request `login` bị tô đỏ với trạng thái: `(blocked:mixed-content)`.
- **Nguyên nhân cốt lõi**:
  - Tệp `apps/vione_app_fe/.env.production` chứa chuỗi `VITE_API_URL="http://14.225.217.232:5001"`. Trong quá trình đóng gói sản xuất (`npm run build`), Vite đã chèn trực tiếp chuỗi URL HTTP này vào các bundle JavaScript của client.
  - Khi trình duyệt truy cập website bằng HTTPS (`https://...`), chính sách bảo mật nội dung hỗn hợp (Mixed Content Policy) của Chrome/Safari/Edge tự động chặn tất cả các yêu cầu tải dữ liệu hoặc gọi API qua HTTP không bảo mật (`http://...`).

### 23.2. Cơ Chế Triệt Tiêu Mixed Content Bằng Relative API Path & Auto-Upgrade
1. **Làm sạch tệp cấu hình Build**:
   - Biến môi trường `VITE_API_URL` trong `apps/vione_app_fe/.env.production` được đưa về chuỗi rỗng `""`.
2. **Xử lý động tại tầng Client (`api-client.ts`, `AuthContext.tsx`, `business-card.sdk.ts`)**:
   - Khi chạy trong trình duyệt (`typeof window !== 'undefined'`) qua HTTPS hoặc trên các cổng Reverse Proxy (5443, 5444, 5445), `NEST_API_URL` và `API_BASE` trả về chuỗi rỗng `""`.
   - Các cuộc gọi API (ví dụ `fetchNestApi("/auth/login")`) sẽ gọi tới `/api/auth/login` (đường dẫn tương đối). Trình duyệt tự động gắn Origin hiện tại (`https://14.225.217.232:5444/api/auth/login`).
   - Nginx Reverse Proxy tiếp nhận request HTTPS và chuyển tiếp nội bộ qua mạng Docker (`vione-network`) tới backend container tương ứng.
   - **Kết quả**: 100% kết nối là HTTPS, không phát sinh lỗi Mixed Content, không yêu cầu cấu hình CORS phức tạp.
3. **Nâng cấp tự động URL Media/Upload (`resolveMediaUrl`, `getImageUrl`)**:
   - Khi dữ liệu trả về từ cơ sở dữ liệu có chứa URL tuyệt đối dạng `http://14.225.217.232:5001/uploads/...`, các hàm tiện ích sẽ tự động chuyển đổi sang `https://<Origin-Hiện-Tại>/uploads/...`.

### 23.3. Cấu Hình Nginx Đầy Đủ Cho Uploads & WebSockets (`deploy/ssl/nginx.conf`)
Mỗi khối server (5443, 5444, 5445) được trang bị đầy đủ các định tuyến tới backend container:
- `location /api/`: Chuyển tiếp tới backend API container cổng 4000.
- `location /uploads/` & `location /upload/`: Chuyển tiếp các tệp ảnh/tài liệu được backend phục vụ.
- `location /socket.io/`: Chuyển tiếp kết nối thời gian thực WebSocket với đầy đủ tiêu đề `Upgrade` và `Connection "upgrade"`.

### 23.4. Chẩn Đoán & Khắc Phục Lỗi 502 Bad Gateway Trên Các Cổng Độc Lập
- Khi người dùng truy cập một cổng và nhận mã lỗi `502 Bad Gateway` (ví dụ cổng 5443 hoặc 5445):
  - **Nguyên nhân**: Nginx SSL Proxy đang chạy bình thường nhưng container đích của phân hệ đó (ví dụ `crm-frontend-prod` hoặc `vione-frontend-prod`) chưa được khởi chạy trên máy chủ.
  - **Khắc phục**: Chạy kịch bản triển khai độc lập tương ứng từ máy trạm:
    * Kích hoạt Web CRM (5443): `npm run deploy:crm`
    * Kích hoạt ViOne App (5445): `npm run deploy:vione`
    * Cập nhật App CEO 1983 (5444): `npm run deploy:ceo1983`

---

## 24. KIẾN TRÚC PHỤC VỤ TÀI NGUYÊN MEDIA & KHẮC PHỤC TRIỆT ĐỂ LỖI ẢNH 500 / 404 VÀ LỖI 502 BAD GATEWAY

### 24.1. Phân Tích Hiện Tượng & Nguyên Nhân Lỗi Ảnh 500 và 404
1. **Lỗi ảnh 500 (Internal Server Error)**:
   - **Nguyên nhân tầng MinIO Service**: Trong hàm `getFileStream(filename)` của `MinioService`, trước đây sử dụng `throw new InternalServerErrorException(...)` khi MinIO chưa khởi chạy, bucket check thất bại hoặc mã đối tượng không tồn tại (`NoSuchKey`).
   - **Nguyên nhân tầng Stream Express/NestJS**: Khi gọi `stream.pipe(res)` trong `UploadController.getFile`, thiếu listener sự kiện lỗi `stream.on('error', ...)`. Trong Node.js, khi stream phát sinh lỗi mà không có listener hứng, lỗi sẽ trở thành unhandled stream exception, khiến Express tự động phản hồi mã trạng thái HTTP 500.
2. **Lỗi ảnh 404 (Not Found)**:
   - **Nguyên nhân URL tương đối**: Trong cơ sở dữ liệu và local state, một số avatar được lưu dưới dạng tên file thuần (bare filename) hoặc UUID (ví dụ: `00000000-0000-4000-8000-000000000001-170838-i5o6ez.jpg`) mà không có tiền tố thư mục `avatars/` hoặc `/api/upload/file/`.
   - Khi gán trực tiếp vào thuộc tính `<img src={displayAvatar} />` trên trang `/association`, trình duyệt hiểu là đường dẫn tương đối và gửi request tới máy chủ frontend static: `https://14.225.217.232:5444/association/00000000-...jpg`, dẫn tới phản hồi 404 Not Found từ máy chủ Nitro/Nuxt.

### 24.2. Giải Pháp Toàn Diện Triệt Tiêu Lỗi Ảnh
1. **Harden Backend UploadController & MinioService (`upload.controller.ts`, `minio.service.ts`)**:
   - `MinioService.getFileStream`: Tuyệt đối không ném lỗi `InternalServerErrorException`. Nếu MinIO không sẵn sàng hoặc không tìm thấy file, trả về `null`.
   - `UploadController.getFile`:
     * Đa tầng tìm kiếm (Local disk fallback): Tìm trong `uploads/<path>`, `uploads/avatars/<filename>`, `uploads/documents/<filename>`.
     * Tìm kiếm linh hoạt trên MinIO: Thử key gốc, thử thêm tiền tố `avatars/` hoặc bóc tách tiền tố `avatars/`.
     * Đính kèm listener an toàn `readable.on('error', ...)` trước khi pipe.
     * Trả về HTTP 404 sạch sẽ thay vì mã lỗi 500.
2. **Nâng cấp Hàm Nhận Diện URL Media (`api-client.ts`)**:
   - Bổ sung quy tắc trong `resolveMediaUrl` và `transformUrls`: Bất kỳ chuỗi nào là UUID hoặc bare filename có đuôi mở rộng ảnh (`.jpg`, `.png`, `.webp`, `.gif`, `.svg`) chưa có tiền tố đều được tự động chuyển thành `/api/upload/file/avatars/<filename>`.
3. **Bổ Sung Fallback Chống Vỡ Giao Diện (`association.index.tsx`, `association.profile.tsx`)**:
   - Gắn cờ `avatarError` và bộ xử lý `onError={() => setAvatarError(true)}` vào tất cả thẻ `<img />` hiển thị ảnh đại diện.
   - Khi ảnh lỗi hoặc chưa tồn tại trên storage, UI lập tức chuyển sang huy hiệu chữ cái viết tắt (Initials Badge) nền gradient Navy mạ vàng sang trọng, bảo toàn 100% tính thẩm mỹ cao cấp.

### 24.3. Kiến Trúc Mạng Docker Đồng Bộ & Xử Lý Lỗi 502 Bad Gateway ViOne (Port 5445)
1. **Nguyên Nhân Lỗi 502 Bad Gateway**:
   - Nginx SSL Proxy (`vione-ssl-proxy`) được gắn vào Docker bridge network mang tên `vione-network`.
   - Trước đây trong `deploy/vione/docker-compose.yml`, network thiếu khai báo `name: vione-network`, khiến Docker Compose tự động tạo mạng theo tên thư mục (`root_vione-network` hoặc `vione_vione-network`), cô lập các container của ViOne khỏi proxy.
   - Do đó, Nginx không thể phân giải DNS `http://vione-frontend-prod:8080`, dẫn tới phản hồi 502 Bad Gateway.
2. **Giải Pháp Đồng Bộ Mạng & MinIO**:
   - Chuẩn hóa `name: vione-network` xuyên suốt cả 4 tệp docker-compose (`deploy/ssl/`, `deploy/ceo1983/`, `deploy/crm/`, `deploy/vione/`).
   - Cung cấp network aliases cho container `vione-minio-prod`: `[minio, vione-minio-prod]` để cả 3 backend container đều kết nối MinIO thông suốt.
   - Trong script deploy, tự động thực thi `docker network create vione-network 2>/dev/null || true` trước khi khởi chạy container.

### 24.4. Triệt Tiêu Lỗi Vòng Lặp 404 Avatar (8 Requests) & Lỗi 500 /api/upload/avatar (Dual-Storage Fallback)
1. **Khắc phục Vòng lặp 404 (Re-render Reset Loop)**:
   - **Nguyên nhân**: State `avatarError` bị reset về `false` mỗi khi `useEffect([customAvatar, member?.avatar])` chạy lại trong `association.profile.tsx`. Khi component re-render (do cập nhật danh sách bạn bè/tin nhắn), thẻ `<img>` lại thử load URL ảnh cũ không còn tồn tại trên server, gây ra chuỗi 8 request 404 Not Found liên tiếp. Đồng thời `localStorage` lưu trữ `vba_member_avatar_photo` chứa URL ảnh chết.
   - **Giải pháp**:
     * `scripts/clean_all_dead_avatars.js`: Đã dọn sạch các URL avatar chết (`i5o6ez`, `d9ut5z`, `4qjy8i`) trên `public.business_identities`, `public.user_profiles`, `public.vione_users`, và `public.user_uploads`.
     * `src/lib/api-client.ts`: Thêm `isDeadAvatarUrl(url)` và tích hợp vào `resolveMediaUrl(url)` để trả về `null` ngay lập tức, chặn request mạng 404 từ gốc.
     * `association.profile.tsx`: Bổ sung `handleAvatarLoadError` tự động xóa key chết khỏi `localStorage`, chỉ reset `avatarError` khi có file ảnh mới tải lên (`data:` base64 URI hợp lệ).
2. **Khắc phục Lỗi 500 Internal Server Error tại `/api/upload/avatar`**:
   - **Nguyên nhân**:
     * `upload.service.ts` gọi `UPDATE public.members SET avatar = $1 WHERE user_id = $2`. Bảng `public.members` không có cột `avatar` khiến PostgreSQL throw exception.
     * `minioService.uploadFile` throw lỗi 500 unhandled khi container MinIO không sẵn sàng hoặc gặp sự cố mạng nội bộ.
     * `handleAvatarChange` hiển thị `toast.success` trong khối `catch` gây nhầm lẫn cho người dùng.
   - **Giải pháp**:
     * **Cơ chế Dual-Storage Fallback**: Mọi file upload lên server đều được ghi vào đĩa cứng cục bộ server (`uploads/avatars/` hoặc `uploads/documents/`) trước tiên. Sau đó hệ thống thử upload lên MinIO trong khối `try/catch`. Nếu MinIO lỗi, hệ thống tự động fallback sử dụng URL đĩa cục bộ (`/uploads/avatars/...`) mà không ném lỗi 500.
     * Đồng bộ `avatar_url` chuẩn xác vào các bảng: `user_profiles`, `business_identities`, `vione_users`, và `member_business_cards`.
     * Chuẩn hóa `upload.controller.ts` xử lý `userId` linh hoạt (`req.user?.id || req.user?.sub`) và trả về `BadRequestException` rõ ràng khi thiếu file.



### 24.5. Kien Truc Luu Tru Ben Vung Da Tang Cho Upload (Shared Volume + MinIO Multi-Endpoint Connection Pool)
1. **Nguyen Nhan Loi Upload Moi Tren Server (500 Tai CRM va 404 Tai App Hiep Hoi)**:
   - **CRM (5443)**: Container crm-backend-prod tren may chu tu xa chay phien ban Docker cu, gap unhandled DNS exception getaddrinfo ENOTFOUND minio khi ket noi MinIO va loi truy van cot avatar khong ton tai trong public.members.
   - **App Hiep Hoi (5444)**: Dockerfile.backend chay duoi quyen USER appuser. Thu muc /app thuoc root:root, nen appuser bi tu choi quyen ghi (EACCES: permission denied) khi co tao thu muc /app/uploads. File bi luu tam vao /tmp/uploads, nhung UploadController.getFile truoc do khong tim trong /tmp/uploads, dan toi request GET /api/upload/file/avatars/... tra ve 404. Ngoai ra, thieu Docker Volume khien file dia bi mat khi restart container.
2. **Kien Truc Trien Khai Hoan Chinh**:
   - **Pre-creation & Chown Trong Dockerfile.backend**:
     Tao truoc /app/uploads/avatars, /app/uploads/documents, /tmp/uploads/... va gan quyen chown -R appuser:appgroup /app/uploads /tmp/uploads && chmod -R 775 /app/uploads /tmp/uploads truoc USER appuser.
   - **Docker Shared Volume vione-uploads-data**:
     Gan volume chung vione-uploads-data:/app/uploads cho ca ceo1983-backend va crm-backend, ket noi mang ngoai vione-network (external: true).
   - **Multi-Endpoint MinIO Connection Pool**:
     MinioService khoi tao danh sach endpoint candidate (bien moi truong, IP cong khai 14.225.217.232:9050, Docker internal aliases vione-minio-prod:9000 / minio:9000, Docker gateway 172.17.0.1:9050). Khi ket noi thanh cong, uu tien client do len dau pool.
   - **UploadController.getFile Phuc Vu Da Vi Tri**:
     Tim kiem tep tuan tu tren /app/uploads, /tmp/uploads, dist/uploads va stream MinIO voi nhieu tien to du phong.
   - **Chong Hoan Toan Ghost URL**:
     Neu ca dia cung lan MinIO deu khong the luu tru tep, he thong nem InternalServerErrorException va khong ghi URL hong vao CSDL.

---

## 25. KIẾN TRÚC PHÂN ĐỊNH QUYỀN TÁC GIẢ (AUTHOR VS MANAGER), ĐỒNG BỘ ĐỊNH DẠNG NGÀY THÁNG DDD/MM/YY, TIỀN TỆ VNĐ & TỐI ƯU HÓA DEPLOY STREAMING PIPELINE

### 25.1. Phân Định Rạch Ròi Giữa Quyền Tác Giả (isAuthor) và Quyền Quản Trị (canManage)
- **Vấn Đề Kỹ Thuật**: Trước đây, logic checkIsProductOwner gộp chung quyền isAdmin vào isOwner. Khi tài khoản Admin đăng một sản phẩm hoặc xem sản phẩm của mình, hệ thống nhận diện sai dẫn tới việc hiển thị nút 'Nhận báo giá VIP' trên chính sản phẩm vừa đăng, hoặc không hiển thị menu quản trị Sửa/Xóa.
- **Giải Pháp Triển Khai**:
  - Tách bạch thành 2 hàm độc lập:
    * checkIsProductAuthor(p): So khớp danh tính tác giả thực tế dựa trên kiểm tra chéo đa trường: sellerId, seller_id, authorId, author_id, userId, user_id so với currentUser.id, currentMember.id, currentMember.code.
    * checkCanManageProduct(p): Quyền quản lý được cấp cho tác giả HOẶC tài khoản Quản trị viên (isAdmin).
  - Giao diện thẻ Sản phẩm (association.products.tsx):
    * Đối với Tác giả: Hiển thị huy hiệu vàng 'Sản phẩm của bạn' cùng các nút thao tác 'Sửa' và 'Xóa'.
    * Đối với Hội viên khác: Hiển thị nút kêu gọi hành động 'Nhận báo giá VIP'.
  - Giao diện Bảng tin Cơ hội B2B (association.opportunities.tsx):
    * Đối với Tác giả: Hiển thị nhãn 'Cơ hội của bạn' kèm nút mở danh sách người quan tâm (hỗ trợ Gọi điện, Gửi email, Chat 1-1).
    * Đối với Hội viên khác: Hiển thị nút tương tác 'Quan tâm'.

### 25.2. Chuẩn Hóa Toàn Diện Định Dạng Ngày Tháng Tiếng Việt ddd/mm/yy & ddd/mm/yyyy
- **Xây Dựng Thư Viện Tiện Ích src/lib/date-format.ts**:
  - formatDisplayDate(d, { withWeekday, shortYear }):
    * Thứ viết tắt tiếng Việt chuẩn mực: CN, T2, T3, T4, T5, T6, T7.
    * Định dạng ngày tháng: T2, 20/09/26 hoặc 20/09/2026.
  - formatFullVnDate(d): Xuất chuỗi ngày tháng đầy đủ (ví dụ: Thứ Hai, 20 tháng 09, 2026).
- **Đồng Bộ Bộ Đọc Đa Ngôn Ngữ i18n.ts**:
  - Hàm fmt.date(iso) được cấu hình sử dụng formatDisplayDate(iso, { shortYear: false }), bảo đảm tính nhất quán trên toàn bộ Web CRM và App Hiệp hội.
- **Badge Live Preview Dưới Ô Nhập Ngày**:
  - Dưới mỗi trường input type='date' (chẳng hạn Hạn chót cơ hội, Ngày diễn ra sự kiện), hệ thống tích hợp badge xem trước hiển thị thứ và ngày tháng định dạng Việt Nam, triệt tiêu nguy cơ nhầm lẫn do định dạng mặc định yyyy-mm-dd của trình duyệt.

### 25.3. Bộ Lọc Nhập Tiền Tệ VNĐ Tự Động Phân Cách Hàng Ngàn
- **Hàm formatCurrencyInput(value)**:
  - Tự động nhóm các cụm 3 chữ số bằng dấu chấm (ví dụ: gõ 50000000 hiển thị 50.000.000 VNĐ).
  - Khi người dùng gửi form, hệ thống tự động bóc tách toàn bộ dấu chấm và ký tự chữ cái (val.replace(/\D/g, '')) trước khi chuyển đổi sang số nguyên bigint gửi về backend API.

### 25.4. Tối Ưu Hóa Tốc Độ Kịch Bản Triển Khai (Streaming Docker Pipeline)
- **Vấn Đề Nghẽn I/O Ổ Đĩa**:
  - Kịch bản cũ sử dụng docker save -o archive.tar, sau đó dùng PowerShell hoặc 7z nén lại thành archive.tar.gz. Với mỗi image ~1.5GB, việc ghi và đọc lặp lại file tar khổng lồ chiếm tới 3-5 phút trên Windows.
- **Giải Pháp Streaming Nhị Phân Trực Tiếp**:
  - Sử dụng lệnh streaming trực tiếp:
    cmd.exe /c "docker save [image] | gzip -1 > [archive].tar.gz"
  - Bỏ qua hoàn toàn việc tạo file tar trung gian, giảm 85% thời gian đóng gói xuống còn 15-20 giây.
- **Nâng Cấp Cơ Chế Reload Container (Non-destructive Reload)**:
  - Thay thế docker compose down --remove-orphans bằng:
    docker compose stop [services]; docker rm -f [containers]; docker compose up -d --force-recreate [services]
  - Đảm bảo các mạng chia sẻ (vione-network) và các container phụ trợ (MinIO, proxy) không bao giờ bị hủy nhầm.

### 25.5. Cấu Hình Chuẩn Hóa Cổng Cho Đóng Gói Mobile (APK & IPA)
- **CLB Doanh Nhân CEO 1983 (apps/mobile_ceo1983/capacitor.config.ts)**:
  - server.url = 'http://14.225.217.232:5002/association'
  - Hỗ trợ đầy đủ allowNavigation: *.sslip.io*, 14.225.217.232*, ceo1983.com*.
- **ViOne Connect (apps/mobile_vione/capacitor.config.ts)**:
  - server.url = 'http://14.225.217.232:5000/connect-app'
  - Hỗ trợ allowNavigation: 14.225.217.232*, *.sslip.io*, vione.vn*.
- Cấu hình sẵn sàng 100% để thực thi lệnh build APK/IPA chỉ với 1 thao tác.
