const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');

const DOCS_DIR = path.join(__dirname, '..', 'document');
const EVIDENCE_DIR = path.join(DOCS_DIR, 'images', 'evidence');
const PUBLIC_DOCS_DIR = path.join(__dirname, '..', 'apps', 'vione_app_fe', 'public', 'docs');

if (!fs.existsSync(PUBLIC_DOCS_DIR)) {
  fs.mkdirSync(PUBLIC_DOCS_DIR, { recursive: true });
}

function getBase64Image(filename) {
  const p = path.join(EVIDENCE_DIR, filename);
  if (fs.existsSync(p)) {
    const data = fs.readFileSync(p);
    return `data:image/png;base64,${data.toString('base64')}`;
  }
  console.warn(`[WARN] Image not found: ${filename}`);
  return '';
}

// ============================================================================
// 1. GENERATE INTERACTIVE HTML SLIDES - THEME SÁNG TRẮNG DOANH NHÂN (16:9)
// ============================================================================
function generateHtmlSlides() {
  const imgHome = getBase64Image('step_03_app_home_dashboard.png');
  const imgCrmMembers = getBase64Image('step_16_crm_members_approval.png');
  const imgCheckin = getBase64Image('step_08_app_event_qr_pass.png');
  const imgOpps = getBase64Image('step_11_app_opportunities_feed.png');
  const imgRenew = getBase64Image('step_13_app_fee_renewal.png');

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Slide Thuyết Trình Hệ Sinh Thái Số CEO 1983 - Theme Sáng Doanh Nhân (10 Slides)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-body: #F1F5F9;
      --bg-canvas: #FFFFFF;
      --navy-primary: #003B95;
      --navy-dark: #0A1A3A;
      --gold-primary: #D97706;
      --gold-bright: #F59E0B;
      --gold-light: #FEF3C7;
      --text-title: #0A1A3A;
      --text-body: #334155;
      --text-muted: #64748B;
      --border-card: #E2E8F0;
      --border-accent: #CBD5E1;
      --shadow-subtle: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.02);
      --shadow-hover: 0 20px 35px -5px rgba(0, 59, 149, 0.12);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg-body);
      color: var(--text-body);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow-x: hidden;
      padding: 20px 0;
    }

    /* Khung trình chiếu tỷ lệ chuẩn 16:9 - NỀN TRẮNG SANG TRỌNG DOANH NHÂN */
    .deck-container {
      width: 95vw;
      max-width: 1400px;
      aspect-ratio: 16/9;
      background: var(--bg-canvas);
      border-radius: 20px;
      border: 1px solid var(--border-card);
      overflow: hidden;
      box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(226, 232, 240, 0.8);
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .slide {
      display: none;
      width: 100%;
      height: 100%;
      flex-direction: column;
      justify-content: space-between;
      padding: 42px 56px 32px 56px;
      background: linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 60%, #F4F7FB 100%);
      position: relative;
    }

    .slide.active {
      display: flex;
    }

    /* Thanh Accent Vàng Gold trên cùng */
    .top-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #D97706, #F59E0B, #FBBF24, #D97706);
      z-index: 20;
    }

    /* Header của Slide */
    .slide-header {
      margin-bottom: 22px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 30px;
      background: var(--gold-light);
      border: 1px solid #FDE68A;
      color: #B45309;
      font-size: 11.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 10px;
    }

    .slide-title {
      font-size: 30px;
      font-weight: 900;
      color: var(--text-title);
      line-height: 1.25;
      letter-spacing: -0.5px;
    }

    .slide-subtitle {
      font-size: 15px;
      color: var(--text-muted);
      margin-top: 6px;
      font-weight: 500;
    }

    /* Bố cục nội dung trung tâm */
    .slide-body {
      flex: 1;
      display: flex;
      gap: 36px;
      align-items: center;
      min-height: 0;
    }

    /* Phân chia 2 Cột: Bên trái Nội dung - Bên phải Khung ảnh */
    .col-left {
      flex: 1.1;
      display: flex;
      flex-direction: column;
      gap: 16px;
      justify-content: center;
    }

    .col-right {
      flex: 0.9;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 0;
    }

    /* Khung Mockup Ảnh Độc Lập Sắc Nét */
    .mockup-frame {
      width: 100%;
      height: 100%;
      max-height: 380px;
      background: #FFFFFF;
      border: 1.5px solid var(--border-accent);
      border-radius: 18px;
      padding: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 20px 40px -10px rgba(0, 59, 149, 0.12);
      overflow: hidden;
    }

    .mockup-frame img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 12px;
      border: 1px solid var(--border-card);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
    }

    /* Card giao diện đẹp mắt - Nền Trắng, Viền Xanh / Vàng */
    .info-card {
      background: #FFFFFF;
      border: 1px solid var(--border-card);
      border-left: 4px solid var(--navy-primary);
      border-radius: 14px;
      padding: 18px 22px;
      box-shadow: var(--shadow-subtle);
      transition: all 0.2s ease;
    }

    .info-card:hover {
      box-shadow: var(--shadow-hover);
      border-left-color: var(--gold-bright);
    }

    .info-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 6px;
    }

    .icon-box {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #EFF6FF;
      border: 1px solid #DBEAFE;
      color: var(--navy-primary);
      display: grid;
      place-items: center;
      font-size: 18px;
      font-weight: 900;
      flex-shrink: 0;
    }

    .card-title {
      font-size: 16px;
      font-weight: 800;
      color: var(--text-title);
    }

    .card-desc {
      font-size: 13.5px;
      color: var(--text-body);
      line-height: 1.55;
    }

    /* Grid 4 Cột dành cho Slide Không Ảnh (Mục đích, Đặc điểm) */
    .grid-2x2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      width: 100%;
    }

    .goal-card {
      background: #FFFFFF;
      border: 1px solid var(--border-card);
      border-top: 3px solid var(--gold-bright);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-shadow: var(--shadow-subtle);
      transition: all 0.3s ease;
    }

    .goal-card:hover {
      box-shadow: var(--shadow-hover);
      border-top-color: var(--navy-primary);
      transform: translateY(-2px);
    }

    .goal-num {
      font-size: 32px;
      font-weight: 900;
      color: var(--gold-primary);
      line-height: 1;
    }

    .goal-title {
      font-size: 17px;
      font-weight: 800;
      color: var(--text-title);
    }

    .goal-desc {
      font-size: 13.5px;
      color: var(--text-body);
      line-height: 1.6;
    }

    /* Footer Slide */
    .slide-footer {
      border-top: 1px solid var(--border-card);
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 600;
    }

    /* Animation Keyframes */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes zoomIn {
      from { opacity: 0; transform: scale(0.92); }
      to { opacity: 1; transform: scale(1); }
    }

    .slide.active .anim-header {
      animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .slide.active .anim-1 {
      animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
      opacity: 0;
    }

    .slide.active .anim-2 {
      animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
      opacity: 0;
    }

    .slide.active .anim-3 {
      animation: zoomIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.25s forwards;
      opacity: 0;
    }

    /* Bộ điều khiển trình chiếu */
    .nav-bar {
      margin-top: 20px;
      display: flex;
      align-items: center;
      gap: 20px;
      background: #FFFFFF;
      padding: 10px 24px;
      border-radius: 40px;
      border: 1px solid var(--border-card);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06);
    }

    .btn-nav {
      background: var(--navy-primary);
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .btn-nav:hover {
      background: var(--gold-bright);
      color: var(--navy-dark);
    }

    .slide-counter {
      font-size: 14px;
      font-weight: 800;
      color: var(--navy-primary);
      letter-spacing: 1px;
    }

    /* In ấn & Xuất PDF chuẩn 16:9 Widescreen */
    @media print {
      @page {
        size: 16in 9in;
        margin: 0;
      }
      body {
        background: #FFFFFF !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .deck-container {
        width: 16in !important;
        max-width: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        border: none !important;
      }
      .slide {
        display: flex !important;
        width: 16in !important;
        height: 9in !important;
        page-break-after: always !important;
        break-after: page !important;
        box-sizing: border-box !important;
        padding: 0.6in 0.8in !important;
      }
      .nav-bar {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <div class="deck-container" id="presentation">
    <div class="top-bar"></div>

    <!-- SLIDE 1: GIỚI THIỆU HỆ THỐNG (CÓ ẢNH) -->
    <div class="slide active">
      <div class="slide-header anim-header">
        <span class="badge">01 · Giới Thiệu Hệ Thống</span>
        <h1 class="slide-title">HỆ SINH THÁI CHUYỂN ĐỔI SỐ CLB DOANH NHÂN CEO 1983</h1>
        <p class="slide-subtitle">Giải pháp Quản trị Hiệp hội Chuyên sâu (Web CRM) song hành Nền tảng Giao thương Di động (Mobile App)</p>
      </div>
      <div class="slide-body">
        <div class="col-left anim-1">
          <div class="info-card">
            <div class="info-card-header">
              <div class="icon-box">💻</div>
              <div class="card-title">Web CRM Quản Trị Trung Tâm</div>
            </div>
            <div class="card-desc">Trung tâm kiểm soát dữ liệu hội viên, phân quyền đa tầng, thẩm định cơ hội và quản trị ngân quỹ theo thời gian thực.</div>
          </div>
          <div class="info-card">
            <div class="info-card-header">
              <div class="icon-box">📱</div>
              <div class="card-title">Mobile App Doanh Nhân Bỏ Túi</div>
            </div>
            <div class="card-desc">Văn phòng số cá nhân: Thẻ VIP tích hợp QR cá nhân, danh bạ doanh nghiệp, gian hàng ưu đãi & sàn giao thương 24/7.</div>
          </div>
          <div class="info-card">
            <div class="info-card-header">
              <div class="icon-box">⚡</div>
              <div class="card-title">Đồng Bộ Dữ Liệu Hai Chiều Tức Thời</div>
            </div>
            <div class="card-desc">Hội viên đăng ký hoặc giao dịch trên App -> Đổ thẳng về CRM xử lý -> CRM tự động kích hoạt thẻ và quyền lợi tức thì.</div>
          </div>
        </div>
        <div class="col-right anim-3">
          <div class="mockup-frame">
            <img src="${imgHome}" alt="Giao diện Trang chủ App CEO 1983" />
          </div>
        </div>
      </div>
      <div class="slide-footer">
        <span style="color: var(--navy-primary);">CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 01 / 10</span>
      </div>
    </div>

    <!-- SLIDE 2: MỤC ĐÍCH CỦA HỆ THỐNG (KHÔNG CÓ ẢNH) -->
    <div class="slide">
      <div class="slide-header anim-header">
        <span class="badge">02 · Mục Đích Triển Khai</span>
        <h2 class="slide-title">MỤC ĐÍCH & SỨ MỆNH CHUYỂN ĐỔI SỐ HỘI QUÁN</h2>
        <p class="slide-subtitle">Giải quyết triệt để các bất cập trong quản lý truyền thống và nâng cao năng lực kết nối B2B</p>
      </div>
      <div class="slide-body">
        <div class="grid-2x2 anim-1">
          <div class="goal-card">
            <div class="goal-num">01</div>
            <div class="goal-title">Số Hóa & Bảo Mật Dữ Liệu Tập Trung</div>
            <div class="goal-desc">Chấm dứt việc lưu trữ danh sách hội viên phân tán trên nhiều file Excel cá nhân; tập trung toàn bộ hồ sơ doanh nghiệp vào cơ sở dữ liệu số an toàn.</div>
          </div>
          <div class="goal-card">
            <div class="goal-num">02</div>
            <div class="goal-title">Tự Động Hóa Quản Lý Hội Phí</div>
            <div class="goal-desc">Loại bỏ quy trình rà soát sao kê ngân hàng thủ công; tích hợp mã VietQR động để ghi nhận đóng hội phí thường niên và tự động gia hạn quyền lợi.</div>
          </div>
          <div class="goal-card">
            <div class="goal-num">03</div>
            <div class="goal-title">Nâng Tầm Chuyên Nghiệp Sự Kiện</div>
            <div class="goal-desc">Đón tiếp đại biểu tại cửa không tắc nghẽn nhờ vé điện tử QR Pass quét tức thì dưới 1 giây; tích hợp số hóa biểu quyết và quay số Lucky Draw công khai.</div>
          </div>
          <div class="goal-card">
            <div class="goal-num">04</div>
            <div class="goal-title">Kích Hoạt Giao Thương Thực Chất</div>
            <div class="goal-desc">Tạo lập không gian trao đổi cơ hội kinh doanh tin cậy nội khối, thúc đẩy doanh thu và quảng bá sản phẩm dịch vụ giữa các doanh nhân trong CLB.</div>
          </div>
        </div>
      </div>
      <div class="slide-footer">
        <span style="color: var(--navy-primary);">CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 02 / 10</span>
      </div>
    </div>

    <!-- SLIDE 3: CHỨC NĂNG 1 - WEB CRM QUẢN TRỊ (CÓ ẢNH) -->
    <div class="slide">
      <div class="slide-header anim-header">
        <span class="badge">03 · Chức Năng Cốt Lõi</span>
        <h2 class="slide-title">WEB CRM: TRUNG TÂM ĐIỀU HÀNH & KIỂM SOÁT DỮ LIỆU</h2>
        <p class="slide-subtitle">Công cụ hỗ trợ đắc lực dành cho Ban Thư ký và Ban Chấp hành trong công tác tổ chức hội quán</p>
      </div>
      <div class="slide-body">
        <div class="col-left anim-1">
          <div class="info-card">
            <div class="info-card-header">
              <div class="icon-box">👥</div>
              <div class="card-title">Quản Lý Hội Viên & Phê Duyệt Kết Nạp</div>
            </div>
            <div class="card-desc">Tiếp nhận hồ sơ gia nhập trực tuyến, tra cứu lịch sử hoạt động, phân nhóm theo ngành nghề và phê duyệt cấp mã hội viên tự động.</div>
          </div>
          <div class="info-card">
            <div class="info-card-header">
              <div class="icon-box">📊</div>
              <div class="card-title">Giám Sát Chỉ Số KPI Theo Thời Gian Thực</div>
            </div>
            <div class="card-desc">Biểu đồ trực quan theo dõi số lượng hội viên mới, tỷ lệ gia hạn hội phí, lưu lượng kết nối giao thương và ngân quỹ CLB.</div>
          </div>
          <div class="info-card">
            <div class="info-card-header">
              <div class="icon-box">🔐</div>
              <div class="card-title">Phân Quyền Vai Trò & Bảo Mật Tuyệt Đối</div>
            </div>
            <div class="card-desc">Kiểm soát truy cập chặt chẽ giữa Chủ tịch, Ban Thư ký, Kế toán và Ban Kiểm soát; lưu vết mọi thao tác chỉnh sửa dữ liệu.</div>
          </div>
        </div>
        <div class="col-right anim-3">
          <div class="mockup-frame">
            <img src="${imgCrmMembers}" alt="Giao diện CRM Quản trị Hội viên" />
          </div>
        </div>
      </div>
      <div class="slide-footer">
        <span style="color: var(--navy-primary);">CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 03 / 10</span>
      </div>
    </div>

    <!-- SLIDE 4: CHỨC NĂNG 2 - MOBILE APP DOANH NHÂN (CÓ ẢNH) -->
    <div class="slide">
      <div class="slide-header anim-header">
        <span class="badge">04 · Chức Năng Cốt Lõi</span>
        <h2 class="slide-title">MOBILE APP: TRẢI NGHIỆM ĐẶC QUYỀN HỘI VIÊN BỎ TÚI</h2>
        <p class="slide-subtitle">Văn phòng số cá nhân giúp doanh nhân kết nối và sinh hoạt hội đồng mọi lúc mọi nơi</p>
      </div>
      <div class="slide-body">
        <div class="col-left anim-1">
          <div class="info-card">
            <div class="info-card-header">
              <div class="icon-box">👑</div>
              <div class="card-title">Thẻ Hội Viên VIP & Danh Thiếp Số</div>
            </div>
            <div class="card-desc">Hiển thị thẻ hội viên sang trọng mang dấu ấn CEO 1983, tích hợp mã QR cá nhân giúp trao đổi thông tin chỉ trong 1 lần chạm.</div>
          </div>
          <div class="info-card">
            <div class="info-card-header">
              <div class="icon-box">📖</div>
              <div class="card-title">Danh Bạ Doanh Nhân & Tìm Kiếm Đối Tác</div>
            </div>
            <div class="card-desc">Tra cứu nhanh chóng hồ sơ năng lực, ngành nghề và số điện thoại của hơn hàng trăm hội viên cùng niên khóa 1983.</div>
          </div>
          <div class="info-card">
            <div class="info-card-header">
              <div class="icon-box">💬</div>
              <div class="card-title">Nhắn Tin B2B & Kết Nối Trực Tiếp 1-on-1</div>
            </div>
            <div class="card-desc">Kênh trò chuyện bảo mật nội bộ, gửi danh thiếp và đặt lịch hẹn giao lưu doanh nghiệp ngay trên ứng dụng.</div>
          </div>
        </div>
        <div class="col-right anim-3">
          <div class="mockup-frame">
            <img src="${imgHome}" alt="Thẻ VIP & Trang chủ App Doanh nhân" />
          </div>
        </div>
      </div>
      <div class="slide-footer">
        <span style="color: var(--navy-primary);">CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 04 / 10</span>
      </div>
    </div>

    <!-- SLIDE 5: CHỨC NĂNG 3 - SỰ KIỆN & CHECK-IN QR (CÓ ẢNH) -->
    <div class="slide">
      <div class="slide-header anim-header">
        <span class="badge">05 · Chức Năng Cốt Lõi</span>
        <h2 class="slide-title">QUẢN TRỊ SỰ KIỆN & VÉ ĐIỆN TỬ CHECK-IN QR PASS</h2>
        <p class="slide-subtitle">Quy trình tổ chức đại hội, diễn đàn và gala doanh nhân chuyên nghiệp chuẩn 5 sao</p>
      </div>
      <div class="slide-body">
        <div class="col-left anim-1">
          <div class="info-card">
            <div class="info-card-header">
              <div class="icon-box">🎟️</div>
              <div class="card-title">Đăng Ký & Phát Hành Vé Điện Tử Tức Thời</div>
            </div>
            <div class="card-desc">Hội viên xem nội dung, lịch trình sự kiện và nhấn đăng ký nhận vé điện tử định danh chứa mã QR cá nhân ngay trên App.</div>
          </div>
          <div class="info-card">
            <div class="info-card-header">
              <div class="icon-box">⚡</div>
              <div class="card-title">Quét Điểm Danh Check-in Dưới 1 Giây</div>
            </div>
            <div class="card-desc">Lễ tân quét vé bằng camera điện thoại, hệ thống xác thực tức thì và chống trùng lặp vé 100%, chấm dứt ùn tắc tại cửa ra vào.</div>
          </div>
          <div class="info-card">
            <div class="info-card-header">
              <div class="icon-box">🎁</div>
              <div class="card-title">Biểu Quyết Trực Tuyến & Quay Số May Mắn</div>
            </div>
            <div class="card-desc">Tích hợp công cụ biểu quyết bầu cử Ban Chấp Hành minh bạch và vòng quay may mắn Lucky Draw ngẫu nhiên tại đêm tiệc.</div>
          </div>
        </div>
        <div class="col-right anim-3">
          <div class="mockup-frame">
            <img src="${imgCheckin}" alt="Màn hình Vé Check-in QR Pass" />
          </div>
        </div>
      </div>
      <div class="slide-footer">
        <span style="color: var(--navy-primary);">CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 05 / 10</span>
      </div>
    </div>

    <!-- SLIDE 6: CHỨC NĂNG 4 - MARKETPLACE & CƠ HỘI B2B (CÓ ẢNH) -->
    <div class="slide">
      <div class="slide-header anim-header">
        <span class="badge">06 · Chức Năng Cốt Lõi</span>
        <h2 class="slide-title">SÀN GIAO THƯƠNG B2B & GIAN HÀNG SẢN PHẨM ƯU ĐÃI</h2>
        <p class="slide-subtitle">Không gian thúc đẩy doanh số, ưu tiên sử dụng sản phẩm dịch vụ của nhau trong CLB</p>
      </div>
      <div class="slide-body">
        <div class="col-left anim-1">
          <div class="info-card">
            <div class="info-card-header">
              <div class="icon-box">🛍️</div>
              <div class="card-title">Gian Hàng Sản Phẩm Đặc Quyền Hội Viên</div>
            </div>
            <div class="card-desc">Mỗi doanh nghiệp tự do giới thiệu sản phẩm, dịch vụ thế mạnh kèm chính sách chiết khấu ưu đãi dành riêng cho hội viên CEO 1983.</div>
          </div>
          <div class="info-card">
            <div class="info-card-header">
              <div class="icon-box">🤝</div>
              <div class="card-title">Bảng Tin Trao Cơ Hội & Khảo Sát Nhu Cầu</div>
            </div>
            <div class="card-desc">Đăng tải nhu cầu tìm nhà cung cấp, tìm đại lý hoặc kêu gọi hợp tác đầu tư; đối tác tiềm năng nhấn tiếp nhận chỉ sau 1 chạm.</div>
          </div>
          <div class="info-card">
            <div class="info-card-header">
              <div class="icon-box">📈</div>
              <div class="card-title">Ghi Nhận & Báo Cáo Giá Trị Kết Nối</div>
            </div>
            <div class="card-desc">Thống kê tổng giá trị các thương vụ giao dịch thành công trong hội quán, tạo động lực gắn kết và phát triển kinh tế tập thể.</div>
          </div>
        </div>
        <div class="col-right anim-3">
          <div class="mockup-frame">
            <img src="${imgOpps}" alt="Màn hình Trao Cơ Hội Giao Thương" />
          </div>
        </div>
      </div>
      <div class="slide-footer">
        <span style="color: var(--navy-primary);">CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 06 / 10</span>
      </div>
    </div>

    <!-- SLIDE 7: CHỨC NĂNG 5 - HỘI PHÍ THƯỜNG NIÊN (CÓ ẢNH) -->
    <div class="slide">
      <div class="slide-header anim-header">
        <span class="badge">07 · Chức Năng Cốt Lõi</span>
        <h2 class="slide-title">QUẢN LÝ HỘI PHÍ THƯỜNG NIÊN & SỔ QUỸ MINH BẠCH</h2>
        <p class="slide-subtitle">Tự động hóa toàn diện quy trình thu nộp phí và công khai thu chi quỹ hội</p>
      </div>
      <div class="slide-body">
        <div class="col-left anim-1">
          <div class="info-card">
            <div class="info-card-header">
              <div class="icon-box">💳</div>
              <div class="card-title">Thanh Toán Quét Mã VietQR Thông Minh</div>
            </div>
            <div class="card-desc">Hệ thống tạo mã VietQR động điền sẵn số tiền hội phí thường niên và cú pháp; hội viên quét mã trên app ngân hàng trong 10 giây.</div>
          </div>
          <div class="info-card">
            <div class="info-card-header">
              <div class="icon-box">✨</div>
              <div class="card-title">Tự Động Gia Hạn Thẻ Số Tức Thời</div>
            </div>
            <div class="card-desc">Ngay khi tài khoản nhận tiền, thẻ hội viên tự động cập nhật niên khóa mới và gửi thông báo xác nhận đến hội viên.</div>
          </div>
          <div class="info-card">
            <div class="info-card-header">
              <div class="icon-box">📑</div>
              <div class="card-title">Sổ Quỹ Thu Chi Rõ Ràng & Báo Cáo Tài Chính</div>
            </div>
            <div class="card-desc">Theo dõi minh bạch các nguồn thu tài trợ, thu hội phí và các khoản chi hoạt động; xuất báo cáo đối soát phục vụ Ban Kiểm soát.</div>
          </div>
        </div>
        <div class="col-right anim-3">
          <div class="mockup-frame">
            <img src="${imgRenew}" alt="Màn hình Đóng Hội Phí VietQR" />
          </div>
        </div>
      </div>
      <div class="slide-footer">
        <span style="color: var(--navy-primary);">CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 07 / 10</span>
      </div>
    </div>

    <!-- SLIDE 8: ĐẶC ĐIỂM NỔI BẬT DÀNH RIÊNG CEO 1983 (KHÔNG CÓ ẢNH) -->
    <div class="slide">
      <div class="slide-header anim-header">
        <span class="badge">08 · Lợi Thế Vượt Trội</span>
        <h2 class="slide-title">ĐẶC ĐIỂM NỔI BẬT THÍCH HỢP CHO CEO 1983</h2>
        <p class="slide-subtitle">Giải pháp được thiết kế "may đo" dựa trên hành vi sinh hoạt và văn hóa riêng biệt của CLB</p>
      </div>
      <div class="slide-body">
        <div class="grid-2x2 anim-1">
          <div class="goal-card">
            <div class="goal-num">⭐</div>
            <div class="goal-title">Nhận Diện Sang Trọng Classic Navy & Gold</div>
            <div class="goal-desc">Giao diện thể hiện đẳng cấp doanh nhân với gam màu xanh Cobalt Navy #003B95 kết hợp vàng Amber Gold #F59E0B và logo dập nổi CEO 1983.</div>
          </div>
          <div class="goal-card">
            <div class="goal-num">🚀</div>
            <div class="goal-title">Trải Nghiệm Mượt Mà, Không Rào Cản Kỹ Thuật</div>
            <div class="goal-desc">Thao tác đơn giản, bố cục trực quan, font chữ to rõ; phù hợp cho các Chủ tịch, Tổng giám đốc bận rộn thao tác nhanh chỉ bằng một ngón tay.</div>
          </div>
          <div class="goal-card">
            <div class="goal-num">🔒</div>
            <div class="goal-title">Hạ Tầng Độc Lập & Bảo Mật Cao Cấp</div>
            <div class="goal-desc">Hệ thống sở hữu máy chủ và cơ sở dữ liệu riêng, cam kết không chia sẻ dữ liệu hội viên ra bên ngoài, vận hành ổn định trên nền tảng Docker & Nginx SSL.</div>
          </div>
          <div class="goal-card">
            <div class="goal-num">🔄</div>
            <div class="goal-title">Sẵn Sàng Mở Rộng & Tích Hợp Đa Nền Tảng</div>
            <div class="goal-desc">Cấu trúc module linh hoạt, dễ dàng mở rộng tính năng theo sự phát triển của CLB và kết nối API với các hiệp hội doanh nghiệp đối tác.</div>
          </div>
        </div>
      </div>
      <div class="slide-footer">
        <span style="color: var(--navy-primary);">CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 08 / 10</span>
      </div>
    </div>

    <!-- SLIDE 9: HƯỚNG PHÁT TRIỂN (KHÔNG CÓ ẢNH) -->
    <div class="slide">
      <div class="slide-header anim-header">
        <span class="badge">09 · Tầm Nhìn & Tương Lai</span>
        <h2 class="slide-title">HƯỚNG PHÁT TRIỂN & LỘ TRÌNH NÂNG CẤP HỆ SINH THÁI</h2>
        <p class="slide-subtitle">Không ngừng nâng cấp công nghệ để giữ vững vị thế hội quán doanh nhân dẫn đầu thời đại số</p>
      </div>
      <div class="slide-body">
        <div class="grid-2x2 anim-1">
          <div class="goal-card">
            <div class="goal-num">01</div>
            <div class="goal-title">Giai Đoạn 1: Chuẩn Hóa & Hoàn Thiện Vận Hành</div>
            <div class="goal-desc">Đưa vào vận hành chính thức Web CRM và Mobile App; đồng bộ 100% hồ sơ hội viên và thu hội phí thường niên qua VietQR tự động.</div>
          </div>
          <div class="goal-card">
            <div class="goal-num">02</div>
            <div class="goal-title">Giai Đoạn 2: Trợ Lý Ảo AI Matching Doanh Nghiệp</div>
            <div class="goal-desc">Ứng dụng trí tuệ nhân tạo (AI) tự động phân tích hồ sơ năng lực để gợi ý kết nối đối tác kinh doanh phù hợp nhất cho từng hội viên.</div>
          </div>
          <div class="goal-card">
            <div class="goal-num">03</div>
            <div class="goal-title">Giai Đoạn 3: Liên Minh Sàn Thương Mại Đa Hiệp Hội</div>
            <div class="goal-desc">Mở rộng kết nối liên thông giao thương với các hiệp hội bạn bè trong và ngoài nước (HanoiBA, YBA, VINASME), mở rộng đầu ra cho hội viên.</div>
          </div>
          <div class="goal-card">
            <div class="goal-num">04</div>
            <div class="goal-title">Giai Đoạn 4: Xếp Hạng Tín Nhiệm & Bảo Chứng Số</div>
            <div class="goal-desc">Xây dựng chỉ số tín nhiệm doanh nhân nội khối dựa trên lịch sử hoạt động và đánh giá uy tín, nâng tầm vị thế thương hiệu cá nhân của hội viên.</div>
          </div>
        </div>
      </div>
      <div class="slide-footer">
        <span style="color: var(--navy-primary);">CLB Doanh Nhân CEO 1983 · HanoiBA</span>
        <span>Slide 09 / 10</span>
      </div>
    </div>

    <!-- SLIDE 10: KẾT THÚC & ĐỒNG HÀNH (KHÔNG CÓ ẢNH) -->
    <div class="slide">
      <div class="slide-header anim-header" style="text-align: center;">
        <span class="badge" style="margin: 0 auto 10px auto;">10 · Đồng Hành & Phát Triển</span>
        <h2 class="slide-title" style="font-size: 34px; margin-top: 6px;">CÙNG NHAU KIẾN TẠO HỘI QUÁN DOANH NHÂN VỮNG MẠNH</h2>
        <p class="slide-subtitle" style="font-size: 16px; max-width: 800px; margin: 10px auto 0 auto;">
          Chuyển đổi số không chỉ là ứng dụng công nghệ, mà là cam kết cùng nhau bứt phá, mở rộng cơ hội và gắn kết bền lâu của các Doanh nhân tuổi 1983.
        </p>
      </div>
      <div class="slide-body" style="justify-content: center;">
        <div style="display: flex; gap: 30px; max-width: 900px; width: 100%; justify-content: center;" class="anim-1">
          <div class="goal-card" style="flex: 1; text-align: center; align-items: center; border-top: 4px solid var(--navy-primary);">
            <div class="goal-num" style="font-size: 40px; margin-bottom: 4px;">🌐</div>
            <div class="goal-title" style="font-size: 18px;">Web CRM Quản Trị</div>
            <div class="goal-desc" style="color: var(--navy-primary); font-weight: 800; font-size: 15px;">https://14.225.217.232:5443</div>
            <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 4px;">Dành cho Ban Chấp Hành & Ban Thư Ký</div>
          </div>
          <div class="goal-card" style="flex: 1; text-align: center; align-items: center; border-top: 4px solid var(--gold-bright);">
            <div class="goal-num" style="font-size: 40px; margin-bottom: 4px;">📱</div>
            <div class="goal-title" style="font-size: 18px;">App Hiệp Hội CEO 1983</div>
            <div class="goal-desc" style="color: var(--gold-primary); font-weight: 800; font-size: 15px;">https://14.225.217.232:5444/association</div>
            <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 4px;">Dành cho Toàn thể Hội viên Doanh nhân</div>
          </div>
        </div>
      </div>
      <div class="slide-footer">
        <span style="color: var(--navy-primary);">Trân trọng cảm ơn Ban Điều Hành & Toàn thể Hội Viên CLB CEO 1983</span>
        <span>Slide 10 / 10</span>
      </div>
    </div>

  </div>

  <!-- Thanh điều khiển phía dưới -->
  <div class="nav-bar">
    <button class="btn-nav" id="prevBtn" onclick="changeSlide(-1)">
      &#8592; Trang trước
    </button>
    <div class="slide-counter" id="counter">01 / 10</div>
    <button class="btn-nav" id="nextBtn" onclick="changeSlide(1)">
      Trang sau &#8594;
    </button>
  </div>

  <script>
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const counter = document.getElementById('counter');

    function showSlide(idx) {
      if (idx < 0) idx = 0;
      if (idx >= slides.length) idx = slides.length - 1;
      currentSlide = idx;

      slides.forEach((s, i) => {
        s.classList.toggle('active', i === currentSlide);
      });

      const num = String(currentSlide + 1).padStart(2, '0');
      const total = String(slides.length).padStart(2, '0');
      counter.innerText = num + ' / ' + total;
    }

    function changeSlide(step) {
      showSlide(currentSlide + step);
    }

    // Bàn phím điều hướng
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        changeSlide(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        changeSlide(-1);
      } else if (e.key === 'Home') {
        showSlide(0);
      } else if (e.key === 'End') {
        showSlide(slides.length - 1);
      }
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(DOCS_DIR, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_CEO1983.html'), html, 'utf8');
  fs.writeFileSync(path.join(PUBLIC_DOCS_DIR, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_CEO1983.html'), html, 'utf8');
  console.log('✓ Xuất file HTML Slide (Theme Sáng Trắng Doanh Nhân) thành công!');
}

// ============================================================================
// 2. GENERATE MARKDOWN SLIDES
// ============================================================================
function generateMarkdownSlides() {
  const md = `# SLIDE THUYẾT TRÌNH HỆ SINH THÁI SỐ CLB DOANH NHÂN CEO 1983 (10 SLIDES CHUẨN BỐ CỤC)

---

## Slide 01: Giới Thiệu Hệ Thống
- **Tiêu đề**: HỆ SINH THÁI CHUYỂN ĐỔI SỐ CLB DOANH NHÂN CEO 1983
- **Phụ đề**: Giải pháp Quản trị Hiệp hội Chuyên sâu (Web CRM) song hành Nền tảng Giao thương Di động (Mobile App)
- **Nội dung chính**:
  1. **Web CRM Quản Trị Trung Tâm**: Kiểm soát dữ liệu hội viên, tài chính quỹ hội, sự kiện và đối soát tự động theo thời gian thực.
  2. **Mobile App Doanh Nhân Bỏ Túi**: Văn phòng số cá nhân với thẻ VIP 3D, danh bạ doanh nghiệp, gian hàng ưu đãi & sàn trao đổi cơ hội.
  3. **Đồng Bộ Dữ Liệu Hai Chiều**: Hội viên thao tác trên App -> Tự động đổ về CRM xét duyệt -> CRM đẩy thông báo và phân quyền tức thì.
- **Hình ảnh minh họa**: \`step_03_app_home_dashboard.png\` (Giao diện trang chủ App Doanh nhân)

---

## Slide 02: Mục Đích Triển Khai Hệ Thống
- **Tiêu đề**: MỤC ĐÍCH & SỨ MỆNH CHUYỂN ĐỔI SỐ HỘI QUÁN
- **Phụ đề**: Xây dựng nền tảng gắn kết bền chặt, minh bạch và gia tăng giá trị thương mại cho toàn thể hội viên
- **Nội dung chính**:
  1. **Số Hóa & Bảo Mật Dữ Liệu Tập Trung**: Chấm dứt việc lưu trữ danh sách hội viên phân tán trên nhiều file Excel cá nhân; tập trung toàn bộ hồ sơ doanh nghiệp vào cơ sở dữ liệu số an toàn.
  2. **Tự Động Hóa Quản Lý Hội Phí**: Loại bỏ quy trình rà soát sao kê ngân hàng thủ công; tích hợp mã VietQR động để ghi nhận đóng hội phí thường niên và tự động gia hạn quyền lợi.
  3. **Nâng Tầm Chuyên Nghiệp Sự Kiện**: Đón tiếp đại biểu tại cửa không tắc nghẽn nhờ vé điện tử QR Pass quét tức thì dưới 1 giây; tích hợp số hóa biểu quyết và quay số Lucky Draw công khai.
  4. **Kích Hoạt Giao Thương Thực Chất**: Tạo lập không gian trao đổi cơ hội kinh doanh tin cậy nội khối, thúc đẩy doanh thu và quảng bá sản phẩm dịch vụ giữa các doanh nhân trong CLB.

---

## Slide 03: Chức Năng 1 - Web CRM Quản Trị Trung Tâm
- **Tiêu đề**: WEB CRM: TRUNG TÂM ĐIỀU HÀNH & KIỂM SOÁT DỮ LIỆU
- **Phụ đề**: Công cụ hỗ trợ đắc lực dành cho Ban Thư ký và Ban Chấp hành trong công tác tổ chức hội quán
- **Nội dung chính**:
  - **Quản lý hội viên & duyệt hồ sơ**: Phê duyệt hồ sơ gia nhập trực tuyến, tra cứu lịch sử hoạt động, cấp mã hội viên tự động.
  - **Giám sát chỉ số KPI Realtime**: Biểu đồ theo dõi số lượng hội viên, tỷ lệ gia hạn hội phí và các giao dịch kết nối.
  - **Phân quyền đa tầng & bảo mật**: Phân định rõ quyền hạn giữa Chủ tịch, Thư ký, Kế toán và Ban Kiểm soát.
- **Hình ảnh minh họa**: \`step_16_crm_members_approval.png\` (Màn hình quản trị danh sách hội viên CRM)

---

## Slide 04: Chức Năng 2 - Mobile App Doanh Nhân Bỏ Túi
- **Tiêu đề**: MOBILE APP: TRẢI NGHIỆM ĐẶC QUYỀN HỘI VIÊN BỎ TÚI
- **Phụ đề**: Văn phòng số cá nhân giúp doanh nhân kết nối và sinh hoạt hội đồng mọi lúc mọi nơi
- **Nội dung chính**:
  - **Thẻ hội viên VIP & Danh thiếp số**: Hiển thị thẻ VIP sang trọng mang dấu ấn CEO 1983, chạm quét mã QR danh thiếp nhanh chóng.
  - **Danh bạ doanh nhân & tìm kiếm đối tác**: Tra cứu hồ sơ năng lực, ngành nghề và thông tin liên hệ của các hội viên trong CLB.
  - **Nhắn tin B2B 1-on-1 Realtime**: Kênh trò chuyện nội bộ bảo mật, gửi danh thiếp và thiết lập cuộc hẹn giao lưu kinh doanh.
- **Hình ảnh minh họa**: \`step_03_app_home_dashboard.png\` (Thẻ VIP & Dashboard App Doanh nhân)

---

## Slide 05: Chức Năng 3 - Tổ Chức Sự Kiện & Check-in QR Thông Minh
- **Tiêu đề**: QUẢN TRỊ SỰ KIỆN & VÉ ĐIỆN TỬ CHECK-IN QR PASS
- **Phụ đề**: Quy trình tổ chức đại hội, diễn đàn và gala doanh nhân chuyên nghiệp chuẩn 5 sao
- **Nội dung chính**:
  - **Đăng ký vé online tức thời**: Hội viên xem lịch trình, đăng ký vé và nhận ngay vé điện tử định danh chứa mã QR cá nhân.
  - **Quét Check-in tốc độ cao**: Điểm danh đại biểu dưới 1 giây bằng camera điện thoại, hệ thống xác thực tự động và chống trùng vé 100%.
  - **Biểu quyết số & Lucky Draw**: Tích hợp biểu quyết đại hội minh bạch và vòng quay may mắn may đo cho các đêm tiệc Gala.
- **Hình ảnh minh họa**: \`step_08_app_event_qr_pass.png\` (Vé điện tử Check-in QR Pass)

---

## Slide 06: Chức Năng 4 - Gian Hàng Marketplace & Trao Cơ Hội B2B
- **Tiêu đề**: SÀN GIAO THƯƠNG B2B & GIAN HÀNG SẢN PHẨM ƯU ĐÃI
- **Phụ đề**: Không gian thúc đẩy doanh số, ưu tiên sử dụng sản phẩm dịch vụ của nhau trong CLB
- **Nội dung chính**:
  - **Gian hàng sản phẩm ưu đãi**: Giới thiệu các sản phẩm, dịch vụ thế mạnh kèm chính sách chiết khấu ưu đãi dành riêng cho hội viên.
  - **Sàn trao cơ hội hợp tác**: Đăng tải nhu cầu tìm nhà cung cấp, tìm đối tác hoặc kêu gọi đầu tư; các hội viên tiếp nhận cơ hội tức thì.
  - **Ghi nhận giá trị thương vụ**: Thống kê tổng doanh số giao dịch kết nối thành công, tôn vinh các hội viên tích cực trao cơ hội.
- **Hình ảnh minh họa**: \`step_11_app_opportunities_feed.png\` (Sàn trao cơ hội giao thương B2B)

---

## Slide 07: Chức Năng 5 - Quản Lý Hội Phí Thường Niên & Thu Chi Minh Bạch
- **Tiêu đề**: QUẢN LÝ HỘI PHÍ THƯỜNG NIÊN & SỔ QUỸ MINH BẠCH
- **Phụ đề**: Tự động hóa toàn diện quy trình thu nộp phí và công khai thu chi quỹ hội
- **Nội dung chính**:
  - **Thanh toán VietQR động Napas 247**: Quét mã QR điền sẵn số tiền hội phí thường niên và cú pháp, hoàn tất đóng phí trong 10 giây.
  - **Tự động gia hạn thẻ số**: Ngay khi nhận thanh toán, hệ thống tự động gia hạn thời hạn hội viên thêm 1 năm và gửi thông báo xác nhận.
  - **Sổ quỹ thu chi rõ ràng**: Theo dõi thu phí, tài trợ và các khoản chi hoạt động; phục vụ công tác đối soát của Ban Kiểm soát.
- **Hình ảnh minh họa**: \`step_13_app_fee_renewal.png\` (Cổng đóng hội phí thường niên qua VietQR)

---

## Slide 08: Đặc Điểm Nổi Bật Thích Hợp Riêng Cho CEO 1983
- **Tiêu đề**: ĐẶC ĐIỂM NỔI BẬT DÀNH RIÊNG CHO CLB DOANH NHÂN CEO 1983
- **Phụ đề**: Giải pháp được thiết kế "may đo" dựa trên hành vi sinh hoạt và văn hóa riêng biệt của CLB
- **Nội dung chính**:
  1. **Nhận Diện Sang Trọng Classic Navy & Gold**: Tông màu xanh Cobalt Navy kết hợp vàng hổ phách và logo dập nổi CEO 1983.
  2. **Trải Nghiệm Mượt Mà, Không Rào Cản**: Bố cục rõ ràng, font chữ lớn, tối ưu cho doanh nhân bận rộn thao tác 1 chạm.
  3. **Hạ Tầng Độc Lập & Bảo Mật Cao**: Máy chủ riêng biệt, dữ liệu mã hóa, bảo mật tuyệt đối hồ sơ doanh nghiệp.
  4. **Khả Năng Mở Rộng Linh Hoạt**: Cấu trúc module hiện đại, sẵn sàng kết nối API với các tổ chức hiệp hội đối tác.

---

## Slide 09: Hướng Phát Triển Tương Lai
- **Tiêu đề**: HƯỚNG PHÁT TRIỂN & LỘ TRÌNH NÂNG CẤP HỆ SINH THÁI
- **Phụ đề**: Không ngừng đổi mới công nghệ để giữ vững vị thế hội quán doanh nhân dẫn đầu thời đại số
- **Nội dung chính**:
  - **Giai đoạn 1**: Chuẩn hóa và hoàn thiện vận hành Web CRM và Mobile App toàn diện.
  - **Giai đoạn 2**: Tích hợp trợ lý AI B2B Matching tự động gợi ý ghép nối cung - cầu giữa các doanh nghiệp.
  - **Giai đoạn 3**: Liên minh sàn thương mại điện tử B2B kết nối đa hiệp hội doanh nghiệp trên toàn quốc.
  - **Giai đoạn 4**: Xây dựng hệ thống chấm điểm tín nhiệm doanh nhân nội khối và chứng thực số.

---

## Slide 10: Kết Thúc & Đồng Hành Phát Triển
- **Tiêu đề**: CÙNG NHAU KIẾN TẠO HỘI QUÁN DOANH NHÂN VỮNG MẠNH
- **Phụ đề**: Chuyển đổi số là cam kết cùng nhau bứt phá, mở rộng cơ hội và gắn kết bền lâu của các Doanh nhân tuổi 1983
- **Kênh tiếp cận**:
  - **Web CRM Quản Trị**: https://14.225.217.232:5443 (Dành cho Ban Chấp Hành & Ban Thư Ký)
  - **App Hiệp Hội CEO 1983**: https://14.225.217.232:5444/association (Dành cho Toàn thể Hội viên)
- **Lời cảm ơn**: Trân trọng cảm ơn Ban Điều Hành và toàn thể Hội viên CLB Doanh Nhân CEO 1983!
`;

  fs.writeFileSync(path.join(DOCS_DIR, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_CEO1983.md'), md, 'utf8');
  fs.writeFileSync(path.join(PUBLIC_DOCS_DIR, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_CEO1983.md'), md, 'utf8');
  console.log('✓ Xuất file Markdown Slide thành công!');
}

// ============================================================================
// 3. GENERATE POWERPOINT PRESENTATION (.PPTX) - THEME TRẮNG SÁNG DOANH NHÂN
// ============================================================================
async function generatePptxSlides() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

  const BG_WHITE = 'FFFFFF';
  const BG_CARD = 'F8FAFC';
  const NAVY_PRIMARY = '003B95';
  const NAVY_DARK = '0A1A3A';
  const GOLD = 'D97706';
  const TEXT_BODY = '334155';
  const TEXT_MUTED = '64748B';
  const BORDER_CARD = 'E2E8F0';

  function addHeader(slide, badgeText, titleText, subtitleText) {
    // Top Bar Gold
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: 'F59E0B' } });

    // Badge
    slide.addText(badgeText, {
      x: 0.6, y: 0.35, w: 3.5, h: 0.35,
      fontSize: 10, bold: true, color: 'B45309',
      fill: { color: 'FEF3C7' }, align: 'center',
      rectRadius: 0.15
    });

    // Title
    slide.addText(titleText, {
      x: 0.6, y: 0.75, w: 12.0, h: 0.6,
      fontSize: 22, bold: true, color: NAVY_DARK
    });

    // Subtitle
    slide.addText(subtitleText, {
      x: 0.6, y: 1.35, w: 12.0, h: 0.4,
      fontSize: 11, italic: true, color: TEXT_MUTED
    });
  }

  function addFooter(slide, slideIndex) {
    slide.addText(`CLB Doanh Nhân CEO 1983 · HanoiBA`, {
      x: 0.6, y: 7.0, w: 6.0, h: 0.3,
      fontSize: 9.5, color: NAVY_PRIMARY, bold: true
    });
    slide.addText(`Slide ${String(slideIndex).padStart(2, '0')} / 10`, {
      x: 10.0, y: 7.0, w: 2.6, h: 0.3,
      fontSize: 9.5, color: TEXT_MUTED, align: 'right', bold: true
    });
  }

  // SLIDE 1: GIỚI THIỆU HỆ THỐNG
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_WHITE };
    addHeader(slide, '01 · GIỚI THIỆU HỆ THỐNG', 'HỆ SINH THÁI CHUYỂN ĐỔI SỐ CLB DOANH NHÂN CEO 1983', 'Giải pháp Quản trị Hiệp hội Chuyên sâu (Web CRM) song hành Nền tảng Giao thương Di động (Mobile App)');

    const cards = [
      { icon: '💻', t: 'Web CRM Quản Trị Trung Tâm', d: 'Kiểm soát dữ liệu hội viên, phân quyền đa tầng, thẩm định cơ hội và quản trị ngân quỹ theo thời gian thực.' },
      { icon: '📱', t: 'Mobile App Doanh Nhân Bỏ Túi', d: 'Văn phòng số cá nhân: Thẻ VIP tích hợp QR cá nhân, danh bạ doanh nghiệp, gian hàng ưu đãi & sàn giao thương 24/7.' },
      { icon: '⚡', t: 'Đồng Bộ Dữ Liệu Hai Chiều Tức Thời', d: 'Hội viên đăng ký trên App -> Đổ thẳng về CRM xử lý -> CRM tự động kích hoạt thẻ và quyền lợi tức thì.' },
    ];
    cards.forEach((c, idx) => {
      const y = 1.9 + idx * 1.6;
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.6, y, w: 6.8, h: 1.45, fill: { color: BG_CARD }, line: { color: BORDER_CARD, width: 1 } });
      slide.addText(`${c.icon}  ${c.t}`, { x: 0.8, y: y + 0.15, w: 6.4, h: 0.35, fontSize: 13, bold: true, color: NAVY_DARK });
      slide.addText(c.d, { x: 0.8, y: y + 0.55, w: 6.4, h: 0.75, fontSize: 10.5, color: TEXT_BODY, lineSpacingMultiple: 1.2 });
    });

    const imgPath = path.join(EVIDENCE_DIR, 'step_03_app_home_dashboard.png');
    if (fs.existsSync(imgPath)) {
      slide.addImage({ path: imgPath, x: 8.0, y: 1.9, w: 4.6, h: 4.8, rounding: true });
    }
    addFooter(slide, 1);
  }

  // SLIDE 2: MỤC ĐÍCH TRIỂN KHAI
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_WHITE };
    addHeader(slide, '02 · MỤC ĐÍCH TRIỂN KHAI', 'MỤC ĐÍCH & SỨ MỆNH CHUYỂN ĐỔI SỐ HỘI QUÁN', 'Giải quyết triệt để các bất cập trong quản lý truyền thống và nâng cao năng lực kết nối B2B');

    const goals = [
      { num: '01', t: 'Số Hóa & Bảo Mật Dữ Liệu Tập Trung', d: 'Chấm dứt việc lưu trữ danh sách hội viên phân tán trên nhiều file Excel cá nhân; tập trung toàn bộ hồ sơ doanh nghiệp vào cơ sở dữ liệu số an toàn.' },
      { num: '02', t: 'Tự Động Hóa Quản Lý Hội Phí', d: 'Loại bỏ quy trình rà soát sao kê ngân hàng thủ công; tích hợp mã VietQR động để ghi nhận đóng hội phí thường niên và tự động gia hạn quyền lợi.' },
      { num: '03', t: 'Nâng Tầm Chuyên Nghiệp Sự Kiện', d: 'Đón tiếp đại biểu tại cửa không tắc nghẽn nhờ vé điện tử QR Pass quét tức thì dưới 1 giây; tích hợp số hóa biểu quyết và quay số Lucky Draw công khai.' },
      { num: '04', t: 'Kích Hoạt Giao Thương Thực Chất', d: 'Tạo lập không gian trao đổi cơ hội kinh doanh tin cậy nội khối, thúc đẩy doanh thu và quảng bá sản phẩm dịch vụ giữa các doanh nhân trong CLB.' },
    ];
    goals.forEach((g, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.6 + col * 6.2;
      const y = 2.0 + row * 2.4;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.9, h: 2.1, fill: { color: BG_CARD }, line: { color: BORDER_CARD, width: 1 } });
      slide.addText(g.num, { x: x + 0.3, y: y + 0.2, w: 1.0, h: 0.5, fontSize: 24, bold: true, color: GOLD });
      slide.addText(g.t, { x: x + 0.3, y: y + 0.75, w: 5.3, h: 0.35, fontSize: 13.5, bold: true, color: NAVY_DARK });
      slide.addText(g.d, { x: x + 0.3, y: y + 1.15, w: 5.3, h: 0.8, fontSize: 10.5, color: TEXT_BODY, lineSpacingMultiple: 1.2 });
    });
    addFooter(slide, 2);
  }

  // SLIDE 3: CHỨC NĂNG 1 - CRM QUẢN TRỊ
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_WHITE };
    addHeader(slide, '03 · CHỨC NĂNG CỐT LÕI', 'WEB CRM: TRUNG TÂM ĐIỀU HÀNH & KIỂM SOÁT DỮ LIỆU', 'Công cụ hỗ trợ đắc lực dành cho Ban Thư ký và Ban Chấp hành trong công tác tổ chức hội quán');

    const cards = [
      { icon: '👥', t: 'Quản Lý Hội Viên & Phê Duyệt Kết Nạp', d: 'Tiếp nhận hồ sơ gia nhập trực tuyến, tra cứu lịch sử hoạt động, phân nhóm ngành nghề và cấp mã hội viên tự động.' },
      { icon: '📊', t: 'Giám Sát Chỉ Số KPI Theo Thời Gian Thực', d: 'Biểu đồ trực quan theo dõi số lượng hội viên mới, tỷ lệ gia hạn hội phí, lưu lượng kết nối giao thương và ngân quỹ CLB.' },
      { icon: '🔐', t: 'Phân Quyền Vai Trò & Bảo Mật Tuyệt Đối', d: 'Kiểm soát truy cập chặt chẽ giữa Chủ tịch, Ban Thư ký, Kế toán và Ban Kiểm soát; lưu vết mọi thao tác chỉnh sửa dữ liệu.' },
    ];
    cards.forEach((c, idx) => {
      const y = 1.9 + idx * 1.6;
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.6, y, w: 6.8, h: 1.45, fill: { color: BG_CARD }, line: { color: BORDER_CARD, width: 1 } });
      slide.addText(`${c.icon}  ${c.t}`, { x: 0.8, y: y + 0.15, w: 6.4, h: 0.35, fontSize: 13, bold: true, color: NAVY_DARK });
      slide.addText(c.d, { x: 0.8, y: y + 0.55, w: 6.4, h: 0.75, fontSize: 10.5, color: TEXT_BODY, lineSpacingMultiple: 1.2 });
    });

    const imgPath = path.join(EVIDENCE_DIR, 'step_16_crm_members_approval.png');
    if (fs.existsSync(imgPath)) {
      slide.addImage({ path: imgPath, x: 7.7, y: 1.9, w: 5.0, h: 4.8, rounding: true });
    }
    addFooter(slide, 3);
  }

  // SLIDE 4: CHỨC NĂNG 2 - MOBILE APP
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_WHITE };
    addHeader(slide, '04 · CHỨC NĂNG CỐT LÕI', 'MOBILE APP: TRẢI NGHIỆM ĐẶC QUYỀN HỘI VIÊN BỎ TÚI', 'Văn phòng số cá nhân giúp doanh nhân kết nối và sinh hoạt hội đồng mọi lúc mọi nơi');

    const cards = [
      { icon: '👑', t: 'Thẻ Hội Viên VIP & Danh Thiếp Số', d: 'Hiển thị thẻ VIP sang trọng mang dấu ấn CEO 1983, tích hợp mã QR cá nhân giúp trao đổi thông tin chỉ trong 1 chạm.' },
      { icon: '📖', t: 'Danh Bạ Doanh Nhân & Tìm Kiếm Đối Tác', d: 'Tra cứu nhanh chóng hồ sơ năng lực, ngành nghề và thông tin liên hệ của các hội viên trong CLB.' },
      { icon: '💬', t: 'Nhắn Tin B2B & Kết Nối Trực Tiếp 1-on-1', d: 'Kênh trò chuyện bảo mật nội bộ, gửi danh thiếp và đặt lịch hẹn giao lưu kinh doanh ngay trên ứng dụng.' },
    ];
    cards.forEach((c, idx) => {
      const y = 1.9 + idx * 1.6;
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.6, y, w: 6.8, h: 1.45, fill: { color: BG_CARD }, line: { color: BORDER_CARD, width: 1 } });
      slide.addText(`${c.icon}  ${c.t}`, { x: 0.8, y: y + 0.15, w: 6.4, h: 0.35, fontSize: 13, bold: true, color: NAVY_DARK });
      slide.addText(c.d, { x: 0.8, y: y + 0.55, w: 6.4, h: 0.75, fontSize: 10.5, color: TEXT_BODY, lineSpacingMultiple: 1.2 });
    });

    const imgPath = path.join(EVIDENCE_DIR, 'step_03_app_home_dashboard.png');
    if (fs.existsSync(imgPath)) {
      slide.addImage({ path: imgPath, x: 8.0, y: 1.9, w: 4.6, h: 4.8, rounding: true });
    }
    addFooter(slide, 4);
  }

  // SLIDE 5: CHỨC NĂNG 3 - SỰ KIỆN & QR CHECKIN
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_WHITE };
    addHeader(slide, '05 · CHỨC NĂNG CỐT LÕI', 'QUẢN TRỊ SỰ KIỆN & VÉ ĐIỆN TỬ CHECK-IN QR PASS', 'Quy trình tổ chức đại hội, diễn đàn và gala doanh nhân chuyên nghiệp chuẩn 5 sao');

    const cards = [
      { icon: '🎟️', t: 'Đăng Ký & Phát Hành Vé Điện Tử Tức Thời', d: 'Hội viên xem nội dung, lịch trình sự kiện và nhấn đăng ký nhận vé điện tử định danh chứa mã QR cá nhân ngay trên App.' },
      { icon: '⚡', t: 'Quét Điểm Danh Check-in Dưới 1 Giây', d: 'Lễ tân quét vé bằng camera điện thoại, hệ thống xác thực tức thì và chống trùng lặp vé 100%, chấm dứt ùn tắc tại cửa.' },
      { icon: '🎁', t: 'Biểu Quyết Trực Tuyến & Quay Số May Mắn', d: 'Tích hợp công cụ biểu quyết bầu cử Ban Chấp Hành minh bạch và vòng quay may mắn Lucky Draw ngẫu nhiên tại Gala.' },
    ];
    cards.forEach((c, idx) => {
      const y = 1.9 + idx * 1.6;
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.6, y, w: 6.8, h: 1.45, fill: { color: BG_CARD }, line: { color: BORDER_CARD, width: 1 } });
      slide.addText(`${c.icon}  ${c.t}`, { x: 0.8, y: y + 0.15, w: 6.4, h: 0.35, fontSize: 13, bold: true, color: NAVY_DARK });
      slide.addText(c.d, { x: 0.8, y: y + 0.55, w: 6.4, h: 0.75, fontSize: 10.5, color: TEXT_BODY, lineSpacingMultiple: 1.2 });
    });

    const imgPath = path.join(EVIDENCE_DIR, 'step_08_app_event_qr_pass.png');
    if (fs.existsSync(imgPath)) {
      slide.addImage({ path: imgPath, x: 8.0, y: 1.9, w: 4.6, h: 4.8, rounding: true });
    }
    addFooter(slide, 5);
  }

  // SLIDE 6: CHỨC NĂNG 4 - MARKETPLACE & CƠ HỘI
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_WHITE };
    addHeader(slide, '06 · CHỨC NĂNG CỐT LÕI', 'SÀN GIAO THƯƠNG B2B & GIAN HÀNG SẢN PHẨM ƯU ĐÃI', 'Không gian thúc đẩy doanh số, ưu tiên sử dụng sản phẩm dịch vụ của nhau trong CLB');

    const cards = [
      { icon: '🛍️', t: 'Gian Hàng Sản Phẩm Đặc Quyền Hội Viên', d: 'Mỗi doanh nghiệp tự do giới thiệu sản phẩm, dịch vụ thế mạnh kèm chính sách chiết khấu ưu đãi dành riêng cho hội viên CEO 1983.' },
      { icon: '🤝', t: 'Bảng Tin Trao Cơ Hội & Khảo Sát Nhu Cầu', d: 'Đăng tải nhu cầu tìm nhà cung cấp, tìm đại lý hoặc kêu gọi hợp tác đầu tư; đối tác tiềm năng nhấn tiếp nhận chỉ sau 1 chạm.' },
      { icon: '📈', t: 'Ghi Nhận & Báo Cáo Giá Trị Kết Nối', d: 'Thống kê tổng giá trị các thương vụ giao dịch thành công trong hội quán, tạo động lực gắn kết và phát triển kinh tế tập thể.' },
    ];
    cards.forEach((c, idx) => {
      const y = 1.9 + idx * 1.6;
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.6, y, w: 6.8, h: 1.45, fill: { color: BG_CARD }, line: { color: BORDER_CARD, width: 1 } });
      slide.addText(`${c.icon}  ${c.t}`, { x: 0.8, y: y + 0.15, w: 6.4, h: 0.35, fontSize: 13, bold: true, color: NAVY_DARK });
      slide.addText(c.d, { x: 0.8, y: y + 0.55, w: 6.4, h: 0.75, fontSize: 10.5, color: TEXT_BODY, lineSpacingMultiple: 1.2 });
    });

    const imgPath = path.join(EVIDENCE_DIR, 'step_11_app_opportunities_feed.png');
    if (fs.existsSync(imgPath)) {
      slide.addImage({ path: imgPath, x: 8.0, y: 1.9, w: 4.6, h: 4.8, rounding: true });
    }
    addFooter(slide, 6);
  }

  // SLIDE 7: CHỨC NĂNG 5 - HỘI PHÍ THƯỜNG NIÊN
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_WHITE };
    addHeader(slide, '07 · CHỨC NĂNG CỐT LÕI', 'QUẢN LÝ HỘI PHÍ THƯỜNG NIÊN & SỔ QUỸ MINH BẠCH', 'Tự động hóa toàn diện quy trình thu nộp phí và công khai thu chi quỹ hội');

    const cards = [
      { icon: '💳', t: 'Thanh Toán Quét Mã VietQR Thông Minh', d: 'Hệ thống tạo mã VietQR động điền sẵn số tiền hội phí thường niên và cú pháp; hội viên quét mã trên app ngân hàng trong 10 giây.' },
      { icon: '✨', t: 'Tự Động Gia Hạn Thẻ Số Tức Thời', d: 'Ngay khi tài khoản nhận tiền, thẻ hội viên tự động cập nhật niên khóa mới và gửi thông báo xác nhận đến hội viên.' },
      { icon: '📑', t: 'Sổ Quỹ Thu Chi Rõ Ràng & Báo Cáo Tài Chính', d: 'Theo dõi minh bạch các nguồn thu tài trợ, thu hội phí và các khoản chi hoạt động; phục vụ công tác đối soát của Ban Kiểm soát.' },
    ];
    cards.forEach((c, idx) => {
      const y = 1.9 + idx * 1.6;
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.6, y, w: 6.8, h: 1.45, fill: { color: BG_CARD }, line: { color: BORDER_CARD, width: 1 } });
      slide.addText(`${c.icon}  ${c.t}`, { x: 0.8, y: y + 0.15, w: 6.4, h: 0.35, fontSize: 13, bold: true, color: NAVY_DARK });
      slide.addText(c.d, { x: 0.8, y: y + 0.55, w: 6.4, h: 0.75, fontSize: 10.5, color: TEXT_BODY, lineSpacingMultiple: 1.2 });
    });

    const imgPath = path.join(EVIDENCE_DIR, 'step_13_app_fee_renewal.png');
    if (fs.existsSync(imgPath)) {
      slide.addImage({ path: imgPath, x: 8.0, y: 1.9, w: 4.6, h: 4.8, rounding: true });
    }
    addFooter(slide, 7);
  }

  // SLIDE 8: ĐẶC ĐIỂM NỔI BẬT DÀNH RIÊNG CEO 1983
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_WHITE };
    addHeader(slide, '08 · LỢI THẾ VƯỢT TRỘI', 'ĐẶC ĐIỂM NỔI BẬT DÀNH RIÊNG CHO CLB DOANH NHÂN CEO 1983', 'Giải pháp được thiết kế "may đo" dựa trên hành vi sinh hoạt và văn hóa riêng biệt của CLB');

    const features = [
      { num: '⭐', t: 'Nhận Diện Sang Trọng Classic Navy & Gold', d: 'Giao diện thể hiện đẳng cấp doanh nhân với gam màu xanh Cobalt Navy kết hợp vàng hổ phách và logo dập nổi CEO 1983.' },
      { num: '🚀', t: 'Trải Nghiệm Mượt Mà, Không Rào Cản Kỹ Thuật', d: 'Thao tác đơn giản, bố cục trực quan, font chữ to rõ; phù hợp cho các Chủ tịch, Tổng giám đốc bận rộn thao tác nhanh.' },
      { num: '🔒', t: 'Hạ Tầng Độc Lập & Bảo Mật Cao Cấp', d: 'Hệ thống sở hữu máy chủ và cơ sở dữ liệu riêng, cam kết không chia sẻ dữ liệu hội viên ra bên ngoài, vận hành trên Docker & SSL.' },
      { num: '🔄', t: 'Sẵn Sàng Mở Rộng & Tích Hợp Đa Nền Tảng', d: 'Cấu trúc module linh hoạt, dễ dàng mở rộng tính năng theo sự phát triển của CLB và kết nối API với các hiệp hội doanh nghiệp đối tác.' },
    ];
    features.forEach((f, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.6 + col * 6.2;
      const y = 2.0 + row * 2.4;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.9, h: 2.1, fill: { color: BG_CARD }, line: { color: BORDER_CARD, width: 1 } });
      slide.addText(f.num, { x: x + 0.3, y: y + 0.2, w: 1.0, h: 0.5, fontSize: 24, bold: true, color: GOLD });
      slide.addText(f.t, { x: x + 0.3, y: y + 0.75, w: 5.3, h: 0.35, fontSize: 13.5, bold: true, color: NAVY_DARK });
      slide.addText(f.d, { x: x + 0.3, y: y + 1.15, w: 5.3, h: 0.8, fontSize: 10.5, color: TEXT_BODY, lineSpacingMultiple: 1.2 });
    });
    addFooter(slide, 8);
  }

  // SLIDE 9: HƯỚNG PHÁT TRIỂN
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_WHITE };
    addHeader(slide, '09 · TẦM NHÌN & TƯƠNG LAI', 'HƯỚNG PHÁT TRIỂN & LỘ TRÌNH NÂNG CẤP HỆ SINH THÁI', 'Không ngừng nâng cấp công nghệ để giữ vững vị thế hội quán doanh nhân dẫn đầu thời đại số');

    const roadmaps = [
      { num: '01', t: 'Giai Đoạn 1: Chuẩn Hóa & Hoàn Thiện Vận Hành', d: 'Đưa vào vận hành chính thức Web CRM và Mobile App; đồng bộ 100% hồ sơ hội viên và thu hội phí thường niên qua VietQR tự động.' },
      { num: '02', t: 'Giai Đoạn 2: Trợ Lý Ảo AI Matching Doanh Nghiệp', d: 'Ứng dụng trí tuệ nhân tạo (AI) tự động phân tích hồ sơ năng lực để gợi ý kết nối đối tác kinh doanh phù hợp nhất cho từng hội viên.' },
      { num: '03', t: 'Giai Đoạn 3: Liên Minh Sàn Thương Mại Đa Hiệp Hội', d: 'Mở rộng kết nối liên thông giao thương với các hiệp hội bạn bè trong và ngoài nước (HanoiBA, YBA, VINASME), mở rộng đầu ra cho hội viên.' },
      { num: '04', t: 'Giai Đoạn 4: Xếp Hạng Tín Nhiệm & Bảo Chứng Số', d: 'Xây dựng chỉ số tín nhiệm doanh nhân nội khối dựa trên lịch sử hoạt động và đánh giá uy tín, nâng tầm vị thế thương hiệu cá nhân.' },
    ];
    roadmaps.forEach((r, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.6 + col * 6.2;
      const y = 2.0 + row * 2.4;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.9, h: 2.1, fill: { color: BG_CARD }, line: { color: BORDER_CARD, width: 1 } });
      slide.addText(r.num, { x: x + 0.3, y: y + 0.2, w: 1.0, h: 0.5, fontSize: 24, bold: true, color: GOLD });
      slide.addText(r.t, { x: x + 0.3, y: y + 0.75, w: 5.3, h: 0.35, fontSize: 13.5, bold: true, color: NAVY_DARK });
      slide.addText(r.d, { x: x + 0.3, y: y + 1.15, w: 5.3, h: 0.8, fontSize: 10.5, color: TEXT_BODY, lineSpacingMultiple: 1.2 });
    });
    addFooter(slide, 9);
  }

  // SLIDE 10: KẾT THÚC
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_WHITE };
    addHeader(slide, '10 · ĐỒNG HÀNH & PHÁT TRIỂN', 'CÙNG NHAU KIẾN TẠO HỘI QUÁN DOANH NHÂN VỮNG MẠNH', 'Chuyển đổi số là cam kết cùng nhau bứt phá, mở rộng cơ hội và gắn kết bền lâu của các Doanh nhân tuổi 1983');

    const channels = [
      { icon: '🌐', title: 'Web CRM Quản Trị', url: 'https://14.225.217.232:5443', sub: 'Dành cho Ban Chấp Hành & Ban Thư Ký' },
      { icon: '📱', title: 'App Hiệp Hội CEO 1983', url: 'https://14.225.217.232:5444/association', sub: 'Dành cho Toàn thể Hội viên Doanh nhân' },
    ];
    channels.forEach((c, idx) => {
      const x = 1.2 + idx * 5.6;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 2.4, w: 5.0, h: 3.2, fill: { color: BG_CARD }, line: { color: BORDER_CARD, width: 1.5 } });
      slide.addText(c.icon, { x, y: 2.7, w: 5.0, h: 0.8, fontSize: 36, align: 'center' });
      slide.addText(c.title, { x, y: 3.6, w: 5.0, h: 0.4, fontSize: 16, bold: true, color: NAVY_DARK, align: 'center' });
      slide.addText(c.url, { x, y: 4.1, w: 5.0, h: 0.4, fontSize: 12, bold: true, color: NAVY_PRIMARY, align: 'center' });
      slide.addText(c.sub, { x, y: 4.6, w: 5.0, h: 0.3, fontSize: 11, color: TEXT_MUTED, align: 'center' });
    });
    addFooter(slide, 10);
  }

  const pptxPathDoc = path.join(DOCS_DIR, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_CEO1983.pptx');
  const pptxPathPub = path.join(PUBLIC_DOCS_DIR, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_CEO1983.pptx');
  try {
    await pptx.writeFile({ fileName: pptxPathDoc });
    fs.copyFileSync(pptxPathDoc, pptxPathPub);
    console.log('✓ Xuất file PowerPoint .pptx (Theme Sáng Trắng) thành công!');
  } catch (err) {
    if (err.code === 'EBUSY') {
      const fallbackDoc = path.join(DOCS_DIR, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_CEO1983_WHITE.pptx');
      const fallbackPub = path.join(PUBLIC_DOCS_DIR, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_CEO1983_WHITE.pptx');
      await pptx.writeFile({ fileName: fallbackDoc });
      fs.copyFileSync(fallbackDoc, fallbackPub);
      console.log('✓ File PPTX cũ đang mở, đã xuất sang:', fallbackDoc);
    } else {
      console.warn('Cảnh báo khi ghi file PPTX:', err.message);
    }
  }
}

// ============================================================================
// 4. EXPORT SLIDES TO HIGH-RESOLUTION PDF VIA PLAYWRIGHT CHROMIUM
// ============================================================================
async function generatePdfSlides() {
  console.log('--- Đang khởi động Playwright Chrome để xuất file PDF Slide (16:9 Widescreen)... ---');
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();

  const htmlPath = path.join(DOCS_DIR, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_CEO1983.html');
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  // Chờ font và ảnh render đầy đủ
  await page.waitForTimeout(1000);

  const pdfPathDoc = path.join(DOCS_DIR, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_CEO1983.pdf');
  const pdfPathPub = path.join(PUBLIC_DOCS_DIR, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_CEO1983.pdf');

  await page.pdf({
    path: pdfPathDoc,
    width: '16in',
    height: '9in',
    printBackground: true,
    preferCSSPageSize: true
  });

  await browser.close();

  fs.copyFileSync(pdfPathDoc, pdfPathPub);
  const stats = fs.statSync(pdfPathDoc);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`✓ Xuất file PDF Slide thành công: ${pdfPathDoc} (${sizeMB} MB)`);
}

async function main() {
  console.log('=================================================================');
  console.log('>>> KHỞI TẠO BỘ SLIDE THUYẾT TRÌNH THEME TRẮNG SÁNG DOANH NHÂN <<<');
  console.log('=================================================================');
  generateHtmlSlides();
  generateMarkdownSlides();
  await generatePptxSlides();
  await generatePdfSlides();
  console.log('=================================================================');
  console.log('HOÀN TẤT XUẤT TOÀN BỘ 4 ĐỊNH DẠNG: HTML, MD, PPTX VÀ PDF!');
  console.log('=================================================================');
}

main().catch(err => {
  console.error('Lỗi tạo slide:', err);
  process.exit(1);
});
