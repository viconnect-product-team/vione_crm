const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'document');
const EVIDENCE_DIR = path.join(OUT_DIR, 'images', 'evidence');
const FE_DOCS_DIR = path.join(__dirname, '..', 'apps', 'vione_app_fe', 'public', 'docs');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(FE_DOCS_DIR)) fs.mkdirSync(FE_DOCS_DIR, { recursive: true });

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
  // Try scripts captures as fallback
  const alt1 = path.join(__dirname, 'app_captures', name);
  if (fs.existsSync(alt1)) return `image/png;base64,${fs.readFileSync(alt1).toString('base64')}`;
  const alt2 = path.join(__dirname, 'crm_captures', name);
  if (fs.existsSync(alt2)) return `image/png;base64,${fs.readFileSync(alt2).toString('base64')}`;
  return null;
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

function addSlideFooter(slide, pres, systemLabel, isDark = false) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 7.0, w: 11.73, h: 0.02,
    fill: { color: isDark ? '2A3E66' : C.BORDER_SUBTLE }
  });
  slide.addText(`${systemLabel} · CLB Doanh Nhân CEO 1983 · HanoiBA`, {
    x: 0.8, y: 7.05, w: 7.5, h: 0.3,
    color: isDark ? '94A3B8' : C.TEXT_MUTED, fontSize: 9.5, fontFace: 'Calibri'
  });
  slide.addText('Bản Quyền © 2026 CLB Doanh Nhân CEO 1983 · ceo1983.com', {
    x: 8.5, y: 7.05, w: 4.03, h: 0.3,
    color: isDark ? '94A3B8' : C.TEXT_MUTED, fontSize: 9.5, align: 'right', fontFace: 'Calibri'
  });
}

