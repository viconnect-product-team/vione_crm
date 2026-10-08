# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & KIẾN TRÚC DỮ LIỆU
## ỨNG DỤNG DI ĐỘNG & PWA HIỆP HỘI CLB DOANH NHÂN CEO 1983

### 1. Khái Niệm Bình Dân Cho Người Không Học IT:
App Hiệp Hội CEO 1983 giống như cuốn **Sổ Tay Doanh Nhân Thông Minh** của mỗi hội viên. Mọi thao tác bấm nút trên màn hình điện thoại đều tương ứng với việc ghi thêm hoặc đọc một dòng trong các ngăn tủ cơ sở dữ liệu:
* Khi anh/chị bấm **"Gắn kết"** với bạn hội viên: Máy tính viết một lá phiếu vào tủ `business_connections`, ghi rõ nội dung anh/chị muốn hẹn gặp là gì.
* Khi anh/chị muốn xem lại mình đã từng hẹn những ai: Ứng dụng mở tủ `business_connections` lấy phiếu ra, dùng **kẹp ghim (phép JOIN)** kẹp tờ lý lịch của người kia trong tủ `members` để hiển thị tên, công ty và avatar của họ lên màn hình.
* Khi Ban Truyền Thông quét mã QR: Chiếc camera chỉ làm nhiệm vụ đọc chuỗi ký tự trên vé, sau đó máy tính chạy vào tủ `event_registrations` lấy đúng cuống vé ra xem đã hợp lệ chưa và đóng dấu "ĐÃ CHECK-IN".

---

### 2. Danh Mục Nghiệp Vụ, APIs & Bản Vẽ CSDL Chi Tiết:

#### 2.1 Tính năng "Gắn Kết" & Lịch Sử Kết Nối
* **Gửi lời mời gắn kết**: `POST /api/connections/request` -> Lưu bảng `business_connections` (lưu đầy đủ trường `purpose`, người gửi, người nhận, trạng thái `pending`).
* **Hiển thị lịch sử**:
  - Vị trí 1: Tab *"Đã gửi kết nối"* trong trang Hội viên (`association.members.tsx`).
  - Vị trí 2: Tab *"Kết nối"* trong trang Lịch sử (`association.history.tsx`).
* **Câu lệnh JOIN truy vấn**:
```sql
SELECT c.id, c.purpose, c.status, c.created_at,
       m.full_name AS doi_tac, m.company_name, m.position_title, m.avatar_url
FROM business_connections c
INNER JOIN members m ON c.target_member_id = m.id
WHERE c.sender_member_id = '...'
ORDER BY c.created_at DESC;
```

#### 2.2 Quét Mã QR Soát Vé Cho Ban Truyền Thông
* Chỉ hội viên có chức vụ/vai trò Ban Truyền Thông (`isMediaDepartment = true`) mới thấy giao diện quét camera trên trang Check-in.
* Khi quét trúng mã QR vé:
  - Gọi API tra cứu: `GET /api/events/checkin/lookup?code=REG-xxx`
  - Ghép bảng: `event_registrations JOIN events JOIN members`
  - Mở modal chi tiết: Hiển thị Họ tên đại biểu, Doanh nghiệp, Bàn tiệc VIP số mấy, Số may mắn.
  - Bấm xác nhận: Gọi `POST /api/events/checkin/confirm` để đóng dấu `is_checked_in = true`.
