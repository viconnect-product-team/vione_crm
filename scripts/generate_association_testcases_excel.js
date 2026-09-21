const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('=== [3/3] GENERATING ASSOCIATION TEST CASES FILE (XLSX & MD) ===');

  const docsDir = path.join(__dirname, '..', 'document');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Phạm Văn Vũ - QA / Solution Architect';
  wb.lastModifiedBy = 'Phạm Văn Vũ';
  wb.created = new Date();
  wb.modified = new Date();

  const NAVY = '0A1A3A';
  const BLUE_HEADER = '0084FF';
  const BORDER_COLOR = 'CBD5E1';
  const BORDER = {
    top: { style: 'thin', color: { argb: BORDER_COLOR } },
    left: { style: 'thin', color: { argb: BORDER_COLOR } },
    bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
    right: { style: 'thin', color: { argb: BORDER_COLOR } },
  };

  // ════════════════════════════════════════════════════════════════════════════
  // TEST CASES DATA - ALL 14 UPDATED FEATURES INCLUDED, ALL STATUS "[ ] Chờ kiểm tra"
  // ════════════════════════════════════════════════════════════════════════════
  const testCases = [
    // MOD-01: AUTHENTICATION & LOGIN FLOW
    {
      tcId: 'TC-AUTH-001',
      module: 'Xác thực & Đăng nhập',
      subFeature: 'Đăng nhập bằng Số điện thoại hợp lệ',
      screen: 'Màn hình Đăng nhập (/association/login)',
      precondition: 'Tài khoản hội viên đã được kích hoạt trong database',
      steps: '1. Truy cập /association/login\n2. Nhập SĐT 098.333.1983\n3. Nhập mật khẩu đúng\n4. Bấm "Đăng nhập"',
      inputData: 'Phone: 0983331983, Pass: ******',
      expected: 'Đăng nhập thành công, lưu token vào localStorage, chuyển hướng sang /association/card hoặc /messages',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Hỗ trợ đăng nhập đa kênh. Sẵn sàng test trên cả trình duyệt Desktop và Mobile.',
    },
    {
      tcId: 'TC-AUTH-002',
      module: 'Xác thực & Đăng nhập',
      subFeature: 'Đăng nhập bằng Mã hội viên chính thức',
      screen: 'Màn hình Đăng nhập (/association/login)',
      precondition: 'Mã hội viên tồn tại (VD: M1983-007)',
      steps: '1. Truy cập /association/login\n2. Nhập Mã M1983-007\n3. Nhập mật khẩu đúng\n4. Bấm "Đăng nhập"',
      inputData: 'Code: M1983-007, Pass: ******',
      expected: 'Hệ thống tự động tra cứu mã hội viên sang SĐT tương ứng và đăng nhập thành công',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Logic tra cứu mã hội viên tự động. Sẵn sàng test.',
    },
    {
      tcId: 'TC-AUTH-003',
      module: 'Xác thực & Đăng nhập',
      subFeature: 'Popup Quên mật khẩu & Gửi OTP',
      screen: 'Popup Quên mật khẩu (/association/login)',
      precondition: 'Hội viên đã có số điện thoại đăng ký',
      steps: '1. Bấm "Quên mật khẩu"\n2. Nhập SĐT\n3. Bấm "Gửi mã OTP"\n4. Nhập mã OTP nhận được',
      inputData: 'Phone: 0983331983, OTP: 198300',
      expected: 'Popup xác thực OTP hiển thị, sau khi nhập đúng cho phép đặt lại mật khẩu mới',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Mã OTP giả lập dev test trơn tru; cần cấu hình SMS Brandname khi triển khai production.',
    },
    {
      tcId: 'TC-AUTH-004',
      module: 'Xác thực & Đăng nhập',
      subFeature: 'Đăng ký tài khoản hội viên & Form hồ sơ pháp nhân',
      screen: 'Màn hình Đăng ký (/association/register)',
      precondition: 'Khách hàng chưa có tài khoản trong CLB',
      steps: '1. Mở /association/register\n2. Điền Họ tên, Tên công ty, Chức vụ, MST, SĐT\n3. Bấm "Gửi đơn gia nhập"',
      inputData: 'Hồ sơ pháp nhân doanh nghiệp',
      expected: 'Tạo hồ sơ chờ duyệt (PENDING_APPROVAL), thông báo gửi về Ban Thư Ký',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Form validation đầy đủ, chống spam.',
    },
    {
      tcId: 'TC-AUTH-005',
      module: 'Xác thực & Đăng nhập',
      subFeature: 'Popup Đổi mật khẩu & Quản lý phiên thiết bị',
      screen: 'Popup Đổi mật khẩu (/association/settings)',
      precondition: 'Hội viên đã đăng nhập',
      steps: '1. Mở Cài đặt\n2. Chọn Đổi mật khẩu\n3. Nhập mật khẩu cũ, mật khẩu mới (xác nhận)\n4. Bấm lưu',
      inputData: 'Old pass, New pass',
      expected: 'Mật khẩu cập nhật mã hóa bcrypt, hiển thị thông báo thành công và hủy các phiên cũ nếu chọn',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Đã kết nối API /users/change-password.',
    },
    {
      tcId: 'TC-AUTH-006',
      module: 'Xác thực & Đăng nhập',
      subFeature: 'Bắt buộc đăng nhập sau khi duyệt hồ sơ (Prefilled Username, Không bypass login)',
      screen: 'Màn hình Đăng nhập (/association/login)',
      precondition: 'Hội viên đã được duyệt từ Landing Page hoặc CRM, chuyển hướng sang /association/login?username=...&registered=true',
      steps: '1. Mở link chuyển hướng từ Landing sau khi duyệt\n2. Quan sát ô "Số điện thoại / Mã hội viên" đã được điền sẵn chính xác\n3. Quan sát thông báo hướng dẫn: "Hồ sơ của bạn đã được phê duyệt! Vui lòng nhập mật khẩu để vào App"\n4. Để trống mật khẩu và bấm "Đăng nhập" -> Kiểm tra bị chặn và báo lỗi\n5. Nhập đúng mật khẩu đã tạo lúc Onboarding\n6. Bấm "Đăng nhập"',
      inputData: 'Query param: username=0983331983&registered=true, Password',
      expected: 'Tuyệt đối không bypass đăng nhập; ô username prefill chính xác; sau khi nhập đúng mật khẩu, lưu token session và chuyển hướng an toàn vào /association',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 2: Đảm bảo an toàn bảo mật danh tính, không tự động đăng nhập ngầm mà yêu cầu người dùng xác nhận mật khẩu.',
    },

    // MOD-02: LANDING PAGE & REGISTRATION
    {
      tcId: 'TC-LAND-001',
      module: 'Đăng Ký & Kích Hoạt Hội Viên',
      subFeature: 'Modal Đăng ký hội viên mới & Tra cứu trạng thái 3 cấp trên Landing Page',
      screen: 'Modal Đăng ký & Tra cứu (/landing/ceo1983)',
      precondition: 'Người dùng truy cập trang Web Landing CEO 1983',
      steps: '1. Mở trang Landing Page, bấm nút "Gia Nhập VIP"\n2. Điền form đăng ký và bấm "Xác Nhận Nộp Hồ Sơ VIP"\n3. Kiểm tra Modal không bị đóng, tự chuyển sang Tab "Trạng Thái & Kích Hoạt"\n4. Nhập SĐT vào ô tra cứu và bấm "Kiểm tra"\n5. Kiểm tra hiển thị chính xác trạng thái: Chờ duyệt / Đã duyệt / Cần bổ sung',
      inputData: 'Phone: 0988888888, Form thông tin đăng ký',
      expected: 'Modal không đóng khi gửi đơn, tra cứu hiển thị đúng 3 trạng thái tương ứng với CRM',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Kiến trúc modal 2 tab giữ chân người dùng và theo dõi kết quả.',
    },
    {
      tcId: 'TC-LAND-002',
      module: 'Đăng Ký & Kích Hoạt Hội Viên',
      subFeature: 'Tự động Polling 4s kiểm tra phê duyệt & Tự chuyển hướng đăng nhập',
      screen: 'Modal Đăng ký & Tra cứu (/landing/ceo1983)',
      precondition: 'Hồ sơ ở trạng thái "Chờ duyệt", modal đang mở',
      steps: '1. Nộp hồ sơ và đang ở màn hình "Chờ duyệt"\n2. Giữ nguyên modal mở không thao tác gì\n3. Quản trị viên duyệt hồ sơ trên CRM Backend\n4. Quan sát chu kỳ 4 giây của ứng dụng\n5. Kiểm tra ứng dụng tự động phát hiện trạng thái APPROVED\n6. Kiểm tra thông báo chuyển hướng hiển thị và tự điều hướng sang /association/login',
      inputData: 'Polling interval 4000ms, API /connect-app/club-registration/status',
      expected: 'Không cần người dùng bấm F5 hay nút kiểm tra, hệ thống tự polling 4s nhận diện phê duyệt và tự chuyển hướng sang /association/login kèm prefilled username',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 1: Trải nghiệm onboarding liền mạch, tự động nhận diện phê duyệt thời gian thực.',
    },
    {
      tcId: 'TC-ONB-001',
      module: 'Đăng Ký & Kích Hoạt Hội Viên',
      subFeature: 'Onboarding tạo tài khoản hội viên mới khi được duyệt trên Landing',
      screen: 'Modal Trạng thái & Kích hoạt (/landing/ceo1983)',
      precondition: 'Hồ sơ đăng ký đã được Quản trị viên phê duyệt trên CRM',
      steps: '1. Tra cứu SĐT đã duyệt trên Tab "Trạng Thái & Kích Hoạt"\n2. Giao diện Onboarding mở Form tạo tài khoản\n3. Nhập Mật khẩu mới và Xác nhận mật khẩu\n4. Bấm "Hoàn Tất & Vào App Hiệp Hội"\n5. Chuyển hướng sang màn hình Đăng nhập để xác thực phiên',
      inputData: 'Username, Password, Confirm Password',
      expected: 'Đăng ký tài khoản thành công, liên kết mã hội viên và chuyển sang màn hình đăng nhập bảo mật',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Form tạo mật khẩu an toàn, đối soát khớp mật khẩu 2 lần.',
    },

    // MOD-03: SMART CARD & DIGITAL BUSINESS CARDS
    {
      tcId: 'TC-CARD-001',
      module: 'Thẻ Hội Viên Thông Minh',
      subFeature: 'Hiển thị Thẻ Hội Viên VIP & Dấu tích xanh',
      screen: 'Màn hình Thẻ (/association/card)',
      precondition: 'Hội viên chính thức của CLB CEO 1983',
      steps: '1. Truy cập /association/card\n2. Quan sát giao diện thẻ điện tử',
      inputData: 'Member profile token',
      expected: 'Hiển thị dải màu Gold/Navy sang trọng, dấu tích xanh chính thức, Avatar, Mã M1983-xxx và thời hạn thẻ',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Sẵn sàng test trên cả iOS Safari và Android Chrome.',
    },
    {
      tcId: 'TC-CARD-002',
      module: 'Thẻ Hội Viên Thông Minh',
      subFeature: 'Chuyển đổi 3 giao diện thẻ điện tử',
      screen: 'Màn hình Thẻ (/association/card)',
      precondition: 'Hội viên đã đăng nhập',
      steps: '1. Bấm nút "Đổi phong cách thẻ"\n2. Chọn giữa: Classic Navy, Golden VIP, Modern Dark',
      inputData: 'Theme option: golden / dark / navy',
      expected: 'Màu nền, dải bóng gradient và họa tiết thẻ chuyển đổi tức thì không bị giật lag',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Hiệu ứng chuyển đổi mượt mà.',
    },
    {
      tcId: 'TC-CARD-003',
      module: 'Thẻ Hội Viên Thông Minh',
      subFeature: 'Popup Sinh mã QR vCard & Lưu danh bạ',
      screen: 'Popup QR Code (/association/card)',
      precondition: 'Hồ sơ có SĐT và Email',
      steps: '1. Bấm nút "Mã QR Chia sẻ"\n2. Mở Camera điện thoại quét mã QR',
      inputData: 'vCard string chuẩn VCF 3.0',
      expected: 'Camera điện thoại nhận diện danh thiếp và hiện nút "Thêm vào danh bạ" chứa đầy đủ Họ tên, Công ty, Chức vụ, SĐT',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Chuẩn vCard tương thích danh bạ iOS Contacts và Google Contacts.',
    },

    // MOD-04: NFC TAP
    {
      tcId: 'TC-NFC-001',
      module: 'Chạm Thẻ NFC',
      subFeature: 'Popup Radar quét và mô phỏng Chạm NFC',
      screen: 'Popup NFC Modal (/association/profile)',
      precondition: 'Trình duyệt có hỗ trợ Web NFC hoặc chạy giả lập',
      steps: '1. Bấm nút "Chạm Thẻ NFC"\n2. Xem hiệu ứng sóng phát xạ radar\n3. Bấm "Mô Phỏng Chạm Kết Nối"',
      inputData: 'NFC trigger click',
      expected: 'Popup hiển thị sóng phát xạ đẹp mắt, thông báo kết nối thành công và chuyển sang trang trao đổi danh thiếp',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Giao diện và API đọc/ghi Web NFC đã code hoàn thiện; sẵn sàng cho bước chạm thực tế thẻ vật lý NTAG213/215.',
    },
    {
      tcId: 'TC-NFC-002',
      module: 'Chạm Thẻ NFC',
      subFeature: 'Ghi URL Danh thiếp vào phôi thẻ NFC',
      screen: 'Popup Ghi thẻ NFC (/association/business-cards)',
      precondition: 'Thiết bị hỗ trợ ghi NDEF (Android Chrome)',
      steps: '1. Mở chức năng Ghi thẻ NFC\n2. Đưa phôi thẻ sát mặt lưng điện thoại\n3. Bấm Ghi dữ liệu',
      inputData: 'URL vCard: https://vione.vn/association/c/M1983-007',
      expected: 'Ghi bản ghi NDEF URI thành công, khóa quyền ghi đè nếu chọn',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Logic mã hóa NDEF Message đã sẵn sàng.',
    },

    // MOD-05: QR SCANNER & REALTIME HANDSHAKE
    {
      tcId: 'TC-QR-001',
      module: 'Quét Mã QR & Kết Nối Realtime',
      subFeature: 'Quét mã QR Hội viên phần cứng Native (Google Code Scanner)',
      screen: 'Modal Quét QR Hội Viên (AssociationMemberQrModal)',
      precondition: 'Đang mở Ứng dụng Hiệp Hội CLB CEO 1983',
      steps: '1. Vào màn hình Thẻ hội viên hoặc Trang chủ, chọn chức năng "Mã QR Hội Viên"\n2. Chuyển sang tab "Quét QR"\n3. Hệ thống tự động kích hoạt máy quét camera phần cứng Google Code Scanner\n4. Hướng camera về phía mã QR hội viên CLB CEO 1983 hoặc thẻ vCard đối tác\n5. Máy quét tự động lấy nét, rung phản hồi và nhận diện dữ liệu QR\n6. Màn hình tự động hiển thị thẻ hồ sơ đối tác với đầy đủ avatar, họ tên, chức vụ, doanh nghiệp và các nút "Lưu kết nối", "Gọi điện", "Gửi email"',
      inputData: 'Mã QR hội viên CEO 1983 hoặc mã QR vCard',
      expected: 'Camera mở tức thì, quét mã QR nhạy và nhận diện thông tin đối tác chính xác 100%',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Đã tích hợp máy quét native phần cứng Google Play Services.',
    },
    {
      tcId: 'TC-QR-002',
      module: 'Quét Mã QR & Kết Nối Realtime',
      subFeature: 'Căn giữa tuyệt đối Modal Quét QR trên di động (Grid Centering Safe-Area)',
      screen: 'Modal AssociationQrScanModal & AssociationMemberQrModal',
      precondition: 'Mở ứng dụng trên điện thoại di động các kích thước màn hình khác nhau (iPhone, Android)',
      steps: '1. Tại Trang chủ hoặc Thẻ hội viên, bấm biểu tượng Quét QR hoặc Mã QR Thẻ\n2. Quan sát vị trí popup trên màn hình điện thoại dọc và ngang\n3. Kiểm tra popup có nằm chính giữa màn hình theo cả 2 trục ngang và dọc\n4. Kiểm tra popup không bị lệch lên trên, không bị tụt xuống dưới và không bị che khuất bởi tai thỏ / thanh điều hướng',
      inputData: 'Kích thước viewport di động (390x844, 412x915, v.v.)',
      expected: 'Popup hiển thị căn giữa tuyệt đối 100% viewport (grid place-items-center, 100dvh, my-auto, max-h-[88dvh]), padding safe-area đầy đủ',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Đã chuẩn hóa CSS Grid và Safe Area Insets.',
    },
    {
      tcId: 'TC-QR-003',
      module: 'Quét Mã QR & Kết Nối Realtime',
      subFeature: 'Khung ngắm Camera in-modal & Gỡ bỏ hook native gây lỗi trên Home tab',
      screen: 'Modal AssociationMemberQrModal & MainActivity.java',
      precondition: 'Người dùng mở App Hiệp hội',
      steps: '1. Mở Home tab -> Xác nhận máy quét Native không tự động bật chiếm quyền màn hình\n2. Bấm nút "Mã QR" -> Chọn tab "Quét QR"\n3. Quan sát video viewfinder camera HTML5 hiển thị ngay bên trong khung modal\n4. Kiểm tra camera lấy nét và đọc mã QR trực tiếp trong khung modal',
      inputData: 'QR Camera feed',
      expected: 'Camera render mượt mà ngay trong khung modal (in-modal viewfinder); gỡ bỏ hoàn toàn interceptor text scanner hook native gây lỗi trên Trang chủ',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 4: Khắc phục triệt để lỗi giật màn hình và cướp quyền camera native trên Android.',
    },
    {
      tcId: 'TC-CONN-001',
      module: 'Quét Mã QR & Kết Nối Realtime',
      subFeature: 'Popup nhận yêu cầu kết nối tức thời (Realtime Incoming Connection Modal)',
      screen: 'Modal Toàn cục IncomingConnectionModal (/association/*)',
      precondition: 'Cả hai tài khoản đang trực tuyến trên ứng dụng Hiệp hội',
      steps: '1. Tài khoản A gửi yêu cầu kết nối tới tài khoản B\n2. Trên màn hình của B lập tức bật Popup toàn màn hình qua WebSocket\n3. Popup hiển thị avatar và thông tin của A đã lọc theo quyền riêng tư của A\n4. Bấm thử nút "Để sau" để đóng an toàn\n5. Bấm nút "Chấp nhận ngay" để tạo kết nối và lưu danh bạ đối tác',
      inputData: 'Sự kiện Socket.IO connection:requested',
      expected: 'Popup tự bật ngay lập tức khi có yêu cầu đến, xử lý chấp nhận/từ chối mượt mà',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Đồng bộ realtime qua WebSocket gateway.',
    },
    {
      tcId: 'TC-CONN-002',
      module: 'Quét Mã QR & Kết Nối Realtime',
      subFeature: 'Handshake 2 chiều: Tự đóng QR modal người quét & Bật popup đối tác',
      screen: 'AssociationMemberQrModal & IncomingConnectionModal',
      precondition: 'Tài khoản A quét mã QR của tài khoản B',
      steps: '1. Tài khoản A quét mã QR của B thành công\n2. Thẻ thông tin của B hiện ra với nút "Lưu kết nối"\n3. Tài khoản A bấm "Lưu kết nối"\n4. Quan sát màn hình tài khoản A: Modal QR tự động đóng ngay lập tức\n5. Quan sát màn hình tài khoản B: Lập tức bật IncomingConnectionModal nhận kết nối từ A',
      inputData: 'Event connection:requested & auto-close callback',
      expected: 'Modal QR tự động đóng trên thiết bị A sau khi lưu kết nối; thiết bị B nhận sự kiện realtime và bật popup kết nối kèm thông tin của A',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 4: Hoàn thiện luồng kết nối 2 chiều không để người quét phải bấm nút đóng thủ công.',
    },

    // MOD-06: PROFILE & DATA SYNC
    {
      tcId: 'TC-PRF-001',
      module: 'Trang Cá Nhân & Đồng Bộ',
      subFeature: 'Popup Cập nhật hồ sơ năng lực & Đổi ảnh bìa / avatar',
      screen: 'Trang cá nhân (/association/profile)',
      precondition: 'Đã đăng nhập',
      steps: '1. Bấm nút sửa hồ sơ\n2. Tải ảnh đại diện hoặc ảnh bìa mới\n3. Cập nhật tiểu sử doanh nhân\n4. Bấm Lưu',
      inputData: 'Image file & bio text',
      expected: 'Ảnh tải lên kho lưu trữ MinIO thành công, hồ sơ cập nhật tức thì trên trang cá nhân',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Hỗ trợ tải ảnh MinIO chuẩn định dạng.',
    },
    {
      tcId: 'TC-PRF-002',
      module: 'Trang Cá Nhân & Đồng Bộ',
      subFeature: 'Mở Modal Hướng dẫn sử dụng & Tải tài liệu Word/PDF',
      screen: 'Modal UserGuideModal (/association/profile)',
      precondition: 'Tại màn hình Trang cá nhân',
      steps: '1. Bấm mục "Hướng dẫn sử dụng App Doanh Nhân"\n2. Xem các tab và ảnh minh họa demo\n3. Bấm "Tải Word" và "Tải PDF"',
      inputData: 'User Guide modal click',
      expected: 'Modal mở lên mượt mà, đầy đủ các tab hướng dẫn kèm ảnh demo, bấm nút tải sẽ tải ngay file .docx và .pdf về máy',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Hỗ trợ tải trực tiếp tài liệu hướng dẫn.',
    },
    {
      tcId: 'TC-PRF-003',
      module: 'Trang Cá Nhân & Đồng Bộ',
      subFeature: 'Mở Modal Liên hệ Ban Thư Ký & Gửi form phản hồi',
      screen: 'Modal ContactSupportModal (/association/profile)',
      precondition: 'Tại màn hình Trang cá nhân',
      steps: '1. Bấm mục "Liên hệ Ban Thư Ký CLB CEO 1983"\n2. Xem Hotline 098.333.1983, Tổng đài 1900.6883, Zalo OA\n3. Nhập nội dung cần hỗ trợ và bấm "Gửi yêu cầu"',
      inputData: 'Feedback form data',
      expected: 'Hiển thị đầy đủ thông tin liên lạc chính thức, gửi yêu cầu thành công và hiện thông báo xác nhận',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tích hợp đầy đủ danh mục ban ngành.',
    },
    {
      tcId: 'TC-PRF-004',
      module: 'Trang Cá Nhân & Đồng Bộ',
      subFeature: 'Chuyển đổi Chế độ giao diện (Sáng / Tối / Tương phản) và Ngôn ngữ',
      screen: 'Trang cá nhân (/association/profile)',
      precondition: 'Đang mở app',
      steps: '1. Chọn Chế độ Sáng / Tối / Tương phản\n2. Chọn ngôn ngữ Tiếng Việt / English',
      inputData: 'Theme & Lang selection',
      expected: 'Toàn bộ màu sắc và văn bản chuyển đổi tức thì không cần tải lại trang',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'State reactivity tức thì.',
    },
    {
      tcId: 'TC-PRF-005',
      module: 'Trang Cá Nhân & Đồng Bộ',
      subFeature: 'Đồng bộ dữ liệu Profile thực tế giữa Home & Profile (Loại bỏ "Lê Hoàng Long")',
      screen: 'Trang chủ (/association) & Trang cá nhân (/association/profile)',
      precondition: 'Đăng nhập tài khoản hội viên bất kỳ (VD: Nguyễn Văn A)',
      steps: '1. Quan sát Header Trang chủ: Kiểm tra họ tên, avatar và mã hội viên\n2. Chuyển sang Trang cá nhân: Kiểm tra thông tin hiển thị\n3. Cập nhật họ tên hoặc chức vụ trong Profile\n4. Quay lại Trang chủ: Kiểm tra dữ liệu cập nhật tức thời',
      inputData: 'Hồ sơ hội viên đăng nhập thực tế',
      expected: 'Khớp 100% dữ liệu hội viên đang đăng nhập; loại bỏ hoàn toàn tên giả lập cứng "Lê Hoàng Long"; state reactive đồng bộ giữa Home và Profile',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 3: Triệt tiêu dữ liệu mock cứng, lấy nguồn chuẩn từ localStorage/API me.',
    },
    {
      tcId: 'TC-PRF-006',
      module: 'Trang Cá Nhân & Đồng Bộ',
      subFeature: 'Đồng bộ danh mục Profile chuẩn Image 3 & Phím tắt (+) tạo nhanh Danh thiếp số',
      screen: 'Trang cá nhân (/association/profile) & /association/business-cards',
      precondition: 'Tại Trang cá nhân',
      steps: '1. Kiểm tra danh mục các dòng menu khớp với ảnh thiết kế Image 3\n2. Quan sát dòng "Quản lý Danh thiếp số" có nút (+) màu xanh nổi bật\n3. Bấm vào dòng "Quản lý Danh thiếp số" -> Mở trang danh sách thẻ\n4. Quay lại, bấm trực tiếp vào nút (+) -> Mở thẳng modal tạo danh thiếp mới',
      inputData: 'Click action (+) trên dòng Quản lý danh thiếp',
      expected: 'Bấm vào dòng chuyển sang danh sách thẻ; bấm vào nút (+) mở trực tiếp form tạo mới danh thiếp (action=create)',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 11: Chuẩn hóa UX menu cá nhân theo bản vẽ tham chiếu.',
    },

    // MOD-07: B2B OPPORTUNITIES
    {
      tcId: 'TC-B2B-001',
      module: 'Cơ Hội Giao Thương B2B',
      subFeature: 'Đăng tin Chào mua / Chào bán & Hợp tác đầu tư',
      screen: 'Popup Tạo cơ hội B2B (/association/opportunities)',
      precondition: 'Hội viên chính thức',
      steps: '1. Vào Cơ hội B2B\n2. Bấm "Đăng tin mới"\n3. Chọn loại tin (Chào mua/bán), nhập tiêu đề, nội dung, giá trị dự kiến\n4. Bấm Đăng',
      inputData: 'B2B opportunity form data',
      expected: 'Tin được lưu vào hệ thống, hiển thị trên sàn giao thương B2B của CLB',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Đã đồng bộ trường dữ liệu với CRM Backend.',
    },
    {
      tcId: 'TC-OPP-002',
      module: 'Cơ Hội Giao Thương B2B',
      subFeature: 'Hiển thị ảnh tự tải lên, tab "Cơ hội của tôi", sort mới nhất & Ngày đăng',
      screen: 'Màn hình Cơ hội B2B (/association/opportunities)',
      precondition: 'Đã có các cơ hội được đăng',
      steps: '1. Mở /association/opportunities\n2. Kiểm tra ảnh đại diện tin: Đúng ảnh người dùng tải lên\n3. Kiểm tra ngày đăng hiển thị rõ ràng trên từng thẻ cơ hội\n4. Bấm tab "Cơ hội của tôi": Chỉ hiển thị các tin do chính tài khoản này tạo\n5. Bấm tab "Tất cả": Tin mới đăng luôn hiển thị ở vị trí đầu tiên (sorted newest-first)',
      inputData: 'Opportunity listing, My opportunities filter',
      expected: 'Hiển thị ảnh thực tế, lọc tab cá nhân chính xác, sắp xếp mới nhất lên đầu, hiển thị ngày đăng chi tiết',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 5: Sàn cơ hội B2B chuyên nghiệp, cá nhân hóa quản lý tin đăng.',
    },

    // MOD-08: PRODUCTS MARKETPLACE
    {
      tcId: 'TC-B2B-002',
      module: 'Gian Hàng Sản Phẩm',
      subFeature: 'Trưng bày sản phẩm & Chiết khấu nội bộ CLB',
      screen: 'Màn hình Sản phẩm (/association/products)',
      precondition: 'Doanh nghiệp có sản phẩm đăng ký',
      steps: '1. Vào Gian hàng sản phẩm\n2. Xem danh mục, chiết khấu nội bộ và bấm "Liên hệ hợp tác"',
      inputData: 'Product view & inquiry',
      expected: 'Hiển thị giá gốc, giá ưu đãi cho hội viên CEO 1983 và nút nhắn tin thẳng cho chủ doanh nghiệp',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Đồng bộ giá VIP hội viên.',
    },
    {
      tcId: 'TC-PROD-002',
      module: 'Gian Hàng Sản Phẩm',
      subFeature: 'Cách ly bookmark "Đã quan tâm" theo User & Tab "Sản phẩm tôi đăng"',
      screen: 'Màn hình Sản phẩm (/association/products)',
      precondition: 'Tài khoản mới tạo đăng nhập lần đầu',
      steps: '1. Đăng nhập tài khoản mới tạo, vào /association/products\n2. Bấm tab "Đã quan tâm": Kiểm tra số lượng là 0 sản phẩm (trống)\n3. Bấm icon Trái tim trên 1 sản phẩm -> Số lượng quan tâm tăng lên 1\n4. Đăng nhập tài khoản khác -> Tab "Đã quan tâm" không bị dính sản phẩm của tài khoản trước\n5. Bấm tab "Sản phẩm tôi đăng" -> Xem danh sách sản phẩm do chính doanh nghiệp mình đăng tải',
      inputData: 'vba_interested_products_${userId}',
      expected: 'Bookmark quan tâm được lưu độc lập theo từng userId, tài khoản mới luôn khởi tạo từ 0, tab sản phẩm tôi đăng hoạt động chuẩn xác',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 6: Khắc phục lỗi rò rỉ bookmark giữa các tài khoản.',
    },
    {
      tcId: 'TC-PROD-003',
      module: 'Gian Hàng Sản Phẩm',
      subFeature: 'Giao diện lưới 2 cột phong cách E-Commerce & Sắp xếp mới nhất',
      screen: 'Màn hình Sản phẩm (/association/products)',
      precondition: 'Danh sách sản phẩm phong phú',
      steps: '1. Mở /association/products trên mobile hoặc desktop\n2. Quan sát lưới hiển thị: Dạng 2 cột (grid-cols-2) cân đối\n3. Kiểm tra cấu trúc thẻ: Ảnh tỉ lệ vuông, badge ưu đãi hội viên, tên sản phẩm, công ty, giá gốc gạch ngang, giá VIP màu hổ phách, huy hiệu ngày\n4. Đăng 1 sản phẩm mới -> Kiểm tra sản phẩm mới lập tức xuất hiện ở vị trí đầu tiên',
      inputData: '2-column grid layout, newest-first sorting',
      expected: 'Bố cục 2 cột chuẩn sàn thương mại điện tử hiện đại, phân cấp giá rõ nét, sản phẩm mới nhất luôn lên đầu trang',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 6: Redesign toàn diện UI gian hàng sản phẩm.',
    },

    // MOD-09: EVENTS & TICKETING
    {
      tcId: 'TC-EVT-001',
      module: 'Sự Kiện & Check-in QR',
      subFeature: 'Đăng ký tham dự sự kiện & Nhận vé điện tử',
      screen: 'Màn hình Sự kiện (/association/events)',
      precondition: 'Sự kiện đang mở đăng ký',
      steps: '1. Chọn sự kiện "Diễn đàn Kinh tế CEO 1983"\n2. Bấm "Đăng ký tham dự"',
      inputData: 'Event registration click',
      expected: 'Hệ thống xác nhận giữ chỗ, xuất vé điện tử kèm mã QR điểm danh',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Đã test luồng vé điện tử.',
    },
    {
      tcId: 'TC-EVT-002',
      module: 'Sự Kiện & Check-in QR',
      subFeature: 'Check-in bằng mã QR tại cửa hội trường',
      screen: 'Popup QR Scanner (/association/history)',
      precondition: 'Đã có vé mời sự kiện',
      steps: '1. Mở màn hình Check-in\n2. Đưa mã QR vào máy quét của ban lễ tân',
      inputData: 'QR token check-in payload',
      expected: 'Ghi nhận điểm danh thành công, xuất số bàn tiệc VIP và chào mừng lên màn hình LED',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tương thích máy quét ban tổ chức.',
    },
    {
      tcId: 'TC-EVT-003',
      module: 'Sự Kiện & Check-in QR',
      subFeature: 'Biểu quyết trực tiếp & Bầu cử thời gian thực',
      screen: 'Màn hình Biểu quyết (/association/voting)',
      precondition: 'Phiên biểu quyết đang hoạt động',
      steps: '1. Vào mục Biểu quyết\n2. Chọn phương án "Đồng ý"\n3. Bấm "Gửi phiếu bầu"',
      inputData: 'Voting option ID',
      expected: 'Phiếu bầu được mã hóa, gửi thành công, biểu đồ kết quả cập nhật số liệu trực tiếp',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Mã hóa phiếu bầu an toàn.',
    },
    {
      tcId: 'TC-EVT-004',
      module: 'Sự Kiện & Check-in QR',
      subFeature: 'Thẻ sự kiện Poster 2:3 có nhãn độ tuổi (16+, 18+, 13+) & Backdrop /events',
      screen: 'Trang chủ (/association) & Màn hình Sự kiện (/association/events)',
      precondition: 'Có sự kiện trên hệ thống',
      steps: '1. Vào Trang chủ: Quan sát khối Sự kiện hiển thị dạng thẻ dọc tỉ lệ 2:3 phong cách poster giải trí\n2. Kiểm tra nhãn độ tuổi (16+, 18+, 13+) góc trên poster kèm đánh giá sao\n3. Chuyển sang /association/events: Quan sát phần Header trên cùng\n4. Kiểm tra Header backdrop với vệt sáng sân khấu, ánh sáng vàng kim và huy hiệu',
      inputData: 'Poster 2:3, Age rating badges',
      expected: 'Thẻ sự kiện tỉ lệ poster 2:3 chuẩn điện ảnh/show giải trí, nhãn tuổi rõ nét; màn hình sự kiện có backdrop sân khấu sang trọng',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 7: Nâng cấp thẩm mỹ giao diện sự kiện theo bản vẽ tham chiếu Image 1.',
    },

    // MOD-10: HOME LAYOUT ORDERING
    {
      tcId: 'TC-HOME-001',
      module: 'Trang Chủ & Bố Cục',
      subFeature: 'Header chào đón hội viên & Thanh thao tác nhanh 4 nút',
      screen: 'Trang chủ (/association)',
      precondition: 'Đã đăng nhập',
      steps: '1. Vào Trang chủ\n2. Kiểm tra thông tin avatar, tên hội viên, mã M1983\n3. Kiểm tra 4 nút thao tác nhanh: Thẻ số, Quét QR, B2B, Hộp thư',
      inputData: 'Home load',
      expected: 'Hiển thị đầy đủ thông tin định danh và 4 nút chức năng hoạt động nhạy',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Header tương tác thời gian thực.',
    },
    {
      tcId: 'TC-HOME-002',
      module: 'Trang Chủ & Bố Cục',
      subFeature: 'Bố cục thứ tự Trang chủ: Sự kiện -> Cơ hội -> Sản phẩm',
      screen: 'Trang chủ (/association)',
      precondition: 'Đang ở màn hình Trang chủ',
      steps: '1. Mở /association và cuộn từ trên xuống dưới\n2. Xác nhận khối đầu tiên sau Banner là: "SỰ KIỆN NỔI BẬT" (dạng poster 2:3)\n3. Xác nhận khối tiếp theo ở giữa là: "CƠ HỘI GIAO THƯƠNG B2B" (dạng thẻ ngang middle banner)\n4. Xác nhận khối tiếp theo ở dưới là: "GIAN HÀNG SẢN PHẨM TIÊU BIỂU" (dạng lưới 2 cột e-commerce)',
      inputData: 'Section order verification',
      expected: 'Thứ tự hiển thị tuân thủ nghiêm ngặt: Sự kiện (Events) -> Cơ hội (Opportunities) -> Sản phẩm (Products), đúng chuẩn chỉ đạo nghiệp vụ',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 8: Hoàn thiện luồng thị giác và ưu tiên hiển thị nội dung trên trang chủ.',
    },

    // MOD-11: NOTIFICATIONS
    {
      tcId: 'TC-NOTIF-001',
      module: 'Thông Báo & Tin Tức Hệ Thống',
      subFeature: 'Nhận thông báo nhắc nhở sự kiện và hoạt động CLB',
      screen: 'Màn hình Thông báo (/association/notifications)',
      precondition: 'Có hoạt động mới trong CLB',
      steps: '1. Mở trung tâm thông báo\n2. Xem danh sách thông báo và đánh dấu đã đọc',
      inputData: 'Notification click',
      expected: 'Hiển thị danh sách thông báo theo thứ tự thời gian, đánh dấu đã đọc thành công',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Lưu trữ thông báo an toàn.',
    },
    {
      tcId: 'TC-NOTIF-002',
      module: 'Thông Báo & Tin Tức Hệ Thống',
      subFeature: 'Cách ly thông báo theo User & Lời chào mừng chính thức CEO 1983',
      screen: 'Màn hình Thông báo (/association/messages hoặc tab thông báo)',
      precondition: 'Tài khoản mới đăng nhập lần đầu',
      steps: '1. Đăng nhập tài khoản mới\n2. Mở danh sách thông báo\n3. Xác nhận KHÔNG bị nhồi nhét các thông báo sự kiện/cơ hội cũ trước thời điểm tạo tài khoản\n4. Xác nhận có 1 thông báo chào mừng trang trọng từ Ban Quản Trị CLB Doanh Nhân CEO 1983',
      inputData: 'userCreatedAt filter, welcome notification',
      expected: 'Thông báo lọc theo thời điểm tạo tài khoản, không bị spam dữ liệu rác, có thông báo chào mừng chính thức',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 9: Chuẩn hóa trải nghiệm người dùng mới, tránh ô nhiễm thông báo.',
    },

    // MOD-12: MESSAGING & REALTIME CHAT
    {
      tcId: 'TC-MSG-001',
      module: 'Gắn Kết & Tin Nhắn',
      subFeature: 'Hiển thị danh sách cuộc trò chuyện & Snippet tin nhắn mới nhất',
      screen: 'Màn hình Hộp thư (/association/messages)',
      precondition: 'Có các cuộc trò chuyện trước đó',
      steps: '1. Vào /association/messages\n2. Kiểm tra danh sách cuộc trò chuyện\n3. Kiểm tra snippet tin nhắn cuối cùng và thời gian',
      inputData: 'Thread list query',
      expected: 'Hiển thị đúng tên người gửi, avatar, nội dung mới nhất, nhãn "HỆ THỐNG" (nếu có) và thời gian tương đối',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Đã tối ưu query tin nhắn.',
    },
    {
      tcId: 'TC-MSG-002',
      module: 'Gắn Kết & Tin Nhắn',
      subFeature: 'Giao diện Chat chuẩn phong cách Messenger 100%',
      screen: 'Màn hình Chat chi tiết (/association/messages?thread=xxx)',
      precondition: 'Cuộc trò chuyện đang mở',
      steps: '1. Gửi tin nhắn mới\n2. Nhận tin nhắn từ đối tác\n3. Kiểm tra style bong bóng chat',
      inputData: 'Tin nhắn văn bản',
      expected: 'Tin người gửi: Màu xanh Messenger (#0084FF), bo góc 16px, chữ trắng. Tin đối tác: Màu xám (#F0F2F5/#303030), có avatar 28px bên trái',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Giao diện chuẩn phong cách Facebook Messenger.',
    },
    {
      tcId: 'TC-MSG-003',
      module: 'Gắn Kết & Tin Nhắn',
      subFeature: 'Thu hồi tin nhắn (Recall) & Nhảy top luồng chat ngay lập tức',
      screen: 'Màn hình Chat & Danh sách Hộp thư',
      precondition: 'Tin nhắn do chính người dùng gửi',
      steps: '1. Rê chuột hoặc chạm vào tin nhắn của mình\n2. Bấm nút dấu ba chấm (⋯)\n3. Chọn "Thu hồi tin nhắn"\n4. Quay lại danh sách tin nhắn ngoài',
      inputData: 'Message retract action',
      expected: 'Bong bóng chat đổi thành viền nét đứt "Bạn đã thu hồi một tin nhắn". Ngoài danh sách, cuộc trò chuyện lập tức nhảy lên vị trí đầu tiên với snippet "Bạn đã thu hồi một tin nhắn"',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Hỗ trợ thu hồi realtime.',
    },
    {
      tcId: 'TC-MSG-004',
      module: 'Gắn Kết & Tin Nhắn',
      subFeature: 'Thanh tương tác nhanh nằm ngang (Thả cảm xúc 😊 và Tùy chọn ⋯)',
      screen: 'Màn hình Chat (/association/messages)',
      precondition: 'Có tin nhắn trên màn hình',
      steps: '1. Rê chuột hoặc chạm vào bong bóng tin nhắn\n2. Bấm biểu tượng mặt cười (😊) -> Chọn ❤️\n3. Kiểm tra hiển thị reaction pill',
      inputData: 'Emoji: ❤️, 👍, 😂, 😮, 😢, 😡',
      expected: 'Thanh công cụ xuất hiện nằm ngang cạnh bong bóng, thả cảm xúc gắn huy hiệu nhỏ dưới chân bong bóng chat',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Reaction bar mượt mà.',
    },
    {
      tcId: 'TC-MSG-005',
      module: 'Gắn Kết & Tin Nhắn',
      subFeature: 'Gọi thoại & Gọi video WebRTC 1-1 / Nhóm',
      screen: 'Popup Call WebRTC (/association/messages)',
      precondition: '2 hội viên đang online cùng lúc',
      steps: '1. Bấm biểu tượng Điện thoại hoặc Camera tại đầu cuộc trò chuyện\n2. Chờ kết nối signaling WebSockets\n3. Thiết lập kết nối P2P Audio/Video',
      inputData: 'WebRTC Offer / Answer / ICE Candidates',
      expected: 'Cửa sổ cuộc gọi hiện lên, stream video/audio giữa 2 bên, có nút bật/tắt mic, camera và kết thúc cuộc gọi',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Backend signaling gateway Socket.io và giao diện UI phòng gọi đã xong 100%; sẵn sàng kiểm thử P2P trên 2 thiết bị di động thật.',
    },
    {
      tcId: 'TC-MSG-006',
      module: 'Gắn Kết & Tin Nhắn',
      subFeature: 'Tạo nhóm chat phong cách Messenger (CreateGroupChatModal)',
      screen: 'Màn hình Hộp thư & Popup Tạo nhóm (/association/messages)',
      precondition: 'Người dùng đang ở mục Tin nhắn',
      steps: '1. Bấm nút "Tạo nhóm" trên thanh hoạt động đầu trang hoặc nút "Tạo nhóm chat ngay" ở tab Nhóm\n2. Chọn Avatar/Emoji đại diện (👥, 🚀, 💼, 💎)\n3. Chọn tên gợi ý hoặc nhập tên nhóm\n4. Tìm kiếm và chọn thành viên (hiển thị carousel chip đã chọn, checkbox tròn tích xanh động)\n5. Bấm "Tạo nhóm (N)"',
      inputData: 'GroupName, GroupAvatar, MemberIds[]',
      expected: 'Nhóm chat được tạo thành công, tự động mở thread nhóm với tin nhắn hệ thống [system] căn giữa, danh sách tin nhắn nhóm lưu trữ đồng bộ',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Trải nghiệm tạo nhóm giống Messenger, hỗ trợ carousel thành viên và gợi ý tên.',
    },
    {
      tcId: 'TC-MSG-007',
      module: 'Gắn Kết & Tin Nhắn',
      subFeature: 'Quản lý thành viên nhóm & Xem hồ sơ thành viên (GroupMembersModal)',
      screen: 'Thread Chat nhóm (/association/messages?thread=group_xxx)',
      precondition: 'Đang trong cuộc trò chuyện nhóm',
      steps: '1. Quan sát Header hiển thị Avatar emoji nhóm, tên nhóm và số lượng thành viên\n2. Bấm nút "Thành viên" trên header hoặc bấm vào phụ đề tên nhóm\n3. Quan sát Popup danh sách thành viên nhóm\n4. Bấm vào một thành viên để xem Profile chi tiết',
      inputData: 'Group peer data, member list',
      expected: 'Popup hiển thị danh sách toàn bộ thành viên trong nhóm kèm avatar, tên, chức danh; bấm vào thành viên mở ProfileModal; không hiển thị cảnh báo người lạ trong nhóm',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Roster sheet đầy đủ danh sách thành viên.',
    },
    {
      tcId: 'TC-MSG-008',
      module: 'Gắn Kết & Tin Nhắn',
      subFeature: 'Khử trùng lặp tin nhắn (Deduplication), Socket Realtime & Xóa badge unread',
      screen: 'Màn hình Chat (/association/messages)',
      precondition: 'Đang mở cuộc trò chuyện',
      steps: '1. Mở cuộc trò chuyện có tin nhắn chưa đọc -> Quan sát badge số unread biến mất ngay lập tức\n2. Gửi tin nhắn liên tục -> Xác nhận tin nhắn hiển thị đúng 1 lần, không bị trùng lặp (deduplicated by signature + timestamp 15s)\n3. Đối tác gửi tin nhắn qua WebSocket -> Tin nhắn xuất hiện tức thời (member:message_received)',
      inputData: 'Text signature deduplication, Socket events',
      expected: 'Không bao giờ bị trùng lặp tin nhắn; nhận tin nhắn realtime qua WebSocket; xóa badge tin chưa đọc tức thì khi mở thread',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 10: Xử lý triệt để bài toán đồng bộ tin nhắn realtime và tối ưu UX.',
    },
    {
      tcId: 'TC-MSG-009',
      module: 'Gắn Kết & Tin Nhắn',
      subFeature: 'Thanh nhập tin nhắn Mobile với nút (+) mở rộng & Popup Call tương tác',
      screen: 'Màn hình Chat (/association/messages?thread=xxx)',
      precondition: 'Xem trên màn hình điện thoại di động hẹp',
      steps: '1. Quan sát thanh nhập tin nhắn dưới đáy màn hình điện thoại\n2. Kiểm tra chỉ có nút (+) mở rộng bên trái và nút Gửi bên phải, không bị tràn 3 nút inline\n3. Bấm nút (+) -> Menu mở lên với 3 tùy chọn: "Gửi hình ảnh", "Gửi tài liệu", "Chia sẻ vị trí"\n4. Bấm nút Gọi thoại/Video ở Header -> Hộp thoại gọi hiển thị tương tác đầy đủ các nút mic, camera, kết thúc',
      inputData: 'Mobile input expander click',
      expected: 'Thanh nhập tin nhắn mobile gọn gàng, không tràn mép, menu (+) mở rộng tiện lợi, popup cuộc gọi phản hồi tương tác đầy đủ',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 10: Tối ưu hóa layout chat trên màn hình điện thoại.',
    },

    // MOD-13: NEWS & DUAL TABS
    {
      tcId: 'TC-NEWS-001',
      module: 'Tin Tức & Truyền Thông',
      subFeature: 'Đọc bản tin hoạt động CLB CEO 1983',
      screen: 'Màn hình Tin tức (/association/news)',
      precondition: 'Có bài viết mới',
      steps: '1. Mở /association/news\n2. Bấm vào bài viết để đọc chi tiết',
      inputData: 'News article click',
      expected: 'Hiển thị bài viết chi tiết, hình ảnh chất lượng cao và ngày đăng',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Giao diện đọc báo mượt mà.',
    },
    {
      tcId: 'TC-NEWS-002',
      module: 'Tin Tức & Truyền Thông',
      subFeature: 'Tab kép: [ Tin tức CLB ] & [ Sự kiện Hiệp Hội ] trong /association/news',
      screen: 'Màn hình Tin tức (/association/news)',
      precondition: 'Tại màn hình Tin tức',
      steps: '1. Mở /association/news\n2. Quan sát 2 tab trên cùng: [ 📰 Tin tức CLB ] và [ 📅 Sự kiện Hiệp Hội ]\n3. Mặc định ở Tab Tin tức: Đọc các bài báo hoạt động\n4. Chuyển sang Tab Sự kiện: Xem danh sách sự kiện kèm poster, địa điểm, thời gian\n5. Bấm "Xem chi tiết sự kiện" -> Điều hướng sang /association/events',
      inputData: 'Tab toggle [news] vs [events]',
      expected: 'Chuyển đổi mượt mà giữa 2 tab tin tức và sự kiện hiệp hội, hiển thị poster và nút xem chi tiết tiện lợi',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 12: Tích hợp tab kép hỗ trợ hội viên nắm bắt nhanh cả tin tức lẫn lịch sự kiện.',
    },

    // MOD-14: SECURITY & ACCOUNT MANAGEMENT
    {
      tcId: 'TC-SEC-001',
      module: 'Cài Đặt & Bảo Mật Hệ Thống',
      subFeature: 'Quản lý thông báo và cài đặt ứng dụng',
      screen: 'Cài đặt (/association/settings)',
      precondition: 'Đã đăng nhập',
      steps: '1. Vào Cài đặt\n2. Bật/tắt thông báo đẩy, âm thanh thông báo',
      inputData: 'Toggle notification settings',
      expected: 'Lưu cài đặt thành công vào hệ thống',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Quản trị cài đặt cá nhân.',
    },
    {
      tcId: 'TC-SEC-002',
      module: 'Cài Đặt & Bảo Mật Hệ Thống',
      subFeature: 'Đổi mật khẩu (/users/change-password) & Khóa nút "Đăng xuất" cho đến khi đổi pass',
      screen: 'Màn hình Cài đặt Bảo mật (/association/settings)',
      precondition: 'Đang ở tab Bảo mật',
      steps: '1. Mở /association/settings -> Chọn tab "Bảo mật"\n2. Kiểm tra không còn form tải ảnh đại diện trong tab bảo mật (đã chuyển về Profile)\n3. Quan sát nút "Đăng xuất": Đang bị làm mờ / vô hiệu hóa (disabled)\n4. Nhập Mật khẩu hiện tại, Mật khẩu mới và Xác nhận mật khẩu mới\n5. Bấm "Lưu mật khẩu mới" -> Hệ thống gọi API /users/change-password\n6. Sau khi cập nhật thành công: Nút "Đăng xuất" được kích hoạt và cho phép bấm',
      inputData: 'Old pass, New pass, Confirm pass',
      expected: 'Mật khẩu cập nhật thành công qua endpoint /users/change-password; nút Đăng xuất bị khóa chặt cho đến khi đổi mật khẩu trong phiên làm việc',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 13: Đảm bảo hội viên hoàn tất cập nhật mật khẩu trước khi đăng xuất phiên.',
    },
    {
      tcId: 'TC-SEC-003',
      module: 'Cài Đặt & Bảo Mật Hệ Thống',
      subFeature: 'Vô hiệu hóa tài khoản hội viên kèm xác nhận mật khẩu',
      screen: 'Màn hình Cài đặt Bảo mật (/association/settings)',
      precondition: 'Hội viên muốn tạm khóa tài khoản',
      steps: '1. Mở tab Bảo mật, cuộn xuống khu vực "Vùng nguy hiểm"\n2. Bấm "Vô hiệu hóa tài khoản"\n3. Modal xác nhận hiện ra, yêu cầu nhập mật khẩu bảo mật\n4. Nhập mật khẩu và bấm "Xác nhận vô hiệu hóa"\n5. Backend cập nhật user_profiles.account_status = deactivated\n6. Hệ thống tự động xóa phiên và đăng xuất an toàn về màn hình login',
      inputData: 'Deactivation password confirmation',
      expected: 'Cập nhật trạng thái tài khoản sang deactivated, hủy phiên đăng nhập an toàn, tuân thủ tiêu chuẩn an toàn bảo mật',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 13: Bổ sung luồng vô hiệu hóa tài khoản hội viên chuẩn mực.',
    },

    // MOD-15: DIRECTORY & PRIVACY
    {
      tcId: 'TC-DIR-001',
      module: 'Danh Bạ & Quyền Riêng Tư',
      subFeature: 'Tìm kiếm và lọc hội viên theo ngành nghề',
      screen: 'Màn hình Danh bạ (/association/members)',
      precondition: 'Dữ liệu danh bạ có sẵn trong hệ thống',
      steps: '1. Nhập từ khóa vào ô tìm kiếm\n2. Chọn phân loại ngành hàng (BĐS, Xây dựng, Tài chính...)',
      inputData: 'Search query: "Long" hoặc filter: "Bất động sản"',
      expected: 'Danh sách lọc đúng và tức thì theo thời gian thực',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Bộ lọc đa tiêu chí.',
    },
    {
      tcId: 'TC-DIR-002',
      module: 'Danh Bạ & Quyền Riêng Tư',
      subFeature: 'Popup Hồ sơ năng lực hội viên khi bấm vào Avatar',
      screen: 'Modal MemberProfileModal (/association/members, /messages)',
      precondition: 'Bấm vào Avatar bất kỳ',
      steps: '1. Trong danh bạ hoặc trong màn hình chat, bấm vào Avatar hội viên\n2. Kiểm tra Modal xuất hiện',
      inputData: 'Click avatar',
      expected: 'Popup hiển thị đầy đủ thông tin: Ảnh đại diện, Chức danh, Công ty, Mã hội viên, Nhu cầu kết nối và nút hành động',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Hiển thị đầy đủ năng lực hội viên.',
    },
    {
      tcId: 'TC-DIR-003',
      module: 'Danh Bạ & Quyền Riêng Tư',
      subFeature: 'Nút chuyển đổi trạng thái Kết nối <-> Hủy kết nối thông minh',
      screen: 'Modal MemberProfileModal',
      precondition: 'Hội viên đã có kết nối với đối tác',
      steps: '1. Mở Modal của người đã kết nối -> Kiểm tra nút hiển thị "HỦY KẾT NỐI" (viền đỏ)\n2. Bấm "HỦY KẾT NỐI" -> Nút chuyển sang "KẾT NỐI NGAY" (màu xanh)\n3. Bấm "KẾT NỐI NGAY" -> Nút chuyển lại thành "HỦY KẾT NỐI"',
      inputData: 'Toggle connection state',
      expected: 'Nút hành động tự động chuyển đổi thông minh, cập nhật localStorage vba.connected_members và gửi tín hiệu API',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Thao tác 1 chạm thuận tiện.',
    },
    {
      tcId: 'TC-PRIV-001',
      module: 'Danh Bạ & Quyền Riêng Tư',
      subFeature: 'Quét mã QR & Chạm thẻ NFC tuân thủ cài đặt quyền riêng tư đối tác',
      screen: 'Modal Quét QR/NFC (AssociationQrScanModal)',
      precondition: 'Tài khoản B đã cài đặt ẩn một số trường (SĐT, Email)',
      steps: '1. Tài khoản A quét mã QR hoặc chạm thẻ NFC của Tài khoản B\n2. Hệ thống giải mã và mở Modal Hồ Sơ Đối Tác B\n3. Kiểm tra Avatar, Họ tên và Doanh nghiệp hiển thị đúng theo cấu hình B cho phép\n4. Kiểm tra các trường bị ẩn hiển thị nhãn "Đã ẩn theo cài đặt riêng tư"\n5. Các nút gọi điện hoặc gửi email bị vô hiệu hóa đối với trường bị ẩn',
      inputData: 'Mã QR hoặc thẻ NFC của hội viên B',
      expected: 'Thông tin hiển thị chuẩn theo quyền riêng tư của đối tác, bảo mật tuyệt đối',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Bảo mật quyền riêng tư cá nhân.',
    },

    // MOD-16: VIETQR & FEES
    {
      tcId: 'TC-FEE-001',
      module: 'Hội Phí & VietQR',
      subFeature: 'Nhận thông báo nhắc đóng hội phí niên khóa trong tin nhắn',
      screen: 'Tin nhắn hệ thống (/association/messages)',
      precondition: 'Đến kỳ đóng hội phí',
      steps: '1. Mở cuộc trò chuyện "Ban Thư Ký CLB"\n2. Xem hóa đơn nhắc nợ hội phí',
      inputData: 'Fee notification payload',
      expected: 'Bong bóng tin nhắn hiển thị số tiền hội phí và nút "Thanh toán ngay qua VietQR"',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Hóa đơn nhắc nợ trực quan.',
    },
    {
      tcId: 'TC-FEE-002',
      module: 'Hội Phí & VietQR',
      subFeature: 'Sinh mã VietQR Napas 247 tự động số tiền và nội dung chuyển khoản',
      screen: 'Popup Thanh toán VietQR',
      precondition: 'Hội viên bấm nút Thanh toán',
      steps: '1. Bấm "Thanh toán VietQR"\n2. Quan sát mã QR hiển thị\n3. Quét bằng ứng dụng ngân hàng bất kỳ',
      inputData: 'Mã hội viên: M1983-007, Số tiền: 5.000.000 VNĐ',
      expected: 'App ngân hàng tự động điền: Số tài khoản CLB, Số tiền 5.000.000đ và Nội dung "CLB1983 M1983007"',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tương thích Napas 247 trên mọi app ngân hàng.',
    },
    {
      tcId: 'TC-FEE-003',
      module: 'Hội Phí & VietQR',
      subFeature: 'Webhook gạch nợ tự động qua tài khoản ngân hàng',
      screen: 'Lịch sử thanh toán & Trạng thái hội viên',
      precondition: 'Giao dịch chuyển khoản ngân hàng thành công',
      steps: '1. Ngân hàng gọi webhook tới /api/webhooks/vietqr/payment\n2. Hệ thống kiểm tra số tiền và nội dung\n3. Gạch nợ hóa đơn và gia hạn thẻ 12 tháng',
      inputData: 'Bank webhook payload',
      expected: 'Hệ thống tự động gạch nợ trong 5 giây, xuất hóa đơn VAT và gửi thông báo cảm ơn',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Logic webhook và gạch nợ backend đã code hoàn chỉnh; sẵn sàng kết nối webhook tài khoản ngân hàng chính thức.',
    },

    // MOD-17: CRM & SEATING MAP
    {
      tcId: 'TC-CRM-001',
      module: 'Quản Trị CRM & Sơ Đồ Khán Phòng',
      subFeature: 'Phân quyền Sidebar theo vai trò (Platform Admin vs Association Admin) & Ẩn "Quyền của tôi"',
      screen: 'Sidebar Quản trị CRM (/dashboard, /members, v.v.)',
      precondition: 'Đăng nhập với các tài khoản vai trò khác nhau',
      steps: '1. Đăng nhập tài khoản Quản trị Hiệp hội (admin/association)\n2. Kiểm tra Sidebar: Xác nhận ĐÃ XÓA HOÀN TOÀN mục "Quyền của tôi"\n3. Kiểm tra Sidebar: Xác nhận KHÔNG HIỂN THỊ module "Quản trị nền tảng" (Platform Admin)\n4. Đăng nhập tài khoản Trưởng ban tài chính -> Kiểm tra chỉ hiển thị các module Tài chính/Hội phí\n5. Đăng nhập tài khoản Super Admin (platform_admin) -> Kiểm tra hiển thị đầy đủ mọi phân hệ',
      inputData: 'Role switching: platform_admin vs admin vs truong_ban',
      expected: 'Sidebar lọc chính xác theo ma trận phân quyền, ẩn triệt để mục "Quyền của tôi" và các phân hệ vượt quyền',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 14: Phân quyền vai trò CRM chặt chẽ, tối ưu trải nghiệm quản trị.',
    },
    {
      tcId: 'TC-CRM-002',
      module: 'Quản Trị CRM & Sơ Đồ Khán Phòng',
      subFeature: 'Sơ đồ rạp chiếu CinemaSeatingMap: Kéo thả tọa độ ghế sân khấu & Thêm/Bớt/Căn đều',
      screen: 'Sơ đồ Khán phòng CinemaSeatingMap (/events/seating)',
      precondition: 'Tại màn hình quản lý sơ đồ chỗ ngồi sự kiện',
      steps: '1. Mở sơ đồ Cinema Seating Map\n2. Quan sát khu vực Sân khấu (Stage) hình cánh cung với các ghế VIP/Diễn giả\n3. Dùng chuột/ngón tay bấm giữ một ghế sân khấu và kéo sang vị trí mới\n4. Thả chuột: Ghế cố định tại tọa độ mới mà không làm xô lệch các hàng ghế khán phòng\n5. Bấm nút "+ Thêm ghế" -> Ghế mới xuất hiện trên sân khấu\n6. Bấm nút "- Bớt ghế" -> Loại bỏ ghế dư thừa\n7. Bấm nút "Căn đều" -> Toàn bộ ghế tự động dàn trải đều theo vòng cung sân khấu',
      inputData: 'Pointer drag events, Stage seat operations',
      expected: 'Kéo thả tọa độ ghế sân khấu mượt mà, thêm/bớt ghế linh hoạt, nút căn đều đưa ghế về vị trí phân bổ chuẩn xác',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 14: Tùy biến vị trí ghế sân khấu trực quan linh hoạt trên sơ đồ khán phòng.',
    },
    // ════════════════════════════════════════════════════════════════════════════
    // CÁC NÂNG CẤP UI/UX & TÍNH NĂNG MỚI (ISSUE 128)
    // ════════════════════════════════════════════════════════════════════════════
    {
      tcId: 'TC-PROD-004',
      module: 'Gian Hàng Sản Phẩm',
      subFeature: 'Menu 3 chấm (...) Chỉnh sửa/Xóa & Upload ảnh thật bài đăng chính chủ',
      screen: 'Gian Hàng Sản Phẩm (/association/products)',
      precondition: 'Hội viên đã đăng ít nhất 1 sản phẩm của chính mình',
      steps: '1. Mở /association/products\n2. Chọn tab "Sản phẩm tôi đăng" hoặc tìm sản phẩm của chính mình\n3. Quan sát góc trên bên phải ảnh/thẻ sản phẩm\n4. Bấm vào icon menu 3 chấm (...)\n5. Chọn "Chỉnh sửa" -> Modal mở ra, chọn ảnh từ máy qua input file, kiểm tra preview ảnh qua resolveMediaUrl\n6. Chọn "Xóa" -> Hộp thoại xác nhận hiển thị và xóa sản phẩm thành công',
      inputData: 'Action click menu (...), File upload image/*, Confirm delete',
      expected: 'Menu 3 chấm hiển thị chuẩn ở góc trên phải, chỉ hiển thị cho bài đăng chính chủ; upload file ảnh thật hoạt động mượt mà và preview đúng URL; xóa sản phẩm cập nhật danh sách tức thì',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 128: Menu 3 chấm chuẩn UX, lọc song ngữ matchCategory, upload ảnh từ thiết bị.',
    },
    {
      tcId: 'TC-OPP-003',
      module: 'Cơ Hội Giao Thương B2B',
      subFeature: 'Menu 3 chấm (...) Chỉnh sửa/Xóa bài đăng cơ hội chính chủ',
      screen: 'Cơ Hội Giao Thương (/association/opportunities)',
      precondition: 'Hội viên đã đăng cơ hội giao thương của chính mình',
      steps: '1. Mở /association/opportunities\n2. Tìm đến thẻ cơ hội do chính mình đăng\n3. Quan sát góc trên bên phải thẻ\n4. Bấm nút 3 chấm (...) -> Chọn "Chỉnh sửa" hoặc "Xóa"\n5. Kiểm tra chân thẻ không còn các nút inline thô',
      inputData: 'Action click menu (...), Edit / Delete opportunity',
      expected: 'Menu 3 chấm hiển thị ở góc trên phải, hỗ trợ sửa và xóa cơ hội, chân thẻ gọn gàng không bị vỡ dòng',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 128: Tinh gọn thẻ cơ hội, đưa hành động vào dropdown 3 chấm.',
    },
    {
      tcId: 'TC-EVT-005',
      module: 'Sự Kiện & Check-in QR',
      subFeature: 'Trang chủ hiển thị tối đa 5 sự kiện tỷ lệ ngang & Danh sách sự kiện tinh gọn overlay',
      screen: 'Trang chủ (/association) & Danh sách sự kiện (/association/events)',
      precondition: 'Hệ thống có các sự kiện đang diễn ra hoặc sắp tới',
      steps: '1. Mở Trang chủ /association -> Kiểm tra khối Sự kiện sắp tới hiển thị tối đa 5 sự kiện\n2. Quan sát tỷ lệ ảnh poster ngang aspect-[4/3] sm:aspect-[16/10]\n3. Kiểm tra nút "Xem tất cả" kèm icon ChevronRight (thay cho ••• cũ)\n4. Bấm vào để chuyển sang /association/events\n5. Kiểm tra danh sách sự kiện: Toàn bộ Tiêu đề, Countdown timer và nút "Xem chi tiết" nằm gọn gàng bên trong overlay chân poster, không có text rác bên ngoài',
      inputData: 'Navigation /association -> /association/events',
      expected: 'Trang chủ hiển thị 5 sự kiện ngang chuẩn điện ảnh, nút Xem tất cả trang nhã; trang sự kiện tinh gọn 100% thông tin trong poster overlay',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 128: Chuẩn hóa thẩm mỹ sự kiện C-Level, tỷ lệ ngang điện ảnh.',
    },
    {
      tcId: 'TC-AVT-001',
      module: 'Trang Cá Nhân & Đồng Bộ',
      subFeature: 'Đồng bộ ảnh đại diện thời gian thực giữa Profile và Home qua Event Bus',
      screen: 'Trang Cá Nhân (/association/profile) & Trang Chủ (/association)',
      precondition: 'Hội viên đã đăng nhập và đang ở tab Profile',
      steps: '1. Mở tab Cá nhân /association/profile\n2. Bấm đổi avatar và tải ảnh đại diện mới\n3. Chuyển ngay sang tab Trang chủ /association mà không reload trang\n4. Quan sát Avatar dập viền nổi trên thẻ VIP trang chủ và trên Header',
      inputData: 'Upload avatar mới',
      expected: 'Ảnh đại diện trên Trang chủ và Header lập tức cập nhật ảnh mới đồng bộ 100% nhờ event bus vba_member_avatar_updated mà không cần F5',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 128: Cơ chế reactive event bus vba_member_avatar_updated tức thời.',
    },
    {
      tcId: 'TC-PRF-007',
      module: 'Trang Cá Nhân & Đồng Bộ',
      subFeature: 'Gỡ bỏ icon dấu cộng (+) thừa trên dòng "Quản lý Danh thiếp số"',
      screen: 'Trang Cá Nhân (/association/profile)',
      precondition: 'Đang ở tab Profile',
      steps: '1. Mở /association/profile\n2. Cuộn đến dòng mục "Quản lý Danh thiếp số"\n3. Quan sát góc bên phải của dòng mục',
      inputData: 'Visual inspect item "Quản lý Danh thiếp số"',
      expected: 'Dòng mục chỉ hiển thị mũi tên chevron điều hướng sang trang danh thiếp, ĐÃ GỠ BỎ HOÀN TOÀN nút dấu cộng (+) gây hiểu nhầm tạo thêm thẻ',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 128: Chuẩn hóa UX menu cá nhân theo yêu cầu khách hàng.',
    },
    {
      tcId: 'TC-PRF-008',
      module: 'Danh Bạ & Quyền Riêng Tư',
      subFeature: 'Căn giữa tuyệt đối Modal chi tiết hội viên MemberProfileModal trên Mobile',
      screen: 'Modal MemberProfileModal (/association/members)',
      precondition: 'Mở ứng dụng trên điện thoại di động hoặc Responsive Mode (375px - 414px)',
      steps: '1. Mở danh bạ hội viên /association/members\n2. Bấm vào một hội viên bất kỳ để mở Modal chi tiết\n3. Quan sát vị trí hiển thị của hộp thoại modal trên màn hình điện thoại',
      inputData: 'Mobile viewport, Open member profile modal',
      expected: 'Modal căn chính xác 100% ở giữa màn hình theo cả trục dọc và ngang, không bị lệch sát mép trên hoặc tràn viền đáy',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 128: Cấu trúc lưới fail-safe grid place-items-center w-full h-[100dvh] min-h-[100dvh] my-auto.',
    },
    {
      tcId: 'TC-SCAN-003',
      module: 'Quét Mã QR & Kết Nối Realtime',
      subFeature: 'Quét QR trực tiếp bằng HTML5 in-app scanner, loại bỏ Google Play Code Scanner native',
      screen: 'Modal Quét QR (/association/card & AssociationQrScanModal)',
      precondition: 'Thiết bị có camera (Android/iOS hoặc Web browser)',
      steps: '1. Bấm mở modal Quét QR (hoặc tab Quét QR trong Thẻ hội viên)\n2. Cho phép quyền truy cập camera\n3. Quan sát khung ngắm camera WebRTC in-app hiển thị ngay lập tức\n4. Đưa mã QR vào khung ngắm để quét',
      inputData: 'Camera stream, QR code scan',
      expected: 'Camera in-app bật tức thì mượt mà, nhận diện mã QR thành công, hoàn toàn không gọi AndroidNative.scanQr, không bị đơ/văng trên thiết bị thiếu Google Play Services',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 128: Gỡ bỏ hoàn toàn phụ thuộc Google Play Code Scanner, dùng 100% camera HTML5.',
    },
    {
      tcId: 'TC-MSG-010',
      module: 'Gắn Kết & Tin Nhắn',
      subFeature: 'Xóa cuộc trò chuyện bền vững qua blacklist client-side & Xóa tin nhắn phía tôi trong localMessages',
      screen: 'Màn hình Tin nhắn (/association/messages)',
      precondition: 'Có các cuộc trò chuyện và tin nhắn trong hộp thư',
      steps: '1. Mở /association/messages\n2. Vuốt sang trái hoặc nhấn giữ vào một cuộc trò chuyện -> Chọn "Xóa cuộc trò chuyện"\n3. Xác nhận xóa -> Cuộc trò chuyện biến mất\n4. F5 hoặc tải lại trang -> Kiểm tra cuộc trò chuyện KHÔNG bị xuất hiện trở lại\n5. Mở một thread chat, nhấn giữ tin nhắn -> Chọn "Xóa ở phía tôi"\n6. Tin nhắn biến mất ngay lập tức và không còn trong localMessages',
      inputData: 'Action delete conversation & delete message for me',
      expected: 'Cuộc trò chuyện bị xóa được lưu vào blacklist vba_deleted_convs và bị lọc vĩnh viễn; xóa tin nhắn phía tôi cập nhật triệt để cả UI và localStorage',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 128: Khắc phục lỗi hồi sinh cuộc trò chuyện sau khi tải lại trang.',
    },
    {
      tcId: 'TC-CARD-004',
      module: 'Thẻ Hội Viên Thông Minh',
      subFeature: 'Chuẩn hóa màu sắc Modal chụp danh thiếp Trắng & Xanh Navy #003B95 viền vàng & Toast thông báo',
      screen: 'Modal Chụp Danh Thiếp (AssociationCardCaptureModal) & Toast UI (sonner.tsx)',
      precondition: 'Tại màn hình quản lý danh thiếp số /association/business-cards',
      steps: '1. Bấm nút "Chụp quét danh thiếp"\n2. Quan sát màu sắc nền và viền của Modal\n3. Thực hiện một hành động thành công bất kỳ (Lưu thẻ, copy mã, v.v.) để kích hoạt Toast thông báo',
      inputData: 'Open Card Capture Modal, Trigger Toast',
      expected: 'Modal chuyển sang phong cách Trắng & Xanh Navy (#003B95) viền vàng kim Amber Gold sang trọng (loại bỏ màu tối #0C1322); Toast hiển thị chuẩn màu Navy & Gold',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 128: Chuẩn hóa nhận diện màu sắc C-Level CEO 1983.',
    },
    {
      tcId: 'TC-CRM-003',
      module: 'Quản Trị CRM & Sơ Đồ Khán Phòng',
      subFeature: 'Phân quyền Sidebar CRM ẩn các nhóm menu không có quyền (network, businessConnect, system)',
      screen: 'Sidebar Web CRM (/dashboard, /members, v.v.)',
      precondition: 'Đăng nhập với các tài khoản vai trò Trưởng ban hoặc nhân viên',
      steps: '1. Đăng nhập tài khoản không có quyền Platform Admin / IT System\n2. Quan sát dải menu Sidebar bên trái\n3. Kiểm tra các nhóm menu: Mạng lưới (network), Business Connect và Hệ thống (system)',
      inputData: 'Role-based access check on Sidebar',
      expected: 'Các nhóm menu và mục con vượt quyền bị ẩn hoàn toàn, chỉ hiển thị đúng các phân hệ được phân quyền',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 128: Tăng cường bảo mật phân quyền đa cấp trên Web CRM.',
    },
    {
      tcId: 'TC-CRM-004',
      module: 'Quản Trị CRM & Sơ Đồ Khán Phòng',
      subFeature: 'Tạo cơ hội giao thương CRM hỗ trợ upload ảnh từ máy & Đồng bộ trường ảnh',
      screen: 'Quản lý Cơ hội CRM (/opportunities)',
      precondition: 'Đang ở trang Quản lý Cơ hội CRM',
      steps: '1. Mở /opportunities -> Bấm nút "Tạo cơ hội mới"\n2. Trong modal tạo cơ hội, quan sát mục Tải ảnh\n3. Chọn một file ảnh từ máy tính -> Xem trước ảnh hiển thị rõ nét\n4. Điền đầy đủ thông tin và bấm Lưu cơ hội',
      inputData: 'File upload image, New opportunity form data',
      expected: 'Hệ thống hỗ trợ upload file ảnh thật, hiển thị preview ngay trong modal, lưu trữ và đồng bộ trường image/imageUrl lên hệ thống',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 128: Đồng bộ tính năng tải ảnh cơ hội giữa Web CRM và Mobile App.',
    },
    {
      tcId: 'TC-CRM-005',
      module: 'Hội Phí & VietQR',
      subFeature: 'Gửi nhắc phí hội viên CRM (kết nối handleRemind trên Card và Row)',
      screen: 'Quản lý Hội Phí CRM (/fees)',
      precondition: 'Có các hóa đơn hội phí chưa thanh toán (unpaid/pending)',
      steps: '1. Mở /fees\n2. Chuyển sang dạng thẻ (Card view) hoặc dạng bảng (Table row view)\n3. Tìm hóa đơn chưa thanh toán -> Bấm nút "Nhắc phí"\n4. Quan sát phản hồi của hệ thống',
      inputData: 'Click "Nhắc phí" button on Card / Row',
      expected: 'Hệ thống kích hoạt hàm handleRemind, hiển thị toast thông báo gửi lời nhắc thành công đến hội viên kèm tên và mã hội viên chính xác',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 128: Gắn kết nối sự kiện nhắc phí đồng bộ cả giao diện thẻ và bảng.',
    },
    {
      tcId: 'TC-CRM-006',
      module: 'Hội Phí & VietQR',
      subFeature: 'Khắc phục cột tài khoản bị để trống trong danh sách hội phí CRM',
      screen: 'Quản lý Hội Phí CRM (/fees)',
      precondition: 'Có danh sách hóa đơn hội phí từ backend',
      steps: '1. Mở /fees\n2. Quan sát cột "Hội viên / Tài khoản" trong bảng danh sách\n3. Kiểm tra các dòng hóa đơn',
      inputData: 'Table render on /fees',
      expected: 'Cột tài khoản hiển thị đầy đủ thông tin (Mã hội viên, Họ tên, SĐT), KHÔNG BỊ TRỐNG RỖNG nhờ logic fallback kép trong admin.service.ts',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 128: Fallback logic an toàn cho invoice member accounts và joins.',
    },
    {
      tcId: 'TC-CRM-007',
      module: 'Quản Trị CRM & Sơ Đồ Khán Phòng',
      subFeature: 'Lưu trữ trạng thái đóng phí Doanh nghiệp CRM vào Database & Toggle nhanh',
      screen: 'Quản lý Doanh Nghiệp CRM (/companies)',
      precondition: 'Đang ở trang Quản lý Doanh nghiệp CRM',
      steps: '1. Mở /companies\n2. Quan sát cột "Hội phí" trong bảng và badge trạng thái trên thẻ doanh nghiệp\n3. Sử dụng bộ lọc "Hội phí" (Tất cả, Đã đóng phí, Chưa đóng phí)\n4. Bấm nút gạt / toggle trạng thái đóng phí trên một doanh nghiệp\n5. Tải lại trang để kiểm tra',
      inputData: 'Toggle fee status, Filter by feePaid',
      expected: 'Trạng thái đóng phí feePaid và feeYear được lưu trực tiếp vào cơ sở dữ liệu PostgreSQL qua SQL UPDATE; toggle hoạt động mượt mà và bảo lưu sau khi F5',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 128: Quản lý hội phí doanh nghiệp đồng bộ 100% database.',
    },
    {
      tcId: 'TC-CRM-008',
      module: 'Quản Trị CRM & Sơ Đồ Khán Phòng',
      subFeature: 'Sơ đồ rạp chiếu CinemaSeatingMap mở rộng canvas h-[640px], clamp kéo ghế & Thêm hàng ghế dưới',
      screen: 'Sơ đồ Chỗ Ngồi CRM (/events/seating)',
      precondition: 'Mở sơ đồ CinemaSeatingMap dạng Tiệc (Banquet) và Rạp chiếu (Cinema)',
      steps: '1. Mở /events/seating\n2. Chuyển sang chế độ Sơ đồ Tiệc (Banquet tables) -> Kiểm tra canvas mở rộng chiều cao h-[640px]\n3. Thử kéo bàn tiệc/ghế xuống sát đáy canvas -> Tọa độ được clamp an toàn tại tối đa 95%, không bị rơi mất\n4. Chuyển sang chế độ Sơ đồ Khán phòng (Cinema rows) -> Kiểm tra khoảng đệm đáy pb-16 min-h-[300px]\n5. Bấm nút "+ Thêm hàng ghế bên dưới" -> Hàng ghế mới được thêm vào đáy sơ đồ',
      inputData: 'Drag banquet tables, Click "+ Thêm hàng ghế bên dưới"',
      expected: 'Canvas rộng rãi h-[640px], kéo thả không bao giờ bị văng khỏi vùng nhìn thấy, thêm hàng ghế bên dưới hoạt động trực quan chính xác',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tính năng Issue 128: Tối ưu trải nghiệm kéo thả sơ đồ rạp chiếu và bàn tiệc sự kiện.',
    },
    // NÂNG CẤP 7 TÍNH NĂNG MỚI (HTTPS, SỰ KIỆN BANNER, BIỂU QUYẾT, LUCKY DRAW, SÀN TMĐT, CƠ HỘI & PWA)
    {
      tcId: 'TC-REQ-001',
      module: 'Hạ Tầng & DevOps HTTPS',
      subFeature: 'Cấu hình SSL Nginx Reverse Proxy & Fast Deploy HTTPS (Ports 5443/5444)',
      screen: 'Server Dev (14.225.217.232)',
      precondition: 'Nginx SSL Docker Compose và chứng chỉ SAN đã triển khai',
      steps: '1. Chạy deploy/ssl/deploy-ssl.ps1 hoặc fast-deploy.ps1 -EnableHttps\n2. Mở trình duyệt truy cập https://14.225.217.232:5443 (Web CRM)\n3. Mở trình duyệt truy cập https://14.225.217.232:5444/association (App Hiệp hội)\n4. Kiểm tra giao thức bảo mật HTTPS và phản hồi API',
      inputData: 'HTTPS Port 5443 / 5444, SSL SAN Cert',
      expected: 'Cả Web CRM và App Hiệp hội tải mượt mà qua HTTPS, chứng chỉ SAN bao quát IP và sslip.io, API NestJS kết nối ổn định',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Hỗ trợ cả HTTP và HTTPS thông qua Nginx Reverse Proxy an toàn.',
    },
    {
      tcId: 'TC-REQ-002',
      module: 'Quản Trị Sự Kiện CRM',
      subFeature: 'Tạo Sự Kiện CRM & Tự Động Điền Bố Cục Text & Banner Riêng Theo Loại Sự Kiện',
      screen: 'Tạo Sự Kiện CRM (/events/new, EventWizard)',
      precondition: 'Đăng nhập CRM bằng quyền Quản trị viên',
      steps: '1. Mở /events/new -> Bước 1 "Thông tin cơ bản"\n2. Bấm chọn loại sự kiện "Diễn đàn" (Forum) -> Quan sát Tiêu đề, Tagline, Banner preview, Sức chứa tự động điền mẫu chuyên nghiệp\n3. Đổi sang loại "Workshop" -> Quan sát nội dung và banner đổi sang mẫu Workshop chuyên sâu\n4. Đổi sang loại "Kết nối" (Networking) -> Quan sát nội dung đổi sang Dạ tiệc Doanh nhân\n5. Đổi sang loại "Đào tạo" (Training) -> Quan sát nội dung đổi sang Masterclass Doanh trí\n6. Quan sát khung "Xem trước Banner & Bố cục Sự kiện"',
      inputData: 'Chọn eventType trong EventWizard',
      expected: 'Tự động điền text nội dung, tagline, sức chứa, địa điểm và hiển thị banner preview riêng biệt khớp 100% từng loại sự kiện',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tối ưu trải nghiệm tạo sự kiện cho Admin CRM với bố cục banner động.',
    },
    {
      tcId: 'TC-REQ-003',
      module: 'Biểu Quyết & Bầu Cử Đại Hội',
      subFeature: 'Tạo Biểu Quyết CRM tự động đẩy thông báo thời gian thực về App Hiệp Hội',
      screen: 'Biểu Quyết CRM (/voting) & Thông Báo App (/association/notifications)',
      precondition: 'Admin tạo phiên biểu quyết mới trên CRM',
      steps: '1. Trên Web CRM /voting, bấm "Tạo biểu quyết mới"\n2. Nhập tiêu đề, các phương án lựa chọn và lưu phiên\n3. Mở App Hiệp hội với tài khoản hội viên\n4. Quan sát chuông thông báo và danh sách thông báo\n5. Bấm vào thông báo biểu quyết có nút "Tham gia biểu quyết ngay"',
      inputData: 'Tạo phiên voting trên CRM',
      expected: 'Thông báo đẩy tức thì về App Hiệp hội, hiển thị thẻ biểu quyết tương tác, bấm vào mở ngay modal bầu chọn trực tiếp',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Liên kết luồng realtime giữa Web CRM và App Hiệp hội.',
    },
    {
      tcId: 'TC-REQ-004',
      module: 'Sự Kiện & Quay Số May Mắn',
      subFeature: 'Đăng ký vé sinh Số May Mắn ngẫu nhiên (#XXXX) & Quay thưởng Lucky Draw gửi thông báo chúc mừng',
      screen: 'Đăng ký sự kiện App (/association/events) & Quay thưởng CRM (/voting)',
      precondition: 'Có sự kiện mở đăng ký vé',
      steps: '1. Hội viên mở sự kiện trên App Hiệp hội -> Bấm "Đăng ký vé tham gia"\n2. Quan sát hộp thoại xác nhận: Hiển thị "Số may mắn của bạn: #XXXX"\n3. Mở tab Vé của tôi / Lịch sử check-in: Thẻ vé lưu trữ số may mắn định danh\n4. Trên CRM /voting -> Mở module "Quay số may mắn (Lucky Draw)"\n5. Chọn sự kiện và bấm "Bắt đầu quay số"\n6. Hệ thống quay ngẫu nhiên các số may mắn từ danh sách vé đã đăng ký và chọn người trúng\n7. Admin bấm "Gửi thông báo trúng" -> App của người trúng nhận thông báo Chúc mừng thẻ vàng',
      inputData: 'Event registration, Lucky draw spin, Win notification',
      expected: 'Mỗi vé tự động sinh số ngẫu nhiên 4 chữ số; CRM quay số chính xác theo danh sách vé thực tế; người trúng nhận thông báo vinh danh tức thời',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Đã backfill số may mắn cho toàn bộ đăng ký cũ, hỗ trợ trọn vẹn chương trình gala sự kiện.',
    },
    {
      tcId: 'TC-REQ-005',
      module: 'Sàn Thương Mại & Gian Hàng',
      subFeature: 'Sàn thương mại điện tử Luxury: Header tìm kiếm, menu danh mục, bộ lọc, đăng SP & 3 Section phân trang',
      screen: 'Màn hình Sản phẩm (/association/products)',
      precondition: 'Đã đăng nhập App Hiệp hội',
      steps: '1. Mở /association/products\n2. Quan sát Header: Icon Menu danh mục (LayoutGrid) bên trái, Thanh tìm kiếm ở giữa, Icon Bộ lọc và nút "Đăng SP" bên phải\n3. Bấm Icon Menu danh mục -> Menu trượt sổ xuống chọn nhanh ngành hàng\n4. Cuộn xuống quan sát 3 Section: 1) "Sản phẩm mới đăng", 2) "Sản phẩm được xem nhiều nhất", 3) "Doanh nghiệp nổi bật nhất"\n5. Thử bấm phân trang "Trang trước / Trang sau" ở từng Section\n6. Bấm "Xem gian hàng" ở Section 3 -> Mở Showroom giới thiệu doanh nghiệp và các sản phẩm niêm yết',
      inputData: 'Category menu click, Search keyword, Pagination next/prev, View storefront',
      expected: 'Bố cục chuẩn sàn thương mại điện tử sang trọng; 3 section phân trang độc lập mượt mà; 1 hội viên đại diện cho 1 công ty có gian hàng riêng biệt',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Nâng cấp toàn diện thẩm mỹ và trải nghiệm thương mại B2B nội khối.',
    },
    {
      tcId: 'TC-REQ-006',
      module: 'Sàn Cơ Hội Giao Thương B2B',
      subFeature: 'Bảng Tin Trao Cơ Hội: Phân Trang, Tăng Lượt Xem Realtime & Xem Danh Sách Người Quan Tâm Kèm Call/Email/Chat',
      screen: 'Màn hình Trao Cơ Hội (/association/opportunities)',
      precondition: 'Có các bài đăng cơ hội giao thương trên hệ thống',
      steps: '1. Mở /association/opportunities -> Quan sát giao diện dạng bảng tin chuyên nghiệp\n2. Bấm chuyển trang phân trang ở chân danh sách (5 bài / trang)\n3. Người dùng B bấm vào xem chi tiết bài đăng của Người dùng A -> Lượt xem tăng lên 1 (POST /opportunities/:id/view)\n4. Người dùng B bấm "Quan tâm"\n5. Người dùng A (chủ bài đăng) mở bài viết của mình -> Thấy khu vực "Hội viên đã quan tâm (X)"\n6. Người dùng A bấm nút Gọi điện (tel), Gửi email (mailto) hoặc Nhắn tin (chuyển sang /messages)',
      inputData: 'Click view detail, Click interest, Owner views interested members list',
      expected: 'Bảng tin phân trang chuẩn mực; đếm lượt xem chuẩn xác khi xem chi tiết; chủ bài đăng nắm bắt đầy đủ thông tin đối tác quan tâm và liên hệ tức thời',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Tối đa hóa hiệu quả kết nối và xúc tiến hợp đồng giữa các hội viên.',
    },
    {
      tcId: 'TC-REQ-007',
      module: 'Ứng Dụng PWA & Mobile iOS',
      subFeature: 'Cài đặt PWA trên iPhone/iPad qua Safari Add to Home Screen & Chạy toàn màn hình Offline',
      screen: 'Trình duyệt Safari trên iOS & Trình duyệt Chrome trên Android',
      precondition: 'Mở đường dẫn /association trên thiết bị di động iOS Safari',
      steps: '1. Mở Safari trên iPhone truy cập /association\n2. Quan sát thanh thông báo hướng dẫn cài đặt iOS (IosInstallPrompt) xuất hiện trang nhã ở đáy màn hình\n3. Làm theo hướng dẫn: Bấm nút Share (Chia sẻ) ở thanh điều hướng Safari\n4. Cuộn xuống chọn "Thêm vào MH chính" (Add to Home Screen)\n5. Nhấn "Thêm"\n6. Quay về màn hình chính iPhone -> Biểu tượng App CEO 1983 xuất hiện sắc nét\n7. Nhấn mở app từ màn hình chính -> Ứng dụng chạy toàn màn hình standalone, không có thanh URL Safari',
      inputData: 'iOS Safari, Add to Home Screen, Standalone PWA launch',
      expected: 'Cài đặt thành công PWA trên iOS, icon chuẩn retina, mở app toàn màn hình mượt mà như ứng dụng Native, hỗ trợ bộ nhớ đệm qua Service Worker',
      status: '[ ] Chờ kiểm tra',
      result: '[ ]',
      pct: 100,
      note: 'Đáp ứng trọn vẹn nhu cầu gửi link cho người dùng iOS trải nghiệm ứng dụng hiệp hội.',
    },
  ];

  // ════════════════════════════════════════════════════════════════════════════
  // SHEET 1: DASHBOARD TỔNG QUAN TEST CASES
  // ════════════════════════════════════════════════════════════════════════════
  const wsDash = wb.addWorksheet('Tổng Quan Test Cases', { views: [{ showGridLines: true }] });
  wsDash.columns = [
    { width: 4 },
    { width: 34 },
    { width: 20 },
    { width: 22 },
    { width: 24 },
    { width: 22 },
    { width: 28 },
  ];

  // Title Banner
  wsDash.mergeCells('B2:G2');
  const dashTitle = wsDash.getCell('B2');
  dashTitle.value = 'BÁO CÁO TỔNG QUAN BỘ TEST CASE CHI TIẾT ỨNG DỤNG HIỆP HỘI CEO 1983';
  dashTitle.font = { name: 'Times New Roman', size: 15, bold: true, color: { argb: 'FFFFFF' } };
  dashTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  dashTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  wsDash.getRow(2).height = 40;

  // Subtitle
  wsDash.mergeCells('B3:G3');
  const dashSub = wsDash.getCell('B3');
  dashSub.value = 'Hệ thống kiểm thử tiêu chuẩn chất lượng VIONE · Toàn bộ ca kiểm thử để trống [ ] chờ nghiệm thu thủ công';
  dashSub.font = { name: 'Times New Roman', size: 11, italic: true, color: { argb: '475569' } };
  dashSub.alignment = { vertical: 'middle', horizontal: 'center' };
  wsDash.getRow(3).height = 24;

  const totalTCs = testCases.length;

  const dashKpis = [
    { label: 'TỔNG SỐ TEST CASES', val: `${totalTCs} Ca kiểm thử`, color: '0084FF' },
    { label: 'CHỜ KIỂM TRA THỦ CÔNG', val: `${totalTCs} Ca [ ] (100%)`, color: 'D97706' },
    { label: 'ĐÃ NGHIỆM THU (PASSED)', val: '[ ] (Chờ đánh dấu)', color: '10B981' },
    { label: 'TIẾN ĐỘ MÃ NGUỒN', val: '100% Sẵn sàng test', color: '0284C7' },
  ];

  dashKpis.forEach((kpi, idx) => {
    const colStart = String.fromCharCode(66 + idx);
    const cTop = wsDash.getCell(`${colStart}5`);
    const cBot = wsDash.getCell(`${colStart}6`);

    cTop.value = kpi.label;
    cTop.font = { name: 'Times New Roman', size: 9.5, bold: true, color: { argb: '64748B' } };
    cTop.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
    cTop.alignment = { vertical: 'middle', horizontal: 'center' };
    cTop.border = BORDER;

    cBot.value = kpi.val;
    cBot.font = { name: 'Times New Roman', size: 12.5, bold: true, color: { argb: kpi.color } };
    cBot.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    cBot.alignment = { vertical: 'middle', horizontal: 'center' };
    cBot.border = BORDER;
  });
  wsDash.getRow(5).height = 24;
  wsDash.getRow(6).height = 34;

  // Breakdown by Module
  wsDash.getCell('B8').value = 'BẢNG PHÂN BỔ TEST CASE THEO TỪNG PHÂN HỆ CHỨC NĂNG';
  wsDash.getCell('B8').font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: NAVY } };

  const dashHeaders = ['Mã Phân Hệ', 'Tên Phân Hệ Chức Năng', 'Số Test Case', 'Chờ Kiểm Tra [ ]', 'Nghiệm Thu [ ]', 'Trạng Thái Mã Nguồn'];
  const r9 = wsDash.getRow(9);
  r9.height = 28;
  dashHeaders.forEach((h, idx) => {
    const cell = r9.getCell(idx + 2);
    cell.value = h;
    cell.font = { name: 'Times New Roman', size: 10.5, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    cell.alignment = { vertical: 'middle', horizontal: idx === 1 ? 'left' : 'center' };
    cell.border = BORDER;
  });

  const moduleGroups = {};
  testCases.forEach((tc) => {
    if (!moduleGroups[tc.module]) moduleGroups[tc.module] = [];
    moduleGroups[tc.module].push(tc);
  });

  let dRow = 10;
  Object.keys(moduleGroups).forEach((modName, idx) => {
    const row = wsDash.getRow(dRow);
    row.height = 24;

    const list = moduleGroups[modName];
    const totalM = list.length;

    row.getCell(2).value = `MOD-${String(idx + 1).padStart(2, '0')}`;
    row.getCell(3).value = modName;
    row.getCell(4).value = totalM;
    row.getCell(5).value = `${totalM} [ ]`;
    row.getCell(6).value = '[ ]';
    row.getCell(7).value = '100% Sẵn sàng';

    [2, 3, 4, 5, 6, 7].forEach((cIdx) => {
      const c = row.getCell(cIdx);
      c.font = { name: 'Times New Roman', size: 10, bold: cIdx === 2 || cIdx === 7 };
      c.alignment = { vertical: 'middle', horizontal: cIdx === 3 ? 'left' : 'center' };
      c.border = BORDER;
      if (cIdx === 5) {
        c.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'D97706' } };
      }
      if (cIdx === 7) {
        c.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: '0284C7' } };
      }
    });

    dRow++;
  });

  // Manual Testing Note in Dashboard
  dRow += 2;
  wsDash.mergeCells(`B${dRow}:G${dRow}`);
  const wCell = wsDash.getCell(`B${dRow}`);
  wCell.value = '📋 NGUYÊN TẮC KIỂM THỬ: TOÀN BỘ Ô KIỂM [ ] ĐỂ TRỐNG ĐỂ NGHIỆM THU THỰC TẾ';
  wCell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'B45309' } };
  wCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
  wCell.alignment = { vertical: 'middle', horizontal: 'left' };
  wCell.border = BORDER;
  wsDash.getRow(dRow).height = 26;

  dRow++;
  const ruleNotes = [
    '• TUYỆT ĐỐI KHÔNG TỰ ĐỘNG ĐÁNH DẤU "PASS": Toàn bộ ca kiểm thử đều để trống checkbox [ ] để Người dùng / Tester tự tay đối soát và tick chọn.',
    '• Toàn bộ 14 tính năng và bản sửa lỗi mới nhất (Landing Polling 4s, Đăng nhập bắt buộc, Đồng bộ Profile, Camera in-modal, Sàn Cơ hội & Sản phẩm 2 cột, Poster 2:3, Chat mobile (+) expander, Phân quyền CRM, Sơ đồ khán phòng kéo thả) đều đã hoàn tất mã nguồn 100%.',
    '• Đối với các ca cần thiết bị ngoại vi thật (NFC, Cuộc gọi P2P WebRTC giữa 2 máy, Webhook ngân hàng thật), mã nguồn đã hoàn thiện và sẵn sàng cho môi trường live/sandbox.',
  ];

  ruleNotes.forEach((txt) => {
    wsDash.mergeCells(`B${dRow}:G${dRow}`);
    const noteC = wsDash.getCell(`B${dRow}`);
    noteC.value = txt;
    noteC.font = { name: 'Times New Roman', size: 10, color: { argb: '78350F' } };
    noteC.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEB' } };
    noteC.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    noteC.border = BORDER;
    wsDash.getRow(dRow).height = 28;
    dRow++;
  });

  // ════════════════════════════════════════════════════════════════════════════
  // SHEET 2: CHI TIẾT BỘ TEST CASES
  // ════════════════════════════════════════════════════════════════════════════
  const wsList = wb.addWorksheet('Chi Tiết Test Cases', { views: [{ showGridLines: true }] });
  wsList.columns = [
    { width: 4 },
    { width: 14 }, // Mã TC
    { width: 22 }, // Phân hệ
    { width: 30 }, // Chức năng / Kịch bản
    { width: 24 }, // Màn hình
    { width: 26 }, // Tiền điều kiện
    { width: 36 }, // Các bước
    { width: 24 }, // Dữ liệu vào
    { width: 36 }, // Kết quả mong đợi
    { width: 18 }, // Trạng thái kiểm thử
    { width: 14 }, // Nghiệm thu
    { width: 38 }, // Ghi chú kỹ thuật
  ];

  wsList.mergeCells('B2:L2');
  const listTitle = wsList.getCell('B2');
  listTitle.value = 'BẢNG ĐẶC TẢ CHI TIẾT BỘ TEST CASES ỨNG DỤNG DOANH NHÂN CLB CEO 1983';
  listTitle.font = { name: 'Times New Roman', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  listTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  listTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  wsList.getRow(2).height = 36;

  const tcHeaders = [
    'Mã TC',
    'Phân Hệ',
    'Chức Năng / Kịch Bản Kiểm Thử',
    'Màn Hình Giao Diện',
    'Tiền Điều Kiện',
    'Các Bước Thực Hiện',
    'Dữ Liệu Đầu Vào',
    'Kết Quả Mong Đợi',
    'Trạng Thái Kiểm Thử',
    'Nghiệm Thu',
    'Ghi Chú Kỹ Thuật & Hướng Dẫn Test',
  ];

  const r4 = wsList.getRow(4);
  r4.height = 28;
  tcHeaders.forEach((h, idx) => {
    const c = r4.getCell(idx + 2);
    c.value = h;
    c.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
    c.alignment = { vertical: 'middle', horizontal: idx === 0 || idx === 8 || idx === 9 ? 'center' : 'left' };
    c.border = BORDER;
  });

  let tRow = 5;
  testCases.forEach((tc) => {
    const row = wsList.getRow(tRow);
    row.height = 42;

    row.getCell(2).value = tc.tcId;
    row.getCell(3).value = tc.module;
    row.getCell(4).value = tc.subFeature;
    row.getCell(5).value = tc.screen;
    row.getCell(6).value = tc.precondition;
    row.getCell(7).value = tc.steps;
    row.getCell(8).value = tc.inputData;
    row.getCell(9).value = tc.expected;
    row.getCell(10).value = tc.status;
    row.getCell(11).value = tc.result;
    row.getCell(12).value = tc.note;

    [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach((cIdx) => {
      const cell = row.getCell(cIdx);
      cell.font = { name: 'Times New Roman', size: 9.5 };
      cell.border = BORDER;

      if (cIdx === 2 || cIdx === 10 || cIdx === 11) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }

      if (cIdx === 10) {
        cell.font = { name: 'Times New Roman', size: 9.5, bold: true, color: { argb: 'D97706' } };
      }
      if (cIdx === 11) {
        cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: '475569' } };
      }
    });

    tRow++;
  });

  const outXlsx = path.join(docsDir, 'TEST_CASES_APP_HIEP_HOI_CHI_TIET.xlsx');
  await wb.xlsx.writeFile(outXlsx);
  console.log(`✓ Generated Excel Test Cases file -> ${outXlsx}`);

  // ════════════════════════════════════════════════════════════════════════════
  // GENERATE MARKDOWN VERSION (.md) - ALL EMPTY CHECKBOXES [ ], NO "PASS"
  // ════════════════════════════════════════════════════════════════════════════
  let md = `# BỘ TEST CASES CHI TIẾT ỨNG DỤNG DOANH NHÂN CLB CEO 1983
**Dự án:** VIONE Ecosystem · **Phân hệ:** CEO 1983 Association Mobile App & Web CRM  
**Quy chuẩn kiểm thử:** Black-box & E2E Functional Testing · **Cập nhật:** Tháng 09/2026

---

## 1. TỔNG QUAN KIỂM THỬ
- **Tổng số ca kiểm thử:** ${totalTCs} Test Cases
- **Ca kiểm thử chờ kiểm tra thủ công (Pending Manual Verification):** ${totalTCs} / ${totalTCs} [ ] (100%)
- **Ca kiểm thử đã nghiệm thu (Passed):** [ ] (Để trống cho Tester / Ban Nghiệm Thu đánh dấu thủ công)
- **Tiến độ hoàn thiện mã nguồn:** 100% (Toàn bộ 14 tính năng và bản sửa lỗi đã code hoàn tất và sẵn sàng kiểm thử)

> [!IMPORTANT]
> ### QUY CHUẨN KIỂM THỬ & NGHIỆM THU NGHIÊM NGẶT:
> 1. **TUYỆT ĐỐI KHÔNG TỰ ĐỘNG ĐÁNH DẤU "PASS":** Toàn bộ các ca kiểm thử trong tài liệu này đều để trống ô kiểm \`[ ]\` để Người dùng, QA và Ban Nghiệm Thu CLB tự tay thao tác kiểm thử trên thiết bị thật và đánh dấu đạt/không đạt.
> 2. **Kiểm thử trên thiết bị ngoại vi:** Đối với các tính năng cần phần cứng vật lý (Chạm thẻ NFC, Cuộc gọi WebRTC P2P giữa 2 máy thật, Webhook tài khoản ngân hàng thật), hệ thống đã hoàn thiện mã nguồn và sẵn sàng cho đợt kiểm thử sandbox/live.
> 3. **Toàn diện 14 tính năng nâng cấp mới:**
>    - Landing Auto-Reload & 4s Polling phê duyệt (\`TC-LAND-002\`)
>    - Bắt buộc đăng nhập với prefilled username, không bypass login (\`TC-AUTH-006\`)
>    - Đồng bộ Profile thực tế, loại bỏ mock cứng "Lê Hoàng Long" (\`TC-PRF-005\`)
>    - Khung ngắm Camera in-modal & Handshake kết nối 2 chiều (\`TC-QR-003\`, \`TC-CONN-002\`)
>    - Sàn Cơ hội B2B ảnh tải lên, tab cá nhân, sort mới nhất & ngày đăng (\`TC-OPP-002\`)
>    - Gian hàng sản phẩm 2 cột e-commerce, cách ly bookmark theo user, tab sản phẩm tôi đăng (\`TC-PROD-002\`, \`TC-PROD-003\`)
>    - Thẻ sự kiện Poster 2:3 với nhãn độ tuổi (16+, 18+, 13+) & Backdrop sân khấu (\`TC-EVT-004\`)
>    - Thứ tự khối Trang chủ: Sự kiện -> Cơ hội -> Sản phẩm (\`TC-HOME-002\`)
>    - Phân tách thông báo theo user, không spam sự kiện cũ, lời chào chính thức (\`TC-NOTIF-002\`)
>    - Chat realtime khử trùng lặp (deduplication), mobile (+) expander, popup call tương tác (\`TC-MSG-008\`, \`TC-MSG-009\`)
>    - Đồng bộ menu cá nhân chuẩn Image 3 & phím tắt (+) tạo nhanh Danh thiếp số (\`TC-PRF-006\`)
>    - Tab kép Tin tức CLB & Sự kiện Hiệp Hội (\`TC-NEWS-002\`)
>    - Đổi mật khẩu (/users/change-password), khóa nút Đăng xuất, vô hiệu hóa tài khoản (\`TC-SEC-002\`, \`TC-SEC-003\`)
>    - Phân quyền Sidebar CRM theo vai trò, ẩn "Quyền của tôi" & Sơ đồ rạp chiếu kéo thả ghế sân khấu (\`TC-CRM-001\`, \`TC-CRM-002\`)

---

## 2. BẢNG PHÂN BỔ TEST CASES THEO PHÂN HỆ

| Mã | Phân Hệ Chức Năng | Số Test Case | Chờ Kiểm Tra | Nghiệm Thu | Tiến Độ Mã Nguồn |
|---|---|:---:|:---:|:---:|:---:|
`;

  Object.keys(moduleGroups).forEach((modName, idx) => {
    const list = moduleGroups[modName];
    const totalM = list.length;
    md += `| **MOD-${String(idx + 1).padStart(2, '0')}** | ${modName} | ${totalM} | ${totalM} [ ] | [ ] | **100% Sẵn sàng** |\n`;
  });

  md += `\n---\n\n## 3. BẢNG ĐẶC TẢ CHI TIẾT TỪNG CA KIỂM THỬ (TEST CASES)\n\n`;

  testCases.forEach((tc) => {
    md += `### ${tc.tcId}: ${tc.subFeature}\n`;
    md += `- **Phân hệ:** ${tc.module} | **Màn hình/Popup:** \`${tc.screen}\`\n`;
    md += `- **Tiền điều kiện:** ${tc.precondition}\n`;
    md += `- **Các bước thực hiện:**\n${tc.steps.split('\n').map((s) => `  ${s}`).join('\n')}\n`;
    md += `- **Dữ liệu đầu vào:** \`${tc.inputData}\`\n`;
    md += `- **Kết quả mong đợi:** ${tc.expected}\n`;
    md += `- **Trạng thái kiểm thử:** ${tc.status}\n`;
    md += `- **Kết quả nghiệm thu:** [ ] Đạt (Passed) / [ ] Cần chỉnh sửa (Failed) (Chờ đánh dấu thủ công)\n`;
    md += `- **Ghi chú kỹ thuật & Hướng dẫn test:** ${tc.note}\n\n`;
  });

  const outMd = path.join(docsDir, 'TEST_CASES_APP_HIEP_HOI_CHI_TIET.md');
  fs.writeFileSync(outMd, md, 'utf8');
  console.log(`✓ Generated Markdown Test Cases file -> ${outMd}`);
  console.log('=== TEST CASES GENERATION COMPLETE! ===\n');
}

main().catch((err) => {
  console.error('Error generating test cases:', err);
  process.exit(1);
});
