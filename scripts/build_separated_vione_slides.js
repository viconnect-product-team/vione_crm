const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');

const rootDir = path.resolve(__dirname, '..');
const docDir = path.join(rootDir, 'document');
const publicDocsDir = path.join(rootDir, 'apps', 'vione_app_fe', 'public', 'docs');
const imagesDir = path.join(docDir, 'images', 'evidence_live_2026');

if (!fs.existsSync(publicDocsDir)) {
  fs.mkdirSync(publicDocsDir, { recursive: true });
}

console.log('>>> [SLIDES VIONE 2026] Bat dau khoi tao 2 bo Slide tach biet (CRM & Mobile App) + Bo tong hop...');

// =========================================================================
// 1. DATA: BỘ SLIDE WEB CRM VIONE (NỀN TRẮNG CHỮ ĐEN - ĐIỂM NHẤN VÀNG ĐỒNG)
// =========================================================================
const crmDeck = {
  id: 'crm',
  title: 'VIONE CRM PLATFORM · HỆ THỐNG QUẢN TRỊ DOANH NGHIỆP',
  filenameBase: 'SLIDE_WEB_CRM_VIONE',
  theme: {
    accent: 'B48250',
    accentLight: 'FDF8F0',
    primary: '0F172A',
    secondary: '64748B',
    border: 'E2E8F0'
  },
  slides: [
    // 1. Cover
    {
      type: 'cover',
      tag: 'HỆ SINH THÁI DOANH NGHIỆP VIONE',
      title: 'VIONE CRM PLATFORM',
      subtitle: 'Hệ Thống Quản Trị & Điều Hành Doanh Nghiệp Toàn Diện 360°',
      desc: 'Nền tảng số hóa quản trị tập trung, tự động hóa quy trình nghiệp vụ và tối ưu hóa phễu tăng trưởng B2B dành cho Ban Lãnh Đạo.',
      meta: 'Phiên Bản Doanh Nghiệp 6.0 · Tháng 10/2026 · Bản quyền © ViOne Corporation'
    },
    // 2. Agenda
    {
      type: 'agenda',
      tag: 'TỔNG QUAN NỘI DUNG',
      title: 'CẤU TRÚC BÀI THUYẾT TRÌNH CRM',
      subtitle: '6 Trọng tâm số hóa điều hành liền mạch trong doanh nghiệp',
      items: [
        { num: '01', title: 'Bảng Điều Hành C-Level 360°', desc: 'Giám sát chỉ số tài chính, doanh thu và tiến độ thời gian thực' },
        { num: '02', title: 'Phễu Kinh Doanh & Smart CRM Hub', desc: 'Quản trị khách hàng B2B, Deals Kanban và chấm điểm AI' },
        { num: '03', title: 'Quy Trình Vận Hành & Chấm Công', desc: 'BPMN chuẩn hóa công việc, điểm danh FaceID và định vị GPS' },
        { num: '04', title: 'Kiểm Soát Dòng Tiền & Chi 3 Cấp', desc: 'Phê duyệt tài chính minh bạch, thanh toán VietQR 24/7' },
        { num: '05', title: 'Trí Tuệ Nhân Tạo AI Copilot', desc: 'Trợ lý điều hành đàm thoại, tự động hóa soạn thảo và báo cáo' },
        { num: '06', title: 'Phân Quyền RBAC & Nền Tảng', desc: 'Ma trận quyền 7x6, bảo mật dữ liệu kiến trúc Multi-Tenant' }
      ]
    },
    // 3. Module 1
    {
      type: 'content',
      tag: 'PHÂN HỆ 01',
      title: 'BẢNG ĐIỀU HÀNH 360° & SỨC KHỎE DOANH NGHIỆP',
      subtitle: 'Bức tranh toàn cảnh hoạt động kinh doanh trên một màn hình duy nhất',
      image: 'crm_02_dashboard_overview.png',
      cards: [
        { icon: '📊', title: 'Radar Dòng Tiền Thực', desc: 'Theo dõi doanh thu, chi phí và số dư tài khoản thời gian thực không độ trễ.' },
        { icon: '🎯', title: 'Giám Sát Mục Tiêu OKR', desc: 'Đo lường tiến độ các mục tiêu kinh doanh và dự án trọng điểm toàn công ty.' },
        { icon: '⚡', title: 'Cảnh Báo Vận Hành Sớm', desc: 'Hệ thống tự động phát hiện các chỉ số bất thường để ban giám đốc xử lý kịp thời.' }
      ]
    },
    // 4. Module 2
    {
      type: 'content',
      tag: 'PHÂN HỆ 02',
      title: 'PHỄU KINH DOANH PIPELINE & SMART CRM HUB',
      subtitle: 'Chuyển đổi tối đa khách hàng tiềm năng thành hợp đồng doanh số',
      image: 'crm_07_opportunities_deals.png',
      cards: [
        { icon: '🔄', title: 'Kanban Deals 5 Giai Đoạn', desc: 'Kéo thả cơ hội trực quan: Tiếp cận → Khảo sát → Báo giá → Đàm phán → Chốt deal.' },
        { icon: '📇', title: 'Hồ Sơ Khách Hàng 360°', desc: 'Tập trung toàn bộ lịch sử tương tác, hợp đồng, báo giá và công nợ chi tiết.' },
        { icon: '⭐', title: 'Chấm Điểm Tiềm Năng AI', desc: 'Tự động phân hạng Hot Lead, VIP C-Level và nhắc nhở thương vụ bị bỏ quên.' }
      ]
    },
    // 5. Module 3
    {
      type: 'content',
      tag: 'PHÂN HỆ 03',
      title: 'QUY TRÌNH BPMN TỰ ĐỘNG & CHẤM CÔNG THÔNG MINH',
      subtitle: 'Số hóa bộ máy nhân sự, kiểm soát tiến độ và chống gian lận',
      image: 'crm_12_tasks_bpmn_workflow.png',
      cards: [
        { icon: '📑', title: 'Quy Trình Công Việc BPMN', desc: 'Phân công nhiệm vụ, thiết lập hạn chót (Deadline) và hạn chế quá tải WIP ≤ 5.' },
        { icon: '📍', title: 'Chấm Công GPS & AI FaceID', desc: 'Điểm danh di động chính xác qua tọa độ văn phòng và nhận diện khuôn mặt.' },
        { icon: '👥', title: 'Giám Sát Nhân Sự Trong Ngày', desc: 'Cấp lãnh đạo nắm bắt tức thì lịch trình gặp khách hàng ngoài văn phòng.' }
      ]
    },
    // 6. Module 4
    {
      type: 'content',
      tag: 'PHÂN HỆ 04',
      title: 'QUẢN TRỊ DÒNG TIỀN & PHÊ DUYỆT CHI 3 CẤP',
      subtitle: 'Minh bạch hóa ngân sách và đối soát thanh toán tự động',
      image: 'crm_14_payment_requests_approval.png',
      cards: [
        { icon: '🛡️', title: 'Quy Trình Duyệt Chi 3 Cấp', desc: 'Người lập đề xuất → Kế toán kiểm tra chứng từ → Lãnh đạo phê duyệt chi.' },
        { icon: '💳', title: 'Chi Tiền VietQR Napas 24/7', desc: 'Quét mã QR chuyển khoản ngay lập tức, tự động gạch nợ hóa đơn trong 1 giây.' },
        { icon: '📈', title: 'Báo Cáo Thu Chi Đa Chiều', desc: 'Phân tích chi phí theo phòng ban, dự án và tự động lập báo cáo tài chính.' }
      ]
    },
    // 7. Module 5 & 6
    {
      type: 'content',
      tag: 'PHÂN HỆ 05 & 06',
      title: 'TRỢ LÝ AI COPILOT & MA TRẬN PHÂN QUYỀN RBAC',
      subtitle: 'Trí tuệ nhân tạo điều hành và bảo mật dữ liệu doanh nghiệp đa tầng',
      image: 'crm_16_ai_copilot_assistant.png',
      cards: [
        { icon: '🤖', title: 'AI Copilot Đàm Thoại 24/7', desc: 'Vấn đáp phân tích số liệu kinh doanh, soạn thảo hợp đồng và văn bản tự động.' },
        { icon: '🔐', title: 'Ma Trận Quyền 7 Nhóm x 6 Cấp', desc: 'Kiểm soát chặt chẽ quyền Xem, Tạo, Sửa, Xóa, Duyệt, Xuất dữ liệu theo chức vụ.' },
        { icon: '📋', title: 'Nhật Ký AI Audit Log', desc: 'Lưu vết minh bạch 100% các hành động trí tuệ nhân tạo và kiểm tra an ninh.' }
      ]
    },
    // 8. Closing
    {
      type: 'closing',
      tag: 'KẾT LUẬN & LIÊN HỆ',
      title: 'XIN CHÂN THÀNH CẢM ƠN QUÝ DOANH NGHIỆP!',
      subtitle: 'ViOne CRM · Nền tảng kiến tạo lợi thế cạnh tranh vượt trội trong kỷ nguyên số',
      takeaways: [
        { title: 'Tối Ưu 40% Chi Phí', desc: 'Cắt giảm lãng phí thời gian và nhân lực nhờ tự động hóa quy trình nghiệp vụ.' },
        { title: 'Tăng 35% Doanh Số', desc: 'Chăm sóc khách hàng bài bản, kiểm soát chặt chẽ phễu bán hàng B2B.' },
        { title: 'Ra Quyết Định Tức Thì', desc: 'Ban lãnh đạo nắm bắt dữ liệu điều hành chuẩn xác theo thời gian thực.' }
      ],
      contact: {
        website: 'vione.vn',
        hotline: '1900 8888',
        email: 'contact@vione.vn',
        address: 'Hà Nội & TP. Hồ Chí Minh'
      }
    }
  ]
};

