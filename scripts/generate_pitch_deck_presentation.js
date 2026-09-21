const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'document');
const EVIDENCE_DIR = path.join(OUT_DIR, 'images', 'evidence');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Executive Palette (Royal Navy, Warm Gold, Platinum White)
const C = {
  NAVY_DARK: '0A1A3A',
  NAVY_PRIMARY: '003B95',
  NAVY_CARD: '132A56',
  NAVY_HOVER: '002B70',
  GOLD_ACCENT: 'F59E0B',
  GOLD_DARK: 'D97706',
  GOLD_LIGHT: 'FEF3C7',
  GOLD_BORDER: 'FDE68A',
  BG_LIGHT: 'F8FAFC',
  WHITE: 'FFFFFF',
  BORDER_SUBTLE: 'E2E8F0',
  BORDER_FOCUS: 'CBD5E1',
  TEXT_DARK: '0F172A',
  TEXT_BODY: '334155',
  TEXT_MUTED: '64748B',
  EMERALD: '059669',
  EMERALD_BG: 'ECFDF5',
  ROSE: 'E11D48',
  ROSE_BG: 'FFF1F2',
  BLUE_BG: 'EFF6FF',
};

function getImageBase64(name) {
  const p = path.join(EVIDENCE_DIR, name);
  if (fs.existsSync(p)) {
    const data = fs.readFileSync(p);
    return `image/png;base64,${data.toString('base64')}`;
  }
  return null;
}

function addSlideFooter(slide, pres, isDark = false) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 7.0, w: 11.73, h: 0.02,
    fill: { color: isDark ? '2A3E66' : C.BORDER_SUBTLE }
  });
  slide.addText('Hệ Sinh Thái Chuyển Đổi Số Toàn Diện · CLB Doanh Nhân CEO 1983 · VIONE Ecosystem', {
    x: 0.8, y: 7.05, w: 7.5, h: 0.3,
    color: isDark ? '94A3B8' : C.TEXT_MUTED, fontSize: 9.5, fontFace: 'Calibri'
  });
  slide.addText('Bản Quyền © 2026 CLB Doanh Nhân CEO 1983 · HanoiBA', {
    x: 8.5, y: 7.05, w: 4.03, h: 0.3,
    color: isDark ? '94A3B8' : C.TEXT_MUTED, fontSize: 9.5, align: 'right', fontFace: 'Calibri'
  });
}

function addSlideHeader(slide, pres, eyebrow, title, subtitle, isDark = false) {
  slide.background = { color: isDark ? C.NAVY_DARK : C.BG_LIGHT };

  // Top Accent Strip
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 0.08,
    fill: { color: C.GOLD_ACCENT }
  });

  // Eyebrow badge
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 0.45, w: 3.4, h: 0.32,
    fill: { color: isDark ? C.GOLD_ACCENT : C.NAVY_PRIMARY },
    roundRadio: 0.08
  });
  slide.addText(eyebrow, {
    x: 0.8, y: 0.45, w: 3.4, h: 0.32,
    color: isDark ? C.NAVY_DARK : C.WHITE, bold: true, fontSize: 10, align: 'center', valign: 'middle', fontFace: 'Calibri'
  });

  // Title
  slide.addText(title, {
    x: 0.8, y: 0.85, w: 11.73, h: 0.65,
    color: isDark ? C.WHITE : C.NAVY_PRIMARY, bold: true, fontSize: 21, fontFace: 'Calibri'
  });

  // Subtitle
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.8, y: 1.5, w: 11.73, h: 0.4,
      color: isDark ? 'CBD5E1' : C.TEXT_MUTED, fontSize: 12, italic: true, fontFace: 'Calibri'
    });
  }
}

