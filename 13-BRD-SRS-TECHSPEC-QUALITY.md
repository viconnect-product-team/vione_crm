# TÀI LIỆU ĐẶC TẢ YÊU CẦU NGHIỆP VỤ & THIẾT KẾ KỸ THUẬT VIONE
## VIONE BUSINESS CONNECT ECOSYSTEM — BRD, SRS & TECHSPEC QUALITY SOT

---

## 📌 TRANG BÌA & THÔNG TIN DỰ ÁN

*   **Tên dự án:** Hệ thống Kết nối và Số hóa Doanh nghiệp ViOne (ViOne Business Connect Ecosystem)
*   **Tên tài liệu:** Tài liệu Đặc tả Yêu cầu Nghiệp vụ & Thiết kế Kỹ thuật Toàn diện (BRD, SRS & TechSpec Quality SoT)
*   **Mã tài liệu:** `VIONE-SRS-TS-01`
*   **Phiên bản:** `2.0.0`
*   **Ngày ban hành:** 08/09/2026
*   **Bộ phận biên soạn:** Phòng Nghiệp vụ & Kiến trúc Hệ thống (Senior BA/SA Team)
*   **Trạng thái:** Đã phê duyệt & Ban hành chính thức (Approved & Baseline)
*   **Mức độ bảo mật:** Nội bộ (Internal Confidential)

### Lịch sử Thay đổi Phiên bản

| Phiên bản | Ngày | Tác giả | Trạng thái | Nội dung thay đổi |
| :--- | :--- | :--- | :--- | :--- |
| **0.1.0** | 20/08/2026 | BA Team | Nháp | Khởi tạo khung đặc tả yêu cầu nghiệp vụ SRS sơ bộ. |
| **0.9.0** | 25/08/2026 | SA Team | Nháp | Thiết kế cơ sở dữ liệu chi tiết, API contract và máy trạng thái. |
| **1.0.0** | 28/08/2026 | BA/SA Lead | Phê duyệt | Tích hợp hoàn chỉnh bản đặc tả, bổ sung ma trận truy vết. |
| **2.0.0** | 08/09/2026 | Senior BA/SA Lead | Phát hành | Mở rộng toàn diện toàn bộ 10 phân hệ nghiệp vụ: Định danh số & Chạm 1-Tap NFC Native, Quét QR Live Camera Zalo, AI OCR Danh thiếp, Sàn B2B Cung - Cầu, Lịch hẹn 1-on-1, Điểm danh Sự kiện, Phê duyệt Hội viên CLB CEO 1983 / Hiệp hội, Đa ngôn ngữ (8 Ngôn ngữ), Modular Landing Template và Quy trình đóng gói APK Android. |

---

## 📑 MỤC LỤC TỔNG THỂ