// =========================================================================
// 2. DATA: BỘ SLIDE MOBILE APP VIONE CONNECT (NỀN TRẮNG CHỮ ĐEN - VÀNG ĐỒNG)
// =========================================================================
const appDeck = {
  id: 'app',
  title: 'VIONE CONNECT APP · MẠNG XÃ HỘI DOANH NHÂN & GIAO THƯƠNG B2B',
  filenameBase: 'SLIDE_APP_VIONE_CONNECT',
  theme: {
    accent: 'B48250',
    accentLight: 'FDF8F0',
    primary: '0F172A',
    secondary: '64748B',
    border: 'E2E8F0'
  },
  slides: [
    // 1. Cover
    {
      type: 'cover',
      tag: 'ỨNG DỤNG DI ĐỘNG DOANH NHÂN',
      title: 'VIONE CONNECT APP',
      subtitle: 'Mạng Xã Hội Giao Thương Doanh Nhân & Danh Thiếp Số 3D Titanium',
      desc: 'Ứng dụng di động dành riêng cho giới lãnh đạo: Kết nối đối tác 1-chạm NFC, quét danh thiếp AI OCR và săn cơ hội kinh doanh B2B.',
      meta: 'Phiên Bản Mobile Native 6.0 · Tháng 10/2026 · Bản quyền © ViOne Corporation'
    },
    // 2. Agenda
    {
      type: 'agenda',
      tag: 'TỔNG QUAN NỘI DUNG',
      title: 'CẤU TRÚC BÀI THUYẾT TRÌNH VIONE APP',
      subtitle: '6 Trải nghiệm số hóa đột phá trên thiết bị di động',
      items: [
        { num: '01', title: 'Danh Tính Số Titanium & Chạm NFC', desc: 'Thẻ doanh nhân thông minh 3D, chia sẻ liên hệ tức thì không in namecard' },
        { num: '02', title: 'Quét Danh Thiếp AI OCR Lưu Lead', desc: 'Bóc tách thông tin namecard giấy trong 2 giây, đẩy thẳng vào CRM Pipeline' },
        { num: '03', title: 'Trung Tâm Kết Nối V-Action Sheet', desc: 'Nút V hoàng gia mở bảng điều khiển 1-chạm, danh sách chăm sóc đối tác' },
        { num: '04', title: 'Sàn Giao Thương B2B & Chợ Nhu Cầu', desc: 'Đăng tin tìm nhà cung ứng, mời thầu và AI tự động ghép nối cung cầu' },
        { num: '05', title: 'Sự Kiện & Vé Điện Tử E-Ticket VIP', desc: 'Lịch sự kiện doanh nghiệp, cấp vé QR check-in điểm danh và Messenger' },
        { num: '06', title: 'Đột Phá Cài Đặt iOS WebClip', desc: 'Cài đặt trực tiếp 1-chạm lên iPhone không qua App Store, chạy Native' }
      ]
    },
    // 3. Module 1
    {
      type: 'content',
      tag: 'TÍNH NĂNG 01',
      title: 'DANH TÍNH SỐ TITANIUM & CHẠM NFC 1-CHẠM',
      subtitle: 'Nâng tầm đẳng cấp thương hiệu cá nhân của nhà lãnh đạo',
      image: 'app_09_profile_titanium_nfc.png',
      isPhone: true,
      cards: [
        { icon: '💎', title: 'Thẻ Doanh Nhân 3D Titanium', desc: 'Tích hợp mã số doanh nhân độc quyền, chíp NFC thông minh và mã QR động.' },
        { icon: '📲', title: 'Chạm NFC 1 Giây Kết Nối', desc: 'Chạm nhẹ lưng điện thoại để truyền tải toàn bộ thông tin cá nhân và doanh nghiệp.' },
        { icon: '🗄️', title: 'Ví Danh Thiếp Số (Card Vault)', desc: 'Lưu trữ danh bạ đối tác không giới hạn, đồng bộ danh bạ điện thoại vCard 1 chạm.' }
      ]
    },
    // 4. Module 2
    {
      type: 'content',
      tag: 'TÍNH NĂNG 02',
      title: 'QUÉT DANH THIẾP AI OCR & LƯU CRM PIPELINE',
      subtitle: 'Biến namecard giấy thành khách hàng tiềm năng tức thì',
      image: 'app_05_card_scan_ocr_leads.png',
      isPhone: true,
      cards: [
        { icon: '📷', title: 'Bóc Tách Dữ Liệu Tự Động', desc: 'AI nhận diện chính xác Họ tên, Chức vụ, Công ty, Số điện thoại và Email.' },
        { icon: '⭐', title: 'Phân Hạng Khách Hàng Ngay', desc: 'Gắn nhãn Hot Lead, VIP C-Level, Nổi bật, hoặc Cần chăm sóc trong 24h.' },
        { icon: '💼', title: 'Đẩy Thẳng Vào Phễu CRM', desc: 'Nhập giá trị thương vụ dự kiến, giao nhân sự phụ trách và đồng bộ về Web CRM.' }
      ]
    },
    // 5. Module 3
    {
      type: 'content',
      tag: 'TÍNH NĂNG 03',
      title: 'TRUNG TÂM V-ACTION SHEET & CHĂM SÓC ĐỐI TÁC',
      subtitle: 'Thao tác 1-chạm tiện lợi và nuôi dưỡng mạng lưới quan hệ',
      image: 'app_06_v_action_sheet.png',
      isPhone: true,
      cards: [
        { icon: '👑', title: 'Nút V Mạ Vàng Trung Tâm', desc: 'Chạm mở nhanh V-Action Sheet: Quét QR, Chạm NFC, Hẹn gặp 1-1, Đăng cơ hội.' },
        { icon: '🤝', title: 'Nurture List Nuôi Dưỡng Đối Tác', desc: 'Nhắc nhở chu kỳ tương tác định kỳ, lên lịch hẹn cà phê trao đổi kinh doanh.' },
        { icon: '📱', title: 'Popup Vuốt Tay Cong Tròn', desc: 'Bottom Sheet bo viền cong 28px mềm mại, thao tác vuốt tay xuống đóng mượt mà.' }
      ]
    },
    // 6. Module 4 & 5
    {
      type: 'content',
      tag: 'TÍNH NĂNG 04 & 05',
      title: 'SÀN GIAO THƯƠNG B2B, SỰ KIỆN & VÉ QR VIP',
      subtitle: 'Khơi thông dòng chảy cơ hội kinh doanh và kết nối cộng đồng',
      image: 'app_08_event_ticket_qr_vip.png',
      isPhone: true,
      cards: [
        { icon: '🛒', title: 'Chợ Nhu Cầu Mua - Bán B2B', desc: 'Đăng tin tìm nhà cung ứng, mời thầu; thuật toán AI tự động ghép nối đối tác phù hợp.' },
        { icon: '🎟️', title: 'Vé Điện Tử E-Ticket QR VIP', desc: 'Đăng ký sự kiện, nhận mã QR điểm danh check-in tự động tại cửa hội trường.' },
        { icon: '💬', title: 'Hộp Thư Messenger 4 Tabs', desc: 'Trao đổi đàm phán riêng tư, chat nhóm dự án thời gian thực bảo mật cao.' }
      ]
    },
    // 7. Technology
    {
      type: 'content',
      tag: 'CÔNG NGHỆ ĐỘT PHÁ',
      title: 'CÀI ĐẶT 1-CHẠM IOS (.MOBILECONFIG) & NATIVE APK',
      subtitle: 'Đơn giản hóa tuyệt đối trải nghiệm phân phối ứng dụng di động',
      image: 'app_01_mobile_login.png',
      isPhone: true,
      cards: [
        { icon: '🍎', title: 'Apple WebClip Profile 1-Chạm', desc: 'Cài đặt thẳng ra Màn hình chính iPhone từ Safari, không chờ duyệt App Store.' },
        { icon: '🚀', title: 'Trải Nghiệm Toàn Màn Hình', desc: 'Chạy độc lập Standalone, hỗ trợ sinh trắc học Face ID, tốc độ tải 60fps mượt mà.' },
        { icon: '📦', title: 'Hệ Sinh Thái Đa Nền Tảng', desc: 'Bản iOS IPA TestFlight + Android APK Release độc lập (81.39MB) + PWA Web.' }
      ]
    },
    // 8. Closing
    {
      type: 'closing',
      tag: 'KẾT LUẬN & LIÊN HỆ',
      title: 'KẾT NỐI KHÔNG GIỚI HẠN VỚI VIONE CONNECT!',
      subtitle: 'ViOne Connect · Ứng dụng đồng hành đắc lực của mọi nhà lãnh đạo doanh nghiệp',
      takeaways: [
        { title: 'Mạng Lưới Lãnh Đạo', desc: 'Tiếp cận hàng nghìn CEO, Chủ doanh nghiệp và Nhà đầu tư xác thực.' },
        { title: 'Chớp Lấy Cơ Hội B2B', desc: 'Không bỏ lỡ bất kỳ nhu cầu giao thương nào với hệ thống gợi ý AI.' },
        { title: 'Thương Hiệu Đẳng Cấp', desc: 'Khẳng định vị thế doanh nhân với danh thiếp điện tử Titanium 3D.' }
      ],
      contact: {
        website: 'vione.vn',
        hotline: '1900 8888',
        email: 'contact@vione.vn',
        address: 'Hà Nội & TP. Hồ Chí Minh'
      }
    }
  ]
};

