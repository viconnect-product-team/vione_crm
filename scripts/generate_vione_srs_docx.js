const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  TableLayoutType,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  Header,
  Footer,
  PageNumber
} = require('docx');

const FONT_FAMILY = 'Times New Roman';
const DARK_OBSIDIAN = '0A0A0B';
const GOLD = 'D8B282';
const NAVY = '003B95';
const BORDER_COLOR = 'CBD5E1';
const TOTAL_WIDTH = 9200; // DXA

const BORDER_THIN = {
  top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
};

function createPara(text, opts = {}) {
  return new Paragraph({
    alignment: opts.alignment || AlignmentType.LEFT,
    spacing: opts.spacing || { before: 80, after: 80, line: 276 },
    children: [
      new TextRun({
        text,
        font: FONT_FAMILY,
        size: opts.size || 24, // 12pt
        bold: opts.bold || false,
        italics: opts.italics || false,
        color: opts.color || '1E293B',
      }),
    ],
  });
}

function createHeading1(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 260, after: 120 },
    children: [
      new TextRun({
        text: title,
        font: FONT_FAMILY,
        size: 30, // 15pt
        bold: true,
        color: '0F172A',
      }),
    ],
  });
}

function createHeading2(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 180, after: 80 },
    children: [
      new TextRun({
        text: title,
        font: FONT_FAMILY,
        size: 26, // 13pt
        bold: true,
        color: 'A67A47', // ViOne Warm Gold / Bronze
      }),
    ],
  });
}

function createHeading3(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 140, after: 60 },
    children: [
      new TextRun({
        text: title,
        font: FONT_FAMILY,
        size: 24, // 12pt
        bold: true,
        color: '334155',
      }),
    ],
  });
}

function createCallout(title, text) {
  return new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    columnWidths: [TOTAL_WIDTH],
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      left: { style: BorderStyle.SINGLE, size: 24, color: 'D8B282' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: TOTAL_WIDTH, type: WidthType.DXA },
            shading: { fill: 'FEF3C7', type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 180, right: 180 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 40 },
                children: [
                  new TextRun({
                    text: title,
                    font: FONT_FAMILY,
                    bold: true,
                    size: 22,
                    color: '92400E',
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0, line: 260 },
                children: [
                  new TextRun({
                    text,
                    font: FONT_FAMILY,
                    italics: true,
                    size: 22,
                    color: '451A03',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createTable(headers, rowsData, widths = []) {
  const sum = widths && widths.length > 0 ? widths.reduce((a, b) => a + Number(b), 0) : 0;
  const colWidthsDxa = headers.map((_, i) => {
    if (sum > 0 && widths[i] !== undefined) {
      return Math.round((Number(widths[i]) / sum) * TOTAL_WIDTH);
    }
    return Math.round(TOTAL_WIDTH / headers.length);
  });

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => {
      return new TableCell({
        width: { size: colWidthsDxa[i], type: WidthType.DXA },
        shading: { fill: DARK_OBSIDIAN, type: ShadingType.CLEAR },
        borders: BORDER_THIN,
        margins: { top: 120, bottom: 120, left: 140, right: 140 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: h,
                font: FONT_FAMILY,
                bold: true,
                size: 20,
                color: 'FFFFFF',
              }),
            ],
          }),
        ],
      });
    }),
  });

  const bodyRows = rowsData.map((row, rIdx) => {
    const isEven = rIdx % 2 === 0;
    const bgColor = isEven ? 'FFFFFF' : 'F8FAFC';
    return new TableRow({
      children: row.map((cellText, i) => {
        return new TableCell({
          width: { size: colWidthsDxa[i], type: WidthType.DXA },
          shading: { fill: bgColor, type: ShadingType.CLEAR },
          borders: BORDER_THIN,
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: String(cellText || ''),
                  font: FONT_FAMILY,
                  size: 20,
                  color: '1E293B',
                }),
              ],
            }),
          ],
        });
      }),
    });
  });

  return new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    columnWidths: colWidthsDxa,
    layout: TableLayoutType.FIXED,
    rows: [headerRow, ...bodyRows],
  });
}

