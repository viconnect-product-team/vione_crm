# BỘ TEST CASES CHI TIẾT ỨNG DỤNG DOANH NHÂN CLB CEO 1983
**Dự án:** VIONE Ecosystem · **Phân hệ:** CEO 1983 Association Mobile App & Web CRM  
**Quy chuẩn kiểm thử:** Black-box & E2E Functional Testing · **Cập nhật:** Tháng 09/2026

---

## 1. TỔNG QUAN KIỂM THỬ
- **Tổng số ca kiểm thử:** 83 Test Cases
- **Ca kiểm thử chờ kiểm tra thủ công (Pending Manual Verification):** 83 / 83 [ ] (100%)
- **Ca kiểm thử đã nghiệm thu (Passed):** [ ] (Để trống cho Tester / Ban Nghiệm Thu đánh dấu thủ công)
- **Tiến độ hoàn thiện mã nguồn:** 100% (Toàn bộ 14 tính năng và bản sửa lỗi đã code hoàn tất và sẵn sàng kiểm thử)

> [!IMPORTANT]
> ### QUY CHUẨN KIỂM THỬ & NGHIỆM THU NGHIÊM NGẶT:
> 1. **TUYỆT ĐỐI KHÔNG TỰ ĐỘNG ĐÁNH DẤU "PASS":** Toàn bộ các ca kiểm thử trong tài liệu này đều để trống ô kiểm `[ ]` để Người dùng, QA và Ban Nghiệm Thu CLB tự tay thao tác kiểm thử trên thiết bị thật và đánh dấu đạt/không đạt.
> 2. **Kiểm thử trên thiết bị ngoại vi:** Đối với các tính năng cần phần cứng vật lý (Chạm thẻ NFC, Cuộc gọi WebRTC P2P giữa 2 máy thật, Webhook tài khoản ngân hàng thật), hệ thống đã hoàn thiện mã nguồn và sẵn sàng cho đợt kiểm thử sandbox/live.
> 3. **Toàn diện 14 tính năng nâng cấp mới:**
>    - Landing Auto-Reload & 4s Polling phê duyệt (`TC-LAND-002`)
>    - Bắt buộc đăng nhập với prefilled username, không bypass login (`TC-AUTH-006`)
>    - Đồng bộ Profile thực tế, loại bỏ mock cứng "Lê Hoàng Long" (`TC-PRF-005`)
>    - Khung ngắm Camera in-modal & Handshake kết nối 2 chiều (`TC-QR-003`, `TC-CONN-002`)
>    - Sàn Cơ hội B2B ảnh tải lên, tab cá nhân, sort mới nhất & ngày đăng (`TC-OPP-002`)
>    - Gian hàng sản phẩm 2 cột e-commerce, cách ly bookmark theo user, tab sản phẩm tôi đăng (`TC-PROD-002`, `TC-PROD-003`)
>    - Thẻ sự kiện Poster 2:3 với nhãn độ tuổi (16+, 18+, 13+) & Backdrop sân khấu (`TC-EVT-004`)
>    - Thứ tự khối Trang chủ: Sự kiện -> Cơ hội -> Sản phẩm (`TC-HOME-002`)
>    - Phân tách thông báo theo user, không spam sự kiện cũ, lời chào chính thức (`TC-NOTIF-002`)
>    - Chat realtime khử trùng lặp (deduplication), mobile (+) expander, popup call tương tác (`TC-MSG-008`, `TC-MSG-009`)
>    - Đồng bộ menu cá nhân chuẩn Image 3 & phím tắt (+) tạo nhanh Danh thiếp số (`TC-PRF-006`)
>    - Tab kép Tin tức CLB & Sự kiện Hiệp Hội (`TC-NEWS-002`)
>    - Đổi mật khẩu (/users/change-password), khóa nút Đăng xuất, vô hiệu hóa tài khoản (`TC-SEC-002`, `TC-SEC-003`)
>    - Phân quyền Sidebar CRM theo vai trò, ẩn "Quyền của tôi" & Sơ đồ rạp chiếu kéo thả ghế sân khấu (`TC-CRM-001`, `TC-CRM-002`)

---

## 2. BẢNG PHÂN BỔ TEST CASES THEO PHÂN HỆ

| Mã | Phân Hệ Chức Năng | Số Test Case | Chờ Kiểm Tra | Nghiệm Thu | Tiến Độ Mã Nguồn |
|---|---|:---:|:---:|:---:|:---:|
| **MOD-01** | Xác thực & Đăng nhập | 6 | 6 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-02** | Đăng Ký & Kích Hoạt Hội Viên | 3 | 3 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-03** | Thẻ Hội Viên Thông Minh | 4 | 4 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-04** | Chạm Thẻ NFC | 2 | 2 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-05** | Quét Mã QR & Kết Nối Realtime | 6 | 6 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-06** | Trang Cá Nhân & Đồng Bộ | 8 | 8 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-07** | Cơ Hội Giao Thương B2B | 3 | 3 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-08** | Gian Hàng Sản Phẩm | 4 | 4 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-09** | Sự Kiện & Check-in QR | 5 | 5 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-10** | Trang Chủ & Bố Cục | 2 | 2 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-11** | Thông Báo & Tin Tức Hệ Thống | 2 | 2 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-12** | Gắn Kết & Tin Nhắn | 10 | 10 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-13** | Tin Tức & Truyền Thông | 2 | 2 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-14** | Cài Đặt & Bảo Mật Hệ Thống | 3 | 3 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-15** | Danh Bạ & Quyền Riêng Tư | 5 | 5 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-16** | Hội Phí & VietQR | 5 | 5 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-17** | Quản Trị CRM & Sơ Đồ Khán Phòng | 6 | 6 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-18** | Hạ Tầng & DevOps HTTPS | 1 | 1 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-19** | Quản Trị Sự Kiện CRM | 1 | 1 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-20** | Biểu Quyết & Bầu Cử Đại Hội | 1 | 1 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-21** | Sự Kiện & Quay Số May Mắn | 1 | 1 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-22** | Sàn Thương Mại & Gian Hàng | 1 | 1 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-23** | Sàn Cơ Hội Giao Thương B2B | 1 | 1 [ ] | [ ] | **100% Sẵn sàng** |
| **MOD-24** | Ứng Dụng PWA & Mobile iOS | 1 | 1 [ ] | [ ] | **100% Sẵn sàng** |

---

## 3. BẢNG ĐẶC TẢ CHI TIẾT TỪNG CA KIỂM THỬ (TEST CASES)

### TC-AUTH-001: Đăng nhập bằng Số điện thoại hợp lệ
- **Phân hệ:** Xác thực & Đăng nhập | **Màn hình/Popup:** `Màn hình Đăng nhập (/association/login)`
- **Tiền điều kiện:** Tài khoản hội viên đã được kích hoạt trong database
- **Các bước thực hiện:**
  1. Truy cập /association/login
  2. Nhập SĐT 098.333.1983
  3. Nhập mật khẩu đúng
  4. Bấm "Đăng nhập"
- **Dữ liệu đầu vào:** `Phone: 0983331983, Pass: ******`
- **Kết quả mong đợi:** Đăng nhập thành công, lưu token vào localStorage, chuyển hướng sang /association/card hoặc /messages
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Hỗ trợ đăng nhập đa kênh. Sẵn sàng test trên cả trình duyệt Desktop và Mobile.

### TC-AUTH-002: Đăng nhập bằng Mã hội viên chính thức
- **Phân hệ:** Xác thực & Đăng nhập | **Màn hình/Popup:** `Màn hình Đăng nhập (/association/login)`
- **Tiền điều kiện:** Mã hội viên tồn tại (VD: M1983-007)
- **Các bước thực hiện:**
  1. Truy cập /association/login
  2. Nhập Mã M1983-007
  3. Nhập mật khẩu đúng
  4. Bấm "Đăng nhập"
- **Dữ liệu đầu vào:** `Code: M1983-007, Pass: ******`
- **Kết quả mong đợi:** Hệ thống tự động tra cứu mã hội viên sang SĐT tương ứng và đăng nhập thành công
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Logic tra cứu mã hội viên tự động. Sẵn sàng test.

### TC-AUTH-003: Popup Quên mật khẩu & Gửi OTP
- **Phân hệ:** Xác thực & Đăng nhập | **Màn hình/Popup:** `Popup Quên mật khẩu (/association/login)`
- **Tiền điều kiện:** Hội viên đã có số điện thoại đăng ký
- **Các bước thực hiện:**
  1. Bấm "Quên mật khẩu"
  2. Nhập SĐT
  3. Bấm "Gửi mã OTP"
  4. Nhập mã OTP nhận được
- **Dữ liệu đầu vào:** `Phone: 0983331983, OTP: 198300`
- **Kết quả mong đợi:** Popup xác thực OTP hiển thị, sau khi nhập đúng cho phép đặt lại mật khẩu mới
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Mã OTP giả lập dev test trơn tru; cần cấu hình SMS Brandname khi triển khai production.

### TC-AUTH-004: Đăng ký tài khoản hội viên & Form hồ sơ pháp nhân
- **Phân hệ:** Xác thực & Đăng nhập | **Màn hình/Popup:** `Màn hình Đăng ký (/association/register)`
- **Tiền điều kiện:** Khách hàng chưa có tài khoản trong CLB
- **Các bước thực hiện:**
  1. Mở /association/register
  2. Điền Họ tên, Tên công ty, Chức vụ, MST, SĐT
  3. Bấm "Gửi đơn gia nhập"
- **Dữ liệu đầu vào:** `Hồ sơ pháp nhân doanh nghiệp`
- **Kết quả mong đợi:** Tạo hồ sơ chờ duyệt (PENDING_APPROVAL), thông báo gửi về Ban Thư Ký
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Form validation đầy đủ, chống spam.

### TC-AUTH-005: Popup Đổi mật khẩu & Quản lý phiên thiết bị
- **Phân hệ:** Xác thực & Đăng nhập | **Màn hình/Popup:** `Popup Đổi mật khẩu (/association/settings)`
- **Tiền điều kiện:** Hội viên đã đăng nhập
- **Các bước thực hiện:**
  1. Mở Cài đặt
  2. Chọn Đổi mật khẩu
  3. Nhập mật khẩu cũ, mật khẩu mới (xác nhận)
  4. Bấm lưu
- **Dữ liệu đầu vào:** `Old pass, New pass`
- **Kết quả mong đợi:** Mật khẩu cập nhật mã hóa bcrypt, hiển thị thông báo thành công và hủy các phiên cũ nếu chọn
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Đã kết nối API /users/change-password.

### TC-AUTH-006: Bắt buộc đăng nhập sau khi duyệt hồ sơ (Prefilled Username, Không bypass login)
- **Phân hệ:** Xác thực & Đăng nhập | **Màn hình/Popup:** `Màn hình Đăng nhập (/association/login)`
- **Tiền điều kiện:** Hội viên đã được duyệt từ Landing Page hoặc CRM, chuyển hướng sang /association/login?username=...&registered=true
- **Các bước thực hiện:**
  1. Mở link chuyển hướng từ Landing sau khi duyệt
  2. Quan sát ô "Số điện thoại / Mã hội viên" đã được điền sẵn chính xác
  3. Quan sát thông báo hướng dẫn: "Hồ sơ của bạn đã được phê duyệt! Vui lòng nhập mật khẩu để vào App"
  4. Để trống mật khẩu và bấm "Đăng nhập" -> Kiểm tra bị chặn và báo lỗi
  5. Nhập đúng mật khẩu đã tạo lúc Onboarding
  6. Bấm "Đăng nhập"
- **Dữ liệu đầu vào:** `Query param: username=0983331983&registered=true, Password`
- **Kết quả mong đợi:** Tuyệt đối không bypass đăng nhập; ô username prefill chính xác; sau khi nhập đúng mật khẩu, lưu token session và chuyển hướng an toàn vào /association
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 2: Đảm bảo an toàn bảo mật danh tính, không tự động đăng nhập ngầm mà yêu cầu người dùng xác nhận mật khẩu.

