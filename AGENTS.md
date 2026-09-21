# AGENTS RULES & CONSTRAINTS

## 1. Git Push & Commit Rule (STRICT)
- **TUYỆT ĐỐI KHÔNG TỰ ĐỘNG CHẠY `git push` HAY `git commit`**:
  - Không được tự ý thực thi các lệnh `git push` hoặc `git commit` trong terminal.
  - Mọi thay đổi mã nguồn chỉ được phép chỉnh sửa cục bộ (local).
  - Để người dùng toàn quyền chủ động kiểm tra, commit và push mã nguồn lên Git khi họ mong muốn.

## 2. Đồng Bộ Hóa Bắt Buộc: Memory, Cursor Rules & Tài Liệu Kỹ Thuật (STRICT)
- **Cập nhật MEMORY.md**: Mỗi lần thực hiện bất kỳ thay đổi kiến trúc, tính năng, sửa lỗi hoặc điều chỉnh luồng, BẮT BUỘC phải ghi nhận chi tiết vào `MEMORY.md`.
- **Cập nhật Cursor Rules / Roles (`.cursorrules`)**: Khi có quy chuẩn coding, quy tắc định tuyến, luồng xử lý hoặc vai trò mới, BẮT BUỘC phải bổ sung đồng bộ vào `.cursorrules`.
- **Bổ sung & Hiệu chỉnh Tài liệu Kỹ thuật**: Nếu phát hiện sai luồng, lệch schema/API/route, hoặc có thay đổi technical, BẮT BUỘC phải hiệu chỉnh ngay các tài liệu trong `document/` để code, database và tài liệu luôn khớp 100%.

## 3. Kiểm Tra Lỗi Code Bắt Buộc Trước Khi Hoàn Thành (STRICT CODE QUALITY & VERIFICATION)
- **TUYỆT ĐỐI KHÔNG ĐƯỢC ĐỂ LỖI CODE**:
  - Trước khi thông báo hoàn thành bất kỳ nhiệm vụ nào, Agent BẮT BUỘC phải chạy kiểm tra type check (`tsc --noEmit`), linter hoặc AST validation trên toàn bộ các tệp vừa chỉnh sửa.
  - Tuyệt đối không để sót biến chưa khai báo, lỗi cú pháp (syntax errors), gạch chân đỏ trong IDE, hoặc kiểu dữ liệu không khớp.
  - Phải xác nhận lệnh kiểm tra trả về exit code 0 (0 errors) trước khi bàn giao cho người dùng.
