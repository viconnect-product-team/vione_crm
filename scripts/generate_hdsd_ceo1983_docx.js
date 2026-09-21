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
} = require('docx');

const FONT_FAMILY = 'Times New Roman';
const NAVY = '003B95';
const GOLD = 'D97706';
const SLATE_DARK = '0F172A';
const SLATE_LIGHT = 'F8FAFC';
const BORDER_COLOR = 'CBD5E1';

const BORDER_THIN = {
  top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
};

function createPara(text, options = {}) {
  return new Paragraph({
    alignment: options.alignment || AlignmentType.LEFT,
    spacing: options.spacing || { before: 80, after: 80, line: 276 },
    children: [
      new TextRun({
        text: text,
        font: FONT_FAMILY,
        size: options.size || 24, // 12pt
        bold: options.bold || false,
        italics: options.italics || false,
        color: options.color || '1E293B',
      }),
    ],
  });
}

function createBullet(text, boldPrefix = '') {
  const children = [];
  if (boldPrefix) {
    children.push(
      new TextRun({
        text: boldPrefix + ' ',
        font: FONT_FAMILY,
        size: 24,
        bold: true,
        color: '0F172A',
      })
    );
  }
  children.push(
    new TextRun({
      text: text,
      font: FONT_FAMILY,
      size: 24,
      color: '334155',
    })
  );

  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 50, after: 50, line: 260 },
    children,
  });
}

function createHeading1(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 120 },
    children: [
      new TextRun({
        text: title,
        font: FONT_FAMILY,
        size: 32, // 16pt
        bold: true,
        color: NAVY,
      }),
    ],
  });
}

function createHeading2(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text: title,
        font: FONT_FAMILY,
        size: 27, // 13.5pt
        bold: true,
        color: GOLD,
      }),
    ],
  });
}