### TC-LAND-001: Modal Đăng ký hội viên mới & Tra cứu trạng thái 3 cấp trên Landing Page
- **Phân hệ:** Đăng Ký & Kích Hoạt Hội Viên | **Màn hình/Popup:** `Modal Đăng ký & Tra cứu (/landing/ceo1983)`
- **Tiền điều kiện:** Người dùng truy cập trang Web Landing CEO 1983
- **Các bước thực hiện:**
  1. Mở trang Landing Page, bấm nút "Gia Nhập VIP"
  2. Điền form đăng ký và bấm "Xác Nhận Nộp Hồ Sơ VIP"
  3. Kiểm tra Modal không bị đóng, tự chuyển sang Tab "Trạng Thái & Kích Hoạt"
  4. Nhập SĐT vào ô tra cứu và bấm "Kiểm tra"
  5. Kiểm tra hiển thị chính xác trạng thái: Chờ duyệt / Đã duyệt / Cần bổ sung
- **Dữ liệu đầu vào:** `Phone: 0988888888, Form thông tin đăng ký`
- **Kết quả mong đợi:** Modal không đóng khi gửi đơn, tra cứu hiển thị đúng 3 trạng thái tương ứng với CRM
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Kiến trúc modal 2 tab giữ chân người dùng và theo dõi kết quả.

### TC-LAND-002: Tự động Polling 4s kiểm tra phê duyệt & Tự chuyển hướng đăng nhập
- **Phân hệ:** Đăng Ký & Kích Hoạt Hội Viên | **Màn hình/Popup:** `Modal Đăng ký & Tra cứu (/landing/ceo1983)`
- **Tiền điều kiện:** Hồ sơ ở trạng thái "Chờ duyệt", modal đang mở
- **Các bước thực hiện:**
  1. Nộp hồ sơ và đang ở màn hình "Chờ duyệt"
  2. Giữ nguyên modal mở không thao tác gì
  3. Quản trị viên duyệt hồ sơ trên CRM Backend
  4. Quan sát chu kỳ 4 giây của ứng dụng
  5. Kiểm tra ứng dụng tự động phát hiện trạng thái APPROVED
  6. Kiểm tra thông báo chuyển hướng hiển thị và tự điều hướng sang /association/login
- **Dữ liệu đầu vào:** `Polling interval 4000ms, API /connect-app/club-registration/status`
- **Kết quả mong đợi:** Không cần người dùng bấm F5 hay nút kiểm tra, hệ thống tự polling 4s nhận diện phê duyệt và tự chuyển hướng sang /association/login kèm prefilled username
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 1: Trải nghiệm onboarding liền mạch, tự động nhận diện phê duyệt thời gian thực.

### TC-ONB-001: Onboarding tạo tài khoản hội viên mới khi được duyệt trên Landing
- **Phân hệ:** Đăng Ký & Kích Hoạt Hội Viên | **Màn hình/Popup:** `Modal Trạng thái & Kích hoạt (/landing/ceo1983)`
- **Tiền điều kiện:** Hồ sơ đăng ký đã được Quản trị viên phê duyệt trên CRM
- **Các bước thực hiện:**
  1. Tra cứu SĐT đã duyệt trên Tab "Trạng Thái & Kích Hoạt"
  2. Giao diện Onboarding mở Form tạo tài khoản
  3. Nhập Mật khẩu mới và Xác nhận mật khẩu
  4. Bấm "Hoàn Tất & Vào App Hiệp Hội"
  5. Chuyển hướng sang màn hình Đăng nhập để xác thực phiên
- **Dữ liệu đầu vào:** `Username, Password, Confirm Password`
- **Kết quả mong đợi:** Đăng ký tài khoản thành công, liên kết mã hội viên và chuyển sang màn hình đăng nhập bảo mật
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Form tạo mật khẩu an toàn, đối soát khớp mật khẩu 2 lần.

### TC-CARD-001: Hiển thị Thẻ Hội Viên VIP & Dấu tích xanh
- **Phân hệ:** Thẻ Hội Viên Thông Minh | **Màn hình/Popup:** `Màn hình Thẻ (/association/card)`
- **Tiền điều kiện:** Hội viên chính thức của CLB CEO 1983
- **Các bước thực hiện:**
  1. Truy cập /association/card
  2. Quan sát giao diện thẻ điện tử
- **Dữ liệu đầu vào:** `Member profile token`
- **Kết quả mong đợi:** Hiển thị dải màu Gold/Navy sang trọng, dấu tích xanh chính thức, Avatar, Mã M1983-xxx và thời hạn thẻ
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Sẵn sàng test trên cả iOS Safari và Android Chrome.

### TC-CARD-002: Chuyển đổi 3 giao diện thẻ điện tử
- **Phân hệ:** Thẻ Hội Viên Thông Minh | **Màn hình/Popup:** `Màn hình Thẻ (/association/card)`
- **Tiền điều kiện:** Hội viên đã đăng nhập
- **Các bước thực hiện:**
  1. Bấm nút "Đổi phong cách thẻ"
  2. Chọn giữa: Classic Navy, Golden VIP, Modern Dark
- **Dữ liệu đầu vào:** `Theme option: golden / dark / navy`
- **Kết quả mong đợi:** Màu nền, dải bóng gradient và họa tiết thẻ chuyển đổi tức thì không bị giật lag
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Hiệu ứng chuyển đổi mượt mà.

### TC-CARD-003: Popup Sinh mã QR vCard & Lưu danh bạ
- **Phân hệ:** Thẻ Hội Viên Thông Minh | **Màn hình/Popup:** `Popup QR Code (/association/card)`
- **Tiền điều kiện:** Hồ sơ có SĐT và Email
- **Các bước thực hiện:**
  1. Bấm nút "Mã QR Chia sẻ"
  2. Mở Camera điện thoại quét mã QR
- **Dữ liệu đầu vào:** `vCard string chuẩn VCF 3.0`
- **Kết quả mong đợi:** Camera điện thoại nhận diện danh thiếp và hiện nút "Thêm vào danh bạ" chứa đầy đủ Họ tên, Công ty, Chức vụ, SĐT
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Chuẩn vCard tương thích danh bạ iOS Contacts và Google Contacts.

### TC-NFC-001: Popup Radar quét và mô phỏng Chạm NFC
- **Phân hệ:** Chạm Thẻ NFC | **Màn hình/Popup:** `Popup NFC Modal (/association/profile)`
- **Tiền điều kiện:** Trình duyệt có hỗ trợ Web NFC hoặc chạy giả lập
- **Các bước thực hiện:**
  1. Bấm nút "Chạm Thẻ NFC"
  2. Xem hiệu ứng sóng phát xạ radar
  3. Bấm "Mô Phỏng Chạm Kết Nối"
- **Dữ liệu đầu vào:** `NFC trigger click`
- **Kết quả mong đợi:** Popup hiển thị sóng phát xạ đẹp mắt, thông báo kết nối thành công và chuyển sang trang trao đổi danh thiếp
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Giao diện và API đọc/ghi Web NFC đã code hoàn thiện; sẵn sàng cho bước chạm thực tế thẻ vật lý NTAG213/215.

### TC-NFC-002: Ghi URL Danh thiếp vào phôi thẻ NFC
- **Phân hệ:** Chạm Thẻ NFC | **Màn hình/Popup:** `Popup Ghi thẻ NFC (/association/business-cards)`
- **Tiền điều kiện:** Thiết bị hỗ trợ ghi NDEF (Android Chrome)
- **Các bước thực hiện:**
  1. Mở chức năng Ghi thẻ NFC
  2. Đưa phôi thẻ sát mặt lưng điện thoại
  3. Bấm Ghi dữ liệu
- **Dữ liệu đầu vào:** `URL vCard: https://vione.vn/association/c/M1983-007`
- **Kết quả mong đợi:** Ghi bản ghi NDEF URI thành công, khóa quyền ghi đè nếu chọn
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Logic mã hóa NDEF Message đã sẵn sàng.

### TC-QR-001: Quét mã QR Hội viên phần cứng Native (Google Code Scanner)
- **Phân hệ:** Quét Mã QR & Kết Nối Realtime | **Màn hình/Popup:** `Modal Quét QR Hội Viên (AssociationMemberQrModal)`
- **Tiền điều kiện:** Đang mở Ứng dụng Hiệp Hội CLB CEO 1983
- **Các bước thực hiện:**
  1. Vào màn hình Thẻ hội viên hoặc Trang chủ, chọn chức năng "Mã QR Hội Viên"
  2. Chuyển sang tab "Quét QR"
  3. Hệ thống tự động kích hoạt máy quét camera phần cứng Google Code Scanner
  4. Hướng camera về phía mã QR hội viên CLB CEO 1983 hoặc thẻ vCard đối tác
  5. Máy quét tự động lấy nét, rung phản hồi và nhận diện dữ liệu QR
  6. Màn hình tự động hiển thị thẻ hồ sơ đối tác với đầy đủ avatar, họ tên, chức vụ, doanh nghiệp và các nút "Lưu kết nối", "Gọi điện", "Gửi email"
- **Dữ liệu đầu vào:** `Mã QR hội viên CEO 1983 hoặc mã QR vCard`
- **Kết quả mong đợi:** Camera mở tức thì, quét mã QR nhạy và nhận diện thông tin đối tác chính xác 100%
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Đã tích hợp máy quét native phần cứng Google Play Services.

### TC-QR-002: Căn giữa tuyệt đối Modal Quét QR trên di động (Grid Centering Safe-Area)
- **Phân hệ:** Quét Mã QR & Kết Nối Realtime | **Màn hình/Popup:** `Modal AssociationQrScanModal & AssociationMemberQrModal`
- **Tiền điều kiện:** Mở ứng dụng trên điện thoại di động các kích thước màn hình khác nhau (iPhone, Android)
- **Các bước thực hiện:**
  1. Tại Trang chủ hoặc Thẻ hội viên, bấm biểu tượng Quét QR hoặc Mã QR Thẻ
  2. Quan sát vị trí popup trên màn hình điện thoại dọc và ngang
  3. Kiểm tra popup có nằm chính giữa màn hình theo cả 2 trục ngang và dọc
  4. Kiểm tra popup không bị lệch lên trên, không bị tụt xuống dưới và không bị che khuất bởi tai thỏ / thanh điều hướng
- **Dữ liệu đầu vào:** `Kích thước viewport di động (390x844, 412x915, v.v.)`
- **Kết quả mong đợi:** Popup hiển thị căn giữa tuyệt đối 100% viewport (grid place-items-center, 100dvh, my-auto, max-h-[88dvh]), padding safe-area đầy đủ
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Đã chuẩn hóa CSS Grid và Safe Area Insets.

### TC-QR-003: Khung ngắm Camera in-modal & Gỡ bỏ hook native gây lỗi trên Home tab
- **Phân hệ:** Quét Mã QR & Kết Nối Realtime | **Màn hình/Popup:** `Modal AssociationMemberQrModal & MainActivity.java`
- **Tiền điều kiện:** Người dùng mở App Hiệp hội
- **Các bước thực hiện:**
  1. Mở Home tab -> Xác nhận máy quét Native không tự động bật chiếm quyền màn hình
  2. Bấm nút "Mã QR" -> Chọn tab "Quét QR"
  3. Quan sát video viewfinder camera HTML5 hiển thị ngay bên trong khung modal
  4. Kiểm tra camera lấy nét và đọc mã QR trực tiếp trong khung modal
- **Dữ liệu đầu vào:** `QR Camera feed`
- **Kết quả mong đợi:** Camera render mượt mà ngay trong khung modal (in-modal viewfinder); gỡ bỏ hoàn toàn interceptor text scanner hook native gây lỗi trên Trang chủ
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 4: Khắc phục triệt để lỗi giật màn hình và cướp quyền camera native trên Android.

### TC-CONN-001: Popup nhận yêu cầu kết nối tức thời (Realtime Incoming Connection Modal)
- **Phân hệ:** Quét Mã QR & Kết Nối Realtime | **Màn hình/Popup:** `Modal Toàn cục IncomingConnectionModal (/association/*)`
- **Tiền điều kiện:** Cả hai tài khoản đang trực tuyến trên ứng dụng Hiệp hội
- **Các bước thực hiện:**
  1. Tài khoản A gửi yêu cầu kết nối tới tài khoản B
  2. Trên màn hình của B lập tức bật Popup toàn màn hình qua WebSocket
  3. Popup hiển thị avatar và thông tin của A đã lọc theo quyền riêng tư của A
  4. Bấm thử nút "Để sau" để đóng an toàn
  5. Bấm nút "Chấp nhận ngay" để tạo kết nối và lưu danh bạ đối tác
