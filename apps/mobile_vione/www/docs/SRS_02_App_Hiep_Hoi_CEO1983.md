# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & THIẾT KẾ CƠ SỞ DỮ LIỆU

## ỨNG DỤNG DI ĐỘNG & PWA HIỆP HỘI CLB DOANH NHÂN CEO 1983

*Phiên bản: Version 3.0 - Bản Chuẩn Hoá Toàn Diện Master BA*

| Mục Quản Trị | Thông Tin Chi Tiết |

| --- | --- |

| Tên Ứng Dụng (Mobile Name) | CEO1983 (Chuẩn hóa viết liền không dấu cách, biểu tượng số 8 mạ vàng) |

| Mã Tài Liệu | SRS-CEO1983-APP-V3.0 |

| Phiên Bản | Version 3.0 - Master BA Comprehensive Specification (Quy chế phân quyền & luồng cuộc gặp) |

| Tác Giả & Thẩm Định | Master Business Analyst, Solution Architect & Ban Thư Ký CLB CEO 1983 |

| Đối Tượng Sử Dụng | Hội viên CLB Doanh Nhân CEO 1983, Ban Quản Trị, Ban Thành Viên, Ban Tài Chính, Ban Truyền Thông |

| Nền Tảng Triển Khai | PWA Mobile Web & Mobile App (Android APK, iOS qua Capacitor / React 19) |