function createCallout(title, body) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              left: { style: BorderStyle.SINGLE, size: 24, color: NAVY },
            },
            shading: { type: ShadingType.CLEAR, fill: 'EFF6FF' },
            margins: { top: 140, bottom: 140, left: 180, right: 180 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 60 },
                children: [
                  new TextRun({
                    text: '📌 ' + title,
                    font: FONT_FAMILY,
                    size: 24,
                    bold: true,
                    color: NAVY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0, line: 260 },
                children: [
                  new TextRun({
                    text: body,
                    font: FONT_FAMILY,
                    size: 22,
                    color: '1E3A8A',
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

function buildDoc() {
  const children = [];

  // Title Banner
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 80 },
      children: [
        new TextRun({
          text: 'TÀI LIỆU HƯỚNG DẪN SỬ DỤNG NỘI BỘ',
          font: FONT_FAMILY,
          size: 36, // 18pt
          bold: true,
          color: NAVY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [
        new TextRun({
          text: 'HỆ SINH THÁI ỨNG DỤNG HIỆP HỘI CLB DOANH NHÂN CEO 1983 & HỆ THỐNG QUẢN TRỊ CRM',
          font: FONT_FAMILY,
          size: 28, // 14pt
          bold: true,
          color: GOLD,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
      children: [
        new TextRun({
          text: 'Phiên bản: v3.0.0 (Bản nâng cấp toàn diện) · Ban Công Nghệ & Chuyển Đổi Số · Tháng 09/2026',
          font: FONT_FAMILY,
          size: 20,
          italics: true,
          color: '64748B',
        }),
      ],
    })
  );

  children.push(
    createCallout(
      'QUY CHUẨN VẬN HÀNH & AN TOÀN THÔNG TIN NỘI BỘ',
      'Tài liệu này được lưu hành nội bộ phục vụ công tác chuyển giao công nghệ, đào tạo Ban Quản trị, Ban Thư ký và hướng dẫn hội viên CLB Doanh Nhân CEO 1983. Mọi dữ liệu tài khoản, phân quyền và khóa bảo mật trong tài liệu đều tuân thủ nghiêm ngặt tiêu chuẩn VIONE Connect Enterprise.'
    )
  );

  // 1. TỔNG QUAN KIẾN TRÚC
  children.push(
    createHeading1('1. TỔNG QUAN KIẾN TRÚC HỆ SINH THÁI & CÁC CỔNG VẬN HÀNH'),
    createPara(
      'Hệ sinh thái ứng dụng được thiết kế theo mô hình Đa phân hệ tách biệt hoàn toàn (Decoupled Micro-Services & Frontends). Ba hệ thống vận hành độc lập, chỉ liên lạc qua các API RESTful bảo mật, đảm bảo khi một hệ thống bảo trì hoặc nâng cấp thì các hệ thống còn lại vẫn hoạt động thông suốt.'
    )
  );

  // Table Architecture
  const archTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: NAVY },
            borders: BORDER_THIN,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [createPara('Phân hệ', { bold: true, color: 'FFFFFF', size: 22 })],
          }),
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: NAVY },
            borders: BORDER_THIN,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [createPara('Cổng Web (FE)', { bold: true, color: 'FFFFFF', size: 22 })],
          }),
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: NAVY },
            borders: BORDER_THIN,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [createPara('Cổng API (BE)', { bold: true, color: 'FFFFFF', size: 22 })],
          }),
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: NAVY },
            borders: BORDER_THIN,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [createPara('Đối tượng & Chức năng chính', { bold: true, color: 'FFFFFF', size: 22 })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: BORDER_THIN,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [createPara('Phân hệ 1: Quản Trị CRM', { bold: true, size: 21 })],
          }),
          new TableCell({
            borders: BORDER_THIN,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [createPara('Port 5004', { size: 21 })],
          }),
          new TableCell({
            borders: BORDER_THIN,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [createPara('Port 5005', { size: 21 })],
          }),
          new TableCell({
            borders: BORDER_THIN,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [createPara('Ban Thư Ký CLB: Duyệt hồ sơ, cấp mã hội viên, quản lý deal, sự kiện', { size: 21 })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: BORDER_THIN,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [createPara('Phân hệ 2: App Hiệp Hội CEO 1983', { bold: true, size: 21 })],
          }),
          new TableCell({
            borders: BORDER_THIN,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [createPara('Port 5002', { size: 21 })],
          }),
          new TableCell({
            borders: BORDER_THIN,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [createPara('Port 5003', { size: 21 })],
          }),
          new TableCell({
            borders: BORDER_THIN,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [createPara('Hội viên chính thức: Thẻ số VIP, Quét QR Camera, Chat, Vé sự kiện, B2B', { size: 21 })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: BORDER_THIN,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [createPara('Phân hệ 3: ViOne Platform', { bold: true, size: 21 })],
          }),
          new TableCell({
            borders: BORDER_THIN,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [createPara('Port 5000', { size: 21 })],
          }),
          new TableCell({
            borders: BORDER_THIN,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [createPara('Port 5001', { size: 21 })],
          }),
          new TableCell({
            borders: BORDER_THIN,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [createPara('Doanh nghiệp & Công chúng: Danh thiếp số mở rộng, giao thương liên hiệp', { size: 21 })],
          }),
        ],
      }),
    ],
  });
  children.push(archTable);

  // 2. TÀI KHOẢN THỰC TẾ
  children.push(
    createHeading1('2. TÀI KHOẢN & THÔNG TIN XÁC THỰC THỰC TẾ TRONG HỆ THỐNG'),
    createPara('Hệ thống đã cấu hình sẵn các tài khoản thực tế trong cơ sở dữ liệu để phục vụ kiểm thử và vận hành:'),
    createHeading2('2.1. Tài khoản Quản trị Cấp Cao (Admin CRM)'),
    createBullet('admin@vione.com', 'Tài khoản đăng nhập (Email):'),
    createBullet('matkhau123', 'Mật khẩu bảo mật:'),
    createBullet('Toàn quyền Quản trị CLB CEO 1983 (System Administrator)', 'Vai trò:'),
    createBullet('Tiếp nhận hồ sơ đăng ký, duyệt cấp thẻ, quản lý doanh số & giá trị deal, tạo sự kiện, mở hòm phiếu biểu quyết.', 'Trách nhiệm:'),
    createHeading2('2.2. Tài khoản Hội viên Mẫu Thực Tế (App Hiệp Hội)'),
    createBullet('member1983@vione.com / matkhau123 (Mã: M1983-007, SĐT: 0901000002) - Lê Hoàng Long, Chủ tịch HĐQT & CEO.', 'Hội viên 1:'),
    createBullet('jame.nguyen@vione.com / matkhau123 (Mã: M1983-001, SĐT: 0901000001) - Jame Nguyễn, Giám đốc Điều hành.', 'Hội viên 2:')
  );

  // 3. QUY TRÌNH 1: ĐĂNG KÝ & PHÊ DUYỆT HỘI VIÊN
  children.push(
    createHeading1('3. QUY TRÌNH 1: ĐĂNG KÝ, PHÊ DUYỆT HỘI VIÊN TỪ LANDING VÀO CRM'),
    createPara('Luồng nghiệp vụ xử lý trọn vẹn từ lúc tiếp nhận hồ sơ doanh nhân đến khi phát hành tài khoản:'),
    createBullet('Doanh nhân vào Landing Page CLB CEO 1983, bấm "Đăng ký gia nhập", điền thông tin doanh nghiệp & cá nhân.', 'Bước 1:'),
    createBullet('Hồ sơ truyền tức thì về CRM, kích hoạt chuông thông báo hồ sơ mới.', 'Bước 2:'),
    createBullet('Admin đăng nhập CRM (admin@vione.com / matkhau123), vào "Hội viên" -> "Hồ sơ chờ phê duyệt".', 'Bước 3:'),
    createBullet('Admin thẩm định thông tin pháp nhân, bấm "Phê duyệt & Phát hành thẻ".', 'Bước 4:'),
    createBullet('CRM tự động sinh Mã hội viên duy nhất (VD: M1983-007), hash mật khẩu và gửi email chúc mừng.', 'Bước 5:'),
    createBullet('Hội viên mở App (/association/login), nhập mã hội viên & mật khẩu để kích hoạt thẻ số.', 'Bước 6:')
  );

  // 4. QUY TRÌNH 2: THẺ SỐ DOANH NHÂN & QUÉT QR CAMERA THỰC TẾ
  children.push(
    createHeading1('4. QUY TRÌNH 2: ĐĂNG NHẬP, THẺ SỐ DOANH NHÂN & QUÉT MÃ QR CAMERA THỰC TẾ'),
    createPara('Ứng dụng tích hợp thẻ hội viên VIP Gold biểu tượng số 8 phong thủy và công nghệ quét camera thực tế đã khắc phục 100% sự cố gián đoạn luồng video:'),
    createBullet('Thẻ VIP dập nổi 3D, tích xanh xác thực, mã QR vCard động và chip truyền dữ liệu trường gần NFC.', 'Thẻ số Doanh nhân:'),
    createBullet('Bấm biểu tượng Camera 📷 tại Header trang chủ hoặc nút "Quét QR kết nối" màu vàng hổ phách trên thẻ.', 'Kích hoạt Camera:'),
    createBullet('Hỗ trợ lật camera trước/sau, bật đèn Flash (Torch) trong hội trường tối, tải ảnh QR từ máy.', 'Tính năng Camera:'),
    createBullet('Khi quét trúng QR đối tác, mở Modal Profile đối tác với đầy đủ logo, doanh nghiệp, hotline, chức danh.', 'Nhận diện đối tác:'),
    createBullet('Bấm nút "Gửi Lời Mời Kết Nối" trực tiếp trên modal để kết bạn và bắt đầu trò chuyện giao thương.', 'Kết nối 1 chạm:')
  );

  // 5. QUY TRÌNH 3: CÀI ĐẶT QUYỀN RIÊNG TƯ
  children.push(
    createHeading1('5. QUY TRÌNH 3: CÀI ĐẶT QUYỀN RIÊNG TƯ & KIỂM SOÁT HIỂN THỊ KHI QUÉT QR'),
    createPara('Hội viên làm chủ hoàn toàn dữ liệu cá nhân khi chia sẻ mã QR tại các sự kiện giao thương:'),
    createBullet('Vào Trang cá nhân (/association/profile) -> Chọn "Quyền riêng tư & Quản lý hiển thị khi quét QR".', 'Vị trí cài đặt:'),
    createBullet('6 công tắc gồm: Số điện thoại/Hotline, Email, Địa chỉ văn phòng, Tên công ty, Họ tên, Ảnh đại diện.', 'Các trường kiểm soát:'),
    createBullet('Nếu ẩn SĐT hoặc Email, người khác quét QR sẽ thấy nhãn "Đã ẩn theo cài đặt riêng tư" thay vì số thật.', 'Cơ chế bảo vệ:'),
    createBullet('Đồng bộ tức thời lên backend (POST /business-cards/settings/me) và lưu cache nội bộ trên máy.', 'Lưu trữ:')
  );

  // 6. QUY TRÌNH 4: ĐĂNG KÝ SỰ KIỆN & VÉ LINH HOẠT
  children.push(
    createHeading1('6. QUY TRÌNH 4: ĐĂNG KÝ SỰ KIỆN, TỰ ĐỘNG ĐIỀN THÔNG TIN & CHỌN SỐ VÉ LINH HOẠT'),
    createPara('Đơn giản hóa thủ tục tham gia Gala Doanh nhân, Diễn đàn kinh tế và các buổi Business Matching:'),
    createBullet('Form mở ra tự động điền 100% họ tên, SĐT, email, doanh nghiệp, chức vụ từ hồ sơ hội viên.', 'Tự động điền:'),
    createBullet('Gõ trực tiếp số vé mong muốn vào ô số, hoặc dùng nút tăng giảm (- / +).', 'Chọn số lượng vé:'),
    createBullet('Phím tắt chọn nhanh tiện lợi: 1 vé, 2 vé, 5 vé, 10 vé chỉ với 1 chạm.', 'Phím tắt nhanh:'),
    createBullet('Tự động nhân số lượng vé, trừ chiết khấu Hội viên VIP CLB CEO 1983, cấp vé QR Check-in ngay.', 'Tính giá thông minh:')
  );

  // 7. QUY TRÌNH 5: CƠ HỘI GIAO THƯƠNG & GIAN HÀNG
  children.push(
    createHeading1('7. QUY TRÌNH 5: CƠ HỘI GIAO THƯƠNG B2B & GIAN HÀNG SẢN PHẨM (GIÁ DEAL CRM & GIÁ VIP)'),
    createHeading2('7.1. Cơ hội giao thương B2B (/association/opportunities)'),
    createBullet('Hiển thị các deal cung cầu, hợp tác phân phối với dải ngân sách rõ ràng.', 'Dải ngân sách deal:'),
    createBullet('Banner "GIÁ TRỊ DEAL (CRM)" thể hiện chính xác số liệu deal được phê duyệt từ CRM.', 'Đồng bộ CRM:'),
    createBullet('Bấm "Nhận cơ hội" hoặc "Liên hệ ngay" để kết nối chủ deal.', 'Tương tác nhanh:'),
    createHeading2('7.2. Gian hàng sản phẩm (/association/products)'),
    createBullet('Hiển thị giá niêm yết ngoài thị trường (chữ nhỏ gạch ngang).', 'Giá thị trường:'),
    createBullet('Nổi bật với vương miện vàng và mức chiết khấu nội bộ 10% - 30% dành riêng cho Hội viên CLB.', 'Giá VIP CEO 1983:'),
    createBullet('Nút "Đặt mua / Báo giá B2B" trao đổi trực tiếp giữa hai lãnh đạo doanh nghiệp.', 'Thương mại B2B:')
  );

  // 8. QUY TRÌNH 6: BIỂU QUYẾT ĐIỆN TỬ
  children.push(
    createHeading1('8. QUY TRÌNH 6: BIỂU QUYẾT ĐIỆN TỬ & KHẢO SÁT THỜI GIAN THỰC'),
    createBullet('Bầu cử Ban Chấp Hành, biểu quyết các nghị quyết thường niên của CLB CEO 1983.', 'Mục đích:'),
    createBullet('Mỗi hội viên chỉ được bỏ phiếu duy nhất 1 lần dựa trên mã định danh bảo mật.', 'Nguyên tắc bảo mật:'),
    createBullet('Biểu đồ tỷ lệ % cập nhật tức thì trên màn hình hội trường đại hội.', 'Thời gian thực:')
  );

  // 9. QUY TRÌNH 7: NHẮN TIN MESSENGER
  children.push(
    createHeading1('9. QUY TRÌNH 7: NHẮN TIN DOANH NHÂN THỜI GIAN THỰC CHUẨN MESSENGER'),
    createBullet('Bong bóng chat xanh cobalt #0084FF (người gửi) và xám #F0F2F5 (đối tác) chuẩn mực.', 'Giao diện:'),
    createBullet('Thả cảm xúc nhanh (Tim, Thích, Cười) ngay trên tin nhắn.', 'Tương tác:'),
    createBullet('Thu hồi tin nhắn lập tức đổi thành nét đứt và đẩy cuộc trò chuyện lên đầu danh sách.', 'Thu hồi (Recall):')
  );

  // 10. QUY TRÌNH 8: TRIỂN KHAI ĐỘC LẬP
  children.push(
    createHeading1('10. QUY TRÌNH 8: VẬN HÀNH & TRIỂN KHAI ĐỘC LẬP 3 PHÂN HỆ (FAST-DEPLOY PIPELINES)'),
    createPara('Triển khai từng phân hệ độc lập qua các lệnh PowerShell chuẩn hóa, không phụ thuộc lẫn nhau:'),
    createBullet('npm run deploy:ceo1983 (Build Docker FE port 5002, BE port 5003).', 'Triển khai App Hiệp Hội:'),
    createBullet('npm run deploy:crm (Build Docker FE port 5004, BE port 5005).', 'Triển khai Hệ Thống CRM:'),
    createBullet('npm run deploy:vione (Build Docker FE port 5000, BE port 5001).', 'Triển khai Nền Tảng ViOne:'),
    createPara('Mọi script đều hỗ trợ cờ -DryRun và -SkipBuild giúp đẩy nhanh tốc độ cập nhật phiên bản chỉ trong vòng 30 giây.')
  );

  // Footer Contact
  children.push(
    createCallout(
      'THÔNG TIN LIÊN HỆ BAN THƯ KÝ CLB DOANH NHÂN CEO 1983',
      'Hotline hỗ trợ hội viên: 0901 000 002 / 1900 8383 | Email: support@vione.com / bientap@ceo1983.vn | Trụ sở: Tầng 8, Tòa nhà CEO 1983 Tower, Hà Nội, Việt Nam.'
    )
  );

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }, // 1 inch
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'CLB DOANH NHÂN CEO 1983 · HỆ THỐNG QUẢN TRỊ CRM & APP HIỆP HỘI',
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
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Trang ',
                    font: FONT_FAMILY,
                    size: 20,
                    color: '64748B',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: FONT_FAMILY,
                    size: 20,
                    color: '64748B',
                  }),
                  new TextRun({
                    text: ' / ',
                    font: FONT_FAMILY,
                    size: 20,
                    color: '64748B',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: FONT_FAMILY,
                    size: 20,
                    color: '64748B',
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
}

async function main() {
  const doc = buildDoc();
  const buffer = await Packer.toBuffer(doc);
  
  const target1 = path.join(__dirname, '..', 'document', 'HUONG_DAN_SU_DUNG_APP_HIEP_HOI_CEO1983.docx');
  const target2 = path.join(__dirname, '..', 'document', 'HDSD_App_Hiep_Hoi_CEO1983.docx');
  
  fs.writeFileSync(target1, buffer);
  console.log('Successfully written:', target1, buffer.length, 'bytes');
  
  fs.writeFileSync(target2, buffer);
  console.log('Successfully written:', target2, buffer.length, 'bytes');
}

main().catch((err) => {
  console.error('Error generating docx:', err);
  process.exit(1);
});
