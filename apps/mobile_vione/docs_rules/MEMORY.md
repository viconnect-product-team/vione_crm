# MOBILE MEMORY - VIONE MOBILE NATIVE

## Lịch sử kiến trúc & Cải tiến phiên bản
- **Ngày 09/10/2026**:
  - Tích hợp kiểm tra doanh nghiệp: `hasCompanyWithStaff` ẩn Chấm công và Ký duyệt chi, chỉ hiển thị Công việc khi tài khoản chưa có công ty có nhân sự.
  - Tối ưu trang chủ Native: Đưa danh mục "Tất cả" lên vị trí mặc định đầu tiên.
  - Tích hợp tính năng đề xuất kết bạn từ danh bạ số điện thoại phong cách Zalo (`ContactsDiscoveryModal`).
  - Sắp xếp tin nhắn: Hội thoại có tin nhắn mới nhất luôn đưa lên đầu danh sách.
  - Tương tác chat: Bấm vào avatar người chat chuyển ngay tới `MemberCardBottomSheet` để xem hồ sơ đối tác.
  - Đại tu Trợ lý AI: Giao diện tối giản Executive, hỗ trợ lịch sử đa phiên lưu `AsyncStorage`, xóa lịch sử, tạo hội thoại mới, nhận diện giọng nói tự động điều khiển 100% ứng dụng.
  - Chuẩn hóa luồng giao việc: Bổ sung thanh tiến độ %, nút nhận việc, modal cập nhật % tiến độ kèm ghi chú và chức năng Import công việc từ file mẫu Excel.
