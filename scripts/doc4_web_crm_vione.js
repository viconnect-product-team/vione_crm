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

function buildDoc4() {
  const hf = createHeaderFooter('Web CRM ViOne Enterprise');
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
          text: 'HỆ ĐIỀU HÀNH QUẢN TRỊ DOANH NGHIỆP VIONE ENTERPRISE CRM',
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
          text: 'Kiến Trúc Đa Doanh Nghiệp (Multi-Tenant 163 Bảng), Phễu Bán Hàng B2B, Hợp Đồng Số & Trợ Lý AI Điều Hành',
          font: 'Times New Roman',
          size: 22,
          italics: true,
          color: '64748B',
        }),
      ],
    })
  );

  addMd('# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & THIẾT KẾ CƠ SỞ DỮ LIỆU');
  addMd('## HỆ ĐIỀU HÀNH QUẢN TRỊ DOANH NGHIỆP VIONE ENTERPRISE CRM');
  addMd('*Phiên bản: Version 3.0 - Bản Chuẩn Hoá Toàn Diện Master BA*');

  const metaHeaders = ['Mục Quản Trị', 'Thông Tin Chi Tiết'];
  const metaRows = [
    ['Tên Dự Án / Phân Hệ', 'Hệ Điều Hành Quản Trị Doanh Nghiệp ViOne Enterprise CRM'],
    ['Mã Tài Liệu', 'SRS-VIONE-ENTERPRISE-CRM-V3.0'],
    ['Phiên Bản', 'Version 3.0 - Master BA Comprehensive Standard'],
    ['Tác Giả & Thẩm Định', 'Master Business Analyst, Solution Architect & ViOne Enterprise Architecture Board'],
    ['Đối Tượng Sử Dụng', 'Tổng Giám Đốc, Giám Đốc Kinh Doanh (CCO), Quản Lý Bán Hàng, Đội Ngũ Sales B2B, Kế Toán Trưởng'],
    ['Nền Tảng Triển Khai', 'Web Application (React 19, TypeScript, TanStack Router, Nitro SSR), Port 5000 / 5001'],
    ['Quy Mô Dữ Liệu', '163 Bảng CSDL Chuẩn Hóa, Kiến Trúc Đa Doanh Nghiệp Cô Lập Hoàn Toàn (tenant_id)'],
    ['Công Nghệ Bảo Mật', 'Row Level Security (RLS), JWT Session Rotation, Mã Hóa Dữ Liệu AES-256, Audit Logging Bất Biến']
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
    createPara('Hệ thống Web CRM ViOne là Tổng Hành Dinh Điều Hành Doanh Số và Quản Trị Khách Hàng của từng doanh nghiệp:'),
    createCallout(
      'HÌNH TƯỢNG VÍ VON ĐỜI THƯỜNG DỄ HIỂU NHẤT:',
      '1. Khái niệm Đa Doanh Nghiệp (Multi-Tenant): Giống như một Tòa Nhà Chung Cư Cao Cấp có 100 căn hộ. Mỗi doanh nghiệp thuê 1 căn hộ riêng với chìa khóa số duy nhất là tenant_id. Nhân viên của Công ty A bước vào chỉ nhìn thấy hợp đồng và khách hàng của Công ty A, tuyệt đối không bao giờ nhìn thấy hay can thiệp vào tài sản của Công ty B.\n' +
      '2. Phễu Bán Hàng (Sales Pipeline): Giống như việc dẫn dắt khách hàng qua từng bậc thang: Từ lúc mới quen (Lead) -> Gửi báo giá (Quotation) -> Thương thảo hợp đồng (Contract) -> Giao hàng xuất kho (Order) -> Thu tiền gạch nợ (Payment).\n' +
      '3. Trợ Lý AI ViOne: Giống như một chuyên gia tư vấn tài chính túc trực 24/7 bên cạnh Tổng Giám Đốc. Hàng ngày AI tự động rà soát 163 ngăn tủ dữ liệu để cảnh báo: "Hợp đồng số 12 sắp hết hạn", "Khách hàng VIP B đã 30 ngày chưa phát sinh đơn mới".',
      'info'
    )
  );

  addMd('## PHẦN 1: GIẢI THÍCH BÌNH DÂN CÁC KHÁI NIỆM KỸ THUẬT CỐT LÕI');
  addMd('> **HÌNH TƯỢNG VÍ VON ĐỜI THƯỜNG:**\n' +
    '> 1. Multi-Tenant = Tòa chung cư cao cấp mỗi công ty có 1 chìa khóa căn hộ riêng biệt (tenant_id).\n' +
    '> 2. Phễu Bán Hàng = Các bậc thang từ Khách tiềm năng -> Báo giá -> Hợp đồng -> Thu tiền.\n' +
    '> 3. AI Copilot = Cố vấn tài chính túc trực 24/7 cảnh báo rủi ro dòng tiền và nhắc hợp đồng.');

  // ==========================================
  // PHẦN 2: MA TRẬN PHÂN QUYỀN NỘI BỘ DOANH NGHIỆP
  // ==========================================
  children.push(createHeading1('PHẦN 2: QUY CHẾ PHÂN QUYỀN NỘI BỘ DOANH NGHIỆP (ENTERPRISE RBAC)'));
  children.push(
    createPara('Trong mỗi doanh nghiệp (Tenant), quyền hạn được phân cấp theo 4 nấc thang nghiệp vụ chặt chẽ:'),
    createCallout(
      'QUY CHẾ PHÂN QUYỀN 4 CẤP BẬC DOANH NGHIỆP:',
      '• Cấp 1 (Chủ tịch / CEO - Tenant Owner): Toàn quyền quản trị doanh nghiệp, xem toàn bộ báo cáo doanh thu, duyệt hợp đồng giá trị lớn, cấu hình nhân sự và phân bổ chiết khấu.\n' +
      '• Cấp 2 (Giám đốc Kinh doanh - Sales Director / CCO): Quản lý toàn bộ phễu bán hàng của công ty, duyệt báo giá của cấp dưới, phân bổ Leads cho nhân viên kinh doanh.\n' +
      '• Cấp 3 (Chuyên viên Kinh doanh - Sales Rep): Chỉ được xem và thao tác trên danh sách Khách hàng và Deals do chính mình được phân công phụ trách (assigned_to = my_user_id).\n' +
      '• Cấp 4 (Kế toán trưởng / Tài chính - Accountant): Quản lý phân hệ Hóa đơn, Thu chi, Đối soát thanh toán VietQR Napas 24/7 và theo dõi công nợ khách hàng.',
      'tip'
    )
  );

  const crmMatrixHeaders = ['Phân Hệ Chức Năng', 'Chức Năng Con', 'Thao Tác Cụ Thể', 'CEO / Chủ Tịch', 'Giám Đốc KD (CCO)', 'Nhân Viên Sales', 'Kế Toán'];
  const crmMatrixRows = [
    ['1. Quản Trị Khách Hàng', 'Danh sách Khách hàng (Accounts)', 'Xem, Thêm, Sửa, Xóa', 'Toàn quyền', 'Toàn quyền', 'Chỉ khách của mình', 'Chỉ Xem'],
    ['1. Quản Trị Khách Hàng', 'Xuất File Excel Khách Hàng', 'Export toàn bộ danh bạ', 'Toàn quyền', 'Toàn quyền', 'Không có quyền', 'Không có quyền'],
    ['2. Phễu Bán Hàng (Pipeline)', 'Kéo thả cơ hội (Deals Kanban)', 'Chuyển giai đoạn thương vụ', 'Toàn quyền', 'Toàn quyền', 'Deals của mình', 'Chỉ Xem'],
    ['2. Phễu Bán Hàng (Pipeline)', 'Phân bổ Leads cho nhân viên', 'Gán nhân sự chăm sóc khách', 'Toàn quyền', 'Toàn quyền', 'Không có quyền', 'Không có quyền'],
    ['3. Báo Giá & Hợp Đồng', 'Tạo Báo Giá B2B (Quotation)', 'Soạn báo giá có chiết khấu', 'Toàn quyền', 'Toàn quyền', 'Soạn báo giá', 'Chỉ Xem'],
    ['3. Báo Giá & Hợp Đồng', 'Phê Duyệt Báo Giá / Hợp Đồng', 'Ký số và duyệt phát hành', 'Duyệt mọi deal', 'Duyệt deal < 1 tỷ', 'Không có quyền', 'Không có quyền'],
    ['4. Tài Chính & Hóa Đơn', 'Phát hành Hóa đơn VietQR', 'Sinh hóa đơn kèm mã QR thanh toán', 'Toàn quyền', 'Chỉ Xem', 'Không có quyền', 'Toàn quyền'],
    ['4. Tài Chính & Hóa Đơn', 'Gạch nợ & Đối soát dòng tiền', 'Xác nhận tiền về tài khoản ngân hàng', 'Toàn quyền', 'Chỉ Xem', 'Không có quyền', 'Toàn quyền'],
    ['5. AI Copilot Điều Hành', 'Báo cáo dự báo doanh thu AI', 'Xem phân tích rủi ro & cơ hội', 'Toàn quyền', 'Xem báo cáo sales', 'Không có quyền', 'Xem báo cáo thu chi']
  ];
  children.push(createTable(crmMatrixHeaders, crmMatrixRows, [18, 22, 20, 10, 10, 10, 10]));

  addMd('## PHẦN 2: QUY CHẾ PHÂN QUYỀN NỘI BỘ DOANH NGHIỆP');
  addMd('| ' + crmMatrixHeaders.join(' | ') + ' |');
  addMd('| ' + crmMatrixHeaders.map(() => '---').join(' | ') + ' |');
  crmMatrixRows.forEach(r => addMd('| ' + r.join(' | ') + ' |'));

  // ==========================================
  // PHẦN 3: ĐẶC TẢ CHI TIẾT TỪNG PHÂN HỆ, APIS & CSDL
  // ==========================================
  children.push(createHeading1('PHẦN 3: ĐẶC TẢ CHI TIẾT APIS, 163 BẢNG CSDL & PHÉP JOIN'));

  // 3.1 Quản trị Leads & Sales Pipeline
  children.push(createHeading2('3.1 Quản Trị Phễu Bán Hàng & Khách Hàng Tiềm Năng (Leads & Deals)'));
  const leadApiHeaders = ['API Endpoint', 'Phương Thức', 'Mô Tả Chức Năng', 'Bảng CSDL Chính', 'Bảng Nối (JOIN)'];
  const leadApiRows = [
    ['/api/crm/leads', 'GET', 'Lấy danh sách Leads theo giai đoạn phễu', 'crm_leads', 'JOIN crm_pipeline_stages'],
    ['/api/crm/leads', 'POST', 'Thêm mới khách hàng tiềm năng', 'crm_leads', 'crm_lead_sources'],
    ['/api/crm/leads/:id/stage', 'PUT', 'Kéo thả chuyển giai đoạn phễu Kanban', 'crm_leads', 'crm_lead_activities'],
    ['/api/crm/leads/:id/convert', 'POST', 'Chuyển đổi Lead thành Khách chính thức (Account)', 'crm_leads & crm_accounts', 'Tự động tạo crm_contacts và crm_deals']
  ];
  children.push(createTable(leadApiHeaders, leadApiRows, [26, 12, 26, 18, 18]));

  children.push(createHeading3('Cấu Trúc Bảng CSDL Chính: crm_leads (Tủ Khách Hàng Tiềm Năng)'));
  const leadColHeaders = ['Tên Cột (Field)', 'Kiểu Dữ Liệu', 'Bắt Buộc?', 'Khóa (Key)', 'Giải Thích Dễ Hiểu'];
  const leadColRows = [
    ['id', 'UUID', 'Có', 'PK', 'Mã khách hàng tiềm năng duy nhất.'],
    ['tenant_id', 'UUID', 'Có', 'FK -> tenants.id', 'Khóa công ty sở hữu khách hàng này (Cô lập đa doanh nghiệp).'],
    ['full_name', 'VARCHAR(255)', 'Có', 'None', 'Họ tên người liên hệ.'],
    ['company_name', 'VARCHAR(255)', 'Không', 'None', 'Tên doanh nghiệp của khách hàng.'],
    ['phone', 'VARCHAR(20)', 'Không', 'None', 'Số điện thoại liên hệ cá nhân.'],
    ['email', 'VARCHAR(255)', 'Không', 'None', 'Địa chỉ email công việc.'],
    ['stage_id', 'UUID', 'Có', 'FK -> crm_pipeline_stages.id', 'Bậc thang trong phễu (Mới, Đang tiếp cận, Chốt deal).'],
    ['estimated_value', 'DECIMAL(15,2)', 'Không', 'None', 'Giá trị hợp đồng ước tính mang lại.'],
    ['assigned_to', 'UUID', 'Không', 'FK -> vione_users.id', 'Nhân viên kinh doanh phụ trách chăm sóc.']
  ];
  children.push(createTable(leadColHeaders, leadColRows, [20, 18, 12, 18, 32]));

  // 3.2 Báo giá B2B & Hợp đồng
  children.push(createHeading2('3.2 Quản Lý Báo Giá B2B, Hợp Đồng & Chiết Khấu Hội Viên (Quotations & Deals)'));
  children.push(
    createPara('Soạn thảo và xuất bản báo giá B2B chuyên nghiệp có kèm chiết khấu hội viên CLB CEO 1983, tự động tính tổng tiền và tạo hợp đồng cung ứng:')
  );

  const quoteApiHeaders = ['API Endpoint', 'Phương Thức', 'Mô Tả Chức Năng', 'Bảng CSDL Chính', 'Bảng Nối (JOIN)'];
  const quoteApiRows = [
    ['/api/crm/quotations', 'POST', 'Khởi tạo báo giá B2B chuyên nghiệp', 'crm_quotations', 'crm_quotation_items JOIN products'],
    ['/api/crm/quotations/:id/approve', 'PUT', 'Giám đốc kinh doanh duyệt báo giá', 'crm_quotations', 'audit_logs'],
    ['/api/crm/contracts/generate', 'POST', 'Chuyển báo giá thành hợp đồng số có hiệu lực', 'crm_contracts', 'JOIN crm_quotations']
  ];
  children.push(createTable(quoteApiHeaders, quoteApiRows, [26, 12, 26, 18, 18]));

  // 3.3 Hóa đơn VietQR & Gạch nợ
  children.push(createHeading2('3.3 Quản Lý Hóa Đơn & Thanh Toán Tự Động VietQR Napas 24/7'));
  const invApiHeaders = ['API Endpoint', 'Phương Thức', 'Mô Tả Chức Năng', 'Bảng CSDL Chính', 'Bảng Nối (JOIN)'];
  const invApiRows = [
    ['/api/crm/invoices', 'POST', 'Xuất hóa đơn thanh toán cho hợp đồng', 'crm_invoices', 'Tự động tạo mã VietQR động 24/7'],
    ['/api/crm/invoices/unpaid', 'GET', 'Danh sách các hóa đơn công nợ cần thu', 'crm_invoices', 'JOIN crm_accounts ON invoices.account_id = accounts.id'],
    ['/api/crm/webhooks/payment', 'POST', 'Ngân hàng báo có tiền -> Tự động gạch nợ', 'crm_invoices, bank_transactions', 'Cập nhật status = "paid"']
  ];
  children.push(createTable(invApiHeaders, invApiRows, [26, 12, 26, 18, 18]));

  // ==========================================
  // PHẦN 4: MA TRẬN QUAN HỆ THỰC THỂ CSDL & SQL JOIN
  // ==========================================
  children.push(createHeading1('PHẦN 4: MA TRẬN QUAN HỆ THỰC THỂ CSDL & CÂU LỆNH SQL JOIN MẪU'));
  const erdHeaders = ['Bảng Gốc (Table A)', 'Bảng Đích (Table B)', 'Điều Kiện Khóa Ngoại (ON Clause)', 'Mối Quan Hệ', 'Ý Nghĩa Nghiệp Vụ'];
  const erdRows = [
    ['tenants', 'vione_users', 'tenants.id = vione_users.tenant_id', '1 - Nhiều', 'Một doanh nghiệp sở hữu danh sách nhiều nhân viên.'],
    ['tenants', 'crm_leads', 'tenants.id = crm_leads.tenant_id', '1 - Nhiều', 'Một doanh nghiệp quản lý hàng ngàn khách tiềm năng.'],
    ['crm_leads', 'crm_deals', 'crm_leads.id = crm_deals.lead_id', '1 - Nhiều', 'Từ một khách tiềm năng có thể mở ra nhiều thương vụ bán hàng.'],
    ['crm_deals', 'crm_quotations', 'crm_deals.id = crm_quotations.deal_id', '1 - Nhiều', 'Một thương vụ có thể gửi nhiều phiên bản báo giá.'],
    ['crm_quotations', 'crm_contracts', 'crm_quotations.id = crm_contracts.quotation_id', '1 - 1', 'Báo giá được duyệt sẽ chuyển hóa thành hợp đồng số.'],
    ['crm_contracts', 'crm_invoices', 'crm_contracts.id = crm_invoices.contract_id', '1 - Nhiều', 'Một hợp đồng có các kỳ thanh toán theo tiến độ.']
  ];
  children.push(createTable(erdHeaders, erdRows, [16, 18, 28, 12, 26]));

  children.push(
    createCallout(
      'CÂU LỆNH SQL JOIN MẪU: BÁO CÁO DOANH THU HỢP ĐỒNG ĐÃ THU TIỀN THEO TỪNG NHÂN VIÊN:',
      'SELECT u.full_name AS sales_rep, COUNT(c.id) AS total_contracts, SUM(i.paid_amount) AS total_revenue_collected ' +
      'FROM crm_contracts c ' +
      'INNER JOIN vione_users u ON c.assigned_to = u.id ' +
      'INNER JOIN crm_invoices i ON c.id = i.contract_id ' +
      'WHERE c.tenant_id = :current_tenant_id AND i.status = "paid" ' +
      'GROUP BY u.id, u.full_name ' +
      'ORDER BY total_revenue_collected DESC;\n\n' +
      '* Giải thích bình dân: Máy tính mở tủ crm_contracts lấy hợp đồng, kẹp với tủ nhân viên để biết ai bán được, rồi kẹp tiếp với tủ hóa đơn crm_invoices xem khách đã chuyển khoản bao nhiêu tiền vào tài khoản.',
      'tip'
    )
  );

  // ==========================================
  // PHẦN 5: KỊCH BẢN KIỂM THỬ NGHIỆM THU UAT
  // ==========================================
  children.push(createHeading1('PHẦN 5: KỊCH BẢN KIỂM THỬ NGHIỆM THU (ENTERPRISE CRM UAT)'));
  const uatHeaders = ['Mã Test Case', 'Tên Nghiệp Vụ', 'Thao Tác Thực Hiện', 'Kỳ Vọng Kỹ Thuật', 'Kỳ Vọng Giao Diện'];
  const uatRows = [
    ['TC_CRM_ENT_01', 'Cô lập dữ liệu giữa 2 công ty', 'User Công ty A tra cứu khách hàng', 'Chỉ trả về các bản ghi có tenant_id của Công ty A', 'Không nhìn thấy bất kỳ dữ liệu nào của Công ty B'],
    ['TC_CRM_ENT_02', 'Kéo thả Deal trên Kanban', 'Kéo thẻ thương vụ từ "Báo giá" sang "Chốt"', 'PUT /api/crm/deals/:id/stage cập nhật stage_id mới', 'Thẻ chuyển cột mượt mà, tổng doanh thu dự kiến nhảy số'],
    ['TC_CRM_ENT_03', 'Tạo Báo Giá có chiết khấu', 'Thêm 3 sản phẩm, nhập chiết khấu 10%', 'Tính chính xác: Tổng = Tiền hàng - Chiết khấu + VAT', 'Bản xem trước PDF chuẩn hóa mẫu doanh nghiệp'],
    ['TC_CRM_ENT_04', 'Thanh toán VietQR Napas 24/7', 'Khách quét VietQR chuyển tiền ngân hàng', 'Webhook ngân hàng kích hoạt gạch nợ tự động', 'Hóa đơn đổi trạng thái Đã Thanh Toán tức thì']
  ];
  children.push(createTable(uatHeaders, uatRows, [14, 20, 22, 22, 22]));

  addMd('## PHẦN 5: KỊCH BẢN KIỂM THỬ NGHIỆM THU (ENTERPRISE CRM UAT)');
  addMd('| ' + uatHeaders.join(' | ') + ' |');
  addMd('| ' + uatHeaders.map(() => '---').join(' | ') + ' |');
  uatRows.forEach(r => addMd('| ' + r.join(' | ') + ' |'));

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

module.exports = { buildDoc4 };