- **Dữ liệu đầu vào:** `Sự kiện Socket.IO connection:requested`
- **Kết quả mong đợi:** Popup tự bật ngay lập tức khi có yêu cầu đến, xử lý chấp nhận/từ chối mượt mà
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Đồng bộ realtime qua WebSocket gateway.

### TC-CONN-002: Handshake 2 chiều: Tự đóng QR modal người quét & Bật popup đối tác
- **Phân hệ:** Quét Mã QR & Kết Nối Realtime | **Màn hình/Popup:** `AssociationMemberQrModal & IncomingConnectionModal`
- **Tiền điều kiện:** Tài khoản A quét mã QR của tài khoản B
- **Các bước thực hiện:**
  1. Tài khoản A quét mã QR của B thành công
  2. Thẻ thông tin của B hiện ra với nút "Lưu kết nối"
  3. Tài khoản A bấm "Lưu kết nối"
  4. Quan sát màn hình tài khoản A: Modal QR tự động đóng ngay lập tức
  5. Quan sát màn hình tài khoản B: Lập tức bật IncomingConnectionModal nhận kết nối từ A
- **Dữ liệu đầu vào:** `Event connection:requested & auto-close callback`
- **Kết quả mong đợi:** Modal QR tự động đóng trên thiết bị A sau khi lưu kết nối; thiết bị B nhận sự kiện realtime và bật popup kết nối kèm thông tin của A
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 4: Hoàn thiện luồng kết nối 2 chiều không để người quét phải bấm nút đóng thủ công.

### TC-PRF-001: Popup Cập nhật hồ sơ năng lực & Đổi ảnh bìa / avatar
- **Phân hệ:** Trang Cá Nhân & Đồng Bộ | **Màn hình/Popup:** `Trang cá nhân (/association/profile)`
- **Tiền điều kiện:** Đã đăng nhập
- **Các bước thực hiện:**
  1. Bấm nút sửa hồ sơ
  2. Tải ảnh đại diện hoặc ảnh bìa mới
  3. Cập nhật tiểu sử doanh nhân
  4. Bấm Lưu
- **Dữ liệu đầu vào:** `Image file & bio text`
- **Kết quả mong đợi:** Ảnh tải lên kho lưu trữ MinIO thành công, hồ sơ cập nhật tức thì trên trang cá nhân
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Hỗ trợ tải ảnh MinIO chuẩn định dạng.

### TC-PRF-002: Mở Modal Hướng dẫn sử dụng & Tải tài liệu Word/PDF
- **Phân hệ:** Trang Cá Nhân & Đồng Bộ | **Màn hình/Popup:** `Modal UserGuideModal (/association/profile)`
- **Tiền điều kiện:** Tại màn hình Trang cá nhân
- **Các bước thực hiện:**
  1. Bấm mục "Hướng dẫn sử dụng App Doanh Nhân"
  2. Xem các tab và ảnh minh họa demo
  3. Bấm "Tải Word" và "Tải PDF"
- **Dữ liệu đầu vào:** `User Guide modal click`
- **Kết quả mong đợi:** Modal mở lên mượt mà, đầy đủ các tab hướng dẫn kèm ảnh demo, bấm nút tải sẽ tải ngay file .docx và .pdf về máy
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Hỗ trợ tải trực tiếp tài liệu hướng dẫn.

### TC-PRF-003: Mở Modal Liên hệ Ban Thư Ký & Gửi form phản hồi
- **Phân hệ:** Trang Cá Nhân & Đồng Bộ | **Màn hình/Popup:** `Modal ContactSupportModal (/association/profile)`
- **Tiền điều kiện:** Tại màn hình Trang cá nhân
- **Các bước thực hiện:**
  1. Bấm mục "Liên hệ Ban Thư Ký CLB CEO 1983"
  2. Xem Hotline 098.333.1983, Tổng đài 1900.6883, Zalo OA
  3. Nhập nội dung cần hỗ trợ và bấm "Gửi yêu cầu"
- **Dữ liệu đầu vào:** `Feedback form data`
- **Kết quả mong đợi:** Hiển thị đầy đủ thông tin liên lạc chính thức, gửi yêu cầu thành công và hiện thông báo xác nhận
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tích hợp đầy đủ danh mục ban ngành.

### TC-PRF-004: Chuyển đổi Chế độ giao diện (Sáng / Tối / Tương phản) và Ngôn ngữ
- **Phân hệ:** Trang Cá Nhân & Đồng Bộ | **Màn hình/Popup:** `Trang cá nhân (/association/profile)`
- **Tiền điều kiện:** Đang mở app
- **Các bước thực hiện:**
  1. Chọn Chế độ Sáng / Tối / Tương phản
  2. Chọn ngôn ngữ Tiếng Việt / English
- **Dữ liệu đầu vào:** `Theme & Lang selection`
- **Kết quả mong đợi:** Toàn bộ màu sắc và văn bản chuyển đổi tức thì không cần tải lại trang
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** State reactivity tức thì.

### TC-PRF-005: Đồng bộ dữ liệu Profile thực tế giữa Home & Profile (Loại bỏ "Lê Hoàng Long")
- **Phân hệ:** Trang Cá Nhân & Đồng Bộ | **Màn hình/Popup:** `Trang chủ (/association) & Trang cá nhân (/association/profile)`
- **Tiền điều kiện:** Đăng nhập tài khoản hội viên bất kỳ (VD: Nguyễn Văn A)
- **Các bước thực hiện:**
  1. Quan sát Header Trang chủ: Kiểm tra họ tên, avatar và mã hội viên
  2. Chuyển sang Trang cá nhân: Kiểm tra thông tin hiển thị
  3. Cập nhật họ tên hoặc chức vụ trong Profile
  4. Quay lại Trang chủ: Kiểm tra dữ liệu cập nhật tức thời
- **Dữ liệu đầu vào:** `Hồ sơ hội viên đăng nhập thực tế`
- **Kết quả mong đợi:** Khớp 100% dữ liệu hội viên đang đăng nhập; loại bỏ hoàn toàn tên giả lập cứng "Lê Hoàng Long"; state reactive đồng bộ giữa Home và Profile
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 3: Triệt tiêu dữ liệu mock cứng, lấy nguồn chuẩn từ localStorage/API me.

### TC-PRF-006: Đồng bộ danh mục Profile chuẩn Image 3 & Phím tắt (+) tạo nhanh Danh thiếp số
- **Phân hệ:** Trang Cá Nhân & Đồng Bộ | **Màn hình/Popup:** `Trang cá nhân (/association/profile) & /association/business-cards`
- **Tiền điều kiện:** Tại Trang cá nhân
- **Các bước thực hiện:**
  1. Kiểm tra danh mục các dòng menu khớp với ảnh thiết kế Image 3
  2. Quan sát dòng "Quản lý Danh thiếp số" có nút (+) màu xanh nổi bật
  3. Bấm vào dòng "Quản lý Danh thiếp số" -> Mở trang danh sách thẻ
  4. Quay lại, bấm trực tiếp vào nút (+) -> Mở thẳng modal tạo danh thiếp mới
- **Dữ liệu đầu vào:** `Click action (+) trên dòng Quản lý danh thiếp`
- **Kết quả mong đợi:** Bấm vào dòng chuyển sang danh sách thẻ; bấm vào nút (+) mở trực tiếp form tạo mới danh thiếp (action=create)
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 11: Chuẩn hóa UX menu cá nhân theo bản vẽ tham chiếu.

### TC-B2B-001: Đăng tin Chào mua / Chào bán & Hợp tác đầu tư
- **Phân hệ:** Cơ Hội Giao Thương B2B | **Màn hình/Popup:** `Popup Tạo cơ hội B2B (/association/opportunities)`
- **Tiền điều kiện:** Hội viên chính thức
- **Các bước thực hiện:**
  1. Vào Cơ hội B2B
  2. Bấm "Đăng tin mới"
  3. Chọn loại tin (Chào mua/bán), nhập tiêu đề, nội dung, giá trị dự kiến
  4. Bấm Đăng
- **Dữ liệu đầu vào:** `B2B opportunity form data`
- **Kết quả mong đợi:** Tin được lưu vào hệ thống, hiển thị trên sàn giao thương B2B của CLB
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Đã đồng bộ trường dữ liệu với CRM Backend.

### TC-OPP-002: Hiển thị ảnh tự tải lên, tab "Cơ hội của tôi", sort mới nhất & Ngày đăng
- **Phân hệ:** Cơ Hội Giao Thương B2B | **Màn hình/Popup:** `Màn hình Cơ hội B2B (/association/opportunities)`
- **Tiền điều kiện:** Đã có các cơ hội được đăng
- **Các bước thực hiện:**
  1. Mở /association/opportunities
  2. Kiểm tra ảnh đại diện tin: Đúng ảnh người dùng tải lên
  3. Kiểm tra ngày đăng hiển thị rõ ràng trên từng thẻ cơ hội
  4. Bấm tab "Cơ hội của tôi": Chỉ hiển thị các tin do chính tài khoản này tạo
  5. Bấm tab "Tất cả": Tin mới đăng luôn hiển thị ở vị trí đầu tiên (sorted newest-first)
- **Dữ liệu đầu vào:** `Opportunity listing, My opportunities filter`
- **Kết quả mong đợi:** Hiển thị ảnh thực tế, lọc tab cá nhân chính xác, sắp xếp mới nhất lên đầu, hiển thị ngày đăng chi tiết
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 5: Sàn cơ hội B2B chuyên nghiệp, cá nhân hóa quản lý tin đăng.

### TC-B2B-002: Trưng bày sản phẩm & Chiết khấu nội bộ CLB
- **Phân hệ:** Gian Hàng Sản Phẩm | **Màn hình/Popup:** `Màn hình Sản phẩm (/association/products)`
- **Tiền điều kiện:** Doanh nghiệp có sản phẩm đăng ký
- **Các bước thực hiện:**
  1. Vào Gian hàng sản phẩm
  2. Xem danh mục, chiết khấu nội bộ và bấm "Liên hệ hợp tác"
- **Dữ liệu đầu vào:** `Product view & inquiry`
- **Kết quả mong đợi:** Hiển thị giá gốc, giá ưu đãi cho hội viên CEO 1983 và nút nhắn tin thẳng cho chủ doanh nghiệp
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Đồng bộ giá VIP hội viên.

### TC-PROD-002: Cách ly bookmark "Đã quan tâm" theo User & Tab "Sản phẩm tôi đăng"
- **Phân hệ:** Gian Hàng Sản Phẩm | **Màn hình/Popup:** `Màn hình Sản phẩm (/association/products)`
- **Tiền điều kiện:** Tài khoản mới tạo đăng nhập lần đầu
- **Các bước thực hiện:**
  1. Đăng nhập tài khoản mới tạo, vào /association/products
  2. Bấm tab "Đã quan tâm": Kiểm tra số lượng là 0 sản phẩm (trống)
  3. Bấm icon Trái tim trên 1 sản phẩm -> Số lượng quan tâm tăng lên 1
  4. Đăng nhập tài khoản khác -> Tab "Đã quan tâm" không bị dính sản phẩm của tài khoản trước
  5. Bấm tab "Sản phẩm tôi đăng" -> Xem danh sách sản phẩm do chính doanh nghiệp mình đăng tải
- **Dữ liệu đầu vào:** `vba_interested_products_${userId}`
- **Kết quả mong đợi:** Bookmark quan tâm được lưu độc lập theo từng userId, tài khoản mới luôn khởi tạo từ 0, tab sản phẩm tôi đăng hoạt động chuẩn xác
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 6: Khắc phục lỗi rò rỉ bookmark giữa các tài khoản.

### TC-PROD-003: Giao diện lưới 2 cột phong cách E-Commerce & Sắp xếp mới nhất
- **Phân hệ:** Gian Hàng Sản Phẩm | **Màn hình/Popup:** `Màn hình Sản phẩm (/association/products)`
- **Tiền điều kiện:** Danh sách sản phẩm phong phú
- **Các bước thực hiện:**
  1. Mở /association/products trên mobile hoặc desktop
  2. Quan sát lưới hiển thị: Dạng 2 cột (grid-cols-2) cân đối
  3. Kiểm tra cấu trúc thẻ: Ảnh tỉ lệ vuông, badge ưu đãi hội viên, tên sản phẩm, công ty, giá gốc gạch ngang, giá VIP màu hổ phách, huy hiệu ngày
  4. Đăng 1 sản phẩm mới -> Kiểm tra sản phẩm mới lập tức xuất hiện ở vị trí đầu tiên
