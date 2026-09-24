const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
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

// Output directories
const DOCS_DIR_VIONE = path.resolve(__dirname, '../document');
const DOCS_DIR_CEO = path.resolve(__dirname, '../../ceo1983_project/document');
const PUBLIC_DOCS_VIONE = path.resolve(__dirname, '../apps/vione_app_fe/public/docs');
const PUBLIC_DOCS_CEO = path.resolve(__dirname, '../../ceo1983_project/apps/ceo1983_app_fe/public/docs');

[DOCS_DIR_VIONE, DOCS_DIR_CEO, PUBLIC_DOCS_VIONE, PUBLIC_DOCS_CEO].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

async function saveDocx(doc, filename) {
  const buffer = await Packer.toBuffer(doc);
  const targets = [
    path.join(DOCS_DIR_VIONE, filename),
    path.join(DOCS_DIR_CEO, filename),
    path.join(PUBLIC_DOCS_VIONE, filename),
    path.join(PUBLIC_DOCS_CEO, filename),
  ];
  targets.forEach(t => {
    try {
      fs.writeFileSync(t, buffer);
      console.log('Saved DOCX:', t);
    } catch (e) {
      console.error('Error saving', t, e.message);
    }
  });
}

function saveMarkdown(content, filename) {
  const targets = [
    path.join(DOCS_DIR_VIONE, filename),
    path.join(DOCS_DIR_CEO, filename),
  ];
  targets.forEach(t => {
    try {
      fs.writeFileSync(t, content, 'utf8');
      console.log('Saved Markdown:', t);
    } catch (e) {
      console.error('Error saving', t, e.message);
    }
  });
}

