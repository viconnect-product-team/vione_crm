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
const pptxgen = require('pptxgenjs');

const ROOT_DIR = path.join(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'document');
const EVIDENCE_NEW_DIR = path.join(DOCS_DIR, 'images', 'evidence_new');

if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

console.log('=== VIONE DELIVERABLES GENERATOR ===');
console.log('Target Directory:', DOCS_DIR);

// Colors & Styling Constants
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
    layout: TableLayoutType.FIXED,
    columnWidths: colWidthsDxa,
    rows: [headerRow, ...bodyRows],
  });
}

// -------------------------------------------------------------
// 1. BUILD BRD WORD DOCUMENT (.DOCX)
// -------------------------------------------------------------
async function buildBrdDocx() {
  console.log('Generating BRD Word Document...');
  const mdPath = path.join(DOCS_DIR, 'BRD_VIONE_YEU_CAU_NGHIEP_VU_TOAN_DIEN.md');
  const mdContent = fs.readFileSync(mdPath, 'utf8');

  const lines = mdContent.split('\n');
  const docChildren = [];

  // Cover Page Block
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 800, after: 200 },
      children: [
        new TextRun({
          text: 'TẬP ĐOÀN CÔNG NGHỆ VIOCONNECT',
          font: FONT_FAMILY,
          size: 28,
          bold: true,
          color: NAVY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 600 },
      children: [
        new TextRun({
          text: 'BAN CÔNG NGHỆ & CHUYỂN ĐỔI SỐ — HỆ ĐIỀU HÀNH DOANH NGHIỆP VIONE',
          font: FONT_FAMILY,
          size: 20,
          bold: true,
          color: '475569',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: 'TÀI LIỆU YÊU CẦU NGHIỆP VỤ DOANH NGHIỆP & HIỆP HỘI',
          font: FONT_FAMILY,
          size: 38,
          bold: true,
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 400 },
      children: [
        new TextRun({
          text: '(BUSINESS REQUIREMENTS DOCUMENT - BRD MASTER V6.0)',
          font: FONT_FAMILY,
          size: 24,
          bold: true,
          color: 'D97706',
        }),
      ],
    }),
    createCallout(
      'THÔNG TIN DỰ ÁN & PHÊ DUYỆT NGHIỆP VỤ',
      'Hệ Sinh Thái Quản Trị Doanh Nghiệp Hợp Nhất ViOne & Nền Tảng Hiệp Hội CLB Doanh Nhân CEO 1983.\nPhiên bản 6.0 Master Release — Đồng bộ 100% mã nguồn thực tế, chuẩn hóa ma trận phân quyền RBAC và 6 năng lực AI.'
    ),
    new Paragraph({
      spacing: { before: 400, after: 200 },
      pageBreakBefore: true,
    })
  );

  let inTable = false;
  let tableHeaders = [];
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Check Table Row
    if (rawLine.startsWith('|') && rawLine.endsWith('|')) {
      const parts = rawLine
        .split('|')
        .slice(1, -1)
        .map((p) => p.trim());
      if (parts.every((p) => p.replace(/[:-]/g, '').length === 0)) {
        // Divider row
        continue;
      }
      if (!inTable) {
        inTable = true;
        tableHeaders = parts;
        tableRows = [];
      } else {
        tableRows.push(parts);
      }
      continue;
    } else if (inTable) {
      // Flush Table
      docChildren.push(createTable(tableHeaders, tableRows));
      docChildren.push(new Paragraph({ spacing: { before: 80, after: 80 } }));
      inTable = false;
      tableHeaders = [];
      tableRows = [];
    }

    if (rawLine.startsWith('# ')) {
      docChildren.push(createHeading1(rawLine.replace(/^#\s+/, '')));
    } else if (rawLine.startsWith('## ')) {
      docChildren.push(createHeading1(rawLine.replace(/^##\s+/, '')));
    } else if (rawLine.startsWith('### ')) {
      docChildren.push(createHeading2(rawLine.replace(/^###\s+/, '')));
    } else if (rawLine.startsWith('#### ')) {
      docChildren.push(createHeading3(rawLine.replace(/^####\s+/, '')));
    } else if (rawLine.startsWith('* ') || rawLine.startsWith('- ')) {
      const bulletText = rawLine.replace(/^[*+-]\s+/, '');
      docChildren.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
              text: bulletText.replace(/\*\*(.*?)\*\*/g, '$1'),
              font: FONT_FAMILY,
              size: 22,
              color: '1E293B',
            }),
          ],
        })
      );
    } else {
      docChildren.push(createPara(rawLine.replace(/\*\*(.*?)\*\*/g, '$1'), { size: 22 }));
    }
  }

  if (inTable) {
    docChildren.push(createTable(tableHeaders, tableRows));
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1200, bottom: 1200, left: 1400, right: 1400 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'TÀI LIỆU YÊU CẦU NGHIỆP VỤ BRD MASTER · VIONE & CEO 1983',
                    font: FONT_FAMILY,
                    size: 18,
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
                alignment: AlignmentType.RIGHT,
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
                    color: '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        },
        children: docChildren,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(DOCS_DIR, 'BRD_VIONE_YEU_CAU_NGHIEP_VU_TOAN_DIEN.docx');
  fs.writeFileSync(outPath, buffer);
  console.log(`✓ Saved BRD docx to: ${outPath} (${buffer.length} bytes)`);
}

// -------------------------------------------------------------
// 2. BUILD SRS WORD DOCUMENT (.DOCX)
// -------------------------------------------------------------
async function buildSrsDocx() {
  console.log('Generating SRS Word Document...');
  const mdPath = path.join(DOCS_DIR, 'SRS_HE_THONG_VA_APP_VIONE_TOAN_DIEN.md');
  const mdContent = fs.readFileSync(mdPath, 'utf8');

  const lines = mdContent.split('\n');
  const docChildren = [];

  // Cover Page Block
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 800, after: 200 },
      children: [
        new TextRun({
          text: 'TẬP ĐOÀN CÔNG NGHỆ VIOCONNECT',
          font: FONT_FAMILY,
          size: 28,
          bold: true,
          color: NAVY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 600 },
      children: [
        new TextRun({
          text: 'BAN KIẾN TRÚC HỆ THỐNG & SENIOR BA TEAM',
          font: FONT_FAMILY,
          size: 20,
          bold: true,
          color: '475569',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: 'ĐẶC TẢ YÊU CẦU PHẦN MỀM CHUẨN QUỐC TẾ',
          font: FONT_FAMILY,
          size: 38,
          bold: true,
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 400 },
      children: [
        new TextRun({
          text: '(SOFTWARE REQUIREMENTS SPECIFICATION - IEEE 830-1998 MASTER V6.0)',
          font: FONT_FAMILY,
          size: 22,
          bold: true,
          color: 'D97706',
        }),
      ],
    }),
    createCallout(
      'TIÊU CHUẨN ĐẶC TẢ KỸ THUẬT & PHẠM VI NGHIỆM THU',
      'Đặc tả kỹ thuật toàn bộ 14 Phân hệ chức năng theo nguyên tắc MECE.\nBao quát 100% Web CRM, App Di Động Native ViOne Connect, App Hiệp Hội CEO 1983 và Tầng API NestJS Backend.'
    ),
    new Paragraph({
      spacing: { before: 400, after: 200 },
      pageBreakBefore: true,
    })
  );

  let inTable = false;
  let tableHeaders = [];
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Check Table Row
    if (rawLine.startsWith('|') && rawLine.endsWith('|')) {
      const parts = rawLine
        .split('|')
        .slice(1, -1)
        .map((p) => p.trim());
      if (parts.every((p) => p.replace(/[:-]/g, '').length === 0)) {
        continue;
      }
      if (!inTable) {
        inTable = true;
        tableHeaders = parts;
        tableRows = [];
      } else {
        tableRows.push(parts);
      }
      continue;
    } else if (inTable) {
      docChildren.push(createTable(tableHeaders, tableRows));
      docChildren.push(new Paragraph({ spacing: { before: 80, after: 80 } }));
      inTable = false;
      tableHeaders = [];
      tableRows = [];
    }

    if (rawLine.startsWith('# ')) {
      docChildren.push(createHeading1(rawLine.replace(/^#\s+/, '')));
    } else if (rawLine.startsWith('## ')) {
      docChildren.push(createHeading1(rawLine.replace(/^##\s+/, '')));
    } else if (rawLine.startsWith('### ')) {
      docChildren.push(createHeading2(rawLine.replace(/^###\s+/, '')));
    } else if (rawLine.startsWith('#### ')) {
      docChildren.push(createHeading3(rawLine.replace(/^####\s+/, '')));
    } else if (rawLine.startsWith('* ') || rawLine.startsWith('- ')) {
      const bulletText = rawLine.replace(/^[*+-]\s+/, '');
      docChildren.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
              text: bulletText.replace(/\*\*(.*?)\*\*/g, '$1'),
              font: FONT_FAMILY,
              size: 22,
              color: '1E293B',
            }),
          ],
        })
      );
    } else {
      docChildren.push(createPara(rawLine.replace(/\*\*(.*?)\*\*/g, '$1'), { size: 22 }));
    }
  }

  if (inTable) {
    docChildren.push(createTable(tableHeaders, tableRows));
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1200, bottom: 1200, left: 1400, right: 1400 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'ĐẶC TẢ YÊU CẦU PHẦN MỀM SRS IEEE 830 · VIONE ECOSYSTEM',
                    font: FONT_FAMILY,
                    size: 18,
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
                alignment: AlignmentType.RIGHT,
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
                    color: '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        },
        children: docChildren,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(DOCS_DIR, 'SRS_HE_THONG_VA_APP_VIONE_TOAN_DIEN.docx');
  fs.writeFileSync(outPath, buffer);
  console.log(`✓ Saved SRS docx to: ${outPath} (${buffer.length} bytes)`);
}

// -------------------------------------------------------------
// 3. BUILD COMPREHENSIVE USER GUIDE (HDSD HTML & DOCX)
// -------------------------------------------------------------
async function buildUserGuide() {
  console.log('Generating Comprehensive User Guide (HTML & DOCX)...');

  // Complete Catalog of 51 Real Screenshots Mapped to Chapters
  const chapters = [
    // PART 1: CRM VIONE
    {
      part: 'PHẦN 1: QUẢN TRỊ TRUY CẬP & TỔNG QUAN ĐIỀU HÀNH C-LEVEL',
      title: 'Đăng Nhập Cổng Quản Trị ViOne CRM & Bảo Mật Hệ Thống',
      purpose: 'Truy cập vào hệ thống điều hành doanh nghiệp tập trung với cơ chế bảo mật cao cấp.',
      role: 'Tất cả nhân sự & Lãnh đạo C-Level',
      touchpoint: 'https://14.225.217.232:5445/auth (Port 5000 / 5445)',
      steps: [
        'Mở trình duyệt Web (Google Chrome / Edge / Safari), truy cập địa chỉ Cổng quản trị ViOne CRM.',
        'Nhập Email hoặc Tên đăng nhập được cấp (Ví dụ: admin@connect.vn).',
        'Nhập Mật khẩu bảo mật, chọn Giao diện Sáng hoặc Tối theo sở thích cá nhân.',
        'Nhấn nút [ĐĂNG NHẬP] để vào màn hình điều hành chính.'
      ],
      warning: 'Nhập sai mật khẩu quá 5 lần tài khoản sẽ tạm khóa 15 phút để bảo đảm an toàn dữ liệu.',
      imgFile: 'crm_vione_01_login.png',
      caption: 'Giao diện Đăng nhập Quản trị Doanh nghiệp ViOne CRM chuyên biệt',
      isMobile: false
    },
    {
      part: 'PHẦN 1: QUẢN TRỊ TRUY CẬP & TỔNG QUAN ĐIỀU HÀNH C-LEVEL',
      title: 'Bảng Điều Hành Số Tổng Quan C-Level (Executive Dashboard)',
      purpose: 'Theo dõi trực quan sức khỏe dòng tiền, khối lượng công việc, tỷ lệ hoàn thành dự án và danh mục sản phẩm.',
      role: 'Lãnh đạo C-Level (CEO, COO, CFO), Quản trị viên',
      touchpoint: 'Menu điều hướng bên trái -> Bảng điều khiển (/dashboard)',
      steps: [
        'Quan sát 4 thẻ chỉ số tài chính đầu ngày: Dòng tiền thực tế, Doanh thu tháng, Đề nghị chi chờ duyệt và Tỷ lệ tăng trưởng.',
        'Theo dõi panel "Danh Mục Theo Sản Phẩm & Dịch Vụ Doanh Nghiệp" hiển thị tiến độ 6 ngành hàng chủ lực.',
        'Kiểm tra biểu đồ xu hướng dòng tiền 90 ngày và danh sách 5 việc khẩn cấp cần phê duyệt ngay.'
      ],
      warning: 'Dữ liệu chỉ số tự động cập nhật thời gian thực sau mỗi giao dịch phát sinh qua cổng thanh toán.',
      imgFile: 'crm_vione_02_dashboard.png',
      caption: 'Bảng Điều Hành Số C-Level với đầy đủ chỉ số tài chính và danh mục sản phẩm',
      isMobile: false
    },
    {
      part: 'PHẦN 2: QUẢN TRỊ DOANH NGHIỆP & TÀI KHOẢN 360°',
      title: 'Quản Trị Doanh Nghiệp Đa Công Ty (Multi-Tenant)',
      purpose: 'Thiết lập danh mục công ty thành viên, phân vùng dữ liệu cô lập tuyệt đối trong cùng một hệ sinh thái.',
      role: 'Tổng Giám Đốc (CEO), Quản trị viên hệ thống (Admin)',
      touchpoint: 'Menu Hệ thống -> Quản lý Công ty (/companies)',
      steps: [
        'Truy cập danh sách công ty thành viên, xem thông tin người đại diện, MST và quy mô nhân sự.',
        'Nhấn nút [+ Thêm Công Ty] để khởi tạo pháp nhân mới, tải lên Logo và giấy phép ĐKKD.',
        'Cấu hình phân vùng lưu trữ MinIO S3 và gán quản trị viên điều hành chi nhánh.'
      ],
      warning: 'Mã số thuế của công ty là duy nhất; hệ thống tự động ngăn chặn tạo trùng lặp pháp nhân.',
      imgFile: 'crm_vione_04_companies.png',
      caption: 'Quản trị Đa công ty Multi-Tenant với cơ chế cô lập dữ liệu an toàn',
      isMobile: false
    },
    {
      part: 'PHẦN 2: QUẢN TRỊ DOANH NGHIỆP & TÀI KHOẢN 360°',
      title: 'Quản Trị Danh Bạ Tài Khoản & Hồ Sơ 360°',
      purpose: 'Tra cứu, lọc đa tiêu chí và thẩm định phê duyệt tài khoản doanh nghiệp mới gia nhập.',
      role: 'CEO, Sales Manager, Quản trị viên (Admin)',
      touchpoint: 'Menu CRM -> Danh bạ Tài khoản (/members)',
      steps: [
        'Sử dụng thanh tìm kiếm đa năng để tra cứu theo tên doanh nghiệp, số điện thoại hoặc mã số thuế.',
        'Nhấp chuột vào một dòng để mở Drawer Hồ Sơ 360° hiển thị toàn bộ lịch sử tương tác và hợp đồng.',
        'Đối với hồ sơ mới đăng ký, bấm nút [Phê Duyệt] để cấp quyền truy cập và gửi thông báo chào mừng.'
      ],
      warning: 'Thao tác xuất danh bạ ra file Excel được giới hạn tối đa 500 dòng/lần và ghi nhật ký IP vào Audit Trail.',
      imgFile: 'crm_vione_03_members.png',
      caption: 'Quản lý Danh bạ Tài khoản Doanh nghiệp kèm thanh trượt Drawer Hồ sơ 360°',
      isMobile: false
    },
    {
      part: 'PHẦN 3: SÀN THƯƠNG MẠI & BÁO GIÁ ĐIỆN TỬ B2B',
      title: 'Sàn Cơ Hội Kinh Doanh & Đấu Thầu Dự Án B2B',
      purpose: 'Đăng tải các gói thầu mua sắm, tìm kiếm đối tác cung ứng và nộp hồ sơ năng lực chào thầu.',
      role: 'Giám Đốc Kinh Doanh, Bộ phận Mua sắm & Đấu thầu',
      touchpoint: 'Menu Kinh doanh -> Cơ hội giao thương (/opportunities)',
      steps: [
        'Duyệt danh sách các gói thầu mở (Ngân sách từ vài trăm triệu đến hàng chục tỷ đồng).',
        'Bấm vào gói thầu để xem yêu cầu kỹ thuật, tiến độ giao hàng và tiêu chuẩn đối tác.',
        'Nhấn nút [Nộp Hồ Sơ Chào Thầu], đính kèm báo giá và năng lực doanh nghiệp.'
      ],
      warning: 'Danh sách hồ sơ chào thầu được bảo mật tuyệt đối cho đến đúng thời điểm mở thầu.',
      imgFile: 'crm_vione_05_opportunities.png',
      caption: 'Sàn Cơ Hội Kinh Doanh B2B và quản lý hồ sơ chào thầu minh bạch',
      isMobile: false
    },
    {
      part: 'PHẦN 3: SÀN THƯƠNG MẠI & BÁO GIÁ ĐIỆN TỬ B2B',
      title: 'Sàn Trưng Bày Sản Phẩm & Workspace Báo Giá Quotes',
      purpose: 'Niêm yết hàng hóa, dịch vụ theo 6 ngành hàng chủ lực và xuất bản báo giá PDF chuyên nghiệp trong 2 phút.',
      role: 'Sales Manager, Chuyên viên kinh doanh',
      touchpoint: 'Menu Sản phẩm -> Gian hàng Showcase (/marketplace & /products)',
      steps: [
        'Phân loại sản phẩm theo 6 ngành hàng: Công nghệ, Chuỗi cung ứng, Đầu tư, BĐS, Nông sản, Y tế/Giáo dục.',
        'Mở Workspace Báo giá, chọn sản phẩm, áp dụng chính sách chiết khấu hợp lệ theo phân quyền.',
        'Bấm nút [Xuất Báo Giá PDF] có chữ ký số điện tử để gửi email tự động cho khách hàng.'
      ],
      warning: 'Nhân viên kinh doanh chiết khấu tối đa 5%; mức 6-15% do Trưởng phòng duyệt; trên 15% do CEO duyệt.',
      imgFile: 'crm_vione_06_marketplace.png',
      caption: 'Sàn Showcase Sản Phẩm B2B theo 6 ngành hàng và Workspace Báo giá',
      isMobile: false
    },
    {
      part: 'PHẦN 4: SỰ KIỆN DOANH NGHIỆP & SƠ ĐỒ KHÁN PHÒNG',
      title: 'Quản Lý Lịch Sự Kiện Doanh Nghiệp & Sơ Đồ Ghế Ngồi',
      purpose: 'Tổ chức hội thảo xúc tiến đầu tư, thiết lập sơ đồ ghế ngồi trực quan và quản lý đăng ký vé.',
      role: 'Ban Tổ Chức Sự Kiện, Ban Lễ Tân',
      touchpoint: 'Menu Sự kiện -> Lịch sự kiện (/events)',
      steps: [
        'Xem lịch sự kiện doanh nghiệp theo dạng lưới hoặc lịch biểu (Calendar view).',
        'Thiết lập sơ đồ chỗ ngồi khán phòng (VIP Kim Cương, Đại biểu Vàng, Tiêu chuẩn).',
        'Cấp phát vé điện tử QR Code động cho khách mời qua email hoặc ứng dụng di động.'
      ],
      warning: 'Vé QR Code động tự động xoay mã bảo mật sau mỗi 30 giây để chống chụp ảnh màn hình bán lại vé.',
      imgFile: 'crm_vione_07_events.png',
      caption: 'Quản trị Lịch Sự Kiện Doanh Nghiệp và Thiết lập sơ đồ khán phòng',
      isMobile: false
    },
    {
      part: 'PHẦN 5: QUY TRÌNH CÔNG VIỆC & QUẢN TRỊ NHÂN SỰ',
      title: 'Quản Trị Quy Trình Công Việc Trên Bảng Kanban Kéo Thả',
      purpose: 'Giao việc minh bạch, quản lý tiến độ thời gian thực và loại bỏ hoàn toàn tình trạng trôi việc.',
      role: 'Giám Đốc Vận Hành (COO), Quản lý dự án, Nhân viên thực hiện',
      touchpoint: 'Menu Vận hành -> Quy trình công việc (/workflow)',
      steps: [
        'Tạo thẻ việc mới: Gán người phụ trách chính, đặt hạn chót (Deadline) và nhập danh sách checklist.',
        'Kéo thả thẻ việc qua các cột trạng thái: [Chờ xử lý] -> [Đang làm] -> [Kiểm tra chất lượng] -> [Hoàn thành].',
        'Khi hoàn thành 100% checklist, người quản lý bấm [Nghiệm Thu] để đóng công việc.'
      ],
      warning: 'Mỗi nhân sự không nên có quá 5 công việc ở trạng thái "Đang làm" cùng lúc để đảm bảo chất lượng.',
      imgFile: 'crm_vione_08_workflow.png',
      caption: 'Bảng Kanban Quản trị Quy trình Công việc trực quan với checklist kiểm tra',
      isMobile: false
    },
    {
      part: 'PHẦN 5: QUY TRÌNH CÔNG VIỆC & QUẢN TRỊ NHÂN SỰ',
      title: 'Giám Sát Phân Bổ Khối Lượng Tải Nhân Sự (Workload Heatmap)',
      purpose: 'Cân bằng tải công việc trong đội ngũ, phát hiện sớm nguy cơ quá tải hoặc phân bổ không đồng đều.',
      role: 'CEO, Giám Đốc Vận Hành (COO)',
      touchpoint: 'Menu Vận hành -> Tải nhân sự (/workload)',
      steps: [
        'Quan sát biểu đồ nhiệt (Heatmap) thể hiện tổng số giờ làm việc được giao của từng nhân sự trong tuần.',
        'Cột màu xanh: Tải bình thường (≤ 40h/tuần); Cột màu vàng: Bận rộn (41-45h/tuần); Cột màu đỏ: Quá tải (> 45h/tuần).',
        'Thực hiện kéo thả chuyển giao bớt nhiệm vụ từ nhân sự quá tải sang nhân sự có tải thấp.'
      ],
      warning: 'Hệ thống tự động gửi cảnh báo cho Trưởng bộ phận khi một nhân sự bị quá tải liên tục 2 tuần.',
      imgFile: 'crm_vione_09_workload.png',
      caption: 'Bản đồ nhiệt Giám sát Khối lượng Tải Nhân sự Workload Heatmap',
      isMobile: false
    },
    {
      part: 'PHẦN 5: QUY TRÌNH CÔNG VIỆC & QUẢN TRỊ NHÂN SỰ',
      title: 'Bảng Công Chấm Công Tự Động Định Vị GPS & AI FaceID',
      purpose: 'Tổng hợp công phép tự động, triệt tiêu gian lận chấm công và phát hành phiếu lương bảo mật.',
      role: 'Trưởng Phòng Nhân Sự (HR), Kế toán tiền lương',
      touchpoint: 'Menu Vận hành -> Bảng chấm công (/attendance)',
      steps: [
        'Cấu hình tọa độ văn phòng và bán kính cho phép chấm công (mặc định ≤ 50 mét).',
        'Xem bảng công tổng hợp thời gian thực: Giờ vào, Giờ ra, Số phút đi muộn, Về sớm, Tọa độ GPS và Ảnh AI FaceID.',
        'Đúng 23:59 ngày mùng 2 hàng tháng, hệ thống tự động khóa sổ bảng công để xuất phiếu lương E-Payslip.'
      ],
      warning: 'Thuật toán AI FaceID bắt buộc vượt qua kiểm tra người thật (Liveness ≥ 92%) chống dùng ảnh giả mạo.',
      imgFile: 'crm_vione_10_attendance.png',
      caption: 'Bảng Tổng Hợp Chấm Công Định Vị GPS Văn Phòng & AI FaceID',
      isMobile: false
    },
    {
      part: 'PHẦN 6: PHÊ DUYỆT CHI TIỀN & QUẢN TRỊ TÀI CHÍNH',
      title: 'Quy Trình Phê Duyệt Chi Tiền 3 Cấp & Chống Chi Trùng Hóa Đơn',
      purpose: 'Kiểm soát chặt chẽ ngân sách, quét tự động chống chi trùng hóa đơn và giải ngân qua mã QR ngân hàng.',
      role: 'Người lập (Maker) -> Kế toán kiểm tra (Checker) -> Lãnh đạo duyệt (Approver)',
      touchpoint: 'Menu Tài chính -> Phê duyệt chi (/payment-approvals)',
      steps: [
        'Nhân viên lập đề xuất chi: Nhập số tiền, nội dung và tải lên ảnh hóa đơn GTGT.',
        'Hệ thống tự động quét số hóa đơn và MST đối chiếu với lịch sử chi 5 năm qua để chặn chi trùng.',
        'Kế toán kiểm tra chứng từ hợp lệ, chuyển tiếp lên Lãnh đạo phê duyệt.',
        'Lãnh đạo bấm [Phê Duyệt] trên điện thoại, hệ thống sinh mã VietQR Napas 24/7 thanh toán tự động gạch nợ trong 1 giây.'
      ],
      warning: 'Khoản chi làm vượt quá 100% hạn mức ngân sách tháng của phòng ban sẽ bị hệ thống từ chối tạo tờ trình.',
      imgFile: 'crm_vione_11_payment_approvals.png',
      caption: 'Quy trình Phê duyệt chi tiền 3 cấp tích hợp Chống chi trùng số hóa đơn',
      isMobile: false
    },
    {
      part: 'PHẦN 6: PHÊ DUYỆT CHI TIỀN & QUẢN TRỊ TÀI CHÍNH',
      title: 'Quản Lý Sổ Quỹ Thu & Doanh Thu Tự Động Gạch Nợ',
      purpose: 'Theo dõi chi tiết các dòng tiền thực thu từ khách hàng và đối tác qua tài khoản ngân hàng.',
      role: 'CFO, Kế toán trưởng, Thủ quỹ',
      touchpoint: 'Menu Tài chính -> Sổ quỹ Thu (/income)',
      steps: [
        'Xem danh sách các giao dịch thanh toán thành công qua cổng VietQR Napas 24/7.',
        'Kiểm tra mã giao dịch ngân hàng, tên người chuyển, số tiền và hóa đơn liên kết.',
        'Hệ thống tự động gạch nợ công nợ khách hàng ngay khi nhận được tín hiệu Webhook từ ngân hàng.'
      ],
      warning: 'Mọi dòng tiền thu vào đều được lưu trữ bất biến và đối soát khớp 100% với sao kê ngân hàng.',
      imgFile: 'crm_vione_12_finance_income.png',
      caption: 'Quản lý Sổ Quỹ Thu với cơ chế tự động gạch nợ thời gian thực',
      isMobile: false
    },
    {
      part: 'PHẦN 6: PHÊ DUYỆT CHI TIỀN & QUẢN TRỊ TÀI CHÍNH',
      title: 'Quản Lý Sổ Quỹ Chi & Thanh Toán Chuyển Khoản QR',
      purpose: 'Giám sát chi tiết các khoản thực chi của doanh nghiệp theo từng danh mục và phòng ban.',
      role: 'CFO, Kế toán trưởng, Thủ quỹ',
      touchpoint: 'Menu Tài chính -> Sổ quỹ Chi (/expenses)',
      steps: [
        'Rà soát các khoản chi đã được phê duyệt và giải ngân.',
        'Xem chứng từ ủy nhiệm chi điện tử và hóa đơn đính kèm của từng khoản thanh toán.',
        'Lọc chi phí theo phòng ban, theo dự án hoặc theo mã nhà cung cấp.'
      ],
      warning: 'Khoản chi trên 20 triệu VNĐ bắt buộc phải có chữ ký số điện tử của Tổng Giám Đốc.',
      imgFile: 'crm_vione_13_finance_expenses.png',
      caption: 'Quản lý Sổ Quỹ Chi và giải ngân chuyển khoản QR ngân hàng',
      isMobile: false
    },
    {
      part: 'PHẦN 6: PHÊ DUYỆT CHI TIỀN & QUẢN TRỊ TÀI CHÍNH',
      title: 'Báo Cáo Tài Chính, Dự Phóng Dòng Tiền & Tỷ Suất Sản Phẩm',
      purpose: 'Cung cấp bức tranh toàn cảnh về tài chính, dự báo dòng tiền 90 ngày và phân tích tỷ suất sinh lời của 6 ngành hàng.',
      role: 'CEO, Giám Đốc Tài Chính (CFO)',
      touchpoint: 'Menu Tài chính -> Báo cáo tài chính (/finance-report)',
      steps: [
        'Xem biểu đồ doanh thu, chi phí và lợi nhuận ròng lũy kế theo tháng.',
        'Phân tích biểu đồ dự báo dòng tiền 30-90 ngày tới để chủ động kế hoạch vốn kinh doanh.',
        'Kiểm tra bảng xếp hạng tỷ suất sinh lời và giá trị giao dịch của 6 ngành hàng sản phẩm.'
      ],
      warning: 'Dự báo dòng tiền dựa trên thuật toán học máy phân tích dữ liệu lịch sử thanh toán của khách hàng.',
      imgFile: 'crm_vione_14_finance_report.png',
      caption: 'Báo Cáo Tài Chính Tổng Hợp, Dự Phóng Dòng Tiền và Danh Mục Sản Phẩm',
      isMobile: false
    },
    {
      part: 'PHẦN 7: TRÍ TUỆ NHÂN TẠO AI & PHÂN QUYỀN RBAC',
      title: 'Trợ Lý Điều Hành Chiến Lược AI Copilot C-Level',
      purpose: 'Đàm thoại bằng giọng nói hoặc văn bản tiếng Việt để chỉ đạo tác nghiệp và phân tích số liệu kinh doanh.',
      role: 'CEO, COO, CFO, Quản trị viên',
      touchpoint: 'Menu Nền tảng -> AI Copilot (/ai-copilot)',
      steps: [
        'Mở khung đàm thoại AI Copilot, gõ câu hỏi hoặc ra lệnh bằng giọng nói (Ví dụ: "Tóm tắt các dự án có nguy cơ trễ hạn tuần này").',
        'AI quét dữ liệu thời gian thực và trả về câu trả lời phân tích kèm trích dẫn số liệu cụ thể.',
        'Yêu cầu AI soạn thảo nhanh văn bản chỉ đạo điều hành hoặc email thông báo gửi cho toàn công ty.'
      ],
      warning: 'AI Copilot được huấn luyện trên cơ sở tri thức nội bộ bảo mật của riêng doanh nghiệp.',
      imgFile: 'crm_vione_15_ai_copilot.png',
      caption: 'Trợ Lý Trí Tuệ Nhân Tạo AI Copilot Đàm Thoại Điều Hành C-Level',
      isMobile: false
    },
    {
      part: 'PHẦN 7: TRÍ TUỆ NHÂN TẠO AI & PHÂN QUYỀN RBAC',
      title: 'Nhật Ký Kiểm Toán Năng Lực AI (AI Audit Log)',
      purpose: 'Minh bạch hóa và lưu vết toàn bộ tác vụ kích hoạt của 6 năng lực AI trong hệ thống.',
      role: 'CEO, Quản trị viên hệ thống (Admin)',
      touchpoint: 'Menu Quản trị Nền tảng -> Nhật ký AI Audit (/platform/ai-audit)',
      steps: [
        'Xem bảng nhật ký kiểm toán phân loại chuẩn 6 năng lực AI: (1) Copilot C-Level, (2) Quét danh thiếp OCR, (3) Tự động hóa Excel, (4) Soạn thảo hợp đồng, (5) Gợi ý đối tác, (6) Cảnh báo tải nhân sự.',
        'Lọc nhật ký theo ngày thực hiện, theo tài khoản kích hoạt và theo thời gian phản hồi API.',
        'Xem chi tiết yêu cầu đầu vào (Prompt) và kết quả xử lý của động cơ AI.'
      ],
      warning: 'Nhật ký AI Audit được ghi nhận bất biến vào cơ sở dữ liệu để phục vụ kiểm toán an toàn thông tin.',
      imgFile: 'crm_vione_16_ai_audit.png',
      caption: 'Bảng Nhật Ký Kiểm Toán 6 Tính Năng AI Thực Tế (AI Audit Log)',
      isMobile: false
    },
    {
      part: 'PHẦN 7: TRÍ TUỆ NHÂN TẠO AI & PHÂN QUYỀN RBAC',
      title: 'Cấu Hình Ma Trận Phân Quyền RBAC 7 Nhóm Quyền x 6 Thao Tác',
      purpose: 'Phân quyền chặt chẽ theo vai trò doanh nghiệp trực tiếp tại chức năng nền tảng.',
      role: 'Tổng Giám Đốc (CEO), Quản trị viên hệ thống (Admin)',
      touchpoint: 'Menu Quản trị Nền tảng -> Phân quyền RBAC (/platform/permissions)',
      steps: [
        'Quan sát Ma trận phân quyền: 7 Nhóm vai trò (CEO, COO, CFO, Sales Manager, Admin, Staff, Partner) x 6 Thao tác (Xem, Tạo, Sửa, Xóa, Duyệt, Xuất).',
        'Bật/Tắt các nút gạt quyền (Toggle Switch) cho từng phân hệ nghiệp vụ.',
        'Bấm [Lưu Cấu Hình] để phân quyền mới có hiệu lực ngay lập tức với người dùng.'
      ],
      warning: 'Trong Chức năng Nền tảng của ViOne CRM tuyệt đối độc lập và không chứa phân hệ hiệp hội.',
      imgFile: 'crm_vione_17_rbac_matrix.png',
      caption: 'Ma Trận Phân Quyền RBAC 7 Nhóm Quyền x 6 Thao Tác Tại Chức Năng Nền Tảng',
      isMobile: false
    },
    {
      part: 'PHẦN 7: TRÍ TUỆ NHÂN TẠO AI & PHÂN QUYỀN RBAC',
      title: 'Cài Đặt Tham Số Hệ Thống & Lưu Trữ Đám Mây S3',
      purpose: 'Quản trị các kết nối kỹ thuật viễn thông, máy chủ S3 MinIO, cổng thanh toán và bảo mật.',
      role: 'Quản trị viên hệ thống (Admin)',
      touchpoint: 'Menu Hệ thống -> Cài đặt (/settings)',
      steps: [
        'Cấu hình thông số máy chủ gửi thư điện tử SMTP / SendGrid API.',
        'Kiểm tra kết nối cụm lưu trữ đám mây phân tán MinIO S3.',
        'Cấu hình tham số bảo mật: Thời hạn token JWT, xác thực 2 bước và ngưỡng giới hạn tần suất truy cập Rate-limit.'
      ],
      warning: 'Mọi thay đổi cấu hình kỹ thuật hạ tầng được ghi nhận nghiêm ngặt vào nhật ký hệ thống.',
      imgFile: 'crm_vione_18_system_settings.png',
      caption: 'Giao diện Cài đặt Cấu hình Tham số Hệ thống và Lưu trữ Đám mây',
      isMobile: false
    },

    // PART 2: VIONE CONNECT MOBILE APP
    {
      part: 'PHẦN 8: ỨNG DỤNG DI ĐỘNG DOANH NHÂN VIONE CONNECT',
      title: 'Đăng Nhập Ứng Dụng Di Động ViOne Connect Dark Luxury',
      purpose: 'Đăng nhập vào ứng dụng di động doanh nhân với chuẩn nhận diện Dark Obsidian & Champagne Gold sang trọng.',
      role: 'Toàn thể lãnh đạo doanh nghiệp và đối tác',
      touchpoint: 'Màn hình khởi động App ViOne Native / PWA (/vione/login)',
      steps: [
        'Mở ứng dụng ViOne Connect trên điện thoại iPhone hoặc Android.',
        'Nhập Email/Số điện thoại và Mật khẩu; hoặc chọn Đăng nhập sinh trắc học FaceID/Vân tay.',
        'Có thể chọn Đăng nhập một chạm bằng tài khoản Google hoặc Apple ID.',
        'Bấm [ĐĂNG NHẬP] để vào màn hình điều hành di động Executive Home.'
      ],
      warning: 'Ứng dụng thuần Native 100% không dùng vỏ bọc WebView, lưu phiên làm việc an toàn trong bộ nhớ máy.',
      imgFile: 'app_vione_01_login.png',
      caption: 'Màn hình Đăng nhập App Di động ViOne Connect chuẩn Dark Obsidian & Champagne Gold',
      isMobile: true
    },
    {
      part: 'PHẦN 8: ỨNG DỤNG DI ĐỘNG DOANH NHÂN VIONE CONNECT',
      title: 'Trang Chủ Điều Hành Di Động (Executive Home) & Gợi Ý AI',
      purpose: 'Nắm bắt lịch trình trong ngày, các cuộc gặp đối tác và nhận danh sách đối tác đề xuất bởi AI.',
      role: 'Doanh nhân C-Level',
      touchpoint: 'Tab Trang Chủ trên thanh điều hướng dưới đáy ứng dụng',
      steps: [
        'Xem lời chào cá nhân hóa, ảnh bìa nửa chiều cao (Half-banner) kèm nút [Chỉnh sửa nhanh].',
        'Kiểm tra khối "Lịch Trình Hôm Nay" hiển thị các cuộc gặp 1-1 và sự kiện sắp diễn ra.',
        'Lướt khối "V · Gợi Ý Hôm Nay (AI)" với các bộ lọc phạm vi không gian và lĩnh vực chuỗi giá trị.'
      ],
      warning: 'Bấm nút đổi theme Mặt trời/Mặt trăng ở Header để chuyển nhanh giữa chế độ Sáng và Tối.',
      imgFile: 'app_vione_02_home.png',
      caption: 'Trang chủ Điều hành Di động Executive Home kèm khối Gợi ý Đối tác AI',
      isMobile: true
    },
    {
      part: 'PHẦN 8: ỨNG DỤNG DI ĐỘNG DOANH NHÂN VIONE CONNECT',
      title: 'Mạng Lưới Đối Tác, Dải Khoảnh Khắc Stories 24H & Nurture List',
      purpose: 'Duy trì kết nối mạng lưới doanh nhân, xem Stories 24h và nhận thông báo chăm sóc đối tác.',
      role: 'Doanh nhân C-Level, Hội viên',
      touchpoint: 'Tab Mạng Lưới trên thanh điều hướng ứng dụng',
      steps: [
        'Lướt dải Story tròn trên đầu trang để xem khoảnh khắc ký kết, xúc tiến đầu tư của các CEO khác.',
        'Bấm nút [+ Đăng Story] để chụp ảnh hoặc tải ảnh lên kèm hashtag ngành nghề.',
        'Kiểm tra khối "CẦN GIỮ KẾT NỐI & CHĂM SÓC" (Nurture List) cảnh báo đối tác quá 30 ngày chưa tương tác kèm 3 nút: Hẹn 1-1, Nhắn tin, Gọi điện.'
      ],
      warning: 'Stories tự động biến mất sau đúng 24 giờ kể từ thời điểm đăng tải.',
      imgFile: 'app_vione_06_network.png',
      caption: 'Màn hình Mạng Lưới Đối Tác với Dải Stories 24h và Nurture List Chăm Sóc',
      isMobile: true
    },
    {
      part: 'PHẦN 8: ỨNG DỤNG DI ĐỘNG DOANH NHÂN VIONE CONNECT',
      title: 'Bảng Tin Doanh Nhân B2B Moments & Thảo Luận C-Level',
      purpose: 'Chia sẻ các thành tựu doanh nghiệp, bài học quản trị và thảo luận hợp tác kinh doanh.',
      role: 'Toàn bộ thành viên mạng lưới ViOne',
      touchpoint: 'Tab Mạng Lưới -> Phân hệ B2B Moments',
      steps: [
        'Đọc các bài viết chia sẻ kinh nghiệm điều hành và cơ hội hợp tác từ các nhà lãnh đạo.',
        'Bấm các nút phản ứng cảm xúc nhanh C-Level: [👍 Chúc mừng], [🤝 Hợp tác], [👏 Tuyệt vời], [💡 Tiềm năng].',
        'Bấm vào bài viết để mở cây thảo luận phân cấp và trao đổi trực tiếp.'
      ],
      warning: 'Mọi bài đăng trên B2B Moments đều được kiểm duyệt tự động để bảo đảm chuẩn mực văn hóa doanh nhân.',
      imgFile: 'app_vione_07_moments.png',
      caption: 'Bảng Tin B2B Moments dành cho các nhà lãnh đạo doanh nghiệp',
      isMobile: true
    },
    {
      part: 'PHẦN 8: ỨNG DỤNG DI ĐỘNG DOANH NHÂN VIONE CONNECT',
      title: 'Hộp Thư Doanh Nhân Messenger 4 Phân Luồng',
      purpose: 'Trò chuyện công việc, đàm phán hợp đồng 1-1 và theo dõi thông báo theo phân luồng rõ ràng.',
      role: 'Toàn thể người dùng',
      touchpoint: 'Biểu tượng Tin nhắn trên Header ứng dụng',
      steps: [
        'Chọn tab phân luồng tương ứng: [Tất cả], [Khách hàng B2B], [Nội bộ công ty], [Hệ thống thông báo].',
        'Chạm vào một cuộc trò chuyện để bắt đầu nhắn tin thời gian thực qua WebSocket.',
        'Gửi tệp tài liệu PDF, báo giá hoặc ảnh chụp hợp đồng với cơ chế mã hóa dữ liệu.'
      ],
      warning: 'Số tin nhắn chưa đọc hiển thị bằng huy hiệu màu đỏ mạ vàng nổi bật trên icon tin nhắn.',
      imgFile: 'app_vione_09_messages_inbox.png',
      caption: 'Hộp Thư Doanh Nhân Messenger với 4 phân luồng quản lý thông minh',
      isMobile: true
    },
    {
      part: 'PHẦN 8: ỨNG DỤNG DI ĐỘNG DOANH NHÂN VIONE CONNECT',
      title: 'Liên Minh & Cơ Hội Kinh Doanh Trong Cộng Đồng',
      purpose: 'Tham gia các liên minh ngành nghề, kết nối hợp tác và đón nhận các gói cơ hội thầu B2B.',
      role: 'Doanh nhân, Trưởng bộ phận phát triển kinh doanh',
      touchpoint: 'Tab Cộng Đồng trên thanh điều hướng ứng dụng',
      steps: [
        'Duyệt danh sách các cộng đồng doanh nghiệp đã tham gia hoặc khám phá liên minh mới.',
        'Nhấn nút [+ Tạo Nhóm] mạ vàng trên Header để khởi tạo liên minh kinh doanh mới.',
        'Lướt khối "CƠ HỘI KINH DOANH TRONG CỘNG ĐỒNG" và bấm [Quan Tâm] để nộp hồ sơ hợp tác.'
      ],
      warning: 'Các nhóm liên minh do Ban Điều Hành kiểm duyệt tư cách thành viên để đảm bảo chất lượng giao thương.',
      imgFile: 'app_vione_11_community.png',
      caption: 'Màn hình Cộng Đồng Liên Minh Doanh Nghiệp & Sàn Cơ Hội Nội Khối',
      isMobile: true
    },
    {
      part: 'PHẦN 8: ỨNG DỤNG DI ĐỘNG DOANH NHÂN VIONE CONNECT',
      title: 'Thẻ Danh Thiếp Số 3D Titanium Mạ Vàng & Chip NFC',
      purpose: 'Khẳng định vị thế cá nhân doanh nhân với danh thiếp số 3D xoay lật 2 mặt tích hợp chip NFC vật lý.',
      role: 'Doanh nhân C-Level sở hữu thẻ',
      touchpoint: 'Tab Hồ Sơ -> Danh thiếp của tôi (/connect-app/profile)',
      steps: [
        'Xem thẻ danh thiếp 3D xoay lật 2 mặt với hiệu ứng ánh kim Titanium mạ vàng Champagne sang trọng.',
        'Sử dụng thanh công cụ 5 nút thao tác chuẩn: Mã QR, Chụp danh thiếp, Chia sẻ, Sao chép link, Lưu danh bạ.',
        'Chạm nhẹ thẻ vào điện thoại đối tác để mở ngay hồ sơ cá nhân và nút Lưu Danh Bạ (.vcf) 1-chạm.'
      ],
      warning: 'Khi báo mất thẻ vật lý trên ứng dụng, chip NFC tương ứng sẽ bị khóa ngay lập tức trong 1 giây.',
      imgFile: 'app_vione_12_digital_card_3d.png',
      caption: 'Thẻ Danh Thiếp Số 3D Titanium Mạ Vàng tích hợp chip kết nối NFC 1-chạm',
      isMobile: true
    },
    {
      part: 'PHẦN 8: ỨNG DỤNG DI ĐỘNG DOANH NHÂN VIONE CONNECT',
      title: 'Máy Quét Danh Thiếp Giấy Bằng Trí Tuệ Nhân Tạo OCR AI',
      purpose: 'Chụp ảnh danh thiếp giấy tại hội thảo, tự động đọc và trích xuất lưu vào danh bạ số tức thì.',
      role: 'Doanh nhân, Nhân viên kinh doanh',
      touchpoint: 'Nút tròn V ở giữa -> Chọn [Quét Danh Thiếp] (CardScanReviewModal)',
      steps: [
        'Đưa camera điện thoại hướng vào danh thiếp giấy của đối tác trong khung ngắm.',
        'Bấm nút chụp, động cơ OCR AI tự động bóc tách 7 trường: Họ tên, Chức vụ, Công ty, SĐT, Email, Địa chỉ, Website.',
        'Kiểm tra lại thông tin trên màn hình xem trước và nhấn [LƯU VÀO DANH BẠ].'
      ],
      warning: 'Thông tin quét được bảo toàn 100% trong bộ nhớ máy (Local Storage) kể cả khi mất sóng internet.',
      imgFile: 'app_vione_13_card_scan_ocr.png',
      caption: 'Máy Quét Danh Thiếp Giấy Bằng Trí Tuệ Nhân Tạo OCR AI',
      isMobile: true
    },
    {
      part: 'PHẦN 8: ỨNG DỤNG DI ĐỘNG DOANH NHÂN VIONE CONNECT',
      title: 'Đặt Lịch Hẹn Kinh Doanh 1-1 Online & Offline',
      purpose: 'Lên lịch hẹn gặp đối tác chuyên nghiệp, đồng bộ lịch trình và cài đặt báo thức nhắc nhở nhiều cấp độ.',
      role: 'Doanh nhân C-Level',
      touchpoint: 'Nút [Hẹn 1-1] trên hồ sơ đối tác hoặc màn hình Trang chủ',
      steps: [
        'Chọn ngày hẹn và khung giờ gặp (09:00 - 17:00).',
        'Chọn hình thức: [Offline Lounge VIP] (nhập địa chỉ quán café/văn phòng) hoặc [Online Google Meet].',
        'Chọn chế độ báo thức: Nhắc 1 lần, 2 lần, 3 lần hoặc Báo thức liên tục kèm chuông báo động.',
        'Bấm [GỬI LỜI MỜI HẸN] để thông báo tự động chuyển đến điện thoại đối tác.'
      ],
      warning: 'Hệ thống tự động phát hiện và cảnh báo nếu khung giờ đề xuất bị trùng với lịch hẹn đã có của đối tác.',
      imgFile: 'app_vione_14_schedule_meeting.png',
      caption: 'Giao diện Đặt Lịch Hẹn Giao Thương 1-1 kèm Báo Thức Nhắc Nhở',
      isMobile: true
    },
    {
      part: 'PHẦN 8: ỨNG DỤNG DI ĐỘNG DOANH NHÂN VIONE CONNECT',
      title: 'Cài Đặt Quyền Riêng Tư & Đóng Dấu Bản Quyền Danh Tính',
      purpose: 'Bảo vệ thông tin cá nhân của lãnh đạo doanh nghiệp, kiểm soát ai được xem số điện thoại và email.',
      role: 'Toàn thể người dùng',
      touchpoint: 'Tab Hồ Sơ -> Quản lý quyền riêng tư (IdentityPrivacyModal)',
      steps: [
        'Bật/Tắt chế độ ẩn Số điện thoại và Email với người dùng chưa kết nối.',
        'Bật/Tắt quyền nhận lời mời hẹn gặp 1-1 và gợi ý kết nối từ AI.',
        'Kích hoạt tính năng đóng dấu bản quyền Watermark bảo mật trên toàn bộ hồ sơ năng lực.',
        'Bấm [LƯU CÀI ĐẶT] để cập nhật bảo mật tức thời.'
      ],
      warning: 'Nút gạt quyền riêng tư ở chế độ sáng được thiết kế chuẩn màu Vàng Sâm Banh sang trọng.',
      imgFile: 'app_vione_15_security.png',
      caption: 'Màn hình Cài Đặt Quyền Riêng Tư & Đóng Dấu Bản Quyền Danh Tính',
      isMobile: true
    },

    // PART 3: CRM HIỆP HỘI CEO 1983
    {
      part: 'PHẦN 9: CRM QUẢN TRỊ HIỆP HỘI CLB DOANH NHÂN CEO 1983',
      title: 'Đăng Nhập Cổng CRM Quản Trị Hiệp Hội CLB CEO 1983',
      purpose: 'Truy cập cổng quản trị điều hành phong trào và đại hội của CLB Doanh Nhân CEO 1983.',
      role: 'Ban Chấp Hành, Ban Thư Ký Hiệp Hội',
      touchpoint: 'http://14.225.217.232:5443 (Port 5443 / 5002)',
      steps: [
        'Truy cập địa chỉ Cổng CRM Quản trị Hiệp hội CEO 1983.',
        'Nhập Mã thư ký / Email và Mật khẩu quản trị.',
        'Chọn ngôn ngữ và nhấn nút [ĐĂNG NHẬP] để vào hệ thống điều hành hiệp hội.'
      ],
      warning: 'Bộ nhận diện thương hiệu chuẩn của Hiệp hội là Classic Navy & Warm Amber Gold (#003B95 & #F59E0B).',
      imgFile: 'crm1983_01_login.png',
      caption: 'Giao diện Đăng nhập CRM Quản trị Hiệp hội CLB Doanh Nhân CEO 1983',
      isMobile: false
    },
    {
      part: 'PHẦN 9: CRM QUẢN TRỊ HIỆP HỘI CLB DOANH NHÂN CEO 1983',
      title: 'Bảng Điều Hành Tổng Quan Hiệp Hội CLB CEO 1983',
      purpose: 'Nắm bắt tổng số hội viên chính thức, tiến độ thu hội phí thường niên và các sự kiện đại hội.',
      role: 'Chủ tịch, Phó Chủ tịch, Tổng Thư Ký CLB',
      touchpoint: 'Menu Bảng điều khiển CRM Hiệp hội (/dashboard)',
      steps: [
        'Theo dõi tổng số hội viên đang sinh hoạt và số đơn xin gia nhập mới chờ phê duyệt.',
        'Xem tỷ lệ thu hội phí niên liễm đã hoàn thành và số hội viên sắp đến hạn đóng phí.',
        'Kiểm tra danh sách sự kiện đại hội thường niên và số lượng đại biểu đã đăng ký tham dự.'
      ],
      warning: 'Dữ liệu hội viên và sự kiện được đồng bộ thời gian thực với ứng dụng di động của hội viên.',
      imgFile: 'crm1983_02_dashboard.png',
      caption: 'Bảng Điều Hành Số Tổng Quan Hiệp Hội CLB Doanh Nhân CEO 1983',
      isMobile: false
    },
    {
      part: 'PHẦN 9: CRM QUẢN TRỊ HIỆP HỘI CLB DOANH NHÂN CEO 1983',
      title: 'Quản Lý Danh Sách & Xét Duyệt Hội Viên CLB CEO 1983',
      purpose: 'Quản lý thông tin hội viên chính thức, thẩm định đơn xin gia nhập và cấp mã hội viên duy nhất.',
      role: 'Ban Thư Ký, Ban Thẩm định tư cách hội viên',
      touchpoint: 'Menu Hội viên -> Danh sách hội viên (/members)',
      steps: [
        'Xem danh sách hội viên kèm Mã định danh duy nhất (Ví dụ: M1983-001, M1983-268).',
        'Kiểm tra thông tin doanh nghiệp, chức vụ công tác và ngày gia nhập.',
        'Bấm [Phê Duyệt] đối với đơn mới, hệ thống tự động sinh mã hội viên dập nổi trên thẻ số.'
      ],
      warning: 'Mỗi hội viên chỉ được cấp duy nhất một mã hội viên bất biến trong suốt quá trình sinh hoạt.',
      imgFile: 'crm1983_03_members.png',
      caption: 'Quản lý Danh Sách và Quy trình Xét duyệt Hội viên CLB CEO 1983',
      isMobile: false
    },
    {
      part: 'PHẦN 9: CRM QUẢN TRỊ HIỆP HỘI CLB DOANH NHÂN CEO 1983',
      title: 'Quản Trị Sự Kiện Đại Hội Thường Niên & Khán Phòng',
      purpose: 'Lên kế hoạch tổ chức Đại hội thường niên, Caravan xúc tiến thương mại và quản lý khách mời.',
      role: 'Ban Tổ Chức Sự Kiện, Ban Lễ Tân',
      touchpoint: 'Menu Sự kiện -> Quản trị sự kiện (/events)',
      steps: [
        'Khởi tạo sự kiện đại hội mới: Nhập tên chương trình, thời gian, địa điểm trung tâm hội nghị.',
        'Cấu hình danh mục vé mời (VIP Kim Cương, Đại biểu chính thức, Khách mời danh dự).',
        'Tải lên tài liệu chương trình nghị sự và phát hành vé điện tử có mã QR.'
      ],
      warning: 'Vé điện tử tự động gửi đến ứng dụng di động của toàn bộ hội viên đủ điều kiện tham dự.',
      imgFile: 'crm1983_04_events.png',
      caption: 'Quản trị Sự Kiện Đại Hội Thường Niên & Caravan Xúc Tiến Thương Mại',
      isMobile: false
    },
    {
      part: 'PHẦN 9: CRM QUẢN TRỊ HIỆP HỘI CLB DOANH NHÂN CEO 1983',
      title: 'Cổng Soát Vé QR Code Check-In Đại Hội Siêu Tốc',
      purpose: 'Điểm danh đại biểu tại cửa an ninh đại hội với tốc độ dưới 0.2 giây/người, chống ùn tắc tại sảnh.',
      role: 'Nhân viên an ninh, Lễ tân soát vé tại cổng',
      touchpoint: 'Menu Sự kiện -> Cổng soát vé (/events/checkin)',
      steps: [
        'Mở giao diện Cổng soát vé trên máy tính bảng hoặc máy quét cầm tay chuyên dụng.',
        'Đưa mã QR trên ứng dụng của đại biểu vào vùng quét camera.',
        'Màn hình hiển thị màu xanh: "HỢP LỆ - Chào mừng Đại biểu [Tên], Bàn VIP [Số]".',
        'Nếu vé đã sử dụng trước đó, màn hình báo động màu đỏ: "VÉ ĐÃ SỬ DỤNG".'
      ],
      warning: 'Hệ thống hỗ trợ cơ chế quét ngoại tuyến (Offline cache) bảo đảm soát vé trơn tru cả khi mất internet.',
      imgFile: 'crm1983_05_checkin_qr.png',
      caption: 'Cổng Soát Vé QR Code Check-In Đại Hội Tốc Độ Dưới 0.2 Giây/Người',
      isMobile: false
    },
    {
      part: 'PHẦN 9: CRM QUẢN TRỊ HIỆP HỘI CLB DOANH NHÂN CEO 1983',
      title: 'Quản Trị Đại Hội Bầu Cử & Biểu Quyết Trực Tuyến',
      purpose: 'Khởi tạo các phiên biểu quyết nghị quyết và bầu cử Ban Chấp Hành, kiểm phiếu tức thời hiển thị màn hình LED.',
      role: 'Đoàn Chủ Tịch Đại Hội, Ban Kiểm Phiếu',
      touchpoint: 'Menu Đại hội -> Biểu quyết & Bầu cử (/voting)',
      steps: [
        'Khởi tạo phiên biểu quyết mới: Nhập nội dung dự thảo hoặc danh sách ứng cử viên BCH.',
        'Bấm [MỞ CỔNG BIỂU QUYẾT] để kích hoạt quyền bỏ phiếu trên app di động của đại biểu.',
        'Theo dõi biểu đồ tỷ lệ phần trăm kiểm phiếu nhảy số thời gian thực.',
        'Bấm [KHÓA BIỂU QUYẾT] để niêm phong biên bản kết quả và xuất báo cáo đại hội.'
      ],
      warning: 'Mỗi đại biểu chính thức chỉ được bỏ phiếu đúng 1 lần duy nhất cho mỗi nội dung; phiếu bầu bất biến.',
      imgFile: 'crm1983_06_voting_election.png',
      caption: 'Quản trị Đại Hội Bầu Cử & Biểu Quyết Trực Tuyến Thời Gian Thực',
      isMobile: false
    },
    {
      part: 'PHẦN 9: CRM QUẢN TRỊ HIỆP HỘI CLB DOANH NHÂN CEO 1983',
      title: 'Quản Trị Hội Phí Niên Liễm Thường Niên & VietQR',
      purpose: 'Quản lý thu hội phí năm, gửi thông báo nhắc phí tự động và gạch nợ tức thời qua VietQR.',
      role: 'Ban Tài Chính, Ban Thư Ký Hiệp Hội',
      touchpoint: 'Menu Tài chính -> Quản lý Hội phí (/fees)',
      steps: [
        'Xem danh sách hội viên đã đóng phí, sắp đến hạn và quá hạn đóng phí.',
        'Cấu hình mức hội phí niên liễm chuẩn và số tài khoản ngân hàng thụ hưởng của CLB.',
        'Hệ thống tự động phát mã VietQR Napas cho từng hội viên và gạch nợ tự động gia hạn thẻ 365 ngày.'
      ],
      warning: 'Hội viên quá hạn đóng hội phí trên 45 ngày sẽ bị tạm dừng quyền tham gia biểu quyết đại hội.',
      imgFile: 'crm1983_08_fees_management.png',
      caption: 'Quản trị Thu Hội Phí Niên Liễm Thường Niên & Thanh Toán VietQR Tự Động',
      isMobile: false
    },
    {
      part: 'PHẦN 9: CRM QUẢN TRỊ HIỆP HỘI CLB DOANH NHÂN CEO 1983',
      title: 'Quản Lý Thu Chi Quỹ Hoạt Động & Phát Triển Hiệp Hội',
      purpose: 'Minh bạch hóa toàn bộ các nguồn thu tài trợ và chi phí tổ chức sự kiện phong trào của CLB.',
      role: 'Ban Tài Chính, Ban Kiểm Tra Hiệp Hội',
      touchpoint: 'Menu Tài chính -> Sổ quỹ Thu/Chi (/income & /expenses)',
      steps: [
        'Theo dõi các nguồn thu tài trợ từ các doanh nghiệp và phí hội viên thường niên.',
        'Kiểm tra các khoản chi phục vụ tổ chức đại hội, caravan và hoạt động thiện nguyện.',
        'Xuất báo cáo tài chính thường niên minh bạch để công khai trước toàn thể đại hội.'
      ],
      warning: 'Toàn bộ chứng từ thanh toán được lưu trữ số hóa trên đám mây tối thiểu 10 năm.',
      imgFile: 'crm1983_09_income.png',
      caption: 'Quản lý Thu Chi Quỹ Hoạt Động & Phát Triển Hiệp Hội Minh Bạch',
      isMobile: false
    },
    {
      part: 'PHẦN 9: CRM QUẢN TRỊ HIỆP HỘI CLB DOANH NHÂN CEO 1983',
      title: 'Quản Lý Nhà Tài Trợ & Gói Quyền Lợi Hiệp Hội (Sponsors)',
      purpose: 'Tôn vinh các thương hiệu tài trợ Kim Cương/Vàng và quản lý hiển thị banner trên toàn hệ sinh thái.',
      role: 'Ban Vận Động Tài Trợ, Ban Truyền Thông',
      touchpoint: 'Menu Đối tác -> Nhà tài trợ (/sponsors)',
      steps: [
        'Khởi tạo hồ sơ nhà tài trợ: Tải lên Logo, Video quảng bá và Thông điệp thương hiệu.',
        'Phân loại gói tài trợ: [Kim Cương], [Vàng], [Bạc], [Đồng].',
        'Gán vị trí xuất hiện ưu tiên tại Trang chủ ứng dụng hội viên và màn hình sân khấu đại hội.'
      ],
      warning: 'Logo nhà tài trợ Kim Cương luôn được ghim ở vị trí trung tâm trang trọng nhất trên mọi ấn phẩm số.',
      imgFile: 'crm1983_11_sponsors.png',
      caption: 'Quản lý Danh mục Nhà Tài Trợ & Gói Quyền Lợi Hiệp Hội',
      isMobile: false
    },
    {
      part: 'PHẦN 9: CRM QUẢN TRỊ HIỆP HỘI CLB DOANH NHÂN CEO 1983',
      title: 'Kho Văn Kiện, Điều Lệ & Nghị Quyết Đại Hội Số Hóa',
      purpose: 'Lưu trữ điều lệ hoạt động, nghị quyết đại hội các thời kỳ và quyết định chuẩn y của Ban Chấp Hành.',
      role: 'Ban Thư Ký, Toàn thể hội viên',
      touchpoint: 'Menu Tài liệu -> Văn kiện hiệp hội (/documents)',
      steps: [
        'Tra cứu các văn bản pháp lý, quy chế chi tiêu nội bộ và điều lệ hiệp hội.',
        'Xem trực tiếp file PDF trên trình duyệt hoặc tải về máy tính có mã hóa an toàn.',
        'Tìm kiếm nhanh văn bản theo số hiệu ban hành hoặc từ khóa tiêu đề.'
      ],
      warning: 'Các văn kiện nội bộ chỉ mở khóa cho hội viên đã hoàn thành đóng hội phí thường niên.',
      imgFile: 'crm1983_13_documents.png',
      caption: 'Kho Văn Kiện, Điều Lệ & Nghị Quyết Đại Hội Số Hóa',
      isMobile: false
    },

    // PART 4: APP MOBILE HỘI VIÊN CEO 1983
    {
      part: 'PHẦN 10: ỨNG DỤNG DI ĐỘNG HỘI VIÊN HIỆP HỘI CEO 1983',
      title: 'Đăng Nhập Ứng Dụng Di Động Hội Viên CLB CEO 1983',
      purpose: 'Truy cập cổng ứng dụng di động dành riêng cho cộng đồng doanh nhân sinh năm 1983.',
      role: 'Hội viên chính thức CLB CEO 1983',
      touchpoint: 'Màn hình khởi động App CEO 1983 (/association/login)',
      steps: [
        'Mở ứng dụng Hiệp hội CEO 1983 trên điện thoại.',
        'Nhập Mã hội viên (Ví dụ: M1983-007) hoặc Email đã đăng ký kèm Mật khẩu.',
        'Bấm [ĐĂNG NHẬP] để vào màn hình chính hội viên.'
      ],
      warning: 'Ứng dụng thuần chất cộng đồng hiệp hội, chuẩn màu Classic Navy & Warm Amber Gold sang trọng.',
      imgFile: 'app1983_01_login.png',
      caption: 'Màn hình Đăng nhập App Di động Hội viên CLB Doanh Nhân CEO 1983',
      isMobile: true
    },
    {
      part: 'PHẦN 10: ỨNG DỤNG DI ĐỘNG HỘI VIÊN HIỆP HỘI CEO 1983',
      title: 'Trang Chủ Hội Viên CLB Doanh Nhân CEO 1983',
      purpose: 'Theo dõi tin tức hoạt động hiệp hội, sự kiện sắp tới và thẻ hội viên số của bản thân.',
      role: 'Hội viên CLB CEO 1983',
      touchpoint: 'Tab Trang Chủ ứng dụng hội viên',
      steps: [
        'Xem thẻ hội viên tóm tắt trên đầu trang chủ hiển thị Họ tên và Số điện thoại liên lạc.',
        'Xem thông báo về Đại hội thường niên và các chuyến Caravan xúc tiến thương mại.',
        'Kiểm tra thống kê các cơ hội kinh doanh nội khối và sản phẩm chào bán đang mở.'
      ],
      warning: 'Chức danh quản trị viên kỹ thuật đã được thay bằng Số điện thoại để các hội viên dễ dàng gọi điện/Zalo.',
      imgFile: 'app1983_02_home.png',
      caption: 'Trang chủ Hội viên CLB Doanh Nhân CEO 1983',
      isMobile: true
    },
    {
      part: 'PHẦN 10: ỨNG DỤNG DI ĐỘNG HỘI VIÊN HIỆP HỘI CEO 1983',
      title: 'Thẻ Hội Viên VIP CEO 1983 Dập Nổi Logo Hoàng Gia',
      purpose: 'Chứng minh tư cách hội viên chính thức, sử dụng mã QR để soát vé tại cổng đại hội.',
      role: 'Hội viên CLB CEO 1983',
      touchpoint: 'Tab Thẻ Hội Viên trên ứng dụng',
      steps: [
        'Xem Thẻ hội viên số Classic Navy & Amber Gold dập nổi logo chính thức của Hiệp hội Doanh nhân CEO 1983.',
        'Kiểm tra Mã hội viên (VD: M1983-268), chức vụ công tác và ngày hết hạn hội phí.',
        'Sử dụng mã QR trên thẻ để check-in tại cửa an ninh đại hội hoặc chạm chia sẻ danh thiếp.'
      ],
      warning: 'Toàn bộ các nút chức năng bị lặp đã được tinh gọn thành duy nhất 1 thanh công cụ 5 nút thao tác chuẩn.',
      imgFile: 'app1983_03_vip_card.png',
      caption: 'Thẻ Hội Viên VIP CEO 1983 Dập Nổi Logo Hoàng Gia & Mã QR Check-In',
      isMobile: true
    },
    {
      part: 'PHẦN 10: ỨNG DỤNG DI ĐỘNG HỘI VIÊN HIỆP HỘI CEO 1983',
      title: 'Danh Bạ Kết Nối Hội Viên & Tab "Đã Gửi Kết Nối"',
      purpose: 'Tìm kiếm bạn bè hội viên trong CLB, gửi lời mời giao lưu và theo dõi trạng thái phản hồi.',
      role: 'Toàn thể hội viên',
      touchpoint: 'Tab Hội Viên trên ứng dụng',
      steps: [
        'Duyệt danh bạ các doanh nhân sinh năm 1983 theo ngành nghề hoặc tỉnh/thành phố.',
        'Bấm [Gửi Kết Nối] để mở rộng quan hệ hợp tác kinh doanh.',
        'Mở tab "Đã gửi kết nối" để theo dõi 3 trạng thái: [Đang chờ] (có nút Hủy), [Đã chấp nhận] (có nút Nhắn tin), [Đã từ chối].'
      ],
      warning: 'Tính năng cho phép hủy rút lại lời mời bất cứ lúc nào nếu bấm nhầm.',
      imgFile: 'app1983_04_members.png',
      caption: 'Danh Bạ Kết Nối Hội Viên kèm Tab "Đã Gửi Kết Nối" Mới',
      isMobile: true
    },
    {
      part: 'PHẦN 10: ỨNG DỤNG DI ĐỘNG HỘI VIÊN HIỆP HỘI CEO 1983',
      title: 'Đăng Ký & Xem Lịch Trình Sự Kiện Đại Hội Hiệp Hội',
      purpose: 'Nhận thư mời đại hội, đăng ký tham gia và xem lịch trình diễn giả chi tiết.',
      role: 'Toàn thể hội viên',
      touchpoint: 'Tab Sự Kiện trên ứng dụng',
      steps: [
        'Xem danh sách các sự kiện sắp diễn ra kèm địa điểm tổ chức trên Google Maps.',
        'Bấm [ĐĂNG KÝ THAM DỰ] để nhận vé mời điện tử VIP.',
        'Mở vé mời QR Code khi đến cổng sự kiện để nhân viên an ninh quét điểm danh.'
      ],
      warning: 'Vé mời có thể lưu vào Apple Wallet hoặc Google Wallet trên điện thoại.',
      imgFile: 'app1983_05_events.png',
      caption: 'Màn hình Đăng Ký và Lịch Trình Sự Kiện Đại Hội Hiệp Hội',
      isMobile: true
    },
    {
      part: 'PHẦN 10: ỨNG DỤNG DI ĐỘNG HỘI VIÊN HIỆP HỘI CEO 1983',
      title: 'Bỏ Phiếu Biểu Quyết Đại Hội Trên Thiết Bị Di Động',
      purpose: 'Thực hiện quyền đại biểu bỏ phiếu tín nhiệm bầu Ban Chấp Hành và biểu quyết nghị quyết đại hội.',
      role: 'Đại biểu chính thức tham dự đại hội',
      touchpoint: 'Menu Đại hội -> Biểu quyết (/voting trên mobile)',
      steps: [
        'Khi MC đại hội thông báo mở cổng bầu cử, màn hình biểu quyết tự động sáng lên trên điện thoại.',
        'Đọc nội dung nghị quyết hoặc danh sách ứng viên, tích chọn các lựa chọn tín nhiệm.',
        'Bấm [XÁC NHẬN BỎ PHIẾU], hệ thống ghi nhận phiếu bầu bất biến và hiển thị kết quả lên màn hình LED hội trường.'
      ],
      warning: 'Mỗi đại biểu chỉ được bỏ phiếu đúng 1 lần duy nhất cho mỗi phiên biểu quyết.',
      imgFile: 'app1983_07_voting_poll.png',
      caption: 'Giao diện Bỏ Phiếu Biểu Quyết Đại Hội Bầu Cử Trực Tuyến Trên Mobile',
      isMobile: true
    },
    {
      part: 'PHẦN 10: ỨNG DỤNG DI ĐỘNG HỘI VIÊN HIỆP HỘI CEO 1983',
      title: 'Gia Hạn Hội Phí Niên Liễm Thường Niên Qua VietQR Tự Động',
      purpose: 'Đóng hội phí thường niên tiện lợi qua mã VietQR Napas ngân hàng, thẻ tự động gia hạn thêm 365 ngày.',
      role: 'Hội viên CLB CEO 1983',
      touchpoint: 'Tab Hồ Sơ -> Gia hạn hội phí (/association/renew)',
      steps: [
        'Mở màn hình Gia hạn hội phí, kiểm tra số tiền niên liễm quy định của CLB.',
        'Quét mã VietQR Napas hiển thị trên màn hình từ ứng dụng Mobile Banking của ngân hàng bất kỳ.',
        'Ngân hàng xác nhận thanh toán, hệ thống tự động gạch nợ sau 1 giây, gia hạn thẻ hội viên đến 31/12 năm tiếp theo.'
      ],
      warning: 'Biên lai thu phí điện tử được tự động gửi về email của hội viên ngay sau khi gạch nợ thành công.',
      imgFile: 'app1983_08_renewal_fee.png',
      caption: 'Gia Hạn Hội Phí Niên Liễm Thường Niên Qua Mã VietQR Ngân Hàng Tự Động',
      isMobile: true
    },
    {
      part: 'PHẦN 10: ỨNG DỤNG DI ĐỘNG HỘI VIÊN HIỆP HỘI CEO 1983',
      title: 'Gian Hàng Trưng Bày Sản Phẩm & Giao Thương Nội Khối',
      purpose: 'Giới thiệu sản phẩm, dịch vụ của doanh nghiệp mình tới toàn thể các anh chị em hội viên trong CLB.',
      role: 'Toàn thể hội viên',
      touchpoint: 'Menu Giao thương -> Gian hàng hội viên',
      steps: [
        'Duyệt các sản phẩm, giải pháp ưu đãi đặc quyền do chính các hội viên CEO 1983 cung cấp.',
        'Bấm [+ Đăng Sản Phẩm] để đưa sản phẩm của công ty mình lên gian hàng chung của hiệp hội.',
        'Liên hệ trực tiếp với hội viên bán hàng qua nút Gọi điện hoặc Nhắn tin Zalo nhanh.'
      ],
      warning: 'Hội viên sinh hoạt tích cực được gắn huy hiệu xác thực độ uy tín cao trên gian hàng.',
      imgFile: 'app1983_09_products.png',
      caption: 'Gian Hàng Trưng Bày Sản Phẩm Hội Viên CLB CEO 1983',
      isMobile: true
    },
    {
      part: 'PHẦN 10: ỨNG DỤNG DI ĐỘNG HỘI VIÊN HIỆP HỘI CEO 1983',
      title: 'Sàn Cơ Hội Hợp Tác & Trao Đổi Cơ Hội Kinh Doanh',
      purpose: 'Chia sẻ các cơ hội kinh doanh, nhu cầu tìm kiếm nhà thầu phụ và nguồn lực trong nội khối.',
      role: 'Toàn thể hội viên',
      touchpoint: 'Menu Giao thương -> Cơ hội hợp tác',
      steps: [
        'Đọc các thông tin chia sẻ cơ hội hợp tác kinh doanh từ các hội viên khác.',
        'Bấm [Kết Nối Hợp Tác] để trao đổi phương án liên kết và chia sẻ lợi ích.',
        'Đăng tải nhu cầu tìm đối tác cung cấp dịch vụ hoặc liên minh đấu thầu.'
      ],
      warning: 'Các thông tin cơ hội được thẩm định sơ bộ bởi Ban Xúc Tiến Thương Mại của hiệp hội.',
      imgFile: 'app1983_10_opportunities.png',
      caption: 'Sàn Trao Đổi Cơ Hội Hợp Tác Kinh Doanh Nội Khối CEO 1983',
      isMobile: true
    },
    {
      part: 'PHẦN 10: ỨNG DỤNG DI ĐỘNG HỘI VIÊN HIỆP HỘI CEO 1983',
      title: 'Nhắn Tin Trao Đổi Trực Tuyến & Hồ Sơ Cá Nhân Hội Viên',
      purpose: 'Nhắn tin bảo mật giữa các hội viên và cập nhật hồ sơ năng lực cá nhân.',
      role: 'Toàn thể hội viên',
      touchpoint: 'Menu Tin nhắn & Tab Hồ sơ cá nhân',
      steps: [
        'Mở khung chat 1-1 để trao đổi trực tiếp với hội viên quan tâm.',
        'Vào trang cá nhân cập nhật ảnh đại diện (Avatar) và ảnh bìa (Cover) sắc nét.',
        'Hình ảnh sẽ tự động đồng bộ ngay lập tức tại Trang chủ và danh thiếp điện tử của hội viên.'
      ],
      warning: 'Khi lưu ứng dụng ra màn hình chính iPhone/iPad (Add to Home Screen), biểu tượng ứng dụng hiển thị đúng Logo CEO 1983.',
      imgFile: 'app1983_11_messages.png',
      caption: 'Màn hình Nhắn Tin Trao Đổi Trực Tuyến & Đồng Bộ Hồ Sơ Hội Viên',
      isMobile: true
    }
  ];

  // Helper to load image as Base64 Data URI
  function getImageDataUri(fileName) {
    const fullPath = path.join(EVIDENCE_NEW_DIR, fileName);
    if (fs.existsSync(fullPath)) {
      const ext = path.extname(fileName).toLowerCase().replace('.', '');
      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
      const base64 = fs.readFileSync(fullPath).toString('base64');
      return `data:${mime};base64,${base64}`;
    }
    return '';
  }

  // Generate HTML Content according to Playbook 18 & UNICOM Standards
  let htmlToc = '';
  let htmlBody = '';

  chapters.forEach((chap, idx) => {
    const secId = `sec-${String(idx + 1).padStart(2, '0')}`;
    const dataUri = getImageDataUri(chap.imgFile);

    htmlToc += `
      <a class="toc-item" href="#${secId}">
        <span><strong>${idx + 1}.</strong> [${chap.part.split(':')[0]}] ${chap.title}</span>
        <span>Mục ${idx + 1}</span>
      </a>
    `;

    const imgClass = chap.isMobile ? 'shot mobile' : 'shot';
    const imgTag = dataUri
      ? `<div class="${imgClass}">
          <img src="${dataUri}" alt="${chap.caption}">
          <figcaption><strong>Ảnh ${idx + 1}:</strong> ${chap.caption}</figcaption>
        </div>`
      : `<div class="shot-missing"><strong>[CHƯA CÓ ẢNH]:</strong> ${chap.caption}</div>`;

    const stepsHtml = chap.steps.map((st, sIdx) => `<li><strong>Bước ${sIdx + 1}:</strong> ${st}</li>`).join('');

    htmlBody += `
      <section class="trn-section" id="${secId}">
        <div class="trn-body">
          <div>
            <span class="trn-tag">${chap.part.split(':')[0]}</span>
            <h2 class="trn-h2">${chap.title}</h2>
          </div>
          <div class="trn-h3">Mục đích: ${chap.purpose}</div>
          <div class="trn-path"><strong>Đối tượng áp dụng:</strong> ${chap.role} &nbsp;·&nbsp; <strong>Điểm chạm:</strong> <code>${chap.touchpoint}</code></div>

          <div class="trn-sec">Các Bước Thao Tác Chi Tiết:</div>
          <ol class="trn-steps">
            ${stepsHtml}
          </ol>

          <div class="box-warn">
            <strong>LƯU Ý NGHIỆP VỤ & QUY TẮC VẬN HÀNH</strong>
            ${chap.warning}
          </div>

          ${imgTag}
        </div>
      </section>
    `;
  });

  const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TÀI LIỆU HƯỚNG DẪN SỬ DỤNG TOÀN DIỆN · HỆ THỐNG VIONE & APP CEO 1983</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background: #d5dbe3; font-family: 'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #0d1e34; line-height: 1.55; }
    .trn-doc { width: 210mm; max-width: 100%; margin: 12px auto 40px; background: #fff; box-shadow: 0 2px 16px rgba(0,0,0,.22); }
    .cover { width: 210mm; height: 297mm; min-height: 297mm; max-height: 297mm; padding: 0; margin: 0; overflow: hidden; display: flex; flex-direction: column; page-break-after: always; break-after: page; }
    .cover .accent-bar { height: 10px; background: linear-gradient(90deg, #003B95, #D4AF37, #9A6E3A); flex-shrink: 0; }
    .cover .header { padding: 18px 36px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 700; color: #475569; flex-shrink: 0; }
    .cover .divider { margin: 0 36px; height: 1px; background: #e2e8f0; flex-shrink: 0; }
    .cover .main { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 36px 16px; text-align: center; }
    .cover .doc-label { font-size: 11px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 16px; color: #003B95; }
    .cover .project-title { font-size: 32px; font-weight: 900; letter-spacing: 1px; line-height: 1.3; color: #0F172A; }
    .cover .project-title .gold { color: #9A6E3A; }
    .cover .subtitle { margin-top: 14px; font-size: 14px; color: #475569; max-width: 580px; }
    .cover .meta-info { margin: 30px auto 0; max-width: 560px; text-align: left; font-size: 11px; line-height: 1.8; color: #334155; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; background: #f8fafc; }
    .cover .meta-info strong { color: #0F172A; }
    .cover .footer { margin-top: auto; padding: 14px 36px; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b; flex-shrink: 0; }

    .toc { padding: 24px 36px 30px; page-break-after: always; break-after: page; }
    .toc-title { font-size: 20px; font-weight: 900; color: #003B95; border-bottom: 2px solid #003B95; padding-bottom: 8px; margin-bottom: 16px; }
    .toc-list { display: flex; flex-direction: column; gap: 6px; }
    .toc-item { display: flex; justify-content: space-between; padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 11.5px; text-decoration: none; color: #0F172A; }
    .toc-item:hover { background: #eef2ff; border-color: #003B95; }

    .trn-section { padding: 0 0 10px; page-break-before: always; break-before: page; }
    .trn-body { padding: 18px 36px 28px; }
    .trn-tag { display: inline-block; font-size: 9.5px; font-weight: 800; letter-spacing: .1em; color: #fff; background: linear-gradient(90deg, #003B95, #9A6E3A); padding: 3px 8px; border-radius: 3px; margin-right: 8px; vertical-align: middle; }
    .trn-h2 { font-size: 17px; font-weight: 900; color: #0F172A; display: inline; vertical-align: middle; }
    .trn-h3 { font-size: 12px; font-weight: 600; color: #64748b; margin: 6px 0 10px; }
    .trn-path { font-size: 11px; margin: 0 0 12px; padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; color: #334155; }
    .trn-sec { margin: 14px 0 6px; font-size: 12.5px; font-weight: 800; color: #0F172A; }
    .trn-steps { margin: 6px 0 12px; padding-left: 18px; }
    .trn-steps li { margin: 4px 0; line-height: 1.5; font-size: 11.5px; }

    .box-warn { background: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #d97706; padding: 8px 12px; margin: 10px 0; border-radius: 0 4px 4px 0; font-size: 11px; }
    .box-warn strong { display: block; margin-bottom: 2px; font-size: 10px; letter-spacing: .05em; text-transform: uppercase; color: #92400e; }

    .shot { margin: 12px 0 16px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #fff; }
    .shot img { width: 100%; display: block; height: auto; }
    .shot figcaption { font-size: 11px; color: #475569; padding: 6px 10px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-weight: 600; text-align: center; }

    /* KHUNG ẢNH CHUẨN MOBILE CHO TÀI LIỆU */
    .shot.mobile { max-width: 320px; margin: 12px auto 16px; border: 3px solid #1E293B; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); overflow: hidden; }
    .shot.mobile figcaption { border-radius: 0 0 17px 17px; }

    @page { size: A4; margin: 16mm 12mm 18mm 12mm; }
    @page:first { margin: 0; }
    @media print {
      html, body { background: #fff !important; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .trn-doc { width: auto; max-width: none; margin: 0; box-shadow: none; }
      .cover { width: 210mm !important; height: 297mm !important; margin: 0 !important; page-break-after: always; break-after: page; }
      .trn-section { page-break-before: always; break-before: page; }
      .shot { page-break-inside: avoid; break-inside: avoid; }
    }
  </style>
</head>
<body>
  <article class="trn-doc">
    <!-- TRANG BÌA A4 CHUẨN 210x297mm -->
    <section class="cover" id="cover">
      <div class="accent-bar"></div>
      <div class="header">
        <div>Mã tài liệu: <span>HDSD-VIONE-CEO1983-V6.0</span></div>
        <div>Phiên bản 6.0 Master · 10/2026 · Hướng dẫn sử dụng toàn diện</div>
      </div>
      <div class="divider"></div>
      <div class="main">
        <div class="doc-label">TÀI LIỆU HƯỚNG DẪN SỬ DỤNG CHÍNH THỨC</div>
        <h1 class="project-title">
          HỆ ĐIỀU HÀNH DOANH NGHIỆP <span class="gold">VIONE</span><br>& NỀN TẢNG HIỆP HỘI CLB DOANH NHÂN CEO 1983
        </h1>
        <div class="subtitle">
          Hướng dẫn thao tác chi tiết từng bước (Step-by-Step) toàn bộ phân hệ Web CRM, App Di động ViOne Connect và App Di động Hiệp Hội CEO 1983 kèm hình ảnh chụp thực tế 100%.
        </div>
        <div class="meta-info">
          <div><strong>Đơn vị phát triển:</strong> Ban Công Nghệ & Chuyển Đổi Số — Tập Đoàn VioConnect</div>
          <div><strong>Khách hàng & Chủ quản:</strong> Ban Điều Hành Doanh Nghiệp & CLB Doanh Nhân CEO 1983</div>
          <div><strong>Phạm vi tài liệu:</strong> Web CRM Quản trị (Desktop) & App Di Động Native/PWA (Mobile)</div>
          <div><strong>Tiêu chuẩn tài liệu:</strong> Playbook 18 Training HTML/PDF & UNICOM Standards</div>
          <div><strong>Ngày phát hành:</strong> 05/10/2026 · Đã thẩm định thực tế trên máy chủ kiểm thử</div>
        </div>
      </div>
      <div class="footer">
        <div>Bản quyền © 2026 VioConnect Group · ViOne Platform</div>
        <div>Lưu hành nội bộ & Chuyển giao đào tạo</div>
      </div>
    </section>

    <!-- MỤC LỤC -->
    <section class="toc" id="toc">
      <div class="toc-title">MỤC LỤC TỔNG QUAN HƯỚNG DẪN THAO TÁC</div>
      <div class="toc-list">
        ${htmlToc}
      </div>
    </section>

    <!-- CÁC CHƯƠNG CHI TIẾT KÈM ẢNH -->
    <div class="trn-flow">
      ${htmlBody}
    </div>

    <!-- TRANG KẾT THÚC -->
    <footer style="padding: 24px 36px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b; text-align: center;">
      TÀI LIỆU HƯỚNG DẪN SỬ DỤNG TOÀN DIỆN VIONE & CEO 1983 · XUẤT BẢN THÁNG 10/2026 · VIOCONNECT GROUP
    </footer>
  </article>
</body>
</html>`;

  const htmlOutPath = path.join(DOCS_DIR, 'HUONG_DAN_SU_DUNG_TOAN_DIEN_VIONE_VA_CEO1983.html');
  fs.writeFileSync(htmlOutPath, fullHtml, 'utf8');
  console.log(`✓ Saved HDSD HTML to: ${htmlOutPath} (${fullHtml.length} bytes)`);

  // Also build Word Document for HDSD
  const hdsdDocChildren = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 800, after: 200 },
      children: [
        new TextRun({
          text: 'TẬP ĐOÀN CÔNG NGHỆ VIOCONNECT',
          font: FONT_FAMILY,
          size: 28,
          bold: true,
          color: NAVY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: 'HƯỚNG DẪN SỬ DỤNG TOÀN DIỆN HỆ THỐNG & APP',
          font: FONT_FAMILY,
          size: 36,
          bold: true,
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 400 },
      children: [
        new TextRun({
          text: 'VIONE PLATFORM & CLB DOANH NHÂN CEO 1983 (BẢN V6.0)',
          font: FONT_FAMILY,
          size: 24,
          bold: true,
          color: 'D97706',
        }),
      ],
    }),
    createCallout(
      'HƯỚNG DẪN THAO TÁC STEP-BY-STEP TOÀN DIỆN',
      'Tài liệu hướng dẫn thao tác chi tiết từng bước cho toàn bộ 4 phân hệ: Web CRM Doanh Nghiệp, App Di Động ViOne Connect, Web CRM Hiệp Hội và App Di Động Hội Viên CEO 1983.'
    ),
    new Paragraph({
      spacing: { before: 400, after: 200 },
      pageBreakBefore: true,
    })
  ];

  chapters.forEach((chap, idx) => {
    hdsdDocChildren.push(
      createHeading1(`${idx + 1}. [${chap.part.split(':')[0]}] ${chap.title}`),
      createPara(`Mục đích: ${chap.purpose}`, { italics: true, color: '475569' }),
      createPara(`Đối tượng áp dụng: ${chap.role} | Điểm chạm: ${chap.touchpoint}`, { bold: true }),
      createHeading2('Các Bước Thao Tác Chi Tiết:')
    );

    chap.steps.forEach((st, sIdx) => {
      hdsdDocChildren.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
              text: `Bước ${sIdx + 1}: ${st}`,
              font: FONT_FAMILY,
              size: 22,
              color: '1E293B',
            }),
          ],
        })
      );
    });

    hdsdDocChildren.push(
      createCallout('LƯU Ý NGHIỆP VỤ & QUY TẮC VẬN HÀNH', chap.warning),
      createPara(`[Ảnh minh họa]: ${chap.caption}`, { italics: true, color: '64748B', alignment: AlignmentType.CENTER }),
      new Paragraph({ spacing: { before: 100, after: 100 } })
    );
  });

  const hdsdDoc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1200, bottom: 1200, left: 1400, right: 1400 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'HƯỚNG DẪN SỬ DỤNG TOÀN DIỆN · VIONE & CEO 1983',
                    font: FONT_FAMILY,
                    size: 18,
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
                alignment: AlignmentType.RIGHT,
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
                    color: '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        },
        children: hdsdDocChildren,
      },
    ],
  });

  const hdsdBuffer = await Packer.toBuffer(hdsdDoc);
  const hdsdDocxOutPath = path.join(DOCS_DIR, 'HUONG_DAN_SU_DUNG_TOAN_DIEN_VIONE_VA_CEO1983.docx');
  fs.writeFileSync(hdsdDocxOutPath, hdsdBuffer);
  console.log(`✓ Saved HDSD docx to: ${hdsdDocxOutPath} (${hdsdBuffer.length} bytes)`);
}

// -------------------------------------------------------------
// 4. BUILD PRESENTATION SLIDES (HTML & PPTX)
// -------------------------------------------------------------
async function buildPresentationSlides() {
  console.log('Generating Ecosystem Presentation Slides (HTML & PPTX)...');

  const slidesData = [
    {
      title: 'HỆ SINH THÁI DOANH NGHIỆP VIONE & NỀN TẢNG HIỆP HỘI CEO 1983',
      subtitle: 'Hệ Điều Hành Doanh Nghiệp Toàn Diện & Mạng Lưới Kết Nối Doanh Nhân Hợp Nhất 6.0',
      eyebrow: 'TỔNG QUAN CHIẾN LƯỢC',
      bullets: [
        'Hợp nhất 3 trụ cột: Web CRM Doanh Nghiệp, App Di Động Doanh Nhân ViOne Connect và App Hiệp Hội CEO 1983.',
        'Thiết kế chuẩn đẳng cấp: Dark Obsidian & Champagne Gold thượng lưu cho Doanh nhân; Classic Navy & Amber Gold cho Hiệp hội.',
        'Tự động hóa 100% quy trình: Chấm công GPS & FaceID, phê duyệt chi tiền 3 cấp, đối soát VietQR và kiểm phiếu đại hội tức thời.',
        'Sức mạnh 6 năng lực AI: AI Copilot đàm thoại điều hành, OCR danh thiếp, đối soát Excel, soạn hợp đồng, gợi ý đối tác và cảnh báo tải.'
      ]
    },
    {
      title: 'MỤC TIÊU CHIẾN LƯỢC SMART & KHUNG ROI 3 NĂM',
      subtitle: 'Đo lường hiệu quả kinh tế và tối ưu hóa chi phí vận hành doanh nghiệp',
      eyebrow: 'HIỆU QUẢ ĐẦU TƯ',
      bullets: [
        'Tiết kiệm 45% chi phí hành chính thông qua số hóa quy trình giao việc, duyệt chi và bảng công.',
        'Rút ngắn 60% chu kỳ bán hàng: Phản hồi khách hàng tiềm năng < 15 phút, xuất báo giá PDF trong 2 phút.',
        'Tăng 40% hiệu suất giao thương: Cấp Danh thiếp số Titanium NFC độc bản cho 100% lãnh đạo.',
        'Tỷ lệ lợi tức đầu tư ROI: Năm 1 đạt 166.7%, Năm 2 đạt 300%, Năm 3 đạt 450%.'
      ]
    },
    {
      title: 'WEB CRM QUẢN TRỊ DOANH NGHIỆP TẬP TRUNG',
      subtitle: 'Điều hành chiến lược C-Level, đa công ty Multi-Tenant và tài chính dòng tiền',
      eyebrow: 'WEB CRM VIONE',
      bullets: [
        'Executive Dashboard: Theo dõi sức khỏe dòng tiền, công nợ và panel Danh mục sản phẩm 6 ngành hàng.',
        'Quy trình việc Kanban: Kéo thả trực quan, kiểm soát checklist chất lượng, cảnh báo trễ hạn tự động.',
        'Giám sát tải Workload Heatmap: Phát hiện quá tải (> 45h/tuần) để cân bằng nguồn lực công bằng.',
        'Phê duyệt chi tiền 3 cấp: Người lập -> Kế toán kiểm tra -> Lãnh đạo duyệt; quét chống chi trùng số hóa đơn.',
        'Chuyển khoản QR ngân hàng Napas 24/7 tự động gạch nợ tức thời trong 1 giây.'
      ]
    },
    {
      title: 'APP DI ĐỘNG DOANH NHÂN VIONE CONNECT NATIVE',
      subtitle: 'Nền tảng kết nối giao thương B2B, danh thiếp số 3D Titanium và trợ lý AI',
      eyebrow: 'APP VIONE CONNECT',
      bullets: [
        'Mã nguồn thuần Native React Native Expo 52: Tốc độ mượt mà 60fps, lưu phiên offline an toàn.',
        'Danh thiếp số 3D Titanium mạ vàng Champagne: Tích hợp chip NFC vật lý 1-chạm lưu danh bạ vCard (.vcf).',
        'Dải khoảnh khắc 24h (Stories) & B2B Moments: Chia sẻ bài học quản trị và cơ hội đầu tư C-Level.',
        'Nurture List: Tự động cảnh báo đối tác 30 ngày chưa tương tác kèm 3 nút Hẹn 1-1, Nhắn tin, Gọi điện.',
        'Máy quét OCR AI: Chụp danh thiếp giấy tại hội thảo, trích xuất 7 trường thông tin lưu vào máy tức thì.'
      ]
    },
    {
      title: 'PHÂN HỆ HIỆP HỘI CLB DOANH NHÂN CEO 1983',
      subtitle: 'Số hóa toàn diện công tác tổ chức đại hội, biểu quyết và gia hạn hội phí niên liễm',
      eyebrow: 'HIỆP HỘI CEO 1983',
      bullets: [
        'Nhận diện Classic Navy & Amber Gold: Thẻ hội viên VIP dập nổi logo 1983 và mã hội viên duy nhất.',
        'Cổng soát vé an ninh QR Check-In: Quét thẻ đại biểu tại cửa dưới 0.2 giây/người, chống ùn tắc đại hội.',
        'Đại hội biểu quyết trực tuyến: Bỏ phiếu tín nhiệm trên app di động, nhảy số thời gian thực lên màn hình LED.',
        'Quay số may mắn Lucky Draw: Thuật toán mật mã ngẫu nhiên minh bạch có hiệu ứng pháo hoa sân khấu.',
        'Gia hạn hội phí niên liễm qua VietQR: Tự động gia hạn thẻ hội viên 365 ngày và xuất biên lai điện tử.'
      ]
    },
    {
      title: 'MA TRẬN PHÂN QUYỀN RBAC NỀN TẢNG & AN TOÀN DỮ LIỆU',
      subtitle: 'Kiến trúc bảo mật cấp doanh nghiệp và kiểm soát truy cập nghiêm ngặt',
      eyebrow: 'BẢO MẬT & KIẾN TRÚC',
      bullets: [
        'Ma trận RBAC Chức năng Nền tảng: 7 Nhóm quyền x 6 Thao tác (Xem, Tạo, Sửa, Xóa, Duyệt, Xuất).',
        'Phân định độc lập: Trong chức năng nền tảng của CRM ViOne tuyệt đối không có cấu phần hiệp hội.',
        'Mã hóa dữ liệu chuẩn quân đội AES-256 ở trạng thái nghỉ, truyền tải an toàn qua TLS 1.3.',
        'Nhật ký kiểm toán Audit Trail bất biến và giới hạn tần suất truy cập Rate-limit 100 req/phút chống DDoS.',
        'Cam kết độ sẵn sàng SLA ≥ 99.98%, RPO < 2 giờ, RTO < 30 phút.'
      ]
    },
    {
      title: 'LỘ TRÌNH TRIỂN KHAI & CAM KẾT BÀN GIAO TOÀN DIỆN',
      subtitle: 'Kế hoạch chuyển giao công nghệ và nghiệm thu 100% tính năng',
      eyebrow: 'LỘ TRÌNH & NGHIỆM THU',
      bullets: [
        'Giai đoạn 1 (Tuần 1-2): Khảo sát cấu trúc tổ chức, phân quyền RBAC và cấu hình hạ tầng đám mây.',
        'Giai đoạn 2 (Tuần 3-4): Nhập khẩu dữ liệu tài khoản, danh mục 6 ngành hàng, thiết lập định vị GPS văn phòng.',
        'Giai đoạn 3 (Tuần 5-6): Bàn giao thẻ danh thiếp Titanium NFC, đào tạo người dùng và chạy thử nghiệm song song.',
        'Giai đoạn 4 (Tuần 7-8): Go-Live chính thức 100%, kích hoạt 6 năng lực AI và ký biên bản nghiệm thu.'
      ]
    }
  ];

  // 1. Generate HTML Slide Deck
  let slidesHtml = '';
  slidesData.forEach((s, idx) => {
    const bulletsLi = s.bullets.map((b) => `<li>${b}</li>`).join('');
    slidesHtml += `
      <section class="slide" id="slide-${idx + 1}">
        <div class="slide-header">
          <div class="eyebrow">${s.eyebrow}</div>
          <h2 class="title">${s.title}</h2>
          <div class="subtitle">${s.subtitle}</div>
        </div>
        <div class="slide-content">
          <ul class="bullet-list">
            ${bulletsLi}
          </ul>
        </div>
        <div class="slide-footer">
          <span>Hệ Sinh Thái ViOne & CEO 1983 · Slide ${idx + 1} / ${slidesData.length}</span>
          <span>Bản quyền © 2026 VioConnect Group</span>
        </div>
      </section>
    `;
  });

  const fullSlideHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SLIDE THUYẾT TRÌNH HỆ SINH THÁI DOANH NGHIỆP VIONE & CEO 1983</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0A0A0B; color: #F8FAFC; font-family: 'Be Vietnam Pro', sans-serif; display: flex; flex-direction: column; align-items: center; padding: 20px; }
    .slide-deck { width: 100%; max-width: 1200px; display: flex; flex-direction: column; gap: 30px; }
    .slide {
      background: radial-gradient(circle at 10% 20%, rgba(15, 23, 42, 0.95), rgba(10, 10, 11, 1));
      border: 1px solid rgba(216, 178, 130, 0.3);
      border-radius: 16px;
      padding: 40px 50px;
      aspect-ratio: 16 / 9;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      page-break-after: always;
      position: relative;
      overflow: hidden;
    }
    .slide::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 6px;
      background: linear-gradient(90deg, #003B95, #D8B282, #F59E0B);
    }
    .eyebrow {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #D8B282;
      text-transform: uppercase;
      background: rgba(216, 178, 130, 0.12);
      border: 1px solid rgba(216, 178, 130, 0.3);
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 12px;
    }
    .title {
      font-family: 'Outfit', sans-serif;
      font-size: 28px;
      font-weight: 800;
      color: #FFFFFF;
      line-height: 1.3;
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: 14px;
      color: #94A3B8;
      font-weight: 400;
    }
    .slide-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin: 20px 0;
    }
    .bullet-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .bullet-list li {
      font-size: 15px;
      line-height: 1.6;
      color: #E2E8F0;
      position: relative;
      padding-left: 28px;
    }
    .bullet-list li::before {
      content: '◆';
      position: absolute;
      left: 0;
      color: #D8B282;
      font-size: 14px;
      top: 1px;
    }
    .slide-footer {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid rgba(255,255,255,0.1);
      padding-top: 14px;
      font-size: 11px;
      color: #64748B;
    }
    @media print {
      body { background: transparent; padding: 0; }
      .slide-deck { gap: 0; }
      .slide { border-radius: 0; box-shadow: none; aspect-ratio: auto; height: 100vh; }
    }
  </style>
</head>
<body>
  <div class="slide-deck">
    ${slidesHtml}
  </div>
</body>
</html>`;

  const slideHtmlPath = path.join(DOCS_DIR, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_VIONE_TOAN_DIEN.html');
  fs.writeFileSync(slideHtmlPath, fullSlideHtml, 'utf8');
  console.log(`✓ Saved Presentation HTML to: ${slideHtmlPath} (${fullSlideHtml.length} bytes)`);

  // 2. Generate PPTX Slide Deck via pptxgenjs
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

  slidesData.forEach((s) => {
    const slide = pptx.addSlide();
    slide.background = { color: '0A0A0B' };

    // Top Accent Bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: '100%', h: 0.1,
      fill: { color: 'D8B282' }
    });

    // Eyebrow
    slide.addText(s.eyebrow, {
      x: 0.8, y: 0.5, w: 5.0, h: 0.35,
      color: 'D8B282', fontSize: 11, bold: true, fontFace: 'Calibri'
    });

    // Title
    slide.addText(s.title, {
      x: 0.8, y: 0.9, w: 11.7, h: 0.7,
      color: 'FFFFFF', fontSize: 22, bold: true, fontFace: 'Calibri'
    });

    // Subtitle
    slide.addText(s.subtitle, {
      x: 0.8, y: 1.6, w: 11.7, h: 0.4,
      color: '94A3B8', fontSize: 13, italic: true, fontFace: 'Calibri'
    });

    // Bullets
    const bulletItems = s.bullets.map((b) => ({
      text: b,
      options: { fontSize: 14, color: 'E2E8F0', bullet: true, spacing: { after: 12 } }
    }));

    slide.addText(bulletItems, {
      x: 0.8, y: 2.3, w: 11.7, h: 4.2,
      fontFace: 'Calibri'
    });

    // Footer
    slide.addText('Hệ Sinh Thái ViOne & Hiệp Hội CEO 1983 · Bản quyền © 2026 VioConnect', {
      x: 0.8, y: 6.9, w: 11.7, h: 0.3,
      color: '64748B', fontSize: 9.5, fontFace: 'Calibri'
    });
  });

  const pptxOutPath = path.join(DOCS_DIR, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_VIONE_TOAN_DIEN.pptx');
  await pptx.writeFile({ fileName: pptxOutPath });
  console.log(`✓ Saved Presentation PPTX to: ${pptxOutPath}`);
}

// -------------------------------------------------------------
// MAIN EXECUTION
// -------------------------------------------------------------
async function main() {
  try {
    await buildBrdDocx();
    await buildSrsDocx();
    await buildUserGuide();
    await buildPresentationSlides();
    console.log('\n=== ALL DELIVERABLES SUCCESSFULLY CREATED ===');
  } catch (err) {
    console.error('Error generating deliverables:', err);
    process.exit(1);
  }
}

main();