async function generateSRS() {
  console.log('=== GENERATING VIONE SRS WORD DOCUMENT (500+ UCs) ===');
  const children = [];

  // 1. COVER PAGE
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: 'TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & THIẾT KẾ CƠ SỞ DỮ LIỆU',
          font: FONT_FAMILY,
          size: 24,
          bold: true,
          color: 'A67A47',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 120 },
      children: [
        new TextRun({
          text: 'HỆ SINH THÁI QUẢN TRỊ DOANH NGHIỆP VIONE ENTERPRISE CRM\nVÀ ỨNG DỤNG KẾT NỐI VIONE CONNECT MOBILE',
          font: FONT_FAMILY,
          size: 32,
          bold: true,
          color: '0A0A0B',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 200 },
      children: [
        new TextRun({
          text: 'Chuẩn Hoá Toàn Diện 500+ Use Cases Nghiệp Vụ, 80 Business Rules & 163 Bảng CSDL Multi-Tenant',
          font: FONT_FAMILY,
          size: 22,
          italics: true,
          color: '64748B',
        }),
      ],
    })
  );

  // Metadata Table
  const metaHeaders = ['Mục Quản Trị', 'Thông Tin Chi Tiết'];
  const metaRows = [
    ['Tên Dự Án', 'Hệ Sinh Thái ViOne: Web CRM Enterprise & App ViOne Connect'],
    ['Mã Tài Liệu', 'SRS-VIONE-ENTERPRISE-TOAN-DIEN-V5.0'],
    ['Phiên Bản', 'Version 5.0 - Master BA & Solution Architect Standard'],
    ['Cơ Quan Ban Hành', 'ViOne Enterprise Architecture Board & Product Team'],
    ['Đối Tượng Áp Dụng', 'Tổng Giám Đốc (CEO), Ban Điều Hành, Trưởng Phòng Vận Hành, Kế Toán Trưởng, Kỹ Sư Phát Triển & QA/QC'],
    ['Nền Tảng Triển Khai', 'Web CRM Enterprise (TanStack Start, React 19, TypeScript) & App Mobile (React Native Expo SDK 52)'],
    ['Quy Mô Dữ Liệu', '163 Bảng CSDL Chuẩn Hóa Prisma ORM, Phân Lập Đa Doanh Nghiệp (Multi-Tenant tenant_id)'],
    ['Bảo Mật & Tiêu Chuẩn', 'JWT Session Rotation, Row Level Security (RLS), AES-256 Data Encryption, Chuẩn RESTful Quốc Tế']
  ];
  children.push(createTable(metaHeaders, metaRows, [30, 70]));

  children.push(
    new Paragraph({
      pageBreakBefore: true,
      children: []
    })
  );

  // CHƯƠNG 1
  children.push(createHeading1('CHƯƠNG 1: GIỚI THIỆU, TẦM NHÌN & MỤC TIÊU HỆ THỐNG'));
  children.push(
    createPara('Hệ sinh thái ViOne là nền tảng quản trị và kết nối doanh nghiệp C-Level toàn diện, bao gồm hai phân hệ cốt lõi hoạt động gắn kết chặt chẽ:'),
    createPara('1. Hệ thống Web CRM ViOne Enterprise: Tổng hành dinh điều hành quản trị doanh nghiệp, bao gồm giám sát quy trình nghiệp vụ BPMN 2.0, phân bổ tải công việc nhân sự (Workload Heatmap), kiểm soát chấm công thời gian thực GPS & AI FaceID, phê duyệt tài chính 3 cấp (Maker-Checker-Approver), và quản trị cơ hội giao thương B2B.'),
    createPara('2. Ứng dụng Di động ViOne Connect (Native & PWA): Công cụ di động bỏ túi dành riêng cho Doanh nhân và Lãnh đạo doanh nghiệp. Được thiết kế theo ngôn ngữ Dark Luxury Obsidian (#0A0A0B) kết hợp Vàng Đồng Hoàng Gia (#D8B282), tích hợp danh thiếp số thông minh VIP Card 3D, chia sẻ chạm thẻ NFC, quét mã QR, mạng xã hội giao thương B2B Moments, hộp thư đàm phán kinh doanh, và các lối tắt điều hành doanh nghiệp tức thì.'),
    createCallout(
      'MỤC TIÊU CỐT LÕI CỦA VIONE:',
      'ViOne giải quyết bài toán cốt tử của lãnh đạo doanh nghiệp: "Nhìn thấy toàn bộ quy trình làm việc, thấu suốt tải công việc của từng nhân viên theo thời gian thực, duyệt chi minh bạch 3 cấp, và mở rộng mạng lưới giao thương C-Level không giới hạn."'
    )
  );

  // CHƯƠNG 2
  children.push(createHeading1('CHƯƠNG 2: KIẾN TRÚC KỸ THUẬT & BỐI CẢNH ĐA DOANH NGHIỆP (MULTI-TENANT)'));
  children.push(
    createPara('Hệ sinh thái ViOne được xây dựng theo kiến trúc hiện đại, phân tán và module hóa cao độ:'),
    createPara('• Monorepo Turborepo: Quản lý đồng bộ 4 phân hệ chính (@vibe/vione_app_fe, @vibe/vione_app_be, @vibe/mobile_vione, @vibe/db).'),
    createPara('• Backend Service (NestJS): Cung cấp hơn 120 API RESTful chuẩn mực quốc tế, xử lý nghiệp vụ xác thực, phân quyền RBAC đa cấp, điều hành quy trình, chấm công GPS/FaceID và tích hợp thanh toán VietQR Napas 24/7.'),
    createPara('• Frontend Web CRM (TanStack Start & React 19): Tận dụng Server-Side Rendering (SSR) và Client-Side Routing mượt mà, hỗ trợ giao diện trực quan bảng Kanban BPMN, biểu đồ Gantt, ma trận Heatmap tải nhân sự và các bảng đối soát tài chính.'),
    createPara('• Mobile Native App (React Native Expo SDK 52): Ứng dụng di động thuần Native độc lập, chạy offline mượt mà với Hermes Bytecode, tương đồng 100% về bảng màu Dark Luxury, font chữ và thành phần giao diện với bản PWA.'),
    createPara('• Cơ sở dữ liệu Multi-Tenant (163 bảng Prisma ORM): Dữ liệu của từng doanh nghiệp được phân lập tuyệt đối thông qua trường khóa tenant_id kết hợp với chính sách Row Level Security (RLS) của PostgreSQL, đảm bảo Công ty A không bao giờ nhìn thấy dữ liệu của Công ty B.')
  );

  // CHƯƠNG 3
  children.push(createHeading1('CHƯƠNG 3: 80 BUSINESS RULES CỐT LÕI (BRD MASTER STANDARD)'));
  children.push(
    createPara('Hệ thống ViOne thực thi nghiêm ngặt 80 Quy tắc Nghiệp vụ (Business Rules) được chuẩn hóa từ BRD Master:'),
    createHeading2('1. Quy Tắc Vận Hành Quy Trình & Phân Bổ Công Việc (BR-WRK)')
  );

  const brWrkHeaders = ['Mã Rule', 'Tên Quy Tắc Nghiệp Vụ', 'Nội Dung & Ràng Buộc Kỹ Thuật'];
  const brWrkRows = [
    ['BR-WRK-01', 'Bắt buộc gán người phụ trách & Deadline', 'Mọi công việc khi tạo trên BPMN Kanban bắt buộc phải có ít nhất 1 assignee và deadline rõ ràng. Không cho phép tạo task vô danh.'],
    ['BR-WRK-02', 'Cảnh báo đỏ phát sáng khi quá hạn', 'Khi thời gian hiện tại vượt quá deadline mà task chưa hoàn thành, thẻ task tự động đổi màu viền đỏ phát sáng (glowing pulse) trên cả Web và Mobile.'],
    ['BR-WRK-03', 'Giới hạn WIP (Work In Progress <= 5)', 'Mỗi nhân viên tại một thời điểm không được nhận quá 5 công việc ở trạng thái In Progress để đảm bảo chất lượng hoàn thành.'],
    ['BR-WRK-07', 'Chặn hoàn thành khi Checklist < 100%', 'Nghiêm cấm kéo thẻ sang cột "Done" nếu danh mục nghiệm thu (checklist) chưa được tích chọn đủ 100% các tiêu chí.'],
    ['BR-WRK-14', 'Cảnh báo đỏ nhân sự quá tải > 45h/tuần', 'Khi tổng thời lượng công việc ước tính trong tuần của nhân viên vượt ngưỡng 45 giờ, ô tương ứng trên Workload Heatmap lập tức hiển thị màu đỏ cảnh báo quá tải.'],
    ['BR-WRK-15', 'Cân bằng tải tự động gợi ý điều chuyển', 'Hệ thống tự động đề xuất các nhân sự đang có tải < 30h/tuần để C-Level hoặc Quản lý dự án thực hiện điều chuyển công việc 1-chạm.']
  ];
  children.push(createTable(brWrkHeaders, brWrkRows, [18, 32, 50]));

  children.push(createHeading2('2. Quy Tắc Giám Sát Chấm Công & Nhân Sự (BR-HRM)'));
  const brHrmHeaders = ['Mã Rule', 'Tên Quy Tắc Chấm Công', 'Nội Dung & Ràng Buộc Kỹ Thuật'];
  const brHrmRows = [
    ['BR-HRM-01', 'Định vị GPS Bán kính <= 50m', 'Nhân viên chỉ được phép chấm công check-in/check-out khi tọa độ thiết bị nằm trong bán kính không quá 50 mét so với tọa độ văn phòng công ty.'],
    ['BR-HRM-02', 'AI FaceID Liveness >= 92%', 'Nhận diện khuôn mặt thời gian thực yêu cầu độ tin cậy và kiểm tra thực thể sống (liveness detection) đạt từ 92% trở lên để chống giả mạo bằng ảnh chụp.'],
    ['BR-HRM-06', 'Duyệt đơn nghỉ phép / Tăng ca 1-chạm', 'Đơn xin nghỉ phép hoặc làm thêm giờ (OT) gửi trực tiếp đến Quản lý trực tiếp và CEO, hỗ trợ ký duyệt hoặc từ chối 1-chạm tức thì.'],
    ['BR-HRM-14', 'Khóa công tự động ngày 02 hàng tháng', 'Dữ liệu chấm công tháng trước tự động chốt và khóa sổ vào 23:59:59 ngày 02 hàng tháng. Sau thời điểm này, mọi sửa đổi phải có phê duyệt của CEO.']
  ];
  children.push(createTable(brHrmHeaders, brHrmRows, [18, 32, 50]));

  children.push(createHeading2('3. Quy Tắc Phê Duyệt Tài Chính & Dòng Tiền (BR-FIN)'));
  const brFinHeaders = ['Mã Rule', 'Tên Quy Tắc Tài Chính', 'Nội Dung & Ràng Buộc Kỹ Thuật'];
  const brFinRows = [
    ['BR-FIN-01', 'Luồng phê duyệt 3 cấp Maker-Checker-Approver', 'Mọi khoản chi tiêu doanh nghiệp phải trải qua 3 bước: Nhân viên lập tờ trình (Maker) -> Kế toán trưởng thẩm định (Checker) -> Lãnh đạo ký duyệt (Approver).'],
    ['BR-FIN-02', 'Hạn mức phê duyệt CEO > 20 triệu VNĐ', 'Các khoản chi có giá trị từ 20,000,000 VNĐ trở lên bắt buộc phải có chữ ký phê duyệt cuối cùng của Tổng Giám Đốc (CEO).'],
    ['BR-FIN-06', 'Thanh toán VietQR Napas 24/7 gạch nợ 1 giây', 'Tờ trình sau khi được CEO phê duyệt tự động sinh mã VietQR động chứa mã định danh giao dịch, tự động gạch nợ trong vòng 1 giây khi nhận biến động số dư.'],
    ['BR-FIN-07', 'Khử trùng hóa đơn VAT chống chi trùng', 'Hệ thống tự động kiểm tra số hóa đơn tài chính và mã số thuế bên thụ hưởng, chặn tuyệt đối việc lập nhiều phiếu chi cho cùng một hóa đơn.']
  ];
  children.push(createTable(brFinHeaders, brFinRows, [18, 32, 50]));

  // CHƯƠNG 4
  children.push(
    new Paragraph({ pageBreakBefore: true, children: [] }),
    createHeading1('CHƯƠNG 4: ĐẶC TẢ CHI TIẾT 22 PHÂN HỆ & MA TRẬN 500+ USE CASES')
  );

  children.push(
    createPara('Hệ thống ViOne bao quát hơn 500 Use Cases (Trường hợp sử dụng) chia đều trên 22 phân hệ chính (14 phân hệ Web CRM Enterprise và 8 phân hệ App ViOne Connect):')
  );

  const ucGroupHeaders = ['Mã Phân Hệ', 'Tên Phân Hệ Nghiệp Vụ', 'Số Lượng UCs', 'Mô Tả Chức Năng Cha & Con', 'Tác Nhân (Actors)'];
  const ucGroupRows = [
    // CRM
    ['CRM-AUTH', 'Xác Thực & Phân Quyền RBAC', '25 UCs', 'Đăng nhập đa cấp, đổi mật khẩu, cấp quyền 6 vai trò, thu hồi quyền, audit logs', 'Super Admin, Manager, Staff'],
    ['CRM-DASH', 'Dashboard Điều Hành C-Level', '30 UCs', 'KPI doanh thu, công nợ, tiến độ quy trình, tải nhân sự, lọc chu kỳ, xuất báo cáo', 'CEO, C-Level, Director'],
    ['CRM-MEM', 'Quản Lý thành viên doanh nghiệp & Đối Tác B2B', '40 UCs', 'Danh bạ doanh nhân, duyệt thành viên, phân nhóm VIP, xuất Excel, xem hồ sơ pháp nhân', 'Admin, Sales Lead, Partner Manager'],
    ['CRM-COMP', 'Quản Trị Đa Công Ty (Multi-Tenant)', '30 UCs', 'Hồ sơ pháp nhân, mã số thuế, chi nhánh, phân lập dữ liệu tenant_id, cấu hình tài khoản', 'Super Admin, Corporate Admin'],
    ['CRM-OPP', 'Sàn Cơ Hội Giao Thương B2B', '35 UCs', 'Đăng nhu cầu mua/bán, phễu chuyển đổi Deal, AI Matchmaking, lịch sử giao dịch', 'CEO, Business Dev, Sales Lead'],
    ['CRM-EVT', 'Sự Kiện B2B & Cinema Seating', '35 UCs', 'Khởi tạo hội thảo, phân hạng vé VIP, sơ đồ chỗ ngồi rạp chiếu, mã QR check-in cổng', 'Event Manager, Coordinator'],
    ['CRM-PROD', 'Sàn Showcase Sản Phẩm E-Catalog', '30 UCs', 'Đăng giải pháp B2B, quản lý giá bán, chiết khấu đối tác, kiểm duyệt gian hàng', 'Product Manager, Merchant'],
    ['CRM-WRK', 'Quản Trị Quy Trình BPMN 2.0', '40 UCs', 'Kanban kéo thả, checklist nghiệm thu 100%, cảnh báo đỏ quá hạn, biểu đồ Gantt', 'Project Manager, Team Lead, Member'],
    ['CRM-WLD', 'Giám Sát Tải Nhân Sự (Workload)', '25 UCs', 'Workload Heatmap theo tuần, cảnh báo đỏ >45h, cân bằng phân bổ công việc', 'HR Director, Project Manager, CEO'],
    ['CRM-ATT', 'Chấm Công GPS 50m & AI FaceID', '35 UCs', 'Bảng công thời gian thực, định vị GPS <=50m, FaceID >=92%, duyệt nghỉ phép/OT, khóa công', 'HR Manager, Team Leader, CEO'],
    ['CRM-APP', 'Phê Duyệt Chi 3 Cấp & VietQR', '40 UCs', 'Tạo tờ trình (Maker), thẩm định (Checker), CEO duyệt (Approver), Napas VietQR 24/7', 'Staff (Maker), KTT (Checker), CEO'],
    ['CRM-FIN', 'Quản Lý Thu Chi & Sổ Quỹ', '30 UCs', 'Sổ quỹ tiền mặt, tài khoản ngân hàng, hóa đơn điện tử, báo cáo lợi nhuận', 'Accountant, Chief Accountant, CFO'],
    ['CRM-BEN', 'Quyền Lợi & Gói Giải Pháp C-Level', '20 UCs', 'Danh mục đặc quyền VIP, kích hoạt ưu đãi đối tác liên minh, đối soát quyền lợi', 'Membership Manager, VIP Member'],
    ['CRM-SYS', 'Cấu Hình Hệ Thống & Bảo Mật', '20 UCs', 'Thiết lập tham số toàn cục, nhật ký kiểm toán bất biến, giám sát phiên làm việc', 'Super Administrator, Security Officer'],
    // APP
    ['APP-AUTH', 'Đăng Nhập Dark Luxury & OAuth', '25 UCs', 'Giao diện Obsidian #0A0A0B, OAuth Google/Apple, quét danh thiếp NFC login', 'Business User, CEO, Partner'],
    ['APP-HOME', 'Executive Home & Agenda', '25 UCs', 'Thẻ định danh cover vba-hero.jpg, lời chào buổi, thông báo chuông, avatar viền vàng', 'Executive User, VIP Member'],
    ['APP-SCHED', 'Lịch Trình Công Việc 3 Tab', '20 UCs', 'Tab phân đoạn Hôm nay / Sắp tới / Nhắc lịch, hiệu ứng viên thuốc Gradient Vàng', 'Executive User, Personal Assistant'],
    ['APP-INS', 'Thẻ Insight Cơ Hội Kết Nối', '15 UCs', '15 cơ hội ghép nối tiềm năng cao, phân tích ngành nghề, CTA khám phá tức thì', 'Business Leader, Deal Maker'],
    ['APP-ACT', '3 Lối Tắt Nhanh Quick Actions', '15 UCs', 'Cuộc gặp 1-1, Quét thẻ đối tác, Thẻ của tôi, điều hướng nhanh 0ms', 'All Mobile Users'],
    ['APP-OPS', 'Giám Sát Vận Hành Nhân Sự Mobile', '35 UCs', 'Chấm công GPS FaceID, theo dõi Kanban task cá nhân, ký duyệt tờ trình chi 3 cấp', 'CEO, Manager, Employee'],
    ['APP-NET', 'Mạng Lưới Đối Tác C-Level', '30 UCs', '3 bộ lọc (Đã kết nối, Lời mời, Gợi ý AI), danh thiếp đối tác, nút nhắn tin trực tiếp', 'Business User, Networker'],
    ['APP-INB', 'Hộp Thư Messenger 4 Danh Mục', '30 UCs', 'Tất cả (kèm outbox Bạn: ...), Chưa đọc, Nhóm, Chờ; đếm số tin mới, tạo nhóm B2B', 'Messenger User, Group Admin'],
    ['APP-CHT', 'Khung Chat 1-1 & Nhóm Thảo Luận', '30 UCs', 'Gửi nhận tin nhắn 0ms optimistic UI, bong bóng vàng hổ phách, đánh dấu đã đọc', 'Chat Participants'],
    ['APP-CRD', 'Danh Thiếp 3D & Mã QR Chia Sẻ', '25 UCs', 'Thẻ VIP 3D mạ vàng, mã QR chia sẻ tức thì, thiết lập bảo mật thông tin liên hệ', 'VIP Member, Executive'],
    ['APP-NFC', 'Radar Chạm Thẻ NFC Trao Đổi', '15 UCs', 'Quét radar NFC, rung xác thực, tự động lưu đối tác vào danh bạ điện thoại', 'Executive with NFC Device'],
    ['APP-MOM', 'B2B Moments Bảng Tin Giao Thương', '25 UCs', 'Đăng ảnh ký kết hợp đồng, thả tim, bình luận tương tác giữa các doanh nhân', 'Community Members']
  ];
  children.push(createTable(ucGroupHeaders, ucGroupRows, [16, 26, 12, 32, 14]));

  // CHƯƠNG 5
  children.push(
    new Paragraph({ pageBreakBefore: true, children: [] }),
    createHeading1('CHƯƠNG 5: YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)')
  );
  children.push(
    createPara('Hệ sinh thái ViOne tuân thủ các tiêu chuẩn kỹ thuật cấp doanh nghiệp khắt khe nhất:'),
    createPara('1. Hiệu năng & Khả năng chịu tải (Performance & Scalability):'),
    createPara('• Thời gian phản hồi API trung bình đạt dưới 200ms cho 95% số yêu cầu (p95 latency < 200ms).'),
    createPara('• Khả năng chịu tải đồng thời (Concurrency) đáp ứng tối thiểu 10,000 người dùng hoạt động đồng thời (CCU) mà không gây sụt giảm hiệu năng.'),
    createPara('2. Tính sẵn sàng & Dự phòng thảm họa (Availability & Disaster Recovery):'),
    createPara('• Mức độ sẵn sàng của hệ thống cam kết đạt tối thiểu 99.9% (High Availability).'),
    createPara('• Cơ chế sao lưu cơ sở dữ liệu tự động định kỳ mỗi 6 giờ, thời gian phục hồi dữ liệu (RTO) dưới 30 phút và mục tiêu điểm phục hồi (RPO) dưới 15 phút.'),
    createPara('3. An ninh mạng & Bảo vệ dữ liệu (Security & Compliance):'),
    createPara('• Mã hóa toàn bộ dữ liệu nhạy cảm ở trạng thái nghỉ (At-Rest) bằng thuật toán AES-256-GCM.'),
    createPara('• Toàn bộ kết nối trên môi trường mạng bắt buộc phải được mã hóa qua TLS 1.3 (In-Transit).'),
    createPara('• Cơ chế xác thực sử dụng JSON Web Token (JWT) với Access Token có thời hạn ngắn (15 phút) và Refresh Token được lưu trữ an toàn trong HttpOnly Cookie.'),
    createPara('4. Trải nghiệm người dùng & Tính thẩm mỹ (UX & Visual Excellence):'),
    createPara('• Phiên bản ứng dụng di động React Native và bản Web PWA đồng bộ 100% về ngôn ngữ thiết kế Dark Luxury Obsidian (#0A0A0B), chi tiết mạ vàng đồng Bronze Gold (#D8B282), không có hiện tượng giật lag, đảm bảo tốc độ khung hình 60 FPS.')
  );

  // CHƯƠNG 6
  children.push(createHeading1('CHƯƠNG 6: DANH MỤC API RESTFUL & TÍCH HỢP'));
  children.push(
    createPara('Hệ thống cung cấp danh mục API RESTful toàn diện tại tiền tố /api, bao gồm:'),
    createPara('• Nhóm Xác thực (/api/auth): POST /login, POST /refresh, POST /logout, GET /me.'),
    createPara('• Nhóm Vận hành Doanh nghiệp (/api/operations): 16 endpoints quản lý Workflow tasks, Workload heatmap, Attendance GPS/FaceID, Payment Approvals 3 cấp và VietQR Napas 24/7.'),
    createPara('• Nhóm Mạng lưới & Hộp thư (/api/connect-app): Quản lý đối tác, trao đổi danh thiếp số, gửi nhận tin nhắn DM threads và bài đăng B2B Moments.')
  );

  // CHƯƠNG 7
  children.push(createHeading1('CHƯƠNG 7: TIÊU CHÍ NGHIỆM THU & BÀN GIAO'));
  children.push(
    createPara('Hệ thống được coi là hoàn thành và đủ điều kiện nghiệm thu khi đáp ứng đầy đủ các tiêu chuẩn:'),
    createPara('1. Kiểm thử phần mềm: 100% các Test Cases (725 test cases) đạt kết quả PASSED trên môi trường kiểm thử chính thức.'),
    createPara('2. Độ sạch của mã nguồn: Lệnh kiểm tra kiểu dữ liệu (npx tsc --noEmit) trả về exit code 0 (0 errors, 0 warnings) trên toàn bộ các package (Backend, Frontend, Mobile).'),
    createPara('3. Ứng dụng di động: Tệp tin APK Release độc lập (ViOne-Connect-latest.apk) được biên dịch thành công, cài đặt và vận hành mượt mà trên các thiết bị Android từ phiên bản 8.0 trở lên.'),
    createPara('4. Tài liệu kỹ thuật: Đầy đủ 5 bộ tài liệu chuẩn mực (HDSD PDF ảnh thật, SRS Word 500+ UCs, Slide thuyết trình PDF, Bảng tiến độ công việc WBS Excel, và Bảng Test Cases Excel chi tiết).')
  );

  // Build Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }, // 1 inch = 1440 twips
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'ViOne Enterprise CRM & Connect App | SRS Specification v5.0',
                    font: FONT_FAMILY,
                    size: 18,
                    italics: true,
                    color: '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Trang ',
                    font: FONT_FAMILY,
                    size: 18,
                    color: '94A3B8',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: FONT_FAMILY,
                    size: 18,
                    bold: true,
                    color: '94A3B8',
                  }),
                  new TextRun({
                    text: ' / ',
                    font: FONT_FAMILY,
                    size: 18,
                    color: '94A3B8',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: FONT_FAMILY,
                    size: 18,
                    color: '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const outPath = path.join(__dirname, '../document/SRS_HE_THONG_VA_APP_VIONE_TOAN_DIEN.docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  console.log(`>>> WORD SRS GENERATED: ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

generateSRS().catch(err => {
  console.error(err);
  process.exit(1);
});
