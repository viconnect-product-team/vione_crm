const fs = require('fs');
const path = require('path');

const docPath = path.join(__dirname, '..', 'document', 'QUY_CHUAN_GIAO_DIEN_APP_VIONE_CONNECT.md');
let content = fs.readFileSync(docPath, 'utf8');

const target = '- **Thanh điều hướng dưới đáy (CustomBottomTabBar vs BusinessConnectBottomNav):**';
const addition = `- **Màn hình Network (NetworkScreen vs NetworkHome):**
      * Header thương hiệu: Wordmark + Lời chào + Hộp thư tin nhắn (unread badge) + Chuông thông báo.
      * Tiêu đề phân hệ 'Network' kèm nút thêm kết nối UserPlus và subtitle số kết nối thực tế.
      * Bộ 5 Category Tabs đồng bộ PWA: [Mạng lưới] [Khách hàng] [Gợi ý (AI)] [Tin nhắn] [Lời mời].
      * Dải tin nổi bật 'Gặp gần đây' (Stories Strip) ghi nhận cuộc gặp giao thương.
      * Quản lý khách hàng B2B: Pipeline phân loại giá trị hợp đồng, người liên hệ, mức ưu tiên.
      * Hộp thư doanh nghiệp tích hợp in-app: 4 danh mục (Tất cả, Chưa đọc, Nhóm, Tin nhắn chờ) & ChatThreadModal.
    - **Nút V & Action Sheet 1-Chạm (VActionSheet Native vs VActionSheet PWA):**
      * Watermark chữ V mạ vàng chìm 3D sang trọng nền Dark Obsidian.
      * Thẻ danh tính C-Level: Avatar, Họ tên, Chức vụ, Doanh nghiệp, Huy hiệu 'DOANH NHÂN VIONE XÁC THỰC', Địa điểm, Website.
      * Hero Gold CTA: 'Đưa mã QR của bạn' với nền gradient vàng hoàng kim ViOne.
      * 4 Thao tác kết nối: 'Chạm thẻ NFC', 'Quét mã QR', 'Quét danh thiếp', 'Ghi chú cuộc gặp'.
      * Bộ 3 Quick Tiles: 'Danh thiếp số', 'Ví thẻ', 'Bảo mật'.
      * Phân hệ Vận hành & Giám sát doanh nghiệp: Chấm công GPS, Quy trình BPMN Kanban, Phê duyệt 3 cấp.
    - **Màn hình Cộng đồng (CommunityScreen vs CommunityHome):**
      * Header thương hiệu ViOne + Tiêu đề 'Cộng đồng' kèm subtitle 'Thành viên · Sự kiện · Cơ hội'.
      * Ô tìm kiếm cộng đồng, liên minh doanh nghiệp, sự kiện B2B.
      * Bộ 4 Tabs phân loại: [Tất cả] [Đã tham gia] [Ban Điều Hành] [Sự kiện B2B].
      * Thẻ liên minh doanh nhân xác thực & Thẻ sự kiện B2B cấp mã vé QR điện tử tức thì.
    - **Màn hình Tôi / Profile (ProfileScreen vs MeScreen):**
      * Thẻ Hero Doanh Nhân ViOne: Avatar viền vàng, Chức vụ, Công ty, Email, Điện thoại.
      * Bộ 4 Nút thao tác nhanh: [Chia sẻ link] [Mã QR của tôi] [Thẻ NFC] [Xem trước].
      * Thẻ danh thiếp điện tử Titanium 3D: Chip thông minh, chỉ báo NFC, mã số doanh nhân VIONE-XXXX, nút mở QR.
      * Khối 'Về tôi & Năng lực doanh nghiệp': Kinh nghiệm 15+ năm, 500+ đối tác, 20+ dự án B2B, Lĩnh vực quan tâm.
      * Thông tin liên hệ & Cài đặt bảo mật (Xác thực 2 lớp, AI Personalization, Đăng xuất).
    `;

if (content.includes(target) && !content.includes('Màn hình Network (NetworkScreen vs NetworkHome)')) {
  content = content.replace(target, addition + target);
  fs.writeFileSync(docPath, content, 'utf8');
  console.log('Enriched documentation successfully');
} else {
  console.log('Target already present or not found');
}
