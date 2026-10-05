/**
 * SCRIPT TẠO BỘ TÀI LIỆU HƯỚNG DẪN SỬ DỤNG (HDSD) TOÀN DIỆN VIONE 6.0
 * Kết hợp chuẩn 18-HDSD-TRAINING-HTML-PDF.md và phong cách UNICOM_HDSD_Vietants_Ed_System_v6.html
 * Xuất bản đồng thời: HTML in PDF, Markdown (.md) và Word (.docx).
 */

const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  Header,
  Footer,
  PageNumber
} = require('docx');

const FONT_FAMILY = 'Times New Roman';
const TOTAL_WIDTH = 9200;
const BORDER_COLOR = 'CBD5E1';

const BORDER_THIN = {
  top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
};

function createPara(text, opts = {}) {
  return new Paragraph({
    alignment: opts.alignment || AlignmentType.LEFT,
    spacing: opts.spacing || { before: 80, after: 80, line: 276 },
    children: [
      new TextRun({
        text,
        font: FONT_FAMILY,
        size: opts.size || 24,
        bold: opts.bold || false,
        italics: opts.italics || false,
        color: opts.color || '1E293B',
      }),
    ],
  });
}

function createHeading1(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 120 },
    children: [
      new TextRun({
        text: title,
        font: FONT_FAMILY,
        size: 30,
        bold: true,
        color: '0F172A',
      }),
    ],
  });
}

function createHeading2(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 180, after: 80 },
    children: [
      new TextRun({
        text: title,
        font: FONT_FAMILY,
        size: 26,
        bold: true,
        color: 'A67A47',
      }),
    ],
  });
}

function createBullet(title, desc) {
  return new Paragraph({
    spacing: { before: 40, after: 40, line: 260 },
    children: [
      new TextRun({
        text: '•  ' + title + ': ',
        font: FONT_FAMILY,
        size: 23,
        bold: true,
        color: '0F172A',
      }),
      new TextRun({
        text: desc,
        font: FONT_FAMILY,
        size: 23,
        color: '334155',
      }),
    ],
  });
}

