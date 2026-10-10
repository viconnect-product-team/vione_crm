# QUY CHUẨN THIẾT KẾ UI/UX - MOBILE NATIVE VIONE

## 1. Phong cách Thiết kế Executive
- Tối giản, thanh lịch, sang trọng.
- Loại bỏ các đường viền sắc nhọn hoặc hiệu ứng đổ bóng quá nặng; ưu tiên bo góc mềm (`borderRadius: 16`, `20`, `24`).
- Thẻ thông tin chia rõ ràng theo từng khối chức năng, không nhồi nhét chi tiết phụ.

## 2. Bảng màu Chuẩn (Strict Theme Palette)
- **Champagne Gold**:
  - Mã: `#DFB76C` (Gold chính), `#D4AF37` (Gold sáng), `#F5E7C8` (Gold nhạt nền).
  - Sử dụng: Nút hành động nổi bật, icon chỉ thị, viền thẻ cao cấp.
- **Obsidian Navy**:
  - Mã: `#0B0F17` (Navy đậm), `#121A26` (Màu bề mặt), `#003B95` (Xanh Navy điểm nhấn).
  - Sử dụng: Nền thanh điều hướng dưới, thẻ trung tâm điều hành.
- **Trắng & Xám Slate**:
  - Mã: `#FFFFFF`, `#F8FAFC`, `#64748B`, `#94A3B8`.
  - Sử dụng: Văn bản nội dung, thanh phân cách, nền màn hình.

## 3. Quy chuẩn Icon & Tương tác
- Tuyệt đối không gắn logo hoặc icon cứng từ bên thứ ba.
- Sử dụng đồng bộ `lucide-react-native` với kích thước 16-24px, màu sắc chuẩn theo chủ đề.
- Hiệu ứng phản hồi chạm (`activeOpacity={0.7}`) rõ ràng, phản hồi tức thì.
