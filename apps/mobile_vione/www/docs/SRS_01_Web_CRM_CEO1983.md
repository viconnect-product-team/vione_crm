# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & THIẾT KẾ CƠ SỞ DỮ LIỆU

## CỔNG QUẢN TRỊ TRUNG TÂM CLB DOANH NHÂN CEO 1983 (WEB CRM & PORTAL)

*Phiên bản: Version 3.0 - Bản Chuẩn Hoá Toàn Diện Master BA*

| Mục Quản Trị | Thông Tin Chi Tiết |

| --- | --- |

| Tên Dự Án / Phân Hệ | Cổng Quản Trị Trung Tâm CLB Doanh Nhân CEO 1983 (Web Admin CRM & Business Portal) |

| Mã Tài Liệu | SRS-CEO1983-CRM-V3.0 |

| Phiên Bản | Version 3.0 - Master BA Comprehensive Specification (Chuẩn hóa quy chế phân quyền) |

| Tác Giả & Thẩm Định | Master Business Analyst, Solution Architect & Ban Thư Ký CLB CEO 1983 |

| Đối Tượng Sử Dụng | Super Admin, Ban Quản Trị (BQT), Ban Thành Viên, Ban Tài Chính, Ban Truyền Thông, Hội Viên |

| Nền Tảng Triển Khai | Web Application (React 19, TypeScript, Vite, TanStack Router, Nitro SSR Engine) |

| Hệ Quản Trị CSDL | PostgreSQL (Mô hình Quan Hệ RDBMS chuẩn ACID, Schema: public, Khóa ngoại toàn vẹn dữ liệu) |

| Phạm Vi Tích Hợp | Web Landing Page, App Hiệp Hội CEO 1983 Mobile, App ViOne Connect, Mail Server, VietQR Napas 24/7 |

## PHẦN 1: GIẢI THÍCH BÌNH DÂN CÁC KHÁI NIỆM KỸ THUẬT CỐT LÕI

> **HÌNH TƯỢNG VÍ VON ĐỜI THƯỜNG:**
> 1. Database = Phòng hồ sơ trung tâm.
> 2. Table = Ngăn tủ chuyên biệt (hội viên, sự kiện, vé, cuộc họp, hóa đơn, tin nhắn).
> 3. Primary Key (PK) = Số CCCD duy nhất không trùng lặp.
> 4. Foreign Key (FK) = Dòng ghi chú liên kết (cuống vé này của ai, cuộc họp này do ai chủ trì).
> 5. RBAC = Thẻ từ mở cửa từng phòng chuyên môn theo chức vụ.
> 6. Phép JOIN = Thư ký lấy kẹp ghim kẹp tờ cuống vé với sơ yếu lý lịch để có báo cáo đầy đủ.

## PHẦN 2: QUY CHẾ PHÂN QUYỀN HỆ THỐNG (RBAC - 6 VAI TRÒ)

| Vai Trò (Role Code) | Tên Vai Trò Thực Tế | Phạm Vi Quyền Hạn | Trách Nhiệm Nghiệp Vụ |

| --- | --- | --- | --- |

| ADMIN | Quản Trị Viên Kỹ Thuật (Super Admin) | Full Quyền (Toàn quyền hệ thống) | Quản lý tài khoản, cấu hình tham số, phân quyền nhân sự, giám sát log an ninh CSDL. |

| BAN_QUAN_TRI | Ban Quản Trị CLB (Chủ Tịch, Phó Chủ Tịch) | Full Quyền Quản Trị Hiệp Hội | Phê duyệt hội viên mới, tạo cuộc họp, chỉ định nhân sự soát vé, xem toàn bộ báo cáo tài chính & truyền thông. |

| BAN_THANH_VIEN | Ban Thành Viên (Ban Hội Viên) | Quản Trị Hồ Sơ & Gia Hạn Hội Viên | Thẩm định hồ sơ kết nạp, thực hiện gia hạn niên liễm, theo dõi biến động hội viên, quản lý quyền lợi. |

| BAN_TAI_CHINH | Ban Tài Chính & Kế Toán CLB | Quản Trị Dòng Tiền & Thu Chi | Xem và thao tác phân hệ Tài chính, theo dõi hóa đơn hội phí VietQR, báo cáo tài trợ, lập quỹ hiệp hội. |

| BAN_TRUYEN_THONG | Ban Truyền Thông & Sự Kiện | Quản Trị Tin Tức & Soát Vé QR | Đăng tải bài viết tin tức, quản lý truyền thông sự kiện, quét mã QR soát vé đại biểu khi được BQT chỉ định. |

| HOI_VIEN_THUONG | Hội Viên Doanh Nhân Chính Thức | Xem Chung + Thao Tác Cá Nhân | Xem danh bạ, doanh nghiệp, sự kiện, cuộc họp; Thao tác đăng ký sự kiện, danh thiếp số, đặt lịch hẹn bàn, nhắn tin. |