async function buildMasterPresentation() {
  console.log('>>> Generating 16-Slide Master Executive Pitch Deck (.pptx, .html, .md)...');
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9'; // 13.33 x 7.5 in
  pres.title = 'Hệ Sinh Thái Chuyển Đổi Số CLB Doanh Nhân CEO 1983';
  pres.author = 'Ban Thư Ký CLB Doanh Nhân CEO 1983';
  pres.company = 'VIONE Ecosystem · HanoiBA';

  // ---------------------------------------------------------------------------
  // SLIDE 1: COVER (Dark Luxury Navy)
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    slide.background = { color: C.NAVY_DARK };

    slide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0, w: 13.33, h: 0.12,
      fill: { color: C.GOLD_ACCENT }
    });

    slide.addShape(pres.ShapeType.rect, {
      x: 1.0, y: 1.1, w: 5.4, h: 0.4,
      fill: { color: C.NAVY_CARD },
      line: { color: C.GOLD_ACCENT, width: 1.5 },
      roundRadio: 0.1
    });
    slide.addText('HỆ SINH THÁI CHUYỂN ĐỔI SỐ TOÀN DIỆN HIỆP HỘI', {
      x: 1.0, y: 1.1, w: 5.4, h: 0.4,
      color: C.GOLD_ACCENT, bold: true, fontSize: 11, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });

    slide.addText('VIONE ECOSYSTEM · CLB DOANH NHÂN CEO 1983', {
      x: 1.0, y: 1.7, w: 11.33, h: 1.1,
      color: C.WHITE, bold: true, fontSize: 32, fontFace: 'Calibri'
    });

    slide.addText('Giải pháp Quản trị Hiệp hội Tối cao (Web CRM) song hành Nền tảng Giao thương B2B Đẳng cấp (Mobile App)', {
      x: 1.0, y: 2.8, w: 11.33, h: 0.6,
      color: 'CBD5E1', fontSize: 15, fontFace: 'Calibri'
    });

    const cards = [
      { num: '01', title: 'Web CRM Quản Trị', desc: 'Trung tâm kiểm soát dữ liệu hội viên, tài chính quỹ hội, sự kiện và đối soát tự động theo thời gian thực.' },
      { num: '02', title: 'Mobile App Doanh Nhân', desc: 'Văn phòng số bỏ túi: Thẻ VIP 3D, Radar kết nối, gian hàng Marketplace & mạng xã hội trao đổi cơ hội.' },
      { num: '03', title: 'Đồng Bộ Hai Chiều Realtime', desc: 'Hội viên thao tác trên App -> Tự động đổ về CRM xét duyệt -> CRM đẩy thông báo và phân quyền tức thì xuống App.' },
    ];
    cards.forEach((c, idx) => {
      const x = 1.0 + idx * 3.9;
      slide.addShape(pres.ShapeType.rect, {
        x, y: 3.7, w: 3.6, h: 2.4,
        fill: { color: C.NAVY_CARD },
        line: { color: '2A3E66', width: 1.2 },
        roundRadio: 0.12
      });
      slide.addText(c.num, {
        x: x + 0.25, y: 3.9, w: 0.8, h: 0.4,
        color: C.GOLD_ACCENT, bold: true, fontSize: 20, fontFace: 'Calibri'
      });
      slide.addText(c.title, {
        x: x + 0.25, y: 4.4, w: 3.1, h: 0.4,
        color: C.WHITE, bold: true, fontSize: 14, fontFace: 'Calibri'
      });
      slide.addText(c.desc, {
        x: x + 0.25, y: 4.85, w: 3.1, h: 1.1,
        color: '94A3B8', fontSize: 11, fontFace: 'Calibri'
      });
    });

    slide.addText('CLB Doanh Nhân CEO 1983 · Trực thuộc Hội Doanh Nhân Trẻ Hà Nội (HanoiBA) · ceo1983.com', {
      x: 1.0, y: 6.7, w: 11.33, h: 0.4,
      color: '64748B', fontSize: 11, italic: true, fontFace: 'Calibri'
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 2: THỰC TRẠNG & ĐIỂM ĐAU (4 Pain Points)
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'THỰC TRẠNG & ĐIỂM ĐAU', 'Điểm Đau Của Các Hiệp Hội & CLB Doanh Nghiệp Truyền Thống', 'Các thách thức lớn trong vận hành thủ công dẫn tới suy giảm tương tác và thất thoát nguồn lực');

    const pains = [
      {
        title: 'Quản Lý Dữ Liệu Rời Rạc & Trôi Bài',
        desc: 'Thông tin hội viên lưu phân tán trên nhiều file Excel cá nhân. Nhóm Zalo thường xuyên trôi tin nhắn, tài liệu quan trọng và nhu cầu hợp tác không thể tìm kiếm lại.',
        icon: '📊'
      },
      {
        title: 'Thu Phí & Quản Trị Quỹ Thủ Công',
        desc: 'Ban Thư ký mất 70% thời gian đối soát sao kê ngân hàng, nhắn tin nhắc nộp hội phí từng người thủ công. Thiếu báo cáo thu - chi minh bạch định kỳ gửi Ban Điều Hành.',
        icon: '💳'
      },
      {
        title: 'Tổ Chức Sự Kiện Tắc Nghẽn Check-in',
        desc: 'Đăng ký sự kiện qua Google Form dễ trùng lặp. Khâu đón tiếp tại cửa ùn tắc vì tìm tên trên giấy in. Không có vé điện tử bảo mật và công cụ Lucky Draw tự động.',
        icon: '🎟️'
      },
      {
        title: 'Giao Thương B2B Kém Hiệu Quả',
        desc: 'Hội viên không nắm rõ thế mạnh, sản phẩm dịch vụ của nhau. Nhu cầu mua sắm nội khối bị bỏ lỡ, thiếu nền tảng số bảo đảm uy tín và ghi nhận giá trị deal kết nối.',
        icon: '🤝'
      }
    ];

    pains.forEach((p, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.8 + col * 5.95;
      const y = 2.1 + row * 2.35;

      slide.addShape(pres.ShapeType.rect, {
        x, y, w: 5.75, h: 2.15,
        fill: { color: C.WHITE },
        line: { color: C.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.1
      });

      slide.addShape(pres.ShapeType.rect, {
        x: x + 0.25, y: y + 0.25, w: 0.65, h: 0.65,
        fill: { color: C.ROSE_BG },
        line: { color: 'FECDD3' },
        roundRadio: 0.08
      });
      slide.addText(p.icon, {
        x: x + 0.25, y: y + 0.25, w: 0.65, h: 0.65,
        fontSize: 16, align: 'center', valign: 'middle'
      });

      slide.addText(p.title, {
        x: x + 1.05, y: y + 0.25, w: 4.45, h: 0.35,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 13.5, fontFace: 'Calibri'
      });

      slide.addText(p.desc, {
        x: x + 1.05, y: y + 0.65, w: 4.45, h: 1.3,
        color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri'
      });
    });

    addSlideFooter(slide, pres);
  }

  // ---------------------------------------------------------------------------
  // SLIDE 3: TẦM NHÌN & SỨ MỆNH (4 Strategic Pillars)
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'TẦM NHÌN & SỨ MỆNH', 'Chiến Lược Chuyển Đổi Số: Gắn Kết - Chia Sẻ - Đồng Hành - Phát Triển', 'Xây dựng nền tảng công nghệ chuyên biệt, định vị CLB Doanh Nhân CEO 1983 dẫn đầu chuyển đổi số hiệp hội');

    const pillars = [
      {
        num: '01',
        title: 'GẮN KẾT BỀN CHẶT',
        desc: 'Số hóa 100% hồ sơ hội viên thành định danh số. Thẻ VIP 3D và danh bạ thông minh giúp doanh nhân kết nối trong 1 chạm.',
        badge: 'Định danh số'
      },
      {
        num: '02',
        title: 'CHIA SẺ CƠ HỘI',
        desc: 'Bảng tin Trao cơ hội & Sàn B2B thúc đẩy giao thương nội khối, chuyển giao dự án và ưu đãi chéo giữa các hội viên.',
        badge: 'B2B Commerce'
      },
      {
        num: '03',
        title: 'ĐỒNG HÀNH VẬN HÀNH',
        desc: 'Web CRM đồng hành cùng Ban Thư ký & Ban Điều hành: tự động hóa đối soát tài chính, hội phí, soát vé sự kiện thông minh.',
        badge: 'Tự động hóa CRM'
      },
      {
        num: '04',
        title: 'PHÁT TRIỂN BỨT PHÁ',
        desc: 'Báo cáo KPI phân tích thời gian thực giúp Ban Chấp Hành ra quyết định chiến lược, mở rộng mạng lưới hội viên chất lượng cao.',
        badge: 'Ra quyết định số'
      }
    ];

    pillars.forEach((p, idx) => {
      const x = 0.8 + idx * 2.98;
      slide.addShape(pres.ShapeType.rect, {
        x, y: 2.1, w: 2.8, h: 4.65,
        fill: { color: C.WHITE },
        line: { color: idx === 2 ? C.GOLD_ACCENT : C.BORDER_SUBTLE, width: idx === 2 ? 1.8 : 1.2 },
        roundRadio: 0.12
      });

      slide.addShape(pres.ShapeType.rect, {
        x: x + 0.2, y: 2.35, w: 1.4, h: 0.3,
        fill: { color: C.BLUE_BG },
        roundRadio: 0.06
      });
      slide.addText(p.badge, {
        x: x + 0.2, y: 2.35, w: 1.4, h: 0.3,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 9.5, align: 'center', valign: 'middle', fontFace: 'Calibri'
      });

      slide.addText(p.num, {
        x: x + 0.2, y: 2.8, w: 1.0, h: 0.6,
        color: C.GOLD_ACCENT, bold: true, fontSize: 26, fontFace: 'Calibri'
      });

      slide.addText(p.title, {
        x: x + 0.2, y: 3.45, w: 2.4, h: 0.45,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri'
      });

      slide.addText(p.desc, {
        x: x + 0.2, y: 4.0, w: 2.4, h: 2.5,
        color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri'
      });
    });

    addSlideFooter(slide, pres);
  }

  // ---------------------------------------------------------------------------
  // SLIDE 4: MỐI QUAN HỆ TƯƠNG HỖ 2 CHIỀU: CRM QUẢN TRỊ ⇄ APP HIỆP HỘI
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'KIẾN TRÚC ĐỒNG BỘ 2 CHIỀU', 'Mối Quan Hệ Tương Hỗ Hai Chiều Giữa Web CRM & Mobile App Hiệp Hội', 'Web CRM và Mobile App hoạt động thống nhất trên 1 cơ sở dữ liệu dùng chung, đồng bộ hóa thời gian thực');

    // Left Column: Web CRM
    slide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 2.1, w: 4.6, h: 4.65,
      fill: { color: C.WHITE },
      line: { color: C.NAVY_PRIMARY, width: 1.5 },
      roundRadio: 0.12
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 1.05, y: 2.3, w: 4.1, h: 0.4,
      fill: { color: C.NAVY_PRIMARY },
      roundRadio: 0.08
    });
    slide.addText('WEB CRM QUẢN TRỊ (BỘ NÃO ĐIỀU HÀNH)', {
      x: 1.05, y: 2.3, w: 4.1, h: 0.4,
      color: C.WHITE, bold: true, fontSize: 11, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });
    const crmPoints = [
      'Tiếp nhận đơn đăng ký hội viên từ Landing & App.',
      'Phê duyệt và cấp phát quyền hạn đa tầng (Admin, BCH, Hội viên).',
      'Khởi tạo sự kiện, thiết lập sơ đồ ghế Cinema và bảng giá vé.',
      'Duyệt gian hàng sản phẩm B2B và giám sát deal cơ hội.',
      'Quản lý thu chi, đối soát thanh toán tự động VietQR & niên phí.'
    ];
    crmPoints.forEach((pt, i) => {
      slide.addText(`• ${pt}`, {
        x: 1.05, y: 2.85 + i * 0.75, w: 4.1, h: 0.7,
        color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri'
      });
    });

    // Center Column: Bi-directional Realtime Sync
    slide.addShape(pres.ShapeType.rect, {
      x: 5.65, y: 2.4, w: 2.03, h: 4.0,
      fill: { color: C.NAVY_CARD },
      line: { color: C.GOLD_ACCENT, width: 1.5 },
      roundRadio: 0.12
    });
    slide.addText('ĐỒNG BỘ\n2 CHIỀU\nREALTIME', {
      x: 5.75, y: 2.6, w: 1.83, h: 0.9,
      color: C.GOLD_ACCENT, bold: true, fontSize: 13, align: 'center', fontFace: 'Calibri'
    });
    slide.addText('⇄', {
      x: 5.75, y: 3.55, w: 1.83, h: 0.6,
      color: C.WHITE, bold: true, fontSize: 28, align: 'center', fontFace: 'Calibri'
    });
    slide.addText('Hội viên gửi:\n• Đăng ký sự kiện\n• Đăng sản phẩm\n• Gửi báo giá VIP\n• Gửi bày tỏ quan tâm\n\nCRM phản hồi:\n• Cập nhật trạng thái\n• Đẩy thông báo Push\n• Cấp vé QR Pass', {
      x: 5.75, y: 4.2, w: 1.83, h: 2.0,
      color: 'CBD5E1', fontSize: 9.5, align: 'center', fontFace: 'Calibri'
    });

    // Right Column: Mobile App
    slide.addShape(pres.ShapeType.rect, {
      x: 7.93, y: 2.1, w: 4.6, h: 4.65,
      fill: { color: C.WHITE },
      line: { color: C.GOLD_ACCENT, width: 1.5 },
      roundRadio: 0.12
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 8.18, y: 2.3, w: 4.1, h: 0.4,
      fill: { color: C.GOLD_DARK },
      roundRadio: 0.08
    });
    slide.addText('MOBILE APP HIỆP HỘI (VĂN PHÒNG HỘI VIÊN)', {
      x: 8.18, y: 2.3, w: 4.1, h: 0.4,
      color: C.WHITE, bold: true, fontSize: 11, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });
    const appPoints = [
      'Nhận định danh số & Thẻ VIP 3D cá nhân hóa tức thời.',
      'Nhận vé Pass điện tử & Check-in QR 1 giây tại cửa sự kiện.',
      'Đăng sản phẩm lên Sàn B2B: Tác giả tự sửa/xóa bài, đối tác nhận báo giá VIP.',
      'Đăng cơ hội kết nối: Xem danh sách hội viên quan tâm theo thời gian thực.',
      'Giao tiếp nội bộ: Trò chuyện 1-1, gọi thoại, gửi vị trí và danh thiếp số.'
    ];
    appPoints.forEach((pt, i) => {
      slide.addText(`• ${pt}`, {
        x: 8.18, y: 2.85 + i * 0.75, w: 4.1, h: 0.7,
        color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri'
      });
    });

    addSlideFooter(slide, pres);
  }

  // ---------------------------------------------------------------------------
  // SLIDE 5: TRỤ CỘT 1 - TỔNG QUAN WEB CRM QUẢN TRỊ (Ảnh Tổng Quan CRM)
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'BỘ NÃO ĐIỀU HÀNH CRM', 'Web CRM Quản Trị Trung Tâm: Kiểm Soát Toàn Bộ Dữ Liệu Hội', 'Dashboard điều hành thông minh tổng hợp chỉ số KPI, tài chính quỹ hội và sự kiện theo thời gian thực');

    // Left Column: Description
    slide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 2.1, w: 5.2, h: 4.65,
      fill: { color: C.WHITE },
      line: { color: C.BORDER_SUBTLE, width: 1.2 },
      roundRadio: 0.1
    });

    slide.addText('Các Tính Năng Trọng Tâm Của Web CRM:', {
      x: 1.05, y: 2.3, w: 4.7, h: 0.35,
      color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri'
    });

    const crmFeatures = [
      { t: 'KPI Dashboard Thời Gian Thực:', d: 'Theo dõi tổng số hội viên chính thức, doanh thu sự kiện, tỷ lệ đóng phí và cơ hội B2B đang mở.' },
      { t: 'Quản Lý Hội Viên & Phân Quyền:', d: 'Hồ sơ 360° doanh nghiệp, phân quyền đa tầng (Admin hệ thống, Ban Chấp Hành, Hội viên chính thức, Khách mời).' },
      { t: 'Trung Tâm Soát Vé & Sự Kiện:', d: 'Cấu hình vé miễn phí 0đ và thu phí VietQR tự động; sơ đồ ghế Cinema trực quan; đối soát check-in tức thì.' },
      { t: 'Kiểm Duyệt Marketplace & Cơ Hội:', d: 'Giám sát sàn giao thương, duyệt tin đăng sản phẩm và theo dõi giá trị deal kết nối giữa các thành viên.' }
    ];

    crmFeatures.forEach((f, i) => {
      slide.addText(`✔ ${f.t}`, {
        x: 1.05, y: 2.75 + i * 0.95, w: 4.7, h: 0.3,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 11.5, fontFace: 'Calibri'
      });
      slide.addText(f.d, {
        x: 1.25, y: 3.05 + i * 0.95, w: 4.5, h: 0.6,
        color: C.TEXT_BODY, fontSize: 10.5, fontFace: 'Calibri'
      });
    });

    // Right Column: Actual Screenshot of CRM Dashboard
    slide.addShape(pres.ShapeType.rect, {
      x: 6.2, y: 2.1, w: 6.33, h: 4.65,
      fill: { color: C.WHITE },
      line: { color: C.BORDER_SUBTLE, width: 1.2 },
      roundRadio: 0.1
    });

    const crmImg = getImageBase64('crm_02_dashboard_kpi.png') || getImageBase64('sub_06_crm_dashboard_kpi.png');
    if (crmImg) {
      slide.addImage({
        data: crmImg,
        x: 6.35, y: 2.25, w: 6.03, h: 4.35,
        sizing: { type: 'contain' }
      });
    }

    addSlideFooter(slide, pres);
  }

  // ---------------------------------------------------------------------------
  // SLIDE 6: QUẢN LÝ HỘI VIÊN & PHÂN QUYỀN ĐA TẦNG TRÊN CRM
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'QUẢN TRỊ NHÂN SỰ HỘI', 'Quản Lý Hồ Sơ Hội Viên 360° & Phân Quyền Vai Trò Đa Tầng', 'Hồ sơ doanh nghiệp chuẩn hóa, mã hóa an toàn, phân quyền rõ ràng giữa Ban Lãnh Đạo và Hội Viên');

    // Left Column: Details
    slide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 2.1, w: 5.2, h: 4.65,
      fill: { color: C.WHITE },
      line: { color: C.BORDER_SUBTLE, width: 1.2 },
      roundRadio: 0.1
    });

    slide.addText('Chuẩn Hóa Dữ Liệu Doanh Nhân CEO 1983:', {
      x: 1.05, y: 2.3, w: 4.7, h: 0.35,
      color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri'
    });

    const memberFeatures = [
      { t: 'Mã Hội Viên & Profile Chuẩn Hóa:', d: 'Cấp mã định danh duy nhất (VD: M1983-007), lưu trữ thông tin công ty, ngành nghề, mã số thuế, chức vụ và hotline.' },
      { t: 'Phân Quyền Vai Trò (Roles & Permissions):', d: 'Tách bạch quyền hạn: Admin tối cao duyệt hội viên & sự kiện; BCH tra cứu báo cáo; Hội viên khai thác giao thương.' },
      { t: 'Xuất Dữ Liệu Excel & Đối Soát:', d: 'Công cụ trích xuất danh sách hội viên, lịch sử nộp quỹ, tình trạng hoạt động chỉ trong 1 click phục vụ đại hội.' },
      { t: 'Đồng Bộ Trạng Thái Tức Thời Với App:', d: 'Khi Admin kích hoạt hoặc thay đổi chức danh trên CRM, thẻ VIP và quyền truy cập trên App tự động cập nhật ngay.' }
    ];

    memberFeatures.forEach((f, i) => {
      slide.addText(`✔ ${f.t}`, {
        x: 1.05, y: 2.75 + i * 0.95, w: 4.7, h: 0.3,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 11.5, fontFace: 'Calibri'
      });
      slide.addText(f.d, {
        x: 1.25, y: 3.05 + i * 0.95, w: 4.5, h: 0.6,
        color: C.TEXT_BODY, fontSize: 10.5, fontFace: 'Calibri'
      });
    });

    // Right Column: Actual Screenshot of Member Management
    slide.addShape(pres.ShapeType.rect, {
      x: 6.2, y: 2.1, w: 6.33, h: 4.65,
      fill: { color: C.WHITE },
      line: { color: C.BORDER_SUBTLE, width: 1.2 },
      roundRadio: 0.1
    });

    const memImg = getImageBase64('crm_03_members_list.png') || getImageBase64('04_crm_members_management.png');
    if (memImg) {
      slide.addImage({
        data: memImg,
        x: 6.35, y: 2.25, w: 6.03, h: 4.35,
        sizing: { type: 'contain' }
      });
    }

    addSlideFooter(slide, pres);
  }

  // ---------------------------------------------------------------------------
  // SLIDE 7: TRỤ CỘT 2 - TỔNG QUAN MOBILE APP HIỆP HỘI (Ảnh Trang Chủ App)
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'VĂN PHÒNG SỐ BỎ TÚI', 'Tổng Quan Mobile App Hiệp Hội CLB Doanh Nhân CEO 1983', 'Trang chủ thiết kế sang trọng, tối ưu trải nghiệm doanh nhân với các phân hệ nghiệp vụ 1 chạm');

    // Left Column: Description
    slide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 2.1, w: 5.2, h: 4.65,
      fill: { color: C.WHITE },
      line: { color: C.BORDER_SUBTLE, width: 1.2 },
      roundRadio: 0.1
    });

    slide.addText('Trải Nghiệm Đẳng Cấp Doanh Nhân Trên App:', {
      x: 1.05, y: 2.3, w: 4.7, h: 0.35,
      color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri'
    });

    const appFeatures = [
      { t: 'Trang Chủ Dashboard Cá Nhân Hóa:', d: 'Hiển thị lời chào cá nhân, chức danh CLB, sự kiện sắp diễn ra gần nhất và các cơ hội kinh doanh mới nổi bật.' },
      { t: 'Thanh Điều Hướng Nghiệp Vụ 1 Chạm:', d: 'Truy cập nhanh chóng: Sự kiện & Check-in, Sàn B2B, Trao cơ hội, Danh bạ hội viên và Kênh chat mật.' },
      { t: 'Công Nghệ PWA & Native App Đồng Bộ:', d: 'Hỗ trợ tải ứng dụng mượt mà trên iOS (IPA/PWA) và Android (APK). Tự động cập nhật không cần cài lại.' },
      { t: 'Giao Diện Hai Chế Độ Sáng / Tối (Dark Mode):', d: 'Thiết kế chuẩn Luxury Gold - Royal Navy, bảo vệ thị giác và tối ưu hiển thị cho các lãnh đạo doanh nghiệp.' }
    ];

    appFeatures.forEach((f, i) => {
      slide.addText(`✔ ${f.t}`, {
        x: 1.05, y: 2.75 + i * 0.95, w: 4.7, h: 0.3,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 11.5, fontFace: 'Calibri'
      });
      slide.addText(f.d, {
        x: 1.25, y: 3.05 + i * 0.95, w: 4.5, h: 0.6,
        color: C.TEXT_BODY, fontSize: 10.5, fontFace: 'Calibri'
      });
    });

    // Right Column: Actual Screenshot of App Home
    slide.addShape(pres.ShapeType.rect, {
      x: 6.2, y: 2.1, w: 6.33, h: 4.65,
      fill: { color: C.WHITE },
      line: { color: C.BORDER_SUBTLE, width: 1.2 },
      roundRadio: 0.1
    });

    const appHomeImg = getImageBase64('app_02_home_dashboard.png') || getImageBase64('08_app_home_dashboard.png') || getImageBase64('04_app_home_compact_event.png');
    if (appHomeImg) {
      slide.addImage({
        data: appHomeImg,
        x: 6.35, y: 2.25, w: 6.03, h: 4.35,
        sizing: { type: 'contain' }
      });
    }

    addSlideFooter(slide, pres);
  }

  // ---------------------------------------------------------------------------
  // SLIDE 8: THẺ HỘI VIÊN VIP 3D & RADAR KẾT NỐI DOANH NHÂN
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'ĐỊNH DANH SỐ ĐẲNG CẤP', 'Thẻ Hội Viên VIP 3D Ánh Vàng & Radar Định Vị Không Dây', 'Giải pháp thay thế danh thiếp giấy truyền thống, nâng tầm vị thế thương hiệu cá nhân của mỗi CEO');

    // Left Column: Details
    slide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 2.1, w: 5.2, h: 4.65,
      fill: { color: C.WHITE },
      line: { color: C.BORDER_SUBTLE, width: 1.2 },
      roundRadio: 0.1
    });

    slide.addText('Công Nghệ Thẻ Điện Tử & Radar Kết Nối:', {
      x: 1.05, y: 2.3, w: 4.7, h: 0.35,
      color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri'
    });

    const cardFeatures = [
      { t: 'Thẻ VIP 3D Lật 2 Mặt Hologram:', d: 'Mặt trước khắc nổi tên, công ty, chức vụ và logo HanoiBA; mặt sau chứa mã QR định danh số mã hóa bảo mật.' },
      { t: 'Danh Thiếp Số Công Khai (Public Card):', d: 'Mở link danh thiếp bằng cách quét mã QR hoặc chạm NFC. Đối tác không cần cài app vẫn xem và lưu danh bạ 1 chạm.' },
      { t: 'Radar Quét Tìm Hội Viên Xung Quanh:', d: 'Tính năng định vị doanh nhân tham dự trong cùng phòng họp hoặc hội trường để kết nối giao lưu tức thời.' },
      { t: 'Huy Hiệu Xác Thực CLB CEO 1983:', d: 'Chứng nhận hội viên chính thức với dấu tích xanh đã thẩm định uy tín từ Ban Chấp Hành hiệp hội.' }
    ];

    cardFeatures.forEach((f, i) => {
      slide.addText(`✔ ${f.t}`, {
        x: 1.05, y: 2.75 + i * 0.95, w: 4.7, h: 0.3,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 11.5, fontFace: 'Calibri'
      });
      slide.addText(f.d, {
        x: 1.25, y: 3.05 + i * 0.95, w: 4.5, h: 0.6,
        color: C.TEXT_BODY, fontSize: 10.5, fontFace: 'Calibri'
      });
    });

    // Right Column: Actual Screenshot of VIP Card
    slide.addShape(pres.ShapeType.rect, {
      x: 6.2, y: 2.1, w: 6.33, h: 4.65,
      fill: { color: C.WHITE },
      line: { color: C.BORDER_SUBTLE, width: 1.2 },
      roundRadio: 0.1
    });

    const vipCardImg = getImageBase64('09_app_vip_card.png') || getImageBase64('sub_13_app_vip_card_front.png') || getImageBase64('sub_15_app_public_digital_card.png');
    if (vipCardImg) {
      slide.addImage({
        data: vipCardImg,
        x: 6.35, y: 2.25, w: 6.03, h: 4.35,
        sizing: { type: 'contain' }
      });
    }

    addSlideFooter(slide, pres);
  }

  // ---------------------------------------------------------------------------
  // SLIDE 9: TỰ ĐỘNG HÓA SỰ KIỆN: 2 LUỒNG MIỄN PHÍ & THU PHÍ VIETQR
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'TỰ ĐỘNG HÓA SỰ KIỆN', 'Quy Trình Sự Kiện: Cấu Hình Trên CRM, Nhận Vé Pass Trên App', 'Khép kín vòng đời sự kiện từ công bố, thu phí VietQR tự động, phát hành vé điện tử đến check-in 1 giây');

    const evCards = [
      {
        title: 'LUỒNG 1: SỰ KIỆN NỘI BỘ (MIỄN PHÍ 0Đ)',
        desc: 'Hội viên đăng ký 1 chạm -> Tự động xác thực quyền hội viên -> Cấp ngay Vé Pass điện tử chứa mã QR Check-in & Số bốc thăm may mắn.',
        badge: 'Miễn phí 0đ',
        color: C.EMERALD
      },
      {
        title: 'LUỒNG 2: HỘI THẢO THU PHÍ (VIETQR NAPAS247)',
        desc: 'Hệ thống tự động sinh mã VietQR động đúng số tiền và nội dung chuyển khoản duy nhất -> Tự động đối soát ngân hàng trong 3 giây -> Nhận vé VIP.',
        badge: 'VietQR Tự Động',
        color: C.NAVY_PRIMARY
      },
      {
        title: 'SƠ ĐỒ GHẾ NGỒI CINEMA TRỰC QUAN',
        desc: 'Sắp xếp chỗ ngồi theo từng bàn tiệc hoặc dãy ghế VIP dành riêng cho Lãnh đạo, Nhà tài trợ và Hội viên; loại bỏ hoàn toàn tình trạng nhầm lẫn vị trí.',
        badge: 'Cinema Seat Map',
        color: C.GOLD_DARK
      },
      {
        title: 'CHECK-IN QR 1 GIÂY & LUCKY DRAW',
        desc: 'Lễ tân quét mã QR qua camera điện thoại trong 1 giây để kiểm soát vé vào cửa; dữ liệu tự động nạp vào vòng quay Lucky Draw trực tiếp trên sân khấu.',
        badge: 'QR Check-in 1s',
        color: '7C3AED'
      }
    ];

    evCards.forEach((c, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.8 + col * 5.95;
      const y = 2.1 + row * 2.35;

      slide.addShape(pres.ShapeType.rect, {
        x, y, w: 5.75, h: 2.15,
        fill: { color: C.WHITE },
        line: { color: C.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.1
      });

      slide.addShape(pres.ShapeType.rect, {
        x: x + 0.25, y: y + 0.25, w: 2.2, h: 0.3,
        fill: { color: c.color === C.EMERALD ? C.EMERALD_BG : C.BLUE_BG },
        roundRadio: 0.06
      });
      slide.addText(c.badge, {
        x: x + 0.25, y: y + 0.25, w: 2.2, h: 0.3,
        color: c.color, bold: true, fontSize: 10, align: 'center', valign: 'middle', fontFace: 'Calibri'
      });

      slide.addText(c.title, {
        x: x + 0.25, y: y + 0.65, w: 5.25, h: 0.35,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 12.5, fontFace: 'Calibri'
      });

      slide.addText(c.desc, {
        x: x + 0.25, y: y + 1.05, w: 5.25, h: 0.95,
        color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri'
      });
    });

    addSlideFooter(slide, pres);
  }

  // ---------------------------------------------------------------------------
  // SLIDE 10: SÀN GIAO THƯƠNG B2B & PHÂN QUYỀN ĐĂNG TIN MINH BẠCH
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'GIAO THƯƠNG NỘI KHỐI', 'Sàn Thương Mại B2B & Phân Quyền Đăng Tin Sản Phẩm Chuẩn Hóa', 'Cơ chế phân quyền dữ liệu chặt chẽ: Tác giả chủ động quản trị tin đăng, đối tác nhận báo giá VIP');

    // Left Column: Details
    slide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 2.1, w: 5.2, h: 4.65,
      fill: { color: C.WHITE },
      line: { color: C.BORDER_SUBTLE, width: 1.2 },
      roundRadio: 0.1
    });

    slide.addText('Cơ Chế Phân Quyền Sàn B2B Đã Tối Ưu:', {
      x: 1.05, y: 2.3, w: 4.7, h: 0.35,
      color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri'
    });

    const marketFeatures = [
      { t: 'Phân Quyền Tác Giả Sở Hữu Tin Đăng:', d: 'Hội viên đăng bài sẽ hiển thị huy hiệu "Sản phẩm của bạn", kèm nút Sửa / Xóa tin nhanh chóng, không bị nút "Nhận báo giá VIP" đè lên chính mình.' },
      { t: 'Nút "Nhận Báo Giá VIP" Cho Đối Tác:', d: 'Hội viên khác khi quan tâm sản phẩm sẽ gửi yêu cầu báo giá VIP trực tiếp đến chủ doanh nghiệp, thông báo tức thời qua App & CRM.' },
      { t: 'Mức Giá Ưu Đãi Nội Khối CEO 1983:', d: 'Hiển thị giá thị trường và giá độc quyền dành riêng cho hội viên CLB CEO 1983, khuyến khích ưu tiên tiêu dùng sản phẩm của nhau.' },
      { t: 'Đồng Bộ Hóa Đơn Hàng Về CRM:', d: 'Mọi giao dịch báo giá và lượt xem sản phẩm đều được tổng hợp về Web CRM để Ban Xúc tiến Thương mại theo dõi hỗ trợ.' }
    ];

    marketFeatures.forEach((f, i) => {
      slide.addText(`✔ ${f.t}`, {
        x: 1.05, y: 2.75 + i * 0.95, w: 4.7, h: 0.3,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 11.5, fontFace: 'Calibri'
      });
      slide.addText(f.d, {
        x: 1.25, y: 3.05 + i * 0.95, w: 4.5, h: 0.6,
        color: C.TEXT_BODY, fontSize: 10.5, fontFace: 'Calibri'
      });
    });

    // Right Column: Actual Screenshot of Products
    slide.addShape(pres.ShapeType.rect, {
      x: 6.2, y: 2.1, w: 6.33, h: 4.65,
      fill: { color: C.WHITE },
      line: { color: C.BORDER_SUBTLE, width: 1.2 },
      roundRadio: 0.1
    });

    const prodImg = getImageBase64('16_app_products_ecommerce_grid.png') || getImageBase64('app_08_products_grid.png');
    if (prodImg) {
      slide.addImage({
        data: prodImg,
        x: 6.35, y: 2.25, w: 6.03, h: 4.35,
        sizing: { type: 'contain' }
      });
    }

    addSlideFooter(slide, pres);
  }

  // ---------------------------------------------------------------------------
  // SLIDE 11: BẢNG TIN TRAO CƠ HỘI & KẾT NỐI GIAO THƯƠNG THỰC CHIẾN
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'TRAO CƠ HỘI B2B', 'Bảng Tin Trao Cơ Hội & Giám Sát Tiến Trình Khép Deal Thực Tế', 'Tạo dòng chảy cơ hội kinh doanh liên tục: Phân tách ngân sách VNĐ rõ ràng, giám sát người quan tâm Realtime');

    // Left Column: Details
    slide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 2.1, w: 5.2, h: 4.65,
      fill: { color: C.WHITE },
      line: { color: C.BORDER_SUBTLE, width: 1.2 },
      roundRadio: 0.1
    });

    slide.addText('Quy Trình Trao & Nhận Cơ Hội Kinh Doanh:', {
      x: 1.05, y: 2.3, w: 4.7, h: 0.35,
      color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri'
    });

    const oppFeatures = [
      { t: 'Đăng Tin Cơ Hội Chuẩn Định Dạng VNĐ:', d: 'Trường nhập ngân sách tối thiểu - tối đa tự động có ký tự phân cách hàng nghìn (VD: 50.000.000 - 200.000.000 đ), giúp thông tin rõ ràng, chuyên nghiệp.' },
      { t: 'Phân Quyền Chủ Sở Hữu Cơ Hội:', d: 'Chủ bài đăng hiển thị nút "Cơ hội của bạn" để theo dõi danh sách hội viên bấm quan tâm và hotline liên hệ; không bị hiển thị nút tự quan tâm cơ hội của mình.' },
      { t: 'Danh Sách Hội Viên Quan Tâm Realtime:', d: 'Hội viên ấn "Quan tâm" -> Ngay lập tức người đăng nhận được danh sách liên hệ gồm Họ tên, Số điện thoại và Doanh nghiệp để kết nối giao thương.' },
      { t: 'Xác Thực Giá Trị Hợp Đồng Trực Tiếp CRM:', d: 'Mỗi cơ hội chốt thành công được ghi nhận vào hệ thống CRM nhằm vinh danh các thành viên có đóng góp lớn cho sự phát triển của CLB.' }
    ];

    oppFeatures.forEach((f, i) => {
      slide.addText(`✔ ${f.t}`, {
        x: 1.05, y: 2.75 + i * 0.95, w: 4.7, h: 0.3,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 11.5, fontFace: 'Calibri'
      });
      slide.addText(f.d, {
        x: 1.25, y: 3.05 + i * 0.95, w: 4.5, h: 0.6,
        color: C.TEXT_BODY, fontSize: 10.5, fontFace: 'Calibri'
      });
    });

    // Right Column: Actual Screenshot of Opportunities
    slide.addShape(pres.ShapeType.rect, {
      x: 6.2, y: 2.1, w: 6.33, h: 4.65,
      fill: { color: C.WHITE },
      line: { color: C.BORDER_SUBTLE, width: 1.2 },
      roundRadio: 0.1
    });

    const oppImg = getImageBase64('20_app_opportunities_feed.png') || getImageBase64('app_10_opportunities_feed.png');
    if (oppImg) {
      slide.addImage({
        data: oppImg,
        x: 6.35, y: 2.25, w: 6.03, h: 4.35,
        sizing: { type: 'contain' }
      });
    }

    addSlideFooter(slide, pres);
  }

  // ---------------------------------------------------------------------------
  // SLIDE 12: KÊNH LIÊN LẠC NỘI BỘ BẢO MẬT GIỮA CÁC DOANH NHÂN
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'KẾT NỐI BẢO MẬT', 'Kênh Chat & Nhắn Tin Nội Bộ Riêng Tư Giữa Các Lãnh Đạo', 'Bảo mật tuyệt đối thông tin kinh doanh, xóa bỏ nguy cơ lộ lọt dữ liệu khi giao tiếp trên các nền tảng mở');

    // Left Column: Details
    slide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 2.1, w: 5.2, h: 4.65,
      fill: { color: C.WHITE },
      line: { color: C.BORDER_SUBTLE, width: 1.2 },
      roundRadio: 0.1
    });

    slide.addText('Hệ Thống Giao Tiếp Khép Kín Dành Cho CEO:', {
      x: 1.05, y: 2.3, w: 4.7, h: 0.35,
      color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri'
    });

    const chatFeatures = [
      { t: 'Nhắn Tin Trực Tiếp 1-1 Mã Hóa:', d: 'Trò chuyện riêng tư giữa hai lãnh đạo, chia sẻ tài liệu mật, gửi báo giá và thảo luận chiến lược bảo mật cao.' },
      { t: 'Nhóm Thảo Luận Theo Chuyên Đề / Ngành Hàng:', d: 'Tổ chức các nhóm làm việc theo ngành: Bất động sản, Công nghệ, Sản xuất, Tài chính để trao đổi sâu về chuyên môn.' },
      { t: 'Chia Sẻ Danh Thiếp Số & Định Vị Điểm Hẹn:', d: 'Gửi danh thiếp số của đối tác khác hoặc chia sẻ ghim vị trí quán cafe, địa điểm họp Ban Chấp Hành trong 1 chạm.' },
      { t: 'Tích Hợp Cuộc Gọi Thoại & Thu Hồi Tin Nhắn:', d: 'Hỗ trợ gọi điện trực tiếp, gửi tin nhắn thoại (Audio Message) và thu hồi tin nhắn khi gửi nhầm thông tin.' }
    ];

    chatFeatures.forEach((f, i) => {
      slide.addText(`✔ ${f.t}`, {
        x: 1.05, y: 2.75 + i * 0.95, w: 4.7, h: 0.3,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 11.5, fontFace: 'Calibri'
      });
      slide.addText(f.d, {
        x: 1.25, y: 3.05 + i * 0.95, w: 4.5, h: 0.6,
        color: C.TEXT_BODY, fontSize: 10.5, fontFace: 'Calibri'
      });
    });

    // Right Column: Actual Screenshot of Chat/Messenger
    slide.addShape(pres.ShapeType.rect, {
      x: 6.2, y: 2.1, w: 6.33, h: 4.65,
      fill: { color: C.WHITE },
      line: { color: C.BORDER_SUBTLE, width: 1.2 },
      roundRadio: 0.1
    });

    const chatImg = getImageBase64('24_app_messages_inbox.png') || getImageBase64('app_14_messages_inbox.png');
    if (chatImg) {
      slide.addImage({
        data: chatImg,
        x: 6.35, y: 2.25, w: 6.03, h: 4.35,
        sizing: { type: 'contain' }
      });
    }

    addSlideFooter(slide, pres);
  }

  // ---------------------------------------------------------------------------
  // SLIDE 13: QUẢN LÝ QUỸ HỘI & TÀI CHÍNH MINH BẠCH, TỰ ĐỘNG ĐỐI SOÁT
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'MINH BẠCH TÀI CHÍNH', 'Quản Lý Quỹ Hội, Niên Phí & Thu Chi Minh Bạch Đối Soát Tự Động', 'Xây dựng lòng tin tuyệt đối giữa hội viên và Ban Điều Hành nhờ hệ thống kế toán quỹ số hóa chuẩn chỉ');

    // Left Column: Details
    slide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 2.1, w: 5.2, h: 4.65,
      fill: { color: C.WHITE },
      line: { color: C.BORDER_SUBTLE, width: 1.2 },
      roundRadio: 0.1
    });

    slide.addText('Tự Động Hóa Nghiệp Vụ Tài Chính Quỹ Hội:', {
      x: 1.05, y: 2.3, w: 4.7, h: 0.35,
      color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri'
    });

    const feeFeatures = [
      { t: 'Theo Dõi Tình Trạng Niên Phí Từng Hội Viên:', d: 'Phân loại trực quan: Đã đóng, Chưa đóng, Sắp đến hạn; tra cứu lịch sử đóng quỹ qua từng năm rõ ràng.' },
      { t: 'Thông Báo Nhắc Phí Tự Động Đa Kênh:', d: 'Hệ thống tự động gửi thông báo nhắc gia hạn hội viên qua App Push và Email kèm mã VietQR đóng phí tiện lợi.' },
      { t: 'Sổ Thu - Chi Quỹ Minh Bạch Thời Gian Thực:', d: 'Ghi nhận chi tiết từng khoản thu (hội phí, tài trợ sự kiện) và khoản chi (từ thiện, hoạt động CLB) có hóa đơn kèm theo.' },
      { t: 'Báo Cáo Tài Chính Chuẩn Bị Cho Đại Hội:', d: 'Tự động xuất báo cáo ngân sách và dòng tiền trực quan, phục vụ công tác thanh tra tài chính định kỳ của CLB.' }
    ];

    feeFeatures.forEach((f, i) => {
      slide.addText(`✔ ${f.t}`, {
        x: 1.05, y: 2.75 + i * 0.95, w: 4.7, h: 0.3,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 11.5, fontFace: 'Calibri'
      });
      slide.addText(f.d, {
        x: 1.25, y: 3.05 + i * 0.95, w: 4.5, h: 0.6,
        color: C.TEXT_BODY, fontSize: 10.5, fontFace: 'Calibri'
      });
    });

    // Right Column: Actual Screenshot of Fees Management
    slide.addShape(pres.ShapeType.rect, {
      x: 6.2, y: 2.1, w: 6.33, h: 4.65,
      fill: { color: C.WHITE },
      line: { color: C.BORDER_SUBTLE, width: 1.2 },
      roundRadio: 0.1
    });

    const feeImg = getImageBase64('crm_08_fees_management.png') || getImageBase64('sub_50_crm_fees_management.png');
    if (feeImg) {
      slide.addImage({
        data: feeImg,
        x: 6.35, y: 2.25, w: 6.03, h: 4.35,
        sizing: { type: 'contain' }
      });
    }

    addSlideFooter(slide, pres);
  }

  // ---------------------------------------------------------------------------
  // SLIDE 14: CỔNG TIẾP NHẬN LANDING PAGE 3D & CẤP QUYỀN TỰ ĐỘNG QUA EMAIL
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'TUYỂN MỘ HỘI VIÊN MỚI', 'Cổng Thông Tin Đối Ngoại Landing 3D & Cấp Tài Khoản Tự Động', 'Trải nghiệm gia nhập ấn tượng: Đăng ký trực tuyến, Admin duyệt trên CRM, hệ thống tự cấp mật khẩu qua Email');

    // Left Column: Details
    slide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 2.1, w: 5.2, h: 4.65,
      fill: { color: C.WHITE },
      line: { color: C.BORDER_SUBTLE, width: 1.2 },
      roundRadio: 0.1
    });

    slide.addText('Quy Trình Onboarding Hội Viên Tự Động:', {
      x: 1.05, y: 2.3, w: 4.7, h: 0.35,
      color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri'
    });

    const landingFeatures = [
      { t: 'Landing Page 3D Điện Ảnh Sang Trọng:', d: 'Cổng thông tin đối ngoại giới thiệu tôn chỉ, cơ cấu lãnh đạo và quyền lợi đặc quyền của hội viên CLB CEO 1983.' },
      { t: 'Biểu Mẫu Gia Nhập Trực Tuyến 24/7:', d: 'Ứng viên điền thông tin doanh nghiệp, đính kèm hồ sơ và logo công ty trực tiếp ngay trên trang web.' },
      { t: 'Luồng Phê Duyệt 1 Chạm Trên CRM:', d: 'Ban Thư ký thẩm định hồ sơ và nhấn "Phê duyệt" trên Web CRM; không cần nhập liệu thủ công lại.' },
      { t: 'Gửi Email Thông Báo & Mật Khẩu (SMTP):', d: 'Hệ thống tự động kích hoạt tài khoản và gửi email chúc mừng kèm thông tin đăng nhập và liên kết tải Mobile App.' }
    ];

    landingFeatures.forEach((f, i) => {
      slide.addText(`✔ ${f.t}`, {
        x: 1.05, y: 2.75 + i * 0.95, w: 4.7, h: 0.3,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 11.5, fontFace: 'Calibri'
      });
      slide.addText(f.d, {
        x: 1.25, y: 3.05 + i * 0.95, w: 4.5, h: 0.6,
        color: C.TEXT_BODY, fontSize: 10.5, fontFace: 'Calibri'
      });
    });

    // Right Column: Actual Screenshot of Landing Page Hero
    slide.addShape(pres.ShapeType.rect, {
      x: 6.2, y: 2.1, w: 6.33, h: 4.65,
      fill: { color: C.WHITE },
      line: { color: C.BORDER_SUBTLE, width: 1.2 },
      roundRadio: 0.1
    });

    const landingImg = getImageBase64('01_landing_hero.png') || getImageBase64('sub_01_landing_header_hero.png');
    if (landingImg) {
      slide.addImage({
        data: landingImg,
        x: 6.35, y: 2.25, w: 6.03, h: 4.35,
        sizing: { type: 'contain' }
      });
    }

    addSlideFooter(slide, pres);
  }

  // ---------------------------------------------------------------------------
  // SLIDE 15: HIỆU QUẢ ĐO LƯỜNG ĐƯỢC (MEASURABLE ROI) SAU VẬN HÀNH
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'HIỆU QUẢ & ROI THỰC TẾ', 'Giá Trị Đột Phá Sau Khi Đưa Hệ Sinh Thái Vào Vận Hành Thực Tiễn', 'Minh chứng hiệu quả rõ nét bằng các chỉ số định lượng cụ thể, giải phóng nguồn lực cho Ban Lãnh Đạo');

    const rois = [
      {
        stat: '85%',
        title: 'Tiết Kiệm Thời Gian Thư Ký',
        desc: 'Tự động hóa hoàn toàn việc nhắc phí, đối soát danh sách, soát vé sự kiện và gửi thông báo, giúp văn phòng hội tập trung phát triển hội viên.',
        color: C.NAVY_PRIMARY
      },
      {
        stat: '300%',
        title: 'Tăng Trưởng Giao Thương Nội Khối',
        desc: 'Sàn B2B và Bảng tin Trao cơ hội giúp hội viên dễ dàng tiếp cận nhu cầu của nhau, tăng gấp 3 lần số lượng giao dịch và giá trị hợp đồng kết nối.',
        color: C.GOLD_DARK
      },
      {
        stat: '1 Giây',
        title: 'Tốc Độ Check-in Đón Tiếp',
        desc: 'Xóa bỏ cảnh xếp hàng ùn tắc tại các đại hội lớn. Quét mã QR Pass trong 1 giây để xác thực vé, tự động nạp dữ liệu vào Lucky Draw.',
        color: C.EMERALD
      },
      {
        stat: '100%',
        title: 'Bảo Mật Dữ Liệu Tập Trung',
        desc: 'Toàn bộ thông tin cá nhân và doanh nghiệp của các CEO được bảo vệ an toàn trên hạ tầng máy chủ riêng với giao thức HTTPS độc lập.',
        color: '7C3AED'
      }
    ];

    rois.forEach((r, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.8 + col * 5.95;
      const y = 2.1 + row * 2.35;

      slide.addShape(pres.ShapeType.rect, {
        x, y, w: 5.75, h: 2.15,
        fill: { color: C.WHITE },
        line: { color: C.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.1
      });

      slide.addText(r.stat, {
        x: x + 0.3, y: y + 0.25, w: 1.8, h: 0.7,
        color: r.color, bold: true, fontSize: 32, fontFace: 'Calibri'
      });

      slide.addText(r.title, {
        x: x + 2.2, y: y + 0.25, w: 3.3, h: 0.35,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 13.5, fontFace: 'Calibri'
      });

      slide.addText(r.desc, {
        x: x + 2.2, y: y + 0.65, w: 3.3, h: 1.3,
        color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri'
      });
    });

    addSlideFooter(slide, pres);
  }

  // ---------------------------------------------------------------------------
  // SLIDE 16: LỘ TRÌNH TRIỂN KHAI & CAM KẾT ĐỒNG HÀNH (Dark Theme CTA)
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    slide.background = { color: C.NAVY_DARK };

    slide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0, w: 13.33, h: 0.12,
      fill: { color: C.GOLD_ACCENT }
    });

    slide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 0.6, w: 3.8, h: 0.32,
      fill: { color: C.GOLD_ACCENT },
      roundRadio: 0.08
    });
    slide.addText('KẾ HOẠCH HÀNH ĐỘNG 2026', {
      x: 0.8, y: 0.6, w: 3.8, h: 0.32,
      color: C.NAVY_DARK, bold: true, fontSize: 10, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });

    slide.addText('Lộ Trình Triển Khai & Cam Kết Đồng Hành Cùng CEO 1983', {
      x: 0.8, y: 1.0, w: 11.73, h: 0.65,
      color: C.WHITE, bold: true, fontSize: 24, fontFace: 'Calibri'
    });

    slide.addText('Hệ thống đã hoàn thiện 100% mã nguồn và sẵn sàng bàn giao, đào tạo Ban Chấp Hành đưa vào hoạt động chính thức', {
      x: 0.8, y: 1.65, w: 11.73, h: 0.4,
      color: 'CBD5E1', fontSize: 13, italic: true, fontFace: 'Calibri'
    });

    const milestones = [
      { step: 'GIAI ĐOẠN 1', time: 'Tháng 09/2026', title: 'Hoàn Tất Kiểm Thử & Chuyển Giao', desc: 'Kiểm thử toàn diện luồng nghiệp vụ trên Live HTTPS; bàn giao tài khoản quản trị tối cao cho Ban Thư Ký.' },
      { step: 'GIAI ĐOẠN 2', time: 'Tháng 10/2026', title: 'Đào Tạo & Nhập Liệu Hội Viên', desc: 'Tổ chức buổi tập huấn hướng dẫn sử dụng Web CRM cho Ban Điều Hành; nhập liệu 100+ doanh nghiệp hội viên chính thức.' },
      { step: 'GIAI ĐOẠN 3', time: 'Tháng 11/2026', title: 'Ra Mắt Chính Thức Tại Đại Hội', desc: 'Kích hoạt Thẻ VIP 3D cho toàn thể hội viên; áp dụng quy trình Check-in QR Pass và Lucky Draw tại sự kiện lớn của CLB.' },
      { step: 'GIAI ĐOẠN 4', time: 'Năm 2027+', title: 'Bảo Trì & Nâng Cấp Liên Tục', desc: 'Đồng hành hỗ trợ kỹ thuật 24/7; liên tục bổ sung các tiện ích số mới theo nhu cầu phát triển mở rộng của hiệp hội.' },
    ];

    milestones.forEach((m, idx) => {
      const x = 0.8 + idx * 2.98;
      slide.addShape(pres.ShapeType.rect, {
        x, y: 2.3, w: 2.8, h: 3.4,
        fill: { color: C.NAVY_CARD },
        line: { color: '2A3E66', width: 1.2 },
        roundRadio: 0.12
      });

      slide.addText(m.step, {
        x: x + 0.2, y: 2.5, w: 2.4, h: 0.3,
        color: C.GOLD_ACCENT, bold: true, fontSize: 11, fontFace: 'Calibri'
      });

      slide.addText(m.time, {
        x: x + 0.2, y: 2.8, w: 2.4, h: 0.3,
        color: '94A3B8', fontSize: 10, italic: true, fontFace: 'Calibri'
      });

      slide.addText(m.title, {
        x: x + 0.2, y: 3.2, w: 2.4, h: 0.5,
        color: C.WHITE, bold: true, fontSize: 13, fontFace: 'Calibri'
      });

      slide.addText(m.desc, {
        x: x + 0.2, y: 3.8, w: 2.4, h: 1.6,
        color: 'CBD5E1', fontSize: 10.5, fontFace: 'Calibri'
      });
    });

    // Bottom CTA Banner
    slide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 5.9, w: 11.73, h: 0.9,
      fill: { color: C.GOLD_DARK },
      roundRadio: 0.1
    });
    slide.addText('SẴN SÀNG ĐƯA VÀO VẬN HÀNH THỰC TẾ · NÂNG TẦM VỊ THẾ CLB DOANH NHÂN CEO 1983', {
      x: 1.0, y: 6.0, w: 11.33, h: 0.35,
      color: C.WHITE, bold: true, fontSize: 14, align: 'center', fontFace: 'Calibri'
    });
    slide.addText('Cổng Quản Trị CRM: https://14.225.217.232:5443 · App Hiệp Hội: https://14.225.217.232:5444 · ceo1983.com', {
      x: 1.0, y: 6.35, w: 11.33, h: 0.35,
      color: 'FEF3C7', fontSize: 11.5, align: 'center', fontFace: 'Calibri'
    });

    addSlideFooter(slide, pres, true);
  }

  // ---------------------------------------------------------------------------
  // SAVE PPTX FILE
  // ---------------------------------------------------------------------------
  const pptxPath = path.join(OUT_DIR, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_CEO1983.pptx');
  await pres.writeFile({ fileName: pptxPath });
  console.log(`✓ Generated 16-Slide Master Presentation -> ${pptxPath}`);

  // ---------------------------------------------------------------------------
  // GENERATE MARKDOWN PITCH DECK (.md)
  // ---------------------------------------------------------------------------
  const mdContent = `# HỆ SINH THÁI CHUYỂN ĐỔI SỐ TOÀN DIỆN · CLB DOANH NHÂN CEO 1983
## Bộ Tài Liệu Thuyết Trình Chiến Lược Ban Chấp Hành (Executive Pitch Deck - 16 Slides)
*Bản quyền © 2026 CLB Doanh Nhân CEO 1983 · Trực thuộc Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)*

---

### SLIDE 1: BÌA CHIẾN LƯỢC HỆ SINH THÁI SỐ CEO 1983
- **Tiêu đề**: VIONE ECOSYSTEM · CLB DOANH NHÂN CEO 1983
- **Định vị**: Giải pháp Quản trị Hiệp hội Tối cao (Web CRM) song hành Nền tảng Giao thương B2B Đẳng cấp (Mobile App).
- **Kiềng 3 chân**:
  1. Web CRM Quản Trị (Port 5443).
  2. Mobile App Doanh Nhân (Port 5444).
  3. Đồng bộ hai chiều thời gian thực (Realtime Two-Way Sync).

### SLIDE 2: THỰC TRẠNG & ĐIỂM ĐAU CỦA QUẢN TRỊ HIỆP HỘI TRUYỀN THỐNG
- Dữ liệu phân tán trên file Excel, nhóm Zalo trôi tin nhắn và tài liệu.
- Thu phí và đối soát ngân hàng thủ công, thiếu minh bạch báo cáo.
- Sự kiện tắc nghẽn khâu check-in, kiểm soát vé vào cửa thủ công.
- Nhu cầu giao thương B2B nội khối bị bỏ lỡ do thiếu sàn kết nối chuẩn hóa.

### SLIDE 3: TẦM NHÌN & SỨ MỆNH: GẮN KẾT - CHIA SẺ - ĐỒNG HÀNH - PHÁT TRIỂN
- 01. Gắn kết bền chặt: Định danh số cho 100% hội viên.
- 02. Chia sẻ cơ hội: Bảng tin cơ hội B2B và Sàn thương mại nội khối.
- 03. Đồng hành vận hành: Web CRM hỗ trợ tự động hóa Ban Thư Ký.
- 04. Phát triển bứt phá: Ra quyết định dựa trên số liệu KPI phân tích trực quan.

### SLIDE 4: KIẾN TRÚC ĐỒNG BỘ HAI CHIỀU (CRM QUẢN TRỊ ⇄ APP HIỆP HỘI)
- **Web CRM Điều Hành**: Tiếp nhận đăng ký, duyệt bài, cấu hình sự kiện, quản lý thu chi.
- **Đồng bộ thời gian thực**: Hội viên thao tác -> Tự động đổ về CRM xét duyệt -> CRM phản hồi trạng thái, gửi thông báo Push & cấp vé tức thời.
- **Mobile App Hội Viên**: Nhận Thẻ VIP 3D, vé QR Pass, đăng bài sản phẩm/cơ hội, quản lý người quan tâm.

### SLIDE 5: TỔNG QUAN WEB CRM QUẢN TRỊ - BỘ NÃO ĐIỀU HÀNH TẬP TRUNG
- **Ảnh chụp thực tế**: \`crm_02_dashboard_kpi.png\`
- Dashboard tổng hợp KPI hội viên, dòng tiền sự kiện, trạng thái gian hàng.
- Báo cáo biểu đồ tài chính và tỷ lệ tương tác theo ngày/tháng.

### SLIDE 6: QUẢN TRỊ HỘI VIÊN & PHÂN QUYỀN ĐA TẦNG TRÊN CRM
- **Ảnh chụp thực tế**: \`crm_03_members_list.png\`
- Hồ sơ doanh nghiệp 360°, mã hội viên duy nhất.
- Phân quyền chặt chẽ giữa Admin, Ban Chấp Hành và Hội Viên.
- Trích xuất file Excel danh sách và lịch sử hoạt động chỉ trong 1 click.

### SLIDE 7: TỔNG QUAN MOBILE APP HIỆP HỘI - VĂN PHÒNG SỐ BỎ TÚI
- **Ảnh chụp thực tế**: \`app_02_home_dashboard.png\`
- Giao diện sang trọng chuẩn Luxury Gold & Royal Navy.
- Thanh điều hướng 1 chạm cho các nghiệp vụ trọng tâm.
- Hỗ trợ đa nền tảng iOS (IPA/PWA) và Android (APK).

### SLIDE 8: THẺ HỘI VIÊN VIP 3D & RADAR KẾT NỐI DOANH NHÂN KHÔNG DÂY
- **Ảnh chụp thực tế**: \`09_app_vip_card.png\`
- Thẻ mạ vàng 3D lật 2 mặt, tích hợp mã QR cá nhân hóa.
- Danh thiếp số công khai (Public Card) chia sẻ không cần cài app.
- Radar tìm kiếm doanh nhân tham dự xung quanh hội trường.

### SLIDE 9: TỰ ĐỘNG HÓA SỰ KIỆN: 2 LUỒNG MIỄN PHÍ (0Đ) & THU PHÍ VIETQR
- Sự kiện miễn phí 0đ: Hội viên nhận ngay Vé Pass và mã check-in.
- Hội thảo thu phí: Tự sinh mã VietQR động, đối soát Napas247 trong 3 giây.
- Sơ đồ ghế ngồi Cinema Map tránh nhầm lẫn chỗ ngồi.
- Soát vé QR 1 giây tại cửa và nạp dữ liệu vào Lucky Draw sân khấu.

### SLIDE 10: SÀN GIAO THƯƠNG B2B & PHÂN QUYỀN ĐĂNG TIN MINH BẠCH
- **Ảnh chụp thực tế**: \`16_app_products_ecommerce_grid.png\`
- Phân quyền tác giả: Nút "Sản phẩm của bạn" + Chỉnh sửa / Xóa tin.
- Phân quyền đối tác: Nút "Nhận báo giá VIP" gửi yêu cầu trực tiếp.
- Mức giá ưu đãi nội khối kích thích mua sắm giữa các hội viên.

### SLIDE 11: BẢNG TIN TRAO CƠ HỘI & KẾT NỐI GIAO THƯƠNG THỰC CHIẾN
- **Ảnh chụp thực tế**: \`20_app_opportunities_feed.png\`
- Nhập ngân sách VNĐ tự động có ký tự phân cách hàng nghìn (50.000.000 đ).
- Danh sách hội viên quan tâm hiển thị theo thời gian thực kèm số điện thoại.
- Giám sát tiến trình đàm phán và giá trị deal trên CRM.

### SLIDE 12: MẠNG LƯỚI NHẮN TIN & GIAO TIẾP NỘI BỘ BẢO MẬT
- **Ảnh chụp thực tế**: \`24_app_messages_inbox.png\`
- Nhắn tin 1-1 mã hóa, bảo mật bí mật kinh doanh.
- Nhóm thảo luận chuyên sâu theo từng ban ngành nghề.
- Gửi vị trí điểm hẹn và danh thiếp số tức thì.

### SLIDE 13: QUẢN LÝ TÀI CHÍNH & QUỸ HỘI: THU CHI MINH BẠCH, TỰ ĐỘNG ĐỐI SOÁT
- **Ảnh chụp thực tế**: \`crm_08_fees_management.png\`
- Theo dõi tình trạng niên phí (Đã đóng, Chưa đóng, Sắp đến hạn).
- Nhắc phí tự động kèm mã VietQR qua App Push & Email.
- Sổ quỹ thu chi minh bạch phục vụ công tác thanh tra tài chính.

### SLIDE 14: CỔNG TIẾP NHẬN HỘI VIÊN LANDING 3D & CẤP QUYỀN TỰ ĐỘNG QUA EMAIL
- **Ảnh chụp thực tế**: \`01_landing_hero.png\`
- Landing Page 3D điện ảnh giới thiệu quyền lợi gia nhập CLB CEO 1983.
- Biểu mẫu ứng tuyển trực tuyến 24/7.
- Admin duyệt 1 chạm trên CRM -> Tự động gửi Email cấp tài khoản qua SMTP.

### SLIDE 15: HIỆU QUẢ ĐO LƯỜNG ĐƯỢC (ROI) SAU KHI VẬN HÀNH
- Tiết kiệm 85% thời gian thủ công của Ban Thư Ký.
- Tăng trưởng 300% số lượng và giá trị giao thương nội khối.
- Tốc độ check-in đón tiếp chỉ 1 giây/hội viên.
- Bảo mật 100% dữ liệu trên máy chủ hạ tầng độc lập HTTPS.

### SLIDE 16: LỘ TRÌNH TRIỂN KHAI & CAM KẾT ĐỒNG HÀNH CÙNG CEO 1983
- Tháng 09/2026: Hoàn tất kiểm thử và bàn giao tài khoản Admin.
- Tháng 10/2026: Đào tạo sử dụng CRM và nhập liệu toàn bộ hội viên.
- Tháng 11/2026: Ra mắt chính thức tại đại hội CLB CEO 1983.
- Năm 2027+: Bảo trì hệ thống và hỗ trợ kỹ thuật 24/7.
`;
  const mdPath = path.join(OUT_DIR, 'PITCH_DECK_HE_SINH_THAI_CEO1983.md');
  fs.writeFileSync(mdPath, mdContent, 'utf8');
  console.log(`✓ Generated Pitch Deck Markdown -> ${mdPath}`);

  // ---------------------------------------------------------------------------
  // GENERATE INTERACTIVE HTML PRESENTATION
  // ---------------------------------------------------------------------------
  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Slide Thuyết Trình Hệ Sinh Thái Số CEO 1983 (16 Slides)</title>
  <style>
    :root {
      --navy-dark: #0A1A3A;
      --navy-primary: #003B95;
      --navy-card: #132A56;
      --gold: #F59E0B;
      --gold-dark: #D97706;
      --bg-light: #F8FAFC;
      --white: #FFFFFF;
      --border: #E2E8F0;
      --text-dark: #0F172A;
      --text-body: #334155;
      --text-muted: #64748B;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #070e1e; color: var(--text-dark); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; overflow-x: hidden; }
    .deck-container { width: 100%; max-width: 1280px; aspect-ratio: 16/9; background: var(--bg-light); border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); position: relative; display: flex; flex-direction: column; }
    .slide { display: none; width: 100%; height: 100%; flex-direction: column; justify-content: space-between; padding: 36px 48px; background: var(--bg-light); position: relative; }
    .slide.active { display: flex; }
    .slide.dark { background: var(--navy-dark); color: var(--white); }
    .slide-top-bar { position: absolute; top: 0; left: 0; right: 0; height: 6px; background: var(--gold); }
    .slide-header { margin-bottom: 20px; }
    .eyebrow { display: inline-block; padding: 4px 14px; border-radius: 6px; background: var(--navy-primary); color: var(--white); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .slide.dark .eyebrow { background: var(--gold); color: var(--navy-dark); }
    .slide-title { font-size: 26px; font-weight: 900; color: var(--navy-primary); line-height: 1.25; }
    .slide.dark .slide-title { color: var(--white); }
    .slide-subtitle { font-size: 14px; color: var(--text-muted); margin-top: 4px; font-style: italic; }
    .slide.dark .slide-subtitle { color: #94A3B8; }
    .slide-body { flex: 1; display: flex; gap: 24px; min-height: 0; }
    .card-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; width: 100%; }
    .card-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; width: 100%; }
    .card { background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .slide.dark .card { background: var(--navy-card); border-color: #2A3E66; color: var(--white); }
    .card-num { font-size: 28px; font-weight: 900; color: var(--gold); line-height: 1; margin-bottom: 8px; }
    .card-title { font-size: 15px; font-weight: 800; color: var(--navy-primary); margin-bottom: 6px; }
    .slide.dark .card-title { color: var(--white); }
    .card-desc { font-size: 12px; color: var(--text-body); line-height: 1.5; }
    .slide.dark .card-desc { color: #CBD5E1; }
    .slide-footer { border-top: 1px solid var(--border); padding-top: 10px; margin-top: 14px; display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); }
    .slide.dark .slide-footer { border-color: #2A3E66; color: #64748B; }
    .img-frame { flex: 1; background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .img-frame img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; }
    .nav-controls { margin-top: 20px; display: flex; align-items: center; gap: 16px; color: #94a3b8; font-size: 14px; }
    .btn-nav { padding: 8px 18px; border-radius: 8px; background: var(--navy-primary); color: white; border: none; cursor: pointer; font-weight: 700; }
    .btn-nav:hover { background: var(--gold); color: var(--navy-dark); }
    .dots { display: flex; gap: 6px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: #334155; cursor: pointer; }
    .dot.active { background: var(--gold); }
  </style>
</head>
<body>
  <div class="deck-container">
    <!-- SLIDE 1 -->
    <div class="slide dark active">
      <div class="slide-top-bar"></div>
      <div class="slide-header">
        <span class="eyebrow">Hệ Sinh Thái Chuyển Đổi Số Toàn Diện</span>
        <h1 class="slide-title">VIONE ECOSYSTEM · CLB DOANH NHÂN CEO 1983</h1>
        <p class="slide-subtitle">Giải pháp Quản trị Hiệp hội Tối cao (Web CRM) song hành Nền tảng Giao thương B2B Đẳng cấp (Mobile App)</p>
      </div>
      <div class="slide-body">
        <div class="card-grid-4" style="grid-template-columns: repeat(3, 1fr);">
          <div class="card">
            <div class="card-num">01</div>
            <div class="card-title">Web CRM Quản Trị</div>
            <div class="card-desc">Trung tâm kiểm soát dữ liệu hội viên, tài chính quỹ hội, sự kiện và đối soát tự động theo thời gian thực.</div>
          </div>
          <div class="card">
            <div class="card-num">02</div>
            <div class="card-title">Mobile App Doanh Nhân</div>
            <div class="card-desc">Văn phòng số bỏ túi: Thẻ VIP 3D, Radar kết nối, gian hàng Marketplace & mạng xã hội trao đổi cơ hội.</div>
          </div>
          <div class="card">
            <div class="card-num">03</div>
            <div class="card-title">Đồng Bộ 2 Chiều Realtime</div>
            <div class="card-desc">Hội viên thao tác trên App -> Tự động đổ về CRM xét duyệt -> CRM đẩy thông báo và phân quyền tức thì xuống App.</div>
          </div>
        </div>
      </div>
      <div class="slide-footer">
        <span>CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 1 / 16</span>
      </div>
    </div>

    <!-- SLIDE 2: THỰC TRẠNG & ĐIỂM ĐAU -->
    <div class="slide">
      <div class="slide-top-bar"></div>
      <div class="slide-header">
        <span class="eyebrow">Thực Trạng & Điểm Đau</span>
        <h2 class="slide-title">Điểm Đau Của Các Hiệp Hội & CLB Doanh Nghiệp Truyền Thống</h2>
        <p class="slide-subtitle">Các thách thức lớn trong vận hành thủ công dẫn tới suy giảm tương tác và thất thoát nguồn lực</p>
      </div>
      <div class="slide-body">
        <div class="card-grid-2">
          <div class="card">
            <div class="card-title">📊 Quản Lý Dữ Liệu Rời Rạc & Trôi Bài</div>
            <div class="card-desc">Dữ liệu hội viên lưu phân tán trên nhiều file Excel cá nhân. Nhóm Zalo thường xuyên trôi tin nhắn, tài liệu quan trọng và nhu cầu hợp tác không thể tìm kiếm lại.</div>
          </div>
          <div class="card">
            <div class="card-title">💳 Thu Phí & Quản Trị Quỹ Thủ Công</div>
            <div class="card-desc">Ban Thư ký mất 70% thời gian đối soát sao kê ngân hàng, nhắn tin nhắc nộp hội phí từng người thủ công. Thiếu báo cáo thu - chi minh bạch định kỳ gửi Ban Điều Hành.</div>
          </div>
          <div class="card">
            <div class="card-title">🎟️ Tổ Chức Sự Kiện Tắc Nghẽn Check-in</div>
            <div class="card-desc">Đăng ký sự kiện qua Google Form dễ trùng lặp. Khâu đón tiếp tại cửa ùn tắc vì tìm tên trên giấy in. Không có vé điện tử bảo mật và công cụ Lucky Draw tự động.</div>
          </div>
          <div class="card">
            <div class="card-title">🤝 Giao Thương B2B Kém Hiệu Quả</div>
            <div class="card-desc">Hội viên không nắm rõ thế mạnh, sản phẩm dịch vụ của nhau. Nhu cầu mua sắm nội khối bị bỏ lỡ, thiếu nền tảng số bảo đảm uy tín và ghi nhận giá trị deal kết nối.</div>
          </div>
        </div>
      </div>
      <div class="slide-footer">
        <span>CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 2 / 16</span>
      </div>
    </div>

    <!-- SLIDE 3: TẦM NHÌN & SỨ MỆNH -->
    <div class="slide">
      <div class="slide-top-bar"></div>
      <div class="slide-header">
        <span class="eyebrow">Tầm Nhìn & Sứ Mệnh</span>
        <h2 class="slide-title">Chiến Lược Chuyển Đổi Số: Gắn Kết - Chia Sẻ - Đồng Hành - Phát Triển</h2>
        <p class="slide-subtitle">Xây dựng nền tảng công nghệ chuyên biệt, định vị CLB Doanh Nhân CEO 1983 dẫn đầu chuyển đổi số hiệp hội</p>
      </div>
      <div class="slide-body">
        <div class="card-grid-4">
          <div class="card">
            <div class="card-num">01</div>
            <div class="card-title">GẮN KẾT BỀN CHẶT</div>
            <div class="card-desc">Số hóa 100% hồ sơ hội viên thành định danh số. Thẻ VIP 3D và danh bạ thông minh giúp doanh nhân kết nối trong 1 chạm.</div>
          </div>
          <div class="card">
            <div class="card-num">02</div>
            <div class="card-title">CHIA SẺ CƠ HỘI</div>
            <div class="card-desc">Bảng tin Trao cơ hội & Sàn B2B thúc đẩy giao thương nội khối, chuyển giao dự án và ưu đãi chéo giữa các hội viên.</div>
          </div>
          <div class="card">
            <div class="card-num">03</div>
            <div class="card-title">ĐỒNG HÀNH VẬN HÀNH</div>
            <div class="card-desc">Web CRM đồng hành cùng Ban Thư ký & Ban Điều hành: tự động hóa đối soát tài chính, hội phí, soát vé sự kiện thông minh.</div>
          </div>
          <div class="card">
            <div class="card-num">04</div>
            <div class="card-title">PHÁT TRIỂN BỨT PHÁ</div>
            <div class="card-desc">Báo cáo KPI phân tích thời gian thực giúp Ban Chấp Hành ra quyết định chiến lược, mở rộng mạng lưới hội viên chất lượng cao.</div>
          </div>
        </div>
      </div>
      <div class="slide-footer">
        <span>CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 3 / 16</span>
      </div>
    </div>

    <!-- SLIDE 4: ĐỒNG BỘ 2 CHIỀU -->
    <div class="slide">
      <div class="slide-top-bar"></div>
      <div class="slide-header">
        <span class="eyebrow">Kiến Trúc Đồng Bộ 2 Chiều</span>
        <h2 class="slide-title">Mối Quan Hệ Tương Hỗ Hai Chiều Giữa Web CRM & Mobile App Hiệp Hội</h2>
        <p class="slide-subtitle">Web CRM và Mobile App hoạt động thống nhất trên 1 cơ sở dữ liệu dùng chung, đồng bộ hóa thời gian thực</p>
      </div>
      <div class="slide-body">
        <div class="card-grid-2">
          <div class="card">
            <div class="card-title">💻 Web CRM (Bộ Não Điều Hành)</div>
            <div class="card-desc">
              • Tiếp nhận đơn đăng ký hội viên từ Landing & App.<br>
              • Phê duyệt và cấp phát quyền hạn đa tầng (Admin, BCH, Hội viên).<br>
              • Khởi tạo sự kiện, thiết lập sơ đồ ghế Cinema và bảng giá vé.<br>
              • Duyệt gian hàng sản phẩm B2B và giám sát deal cơ hội.<br>
              • Quản lý thu chi, đối soát thanh toán tự động VietQR & niên phí.
            </div>
          </div>
          <div class="card">
            <div class="card-title">📱 Mobile App (Văn Phòng Hội Viên)</div>
            <div class="card-desc">
              • Nhận định danh số & Thẻ VIP 3D cá nhân hóa tức thời.<br>
              • Nhận vé Pass điện tử & Check-in QR 1 giây tại cửa sự kiện.<br>
              • Đăng sản phẩm lên Sàn B2B: Tác giả tự sửa/xóa bài, đối tác nhận báo giá VIP.<br>
              • Đăng cơ hội kết nối: Xem danh sách hội viên quan tâm theo thời gian thực.<br>
              • Giao tiếp nội bộ: Trò chuyện 1-1, gọi thoại, gửi vị trí và danh thiếp số.
            </div>
          </div>
        </div>
      </div>
      <div class="slide-footer">
        <span>CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 4 / 16</span>
      </div>
    </div>

    <!-- SLIDE 5: WEB CRM OVERVIEW -->
    <div class="slide">
      <div class="slide-top-bar"></div>
      <div class="slide-header">
        <span class="eyebrow">Bộ Não Điều Hành CRM</span>
        <h2 class="slide-title">Web CRM Quản Trị Trung Tâm: Kiểm Soát Toàn Bộ Dữ Liệu Hội</h2>
        <p class="slide-subtitle">Dashboard điều hành thông minh tổng hợp chỉ số KPI, tài chính quỹ hội và sự kiện theo thời gian thực</p>
      </div>
      <div class="slide-body">
        <div class="card" style="flex: 1;">
          <div class="card-title">Các Tính Năng Trọng Tâm:</div>
          <div class="card-desc">
            <b>✔ KPI Dashboard:</b> Theo dõi tổng số hội viên chính thức, doanh thu sự kiện, tỷ lệ đóng phí và cơ hội B2B.<br><br>
            <b>✔ Quản Lý Hội Viên:</b> Hồ sơ 360° doanh nghiệp, phân quyền đa tầng.<br><br>
            <b>✔ Quản Lý Sự Kiện:</b> Cấu hình vé miễn phí 0đ và thu phí VietQR tự động; sơ đồ ghế Cinema.<br><br>
            <b>✔ Giám Sát Giao Thương:</b> Duyệt tin đăng sản phẩm và theo dõi giá trị deal kết nối.
          </div>
        </div>
        <div class="img-frame">
          <img src="images/evidence/crm_02_dashboard_kpi.png" alt="CRM Dashboard">
        </div>
      </div>
      <div class="slide-footer">
        <span>CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 5 / 16</span>
      </div>
    </div>

    <!-- SLIDE 6: MEMBER MANAGEMENT -->
    <div class="slide">
      <div class="slide-top-bar"></div>
      <div class="slide-header">
        <span class="eyebrow">Quản Trị Nhân Sự Hội</span>
        <h2 class="slide-title">Quản Lý Hồ Sơ Hội Viên 360° & Phân Quyền Vai Trò Đa Tầng</h2>
        <p class="slide-subtitle">Hồ sơ doanh nghiệp chuẩn hóa, mã hóa an toàn, phân quyền rõ ràng giữa Ban Lãnh Đạo và Hội Viên</p>
      </div>
      <div class="slide-body">
        <div class="card" style="flex: 1;">
          <div class="card-title">Chuẩn Hóa Dữ Liệu Hội Viên:</div>
          <div class="card-desc">
            <b>✔ Mã Hội Viên & Profile Chuẩn Hóa:</b> Cấp mã định danh duy nhất (M1983-007), lưu trữ thông tin công ty, ngành nghề, mã số thuế.<br><br>
            <b>✔ Phân Quyền Vai Trò:</b> Tách bạch quyền hạn giữa Admin tối cao, Ban Chấp Hành và Hội viên.<br><br>
            <b>✔ Xuất Dữ Liệu Excel:</b> Trích xuất danh sách hội viên, lịch sử nộp quỹ trong 1 click.<br><br>
            <b>✔ Đồng Bộ Realtime Với App:</b> Thay đổi chức danh hoặc kích hoạt tài khoản được cập nhật ngay trên App.
          </div>
        </div>
        <div class="img-frame">
          <img src="images/evidence/crm_03_members_list.png" alt="Members List CRM">
        </div>
      </div>
      <div class="slide-footer">
        <span>CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 6 / 16</span>
      </div>
    </div>

    <!-- SLIDE 7: MOBILE APP OVERVIEW -->
    <div class="slide">
      <div class="slide-top-bar"></div>
      <div class="slide-header">
        <span class="eyebrow">Văn Phòng Số Bỏ Túi</span>
        <h2 class="slide-title">Tổng Quan Mobile App Hiệp Hội CLB Doanh Nhân CEO 1983</h2>
        <p class="slide-subtitle">Trang chủ thiết kế sang trọng, tối ưu trải nghiệm doanh nhân với các phân hệ nghiệp vụ 1 chạm</p>
      </div>
      <div class="slide-body">
        <div class="card" style="flex: 1;">
          <div class="card-title">Trải Nghiệm Doanh Nhân Đẳng Cấp:</div>
          <div class="card-desc">
            <b>✔ Trang Chủ Cá Nhân Hóa:</b> Hiển thị lời chào cá nhân, chức danh CLB, sự kiện sắp diễn ra và cơ hội kinh doanh.<br><br>
            <b>✔ Thanh Điều Hướng 1 Chạm:</b> Truy cập nhanh Sự kiện, Sàn B2B, Trao cơ hội, Danh bạ và Kênh chat.<br><br>
            <b>✔ Đa Nền Tảng iOS & Android:</b> Hỗ trợ cài đặt mượt mà trên iPhone và Android với công nghệ Capacitor/PWA.<br><br>
            <b>✔ Chế Độ Sáng / Tối (Dark Mode):</b> Chuẩn Luxury Gold & Royal Navy, thân thiện cho lãnh đạo.
          </div>
        </div>
        <div class="img-frame">
          <img src="images/evidence/app_02_home_dashboard.png" alt="App Home Dashboard">
        </div>
      </div>
      <div class="slide-footer">
        <span>CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 7 / 16</span>
      </div>
    </div>

    <!-- SLIDE 8: VIP CARD & RADAR -->
    <div class="slide">
      <div class="slide-top-bar"></div>
      <div class="slide-header">
        <span class="eyebrow">Định Danh Số Đẳng Cấp</span>
        <h2 class="slide-title">Thẻ Hội Viên VIP 3D Ánh Vàng & Radar Định Vị Không Dây</h2>
        <p class="slide-subtitle">Giải pháp thay thế danh thiếp giấy truyền thống, nâng tầm vị thế thương hiệu cá nhân của mỗi CEO</p>
      </div>
      <div class="slide-body">
        <div class="card" style="flex: 1;">
          <div class="card-title">Công Nghệ Thẻ Điện Tử & Radar:</div>
          <div class="card-desc">
            <b>✔ Thẻ VIP 3D Lật 2 Mặt:</b> Mặt trước khắc nổi thông tin doanh nhân, mặt sau chứa mã QR định danh số.<br><br>
            <b>✔ Danh Thiếp Số Công Khai:</b> Quét mã QR hoặc chạm NFC mở ngay danh thiếp, lưu danh bạ 1 chạm.<br><br>
            <b>✔ Radar Quét Tìm Hội Viên:</b> Định vị hội viên tham dự cùng phòng họp để kết nối giao lưu.<br><br>
            <b>✔ Huy Hiệu Tích Xanh:</b> Chứng nhận hội viên chính thức đã thẩm định uy tín từ Ban Chấp Hành.
          </div>
        </div>
        <div class="img-frame">
          <img src="images/evidence/09_app_vip_card.png" alt="VIP Card 3D">
        </div>
      </div>
      <div class="slide-footer">
        <span>CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 8 / 16</span>
      </div>
    </div>

    <!-- SLIDE 9: SỰ KIỆN 2 LUỒNG -->
    <div class="slide">
      <div class="slide-top-bar"></div>
      <div class="slide-header">
        <span class="eyebrow">Tự Động Hóa Sự Kiện</span>
        <h2 class="slide-title">Quy Trình Sự Kiện: Cấu Hình Trên CRM, Nhận Vé Pass Trên App</h2>
        <p class="slide-subtitle">Khép kín vòng đời sự kiện từ công bố, thu phí VietQR tự động, phát hành vé điện tử đến check-in 1 giây</p>
      </div>
      <div class="slide-body">
        <div class="card-grid-2">
          <div class="card">
            <div class="card-title">🎟️ Luồng Miễn Phí (0đ)</div>
            <div class="card-desc">Hội viên đăng ký 1 chạm -> Tự động xác thực quyền hội viên -> Cấp ngay Vé Pass điện tử chứa mã QR Check-in & Số bốc thăm may mắn.</div>
          </div>
          <div class="card">
            <div class="card-title">💳 Luồng Thu Phí (VietQR)</div>
            <div class="card-desc">Hệ thống tự động sinh mã VietQR động đúng số tiền và nội dung chuyển khoản -> Tự động đối soát ngân hàng trong 3 giây -> Nhận vé VIP.</div>
          </div>
          <div class="card">
            <div class="card-title">🪑 Sơ Đồ Ghế Cinema</div>
            <div class="card-desc">Sắp xếp chỗ ngồi theo từng bàn tiệc hoặc dãy ghế VIP dành riêng cho Lãnh đạo và Nhà tài trợ; loại bỏ nhầm lẫn vị trí.</div>
          </div>
          <div class="card">
            <div class="card-title">⚡ Check-in 1 Giây & Lucky Draw</div>
            <div class="card-desc">Lễ tân quét mã QR trong 1 giây để kiểm soát vé vào cửa; dữ liệu tự động nạp vào vòng quay Lucky Draw trực tiếp trên sân khấu.</div>
          </div>
        </div>
      </div>
      <div class="slide-footer">
        <span>CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 9 / 16</span>
      </div>
    </div>

    <!-- SLIDE 10: SÀN GIAO THƯƠNG B2B -->
    <div class="slide">
      <div class="slide-top-bar"></div>
      <div class="slide-header">
        <span class="eyebrow">Giao Thương Nội Khối</span>
        <h2 class="slide-title">Sàn Thương Mại B2B & Phân Quyền Đăng Tin Sản Phẩm Chuẩn Hóa</h2>
        <p class="slide-subtitle">Cơ chế phân quyền dữ liệu chặt chẽ: Tác giả chủ động quản trị tin đăng, đối tác nhận báo giá VIP</p>
      </div>
      <div class="slide-body">
        <div class="card" style="flex: 1;">
          <div class="card-title">Phân Quyền Minh Bạch Sàn B2B:</div>
          <div class="card-desc">
            <b>✔ Tác Giả Sở Hữu Tin Đăng:</b> Hiển thị huy hiệu "Sản phẩm của bạn" cùng nút Sửa / Xóa tin nhanh chóng.<br><br>
            <b>✔ Nút "Nhận Báo Giá VIP" Cho Khách:</b> Hội viên khác gửi yêu cầu báo giá VIP trực tiếp đến chủ doanh nghiệp.<br><br>
            <b>✔ Ưu Đãi Độc Quyền CEO 1983:</b> Hiển thị giá thị trường và giá độc quyền nội khối.<br><br>
            <b>✔ Đồng Bộ Đơn Hàng Về CRM:</b> Mọi giao dịch báo giá đều được tổng hợp về Web CRM để hỗ trợ kết nối.
          </div>
        </div>
        <div class="img-frame">
          <img src="images/evidence/16_app_products_ecommerce_grid.png" alt="Products Grid">
        </div>
      </div>
      <div class="slide-footer">
        <span>CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 10 / 16</span>
      </div>
    </div>

    <!-- SLIDE 11: BẢNG TIN TRAO CƠ HỘI -->
    <div class="slide">
      <div class="slide-top-bar"></div>
      <div class="slide-header">
        <span class="eyebrow">Trao Cơ Hội B2B</span>
        <h2 class="slide-title">Bảng Tin Trao Cơ Hội & Giám Sát Tiến Trình Khép Deal Thực Tế</h2>
        <p class="slide-subtitle">Tạo dòng chảy cơ hội kinh doanh liên tục: Phân tách ngân sách VNĐ rõ ràng, giám sát người quan tâm Realtime</p>
      </div>
      <div class="slide-body">
        <div class="card" style="flex: 1;">
          <div class="card-title">Quy Trình Trao Cơ Hội:</div>
          <div class="card-desc">
            <b>✔ Nhập Ngân Sách Phân Tách VNĐ:</b> Tự động định dạng dấu chấm phân cách hàng nghìn (VD: 50.000.000 đ) rõ ràng.<br><br>
            <b>✔ Phân Quyền Chủ Bài Đăng:</b> Hiển thị nút "Cơ hội của bạn" để xem danh sách người quan tâm, không bị nút tự quan tâm cơ hội của mình.<br><br>
            <b>✔ Danh Sách Người Quan Tâm Realtime:</b> Khi đối tác bấm quan tâm, thông tin liên hệ và số điện thoại hiển thị ngay lập tức.<br><br>
            <b>✔ Ghi Nhận Deal Trên CRM:</b> Ghi nhận hợp đồng kết nối thành công để vinh danh thành viên đóng góp.
          </div>
        </div>
        <div class="img-frame">
          <img src="images/evidence/20_app_opportunities_feed.png" alt="Opportunities Feed">
        </div>
      </div>
      <div class="slide-footer">
        <span>CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 11 / 16</span>
      </div>
    </div>

    <!-- SLIDE 12: CHAT BẢO MẬT -->
    <div class="slide">
      <div class="slide-top-bar"></div>
      <div class="slide-header">
        <span class="eyebrow">Kết Nối Bảo Mật</span>
        <h2 class="slide-title">Kênh Chat & Nhắn Tin Nội Bộ Riêng Tư Giữa Các Lãnh Đạo</h2>
        <p class="slide-subtitle">Bảo mật tuyệt đối thông tin kinh doanh, xóa bỏ nguy cơ lộ lọt dữ liệu khi giao tiếp trên các nền tảng mở</p>
      </div>
      <div class="slide-body">
        <div class="card" style="flex: 1;">
          <div class="card-title">Giao Tiếp Khép Kín Dành Cho CEO:</div>
          <div class="card-desc">
            <b>✔ Trò Chuyện 1-1 Mã Hóa:</b> Nhắn tin trực tiếp giữa hai lãnh đạo, bảo mật tài liệu và báo giá.<br><br>
            <b>✔ Nhóm Ngành Hàng Chuyên Sâu:</b> Thảo luận theo chuyên đề: Bất động sản, Công nghệ, Sản xuất, Tài chính.<br><br>
            <b>✔ Gửi Danh Thiếp & Vị Trí:</b> Chia sẻ danh thiếp đối tác và ghim vị trí điểm hẹn họp mặt 1 chạm.<br><br>
            <b>✔ Gọi Thoại & Thu Hồi Tin:</b> Hỗ trợ gọi thoại trực tiếp và thu hồi tin nhắn khi gửi nhầm.
          </div>
        </div>
        <div class="img-frame">
          <img src="images/evidence/24_app_messages_inbox.png" alt="Messages Inbox">
        </div>
      </div>
      <div class="slide-footer">
        <span>CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 12 / 16</span>
      </div>
    </div>

    <!-- SLIDE 13: QUẢN LÝ TÀI CHÍNH & QUỸ HỘI -->
    <div class="slide">
      <div class="slide-top-bar"></div>
      <div class="slide-header">
        <span class="eyebrow">Minh Bạch Tài Chính</span>
        <h2 class="slide-title">Quản Lý Quỹ Hội, Niên Phí & Thu Chi Minh Bạch Đối Soát Tự Động</h2>
        <p class="slide-subtitle">Xây dựng lòng tin tuyệt đối giữa hội viên và Ban Điều Hành nhờ hệ thống kế toán quỹ số hóa chuẩn chỉ</p>
      </div>
      <div class="slide-body">
        <div class="card" style="flex: 1;">
          <div class="card-title">Tự Động Hóa Kế Toán Quỹ:</div>
          <div class="card-desc">
            <b>✔ Theo Dõi Niên Phí Từng Hội Viên:</b> Phân loại: Đã đóng, Chưa đóng, Sắp đến hạn; tra cứu lịch sử đóng quỹ qua từng năm.<br><br>
            <b>✔ Nhắc Phí Tự Động Đa Kênh:</b> Tự động gửi thông báo nhắc gia hạn qua App Push và Email kèm mã VietQR đóng phí.<br><br>
            <b>✔ Sổ Thu - Chi Minh Bạch:</b> Ghi nhận chi tiết từng khoản thu tài trợ và chi phí hoạt động có hóa đơn đính kèm.<br><br>
            <b>✔ Báo Cáo Ngân Sách Đại Hội:</b> Tự động xuất báo cáo tài chính trực quan phục vụ đại hội thường niên.
          </div>
        </div>
        <div class="img-frame">
          <img src="images/evidence/crm_08_fees_management.png" alt="Fees Management CRM">
        </div>
      </div>
      <div class="slide-footer">
        <span>CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 13 / 16</span>
      </div>
    </div>

    <!-- SLIDE 14: LANDING 3D & ONBOARDING -->
    <div class="slide">
      <div class="slide-top-bar"></div>
      <div class="slide-header">
        <span class="eyebrow">Tuyển Mộ Hội Viên Mới</span>
        <h2 class="slide-title">Cổng Thông Tin Đối Ngoại Landing 3D & Cấp Tài Khoản Tự Động</h2>
        <p class="slide-subtitle">Trải nghiệm gia nhập ấn tượng: Đăng ký trực tuyến, Admin duyệt trên CRM, hệ thống tự cấp mật khẩu qua Email</p>
      </div>
      <div class="slide-body">
        <div class="card" style="flex: 1;">
          <div class="card-title">Quy Trình Gia Nhập Khép Kín:</div>
          <div class="card-desc">
            <b>✔ Landing Page 3D Điện Ảnh:</b> Cổng thông tin đối ngoại giới thiệu tôn chỉ và quyền lợi hội viên CLB CEO 1983.<br><br>
            <b>✔ Biểu Mẫu Gia Nhập 24/7:</b> Doanh nhân ứng tuyển điền thông tin và đính kèm hồ sơ trực tiếp.<br><br>
            <b>✔ Phê Duyệt 1 Chạm Trên CRM:</b> Ban Thư ký thẩm định và duyệt hồ sơ trực tiếp trên Web CRM.<br><br>
            <b>✔ Tự Cấp Mật Khẩu Qua Email:</b> Hệ thống tự động kích hoạt tài khoản và gửi email chúc mừng kèm mật khẩu đăng nhập.
          </div>
        </div>
        <div class="img-frame">
          <img src="images/evidence/01_landing_hero.png" alt="Landing Hero">
        </div>
      </div>
      <div class="slide-footer">
        <span>CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 14 / 16</span>
      </div>
    </div>

    <!-- SLIDE 15: ROI & HIỆU QUẢ -->
    <div class="slide">
      <div class="slide-top-bar"></div>
      <div class="slide-header">
        <span class="eyebrow">Hiệu Quả & ROI Thực Tế</span>
        <h2 class="slide-title">Giá Trị Đột Phá Sau Khi Đưa Hệ Sinh Thái Vào Vận Hành Thực Tiễn</h2>
        <p class="slide-subtitle">Minh chứng hiệu quả rõ nét bằng các chỉ số định lượng cụ thể, giải phóng nguồn lực cho Ban Lãnh Đạo</p>
      </div>
      <div class="slide-body">
        <div class="card-grid-2">
          <div class="card">
            <div class="card-num">85%</div>
            <div class="card-title">Tiết Kiệm Thời Gian Thư Ký</div>
            <div class="card-desc">Tự động hóa nhắc phí, đối soát danh sách, soát vé sự kiện và gửi thông báo, giúp văn phòng hội tập trung phát triển hội viên.</div>
          </div>
          <div class="card">
            <div class="card-num">300%</div>
            <div class="card-title">Tăng Trưởng Giao Thương Nội Khối</div>
            <div class="card-desc">Sàn B2B và Bảng tin cơ hội giúp hội viên dễ dàng tiếp cận nhu cầu của nhau, tăng gấp 3 lần số lượng giao dịch và giá trị hợp đồng kết nối.</div>
          </div>
          <div class="card">
            <div class="card-num">1 Giây</div>
            <div class="card-title">Tốc Độ Check-in Đón Tiếp</div>
            <div class="card-desc">Xóa bỏ cảnh xếp hàng ùn tắc tại các đại hội lớn. Quét mã QR Pass trong 1 giây để xác thực vé, tự động nạp dữ liệu vào Lucky Draw.</div>
          </div>
          <div class="card">
            <div class="card-num">100%</div>
            <div class="card-title">Bảo Mật Dữ Liệu Tập Trung</div>
            <div class="card-desc">Toàn bộ thông tin cá nhân và doanh nghiệp của các CEO được bảo vệ an toàn trên hạ tầng máy chủ riêng với giao thức HTTPS độc lập.</div>
          </div>
        </div>
      </div>
      <div class="slide-footer">
        <span>CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 15 / 16</span>
      </div>
    </div>

    <!-- SLIDE 16: KẾ HOẠCH & CAM KẾT (DARK) -->
    <div class="slide dark">
      <div class="slide-top-bar"></div>
      <div class="slide-header">
        <span class="eyebrow">Kế Hoạch Hành Động 2026</span>
        <h2 class="slide-title">Lộ Trình Triển Khai & Cam Kết Đồng Hành Cùng CEO 1983</h2>
        <p class="slide-subtitle">Hệ thống đã hoàn thiện 100% mã nguồn và sẵn sàng bàn giao, đào tạo Ban Chấp Hành đưa vào hoạt động chính thức</p>
      </div>
      <div class="slide-body">
        <div class="card-grid-4">
          <div class="card">
            <div class="card-num" style="font-size: 16px;">GIAI ĐOẠN 1</div>
            <div class="card-title">Chuyển Giao</div>
            <div class="card-desc">Kiểm thử toàn diện luồng nghiệp vụ trên Live HTTPS; bàn giao tài khoản Admin cho Ban Thư Ký.</div>
          </div>
          <div class="card">
            <div class="card-num" style="font-size: 16px;">GIAI ĐOẠN 2</div>
            <div class="card-title">Đào Tạo & Nhập Liệu</div>
            <div class="card-desc">Tổ chức tập huấn sử dụng Web CRM cho Ban Điều Hành; nhập liệu 100+ doanh nghiệp hội viên.</div>
          </div>
          <div class="card">
            <div class="card-num" style="font-size: 16px;">GIAI ĐOẠN 3</div>
            <div class="card-title">Ra Mắt Tại Đại Hội</div>
            <div class="card-desc">Kích hoạt Thẻ VIP 3D cho toàn thể hội viên; áp dụng Check-in QR Pass và Lucky Draw tại đại hội.</div>
          </div>
          <div class="card">
            <div class="card-num" style="font-size: 16px;">GIAI ĐOẠN 4</div>
            <div class="card-title">Bảo Trì 24/7</div>
            <div class="card-desc">Đồng hành hỗ trợ kỹ thuật 24/7; liên tục bổ sung tiện ích số mới theo nhu cầu phát triển của hiệp hội.</div>
          </div>
        </div>
      </div>
      <div style="background: var(--gold-dark); border-radius: 8px; padding: 10px 16px; margin-top: 12px; text-align: center; color: white;">
        <p style="font-size: 13px; font-weight: bold;">SẴN SÀNG ĐƯA VÀO VẬN HÀNH THỰC TẾ · NÂNG TẦM VỊ THẾ CLB DOANH NHÂN CEO 1983</p>
        <p style="font-size: 11px; opacity: 0.9;">Cổng Quản Trị CRM: https://14.225.217.232:5443 · App Hiệp Hội: https://14.225.217.232:5444 · ceo1983.com</p>
      </div>
      <div class="slide-footer">
        <span>CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 16 / 16</span>
      </div>
    </div>
  </div>

  <div class="nav-controls">
    <button class="btn-nav" id="btnPrev">← Trang Trước</button>
    <div class="dots" id="dotsContainer"></div>
    <button class="btn-nav" id="btnNext">Trang Sau →</button>
  </div>

  <script>
    let currentSlide = 1;
    const totalSlides = 16;
    const slides = document.querySelectorAll('.slide');
    const dotsContainer = document.getElementById('dotsContainer');

    for (let i = 1; i <= totalSlides; i++) {
      const dot = document.createElement('div');
      dot.className = 'dot' + (i === 1 ? ' active' : '');
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    }

    function goToSlide(n) {
      if (n < 1) n = 1;
      if (n > totalSlides) n = totalSlides;
      currentSlide = n;

      slides.forEach((s, idx) => {
        s.classList.toggle('active', idx + 1 === currentSlide);
      });

      const dots = document.querySelectorAll('.dot');
      dots.forEach((d, idx) => {
        d.classList.toggle('active', idx + 1 === currentSlide);
      });
    }

    document.getElementById('btnPrev').addEventListener('click', () => goToSlide(currentSlide - 1));
    document.getElementById('btnNext').addEventListener('click', () => goToSlide(currentSlide + 1));

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') goToSlide(currentSlide + 1);
      if (e.key === 'ArrowLeft') goToSlide(currentSlide - 1);
    });
  </script>
</body>
</html>`;
  const htmlPath = path.join(OUT_DIR, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_CEO1983.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log(`✓ Generated Interactive HTML Pitch Deck -> ${htmlPath}`);

  // Copy to public/docs for in-app viewing
  const publicDocs = path.join(__dirname, '..', 'apps', 'vione_app_fe', 'public', 'docs');
  if (fs.existsSync(publicDocs)) {
    fs.copyFileSync(htmlPath, path.join(publicDocs, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_CEO1983.html'));
    fs.copyFileSync(mdPath, path.join(publicDocs, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_CEO1983.md'));
    fs.copyFileSync(pptxPath, path.join(publicDocs, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_CEO1983.pptx'));
    console.log('✓ Synced Presentation files to public/docs for in-app viewing!');
  }

  console.log('=== 16-SLIDE PRESENTATION GENERATION COMPLETED! ===\n');
}

buildMasterPresentation().catch(console.error);
