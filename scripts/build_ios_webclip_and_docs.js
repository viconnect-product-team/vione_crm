const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const iconPath = path.join(rootDir, 'apps', 'mobile_vione', 'assets', 'icon.png');
const publicDir = path.join(rootDir, 'apps', 'vione_app_fe', 'public');
const docDir = path.join(rootDir, 'document');
const docsPublicDir = path.join(publicDir, 'docs');

if (!fs.existsSync(docsPublicDir)) {
  fs.mkdirSync(docsPublicDir, { recursive: true });
}

// 1. Tạo file MobileConfig Apple WebClip
console.log('>>> [1] Tao file Apple WebClip .mobileconfig...');
const iconBuffer = fs.readFileSync(iconPath);
const iconBase64 = iconBuffer.toString('base64');

const mobileConfigContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>ConsentText</key>
    <dict>
        <key>default</key>
        <string>Cài đặt ứng dụng ViOne Connect lên màn hình chính thiết bị Apple iOS (iPhone/iPad). Sau khi bấm Cài đặt, biểu tượng ứng dụng ViOne sẽ tự động xuất hiện tại Home Screen và hoạt động ở chế độ toàn màn hình Native PWA.</string>
    </dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            <key>Icon</key>
            <data>
${iconBase64.match(/.{1,76}/g).join('\n')}
            </data>
            <key>IsRemovable</key>
            <true/>
            <key>Label</key>
            <string>ViOne Connect</string>
            <key>PayloadDescription</key>
            <string>Cài đặt ứng dụng PWA ViOne Connect ra Màn hình chính iOS</string>
            <key>PayloadDisplayName</key>
            <string>ViOne Connect WebClip</string>
            <key>PayloadIdentifier</key>
            <string>com.vione.connect.webclip</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>9B604A65-886D-4679-BA43-524C24F00918</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Precomposed</key>
            <true/>
            <key>URL</key>
            <string>https://14.225.217.232:5445/connect-app</string>
        </dict>
    </array>
    <key>PayloadDescription</key>
    <string>Cấu hình cài đặt trực tiếp ứng dụng ViOne Connect cho thiết bị iOS (iPhone/iPad) không cần qua App Store</string>
    <key>PayloadDisplayName</key>
    <string>Cài đặt ViOne Connect iOS</string>
    <key>PayloadIdentifier</key>
    <string>com.vione.connect.profile</string>
    <key>PayloadOrganization</key>
    <string>ViOne Corporation</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>A51B789B-4D15-4D52-8705-72846A6BEB87</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>
`;

const mobileConfigFileDoc = path.join(docDir, 'vione_ios_install.mobileconfig');
const mobileConfigFilePublic = path.join(publicDir, 'vione_ios_install.mobileconfig');
fs.writeFileSync(mobileConfigFileDoc, mobileConfigContent, 'utf8');
fs.writeFileSync(mobileConfigFilePublic, mobileConfigContent, 'utf8');
console.log('  -> Da luu vione_ios_install.mobileconfig tai document va public');

// 2. Tạo tài liệu Markdown HDSD
console.log('>>> [2] Tao tai lieu HDSD Markdown...');
const hdsdMdContent = `# TÀI LIỆU HƯỚNG DẪN SỬ DỤNG HỆ THỐNG VÀ ỨNG DỤNG VIONE
## HỆ THỐNG QUẢN TRỊ DOANH NGHIỆP TOÀN DIỆN VÀ MẠNG XÃ HỘI GIAO THƯƠNG DOANH NHÂN B2B
**Mã tài liệu:** HDSD-VIONE-MASTER-6.0 | **Ngày ban hành:** 05/10/2026 | **Phiên bản:** 6.0 Enterprise

---

## MỤC LỤC TỔNG QUAN

