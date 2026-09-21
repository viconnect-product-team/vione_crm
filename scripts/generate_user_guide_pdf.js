const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'document');
const EVIDENCE_DIR = path.join(DOCS_DIR, 'images', 'evidence');
const PDF_OUTPUT = path.join(DOCS_DIR, 'HUONG_DAN_SU_DUNG_APP_HIEP_HOI_CEO1983.pdf');
const PUBLIC_DOCS_DIR = path.join(__dirname, '..', 'apps', 'vione_app_fe', 'public', 'docs');
const PUBLIC_PDF_OUTPUT = path.join(PUBLIC_DOCS_DIR, 'HUONG_DAN_SU_DUNG_APP_HIEP_HOI_CEO1983.pdf');

if (!fs.existsSync(PUBLIC_DOCS_DIR)) {
  fs.mkdirSync(PUBLIC_DOCS_DIR, { recursive: true });
}

function getBase64Image(filename) {
  const p = path.join(EVIDENCE_DIR, filename);
  if (fs.existsSync(p)) {
    const data = fs.readFileSync(p);
    return `data:image/png;base64,${data.toString('base64')}`;
  }
  console.warn(`[WARN] Evidence image not found: ${filename}`);
  return '';
}

async function buildPdf() {
  console.log('Generating HUONG_DAN_SU_DUNG_APP_HIEP_HOI_CEO1983.pdf with real screenshots...');

  const imgCrmLogin = getBase64Image('01_crm_login_blue_white.png');
  const imgCrmRoles = getBase64Image('02_crm_members_roles_permission.png');
  const imgCrmEventModal = getBase64Image('03_crm_event_create_modal.png');
  const imgAppHomeCompact = getBase64Image('04_app_home_compact_event.png');
  const imgAppEventsList = getBase64Image('05_app_event_list_white_title.png');
  const imgAppEventDetail = getBase64Image('06_app_event_detail_modal.png');
  const imgAppRegSuccess = getBase64Image('07_app_event_registration_success.png');
  const imgAppVietQr = getBase64Image('08_app_vietqr_payment_modal.png');
  const imgAppChat = getBase64Image('09_app_chat_call_messenger_bubble.png');
  const imgAppPdfViewer = getBase64Image('10_app_user_guide_pdf_viewer.png');

  const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Sổ Tay Hướng Dẫn Sử Dụng Ứng Dụng Doanh Nhân & Hệ Thống Quản Trị CRM</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    @page {
      size: A4;
      margin: 14mm 14mm 16mm 14mm;
      @bottom-right {
        content: "Trang " counter(page);
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 8.5pt;
        color: #64748B;
      }
      @bottom-left {
        content: "CLB Doanh Nhân CEO 1983 · ViConnect System";
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 8.5pt;
        color: #64748B;
      }
    }

    body {
      font-family: 'Plus Jakarta Sans', Arial, sans-serif;
      color: #1E293B;
      line-height: 1.55;
      margin: 0;
      padding: 0;
      background: #FFFFFF;
      font-size: 10pt;
    }

    .cover-page {
      page-break-after: always;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 50px 24px;
      border: 3px double #0284C7;
      border-radius: 12px;
      background: linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 60%, #E0F2FE 100%);
      box-sizing: border-box;
    }

    .cover-badge {
      display: inline-block;
      padding: 6px 20px;
      background: #0369A1;
      color: #FFFFFF;
      font-weight: 700;
      font-size: 10pt;
      border-radius: 9999px;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 20px;
    }

    .cover-title {
      font-size: 23pt;
      font-weight: 800;
      color: #0C4A6E;
      line-height: 1.3;
      margin: 0 0 14px 0;
      text-transform: uppercase;
    }

    .cover-subtitle {
      font-size: 11.5pt;
      font-weight: 500;
      color: #475569;
      max-width: 620px;
      margin: 0 auto 28px auto;
    }

    .cover-divider {
      width: 100px;
      height: 4px;
      background: linear-gradient(90deg, #0284C7, #2563EB);
      border-radius: 2px;
      margin: 10px auto 28px auto;
    }

    .cover-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      max-width: 540px;
      width: 100%;
      text-align: left;
      background: #FFFFFF;
      padding: 18px 22px;
      border-radius: 8px;
      border: 1px solid #BAE6FD;
      box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.08);
    }

    .cover-meta-item strong {
      display: block;
      font-size: 8.5pt;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .cover-meta-item span {
      font-size: 10pt;
      font-weight: 700;
      color: #0369A1;
    }

    .chapter {
      page-break-before: always;
      margin-top: 10px;
    }

    .chapter-header {
      border-bottom: 2px solid #0284C7;
      padding-bottom: 8px;
      margin-bottom: 18px;
    }

    .chapter-num {
      font-size: 9pt;
      font-weight: 800;
      color: #0284C7;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 4px;
    }

    .chapter-title {
      font-size: 16pt;
      font-weight: 800;
      color: #0C4A6E;
      margin: 0;
    }

    .section-title {
      font-size: 11.5pt;
      font-weight: 700;
      color: #0369A1;
      margin: 20px 0 10px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .step-box {
      background: #F8FAFC;
      border-left: 4px solid #0284C7;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }

    .step-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .step-name {
      font-size: 11pt;
      font-weight: 700;
      color: #0F172A;
    }

    .step-account {
      background: #E0F2FE;
      color: #0369A1;
      border: 1px solid #BAE6FD;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 8.5pt;
      font-weight: 600;
    }

    .step-desc {
      font-size: 9.5pt;
      color: #334155;
      margin: 0 0 10px 0;
    }

    .step-desc p {
      margin: 4px 0;
    }

    .step-desc ul {
      margin: 4px 0 6px 18px;
      padding: 0;
    }

    .step-desc li {
      margin-bottom: 3px;
    }

    .image-container {
      text-align: center;
      margin: 10px 0;
      page-break-inside: avoid;
    }

    .evidence-img {
      max-width: 100%;
      max-height: 420px;
      border-radius: 8px;
      border: 1px solid #CBD5E1;
      box-shadow: 0 3px 8px rgba(0,0,0,0.06);
      object-fit: contain;
    }

    .caption {
      font-size: 8.5pt;
      font-style: italic;
      color: #475569;
      margin-top: 5px;
      font-weight: 500;
    }

    .callout-box {
      background: #F0F9FF;
      border: 1px solid #BAE6FD;
      border-left: 4px solid #0284C7;
      padding: 10px 14px;
      border-radius: 0 6px 6px 0;
      margin: 14px 0;
      font-size: 9pt;
      color: #0369A1;
    }

    .callout-box strong {
      color: #0C4A6E;
      display: block;
      margin-bottom: 3px;
    }

    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 9pt;
    }

    table.data-table th {
      background: #0284C7;
      color: #FFFFFF;
      padding: 8px 10px;
      text-align: left;
      font-weight: 700;
    }

    table.data-table td {
      border: 1px solid #E2E8F0;
      padding: 7px 10px;
      color: #334155;
    }

    table.data-table tr:nth-child(even) {
      background: #F8FAFC;
    }

    .badge-role {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 700;
    }

    .badge-super { background: #DC2626; color: #FFFFFF; }
    .badge-exec { background: #0284C7; color: #FFFFFF; }
    .badge-member { background: #16A34A; color: #FFFFFF; }
  </style>
</head>
<body>

  <!-- ==================== COVER PAGE ==================== -->
  <div class="cover-page">
    <div class="cover-badge">TÀI LIỆU KỸ THUẬT & HƯỚNG DẪN VẬN HÀNH CHÍNH THỨC</div>
    <h1 class="cover-title">SỔ TAY HƯỚNG DẪN SỬ DỤNG<br>ỨNG DỤNG DOANH NHÂN CLB CEO 1983<br>& HỆ THỐNG QUẢN TRỊ CRM</h1>
    <div class="cover-subtitle">
      Tài liệu hướng dẫn trực quan từng bước dành cho Ban Điều Hành và Hội viên Doanh nhân. Giao diện thực tế, hình ảnh minh chứng xác thực từ hệ thống.
    </div>
    <div class="cover-divider"></div>
    <div class="cover-meta">
      <div class="cover-meta-item">
        <strong>Hệ thống Web Quản trị CRM</strong>
        <span>http://14.225.217.232:5000</span>
      </div>
      <div class="cover-meta-item">
        <strong>Ứng dụng Di động Hội viên</strong>
        <span>http://14.225.217.232:5002/association</span>
      </div>
      <div class="cover-meta-item">
        <strong>Tài khoản Quản trị Platform</strong>
        <span>admin@connect.vn (123456)</span>
      </div>
      <div class="cover-meta-item">
        <strong>Tài khoản Hội viên Doanh nhân</strong>
        <span>ceo.tongthuky@ceo1983.com (123456)</span>
      </div>
      <div class="cover-meta-item">
        <strong>Lưu trữ Điện toán Đám mây</strong>
        <span>MinIO S3 Bucket (documents & media)</span>
      </div>
      <div class="cover-meta-item">
        <strong>Phiên bản phát hành</strong>
        <span>v2.5.0 · Cập nhật Tháng 09/2026</span>
      </div>
    </div>
  </div>

  <!-- ==================== CHƯƠNG 1: HỆ THỐNG CRM ==================== -->
  <div class="chapter">
    <div class="chapter-header">
      <div class="chapter-num">PHẦN I: HỆ THỐNG QUẢN TRỊ CRM (DÀNH CHO BAN ĐIỀU HÀNH)</div>
      <h2 class="chapter-title">Đăng Nhập Quản Trị, Phân Quyền Vai Trò & Khởi Tạo Sự Kiện</h2>
    </div>

    <div class="step-box">
      <div class="step-header">
        <span class="step-name">1.1 Giao diện Đăng nhập Hệ thống Quản trị CRM Mới</span>
        <span class="step-account">URL: http://14.225.217.232:5000/auth</span>
      </div>
      <div class="step-desc">
        <p><strong>Mô tả chi tiết:</strong> Giao diện đăng nhập hệ thống Quản trị CRM được chuẩn hóa theo phong cách Xanh - Trắng sang trọng, loại bỏ hoàn toàn các nhận diện cũ. Hệ thống áp dụng hiệu ứng chuyển sắc hoàng gia (Royal Blue #0284C7 / #2563EB) phối hợp cùng nền trắng tinh tế, tạo cảm giác tin cậy và chuyên nghiệp cho cấp quản lý.</p>
        <ul>
          <li><strong>Bảo mật đăng nhập:</strong> Xác thực hai lớp JWT kết hợp mã hóa phiên đăng nhập an toàn.</li>
          <li><strong>Huy hiệu bảo mật:</strong> Biểu tượng ShieldCheck khẳng định cổng đăng nhập được mã hóa đầu cuối.</li>
          <li><strong>Tài khoản quản trị viên:</strong> <code>admin@connect.vn</code> / Mật khẩu: <code>123456</code>.</li>
        </ul>
      </div>
      <div class="image-container">
        <img class="evidence-img" src="${imgCrmLogin}" alt="CRM Login Blue White">
        <div class="caption">Hình 1.1: Giao diện Đăng nhập Hệ thống Quản trị CRM phối màu Xanh - Trắng chuyên nghiệp</div>
      </div>
    </div>

    <div class="step-box">
      <div class="step-header">
        <span class="step-name">1.2 Phân quyền Vai trò & Quản lý Phê duyệt Hồ sơ Hội viên</span>
        <span class="step-account">Module: /members</span>
      </div>
      <div class="step-desc">
        <p><strong>Mô tả chi tiết:</strong> Quản trị viên theo dõi toàn bộ danh sách hội viên đăng ký mới, phân chia cấp bậc quyền hạn rõ ràng và thực hiện phê duyệt chỉ với 1 click:</p>
        <table class="data-table">
          <thead>
            <tr>
              <th>Cấp bậc / Vai trò</th>
              <th>Quyền hạn hệ thống</th>
              <th>Phạm vi truy cập</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="badge-role badge-super">Super Admin</span></td>
              <td>Toàn quyền cấu hình hệ thống, phân quyền vai trò, quản lý tài chính & phí hội viên.</td>
              <td>Toàn hệ thống CRM & CSDL</td>
            </tr>
            <tr>
              <td><span class="badge-role badge-exec">Ban Thư Ký</span></td>
              <td>Duyệt hồ sơ hội viên mới, tạo sự kiện, gửi thông báo và quản lý sàn B2B.</td>
              <td>Quản trị phân hệ Hiệp hội</td>
            </tr>
            <tr>
              <td><span class="badge-role badge-member">Hội viên</span></td>
              <td>Đăng sản phẩm gian hàng, đăng tin cơ hội hợp tác, đăng ký tham gia sự kiện.</td>
              <td>Ứng dụng di động Hội viên</td>
            </tr>
          </tbody>
        </table>
        <p><strong>Cơ chế tự động hóa:</strong> Khi Quản trị viên bấm Duyệt hồ sơ, hệ thống tự động khởi tạo tài khoản đăng nhập tương ứng trong bảng <code>vione_users</code> và liên kết mã định danh <code>user_id</code> với hội viên, giúp hội viên có thể đăng nhập ngay vào ứng dụng mà không cần khởi tạo thủ công.</p>
      </div>
      <div class="image-container">
        <img class="evidence-img" src="${imgCrmRoles}" alt="CRM Roles & Members">
        <div class="caption">Hình 1.2: Danh sách Quản lý Hội viên & Phân quyền Vai trò Ban Điều Hành trên CRM</div>
      </div>
    </div>

    <div class="step-box">
      <div class="step-header">
        <span class="step-name">1.3 Chức năng Khởi tạo Sự kiện & Thiết lập Sơ đồ Chỗ ngồi Cinema</span>
        <span class="step-account">Module: /events</span>
      </div>
      <div class="step-desc">
        <p><strong>Mô tả chi tiết:</strong> Quản trị viên tạo mới các sự kiện giao thương, hội nghị thường niên hoặc đại hội câu lạc bộ thông qua biểu mẫu chuẩn hóa:</p>
        <ul>
          <li><strong>Tải ảnh MinIO S3:</strong> Ảnh poster và banner sự kiện được gửi trực tiếp lên máy chủ đám mây MinIO S3, lưu trữ đường dẫn chuẩn, đảm bảo hiển thị sắc nét và tốc độ tải cao.</li>
          <li><strong>Sơ đồ hội trường Cinema Seating:</strong> Cấu hình phân chia hàng ghế VIP, khu vực Bàn Tròn Doanh nhân và ghế tiêu chuẩn.</li>
          <li><strong>Cấu hình vé có phí / miễn phí:</strong> Thiết lập giá vé tham dự, hạn mức số lượng đăng ký và chính sách ưu đãi dành riêng cho hội viên chính thức.</li>
        </ul>
      </div>
      <div class="image-container">
        <img class="evidence-img" src="${imgCrmEventModal}" alt="CRM Event Create Modal">
        <div class="caption">Hình 1.3: Biểu mẫu Khởi tạo Sự kiện & Thiết lập Sơ đồ Chỗ ngồi Hội nghị trên CRM</div>
      </div>
    </div>
  </div>

  <!-- ==================== CHƯƠNG 2: ỨNG DỤNG HỘI VIÊN ==================== -->
  <div class="chapter">
    <div class="chapter-header">
      <div class="chapter-num">PHẦN II: ỨNG DỤNG DI ĐỘNG HỘI VIÊN CLB CEO 1983</div>
      <h2 class="chapter-title">Trang Chủ Compact, Danh Mục Sự Kiện & Đăng Ký Tham Gia</h2>
    </div>

    <div class="step-box">
      <div class="step-header">
        <span class="step-name">2.1 Trang chủ Hội viên với Thẻ Sự kiện Compact Tinh gọn</span>
        <span class="step-account">URL: http://14.225.217.232:5002/association</span>
      </div>
      <div class="step-desc">
        <p><strong>Mô tả chi tiết:</strong> Trang chủ ứng dụng được thiết kế tối ưu hóa cho màn hình di động của Doanh nhân:</p>
        <ul>
          <li><strong>Kích thước thẻ sự kiện chuẩn:</strong> Thẻ sự kiện chỉ chiếm đúng <strong>2/3 chiều ngang</strong> (68vw) và <strong>1/2 chiều cao</strong> so với phiên bản cũ, giúp hiển thị vừa vặn nhiều thông tin quan trọng trên một màn hình mà không cần cuộn quá nhiều.</li>
          <li><strong>Hình ảnh doanh nhân cao cấp:</strong> Sử dụng ảnh độ phân giải cao chuẩn Unsplash Business Conference với cơ chế dự phòng <code>onError</code> thông minh, cam kết không xuất hiện ảnh vỡ hoặc lỗi liên kết.</li>
          <li><strong>Bố cục thông tin sang trọng:</strong> Tiêu đề chữ trắng trên nền tương phản cao, thẻ ngày tháng bo góc tinh tế và biểu tượng địa điểm rõ ràng.</li>
        </ul>
      </div>
      <div class="image-container">
        <img class="evidence-img" src="${imgAppHomeCompact}" alt="App Home Compact Event">
        <div class="caption">Hình 2.1: Trang chủ với Thẻ sự kiện Compact tỉ lệ 2/3 chiều ngang và 1/2 chiều cao</div>
      </div>
    </div>

    <div class="step-box">
      <div class="step-header">
        <span class="step-name">2.2 Danh mục Sự kiện Doanh nhân & Bộ lọc Lịch trình</span>
        <span class="step-account">Màn hình: /association/events</span>
      </div>
      <div class="step-desc">
        <p><strong>Mô tả chi tiết:</strong> Toàn bộ các chương trình gặp gỡ giao thương, hội thảo chuyên đề và đại hội câu lạc bộ được sắp xếp khoa học:</p>
        <ul>
          <li><strong>Typography sắc nét:</strong> Phông chữ Plus Jakarta Sans hiện đại, chữ trắng nổi bật trên nền poster mờ ảo sang trọng.</li>
          <li><strong>Huy hiệu địa điểm & trạng thái:</strong> Tích hợp biểu tượng MapPin chỉ dẫn khách sạn / trung tâm hội nghị và trạng thái vé (Miễn phí / Vé VIP).</li>
        </ul>
      </div>
      <div class="image-container">
        <img class="evidence-img" src="${imgAppEventsList}" alt="App Event List">
        <div class="caption">Hình 2.2: Danh sách Sự kiện CLB Doanh nhân CEO 1983 với chữ trắng sang trọng</div>
      </div>
    </div>

    <div class="step-box">
      <div class="step-header">
        <span class="step-name">2.3 Xem Chi tiết Sự kiện & Lịch trình Hội nghị</span>
        <span class="step-account">Màn hình: Chi tiết sự kiện (Modal)</span>
      </div>
      <div class="step-desc">
        <p><strong>Mô tả chi tiết:</strong> Khi bấm vào bất kỳ thẻ sự kiện nào, màn hình chi tiết sẽ mở ra cung cấp toàn diện thông tin:</p>
        <ul>
          <li><strong>Lịch trình chi tiết:</strong> Thời gian đón tiếp đại biểu, tiệc trà Networking, phiên phát biểu của Diễn giả và tiệc tối Gala Dinner.</li>
          <li><strong>Danh sách diễn giả & khách mời danh dự:</strong> Thông tin chức vụ và doanh nghiệp của các chuyên gia hàng đầu.</li>
          <li><strong>Nút Đăng ký tham gia:</strong> Cho phép hội viên chọn vị trí bàn ghế và xác nhận đăng ký chỉ với một thao tác.</li>
        </ul>
      </div>
      <div class="image-container">
        <img class="evidence-img" src="${imgAppEventDetail}" alt="App Event Detail Modal">
        <div class="caption">Hình 2.3: Giao diện Xem Chi tiết Sự kiện & Lịch trình Hội nghị Doanh nhân</div>
      </div>
    </div>

    <div class="step-box">
      <div class="step-header">
        <span class="step-name">2.4 Thông báo Đăng ký Thành công & Thẻ Vé Check-in QR</span>
        <span class="step-account">Màn hình: /association/checkin</span>
      </div>
      <div class="step-desc">
        <p><strong>Mô tả chi tiết:</strong> Sau khi hoàn tất đăng ký sự kiện, hội viên nhận ngay Thẻ vé điện tử chính thức:</p>
        <ul>
          <li><strong>Xác nhận vị trí chỗ ngồi:</strong> Hiển thị rõ số bàn và số ghế được phân bổ (Ví dụ: Bàn VIP 01 - Ghế 08).</li>
          <li><strong>Mã QR Check-in VIP:</strong> Mã QR được mã hóa theo chuẩn vCard/Event Pass, cho phép Ban Lễ Tân quét mã tại cổng ra vào trong vòng 1 giây để xác nhận vào hội trường.</li>
        </ul>
      </div>
      <div class="image-container">
        <img class="evidence-img" src="${imgAppRegSuccess}" alt="App Registration Success">
        <div class="caption">Hình 2.4: Thẻ Vé Sự kiện Xác nhận Thành công kèm Mã QR Check-in VIP</div>
      </div>
    </div>
  </div>

  <!-- ==================== CHƯƠNG 3: THANH TOÁN, KẾT NỐI & HƯỚNG DẪN ==================== -->
  <div class="chapter">
    <div class="chapter-header">
      <div class="chapter-num">PHẦN III: THANH TOÁN, KẾT NỐI DOANH NHÂN & TÀI LIỆU HƯỚNG DẪN</div>
      <h2 class="chapter-title">Thanh Toán VietQR, Nhắn Tin B2B & Trình Xem File PDF</h2>
    </div>

    <div class="step-box">
      <div class="step-header">
        <span class="step-name">3.1 Thanh toán Chuyển khoản Tự động VietQR Napas 247</span>
        <span class="step-account">Phương thức: VietQR Dynamic</span>
      </div>
      <div class="step-desc">
        <p><strong>Mô tả chi tiết:</strong> Đối với các sự kiện có phí hoặc đóng hội phí thường niên, hệ thống tích hợp cổng thanh toán VietQR tự động:</p>
        <ul>
          <li><strong>Mã QR động thông minh:</strong> Mã QR được sinh theo chuẩn Napas 247, tự động điền sẵn chính xác số tiền cần chuyển và cú pháp nội dung chuyển khoản theo mã hội viên.</li>
          <li><strong>Khớp lệnh tự động:</strong> Hội viên chỉ cần mở ứng dụng ngân hàng quét mã, không cần nhập tay số tài khoản hay nội dung, hạn chế tối đa sai sót.</li>
          <li><strong>Sao kê minh bạch:</strong> Hệ thống lưu trữ lịch sử giao dịch và xuất hóa đơn điện tử cho doanh nghiệp.</li>
        </ul>
      </div>
      <div class="image-container">
        <img class="evidence-img" src="${imgAppVietQr}" alt="VietQR Payment Modal">
        <div class="caption">Hình 3.1: Giao diện Thanh toán VietQR Napas 247 Chuyển khoản Tự động</div>
      </div>
    </div>

    <div class="step-box">
      <div class="step-header">
        <span class="step-name">3.2 Hộp thư Doanh nhân & Nhắn tin B2B Phong cách Messenger VIP</span>
        <span class="step-account">Màn hình: /association/messages</span>
      </div>
      <div class="step-desc">
        <p><strong>Mô tả chi tiết:</strong> Nền tảng kết nối giao thương trực tiếp giữa các Doanh nhân:</p>
        <ul>
          <li><strong>Bong bóng tin nhắn hiện đại:</strong> Màu xanh Messenger (#0084FF) chuẩn mực, hỗ trợ gửi văn bản, hình ảnh, tài liệu báo giá và vị trí văn phòng doanh nghiệp.</li>
          <li><strong>Nút Gọi kết nối nhanh:</strong> Tích hợp nút gọi thoại và video trực tiếp qua nền tảng kết nối tức thời, giúp lãnh đạo doanh nghiệp trao đổi công việc nhanh chóng.</li>
          <li><strong>Tính năng thu hồi tin nhắn:</strong> Cho phép thu hồi tin nhắn gửi nhầm nhằm đảm bảo tính chuẩn xác và bảo mật thông tin kinh doanh.</li>
        </ul>
      </div>
      <div class="image-container">
        <img class="evidence-img" src="${imgAppChat}" alt="App Chat Messenger Bubble">
        <div class="caption">Hình 3.2: Khung Chat 1-1 Phong cách Messenger VIP & Nút Gọi Kết nối Nhanh</div>
      </div>
    </div>

    <div class="step-box">
      <div class="step-header">
        <span class="step-name">3.3 Trình Xem File PDF Hướng Dẫn Sử Dụng & Thanh Quản Trị Tải File</span>
        <span class="step-account">Màn hình: /association/profile -> Hướng dẫn sử dụng</span>
      </div>
      <div class="step-desc">
        <p><strong>Mô tả chi tiết:</strong> Nâng cấp toàn diện chức năng Hướng dẫn sử dụng theo yêu cầu:</p>
        <ul>
          <li><strong>Hiển thị trực tiếp file PDF:</strong> Bỏ toàn bộ các tab chữ tĩnh rườm rà trước đây. Khi người dùng bấm vào "Hướng dẫn sử dụng", ứng dụng lập tức nhúng và mở toàn màn hình file PDF chính thức của hệ thống.</li>
          <li><strong>Thanh công cụ Quản trị viên:</strong> Cung cấp nút <em>"Tải file PDF mới"</em> (upload tài liệu cập nhật lên máy chủ MinIO S3) và nút <em>"Đặt lại mặc định"</em> (reset về file gốc khi cần thiết).</li>
          <li><strong>Tải về máy & In ấn:</strong> Người dùng có thể bấm nút Tải về để lưu trữ file PDF trên điện thoại hoặc mở in ấn bất kỳ lúc nào.</li>
        </ul>
      </div>
      <div class="image-container">
        <img class="evidence-img" src="${imgAppPdfViewer}" alt="App PDF Guide Viewer">
        <div class="caption">Hình 3.3: Trình Xem File PDF Hướng dẫn Sử dụng Trực tiếp & Thanh Quản trị File</div>
      </div>
    </div>

    <div class="callout-box">
      <strong>KẾT LUẬN & HƯỚNG DẪN HỖ TRỢ VẬN HÀNH:</strong>
      Toàn bộ các phân hệ trên Hệ thống Quản trị CRM và Ứng dụng Di động Hội viên CLB CEO 1983 đã được kiểm thử toàn diện, hoạt động ổn định và đồng bộ dữ liệu thời gian thực. Trong quá trình sử dụng, nếu cần hỗ trợ kỹ thuật hoặc đóng góp ý kiến nâng cấp tính năng, Quản trị viên và Hội viên vui lòng liên hệ Ban Thư Ký CLB Doanh Nhân CEO 1983 hoặc gửi email về: <code>admin@connect.vn</code>.
    </div>
  </div>

</body>
</html>
  `;

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'load' });
    await page.waitForTimeout(2000);

    console.log(`Saving PDF to: ${PDF_OUTPUT}...`);
    await page.pdf({
      path: PDF_OUTPUT,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '14mm',
        bottom: '16mm',
        left: '14mm',
        right: '14mm'
      }
    });
    console.log('✓ Successfully created document/HUONG_DAN_SU_DUNG_APP_HIEP_HOI_CEO1983.pdf');

    // Also copy to FE public directory
    fs.copyFileSync(PDF_OUTPUT, PUBLIC_PDF_OUTPUT);
    console.log(`✓ Successfully copied to: ${PUBLIC_PDF_OUTPUT}`);

  } catch (err) {
    console.error('Error generating PDF:', err);
  } finally {
    await browser.close();
  }
}

buildPdf();
