# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & KIẾN TRÚC DỮ LIỆU
## HỆ ĐIỀU HÀNH QUẢN TRỊ DOANH NGHIỆP ENTERPRISE CRM VIONE (163 BẢNG CSDL)

### 1. Khái Niệm Bình Dân Cho Người Không Học IT:
Web CRM ViOne giống như một **Tòa Nhà Văn Phòng Hạng A** có 163 ngăn tủ chuyên biệt.
* Mỗi doanh nghiệp là một khách thuê riêng biệt, được gán một mã số nhận diện `tenant_id`.
* Toàn bộ nhân viên của doanh nghiệp A chỉ nhìn thấy tủ tài liệu có dán tem của doanh nghiệp A, tuyệt đối không nhìn thấy của doanh nghiệp B.
* Mọi hành động thêm sản phẩm, sửa giá bán hay xuất hóa đơn đều được máy chủ tự động chụp ảnh bằng chứng ghi vào cuốn sổ nhật ký bất biến `audit_logs`.

---

### 2. Danh Mục Các Phân Hệ Cốt Lõi:
1. **Quản trị Sản phẩm & Kho hàng B2B**:
   - Bảng chính: `products`
   - Bảng liên kết: `categories` (Danh mục phân loại), `product_tags` (Thẻ tìm kiếm).
   - Câu lệnh JOIN: `SELECT * FROM products p JOIN categories c ON p.category_id = c.id WHERE p.tenant_id = '...'`.
2. **Quản trị Đơn hàng & Giỏ hàng B2B**:
   - Bảng `carts` (Giỏ hàng tổng thể của doanh nghiệp).
   - Bảng `cart_items` (Từng dòng mặt hàng, số lượng, đơn giá chiết khấu).
   - Bảng `invoices` (Hóa đơn thương mại khi khách bấm thanh toán).
3. **Trợ lý Trí tuệ Nhân tạo AI**:
   - Bảng `ai_conversations` (Phiên trò chuyện của CEO với trợ lý AI).
   - Bảng `ai_messages` (Từng câu hỏi của người dùng và câu trả lời cố vấn của AI, số lượng token sử dụng).
