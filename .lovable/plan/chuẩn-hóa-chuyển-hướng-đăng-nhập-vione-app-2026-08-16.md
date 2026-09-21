# Chuẩn hóa chuyển hướng đăng nhập ViOne App

## Mục tiêu
Luôn nhận diện đúng ngữ cảnh ViOne App và hiển thị màn đăng nhập Connect-app khi người dùng mở từ shortcut/PWA, từ luồng `/vione-app`, hoặc quay về `/auth`, kể cả khi trình duyệt còn giữ manifest cũ.

## Thay đổi
- Tạo dấu hiệu ViOne App bền vững phía trình duyệt, được ghi khi người dùng đi qua `/vione-app` hoặc `/connect-app`.
- Chuẩn hóa hàm nhận diện ngữ cảnh ViOne từ: tham số URL, đích chuyển hướng `/connect-app`, chế độ PWA/shortcut và dấu hiệu đã lưu.
- Tại `/auth`, ưu tiên giao diện đăng nhập Connect-app và đích sau đăng nhập là `/connect-app` khi có ngữ cảnh ViOne; vẫn giữ luồng đăng nhập web/hội viên hiện tại khi không có dấu hiệu này.
- Bảo toàn ngữ cảnh qua đăng nhập Google/Apple và các lần quay lại `/auth`; chỉ cho phép đích nội bộ an toàn.
- Bổ sung kiểm thử hồi quy cho các trường hợp PWA, shortcut/manifest cũ, `/auth` trực tiếp có dấu hiệu ViOne, và luồng web thông thường.

## Xác minh
- Kiểm tra tự động các nhánh nhận diện và chuyển hướng.
- Chạy trình duyệt tại `/vione-app`, `/connect-app` khi chưa đăng nhập và `/auth` để xác nhận đúng giao diện và URL đích.
