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

function buildDoc3() {
  const hf = createHeaderFooter('App ViOne Connect');
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
          text: 'ỨNG DỤNG MẠNG LƯỚI GIAO THƯƠNG VIONE CONNECT (BUSINESS CONNECT)',
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
          text: 'Danh Thiếp Số 3D Gyro, Chạm NFC 1-Chạm, Ghép Cặp AI Matchmaking, Thu Thập Leads B2B & Lên Lịch Hẹn Giao Thương',
          font: 'Times New Roman',
          size: 22,
          italics: true,
          color: '64748B',
        }),
      ],
    })
  );

  addMd('# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & THIẾT KẾ CƠ SỞ DỮ LIỆU');
  addMd('## ỨNG DỤNG MẠNG LƯỚI GIAO THƯƠNG VIONE CONNECT (BUSINESS CONNECT)');
  addMd('*Phiên bản: Version 3.0 - Bản Chuẩn Hoá Toàn Diện Master BA*');

  const metaHeaders = ['Mục Quản Trị', 'Thông Tin Chi Tiết'];
  const metaRows = [
    ['Tên Ứng Dụng', 'ViOne Connect (Business Connect Mobile App & PWA)'],
    ['Mã Tài Liệu', 'SRS-VIONE-CONNECT-V3.0'],
    ['Phiên Bản', 'Version 3.0 - Master BA Comprehensive Standard'],
    ['Tác Giả & Thẩm Định', 'Master Business Analyst, Solution Architect & ViOne Ecosystem Core Team'],
    ['Đối Tượng Sử Dụng', 'Chủ tịch, CEO Doanh nghiệp B2B, Giám đốc Kinh doanh (CCO), Đại diện Thương mại'],
    ['Nền Tảng Triển Khai', 'PWA Mobile Web & Mobile App (Android APK, iOS qua Capacitor / React 19)'],
    ['Phong Cách Thiết Kế', 'Trắng Titanium & Vàng Đồng Ánh Kim (Chuẩn Figma ViOne Gold White node-id=187-985)'],
    ['Công Nghệ Cốt Lõi', 'Web NFC API, WebRTC, WebSocket, Thuật toán AI Matching Vector Cosine, PostgreSQL ACID']
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
    createPara('Ứng dụng ViOne Connect đóng vai trò như một Trợ Lý Giao Thương & Danh Thiếp Số Vạn Năng của mỗi doanh nhân:'),
    createCallout(
      'HÌNH TƯỢNG VÍ VON ĐỜI THƯỜNG DỄ HIỂU NHẤT:',
      '1. Danh Thiếp Số 3D & Thẻ NFC Titanium: Giống như một tập hồ sơ năng lực thu nhỏ mạ vàng. Chỉ cần chạm lưng thẻ vào điện thoại đối tác, máy tính sẽ gửi ngay toàn bộ thông tin công ty, brochure và lưu số danh bạ (.VCF) chỉ sau 1 giây.\n' +
      '2. Thu Thập Khách Hàng Tiềm Năng (Leads Hub): Mỗi khi đối tác bấm "Lưu liên hệ" hoặc quét danh thiếp, máy tính ghi một dòng vào Ngăn Tủ connect_leads. Doanh nhân không bao giờ bị thất lạc danh thiếp giấy như trước đây.\n' +
      '3. Ghép Cặp AI Matchmaking (Cung - Cầu): Giống như một người mai mối kinh doanh cực kỳ thông minh. Bạn đăng "Tôi cần mua thép xây dựng", người kia đăng "Tôi là nhà máy phân phối thép". Hệ thống AI tự động soi hai bên và kết nối hai người với nhau.\n' +
      '4. Đặt Lịch Hẹn Gặp 1-1 (Business Booking): Hai bên chọn giờ rảnh trên lịch điện tử để gặp cà phê hoặc họp online, hệ thống tự động gửi thông báo nhắc lịch cho cả hai.',
      'info'
    )
  );

  addMd('## PHẦN 1: GIẢI THÍCH BÌNH DÂN CÁC KHÁI NIỆM KỸ THUẬT CỐT LÕI');
  addMd('> **HÌNH TƯỢNG VÍ VON ĐỜI THƯỜNG:**\n' +
    '> 1. Danh Thiếp Số 3D = Hồ sơ năng lực mạ vàng chạm NFC lưu danh bạ 1 giây.\n' +
    '> 2. Leads Hub = Sổ tay tự động lưu thông tin đối tác sau mỗi lần chạm thẻ.\n' +
    '> 3. AI Matchmaking = Trợ lý mai mối cung - cầu tính điểm phù hợp tự động.\n' +
    '> 4. Business Booking = Lên lịch hẹn bàn tròn 1-on-1 đồng bộ đa nền tảng.');

  // ==========================================
  // PHẦN 2: BẢN ĐỒ TÍNH NĂNG & ĐIỀU HƯỚNG ỨNG DỤNG
  // ==========================================
  children.push(createHeading1('PHẦN 2: BẢN ĐỒ TÍNH NĂNG & MA TRẬN PHÂN QUYỀN SỬ DỤNG'));
  children.push(
    createPara('ViOne Connect phân định rõ 3 nhóm đối tượng sử dụng với quyền hạn minh bạch:'),
    createCallout(
      'QUY CHẾ PHÂN QUYỀN VIONE CONNECT:',
      '• Doanh Nhân Hội Viên: Toàn quyền quản lý danh thiếp cá nhân, xem và chuyển đổi khách hàng tiềm năng (Leads) phát sinh từ thẻ của mình, đăng tin cung - cầu, đặt lịch hẹn bàn 1-1 và nhắn tin đối tác.\n' +
      '• Quản Trị Viên Doanh Nghiệp (Enterprise Admin): Quản lý danh sách nhân sự trong công ty sử dụng thẻ ViOne, cấp phát thẻ NFC, xem báo cáo tổng hợp leads của toàn bộ đội ngũ kinh doanh.\n' +
      '• Quản Trị Hệ Thống (System Admin): Quản lý cấu hình server, giám sát lưu lượng chạm thẻ NFC, quản trị thuật toán AI Matchmaking và phê duyệt gian hàng B2B.',
      'tip'
    )
  );

  const vioneMatrixHeaders = ['Phân Hệ Chức Năng', 'Chức Năng Con', 'Thao Tác Cụ Thể', 'Hội Viên Cá Nhân', 'Doanh Nghiệp (Admin)', 'Hệ Thống (Super Admin)'];
  const vioneMatrixRows = [
    ['1. Danh Thiếp Số 3D', 'Cấu hình giao diện thẻ 3D', 'Chọn theme, đổi màu ánh kim', 'Toàn quyền thẻ mình', 'Cấu hình template cty', 'Quản trị toàn bộ theme'],
    ['1. Danh Thiếp Số 3D', 'Gán mã chip NFC vật lý', 'Đọc / Ghi mã chip NFC', 'Toàn quyền thẻ mình', 'Cấp phát thẻ nhân viên', 'Quản lý kho chip NFC'],
    ['2. Khách Tiềm Năng', 'Xem danh sách Leads', 'Xem đối tác đã quét thẻ', 'Leads của cá nhân mình', 'Toàn bộ Leads của cty', 'Xem thống kê toàn hệ thống'],
    ['2. Khách Tiềm Năng', 'Chuyển đổi trạng thái Lead', 'Đánh dấu Liên hệ/Thành công', 'Toàn quyền leads mình', 'Toàn quyền', 'Không can thiệp'],
    ['3. AI Matchmaking', 'Đăng nhu cầu Cung / Cầu', 'Đăng bài tìm đối tác B2B', 'Toàn quyền đăng bài', 'Duyệt bài nhân viên', 'Kiểm duyệt bài vi phạm'],
    ['3. AI Matchmaking', 'Nhận đề xuất ghép cặp AI', 'Xem danh sách đối tác khớp', 'Toàn quyền nhận gợi ý', 'Xem gợi ý doanh nghiệp', 'Cấu hình trọng số AI'],
    ['4. Lịch Hẹn Gặp 1-1', 'Đặt lịch hẹn bàn tròn', 'Gửi lời mời kèm ngày, giờ', 'Toàn quyền', 'Toàn quyền', 'Giám sát vận hành'],
    ['5. Nhắn Tin Giao Thương', 'Chat trực tiếp 1-1', 'Gửi tin nhắn, danh thiếp số', 'Toàn quyền trao đổi', 'Toàn quyền trao đổi', 'Bảo mật E2E, không xem']
  ];
  children.push(createTable(vioneMatrixHeaders, vioneMatrixRows, [18, 22, 20, 14, 13, 13]));

  addMd('## PHẦN 2: BẢN ĐỒ TÍNH NĂNG & MA TRẬN PHÂN QUYỀN SỬ DỤNG');
  addMd('| ' + vioneMatrixHeaders.join(' | ') + ' |');
  addMd('| ' + vioneMatrixHeaders.map(() => '---').join(' | ') + ' |');
  vioneMatrixRows.forEach(r => addMd('| ' + r.join(' | ') + ' |'));

  // ==========================================
  // PHẦN 3: ĐẶC TẢ CHI TIẾT TỪNG PHÂN HỆ, APIS & CSDL
  // ==========================================
  children.push(createHeading1('PHẦN 3: ĐẶC TẢ CHI TIẾT APIS & TỪ ĐIỂN DỮ LIỆU POSTGRESQL'));

  // 3.1 Danh thiếp số & Chạm thẻ
  children.push(createHeading2('3.1 Phân Hệ Danh Thiếp Số 3D & Chạm Thẻ NFC'));
  const cardApiHeaders = ['API Endpoint', 'Phương Thức', 'Mô Tả Chức Năng', 'Bảng CSDL Chính', 'Dữ Liệu Trả Về'];
  const cardApiRows = [
    ['/api/connect/cards/my', 'GET', 'Lấy thông tin danh thiếp của tôi', 'connect_business_cards', 'Headline, Theme, Social Links, Số lượt xem'],
    ['/api/connect/cards/view/:slug', 'GET', 'Khách quét NFC mở danh thiếp công khai', 'connect_business_cards', 'Hồ sơ đầy đủ, vCard payload'],
    ['/api/connect/cards/interaction', 'POST', 'Ghi nhật ký mỗi lượt chạm thẻ', 'connect_card_interactions', 'Lưu thiết bị, vị trí, thời gian']
  ];
  children.push(createTable(cardApiHeaders, cardApiRows, [26, 12, 26, 18, 18]));

  children.push(createHeading3('Cấu Trúc Bảng CSDL Chính: connect_business_cards'));
  const cardColHeaders = ['Tên Cột (Field)', 'Kiểu Dữ Liệu', 'Bắt Buộc?', 'Khóa (Key)', 'Giải Thích Dễ Hiểu'];
  const cardColRows = [
    ['id', 'UUID', 'Có', 'PK', 'Mã danh thiếp số duy nhất.'],
    ['user_id', 'UUID', 'Có', 'FK -> vione_users.id', 'Chủ sở hữu danh thiếp số.'],
    ['public_slug', 'VARCHAR(100)', 'Có', 'UNIQUE', 'Đường dẫn link rút gọn (Ví dụ: vione.me/ceo-an).'],
    ['nfc_uid', 'VARCHAR(100)', 'Không', 'None', 'Mã chip NFC vật lý dập trên thẻ mạ vàng.'],
    ['card_theme', 'VARCHAR(50)', 'Có', 'None', 'Giao diện thẻ: "titanium-gold", "luxury-white", "deep-slate".'],
    ['headline', 'VARCHAR(255)', 'Không', 'None', 'Câu khẩu hiệu định vị thương hiệu cá nhân.'],
    ['social_links', 'JSONB', 'Không', 'None', 'Tập hợp đường link: Zalo, Facebook, LinkedIn, Website, Hotline.'],
    ['view_count', 'INTEGER', 'Có', 'None', 'Số lượt người đã chạm hoặc quét danh thiếp này.']
  ];
  children.push(createTable(cardColHeaders, cardColRows, [20, 18, 12, 18, 32]));

  // 3.2 Thu thập Khách hàng tiềm năng (Leads)
  children.push(createHeading2('3.2 Phân Hệ Thu Thập Khách Hàng Tiềm Năng (Leads Hub)'));
  const leadApiHeaders = ['API Endpoint', 'Phương Thức', 'Mô Tả Chức Năng', 'Bảng CSDL Chính', 'Dữ Liệu Đầu Vào'];
  const leadApiRows = [
    ['/api/connect/leads', 'POST', 'Đối tác để lại thông tin liên hệ khi chạm thẻ', 'connect_leads', 'card_id, lead_name, lead_phone, lead_email, note'],
    ['/api/connect/leads', 'GET', 'Doanh nhân xem danh sách khách tiềm năng', 'connect_leads', 'Lọc theo ngày, trạng thái liên hệ'],
    ['/api/connect/leads/:id/status', 'PUT', 'Cập nhật trạng thái chăm sóc khách', 'connect_leads', 'status: "new", "contacted", "converted"']
  ];
  children.push(createTable(leadApiHeaders, leadApiRows, [26, 12, 26, 18, 18]));

  children.push(createHeading3('Cấu Trúc Bảng CSDL Chính: connect_leads'));
  const leadColHeaders = ['Tên Cột (Field)', 'Kiểu Dữ Liệu', 'Bắt Buộc?', 'Khóa (Key)', 'Giải Thích Dễ Hiểu'];
  const leadColRows = [
    ['id', 'UUID', 'Có', 'PK', 'Mã khách hàng tiềm năng duy nhất.'],
    ['card_id', 'UUID', 'Có', 'FK -> connect_business_cards.id', 'Khách hàng này quét từ danh thiếp nào.'],
    ['lead_name', 'VARCHAR(255)', 'Có', 'None', 'Họ tên đối tác đã để lại liên hệ.'],
    ['lead_phone', 'VARCHAR(20)', 'Có', 'None', 'Số điện thoại của đối tác.'],
    ['lead_email', 'VARCHAR(255)', 'Không', 'None', 'Email công việc của đối tác.'],
    ['company_name', 'VARCHAR(255)', 'Không', 'None', 'Tên doanh nghiệp của đối tác.'],
    ['status', 'VARCHAR(30)', 'Có', 'None', 'Trạng thái: "new" (Mới), "contacted" (Đã gọi), "converted" (Thành công).'],
    ['created_at', 'TIMESTAMPTZ', 'Có', 'None', 'Thời điểm đối tác chạm thẻ để lại thông tin.']
  ];
  children.push(createTable(leadColHeaders, leadColRows, [20, 18, 12, 18, 32]));

  // 3.3 Thuật toán AI Ghép cặp Cung - Cầu
  children.push(createHeading2('3.3 Đăng Tải Nhu Cầu & Thuật Toán AI Ghép Cặp Cung - Cầu (AI Matchmaking)'));
  children.push(
    createPara('Thuật toán AI sử dụng mô hình nhúng Vector (Vector Embedding) và độ tương đồng Cosine (Cosine Similarity) để so khớp giữa hồ sơ năng lực cung ứng và nhu cầu hợp tác:'),
    createCallout(
      'CÔNG THỨC GHÉP CẶP AI MATCHMAKING:',
      'Điểm Tương Đồng = (Trùng khớp Ngành nghề x 0.4) + (Trùng khớp Ngân sách x 0.3) + (Độ tương đồng ngữ nghĩa Nhu cầu & Năng lực x 0.3).\n' +
      'Các cặp có điểm số >= 85% sẽ tự động được gửi thông báo đề xuất kết nối giao thương đến cả 2 bên.',
      'tip'
    )
  );

  // ==========================================
  // PHẦN 4: KỊCH BẢN KIỂM THỬ UAT VIONE CONNECT
  // ==========================================
  children.push(createHeading1('PHẦN 4: KỊCH BẢN KIỂM THỬ NGHIỆM THU (VIONE CONNECT UAT)'));
  const vioneTcHeaders = ['Mã Test Case', 'Tên Nghiệp Vụ', 'Thao Tác Thực Hiện', 'Kỳ Vọng Kỹ Thuật', 'Kỳ Vọng Giao Diện'];
  const vioneTcRows = [
    ['TC_VN_01', 'Chạm thẻ NFC mở danh thiếp', 'Chạm thẻ vào điện thoại mở link public', 'connect_card_interactions tăng 1 bản ghi', 'Mở trang profile danh thiếp 3D lấp lánh ánh kim'],
    ['TC_VN_02', 'Lưu Khách Tiềm Năng', 'Khách điền: "Trần Văn Bình - 0912345678"', 'connect_leads lưu 1 dòng mới, status="new"', 'Doanh nhân nhận thông báo đẩy: Có 1 Lead mới'],
    ['TC_VN_03', 'AI Ghép Cặp Giao Thương', 'Đăng nhu cầu "Tìm đại lý vật liệu xây dựng"', 'AI quét connect_supplies, tính match_score > 85%', 'Mục Gợi ý hiện ngay 3 nhà máy cung ứng phù hợp nhất'],
    ['TC_VN_04', 'Đặt Lịch Hẹn Bàn 1-1', 'Chọn giờ 14:00 ngày mai bấm Đặt lịch', 'connect_appointments lưu status="pending"', 'Cả 2 bên nhận được email và thông báo lịch hẹn']
  ];
  children.push(createTable(vioneTcHeaders, vioneTcRows, [12, 20, 22, 23, 23]));

  addMd('## PHẦN 4: KỊCH BẢN KIỂM THỬ NGHIỆM THU (VIONE CONNECT UAT)');
  addMd('| ' + vioneTcHeaders.join(' | ') + ' |');
  addMd('| ' + vioneTcHeaders.map(() => '---').join(' | ') + ' |');
  vioneTcRows.forEach(r => addMd('| ' + r.join(' | ') + ' |'));

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

module.exports = { buildDoc3 };