- **Dữ liệu đầu vào:** `2-column grid layout, newest-first sorting`
- **Kết quả mong đợi:** Bố cục 2 cột chuẩn sàn thương mại điện tử hiện đại, phân cấp giá rõ nét, sản phẩm mới nhất luôn lên đầu trang
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 6: Redesign toàn diện UI gian hàng sản phẩm.

### TC-EVT-001: Đăng ký tham dự sự kiện & Nhận vé điện tử
- **Phân hệ:** Sự Kiện & Check-in QR | **Màn hình/Popup:** `Màn hình Sự kiện (/association/events)`
- **Tiền điều kiện:** Sự kiện đang mở đăng ký
- **Các bước thực hiện:**
  1. Chọn sự kiện "Diễn đàn Kinh tế CEO 1983"
  2. Bấm "Đăng ký tham dự"
- **Dữ liệu đầu vào:** `Event registration click`
- **Kết quả mong đợi:** Hệ thống xác nhận giữ chỗ, xuất vé điện tử kèm mã QR điểm danh
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Đã test luồng vé điện tử.

### TC-EVT-002: Check-in bằng mã QR tại cửa hội trường
- **Phân hệ:** Sự Kiện & Check-in QR | **Màn hình/Popup:** `Popup QR Scanner (/association/history)`
- **Tiền điều kiện:** Đã có vé mời sự kiện
- **Các bước thực hiện:**
  1. Mở màn hình Check-in
  2. Đưa mã QR vào máy quét của ban lễ tân
- **Dữ liệu đầu vào:** `QR token check-in payload`
- **Kết quả mong đợi:** Ghi nhận điểm danh thành công, xuất số bàn tiệc VIP và chào mừng lên màn hình LED
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tương thích máy quét ban tổ chức.

### TC-EVT-003: Biểu quyết trực tiếp & Bầu cử thời gian thực
- **Phân hệ:** Sự Kiện & Check-in QR | **Màn hình/Popup:** `Màn hình Biểu quyết (/association/voting)`
- **Tiền điều kiện:** Phiên biểu quyết đang hoạt động
- **Các bước thực hiện:**
  1. Vào mục Biểu quyết
  2. Chọn phương án "Đồng ý"
  3. Bấm "Gửi phiếu bầu"
- **Dữ liệu đầu vào:** `Voting option ID`
- **Kết quả mong đợi:** Phiếu bầu được mã hóa, gửi thành công, biểu đồ kết quả cập nhật số liệu trực tiếp
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Mã hóa phiếu bầu an toàn.

### TC-EVT-004: Thẻ sự kiện Poster 2:3 có nhãn độ tuổi (16+, 18+, 13+) & Backdrop /events
- **Phân hệ:** Sự Kiện & Check-in QR | **Màn hình/Popup:** `Trang chủ (/association) & Màn hình Sự kiện (/association/events)`
- **Tiền điều kiện:** Có sự kiện trên hệ thống
- **Các bước thực hiện:**
  1. Vào Trang chủ: Quan sát khối Sự kiện hiển thị dạng thẻ dọc tỉ lệ 2:3 phong cách poster giải trí
  2. Kiểm tra nhãn độ tuổi (16+, 18+, 13+) góc trên poster kèm đánh giá sao
  3. Chuyển sang /association/events: Quan sát phần Header trên cùng
  4. Kiểm tra Header backdrop với vệt sáng sân khấu, ánh sáng vàng kim và huy hiệu
- **Dữ liệu đầu vào:** `Poster 2:3, Age rating badges`
- **Kết quả mong đợi:** Thẻ sự kiện tỉ lệ poster 2:3 chuẩn điện ảnh/show giải trí, nhãn tuổi rõ nét; màn hình sự kiện có backdrop sân khấu sang trọng
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 7: Nâng cấp thẩm mỹ giao diện sự kiện theo bản vẽ tham chiếu Image 1.

### TC-HOME-001: Header chào đón hội viên & Thanh thao tác nhanh 4 nút
- **Phân hệ:** Trang Chủ & Bố Cục | **Màn hình/Popup:** `Trang chủ (/association)`
- **Tiền điều kiện:** Đã đăng nhập
- **Các bước thực hiện:**
  1. Vào Trang chủ
  2. Kiểm tra thông tin avatar, tên hội viên, mã M1983
  3. Kiểm tra 4 nút thao tác nhanh: Thẻ số, Quét QR, B2B, Hộp thư
- **Dữ liệu đầu vào:** `Home load`
- **Kết quả mong đợi:** Hiển thị đầy đủ thông tin định danh và 4 nút chức năng hoạt động nhạy
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Header tương tác thời gian thực.

### TC-HOME-002: Bố cục thứ tự Trang chủ: Sự kiện -> Cơ hội -> Sản phẩm
- **Phân hệ:** Trang Chủ & Bố Cục | **Màn hình/Popup:** `Trang chủ (/association)`
- **Tiền điều kiện:** Đang ở màn hình Trang chủ
- **Các bước thực hiện:**
  1. Mở /association và cuộn từ trên xuống dưới
  2. Xác nhận khối đầu tiên sau Banner là: "SỰ KIỆN NỔI BẬT" (dạng poster 2:3)
  3. Xác nhận khối tiếp theo ở giữa là: "CƠ HỘI GIAO THƯƠNG B2B" (dạng thẻ ngang middle banner)
  4. Xác nhận khối tiếp theo ở dưới là: "GIAN HÀNG SẢN PHẨM TIÊU BIỂU" (dạng lưới 2 cột e-commerce)
- **Dữ liệu đầu vào:** `Section order verification`
- **Kết quả mong đợi:** Thứ tự hiển thị tuân thủ nghiêm ngặt: Sự kiện (Events) -> Cơ hội (Opportunities) -> Sản phẩm (Products), đúng chuẩn chỉ đạo nghiệp vụ
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 8: Hoàn thiện luồng thị giác và ưu tiên hiển thị nội dung trên trang chủ.

### TC-NOTIF-001: Nhận thông báo nhắc nhở sự kiện và hoạt động CLB
- **Phân hệ:** Thông Báo & Tin Tức Hệ Thống | **Màn hình/Popup:** `Màn hình Thông báo (/association/notifications)`
- **Tiền điều kiện:** Có hoạt động mới trong CLB
- **Các bước thực hiện:**
  1. Mở trung tâm thông báo
  2. Xem danh sách thông báo và đánh dấu đã đọc
- **Dữ liệu đầu vào:** `Notification click`
- **Kết quả mong đợi:** Hiển thị danh sách thông báo theo thứ tự thời gian, đánh dấu đã đọc thành công
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Lưu trữ thông báo an toàn.

### TC-NOTIF-002: Cách ly thông báo theo User & Lời chào mừng chính thức CEO 1983
- **Phân hệ:** Thông Báo & Tin Tức Hệ Thống | **Màn hình/Popup:** `Màn hình Thông báo (/association/messages hoặc tab thông báo)`
- **Tiền điều kiện:** Tài khoản mới đăng nhập lần đầu
- **Các bước thực hiện:**
  1. Đăng nhập tài khoản mới
  2. Mở danh sách thông báo
  3. Xác nhận KHÔNG bị nhồi nhét các thông báo sự kiện/cơ hội cũ trước thời điểm tạo tài khoản
  4. Xác nhận có 1 thông báo chào mừng trang trọng từ Ban Quản Trị CLB Doanh Nhân CEO 1983
- **Dữ liệu đầu vào:** `userCreatedAt filter, welcome notification`
- **Kết quả mong đợi:** Thông báo lọc theo thời điểm tạo tài khoản, không bị spam dữ liệu rác, có thông báo chào mừng chính thức
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 9: Chuẩn hóa trải nghiệm người dùng mới, tránh ô nhiễm thông báo.

### TC-MSG-001: Hiển thị danh sách cuộc trò chuyện & Snippet tin nhắn mới nhất
- **Phân hệ:** Gắn Kết & Tin Nhắn | **Màn hình/Popup:** `Màn hình Hộp thư (/association/messages)`
- **Tiền điều kiện:** Có các cuộc trò chuyện trước đó
- **Các bước thực hiện:**
  1. Vào /association/messages
  2. Kiểm tra danh sách cuộc trò chuyện
  3. Kiểm tra snippet tin nhắn cuối cùng và thời gian
- **Dữ liệu đầu vào:** `Thread list query`
- **Kết quả mong đợi:** Hiển thị đúng tên người gửi, avatar, nội dung mới nhất, nhãn "HỆ THỐNG" (nếu có) và thời gian tương đối
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Đã tối ưu query tin nhắn.

### TC-MSG-002: Giao diện Chat chuẩn phong cách Messenger 100%
- **Phân hệ:** Gắn Kết & Tin Nhắn | **Màn hình/Popup:** `Màn hình Chat chi tiết (/association/messages?thread=xxx)`
- **Tiền điều kiện:** Cuộc trò chuyện đang mở
- **Các bước thực hiện:**
  1. Gửi tin nhắn mới
  2. Nhận tin nhắn từ đối tác
  3. Kiểm tra style bong bóng chat
