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
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  PageBreak,
} = require('docx');

async function generateManual() {
  console.log('Generating Comprehensive User Guide & Operations Manual (DOCX)...');

  const FONT_FAMILY = 'Times New Roman';
  const BODY_SIZE = 26; // 13 pt (half-points)
  const H1_SIZE = 32;   // 16 pt
  const H2_SIZE = 28;   // 14 pt
  const H3_SIZE = 26;   // 13 pt bold
  const TITLE_SIZE = 44;// 22 pt bold
  const SUBTITLE_SIZE = 28; // 14 pt

  const NAVY = '1E293B';
  const BLUE_HEADER = '0284C7';
  const BORDER_COLOR = 'CBD5E1';
  const RED_ALERT = 'B91C1C';

  const BORDER_THIN = {
    top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
    left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
    right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  };

  // Helper functions
  function createPara(text, options = {}) {
    return new Paragraph({
      alignment: options.alignment || AlignmentType.JUSTIFIED,
      spacing: options.spacing || { line: 276, before: 80, after: 80 },
      indent: options.indent,
      bullet: options.bullet,
      children: [
        new TextRun({
          text: text,
          font: FONT_FAMILY,
          size: options.size || BODY_SIZE,
          bold: options.bold || false,
          italics: options.italics || false,
          color: options.color || '1E293B',
        }),
      ],
    });
  }

  function createRunsPara(runs, options = {}) {
    return new Paragraph({
      alignment: options.alignment || AlignmentType.JUSTIFIED,
      spacing: options.spacing || { line: 276, before: 80, after: 80 },
      indent: options.indent,
      children: runs.map(
        (r) =>
          new TextRun({
            text: r.text,
            font: FONT_FAMILY,
            size: r.size || BODY_SIZE,
            bold: r.bold || false,
            italics: r.italics || false,
            color: r.color || '1E293B',
          })
      ),
    });
  }

  function createH1(title) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 280, after: 120 },
      children: [
        new TextRun({
          text: title,
          font: FONT_FAMILY,
          size: H1_SIZE,
          bold: true,
          color: '0F172A',
        }),
      ],
    });
  }

  function createH2(title) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 80 },
      children: [
        new TextRun({
          text: title,
          font: FONT_FAMILY,
          size: H2_SIZE,
          bold: true,
          color: '0369A1',
        }),
      ],
    });
  }

  function createH3(title) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 140, after: 60 },
      children: [
        new TextRun({
          text: title,
          font: FONT_FAMILY,
          size: H3_SIZE,
          bold: true,
          color: '1E293B',
        }),
      ],
    });
  }

  function createCallout(title, content, isWarning = false) {
    return [
      new Paragraph({
        border: {
          left: {
            color: isWarning ? RED_ALERT : BLUE_HEADER,
            size: 24,
            style: BorderStyle.SINGLE,
            space: 8,
          },
        },
        indent: { left: 300 },
        shading: {
          fill: isWarning ? 'FEF2F2' : 'F0F9FF',
          type: ShadingType.CLEAR,
        },
        spacing: { before: 100, after: 40 },
        children: [
          new TextRun({
            text: (isWarning ? '⚠️ CẢNH BÁO HIỆN TRẠNG KỸ THUẬT: ' : '📌 LƯU Ý NGHIỆP VỤ: ') + title,
            font: FONT_FAMILY,
            size: BODY_SIZE,
            bold: true,
            color: isWarning ? RED_ALERT : '0284C7',
          }),
        ],
      }),
      new Paragraph({
        border: {
          left: {
            color: isWarning ? RED_ALERT : BLUE_HEADER,
            size: 24,
            style: BorderStyle.SINGLE,
            space: 8,
          },
        },
        indent: { left: 300 },
        shading: {
          fill: isWarning ? 'FEF2F2' : 'F0F9FF',
          type: ShadingType.CLEAR,
        },
        spacing: { before: 40, after: 120 },
        children: [
          new TextRun({
            text: content,
            font: FONT_FAMILY,
            size: BODY_SIZE,
            italics: true,
            color: '334155',
          }),
        ],
      }),
    ];
  }

  function createTable(headers, rows, colWidths = []) {
    const tableRows = [];

    // Header row
    const headerCells = headers.map((h, i) => {
      return new TableCell({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: h,
                font: FONT_FAMILY,
                size: 24, // 12pt
                bold: true,
                color: 'FFFFFF',
              }),
            ],
          }),
        ],
        shading: { fill: BLUE_HEADER, type: ShadingType.CLEAR },
        borders: BORDER_THIN,
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        width: colWidths[i] ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
      });
    });
    tableRows.push(new TableRow({ children: headerCells, tableHeader: true }));

    // Data rows
    rows.forEach((r, rIdx) => {
      const cells = r.map((c, i) => {
        const isHighlight = c.includes('CHƯA') || c.includes('FAILED') || c.includes('Chưa');
        return new TableCell({
          children: [
            new Paragraph({
              alignment: i === 0 || r.length <= 4 ? AlignmentType.CENTER : AlignmentType.LEFT,
              spacing: { before: 50, after: 50 },
              children: [
                new TextRun({
                  text: c,
                  font: FONT_FAMILY,
                  size: 24, // 12pt
                  bold: isHighlight || i === 0,
                  color: isHighlight ? RED_ALERT : '1E293B',
                }),
              ],
            }),
          ],
          shading: {
            fill: rIdx % 2 === 1 ? 'F8FAFC' : 'FFFFFF',
            type: ShadingType.CLEAR,
          },
          borders: BORDER_THIN,
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          width: colWidths[i] ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
        });
      });
      tableRows.push(new TableRow({ children: cells }));
    });

    return new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DOCUMENT SECTIONS
  // ════════════════════════════════════════════════════════════════════════════
  const docElements = [];

  // ────────────────────────────────────────────────────────────────────────────
  // 1. TRANG BÌA (COVER PAGE)
  // ────────────────────────────────────────────────────────────────────────────
  docElements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: 'HỆ SINH THÁI DOANH NGHIỆP & CÔNG NGHỆ VIONE',
          font: FONT_FAMILY,
          size: 28,
          bold: true,
          color: '0369A1',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 50, after: 600 },
      children: [
        new TextRun({
          text: 'CLB DOANH NHÂN CEO 1983 · MẠNG GIAO THƯƠNG B2B VIONE CONNECT',
          font: FONT_FAMILY,
          size: 22,
          italics: true,
          color: '475569',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 150 },
      children: [
        new TextRun({
          text: 'TÀI LIỆU HƯỚNG DẪN SỬ DỤNG\nVẬN HÀNH TOÀN DIỆN HỆ THỐNG',
          font: FONT_FAMILY,
          size: TITLE_SIZE,
          bold: true,
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 500 },
      children: [
        new TextRun({
          text: 'QUẢN TRỊ CRM HIỆP HỘI — APP HỘI VIÊN CEO 1983 — MẠNG XÃ HỘI DOANH NHÂN VIONE\n(ĐẶC TẢ CHI TIẾT TỪNG CHỨC NĂNG CON & PHÂN TÍCH HIỆN TRẠNG KẾT NỐI API BÊN THỨ 3)',
          font: FONT_FAMILY,
          size: 22,
          bold: true,
          color: '0284C7',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 100 },
      children: [
        new TextRun({
          text: '══════════════════════════════════════════',
          font: FONT_FAMILY,
          size: 22,
          color: 'CBD5E1',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 60 },
      children: [
        new TextRun({
          text: 'Người thực hiện nâng cấp: ',
          font: FONT_FAMILY,
          size: BODY_SIZE,
          color: '475569',
        }),
        new TextRun({
          text: 'PHẠM VĂN VŨ',
          font: FONT_FAMILY,
          size: 28,
          bold: true,
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 60 },
      children: [
        new TextRun({
          text: 'Ngày bắt đầu nâng cấp: ',
          font: FONT_FAMILY,
          size: BODY_SIZE,
          color: '475569',
        }),
        new TextRun({
          text: '11/09/2026',
          font: FONT_FAMILY,
          size: BODY_SIZE,
          bold: true,
          color: '0369A1',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 60 },
      children: [
        new TextRun({
          text: 'Ngày kết thúc dự kiến: ',
          font: FONT_FAMILY,
          size: BODY_SIZE,
          color: '475569',
        }),
        new TextRun({
          text: 'Đang rà soát và đánh giá theo từng giai đoạn (Để trống)',
          font: FONT_FAMILY,
          size: BODY_SIZE,
          italics: true,
          color: '64748B',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 800 },
      children: [
        new TextRun({
          text: 'Phiên bản tài liệu: ',
          font: FONT_FAMILY,
          size: BODY_SIZE,
          color: '475569',
        }),
        new TextRun({
          text: 'Version 2.0 (Chuẩn hóa thực tế & Khớp kỹ thuật 100%)',
          font: FONT_FAMILY,
          size: BODY_SIZE,
          bold: true,
          color: '059669',
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ────────────────────────────────────────────────────────────────────────────
  // 2. MỤC LỤC TÀI LIỆU (TABLE OF CONTENTS)
  // ────────────────────────────────────────────────────────────────────────────
  docElements.push(
    createH1('MỤC LỤC CHI TIẾT'),
    createPara('Tài liệu hướng dẫn vận hành và sử dụng hệ sinh thái ViOne được tổ chức gồm 5 phần trọng tâm:'),
    createPara('PHẦN I: TỔNG QUAN KIẾN TRÚC & ĐÁNH GIÁ TRUNG THỰC KẾT NỐI API BÊN NGOÀI', { bold: true }),
    createPara('  1.1. Tầm nhìn chiến lược và ranh giới 3 phân hệ độc lập', { indent: { left: 300 } }),
    createPara('  1.2. Bảng kiểm toán trung thực hiện trạng các API bên thứ 3 (External APIs)', { indent: { left: 300 } }),
    createPara('  1.3. Cấu hình định tuyến (URL Routing) & Tài khoản đăng nhập', { indent: { left: 300 } }),
    createPara('PHẦN II: HƯỚNG DẪN VẬN HÀNH HỆ THỐNG CRM QUẢN TRỊ (CRM ADMIN PORTAL)', { bold: true }),
    createPara('  2.1. Phân hệ Quản lý Hội viên & Ban Chấp Hành (Thẩm định, Phê duyệt, Cấp mã)', { indent: { left: 300 } }),
    createPara('  2.2. Phân hệ Quản lý Doanh nghiệp Thành viên & Năng lực chuỗi cung ứng', { indent: { left: 300 } }),
    createPara('  2.3. Phân hệ Tài chính, Hội phí, Thu chi & Quy trình gạch nợ thủ công', { indent: { left: 300 } }),
    createPara('  2.4. Phân hệ Sự kiện, Sơ đồ bàn tiệc VIP & Quét vé QR điểm danh', { indent: { left: 300 } }),
    createPara('  2.5. Phân hệ Bầu cử số hóa & Biểu quyết nghị quyết Đại hội', { indent: { left: 300 } }),
    createPara('  2.6. Phân hệ Đặt phòng họp nội bộ (Làm rõ chưa có API video call ngoài)', { indent: { left: 300 } }),
    createPara('  2.7. Phân hệ Truyền thông, Email Marketing & Thư viện quy chế', { indent: { left: 300 } }),
    createPara('  2.8. Phân hệ Quản trị nền tảng, Phân quyền RBAC & Nhật ký kiểm toán', { indent: { left: 300 } }),
    createPara('PHẦN III: HƯỚNG DẪN SỬ DỤNG APP HIỆP HỘI (CLB DOANH NHÂN CEO 1983)', { bold: true }),
    createPara('  3.1. Cổng đăng nhập Mobile (Làm rõ luồng nội bộ vs Google/Apple Login)', { indent: { left: 300 } }),
    createPara('  3.2. Thẻ hội viên kỹ thuật số 3D & Danh thiếp số vCard', { indent: { left: 300 } }),
    createPara('  3.3. Tra cứu Danh bạ hội viên & Kết nối kinh doanh trực tiếp', { indent: { left: 300 } }),
    createPara('  3.4. Đăng ký sự kiện & Vé QR điện tử vào cửa', { indent: { left: 300 } }),
    createPara('  3.5. NỘP HỘI PHÍ qua mã VietQR (Quy trình chuyển khoản & chờ duyệt thủ công)', { indent: { left: 300 } }),
    createPara('  3.6. Hộp thư trao đổi Ban Thư ký, Kho đặc quyền & Thư viện tài liệu', { indent: { left: 300 } }),
    createPara('  3.7. Ứng dụng di động Android (APK) & iOS (TestFlight)', { indent: { left: 300 } }),
    createPara('PHẦN IV: HƯỚNG DẪN SỬ DỤNG APP MẠNG XÃ HỘI DOANH NHÂN VIONE CONNECT', { bold: true }),
    createPara('  4.1. Kích hoạt thẻ danh thiếp thông minh NFC ViOne', { indent: { left: 300 } }),
    createPara('  4.2. Bảng tin B2B Social & Đăng khoảnh khắc doanh nghiệp (ViOne Moments)', { indent: { left: 300 } }),
    createPara('  4.3. Sàn nhu cầu & Giao thương B2B (Marketplace & Báo giá bảo mật)', { indent: { left: 300 } }),
    createPara('  4.4. Mạng lưới quan hệ & Ghép nối đối tác kinh doanh (AI Matching)', { indent: { left: 300 } }),
    createPara('  4.5. Đặt lịch hẹn giao thương 1-on-1 & Bộ nhớ quan hệ đối tác', { indent: { left: 300 } }),
    createPara('PHẦN V: QUY TRÌNH ĐỐI SOÁT THỦ CÔNG & HƯỚNG DẪN XỬ LÝ SỰ CỐ (TROUBLESHOOTING)', { bold: true }),
    createPara('  5.1. Quy trình đối soát và GẠCH NỢ HỘI PHÍ thủ công khi chưa có Webhook', { indent: { left: 300 } }),
    createPara('  5.2. Danh mục mã lỗi và giải pháp khắc phục nhanh', { indent: { left: 300 } }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ────────────────────────────────────────────────────────────────────────────
  // PHẦN I: TỔNG QUAN KIẾN TRÚC & ĐÁNH GIÁ TRUNG THỰC KẾT NỐI API BÊN NGOÀI
  // ────────────────────────────────────────────────────────────────────────────
  docElements.push(
    createH1('PHẦN I: TỔNG QUAN KIẾN TRÚC & ĐÁNH GIÁ TRUNG THỰC KẾT NỐI API BÊN NGOÀI'),
    createH2('1.1. Tầm nhìn chiến lược và ranh giới 3 phân hệ độc lập'),
    createPara(
      'Hệ sinh thái ViOne được thiết kế nhằm mục tiêu số hóa toàn diện công tác quản trị hiệp hội doanh nghiệp, chuyển đổi từ mô hình quản lý thủ công rời rạc (Excel, Zalo, sổ sách giấy) sang nền tảng số tập trung. Hệ sinh thái được phân chia thành 3 phân hệ độc lập, rõ ràng theo đúng chức năng và đối tượng sử dụng:'
    ),
    createPara('1. Hệ Thống CRM Quản Trị (CRM Admin Portal): Chuyên dụng cho Ban Chấp Hành, Ban Thư ký và Ban Tài chính kế toán hiệp hội. Chịu trách nhiệm thẩm định hội viên, phát hành hóa đơn, quản lý điểm danh vé QR sự kiện, quản lý thu chi và lập báo cáo tài chính minh bạch.', { indent: { left: 300 } }),
    createPara('2. App Hiệp Hội (CLB Doanh Nhân CEO 1983 - Association App): Ứng dụng di động dành riêng cho hội viên chính thức của hiệp hội. Giúp hội viên tra cứu danh bạ, xuất trình thẻ hội viên 3D, nhận vé QR vào cửa sự kiện, NỘP HỘI PHÍ qua VietQR và nhận thông báo từ Ban Chấp Hành.', { indent: { left: 300 } }),
    createPara('3. App Mạng Xã Hội Giao Thương ViOne Connect (ViOne App): Mạng xã hội B2B liên hiệp hội dành cho cộng đồng doanh nhân cả nước. Cho phép chia sẻ khoảnh khắc kinh doanh, kích hoạt danh thiếp thông minh NFC, đăng tin sàn nhu cầu mua sắm B2B và đặt lịch hẹn kết nối 1-on-1.', { indent: { left: 300 } }),

    createH2('1.2. Bảng kiểm toán trung thực hiện trạng các API bên thứ 3 (External APIs)'),
    ...createCallout(
      'NGUYÊN TẮC MINH BẠCH KỸ THUẬT',
      'Để đảm bảo tính trung thực tuyệt đối trong báo cáo tiến độ và hướng dẫn sử dụng, toàn bộ các tính năng phụ thuộc vào dịch vụ bên thứ 3 (ngân hàng, Google, Apple, viễn thông, Zoom) phải được nêu rõ tình trạng: Tính năng nào đã hoàn thiện nội bộ, tính năng nào CHƯA kết nối API ngoài để người vận hành nắm rõ quy trình xử lý thực tế.',
      true
    ),
    createTable(
      ['STT', 'Dịch Vụ API Bên Ngoài', 'Phân Hệ Sử Dụng', 'Hiện Trạng Kỹ Thuật Thực Tế', 'Tình Trạng Luồng'],
      [
        ['1', 'Open API Ngân Hàng & Webhook Số Dư', 'CRM + App Hiệp Hội', 'Đã có mã VietQR động hiển thị STK, số tiền và cú pháp. CHƯA liên kết Open API ngân hàng, CHƯA có Webhook đối soát gạch nợ tự động.', 'CHƯA THÔNG (Cần duyệt tay)'],
        ['2', 'Đăng Nhập Google (Google OAuth 2.0)', 'App Hiệp Hội + ViOne', 'Đã có nút bấm giao diện. CHƯA cấu hình OAuth Client ID trên Google Cloud Console production.', 'CHƯA THÔNG (Dùng SĐT/Email)'],
        ['3', 'Đăng Nhập Apple (Sign in with Apple)', 'App Hiệp Hội + ViOne', 'Đã có nút bấm giao diện iOS. CHƯA cấu hình Apple Developer Services ID.', 'CHƯA THÔNG (Dùng SĐT/Email)'],
        ['4', 'Cuộc Họp Trực Tuyến (Zoom / Meet API)', 'CRM + ViOne Connect', 'Mới có form đăng ký lịch phòng họp nội bộ lưu vào CSDL. CHƯA tích hợp API tạo phòng họp video trực tuyến.', 'CHƯA THÔNG (Form nội bộ)'],
        ['5', 'Tổng Đài Gửi SMS OTP Viễn Thông', 'App Hiệp Hội + ViOne', 'Đang dùng mã OTP kiểm thử nội bộ (bypass/dev). CHƯA liên kết tổng đài SMS Brandname viễn thông.', 'CHƯA THÔNG (Dùng OTP test)'],
        ['6', 'Bản Đồ Google Maps Platform API', 'CRM + App Hiệp Hội', 'Đang nhúng iframe bản đồ mẫu, CHƯA có Google Maps Platform API SDK Key chính thức.', 'CHƯA THÔNG (Dùng iframe)'],
        ['7', 'Thông Báo Đẩy Sản Xuất (Push APNs/FCM)', 'App Hiệp Hội + ViOne', 'Đã tích hợp SDK FCM. Bản iOS chưa upload chứng chỉ APNs Auth Key (.p8) lên Apple Developer.', 'CHƯA THÔNG (Đang test dev)'],
      ],
      [6, 25, 20, 34, 15]
    ),

    createH2('1.3. Cấu hình định tuyến (URL Routing) & Tài khoản đăng nhập'),
    createTable(
      ['Phân Hệ', 'Địa Chỉ Truy Cập (URL Route)', 'Đối Tượng Phục Vụ', 'Phương Thức Đăng Nhập Thực Tế'],
      [
        ['Hệ Thống CRM Quản Trị', 'http://14.225.217.232:5000/ hoặc /platform', 'BCH, Thư ký, Kế toán', 'Tài khoản Quản trị: admin@vione.vn / Mật khẩu'],
        ['App Hiệp Hội (CEO 1983)', 'http://14.225.217.232:5000/association', 'Hội viên CLB CEO 1983', 'Đăng nhập tại /auth/mobile/ bằng SĐT/Email + MK'],
        ['App ViOne Connect', 'http://14.225.217.232:5000/connect-app', 'Doanh nhân B2B toàn quốc', 'Đăng ký tại /auth hoặc chạm thẻ danh thiếp NFC'],
      ],
      [22, 28, 24, 26]
    ),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ────────────────────────────────────────────────────────────────────────────
  // PHẦN II: HƯỚNG DẪN VẬN HÀNH HỆ THỐNG CRM QUẢN TRỊ (CRM ADMIN PORTAL)
  // ────────────────────────────────────────────────────────────────────────────
  docElements.push(
    createH1('PHẦN II: HƯỚNG DẪN VẬN HÀNH HỆ THỐNG CRM QUẢN TRỊ (CRM ADMIN PORTAL)'),
    createH2('2.1. Phân hệ Quản lý Hội viên & Ban Chấp Hành'),
    createPara('Phân hệ Hội viên (/members) là trái tim vận hành của Ban Thư ký, cung cấp đầy đủ các công cụ quản lý vòng đời hội viên từ khi tiếp nhận hồ sơ đến khi phê duyệt chính thức:'),
    createPara('• Tiếp nhận hồ sơ gia nhập (/members?status=pending): Khi cá nhân/doanh nghiệp nộp đơn đăng ký trên cổng thông tin, hồ sơ tự động hiển thị trong tab "Chờ duyệt". Hệ thống tự động kiểm tra tính hợp lệ của số CCCD/Hộ chiếu và cảnh báo nếu phát hiện trùng lặp Mã số thuế doanh nghiệp.', { indent: { left: 300 } }),
    createPara('• Quy trình thẩm định 2 cấp (/members/:id/review): Cấp 1 (Ban Thư ký) rà soát tính đầy đủ của hồ sơ, đối chiếu giấy phép kinh doanh -> Bấm "Đề xuất phê duyệt". Cấp 2 (Ban Thường trực / Phó Chủ tịch) bấm "Ký duyệt chính thức".', { indent: { left: 300 } }),
    createPara('• Cấp mã hội viên độc bản (/members/:id/approve): Sau khi được duyệt, hệ thống tự động sinh mã hội viên chuẩn (Ví dụ: M1983-001, M1983-002), cấp thẻ hội viên số và kích hoạt trạng thái Hoạt động (Active).', { indent: { left: 300 } }),
    createPara('• Bổ nhiệm chức danh Ban Chấp Hành (/members/:id/board): Gán vai trò trong hiệp hội (Chủ tịch, Phó Chủ tịch thường trực, Trưởng Ban Kiểm tra, Trưởng Ban Xúc tiến thương mại). Khi gán chức danh, tài khoản được cấp thêm quyền quản trị tương ứng trên CRM.', { indent: { left: 300 } }),
    createPara('• Xuất danh bạ đại biểu (Excel): Phục vụ việc in Kỷ yếu Đại hội hoặc danh bạ hội viên thường niên, xuất đầy đủ họ tên, doanh nghiệp, chức vụ, số điện thoại và ảnh đại diện.', { indent: { left: 300 } }),

    createH2('2.2. Phân hệ Quản lý Doanh nghiệp Thành viên'),
    createPara('Phân hệ Doanh nghiệp (/companies) quản lý hồ sơ năng lực 360 độ của các công ty hội viên:'),
    createPara('• Thông tin pháp lý: Mã số thuế, ngày thành lập, vốn điều lệ, đại diện pháp luật, địa chỉ trụ sở chính và chi nhánh.', { indent: { left: 300 } }),
    createPara('• Danh mục sản phẩm - dịch vụ tiêu biểu: Doanh nghiệp đăng tải hình ảnh sản phẩm, năng lực sản xuất, quy chuẩn chất lượng (ISO, HACCP, OCOP).', { indent: { left: 300 } }),
    createPara('• Xác thực doanh nghiệp uy tín (Verified Badge): Ban Thư ký kiểm tra thực tế giấy phép và gắn tích xanh xác thực uy tín trên sàn giao thương.', { indent: { left: 300 } }),

    createH2('2.3. Phân hệ Tài chính, Hội phí, Thu chi & Quy trình gạch nợ thủ công'),
    ...createCallout(
      'QUY TRÌNH ĐỐI SOÁT HỘI PHÍ THỦ CÔNG (BẮT BUỘC NẮM RÕ)',
      'DO HIỆN TẠI CHƯA KẾT NỐI OPEN API NGÂN HÀNG VÀ CHƯA CÓ WEBHOOK TỰ ĐỘNG GẠCH NỢ: Khi hội viên chuyển khoản qua mã VietQR, tiền sẽ vào tài khoản ngân hàng của hiệp hội nhưng hệ thống CRM CHƯA THỂ tự động gạch nợ. Ban Kế toán BẮT BUỘC phải thực hiện quy trình kiểm tra sao kê ngân hàng và bấm duyệt gạch nợ bằng tay theo hướng dẫn chi tiết dưới đây.',
      true
    ),
    createPara('Quy trình vận hành hội phí chuẩn xác:'),
    createPara('Bước 1: Lập kế hoạch THU HỘI PHÍ (/fees/generate-annual): Đầu mỗi niên độ, kế toán bấm "Tạo kỳ thu mới", chọn mức phí theo hạng (Kim Cương 20 triệu, Vàng 10 triệu, Bạc 5 triệu). Hệ thống tự sinh công nợ cho toàn thể hội viên.', { indent: { left: 300 } }),
    createPara('Bước 2: Hội viên quét mã VietQR trên App: Trên màn hình hội viên sẽ xuất hiện mã VietQR chuẩn chứa sẵn STK ngân hàng, số tiền và cú pháp chuyển khoản (Ví dụ: "NL2026 M1983001 NGUYEN VAN A").', { indent: { left: 300 } }),
    createPara('Bước 3: Đối soát sao kê & Gạch nợ thủ công (/fees): Kế toán đăng nhập Internet Banking của hiệp hội, tra cứu danh sách tiền về -> Đối chiếu cú pháp chuyển khoản -> Tìm hóa đơn tương ứng trên CRM -> Bấm nút "Xác nhận đã thanh toán" (Confirm Payment).', { indent: { left: 300 } }),
    createPara('Bước 4: Tự động gia hạn thẻ (+1 năm): Ngay khi kế toán bấm xác nhận, hệ thống tự động cộng thêm 365 ngày vào ngày hết hạn thẻ của hội viên (term_end), đồng thời ghi vết kiểm toán vào bảng platform/renewal-audit.', { indent: { left: 300 } }),
    createPara('Bước 5: Quản lý Thu - Chi ngoài hội phí (/income, /expenses): Ghi nhận thu tài trợ sự kiện, thu tiền mặt tại chỗ; ghi nhận chi phí thuê hội trường, tiệc gala, quà tặng và quản lý phiếu tạm ứng/hoàn ứng của ban tổ chức.', { indent: { left: 300 } }),

    createH2('2.4. Phân hệ Sự kiện, Sơ đồ bàn tiệc VIP & Quét vé QR điểm danh'),
    createPara('Phân hệ Sự kiện (/events) giải quyết bài toán đón tiếp hàng trăm đại biểu trong các sự kiện lớn:'),
    createPara('• Tạo sự kiện & Cấu hình sơ đồ bàn tiệc: Thiết lập Grand Ballroom, cấu hình danh sách bàn VIP (Bàn Chủ tịch, Bàn Nhà tài trợ Kim Cương, Bàn Khách mời cơ quan ban ngành). Gán chính xác từng đại biểu vào từng số ghế.', { indent: { left: 300 } }),
    createPara('• Phát hành vé QR độc bản: Mỗi đại biểu được cấp một mã vé QR riêng biệt trên app điện thoại có ghi rõ: Tên sự kiện, Họ tên, Bàn số, Ghế số.', { indent: { left: 300 } }),
    createPara('• Camera quét vé QR tốc độ cao (/checkin): Ban lễ tân dùng điện thoại hoặc máy tính bảng mở camera tại cổng đón tiếp. Khi đại biểu đưa mã vé trước camera, hệ thống nhận diện trong 0.5 giây, phát âm thanh chào mừng và hiển thị vị trí bàn tiệc trên màn hình.', { indent: { left: 300 } }),

    createH2('2.5. Phân hệ Bầu cử số hóa & Biểu quyết nghị quyết'),
    createPara('Phân hệ Bầu cử (/voting) phục vụ Đại hội nhiệm kỳ:'),
    createPara('• Tạo danh sách ứng viên Ban Chấp Hành kèm tóm tắt tiểu sử và chương trình hành động.', { indent: { left: 300 } }),
    createPara('• Xác minh cử tri: Chỉ những đại biểu có trạng thái Active và đã hoàn thành hội phí mới được cấp quyền bỏ phiếu.', { indent: { left: 300 } }),
    createPara('• Hòm phiếu điện tử bí mật: Phiếu bầu được mã hóa, đảm bảo tính ẩn danh 100%.', { indent: { left: 300 } }),
    createPara('• Kiểm phiếu tự động: Sau khi kết thúc thời gian bỏ phiếu, ban kiểm phiếu bấm "Khóa hòm phiếu", hệ thống tính toán kết quả và xuất biên bản bầu cử chuẩn xác.', { indent: { left: 300 } }),

    createH2('2.6. Phân hệ Đặt phòng họp nội bộ'),
    ...createCallout(
      'LƯU Ý VỀ TÍNH NĂNG PHÒNG HỌP',
      'Hiện tại phân hệ /meetings chỉ quản lý việc đăng ký, điều phối và duyệt lịch phòng họp nội bộ tại trụ sở văn phòng hiệp hội. CHƯA TÍCH HỢP API GỌI VIDEO TRỰC TUYẾN NGOÀI (như Zoom SDK hoặc Google Meet API). Do đó, nếu tổ chức họp trực tuyến, Ban Thư ký cần tạo link Zoom/Meet thủ công bên ngoài và dán vào phần ghi chú cuộc họp.',
      true
    ),
    createPara('• Ban Chấp Hành chọn ngày giờ họp, phòng họp (Phòng họp lớn, Phòng họp Ban Thường trực), đính kèm file chương trình họp PDF.', { indent: { left: 300 } }),
    createPara('• Thư ký duyệt lịch họp để tránh trùng phòng.', { indent: { left: 300 } }),

    createH2('2.7. Phân hệ Truyền thông, Email Marketing & Quản trị nền tảng'),
    createPara('• Gửi email thông báo hàng loạt (/email-marketing): Gửi giấy mời họp BCH, thư chúc mừng sinh nhật hội viên, thông báo NỘP HỘI PHÍ qua máy chủ SMTP.', { indent: { left: 300 } }),
    createPara('• Quản trị phân quyền RBAC (/platform/admins): Thiết lập quyền hạn chặt chẽ theo vai trò: Super Admin, Thư ký hiệp hội, Kế toán trưởng, Ban Kiểm tra.', { indent: { left: 300 } }),
    createPara('• Nhật ký kiểm toán bất biến (/platform/audit): Lưu trữ mọi hành vi tạo, sửa, xóa, duyệt của quản trị viên kèm thời gian, IP và dữ liệu thay đổi.', { indent: { left: 300 } }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ────────────────────────────────────────────────────────────────────────────
  // PHẦN III: HƯỚNG DẪN SỬ DỤNG APP HIỆP HỘI (CEO 1983 - ASSOCIATION APP)
  // ────────────────────────────────────────────────────────────────────────────
  docElements.push(
    createH1('PHẦN III: HƯỚNG DẪN SỬ DỤNG APP HIỆP HỘI (CLB DOANH NHÂN CEO 1983)'),
    createH2('3.1. Cổng đăng nhập Mobile & Hiện trạng đăng nhập bên ngoài'),
    ...createCallout(
      'PHƯƠNG THỨC ĐĂNG NHẬP THỰC TẾ TRÊN APP HIỆP HỘI',
      'Trên giao diện App Hiệp hội có hiển thị nút Đăng nhập bằng Google và Apple, tuy nhiên hiện tại các API này CHƯA ĐƯỢC LIÊN KẾT trên Google Cloud Console và Apple Developer. Hội viên vui lòng đăng nhập bằng SỐ ĐIỆN THOẠI / EMAIL và MẬT KHẨU hoặc dùng mã OTP thử nghiệm nội bộ.',
      true
    ),
    createPara('Hướng dẫn đăng nhập tài khoản hội viên:'),
    createPara('1. Truy cập đường dẫn: http://14.225.217.232:5000/auth/mobile/ (hoặc mở ứng dụng CEO 1983 trên điện thoại).', { indent: { left: 300 } }),
    createPara('2. Nhập Số điện thoại hoặc Email đã đăng ký với Ban Thư ký.', { indent: { left: 300 } }),
    createPara('3. Nhập mật khẩu được cấp hoặc chọn xác thực qua mã OTP.', { indent: { left: 300 } }),
    createPara('4. Sau khi đăng nhập thành công, hệ thống tự động lưu phiên làm việc an toàn.', { indent: { left: 300 } }),

    createH2('3.2. Thẻ hội viên kỹ thuật số 3D & Chia sẻ danh thiếp số vCard'),
    createPara('Thẻ hội viên (/association/card) là chứng chỉ số xác thực tư cách hội viên:'),
    createPara('• Giao diện thẻ 3D sang trọng: Hiển thị logo CLB CEO 1983, họ tên hội viên, chức danh doanh nghiệp, mã hội viên (M1983-xxx) và ngày hết hạn thẻ.', { indent: { left: 300 } }),
    createPara('• Tùy chỉnh theme thẻ: Hội viên có thể chuyển đổi linh hoạt giữa giao diện Obsidian Luxury (đen mun sang trọng) và Royal Blue (xanh ngoại giao).', { indent: { left: 300 } }),
    createPara('• Chia sẻ vCard thông minh (/association/business-cards): Bấm "Lưu vào danh bạ", điện thoại sẽ tải file chuẩn vCard (.vcf) giúp đối tác lưu đầy đủ họ tên, số điện thoại, email, địa chỉ công ty chỉ với 1 thao tác.', { indent: { left: 300 } }),

    createH2('3.3. Tra cứu Danh bạ hội viên & Đăng ký sự kiện'),
    createPara('• Tra cứu danh bạ (/association/members): Tìm kiếm đối tác theo lĩnh vực kinh doanh (Bất động sản, Xây dựng, Tài chính, Công nghệ...). Bấm trực tiếp vào số điện thoại để gọi hoặc bấm vào email để gửi thư ngỏ hợp tác.', { indent: { left: 300 } }),
    createPara('• Đăng ký vé sự kiện (/association/events): Xem lịch Đại hội, Hội nghị xúc tiến, Gala tiệc tối. Bấm "Đăng ký tham dự", hệ thống sẽ sinh ngay vé mời điện tử kèm vị trí bàn tiệc VIP.', { indent: { left: 300 } }),
    createPara('• Xuất trình vé QR tại sự kiện (/association/checkin): Khi tới sảnh hội nghị, hội viên mở vé QR trên app giơ trước camera của ban tổ chức để hoàn tất thủ tục đón tiếp.', { indent: { left: 300 } }),

    createH2('3.4. NỘP HỘI PHÍ qua mã VietQR trên ứng dụng'),
    ...createCallout(
      'HƯỚNG DẪN HỘI VIÊN NỘP HỘI PHÍ VÀ XÁC NHẬN',
      'Khi thanh toán hội phí qua app, hội viên quét mã VietQR và thực hiện chuyển khoản bình thường. DO HỆ THỐNG ĐANG CHỜ KẾT NỐI API NGÂN HÀNG, thẻ sẽ không gia hạn tức thì ngay trong giây lát mà cần Ban Kế toán đối soát sao kê (thường trong vòng 1-2 giờ làm việc). Hội viên có thể tải ảnh chụp chuyển khoản vào app để kế toán duyệt nhanh hơn.',
      false
    ),
    createPara('Các bước nộp phí trên app:'),
    createPara('1. Vào mục "Gia hạn hội viên" (/association/renew).', { indent: { left: 300 } }),
    createPara('2. Xem thông tin HÓA ĐƠN HỘI PHÍ của kỳ mới và bấm "Thanh toán ngay".', { indent: { left: 300 } }),
    createPara('3. Màn hình hiển thị mã VietQR chứa chính xác số tiền và cú pháp chuyển khoản.', { indent: { left: 300 } }),
    createPara('4. Mở app ngân hàng bất kỳ (Vietcombank, Techcombank, MB, BIDV...) quét mã QR và xác nhận chuyển tiền.', { indent: { left: 300 } }),
    createPara('5. Chụp lại màn hình giao dịch thành công và chờ Ban Kế toán phê duyệt gạch nợ.', { indent: { left: 300 } }),

    createH2('3.5. Ứng dụng di động Native App (Android APK & iOS TestFlight)'),
    createPara('Ứng dụng di động CLB CEO 1983 đã được đóng gói chuẩn Native Wrapper:'),
    createPara('• Android: File cài đặt trực tiếp CEO1983-v1.0-debug.apk (dung lượng siêu nhẹ ~4.12 MB), cài đặt nhanh chóng trên mọi dòng máy Android không cần thông qua Google Play.', { indent: { left: 300 } }),
    createPara('• iOS (iPhone/iPad): Đã cấu hình và sẵn sàng biên dịch IPA qua nền tảng Expo EAS để đưa lên Apple TestFlight.', { indent: { left: 300 } }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ────────────────────────────────────────────────────────────────────────────
  // PHẦN IV: HƯỚNG DẪN SỬ DỤNG APP MẠNG XÃ HỘI VIONE CONNECT (APP VIONE)
  // ────────────────────────────────────────────────────────────────────────────
  docElements.push(
    createH1('PHẦN IV: HƯỚNG DẪN SỬ DỤNG APP MẠNG XÃ HỘI DOANH NHÂN VIONE CONNECT'),
    createH2('4.1. Kích hoạt thẻ danh thiếp thông minh NFC ViOne'),
    createPara('Thẻ thông minh ViOne Connect tích hợp chip NFC giúp doanh nhân chia sẻ thông tin chuyên nghiệp:'),
    createPara('1. Mở tính năng "Kích hoạt thẻ" tại đường dẫn: /connect-app/activate.', { indent: { left: 300 } }),
    createPara('2. Chạm thẻ vật lý ViOne vào vùng đọc NFC ở mặt lưng điện thoại (với iPhone chạm ở cạnh trên, với Android chạm ở giữa mặt lưng).', { indent: { left: 300 } }),
    createPara('3. Hệ thống nhận diện mã chip và liên kết thẻ với hồ sơ doanh nhân của người dùng.', { indent: { left: 300 } }),
    createPara('4. Khi đi gặp đối tác, chỉ cần chạm thẻ vào điện thoại đối tác, toàn bộ thông tin doanh nghiệp, catalogue và số điện thoại sẽ mở ngay tức thì.', { indent: { left: 300 } }),

    createH2('4.2. Bảng tin B2B Social & Đăng khoảnh khắc doanh nghiệp (ViOne Moments)'),
    createPara('Mạng xã hội B2B (/connect-app/moment) tập trung 100% vào hoạt động kinh doanh:'),
    createPara('• Đăng tải bài viết: Giới thiệu dây chuyền sản xuất mới, lễ ký kết hợp tác, nhu cầu tìm đại lý phân phối.', { indent: { left: 300 } }),
    createPara('• Tương tác B2B độc quyền: Thay vì các nút like thông thường, hệ thống cung cấp các nút tương tác kinh doanh: "Bắt tay hợp tác", "Chúc mừng thành công", "Quan tâm sản phẩm".', { indent: { left: 300 } }),

    createH2('4.3. Sàn nhu cầu & Giao thương B2B (Marketplace)'),
    createPara('Sàn giao dịch B2B (/marketplace) giúp doanh nghiệp tối ưu chi phí thu mua:'),
    createPara('• Đăng tin tìm kiếm nhà cung cấp: Doanh nghiệp đăng nhu cầu thu mua nguyên vật liệu kèm thông số kỹ thuật, số lượng và ngân sách dự kiến.', { indent: { left: 300 } }),
    createPara('• Gửi báo giá bảo mật (/marketplace/my-quotes): Các nhà cung ứng nộp báo giá cạnh tranh. Báo giá được bảo mật tuyệt đối, chỉ doanh nghiệp đăng bài mới xem được.', { indent: { left: 300 } }),

    createH2('4.4. Mạng lưới quan hệ & Lịch hẹn giao thương 1-on-1'),
    ...createCallout(
      'LƯU Ý VỀ TÍNH NĂNG LỊCH HẸN B2B',
      'Tính năng đặt lịch hẹn 1-on-1 (/connect-app/meetings) hiện tại quản lý và lưu trữ lịch hẹn trực tiếp trong hệ thống ViOne. CHƯA TỰ ĐỘNG ĐỒNG BỘ SANG GOOGLE CALENDAR HOẶC APPLE CALENDAR và CHƯA CÓ PHÒNG HỌP VIDEO TRỰC TUYẾN TỰ ĐỘNG (Zoom API). Doanh nhân sau khi chốt lịch trên app có thể chủ động thêm vào lịch cá nhân.',
      true
    ),
    createPara('• Tìm kiếm đối tác theo ngành nghề và vị trí địa lý.', { indent: { left: 300 } }),
    createPara('• Gửi lời mời hẹn cafe kết nối: Chọn thời gian, gợi ý địa điểm gặp gỡ.', { indent: { left: 300 } }),
    createPara('• Bộ nhớ quan hệ đối tác (/business-connect/memory): Ghi chú sở thích, nhu cầu hợp tác và kết quả sau cuộc gặp để phục vụ việc chăm sóc quan hệ lâu dài.', { indent: { left: 300 } }),

    createH2('4.5. Ứng dụng di động ViOne Connect (Đã submit TestFlight Build 4)'),
    createPara('• Android: File APK ViOne-Connect-v1.0-debug.apk (4.12 MB) chạy trực tiếp trên thiết bị Android.', { indent: { left: 300 } }),
    createPara('• iOS: Đã biên dịch IPA và submit thành công lên Apple TestFlight (Build 4, Version 1.0, Bundle ID: vn.vione.connect). Đã gán vào nhóm tester VIONE_TEST sẵn sàng cho người dùng cài đặt trải nghiệm.', { indent: { left: 300 } }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ────────────────────────────────────────────────────────────────────────────
  // PHẦN V: QUY TRÌNH ĐỐI SOÁT THỦ CÔNG & HƯỚNG DẪN XỬ LÝ SỰ CỐ
  // ────────────────────────────────────────────────────────────────────────────
  docElements.push(
    createH1('PHẦN V: QUY TRÌNH ĐỐI SOÁT THỦ CÔNG & HƯỚNG DẪN XỬ LÝ SỰ CỐ'),
    createH2('5.1. Quy trình đối soát và GẠCH NỢ HỘI PHÍ thủ công khi chưa có Webhook'),
    createPara(
      'Để đảm bảo dữ liệu tài chính không bị thất thoát trong giai đoạn chưa kết nối Open API ngân hàng, Ban Kế toán và Ban Thư ký cần tuân thủ nghiêm ngặt quy trình 4 bước sau:'
    ),
    createTable(
      ['Bước', 'Hành Động Cụ Thể', 'Người Chịu Trách Nhiệm', 'Công Cụ Thực Hiện'],
      [
        ['Bước 1', 'Hội viên thực hiện quét mã VietQR trên app và gửi ảnh chụp ủy nhiệm chi / giao dịch thành công cho thư ký.', 'Hội viên', 'App Hội Viên CEO 1983'],
        ['Bước 2', 'Kế toán đăng nhập tài khoản ngân hàng hiệp hội, kiểm tra số tiền và nội dung chuyển khoản có khớp với mã hóa đơn hay không.', 'Kế toán trưởng', 'Internet Banking'],
        ['Bước 3', 'Truy cập CRM mục Quản lý Tài chính -> Danh sách hóa đơn -> Tìm mã hóa đơn tương ứng -> Bấm nút "Xác nhận thanh toán thủ công".', 'Kế toán trưởng', 'Web CRM /fees'],
        ['Bước 4', 'Kiểm tra trạng thái hóa đơn chuyển sang "PAID", ngày hết hạn thẻ của hội viên tự động tăng thêm 1 năm và kiểm tra nhật ký gia hạn.', 'Thư ký & Kế toán', 'Web CRM /platform/renewal-audit'],
      ],
      [12, 48, 20, 20]
    ),

    createH2('5.2. Bảng xử lý các tình huống sự cố thường gặp (Troubleshooting)'),
    createTable(
      ['Hiện Tượng Sự Cố', 'Nguyên Nhân Kỹ Thuật', 'Biện Pháp Xử Lý Ngay'],
      [
        ['Quét mã VietQR chuyển tiền rồi nhưng app vẫn báo chưa gia hạn thẻ', 'Do hệ thống chưa có Webhook ngân hàng tự động gạch nợ.', 'Kế toán vào CRM mục /fees tìm hóa đơn và bấm nút duyệt bằng tay. Thẻ sẽ tự gia hạn ngay.'],
        ['Bấm nút Đăng nhập bằng Google / Apple báo lỗi hoặc không phản hồi', 'Do Google OAuth Client ID & Apple Services ID chưa cấu hình ngoài.', 'Sử dụng phương thức đăng nhập bằng Số điện thoại/Email và Mật khẩu hoặc OTP dev.'],
        ['Bấm nút mở phòng họp trực tuyến không thấy mở link Zoom/Meet', 'Do chưa tích hợp API gọi video trực tuyến bên thứ 3.', 'Tạo link phòng họp Zoom/Meet thủ công và dán vào ghi chú cuộc họp gửi cho người tham gia.'],
        ['Không nhận được tin nhắn SMS mã OTP trên điện thoại', 'Do chưa kết nối tổng đài viễn thông SMS Brandname.', 'Nhập mã OTP thử nghiệm nội bộ (hoặc liên hệ admin hỗ trợ cấp quyền truy cập).'],
        ['Camera quét mã vé QR tại sự kiện báo lỗi không mở được', 'Do trình duyệt chưa được cấp quyền truy cập Camera thiết bị.', 'Vào Cài đặt trình duyệt (Chrome/Safari) -> Cấp quyền "Cho phép truy cập Máy ảnh" và tải lại trang.'],
        ['App trên điện thoại không thấy cập nhật giao diện mới nhất', 'Do điện thoại đang lưu cache phiên bản cũ của WebView.', 'Vuốt mạnh từ mép trên xuống để làm mới (Pull-to-refresh) hoặc đóng hẳn app và mở lại.'],
      ],
      [28, 32, 40]
    ),

    createH2('5.3. Cam kết đồng hành và thông tin liên hệ hỗ trợ kỹ thuật'),
    createPara('Mọi yêu cầu hỗ trợ kỹ thuật, tích hợp thêm cổng thanh toán hoặc cấu hình API bên thứ 3, vui lòng liên hệ:'),
    createPara('• Người thực hiện nâng cấp: PHẠM VĂN VŨ', { indent: { left: 300 }, bold: true }),
    createPara('• Ngày bắt đầu nâng cấp hệ thống: 11/09/2026', { indent: { left: 300 } }),
    createPara('• Nền tảng máy chủ vận hành: Máy chủ Linux Ubuntu 22.04 LTS (Địa chỉ IP: 14.225.217.232)', { indent: { left: 300 } }),
    createPara('• Ứng dụng di động: Android APK (Biên dịch nội bộ) · iOS TestFlight (Build 4 - Đang hoạt động)', { indent: { left: 300 } })
  );

  // Document Construction
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT_FAMILY,
            size: BODY_SIZE,
            color: '1E293B',
          },
          paragraph: {
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 276, before: 80, after: 80 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,    // 1 inch (2.54 cm)
              bottom: 1440, // 1 inch
              left: 1440,   // 1 inch
              right: 1440,  // 1 inch
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: 'HỆ SINH THÁI VIONE — TÀI LIỆU HƯỚNG DẪN SỬ DỤNG VÀ VẬN HÀNH HỆ THỐNG',
                    font: FONT_FAMILY,
                    size: 18, // 9pt
                    color: '64748B',
                    italics: true,
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
                alignment: AlignmentType.BOTH,
                spacing: { before: 120 },
                children: [
                  new TextRun({
                    text: 'Người thực hiện: Phạm Văn Vũ | Ngày bắt đầu: 11/09/2026',
                    font: FONT_FAMILY,
                    size: 18,
                    color: '64748B',
                  }),
                  new TextRun({
                    text: '\t\tTrang ',
                    font: FONT_FAMILY,
                    size: 18,
                    color: '64748B',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: FONT_FAMILY,
                    size: 18,
                    bold: true,
                    color: '0369A1',
                  }),
                  new TextRun({
                    text: ' / ',
                    font: FONT_FAMILY,
                    size: 18,
                    color: '64748B',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: FONT_FAMILY,
                    size: 18,
                    color: '64748B',
                  }),
                ],
              }),
            ],
          }),
        },
        children: docElements,
      },
    ],
  });

  const outPath = path.join(__dirname, '..', 'document', 'tai-lieu-huong-dan-su-dung.docx');
  const tempPath = path.join(__dirname, '..', 'document', 'tai-lieu-huong-dan-su-dung.docx.tmp');

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(tempPath, buffer);
  console.log(`✓ Written temp docx buffer: ${buffer.length} bytes`);

  try {
    if (fs.existsSync(outPath)) {
      fs.unlinkSync(outPath);
    }
    fs.renameSync(tempPath, outPath);
    console.log(`✓ Successfully updated master User Guide Word document: ${outPath}`);
  } catch (err) {
    console.warn(`Note: Could not rename directly (${err.message}), keeping updated version at ${tempPath}`);
    // If locked, try copy
    try {
      fs.copyFileSync(tempPath, outPath);
    } catch (e2) {}
  }
}

generateManual().catch((err) => {
  console.error('Failed to generate docx manual:', err);
  process.exit(1);
});
