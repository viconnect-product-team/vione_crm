const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'document');
const EVIDENCE_DIR = path.join(OUT_DIR, 'images', 'evidence');
const FE_DOCS_DIR = path.join(__dirname, '..', 'apps', 'vione_app_fe', 'public', 'docs');

for (const d of [OUT_DIR, FE_DOCS_DIR]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

// =============================================================================
// BẢNG MÀU QUY CHUẨN ĐÚNG THEO YÊU CẦU:
// 1. SLIDE CRM: CHỈ CÓ TRẮNG - XANH (White & Blue Only - Zero Gold/Amber/Dark)
// 2. SLIDE APP: TRẮNG NHIỀU (70%), XANH (25%), CHÚT VÀNG (5% cho VIP/Crown/Badge)
// =============================================================================
const CRM_THEME = {
  BG_WHITE: 'FFFFFF',
  BG_LIGHT: 'F0F7FF',       // Xanh dương cực nhạt, sạch sẽ
  NAVY_PRIMARY: '003B95',   // Xanh Navy thương hiệu chuẩn
  BLUE_ACCENT: '0284C7',    // Xanh Cyan / Sky Blue hiện đại
  BLUE_LIGHT: 'EFF6FF',     // Nền badge xanh nhẹ
  BLUE_BORDER: 'BAE6FD',    // Viền xanh thanh nhã
  BORDER_SUBTLE: 'E2E8F0',  // Viền xám mờ nhẹ
  TEXT_DARK: '0F172A',      // Chữ đen xanh đậm
  TEXT_BODY: '334155',      // Chữ thân xám đậm
  TEXT_MUTED: '64748B',     // Chữ chú thích
  STRIP: '003B95',          // Dải nhấn trên cùng slide
};

const APP_THEME = {
  BG_WHITE: 'FFFFFF',       // Trắng chủ đạo ~70%
  BG_LIGHT: 'F8FAFC',       // Nền phụ trắng sáng
  NAVY_PRIMARY: '003B95',   // Xanh thương hiệu ~25%
  NAVY_HOVER: '002B70',
  BLUE_LIGHT: 'EFF6FF',
  BORDER_SUBTLE: 'E2E8F0',
  GOLD_ACCENT: 'F59E0B',    // Vàng kim hoàng gia ~5% điểm xuyết
  GOLD_LIGHT: 'FEF3C7',
  GOLD_BORDER: 'FDE68A',
  TEXT_DARK: '0F172A',
  TEXT_BODY: '334155',
  TEXT_MUTED: '64748B',
  STRIP_BLUE: '003B95',
  STRIP_GOLD: 'F59E0B',
};

function getImgBase64(filename) {
  const p = path.join(EVIDENCE_DIR, filename);
  if (fs.existsSync(p)) {
    const data = fs.readFileSync(p);
    return `image/png;base64,${data.toString('base64')}`;
  }
  console.warn(`[WARN] Image not found: ${filename}`);
  return null;
}

function getRawBase64(filename) {
  const p = path.join(EVIDENCE_DIR, filename);
  if (fs.existsSync(p)) {
    const data = fs.readFileSync(p);
    return `data:image/png;base64,${data.toString('base64')}`;
  }
  return '';
}

// -----------------------------------------------------------------------------
// HELPERS CHO SLIDE CRM (CHUẨN TRẮNG - XANH)
// -----------------------------------------------------------------------------
function addCrmSlideHeader(slide, pres, eyebrow, title, subtitle) {
  slide.background = { color: CRM_THEME.BG_WHITE };

  // Dải nhấn trên cùng: Xanh Navy thuần khiết
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 0.08,
    fill: { color: CRM_THEME.NAVY_PRIMARY }
  });

  // Eyebrow badge: Nền xanh nhạt, chữ xanh Navy
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 0.45, w: 3.5, h: 0.32,
    fill: { color: CRM_THEME.BLUE_LIGHT },
    line: { color: CRM_THEME.BLUE_BORDER, width: 1 },
    roundRadio: 0.06
  });
  slide.addText(eyebrow, {
    x: 0.8, y: 0.45, w: 3.5, h: 0.32,
    color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 10, align: 'center', valign: 'middle', fontFace: 'Calibri'
  });

  // Title: Xanh Navy đậm
  slide.addText(title, {
    x: 0.8, y: 0.85, w: 11.73, h: 0.55,
    color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 21, fontFace: 'Calibri'
  });

  // Subtitle: Xám xanh
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.8, y: 1.45, w: 11.73, h: 0.38,
      color: CRM_THEME.TEXT_MUTED, fontSize: 12, italic: true, fontFace: 'Calibri'
    });
  }
}

function addCrmSlideFooter(slide, pres, systemLabel) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 7.0, w: 11.73, h: 0.02,
    fill: { color: CRM_THEME.BLUE_BORDER }
  });
  slide.addText(`${systemLabel} · CLB Doanh Nhân CEO 1983 · HanoiBA`, {
    x: 0.8, y: 7.05, w: 7.5, h: 0.3,
    color: CRM_THEME.TEXT_MUTED, fontSize: 9.5, fontFace: 'Calibri'
  });
  slide.addText('Bản Quyền © 2026 CLB Doanh Nhân CEO 1983 · Hệ Thống Quản Trị Trắng Xanh Chuẩn Mực', {
    x: 8.5, y: 7.05, w: 4.03, h: 0.3,
    color: CRM_THEME.TEXT_MUTED, fontSize: 9.5, align: 'right', fontFace: 'Calibri'
  });
}

function addCrmFeatureSlide(pres, header, imgFilename, badgeText, features, sysLabel) {
  const slide = pres.addSlide();
  addCrmSlideHeader(slide, pres, header.eyebrow, header.title, header.subtitle);

  // Khung chứa ảnh Desktop CRM (Chữ nhật sắc nét viền xanh nhạt)
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 2.05, w: 5.8, h: 4.75,
    fill: { color: CRM_THEME.BG_WHITE },
    line: { color: CRM_THEME.BLUE_BORDER, width: 1.2 },
    roundRadio: 0.08
  });

  const imgData = getImgBase64(imgFilename);
  if (imgData) {
    slide.addImage({
      data: imgData,
      x: 0.95,
      y: 2.25,
      w: 5.5,
      h: 3.44
    });
  }

  // Nhãn chú thích dưới ảnh (Nền xanh nhạt, chữ xanh Navy)
  slide.addShape(pres.ShapeType.rect, {
    x: 0.95, y: 5.9, w: 5.5, h: 0.65,
    fill: { color: CRM_THEME.BLUE_LIGHT },
    line: { color: CRM_THEME.BLUE_BORDER, width: 1 },
    roundRadio: 0.06
  });
  slide.addText(badgeText || '⚡ Dữ Liệu Thời Gian Thực từ CSDL PostgreSQL Bảo Mật', {
    x: 1.05, y: 5.9, w: 5.3, h: 0.65,
    color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 10.5, align: 'center', valign: 'middle', fontFace: 'Calibri'
  });

  // Cột phải: 4 Thẻ chức năng (Viền xanh navy và xanh cyan xen kẽ)
  features.forEach((feat, idx) => {
    const yPos = 2.05 + idx * 1.2;
    slide.addShape(pres.ShapeType.rect, {
      x: 6.85, y: yPos, w: 5.68, h: 1.08,
      fill: { color: CRM_THEME.BG_WHITE },
      line: { color: CRM_THEME.BORDER_SUBTLE, width: 1 },
      roundRadio: 0.08
    });
    // Dải viền nhấn bên trái: Xanh Navy / Xanh Cyan
    slide.addShape(pres.ShapeType.rect, {
      x: 6.85, y: yPos, w: 0.1, h: 1.08,
      fill: { color: idx % 2 === 0 ? CRM_THEME.NAVY_PRIMARY : CRM_THEME.BLUE_ACCENT }
    });
    slide.addText(feat.title, {
      x: 7.1, y: yPos + 0.1, w: 5.25, h: 0.32,
      color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 12.5, fontFace: 'Calibri'
    });
    slide.addText(feat.desc, {
      x: 7.1, y: yPos + 0.44, w: 5.25, h: 0.56,
      color: CRM_THEME.TEXT_BODY, fontSize: 10.5, fontFace: 'Calibri'
    });
  });

  addCrmSlideFooter(slide, pres, sysLabel);
}

// -----------------------------------------------------------------------------
// HELPERS CHO SLIDE APP (TRẮNG NHIỀU ~70%, XANH ~25%, CHÚT VÀNG ~5%)
// -----------------------------------------------------------------------------
function addAppSlideHeader(slide, pres, eyebrow, title, subtitle) {
  slide.background = { color: APP_THEME.BG_WHITE };

  // Dải nhấn trên cùng: Xanh Navy chủ đạo + dải vàng kim rất mỏng điểm xuyết 5%
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 0.06,
    fill: { color: APP_THEME.STRIP_BLUE }
  });
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0.06, w: 13.33, h: 0.02,
    fill: { color: APP_THEME.STRIP_GOLD }
  });

  // Eyebrow badge: Xanh Navy, chữ trắng
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 0.45, w: 3.5, h: 0.32,
    fill: { color: APP_THEME.NAVY_PRIMARY },
    line: { color: APP_THEME.GOLD_ACCENT, width: 1 },
    roundRadio: 0.06
  });
  slide.addText(eyebrow, {
    x: 0.8, y: 0.45, w: 3.5, h: 0.32,
    color: APP_THEME.BG_WHITE, bold: true, fontSize: 10, align: 'center', valign: 'middle', fontFace: 'Calibri'
  });

  // Title: Xanh Navy
  slide.addText(title, {
    x: 0.8, y: 0.85, w: 11.73, h: 0.55,
    color: APP_THEME.NAVY_PRIMARY, bold: true, fontSize: 21, fontFace: 'Calibri'
  });

  // Subtitle
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.8, y: 1.45, w: 11.73, h: 0.38,
      color: APP_THEME.TEXT_MUTED, fontSize: 12, italic: true, fontFace: 'Calibri'
    });
  }
}

function addAppSlideFooter(slide, pres, systemLabel) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 7.0, w: 11.73, h: 0.02,
    fill: { color: APP_THEME.BORDER_SUBTLE }
  });
  slide.addText(`${systemLabel} · CLB Doanh Nhân CEO 1983 · HanoiBA`, {
    x: 0.8, y: 7.05, w: 7.5, h: 0.3,
    color: APP_THEME.TEXT_MUTED, fontSize: 9.5, fontFace: 'Calibri'
  });
  slide.addText('Bản Quyền © 2026 CLB Doanh Nhân CEO 1983 · Hệ Thống Số Hóa Toàn Diện', {
    x: 8.5, y: 7.05, w: 4.03, h: 0.3,
    color: APP_THEME.TEXT_MUTED, fontSize: 9.5, align: 'right', fontFace: 'Calibri'
  });
}

function addAppMobileFeatureSlide(pres, header, imgFilename, badgeText, features, sysLabel) {
  const slide = pres.addSlide();
  addAppSlideHeader(slide, pres, header.eyebrow, header.title, header.subtitle);

  // Khung điện thoại Mobile (Nền Trắng, viền thanh nhã)
  slide.addShape(pres.ShapeType.rect, {
    x: 1.2, y: 2.05, w: 4.8, h: 4.75,
    fill: { color: APP_THEME.BG_WHITE },
    line: { color: APP_THEME.BORDER_SUBTLE, width: 1.2 },
    roundRadio: 0.12
  });

  const imgData = getImgBase64(imgFilename);
  if (imgData) {
    slide.addImage({
      data: imgData,
      x: 2.35,
      y: 2.15,
      w: 2.1,
      h: 4.54
    });
  }

  // Cột phải: 4 Thẻ chức năng (Viền nhấn Xanh Navy & một chút Vàng kim nhẹ 5%)
  features.forEach((feat, idx) => {
    const yPos = 2.05 + idx * 1.2;
    slide.addShape(pres.ShapeType.rect, {
      x: 6.4, y: yPos, w: 6.13, h: 1.08,
      fill: { color: APP_THEME.BG_WHITE },
      line: { color: APP_THEME.BORDER_SUBTLE, width: 1 },
      roundRadio: 0.08
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 6.4, y: yPos, w: 0.08, h: 1.08,
      fill: { color: idx % 2 === 0 ? APP_THEME.NAVY_PRIMARY : APP_THEME.GOLD_ACCENT }
    });
    slide.addText(feat.title, {
      x: 6.65, y: yPos + 0.1, w: 5.7, h: 0.32,
      color: APP_THEME.NAVY_PRIMARY, bold: true, fontSize: 12.5, fontFace: 'Calibri'
    });
    slide.addText(feat.desc, {
      x: 6.65, y: yPos + 0.44, w: 5.7, h: 0.56,
      color: APP_THEME.TEXT_BODY, fontSize: 10.5, fontFace: 'Calibri'
    });
  });

  addAppSlideFooter(slide, pres, sysLabel);
}