- **Dữ liệu đầu vào:** `Tin nhắn văn bản`
- **Kết quả mong đợi:** Tin người gửi: Màu xanh Messenger (#0084FF), bo góc 16px, chữ trắng. Tin đối tác: Màu xám (#F0F2F5/#303030), có avatar 28px bên trái
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Giao diện chuẩn phong cách Facebook Messenger.

### TC-MSG-003: Thu hồi tin nhắn (Recall) & Nhảy top luồng chat ngay lập tức
- **Phân hệ:** Gắn Kết & Tin Nhắn | **Màn hình/Popup:** `Màn hình Chat & Danh sách Hộp thư`
- **Tiền điều kiện:** Tin nhắn do chính người dùng gửi
- **Các bước thực hiện:**
  1. Rê chuột hoặc chạm vào tin nhắn của mình
  2. Bấm nút dấu ba chấm (⋯)
  3. Chọn "Thu hồi tin nhắn"
  4. Quay lại danh sách tin nhắn ngoài
- **Dữ liệu đầu vào:** `Message retract action`
- **Kết quả mong đợi:** Bong bóng chat đổi thành viền nét đứt "Bạn đã thu hồi một tin nhắn". Ngoài danh sách, cuộc trò chuyện lập tức nhảy lên vị trí đầu tiên với snippet "Bạn đã thu hồi một tin nhắn"
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Hỗ trợ thu hồi realtime.

### TC-MSG-004: Thanh tương tác nhanh nằm ngang (Thả cảm xúc 😊 và Tùy chọn ⋯)
- **Phân hệ:** Gắn Kết & Tin Nhắn | **Màn hình/Popup:** `Màn hình Chat (/association/messages)`
- **Tiền điều kiện:** Có tin nhắn trên màn hình
- **Các bước thực hiện:**
  1. Rê chuột hoặc chạm vào bong bóng tin nhắn
  2. Bấm biểu tượng mặt cười (😊) -> Chọn ❤️
  3. Kiểm tra hiển thị reaction pill
- **Dữ liệu đầu vào:** `Emoji: ❤️, 👍, 😂, 😮, 😢, 😡`
- **Kết quả mong đợi:** Thanh công cụ xuất hiện nằm ngang cạnh bong bóng, thả cảm xúc gắn huy hiệu nhỏ dưới chân bong bóng chat
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Reaction bar mượt mà.

### TC-MSG-005: Gọi thoại & Gọi video WebRTC 1-1 / Nhóm
- **Phân hệ:** Gắn Kết & Tin Nhắn | **Màn hình/Popup:** `Popup Call WebRTC (/association/messages)`
- **Tiền điều kiện:** 2 hội viên đang online cùng lúc
- **Các bước thực hiện:**
  1. Bấm biểu tượng Điện thoại hoặc Camera tại đầu cuộc trò chuyện
  2. Chờ kết nối signaling WebSockets
  3. Thiết lập kết nối P2P Audio/Video
- **Dữ liệu đầu vào:** `WebRTC Offer / Answer / ICE Candidates`
- **Kết quả mong đợi:** Cửa sổ cuộc gọi hiện lên, stream video/audio giữa 2 bên, có nút bật/tắt mic, camera và kết thúc cuộc gọi
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Backend signaling gateway Socket.io và giao diện UI phòng gọi đã xong 100%; sẵn sàng kiểm thử P2P trên 2 thiết bị di động thật.

### TC-MSG-006: Tạo nhóm chat phong cách Messenger (CreateGroupChatModal)
- **Phân hệ:** Gắn Kết & Tin Nhắn | **Màn hình/Popup:** `Màn hình Hộp thư & Popup Tạo nhóm (/association/messages)`
- **Tiền điều kiện:** Người dùng đang ở mục Tin nhắn
- **Các bước thực hiện:**
  1. Bấm nút "Tạo nhóm" trên thanh hoạt động đầu trang hoặc nút "Tạo nhóm chat ngay" ở tab Nhóm
  2. Chọn Avatar/Emoji đại diện (👥, 🚀, 💼, 💎)
  3. Chọn tên gợi ý hoặc nhập tên nhóm
  4. Tìm kiếm và chọn thành viên (hiển thị carousel chip đã chọn, checkbox tròn tích xanh động)
  5. Bấm "Tạo nhóm (N)"
- **Dữ liệu đầu vào:** `GroupName, GroupAvatar, MemberIds[]`
- **Kết quả mong đợi:** Nhóm chat được tạo thành công, tự động mở thread nhóm với tin nhắn hệ thống [system] căn giữa, danh sách tin nhắn nhóm lưu trữ đồng bộ
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Trải nghiệm tạo nhóm giống Messenger, hỗ trợ carousel thành viên và gợi ý tên.

### TC-MSG-007: Quản lý thành viên nhóm & Xem hồ sơ thành viên (GroupMembersModal)
- **Phân hệ:** Gắn Kết & Tin Nhắn | **Màn hình/Popup:** `Thread Chat nhóm (/association/messages?thread=group_xxx)`
- **Tiền điều kiện:** Đang trong cuộc trò chuyện nhóm
- **Các bước thực hiện:**
  1. Quan sát Header hiển thị Avatar emoji nhóm, tên nhóm và số lượng thành viên
  2. Bấm nút "Thành viên" trên header hoặc bấm vào phụ đề tên nhóm
  3. Quan sát Popup danh sách thành viên nhóm
  4. Bấm vào một thành viên để xem Profile chi tiết
- **Dữ liệu đầu vào:** `Group peer data, member list`
- **Kết quả mong đợi:** Popup hiển thị danh sách toàn bộ thành viên trong nhóm kèm avatar, tên, chức danh; bấm vào thành viên mở ProfileModal; không hiển thị cảnh báo người lạ trong nhóm
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Roster sheet đầy đủ danh sách thành viên.

### TC-MSG-008: Khử trùng lặp tin nhắn (Deduplication), Socket Realtime & Xóa badge unread
- **Phân hệ:** Gắn Kết & Tin Nhắn | **Màn hình/Popup:** `Màn hình Chat (/association/messages)`
- **Tiền điều kiện:** Đang mở cuộc trò chuyện
- **Các bước thực hiện:**
  1. Mở cuộc trò chuyện có tin nhắn chưa đọc -> Quan sát badge số unread biến mất ngay lập tức
  2. Gửi tin nhắn liên tục -> Xác nhận tin nhắn hiển thị đúng 1 lần, không bị trùng lặp (deduplicated by signature + timestamp 15s)
  3. Đối tác gửi tin nhắn qua WebSocket -> Tin nhắn xuất hiện tức thời (member:message_received)
- **Dữ liệu đầu vào:** `Text signature deduplication, Socket events`
- **Kết quả mong đợi:** Không bao giờ bị trùng lặp tin nhắn; nhận tin nhắn realtime qua WebSocket; xóa badge tin chưa đọc tức thì khi mở thread
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 10: Xử lý triệt để bài toán đồng bộ tin nhắn realtime và tối ưu UX.

### TC-MSG-009: Thanh nhập tin nhắn Mobile với nút (+) mở rộng & Popup Call tương tác
- **Phân hệ:** Gắn Kết & Tin Nhắn | **Màn hình/Popup:** `Màn hình Chat (/association/messages?thread=xxx)`
- **Tiền điều kiện:** Xem trên màn hình điện thoại di động hẹp
- **Các bước thực hiện:**
  1. Quan sát thanh nhập tin nhắn dưới đáy màn hình điện thoại
  2. Kiểm tra chỉ có nút (+) mở rộng bên trái và nút Gửi bên phải, không bị tràn 3 nút inline
  3. Bấm nút (+) -> Menu mở lên với 3 tùy chọn: "Gửi hình ảnh", "Gửi tài liệu", "Chia sẻ vị trí"
  4. Bấm nút Gọi thoại/Video ở Header -> Hộp thoại gọi hiển thị tương tác đầy đủ các nút mic, camera, kết thúc
- **Dữ liệu đầu vào:** `Mobile input expander click`
- **Kết quả mong đợi:** Thanh nhập tin nhắn mobile gọn gàng, không tràn mép, menu (+) mở rộng tiện lợi, popup cuộc gọi phản hồi tương tác đầy đủ
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 10: Tối ưu hóa layout chat trên màn hình điện thoại.

### TC-NEWS-001: Đọc bản tin hoạt động CLB CEO 1983
- **Phân hệ:** Tin Tức & Truyền Thông | **Màn hình/Popup:** `Màn hình Tin tức (/association/news)`
- **Tiền điều kiện:** Có bài viết mới
- **Các bước thực hiện:**
  1. Mở /association/news
  2. Bấm vào bài viết để đọc chi tiết
- **Dữ liệu đầu vào:** `News article click`
- **Kết quả mong đợi:** Hiển thị bài viết chi tiết, hình ảnh chất lượng cao và ngày đăng
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Giao diện đọc báo mượt mà.

### TC-NEWS-002: Tab kép: [ Tin tức CLB ] & [ Sự kiện Hiệp Hội ] trong /association/news
- **Phân hệ:** Tin Tức & Truyền Thông | **Màn hình/Popup:** `Màn hình Tin tức (/association/news)`
- **Tiền điều kiện:** Tại màn hình Tin tức
- **Các bước thực hiện:**
  1. Mở /association/news
  2. Quan sát 2 tab trên cùng: [ 📰 Tin tức CLB ] và [ 📅 Sự kiện Hiệp Hội ]
  3. Mặc định ở Tab Tin tức: Đọc các bài báo hoạt động
  4. Chuyển sang Tab Sự kiện: Xem danh sách sự kiện kèm poster, địa điểm, thời gian
  5. Bấm "Xem chi tiết sự kiện" -> Điều hướng sang /association/events
- **Dữ liệu đầu vào:** `Tab toggle [news] vs [events]`
- **Kết quả mong đợi:** Chuyển đổi mượt mà giữa 2 tab tin tức và sự kiện hiệp hội, hiển thị poster và nút xem chi tiết tiện lợi
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 12: Tích hợp tab kép hỗ trợ hội viên nắm bắt nhanh cả tin tức lẫn lịch sự kiện.

### TC-SEC-001: Quản lý thông báo và cài đặt ứng dụng
- **Phân hệ:** Cài Đặt & Bảo Mật Hệ Thống | **Màn hình/Popup:** `Cài đặt (/association/settings)`
- **Tiền điều kiện:** Đã đăng nhập
- **Các bước thực hiện:**
  1. Vào Cài đặt
  2. Bật/tắt thông báo đẩy, âm thanh thông báo
- **Dữ liệu đầu vào:** `Toggle notification settings`
- **Kết quả mong đợi:** Lưu cài đặt thành công vào hệ thống
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Quản trị cài đặt cá nhân.

### TC-SEC-002: Đổi mật khẩu (/users/change-password) & Khóa nút "Đăng xuất" cho đến khi đổi pass
- **Phân hệ:** Cài Đặt & Bảo Mật Hệ Thống | **Màn hình/Popup:** `Màn hình Cài đặt Bảo mật (/association/settings)`
- **Tiền điều kiện:** Đang ở tab Bảo mật
- **Các bước thực hiện:**
  1. Mở /association/settings -> Chọn tab "Bảo mật"
  2. Kiểm tra không còn form tải ảnh đại diện trong tab bảo mật (đã chuyển về Profile)
  3. Quan sát nút "Đăng xuất": Đang bị làm mờ / vô hiệu hóa (disabled)
  4. Nhập Mật khẩu hiện tại, Mật khẩu mới và Xác nhận mật khẩu mới
  5. Bấm "Lưu mật khẩu mới" -> Hệ thống gọi API /users/change-password
  6. Sau khi cập nhật thành công: Nút "Đăng xuất" được kích hoạt và cho phép bấm
- **Dữ liệu đầu vào:** `Old pass, New pass, Confirm pass`
- **Kết quả mong đợi:** Mật khẩu cập nhật thành công qua endpoint /users/change-password; nút Đăng xuất bị khóa chặt cho đến khi đổi mật khẩu trong phiên làm việc
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 13: Đảm bảo hội viên hoàn tất cập nhật mật khẩu trước khi đăng xuất phiên.

### TC-SEC-003: Vô hiệu hóa tài khoản hội viên kèm xác nhận mật khẩu
- **Phân hệ:** Cài Đặt & Bảo Mật Hệ Thống | **Màn hình/Popup:** `Màn hình Cài đặt Bảo mật (/association/settings)`
- **Tiền điều kiện:** Hội viên muốn tạm khóa tài khoản
- **Các bước thực hiện:**
  1. Mở tab Bảo mật, cuộn xuống khu vực "Vùng nguy hiểm"
  2. Bấm "Vô hiệu hóa tài khoản"
  3. Modal xác nhận hiện ra, yêu cầu nhập mật khẩu bảo mật
  4. Nhập mật khẩu và bấm "Xác nhận vô hiệu hóa"
  5. Backend cập nhật user_profiles.account_status = deactivated
  6. Hệ thống tự động xóa phiên và đăng xuất an toàn về màn hình login
- **Dữ liệu đầu vào:** `Deactivation password confirmation`
- **Kết quả mong đợi:** Cập nhật trạng thái tài khoản sang deactivated, hủy phiên đăng nhập an toàn, tuân thủ tiêu chuẩn an toàn bảo mật
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 13: Bổ sung luồng vô hiệu hóa tài khoản hội viên chuẩn mực.

### TC-DIR-001: Tìm kiếm và lọc hội viên theo ngành nghề
- **Phân hệ:** Danh Bạ & Quyền Riêng Tư | **Màn hình/Popup:** `Màn hình Danh bạ (/association/members)`
- **Tiền điều kiện:** Dữ liệu danh bạ có sẵn trong hệ thống
- **Các bước thực hiện:**
  1. Nhập từ khóa vào ô tìm kiếm
  2. Chọn phân loại ngành hàng (BĐS, Xây dựng, Tài chính...)
- **Dữ liệu đầu vào:** `Search query: "Long" hoặc filter: "Bất động sản"`
- **Kết quả mong đợi:** Danh sách lọc đúng và tức thì theo thời gian thực
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Bộ lọc đa tiêu chí.

### TC-DIR-002: Popup Hồ sơ năng lực hội viên khi bấm vào Avatar
- **Phân hệ:** Danh Bạ & Quyền Riêng Tư | **Màn hình/Popup:** `Modal MemberProfileModal (/association/members, /messages)`
- **Tiền điều kiện:** Bấm vào Avatar bất kỳ
- **Các bước thực hiện:**
  1. Trong danh bạ hoặc trong màn hình chat, bấm vào Avatar hội viên
  2. Kiểm tra Modal xuất hiện
- **Dữ liệu đầu vào:** `Click avatar`
- **Kết quả mong đợi:** Popup hiển thị đầy đủ thông tin: Ảnh đại diện, Chức danh, Công ty, Mã hội viên, Nhu cầu kết nối và nút hành động
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Hiển thị đầy đủ năng lực hội viên.

### TC-DIR-003: Nút chuyển đổi trạng thái Kết nối <-> Hủy kết nối thông minh
- **Phân hệ:** Danh Bạ & Quyền Riêng Tư | **Màn hình/Popup:** `Modal MemberProfileModal`
- **Tiền điều kiện:** Hội viên đã có kết nối với đối tác
- **Các bước thực hiện:**
  1. Mở Modal của người đã kết nối -> Kiểm tra nút hiển thị "HỦY KẾT NỐI" (viền đỏ)
  2. Bấm "HỦY KẾT NỐI" -> Nút chuyển sang "KẾT NỐI NGAY" (màu xanh)
  3. Bấm "KẾT NỐI NGAY" -> Nút chuyển lại thành "HỦY KẾT NỐI"
- **Dữ liệu đầu vào:** `Toggle connection state`
- **Kết quả mong đợi:** Nút hành động tự động chuyển đổi thông minh, cập nhật localStorage vba.connected_members và gửi tín hiệu API
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Thao tác 1 chạm thuận tiện.

### TC-PRIV-001: Quét mã QR & Chạm thẻ NFC tuân thủ cài đặt quyền riêng tư đối tác
- **Phân hệ:** Danh Bạ & Quyền Riêng Tư | **Màn hình/Popup:** `Modal Quét QR/NFC (AssociationQrScanModal)`
- **Tiền điều kiện:** Tài khoản B đã cài đặt ẩn một số trường (SĐT, Email)
- **Các bước thực hiện:**
  1. Tài khoản A quét mã QR hoặc chạm thẻ NFC của Tài khoản B
  2. Hệ thống giải mã và mở Modal Hồ Sơ Đối Tác B
  3. Kiểm tra Avatar, Họ tên và Doanh nghiệp hiển thị đúng theo cấu hình B cho phép
  4. Kiểm tra các trường bị ẩn hiển thị nhãn "Đã ẩn theo cài đặt riêng tư"
  5. Các nút gọi điện hoặc gửi email bị vô hiệu hóa đối với trường bị ẩn
- **Dữ liệu đầu vào:** `Mã QR hoặc thẻ NFC của hội viên B`
- **Kết quả mong đợi:** Thông tin hiển thị chuẩn theo quyền riêng tư của đối tác, bảo mật tuyệt đối
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Bảo mật quyền riêng tư cá nhân.

### TC-FEE-001: Nhận thông báo nhắc đóng hội phí niên khóa trong tin nhắn
- **Phân hệ:** Hội Phí & VietQR | **Màn hình/Popup:** `Tin nhắn hệ thống (/association/messages)`
- **Tiền điều kiện:** Đến kỳ đóng hội phí
- **Các bước thực hiện:**
  1. Mở cuộc trò chuyện "Ban Thư Ký CLB"
  2. Xem hóa đơn nhắc nợ hội phí
- **Dữ liệu đầu vào:** `Fee notification payload`
- **Kết quả mong đợi:** Bong bóng tin nhắn hiển thị số tiền hội phí và nút "Thanh toán ngay qua VietQR"
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Hóa đơn nhắc nợ trực quan.

### TC-FEE-002: Sinh mã VietQR Napas 247 tự động số tiền và nội dung chuyển khoản
- **Phân hệ:** Hội Phí & VietQR | **Màn hình/Popup:** `Popup Thanh toán VietQR`
- **Tiền điều kiện:** Hội viên bấm nút Thanh toán
- **Các bước thực hiện:**
  1. Bấm "Thanh toán VietQR"
  2. Quan sát mã QR hiển thị
  3. Quét bằng ứng dụng ngân hàng bất kỳ
- **Dữ liệu đầu vào:** `Mã hội viên: M1983-007, Số tiền: 5.000.000 VNĐ`
- **Kết quả mong đợi:** App ngân hàng tự động điền: Số tài khoản CLB, Số tiền 5.000.000đ và Nội dung "CLB1983 M1983007"
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tương thích Napas 247 trên mọi app ngân hàng.

### TC-FEE-003: Webhook gạch nợ tự động qua tài khoản ngân hàng
- **Phân hệ:** Hội Phí & VietQR | **Màn hình/Popup:** `Lịch sử thanh toán & Trạng thái hội viên`
- **Tiền điều kiện:** Giao dịch chuyển khoản ngân hàng thành công
- **Các bước thực hiện:**
  1. Ngân hàng gọi webhook tới /api/webhooks/vietqr/payment
  2. Hệ thống kiểm tra số tiền và nội dung
  3. Gạch nợ hóa đơn và gia hạn thẻ 12 tháng
- **Dữ liệu đầu vào:** `Bank webhook payload`
- **Kết quả mong đợi:** Hệ thống tự động gạch nợ trong 5 giây, xuất hóa đơn VAT và gửi thông báo cảm ơn
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Logic webhook và gạch nợ backend đã code hoàn chỉnh; sẵn sàng kết nối webhook tài khoản ngân hàng chính thức.

### TC-CRM-001: Phân quyền Sidebar theo vai trò (Platform Admin vs Association Admin) & Ẩn "Quyền của tôi"
- **Phân hệ:** Quản Trị CRM & Sơ Đồ Khán Phòng | **Màn hình/Popup:** `Sidebar Quản trị CRM (/dashboard, /members, v.v.)`
- **Tiền điều kiện:** Đăng nhập với các tài khoản vai trò khác nhau
- **Các bước thực hiện:**
  1. Đăng nhập tài khoản Quản trị Hiệp hội (admin/association)
  2. Kiểm tra Sidebar: Xác nhận ĐÃ XÓA HOÀN TOÀN mục "Quyền của tôi"
  3. Kiểm tra Sidebar: Xác nhận KHÔNG HIỂN THỊ module "Quản trị nền tảng" (Platform Admin)
  4. Đăng nhập tài khoản Trưởng ban tài chính -> Kiểm tra chỉ hiển thị các module Tài chính/Hội phí
  5. Đăng nhập tài khoản Super Admin (platform_admin) -> Kiểm tra hiển thị đầy đủ mọi phân hệ
- **Dữ liệu đầu vào:** `Role switching: platform_admin vs admin vs truong_ban`
- **Kết quả mong đợi:** Sidebar lọc chính xác theo ma trận phân quyền, ẩn triệt để mục "Quyền của tôi" và các phân hệ vượt quyền
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 14: Phân quyền vai trò CRM chặt chẽ, tối ưu trải nghiệm quản trị.

### TC-CRM-002: Sơ đồ rạp chiếu CinemaSeatingMap: Kéo thả tọa độ ghế sân khấu & Thêm/Bớt/Căn đều
- **Phân hệ:** Quản Trị CRM & Sơ Đồ Khán Phòng | **Màn hình/Popup:** `Sơ đồ Khán phòng CinemaSeatingMap (/events/seating)`
- **Tiền điều kiện:** Tại màn hình quản lý sơ đồ chỗ ngồi sự kiện
- **Các bước thực hiện:**
  1. Mở sơ đồ Cinema Seating Map
  2. Quan sát khu vực Sân khấu (Stage) hình cánh cung với các ghế VIP/Diễn giả
  3. Dùng chuột/ngón tay bấm giữ một ghế sân khấu và kéo sang vị trí mới
  4. Thả chuột: Ghế cố định tại tọa độ mới mà không làm xô lệch các hàng ghế khán phòng
  5. Bấm nút "+ Thêm ghế" -> Ghế mới xuất hiện trên sân khấu
  6. Bấm nút "- Bớt ghế" -> Loại bỏ ghế dư thừa
  7. Bấm nút "Căn đều" -> Toàn bộ ghế tự động dàn trải đều theo vòng cung sân khấu
- **Dữ liệu đầu vào:** `Pointer drag events, Stage seat operations`
- **Kết quả mong đợi:** Kéo thả tọa độ ghế sân khấu mượt mà, thêm/bớt ghế linh hoạt, nút căn đều đưa ghế về vị trí phân bổ chuẩn xác
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 14: Tùy biến vị trí ghế sân khấu trực quan linh hoạt trên sơ đồ khán phòng.

### TC-PROD-004: Menu 3 chấm (...) Chỉnh sửa/Xóa & Upload ảnh thật bài đăng chính chủ
- **Phân hệ:** Gian Hàng Sản Phẩm | **Màn hình/Popup:** `Gian Hàng Sản Phẩm (/association/products)`
- **Tiền điều kiện:** Hội viên đã đăng ít nhất 1 sản phẩm của chính mình
- **Các bước thực hiện:**
  1. Mở /association/products
  2. Chọn tab "Sản phẩm tôi đăng" hoặc tìm sản phẩm của chính mình
  3. Quan sát góc trên bên phải ảnh/thẻ sản phẩm
  4. Bấm vào icon menu 3 chấm (...)
  5. Chọn "Chỉnh sửa" -> Modal mở ra, chọn ảnh từ máy qua input file, kiểm tra preview ảnh qua resolveMediaUrl
  6. Chọn "Xóa" -> Hộp thoại xác nhận hiển thị và xóa sản phẩm thành công
- **Dữ liệu đầu vào:** `Action click menu (...), File upload image/*, Confirm delete`
- **Kết quả mong đợi:** Menu 3 chấm hiển thị chuẩn ở góc trên phải, chỉ hiển thị cho bài đăng chính chủ; upload file ảnh thật hoạt động mượt mà và preview đúng URL; xóa sản phẩm cập nhật danh sách tức thì
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 128: Menu 3 chấm chuẩn UX, lọc song ngữ matchCategory, upload ảnh từ thiết bị.

### TC-OPP-003: Menu 3 chấm (...) Chỉnh sửa/Xóa bài đăng cơ hội chính chủ
- **Phân hệ:** Cơ Hội Giao Thương B2B | **Màn hình/Popup:** `Cơ Hội Giao Thương (/association/opportunities)`
- **Tiền điều kiện:** Hội viên đã đăng cơ hội giao thương của chính mình
- **Các bước thực hiện:**
  1. Mở /association/opportunities
  2. Tìm đến thẻ cơ hội do chính mình đăng
  3. Quan sát góc trên bên phải thẻ
  4. Bấm nút 3 chấm (...) -> Chọn "Chỉnh sửa" hoặc "Xóa"
  5. Kiểm tra chân thẻ không còn các nút inline thô
- **Dữ liệu đầu vào:** `Action click menu (...), Edit / Delete opportunity`
- **Kết quả mong đợi:** Menu 3 chấm hiển thị ở góc trên phải, hỗ trợ sửa và xóa cơ hội, chân thẻ gọn gàng không bị vỡ dòng
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 128: Tinh gọn thẻ cơ hội, đưa hành động vào dropdown 3 chấm.

### TC-EVT-005: Trang chủ hiển thị tối đa 5 sự kiện tỷ lệ ngang & Danh sách sự kiện tinh gọn overlay
- **Phân hệ:** Sự Kiện & Check-in QR | **Màn hình/Popup:** `Trang chủ (/association) & Danh sách sự kiện (/association/events)`
- **Tiền điều kiện:** Hệ thống có các sự kiện đang diễn ra hoặc sắp tới
- **Các bước thực hiện:**
  1. Mở Trang chủ /association -> Kiểm tra khối Sự kiện sắp tới hiển thị tối đa 5 sự kiện
  2. Quan sát tỷ lệ ảnh poster ngang aspect-[4/3] sm:aspect-[16/10]
  3. Kiểm tra nút "Xem tất cả" kèm icon ChevronRight (thay cho ••• cũ)
  4. Bấm vào để chuyển sang /association/events
  5. Kiểm tra danh sách sự kiện: Toàn bộ Tiêu đề, Countdown timer và nút "Xem chi tiết" nằm gọn gàng bên trong overlay chân poster, không có text rác bên ngoài
- **Dữ liệu đầu vào:** `Navigation /association -> /association/events`
- **Kết quả mong đợi:** Trang chủ hiển thị 5 sự kiện ngang chuẩn điện ảnh, nút Xem tất cả trang nhã; trang sự kiện tinh gọn 100% thông tin trong poster overlay
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 128: Chuẩn hóa thẩm mỹ sự kiện C-Level, tỷ lệ ngang điện ảnh.

### TC-AVT-001: Đồng bộ ảnh đại diện thời gian thực giữa Profile và Home qua Event Bus
- **Phân hệ:** Trang Cá Nhân & Đồng Bộ | **Màn hình/Popup:** `Trang Cá Nhân (/association/profile) & Trang Chủ (/association)`
- **Tiền điều kiện:** Hội viên đã đăng nhập và đang ở tab Profile
- **Các bước thực hiện:**
  1. Mở tab Cá nhân /association/profile
  2. Bấm đổi avatar và tải ảnh đại diện mới
  3. Chuyển ngay sang tab Trang chủ /association mà không reload trang
  4. Quan sát Avatar dập viền nổi trên thẻ VIP trang chủ và trên Header
- **Dữ liệu đầu vào:** `Upload avatar mới`
- **Kết quả mong đợi:** Ảnh đại diện trên Trang chủ và Header lập tức cập nhật ảnh mới đồng bộ 100% nhờ event bus vba_member_avatar_updated mà không cần F5
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 128: Cơ chế reactive event bus vba_member_avatar_updated tức thời.

### TC-PRF-007: Gỡ bỏ icon dấu cộng (+) thừa trên dòng "Quản lý Danh thiếp số"
- **Phân hệ:** Trang Cá Nhân & Đồng Bộ | **Màn hình/Popup:** `Trang Cá Nhân (/association/profile)`
- **Tiền điều kiện:** Đang ở tab Profile
- **Các bước thực hiện:**
  1. Mở /association/profile
  2. Cuộn đến dòng mục "Quản lý Danh thiếp số"
  3. Quan sát góc bên phải của dòng mục
- **Dữ liệu đầu vào:** `Visual inspect item "Quản lý Danh thiếp số"`
- **Kết quả mong đợi:** Dòng mục chỉ hiển thị mũi tên chevron điều hướng sang trang danh thiếp, ĐÃ GỠ BỎ HOÀN TOÀN nút dấu cộng (+) gây hiểu nhầm tạo thêm thẻ
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 128: Chuẩn hóa UX menu cá nhân theo yêu cầu khách hàng.

### TC-PRF-008: Căn giữa tuyệt đối Modal chi tiết hội viên MemberProfileModal trên Mobile
- **Phân hệ:** Danh Bạ & Quyền Riêng Tư | **Màn hình/Popup:** `Modal MemberProfileModal (/association/members)`
- **Tiền điều kiện:** Mở ứng dụng trên điện thoại di động hoặc Responsive Mode (375px - 414px)
- **Các bước thực hiện:**
  1. Mở danh bạ hội viên /association/members
  2. Bấm vào một hội viên bất kỳ để mở Modal chi tiết
  3. Quan sát vị trí hiển thị của hộp thoại modal trên màn hình điện thoại
- **Dữ liệu đầu vào:** `Mobile viewport, Open member profile modal`
- **Kết quả mong đợi:** Modal căn chính xác 100% ở giữa màn hình theo cả trục dọc và ngang, không bị lệch sát mép trên hoặc tràn viền đáy
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 128: Cấu trúc lưới fail-safe grid place-items-center w-full h-[100dvh] min-h-[100dvh] my-auto.

### TC-SCAN-003: Quét QR trực tiếp bằng HTML5 in-app scanner, loại bỏ Google Play Code Scanner native
- **Phân hệ:** Quét Mã QR & Kết Nối Realtime | **Màn hình/Popup:** `Modal Quét QR (/association/card & AssociationQrScanModal)`
- **Tiền điều kiện:** Thiết bị có camera (Android/iOS hoặc Web browser)
- **Các bước thực hiện:**
  1. Bấm mở modal Quét QR (hoặc tab Quét QR trong Thẻ hội viên)
  2. Cho phép quyền truy cập camera
  3. Quan sát khung ngắm camera WebRTC in-app hiển thị ngay lập tức
  4. Đưa mã QR vào khung ngắm để quét
- **Dữ liệu đầu vào:** `Camera stream, QR code scan`
- **Kết quả mong đợi:** Camera in-app bật tức thì mượt mà, nhận diện mã QR thành công, hoàn toàn không gọi AndroidNative.scanQr, không bị đơ/văng trên thiết bị thiếu Google Play Services
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 128: Gỡ bỏ hoàn toàn phụ thuộc Google Play Code Scanner, dùng 100% camera HTML5.

### TC-MSG-010: Xóa cuộc trò chuyện bền vững qua blacklist client-side & Xóa tin nhắn phía tôi trong localMessages
- **Phân hệ:** Gắn Kết & Tin Nhắn | **Màn hình/Popup:** `Màn hình Tin nhắn (/association/messages)`
- **Tiền điều kiện:** Có các cuộc trò chuyện và tin nhắn trong hộp thư
- **Các bước thực hiện:**
  1. Mở /association/messages
  2. Vuốt sang trái hoặc nhấn giữ vào một cuộc trò chuyện -> Chọn "Xóa cuộc trò chuyện"
  3. Xác nhận xóa -> Cuộc trò chuyện biến mất
  4. F5 hoặc tải lại trang -> Kiểm tra cuộc trò chuyện KHÔNG bị xuất hiện trở lại
  5. Mở một thread chat, nhấn giữ tin nhắn -> Chọn "Xóa ở phía tôi"
  6. Tin nhắn biến mất ngay lập tức và không còn trong localMessages
- **Dữ liệu đầu vào:** `Action delete conversation & delete message for me`
- **Kết quả mong đợi:** Cuộc trò chuyện bị xóa được lưu vào blacklist vba_deleted_convs và bị lọc vĩnh viễn; xóa tin nhắn phía tôi cập nhật triệt để cả UI và localStorage
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 128: Khắc phục lỗi hồi sinh cuộc trò chuyện sau khi tải lại trang.

### TC-CARD-004: Chuẩn hóa màu sắc Modal chụp danh thiếp Trắng & Xanh Navy #003B95 viền vàng & Toast thông báo
- **Phân hệ:** Thẻ Hội Viên Thông Minh | **Màn hình/Popup:** `Modal Chụp Danh Thiếp (AssociationCardCaptureModal) & Toast UI (sonner.tsx)`
- **Tiền điều kiện:** Tại màn hình quản lý danh thiếp số /association/business-cards
- **Các bước thực hiện:**
  1. Bấm nút "Chụp quét danh thiếp"
  2. Quan sát màu sắc nền và viền của Modal
  3. Thực hiện một hành động thành công bất kỳ (Lưu thẻ, copy mã, v.v.) để kích hoạt Toast thông báo
- **Dữ liệu đầu vào:** `Open Card Capture Modal, Trigger Toast`
- **Kết quả mong đợi:** Modal chuyển sang phong cách Trắng & Xanh Navy (#003B95) viền vàng kim Amber Gold sang trọng (loại bỏ màu tối #0C1322); Toast hiển thị chuẩn màu Navy & Gold
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 128: Chuẩn hóa nhận diện màu sắc C-Level CEO 1983.

### TC-CRM-003: Phân quyền Sidebar CRM ẩn các nhóm menu không có quyền (network, businessConnect, system)
- **Phân hệ:** Quản Trị CRM & Sơ Đồ Khán Phòng | **Màn hình/Popup:** `Sidebar Web CRM (/dashboard, /members, v.v.)`
- **Tiền điều kiện:** Đăng nhập với các tài khoản vai trò Trưởng ban hoặc nhân viên
- **Các bước thực hiện:**
  1. Đăng nhập tài khoản không có quyền Platform Admin / IT System
  2. Quan sát dải menu Sidebar bên trái
  3. Kiểm tra các nhóm menu: Mạng lưới (network), Business Connect và Hệ thống (system)
- **Dữ liệu đầu vào:** `Role-based access check on Sidebar`
- **Kết quả mong đợi:** Các nhóm menu và mục con vượt quyền bị ẩn hoàn toàn, chỉ hiển thị đúng các phân hệ được phân quyền
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 128: Tăng cường bảo mật phân quyền đa cấp trên Web CRM.

### TC-CRM-004: Tạo cơ hội giao thương CRM hỗ trợ upload ảnh từ máy & Đồng bộ trường ảnh
- **Phân hệ:** Quản Trị CRM & Sơ Đồ Khán Phòng | **Màn hình/Popup:** `Quản lý Cơ hội CRM (/opportunities)`
- **Tiền điều kiện:** Đang ở trang Quản lý Cơ hội CRM
- **Các bước thực hiện:**
  1. Mở /opportunities -> Bấm nút "Tạo cơ hội mới"
  2. Trong modal tạo cơ hội, quan sát mục Tải ảnh
  3. Chọn một file ảnh từ máy tính -> Xem trước ảnh hiển thị rõ nét
  4. Điền đầy đủ thông tin và bấm Lưu cơ hội
- **Dữ liệu đầu vào:** `File upload image, New opportunity form data`
- **Kết quả mong đợi:** Hệ thống hỗ trợ upload file ảnh thật, hiển thị preview ngay trong modal, lưu trữ và đồng bộ trường image/imageUrl lên hệ thống
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 128: Đồng bộ tính năng tải ảnh cơ hội giữa Web CRM và Mobile App.

### TC-CRM-005: Gửi nhắc phí hội viên CRM (kết nối handleRemind trên Card và Row)
- **Phân hệ:** Hội Phí & VietQR | **Màn hình/Popup:** `Quản lý Hội Phí CRM (/fees)`
- **Tiền điều kiện:** Có các hóa đơn hội phí chưa thanh toán (unpaid/pending)
- **Các bước thực hiện:**
  1. Mở /fees
  2. Chuyển sang dạng thẻ (Card view) hoặc dạng bảng (Table row view)
  3. Tìm hóa đơn chưa thanh toán -> Bấm nút "Nhắc phí"
  4. Quan sát phản hồi của hệ thống
- **Dữ liệu đầu vào:** `Click "Nhắc phí" button on Card / Row`
- **Kết quả mong đợi:** Hệ thống kích hoạt hàm handleRemind, hiển thị toast thông báo gửi lời nhắc thành công đến hội viên kèm tên và mã hội viên chính xác
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 128: Gắn kết nối sự kiện nhắc phí đồng bộ cả giao diện thẻ và bảng.

### TC-CRM-006: Khắc phục cột tài khoản bị để trống trong danh sách hội phí CRM
- **Phân hệ:** Hội Phí & VietQR | **Màn hình/Popup:** `Quản lý Hội Phí CRM (/fees)`
- **Tiền điều kiện:** Có danh sách hóa đơn hội phí từ backend
- **Các bước thực hiện:**
  1. Mở /fees
  2. Quan sát cột "Hội viên / Tài khoản" trong bảng danh sách
  3. Kiểm tra các dòng hóa đơn
- **Dữ liệu đầu vào:** `Table render on /fees`
- **Kết quả mong đợi:** Cột tài khoản hiển thị đầy đủ thông tin (Mã hội viên, Họ tên, SĐT), KHÔNG BỊ TRỐNG RỖNG nhờ logic fallback kép trong admin.service.ts
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 128: Fallback logic an toàn cho invoice member accounts và joins.

### TC-CRM-007: Lưu trữ trạng thái đóng phí Doanh nghiệp CRM vào Database & Toggle nhanh
- **Phân hệ:** Quản Trị CRM & Sơ Đồ Khán Phòng | **Màn hình/Popup:** `Quản lý Doanh Nghiệp CRM (/companies)`
- **Tiền điều kiện:** Đang ở trang Quản lý Doanh nghiệp CRM
- **Các bước thực hiện:**
  1. Mở /companies
  2. Quan sát cột "Hội phí" trong bảng và badge trạng thái trên thẻ doanh nghiệp
  3. Sử dụng bộ lọc "Hội phí" (Tất cả, Đã đóng phí, Chưa đóng phí)
  4. Bấm nút gạt / toggle trạng thái đóng phí trên một doanh nghiệp
  5. Tải lại trang để kiểm tra
- **Dữ liệu đầu vào:** `Toggle fee status, Filter by feePaid`
- **Kết quả mong đợi:** Trạng thái đóng phí feePaid và feeYear được lưu trực tiếp vào cơ sở dữ liệu PostgreSQL qua SQL UPDATE; toggle hoạt động mượt mà và bảo lưu sau khi F5
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 128: Quản lý hội phí doanh nghiệp đồng bộ 100% database.

### TC-CRM-008: Sơ đồ rạp chiếu CinemaSeatingMap mở rộng canvas h-[640px], clamp kéo ghế & Thêm hàng ghế dưới
- **Phân hệ:** Quản Trị CRM & Sơ Đồ Khán Phòng | **Màn hình/Popup:** `Sơ đồ Chỗ Ngồi CRM (/events/seating)`
- **Tiền điều kiện:** Mở sơ đồ CinemaSeatingMap dạng Tiệc (Banquet) và Rạp chiếu (Cinema)
- **Các bước thực hiện:**
  1. Mở /events/seating
  2. Chuyển sang chế độ Sơ đồ Tiệc (Banquet tables) -> Kiểm tra canvas mở rộng chiều cao h-[640px]
  3. Thử kéo bàn tiệc/ghế xuống sát đáy canvas -> Tọa độ được clamp an toàn tại tối đa 95%, không bị rơi mất
  4. Chuyển sang chế độ Sơ đồ Khán phòng (Cinema rows) -> Kiểm tra khoảng đệm đáy pb-16 min-h-[300px]
  5. Bấm nút "+ Thêm hàng ghế bên dưới" -> Hàng ghế mới được thêm vào đáy sơ đồ
- **Dữ liệu đầu vào:** `Drag banquet tables, Click "+ Thêm hàng ghế bên dưới"`
- **Kết quả mong đợi:** Canvas rộng rãi h-[640px], kéo thả không bao giờ bị văng khỏi vùng nhìn thấy, thêm hàng ghế bên dưới hoạt động trực quan chính xác
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tính năng Issue 128: Tối ưu trải nghiệm kéo thả sơ đồ rạp chiếu và bàn tiệc sự kiện.

### TC-REQ-001: Cấu hình SSL Nginx Reverse Proxy & Fast Deploy HTTPS (Ports 5443/5444)
- **Phân hệ:** Hạ Tầng & DevOps HTTPS | **Màn hình/Popup:** `Server Dev (14.225.217.232)`
- **Tiền điều kiện:** Nginx SSL Docker Compose và chứng chỉ SAN đã triển khai
- **Các bước thực hiện:**
  1. Chạy deploy/ssl/deploy-ssl.ps1 hoặc fast-deploy.ps1 -EnableHttps
  2. Mở trình duyệt truy cập https://14.225.217.232:5443 (Web CRM)
  3. Mở trình duyệt truy cập https://14.225.217.232:5444/association (App Hiệp hội)
  4. Kiểm tra giao thức bảo mật HTTPS và phản hồi API
- **Dữ liệu đầu vào:** `HTTPS Port 5443 / 5444, SSL SAN Cert`
- **Kết quả mong đợi:** Cả Web CRM và App Hiệp hội tải mượt mà qua HTTPS, chứng chỉ SAN bao quát IP và sslip.io, API NestJS kết nối ổn định
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Hỗ trợ cả HTTP và HTTPS thông qua Nginx Reverse Proxy an toàn.

### TC-REQ-002: Tạo Sự Kiện CRM & Tự Động Điền Bố Cục Text & Banner Riêng Theo Loại Sự Kiện
- **Phân hệ:** Quản Trị Sự Kiện CRM | **Màn hình/Popup:** `Tạo Sự Kiện CRM (/events/new, EventWizard)`
- **Tiền điều kiện:** Đăng nhập CRM bằng quyền Quản trị viên
- **Các bước thực hiện:**
  1. Mở /events/new -> Bước 1 "Thông tin cơ bản"
  2. Bấm chọn loại sự kiện "Diễn đàn" (Forum) -> Quan sát Tiêu đề, Tagline, Banner preview, Sức chứa tự động điền mẫu chuyên nghiệp
  3. Đổi sang loại "Workshop" -> Quan sát nội dung và banner đổi sang mẫu Workshop chuyên sâu
  4. Đổi sang loại "Kết nối" (Networking) -> Quan sát nội dung đổi sang Dạ tiệc Doanh nhân
  5. Đổi sang loại "Đào tạo" (Training) -> Quan sát nội dung đổi sang Masterclass Doanh trí
  6. Quan sát khung "Xem trước Banner & Bố cục Sự kiện"
- **Dữ liệu đầu vào:** `Chọn eventType trong EventWizard`
- **Kết quả mong đợi:** Tự động điền text nội dung, tagline, sức chứa, địa điểm và hiển thị banner preview riêng biệt khớp 100% từng loại sự kiện
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tối ưu trải nghiệm tạo sự kiện cho Admin CRM với bố cục banner động.

### TC-REQ-003: Tạo Biểu Quyết CRM tự động đẩy thông báo thời gian thực về App Hiệp Hội
- **Phân hệ:** Biểu Quyết & Bầu Cử Đại Hội | **Màn hình/Popup:** `Biểu Quyết CRM (/voting) & Thông Báo App (/association/notifications)`
- **Tiền điều kiện:** Admin tạo phiên biểu quyết mới trên CRM
- **Các bước thực hiện:**
  1. Trên Web CRM /voting, bấm "Tạo biểu quyết mới"
  2. Nhập tiêu đề, các phương án lựa chọn và lưu phiên
  3. Mở App Hiệp hội với tài khoản hội viên
  4. Quan sát chuông thông báo và danh sách thông báo
  5. Bấm vào thông báo biểu quyết có nút "Tham gia biểu quyết ngay"
- **Dữ liệu đầu vào:** `Tạo phiên voting trên CRM`
- **Kết quả mong đợi:** Thông báo đẩy tức thì về App Hiệp hội, hiển thị thẻ biểu quyết tương tác, bấm vào mở ngay modal bầu chọn trực tiếp
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Liên kết luồng realtime giữa Web CRM và App Hiệp hội.

### TC-REQ-004: Đăng ký vé sinh Số May Mắn ngẫu nhiên (#XXXX) & Quay thưởng Lucky Draw gửi thông báo chúc mừng
- **Phân hệ:** Sự Kiện & Quay Số May Mắn | **Màn hình/Popup:** `Đăng ký sự kiện App (/association/events) & Quay thưởng CRM (/voting)`
- **Tiền điều kiện:** Có sự kiện mở đăng ký vé
- **Các bước thực hiện:**
  1. Hội viên mở sự kiện trên App Hiệp hội -> Bấm "Đăng ký vé tham gia"
  2. Quan sát hộp thoại xác nhận: Hiển thị "Số may mắn của bạn: #XXXX"
  3. Mở tab Vé của tôi / Lịch sử check-in: Thẻ vé lưu trữ số may mắn định danh
  4. Trên CRM /voting -> Mở module "Quay số may mắn (Lucky Draw)"
  5. Chọn sự kiện và bấm "Bắt đầu quay số"
  6. Hệ thống quay ngẫu nhiên các số may mắn từ danh sách vé đã đăng ký và chọn người trúng
  7. Admin bấm "Gửi thông báo trúng" -> App của người trúng nhận thông báo Chúc mừng thẻ vàng
- **Dữ liệu đầu vào:** `Event registration, Lucky draw spin, Win notification`
- **Kết quả mong đợi:** Mỗi vé tự động sinh số ngẫu nhiên 4 chữ số; CRM quay số chính xác theo danh sách vé thực tế; người trúng nhận thông báo vinh danh tức thời
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Đã backfill số may mắn cho toàn bộ đăng ký cũ, hỗ trợ trọn vẹn chương trình gala sự kiện.

### TC-REQ-005: Sàn thương mại điện tử Luxury: Header tìm kiếm, menu danh mục, bộ lọc, đăng SP & 3 Section phân trang
- **Phân hệ:** Sàn Thương Mại & Gian Hàng | **Màn hình/Popup:** `Màn hình Sản phẩm (/association/products)`
- **Tiền điều kiện:** Đã đăng nhập App Hiệp hội
- **Các bước thực hiện:**
  1. Mở /association/products
  2. Quan sát Header: Icon Menu danh mục (LayoutGrid) bên trái, Thanh tìm kiếm ở giữa, Icon Bộ lọc và nút "Đăng SP" bên phải
  3. Bấm Icon Menu danh mục -> Menu trượt sổ xuống chọn nhanh ngành hàng
  4. Cuộn xuống quan sát 3 Section: 1) "Sản phẩm mới đăng", 2) "Sản phẩm được xem nhiều nhất", 3) "Doanh nghiệp nổi bật nhất"
  5. Thử bấm phân trang "Trang trước / Trang sau" ở từng Section
  6. Bấm "Xem gian hàng" ở Section 3 -> Mở Showroom giới thiệu doanh nghiệp và các sản phẩm niêm yết
