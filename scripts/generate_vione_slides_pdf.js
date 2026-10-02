const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const EVIDENCE_DIR = path.join(__dirname, '../document/images/evidence');

function getBase64Img(filename) {
  const filePath = path.join(EVIDENCE_DIR, filename);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    return `data:image/png;base64,${data.toString('base64')}`;
  }
  return '';
}

async function generateSlidesPdf() {
  console.log('=== GENERATING VIONE SLIDE PRESENTATION (WHITE BG, RICH BLACK TEXT, FRAMED IMAGES IN PDF) ===');

  const slides = [
    {
      title: 'HỆ SINH THÁI QUẢN TRỊ DOANH NGHIỆP VIONE ENTERPRISE & APP VIONE CONNECT',
      subtitle: 'Báo Cáo Nghiệm Thu Tổng Thể Kiến Trúc Kỹ Thuật, 500+ Chức Năng Nghiệp Vụ & Đóng Gói Release APK',
      bullets: [
        'Hệ thống điều hành C-Level toàn diện: Kết nối mạng lưới đối tác & Giám sát vận hành nhân sự.',
        'Đồng bộ 100% thiết kế giữa Web CRM và App Mobile (Ngôn ngữ Dark Luxury Obsidian & Bronze Gold).',
        'Cơ sở dữ liệu Multi-Tenant chuẩn hóa 163 bảng Prisma ORM, bảo mật cấp doanh nghiệp.',
        'Đã kiểm thử thực tế trên server dev live: 725 Test Cases Pass 100%, TypeScript 0 lỗi.'
      ],
      image: 'vione_crm_02_dashboard_kpi.png',
      caption: 'Ảnh thực tế: Trung tâm Điều hành C-Level Dashboard Web CRM ViOne'
    },
    {
      title: 'TẦM NHÌN CHIẾN LƯỢC: GIẢI BÀI TOÁN QUẢN TRỊ TOÀN DIỆN CỦA CEO',
      subtitle: 'Không Chỉ Để Kết Nối Mạng Lưới Mà Còn Nhìn Thấy Toàn Bộ Quy Trình & Theo Dõi Tải Nhân Viên',
      bullets: [
        'Vấn đề cũ: Lãnh đạo bị mù mờ về tiến độ thực tế của nhân viên, quy trình đứt gãy, chi tiêu mất kiểm soát.',
        'Giải pháp ViOne: Tích hợp liền mạch BPMN 2.0, Workload Heatmap, Chấm công GPS/FaceID và Phê duyệt chi 3 cấp.',
        'Minh bạch hóa dòng tiền: Tích hợp Napas VietQR 24/7 gạch nợ tức thời 1 giây, khử trùng số hóa đơn.',
        'Ứng dụng di động C-Level: Lãnh đạo nắm trọn tình hình doanh nghiệp ngay trong lòng bàn tay.'
      ],
      image: 'vione_app_02_executive_home.png',
      caption: 'Ảnh thực tế: Trang chủ Điều hành Executive Home trên App ViOne Connect Mobile'
    },
    {
      title: 'KIẾN TRÚC KỸ THUẬT & CƠ SỞ DỮ LIỆU ĐA DOANH NGHIỆP MULTI-TENANT',
      subtitle: 'Monorepo Turborepo, NestJS Backend, TanStack Start & React Native Expo SDK 52',
      bullets: [
        'Cơ sở dữ liệu 163 bảng: Phân lập dữ liệu hoàn toàn bằng khóa tenant_id và chính sách Row Level Security (RLS).',
        'Backend NestJS: Cung cấp hơn 120 RESTful APIs chuẩn quốc tế, xử lý nghiệp vụ với độ trễ p95 < 200ms.',
        'Frontend Web CRM: TanStack Start SSR kết hợp React 19, tối ưu hóa hiển thị biểu đồ Kanban và Gantt.',
        'Mobile App Native: Expo SDK 52 với Hermes Bytecode tĩnh, chạy offline mượt mà không cần metro server.'
      ],
      image: 'vione_crm_05_companies_multi_tenant.png',
      caption: 'Ảnh thực tế: Phân hệ Quản trị Đa Doanh Nghiệp (Multi-Tenant) cô lập an toàn từng pháp nhân'
    },
    {
      title: 'WEB CRM: TRUNG TÂM ĐIỀU HÀNH C-LEVEL & PHÂN TÍCH TÀI CHÍNH',
      subtitle: 'Trực Quan Hóa Tức Thời KPI Doanh Thu, Tỷ Lệ Tăng Trưởng & Phễu Giao Thương B2B',
      bullets: [
        'Theo dõi doanh thu thực thu, công nợ và số dư tiền mặt theo thời gian thực.',
        'Bảng thống kê số lượng thành viên doanh nghiệp & đối tác, đối tác VIP và tỷ lệ kết nối thành công.',
        'Biểu đồ tiến độ thực hiện quy trình toàn công ty và cảnh báo các nút thắt cổ chai.',
        'Hỗ trợ lọc dữ liệu theo từng chi nhánh, phòng ban hoặc chu kỳ kinh doanh linh hoạt.'
      ],
      image: 'vione_crm_02_dashboard_kpi.png',
      caption: 'Ảnh thực tế: Dashboard KPI Tổng quan Điều hành C-Level trên Web CRM'
    },
    {
      title: 'WEB CRM: QUẢN LÝ thành viên doanh nghiệp & đối tác & ĐỐI TÁC B2B',
      subtitle: 'Danh Bạ Lãnh Đạo Doanh Nghiệp, Drawer Chi Tiết Pháp Nhân & Phân Quyền RBAC',
      bullets: [
        'Tìm kiếm thông minh theo Tên, Công ty, Mã số thuế, Ngành nghề hoặc Chức vụ.',
        'Drawer trượt chi tiết hiển thị toàn diện năng lực doanh nghiệp và thông tin pháp lý.',
        'Cơ chế phê duyệt thành viên doanh nghiệp 1-chạm và cấp tài khoản tự động gửi qua email.',
        'Gán vai trò phân quyền 6 cấp (Super Admin, CEO, Manager, Lead, Staff, Accountant).'
      ],
      image: 'vione_crm_03_members_directory.png',
      caption: 'Ảnh thực tế: Danh bạ thành viên doanh nghiệp & đối tác & Đối tác B2B kèm bộ lọc ngành nghề'
    },
    {
      title: 'WEB CRM: SÀN CƠ HỘI GIAO THƯƠNG B2B & SỰ KIỆN KẾT NỐI',
      subtitle: 'Phễu Cơ Hội Chuyển Đổi Hợp Đồng & Thiết Lập Sơ Đồ Chỗ Ngồi Cinema Seating',
      bullets: [
        'Sàn giao dịch B2B: Đăng nhu cầu mua/bán, phân loại theo phễu Lead -> Deal -> Closed.',
        'Thuật toán AI Matchmaking tự động đề xuất 3 đối tác cung ứng phù hợp nhất.',
        'Quản lý sự kiện doanh nhân: Thiết lập hội thảo, gala, phân hạng vé VIP và vé tiêu chuẩn.',
        'Sơ đồ chỗ ngồi rạp chiếu (Cinema Map) trực quan và hệ thống phát hành mã vé QR tại cổng.'
      ],
      image: 'vione_crm_06_opportunities_b2b.png',
      caption: 'Ảnh thực tế: Sàn Cơ hội Giao thương B2B và phễu quản trị tiến độ giao dịch'
    },
    {
      title: 'WEB CRM: QUY TRÌNH BPMN 2.0 & CHẶN HOÀN THÀNH KHI CHECKLIST < 100%',
      subtitle: 'Quy Chuẩn BR-WRK-07: Nghiêm Cấm Kéo Thẻ Done Nếu Chưa Đủ 100% Tiêu Chí Nghiệm Thu',
      bullets: [
        'Bảng Kanban trực quan: Cần làm (To Do) -> Đang làm (In Progress) -> Đang duyệt (Review) -> Hoàn thành (Done).',
        'Giới hạn WIP <= 5: Mỗi nhân sự không được nhận quá 5 việc đang làm đồng thời để tránh tắc nghẽn.',
        'Cảnh báo đỏ phát sáng (BR-WRK-02): Tự động đổi màu viền phát sáng khi công việc bị quá hạn SLA.',
        'Kiểm soát checklist nghiêm ngặt: Nút Done tự động khóa nếu checklist nghiệm thu chưa tích đủ 100%.'
      ],
      image: 'vione_crm_10_workflow_bpmn.png',
      caption: 'Ảnh thực tế: Bảng Kanban BPMN 2.0 kiểm soát tiến độ và điều kiện nghiệm thu checklist'
    },
    {
      title: 'WEB CRM: WORKLOAD HEATMAP - GIÁM SÁT TẢI & CẢNH BÁO QUÁ TẢI >45H',
      subtitle: 'Quy Chuẩn BR-WRK-14: Ô Đỏ Cảnh Báo Khi Nhân Viên Làm Quá 45 Giờ/Tuần',
      bullets: [
        'Ma trận màu nhiệt Heatmap trực quan hiển thị số giờ làm việc trong tuần của từng nhân sự.',
        'Phân tầng tải công việc: Xanh lá (tối ưu 35-40h), Vàng (tải cao 40-45h), Đỏ phát sáng (> 45h/tuần).',
        'Tự động phát hiện nguy cơ kiệt sức của nhân viên chủ chốt hoặc tình trạng nhàn rỗi ở các phòng ban.',
        'Tính năng gợi ý cân bằng tải thông minh: Đề xuất chuyển bớt đầu việc sang nhân sự < 30h/tuần.'
      ],
      image: 'vione_crm_11_workload_matrix.png',
      caption: 'Ảnh thực tế: Ma trận Workload Heatmap theo dõi giờ làm tuần của từng nhân viên'
    },
    {
      title: 'WEB CRM: CHẤM CÔNG GPS BÁN KÍNH <=50M & AI FACEID LIVENESS >=92%',
      subtitle: 'Quy Chuẩn BR-HRM-01 & 02: Chặn Gian Lận Chấm Công & Tự Động Khóa Công Ngày 02',
      bullets: [
        'Định vị vệ tinh GPS bán kính <= 50m: Chỉ cho phép check-in khi thực sự có mặt tại trụ sở/văn phòng.',
        'Nhận diện khuôn mặt AI FaceID: Đạt độ tin cậy và kiểm tra thực thể sống (liveness) từ 92% trở lên.',
        'Bảng công thời gian thực: Ghi nhận chính xác từng giây, lưu kèm ảnh chụp xác thực và tọa độ GPS.',
        'Khóa công tự động vào 23:59 ngày 02 hàng tháng (BR-HRM-14), loại bỏ hoàn toàn việc sửa công tùy tiện.'
      ],
      image: 'vione_crm_12_attendance_gps_faceid.png',
      caption: 'Ảnh thực tế: Bảng công Giám sát Chấm công GPS bán kính 50m và AI FaceID thời gian thực'
    },
    {
      title: 'WEB CRM: PHÊ DUYỆT CHI 3 CẤP MAKER-CHECKER-APPROVER & VIETQR 24/7',
      subtitle: 'Quy Chuẩn BR-FIN-01 & 02: Hạn Mức CEO > 20M & Tự Động Gạch Nợ 1 Giây',
      bullets: [
        'Luồng phê duyệt 3 cấp chuẩn mực: Nhân viên tạo đề xuất (Maker) -> Kế toán trưởng thẩm định (Checker) -> CEO duyệt (Approver).',
        'Phân quyền tự động: Khoản chi từ 20 triệu VNĐ trở lên bắt buộc phải có chữ ký số của Tổng Giám Đốc.',
        'Thanh toán VietQR Napas 24/7: Tự động xuất mã QR thanh toán động, tự động gạch nợ trong vòng 1 giây.',
        'Khử trùng số hóa đơn (BR-FIN-07): Kiểm tra hóa đơn điện tử chống thanh toán trùng lặp tuyệt đối.'
      ],
      image: 'vione_crm_13_payment_approvals_3tier.png',
      caption: 'Ảnh thực tế: Bảng Quản trị Luồng Phê duyệt Chi tiêu 3 cấp và tích hợp Napas VietQR 24/7'
    },
    {
      title: 'APP VIONE CONNECT: ĐĂNG NHẬP DARK LUXURY OBSIDIAN & BRONZE GOLD',
      subtitle: 'Thiết Kế Thượng Lưu Khớp Chuẩn 100% Giữa Phiên Bản React Native Native Và PWA',
      bullets: [
        'Tông màu chủ đạo: Nền đen tuyền Obsidian (#0A0A0B), viền và chi tiết mạ vàng đồng Bronze Gold (#D8B282).',
        'Ảnh nền nghệ thuật connect-auth-bg.jpg phủ vignette mờ tối sang trọng cùng logo vương miện hoàng gia.',
        'Đăng nhập đa kênh thuận tiện: Tài khoản doanh nhân, Google OAuth, Apple ID và Chạm thẻ NFC 1-chạm.',
        'Bộ chuyển đổi ngôn ngữ con nhộng VI/EN đặt ở góc trên, tối ưu hóa trải nghiệm lãnh đạo quốc tế.'
      ],
      image: 'vione_app_01_login_luxury.png',
      caption: 'Ảnh thực tế: Màn hình Đăng nhập App ViOne Connect chuẩn Dark Luxury Obsidian & Gold'
    },
    {
      title: 'APP VIONE CONNECT: EXECUTIVE HOME & THẺ ĐỊNH DANH B2B COVER',
      subtitle: 'Banner Cover vba-hero.jpg, Lịch Trình Công Việc 3 Tab & Thẻ Cơ Hội Tiềm Năng',
      bullets: [
        'Header thời gian thực: Lời chào năng động theo buổi (Sáng/Chiều/Tối) + Chuông thông báo đính kèm badge.',
        'Thẻ định danh doanh nhân B2B: Cover toàn cảnh vba-hero.jpg, avatar tròn viền vàng đôi và nút bút chì sửa hồ sơ.',
        'Lịch trình 3 tab phân đoạn: Hôm nay / Sắp tới / Nhắc lịch với hiệu ứng viên thuốc Gradient Vàng nổi bật.',
        'Thẻ Insight Cơ hội màu hổ phách: Tiếp cận tức thì 15 đối tác tiềm năng do AI ghép nối giao thương.'
      ],
      image: 'vione_app_02_executive_home.png',
      caption: 'Ảnh thực tế: Trang chủ Điều hành Executive Home trên App ViOne Connect'
    },
    {
      title: 'APP VIONE CONNECT: KHỐI GIÁM SÁT VẬN HÀNH DOANH NGHIỆP TRÊN MOBILE',
      subtitle: 'Tích Hợp 3 Trụ Cột Điều Hành Thời Gian Thực: Chấm Công, Quy Trình & Phê Duyệt Chi',
      bullets: [
        'Thẻ hiển thị đèn xanh nhấp nháy "HOẠT ĐỘNG", kết nối trực tiếp cơ sở dữ liệu điều hành doanh nghiệp.',
        'Thẻ 1: Mở camera AI FaceID và định vị GPS chấm công trong bán kính văn phòng <= 50m.',
        'Thẻ 2: Theo dõi danh sách việc cần làm (My Tasks), cập nhật checklist và xem cảnh báo quá tải đội ngũ.',
        'Thẻ 3: Lãnh đạo thực hiện ký duyệt tờ trình chi tiêu và quét mã VietQR thanh toán ngay trên điện thoại.'
      ],
      image: 'vione_app_07_enterprise_operations_card.png',
      caption: 'Ảnh thực tế: Khối Giám sát Vận hành & Nhân sự Doanh nghiệp trên màn hình Mobile'
    },
    {
      title: 'APP VIONE CONNECT: MẠNG LƯỚI ĐỐI TÁC & HỘP THƯ MESSENGER 4 DANH MỤC',
      subtitle: '3 Bộ Lọc C-Level, Nhắn Tin 1-Chạm, Hiển Thị Tin Nhắn Outbox & Khung Chat 0ms',
      bullets: [
        'Danh bạ C-Level: 3 bộ lọc (Đã kết nối, Lời mời, Gợi ý AI), tích hợp nút MessageSquare nhắn tin tức thì.',
        'Hộp thư Messenger chuẩn mực: 4 tab (Tất cả, Chưa đọc, Nhóm, Chờ), đếm chính xác số tin mới chưa xem.',
        'Đồng bộ tin nhắn gửi đi: Tab "Tất cả" hiển thị đầy đủ các cuộc trò chuyện do mình chủ động gửi đi (Bạn: ...).',
        'Khung chat trực tiếp 1-1 và nhóm B2B: Phản hồi 0ms (Optimistic UI), bong bóng vàng hổ phách sang trọng.'
      ],
      image: 'vione_app_12_messages_inbox.png',
      caption: 'Ảnh thực tế: Hộp thư Tin nhắn Doanh nhân chuẩn Messenger 4 Danh mục trên Mobile'
    },
    {
      title: 'APP VIONE CONNECT: DANH THIẾP 3D, CHẠM THẺ NFC & B2B MOMENTS',
      subtitle: 'Thay Thế Hoàn Toàn Danh Thiếp Giấy - Khẳng Định Đẳng Cấp Lãnh Đạo Doanh Nghiệp',
      bullets: [
        'Danh thiếp điện tử thông minh VIP Card 3D: Thiết kế mạ vàng bóng bẩy, hiển thị mã QR định danh cá nhân.',
        'Radar Chạm thẻ NFC: Đưa thẻ danh thiếp vật lý lại gần lưng điện thoại để truyền tải hồ sơ năng lực 1-chạm.',
        'B2B Moments: Mạng xã hội doanh nhân chia sẻ khoảnh khắc ký kết hợp đồng, thả tim và bình luận giao thương.',
        'Bảo mật danh thiếp số: Chủ thẻ toàn quyền bật/tắt các thông tin muốn chia sẻ (SĐT, Email, Zalo, Website).'
      ],
      image: 'vione_app_14_digital_card_3d.png',
      caption: 'Ảnh thực tế: Danh thiếp Điện tử Cá nhân Thông minh VIP Card 3D trên Mobile'
    },
    {
      title: 'TỔNG HỢP KIỂM THỬ & ĐÓNG GÓI XUẤT XƯỞNG RELEASE APK',
      subtitle: '725 Test Cases Pass 100%, Standalone Release APK 81.3MB Sẵn Sàng Vận Hành Toàn Quốc',
      bullets: [
        'Kiểm thử tự động: 34 kiểm thử RESTful API đạt 100% Pass, 725 Use Cases nghiệp vụ đạt trạng thái PASSED.',
        'Kiểm tra mã nguồn: TypeScript tsc --noEmit đạt exit code 0 trên cả 3 package (Backend, Frontend, Mobile).',
        'File APK xuất xưởng: release_apk/ViOne-Connect-latest.apk (81.3 MB), đóng gói sẵn JS bundle tĩnh và Hermes engine.',
        'Đầy đủ bộ 5 tài liệu: HDSD PDF ảnh thật, SRS Word 500+ UCs, Slide PDF trắng chữ đen, Tiến độ WBS, Test Cases.'
      ],
      image: 'vione_crm_01_login.png',
      caption: 'Hệ sinh thái ViOne: Đã chuẩn hóa toàn diện 100% - Sẵn sàng nghiệm thu & chuyển giao'
    }
  ];

  let html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>BÁO CÁO THUYẾT TRÌNH HỆ SINH THÁI VIONE</title>
  <style>
    @page {
      size: 297mm 210mm; /* A4 Landscape 16:9 like presentation */
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background: #E2E8F0;
      color: #0F172A;
    }
    .slide {
      width: 297mm;
      height: 210mm;
      page-break-after: always;
      background: #FFFFFF;
      padding: 20mm 22mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      border-bottom: 2px solid #CBD5E1;
    }
    .slide-header {
      border-bottom: 2px solid #0A0A0B;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .slide-tag {
      font-size: 10pt;
      font-weight: 700;
      color: #A67A47;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .slide-title {
      font-size: 18pt;
      font-weight: 800;
      color: #0A0A0B;
      line-height: 1.25;
      text-transform: uppercase;
    }
    .slide-subtitle {
      font-size: 11.5pt;
      font-weight: 500;
      color: #475569;
      margin-top: 4px;
    }
    .slide-body {
      display: flex;
      gap: 24px;
      flex: 1;
      align-items: center;
      min-height: 0; /* prevent flex overflow */
    }
    .slide-content {
      flex: 1.1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .bullet-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 14px;
      font-size: 12.5pt;
      line-height: 1.5;
      color: #1E293B;
    }
    .bullet-icon {
      color: #A67A47;
      font-weight: bold;
      font-size: 14pt;
      margin-right: 10px;
      line-height: 1.2;
    }
    .slide-media {
      flex: 0.9;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      max-height: 130mm;
    }
    .img-box {
      width: 100%;
      max-height: 120mm;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      background: #F8FAFC;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 6px;
    }
    .img-box img {
      max-width: 100%;
      max-height: 115mm;
      object-fit: contain;
      border-radius: 4px;
    }
    .img-caption {
      font-size: 9pt;
      font-style: italic;
      color: #64748B;
      margin-top: 6px;
      text-align: center;
    }
    .slide-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #E2E8F0;
      padding-top: 8px;
      font-size: 9pt;
      color: #94A3B8;
    }
    .footer-brand {
      font-weight: 700;
      color: #0A0A0B;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
`;

  slides.forEach((s, idx) => {
    const base64Img = getBase64Img(s.image);
    html += `
  <div class="slide">
    <div class="slide-header">
      <div class="slide-tag">HỆ SINH THÁI VIONE ENTERPRISE & CONNECT APP | SLIDE THUYẾT TRÌNH BÀN GIAO</div>
      <div class="slide-title">${s.title}</div>
      <div class="slide-subtitle">${s.subtitle}</div>
    </div>

    <div class="slide-body">
      <div class="slide-content">
        ${s.bullets.map(b => `
        <div class="bullet-item">
          <span class="bullet-icon">■</span>
          <span>${b}</span>
        </div>
        `).join('')}
      </div>

      <div class="slide-media">
        <div class="img-box">
          <img src="${base64Img}" alt="${s.caption}">
        </div>
        <div class="img-caption">${s.caption}</div>
      </div>
    </div>

    <div class="slide-footer">
      <div class="footer-brand">VIONE CORPORATION — BUSINESS CONNECT PLATFORM</div>
      <div>Trang ${idx + 1} / ${slides.length}</div>
    </div>
  </div>
`;
  });

  html += `
</body>
</html>
`;

  const htmlPath = path.join(__dirname, '../document/SLIDE_THUYET_TRINH_HE_THONG_VA_APP_VIONE.html');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`>>> SLIDE HTML GENERATED: ${htmlPath}`);

  console.log('Printing Slide HTML to PDF via Playwright...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(2000);

  const pdfPath = path.join(__dirname, '../document/SLIDE_THUYET_TRINH_HE_THONG_VA_APP_VIONE.pdf');
  await page.pdf({
    path: pdfPath,
    width: '297mm',
    height: '210mm',
    printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' }
  });

  await browser.close();
  const stats = fs.statSync(pdfPath);
  console.log(`>>> SLIDE PDF GENERATED: ${pdfPath} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
}

generateSlidesPdf().catch(err => {
  console.error(err);
  process.exit(1);
});