// =========================================================================
// HÀM XUẤT BẢN HTML SLIDE HIỆN ĐẠI (NỀN TRẮNG CHỮ ĐEN - VÀNG ĐỒNG)
// =========================================================================
function generateHtmlSlide(deck, targetPath) {
  let slidesHtml = '';

  deck.slides.forEach((s, idx) => {
    let bodyContent = '';

    if (s.type === 'cover') {
      bodyContent = `
        <div class="cover-container">
          <div class="cover-tag">${s.tag}</div>
          <h1 class="cover-title">${s.title}</h1>
          <p class="cover-subtitle">${s.subtitle}</p>
          <div class="gold-divider"></div>
          <p class="cover-desc">${s.desc}</p>
          <div class="cover-meta">${s.meta}</div>
        </div>
      `;
    } else if (s.type === 'agenda') {
      const itemsHtml = s.items.map(it => `
        <div class="agenda-card">
          <div class="agenda-num">${it.num}</div>
          <div class="agenda-info">
            <h4>${it.title}</h4>
            <p>${it.desc}</p>
          </div>
        </div>
      `).join('');

      bodyContent = `
        <div class="slide-header">
          <div class="eyebrow">${s.tag}</div>
          <h2 class="title">${s.title}</h2>
          <div class="subtitle">${s.subtitle}</div>
        </div>
        <div class="agenda-grid">
          ${itemsHtml}
        </div>
      `;
    } else if (s.type === 'content') {
      const cardsHtml = s.cards.map(c => `
        <div class="feature-card">
          <div class="card-icon">${c.icon}</div>
          <div class="card-body">
            <h4 class="card-title">${c.title}</h4>
            <p class="card-desc">${c.desc}</p>
          </div>
        </div>
      `).join('');

      const imgClass = s.isPhone ? 'phone-mockup-frame' : 'desktop-mockup-frame';

      bodyContent = `
        <div class="slide-header">
          <div class="eyebrow">${s.tag}</div>
          <h2 class="title">${s.title}</h2>
          <div class="subtitle">${s.subtitle}</div>
        </div>
        <div class="content-split">
          <div class="cards-column">
            ${cardsHtml}
          </div>
          <div class="image-column">
            <div class="${imgClass}">
              <img src="images/evidence_live_2026/${s.image}" alt="${s.title}" />
            </div>
            <div class="image-caption">Dữ liệu thời gian thực từ máy chủ ViOne Live</div>
          </div>
        </div>
      `;
    } else if (s.type === 'closing') {
      const takeawaysHtml = s.takeaways.map((t, i) => `
        <div class="takeaway-card">
          <div class="takeaway-num">0${i + 1}</div>
          <h4>${t.title}</h4>
          <p>${t.desc}</p>
        </div>
      `).join('');

      bodyContent = `
        <div class="closing-container">
          <div class="eyebrow">${s.tag}</div>
          <h2 class="closing-title">${s.title}</h2>
          <p class="closing-subtitle">${s.subtitle}</p>
          <div class="takeaways-grid">
            ${takeawaysHtml}
          </div>
          <div class="contact-box">
            <div class="contact-item"><strong>🌐 Website:</strong> ${s.contact.website}</div>
            <div class="contact-item"><strong>📞 Hotline:</strong> ${s.contact.hotline}</div>
            <div class="contact-item"><strong>✉️ Email:</strong> ${s.contact.email}</div>
            <div class="contact-item"><strong>🏢 Trụ sở:</strong> ${s.contact.address}</div>
          </div>
          <div class="closing-qa">SẴN SÀNG GIẢI ĐÁP CÂU HỎI (Q&A SESSION)</div>
        </div>
      `;
    }

    slidesHtml += `
      <section class="slide" id="slide-${idx + 1}">
        ${bodyContent}
        <div class="slide-footer">
          <span>${deck.title} · Trang ${idx + 1} / ${deck.slides.length}</span>
          <span>Bản quyền © 2026 ViOne Corporation</span>
        </div>
      </section>
    `;
  });

  const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${deck.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #F1F5F9;
      color: #0F172A;
      font-family: 'Plus Jakarta Sans', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 30px 20px;
    }
    
    .nav-bar {
      width: 100%;
      max-width: 1240px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      background: #FFFFFF;
      padding: 16px 24px;
      border-radius: 16px;
      border: 1px solid #E2E8F0;
      box-shadow: 0 4px 15px rgba(0,0,0,0.03);
    }
    .brand {
      font-family: 'Outfit', sans-serif;
      font-size: 18px;
      font-weight: 800;
      color: #94632B;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-badge {
      background: #FAF5EB;
      color: #94632B;
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 20px;
      border: 1px solid rgba(216,178,130,0.4);
      font-weight: 700;
    }
    .slide-deck {
      width: 100%;
      max-width: 1240px;
      display: flex;
      flex-direction: column;
      gap: 35px;
    }
    
    /* SLIDE BASE */
    .slide {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 20px;
      padding: 40px 48px;
      aspect-ratio: 16 / 9;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 10px 30px rgba(0,0,0,0.04);
      position: relative;
      overflow: hidden;
      page-break-after: always;
    }
    .slide::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 5px;
      background: linear-gradient(90deg, #B48250 0%, #DFB76C 50%, #94632B 100%);
    }
    
    /* HEADER */
    .eyebrow {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.5px;
      color: #94632B;
      text-transform: uppercase;
      background: #FDF8F0;
      border: 1px solid rgba(216, 178, 130, 0.4);
      padding: 4px 12px;
      border-radius: 12px;
      margin-bottom: 8px;
    }
    .title {
      font-family: 'Outfit', sans-serif;
      font-size: 26px;
      font-weight: 800;
      color: #0F172A;
      line-height: 1.25;
      margin-bottom: 4px;
    }
    .subtitle {
      font-size: 14px;
      color: #64748B;
      font-weight: 500;
    }
    
    /* COVER */
    .cover-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 20px;
    }
    .cover-tag {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #94632B;
      background: #FDF8F0;
      border: 1px solid rgba(216, 178, 130, 0.4);
      padding: 6px 18px;
      border-radius: 30px;
      margin-bottom: 18px;
    }
    .cover-title {
      font-family: 'Outfit', sans-serif;
      font-size: 42px;
      font-weight: 900;
      color: #0F172A;
      letter-spacing: -0.5px;
      margin-bottom: 12px;
    }
    .cover-subtitle {
      font-size: 20px;
      font-weight: 600;
      color: #94632B;
      margin-bottom: 20px;
    }
    .gold-divider {
      width: 80px;
      height: 4px;
      background: linear-gradient(90deg, #DFB76C, #94632B);
      border-radius: 2px;
      margin-bottom: 22px;
    }
    .cover-desc {
      font-size: 15px;
      color: #475569;
      max-width: 780px;
      line-height: 1.6;
      margin-bottom: 25px;
    }
    .cover-meta {
      font-size: 13px;
      color: #94A3B8;
      font-weight: 500;
    }
    
    /* AGENDA */
    .agenda-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin: 20px 0;
    }
    .agenda-card {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 16px 20px;
      transition: all 0.2s ease;
    }
    .agenda-card:hover {
      border-color: #D8B282;
      background: #FDFBF7;
    }
    .agenda-num {
      font-family: 'Outfit', sans-serif;
      font-size: 20px;
      font-weight: 800;
      color: #94632B;
      background: #FAF5EB;
      border: 1px solid rgba(216, 178, 130, 0.4);
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .agenda-info h4 {
      font-size: 15px;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 4px;
    }
    .agenda-info p {
      font-size: 13px;
      color: #64748B;
      line-height: 1.45;
    }
    
    /* CONTENT SPLIT */
    .content-split {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 28px;
      align-items: center;
      margin: 15px 0;
      flex: 1;
    }
    .cards-column {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .feature-card {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-left: 4px solid #B48250;
      border-radius: 12px;
      padding: 15px 18px;
    }
    .card-icon {
      font-size: 22px;
      line-height: 1;
      padding-top: 2px;
      flex-shrink: 0;
    }
    .card-title {
      font-size: 15px;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 4px;
    }
    .card-desc {
      font-size: 13px;
      color: #475569;
      line-height: 1.5;
    }
    
    .image-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .desktop-mockup-frame {
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #CBD5E1;
      box-shadow: 0 10px 25px rgba(0,0,0,0.08);
      background: #FFFFFF;
    }
    .desktop-mockup-frame img {
      width: 100%;
      height: auto;
      display: block;
      object-fit: cover;
    }
    .phone-mockup-frame {
      width: 220px;
      border-radius: 28px;
      overflow: hidden;
      border: 6px solid #1E293B;
      box-shadow: 0 15px 35px rgba(0,0,0,0.12);
      background: #000000;
    }
    .phone-mockup-frame img {
      width: 100%;
      height: auto;
      display: block;
    }
    .image-caption {
      margin-top: 8px;
      font-size: 11px;
      color: #94A3B8;
      font-style: italic;
    }
    
    /* CLOSING */
    .closing-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 10px;
    }
    .closing-title {
      font-family: 'Outfit', sans-serif;
      font-size: 34px;
      font-weight: 900;
      color: #0F172A;
      margin-bottom: 6px;
    }
    .closing-subtitle {
      font-size: 16px;
      color: #94632B;
      font-weight: 600;
      margin-bottom: 24px;
    }
    .takeaways-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      width: 100%;
      margin-bottom: 24px;
    }
    .takeaway-card {
      background: #FDFBF7;
      border: 1px solid rgba(216, 178, 130, 0.4);
      border-radius: 14px;
      padding: 16px 18px;
      text-align: left;
    }
    .takeaway-num {
      font-family: 'Outfit', sans-serif;
      font-size: 16px;
      font-weight: 800;
      color: #94632B;
      margin-bottom: 4px;
    }
    .takeaway-card h4 {
      font-size: 15px;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 6px;
    }
    .takeaway-card p {
      font-size: 12.5px;
      color: #475569;
      line-height: 1.45;
    }
    .contact-box {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      justify-content: center;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 12px 24px;
      font-size: 13px;
      color: #334155;
      margin-bottom: 16px;
    }
    .closing-qa {
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #94632B;
      background: #FAF5EB;
      padding: 6px 18px;
      border-radius: 20px;
    }
    
    /* FOOTER */
    .slide-footer {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #E2E8F0;
      padding-top: 14px;
      font-size: 11px;
      color: #94A3B8;
      font-weight: 500;
    }
    
    @media print {
      body { background: transparent; padding: 0; }
      .nav-bar { display: none; }
      .slide-deck { gap: 0; }
      .slide { border-radius: 0; box-shadow: none; aspect-ratio: auto; height: 100vh; }
    }
  </style>