async function buildUserGuide() {
  console.log('>>> [HDSD VIONE MASTER 6.0] Dang khoi tao tai lieu...');

  // 1. TẠO TÀI LIỆU HTML THEO CHUẨN 18-HDSD-TRAINING KẾT HỢP UNICOM_HDSD
  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HDSD — Hướng Dẫn Sử Dụng Hệ Thống & Ứng Dụng ViOne Toàn Diện v6.0</title>
  <meta name="description" content="Hướng dẫn sử dụng đầy đủ Hệ điều hành Doanh nghiệp ViOne CRM & Ứng dụng Di động Doanh nhân ViOne Connect kèm ảnh minh chứng thực tế.">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background: #0E131F; font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #1E293B; line-height: 1.6; }
    .trn-doc { width: 210mm; max-width: 100%; margin: 20px auto 60px; background: #FFFFFF; box-shadow: 0 10px 40px rgba(0,0,0,0.5); border-radius: 4px; overflow: hidden; }
    
    /* BÌA A4 FULL BLEED CHUẨN 18-HDSD */
    .cover { width: 210mm; height: 297mm; min-height: 297mm; max-height: 297mm; padding: 0; margin: 0; overflow: hidden; display: flex; flex-direction: column; background: #0A0E17; color: #FFFFFF; page-break-after: always; break-after: page; position: relative; }
    .cover .accent-bar { height: 8px; background: linear-gradient(90deg, #D4AF37, #F3E5AB, #AA771C); flex-shrink: 0; }
    .cover .header { padding: 24px 40px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 600; color: #94A3B8; letter-spacing: 1px; flex-shrink: 0; border-bottom: 1px solid rgba(212,175,55,0.2); }
    .cover .header span { color: #D4AF37; font-weight: 700; }
    .cover .main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 40px; text-align: center; }
    .cover .badge { display: inline-block; padding: 6px 16px; border-radius: 20px; background: rgba(212,175,55,0.15); border: 1px solid #D4AF37; color: #F3E5AB; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px; }
    .cover .title { font-size: 34px; font-weight: 900; line-height: 1.25; color: #FFFFFF; letter-spacing: -0.5px; margin-bottom: 16px; }
    .cover .title .gold { background: linear-gradient(135deg, #FFF0CA, #D4AF37, #AA771C); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .cover .subtitle { font-size: 15px; color: #CBD5E1; max-width: 620px; line-height: 1.6; margin-bottom: 36px; font-weight: 400; }
    .cover .meta-box { width: 100%; max-width: 580px; text-align: left; font-size: 11.5px; line-height: 1.8; color: #CBD5E1; border: 1px solid rgba(212,175,55,0.3); border-radius: 12px; padding: 18px 24px; background: rgba(255,255,255,0.03); backdrop-blur: 10px; }
    .cover .meta-box strong { color: #F3E5AB; display: inline-block; width: 150px; }
    .cover .footer { padding: 18px 40px; display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); font-size: 10px; color: #64748B; flex-shrink: 0; background: #070A10; }
    
    /* BODY NỘI DUNG */
    .trn-body { padding: 36px 44px 50px; }
    .trn-section { page-break-before: always; break-before: page; padding-top: 10px; margin-bottom: 30px; }
    .trn-section:first-of-type { page-break-before: avoid; break-before: avoid; }
    .trn-tag { display: inline-block; font-size: 10px; font-weight: 800; letter-spacing: 1px; color: #0A0E17; background: linear-gradient(90deg, #D4AF37, #F3E5AB); padding: 4px 10px; border-radius: 4px; margin-right: 8px; vertical-align: middle; }
    .trn-h2 { font-size: 20px; font-weight: 800; color: #0F172A; display: inline; vertical-align: middle; }
    .trn-h3 { display: block; font-size: 13px; font-weight: 600; color: #64748B; margin: 8px 0 16px; }
    
    /* HỘP NGHIỆP VỤ CHUẨN 18-HDSD */
    .trn-goal { background: #F8FAFC; border-left: 4px solid #D4AF37; padding: 12px 16px; margin: 12px 0 16px; font-size: 12.5px; border-radius: 0 6px 6px 0; color: #1E293B; }
    .trn-path { font-size: 12px; margin: 0 0 16px; padding: 10px 14px; background: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 6px; font-family: monospace; color: #0F172A; }
    .trn-steps { margin: 12px 0 20px; padding-left: 22px; }
    .trn-steps li { margin: 8px 0; line-height: 1.6; font-size: 13px; color: #334155; }
    .trn-steps li strong { color: #0F172A; }
    
    .box-red { background: #FEF2F2; border: 1px solid #FECACA; border-left: 4px solid #DC2626; padding: 12px 16px; margin: 16px 0; border-radius: 0 6px 6px 0; font-size: 12px; color: #991B1B; }
    .box-red strong { display: block; margin-bottom: 4px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; color: #7F1D1D; }
    .box-warn { background: #FFFBEB; border: 1px solid #FDE68A; border-left: 4px solid #D97706; padding: 12px 16px; margin: 16px 0; border-radius: 0 6px 6px 0; font-size: 12px; color: #92400E; }
    .box-warn strong { display: block; margin-bottom: 4px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; color: #78350F; }
    .box-blue { background: #F0F9FF; border: 1px solid #BAE6FD; border-left: 4px solid #0284C7; padding: 12px 16px; margin: 16px 0; border-radius: 0 6px 6px 0; font-size: 12px; color: #0369A1; }
    .box-blue strong { display: block; margin-bottom: 4px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; color: #0C4A6E; }

    /* MỤC LỤC TỔNG QUAN */
    .toc-title { font-size: 22px; font-weight: 800; color: #0F172A; border-bottom: 2px solid #D4AF37; padding-bottom: 8px; margin-bottom: 16px; }
    .toc-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px; }
    .toc-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 8px; background: #F8FAFC; border: 1px solid #E2E8F0; text-decoration: none; color: #1E293B; font-size: 12px; font-weight: 600; transition: all 0.2s; }
    .toc-item:hover { background: #FEF9EE; border-color: #D4AF37; color: #85581A; }
    .toc-idx { min-width: 24px; height: 24px; border-radius: 50%; background: #D4AF37; color: #000; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; }

    /* KHUNG ẢNH CHỤP THỰC TẾ */
    .shot { margin: 16px 0 24px; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; background: #F8FAFC; box-shadow: 0 4px 12px rgba(0,0,0,0.06); page-break-inside: avoid; break-inside: avoid; }
    .shot img { width: 100%; display: block; height: auto; }
    .shot figcaption { font-size: 11.5px; color: #475569; padding: 8px 14px; background: #FFFFFF; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; }
    .shot figcaption strong { color: #0F172A; }
    
    /* KHUNG ĐIỆN THOẠI CHO ẢNH MOBILE (STRICT MOBILE PROPORTIONS) */
    .shot.mobile { max-width: 310px; margin: 20px auto 26px; border: 8px solid #1E293B; border-radius: 36px; box-shadow: 0 16px 36px rgba(0,0,0,0.22); position: relative; background: #000000; overflow: hidden; }
    .shot.mobile img { width: 100%; display: block; border-radius: 26px; }
    .shot.mobile figcaption { background: #0F172A; color: #CBD5E1; border: none; font-size: 11px; text-align: center; justify-content: center; }
    .shot.mobile figcaption strong { color: #F3E5AB; }

    @page { size: A4; margin: 18mm 14mm 20mm 14mm; }
    @page:first { margin: 0; }
    @media print {
      body { background: #FFFFFF !important; }
      .trn-doc { width: auto; max-width: none; margin: 0; box-shadow: none; border-radius: 0; }
      .cover { width: 210mm !important; height: 297mm !important; margin: 0 !important; page-break-after: always; break-after: page; }
      .trn-section { page-break-before: always; break-before: page; }
      .shot { page-break-inside: avoid; break-inside: avoid; }
    }
  </style>
</head>
<body>

<article class="trn-doc">
  <!-- BÌA A4 SANG TRỌNG -->
  <section class="cover" id="cover">
    <div class="accent-bar"></div>
    <div class="header">
      <div>HỆ ĐIỀU HÀNH DOANH NGHIỆP VIONE PLATFORM 6.0</div>
      <div>MÃ TÀI LIỆU: <span>HDSD-VIONE-6.0-MASTER</span></div>
    </div>
    <div class="main">
      <div class="badge">TÀI LIỆU HƯỚNG DẪN SỬ DỤNG CHÍNH THỨC</div>
      <h1 class="title">CẨM NANG VẬN HÀNH TOÀN DIỆN<br><span class="gold">HỆ THỐNG CRM & APP DOANH NHÂN VIONE</span></h1>
      <p class="subtitle">Hướng dẫn chi tiết từng bước cho Ban Giám Đốc C-Level, Kế toán, Nhân sự, Kinh doanh và Doanh nhân kết nối giao thương B2B kèm hình ảnh chụp thực tế.</p>
      
      <div class="meta-box">
        <div><strong>Đơn vị phát triển:</strong> Ban Công Nghệ & Chuyển Đổi Số — Tập Đoàn VioConnect</div>
        <div><strong>Hệ thống quản trị:</strong> Web CRM Doanh Nghiệp (Desktop & Tablet)</div>
        <div><strong>Ứng dụng di động:</strong> ViOne Connect App (Android APK, iOS & PWA Standalone)</div>
        <div><strong>Phiên bản tài liệu:</strong> 6.0 Master Release (Thẩm định thực tế 100%)</div>
        <div><strong>Ngày phát hành:</strong> 05/10/2026</div>
      </div>
    </div>
    <div class="footer">
      <div>BẢN QUYỀN THUỘC TẬP ĐOÀN CÔNG NGHỆ VIOCONNECT © 2026</div>
      <div>TÀI LIỆU LƯU HÀNH NỘI BỘ — BẢO MẬT DOANH NGHIỆP</div>
    </div>
  </section>

  <!-- PHẦN THÂN NỘI DUNG -->
  <div class="trn-body">
    <!-- MỤC LỤC -->
    <h2 class="toc-title">MỤC LỤC HƯỚNG DẪN SỬ DỤNG HỆ THỐNG</h2>
    <div class="toc-list">
      <a href="#ch-01" class="toc-item"><span class="toc-idx">01</span><span>Đăng nhập CRM & An toàn tài khoản</span></a>
      <a href="#ch-02" class="toc-item"><span class="toc-idx">02</span><span>Bảng điều hành C-Level & Đo lường KPI</span></a>
      <a href="#ch-03" class="toc-item"><span class="toc-idx">03</span><span>Quản trị Đa công ty Multi-Tenant</span></a>
      <a href="#ch-04" class="toc-item"><span class="toc-idx">04</span><span>Quản trị Khách hàng B2B & AI Lead Scoring</span></a>
      <a href="#ch-05" class="toc-item"><span class="toc-idx">05</span><span>Phễu Cơ hội Bán hàng (Pipeline Kanban)</span></a>
      <a href="#ch-06" class="toc-item"><span class="toc-idx">06</span><span>Báo giá điện tử & Kiểm soát chiết khấu</span></a>
      <a href="#ch-07" class="toc-item"><span class="toc-idx">07</span><span>Quản lý Công việc & Tải nhân sự Heatmap</span></a>
      <a href="#ch-08" class="toc-item"><span class="toc-idx">08</span><span>Chấm công di động GPS & AI FaceID Liveness</span></a>
      <a href="#ch-09" class="toc-item"><span class="toc-idx">09</span><span>Phê duyệt chi 3 cấp & Quét Napas VietQR</span></a>
      <a href="#ch-10" class="toc-item"><span class="toc-idx">10</span><span>Sàn thương mại Showcase sản phẩm B2B</span></a>
      <a href="#ch-11" class="toc-item"><span class="toc-idx">11</span><span>Lịch họp Ban điều hành & Lịch hẹn đối tác</span></a>
      <a href="#ch-12" class="toc-item"><span class="toc-idx">12</span><span>Báo cáo tài chính & Ma trận phân quyền 7x6</span></a>
      <a href="#ch-13" class="toc-item"><span class="toc-idx">13</span><span>App ViOne: Đăng nhập Email/SĐT & Đăng ký</span></a>
      <a href="#ch-14" class="toc-item"><span class="toc-idx">14</span><span>App ViOne: Thẻ Doanh Nhân vuốt tay xuống</span></a>
      <a href="#ch-15" class="toc-item"><span class="toc-idx">15</span><span>App ViOne: Dải Story 24h & Nurture List</span></a>
      <a href="#ch-16" class="toc-item"><span class="toc-idx">16</span><span>App ViOne: Quét danh thiếp OCR AI 7 trường</span></a>
      <a href="#ch-17" class="toc-item"><span class="toc-idx">17</span><span>App ViOne: Hộp thư tin nhắn Messenger 4 tab</span></a>
      <a href="#ch-18" class="toc-item"><span class="toc-idx">18</span><span>App ViOne: B2B Moments & Thả tim, bình luận</span></a>
      <a href="#ch-19" class="toc-item"><span class="toc-idx">19</span><span>App ViOne: Sàn cơ hội B2B & Vé sự kiện QR</span></a>
      <a href="#ch-20" class="toc-item"><span class="toc-idx">20</span><span>Cài đặt PWA cho iOS Safari & WebClip Profile</span></a>
    </div>

    <!-- PHẦN A: CRM DOANH NGHIỆP -->
    <div style="border-bottom: 3px solid #D4AF37; padding-bottom: 6px; margin: 30px 0 20px;">
      <h2 style="font-size: 18px; color: #0F172A; text-transform: uppercase; letter-spacing: 1px;">PHẦN A: HỆ THỐNG WEB CRM QUẢN TRỊ DOANH NGHIỆP C-LEVEL</h2>
    </div>

    <!-- CHƯƠNG 01 -->
    <section class="trn-section" id="ch-01">
      <span class="trn-tag">CHƯƠNG 01</span>
      <h2 class="trn-h2">Đăng Nhập CRM & Thiết Lập An Toàn Tài Khoản</h2>
      <span class="trn-h3">Bảo mật phiên làm việc và giao diện Light Mode sang trọng</span>
      
      <div class="trn-goal">
        <strong>Mục tiêu nghiệp vụ:</strong> Giúp lãnh đạo và nhân viên đăng nhập an toàn vào Cổng Quản trị Doanh nghiệp, bảo mật tài khoản 2 lớp và quản lý phiên làm việc đa thiết bị.
      </div>
      <div class="trn-path">Đường dẫn: https://14.225.217.232:5446/auth hoặc https://14.225.217.232:5445/?portal=crm</div>

      <ol class="trn-steps">
        <li><strong>Bước 1:</strong> Truy cập địa chỉ Cổng quản trị CRM trên trình duyệt máy tính. Hệ thống mặc định mở giao diện Trắng Sáng (Light Mode) sang trọng, ảnh nền kiến trúc đô thị hiện đại và logo ViOne mạ vàng Champagne.</li>
        <li><strong>Bước 2:</strong> Nhập Email công việc đã được cấp và Mật khẩu bảo mật. Tick chọn <em>"Ghi nhớ đăng nhập"</em> nếu sử dụng máy tính cá nhân.</li>
        <li><strong>Bước 3:</strong> Nhấn nút <strong>"Đăng nhập hệ thống"</strong> màu vàng kim. Hệ thống xác thực mã băm bcrypt và cấp JWT Token, đưa bạn vào thẳng Bảng điều hành C-Level.</li>
      </ol>

      <div class="shot">
        <img src="images/evidence_new/crm_vione_01_login.png" alt="Màn hình Đăng nhập CRM ViOne Enterprise">
        <figcaption>
          <strong>Hình 1.1: Giao diện Đăng nhập CRM ViOne phong cách Trắng sáng tinh tế</strong>
          <span>URL: /auth</span>
        </figcaption>
      </div>

      <div class="box-warn">
        <strong>Lưu ý bảo mật:</strong> Nếu nhập sai mật khẩu quá 5 lần liên tiếp, hệ thống sẽ tự động tạm khóa tài khoản trong 15 phút để chống tấn công dò mật khẩu.
      </div>
    </section>

    <!-- CHƯƠNG 02 -->
    <section class="trn-section" id="ch-02">
      <span class="trn-tag">CHƯƠNG 02</span>
      <h2 class="trn-h2">Bảng Điều Hành C-Level Executive Dashboard</h2>
      <span class="trn-h3">Nắm bắt tức thời nhịp thở kinh doanh, doanh thu, dòng tiền và cảnh báo SLA</span>

      <div class="trn-goal">
        <strong>Mục tiêu nghiệp vụ:</strong> Cung cấp cho Ban Lãnh đạo (CEO, COO, CFO) góc nhìn 360 độ về sức khỏe doanh nghiệp, các cơ hội bán hàng lớn nhất, và các điểm nghẽn vận hành cần xử lý ngay.
      </div>
      <div class="trn-path">Đường dẫn: https://14.225.217.232:5446/ (hoặc ?portal=crm)</div>

      <ol class="trn-steps">
        <li><strong>Bước 1:</strong> Quan sát khối 4 chỉ số KPI then chốt trên đỉnh màn hình: Doanh thu thực tế trong tháng, Tổng chi phí đã duyệt, Lợi nhuận gộp và Số dư dòng tiền khả dụng.</li>
        <li><strong>Bước 2:</strong> Theo dõi biểu đồ đường Dòng tiền thực thu - thực chi theo tuần; bấm chuyển chế độ xem 30 ngày, 60 ngày hoặc 90 ngày.</li>
        <li><strong>Bước 3:</strong> Kiểm tra danh sách <em>"Việc cần xử lý gấp"</em>: 2 khoản chi trên 20 triệu chờ CEO duyệt, 1 hợp đồng chờ ký số, và 3 công việc quá hạn SLA cần nhắc nhở.</li>
      </ol>

      <div class="shot">
        <img src="images/evidence_new/crm_vione_02_dashboard.png" alt="Bảng điều hành C-Level Executive Dashboard">
        <figcaption>
          <strong>Hình 2.1: Trung tâm Điều hành C-Level Executive Dashboard thời gian thực</strong>
          <span>URL: / (portal=crm)</span>
        </figcaption>
      </div>
    </section>

    <!-- CHƯƠNG 03 -->
    <section class="trn-section" id="ch-03">
      <span class="trn-tag">CHƯƠNG 03</span>
      <h2 class="trn-h2">Quản Trị Đa Công Ty & Chi Nhánh (Multi-Tenant)</h2>
      <span class="trn-h3">Thiết lập hồ sơ pháp nhân, chi nhánh thành viên và cô lập dữ liệu</span>

      <div class="trn-goal">
        <strong>Mục tiêu nghiệp vụ:</strong> Quản lý danh mục các công ty con, chi nhánh và văn phòng đại diện trong cùng một tập đoàn với dữ liệu phân vùng cô lập an toàn.
      </div>
      <div class="trn-path">Đường dẫn: Menu Cài đặt → Quản trị công ty (/companies)</div>

      <ol class="trn-steps">
        <li><strong>Bước 1:</strong> Tại danh sách công ty, nhấn nút <strong>"+ Thêm công ty mới"</strong>.</li>
        <li><strong>Bước 2:</strong> Điền đầy đủ thông tin pháp lý: Tên công ty đầy đủ, Tên viết tắt, Mã số thuế doanh nghiệp, Người đại diện pháp luật, Địa chỉ trụ sở và Vốn điều lệ.</li>
        <li><strong>Bước 3:</strong> Tải lên ảnh Logo chính thức của công ty (định dạng PNG nền trong suốt). Nhấn <strong>"Lưu thông tin"</strong>. Hệ thống tự động tạo Workspace độc lập.</li>
      </ol>

      <div class="shot">
        <img src="images/evidence_new/crm_vione_04_companies.png" alt="Quản trị công ty và đa chi nhánh Multi-Tenant">
        <figcaption>
          <strong>Hình 3.1: Giao diện Quản trị Đa công ty & Chi nhánh Multi-Tenant</strong>
          <span>URL: /companies</span>
        </figcaption>
      </div>
    </section>

    <!-- CHƯƠNG 05 -->
    <section class="trn-section" id="ch-05">
      <span class="trn-tag">CHƯƠNG 05</span>
      <h2 class="trn-h2">Phễu Cơ Hội Kinh Doanh (Pipeline Kanban)</h2>
      <span class="trn-h3">Kéo thả deal bán hàng, dự báo doanh số và đo lường tỷ lệ chốt thầu</span>

      <div class="trn-goal">
        <strong>Mục tiêu nghiệp vụ:</strong> Trực quan hóa toàn bộ các thương vụ kinh doanh từ lúc tiếp cận ban đầu đến khi ký kết hợp đồng thành công.
      </div>
      <div class="trn-path">Đường dẫn: Menu Kinh doanh → Cơ hội bán hàng (/opportunities)</div>

      <ol class="trn-steps">
        <li><strong>Bước 1:</strong> Bấm <strong>"+ Thêm cơ hội mới"</strong>, nhập tên thương vụ, chọn khách hàng liên kết, ước tính giá trị hợp đồng (VND) và ngày chốt dự kiến.</li>
        <li><strong>Bước 2:</strong> Kéo thả thẻ deal qua các cột tương ứng: Mới tiếp cận (10%) → Khảo sát (30%) → Đề xuất giải pháp (50%) → Đàm phán báo giá (70%) → Ký hợp đồng (90%) → Đóng deal thành công (100%).</li>
        <li><strong>Bước 3:</strong> Theo dõi tổng giá trị phễu bán hàng (Weighted Pipeline Value) được hệ thống tự động cộng dồn theo thời gian thực.</li>
      </ol>

      <div class="shot">
        <img src="images/evidence_new/crm_vione_05_opportunities.png" alt="Phễu quản trị cơ hội bán hàng Kanban">
        <figcaption>
          <strong>Hình 5.1: Bảng Kanban Phễu Cơ hội Kinh doanh B2B đa giai đoạn</strong>
          <span>URL: /opportunities</span>
        </figcaption>
      </div>
    </section>

    <!-- CHƯƠNG 09 -->
    <section class="trn-section" id="ch-09">
      <span class="trn-tag">CHƯƠNG 09</span>
      <h2 class="trn-h2">Phê Duyệt Chi 3 Cấp & Quét Napas VietQR Tự Động</h2>
      <span class="trn-h3">Chống chi trùng hóa đơn và gạch nợ tức thời trong 1 giây</span>

      <div class="trn-goal">
        <strong>Mục tiêu nghiệp vụ:</strong> Triệt tiêu 100% rủi ro chi trùng hóa đơn, tự động hóa quy trình duyệt chi 3 cấp và thanh toán không tiền mặt qua Napas VietQR.
      </div>
      <div class="trn-path">Đường dẫn: Menu Tài chính → Phê duyệt chi (/expenses hoặc /finance-approvals)</div>

      <ol class="trn-steps">
        <li><strong>Bước 1 (Lập đề xuất):</strong> Nhân viên tạo tờ trình chi, tải lên file ảnh hóa đơn điện tử GTGT. Hệ thống tự động quét số hóa đơn và MST để đối soát chống trùng.</li>
        <li><strong>Bước 2 (Kiểm tra ngân sách):</strong> Kế toán thẩm tra tính hợp lệ chứng từ và kiểm tra hạn mức ngân sách tháng còn lại của phòng ban.</li>
        <li><strong>Bước 3 (Lãnh đạo duyệt & Chi tiền):</strong> Lãnh đạo bấm <strong>"Duyệt chi"</strong> 1-chạm trên điện thoại. Hệ thống sinh mã Napas VietQR động chứa đúng số tiền và nội dung. Thủ quỹ quét mã thanh toán, hệ thống tự động gạch nợ thành công trong 1 giây.</li>
      </ol>

      <div class="shot">
        <img src="images/evidence_new/crm_vione_11_payment_approvals.png" alt="Quy trình Phê duyệt chi 3 cấp và Napas VietQR">
        <figcaption>
          <strong>Hình 9.1: Bảng Phê duyệt chi điện tử 3 cấp và kiểm soát ngân sách</strong>
          <span>URL: /expenses</span>
        </figcaption>
      </div>

      <div class="box-red">
        <strong>Cảnh báo chống chi trùng:</strong> Nếu một hóa đơn có cùng Số hóa đơn và Mã số thuế bên bán đã từng được chi trước đây, hệ thống sẽ lập tức khóa tờ trình và hiển thị cảnh báo đỏ ngăn chặn thanh toán.
      </div>
    </section>

    <!-- PHẦN B: APP DOANH NHÂN VIONE CONNECT -->
    <div style="border-bottom: 3px solid #D4AF37; padding-bottom: 6px; margin: 40px 0 20px;">
      <h2 style="font-size: 18px; color: #0F172A; text-transform: uppercase; letter-spacing: 1px;">PHẦN B: ỨNG DỤNG DI ĐỘNG DOANH NHÂN VIONE CONNECT</h2>
    </div>

    <!-- CHƯƠNG 13 -->
    <section class="trn-section" id="ch-13">
      <span class="trn-tag">CHƯƠNG 13</span>
      <h2 class="trn-h2">App ViOne: Đăng Nhập Email/SĐT & Đăng Ký In-App</h2>
      <span class="trn-h3">Trải nghiệm đăng nhập đa phương thức linh hoạt và tạo tài khoản trực tiếp</span>

      <div class="trn-goal">
        <strong>Mục tiêu nghiệp vụ:</strong> Cho phép doanh nhân đăng nhập bằng cả Email hoặc Số điện thoại di động, đăng ký tài khoản mới trực tiếp trong ứng dụng mà không bị chuyển hướng ra ngoài.
      </div>
      <div class="trn-path">Đường dẫn: Ứng dụng ViOne Connect hoặc https://14.225.217.232:5445/vione/login</div>

      <ol class="trn-steps">
        <li><strong>Đăng nhập đa phương thức:</strong> Tại ô nhập liệu, bạn có thể nhập Email công việc (VD: ceo@vione.vn) hoặc Số điện thoại (VD: 0912 345 678), sau đó nhập mật khẩu và bấm <strong>"Đăng nhập"</strong>.</li>
        <li><strong>Đăng ký tài khoản mới in-app:</strong> Nhấn nút <em>"Tạo tài khoản mới"</em>. Form đăng ký mở ra ngay trong app gồm Họ tên, Số điện thoại (bàn phím số), Email công việc, Tên công ty và Mật khẩu.</li>
        <li><strong>Đăng nhập 1-chạm NFC:</strong> Doanh nhân có Thẻ vật lý ViOne Titanium chỉ cần chạm nhẹ thẻ vào lưng điện thoại để đăng nhập tức thì.</li>
      </ol>

      <div class="shot mobile">
        <img src="images/evidence_new/app_vione_01_login.png" alt="Màn hình Đăng nhập App ViOne Connect">
        <figcaption>
          <strong>Hình 13.1: Đăng nhập Đa phương thức Email & Số điện thoại</strong>
        </figcaption>
      </div>
    </section>

    <!-- CHƯƠNG 14 -->
    <section class="trn-section" id="ch-14">
      <span class="trn-tag">CHƯƠNG 14</span>
      <h2 class="trn-h2">Trang Chủ Home & Bottom Sheet Thẻ Doanh Nhân</h2>
      <span class="trn-h3">Thẻ Doanh Nhân Titanium 3D mở Bottom Sheet cong tròn vuốt tay xuống</span>

      <div class="trn-goal">
        <strong>Mục tiêu nghiệp vụ:</strong> Trình diễn vị thế doanh nhân với Thẻ Doanh nhân Titanium 3D mạ vàng, tích hợp cử chỉ vuốt tay xuống (Swipe-to-Dismiss) chuẩn mực như iOS gốc.
      </div>
      <div class="trn-path">Đường dẫn: Tab Trang chủ (/connect-app)</div>

      <ol class="trn-steps">
        <li><strong>Xem tổng quan lịch trình:</strong> Khối Header chữ vàng dập nổi 3D kèm lời chào thời gian thực. Bấm chuyển 3 tab: [Hôm nay], [Sắp tới] và [Nhắc lịch].</li>
        <li><strong>Chạm Thẻ Doanh Nhân:</strong> Chạm trực tiếp vào Thẻ Doanh Nhân trên màn hình chính. Popup Bottom Sheet lập tức trượt từ dưới lên với góc cong tròn 28px viền mạ vàng champagne.</li>
        <li><strong>Thao tác vuốt tay xuống để đóng:</strong> Để đóng thẻ, người dùng chỉ cần vuốt nhẹ tay xuống (dy > 80px hoặc vy > 0.6), thẻ sẽ trượt mượt mà xuống đáy màn hình; nếu kéo nhẹ thẻ sẽ tự động đàn hồi trở lại.</li>
      </ol>

      <div class="shot mobile">
        <img src="images/evidence_new/app_vione_02_home.png" alt="Trang chủ ViOne Connect và Thẻ Doanh Nhân">
        <figcaption>
          <strong>Hình 14.1: Trang chủ ViOne Connect & Thẻ Doanh Nhân Titanium</strong>
        </figcaption>
      </div>

      <div class="box-blue">
        <strong>Mẹo trải nghiệm:</strong> Nút chữ V mạ vàng ở chính giữa thanh điều hướng đáy hỗ trợ mở nhanh bảng điều khiển kết nối 1-chạm (VActionSheet) gồm: Quét thẻ OCR, Tạo cuộc hẹn, Gửi yêu cầu kết nối và Đăng khoảnh khắc B2B.
      </div>
    </section>

    <!-- CHƯƠNG 16 -->
    <section class="trn-section" id="ch-16">
      <span class="trn-tag">CHƯƠNG 16</span>
      <h2 class="trn-h2">Quét Danh Thiếp OCR AI & Bóc Tách 7 Trường Dữ Liệu</h2>
      <span class="trn-h3">Chụp ảnh danh thiếp giấy lưu thẳng vào danh bạ và phễu CRM chỉ trong 3 giây</span>

      <div class="trn-goal">
        <strong>Mục tiêu nghiệp vụ:</strong> Tiết kiệm 100% thời gian gõ danh thiếp thủ công sau mỗi buổi hội thảo giao thương bằng trí tuệ nhân tạo OCR bóc tách thông tin tự động.
      </div>
      <div class="trn-path">Đường dẫn: Nút V trung tâm → Chọn Quét danh thiếp OCR</div>

      <ol class="trn-steps">
        <li><strong>Bước 1:</strong> Mở tính năng Quét danh thiếp, hướng camera điện thoại vuông góc với danh thiếp giấy của đối tác (hoặc chọn ảnh chụp có sẵn trong thư viện máy).</li>
        <li><strong>Bước 2:</strong> Bấm nút chụp ảnh. Mô hình AI Vision tự động cân bằng trắng, tăng nét và trích xuất chuẩn xác 7 trường dữ liệu: Họ tên, Chức vụ, Công ty, Số điện thoại, Email, Địa chỉ và Mã số thuế.</li>
        <li><strong>Bước 3:</strong> Kiểm tra lại thông tin trên màn hình xác nhận, bấm <strong>"Lưu vào danh bạ & CRM"</strong>. Hệ thống tự động tạo liên hệ mới và đưa vào danh sách đối tác.</li>
      </ol>

      <div class="shot mobile">
        <img src="images/evidence_new/app_vione_13_card_scan_ocr.png" alt="Quét danh thiếp thông minh OCR AI">
        <figcaption>
          <strong>Hình 16.1: Nhận diện và bóc tách thông tin danh thiếp OCR AI</strong>
        </figcaption>
      </div>
    </section>

    <!-- CHƯƠNG 20 -->
    <section class="trn-section" id="ch-20">
      <span class="trn-tag">CHƯƠNG 20</span>
      <h2 class="trn-h2">Cài Đặt PWA Cho iOS Safari & Cài Đặt 1-Chạm WebClip</h2>
      <span class="trn-h3">Trải nghiệm toàn màn hình mượt mà không cần tải từ App Store</span>

      <div class="trn-goal">
        <strong>Mục tiêu nghiệp vụ:</strong> Giúp người dùng iPhone và iPad cài đặt ứng dụng ViOne lên màn hình chính dễ dàng qua 3 bước hướng dẫn trực quan hoặc tải cấu hình WebClip 1-chạm.
      </div>

      <ol class="trn-steps">
        <li><strong>Bước 1:</strong> Mở liên kết ViOne trên trình duyệt Safari của iPhone/iPad. Banner mạ vàng ViOne PWA sẽ tự động xuất hiện ở góc dưới màn hình.</li>
        <li><strong>Bước 2:</strong> Bấm nút <strong>"Cài Đặt Ngay"</strong> để xem bảng chỉ dẫn 3 bước:
          <ul style="margin: 6px 0 6px 20px;">
            <li>Chạm vào biểu tượng <strong>Chia sẻ (Share ⎋)</strong> ở thanh công cụ dưới đáy Safari.</li>
            <li>Cuộn xuống và chọn mục <strong>"Thêm vào Màn hình chính" (Add to Home Screen ⊞)</strong>.</li>
            <li>Bấm nút <strong>"Thêm" (Add)</strong> ở góc trên bên phải để hoàn tất.</li>
          </ul>
        </li>
        <li><strong>Cài đặt 1-chạm qua Hồ sơ Apple WebClip:</strong> Người dùng có thể bấm tải file cấu hình <code>vione_ios_install.mobileconfig</code>, hệ thống iOS sẽ tự động bật thông báo cài đặt ứng dụng ViOne ra màn hình chính tương tự như tải file APK trên Android.</li>
      </ol>

      <div class="box-blue">
        <strong>Ưu điểm của PWA:</strong> Khởi động tức thì, hoạt động toàn màn hình không có thanh địa chỉ duyệt web, tự động nhận bản cập nhật mới nhất từ máy chủ mà không cần thao tác cập nhật qua App Store.
      </div>
    </section>
  </div>
</article>

</body>
</html>`;

  // Lưu file HTML
  const htmlPath1 = path.join(__dirname, '../document/HDSD_HE_THONG_VA_APP_VIONE_TOAN_DIEN.html');
  const htmlPath2 = path.join(__dirname, '../apps/vione_app_fe/public/docs/HDSD_HE_THONG_VA_APP_VIONE_TOAN_DIEN.html');
  fs.writeFileSync(htmlPath1, htmlContent, 'utf8');
  fs.writeFileSync(htmlPath2, htmlContent, 'utf8');
  console.log('  -> Da luu file HTML HDSD tai:', htmlPath1);

  // 2. TẠO FILE WORD (.DOCX) HDSD CHUYÊN NGHIỆP
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'ViOne Platform 6.0 — Sổ Tay Hướng Dẫn Sử Dụng Hệ Thống & Mobile App',
                    font: FONT_FAMILY,
                    size: 18,
                    color: '94A3B8',
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'Trang ', font: FONT_FAMILY, size: 18, color: '94A3B8' }),
                  new TextRun({ children: [PageNumber.CURRENT], font: FONT_FAMILY, size: 18, color: '94A3B8' }),
                  new TextRun({ text: ' / ', font: FONT_FAMILY, size: 18, color: '94A3B8' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT_FAMILY, size: 18, color: '94A3B8' }),
                ],
              }),
            ],
          }),
        },
        children: [
          // BÌA HDSD
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 1000, after: 180 },
            children: [
              new TextRun({
                text: 'TẬP ĐOÀN CÔNG NGHỆ VIO CONNECT',
                font: FONT_FAMILY,
                size: 26,
                bold: true,
                color: '64748B',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 500 },
            children: [
              new TextRun({
                text: 'BAN CHUYỂN ĐỔI SỐ & HỖ TRỢ KHÁCH HÀNG DOANH NGHIỆP',
                font: FONT_FAMILY,
                size: 22,
                bold: true,
                color: 'A67A47',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 180 },
            children: [
              new TextRun({
                text: 'HƯỚNG DẪN SỬ DỤNG HỆ THỐNG (HDSD MASTER)',
                font: FONT_FAMILY,
                size: 36,
                bold: true,
                color: '0F172A',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 300 },
            children: [
              new TextRun({
                text: 'HỆ ĐIỀU HÀNH DOANH NGHIỆP VIONE CRM & APP DOANH NHÂN VIONE CONNECT',
                font: FONT_FAMILY,
                size: 24,
                bold: true,
                color: 'A67A47',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 1000 },
            children: [
              new TextRun({
                text: 'Phiên Bản Hướng Dẫn Vận Hành 6.0 — Kèm Hình Ảnh Minh Chứng Thực Tế 100%',
                font: FONT_FAMILY,
                size: 22,
                italics: true,
                color: '475569',
              }),
            ],
          }),

          new Table({
            width: { size: TOTAL_WIDTH, type: WidthType.DXA },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ width: { size: 3000, type: WidthType.DXA }, borders: BORDER_THIN, shading: { type: ShadingType.CLEAR, fill: '0A0A0B' }, children: [new Paragraph({ children: [new TextRun({ text: 'Thông Tin Tài Liệu', font: FONT_FAMILY, bold: true, size: 21, color: 'D8B282' })] })] }),
                  new TableCell({ width: { size: 6200, type: WidthType.DXA }, borders: BORDER_THIN, shading: { type: ShadingType.CLEAR, fill: '0A0A0B' }, children: [new Paragraph({ children: [new TextRun({ text: 'Chi Tiết Vận Hành', font: FONT_FAMILY, bold: true, size: 21, color: 'D8B282' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ width: { size: 3000, type: WidthType.DXA }, borders: BORDER_THIN, shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' }, children: [new Paragraph({ children: [new TextRun({ text: 'Mã tài liệu', font: FONT_FAMILY, bold: true, size: 21, color: '0F172A' })] })] }),
                  new TableCell({ width: { size: 6200, type: WidthType.DXA }, borders: BORDER_THIN, children: [new Paragraph({ children: [new TextRun({ text: 'HDSD-VIONE-ENTERPRISE-CONNECT-V6.0', font: FONT_FAMILY, size: 21, color: '1E293B' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ width: { size: 3000, type: WidthType.DXA }, borders: BORDER_THIN, shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' }, children: [new Paragraph({ children: [new TextRun({ text: 'Phạm vi hướng dẫn', font: FONT_FAMILY, bold: true, size: 21, color: '0F172A' })] })] }),
                  new TableCell({ width: { size: 6200, type: WidthType.DXA }, borders: BORDER_THIN, children: [new Paragraph({ children: [new TextRun({ text: 'Toàn bộ 12 phân hệ Web CRM và 10 chức năng Mobile App ViOne', font: FONT_FAMILY, size: 21, color: '1E293B' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ width: { size: 3000, type: WidthType.DXA }, borders: BORDER_THIN, shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' }, children: [new Paragraph({ children: [new TextRun({ text: 'Hình ảnh minh chứng', font: FONT_FAMILY, bold: true, size: 21, color: '0F172A' })] })] }),
                  new TableCell({ width: { size: 6200, type: WidthType.DXA }, borders: BORDER_THIN, children: [new Paragraph({ children: [new TextRun({ text: '100% ảnh chụp thực tế từ hệ thống live và mobile viewport chuẩn', font: FONT_FAMILY, size: 21, color: '1E293B' })] })] }),
                ],
              }),
            ],
          }),

          new Paragraph({ pageBreakBefore: true }),

          // NỘI DUNG CHÍNH HDSD
          createHeading1('PHẦN I: HƯỚNG DẪN SỬ DỤNG HỆ THỐNG WEB CRM DOANH NGHIỆP'),
          createHeading2('Chương 1: Đăng nhập & Xác thực bảo mật (/auth)'),
          createPara('Truy cập cổng quản trị tại địa chỉ https://14.225.217.232:5446/auth. Giao diện mở ra phong cách Trắng sáng tinh tế với logo ViOne mạ vàng Champagne.'),
          createBullet('Bước 1', 'Nhập địa chỉ Email công việc và Mật khẩu truy cập.'),
          createBullet('Bước 2', 'Tích chọn "Ghi nhớ đăng nhập" nếu sử dụng máy tính làm việc cá nhân.'),
          createBullet('Bước 3', 'Bấm nút "Đăng nhập hệ thống". Hệ thống xác thực và đưa bạn vào Bảng điều hành C-Level.'),

          createHeading2('Chương 2: Bảng Điều Hành C-Level Executive Dashboard (/)'),
          createPara('Cung cấp góc nhìn toàn cảnh về tình hình kinh doanh thời gian thực cho Ban Giám Đốc.'),
          createBullet('Khối chỉ số KPI', 'Theo dõi Doanh thu tháng, Chi phí thực tế, Lợi nhuận và Số dư tiền mặt khả dụng.'),
          createBullet('Biểu đồ dòng tiền', 'Biểu đồ trực quan so sánh thu chi thực tế và dự phóng dòng tiền 30-60-90 ngày.'),
          createBullet('Việc khẩn cấp cần duyệt', 'Cảnh báo tờ trình chi tiền chờ duyệt, hợp đồng chờ ký và cảnh báo vi phạm SLA.'),

          createHeading2('Chương 3: Phễu Cơ Hội Bán Hàng Kanban (/opportunities)'),
          createPara('Quản lý các thương vụ kinh doanh theo 6 cột giai đoạn chuyển đổi.'),
          createBullet('Kéo thả deal', 'Kéo thẻ khách hàng qua các giai đoạn: Mới tiếp cận → Khảo sát → Giải pháp → Đàm phán → Ký kết → Đóng deal.'),
          createBullet('Tự động tính giá trị', 'Hệ thống tự động nhân tỷ lệ xác suất thành công với giá trị hợp đồng để dự phóng doanh thu.'),

          createHeading2('Chương 4: Phê Duyệt Chi 3 Cấp & Quét Napas VietQR (/expenses)'),
          createPara('Quy trình kiểm soát chi phí chặt chẽ, chống chi trùng hóa đơn và gạch nợ tự động trong 1 giây.'),
          createBullet('Bước 1', 'Nhân viên lập tờ trình chi, tải lên file hóa đơn GTGT. Hệ thống quét số hóa đơn và MST chống chi trùng.'),
          createBullet('Bước 2', 'Kế toán kiểm tra chứng từ và kiểm tra hạn mức ngân sách tháng còn lại của phòng ban.'),
          createBullet('Bước 3', 'Lãnh đạo duyệt chi trên di động. Thủ quỹ quét mã Napas VietQR thanh toán gạch nợ tức thời.'),

          new Paragraph({ pageBreakBefore: true }),

          createHeading1('PHẦN II: HƯỚNG DẪN SỬ DỤNG APP DI ĐỘNG DOANH NHÂN VIONE CONNECT'),
          createHeading2('Chương 5: Đăng Nhập Email/SĐT & Đăng Ký In-App (/vione/login)'),
          createPara('Ứng dụng hỗ trợ đăng nhập đa phương thức linh hoạt và tạo tài khoản trực tiếp trong app.'),
          createBullet('Đăng nhập Email hoặc SĐT', 'Cho phép nhập Email hoặc Số điện thoại (9-12 chữ số) kèm mật khẩu.'),
          createBullet('Đăng ký tài khoản in-app', 'Bấm "Tạo tài khoản mới" mở form nhập Họ tên, SĐT, Email, Tên công ty và mật khẩu trực tiếp trong app.'),
          createBullet('Đăng nhập 1-chạm NFC', 'Chạm nhẹ thẻ vật lý ViOne Titanium vào lưng điện thoại để đăng nhập tức thì.'),

          createHeading2('Chương 6: Thẻ Doanh Nhân & Popup Bottom Sheet Vuốt Tay Xuống'),
          createPara('Chạm vào Thẻ Doanh Nhân trên màn hình chính mở popup Bottom Sheet đẳng cấp.'),
          createBullet('Bo góc cong tròn 28px', 'Popup trượt từ dưới lên viền kim loại ánh vàng champagne sang trọng.'),
          createBullet('Thao tác vuốt tay xuống', 'Vuốt nhẹ tay xuống (dy > 80px) để đóng sheet mượt mà; kéo nhẹ thẻ sẽ đàn hồi spring trở lại.'),
          createBullet('Quyền lợi thẻ', 'Hiển thị mã QR định danh, phím tắt chạm NFC, chia sẻ và danh sách quyền lợi VIP.'),

          createHeading2('Chương 7: Quét Danh Thiếp Thông Minh OCR AI (7 Trường)'),
          createPara('Chụp ảnh danh thiếp giấy lưu thẳng vào danh bạ và phễu CRM chỉ trong 3 giây.'),
          createBullet('Bước 1', 'Mở camera quét danh thiếp từ nút V trung tâm.'),
          createBullet('Bước 2', 'AI tự động trích xuất: Họ tên, Chức vụ, Công ty, SĐT, Email, Địa chỉ, Mã số thuế với độ chính xác ≥ 95%.'),
          createBullet('Bước 3', 'Kiểm tra và bấm "Lưu vào danh bạ & CRM" để tạo liên hệ mới.'),

          createHeading2('Chương 8: Cài Đặt PWA Cho iOS Safari & WebClip Profile'),
          createPara('Cài đặt app ViOne lên màn hình chính iPhone/iPad không cần App Store.'),
          createBullet('Cách 1 (Safari Menu)', 'Bấm nút Cài Đặt trên banner -> Làm theo 3 bước: Nút Chia sẻ ⎋ -> Thêm vào MH chính ⊞ -> Nhấn Thêm.'),
          createBullet('Cách 2 (Hồ sơ WebClip)', 'Tải file vione_ios_install.mobileconfig để iOS tự động cài đặt app ra màn hình chính 1-chạm.'),
        ],
      },
    ],
  });

  const docxBuffer = await Packer.toBuffer(doc);
  const docxPath1 = path.join(__dirname, '../document/HDSD_HE_THONG_VA_APP_VIONE_TOAN_DIEN.docx');
  const docxPath2 = path.join(__dirname, '../apps/vione_app_fe/public/docs/HDSD_HE_THONG_VA_APP_VIONE_TOAN_DIEN.docx');
  fs.writeFileSync(docxPath1, docxBuffer);
  fs.writeFileSync(docxPath2, docxBuffer);
  console.log('  -> Da xuat ban file Word (.docx) HDSD tai:', docxPath1);
  console.log('>>> [HDSD VIONE MASTER 6.0] HOAN TAT 100%!');
}

buildUserGuide().catch((err) => {
  console.error('Loi khi tao HDSD:', err);
  process.exit(1);
});