- **Dữ liệu đầu vào:** `Category menu click, Search keyword, Pagination next/prev, View storefront`
- **Kết quả mong đợi:** Bố cục chuẩn sàn thương mại điện tử sang trọng; 3 section phân trang độc lập mượt mà; 1 hội viên đại diện cho 1 công ty có gian hàng riêng biệt
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Nâng cấp toàn diện thẩm mỹ và trải nghiệm thương mại B2B nội khối.

### TC-REQ-006: Bảng Tin Trao Cơ Hội: Phân Trang, Tăng Lượt Xem Realtime & Xem Danh Sách Người Quan Tâm Kèm Call/Email/Chat
- **Phân hệ:** Sàn Cơ Hội Giao Thương B2B | **Màn hình/Popup:** `Màn hình Trao Cơ Hội (/association/opportunities)`
- **Tiền điều kiện:** Có các bài đăng cơ hội giao thương trên hệ thống
- **Các bước thực hiện:**
  1. Mở /association/opportunities -> Quan sát giao diện dạng bảng tin chuyên nghiệp
  2. Bấm chuyển trang phân trang ở chân danh sách (5 bài / trang)
  3. Người dùng B bấm vào xem chi tiết bài đăng của Người dùng A -> Lượt xem tăng lên 1 (POST /opportunities/:id/view)
  4. Người dùng B bấm "Quan tâm"
  5. Người dùng A (chủ bài đăng) mở bài viết của mình -> Thấy khu vực "Hội viên đã quan tâm (X)"
  6. Người dùng A bấm nút Gọi điện (tel), Gửi email (mailto) hoặc Nhắn tin (chuyển sang /messages)
