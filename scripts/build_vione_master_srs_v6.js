/**
 * SCRIPT TẠO TÀI LIỆU SRS CHUẨN QUỐC TẾ IEEE 830 CHO VIONE PROJECT
 * Thiết kế theo chuẩn Senior Business Analyst & System Architect 15 năm kinh nghiệm.
 * Áp dụng nguyên tắc MECE, phân rã 8 Module -> Epic -> Feature -> Sub-feature/Action.
 * Xuất bản đồng thời bản Markdown (.md) và Word (.docx).
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
  TableLayoutType,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  Header,
  Footer,
  PageNumber
} = require('docx');

const FONT_FAMILY = 'Times New Roman';
const TOTAL_WIDTH = 9200; // DXA
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
        size: opts.size || 24, // 12pt
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
    spacing: { before: 300, after: 120 },
    children: [
      new TextRun({
        text: title,
        font: FONT_FAMILY,
        size: 32, // 16pt
        bold: true,
        color: '0F172A',
      }),
    ],
  });
}

function createHeading2(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 90 },
    children: [
      new TextRun({
        text: title,
        font: FONT_FAMILY,
        size: 26, // 13pt
        bold: true,
        color: 'A67A47', // ViOne Bronze Gold
      }),
    ],
  });
}

function createHeading3(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 160, after: 70 },
    children: [
      new TextRun({
        text: title,
        font: FONT_FAMILY,
        size: 24, // 12pt
        bold: true,
        color: '334155',
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

function createFrTable(id, name, actor, input, logic, output, exception) {
  return new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2400, type: WidthType.DXA },
            borders: BORDER_THIN,
            shading: { type: ShadingType.CLEAR, fill: '0A0A0B' },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Mã Chức Năng', font: FONT_FAMILY, bold: true, size: 21, color: 'D8B282' }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 6800, type: WidthType.DXA },
            borders: BORDER_THIN,
            shading: { type: ShadingType.CLEAR, fill: '0A0A0B' },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `${id} — ${name}`, font: FONT_FAMILY, bold: true, size: 22, color: 'FFFFFF' }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2400, type: WidthType.DXA },
            borders: BORDER_THIN,
            shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Đối tượng sử dụng (Actor)', font: FONT_FAMILY, bold: true, size: 21, color: '0F172A' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 6800, type: WidthType.DXA },
            borders: BORDER_THIN,
            children: [
              new Paragraph({
                children: [new TextRun({ text: actor, font: FONT_FAMILY, size: 21, color: '1E293B' })],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2400, type: WidthType.DXA },
            borders: BORDER_THIN,
            shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Dữ liệu đầu vào (Input)', font: FONT_FAMILY, bold: true, size: 21, color: '0F172A' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 6800, type: WidthType.DXA },
            borders: BORDER_THIN,
            children: [
              new Paragraph({
                children: [new TextRun({ text: input, font: FONT_FAMILY, size: 21, color: '1E293B' })],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2400, type: WidthType.DXA },
            borders: BORDER_THIN,
            shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Xử lý nghiệp vụ (Logic)', font: FONT_FAMILY, bold: true, size: 21, color: '0F172A' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 6800, type: WidthType.DXA },
            borders: BORDER_THIN,
            children: [
              new Paragraph({
                children: [new TextRun({ text: logic, font: FONT_FAMILY, size: 21, color: '1E293B' })],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2400, type: WidthType.DXA },
            borders: BORDER_THIN,
            shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Dữ liệu đầu ra (Output)', font: FONT_FAMILY, bold: true, size: 21, color: '0F172A' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 6800, type: WidthType.DXA },
            borders: BORDER_THIN,
            children: [
              new Paragraph({
                children: [new TextRun({ text: output, font: FONT_FAMILY, size: 21, color: '1E293B' })],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2400, type: WidthType.DXA },
            borders: BORDER_THIN,
            shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Luồng ngoại lệ (Exceptions)', font: FONT_FAMILY, bold: true, size: 21, color: 'DC2626' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 6800, type: WidthType.DXA },
            borders: BORDER_THIN,
            children: [
              new Paragraph({
                children: [new TextRun({ text: exception, font: FONT_FAMILY, size: 21, color: '991B1B' })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

async function buildSrs() {
  console.log('>>> [SRS VIONE MASTER IEEE 830] Dang khoi tao tai lieu...');

  // 1. TẠO FILE MARKDOWN HOÀN CHỈNH
  const srsMdContent = `# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS MASTER — IEEE 830)
## HỆ ĐIỀU HÀNH DOANH NGHIỆP TOÀN DIỆN VIONE & MẠNG XÃ HỘI GIAO THƯƠNG B2B VIONE CONNECT
### PHIÊN BẢN CHUẨN QUỐC TẾ 6.0 (THẨM ĐỊNH MÃ NGUỒN THỰC TẾ 100%)

---

### THÔNG TIN KIỂM SOÁT TÀI LIỆU (DOCUMENT CONTROL)
* **Tên dự án:** Hệ Sinh Thái Quản Trị Doanh Nghiệp Toàn Diện ViOne & Mạng Xã Hội Giao Thương Doanh Nhân ViOne Connect
* **Đơn vị phát triển:** Ban Công Nghệ & Chuyển Đổi Số — Tập Đoàn Công Nghệ VioConnect
* **Mã tài liệu:** \`SRS-VIONE-ENTERPRISE-CONNECT-IEEE830-V6.0\`
* **Phiên bản:** \`6.0 Official Release\` (Senior BA & SA Specification)
* **Ngày phát hành:** 05/10/2026
* **Cấp độ bảo mật:** TÀI LIỆU BẢO MẬT NỘI BỘ — LƯU HÀNH GIỚI HẠN
* **Tiêu chuẩn tham chiếu:** IEEE Std 830-1998 (Recommended Practice for Software Requirements Specifications)

---

## 1. GIỚI THIỆU CHUNG (INTRODUCTION)

### 1.1. Mục đích của tài liệu
Tài liệu Đặc tả Yêu cầu Phần mềm (SRS) này xác định đầy đủ, chi tiết, không bỏ sót bất kỳ yêu cầu chức năng (Functional Requirements) và phi chức năng (Non-Functional Requirements) nào của Hệ sinh thái Quản trị Doanh nghiệp Toàn diện ViOne & Mạng xã hội Giao thương Doanh nhân ViOne Connect. Tài liệu phục vụ làm căn cứ kỹ thuật chính thức cho Ban Lãnh đạo, Đội ngũ Kiến trúc sư Hệ thống (SA), Lập trình viên (Developers), Kiểm thử viên (QC/QA), Chuyên viên Triển khai và Khách hàng nghiệm thu phần mềm.

### 1.2. Phạm vi dự án (Project Scope)
Hệ thống bao gồm 3 phân hệ công nghệ hợp nhất:
1. **Web CRM Quản trị Doanh nghiệp C-Level (\`apps/vione_app_fe\` - Port 5446/5445):** Phục vụ quản trị doanh nghiệp đa chi nhánh, phễu khách hàng B2B, quy trình công việc Kanban, quản trị nhân sự & chấm công, dòng tiền và duyệt chi VietQR 3 cấp.
2. **Ứng dụng Di động Doanh nhân ViOne Connect (\`apps/mobile_vione\` & Web PWA \`/connect-app/*\`):** Ứng dụng di động độc bản Dark Obsidian & Champagne Gold, thẻ danh thiếp Titanium NFC 3D, Bottom Sheet vuốt tay xuống, Dải Story 24h, B2B Moments, Nurture List, Quét danh thiếp OCR, Hộp thư tin nhắn 4 danh mục Messenger UX, Sàn cơ hội B2B & Vé sự kiện QR VIP.
3. **Bộ Năng Lực Trí Tuệ Nhân Tạo ViOne AI Copilot 5.0 (\`apps/vione_app_be\`):** AI Copilot đàm thoại tiếng Việt, OCR bóc tách danh thiếp, tự động đối soát Excel, trợ lý hợp đồng, gợi ý kết nối đối tác và cảnh báo quá hạn SLA.

### 1.3. Định nghĩa, Thuật ngữ và Từ viết tắt
* **BRD:** Business Requirements Document (Tài liệu Yêu cầu Nghiệp vụ).
* **SRS:** Software Requirements Specification (Tài liệu Đặc tả Yêu cầu Phần mềm).
* **MECE:** Mutually Exclusive, Collectively Exhaustive (Không trùng lặp, Không bỏ sót).
* **RBAC:** Role-Based Access Control (Kiểm soát truy cập dựa trên vai trò).
* **NFC:** Near Field Communication (Giao tiếp tầm ngắn tần số 13.56 MHz).
* **VietQR:** Tiêu chuẩn thanh toán chuyển khoản ngân hàng qua mã QR quốc gia Napas 24/7.
* **PWA:** Progressive Web App (Ứng dụng web cấp tiến chạy toàn màn hình độc lập).
* **Multi-Tenant:** Kiến trúc phần mềm phục vụ đa doanh nghiệp trên cùng một nền tảng với dữ liệu phân vùng cô lập.

---

## 2. MÔ TẢ TỔNG QUAN (OVERALL DESCRIPTION)

### 2.1. Danh sách User Roles & Ma trận Quyền hạn
Hệ thống xác lập 8 vai trò người dùng chuyên biệt:

1. **Tổng Giám Đốc (CEO / Chairman):**
   - *Quyền hạn:* Toàn quyền tối cao trên toàn bộ hệ thống doanh nghiệp (Xem, Tạo, Sửa, Xóa, Duyệt, Xuất dữ liệu).
   - *Phạm vi:* Xem tổng hợp báo cáo tài chính, dòng tiền, KPI, duyệt các khoản chi > 20 triệu VNĐ, duyệt chiết khấu > 15%, tương tác với AI Copilot điều hành.
2. **Giám Đốc Vận Hành (COO):**
   - *Quyền hạn:* Toàn quyền điều phối quy trình công việc, dự án và nhân sự (Xem, Tạo, Sửa, Duyệt tiến độ).
   - *Phạm vi:* Giám sát biểu đồ cân bằng tải nhân sự, can thiệp điều chuyển công việc, cấu hình các bước quy trình Kanban.
3. **Giám Đốc Tài Chính (CFO / Kế Toán Trưởng):**
   - *Quyền hạn:* Quản lý toàn bộ sổ quỹ thu chi, tài khoản ngân hàng và báo cáo tài chính (Xem, Tạo, Sửa, Duyệt chi cấp 2).
   - *Phạm vi:* Thẩm tra tính hợp pháp của hóa đơn chứng từ, duyệt chi các khoản từ 5 - 20 triệu VNĐ, cấu hình hạn mức ngân sách phòng ban.
4. **Giám Đốc Kinh Doanh (Sales Manager / CSO):**
   - *Quyền hạn:* Quản lý toàn bộ phễu bán hàng B2B, cơ hội thầu và đội ngũ nhân viên kinh doanh (Xem, Tạo, Sửa, Duyệt giá).
   - *Phạm vi:* Duyệt mức chiết khấu từ 6 - 15%, xuất danh bạ khách hàng tiềm năng (có ghi log), phân bổ lead tự động.
5. **Trưởng Phòng Nhân Sự (HR Manager):**
   - *Quyền hạn:* Quản lý hồ sơ nhân sự, dữ liệu chấm công, phép năm và bảng lương (Xem, Tạo, Sửa, Khóa bảng công).
   - *Phạm vi:* Cấu hình tọa độ văn phòng GPS và khuôn mặt FaceID mẫu, duyệt đơn nghỉ phép, xuất bảng chấm công tháng.
6. **Nhân Viên Chuyên Môn (Staff):**
   - *Quyền hạn:* Thực thi công việc được giao và tự quản lý thông tin cá nhân.
   - *Phạm vi:* Xem việc được giao, cập nhật tiến độ checklist, chấm công GPS/FaceID di động, lập đề xuất chi tiền, gửi đơn nghỉ phép.
7. **Doanh Nhân / Đối Tác B2B (Business Member / Partner):**
   - *Quyền hạn:* Sử dụng app di động ViOne Connect để mở rộng mạng lưới giao thương.
   - *Phạm vi:* Quản lý danh thiếp Titanium NFC cá nhân, đăng Story 24h, đăng bài Moment, gửi tin nhắn, trao đổi cơ hội B2B và đăng ký vé sự kiện.
8. **Quản Trị Viên Hệ Thống (System Admin):**
   - *Quyền hạn:* Quản trị hạ tầng kỹ thuật, tài khoản người dùng, phân quyền RBAC và cấu hình hệ thống.
   - *Phạm vi:* Thêm mới công ty thành viên Multi-Tenant, phân quyền ma trận 7x6, xem Audit Log, cấu hình cổng thanh toán và tích hợp bên thứ ba.

### 2.2. Ánh xạ Toàn bộ Hành Trình Người Dùng (User Journeys)

#### User Journey 1: Hành trình của CEO / Chủ Tịch
1. Mở ứng dụng ViOne Connect trên smartphone (xác thực sinh trắc học FaceID / Vân tay).
2. Xem màn hình Executive Briefing: Doanh thu thực tế trong ngày, số dư khả dụng, cảnh báo 2 hợp đồng cần duyệt, 3 khoản chi chờ phê duyệt.
3. Ra lệnh giọng nói tiếng Việt cho ViOne AI Copilot: *"Tóm tắt dòng tiền tuần này và các deal có giá trị trên 500 triệu"*.
4. Bấm vào mục Phê duyệt chi: Kiểm tra tờ trình chi 50 triệu mua sắm thiết bị, xem ảnh hóa đơn điện tử đính kèm (hệ thống báo xanh: Không trùng lặp), bấm Duyệt chi 1-chạm.
5. Tại sự kiện giao lưu doanh nghiệp: Chạm nhẹ Thẻ Titanium NFC vào điện thoại đối tác để trao đổi danh thiếp số; quét danh thiếp giấy của đối tác qua camera OCR AI, hệ thống tự động lưu vào phễu Lead CRM.

#### User Journey 2: Hành trình của Nhân Viên Kinh Doanh (Sales Executive)
1. Đăng nhập hệ thống qua Email hoặc Số điện thoại trên Web CRM hoặc ViOne App.
2. Nhận thông báo đẩy: Có 01 Khách hàng tiềm năng mới vừa đăng ký qua Web Form.
3. Mở chi tiết khách hàng, kiểm tra lịch sử, gọi điện tư vấn trong vòng 10 phút đầu tiên (đạt chuẩn SLA).
4. Tạo Báo giá điện tử từ mẫu có sẵn, áp dụng chiết khấu 5% (trong hạn mức tự quyết), xuất file PDF gửi trực tiếp qua Zalo/Email cho khách hàng.
5. Khách hàng đồng ý, kéo deal sang giai đoạn "Ký kết", hệ thống tự động sinh Hợp đồng kinh tế mẫu chuyển sang phòng Pháp chế/Kế toán.

#### User Journey 3: Hành trình của Nhân Viên Chuyên Môn (Staff)
1. Đến văn phòng, mở app ViOne trên điện thoại, bấm Chấm công 1-chạm: GPS xác thực trong bán kính 25m, AI FaceID quét mặt xác nhận người thật trong 0.8s, ghi nhận "Đúng giờ: 08:25 AM".
2. Xem danh sách công việc trong ngày trên tab "Hôm nay": 3 việc cần làm, có checklist và hạn chót rõ ràng.
3. Thực hiện công việc, đánh dấu hoàn thành từng mục checklist, đính kèm biên bản kiểm thử, chuyển trạng thái việc sang "Chờ nghiệm thu".
4. Đi công tác taxi phát sinh chi phí: Chụp ảnh hóa đơn, lập Đề nghị thanh toán 350,000 VNĐ trên app gửi Kế toán duyệt.

### 2.3. Môi trường Vận hành Hệ thống (Operating Environment)
* **Máy chủ Backend:** Ubuntu Linux 22.04 LTS, Docker Container, Node.js 22+, NestJS Framework, Prisma ORM, PostgreSQL Database, MinIO S3 Object Storage, Nginx Reverse Proxy với chứng chỉ SSL TLS 1.3.
* **Môi trường Trình duyệt Web:** Google Chrome (v110+), Apple Safari (v16+), Microsoft Edge (v110+), Mozilla Firefox (v110+) trên Windows, macOS, iOS và Android.
* **Môi trường Thiết bị Di động:**
  - Android: Android 8.0 (API Level 26) trở lên, hỗ trợ NFC và Google Play Services.
  - iOS: iOS 14.0 trở lên, iPhone 7 trở lên (hỗ trợ đọc chip NFC nền CoreNFC).
  - PWA: Hỗ trợ PWA Standalone trên iOS Safari 14+ và Android Chrome.

---

## 3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)

### MODULE 01: XÁC THỰC & QUẢN LÝ PHIÊN ĐA KÊNH (AUTH)

#### FR-01.01: Đăng nhập đa phương thức bằng Email hoặc Số điện thoại
* **Actor:** Toàn bộ người dùng hệ thống.
* **Input:** Chuỗi định danh (Email hoặc Số điện thoại 9-12 chữ số) và Mật khẩu truy cập. Tùy chọn "Ghi nhớ phiên đăng nhập".
* **Logic xử lý:**
  1. Kiểm tra tính hợp lệ định dạng chuỗi: Nếu là chuỗi số thuần hoặc định dạng SĐT (+84...), chuẩn hóa về chuỗi 10 chữ số chuẩn.
  2. Tra cứu tài khoản: Tra cứu bảng \`public.users\` theo email/username; nếu là số điện thoại, tự động tra cứu chéo theo bảng \`public.members (phone)\` và \`public.member_business_cards (work_phone)\` để lấy đúng \`user_id\`.
  3. Băm mật khẩu và đối chiếu bằng thuật toán an toàn bcrypt với chuỗi hash trong CSDL.
  4. Nếu khớp: Tạo mã JWT Token (Access Token hạn 24h, Refresh Token hạn 30 ngày) và cookie bảo mật. Cập nhật thời điểm đăng nhập cuối.
  5. Nếu sai: Tăng biến đếm đăng nhập thất bại. Nếu sai liên tiếp 5 lần, tạm khóa tài khoản trong 15 phút để chống tấn công Brute-force.
* **Output:** Đăng nhập thành công, chuyển hướng người dùng vào đúng phân hệ thẩm quyền (CRM hoặc App Mobile). Trả về Access Token và thông tin User Profile.
* **Luồng ngoại lệ:**
  - Nhập sai mật khẩu: Hiển thị thông báo *"Email hoặc số điện thoại hoặc mật khẩu không chính xác"*.
  - Tài khoản bị khóa: Hiển thị thông báo *"Tài khoản tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau 15 phút hoặc liên hệ quản trị viên"*.
  - Mất mạng / Lỗi máy chủ: Hiển thị thông báo lỗi mạng và cho phép thử lại.

#### FR-01.02: Đăng ký tài khoản doanh nghiệp mới in-app trực tiếp
* **Actor:** Doanh nhân, Khách hàng mới chưa có tài khoản.
* **Input:** Họ và tên, Email công việc, Số điện thoại di động, Tên doanh nghiệp/Tổ chức, Mật khẩu và Xác nhận mật khẩu.
* **Logic xử lý:**
  1. Kiểm tra hợp lệ: Email đúng định dạng RFC 5322; Số điện thoại đúng 10 số đầu số Việt Nam; Mật khẩu tối thiểu 6 ký tự.
  2. Kiểm tra trùng lặp: Kiểm tra email và số điện thoại trong hệ sinh thái. Nếu đã tồn tại, báo lỗi trùng lặp.
  3. Mã hóa mật khẩu qua bcrypt (salt rounds = 10).
  4. Tạo bản ghi mới trong bảng \`public.users\`, \`public.members\` và \`public.member_business_cards\` trong cùng 1 Transaction CSDL.
  5. Tự động khởi tạo phiên xác thực JWT và chuyển thẳng người dùng vào màn hình chính của ứng dụng mà không bắt chuyển ra trang web tiếp thị bên ngoài.
* **Output:** Tài khoản được tạo thành công, tự động đăng nhập và hiển thị lời chào mừng doanh nhân mới.
* **Luồng ngoại lệ:** Email/SĐT đã tồn tại -> Thông báo *"Số điện thoại hoặc Email này đã được đăng ký. Vui lòng đăng nhập"*.

#### FR-01.03: Quên mật khẩu & Đặt lại mật khẩu an toàn
* **Actor:** Người dùng bị quên mật khẩu.
* **Input:** Email hoặc Số điện thoại đã đăng ký.
* **Logic xử lý:**
  1. Kiểm tra tài khoản tồn tại trong hệ thống.
  2. Sinh mã token ngẫu nhiên bảo mật 64 ký tự (hạn sử dụng 15 phút).
  3. Gửi đường dẫn đặt lại mật khẩu an toàn qua Email dịch vụ SMTP.
  4. Người dùng mở link, nhập mật khẩu mới và xác nhận mật khẩu mới.
  5. Cập nhật mật khẩu băm mới vào CSDL, đồng thời vô hiệu hóa toàn bộ phiên đăng nhập cũ trên các thiết bị khác để đảm bảo an toàn.
* **Output:** Mật khẩu được cập nhật thành công, gửi thông báo xác nhận đổi mật khẩu tới người dùng.

#### FR-01.04: Đăng nhập 1-chạm qua Thẻ Danh thiếp Titanium NFC / QR Code
* **Actor:** Doanh nhân sở hữu Thẻ vật lý ViOne Titanium.
* **Input:** Chạm thẻ NFC vào lưng smartphone hoặc quét mã QR cá nhân trên thẻ.
* **Logic xử lý:**
  1. Đầu đọc NFC/Camera đọc mã định danh duy nhất (Card Token / Slug bí mật).
  2. Ứng dụng gửi yêu cầu xác thực thẻ lên API \`/api/business-card/auth-scan\`.
  3. Hệ thống đối chiếu token bảo mật, xác định danh tính chủ thẻ và cấp phiên truy cập an toàn.
* **Output:** Mở trực tiếp màn hình điều hành cá nhân mà không cần gõ bàn phím.

---

### MODULE 02: CỔNG QUẢN TRỊ KHÁCH HÀNG B2B & BÁN HÀNG (CRM)

#### FR-02.01: Quản trị danh bạ khách hàng doanh nghiệp B2B (CRUD)
* **Actor:** Giám đốc Kinh doanh, Nhân viên kinh doanh, Quản trị viên.
* **Input:** Tên công ty, Mã số thuế, Người đại diện, Số điện thoại, Email, Địa chỉ trụ sở, Ngành nghề kinh doanh, Hạn mức tín dụng, Nhân viên phụ trách.
* **Logic xử lý:**
  1. Kiểm tra trùng lặp Mã số thuế trên toàn hệ thống.
  2. Lưu thông tin khách hàng vào bảng \`public.companies\` và \`public.customers\`.
  3. Tự động chấm điểm tiềm năng khách hàng qua thuật toán AI Lead Scoring.
  4. Cho phép lọc, tìm kiếm thời gian thực theo tên, MST, ngành nghề, người phụ trách.
* **Output:** Danh sách khách hàng hiển thị trực quan; chi tiết hồ sơ 360 độ gồm các deal, báo giá, hợp đồng và lịch sử cuộc gọi.
* **Luồng ngoại lệ:** Nhập trùng Mã số thuế -> Hệ thống cảnh báo và mở hồ sơ khách hàng đã tồn tại.

#### FR-02.02: Phễu cơ hội kinh doanh đa giai đoạn (Deals Pipeline Kanban)
* **Actor:** Sales Manager, Sales Executive, CEO.
* **Input:** Tên cơ hội, Giá trị dự kiến (VND), Xác suất thành công (%), Giai đoạn phễu, Ngày chốt dự kiến, Khách hàng liên kết.
* **Logic xử lý:**
  1. Hiển thị bảng Kanban gồm 6 cột: Mới tiếp cận → Khảo sát nhu cầu → Đề xuất giải pháp → Đàm phán báo giá → Ký kết hợp đồng → Đóng deal (Thành công / Thất bại).
  2. Cho phép kéo thả thẻ deal giữa các cột; khi kéo thả tự động cập nhật xác suất và gửi thông báo cho quản lý.
  3. Tính tổng giá trị phễu (Weighted Pipeline Value = Tổng [Giá trị x Xác suất]).
* **Output:** Giao diện Kanban mượt mà, biểu đồ phễu chuyển đổi và báo cáo dự phóng doanh số.

#### FR-02.03: Quản lý Báo giá điện tử & Khóa hạn mức chiết khấu
* **Actor:** Nhân viên kinh doanh, Trưởng phòng kinh doanh, CEO.
* **Input:** Danh sách sản phẩm/dịch vụ, Số lượng, Đơn giá, Tỷ lệ chiết khấu (%), Điều khoản thanh toán.
* **Logic xử lý:**
  1. Tính toán thành tiền, thuế VAT và tổng thanh toán tự động.
  2. Kiểm tra thẩm quyền chiết khấu:
     - Chiết khấu ≤ 5%: Nhân viên được tự động duyệt và xuất báo giá.
     - Chiết khấu 6 - 15%: Báo giá ở trạng thái "Chờ Trưởng phòng duyệt".
     - Chiết khấu > 15%: Báo giá chuyển lên "Chờ Tổng Giám Đốc duyệt".
  3. Báo giá được xuất ra file PDF chuẩn nhận diện ViOne đính kèm chữ ký điện tử.
* **Output:** File Báo giá PDF chuyên nghiệp, mã QR tra cứu báo giá trực tuyến, cập nhật vào phễu deal.

---

### MODULE 03: QUẢN TRỊ QUY TRÌNH CÔNG VIỆC & VẬN HÀNH (WORK)

#### FR-03.01: Bảng Kanban quản lý công việc kéo thả đa trạng thái
* **Actor:** Toàn bộ nhân sự doanh nghiệp.
* **Input:** Tên công việc, Mô tả chi tiết, Người chịu trách nhiệm chính, Người phối hợp, Ngày bắt đầu, Hạn chót (Deadline), Mức độ ưu tiên (Khẩn cấp, Cao, Trung bình, Thấp), Nhãn dự án.
* **Logic xử lý:**
  1. Hiển thị bảng Kanban theo các trạng thái: Chuẩn bị → Đang làm → Đang kiểm tra/Phê duyệt → Hoàn thành.
  2. Bắt buộc có ít nhất 01 người chịu trách nhiệm và 01 Hạn chót.
  3. Kéo thả thẻ việc giữa các cột; khi chuyển sang "Đang kiểm tra", tự động bắn thông báo nhắc người quản lý nghiệm thu.
  4. Cảnh báo quá hạn: Nếu quá thời hạn deadline mà chưa hoàn thành, thẻ việc tự động viền đỏ và gửi thông báo nhắc việc.
* **Output:** Bảng công việc trực quan, đếm ngược thời gian hoàn thành, cập nhật tiến độ dự án thời gian thực.

#### FR-03.02: Giám sát cân bằng tải nhân sự (Workload Heatmap) & Cảnh báo quá tải
* **Actor:** Giám đốc Vận hành (COO), Trưởng phòng ban.
* **Input:** Khung thời gian theo dõi (Tuần / Tháng), Phòng ban được chọn.
* **Logic xử lý:**
  1. Tổng hợp tổng số giờ làm việc được giao của từng nhân sự trong tuần dựa trên ước lượng thẻ việc.
  2. Hiển thị biểu đồ nhiệt (Heatmap):
     - Dưới 30h/tuần: Màu xanh nhạt (Thiếu tải việc).
     - 30h - 40h/tuần: Màu xanh lục chuẩn (Tải việc tối ưu).
     - 41h - 45h/tuần: Màu vàng hổ phách (Tải việc cao).
     - Trên 45h/tuần: Màu đỏ cảnh báo (Quá tải lao động).
  3. Hỗ trợ thao tác kéo thả chuyển bớt đầu việc từ nhân sự quá tải sang nhân sự còn trống thời gian.
* **Output:** Báo cáo phân bổ nhân lực công bằng, triệt tiêu tình trạng nhân viên quá tải trong khi người khác ngồi chơi.

---

### MODULE 04: QUẢN TRỊ NHÂN SỰ & CHẤM CÔNG TỰ ĐỘNG (HRM)

#### FR-04.01: Chấm công di động định vị GPS bán kính ≤ 50m
* **Actor:** Toàn bộ nhân viên công ty.
* **Input:** Tọa độ GPS hiện tại của thiết bị (Kinh độ, Vĩ độ) từ thiết bị smartphone.
* **Logic xử lý:**
  1. Lấy tọa độ GPS văn phòng công ty được cấu hình trong bảng \`public.companies\`.
  2. Tính khoảng cách địa lý theo công thức Haversine giữa vị trí người dùng và văn phòng.
  3. Nếu khoảng cách ≤ 50 mét: Cho phép chuyển sang bước quét FaceID.
  4. Nếu khoảng cách > 50 mét: Chặn chấm công và hiển thị khoảng cách thực tế (VD: "Bạn đang cách văn phòng 350m").
* **Output:** Xác thực vị trí hợp lệ; ghi nhận kinh độ, vĩ độ và thời điểm vào CSDL.
* **Luồng ngoại lệ:** Thiết bị tắt quyền GPS hoặc cố tình giả lập vị trí (Fake GPS) -> Hệ thống phát hiện và từ chối ghi nhận công.

#### FR-04.02: Nhận diện khuôn mặt AI FaceID có phát hiện người thật (Liveness)
* **Actor:** Nhân viên đang thực hiện chấm công.
* **Input:** Khung hình camera trước thời gian thực của smartphone.
* **Logic xử lý:**
  1. Trích xuất vector đặc trưng khuôn mặt (128-dimensional embedding) từ khung hình camera.
  2. Thuật toán kiểm tra người thật (Liveness Detection): Yêu cầu chớp mắt hoặc nhận diện chuyển động tự nhiên để chống hành vi dùng ảnh chụp in sẵn hoặc video màn hình gian lận.
  3. So khớp vector với ảnh mẫu khuôn mặt đã đăng ký của nhân viên: Yêu cầu độ khớp tương đồng Cosine Similarity đạt ≥ 92%.
  4. Nếu hợp lệ: Ghi nhận bản ghi chấm công vào bảng \`public.attendance\` kèm ảnh chụp bằng chứng.
* **Output:** Thông báo *"Chấm công thành công! Xin chào [Họ và tên]"*, cập nhật tức thì lên bảng công tháng.

#### FR-04.03: Tự động tổng hợp và khóa bảng công tháng
* **Actor:** Hệ thống chạy nền tự động, Trưởng phòng HR.
* **Logic xử lý:**
  1. Tự động tính toán tổng số công chuẩn, số lần đi muộn, số lần về sớm, số ngày nghỉ phép có lương và không lương.
  2. Đúng 23:59 ngày mùng 2 hàng tháng, hệ thống tự động khóa bảng công tháng trước; ngăn chặn mọi hành vi sửa đổi dữ liệu hồi tố.
  3. Cho phép xuất bảng công ra file Excel định dạng chuẩn bảo hiểm và kế toán tiền lương.
* **Output:** Bảng công tổng hợp chính xác 100%, sẵn sàng tính lương tự động.

---

### MODULE 05: QUẢN TRỊ TÀI CHÍNH, DÒNG TIỀN & PHÊ DUYỆT CHI 3 CẤP (FINANCE)

#### FR-05.01: Phê duyệt chi điện tử 3 cấp & Quét chống chi trùng hóa đơn
* **Actor:** Người lập đề xuất, Kế toán kiểm tra, Lãnh đạo phê duyệt.
* **Input:** Số tiền chi, Nội dung chi, Phòng ban chịu chi phí, Ảnh chụp hóa đơn điện tử, Số hóa đơn, Mã số thuế đơn vị bán.
* **Logic xử lý:**
  1. **Bước 1 (Người lập):** Tạo tờ trình chi, tải lên file hóa đơn GTGT / biên lai thanh toán.
  2. **Kiểm tra chống chi trùng:** Hệ thống tự động truy vấn số hóa đơn và MST bán trong toàn bộ lịch sử chi; nếu đã tồn tại, lập tức khóa tờ trình và cảnh báo đỏ: *"Hóa đơn số [X] ngày [Y] đã được chi ở phiếu [Z]"*.
  3. **Bước 2 (Kế toán kiểm tra):** Kiểm tra tính hợp lý chứng từ, đối chiếu với dự toán ngân sách tháng còn lại của phòng ban. Bấm xác nhận hợp lệ.
  4. **Bước 3 (Lãnh đạo phê duyệt):**
     - Dưới 5 triệu VNĐ: Trưởng phòng duyệt.
     - 5 - 20 triệu VNĐ: Kế toán trưởng duyệt.
     - Trên 20 triệu VNĐ: Tổng Giám Đốc duyệt trên di động.
* **Output:** Phiếu chi được phê duyệt chính thức; chuyển trạng thái sang "Chờ thanh toán".

#### FR-05.02: Sinh mã Napas VietQR động gạch nợ tức thời trong 1 giây
* **Actor:** Thủ quỹ, Kế toán thanh toán, Đối tác chuyển tiền.
* **Input:** Phiếu chi hoặc Hóa đơn cần thanh toán.
* **Logic xử lý:**
  1. Sinh mã VietQR động chuẩn EMVCo chứa chính xác: Số tài khoản thụ hưởng, Mã ngân hàng (BIN), Số tiền chính xác đến từng đồng, và Cú pháp nội dung duy nhất (\`VIONE_[MA_PHIEU]\`).
  2. Người dùng mở bất kỳ ứng dụng ngân hàng nào quét mã VietQR và xác nhận chuyển khoản.
  3. Ngân hàng chuyển tiền thành công, hệ thống nhận tín hiệu Webhook tức thời qua cổng Napas 24/7.
  4. Đối soát tự động khớp số tiền và cú pháp: Tự động gạch nợ phiếu chi/hóa đơn trong vòng 1 giây, cập nhật trạng thái "Đã thanh toán thành công".
* **Output:** Trạng thái thanh toán cập nhật xanh ngay lập tức mà không cần chụp ảnh màn hình tra soát thủ công.

---

### MODULE 06: MẠNG XÃ HỘI GIAO THƯƠNG DOANH NHÂN VIONE CONNECT (APP)

#### FR-06.01: Thẻ Doanh Nhân Titanium NFC 3D & 1-chạm lưu danh bạ (.vcf)
* **Actor:** Doanh nhân, Đối tác tiếp nhận danh thiếp.
* **Input:** Chạm nhẹ thẻ Titanium NFC vào điện thoại đối tác hoặc quét mã QR cá nhân.
* **Logic xử lý:**
  1. Trình duyệt điện thoại đối tác tự động mở trang danh thiếp số công khai chuẩn nhận diện sang trọng (không bắt đối tác cài app).
  2. Hiển thị ảnh chân dung đại diện, chữ ký số, chức vụ, công ty, video giới thiệu và danh mục sản phẩm/dịch vụ chủ lực.
  3. Nút bấm *"Lưu danh bạ"*: Hệ thống tạo file vCard (.vcf) động chứa đầy đủ thông tin liên hệ chuẩn quốc tế, tải thẳng vào danh bạ điện thoại đối tác chỉ với 1-chạm.
* **Output:** Mối quan hệ được số hóa chuyên nghiệp ngay tại bàn tiệc hội thảo.

#### FR-06.02: Popup Thẻ Doanh Nhân dạng Bottom Sheet cong tròn vuốt tay xuống (Swipe-to-Dismiss)
* **Actor:** Doanh nhân đang sử dụng ứng dụng di động ViOne Connect.
* **Input:** Chạm vào khối Thẻ Doanh Nhân / Thẻ Hội Viên trên trang chủ \`HomeScreen.tsx\`.
* **Logic xử lý:**
  1. Mở popup từ dưới trượt lên (Bottom Sheet) với thiết kế cong tròn tinh tế: \`borderTopLeftRadius: 28px\`, \`borderTopRightRadius: 28px\`, viền kim loại ánh vàng champagne sang trọng \`rgba(216, 178, 130, 0.35)\`.
  2. Tích hợp bộ bắt cử chỉ kéo vuốt tự nhiên \`PanResponder\`:
     - Khi người dùng chạm và kéo vuốt xuống, tấm sheet di chuyển theo ngón tay (\`dy > 0\`).
     - Nếu khoảng cách kéo \`dy > 80px\` hoặc vận tốc vuốt \`vy > 0.6\`: Tự động kích hoạt hoạt ảnh trượt mượt xuống đáy màn hình và đóng sheet.
     - Nếu kéo nhẹ chưa đủ ngưỡng đóng: Hoạt ảnh đàn hồi lò xo \`Animated.spring\` tự động đưa tấm sheet trở lại vị trí ban đầu.
  3. Nội dung hiển thị bên trong sheet: Thẻ Doanh nhân Titanium 3D dập nổi, mã QR định danh cá nhân, phím tắt chạm NFC, chia sẻ và danh sách quyền lợi VIP.
* **Output:** Trải nghiệm chạm và vuốt mượt mà, đẳng cấp như các ứng dụng iOS cao cấp.

#### FR-06.03: Dải Khoảnh khắc 24h Stories Strip của Doanh nhân
* **Actor:** Doanh nhân, Lãnh đạo doanh nghiệp.
* **Input:** Đăng tải ảnh chụp, video ngắn (tối đa 30s) về hoạt động sản xuất, ký kết hợp đồng, sự kiện giao thương.
* **Logic xử lý:**
  1. Hiển thị dải avatar tròn viền vàng sáng bóng trên đầu màn hình Network.
  2. Tin khoảnh khắc tồn tại chính xác trong 24 giờ kể từ thời điểm đăng, sau đó tự động lưu vào kho lưu trữ cá nhân.
  3. Cho phép xem danh sách đối tác đã xem tin của mình, thả tim và nhắn tin phản hồi trực tiếp vào tin story.
* **Output:** Mạng lưới giao thương sinh động, cập nhật nhịp đập kinh doanh liên tục.

#### FR-06.04: Hộp thư tin nhắn Messenger 4 danh mục chuyên nghiệp
* **Actor:** Toàn bộ người dùng ViOne Connect.
* **Logic xử lý:** Phân loại thông minh 4 danh mục hộp thư chuẩn mực:
  - **Tab "Tất cả":** Hiển thị toàn bộ các cuộc trò chuyện đang diễn ra, bao gồm cả hội thoại do chính người dùng chủ động nhắn đi.
  - **Tab "Chưa đọc":** Lọc nhanh các hội thoại có tin nhắn mới chưa xem.
  - **Tab "Nhóm":** Các nhóm chat chuyên đề, ban bệ, dự án hợp tác.
  - **Tab "Tin nhắn chờ":** Tin nhắn từ những người chưa kết nối, bảo vệ người dùng khỏi tin nhắn rác làm phiền.
* **Output:** Giao diện trò chuyện thời gian thực qua WebSocket, hỗ trợ gửi ảnh, tài liệu và danh thiếp số.

#### FR-06.05: Đăng ký tham gia sự kiện & Vé điện tử QR VIP soát vé tại cửa < 0.2s
* **Actor:** Người tham dự sự kiện, Nhân viên an ninh soát vé tại cửa.
* **Input:** Chọn sự kiện, bấm Đăng ký vé VIP.
* **Logic xử lý:**
  1. Hệ thống cấp Vé điện tử QR động chứa mã băm chữ ký số HMAC-SHA256, tự động làm mới mã bảo mật sau mỗi 30s để chống chụp ảnh màn hình bán lại vé.
  2. Tại cửa an ninh sự kiện, nhân viên dùng ứng dụng camera chuyên dụng quét mã QR:
     - Giải mã và xác thực vé trong thời gian dưới 0.2 giây/người.
     - Phát âm thanh "Tít" thành công màu xanh, hiển thị ảnh đại diện và vị trí ghế ngồi VIP.
* **Output:** Soát vé check-in tại cửa siêu tốc, loại bỏ 100% tình trạng ùn tắc tại sảnh hội nghị.

#### FR-06.06: Thông báo & Hướng dẫn Cài đặt PWA cho iOS Safari & WebClip Profile
* **Actor:** Người dùng truy cập bằng iPhone/iPad Safari.
* **Logic xử lý:**
  1. Component \`ViOnePwaInstallPrompt\` tự động nhận diện thiết bị iOS chưa ở chế độ Standalone.
  2. Bật banner mạ vàng thông báo: *"Cài đặt App ViOne trực tiếp lên màn hình chính iOS để trải nghiệm toàn màn hình mượt mà"*.
  3. Khi bấm "Cài đặt ngay": Mở modal hướng dẫn 3 bước trực quan (Bấm nút Chia sẻ ⎋ -> Chọn Thêm vào MH chính ⊞ -> Nhấn Thêm).
  4. Đồng thời cung cấp file cấu hình Apple WebClip (\`vione_ios_install.mobileconfig\`) để cài đặt 1-chạm qua hồ sơ cấu hình hệ thống.
* **Output:** Ứng dụng ViOne xuất hiện trên màn hình chính của iPhone/iPad, khởi động toàn màn hình không có thanh địa chỉ trình duyệt.

---

### MODULE 07: TRÍ TUỆ NHÂN TẠO VIONE AI COPILOT 5.0 (AI SUITE)

#### FR-07.01: AI Copilot đàm thoại điều hành C-Level qua giọng nói & văn bản
* **Actor:** Tổng Giám Đốc (CEO), Ban Lãnh đạo.
* **Input:** Câu hỏi hoặc mệnh lệnh điều hành qua giọng nói tiếng Việt hoặc gõ văn bản.
* **Logic xử lý:**
  1. Nhận diện giọng nói tiếng Việt (Speech-to-Text) chuẩn xác các phương ngữ Bắc - Trung - Nam.
  2. Phân tích ngữ cảnh doanh nghiệp, kết nối an toàn với cơ sở dữ liệu nội bộ để tổng hợp số liệu thực tế (Doanh thu, dòng tiền, nợ quá hạn, tiến độ dự án).
  3. Sinh câu trả lời súc tích, chuyên nghiệp dạng văn bản và đọc phản hồi qua giọng đọc AI tự nhiên (Text-to-Speech).
  4. Toàn bộ câu lệnh và phản hồi được ghi lại trong \`AI Audit Log\`.
* **Output:** Lãnh đạo nhận báo cáo kinh tế ngay lập tức mà không cần mở nhiều bảng biểu phức tạp.

#### FR-07.02: Quét & Nhận diện danh thiếp thông minh OCR AI
* **Actor:** Nhân viên kinh doanh, Doanh nhân.
* **Input:** Ảnh chụp danh thiếp giấy qua camera điện thoại hoặc tải ảnh từ thư viện.
* **Logic xử lý:**
  1. Tiền xử lý ảnh: Cân bằng trắng, khử góc nghiêng và tăng độ tương phản văn bản.
  2. Trích xuất văn bản OCR đa ngôn ngữ (Tiếng Việt, Tiếng Anh).
  3. Mô hình AI phân loại thực thể (Named Entity Recognition): Bóc tách chuẩn xác 7 trường thông tin (Họ tên, Chức vụ, Tên công ty, Số điện thoại di động, Email, Địa chỉ, Mã số thuế).
  4. Điền tự động vào form thông tin đối tác để người dùng xác nhận và lưu vào CRM chỉ trong 3 giây.
* **Output:** Độ chính xác bóc tách đạt ≥ 95%, tiết kiệm 100% thời gian gõ danh thiếp thủ công.

---

### MODULE 08: QUẢN TRỊ HỆ THỐNG & NỀN TẢNG MULTI-TENANT (ADMIN)

#### FR-08.01: Ma trận phân quyền RBAC 7 nhóm quyền x 6 thao tác
* **Actor:** Quản trị viên hệ thống (System Admin).
* **Input:** Lưới ma trận phân quyền tại tuyến đường \`/platform/permissions\`.
* **Logic xử lý:**
  1. Thiết lập quyền hạn chi tiết cho 7 nhóm vai trò: CEO, COO, CFO, Sales Manager, System Admin, Staff, Partner.
  2. Áp dụng cho 6 thao tác cốt lõi: Xem, Tạo, Sửa, Xóa, Duyệt, Xuất dữ liệu.
  3. Cơ chế kiểm soát quyền phân tầng ở cả Frontend (ẩn/hiện nút bấm giao diện) và Backend (Guards/Middleware chặn API trái phép).
* **Output:** Bảo mật đa tầng, ngăn ngừa tuyệt đối hành vi truy cập vượt quyền hoặc lộ lọt dữ liệu nhạy cảm.

#### FR-08.02: Nhật ký kiểm toán hệ thống bất biến (System Audit Log)
* **Actor:** Kiểm toán viên nội bộ, Giám đốc an ninh thông tin (CISO).
* **Logic xử lý:** Tự động ghi lại nhật ký toàn bộ các thao tác nhạy cảm: Đăng nhập, Xuất dữ liệu Excel, Phê duyệt chi tiền, Thay đổi quyền hạn, Đổi mật khẩu. Lưu trữ vĩnh viễn IP, thời điểm (timestamp UTC) và User Agent của người thực hiện.
* **Output:** Minh bạch 100%, phục vụ điều tra truy vết khi xảy ra sự cố an toàn dữ liệu.

---

## 4. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

### 4.1. Hiệu năng & Tải cao (Performance & Scalability)
* **Chịu tải đồng thời:** Hệ thống chịu tải tối thiểu 10,000 người dùng hoạt động đồng thời (Concurrent Users - CCU) mà không bị suy giảm hiệu năng.
* **Thời gian phản hồi:** 95% các yêu cầu truy vấn API có thời gian phản hồi dưới 150ms (p95 < 150ms).
* **Tốc độ soát vé QR:** Xử lý xác thực vé tại cửa sự kiện dưới 0.2 giây/người.
* **Tốc độ gạch nợ VietQR:** Nhận Webhook và hoàn tất gạch nợ phiếu chi/hóa đơn trong vòng 1 giây.

### 4.2. An toàn & Bảo mật (Security)
* **Mã hóa dữ liệu:** Cơ sở dữ liệu được mã hóa ở trạng thái nghỉ bằng chuẩn quân đội AES-256; toàn bộ kết nối truyền tải qua mạng bắt buộc mã hóa an toàn TLS 1.3 (HTTPS / WSS).
* **Chống tấn công mạng:** Tích hợp bộ lọc chống tấn công từ chối dịch vụ (DDoS Rate Limiting 100 req/min/IP), chống SQL Injection (sử dụng Prisma Parameterized Queries), chống XSS và CSRF.
* **Đóng dấu bản quyền (Watermark):** Tự động đóng dấu mờ danh tính người dùng và thời điểm lên các báo cáo tài chính mật và thẻ danh thiếp để chống chụp ảnh màn hình làm rò rỉ thông tin.

### 4.3. Tính khả dụng & Trải nghiệm (Usability)
* **Thiết kế thượng lưu:** Tông màu Dark Obsidian & Champagne Gold sang trọng cho ứng dụng di động; hỗ trợ chuyển đổi linh hoạt Light / Dark Theme trên Web CRM.
* **Khả năng tương thích:** Tối ưu mượt mà trên mọi kích thước màn hình từ smartphone 375px đến màn hình máy tính 4K.
* **Hoạt động ngoại tuyến:** Cho phép xem danh thiếp cá nhân, vé sự kiện và danh bạ đã lưu ngay cả khi mất kết nối Internet.

### 4.4. Độ tin cậy & Phục hồi thảm họa (Reliability & Disaster Recovery)
* **Cam kết sẵn sàng (SLA):** Cam kết tỷ lệ thời gian hoạt động ổn định tối thiểu 99.98% (thời gian gián đoạn không quá 8.76 giờ/năm).
* **Chiến lược sao lưu:** Tự động sao lưu toàn bộ cơ sở dữ liệu hàng ngày vào lúc 03:00 AM, lưu trữ phân tán trên 2 trung tâm dữ liệu độc lập.
* **Chỉ số phục hồi:** Mục tiêu điểm phục hồi dữ liệu RPO < 2 giờ; Mục tiêu thời gian khôi phục hệ thống RTO < 30 phút.

---

## 5. YÊU CẦU GIAO TIẾP HỆ THỐNG (SYSTEM INTERFACES)

1. **Cổng Chuyển Khoản Ngân Hàng Napas VietQR:** Kết nối API sinh mã QR động và tiếp nhận Webhook đối soát gạch nợ tức thời 24/7 từ các ngân hàng thương mại Việt Nam.
2. **Hệ Thống Lưu Trữ Đám Mây MinIO S3:** Lưu trữ an toàn các tệp ảnh chân dung, tài liệu hợp đồng kinh tế và video với cơ chế đường dẫn có thời hạn (Presigned URLs).
3. **Cổng Dịch Vụ Thư Điện Tử Email SMTP:** Kết nối máy chủ SMTP bảo mật (TLS/SSL) gửi thư thông báo phê duyệt chi, báo giá và liên kết đặt lại mật khẩu.
4. **Hạ Tầng Thông Báo Thời Gian Thực WebSocket:** Sử dụng Socket.IO Gateway truyền tải tức thời các tín hiệu thông báo duyệt chi, tin nhắn trò chuyện và cuộc gọi.
5. **Cổng Định Danh Quốc Tế Google OAuth 2.0 & Apple Sign-In:** Hỗ trợ đăng nhập nhanh an toàn bằng tài khoản Google Workspace và Apple ID.
6. **Công Nghệ Thẻ Vật Lý Titanium NFC:** Lập trình chip NTAG213/215/216 liên kết an toàn với hồ sơ số định danh trên nền tảng ViOne.
`;

  // Lưu file Markdown
  const srsMdPath1 = path.join(__dirname, '../document/SRS_CHI_TIET_VIONE_HE_THONG_TOAN_DIEN.md');
  const srsMdPath2 = path.join(__dirname, '../apps/vione_app_fe/public/docs/SRS_CHI_TIET_VIONE_HE_THONG_TOAN_DIEN.md');
  fs.writeFileSync(srsMdPath1, srsMdContent, 'utf8');
  fs.writeFileSync(srsMdPath2, srsMdContent, 'utf8');
  console.log('  -> Da luu file Markdown SRS tai:', srsMdPath1);

  // 2. TẠO FILE WORD (.DOCX) CHUẨN DOANH NGHIỆP
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
                    text: 'ViOne Platform 6.0 — Software Requirements Specification (IEEE 830)',
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
          // BÌA SRS
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
                text: 'BAN KIẾN TRÚC HỆ THỐNG & KỸ THUẬT PHẦN MỀM',
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
                text: 'ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS MASTER)',
                font: FONT_FAMILY,
                size: 38,
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
                text: 'TIÊU CHUẨN QUỐC TẾ IEEE STD 830-1998',
                font: FONT_FAMILY,
                size: 24,
                bold: true,
                color: '2563EB',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 1000 },
            children: [
              new TextRun({
                text: 'HỆ SINH THÁI QUẢN TRỊ DOANH NGHIỆP VIONE & MẠNG XÃ HỘI GIAO THƯƠNG B2B VIONE CONNECT',
                font: FONT_FAMILY,
                size: 24,
                bold: true,
                color: 'A67A47',
              }),
            ],
          }),

          // BẢNG THÔNG TIN KIỂM SOÁT TÀI LIỆU
          new Table({
            width: { size: TOTAL_WIDTH, type: WidthType.DXA },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 3000, type: WidthType.DXA },
                    borders: BORDER_THIN,
                    shading: { type: ShadingType.CLEAR, fill: '0A0A0B' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Thuộc Tính Kiểm Soát', font: FONT_FAMILY, bold: true, size: 21, color: 'D8B282' })] })],
                  }),
                  new TableCell({
                    width: { size: 6200, type: WidthType.DXA },
                    borders: BORDER_THIN,
                    shading: { type: ShadingType.CLEAR, fill: '0A0A0B' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Nội Dung Tiêu Chuẩn', font: FONT_FAMILY, bold: true, size: 21, color: 'D8B282' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ width: { size: 3000, type: WidthType.DXA }, borders: BORDER_THIN, shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' }, children: [new Paragraph({ children: [new TextRun({ text: 'Mã tài liệu', font: FONT_FAMILY, bold: true, size: 21, color: '0F172A' })] })] }),
                  new TableCell({ width: { size: 6200, type: WidthType.DXA }, borders: BORDER_THIN, children: [new Paragraph({ children: [new TextRun({ text: 'SRS-VIONE-ENTERPRISE-CONNECT-IEEE830-V6.0', font: FONT_FAMILY, size: 21, color: '1E293B' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ width: { size: 3000, type: WidthType.DXA }, borders: BORDER_THIN, shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' }, children: [new Paragraph({ children: [new TextRun({ text: 'Tên dự án', font: FONT_FAMILY, bold: true, size: 21, color: '0F172A' })] })] }),
                  new TableCell({ width: { size: 6200, type: WidthType.DXA }, borders: BORDER_THIN, children: [new Paragraph({ children: [new TextRun({ text: 'ViOne Platform 6.0 (Web CRM & ViOne Connect App)', font: FONT_FAMILY, size: 21, color: '1E293B' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ width: { size: 3000, type: WidthType.DXA }, borders: BORDER_THIN, shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' }, children: [new Paragraph({ children: [new TextRun({ text: 'Phiên bản', font: FONT_FAMILY, bold: true, size: 21, color: '0F172A' })] })] }),
                  new TableCell({ width: { size: 6200, type: WidthType.DXA }, borders: BORDER_THIN, children: [new Paragraph({ children: [new TextRun({ text: '6.0 Official Release (Thẩm định mã nguồn thực tế 100%)', font: FONT_FAMILY, size: 21, color: '1E293B' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ width: { size: 3000, type: WidthType.DXA }, borders: BORDER_THIN, shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' }, children: [new Paragraph({ children: [new TextRun({ text: 'Ngày phát hành', font: FONT_FAMILY, bold: true, size: 21, color: '0F172A' })] })] }),
                  new TableCell({ width: { size: 6200, type: WidthType.DXA }, borders: BORDER_THIN, children: [new Paragraph({ children: [new TextRun({ text: '05/10/2026', font: FONT_FAMILY, size: 21, color: '1E293B' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ width: { size: 3000, type: WidthType.DXA }, borders: BORDER_THIN, shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' }, children: [new Paragraph({ children: [new TextRun({ text: 'Cấp độ bảo mật', font: FONT_FAMILY, bold: true, size: 21, color: '0F172A' })] })] }),
                  new TableCell({ width: { size: 6200, type: WidthType.DXA }, borders: BORDER_THIN, children: [new Paragraph({ children: [new TextRun({ text: 'Bảo Mật Nội Bộ — Lưu Hành Giới Hạn', font: FONT_FAMILY, size: 21, color: '1E293B' })] })] }),
                ],
              }),
            ],
          }),

          new Paragraph({ pageBreakBefore: true }),

          // PHẦN 1
          createHeading1('1. GIỚI THIỆU CHUNG (INTRODUCTION)'),
          createPara('Tài liệu Đặc tả Yêu cầu Kỹ thuật và Nghiệp vụ Phần mềm (SRS) này được biên soạn theo chuẩn IEEE Std 830-1998, nhằm mô tả chi tiết, đầy đủ và chuẩn xác toàn bộ các yêu cầu phần mềm cho Hệ sinh thái ViOne Platform 6.0.'),
          createBullet('Mục đích', 'Cung cấp cơ sở kỹ thuật bất biến cho toàn bộ quy trình phát triển, kiểm thử, tích hợp và nghiệm thu bàn giao giữa Ban Quản lý dự án, Đội ngũ Kỹ thuật và Khách hàng.'),
          createBullet('Phạm vi', 'Bao quát toàn diện 3 trụ cột: Web CRM Quản trị Doanh nghiệp C-Level, Ứng dụng Di động Doanh nhân ViOne Connect, và Trí tuệ Nhân tạo ViOne AI Copilot 5.0.'),
          createBullet('Phương pháp luận', 'Áp dụng nguyên tắc MECE (Mutually Exclusive, Collectively Exhaustive) để phân rã 8 Module lớn thành các Epic, Feature và chi tiết từng Action/RESTful API.'),

          // PHẦN 2
          createHeading1('2. MÔ TẢ TỔNG QUAN (OVERALL DESCRIPTION)'),
          createHeading2('2.1. Danh Sách 8 Vai Trò Người Dùng (User Roles)'),
          createBullet('Tổng Giám Đốc (CEO)', 'Toàn quyền tối cao trên toàn hệ thống doanh nghiệp; theo dõi KPI, dòng tiền, duyệt chi > 20 triệu, duyệt chiết khấu > 15%, tương tác với AI Copilot điều hành.'),
          createBullet('Giám Đốc Vận Hành (COO)', 'Điều phối quy trình công việc Kanban, giám sát cân bằng tải nhân sự (cảnh báo khi > 45h/tuần), phê duyệt tiến độ công việc.'),
          createBullet('Giám Đốc Tài Chính (CFO)', 'Kiểm soát dòng tiền, sổ quỹ, ngân sách phòng ban, phê duyệt chi 3 cấp từ 5 - 20 triệu, dự phóng dòng tiền 30-60-90 ngày.'),
          createBullet('Giám Đốc Kinh Doanh (CSO)', 'Quản lý phễu deal B2B, quản lý hạn mức chiết khấu 6 - 15%, xuất danh bạ khách hàng tiềm năng có ghi log.'),
          createBullet('Trưởng Phòng Nhân Sự (HRM)', 'Chấm công GPS bán kính ≤ 50m và AI FaceID liveness, duyệt đơn nghỉ phép, tự động khóa bảng công tháng.'),
          createBullet('Nhân Viên Chuyên Môn (Staff)', 'Xem việc được giao có checklist/deadline, chấm công di động 1-chạm, lập đề xuất chi tiền, nộp đơn nghỉ phép online.'),
          createBullet('Doanh Nhân / Đối Tác (Partner)', 'Chạm Thẻ Titanium NFC kết nối danh thiếp, đăng Story 24h, B2B Moments, trao đổi cơ hội B2B và vé sự kiện QR.'),
          createBullet('Quản Trị Hệ Thống (Admin)', 'Cấu hình đa công ty Multi-Tenant, phân quyền ma trận RBAC 7x6 tại /platform/permissions, quản lý Audit Log.'),

          createHeading2('2.2. Ánh Xạ Hành Trình Người Dùng (User Journeys)'),
          createPara('Hệ thống thiết kế luồng trải nghiệm liền mạch cho từng vai trò người dùng từ khâu tiếp nhận thông tin, xác thực danh tính, thao tác nghiệp vụ, đến phê duyệt và báo cáo kết quả thời gian thực.'),

          // PHẦN 3
          createHeading1('3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)'),

          // Module 1
          createHeading2('MODULE 01: XÁC THỰC & QUẢN LÝ PHIÊN ĐA KÊNH'),
          createFrTable(
            'FR-01.01',
            'Đăng nhập đa phương thức Email & Số điện thoại',
            'Toàn bộ người dùng hệ thống',
            'Email hoặc Số điện thoại (9-12 chữ số) và Mật khẩu. Tùy chọn Ghi nhớ phiên.',
            'Chuẩn hóa chuỗi SĐT -> Tra cứu users hoặc members/member_business_cards -> Đối chiếu bcrypt hash -> Sinh JWT Token kép (Access 24h, Refresh 30d). Chặn Brute-force sau 5 lần sai.',
            'Access Token, Refresh Token, User Profile và điều hướng vào đúng giao diện thẩm quyền.',
            'Sai mật khẩu -> Báo lỗi; Nhập sai 5 lần -> Tạm khóa tài khoản 15 phút.'
          ),
          new Paragraph({ spacing: { before: 100 } }),
          createFrTable(
            'FR-01.02',
            'Đăng ký tài khoản doanh nhân mới in-app trực tiếp',
            'Khách hàng mới, Doanh nhân',
            'Họ và tên, Email, Số điện thoại di động, Tên doanh nghiệp, Mật khẩu.',
            'Kiểm tra định dạng -> Kiểm tra trùng lặp email/SĐT -> Băm mật khẩu bcrypt -> Lưu đồng thời users, members, member_business_cards trong 1 Transaction CSDL -> Tự động đăng nhập.',
            'Tài khoản mới được kích hoạt, tự động mở màn hình chính ViOne Connect.',
            'Trùng SĐT hoặc Email -> Báo lỗi trùng lặp và gợi ý đăng nhập.'
          ),

          // Module 2
          createHeading2('MODULE 02: CỔNG QUẢN TRỊ KHÁCH HÀNG B2B & PHỄU BÁN HÀNG'),
          createFrTable(
            'FR-02.01',
            'Phễu cơ hội kinh doanh đa giai đoạn (Pipeline Kanban)',
            'Sales Manager, Sales Executive, CEO',
            'Tên deal, Giá trị dự kiến, Xác suất thành công, Giai đoạn phễu, Khách hàng.',
            'Bảng Kanban 6 cột: Mới tiếp cận → Khảo sát → Giải pháp → Đàm phán → Ký kết → Đóng deal. Kéo thả thẻ việc tự động cập nhật xác suất và gửi thông báo cho quản lý. Tính tổng Weighted Pipeline Value.',
            'Giao diện phễu Kanban thời gian thực, biểu đồ chuyển đổi doanh số.',
            'Kéo deal vào Thất bại -> Bắt buộc nhập lý do thất bại để phục vụ phân tích thị trường.'
          ),
          new Paragraph({ spacing: { before: 100 } }),
          createFrTable(
            'FR-02.02',
            'Quản lý Báo giá điện tử & Khóa hạn mức chiết khấu',
            'Sales Executive, Sales Manager, CEO',
            'Danh mục sản phẩm, Đơn giá, Số lượng, Tỷ lệ chiết khấu (%).',
            'Tính thành tiền và VAT tự động. Kiểm tra thẩm quyền: Chiết khấu ≤ 5% tự động duyệt; 6-15% chờ Trưởng phòng duyệt; > 15% chờ CEO duyệt. Xuất file PDF có chữ ký số.',
            'File Báo giá PDF chuyên nghiệp, mã QR tra cứu báo giá online, cập nhật deal.',
            'Nhân viên cố tình nhập chiết khấu vượt 5% mà không có xác nhận -> Khóa nút xuất báo giá.'
          ),

          // Module 3
          createHeading2('MODULE 03: QUẢN TRỊ QUY TRÌNH CÔNG VIỆC & VẬN HÀNH'),
          createFrTable(
            'FR-03.01',
            'Bảng Kanban quản lý công việc kéo thả & Cảnh báo quá hạn',
            'Toàn bộ nhân sự doanh nghiệp',
            'Tên công việc, Mô tả, Người chịu trách nhiệm chính, Deadline, Mức ưu tiên.',
            'Hiển thị 4 cột: Chuẩn bị → Đang làm → Đang kiểm tra → Hoàn thành. Nhắc việc trước 2 giờ; quá hạn deadline thẻ việc tự động đổi sang màu đỏ cảnh báo và gửi thông báo đẩy.',
            'Thẻ công việc trực quan, đếm ngược thời gian, cập nhật tiến độ dự án.',
            'Chuyển việc sang Hoàn thành mà chưa tick đủ checklist nghiệm thu -> Hệ thống cảnh báo.'
          ),
          new Paragraph({ spacing: { before: 100 } }),
          createFrTable(
            'FR-03.02',
            'Giám sát cân bằng tải nhân sự (Workload Heatmap)',
            'Giám đốc Vận hành (COO), Trưởng phòng',
            'Khoảng thời gian theo dõi (Tuần / Tháng), Phòng ban lựa chọn.',
            'Tính tổng giờ làm việc được giao trong tuần. Hiển thị Heatmap: <30h (Xanh nhạt), 30-40h (Xanh chuẩn), 41-45h (Vàng hổ phách), >45h (Đỏ cảnh báo quá tải). Hỗ trợ kéo thả san sẻ việc.',
            'Biểu đồ nhiệt nhân lực trực quan, xóa bỏ bất công trong phân bổ việc.',
            'Nhân viên quá tải liên tục 2 tuần -> Tự động kích hoạt cảnh báo rủi ro kiệt sức lên COO.'
          ),

          // Module 4
          createHeading2('MODULE 04: QUẢN TRỊ NHÂN SỰ & CHẤM CÔNG TỰ ĐỘNG'),
          createFrTable(
            'FR-04.01',
            'Chấm công di động định vị GPS bán kính ≤ 50m & AI FaceID Liveness',
            'Toàn bộ nhân sự công ty',
            'Tọa độ GPS hiện tại và Khung hình camera trước smartphone.',
            'Tính khoảng cách Haversine với văn phòng (≤ 50m) -> Trích xuất vector khuôn mặt 128D -> Kiểm tra Liveness chống ảnh giả -> So khớp khuôn mặt mẫu (độ khớp ≥ 92%) -> Ghi nhận công.',
            'Xác nhận chấm công thành công kèm ảnh bằng chứng, cập nhật bảng công tháng.',
            'GPS ngoài bán kính 50m hoặc FaceID < 92% -> Từ chối ghi nhận công.'
          ),

          // Module 5
          createHeading2('MODULE 05: QUẢN TRỊ TÀI CHÍNH & PHÊ DUYỆT CHI 3 CẤP'),
          createFrTable(
            'FR-05.01',
            'Phê duyệt chi 3 cấp & Quét chống chi trùng hóa đơn',
            'Người lập, Kế toán kiểm tra, Lãnh đạo phê duyệt',
            'Số tiền, Nội dung chi, Ảnh chụp hóa đơn GTGT, Số hóa đơn, MST bên bán.',
            'Quét số hóa đơn và MST chống chi trùng tự động -> Kế toán kiểm tra ngân sách tháng còn lại -> Lãnh đạo phê duyệt theo hạn mức (≤5M Trưởng phòng; 5-20M Kế toán trưởng; >20M CEO).',
            'Tờ trình chi được duyệt chính thức, chuyển sang trạng thái sinh mã thanh toán.',
            'Phát hiện trùng lặp số hóa đơn với phiếu chi cũ -> Khóa tờ trình và báo đỏ lập tức.'
          ),
          new Paragraph({ spacing: { before: 100 } }),
          createFrTable(
            'FR-05.02',
            'Sinh mã Napas VietQR động gạch nợ tức thời trong 1 giây',
            'Kế toán thanh toán, Thủ quỹ, Đối tác',
            'Phiếu chi hoặc hóa đơn đã được lãnh đạo phê duyệt.',
            'Sinh mã VietQR chuẩn EMVCo chứa chính xác tài khoản, số tiền và mã phiếu -> Đối tác quét mã chuyển khoản qua app ngân hàng -> Nhận Webhook Napas 24/7 -> Gạch nợ tự động trong 1 giây.',
            'Phiếu chi chuyển sang trạng thái Đã thanh toán thành công, ghi nhận sổ quỹ.',
            'Chuyển sai số tiền hoặc sai cú pháp -> Đưa vào danh sách chờ đối soát thủ công.'
          ),

          // Module 6
          createHeading2('MODULE 06: MẠNG XÃ HỘI GIAO THƯƠNG DOANH NHÂN VIONE CONNECT'),
          createFrTable(
            'FR-06.01',
            'Thẻ Doanh Nhân Titanium NFC 3D & 1-chạm lưu danh bạ (.vcf)',
            'Doanh nhân, Đối tác tiếp nhận',
            'Chạm nhẹ Thẻ Titanium NFC vào smartphone hoặc quét mã QR cá nhân.',
            'Mở trang danh thiếp số công khai đẳng cấp -> Hiển thị avatar, chức danh, công ty, video giới thiệu -> Bấm nút Lưu danh bạ sinh file vCard (.vcf) lưu thẳng vào máy đối tác trong 1-chạm.',
            'Hồ sơ doanh nhân mở tức thời trên điện thoại đối tác không cần cài app.',
            'Báo mất thẻ trên app -> Vô hiệu hóa token chip NFC từ xa trong vòng 1 giây.'
          ),
          new Paragraph({ spacing: { before: 100 } }),
          createFrTable(
            'FR-06.02',
            'Popup Thẻ Doanh Nhân dạng Bottom Sheet cong tròn vuốt tay xuống',
            'Doanh nhân sử dụng ViOne Connect App',
            'Chạm vào khối Thẻ Doanh Nhân trên trang chủ HomeScreen.',
            'Mở popup trượt từ dưới lên bo góc cong tròn 28px viền mạ vàng champagne -> Tích hợp PanResponder bắt cử chỉ kéo vuốt xuống (dy > 80px hoặc vy > 0.6) đóng mượt mà; kéo nhẹ đàn hồi spring trở lại.',
            'Trải nghiệm vuốt đóng tự nhiên, hiển thị thẻ 3D Titanium, mã QR, NFC và quyền lợi.',
            'Thiết bị đời cũ giật lag -> Tối ưu qua useNativeDriver đảm bảo 60fps mượt mà.'
          ),
          new Paragraph({ spacing: { before: 100 } }),
          createFrTable(
            'FR-06.03',
            'Thông báo & Hướng dẫn cài đặt PWA cho iOS Safari & WebClip Profile',
            'Người dùng truy cập bằng iPhone/iPad Safari',
            'Mở trang web ViOne trên trình duyệt Safari.',
            'Tự động nhận diện thiết bị iOS chưa ở chế độ standalone -> Bật banner mạ vàng hướng dẫn cài đặt -> Bấm Cài đặt mở modal 3 bước (Chia sẻ ⎋ -> Thêm vào MH chính ⊞ -> Thêm) -> Cung cấp file mobileconfig 1-chạm.',
            'Ứng dụng ViOne xuất hiện trên màn hình chính của iPhone/iPad như app từ App Store.',
            'Người dùng bấm Để sau -> Tạm ẩn thông báo trong 24 giờ để không gây phiền hà.'
          ),

          // Module 7
          createHeading2('MODULE 07: TRÍ TUỆ NHÂN TẠO VIONE AI COPILOT 5.0'),
          createFrTable(
            'FR-07.01',
            'AI Copilot đàm thoại điều hành C-Level qua giọng nói tiếng Việt',
            'Tổng Giám Đốc (CEO), Ban Lãnh đạo',
            'Mệnh lệnh điều hành bằng giọng nói tiếng Việt tự nhiên hoặc văn bản.',
            'Nhận diện tiếng Việt chuẩn xác -> Phân tích ngữ cảnh doanh nghiệp -> Truy vấn an toàn CSDL nội bộ -> Tổng hợp chỉ số doanh thu, chi phí, dòng tiền -> Trả lời súc tích và đọc giọng AI tự nhiên.',
            'Báo cáo kinh tế được phản hồi ngay lập tức, lưu vết vào AI Audit Log.',
            'Câu hỏi ngoài phạm vi dữ liệu hoặc vi phạm phân quyền -> AI từ chối và giải thích an toàn.'
          ),
          new Paragraph({ spacing: { before: 100 } }),
          createFrTable(
            'FR-07.02',
            'Quét & Nhận diện danh thiếp thông minh OCR AI (7 trường)',
            'Nhân viên kinh doanh, Doanh nhân',
            'Ảnh chụp danh thiếp giấy từ camera hoặc thư viện ảnh.',
            'Cân bằng trắng, khử góc nghiêng -> OCR đa ngôn ngữ -> AI phân loại thực thể NER (Họ tên, Chức vụ, Công ty, SĐT, Email, Địa chỉ, MST) với độ chính xác ≥ 95% -> Tự động điền vào form liên hệ CRM.',
            'Thông tin danh thiếp được bóc tách hoàn chỉnh và lưu vào CRM chỉ trong 3 giây.',
            'Ảnh chụp quá mờ hoặc lóa sáng -> Cảnh báo người dùng chụp lại góc thẳng rõ nét.'
          ),

          // Module 8
          createHeading2('MODULE 08: QUẢN TRỊ HỆ THỐNG & MULTI-TENANT'),
          createFrTable(
            'FR-08.01',
            'Ma trận phân quyền RBAC 7 nhóm quyền x 6 thao tác & Audit Log',
            'Quản trị viên hệ thống (System Admin)',
            'Lưới ma trận phân quyền tại tuyến đường /platform/permissions.',
            'Thiết lập quyền Xem, Tạo, Sửa, Xóa, Duyệt, Xuất cho 7 nhóm vai trò. Kiểm soát quyền đa tầng ở cả Frontend UI và Backend API Guards. Tự động ghi nhật ký Audit Log bất biến kèm IP và User Agent.',
            'Hệ thống bảo mật đa tầng, minh bạch 100% mọi hành vi người dùng.',
            'Cố tình gửi API trái quyền -> Backend từ chối với mã lỗi 403 Forbidden và ghi log cảnh báo.'
          ),

          // PHẦN 4
          createHeading1('4. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)'),
          createBullet('Hiệu năng (Performance)', 'Chịu tải đồng thời tối thiểu 10,000 CCU; 95% API phản hồi dưới 150ms; soát vé QR tại cửa sự kiện < 0.2s; gạch nợ VietQR trong 1 giây.'),
          createBullet('An toàn & Bảo mật (Security)', 'Mã hóa CSDL bằng chuẩn quân đội AES-256; mã hóa đường truyền TLS 1.3; Rate limiting chống DDoS 100 req/min/IP; Watermark bảo vệ dữ liệu mật.'),
          createBullet('Tính khả dụng (Usability)', 'Giao diện Dark Obsidian & Champagne Gold sang trọng; hỗ trợ Light / Dark Theme; tương thích từ màn hình mobile 375px đến máy tính 4K; hỗ trợ ngoại tuyến offline cache.'),
          createBullet('Độ tin cậy (Reliability & Disaster Recovery)', 'SLA 99.98%; RPO < 2 giờ; RTO < 30 phút; tự động sao lưu CSDL hàng ngày lúc 03:00 AM phân tán 2 trung tâm dữ liệu.'),

          // PHẦN 5
          createHeading1('5. YÊU CẦU GIAO TIẾP HỆ THỐNG (SYSTEM INTERFACES)'),
          createBullet('Cổng Napas VietQR', 'Kết nối API sinh mã VietQR động chuẩn EMVCo và tiếp nhận Webhook đối soát gạch nợ tự động 24/7 từ các ngân hàng thương mại.'),
          createBullet('MinIO S3 Storage', 'Lưu trữ tài liệu hợp đồng, hóa đơn và ảnh danh thiếp an toàn qua Presigned URLs có thời hạn.'),
          createBullet('Email SMTP Service', 'Gửi thư thông báo duyệt chi, báo giá và mã xác thực đặt lại mật khẩu an toàn.'),
          createBullet('WebSocket Gateway', 'Truyền tải thông báo tức thời, tin nhắn trò chuyện và trạng thái gạch nợ qua Socket.IO.'),
          createBullet('Google & Apple OAuth', 'Hỗ trợ đăng nhập nhanh bằng Google Workspace và Apple ID.'),
          createBullet('Thẻ Titanium NFC', 'Lập trình chip NTAG213/215/216 chứa token định danh liên kết an toàn với nền tảng ViOne.'),
        ],
      },
    ],
  });

  const docxBuffer = await Packer.toBuffer(doc);
  const docxPath1 = path.join(__dirname, '../document/SRS_CHI_TIET_VIONE_HE_THONG_TOAN_DIEN.docx');
  const docxPath2 = path.join(__dirname, '../apps/vione_app_fe/public/docs/SRS_CHI_TIET_VIONE_HE_THONG_TOAN_DIEN.docx');
  fs.writeFileSync(docxPath1, docxBuffer);
  fs.writeFileSync(docxPath2, docxBuffer);
  console.log('  -> Da xuat ban file Word (.docx) SRS tai:', docxPath1);
  console.log('>>> [SRS VIONE MASTER IEEE 830] HOAN TAT 100%!');
}

buildSrs().catch((err) => {
  console.error('Loi khi tao SRS:', err);
  process.exit(1);
});
