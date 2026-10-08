# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & KIẾN TRÚC DỮ LIỆU
## CỔNG QUẢN TRỊ TRUNG TÂM CLB DOANH NHÂN CEO 1983 (WEB CRM)

### 1. Khái Niệm Bình Dân Dành Cho Người Không Học IT:
Web CRM CEO 1983 đóng vai trò như **Bộ Chỉ Huy Trung Tâm** của ban chấp hành hiệp hội. Toàn bộ hồ sơ hội viên, danh sách đóng niên liễm, sơ đồ chỗ ngồi tiệc gala và cuống vé ra vào đều được lưu trong **Tủ tài liệu điện tử** (Cơ sở dữ liệu PostgreSQL).
* **Tủ `members`**: Chứa tờ khai lý lịch của từng CEO (Họ tên, Doanh nghiệp, Mã hội viên M1983-xxx).
* **Tủ `events`**: Chứa thông tin ngày giờ, địa điểm tổ chức các kỳ đại hội.
* **Tủ `event_registrations`**: Chứa danh sách vé đại biểu đăng ký (Mã vé REG-xxx, Bàn VIP, Số bốc thăm trúng thưởng).
* **Phép JOIN (Ghép Bảng)**: Khi in danh sách đón tiếp, máy tính dùng kẹp ghim kẹp tờ vé với tờ lý lịch hội viên tương ứng để hiện ra đầy đủ: *"Anh Nguyễn Văn An - Tổng giám đốc An Phát - Ngồi Bàn VIP 08 - Đã soát vé lúc 07:30"*.

---

### 2. Danh Mục Nghiệp Vụ, APIs & Bản Vẽ CSDL Chi Tiết:

#### 2.1 Quản trị Hội viên & Xét duyệt Đơn Gia nhập
* **API Tiếp nhận hồ sơ**: `POST /api/members/apply` -> Ghi nhận vào bảng `members` với trạng thái `pending`.
* **API Phê duyệt hội viên**: `POST /api/admin/members/:id/approve` -> Cập nhật `members.status = 'active'`, tự động tạo tài khoản đăng nhập trong `vione_users` và cấp mã `M1983-xxx`.
* **Câu lệnh JOIN tra cứu**:
```sql
SELECT m.member_code, m.full_name, m.company_name, m.position_title, u.email, ms.tier_name
FROM members m
INNER JOIN vione_users u ON m.user_id = u.id
LEFT JOIN memberships ms ON m.id = ms.member_id
WHERE m.status = 'active';
```

#### 2.2 Quản lý Sự kiện & Kiểm soát Soát vé Ban Truyền Thông
* **API Tạo sự kiện**: `POST /api/events` -> Lưu bảng `events`.
* **API Xuất vé QR**: `POST /api/events/:id/register` -> Sinh bản ghi cuống vé trong `event_registrations` kèm chuỗi mã QR và số may mắn Lucky Draw.
* **API Điểm danh Check-in**: `POST /api/events/checkin/confirm` -> Cập nhật `event_registrations.is_checked_in = true`, ghi nhận `scanned_by_user_id` của nhân viên Ban Truyền Thông, đồng thời ghi nhật ký vào `member_checkins`.

#### 2.3 Quản lý Tài chính, Hội phí & VietQR Tự Động
* **API Phát hành hóa đơn**: `POST /api/fees/invoices/generate` -> Lưu bảng `invoices`, sinh mã VietQR Napas 24/7 tự động.
* **API Gạch nợ / Gia hạn thẻ**: `PUT /api/admin/fees/:id/toggle` -> Chuyển `invoices.payment_status = 'paid'`, tự động tăng thời hạn trong bảng `memberships` thêm 365 ngày.
