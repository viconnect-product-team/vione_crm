const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../apps/vione_app_fe/public/docs/images');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function svgWrapper(title, subtitle, content) {
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
      <stop offset="100%" stop-color="#0066CC" />
    </linearGradient>
    <filter id="dropGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <rect width="800" height="520" fill="url(#bgGrad)" />
  
  <!-- Decorative Background Grid Lines -->
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
  <text x="75" y="60" fill="#ffffff" font-size="14" font-weight="900" text-anchor="middle">CEO</text>
  <text x="108" y="46" fill="#fbbf24" font-size="15" font-weight="800" letter-spacing="0.5">${title}</text>
  <text x="108" y="66" fill="#94a3b8" font-size="12">${subtitle}</text>

  <!-- Content Slot -->
  ${content}
</svg>`;
}

// 1. Auth & Login Demo
const authContent = `
  <g transform="translate(60, 105)">
    <!-- Phone Mockup -->
    <rect x="0" y="0" width="280" height="380" rx="32" fill="#0f172a" stroke="#334155" stroke-width="4" filter="url(#dropGlow)" />
    <!-- Notch -->
    <rect x="90" y="8" width="100" height="16" rx="8" fill="#1e293b" />
    
    <!-- Phone Screen Content -->
    <rect x="15" y="36" width="250" height="330" rx="20" fill="#ffffff" />
    
    <!-- App Logo in Phone -->
    <circle cx="140" cy="80" r="24" fill="#003B95" />
    <text x="140" y="86" fill="#fbbf24" font-size="16" font-weight="900" text-anchor="middle">1983</text>
    <text x="140" y="122" fill="#0f172a" font-size="13" font-weight="800" text-anchor="middle">ĐĂNG NHẬP HỘI VIÊN</text>
    <text x="140" y="138" fill="#64748b" font-size="9" text-anchor="middle">CLB Doanh Nhân CEO 1983</text>
    
    <!-- Inputs -->
    <rect x="35" y="156" width="210" height="34" rx="10" fill="#f8fafc" stroke="#cbd5e1" />
    <text x="48" y="178" fill="#0f172a" font-size="11" font-weight="600">098.333.1983</text>
    
    <rect x="35" y="200" width="210" height="34" rx="10" fill="#f8fafc" stroke="#cbd5e1" />
    <text x="48" y="222" fill="#94a3b8" font-size="11">••••••••</text>
    
    <rect x="35" y="246" width="210" height="36" rx="12" fill="#003B95" />
    <text x="140" y="269" fill="#ffffff" font-size="12" font-weight="700" text-anchor="middle">ĐĂNG NHẬP NGAY</text>
    
    <!-- Card badge -->
    <rect x="35" y="295" width="210" height="48" rx="12" fill="#f0fdf4" stroke="#86efac" />
    <circle cx="55" cy="319" r="10" fill="#22c55e" />
    <text x="55" y="323" fill="#ffffff" font-size="10" font-weight="900" text-anchor="middle">✓</text>
    <text x="75" y="315" fill="#15803d" font-size="10" font-weight="800">Thẻ Hội Viên: M1983-007</text>
    <text x="75" y="329" fill="#166534" font-size="9">Trạng thái: Chính thức hoạt động</text>
  </g>

  <!-- Explanation Cards on Right -->
  <g transform="translate(380, 115)">
    <!-- Step 1 -->
    <rect x="0" y="0" width="360" height="85" rx="16" fill="#142247" stroke="#253b75" />
    <circle cx="35" cy="42" r="16" fill="#0084FF" />
    <text x="35" y="47" fill="#ffffff" font-size="13" font-weight="800" text-anchor="middle">1</text>
    <text x="65" y="34" fill="#ffffff" font-size="13" font-weight="700">Nhập Số Điện Thoại / Mã Hội Viên</text>
    <text x="65" y="54" fill="#94a3b8" font-size="11.5">Sử dụng SĐT đã đăng ký với Ban Thư Ký CLB.</text>
    <text x="65" y="70" fill="#38bdf8" font-size="11">Hỗ trợ nhận mã OTP xác thực qua SMS/Zalo.</text>

    <!-- Step 2 -->
    <rect x="0" y="100" width="360" height="85" rx="16" fill="#142247" stroke="#253b75" />
    <circle cx="35" cy="142" r="16" fill="#0084FF" />
    <text x="35" y="147" fill="#ffffff" font-size="13" font-weight="800" text-anchor="middle">2</text>
    <text x="65" y="134" fill="#ffffff" font-size="13" font-weight="700">Kích Hoạt Quyền Lợi Hội Viên</text>
    <text x="65" y="154" fill="#94a3b8" font-size="11.5">Hệ thống đối soát tự động danh sách BCH &amp; Hội viên.</text>
    <text x="65" y="170" fill="#38bdf8" font-size="11">Tự động cấp huy hiệu Xác thực Doanh Nhân CEO.</text>

    <!-- Step 3 -->
    <rect x="0" y="200" width="360" height="85" rx="16" fill="#142247" stroke="#253b75" />
    <circle cx="35" cy="242" r="16" fill="#0084FF" />
    <text x="35" y="247" fill="#ffffff" font-size="13" font-weight="800" text-anchor="middle">3</text>
    <text x="65" y="234" fill="#ffffff" font-size="13" font-weight="700">Cài Đặt PWA Lên Màn Hình Chính</text>
    <text x="65" y="254" fill="#94a3b8" font-size="11.5">Bấm 'Cài đặt ứng dụng' tại tab Tài khoản để dùng như App.</text>
    <text x="65" y="270" fill="#38bdf8" font-size="11">Hoạt động mượt mà cả khi offline hoặc mạng yếu.</text>

    <!-- Hot Tip Badge -->
    <rect x="0" y="300" width="360" height="40" rx="12" fill="#854d0e" stroke="#eab308" stroke-dasharray="4,4" />
    <text x="20" y="325" fill="#fef08a" font-size="11" font-weight="600">💡 Mẹo: Có thể đăng nhập cùng lúc trên iPhone, Android và Laptop.</text>
  </g>
`;

// 2. NFC & Digital Card Demo
const nfcContent = `
  <g transform="translate(60, 115)">
    <!-- Smart NFC Card Mockup (Golden Metallic) -->
    <rect x="0" y="0" width="320" height="195" rx="20" fill="url(#goldGrad)" filter="url(#dropGlow)" stroke="#fef08a" stroke-width="1.5" />
    <!-- Chip Icon -->
    <rect x="35" y="35" width="42" height="32" rx="6" fill="#fde047" stroke="#ca8a04" stroke-width="1.5" />
    <line x1="48" y1="35" x2="48" y2="67" stroke="#ca8a04" />
    <line x1="62" y1="35" x2="62" y2="67" stroke="#ca8a04" />
    <line x1="35" y1="51" x2="77" y2="51" stroke="#ca8a04" />

    <!-- NFC Waves -->
    <path d="M 95 42 A 15 15 0 0 1 95 62" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
    <path d="M 103 36 A 25 25 0 0 1 103 68" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
    <path d="M 111 30 A 35 35 0 0 1 111 74" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />

    <text x="290" y="48" fill="#ffffff" font-size="12" font-weight="900" text-anchor="end">CLB CEO 1983</text>
    <text x="290" y="64" fill="#fef08a" font-size="10" font-weight="700" text-anchor="end">OFFICIAL VIP MEMBER</text>

    <!-- Member Name on Card -->
    <text x="35" y="125" fill="#ffffff" font-size="17" font-weight="900" letter-spacing="0.5">LÊ HOÀNG LONG</text>
    <text x="35" y="145" fill="#fef08a" font-size="11" font-weight="700">CHỦ TỊCH HĐQT &amp; TỔNG GIÁM ĐỐC</text>
    <text x="35" y="172" fill="#ffffff" font-size="12" font-weight="700" letter-spacing="2">M1983 - 007</text>

    <!-- Mini QR Code on Card -->
    <rect x="250" y="125" width="45" height="45" rx="6" fill="#ffffff" />
    <rect x="255" y="130" width="12" height="12" fill="#000000" />
    <rect x="278" y="130" width="12" height="12" fill="#000000" />
    <rect x="255" y="153" width="12" height="12" fill="#000000" />
    <rect x="272" y="147" width="8" height="8" fill="#000000" />

    <!-- Wave Rays Connecting to Phone -->
    <path d="M 160 215 C 160 260, 200 290, 240 310" fill="none" stroke="#38bdf8" stroke-width="3" stroke-dasharray="6,6" />
    <circle cx="240" cy="310" r="6" fill="#38bdf8" />
    <text x="140" y="270" fill="#38bdf8" font-size="11" font-weight="700">Chạm NFC 1 giây</text>

    <!-- Receiver Smartphone Preview -->
    <rect x="60" y="260" width="220" height="90" rx="16" fill="#1e293b" stroke="#475569" stroke-width="2" />
    <circle cx="95" cy="305" r="22" fill="#003B95" />
    <text x="95" y="311" fill="#ffffff" font-size="12" font-weight="800" text-anchor="middle">LHL</text>
    <text x="128" y="298" fill="#ffffff" font-size="12" font-weight="700">Đã lưu danh thiếp!</text>
    <text x="128" y="314" fill="#94a3b8" font-size="10">Số điện thoại: 098.333.1983</text>
    <text x="128" y="330" fill="#22c55e" font-size="10" font-weight="700">✓ Tự động đồng bộ Danh bạ</text>
  </g>

  <!-- Right Steps -->
  <g transform="translate(420, 115)">
    <rect x="0" y="0" width="340" height="95" rx="16" fill="#142247" stroke="#253b75" />
    <text x="25" y="32" fill="#fbbf24" font-size="13" font-weight="800">CÔNG NGHỆ CHẠM NFC 1-CHẠM</text>
    <text x="25" y="54" fill="#ffffff" font-size="12" font-weight="600">Đặt thẻ vào mặt lưng iPhone hoặc Android.</text>
    <text x="25" y="72" fill="#94a3b8" font-size="11">Đối tác không cần cài ứng dụng, danh bạ sẽ hiện lên</text>
    <text x="25" y="88" fill="#94a3b8" font-size="11">kèm nút "Lưu danh bạ (Save Contact .vcf)".</text>

    <rect x="0" y="115" width="340" height="95" rx="16" fill="#142247" stroke="#253b75" />
    <text x="25" y="147" fill="#fbbf24" font-size="13" font-weight="800">QUÉT MÃ QR CÁ NHÂN</text>
    <text x="25" y="169" fill="#ffffff" font-size="12" font-weight="600">Mỗi hội viên sở hữu 01 mã QR độc quyền.</text>
    <text x="25" y="187" fill="#94a3b8" font-size="11">Dễ dàng chia sẻ qua Zalo, Messenger, LinkedIn</text>
    <text x="25" y="203" fill="#94a3b8" font-size="11">hoặc in trực tiếp lên namecard truyền thống.</text>

    <rect x="0" y="230" width="340" height="95" rx="16" fill="#142247" stroke="#253b75" />
    <text x="25" y="262" fill="#fbbf24" font-size="13" font-weight="800">BẢO MẬT &amp; CHỐNG GIẢ MẠO</text>
    <text x="25" y="284" fill="#ffffff" font-size="12" font-weight="600">Mã hóa chuỗi xác thực RSA chuẩn ngân hàng.</text>
    <text x="25" y="302" fill="#94a3b8" font-size="11">Ngay khi khóa thẻ từ xa trên App, thẻ vật lý</text>
    <text x="25" y="318" fill="#94a3b8" font-size="11">sẽ lập tức chuyển sang trạng thái vô hiệu hóa.</text>
  </g>
`;

// 3. Messenger Chat & Retract Demo
const chatContent = `
  <g transform="translate(60, 105)">
    <!-- Messenger Chat Window Mockup -->
    <rect x="0" y="0" width="320" height="380" rx="24" fill="#ffffff" stroke="#334155" stroke-width="2" filter="url(#dropGlow)" />
    
    <!-- Chat Header -->
    <rect x="0" y="0" width="320" height="55" rx="24" fill="#ffffff" />
    <circle cx="35" cy="28" r="16" fill="#003B95" />
    <text x="35" y="33" fill="#ffffff" font-size="11" font-weight="800" text-anchor="middle">LHL</text>
    <circle cx="47" cy="38" r="4.5" fill="#22c55e" stroke="#ffffff" stroke-width="1.5" />
    <text x="60" y="25" fill="#0f172a" font-size="12" font-weight="800">Lê Hoàng Long</text>
    <text x="60" y="39" fill="#16a34a" font-size="9.5" font-weight="600">Đang hoạt động</text>

    <!-- Incoming Message from Peer -->
    <circle cx="25" cy="95" r="12" fill="#64748b" />
    <text x="25" y="99" fill="#ffffff" font-size="9" text-anchor="middle">HL</text>
    <rect x="44" y="78" width="190" height="36" rx="16" fill="#f1f5f9" />
    <text x="56" y="100" fill="#0f172a" font-size="11">Chào anh, rất vui được kết nối!</text>

    <!-- My Outgoing Message (Blue Messenger) -->
    <rect x="90" y="125" width="215" height="42" rx="16" fill="url(#blueGrad)" />
    <text x="104" y="145" fill="#ffffff" font-size="11">Mình đã gửi profile công ty nhé!</text>
    <text x="290" y="160" fill="#bfdbfe" font-size="8.5" text-anchor="end">14:20 ✓✓ Đã xem</text>

    <!-- Recalled Message (Messenger 100% standard) -->
    <rect x="110" y="180" width="195" height="34" rx="16" fill="none" stroke="#cbd5e1" stroke-width="1.2" />
    <text x="207" y="201" fill="#94a3b8" font-size="10.5" font-style="italic" text-anchor="middle">Bạn đã thu hồi một tin nhắn</text>

    <!-- Float Reaction Bar (👍 ❤️ 😂 😮 😢 😡) -->
    <rect x="120" y="222" width="165" height="32" rx="16" fill="#ffffff" stroke="#e2e8f0" filter="url(#dropGlow)" />
    <text x="135" y="243" font-size="14">👍</text>
    <text x="160" y="243" font-size="14">❤️</text>
    <text x="185" y="243" font-size="14">😂</text>
    <text x="210" y="243" font-size="14">😮</text>
    <text x="235" y="243" font-size="14">😢</text>
    <text x="260" y="243" font-size="14">😡</text>

    <!-- Another My Message with Heart Reaction -->
    <rect x="120" y="265" width="185" height="40" rx="16" fill="url(#blueGrad)" />
    <text x="134" y="285" fill="#ffffff" font-size="11">Hẹn gặp anh ở hội nghị 28/3.</text>
    <text x="290" y="299" fill="#bfdbfe" font-size="8.5" text-anchor="end">14:22 ✓</text>
    <!-- Reaction badge -->
    <rect x="280" y="295" width="24" height="18" rx="9" fill="#ffffff" stroke="#e2e8f0" />
    <text x="292" y="308" font-size="10" text-anchor="middle">❤️</text>

    <!-- Input Bar -->
    <line x1="0" y1="330" x2="320" y2="330" stroke="#f1f5f9" />
    <rect x="15" y="338" width="245" height="32" rx="16" fill="#f1f5f9" />
    <text x="30" y="358" fill="#94a3b8" font-size="10.5">Nhập tin nhắn giao thương...</text>
    <circle cx="290" cy="354" r="16" fill="#0084FF" />
    <path d="M 285 354 L 294 348 L 294 360 Z" fill="#ffffff" />
  </g>

  <!-- Right Steps -->
  <g transform="translate(420, 115)">
    <rect x="0" y="0" width="340" height="90" rx="16" fill="#142247" stroke="#253b75" />
    <text x="25" y="30" fill="#38bdf8" font-size="13" font-weight="800">BONG BÓNG CHUẨN MESSENGER</text>
    <text x="25" y="52" fill="#ffffff" font-size="11.5">Màu xanh Messenger (#0084FF) sang trọng, chữ trắng.</text>
    <text x="25" y="68" fill="#94a3b8" font-size="11">Tin nhắn đến màu xám mờ mềm mại có avatar bên cạnh.</text>

    <rect x="0" y="105" width="340" height="90" rx="16" fill="#142247" stroke="#253b75" />
    <text x="25" y="135" fill="#38bdf8" font-size="13" font-weight="800">TÍNH NĂNG THU HỒI TIN NHẮN</text>
    <text x="25" y="157" fill="#ffffff" font-size="11.5">Bấm dấu (...) bên cạnh tin nhắn và chọn 'Thu hồi'.</text>
    <text x="25" y="173" fill="#94a3b8" font-size="11">Chuyển sang trạng thái 'Bạn đã thu hồi một tin nhắn'.</text>

    <rect x="0" y="210" width="340" height="110" rx="16" fill="#142247" stroke="#253b75" />
    <text x="25" y="240" fill="#38bdf8" font-size="13" font-weight="800">THẢ CẢM XÚC &amp; GẮN KẾT B2B</text>
    <text x="25" y="262" fill="#ffffff" font-size="11.5">Hover hoặc chạm để thả 6 loại cảm xúc tức thời.</text>
    <text x="25" y="278" fill="#94a3b8" font-size="11">Hỗ trợ gửi hình ảnh, file PDF hợp đồng, thư mời họp</text>
    <text x="25" y="294" fill="#94a3b8" font-size="11">và hóa đơn VietQR tự động ngay trong khung chat.</text>
  </g>
`;

// 4. Directory & B2B Demo
const directoryContent = `
  <g transform="translate(60, 115)">
    <!-- Member Card Mockup -->
    <rect x="0" y="0" width="320" height="150" rx="20" fill="#ffffff" stroke="#e2e8f0" filter="url(#dropGlow)" />
    <circle cx="45" cy="48" r="24" fill="#003B95" />
    <text x="45" y="54" fill="#ffffff" font-size="14" font-weight="800" text-anchor="middle">LHL</text>
    <text x="82" y="40" fill="#0f172a" font-size="14" font-weight="800">Lê Hoàng Long</text>
    <text x="82" y="58" fill="#64748b" font-size="11">Chủ tịch HĐQT &amp; CEO - TechCorp</text>
    <rect x="82" y="68" width="75" height="18" rx="6" fill="#fef3c7" />
    <text x="119" y="81" fill="#b45309" font-size="9.5" font-weight="800" text-anchor="middle">M1983-007</text>
    
    <line x1="20" y1="98" x2="300" y2="98" stroke="#f1f5f9" />
    <rect x="20" y="108" width="135" height="30" rx="10" fill="#eff6ff" />
    <text x="87" y="127" fill="#003B95" font-size="11" font-weight="700" text-anchor="middle">💬 Nhắn tin</text>
    <rect x="165" y="108" width="135" height="30" rx="10" fill="#fef2f2" stroke="#fecaca" />
    <text x="232" y="127" fill="#dc2626" font-size="11" font-weight="700" text-anchor="middle">❌ Hủy kết nối</text>

    <!-- B2B Opportunity Card -->
    <rect x="0" y="170" width="320" height="155" rx="20" fill="#142247" stroke="#253b75" filter="url(#dropGlow)" />
    <rect x="20" y="188" width="80" height="20" rx="6" fill="#16a34a" />
    <text x="60" y="202" fill="#ffffff" font-size="10" font-weight="800" text-anchor="middle">NHU CẦU MUA</text>
    <text x="20" y="230" fill="#ffffff" font-size="13" font-weight="700">Tìm kiếm đối tác cung cấp vật liệu xây dựng</text>
    <text x="20" y="250" fill="#94a3b8" font-size="11">Ngân sách: 15 tỷ VNĐ • Hạn chót: 30/04/2026</text>
    <line x1="20" y1="265" x2="300" y2="265" stroke="#253b75" />
    <text x="20" y="295" fill="#38bdf8" font-size="11.5" font-weight="600">Đăng bởi: Công ty CP Đầu Tư CEO Thăng Long</text>
  </g>

  <!-- Right Steps -->
  <g transform="translate(420, 115)">
    <rect x="0" y="0" width="340" height="95" rx="16" fill="#142247" stroke="#253b75" />
    <text x="25" y="32" fill="#fbbf24" font-size="13" font-weight="800">DANH BẠ HỘI VIÊN CHÍNH THỨC</text>
    <text x="25" y="54" fill="#ffffff" font-size="12" font-weight="600">Tra cứu danh bạ hơn 500+ CEO ưu tú.</text>
    <text x="25" y="72" fill="#94a3b8" font-size="11">Bộ lọc thông minh theo Tỉnh thành, Ngành nghề,</text>
    <text x="25" y="88" fill="#94a3b8" font-size="11">Quy mô doanh nghiệp và Ban chuyên môn CLB.</text>

    <rect x="0" y="115" width="340" height="95" rx="16" fill="#142247" stroke="#253b75" />
    <text x="25" y="147" fill="#fbbf24" font-size="13" font-weight="800">QUẢN LÝ KẾT NỐI &amp; HỦY KẾT NỐI</text>
    <text x="25" y="169" fill="#ffffff" font-size="12" font-weight="600">Bấm vào Avatar bất kỳ để xem hồ sơ chi tiết.</text>
    <text x="25" y="187" fill="#94a3b8" font-size="11">Nếu đã kết nối: Nút chuyển thành 'HỦY KẾT NỐI'.</text>
    <text x="25" y="203" fill="#94a3b8" font-size="11">Nếu chưa kết nối: Bấm 'KẾT NỐI NGAY' 1-chạm.</text>

    <rect x="0" y="230" width="340" height="95" rx="16" fill="#142247" stroke="#253b75" />
    <text x="25" y="262" fill="#fbbf24" font-size="13" font-weight="800">SÀN GIAO THƯƠNG B2B NỘI BỘ</text>
    <text x="25" y="284" fill="#ffffff" font-size="12" font-weight="600">Đăng tin mua - bán sản phẩm, gọi vốn đầu tư.</text>
    <text x="25" y="302" fill="#94a3b8" font-size="11">Ưu đãi giảm giá độc quyền dành riêng cho hội viên</text>
    <text x="25" y="318" fill="#94a3b8" font-size="11">với cơ chế bảo chứng chất lượng từ CLB Doanh Nhân.</text>
  </g>
`;

// 5. QR Check-in & Voting Demo
const qrContent = `
  <g transform="translate(60, 115)">
    <!-- QR Check-in Mockup -->
    <rect x="0" y="0" width="320" height="320" rx="24" fill="#ffffff" stroke="#e2e8f0" filter="url(#dropGlow)" />
    
    <text x="160" y="38" fill="#0f172a" font-size="13" font-weight="800" text-anchor="middle">ĐIỂM DANH SỰ KIỆN QR</text>
    <text x="160" y="55" fill="#64748b" font-size="10.5" text-anchor="middle">Họp Ban Chấp Hành CEO 1983 - Tháng 3</text>
    
    <!-- Big QR Frame -->
    <rect x="65" y="70" width="190" height="190" rx="16" fill="#f8fafc" stroke="#cbd5e1" />
    <!-- Big QR Elements -->
    <rect x="85" y="90" width="45" height="45" rx="6" fill="#003B95" />
    <rect x="95" y="100" width="25" height="25" rx="4" fill="#ffffff" />
    <rect x="102" y="107" width="11" height="11" fill="#003B95" />

    <rect x="190" y="90" width="45" height="45" rx="6" fill="#003B95" />
    <rect x="200" y="100" width="25" height="25" rx="4" fill="#ffffff" />
    <rect x="207" y="107" width="11" height="11" fill="#003B95" />

    <rect x="85" y="195" width="45" height="45" rx="6" fill="#003B95" />
    <rect x="95" y="205" width="25" height="25" rx="4" fill="#ffffff" />
    <rect x="102" y="212" width="11" height="11" fill="#003B95" />

    <rect x="145" y="105" width="20" height="20" fill="#003B95" />
    <rect x="145" y="145" width="30" height="30" fill="#003B95" />
    <rect x="185" y="160" width="20" height="20" fill="#003B95" />
    <rect x="145" y="195" width="25" height="25" fill="#003B95" />

    <!-- Success Badge -->
    <rect x="40" y="275" width="240" height="34" rx="12" fill="#22c55e" />
    <text x="160" y="297" fill="#ffffff" font-size="11.5" font-weight="700" text-anchor="middle">✓ CHECK-IN THÀNH CÔNG (08:15)</text>
  </g>

  <!-- Right Steps -->
  <g transform="translate(420, 115)">
    <rect x="0" y="0" width="340" height="95" rx="16" fill="#142247" stroke="#253b75" />
    <text x="25" y="32" fill="#fbbf24" font-size="13" font-weight="800">QUÉT MÃ QR ĐIỂM DANH SỰ KIỆN</text>
    <text x="25" y="54" fill="#ffffff" font-size="12" font-weight="600">Đưa camera quét mã QR tại bàn lễ tân sự kiện.</text>
    <text x="25" y="72" fill="#94a3b8" font-size="11">Hệ thống lập tức ghi nhận điểm danh, tự động in</text>
    <text x="25" y="88" fill="#94a3b8" font-size="11">thẻ đeo điện tử và gửi thông báo chào mừng.</text>

    <rect x="0" y="115" width="340" height="95" rx="16" fill="#142247" stroke="#253b75" />
    <text x="25" y="147" fill="#fbbf24" font-size="13" font-weight="800">BIỂU QUYẾT &amp; BẦU CỬ ONLINE</text>
    <text x="25" y="169" fill="#ffffff" font-size="12" font-weight="600">Biểu quyết các nghị quyết đại hội trực tiếp.</text>
    <text x="25" y="187" fill="#94a3b8" font-size="11">Mỗi hội viên chính thức có 01 quyền bỏ phiếu.</text>
    <text x="25" y="203" fill="#94a3b8" font-size="11">Kết quả kiểm phiếu hiển thị thời gian thực (Real-time).</text>

    <rect x="0" y="230" width="340" height="95" rx="16" fill="#142247" stroke="#253b75" />
    <text x="25" y="262" fill="#fbbf24" font-size="13" font-weight="800">TẢI TÀI LIỆU HỘI THẢO 1-CHẠM</text>
    <text x="25" y="284" fill="#ffffff" font-size="12" font-weight="600">Toàn bộ slide diễn giả, kỷ yếu hội thảo.</text>
    <text x="25" y="302" fill="#94a3b8" font-size="11">Được lưu trữ vĩnh viễn trên kho thư viện số</text>
    <text x="25" y="318" fill="#94a3b8" font-size="11">của ứng dụng để hội viên tra cứu mọi lúc mọi nơi.</text>
  </g>
`;

// 6. VietQR Annual Fee Payment Demo
const feeContent = `
  <g transform="translate(60, 115)">
    <!-- VietQR Invoice Card Mockup -->
    <rect x="0" y="0" width="320" height="320" rx="24" fill="#ffffff" stroke="#e2e8f0" filter="url(#dropGlow)" />
    
    <!-- Bank & VietQR Header -->
    <rect x="0" y="0" width="320" height="48" rx="24" fill="#003B95" />
    <text x="20" y="30" fill="#ffffff" font-size="13" font-weight="800">HÓA ĐƠN HỘI PHÍ NIÊN KIM</text>
    <text x="300" y="30" fill="#fef08a" font-size="11" font-weight="700" text-anchor="end">CEO 1983</text>

    <text x="20" y="75" fill="#64748b" font-size="10.5">Số tiền thanh toán:</text>
    <text x="20" y="98" fill="#003B95" font-size="20" font-weight="900">20.000.000 VNĐ</text>
    
    <text x="20" y="118" fill="#64748b" font-size="10.5">Nội dung chuyển khoản:</text>
    <rect x="20" y="125" width="280" height="28" rx="8" fill="#f8fafc" stroke="#cbd5e1" />
    <text x="30" y="143" fill="#0f172a" font-size="10.5" font-weight="700">M1983-007 HOI PHI 2026</text>

    <!-- VietQR Code Image Placeholder -->
    <rect x="90" y="165" width="140" height="105" rx="12" fill="#eff6ff" stroke="#93c5fd" />
    <rect x="105" y="175" width="30" height="30" fill="#003B95" />
    <rect x="185" y="175" width="30" height="30" fill="#003B95" />
    <rect x="105" y="225" width="30" height="30" fill="#003B95" />
    <rect x="150" y="195" width="20" height="20" fill="#2563eb" />
    <text x="160" y="255" fill="#003B95" font-size="9" font-weight="800" text-anchor="middle">MB BANK - 1983000000</text>

    <!-- Pay Button -->
    <rect x="20" y="280" width="280" height="30" rx="10" fill="#16a34a" />
    <text x="160" y="300" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle">✓ ĐÃ XÁC NHẬN GẠCH NỢ TỰ ĐỘNG</text>
  </g>

  <!-- Right Steps -->
  <g transform="translate(420, 115)">
    <rect x="0" y="0" width="340" height="95" rx="16" fill="#142247" stroke="#253b75" />
    <text x="25" y="32" fill="#fbbf24" font-size="13" font-weight="800">THANH TOÁN 1-CHẠM QUA VIETQR</text>
    <text x="25" y="54" fill="#ffffff" font-size="12" font-weight="600">Quét mã bằng bất kỳ App ngân hàng nào.</text>
    <text x="25" y="72" fill="#94a3b8" font-size="11">Tự động điền chính xác Số tài khoản MB Bank,</text>
    <text x="25" y="88" fill="#94a3b8" font-size="11">Số tiền và Cú pháp định danh hội viên duy nhất.</text>

    <rect x="0" y="115" width="340" height="95" rx="16" fill="#142247" stroke="#253b75" />
    <text x="25" y="147" fill="#fbbf24" font-size="13" font-weight="800">TỰ ĐỘNG GẠCH NỢ &amp; GIA HẠN THẺ</text>
    <text x="25" y="169" fill="#ffffff" font-size="12" font-weight="600">Tiền về tài khoản CLB được ghi nhận sau 3 giây.</text>
    <text x="25" y="187" fill="#94a3b8" font-size="11">Thẻ hội viên số tự động cập nhật hạn dùng đến 2027.</text>
    <text x="25" y="203" fill="#94a3b8" font-size="11">Gửi thông báo xác nhận kèm hóa đơn vào Zalo/Tin nhắn.</text>

    <rect x="0" y="230" width="340" height="95" rx="16" fill="#142247" stroke="#253b75" />
    <text x="25" y="262" fill="#fbbf24" font-size="13" font-weight="800">XUẤT HÓA ĐƠN VAT ĐIỆN TỬ</text>
    <text x="25" y="284" fill="#ffffff" font-size="12" font-weight="600">Hỗ trợ xuất hóa đơn tài chính cho Doanh nghiệp.</text>
    <text x="25" y="302" fill="#94a3b8" font-size="11">Kê khai chi phí hợp lý hợp lệ cho công ty</text>
    <text x="25" y="318" fill="#94a3b8" font-size="11">theo quy định của Bộ Tài Chính và Luật Thuế.</text>
  </g>
`;

fs.writeFileSync(path.join(outDir, 'demo_auth_card.svg'), svgWrapper('HƯỚNG DẪN 1: ĐĂNG NHẬP &amp; KÍCH HOẠT THẺ', 'Xác thực tài khoản doanh nhân an toàn &amp; phân quyền thẻ thông minh', authContent));
fs.writeFileSync(path.join(outDir, 'demo_nfc_card.svg'), svgWrapper('HƯỚNG DẪN 2: DANH THIẾP ĐIỆN TỬ &amp; CHẠM NFC', 'Trao đổi danh bạ 1-chạm không chạm không cần cài đặt phần mềm', nfcContent));
fs.writeFileSync(path.join(outDir, 'demo_messenger_chat.svg'), svgWrapper('HƯỚNG DẪN 3: NHẮN TIN GIAO THƯƠNG CHUẨN MESSENGER', 'Giao diện Messenger 100%, thu hồi tin nhắn tức thời, thả biểu tượng cảm xúc', chatContent));
fs.writeFileSync(path.join(outDir, 'demo_directory_b2b.svg'), svgWrapper('HƯỚNG DẪN 4: DANH BẠ HỘI VIÊN &amp; CƠ HỘI B2B', 'Kết nối trực tiếp Chủ tịch, CEO và Sàn giao thương nội bộ', directoryContent));
fs.writeFileSync(path.join(outDir, 'demo_qr_checkin.svg'), svgWrapper('HƯỚNG DẪN 5: CHECK-IN SỰ KIỆN QR &amp; BIỂU QUYẾT', 'Điểm danh đại hội trong 1 giây, biểu quyết và tải tài liệu tự động', qrContent));
fs.writeFileSync(path.join(outDir, 'demo_vietqr_fee.svg'), svgWrapper('HƯỚNG DẪN 6: ĐÓNG HỘI PHÍ NIÊN KIM VIETQR', 'Thanh toán tự động 24/7 qua VietQR MB Bank, gạch nợ tức thì', feeContent));

console.log('Successfully generated 6 SVG demo illustrations in ' + outDir);
