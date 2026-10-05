const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');

const rootDir = path.resolve(__dirname, '..');
const docDir = path.join(rootDir, 'document');
const publicDocsDir = path.join(rootDir, 'apps', 'vione_app_fe', 'public', 'docs');

console.log('>>> [SLIDE VIONE MASTER 6.0] Bat dau xay dung bo Slide thuyet trinh...');

const slidesData = [
  {
    tag: 'TỔNG QUAN CHIẾN LƯỢC',
    title: 'HỆ THỐNG DOANH NGHIỆP TOÀN DIỆN VIONE & APP VIONE CONNECT',
    subtitle: 'Nền Tảng Quản Trị Doanh Nghiệp Toàn Diện & Mạng Xã Hội Giao Thương Doanh Nhân B2B 6.0',
    bullets: [
      'Hợp nhất 2 trụ cột chiến lược: Nền tảng Web CRM Quản trị nội bộ doanh nghiệp và Ứng dụng Di động ViOne Connect.',
      'Thiết kế chuẩn thượng lưu: Phong cách Dark Obsidian & Champagne Gold sang trọng, hiện đại, mang bản sắc doanh nhân dẫn đầu.',
      'Tự động hóa 100% quy trình: Chấm công định vị GPS di động, phê duyệt tài chính 3 cấp, đối soát ngân hàng tự động.',
      'Sức mạnh Trí tuệ nhân tạo AI Copilot 5.0: Đàm thoại điều hành realtime, OCR hợp đồng & danh thiếp, tự động ghép nối cung cầu B2B.'
    ]
  },
  {
    tag: 'KIẾN TRÚC HỆ SINH THÁI',
    title: 'HAI TRỤ CỘT CHUYỂN ĐỔI SỐ LIỀN MẠCH DOANH NGHIỆP',
    subtitle: 'Đồng Bộ Dữ Liệu Tức Thì Giữa Quản Trị Vận Hành (Web) và Kết Nối Ngoại Bộ (App)',
    bullets: [
      'Trụ cột 1 - ViOne CRM Platform (Web Portal): Bộ công cụ quản trị B2B, quản lý quan hệ khách hàng, phân bổ công việc, HRM & Tài chính.',
      'Trụ cột 2 - ViOne Connect App (Mobile & PWA): Ứng dụng di động dành cho lãnh đạo, danh thiếp số NFC, sàn giao thương kết nối đối tác.',
      'Đồng bộ dữ liệu thời gian thực: Mọi giao dịch, cơ hội kinh doanh và tin nhắn từ App được tự động đưa vào phễu chăm sóc CRM.',
      'Đa nền tảng linh hoạt: Web Desktop, Mobile App iOS (TestFlight / IPA / WebClip), Android APK và PWA hiện đại.'
    ]
  },
  {
    tag: 'TRỤ CỘT CRM WEB',
    title: 'QUẢN TRỊ BÁN HÀNG B2B & PHỄU KINH DOANH KANBAN',
    subtitle: 'Chuyển Đổi Tối Đa Khách Hàng Tiềm Năng Thành Hợp Đồng Doanh Số Thực Tế',
    bullets: [
      'Hồ sơ khách hàng 360 độ: Lưu trữ lịch sử liên hệ, mã số thuế, báo giá, hợp đồng và công nợ trên một màn hình duy nhất.',
      'Kanban Deals trực quan: Kéo thả linh hoạt qua 5 giai đoạn: Mới tiếp cận → Khảo sát nhu cầu → Báo giá → Đàm phán → Chốt hợp đồng.',
      'Cảnh báo cơ hội bỏ quên: Trí tuệ nhân tạo AI tự động phát hiện các thỏa thuận quá 7 ngày không tương tác để nhắc nhở nhân viên.',
      'Báo cáo doanh số tự động: Biểu đồ tăng trưởng dòng tiền, tỷ lệ chuyển đổi sales và xếp hạng thành tích kinh doanh realtime.'
    ]
  },
  {
    tag: 'TRỤ CỘT VẬN HÀNH',
    title: 'QUY TRÌNH TỰ ĐỘNG, CHẤM CÔNG GPS & TÀI CHÍNH 3 CẤP',
    subtitle: 'Số Hóa Toàn Diện Bộ Máy Nhân Sự, Tối Ưu Hóa Chi Phí Và Kiểm Soát Dòng Tiền',
    bullets: [
      'Giao việc & Quản trị tiến độ: Phân công nhiệm vụ theo phòng ban, đặt hạn chót (Deadline), theo dõi tỷ lệ hoàn thành KPI.',
      'Chấm công GPS di động: Nhân viên điểm danh trên Mobile App qua tọa độ định vị bán kính văn phòng, chống giả mạo vị trí.',
      'Phê duyệt tài chính 3 cấp: Quy trình thu - chi chặt chẽ: Nhân viên đề xuất → Trưởng phòng kiểm duyệt → Giám đốc/Kế toán trưởng duyệt chi.',
      'Đối soát ngân hàng tự động: Tích hợp VietQR nạp/rút tiền, cập nhật trạng thái hóa đơn tức thì mà không cần nhập liệu thủ công.'
    ]
  },
  {
    tag: 'TRỤ CỘT MOBILE CONNECT',
    title: 'THẺ HỘI VIÊN DOANH NHÂN NFC & DANH THIẾP ĐIỆN TỬ',
    subtitle: 'Trải Nghiệm Đẳng Cấp Thượng Lưu Với Bottom Sheet Vuốt Tay Cong Tròn Trực Quan',
    bullets: [
      'Thẻ Hội viên Doanh nhân số: Chạm vào thẻ ở trang chủ để mở popup cong tròn mềm mại (border-radius 36px) từ dưới lên.',
      'Thao tác vuốt tay mượt mà: Người dùng có thể vuốt tay xuống để đóng popup tự nhiên tương tự giao diện iOS cao cấp nhất.',
      'Chia sẻ danh thiếp số 1 chạm: Tích hợp chíp NFC và mã QR cá nhân hóa, trao đổi thông tin liên hệ không cần in danh thiếp giấy.',
      'Huy hiệu định danh kim cương: Thể hiện uy tín thương hiệu cá nhân của doanh nhân trong cộng đồng giao thương.'
    ]
  },
  {
    tag: 'MẠNG XÃ HỘI DOANH NHÂN',
    title: 'SÀN GIAO THƯƠNG B2B & KẾT NỐI CUNG CẦU THÔNG MINH',
    subtitle: 'Chợ Nhu Cầu Mua Bán, Quản Lý Sự Kiện Doanh Nghiệp & QR Check-in Điểm Danh',
    bullets: [
      'Chợ Nhu cầu B2B: Đăng tin tìm nhà cung ứng, mời thầu, hoặc chào bán dịch vụ theo từng ngành nghề và khu vực địa lý.',
      'AI Đề xuất Ghép nối đối tác: Thuật toán AI phân tích từ khóa nhu cầu để tự động gợi ý nhà cung cấp phù hợp nhất cho doanh nghiệp.',
      'Kênh Chat bảo mật nội bộ: Nhắn tin trao đổi hợp tác kinh doanh trực tiếp giữa các CEO với mã hóa dữ liệu an toàn.',
      'Sự kiện & Check-in QR: Khám phá lịch hội thảo, kết nối đại hội giao thương và quét mã QR tại bàn tiếp đón để điểm danh tức thì.'
    ]
  },
  {
    tag: 'ĐỘT PHÁ CÀI ĐẶT IOS',
    title: 'GIẢI PHÁP APPLE WEBCLIP (.MOBILECONFIG) CÀI ĐẶT 1 CHẠM',
    subtitle: 'Cài Đặt Trực Tiếp Ứng Dụng Ra Màn Hình Chính iOS Tương Tự File APK Trên Android',
    bullets: [
      'Vấn đề cũ: iOS Safari không hỗ trợ nút cài đặt tự động tương tự Android Chrome, buộc người dùng phải tìm menu chia sẻ thủ công.',
      'Đột phá mới: Cung cấp file cấu hình Apple WebClip Profile chuẩn (vione_ios_install.mobileconfig) tải về trực tiếp từ Safari.',
      'Quy trình 1-chạm: Tải file → Mở Cài đặt iOS → Bấm "Cài đặt" → Icon ViOne màu vàng kim xuất hiện ngay tại Màn hình chính.',
      'Trải nghiệm Native: Chạy toàn màn hình (FullScreen), không thanh điều hướng trình duyệt, tải siêu tốc và nhận thông báo đẩy.'
    ]
  },
  {
    tag: 'NỀN TẢNG BẢO MẬT',
    title: 'MA TRẬN PHÂN QUYỀN 7x6, BẢO MẬT & KIẾN TRÚC MULTI-TENANT',
    subtitle: 'Hạ Tầng Điện Toán Đám Mây Sẵn Sàng Mở Rộng Cho Hàng Chục Nghìn Doanh Nghiệp',
    bullets: [
      'Ma trận phân quyền 7x6: Quản lý chi tiết 7 nhóm quyền trên 6 vai trò: System Admin, Doanh nghiệp, Chi nhánh, Sales, Kế toán, Hội viên.',
      'Kiến trúc Multi-Tenant: Tách biệt dữ liệu tuyệt đối giữa các doanh nghiệp, bảo vệ bí mật kinh doanh và cơ sở khách hàng.',
      'Bảo mật tiêu chuẩn quốc tế: Mã hóa AES-256 dữ liệu lưu trữ, SSL/TLS đường truyền, xác thực đa yếu tố (MFA/OTP).',
      'Lộ trình triển khai linh hoạt: Khởi tạo doanh nghiệp mới chỉ trong 60 giây, hỗ trợ đào tạo và bàn giao tài liệu kỹ thuật trọn gói.'
    ]
  }
];