1. [CHƯƠNG 1: GIỚI THIỆU TỔNG QUAN HỆ SINH THÁI VIONE](#chương-1-giới-thiệu-tổng-quan-hệ-sinh-thái-vione)
2. [CHƯƠNG 2: HƯỚNG DẪN CÀI ĐẶT & ĐĂNG NHẬP ĐA NỀN TẢNG](#chương-2-hướng-dẫn-cài-đặt--đăng-nhập-đa-nền-tảng)
   - 2.1 Cài đặt PWA trên iPhone/iPad (iOS) bằng File Cấu hình Trực tiếp (\`.mobileconfig\`)
   - 2.2 Đăng nhập bằng Email và Số điện thoại OTP
3. [CHƯƠNG 3: HƯỚNG DẪN SỬ DỤNG CRM VIONE WEB](#chương-3-hướng-dẫn-sử-dụng-crm-vione-web)
   - 3.1 Dashboard & Báo cáo Realtime Điều hành
   - 3.2 Quản trị Khách hàng & Cơ hội B2B (Kanban Deal)
   - 3.3 Quản trị Quy trình Công việc & Giao việc Tự động
   - 3.4 Quản trị Nhân sự & Chấm công Tự động
   - 3.5 Quản trị Tài chính & Phê duyệt Thu Chi 3 Cấp
   - 3.6 Ma trận Phân quyền 7x6 & Cấu hình Multi-Tenant
4. [CHƯƠNG 4: HƯỚNG DẪN SỬ DỤNG ỨNG DỤNG DI ĐỘNG VIONE CONNECT](#chương-4-hướng-dẫn-sử-dụng-ứng-dụng-di-động-vione-connect)
   - 4.1 Trang chủ & Thẻ Hội viên Doanh nhân NFC (Kèm Vuốt tay Bottom Sheet)
   - 4.2 Sàn Giao thương B2B & Chợ Nhu cầu Mua Bán
   - 4.3 Danh bạ Doanh nhân & Kênh Chat Trao đổi Trực tiếp
   - 4.4 Sự kiện Doanh nhân & Quét Mã QR Check-in Điểm danh
5. [CHƯƠNG 5: HƯỚNG DẪN KHAI THÁC TRỢ LÝ AI COPILOT 5.0](#chương-5-hướng-dẫn-khai-thác-trợ-lý-ai-copilot-50)
6. [CHƯƠNG 6: QUY TRÌNH XỬ LÝ SỰ CỐ & HỎI ĐÁP THƯỜNG GẶP (FAQ)](#chương-6-quy-trình-xử-lý-sự-cố--hỏi-đáp-thường-gặp-faq)

---

### CHƯƠNG 1: GIỚI THIỆU TỔNG QUAN HỆ SINH THÁI VIONE
ViOne là nền tảng chuyển đổi số toàn diện dành riêng cho cộng đồng doanh nghiệp và doanh nhân, tích hợp liền mạch giữa hai trụ cột:
1. **ViOne CRM & ERP Platform (Web Portal):** Nền tảng quản trị nội bộ doanh nghiệp bao gồm CRM bán hàng B2B, quản lý quy trình tự động, chấm công nhân sự, quản trị tài chính, và cấu hình phân quyền ma trận 7x6.
2. **ViOne Connect App (Mobile & PWA):** Ứng dụng mạng xã hội giao thương B2B kết nối cộng đồng doanh nhân, cung cấp danh thiếp điện tử thông minh, sàn nhu cầu kết nối cung cầu, quản lý sự kiện và trợ lý AI Copilot.

---

### CHƯƠNG 2: HƯỚNG DẪN CÀI ĐẶT & ĐĂNG NHẬP ĐA NỀN TẢNG

#### 2.1 Cài đặt PWA trên iPhone/iPad (iOS) bằng File Cấu hình (\`.mobileconfig\`)
- **Mục tiêu:** Cho phép người dùng iPhone cài đặt ứng dụng ViOne Connect trực tiếp lên Màn hình chính (Home Screen) chỉ với 1 click, tương tự cài file APK trên Android.
- **Quy trình thực hiện:**
  1. Người dùng mở link tải file: \`https://14.225.217.232:5445/vione_ios_install.mobileconfig\` trên trình duyệt Safari.
  2. Safari hiển thị thông báo: *"Trang web này đang cố tải về một hồ sơ cấu hình. Bạn có muốn cho phép không?"* -> Nhấn **Cho phép (Allow)**.
  3. Mở ứng dụng **Cài đặt (Settings)** trên iPhone -> Chọn mục **Đã tải về hồ sơ (Profile Downloaded)** ở ngay đầu danh sách.
  4. Nhấn nút **Cài đặt (Install)** ở góc phải trên -> Nhập mật mã mở khóa máy (Passcode) -> Tiếp tục nhấn **Cài đặt**.
  5. Biểu tượng **ViOne Connect** màu vàng kim sang trọng sẽ ngay lập tức xuất hiện trên Màn hình chính của iPhone. Khi bấm vào, ứng dụng chạy toàn màn hình (Full Screen Native), không có thanh địa chỉ Safari.

#### 2.2 Đăng nhập bằng Email và Số điện thoại OTP
- **Mục tiêu:** Đăng nhập linh hoạt với cả tài khoản quản trị (Email + Password) và tài khoản Hội viên di động (Số điện thoại + Mã OTP hoặc Mật khẩu).
- **Thao tác:**
  1. Truy cập cổng đăng nhập Web (\`https://14.225.217.232:5445/login\`) hoặc mở App ViOne.
  2. Tab Email: Nhập Email doanh nghiệp và Mật khẩu -> Bấm "Đăng nhập".
  3. Tab Số điện thoại: Nhập số điện thoại (ví dụ: \`0987654321\`) -> Nhận mã OTP 6 chữ số gửi qua SMS/Zalo -> Bấm "Xác thực & Truy cập".

---

### CHƯƠNG 3: HƯỚNG DẪN SỬ DỤNG CRM VIONE WEB

#### 3.1 Dashboard & Báo cáo Realtime Điều hành
- **Đường dẫn:** \`/dashboard\`
- **Tính năng chính:**
  - 4 thẻ KPI tổng: Tổng doanh thu, Số lượng khách hàng mới, Số cơ hội mở, Tỷ lệ chốt đơn thành công.
  - Biểu đồ dòng tiền và doanh thu theo tháng.
  - Bảng cảnh báo công việc quá hạn và thông báo phê duyệt chờ xử lý.

#### 3.2 Quản trị Khách hàng & Cơ hội B2B (Kanban Deal)
- **Đường dẫn:** \`/customers\` và \`/deals\`
- **Thao tác thêm mới khách hàng:**
  1. Nhấn nút **"+ Thêm khách hàng"** góc phải trên.
  2. Điền thông tin: Tên công ty, Mã số thuế, Người liên hệ, Số điện thoại, Email, Nguồn khách hàng.
  3. Bấm **"Lưu hồ sơ"**.
- **Kéo thả Kanban Deals:** Kéo cơ hội từ cột *Mới tiếp cận* -> *Khảo sát nhu cầu* -> *Gửi báo giá* -> *Đàm phán* -> *Chốt hợp đồng*.

#### 3.3 Quản trị Quy trình Công việc & Giao việc
- **Đường dẫn:** \`/tasks\` và \`/workflows\`
- Thiết lập quy trình tự động phân bổ công việc theo phòng ban, đặt hạn chót (Deadline) và đánh giá tiến độ hoàn thành.

#### 3.4 Quản trị Nhân sự & Chấm công Tự động
- **Đường dẫn:** \`/hrm\` và \`/attendance\`
- Hỗ trợ chấm công định vị GPS qua Mobile App và đồng bộ dữ liệu vào bảng công tổng hợp tính lương.

#### 3.5 Quản trị Tài chính & Phê duyệt Thu Chi 3 Cấp
- **Đường dẫn:** \`/finance\`
- Phiếu thu, Phiếu chi trải qua 3 cấp phê duyệt: Người tạo -> Trưởng bộ phận -> Giám đốc/Kế toán trưởng duyệt chi.

#### 3.6 Ma trận Phân quyền 7x6 & Multi-Tenant
- **Đường dẫn:** \`/platform/permissions\`
- Cấu hình phân quyền chuẩn ma trận 7 nhóm quyền trên 6 vai trò: System Admin, Doanh nghiệp Chủ quản, Quản lý chi nhánh, Nhân viên kinh doanh, Kế toán, Hội viên.

---

### CHƯƠNG 4: HƯỚNG DẪN SỬ DỤNG ỨNG DỤNG DI ĐỘNG VIONE CONNECT

#### 4.1 Trang chủ & Thẻ Hội viên Doanh nhân NFC (Kèm Vuốt tay Bottom Sheet)
- **Đường dẫn:** Trang chủ App ViOne Connect.
- **Thao tác Thẻ Hội viên:**
  1. Chạm vào **Thẻ Hội viên Doanh nhân** trên trang chủ.
  2. Bảng điều khiển (Bottom Sheet) vuốt từ dưới lên với góc cong bo tròn 36px sang trọng.
  3. Cho phép vuốt tay kéo xuống mượt mà để đóng popup.
  4. Hiển thị mã QR định danh số, tích hợp chia sẻ danh thiếp qua NFC một chạm.

#### 4.2 Sàn Giao thương B2B & Chợ Nhu cầu
- Đăng tin tìm đối tác, tìm nguồn cung ứng, hoặc chào bán sản phẩm dịch vụ với bộ lọc theo ngành nghề, khu vực.

#### 4.3 Danh bạ Doanh nhân & Kênh Chat Trực tiếp
- Tìm kiếm lãnh đạo doanh nghiệp theo ngành nghề, kết bạn và nhắn tin trao đổi bảo mật qua mã hóa đầu cuối.

#### 4.4 Quản lý Sự kiện & QR Check-in Điểm danh
- Xem lịch hội thảo xúc tiến thương mại, đăng ký tham dự và quét mã QR tại bàn lễ tân để check-in tức thì.

---

### CHƯƠNG 5: HƯỚNG DẪN KHAI THÁC TRỢ LÝ AI COPILOT 5.0
- Biểu tượng AI hình cầu sáng nổi bật tại góc màn hình.
- 6 Năng lực AI chuyên biệt:
  1. **Hỏi đáp điều hành:** Tóm tắt doanh thu, công nợ, hiệu suất nhân viên.
  2. **Soạn thảo tự động:** Viết email chào hàng B2B, hợp đồng kinh tế.
  3. **Gợi ý ghép nối đối tác:** Phân tích nhu cầu mua - bán để đề xuất kết nối 1-1.
  4. **Nhắc việc thông minh:** Báo các đầu việc quá hạn hoặc cơ hội bán hàng bỏ quên.
  5. **Dự báo dòng tiền:** Phân tích lịch sử chi tiêu để cảnh báo thiếu hụt ngân sách.
  6. **Trích xuất tài liệu OCR:** Tự động đọc hóa đơn, danh thiếp và nhập liệu vào CRM.

---

### CHƯƠNG 6: QUY TRÌNH XỬ LÝ SỰ CỐ & FAQ
- **Quên mật khẩu:** Bấm "Quên mật khẩu" tại màn hình đăng nhập, nhập Email/SĐT để nhận link khôi phục.
- **Không cài đặt được Profile trên iOS:** Đảm bảo tải qua trình duyệt Safari và vào Cài đặt -> Đã tải về hồ sơ để bấm Cài đặt.
- **Hotline hỗ trợ kỹ thuật:** 1900 xxxx | Email: support@vione.vn
`;

const hdsdMdDoc = path.join(docDir, 'HDSD_HE_THONG_VA_APP_VIONE_TOAN_DIEN.md');
fs.writeFileSync(hdsdMdDoc, hdsdMdContent, 'utf8');
console.log('  -> Da luu HDSD_HE_THONG_VA_APP_VIONE_TOAN_DIEN.md');

// 3. Sao chép toàn bộ sang thư mục public/docs
console.log('>>> [3] Sao chep bo tai lieu sang apps/vione_app_fe/public/docs...');
const filesToCopy = [
  'BRD_VIONE_YEU_CAU_NGHIEP_VU_TOAN_DIEN.md',
  'BRD_VIONE_YEU_CAU_NGHIEP_VU_TOAN_DIEN.docx',
  'SRS_CHI_TIET_VIONE_HE_THONG_TOAN_DIEN.md',
  'SRS_CHI_TIET_VIONE_HE_THONG_TOAN_DIEN.docx',
  'HDSD_HE_THONG_VA_APP_VIONE_TOAN_DIEN.html',
  'HDSD_HE_THONG_VA_APP_VIONE_TOAN_DIEN.docx',
  'HDSD_HE_THONG_VA_APP_VIONE_TOAN_DIEN.md',
  'vione_ios_install.mobileconfig'
];

for (const f of filesToCopy) {
  const src = path.join(docDir, f);
  const dst = path.join(docsPublicDir, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log(`  -> Copied: ${f}`);
  }
}

console.log('>>> [HOAN TAT] Tat ca tai lieu va Apple WebClip da duoc xuat ban thanh cong!');
