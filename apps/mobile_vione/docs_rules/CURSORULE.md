# CURSOR RULES - MOBILE NATIVE VIONE

## 1. Quy chuẩn phát triển React Native
- **Bảng màu giao diện chuẩn ViOne**:
  - Champagne Gold: `#DFB76C` / `#D4AF37`.
  - Obsidian Navy: `#0B0F17` / `#121A26` / `#003B95`.
  - Nền & Text: Trắng ngà, Slate `#64748B`, Dark Navy.
- **TUYỆT ĐỐI KHÔNG DÙNG**: Icon hoặc hình ảnh logo cứng của bên thứ ba trong mã nguồn. Chỉ sử dụng `lucide-react-native` hoặc vector component nội bộ.
- **Hiệu năng & Trải nghiệm Native**:
  - Tránh rerender không cần thiết trên FlatList / ScrollView.
  - Xử lý safe area với `react-native-safe-area-context`.
  - Các animation phải sử dụng native driver nếu dùng `Animated`.

## 2. Tiêu chuẩn code & Kiểm thử
- Type safety: Bắt buộc khai báo kiểu dữ liệu rõ ràng trong TypeScript.
- Trước khi hoàn thành bất kỳ nhiệm vụ nào, bắt buộc chạy: `npm run typecheck` và đảm bảo kết quả 0 lỗi (Exit Code 0).