// ============================================================================
// 1. SRS DOCUMENT 1: WEB CRM CEO 1983
// ============================================================================
async function buildDoc1_WebCrmCeo1983() {
  const hf = createHeaderFooter('Web CRM CEO 1983');
  const children = [];

  // Cover
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 100 },
      children: [
        new TextRun({
          text: 'TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & KIẾN TRÚC DỮ LIỆU',
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
          text: 'CỔNG QUẢN TRỊ TRUNG TÂM CLB DOANH NHÂN CEO 1983 (WEB CRM)',
          font: 'Times New Roman',
          size: 34,
          bold: true,
          color: '003B95',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 50, after: 300 },
      children: [
        new TextRun({
          text: 'Hệ thống Quản lý Hội viên, Sự kiện, Soát vé Check-in, Niên liễm, Sàn B2B & Điều hành Hiệp hội',
          font: 'Times New Roman',
          size: 22,
          italics: true,
          color: '64748B',
        }),
      ],
    })
  );

  children.push(
    createCallout(
      'GIẢI THÍCH DỄ HIỂU CHO NGƯỜI KHÔNG CHUYÊN VỀ IT:',
      'Web CRM CEO 1983 giống như Bộ Chỉ Huy Trung Tâm của văn phòng Hiệp Hội. Toàn bộ thông tin được cất giữ ngăn nắp trong "Tủ tài liệu điện tử" (Cơ sở dữ liệu PostgreSQL). Mỗi khi Ban Thư Ký xem danh sách hội viên hay kiểm tra ai đã mua vé sự kiện, máy tính sẽ làm thao tác "kẹp ghim" (phép JOIN) tờ vé với tờ lý lịch của người đó để hiển thị đầy đủ thông tin trên màn hình trong chớp mắt.',
      'info'
    )
  );

  // Chuyên đề 1: Tổng quan và đối tượng
  children.push(createHeading1('CHUYÊN ĐỀ 1: PHẠM VI NGHIỆP VỤ & ĐỐI TƯỢNG SỬ DỤNG'));
  children.push(
    createPara('• Đối tượng sử dụng: Chủ tịch CLB, Tổng Thư ký, Kế toán trưởng, Ban Truyền thông, Ban Kiểm soát.'),
    createPara('• Địa chỉ truy cập: https://14.225.217.232:5444/ hoặc http://localhost:5002/admin'),
    createPara('• Mục tiêu cốt lõi: Số hóa 100% nghiệp vụ quản trị hiệp hội, phê duyệt hồ sơ hội viên gia nhập từ Web Landing, phát hành vé sự kiện có mã QR, đối soát doanh thu hội phí tự động qua VietQR Napas 24/7 và kiểm soát thẻ ra vào.')
  );

  // Chuyên đề 2: Bảng CSDL và API chi tiết
  children.push(createHeading1('CHUYÊN ĐỀ 2: BẢN VẼ CƠ SỞ DỮ LIỆU & DANH MỤC API CHI TIẾT'));
  
  children.push(createHeading2('2.1 Quản trị Hội viên & Xét duyệt Gia nhập (Members Management)'));
  children.push(createPara('Khi một CEO nộp đơn từ Landing Page, thông tin được đưa vào hàng đợi phê duyệt. Khi Admin bấm "Duyệt", hệ thống cấp mã hội viên M1983-xxx và tự động gửi email chào mừng kèm mật khẩu.'));
  
  children.push(createTable(
    ['API / Method', 'Bảng CSDL Chính', 'Trường Dữ Liệu (Columns)', 'Bảng Phụ / Bảng Nối (JOIN)'],
    [
      [
        'POST /api/members/apply\n(Nộp đơn gia nhập)',
        'members',
        'id (UUID), full_name, company_name, position_title, phone, email, industry, status ("pending"), created_at',
        'Bảng phụ: company_members (thông tin MST, quy mô công ty). Chưa có tài khoản login.'
      ],
      [
        'POST /api/admin/members/:id/approve\n(Phê duyệt hội viên)',
        'members &\nvione_users',
        'members.status -> "active", member_code ("M1983-xxx"), joined_at.\nTạo vione_users (email, password_hash, role="member").',
        'JOIN vione_users ON members.user_id = vione_users.id. Tự động sinh member_business_cards.'
      ],
      [
        'GET /api/members\n(Danh bạ hội viên CRM)',
        'members',
        'id, member_code, full_name, company_name, position_title, avatar_url, status, joined_at',
        'LEFT JOIN memberships ms ON members.id = ms.member_id\nLEFT JOIN member_business_cards c ON members.id = c.member_id'
      ],
      [
        'PUT /api/members/:id/role\n(Bổ nhiệm Ban Truyền Thông)',
        'user_roles',
        'id, user_id, role_code ("MEDIA_STAFF"), assigned_at',
        'JOIN vione_users u ON user_roles.user_id = u.id (Cấp quyền quét soát vé sự kiện).'
      ]
    ],
    [25, 20, 30, 25]
  ));

  children.push(createHeading2('2.2 Quản trị Sự kiện, Sơ đồ Khán phòng & Soát vé QR (Events & Check-in)'));
  children.push(createPara('Admin tạo sự kiện, thiết lập giá vé, tải sơ đồ bàn VIP. Đại biểu đăng ký sẽ nhận cuống vé có mã QR. Tại cổng đại hội, Ban Truyền Thông quét mã QR, CRM lập tức ghi nhận thời gian check-in.'));

  children.push(createTable(
    ['API / Method', 'Bảng CSDL Chính', 'Trường Dữ Liệu (Columns)', 'Bảng Phụ / Bảng Nối (JOIN)'],
    [
      [
        'POST /api/events\n(Tạo sự kiện mới)',
        'events',
        'id, title, start_time, end_time, location_name, address, capacity, banner_url, is_published',
        'Bảng phụ: event_ticket_types (Hạng vé VIP, VVIP, Standard kèm mức giá).'
      ],
      [
        'POST /api/events/:id/register\n(Xuất vé đại biểu)',
        'event_registrations',
        'id, event_id, member_id, ticket_code ("REG-EV1-983"), ticket_type, seat_assignment ("Bàn VIP 08"), lucky_number, qr_code_payload, is_checked_in (false)',
        'JOIN events e ON event_id = e.id\nJOIN members m ON member_id = m.id'
      ],
      [
        'POST /api/events/checkin/confirm\n(Soát vé Check-in)',
        'event_registrations &\nmember_checkins',
        'event_registrations.is_checked_in -> true, checked_in_at (NOW), scanned_by_user_id (ID nhân sự Ban Truyền Thông).\nmember_checkins: id, registration_id, scan_method ("qr"/"nfc"), scanned_at.',
        'JOIN event_registrations reg ON member_checkins.registration_id = reg.id\nJOIN vione_users scanner ON reg.scanned_by_user_id = scanner.id'
      ],
      [
        'GET /api/events/:id/stats\n(Thống kê tỷ lệ tham dự)',
        'event_registrations',
        'COUNT(id) AS total_tickets, COUNT(CASE WHEN is_checked_in THEN 1 END) AS attended_count',
        'GROUP BY event_id. Phân tích tỷ lệ đại biểu có mặt theo thời gian thực.'
      ]
    ],
    [25, 20, 30, 25]
  ));

  children.push(createHeading2('2.3 Quản lý Niên liễm, Hội phí & Tài chính VietQR (Finance & Invoices)'));
  children.push(createPara('Theo dõi nghĩa vụ nộp hội phí hàng năm của từng CEO. Khi có chuyển khoản đúng cú pháp, hệ thống tự động gạch nợ và gia hạn thời hạn hội viên.'));

  children.push(createTable(
    ['API / Method', 'Bảng CSDL Chính', 'Trường Dữ Liệu (Columns)', 'Bảng Phụ / Bảng Nối (JOIN)'],
    [
      [
        'POST /api/fees/invoices/generate\n(Phát hành thông báo phí)',
        'invoices',
        'id, invoice_no ("INV-2026-089"), member_id, amount (10,000,000), fee_type ("ANNUAL_MEMBERSHIP"), payment_status ("unpaid"), due_date',
        'JOIN members m ON invoices.member_id = m.id. Tự động sinh link ảnh VietQR Napas 24/7.'
      ],
      [
        'PUT /api/admin/fees/:id/toggle\n(Gạch nợ thủ công / Duyệt)',
        'invoices &\nmemberships',
        'invoices.payment_status -> "paid", paid_at (NOW), bank_ref_code.\nmemberships.expires_at -> gia hạn thêm 365 ngày.',
        'JOIN memberships ms ON invoices.member_id = ms.member_id.'
      ]
    ],
    [25, 20, 30, 25]
  ));

  children.push(createHeading1('CHUYÊN ĐỀ 3: CÁC CÂU LỆNH GHÉP HỒ SƠ (SQL JOINS) TRỌNG YẾU'));
  children.push(createCallout(
    'VÍ DỤ TRUY VẤN XUẤT BẢNG ĐẠI BIỂU DỰ TIỆC GALA:',
    'SELECT reg.ticket_code, m.full_name, m.company_name, reg.seat_assignment, reg.lucky_number, reg.is_checked_in, reg.checked_in_at, scanner.full_name AS nguoi_soat_ve FROM event_registrations reg INNER JOIN members m ON reg.member_id = m.id LEFT JOIN vione_users scanner ON reg.scanned_by_user_id = scanner.id WHERE reg.event_id = "..." ORDER BY reg.seat_assignment ASC;',
    'tip'
  ));

  const doc = new Document({ sections: [{ properties: {}, headers: hf.headers, footers: hf.footers, children }] });
  await saveDocx(doc, 'SRS_01_Web_CRM_CEO1983.docx');
  
  // Save Markdown
  const mdContent = `# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & KIẾN TRÚC DỮ LIỆU
## CỔNG QUẢN TRỊ TRUNG TÂM CLB DOANH NHÂN CEO 1983 (WEB CRM)

### 1. Khái Niệm Bình Dân Dành Cho Người Không Học IT:
Web CRM CEO 1983 đóng vai trò như **Bộ Chỉ Huy Trung Tâm** của ban chấp hành hiệp hội. Toàn bộ hồ sơ hội viên, danh sách đóng niên liễm, sơ đồ chỗ ngồi tiệc gala và cuống vé ra vào đều được lưu trong **Tủ tài liệu điện tử** (Cơ sở dữ liệu PostgreSQL).
* **Tủ \`members\`**: Chứa tờ khai lý lịch của từng CEO (Họ tên, Doanh nghiệp, Mã hội viên M1983-xxx).
* **Tủ \`events\`**: Chứa thông tin ngày giờ, địa điểm tổ chức các kỳ đại hội.
* **Tủ \`event_registrations\`**: Chứa danh sách vé đại biểu đăng ký (Mã vé REG-xxx, Bàn VIP, Số bốc thăm trúng thưởng).
* **Phép JOIN (Ghép Bảng)**: Khi in danh sách đón tiếp, máy tính dùng kẹp ghim kẹp tờ vé với tờ lý lịch hội viên tương ứng để hiện ra đầy đủ: *"Anh Nguyễn Văn An - Tổng giám đốc An Phát - Ngồi Bàn VIP 08 - Đã soát vé lúc 07:30"*.

---

### 2. Danh Mục Nghiệp Vụ, APIs & Bản Vẽ CSDL Chi Tiết:

#### 2.1 Quản trị Hội viên & Xét duyệt Đơn Gia nhập
* **API Tiếp nhận hồ sơ**: \`POST /api/members/apply\` -> Ghi nhận vào bảng \`members\` với trạng thái \`pending\`.
* **API Phê duyệt hội viên**: \`POST /api/admin/members/:id/approve\` -> Cập nhật \`members.status = 'active'\`, tự động tạo tài khoản đăng nhập trong \`vione_users\` và cấp mã \`M1983-xxx\`.
* **Câu lệnh JOIN tra cứu**:
\`\`\`sql
SELECT m.member_code, m.full_name, m.company_name, m.position_title, u.email, ms.tier_name
FROM members m
INNER JOIN vione_users u ON m.user_id = u.id
LEFT JOIN memberships ms ON m.id = ms.member_id
WHERE m.status = 'active';
\`\`\`

#### 2.2 Quản lý Sự kiện & Kiểm soát Soát vé Ban Truyền Thông
* **API Tạo sự kiện**: \`POST /api/events\` -> Lưu bảng \`events\`.
* **API Xuất vé QR**: \`POST /api/events/:id/register\` -> Sinh bản ghi cuống vé trong \`event_registrations\` kèm chuỗi mã QR và số may mắn Lucky Draw.
* **API Điểm danh Check-in**: \`POST /api/events/checkin/confirm\` -> Cập nhật \`event_registrations.is_checked_in = true\`, ghi nhận \`scanned_by_user_id\` của nhân viên Ban Truyền Thông, đồng thời ghi nhật ký vào \`member_checkins\`.

#### 2.3 Quản lý Tài chính, Hội phí & VietQR Tự Động
* **API Phát hành hóa đơn**: \`POST /api/fees/invoices/generate\` -> Lưu bảng \`invoices\`, sinh mã VietQR Napas 24/7 tự động.
* **API Gạch nợ / Gia hạn thẻ**: \`PUT /api/admin/fees/:id/toggle\` -> Chuyển \`invoices.payment_status = 'paid'\`, tự động tăng thời hạn trong bảng \`memberships\` thêm 365 ngày.
`;
  saveMarkdown(mdContent, 'SRS_01_Web_CRM_CEO1983.md');
}

