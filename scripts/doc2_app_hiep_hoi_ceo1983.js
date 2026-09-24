const {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  createPara,
  createHeading1,
  createHeading2,
  createHeading3,
  createCallout,
  createTable,
  createHeaderFooter,
} = require('./srs_docx_helpers');

function buildDoc2() {
  const hf = createHeaderFooter('App Hiệp Hội CEO 1983');
  const children = [];
  let md = '';

  function addMd(text) {
    md += text + '\n\n';
  }

  // ==========================================
  // TRANG BÌA & THÔNG TIN QUẢN TRỊ
  // ==========================================
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: 'TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & THIẾT KẾ CƠ SỞ DỮ LIỆU',
          font: 'Times New Roman',
          size: 24,
          bold: true,
          color: 'D97706',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 120 },
      children: [
        new TextRun({
          text: 'ỨNG DỤNG DI ĐỘNG & PWA HIỆP HỘI CLB DOANH NHÂN CEO 1983',
          font: 'Times New Roman',
          size: 32,
          bold: true,
          color: '003B95',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 200 },
      children: [
        new TextRun({
          text: 'Sổ Tay Doanh Nhân 360°, Thẻ VIP 3D, Hẹn Bàn Giao Thương, Vé QR & Soát Vé Ban Truyền Thông, Cuộc Họp Thông Minh',
          font: 'Times New Roman',
          size: 22,
          italics: true,
          color: '64748B',
        }),
      ],
    })
  );

  addMd('# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & THIẾT KẾ CƠ SỞ DỮ LIỆU');
  addMd('## ỨNG DỤNG DI ĐỘNG & PWA HIỆP HỘI CLB DOANH NHÂN CEO 1983');
  addMd('*Phiên bản: Version 3.0 - Bản Chuẩn Hoá Toàn Diện Master BA*');

  const metaHeaders = ['Mục Quản Trị', 'Thông Tin Chi Tiết'];
  const metaRows = [
    ['Tên Ứng Dụng (Mobile Name)', 'CEO1983 (Chuẩn hóa viết liền không dấu cách, biểu tượng số 8 mạ vàng)'],
    ['Mã Tài Liệu', 'SRS-CEO1983-APP-V3.0'],
    ['Phiên Bản', 'Version 3.0 - Master BA Comprehensive Specification (Quy chế phân quyền & luồng cuộc gặp)'],
    ['Tác Giả & Thẩm Định', 'Master Business Analyst, Solution Architect & Ban Thư Ký CLB CEO 1983'],
    ['Đối Tượng Sử Dụng', 'Hội viên CLB Doanh Nhân CEO 1983, Ban Quản Trị, Ban Thành Viên, Ban Tài Chính, Ban Truyền Thông'],
    ['Nền Tảng Triển Khai', 'PWA Mobile Web & Mobile App (Android APK, iOS qua Capacitor / React 19)'],
    ['Phong Cách Thiết Kế', 'Executive Dark Gold & Champagne Luxury (Chuẩn màu Xanh Navy Hoàng Gia #003B95 & Vàng Ánh Kim #D97706)'],
    ['Hệ Thống Tích Hợp', 'Web CRM CEO 1983, Cổng Thanh Toán VietQR Napas 24/7, Camera QR Scanner, Push Notification']
  ];
  children.push(createTable(metaHeaders, metaRows, [30, 70]));

  addMd('| ' + metaHeaders.join(' | ') + ' |');
  addMd('| ' + metaHeaders.map(() => '---').join(' | ') + ' |');
  metaRows.forEach(r => addMd('| ' + r.join(' | ') + ' |'));

  // ==========================================
  // PHẦN 1: GIẢI THÍCH BÌNH DÂN CHO NGƯỜI KHÔNG HỌC IT
  // ==========================================
  children.push(createHeading1('PHẦN 1: GIẢI THÍCH BÌNH DÂN CÁC KHÁI NIỆM KỸ THUẬT CỐT LÕI'));
  children.push(
    createPara('Ứng dụng di động CEO1983 đóng vai trò như cuốn Sổ Tay Doanh Nhân Thông Minh và Thẻ Doanh Nhân Số của mỗi thành viên trong CLB:'),
    createCallout(
      'HÌNH TƯỢNG VÍ VON ĐỜI THƯỜNG DỄ HIỂU NHẤT:',
      '1. Luồng Cuộc Gặp (Hẹn bàn giao thương 1-on-1): Giống như việc bạn gửi một chiếc "Thiệp Mời Cà Phê Bàn Tròn" cho một CEO trong CLB, trên thiệp ghi rõ: "Hẹn gặp 9h sáng thứ Sáu tại Khách sạn Daewoo để trao đổi về hợp tác chuỗi cung ứng". Khi đối tác bấm đồng ý, lịch hẹn tự động lưu vào sổ tay cả hai người.\n' +
      '2. Chức năng Quét mã QR Soát Vé (Dành riêng cho Ban Truyền Thông được BQT chỉ định): Chiếc điện thoại biến thành máy quét tại cổng sự kiện. Không phải ai mở app cũng thấy nút quét này; chỉ những ai được Ban Quản Trị phân công nhiệm vụ mới có mắt thần camera để đọc mã vé REG-xxx, kiểm tra số bàn VIP và đánh dấu Đã Vào Cửa.\n' +
      '3. Thẻ Doanh Nhân VIP 3D Chạm NFC: Chiếc điện thoại biến thành chiếc thẻ doanh nhân bằng vàng. Khi chạm nhẹ vào lưng điện thoại đối tác, hệ thống tự động đẩy toàn bộ danh thiếp, hồ sơ công ty và lưu danh bạ (.VCF) chỉ sau 1 giây.\n' +
      '4. Cuộc họp Offline có thông báo & tin nhắn tự động: Giống như ban thư ký phát thanh loa thông báo đồng thời gửi giấy mời có ghi rõ địa chỉ, ngày giờ vào tận hòm thư riêng của từng đại biểu.',
      'info'
    )
  );

  addMd('## PHẦN 1: GIẢI THÍCH BÌNH DÂN CÁC KHÁI NIỆM KỸ THUẬT CỐT LÕI');
  addMd('> **HÌNH TƯỢNG VÍ VON ĐỜI THƯỜNG:**\n' +
    '> 1. Luồng Cuộc Gặp = Thiệp mời hẹn bàn cà phê 1-on-1 giao thương tự động đồng bộ lịch.\n' +
    '> 2. Soát Vé QR = Mắt thần cổng tiệc chỉ mở cho nhân sự Ban Truyền Thông được BQT chỉ định.\n' +
    '> 3. Thẻ VIP NFC 3D = Danh thiếp mạ vàng chạm lưng điện thoại lưu danh bạ 1 giây.\n' +
    '> 4. Cuộc họp Offline = Hệ thống tự động bắn push và gửi tin nhắn địa chỉ ngày giờ đến hộp thư hội viên.');

  // ==========================================
  // PHẦN 2: BẢN ĐỒ 5 TAB CHỨC NĂNG & PHÂN QUYỀN TRÊN APP
  // ==========================================
  children.push(createHeading1('PHẦN 2: BẢN ĐỒ 5 TAB CHỨC NĂNG & PHÂN QUYỀN TRÊN APP DI ĐỘNG'));
  children.push(
    createPara('Ứng dụng được kiến trúc chuẩn hóa thành 5 Tab điều hướng thanh dưới đáy (Bottom Navigation Bar) kèm các nguyên tắc hiển thị đặc quyền:'),
    createCallout(
      'QUY TẮC HIỂN THỊ & PHÂN QUYỀN TRÊN APP:',
      '• Nguyên tắc 1 (Ẩn/Hiện nút Soát vé sự kiện): Trên màn hình Trang chủ (/association), tiện ích "Soát vé sự kiện" bằng camera QR CHỈ HIỂN THỊ đối với tài khoản Admin, Ban Quản Trị hoặc thành viên Ban Truyền Thông đã được Ban Quản Trị chỉ định trong danh sách event_scanners của sự kiện đó. Đối với hội viên thường, khối này hoàn toàn bị ẩn để tránh gây nhầm lẫn.\n' +
      '• Nguyên tắc 2 (Hội viên chỉ Xem danh mục chung): Trong các phân hệ Danh bạ hội viên, Doanh nghiệp, Sự kiện, Nhà tài trợ, Gói tài trợ, Báo cáo tài trợ, Tin tức, Quyền lợi, Biểu quyết và Cuộc họp, hội viên thông thường chỉ có quyền XEM dữ liệu, không có nút thêm/sửa/xóa.\n' +
      '• Nguyên tắc 3 (Hội viên Thao tác trên nghiệp vụ cá nhân): Hội viên có toàn quyền thao tác đối với các chức năng cá nhân của mình gồm: Đăng ký vé sự kiện, Tổng quan danh thiếp thông minh (Smart Card), Kết nối cuộc gặp (Hẹn bàn 1-1), Nhắn tin trao đổi, Cài đặt và xem Nhật ký hoạt động.',
      'tip'
    )
  );

  const tabHeaders = ['Tab Điều Hướng', 'Tên Chức Năng', 'Quyền Hiển Thị', 'Mô Tả Nghiệp Vụ'];
  const tabRows = [
    ['Tab 1: Trang Chủ', 'Home Dashboard & VIP Card', 'Tất cả (Nút Soát vé QR chỉ mở cho BTT)', 'Thẻ VIP 3D chạm NFC, sự kiện nổi bật, tiện ích Soát vé sự kiện (chỉ mở cho nhân sự BTT được gán), tin hoạt động CLB.'],
    ['Tab 2: Sự Kiện', 'Events & QR Ticket Pass', 'Tất cả (Hội viên xem chung + đăng ký vé)', 'Lịch đại hội gala, sơ đồ khán phòng bàn VIP, danh sách nhà tài trợ & gói tài trợ, cuống vé điện tử QR cá nhân.'],
    ['Tab 3: Thẻ 83', 'Smart NFC Card & Business Identity', 'Tất cả (Thao tác thẻ cá nhân)', 'Trọng tâm thanh điều hướng: Mở danh thiếp số 3D, mã QR định danh cá nhân, chạm kết nối NFC, chia sẻ link hồ sơ.'],
    ['Tab 4: Tin Nhắn', 'Messages, Meetings & 1-on-1', 'Tất cả (Chat cá nhân + Xem họp)', 'Hộp thư doanh nhân 3 tabs (Tất cả, Bạn bè, Nhóm ban ngành), Luồng cuộc gặp hẹn bàn 1-on-1, Lịch cuộc họp Online/Offline.'],
    ['Tab 5: Cá Nhân', 'Profile, Settings & Activity Log', 'Tất cả (Quản lý thông tin mình)', 'Chỉnh sửa hồ sơ CEO, quản lý doanh nghiệp, hóa đơn niên liễm VietQR, nhật ký hoạt động, bảo mật và đổi mật khẩu.']
  ];
  children.push(createTable(tabHeaders, tabRows, [20, 25, 25, 30]));

  addMd('## PHẦN 2: BẢN ĐỒ 5 TAB CHỨC NĂNG & PHÂN QUYỀN TRÊN APP');
  addMd('| ' + tabHeaders.join(' | ') + ' |');
  addMd('| ' + tabHeaders.map(() => '---').join(' | ') + ' |');
  tabRows.forEach(r => addMd('| ' + r.join(' | ') + ' |'));

  // ==========================================
  // PHẦN 3: ĐẶC TẢ CHI TIẾT TỪNG PHÂN HỆ NGHIỆP VỤ CỐT LÕI
  // ==========================================
  children.push(createHeading1('PHẦN 3: ĐẶC TẢ CHI TIẾT CÁC LUỒNG NGHIỆP VỤ TRỌNG TÂM'));

  // 3.1 Luồng Cuộc Gặp (Hẹn bàn giao thương 1-on-1)
  children.push(createHeading2('3.1 Luồng Cuộc Gặp (Gửi Kết Nối & Lên Lịch Hẹn Bàn 1-on-1)'));
  children.push(
    createPara('• Bản chất nghiệp vụ: Luồng cuộc gặp chính là luồng kết nối lên lịch hẹn bàn giao thương giữa các hội viên trong CLB CEO 1983.\n' +
      '• Bước 1: Hội viên A mở danh bạ hội viên hoặc xem danh thiếp của Hội viên B -> Bấm nút "Hẹn gặp bàn tròn" (Book Meeting).\n' +
      '• Bước 2: Màn hình mở form thiết lập lịch hẹn gồm:\n' +
      '  - Mục tiêu cuộc gặp (Tìm hiểu chuỗi cung ứng, Chào hàng B2B, Hợp tác đầu tư, Trao đổi kinh nghiệm).\n' +
      '  - Thời gian đề xuất (Ngày, Giờ hẹn).\n' +
      '  - Địa điểm đề xuất (Văn phòng công ty, Quán Cà phê đối tác CLB, hoặc Bàn VIP sự kiện).\n' +
      '  - Lời nhắn gửi kèm.\n' +
      '• Bước 3: Dữ liệu gửi qua API POST /api/connections/meetings -> Lưu vào bảng business_connections với status = "pending".\n' +
      '• Bước 4: Hội viên B nhận được thông báo đẩy (Notification) và tin nhắn mời hẹn trong Hộp thư. Hội viên B có thể bấm: "Đồng ý", "Đổi giờ khác" hoặc "Từ chối khéo".\n' +
      '• Bước 5: Khi Hội viên B bấm Đồng ý -> status chuyển thành "confirmed", hệ thống tự động đồng bộ lịch vào mục "Lịch cuộc gặp của tôi" trên app của cả 2 bên và nhắc lịch trước 2 giờ.')
  );

  // 3.2 Luồng Soát Vé QR Sự Kiện (Chỉ Ban Truyền Thông được BQT chỉ định)
  children.push(createHeading2('3.2 Luồng Soát Vé QR Sự Kiện (Kiểm Soát Quyền Chặt Chẽ)'));
  children.push(
    createPara('• Cơ chế phân quyền: Hệ thống kiểm tra đồng thời 2 điều kiện:\n' +
      '  1. Người dùng thuộc Ban Truyền Thông (hoặc Admin/Ban Quản Trị).\n' +
      '  2. Được Ban Quản Trị chỉ định cụ thể trong bảng event_scanners của sự kiện đang diễn ra.\n' +
      '• Bước 1: Nhân sự Ban Truyền Thông được gán quyền mở App -> Thấy khối "Soát vé sự kiện" tại Trang chủ (/association) -> Bấm vào để mở màn hình quét camera (/association/checkin).\n' +
      '• Bước 2: Nếu một hội viên bình thường cố tình nhập URL /association/checkin, màn hình hiển thị cảnh báo: "Bạn không có quyền soát vé sự kiện. Quyền quét mã QR điểm danh đại biểu chỉ dành cho thành viên Ban Truyền Thông được Ban Quản Trị chỉ định cho sự kiện này." và chỉ có nút Quay về trang chủ.\n' +
      '• Bước 3: Khi quét camera trúng mã QR trên vé đại biểu, app gọi API GET /api/events/checkin/lookup.\n' +
      '• Bước 4: Ứng dụng hiển thị ngay Popup thông tin đại biểu: Họ tên, Chức vụ, Công ty, Ảnh đại diện, Hạng vé (VIP/VVIP), Số bàn tiệc được bố trí và Số bốc thăm may mắn.\n' +
      '• Bước 5: Nhân sự bấm "Xác nhận vào cửa" -> API POST /api/events/checkin/confirm ghi nhận is_checked_in = true, lưu scanned_by_user_id và đồng bộ tức thì lên màn hình CRM của Ban Tổ Chức.')
  );

  // 3.3 Luồng Cuộc Họp Online & Offline
  children.push(createHeading2('3.3 Luồng Cuộc Họp CLB (Tự Động Gửi Địa Chỉ, Ngày Giờ Offline)'));
  children.push(
    createPara('• Quyền hạn: Hội viên chỉ có quyền XEM danh sách cuộc họp và xác nhận tham dự. Quyền tạo/sửa cuộc họp thuộc về Admin và Ban Quản Trị.\n' +
      '• Luồng xử lý cuộc họp Offline:\n' +
      '  - Khi Ban Quản Trị ban hành cuộc họp Offline trên hệ thống, máy chủ tự động quét danh sách đại biểu tham gia trong bảng meeting_attendees.\n' +
      '  - Hệ thống tự động kích hoạt 2 luồng gửi tin song song:\n' +
      '    + Luồng 1: Bắn thông báo đẩy (Push Notification) đến điện thoại của hội viên với tiêu đề: "Mời họp Offline: [Tiêu đề cuộc họp]".\n' +
      '    + Luồng 2: Tự động gửi một tin nhắn trực tiếp vào mục "Tin Nhắn" của hội viên với nội dung chi tiết: Tên cuộc họp, Thời gian bắt đầu - kết thúc, Địa chỉ tổ chức chính xác, Bản đồ Google Maps chỉ đường và Yêu cầu trang phục.\n' +
      '  - Hội viên mở tin nhắn hoặc thông báo, bấm nút "Xác nhận tham gia" (RSVP) để Ban Thư Ký nắm danh sách số lượng chỗ ngồi.')
  );

  // 3.4 Luồng Biểu Quyết Trực Tuyến
  children.push(createHeading2('3.4 Luồng Biểu Quyết Trực Tuyến & Thăm Dò Ý Kiến'));
  children.push(
    createPara('• Phân quyền biểu quyết: Hội viên chỉ có quyền BIỂU QUYẾT (bỏ phiếu), KHÔNG có quyền tạo biểu quyết mới. Quyền tạo biểu quyết thuộc về Ban Quản Trị.\n' +
      '• Thao tác hội viên: Mở danh sách biểu quyết -> Đọc nội dung đề xuất của Ban Quản Trị (Ví dụ: Bầu bổ sung Phó Chủ tịch, Thông qua kế hoạch tài chính năm 2026) -> Chọn phương án (Đồng ý / Không đồng ý / Ý kiến khác) -> Bấm "Xác nhận bỏ phiếu".\n' +
      '• Mỗi hội viên chỉ được bỏ phiếu duy nhất 1 lần, kết quả được mã hóa đảm bảo tính minh bạch và công bằng.')
  );

  addMd('## PHẦN 3: ĐẶC TẢ CHI TIẾT CÁC LUỒNG NGHIỆP VỤ TRỌNG TÂM\n' +
    '1. Luồng Cuộc Gặp: Hẹn bàn 1-on-1 giữa các hội viên kèm thời gian, địa điểm, mục tiêu và đồng bộ lịch.\n' +
    '2. Luồng Soát Vé QR: Chỉ mở cho Ban Truyền Thông được BQT chỉ định; gạch vé và tra cứu bàn VIP.\n' +
    '3. Luồng Cuộc Họp Offline: Tự động bắn thông báo và gửi tin nhắn địa chỉ, ngày giờ vào hộp thư hội viên.\n' +
    '4. Luồng Biểu Quyết: Hội viên bỏ phiếu biểu quyết, BQT tạo phiếu biểu quyết.');

  // ==========================================
  // PHẦN 4: MA TRẬN PHÂN QUYỀN CHỨC NĂNG TRÊN APP
  // ==========================================
  children.push(createHeading1('PHẦN 4: MA TRẬN PHÂN QUYỀN CHỨC NĂNG TRÊN APP MOBILE'));
  const appMatrixHeaders = ['Màn Hình / Tính Năng', 'Chức Năng Con', 'Quyền Của Hội Viên', 'Quyền Của Ban Quản Trị', 'Quyền Ban Truyền Thông'];
  const appMatrixRows = [
    ['1. Trang Chủ (/association)', 'Thẻ VIP 3D & NFC', 'Toàn quyền thao tác thẻ mình', 'Toàn quyền', 'Toàn quyền'],
    ['1. Trang Chủ (/association)', 'Tiện ích Soát vé QR', 'ẨN HOÀN TOÀN (Không có quyền)', 'Toàn quyền truy cập', 'Hiện khi được BQT chỉ định'],
    ['2. Sự Kiện (/association/events)', 'Xem Danh sách Sự kiện', 'Xem đầy đủ', 'Toàn quyền quản trị', 'Xem & Quản trị truyền thông'],
    ['2. Sự Kiện (/association/events)', 'Xem Nhà tài trợ & Báo cáo', 'Chỉ Xem', 'Xem đầy đủ số liệu', 'Xem & Đăng tin'],
    ['2. Sự Kiện (/association/events)', 'Đăng ký vé sự kiện', 'Đăng ký vé của chính mình', 'Toàn quyền cấp vé', 'Toàn quyền'],
    ['3. Cuộc Gặp & Kết Nối', 'Lên lịch hẹn bàn 1-1', 'Toàn quyền đặt hẹn và nhận hẹn', 'Toàn quyền', 'Toàn quyền'],
    ['4. Cuộc Họp CLB', 'Xem Lịch họp Online/Offline', 'Xem đầy đủ & Bấm xác nhận', 'Toàn quyền tạo/sửa/hủy', 'Xem lịch họp'],
    ['4. Cuộc Họp CLB', 'Tạo cuộc họp mới', 'KHÔNG CÓ QUYỀN (Ẩn nút)', 'Toàn quyền tạo & phát hành', 'Không có quyền'],
    ['5. Biểu Quyết CLB', 'Thực hiện bỏ phiếu', 'Được quyền bỏ phiếu 1 lần', 'Toàn quyền bỏ phiếu', 'Được quyền bỏ phiếu'],
    ['5. Biểu Quyết CLB', 'Tạo cuộc biểu quyết', 'KHÔNG CÓ QUYỀN (Ẩn nút)', 'Toàn quyền tạo câu hỏi', 'Không có quyền'],
    ['6. Danh Bạ Hội Viên', 'Xem danh bạ & doanh nghiệp', 'Xem 360° hồ sơ đối tác', 'Xem đầy đủ', 'Xem đầy đủ'],
    ['7. Cá Nhân & Hồ Sơ', 'Cập nhật ảnh bìa, avatar, bio', 'Toàn quyền sửa hồ sơ mình', 'Toàn quyền', 'Toàn quyền']
  ];
  children.push(createTable(appMatrixHeaders, appMatrixRows, [20, 22, 20, 19, 19]));

  addMd('## PHẦN 4: MA TRẬN PHÂN QUYỀN CHỨC NĂNG TRÊN APP MOBILE');
  addMd('| ' + appMatrixHeaders.join(' | ') + ' |');
  addMd('| ' + appMatrixHeaders.map(() => '---').join(' | ') + ' |');
  appMatrixRows.forEach(r => addMd('| ' + r.join(' | ') + ' |'));

  // ==========================================
  // PHẦN 5: CƠ SỞ DỮ LIỆU POSTGRESQL & TỪ ĐIỂN DỮ LIỆU
  // ==========================================
  children.push(createHeading1('PHẦN 5: THIẾT KẾ CƠ SỞ DỮ LIỆU POSTGRESQL TRỌNG TÂM'));

  children.push(createHeading2('5.1 Bảng business_connections (Tủ Hồ Sơ Cuộc Gặp Hẹn Bàn 1-on-1)'));
  const connColHeaders = ['Tên Cột (Field)', 'Kiểu Dữ Liệu', 'Bắt Buộc?', 'Khóa (Key)', 'Giải Thích Dễ Hiểu'];
  const connColRows = [
    ['id', 'UUID', 'Có', 'PK', 'Mã cuộc hẹn duy nhất.'],
    ['sender_member_id', 'UUID', 'Có', 'FK -> members.id', 'Hội viên chủ động gửi lời mời hẹn gặp.'],
    ['receiver_member_id', 'UUID', 'Có', 'FK -> members.id', 'Hội viên nhận được lời mời hẹn gặp.'],
    ['meeting_purpose', 'VARCHAR(255)', 'Có', 'None', 'Mục đích: Tìm hiểu chuỗi cung ứng, Hợp tác kinh doanh, Đầu tư.'],
    ['proposed_time', 'TIMESTAMPTZ', 'Có', 'None', 'Thời gian hẹn gặp do bên mời đề xuất.'],
    ['proposed_location', 'VARCHAR(255)', 'Có', 'None', 'Địa điểm hẹn gặp (Tên quán cà phê, văn phòng hoặc bàn VIP).'],
    ['message', 'TEXT', 'Không', 'None', 'Lời nhắn gửi gắm của người mời.'],
    ['status', 'VARCHAR(30)', 'Có', 'None', 'Trạng thái: "pending" (Chờ phản hồi), "confirmed" (Đã chốt), "declined" (Từ chối).'],
    ['created_at', 'TIMESTAMPTZ', 'Có', 'None', 'Thời điểm gửi lời mời hẹn gặp.']
  ];
  children.push(createTable(connColHeaders, connColRows, [20, 18, 12, 18, 32]));

  children.push(createHeading2('5.2 Bảng event_scanners (Bảng Phân Quyền Soát Vé Ban Truyền Thông)'));
  const scColHeaders = ['Tên Cột (Field)', 'Kiểu Dữ Liệu', 'Bắt Buộc?', 'Khóa (Key)', 'Giải Thích Dễ Hiểu'];
  const scColRows = [
    ['id', 'UUID', 'Có', 'PK', 'Mã bản ghi chỉ định quyền soát vé.'],
    ['event_id', 'UUID', 'Có', 'FK -> events.id', 'Mã sự kiện áp dụng.'],
    ['user_id', 'UUID', 'Có', 'FK -> vione_users.id', 'Tài khoản nhân sự Ban Truyền Thông được trao quyền.'],
    ['assigned_by', 'UUID', 'Có', 'FK -> vione_users.id', 'Thành viên Ban Quản Trị đã thực hiện phân công.'],
    ['created_at', 'TIMESTAMPTZ', 'Có', 'None', 'Thời điểm phân công quyền quét mã QR.']
  ];
  children.push(createTable(scColHeaders, scColRows, [20, 18, 12, 18, 32]));

  children.push(createHeading2('5.3 Bảng meeting_attendees (Tủ Đại Biểu Cuộc Họp & Trạng Thái Nhận Tin)'));
  const attColHeaders = ['Tên Cột (Field)', 'Kiểu Dữ Liệu', 'Bắt Buộc?', 'Khóa (Key)', 'Giải Thích Dễ Hiểu'];
  const attColRows = [
    ['id', 'UUID', 'Có', 'PK', 'Mã bản ghi mời họp đại biểu.'],
    ['meeting_id', 'UUID', 'Có', 'FK -> meetings.id', 'Mã cuộc họp liên quan.'],
    ['member_id', 'UUID', 'Có', 'FK -> members.id', 'Hội viên được mời tham gia cuộc họp.'],
    ['rsvp_status', 'VARCHAR(30)', 'Có', 'None', 'Xác nhận: "attending" (Tham gia), "declined" (Báo vắng), "pending" (Chưa rõ).'],
    ['offline_notif_sent', 'BOOLEAN', 'Có', 'None', 'Đã bắn thông báo đẩy địa chỉ ngày giờ chưa (true/false).'],
    ['offline_msg_sent', 'BOOLEAN', 'Có', 'None', 'Đã gửi tin nhắn trực tiếp hộp thư nội bộ chưa (true/false).'],
    ['updated_at', 'TIMESTAMPTZ', 'Có', 'None', 'Thời điểm phản hồi xác nhận tham gia.']
  ];
  children.push(createTable(attColHeaders, attColRows, [20, 18, 12, 18, 32]));

  // ==========================================
  // PHẦN 6: KỊCH BẢN KIỂM THỬ UAT TRÊN APP
  // ==========================================
  children.push(createHeading1('PHẦN 6: KỊCH BẢN KIỂM THỬ NGHIỆM THU (APP MOBILE UAT)'));
  const appTcHeaders = ['Mã Test Case', 'Tên Nghiệp Vụ', 'Thao Tác Thực Hiện', 'Kỳ Vọng Kỹ Thuật', 'Kỳ Vọng Giao Diện'];
  const appTcRows = [
    ['TC_APP_01', 'Ẩn nút quét vé với Hội viên thường', 'Hội viên thường mở Trang chủ (/association)', 'canScanQR = false; DOM không render khối Soát vé sự kiện', 'Giao diện sạch sẽ, chỉ hiển thị Thẻ VIP 3D và Sự kiện nổi bật'],
    ['TC_APP_02', 'Hiện nút quét vé với BTT được chỉ định', 'Nhân sự BTT được gán quyền mở Trang chủ', 'canScanQR = true; DOM render khối Soát vé sự kiện', 'Hiển thị thẻ Soát vé kèm badge "Ban Truyền Thông" nổi bật'],
    ['TC_APP_03', 'Gửi lời mời hẹn bàn cuộc gặp 1-1', 'Hội viên A bấm Hẹn gặp Hội viên B', 'POST /api/connections/meetings lưu bản ghi status = pending', 'Popup xác nhận đã gửi lời mời; hiển thị trong tab Đã gửi hẹn'],
    ['TC_APP_04', 'Nhận tin nhắn địa chỉ cuộc họp Offline', 'Admin ban hành cuộc họp Offline', 'Hệ thống push notif và ghi tin nhắn vào chat_messages', 'Hội viên nhận push và tin nhắn hiển thị đầy đủ địa chỉ, ngày giờ'],
    ['TC_APP_05', 'Hội viên thực hiện bỏ phiếu biểu quyết', 'Hội viên mở tab Biểu quyết -> Chọn phương án -> Bấm Xác nhận', 'POST /api/votes/:id/ballot ghi nhận lựa chọn; khóa bỏ phiếu lần 2', 'Nút bấm chuyển sang trạng thái "Đã biểu quyết", xem tỷ lệ %'],
    ['TC_APP_06', 'Chạm thẻ NFC mở danh thiếp số 3D', 'Chạm lưng thẻ vào điện thoại đối tác', 'Đọc NDEF URL chuyển hướng đến /card/:slug', 'Điện thoại đối tác bật màn hình Danh thiếp số mạ vàng có nút Lưu VCF']
  ];
  children.push(createTable(appTcHeaders, appTcRows, [12, 20, 22, 23, 23]));

  addMd('## PHẦN 6: KỊCH BẢN KIỂM THỬ NGHIỆM THU (APP MOBILE UAT)');
  addMd('| ' + appTcHeaders.join(' | ') + ' |');
  addMd('| ' + appTcHeaders.map(() => '---').join(' | ') + ' |');
  appTcRows.forEach(r => addMd('| ' + r.join(' | ') + ' |'));

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1200, bottom: 1200, left: 1350, right: 1350 },
          },
        },
        headers: hf.headers,
        footers: hf.footers,
        children: children,
      },
    ],
  });

  return { doc, mdContent: md };
}

module.exports = { buildDoc2 };