</head>
<body>
  <div class="nav-bar">
    <div class="brand">
      <span>VIONE CORPORATION</span>
      <span class="brand-badge">${deck.title}</span>
    </div>
    <div style="font-size: 13px; color: #64748B; font-weight: 600;">Phiên bản: 10/2026 · Chuẩn Widescreen 16:9</div>
  </div>
  <div class="slide-deck">
    ${slidesHtml}
  </div>
</body>
</html>`;

  fs.writeFileSync(targetPath, fullHtml, 'utf8');
  console.log(`  -> Da xuat ban file HTML: ${path.basename(targetPath)}`);
}

// =========================================================================
// HÀM XUẤT BẢN POWERPOINT (.PPTX) CHUẨN 16:9 NỀN TRẮNG CHỮ ĐEN VÀNG ĐỒNG
// =========================================================================
async function generatePptxSlide(deck, targetPath) {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'ViOne Solution Architect';
  pptx.company = 'ViOne Corporation';
  pptx.title = deck.title;

  deck.slides.forEach((s, idx) => {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };

    // Vạch vàng đồng trên đỉnh
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: '100%', h: 0.08,
      fill: { color: 'B48250' },
      line: { color: 'B48250', width: 0 }
    });

    if (s.type === 'cover') {
      // Cover Tag
      slide.addText(s.tag, {
        x: 1.0, y: 1.2, w: 11.3, h: 0.35,
        fontFace: 'Arial', fontSize: 11, bold: true, color: '94632B',
        align: 'center', letterSpacing: 2
      });

      // Cover Title
      slide.addText(s.title, {
        x: 1.0, y: 1.7, w: 11.3, h: 1.0,
        fontFace: 'Arial', fontSize: 32, bold: true, color: '0F172A',
        align: 'center'
      });

      // Subtitle
      slide.addText(s.subtitle, {
        x: 1.0, y: 2.8, w: 11.3, h: 0.5,
        fontFace: 'Arial', fontSize: 16, bold: true, color: '94632B',
        align: 'center'
      });

      // Gold line
      slide.addShape(pptx.ShapeType.rect, {
        x: 5.8, y: 3.45, w: 1.7, h: 0.04,
        fill: { color: 'B48250' },
        line: { color: 'B48250', width: 0 }
      });

      // Desc
      slide.addText(s.desc, {
        x: 1.5, y: 3.8, w: 10.3, h: 0.9,
        fontFace: 'Arial', fontSize: 14, color: '475569',
        align: 'center', lineSpacing: 22
      });

      // Meta
      slide.addText(s.meta, {
        x: 1.0, y: 5.6, w: 11.3, h: 0.4,
        fontFace: 'Arial', fontSize: 11, color: '94A3B8',
        align: 'center'
      });

    } else if (s.type === 'agenda') {
      // Eyebrow
      slide.addText(s.tag, {
        x: 0.8, y: 0.4, w: 5.0, h: 0.3,
        fontFace: 'Arial', fontSize: 10, bold: true, color: '94632B'
      });
      // Title
      slide.addText(s.title, {
        x: 0.8, y: 0.75, w: 11.5, h: 0.6,
        fontFace: 'Arial', fontSize: 22, bold: true, color: '0F172A'
      });
      // Subtitle
      slide.addText(s.subtitle, {
        x: 0.8, y: 1.35, w: 11.5, h: 0.35,
        fontFace: 'Arial', fontSize: 12, italic: true, color: '64748B'
      });

      // 6 Agenda items in 2 columns x 3 rows
      s.items.forEach((it, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const xPos = 0.8 + col * 5.9;
        const yPos = 1.9 + row * 1.5;

        // Card bg
        slide.addShape(pptx.ShapeType.rect, {
          x: xPos, y: yPos, w: 5.6, h: 1.3,
          fill: { color: 'F8FAFC' },
          line: { color: 'E2E8F0', width: 1 },
          roundRadius: 0.1
        });

        // Number Badge
        slide.addShape(pptx.ShapeType.rect, {
          x: xPos + 0.2, y: yPos + 0.25, w: 0.8, h: 0.8,
          fill: { color: 'FAF5EB' },
          line: { color: 'D8B282', width: 1 },
          roundRadius: 0.1
        });
        slide.addText(it.num, {
          x: xPos + 0.2, y: yPos + 0.25, w: 0.8, h: 0.8,
          fontFace: 'Arial', fontSize: 14, bold: true, color: '94632B',
          align: 'center', valign: 'middle'
        });

        // Content
        slide.addText(it.title, {
          x: xPos + 1.2, y: yPos + 0.22, w: 4.2, h: 0.35,
          fontFace: 'Arial', fontSize: 13, bold: true, color: '0F172A'
        });
        slide.addText(it.desc, {
          x: xPos + 1.2, y: yPos + 0.58, w: 4.2, h: 0.6,
          fontFace: 'Arial', fontSize: 11, color: '64748B',
          lineSpacing: 16
        });
      });

    } else if (s.type === 'content') {
      // Eyebrow
      slide.addText(s.tag, {
        x: 0.8, y: 0.35, w: 5.0, h: 0.25,
        fontFace: 'Arial', fontSize: 10, bold: true, color: '94632B'
      });
      // Title
      slide.addText(s.title, {
        x: 0.8, y: 0.65, w: 11.5, h: 0.55,
        fontFace: 'Arial', fontSize: 20, bold: true, color: '0F172A'
      });
      // Subtitle
      slide.addText(s.subtitle, {
        x: 0.8, y: 1.2, w: 11.5, h: 0.35,
        fontFace: 'Arial', fontSize: 12, italic: true, color: '64748B'
      });

      // 3 Cards Column (Left)
      s.cards.forEach((c, i) => {
        const yPos = 1.75 + i * 1.55;

        // Card container
        slide.addShape(pptx.ShapeType.rect, {
          x: 0.8, y: yPos, w: 6.8, h: 1.4,
          fill: { color: 'F8FAFC' },
          line: { color: 'E2E8F0', width: 1 },
          roundRadius: 0.08
        });

        // Left gold border indicator
        slide.addShape(pptx.ShapeType.rect, {
          x: 0.8, y: yPos, w: 0.08, h: 1.4,
          fill: { color: 'B48250' },
          line: { color: 'B48250', width: 0 }
        });

        // Card Title
        slide.addText(`${c.icon}  ${c.title}`, {
          x: 1.05, y: yPos + 0.15, w: 6.3, h: 0.35,
          fontFace: 'Arial', fontSize: 13, bold: true, color: '0F172A'
        });

        // Card Desc
        slide.addText(c.desc, {
          x: 1.05, y: yPos + 0.52, w: 6.3, h: 0.75,
          fontFace: 'Arial', fontSize: 11.5, color: '475569',
          lineSpacing: 18
        });
      });

      // Image Column (Right)
      const imgPath = path.join(imagesDir, s.image);
      if (fs.existsSync(imgPath)) {
        if (s.isPhone) {
          // Phone frame
          slide.addShape(pptx.ShapeType.rect, {
            x: 8.5, y: 1.7, w: 3.5, h: 4.8,
            fill: { color: 'FFFFFF' },
            line: { color: 'CBD5E1', width: 1 },
            roundRadius: 0.1
          });
          slide.addImage({
            path: imgPath,
            x: 8.85, y: 1.85, w: 2.8, h: 4.5,
            sizing: { type: 'contain' }
          });
        } else {
          // Desktop frame
          slide.addShape(pptx.ShapeType.rect, {
            x: 8.0, y: 1.9, w: 4.5, h: 3.6,
            fill: { color: 'FFFFFF' },
            line: { color: 'CBD5E1', width: 1 },
            roundRadius: 0.1
          });
          slide.addImage({
            path: imgPath,
            x: 8.05, y: 1.95, w: 4.4, h: 3.5,
            sizing: { type: 'contain' }
          });
        }
      }

      // Caption
      slide.addText('Dữ liệu thời gian thực từ máy chủ ViOne Live', {
        x: 8.0, y: 5.75, w: 4.5, h: 0.3,
        fontFace: 'Arial', fontSize: 9.5, italic: true, color: '94A3B8',
        align: 'center'
      });

    } else if (s.type === 'closing') {
      // Closing Title
      slide.addText(s.title, {
        x: 1.0, y: 1.0, w: 11.3, h: 0.8,
        fontFace: 'Arial', fontSize: 26, bold: true, color: '0F172A',
        align: 'center'
      });
      // Subtitle
      slide.addText(s.subtitle, {
        x: 1.0, y: 1.8, w: 11.3, h: 0.4,
        fontFace: 'Arial', fontSize: 14, bold: true, color: '94632B',
        align: 'center'
      });

      // 3 Takeaways Cards
      s.takeaways.forEach((t, i) => {
        const xPos = 0.8 + i * 4.0;
        slide.addShape(pptx.ShapeType.rect, {
          x: xPos, y: 2.5, w: 3.7, h: 1.8,
          fill: { color: 'FDFBF7' },
          line: { color: 'D8B282', width: 1 },
          roundRadius: 0.1
        });
        slide.addText(`0${i + 1}`, {
          x: xPos + 0.25, y: 2.7, w: 3.2, h: 0.3,
          fontFace: 'Arial', fontSize: 13, bold: true, color: '94632B'
        });
        slide.addText(t.title, {
          x: xPos + 0.25, y: 3.05, w: 3.2, h: 0.35,
          fontFace: 'Arial', fontSize: 13, bold: true, color: '0F172A'
        });
        slide.addText(t.desc, {
          x: xPos + 0.25, y: 3.42, w: 3.2, h: 0.75,
          fontFace: 'Arial', fontSize: 11, color: '475569',
          lineSpacing: 16
        });
      });

      // Contact bar
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.8, y: 4.7, w: 11.7, h: 0.8,
        fill: { color: 'F8FAFC' },
        line: { color: 'E2E8F0', width: 1 },
        roundRadius: 0.08
      });
      slide.addText(`🌐 Website: ${s.contact.website}    |    📞 Hotline: ${s.contact.hotline}    |    ✉️ Email: ${s.contact.email}    |    🏢 Trụ sở: ${s.contact.address}`, {
        x: 0.8, y: 4.7, w: 11.7, h: 0.8,
        fontFace: 'Arial', fontSize: 11.5, color: '334155',
        align: 'center', valign: 'middle'
      });

      // Q&A badge
      slide.addText('SẴN SÀNG GIẢI ĐÁP CÂU HỎI (Q&A SESSION)', {
        x: 3.5, y: 5.75, w: 6.3, h: 0.45,
        fontFace: 'Arial', fontSize: 12, bold: true, color: '94632B',
        align: 'center', letterSpacing: 1.5
      });
    }

    // Footer
    slide.addShape(pptx.ShapeType.line, {
      x: 0.8, y: 6.8, w: 11.7, h: 0,
      line: { color: 'E2E8F0', width: 1 }
    });
    slide.addText(`${deck.title} · Trang ${idx + 1} / ${deck.slides.length}`, {
      x: 0.8, y: 6.9, w: 6.0, h: 0.3,
      fontFace: 'Arial', fontSize: 9.5, color: '94A3B8'
    });
    slide.addText('Bản quyền © 2026 ViOne Corporation', {
      x: 7.0, y: 6.9, w: 5.5, h: 0.3,
      fontFace: 'Arial', fontSize: 9.5, align: 'right', color: '94A3B8'
    });
  });

  await pptx.writeFile({ fileName: targetPath });
  console.log(`  -> Da xuat ban file PPTX: ${path.basename(targetPath)}`);
}

// =========================================================================
// 3. THỰC THI BIÊN DỊCH CẢ 2 BỘ SLIDE RIÊNG + BỘ TỔNG HỢP
// =========================================================================
async function buildAll() {
  // 1. Bộ Slide riêng Web CRM
  const crmHtmlPath = path.join(docDir, 'SLIDE_WEB_CRM_VIONE.html');
  const crmPptxPath = path.join(docDir, 'SLIDE_WEB_CRM_VIONE.pptx');
  generateHtmlSlide(crmDeck, crmHtmlPath);
  await generatePptxSlide(crmDeck, crmPptxPath);

  // 2. Bộ Slide riêng Mobile App
  const appHtmlPath = path.join(docDir, 'SLIDE_APP_VIONE_CONNECT.html');
  const appPptxPath = path.join(docDir, 'SLIDE_APP_VIONE_CONNECT.pptx');
  generateHtmlSlide(appDeck, appHtmlPath);
  await generatePptxSlide(appDeck, appPptxPath);

  // 3. Bộ Slide Tổng Thể Hệ Sinh Thái (Hợp nhất có Section phân định)
  const masterDeck = {
    id: 'master',
    title: 'HỆ SINH THÁI DOANH NGHIỆP TOÀN DIỆN VIONE & VIONE CONNECT APP',
    filenameBase: 'SLIDE_THUYET_TRINH_HE_SINH_THAI_VIONE_TOAN_DIEN',
    theme: crmDeck.theme,
    slides: [
      crmDeck.slides[0], // Cover Master
      {
        type: 'agenda',
        tag: 'TỔNG QUAN CHIẾN LƯỢC',
        title: 'HAI TRỤ CỘT CHUYỂN ĐỔI SỐ LIỀN MẠCH DOANH NGHIỆP',
        subtitle: 'Cấu trúc bài thuyết trình hệ sinh thái ViOne',
        items: [
          { num: 'PHẦN I', title: 'ViOne CRM Platform (Web)', desc: 'Bảng điều hành 360°, Quản trị kinh doanh, Vận hành BPMN, Dòng tiền & AI Copilot' },
          { num: 'PHẦN II', title: 'ViOne Connect App (Mobile)', desc: 'Danh thiếp số Titanium, Chạm NFC, Quét card AI OCR, Sàn B2B & Vé QR' },
          { num: 'PHẦN III', title: 'Đột Phá Cài Đặt iOS WebClip', desc: 'Cài đặt trực tiếp 1-chạm không thông qua App Store, chuẩn Standalone Native' },
          { num: 'PHẦN IV', title: 'Giá Trị Doanh Nghiệp & Liên Hệ', desc: 'Cam kết tối ưu chi phí, tăng tốc doanh số và thông tin hỗ trợ triển khai' }
        ]
      },
      // 5 Slides CRM
      crmDeck.slides[2],
      crmDeck.slides[3],
      crmDeck.slides[4],
      crmDeck.slides[5],
      crmDeck.slides[6],
      // 4 Slides Mobile App
      appDeck.slides[2],
      appDeck.slides[3],
      appDeck.slides[4],
      appDeck.slides[5],
      appDeck.slides[6],
      // Closing
      crmDeck.slides[7]
    ]
  };

  const masterHtmlPath = path.join(docDir, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_VIONE_TOAN_DIEN.html');
  const masterPptxPath = path.join(docDir, 'SLIDE_THUYET_TRINH_HE_SINH_THAI_VIONE_TOAN_DIEN.pptx');
  generateHtmlSlide(masterDeck, masterHtmlPath);
  await generatePptxSlide(masterDeck, masterPptxPath);

  // Copy tất cả sang public/docs/ để xem trực tiếp
  const filesToSync = [
    'SLIDE_WEB_CRM_VIONE.html', 'SLIDE_WEB_CRM_VIONE.pptx',
    'SLIDE_APP_VIONE_CONNECT.html', 'SLIDE_APP_VIONE_CONNECT.pptx',
    'SLIDE_THUYET_TRINH_HE_SINH_THAI_VIONE_TOAN_DIEN.html', 'SLIDE_THUYET_TRINH_HE_SINH_THAI_VIONE_TOAN_DIEN.pptx'
  ];

  filesToSync.forEach(f => {
    fs.copyFileSync(path.join(docDir, f), path.join(publicDocsDir, f));
  });

  console.log('>>> [SLIDES VIONE 2026] DA XUAT BAN VA DONG BO 100% THANH CONG!');
}

buildAll().catch(err => {
  console.error('Loi khi tao slide:', err);
  process.exit(1);
});