// ============================================================================
// 2. SRS DOCUMENT 2: APP HIỆP HỘI CEO 1983 (MOBILE & PWA)
// ============================================================================
async function buildDoc2_AppHiepHoiCeo1983() {
  const hf = createHeaderFooter('App Hiệp Hội CEO 1983');
  const children = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 100 },
      children: [
        new TextRun({
          text: 'TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & KIẾN TRÚC DỮ LIỆU',
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
          text: 'ỨNG DỤNG DI ĐỘNG & PWA HIỆP HỘI CEO 1983 (MOBILE APP)',
          font: 'Times New Roman',
          size: 34,
          bold: true,
          color: '003B95',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 50, after: 300 },
      children: [
        new TextRun({
          text: 'Dành cho Hội Viên Chính Thức & Ban Truyền Thông Soát Vé Đại Hội',
          font: 'Times New Roman',
          size: 22,
          italics: true,
          color: '64748B',
        }),
      ],
    })
  );

  children.push(
    createCallout(
      'GIẢI THÍCH DỄ HIỂU CHO NGƯỜI KHÔNG CHUYÊN VỀ IT:',
      'App Hiệp Hội CEO 1983 là chiếc "Thẻ Hội Viên Vạn Năng" nằm gọn trong điện thoại của mỗi CEO. Khi anh/chị bấm "Gắn kết" hẹn cà phê giao thương với một bạn hội viên khác, hệ thống sẽ viết một lá thư mời vào ngăn tủ "business_connections" để người kia nhận được và lưu vào nhật ký kết nối của anh/chị. Khi đi sự kiện, hội viên đưa màn hình vé ra, còn hội viên Ban Truyền Thông mở camera app quét một cái là máy tính mở ngay tập hồ sơ vé để kiểm tra!',
      'info'
    )
  );

  children.push(createHeading1('CHUYÊN ĐỀ 1: PHẠM VI ỨNG DỤNG & CÁC CHỨC NĂNG CỐT LÕI'));
  children.push(
    createPara('• Tên ứng dụng hiển thị: CEO1983 (viết liền, chuẩn thương hiệu không có khoảng cách).'),
    createPara('• Biểu tượng ứng dụng: Logo biểu tượng số 8 hoàng gia độc quyền (ceo1983-emblem-8.png).'),
    createPara('• Nền tảng: Mobile Web PWA, Android App (APK), iOS App (IPA/TestFlight).'),
    createPara('• Phân hệ người dùng: (1) Hội viên CEO thông thường; (2) Thành viên thuộc Ban Truyền Thông (có thêm quyền quét mã QR soát vé đại biểu).')
  );

  children.push(createHeading1('CHUYÊN ĐỀ 2: BẢN VẼ DỮ LIỆU & DANH MỤC API CHI TIẾT'));

  children.push(createHeading2('2.1 Tính năng "Gắn Kết" Giao Thương & Nhật Ký Lịch Sử Kết Nối'));
  children.push(createPara('Hội viên xem danh bạ, bấm "Gắn kết", điền nội dung đề xuất gặp gỡ và cơ hội giao thương. Lịch sử được lưu trữ vĩnh viễn và hiển thị tại 2 vị trí: Tab "Đã gửi kết nối" trên trang Hội viên và Tab "Kết nối" trên trang Lịch sử.'));

  children.push(createTable(
    ['API / Method', 'Bảng CSDL Chính', 'Trường Dữ Liệu (Columns)', 'Bảng Phụ / Bảng Nối (JOIN)'],
    [
      [
        'POST /api/connections/request\n(Gửi đề xuất gắn kết)',
        'business_connections',
        'id (UUID), sender_member_id, target_member_id, purpose (Nguyên văn lời nhắn hẹn gặp), opportunity_id, status ("pending"), created_at',
        'Bảng phụ: communication_messages (tự động tạo tin nhắn chào hỏi đầu tiên trong hộp thư).'
      ],
      [
        'GET /api/connections/sent\n(Xem lịch sử đã gửi)',
        'business_connections',
        'id, purpose, status, created_at, scheduled_at',
        'INNER JOIN members target ON business_connections.target_member_id = target.id (Lấy avatar, tên, công ty đối tác).'
      ],
      [
        'PUT /api/connections/:id/respond\n(Phản hồi lời mời)',
        'business_connections',
        'status -> "accepted" hoặc "rejected", responded_at',
        'Tự động kích hoạt badge thông báo đẩy tới điện thoại của người gửi.'
      ]
    ],
    [25, 20, 30, 25]
  ));

  children.push(createHeading2('2.2 Chức Năng Quét Mã QR Vé Sự Kiện Độc Quyền Của Ban Truyền Thông'));
  children.push(createPara('Chỉ những tài khoản có vai trò thuộc Ban Truyền Thông mới được mở camera quét vé. Khi hướng camera vào mã QR của đại biểu, ứng dụng mở modal ScannedTicketDetailModal hiển thị toàn bộ thông tin vé, số ghế, số may mắn.'));

  children.push(createTable(
    ['API / Method', 'Bảng CSDL Chính', 'Trường Dữ Liệu (Columns)', 'Bảng Phụ / Bảng Nối (JOIN)'],
    [
      [
        'GET /api/events/checkin/lookup\n(Đọc dữ liệu mã vé)',
        'event_registrations',
        'ticket_code, ticket_type, seat_assignment, lucky_number, is_checked_in, checked_in_at',
        'INNER JOIN events ON event_registrations.event_id = events.id\nINNER JOIN members ON event_registrations.member_id = members.id'
      ],
      [
        'POST /api/events/checkin/confirm\n(Xác nhận vào cửa)',
        'event_registrations &\nmember_checkins',
        'is_checked_in = true, checked_in_at = NOW(), scanned_by_user_id = ID người quét',
        'Lưu lịch sử kiểm soát vé vào member_checkins để đối soát quân số.'
      ]
    ],
    [25, 20, 30, 25]
  ));

  children.push(createHeading2('2.3 Thẻ Doanh Nhân Thông Minh & Chạm Thẻ NFC 1-Chạm'));
  children.push(createPara('Mỗi hội viên sở hữu một danh thiếp điện tử 3D lơ lửng phản xạ ánh sáng. Bấm vào hoặc chạm thẻ NFC sẽ chia sẻ ngay danh bạ điện thoại .VCF cho đối tác.'));

  children.push(createTable(
    ['API / Method', 'Bảng CSDL Chính', 'Trường Dữ Liệu (Columns)', 'Bảng Phụ / Bảng Nối (JOIN)'],
    [
      [
        'GET /api/business-cards/my-card\n(Lấy danh thiếp số)',
        'member_business_cards',
        'id, member_id, public_slug, nfc_uid, card_theme, headline, social_links (Zalo, FB, Web), view_count',
        'JOIN members ON member_business_cards.member_id = members.id (Đồng bộ họ tên, avatar).'
      ],
      [
        'POST /api/business-cards/:id/tap\n(Nhật ký chạm thẻ NFC)',
        'business_card_interactions',
        'id, card_id, interaction_type ("nfc"/"qr"), device_os, created_at',
        'Tăng view_count trong bảng member_business_cards.'
      ]
    ],
    [25, 20, 30, 25]
  ));

  const doc = new Document({ sections: [{ properties: {}, headers: hf.headers, footers: hf.footers, children }] });
  await saveDocx(doc, 'SRS_02_App_Hiep_Hoi_CEO1983.docx');

  // Save Markdown
  const mdContent = `# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & KIẾN TRÚC DỮ LIỆU
## ỨNG DỤNG DI ĐỘNG & PWA HIỆP HỘI CLB DOANH NHÂN CEO 1983

### 1. Khái Niệm Bình Dân Cho Người Không Học IT:
App Hiệp Hội CEO 1983 giống như cuốn **Sổ Tay Doanh Nhân Thông Minh** của mỗi hội viên. Mọi thao tác bấm nút trên màn hình điện thoại đều tương ứng với việc ghi thêm hoặc đọc một dòng trong các ngăn tủ cơ sở dữ liệu:
* Khi anh/chị bấm **"Gắn kết"** với bạn hội viên: Máy tính viết một lá phiếu vào tủ \`business_connections\`, ghi rõ nội dung anh/chị muốn hẹn gặp là gì.
* Khi anh/chị muốn xem lại mình đã từng hẹn những ai: Ứng dụng mở tủ \`business_connections\` lấy phiếu ra, dùng **kẹp ghim (phép JOIN)** kẹp tờ lý lịch của người kia trong tủ \`members\` để hiển thị tên, công ty và avatar của họ lên màn hình.
* Khi Ban Truyền Thông quét mã QR: Chiếc camera chỉ làm nhiệm vụ đọc chuỗi ký tự trên vé, sau đó máy tính chạy vào tủ \`event_registrations\` lấy đúng cuống vé ra xem đã hợp lệ chưa và đóng dấu "ĐÃ CHECK-IN".

---

### 2. Danh Mục Nghiệp Vụ, APIs & Bản Vẽ CSDL Chi Tiết:

#### 2.1 Tính năng "Gắn Kết" & Lịch Sử Kết Nối
* **Gửi lời mời gắn kết**: \`POST /api/connections/request\` -> Lưu bảng \`business_connections\` (lưu đầy đủ trường \`purpose\`, người gửi, người nhận, trạng thái \`pending\`).
* **Hiển thị lịch sử**:
  - Vị trí 1: Tab *"Đã gửi kết nối"* trong trang Hội viên (\`association.members.tsx\`).
  - Vị trí 2: Tab *"Kết nối"* trong trang Lịch sử (\`association.history.tsx\`).
* **Câu lệnh JOIN truy vấn**:
\`\`\`sql
SELECT c.id, c.purpose, c.status, c.created_at,
       m.full_name AS doi_tac, m.company_name, m.position_title, m.avatar_url
FROM business_connections c
INNER JOIN members m ON c.target_member_id = m.id
WHERE c.sender_member_id = '...'
ORDER BY c.created_at DESC;
\`\`\`

#### 2.2 Quét Mã QR Soát Vé Cho Ban Truyền Thông
* Chỉ hội viên có chức vụ/vai trò Ban Truyền Thông (\`isMediaDepartment = true\`) mới thấy giao diện quét camera trên trang Check-in.
* Khi quét trúng mã QR vé:
  - Gọi API tra cứu: \`GET /api/events/checkin/lookup?code=REG-xxx\`
  - Ghép bảng: \`event_registrations JOIN events JOIN members\`
  - Mở modal chi tiết: Hiển thị Họ tên đại biểu, Doanh nghiệp, Bàn tiệc VIP số mấy, Số may mắn.
  - Bấm xác nhận: Gọi \`POST /api/events/checkin/confirm\` để đóng dấu \`is_checked_in = true\`.
`;
  saveMarkdown(mdContent, 'SRS_02_App_Hiep_Hoi_CEO1983.md');
}