## PHẦN 3: MA TRẬN PHÂN QUYỀN CHỨC NĂNG CHI TIẾT

| Phân Hệ Cha | Chức Năng Con | Thao Tác Cụ Thể | Admin | Ban Quản Trị | Ban Thành Viên | Ban Tài Chính | Ban Truyền Thông | Hội Viên |

| --- | --- | --- | --- | --- | --- | --- | --- | --- |

| 1. Quản Trị Hội Viên | Hồ sơ Chờ Duyệt (từ Landing) | Xem, Thẩm định, Từ chối | Có | Có | Có | Không | Không | Không |

| 1. Quản Trị Hội Viên | Phê Duyệt Kết Nạp (Approve) | Duyệt -> Cấp mã M1983 & Gửi mail | Có | Có | Không | Không | Không | Không |

| 1. Quản Trị Hội Viên | Danh Bạ Toàn Bộ Hội Viên | Xem danh sách & Hồ sơ 360° | Có | Có | Có | Có | Có | Chỉ Xem |

| 1. Quản Trị Hội Viên | Chỉnh Sửa Hồ Sơ Hội Viên | Cập nhật chức vụ, công ty, ngành | Có | Có | Có | Không | Không | Chỉ hồ sơ mình |

| 1. Quản Trị Hội Viên | Gia Hạn Hội Viên (Renewal) | Gia hạn niên liễm +365 ngày | Có | Không | Có | Không | Không | Không |

| 1. Quản Trị Hội Viên | Xuất File Excel Danh Bạ | Export danh sách hội viên VIP | Có | Có | Có | Không | Không | Không |

| 2. Quản Trị Tài Chính | Tổng Quan Thu Chi Quỹ | Xem biểu đồ doanh thu, số dư quỹ | Có | Có | Không | Có | Không | Không |

| 2. Quản Trị Tài Chính | Hóa Đơn Hội Phí VietQR | Tạo hóa đơn, gạch nợ thủ công | Có | Có | Không | Có | Không | Không |

| 2. Quản Trị Tài Chính | Quản Lý Nhà Tài Trợ & Gói | Tạo gói tài trợ, theo dõi giải ngân | Có | Có | Không | Có | Không | Chỉ Xem |

| 2. Quản Trị Tài Chính | Báo Cáo Quyết Toán Sự Kiện | Lập báo cáo tài chính gala đại hội | Có | Có | Không | Có | Không | Chỉ Xem |

| 3. Truyền Thông | Đăng Bài Viết Tin Tức CLB | Tạo bài viết, tải ảnh banner | Có | Có | Không | Không | Có | Không |

| 3. Truyền Thông | Kiểm Duyệt & Xuất Bản Tin | Phê duyệt hiển thị lên App Mobile | Có | Có | Không | Không | Có | Không |

| 3. Truyền Thông | Bảng Tin Hoạt Động & Sự Kiện | Xem tin tức hiệp hội | Có | Có | Có | Có | Có | Chỉ Xem |

| 4. Quản Trị Sự Kiện | Khởi Tạo Sự Kiện Mới | Tạo gala, đại hội, sơ đồ bàn VIP | Có | Có | Không | Không | Có | Không |

| 4. Quản Trị Sự Kiện | Chỉ Định Nhân Sự Soát Vé | Gán quyền quét QR cho nhân sự BTT | Có | Có | Không | Không | Không | Không |

| 4. Quản Trị Sự Kiện | Quét Mã QR Soát Vé (Camera) | Soát vé đại biểu tại cổng vào | Có | Có | Không | Không | Khi được gán | Không |

| 4. Quản Trị Sự Kiện | Đăng Ký Tham Dự Sự Kiện | Đăng ký vé và nhận cuống vé QR | Có | Có | Có | Có | Có | Vé của mình |

| 4. Quản Trị Sự Kiện | Bốc Thăm May Mắn (Lucky Draw) | Quay số trúng thưởng đêm gala | Có | Có | Không | Không | Có | Chỉ Xem |

| 5. Quản Trị Cuộc Họp | Tạo Cuộc Họp Online / Offline | Lập lịch họp, chọn hình thức | Có | Có | Không | Không | Không | Không |

| 5. Quản Trị Cuộc Họp | Gửi Địa Chỉ, Ngày Giờ Offline | Tự động gửi push & tin nhắn SMS/App | Có | Có | Không | Không | Không | Không |

| 5. Quản Trị Cuộc Họp | Điểm Danh & Biên Bản Cuộc Họp | Ghi nhận đại biểu có mặt, kết luận | Có | Có | Không | Không | Không | Chỉ Xem |

