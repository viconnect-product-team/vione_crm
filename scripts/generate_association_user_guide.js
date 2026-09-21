const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
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
  ImageRun,
} = require('docx');
const { jsPDF } = require('jspdf');

async function main() {
  console.log('=== [1/3] GENERATING OFFICIAL USER MANUAL (DOCX, PDF, MD) ===');

  const docsDir = path.join(__dirname, '..', 'document');
  const publicDocsDir = path.join(__dirname, '..', 'apps', 'vione_app_fe', 'public', 'docs');
  const imagesDir = path.join(publicDocsDir, 'images');

  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  if (!fs.existsSync(publicDocsDir)) fs.mkdirSync(publicDocsDir, { recursive: true });

  // 1. Convert SVGs to PNG for embedding in Word and PDF
  const svgFiles = [
    'demo_auth_card',
    'demo_nfc_card',
    'demo_messenger_chat',
    'demo_directory_b2b',
    'demo_qr_checkin',
    'demo_vietqr_fee',
  ];

  const pngBuffers = {};
  for (const name of svgFiles) {
    const svgPath = path.join(imagesDir, `${name}.svg`);
    const pngPath = path.join(imagesDir, `${name}.png`);
    if (fs.existsSync(svgPath)) {
      const svgBuf = fs.readFileSync(svgPath);
      const pngBuf = await sharp(svgBuf).png().toBuffer();
      fs.writeFileSync(pngPath, pngBuf);
      pngBuffers[name] = pngBuf;
      console.log(`✓ Converted ${name}.svg -> ${name}.png (${pngBuf.length} bytes)`);
    }
  }

  // 2. Build Word Document (.docx)
  console.log('Building DOCX Document...');
  const FONT_FAMILY = 'Times New Roman';
  const NAVY = '0A1A3A';
  const BLUE_HEADER = '0084FF';
  const GOLD = 'D97706';
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

  function createHeading1(title) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 120 },
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
      spacing: { before: 180, after: 80 },
      children: [
        new TextRun({
          text: title,
          font: FONT_FAMILY,
          size: 28, // 14pt
          bold: true,
          color: '0369A1',
        }),
      ],
    });
  }

  function createStep(num, title, desc, tip) {
    const children = [
      new Paragraph({
        spacing: { before: 100, after: 40 },
        children: [
          new TextRun({
            text: `Bước ${num}: ${title}`,
            font: FONT_FAMILY,
            size: 25,
            bold: true,
            color: '0F172A',
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 20, after: 60, line: 260 },
        indent: { left: 360 },
        children: [
          new TextRun({
            text: desc,
            font: FONT_FAMILY,
            size: 23,
            color: '334155',
          }),
        ],
      }),
    ];

    if (tip) {
      children.push(
        new Paragraph({
          spacing: { before: 20, after: 80 },
          indent: { left: 360 },
          children: [
            new TextRun({
              text: `💡 Lưu ý quan trọng: `,
              font: FONT_FAMILY,
              size: 22,
              bold: true,
              color: 'B45309',
            }),
            new TextRun({
              text: tip,
              font: FONT_FAMILY,
              size: 22,
              italics: true,
              color: '92400E',
            }),
          ],
        })
      );
    }
    return children;
  }

  function createImageBlock(buf, caption) {
    if (!buf) return [];
    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 140, after: 60 },
        children: [
          new ImageRun({
            data: buf,
            transformation: {
              width: 520,
              height: 250,
            },
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 20, after: 160 },
        children: [
          new TextRun({
            text: `[Hình minh họa: ${caption}]`,
            font: FONT_FAMILY,
            size: 20,
            italics: true,
            color: '64748B',
          }),
        ],
      }),
    ];
  }

  const docElements = [
    // Cover Banner
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 120 },
      children: [
        new TextRun({
          text: 'CLB DOANH NHÂN CEO 1983 - VIONE ECOSYSTEM',
          font: FONT_FAMILY,
          size: 24,
          bold: true,
          color: GOLD,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 140 },
      children: [
        new TextRun({
          text: 'TÀI LIỆU HƯỚNG DẪN SỬ DỤNG CHI TIẾT',
          font: FONT_FAMILY,
          size: 40,
          bold: true,
          color: NAVY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 400 },
      children: [
        new TextRun({
          text: 'Ứng Dụng Di Động & Cổng Kết Nối Doanh Nhân CEO 1983',
          font: FONT_FAMILY,
          size: 26,
          italics: true,
          color: '475569',
        }),
      ],
    }),

    // Meta Table
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: BORDER_THIN,
              shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
              children: [createPara('Cơ quan chủ quản', { bold: true, size: 22 })],
            }),
            new TableCell({
              borders: BORDER_THIN,
              children: [createPara('CLB Doanh Nhân CEO 1983 (Hiệp Hội Doanh Nghiệp)', { size: 22 })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: BORDER_THIN,
              shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
              children: [createPara('Nền tảng công nghệ', { bold: true, size: 22 })],
            }),
            new TableCell({
              borders: BORDER_THIN,
              children: [createPara('VIONE Connect Suite (PWA / iOS / Android / Web)', { size: 22 })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: BORDER_THIN,
              shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
              children: [createPara('Phiên bản tài liệu', { bold: true, size: 22 })],
            }),
            new TableCell({
              borders: BORDER_THIN,
              children: [createPara('v2.6.0 (Cập nhật tháng 09/2026)', { size: 22, bold: true, color: '0284C7' })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: BORDER_THIN,
              shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
              children: [createPara('Kênh hỗ trợ hội viên', { bold: true, size: 22 })],
            }),
            new TableCell({
              borders: BORDER_THIN,
              children: [createPara('Hotline: 098.333.1983 | Email: btk@ceo1983.vn', { size: 22 })],
            }),
          ],
        }),
      ],
    }),

    new Paragraph({ children: [new PageBreak()] }),

    // MỤC LỤC & TỔNG QUAN
    createHeading1('MỤC LỤC VÀ GIỚI THIỆU TỔNG QUAN HỆ THỐNG'),
    createPara(
      'Ứng dụng Doanh nhân CEO 1983 là cổng thông tin và nền tảng giao thương số dành riêng cho các thành viên chính thức của CLB Doanh nhân CEO 1983. Ứng dụng tích hợp công nghệ Định danh số (Digital ID), Thẻ điện tử thông minh, Chạm thẻ một chạm NFC, Nhắn tin thời gian thực phong cách Messenger, Sàn cơ hội B2B, Check-in sự kiện bằng mã QR bảo mật và Thu hội phí tự động VietQR Napas 247.'
    ),

    // CHƯƠNG 1
    createHeading1('CHƯƠNG 1: ĐĂNG NHẬP, ĐỊNH DANH & THẺ HỘI VIÊN SỐ'),
    createPara(
      'Mỗi hội viên khi gia nhập CLB được Ban Thư Ký cấp một Mã Hội Viên định danh duy nhất (định dạng M1983-xxx) gắn liền với Số điện thoại và Hồ sơ pháp nhân doanh nghiệp.'
    ),
    ...createStep(
      1,
      'Truy cập cổng ứng dụng Doanh nhân',
      'Mở trình duyệt trên điện thoại hoặc máy tính theo đường dẫn https://vione.vn/association/login (hoặc bấm biểu tượng App trên màn hình chính). Nhập Số điện thoại hoặc Mã hội viên cùng mật khẩu được cấp.',
      'Nếu là lần đầu đăng nhập, nhấn "Quên mật khẩu / Kích hoạt lần đầu" để nhận mã OTP SMS qua số điện thoại đã đăng ký với Ban Thư Ký.'
    ),
    ...createStep(
      2,
      'Kích hoạt Thẻ hội viên điện tử VIP',
      'Sau khi đăng nhập thành công, hệ thống hiển thị Thẻ Hội Viên Số Doanh Nhân với dải màu Navy & Gold sang trọng, huy hiệu "Hội viên chính thức" có dấu tích xanh xác thực và mã QR động chứa thông tin liên hệ vCard.',
      'Có thể đổi giao diện thẻ giữa các phong cách: Cổ Điển (Classic Navy), Doanh Nhân (Golden VIP) hoặc Tối Giản (Modern Dark).'
    ),
    ...createStep(
      3,
      'Cài đặt ứng dụng PWA lên màn hình chính',
      'Trên iOS (Safari), bấm nút Chia sẻ (Share) -> chọn "Thêm vào màn hình chính" (Add to Home Screen). Trên Android (Chrome), bấm biểu tượng dấu ba chấm -> chọn "Cài đặt ứng dụng" (Install App).',
      'Ứng dụng sẽ hoạt động mượt mà như app gốc không cần tải qua App Store / Google Play.'
    ),
    ...createImageBlock(pngBuffers['demo_auth_card'], 'Giao diện Đăng nhập & Thẻ Hội viên số VIP CLB CEO 1983'),

    // CHƯƠNG 2
    createHeading1('CHƯƠNG 2: CÔNG NGHỆ CHẠM THẺ NFC TRAO ĐỔI LIÊN HỆ B2B'),
    createPara(
      'Ứng dụng hỗ trợ giao tiếp trường gần NFC (Near Field Communication) chuẩn NTAG213/NTAG215, cho phép doanh nhân chạm trực tiếp mặt lưng điện thoại vào thẻ vật lý hoặc điện thoại đối tác để trao đổi danh thiếp số trong 1 giây.'
    ),
    ...createStep(
      1,
      'Bật tính năng Chạm thẻ NFC trên ứng dụng',
      'Tại tab "Trang cá nhân" hoặc "Thẻ hội viên", bấm nút "Chạm Thẻ NFC" (biểu tượng sóng NFC phát xạ). Cửa sổ popup mô phỏng radar quét NFC sẽ kích hoạt.',
      'Đối với thiết bị Android hỗ trợ Web NFC, trình duyệt sẽ tự động bật bộ thu sóng NFC phần cứng.'
    ),
    ...createStep(
      2,
      'Chạm mặt lưng điện thoại vào thẻ hoặc thiết bị đối tác',
      'Đặt mặt lưng điện thoại sát vào chip NFC của thẻ doanh nhân CEO 1983. Hệ thống sẽ lập tức truyền tải đường dẫn định danh bảo mật vCard sang thiết bị của đối tác mà không cần đối tác cài đặt bất kỳ ứng dụng nào.',
      'Đối tác chỉ cần mở thông báo xuất hiện trên màn hình để lưu danh bạ điện thoại danh bạ tức thì.'
    ),
    ...createStep(
      3,
      'Ghi thông tin danh thiếp vào thẻ NFC mới',
      'Hội viên có thể bấm "Ghi thẻ NFC" trong phần Quản lý danh thiếp để nạp mã URL danh thiếp số cá nhân vào các loại thẻ card visit thông minh bằng kim loại hoặc gỗ ép cao cấp của CLB.',
      'Dữ liệu thẻ được khóa mã hóa một chiều để chống ghi đè trái phép.'
    ),
    ...createImageBlock(pngBuffers['demo_nfc_card'], 'Quy trình chạm thẻ NFC một chạm trao đổi liên hệ B2B'),

    // CHƯƠNG 3
    createHeading1('CHƯƠNG 3: NHẮN TIN THỜI GIAN THỰC PHONG CÁCH MESSENGER VIP'),
    createPara(
      'Hệ thống tin nhắn Doanh nhân được thiết kế chuẩn mực 100% theo phong cách Facebook Messenger hiện đại, tối ưu cho trao đổi công việc cấp cao giữa các chủ doanh nghiệp.'
    ),
    createHeading2('Đặc điểm nổi bật của giao diện tin nhắn:'),
    createPara('• Bong bóng chat của người gửi: Màu xanh Messenger chuẩn (#0084FF), bo góc tròn 16px, chữ trắng sắc nét.'),
    createPara('• Bong bóng chat của đối tác: Màu xám nhẹ thanh lịch (#F0F2F5 trên nền sáng, #303030 trên nền tối), có kèm avatar nhỏ 28px ở góc trái.'),
    createPara('• Nút tương tác nhanh (Thả cảm xúc 😊 và Tùy chọn ⋯): Xuất hiện nằm ngang ngay cạnh bong bóng chat khi rê chuột hoặc chạm nhẹ, không bị che khuất.'),
    createPara('• Thu hồi tin nhắn (Recall): Khi chọn "Thu hồi tin nhắn", bong bóng lập tức chuyển thành viền mỏng nét đứt thanh nhã với nội dung "Bạn đã thu hồi một tin nhắn", đồng thời cuộc trò chuyện lập tức nhảy lên vị trí đầu tiên của danh sách tin nhắn.'),
    ...createStep(
      1,
      'Mở cuộc trò chuyện hoặc tạo tin nhắn mới',
      'Tại thanh điều hướng dưới cùng, chọn biểu tượng Tin nhắn. Bấm vào cuộc trò chuyện có sẵn hoặc bấm dấu "+" để tìm kiếm hội viên theo tên hoặc mã số doanh nhân.',
      ''
    ),
    ...createStep(
      2,
      'Gửi tin nhắn, hình ảnh & thư mời họp B2B',
      'Nhập nội dung văn bản, đính kèm hình ảnh sản phẩm hoặc gửi biểu mẫu thư mời họp. Thư mời họp sẽ hiển thị nút "Xác nhận tham dự" hoặc "Vào phòng họp video" trực tiếp trong bong bóng chat.',
      'Người nhận có thể bấm xác nhận mà không cần rời khỏi màn hình chat.'
    ),
    ...createStep(
      3,
      'Thu hồi và quản lý tin nhắn đã gửi',
      'Để thu hồi một tin nhắn đã gửi nhầm, bấm vào nút ba chấm (⋯) cạnh bong bóng chat -> chọn "Thu hồi tin nhắn" (màu đỏ). Hệ thống cập nhật thời gian thực qua WebSockets cho cả 2 bên.',
      'Tin nhắn thu hồi sẽ hiển thị trạng thái mới nhất lên danh sách hộp thư ngoài trang chủ.'
    ),
    ...createImageBlock(pngBuffers['demo_messenger_chat'], 'Giao diện Chat Messenger VIP & Cơ chế thu hồi tin nhắn nhảy top'),

    // CHƯƠNG 4
    createHeading1('CHƯƠNG 4: DANH BẠ HỘI VIÊN & QUẢN LÝ KẾT NỐI THÔNG MINH'),
    createPara(
      'Danh bạ hội viên là kho tài nguyên quý giá nhất của CLB CEO 1983, quy tụ hơn 500+ chủ tịch HĐQT, Tổng giám đốc và doanh nhân thuộc các ngành nghề trọng điểm.'
    ),
    ...createStep(
      1,
      'Tra cứu và lọc hội viên theo lĩnh vực',
      'Vào mục "Danh bạ hội viên". Dùng thanh tìm kiếm để gõ tên doanh nhân, tên công ty hoặc chọn nhanh theo ngành nghề (Bất động sản, Xây dựng, Tài chính, Công nghệ, F&B, Logistics...).',
      'Hệ thống hỗ trợ tìm kiếm không dấu và gợi ý tự động.'
    ),
    ...createStep(
      2,
      'Xem hồ sơ năng lực & Trạng thái kết nối',
      'Bấm vào ảnh đại diện (Avatar) của bất kỳ hội viên nào trong danh bạ hoặc trong cuộc trò chuyện để mở Popup Hồ sơ năng lực chi tiết.',
      'Popup cung cấp thông tin: Chức vụ, Pháp nhân công ty, Lĩnh vực thế mạnh, Nhu cầu kết nối và Mã hội viên.'
    ),
    ...createStep(
      3,
      'Kết nối và Hủy kết nối thông minh (1 Chạm)',
      'Nếu bạn chưa kết nối với hội viên này: Nút hành động hiển thị "KẾT NỐI NGAY" (màu xanh dương). Bấm vào để gửi yêu cầu kết nối giao thương. ' +
      'Nếu bạn ĐÃ KẾT NỐI với hội viên: Nút hành động sẽ tự động chuyển thành "HỦY KẾT NỐI" (viền đỏ nổi bật). Bấm vào sẽ hủy kết nối an toàn và loại khỏi danh bạ đối tác thân thiết.',
      'Cơ chế chuyển đổi nút tức thời giúp hội viên chủ động quản lý mạng lưới quan hệ kinh doanh của mình.'
    ),
    ...createImageBlock(pngBuffers['demo_directory_b2b'], 'Danh bạ hội viên và nút chuyển đổi Kết nối / Hủy kết nối thông minh'),

    // CHƯƠNG 5
    createHeading1('CHƯƠNG 5: SỰ KIỆN CLB, CHECK-IN QR & BIỂU QUYẾT TRỰC TIẾP'),
    createPara(
      'CLB CEO 1983 thường xuyên tổ chức các sự kiện Networking hàng tuần, Diễn đàn kinh tế quý và Đại hội thường niên. Ứng dụng số hóa toàn bộ khâu tham dự và biểu quyết.'
    ),
    ...createStep(
      1,
      'Đăng ký tham gia sự kiện hội nghị',
      'Vào tab "Sự kiện", xem danh sách các chương trình sắp diễn ra. Bấm "Đăng ký tham dự" để giữ chỗ và nhận sơ đồ bàn tiệc VIP.',
      'Ban Thư Ký sẽ gửi vé điện tử kèm mã QR về hòm thư thông báo trong ứng dụng.'
    ),
    ...createStep(
      2,
      'Check-in tự động bằng mã QR tại cửa hội trường',
      'Khi đến sảnh đón tiếp tại Trung tâm Hội nghị Quốc gia hoặc khách sạn, mở ứng dụng -> chọn "Mã QR Check-in" để lễ tân quét máy quét quang học, hoặc dùng camera ứng dụng để quét mã QR điểm danh tại bàn.',
      'Hệ thống tự động in thẻ đeo và gửi lời chào mừng lên màn hình LED hội trường.'
    ),
    ...createStep(
      3,
      'Tham gia biểu quyết & Bầu cử trực tiếp',
      'Trong các phiên họp biểu quyết định hướng phát triển hoặc bầu ban lãnh đạo, mở mục "Biểu quyết trực tiếp". Chọn các phương án (Đồng ý / Không đồng ý / Ý kiến khác) và bấm "Gửi phiếu bầu".',
      'Dữ liệu biểu quyết được mã hóa và tổng hợp kết quả lên biểu đồ thời gian thực chỉ sau 30 giây.'
    ),
    ...createImageBlock(pngBuffers['demo_qr_checkin'], 'Quy trình Check-in QR tại sự kiện và Biểu quyết trực tiếp bảo mật'),

    // CHƯƠNG 6
    createHeading1('CHƯƠNG 6: THU & ĐÓNG HỘI PHÍ TỰ ĐỘNG QUA VIETQR NAPAS 247'),
    createPara(
      'Hệ thống tích hợp cổng thanh toán VietQR Napas 247 chuẩn quốc gia, cho phép hội viên thanh toán hội phí nhanh chóng, gạch nợ tự động và nhận hóa đơn VAT điện tử.'
    ),
    ...createStep(
      1,
      'Nhận thông báo nhắc hội phí định kỳ',
      'Hàng quý hoặc đầu năm tài chính, Ban Thư Ký gửi thông báo nhắc đóng hội phí kèm đường link thanh toán vào mục Tin nhắn và Thông báo tài khoản.',
      'Bấm "Xem chi tiết & Thanh toán" để mở hóa đơn điện tử.'
    ),
    ...createStep(
      2,
      'Quét mã VietQR bằng bất kỳ App Ngân hàng nào',
      'Hệ thống tự sinh mã QR chuẩn VietQR chứa đầy đủ: Số tài khoản CLB CEO 1983 tại Vietcombank/MBBank, Số tiền chính xác (VD: 5.000.000 VNĐ) và Cú pháp nội dung chuyển khoản tự động (CLB1983 [MÃ HỘI VIÊN]).',
      'Hội viên mở bất kỳ ứng dụng ngân hàng nào (Vietcombank, Techcombank, BIDV, VPBank, MBBank, Cake...) quét mã mà KHÔNG CẦN nhập tay số tài khoản hay số tiền.'
    ),
    ...createStep(
      3,
      'Gạch nợ tự động và nhận Thẻ Hội Viên kích hoạt tiếp niên khóa',
      'Ngay sau khi ngân hàng báo chuyển khoản thành công, hệ thống tự động gạch nợ trong vòng 5 giây, gia hạn thời hạn hội viên thêm 12 tháng và phát hành biên lai thu tiền điện tử.',
      'Hội viên có thể tải hóa đơn GTGT hoặc biên lai thu phí về máy trong tab Lịch sử thanh toán.'
    ),
    ...createImageBlock(pngBuffers['demo_vietqr_fee'], 'Thanh toán hội phí niên khóa qua mã VietQR Napas 247 tự động'),

    // CHƯƠNG 7
    createHeading1('CHƯƠNG 7: SÀN CƠ HỘI GIAO THƯƠNG B2B & GIAN HÀNG SẢN PHẨM 2 CỘT E-COMMERCE'),
    createPara(
      'Sàn giao thương nội bộ giúp hội viên kết nối cung cầu, tìm kiếm đối tác và tiếp cận nguồn hàng hóa/dịch vụ chất lượng cao với mức chiết khấu độc quyền.'
    ),
    ...createStep(
      1,
      'Khám phá và đăng tin Cơ hội B2B',
      'Vào mục "Cơ hội giao thương" trên Trang chủ hoặc thanh menu. Xem các tin Chào mua, Chào bán, Hợp tác đầu tư với hình ảnh chất lượng cao. Bấm "Đăng cơ hội mới" để đưa nhu cầu kinh doanh lên sàn. Quản lý các tin của chính mình tại tab "Cơ hội của tôi".',
      'Tin đăng mới nhất luôn được tự động sắp xếp lên vị trí đầu tiên kèm ngày đăng chi tiết.'
    ),
    ...createStep(
      2,
      'Mua sắm và trưng bày sản phẩm trên Gian hàng 2 cột E-Commerce',
      'Vào mục "Gian hàng sản phẩm". Giao diện thiết kế theo lưới 2 cột hiện đại phong cách sàn thương mại điện tử: Ảnh tỉ lệ chuẩn, badge ưu đãi hội viên, giá niêm yết gạch ngang và giá VIP nổi bật.',
      'Tab "Đã quan tâm" được cách ly độc lập theo từng tài khoản; tab "Sản phẩm tôi đăng" giúp theo dõi toàn bộ danh mục sản phẩm của doanh nghiệp mình.'
    ),

    // CHƯƠNG 8
    createHeading1('CHƯƠNG 8: MENU CÁ NHÂN IMAGE 3, PHÍM TẮT (+) DANH THIẾP SỐ & CÀI ĐẶT BẢO MẬT'),
    createPara(
      'Trang cá nhân được chuẩn hóa theo bộ nhận diện mới nhất với đầy đủ các tiện ích quản trị hồ sơ và danh thiếp số doanh nhân.'
    ),
    ...createStep(
      1,
      'Menu cá nhân chuẩn hóa & Phím tắt (+) tạo nhanh danh thiếp',
      'Menu cá nhân sắp xếp khoa học theo đúng bản vẽ thiết kế tham chiếu. Đặc biệt, dòng "Quản lý Danh thiếp số" tích hợp nút (+) màu xanh nổi bật: Bấm vào dòng để xem danh sách thẻ, bấm vào nút (+) để mở ngay form tạo danh thiếp mới.',
      'Giúp doanh nhân tạo mới namecard số chỉ với một thao tác duy nhất.'
    ),
    ...createStep(
      2,
      'Cài đặt bảo mật, Đổi mật khẩu & Vô hiệu hóa tài khoản',
      'Tại mục Cài đặt -> tab "Bảo mật": Hệ thống kết nối trực tiếp API đổi mật khẩu an toàn. Nút "Đăng xuất" được khóa chặt cho đến khi hoàn tất đổi mật khẩu trong phiên. Hội viên cũng có thể tạm khóa tài khoản an toàn qua tính năng "Vô hiệu hóa tài khoản" có xác thực mật khẩu.',
      'Avatar hội viên được quản lý tập trung tại Trang cá nhân, loại bỏ form tải trùng lặp trong tab bảo mật.'
    ),

    // CHƯƠNG 9
    createHeading1('CHƯƠNG 9: SƠ ĐỒ HỘI NGHỊ RẠP CHIẾU CINEMA SEATING MAP & TÙY BIẾN GHẾ SÂN KHẤU'),
    createPara(
      'Hệ thống quản trị CRM tích hợp sơ đồ khán phòng rạp chiếu và hội trường tổ chức sự kiện chuyên nghiệp.'
    ),
    ...createStep(
      1,
      'Phân quyền quản trị CRM chặt chẽ theo vai trò',
      'Sidebar CRM tự động ẩn/hiện menu chính xác theo ma trận vai trò (Platform Admin vs Association Admin vs Trưởng ban chuyên môn); loại bỏ hoàn toàn mục "Quyền của tôi" dư thừa.',
      'Mỗi ban chuyên môn chỉ tiếp cận đúng các phân hệ nghiệp vụ thuộc phạm vi phụ trách.'
    ),
    ...createStep(
      2,
      'Kéo thả tọa độ ghế sân khấu (Stage Seats Drag & Drop)',
      'Tại màn hình Cinema Seating Map, khu vực Sân khấu hình vòng cung cho phép ban tổ chức dùng chuột hoặc cảm ứng bấm giữ và kéo thả tự do tọa độ ghế VIP/Diễn giả mà không làm xô lệch các hàng ghế khán phòng.',
      'Sử dụng các nút "+ Thêm ghế", "- Bớt ghế" và "Căn đều" để nhanh chóng dàn trải các ghế theo đường cong sân khấu hoàn hảo.'
    ),

    // CHƯƠNG 10
    createHeading1('CHƯƠNG 10: LIÊN HỆ BAN THƯ KÝ & HỖ TRỢ KỸ THUẬT'),
    createPara(
      'Trong quá trình sử dụng ứng dụng, nếu có bất kỳ thắc mắc nào về thủ tục hội viên, tài khoản hoặc sự cố kỹ thuật, hội viên có thể liên hệ ngay tại tab "Tài khoản":'
    ),
    createPara('• Hotline thường trực 24/7: 098.333.1983'),
    createPara('• Tổng đài hỗ trợ hội viên: 1900.6883'),
    createPara('• Kênh Zalo Official Account: CLB Doanh Nhân CEO 1983 (https://zalo.me/ceo1983)'),
    createPara('• Email Ban Thư Ký: banthuky@ceo1983.vn | kythuat@vione.vn'),
    createPara('• Văn phòng đại diện: Tầng 6, Tháp Doanh Nhân, Đường Phạm Hùng, Nam Từ Liêm, Hà Nội.'),
    createPara('• Cửa sổ gửi yêu cầu trực tiếp: Bấm nút "Liên Hệ Ban Thư Ký CLB CEO 1983" ngay trên màn hình Trang cá nhân, điền nội dung và bấm gửi. Đội ngũ trực ban sẽ phản hồi trong vòng 15 phút.'),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 100 },
      children: [
        new TextRun({
          text: '--- BAN THƯ KÝ CLB DOANH NHÂN CEO 1983 ---',
          font: FONT_FAMILY,
          size: 22,
          bold: true,
          color: GOLD,
        }),
      ],
    }),
  ];

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
                spacing: { after: 100 },
                children: [
                  new TextRun({
                    text: 'CLB DOANH NHÂN CEO 1983 · TÀI LIỆU HƯỚNG DẪN SỬ DỤNG ỨNG DỤNG',
                    font: FONT_FAMILY,
                    size: 16,
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
                spacing: { before: 100 },
                children: [
                  new TextRun({
                    text: 'Trang ',
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

  const docxBuffer = await Packer.toBuffer(doc);
  const outDocx1 = path.join(docsDir, 'HUONG_DAN_SU_DUNG_APP_HIEP_HOI_CEO1983.docx');
  const outDocx2 = path.join(publicDocsDir, 'HUONG_DAN_SU_DUNG_APP_HIEP_HOI_CEO1983.docx');
  fs.writeFileSync(outDocx1, docxBuffer);
  fs.writeFileSync(outDocx2, docxBuffer);
  console.log(`✓ Generated DOCX User Guide: ${docxBuffer.length} bytes -> ${outDocx1}`);

  // 3. Build PDF Document (.pdf) using jsPDF with Arial font and embedded images
  console.log('Building PDF Document...');
  const fontPath = 'C:\\Windows\\Fonts\\arial.ttf';
  let fontBase64 = null;
  if (fs.existsSync(fontPath)) {
    fontBase64 = fs.readFileSync(fontPath).toString('base64');
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  if (fontBase64) {
    pdf.addFileToVFS('Arial.ttf', fontBase64);
    pdf.addFont('Arial.ttf', 'Arial', 'normal');
    pdf.setFont('Arial');
  }

  // Cover Page
  pdf.setFillColor(10, 26, 58); // Navy
  pdf.rect(0, 0, 210, 35, 'F');

  pdf.setTextColor(217, 119, 6); // Gold
  pdf.setFontSize(11);
  pdf.text('CLB DOANH NHÂN CEO 1983 - VIONE ECOSYSTEM', 105, 15, { align: 'center' });

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.text('TÀI LIỆU HƯỚNG DẪN SỬ DỤNG CHI TIẾT', 105, 25, { align: 'center' });

  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(12);
  pdf.text('Ứng Dụng Di Động & Cổng Kết Nối Doanh Nhân CEO 1983', 105, 45, { align: 'center' });

  let y = 60;
  function checkPageBreak(neededHeight) {
    if (y + neededHeight > 275) {
      pdf.addPage();
      y = 20;
      // Header on sub-pages
      pdf.setTextColor(148, 163, 184);
      pdf.setFontSize(8);
      pdf.text('CLB DOANH NHÂN CEO 1983 · HƯỚNG DẪN SỬ DỤNG ỨNG DỤNG', 105, 12, { align: 'center' });
      pdf.setDrawColor(226, 232, 240);
      pdf.line(15, 14, 195, 14);
      y = 22;
    }
  }

  function addPdfHeading1(title) {
    checkPageBreak(15);
    pdf.setTextColor(10, 26, 58);
    pdf.setFontSize(13);
    pdf.text(title, 15, y);
    y += 7;
  }

  function addPdfText(text, indent = 15) {
    pdf.setTextColor(51, 65, 85);
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(text, 195 - indent);
    checkPageBreak(lines.length * 5 + 4);
    pdf.text(lines, indent, y);
    y += lines.length * 5 + 3;
  }

  function addPdfStep(num, title, desc, tip) {
    checkPageBreak(25);
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(10.5);
    pdf.text(`Bước ${num}: ${title}`, 18, y);
    y += 5.5;

    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(9.5);
    const descLines = pdf.splitTextToSize(desc, 172);
    checkPageBreak(descLines.length * 4.5 + (tip ? 12 : 4));
    pdf.text(descLines, 22, y);
    y += descLines.length * 4.5 + 2;

    if (tip) {
      pdf.setTextColor(180, 83, 9);
      const tipLines = pdf.splitTextToSize(`💡 Lưu ý: ${tip}`, 172);
      checkPageBreak(tipLines.length * 4.5 + 4);
      pdf.text(tipLines, 22, y);
      y += tipLines.length * 4.5 + 4;
    }
  }

  function addPdfImage(buf, caption) {
    if (!buf) return;
    checkPageBreak(75);
    try {
      const base64 = buf.toString('base64');
      pdf.addImage(base64, 'PNG', 25, y, 160, 68);
      y += 70;
      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(8.5);
      pdf.text(`[Hình minh họa: ${caption}]`, 105, y, { align: 'center' });
      y += 8;
    } catch (e) {
      console.warn('Could not render image to PDF:', e.message);
    }
  }

  // Chapter 1
  addPdfHeading1('1. ĐĂNG NHẬP, ĐỊNH DANH & THẺ HỘI VIÊN SỐ');
  addPdfText('Mỗi hội viên khi gia nhập CLB được cấp Mã Hội Viên duy nhất (VD: M1983-007) gắn liền với số điện thoại và hồ sơ doanh nghiệp.');
  addPdfStep(1, 'Truy cập và nhập thông tin định danh', 'Mở https://vione.vn/association/login trên Safari/Chrome hoặc mở app từ màn hình chính. Nhập số điện thoại hoặc mã hội viên.', 'Nếu chưa có mật khẩu, chọn "Quên mật khẩu" để nhận mã OTP SMS xác thực.');
  addPdfStep(2, 'Kích hoạt Thẻ hội viên điện tử VIP', 'Sau khi đăng nhập thành công, thẻ điện tử doanh nhân hiển thị với dấu tích xanh xác thực, mã QR vCard và thông tin pháp nhân.', 'Có thể chuyển đổi giữa 3 mẫu thiết kế thẻ: Classic Navy, Golden VIP hoặc Modern Dark.');
  addPdfStep(3, 'Cài đặt PWA lên màn hình chính điện thoại', 'Trên iOS: Bấm Share -> "Thêm vào màn hình chính". Trên Android: Bấm menu -> "Cài đặt ứng dụng".', 'Hoạt động nhanh, mượt mà và không cần tải qua App Store.');
  addPdfImage(pngBuffers['demo_auth_card'], 'Đăng nhập & Thẻ Hội viên số VIP');

  // Chapter 2
  addPdfHeading1('2. CÔNG NGHỆ CHẠM THẺ THÔNG MINH NFC');
  addPdfText('Ứng dụng tích hợp công nghệ chạm thẻ trường gần NFC chuẩn NTAG213/215, trao đổi danh thiếp số 1 chạm không cần cài app phụ.');
  addPdfStep(1, 'Bật tính năng Chạm thẻ NFC', 'Tại màn hình Trang cá nhân hoặc Thẻ hội viên, bấm biểu tượng sóng phát xạ NFC.', 'Trình duyệt sẽ khởi động bộ thu phát sóng NFC.');
  addPdfStep(2, 'Chạm mặt lưng điện thoại vào thẻ', 'Áp sát mặt lưng điện thoại vào chip NFC của thẻ doanh nhân. Thông tin vCard được truyền tải tức thì sang máy đối tác.', 'Đối tác chỉ cần mở thông báo để lưu số điện thoại vào danh bạ.');
  addPdfImage(pngBuffers['demo_nfc_card'], 'Chạm thẻ thông minh NFC trao đổi danh thiếp');

  // Chapter 3
  addPdfHeading1('3. NHẮN TIN THỜI GIAN THỰC PHONG CÁCH MESSENGER');
  addPdfText('Giao diện nhắn tin được tối ưu hóa chuẩn mực phong cách Messenger với màu xanh #0084FF, bong bóng bo tròn mềm mại và cơ chế thu hồi tin nhắn nhảy top.');
  addPdfStep(1, 'Tạo cuộc trò chuyện và gửi tin nhắn', 'Bấm vào biểu tượng Tin nhắn tại thanh điều hướng, chọn hội viên cần trao đổi và gửi tin nhắn văn bản, hình ảnh.', null);
  addPdfStep(2, 'Tương tác cảm xúc và tùy chọn nhanh', 'Rê chuột hoặc chạm vào tin nhắn để hiển thị thanh công cụ nằm ngang: Thả 6 cảm xúc (😊) và Tùy chọn (⋯).', 'Thao tác cực kỳ thuận tiện và không bị che khuất tầm nhìn.');
  addPdfStep(3, 'Thu hồi tin nhắn đã gửi (Recall)', 'Bấm vào dấu ba chấm -> Chọn "Thu hồi tin nhắn". Tin nhắn chuyển thành khung viền mỏng "Bạn đã thu hồi một tin nhắn", đồng thời cuộc trò chuyện nhảy lên đầu danh sách.', 'Trạng thái được đồng bộ thời gian thực qua WebSockets.');
  addPdfImage(pngBuffers['demo_messenger_chat'], 'Nhắn tin Messenger VIP & Thu hồi tin nhắn');

  // Chapter 4
  addPdfHeading1('4. DANH BẠ HỘI VIÊN & NÚT KẾT NỐI / HỦY KẾT NỐI THÔNG MINH');
  addPdfText('Tra cứu hơn 500+ chủ tịch HĐQT, CEO các doanh nghiệp lớn. Quản lý trạng thái quan hệ kinh doanh bằng 1 chạm.');
  addPdfStep(1, 'Tra cứu hội viên theo ngành nghề', 'Sử dụng bộ lọc đa năng để tìm kiếm theo Ngành hàng (BĐS, Xây dựng, Tài chính, F&B...) hoặc tỉnh thành.', null);
  addPdfStep(2, 'Xem hồ sơ và Đổi trạng thái Kết nối / Hủy kết nối', 'Bấm vào Avatar của hội viên để mở Modal Profile. Nếu đã kết nối, nút hành động sẽ hiển thị "HỦY KẾT NỐI" (viền đỏ). Nếu chưa kết nối, hiển thị "KẾT NỐI NGAY" (màu xanh).', 'Thao tác chuyển đổi tức thì và bảo vệ quyền riêng tư cá nhân.');
  addPdfImage(pngBuffers['demo_directory_b2b'], 'Danh bạ hội viên & Cơ chế Kết nối / Hủy kết nối');

  // Chapter 5
  addPdfHeading1('5. SỰ KIỆN CLB, CHECK-IN QR & BIỂU QUYẾT TRỰC TIẾP');
  addPdfText('Số hóa 100% quy trình tổ chức sự kiện, diễn đàn kinh tế và đại hội thường niên của CLB CEO 1983.');
  addPdfStep(1, 'Đăng ký tham dự sự kiện', 'Xem lịch sự kiện hàng tuần/quý, bấm đăng ký để nhận vé mời điện tử có mã QR bảo mật.', null);
  addPdfStep(2, 'Check-in tự động tại hội trường', 'Mở mã QR trên điện thoại để lễ tân quét mã điểm danh, hệ thống tự động xuất vị trí bàn tiệc VIP.', null);
  addPdfStep(3, 'Biểu quyết & Bầu cử thời gian thực', 'Bấm vào phiên họp đang mở để bỏ phiếu trực tiếp (Đồng ý / Không đồng ý), kết quả cập nhật lên màn hình LED chỉ sau 30 giây.', null);
  addPdfImage(pngBuffers['demo_qr_checkin'], 'Check-in QR sự kiện và Biểu quyết trực tiếp');

  // Chapter 6
  addPdfHeading1('6. THU & ĐÓNG HỘI PHÍ TỰ ĐỘNG QUA VIETQR NAPAS 247');
  addPdfText('Tích hợp Napas 247 thanh toán hội phí niên khóa an toàn, nhanh chóng và tự động xuất biên lai.');
  addPdfStep(1, 'Mở hóa đơn nhắc hội phí', 'Bấm vào thông báo hóa đơn trong hộp thư để xem chi tiết khoản hội phí.', null);
  addPdfStep(2, 'Quét mã VietQR bằng App Ngân hàng bất kỳ', 'Mã QR tự động điền Số tiền và Cú pháp (CLB1983 [MÃ HỘI VIÊN]). Quét và xác nhận thanh toán trong 3 giây.', null);
  addPdfStep(3, 'Gạch nợ tự động trong 5 giây', 'Sau khi chuyển khoản thành công, hệ thống tự động gạch nợ, gia hạn thẻ hội viên thêm 12 tháng và cấp hóa đơn VAT.', null);
  addPdfImage(pngBuffers['demo_vietqr_fee'], 'Thanh toán hội phí niên khóa qua VietQR Napas 247');

  // Chapter 7
  addPdfHeading1('7. SÀN CƠ HỘI GIAO THƯƠNG B2B & GIAN HÀNG SẢN PHẨM 2 CỘT E-COMMERCE');
  addPdfText('Sàn kết nối B2B và Gian hàng sản phẩm 2 cột chuẩn e-commerce giúp các doanh nhân xúc tiến thương mại nội bộ hiệu quả.');
  addPdfStep(1, 'Đăng tin và tìm kiếm Cơ hội B2B', 'Vào mục "Cơ hội giao thương". Xem các tin Chào mua, Chào bán với hình ảnh thực tế, ngày đăng và tab "Cơ hội của tôi".', 'Tin mới nhất luôn được tự động sắp xếp lên đầu trang.');
  addPdfStep(2, 'Gian hàng sản phẩm 2 cột e-commerce', 'Lưới 2 cột hiển thị đầy đủ hình ảnh, giá niêm yết, giá VIP hội viên; tab "Đã quan tâm" lưu độc lập cho từng tài khoản và tab "Sản phẩm tôi đăng" quản lý danh mục sản phẩm.', null);

  // Chapter 8
  addPdfHeading1('8. MENU CÁ NHÂN IMAGE 3, PHÍM TẮT (+) DANH THIẾP SỐ & CÀI ĐẶT BẢO MẬT');
  addPdfText('Trang cá nhân đồng bộ thiết kế chuẩn mực Image 3, phím tắt tạo nhanh danh thiếp số và bảo mật tài khoản.');
  addPdfStep(1, 'Menu cá nhân & Phím tắt (+) tạo danh thiếp số', 'Bấm vào dòng "Quản lý Danh thiếp số" để xem danh sách; bấm vào nút (+) màu xanh ở cuối dòng để mở ngay form tạo danh thiếp mới.', 'Thao tác tạo mới 1 chạm siêu nhanh cho doanh nhân.');
  addPdfStep(2, 'Cài đặt bảo mật, Đổi mật khẩu & Vô hiệu hóa', 'Tại Cài đặt -> Bảo mật: Đổi mật khẩu qua API /users/change-password. Nút Đăng xuất được bảo vệ khóa chặt cho đến khi đổi mật khẩu trong phiên. Bổ sung chức năng vô hiệu hóa tài khoản.', null);

  // Chapter 9
  addPdfHeading1('9. SƠ ĐỒ HỘI NGHỊ RẠP CHIẾU CINEMA SEATING MAP & TÙY BIẾN GHẾ SÂN KHẤU');
  addPdfText('Hệ thống CRM hỗ trợ quản lý sơ đồ khán phòng và sắp xếp vị trí ghế ngồi cho các sự kiện lớn.');
  addPdfStep(1, 'Phân quyền Sidebar CRM theo ma trận vai trò', 'Sidebar lọc menu chính xác theo quyền Platform Admin, Association Admin và Trưởng ban, gỡ bỏ mục "Quyền của tôi" dư thừa.', null);
  addPdfStep(2, 'Kéo thả tọa độ ghế sân khấu (Stage Seats Drag & Drop)', 'Khu vực Sân khấu hình vòng cung cho phép kéo thả tự do vị trí ghế VIP/Diễn giả, hỗ trợ nút "+ Thêm ghế", "- Bớt ghế" và "Căn đều".', null);

  // Chapter 10
  addPdfHeading1('10. LIÊN HỆ BAN THƯ KÝ & HỖ TRỢ KỸ THUẬT');
  addPdfText('Hội viên có thể liên hệ trực tiếp Ban Thư Ký CLB CEO 1983 qua các kênh:');
  addPdfText('• Hotline thường trực 24/7: 098.333.1983 | Tổng đài CSKH: 1900.6883');
  addPdfText('• Zalo Official Account: CLB Doanh Nhân CEO 1983 (https://zalo.me/ceo1983)');
  addPdfText('• Email hỗ trợ: banthuky@ceo1983.vn | kythuat@vione.vn');
  addPdfText('• Văn phòng CLB: Tầng 6, Tháp Doanh Nhân, Đường Phạm Hùng, Nam Từ Liêm, Hà Nội.');
  addPdfText('• Cửa sổ phản ánh trực tiếp: Vào Trang cá nhân -> Bấm "Liên Hệ Ban Thư Ký CLB CEO 1983" để gửi nội dung cần hỗ trợ.');

  const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
  const outPdf1 = path.join(docsDir, 'HUONG_DAN_SU_DUNG_APP_HIEP_HOI_CEO1983.pdf');
  const outPdf2 = path.join(publicDocsDir, 'HUONG_DAN_SU_DUNG_APP_HIEP_HOI_CEO1983.pdf');
  fs.writeFileSync(outPdf1, pdfBuffer);
  fs.writeFileSync(outPdf2, pdfBuffer);
  console.log(`✓ Generated PDF User Guide: ${pdfBuffer.length} bytes -> ${outPdf1}`);

  // 4. Build Markdown Document (.md)
  console.log('Building Markdown Document...');
  const mdContent = `# HƯỚNG DẪN SỬ DỤNG CHI TIẾT ỨNG DỤNG DOANH NHÂN CLB CEO 1983
**Phiên bản:** v2.6.0 · **Cơ quan chủ quản:** CLB Doanh Nhân CEO 1983 · **Nền tảng:** VIONE Connect Suite

---

## MỤC LỤC
1. [Đăng Nhập, Định Danh & Thẻ Hội Viên Số](#1-đăng-nhập-định-danh--thẻ-hội-viên-số)
2. [Công Nghệ Chạm Thẻ Thông Minh NFC](#2-công-nghệ-chạm-thẻ-thông-minh-nfc)
3. [Nhắn Tin Thời Gian Thực Phong Cách Messenger](#3-nhắn-tin-thời-gian-thực-phong-cách-messenger)
4. [Danh Bạ Hội Viên & Nút Kết Nối / Hủy Kết Nối Thông Minh](#4-danh-bạ-hội-viên--nút-kết-nối--hủy-kết-nối-thông-minh)
5. [Sự Kiện CLB, Check-in QR, Thẻ Poster 2:3 & Biểu Quyết Trực Tiếp](#5-sự-kiện-clb-check-in-qr-thẻ-poster-23--biểu-quyết-trực-tiếp)
6. [Thu & Đóng Hội Phí Tự Động Qua VietQR Napas 247](#6-thu--đóng-hội-phí-tự-động-qua-vietqr-napas-247)
7. [Sàn Cơ Hội Giao Thương B2B & Gian Hàng Sản Phẩm 2 Cột E-Commerce](#7-sàn-cơ-hội-giao-thương-b2b--gian-hàng-sản-phẩm-2-cột-e-commerce)
8. [Menu Cá Nhân Image 3, Phím Tắt (+) Danh Thiếp Số & Cài Đặt Bảo Mật](#8-menu-cá-nhân-image-3-phím-tắt--danh-thiếp-số--cài-đặt-bảo-mật)
9. [Sơ Đồ Hội Nghị Rạp Chiếu Cinema Seating Map & Tùy Biến Ghế Sân Khấu](#9-sơ-đồ-hội-nghị-rạp-chiếu-cinema-seating-map--tùy-biến-ghế-sân-khấu)
10. [Liên Hệ Ban Thư Ký & Hỗ Trợ Kỹ Thuật](#10-liên-hệ-ban-thư-ký--hỗ-trợ-kỹ-thuật)

---

## 1. ĐĂNG NHẬP, ĐỊNH DANH & THẺ HỘI VIÊN SỐ
Mỗi hội viên khi gia nhập CLB Doanh Nhân CEO 1983 được cấp một mã số định danh duy nhất (định dạng \`M1983-xxx\`) gắn liền với số điện thoại và hồ sơ pháp nhân doanh nghiệp.

![Đăng nhập & Thẻ Hội viên số VIP](/docs/images/demo_auth_card.svg)

### Các bước thao tác:
- **Bước 1: Truy cập và nhập thông tin định danh**
  Mở đường dẫn \`https://vione.vn/association/login\` trên trình duyệt Safari (iOS), Chrome (Android/PC) hoặc mở từ ứng dụng màn hình chính. Nhập Số điện thoại hoặc Mã hội viên cùng mật khẩu được cấp.
  *Lưu ý:* Nếu vừa được phê duyệt từ Landing Page, hệ thống tự động điền sẵn Tên đăng nhập / Số điện thoại và yêu cầu nhập mật khẩu bảo mật (tuyệt đối không bypass đăng nhập để đảm bảo an toàn danh tính).
- **Bước 2: Kích hoạt Thẻ hội viên điện tử VIP**
  Hệ thống tự động liên kết dữ liệu CRM của CLB CEO 1983, cấp thẻ số doanh nhân với dải màu Navy & Gold sang trọng, huy hiệu *"Hội viên chính thức"* có dấu tích xanh xác thực và mã QR động chứa liên hệ vCard.
- **Bước 3: Cài đặt ứng dụng PWA lên màn hình chính**
  - **Trên iPhone / iPad (Safari):** Bấm nút Chia sẻ (Share) -> chọn *"Thêm vào màn hình chính"* (Add to Home Screen).
  - **Trên Android (Chrome):** Bấm biểu tượng menu (3 chấm) -> chọn *"Cài đặt ứng dụng"* (Install App).
  Ứng dụng khởi động toàn màn hình, tốc độ phản hồi nhanh như app native mà không cần thông qua chợ ứng dụng.

---

## 2. CÔNG NGHỆ CHẠM THẺ THÔNG MINH NFC
Ứng dụng tích hợp công nghệ chạm thẻ trường gần NFC (Near Field Communication) chuẩn NTAG213/NTAG215, trao đổi danh thiếp số 1 chạm trong vòng 1 giây.

![Chạm thẻ thông minh NFC](/docs/images/demo_nfc_card.svg)

### Các bước thao tác:
- **Bước 1: Bật tính năng Chạm thẻ NFC trên ứng dụng**
  Tại tab Trang cá nhân hoặc Thẻ hội viên, bấm nút *"Chạm Thẻ NFC"*. Cửa sổ radar quét NFC sẽ kích hoạt.
- **Bước 2: Chạm mặt lưng điện thoại vào thẻ hoặc thiết bị đối tác**
  Đặt mặt lưng điện thoại sát vào chip NFC của thẻ doanh nhân CEO 1983. Hệ thống sẽ lập tức truyền tải đường dẫn định danh bảo mật vCard sang thiết bị đối tác mà đối tác không cần cài đặt bất kỳ ứng dụng nào.
- **Bước 3: Ghi thông tin danh thiếp vào thẻ NFC vật lý**
  Hội viên có thể bấm *"Ghi thẻ NFC"* trong phần Quản lý danh thiếp để nạp mã URL danh thiếp số cá nhân vào các loại thẻ card visit thông minh bằng kim loại hoặc gỗ ép cao cấp của CLB.

---

## 3. NHẮN TIN THỜI GIAN THỰC PHONG CÁCH MESSENGER
Hệ thống tin nhắn Doanh nhân được thiết kế chuẩn mực 100% phong cách Facebook Messenger, tối ưu cho trao đổi công việc cấp cao.

![Nhắn tin Messenger VIP & Thu hồi tin nhắn](/docs/images/demo_messenger_chat.svg)

### Các đặc điểm nổi bật:
- **Bong bóng chat người gửi:** Màu xanh Messenger chuẩn (\`#0084FF\`), bo tròn 16px, chữ trắng sắc nét.
- **Bong bóng chat đối tác:** Màu xám nhẹ thanh lịch (\`#F0F2F5\` nền sáng, \`#303030\` nền tối), có avatar nhỏ 28px bên trái.
- **Khử trùng lặp tin nhắn (Deduplication):** Cơ chế tự động loại bỏ duplicate tin nhắn theo chữ ký nội dung và timestamp 15 giây; tự động xóa huy hiệu tin chưa đọc ngay khi mở cuộc trò chuyện.
- **Thanh nhập tin nhắn Mobile tối ưu:** Thay thế 3 nút inline bằng nút mở rộng \`(+)\` tiện lợi bên trái, chống vỡ layout trên màn hình hẹp; bấm vào mở popup đính kèm ảnh, tài liệu và chia sẻ vị trí.
- **Thu hồi tin nhắn (Recall) & Nhảy top:** Khi chọn *"Thu hồi tin nhắn"*, bong bóng chuyển thành viền mỏng nét đứt *"Bạn đã thu hồi một tin nhắn"*, đồng thời cuộc trò chuyện lập tức nhảy lên vị trí đầu tiên của danh sách tin nhắn.

---

## 4. DANH BẠ HỘI VIÊN & NÚT KẾT NỐI / HỦY KẾT NỐI THÔNG MINH
Tra cứu hơn 500+ chủ tịch HĐQT, CEO và doanh nhân hàng đầu. Quản lý trạng thái quan hệ kinh doanh linh hoạt.

![Danh bạ hội viên & Kết nối / Hủy kết nối](/docs/images/demo_directory_b2b.svg)

### Các bước thao tác:
- **Bước 1: Tra cứu hội viên theo ngành nghề**
  Dùng thanh tìm kiếm lọc theo Ngành hàng (Bất động sản, Xây dựng, Tài chính, Logistics, F&B...) hoặc tỉnh thành.
- **Bước 2: Xem hồ sơ năng lực chi tiết**
  Bấm vào Avatar của hội viên để mở Modal Profile xem Chức vụ, Pháp nhân công ty, Lĩnh vực thế mạnh và Nhu cầu kết nối.
- **Bước 3: Chuyển đổi trạng thái Kết nối / Hủy kết nối (1 Chạm)**
  - Nếu **chưa kết nối**: Hiển thị nút **"KẾT NỐI NGAY"** màu xanh. Bấm vào để gửi yêu cầu kết nối giao thương.
  - Nếu **đã kết nối**: Hiển thị nút **"HỦY KẾT NỐI"** viền đỏ. Bấm vào để hủy kết nối an toàn và loại khỏi danh bạ đối tác thân thiết.

---

## 5. SỰ KIỆN CLB, CHECK-IN QR, THẺ POSTER 2:3 & BIỂU QUYẾT TRỰC TIẾP
Số hóa toàn bộ khâu tham dự sự kiện, hội nghị và biểu quyết định hướng phát triển CLB.

![Check-in QR sự kiện và Biểu quyết trực tiếp](/docs/images/demo_qr_checkin.svg)

### Các bước thao tác:
- **Bước 1: Đăng ký tham dự sự kiện**
  Xem danh sách sự kiện trên Trang chủ (dạng thẻ poster dọc tỉ lệ 2:3 với nhãn độ tuổi \`16+\`, \`18+\`, \`13+\`) hoặc tại màn hình Sự kiện có backdrop sân khấu sang trọng. Bấm đăng ký để nhận vé mời điện tử có mã QR bảo mật.
- **Bước 2: Check-in tự động tại hội trường**
  Mở mã QR trên điện thoại để lễ tân quét mã điểm danh, hệ thống tự động xuất vị trí bàn tiệc VIP và chào mừng lên màn hình LED.
- **Bước 3: Biểu quyết & Bầu cử trực tiếp**
  Trong các phiên họp biểu quyết, mở mục *"Biểu quyết trực tiếp"*, chọn phương án và bấm gửi. Kết quả cập nhật lên biểu đồ trực tiếp sau 30 giây.

---

## 6. THU & ĐÓNG HỘI PHÍ TỰ ĐỘNG QUA VIETQR NAPAS 247
Tích hợp cổng Napas 247 thanh toán hội phí an toàn, nhanh chóng và tự động gạch nợ.

![Thanh toán hội phí niên khóa qua VietQR Napas 247](/docs/images/demo_vietqr_fee.svg)

### Các bước thao tác:
- **Bước 1: Nhận thông báo nhắc hội phí**
  Bấm vào hóa đơn niên khóa trong hòm thư để xem chi tiết nghĩa vụ hội phí.
- **Bước 2: Quét mã VietQR bằng App Ngân hàng bất kỳ**
  Hệ thống tự sinh mã QR chuẩn VietQR chứa đầy đủ: Số tài khoản CLB, Số tiền chính xác và Cú pháp chuyển khoản tự động (\`CLB1983 [MÃ HỘI VIÊN]\`). Quét và xác nhận thanh toán trong 3 giây.
- **Bước 3: Gạch nợ tự động trong 5 giây**
  Sau khi ngân hàng báo chuyển khoản thành công, hệ thống tự động gạch nợ trong vòng 5 giây, gia hạn thời hạn hội viên thêm 12 tháng và phát hành hóa đơn điện tử.

---

## 7. SÀN CƠ HỘI GIAO THƯƠNG B2B & GIAN HÀNG SẢN PHẨM 2 CỘT E-COMMERCE
- **Sàn Cơ hội B2B (/association/opportunities):**
  - Hiển thị hình ảnh người dùng tự tải lên sắc nét.
  - Bổ sung tab *"Cơ hội của tôi"* quản lý riêng các tin do chính mình đăng.
  - Sắp xếp tin mới nhất lên đầu (newest-first) kèm nhãn ngày đăng chi tiết.
- **Gian hàng sản phẩm 2 cột (/association/products):**
  - Đồng bộ sản phẩm 2 chiều với Web CRM.
  - Cách ly danh sách *"Đã quan tâm"* theo từng tài khoản (tài khoản mới khởi tạo 0 sản phẩm, không bị trùng lặp).
  - Bổ sung tab *"Sản phẩm tôi đăng"*.
  - Redesign lưới 2 cột phong cách sàn thương mại điện tử hiện đại, phân cấp giá niêm yết và giá VIP hội viên rõ nét.

---

## 8. MENU CÁ NHÂN IMAGE 3, PHÍM TẮT (+) DANH THIẾP SỐ & CÀI ĐẶT BẢO MẬT
- **Menu Trang cá nhân (/association/profile):**
  - Căn chỉnh thứ tự và giao diện chuẩn xác theo bản vẽ tham chiếu Image 3.
  - Dòng *"Quản lý Danh thiếp số"* tích hợp nút phím tắt \`(+)\` màu xanh: Bấm vào dòng mở danh sách thẻ, bấm vào nút \`(+)\` mở trực tiếp form tạo mới danh thiếp.
- **Cài đặt Bảo mật (/association/settings):**
  - Kết nối API chuẩn \`/users/change-password\`.
  - Nút *"Đăng xuất"* bị vô hiệu hóa cho đến khi người dùng hoàn tất đổi mật khẩu trong phiên làm việc.
  - Bổ sung tính năng *"Vô hiệu hóa tài khoản"* an toàn kèm modal xác nhận mật khẩu.
  - Form tải ảnh đại diện được đưa về đúng vị trí Trang cá nhân, không để trùng lặp trong tab bảo mật.

---

## 9. SƠ ĐỒ HỘI NGHỊ RẠP CHIẾU CINEMA SEATING MAP & TÙY BIẾN GHẾ SÂN KHẤU
- **Phân quyền vai trò trên Sidebar CRM:** Menu sidebar tự động ẩn/hiện theo đúng ma trận phân quyền (Platform Admin vs Association Admin vs các Trưởng ban chuyên môn); loại bỏ hoàn toàn mục *"Quyền của tôi"*.
- **Tùy biến ghế sân khấu Cinema Seating Map:** Ban tổ chức có thể kéo thả tự do tọa độ các ghế trên sân khấu bằng chuột hoặc cảm ứng mà không làm xô lệch các hàng ghế khán phòng; cung cấp các nút *"+ Thêm ghế"*, *"- Bớt ghế"* và *"Căn đều"* để định hình vòng cung sân khấu hoàn hảo.

---

## 10. LIÊN HỆ BAN THƯ KÝ & HỖ TRỢ KỸ THUẬT
- **Hotline thường trực 24/7:** 098.333.1983
- **Tổng đài hỗ trợ hội viên:** 1900.6883
- **Zalo Official Account:** CLB Doanh Nhân CEO 1983 (https://zalo.me/ceo1983)
- **Email Ban Thư Ký:** banthuky@ceo1983.vn | kythuat@vione.vn
- **Văn phòng đại diện:** Tầng 6, Tháp Doanh Nhân, Đường Phạm Hùng, Nam Từ Liêm, Hà Nội.
- **Gửi yêu cầu trực tiếp:** Vào tab *Trang cá nhân* -> Bấm *"Liên Hệ Ban Thư Ký CLB CEO 1983"* để gửi nội dung cần hỗ trợ. Ban Thư Ký sẽ phản hồi trong vòng 15 phút.

---
*Tài liệu ban hành lưu hành nội bộ - Bản quyền thuộc về CLB Doanh Nhân CEO 1983.*
`;

  const outMd = path.join(docsDir, 'HUONG_DAN_SU_DUNG_APP_HIEP_HOI_CEO1983.md');
  fs.writeFileSync(outMd, mdContent, 'utf8');
  console.log(`✓ Generated Markdown User Guide: ${mdContent.length} chars -> ${outMd}`);
  console.log('=== USER MANUAL GENERATION COMPLETE! ===\n');
}

main().catch((err) => {
  console.error('Error generating user manual:', err);
  process.exit(1);
});