// ============================================================================
// 3. SRS DOCUMENT 3: APP VIONE CONNECT (BUSINESS CONNECT)
// ============================================================================
async function buildDoc3_AppViOneConnect() {
  const hf = createHeaderFooter('App ViOne Connect');
  const children = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 100 },
      children: [
        new TextRun({
          text: 'TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & KIẾN TRÚC DỮ LIỆU',
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
          size: 34,
          bold: true,
          color: '003B95',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 50, after: 300 },
      children: [
        new TextRun({
          text: 'Hệ Sinh Thái Danh Thiếp Titanium NFC & Mạng Lưới Kết Nối Doanh Nghiệp B2B',
          font: 'Times New Roman',
          size: 22,
          italics: true,
          color: '64748B',
        }),
      ],
    })
  );

  children.push(
    createCallout(
      'GIẢI THÍCH DỄ HIỂU CHO NGƯỜI KHÔNG CHUYÊN VỀ IT:',
      'ViOne Connect là mạng xã hội công việc thu nhỏ của các chủ doanh nghiệp. Thay vì mang theo cả cọc namecard giấy vừa tốn kém vừa dễ vứt đi, mỗi người chỉ cần 1 chiếc thẻ Titanium NFC dập biểu tượng ViOne. Chạm vào điện thoại đối tác là hồ sơ công ty, năng lực cung ứng và số điện thoại bay thẳng vào danh bạ của họ. Mọi thông tin chạm thẻ được máy chủ lưu vào ngăn tủ "member_business_cards" và "business_card_interactions".',
      'info'
    )
  );

  children.push(createHeading1('CHUYÊN ĐỀ 1: PHẠM VI ỨNG DỤNG & CÁC CHỨC NĂNG CỐT LÕI'));
  children.push(
    createPara('• Tông màu chủ đạo: Trắng Sứ, Vàng Đồng Ánh Kim Titanium và Xanh Công Nghệ ViOne.'),
    createPara('• Chức năng trọng tâm: Quản lý danh thiếp số 3D Gyro, Chạm thẻ NFC 1 giây, Khám phá đối tác B2B bằng thuật toán AI Matchmaking, Tạo lịch hẹn gặp 1-1 và Lưu vết quan hệ khách hàng (Leads).'),
    createPara('• Cửa ngõ Đăng ký: Dẫn trực tiếp về Web Landing ViOne Connect theo Figma (http://localhost:5000/landing?template=vione-gold-white).')
  );

  children.push(createHeading1('CHUYÊN ĐỀ 2: BẢN VẼ DỮ LIỆU & DANH MỤC API CHI TIẾT'));

  children.push(createHeading2('2.1 Danh Thiếp Số Titanium NFC & Quét Trao Đổi Danh Bạ 1 Giây'));
  children.push(createTable(
    ['API / Method', 'Bảng CSDL Chính', 'Trường Dữ Liệu (Columns)', 'Bảng Phụ / Bảng Nối (JOIN)'],
    [
      [
        'GET /api/business-cards/:slug\n(Mở danh thiếp công khai)',
        'member_business_cards',
        'id, member_id, public_slug, headline, card_theme, social_links, view_count',
        'JOIN members ON member_business_cards.member_id = members.id\nJOIN company_members ON members.id = company_members.member_id'
      ],
      [
        'POST /api/business-cards/lead\n(Khách để lại thông tin)',
        'business_card_leads',
        'id, card_id, full_name, phone, email, notes, created_at',
        'Khóa ngoại card_id nối sang member_business_cards.id. Gửi thông báo đến chủ thẻ.'
      ]
    ],
    [25, 20, 30, 25]
  ));

  children.push(createHeading2('2.2 Khám Phá Đối Tác B2B & Gợi Ý Ghép Cặp (AI Matchmaking)'));
  children.push(createTable(
    ['API / Method', 'Bảng CSDL Chính', 'Trường Dữ Liệu (Columns)', 'Bảng Phụ / Bảng Nối (JOIN)'],
    [
      [
        'GET /api/network/suggestions\n(Gợi ý đối tác kinh doanh)',
        'business_card_needs &\nbusiness_card_services',
        'needs.keyword, services.keyword, match_score',
        'INNER JOIN members ON services.member_id = members.id (Ghép người có nhu cầu MUA với người CUNG ỨNG).'
      ],
      [
        'POST /api/meetings/schedule\n(Đặt lịch hẹn gặp 1-1)',
        'appointments',
        'id, host_id, attendee_id, scheduled_at, location_type ("online"/"in_person"), status ("confirmed")',
        'JOIN vione_users host ON host_id = host.id\nJOIN vione_users guest ON attendee_id = guest.id'
      ]
    ],
    [25, 20, 30, 25]
  ));

  const doc = new Document({ sections: [{ properties: {}, headers: hf.headers, footers: hf.footers, children }] });
  await saveDocx(doc, 'SRS_03_App_ViOne_Connect.docx');

  // Save Markdown
  const mdContent = `# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & KIẾN TRÚC DỮ LIỆU
## ỨNG DỤNG MẠNG LƯỚI GIAO THƯƠNG VIONE CONNECT (BUSINESS CONNECT)

### 1. Khái Niệm Bình Dân Cho Người Không Học IT:
ViOne Connect là công cụ hỗ trợ doanh nhân **kết nối không biên giới**.
* Mỗi khi doanh nhân chạm thẻ danh thiếp Titanium NFC vào điện thoại của khách hàng, máy tính mở tủ \`member_business_cards\` để tải trang giới thiệu 3D lung linh.
* Khi khách hàng bấm "Lưu danh bạ", máy chủ đóng gói thông tin thành file danh bạ điện thoại (.VCF) để nạp thẳng vào danh bạ iPhone/Android.
* Khi khách hàng điền form để lại số điện thoại, máy tính ghi một dòng vào tủ \`business_card_leads\` để chủ thẻ biết có khách hàng tiềm năng vừa liên hệ.

---

### 2. Danh Mục APIs & Bảng Cơ Sở Dữ Liệu:
1. **Quản lý Danh thiếp số**:
   - Bảng chính: \`member_business_cards\`
   - Bảng phụ: \`business_card_interactions\` (nhật ký lượt chạm), \`business_card_leads\` (khách để lại liên hệ).
   - Ghép bảng: \`member_business_cards JOIN members ON member_business_cards.member_id = members.id\`.
2. **Ghép đôi Giao thương B2B (AI Matchmaking)**:
   - Bảng \`business_card_services\` (các dịch vụ công ty tôi cung cấp).
   - Bảng \`business_card_needs\` (những gì công ty tôi đang cần tìm kiếm thu mua).
   - Ghép nối: Máy tính so khớp từ khóa giữa 2 bảng này để gợi ý 2 doanh nghiệp kết nối với nhau.
`;
  saveMarkdown(mdContent, 'SRS_03_App_ViOne_Connect.md');
}