// =============================================================================
// DECK 1: 16 SLIDES - APP HIỆP HỘI CLB DOANH NHÂN CEO 1983
// =============================================================================
async function generateAppDeck() {
  console.log('>>> Building 16-Slide App Presentation (SLIDE_THUYET_TRINH_APP_HIEP_HOI_CEO1983)...');
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.title = 'Thuyết Trình Ứng Dụng Di Động Hiệp Hội - CLB Doanh Nhân CEO 1983';
  pres.author = 'Ban Thư Ký CLB Doanh Nhân CEO 1983';
  pres.company = 'CLB Doanh Nhân CEO 1983 · HanoiBA';

  const SYS_LABEL = 'Ứng Dụng Di Động Hiệp Hội';

  // SLIDE 1: COVER
  {
    const slide = pres.addSlide();
    slide.background = { color: C.NAVY_DARK };
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.12, fill: { color: C.GOLD_ACCENT } });

    slide.addShape(pres.ShapeType.rect, {
      x: 1.0, y: 1.1, w: 5.6, h: 0.4,
      fill: { color: C.NAVY_CARD }, line: { color: C.GOLD_ACCENT, width: 1.5 }, roundRadio: 0.1
    });
    slide.addText('ỨNG DỤNG DI ĐỘNG HIỆP HỘI THỜI KỲ SỐ', {
      x: 1.0, y: 1.1, w: 5.6, h: 0.4,
      color: C.GOLD_ACCENT, bold: true, fontSize: 11, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });

    slide.addText('CLB DOANH NHÂN CEO 1983', {
      x: 1.0, y: 1.7, w: 11.33, h: 1.0,
      color: C.WHITE, bold: true, fontSize: 34, fontFace: 'Calibri'
    });
    slide.addText('Không Gian Số Hội Viên Đẳng Cấp: Thẻ VIP 3D · Chạm Thẻ NFC · Giao Thương B2B · Vé Số Hóa', {
      x: 1.0, y: 2.7, w: 11.33, h: 0.6,
      color: 'CBD5E1', fontSize: 15, fontFace: 'Calibri'
    });

    const pillars = [
      { num: '01', title: 'Thẻ VIP & NFC 1 Chạm', desc: 'Thẻ hội viên số hóa chuẩn quốc tế, tích hợp chip NFC chạm trao danh thiếp ngay trên điện thoại.' },
      { num: '02', title: 'Sàn Trao Đổi Cơ Hội B2B', desc: 'Chia sẻ nhu cầu mua bán sỉ, kết nối cung ứng và kêu gọi đầu tư trực tiếp giữa các doanh nhân.' },
      { num: '03', title: 'Sự Kiện & Check-in QR', desc: 'Xem lịch đại hội, đăng ký vé qua VietQR tự động, quét mã QR vào cửa trong 1 giây tại sự kiện.' },
      { num: '04', title: 'Đồng Bộ Realtime CRM', desc: 'Tách biệt giao diện chuyên dụng cho hội viên nhưng liên kết 100% dữ liệu vận hành từ Web CRM Quản trị.' },
    ];
    pillars.forEach((p, idx) => {
      const x = 1.0 + idx * 2.9;
      slide.addShape(pres.ShapeType.rect, {
        x, y: 3.6, w: 2.7, h: 2.5, fill: { color: C.NAVY_CARD }, line: { color: '2A3E66', width: 1.2 }, roundRadio: 0.12
      });
      slide.addText(p.num, { x: x + 0.2, y: 3.8, w: 0.8, h: 0.4, color: C.GOLD_ACCENT, bold: true, fontSize: 20, fontFace: 'Calibri' });
      slide.addText(p.title, { x: x + 0.2, y: 4.3, w: 2.3, h: 0.4, color: C.WHITE, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(p.desc, { x: x + 0.2, y: 4.75, w: 2.3, h: 1.2, color: '94A3B8', fontSize: 10.5, fontFace: 'Calibri' });
    });

    slide.addText('CLB Doanh Nhân CEO 1983 · Trực thuộc Hội Doanh Nhân Trẻ Hà Nội (HanoiBA) · ceo1983.com', {
      x: 1.0, y: 6.7, w: 11.33, h: 0.4, color: '64748B', fontSize: 11, italic: true, fontFace: 'Calibri'
    });
  }

  // SLIDE 2: ĐĂNG NHẬP & BẢO MẬT
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'CỔNG VÀO HỘI VIÊN', 'Đăng Nhập Bảo Mật & Xác Thực Danh Tính Hội Viên', 'Hệ thống định danh an toàn qua Số điện thoại / Email kết hợp mã hóa JWT thời gian thực');

    const img = getImageBase64('app_01_login_screen.png');
    if (img) {
      slide.addImage({ data: img, x: 0.8, y: 2.0, w: 3.2, h: 4.8, rounding: true });
    }

    const feats = [
      { t: 'Định Danh Chuẩn Xác Theo Mã Hội Viên', d: 'Mỗi hội viên được cấp 1 tài khoản duy nhất gắn liền với mã định danh độc bản (VD: M1983-002).' },
      { t: 'Đăng Nhập 1 Chạm Nhanh Chóng', d: 'Hỗ trợ lưu phiên làm việc bảo mật, không cần đăng nhập lại khi mở App hàng ngày trên thiết bị tin cậy.' },
      { t: 'Đồng Bộ Phân Quyền Tức Thì Từ CRM', d: 'Ngay khi Ban Thư Ký phê duyệt hồ sơ trên CRM, hội viên có thể đăng nhập ngay mà không có độ trễ.' },
      { t: 'Bảo Mật Cấp Doanh Nghiệp', d: 'Mã hóa HTTPS 100% trên toàn bộ luồng trao đổi dữ liệu, chống rò rỉ thông tin cá nhân và số liên lạc VIP.' },
    ];
    feats.forEach((f, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 4.3, y, w: 8.2, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`✔ ${f.t}`, { x: 4.5, y: y + 0.12, w: 7.8, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(f.d, { x: 4.5, y: y + 0.48, w: 7.8, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 3: DASHBOARD TỔNG QUAN
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'KHÔNG GIAN HỘI VIÊN', 'Dashboard Tổng Quan & Bảng Tin Sinh Hoạt Hội', 'Trung tâm trải nghiệm số toàn diện: Tin tức nổi bật, sự kiện sắp diễn ra và tiện ích truy cập nhanh');

    const img = getImageBase64('app_02_home_dashboard.png');
    if (img) {
      slide.addImage({ data: img, x: 0.8, y: 2.0, w: 3.2, h: 4.8, rounding: true });
    }

    const items = [
      { t: 'Banner Sự Kiện Tiêu Điểm', d: 'Hiển thị các sự kiện lớn nhất của CLB CEO 1983 (Gala kỷ niệm, Hội nghị xúc tiến đầu tư, Caravan kết nối).' },
      { t: 'Menu Tiện Ích Truy Cập 1 Chạm', d: 'Truy cập siêu tốc: Thẻ số, Cơ hội, Sản phẩm, Điểm danh QR, Tài liệu nội bộ và Danh bạ Ban Điều Hành.' },
      { t: 'Widget Điểm Danh Sự Kiện Nhanh', d: 'Tự động nhắc nhở khi đến ngày diễn ra sự kiện, mở ngay mã vé QR Pass để qua cổng soát vé.' },
      { t: 'Thông Báo Tức Thời Từ Ban Thư Ký', d: 'Nhận thông báo đẩy về các chủ trương, thông tư, tài liệu mật hoặc cơ hội cấp thiết của CLB.' },
    ];
    items.forEach((it, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 4.3, y, w: 8.2, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`📌 ${it.t}`, { x: 4.5, y: y + 0.12, w: 7.8, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(it.d, { x: 4.5, y: y + 0.48, w: 7.8, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 4: THẺ HỘI VIÊN VIP 3D
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'ĐỊNH DANH ĐẲNG CẤP', 'Thẻ Hội Viên VIP Số Hóa & Danh Thiếp Doanh Nhân', 'Chiếc thẻ quyền năng khẳng định uy tín thương hiệu cá nhân và doanh nghiệp trong mạng lưới CEO');

    const img = getImageBase64('sub_13_app_vip_card_front.png');
    if (img) {
      slide.addImage({ data: img, x: 0.8, y: 2.0, w: 5.5, h: 4.8, rounding: true });
    }

    const pts = [
      { t: 'Thiết Kế Hoàng Gia Sang Trọng', d: 'Tông màu Xanh Navy & Vàng Gold kim loại danh giá, hiển thị logo CLB Doanh Nhân CEO 1983 chính thức.' },
      { t: 'Tích Hợp Mã QR Xác Thực Trực Tuyến', d: 'Quét mã mở ngay trang hồ sơ chứng nhận hội viên công khai tại địa chỉ web chính thức ceo1983.com.' },
      { t: 'Tùy Biến Giao Diện Cá Nhân Hóa', d: 'Cho phép hội viên cập nhật ảnh đại diện, chức danh, tên công ty và các liên kết mạng xã hội doanh nghiệp.' },
      { t: 'Tương Thích Apple & Google Wallet', d: 'Khả năng xuất thẻ ra ví điện tử Apple Wallet và Google Wallet để xuất trình nhanh tại các sự kiện đối ngoại.' },
    ];
    pts.forEach((p, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 6.6, y, w: 5.9, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`💳 ${p.t}`, { x: 6.8, y: y + 0.12, w: 5.5, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(p.d, { x: 6.8, y: y + 0.48, w: 5.5, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 5: CHẠM THẺ NFC & CHIA SẺ DANH THIẾP
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'CÔNG NGHỆ CHẠM THÔNG MINH', 'Công Nghệ Chạm Thẻ NFC 1 Chạm & Danh Thiếp Số', 'Không còn in danh thiếp giấy: Chạm nhẹ điện thoại trao trọn vẹn thông tin doanh nghiệp trong 1 giây');

    const img1 = getImageBase64('sub_14_app_nfc_radar_modal.png');
    const img2 = getImageBase64('sub_15_app_public_digital_card.png');
    if (img1) slide.addImage({ data: img1, x: 0.8, y: 2.0, w: 2.8, h: 4.8, rounding: true });
    if (img2) slide.addImage({ data: img2, x: 3.8, y: 2.0, w: 2.8, h: 4.8, rounding: true });

    const nfcSteps = [
      { t: 'Ghi Dữ Liệu Lên Thẻ Vật Lý NFC', d: 'Hội viên có thể tự ghi link hồ sơ số hóa vào thẻ vật lý gắn chip NFC trực tiếp qua ứng dụng.' },
      { t: 'Trao Danh Thiếp Không Cần Cài App', d: 'Đối tác chỉ cần chạm lưng điện thoại vào thẻ là tự động mở trang web danh thiếp đầy đủ thông tin.' },
      { t: 'Lưu Danh Bạ Điện Thoại Tự Động (vCard)', d: '1 nút bấm "Lưu danh bạ" tải toàn bộ Hotline, Email, Công ty vào danh bạ điện thoại của đối tác.' },
      { t: 'Bảo Mật Quyền Riêng Tư Tùy Biến', d: 'Hội viên chủ động bật/tắt hiển thị số điện thoại cá nhân hoặc doanh nghiệp tùy theo mong muốn.' },
    ];
    nfcSteps.forEach((s, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 6.9, y, w: 5.6, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`📡 ${s.t}`, { x: 7.1, y: y + 0.12, w: 5.2, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(s.d, { x: 7.1, y: y + 0.48, w: 5.2, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 6: DANH BẠ HỘI VIÊN & KẾT NỐI
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'MẠNG LƯỚI TIN CẬY', 'Danh Bạ Doanh Nhân & Kết Nối Đối Tác Tin Cậy', 'Tra cứu hơn 500+ chủ doanh nghiệp thuộc CLB CEO 1983 theo ngành nghề, khu vực và quy mô');

    const img = getImageBase64('app_12_members_directory.png');
    if (img) slide.addImage({ data: img, x: 0.8, y: 2.0, w: 3.2, h: 4.8, rounding: true });

    const dirFeats = [
      { t: 'Bộ Lọc Ngành Nghề Đa Chiều', d: 'Tìm kiếm chính xác các doanh nghiệp trong các mảng Bất động sản, Xây dựng, Công nghệ, Nông nghiệp, Y tế.' },
      { t: 'Hồ Sơ Năng Lực Doanh Nghiệp Đầy Đủ', d: 'Xem chi tiết sản phẩm chủ lực, doanh thu, quy mô nhân sự và kinh nghiệm của từng chủ tịch/CEO.' },
      { t: 'Kết Nối & Trao Đổi Ngay Trên App', d: 'Gửi lời mời kết nối, gọi điện thoại trực tiếp hoặc nhắn tin thảo luận hợp tác không qua trung gian.' },
      { t: 'Huy Hiệu Xác Thực Hội Viên Chính Thức', d: 'Dấu tích xanh xác minh doanh nghiệp đã được Ban Quản Trị CLB CEO 1983 thẩm định uy tín.' },
    ];
    dirFeats.forEach((df, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 4.3, y, w: 8.2, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`🤝 ${df.t}`, { x: 4.5, y: y + 0.12, w: 7.8, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(df.d, { x: 4.5, y: y + 0.48, w: 7.8, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 7: TRAO CƠ HỘI GIAO THƯƠNG B2B
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'XÚC TIẾN THƯƠNG MẠI', 'Sàn Trao Cơ Hội Kinh Doanh & Kêu Gọi Đầu Tư', 'Giao diện mới với khu vực Cơ hội nổi bật chuyển ảnh 2 giây/lần, phân loại Deal rõ ràng và minh bạch');

    const img = getImageBase64('app_10_opportunities_feed.png');
    if (img) slide.addImage({ data: img, x: 0.8, y: 2.0, w: 3.2, h: 4.8, rounding: true });

    const oppFeats = [
      { t: 'Spotlight Tự Động Xoay Vòng 2s', d: 'Banner cơ hội nổi bật xoay vòng ảnh cứ 2 giây một lần, giúp các cơ hội giá trị cao luôn tiếp cận tối đa hội viên.' },
      { t: 'Phân Loại Nhu Cầu Chuẩn Quốc Tế', d: 'Tách biệt rõ: Hợp tác B2B, Kêu gọi đầu tư & vốn, Cung ứng nguyên vật liệu, Xuất nhập khẩu.' },
      { t: 'Hiển Thị Giá Trị Deal Minh Bạch', d: 'Định dạng tiền tệ chuẩn VNĐ (Tỷ đ, Triệu đ) có thẩm định từ hệ thống CRM và Ban Xúc Tiến Thương Mại.' },
      { t: 'Nút "Bày Tỏ Quan Tâm" Tức Thì', d: 'Chủ cơ hội nhận ngay danh sách hội viên bấm quan tâm kèm số điện thoại để xúc tiến đàm phán ký kết.' },
    ];
    oppFeats.forEach((of, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 4.3, y, w: 8.2, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`⭐ ${of.t}`, { x: 4.5, y: y + 0.12, w: 7.8, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(of.d, { x: 4.5, y: y + 0.48, w: 7.8, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 8: CHỢ SẢN PHẨM & DỊCH VỤ HỘI VIÊN
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'MARKETPLACE B2B', 'Chợ Sản Phẩm & Dịch Vụ Hội Viên CLB CEO 1983', 'Ưu tiên người Việt dùng hàng Việt, doanh nhân trong CLB ưu tiên sử dụng sản phẩm dịch vụ của nhau');

    const img = getImageBase64('app_08_products_grid.png');
    if (img) slide.addImage({ data: img, x: 0.8, y: 2.0, w: 3.2, h: 4.8, rounding: true });

    const prodFeats = [
      { t: 'Gian Hàng Sản Phẩm Doanh Nghiệp', d: 'Đăng tải không giới hạn hình ảnh, thông số kỹ thuật, catalogue và chính sách giá ưu đãi nội bộ CLB.' },
      { t: 'Chính Sách Chiết Khấu Đặc Quyền', d: 'Dành riêng mức giảm giá và hậu mãi tốt nhất cho các hội viên chính thức của CLB Doanh Nhân CEO 1983.' },
      { t: 'Cơ Chế Phê Duyệt An Toàn Từ CRM', d: 'Sản phẩm sau khi đăng được kiểm duyệt qua CRM để đảm bảo chất lượng, chứng từ pháp lý và xuất xứ.' },
      { t: 'Đặt Hàng & Kết Nối Mua Sỉ 1 Chạm', d: 'Hội viên có thể bấm "Yêu cầu báo giá" hoặc gọi Hotline đại diện nhà sản xuất ngay trong giao diện.' },
    ];
    prodFeats.forEach((pf, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 4.3, y, w: 8.2, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`🛍️ ${pf.t}`, { x: 4.5, y: y + 0.12, w: 7.8, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(pf.d, { x: 4.5, y: y + 0.48, w: 7.8, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 9: SỰ KIỆN & LỊCH SINH HOẠT HỘI
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'SINH HOẠT ĐỈNH CAO', 'Quản Lý Sự Kiện, Lịch Hội Thảo & Đăng Ký Vé', 'Cập nhật lịch trình Caravan, Gala Dinner, Cafe Doanh Nhân và Đào tạo chuyên sâu của Hiệp hội');

    const img = getImageBase64('app_04_events_list.png');
    if (img) slide.addImage({ data: img, x: 0.8, y: 2.0, w: 3.2, h: 4.8, rounding: true });

    const evtFeats = [
      { t: 'Lịch Trình Chi Tiết & Diễn Giả', d: 'Xem thời gian, địa điểm tổ chức, thông tin các diễn giả khách mời VIP và sơ đồ chỉ đường Google Maps.' },
      { t: 'Đăng Ký Tham Gia Vé Miễn Phí / Có Phí', d: 'Hệ thống tự nhận diện hội viên để áp dụng vé miễn phí hoặc tính phí ưu đãi thành viên CLB.' },
      { t: 'Thanh Toán VietQR Tự Động', d: 'Mã VietQR động tạo tức thì có mã vé trong nội dung chuyển khoản, kích hoạt vé tự động không cần gửi bill thủ công.' },
      { t: 'Đếm Ngược & Nhắc Lịch Thông Minh', d: 'Hệ thống nhắc hẹn sự kiện tự động trước 24h và 2h để hội viên sắp xếp thời gian tham dự chu đáo.' },
    ];
    evtFeats.forEach((ef, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 4.3, y, w: 8.2, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`📅 ${ef.t}`, { x: 4.5, y: y + 0.12, w: 7.8, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(ef.d, { x: 4.5, y: y + 0.48, w: 7.8, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 10: VÉ ĐIỆN TỬ & ĐIỂM DANH CHECK-IN QR
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'ĐIỂM DANH THÔNG MINH', 'Vé Điện Tử Thông Minh & Check-in QR Siêu Tốc', 'Xóa bỏ danh sách giấy điểm danh: Soát vé tại cửa trong 1 giây, kiểm soát 1000+ khách mượt mà');

    const img1 = getImageBase64('app_06_event_ticket_pass.png');
    const img2 = getImageBase64('app_07_vietqr_payment_modal.png');
    if (img1) slide.addImage({ data: img1, x: 0.8, y: 2.0, w: 2.8, h: 4.8, rounding: true });
    if (img2) slide.addImage({ data: img2, x: 3.8, y: 2.0, w: 2.8, h: 4.8, rounding: true });

    const passFeats = [
      { t: 'Mã QR Pass Mã Hóa Chống Giả Mạo', d: 'Mỗi vé phát hành có mã token bảo mật thay đổi theo phiên, ngăn chặn hoàn toàn chụp màn hình chuyển nhượng trái phép.' },
      { t: 'Soát Vé Offline & Realtime', d: 'Ban Lễ Tân quét mã bằng camera điện thoại, hệ thống xác thực tức thì và báo âm thanh thành công.' },
      { t: 'Tự Động Cấp Số Ghế & Bàn Tiệc', d: 'Vé hiển thị chính xác vị trí bàn (Bàn VIP 1, Bàn 1983-A) theo sơ đồ rạp đã xếp trên CRM.' },
      { t: 'Tự Động Kích Hoạt Quyền Bầu Cử & Quay Số', d: 'Hội viên check-in thành công sẽ tự động được đưa vào danh sách hợp lệ để quay số trúng thưởng.' },
    ];
    passFeats.forEach((pf, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 6.9, y, w: 5.6, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`🎟️ ${pf.t}`, { x: 7.1, y: y + 0.12, w: 5.2, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(pf.d, { x: 7.1, y: y + 0.48, w: 5.2, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 11: BẦU CỬ & QUAY SỐ MAY MẮN
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'TƯƠNG TÁC ĐẠI HỘI', 'Bầu Cử Trực Tuyến & Quay Số May Mắn Sự Kiện', 'Tính năng công nghệ tương tác trực tiếp: Bỏ phiếu tín nhiệm minh bạch và Lucky Draw sôi động tại Gala');

    const img = getImageBase64('15_app_live_voting.png');
    if (img) slide.addImage({ data: img, x: 0.8, y: 2.0, w: 3.2, h: 4.8, rounding: true });

    const voteFeats = [
      { t: 'Bỏ Phiếu Bầu Cử Trực Tuyến Minh Bạch', d: 'Bầu cử Ban Chấp Hành, biểu quyết nghị quyết đại hội trực tiếp trên điện thoại, thống kê kết quả % thời gian thực.' },
      { t: 'Kiểm Soát Quyền Biểu Quyết Theo Tư Cách', d: 'Chỉ hội viên chính thức đã hoàn thành nghĩa vụ niên liễm và đã check-in vào sự kiện mới được bỏ phiếu.' },
      { t: 'Vòng Quay Lucky Draw Hồi Hộp', d: 'Hệ thống chọn ngẫu nhiên mã số hội viên may mắn, trình chiếu màn hình LED sân khấu và nổ chuông chúc mừng.' },
      { t: 'Lưu Trữ Biên Bản Điện Tử Bất Biến', d: 'Toàn bộ lịch sử biểu quyết được mã hóa lưu vết trên hệ thống để phục vụ đối soát nghị quyết chính thức.' },
    ];
    voteFeats.forEach((vf, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 4.3, y, w: 8.2, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`🗳️ ${vf.t}`, { x: 4.5, y: y + 0.12, w: 7.8, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(vf.d, { x: 4.5, y: y + 0.48, w: 7.8, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 12: TIN NHẮN & KÊNH TRAO ĐỔI NỘI BỘ
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'KẾT NỐI KHÔNG GIỚI HẠN', 'Hộp Thư Doanh Nghiệp & Nhắn Tin 1-1 / Nhóm', 'Kênh liên lạc chuyên nghiệp độc quyền dành cho các nhà lãnh đạo, không lo trôi tin nhắn quan trọng');

    const img1 = getImageBase64('app_14_messages_inbox.png');
    const img2 = getImageBase64('app_15_chat_messenger_thread.png');
    if (img1) slide.addImage({ data: img1, x: 0.8, y: 2.0, w: 2.8, h: 4.8, rounding: true });
    if (img2) slide.addImage({ data: img2, x: 3.8, y: 2.0, w: 2.8, h: 4.8, rounding: true });

    const chatFeats = [
      { t: 'Trò Chuyện 1-1 Kín Đáo & Bảo Mật', d: 'Gửi tin nhắn riêng tư, trao đổi các điều khoản hợp đồng B2B nhạy cảm giữa hai lãnh đạo doanh nghiệp.' },
      { t: 'Nhóm Thảo Luận Chuyên Đề & Ban Bệ', d: 'Tạo nhóm theo Ban (Ban Tài chính, Ban Xúc tiến, Ban Truyền thông) hoặc nhóm dự án đầu tư cụ thể.' },
      { t: 'Chia Sẻ Hồ Sơ, Hợp Đồng & Vị Trí', d: 'Đính kèm tệp PDF tài liệu, hình ảnh chào hàng và ghim vị trí cuộc hẹn giao thương thuận tiện.' },
      { t: 'Không Bị Spam Bởi Người Ngoài', d: 'Chỉ các hội viên đã được xác thực trong mạng lưới CLB CEO 1983 mới có thể nhắn tin cho nhau.' },
    ];
    chatFeats.forEach((cf, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 6.9, y, w: 5.6, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`💬 ${cf.t}`, { x: 7.1, y: y + 0.12, w: 5.2, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(cf.d, { x: 7.1, y: y + 0.48, w: 5.2, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 13: QUẢN TRỊ HỒ SƠ & TIỆN ÍCH CÁ NHÂN
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'CÁ NHÂN HÓA TRẢI NGHIỆM', 'Quản Trị Hồ Sơ Cá Nhân & Cài Đặt Bảo Mật', 'Chủ động quản lý thông tin đại diện, cập nhật avatar trực tuyến và cấu hình quyền riêng tư thẻ số');

    const img = getImageBase64('sub_43_app_profile_menu.png');
    if (img) slide.addImage({ data: img, x: 0.8, y: 2.0, w: 3.2, h: 4.8, rounding: true });

    const profFeats = [
      { t: 'Cập Nhật Avatar & Ảnh Bìa Danh Thiếp', d: 'Hệ thống lưu trữ ảnh MinIO HTTPS tự động nén kích thước, đảm bảo tải siêu tốc trên mọi mạng di động.' },
      { t: 'Chỉnh Sửa Hồ Sơ Năng Lực & Kinh Nghiệm', d: 'Bổ sung chức danh mới, thành tựu giải thưởng, thông tin website và hotline kinh doanh của doanh nghiệp.' },
      { t: 'Lịch Sử Tham Gia Hoạt Động CLB', d: 'Theo dõi hành trình sinh hoạt: Các sự kiện đã tham gia, các giao thương đã kết nối và điểm cống hiến.' },
      { t: 'Quản Lý Mật Khẩu & Phiên Đăng Nhập', d: 'Đổi mật khẩu bảo mật, xem danh sách thiết bị đang đăng nhập và đăng xuất từ xa khi cần thiết.' },
    ];
    profFeats.forEach((pf, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 4.3, y, w: 8.2, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`⚙️ ${pf.t}`, { x: 4.5, y: y + 0.12, w: 7.8, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(pf.d, { x: 4.5, y: y + 0.48, w: 7.8, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 14: LIÊN KẾT ĐỒNG BỘ: HẠ TẦNG QUẢN TRỊ CRM VẬN HÀNH (REQUIREMENT 5 - CRITICAL)
  {
    const slide = pres.addSlide();
    addSlideHeader(
      slide,
      pres,
      'HẠ TẦNG QUẢN TRỊ VẬN HÀNH',
      'Liên Kết Đồng Bộ: Hệ Thống Web CRM Vận Hành Phía Sau',
      'Tuy tách biệt hoàn toàn về giao diện người dùng, App Hiệp hội và Web CRM liên kết 100% chức năng & dữ liệu thời gian thực'
    );

    const crmImg1 = getImageBase64('crm_02_dashboard_kpi.png');
    const crmImg2 = getImageBase64('04_crm_members_management.png');

    if (crmImg1) slide.addImage({ data: crmImg1, x: 0.8, y: 2.0, w: 5.6, h: 2.35, rounding: true });
    if (crmImg2) slide.addImage({ data: crmImg2, x: 0.8, y: 4.45, w: 5.6, h: 2.35, rounding: true });

    const synPoints = [
      {
        t: 'Tách Biệt Giao Diện - Tối Ưu Hóa Từng Trải Nghiệm',
        d: 'Mobile App thiết kế tối ưu chạm vuốt, tiện ích bỏ túi cho Hội viên. Web CRM thiết kế dạng Dashboard chuyên sâu đa màn hình cho Ban Quản Trị.',
        icon: '🖥️'
      },
      {
        t: 'Hội Viên Thao Tác -> CRM Tiếp Nhận & Thẩm Định',
        d: 'Hội viên đăng ký thẻ, đăng cơ hội kinh doanh, đăng sản phẩm hay mua vé sự kiện trên App -> Dữ liệu đổ về CRM tức thì để Ban Thư Ký xét duyệt.',
        icon: '⚡'
      },
      {
        t: 'CRM Phê Duyệt -> Đẩy Tức Thời Xuống Mobile App',
        d: 'Khi CRM duyệt cấp thẻ VIP, mở bán vé sự kiện hay thông qua cơ hội B2B -> Tự động kích hoạt quyền lợi và thông báo đẩy xuống App hội viên ngay lập tức.',
        icon: '🔄'
      },
      {
        t: 'Cơ Sở Dữ Liệu Đồng Nhất & Bảo Mật Tuyệt Đối',
        d: 'Cùng chung hạ tầng Database PostgreSQL chuyên nghiệp, không sao chép dữ liệu rời rạc, chống sai lệch thông tin hội viên giữa các phòng ban.',
        icon: '🛡️'
      },
    ];

    synPoints.forEach((sp, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, {
        x: 6.7, y, w: 5.8, h: 1.05,
        fill: { color: C.WHITE }, line: { color: C.GOLD_ACCENT, width: 1.2 }, roundRadio: 0.08
      });
      slide.addText(`${sp.icon} ${sp.t}`, {
        x: 6.9, y: y + 0.12, w: 5.4, h: 0.35,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 12.5, fontFace: 'Calibri'
      });
      slide.addText(sp.d, {
        x: 6.9, y: y + 0.48, w: 5.4, h: 0.5,
        color: C.TEXT_BODY, fontSize: 10.5, fontFace: 'Calibri'
      });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 15: BẢO MẬT & KIẾN TRÚC KỸ THUẬT
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'AN TOÀN THÔNG TIN', 'Kiến Trúc Kỹ Thuật Hiện Đại & Chuẩn Bảo Mật HTTPS', 'Hạ tầng microservices container hóa trên Docker, mã hóa SSL toàn diện cho cả Web và Ứng dụng di động');

    const techCards = [
      { t: '100% Chuẩn Bảo Mật HTTPS/SSL', d: 'Toàn bộ API và giao diện Web/App vận hành trên chứng chỉ SSL bảo mật cao, chống nghe lén và tấn công man-in-the-middle.' },
      { t: 'Kiến Trúc Microservices Docker', d: 'Đóng gói độc lập cho từng dịch vụ: Frontend Nitro Server, Backend NestJS API và Lưu trữ phân tán MinIO S3.' },
      { t: 'Cơ Sở Dữ Liệu PostgreSQL Độc Lập', d: 'Hệ quản trị dữ liệu quan hệ mạnh mẽ, đảm bảo tính toàn vẹn ACID, sao lưu tự động định kỳ hàng ngày.' },
      { t: 'Native Wrapper Capacitor iOS/Android', d: 'Gói ứng dụng di động chính thức cài đặt trên App Store và Google Play, tận dụng tối đa phần cứng camera, NFC và sinh trắc học.' },
    ];
    techCards.forEach((tc, idx) => {
      const row = Math.floor(idx / 2);
      const col = idx % 2;
      const x = 0.8 + col * 5.95;
      const y = 2.0 + row * 2.35;
      slide.addShape(pres.ShapeType.rect, {
        x, y, w: 5.7, h: 2.15, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1.2 }, roundRadio: 0.1
      });
      slide.addText(`🔒 ${tc.t}`, { x: x + 0.3, y: y + 0.2, w: 5.1, h: 0.4, color: C.NAVY_PRIMARY, bold: true, fontSize: 14, fontFace: 'Calibri' });
      slide.addText(tc.d, { x: x + 0.3, y: y + 0.7, w: 5.1, h: 1.2, color: C.TEXT_BODY, fontSize: 11.5, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 16: TỔNG KẾT & CAM KẾT ĐỒNG HÀNH
  {
    const slide = pres.addSlide();
    slide.background = { color: C.NAVY_DARK };
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.12, fill: { color: C.GOLD_ACCENT } });

    slide.addShape(pres.ShapeType.rect, {
      x: 1.0, y: 1.1, w: 4.8, h: 0.4, fill: { color: C.NAVY_CARD }, line: { color: C.GOLD_ACCENT, width: 1.5 }, roundRadio: 0.1
    });
    slide.addText('TỔNG KẾT & LỘ TRÌNH ĐỒNG HÀNH', {
      x: 1.0, y: 1.1, w: 4.8, h: 0.4, color: C.GOLD_ACCENT, bold: true, fontSize: 11, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });

    slide.addText('NÂNG TẦM VỊ THẾ HIỆP HỘI THỜI KỲ KINH TẾ SỐ', {
      x: 1.0, y: 1.7, w: 11.33, h: 0.9, color: C.WHITE, bold: true, fontSize: 30, fontFace: 'Calibri'
    });

    const sumCards = [
      { t: 'Đoàn Kết & Gia Tăng Giá Trị', d: 'Mỗi hội viên khi gia nhập CLB CEO 1983 đều sở hữu công cụ kết nối số hóa quyền năng, thúc đẩy doanh thu thực tế cho doanh nghiệp.' },
      { t: 'Minh Bạch & Vận Hành Chuyên Nghiệp', d: 'Toàn bộ sinh hoạt, điểm danh, tài chính quỹ hội được số hóa và kiểm soát tự động, loại bỏ hoàn toàn các tranh cãi thủ công.' },
      { t: 'Sẵn Sàng Mở Rộng Quy Mô Lớn', d: 'Kiến trúc sẵn sàng mở rộng đón nhận hàng nghìn hội viên mới từ khắp các tỉnh thành trên cả nước và quốc tế.' },
    ];
    sumCards.forEach((sc, idx) => {
      const x = 1.0 + idx * 3.9;
      slide.addShape(pres.ShapeType.rect, {
        x, y: 2.8, w: 3.6, h: 3.0, fill: { color: C.NAVY_CARD }, line: { color: '2A3E66', width: 1.2 }, roundRadio: 0.12
      });
      slide.addText(`0${idx + 1}`, { x: x + 0.25, y: 3.0, w: 1.0, h: 0.4, color: C.GOLD_ACCENT, bold: true, fontSize: 22, fontFace: 'Calibri' });
      slide.addText(sc.t, { x: x + 0.25, y: 3.5, w: 3.1, h: 0.6, color: C.WHITE, bold: true, fontSize: 14, fontFace: 'Calibri' });
      slide.addText(sc.d, { x: x + 0.25, y: 4.2, w: 3.1, h: 1.4, color: '94A3B8', fontSize: 11, fontFace: 'Calibri' });
    });

    slide.addText('CLB Doanh Nhân CEO 1983 · Trực thuộc Hội Doanh Nhân Trẻ Hà Nội (HanoiBA) · ceo1983.com', {
      x: 1.0, y: 6.4, w: 11.33, h: 0.4, color: 'CBD5E1', fontSize: 12, bold: true, align: 'center', fontFace: 'Calibri'
    });
  }

  const appPptxPath = path.join(OUT_DIR, 'SLIDE_THUYET_TRINH_APP_HIEP_HOI_CEO1983.pptx');
  await pres.writeFile({ fileName: appPptxPath });
  fs.copyFileSync(appPptxPath, path.join(FE_DOCS_DIR, 'SLIDE_THUYET_TRINH_APP_HIEP_HOI_CEO1983.pptx'));
  console.log('✅ Generated App Deck PPTX:', appPptxPath);
}

// =============================================================================
// DECK 2: 16 SLIDES - HỆ THỐNG CRM QUẢN TRỊ CLB DOANH NHÂN CEO 1983
// =============================================================================
async function generateCrmDeck() {
  console.log('>>> Building 16-Slide CRM Presentation (SLIDE_THUYET_TRINH_CRM_QUAN_TRI_CEO1983)...');
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.title = 'Thuyết Trình Hệ Thống CRM Quản Trị - CLB Doanh Nhân CEO 1983';
  pres.author = 'Ban Thư Ký CLB Doanh Nhân CEO 1983';
  pres.company = 'CLB Doanh Nhân CEO 1983 · HanoiBA';

  const SYS_LABEL = 'Hệ Thống CRM Quản Trị';

  // SLIDE 1: COVER
  {
    const slide = pres.addSlide();
    slide.background = { color: C.NAVY_DARK };
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.12, fill: { color: C.GOLD_ACCENT } });

    slide.addShape(pres.ShapeType.rect, {
      x: 1.0, y: 1.1, w: 5.6, h: 0.4,
      fill: { color: C.NAVY_CARD }, line: { color: C.GOLD_ACCENT, width: 1.5 }, roundRadio: 0.1
    });
    slide.addText('HỆ THỐNG CRM ĐIỀU HÀNH & QUẢN TRỊ HIỆP HỘI', {
      x: 1.0, y: 1.1, w: 5.6, h: 0.4,
      color: C.GOLD_ACCENT, bold: true, fontSize: 11, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });

    slide.addText('CLB DOANH NHÂN CEO 1983', {
      x: 1.0, y: 1.7, w: 11.33, h: 1.0,
      color: C.WHITE, bold: true, fontSize: 34, fontFace: 'Calibri'
    });
    slide.addText('Trung Tâm Kiểm Soát Toàn Diện: Hội Viên · Tài Chính · Sự Kiện · Sơ Đồ Chỗ Ngồi · Giao Thương', {
      x: 1.0, y: 2.7, w: 11.33, h: 0.6,
      color: 'CBD5E1', fontSize: 15, fontFace: 'Calibri'
    });

    const pillars = [
      { num: '01', title: 'Quản Trị Hồ Sơ Hội Viên', desc: 'Thẩm định hồ sơ gia nhập, kiểm duyệt thông tin doanh nghiệp và phân quyền vai trò quản trị đa cấp.' },
      { num: '02', title: 'Minh Bạch Tài Chính Quỹ Hội', desc: 'Theo dõi niên liễm, nhắc phí hội viên tự động và đối soát giao dịch thu chi ngân quỹ theo thời gian thực.' },
      { num: '03', title: 'Điều Hành Sự Kiện & Sơ Đồ', desc: 'Khởi tạo vé đa tầng, sắp xếp sơ đồ rạp/bàn tiệc Gala và kiểm soát cổng check-in QR Code siêu tốc.' },
      { num: '04', title: 'Đồng Bộ Hai Chiều Tức Thì', desc: 'Tách biệt giao diện chuyên sâu cho Ban Quản Trị nhưng liên kết và đẩy dữ liệu tức thì xuống Mobile App hội viên.' },
    ];
    pillars.forEach((p, idx) => {
      const x = 1.0 + idx * 2.9;
      slide.addShape(pres.ShapeType.rect, {
        x, y: 3.6, w: 2.7, h: 2.5, fill: { color: C.NAVY_CARD }, line: { color: '2A3E66', width: 1.2 }, roundRadio: 0.12
      });
      slide.addText(p.num, { x: x + 0.2, y: 3.8, w: 0.8, h: 0.4, color: C.GOLD_ACCENT, bold: true, fontSize: 20, fontFace: 'Calibri' });
      slide.addText(p.title, { x: x + 0.2, y: 4.3, w: 2.3, h: 0.4, color: C.WHITE, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(p.desc, { x: x + 0.2, y: 4.75, w: 2.3, h: 1.2, color: '94A3B8', fontSize: 10.5, fontFace: 'Calibri' });
    });

    slide.addText('CLB Doanh Nhân CEO 1983 · Trực thuộc Hội Doanh Nhân Trẻ Hà Nội (HanoiBA) · ceo1983.com', {
      x: 1.0, y: 6.7, w: 11.33, h: 0.4, color: '64748B', fontSize: 11, italic: true, fontFace: 'Calibri'
    });
  }

  // SLIDE 2: ĐĂNG NHẬP & PHÂN QUYỀN
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'BẢO MẬT & PHÂN QUYỀN', 'Đăng Nhập Quản Trị & Phân Quyền Vai Trò Đa Cấp', 'Phân quyền chặt chẽ theo chức năng: Ban Chủ Tịch, Ban Thư Ký, Ban Tài Chính và Trưởng Ban');

    const img1 = getImageBase64('crm_01_login_page.png');
    const img2 = getImageBase64('crm_roles_permissions.png');
    if (img1) slide.addImage({ data: img1, x: 0.8, y: 2.0, w: 5.5, h: 2.35, rounding: true });
    if (img2) slide.addImage({ data: img2, x: 0.8, y: 4.45, w: 5.5, h: 2.35, rounding: true });

    const roleFeats = [
      { t: 'Phân Quyền RBAC (Role-Based Access Control)', d: 'Super Admin, Admin Hiệp hội, Ban Tài chính, Ban Xúc tiến và Ban Kiểm soát có quyền hạn tách biệt rõ ràng.' },
      { t: 'Đăng Nhập Bảo Mật Hai Lớp (2FA)', d: 'Ngăn chặn truy cập trái phép vào dữ liệu danh bạ hội viên và số liệu tài chính nhạy cảm của tổ chức.' },
      { t: 'Ghi Nhận Mọi Thao Tác Vào Nhật Ký (Audit)', d: 'Lưu vết lịch sử: Ai đã sửa hồ sơ, ai đã phê duyệt hội viên, ai đã xuất file Excel dữ liệu.' },
      { t: 'Giao Diện Quản Trị Tối Ưu Desktop & Tablet', d: 'Hỗ trợ thao tác linh hoạt trên máy tính bàn văn phòng hoặc máy tính bảng khi đi công tác.' },
    ];
    roleFeats.forEach((rf, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 6.6, y, w: 5.9, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`🛡️ ${rf.t}`, { x: 6.8, y: y + 0.12, w: 5.5, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(rf.d, { x: 6.8, y: y + 0.48, w: 5.5, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 3: DASHBOARD ĐIỀU HÀNH & BÁO CÁO KPI
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'TRUNG TÂM CHỈ HUY', 'Dashboard Điều Hành & Báo Cáo KPI Thời Gian Thực', 'Bức tranh toàn cảnh về sức khỏe tổ chức: Tỷ lệ gia hạn hội viên, ngân quỹ thu chi và quy mô giao thương');

    const img = getImageBase64('crm_02_dashboard_kpi.png');
    if (img) slide.addImage({ data: img, x: 0.8, y: 2.0, w: 5.6, h: 4.8, rounding: true });

    const kpiFeats = [
      { t: 'Chỉ Số Tăng Trưởng Hội Viên', d: 'Biểu đồ trực quan theo dõi số lượng hội viên mới gia nhập, hội viên chờ duyệt và tỷ lệ gia hạn thẻ hàng năm.' },
      { t: 'Đối Soát Dòng Tiền & Quỹ Hội', d: 'Thống kê tổng thu niên liễm, doanh thu bán vé sự kiện và các khoản tài trợ đã chuyển khoản về tài khoản CLB.' },
      { t: 'Đo Lường Hiệu Quả Giao Thương B2B', d: 'Tổng giá trị các Deal kinh doanh đã được chia sẻ và kết nối thành công giữa các doanh nghiệp thành viên.' },
      { t: 'Xuất Báo Cáo Ban Chấp Hành Tức Thì', d: 'Xuất báo cáo PDF/Excel chuẩn hóa chỉ với 1 click để phục vụ các kỳ họp Ban Chấp Hành định kỳ.' },
    ];
    kpiFeats.forEach((kf, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 6.7, y, w: 5.8, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`📊 ${kf.t}`, { x: 6.9, y: y + 0.12, w: 5.4, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(kf.d, { x: 6.9, y: y + 0.48, w: 5.4, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 4: QUẢN LÝ & PHÊ DUYỆT HỘI VIÊN
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'QUẢN TRỊ DỮ LIỆU', 'Quản Lý & Phê Duyệt Hồ Sơ Hội Viên Thông Minh', 'Quy trình thẩm định hồ sơ bài bản từ khi nộp đơn online tới lúc cấp mã hội viên và phát hành thẻ số');

    const img1 = getImageBase64('crm_03_members_list.png');
    const img2 = getImageBase64('crm_04_member_detail_drawer.png');
    if (img1) slide.addImage({ data: img1, x: 0.8, y: 2.0, w: 5.5, h: 2.35, rounding: true });
    if (img2) slide.addImage({ data: img2, x: 0.8, y: 4.45, w: 5.5, h: 2.35, rounding: true });

    const memFeats = [
      { t: 'Tiếp Nhận Hồ Sơ Đăng Ký Trực Tuyến', d: 'Hội viên đăng ký qua landing page hoặc form online tự động đổ về hàng đợi thẩm định của CRM.' },
      { t: 'Quy Trình Duyệt Hồ Sơ Đa Bước', d: 'Ban Thư Ký kiểm tra giấy phép kinh doanh, Ban Chủ Tịch phê duyệt chấp thuận kết nạp chỉ bằng 1 nút bấm.' },
      { t: 'Tự Động Sinh Mã Hội Viên & Cấp Thẻ', d: 'Hệ thống tự cấp số thẻ (M1983-xxx), gửi email thông báo chúc mừng kèm thông tin đăng nhập Mobile App.' },
      { t: 'Drawer Chi Tiết Hồ Sơ Toàn Diện', d: 'Xem trọn vẹn thông tin liên lạc, lịch sử đóng phí, sản phẩm đã đăng và số sự kiện đã tham gia.' },
    ];
    memFeats.forEach((mf, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 6.6, y, w: 5.9, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`👥 ${mf.t}`, { x: 6.8, y: y + 0.12, w: 5.5, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(mf.d, { x: 6.8, y: y + 0.48, w: 5.5, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 5: QUẢN LÝ DOANH NGHIỆP THÀNH VIÊN
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'HỆ SINH THÁI DOANH NGHIỆP', 'Quản Lý Doanh Nghiệp & Doanh Nghiệp Thành Viên', 'Xây dựng bản đồ năng lực chuỗi giá trị: Tra cứu doanh nghiệp cung ứng, sản xuất và dịch vụ trong CLB');

    const img = getImageBase64('crm_09_companies_management.png');
    if (img) slide.addImage({ data: img, x: 0.8, y: 2.0, w: 5.6, h: 4.8, rounding: true });

    const compFeats = [
      { t: 'Danh Mục Doanh Nghiệp Thành Viên', d: 'Lưu trữ mã số thuế, địa chỉ trụ sở, đại diện pháp luật và hồ sơ năng lực (Company Profile) chi tiết.' },
      { t: 'Phân Loại Chuỗi Cung Ứng Nội Bộ', d: 'Phân nhóm theo ngành nghề: Sản xuất cơ khí, Xây dựng hoàn thiện, F&B, Nông sản, Dịch vụ số.' },
      { t: 'Liên Kết Tài Khoản Lãnh Đạo Với Công Ty', d: 'Một doanh nghiệp có thể có Chủ tịch và Tổng Giám Đốc cùng sinh hoạt với quyền hạn rõ ràng.' },
      { t: 'Đối Soát Tư Cách Hội Viên Doanh Nghiệp', d: 'Tự động kiểm tra thời hạn pháp nhân và trạng thái hoạt động thực tế của doanh nghiệp thành viên.' },
    ];
    compFeats.forEach((cf, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 6.7, y, w: 5.8, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`🏢 ${cf.t}`, { x: 6.9, y: y + 0.12, w: 5.4, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(cf.d, { x: 6.9, y: y + 0.48, w: 5.4, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 6: TÀI CHÍNH QUỸ HỘI & NIÊN LIỄM
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'MINH BẠCH TÀI CHÍNH', 'Quản Lý Niên Liễm Hội Phí & Kế Toán Quỹ Hội', 'Tự động hóa theo dõi hạn nộp hội phí, phát hành thông báo thu phí và ghi nhận dòng tiền đóng góp');

    const img = getImageBase64('crm_08_fees_management.png');
    if (img) slide.addImage({ data: img, x: 0.8, y: 2.0, w: 5.6, h: 4.8, rounding: true });

    const feeFeats = [
      { t: 'Cấu Hình Kỳ Thu Phí Niên Liễm Linh Hoạt', d: 'Thiết lập mức phí theo năm cho Hội viên cá nhân và Hội viên doanh nghiệp kèm chính sách miễn giảm.' },
      { t: 'Nhắc Nộp Hội Phí Tự Động Qua App/Email', d: 'Hệ thống tự động gửi thông báo trước 30 ngày và 7 ngày kèm link thanh toán VietQR chuyển khoản chính xác.' },
      { t: 'Ghi Nhận Thu Tiền & Xuất Phiếu Thu Số', d: 'Ban Tài chính xác nhận đóng phí -> Thẻ hội viên trên Mobile App tự động gia hạn thêm 12 tháng.' },
      { t: 'Báo Cáo Tài Chính Ngân Quỹ Công Khai', d: 'Tổng hợp thu chi quỹ hội rõ ràng, phục vụ báo cáo minh bạch trước toàn thể hội viên tại Đại hội thường niên.' },
    ];
    feeFeats.forEach((ff, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 6.7, y, w: 5.8, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`💰 ${ff.t}`, { x: 6.9, y: y + 0.12, w: 5.4, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(ff.d, { x: 6.9, y: y + 0.48, w: 5.4, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 7: QUẢN LÝ SỰ KIỆN & CẤU HÌNH VÉ
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'TỔ CHỨC ĐỈNH CAO', 'Quản Trị Sự Kiện Hiệp Hội & Cấu Hình Vé Đa Tầng', 'Công cụ tổ chức sự kiện chuyên nghiệp: Từ Gala Dinner, Caravan tới Hội nghị xúc tiến thương mại quốc tế');

    const img1 = getImageBase64('crm_05_events_list.png');
    const img2 = getImageBase64('crm_06_event_create_modal.png');
    if (img1) slide.addImage({ data: img1, x: 0.8, y: 2.0, w: 5.5, h: 2.35, rounding: true });
    if (img2) slide.addImage({ data: img2, x: 0.8, y: 4.45, w: 5.5, h: 2.35, rounding: true });

    const evmFeats = [
      { t: 'Khởi Tạo Sự Kiện Nhanh Chóng Trong 3 Phút', d: 'Nhập tiêu đề, thời gian, địa điểm, banner quảng bá và nội dung lịch trình sự kiện chi tiết.' },
      { t: 'Cấu Hình Vé Linh Hoạt (Vé Miễn Phí / Vé VIP)', d: 'Quy định số lượng vé tối đa, thiết lập giá vé cho người ngoài và giá ưu đãi đặc quyền cho hội viên CLB.' },
      { t: 'Kiểm Soát Danh Sách Khách Đăng Ký Trực Tiếp', d: 'Theo dõi từng cá nhân đã đăng ký, trạng thái đã thanh toán hay chưa thanh toán theo thời gian thực.' },
      { t: 'Tự Động Đẩy Sự Kiện Lên Mobile App', d: 'Ngay khi sự kiện được kích hoạt trên CRM, thông báo đẩy được gửi tới toàn bộ hội viên cài đặt App.' },
    ];
    evmFeats.forEach((ef, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 6.6, y, w: 5.9, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`🎪 ${ef.t}`, { x: 6.8, y: y + 0.12, w: 5.5, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(ef.d, { x: 6.8, y: y + 0.48, w: 5.5, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 8: SƠ ĐỒ RẠP & VỊ TRÍ CHỖ NGỒI (CINEMA MAP)
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'SẮP ĐẶT CHUYÊN NGHIỆP', 'Sơ Đồ Rạp & Xếp Chỗ Ngồi VIP Gala Dinner', 'Mô hình Cinema Map tương tác trực quan: Sắp xếp bàn tiệc danh dự, chỗ ngồi VIP và khách mời trang trọng');

    const img = getImageBase64('crm_07_seating_cinema_map.png');
    if (img) slide.addImage({ data: img, x: 0.8, y: 2.0, w: 5.6, h: 4.8, rounding: true });

    const seatFeats = [
      { t: 'Sơ Đồ Chỗ Ngồi Trực Quan Dạng Lưới', d: 'Mô phỏng hội trường sân khấu: Bàn VIP Danh Dự, Bàn Ban Cố Vấn, Bàn Hội Viên theo khu vực A, B, C.' },
      { t: 'Kéo Thả Sắp Xếp Đại Biểu Nhanh Chóng', d: 'Gán tên khách mời vào từng ghế cụ thể, tránh hoàn toàn tình trạng nhầm lẫn hoặc thiếu chỗ tại sự kiện lớn.' },
      { t: 'Hiển Thị Vị Trí Ngồi Trực Tiếp Lên Vé App', d: 'Hội viên mở vé điện tử trên điện thoại sẽ thấy ngay thông tin: "Bàn VIP 01 - Ghế số 04" rõ ràng.' },
      { t: 'In Thẻ Bàn & Xuất Sơ Đồ Đón Tiếp Lễ Tân', d: 'Xuất danh sách sơ đồ bàn tiệc phục vụ Ban Lễ Tân hướng dẫn khách mời vào đúng vị trí trang trọng.' },
    ];
    seatFeats.forEach((sf, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 6.7, y, w: 5.8, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`🪑 ${sf.t}`, { x: 6.9, y: y + 0.12, w: 5.4, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(sf.d, { x: 6.9, y: y + 0.48, w: 5.4, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 9: KIỂM SOÁT CHECK-IN QR TẠI SỰ KIỆN
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'CỔNG SOÁT VÉ HIỆN ĐẠI', 'Kiểm Soát Check-in QR Code Tự Động Tại Cổng', 'Hệ thống quét mã QR siêu tốc cho Ban Lễ Tân, thống kê trực tiếp tỷ lệ khách đã đến hội trường');

    const img1 = getImageBase64('crm_checkin_management.png');
    const img2 = getImageBase64('crm_checkin_qr_display.png');
    if (img1) slide.addImage({ data: img1, x: 0.8, y: 2.0, w: 5.5, h: 2.35, rounding: true });
    if (img2) slide.addImage({ data: img2, x: 0.8, y: 4.45, w: 5.5, h: 2.35, rounding: true });

    const chkFeats = [
      { t: 'Giao Diện Quét Mã Tối Ưu Cho Tablet & Mobile', d: 'Ban Lễ Tân sử dụng máy tính bảng quét vé QR chỉ 1 giây/người, chống ùn tắc tại sảnh hội trường.' },
      { t: 'Hiển Thị Thông Tin Chào Đón Khách Mời', d: 'Màn hình hiển thị: Họ tên, Chức vụ, Công ty và Lời chào trân trọng từ Ban Chủ Tịch CLB CEO 1983.' },
      { t: 'Báo Cáo Tỷ Lệ Check-in Realtime', d: 'Biết chính xác đã có bao nhiêu đại biểu vào hội trường (VD: 342/400 khách) để quyết định thời điểm khai mạc.' },
      { t: 'Đồng Bộ Tự Động Với Bầu Cử & Quay Số', d: 'Hội viên qua cửa check-in sẽ tự động được thêm vào danh sách đủ điều kiện quay số may mắn trúng thưởng.' },
    ];
    chkFeats.forEach((cf, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 6.6, y, w: 5.9, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`⚡ ${cf.t}`, { x: 6.8, y: y + 0.12, w: 5.5, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(cf.d, { x: 6.8, y: y + 0.48, w: 5.5, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 10: KIỂM SOÁT SẢN PHẨM MARKETPLACE
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'KIỂM SOÁT THƯƠNG MẠI', 'Quản Trị Chợ Sản Phẩm & Thẩm Định Chào Hàng B2B', 'Bảo vệ quyền lợi hội viên: Chỉ những sản phẩm đủ tiêu chuẩn chất lượng và có xuất xứ rõ ràng mới được duyệt');

    const img = getImageBase64('crm_10_marketplace_sync.png');
    if (img) slide.addImage({ data: img, x: 0.8, y: 2.0, w: 5.6, h: 4.8, rounding: true });

    const mktFeats = [
      { t: 'Hàng Đợi Phê Duyệt Sản Phẩm Mới', d: 'Khi hội viên đăng sản phẩm trên App, CRM hiển thị thông tin chờ kiểm duyệt về pháp lý và giá bán.' },
      { t: 'Gắn Nhãn "Sản Phẩm Đạt Chuẩn CEO 1983"', d: 'Gia tăng uy tín sản phẩm, giúp hội viên tự tin mua sắm và ký kết hợp đồng cung ứng số lượng lớn.' },
      { t: 'Kiểm Soát Tồn Kho & Giá Ưu Đãi Nội Bộ', d: 'Đảm bảo mức giá chào bán cho hội viên luôn là mức giá chiết khấu tốt nhất thị trường.' },
      { t: 'Khóa / Gỡ Sản Phẩm Vi Phạm Tức Thì', d: 'Ban Kiểm soát có thể gỡ bỏ sản phẩm khỏi chợ trên Mobile App ngay lập tức nếu phát hiện vi phạm.' },
    ];
    mktFeats.forEach((mf, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 6.7, y, w: 5.8, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`🔍 ${mf.t}`, { x: 6.9, y: y + 0.12, w: 5.4, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(mf.d, { x: 6.9, y: y + 0.48, w: 5.4, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 11: ĐIỀU PHỐI CƠ HỘI GIAO THƯƠNG
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'KẾT NỐI KINH DOANH', 'Điều Phối Cơ Hội Giao Thương & Thống Kê Deal B2B', 'Ban Xúc Tiến Thương Mại chủ động nắm bắt nhu cầu hợp tác để làm cầu nối ghép đôi (matching) hiệu quả');

    const img = getImageBase64('crm_11_opportunities_sync.png');
    if (img) slide.addImage({ data: img, x: 0.8, y: 2.0, w: 5.6, h: 4.8, rounding: true });

    const oppmFeats = [
      { t: 'Theo Dõi Toàn Bộ Nhu Cầu Mua / Bán Sỉ', d: 'Nắm bắt các cơ hội cần mua nguyên vật liệu, tìm tổng thầu xây dựng hay kêu gọi góp vốn đầu tư.' },
      { t: 'Thẩm Định & Định Giá Quy Mô Deal', d: 'Ban Xúc tiến hỗ trợ kiểm tra tính khả thi của các cơ hội trị giá hàng chục tỷ đồng trước khi công khai.' },
      { t: 'Xem Danh Sách Hội Viên Bày Tỏ Quan Tâm', d: 'Hỗ trợ chủ Deal kết nối nhanh với các đối tác tiềm năng nhất trong CLB CEO 1983.' },
      { t: 'Báo Cáo Tổng Giá Trị Giao Thương Đã Ký', d: 'Ghi nhận doanh số thành công đóng góp vào thành tích chung của Hiệp hội trong năm.' },
    ];
    oppmFeats.forEach((of, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 6.7, y, w: 5.8, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`🤝 ${of.t}`, { x: 6.9, y: y + 0.12, w: 5.4, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(of.d, { x: 6.9, y: y + 0.48, w: 5.4, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 12: STUDIO BẦU CỬ & LUCKY DRAW
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'CÔNG CỤ ĐẠI HỘI', 'Studio Bầu Cử Trực Tuyến & Quay Số May Mắn', 'Công cụ điều khiển trung tâm dành cho Ban Tổ Chức: Mở cổng biểu quyết và kích hoạt vòng quay trực tiếp');

    const img = getImageBase64('crm_12_voting_luckydraw.png');
    if (img) slide.addImage({ data: img, x: 0.8, y: 2.0, w: 5.6, h: 4.8, rounding: true });

    const stuFeats = [
      { t: 'Thiết Lập Câu Hỏi & Ứng Viên Bầu Cử', d: 'Nhập danh sách ứng viên Ban Chấp Hành, quy định số lượng phiếu tối đa được chọn cho mỗi hội viên.' },
      { t: 'Mở / Khóa Cổng Bỏ Phiếu Thời Gian Thực', d: 'Chủ tọa bấm mở cổng biểu quyết trên CRM, đồng hồ đếm ngược lập tức xuất hiện trên điện thoại của hội viên.' },
      { t: 'Xuất Màn Hình LED Trình Chiếu Sân Khấu', d: 'Cửa sổ riêng biệt cho màn hình LED với đồ họa hiệu ứng 3D mãn nhãn và âm thanh hồi hộp sống động.' },
      { t: 'Biên Bản Kết Quả Tự Động Ký Số', d: 'Kết quả bầu cử và danh sách trúng thưởng được chốt bất biến, xuất biên bản có dấu xác thực điện tử.' },
    ];
    stuFeats.forEach((sf, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 6.7, y, w: 5.8, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`🎲 ${sf.t}`, { x: 6.9, y: y + 0.12, w: 5.4, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(sf.d, { x: 6.9, y: y + 0.48, w: 5.4, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 13: BẢN TIN HIỆP HỘI & AUDIT LOGS
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'TRUYỀN THÔNG & AN TOÀN', 'Quản Lý Bản Tin Hiệp Hội & Nhật Ký Kiểm Toán', 'Kênh phát ngôn chính thức của CLB song hành hệ thống giám sát an ninh bảo vệ dữ liệu toàn vẹn');

    const img1 = getImageBase64('crm_13_news_management.png');
    const img2 = getImageBase64('crm_audit_logs.png');
    if (img1) slide.addImage({ data: img1, x: 0.8, y: 2.0, w: 5.5, h: 2.35, rounding: true });
    if (img2) slide.addImage({ data: img2, x: 0.8, y: 4.45, w: 5.5, h: 2.35, rounding: true });

    const newsFeats = [
      { t: 'Soạn Thảo & Đăng Tải Bản Tin Hiệp Hội', d: 'Công cụ soạn thảo trực quan phong phú: Chèn ảnh, video, văn bản nghị quyết và quyết định kết nạp.' },
      { t: 'Đẩy Thông Báo Push Tới 100% Hội Viên', d: 'Gửi thông báo tức thời tới ứng dụng di động của từng hội viên, đảm bảo thông điệp không bị bỏ sót.' },
      { t: 'Hệ Thống Nhật Ký Kiểm Toán (Audit Logs)', d: 'Theo dõi chi tiết: Địa chỉ IP, thời gian đăng nhập, các hành động sửa/xóa dữ liệu của nhân sự vận hành.' },
      { t: 'Phục Hồi Dữ Liệu Khi Cần Thiết', d: 'Cơ chế lưu vết và snapshot giúp khôi phục dữ liệu nhanh chóng nếu xảy ra sai sót thao tác con người.' },
    ];
    newsFeats.forEach((nf, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, { x: 6.6, y, w: 5.9, h: 1.0, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1 }, roundRadio: 0.08 });
      slide.addText(`📰 ${nf.t}`, { x: 6.8, y: y + 0.12, w: 5.5, h: 0.35, color: C.NAVY_PRIMARY, bold: true, fontSize: 13, fontFace: 'Calibri' });
      slide.addText(nf.d, { x: 6.8, y: y + 0.48, w: 5.5, h: 0.45, color: C.TEXT_BODY, fontSize: 11, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 14: LIÊN KẾT ĐỒNG BỘ: KẾT NỐI HAI CHIỀU VỚI MOBILE APP (REQUIREMENT 5 - CRITICAL)
  {
    const slide = pres.addSlide();
    addSlideHeader(
      slide,
      pres,
      'KẾT NỐI VẬN HÀNH ĐỒNG BỘ',
      'Liên Kết Hai Chiều: Đẩy Dữ Liệu Tức Thì Xuống Mobile App',
      'Mọi quyết định quản trị trên CRM được đồng bộ ngay lập tức xuống điện thoại hội viên: Tách biệt giao diện nhưng thống nhất dữ liệu 100%'
    );

    const appImg1 = getImageBase64('app_02_home_dashboard.png');
    const appImg2 = getImageBase64('sub_13_app_vip_card_front.png');

    if (appImg1) slide.addImage({ data: appImg1, x: 0.8, y: 2.0, w: 2.8, h: 4.8, rounding: true });
    if (appImg2) slide.addImage({ data: appImg2, x: 3.8, y: 2.0, w: 2.8, h: 4.8, rounding: true });

    const synFeats = [
      {
        t: 'Tách Biệt Giao Diện Nhưng Liên Kết Chức Năng',
        d: 'Ban Lãnh Đạo sử dụng Web CRM để bao quát toàn bộ chỉ số vĩ mô; Hội viên sử dụng Mobile App để nhận đặc quyền và giao lưu B2B.',
        icon: '📱'
      },
      {
        t: 'Duyệt Hội Viên -> Tự Động Phát Hành Thẻ Số',
        d: 'Ngay khi Ban Thư Ký bấm "Duyệt" hồ sơ trên CRM -> Mobile App của hội viên tự động kích hoạt Thẻ VIP 3D và mã QR xác thực.',
        icon: '💳'
      },
      {
        t: 'Mở Bán Sự Kiện -> Nhận Vé & Số Ghế Trực Tiếp',
        d: 'Sự kiện cấu hình trên CRM lập tức hiển thị trên Mobile App; Hội viên đăng ký vé được tự động gán vị trí ghế ngồi theo sơ đồ.',
        icon: '🎟️'
      },
      {
        t: 'Điều Phối Giao Thương Thời Gian Thực',
        d: 'Cơ hội kinh doanh và sản phẩm được Ban Quản Trị phê duyệt trên CRM sẽ ngay lập tức hiện diện trên Sàn giao thương của App.',
        icon: '⚡'
      },
    ];

    synFeats.forEach((sf, idx) => {
      const y = 2.0 + idx * 1.15;
      slide.addShape(pres.ShapeType.rect, {
        x: 6.9, y, w: 5.6, h: 1.05,
        fill: { color: C.WHITE }, line: { color: C.GOLD_ACCENT, width: 1.2 }, roundRadio: 0.08
      });
      slide.addText(`${sf.icon} ${sf.t}`, {
        x: 7.1, y: y + 0.12, w: 5.2, h: 0.35,
        color: C.NAVY_PRIMARY, bold: true, fontSize: 12.5, fontFace: 'Calibri'
      });
      slide.addText(sf.d, {
        x: 7.1, y: y + 0.48, w: 5.2, h: 0.5,
        color: C.TEXT_BODY, fontSize: 10.5, fontFace: 'Calibri'
      });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 15: AN TOÀN DỮ LIỆU & HẠ TẦNG KỸ THUẬT
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, pres, 'TIÊU CHUẨN AN NINH', 'Hạ Tầng Kỹ Thuật Độc Lập & Tiêu Chuẩn Bảo Mật', 'Hệ thống vận hành trên máy chủ riêng biệt, phân tách mạng nội bộ và tuân thủ các chuẩn an toàn thông tin');

    const infraCards = [
      { t: 'Hạ Tầng Docker Container Hóa', d: 'Mỗi phân hệ (CRM Web, CRM API, Lưu trữ MinIO) vận hành trong các container riêng biệt, không xung đột tài nguyên.' },
      { t: 'Bảo Mật HTTPS Cổng Riêng Biệt', d: 'CRM vận hành chuyên biệt trên cổng SSL bảo mật cao, tách rời với các ứng dụng khác trong hệ sinh thái.' },
      { t: 'Cơ Chế Sao Lưu Đa Tầng (Daily Backup)', d: 'Toàn bộ cơ sở dữ liệu hội viên và chứng từ thanh toán được sao lưu tự động mỗi ngày sang máy chủ lưu trữ độc lập.' },
      { t: 'Khả Năng Phục Hồi Thảm Họa (DR)', d: 'Quy trình phục hồi hệ thống nhanh chóng trong vòng dưới 15 phút nếu phát sinh sự cố phần cứng máy chủ vật lý.' },
    ];
    infraCards.forEach((ic, idx) => {
      const row = Math.floor(idx / 2);
      const col = idx % 2;
      const x = 0.8 + col * 5.95;
      const y = 2.0 + row * 2.35;
      slide.addShape(pres.ShapeType.rect, {
        x, y, w: 5.7, h: 2.15, fill: { color: C.WHITE }, line: { color: C.BORDER_SUBTLE, width: 1.2 }, roundRadio: 0.1
      });
      slide.addText(`🛡️ ${ic.t}`, { x: x + 0.3, y: y + 0.2, w: 5.1, h: 0.4, color: C.NAVY_PRIMARY, bold: true, fontSize: 14, fontFace: 'Calibri' });
      slide.addText(ic.d, { x: x + 0.3, y: y + 0.7, w: 5.1, h: 1.2, color: C.TEXT_BODY, fontSize: 11.5, fontFace: 'Calibri' });
    });

    addSlideFooter(slide, pres, SYS_LABEL);
  }

  // SLIDE 16: TỔNG KẾT & HIỆU QUẢ QUẢN TRỊ
  {
    const slide = pres.addSlide();
    slide.background = { color: C.NAVY_DARK };
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.12, fill: { color: C.GOLD_ACCENT } });

    slide.addShape(pres.ShapeType.rect, {
      x: 1.0, y: 1.1, w: 4.8, h: 0.4, fill: { color: C.NAVY_CARD }, line: { color: C.GOLD_ACCENT, width: 1.5 }, roundRadio: 0.1
    });
    slide.addText('TỔNG KẾT & HIỆU QUẢ QUẢN TRỊ', {
      x: 1.0, y: 1.1, w: 4.8, h: 0.4, color: C.GOLD_ACCENT, bold: true, fontSize: 11, align: 'center', valign: 'middle', fontFace: 'Calibri'
    });

    slide.addText('CHUYỂN ĐỔI SỐ TOÀN DIỆN VẬN HÀNH CLB CEO 1983', {
      x: 1.0, y: 1.7, w: 11.33, h: 0.9, color: C.WHITE, bold: true, fontSize: 30, fontFace: 'Calibri'
    });

    const crmSum = [
      { t: 'Tiết Kiệm 90% Thời Gian Thủ Công', d: 'Loại bỏ hoàn toàn sổ sách Excel rời rạc, đối soát thu chi quỹ hội và danh sách điểm danh sự kiện tự động trong tích tắc.' },
      { t: 'Dữ Liệu Tập Trung & Bất Biến', d: 'Mọi tài sản thông tin, hồ sơ hội viên và lịch sử hoạt động được số hóa trọn đời, chuyển giao nhiệm kỳ Ban Chấp Hành mượt mà.' },
      { t: 'Khẳng Định Chuẩn Mực Hiệp Hội Số', d: 'CLB Doanh Nhân CEO 1983 tiên phong trở thành tổ chức kiểu mẫu hàng đầu trong phong trào Doanh nhân trẻ Việt Nam.' },
    ];
    crmSum.forEach((cs, idx) => {
      const x = 1.0 + idx * 3.9;
      slide.addShape(pres.ShapeType.rect, {
        x, y: 2.8, w: 3.6, h: 3.0, fill: { color: C.NAVY_CARD }, line: { color: '2A3E66', width: 1.2 }, roundRadio: 0.12
      });
      slide.addText(`0${idx + 1}`, { x: x + 0.25, y: 3.0, w: 1.0, h: 0.4, color: C.GOLD_ACCENT, bold: true, fontSize: 22, fontFace: 'Calibri' });
      slide.addText(cs.t, { x: x + 0.25, y: 3.5, w: 3.1, h: 0.6, color: C.WHITE, bold: true, fontSize: 14, fontFace: 'Calibri' });
      slide.addText(cs.d, { x: x + 0.25, y: 4.2, w: 3.1, h: 1.4, color: '94A3B8', fontSize: 11, fontFace: 'Calibri' });
    });

    slide.addText('CLB Doanh Nhân CEO 1983 · Trực thuộc Hội Doanh Nhân Trẻ Hà Nội (HanoiBA) · ceo1983.com', {
      x: 1.0, y: 6.4, w: 11.33, h: 0.4, color: 'CBD5E1', fontSize: 12, bold: true, align: 'center', fontFace: 'Calibri'
    });
  }

  const crmPptxPath = path.join(OUT_DIR, 'SLIDE_THUYET_TRINH_CRM_QUAN_TRI_CEO1983.pptx');
  await pres.writeFile({ fileName: crmPptxPath });
  fs.copyFileSync(crmPptxPath, path.join(FE_DOCS_DIR, 'SLIDE_THUYET_TRINH_CRM_QUAN_TRI_CEO1983.pptx'));
  console.log('✅ Generated CRM Deck PPTX:', crmPptxPath);
}

// =============================================================================
// GENERATE HTML & MARKDOWN COMPANIONS (WITH STRICT NO-VIONE FILTER)
// =============================================================================
function generateHtmlAndMarkdown() {
  console.log('>>> Generating Companion HTML and Markdown files for both presentations...');

  // HTML & MD for App Deck
  const appHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Slide Thuyết Trình App Hiệp Hội - CLB Doanh Nhân CEO 1983</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'Inter', sans-serif; background: #0A1A3A; color: #F8FAFC; }
    .slide-card { background: #132A56; border: 1px solid #2A3E66; border-radius: 1.25rem; }
    .gold-text { color: #F59E0B; }
  </style>
</head>
<body class="p-4 sm:p-8 max-w-6xl mx-auto">
  <header class="mb-8 border-b border-white/10 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
      <span class="inline-block px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-400/30 mb-2">
        Bộ Slide 16 Trang Chính Thức
      </span>
      <h1 class="text-2xl sm:text-3xl font-black text-white">Thuyết Trình Ứng Dụng Di Động CLB Doanh Nhân CEO 1983</h1>
      <p class="text-sm text-slate-400 mt-1">Không gian số & Siêu kết nối Doanh nhân · Bản quyền © 2026 CLB Doanh Nhân CEO 1983</p>
    </div>
    <a href="SLIDE_THUYET_TRINH_APP_HIEP_HOI_CEO1983.pptx" download class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg transition flex items-center gap-2">
      📥 Tải PPTX (16 Slides)
    </a>
  </header>

  <div class="space-y-6">
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 01: Bìa Chính Thức</h2>
      <p class="text-sm text-slate-300">Ứng dụng di động Hiệp hội thời kỳ số - CLB Doanh Nhân CEO 1983. Không gian số hội viên: Thẻ VIP 3D · Chạm thẻ NFC · Giao thương B2B · Vé số hóa.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 02: Đăng Nhập & Định Danh Hội Viên Bảo Mật</h2>
      <p class="text-sm text-slate-300">Đăng nhập chuẩn xác qua Số điện thoại / Email kết hợp mã hóa JWT. Định danh duy nhất theo mã hội viên độc bản (M1983-xxx), bảo mật HTTPS 100%.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 03: Dashboard Tổng Quan & Bảng Tin Sinh Hoạt</h2>
      <p class="text-sm text-slate-300">Banner sự kiện tiêu điểm, menu tiện ích 1 chạm truy cập Thẻ số, Cơ hội, Sản phẩm, Điểm danh QR và thông báo đẩy tức thời.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 04: Thẻ Hội Viên VIP Số Hóa Đẳng Cấp</h2>
      <p class="text-sm text-slate-300">Thẻ hoàng gia Navy - Gold kim loại sang trọng, mã QR xác thực trực tuyến, tùy biến thông tin cá nhân và xuất ví Apple / Google Wallet.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 05: Chạm Thẻ Thông Minh NFC 1 Chạm</h2>
      <p class="text-sm text-slate-300">Trao đổi danh thiếp không cần cài app, chạm lưng điện thoại lưu danh bạ (vCard) trong 1 giây, bảo mật thông tin liên lạc tùy biến.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 06: Danh Bạ Hội Viên & Kết Nối Tin Cậy</h2>
      <p class="text-sm text-slate-300">Tra cứu hơn 500+ chủ doanh nghiệp theo ngành nghề, quy mô. Xem hồ sơ năng lực đầy đủ và liên hệ trực tiếp không qua trung gian.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 07: Sàn Trao Cơ Hội Giao Thương B2B (Xoay Vòng 2s)</h2>
      <p class="text-sm text-slate-300">Giao diện mới với khu vực Cơ hội nổi bật chuyển ảnh 2 giây/lần. Phân loại Deal Hợp tác B2B, Đầu tư & Vốn, Cung ứng, Xuất nhập khẩu.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 08: Chợ Sản Phẩm & Dịch Vụ Hội Viên (Marketplace)</h2>
      <p class="text-sm text-slate-300">Gian hàng số hóa sản phẩm thành viên, chiết khấu đặc quyền nội bộ, kiểm duyệt an toàn từ CRM và yêu cầu báo giá sỉ 1 chạm.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 09: Quản Lý Sự Kiện & Đăng Ký Vé Điện Tử</h2>
      <p class="text-sm text-slate-300">Lịch Caravan, Gala Dinner, Cafe Doanh Nhân. Đăng ký vé miễn phí / vé có phí qua cổng VietQR tự động không cần gửi bill.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 10: Vé Điện Tử Thông Minh & Check-in QR Siêu Tốc</h2>
      <p class="text-sm text-slate-300">Mã QR Pass chống chụp màn hình, quét mã qua cửa trong 1 giây, hiển thị vị trí số ghế bàn tiệc và kích hoạt quyền bầu cử/quay số.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 11: Bầu Cử Trực Tuyến & Quay Số May Mắn Sự Kiện</h2>
      <p class="text-sm text-slate-300">Bỏ phiếu tín nhiệm đại hội trực tuyến minh bạch, hiển thị % kết quả tức thời, vòng quay may mắn Lucky Draw nổ chuông chúc mừng.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 12: Hộp Thư Doanh Nghiệp & Nhắn Tin Nội Bộ</h2>
      <p class="text-sm text-slate-300">Trò chuyện 1-1 kín đáo, tạo nhóm thảo luận chuyên đề ban bệ, gửi tệp tài liệu PDF và vị trí gặp gỡ giao thương tin cậy.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 13: Quản Trị Hồ Sơ Cá Nhân & Cài Đặt Bảo Mật</h2>
      <p class="text-sm text-slate-300">Cập nhật ảnh đại diện avatar, ảnh bìa danh thiếp, cập nhật hồ sơ năng lực và quản lý lịch sử hoạt động tại CLB CEO 1983.</p>
    </div>
    <div class="slide-card p-6 border-amber-400/50 bg-amber-950/20">
      <div class="flex items-center gap-2 text-amber-400 font-bold mb-1">
        <span>⭐ ĐIỂM NHẤN QUAN TRỌNG: LIÊN KẾT ĐỒNG BỘ CRM</span>
      </div>
      <h2 class="text-lg font-black text-white mb-2">Slide 14: Hạ Tầng Quản Trị CRM Đồng Bộ Sau Giao Diện App</h2>
      <p class="text-sm text-slate-300 mb-3">Tuy Mobile App phục vụ hội viên bỏ túi và Web CRM dành cho Ban Quản Trị điều hành (tách biệt giao diện), toàn bộ chức năng và dữ liệu liên kết 100% realtime:</p>
      <ul class="list-disc list-inside text-xs text-slate-300 space-y-1">
        <li>Hội viên đăng bài cơ hội, đăng sản phẩm, đăng ký vé -> Tức thời đổ về CRM xét duyệt.</li>
        <li>Ban Quản Trị phê duyệt trên CRM -> Tự động kích hoạt quyền lợi và thông báo đẩy xuống Mobile App.</li>
        <li>Sử dụng chung cơ sở dữ liệu bảo mật PostgreSQL, chống sai lệch dữ liệu giữa các bộ phận.</li>
      </ul>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 15: Kiến Trúc Kỹ Thuật Hiện Đại & Chuẩn HTTPS</h2>
      <p class="text-sm text-slate-300">Bảo mật 100% HTTPS/SSL, microservices container hóa trên Docker, PostgreSQL độc lập và gói Native Wrapper Capacitor iOS/Android.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 16: Tổng Kết & Cam Kết Đồng Hành Phát Triển</h2>
      <p class="text-sm text-slate-300">Đoàn kết & gia tăng giá trị thiết thực cho doanh nghiệp hội viên, minh bạch vận hành và sẵn sàng mở rộng quy mô toàn quốc.</p>
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(OUT_DIR, 'SLIDE_THUYET_TRINH_APP_HIEP_HOI_CEO1983.html'), appHtml, 'utf8');
  fs.writeFileSync(path.join(FE_DOCS_DIR, 'SLIDE_THUYET_TRINH_APP_HIEP_HOI_CEO1983.html'), appHtml, 'utf8');

  // HTML & MD for CRM Deck
  const crmHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Slide Thuyết Trình CRM Quản Trị - CLB Doanh Nhân CEO 1983</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'Inter', sans-serif; background: #0A1A3A; color: #F8FAFC; }
    .slide-card { background: #132A56; border: 1px solid #2A3E66; border-radius: 1.25rem; }
    .gold-text { color: #F59E0B; }
  </style>
</head>
<body class="p-4 sm:p-8 max-w-6xl mx-auto">
  <header class="mb-8 border-b border-white/10 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
      <span class="inline-block px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-400/30 mb-2">
        Bộ Slide 16 Trang Quản Trị CRM
      </span>
      <h1 class="text-2xl sm:text-3xl font-black text-white">Thuyết Trình Hệ Thống CRM Quản Trị CLB Doanh Nhân CEO 1983</h1>
      <p class="text-sm text-slate-400 mt-1">Trung tâm Điều hành & Quản trị Số hóa Hiệp hội · Bản quyền © 2026 CLB Doanh Nhân CEO 1983</p>
    </div>
    <a href="SLIDE_THUYET_TRINH_CRM_QUAN_TRI_CEO1983.pptx" download class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg transition flex items-center gap-2">
      📥 Tải PPTX (16 Slides)
    </a>
  </header>

  <div class="space-y-6">
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 01: Bìa Hệ Thống CRM Quản Trị</h2>
      <p class="text-sm text-slate-300">Trung tâm kiểm soát toàn diện: Hội viên · Tài chính quỹ hội · Sự kiện · Sơ đồ chỗ ngồi · Giao thương B2B.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 02: Cổng Đăng Nhập & Phân Quyền Đa Vai Trò</h2>
      <p class="text-sm text-slate-300">Cơ chế RBAC bảo mật cao cho Ban Chủ Tịch, Ban Thư Ký, Ban Tài Chính và Trưởng Ban. Ghi nhận nhật ký kiểm toán bất biến.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 03: Dashboard Điều Hành & Báo Cáo KPI Trực Quan</h2>
      <p class="text-sm text-slate-300">Bức tranh toàn cảnh: Chỉ số tăng trưởng hội viên, đối soát dòng tiền thu chi quỹ hội, đo lường quy mô giao thương B2B.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 04: Quản Lý & Thẩm Định Hồ Sơ Hội Viên</h2>
      <p class="text-sm text-slate-300">Hàng đợi xét duyệt hồ sơ trực tuyến, tự động sinh mã định danh (M1983-xxx), gửi email chào mừng kèm thông tin đăng nhập Mobile App.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 05: Quản Trị Doanh Nghiệp & Chuỗi Cung Ứng Thành Viên</h2>
      <p class="text-sm text-slate-300">Lưu trữ hồ sơ pháp lý, mã số thuế, phân loại ngành nghề và liên kết tài khoản lãnh đạo doanh nghiệp chính xác.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 06: Quản Trị Niên Liễm Hội Phí & Kế Toán Quỹ Hội</h2>
      <p class="text-sm text-slate-300">Cấu hình mức phí hàng năm, tự động gửi thông báo nhắc phí qua App/Email, xuất phiếu thu số và đối soát ngân quỹ minh bạch.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 07: Quản Trị Sự Kiện & Cấu Hình Vé Đa Tầng</h2>
      <p class="text-sm text-slate-300">Khởi tạo sự kiện trong 3 phút, quy định số lượng vé, giá vé khách ngoài và ưu đãi đặc quyền hội viên, tự động đẩy lên App.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 08: Sơ Đồ Rạp & Xếp Chỗ Ngồi VIP Gala Dinner (Cinema Map)</h2>
      <p class="text-sm text-slate-300">Sơ đồ tương tác bố trí Bàn VIP Danh Dự, kéo thả xếp đại biểu và tự động gán vị trí chỗ ngồi vào vé điện tử trên App.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 09: Cổng Soát Vé & Kiểm Soát Check-in QR Code</h2>
      <p class="text-sm text-slate-300">Giao diện quét vé QR 1 giây/người cho Ban Lễ Tân, hiển thị lời chào trân trọng và báo cáo tỷ lệ khách vào hội trường realtime.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 10: Quản Trị Chợ Sản Phẩm & Thẩm Định Chào Hàng B2B</h2>
      <p class="text-sm text-slate-300">Hàng đợi duyệt sản phẩm thành viên, kiểm tra chất lượng và xuất xứ, gắn nhãn đạt chuẩn CEO 1983 trước khi hiển thị trên App.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 11: Điều Phối Cơ Hội Giao Thương & Thống Kê Deal</h2>
      <p class="text-sm text-slate-300">Nắm bắt nhu cầu mua/bán sỉ, thẩm định quy mô Deal, kết nối đối tác tiềm năng và thống kê giá trị giao thương thành công.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 12: Studio Bầu Cử Trực Tuyến & Quay Số May Mắn</h2>
      <p class="text-sm text-slate-300">Thiết lập danh sách ứng viên, mở/khóa cổng biểu quyết realtime, xuất màn hình LED sân khấu 3D và lưu biên bản điện tử bất biến.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 13: Bản Tin Hiệp Hội & Nhật Ký Kiểm Toán An Ninh</h2>
      <p class="text-sm text-slate-300">Soạn thảo văn bản thông tư, đẩy thông báo push tức thời và lưu vết địa chỉ IP/thao tác người dùng để phục hồi dữ liệu khi cần.</p>
    </div>
    <div class="slide-card p-6 border-amber-400/50 bg-amber-950/20">
      <div class="flex items-center gap-2 text-amber-400 font-bold mb-1">
        <span>⭐ ĐIỂM NHẤN QUAN TRỌNG: LIÊN KẾT ĐỒNG BỘ VỚI MOBILE APP</span>
      </div>
      <h2 class="text-lg font-black text-white mb-2">Slide 14: Kết Nối Hai Chiều: Đẩy Dữ Liệu Tức Thì Xuống Mobile App</h2>
      <p class="text-sm text-slate-300 mb-3">CRM là trung tâm điều hành chuyên sâu của Ban Lãnh Đạo, nhưng mọi quyết định quản trị đều phân phối tức thì xuống Mobile App hội viên:</p>
      <ul class="list-disc list-inside text-xs text-slate-300 space-y-1">
        <li>Duyệt hồ sơ trên CRM -> Mobile App hội viên tự động hiển thị Thẻ VIP 3D và mã QR xác thực.</li>
        <li>Mở bán vé sự kiện trên CRM -> Hội viên trên Mobile App nhận thông báo và mua vé, chọn ghế ngay.</li>
        <li>Phê duyệt bài đăng cơ hội và sản phẩm -> Tự động đồng bộ lên sàn giao thương di động.</li>
      </ul>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 15: An Toàn Thông Tin & Hạ Tầng Kỹ Thuật Độc Lập</h2>
      <p class="text-sm text-slate-300">Vận hành độc lập trên Docker container, mã hóa HTTPS bảo mật cổng riêng, sao lưu tự động hàng ngày và khả năng khôi phục nhanh.</p>
    </div>
    <div class="slide-card p-6">
      <h2 class="text-lg font-bold text-amber-400 mb-2">Slide 16: Tổng Kết & Hiệu Quả Quản Trị Số Hóa Toàn Diện</h2>
      <p class="text-sm text-slate-300">Tiết kiệm 90% thời gian xử lý thủ công, dữ liệu tập trung bất biến phục vụ bàn giao nhiệm kỳ và khẳng định chuẩn mực Hiệp hội số.</p>
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(OUT_DIR, 'SLIDE_THUYET_TRINH_CRM_QUAN_TRI_CEO1983.html'), crmHtml, 'utf8');
  fs.writeFileSync(path.join(FE_DOCS_DIR, 'SLIDE_THUYET_TRINH_CRM_QUAN_TRI_CEO1983.html'), crmHtml, 'utf8');

  // Markdown files
  const appMd = `# SLIDE THUYẾT TRÌNH ỨNG DỤNG DI ĐỘNG HIỆP HỘI - CLB DOANH NHÂN CEO 1983
*Bản quyền © 2026 CLB Doanh Nhân CEO 1983 · Trực thuộc Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)*
*Tập tin trình chiếu PowerPoint: SLIDE_THUYET_TRINH_APP_HIEP_HOI_CEO1983.pptx (16 Slides)*

---

### Slide 01: Bìa Trình Bày - Ứng Dụng Di Động CLB Doanh Nhân CEO 1983
- **Chủ đề**: Ứng Dụng Di Động Hiệp Hội Thời Kỳ Số.
- **Nội dung cốt lõi**: Không gian số hội viên đẳng cấp: Thẻ VIP 3D · Chạm thẻ NFC · Giao thương B2B · Vé số hóa.

### Slide 02: Cổng Đăng Nhập & Xác Thực Danh Tính Hội Viên
- **Bảo mật**: Xác thực an toàn qua Số điện thoại / Email kết hợp JWT.
- **Mã hội viên độc bản**: M1983-xxx được bảo vệ 100% qua giao thức HTTPS.

### Slide 03: Dashboard Tổng Quan & Bảng Tin Sinh Hoạt
- **Trực quan**: Banner sự kiện tiêu điểm, truy cập nhanh Thẻ số, Cơ hội, Sản phẩm, Điểm danh QR.
- **Thông báo đẩy**: Cập nhật tức thời thông tư và văn bản nội bộ CLB.

### Slide 04: Thẻ Hội Viên VIP Số Hóa Đẳng Cấp
- **Thiết kế**: Màu Xanh Navy & Vàng Gold kim loại sang trọng.
- **Tiện ích**: Mã QR xác thực trực tuyến trên ceo1983.com, xuất ví Apple & Google Wallet.

### Slide 05: Công Nghệ Chạm Thẻ Thông Minh NFC 1 Chạm
- **Hiện đại**: Trao danh thiếp số không cần đối tác cài app.
- **Tích hợp**: 1 nút bấm lưu toàn bộ thông tin vào danh bạ (vCard) điện thoại đối tác.

### Slide 06: Danh Bạ Doanh Nhân & Kết Nối Tin Cậy
- **Mạng lưới**: Tra cứu 500+ chủ doanh nghiệp theo ngành nghề, quy mô.
- **Tương tác**: Liên hệ trực tiếp qua điện thoại hoặc tin nhắn nội bộ.

### Slide 07: Sàn Trao Cơ Hội Kinh Doanh & Kêu Gọi Đầu Tư
- **Điểm nhấn UI**: Khu vực Cơ hội nổi bật chuyển ảnh 2 giây/lần.
- **Phân loại**: Hợp tác B2B, Kêu gọi vốn, Cung ứng nguyên vật liệu, Xuất nhập khẩu.

### Slide 08: Chợ Sản Phẩm & Dịch Vụ Hội Viên (Marketplace B2B)
- **Ưu tiên nội bộ**: Hội viên CLB CEO 1983 ưu tiên dùng hàng của nhau với giá chiết khấu đặc quyền.
- **Thẩm định**: Sản phẩm được kiểm duyệt chất lượng từ hệ thống CRM.

### Slide 09: Quản Lý Sự Kiện & Đăng Ký Vé Điện Tử
- **Lịch sinh hoạt**: Caravan, Gala Dinner, Cafe Doanh Nhân.
- **Thanh toán**: VietQR động tự kích hoạt vé không cần gửi hóa đơn thủ công.

### Slide 10: Vé Điện Tử Thông Minh & Check-in QR Siêu Tốc
- **Bảo mật**: Mã QR Pass chống chụp màn hình gian lận.
- **Vị trí**: Hiển thị số ghế và bàn tiệc Gala (Bàn VIP 01).

### Slide 11: Bầu Cử Trực Tuyến & Quay Số May Mắn Sự Kiện
- **Minh bạch**: Bỏ phiếu tín nhiệm BCH trực tuyến, cập nhật % kết quả tức thời.
- **Lucky Draw**: Vòng quay may mắn sôi động tại các đêm Gala.

### Slide 12: Hộp Thư Doanh Nghiệp & Nhắn Tin Nội Bộ
- **Chuyên nghiệp**: Nhắn tin 1-1 kín đáo, tạo nhóm ban bệ chuyên đề.
- **Bảo mật**: Chỉ các hội viên chính thức mới có thể liên hệ với nhau.

### Slide 13: Quản Trị Hồ Sơ Cá Nhân & Cài Đặt Bảo Mật
- **Cá nhân hóa**: Cập nhật ảnh đại diện avatar qua MinIO HTTPS, chỉnh sửa thông tin doanh nghiệp.

### Slide 14: LIÊN KẾT ĐỒNG BỘ: HỆ THỐNG QUẢN TRỊ CRM VẬN HÀNH
- **Đặc điểm**: Tách biệt giao diện người dùng nhưng liên kết 100% chức năng và dữ liệu thời gian thực.
- **Minh họa**: Kèm hình ảnh Dashboard KPI và Quản lý hội viên của Web CRM Quản trị.
- **Vận hành**: Mọi đăng ký, mua vé, đăng cơ hội trên App đều được CRM ghi nhận, thẩm định và phê duyệt tự động.

### Slide 15: Kiến Trúc Kỹ Thuật Hiện Đại & Chuẩn Bảo Mật HTTPS
- **Hạ tầng**: Microservices Docker, PostgreSQL bảo mật, Native Wrapper Capacitor iOS/Android.

### Slide 16: Tổng Kết & Cam Kết Đồng Hành Cùng CLB CEO 1983
- **Giá trị**: Nâng tầm vị thế Hiệp hội, gia tăng doanh số thực chất cho doanh nghiệp thành viên.
`;

  const crmMd = `# SLIDE THUYẾT TRÌNH HỆ THỐNG CRM QUẢN TRỊ - CLB DOANH NHÂN CEO 1983
*Bản quyền © 2026 CLB Doanh Nhân CEO 1983 · Trực thuộc Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)*
*Tập tin trình chiếu PowerPoint: SLIDE_THUYET_TRINH_CRM_QUAN_TRI_CEO1983.pptx (16 Slides)*

---

### Slide 01: Bìa Trình Bày - Hệ Thống CRM Quản Trị CLB Doanh Nhân CEO 1983
- **Chủ đề**: Trung Tâm Điều Hành & Quản Trị Số Hóa Toàn Diện.
- **Nội dung cốt lõi**: Hội viên · Tài chính quỹ hội · Sự kiện · Sơ đồ chỗ ngồi · Giao thương B2B.

### Slide 02: Cổng Đăng Nhập & Phân Quyền Đa Vai Trò
- **Phân quyền RBAC**: Super Admin, Ban Thư Ký, Ban Tài Chính, Ban Kiểm Soát.
- **Nhật ký**: Lưu vết mọi thao tác quản trị vào Audit Logs bất biến.

### Slide 03: Dashboard Điều Hành & Báo Cáo KPI Thời Gian Thực
- **Bức tranh toàn cảnh**: Tăng trưởng hội viên, đối soát dòng tiền thu chi quỹ, đo lường quy mô giao thương B2B.

### Slide 04: Quản Lý & Thẩm Định Hồ Sơ Hội Viên
- **Quy trình số hóa**: Tiếp nhận hồ sơ online, thẩm định, cấp mã hội viên M1983-xxx và phát hành thẻ số.

### Slide 05: Quản Trị Doanh Nghiệp & Chuỗi Cung Ứng Thành Viên
- **Dữ liệu**: Quản lý mã số thuế, đại diện pháp luật, phân loại ngành nghề chuỗi cung ứng nội bộ.

### Slide 06: Quản Lý Niên Liễm Hội Phí & Kế Toán Quỹ Hội
- **Minh bạch**: Tự động nhắc nộp niên liễm qua App/Email, xuất phiếu thu số, đối soát ngân quỹ rõ ràng.

### Slide 07: Quản Trị Sự Kiện Hiệp Hội & Cấu Hình Vé Đa Tầng
- **Tổ chức nhanh**: Cấu hình vé miễn phí / vé có phí trong 3 phút, tự động đồng bộ lên Mobile App.

### Slide 08: Sơ Đồ Rạp & Xếp Chỗ Ngồi VIP Gala Dinner (Cinema Map)
- **Sắp đặt**: Sơ đồ rạp tương tác, kéo thả vị trí bàn VIP danh dự, tự động gán vào vé điện tử trên App.

### Slide 09: Kiểm Soát Check-in QR Code Tự Động Tại Cổng
- **Tốc độ**: Soát vé QR chỉ 1 giây/người cho Ban Lễ Tân, hiển thị lời chào trân trọng và tỷ lệ khách vào hội trường.

### Slide 10: Quản Trị Chợ Sản Phẩm & Thẩm Định Chào Hàng B2B
- **Kiểm duyệt**: Thẩm định chất lượng và xuất xứ sản phẩm thành viên trước khi cho phép hiển thị lên App.

### Slide 11: Điều Phối Cơ Hội Giao Thương & Thống Kê Deal
- **Khớp nối B2B**: Nắm bắt nhu cầu mua/bán sỉ, hỗ trợ thẩm định quy mô Deal và kết nối các đối tác tiềm năng.

### Slide 12: Studio Bầu Cử Trực Tuyến & Quay Số May Mắn
- **Điều khiển đại hội**: Mở/khóa cổng biểu quyết realtime, xuất màn hình LED sân khấu hiệu ứng 3D sống động.

### Slide 13: Bản Tin Hiệp Hội & Nhật Ký Kiểm Toán An Ninh
- **Truyền thông**: Soạn thảo thông tư, đẩy tin push tới 100% hội viên, lưu vết IP và phục hồi dữ liệu khi cần.

### Slide 14: LIÊN KẾT ĐỒNG BỘ: ĐỒNG BỘ HAI CHIỀU VỚI MOBILE APP HỘI VIÊN
- **Đặc điểm**: CRM là trung tâm chỉ huy của Ban Quản Trị, nhưng mọi quyết định đều phân phối tức thì xuống Mobile App của hội viên.
- **Minh họa**: Kèm hình ảnh Home Dashboard và Thẻ VIP số hóa trên Mobile App hội viên.
- **Vận hành**: Duyệt hồ sơ -> Cấp thẻ số tức thì; Mở sự kiện -> Hội viên nhận vé và chọn ghế ngay trên điện thoại.

### Slide 15: Hạ Tầng Kỹ Thuật Độc Lập & Tiêu Chuẩn Bảo Mật
- **Hạ tầng**: Container hóa trên Docker, mã hóa HTTPS bảo mật cổng riêng, sao lưu tự động hàng ngày.

### Slide 16: Tổng Kết & Hiệu Quả Quản Trị Số Hóa Toàn Diện
- **Hiệu quả**: Tiết kiệm 90% thời gian thủ công, dữ liệu tập trung bất biến phục vụ chuyển giao nhiệm kỳ Ban Chấp Hành.
`;

  fs.writeFileSync(path.join(OUT_DIR, 'SLIDE_THUYET_TRINH_APP_HIEP_HOI_CEO1983.md'), appMd, 'utf8');
  fs.writeFileSync(path.join(FE_DOCS_DIR, 'SLIDE_THUYET_TRINH_APP_HIEP_HOI_CEO1983.md'), appMd, 'utf8');

  fs.writeFileSync(path.join(OUT_DIR, 'SLIDE_THUYET_TRINH_CRM_QUAN_TRI_CEO1983.md'), crmMd, 'utf8');
  fs.writeFileSync(path.join(FE_DOCS_DIR, 'SLIDE_THUYET_TRINH_CRM_QUAN_TRI_CEO1983.md'), crmMd, 'utf8');

  console.log('✅ Generated companion HTML and Markdown files for both decks!');
}

async function main() {
  await generateAppDeck();
  await generateCrmDeck();
  generateHtmlAndMarkdown();
  console.log('🎉 ALL PRESENTATION DECKS & DOCUMENTS GENERATED SUCCESSFULLY!');
}

main().catch((err) => {
  console.error('❌ Error generating presentations:', err);
  process.exit(1);
});