// 1. Tạo bản HTML Slide
console.log('>>> [1] Tao ban HTML Slide...');
let htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SLIDE THUYẾT TRÌNH HỆ THỐNG VÀ APP VIONE TOÀN DIỆN</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #07090E; color: #F8FAFC; font-family: 'Be Vietnam Pro', sans-serif; display: flex; flex-direction: column; align-items: center; padding: 30px 20px; }
    .header-bar { width: 100%; max-width: 1200px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid rgba(216,178,130,0.2); }
    .brand { font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 800; color: #D8B282; letter-spacing: 1px; }
    .slide-deck { width: 100%; max-width: 1200px; display: flex; flex-direction: column; gap: 40px; }
    .slide {
      background: radial-gradient(circle at 10% 20%, #0F172A 0%, #07090E 100%);
      border: 1px solid rgba(216, 178, 130, 0.25);
      border-radius: 20px;
      padding: 45px 55px;
      aspect-ratio: 16 / 9;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 15px 40px rgba(0,0,0,0.6);
      position: relative;
      overflow: hidden;
      page-break-after: always;
    }
    .slide::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 6px;
      background: linear-gradient(90deg, #D8B282 0%, #F59E0B 50%, #003B95 100%);
    }
    .eyebrow {
      display: inline-block;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #D8B282;
      text-transform: uppercase;
      background: rgba(216, 178, 130, 0.12);
      border: 1px solid rgba(216, 178, 130, 0.3);
      padding: 5px 14px;
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
      font-size: 15px;
      color: #94A3B8;
      font-weight: 400;
    }
    .slide-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin: 25px 0;
    }
    .bullet-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .bullet-list li {
      font-size: 16px;
      line-height: 1.6;
      color: #E2E8F0;
      position: relative;
      padding-left: 32px;
    }
    .bullet-list li::before {
      content: '◆';
      position: absolute;
      left: 0;
      color: #D8B282;
      font-size: 16px;
      top: 1px;
    }
    .slide-footer {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid rgba(255,255,255,0.1);
      padding-top: 16px;
      font-size: 12px;
      color: #64748B;
    }
    @media print {
      body { background: transparent; padding: 0; }
      .header-bar { display: none; }
      .slide-deck { gap: 0; }
      .slide { border-radius: 0; box-shadow: none; aspect-ratio: auto; height: 100vh; }
    }
  </style>
</head>
<body>
  <div class="header-bar">
    <div class="brand">VIONE CORPORATION · MASTER PRESENTATION 6.0</div>
    <div style="font-size: 13px; color: #94A3B8;">Phiên bản thuyết trình: Tháng 10/2026</div>
  </div>
  <div class="slide-deck">
`;

slidesData.forEach((s, idx) => {
  htmlContent += `
    <section class="slide" id="slide-${idx + 1}">
      <div class="slide-header">
        <div class="eyebrow">${s.tag}</div>
        <h2 class="title">${s.title}</h2>
        <div class="subtitle">${s.subtitle}</div>
      </div>
      <div class="slide-content">
        <ul class="bullet-list">
          ${s.bullets.map(b => `<li>${b}</li>`).join('')}
        </ul>
      </div>
      <div class="slide-footer">
        <span>Hệ Sinh Thái ViOne · Slide ${idx + 1} / ${slidesData.length}</span>
        <span>Bản quyền © 2026 ViOne Corporation</span>
      </div>
    </section>
  `;
});

htmlContent += `
  </div>
</body>
</html>
`;

const htmlSlideFile = path.join(docDir, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_VIONE_TOAN_DIEN.html');
fs.writeFileSync(htmlSlideFile, htmlContent, 'utf8');
console.log('  -> Da luu file HTML slide tai:', htmlSlideFile);

// 2. Tạo bản PowerPoint PPTX 16:9
console.log('>>> [2] Tao ban PowerPoint PPTX 16:9...');
const pptx = new pptxgen();
pptx.layout = 'LAYOUT_16x9';
pptx.author = 'Senior Business Analyst & Solution Architect';
pptx.company = 'ViOne Corporation';
pptx.title = 'Hệ Thống Quản Trị Doanh Nghiệp Toàn Diện ViOne & App ViOne Connect';

slidesData.forEach((s, idx) => {
  const slide = pptx.addSlide();
  slide.background = { color: '07090E' };

  // Thanh line trên cùng
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 0.1,
    fill: { color: 'D8B282' },
    line: { color: 'D8B282', width: 0 }
  });

  // Eyebrow Tag
  slide.addText(s.tag, {
    x: 0.8, y: 0.5, w: 5.0, h: 0.35,
    fontFace: 'Arial', fontSize: 11, bold: true, color: 'D8B282',
    letterSpacing: 2
  });

  // Title
  slide.addText(s.title, {
    x: 0.8, y: 0.9, w: 11.5, h: 0.65,
    fontFace: 'Arial', fontSize: 22, bold: true, color: 'FFFFFF'
  });

  // Subtitle
  slide.addText(s.subtitle, {
    x: 0.8, y: 1.55, w: 11.5, h: 0.45,
    fontFace: 'Arial', fontSize: 13, italic: true, color: '94A3B8'
  });

  // Bullets Content Box
  const bulletItems = s.bullets.map(b => ({
    text: b,
    options: { fontSize: 14, color: 'E2E8F0', bullet: true, breakLine: true, fontFace: 'Arial' }
  }));

  slide.addText(bulletItems, {
    x: 0.8, y: 2.3, w: 11.5, h: 4.2,
    valign: 'top', lineSpacing: 26
  });

  // Footer Line
  slide.addShape(pptx.ShapeType.line, {
    x: 0.8, y: 6.8, w: 11.7, h: 0,
    line: { color: '334155', width: 1 }
  });

  // Footer Text Left
  slide.addText(`Hệ Sinh Thái ViOne · Slide ${idx + 1} / ${slidesData.length}`, {
    x: 0.8, y: 6.9, w: 5.0, h: 0.3,
    fontFace: 'Arial', fontSize: 10, color: '64748B'
  });

  // Footer Text Right
  slide.addText('Bản quyền © 2026 ViOne Corporation', {
    x: 7.5, y: 6.9, w: 5.0, h: 0.3,
    fontFace: 'Arial', fontSize: 10, align: 'right', color: '64748B'
  });
});

const pptxSlideFile = path.join(docDir, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_VIONE_TOAN_DIEN.pptx');
pptx.writeFile({ fileName: pptxSlideFile }).then(fileName => {
  console.log('  -> Da xuat ban file PPTX thanh cong tai:', fileName);

  // Copy sang public docs
  fs.copyFileSync(htmlSlideFile, path.join(publicDocsDir, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_VIONE_TOAN_DIEN.html'));
  fs.copyFileSync(pptxSlideFile, path.join(publicDocsDir, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_VIONE_TOAN_DIEN.pptx'));
  console.log('>>> [SLIDE VIONE MASTER 6.0] Da copy sang public/docs. HOAN TAT 100%!');
}).catch(err => {
  console.error('Loi khi tao PPTX:', err);
});
