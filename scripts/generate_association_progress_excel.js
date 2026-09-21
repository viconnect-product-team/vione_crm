const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('=== [2/3] GENERATING ASSOCIATION PROGRESS FILE (XLSX & MD) ===');

  const docsDir = path.join(__dirname, '..', 'document');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Ban Thư Ký CLB Doanh Nhân CEO 1983';
  wb.lastModifiedBy = 'Phạm Văn Vũ';
  wb.created = new Date();
  wb.modified = new Date();

  const NAVY = '0A1A3A';
  const BLUE_HEADER = '0084FF';
  const GOLD = 'D97706';
  const BORDER_COLOR = 'CBD5E1';
  const BORDER = {
    top: { style: 'thin', color: { argb: BORDER_COLOR } },
    left: { style: 'thin', color: { argb: BORDER_COLOR } },
    bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
    right: { style: 'thin', color: { argb: BORDER_COLOR } },
  };

  // ════════════════════════════════════════════════════════════════════════════
  // DATA: DETAILED FEATURE TREE MAPPED TO APIS WITH DEV LOG & METADATA
  // ════════════════════════════════════════════════════════════════════════════
  const modules = [
    {
      moduleId: 'MOD-01',
      moduleName: 'Xác Thực, Đăng Nhập & Kích Hoạt Thẻ Hội Viên',
      features: [
        {
          id: 'AUTH-01',
          name: 'Đăng nhập đa kênh (Số điện thoại / Mã hội viên / Email)',
          screen: 'Màn hình Đăng nhập (/association/login)',
          api: 'POST /api/auth/login, POST /api/auth/refresh',
          devDate: '10/09/2026',
          contribution: 'Xây dựng luồng đăng nhập nhanh, nhận diện phiên làm việc và bảo mật token JWT riêng cho App Hiệp Hội.',
          team: 'Backend Core & Security',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Đã test thành công trên cả Mobile và Desktop. Tự động nhận diện session đăng nhập.',
        },
        {
          id: 'AUTH-02',
          name: 'Đăng ký tài khoản hội viên mới & Form hồ sơ pháp nhân',
          screen: 'Màn hình Đăng ký (/association/register)',
          api: 'POST /api/auth/register, POST /api/members/apply',
          devDate: '11/09/2026',
          contribution: 'Thiết kế form thu thập hồ sơ doanh nghiệp (Tên DN, MST, Chức vụ, Ngành hàng, Nhu cầu kết nối).',
          team: 'Fullstack Team',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Form nhập liệu đầy đủ: Tên doanh nghiệp, MST, Lĩnh vực, Chức vụ, Nhu cầu kết nối.',
        },
        {
          id: 'AUTH-03',
          name: 'Popup Quên mật khẩu & Gửi OTP qua SMS',
          screen: 'Popup Quên mật khẩu (/association/login)',
          api: 'POST /api/auth/forgot-password, POST /api/auth/verify-otp',
          devDate: '12/09/2026',
          contribution: 'Tích hợp modal khôi phục mật khẩu, kiểm tra đầu số di động và cơ chế rate-limit bảo vệ chống spam.',
          team: 'Backend Core',
          priority: 'Trung bình (P2)',
          status: 'Đã hoàn thành',
          pct: 95,
          note: 'Luồng OTP giả lập hoạt động trơn tru. Khi triển khai live cần kích hoạt Brandname SMS.',
        },
        {
          id: 'AUTH-04',
          name: 'Popup Đổi mật khẩu & Quản lý phiên đăng nhập thiết bị',
          screen: 'Popup Đổi mật khẩu (/association/settings)',
          api: 'PUT /api/auth/password, GET /api/auth/sessions',
          devDate: '12/09/2026',
          contribution: 'Cơ chế mã hóa mật khẩu bcrypt, kiểm tra mật khẩu cũ/mới và hủy phiên đăng nhập từ xa trên các thiết bị khác.',
          team: 'Backend & DevSecOps',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Bảo mật mã hóa bcrypt, kiểm tra độ mạnh mật khẩu và hiển thị danh sách thiết bị đang login.',
        },
        {
          id: 'AUTH-05',
          name: 'Cài đặt PWA lên màn hình chính (iOS Add to Home / Android Install)',
          screen: 'Popup / Banner Cài đặt (/install)',
          api: 'Web App Manifest, Service Worker caching',
          devDate: '13/09/2026',
          contribution: 'Tối ưu manifest, offline caching, hướng dẫn trực quan từng bước cho Safari iOS và Chrome Android.',
          team: 'Frontend UI/UX',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Hỗ trợ offline caching, icon độ nét cao, tương thích chuẩn PWA của Google và Apple.',
        },
      ],
    },
    {
      moduleId: 'MOD-02',
      moduleName: 'Thẻ Hội Viên Thông Minh & Danh Thiếp Điện Tử (Digital Card)',
      features: [
        {
          id: 'CARD-01',
          name: 'Hiển thị Thẻ Hội Viên VIP (Dấu tích xanh, Mã M1983, Avatar, Pháp nhân)',
          screen: 'Màn hình Thẻ Hội Viên (/association/card)',
          api: 'GET /api/connect-app/me, GET /api/members/me',
          devDate: '13/09/2026',
          contribution: 'Thiết kế thẻ kim loại phản chiếu ánh kim, tích hợp chip NFC giả lập và thông tin chức vụ Ban Điều Hành.',
          team: 'Frontend UI/UX',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Thiết kế sang trọng chuẩn Doanh nhân Navy & Gold, hiển thị thời hạn hội viên và chức vụ.',
        },
        {
          id: 'CARD-02',
          name: 'Cấu trúc Hồ sơ Doanh nhân ngay bên dưới Thẻ hội viên',
          screen: 'Màn hình Thẻ Hội Viên (/association/card)',
          api: 'GET /api/connect-app/me, GET /api/members/me',
          devDate: '16/09/2026',
          contribution: 'Tái cấu trúc UI: Đưa Executive Profile xuống ngay dưới thẻ hội viên, nhúng trực tiếp QR lên ảnh bìa, loại bỏ nút "Hiện QR" rườm rà, nhúng NFC/Wallets vào trong profile.',
          team: 'Frontend UI/UX',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Giao diện liền mạch, trực quan, không còn nút bấm rời rạc ngoài luồng.',
        },
        {
          id: 'CARD-03',
          name: 'Tích hợp Mạng xã hội & Ví điện tử (Facebook, Zalo, LinkedIn, Apple/Google Wallet)',
          screen: 'Màn hình Thẻ Hội Viên (/association/card)',
          api: 'GET /api/connect-app/me, PUT /api/connect-app/me/socials',
          devDate: '16/09/2026',
          contribution: 'Bổ sung thanh liên kết mạng xã hội đa kênh (Facebook, Zalo, LinkedIn, Website) và nút lưu thẻ vào Apple Wallet / Google Wallet.',
          team: 'Frontend UI/UX',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Hỗ trợ mở link trực tiếp ứng dụng Facebook/Zalo native trên điện thoại.',
        },
        {
          id: 'CARD-04',
          name: 'Nâng cấp Danh thiếp số công khai chuẩn nhận diện CLB CEO 1983',
          screen: 'Trang Public Card (/card/$code)',
          api: 'GET /api/business-cards/code/:code',
          devDate: '16/09/2026',
          contribution: 'Hiệu chỉnh toàn diện: Bỏ text "HIỆP HỘI DOANH NGHIỆP VIỆT NAM", chuẩn hóa thành "CLB DOANH NHÂN CEO 1983", định dạng ngày DD/MM/YYYY, khử chữ "Admin" và map mã kỹ thuật (ind.it, region.north, active). Bổ sung nút quay về App Hiệp Hội.',
          team: 'Fullstack Team',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Trang danh thiếp số sang trọng, hiển thị chính xác mọi trường dữ liệu của từng doanh nhân.',
        },
        {
          id: 'CARD-05',
          name: 'Nút "Xem danh thiếp số" trong Hồ sơ hội viên',
          screen: 'Modal MemberProfileModal (/association/members, /messages)',
          api: 'GET /api/members/:id',
          devDate: '16/09/2026',
          contribution: 'Đổi nút "Nhắn tin" thành "Xem danh thiếp số" điều hướng trực tiếp sang /card/$code, loại bỏ nút phụ trùng lặp ở chân modal.',
          team: 'Frontend Team',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Chuyển đổi luồng 1 chạm mượt mà sang danh thiếp số của đối tác.',
        },
      ],
    },
    {
      moduleId: 'MOD-03',
      moduleName: 'Công Nghệ Chạm Thẻ Thông Minh NFC & Wallets',
      features: [
        {
          id: 'NFC-01',
          name: 'Popup Radar quét và Chạm kết nối NFC một chạm',
          screen: 'Popup Chạm Thẻ NFC (/association/card, /profile)',
          api: 'Web NFC API (NDEFReader / NDEFWriter)',
          devDate: '14/09/2026',
          contribution: 'Lập trình logic đọc/ghi Web NFC API, giao diện sóng radar quét thẻ sang trọng phong cách công nghệ.',
          team: 'Fullstack & R&D',
          priority: 'Cao (P1)',
          status: 'Đang thực hiện',
          pct: 75,
          note: 'Giao diện radar quét và API đọc/ghi vCard qua Web NFC đã code hoàn thiện, test giả lập thành công; CHƯA TEST ĐƯỢC CHẠM THỰC TẾ THẺ VẬT LÝ NTAG213/215 TRÊN MÁY TÍNH (cần thiết bị smartphone Android/iOS có chip NFC và phôi thẻ vật lý).',
        },
        {
          id: 'NFC-02',
          name: 'Ghi URL Danh thiếp doanh nhân vào phôi thẻ NFC kim loại / gỗ',
          screen: 'Popup Quản lý Thẻ NFC (/association/card)',
          api: 'POST /api/connect-app/nfc/write-url',
          devDate: '14/09/2026',
          contribution: 'Cơ chế ghi URL định danh /card/$code lên chip NFC, kiểm tra quyền sở hữu thẻ và chống ghi đè trái phép.',
          team: 'Backend Core',
          priority: 'Trung bình (P2)',
          status: 'Đang thực hiện',
          pct: 75,
          note: 'Sẵn sàng ghi đè NDEF payload URL danh thiếp cá nhân hóa khi có phôi thẻ vật lý.',
        },
      ],
    },
    {
      moduleId: 'MOD-04',
      moduleName: 'Gắn Kết & Tin Nhắn Doanh Nhân Phong Cách Messenger VIP',
      features: [
        {
          id: 'MSG-01',
          name: 'Danh sách cuộc trò chuyện, hiển thị snippet tin nhắn mới nhất & tab "Chưa đọc"',
          screen: 'Màn hình Hộp thư (/association/messages)',
          api: 'GET /api/connect-app/dm/threads',
          devDate: '13/09/2026 - 16/09/2026',
          contribution: 'Tối ưu danh sách hội thoại: Đưa tab "Chưa đọc" lên vị trí thứ 2 cạnh "Tất cả", loại bỏ thanh bộ lọc chữ cái A-Z gây rối mắt, tìm kiếm nhanh theo tên hội viên.',
          team: 'Frontend UI/UX',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Hiển thị Avatar, Tên hội viên, Snippet tin nhắn mới nhất, huy hiệu Hệ thống, nhãn Chưa đọc trực quan.',
        },
        {
          id: 'MSG-02',
          name: 'Giao diện Chat 1-1 phong cách Messenger (Bong bóng #0084FF, Avatar đối tác, Timestamps)',
          screen: 'Màn hình Chat chi tiết (/association/messages?thread=xxx)',
          api: 'GET /api/connect-app/dm/threads/:id/messages, POST /api/connect-app/dm/threads/:id/messages',
          devDate: '13/09/2026',
          contribution: 'Xây dựng giao diện chat chuẩn Messenger VIP, bong bóng gradient xanh dương, thời gian gửi tin và avatar tròn sắc nét.',
          team: 'Fullstack Team',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Thiết kế giống Messenger 100%, hỗ trợ gửi văn bản, link, hình ảnh và thư mời họp B2B.',
        },
        {
          id: 'MSG-03',
          name: 'Thu hồi tin nhắn đã gửi (Recall Message) & Cơ chế nhảy top luồng chat',
          screen: 'Màn hình Chat chi tiết & Hộp thư',
          api: 'DELETE /api/connect-app/dm/member/messages/:messageId',
          devDate: '14/09/2026',
          contribution: 'Thu hồi tin nhắn realtime qua Socket.io, cập nhật snippet "Bạn đã thu hồi một tin nhắn" và đẩy hội thoại lên đầu.',
          team: 'Backend Core',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Khi thu hồi, tin nhắn đổi thành viền mảnh "Bạn đã thu hồi một tin nhắn", ngoài danh sách lập tức nhảy lên đầu.',
        },
        {
          id: 'MSG-04',
          name: 'Thanh tương tác nhanh nằm ngang (Thả 6 emoji cảm xúc 😊 & Menu ⋯)',
          screen: 'Bong bóng chat (/association/messages)',
          api: 'POST /api/connect-app/dm/messages/:id/reaction',
          devDate: '14/09/2026',
          contribution: 'Thanh menu emoji nổi ngang cạnh tin nhắn, phản hồi xúc cảm 1 chạm và ghim badge cảm xúc góc dưới bong bóng.',
          team: 'Frontend UI/UX',
          priority: 'Trung bình (P2)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Nút icon nằm ngang cạnh bong bóng, hover hiển thị mượt mà, reaction pill đính góc bong bóng.',
        },
        {
          id: 'MSG-05',
          name: 'Gọi thoại & Gọi video doanh nhân WebRTC 1-1 và phòng họp nhóm',
          screen: 'Popup Call WebRTC (/association/messages)',
          api: 'WebRTC Signaling Gateway, Socket.io (webrtc:offer, webrtc:answer, webrtc:candidate)',
          devDate: '15/09/2026',
          contribution: 'Khung gọi thoại WebRTC, cơ chế trao đổi SDP offer/answer qua Socket.io gateway và UI chuông báo đến.',
          team: 'Fullstack & R&D',
          priority: 'Trung bình (P2)',
          status: 'Đang thực hiện',
          pct: 65,
          note: 'Backend signaling gateway và giao diện phòng gọi UI đã hoàn thành; CHƯA TEST ĐƯỢC END-TO-END TRÊN MẠNG THỰC TẾ (cần 2 thiết bị vật lý có camera/mic và cấu hình STUN/TURN server thực tế).',
        },
        {
          id: 'MSG-06',
          name: 'Tạo nhóm chat phong cách Messenger (CreateGroupChatModal: gợi ý tên, icon, carousel chip thành viên)',
          screen: 'Màn hình Hộp thư & Popup Tạo nhóm (/association/messages)',
          api: 'POST /api/connect-app/dm/messages, LocalStorage group sync',
          devDate: '17/09/2026',
          contribution: 'Phát triển modal tạo nhóm chuẩn Facebook Messenger: bộ chọn emoji đại diện, danh sách tên gợi ý theo chủ đề, tìm kiếm thành viên, carousel chip thành viên đã chọn có nút xóa nhanh, danh sách thành viên với checkbox tròn hiệu ứng động.',
          team: 'Frontend & UX VIP',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Trải nghiệm tạo nhóm mượt mà y hệt Messenger, có tab lọc "Nhóm" riêng, nút "Tạo nhóm" trên thanh hoạt động.',
        },
        {
          id: 'MSG-07',
          name: 'Xem thành viên nhóm (GroupMembersModal) & Tin nhắn hệ thống [system] căn giữa',
          screen: 'Màn hình Chat nhóm (/association/messages?thread=group_xxx)',
          api: 'GET /api/connect-app/dm/messages, Member Directory sync',
          devDate: '17/09/2026',
          contribution: 'Header nhóm hiển thị avatar emoji, tên nhóm, số thành viên kèm nút "Thành viên" mở popup danh sách đầy đủ. Tin nhắn tạo nhóm hiển thị dạng pill thông báo căn giữa, tắt cảnh báo tin nhắn chờ.',
          team: 'Fullstack Team',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Đã hoàn thiện và kiểm thử đạt chuẩn 100%.',
        },
      ],
    },
    {
      moduleId: 'MOD-05',
      moduleName: 'Danh Bạ Hội Viên, Mời Gia Nhập & Quản Lý Kết Nối',
      features: [
        {
          id: 'DIR-01',
          name: 'Danh bạ Hội viên Doanh nhân, tìm kiếm theo tên, công ty và lọc theo ngành nghề',
          screen: 'Màn hình Danh bạ (/association/members)',
          api: 'GET /api/members, GET /api/members/industries',
          devDate: '12/09/2026',
          contribution: 'Danh bạ phân trang mượt mà, lọc theo 12 ngành kinh tế mũi nhọn, tìm kiếm tiếng Việt không dấu siêu tốc.',
          team: 'Frontend UI/UX',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Tìm kiếm không dấu, lọc theo 12 phân khúc ngành hàng, hiển thị mã thẻ và công ty.',
        },
        {
          id: 'DIR-02',
          name: 'Tính năng Mời Hội Viên Mới vào CLB CEO 1983 (Invite Modal)',
          screen: 'Modal Mời Hội Viên (/association/members)',
          api: 'GET /api/connect-app/referral, POST /api/connect-app/invite',
          devDate: '16/09/2026',
          contribution: 'Phát triển modal mời hội viên mới với mã QR giới thiệu cá nhân hóa, sao chép đường dẫn giới thiệu, mẫu tin nhắn Zalo/SMS trang trọng và thân thiện, nút chia sẻ 1 chạm lên Zalo/Facebook.',
          team: 'Fullstack Team',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Tăng trưởng mạng lưới hội viên tự nhiên thông qua mã giới thiệu định danh của từng chủ doanh nghiệp.',
        },
        {
          id: 'DIR-03',
          name: 'Popup Hồ sơ năng lực hội viên chi tiết khi bấm vào Avatar',
          screen: 'Modal MemberProfileModal (/association/members, /messages)',
          api: 'GET /api/members/:id, GET /api/members/:id/profile',
          devDate: '14/09/2026 - 16/09/2026',
          contribution: 'Tích hợp nút "Xem danh thiếp số" thay cho nút "Nhắn tin", hiển thị thông tin doanh nghiệp, MST, lĩnh vực hoạt động và số điện thoại.',
          team: 'Frontend UI/UX',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Cung cấp ảnh bìa, avatar, chức vụ, MST, số điện thoại bảo mật, email và nhu cầu B2B.',
        },
        {
          id: 'DIR-04',
          name: 'Nút chuyển đổi trạng thái Kết nối <-> Hủy kết nối thông minh (1 Chạm)',
          screen: 'Modal MemberProfileModal & Danh sách hội viên',
          api: 'POST /api/connect-app/network/connect, POST /api/connect-app/network/disconnect',
          devDate: '14/09/2026',
          contribution: 'Xử lý logic toggle kết nối tức thì, cập nhật danh bạ đối tác và gửi thông báo kết nối mới đến đối tác.',
          team: 'Backend Core',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Nếu đã kết nối: Nút chuyển thành "HỦY KẾT NỐI" (viền đỏ). Nếu chưa kết nối: Nút hiển thị "KẾT NỐI NGAY" (màu xanh).',
        },
      ],
    },
    {
      moduleId: 'MOD-06',
      moduleName: 'Sàn Cơ Hội Giao Thương B2B & Gian Hàng Sản Phẩm',
      features: [
        {
          id: 'B2B-01',
          name: 'Sàn B2B Marketplace phong cách E-Commerce Luxury',
          screen: 'Màn hình Sản phẩm (/association/products)',
          api: 'GET /api/connect-app/products, GET /api/marketplace/products',
          devDate: '13/09/2026',
          contribution: 'Phân hệ sàn giao thương B2B nội khối, thiết kế lưới sản phẩm luxury với nhãn giá ưu đãi hội viên và bộ nhận diện thương hiệu.',
          team: 'Frontend UI/UX',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Trưng bày hình ảnh sản phẩm, mức chiết khấu nội bộ CLB và nút liên hệ mua hàng 1 chạm.',
        },
        {
          id: 'B2B-02',
          name: 'Header tìm kiếm thông minh & Dropdown danh mục ngành hàng',
          screen: 'Màn hình Sản phẩm (/association/products)',
          api: 'GET /api/categories, Fuse.js Search Engine',
          devDate: '14/09/2026',
          contribution: 'Header có thanh tìm kiếm ở giữa, menu thả xuống danh mục sản phẩm mũi nhọn ở bên trái và bộ lọc sắp xếp.',
          team: 'Frontend UI/UX',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Tìm kiếm tức thời theo tên sản phẩm, công ty, ngành nghề; bộ lọc theo giá và độ phổ biến.',
        },
        {
          id: 'B2B-03',
          name: 'Bố cục 3 Section phân trang độc lập (Mới đăng, Xem nhiều, Doanh nghiệp nổi bật)',
          screen: 'Màn hình Sản phẩm (/association/products)',
          api: 'association.products.tsx Section Controllers',
          devDate: '15/09/2026',
          contribution: 'Bố cục 3 section chuyên biệt có phân trang riêng: 1) Sản phẩm mới đăng, 2) Sản phẩm xem nhiều nhất, 3) Doanh nghiệp nổi bật nhất.',
          team: 'Fullstack Team',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Mỗi section phân trang độc lập, hiển thị hồ sơ pháp nhân và nút Xem gian hàng showroom.',
        },
        {
          id: 'B2B-04',
          name: 'Modal Đăng sản phẩm 2 phần với tải ảnh độ nét cao',
          screen: 'Modal Đăng Sản Phẩm (/association/products)',
          api: 'POST /api/connect-app/products, POST /api/upload/file',
          devDate: '15/09/2026',
          contribution: 'Form 2 phần thu thập thông tin cơ bản và thông tin thương mại, tích hợp upload ảnh MinIO S3 dung lượng cao.',
          team: 'Fullstack Team',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Form chia 2 khối: Khối 1 Ảnh + Tên + Danh mục; Khối 2 Giá niêm yết + Ưu đãi hội viên + Mô tả.',
        },
        {
          id: 'B2B-05',
          name: 'Modal Chi tiết sản phẩm & Định dạng giá tiền VND thông minh',
          screen: 'Modal Chi Tiết SP (/association/products)',
          api: 'GET /api/products/:id, Intl.NumberFormat',
          devDate: '16/09/2026',
          contribution: 'Xem chi tiết sản phẩm, zoom ảnh carousel, định dạng giá tiền chuẩn VND và hiển thị hồ sơ công ty chủ quản.',
          team: 'Frontend UI/UX',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Hiển thị giá gốc, giá ưu đãi hội viên, nút Chat trực tiếp với chủ doanh nghiệp.',
        },
        {
          id: 'B2B-06',
          name: 'Menu 3 chấm chỉnh sửa và xóa bài đăng sản phẩm',
          screen: 'Thẻ Sản phẩm (/association/products)',
          api: 'PUT /api/connect-app/products/:id, DELETE /api/connect-app/products/:id',
          devDate: '16/09/2026',
          contribution: 'Menu 3 chấm tác vụ bài viết cho phép chủ sở hữu sửa thông tin hoặc xóa bài niêm yết khỏi sàn.',
          team: 'Backend Core',
          priority: 'Trung bình (P2)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Chỉ hiển thị nút sửa/xóa với sản phẩm do chính hội viên đăng tải.',
        },
        {
          id: 'B2B-07',
          name: 'Đồng bộ & Kiểm duyệt sản phẩm trên Web CRM',
          screen: 'CRM Sàn Giao Thương (/marketplace)',
          api: 'GET/PUT /api/crm/marketplace/products',
          devDate: '17/09/2026',
          contribution: 'Ban Thư Ký kiểm duyệt sản phẩm từ App đẩy lên, gắn nhãn Hot / Ưu đãi và ẩn sản phẩm vi phạm.',
          team: 'Fullstack Team',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Quản trị CRM kiểm soát chất lượng hàng hóa niêm yết trong nội khối hiệp hội.',
        },
        {
          id: 'B2B-08',
          name: 'Bảng tin Cơ hội B2B Social Feed với bộ đếm lượt xem realtime',
          screen: 'Màn hình Cơ hội B2B (/association/opportunities)',
          api: 'GET /api/opportunities, POST /api/opportunities/:id/view',
          devDate: '17/09/2026',
          contribution: 'Bảng tin trao đổi cơ hội mua bán/đầu tư theo phong cách mạng xã hội doanh nhân, tự động tăng view khi mở xem.',
          team: 'Fullstack & Realtime',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Phân loại tin theo Chào mua / Chào bán / Hợp tác đầu tư, kèm giá trị hợp đồng dự kiến.',
        },
        {
          id: 'B2B-09',
          name: 'Modal Đăng tin Cơ hội giao thương & Đính kèm hồ sơ năng lực',
          screen: 'Modal Tạo Cơ Hội (/association/opportunities)',
          api: 'POST /api/connect-app/opportunities, POST /api/upload/file',
          devDate: '18/09/2026',
          contribution: 'Modal soạn thảo tin đăng cơ hội giao thương, đính kèm profile công ty và hình ảnh sản phẩm mẫu.',
          team: 'Frontend UI/UX',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Đính kèm tài liệu PDF hồ sơ năng lực, ảnh chụp dự án và thông tin liên hệ trực tiếp.',
        },
        {
          id: 'B2B-10',
          name: 'Modal Danh sách thành viên Quan tâm cơ hội kèm nút Gọi/Email/Chat',
          screen: 'Modal Đối tác quan tâm (/association/opportunities)',
          api: 'GET /api/opportunities/:id/interests',
          devDate: '18/09/2026',
          contribution: 'Chủ bài đăng xem danh sách các CEO bấm quan tâm cơ hội, hỗ trợ kết nối nhanh qua Gọi, Email và Chat.',
          team: 'Fullstack Team',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Thúc đẩy xúc tiến thương mại B2B thực chất giữa các chủ doanh nghiệp trong CLB.',
        },
      ],
    },
    {
      moduleId: 'MOD-07',
      moduleName: 'Sự Kiện Tràn Viền, Check-in QR & Biểu Quyết Bầu Cử',
      features: [
        {
          id: 'EVT-01',
          name: 'CRM Modal Tạo sự kiện với mẫu Template theo loại hình (Forum, Workshop, Networking, Training)',
          screen: 'Tạo Sự Kiện CRM (/events/new, EventWizard)',
          api: 'apps/vione_app_fe/src/lib/event-type-templates.ts, EventWizard.tsx',
          devDate: '15/09/2026',
          contribution: 'Tự động điền tiêu đề, địa điểm chuẩn, sức chứa và hiển thị khung xem trước Banner preview theo từng loại hình sự kiện.',
          team: 'Fullstack Team',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Chuẩn hóa quy trình tạo sự kiện chuyên nghiệp cho Ban Sự Kiện CLB.',
        },
        {
          id: 'EVT-02',
          name: 'CRM Cấu hình Giá vé: Case 1 Miễn phí (0đ) & Case 2 Thu phí (500.000 VNĐ)',
          screen: 'Modal Tạo Sự Kiện CRM (/events)',
          api: 'POST /api/events, event.ticketPrice configuration',
          devDate: '16/09/2026',
          contribution: 'Thiết lập 2 luồng sự kiện rõ ràng: Vé Miễn phí 0đ dành cho hội viên hoặc Vé Thu phí 500k cho Gala Dinner.',
          team: 'Backend Core',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Đồng bộ cấu hình giá vé tức thời sang Mobile App.',
        },
        {
          id: 'EVT-03',
          name: 'CRM Sơ đồ Khán phòng Cinema Hall Seating Map kéo thả ghế ngồi',
          screen: 'Sơ đồ Khán phòng CRM (/events/seating)',
          api: 'CinemaSeatingMap.tsx, Pointer drag coordinates',
          devDate: '16/09/2026',
          contribution: 'Công cụ kéo thả định vị sơ đồ ghế ngồi trực quan, phân khu hàng ghế VIP Lãnh đạo, Thương gia và Tiêu chuẩn.',
          team: 'Frontend UI/UX',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Hỗ trợ kéo thả tự do, thêm bớt hàng ghế và căn đều vị trí sân khấu.',
        },
        {
          id: 'EVT-04',
          name: 'CRM Quản lý Danh sách Đại biểu & Máy quét mã QR Điểm danh tốc độ cao',
          screen: 'Điểm danh CRM (/events/checkin, /events/:id/attendees)',
          api: 'POST /api/events/:id/checkin, HTML5 QR Scanner',
          devDate: '16/09/2026',
          contribution: 'Quét camera mã QR trên vé Pass của đại biểu tại cổng hội trường, âm thanh bíp xác nhận và đổi trạng thái điểm danh trong 1s.',
          team: 'Fullstack Team',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 95,
          note: 'Ngăn chặn vé giả, chống quét trùng lặp và thống kê lượng khách thời gian thực.',
        },
        {
          id: 'EVT-05',
          name: 'App Màn hình Danh sách Sự kiện tràn viền hiển thị thẻ Miễn phí 0đ và Có phí',
          screen: 'Màn hình Sự kiện (/association/events)',
          api: 'GET /api/events, association.events.tsx',
          devDate: '17/09/2026',
          contribution: 'Giao diện poster dọc 2:3 phong cách điện ảnh với hiệu ứng sóng ánh sáng động Golden Swoosh Wave và nhãn tag giá rõ ràng.',
          team: 'Frontend UI/UX',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Phân loại rõ ràng nhãn Miễn phí 0đ và nhãn 500.000 đ / vé.',
        },
        {
          id: 'EVT-06',
          name: 'App Modal Chi tiết Sự kiện Miễn phí & Nhận vé Pass tức thì kèm Lucky #XXXX',
          screen: 'Modal Đăng ký Sự Kiện (/association/events)',
          api: 'POST /api/events/:id/register, lucky_number generator',
          devDate: '17/09/2026',
          contribution: 'Luồng Case 1: Đăng ký vé 0đ xác nhận tức thì, sinh mã định danh REG-XXXX và cấp mã số may mắn #XXXX quay thưởng.',
          team: 'Fullstack Team',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Tự động gửi vé chi tiết vào mục Thông Báo và Tin Nhắn của hội viên.',
        },
        {
          id: 'EVT-07',
          name: 'App Modal Chi tiết Sự kiện Thu phí & Cổng thanh toán VietQR Napas 247',
          screen: 'Modal Thanh Toán Sự Kiện (/association/events)',
          api: 'POST /api/events/:id/register, VietQR Generator',
          devDate: '17/09/2026',
          contribution: 'Luồng Case 2: Đăng ký vé 500k hiển thị bảng tóm tắt chi phí, chọn số lượng vé và sinh mã VietQR Napas 247 động.',
          team: 'Fullstack Team',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Mã VietQR chứa sẵn số tiền và cú pháp chuyển khoản tự động, quét thanh toán trong 3 giây.',
        },
        {
          id: 'EVT-08',
          name: 'App Màn hình Quản lý Thẻ vé Check-in của tôi với mã QR động',
          screen: 'Màn hình Check-in (/association/checkin)',
          api: 'GET /api/members/me/tickets, QRCode Canvas',
          devDate: '18/09/2026',
          contribution: 'Ví lưu trữ toàn bộ vé sự kiện của hội viên với mã QR động sẵn sàng quét điểm danh tại bàn lễ tân.',
          team: 'Frontend UI/UX',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Hiển thị số ghế, tên sự kiện, ngày giờ và số may mắn bốc thăm.',
        },
        {
          id: 'EVT-09',
          name: 'App & CRM Hệ thống Biểu quyết Trực tiếp (Live Voting) thời gian thực',
          screen: 'CRM (/voting) & App (/association/voting, /notifications)',
          api: 'POST /api/voting/sessions, Socket.io voting:started',
          devDate: '18/09/2026',
          contribution: 'CRM kích hoạt phiên bầu cử, App nhận thông báo đẩy tức thì mở popup biểu quyết, tổng hợp kết quả biểu đồ lên màn LED.',
          team: 'Fullstack & Realtime',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Bỏ phiếu bí mật, mã hóa kết quả, trực quan hóa tỷ lệ tán thành.',
        },
        {
          id: 'EVT-10',
          name: 'App & CRM Vòng quay May mắn (Lucky Draw) & Thẻ thông báo chúc mừng mạ vàng VIP',
          screen: 'CRM (/voting) & App (/association/notifications)',
          api: 'POST /api/voting/lucky-draw/notify, event_registrations.lucky_number',
          devDate: '18/09/2026',
          contribution: 'CRM quay số ngẫu nhiên theo mã số #XXXX, gửi thông báo chúc mừng trúng giải kèm thẻ vàng cúp vinh danh về App hội viên.',
          team: 'Fullstack & Realtime',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Tạo không khí hào hứng, sôi nổi tại các đêm Gala đại hội.',
        },
      ],
    },
    {
      moduleId: 'MOD-08',
      moduleName: 'Thu & Đóng Hội Phí Tự Động Qua VietQR Napas 247',
      features: [
        {
          id: 'FEE-01',
          name: 'Thông báo nhắc nợ hội phí niên khóa & Hóa đơn điện tử trong tin nhắn',
          screen: 'Tin nhắn hệ thống Ban Thư Ký (/association/messages)',
          api: 'GET /api/members/me/fee',
          devDate: '13/09/2026',
          contribution: 'Hệ thống tự động nhắc hội phí niên khóa định kỳ, gửi kèm hóa đơn điện tử trong hộp thư riêng.',
          team: 'Backend Core',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Thông báo định kỳ kèm số tiền và nút mở thanh toán trực tiếp.',
        },
        {
          id: 'FEE-02',
          name: 'Sinh mã VietQR Napas 247 chuẩn quốc gia (Số tiền + Cú pháp tự động)',
          screen: 'Popup Thanh toán Hội phí VietQR (/association/card, /profile)',
          api: 'POST /api/members/me/fee/vietqr',
          devDate: '14/09/2026',
          contribution: 'Tạo mã VietQR theo chuẩn EMVCo/Napas 247, tự động điền STK, số tiền và nội dung nộp hội phí.',
          team: 'Fullstack Team',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Sinh mã QR chuẩn Vietcombank/MBBank, quét bằng mọi app ngân hàng không cần gõ tay.',
        },
        {
          id: 'FEE-03',
          name: 'Webhook gạch nợ tự động & Xuất hóa đơn VAT điện tử',
          screen: 'Lịch sử thanh toán & Trạng thái hội viên',
          api: 'POST /api/webhooks/vietqr/payment, GET /api/members/me/invoices',
          devDate: '14/09/2026',
          contribution: 'Cổng tiếp nhận webhook IPN đối soát biến động số dư ngân hàng và kích hoạt gia hạn thẻ hội viên.',
          team: 'Backend Core',
          priority: 'Cao (P1)',
          status: 'Đang thực hiện',
          pct: 70,
          note: 'Logic webhook gạch nợ tự động và gia hạn thẻ đã code xong; CHƯA TEST ĐƯỢC LUỒNG THANH TOÁN TIỀN THẬT qua cổng ngân hàng (cần môi trường sandbox ngân hàng Vietcombank/MBBank hoặc tài khoản thanh toán live có webhook).',
        },
      ],
    },
    {
      moduleId: 'MOD-09',
      moduleName: 'Trang Cá Nhân, Bố Cục Tin Tức 50% & Hỗ Trợ Ban Thư Ký',
      features: [
        {
          id: 'PRF-01',
          name: 'Quản lý thông tin cá nhân, cập nhật avatar, ảnh bìa & quyền riêng tư',
          screen: 'Màn hình Trang cá nhân (/association/profile)',
          api: 'GET /api/connect-app/me, PUT /api/connect-app/me, POST /api/upload/file',
          devDate: '13/09/2026 - 16/09/2026',
          contribution: 'Trang hồ sơ cá nhân Doanh nhân CEO 1983, loại bỏ hoàn toàn các chuỗi text mặc định ViOne, hỗ trợ thay đổi ảnh đại diện và ảnh bìa.',
          team: 'Frontend UI/UX',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Đã bổ sung popup chỉnh sửa trực tiếp, hỗ trợ upload ảnh bìa và avatar lên MinIO.',
        },
        {
          id: 'NEWS-01',
          name: 'Thiết kế Bố cục Tin tức Tỷ lệ 50% Ảnh & 50% Nội dung',
          screen: 'Màn hình Tin tức Hiệp Hội (/association/news)',
          api: 'GET /api/content/news',
          devDate: '16/09/2026',
          contribution: 'Tái thiết kế toàn diện thẻ tin tức: Nửa bên trái chiếm 50% là ảnh bìa độ nét cao có huy hiệu chuyên mục, nửa bên phải là tiêu đề, trích đoạn, thời gian và lượt xem; Xem trước ảnh lớn sắc nét trong modal đọc bài viết.',
          team: 'Frontend UI/UX',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Giao diện phong cách tạp chí doanh nhân hiện đại, tương thích hoàn hảo trên di động.',
        },
        {
          id: 'PRF-02',
          name: 'Tính năng Hướng dẫn sử dụng App Doanh nhân (Có ảnh demo & tải Word/PDF)',
          screen: 'Modal UserGuideModal (/association/profile)',
          api: 'Tích hợp trực tiếp trên Frontend, liên kết tải file DOCX và PDF',
          devDate: '14/09/2026',
          contribution: 'Tích hợp sẵn bộ tài liệu hướng dẫn sử dụng 6 chuyên đề, hình ảnh minh họa quy trình và liên kết tải tài liệu trực tuyến.',
          team: 'Frontend Team',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Gồm 6 tab chi tiết, ảnh minh họa quy trình, ghi chú Pro-Tip và nút tải Word/PDF trực tiếp.',
        },
        {
          id: 'PRF-03',
          name: 'Tính năng Liên hệ Ban Thư Ký CLB CEO 1983 (Hotline, Zalo OA & Gửi Form)',
          screen: 'Modal ContactSupportModal (/association/profile)',
          api: 'POST /api/connect-app/support/inquiry',
          devDate: '14/09/2026',
          contribution: 'Kênh tiếp nhận hỗ trợ doanh nhân 24/7 qua Hotline Ban Thư Ký, Zalo OA chính thức và form tiếp nhận phản ánh.',
          team: 'Fullstack Team',
          priority: 'Trung bình (P2)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Cung cấp Hotline 24/7, Tổng đài 1900.6883, Zalo OA và form tiếp nhận phản hồi tức thì.',
        },
        {
          id: 'PRF-04',
          name: 'Bộ chuyển đổi Chế độ giao diện (Sáng / Tối / Tương phản) & 8 Ngôn ngữ',
          screen: 'Trang cá nhân & Cài đặt (/association/profile, /settings)',
          api: 'Theme Context & i18n Engine (8 Ngôn ngữ: VI, EN, JA, KO, ZH, FR, DE, ES)',
          devDate: '13/09/2026',
          contribution: 'Hệ thống đa ngôn ngữ 8 thứ tiếng và theme engine dark/light chuẩn phong cách Doanh nhân.',
          team: 'Frontend UI/UX',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Chuyển đổi giao diện và ngôn ngữ mượt mà không cần tải lại trang.',
        },
      ],
    },
    {
      moduleId: 'MOD-10',
      moduleName: 'Tách Biệt Độc Lập Luồng Thông Báo & Landing Page Điện Ảnh',
      features: [
        {
          id: 'NOTIF-01',
          name: 'Tách biệt độc lập 100% luồng Thông báo giữa ViOne và Hiệp hội CEO 1983',
          screen: 'Màn hình Thông báo (/association/notifications & /notifications)',
          api: 'GET /api/connect-app/notifications, GET /api/connect-app/member/notifications',
          devDate: '16/09/2026',
          contribution: 'Cách ly hoàn toàn dữ liệu thông báo: App ViOne lọc bỏ toàn bộ thông báo có app_scope = "association_app". App Hiệp Hội chỉ nhận thông báo nhắm mục tiêu hiệp hội hoặc định danh hội viên theo Email/Phone/Mã hội viên. Khắc phục triệt để lỗi thông báo rò rỉ sang ViOne.',
          team: 'Backend Core & Security',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Đảm bảo 2 ứng dụng hoạt động độc lập tuyệt đối, không trùng lặp hay rò rỉ dữ liệu thông báo nội bộ.',
        },
        {
          id: 'LAND-01',
          name: 'Landing Page Điện Ảnh Siêu Thực 6 Cảnh Cuộn Mượt Mà (Cinematic Scroll Journey)',
          screen: 'Trang chủ Landing (/landing/ceo1983/cinematic & /landing?theme=ceo1983-cinematic)',
          api: 'TanStack Router, CSS Parallax, Organic SVG Mask & Caustics Shaders',
          devDate: '16/09/2026',
          contribution: 'Phát triển trải nghiệm cuộn điện ảnh siêu thực 6 phân cảnh liên tục: Bầu trời (Sky) -> Đàn chim (Birds) -> Cánh diều (Kites) -> Dinh thự (Villas) -> Mặt nước (Blue Water) -> Thủy cung (Underwater). Áp dụng chuyển cảnh hữu cơ hoàn toàn, không khối chữ nhật thô cứng, tích hợp hiệu ứng lặn camera, bong bóng nước và thông điệp bứt phá của các Shark/Lãnh đạo.',
          team: 'Creative Frontend & Motion Design',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Tạo hiệu ứng thị giác đỉnh cao, tôn vinh đẳng cấp và tầm nhìn chiến lược của CLB Doanh Nhân CEO 1983.',
        },
      ],
    },
    {
      moduleId: 'MOD-11',
      moduleName: 'Đăng Ký Landing 3 Cấp, Onboarding, Quyền Riêng Tư & 7 Ban Ngành',
      features: [
        {
          id: 'LAND-02',
          name: 'Popup Đăng ký hội viên mới không bị đóng & Tra cứu 3 trạng thái (Chờ duyệt / Đã duyệt / Cần bổ sung)',
          screen: 'Modal Đăng ký (/landing/ceo/v1)',
          api: 'GET/POST /api/connect-app/club-registration/status',
          devDate: '16/09/2026',
          contribution: 'Sửa lỗi modal đăng ký bị đóng sớm. Nộp đơn xong tự động chuyển sang Tab theo dõi trạng thái. Hiển thị 3 trạng thái chuẩn (Chờ duyệt vàng, Đã duyệt xanh lục, Cần bổ sung đỏ kèm lý do) và thanh tra cứu SĐT.',
          team: 'Fullstack Team',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Ứng viên luôn chủ động theo dõi được tiến độ xét duyệt hồ sơ từ CRM.',
        },
        {
          id: 'ONB-01',
          name: 'Onboarding tạo tài khoản hội viên mới & Tự động đăng nhập vào App Hiệp hội sau khi CRM duyệt',
          screen: 'Modal Kích hoạt tài khoản (/landing/ceo/v1)',
          api: 'POST /api/auth/register, POST /api/auth/login',
          devDate: '16/09/2026',
          contribution: 'Khi hồ sơ được duyệt trên CRM, modal mở form Onboarding tạo tài khoản mới (Username/SĐT, Mật khẩu, Xác nhận), tự động liên kết user_id với bản ghi members và chuyển thẳng vào /association.',
          team: 'Backend & Frontend',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Trải nghiệm mượt mà không cần gửi OTP hoặc chờ email thủ công.',
        },
        {
          id: 'PRIV-01',
          name: 'Quét mã QR & Chạm thẻ NFC hiển thị Avatar và các trường theo Cài đặt riêng tư đối tác',
          screen: 'Modal Quét QR/NFC (AssociationQrScanModal)',
          api: 'GET /api/business-cards/code/:code',
          devDate: '16/09/2026',
          contribution: 'Nâng cấp bộ giải mã QR và NFC: hiển thị ảnh đại diện và các trường cho phép. Các trường bị ẩn hiển thị nhãn "Đã ẩn theo cài đặt riêng tư", bảo mật thông tin cá nhân tuyệt đối.',
          team: 'Fullstack Team',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Tuân thủ đúng quyền riêng tư card_settings khi kết nối.',
        },
        {
          id: 'CONN-01',
          name: 'Popup Nhận yêu cầu kết nối tức thời (Realtime Incoming Connection) hiển thị theo quyền riêng tư',
          screen: 'Modal Toàn cục IncomingConnectionModal (/association/*)',
          api: 'Socket.io connection:requested, POST /api/connect-app/connections/:id/accept',
          devDate: '16/09/2026',
          contribution: 'Khi tài khoản A gửi kết nối sang B, ứng dụng của B lập tức bật Popup toàn màn hình qua WebSocket hiển thị avatar và thông tin A cho phép xem, kèm 2 nút "Chấp nhận ngay" và "Để sau".',
          team: 'Fullstack & Realtime',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Gắn toàn cục tại MemberShell.tsx hoạt động trên toàn bộ phân hệ /association.',
        },
        {
          id: 'SUPP-01',
          name: 'Danh mục Liên hệ & Hỗ trợ đầy đủ 7 Ban Ngành Chuyên Trách CLB Doanh Nhân CEO 1983',
          screen: 'Modal Liên hệ (ContactSupportModal)',
          api: 'POST /api/connect-app/support/inquiry',
          devDate: '16/09/2026',
          contribution: 'Đại tu modal liên hệ hỗ trợ với đầy đủ 7 ban chuyên trách (Thường Trực, Thư Ký, XTTM B2B, Hội Viên, Truyền Thông, Tài Chính, CĐS) cùng Lãnh đạo phụ trách, Hotline, Email, tìm kiếm lọc và gửi form.',
          team: 'Frontend UI/UX',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Cung cấp danh bạ chính thức 7 ban ngành hỗ trợ hội viên.',
        },
        {
          id: 'GUIDE-01',
          name: 'Sổ tay Hướng dẫn sử dụng chuẩn hóa: Gỡ bỏ lọc tin nhắn, thêm Quyền riêng tư, Kết nối tức thời & 7 Ban ngành',
          screen: 'Modal HDSD (UserGuideModal)',
          api: 'Frontend Component UserGuideModal (16 mục hướng dẫn)',
          devDate: '16/09/2026',
          contribution: 'Loại bỏ hoàn toàn mục lọc tin nhắn không còn sử dụng. Bổ sung các tính năng thực tế cao cấp và đánh số thứ tự liền mạch 1-16.',
          team: 'Product & QA',
          priority: 'Trung bình (P2)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Tài liệu hướng dẫn trực quan, chuẩn xác 100% với luồng ứng dụng thực tế.',
        },
        {
          id: 'QR-01',
          name: 'Quét mã QR Hội viên phần cứng Native (Google Code Scanner Integration)',
          screen: 'Modal Quét QR Hội Viên (AssociationMemberQrModal)',
          api: 'com.google.android.gms:play-services-code-scanner, AndroidNative.scanQr()',
          devDate: '17/09/2026',
          contribution: 'Tích hợp Google Play Services Code Scanner tầng Android Native, kết nối qua AndroidNative bridge trong MainActivity. Tự động kích hoạt máy quét camera phần cứng không bị giới hạn bởi HTTPS trình duyệt.',
          team: 'Mobile Native & Core',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Camera mở tức thì, tự động lấy nét và nhận diện mã QR với tốc độ phần cứng cao cấp.',
        },
        {
          id: 'QR-02',
          name: 'Căn giữa tuyệt đối Modal Quét QR & Mã QR Thẻ trên màn hình điện thoại (CSS Grid Safe-Area)',
          screen: 'Modal AssociationQrScanModal & AssociationMemberQrModal',
          api: 'CSS Grid place-items-center, 100dvh & env(safe-area-inset)',
          devDate: '17/09/2026',
          contribution: 'Khắc phục triệt để lỗi popup hiển thị lệch hoặc bị dồn lên trên màn hình điện thoại di động: Chuyển đổi container thành grid place-items-center với 100dvh, my-auto, giới hạn max-h-[88dvh] và đệm safe-area-inset cho cả tai thỏ và thanh điều hướng.',
          team: 'Frontend UI/UX',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Đã kiểm tra căn giữa tuyệt đối 100% trên các kích thước màn hình điện thoại.',
        },
      ],
    },
    {
      moduleId: 'MOD-12',
      moduleName: 'Nâng Cấp Toàn Diện 14 Tính Năng & Tinh Chỉnh Trải Nghiệm Doanh Nhân CEO 1983',
      features: [
        {
          id: 'AUTO-01',
          name: 'Landing Page Polling 4s tự động nhận diện phê duyệt & Điều hướng đăng nhập',
          screen: 'Modal Trạng thái & Kích hoạt (/landing/ceo1983/cinematic)',
          api: 'GET /connect-app/club-registration/status, Polling Interval 4000ms',
          devDate: '17/09/2026',
          contribution: 'Tự động kiểm tra trạng thái phê duyệt từ CRM trong trạng thái Chờ duyệt; khi được duyệt tự động chuyển hướng sang /association/login kèm prefilled username.',
          team: 'Frontend Team',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Không cần người dùng thao tác F5 hay bấm kiểm tra lại, trải nghiệm tự động hoàn toàn.',
        },
        {
          id: 'AUTH-06',
          name: 'Bắt buộc đăng nhập sau khi duyệt hồ sơ (Prefill username, Không bypass login)',
          screen: 'Màn hình Đăng nhập (/association/login)',
          api: 'POST /auth/login',
          devDate: '17/09/2026',
          contribution: 'Bắt buộc người dùng nhập mật khẩu đã đăng ký lúc Onboarding, điền sẵn số điện thoại, tuyệt đối không tự động vượt qua màn hình đăng nhập.',
          team: 'Security & Frontend',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Bảo vệ an toàn danh tính, đảm bảo phiên đăng nhập được xác thực chính chủ.',
        },
        {
          id: 'PROF-05',
          name: 'Đồng bộ dữ liệu Profile thời gian thực giữa Home & Profile (Loại bỏ "Lê Hoàng Long")',
          screen: 'Trang chủ (/association) & Trang cá nhân (/association/profile)',
          api: 'GET /connect-app/me, LocalStorage vba.profile',
          devDate: '17/09/2026',
          contribution: 'Loại bỏ hoàn toàn tên mẫu cứng "Lê Hoàng Long", liên kết reactive state với storage và API profile, cập nhật tên/avatar tức thì.',
          team: 'Frontend Team',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Đồng bộ 100% dữ liệu hội viên thực tế trên mọi màn hình.',
        },
        {
          id: 'QR-03',
          name: 'Khung ngắm Camera in-modal & Gỡ bỏ hook native text scanner trên Trang chủ',
          screen: 'AssociationMemberQrModal.tsx & MainActivity.java',
          api: 'HTML5 MediaDevices, NativeBridge cleanup',
          devDate: '17/09/2026',
          contribution: 'Hiển thị video viewfinder trực tiếp trong khung modal; gỡ bỏ hook injectNativeQrHook đánh chặn text click trên Home tab tránh xung đột camera.',
          team: 'Mobile Native & Frontend',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Khung ngắm camera gọn gàng, không giật lag, không cướp quyền hiển thị.',
        },
        {
          id: 'CONN-02',
          name: 'Handshake kết nối 2 chiều: Tự đóng QR modal người quét & Bật IncomingConnectionModal đối tác',
          screen: 'AssociationMemberQrModal & IncomingConnectionModal',
          api: 'Socket.io connection:requested',
          devDate: '17/09/2026',
          contribution: 'Khi người quét bấm "Lưu kết nối", modal QR tự động đóng ngay lập tức; đồng thời máy đối tác lập tức nhận socket và bật modal tiếp nhận kết nối.',
          team: 'Realtime & Frontend',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Trải nghiệm kết nối 2 chiều tức thì, tự động đóng cửa sổ quét.',
        },
        {
          id: 'OPP-02',
          name: 'Sàn Cơ hội B2B hiển thị ảnh tải lên, tab "Cơ hội của tôi", sort mới nhất & Ngày đăng',
          screen: 'Màn hình Cơ hội B2B (/association/opportunities)',
          api: 'GET/POST /opportunities, connect-app.service.ts',
          devDate: '17/09/2026',
          contribution: 'Hiển thị ảnh thực tế do người dùng tải lên, bổ sung tab "Cơ hội của tôi", sắp xếp tin mới nhất lên đầu và hiển thị ngày đăng chi tiết.',
          team: 'Fullstack Team',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Sàn giao thương B2B chuyên nghiệp, cá nhân hóa quản lý tin đăng.',
        },
        {
          id: 'PROD-02',
          name: 'Gian hàng sản phẩm 2 cột chuẩn e-commerce, cách ly bookmark theo User & Tab tôi đăng',
          screen: 'Màn hình Sản phẩm (/association/products)',
          api: 'GET /marketplace/products, LocalStorage vba_interested_products_${userId}',
          devDate: '17/09/2026',
          contribution: 'Thiết kế lưới 2 cột phong cách sàn thương mại điện tử, cách ly bookmark theo từng user (tài khoản mới khởi tạo 0), tab "Sản phẩm tôi đăng", sắp xếp mới nhất.',
          team: 'Frontend UI/UX',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Giao diện thương mại điện tử 2 cột hiện đại, bảo mật bookmark cá nhân.',
        },
        {
          id: 'EVT-04',
          name: 'Thẻ sự kiện Poster 2:3 có nhãn độ tuổi (16+, 18+, 13+) & Backdrop sân khấu /events',
          screen: 'Trang chủ (/association) & Màn hình Sự kiện (/association/events)',
          api: 'Frontend Component & CSS Styling',
          devDate: '17/09/2026',
          contribution: 'Thẻ sự kiện trang chủ dạng poster dọc 2:3 phong cách show giải trí với nhãn độ tuổi và đánh giá; bổ sung backdrop sân khấu với vệt sáng sang trọng tại /events.',
          team: 'Frontend UI/UX',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Chuẩn hóa thiết kế theo phong cách poster giải trí cao cấp Image 1.',
        },
        {
          id: 'HOME-02',
          name: 'Cấu trúc thứ tự khối Trang chủ chuẩn: Sự kiện -> Cơ hội -> Sản phẩm',
          screen: 'Trang chủ (/association)',
          api: 'association.index.tsx layout',
          devDate: '17/09/2026',
          contribution: 'Sắp xếp lại thứ tự hiển thị trên trang chủ: Khối 1 Sự kiện nổi bật -> Khối 2 Cơ hội giao thương B2B -> Khối 3 Gian hàng sản phẩm tiêu biểu.',
          team: 'Frontend Team',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Luồng thị giác và ưu tiên thông tin chuẩn logic kinh doanh CLB.',
        },
        {
          id: 'NOTIF-02',
          name: 'Cách ly thông báo theo User, lọc bỏ dữ liệu sự kiện rác cũ & Lời chào mừng chính thức',
          screen: 'Hộp thông báo (/association/messages)',
          api: 'connect-app.service.ts getNotifications',
          devDate: '17/09/2026',
          contribution: 'Lọc thông báo theo thời điểm tạo tài khoản userCreatedAt, loại bỏ dữ liệu sự kiện/cơ hội cũ cho tài khoản mới, tạo thông báo chào mừng chính thức từ Ban Quản Trị.',
          team: 'Backend Core',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Hộp thư thông báo sạch sẽ, cá nhân hóa 100% cho từng hội viên.',
        },
        {
          id: 'MSG-08',
          name: 'Khử trùng lặp tin nhắn (Deduplication), Socket realtime & Xóa badge unread khi mở thread',
          screen: 'Màn hình Chat (/association/messages)',
          api: 'Socket.io member:message_received, mergedMessages deduplication',
          devDate: '17/09/2026',
          contribution: 'Khử duplicate tin nhắn dựa trên chữ ký nội dung và timestamp 15s; lắng nghe socket realtime; tự động xóa huy hiệu unread ngay khi mở cuộc trò chuyện.',
          team: 'Fullstack & Realtime',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Trải nghiệm nhắn tin mượt mà, không lag, không trùng lặp.',
        },
        {
          id: 'MSG-09',
          name: 'Thanh nhập tin nhắn Mobile với nút (+) mở rộng & Popup Cuộc gọi tương tác',
          screen: 'Màn hình Chat (/association/messages)',
          api: 'Mobile Chat Input Expander & Call Modal interactive controls',
          devDate: '17/09/2026',
          contribution: 'Thay thế 3 nút inline media bằng nút (+) mở rộng menu đính kèm chống tràn mép trên mobile; popup cuộc gọi thoại/video hỗ trợ tương tác đầy đủ các nút mic, cam, ngắt.',
          team: 'Frontend UI/UX',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Tối ưu hóa layout di động và hoàn thiện UX cuộc gọi.',
        },
        {
          id: 'PROF-06',
          name: 'Đồng bộ Menu cá nhân chuẩn Image 3 & Phím tắt (+) tạo nhanh Danh thiếp số',
          screen: 'Trang cá nhân (/association/profile) & /association/business-cards',
          api: 'Navigation & query params action=create',
          devDate: '17/09/2026',
          contribution: 'Sắp xếp danh mục menu cá nhân khớp bản vẽ tham chiếu Image 3; dòng "Quản lý Danh thiếp số" có nút (+) mở thẳng form tạo mới danh thiếp.',
          team: 'Frontend Team',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Tiện ích 1 chạm tạo nhanh danh thiếp số cho doanh nhân.',
        },
        {
          id: 'NEWS-02',
          name: 'Tab kép Tin tức CLB & Sự kiện Hiệp Hội trong /association/news',
          screen: 'Màn hình Tin tức (/association/news)',
          api: 'GET /api/content/news, listMyEvents',
          devDate: '17/09/2026',
          contribution: 'Tích hợp 2 tab chuyên biệt: Tab 1 "Tin tức CLB" đọc bài báo chi tiết, Tab 2 "Sự kiện Hiệp Hội" xem poster và liên kết sang /events.',
          team: 'Frontend Team',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Trải nghiệm đọc tin và theo dõi sự kiện đa năng trong một màn hình.',
        },
        {
          id: 'SEC-02',
          name: 'Đổi mật khẩu (/users/change-password), khóa nút Đăng xuất & Vô hiệu hóa tài khoản',
          screen: 'Màn hình Cài đặt Bảo mật (/association/settings)',
          api: 'POST /users/change-password, POST /users/deactivate',
          devDate: '17/09/2026',
          contribution: 'Kết nối API đổi mật khẩu chuẩn, khóa nút Đăng xuất cho đến khi đổi mật khẩu thành công trong phiên, modal vô hiệu hóa tài khoản kèm xác nhận mật khẩu, lược bỏ avatar khỏi tab bảo mật.',
          team: 'Backend & Security',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Quy chuẩn bảo mật nghiêm ngặt, tuân thủ an toàn thông tin.',
        },
        {
          id: 'CRM-01',
          name: 'Phân quyền Sidebar CRM theo vai trò, ẩn "Quyền của tôi" & Sơ đồ rạp chiếu kéo thả ghế sân khấu',
          screen: 'Sidebar CRM & CinemaSeatingMap (/events/seating)',
          api: 'Sidebar role-based permission matrix, Pointer drag coordinates',
          devDate: '17/09/2026',
          contribution: 'Sidebar CRM ẩn/hiện menu chính xác theo vai trò (Platform Admin vs Association Admin vs Trưởng ban), gỡ bỏ mục "Quyền của tôi"; sơ đồ rạp chiếu Cinema hỗ trợ kéo thả tự do tọa độ ghế sân khấu, thêm/bớt và căn đều.',
          team: 'Fullstack Team',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Quản trị CRM phân quyền chặt chẽ và tùy biến sơ đồ khán phòng linh hoạt.',
        },
      ],
    },
    {
      moduleId: 'MOD-13',
      moduleName: 'Nâng Cấp 7 Tính Năng: HTTPS, Sự Kiện Banner Templates, Biểu Quyết, Lucky Draw, Sàn TMĐT Luxury, Bảng Tin Cơ Hội & iOS PWA',
      features: [
        {
          id: 'REQ-01',
          name: 'Cấu hình HTTPS SSL & Kịch bản Fast Deploy cho Web CRM và App Hiệp Hội',
          screen: 'Server Dev (14.225.217.232)',
          api: 'deploy/ssl/nginx.conf, deploy-ssl.ps1, fast-deploy.ps1 -EnableHttps',
          devDate: '19/09/2026',
          contribution: 'Sinh chứng chỉ SSL SAN hợp lệ cho IP máy chủ và tên miền sslip.io, cấu hình Nginx SSL Reverse Proxy, mở port 5443 (CRM) và 5444 (App Hiệp hội), nâng cấp script fast-deploy.ps1 hỗ trợ tham số -EnableHttps triển khai tự động.',
          team: 'DevOps & Infrastructure',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Hỗ trợ cả HTTP và HTTPS qua SSL Nginx Reverse Proxy, sẵn sàng đẩy lên server dev.',
        },
        {
          id: 'REQ-02',
          name: 'Thiết kế Banner và Bố cục Text riêng cho từng loại Sự kiện (Forum, Workshop, Networking, Training)',
          screen: 'Tạo Sự Kiện CRM (/events/new, EventWizard)',
          api: 'apps/vione_app_fe/src/lib/event-type-templates.ts, EventWizard.tsx',
          devDate: '19/09/2026',
          contribution: 'Xây dựng bộ template riêng cho từng loại sự kiện: Diễn đàn cấp cao (Forum), Workshop & Tọa đàm, Kết nối Doanh nhân (Networking), Đào tạo & Huấn luyện (Training). Khi Admin chọn loại sự kiện trên CRM, tự động điền thông tin tiêu đề, tagline, sức chứa, địa điểm và hiển thị banner preview trực tiếp.',
          team: 'Fullstack & UI/UX',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Banner bố cục text tương ứng chuẩn từng thể loại sự kiện, xem trước tức thời khi tạo.',
        },
        {
          id: 'REQ-03',
          name: 'Thông báo Biểu Quyết Sự Kiện đẩy thời gian thực về App Hiệp Hội',
          screen: 'Tạo Biểu Quyết CRM (/voting) & Màn hình Thông báo App (/association/notifications)',
          api: 'POST /api/voting/sessions, connect-app.service.ts, association.notifications.tsx',
          devDate: '19/09/2026',
          contribution: 'Liên kết luồng biểu quyết giữa CRM và App: Khi tạo phiên biểu quyết tại CRM, hệ thống tự động phát sinh thông báo đẩy định danh về App Hiệp hội, hiển thị thẻ tương tác kèm nút "Tham gia biểu quyết ngay" đưa hội viên thẳng vào phiên bầu chọn.',
          team: 'Fullstack & Realtime',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Hội viên nhận thông báo ngay trên App Hiệp hội và click bình chọn thời gian thực.',
        },
        {
          id: 'REQ-04',
          name: 'Quay Thưởng May Mắn (Lucky Draw) từ CRM, Số Vé May Mắn Random & Thông Báo Chúc Mừng',
          screen: 'Quay số trúng thưởng (/voting) & Thông báo App (/association/notifications)',
          api: 'public.event_registrations.lucky_number, POST /api/voting/lucky-draw/notify',
          devDate: '19/09/2026',
          contribution: 'Thêm cột lucky_number và tự động sinh số may mắn ngẫu nhiên 4 chữ số (#XXXX) mỗi khi hội viên đăng ký vé sự kiện. Module LuckyDrawModal trên CRM quay số ngẫu nhiên từ danh sách vé đã đăng ký, hiển thị người trúng giải và gửi thông báo chúc mừng trúng thưởng kèm giải thưởng tức thì về App.',
          team: 'Fullstack & Backend Core',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Đã backfill số may mắn cho toàn bộ đăng ký cũ. Thông báo trúng thưởng thẻ vàng sang trọng.',
        },
        {
          id: 'REQ-05',
          name: 'Sàn Giao Thương Thương Mại Điện Tử Luxury E-Commerce với 3 Section Phân Trang',
          screen: 'Màn hình Sản phẩm (/association/products)',
          api: 'GET /api/products, GET /api/marketplace/products, association.products.tsx',
          devDate: '19/09/2026',
          contribution: 'Đại tu giao diện Sàn giao thương theo phong cách E-Commerce sang trọng: Header có tìm kiếm ở giữa, menu thả xuống danh mục sản phẩm ở bên trái, icon bộ lọc và nút "Đăng SP" ở bên phải. Bố cục 3 section chuyên biệt có phân trang riêng: 1) Sản phẩm mới đăng, 2) Sản phẩm được xem nhiều nhất, 3) Doanh nghiệp/Công ty nổi bật nhất (mỗi hội viên đại diện cho 1 công ty).',
          team: 'Frontend UI/UX',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Phân trang độc lập từng section, hiển thị giá ưu đãi hội viên và nút xem gian hàng doanh nghiệp.',
        },
        {
          id: 'REQ-06',
          name: 'Bảng Tin Trao Cơ Hội Giao Thương: Phân Trang, Đếm Lượt Xem & Danh Sách Người Quan Tâm Cho Chủ Bài',
          screen: 'Màn hình Trao Cơ Hội (/association/opportunities)',
          api: 'GET /api/opportunities, POST /api/opportunities/:id/view, GET /api/opportunities/:id/interests',
          devDate: '19/09/2026',
          contribution: 'Nâng cấp giao diện Trao cơ hội dạng bảng tin có phân trang mượt mà; tích hợp bộ đếm lượt xem realtime tăng dần mỗi khi người dùng khác click xem chi tiết; riêng chủ bài đăng có thể xem danh sách đầy đủ những ai bấm quan tâm kèm nút liên hệ trực tiếp Gọi điện, Gửi email và Nhắn tin.',
          team: 'Fullstack Team',
          priority: 'Cao (P1)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Chủ bài đăng nắm bắt danh sách đối tác quan tâm và kết nối xúc tiến thương mại tức thì.',
        },
        {
          id: 'REQ-07',
          name: 'Cấu Hình PWA Hoàn Chỉnh Cho App Hiệp Hội (Tương Thích Mọi Thiết Bị iOS & Android)',
          screen: 'App Hiệp Hội (/association)',
          api: 'public/manifest.webmanifest, public/sw.js, register-sw.ts, IosInstallPrompt.tsx',
          devDate: '19/09/2026',
          contribution: 'Thiết lập PWA tiêu chuẩn cho App Hiệp hội: File manifest.webmanifest với start_url: "/association", theme_color CEO 1983 (#003B95), đăng ký Service Worker sw.js hỗ trợ bộ nhớ đệm ngoại tuyến, meta tags Apple Web App Capable, và component IosInstallPrompt hiển thị hướng dẫn trực quan cài đặt "Thêm vào MH chính" trên Safari iOS.',
          team: 'Mobile & PWA Specialist',
          priority: 'Khẩn cấp (P0)',
          status: 'Đã hoàn thành',
          pct: 100,
          note: 'Người dùng iOS trải nghiệm ứng dụng toàn màn hình mượt mà như app tải từ App Store.',
        },
      ],
    },
  ];

  // ════════════════════════════════════════════════════════════════════════════
  // SHEET 1: TỔNG QUAN TIẾN ĐỘ & HIỆN TRẠNG KỸ THUẬT
  // ════════════════════════════════════════════════════════════════════════════
  const wsOverview = wb.addWorksheet('Tổng Quan Tiến Độ', { views: [{ showGridLines: true }] });
  wsOverview.columns = [
    { width: 4 },
    { width: 36 },
    { width: 22 },
    { width: 22 },
    { width: 24 },
    { width: 22 },
    { width: 26 },
  ];

  // Title Banner
  wsOverview.mergeCells('B2:G2');
  const titleCell = wsOverview.getCell('B2');
  titleCell.value = 'BÁO CÁO TIẾN ĐỘ PHÁT TRIỂN & ĐÁNH GIÁ KỸ THUẬT ỨNG DỤNG HIỆP HỘI CEO 1983';
  titleCell.font = { name: 'Times New Roman', size: 15, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  wsOverview.getRow(2).height = 40;

  // Subtitle
  wsOverview.mergeCells('B3:G3');
  const subCell = wsOverview.getCell('B3');
  subCell.value = 'Hệ sinh thái VIONE Connect · Đánh giá trung thực hiện trạng kiểm thử phần cứng & môi trường sandbox bên thứ ba';
  subCell.font = { name: 'Times New Roman', size: 11, italic: true, color: { argb: '475569' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  wsOverview.getRow(3).height = 24;

  // KPI Summary
  let totalFeatures = 0;
  let completedFeatures = 0;
  let inProgressFeatures = 0;
  let totalPctSum = 0;

  modules.forEach((m) => {
    m.features.forEach((f) => {
      totalFeatures++;
      if (f.status === 'Đã hoàn thành') completedFeatures++;
      else if (f.status === 'Đang thực hiện') inProgressFeatures++;
      totalPctSum += f.pct;
    });
  });

  const avgPct = Math.round(totalPctSum / totalFeatures);

  const kpis = [
    { label: 'TỔNG TÍNH NĂNG CON', val: `${totalFeatures} Tính năng`, color: '0084FF' },
    { label: 'ĐÃ HOÀN THÀNH', val: `${completedFeatures} Tính năng`, color: '10B981' },
    { label: 'ĐANG THỰC HIỆN / CHỜ TEST', val: `${inProgressFeatures} Tính năng`, color: 'F59E0B' },
    { label: 'ĐỘ HOÀN THIỆN TRUNG BÌNH', val: `${avgPct}%`, color: '8B5CF6' },
  ];

  kpis.forEach((k, i) => {
    const colIdx = i + 3;
    const valCell = wsOverview.getRow(5).getCell(colIdx);
    valCell.value = k.val;
    valCell.font = { name: 'Times New Roman', size: 14, bold: true, color: { argb: k.color } };
    valCell.alignment = { vertical: 'middle', horizontal: 'center' };
    valCell.border = BORDER;

    const lblCell = wsOverview.getRow(6).getCell(colIdx);
    lblCell.value = k.label;
    lblCell.font = { name: 'Times New Roman', size: 9.5, bold: true, color: { argb: '64748B' } };
    lblCell.alignment = { vertical: 'middle', horizontal: 'center' };
    lblCell.border = BORDER;
  });
  wsOverview.getRow(5).height = 30;
  wsOverview.getRow(6).height = 20;

  // Header Table 1: Bảng tổng hợp theo phân hệ
  wsOverview.getCell('B8').value = 'BẢNG TỔNG HỢP TIẾN ĐỘ THEO TỪNG PHÂN HỆ CHỨC NĂNG';
  wsOverview.getCell('B8').font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: NAVY } };

  const tableHeaders1 = ['Mã Phân Hệ', 'Tên Phân Hệ Chức Năng', 'Số Tính Năng', 'Đã Hoàn Thành', 'Đang Hoàn Thiện', 'Độ Hoàn Thiện (%)'];
  const row9 = wsOverview.getRow(9);
  row9.height = 28;
  tableHeaders1.forEach((h, i) => {
    const cell = row9.getCell(i + 2);
    cell.value = h;
    cell.font = { name: 'Times New Roman', size: 10.5, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    cell.alignment = { vertical: 'middle', horizontal: i === 1 ? 'left' : 'center' };
    cell.border = BORDER;
  });

  let curRow = 10;
  modules.forEach((mod) => {
    const row = wsOverview.getRow(curRow);
    row.height = 24;

    const modTotal = mod.features.length;
    const modDone = mod.features.filter((f) => f.status === 'Đã hoàn thành').length;
    const modProg = mod.features.filter((f) => f.status === 'Đang thực hiện').length;
    const modAvgPct = Math.round(mod.features.reduce((s, f) => s + f.pct, 0) / modTotal);

    row.getCell(2).value = mod.moduleId;
    row.getCell(3).value = mod.moduleName;
    row.getCell(4).value = modTotal;
    row.getCell(5).value = modDone;
    row.getCell(6).value = modProg;
    row.getCell(7).value = `${modAvgPct}%`;

    [2, 3, 4, 5, 6, 7].forEach((cIdx) => {
      const cell = row.getCell(cIdx);
      cell.font = { name: 'Times New Roman', size: 10, bold: cIdx === 2 || cIdx === 7 };
      cell.alignment = { vertical: 'middle', horizontal: cIdx === 3 ? 'left' : 'center' };
      cell.border = BORDER;
      if (cIdx === 7) {
        cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: modAvgPct === 100 ? '10B981' : 'D97706' } };
      }
    });

    curRow++;
  });

  // Warning Box on Hardware & External Sandboxes
  curRow += 2;
  wsOverview.mergeCells(`B${curRow}:G${curRow}`);
  const warnHeader = wsOverview.getCell(`B${curRow}`);
  warnHeader.value = '⚠️ LƯU Ý ĐẶC BIỆT: CÁC TÍNH NĂNG CHƯA KIỂM THỬ ĐƯỢC TRÊN MÔI TRƯỜNG DEV';
  warnHeader.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'B45309' } };
  warnHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
  warnHeader.alignment = { vertical: 'middle', horizontal: 'left' };
  warnHeader.border = BORDER;
  wsOverview.getRow(curRow).height = 26;

  curRow++;
  const unTestableNotes = [
    '1. Gọi thoại & Gọi video WebRTC: Code backend signaling Socket.io và UI đã xong 100%, nhưng chưa test được cuộc gọi giữa 2 điện thoại thật trên mạng Internet thực tế (cần thiết bị di động có mic/cam và máy chủ TURN relay).',
    '2. Chạm thẻ thông minh NFC: Code đọc/ghi Web NFC API đã xong và giả lập trên browser thành công, nhưng chưa test được chạm thực tế thẻ vật lý NTAG213/215 trên máy tính dev (PC không có chip NFC).',
    '3. Gạch nợ tự động VietQR: Sinh mã VietQR Napas 247 đã test chuẩn 100%, nhưng luồng webhook gạch nợ tự động cần tài khoản ngân hàng thật của CLB hoặc môi trường sandbox từ cổng thanh toán.',
  ];

  unTestableNotes.forEach((txt) => {
    wsOverview.mergeCells(`B${curRow}:G${curRow}`);
    const noteCell = wsOverview.getCell(`B${curRow}`);
    noteCell.value = txt;
    noteCell.font = { name: 'Times New Roman', size: 10, color: { argb: '78350F' } };
    noteCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEB' } };
    noteCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    noteCell.border = BORDER;
    wsOverview.getRow(curRow).height = 28;
    curRow++;
  });

  // ════════════════════════════════════════════════════════════════════════════
  // SHEET 2: KẾ HOẠCH TIẾN ĐỘ, ĐÓNG GÓP & HIỆU CHỈNH CHI TIẾT
  // ════════════════════════════════════════════════════════════════════════════
  const wsDetail = wb.addWorksheet('Kế Hoạch & Tiến Độ Chi Tiết', { views: [{ showGridLines: true }] });
  wsDetail.columns = [
    { width: 4 },  // A: Spacer
    { width: 8 },  // B: STT
    { width: 14 }, // C: Mã Công Việc
    { width: 24 }, // D: Phân Hệ
    { width: 32 }, // E: Tên Chức Năng / Task
    { width: 16 }, // F: Ngày Phát Triển
    { width: 38 }, // G: Đóng Góp / Hiệu Chỉnh Sửa
    { width: 20 }, // H: Người Thực Hiện
    { width: 14 }, // I: Mức Độ Ưu Tiên (Cao / Trung bình / Thấp)
    { width: 18 }, // J: Tình Trạng Chung
    { width: 14 }, // K: Hoàn Thiện Chung (%)
    { width: 32 }, // L: Giao Diện (Màn Hình)
    { width: 20 }, // M: Tình Trạng Giao Diện
    { width: 16 }, // N: Hoàn Thiện Giao Diện (%)
    { width: 34 }, // O: API Mapped
    { width: 18 }, // P: Tình Trạng API
    { width: 16 }, // Q: Hoàn Thiện API (%)
    { width: 16 }, // R: Ghi Chú (Để trắng)
  ];

  // Helper normalize priority to only: Cao, Trung bình, Thấp
  function normalizePriority(p) {
    const s = String(p || '').toLowerCase();
    if (s.includes('p0') || s.includes('khẩn cấp') || s.includes('p1') || s.includes('cao')) return 'Cao';
    if (s.includes('p2') || s.includes('trung bình')) return 'Trung bình';
    return 'Thấp';
  }

  // Header Title
  wsDetail.mergeCells('B2:R2');
  const titleCell2 = wsDetail.getCell('B2');
  titleCell2.value = 'BẢNG KẾ HOẠCH TIẾN ĐỘ, ĐÓNG GÓP HIỆU CHỈNH & ÁNH XẠ KỸ THUẬT CHI TIẾT - APP HIỆP HỘI CEO 1983';
  titleCell2.font = { name: 'Times New Roman', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  titleCell2.alignment = { vertical: 'middle', horizontal: 'center' };
  wsDetail.getRow(2).height = 36;

  const tableHeaders2 = [
    'STT',
    'Mã Công Việc',
    'Hạng Mục / Phân Hệ',
    'Tên Chức Năng / Task',
    'Ngày Phát Triển',
    'Đóng Góp / Hiệu Chỉnh Sửa',
    'Người Thực Hiện',
    'Mức Độ Ưu Tiên',
    'Tình Trạng Chung',
    'Hoàn Thiện (%)',
    'Giao Diện (Màn Hình)',
    'Tình Trạng Giao Diện',
    'Hoàn Thiện Giao Diện (%)',
    'API Mapped',
    'Tình Trạng API',
    'Hoàn Thiện API (%)',
    'Ghi Chú',
  ];

  const row4 = wsDetail.getRow(4);
  row4.height = 32;
  tableHeaders2.forEach((h, idx) => {
    const cell = row4.getCell(idx + 2);
    cell.value = h;
    cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
    cell.alignment = { vertical: 'middle', horizontal: idx === 3 || idx === 5 || idx === 10 || idx === 13 ? 'left' : 'center', wrapText: true };
    cell.border = BORDER;
  });

  let detailRow = 5;
  let sttCounter = 1;

  modules.forEach((mod) => {
    // Module Header Banner
    wsDetail.mergeCells(`B${detailRow}:R${detailRow}`);
    const modCell = wsDetail.getCell(`B${detailRow}`);
    modCell.value = `${mod.moduleId}: ${mod.moduleName.toUpperCase()}`;
    modCell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: '0F172A' } };
    modCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
    modCell.alignment = { vertical: 'middle', horizontal: 'left' };
    modCell.border = BORDER;
    wsDetail.getRow(detailRow).height = 26;
    detailRow++;

    mod.features.forEach((feat) => {
      const r = wsDetail.getRow(detailRow);
      r.height = 36;

      const prio = normalizePriority(feat.priority);
      const uiStatus = feat.status === 'Đã hoàn thành' ? 'Đã hoàn thành' : 'Đang hoàn thiện';
      const uiPct = `${feat.pct}%`;
      const apiStatus = feat.status === 'Đã hoàn thành' ? 'Đã kết nối' : 'Đang phát triển';
      const apiPct = `${feat.pct}%`;

      r.getCell(2).value = sttCounter++;
      r.getCell(3).value = feat.id;
      r.getCell(4).value = mod.moduleName;
      r.getCell(5).value = feat.name;
      r.getCell(6).value = feat.devDate || '10/09/2026 - 16/09/2026';
      r.getCell(7).value = feat.contribution || feat.name;
      r.getCell(8).value = 'Phạm Văn Vũ'; // Người thực hiện: Phạm Văn Vũ
      r.getCell(9).value = prio;          // Mức độ ưu tiên: Cao, Trung bình, Thấp
      r.getCell(10).value = feat.status;
      r.getCell(11).value = `${feat.pct}%`;
      r.getCell(12).value = feat.screen;  // Giao diện (Màn hình)
      r.getCell(13).value = uiStatus;     // Tình trạng Giao diện
      r.getCell(14).value = uiPct;        // Hoàn thiện Giao diện (%)
      r.getCell(15).value = feat.api;     // API Mapped
      r.getCell(16).value = apiStatus;    // Tình trạng API
      r.getCell(17).value = apiPct;       // Hoàn thiện API (%)
      r.getCell(18).value = '';           // Ghi chú để trắng theo yêu cầu

      [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].forEach((cIdx) => {
        const c = r.getCell(cIdx);
        c.font = { name: 'Times New Roman', size: 9.5 };
        c.border = BORDER;

        if ([2, 3, 6, 8, 9, 10, 11, 13, 14, 16, 17].includes(cIdx)) {
          c.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          c.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        }

        if (cIdx === 9) { // Priority
          c.font = { name: 'Times New Roman', size: 9.5, bold: true, color: { argb: prio === 'Cao' ? 'DC2626' : prio === 'Trung bình' ? 'D97706' : '10B981' } };
        }
        if (cIdx === 10 || cIdx === 13 || cIdx === 16) { // Status
          const isDone = c.value === 'Đã hoàn thành' || c.value === 'Đã kết nối';
          c.font = { name: 'Times New Roman', size: 9.5, bold: true, color: { argb: isDone ? '10B981' : 'D97706' } };
        }
        if (cIdx === 11 || cIdx === 14 || cIdx === 17) { // Pct
          c.font = { name: 'Times New Roman', size: 9.5, bold: true, color: { argb: feat.pct === 100 ? '10B981' : 'B45309' } };
        }
      });

      detailRow++;
    });
  });

  const outXlsx = path.join(docsDir, 'TIEN_DO_CONG_VIEC_APP_HIEP_HOI_CHI_TIET.xlsx');
  try {
    await wb.xlsx.writeFile(outXlsx);
    console.log(`✓ Generated Excel Work Progress file -> ${outXlsx}`);
  } catch (err) {
    if (err.code === 'EBUSY') {
      const fallbackXlsx = path.join(docsDir, 'TIEN_DO_CONG_VIEC_APP_HIEP_HOI_CHI_TIET_MOI.xlsx');
      await wb.xlsx.writeFile(fallbackXlsx);
      console.warn(`[WARN] File ${outXlsx} đang được mở trong Excel. Đã xuất bản sao mới tại: ${fallbackXlsx}`);
    } else {
      throw err;
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // GENERATE MARKDOWN VERSION (.md)
  // ════════════════════════════════════════════════════════════════════════════
  let md = `# KẾ HOẠCH TIẾN ĐỘ & NHẬT KÝ PHÁT TRIỂN CHI TIẾT ỨNG DỤNG HIỆP HỘI CEO 1983
**Dự án:** VIONE Ecosystem · **Phân hệ:** CLB Doanh Nhân CEO 1983 Mobile App  
**Người thực hiện:** Phạm Văn Vũ · **Cập nhật:** Ngày 16/09/2026

---

## 1. TỔNG QUAN HIỆN TRẠNG & TỶ LỆ HOÀN THIỆN
- **Tổng số tính năng con được khảo sát & triển khai:** ${totalFeatures} tính năng
- **Tính năng đã hoàn thành (Ready for Production):** ${completedFeatures} / ${totalFeatures} tính năng (${Math.round((completedFeatures / totalFeatures) * 100)}%)
- **Tính năng đang thực hiện (Pending Sandbox / Hardware test):** ${inProgressFeatures} / ${totalFeatures} tính năng (${Math.round((inProgressFeatures / totalFeatures) * 100)}%)
- **Độ hoàn thiện mã nguồn trung bình:** **${avgPct}%**

> [!WARNING]
> ### LƯU Ý VỀ CÁC TÍNH NĂNG CHƯA KIỂM THỬ TRÊN MÔI TRƯỜNG DEV:
> 1. **Gọi thoại & Gọi video WebRTC 1-1 / Nhóm (Độ hoàn thiện 65%):** Code Socket.io signaling gateway backend và giao diện phòng gọi UI đã thiết kế hoàn chỉnh. **Chưa thể kiểm thử end-to-end trên mạng thực tế** do cần 2 thiết bị di động vật lý có Camera/Mic và máy chủ TURN/STUN relay trên Internet.
> 2. **Chạm thẻ thông minh NFC (Độ hoàn thiện 70 - 75%):** Logic đọc/ghi Web NFC API (NDEFReader) và popup quét radar đã hoàn chỉnh. **Chưa thể test chạm thực tế thẻ vật lý NTAG213/215** trên máy tính bàn (thiết bị dev không có phần cứng NFC).
> 3. **Gạch nợ tự động VietQR (Độ hoàn thiện 70%):** Logic sinh mã QR chuẩn Napas 247 đã kiểm thử quét thành công trên các app ngân hàng thật. **Luồng webhook gạch nợ tự động và đối soát giao dịch thực tế** cần môi trường Sandbox ngân hàng hoặc tài khoản ngân hàng chính thức của CLB.

---

## 2. BẢNG TỔNG HỢP THEO PHÂN HỆ

| Mã | Phân Hệ Chức Năng | Số Tính Năng | Đã Hoàn Thành | Đang Hoàn Thiện | Độ Hoàn Thiện (%) |
|---|---|:---:|:---:|:---:|:---:|
`;

  modules.forEach((mod) => {
    const modTotal = mod.features.length;
    const modDone = mod.features.filter((f) => f.status === 'Đã hoàn thành').length;
    const modProg = mod.features.filter((f) => f.status === 'Đang thực hiện').length;
    const modAvgPct = Math.round(mod.features.reduce((s, f) => s + f.pct, 0) / modTotal);
    md += `| **${mod.moduleId}** | ${mod.moduleName} | ${modTotal} | ${modDone} | ${modProg} | **${modAvgPct}%** |\n`;
  });

  md += `\n---\n\n## 3. CHI TIẾT TỪNG TÍNH NĂNG, PHÂN TÁCH GIAO DIỆN & API MAP\n\n`;

  let mdStt = 1;
  modules.forEach((mod) => {
    md += `### ${mod.moduleId}: ${mod.moduleName}\n\n`;
    md += `| STT | Mã Task | Tên Chức Năng / Task | Người Thực Hiện | Mức Độ | Giao Diện (Màn Hình) | Tình Trạng GD | Hoàn Thiện GD | API Mapped | Tình Trạng API | Hoàn Thiện API | Ghi Chú |\n`;
    md += `|:---:|---|---|:---:|:---:|---|:---:|:---:|---|:---:|:---:|:---:|\n`;

    mod.features.forEach((f) => {
      const prio = normalizePriority(f.priority);
      const uiStatus = f.status === 'Đã hoàn thành' ? '✅ Hoàn thành' : '⏳ Đang làm';
      const apiStatus = f.status === 'Đã hoàn thành' ? '✅ Đã kết nối' : '⏳ Đang kết nối';
      md += `| ${mdStt++} | **${f.id}** | ${f.name} | Phạm Văn Vũ | **${prio}** | ${f.screen} | ${uiStatus} | **${f.pct}%** | \`${f.api}\` | ${apiStatus} | **${f.pct}%** |  |\n`;
    });
    md += `\n`;
  });

  const outMd = path.join(docsDir, 'TIEN_DO_CONG_VIEC_APP_HIEP_HOI_CHI_TIET.md');
  fs.writeFileSync(outMd, md, 'utf8');
  console.log(`✓ Generated Markdown Work Progress file -> ${outMd}`);
  console.log('=== WORK PROGRESS GENERATION COMPLETE! ===\n');
}

main().catch((err) => {
  console.error('Error generating work progress:', err);
  process.exit(1);
});