// =============================================================================
// 1. DECK CRM QUẢN TRỊ (21 SLIDES HOÀN HẢO - 100% TRẮNG XANH - ZERO GOLD/DARK)
// =============================================================================
async function generateCrmPptx() {
  console.log('>>> Khởi tạo Slide Thuyết Trình Web CRM (SLIDE_THUYET_TRINH_CRM_QUAN_TRI_CEO1983.pptx) - Chuẩn Trắng Xanh...');
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = 'Thuyết Trình Hệ Thống CRM Quản Trị CLB Doanh Nhân CEO 1983';
  pres.author = 'Ban Quản Trị & Ban Thư Ký CLB Doanh Nhân CEO 1983';
  pres.company = 'CLB Doanh Nhân CEO 1983 · HanoiBA';

  const SYS = 'Hệ Thống Web CRM Quản Trị';

  // SLIDE 1: TRANG TIÊU ĐỀ CHÍNH THỨC (DEDICATED COVER / TITLE SLIDE)
  {
    const slide = pres.addSlide();
    slide.background = { color: CRM_THEME.BG_WHITE };
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.15, fill: { color: CRM_THEME.NAVY_PRIMARY } });

    // Huy hiệu tổ chức trên cùng
    slide.addShape(pres.ShapeType.rect, {
      x: 2.0, y: 1.0, w: 9.33, h: 0.48,
      fill: { color: CRM_THEME.BLUE_LIGHT }, line: { color: CRM_THEME.BLUE_BORDER, width: 1.5 }, roundRadio: 0.1
    });
    slide.addText('HỘI DOANH NHÂN TRẺ HÀ NỘI (HANOIBA) · CLB DOANH NHÂN CEO 1983', {
      x: 2.0, y: 1.0, w: 9.33, h: 0.48,
      color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 13, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });

    // Đại tựa đề (Grand Title)
    slide.addText('HỆ THỐNG WEB CRM QUẢN TRỊ & ĐIỀU HÀNH SỐ HÓA', {
      x: 1.0, y: 1.85, w: 11.33, h: 1.1,
      color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 34, align: 'center', fontFace: 'Calibri'
    });

    // Đường gạch chỉ phân cách thanh lịch
    slide.addShape(pres.ShapeType.rect, {
      x: 5.4, y: 3.1, w: 2.53, h: 0.05,
      fill: { color: CRM_THEME.BLUE_ACCENT }
    });

    // Phụ đề (Subtitle)
    slide.addText('BÁO CÁO TOÀN DIỆN GIẢI PHÁP CHUYỂN ĐỔI SỐ HIỆP HỘI CLB DOANH NHÂN CEO 1983', {
      x: 1.0, y: 3.3, w: 11.33, h: 0.5,
      color: CRM_THEME.BLUE_ACCENT, bold: true, fontSize: 15, align: 'center', fontFace: 'Calibri'
    });
    slide.addText('Trung Tâm Chỉ Huy: Hồ Sơ Hội Viên 360° · Tài Chính Đối Soát VietQR · Sơ Đồ Khán Phòng Sự Kiện · Biểu Quyết Live & Lucky Draw', {
      x: 1.0, y: 3.85, w: 11.33, h: 0.45,
      color: CRM_THEME.TEXT_MUTED, fontSize: 12.5, italic: true, align: 'center', fontFace: 'Calibri'
    });

    // Khối thẻ metadata thông tin báo cáo trang trọng
    slide.addShape(pres.ShapeType.rect, {
      x: 2.2, y: 4.65, w: 8.93, h: 1.8,
      fill: { color: CRM_THEME.BG_WHITE }, line: { color: CRM_THEME.BLUE_BORDER, width: 1.5 }, roundRadio: 0.12
    });

    slide.addText([
      { text: 'Đơn Vị Chủ Quản: ', options: { bold: true, color: CRM_THEME.NAVY_PRIMARY, fontSize: 12 } },
      { text: 'Ban Quản Trị & Ban Thư Ký CLB Doanh Nhân CEO 1983 (Trực thuộc HanoiBA)\n', options: { color: CRM_THEME.TEXT_BODY, fontSize: 12 } },
      { text: 'Chuyên Viên Báo Cáo: ', options: { bold: true, color: CRM_THEME.NAVY_PRIMARY, fontSize: 12 } },
      { text: 'Phạm Văn Vũ  |  ', options: { color: CRM_THEME.TEXT_BODY, fontSize: 12 } },
      { text: 'Phiên Bản: ', options: { bold: true, color: CRM_THEME.NAVY_PRIMARY, fontSize: 12 } },
      { text: 'Hệ Thống CRM 2.0 (Official Release)\n', options: { color: CRM_THEME.TEXT_BODY, fontSize: 12 } },
      { text: 'Thời Gian Báo Cáo: ', options: { bold: true, color: CRM_THEME.NAVY_PRIMARY, fontSize: 12 } },
      { text: 'Tháng 09/2026  ·  Hà Nội, Việt Nam', options: { color: CRM_THEME.TEXT_MUTED, fontSize: 12 } }
    ], {
      x: 2.5, y: 4.8, w: 8.33, h: 1.5, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });

    slide.addText('Bản Quyền © 2026 CLB Doanh Nhân CEO 1983 · Hệ Thống Quản Trị Trắng Xanh Chuẩn Mực', {
      x: 1.0, y: 6.85, w: 11.33, h: 0.35, color: CRM_THEME.TEXT_MUTED, fontSize: 10, align: 'center', fontFace: 'Calibri'
    });
  }

  // SLIDE 2: Tổng Quan 4 Trụ Cột Điều Hành & Quản Trị Số Hóa
  {
    const slide = pres.addSlide();
    slide.background = { color: CRM_THEME.BG_WHITE };
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.12, fill: { color: CRM_THEME.NAVY_PRIMARY } });

    slide.addShape(pres.ShapeType.rect, {
      x: 1.0, y: 1.0, w: 6.0, h: 0.4,
      fill: { color: CRM_THEME.BLUE_LIGHT }, line: { color: CRM_THEME.BLUE_BORDER, width: 1.5 }, roundRadio: 0.08
    });
    slide.addText('TRUNG TÂM ĐIỀU HÀNH & QUẢN TRỊ SỐ HÓA HIỆP HỘI', {
      x: 1.0, y: 1.0, w: 6.0, h: 0.4,
      color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 11, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });

    slide.addText('TỔNG QUAN HỆ THỐNG: 4 TRỤ CỘT ĐIỀU HÀNH SỐ HÓA', {
      x: 1.0, y: 1.6, w: 11.33, h: 0.9,
      color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 30, fontFace: 'Calibri'
    });
    slide.addText('Kiểm Soát Toàn Diện: Hồ Sơ Hội Viên · Quỹ Hội VietQR · Bầu Cử & Lucky Draw · Sàn B2B', {
      x: 1.0, y: 2.55, w: 11.33, h: 0.5,
      color: CRM_THEME.BLUE_ACCENT, fontSize: 15, bold: true, fontFace: 'Calibri'
    });

    const pillars = [
      { num: '01', title: 'Quản Trị Hội Viên 360°', desc: 'Thẩm định hồ sơ trực tuyến, phân bổ ban bệ và tự động cấp thông tin tài khoản qua email tức thì.' },
      { num: '02', title: 'Tài Chính & Đối Soát VietQR', desc: 'Theo dõi niên liễm, gạch nợ hội phí tự động qua mã VietQR và minh bạch thu chi ngân quỹ.' },
      { num: '03', title: 'Sự Kiện, Bầu Cử & Lucky Draw', desc: 'Khởi tạo vé đa tầng, sắp đặt sơ đồ khán phòng VIP, bỏ phiếu đại hội và quay số VinFast VF3.' },
      { num: '04', title: 'Đồng Bộ Hai Chiều Realtime', desc: 'Tách biệt chuyên sâu cho Ban Quản Trị nhưng liên kết 100% dữ liệu xuống Mobile App của hội viên.' },
    ];
    pillars.forEach((p, idx) => {
      const x = 1.0 + idx * 2.9;
      slide.addShape(pres.ShapeType.rect, {
        x, y: 3.5, w: 2.7, h: 2.7, fill: { color: CRM_THEME.BG_WHITE }, line: { color: CRM_THEME.BLUE_BORDER, width: 1.5 }, roundRadio: 0.12
      });
      slide.addText(p.num, { x: x + 0.2, y: 3.7, w: 0.8, h: 0.4, color: CRM_THEME.BLUE_ACCENT, bold: true, fontSize: 24, fontFace: 'Calibri' });
      slide.addText(p.title, { x: x + 0.2, y: 4.2, w: 2.3, h: 0.5, color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(p.desc, { x: x + 0.2, y: 4.8, w: 2.3, h: 1.2, color: CRM_THEME.TEXT_BODY, fontSize: 10.5, fontFace: 'Calibri' });
    });

    slide.addText('Bản Quyền © 2026 CLB Doanh Nhân CEO 1983 · Trực thuộc Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)', {
      x: 1.0, y: 6.75, w: 11.33, h: 0.35, color: CRM_THEME.TEXT_MUTED, fontSize: 10.5, italic: true, fontFace: 'Calibri'
    });
  }

  // SLIDE 2: Bài Toán & Thực Trạng Quản Trị (Pain Points)
  {
    const slide = pres.addSlide();
    addCrmSlideHeader(slide, pres, 'BÀI TOÁN & THỰC TRẠNG', 'Thách Thức Trong Công Tác Vận Hành Hiệp Hội Truyền Thống', 'Những rào cản lớn khiến hiệp hội tiêu tốn nguồn lực và giảm hiệu quả kết nối hội viên');

    const pains = [
      {
        icon: '📑',
        title: 'Hồ Sơ Rời Rạc & Thất Thoát Dữ Liệu',
        desc: 'Thông tin hội viên lưu trữ thủ công trên các file Excel, Zalo cá nhân. Khi thay đổi thư ký hoặc bàn giao nhiệm kỳ, dữ liệu dễ bị phân tán, thất lạc hoặc sai lệch.'
      },
      {
        icon: '⏳',
        title: 'Đối Soát Hội Phí Thủ Công Tốn Kém',
        desc: 'Ban Tài chính phải kiểm tra từng giao dịch sao kê ngân hàng, nhắn tin nhắc nợ từng người và gạch nợ thủ công, mất hàng chục giờ làm việc mỗi kỳ niên liễm.'
      },
      {
        icon: '🚪',
        title: 'Check-in Sự Kiện Ùn Tắc & Dễ Trùng Lặp',
        desc: 'Tại các sự kiện lớn như Đại hội, Caravan, Gala Dinner, khâu soát vé giấy thủ công gây ùn tắc tại cửa ra vào, không kiểm soát được vé giả hoặc dùng chung vé.'
      },
      {
        icon: '📉',
        title: 'Giao Thương Nội Khối Thiếu Đo Lường',
        desc: 'Nhu cầu mua bán, hợp tác của các doanh nghiệp thành viên chia sẻ tự phát trong các nhóm chat, không có cơ chế thẩm định xuất xứ và không đo lường được quy mô giá trị Deals.'
      }
    ];

    pains.forEach((p, idx) => {
      const xPos = 0.8 + idx * 2.95;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 4.6,
        fill: { color: CRM_THEME.BG_WHITE },
        line: { color: CRM_THEME.BLUE_BORDER, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 0.1,
        fill: { color: CRM_THEME.NAVY_PRIMARY }
      });
      slide.addText(p.icon, { x: xPos + 0.25, y: 2.35, w: 2.3, h: 0.5, fontSize: 24, fontFace: 'Calibri' });
      slide.addText(p.title, { x: xPos + 0.25, y: 2.9, w: 2.3, h: 0.7, color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(p.desc, { x: xPos + 0.25, y: 3.7, w: 2.3, h: 2.8, color: CRM_THEME.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addCrmSlideFooter(slide, pres, SYS);
  }

  // SLIDE 3: Giới Thiệu Hiệp Hội (Introduction - Trắng Xanh)
  {
    const slide = pres.addSlide();
    addCrmSlideHeader(slide, pres, 'GIỚI THIỆU HIỆP HỘI', 'Câu Lạc Bộ Doanh Nhân CEO 1983 - Hội Doanh Nhân Trẻ Hà Nội', 'Mạng lưới tinh hoa quy tụ các nhà sáng lập và lãnh đạo doanh nghiệp sinh năm Quý Hợi 1983');

    const intros = [
      {
        badge: 'TÔN CHỈ HOẠT ĐỘNG',
        title: 'Đoàn Kết - Bản Lĩnh - Tiên Phong',
        desc: 'Xây dựng cộng đồng doanh nhân đồng niên vững mạnh, sẻ chia kinh nghiệm quản trị, tương trợ nguồn lực và cùng nhau kiến tạo các giá trị kinh tế bền vững cho xã hội.'
      },
      {
        badge: 'QUY MÔ CỘNG ĐỒNG',
        title: '100+ Lãnh Đạo C-Level Đa Ngành',
        desc: 'Quy tụ hơn 100 Chủ tịch, Tổng Giám Đốc hoạt động trong các lĩnh vực trọng điểm: Xây dựng, Cơ khí sản xuất, Công nghệ thông tin, F&B, Logistics, Y tế và Tài chính.'
      },
      {
        badge: 'TỔ CHỨC CHẶT CHẼ',
        title: '5 Ban Chuyên Môn Trực Thuộc',
        desc: 'Hệ thống điều hành gồm: Ban Chủ Tịch, Ban Thư Ký, Ban Xúc Tiến Thương Mại, Ban Sự Kiện & Truyền Thông, Ban Tài Chính & Kiểm Soát hoạt động bài bản và chuyên nghiệp.'
      },
      {
        badge: 'TẦM NHÌN SỐ HÓA',
        title: 'Hiệp Hội Số Tiên Phong Toàn Quốc',
        desc: 'Mục tiêu trở thành hình mẫu chuẩn mực về ứng dụng công nghệ trong quản trị và vận hành hiệp hội doanh nghiệp, chuyển giao tài sản số trọn vẹn qua các nhiệm kỳ.'
      }
    ];

    intros.forEach((item, idx) => {
      const xPos = 0.8 + idx * 2.95;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 4.6,
        fill: { color: CRM_THEME.BG_WHITE },
        line: { color: CRM_THEME.BLUE_BORDER, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 0.1,
        fill: { color: CRM_THEME.NAVY_PRIMARY }
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos + 0.25, y: 2.35, w: 2.3, h: 0.3,
        fill: { color: CRM_THEME.BLUE_LIGHT }, roundRadio: 0.06
      });
      slide.addText(item.badge, {
        x: xPos + 0.25, y: 2.35, w: 2.3, h: 0.3,
        color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 9.5, align: 'center', valign: 'middle', fontFace: 'Calibri'
      });
      slide.addText(item.title, { x: xPos + 0.25, y: 2.8, w: 2.3, h: 0.65, color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(item.desc, { x: xPos + 0.25, y: 3.6, w: 2.3, h: 2.9, color: CRM_THEME.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addCrmSlideFooter(slide, pres, SYS);
  }

  // SLIDE 4: Mục Đích & Giải Pháp Tổng Thể (Purpose & Solution)
  {
    const slide = pres.addSlide();
    addCrmSlideHeader(slide, pres, 'MỤC ĐÍCH & GIẢI PHÁP', 'Kiến Trúc Nền Tảng Kép (Dual-Platform) Cho Hiệp Hội Số', 'Tách biệt chuyên sâu giao diện người dùng nhưng chia sẻ chung cơ sở dữ liệu thời gian thực');

    const solutions = [
      {
        num: '01',
        title: 'Mục Đích Phát Triển',
        desc: 'Số hóa 100% quy trình điều hành của Ban Lãnh Đạo, tự động hóa đối soát tài chính, kiểm soát cổng sự kiện trong 1 giây và cung cấp không gian giao thương tin cậy cho hội viên.'
      },
      {
        num: '02',
        title: 'Web CRM Quản Trị Tập Trung',
        desc: 'Trung tâm điều hành dành riêng cho Ban Chủ Tịch và Ban Thư Ký trên máy tính văn phòng: Thẩm định hồ sơ, quản trị vé đại biểu, sơ đồ bàn VIP, sổ quỹ kế toán và kiểm duyệt sản phẩm.'
      },
      {
        num: '03',
        title: 'Mobile App Hội Viên Bỏ Túi',
        desc: 'Ứng dụng di động cài trực tiếp trên iOS và Android cho doanh nhân: Thẻ hội viên VIP 3D, danh thiếp chạm NFC, nhận vé QR check-in, chat bảo mật và quét VietQR nộp hội phí 1 chạm.'
      },
      {
        num: '04',
        title: 'Đồng Bộ Hai Chiều Tức Thời',
        desc: 'Mọi thao tác phê duyệt trên Web CRM lập tức cập nhật dữ liệu xuống điện thoại của hội viên qua đường truyền bảo mật SSL/HTTPS, đảm bảo dữ liệu nhất quán và bảo mật tuyệt đối.'
      }
    ];

    solutions.forEach((sol, idx) => {
      const xPos = 0.8 + idx * 2.95;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 4.6,
        fill: { color: CRM_THEME.BG_WHITE },
        line: { color: CRM_THEME.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 0.1,
        fill: { color: idx % 2 === 0 ? CRM_THEME.NAVY_PRIMARY : CRM_THEME.BLUE_ACCENT }
      });
      slide.addText(sol.num, { x: xPos + 0.25, y: 2.35, w: 0.8, h: 0.4, color: CRM_THEME.BLUE_ACCENT, bold: true, fontSize: 22, fontFace: 'Calibri' });
      slide.addText(sol.title, { x: xPos + 0.25, y: 2.85, w: 2.3, h: 0.65, color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(sol.desc, { x: xPos + 0.25, y: 3.6, w: 2.3, h: 2.9, color: CRM_THEME.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addCrmSlideFooter(slide, pres, SYS);
  }

  // SLIDE 5: Chức Năng 1 - Đăng Nhập CRM
  addCrmFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG QUẢN TRỊ 01', title: 'Cổng Đăng Nhập CRM Quản Trị & Phân Quyền Bảo Mật', subtitle: 'Bảo vệ an toàn thông tin hiệp hội với giao diện chuẩn Trắng - Xanh thanh lịch' },
    'crm_step_01_login_screen.png',
    '🛡️ Mã hóa phiên làm việc qua JWT Token & Kết nối bảo mật SSL/HTTPS 100%',
    [
      { title: 'Đăng Nhập Quản Trị Viên An Toàn', desc: 'Xác thực nhanh qua Email và Mật khẩu được mã hóa bcrypt bảo vệ tuyệt đối dữ liệu nội bộ.' },
      { title: 'Phân Quyền Vai Trò Đa Cấp (RBAC)', desc: 'Tách bạch quyền hạn: Super Admin, Ban Thư Ký, Ban Sự Kiện và Ban Tài Chính đúng trách nhiệm.' },
      { title: 'Lưu Phiên Tự Động & Chống Tấn Công', desc: 'Bảo vệ phiên làm việc qua cơ chế SameSite Cookie và tự động thu hồi quyền khi hết hạn.' },
      { title: 'Giao Diện Tối Ưu Mọi Màn Hình Desktop', desc: 'Trải nghiệm mượt mà từ máy trạm văn phòng đến máy tính bảng điều hành khi đi công tác.' }
    ],
    SYS
  );

  // SLIDE 6: Chức Năng 2 - Dashboard KPI Live Tổng Quan (ẢNH THỰC TẾ CHUẨN ĐẸP)
  addCrmFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG QUẢN TRỊ 02', title: 'Bảng Điều Khiển Tổng Quan (Dashboard) & Chỉ Số KPI Thực', subtitle: 'Bức tranh toàn cảnh về sức khỏe hiệp hội: Hội viên, Dòng tiền sổ quỹ và Giao thương B2B' },
    'crm_step_02_dashboard_kpi_live.png',
    '📊 Dữ liệu phản hồi trực tiếp từ Database với biểu đồ tiến độ & thống kê thời gian thực',
    [
      { title: 'Chỉ Số Tăng Trưởng Hội Viên', desc: 'Thống kê tổng số 31 doanh nhân chính thức đang hoạt động và số lượng hồ sơ mới đang chờ thẩm định.' },
      { title: 'Theo Dõi Dòng Tiền & Quỹ Hội', desc: 'Đo lường nguồn thu niên liễm 435 triệu đồng, vé sự kiện và các khoản tài trợ chuyển khoản về tài khoản hiệp hội.' },
      { title: 'Đo Lường Hiệu Quả Sàn B2B', desc: 'Tổng hợp số lượng 30 hoạt động kết nối, sản phẩm niêm yết và số lượng Deal giao thương thành công.' },
      { title: 'Xuất Báo Cáo Ban Chấp Hành Tức Thì', desc: 'Tải dữ liệu chuẩn hóa phục vụ các kỳ họp Ban Chấp Hành định kỳ chỉ với một cú nhấp chuột.' }
    ],
    SYS
  );

  // SLIDE 7: Chức Năng 3 - Quản Trị Danh Sách Hội Viên
  addCrmFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG QUẢN TRỊ 03', title: 'Quản Trị Danh Sách Hội Viên, Phân Hạng & Bộ Lọc Ban Ngành', subtitle: 'Quản lý toàn bộ 100+ lãnh đạo doanh nhân sinh năm 1983 theo ban chuyên môn' },
    'crm_step_03_members_management.png',
    '👥 Bảng dữ liệu đa năng hỗ trợ tìm kiếm nhanh, lọc theo trạng thái và xuất Excel',
    [
      { title: 'Danh Mục Hồ Sơ Doanh Nhân Đầy Đủ', desc: 'Lưu trữ họ tên, công ty, mã số thuế, chức vụ trong CLB, số điện thoại và địa chỉ trụ sở.' },
      { title: 'Bộ Lọc & Tìm Kiếm Thông Minh', desc: 'Tra cứu tức thì theo tên doanh nhân, công ty, số điện thoại hoặc trạng thái Hoạt động/Chờ duyệt.' },
      { title: 'Phân Bổ Ban Chuyên Môn Sinh Hoạt', desc: 'Sắp xếp hội viên vào Ban Sự kiện, Ban Tài chính, Ban Xúc tiến Thương mại, Ban Truyền thông.' },
      { title: 'Xuất Báo Cáo Excel Danh Bạ', desc: 'Tải file Excel định dạng chuẩn phục vụ công tác in ấn kỷ yếu và lưu trữ nội bộ hiệp hội.' }
    ],
    SYS
  );

  // SLIDE 8: Chức Năng 4 - Drawer Thẩm Định & Phê Duyệt Hồ Sơ
  addCrmFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG QUẢN TRỊ 04', title: 'Thẩm Định Hồ Sơ 360° & Tự Động Cấp Tài Khoản Qua Email', subtitle: 'Quy trình xét duyệt hồ sơ online khép kín, minh bạch và chuyên nghiệp' },
    'crm_step_04_member_approval_drawer.png',
    '⚡ Bấm Phê duyệt: Tự động kích hoạt tài khoản DB & Gửi ngay Email mật khẩu cho hội viên',
    [
      { title: 'Drawer Thẩm Định Toàn Diện 360°', desc: 'Xem trọn vẹn giấy phép đăng ký kinh doanh, chức vụ C-Level và lĩnh vực kinh doanh của doanh nghiệp.' },
      { title: 'Thao Tác Phê Duyệt (Approve) 1 Chạm', desc: 'Admin xác nhận: Hồ sơ chuyển trạng thái Hoạt động và tự động sinh mã định danh hội viên chính thức.' },
      { title: 'Tự Động Kích Hoạt Quyền Trên App', desc: 'Cấp tài khoản và quyền đăng nhập tức thì vào CSDL cho người dùng trên ứng dụng di động.' },
      { title: 'Bắn Email Chào Mừng Kèm Mật Khẩu', desc: 'Hệ thống gửi thư điện tử thông báo kết nạp kèm mật khẩu khởi tạo an toàn về hòm thư hội viên.' }
    ],
    SYS
  );

  // SLIDE 9: Chức Năng 5 - Quản Trị Sự Kiện & Vé
  addCrmFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG QUẢN TRỊ 05', title: 'Quản Trị Tổ Chức Sự Kiện, Cấu Hình Vé Đa Tầng & Bán Vé', subtitle: 'Lập kế hoạch Đại hội thường niên, Caravan xúc tiến thương mại và Gala Doanh nhân' },
    'crm_step_05_events_management.png',
    '🎫 Thiết lập vé VIP miễn phí cho hội viên và vé đại biểu có phí thu qua VietQR tự động',
    [
      { title: 'Khởi Tạo Sự Kiện Nhanh Chóng', desc: 'Thiết lập thời gian, địa điểm, nội dung chương trình và banner sự kiện đẩy trực tiếp lên Mobile App.' },
      { title: 'Cấu Hình Vé Đa Tầng Linh Hoạt', desc: 'Phân loại: Vé Hội viên VIP (0đ đặc quyền), Vé Khách mời mở rộng, Vé Nhà tài trợ kim cương.' },
      { title: 'Giám Sát Số Lượng Vé Thời Gian Thực', desc: 'Theo dõi số lượng vé đã phát hành, doanh thu bán vé sự kiện và số chỗ ngồi còn trống.' },
      { title: 'Đồng Bộ Thông Báo Đẩy Xuống App', desc: 'Tự động gửi thông báo push đến điện thoại của toàn bộ hội viên khi sự kiện mới được mở đăng ký.' }
    ],
    SYS
  );

  // SLIDE 10: Chức Năng 6 - Sơ Đồ Khán Phòng Cinema Map
  addCrmFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG QUẢN TRỊ 06', title: 'Sơ Đồ Rạp Cinema Seating Map & Xếp Chỗ VIP Gala Dinner', subtitle: 'Bố trí sơ đồ bàn tiệc trực quan, định vị chính xác chỗ ngồi danh dự' },
    'crm_step_06_seating_cinema_map.png',
    '🏛️ Phân bổ Bàn VIP Đoàn Chủ Tịch và đồng bộ số ghế chính xác vào Vé Điện Tử trên App',
    [
      { title: 'Trực Quan Hóa Sơ Đồ Khán Phòng', desc: 'Mô phỏng chân thực ma trận ghế ngồi và bàn tiệc: Bàn VIP Kim Cương, Bàn Đại biểu, Bàn Khách mời.' },
      { title: 'Kéo Thả Xếp Chỗ Ngồi Danh Dự', desc: 'Gán đại biểu và khách VIP vào từng vị trí ghế ngồi cụ thể theo giao thức ngoại giao trang trọng.' },
      { title: 'Tự Động Cập Nhật Lên Vé Trên App', desc: 'Vị trí số bàn và số ghế tự động hiển thị trên Vé điện tử thông minh trong điện thoại của hội viên.' },
      { title: 'Ngăn Ngừa Trùng Lặp Chỗ Ngồi 100%', desc: 'Hệ thống tự động khóa ghế đã được gán, đảm bảo không bao giờ xảy ra tình trạng xếp trùng vị trí.' }
    ],
    SYS
  );

  // SLIDE 11: Chức Năng 7 - Cổng Soát Vé Check-in QR
  addCrmFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG QUẢN TRỊ 07', title: 'Cổng Soát Vé Check-in QR Tốc Độ Cao & Giám Sát Cửa', subtitle: 'Kiểm soát ra vào hội trường trong 1 giây, hiển thị thông tin đại biểu trân trọng' },
    'crm_step_07_gate_checkin.png',
    '⚡ Tốc độ quét mã 1 giây/người, chống chụp màn hình gian lận & âm thanh xác nhận tức thì',
    [
      { title: 'Quét Mã Vé QR Điện Tử Siêu Tốc', desc: 'Hỗ trợ đầu đọc mã vạch chuyên dụng hoặc camera máy tính bảng quét vé QR từ App hội viên trong 1 giây.' },
      { title: 'Hiển Thị Thông Tin Đại Biểu Lễ Tân', desc: 'Màn hình ngay lập tức hiển thị họ tên, chức vụ, ảnh đại diện và vị trí số bàn tiệc để lễ tân đón tiếp.' },
      { title: 'Chống Quét Lại & Gian Lận 100%', desc: 'Cảnh báo màu đỏ nổi bật nếu mã vé đã được quét trước đó, ngăn chặn hành vi sử dụng chung vé.' },
      { title: 'Báo Cáo Tỷ Lệ Tham Dự Realtime', desc: 'Thống kê tức thời số lượng khách đã có mặt tại hội trường phục vụ công tác khai mạc đại hội.' }
    ],
    SYS
  );

  // SLIDE 12: Chức Năng 8 - Quản Trị Bầu Cử & Biểu Quyết Tín Nhiệm Đại Biểu (MỚI BỔ SUNG)
  addCrmFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG QUẢN TRỊ 08', title: 'Quản Trị Bầu Cử Đại Hội & Biểu Quyết Tín Nhiệm Đại Biểu', subtitle: 'Số hóa công tác hiệp thương nhân sự, thiết lập kỳ bầu cử và kiểm phiếu tự động' },
    'crm_voting_management.png',
    '🗳️ Quản lý kỳ bầu cử BCH: Giám sát tỷ lệ biểu quyết, ứng viên đại biểu & biểu đồ kết quả trực tiếp',
    [
      { title: 'Khởi Tạo Kỳ Bầu Cử & Biểu Quyết Nhanh', desc: 'Thiết lập tiêu đề kỳ họp, thời gian mở/đóng hòm phiếu điện tử và số lượng ứng viên tối đa được chọn.' },
      { title: 'Quản Lý Danh Sách Ứng Cử Viên Ban Chấp Hành', desc: 'Cập nhật hồ sơ ứng viên, hình ảnh, chức vụ hiện tại và chương trình hành động để đại biểu nghiên cứu.' },
      { title: 'Kiểm Phiếu Tự Động & Chống Gian Lận', desc: 'Thuật toán mã hóa một chiều ngăn chặn bỏ phiếu hai lần, tự động tổng hợp số phiếu và tỷ lệ phần trăm.' },
      { title: 'Xuất Báo Cáo Kiểm Phiếu Chuẩn Đại Hội', desc: 'In biên bản kiểm phiếu phục vụ Ban Kiểm Soát đại hội ký duyệt và lưu trữ văn kiện nhiệm kỳ.' }
    ],
    SYS
  );

  // SLIDE 13: Chức Năng 9 - Vòng Quay May Mắn (Lucky Draw) Đêm Gala (MỚI BỔ SUNG)
  addCrmFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG QUẢN TRỊ 09', title: 'Quản Trị Vòng Quay May Mắn Lucky Draw & Cơ Cấu Giải Thưởng', subtitle: 'Khuấy động không khí đêm Gala với cơ chế quay số ngẫu nhiên theo mã vé may mắn' },
    'crm_lucky_draw_modal.png',
    '🎁 Cơ cấu Giải đặc biệt VinFast VF3 - Quay số minh bạch, tìm người trúng giải & thông báo tức thì',
    [
      { title: 'Cấu Hình Cơ Cấu Giải Thưởng Hấp Dẫn', desc: 'Thiết lập Giải Đặc Biệt (Ô tô VinFast VF3), Giải Nhất, Giải Nhì, Giải Ba kèm hình ảnh minh họa sống động.' },
      { title: 'Quay Số Ngẫu Nhiên Minh Bạch 100%', desc: 'Hệ thống quay số ngẫu nhiên từ tập hợp mã vé đã check-in vào sự kiện, hiển thị số nhảy trên màn LED.' },
      { title: 'Xác Nhận Người Trúng Thưởng & Mã Vé', desc: 'Hệ thống tự động hiển thị thông tin trúng thưởng (VD: Ngô Bảo Anh - Mã vé #2190) lên màn hình lớn.' },
      { title: 'Gửi Thông Báo Push Chúc Mừng Xuống App', desc: 'Admin bấm nút gửi thông báo: Điện thoại người trúng nhận ngay tin nhắn chúc mừng lên sân khấu nhận giải.' }
    ],
    SYS
  );

  // SLIDE 14: Chức Năng 10 - Quản Trị Sàn Marketplace
  addCrmFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG QUẢN TRỊ 10', title: 'Quản Trị Sàn Marketplace, Kiểm Duyệt Sản Phẩm Doanh Nghiệp', subtitle: 'Thẩm định chất lượng và xuất xứ trước khi niêm yết chào hàng nội bộ' },
    'crm_step_08_marketplace_moderation.png',
    '🏷️ Gán nhãn Đã Kiểm Duyệt CLB CEO 1983 và kích hoạt ưu đãi đặc quyền cho hội viên',
    [
      { title: 'Hàng Đợi Kiểm Duyệt Sản Phẩm', desc: 'Tiếp nhận bài đăng sản phẩm từ Mobile App hội viên, xem hình ảnh, thông số kỹ thuật và báo giá sỉ.' },
      { title: 'Thẩm Định Chính Sách Ưu Đãi Nội Bộ', desc: 'Đảm bảo sản phẩm có chính sách chiết khấu thực chất dành riêng cho cộng đồng doanh nhân CEO 1983.' },
      { title: 'Phê Duyệt Xuất Bản Lên App Tức Thì', desc: 'Bấm Duyệt: Sản phẩm ngay lập tức xuất hiện trên sàn giao dịch của toàn bộ hội viên trên di động.' },
      { title: 'Theo Dõi & Giám Sát Báo Giá B2B', desc: 'Thống kê số lượt hội viên gửi yêu cầu báo giá và lưu lượng tương tác giao thương giữa các bên.' }
    ],
    SYS
  );

  // SLIDE 15: Chức Năng 11 - Quản Trị Cơ Hội Giao Thương
  addCrmFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG QUẢN TRỊ 11', title: 'Điều Phối Cơ Hội Giao Thương B2B & Thống Kê Giá Trị Deals', subtitle: 'Nắm bắt dòng chảy giao thương, kết nối cung cầu và thúc đẩy hợp đồng kinh tế' },
    'crm_step_09_opportunities_sync.png',
    '🤝 Đo lường giá trị các Deal kinh doanh đã kết nối thành công phục vụ báo cáo hiệp hội',
    [
      { title: 'Nắm Bắt Toàn Diện Nhu Cầu Giao Thương', desc: 'Theo dõi các đề xuất mua bán, tìm nhà cung ứng, mời gọi hợp tác đầu tư và phân phối hàng hóa.' },
      { title: 'Giám Sát Trạng Thái Kết Nối Deals', desc: 'Biết chính xác cơ hội nào đã được hội viên đón nhận (Claimed) và tiến độ ký kết hợp đồng.' },
      { title: 'Thống Kê Tổng Giá Trị Giao Thương', desc: 'Đo lường quy mô kinh tế bằng tiền (Tỷ đồng) mà hệ sinh thái CEO 1983 đã tạo ra cho thành viên.' },
      { title: 'Hỗ Trợ Kết Nối Chéo Giữa Các Ban', desc: 'Ban Xúc tiến thương mại đóng vai trò điều phối, giới thiệu các đối tác tiềm năng phù hợp nhất.' }
    ],
    SYS
  );

  // SLIDE 16: Chức Năng 12 - Tài Chính Quỹ Hội & Sổ Quỹ
  addCrmFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG QUẢN TRỊ 12', title: 'Quản Lý Thu Hội Phí Thường Niên, Đối Soát VietQR & Sổ Quỹ', subtitle: 'Tự động hóa đối soát sao kê ngân hàng, gạch nợ hội phí không cần xử lý thủ công' },
    'crm_step_10_finance_fees_cashbook.png',
    '💳 Gạch nợ tự động qua VietQR, xuất phiếu thu điện tử và lưu trữ sổ quỹ kế toán minh bạch',
    [
      { title: 'Theo Dõi Niên Liễm Theo Năm Tài Chính', desc: 'Bảng theo dõi trạng thái hoàn thành hội phí: Đã thanh toán, Chưa nộp, Miễn giảm theo từng hội viên.' },
      { title: 'Đối Soát Tự Động Qua Cổng VietQR', desc: 'Khi hội viên quét mã chuyển khoản trên App, hệ thống tự động gạch nợ và gia hạn thẻ số tức thì.' },
      { title: 'Quản Lý Sổ Quỹ Thu Chi Minh Bạch', desc: 'Ghi nhận chi tiết mọi dòng tiền: Thu hội phí, Thu vé sự kiện, Thu tài trợ và các khoản chi hoạt động.' },
      { title: 'Xuất Báo Cáo Kế Toán & Phiếu Thu Số', desc: 'Tự động tạo phiếu thu điện tử gửi về email hội viên và xuất file đối soát phục vụ ban kiểm soát.' }
    ],
    SYS
  );

  // SLIDE 17: Chức Năng 13 - Doanh Nghiệp Thành Viên & Chuỗi Cung Ứng
  addCrmFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG QUẢN TRỊ 13', title: 'Quản Lý Doanh Nghiệp Thành Viên & Bản Đồ Chuỗi Cung Ứng', subtitle: 'Xây dựng mạng lưới liên kết sản xuất và tiêu dùng nội bộ bền vững' },
    'crm_step_11_companies_directory.png',
    '🏢 Bản đồ năng lực chuỗi cung ứng: Kết nối sản xuất, phân phối và dịch vụ C-Level',
    [
      { title: 'Lưu Trữ Hồ Sơ Pháp Nhân Đầy Đủ', desc: 'Quản lý mã số thuế, địa chỉ trụ sở, người đại diện pháp luật và hồ sơ năng lực chi tiết của công ty.' },
      { title: 'Phân Loại Ngành Nghề Chuỗi Giá Trị', desc: 'Sắp xếp theo cụm ngành: Cơ khí sản xuất, Xây dựng hoàn thiện, F&B, Logistics, Dịch vụ số.' },
      { title: 'Thúc Đẩy Sử Dụng Sản Phẩm Chéo', desc: 'Khuyến khích hội viên ưu tiên sử dụng vật tư, thiết bị và dịch vụ của nhau với chiết khấu nội bộ.' },
      { title: 'Liên Kết Tài Khoản Lãnh Đạo Với Công Ty', desc: 'Một doanh nghiệp có thể có Chủ tịch và Tổng Giám Đốc cùng sinh hoạt với quyền hạn rõ ràng.' }
    ],
    SYS
  );

  // SLIDE 18: Chức Năng 14 - Phân Quyền RBAC & Audit Logs
  addCrmFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG QUẢN TRỊ 14', title: 'Cấu Hình Phân Quyền Quản Trị RBAC & Nhật Ký Kiểm Toán', subtitle: 'Lưu vết bất biến toàn bộ thao tác vận hành, đảm bảo an toàn tuyệt đối' },
    'crm_step_12_roles_audit_logs.png',
    '🔒 Nhật ký kiểm toán lưu vết IP, tài khoản thực hiện và thời gian chính xác của mọi thao tác',
    [
      { title: 'Ma Trận Phân Quyền Chi Tiết (RBAC)', desc: 'Cấp quyền Xem, Thêm, Sửa, Xóa, Duyệt cho từng vị trí trong Ban Thư Ký và Ban Quản Trị.' },
      { title: 'Nhật Ký Kiểm Toán An Ninh Bất Biến', desc: 'Ghi nhận lịch sử: Ai đã phê duyệt hội viên, ai đã sửa số liệu sổ quỹ, ai đã xuất file danh bạ.' },
      { title: 'Bảo Vệ Hạ Tầng Chuẩn SSL/HTTPS', desc: 'Toàn bộ dữ liệu truyền tải giữa Web CRM, App Mobile và CSDL đều được mã hóa tuyệt đối.' },
      { title: 'Cơ Chế Sao Lưu Định Kỳ Tự Động', desc: 'Tự động sao lưu dự phòng CSDL hàng ngày, đảm bảo khả năng phục hồi nguyên vẹn khi cần thiết.' }
    ],
    SYS
  );

  // SLIDE 19: Ưu Điểm Vượt Trội Của Hệ Thống CRM (Trắng Xanh)
  {
    const slide = pres.addSlide();
    addCrmSlideHeader(slide, pres, 'ƯU ĐIỂM VƯỢT TRỘI', 'Giá Trị Cốt Lõi & Hiệu Quả Đột Phá Cho Ban Lãnh Đạo', 'Tối ưu hóa nguồn lực, bảo vệ dữ liệu và nâng cao năng lực quản trị hiệp hội');

    const advs = [
      {
        num: '01',
        title: 'Tiết Kiệm 90% Thời Gian Thủ Công',
        desc: 'Tự động hóa hoàn toàn việc tiếp nhận hồ sơ, gửi email mật khẩu, xuất danh sách đại biểu và gạch nợ hội phí, giải phóng sức lao động cho Ban Thư Ký.'
      },
      {
        num: '02',
        title: 'Minh Bạch Tài Chính Tuyệt Đối',
        desc: 'Mọi dòng tiền thu chi đều được đối soát khớp lệnh qua mã VietQR và lưu vết trong sổ quỹ điện tử, sẵn sàng cho công tác kiểm toán của Ban Kiểm Soát.'
      },
      {
        num: '03',
        title: 'Kế Thừa Dữ Liệu Bất Biến Qua Các Nhiệm Kỳ',
        desc: 'Toàn bộ danh bạ hội viên, kỷ yếu sự kiện và lịch sử giao thương được lưu trữ trên hạ tầng CSDL bảo mật, giúp chuyển giao nhiệm kỳ suôn sẻ và nguyên vẹn.'
      },
      {
        num: '04',
        title: 'Độ Tin Cậy & Sẵn Sàng 99.9%',
        desc: 'Kiến trúc Docker container hóa trên máy chủ hiệu năng cao, phản hồi dưới 100ms và cơ chế tự động khôi phục sự cố bảo đảm hệ thống luôn thông suốt.'
      }
    ];

    advs.forEach((a, idx) => {
      const xPos = 0.8 + idx * 2.95;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 4.6,
        fill: { color: CRM_THEME.BG_WHITE },
        line: { color: CRM_THEME.BLUE_BORDER, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 0.1,
        fill: { color: CRM_THEME.NAVY_PRIMARY }
      });
      slide.addText(a.num, { x: xPos + 0.25, y: 2.35, w: 0.8, h: 0.4, color: CRM_THEME.BLUE_ACCENT, bold: true, fontSize: 22, fontFace: 'Calibri' });
      slide.addText(a.title, { x: xPos + 0.25, y: 2.85, w: 2.3, h: 0.65, color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(a.desc, { x: xPos + 0.25, y: 3.6, w: 2.3, h: 2.9, color: CRM_THEME.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addCrmSlideFooter(slide, pres, SYS);
  }

  // SLIDE 20: Lộ Trình & Hướng Phát Triển Tương Lai
  {
    const slide = pres.addSlide();
    addCrmSlideHeader(slide, pres, 'HƯỚNG PHÁT TRIỂN TƯƠNG LAI', 'Lộ Trình Nâng Cấp Hệ Thống CRM Quản Trị Giai Đoạn 2026 - 2028', 'Tích hợp Trí tuệ nhân tạo và mở rộng liên minh giao thương hiệp hội toàn quốc');

    const roadmaps = [
      {
        phase: 'GIAI ĐOẠN 1 (ĐÃ HOÀN THÀNH)',
        title: 'Chuẩn Hóa Nền Tảng Quản Trị Số',
        desc: 'Số hóa 100% hồ sơ hội viên, tự động hóa duyệt tài khoản, sơ đồ khán phòng VIP, cổng soát vé QR 1s và đối soát tài chính tự động VietQR.'
      },
      {
        phase: 'GIAI ĐOẠN 2 (QUÝ 3 - QUÝ 4/2026)',
        title: 'Tích Hợp AI Matching & Trợ Lý Ảo',
        desc: 'Thuật toán AI tự động gợi ý kết nối cung - cầu giữa các doanh nghiệp theo lĩnh vực; Trợ lý ảo AI tóm tắt biên bản họp BCH và tự động soạn thảo nghị quyết.'
      },
      {
        phase: 'GIAI ĐOẠN 3 (NĂM 2027)',
        title: 'Hệ Thống Phân Tích Dữ Liệu Lớn (BI)',
        desc: 'Báo cáo thông minh dự báo xu hướng dòng tiền quỹ hội, đo lường chỉ số gắn kết của từng thành viên và cảnh báo sớm nguy cơ rời bỏ hiệp hội.'
      },
      {
        phase: 'GIAI ĐOẠN 4 (NĂM 2028)',
        title: 'Liên Minh Số Hiệp Hội Toàn Quốc',
        desc: 'Mở rộng liên kết cơ sở dữ liệu với Hội Doanh Nhân Trẻ các tỉnh thành và các tổ chức xúc tiến thương mại quốc tế, mở ra mạng lưới giao thương toàn cầu.'
      }
    ];

    roadmaps.forEach((r, idx) => {
      const xPos = 0.8 + idx * 2.95;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 4.6,
        fill: { color: CRM_THEME.BG_WHITE },
        line: { color: CRM_THEME.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 0.1,
        fill: { color: CRM_THEME.NAVY_PRIMARY }
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos + 0.25, y: 2.35, w: 2.3, h: 0.32,
        fill: { color: CRM_THEME.BLUE_LIGHT }, roundRadio: 0.06
      });
      slide.addText(r.phase, {
        x: xPos + 0.25, y: 2.35, w: 2.3, h: 0.32,
        color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 8.5, align: 'center', valign: 'middle', fontFace: 'Calibri'
      });
      slide.addText(r.title, { x: xPos + 0.25, y: 2.85, w: 2.3, h: 0.65, color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(r.desc, { x: xPos + 0.25, y: 3.6, w: 2.3, h: 2.9, color: CRM_THEME.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addCrmSlideFooter(slide, pres, SYS);
  }

  // SLIDE 21: Tổng Kết & Lời Kết (Nền Trắng Sáng, Xanh Navy, Zero Dark/Gold)
  {
    const slide = pres.addSlide();
    slide.background = { color: CRM_THEME.BG_WHITE };
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.12, fill: { color: CRM_THEME.NAVY_PRIMARY } });

    slide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 1.0, w: 5.2, h: 0.4,
      fill: { color: CRM_THEME.BLUE_LIGHT }, line: { color: CRM_THEME.BLUE_BORDER, width: 1.5 }, roundRadio: 0.08
    });
    slide.addText('KHẲNG ĐỊNH VỊ THẾ HIỆP HỘI TIÊN PHONG', {
      x: 0.8, y: 1.0, w: 5.2, h: 0.4,
      color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 11, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });

    slide.addText('TỔNG KẾT & CAM KẾT VẬN HÀNH SỐ HÓA', {
      x: 0.8, y: 1.6, w: 11.73, h: 0.9,
      color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 32, fontFace: 'Calibri'
    });
    slide.addText('Khẳng định đẳng cấp quản trị · Minh bạch tài chính · Sẵn sàng bàn giao nhiệm kỳ trọn vẹn', {
      x: 0.8, y: 2.55, w: 11.73, h: 0.5,
      color: CRM_THEME.BLUE_ACCENT, bold: true, fontSize: 16, italic: true, fontFace: 'Calibri'
    });

    const values = [
      { t: 'Đơn Giản Hóa Vận Hành', d: 'Mọi nghiệp vụ từ duyệt hội viên đến tổ chức sự kiện đều được quy chuẩn hóa trong một phần mềm duy nhất, dễ dùng và trực quan.' },
      { t: 'Bảo Toàn Di Sản Hiệp Hội', d: 'Dữ liệu không bao giờ bị mất mát, tạo nền tảng vững chắc cho các thế hệ Ban Chấp Hành kế tiếp phát triển lớn mạnh hơn.' },
      { t: 'Lan Tỏa Giá Trị Thực Chất', d: 'Đưa CLB CEO 1983 trở thành mái nhà chung kết nối kinh doanh hiệu quả, tin cậy và bền vững hàng đầu thủ đô.' }
    ];

    values.forEach((v, idx) => {
      const xPos = 0.8 + idx * 4.0;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 3.4, w: 3.7, h: 3.0,
        fill: { color: CRM_THEME.BG_WHITE },
        line: { color: CRM_THEME.BLUE_BORDER, width: 1.5 },
        roundRadio: 0.12
      });
      slide.addText(`✓  ${v.t}`, {
        x: xPos + 0.3, y: 3.7, w: 3.1, h: 0.6,
        color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 14, fontFace: 'Calibri'
      });
      slide.addText(v.d, {
        x: xPos + 0.3, y: 4.4, w: 3.1, h: 1.7,
        color: CRM_THEME.TEXT_BODY, fontSize: 11.5, fontFace: 'Calibri'
      });
    });

    slide.addText('Hệ Thống CRM Quản Trị · CLB Doanh Nhân CEO 1983 · Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)', {
      x: 0.8, y: 6.75, w: 11.73, h: 0.3, color: CRM_THEME.TEXT_MUTED, fontSize: 11, align: 'center', fontFace: 'Calibri'
    });
  }

  // SLIDE 23: TRANG KẾT THÚC & CẢM ƠN (DEDICATED CLOSING / THANK YOU SLIDE)
  {
    const slide = pres.addSlide();
    slide.background = { color: CRM_THEME.BG_WHITE };
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.15, fill: { color: CRM_THEME.NAVY_PRIMARY } });

    // Huy hiệu trên
    slide.addShape(pres.ShapeType.rect, {
      x: 2.5, y: 0.9, w: 8.33, h: 0.45,
      fill: { color: CRM_THEME.BLUE_LIGHT }, line: { color: CRM_THEME.BLUE_BORDER, width: 1.5 }, roundRadio: 0.08
    });
    slide.addText('TRUNG TÂM CHỈ HUY & ĐIỀU HÀNH SỐ HÓA HIỆP HỘI', {
      x: 2.5, y: 0.9, w: 8.33, h: 0.45,
      color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 12, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });

    // Đại tựa đề: XIN TRÂN TRỌNG CẢM ƠN!
    slide.addText('XIN TRÂN TRỌNG CẢM ƠN!', {
      x: 1.0, y: 1.55, w: 11.33, h: 0.9,
      color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 40, align: 'center', fontFace: 'Calibri'
    });

    slide.addText('KÍNH CHÚC QUÝ LÃNH ĐẠO & QUÝ ANH CHỊ DOANH NHÂN SỨC KHỎE, HẠNH PHÚC & THỊNH VƯỢNG!', {
      x: 1.0, y: 2.5, w: 11.33, h: 0.45,
      color: CRM_THEME.BLUE_ACCENT, bold: true, fontSize: 15.5, align: 'center', fontFace: 'Calibri'
    });

    slide.addText('"TÂM - TẦM - TÍN - THỊNH"  ·  "KẾT NỐI BỀN - PHÁT TRIỂN VỮNG"', {
      x: 1.0, y: 3.0, w: 11.33, h: 0.4,
      color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 13.5, italic: true, align: 'center', fontFace: 'Calibri'
    });

    // 3 Khối liên hệ, hỏi đáp Q&A và hỗ trợ kỹ thuật
    const closingCards = [
      {
        icon: '🏛️',
        title: 'CLB DOANH NHÂN CEO 1983',
        sub: 'Trực thuộc HanoiBA',
        detail: 'Mái nhà chung kết nối các lãnh đạo doanh nhân sinh năm 1983, cùng kiến tạo giá trị kinh tế và phụng sự cộng đồng.'
      },
      {
        icon: '💬',
        title: 'PHIÊN HỎI ĐÁP & THẢO LUẬN (Q&A)',
        sub: 'Lắng nghe & tiếp thu ý kiến',
        detail: 'Ban Thư Ký luôn sẵn sàng giải đáp mọi thắc mắc và tiếp thu ý kiến đóng góp từ Quý Ban Chấp Hành & Hội viên.'
      },
      {
        icon: '📞',
        title: 'HỖ TRỢ VẬN HÀNH & KỸ THUẬT',
        sub: 'Ban Thư Ký CLB CEO 1983',
        detail: 'Hotline / Zalo hỗ trợ vận hành trực tiếp, tiếp nhận thẩm định hồ sơ hội viên và hướng dẫn sử dụng phần mềm 24/7.'
      }
    ];

    closingCards.forEach((c, idx) => {
      const x = 1.0 + idx * 3.9;
      slide.addShape(pres.ShapeType.rect, {
        x, y: 3.65, w: 3.6, h: 2.8,
        fill: { color: CRM_THEME.BG_WHITE }, line: { color: CRM_THEME.BLUE_BORDER, width: 1.5 }, roundRadio: 0.12
      });
      slide.addText(c.icon, { x, y: 3.85, w: 3.6, h: 0.5, align: 'center', fontSize: 26, fontFace: 'Calibri' });
      slide.addText(c.title, { x: x + 0.15, y: 4.45, w: 3.3, h: 0.4, color: CRM_THEME.NAVY_PRIMARY, bold: true, fontSize: 12.5, align: 'center', fontFace: 'Calibri' });
      slide.addText(c.sub, { x: x + 0.15, y: 4.85, w: 3.3, h: 0.35, color: CRM_THEME.BLUE_ACCENT, bold: true, fontSize: 10.5, align: 'center', fontFace: 'Calibri' });
      slide.addText(c.detail, { x: x + 0.2, y: 5.25, w: 3.2, h: 1.05, color: CRM_THEME.TEXT_BODY, fontSize: 10.5, align: 'center', fontFace: 'Calibri' });
    });

    slide.addText('Hệ Thống CRM Quản Trị · CLB Doanh Nhân CEO 1983 · Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)', {
      x: 1.0, y: 6.85, w: 11.33, h: 0.3, color: CRM_THEME.TEXT_MUTED, fontSize: 10.5, align: 'center', fontFace: 'Calibri'
    });
  }

  const outPptx = path.join(OUT_DIR, 'SLIDE_THUYET_TRINH_CRM_QUAN_TRI_CEO1983.pptx');
  let actualTarget = outPptx;
  try {
    await pres.writeFile({ fileName: outPptx });
  } catch (err) {
    if (err.code === 'EBUSY') {
      actualTarget = path.join(OUT_DIR, 'SLIDE_THUYET_TRINH_CRM_QUAN_TRI_CEO1983_MOI.pptx');
      await pres.writeFile({ fileName: actualTarget });
      console.warn(`[WARN] File SLIDE_THUYET_TRINH_CRM_QUAN_TRI_CEO1983.pptx đang mở trong PowerPoint. Đã xuất bản sao mới tại: ${actualTarget}`);
    } else {
      throw err;
    }
  }
  try {
    fs.copyFileSync(actualTarget, path.join(FE_DOCS_DIR, 'SLIDE_THUYET_TRINH_CRM_QUAN_TRI_CEO1983.pptx'));
  } catch (e) {
    if (e.code === 'EBUSY') {
      fs.copyFileSync(actualTarget, path.join(FE_DOCS_DIR, 'SLIDE_THUYET_TRINH_CRM_QUAN_TRI_CEO1983_MOI.pptx'));
    }
  }
  console.log(`✓ Đã tạo PPTX CRM thành công: ${actualTarget} (${(fs.statSync(actualTarget).size / 1024).toFixed(1)} KB)`);
}

// =============================================================================
// 2. DECK APP HIỆP HỘI (24 SLIDES - TRẮNG NHIỀU 70%, XANH 25%, CHÚT VÀNG 5%)
// =============================================================================
async function generateAppPptx() {
  console.log('>>> Khởi tạo Slide Thuyết Trình App Hiệp Hội (SLIDE_THUYET_TRINH_APP_HIEP_HOI_CEO1983.pptx) - Trắng 70%, Xanh 25%, Vàng 5%...');
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = 'Thuyết Trình Ứng Dụng Di Động Hiệp Hội - CLB Doanh Nhân CEO 1983';
  pres.author = 'Ban Thư Ký CLB Doanh Nhân CEO 1983';
  pres.company = 'CLB Doanh Nhân CEO 1983 · HanoiBA';

  const SYS = 'Ứng Dụng Di Động Hiệp Hội';

  // SLIDE 1: TRANG TIÊU ĐỀ CHÍNH THỨC (DEDICATED COVER / TITLE SLIDE)
  {
    const slide = pres.addSlide();
    slide.background = { color: APP_THEME.BG_WHITE };
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 11.33, h: 0.15, fill: { color: APP_THEME.NAVY_PRIMARY } });
    slide.addShape(pres.ShapeType.rect, { x: 11.33, y: 0, w: 2.0, h: 0.15, fill: { color: APP_THEME.GOLD_ACCENT } });

    // Huy hiệu tổ chức trên cùng
    slide.addShape(pres.ShapeType.rect, {
      x: 2.0, y: 1.0, w: 9.33, h: 0.48,
      fill: { color: APP_THEME.NAVY_PRIMARY }, line: { color: APP_THEME.GOLD_ACCENT, width: 1.5 }, roundRadio: 0.1
    });
    slide.addText('CLB DOANH NHÂN CEO 1983 · HỘI DOANH NHÂN TRẺ HÀ NỘI (HANOIBA)', {
      x: 2.0, y: 1.0, w: 9.33, h: 0.48,
      color: APP_THEME.BG_WHITE, bold: true, fontSize: 13, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });

    // Đại tựa đề (Grand Title)
    slide.addText('ỨNG DỤNG DI ĐỘNG HỘI VIÊN CEO 1983', {
      x: 1.0, y: 1.85, w: 11.33, h: 1.1,
      color: APP_THEME.NAVY_PRIMARY, bold: true, fontSize: 34, align: 'center', fontFace: 'Calibri'
    });

    // Vạch nhấn vàng kim 5%
    slide.addShape(pres.ShapeType.rect, {
      x: 5.4, y: 3.1, w: 2.53, h: 0.05,
      fill: { color: APP_THEME.GOLD_ACCENT }
    });

    // Phụ đề (Subtitle)
    slide.addText('NỀN TẢNG KẾT NỐI DOANH NHÂN & ĐẶC QUYỀN SỐ HÓA ĐỘC BẢN', {
      x: 1.0, y: 3.3, w: 11.33, h: 0.5,
      color: APP_THEME.NAVY_PRIMARY, bold: true, fontSize: 15, align: 'center', fontFace: 'Calibri'
    });
    slide.addText('Thẻ Hội Viên VIP Gold · Thẻ Visit Card Số Hóa · Check-in QR Sự Kiện & Bàn VIP · Sàn Cơ Hội Giao Thương B2B', {
      x: 1.0, y: 3.85, w: 11.33, h: 0.45,
      color: APP_THEME.TEXT_MUTED, fontSize: 12.5, italic: true, align: 'center', fontFace: 'Calibri'
    });

    // Khối thẻ metadata thông tin báo cáo trang trọng
    slide.addShape(pres.ShapeType.rect, {
      x: 2.2, y: 4.65, w: 8.93, h: 1.8,
      fill: { color: APP_THEME.BG_WHITE }, line: { color: APP_THEME.BORDER_SUBTLE, width: 1.5 }, roundRadio: 0.12
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 2.2, y: 4.65, w: 0.15, h: 1.8, fill: { color: APP_THEME.GOLD_ACCENT }
    });

    slide.addText([
      { text: 'Đơn Vị Phát Triển: ', options: { bold: true, color: APP_THEME.NAVY_PRIMARY, fontSize: 12 } },
      { text: 'Ban Quản Trị & Ban Thư Ký CLB Doanh Nhân CEO 1983 (Trực thuộc HanoiBA)\n', options: { color: APP_THEME.TEXT_BODY, fontSize: 12 } },
      { text: 'Chuyên Viên Phụ Trách: ', options: { bold: true, color: APP_THEME.NAVY_PRIMARY, fontSize: 12 } },
      { text: 'Phạm Văn Vũ  |  ', options: { color: APP_THEME.TEXT_BODY, fontSize: 12 } },
      { text: 'Nền Tảng: ', options: { bold: true, color: APP_THEME.NAVY_PRIMARY, fontSize: 12 } },
      { text: 'Mobile App (iOS PWA / Android Native) 2.0\n', options: { color: APP_THEME.TEXT_BODY, fontSize: 12 } },
      { text: 'Thời Gian: ', options: { bold: true, color: APP_THEME.NAVY_PRIMARY, fontSize: 12 } },
      { text: 'Tháng 09/2026  ·  Hà Nội, Việt Nam', options: { color: APP_THEME.TEXT_MUTED, fontSize: 12 } }
    ], {
      x: 2.5, y: 4.8, w: 8.33, h: 1.5, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });

    slide.addText('Bản Quyền © 2026 CLB Doanh Nhân CEO 1983 · Trực thuộc Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)', {
      x: 1.0, y: 6.85, w: 11.33, h: 0.35, color: APP_THEME.TEXT_MUTED, fontSize: 10, align: 'center', fontFace: 'Calibri'
    });
  }

  // SLIDE 2: Tổng Quan Nền Tảng: 4 Trụ Cột Đặc Quyền Số Hóa Hội Viên
  {
    const slide = pres.addSlide();
    slide.background = { color: APP_THEME.BG_WHITE };
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: APP_THEME.NAVY_PRIMARY } });
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0.08, w: 13.33, h: 0.03, fill: { color: APP_THEME.GOLD_ACCENT } });

    slide.addShape(pres.ShapeType.rect, {
      x: 1.0, y: 1.0, w: 5.6, h: 0.4,
      fill: { color: APP_THEME.NAVY_PRIMARY }, line: { color: APP_THEME.GOLD_ACCENT, width: 1.5 }, roundRadio: 0.08
    });
    slide.addText('ỨNG DỤNG DI ĐỘNG HIỆP HỘI THỜI KỲ SỐ', {
      x: 1.0, y: 1.0, w: 5.6, h: 0.4,
      color: APP_THEME.BG_WHITE, bold: true, fontSize: 11, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });

    slide.addText('TỔNG QUAN NỀN TẢNG: 4 GIÁ TRỊ ĐẶC QUYỀN HỘI VIÊN', {
      x: 1.0, y: 1.6, w: 11.33, h: 0.9,
      color: APP_THEME.NAVY_PRIMARY, bold: true, fontSize: 30, fontFace: 'Calibri'
    });
    slide.addText('Không Gian Số Hội Viên Đẳng Cấp: Thẻ VIP Gold · Danh Thiếp Visit Card · Chạm NFC · Quét QR Công Khai', {
      x: 1.0, y: 2.55, w: 11.33, h: 0.5,
      color: APP_THEME.NAVY_PRIMARY, fontSize: 14, fontFace: 'Calibri'
    });

    const pillars = [
      { num: '01', title: 'Thẻ VIP & NFC 1 Chạm', desc: 'Thẻ hội viên VIP Gold số hóa chuẩn quốc tế, tích hợp chip NFC chạm trao danh thiếp ngay trên điện thoại.' },
      { num: '02', title: 'Sàn Trao Đổi Cơ Hội B2B', desc: 'Chia sẻ nhu cầu mua bán sỉ, kết nối cung ứng và kêu gọi đầu tư trực tiếp giữa các doanh nhân.' },
      { num: '03', title: 'Sự Kiện, Vé & Bầu Cử Đại Hội', desc: 'Xem lịch đại hội, đăng ký vé VietQR, quét mã QR vào cửa 1s, bỏ phiếu BCH và quay số trúng thưởng.' },
      { num: '04', title: 'Đồng Bộ Realtime CRM', desc: 'Tách biệt giao diện chuyên dụng cho hội viên nhưng liên kết 100% dữ liệu vận hành từ Web CRM Quản trị.' },
    ];
    pillars.forEach((p, idx) => {
      const x = 1.0 + idx * 2.9;
      slide.addShape(pres.ShapeType.rect, {
        x, y: 3.5, w: 2.7, h: 2.7, fill: { color: APP_THEME.BG_WHITE }, line: { color: APP_THEME.BORDER_SUBTLE, width: 1.2 }, roundRadio: 0.12
      });
      // Vạch nhỏ vàng kim điểm xuyết 5%
      slide.addShape(pres.ShapeType.rect, {
        x: x + 0.2, y: 3.65, w: 0.4, h: 0.04, fill: { color: APP_THEME.GOLD_ACCENT }
      });
      slide.addText(p.num, { x: x + 0.2, y: 3.75, w: 0.8, h: 0.4, color: APP_THEME.GOLD_ACCENT, bold: true, fontSize: 22, fontFace: 'Calibri' });
      slide.addText(p.title, { x: x + 0.2, y: 4.25, w: 2.3, h: 0.5, color: APP_THEME.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(p.desc, { x: x + 0.2, y: 4.8, w: 2.3, h: 1.2, color: APP_THEME.TEXT_BODY, fontSize: 10.5, fontFace: 'Calibri' });
    });

    slide.addText('CLB Doanh Nhân CEO 1983 · Trực thuộc Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)', {
      x: 1.0, y: 6.75, w: 11.33, h: 0.35, color: APP_THEME.TEXT_MUTED, fontSize: 10.5, italic: true, fontFace: 'Calibri'
    });
  }

  // SLIDE 2: Bài Toán & Thực Trạng
  {
    const slide = pres.addSlide();
    addAppSlideHeader(slide, pres, 'BÀI TOÁN & THỰC TRẠNG', 'Thách Thức Trong Kết Nối & Trải Nghiệm Của Doanh Nhân', 'Những bất tiện mà các chủ doanh nghiệp thường xuyên gặp phải trong sinh hoạt cộng đồng');

    const pains = [
      {
        icon: '📇',
        title: 'Danh Thiếp Giấy Dễ Thất Lạc',
        desc: 'Sau các buổi giao lưu, danh thiếp giấy thường bị quên lãng, thất lạc hoặc thông tin liên lạc bị lỗi thời khi đối tác thay đổi số điện thoại hay công ty.'
      },
      {
        icon: '💬',
        title: 'Cơ Hội Giao Thương Bị Trôi Tin',
        desc: 'Nhu cầu mua hàng, tìm nhà cung ứng đăng trong nhóm chat Zalo bị tin nhắn chào hỏi làm trôi mất, không có bộ lọc ngành nghề để tìm lại đối tác phù hợp.'
      },
      {
        icon: '🎟️',
        title: 'Check-in Sự Kiện Thủ Công Phiền Hà',
        desc: 'Doanh nhân bận rộn dễ quên lịch họp, quên vé giấy. Khi đến sự kiện phải đứng xếp hàng chờ tìm tên trong danh sách giấy in gây cảm giác thiếu chuyên nghiệp.'
      },
      {
        icon: '💸',
        title: 'Đóng Phí Phức Tạp & Thiếu Xác Nhận',
        desc: 'Chuyển khoản nộp hội phí niên liễm phải chụp màn hình gửi xác nhận qua lại, không có hóa đơn điện tử hay thẻ số để xuất trình quyền lợi ngay lập tức.'
      }
    ];

    pains.forEach((p, idx) => {
      const xPos = 0.8 + idx * 2.95;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 4.6,
        fill: { color: APP_THEME.BG_WHITE },
        line: { color: APP_THEME.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 0.08,
        fill: { color: APP_THEME.NAVY_PRIMARY }
      });
      slide.addText(p.icon, { x: xPos + 0.25, y: 2.35, w: 2.3, h: 0.5, fontSize: 24, fontFace: 'Calibri' });
      slide.addText(p.title, { x: xPos + 0.25, y: 2.9, w: 2.3, h: 0.7, color: APP_THEME.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(p.desc, { x: xPos + 0.25, y: 3.7, w: 2.3, h: 2.8, color: APP_THEME.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addAppSlideFooter(slide, pres, SYS);
  }

  // SLIDE 3: Giới Thiệu Không Gian Số Hội Viên
  {
    const slide = pres.addSlide();
    addAppSlideHeader(slide, pres, 'GIỚI THIỆU KHÔNG GIAN SỐ', 'Hệ Sinh Thái Di Động Dành Riêng Cho Doanh Nhân CEO 1983', 'Nền tảng số hóa toàn diện kết nối hơn 100+ nhà sáng lập thế hệ Quý Hợi 1983');

    const intros = [
      {
        badge: 'ĐỐI TƯỢNG HỘI VIÊN',
        title: '100+ Chủ Tịch & CEO Tinh Hoa',
        desc: 'Không gian sinh hoạt kín đáo, đẳng cấp dành riêng cho các chủ doanh nghiệp sinh năm 1983 trực thuộc Hội Doanh Nhân Trẻ Hà Nội (HanoiBA).'
      },
      {
        badge: 'PHONG CÁCH THIẾT KẾ',
        title: 'Sang Trọng - Hiện Đại - Tối Ưu',
        desc: 'Ngôn ngữ thiết kế Trắng sáng thanh lịch, Xanh Navy hoàng gia quyền lực, điểm xuyết Ánh Kim Vàng Gold sang trọng, trải nghiệm vuốt chuẩn 60fps.'
      },
      {
        badge: 'CÔNG NGHỆ TIÊN PHONG',
        title: 'Tích Hợp Thẻ VIP 3D & Chạm NFC',
        desc: 'Ứng dụng công nghệ phần cứng NFC không tiếp xúc kết hợp mã QR mã hóa động, mang lại trải nghiệm networking đẳng cấp số một hiện nay.'
      },
      {
        badge: 'ĐA NỀN TẢNG',
        title: 'Hoạt Động Trên Mọi Thiết Bị',
        desc: 'Có mặt trên iOS (Apple TestFlight / App Store), Android (file cài APK hiệu năng cao) và Progressive Web App (PWA) trên mọi trình duyệt.'
      }
    ];

    intros.forEach((item, idx) => {
      const xPos = 0.8 + idx * 2.95;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 4.6,
        fill: { color: APP_THEME.BG_WHITE },
        line: { color: APP_THEME.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 0.08,
        fill: { color: APP_THEME.NAVY_PRIMARY }
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos + 0.25, y: 2.35, w: 2.3, h: 0.3,
        fill: { color: APP_THEME.BLUE_LIGHT }, roundRadio: 0.06
      });
      slide.addText(item.badge, {
        x: xPos + 0.25, y: 2.35, w: 2.3, h: 0.3,
        color: APP_THEME.NAVY_PRIMARY, bold: true, fontSize: 9.5, align: 'center', valign: 'middle', fontFace: 'Calibri'
      });
      slide.addText(item.title, { x: xPos + 0.25, y: 2.8, w: 2.3, h: 0.65, color: APP_THEME.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(item.desc, { x: xPos + 0.25, y: 3.6, w: 2.3, h: 2.9, color: APP_THEME.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addAppSlideFooter(slide, pres, SYS);
  }

  // SLIDE 4: Mục Đích & Giải Pháp Di Động
  {
    const slide = pres.addSlide();
    addAppSlideHeader(slide, pres, 'MỤC ĐÍCH & GIẢI PHÁP', 'Đưa Toàn Bộ Hiệp Hội Vào Túi Áo Của Từng Doanh Nhân', 'Giải pháp di động toàn năng giải quyết trọn vẹn mọi nhu cầu sinh hoạt và giao thương');

    const solutions = [
      {
        num: '01',
        title: 'Mục Đích Phát Triển',
        desc: 'Xây dựng một kênh kết nối thường trực 24/7 giúp hội viên dễ dàng tra cứu đối tác, chia sẻ cơ hội kinh doanh, đăng ký sự kiện và duy trì niên liễm chỉ với 1 chạm.'
      },
      {
        num: '02',
        title: 'Thẻ VIP & Chạm NFC 1 Giây',
        desc: 'Thay thế hoàn toàn danh thiếp giấy. Chạm lưng điện thoại vào đối tác là truyền tải ngay thông tin vCard đầy đủ mà đối tác không cần cài đặt bất kỳ phần mềm nào.'
      },
      {
        num: '03',
        title: 'Sàn Thương Mại & Cơ Hội B2B',
        desc: 'Mỗi doanh nghiệp có gian hàng trưng bày sản phẩm ưu đãi nội bộ; bảng tin trao đổi nhu cầu mua bán sỉ, tìm đại lý có cơ chế đón nhận (Claim) tức thì.'
      },
      {
        num: '04',
        title: 'Vé QR Check-in & VietQR Tự Động',
        desc: 'Vé điện tử tự động gán vị trí Bàn VIP Gala Dinner, quét vào cửa trong 1 giây; nộp niên liễm qua VietQR tự động gạch nợ và nhận biên lai số về hòm thư.'
      }
    ];

    solutions.forEach((sol, idx) => {
      const xPos = 0.8 + idx * 2.95;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 4.6,
        fill: { color: APP_THEME.BG_WHITE },
        line: { color: APP_THEME.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 0.08,
        fill: { color: idx % 2 === 0 ? APP_THEME.NAVY_PRIMARY : APP_THEME.GOLD_ACCENT }
      });
      slide.addText(sol.num, { x: xPos + 0.25, y: 2.35, w: 0.8, h: 0.4, color: APP_THEME.GOLD_ACCENT, bold: true, fontSize: 22, fontFace: 'Calibri' });
      slide.addText(sol.title, { x: xPos + 0.25, y: 2.85, w: 2.3, h: 0.65, color: APP_THEME.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(sol.desc, { x: xPos + 0.25, y: 3.6, w: 2.3, h: 2.9, color: APP_THEME.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addAppSlideFooter(slide, pres, SYS);
  }

  // SLIDE 5: Chức Năng 1 - Đăng Ký Gia Nhập
  addAppMobileFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG HỘI VIÊN 01', title: 'Quy Trình Đăng Ký Gia Nhập Trực Tuyến & Cấp Quyền Tức Thì', subtitle: 'Tiếp nhận hồ sơ lãnh đạo doanh nghiệp qua giao diện trực quan, tiện lợi' },
    'app_step_01_landing_reg.png',
    'Biểu mẫu đăng ký gia nhập trực tuyến',
    [
      { title: 'Tiếp Nhận Hồ Sơ Doanh Nhân Nhanh Chóng', desc: 'Nhập họ tên, số điện thoại, tên pháp nhân công ty, chức vụ C-Level và mã số thuế.' },
      { title: 'Gửi Dữ Liệu Tức Thì Về Web CRM', desc: 'Hồ sơ tự động đổ về hàng đợi thẩm định của Ban Thư Ký CLB CEO 1983 theo thời gian thực.' },
      { title: 'Nhận Thông Báo Tiến Trình Qua Email', desc: 'Hội viên nhận email xác nhận hồ sơ đã được tiếp nhận và đang trong quá trình xét duyệt.' },
      { title: 'Tự Động Nhận Tài Khoản Khi Được Duyệt', desc: 'Ngay khi Ban Quản Trị bấm duyệt trên CRM, hệ thống tự động gửi mật khẩu khởi tạo về hòm thư.' }
    ],
    SYS
  );

  // SLIDE 6: Chức Năng 2 - Đăng Nhập & Định Danh
  addAppMobileFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG HỘI VIÊN 02', title: 'Đăng Nhập & Định Danh Doanh Nhân Bảo Mật', subtitle: 'Khởi tạo phiên làm việc an toàn với mã hội viên độc bản và mật khẩu bảo mật' },
    'app_step_03_login_screen.png',
    'Màn hình đăng nhập App bảo mật',
    [
      { title: 'Đăng Nhập Qua Email Hoặc Số Điện Thoại', desc: 'Linh hoạt cho doanh nhân đăng nhập bằng số điện thoại di động hoặc hòm thư công vụ.' },
      { title: 'Mã Hóa JWT Bearer An Toàn', desc: 'Bảo vệ toàn vẹn phiên làm việc, chống giả mạo danh tính và mã hóa đầu cuối thông tin cá nhân.' },
      { title: 'Định Danh Duy Nhất Theo Mã Hội Viên', desc: 'Mỗi lãnh đạo sở hữu mã số VIP độc bản (M1983-xxx) khẳng định tư cách thành viên chính thức.' },
      { title: 'Tích Hợp Xác Thực Sinh Trắc Học', desc: 'Hỗ trợ FaceID / Vân tay mở ứng dụng nhanh chóng trên các dòng điện thoại iOS & Android.' }
    ],
    SYS
  );

  // SLIDE 7: Chức Năng 3 - Dashboard Doanh Nhân
  addAppMobileFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG HỘI VIÊN 03', title: 'Trang Chủ Dashboard Doanh Nhân & Tiện Ích 1-Chạm', subtitle: 'Tổng hợp mọi thông tin sinh hoạt, sự kiện và cơ hội hợp tác ngay trong tầm tay' },
    'app_step_04_home_dashboard.png',
    'Dashboard tổng quan',
    [
      { title: 'Thẻ VIP Doanh Nhân 3D Tiêu Điểm', desc: 'Thẻ số hóa ánh kim vàng hoàng gia hiển thị họ tên, chức vụ và doanh nghiệp pháp nhân.' },
      { title: 'Thanh Tác Vụ Tiện Ích 1-Chạm', desc: 'Truy cập nhanh: Chạm NFC, Bầu cử, Check-in vé, Đăng bán sản phẩm, Nộp hội phí thường niên.' },
      { title: 'Banner Sự Kiện Sắp Diễn Ra', desc: 'Đếm ngược thời gian đến các kỳ Caravan, Gala Dinner và Cafe Doanh nhân định kỳ.' },
      { title: 'Bản Tin Hoạt Động Cập Nhật Hàng Ngày', desc: 'Nắm bắt các thông báo mới nhất từ Ban Chủ Tịch và Ban Thư Ký CLB CEO 1983.' }
    ],
    SYS
  );

  // SLIDE 8: Chức Năng 4 - Thẻ Định Danh VIP GOLD (MỚI BỔ SUNG)
  addAppMobileFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG HỘI VIÊN 04', title: 'Thẻ Định Danh Số Hội Viên VIP GOLD & Tích Hợp Chip NFC', subtitle: 'Biểu tượng danh giá khẳng định tư cách lãnh đạo thành viên chính thức CLB CEO 1983' },
    'app_identity_card_vip.png',
    'Thẻ định danh VIP Gold',
    [
      { title: 'Thiết Kế Thẻ Hội Viên VIP Gold Độc Bản', desc: 'Tông màu vàng kim hoàng gia sang trọng, gắn ảnh chân dung lãnh đạo, họ tên và doanh nghiệp trực thuộc.' },
      { title: 'Mã Số Hội Viên Độc Nhất (M1983-xxx)', desc: 'Mã định danh duy nhất xác nhận tư cách pháp nhân thành viên chính thức được Ban Thư Ký phê duyệt.' },
      { title: 'Huy Hiệu Tích Xanh Chứng Nhận Lãnh Đạo', desc: 'Dấu tích xanh Verified minh chứng uy tín doanh nhân được Hội Doanh Nhân Trẻ Hà Nội công nhận.' },
      { title: 'Tích Hợp Chip Cảm Ứng Không Tiếp Xúc NFC', desc: 'Chạm điện thoại vào bất kỳ máy quét hoặc điện thoại thông minh nào để mở trang định danh tức thì.' }
    ],
    SYS
  );

  // SLIDE 9: Chức Năng 5 - Danh Thiếp Số Doanh Nhân Visit Card Lật Mặt Sau (MỚI BỔ SUNG)
  addAppMobileFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG HỘI VIÊN 05', title: 'Danh Thiếp Số Doanh Nhân CEO 1983 (Thẻ Visit Card Lật Mặt Sau)', subtitle: 'Thay thế hoàn toàn card visit giấy: Mặt trước thông tin C-Level, mặt sau Brandbook xanh Navy' },
    'app_visit_card_front.png',
    'Danh thiếp số Visit Card mặt trước',
    [
      { title: 'Mặt Trước Chuẩn Brandbook Sang Trọng', desc: 'Hiển thị họ tên (Phạm Vũ Nam), chức danh CEO/Sáng lập, công ty, số điện thoại, email và trụ sở doanh nghiệp.' },
      { title: 'Hiệu Ứng Lật Thẻ Visit Card Xem Mặt Sau', desc: 'Nút Lật thẻ chuyển động mượt mà mở mặt sau màu xanh Navy hoàng gia mang slogan CLB CEO 1983.' },
      { title: 'Nút Chia Sẻ & Mã QR Động Kết Nối Nhanh', desc: 'Mở mã QR cá nhân để đối tác quét bằng Zalo/Camera nhận thông tin vCard lưu trực tiếp vào máy.' },
      { title: 'Tùy Biến Cài Đặt Quyền Riêng Tư 1-Chạm', desc: 'Chủ động bật/tắt hiển thị số điện thoại cá nhân, email hoặc địa chỉ theo nhu cầu bảo mật thông tin.' }
    ],
    SYS
  );

  // SLIDE 10: Chức Năng 6 - Quét Mã QR Ngoài & Trang Xác Thực Công Khai (MỚI BỔ SUNG)
  addAppMobileFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG HỘI VIÊN 06', title: 'Quét Mã QR Từ Ứng Dụng Ngoài & Trang Xác Thực Công Khai', subtitle: 'Đối tác quét bằng Zalo / Camera iPhone không cần cài app vẫn hiển thị hồ sơ thẩm định 100%' },
    'app_public_qr_scan_view.png',
    'Trang xác thực công khai khi quét QR ngoài',
    [
      { title: 'Quét Nhanh Bằng Zalo Hoặc Camera Ngoài', desc: 'Không bắt buộc cài đặt ứng dụng: Mọi camera điện thoại hoặc Zalo đều đọc được mã định danh.' },
      { title: 'Trang Web Xác Thực Công Khai Thẻ Visit Card Sang Trọng', desc: 'Mở giao diện web công khai chuẩn mực với thẻ Visit Card Luxury, ảnh đại diện, chức danh và dấu mộc CLB.' },
      { title: 'Tích Xanh Verified & Dấu Mộc CLB CEO 1983', desc: 'Chứng thực tư cách thành viên chính thức được kiểm định bởi Hội Doanh Nhân Trẻ Hà Nội (HanoiBA).' },
      { title: 'Phím Gọi Điện, Nhắn Zalo & Lưu Danh Bạ vCard', desc: 'Đối tác chỉ cần bấm một nút là lưu thẳng liên hệ vào danh bạ điện thoại hoặc gọi điện trao đổi ngay.' }
    ],
    SYS
  );

  // SLIDE 11: Chức Năng 7 - Hồ Sơ Năng Lực Doanh Nhân
  addAppMobileFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG HỘI VIÊN 07', title: 'Hồ Sơ Năng Lực Doanh Nhân 360° & Pháp Nhân Doanh Nghiệp', subtitle: 'Khẳng định uy tín thương hiệu cá nhân và năng lực công ty trong mạng lưới' },
    'app_step_06_profile_view.png',
    'Hồ sơ năng lực 360°',
    [
      { title: 'Thông Tin Pháp Nhân Doanh Nghiệp Đầy Đủ', desc: 'Hiển thị tên công ty, mã số thuế, địa chỉ trụ sở chính, website và lĩnh vực hoạt động.' },
      { title: 'Tùy Biến Ảnh Đại Diện & Ảnh Bìa Công Ty', desc: 'Dễ dàng tải lên hình ảnh nhận diện thương hiệu doanh nghiệp sắc nét và chuyên nghiệp.' },
      { title: 'Đính Kèm Hồ Sơ Năng Lực & Brochure PDF', desc: 'Hỗ trợ đính kèm tài liệu giới thiệu sản phẩm để các đối tác tiềm năng tải về nghiên cứu.' },
      { title: 'Ghi Nhận Đóng Góp & Danh Hiệu Khen Thưởng', desc: 'Lưu trữ các kỷ niệm chương, giải thưởng doanh nhân tiêu biểu đã được hiệp hội vinh danh.' }
    ],
    SYS
  );

  // SLIDE 12: Chức Năng 8 - Danh Bạ Hội Viên B2B
  addAppMobileFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG HỘI VIÊN 08', title: 'Danh Bạ Hội Viên CLB CEO 1983 & Tra Cứu Đối Tác Giao Thương', subtitle: 'Kết nối trực tiếp hơn 100+ Chủ tịch và Tổng Giám Đốc sinh năm 1983' },
    'app_step_07_members_directory.png',
    'Danh bạ hội viên',
    [
      { title: 'Mạng Lưới Lãnh Đạo Đồng Niên 1983', desc: 'Cộng đồng các nhà sáng lập cùng thế hệ, thấu hiểu tư duy và chia sẻ chung khát vọng phát triển.' },
      { title: 'Bộ Lọc Đa Chiều Theo Ngành Nghề', desc: 'Tìm kiếm đối tác theo lĩnh vực: Xây dựng, Công nghệ, Y tế, Nông nghiệp, Tài chính, Bất động sản.' },
      { title: 'Hồ Sơ Năng Lực Doanh Nghiệp 360°', desc: 'Xem quy mô công ty, mã số thuế, website và các sản phẩm dịch vụ chủ lực của thành viên.' },
      { title: 'Gửi Lời Mời Kết Nối Giao Thương 2 Chiều', desc: 'Thiết lập mối quan hệ đối tác bền vững chỉ bằng nút Kết nối trên ứng dụng.' }
    ],
    SYS
  );

  // SLIDE 13: Chức Năng 9 - Chi Tiết Đối Tác
  addAppMobileFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG HỘI VIÊN 09', title: 'Xem Chi Tiết Hồ Sơ Năng Lực Đối Tác & Kết Nối Hợp Tác', subtitle: 'Nắm bắt trọn vẹn thông tin đối tác trước khi tiến hành đàm phán kinh doanh' },
    'app_step_08_member_profile_modal.png',
    'Chi tiết đối tác',
    [
      { title: 'Xem Đầy Đủ Thông Tin Liên Lạc', desc: 'Tra cứu nhanh số điện thoại di động, hòm thư điện tử, địa chỉ văn phòng của chủ doanh nghiệp.' },
      { title: 'Mở Phòng Chat Giao Thương Trực Tiếp', desc: 'Bấm Nhắn tin: Mở ngay cuộc trò chuyện 1-on-1 với đối tác để trao đổi nhu cầu hợp tác.' },
      { title: 'Tra Cứu Danh Mục Sản Phẩm Cung Cấp', desc: 'Xem toàn bộ các mặt hàng và dịch vụ mà công ty đối tác đang niêm yết trên Marketplace.' },
      { title: 'Lưu Thông Tin Vào Danh Bạ Điện Thoại', desc: 'Tải file danh thiếp vCard lưu thẳng vào danh bạ iPhone/Android chỉ với một cú nhấp chuột.' }
    ],
    SYS
  );

  // SLIDE 14: Chức Năng 10 - Hộp Thư & Chat 1-on-1
  addAppMobileFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG HỘI VIÊN 10', title: 'Hộp Thư Doanh Nghiệp & Nhắn Tin Chat 1-on-1 Realtime', subtitle: 'Trao đổi cơ hội hợp tác, gửi tài liệu báo giá và đàm phán hợp đồng trực tiếp' },
    'app_step_10_chat_conversation.png',
    'Màn hình chat 1-on-1',
    [
      { title: 'Trò Chuyện Trực Tiếp Thời Gian Thực', desc: 'Nhắn tin văn bản tốc độ cao giữa hai lãnh đạo doanh nghiệp, không qua bất kỳ trung gian nào.' },
      { title: 'Gửi Tài Liệu, Hợp Đồng & Catalog PDF', desc: 'Đính kèm hình ảnh sản phẩm và tài liệu năng lực công ty trực tiếp trong luồng hội thoại.' },
      { title: 'Chia Sẻ Vị Trí Điểm Hẹn Gặp Gỡ', desc: 'Gửi tọa độ định vị quán cafe hoặc văn phòng doanh nghiệp để hẹn lịch làm việc trực tiếp.' },
      { title: 'Bảo Mật Nội Dung Trò Chuyện Tuyệt Đối', desc: 'Hội thoại được mã hóa trên đường truyền, bảo vệ bí mật kinh doanh của các bên tham gia.' }
    ],
    SYS
  );

  // SLIDE 15: Chức Năng 11 - Sự Kiện & Đăng Ký Vé
  addAppMobileFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG HỘI VIÊN 11', title: 'Lịch Sự Kiện, Diễn Đàn Doanh Nhân & Đăng Ký Vé Tham Dự', subtitle: 'Không bỏ lỡ các kỳ Đại hội, Caravan kết nối kinh doanh và Gala thường niên' },
    'app_step_11_events_list.png',
    'Lịch sự kiện',
    [
      { title: 'Lịch Trình Chi Tiết Các Hoạt Động CLB', desc: 'Nắm bắt thời gian, địa điểm tổ chức, nội dung chương trình và diễn giả của từng sự kiện.' },
      { title: 'Đặc Quyền Vé Miễn Phí Dành Cho Hội Viên', desc: 'Hội viên chính thức được miễn phí vé tham dự hoặc nhận mức giá ưu đãi đặc biệt.' },
      { title: 'Thanh Toán Vé Đại Biểu Qua VietQR', desc: 'Đối với vé có thu phí, hệ thống cung cấp mã QR chuyển khoản chính xác tới từng đồng.' },
      { title: 'Đồng Bộ Lịch Hẹn Vào Google / Apple Calendar', desc: 'Tự động thêm sự kiện vào lịch cá nhân trên điện thoại kèm nhắc nhở trước 24 giờ.' }
    ],
    SYS
  );

  // SLIDE 16: Chức Năng 12 - Vé Điện Tử QR Check-in
  addAppMobileFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG HỘI VIÊN 12', title: 'Vé Điện Tử Thông Minh & Quét Mã QR Check-in Siêu Tốc 1s', subtitle: 'Không lo quên vé giấy, kiểm soát lối vào hội trường chỉ với 1 thao tác quét' },
    'app_step_13_ticket_qr_pass.png',
    'Vé điện tử QR Pass',
    [
      { title: 'Tích Hợp Mã QR Động Chống Gian Lận', desc: 'Mã QR được mã hóa theo phiên làm việc, ngăn chặn triệt để hành vi chụp ảnh màn hình chuyển tiếp.' },
      { title: 'Hiển Thị Vị Trí Số Ghế Bàn Tiệc VIP', desc: 'Biết trước chính xác số bàn và vị trí ghế ngồi được Ban Tổ Chức sắp đặt trang trọng.' },
      { title: 'Tốc Độ Quét Cổng Chỉ 1 Giây', desc: 'Đưa màn hình trước máy quét tại bàn lễ tân để hoàn tất thủ tục check-in trong tích tắc.' },
      { title: 'Lưu Trữ Lịch Sử Tham Dự Sự Kiện', desc: 'Xem lại toàn bộ các kỳ đại hội và sự kiện mà doanh nhân đã đồng hành cùng hiệp hội.' }
    ],
    SYS
  );

  // SLIDE 17: Chức Năng 13 - Bầu Cử & Biểu Quyết Đại Biểu Trên Mobile (MỚI BỔ SUNG)
  addAppMobileFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG HỘI VIÊN 13', title: 'Bầu Cử BCH & Biểu Quyết Tín Nhiệm Trực Tuyến Trên App', subtitle: 'Thực thi quyền dân chủ đại hội minh bạch, bảo mật tuyệt đối với giao diện trực quan' },
    'app_voting_mobile_view.png',
    'Giao diện bầu cử tín nhiệm trên Mobile App',
    [
      { title: 'Bỏ Phiếu Tín Nhiệm Đại Biểu Trực Tiếp', desc: 'Bầu cử Ban Chấp Hành nhiệm kỳ mới ngay trên màn hình điện thoại với danh sách ứng viên minh bạch.' },
      { title: 'Mã Hóa Phiếu Bầu Chống Gian Lận', desc: 'Mỗi hội viên chỉ được bỏ phiếu một lần duy nhất, kết quả được mã hóa bảo mật danh tính người bầu.' },
      { title: 'Xem Chi Tiết Hồ Sơ & Chương Trình Hành Động', desc: 'Chạm vào tên ứng viên để xem quá trình cống hiến, doanh nghiệp và cam kết hành động trước khi vote.' },
      { title: 'Cập Nhật Tiến Độ Kiểm Phiếu Tức Thì', desc: 'Theo dõi tỷ lệ phần trăm cử tri đã tham gia bỏ phiếu theo thời gian thực trên màn hình ứng dụng.' }
    ],
    SYS
  );

  // SLIDE 18: Chức Năng 14 - Vòng Quay May Mắn (Lucky Draw) Đêm Gala (MỚI BỔ SUNG)
  addAppMobileFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG HỘI VIÊN 14', title: 'Vòng Quay May Mắn Lucky Draw & Nhận Quà Tức Thì', subtitle: 'Khuấy động không khí Gala Dinner: Quay số ngẫu nhiên theo mã vé may mắn của hội viên' },
    'crm_lucky_draw_modal.png',
    'Vòng quay Lucky Draw đêm tiệc Gala',
    [
      { title: 'Quay Số May Mắn Theo Mã Vé Check-in', desc: 'Toàn bộ hội viên đã check-in vào sự kiện được tự động đưa vào danh sách quay số trúng thưởng.' },
      { title: 'Giải Thưởng Đỉnh Cao VinFast VF3', desc: 'Hồi hộp theo dõi các vòng quay giải Đặc biệt, giải Nhất với quà tặng giá trị cao từ nhà tài trợ.' },
      { title: 'Hiển Thị Thông Báo Trúng Thưởng Trên Màn Hình', desc: 'Hệ thống chúc mừng đích danh hội viên trúng giải (VD: Ngô Bảo Anh - Mã vé #2190).' },
      { title: 'Nhận Thông Báo Push Điện Thoại Trong Tích Tắc', desc: 'Máy rung và hiển thị thông báo trúng giải ngay trong túi áo để doanh nhân lên sân khấu nhận quà.' }
    ],
    SYS
  );

  // SLIDE 19: Chức Năng 15 - Sàn Thương Mại Marketplace
  addAppMobileFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG HỘI VIÊN 15', title: 'Sàn Thương Mại Marketplace & Gian Hàng Doanh Nghiệp', subtitle: 'Kênh giới thiệu sản phẩm và dịch vụ uy tín với chính sách ưu đãi nội bộ' },
    'app_step_15_marketplace_grid.png',
    'Sàn Marketplace',
    [
      { title: 'Gian Hàng Số Hóa Cho Từng Doanh Nghiệp', desc: 'Mỗi doanh nghiệp hội viên được sở hữu gian hàng trưng bày sản phẩm sản xuất và dịch vụ chủ lực.' },
      { title: 'Chính Sách Chiết Khấu Ưu Đãi VIP', desc: 'Cam kết mức giá ưu đãi đặc quyền giữa các thành viên CEO 1983 so với giá thị trường bên ngoài.' },
      { title: 'Đã Kiểm Duyệt An Toàn Từ Web CRM', desc: 'Toàn bộ mặt hàng đều qua thẩm định xuất xứ và tiêu chuẩn chất lượng từ Ban Quản Trị CLB.' },
      { title: 'Yêu Cầu Báo Giá Sỉ & Hợp Đồng 1-Chạm', desc: 'Doanh nhân gửi yêu cầu báo giá khối lượng lớn trực tiếp tới giám đốc kinh doanh đối tác.' }
    ],
    SYS
  );

  // SLIDE 20: Chức Năng 16 - Trao Cơ Hội Giao Thương B2B
  addAppMobileFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG HỘI VIÊN 16', title: 'Sàn Trao Cơ Hội Giao Thương B2B & Tìm Kiếm Đối Tác', subtitle: 'Chia sẻ nhu cầu mua sỉ, bán buôn, cung ứng vật tư và kêu gọi vốn đầu tư' },
    'app_step_18_opportunities_feed.png',
    'Cơ hội giao thương B2B',
    [
      { title: 'Bảng Tin Trao Đổi Cơ Hội Độc Quyền', desc: 'Nơi doanh nhân công khai nhu cầu mua sắm thiết bị, tìm đại lý phân phối hoặc kết nối chuỗi cung ứng.' },
      { title: 'Khu Vực Cơ Hội Tiêu Điểm Xoay Vòng 2s', desc: 'Hiệu ứng chuyển đổi cơ hội nổi bật mỗi 2 giây thu hút sự chú ý tối đa của toàn thể hội viên.' },
      { title: 'Đón Nhận Cơ Hội (Claim Deal) Nhanh Chóng', desc: 'Nhấn Đón nhận cơ hội để nhận thông tin liên lạc trực tiếp của doanh nhân có nhu cầu.' },
      { title: 'Thống Kê Tổng Giá Trị Giao Thương Đạt Được', desc: 'Ghi nhận thành quả kết nối, vinh danh các doanh nhân tích cực trao cơ hội cho đồng đội.' }
    ],
    SYS
  );

  // SLIDE 21: Chức Năng 17 - Đóng Hội Phí VietQR
  addAppMobileFeatureSlide(
    pres,
    { eyebrow: 'CHỨC NĂNG HỘI VIÊN 17', title: 'Cổng Đóng Hội Phí Thường Niên & Quét Mã VietQR Tự Động', subtitle: 'Gia hạn thẻ hội viên trong 30 giây, đối soát tự động không cần gửi hóa đơn' },
    'app_step_20_annual_fee_renewal.png',
    'Đóng hội phí VietQR',
    [
      { title: 'Minh Bạch Niên Độ & Hạn Nộp Hội Phí', desc: 'Thông báo rõ ràng số tiền niên liễm, thời hạn gia hạn và quyền lợi duy trì sinh hoạt trong năm.' },
      { title: 'Mã QR Động Chính Xác Tuyệt Đối', desc: 'Mã VietQR tự động điền số tiền và cú pháp chuyển khoản chính xác tới từng ký tự.' },
      { title: 'Gạch Nợ Tự Động Sau 3-5 Giây', desc: 'Ngay khi chuyển khoản thành công, hệ thống tự động gạch nợ và gia hạn hạn dùng thẻ số trên App.' },
      { title: 'Nhận Phiếu Thu Điện Tử Về Hòm Thư', desc: 'Biên lai xác nhận đóng hội phí có chữ ký số được gửi tự động về email doanh nghiệp lưu trữ.' }
    ],
    SYS
  );

  // SLIDE 22: Ưu Điểm Vượt Trội Của App Hiệp Hội
  {
    const slide = pres.addSlide();
    addAppSlideHeader(slide, pres, 'ƯU ĐIỂM VƯỢT TRỘI', 'Giá Trị Thiết Thực & Đẳng Cấp Cho Doanh Nhân Hội Viên', 'Nâng tầm trải nghiệm cá nhân và tối ưu hóa cơ hội kinh doanh');

    const advs = [
      {
        num: '01',
        title: 'Networking Đỉnh Cao 1-Chạm',
        desc: 'Không cần mang theo tập danh thiếp giấy. Chỉ cần chạm điện thoại NFC hoặc mở mã QR là trao trọn vẹn thông tin liên hệ và hồ sơ công ty cho đối tác.'
      },
      {
        num: '02',
        title: 'Thúc Đẩy Doanh Thu B2B Thực Chất',
        desc: 'Sở hữu ngay gian hàng trưng bày sản phẩm ưu đãi nội khối và tiếp cận trực tiếp các nhu cầu mua sắm lớn từ hơn 100 doanh nghiệp thành viên.'
      },
      {
        num: '03',
        title: 'Trải Nghiệm Sự Kiện Không Chờ Đợi',
        desc: 'Nhận vé mời điện tử, biết trước số bàn tiệc VIP và quét mã qua cổng soát vé chỉ trong 1 giây, tạo ấn tượng sang trọng và chỉn chu.'
      },
      {
        num: '04',
        title: 'Tiện Ích Đa Nền Tảng Mượt Mà',
        desc: 'Vận hành hoàn hảo trên cả iPhone, điện thoại Android và trình duyệt Web PWA, cập nhật tính năng mới tự động mà không cần tải lại file cài đặt.'
      }
    ];

    advs.forEach((a, idx) => {
      const xPos = 0.8 + idx * 2.95;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 4.6,
        fill: { color: APP_THEME.BG_WHITE },
        line: { color: APP_THEME.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 0.08,
        fill: { color: APP_THEME.NAVY_PRIMARY }
      });
      slide.addText(a.num, { x: xPos + 0.25, y: 2.35, w: 0.8, h: 0.4, color: APP_THEME.GOLD_ACCENT, bold: true, fontSize: 22, fontFace: 'Calibri' });
      slide.addText(a.title, { x: xPos + 0.25, y: 2.85, w: 2.3, h: 0.65, color: APP_THEME.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(a.desc, { x: xPos + 0.25, y: 3.6, w: 2.3, h: 2.9, color: APP_THEME.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addAppSlideFooter(slide, pres, SYS);
  }

  // SLIDE 23: Hướng Phát Triển Tương Lai Ứng Dụng Di Động
  {
    const slide = pres.addSlide();
    addAppSlideHeader(slide, pres, 'HƯỚNG PHÁT TRIỂN TƯƠNG LAI', 'Lộ Trình Nâng Cấp Ứng Dụng Di Động Hội Viên 2026 - 2028', 'Liên tục đổi mới công nghệ nhằm mang lại giá trị gia tăng tối đa cho hội viên');

    const roadmaps = [
      {
        phase: 'GIAI ĐOẠN 1 (ĐÃ HOÀN THÀNH)',
        title: 'Phát Hành Bản Đầy Đủ Đa Nền Tảng',
        desc: 'Hoàn thiện bản cài Android APK, iOS TestFlight và Web PWA với đầy đủ tính năng: Thẻ VIP, chạm NFC, vé QR check-in và sàn giao dịch B2B.'
      },
      {
        phase: 'GIAI ĐOẠN 2 (QUÝ 3 - QUÝ 4/2026)',
        title: 'Tích Hợp AI Gợi Ý Kết Nối Kinh Doanh',
        desc: 'AI phân tích nhu cầu tìm kiếm để tự động thông báo đối tác phù hợp nhất; Tích hợp ví Voucher điện tử ưu đãi dịch vụ giữa các doanh nghiệp hội viên.'
      },
      {
        phase: 'GIAI ĐOẠN 3 (NĂM 2027)',
        title: 'Hệ Thống Đào Tạo Trực Tuyến & Podcast',
        desc: 'Kho bài giảng quản trị doanh nghiệp độc quyền, phát thanh chuỗi Podcast chia sẻ kinh nghiệm kinh doanh của các Chủ tịch tiêu biểu trong CLB.'
      },
      {
        phase: 'GIAI ĐOẠN 4 (NĂM 2028)',
        title: 'Mạng Lưới Giao Thương Đa Ngôn Ngữ',
        desc: 'Bổ sung giao diện tiếng Anh và kết nối sàn thương mại điện tử liên kết với các hiệp hội doanh nhân trẻ quốc tế trong khu vực ASEAN.'
      }
    ];

    roadmaps.forEach((r, idx) => {
      const xPos = 0.8 + idx * 2.95;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 4.6,
        fill: { color: APP_THEME.BG_WHITE },
        line: { color: APP_THEME.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 2.1, w: 2.8, h: 0.08,
        fill: { color: APP_THEME.NAVY_PRIMARY }
      });
      slide.addShape(pres.ShapeType.rect, {
        x: xPos + 0.25, y: 2.35, w: 2.3, h: 0.32,
        fill: { color: APP_THEME.BLUE_LIGHT }, roundRadio: 0.06
      });
      slide.addText(r.phase, {
        x: xPos + 0.25, y: 2.35, w: 2.3, h: 0.32,
        color: APP_THEME.NAVY_PRIMARY, bold: true, fontSize: 8.5, align: 'center', valign: 'middle', fontFace: 'Calibri'
      });
      slide.addText(r.title, { x: xPos + 0.25, y: 2.85, w: 2.3, h: 0.65, color: APP_THEME.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(r.desc, { x: xPos + 0.25, y: 3.6, w: 2.3, h: 2.9, color: APP_THEME.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addAppSlideFooter(slide, pres, SYS);
  }

  // SLIDE 24: Tổng Kết & Cam Kết Đồng Hành (Nền Trắng Sáng, Xanh Navy, Điểm Xuyết Vàng 5%)
  {
    const slide = pres.addSlide();
    slide.background = { color: APP_THEME.BG_WHITE };
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: APP_THEME.NAVY_PRIMARY } });
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0.08, w: 13.33, h: 0.03, fill: { color: APP_THEME.GOLD_ACCENT } });

    slide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 1.0, w: 5.2, h: 0.4,
      fill: { color: APP_THEME.NAVY_PRIMARY }, line: { color: APP_THEME.GOLD_ACCENT, width: 1.5 }, roundRadio: 0.08
    });
    slide.addText('ĐỒNG HÀNH CÙNG THÀNH CÔNG CỦA DOANH NHÂN', {
      x: 0.8, y: 1.0, w: 5.2, h: 0.4,
      color: APP_THEME.BG_WHITE, bold: true, fontSize: 11, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });

    slide.addText('TỔNG KẾT & KHẲNG ĐỊNH ĐẲNG CẤP HỘI VIÊN', {
      x: 0.8, y: 1.6, w: 11.73, h: 0.9,
      color: APP_THEME.NAVY_PRIMARY, bold: true, fontSize: 32, fontFace: 'Calibri'
    });
    slide.addText('Gắn kết chân tình · Hợp tác tin cậy · Phát triển thịnh vượng cùng cộng đồng CEO 1983', {
      x: 0.8, y: 2.55, w: 11.73, h: 0.5,
      color: APP_THEME.NAVY_PRIMARY, bold: true, fontSize: 16, italic: true, fontFace: 'Calibri'
    });

    const values = [
      { t: 'Định Vị Thương Hiệu Đẳng Cấp', d: 'Mỗi hội viên sở hữu một tấm danh thiếp số độc bản và quyền tiếp cận hệ sinh thái kinh doanh chất lượng cao.' },
      { t: 'Cơ Hội Kinh Doanh Không Giới Hạn', d: 'Mạng lưới nội bộ vững chắc giúp doanh nghiệp mở rộng thị trường, tối ưu chi phí và tăng trưởng doanh thu.' },
      { t: 'Tiên Phong Chuyển Đổi Số', d: 'Tự hào là những nhà lãnh đạo thế hệ 1983 tiên phong ứng dụng công nghệ hiện đại vào quản trị và kết nối.' }
    ];

    values.forEach((v, idx) => {
      const xPos = 0.8 + idx * 4.0;
      slide.addShape(pres.ShapeType.rect, {
        x: xPos, y: 3.4, w: 3.7, h: 3.0,
        fill: { color: APP_THEME.BG_WHITE },
        line: { color: APP_THEME.BORDER_SUBTLE, width: 1.2 },
        roundRadio: 0.12
      });
      // Vạch nhấn vàng kim 5%
      slide.addShape(pres.ShapeType.rect, {
        x: xPos + 0.3, y: 3.55, w: 0.4, h: 0.04, fill: { color: APP_THEME.GOLD_ACCENT }
      });
      slide.addText(`✓  ${v.t}`, {
        x: xPos + 0.3, y: 3.7, w: 3.1, h: 0.6,
        color: APP_THEME.NAVY_PRIMARY, bold: true, fontSize: 14, fontFace: 'Calibri'
      });
      slide.addText(v.d, {
        x: xPos + 0.3, y: 4.4, w: 3.1, h: 1.7,
        color: APP_THEME.TEXT_BODY, fontSize: 11.5, fontFace: 'Calibri'
      });
    });

    slide.addText('Ứng Dụng Di Động Hội Viên · CLB Doanh Nhân CEO 1983 · Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)', {
      x: 0.8, y: 6.75, w: 11.73, h: 0.3, color: APP_THEME.TEXT_MUTED, fontSize: 11, align: 'center', fontFace: 'Calibri'
    });
  }

  // SLIDE 26: TRANG KẾT THÚC & CẢM ƠN (DEDICATED CLOSING / THANK YOU SLIDE)
  {
    const slide = pres.addSlide();
    slide.background = { color: APP_THEME.BG_WHITE };
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 11.33, h: 0.15, fill: { color: APP_THEME.NAVY_PRIMARY } });
    slide.addShape(pres.ShapeType.rect, { x: 11.33, y: 0, w: 2.0, h: 0.15, fill: { color: APP_THEME.GOLD_ACCENT } });

    // Huy hiệu trên
    slide.addShape(pres.ShapeType.rect, {
      x: 2.5, y: 0.9, w: 8.33, h: 0.45,
      fill: { color: APP_THEME.NAVY_PRIMARY }, line: { color: APP_THEME.GOLD_ACCENT, width: 1.5 }, roundRadio: 0.08
    });
    slide.addText('HỆ SINH THÁI SỐ HÓA DOANH NHÂN CEO 1983', {
      x: 2.5, y: 0.9, w: 8.33, h: 0.45,
      color: APP_THEME.BG_WHITE, bold: true, fontSize: 12, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });

    // Đại tựa đề: XIN TRÂN TRỌNG CẢM ƠN!
    slide.addText('XIN TRÂN TRỌNG CẢM ƠN!', {
      x: 1.0, y: 1.55, w: 11.33, h: 0.9,
      color: APP_THEME.NAVY_PRIMARY, bold: true, fontSize: 40, align: 'center', fontFace: 'Calibri'
    });

    slide.addText('ĐỒNG HÀNH CÙNG SỰ PHÁT TRIỂN VỮNG MẠNH VÀ THÀNH CÔNG CỦA QUÝ HỘI VIÊN!', {
      x: 1.0, y: 2.5, w: 11.33, h: 0.45,
      color: APP_THEME.NAVY_PRIMARY, bold: true, fontSize: 15.5, align: 'center', fontFace: 'Calibri'
    });

    slide.addText('"TIÊN PHONG CHUYỂN ĐỔI SỐ  ·  GẮN KẾT VƯƠN XA"', {
      x: 1.0, y: 3.0, w: 11.33, h: 0.4,
      color: APP_THEME.GOLD_ACCENT, bold: true, fontSize: 13.5, italic: true, align: 'center', fontFace: 'Calibri'
    });

    // 3 Khối hỗ trợ, cài đặt và hỏi đáp
    const closingCards = [
      {
        icon: '📱',
        title: 'CÀI ĐẶT ỨNG DỤNG NGAY',
        sub: 'Hỗ trợ iOS PWA & Android',
        detail: 'Cài đặt trực tiếp lên màn hình chính điện thoại, không cần tải lại, tự động đồng bộ mọi quyền lợi và vé sự kiện.'
      },
      {
        icon: '💬',
        title: 'HỎI ĐÁP & CHIA SẺ (Q&A)',
        sub: 'Lắng nghe phản hồi từ hội viên',
        detail: 'Mọi ý kiến đóng góp của Quý Doanh nhân là động lực để Ban Thư Ký liên tục nâng cấp và tối ưu hóa trải nghiệm.'
      },
      {
        icon: '🤝',
        title: 'KẾT NỐI BAN THƯ KÝ',
        sub: 'Hỗ trợ kỹ thuật thẻ 24/7',
        detail: 'Hỗ trợ cấp lại mã hội viên M1983-xxx, cài đặt thẻ visit card, chia sẻ danh bạ và tham gia 7 Ban ngành chuyên trách.'
      }
    ];

    closingCards.forEach((c, idx) => {
      const x = 1.0 + idx * 3.9;
      slide.addShape(pres.ShapeType.rect, {
        x, y: 3.65, w: 3.6, h: 2.8,
        fill: { color: APP_THEME.BG_WHITE }, line: { color: APP_THEME.BORDER_SUBTLE, width: 1.5 }, roundRadio: 0.12
      });
      // Vạch vàng 5%
      slide.addShape(pres.ShapeType.rect, {
        x: x + 1.6, y: 3.65, w: 0.4, h: 0.04, fill: { color: APP_THEME.GOLD_ACCENT }
      });
      slide.addText(c.icon, { x, y: 3.85, w: 3.6, h: 0.5, align: 'center', fontSize: 26, fontFace: 'Calibri' });
      slide.addText(c.title, { x: x + 0.15, y: 4.45, w: 3.3, h: 0.4, color: APP_THEME.NAVY_PRIMARY, bold: true, fontSize: 12.5, align: 'center', fontFace: 'Calibri' });
      slide.addText(c.sub, { x: x + 0.15, y: 4.85, w: 3.3, h: 0.35, color: APP_THEME.GOLD_ACCENT, bold: true, fontSize: 10.5, align: 'center', fontFace: 'Calibri' });
      slide.addText(c.detail, { x: x + 0.2, y: 5.25, w: 3.2, h: 1.05, color: APP_THEME.TEXT_BODY, fontSize: 10.5, align: 'center', fontFace: 'Calibri' });
    });

    slide.addText('Ứng Dụng Di Động Hội Viên · CLB Doanh Nhân CEO 1983 · Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)', {
      x: 1.0, y: 6.85, w: 11.33, h: 0.3, color: APP_THEME.TEXT_MUTED, fontSize: 10.5, align: 'center', fontFace: 'Calibri'
    });
  }

  const outPptx = path.join(OUT_DIR, 'SLIDE_THUYET_TRINH_APP_HIEP_HOI_CEO1983.pptx');
  let actualTarget = outPptx;
  try {
    await pres.writeFile({ fileName: outPptx });
  } catch (err) {
    if (err.code === 'EBUSY') {
      actualTarget = path.join(OUT_DIR, 'SLIDE_THUYET_TRINH_APP_HIEP_HOI_CEO1983_MOI.pptx');
      await pres.writeFile({ fileName: actualTarget });
      console.warn(`[WARN] File SLIDE_THUYET_TRINH_APP_HIEP_HOI_CEO1983.pptx đang mở trong PowerPoint. Đã xuất bản sao mới tại: ${actualTarget}`);
    } else {
      throw err;
    }
  }
  try {
    fs.copyFileSync(actualTarget, path.join(FE_DOCS_DIR, 'SLIDE_THUYET_TRINH_APP_HIEP_HOI_CEO1983.pptx'));
  } catch (e) {
    if (e.code === 'EBUSY') {
      fs.copyFileSync(actualTarget, path.join(FE_DOCS_DIR, 'SLIDE_THUYET_TRINH_APP_HIEP_HOI_CEO1983_MOI.pptx'));
    }
  }
  console.log(`✓ Đã tạo PPTX App thành công: ${actualTarget} (${(fs.statSync(actualTarget).size / 1024).toFixed(1)} KB)`);
}