| Phong Cách Thiết Kế | Executive Dark Gold & Champagne Luxury (Chuẩn màu Xanh Navy Hoàng Gia #003B95 & Vàng Ánh Kim #D97706) |

| Hệ Thống Tích Hợp | Web CRM CEO 1983, Cổng Thanh Toán VietQR Napas 24/7, Camera QR Scanner, Push Notification |

## PHẦN 1: GIẢI THÍCH BÌNH DÂN CÁC KHÁI NIỆM KỸ THUẬT CỐT LÕI

> **HÌNH TƯỢNG VÍ VON ĐỜI THƯỜNG:**
> 1. Luồng Cuộc Gặp = Thiệp mời hẹn bàn cà phê 1-on-1 giao thương tự động đồng bộ lịch.
> 2. Soát Vé QR = Mắt thần cổng tiệc chỉ mở cho nhân sự Ban Truyền Thông được BQT chỉ định.
> 3. Thẻ VIP NFC 3D = Danh thiếp mạ vàng chạm lưng điện thoại lưu danh bạ 1 giây.
> 4. Cuộc họp Offline = Hệ thống tự động bắn push và gửi tin nhắn địa chỉ ngày giờ đến hộp thư hội viên.

## PHẦN 2: BẢN ĐỒ 5 TAB CHỨC NĂNG & PHÂN QUYỀN TRÊN APP

| Tab Điều Hướng | Tên Chức Năng | Quyền Hiển Thị | Mô Tả Nghiệp Vụ |

| --- | --- | --- | --- |

| Tab 1: Trang Chủ | Home Dashboard & VIP Card | Tất cả (Nút Soát vé QR chỉ mở cho BTT) | Thẻ VIP 3D chạm NFC, sự kiện nổi bật, tiện ích Soát vé sự kiện (chỉ mở cho nhân sự BTT được gán), tin hoạt động CLB. |

| Tab 2: Sự Kiện | Events & QR Ticket Pass | Tất cả (Hội viên xem chung + đăng ký vé) | Lịch đại hội gala, sơ đồ khán phòng bàn VIP, danh sách nhà tài trợ & gói tài trợ, cuống vé điện tử QR cá nhân. |

| Tab 3: Thẻ 83 | Smart NFC Card & Business Identity | Tất cả (Thao tác thẻ cá nhân) | Trọng tâm thanh điều hướng: Mở danh thiếp số 3D, mã QR định danh cá nhân, chạm kết nối NFC, chia sẻ link hồ sơ. |

| Tab 4: Tin Nhắn | Messages, Meetings & 1-on-1 | Tất cả (Chat cá nhân + Xem họp) | Hộp thư doanh nhân 3 tabs (Tất cả, Bạn bè, Nhóm ban ngành), Luồng cuộc gặp hẹn bàn 1-on-1, Lịch cuộc họp Online/Offline. |

| Tab 5: Cá Nhân | Profile, Settings & Activity Log | Tất cả (Quản lý thông tin mình) | Chỉnh sửa hồ sơ CEO, quản lý doanh nghiệp, hóa đơn niên liễm VietQR, nhật ký hoạt động, bảo mật và đổi mật khẩu. |

## PHẦN 3: ĐẶC TẢ CHI TIẾT CÁC LUỒNG NGHIỆP VỤ TRỌNG TÂM
1. Luồng Cuộc Gặp: Hẹn bàn 1-on-1 giữa các hội viên kèm thời gian, địa điểm, mục tiêu và đồng bộ lịch.
2. Luồng Soát Vé QR: Chỉ mở cho Ban Truyền Thông được BQT chỉ định; gạch vé và tra cứu bàn VIP.
3. Luồng Cuộc Họp Offline: Tự động bắn thông báo và gửi tin nhắn địa chỉ, ngày giờ vào hộp thư hội viên.
4. Luồng Biểu Quyết: Hội viên bỏ phiếu biểu quyết, BQT tạo phiếu biểu quyết.

## PHẦN 4: MA TRẬN PHÂN QUYỀN CHỨC NĂNG TRÊN APP MOBILE

| Màn Hình / Tính Năng | Chức Năng Con | Quyền Của Hội Viên | Quyền Của Ban Quản Trị | Quyền Ban Truyền Thông |

| --- | --- | --- | --- | --- |

| 1. Trang Chủ (/association) | Thẻ VIP 3D & NFC | Toàn quyền thao tác thẻ mình | Toàn quyền | Toàn quyền |

| 1. Trang Chủ (/association) | Tiện ích Soát vé QR | ẨN HOÀN TOÀN (Không có quyền) | Toàn quyền truy cập | Hiện khi được BQT chỉ định |

| 2. Sự Kiện (/association/events) | Xem Danh sách Sự kiện | Xem đầy đủ | Toàn quyền quản trị | Xem & Quản trị truyền thông |

| 2. Sự Kiện (/association/events) | Xem Nhà tài trợ & Báo cáo | Chỉ Xem | Xem đầy đủ số liệu | Xem & Đăng tin |

| 2. Sự Kiện (/association/events) | Đăng ký vé sự kiện | Đăng ký vé của chính mình | Toàn quyền cấp vé | Toàn quyền |

| 3. Cuộc Gặp & Kết Nối | Lên lịch hẹn bàn 1-1 | Toàn quyền đặt hẹn và nhận hẹn | Toàn quyền | Toàn quyền |

| 4. Cuộc Họp CLB | Xem Lịch họp Online/Offline | Xem đầy đủ & Bấm xác nhận | Toàn quyền tạo/sửa/hủy | Xem lịch họp |

| 4. Cuộc Họp CLB | Tạo cuộc họp mới | KHÔNG CÓ QUYỀN (Ẩn nút) | Toàn quyền tạo & phát hành | Không có quyền |

| 5. Biểu Quyết CLB | Thực hiện bỏ phiếu | Được quyền bỏ phiếu 1 lần | Toàn quyền bỏ phiếu | Được quyền bỏ phiếu |

| 5. Biểu Quyết CLB | Tạo cuộc biểu quyết | KHÔNG CÓ QUYỀN (Ẩn nút) | Toàn quyền tạo câu hỏi | Không có quyền |

| 6. Danh Bạ Hội Viên | Xem danh bạ & doanh nghiệp | Xem 360° hồ sơ đối tác | Xem đầy đủ | Xem đầy đủ |

| 7. Cá Nhân & Hồ Sơ | Cập nhật ảnh bìa, avatar, bio | Toàn quyền sửa hồ sơ mình | Toàn quyền | Toàn quyền |

## PHẦN 6: KỊCH BẢN KIỂM THỬ NGHIỆM THU (APP MOBILE UAT)

| Mã Test Case | Tên Nghiệp Vụ | Thao Tác Thực Hiện | Kỳ Vọng Kỹ Thuật | Kỳ Vọng Giao Diện |

| --- | --- | --- | --- | --- |

| TC_APP_01 | Ẩn nút quét vé với Hội viên thường | Hội viên thường mở Trang chủ (/association) | canScanQR = false; DOM không render khối Soát vé sự kiện | Giao diện sạch sẽ, chỉ hiển thị Thẻ VIP 3D và Sự kiện nổi bật |

| TC_APP_02 | Hiện nút quét vé với BTT được chỉ định | Nhân sự BTT được gán quyền mở Trang chủ | canScanQR = true; DOM render khối Soát vé sự kiện | Hiển thị thẻ Soát vé kèm badge "Ban Truyền Thông" nổi bật |

| TC_APP_03 | Gửi lời mời hẹn bàn cuộc gặp 1-1 | Hội viên A bấm Hẹn gặp Hội viên B | POST /api/connections/meetings lưu bản ghi status = pending | Popup xác nhận đã gửi lời mời; hiển thị trong tab Đã gửi hẹn |

| TC_APP_04 | Nhận tin nhắn địa chỉ cuộc họp Offline | Admin ban hành cuộc họp Offline | Hệ thống push notif và ghi tin nhắn vào chat_messages | Hội viên nhận push và tin nhắn hiển thị đầy đủ địa chỉ, ngày giờ |

| TC_APP_05 | Hội viên thực hiện bỏ phiếu biểu quyết | Hội viên mở tab Biểu quyết -> Chọn phương án -> Bấm Xác nhận | POST /api/votes/:id/ballot ghi nhận lựa chọn; khóa bỏ phiếu lần 2 | Nút bấm chuyển sang trạng thái "Đã biểu quyết", xem tỷ lệ % |

| TC_APP_06 | Chạm thẻ NFC mở danh thiếp số 3D | Chạm lưng thẻ vào điện thoại đối tác | Đọc NDEF URL chuyển hướng đến /card/:slug | Điện thoại đối tác bật màn hình Danh thiếp số mạ vàng có nút Lưu VCF |