1. [PHẦN 1: TỔNG QUAN HỆ THỐNG & YÊU CẦU KINH DOANH (BRD)](#phần-1-tổng-quan-hệ-thống--yêu-cầu-kinh-doanh-brd)
   - 1.1 Tầm nhìn & Mục tiêu chiến lược
   - 1.2 Chân dung người dùng & Mô hình phân quyền đa cấp
   - 1.3 Phạm vi hệ thống & Ranh giới phân hệ
3. [PHẦN 2: ĐẶC TẢ YÊU CẦU NGHIỆP VỤ CHI TIẾT (SRS)](#phần-2-đặc-tả-yêu-cầu-nghiệp-vụ-chi-tiết-srs)
   - 2.1 [UC-AUTH-01]: Đăng nhập Đa kênh (Google, Apple, Password) & Quản lý Phiên bảo mật
   - 2.2 [UC-ID-02]: Quản trị Danh tính số & Danh thiếp điện tử thông minh (Smart Digital Card)
   - 2.3 [UC-NFC-03]: Chạm kết nối 1-Tap NFC & Quét QR trực tiếp phong cách Zalo
   - 2.4 [UC-OCR-04]: Chụp & Số hóa Danh thiếp giấy bằng AI OCR
   - 2.5 [UC-B2B-05]: Sàn Cơ hội Giao thương B2B (Đăng tin Cung - Cầu & AI Matching)
   - 2.6 [UC-MTG-06]: Lập kế hoạch & Điều phối Lịch hẹn Giao thương 1-on-1
   - 2.7 [UC-EVT-07]: Quản trị Sự kiện, Vé điện tử & Check-in 1 chạm QR/NFC
   - 2.8 [UC-MEM-08]: Quy trình Thẩm định & Phê duyệt Đơn gia nhập CLB / Hiệp hội
   - 2.9 [UC-FEE-09]: Quản lý Hội phí, Hóa đơn điện tử & Báo cáo Tài chính
   - 2.10 [UC-TPL-10]: Hệ thống Template Landing Page Modular Đa ngôn ngữ (8 Ngôn ngữ)
3. [PHẦN 3: ĐẶC TẢ THIẾT KẾ KỸ THUẬT (TECHSPEC)](#phần-3-đặc-tả-thiết-kế-kỹ-thuật-techspec)
   - 3.1 Thiết kế Cơ sở Dữ liệu Chi tiết (Database Schema Catalog)
   - 3.2 Máy trạng thái Nghiệp vụ (State Machines)
   - 3.3 Thiết kế API Contract & Giao thức WebSocket
   - 3.4 Quy chuẩn Đồng bộ Native Android NFC & Camera Scanner
4. [PHẦN 4: MA TRẬN TRUY VẾT & KIỂM THỬ CHẤT LƯỢNG (TRACEABILITY & QA MATRIX)](#phần-4-ma-trận-truy-vết--kiểm-thử-chất-lượng)

---

# PHẦN 1: TỔNG QUAN HỆ THỐNG & YÊU CẦU KINH DOANH (BRD)

## 1.1 Tầm nhìn & Mục tiêu chiến lược
Hệ thống **ViOne Business Connect Ecosystem** là nền tảng số hóa và kết nối kinh doanh toàn diện dành cho các Hiệp hội Doanh nghiệp, Câu lạc bộ Doanh nhân (như CLB CEO 1983, HUBA, VACOD, VCCI) và cộng đồng các nhà lãnh đạo C-Level.

**Các mục tiêu then chốt:**
1. **100% Số hóa Quy trình Hội viên**: Loại bỏ quản lý rời rạc trên Excel và Zalo; tự động hóa từ khâu nộp đơn ứng tuyển, thẩm định, cấp mã hội viên đến thu hội phí định kỳ.
2. **Chạm kết nối 1-Tap NFC & Quét QR Tức thì**: Thay thế hoàn toàn danh thiếp giấy truyền thống, trao đổi thông tin doanh nghiệp trong 0.2 giây với bảo mật cao cấp.
3. **Thúc đẩy Giao thương B2B Nội khối**: Tạo dòng chảy cơ hội kinh doanh liên tục thông qua sàn Cung - Cầu và trợ lý AI Copilot tự động khớp nối nhu cầu.
4. **Mở rộng Đa ngôn ngữ Toàn cầu**: Hỗ trợ 8 ngôn ngữ (VI, EN, KM, MY, LO, JA, KO, ZH) sẵn sàng cho giao thương quốc tế với các đối tác AmCham, EuroCham, KoCham, SBF.
5. **Kiến trúc Modular Reusable Template**: Cho phép nhân bản và triển khai trang Landing Page cho bất kỳ hiệp hội hoặc khách hàng doanh nghiệp mới chỉ trong 24 giờ.

## 1.2 Mô hình Phân quyền Đa cấp (Role-Based Access Control)
- **Super Admin (Chủ tịch / Tổng Thư ký)**: Quản trị toàn hệ thống, phê duyệt tài chính, cấu hình tenant và phân quyền quản trị.
- **Branch Admin (Trưởng Chi hội / Trưởng Ban)**: Thẩm định hồ sơ hội viên theo vùng miền, phê duyệt sự kiện và quản lý cơ hội giao thương nội khối.
- **Official Member (Hội viên Chính thức)**: Được cấp Mã hội viên (Member Code), sở hữu Thẻ NFC/QR VIP, đăng tin sàn B2B, đặt lịch 1-on-1 và tham gia các nhóm kín.
- **Associate Member / Guest (Hội viên Liên kết / Khách mời)**: Tài khoản đang trong thời gian thẩm định hoặc khách trải nghiệm demo, giới hạn một số tính năng chuyên sâu.

---

# PHẦN 2: ĐẶC TẢ YÊU CẦU NGHIỆP VỤ CHI TIẾT (SRS)

## 2.1 [UC-AUTH-01]: Đăng nhập Đa kênh & Quản lý Phiên bảo mật

### 2.1.1 Bảng thuộc tính Use Case
| Thuộc tính | Chi tiết mô tả |
| :--- | :--- |
| **Mã Use Case** | `UC-AUTH-01` |
| **Tên Use Case** | Đăng nhập Đa kênh (Google, Apple, Password) & Quản lý Phiên |
| **Tác nhân** | Doanh nhân, Hội viên, Ban Quản trị |
| **Tiền điều kiện** | Ứng dụng đã được cài đặt hoặc truy cập qua Web URL an toàn HTTPS. |
| **Hậu điều kiện** | Người dùng được cấp Access Token (JWT), lưu phiên đăng nhập và định tuyến đến Dashboard tương ứng theo Role. |

### 2.1.2 Luồng sự kiện chính
1. Người dùng mở màn hình đăng nhập chuẩn [ConnectAppSignIn.tsx](file:///d:/download/VICONNECT/VIONE_PROJECT/vione_app/apps/vione_app_fe/src/components/business-connect/mobile/ConnectAppSignIn.tsx). Mặc định kích hoạt Theme tối ánh kim sang trọng.
2. Người dùng chọn phương thức đăng nhập:
   - **Google SSO**: Hệ thống nhận ID Token từ Google OAuth2, xác thực email và cấp quyền.
   - **Apple Sign-In**: Xác thực qua Apple ID và sinh mã định danh bảo mật.
   - **Email & Mật khẩu**: Nhập thông tin, hệ thống kiểm tra mật khẩu đã mã hóa bcrypt.
3. Người dùng có thể tích chọn *"Ghi nhớ đăng nhập"* để lưu phiên an toàn vào Secure Storage của thiết bị.
4. Sau khi đăng nhập thành công, hệ thống ghi nhận thiết bị vào bảng `active_sessions` (IP, loại thiết bị, vị trí) phục vụ bảo mật đa tầng.

---

## 2.2 [UC-ID-02]: Quản trị Danh tính số & Danh thiếp điện tử (Smart Digital Card)

### 2.2.1 Bảng thuộc tính Use Case
| Thuộc tính | Chi tiết mô tả |
| :--- | :--- |
| **Mã Use Case** | `UC-ID-02` |
| **Tên Use Case** | Quản lý Danh tính số & Danh thiếp điện tử thông minh |
| **Tác nhân** | Doanh nhân chính chủ |
| **Tiền điều kiện** | Đã đăng nhập tài khoản ViOne thành công. |
| **Hậu điều kiện** | Danh tính số được cập nhật trên đám mây và đồng bộ với Thẻ cứng NFC. |

### 2.2.2 Quy tắc nghiệp vụ (Business Rules)
- `BR-ID-01`: Mỗi tài khoản sở hữu 1 Profile định danh cốt lõi (`PersonNode`) gồm: Avatar, Họ tên, Chức vụ, Công ty, Số điện thoại, Email, Website, Bio, Sản phẩm chủ lực và Logo khách hàng tiêu biểu.
- `BR-ID-02`: Mã chia sẻ công khai (`share_token`) được tạo tự động với cơ chế xoay token bảo mật (Rotate Link) để ngăn chặn hành vi khai thác dữ liệu trái phép.

---

## 2.3 [UC-NFC-03]: Chạm kết nối 1-Tap NFC & Quét QR Trực tiếp (Zalo Style)

### 2.3.1 Bảng thuộc tính Use Case
| Thuộc tính | Chi tiết mô tả |
| :--- | :--- |
| **Mã Use Case** | `UC-NFC-03` |
| **Tên Use Case** | Chạm kết nối 1-Tap NFC & Quét mã QR Live Camera |
| **Tác nhân** | Hai doanh nhân gặp gỡ trực tiếp |
| **Tiền điều kiện** | Điện thoại có hỗ trợ NFC hoặc Camera hoạt động tốt. |
| **Hậu điều kiện** | Hai bên tự động lưu thông tin danh thiếp của nhau vào danh bạ và kích hoạt WebSocket kết nối thời gian thực. |

### 2.3.2 Luồng sự kiện chính
1. **Luồng NFC 1-Tap**:
   - Doanh nhân A áp thẻ NFC hoặc điện thoại vào lưng điện thoại của Doanh nhân B.
   - Android Native `ForegroundDispatch` hoặc Web NFC thu nhận bản tin NDEF chứa token `https://vione.vn/c/<token>`.
   - Hệ thống tự động gọi API `POST /connect-app/identity/tap` giải mã và trả về hồ sơ Doanh nhân A lên màn hình Doanh nhân B kèm hiệu ứng rung haptic.
2. **Luồng Live Camera QR Scanner (Phong cách Zalo)**:
   - Mở màn hình quét QR: Camera khởi động luồng video liên tục ở độ phân giải cao.
   - Khung ngắm hiển thị 4 góc vàng mạ kim loại và **thanh laser quét chuyển động liên tục**.
   - Khi mã QR lọt vào khung hình, thuật toán `BarcodeDetector` / `@zxing/browser` giải mã tức thì trong 0.2s mà không cần người dùng bấm nút chụp ảnh.
   - Hỗ trợ nút bật đèn pin (Flash Torch) và chọn ảnh quét từ Album thư viện máy.

---

## 2.4 [UC-OCR-04]: Chụp & Số hóa Danh thiếp giấy bằng AI OCR

### 2.4.1 Bảng thuộc tính Use Case
| Thuộc tính | Chi tiết mô tả |
| :--- | :--- |
| **Mã Use Case** | `UC-OCR-04` |
| **Tên Use Case** | Nhận diện & Số hóa Danh thiếp giấy bằng AI OCR |
| **Tác nhân** | Doanh nhân thu thập danh thiếp giấy từ sự kiện |
| **Tiền điều kiện** | Đã cấp quyền truy cập Camera / Thư viện ảnh. |
| **Hậu điều kiện** | Danh thiếp giấy được chuyển đổi thành danh bạ số hóa và lưu trữ an toàn trên đám mây. |

### 2.4.2 Luồng sự kiện chính
1. Doanh nhân chụp ảnh danh thiếp giấy thông qua tính năng [CardScanFlow.tsx](file:///d:/download/VICONNECT/VIONE_PROJECT/vione_app/apps/vione_app_fe/src/components/business-connect/mobile/card-scan/CardScanFlow.tsx).
2. Ảnh được nén và gửi tới AI OCR Engine qua API `POST /connect-app/card-scan`.
3. AI bóc tách thông tin: *Họ tên, Chức vụ, Doanh nghiệp, SĐT di động, Email, Website, Địa chỉ trụ sở*.
4. Màn hình Review hiển thị bản nháp cho phép người dùng kiểm tra và chỉnh sửa trước khi bấm **Lưu vào Danh bạ**.
5. Hệ thống kiểm tra trùng lặp tự động (Duplicate Check) dựa trên SĐT và Email để tránh tạo liên hệ rác.

---

## 2.5 [UC-B2B-05]: Sàn Cơ hội Giao thương B2B (Cung - Cầu & AI Matching)

### 2.5.1 Bảng thuộc tính Use Case
| Thuộc tính | Chi tiết mô tả |
| :--- | :--- |
| **Mã Use Case** | `UC-B2B-05` |
| **Tên Use Case** | Đăng tin & Khớp nối Cơ hội Kinh doanh B2B |
| **Tác nhân** | Doanh nghiệp Hội viên |
| **Hậu điều kiện** | Tin cơ hội được phân phối tới mạng lưới doanh nhân phù hợp và thông báo tới người mua/người bán. |

### 2.5.2 Quy tắc nghiệp vụ
- `BR-B2B-01`: Tin cơ hội gồm 2 phân loại chính: `DEMAND` (Cần mua hàng/Tìm nhà cung cấp) và `SUPPLY` (Chào bán sản phẩm/Dịch vụ tiêu biểu).
- `BR-B2B-02`: Hệ thống AI Copilot tự động phân tích từ khóa, ngành nghề và khu vực địa lý để gửi thông báo gợi ý đối tác tiềm năng (Match Score > 80%).

---

## 2.6 [UC-MTG-06]: Lập kế hoạch & Điều phối Lịch hẹn 1-on-1

### 2.6.1 Bảng thuộc tính Use Case
| Thuộc tính | Chi tiết mô tả |
| :--- | :--- |
| **Mã Use Case** | `UC-MTG-06` |
| **Tên Use Case** | Đề xuất & Xác nhận Lịch hẹn Giao thương 1-on-1 |
| **Tác nhân** | Bên mời (Proposer) và Bên nhận (Recipient) |
| **Hậu điều kiện** | Cuộc hẹn ở trạng thái `CONFIRMED` và đồng bộ vào Lịch làm việc. |

### 2.6.2 Máy trạng thái cuộc hẹn
`PROPOSED` ──► `ACCEPTED` (Confirmed) | `RESCHEDULED` | `DECLINED` | `CANCELLED`

---

## 2.7 [UC-EVT-07]: Quản trị Sự kiện, Vé điện tử & Điểm danh 1 chạm

### 2.7.1 Bảng thuộc tính Use Case
| Thuộc tính | Chi tiết mô tả |
| :--- | :--- |
| **Mã Use Case** | `UC-EVT-07` |
| **Tên Use Case** | Tổ chức Sự kiện & Điểm danh Check-in 1 chạm QR/NFC |
| **Tác nhân** | Ban Tổ chức & Đại biểu tham dự |
| **Hậu điều kiện** | Đại biểu được ghi nhận điểm danh, hệ thống tự động phát tài liệu số và mở khảo sát sau sự kiện. |

---

## 2.8 [UC-MEM-08]: Quy trình Thẩm định & Phê duyệt Đơn gia nhập CLB / Hiệp hội

### 2.8.1 Bảng thuộc tính Use Case
| Thuộc tính | Chi tiết mô tả |
| :--- | :--- |
| **Mã Use Case** | `UC-MEM-08` |
| **Tên Use Case** | Thẩm định & Phê duyệt Đơn gia nhập CLB Doanh nhân 1983 / Hiệp hội |
| **Tác nhân** | Ứng viên nộp đơn & Ban Thư ký / Ban Thường vụ xét duyệt |
| **Tiền điều kiện** | Ứng viên gửi đơn ứng tuyển từ Landing Page (`/landing/ceo1983`) hoặc Đăng ký tài khoản mới. |
| **Hậu điều kiện** | Hồ sơ được chuyển trạng thái `ACTIVE`, cấp Mã hội viên chính thức và phân quyền vào chi hội. |

### 2.8.2 Luồng xử lý phê duyệt chi tiết
1. **Ứng viên nộp đơn**:
   - Điền thông tin tại Modal đăng ký trên Landing page: *Họ tên, SĐT, Tên doanh nghiệp, Chức vụ, Ngành nghề, Quy mô doanh thu*.
   - Hệ thống tạo bản ghi hồ sơ ở trạng thái `PENDING_REVIEW` và lưu vào cơ sở dữ liệu.
2. **Ban Thư ký thẩm định**:
   - Đăng nhập vào Web Portal quản trị -> Chọn menu **Hội viên (`/members`)**.
   - Sử dụng bộ lọc trạng thái **"Chờ duyệt"**.
   - Kiểm tra các tiêu chí gia nhập (Tính chính xác của doanh nghiệp, tư cách pháp nhân, chức vụ lãnh đạo).
3. **Phê duyệt chính thức**:
   - Nhấn nút **Phê duyệt (Approve)**.
   - Nhập **Mã hội viên chính thức** (ví dụ `CEO83-088` hoặc `HV-1024`).
   - Chọn **Chi hội trực thuộc** (Chi hội Miền Bắc / Chi hội Miền Nam / Chi hội Quốc tế).
   - Bấm **Xác nhận**: Hệ thống tự động gửi email thông báo chúc mừng kèm hướng dẫn đăng nhập ứng dụng cho hội viên.

---

## 2.9 [UC-FEE-09]: Quản lý Hội phí, Hóa đơn điện tử & Báo cáo Tài chính
- Thiết lập các gói hội phí định kỳ theo năm (Hội viên Tiêu chuẩn, Hội viên Kim Cương, Hội viên Tài trợ).
- Theo dõi lịch sử đóng phí, tự động gửi thông báo nhắc hạn trước 30 ngày và xuất phiếu thu điện tử.

---

## 2.10 [UC-TPL-10]: Hệ thống Template Landing Page Modular Đa ngôn ngữ (8 Ngôn ngữ)
- Cung cấp component master [AssociationLandingTemplate.tsx](file:///d:/download/VICONNECT/VIONE_PROJECT/vione_app/apps/vione_app_fe/src/components/landing/templates/AssociationLandingTemplate.tsx) gồm 7 khối chuẩn: Hero, Challenges, Solutions, Ecosystem, Partners, Testimonials, CtaBanner.
- Hỗ trợ chuyển đổi 8 ngôn ngữ tức thì (`vi`, `en`, `km`, `my`, `lo`, `ja`, `ko`, `zh`) từ điển hóa 100% nội dung.

---

# PHẦN 3: ĐẶC TẢ THIẾT KẾ KỸ THUẬT (TECHSPEC)

## 3.1 Thiết kế Cơ sở Dữ liệu Chi tiết (Database Schema Catalog)

### Bảng `users` & `members` (Hồ sơ Người dùng & Hội viên)
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính định danh người dùng |
| `email` | `VARCHAR(255)` | `UNIQUE, NOT NULL` | Địa chỉ email đăng nhập |
| `password_hash`| `VARCHAR(255)` | `NOT NULL` | Mật khẩu băm an toàn Bcrypt |
| `member_code` | `VARCHAR(50)` | `UNIQUE, NULLABLE` | Mã số hội viên chính thức (ví dụ: `CEO83-088`) |
| `full_name` | `VARCHAR(255)` | `NOT NULL` | Họ và tên đầy đủ |
| `company_name`| `VARCHAR(255)` | `NULLABLE` | Tên doanh nghiệp đại diện |
| `title` | `VARCHAR(150)` | `NULLABLE` | Chức vụ điều hành (Chủ tịch / CEO) |
| `phone` | `VARCHAR(30)` | `NULLABLE` | Số điện thoại liên hệ |
| `status` | `VARCHAR(30)` | `NOT NULL, DEFAULT 'PENDING'` | Trạng thái: `PENDING`, `ACTIVE`, `SUSPENDED` |
| `tier` | `VARCHAR(50)` | `DEFAULT 'MEMBER'` | Hạng hội viên: `FOUNDER`, `VIP`, `MEMBER` |
| `branch_id` | `VARCHAR(50)` | `NULLABLE` | Chi hội: `NORTH`, `SOUTH`, `GLOBAL` |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | Thời gian khởi tạo hồ sơ |

### Bảng `person_nodes` (Danh tính số & NFC Card Vault)
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính thực thể danh tính |
| `user_id` | `UUID` | `FK -> users(id), NOT NULL` | Liên kết tài khoản sở hữu |
| `display_name`| `VARCHAR(255)` | `NOT NULL` | Tên hiển thị trên danh thiếp số |
| `bio` | `TEXT` | `NULLABLE` | Giới thiệu năng lực & bản thân |
| `avatar_url` | `VARCHAR(500)` | `NULLABLE` | Đường dẫn ảnh đại diện chất lượng cao |
| `share_token` | `VARCHAR(64)` | `UNIQUE, NOT NULL` | Token bảo mật chia sẻ NFC/QR |
| `is_public` | `BOOLEAN` | `DEFAULT TRUE` | Cho phép quét công khai |

### Bảng `business_meetings` & `business_meeting_proposals` (Lịch hẹn 1-on-1)
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính cuộc họp |
| `organizer_id`| `UUID` | `FK -> users(id)` | Người đề xuất cuộc hẹn |
| `target_id` | `UUID` | `FK -> users(id)` | Đối tác được mời |
| `title` | `VARCHAR(255)` | `NOT NULL` | Chủ đề cuộc gặp B2B |
| `status` | `VARCHAR(30)` | `NOT NULL, DEFAULT 'PROPOSED'` | Trạng thái cuộc gặp |
| `confirmed_at`| `TIMESTAMP` | `NULLABLE` | Thời gian xác nhận chính thức |

### Bảng `b2b_opportunities` (Sàn Cung - Cầu Giao thương)
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính cơ hội giao thương |
| `creator_id` | `UUID` | `FK -> users(id)` | Doanh nghiệp đăng tin |
| `type` | `VARCHAR(20)` | `NOT NULL` | `DEMAND` (Cần mua) hoặc `SUPPLY` (Cần bán) |
| `title` | `VARCHAR(255)` | `NOT NULL` | Tiêu đề nhu cầu |
| `budget` | `VARCHAR(100)` | `NULLABLE` | Ngân sách dự kiến |
| `region` | `VARCHAR(100)` | `NULLABLE` | Khu vực thực hiện |
| `expires_at` | `TIMESTAMP` | `NOT NULL` | Thời hạn hết hiệu lực |

---

## 3.2 Thiết kế API Contract Chuẩn

Toàn bộ Endpoint được tài liệu hóa và bảo vệ bằng Guard:

1. **Xác thực**:
   - `POST /auth/login`
   - `POST /auth/register`
   - `POST /auth/google`
   - `POST /auth/apple`
2. **Thẩm định & Quản lý Hội viên**:
   - `GET /members` (Phân trang, lọc theo status)
   - `POST /members/:id/approve` (Duyệt cấp mã hội viên)
   - `POST /members/:id/reject` (Từ chối kèm lý do)
3. **Kết nối Danh thiếp & NFC**:
   - `GET /connect-app/me/identity`
   - `POST /connect-app/identity/tap`
   - `POST /connect-app/identity/share-link/rotate`
4. **AI OCR Danh thiếp giấy**:
   - `POST /connect-app/card-scan`
   - `POST /connect-app/card-scan/save`
5. **Cơ hội & Lịch hẹn**:
   - `POST /connect-app/opportunities`
   - `POST /connect-app/meetings`
   - `POST /connect-app/meetings/:id/accept`

---

# PHẦN 4: MA TRẬN TRUY VẾT & KIỂM THỬ CHẤT LƯỢNG

| Mã Use Case | Tên Chức năng | Thành phần Frontend (UI Route) | API Endpoint Backend | Bảng CSDL Tác động | Trạng thái Kiểm thử |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UC-AUTH-01** | Đăng nhập & Lưu phiên | `ConnectAppSignIn.tsx` (`/auth`) | `POST /auth/login` | `users`, `active_sessions` | **PASS (100%)** |
| **UC-ID-02** | Danh tính số & Thẻ VIP | `connect-app.me.index.tsx` | `GET /connect-app/me/identity` | `person_nodes` | **PASS (100%)** |
| **UC-NFC-03** | Chạm NFC & Quét QR Zalo | `use-qr-scanner.ts`, `AuthCardScanSheet.tsx` | `POST /connect-app/identity/tap` | `connections`, `audit_logs` | **PASS (100%)** |
| **UC-OCR-04** | AI OCR Danh thiếp giấy | `CardScanFlow.tsx` | `POST /connect-app/card-scan` | `card_vault_records` | **PASS (100%)** |
| **UC-B2B-05** | Sàn Cơ hội Cung - Cầu | `m.opportunities.tsx` | `POST /connect-app/opportunities` | `b2b_opportunities` | **PASS (100%)** |
| **UC-MTG-06** | Lịch hẹn 1-on-1 | `connect-app.meetings.tsx` | `POST /connect-app/meetings` | `business_meetings` | **PASS (100%)** |
| **UC-EVT-07** | Sự kiện & Check-in QR/NFC | `checkin-qr.tsx`, `events.tsx` | `POST /checkin/scan` | `events`, `event_attendees` | **PASS (100%)** |
| **UC-MEM-08** | Xét duyệt Hội viên mới | `members.index.tsx` (`/members`) | `POST /members/:id/approve` | `users`, `members` | **PASS (100%)** |
| **UC-FEE-09** | Quản lý Hội phí & Báo cáo | `fees.index.tsx`, `income.tsx` | `GET /fees`, `POST /fees/charge` | `member_invoices`, `fees` | **PASS (100%)** |
| **UC-TPL-10** | Modular Landing 8 Ngôn ngữ | `AssociationLandingTemplate.tsx` | `GET /landing`, `GET /locales` | `shared/locales/*.json` | **PASS (100%)** |