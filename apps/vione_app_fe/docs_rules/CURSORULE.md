# CURSOR RULES - FRONTEND VIONE (FE PWA)

## 1. Quy chuẩn phát triển giao diện
- **Bảng màu chuẩn ViOne**:
  - Champagne Gold: `#DFB76C` / `#D4AF37`.
  - Obsidian Navy: `#0B0F17` / `#121A26` / `#003B95`.
  - Nền & Text: Trắng ngà, Slate `#64748B`, Dark Navy.
- **TUYỆT ĐỐI KHÔNG DÙNG**: Logo hoặc icon cứng của bên thứ ba trong mã nguồn. Sử dụng Lucide icons với các tone màu thuộc bảng màu trên.
- **Tính phản hồi (Responsiveness)**: Giao diện phải hoạt động hoàn hảo trên cả PWA Mobile và Desktop.

## 2. Tiêu chuẩn code TypeScript & React
- Tuyệt đối không để `any` tùy tiện, phải khai báo interface/type đầy đủ.
- Trước khi hoàn thành tác vụ, bắt buộc chạy kiểm tra typecheck: `npx tsc --noEmit`.
- Không để xảy ra lỗi console warning/error liên quan đến React keys hoặc unhandled promise rejections.