// ============================================================================
// 4. SRS DOCUMENT 4: WEB CRM VIONE (ENTERPRISE CRM 163 TABLES)
// ============================================================================
async function buildDoc4_WebCrmViOne() {
  const hf = createHeaderFooter('Web CRM ViOne');
  const children = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 100 },
      children: [
        new TextRun({
          text: 'TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & KIẾN TRÚC DỮ LIỆU',
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
          text: 'HỆ ĐIỀU HÀNH QUẢN TRỊ DOANH NGHIỆP ENTERPRISE CRM VIONE',
          font: 'Times New Roman',
          size: 34,
          bold: true,
          color: '003B95',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 50, after: 300 },
      children: [
        new TextRun({
          text: 'Hạ Tầng 163 Bảng CSDL Cô Lập Đa Doanh Nghiệp (Multi-Tenant Architecture)',
          font: 'Times New Roman',
          size: 22,
          italics: true,
          color: '64748B',
        }),
      ],
    })
  );

  children.push(
    createCallout(
      'GIẢI THÍCH DỄ HIỂU CHO NGƯỜI KHÔNG CHUYÊN VỀ IT:',
      'Web CRM ViOne giống như một "Tòa Nhà Văn Phòng Hạng A" với 163 phòng ban lưu trữ tài liệu. Mỗi công ty thuê một tầng (mã tenant_id riêng). Dữ liệu của công ty nào thì chỉ nhân sự công ty đó được xem, hoàn toàn không bị nhìn trộm sang công ty khác (Tính năng Bảo mật Cô lập Dòng - Row Level Security). Hệ thống lưu lại toàn bộ vết tích mọi người bấm nút sửa, xóa, duyệt vào cuốn sổ nhật ký bất biến "audit_logs" để chống gian lận.',
      'info'
    )
  );

  children.push(createHeading1('CHUYÊN ĐỀ 1: KIẾN TRÚC ĐA DOANH NGHIỆP (MULTI-TENANT ARCHITECTURE)'));
  children.push(
    createPara('• Tổng quy mô: 163 bảng cơ sở dữ liệu quan hệ PostgreSQL.'),
    createPara('• Nguyên tắc cô lập dữ liệu: Mọi bảng kinh doanh đều có cột tenant_id (mã số công ty). Khi công ty A đăng nhập, hệ thống tự động lọc chỉ lấy hồ sơ có tenant_id của công ty A.'),
    createPara('• Nhật ký chuỗi khối kiểm toán: Mọi giao dịch sửa, xóa đều được băm SHA-256 lưu vào audit_log_chain để làm bằng chứng kiểm toán không thể chối cãi.')
  );

  children.push(createHeading1('CHUYÊN ĐỀ 2: BẢN VẼ DỮ LIỆU & DANH MỤC API CHI TIẾT'));

  children.push(createHeading2('2.1 Quản Lý Sản Phẩm, Kho Hàng & Danh Mục B2B'));
  children.push(createTable(
    ['API / Method', 'Bảng CSDL Chính', 'Trường Dữ Liệu (Columns)', 'Bảng Phụ / Bảng Nối (JOIN)'],
    [
      [
        'POST /api/products\n(Tạo sản phẩm B2B)',
        'products',
        'id, tenant_id, title, description, price, member_discount, category_id, is_active, created_at',
        'Bảng phụ: product_tags (nhãn từ khóa), categories (danh mục ngành hàng cha/con).'
      ],
      [
        'GET /api/products\n(Danh mục sản phẩm kho)',
        'products',
        'id, title, price, member_discount, categories.name',
        'INNER JOIN categories ON products.category_id = categories.id\nWHERE products.tenant_id = :tenant_id'
      ]
    ],
    [25, 20, 30, 25]
  ));

  children.push(createHeading2('2.2 Quản Lý Giỏ Hàng, Báo Giá & Đơn Hàng Thương Mại'));
  children.push(createTable(
    ['API / Method', 'Bảng CSDL Chính', 'Trường Dữ Liệu (Columns)', 'Bảng Phụ / Bảng Nối (JOIN)'],
    [
      [
        'POST /api/cart/items\n(Thêm vào giỏ hàng B2B)',
        'carts &\ncart_items',
        'carts: id, user_id, tenant_id, total_amount.\ncart_items: id, cart_id, product_id, quantity, unit_price.',
        'JOIN products ON cart_items.product_id = products.id (Lấy giá ưu đãi hội viên để tính tổng).'
      ],
      [
        'POST /api/invoices/checkout\n(Xuất hóa đơn đơn hàng)',
        'invoices',
        'id, invoice_no, amount, payment_status, paid_at',
        'Chuyển đổi từ cart_items sang chi tiết hóa đơn, cập nhật tồn kho.'
      ]
    ],
    [25, 20, 30, 25]
  ));

  children.push(createHeading2('2.3 Trợ Lý Trí Tuệ Nhân Tạo AI Hỗ Trợ Điều Hành'));
  children.push(createTable(
    ['API / Method', 'Bảng CSDL Chính', 'Trường Dữ Liệu (Columns)', 'Bảng Phụ / Bảng Nối (JOIN)'],
    [
      [
        'POST /api/ai/chat\n(Hỏi đáp điều hành doanh nghiệp)',
        'ai_conversations &\nai_messages',
        'ai_conversations: id, user_id, tenant_id, title.\nai_messages: id, conversation_id, role ("user"/"assistant"), content, tokens_in, tokens_out, latency_ms.',
        'JOIN ai_conversations ON ai_messages.conversation_id = ai_conversations.id (Lưu toàn bộ ngữ cảnh trò chuyện).'
      ]
    ],
    [25, 20, 30, 25]
  ));

  const doc = new Document({ sections: [{ properties: {}, headers: hf.headers, footers: hf.footers, children }] });
  await saveDocx(doc, 'SRS_04_Web_CRM_ViOne.docx');

  // Save Markdown
  const mdContent = `# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & KIẾN TRÚC DỮ LIỆU
## HỆ ĐIỀU HÀNH QUẢN TRỊ DOANH NGHIỆP ENTERPRISE CRM VIONE (163 BẢNG CSDL)

### 1. Khái Niệm Bình Dân Cho Người Không Học IT:
Web CRM ViOne giống như một **Tòa Nhà Văn Phòng Hạng A** có 163 ngăn tủ chuyên biệt.
* Mỗi doanh nghiệp là một khách thuê riêng biệt, được gán một mã số nhận diện \`tenant_id\`.
* Toàn bộ nhân viên của doanh nghiệp A chỉ nhìn thấy tủ tài liệu có dán tem của doanh nghiệp A, tuyệt đối không nhìn thấy của doanh nghiệp B.
* Mọi hành động thêm sản phẩm, sửa giá bán hay xuất hóa đơn đều được máy chủ tự động chụp ảnh bằng chứng ghi vào cuốn sổ nhật ký bất biến \`audit_logs\`.

---

### 2. Danh Mục Các Phân Hệ Cốt Lõi:
1. **Quản trị Sản phẩm & Kho hàng B2B**:
   - Bảng chính: \`products\`
   - Bảng liên kết: \`categories\` (Danh mục phân loại), \`product_tags\` (Thẻ tìm kiếm).
   - Câu lệnh JOIN: \`SELECT * FROM products p JOIN categories c ON p.category_id = c.id WHERE p.tenant_id = '...'\`.
2. **Quản trị Đơn hàng & Giỏ hàng B2B**:
   - Bảng \`carts\` (Giỏ hàng tổng thể của doanh nghiệp).
   - Bảng \`cart_items\` (Từng dòng mặt hàng, số lượng, đơn giá chiết khấu).
   - Bảng \`invoices\` (Hóa đơn thương mại khi khách bấm thanh toán).
3. **Trợ lý Trí tuệ Nhân tạo AI**:
   - Bảng \`ai_conversations\` (Phiên trò chuyện của CEO với trợ lý AI).
   - Bảng \`ai_messages\` (Từng câu hỏi của người dùng và câu trả lời cố vấn của AI, số lượng token sử dụng).
`;
  saveMarkdown(mdContent, 'SRS_04_Web_CRM_ViOne.md');
}

async function main() {
  console.log('=== BẮT ĐẦU XUẤT BẢN 4 TẬP TÀI LIỆU SRS ĐỘC LẬP (DOCX & MD) ===');
  await buildDoc1_WebCrmCeo1983();
  await buildDoc2_AppHiepHoiCeo1983();
  await buildDoc3_AppViOneConnect();
  await buildDoc4_WebCrmViOne();
  console.log('=== HOÀN TẤT XUẤT BẢN 100% 4 TẬP TÀI LIỆU WORD VÀ MARKDOWN! ===');
}

main().catch(err => {
  console.error('Lỗi xuất bản:', err);
  process.exit(1);
});
