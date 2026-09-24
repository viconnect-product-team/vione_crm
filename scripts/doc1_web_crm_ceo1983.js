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

function buildDoc1() {
  const hf = createHeaderFooter('Web CRM CEO 1983');
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
          text: 'CỔNG QUẢN TRỊ TRUNG TÂM CLB DOANH NHÂN CEO 1983 (WEB CRM & PORTAL)',
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
          text: 'Hệ thống Quản lý Hội viên, Phân quyền Đa tầng, Quản trị Sự kiện & Soát vé QR, Niên liễm, Cuộc họp Thông minh & Nhắn tin B2B',
          font: 'Times New Roman',
          size: 22,
          italics: true,
          color: '64748B',
        }),
      ],
    })
  );

  addMd('# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & THIẾT KẾ CƠ SỞ DỮ LIỆU');
  addMd('## CỔNG QUẢN TRỊ TRUNG TÂM CLB DOANH NHÂN CEO 1983 (WEB CRM & PORTAL)');
  addMd('*Phiên bản: Version 3.0 - Bản Chuẩn Hoá Toàn Diện Master BA*');

  const metaHeaders = ['Mục Quản Trị', 'Thông Tin Chi Tiết'];
  const metaRows = [
    ['Tên Dự Án / Phân Hệ', 'Cổng Quản Trị Trung Tâm CLB Doanh Nhân CEO 1983 (Web Admin CRM & Business Portal)'],
    ['Mã Tài Liệu', 'SRS-CEO1983-CRM-V3.0'],
    ['Phiên Bản', 'Version 3.0 - Master BA Comprehensive Specification (Chuẩn hóa quy chế phân quyền)'],
    ['Tác Giả & Thẩm Định', 'Master Business Analyst, Solution Architect & Ban Thư Ký CLB CEO 1983'],
    ['Đối Tượng Sử Dụng', 'Super Admin, Ban Quản Trị (BQT), Ban Thành Viên, Ban Tài Chính, Ban Truyền Thông, Hội Viên'],
    ['Nền Tảng Triển Khai', 'Web Application (React 19, TypeScript, Vite, TanStack Router, Nitro SSR Engine)'],
    ['Hệ Quản Trị CSDL', 'PostgreSQL (Mô hình Quan Hệ RDBMS chuẩn ACID, Schema: public, Khóa ngoại toàn vẹn dữ liệu)'],
    ['Phạm Vi Tích Hợp', 'Web Landing Page, App Hiệp Hội CEO 1983 Mobile, App ViOne Connect, Mail Server, VietQR Napas 24/7']
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
    createPara('Để bất kỳ lãnh đạo doanh nghiệp, chủ tịch, hay nhân viên hành chính nào dù chưa từng học về công nghệ thông tin cũng có thể đọc hiểu, vận hành và giám sát 100% hoạt động của hệ thống phần mềm, hãy hình dung Web CRM CEO 1983 giống như Tòa Nhà Văn Phòng Bộ Chỉ Huy của Hiệp Hội:'),
    createCallout(
      'HÌNH TƯỢNG VÍ VON ĐỜI THƯỜNG DỄ HIỂU NHẤT:',
      '1. Cơ sở dữ liệu (Database): Giống như Phòng Lưu Trữ Hồ Sơ Trung Tâm tuyệt mật của hiệp hội.\n' +
      '2. Bảng (Table): Là các Ngăn Tủ Hồ Sơ chuyên biệt. Ngăn đựng lý lịch hội viên (members), ngăn cuống vé sự kiện (event_registrations), ngăn lịch họp và thông báo (meetings), ngăn sổ thu chi hội phí (invoices), ngăn tin nhắn kết nối (chat_messages).\n' +
      '3. Khóa chính (Primary Key - PK / id): Giống như Số Căn Cước Công Dân duy nhất của từng hồ sơ. Không bao giờ có 2 người trùng số nhau.\n' +
      '4. Khóa ngoại (Foreign Key - FK): Giống như dòng ghi chú "Hồ sơ này gắn liền với ai". Ví dụ: Trên cuống vé có ghi member_id để biết chiếc vé này thuộc về đại biểu nào.\n' +
      '5. Phân quyền (RBAC - Role-Based Access Control): Giống như Thẻ Ra Vào Tòa Nhà có gắn chip. Thẻ của Chủ tịch/Admin mở được mọi cánh cửa; thẻ của Ban Tài chính chỉ mở phòng Kế toán; thẻ của Ban Truyền thông mở được phòng Báo chí & Máy quét thẻ cổng tiệc; thẻ của Hội viên thường chỉ vào được sảnh chung xem thông tin và phòng làm việc riêng của mình.\n' +
      '6. Phép JOIN (Ghép Bảng): Giống như thư ký lấy hồ sơ vé sự kiện ra, nhìn thấy mã hội viên, liền bước sang ngăn tủ lý lịch lấy tờ sơ yếu lý lịch kẹp ghim lại với nhau để lãnh đạo nhìn thấy đầy đủ: Tên đại biểu, Tên công ty, Chức vụ và Vị trí bàn tiệc VIP.',
      'info'
    )
  );

  addMd('## PHẦN 1: GIẢI THÍCH BÌNH DÂN CÁC KHÁI NIỆM KỸ THUẬT CỐT LÕI');
  addMd('> **HÌNH TƯỢNG VÍ VON ĐỜI THƯỜNG:**\n' +
    '> 1. Database = Phòng hồ sơ trung tâm.\n' +
    '> 2. Table = Ngăn tủ chuyên biệt (hội viên, sự kiện, vé, cuộc họp, hóa đơn, tin nhắn).\n' +
    '> 3. Primary Key (PK) = Số CCCD duy nhất không trùng lặp.\n' +
    '> 4. Foreign Key (FK) = Dòng ghi chú liên kết (cuống vé này của ai, cuộc họp này do ai chủ trì).\n' +
    '> 5. RBAC = Thẻ từ mở cửa từng phòng chuyên môn theo chức vụ.\n' +
    '> 6. Phép JOIN = Thư ký lấy kẹp ghim kẹp tờ cuống vé với sơ yếu lý lịch để có báo cáo đầy đủ.');

  // ==========================================
  // PHẦN 2: QUY CHẾ PHÂN QUYỀN VAI TRÒ (RBAC 6 VAI TRÒ)
  // ==========================================
  children.push(createHeading1('PHẦN 2: QUY CHẾ PHÂN QUYỀN HỆ THỐNG (RBAC - 6 VAI TRÒ QUẢN TRỊ)'));
  children.push(
    createPara('Hệ thống Web CRM CEO 1983 áp dụng nguyên tắc quản trị ma trận phân quyền nghiêm ngặt theo đúng điều lệ CLB Doanh Nhân CEO 1983, chia thành 6 nhóm chủ thể:'),
    createCallout(
      'QUY TẮC CỐT LÕI VỀ QUYỀN HẠN:',
      '• Nguyên tắc 1 (Admin & Ban Quản Trị): Mặc định Admin hệ thống cùng các thành viên Ban Quản Trị sở hữu Full quyền hạn (Toàn quyền Tạo, Sửa, Xóa, Phê duyệt, Cấu hình) trên mọi phân hệ.\n' +
      '• Nguyên tắc 2 (Gia hạn hội viên): Chỉ Ban Thành Viên và Admin được quyền thực hiện chức năng Gia hạn niên liễm hội viên.\n' +
      '• Nguyên tắc 3 (Tài chính & Thu chi): Chỉ Ban Tài Chính cùng Admin và Ban Quản Trị mới được hiển thị và thao tác phân hệ Tài chính.\n' +
      '• Nguyên tắc 4 (Truyền thông & Tin bài): Phân hệ Truyền thông chỉ mở cho Admin, Ban Quản Trị và Ban Truyền Thông.\n' +
      '• Nguyên tắc 5 (Soát vé sự kiện QR): Không mở tự do cho mọi người. Khi có sự kiện diễn ra, Ban Quản Trị sẽ chỉ định danh sách nhân sự cụ thể thuộc Ban Truyền Thông mới được hiển thị camera quét mã QR.\n' +
      '• Nguyên tắc 6 (Cuộc họp Online/Offline): Do Admin & Ban Quản Trị ban hành. Nếu là Offline, hệ thống tự động gửi thông báo push và tin nhắn phòng họp đến đại biểu tham gia.\n' +
      '• Nguyên tắc 7 (Hội viên thường): Sở hữu quyền XEM đối với danh mục chung (Danh bạ hội viên, Doanh nghiệp, Sự kiện, Nhà tài trợ, Quyền lợi, Tin tức, Biểu quyết, Cuộc họp) nhưng KHÔNG có quyền thao tác quản trị. Hội viên chỉ THAO TÁC trên dữ liệu của chính mình (Đăng ký sự kiện, Danh thiếp số của tôi, Kết nối cuộc gặp, Nhắn tin, Nhật ký hoạt động).',
      'tip'
    )
  );

  const roleHeaders = ['Vai Trò (Role Code)', 'Tên Vai Trò Thực Tế', 'Phạm Vi Quyền Hạn', 'Trách Nhiệm Nghiệp Vụ'];
  const roleRows = [
    ['ADMIN', 'Quản Trị Viên Kỹ Thuật (Super Admin)', 'Full Quyền (Toàn quyền hệ thống)', 'Quản lý tài khoản, cấu hình tham số, phân quyền nhân sự, giám sát log an ninh CSDL.'],
    ['BAN_QUAN_TRI', 'Ban Quản Trị CLB (Chủ Tịch, Phó Chủ Tịch)', 'Full Quyền Quản Trị Hiệp Hội', 'Phê duyệt hội viên mới, tạo cuộc họp, chỉ định nhân sự soát vé, xem toàn bộ báo cáo tài chính & truyền thông.'],
    ['BAN_THANH_VIEN', 'Ban Thành Viên (Ban Hội Viên)', 'Quản Trị Hồ Sơ & Gia Hạn Hội Viên', 'Thẩm định hồ sơ kết nạp, thực hiện gia hạn niên liễm, theo dõi biến động hội viên, quản lý quyền lợi.'],
    ['BAN_TAI_CHINH', 'Ban Tài Chính & Kế Toán CLB', 'Quản Trị Dòng Tiền & Thu Chi', 'Xem và thao tác phân hệ Tài chính, theo dõi hóa đơn hội phí VietQR, báo cáo tài trợ, lập quỹ hiệp hội.'],
    ['BAN_TRUYEN_THONG', 'Ban Truyền Thông & Sự Kiện', 'Quản Trị Tin Tức & Soát Vé QR', 'Đăng tải bài viết tin tức, quản lý truyền thông sự kiện, quét mã QR soát vé đại biểu khi được BQT chỉ định.'],
    ['HOI_VIEN_THUONG', 'Hội Viên Doanh Nhân Chính Thức', 'Xem Chung + Thao Tác Cá Nhân', 'Xem danh bạ, doanh nghiệp, sự kiện, cuộc họp; Thao tác đăng ký sự kiện, danh thiếp số, đặt lịch hẹn bàn, nhắn tin.']
  ];
  children.push(createTable(roleHeaders, roleRows, [18, 25, 25, 32]));

  addMd('## PHẦN 2: QUY CHẾ PHÂN QUYỀN HỆ THỐNG (RBAC - 6 VAI TRÒ)');
  addMd('| ' + roleHeaders.join(' | ') + ' |');
  addMd('| ' + roleHeaders.map(() => '---').join(' | ') + ' |');
  roleRows.forEach(r => addMd('| ' + r.join(' | ') + ' |'));

  // ==========================================
  // PHẦN 3: MA TRẬN PHÂN QUYỀN CHỨC NĂNG CHI TIẾT
  // ==========================================
  children.push(createHeading1('PHẦN 3: MA TRẬN PHÂN QUYỀN CHỨC NĂNG CHI TIẾT (GRANULAR RBAC MATRIX)'));
  children.push(
    createPara('Đặc tả chi tiết đến từng thao tác: Xem (View), Thêm (Create), Sửa (Update), Xóa (Delete), Phê duyệt (Approve), Xuất dữ liệu (Export), Quét mã QR (Scan QR) cho từng phân hệ cha và chức năng con:')
  );

  const matrixHeaders = ['Phân Hệ Cha', 'Chức Năng Con', 'Thao Tác Cụ Thể', 'Admin', 'Ban Quản Trị', 'Ban Thành Viên', 'Ban Tài Chính', 'Ban Truyền Thông', 'Hội Viên'];
  const matrixRows = [
    // 1. Quản lý Hội viên
    ['1. Quản Trị Hội Viên', 'Hồ sơ Chờ Duyệt (từ Landing)', 'Xem, Thẩm định, Từ chối', 'Có', 'Có', 'Có', 'Không', 'Không', 'Không'],
    ['1. Quản Trị Hội Viên', 'Phê Duyệt Kết Nạp (Approve)', 'Duyệt -> Cấp mã M1983 & Gửi mail', 'Có', 'Có', 'Không', 'Không', 'Không', 'Không'],
    ['1. Quản Trị Hội Viên', 'Danh Bạ Toàn Bộ Hội Viên', 'Xem danh sách & Hồ sơ 360°', 'Có', 'Có', 'Có', 'Có', 'Có', 'Chỉ Xem'],
    ['1. Quản Trị Hội Viên', 'Chỉnh Sửa Hồ Sơ Hội Viên', 'Cập nhật chức vụ, công ty, ngành', 'Có', 'Có', 'Có', 'Không', 'Không', 'Chỉ hồ sơ mình'],
    ['1. Quản Trị Hội Viên', 'Gia Hạn Hội Viên (Renewal)', 'Gia hạn niên liễm +365 ngày', 'Có', 'Không', 'Có', 'Không', 'Không', 'Không'],
    ['1. Quản Trị Hội Viên', 'Xuất File Excel Danh Bạ', 'Export danh sách hội viên VIP', 'Có', 'Có', 'Có', 'Không', 'Không', 'Không'],

    // 2. Tài chính & Quỹ hội
    ['2. Quản Trị Tài Chính', 'Tổng Quan Thu Chi Quỹ', 'Xem biểu đồ doanh thu, số dư quỹ', 'Có', 'Có', 'Không', 'Có', 'Không', 'Không'],
    ['2. Quản Trị Tài Chính', 'Hóa Đơn Hội Phí VietQR', 'Tạo hóa đơn, gạch nợ thủ công', 'Có', 'Có', 'Không', 'Có', 'Không', 'Không'],
    ['2. Quản Trị Tài Chính', 'Quản Lý Nhà Tài Trợ & Gói', 'Tạo gói tài trợ, theo dõi giải ngân', 'Có', 'Có', 'Không', 'Có', 'Không', 'Chỉ Xem'],
    ['2. Quản Trị Tài Chính', 'Báo Cáo Quyết Toán Sự Kiện', 'Lập báo cáo tài chính gala đại hội', 'Có', 'Có', 'Không', 'Có', 'Không', 'Chỉ Xem'],

    // 3. Truyền thông & Tin tức
    ['3. Truyền Thông', 'Đăng Bài Viết Tin Tức CLB', 'Tạo bài viết, tải ảnh banner', 'Có', 'Có', 'Không', 'Không', 'Có', 'Không'],
    ['3. Truyền Thông', 'Kiểm Duyệt & Xuất Bản Tin', 'Phê duyệt hiển thị lên App Mobile', 'Có', 'Có', 'Không', 'Không', 'Có', 'Không'],
    ['3. Truyền Thông', 'Bảng Tin Hoạt Động & Sự Kiện', 'Xem tin tức hiệp hội', 'Có', 'Có', 'Có', 'Có', 'Có', 'Chỉ Xem'],

    // 4. Quản lý Sự kiện & Soát vé
    ['4. Quản Trị Sự Kiện', 'Khởi Tạo Sự Kiện Mới', 'Tạo gala, đại hội, sơ đồ bàn VIP', 'Có', 'Có', 'Không', 'Không', 'Có', 'Không'],
    ['4. Quản Trị Sự Kiện', 'Chỉ Định Nhân Sự Soát Vé', 'Gán quyền quét QR cho nhân sự BTT', 'Có', 'Có', 'Không', 'Không', 'Không', 'Không'],
    ['4. Quản Trị Sự Kiện', 'Quét Mã QR Soát Vé (Camera)', 'Soát vé đại biểu tại cổng vào', 'Có', 'Có', 'Không', 'Không', 'Khi được gán', 'Không'],
    ['4. Quản Trị Sự Kiện', 'Đăng Ký Tham Dự Sự Kiện', 'Đăng ký vé và nhận cuống vé QR', 'Có', 'Có', 'Có', 'Có', 'Có', 'Vé của mình'],
    ['4. Quản Trị Sự Kiện', 'Bốc Thăm May Mắn (Lucky Draw)', 'Quay số trúng thưởng đêm gala', 'Có', 'Có', 'Không', 'Không', 'Có', 'Chỉ Xem'],

    // 5. Cuộc họp & Nghị quyết
    ['5. Quản Trị Cuộc Họp', 'Tạo Cuộc Họp Online / Offline', 'Lập lịch họp, chọn hình thức', 'Có', 'Có', 'Không', 'Không', 'Không', 'Không'],
    ['5. Quản Trị Cuộc Họp', 'Gửi Địa Chỉ, Ngày Giờ Offline', 'Tự động gửi push & tin nhắn SMS/App', 'Có', 'Có', 'Không', 'Không', 'Không', 'Không'],
    ['5. Quản Trị Cuộc Họp', 'Điểm Danh & Biên Bản Cuộc Họp', 'Ghi nhận đại biểu có mặt, kết luận', 'Có', 'Có', 'Không', 'Không', 'Không', 'Chỉ Xem'],

    // 6. Kết nối & Nhắn tin B2B
    ['6. Kết Nối & Nhắn Tin', 'Nhắn Tin 1-1 Trên Web CRM', 'Gửi tin nhắn văn bản, danh thiếp B2B', 'Có', 'Có', 'Có', 'Có', 'Có', 'Tin nhắn mình'],
    ['6. Kết Nối & Nhắn Tin', 'Hẹn Gặp Bàn Tròn (1-on-1)', 'Lên lịch hẹn bàn giao thương', 'Có', 'Có', 'Có', 'Có', 'Có', 'Lịch hẹn mình'],

    // 7. Sàn Thương Mại & Cơ Hội B2B
    ['7. Giao Thương B2B', 'Đăng Bài Sản Phẩm / Nhu Cầu', 'Đăng chào mua/chào bán B2B', 'Có', 'Có', 'Có', 'Có', 'Có', 'Bài của mình'],
    ['7. Giao Thương B2B', 'Kiểm Duyệt Sản Phẩm', 'Duyệt bài hiển thị sàn thương mại', 'Có', 'Có', 'Không', 'Không', 'Không', 'Không'],

    // 8. Biểu quyết & Bầu cử
    ['8. Biểu Quyết Trực Tuyến', 'Tạo Phiếu Biểu Quyết Mới', 'Tạo câu hỏi bầu cử, thăm dò ý kiến', 'Có', 'Có', 'Không', 'Không', 'Không', 'Không'],
    ['8. Biểu Quyết Trực Tuyến', 'Thực Hiện Bỏ Phiếu (Vote)', 'Chọn phương án và bấm xác nhận', 'Có', 'Có', 'Có', 'Có', 'Có', 'Bỏ phiếu mình']
  ];
  children.push(createTable(matrixHeaders, matrixRows, [16, 20, 20, 7, 9, 8, 8, 9, 11]));

  addMd('## PHẦN 3: MA TRẬN PHÂN QUYỀN CHỨC NĂNG CHI TIẾT');
  addMd('| ' + matrixHeaders.join(' | ') + ' |');
  addMd('| ' + matrixHeaders.map(() => '---').join(' | ') + ' |');
  matrixRows.forEach(r => addMd('| ' + r.join(' | ') + ' |'));

  // ==========================================
  // PHẦN 4: BẢN ĐỒ NGHIỆP VỤ & LUỒNG XỬ LÝ DỮ LIỆU
  // ==========================================
  children.push(createHeading1('PHẦN 4: BẢN ĐỒ NGHIỆP VỤ & LUỒNG XỬ LÝ DỮ LIỆU (DATA FLOWS)'));

  children.push(createHeading2('4.1 Luồng Xét Duyệt Hội Viên Mới Từ Web Landing (Không Còn Mục Doanh Thu)'));
  children.push(
    createPara('• Bối cảnh: Đơn vị tổ chức đã tinh gọn thủ tục đăng ký trên Web Landing bằng cách loại bỏ hoàn toàn trường nhập "Doanh thu công ty", giúp tăng tỷ lệ chuyển đổi nộp hồ sơ.\n' +
      '• Bước 1: Ứng viên truy cập Web Landing CEO 1983, điền form gồm: Họ và Tên, Số điện thoại / Zalo, Doanh nghiệp & Chức vụ, Lĩnh vực hoạt động. (Không có mục Doanh thu).\n' +
      '• Bước 2: Dữ liệu gửi qua API POST /api/members/apply và lưu vào bảng members với trạng thái status = "pending".\n' +
      '• Bước 3: Hồ sơ xuất hiện trong mục "Hồ sơ chờ phê duyệt" trên Web CRM. Ban Thành Viên kiểm tra tính xác thực pháp nhân của doanh nghiệp.\n' +
      '• Bước 4: Duyệt kết nạp (Chỉ Admin hoặc Ban Quản Trị có quyền bấm "Phê duyệt"):\n' +
      '  - Hệ thống cập nhật members.status = "active".\n' +
      '  - Tự động sinh mã hội viên độc quyền (Ví dụ: M1983-099).\n' +
      '  - Tự động tạo bản ghi tài khoản người dùng trong bảng vione_users với mật khẩu ngẫu nhiên an toàn.\n' +
      '  - Tự động kích hoạt dịch vụ Mailer gửi email thông báo kết nạp chính thức kèm tài khoản và mật khẩu đăng nhập App cho hội viên.\n' +
      '  - Tự động khởi tạo Danh thiếp số thông minh trong member_business_cards.')
  );

  children.push(createHeading2('4.2 Luồng Phân Công & Kiểm Soát Soát Vé QR Sự Kiện'));
  children.push(
    createPara('• Bối cảnh: Tránh tình trạng lộn xộn hoặc lộ lọt quyền kiểm soát vé tại cửa ra vào các đại hội gala lớn.\n' +
      '• Bước 1: Ban Quản Trị hoặc Admin mở Web CRM tại chi tiết sự kiện, vào tab "Phân công Soát vé".\n' +
      '• Bước 2: Hệ thống chỉ cho phép lựa chọn những nhân sự có vai trò thuộc Ban Truyền Thông (role = "BAN_TRUYEN_THONG"). BQT tích chọn các thành viên được phân công làm nhiệm vụ soát vé và bấm Lưu.\n' +
      '• Bước 3: Dữ liệu ghi vào bảng event_scanners (event_id, user_id, assigned_by, status = "active").\n' +
      '• Bước 4: Trên App Mobile của nhân sự Ban Truyền Thông được chỉ định, giao diện tự động xuất hiện nút quét camera "Soát vé sự kiện". Đối với tất cả hội viên và nhân sự khác không được gán, nút này hoàn toàn bị ẩn.\n' +
      '• Bước 5: Khi khách đến, nhân sự quét mã QR trên vé đại biểu. Hệ thống tra cứu bảng event_registrations, kiểm tra tính hợp lệ, vị trí bàn VIP, đổi is_checked_in = true, lưu scanned_by_user_id và đồng bộ realtime lên màn hình Web CRM của Ban Tổ Chức.')
  );

  children.push(createHeading2('4.3 Luồng Gia Hạn Niên Liễm Hội Viên'));
  children.push(
    createPara('• Bối cảnh: Hội viên cần gia hạn thẻ thường niên sau mỗi 365 ngày.\n' +
      '• Quyền thực hiện: Chỉ có Ban Thành Viên và Admin mới được cấp quyền thực hiện gia hạn hội viên trên Web CRM.\n' +
      '• Bước 1: Ban Thành Viên lọc danh sách hội viên sắp hết hạn hoặc đã hết hạn niên liễm (status = "expired").\n' +
      '• Bước 2: Khi nhận được ủy nhiệm chi hoặc đối soát thành công từ Ban Tài Chính, Ban Thành Viên mở hồ sơ và bấm nút "Gia hạn niên liễm".\n' +
      '• Bước 3: Hệ thống tạo bản ghi mới trong bảng memberships, cập nhật ngày bắt đầu (start_date) và ngày kết thúc mới (expires_at = hiện tại + 365 ngày), đồng thời cập nhật invoices.status = "paid".\n' +
      '• Bước 4: Ứng dụng di động của hội viên tự động đổi màu thẻ từ xám tạm khóa sang Vàng ánh kim Navy chính thức.')
  );

  children.push(createHeading2('4.4 Luồng Tổ Chức Cuộc Họp Thông Minh (Online / Offline)'));
  children.push(
    createPara('• Quyền hạn: Chỉ Admin và Ban Quản Trị mới có quyền tạo và điều hành cuộc họp.\n' +
      '• Bước 1: BQT vào Web CRM mục "Quản trị Cuộc họp" -> Bấm "Tạo cuộc họp mới".\n' +
      '• Bước 2: Thiết lập thông tin: Tiêu đề cuộc họp, Chương trình nghị sự, Ngày giờ bắt đầu, Ngày giờ kết thúc, Thành phần tham gia (Toàn thể CLB, hoặc Ban chuyên môn).\n' +
      '• Bước 3: Chọn Hình Thức Cuộc Họp:\n' +
      '  - Trường hợp 1: Họp Online -> Nhập đường link phòng họp trực tuyến (Google Meet / Zoom) kèm mật khẩu phòng.\n' +
      '  - Trường hợp 2: Họp Offline -> Bắt buộc nhập: Địa chỉ địa điểm tổ chức, Tên phòng họp, Bản đồ chỉ đường và Ghi chú trang phục.\n' +
      '• Bước 4: Khi BQT bấm "Ban hành cuộc họp":\n' +
      '  - Nếu là cuộc họp Offline: Hệ thống tự động kích hoạt luồng thông báo đa kênh, bắn Notification đẩy xuống điện thoại đại biểu và tự động tạo 1 Tin nhắn trực tiếp gửi địa chỉ ngày giờ vào Hộp thư nội bộ của từng hội viên tham gia.\n' +
      '• Bước 5: Hội viên mở thông báo để xác nhận tham dự (Có mặt / Vắng mặt có lý do) và theo dõi tài liệu cuộc họp.')
  );

  children.push(createHeading2('4.5 Luồng Kết Nối & Nhắn Tin Giao Thương B2B Trực Tiếp Trên Web CRM'));
  children.push(
    createPara('• Bối cảnh: Cho phép hội viên khi sử dụng Web CRM trên máy tính vẫn có thể nhắn tin trao đổi kinh doanh liền mạch với các doanh nhân khác mà không cần cầm điện thoại.\n' +
      '• Bước 1: Hội viên truy cập phân hệ "Tin Nhắn & Kết Nối" trên Web CRM.\n' +
      '• Bước 2: Chọn một doanh nhân từ danh bạ hoặc từ danh sách cơ hội giao thương B2B -> Bấm "Nhắn tin kết nối".\n' +
      '• Bước 3: Giao diện mở cửa sổ chat 2 cột: Danh sách hội thoại bên trái, Nội dung chat thời gian thực bên phải. Hỗ trợ gửi tin nhắn văn bản, chia sẻ danh thiếp số điện tử, gửi đường link sản phẩm và lên lịch hẹn bàn 1-on-1.\n' +
      '• Bước 4: Dữ liệu tin nhắn lưu trữ mã hóa trong bảng chat_messages và đồng bộ tức thì với App Hiệp Hội CEO 1983 trên di động qua giao thức WebSocket.')
  );

  addMd('## PHẦN 4: BẢN ĐỒ NGHIỆP VỤ & CÁC LUỒNG XỬ LÝ DỮ LIỆU CHÍNH\n' +
    '1. Luồng Xét duyệt Hội viên (Đã bỏ doanh thu trên Landing, BQT/Admin duyệt sinh mã M1983-xxx và gửi email tài khoản).\n' +
    '2. Luồng Phân công Soát vé QR (Chỉ định nhân sự Ban Truyền thông, gạch vé thời gian thực).\n' +
    '3. Luồng Gia hạn Niên liễm (Ban Thành viên và Admin thực hiện, gia hạn 365 ngày).\n' +
    '4. Luồng Cuộc họp Online/Offline (Admin/BQT tạo; Offline tự động gửi thông báo push và tin nhắn địa chỉ ngày giờ).\n' +
    '5. Luồng Kết nối & Nhắn tin B2B trên Web CRM (Đồng bộ tức thì với App di động).');

  // ==========================================
  // PHẦN 5: ĐẶC TẢ CHI TIẾT TỪNG PHÂN HỆ, APIS & CSDL
  // ==========================================
  children.push(createHeading1('PHẦN 5: ĐẶC TẢ CHI TIẾT APIS, BẢNG CSDL & PHÉP JOIN'));

  // 5.1 Quản trị Tài khoản & Phân quyền
  children.push(createHeading2('5.1 Quản Trị Tài Khoản & Phân Quyền Vai Trò (Authentication & RBAC APIs)'));
  const authApiHeaders = ['API Endpoint', 'Phương Thức', 'Mô Tả Chức Năng', 'Phân Quyền Cho Phép', 'Bảng CSDL Xử Lý'];
  const authApiRows = [
    ['/api/auth/login', 'POST', 'Đăng nhập vào hệ thống CRM', 'Mọi người dùng', 'vione_users, auth_sessions'],
    ['/api/auth/me', 'GET', 'Lấy thông tin tài khoản và danh sách quyền', 'Đã đăng nhập', 'vione_users, user_roles'],
    ['/api/admin/users', 'GET', 'Danh sách cán bộ quản trị và hội viên', 'ADMIN, BAN_QUAN_TRI', 'vione_users JOIN user_roles'],
    ['/api/admin/users/:id/role', 'PUT', 'Phân bổ hoặc thay đổi ban chuyên môn', 'ADMIN', 'user_roles, audit_logs']
  ];
  children.push(createTable(authApiHeaders, authApiRows, [24, 12, 28, 18, 18]));

  children.push(createHeading3('Cấu Trúc Bảng CSDL Chính: vione_users (Tủ Tài Khoản Quản Trị & Hội Viên)'));
  const userColHeaders = ['Tên Cột (Field)', 'Kiểu Dữ Liệu', 'Bắt Buộc?', 'Khóa (Key)', 'Giải Thích Dễ Hiểu'];
  const userColRows = [
    ['id', 'UUID', 'Có', 'PK', 'Mã định danh duy nhất của tài khoản người dùng.'],
    ['email', 'VARCHAR(255)', 'Có', 'UNIQUE', 'Địa chỉ email dùng để đăng nhập và nhận thông báo.'],
    ['password_hash', 'VARCHAR(255)', 'Có', 'None', 'Mật khẩu đã được mã hóa bảo mật Bcrypt một chiều.'],
    ['full_name', 'VARCHAR(255)', 'Có', 'None', 'Họ và tên đầy đủ của cán bộ hoặc hội viên.'],
    ['phone', 'VARCHAR(20)', 'Không', 'None', 'Số điện thoại liên lạc cá nhân / Zalo.'],
    ['role', 'VARCHAR(50)', 'Có', 'None', 'Vai trò: "ADMIN", "BAN_QUAN_TRI", "BAN_THANH_VIEN", "BAN_TAI_CHINH", "BAN_TRUYEN_THONG", "HOI_VIEN".'],
    ['department', 'VARCHAR(100)', 'Không', 'None', 'Ban chuyên môn: Ban Quản Trị, Ban Thành Viên, Ban Tài Chính, Ban Truyền Thông.'],
    ['is_active', 'BOOLEAN', 'Có', 'None', 'Trạng thái hoạt động (true = Đang mở, false = Tạm khóa).'],
    ['created_at', 'TIMESTAMPTZ', 'Có', 'None', 'Thời điểm tài khoản được tạo trong hệ thống.']
  ];
  children.push(createTable(userColHeaders, userColRows, [20, 18, 12, 18, 32]));

  // 5.2 Quản trị Hội viên & Xét duyệt
  children.push(createHeading2('5.2 Quản Trị Hội Viên & Quy Trình Xét Duyệt Gia Nhập (Members Management)'));
  const memApiHeaders = ['API Endpoint', 'Phương Thức', 'Mô Tả Chức Năng', 'Phân Quyền Cho Phép', 'Bảng CSDL Xử Lý'];
  const memApiRows = [
    ['/api/members/apply', 'POST', 'Ứng viên nộp hồ sơ từ Web Landing (Không có doanh thu)', 'Công khai (Public)', 'members (status = pending)'],
    ['/api/admin/members/pending', 'GET', 'Danh sách hồ sơ chờ thẩm định', 'ADMIN, BAN_QUAN_TRI, BAN_THANH_VIEN', 'members WHERE status = pending'],
    ['/api/admin/members/:id/approve', 'POST', 'Phê duyệt kết nạp, cấp mã M1983-xxx & gửi email mật khẩu', 'ADMIN, BAN_QUAN_TRI', 'members, vione_users, mail_logs'],
    ['/api/admin/members/:id/renew', 'POST', 'Gia hạn niên liễm hội viên thêm 365 ngày', 'ADMIN, BAN_THANH_VIEN', 'memberships, invoices, members'],
    ['/api/admin/members', 'GET', 'Danh bạ toàn bộ hội viên hiệp hội', 'Tất cả các vai trò', 'members JOIN memberships']
  ];
  children.push(createTable(memApiHeaders, memApiRows, [26, 12, 26, 18, 18]));

  children.push(createHeading3('Cấu Trúc Bảng CSDL Chính: members (Tủ Hồ Sơ Lý Lịch Hội Viên)'));
  const memColHeaders = ['Tên Cột (Field)', 'Kiểu Dữ Liệu', 'Bắt Buộc?', 'Khóa (Key)', 'Giải Thích Dễ Hiểu'];
  const memColRows = [
    ['id', 'UUID', 'Có', 'PK', 'Mã hồ sơ hội viên duy nhất.'],
    ['user_id', 'UUID', 'Không', 'FK -> vione_users.id', 'Liên kết sang tài khoản đăng nhập khi đã duyệt.'],
    ['member_code', 'VARCHAR(50)', 'Không', 'UNIQUE', 'Mã hội viên chính thức (Ví dụ: M1983-001, M1983-088).'],
    ['full_name', 'VARCHAR(255)', 'Có', 'None', 'Họ và tên của CEO doanh nghiệp.'],
    ['company_name', 'VARCHAR(255)', 'Có', 'None', 'Tên doanh nghiệp / Công ty đại diện.'],
    ['position_title', 'VARCHAR(150)', 'Không', 'None', 'Chức danh quản lý (Chủ tịch, Tổng Giám Đốc, CEO).'],
    ['industry', 'VARCHAR(100)', 'Có', 'None', 'Ngành nghề hoạt động kinh doanh.'],
    ['status', 'VARCHAR(30)', 'Có', 'None', 'Trạng thái: "pending" (Chờ duyệt), "active" (Chính thức), "expired" (Hết hạn).'],
    ['joined_at', 'TIMESTAMPTZ', 'Không', 'None', 'Ngày chính thức được Ban Thường Vụ phê duyệt gia nhập.']
  ];
  children.push(createTable(memColHeaders, memColRows, [20, 18, 12, 18, 32]));

  // 5.3 Quản trị Cuộc họp Thông minh (Online / Offline)
  children.push(createHeading2('5.3 Quản Trị Cuộc Họp Thông Minh (Online / Offline Meetings)'));
  const meetApiHeaders = ['API Endpoint', 'Phương Thức', 'Mô Tả Chức Năng', 'Phân Quyền Cho Phép', 'Bảng CSDL Xử Lý'];
  const meetApiRows = [
    ['/api/meetings', 'POST', 'Tạo cuộc họp mới (Online hoặc Offline)', 'ADMIN, BAN_QUAN_TRI', 'meetings, meeting_attendees'],
    ['/api/meetings/:id/broadcast', 'POST', 'Gửi địa chỉ, ngày giờ họp Offline qua thông báo và tin nhắn', 'ADMIN, BAN_QUAN_TRI', 'notifications, chat_messages'],
    ['/api/meetings', 'GET', 'Xem lịch danh sách các cuộc họp CLB', 'Tất cả các vai trò (Hội viên chỉ xem)', 'meetings JOIN meeting_attendees'],
    ['/api/meetings/:id/rsvp', 'POST', 'Hội viên xác nhận tham gia hoặc báo vắng', 'HOI_VIEN, BAN CHUYÊN MÔN', 'meeting_attendees']
  ];
  children.push(createTable(meetApiHeaders, meetApiRows, [26, 12, 26, 18, 18]));

  children.push(createHeading3('Cấu Trúc Bảng CSDL Chính: meetings (Tủ Hồ Sơ Cuộc Họp CLB)'));
  const meetColHeaders = ['Tên Cột (Field)', 'Kiểu Dữ Liệu', 'Bắt Buộc?', 'Khóa (Key)', 'Giải Thích Dễ Hiểu'];
  const meetColRows = [
    ['id', 'UUID', 'Có', 'PK', 'Mã cuộc họp duy nhất.'],
    ['title', 'VARCHAR(255)', 'Có', 'None', 'Tiêu đề cuộc họp (Ví dụ: Họp Ban Quản Trị Quý 1/2026).'],
    ['meeting_type', 'VARCHAR(30)', 'Có', 'None', 'Hình thức: "online" (Họp từ xa), "offline" (Họp trực tiếp).'],
    ['start_time', 'TIMESTAMPTZ', 'Có', 'None', 'Thời điểm bắt đầu cuộc họp.'],
    ['end_time', 'TIMESTAMPTZ', 'Có', 'None', 'Thời điểm kết thúc cuộc họp.'],
    ['location_address', 'TEXT', 'Không', 'None', 'Địa chỉ nơi tổ chức (Bắt buộc nếu meeting_type = offline).'],
    ['online_link', 'TEXT', 'Không', 'None', 'Đường dẫn phòng họp Zoom / Google Meet (Nếu online).'],
    ['created_by_user_id', 'UUID', 'Có', 'FK -> vione_users.id', 'Cán bộ Admin hoặc Ban Quản Trị ban hành cuộc họp.'],
    ['status', 'VARCHAR(30)', 'Có', 'None', 'Trạng thái: "scheduled", "happening", "completed", "cancelled".']
  ];
  children.push(createTable(meetColHeaders, meetColRows, [20, 18, 12, 18, 32]));

  // 5.4 Quản trị Sự kiện & Soát vé QR
  children.push(createHeading2('5.4 Quản Trị Sự Kiện & Phân Công Soát Vé QR (Events & QR Check-in)'));
  const evtApiHeaders = ['API Endpoint', 'Phương Thức', 'Mô Tả Chức Năng', 'Phân Quyền Cho Phép', 'Bảng CSDL Xử Lý'];
  const evtApiRows = [
    ['/api/events', 'POST', 'Khởi tạo sự kiện đại hội gala mới', 'ADMIN, BAN_QUAN_TRI, BAN_TRUYEN_THONG', 'events, event_ticket_types'],
    ['/api/events/:id/scanners/assign', 'POST', 'BQT chỉ định nhân sự Ban Truyền Thông quét QR', 'ADMIN, BAN_QUAN_TRI', 'event_scanners'],
    ['/api/events/checkin/lookup', 'GET', 'Quét camera đọc mã QR vé đại biểu', 'Nhân sự BTT được chỉ định', 'event_registrations JOIN members'],
    ['/api/events/checkin/confirm', 'POST', 'Xác nhận gạch vé vào cửa thành công', 'Nhân sự BTT được chỉ định', 'event_registrations, checkin_logs']
  ];
  children.push(createTable(evtApiHeaders, evtApiRows, [26, 12, 26, 18, 18]));

  children.push(createHeading3('Cấu Trúc Bảng CSDL: event_scanners (Bảng Chỉ Định Nhân Sự Soát Vé)'));
  const scColHeaders = ['Tên Cột (Field)', 'Kiểu Dữ Liệu', 'Bắt Buộc?', 'Khóa (Key)', 'Giải Thích Dễ Hiểu'];
  const scColRows = [
    ['id', 'UUID', 'Có', 'PK', 'Mã bản ghi chỉ định soát vé.'],
    ['event_id', 'UUID', 'Có', 'FK -> events.id', 'Sự kiện diễn ra cần soát vé.'],
    ['user_id', 'UUID', 'Có', 'FK -> vione_users.id', 'Nhân sự Ban Truyền Thông được Ban Quản Trị chỉ định.'],
    ['assigned_by', 'UUID', 'Có', 'FK -> vione_users.id', 'Cán bộ BQT đã thực hiện gán quyền.'],
    ['created_at', 'TIMESTAMPTZ', 'Có', 'None', 'Thời điểm phê duyệt quyền quét QR.']
  ];
  children.push(createTable(scColHeaders, scColRows, [20, 18, 12, 18, 32]));

  // 5.5 Quản trị Tài chính & Hóa đơn VietQR
  children.push(createHeading2('5.5 Quản Trị Tài Chính, Niên Liễm & Hóa Đơn VietQR (Finance Management)'));
  children.push(createPara('Chỉ mở cho Admin, Ban Quản Trị và Ban Tài Chính. Tự động phát hành thông báo nộp hội phí và đối soát ngân hàng.'));
  const finApiHeaders = ['API Endpoint', 'Phương Thức', 'Mô Tả Chức Năng', 'Phân Quyền Cho Phép', 'Bảng CSDL Xử Lý'];
  const finApiRows = [
    ['/api/fees/invoices/generate', 'POST', 'Phát hành thông báo hội phí niên khóa mới', 'ADMIN, BAN_TAI_CHINH', 'invoices (sinh mã VietQR 24/7)'],
    ['/api/fees/invoices/unpaid', 'GET', 'Danh sách hội viên chưa hoàn thành đóng phí', 'ADMIN, BAN_QUAN_TRI, BAN_TAI_CHINH', 'invoices JOIN members'],
    ['/api/admin/fees/:id/toggle', 'PUT', 'Gạch nợ thủ công khi đối soát dòng tiền', 'ADMIN, BAN_TAI_CHINH', 'invoices, bank_transactions'],
    ['/api/sponsorships/reports', 'GET', 'Báo cáo tổng hợp tiền tài trợ từ các nhà tài trợ', 'ADMIN, BAN_QUAN_TRI, BAN_TAI_CHINH', 'sponsorships JOIN events']
  ];
  children.push(createTable(finApiHeaders, finApiRows, [26, 12, 26, 18, 18]));

  // ==========================================
  // PHẦN 6: MA TRẬN QUAN HỆ CSDL (ERD MATRIX) & SQL JOIN
  // ==========================================
  children.push(createHeading1('PHẦN 6: MA TRẬN QUAN HỆ THỰC THỂ CSDL (ERD MATRIX) & SQL JOIN MẪU'));
  const erdHeaders = ['Bảng Gốc (Table A)', 'Bảng Đích (Table B)', 'Điều Kiện Khóa Ngoại (ON Clause)', 'Mối Quan Hệ', 'Ý Nghĩa Nghiệp Vụ'];
  const erdRows = [
    ['vione_users', 'members', 'vione_users.id = members.user_id', '1 - 1', 'Một tài khoản người dùng gắn liền với một lý lịch hội viên.'],
    ['members', 'memberships', 'members.id = memberships.member_id', '1 - Nhiều', 'Hội viên sở hữu nhiều niên khóa hội viên qua các năm.'],
    ['events', 'event_scanners', 'events.id = event_scanners.event_id', '1 - Nhiều', 'Một sự kiện có nhiều nhân sự Ban Truyền thông được chỉ định soát vé.'],
    ['event_scanners', 'vione_users', 'event_scanners.user_id = vione_users.id', 'Nhiều - 1', 'Liên kết sang tài khoản nhân sự được trao quyền quét camera.'],
    ['events', 'event_registrations', 'events.id = event_registrations.event_id', '1 - Nhiều', 'Một sự kiện phát hành hàng trăm cuống vé đại biểu có mã QR.'],
    ['meetings', 'meeting_attendees', 'meetings.id = meeting_attendees.meeting_id', '1 - Nhiều', 'Một cuộc họp Online/Offline có danh sách nhiều đại biểu tham gia.'],
    ['members', 'invoices', 'members.id = invoices.member_id', '1 - Nhiều', 'CLB phát hành các thông báo hội phí niên liễm cho hội viên.']
  ];
  children.push(createTable(erdHeaders, erdRows, [16, 18, 28, 12, 26]));

  children.push(
    createCallout(
      'CÂU LỆNH SQL JOIN MẪU: KIỂM TRA QUYỀN SOÁT VÉ BAN TRUYỀN THÔNG TẠI SỰ KIỆN:',
      'SELECT esc.id AS assignment_id, u.full_name AS scanner_name, u.role, u.department, e.title AS event_title ' +
      'FROM event_scanners esc ' +
      'INNER JOIN vione_users u ON esc.user_id = u.id ' +
      'INNER JOIN events e ON esc.event_id = e.id ' +
      'WHERE esc.event_id = :current_event_id AND u.id = :logged_in_user_id;\n\n' +
      '* Giải thích bình dân: Khi nhân sự mở chức năng quét mã QR trên điện thoại, máy tính soi vào tủ event_scanners xem người này có được Ban Quản Trị chỉ định cho sự kiện này hay không. Nếu có đúng dòng hồ sơ kẹp ghim, camera mới mở ra.',
      'tip'
    )
  );

  // ==========================================
  // PHẦN 7: KỊCH BẢN KIỂM THỬ NGHIỆM THU (TEST CASES)
  // ==========================================
  children.push(createHeading1('PHẦN 7: KỊCH BẢN KIỂM THỬ NGHIỆM THU (ACCEPTANCE TEST CASES)'));
  const tcHeaders = ['Mã TC', 'Tên Nghiệp Vụ', 'Vai Trò Thực Hiện', 'Thao Tác Thực Hiện', 'Kỳ Vọng Kỹ Thuật', 'Kỳ Vọng Giao Diện'];
  const tcRows = [
    ['TC_CRM_01', 'Đăng ký Landing không có doanh thu', 'Ứng viên mới', 'Điền đơn gia nhập trên Landing web', 'API POST /api/members/apply không gửi trường revenue; CSDL lưu status = pending', 'Hiển thị popup thông báo Nộp đơn thành công, chờ thẩm định'],
    ['TC_CRM_02', 'BQT / Admin phê duyệt kết nạp', 'Ban Quản Trị / Admin', 'Nhấn nút "Phê duyệt" tại hồ sơ pending', 'status = active, cấp mã M1983-xxx, gửi mail mật khẩu qua mailer', 'Thẻ đổi sang màu xanh Hoạt động, hiển thị mã hội viên mới'],
    ['TC_CRM_03', 'Chỉ định nhân sự quét QR sự kiện', 'Ban Quản Trị', 'Chọn sự kiện, gán nhân sự Ban Truyền thông', 'Lưu bản ghi vào bảng event_scanners với status active', 'Nhân sự BTT mở app thấy nút Soát vé; Hội viên thường không thấy'],
    ['TC_CRM_04', 'Ban Thành viên gia hạn hội viên', 'Ban Thành Viên', 'Bấm nút "Gia hạn" trên hồ sơ hội viên', 'Thêm 365 ngày vào memberships.expires_at, hóa đơn đổi paid', 'Thời hạn thẻ tự động cập nhật đến năm tiếp theo'],
    ['TC_CRM_05', 'Tạo cuộc họp Offline gửi tin nhắn', 'Ban Quản Trị / Admin', 'Tạo họp Offline -> Bấm Ban hành', 'Hệ thống push notification và insert tin nhắn vào chat_messages', 'Hội viên nhận thông báo đẩy và tin nhắn địa chỉ, ngày giờ họp'],
    ['TC_CRM_06', 'Phân quyền phân hệ Tài chính', 'Hội viên thường', 'Cố gắng truy cập menu Tài chính', 'Hệ thống chặn quyền (HTTP 403 Forbidden)', 'Menu Tài chính bị ẩn hoàn toàn trên thanh điều hướng'],
    ['TC_CRM_07', 'Nhắn tin B2B trên Web CRM', 'Hội viên chính thức', 'Mở chat CRM, gửi tin nhắn cho hội viên khác', 'Lưu vào chat_messages, phát socket thời gian thực', 'Tin nhắn hiển thị ngay trong bong bóng chat của người nhận']
  ];
  children.push(createTable(tcHeaders, tcRows, [10, 18, 14, 20, 20, 18]));

  addMd('## PHẦN 7: KỊCH BẢN KIỂM THỬ NGHIỆM THU CHẤP THUẬN (UAT)');
  addMd('| ' + tcHeaders.join(' | ') + ' |');
  addMd('| ' + tcHeaders.map(() => '---').join(' | ') + ' |');
  tcRows.forEach(r => addMd('| ' + r.join(' | ') + ' |'));

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

module.exports = { buildDoc1 };
