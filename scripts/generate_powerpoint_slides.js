/**
 * PowerPoint Slide Deck Generator for CEO 1983 Ecosystem
 * Generates:
 * 1. document/SLIDE_THUYET_TRINH_APP_HIEP_HOI_CEO1983.pptx
 * 2. document/SLIDE_THUYET_TRINH_CRM_QUAN_TRI_CEO1983.pptx
 *
 * Executive Balanced Brand Palette (CEO 1983 Standard):
 * - Deep Navy / Royal Blue: #0A1A3A / #003B95 / #002B70
 * - Warm Gold / Amber Accent: #F59E0B / #D97706 / #FEF3C7
 * - Platinum White / Clean Slate: #F8FAFC / #FFFFFF / #E2E8F0 / #1E293B
 *
 * Content Grounding: Official information from ceo1983.com & HanoiBA
 */

const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'document');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Color Palette Constants (HEX without # for pptxgenjs)
const C = {
  // Dark / Cover Palette
  NAVY_DARK: '0A1A3A',
  NAVY_PRIMARY: '003B95',
  NAVY_CARD: '132A56',
  NAVY_HOVER: '002B70',
  // Warm Gold / Amber
  GOLD_ACCENT: 'F59E0B',
  GOLD_DARK: 'D97706',
  GOLD_LIGHT: 'FEF3C7',
  GOLD_BORDER: 'FDE68A',
  // Light Theme (Content Slides)
  BG_LIGHT: 'F8FAFC',
  WHITE: 'FFFFFF',
  BORDER_SUBTLE: 'E2E8F0',
  BORDER_FOCUS: 'CBD5E1',
  TEXT_DARK: '0F172A',
  TEXT_BODY: '334155',
  TEXT_MUTED: '64748B',
  // Status Accents
  EMERALD: '059669',
  EMERALD_BG: 'ECFDF5',
  BLUE_BG: 'EFF6FF',
};

// Common slide footer helper
function addSlideFooter(slide, pres) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 7.0, w: 11.73, h: 0.02,
    fill: { color: C.BORDER_SUBTLE }
  });
  slide.addText('Hiệp Hội Doanh Nhân CEO 1983 · Hệ Thống Quản Trị CEO 1983', {
    x: 0.8, y: 7.05, w: 7.0, h: 0.3,
    color: C.TEXT_MUTED, fontSize: 9.5, fontFace: 'Calibri'
  });
  slide.addText('Bản Quyền © 2026 CLB Doanh Nhân CEO 1983 · ceo1983.com', {
    x: 8.0, y: 7.05, w: 4.53, h: 0.3,
    color: C.TEXT_MUTED, fontSize: 9.5, align: 'right', fontFace: 'Calibri'
  });
}

// Common slide header helper for content slides
function addSlideHeader(slide, pres, eyebrow, title, subtitle) {
  slide.background = { color: C.BG_LIGHT };

  // Top Accent Strip
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 0.08,
    fill: { color: C.GOLD_ACCENT }
  });

  // Eyebrow badge
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 0.45, w: 2.8, h: 0.32,
    fill: { color: C.NAVY_PRIMARY },
    roundRadio: 0.08
  });
  slide.addText(eyebrow, {
    x: 0.8, y: 0.45, w: 2.8, h: 0.32,
    color: C.WHITE, bold: true, fontSize: 10, align: 'center', valign: 'middle', fontFace: 'Calibri'
  });

  // Main Slide Title
  slide.addText(title, {
    x: 0.8, y: 0.85, w: 11.73, h: 0.65,
    color: C.NAVY_PRIMARY, bold: true, fontSize: 24, fontFace: 'Calibri'
  });

  // Subtitle / Scope
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.8, y: 1.5, w: 11.73, h: 0.4,
      color: C.TEXT_MUTED, fontSize: 12.5, italic: true, fontFace: 'Calibri'
    });
  }

  addSlideFooter(slide, pres);
}