- **Dữ liệu đầu vào:** `Click view detail, Click interest, Owner views interested members list`
- **Kết quả mong đợi:** Bảng tin phân trang chuẩn mực; đếm lượt xem chuẩn xác khi xem chi tiết; chủ bài đăng nắm bắt đầy đủ thông tin đối tác quan tâm và liên hệ tức thời
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Tối đa hóa hiệu quả kết nối và xúc tiến hợp đồng giữa các hội viên.

### TC-REQ-007: Cài đặt PWA trên iPhone/iPad qua Safari Add to Home Screen & Chạy toàn màn hình Offline
- **Phân hệ:** Ứng Dụng PWA & Mobile iOS | **Màn hình/Popup:** `Trình duyệt Safari trên iOS & Trình duyệt Chrome trên Android`
- **Tiền điều kiện:** Mở đường dẫn /association trên thiết bị di động iOS Safari
- **Các bước thực hiện:**
  1. Mở Safari trên iPhone truy cập /association
  2. Quan sát thanh thông báo hướng dẫn cài đặt iOS (IosInstallPrompt) xuất hiện trang nhã ở đáy màn hình
  3. Làm theo hướng dẫn: Bấm nút Share (Chia sẻ) ở thanh điều hướng Safari
  4. Cuộn xuống chọn "Thêm vào MH chính" (Add to Home Screen)
  5. Nhấn "Thêm"
  6. Quay về màn hình chính iPhone -> Biểu tượng App CEO 1983 xuất hiện sắc nét
  7. Nhấn mở app từ màn hình chính -> Ứng dụng chạy toàn màn hình standalone, không có thanh URL Safari
- **Dữ liệu đầu vào:** `iOS Safari, Add to Home Screen, Standalone PWA launch`
- **Kết quả mong đợi:** Cài đặt thành công PWA trên iOS, icon chuẩn retina, mở app toàn màn hình mượt mà như ứng dụng Native, hỗ trợ bộ nhớ đệm qua Service Worker
- **Trạng thái kiểm thử:** [ ] Chờ kiểm tra
- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)
- **Ghi chú kỹ thuật & Hướng dẫn test:** Đáp ứng trọn vẹn nhu cầu gửi link cho người dùng iOS trải nghiệm ứng dụng hiệp hội.

