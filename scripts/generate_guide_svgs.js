const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'apps', 'vione_app_fe', 'public', 'docs', 'images');
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

function createSvgTemplate(title, subtitle, badgeText, contentSvg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="800" height="520" style="background:#0b1329;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1329" />
      <stop offset="50%" stop-color="#111d40" />
      <stop offset="100%" stop-color="#070c1b" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B" />
      <stop offset="50%" stop-color="#D97706" />
      <stop offset="100%" stop-color="#B45309" />
    </linearGradient>
    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0084FF" />
      <stop offset="100%" stop-color="#003B95" />
    </linearGradient>
    <filter id="dropGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <rect width="800" height="520" fill="url(#bgGrad)" />
  
  <g opacity="0.08" stroke="#ffffff" stroke-width="1">
    <line x1="0" y1="80" x2="800" y2="80" />
    <line x1="0" y1="180" x2="800" y2="180" />
    <line x1="0" y1="280" x2="800" y2="280" />
    <line x1="0" y1="380" x2="800" y2="380" />
    <line x1="0" y1="480" x2="800" y2="480" />
    <line x1="160" y1="0" x2="160" y2="520" />
    <line x1="320" y1="0" x2="320" y2="520" />
    <line x1="480" y1="0" x2="480" y2="520" />
    <line x1="640" y1="0" x2="640" y2="520" />
  </g>

  <!-- Top Header Banner -->
  <rect x="40" y="24" width="720" height="60" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
  <circle cx="75" cy="54" r="18" fill="url(#goldGrad)" />
  <text x="75" y="60" fill="#ffffff" font-size="13" font-weight="900" text-anchor="middle">1983</text>
  <text x="108" y="46" fill="#fbbf24" font-size="15" font-weight="800" letter-spacing="0.5">${title}</text>
  <text x="108" y="66" fill="#94a3b8" font-size="12">${subtitle}</text>
  <rect x="660" y="40" width="80" height="28" rx="8" fill="#F59E0B" />
  <text x="700" y="58" fill="#ffffff" font-size="11" font-weight="800" text-anchor="middle">${badgeText}</text>

  <!-- Main Content -->
  ${contentSvg}
</svg>`;
}

// 1. demo_onehand.svg
const onehandContent = `
  <g transform="translate(60, 105)">
    <!-- Phone Mockup -->
    <rect x="0" y="0" width="280" height="380" rx="32" fill="#0f172a" stroke="#334155" stroke-width="4" filter="url(#dropGlow)" />
    <rect x="90" y="8" width="100" height="16" rx="8" fill="#1e293b" />
    <!-- Reachability Drop Overlay -->
    <rect x="15" y="36" width="250" height="110" rx="4" fill="#1e293b" opacity="0.6" />
    <text x="140" y="95" fill="#94a3b8" font-size="10" font-weight="700" text-anchor="middle">VÙNG HẠ MÀN HÌNH (REACHABILITY)</text>
    <!-- Shifted Down Screen Content -->
    <rect x="15" y="146" width="250" height="220" rx="16" fill="#ffffff" />
    <rect x="30" y="160" width="220" height="36" rx="10" fill="#f1f5f9" />
    <text x="50" y="183" fill="#64748b" font-size="11">🔍 Tìm kiếm hội viên...</text>
    <rect x="30" y="208" width="100" height="26" rx="8" fill="#003B95" />
    <text x="80" y="225" fill="#ffffff" font-size="11" font-weight="bold" text-anchor="middle">Hộp thư (12)</text>
    <rect x="138" y="208" width="112" height="26" rx="8" fill="#f1f5f9" />
    <text x="194" y="225" fill="#475569" font-size="11" font-weight="bold" text-anchor="middle">Tin nhắn chờ (3)</text>
    <!-- Chat preview card -->
    <rect x="30" y="244" width="220" height="50" rx="12" fill="#f8fafc" stroke="#e2e8f0" />
    <circle cx="55" cy="269" r="16" fill="#003B95" />
    <text x="55" y="274" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">CT</text>
    <text x="80" y="263" fill="#0f172a" font-size="11" font-weight="bold">Nguyễn Văn An - Chủ tịch</text>
    <text x="80" y="278" fill="#64748b" font-size="10">Hẹn gặp anh tại Cafe Doanh Nhân...</text>
    <circle cx="236" cy="269" r="4" fill="#0084FF" />
    <!-- Thumb Icon Dynamic Cue -->
    <circle cx="140" cy="330" r="18" fill="#F59E0B" />
    <text x="140" y="336" fill="#ffffff" font-size="16" text-anchor="middle">👆</text>
  </g>

  <!-- Explanation Cards -->
  <g transform="translate(380, 115)">
    <rect x="0" y="0" width="380" height="110" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="36" fill="#fbbf24" font-size="15" font-weight="bold">1. Chế Độ Kéo Nửa Màn Hình (Reachability)</text>
    <text x="24" y="62" fill="#cbd5e1" font-size="12">Vuốt trượt nhẹ từ đỉnh xuống để toàn bộ nút bấm,</text>
    <text x="24" y="80" fill="#cbd5e1" font-size="12">thanh tìm kiếm trượt xuống 35vh trong tầm với ngón cái.</text>

    <rect x="0" y="130" width="380" height="110" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="166" fill="#38bdf8" font-size="15" font-weight="bold">2. Vuốt Ngang Mép Chuyển Tab Nhanh</text>
    <text x="24" y="192" fill="#cbd5e1" font-size="12">Vuốt từ mép trái sang phải để quay lại trang trước</text>
    <text x="24" y="210" fill="#cbd5e1" font-size="12">hoặc vuốt qua lại chuyển nhanh các tab Bảng tin / Sự kiện.</text>

    <rect x="0" y="260" width="380" height="95" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="296" fill="#4ade80" font-size="15" font-weight="bold">3. Phản Hồi Xúc Giác &amp; Thu Gọn Tự Động</text>
    <text x="24" y="322" fill="#cbd5e1" font-size="12">Rung haptic êm ái, chạm vùng trống phía trên để phục hồi.</text>
  </g>
`;

// 2. demo_filter_sort.svg
const filterSortContent = `
  <g transform="translate(60, 105)">
    <rect x="0" y="0" width="280" height="380" rx="32" fill="#0f172a" stroke="#334155" stroke-width="4" filter="url(#dropGlow)" />
    <rect x="90" y="8" width="100" height="16" rx="8" fill="#1e293b" />
    <rect x="15" y="36" width="250" height="330" rx="20" fill="#ffffff" />
    <!-- Search bar with filter icon -->
    <rect x="25" y="50" width="195" height="36" rx="10" fill="#f1f5f9" />
    <text x="45" y="73" fill="#64748b" font-size="11">🔍 Tìm kiếm hội viên...</text>
    <rect x="226" y="50" width="36" height="36" rx="10" fill="#003B95" />
    <text x="244" y="73" fill="#ffffff" font-size="13" text-anchor="middle">⚙️</text>
    <!-- Filter Popover Simulation -->
    <rect x="25" y="96" width="237" height="255" rx="16" fill="#0f172a" stroke="#334155" stroke-width="1.5" filter="url(#dropGlow)" />
    <text x="40" y="122" fill="#fbbf24" font-size="11" font-weight="bold">SẮP XẾP CUỘC HỘI THOẠI</text>
    <rect x="38" y="132" width="210" height="24" rx="6" fill="#003B95" />
    <text x="48" y="148" fill="#ffffff" font-size="10" font-weight="bold">✓ Mới nhất (Mới cập nhật lên đầu)</text>
    <rect x="38" y="160" width="210" height="22" rx="6" fill="#1e293b" />
    <text x="48" y="175" fill="#94a3b8" font-size="10">Tên A → Z (Bảng chữ cái)</text>
    <!-- Alphabet Strip -->
    <text x="40" y="206" fill="#fbbf24" font-size="11" font-weight="bold">LỌC CHỮ CÁI (A - Z)</text>
    <g transform="translate(38, 216)">
      <rect x="0" y="0" width="24" height="24" rx="6" fill="#0084FF" />
      <text x="12" y="16" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">ALL</text>
      <rect x="30" y="0" width="22" height="24" rx="6" fill="#1e293b" />
      <text x="41" y="16" fill="#cbd5e1" font-size="10" text-anchor="middle">A</text>
      <rect x="58" y="0" width="22" height="24" rx="6" fill="#1e293b" />
      <text x="69" y="16" fill="#cbd5e1" font-size="10" text-anchor="middle">B</text>
      <rect x="86" y="0" width="22" height="24" rx="6" fill="#1e293b" />
      <text x="97" y="16" fill="#cbd5e1" font-size="10" text-anchor="middle">C</text>
      <rect x="114" y="0" width="22" height="24" rx="6" fill="#1e293b" />
      <text x="125" y="16" fill="#cbd5e1" font-size="10" text-anchor="middle">D</text>
      <rect x="142" y="0" width="22" height="24" rx="6" fill="#1e293b" />
      <text x="153" y="16" fill="#cbd5e1" font-size="10" text-anchor="middle">H</text>
      <rect x="170" y="0" width="22" height="24" rx="6" fill="#1e293b" />
      <text x="181" y="16" fill="#cbd5e1" font-size="10" text-anchor="middle">N</text>
    </g>
    <!-- Reset Button -->
    <rect x="38" y="306" width="210" height="28" rx="8" fill="#334155" />
    <text x="143" y="324" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">Đặt lại tất cả bộ lọc</text>
  </g>

  <g transform="translate(380, 115)">
    <rect x="0" y="0" width="380" height="110" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="36" fill="#fbbf24" font-size="15" font-weight="bold">1. Sắp Xếp Đa Chiều &amp; Thông Minh</text>
    <text x="24" y="62" fill="#cbd5e1" font-size="12">Tùy chọn sắp xếp linh hoạt theo thời gian cập nhật,</text>
    <text x="24" y="80" fill="#cbd5e1" font-size="12">theo tên hội viên A → Z hoặc theo số tin chưa đọc.</text>

    <rect x="0" y="130" width="380" height="110" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="166" fill="#38bdf8" font-size="15" font-weight="bold">2. Lọc Theo Chữ Cái Bắt Đầu (A - Z)</text>
    <text x="24" y="192" fill="#cbd5e1" font-size="12">Bấm chọn nhanh chữ cái đầu (ví dụ: N) để lọc ngay</text>
    <text x="24" y="210" fill="#cbd5e1" font-size="12">toàn bộ hội viên họ Nguyễn, Nam, Ninh trong 1 chạm.</text>

    <rect x="0" y="260" width="380" height="95" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="296" fill="#4ade80" font-size="15" font-weight="bold">3. Lọc Trực Tuyến &amp; Tệp Đính Kèm</text>
    <text x="24" y="322" fill="#cbd5e1" font-size="12">Nhanh chóng tra cứu ai đang Online hoặc gửi file hợp đồng.</text>
  </g>
`;

// 3. demo_documents.svg
const documentsContent = `
  <g transform="translate(60, 105)">
    <rect x="0" y="0" width="280" height="380" rx="32" fill="#0f172a" stroke="#334155" stroke-width="4" filter="url(#dropGlow)" />
    <rect x="90" y="8" width="100" height="16" rx="8" fill="#1e293b" />
    <rect x="15" y="36" width="250" height="330" rx="20" fill="#ffffff" />
    <text x="140" y="68" fill="#003B95" font-size="13" font-weight="bold" text-anchor="middle">THƯ VIỆN TÀI LIỆU MẬT</text>
    <!-- Document items -->
    <rect x="25" y="82" width="230" height="60" rx="10" fill="#f8fafc" stroke="#e2e8f0" />
    <rect x="35" y="92" width="38" height="40" rx="6" fill="#ef4444" />
    <text x="54" y="116" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">PDF</text>
    <text x="82" y="104" fill="#0f172a" font-size="11" font-weight="bold">Kỷ yếu Đại Hội 2026</text>
    <text x="82" y="118" fill="#64748b" font-size="9">Ban hành: 15/09/2026 • 18.5 MB</text>
    <rect x="82" y="124" width="70" height="14" rx="3" fill="#dbeafe" />
    <text x="117" y="134" fill="#1e40af" font-size="8" font-weight="bold" text-anchor="middle">Hội viên chính thức</text>

    <rect x="25" y="150" width="230" height="60" rx="10" fill="#f8fafc" stroke="#e2e8f0" />
    <rect x="35" y="160" width="38" height="40" rx="6" fill="#2563eb" />
    <text x="54" y="184" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">DOCX</text>
    <text x="82" y="172" fill="#0f172a" font-size="11" font-weight="bold">Quy Chế Giao Thương B2B</text>
    <text x="82" y="186" fill="#64748b" font-size="9">Mã hiệu: QC-1983-V2 • 4.2 MB</text>
    <rect x="82" y="192" width="55" height="14" rx="3" fill="#fef3c7" />
    <text x="109" y="202" fill="#92400e" font-size="8" font-weight="bold" text-anchor="middle">Toàn thể CLB</text>

    <rect x="25" y="218" width="230" height="60" rx="10" fill="#f8fafc" stroke="#e2e8f0" />
    <rect x="35" y="228" width="38" height="40" rx="6" fill="#10b981" />
    <text x="54" y="252" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">PPTX</text>
    <text x="82" y="240" fill="#0f172a" font-size="11" font-weight="bold">Slide Diễn Giả Khách Mời</text>
    <text x="82" y="254" fill="#64748b" font-size="9">Sự kiện: Cafe Doanh Nhân • 28 MB</text>

    <!-- Download CTA -->
    <rect x="25" y="295" width="230" height="42" rx="12" fill="#003B95" />
    <text x="140" y="321" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">⬇ Tải Tài Liệu Mã Hóa</text>
  </g>

  <g transform="translate(380, 115)">
    <rect x="0" y="0" width="380" height="110" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="36" fill="#fbbf24" font-size="15" font-weight="bold">1. Mở Khóa Tự Động Sau Check-In</text>
    <text x="24" y="62" fill="#cbd5e1" font-size="12">Hội viên sau khi quét QR điểm danh sự kiện sẽ được</text>
    <text x="24" y="80" fill="#cbd5e1" font-size="12">tự động mở quyền truy cập slide và tài liệu mật.</text>

    <rect x="0" y="130" width="380" height="110" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="166" fill="#38bdf8" font-size="15" font-weight="bold">2. Trình Đọc Tài Liệu In-App Cao Cấp</text>
    <text x="24" y="192" fill="#cbd5e1" font-size="12">Xem trước trực tuyến không cần tải về máy,</text>
    <text x="24" y="210" fill="#cbd5e1" font-size="12">hỗ trợ phóng to, thu nhỏ và bảo mật chống sao chép trái phép.</text>

    <rect x="0" y="260" width="380" height="95" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="296" fill="#4ade80" font-size="15" font-weight="bold">3. Phân Quyền Đa Tầng Theo Cấp Hội Viên</text>
    <text x="24" y="322" fill="#cbd5e1" font-size="12">Tài liệu BCH, Nghị quyết Thường vụ &amp; Tài liệu toàn thể.</text>
  </g>
`;

// 4. demo_meetings.svg
const meetingsContent = `
  <g transform="translate(60, 105)">
    <rect x="0" y="0" width="280" height="380" rx="32" fill="#0f172a" stroke="#334155" stroke-width="4" filter="url(#dropGlow)" />
    <rect x="90" y="8" width="100" height="16" rx="8" fill="#1e293b" />
    <rect x="15" y="36" width="250" height="330" rx="20" fill="#ffffff" />
    <text x="140" y="68" fill="#003B95" font-size="13" font-weight="bold" text-anchor="middle">LỊCH HỌP BAN CHẤP HÀNH</text>
    <!-- Meeting card -->
    <rect x="25" y="82" width="230" height="120" rx="12" fill="#f8fafc" stroke="#e2e8f0" />
    <text x="40" y="105" fill="#003B95" font-size="12" font-weight="bold">Phiên Họp Thường Kỳ Q3/2026</text>
    <text x="40" y="125" fill="#64748b" font-size="10">🕒 14:00 - 17:00 • Thứ 7, 20/09/2026</text>
    <text x="40" y="142" fill="#64748b" font-size="10">📍 Tầng 6, Tháp Doanh Nhân, Hà Nội</text>
    <rect x="40" y="154" width="95" height="28" rx="8" fill="#0084FF" />
    <text x="87" y="172" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">Vào phòng họp</text>
    <rect x="145" y="154" width="95" height="28" rx="8" fill="#f1f5f9" />
    <text x="192" y="172" fill="#475569" font-size="10" font-weight="bold" text-anchor="middle">Ký biên bản số</text>
    <!-- Minutes signed card -->
    <rect x="25" y="214" width="230" height="70" rx="12" fill="#ecfdf5" stroke="#a7f3d0" />
    <text x="40" y="236" fill="#065f46" font-size="11" font-weight="bold">Biên Bản Họp Ban Chấp Hành Q2</text>
    <text x="40" y="252" fill="#047857" font-size="10">✓ Đã ký số điện tử bởi 15/15 Ủy viên BCH</text>
    <rect x="40" y="260" width="70" height="16" rx="4" fill="#10b981" />
    <text x="75" y="272" fill="#ffffff" font-size="9" font-weight="bold" text-anchor="middle">Xem chữ ký số</text>
    <rect x="25" y="296" width="230" height="40" rx="10" fill="#003B95" />
    <text x="140" y="321" fill="#ffffff" font-size="11" font-weight="bold" text-anchor="middle">Xác Nhận Tham Dự Họp</text>
  </g>

  <g transform="translate(380, 115)">
    <rect x="0" y="0" width="380" height="110" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="36" fill="#fbbf24" font-size="15" font-weight="bold">1. Thư Mời Họp Tự Động Vào Tin Nhắn</text>
    <text x="24" y="62" fill="#cbd5e1" font-size="12">Ban Thư Ký gửi thư mời họp BCH có nút xác nhận tham gia</text>
    <text x="24" y="80" fill="#cbd5e1" font-size="12">và liên kết trực tiếp vào phòng họp ngay trong bong bóng chat.</text>

    <rect x="0" y="130" width="380" height="110" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="166" fill="#38bdf8" font-size="15" font-weight="bold">2. Điểm Danh Tự Động &amp; Báo Cáo Chuyên Cần</text>
    <text x="24" y="192" fill="#cbd5e1" font-size="12">Ghi nhận đại biểu có mặt bằng định vị GPS hoặc quét mã QR,</text>
    <text x="24" y="210" fill="#cbd5e1" font-size="12">tổng hợp tỷ lệ đại biểu biểu quyết đạt chuẩn Điều lệ.</text>

    <rect x="0" y="260" width="380" height="95" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="296" fill="#4ade80" font-size="15" font-weight="bold">3. Ký Số Biên Bản Trực Tuyến 24/7</text>
    <text x="24" y="322" fill="#cbd5e1" font-size="12">Ủy viên BCH ký xác nhận biên bản tức thì trên điện thoại di động.</text>
  </g>
`;

// 5. demo_marketplace.svg
const marketplaceContent = `
  <g transform="translate(60, 105)">
    <rect x="0" y="0" width="280" height="380" rx="32" fill="#0f172a" stroke="#334155" stroke-width="4" filter="url(#dropGlow)" />
    <rect x="90" y="8" width="100" height="16" rx="8" fill="#1e293b" />
    <rect x="15" y="36" width="250" height="330" rx="20" fill="#ffffff" />
    <text x="140" y="68" fill="#003B95" font-size="13" font-weight="bold" text-anchor="middle">SÀN GIAO THƯƠNG B2B</text>
    <!-- Item 1 -->
    <rect x="25" y="82" width="230" height="75" rx="12" fill="#f8fafc" stroke="#e2e8f0" />
    <rect x="35" y="92" width="55" height="55" rx="8" fill="#dbeafe" />
    <text x="62" y="124" fill="#003B95" font-size="20" text-anchor="middle">🏗️</text>
    <text x="100" y="104" fill="#0f172a" font-size="11" font-weight="bold">Vật Liệu Xây Dựng Xanh</text>
    <text x="100" y="118" fill="#ea580c" font-size="11" font-weight="bold">Chiết khấu 25% nội bộ</text>
    <text x="100" y="132" fill="#64748b" font-size="9">Cty CP Đầu Tư An Phát • Hà Nội</text>
    <rect x="100" y="138" width="60" height="14" rx="4" fill="#10b981" />
    <text x="130" y="148" fill="#ffffff" font-size="8" font-weight="bold" text-anchor="middle">Chào bán</text>

    <!-- Item 2 -->
    <rect x="25" y="165" width="230" height="75" rx="12" fill="#f8fafc" stroke="#e2e8f0" />
    <rect x="35" y="175" width="55" height="55" rx="8" fill="#fef3c7" />
    <text x="62" y="207" fill="#d97706" font-size="20" text-anchor="middle">☕</text>
    <text x="100" y="187" fill="#0f172a" font-size="11" font-weight="bold">Tìm Đại Lý Phân Phối F&amp;B</text>
    <text x="100" y="201" fill="#ea580c" font-size="11" font-weight="bold">Hỗ trợ 100% Marketing</text>
    <text x="100" y="215" fill="#64748b" font-size="9">Tập Đoàn F&amp;B Quý Hợi</text>
    <rect x="100" y="221" width="60" height="14" rx="4" fill="#0084FF" />
    <text x="130" y="231" fill="#ffffff" font-size="8" font-weight="bold" text-anchor="middle">Tìm đối tác</text>

    <!-- Post CTA -->
    <rect x="25" y="252" width="230" height="40" rx="10" fill="#ea580c" />
    <text x="140" y="277" fill="#ffffff" font-size="11" font-weight="bold" text-anchor="middle">+ Đăng Tin Giao Thương Mới</text>
  </g>

  <g transform="translate(380, 115)">
    <rect x="0" y="0" width="380" height="110" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="36" fill="#fbbf24" font-size="15" font-weight="bold">1. Đăng Tin Chào Mua / Chào Bán Nội Bộ</text>
    <text x="24" y="62" fill="#cbd5e1" font-size="12">Hội viên cam kết mức chiết khấu ưu đãi tốt hơn thị trường</text>
    <text x="24" y="80" fill="#cbd5e1" font-size="12">dành riêng cho các thành viên CLB Doanh Nhân CEO 1983.</text>

    <rect x="0" y="130" width="380" height="110" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="166" fill="#38bdf8" font-size="15" font-weight="bold">2. Tự Động Kết Nối Khung Chat Thương Thảo</text>
    <text x="24" y="192" fill="#cbd5e1" font-size="12">Khi bấm "Quan tâm", hệ thống tự động mở phòng chat</text>
    <text x="24" y="210" fill="#cbd5e1" font-size="12">kèm thông tin bài đăng để hai bên trực tiếp đàm phán.</text>

    <rect x="0" y="260" width="380" height="95" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="296" fill="#4ade80" font-size="15" font-weight="bold">3. Thẩm Định Uy Tín Từ Ban Xúc Tiến Thương Mại</text>
    <text x="24" y="322" fill="#cbd5e1" font-size="12">Các cơ hội B2B được Ban Xúc Tiến kiểm định chất lượng.</text>
  </g>
`;

// 6. demo_voting.svg
const votingContent = `
  <g transform="translate(60, 105)">
    <rect x="0" y="0" width="280" height="380" rx="32" fill="#0f172a" stroke="#334155" stroke-width="4" filter="url(#dropGlow)" />
    <rect x="90" y="8" width="100" height="16" rx="8" fill="#1e293b" />
    <rect x="15" y="36" width="250" height="330" rx="20" fill="#ffffff" />
    <text x="140" y="68" fill="#003B95" font-size="13" font-weight="bold" text-anchor="middle">BIỂU QUYẾT ĐẠI HỘI 2026</text>
    <!-- Vote item -->
    <rect x="25" y="80" width="230" height="140" rx="12" fill="#f8fafc" stroke="#e2e8f0" />
    <text x="38" y="102" fill="#0f172a" font-size="11" font-weight="bold">Nghị Quyết Kế Hoạch 2026-2028</text>
    <text x="38" y="118" fill="#64748b" font-size="10">Biểu quyết mở: 15/09 - 22/09/2026</text>
    <!-- Result bar -->
    <rect x="38" y="130" width="204" height="16" rx="8" fill="#e2e8f0" />
    <rect x="38" y="130" width="186" height="16" rx="8" fill="#10b981" />
    <text x="140" y="142" fill="#ffffff" font-size="9" font-weight="bold" text-anchor="middle">91.2% Tán Thành</text>
    <rect x="38" y="156" width="98" height="30" rx="8" fill="#003B95" />
    <text x="87" y="175" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">✓ Đã Bỏ Phiếu</text>
    <rect x="144" y="156" width="98" height="30" rx="8" fill="#f1f5f9" />
    <text x="193" y="175" fill="#475569" font-size="10" font-weight="bold" text-anchor="middle">Xem kiểm phiếu</text>

    <!-- Personnel election -->
    <rect x="25" y="230" width="230" height="100" rx="12" fill="#f8fafc" stroke="#e2e8f0" />
    <text x="38" y="252" fill="#0f172a" font-size="11" font-weight="bold">Bầu Cử Bổ Sung Ban Kiểm Tra</text>
    <text x="38" y="268" fill="#64748b" font-size="10">Số lượng ứng viên: 03 | Số phiếu: 01</text>
    <rect x="38" y="280" width="204" height="32" rx="8" fill="#F59E0B" />
    <text x="140" y="300" fill="#ffffff" font-size="11" font-weight="bold" text-anchor="middle">Bỏ Phiếu Bầu Cử Ngay</text>
  </g>

  <g transform="translate(380, 115)">
    <rect x="0" y="0" width="380" height="110" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="36" fill="#fbbf24" font-size="15" font-weight="bold">1. Bỏ Phiếu Minh Bạch 1-Hội-Viên 1-Phiếu</text>
    <text x="24" y="62" fill="#cbd5e1" font-size="12">Mỗi hội viên chính thức được cấp 01 quyền bỏ phiếu duy nhất,</text>
    <text x="24" y="80" fill="#cbd5e1" font-size="12">mã hóa danh tính đảm bảo công bằng và bảo mật tuyệt đối.</text>

    <rect x="0" y="130" width="380" height="110" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="166" fill="#38bdf8" font-size="15" font-weight="bold">2. Kết Quả Kiểm Phiếu Thời Gian Thực</text>
    <text x="24" y="192" fill="#cbd5e1" font-size="12">Biểu đồ tỷ lệ phần trăm cử tri tham gia và kết quả</text>
    <text x="24" y="210" fill="#cbd5e1" font-size="12">được cập nhật trực tiếp trên màn hình LED đại hội.</text>

    <rect x="0" y="260" width="380" height="95" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="296" fill="#4ade80" font-size="15" font-weight="bold">3. Niêm Phong &amp; Kiểm Toán Điện Tử</text>
    <text x="24" y="322" fill="#cbd5e1" font-size="12">Sau khi đóng phiên, biên bản kiểm phiếu được lưu trữ bất biến.</text>
  </g>
`;

// 7. demo_sponsors.svg
const sponsorsContent = `
  <g transform="translate(60, 105)">
    <rect x="0" y="0" width="280" height="380" rx="32" fill="#0f172a" stroke="#334155" stroke-width="4" filter="url(#dropGlow)" />
    <rect x="90" y="8" width="100" height="16" rx="8" fill="#1e293b" />
    <rect x="15" y="36" width="250" height="330" rx="20" fill="#ffffff" />
    <text x="140" y="68" fill="#003B95" font-size="13" font-weight="bold" text-anchor="middle">NHÀ TÀI TRỢ KIM CƯƠNG</text>
    <!-- Sponsor 1 -->
    <rect x="25" y="82" width="230" height="75" rx="12" fill="#fffbeb" stroke="#fef3c7" />
    <circle cx="55" cy="119" r="20" fill="#F59E0B" />
    <text x="55" y="125" fill="#ffffff" font-size="16" font-weight="bold" text-anchor="middle">💎</text>
    <text x="85" y="108" fill="#0f172a" font-size="12" font-weight="bold">Tập Đoàn Địa Ốc Quý Hợi</text>
    <text x="85" y="122" fill="#d97706" font-size="10" font-weight="bold">Nhà Tài Trợ Kim Cương 2026</text>
    <text x="85" y="136" fill="#64748b" font-size="9">Đồng hành Gala Thường Niên</text>

    <!-- Sponsor 2 -->
    <rect x="25" y="165" width="230" height="75" rx="12" fill="#f8fafc" stroke="#e2e8f0" />
    <circle cx="55" cy="202" r="20" fill="#003B95" />
    <text x="55" y="208" fill="#ffffff" font-size="16" font-weight="bold" text-anchor="middle">🥇</text>
    <text x="85" y="191" fill="#0f172a" font-size="12" font-weight="bold">Ngân Hàng MB Bank</text>
    <text x="85" y="205" fill="#003B95" font-size="10" font-weight="bold">Nhà Tài Trợ Vàng Hội Nghị B2B</text>
    <text x="85" y="219" fill="#64748b" font-size="9">Đối tác giải pháp VietQR tự động</text>

    <rect x="25" y="255" width="230" height="42" rx="12" fill="#003B95" />
    <text x="140" y="281" fill="#ffffff" font-size="11" font-weight="bold" text-anchor="middle">Đăng Ký Gói Tài Trợ Sự Kiện</text>
  </g>

  <g transform="translate(380, 115)">
    <rect x="0" y="0" width="380" height="110" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="36" fill="#fbbf24" font-size="15" font-weight="bold">1. Quyền Lợi Truyền Thông Đa Kênh</text>
    <text x="24" y="62" fill="#cbd5e1" font-size="12">Logo và thương hiệu nhà tài trợ xuất hiện tại banner chính,</text>
    <text x="24" y="80" fill="#cbd5e1" font-size="12">kỷ yếu đại biểu và các bản tin email marketing gửi 1000+ CEO.</text>

    <rect x="0" y="130" width="380" height="110" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="166" fill="#38bdf8" font-size="15" font-weight="bold">2. Gian Hàng Trưng Bày Độc Quyền</text>
    <text x="24" y="192" fill="#cbd5e1" font-size="12">Bố trí vị trí booth triển lãm trang trọng tại sảnh chính</text>
    <text x="24" y="210" fill="#cbd5e1" font-size="12">của các kỳ Hội thảo và Diễn đàn Xúc tiến Thương mại.</text>

    <rect x="0" y="260" width="380" height="95" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="296" fill="#4ade80" font-size="15" font-weight="bold">3. Vinh Danh Kỷ Niệm Chương &amp; Bằng Khen</text>
    <text x="24" y="322" fill="#cbd5e1" font-size="12">Trao tặng bảng vàng tri ân trực tiếp trên sân khấu Gala.</text>
  </g>
`;

// 8. demo_security.svg
const securityContent = `
  <g transform="translate(60, 105)">
    <rect x="0" y="0" width="280" height="380" rx="32" fill="#0f172a" stroke="#334155" stroke-width="4" filter="url(#dropGlow)" />
    <rect x="90" y="8" width="100" height="16" rx="8" fill="#1e293b" />
    <rect x="15" y="36" width="250" height="330" rx="20" fill="#ffffff" />
    <text x="140" y="68" fill="#003B95" font-size="13" font-weight="bold" text-anchor="middle">BẢO MẬT &amp; THIẾT BỊ</text>
    <!-- NFC Lock toggle card -->
    <rect x="25" y="80" width="230" height="80" rx="12" fill="#fef2f2" stroke="#fecaca" />
    <text x="38" y="104" fill="#991b1b" font-size="11" font-weight="bold">Khóa Thẻ NFC Từ Xa</text>
    <text x="38" y="118" fill="#b91c1c" font-size="9">Vô hiệu hóa chip thẻ vật lý khi thất lạc</text>
    <rect x="38" y="126" width="100" height="24" rx="6" fill="#dc2626" />
    <text x="88" y="142" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">🔒 Khóa thẻ ngay</text>

    <!-- 2FA card -->
    <rect x="25" y="170" width="230" height="65" rx="12" fill="#f8fafc" stroke="#e2e8f0" />
    <text x="38" y="192" fill="#0f172a" font-size="11" font-weight="bold">Xác Thực 2 Bước (2FA)</text>
    <text x="38" y="206" fill="#64748b" font-size="9">Mã OTP SMS khi đăng nhập máy lạ</text>
    <rect x="195" y="186" width="45" height="22" rx="11" fill="#10b981" />
    <circle cx="230" cy="197" r="8" fill="#ffffff" />

    <!-- Session devices -->
    <rect x="25" y="245" width="230" height="85" rx="12" fill="#f8fafc" stroke="#e2e8f0" />
    <text x="38" y="266" fill="#0f172a" font-size="11" font-weight="bold">Thiết Bị Đang Đăng Nhập (2)</text>
    <text x="38" y="280" fill="#64748b" font-size="9">📱 iPhone 16 Pro • Hà Nội (Hiện tại)</text>
    <text x="38" y="294" fill="#64748b" font-size="9">💻 MacBook Pro • Chrome (Đang mở)</text>
    <rect x="38" y="302" width="150" height="20" rx="5" fill="#334155" />
    <text x="113" y="316" fill="#ffffff" font-size="8" font-weight="bold" text-anchor="middle">Đăng xuất khỏi thiết bị khác</text>
  </g>

  <g transform="translate(380, 115)">
    <rect x="0" y="0" width="380" height="110" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="36" fill="#fbbf24" font-size="15" font-weight="bold">1. Khóa Chip Thẻ NFC Từ Xa Tức Thời</text>
    <text x="24" y="62" fill="#cbd5e1" font-size="12">Nếu làm rơi hoặc để quên thẻ vật lý, bấm "Khóa thẻ"</text>
    <text x="24" y="80" fill="#cbd5e1" font-size="12">để vô hiệu hóa dữ liệu chạm, đảm bảo an toàn tuyệt đối.</text>

    <rect x="0" y="130" width="380" height="110" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="166" fill="#38bdf8" font-size="15" font-weight="bold">2. Quản Trị Phiên Đăng Nhập Đa Thiết Bị</text>
    <text x="24" y="192" fill="#cbd5e1" font-size="12">Theo dõi các máy đang đăng nhập tài khoản của bạn</text>
    <text x="24" y="210" fill="#cbd5e1" font-size="12">và thực hiện đăng xuất từ xa chỉ với 1 cú click.</text>

    <rect x="0" y="260" width="380" height="95" rx="16" fill="#142247" stroke="#253b75" stroke-width="1.5" />
    <text x="24" y="296" fill="#4ade80" font-size="15" font-weight="bold">3. Cấp Lại Phôi Thẻ NFC Trong 30 Giây</text>
    <text x="24" y="322" fill="#cbd5e1" font-size="12">Ban Thư Ký cấp thẻ mới, hệ thống tự thu hồi mã cũ an toàn.</text>
  </g>
`;

const svgs = [
  { name: 'demo_onehand.svg', title: 'HƯỚNG DẪN 2: THAO TÁC 1 TAY DYNAMIC & REACHABILITY', subtitle: 'Kéo nửa màn hình xuống, vuốt chuyển tab & công thái học', badge: 'REACHABILITY', content: onehandContent },
  { name: 'demo_filter_sort.svg', title: 'HƯỚNG DẪN 5: BỘ LỌC TIN NHẮN & SẮP XẾP A-Z', subtitle: 'Sắp xếp thời gian, dải phím chữ cái A-Z và trạng thái', badge: 'FILTER A-Z', content: filterSortContent },
  { name: 'demo_documents.svg', title: 'HƯỚNG DẪN 8: TÀI LIỆU MẬT & THƯ VIỆN SỐ', subtitle: 'Tải kỷ yếu, slide diễn giả, nghị quyết PDF/DOCX mã hóa', badge: 'THƯ VIỆN SỐ', content: documentsContent },
  { name: 'demo_meetings.svg', title: 'HƯỚNG DẪN 9: HỌP BAN CHẤP HÀNH & KÝ BIÊN BẢN', subtitle: 'Lịch họp BCH, thư mời tự động, điểm danh và ký số', badge: 'HỌP BCH', content: meetingsContent },
  { name: 'demo_marketplace.svg', title: 'HƯỚNG DẪN 10: SÀN GIAO THƯƠNG B2B NỘI BỘ', subtitle: 'Đăng tin chào mua/bán, chiết khấu nội bộ & đàm phán hợp đồng', badge: 'SÀN B2B', content: marketplaceContent },
  { name: 'demo_voting.svg', title: 'HƯỚNG DẪN 12: BIỂU QUYẾT ĐẠI HỘI & BẦU CỬ', subtitle: 'Bỏ phiếu minh bạch, kiểm phiếu thời gian thực & niêm phong', badge: 'BIỂU QUYẾT', content: votingContent },
  { name: 'demo_sponsors.svg', title: 'HƯỚNG DẪN 13: NHÀ TÀI TRỢ & QUYỀN LỢI TRUYỀN THÔNG', subtitle: 'Gói tài trợ Kim Cương, Vàng, Bạc và vinh danh đại biểu', badge: 'TÀI TRỢ', content: sponsorsContent },
  { name: 'demo_security.svg', title: 'HƯỚNG DẪN 14: BẢO MẬT & KHÓA THẺ NFC TỪ XA', subtitle: 'Khóa thẻ thông minh khi thất lạc, xác thực 2FA & quản lý thiết bị', badge: 'BẢO MẬT', content: securityContent },
];

svgs.forEach((item) => {
  const filePath = path.join(targetDir, item.name);
  const svgXml = createSvgTemplate(item.title, item.subtitle, item.badge, item.content);
  fs.writeFileSync(filePath, svgXml, 'utf8');
  console.log('Created SVG illustration:', filePath);
});

console.log('All 8 SVG illustrations successfully created!');