// =============================================================================
// PRESENTATION 1: APP HỘI VIÊN HIỆP HỘI (CLB CEO 1983)
// =============================================================================
async function generateAppSlideDeck() {
  console.log('Generating App PowerPoint Slides (Executive Light Palette)...');
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.author = 'CLB Doanh Nhân CEO 1983';
  pres.title = 'Hệ Sinh Thái Số Hóa Doanh Nhân CEO 1983 — App Hiệp Hội';

  // ---------------------------------------------------------------------------
  // SLIDE 1: Cover Slide (Prestigious Navy & Gold)
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    slide.background = { color: C.NAVY_DARK };

    // Top Brand Badge
    slide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 0.8, w: 4.2, h: 0.42,
      fill: { color: C.GOLD_ACCENT },
      roundRadio: 0.1
    });
    slide.addText('HỘI DOANH NHÂN TRẺ HÀ NỘI (HANOIBA)', {
      x: 0.8, y: 0.8, w: 4.2, h: 0.42,
      color: C.NAVY_DARK, bold: true, fontSize: 11, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });

    // Main App Title
    slide.addText('ỨNG DỤNG DI ĐỘNG CLB DOANH NHÂN CEO 1983', {
      x: 0.8, y: 1.55, w: 11.73, h: 1.2,
      color: C.WHITE, bold: true, fontSize: 32, fontFace: 'Calibri'
    });

    // Slogan & Subtitle
    slide.addText('Tôn Chỉ: "Kết Nối Bền — Phát Triển Vững" · Phiên bản v2.6.0 Pro', {
      x: 0.8, y: 2.85, w: 11.73, h: 0.5,
      color: C.GOLD_ACCENT, bold: true, fontSize: 18, italic: true, fontFace: 'Calibri'
    });

    slide.addText('Nền tảng số hóa đặc quyền dành riêng cho Lãnh đạo cấp cao sinh năm 1983 (Quý Hợi - Đại Hải Thủy), kết nối giao thương B2B, quản lý hội viên và thẻ định danh thông minh.', {
      x: 0.8, y: 3.45, w: 10.5, h: 0.8,
      color: C.BORDER_SUBTLE, fontSize: 13.5, fontFace: 'Calibri'
    });

    // 3 Key Metrics Cards
    const metrics = [
      { num: '100%', label: 'Thẻ Doanh Nhân 3D', sub: 'Chạm NFC & vCard 1 chạm' },
      { num: '05', label: 'Kênh Thông Báo CRM', sub: 'Vé, tin nhắn, sự kiện & kết nối' },
      { num: '0đ', label: 'Vé Điện Tử Tức Thì', sub: 'Cấp mã quay số Lucky Draw #XXXX' }
    ];

    metrics.forEach((m, idx) => {
      const xPos = 0.8 + idx * 4.0;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 4.8, w: 3.7, h: 1.8,
        fill: { color: C.NAVY_CARD },
        line: { color: C.NAVY_PRIMARY, width: 1.5 },
        roundRadio: 0.15
      });
      slide.addText(m.num, {
        x: xPos + 0.3, y: 5.0, w: 3.1, h: 0.7,
        color: C.GOLD_ACCENT, bold: true, fontSize: 32, fontFace: 'Calibri'
      });
      slide.addText(m.label, {
        x: xPos + 0.3, y: 5.75, w: 3.1, h: 0.4,
        color: C.WHITE, bold: true, fontSize: 13.5, fontFace: 'Calibri'
      });
      slide.addText(m.sub, {
        x: xPos + 0.3, y: 6.15, w: 3.1, h: 0.35,
        color: C.BORDER_SUBTLE, fontSize: 10.5, fontFace: 'Calibri'
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 2: Giới Thiệu CLB CEO 1983 & 4 Trụ Cột Chiến Lược (ceo1983.com)
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'TỔNG QUAN TỔ CHỨC', 'CLB Doanh Nhân CEO 1983 — Trực Thuộc HanoiBA', 'Hội tụ các Chủ tịch HĐQT, Tổng Giám đốc, CEO, Nhà sáng lập tuổi Quý Hợi 1983 (Đại Hải Thủy)');

    const pillars = [
      {
        code: 'TRỤ CỘT 01',
        title: 'Giao Thương & Xúc Tiến B2B',
        desc: 'Mạng lưới kết nối cơ hội kinh doanh nội bộ, sàn thương mại điện tử chuyên biệt C2C/B2B và chương trình đối thoại cung cầu.',
        accent: C.NAVY_PRIMARY
      },
      {
        code: 'TRỤ CỘT 02',
        title: 'Đào Tạo & Nâng Cao Năng Lực',
        desc: 'Chương trình C-Level Masterclass, tọa đàm kinh tế vĩ mô, chia sẻ kinh nghiệm quản trị doanh nghiệp và chuyển đổi số thực chiến.',
        accent: C.GOLD_DARK
      },
      {
        code: 'TRỤ CỘT 03',
        title: 'Thể Thao & Gắn Kết Hội Viên',
        desc: 'Giải Golf CEO 1983 thường niên, CLB Tennis, giải Chạy bộ phong trào và các chuyến Caravan khảo sát thị trường liên tỉnh.',
        accent: C.EMERALD
      },
      {
        code: 'TRỤ CỘT 04',
        title: 'Văn Hóa & Trách Nhiệm Xã Hội',
        desc: 'Chương trình thiện nguyện vì cộng đồng, quỹ ươm mầm tài năng trẻ và các hoạt động xây dựng nếp sống văn hóa doanh nhân chuẩn mực.',
        accent: C.NAVY_HOVER
      }
    ];

    pillars.forEach((p, idx) => {
      const xPos = 0.8 + idx * 2.95;
      // White Card
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 4.6,
        fill: { color: C.WHITE },
        line: { color: C.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      // Card Accent Top Bar
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 0.1,
        fill: { color: p.accent },
        roundRadio: 0.08
      });
      // Badge Code
      slide.addText(p.code, {
        x: xPos + 0.25, y: 2.35, w: 2.3, h: 0.3,
        color: p.accent, bold: true, fontSize: 11, fontFace: 'Calibri'
      });
      // Title
      slide.addText(p.title, {
        x: xPos + 0.25, y: 2.7, w: 2.3, h: 0.8,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 14, fontFace: 'Calibri'
      });
      // Description
      slide.addText(p.desc, {
        x: xPos + 0.25, y: 3.55, w: 2.3, h: 2.8,
        color: C.TEXT_BODY, fontSize: 11.5, fontFace: 'Calibri'
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 3: Thẻ Doanh Nhân VIP 3D, NFC & Danh Thiếp Số
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'ĐỊNH DANH SỐ ĐỘC BẢN', 'Thẻ Doanh Nhân VIP 3D — Chạm NFC & vCard Thông Minh', 'Số hóa 100% danh thiếp vật lý, bảo mật danh tính, kết nối đối tác chỉ với 1 chạm');

    const features = [
      {
        title: 'Mặt Trước — Nhận Diện Đẳng Cấp',
        items: [
          'Logo Hiệp hội Doanh nhân CEO 1983 mạ vàng 3D sắc nét.',
          'Họ tên Doanh nhân, Pháp nhân Doanh nghiệp và Chức danh C-Level.',
          'Mã định danh duy nhất (CEO-1983-xxx) và Hạng thẻ VIP Gold / Diamond.',
          'Thời hạn hiệu lực hội viên bảo đảm tư cách thành viên chính thức.'
        ]
      },
      {
        title: 'Mặt Sau — Mã QR Độc Bản & Bảo Mật',
        items: [
          'Mã QR tra cứu danh tính bảo mật theo chuẩn thời gian thực.',
          'Quét từ camera ngoài app tự động mở trang web xác thực chính chủ.',
          'Cam kết bảo mật thông tin tài chính và số điện thoại theo tùy chọn.',
          'Huy hiệu chứng thực điện tử 24/7 từ Ban Thư ký CLB CEO 1983.'
        ]
      },
      {
        title: 'Tương Tác 1 Chạm Siêu Tốc',
        items: [
          'Chạm công nghệ NFC truyền danh thiếp tức thì sang điện thoại đối tác.',
          'Nút bấm Tải danh bạ (.vcf) lưu thẳng vào Phonebook iOS & Android.',
          'Gọi điện, gửi Email, mở chat Zalo và Chia sẻ thẻ chỉ trong 1 thao tác.',
          'Hoàn toàn không dùng dữ liệu ảo hay thông tin mock tĩnh.'
        ]
      }
    ];

    features.forEach((f, idx) => {
      const xPos = 0.8 + idx * 4.0;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 3.7, h: 4.6,
        fill: { color: C.WHITE },
        line: { color: C.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      // Header strip
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 3.7, h: 0.5,
        fill: { color: idx === 1 ? C.GOLD_LIGHT : C.BLUE_BG },
        roundRadio: 0.08
      });
      slide.addText(f.title, {
        x: xPos + 0.25, y: 2.1, w: 3.2, h: 0.5,
        color: idx === 1 ? C.GOLD_DARK : C.NAVY_PRIMARY, bold: true, fontSize: 12.5, valign: 'middle', fontFace: 'Calibri'
      });

      f.items.forEach((item, iIdx) => {
        slide.addText(`•  ${item}`, {
          x: xPos + 0.25, y: 2.8 + iIdx * 0.95, w: 3.2, h: 0.85,
          color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri'
        });
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 4: Sự Kiện & Luồng Nhận Vé 0đ Tức Thì
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'QUẢN TRỊ SỰ KIỆN SỐ', 'Hệ Thống Sự Kiện, Vé Điện Tử 0đ & Bốc Thăm Lucky Draw', 'Quy trình tham gia sự kiện tự động hóa 100%, trả vé ngay về Thông báo và Tin nhắn');

    const steps = [
      { step: '01', title: 'Chọn Sự Kiện & Khán Phòng', desc: 'Hội viên duyệt danh sách sự kiện, xem sơ đồ chỗ ngồi VIP, diễn giả và lịch trình gala.' },
      { step: '02', title: 'Đăng Ký Vé Hội Viên (0đ)', desc: 'Bấm đăng ký vé đặc quyền 0đ; hệ thống xác thực tức thì trong 100ms không cần xét duyệt.' },
      { step: '03', title: 'Cấp Vé & Mã May Mắn', desc: 'Khởi tạo vé QR độc bản và cấp tự động Mã số May mắn Lucky Draw định dạng #XXXX.' },
      { step: '04', title: 'Giao Vé Đa Kênh Tức Thì', desc: 'Bắn thông báo đẩy cá nhân và gửi thẻ vé tương tác trực tiếp vào Hộp thư Tin nhắn App.' }
    ];

    steps.forEach((s, idx) => {
      const xPos = 0.8 + idx * 2.95;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 4.6,
        fill: { color: C.WHITE },
        line: { color: C.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      // Number badge
      slide.addShape(pres.ShapeType.rect, {
        x: xPos + 0.25, y: 2.4, w: 0.7, h: 0.7,
        fill: { color: C.NAVY_PRIMARY },
        roundRadio: 0.1
      });
      slide.addText(s.step, {
        x: xPos + 0.25, y: 2.4, w: 0.7, h: 0.7,
        color: C.GOLD_ACCENT, bold: true, fontSize: 18, align: 'center', valign: 'middle', fontFace: 'Calibri'
      });
      // Title
      slide.addText(s.title, {
        x: xPos + 0.25, y: 3.3, w: 2.3, h: 0.7,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 13.5, fontFace: 'Calibri'
      });
      // Desc
      slide.addText(s.desc, {
        x: xPos + 0.25, y: 4.1, w: 2.3, h: 2.3,
        color: C.TEXT_BODY, fontSize: 11.5, fontFace: 'Calibri'
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 5: Sàn Giao Thương B2B & Cơ Hội Kinh Doanh (Marketplace)
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'KẾT NỐI GIAO THƯƠNG', 'Sàn Giao Thương B2B Nội Bộ & Khớp Nhu Cầu Matching', 'Tối ưu hóa dòng tiền và doanh thu thông qua chuỗi cung ứng khép kín giữa các hội viên');

    const cards = [
      {
        title: 'Sàn Sản Phẩm & Dịch Vụ B2B',
        desc: 'Hội viên đăng tải sản phẩm, dịch vụ doanh nghiệp với mức chiết khấu ưu đãi nội bộ (Member Deal). Kiểm duyệt bảo đảm chất lượng pháp nhân từ Ban Thư ký.',
        stats: 'Hơn 50+ Ngành nghề chủ đạo'
      },
      {
        title: 'Bảng Tin Cơ Hội (Needs & Offers)',
        desc: 'Mô hình Cần Mua - Cần Bán minh bạch. Hội viên đăng tin chào thầu, tìm kiếm đối tác cung ứng và phản hồi chào giá (Send Quote) trực tiếp trên app.',
        stats: 'Kết nối trực tiếp Chủ tịch & CEO'
      },
      {
        title: 'Claim Cơ Hội & Ghi Nhận Doanh Thu',
        desc: 'Khi hai bên chốt hợp đồng thành công, thao tác Claim cơ hội tự động ghi nhận điểm giao thương và cập nhật vào Bảng Vinh Danh Doanh Số Hiệp Hội.',
        stats: 'Minh bạch KPI đóng góp CLB'
      }
    ];

    cards.forEach((c, idx) => {
      const xPos = 0.8 + idx * 4.0;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 3.7, h: 4.6,
        fill: { color: C.WHITE },
        line: { color: C.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 3.7, h: 0.1,
        fill: { color: idx === 0 ? C.NAVY_PRIMARY : (idx === 1 ? C.GOLD_ACCENT : C.EMERALD) }
      });
      slide.addText(c.title, {
        x: xPos + 0.3, y: 2.4, w: 3.1, h: 0.6,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 14.5, fontFace: 'Calibri'
      });
      slide.addText(c.desc, {
        x: xPos + 0.3, y: 3.1, w: 3.1, h: 2.4,
        color: C.TEXT_BODY, fontSize: 12, fontFace: 'Calibri'
      });
      // Bottom highlight tag
      slide.addShape(pres.ShapeType.rect, {
        x: xPos + 0.3, y: 5.7, w: 3.1, h: 0.6,
        fill: { color: C.BG_LIGHT },
        roundRadio: 0.08
      });
      slide.addText(`★  ${c.stats}`, {
        x: xPos + 0.3, y: 5.7, w: 3.1, h: 0.6,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 11, align: 'center', valign: 'middle', fontFace: 'Calibri'
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 6: Mạng Xã Hội Khoảnh Khắc & Tin Nhắn Kết Nối 1-on-1
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'TƯƠNG TÁC THỜI GIAN THỰC', 'Mạng Xã Hội Doanh Nhân, Khoảnh Khắc & Tin Nhắn 1-on-1', 'Không gian số riêng tư, văn minh dành riêng cho Lãnh đạo cấp cao CEO 1983');

    const modules = [
      {
        title: 'Bảng Tin Khoảnh Khắc (Moments)',
        points: [
          'Chia sẻ thành tựu ký kết hợp đồng, giải thưởng doanh nghiệp.',
          'Bình luận dạng cây phân cấp đa tầng (Nested Comments).',
          'Tương tác thả tim, chia sẻ cơ hội trực tiếp trên dòng thời gian.',
          'Chế độ xem video ngắn và hình ảnh chất lượng cao 4K.'
        ]
      },
      {
        title: 'Tin Nhắn Kết Nối Doanh Nghiệp (DM)',
        points: [
          'Trao đổi bảo mật 1-1 giữa các Chủ tịch & Tổng Giám đốc.',
          'Gửi danh thiếp điện tử, vị trí công ty và file tài liệu chào thầu.',
          'Nhận vé sự kiện tương tác và thẻ thông báo chính thức từ Ban Thư ký.',
          'Cuộc gọi thoại bảo mật nội bộ qua nền tảng WebRTC.'
        ]
      }
    ];

    modules.forEach((m, idx) => {
      const xPos = 0.8 + idx * 6.0;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 5.7, h: 4.6,
        fill: { color: C.WHITE },
        line: { color: C.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 5.7, h: 0.5,
        fill: { color: C.BLUE_BG },
        roundRadio: 0.08
      });
      slide.addText(m.title, {
        x: xPos + 0.3, y: 2.1, w: 5.1, h: 0.5,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 13.5, valign: 'middle', fontFace: 'Calibri'
      });
      m.points.forEach((pt, pIdx) => {
        slide.addText(`✔  ${pt}`, {
          x: xPos + 0.3, y: 2.85 + pIdx * 0.9, w: 5.1, h: 0.75,
          color: C.TEXT_BODY, fontSize: 12, fontFace: 'Calibri'
        });
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 7: Bình Chọn Trực Tiếp (Live Voting) & Bốc Thăm May Mắn
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'HOẠT ĐỘNG TƯƠNG TÁC ĐẠI HỘI', 'Bình Chọn Live Voting & Vòng Quay May Mắn Lucky Draw', 'Công nghệ số hóa thời gian thực phục vụ Đại hội thường niên và Gala CEO 1983');

    const acts = [
      {
        title: 'Biểu Quyết & Bầu Cử Trực Tiếp (Live Voting)',
        items: [
          'Biểu quyết bầu Ban Chấp Hành, Nghị quyết và giải thưởng Gala.',
          'Hiển thị thông báo biểu quyết pop-up tức thì trên toàn bộ app hội viên.',
          'Khóa bình chọn tự động chống gian lận, 1 hội viên = 1 phiếu hợp lệ.',
          'Biểu đồ kết quả trực tiếp hiển thị đồng thời lên màn hình LED hội trường.'
        ]
      },
      {
        title: 'Quay Số May Mắn Theo Vé (Lucky Draw)',
        items: [
          'Quay thưởng tự động theo Mã số May mắn #XXXX trên vé sự kiện.',
          'Hiệu ứng âm thanh, đồ họa vòng quay số kịch tính trên màn hình LED.',
          'Khi trúng thưởng: Hệ thống tự động bắn thông báo chúc mừng về App.',
          'Lịch sử trúng giải lưu trữ minh bạch, phục vụ công tác trao giải.'
        ]
      }
    ];

    acts.forEach((a, idx) => {
      const xPos = 0.8 + idx * 6.0;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 5.7, h: 4.6,
        fill: { color: C.WHITE },
        line: { color: C.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 5.7, h: 0.5,
        fill: { color: idx === 0 ? C.BLUE_BG : C.GOLD_LIGHT },
        roundRadio: 0.08
      });
      slide.addText(a.title, {
        x: xPos + 0.3, y: 2.1, w: 5.1, h: 0.5,
        color: idx === 0 ? C.NAVY_PRIMARY : C.GOLD_DARK, bold: true, fontSize: 13.5, valign: 'middle', fontFace: 'Calibri'
      });
      a.items.forEach((it, iIdx) => {
        slide.addText(`★  ${it}`, {
          x: xPos + 0.3, y: 2.85 + iIdx * 0.9, w: 5.1, h: 0.75,
          color: C.TEXT_BODY, fontSize: 12, fontFace: 'Calibri'
        });
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 8: Cài Đặt PWA Đa Nền Tảng (Đặc Biệt Cho iOS / iPhone)
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'TRẢI NGHIỆM ĐA NỀN TẢNG', 'Cài Đặt Ứng Dụng PWA Trên iOS & Android', 'Không cần chờ xét duyệt App Store; cài đặt trong 10 giây với biểu tượng CEO 1983 độc bản');

    const pwaSteps = [
      { num: 'B1', title: 'Truy Cập Safari (iOS)', desc: 'Mở trình duyệt Safari trên iPhone, truy cập địa chỉ hệ thống app hiệp hội.' },
      { num: 'B2', title: 'Chọn Nút Chia Sẻ', desc: 'Nhấn vào biểu tượng Chia Sẻ (hình vuông có mũi tên hướng lên) ở thanh dưới cùng.' },
      { num: 'B3', title: 'Thêm Vào Màn Hình Chính', desc: 'Cuộn xuống và chọn mục "Thêm vào MH chính" (Add to Home Screen).' },
      { num: 'B4', title: 'Trải Nghiệm Toàn Màn Hình', desc: 'Biểu tượng CEO 1983 xuất hiện trên màn hình chính; mở mượt mà như app native.' }
    ];

    pwaSteps.forEach((ps, idx) => {
      const xPos = 0.8 + idx * 2.95;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 4.6,
        fill: { color: C.WHITE },
        line: { color: C.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos + 0.25, y: 2.4, w: 0.7, h: 0.7,
        fill: { color: C.NAVY_PRIMARY },
        roundRadio: 0.1
      });
      slide.addText(ps.num, {
        x: xPos + 0.25, y: 2.4, w: 0.7, h: 0.7,
        color: C.GOLD_ACCENT, bold: true, fontSize: 16, align: 'center', valign: 'middle', fontFace: 'Calibri'
      });
      slide.addText(ps.title, {
        x: xPos + 0.25, y: 3.3, w: 2.3, h: 0.6,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 13.5, fontFace: 'Calibri'
      });
      slide.addText(ps.desc, {
        x: xPos + 0.25, y: 4.0, w: 2.3, h: 2.3,
        color: C.TEXT_BODY, fontSize: 11.5, fontFace: 'Calibri'
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 9: Lợi Ích Của Hội Viên Khi Tham Gia Hệ Sinh Thái
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'GIÁ TRỊ THỰC TIỄN', 'Đặc Quyền Của Doanh Nhân Khi Sử Dụng Ứng Dụng', 'Gia tăng uy tín thương hiệu, mở rộng cơ hội thị trường và tiết kiệm chi phí vận hành');

    const benefits = [
      {
        title: 'Mở Rộng Mạng Lưới C-Level',
        items: [
          'Tiếp cận trực tiếp hơn 100+ Lãnh đạo doanh nghiệp sinh năm 1983 cùng thế hệ.',
          'Kết nối trên nền tảng tin cậy được bảo trợ bởi Hội Doanh Nhân Trẻ Hà Nội.',
          'Tham gia các buổi kết nối giao ban định kỳ và Gala doanh nhân cao cấp.'
        ]
      },
      {
        title: 'Thúc Đẩy Doanh Thu Thực',
        items: [
          'Quảng bá sản phẩm, năng lực sản xuất đến chuỗi cung ứng của toàn bộ CLB.',
          'Ưu tiên hợp tác, sử dụng dịch vụ chéo với mức chiết khấu nội bộ hấp dẫn.',
          'Ghi nhận doanh số minh bạch, nâng tầm thương hiệu cá nhân và pháp nhân.'
        ]
      },
      {
        title: 'Vận Hành Số Chuyên Nghiệp',
        items: [
          'Quản lý hội phí, đối soát sao kê VietQR tự động không cần thủ công.',
          'Tham dự sự kiện, hội thảo chuyên đề chỉ bằng một mã QR điểm danh.',
          'Cập nhật tin tức, nghị quyết hiệp hội và tài liệu đào tạo mọi lúc mọi nơi.'
        ]
      }
    ];

    benefits.forEach((b, idx) => {
      const xPos = 0.8 + idx * 4.0;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 3.7, h: 4.6,
        fill: { color: C.WHITE },
        line: { color: C.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 3.7, h: 0.1,
        fill: { color: idx === 1 ? C.GOLD_ACCENT : C.NAVY_PRIMARY }
      });
      slide.addText(b.title, {
        x: xPos + 0.3, y: 2.4, w: 3.1, h: 0.6,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 14, fontFace: 'Calibri'
      });
      b.items.forEach((it, iIdx) => {
        slide.addText(`✔  ${it}`, {
          x: xPos + 0.3, y: 3.1 + iIdx * 1.1, w: 3.1, h: 1.0,
          color: C.TEXT_BODY, fontSize: 11.5, fontFace: 'Calibri'
        });
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 10: Lời Kết & Tuyên Ngôn Hành Động (Closing Navy & Gold)
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    slide.background = { color: C.NAVY_DARK };

    slide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 1.2, w: 3.8, h: 0.4,
      fill: { color: C.GOLD_ACCENT },
      roundRadio: 0.1
    });
    slide.addText('HÀNH ĐỘNG HÔM NAY — VỮNG BƯỚC NGÀY MAI', {
      x: 0.8, y: 1.2, w: 3.8, h: 0.4,
      color: C.NAVY_DARK, bold: true, fontSize: 10.5, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });

    slide.addText('CLB DOANH NHÂN CEO 1983', {
      x: 0.8, y: 1.8, w: 11.73, h: 1.0,
      color: C.WHITE, bold: true, fontSize: 34, fontFace: 'Calibri'
    });

    slide.addText('"Kết Nối Bền — Phát Triển Vững"', {
      x: 0.8, y: 2.8, w: 11.73, h: 0.6,
      color: C.GOLD_ACCENT, bold: true, fontSize: 22, italic: true, fontFace: 'Calibri'
    });

    slide.addText('Chào đón các Doanh nhân Lãnh đạo sinh năm 1983 gia nhập mạng lưới số hóa độc bản, tiên phong kiến tạo giá trị bền vững cho cộng đồng doanh nghiệp Việt Nam.', {
      x: 0.8, y: 3.6, w: 10.5, h: 0.9,
      color: C.BORDER_SUBTLE, fontSize: 14, fontFace: 'Calibri'
    });

    // Contact Information
    const contacts = [
      { label: 'Cổng thông tin', val: 'https://ceo1983.com' },
      { label: 'Hệ thống Quản trị', val: 'Web CRM & App Mobile CEO 1983' },
      { label: 'Đơn vị bảo trợ', val: 'Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)' }
    ];

    contacts.forEach((c, idx) => {
      const xPos = 0.8 + idx * 4.0;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 5.0, w: 3.7, h: 1.5,
        fill: { color: C.NAVY_CARD },
        line: { color: C.NAVY_PRIMARY, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addText(c.label, {
        x: xPos + 0.3, y: 5.2, w: 3.1, h: 0.35,
        color: C.GOLD_ACCENT, bold: true, fontSize: 12, fontFace: 'Calibri'
      });
      slide.addText(c.val, {
        x: xPos + 0.3, y: 5.65, w: 3.1, h: 0.6,
        color: C.WHITE, fontSize: 11.5, fontFace: 'Calibri'
      });
    });
  }

  const outPath = path.join(OUT_DIR, 'SLIDE_THUYET_TRINH_APP_HIEP_HOI_CEO1983.pptx');
  await pres.writeFile({ fileName: outPath });
  console.log(`✓ Generated App PowerPoint: ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
}

// =============================================================================
// PRESENTATION 2: WEB CRM QUẢN TRỊ HIỆP HỘI
// =============================================================================
async function generateCrmSlideDeck() {
  console.log('Generating CRM PowerPoint Slides (Executive Light Palette)...');
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.author = 'Ban Quản Trị & Ban Thư Ký CLB Doanh Nhân CEO 1983';
  pres.title = 'Hệ Thống Web CRM Quản Trị Hiệp Hội CEO 1983 — Executive Command Center';

  // ---------------------------------------------------------------------------
  // SLIDE 1: Cover Slide
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    slide.background = { color: C.NAVY_DARK };

    slide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 0.8, w: 4.5, h: 0.42,
      fill: { color: C.GOLD_ACCENT },
      roundRadio: 0.1
    });
    slide.addText('HỆ THỐNG QUẢN TRỊ ĐIỀU HÀNH HIỆP HỘI', {
      x: 0.8, y: 0.8, w: 4.5, h: 0.42,
      color: C.NAVY_DARK, bold: true, fontSize: 11, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });

    slide.addText('WEB CRM QUẢN TRỊ CLB DOANH NHÂN CEO 1983', {
      x: 0.8, y: 1.55, w: 11.73, h: 1.2,
      color: C.WHITE, bold: true, fontSize: 32, fontFace: 'Calibri'
    });

    slide.addText('Executive Command Center · Quản trị dữ liệu 360° · Phiên bản v2.6.0 Pro', {
      x: 0.8, y: 2.85, w: 11.73, h: 0.5,
      color: C.GOLD_ACCENT, bold: true, fontSize: 18, italic: true, fontFace: 'Calibri'
    });

    slide.addText('Trung tâm điều hành số hóa toàn diện dành cho Ban Quản Trị & Ban Thư Ký: Quản lý hồ sơ hội viên, tổ chức sự kiện, sơ đồ chỗ ngồi, Live Voting, sàn B2B và đối soát hội phí VietQR.', {
      x: 0.8, y: 3.45, w: 10.5, h: 0.8,
      color: C.BORDER_SUBTLE, fontSize: 13.5, fontFace: 'Calibri'
    });

    const crmMetrics = [
      { num: '360°', label: 'Hồ Sơ Hội Viên', sub: 'Thẩm định & cấp thẻ số tự động' },
      { num: '100%', label: 'Điểm Danh Mã QR', sub: 'Tốc độ quét 1 giây, chống trùng' },
      { num: '04', label: 'Cấp Phân Quyền RBAC', sub: 'Super Admin, Thư ký, Sự kiện, Tài chính' }
    ];

    crmMetrics.forEach((m, idx) => {
      const xPos = 0.8 + idx * 4.0;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 4.8, w: 3.7, h: 1.8,
        fill: { color: C.NAVY_CARD },
        line: { color: C.NAVY_PRIMARY, width: 1.5 },
        roundRadio: 0.15
      });
      slide.addText(m.num, {
        x: xPos + 0.3, y: 5.0, w: 3.1, h: 0.7,
        color: C.GOLD_ACCENT, bold: true, fontSize: 32, fontFace: 'Calibri'
      });
      slide.addText(m.label, {
        x: xPos + 0.3, y: 5.75, w: 3.1, h: 0.4,
        color: C.WHITE, bold: true, fontSize: 13.5, fontFace: 'Calibri'
      });
      slide.addText(m.sub, {
        x: xPos + 0.3, y: 6.15, w: 3.1, h: 0.35,
        color: C.BORDER_SUBTLE, fontSize: 10.5, fontFace: 'Calibri'
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 2: Phân Quyền Vai Trò Vận Hành (RBAC)
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'AN TOÀN & BẢO MẬT', 'Phân Quyền Vai Trò Quản Trị (Role-Based Access Control)', 'Phân định quyền hạn minh bạch giữa Ban Điều Hành, Ban Thư Ký, Ban Sự Kiện và Ban Tài Chính');

    const roles = [
      {
        role: 'Super Admin',
        email: 'admin@connect.vn',
        scope: 'Toàn quyền kiểm soát hệ thống: Quản trị danh mục, phân quyền tài khoản, cấu hình bảo mật SSL, quản lý nhật ký kiểm toán (Audit Logs).'
      },
      {
        role: 'Tổng Thư Ký CLB',
        email: 'ceo.tongthuky@ceo1983.com',
        scope: 'Thẩm định hồ sơ hội viên mới, duyệt đơn đăng ký từ Landing Page, xuất bản tin tức, nghị quyết BCH và gửi thông báo khẩn toàn hiệp hội.'
      },
      {
        role: 'Trưởng Ban Sự Kiện',
        email: 'events@ceo1983.com',
        scope: 'Tạo mới sự kiện, cấu hình sơ đồ khán phòng (Cinema Seating), quét mã QR check-in cổng, điều hành phiên Live Voting và vòng quay Lucky Draw.'
      },
      {
        role: 'Trưởng Ban Tài Chính',
        email: 'finance@ceo1983.com',
        scope: 'Theo dõi bảng hội phí thường niên theo niên độ, đối soát sao kê ngân hàng VietQR, gạch nợ hội phí tự động và báo cáo thu chi hiệp hội.'
      }
    ];

    roles.forEach((r, idx) => {
      const xPos = 0.8 + idx * 2.95;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 4.6,
        fill: { color: C.WHITE },
        line: { color: C.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 0.1,
        fill: { color: idx === 0 ? C.NAVY_PRIMARY : (idx === 1 ? C.GOLD_ACCENT : (idx === 2 ? C.EMERALD : C.NAVY_HOVER)) }
      });
      slide.addText(r.role, {
        x: xPos + 0.25, y: 2.35, w: 2.3, h: 0.4,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 14, fontFace: 'Calibri'
      });
      slide.addText(r.email, {
        x: xPos + 0.25, y: 2.8, w: 2.3, h: 0.35,
        color: C.GOLD_DARK, bold: true, fontSize: 10.5, fontFace: 'Consolas'
      });
      slide.addText(r.scope, {
        x: xPos + 0.25, y: 3.3, w: 2.3, h: 3.1,
        color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri'
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 3: Bảng Điều Khiển Tổng Quan (Dashboard KPI)
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'BÁO CÁO ĐIỀU HÀNH', 'Bảng Điều Khiển Dashboard — Giám Sát Chỉ Số KPI Thời Gian Thực', 'Bức tranh toàn cảnh về quy mô hội viên, sức khỏe tài chính và lưu lượng giao thương B2B');

    const kpis = [
      { label: 'Tổng Số Hội Viên Chính Thức', val: '100+ Lãnh Đạo', desc: 'Chủ tịch HĐQT, Tổng Giám Đốc, CEO tuổi Quý Hợi 1983' },
      { label: 'Tỷ Lệ Hoàn Tất Hội Phí Niên Độ', val: '92.5% Đạt Chuẩn', desc: 'Gạch nợ đối soát sao kê tự động qua cổng VietQR' },
      { label: 'Sự Kiện & Gala Tổ Chức', val: '12 Sự Kiện/Năm', desc: 'Bao gồm Đại hội thường niên, Business Matching Day & Giải Golf' },
      { label: 'Giá Trị Giao Thương Kết Nối B2B', val: 'Hơn 50+ Tỷ Đồng', desc: 'Tổng giá trị hợp đồng được claim và ghi nhận thành công' }
    ];

    kpis.forEach((k, idx) => {
      const row = Math.floor(idx / 2);
      const col = idx % 2;
      const xPos = 0.8 + col * 6.0;
      const yPos = 2.1 + row * 2.35;

      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: yPos, w: 5.7, h: 2.15,
        fill: { color: C.WHITE },
        line: { color: C.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: yPos, w: 0.12, h: 2.15,
        fill: { color: col === 0 ? C.NAVY_PRIMARY : C.GOLD_ACCENT }
      });
      slide.addText(k.label, {
        x: xPos + 0.35, y: yPos + 0.25, w: 5.1, h: 0.35,
        color: C.TEXT_MUTED, fontSize: 11.5, bold: true, fontFace: 'Calibri'
      });
      slide.addText(k.val, {
        x: xPos + 0.35, y: yPos + 0.65, w: 5.1, h: 0.65,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 24, fontFace: 'Calibri'
      });
      slide.addText(k.desc, {
        x: xPos + 0.35, y: yPos + 1.35, w: 5.1, h: 0.6,
        color: C.TEXT_BODY, fontSize: 11.5, fontFace: 'Calibri'
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 4: Quy Trình Thẩm Định & Phê Duyệt Hồ Sơ Hội Viên 360°
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'QUẢN LÝ HỘI VIÊN 360°', 'Quy Trình Tiếp Nhận & Phê Duyệt Hồ Sơ Trực Tuyến', 'Khép kín từ form đăng ký Landing Page đến kích hoạt tài khoản di động trong 1 cú nhấp');

    const appFlow = [
      {
        step: 'BƯỚC 1',
        title: 'Tiếp Nhận Đơn Từ Landing Page',
        desc: 'Hồ sơ đăng ký mới từ form Landing Page (/landing/ceo1983) tự động đổ về CRM với trạng thái "Chờ xét duyệt" màu vàng.'
      },
      {
        step: 'BƯỚC 2',
        title: 'Thẩm Định Hồ Sơ Chi Tiết (Drawer 360°)',
        desc: 'Ban Thư ký mở Drawer kiểm tra MST, giấy phép ĐKKD, chức vụ C-Level, quy mô doanh thu và lĩnh vực kinh doanh.'
      },
      {
        step: 'BƯỚC 3',
        title: 'Thao Tác Phê Duyệt (Approve)',
        desc: 'Bấm nút Phê duyệt: Hệ thống tự động kích hoạt tài khoản hội viên, sinh mã định danh VIP (CEO-1983-xxx) và cấp quyền đăng nhập app.'
      },
      {
        step: 'BƯỚC 4',
        title: 'Cập Nhật Thời Gian Thực Về Landing',
        desc: 'Màn hình tra cứu trên Landing Page (auto-polling mỗi 4s) ngay lập tức hiển thị thông báo Chúc mừng và nút chuyển vào App.'
      }
    ];

    appFlow.forEach((af, idx) => {
      const xPos = 0.8 + idx * 2.95;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 4.6,
        fill: { color: C.WHITE },
        line: { color: C.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos + 0.25, y: 2.4, w: 1.2, h: 0.35,
        fill: { color: C.NAVY_PRIMARY },
        roundRadio: 0.06
      });
      slide.addText(af.step, {
        x: xPos + 0.25, y: 2.4, w: 1.2, h: 0.35,
        color: C.WHITE, bold: true, fontSize: 10, align: 'center', valign: 'middle', fontFace: 'Calibri'
      });
      slide.addText(af.title, {
        x: xPos + 0.25, y: 2.95, w: 2.3, h: 0.8,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 13.5, fontFace: 'Calibri'
      });
      slide.addText(af.desc, {
        x: xPos + 0.25, y: 3.85, w: 2.3, h: 2.5,
        color: C.TEXT_BODY, fontSize: 11.5, fontFace: 'Calibri'
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 5: Quản Trị Sự Kiện, Sơ Đồ Khán Phòng & Check-in QR
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'TỔ CHỨC ĐẠI HỘI', 'Quản Trị Sự Kiện, Sơ Đồ Khán Phòng & Check-in QR Siêu Tốc', 'Kiểm soát check-in hội trường 1 giây, định vị số ghế VIP và chống trùng lặp vé 100%');

    const evCols = [
      {
        title: 'Bố Cục Banner & Thiết Lập Sự Kiện',
        desc: 'Hệ thống tự động điều chỉnh tỷ lệ banner theo phân loại: Đại hội thường niên (16:9), Business Matching (21:9) hoặc Hội thảo C-Level (Cinema). Tích hợp cấu hình vé VIP 0đ và vé khách mời.'
      },
      {
        title: 'Sơ Đồ Khán Phòng (Cinema Seating Map)',
        desc: 'Thiết lập ma trận ghế ngồi trực quan gồm các khu vực: VIP Kim Cương (hàng đầu), Đoàn Chủ Tịch, Hội Viên Chính Thức và Khách Mời. Hội viên chọn chỗ chính xác theo thời gian thực.'
      },
      {
        title: 'Quét Mã QR Check-in Cổng Tốc Độ Cao',
        desc: 'Camera quét mã vé QR trên điện thoại trong 1 giây. Hệ thống xác nhận tên, số ghế, ảnh đại diện và bật âm thanh "Tít" thành công. Ngăn chặn triệt để hành vi quét vé 2 lần.'
      }
    ];

    evCols.forEach((ec, idx) => {
      const xPos = 0.8 + idx * 4.0;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 3.7, h: 4.6,
        fill: { color: C.WHITE },
        line: { color: C.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 3.7, h: 0.1,
        fill: { color: idx === 0 ? C.NAVY_PRIMARY : (idx === 1 ? C.GOLD_ACCENT : C.EMERALD) }
      });
      slide.addText(ec.title, {
        x: xPos + 0.3, y: 2.4, w: 3.1, h: 0.7,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 14, fontFace: 'Calibri'
      });
      slide.addText(ec.desc, {
        x: xPos + 0.3, y: 3.2, w: 3.1, h: 3.2,
        color: C.TEXT_BODY, fontSize: 12, fontFace: 'Calibri'
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 6: Điều Hành Live Voting & Vòng Quay Lucky Draw
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'TƯƠNG TÁC SÂN KHẤU', 'Điều Hành Biểu Quyết Trực Tiếp (Live Voting) & Bốc Thăm Gala', 'Tạo điểm nhấn công nghệ hoành tráng trong các sự kiện lớn của Hiệp hội CEO 1983');

    const stageMods = [
      {
        title: 'Bảng Điều Khiển Live Voting',
        items: [
          'Tạo câu hỏi biểu quyết kèm danh sách ứng viên Ban Chấp Hành.',
          'Bấm nút "Mở phiên bình chọn": Toàn bộ App hội viên tự động bật giao diện bầu cử.',
          'Theo dõi số lượng phiếu bầu tăng theo thời gian thực (Real-time Gauge).',
          'Khóa phiên và trình chiếu biểu đồ kết quả trực tiếp lên màn hình LED.'
        ]
      },
      {
        title: 'Vận Hành Vòng Quay Lucky Draw',
        items: [
          'Hệ thống tổng hợp toàn bộ Mã số May mắn (#XXXX) từ các vé đã check-in.',
          'Giao diện vòng quay số đồ họa 3D sang trọng kèm âm thanh sân khấu sống động.',
          'Bấm "Quay Số": Thuật toán chọn ngẫu nhiên minh bạch không thể can thiệp.',
          'Tự động gửi thông báo chúc mừng kèm ảnh giải thưởng về ứng dụng người trúng.'
        ]
      }
    ];

    stageMods.forEach((sm, idx) => {
      const xPos = 0.8 + idx * 6.0;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 5.7, h: 4.6,
        fill: { color: C.WHITE },
        line: { color: C.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 5.7, h: 0.5,
        fill: { color: idx === 0 ? C.BLUE_BG : C.GOLD_LIGHT },
        roundRadio: 0.08
      });
      slide.addText(sm.title, {
        x: xPos + 0.3, y: 2.1, w: 5.1, h: 0.5,
        color: idx === 0 ? C.NAVY_PRIMARY : C.GOLD_DARK, bold: true, fontSize: 13.5, valign: 'middle', fontFace: 'Calibri'
      });
      sm.items.forEach((it, iIdx) => {
        slide.addText(`★  ${it}`, {
          x: xPos + 0.3, y: 2.85 + iIdx * 0.9, w: 5.1, h: 0.75,
          color: C.TEXT_BODY, fontSize: 12, fontFace: 'Calibri'
        });
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 7: Quản Trị Tài Chính, Hội Phí & Cổng VietQR Tự Động
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'QUẢN TRỊ TÀI CHÍNH', 'Bảng Quản Lý Hội Phí Thường Niên & Đối Soát Sao Kê VietQR', 'Minh bạch hóa tài chính hiệp hội, giảm thiểu 95% sai sót kế toán đối soát thủ công');

    const finCards = [
      {
        title: 'Bảng Hội Phí Niên Độ',
        desc: 'Theo dõi tình trạng đóng phí thường niên của từng hội viên theo từng năm hoạt động. Hiển thị rõ số tiền, ngày gia hạn và trạng thái "Đã đóng" hoặc "Chưa đóng".'
      },
      {
        title: 'Cổng Thanh Toán VietQR Tự Động',
        desc: 'Khi hội viên bấm gia hạn trên App, mã VietQR động được tạo với đúng số tiền và cú pháp chuẩn. Kế toán đối soát sao kê ngân hàng và bật/tắt gạch nợ tức thì.'
      },
      {
        title: 'Nhắc Nhở Hội Phí Thông Minh',
        desc: 'Hệ thống tự động kích hoạt thông báo nhắc nhở hội phí trước 30 ngày và 7 ngày đến hạn. Cảnh báo hạn chế quyền lợi nếu hội phí quá hạn theo điều lệ CLB.'
      }
    ];

    finCards.forEach((fc, idx) => {
      const xPos = 0.8 + idx * 4.0;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 3.7, h: 4.6,
        fill: { color: C.WHITE },
        line: { color: C.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 3.7, h: 0.1,
        fill: { color: idx === 1 ? C.GOLD_ACCENT : C.NAVY_PRIMARY }
      });
      slide.addText(fc.title, {
        x: xPos + 0.3, y: 2.4, w: 3.1, h: 0.7,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 14, fontFace: 'Calibri'
      });
      slide.addText(fc.desc, {
        x: xPos + 0.3, y: 3.2, w: 3.1, h: 3.2,
        color: C.TEXT_BODY, fontSize: 12, fontFace: 'Calibri'
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 8: Kiểm Duyệt Sàn Giao Thương B2B & Quản Trị Pháp Nhân
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'KIỂM DUYỆT NỘI DUNG', 'Kiểm Duyệt Sàn B2B & Quản Trị Hồ Sơ Pháp Nhân Doanh Nghiệp', 'Bảo đảm 100% sản phẩm và cơ hội kinh doanh trong mạng lưới đạt chuẩn pháp lý');

    const auditSteps = [
      { num: '01', title: 'Tiếp Nhận Đăng Tải', desc: 'Hội viên đăng sản phẩm hoặc tin nhu cầu mua sắm từ App di động; nội dung vào hàng đợi kiểm duyệt.' },
      { num: '02', title: 'Thẩm Tra Pháp Lý', desc: 'Ban Thư ký kiểm tra chứng nhận xuất xứ, công bố chất lượng và giấy phép kinh doanh ngành nghề có điều kiện.' },
      { num: '03', title: 'Phê Duyệt / Khóa Bài', desc: 'Nhấn Duyệt để hiển thị công khai trên App; hoặc từ chối kèm phản hồi lý do chi tiết cho hội viên bổ sung.' },
      { num: '04', title: 'Gắn Nhãn Tiêu Biểu', desc: 'Gắn nhãn "Sản Phẩm Tiêu Biểu CEO 1983" đẩy lên vị trí Top Carousel tiếp cận tối đa mạng lưới.' }
    ];

    auditSteps.forEach((as, idx) => {
      const xPos = 0.8 + idx * 2.95;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 4.6,
        fill: { color: C.WHITE },
        line: { color: C.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos + 0.25, y: 2.4, w: 0.7, h: 0.7,
        fill: { color: C.NAVY_PRIMARY },
        roundRadio: 0.1
      });
      slide.addText(as.num, {
        x: xPos + 0.25, y: 2.4, w: 0.7, h: 0.7,
        color: C.GOLD_ACCENT, bold: true, fontSize: 16, align: 'center', valign: 'middle', fontFace: 'Calibri'
      });
      slide.addText(as.title, {
        x: xPos + 0.25, y: 3.3, w: 2.3, h: 0.6,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 13.5, fontFace: 'Calibri'
      });
      slide.addText(as.desc, {
        x: xPos + 0.25, y: 4.0, w: 2.3, h: 2.3,
        color: C.TEXT_BODY, fontSize: 11.5, fontFace: 'Calibri'
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 9: Hệ Thống Tin Tức, Nghị Quyết & Nhật Ký Kiểm Toán (Audit Log)
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'TRUYỀN THÔNG & BẢO MẬT', 'Xuất Bản Tin Tức, Nghị Quyết BCH & Nhật Ký Kiểm Toán', 'Kênh truyền thông chính thống của CLB và hệ thống giám sát an toàn dữ liệu 24/7');

    const commCards = [
      {
        title: 'Xuất Bản Nghị Quyết & Tin Tức Chính Thống',
        items: [
          'Biên tập văn bản nghị quyết, quyết định bổ nhiệm và thông cáo báo chí.',
          'Phân loại chuyên mục: Tin Hiệp Hội, Giao Thương B2B, Thể Thao & CSR.',
          'Đính kèm văn bản PDF có chữ ký và đóng dấu của Chủ tịch CLB.',
          'Đồng bộ hiển thị tức thì trên tab Bản tin và Thư viện tài liệu App.'
        ]
      },
      {
        title: 'Nhật Ký Kiểm Toán Hệ Thống (Audit Logs)',
        items: [
          'Ghi nhận 100% nhật ký thao tác của Quản trị viên: Thời gian, IP, hành động.',
          'Giám sát mọi thao tác phê duyệt hội viên, chỉnh sửa vai trò và gạch nợ hội phí.',
          'Bảo mật theo tiêu chuẩn GDPR và Luật An ninh mạng Việt Nam.',
          'Xuất dữ liệu báo cáo kiểm toán định kỳ phục vụ Ban Kiểm Tra CLB.'
        ]
      }
    ];

    commCards.forEach((cc, idx) => {
      const xPos = 0.8 + idx * 6.0;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 5.7, h: 4.6,
        fill: { color: C.WHITE },
        line: { color: C.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 5.7, h: 0.5,
        fill: { color: C.BLUE_BG },
        roundRadio: 0.08
      });
      slide.addText(cc.title, {
        x: xPos + 0.3, y: 2.1, w: 5.1, h: 0.5,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 13, valign: 'middle', fontFace: 'Calibri'
      });
      cc.items.forEach((it, iIdx) => {
        slide.addText(`✔  ${it}`, {
          x: xPos + 0.3, y: 2.85 + iIdx * 0.9, w: 5.1, h: 0.75,
          color: C.TEXT_BODY, fontSize: 12, fontFace: 'Calibri'
        });
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 10: Tầm Nhìn Số Hóa & Lời Kết
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    slide.background = { color: C.NAVY_DARK };

    slide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 1.2, w: 4.2, h: 0.4,
      fill: { color: C.GOLD_ACCENT },
      roundRadio: 0.1
    });
    slide.addText('CHUYỂN ĐỔI SỐ TOÀN DIỆN HIỆP HỘI', {
      x: 0.8, y: 1.2, w: 4.2, h: 0.4,
      color: C.NAVY_DARK, bold: true, fontSize: 10.5, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });

    slide.addText('HỆ THỐNG QUẢN TRỊ CEO 1983', {
      x: 0.8, y: 1.8, w: 11.73, h: 1.0,
      color: C.WHITE, bold: true, fontSize: 34, fontFace: 'Calibri'
    });

    slide.addText('"Nền Tảng Vững Chắc — Kiến Tạo Tương Lai"', {
      x: 0.8, y: 2.8, w: 11.73, h: 0.6,
      color: C.GOLD_ACCENT, bold: true, fontSize: 22, italic: true, fontFace: 'Calibri'
    });

    slide.addText('Hệ thống Web CRM và App Mobile CEO 1983 sẵn sàng bàn giao, đưa vào vận hành thực tế phục vụ Ban Chấp Hành, Ban Thư Ký và toàn thể Hội viên CLB Doanh Nhân CEO 1983.', {
      x: 0.8, y: 3.6, w: 10.5, h: 0.9,
      color: C.BORDER_SUBTLE, fontSize: 14, fontFace: 'Calibri'
    });

    const crmContacts = [
      { label: 'Cổng Web CRM', val: 'http://14.225.217.232:5000/auth' },
      { label: 'Cổng App Mobile', val: 'http://14.225.217.232:5002/association' },
      { label: 'Tài liệu hướng dẫn', val: 'Đầy đủ định dạng Word, PDF, Excel & Slide' }
    ];

    crmContacts.forEach((c, idx) => {
      const xPos = 0.8 + idx * 4.0;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 5.0, w: 3.7, h: 1.5,
        fill: { color: C.NAVY_CARD },
        line: { color: C.NAVY_PRIMARY, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addText(c.label, {
        x: xPos + 0.3, y: 5.2, w: 3.1, h: 0.35,
        color: C.GOLD_ACCENT, bold: true, fontSize: 12, fontFace: 'Calibri'
      });
      slide.addText(c.val, {
        x: xPos + 0.3, y: 5.65, w: 3.1, h: 0.6,
        color: C.WHITE, fontSize: 11.5, fontFace: 'Calibri'
      });
    });
  }

  const outPath = path.join(OUT_DIR, 'SLIDE_THUYET_TRINH_CRM_QUAN_TRI_CEO1983.pptx');
  await pres.writeFile({ fileName: outPath });
  console.log(`✓ Generated CRM PowerPoint: ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================
async function main() {
  console.log('=== STARTING POWERPOINT GENERATION (CEO 1983 EXECUTIVE THEME) ===');
  await generateAppSlideDeck();
  await generateCrmSlideDeck();
  console.log('=== ALL POWERPOINT SLIDES GENERATED SUCCESSFULLY ===');
}

main().catch(err => {
  console.error('Fatal error during PowerPoint generation:', err);
  process.exit(1);
});