| 6. Kết Nối & Nhắn Tin | Nhắn Tin 1-1 Trên Web CRM | Gửi tin nhắn văn bản, danh thiếp B2B | Có | Có | Có | Có | Có | Tin nhắn mình |

| 6. Kết Nối & Nhắn Tin | Hẹn Gặp Bàn Tròn (1-on-1) | Lên lịch hẹn bàn giao thương | Có | Có | Có | Có | Có | Lịch hẹn mình |

| 7. Giao Thương B2B | Đăng Bài Sản Phẩm / Nhu Cầu | Đăng chào mua/chào bán B2B | Có | Có | Có | Có | Có | Bài của mình |

| 7. Giao Thương B2B | Kiểm Duyệt Sản Phẩm | Duyệt bài hiển thị sàn thương mại | Có | Có | Không | Không | Không | Không |

| 8. Biểu Quyết Trực Tuyến | Tạo Phiếu Biểu Quyết Mới | Tạo câu hỏi bầu cử, thăm dò ý kiến | Có | Có | Không | Không | Không | Không |

| 8. Biểu Quyết Trực Tuyến | Thực Hiện Bỏ Phiếu (Vote) | Chọn phương án và bấm xác nhận | Có | Có | Có | Có | Có | Bỏ phiếu mình |

## PHẦN 4: BẢN ĐỒ NGHIỆP VỤ & CÁC LUỒNG XỬ LÝ DỮ LIỆU CHÍNH
1. Luồng Xét duyệt Hội viên (Đã bỏ doanh thu trên Landing, BQT/Admin duyệt sinh mã M1983-xxx và gửi email tài khoản).
2. Luồng Phân công Soát vé QR (Chỉ định nhân sự Ban Truyền thông, gạch vé thời gian thực).
3. Luồng Gia hạn Niên liễm (Ban Thành viên và Admin thực hiện, gia hạn 365 ngày).
4. Luồng Cuộc họp Online/Offline (Admin/BQT tạo; Offline tự động gửi thông báo push và tin nhắn địa chỉ ngày giờ).
5. Luồng Kết nối & Nhắn tin B2B trên Web CRM (Đồng bộ tức thì với App di động).

## PHẦN 7: KỊCH BẢN KIỂM THỬ NGHIỆM THU CHẤP THUẬN (UAT)

| Mã TC | Tên Nghiệp Vụ | Vai Trò Thực Hiện | Thao Tác Thực Hiện | Kỳ Vọng Kỹ Thuật | Kỳ Vọng Giao Diện |

| --- | --- | --- | --- | --- | --- |

| TC_CRM_01 | Đăng ký Landing không có doanh thu | Ứng viên mới | Điền đơn gia nhập trên Landing web | API POST /api/members/apply không gửi trường revenue; CSDL lưu status = pending | Hiển thị popup thông báo Nộp đơn thành công, chờ thẩm định |

| TC_CRM_02 | BQT / Admin phê duyệt kết nạp | Ban Quản Trị / Admin | Nhấn nút "Phê duyệt" tại hồ sơ pending | status = active, cấp mã M1983-xxx, gửi mail mật khẩu qua mailer | Thẻ đổi sang màu xanh Hoạt động, hiển thị mã hội viên mới |

| TC_CRM_03 | Chỉ định nhân sự quét QR sự kiện | Ban Quản Trị | Chọn sự kiện, gán nhân sự Ban Truyền thông | Lưu bản ghi vào bảng event_scanners với status active | Nhân sự BTT mở app thấy nút Soát vé; Hội viên thường không thấy |

| TC_CRM_04 | Ban Thành viên gia hạn hội viên | Ban Thành Viên | Bấm nút "Gia hạn" trên hồ sơ hội viên | Thêm 365 ngày vào memberships.expires_at, hóa đơn đổi paid | Thời hạn thẻ tự động cập nhật đến năm tiếp theo |

| TC_CRM_05 | Tạo cuộc họp Offline gửi tin nhắn | Ban Quản Trị / Admin | Tạo họp Offline -> Bấm Ban hành | Hệ thống push notification và insert tin nhắn vào chat_messages | Hội viên nhận thông báo đẩy và tin nhắn địa chỉ, ngày giờ họp |

| TC_CRM_06 | Phân quyền phân hệ Tài chính | Hội viên thường | Cố gắng truy cập menu Tài chính | Hệ thống chặn quyền (HTTP 403 Forbidden) | Menu Tài chính bị ẩn hoàn toàn trên thanh điều hướng |

| TC_CRM_07 | Nhắn tin B2B trên Web CRM | Hội viên chính thức | Mở chat CRM, gửi tin nhắn cho hội viên khác | Lưu vào chat_messages, phát socket thời gian thực | Tin nhắn hiển thị ngay trong bong bóng chat của người nhận |

