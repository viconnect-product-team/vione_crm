# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & THIẾT KẾ CƠ SỞ DỮ LIỆU

## ỨNG DỤNG MẠNG LƯỚI GIAO THƯƠNG VIONE CONNECT (BUSINESS CONNECT)

*Phiên bản: Version 3.0 - Bản Chuẩn Hoá Toàn Diện Master BA*

| Mục Quản Trị | Thông Tin Chi Tiết |

| --- | --- |

| Tên Ứng Dụng | ViOne Connect (Business Connect Mobile App & PWA) |

| Mã Tài Liệu | SRS-VIONE-CONNECT-V3.0 |

| Phiên Bản | Version 3.0 - Master BA Comprehensive Standard |

| Tác Giả & Thẩm Định | Master Business Analyst, Solution Architect & ViOne Ecosystem Core Team |

| Đối Tượng Sử Dụng | Chủ tịch, CEO Doanh nghiệp B2B, Giám đốc Kinh doanh (CCO), Đại diện Thương mại |

| Nền Tảng Triển Khai | PWA Mobile Web & Mobile App (Android APK, iOS qua Capacitor / React 19) |

| Phong Cách Thiết Kế | Trắng Titanium & Vàng Đồng Ánh Kim (Chuẩn Figma ViOne Gold White node-id=187-985) |

| Công Nghệ Cốt Lõi | Web NFC API, WebRTC, WebSocket, Thuật toán AI Matching Vector Cosine, PostgreSQL ACID |

## PHẦN 1: GIẢI THÍCH BÌNH DÂN CÁC KHÁI NIỆM KỸ THUẬT CỐT LÕI

> **HÌNH TƯỢNG VÍ VON ĐỜI THƯỜNG:**
> 1. Danh Thiếp Số 3D = Hồ sơ năng lực mạ vàng chạm NFC lưu danh bạ 1 giây.
> 2. Leads Hub = Sổ tay tự động lưu thông tin đối tác sau mỗi lần chạm thẻ.
> 3. AI Matchmaking = Trợ lý mai mối cung - cầu tính điểm phù hợp tự động.
> 4. Business Booking = Lên lịch hẹn bàn tròn 1-on-1 đồng bộ đa nền tảng.

## PHẦN 2: BẢN ĐỒ TÍNH NĂNG & MA TRẬN PHÂN QUYỀN SỬ DỤNG

| Phân Hệ Chức Năng | Chức Năng Con | Thao Tác Cụ Thể | Hội Viên Cá Nhân | Doanh Nghiệp (Admin) | Hệ Thống (Super Admin) |

| --- | --- | --- | --- | --- | --- |

| 1. Danh Thiếp Số 3D | Cấu hình giao diện thẻ 3D | Chọn theme, đổi màu ánh kim | Toàn quyền thẻ mình | Cấu hình template cty | Quản trị toàn bộ theme |

| 1. Danh Thiếp Số 3D | Gán mã chip NFC vật lý | Đọc / Ghi mã chip NFC | Toàn quyền thẻ mình | Cấp phát thẻ nhân viên | Quản lý kho chip NFC |

| 2. Khách Tiềm Năng | Xem danh sách Leads | Xem đối tác đã quét thẻ | Leads của cá nhân mình | Toàn bộ Leads của cty | Xem thống kê toàn hệ thống |

| 2. Khách Tiềm Năng | Chuyển đổi trạng thái Lead | Đánh dấu Liên hệ/Thành công | Toàn quyền leads mình | Toàn quyền | Không can thiệp |

| 3. AI Matchmaking | Đăng nhu cầu Cung / Cầu | Đăng bài tìm đối tác B2B | Toàn quyền đăng bài | Duyệt bài nhân viên | Kiểm duyệt bài vi phạm |

| 3. AI Matchmaking | Nhận đề xuất ghép cặp AI | Xem danh sách đối tác khớp | Toàn quyền nhận gợi ý | Xem gợi ý doanh nghiệp | Cấu hình trọng số AI |

| 4. Lịch Hẹn Gặp 1-1 | Đặt lịch hẹn bàn tròn | Gửi lời mời kèm ngày, giờ | Toàn quyền | Toàn quyền | Giám sát vận hành |

| 5. Nhắn Tin Giao Thương | Chat trực tiếp 1-1 | Gửi tin nhắn, danh thiếp số | Toàn quyền trao đổi | Toàn quyền trao đổi | Bảo mật E2E, không xem |

## PHẦN 4: KỊCH BẢN KIỂM THỬ NGHIỆM THU (VIONE CONNECT UAT)

| Mã Test Case | Tên Nghiệp Vụ | Thao Tác Thực Hiện | Kỳ Vọng Kỹ Thuật | Kỳ Vọng Giao Diện |

| --- | --- | --- | --- | --- |

| TC_VN_01 | Chạm thẻ NFC mở danh thiếp | Chạm thẻ vào điện thoại mở link public | connect_card_interactions tăng 1 bản ghi | Mở trang profile danh thiếp 3D lấp lánh ánh kim |

| TC_VN_02 | Lưu Khách Tiềm Năng | Khách điền: "Trần Văn Bình - 0912345678" | connect_leads lưu 1 dòng mới, status="new" | Doanh nhân nhận thông báo đẩy: Có 1 Lead mới |

| TC_VN_03 | AI Ghép Cặp Giao Thương | Đăng nhu cầu "Tìm đại lý vật liệu xây dựng" | AI quét connect_supplies, tính match_score > 85% | Mục Gợi ý hiện ngay 3 nhà máy cung ứng phù hợp nhất |

| TC_VN_04 | Đặt Lịch Hẹn Bàn 1-1 | Chọn giờ 14:00 ngày mai bấm Đặt lịch | connect_appointments lưu status="pending" | Cả 2 bên nhận được email và thông báo lịch hẹn |