// =============================================================================
// 3. GENERATE HTML SLIDES (ZERO URL, PHONG CÁCH CHUẨN MÀU THEO YÊU CẦU)
// =============================================================================
function generateHtmlSlides() {
  console.log('>>> Bắt đầu tạo Slide Trình Chiếu HTML tương tác (Zero URL)...');

  function renderDeckHtml(title, sysLabel, slidesData, isApp = false) {
    const slidesHtml = slidesData.map((s, idx) => {
      let contentHtml = '';
      if (s.type === 'title_cover') {
        contentHtml = `
          <div class="title-cover-container">
            <div class="title-cover-badge">${s.org}</div>
            <h1 class="title-cover-grand">${s.title}</h1>
            <div class="title-cover-divider"></div>
            <p class="title-cover-subtitle">${s.subtitle}</p>
            <div class="title-cover-tagline">${s.tagline}</div>
            <div class="title-cover-meta-box">
              <div class="meta-item"><span class="meta-lbl">Đơn Vị Chủ Quản:</span> ${s.presenter}</div>
              <div class="meta-row-2">
                <div class="meta-item"><span class="meta-lbl">Chuyên Viên:</span> ${s.author}</div>
                <div class="meta-item"><span class="meta-lbl">Phiên Bản:</span> ${s.version}</div>
                <div class="meta-item"><span class="meta-lbl">Thời Gian:</span> ${s.date}</div>
              </div>
            </div>
            <div class="title-cover-foot">${s.footer}</div>
          </div>
        `;
      } else if (s.type === 'thank_you') {
        contentHtml = `
          <div class="thankyou-container">
            <div class="thankyou-badge">${s.badge}</div>
            <h1 class="thankyou-grand">${s.title}</h1>
            <p class="thankyou-subtitle">${s.subtitle}</p>
            <div class="thankyou-slogan">${s.slogan}</div>
            <div class="thankyou-grid">
              ${s.cards.map(c => `
                <div class="thankyou-card">
                  <div class="thankyou-icon">${c.icon}</div>
                  <div class="thankyou-card-title">${c.title}</div>
                  <div class="thankyou-card-sub">${c.sub}</div>
                  <div class="thankyou-card-desc">${c.desc}</div>
                </div>
              `).join('')}
            </div>
            <div class="thankyou-foot">${sysLabel} · CLB Doanh Nhân CEO 1983 · Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)</div>
          </div>
        `;
      } else if (s.type === 'cover') {
        contentHtml = `
          <div class="cover-container">
            <div class="cover-badge">${s.eyebrow}</div>
            <h1 class="cover-title">${s.title}</h1>
            <p class="cover-subtitle">${s.subtitle}</p>
            <div class="pillars-grid">
              ${s.pillars.map(p => `
                <div class="pillar-card">
                  <div class="pillar-num">${p.num}</div>
                  <div class="pillar-title">${p.title}</div>
                  <div class="pillar-desc">${p.desc}</div>
                </div>
              `).join('')}
            </div>
            <div class="cover-footer">Bản Quyền © 2026 CLB Doanh Nhân CEO 1983 · Trực thuộc Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)</div>
          </div>
        `;
      } else if (s.type === 'grid_cards') {
        contentHtml = `
          <div class="slide-header">
            <div class="eyebrow-pill ${s.badgeColor || ''}">${s.eyebrow}</div>
            <h2 class="slide-title">${s.title}</h2>
            <p class="slide-subtitle">${s.subtitle || ''}</p>
          </div>
          <div class="cards-grid-4">
            ${s.items.map((item, i) => `
              <div class="adv-card ${s.cardTheme || ''}">
                ${item.num ? `<div class="card-num ${s.numColor || ''}">${item.num}</div>` : ''}
                ${item.icon ? `<div class="card-icon">${item.icon}</div>` : ''}
                ${item.badge ? `<div class="card-badge">${item.badge}</div>` : ''}
                <div class="card-title">${item.title}</div>
                <div class="card-desc">${item.desc}</div>
              </div>
            `).join('')}
          </div>
        `;
      } else if (s.type === 'feature') {
        const imgData = getRawBase64(s.imgFilename);
        const imgBlock = isApp ? `
          <div class="mobile-frame-container">
            <div class="mobile-device">
              <div class="mobile-speaker"></div>
              <img src="${imgData}" alt="${s.title}" class="mobile-screen-img" />
            </div>
          </div>
        ` : `
          <div class="desktop-frame-container">
            <div class="desktop-screen-box">
              <img src="${imgData}" alt="${s.title}" class="desktop-screen-img" />
            </div>
            <div class="desktop-badge">${s.badgeText}</div>
          </div>
        `;

        contentHtml = `
          <div class="slide-header">
            <div class="eyebrow-pill">${s.eyebrow}</div>
            <h2 class="slide-title">${s.title}</h2>
            <p class="slide-subtitle">${s.subtitle}</p>
          </div>
          <div class="feature-layout ${isApp ? 'mobile-layout' : 'desktop-layout'}">
            <div class="left-col">
              ${imgBlock}
            </div>
            <div class="right-col">
              ${s.features.map((f, i) => `
                <div class="feature-card border-accent-${isApp ? (i % 2 === 0 ? 'navy' : 'gold') : (i % 2 === 0 ? 'navy' : 'cyan')}">
                  <div class="feature-title">${f.title}</div>
                  <div class="feature-desc">${f.desc}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else if (s.type === 'conclusion') {
        contentHtml = `
          <div class="cover-container">
            <div class="cover-badge">${s.eyebrow}</div>
            <h1 class="cover-title">${s.title}</h1>
            <p class="cover-subtitle">${s.subtitle}</p>
            <div class="conclusion-grid">
              ${s.values.map(v => `
                <div class="conclusion-card">
                  <div class="concl-title">✓ ${v.t}</div>
                  <div class="concl-desc">${v.d}</div>
                </div>
              `).join('')}
            </div>
            <div class="cover-footer">${sysLabel} · CLB Doanh Nhân CEO 1983 · Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)</div>
          </div>
        `;
      }

      return `
        <section class="slide ${isApp ? 'theme-app' : 'theme-crm'}" id="slide-${idx}">
          <div class="slide-top-bar"></div>
          ${contentHtml}
          ${s.type !== 'cover' && s.type !== 'conclusion' && s.type !== 'title_cover' && s.type !== 'thank_you' ? `
            <footer class="slide-footer">
              <span class="footer-left">${sysLabel} · CLB Doanh Nhân CEO 1983 · HanoiBA</span>
              <span class="footer-center">Trang ${idx + 1} / ${slidesData.length}</span>
              <span class="footer-right">Hệ Thống Số Hóa Toàn Diện</span>
            </footer>
          ` : ''}
        </section>
      `;
    }).join('\n');

    // CSS TÙY THEO DECK CRM HAY APP
    const themeSpecificCss = isApp ? `
      /* THEME APP HIỆP HỘI: TRẮNG 70%, XANH 25%, VÀNG 5% */
      body { background: #E8EEF5; color: #334155; }
      .slide { background: #FFFFFF; border: 1px solid #E2E8F0; }
      .slide-top-bar {
        position: absolute; top: 0; left: 0; width: 100%; height: 7px;
        background: linear-gradient(90deg, #003B95 0%, #003B95 85%, #F59E0B 85%, #F59E0B 100%);
      }
      .cover-badge {
        display: inline-block; padding: 6px 16px; background: #003B95; border: 1.5px solid #F59E0B;
        color: #FFFFFF; font-size: 12px; font-weight: 700; border-radius: 6px; margin-bottom: 16px; align-self: flex-start;
      }
      .cover-title { font-size: 38px; font-weight: 900; color: #003B95; line-height: 1.2; margin-bottom: 10px; }
      .cover-subtitle { font-size: 16px; color: #003B95; margin-bottom: 32px; font-weight: 600; }
      .pillar-card {
        background: #FFFFFF; border: 1.2px solid #E2E8F0; border-radius: 10px; padding: 20px;
        position: relative; box-shadow: 0 4px 12px rgba(0,0,0,0.03);
      }
      .pillar-card::before { content: ""; position: absolute; top: 0; left: 20px; width: 30px; height: 3px; background: #F59E0B; }
      .pillar-num { font-size: 26px; font-weight: 800; color: #F59E0B; margin-bottom: 8px; }
      .pillar-title { font-size: 15px; font-weight: 700; color: #003B95; margin-bottom: 8px; }
      .pillar-desc { font-size: 11.5px; color: #334155; line-height: 1.5; }
      .eyebrow-pill {
        display: inline-block; padding: 4px 14px; background: #003B95; color: #FFFFFF;
        font-size: 11px; font-weight: 700; text-transform: uppercase; border-radius: 4px; margin-bottom: 8px;
        border-left: 3px solid #F59E0B;
      }
      .slide-title { font-size: 24px; font-weight: 800; color: #003B95; margin-bottom: 4px; }
      .adv-card {
        background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; padding: 24px 18px;
        display: flex; flex-direction: column; position: relative; border-top: 4px solid #003B95;
      }
      .card-num { font-size: 28px; font-weight: 800; color: #F59E0B; margin-bottom: 10px; }
      .card-title { font-size: 16px; font-weight: 700; color: #003B95; margin-bottom: 10px; }
      .card-badge {
        display: inline-block; padding: 3px 8px; background: #EFF6FF; color: #003B95;
        font-size: 10px; font-weight: 700; border-radius: 4px; margin-bottom: 12px; align-self: flex-start;
      }
      .feature-card.border-accent-navy { border-left: 5px solid #003B95; }
      .feature-card.border-accent-gold { border-left: 5px solid #F59E0B; }
      .conclusion-card {
        background: #FFFFFF; border: 1.2px solid #E2E8F0; border-radius: 10px; padding: 30px 24px;
        border-top: 4px solid #003B95; position: relative;
      }
      .conclusion-card::after { content: ""; position: absolute; top: 0; right: 20px; width: 30px; height: 4px; background: #F59E0B; }
      .concl-title { font-size: 17px; font-weight: 700; color: #003B95; margin-bottom: 12px; }
      .concl-desc { font-size: 13.5px; color: #334155; line-height: 1.55; }
      .nav-bar { background: rgba(0, 59, 149, 0.95); border: 1px solid #F59E0B; }
      .nav-btn { background: #FFFFFF; color: #003B95; }
      .nav-btn:hover { background: #F59E0B; color: #FFFFFF; }

      /* Title & Thank You (App: Trắng 70%, Xanh 25%, Vàng 5%) */
      .title-cover-badge { background: #003B95; border: 1.5px solid #F59E0B; color: #FFFFFF; }
      .title-cover-grand { color: #003B95; }
      .title-cover-divider { background: #F59E0B; }
      .title-cover-subtitle { color: #003B95; }
      .title-cover-tagline { color: #64748B; }
      .title-cover-meta-box { background: #FFFFFF; border: 1.5px solid #E2E8F0; border-left: 5px solid #F59E0B; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
      .title-cover-meta-box .meta-lbl { color: #003B95; }
      .thankyou-badge { background: #003B95; border: 1.5px solid #F59E0B; color: #FFFFFF; }
      .thankyou-grand { color: #003B95; }
      .thankyou-subtitle { color: #003B95; }
      .thankyou-slogan { color: #F59E0B; }
      .thankyou-card { background: #FFFFFF; border: 1.5px solid #E2E8F0; border-top: 4px solid #003B95; position: relative; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
      .thankyou-card::after { content: ""; position: absolute; top: -4px; right: 20px; width: 30px; height: 4px; background: #F59E0B; }
      .thankyou-card-title { color: #003B95; }
      .thankyou-card-sub { color: #F59E0B; }
    ` : `
      /* THEME CRM QUẢN TRỊ: 100% TRẮNG - XANH (ZERO GOLD/AMBER/DARK) */
      body { background: #E6EEF8; color: #334155; }
      .slide { background: #FFFFFF; border: 1px solid #BAE6FD; }
      .slide-top-bar {
        position: absolute; top: 0; left: 0; width: 100%; height: 7px;
        background: #003B95;
      }
      .cover-badge {
        display: inline-block; padding: 6px 16px; background: #EFF6FF; border: 1.5px solid #BAE6FD;
        color: #003B95; font-size: 12px; font-weight: 700; border-radius: 6px; margin-bottom: 16px; align-self: flex-start;
      }
      .cover-title { font-size: 38px; font-weight: 900; color: #003B95; line-height: 1.2; margin-bottom: 10px; }
      .cover-subtitle { font-size: 16px; color: #0284C7; margin-bottom: 32px; font-weight: 600; }
      .pillar-card {
        background: #FFFFFF; border: 1.5px solid #BAE6FD; border-radius: 10px; padding: 20px;
        box-shadow: 0 4px 12px rgba(2, 132, 199, 0.06);
      }
      .pillar-num { font-size: 26px; font-weight: 800; color: #0284C7; margin-bottom: 8px; }
      .pillar-title { font-size: 15px; font-weight: 700; color: #003B95; margin-bottom: 8px; }
      .pillar-desc { font-size: 11.5px; color: #334155; line-height: 1.5; }
      .eyebrow-pill {
        display: inline-block; padding: 4px 14px; background: #EFF6FF; color: #003B95;
        font-size: 11px; font-weight: 700; text-transform: uppercase; border-radius: 4px; margin-bottom: 8px;
        border: 1px solid #BAE6FD;
      }
      .slide-title { font-size: 24px; font-weight: 800; color: #003B95; margin-bottom: 4px; }
      .adv-card {
        background: #FFFFFF; border: 1px solid #BAE6FD; border-radius: 10px; padding: 24px 18px;
        display: flex; flex-direction: column; position: relative; border-top: 4px solid #003B95;
      }
      .card-num { font-size: 28px; font-weight: 800; color: #0284C7; margin-bottom: 10px; }
      .card-title { font-size: 16px; font-weight: 700; color: #003B95; margin-bottom: 10px; }
      .card-badge {
        display: inline-block; padding: 3px 8px; background: #EFF6FF; color: #003B95;
        font-size: 10px; font-weight: 700; border-radius: 4px; margin-bottom: 12px; align-self: flex-start;
      }
      .feature-card.border-accent-navy { border-left: 5px solid #003B95; }
      .feature-card.border-accent-cyan { border-left: 5px solid #0284C7; }
      .desktop-frame-container {
        background: #FFFFFF; border: 1.5px solid #BAE6FD; border-radius: 8px; padding: 10px;
        height: 100%; display: flex; flex-direction: column; justify-content: space-between;
      }
      .desktop-screen-box {
        width: 100%; height: 410px; background: #F0F7FF; border: 1px solid #E2E8F0; border-radius: 4px; overflow: hidden;
        display: flex; align-items: center; justify-content: center;
      }
      .desktop-badge {
        background: #EFF6FF; border: 1px solid #BAE6FD; border-radius: 6px;
        padding: 10px; text-align: center; color: #003B95; font-size: 12px; font-weight: 700;
      }
      .conclusion-card {
        background: #FFFFFF; border: 1.5px solid #BAE6FD; border-radius: 10px; padding: 30px 24px;
        border-top: 4px solid #003B95;
      }
      .concl-title { font-size: 17px; font-weight: 700; color: #003B95; margin-bottom: 12px; }
      .concl-desc { font-size: 13.5px; color: #334155; line-height: 1.55; }
      .nav-bar { background: rgba(0, 59, 149, 0.95); border: 1px solid #BAE6FD; }
      .nav-btn { background: #FFFFFF; color: #003B95; }
      .nav-btn:hover { background: #0284C7; color: #FFFFFF; }

      /* Title & Thank You (CRM: 100% Trắng - Xanh) */
      .title-cover-badge { background: #EFF6FF; border: 1.5px solid #BAE6FD; color: #003B95; }
      .title-cover-grand { color: #003B95; }
      .title-cover-divider { background: #0284C7; }
      .title-cover-subtitle { color: #0284C7; }
      .title-cover-tagline { color: #64748B; }
      .title-cover-meta-box { background: #FFFFFF; border: 1.5px solid #BAE6FD; border-left: 5px solid #003B95; box-shadow: 0 4px 16px rgba(2,132,199,0.08); }
      .title-cover-meta-box .meta-lbl { color: #003B95; }
      .thankyou-badge { background: #EFF6FF; border: 1.5px solid #BAE6FD; color: #003B95; }
      .thankyou-grand { color: #003B95; }
      .thankyou-subtitle { color: #003B95; }
      .thankyou-slogan { color: #0284C7; }
      .thankyou-card { background: #FFFFFF; border: 1.5px solid #BAE6FD; border-top: 4px solid #003B95; box-shadow: 0 4px 16px rgba(2,132,199,0.06); }
      .thankyou-card-title { color: #003B95; }
      .thankyou-card-sub { color: #0284C7; }
    `;

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .slides-wrapper { display: flex; flex-direction: column; align-items: center; gap: 40px; padding: 40px 20px; }
    .slide {
      width: 1280px; height: 720px; position: relative;
      border-radius: 12px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); overflow: hidden;
      display: flex; flex-direction: column; padding: 30px 40px 20px 40px;
    }
    
    /* Headers */
    .slide-header { margin-bottom: 20px; }
    .slide-subtitle { font-size: 13px; color: #64748B; font-style: italic; }

    /* Grids */
    .cards-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; height: 500px; margin-top: 10px; }
    .card-icon { font-size: 32px; margin-bottom: 12px; }
    .card-desc { font-size: 12.5px; color: #334155; line-height: 1.5; }

    /* Feature Layouts */
    .feature-layout { display: flex; gap: 30px; height: 510px; align-items: stretch; }
    .desktop-layout .left-col { flex: 1.1; }
    .desktop-layout .right-col { flex: 0.9; display: flex; flex-direction: column; gap: 12px; justify-content: space-between; }
    .mobile-layout .left-col { flex: 0.8; display: flex; justify-content: center; }
    .mobile-layout .right-col { flex: 1.2; display: flex; flex-direction: column; gap: 12px; justify-content: space-between; }

    /* Screen Images */
    .desktop-screen-img { width: 100%; height: 100%; object-fit: contain; }

    /* Mobile Frame */
    .mobile-frame-container {
      background: #FFFFFF; border: 1.5px solid #E2E8F0; border-radius: 24px; padding: 12px;
      width: 270px; height: 100%; display: flex; justify-content: center; align-items: center;
    }
    .mobile-device {
      width: 100%; height: 100%; background: #0F172A; border-radius: 20px; overflow: hidden;
      position: relative; display: flex; justify-content: center;
    }
    .mobile-speaker {
      position: absolute; top: 6px; width: 60px; height: 4px; background: #334155; border-radius: 2px; z-index: 2;
    }
    .mobile-screen-img { width: 100%; height: 100%; object-fit: cover; }

    /* Feature Cards */
    .feature-card {
      background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 18px;
      position: relative; display: flex; flex-direction: column; justify-content: center; flex: 1;
    }
    .feature-title { font-size: 14.5px; font-weight: 700; color: #003B95; margin-bottom: 4px; }
    .feature-desc { font-size: 12px; color: #334155; line-height: 1.45; }

    /* Cover Slide */
    .cover-container { height: 100%; display: flex; flex-direction: column; justify-content: center; padding: 0 40px; }
    .pillars-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .cover-footer { margin-top: 36px; font-size: 12px; color: #64748B; font-style: italic; }

    /* Conclusion Grid */
    .conclusion-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; margin-top: 20px; }

    /* Title Cover Slide */
    .title-cover-container {
      height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 20px 60px;
    }
    .title-cover-badge {
      display: inline-block; padding: 8px 24px; font-size: 13px; font-weight: 700; border-radius: 8px; margin-bottom: 20px;
    }
    .title-cover-grand {
      font-size: 38px; font-weight: 900; line-height: 1.25; margin-bottom: 16px; max-width: 1080px;
    }
    .title-cover-divider {
      width: 120px; height: 4px; border-radius: 2px; margin: 0 auto 18px auto;
    }
    .title-cover-subtitle {
      font-size: 17px; font-weight: 700; margin-bottom: 8px; letter-spacing: 0.5px;
    }
    .title-cover-tagline {
      font-size: 13px; font-style: italic; margin-bottom: 28px; max-width: 950px; line-height: 1.5;
    }
    .title-cover-meta-box {
      border-radius: 12px; padding: 18px 32px; max-width: 860px; width: 100%; margin-bottom: 20px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .meta-item { font-size: 13px; color: #334155; }
    .meta-lbl { font-weight: 700; }
    .meta-row-2 { display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; }
    .title-cover-foot { font-size: 11.5px; color: #64748B; font-style: italic; }

    /* Thank You Slide */
    .thankyou-container {
      height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 20px 50px;
    }
    .thankyou-badge {
      display: inline-block; padding: 8px 24px; font-size: 13px; font-weight: 700; border-radius: 8px; margin-bottom: 16px;
    }
    .thankyou-grand {
      font-size: 42px; font-weight: 900; line-height: 1.2; margin-bottom: 12px;
    }
    .thankyou-subtitle {
      font-size: 18px; font-weight: 700; margin-bottom: 8px;
    }
    .thankyou-slogan {
      font-size: 14px; font-style: italic; margin-bottom: 26px;
    }
    .thankyou-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; width: 100%; max-width: 1050px; margin-bottom: 24px;
    }
    .thankyou-card {
      border-radius: 12px; padding: 24px 20px; display: flex; flex-direction: column; align-items: center; text-align: center;
    }
    .thankyou-icon { font-size: 34px; margin-bottom: 12px; }
    .thankyou-card-title { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
    .thankyou-card-sub { font-size: 12px; font-weight: 600; margin-bottom: 10px; }
    .thankyou-card-desc { font-size: 11.5px; color: #334155; line-height: 1.5; }
    .thankyou-foot { font-size: 12px; color: #64748B; font-style: italic; }

    /* Footer */
    .slide-footer {
      position: absolute; bottom: 12px; left: 40px; right: 40px; display: flex;
      justify-content: space-between; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 8px;
    }

    /* Floating Navigation Controls */
    .nav-bar {
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      padding: 10px 24px; border-radius: 40px; display: flex; gap: 16px; align-items: center; z-index: 100;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2); backdrop-filter: blur(8px);
    }
    .nav-btn {
      border: none; padding: 8px 16px; border-radius: 20px;
      cursor: pointer; font-weight: 700; font-size: 12px; transition: all 0.2s;
    }
    .nav-info { color: #FFFFFF; font-size: 12px; font-weight: 600; }

    ${themeSpecificCss}
  </style>
</head>
<body>
  <div class="nav-bar">
    <button class="nav-btn" onclick="prevSlide()">◀ Trang Trước</button>
    <span class="nav-info" id="nav-counter">Trang 1 / ${slidesData.length}</span>
    <button class="nav-btn" onclick="nextSlide()">Trang Kế ▶</button>
    <button class="nav-btn" onclick="toggleFullscreen()">⛶ Toàn Màn Hình</button>
  </div>

  <div class="slides-wrapper">
    ${slidesHtml}
  </div>

  <script>
    let currentIdx = 0;
    const total = ${slidesData.length};
    function updateCounter() {
      document.getElementById('nav-counter').innerText = 'Trang ' + (currentIdx + 1) + ' / ' + total;
    }
    function scrollToSlide(idx) {
      if (idx >= 0 && idx < total) {
        currentIdx = idx;
        const el = document.getElementById('slide-' + idx);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        updateCounter();
      }
    }
    function prevSlide() { if (currentIdx > 0) scrollToSlide(currentIdx - 1); }
    function nextSlide() { if (currentIdx < total - 1) scrollToSlide(currentIdx + 1); }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { nextSlide(); e.preventDefault(); }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') { prevSlide(); e.preventDefault(); }
    });
    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id && id.startsWith('slide-')) {
            currentIdx = parseInt(id.replace('slide-', ''), 10);
            updateCounter();
          }
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.slide').forEach(s => observer.observe(s));
  </script>
</body>
</html>`;
  }

    // HTML DECK CRM (23 SLIDES - 100% TRẮNG XANH)
  const crmSlides = [
    {
      type: 'title_cover',
      org: 'HỘI DOANH NHÂN TRẺ HÀ NỘI (HANOIBA) · CLB DOANH NHÂN CEO 1983',
      title: 'HỆ THỐNG WEB CRM QUẢN TRỊ & ĐIỀU HÀNH SỐ HÓA',
      subtitle: 'BÁO CÁO TOÀN DIỆN GIẢI PHÁP CHUYỂN ĐỔI SỐ HIỆP HỘI CLB DOANH NHÂN CEO 1983',
      tagline: 'Trung Tâm Chỉ Huy: Hồ Sơ Hội Viên 360° · Tài Chính Đối Soát VietQR · Sơ Đồ Khán Phòng Sự Kiện · Biểu Quyết Live & Lucky Draw',
      presenter: 'Ban Quản Trị & Ban Thư Ký CLB Doanh Nhân CEO 1983 (Trực thuộc HanoiBA)',
      author: 'Phạm Văn Vũ',
      version: 'Hệ Thống CRM 2.0 (Official Release)',
      date: 'Tháng 09/2026 · Hà Nội, Việt Nam',
      footer: 'Bản Quyền © 2026 CLB Doanh Nhân CEO 1983 · Hệ Thống Quản Trị Trắng Xanh Chuẩn Mực'
    },
    {
      type: 'cover',
      eyebrow: 'TRUNG TÂM ĐIỀU HÀNH & QUẢN TRỊ SỐ HÓA HIỆP HỘI',
      title: 'TỔNG QUAN HỆ THỐNG: 4 TRỤ CỘT ĐIỀU HÀNH SỐ HÓA',
      subtitle: 'Kiểm Soát Toàn Diện: Hồ Sơ Hội Viên · Quỹ Hội VietQR · Bầu Cử & Lucky Draw · Sàn B2B',
      pillars: [
        { num: '01', title: 'Quản Trị Hội Viên 360°', desc: 'Thẩm định hồ sơ trực tuyến, phân bổ ban bệ và tự động cấp thông tin tài khoản qua email tức thì.' },
        { num: '02', title: 'Tài Chính & Đối Soát VietQR', desc: 'Theo dõi niên liễm, gạch nợ hội phí tự động qua mã VietQR và minh bạch thu chi ngân quỹ.' },
        { num: '03', title: 'Sự Kiện, Bầu Cử & Lucky Draw', desc: 'Khởi tạo vé đa tầng, sắp đặt sơ đồ khán phòng VIP, bỏ phiếu đại hội và quay số VinFast VF3.' },
        { num: '04', title: 'Đồng Bộ Hai Chiều Realtime', desc: 'Tách biệt chuyên sâu cho Ban Quản Trị nhưng liên kết 100% dữ liệu xuống Mobile App của hội viên.' },
      ]
    },
    {
      type: 'grid_cards',
      eyebrow: 'BÀI TOÁN & THỰC TRẠNG',
      title: 'Thách Thức Trong Công Tác Vận Hành Hiệp Hội Truyền Thống',
      subtitle: 'Những rào cản lớn khiến hiệp hội tiêu tốn nguồn lực và giảm hiệu quả kết nối hội viên',
      items: [
        { icon: '📑', title: 'Hồ Sơ Rời Rạc & Thất Thoát Dữ Liệu', desc: 'Thông tin hội viên lưu trữ thủ công trên các file Excel, Zalo cá nhân. Khi thay đổi thư ký hoặc bàn giao nhiệm kỳ, dữ liệu dễ bị phân tán, thất lạc hoặc sai lệch.' },
        { icon: '⏳', title: 'Đối Soát Hội Phí Thủ Công Tốn Kém', desc: 'Ban Tài chính phải kiểm tra từng giao dịch sao kê ngân hàng, nhắn tin nhắc nợ từng người và gạch nợ thủ công, mất hàng chục giờ làm việc mỗi kỳ niên liễm.' },
        { icon: '🚪', title: 'Check-in Sự Kiện Ùn Tắc & Dễ Trùng Lặp', desc: 'Tại các sự kiện lớn như Đại hội, Caravan, Gala Dinner, khâu soát vé giấy thủ công gây ùn tắc tại cửa ra vào, không kiểm soát được vé giả hoặc dùng chung vé.' },
        { icon: '📉', title: 'Giao Thương Nội Khối Thiếu Đo Lường', desc: 'Nhu cầu mua bán, hợp tác của các doanh nghiệp thành viên chia sẻ tự phát trong các nhóm chat, không có cơ chế thẩm định xuất xứ và không đo lường được quy mô giá trị Deals.' }
      ]
    },
    {
      type: 'grid_cards',
      eyebrow: 'GIỚI THIỆU HIỆP HỘI',
      title: 'Câu Lạc Bộ Doanh Nhân CEO 1983 - Hội Doanh Nhân Trẻ Hà Nội',
      subtitle: 'Mạng lưới tinh hoa quy tụ các nhà sáng lập và lãnh đạo doanh nghiệp sinh năm Quý Hợi 1983',
      items: [
        { badge: 'TÔN CHỈ HOẠT ĐỘNG', title: 'Đoàn Kết - Bản Lĩnh - Tiên Phong', desc: 'Xây dựng cộng đồng doanh nhân đồng niên vững mạnh, sẻ chia kinh nghiệm quản trị, tương trợ nguồn lực và cùng nhau kiến tạo các giá trị kinh tế bền vững cho xã hội.' },
        { badge: 'QUY MÔ & TỔ CHỨC', title: 'Mạng Lưới 100+ Doanh Nghiệp', desc: 'Quy tụ hơn 100 chủ doanh nghiệp hoạt động trên khắp các lĩnh vực: Bất động sản, Sản xuất, Công nghệ thông tin, Xây dựng, Tài chính và Dịch vụ thương mại.' },
        { badge: 'CƠ CẤU CHUYÊN MÔN', title: '7 Ban Ngành Chuyên Trách', desc: 'Bộ máy điều hành chuyên nghiệp với Ban Thường trực, Ban Sự kiện, Ban Xúc tiến Thương mại, Ban Tài chính, Ban Truyền thông, Ban Đối ngoại và Ban Kiểm soát.' },
        { badge: 'TẦM NHÌN SỐ HÓA', title: 'Hiệp Hội Số Kiểu Mẫu', desc: 'Tiên phong ứng dụng công nghệ hiện đại vào toàn bộ quy trình sinh hoạt, kiến tạo di sản dữ liệu số hóa bất biến cho nhiều nhiệm kỳ phát triển mai sau.' }
      ]
    },
    {
      type: 'grid_cards',
      eyebrow: 'MỤC ĐÍCH & GIẢI PHÁP TỔNG THỂ',
      title: 'Kiến Trúc Nền Tảng Kép (Dual-Platform) Cho Hiệp Hội Số',
      subtitle: 'Phân tách nghiệp vụ chuyên biệt: Web CRM cho Ban Quản trị - Mobile App cho Hội viên',
      items: [
        { icon: '💻', title: 'Web CRM Quản Trị Trung Tâm', desc: 'Dành riêng cho Ban Chấp Hành, Ban Thư Ký và Kế toán: Kiểm soát dữ liệu hội viên, tài chính đối soát VietQR, quản lý sơ đồ khán phòng và kiểm duyệt nội dung.' },
        { icon: '📱', title: 'Mobile App Hội Viên Đẳng Cấp', desc: 'Dành riêng cho các chủ doanh nghiệp: Sở hữu thẻ VIP số 3D, danh thiếp chạm NFC 1 chạm, nhận vé QR sự kiện, bỏ phiếu đại hội và giao thương B2B.' },
        { icon: '🔄', title: 'Đồng Bộ Dữ Liệu Hai Chiều Tức Thì', desc: 'Mọi thay đổi trên Web CRM được đẩy realtime xuống điện thoại của hội viên và ngược lại, đảm bảo tính toàn vẹn, tức thời và thông suốt 100%.' },
        { icon: '🛡️', title: 'Bảo Mật & Phân Quyền Đa Tầng RBAC', desc: 'Cơ chế kiểm soát truy cập nghiêm ngặt dựa trên vai trò (Admin, Thư ký, Kế toán, Hội viên VIP), mã hóa dữ liệu theo tiêu chuẩn ngân hàng.' }
      ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG QUẢN TRỊ 01',
      title: 'Cổng Đăng Nhập CRM Quản Trị & Phân Quyền Bảo Mật',
      subtitle: 'Bảo vệ an toàn thông tin hiệp hội với giao diện chuẩn Trắng - Xanh thanh lịch',
      imgFilename: 'crm_step_01_login_screen.png',
      badgeText: '🛡️ Mã hóa phiên làm việc qua JWT Token & Kết nối bảo mật SSL/HTTPS 100%',
      features: [
      { title: 'Đăng Nhập Quản Trị Viên An Toàn', desc: 'Xác thực nhanh qua Email và Mật khẩu được mã hóa bcrypt bảo vệ tuyệt đối dữ liệu nội bộ.' },
      { title: 'Phân Quyền Vai Trò Đa Cấp (RBAC)', desc: 'Tách bạch quyền hạn: Super Admin, Ban Thư Ký, Ban Sự Kiện và Ban Tài Chính đúng trách nhiệm.' },
      { title: 'Lưu Phiên Tự Động & Chống Tấn Công', desc: 'Bảo vệ phiên làm việc qua cơ chế SameSite Cookie và tự động thu hồi quyền khi hết hạn.' },
      { title: 'Giao Diện Tối Ưu Mọi Màn Hình Desktop', desc: 'Trải nghiệm mượt mà từ máy trạm văn phòng đến máy tính bảng điều hành khi đi công tác.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG QUẢN TRỊ 02',
      title: 'Bảng Điều Khiển Tổng Quan (Dashboard) & Chỉ Số KPI Thực',
      subtitle: 'Bức tranh toàn cảnh về sức khỏe hiệp hội: Hội viên, Dòng tiền sổ quỹ và Giao thương B2B',
      imgFilename: 'crm_step_02_dashboard_kpi_live.png',
      badgeText: '📊 Dữ liệu phản hồi trực tiếp từ Database với biểu đồ tiến độ & thống kê thời gian thực',
      features: [
      { title: 'Chỉ Số Tăng Trưởng Hội Viên', desc: 'Thống kê tổng số 31 doanh nhân chính thức đang hoạt động và số lượng hồ sơ mới đang chờ thẩm định.' },
      { title: 'Theo Dõi Dòng Tiền & Quỹ Hội', desc: 'Đo lường nguồn thu niên liễm 435 triệu đồng, vé sự kiện và các khoản tài trợ chuyển khoản về tài khoản hiệp hội.' },
      { title: 'Đo Lường Hiệu Quả Sàn B2B', desc: 'Tổng hợp số lượng 30 hoạt động kết nối, sản phẩm niêm yết và số lượng Deal giao thương thành công.' },
      { title: 'Xuất Báo Cáo Ban Chấp Hành Tức Thì', desc: 'Tải dữ liệu chuẩn hóa phục vụ các kỳ họp Ban Chấp Hành định kỳ chỉ với một cú nhấp chuột.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG QUẢN TRỊ 03',
      title: 'Quản Trị Danh Sách Hội Viên, Phân Hạng & Bộ Lọc Ban Ngành',
      subtitle: 'Quản lý toàn bộ 100+ lãnh đạo doanh nhân sinh năm 1983 theo ban chuyên môn',
      imgFilename: 'crm_step_03_members_management.png',
      badgeText: '👥 Bảng dữ liệu đa năng hỗ trợ tìm kiếm nhanh, lọc theo trạng thái và xuất Excel',
      features: [
      { title: 'Danh Mục Hồ Sơ Doanh Nhân Đầy Đủ', desc: 'Lưu trữ họ tên, công ty, mã số thuế, chức vụ trong CLB, số điện thoại và địa chỉ trụ sở.' },
      { title: 'Bộ Lọc & Tìm Kiếm Thông Minh', desc: 'Tra cứu tức thì theo tên doanh nhân, công ty, số điện thoại hoặc trạng thái Hoạt động/Chờ duyệt.' },
      { title: 'Phân Bổ Ban Chuyên Môn Sinh Hoạt', desc: 'Sắp xếp hội viên vào Ban Sự kiện, Ban Tài chính, Ban Xúc tiến Thương mại, Ban Truyền thông.' },
      { title: 'Xuất Báo Cáo Excel Danh Bạ', desc: 'Tải file Excel định dạng chuẩn phục vụ công tác in ấn kỷ yếu và lưu trữ nội bộ hiệp hội.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG QUẢN TRỊ 04',
      title: 'Thẩm Định Hồ Sơ 360° & Tự Động Cấp Tài Khoản Qua Email',
      subtitle: 'Quy trình xét duyệt hồ sơ online khép kín, minh bạch và chuyên nghiệp',
      imgFilename: 'crm_step_04_member_approval_drawer.png',
      badgeText: '⚡ Bấm Phê duyệt: Tự động kích hoạt tài khoản DB & Gửi ngay Email mật khẩu cho hội viên',
      features: [
      { title: 'Drawer Thẩm Định Toàn Diện 360°', desc: 'Xem trọn vẹn giấy phép đăng ký kinh doanh, chức vụ C-Level và lĩnh vực kinh doanh của doanh nghiệp.' },
      { title: 'Thao Tác Phê Duyệt (Approve) 1 Chạm', desc: 'Admin xác nhận: Hồ sơ chuyển trạng thái Hoạt động và tự động sinh mã định danh hội viên chính thức.' },
      { title: 'Tự Động Kích Hoạt Quyền Trên App', desc: 'Cấp tài khoản và quyền đăng nhập tức thì vào CSDL cho người dùng trên ứng dụng di động.' },
      { title: 'Bắn Email Chào Mừng Kèm Mật Khẩu', desc: 'Hệ thống gửi thư điện tử thông báo kết nạp kèm mật khẩu khởi tạo an toàn về hòm thư hội viên.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG QUẢN TRỊ 05',
      title: 'Quản Trị Tổ Chức Sự Kiện, Cấu Hình Vé Đa Tầng & Bán Vé',
      subtitle: 'Lập kế hoạch Đại hội thường niên, Caravan xúc tiến thương mại và Gala Doanh nhân',
      imgFilename: 'crm_step_05_events_management.png',
      badgeText: '🎫 Thiết lập vé VIP miễn phí cho hội viên và vé đại biểu có phí thu qua VietQR tự động',
      features: [
      { title: 'Khởi Tạo Sự Kiện Nhanh Chóng', desc: 'Thiết lập thời gian, địa điểm, nội dung chương trình và banner sự kiện đẩy trực tiếp lên Mobile App.' },
      { title: 'Cấu Hình Vé Đa Tầng Linh Hoạt', desc: 'Phân loại: Vé Hội viên VIP (0đ đặc quyền), Vé Khách mời mở rộng, Vé Nhà tài trợ kim cương.' },
      { title: 'Giám Sát Số Lượng Vé Thời Gian Thực', desc: 'Theo dõi số lượng vé đã phát hành, doanh thu bán vé sự kiện và số chỗ ngồi còn trống.' },
      { title: 'Đồng Bộ Thông Báo Đẩy Xuống App', desc: 'Tự động gửi thông báo push đến điện thoại của toàn bộ hội viên khi sự kiện mới được mở đăng ký.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG QUẢN TRỊ 06',
      title: 'Sơ Đồ Rạp Cinema Seating Map & Xếp Chỗ VIP Gala Dinner',
      subtitle: 'Bố trí sơ đồ bàn tiệc trực quan, định vị chính xác chỗ ngồi danh dự',
      imgFilename: 'crm_step_06_seating_cinema_map.png',
      badgeText: '🏛️ Phân bổ Bàn VIP Đoàn Chủ Tịch và đồng bộ số ghế chính xác vào Vé Điện Tử trên App',
      features: [
      { title: 'Trực Quan Hóa Sơ Đồ Khán Phòng', desc: 'Mô phỏng chân thực ma trận ghế ngồi và bàn tiệc: Bàn VIP Kim Cương, Bàn Đại biểu, Bàn Khách mời.' },
      { title: 'Kéo Thả Xếp Chỗ Ngồi Danh Dự', desc: 'Gán đại biểu và khách VIP vào từng vị trí ghế ngồi cụ thể theo giao thức ngoại giao trang trọng.' },
      { title: 'Tự Động Cập Nhật Lên Vé Trên App', desc: 'Vị trí số bàn và số ghế tự động hiển thị trên Vé điện tử thông minh trong điện thoại của hội viên.' },
      { title: 'Ngăn Ngừa Trùng Lặp Chỗ Ngồi 100%', desc: 'Hệ thống tự động khóa ghế đã được gán, đảm bảo không bao giờ xảy ra tình trạng xếp trùng vị trí.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG QUẢN TRỊ 07',
      title: 'Cổng Soát Vé Check-in QR Tốc Độ Cao & Giám Sát Cửa',
      subtitle: 'Kiểm soát ra vào hội trường trong 1 giây, hiển thị thông tin đại biểu trân trọng',
      imgFilename: 'crm_step_07_gate_checkin.png',
      badgeText: '⚡ Tốc độ quét mã 1 giây/người, chống chụp màn hình gian lận & âm thanh xác nhận tức thì',
      features: [
      { title: 'Quét Mã Vé QR Điện Tử Siêu Tốc', desc: 'Hỗ trợ đầu đọc mã vạch chuyên dụng hoặc camera máy tính bảng quét vé QR từ App hội viên trong 1 giây.' },
      { title: 'Hiển Thị Thông Tin Đại Biểu Lễ Tân', desc: 'Màn hình ngay lập tức hiển thị họ tên, chức vụ, ảnh đại diện và vị trí số bàn tiệc để lễ tân đón tiếp.' },
      { title: 'Chống Quét Lại & Gian Lận 100%', desc: 'Cảnh báo màu đỏ nổi bật nếu mã vé đã được quét trước đó, ngăn chặn hành vi sử dụng chung vé.' },
      { title: 'Báo Cáo Tỷ Lệ Tham Dự Realtime', desc: 'Thống kê tức thời số lượng khách đã có mặt tại hội trường phục vụ công tác khai mạc đại hội.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG QUẢN TRỊ 08',
      title: 'Quản Trị Bầu Cử Đại Hội & Biểu Quyết Tín Nhiệm Đại Biểu',
      subtitle: 'Số hóa công tác hiệp thương nhân sự, thiết lập kỳ bầu cử và kiểm phiếu tự động',
      imgFilename: 'crm_voting_management.png',
      badgeText: '🗳️ Quản lý kỳ bầu cử BCH: Giám sát tỷ lệ biểu quyết, ứng viên đại biểu & biểu đồ kết quả trực tiếp',
      features: [
      { title: 'Khởi Tạo Kỳ Bầu Cử & Biểu Quyết Nhanh', desc: 'Thiết lập tiêu đề kỳ họp, thời gian mở/đóng hòm phiếu điện tử và số lượng ứng viên tối đa được chọn.' },
      { title: 'Quản Lý Danh Sách Ứng Cử Viên Ban Chấp Hành', desc: 'Cập nhật hồ sơ ứng viên, hình ảnh, chức vụ hiện tại và chương trình hành động để đại biểu nghiên cứu.' },
      { title: 'Kiểm Phiếu Tự Động & Chống Gian Lận', desc: 'Thuật toán mã hóa một chiều ngăn chặn bỏ phiếu hai lần, tự động tổng hợp số phiếu và tỷ lệ phần trăm.' },
      { title: 'Xuất Báo Cáo Kiểm Phiếu Chuẩn Đại Hội', desc: 'In biên bản kiểm phiếu phục vụ Ban Kiểm Soát đại hội ký duyệt và lưu trữ văn kiện nhiệm kỳ.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG QUẢN TRỊ 09',
      title: 'Quản Trị Vòng Quay May Mắn Lucky Draw & Cơ Cấu Giải Thưởng',
      subtitle: 'Khuấy động không khí đêm Gala với cơ chế quay số ngẫu nhiên theo mã vé may mắn',
      imgFilename: 'crm_lucky_draw_modal.png',
      badgeText: '🎁 Cơ cấu Giải đặc biệt VinFast VF3 - Quay số minh bạch, tìm người trúng giải & thông báo tức thì',
      features: [
      { title: 'Cấu Hình Cơ Cấu Giải Thưởng Hấp Dẫn', desc: 'Thiết lập Giải Đặc Biệt (Ô tô VinFast VF3), Giải Nhất, Giải Nhì, Giải Ba kèm hình ảnh minh họa sống động.' },
      { title: 'Quay Số Ngẫu Nhiên Minh Bạch 100%', desc: 'Hệ thống quay số ngẫu nhiên từ tập hợp mã vé đã check-in vào sự kiện, hiển thị số nhảy trên màn LED.' },
      { title: 'Xác Nhận Người Trúng Thưởng & Mã Vé', desc: 'Hệ thống tự động hiển thị thông tin trúng thưởng (VD: Ngô Bảo Anh - Mã vé #2190) lên màn hình lớn.' },
      { title: 'Gửi Thông Báo Push Chúc Mừng Xuống App', desc: 'Admin bấm nút gửi thông báo: Điện thoại người trúng nhận ngay tin nhắn chúc mừng lên sân khấu nhận giải.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG QUẢN TRỊ 10',
      title: 'Quản Trị Sàn Marketplace, Kiểm Duyệt Sản Phẩm Doanh Nghiệp',
      subtitle: 'Thẩm định chất lượng và xuất xứ trước khi niêm yết chào hàng nội bộ',
      imgFilename: 'crm_step_08_marketplace_moderation.png',
      badgeText: '🏷️ Gán nhãn Đã Kiểm Duyệt CLB CEO 1983 và kích hoạt ưu đãi đặc quyền cho hội viên',
      features: [
      { title: 'Hàng Đợi Kiểm Duyệt Sản Phẩm', desc: 'Tiếp nhận bài đăng sản phẩm từ Mobile App hội viên, xem hình ảnh, thông số kỹ thuật và báo giá sỉ.' },
      { title: 'Thẩm Định Chính Sách Ưu Đãi Nội Bộ', desc: 'Đảm bảo sản phẩm có chính sách chiết khấu thực chất dành riêng cho cộng đồng doanh nhân CEO 1983.' },
      { title: 'Phê Duyệt Xuất Bản Lên App Tức Thì', desc: 'Bấm Duyệt: Sản phẩm ngay lập tức xuất hiện trên sàn giao dịch của toàn bộ hội viên trên di động.' },
      { title: 'Theo Dõi & Giám Sát Báo Giá B2B', desc: 'Thống kê số lượt hội viên gửi yêu cầu báo giá và lưu lượng tương tác giao thương giữa các bên.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG QUẢN TRỊ 11',
      title: 'Điều Phối Cơ Hội Giao Thương B2B & Thống Kê Giá Trị Deals',
      subtitle: 'Nắm bắt dòng chảy giao thương, kết nối cung cầu và thúc đẩy hợp đồng kinh tế',
      imgFilename: 'crm_step_09_opportunities_sync.png',
      badgeText: '🤝 Đo lường giá trị các Deal kinh doanh đã kết nối thành công phục vụ báo cáo hiệp hội',
      features: [
      { title: 'Nắm Bắt Toàn Diện Nhu Cầu Giao Thương', desc: 'Theo dõi các đề xuất mua bán, tìm nhà cung ứng, mời gọi hợp tác đầu tư và phân phối hàng hóa.' },
      { title: 'Giám Sát Trạng Thái Kết Nối Deals', desc: 'Biết chính xác cơ hội nào đã được hội viên đón nhận (Claimed) và tiến độ ký kết hợp đồng.' },
      { title: 'Thống Kê Tổng Giá Trị Giao Thương', desc: 'Đo lường quy mô kinh tế bằng tiền (Tỷ đồng) mà hệ sinh thái CEO 1983 đã tạo ra cho thành viên.' },
      { title: 'Hỗ Trợ Kết Nối Chéo Giữa Các Ban', desc: 'Ban Xúc tiến thương mại đóng vai trò điều phối, giới thiệu các đối tác tiềm năng phù hợp nhất.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG QUẢN TRỊ 12',
      title: 'Quản Lý Thu Hội Phí Thường Niên, Đối Soát VietQR & Sổ Quỹ',
      subtitle: 'Tự động hóa đối soát sao kê ngân hàng, gạch nợ hội phí không cần xử lý thủ công',
      imgFilename: 'crm_step_10_finance_fees_cashbook.png',
      badgeText: '💳 Gạch nợ tự động qua VietQR, xuất phiếu thu điện tử và lưu trữ sổ quỹ kế toán minh bạch',
      features: [
      { title: 'Theo Dõi Niên Liễm Theo Năm Tài Chính', desc: 'Bảng theo dõi trạng thái hoàn thành hội phí: Đã thanh toán, Chưa nộp, Miễn giảm theo từng hội viên.' },
      { title: 'Đối Soát Tự Động Qua Cổng VietQR', desc: 'Khi hội viên quét mã chuyển khoản trên App, hệ thống tự động gạch nợ và gia hạn thẻ số tức thì.' },
      { title: 'Quản Lý Sổ Quỹ Thu Chi Minh Bạch', desc: 'Ghi nhận chi tiết mọi dòng tiền: Thu hội phí, Thu vé sự kiện, Thu tài trợ và các khoản chi hoạt động.' },
      { title: 'Xuất Báo Cáo Kế Toán & Phiếu Thu Số', desc: 'Tự động tạo phiếu thu điện tử gửi về email hội viên và xuất file đối soát phục vụ ban kiểm soát.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG QUẢN TRỊ 13',
      title: 'Quản Lý Doanh Nghiệp Thành Viên & Bản Đồ Chuỗi Cung Ứng',
      subtitle: 'Xây dựng mạng lưới liên kết sản xuất và tiêu dùng nội bộ bền vững',
      imgFilename: 'crm_step_11_companies_directory.png',
      badgeText: '🏢 Bản đồ năng lực chuỗi cung ứng: Kết nối sản xuất, phân phối và dịch vụ C-Level',
      features: [
      { title: 'Lưu Trữ Hồ Sơ Pháp Nhân Đầy Đủ', desc: 'Quản lý mã số thuế, địa chỉ trụ sở, người đại diện pháp luật và hồ sơ năng lực chi tiết của công ty.' },
      { title: 'Phân Loại Ngành Nghề Chuỗi Giá Trị', desc: 'Sắp xếp theo cụm ngành: Cơ khí sản xuất, Xây dựng hoàn thiện, F&B, Logistics, Dịch vụ số.' },
      { title: 'Thúc Đẩy Sử Dụng Sản Phẩm Chéo', desc: 'Khuyến khích hội viên ưu tiên sử dụng vật tư, thiết bị và dịch vụ của nhau với chiết khấu nội bộ.' },
      { title: 'Liên Kết Tài Khoản Lãnh Đạo Với Công Ty', desc: 'Một doanh nghiệp có thể có Chủ tịch và Tổng Giám Đốc cùng sinh hoạt với quyền hạn rõ ràng.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG QUẢN TRỊ 14',
      title: 'Cấu Hình Phân Quyền Quản Trị RBAC & Nhật Ký Kiểm Toán',
      subtitle: 'Lưu vết bất biến toàn bộ thao tác vận hành, đảm bảo an toàn tuyệt đối',
      imgFilename: 'crm_step_12_roles_audit_logs.png',
      badgeText: '🔒 Nhật ký kiểm toán lưu vết IP, tài khoản thực hiện và thời gian chính xác của mọi thao tác',
      features: [
      { title: 'Ma Trận Phân Quyền Chi Tiết (RBAC)', desc: 'Cấp quyền Xem, Thêm, Sửa, Xóa, Duyệt cho từng vị trí trong Ban Thư Ký và Ban Quản Trị.' },
      { title: 'Nhật Ký Kiểm Toán An Ninh Bất Biến', desc: 'Ghi nhận lịch sử: Ai đã phê duyệt hội viên, ai đã sửa số liệu sổ quỹ, ai đã xuất file danh bạ.' },
      { title: 'Bảo Vệ Hạ Tầng Chuẩn SSL/HTTPS', desc: 'Toàn bộ dữ liệu truyền tải giữa Web CRM, App Mobile và CSDL đều được mã hóa tuyệt đối.' },
      { title: 'Cơ Chế Sao Lưu Định Kỳ Tự Động', desc: 'Tự động sao lưu dự phòng CSDL hàng ngày, đảm bảo khả năng phục hồi nguyên vẹn khi cần thiết.' }
    ]
    },
    {
      type: 'grid_cards',
      eyebrow: 'ƯU ĐIỂM VƯỢT TRỘI',
      title: 'Giá Trị Cốt Lõi & Hiệu Quả Đột Phá Cho Ban Lãnh Đạo',
      subtitle: 'Tối ưu hóa nguồn lực, bảo vệ dữ liệu và nâng cao năng lực quản trị hiệp hội',
      items: [
        { num: '01', title: 'Tiết Kiệm 90% Thời Gian Thủ Công', desc: 'Tự động hóa hoàn toàn việc tiếp nhận hồ sơ, gửi email mật khẩu, xuất danh sách đại biểu và gạch nợ hội phí, giải phóng sức lao động cho Ban Thư Ký.' },
        { num: '02', title: 'Minh Bạch Tài Chính Tuyệt Đối', desc: 'Mọi dòng tiền thu chi đều được đối soát khớp lệnh qua mã VietQR và lưu vết trong sổ quỹ điện tử, sẵn sàng cho công tác kiểm toán của Ban Kiểm Soát.' },
        { num: '03', title: 'Kế Thừa Dữ Liệu Bất Biến Qua Các Nhiệm Kỳ', desc: 'Toàn bộ danh bạ hội viên, kỷ yếu sự kiện và lịch sử giao thương được lưu trữ trên hạ tầng CSDL bảo mật, giúp chuyển giao nhiệm kỳ suôn sẻ và nguyên vẹn.' },
        { num: '04', title: 'Độ Tin Cậy & Sẵn Sàng 99.9%', desc: 'Kiến trúc Docker container hóa trên máy chủ hiệu năng cao, phản hồi dưới 100ms và cơ chế tự động khôi phục sự cố bảo đảm hệ thống luôn thông suốt.' }
      ]
    },
    {
      type: 'grid_cards',
      eyebrow: 'HƯỚNG PHÁT TRIỂN TƯƠNG LAI',
      title: 'Lộ Trình Nâng Cấp Hệ Thống CRM Quản Trị Giai Đoạn 2026 - 2028',
      subtitle: 'Tích hợp Trí tuệ nhân tạo và mở rộng liên minh giao thương hiệp hội toàn quốc',
      items: [
        { badge: 'GIAI ĐOẠN 1 (ĐÃ HOÀN THÀNH)', title: 'Chuẩn Hóa Nền Tảng Quản Trị Số', desc: 'Số hóa 100% hồ sơ hội viên, tự động hóa duyệt tài khoản, sơ đồ khán phòng VIP, cổng soát vé QR 1s và đối soát tài chính tự động VietQR.' },
        { badge: 'GIAI ĐOẠN 2 (QUÝ 3 - QUÝ 4/2026)', title: 'Tích Hợp AI Matching & Trợ Lý Ảo', desc: 'Thuật toán AI tự động gợi ý kết nối cung - cầu giữa các doanh nghiệp theo lĩnh vực; Trợ lý ảo AI tóm tắt biên bản họp BCH và tự động soạn thảo nghị quyết.' },
        { badge: 'GIAI ĐOẠN 3 (NĂM 2027)', title: 'Hệ Thống Phân Tích Dữ Liệu Lớn (BI)', desc: 'Báo cáo thông minh dự báo xu hướng dòng tiền quỹ hội, đo lường chỉ số gắn kết của từng thành viên và cảnh báo sớm nguy cơ rời bỏ hiệp hội.' },
        { badge: 'GIAI ĐOẠN 4 (NĂM 2028)', title: 'Liên Minh Số Hiệp Hội Toàn Quốc', desc: 'Mở rộng liên kết cơ sở dữ liệu với Hội Doanh Nhân Trẻ các tỉnh thành và các tổ chức xúc tiến thương mại quốc tế, mở ra mạng lưới giao thương toàn cầu.' }
      ]
    },
    {
      type: 'conclusion',
      eyebrow: 'KHẲNG ĐỊNH VỊ THẾ HIỆP HỘI TIÊN PHONG',
      title: 'TỔNG KẾT & CAM KẾT VẬN HÀNH SỐ HÓA',
      subtitle: 'Khẳng định đẳng cấp quản trị · Minh bạch tài chính · Sẵn sàng bàn giao nhiệm kỳ trọn vẹn',
      values: [
        { t: 'Đơn Giản Hóa Vận Hành', d: 'Mọi nghiệp vụ từ duyệt hội viên đến tổ chức sự kiện đều được quy chuẩn hóa trong một phần mềm duy nhất, dễ dùng và trực quan.' },
        { t: 'Bảo Toàn Di Sản Hiệp Hội', d: 'Dữ liệu không bao giờ bị mất mát, tạo nền tảng vững chắc cho các thế hệ Ban Chấp Hành kế tiếp phát triển lớn mạnh hơn.' },
        { t: 'Lan Tỏa Giá Trị Thực Chất', d: 'Đưa CLB CEO 1983 trở thành mái nhà chung kết nối kinh doanh hiệu quả, tin cậy và bền vững hàng đầu thủ đô.' }
      ]
    },
    {
      type: 'thank_you',
      badge: 'BẾ MẠC BÁO CÁO GIẢI PHÁP SỐ HÓA CRM',
      title: 'XIN TRÂN TRỌNG CẢM ƠN!',
      subtitle: 'Kính Chúc Quý Lãnh Đạo, Quý Doanh Nhân Sức Khỏe & Doanh Nghiệp Phát Triển Vững Mạnh',
      slogan: '"TÂM - TẦM - TÍN - THỊNH" · "KẾT NỐI BỀN - PHÁT TRIỂN VỮNG"',
      cards: [
        {
          icon: '🏛️',
          title: 'CLB DOANH NHÂN CEO 1983',
          sub: 'Hội Doanh Nhân Trẻ Hà Nội',
          desc: 'Mái nhà chung kết nối doanh nhân đồng niên 1983 uy tín, đoàn kết, bản lĩnh và cùng nhau vươn tầm.'
        },
        {
          icon: '💬',
          title: 'HỎI ĐÁP & TRAO ĐỔI (Q&A)',
          sub: 'Giải đáp trực tiếp giải pháp',
          desc: 'Sẵn sàng lắng nghe góp ý từ Ban Chấp Hành để tinh chỉnh các quy trình nghiệp vụ phù hợp nhất.'
        },
        {
          icon: '📞',
          title: 'KẾT NỐI BAN QUẢN TRỊ',
          sub: 'Hỗ trợ kỹ thuật & Vận hành',
          desc: 'Ban Thư Ký và Đội ngũ Kỹ thuật thường trực hướng dẫn thao tác, phân quyền tài khoản 24/7.'
        }
      ]
    }
  ];

  const htmlCrm = renderDeckHtml('Thuyết Trình Hệ Thống CRM Quản Trị CLB CEO 1983', 'Hệ Thống Web CRM Quản Trị', crmSlides, false);
  const outHtmlCrm = path.join(OUT_DIR, 'SLIDE_THUYET_TRINH_CRM_QUAN_TRI_CEO1983.html');
  fs.writeFileSync(outHtmlCrm, htmlCrm, 'utf8');
  fs.writeFileSync(path.join(FE_DOCS_DIR, 'SLIDE_THUYET_TRINH_CRM_QUAN_TRI_CEO1983.html'), htmlCrm, 'utf8');
  console.log(`✓ Đã tạo HTML CRM thành công: ${outHtmlCrm}`);

  // HTML DECK APP (26 SLIDES - TRẮNG 70%, XANH 25%, VÀNG 5%)
  const appSlides = [
    {
      type: 'title_cover',
      org: 'CLB DOANH NHÂN CEO 1983 · HỘI DOANH NHÂN TRẺ HÀ NỘI (HANOIBA)',
      title: 'ỨNG DỤNG DI ĐỘNG HỘI VIÊN CEO 1983',
      subtitle: 'NỀN TẢNG KẾT NỐI DOANH NHÂN & ĐẶC QUYỀN SỐ HÓA ĐỘC BẢN',
      tagline: 'Thẻ Hội Viên VIP Gold · Thẻ Visit Card Số Hóa · Check-in QR Sự Kiện & Bàn VIP · Sàn Cơ Hội Giao Thương B2B',
      presenter: 'Ban Quản Trị & Ban Thư Ký CLB Doanh Nhân CEO 1983 (Trực thuộc HanoiBA)',
      author: 'Phạm Văn Vũ',
      version: 'Mobile App (iOS PWA / Android Native) 2.0',
      date: 'Tháng 09/2026 · Hà Nội, Việt Nam',
      footer: 'Bản Quyền © 2026 CLB Doanh Nhân CEO 1983 · Trực thuộc Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)'
    },
    {
      type: 'cover',
      eyebrow: 'ỨNG DỤNG DI ĐỘNG HIỆP HỘI THỜI KỲ SỐ',
      title: 'TỔNG QUAN NỀN TẢNG: 4 GIÁ TRỊ ĐẶC QUYỀN HỘI VIÊN',
      subtitle: 'Không Gian Số Hội Viên Đẳng Cấp: Thẻ VIP Gold 3D · Danh Thiếp Visit Card · Chạm NFC · Quét QR Công Khai',
      pillars: [
        { num: '01', title: 'Thẻ VIP & NFC 1 Chạm', desc: 'Thẻ hội viên VIP Gold số hóa chuẩn quốc tế, tích hợp chip NFC chạm trao danh thiếp ngay trên điện thoại.' },
        { num: '02', title: 'Sàn Trao Đổi Cơ Hội B2B', desc: 'Chia sẻ nhu cầu mua bán sỉ, kết nối cung ứng và kêu gọi đầu tư trực tiếp giữa các doanh nhân.' },
        { num: '03', title: 'Sự Kiện, Vé & Bầu Cử Đại Hội', desc: 'Xem lịch đại hội, đăng ký vé VietQR, quét mã QR vào cửa 1s, bỏ phiếu BCH và quay số trúng thưởng.' },
        { num: '04', title: 'Đồng Bộ Realtime CRM', desc: 'Tách biệt giao diện chuyên dụng cho hội viên nhưng liên kết 100% dữ liệu vận hành từ Web CRM Quản trị.' },
      ]
    },
    {
      type: 'grid_cards',
      eyebrow: 'BÀI TOÁN & THỰC TRẠNG',
      title: 'Thách Thức Trong Kết Nối & Trải Nghiệm Của Doanh Nhân',
      subtitle: 'Những bất tiện mà các chủ doanh nghiệp thường xuyên gặp phải trong sinh hoạt cộng đồng',
      items: [
        { icon: '📇', title: 'Danh Thiếp Giấy Dễ Thất Lạc', desc: 'Sau các buổi giao lưu, danh thiếp giấy thường bị quên lãng, thất lạc hoặc thông tin liên lạc bị lỗi thời khi đối tác thay đổi số điện thoại hay công ty.' },
        { icon: '💬', title: 'Cơ Hội Giao Thương Bị Trôi Tin', desc: 'Nhu cầu mua hàng, tìm nhà cung ứng đăng trong nhóm chat Zalo bị tin nhắn chào hỏi làm trôi mất, không có bộ lọc ngành nghề để tìm lại đối tác phù hợp.' },
        { icon: '🎟️', title: 'Check-in Sự Kiện Thủ Công Phiền Hà', desc: 'Doanh nhân bận rộn dễ quên lịch họp, quên vé giấy. Khi đến sự kiện phải đứng xếp hàng chờ tìm tên trong danh sách giấy in gây cảm giác thiếu chuyên nghiệp.' },
        { icon: '💸', title: 'Đóng Phí Phức Tạp & Thiếu Xác Nhận', desc: 'Chuyển khoản nộp hội phí niên liễm phải chụp màn hình gửi xác nhận qua lại, không có hóa đơn điện tử hay thẻ số để xuất trình quyền lợi ngay lập tức.' }
      ]
    },
    {
      type: 'grid_cards',
      eyebrow: 'GIỚI THIỆU KHÔNG GIAN SỐ',
      title: 'Hệ Sinh Thái Di Động Dành Riêng Cho Doanh Nhân CEO 1983',
      subtitle: 'Ứng dụng di động cài đặt trực tiếp trên iOS và Android, tối ưu hóa trải nghiệm kết nối',
      items: [
        { badge: 'ĐỊNH DANH ĐẲNG CẤP', title: 'Thẻ Hội Viên VIP 3D & NFC', desc: 'Tấm danh thiếp số độc bản đại diện cho uy tín doanh nhân, hỗ trợ chạm NFC truyền danh thiếp và quét mã QR xác thực hồ sơ minh bạch.' },
        { badge: 'MẠNG LƯỚI TINH HOA', title: 'Danh Bạ Doanh Nhân 100+ Lãnh Đạo', desc: 'Tra cứu thông tin chính xác của tất cả thành viên trong CLB, xem năng lực pháp nhân, ngành nghề và nhắn tin trao đổi trực tiếp trên app.' },
        { badge: 'GIAO THƯƠNG ĐO LƯỜNG', title: 'Sàn B2B & Cơ Hội Hợp Tác', desc: 'Đăng tải nhu cầu mua - bán, chia sẻ cơ hội đầu tư, giới thiệu sản phẩm và theo dõi tiến độ chốt giao dịch nội khối minh bạch.' },
        { badge: 'TIỆN ÍCH SỰ KIỆN', title: 'Vé QR Pass & Bầu Cử Đại Hội', desc: 'Quét vé check-in 1s, định vị bàn tiệc VIP, tham gia bỏ phiếu bầu Ban Chấp Hành trực tuyến và quay số may mắn Lucky Draw nhận quà.' }
      ]
    },
    {
      type: 'grid_cards',
      eyebrow: 'MỤC ĐÍCH & GIẢI PHÁP TỔNG THỂ',
      title: 'Đưa Toàn Bộ Hiệp Hội Vào Túi Áo Của Từng Doanh Nhân',
      subtitle: 'Kết nối không giới hạn không gian và thời gian, nâng tầm giá trị sinh hoạt hội viên',
      items: [
        { icon: '⚡', title: 'Truy Cập Nhanh Mọi Lúc Mọi Nơi', desc: 'Chỉ cần một chiếc điện thoại thông minh, doanh nhân có thể nắm bắt toàn bộ hoạt động, lịch họp, thông báo và cơ hội kinh doanh của CLB.' },
        { icon: '🤝', title: 'Kết Nối Kinh Doanh Trực Tiếp', desc: 'Loại bỏ các khâu trung gian, doanh nhân có thể gọi điện, gửi email hoặc chat bảo mật trực tiếp với Chủ tịch các doanh nghiệp thành viên.' },
        { icon: '💎', title: 'Tối Ưu Quyền Lợi Hội Viên', desc: 'Hưởng các chính sách chiết khấu, ưu đãi đặc quyền nội khối khi sử dụng sản phẩm, dịch vụ giữa các doanh nghiệp trong hệ sinh thái CEO 1983.' },
        { icon: '🔔', title: 'Nhắc Lịch & Thông Báo Tức Thì', desc: 'Hệ thống thông báo đẩy (Push Notification) thông minh nhắc nhở lịch họp, sinh nhật hội viên, sự kiện sắp diễn ra và hạn nộp hội phí.' }
      ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG HỘI VIÊN 01',
      title: 'Quy Trình Đăng Ký Gia Nhập Trực Tuyến & Cấp Quyền Tức Thì',
      subtitle: 'Tiếp nhận hồ sơ lãnh đạo doanh nghiệp qua giao diện trực quan, tiện lợi',
      imgFilename: 'app_step_01_landing_reg.png',
      badgeText: 'Biểu mẫu đăng ký gia nhập trực tuyến',
      features: [
      { title: 'Tiếp Nhận Hồ Sơ Doanh Nhân Nhanh Chóng', desc: 'Nhập họ tên, số điện thoại, tên pháp nhân công ty, chức vụ C-Level và mã số thuế.' },
      { title: 'Gửi Dữ Liệu Tức Thì Về Web CRM', desc: 'Hồ sơ tự động đổ về hàng đợi thẩm định của Ban Thư Ký CLB CEO 1983 theo thời gian thực.' },
      { title: 'Nhận Thông Báo Tiến Trình Qua Email', desc: 'Hội viên nhận email xác nhận hồ sơ đã được tiếp nhận và đang trong quá trình xét duyệt.' },
      { title: 'Tự Động Nhận Tài Khoản Khi Được Duyệt', desc: 'Ngay khi Ban Quản Trị bấm duyệt trên CRM, hệ thống tự động gửi mật khẩu khởi tạo về hòm thư.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG HỘI VIÊN 02',
      title: 'Đăng Nhập & Định Danh Doanh Nhân Bảo Mật',
      subtitle: 'Khởi tạo phiên làm việc an toàn với mã hội viên độc bản và mật khẩu bảo mật',
      imgFilename: 'app_step_03_login_screen.png',
      badgeText: 'Màn hình đăng nhập App bảo mật',
      features: [
      { title: 'Đăng Nhập Qua Email Hoặc Số Điện Thoại', desc: 'Linh hoạt cho doanh nhân đăng nhập bằng số điện thoại di động hoặc hòm thư công vụ.' },
      { title: 'Mã Hóa JWT Bearer An Toàn', desc: 'Bảo vệ toàn vẹn phiên làm việc, chống giả mạo danh tính và mã hóa đầu cuối thông tin cá nhân.' },
      { title: 'Định Danh Duy Nhất Theo Mã Hội Viên', desc: 'Mỗi lãnh đạo sở hữu mã số VIP độc bản (M1983-xxx) khẳng định tư cách thành viên chính thức.' },
      { title: 'Tích Hợp Xác Thực Sinh Trắc Học', desc: 'Hỗ trợ FaceID / Vân tay mở ứng dụng nhanh chóng trên các dòng điện thoại iOS & Android.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG HỘI VIÊN 03',
      title: 'Trang Chủ Dashboard Doanh Nhân & Tiện Ích 1-Chạm',
      subtitle: 'Tổng hợp mọi thông tin sinh hoạt, sự kiện và cơ hội hợp tác ngay trong tầm tay',
      imgFilename: 'app_step_04_home_dashboard.png',
      badgeText: 'Dashboard tổng quan',
      features: [
      { title: 'Thẻ VIP Doanh Nhân 3D Tiêu Điểm', desc: 'Thẻ số hóa ánh kim vàng hoàng gia hiển thị họ tên, chức vụ và doanh nghiệp pháp nhân.' },
      { title: 'Thanh Tác Vụ Tiện Ích 1-Chạm', desc: 'Truy cập nhanh: Chạm NFC, Bầu cử, Check-in vé, Đăng bán sản phẩm, Nộp hội phí thường niên.' },
      { title: 'Banner Sự Kiện Sắp Diễn Ra', desc: 'Đếm ngược thời gian đến các kỳ Caravan, Gala Dinner và Cafe Doanh nhân định kỳ.' },
      { title: 'Bản Tin Hoạt Động Cập Nhật Hàng Ngày', desc: 'Nắm bắt các thông báo mới nhất từ Ban Chủ Tịch và Ban Thư Ký CLB CEO 1983.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG HỘI VIÊN 04',
      title: 'Thẻ Định Danh Số Hội Viên VIP GOLD & Tích Hợp Chip NFC',
      subtitle: 'Biểu tượng danh giá khẳng định tư cách lãnh đạo thành viên chính thức CLB CEO 1983',
      imgFilename: 'app_identity_card_vip.png',
      badgeText: 'Thẻ định danh VIP Gold',
      features: [
      { title: 'Thiết Kế Thẻ Hội Viên VIP Gold Độc Bản', desc: 'Tông màu vàng kim hoàng gia sang trọng, gắn ảnh chân dung lãnh đạo, họ tên và doanh nghiệp trực thuộc.' },
      { title: 'Mã Số Hội Viên Độc Nhất (M1983-xxx)', desc: 'Mã định danh duy nhất xác nhận tư cách pháp nhân thành viên chính thức được Ban Thư Ký phê duyệt.' },
      { title: 'Huy Hiệu Tích Xanh Chứng Nhận Lãnh Đạo', desc: 'Dấu tích xanh Verified minh chứng uy tín doanh nhân được Hội Doanh Nhân Trẻ Hà Nội công nhận.' },
      { title: 'Tích Hợp Chip Cảm Ứng Không Tiếp Xúc NFC', desc: 'Chạm điện thoại vào bất kỳ máy quét hoặc điện thoại thông minh nào để mở trang định danh tức thì.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG HỘI VIÊN 05',
      title: 'Danh Thiếp Số Doanh Nhân CEO 1983 (Thẻ Visit Card Lật Mặt Sau)',
      subtitle: 'Thay thế hoàn toàn card visit giấy: Mặt trước thông tin C-Level, mặt sau Brandbook xanh Navy',
      imgFilename: 'app_visit_card_front.png',
      badgeText: 'Danh thiếp số Visit Card mặt trước',
      features: [
      { title: 'Mặt Trước Chuẩn Brandbook Sang Trọng', desc: 'Hiển thị họ tên (Phạm Vũ Nam), chức danh CEO/Sáng lập, công ty, số điện thoại, email và trụ sở doanh nghiệp.' },
      { title: 'Hiệu Ứng Lật Thẻ Visit Card Xem Mặt Sau', desc: 'Nút Lật thẻ chuyển động mượt mà mở mặt sau màu xanh Navy hoàng gia mang slogan CLB CEO 1983.' },
      { title: 'Nút Chia Sẻ & Mã QR Động Kết Nối Nhanh', desc: 'Mở mã QR cá nhân để đối tác quét bằng Zalo/Camera nhận thông tin vCard lưu trực tiếp vào máy.' },
      { title: 'Tùy Biến Cài Đặt Quyền Riêng Tư 1-Chạm', desc: 'Chủ động bật/tắt hiển thị số điện thoại cá nhân, email hoặc địa chỉ theo nhu cầu bảo mật thông tin.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG HỘI VIÊN 06',
      title: 'Quét Mã QR Từ Ứng Dụng Ngoài & Trang Xác Thực Công Khai',
      subtitle: 'Đối tác quét bằng Zalo / Camera iPhone không cần cài app vẫn hiển thị hồ sơ thẩm định 100%',
      imgFilename: 'app_public_qr_scan_view.png',
      badgeText: 'Trang xác thực công khai khi quét QR ngoài',
      features: [
      { title: 'Quét Nhanh Bằng Zalo Hoặc Camera Ngoài', desc: 'Không bắt buộc cài đặt ứng dụng: Mọi camera điện thoại hoặc Zalo đều đọc được mã định danh.' },
      { title: 'Trang Web Xác Thực Công Khai Thẻ Visit Card Sang Trọng', desc: 'Mở giao diện web công khai chuẩn mực với thẻ Visit Card Luxury, ảnh đại diện, chức danh và dấu mộc CLB.' },
      { title: 'Tích Xanh Verified & Dấu Mộc CLB CEO 1983', desc: 'Chứng thực tư cách thành viên chính thức được kiểm định bởi Hội Doanh Nhân Trẻ Hà Nội (HanoiBA).' },
      { title: 'Phím Gọi Điện, Nhắn Zalo & Lưu Danh Bạ vCard', desc: 'Đối tác chỉ cần bấm một nút là lưu thẳng liên hệ vào danh bạ điện thoại hoặc gọi điện trao đổi ngay.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG HỘI VIÊN 07',
      title: 'Hồ Sơ Năng Lực Doanh Nhân 360° & Pháp Nhân Doanh Nghiệp',
      subtitle: 'Khẳng định uy tín thương hiệu cá nhân và năng lực công ty trong mạng lưới',
      imgFilename: 'app_step_06_profile_view.png',
      badgeText: 'Hồ sơ năng lực 360°',
      features: [
      { title: 'Thông Tin Pháp Nhân Doanh Nghiệp Đầy Đủ', desc: 'Hiển thị tên công ty, mã số thuế, địa chỉ trụ sở chính, website và lĩnh vực hoạt động.' },
      { title: 'Tùy Biến Ảnh Đại Diện & Ảnh Bìa Công Ty', desc: 'Dễ dàng tải lên hình ảnh nhận diện thương hiệu doanh nghiệp sắc nét và chuyên nghiệp.' },
      { title: 'Đính Kèm Hồ Sơ Năng Lực & Brochure PDF', desc: 'Hỗ trợ đính kèm tài liệu giới thiệu sản phẩm để các đối tác tiềm năng tải về nghiên cứu.' },
      { title: 'Ghi Nhận Đóng Góp & Danh Hiệu Khen Thưởng', desc: 'Lưu trữ các kỷ niệm chương, giải thưởng doanh nhân tiêu biểu đã được hiệp hội vinh danh.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG HỘI VIÊN 08',
      title: 'Danh Bạ Hội Viên CLB CEO 1983 & Tra Cứu Đối Tác Giao Thương',
      subtitle: 'Kết nối trực tiếp hơn 100+ Chủ tịch và Tổng Giám Đốc sinh năm 1983',
      imgFilename: 'app_step_07_members_directory.png',
      badgeText: 'Danh bạ hội viên',
      features: [
      { title: 'Mạng Lưới Lãnh Đạo Đồng Niên 1983', desc: 'Cộng đồng các nhà sáng lập cùng thế hệ, thấu hiểu tư duy và chia sẻ chung khát vọng phát triển.' },
      { title: 'Bộ Lọc Đa Chiều Theo Ngành Nghề', desc: 'Tìm kiếm đối tác theo lĩnh vực: Xây dựng, Công nghệ, Y tế, Nông nghiệp, Tài chính, Bất động sản.' },
      { title: 'Hồ Sơ Năng Lực Doanh Nghiệp 360°', desc: 'Xem quy mô công ty, mã số thuế, website và các sản phẩm dịch vụ chủ lực của thành viên.' },
      { title: 'Gửi Lời Mời Kết Nối Giao Thương 2 Chiều', desc: 'Thiết lập mối quan hệ đối tác bền vững chỉ bằng nút Kết nối trên ứng dụng.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG HỘI VIÊN 09',
      title: 'Xem Chi Tiết Hồ Sơ Năng Lực Đối Tác & Kết Nối Hợp Tác',
      subtitle: 'Nắm bắt trọn vẹn thông tin đối tác trước khi tiến hành đàm phán kinh doanh',
      imgFilename: 'app_step_08_member_profile_modal.png',
      badgeText: 'Chi tiết đối tác',
      features: [
      { title: 'Xem Đầy Đủ Thông Tin Liên Lạc', desc: 'Tra cứu nhanh số điện thoại di động, hòm thư điện tử, địa chỉ văn phòng của chủ doanh nghiệp.' },
      { title: 'Mở Phòng Chat Giao Thương Trực Tiếp', desc: 'Bấm Nhắn tin: Mở ngay cuộc trò chuyện 1-on-1 với đối tác để trao đổi nhu cầu hợp tác.' },
      { title: 'Tra Cứu Danh Mục Sản Phẩm Cung Cấp', desc: 'Xem toàn bộ các mặt hàng và dịch vụ mà công ty đối tác đang niêm yết trên Marketplace.' },
      { title: 'Lưu Thông Tin Vào Danh Bạ Điện Thoại', desc: 'Tải file danh thiếp vCard lưu thẳng vào danh bạ iPhone/Android chỉ với một cú nhấp chuột.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG HỘI VIÊN 10',
      title: 'Hộp Thư Doanh Nghiệp & Nhắn Tin Chat 1-on-1 Realtime',
      subtitle: 'Trao đổi cơ hội hợp tác, gửi tài liệu báo giá và đàm phán hợp đồng trực tiếp',
      imgFilename: 'app_step_10_chat_conversation.png',
      badgeText: 'Màn hình chat 1-on-1',
      features: [
      { title: 'Trò Chuyện Trực Tiếp Thời Gian Thực', desc: 'Nhắn tin văn bản tốc độ cao giữa hai lãnh đạo doanh nghiệp, không qua bất kỳ trung gian nào.' },
      { title: 'Gửi Tài Liệu, Hợp Đồng & Catalog PDF', desc: 'Đính kèm hình ảnh sản phẩm và tài liệu năng lực công ty trực tiếp trong luồng hội thoại.' },
      { title: 'Chia Sẻ Vị Trí Điểm Hẹn Gặp Gỡ', desc: 'Gửi tọa độ định vị quán cafe hoặc văn phòng doanh nghiệp để hẹn lịch làm việc trực tiếp.' },
      { title: 'Bảo Mật Nội Dung Trò Chuyện Tuyệt Đối', desc: 'Hội thoại được mã hóa trên đường truyền, bảo vệ bí mật kinh doanh của các bên tham gia.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG HỘI VIÊN 11',
      title: 'Lịch Sự Kiện, Diễn Đàn Doanh Nhân & Đăng Ký Vé Tham Dự',
      subtitle: 'Không bỏ lỡ các kỳ Đại hội, Caravan kết nối kinh doanh và Gala thường niên',
      imgFilename: 'app_step_11_events_list.png',
      badgeText: 'Lịch sự kiện',
      features: [
      { title: 'Lịch Trình Chi Tiết Các Hoạt Động CLB', desc: 'Nắm bắt thời gian, địa điểm tổ chức, nội dung chương trình và diễn giả của từng sự kiện.' },
      { title: 'Đặc Quyền Vé Miễn Phí Dành Cho Hội Viên', desc: 'Hội viên chính thức được miễn phí vé tham dự hoặc nhận mức giá ưu đãi đặc biệt.' },
      { title: 'Thanh Toán Vé Đại Biểu Qua VietQR', desc: 'Đối với vé có thu phí, hệ thống cung cấp mã QR chuyển khoản chính xác tới từng đồng.' },
      { title: 'Đồng Bộ Lịch Hẹn Vào Google / Apple Calendar', desc: 'Tự động thêm sự kiện vào lịch cá nhân trên điện thoại kèm nhắc nhở trước 24 giờ.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG HỘI VIÊN 12',
      title: 'Vé Điện Tử Thông Minh & Quét Mã QR Check-in Siêu Tốc 1s',
      subtitle: 'Không lo quên vé giấy, kiểm soát lối vào hội trường chỉ với 1 thao tác quét',
      imgFilename: 'app_step_13_ticket_qr_pass.png',
      badgeText: 'Vé điện tử QR Pass',
      features: [
      { title: 'Tích Hợp Mã QR Động Chống Gian Lận', desc: 'Mã QR được mã hóa theo phiên làm việc, ngăn chặn triệt để hành vi chụp ảnh màn hình chuyển tiếp.' },
      { title: 'Hiển Thị Vị Trí Số Ghế Bàn Tiệc VIP', desc: 'Biết trước chính xác số bàn và vị trí ghế ngồi được Ban Tổ Chức sắp đặt trang trọng.' },
      { title: 'Tốc Độ Quét Cổng Chỉ 1 Giây', desc: 'Đưa màn hình trước máy quét tại bàn lễ tân để hoàn tất thủ tục check-in trong tích tắc.' },
      { title: 'Lưu Trữ Lịch Sử Tham Dự Sự Kiện', desc: 'Xem lại toàn bộ các kỳ đại hội và sự kiện mà doanh nhân đã đồng hành cùng hiệp hội.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG HỘI VIÊN 13',
      title: 'Bầu Cử BCH & Biểu Quyết Tín Nhiệm Trực Tuyến Trên App',
      subtitle: 'Thực thi quyền dân chủ đại hội minh bạch, bảo mật tuyệt đối với giao diện trực quan',
      imgFilename: 'app_voting_mobile_view.png',
      badgeText: 'Giao diện bầu cử tín nhiệm trên Mobile App',
      features: [
      { title: 'Bỏ Phiếu Tín Nhiệm Đại Biểu Trực Tiếp', desc: 'Bầu cử Ban Chấp Hành nhiệm kỳ mới ngay trên màn hình điện thoại với danh sách ứng viên minh bạch.' },
      { title: 'Mã Hóa Phiếu Bầu Chống Gian Lận', desc: 'Mỗi hội viên chỉ được bỏ phiếu một lần duy nhất, kết quả được mã hóa bảo mật danh tính người bầu.' },
      { title: 'Xem Chi Tiết Hồ Sơ & Chương Trình Hành Động', desc: 'Chạm vào tên ứng viên để xem quá trình cống hiến, doanh nghiệp và cam kết hành động trước khi vote.' },
      { title: 'Cập Nhật Tiến Độ Kiểm Phiếu Tức Thì', desc: 'Theo dõi tỷ lệ phần trăm cử tri đã tham gia bỏ phiếu theo thời gian thực trên màn hình ứng dụng.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG HỘI VIÊN 14',
      title: 'Vòng Quay May Mắn Lucky Draw & Nhận Quà Tức Thì',
      subtitle: 'Khuấy động không khí Gala Dinner: Quay số ngẫu nhiên theo mã vé may mắn của hội viên',
      imgFilename: 'crm_lucky_draw_modal.png',
      badgeText: 'Vòng quay Lucky Draw đêm tiệc Gala',
      features: [
      { title: 'Quay Số May Mắn Theo Mã Vé Check-in', desc: 'Toàn bộ hội viên đã check-in vào sự kiện được tự động đưa vào danh sách quay số trúng thưởng.' },
      { title: 'Giải Thưởng Đỉnh Cao VinFast VF3', desc: 'Hồi hộp theo dõi các vòng quay giải Đặc biệt, giải Nhất với quà tặng giá trị cao từ nhà tài trợ.' },
      { title: 'Hiển Thị Thông Báo Trúng Thưởng Trên Màn Hình', desc: 'Hệ thống chúc mừng đích danh hội viên trúng giải (VD: Ngô Bảo Anh - Mã vé #2190).' },
      { title: 'Nhận Thông Báo Push Điện Thoại Trong Tích Tắc', desc: 'Máy rung và hiển thị thông báo trúng giải ngay trong túi áo để doanh nhân lên sân khấu nhận quà.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG HỘI VIÊN 15',
      title: 'Sàn Thương Mại Marketplace & Gian Hàng Doanh Nghiệp',
      subtitle: 'Kênh giới thiệu sản phẩm và dịch vụ uy tín với chính sách ưu đãi nội bộ',
      imgFilename: 'app_step_15_marketplace_grid.png',
      badgeText: 'Sàn Marketplace',
      features: [
      { title: 'Gian Hàng Số Hóa Cho Từng Doanh Nghiệp', desc: 'Mỗi doanh nghiệp hội viên được sở hữu gian hàng trưng bày sản phẩm sản xuất và dịch vụ chủ lực.' },
      { title: 'Chính Sách Chiết Khấu Ưu Đãi VIP', desc: 'Cam kết mức giá ưu đãi đặc quyền giữa các thành viên CEO 1983 so với giá thị trường bên ngoài.' },
      { title: 'Đã Kiểm Duyệt An Toàn Từ Web CRM', desc: 'Toàn bộ mặt hàng đều qua thẩm định xuất xứ và tiêu chuẩn chất lượng từ Ban Quản Trị CLB.' },
      { title: 'Yêu Cầu Báo Giá Sỉ & Hợp Đồng 1-Chạm', desc: 'Doanh nhân gửi yêu cầu báo giá khối lượng lớn trực tiếp tới giám đốc kinh doanh đối tác.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG HỘI VIÊN 16',
      title: 'Sàn Trao Cơ Hội Giao Thương B2B & Tìm Kiếm Đối Tác',
      subtitle: 'Chia sẻ nhu cầu mua sỉ, bán buôn, cung ứng vật tư và kêu gọi vốn đầu tư',
      imgFilename: 'app_step_18_opportunities_feed.png',
      badgeText: 'Cơ hội giao thương B2B',
      features: [
      { title: 'Bảng Tin Trao Đổi Cơ Hội Độc Quyền', desc: 'Nơi doanh nhân công khai nhu cầu mua sắm thiết bị, tìm đại lý phân phối hoặc kết nối chuỗi cung ứng.' },
      { title: 'Khu Vực Cơ Hội Tiêu Điểm Xoay Vòng 2s', desc: 'Hiệu ứng chuyển đổi cơ hội nổi bật mỗi 2 giây thu hút sự chú ý tối đa của toàn thể hội viên.' },
      { title: 'Đón Nhận Cơ Hội (Claim Deal) Nhanh Chóng', desc: 'Nhấn Đón nhận cơ hội để nhận thông tin liên lạc trực tiếp của doanh nhân có nhu cầu.' },
      { title: 'Thống Kê Tổng Giá Trị Giao Thương Đạt Được', desc: 'Ghi nhận thành quả kết nối, vinh danh các doanh nhân tích cực trao cơ hội cho đồng đội.' }
    ]
    },
    {
      type: 'feature',
      eyebrow: 'CHỨC NĂNG HỘI VIÊN 17',
      title: 'Cổng Đóng Hội Phí Thường Niên & Quét Mã VietQR Tự Động',
      subtitle: 'Gia hạn thẻ hội viên trong 30 giây, đối soát tự động không cần gửi hóa đơn',
      imgFilename: 'app_step_20_annual_fee_renewal.png',
      badgeText: 'Đóng hội phí VietQR',
      features: [
      { title: 'Minh Bạch Niên Độ & Hạn Nộp Hội Phí', desc: 'Thông báo rõ ràng số tiền niên liễm, thời hạn gia hạn và quyền lợi duy trì sinh hoạt trong năm.' },
      { title: 'Mã QR Động Chính Xác Tuyệt Đối', desc: 'Mã VietQR tự động điền số tiền và cú pháp chuyển khoản chính xác tới từng ký tự.' },
      { title: 'Gạch Nợ Tự Động Sau 3-5 Giây', desc: 'Ngay khi chuyển khoản thành công, hệ thống tự động gạch nợ và gia hạn hạn dùng thẻ số trên App.' },
      { title: 'Nhận Phiếu Thu Điện Tử Về Hòm Thư', desc: 'Biên lai xác nhận đóng hội phí có chữ ký số được gửi tự động về email doanh nghiệp lưu trữ.' }
    ]
    },
    {
      type: 'grid_cards',
      eyebrow: 'GIÁ TRỊ CHO HỘI VIÊN',
      title: 'Giá Trị Thiết Thực & Đẳng Cấp Cho Doanh Nhân Hội Viên',
      subtitle: 'Nâng cao uy tín thương hiệu cá nhân, mở rộng quan hệ đối tác và gia tăng doanh số',
      items: [
        { num: '01', title: 'Nâng Tầm Thương Hiệu Cá Nhân', desc: 'Sở hữu thẻ danh thiếp số sang trọng, chuyên nghiệp khi tiếp xúc đối tác lớn, khẳng định vị thế thành viên CLB Doanh Nhân CEO 1983.' },
        { num: '02', title: 'Mở Rộng Kênh Phân Phối B2B', desc: 'Tiếp cận ngay lập tức mạng lưới 100+ khách hàng doanh nghiệp tiềm năng sẵn có trong nội khối hiệp hội với độ tin cậy tuyệt đối.' },
        { num: '03', title: 'Trải Nghiệm Sự Kiện Đẳng Cấp 4.0', desc: 'Không cần xếp hàng check-in, vé điện tử luôn sẵn sàng trên điện thoại, chủ động chọn vị trí ngồi danh dự tại các sự kiện quy mô lớn.' },
        { num: '04', title: 'Quyền Lợi Minh Bạch & Thuận Tiện', desc: 'Theo dõi tình trạng đóng hội phí, lịch sử tham gia sự kiện và nhận hóa đơn điện tử tự động nhanh chóng mà không cần thao tác thủ công.' }
      ]
    },
    {
      type: 'grid_cards',
      eyebrow: 'HƯỚNG PHÁT TRIỂN TƯƠNG LAI',
      title: 'Lộ Trình Nâng Cấp Ứng Dụng Di Động Hội Viên 2026 - 2028',
      subtitle: 'Liên tục đổi mới công nghệ nhằm mang lại giá trị gia tăng tối đa cho hội viên',
      items: [
        { badge: 'GIAI ĐOẠN 1 (ĐÃ HOÀN THÀNH)', title: 'Phát Hành Bản Đầy Đủ Đa Nền Tảng', desc: 'Hoàn thiện bản cài Android APK, iOS TestFlight và Web PWA với đầy đủ tính năng: Thẻ VIP, chạm NFC, vé QR check-in và sàn giao dịch B2B.' },
        { badge: 'GIAI ĐOẠN 2 (QUÝ 3 - QUÝ 4/2026)', title: 'Tích Hợp AI Gợi Ý Kết Nối Kinh Doanh', desc: 'AI phân tích nhu cầu tìm kiếm để tự động thông báo đối tác phù hợp nhất; Tích hợp ví Voucher điện tử ưu đãi dịch vụ giữa các doanh nghiệp hội viên.' },
        { badge: 'GIAI ĐOẠN 3 (NĂM 2027)', title: 'Hệ Thống Đào Tạo Trực Tuyến & Podcast', desc: 'Kho bài giảng quản trị doanh nghiệp độc quyền, phát thanh chuỗi Podcast chia sẻ kinh nghiệm kinh doanh của các Chủ tịch tiêu biểu trong CLB.' },
        { badge: 'GIAI ĐOẠN 4 (NĂM 2028)', title: 'Mạng Lưới Giao Thương Đa Ngôn Ngữ', desc: 'Bổ sung giao diện tiếng Anh và kết nối sàn thương mại điện tử liên kết với các hiệp hội doanh nhân trẻ quốc tế trong khu vực ASEAN.' }
      ]
    },
    {
      type: 'conclusion',
      eyebrow: 'ĐỒNG HÀNH CÙNG THÀNH CÔNG CỦA DOANH NHÂN',
      title: 'TỔNG KẾT & KHẲNG ĐỊNH ĐẲNG CẤP HỘI VIÊN',
      subtitle: 'Gắn kết chân tình · Hợp tác tin cậy · Phát triển thịnh vượng cùng cộng đồng CEO 1983',
      values: [
        { t: 'Định Vị Thương Hiệu Đẳng Cấp', d: 'Mỗi hội viên sở hữu một tấm danh thiếp số độc bản và quyền tiếp cận hệ sinh thái kinh doanh chất lượng cao.' },
        { t: 'Cơ Hội Kinh Doanh Không Giới Hạn', d: 'Mạng lưới nội bộ vững chắc giúp doanh nghiệp mở rộng thị trường, tối ưu chi phí và tăng trưởng doanh thu.' },
        { t: 'Tiên Phong Chuyển Đổi Số', d: 'Tự hào là những nhà lãnh đạo thế hệ 1983 tiên phong ứng dụng công nghệ hiện đại vào quản trị và kết nối.' }
      ]
    },
    {
      type: 'thank_you',
      badge: 'ĐỒNG HÀNH & KẾT NỐI VƯƠN XA',
      title: 'XIN TRÂN TRỌNG CẢM ƠN!',
      subtitle: 'Kính Chúc Quý Hội Viên Kết Nối Thành Công & Đón Nhận Trọn Vẹn Giá Trị Số Hóa',
      slogan: '"TIÊN PHONG CHUYỂN ĐỔI SỐ · GẮN KẾT VƯƠN XA"',
      cards: [
        {
          icon: '📱',
          title: 'CÀI ĐẶT ỨNG DỤNG NGAY',
          sub: 'Khả dụng trên iOS & Android',
          desc: 'Trải nghiệm thẻ VIP số, chạm NFC danh thiếp thông minh và khám phá danh bạ kết nối 100+ doanh nhân.'
        },
        {
          icon: '💬',
          title: 'HỎI ĐÁP & CHIA SẺ (Q&A)',
          sub: 'Lắng nghe phản hồi từ hội viên',
          desc: 'Mọi ý kiến đóng góp của Quý Doanh nhân là động lực để Ban Thư Ký liên tục nâng cấp và tối ưu hóa trải nghiệm.'
        },
        {
          icon: '🤝',
          title: 'KẾT NỐI BAN THƯ KÝ',
          sub: 'Hỗ trợ kỹ thuật thẻ 24/7',
          desc: 'Hỗ trợ cấp lại mã hội viên M1983-xxx, cài đặt thẻ visit card, chia sẻ danh bạ và tham gia 7 Ban ngành chuyên trách.'
        }
      ]
    }
  ];

  const htmlApp = renderDeckHtml('Thuyết Trình Ứng Dụng Di Động Hiệp Hội - CLB Doanh Nhân CEO 1983', 'Ứng Dụng Di Động Hiệp Hội', appSlides, true);
  const outHtmlApp = path.join(OUT_DIR, 'SLIDE_THUYET_TRINH_APP_HIEP_HOI_CEO1983.html');
  fs.writeFileSync(outHtmlApp, htmlApp, 'utf8');
  fs.writeFileSync(path.join(FE_DOCS_DIR, 'SLIDE_THUYET_TRINH_APP_HIEP_HOI_CEO1983.html'), htmlApp, 'utf8');
  console.log(`✓ Đã tạo HTML App thành công: ${outHtmlApp}`);
}

async function main() {
  console.log('=== BẮT ĐẦU TẠO TOÀN BỘ SLIDE THUYẾT TRÌNH (CHUẨN MÀU THEO YÊU CẦU - ZERO URL) ===');
  await generateCrmPptx();
  await generateAppPptx();
  generateHtmlSlides();
  console.log('=== HOÀN TẤT TẤT CẢ SLIDE CHUẨN ĐẸP 100% ===');
}

main().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
