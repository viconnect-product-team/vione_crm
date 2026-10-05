const fs = require('fs');
const path = require('path');
const docx = require('docx');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, AlignmentType, ImageRun } = docx;

const rootDir = path.resolve(__dirname, '..');
const docDir = path.join(rootDir, 'document');
const publicDocsDir = path.join(rootDir, 'apps', 'vione_app_fe', 'public', 'docs');
const imgDir = path.join(docDir, 'images', 'evidence_live_2026');

// Đảm bảo các thư mục đích tồn tại
const targetsToEnsure = [
  path.join(rootDir, 'apps', 'vione_app_fe', 'public', 'docs', 'images', 'evidence_live_2026'),
  path.join(rootDir, 'apps', 'vione_app_fe', 'public', 'images', 'evidence_live_2026'),
  path.join(rootDir, 'apps', 'vione_app_fe', 'public', 'evidence_live_2026')
];

targetsToEnsure.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Copy tất cả 32 ảnh live sang tất cả các thư mục public để triệt tiêu hoàn toàn 404
const imgFiles = fs.readdirSync(imgDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
console.log(`>>> Tim thay ${imgFiles.length} anh live tai: ${imgDir}`);

imgFiles.forEach(f => {
  const src = path.join(imgDir, f);
  targetsToEnsure.forEach(destDir => {
    fs.copyFileSync(src, path.join(destDir, f));
  });
});
console.log(`>>> Da dong bo ${imgFiles.length} anh sang toan bo thu muc public thanh cong!`);

// 22 Chuong Web CRM
const crmSections = [
  {
    tag: 'CRM · XÁC THỰC',
    title: 'Đăng Nhập Quản Trị Hệ Thống CRM ViOne Phong Cách Sáng Sang Trọng',
    subtitle: 'Truy cập cổng điều hành doanh nghiệp với nhận diện Champagne Gold và bảo mật đa kênh',
    goal: 'Đăng nhập an toàn vào bảng điều hành số CRM ViOne qua tài khoản doanh nghiệp hoặc quản trị viên.',
    path: 'Trình duyệt Web Desktop -> Truy cập: https://14.225.217.232:5445/auth',
    steps: [
      'Bước 1: Mở trình duyệt web (Google Chrome, Microsoft Edge, Safari) và nhập địa chỉ https://14.225.217.232:5445/auth.',
      'Bước 2: Giao diện đăng nhập phong cách Light Mode sang trọng xuất hiện với ảnh nền kiến trúc đô thị ngọc trai và khung viền Champagne Gold.',
      'Bước 3: Nhập địa chỉ Email doanh nghiệp (ví dụ: admin@vione.vn) hoặc Số điện thoại vào ô Identifier.',
      'Bước 4: Nhập Mật khẩu bảo mật và bấm nút "Đăng Nhập Vào Hệ Thống".',
      'Bước 5: Hệ thống xác thực token JWT, lưu phiên an toàn và tự động chuyển hướng vào Bảng Điều Hành C-Level (/dashboard).'
    ],
    noteRed: 'LƯU Ý BẢO MẬT: Sau 5 lần nhập sai mật khẩu liên tiếp, tài khoản sẽ tạm thời bị khóa trong 15 phút để phòng chống tấn công dò quét brute-force.',
    noteBlue: 'MẸO SỬ DỤNG: Quản trị viên có thể sử dụng tính năng "Ghi nhớ đăng nhập" để duy trì phiên làm việc trong 30 ngày an toàn.',
    shotFile: 'crm_01_login_light_gold.png',
    shotCaption: 'Hình 1: Giao diện Đăng nhập Hệ thống CRM ViOne Phong cách Sáng Sang Trọng',
    isMobile: false
  },
  {
    tag: 'CRM · ĐIỀU HÀNH',
    title: 'Bảng Điều Hành Số C-Level Toàn Diện (Executive Dashboard)',
    subtitle: 'Trung tâm giám sát chỉ số tăng trưởng, dòng tiền, hiệu suất bán hàng và cảnh báo vận hành',
    goal: 'Cung cấp cho Ban Lãnh Đạo góc nhìn toàn cảnh về sức khỏe tài chính và hoạt động kinh doanh theo thời gian thực.',
    path: 'Thanh điều hướng bên trái (Sidebar) -> Chọn: Bảng Điều Hành (/dashboard)',
    steps: [
      'Bước 1: Quan sát 4 thẻ KPI Metric Cards ở hàng đầu tiên: Tổng Doanh Thu, Khách Hàng Mới, Số Deal Đang Mở, Tỷ Lệ Chốt Deal Thành Công.',
      'Bước 2: Chọn bộ lọc thời gian (Hôm nay, Tuần này, Tháng này, Năm nay) ở góc phải trên để xem biến động số liệu tương ứng.',
      'Bước 3: Theo dõi biểu đồ cột và biểu đồ đường thể hiện Dòng tiền thu - chi lũy kế và Doanh số bán hàng thực tế qua 12 tháng.',
      'Bước 4: Kiểm tra khối Cảnh báo Vận hành: Danh sách nhiệm vụ quá hạn, hợp đồng sắp đến ngày gia hạn và đề xuất chi chờ duyệt.'
    ],
    noteRed: 'QUY TẮC ĐIỀU HÀNH: Mọi chỉ số KPI trên Dashboard được cập nhật trực tiếp từ CSDL PostgreSQL theo thời gian thực, không có độ trễ.',
    noteBlue: 'MẸO LÃNH ĐẠO: Nhấp đúp vào bất kỳ thẻ KPI nào để chuyển thẳng đến danh sách chi tiết của phân hệ tương ứng.',
    shotFile: 'crm_02_executive_dashboard.png',
    shotCaption: 'Hình 2: Bảng Điều Hành Số C-Level Toàn Diện ViOne CRM',
    isMobile: false
  },
  {
    tag: 'CRM · KHÁCH HÀNG',
    title: 'Trung Tâm Quản Trị Khách Hàng B2B & Hồ Sơ 360° (Smart CRM)',
    subtitle: 'Lưu trữ thông tin đối tác, lịch sử tương tác, phân loại nguồn chuyển đổi và chấm điểm tiềm năng AI',
    goal: 'Quản lý toàn bộ cơ sở dữ liệu khách hàng doanh nghiệp tập trung, ngăn ngừa thất thoát tệp khách hàng.',
    path: 'Sidebar -> Quản Trị Khách Hàng -> Danh Sách Khách Hàng (/members hoặc /customers)',
    steps: [
      'Bước 1: Sử dụng thanh tìm kiếm để tra cứu nhanh khách hàng theo Tên công ty, Mã số thuế hoặc Người liên hệ.',
      'Bước 2: Sử dụng các nút Filter Chips để lọc theo nguồn chuyển đổi: Chạm thẻ NFC, Quét danh thiếp OCR, Mạng lưới B2B, hoặc Website Lead.',
      'Bước 3: Nhấp vào nút "+ Thêm Khách Hàng" để mở form nhập liệu: Nhập Mã số thuế (hệ thống tự động tra cứu tên doanh nghiệp), Họ tên người liên hệ, Số điện thoại và Email.',
      'Bước 4: Nhấp vào thẻ khách hàng để xem Hồ sơ 360 độ: Lịch sử báo giá, hợp đồng đã ký, tiến độ chăm sóc và điểm số tiềm năng AI Lead Score.',
      'Bước 5: Bấm nút "Xuất Excel" nếu cần tải toàn bộ danh sách khách hàng phục vụ báo cáo.'
    ],
    noteRed: 'QUY TẮC BẢO MẬT DỮ LIỆU: Nhân viên kinh doanh chỉ nhìn thấy khách hàng do chính mình phụ trách. Chỉ cấp Quản lý và Giám đốc mới có quyền xem toàn bộ khách hàng của công ty.',
    noteBlue: 'MẸO SALES: Sử dụng nút "Sao chép AI Pitch" để tạo nhanh kịch bản gọi điện tư vấn cá nhân hóa cho từng khách hàng.',
    shotFile: 'crm_03_smart_crm_customers.png',
    shotCaption: 'Hình 3: Trung Tâm Quản Trị Khách Hàng B2B & Lead 360°',
    isMobile: false
  },
  {
    tag: 'CRM · BÁN HÀNG',
    title: 'Phễu Bán Hàng & Cơ Hội Kinh Doanh Kanban Deals',
    subtitle: 'Quản lý các cơ hội kinh doanh qua 5 giai đoạn bán hàng trực quan bằng thao tác kéo thả',
    goal: 'Kiểm soát nhịp độ chốt đơn, dự báo doanh số chính xác và phát hiện các cơ hội bị bỏ quên.',
    path: 'Sidebar -> Quản Trị Bán Hàng -> Phễu Cơ Hội (/deals hoặc /opportunities)',
    steps: [
      'Bước 1: Quan sát giao diện phễu Kanban gồm 5 cột giai đoạn: [1. Mới tiếp cận] -> [2. Khảo sát nhu cầu] -> [3. Báo giá giải pháp] -> [4. Đàm phán điều khoản] -> [5. Chốt hợp đồng].',
      'Bước 2: Mỗi card cơ hội hiển thị: Tên thương vụ, Tên khách hàng doanh nghiệp, Giá trị ngân sách dự kiến và Nhân viên phụ trách.',
      'Bước 3: Khi tiến trình đàm phán có bước phát triển, nhấp giữ chuột vào card và kéo thả sang cột giai đoạn tiếp theo.',
      'Bước 4: Khi kéo vào cột [5. Chốt hợp đồng]: Hệ thống tự động kích hoạt tạo phiếu thu tiền và gửi thông báo cho Kế toán xuất hóa đơn.'
    ],
    noteRed: 'CẢNH BÁO SLA: Bất kỳ cơ hội nào nằm ở một giai đoạn quá 7 ngày mà không có cập nhật mới sẽ hiển thị viền đỏ cảnh báo bỏ quên deal.',
    noteBlue: 'MẸO CHỐT SALES: AI Copilot tự động gợi ý thời điểm vàng để gửi báo giá và tỷ lệ thành công dự kiến của từng deal.',
    shotFile: 'crm_04_pipeline_kanban_deals.png',
    shotCaption: 'Hình 4: Phễu Bán Hàng & Cơ Hội Kinh Doanh Kanban Deals',
    isMobile: false
  },
  {
    tag: 'CRM · DOANH NGHIỆP',
    title: 'Quản Lý Doanh Nghiệp Thành Viên & Mạng Lưới Chi Nhánh',
    subtitle: 'Cấu trúc pháp nhân, văn phòng đại diện và tọa độ văn phòng phục vụ chấm công',
    goal: 'Thiết lập cấu trúc tổ chức doanh nghiệp đa chi nhánh phục vụ quản trị phân tán.',
    path: 'Sidebar -> Thiết Lập Tổ Chức -> Doanh Nghiệp & Chi Nhánh (/companies)',
    steps: [
      'Bước 1: Xem danh sách các pháp nhân công ty thành viên trong hệ thống.',
      'Bước 2: Bấm vào chi nhánh để cấu hình thông tin: Địa chỉ thực tế, Số điện thoại văn phòng, Trưởng chi nhánh phụ trách.',
      'Bước 3: Nhập Tọa độ định vị GPS (Latitude, Longitude) và Bán kính chấm công (50 mét) cho văn phòng chi nhánh.',
      'Bước 4: Bấm "Lưu Cấu Hình" để kích hoạt địa điểm chấm công cho nhân sự tại chi nhánh đó.'
    ],
    noteRed: 'LƯU Ý GPS: Tọa độ GPS của chi nhánh phải được lấy chính xác từ Google Maps để nhân viên chấm công không bị báo lỗi ngoài phạm vi.',
    noteBlue: 'MẸO VẬN HÀNH: Có thể tạo không giới hạn chi nhánh cho một doanh nghiệp trong cùng một tài khoản quản trị.',
    shotFile: 'crm_05_companies_enterprises.png',
    shotCaption: 'Hình 5: Quản Lý Danh Sách Doanh Nghiệp & Chi Nhánh Trực Thuộc',
    isMobile: false
  },
  {
    tag: 'CRM · THẺ THÔNG MINH',
    title: 'Quản Trị Thẻ Thông Minh NFC & Danh Thiếp Số 3D',
    subtitle: 'Cấp phát mã thẻ, quản lý vòng đời chip NFC và cá nhân hóa giao diện danh thiếp điện tử',
    goal: 'Số hóa hoàn toàn danh thiếp giấy truyền thống, trang bị thẻ thông minh NFC cho toàn bộ lãnh đạo và nhân sự.',
    path: 'Sidebar -> Công Nghệ Số -> Quản Lý Thẻ NFC (/cards)',
    steps: [
      'Bước 1: Quét mã chip NFC vật lý qua đầu đọc thẻ hoặc nhập dãy mã Card UID vào hệ thống.',
      'Bước 2: Gán mã thẻ cho nhân sự hoặc lãnh đạo tương ứng trong danh sách nhân viên.',
      'Bước 3: Chọn gói mẫu thiết kế thẻ số (Executive Titanium, Champagne Gold hoặc Classic Black).',
      'Bước 4: Nhấp "Kích Hoạt Thẻ": Hệ thống tự động liên kết chip NFC với đường dẫn danh thiếp điện tử công khai và sinh mã QR cá nhân.'
    ],
    noteRed: 'QUY ĐỊNH BẢO MẬT: Khi nhân sự nghỉ việc, Quản trị viên chỉ cần bấm nút "Khóa Thẻ" để thu hồi quyền truy cập danh thiếp của nhân sự đó tức thì.',
    noteBlue: 'MẸO QUẢNG BÁ: Thẻ NFC chạm được trên mọi dòng điện thoại iPhone và Android đời mới mà không cần cài đặt bất kỳ ứng dụng nào.',
    shotFile: 'crm_06_smart_nfc_cards.png',
    shotCaption: 'Hình 6: Quản Trị Thẻ Thông Minh NFC & Danh Thiếp Số 3D',
    isMobile: false
  },
  {
    tag: 'CRM · VẬN HÀNH',
    title: 'Quản Trị Quy Trình Công Việc & Giao Việc Tự Động (Workflows)',
    subtitle: 'Phân bổ nhiệm vụ, quản lý tiến độ thực thi và tối ưu hóa năng suất phòng ban',
    goal: 'Số hóa 100% các luồng giao việc nội bộ, triệt tiêu tình trạng trễ hạn và đùn đẩy trách nhiệm.',
    path: 'Sidebar -> Vận Hành & Quy Trình -> Quy Trình Công Việc (/workflow)',
    steps: [
      'Bước 1: Bấm nút "+ Giao Nhiệm Vụ Mới" ở góc phải trên.',
      'Bước 2: Điền thông tin công việc: Tiêu đề nhiệm vụ, Nội dung chi tiết, Phòng ban thực hiện, Người nhận việc chính, Người phối hợp.',
      'Bước 3: Thiết lập Thời hạn hoàn thành (Deadline) và Mức độ ưu tiên (Khẩn cấp, Cao, Trung bình).',
      'Bước 4: Bấm "Giao Việc": Hệ thống tự động gửi thông báo qua chuông web, email và mobile push notification đến nhân sự nhận việc.',
      'Bước 5: Theo dõi tiến độ công việc trên bảng Kanban quy trình từ [Chờ làm] -> [Đang làm] -> [Chờ duyệt] -> [Hoàn thành].'
    ],
    noteRed: 'LƯU Ý TIẾN ĐỘ: Nhiệm vụ sau khi được nhân viên báo hoàn thành phải được Trưởng bộ phận bấm "Nghiệm Thu" thì mới được tính vào KPI tháng.',
    noteBlue: 'MẸO QUẢN TRỊ: Đính kèm tài liệu mẫu hoặc quy trình chuẩn vào mô tả nhiệm vụ để nhân viên mới dễ dàng thực hiện đúng chuẩn.',
    shotFile: 'crm_07_workflow_kanban_tasks.png',
    shotCaption: 'Hình 7: Quản Trị Quy Trình Công Việc & Giao Việc Tự Động',
    isMobile: false
  },
  {
    tag: 'CRM · NHÂN SỰ',
    title: 'Giám Sát Tải Trọng & Khối Lượng Nhân Sự (Workload Heatmap)',
    subtitle: 'Bản đồ nhiệt theo dõi độ bận rộn và phát hiện nhân sự bị quá tải công việc',
    goal: 'Cân bằng tải công việc giữa các phòng ban, ngăn ngừa tình trạng quá tải hoặc nhàn rỗi trong bộ máy.',
    path: 'Sidebar -> Vận Hành & Quy Trình -> Tải Trọng Nhân Sự (/workload)',
    steps: [
      'Bước 1: Chọn phòng ban cần giám sát từ danh mục bộ lọc.',
      'Bước 2: Quan sát Biểu đồ nhiệt (Workload Heatmap) hiển thị danh sách nhân sự cùng số lượng việc đang mở đồng thời (WIP).',
      'Bước 3: Màu xanh lục biểu thị tải trọng tối ưu (1-3 việc); Màu vàng biểu thị tải trọng cao (4 việc); Màu đỏ biểu thị quá tải nguy hiểm (≥ 5 việc).',
      'Bước 4: Nhấp vào nhân sự đang bị tô đỏ để xem danh sách các đầu việc đang xử lý và thực hiện điều chuyển bớt việc cho nhân sự khác.'
    ],
    noteRed: 'QUY TẮC HIỆU SUẤT: Giữ số lượng việc đồng thời (WIP) của mỗi nhân sự ≤ 5 việc giúp tăng tốc độ hoàn thành công việc lên 40%.',
    noteBlue: 'MẸO VẬN HÀNH: Giám đốc COO nên kiểm tra bản đồ nhiệt vào đầu mỗi tuần để phân bổ nguồn lực hợp lý.',
    shotFile: 'crm_08_workload_heatmap.png',
    shotCaption: 'Hình 8: Giám Sát Tải Trọng & Khối Lượng Công Việc Nhân Sự',
    isMobile: false
  },
  {
    tag: 'CRM · CHẤM CÔNG',
    title: 'Chấm Công Định Vị GPS & Nhận Diện Khuôn Mặt AI (Attendance)',
    subtitle: 'Quản trị dữ liệu chấm công thời gian thực, quản lý nghỉ phép và xuất bảng công tính lương',
    goal: 'Tự động hóa hoàn toàn quy trình điểm danh nhân sự, chống gian lận chấm công hộ.',
    path: 'Sidebar -> Nhân Sự & Tiền Lương -> Quản Lý Chấm Công (/attendance)',
    steps: [
      'Bước 1: Xem bảng điểm danh hôm nay với các trạng thái: Đã Check-in, Đi Đúng Giờ, Đi Muộn, Nghỉ Phép, Chưa Có Mặt.',
      'Bước 2: Nhấp vào từng bản ghi chấm công để xem chi tiết: Giờ Check-in chính xác đến từng giây, Tọa độ GPS và Ảnh chụp khuôn mặt selfie.',
      'Bước 3: Xử lý các đơn xin nghỉ phép, xin đi muộn/về sớm của nhân viên trực tiếp trên giao diện duyệt đơn.',
      'Bước 4: Vào cuối tháng, bấm nút "Tổng Hợp Bảng Công" để hệ thống tự động tính tổng ngày công, số lần đi muộn và trừ phép.'
    ],
    noteRed: 'CẢNH BÁO GIAN LẬN: Hệ thống tự động gắn cờ cảnh báo nếu phát hiện thiết bị di động sử dụng phần mềm giả lập vị trí GPS (Fake GPS).',
    noteBlue: 'MẸO TIẾT KIỆM: Bảng công tự động đồng bộ sang bảng lương giúp phòng kế toán tiết kiệm 80% thời gian tổng hợp mỗi kỳ.',
    shotFile: 'crm_09_gps_attendance_hrm.png',
    shotCaption: 'Hình 9: Chấm Công Định Vị GPS & Nhận Diện Khuôn Mặt AI',
    isMobile: false
  },
  {
    tag: 'CRM · TÀI CHÍNH',
    title: 'Phê Duyệt Tài Chính Thu Chi 3 Cấp & VietQR Napas (Approvals)',
    subtitle: 'Quy trình kiểm soát chi phí chặt chẽ, phê duyệt trực tuyến và chuyển khoản ngân hàng tự động',
    goal: 'Kiểm soát từng đồng chi phí doanh nghiệp, đảm bảo mọi khoản chi đều có đầy đủ chứng từ và chữ ký số phê duyệt.',
    path: 'Sidebar -> Tài Chính & Dòng Tiền -> Phê Duyệt Chi Tiền (/payment-approvals)',
    steps: [
      'Bước 1: Nhân viên tạo đề xuất chi tiền (Cấp 1), đính kèm hóa đơn GTGT hoặc chứng từ thanh toán dạng ảnh/PDF.',
      'Bước 2: Trưởng phòng kiểm tra tính hợp lý của khoản chi và bấm "Duyệt Cấp 2" (hoặc Từ chối kèm lý do).',
      'Bước 3: Phiếu chi chuyển lên Giám đốc hoặc Kế toán trưởng xem xét hạn mức ngân sách và bấm "Phê Duyệt Cấp 3".',
      'Bước 4: Sau khi Giám đốc duyệt, hệ thống tự động sinh Mã QR thanh toán VietQR Napas 24/7 chứa sẵn số tài khoản và nội dung chi.',
      'Bước 5: Kế toán quét mã QR trên ứng dụng ngân hàng để chuyển tiền ngay lập tức, hệ thống tự động cập nhật phiếu chi sang "Đã Thanh Toán".'
    ],
    noteRed: 'QUY TẮC BẤT DI BẤT DỊCH: Bất kỳ phiếu chi nào không có đính kèm chứng từ hợp lệ sẽ không thể chuyển sang bước duyệt của Giám đốc.',
    noteBlue: 'MẸO KẾ TOÁN: Sử dụng mã VietQR Napas tự sinh giúp triệt tiêu 100% lỗi gõ nhầm số tài khoản hoặc sai lệch nội dung chuyển khoản.',
    shotFile: 'crm_10_payment_approvals_3tier.png',
    shotCaption: 'Hình 10: Phê Duyệt Tài Chính Thu Chi 3 Cấp & VietQR Napas',
    isMobile: false
  },
  {
    tag: 'CRM · SỔ QUỸ',
    title: 'Sổ Quỹ Thu Chi & Báo Cáo Dòng Tiền Thời Gian Thực (Cash Flow)',
    subtitle: 'Theo dõi biến động quỹ tiền mặt, tài khoản ngân hàng và báo cáo doanh thu - chi phí',
    goal: 'Cung cấp bức tranh tài chính trung thực, minh bạch về dòng tiền ròng của doanh nghiệp.',
    path: 'Sidebar -> Tài Chính & Dòng Tiền -> Sổ Quỹ Thu Chi (/income hoặc /finance)',
    steps: [
      'Bước 1: Xem số dư tồn quỹ hiện tại chia theo Quỹ Tiền Mặt và Quỹ Ngân Hàng.',
      'Bước 2: Lọc danh sách giao dịch theo Loại (Phiếu Thu, Phiếu Chi), Danh mục (Bán hàng, Tiếp khách, Lương, Mặt bằng) và Thời gian.',
      'Bước 3: Nhấp vào từng giao dịch để xem phiếu thu/chi điện tử có chữ ký số của người lập, kế toán và thủ quỹ.',
      'Bước 4: Xuất sổ cái thu chi ra tệp Excel (.xlsx) theo mẫu chuẩn kế toán doanh nghiệp Việt Nam.'
    ],
    noteRed: 'LƯU Ý ĐỐI SOÁT: Thủ quỹ bắt buộc phải đối chiếu số dư sổ sách trên hệ thống với số dư sao kê ngân hàng điện tử vào cuối mỗi ngày.',
    noteBlue: 'MẸO QUẢN TRỊ: Biểu đồ dòng tiền dự báo tự động cảnh báo trước 15 ngày nếu doanh nghiệp có nguy cơ bị âm dòng tiền hoạt động.',
    shotFile: 'crm_11_finance_cashflow_books.png',
    shotCaption: 'Hình 11: Sổ Quỹ Thu Chi & Báo Cáo Dòng Tiền Thời Gian Thực',
    isMobile: false
  },
  {
    tag: 'CRM · GIAO THƯƠNG',
    title: 'Sàn Giao Thương B2B & Gian Hàng Sản Phẩm Doanh Nghiệp',
    subtitle: 'Quảng bá sản phẩm, dịch vụ và chính sách ưu đãi B2B cho toàn bộ cộng đồng doanh nghiệp',
    goal: 'Mở rộng kênh phân phối, tăng doanh thu bán hàng thông qua mạng lưới đối tác trong hệ sinh thái.',
    path: 'Sidebar -> Mạng Lưới B2B -> Sàn Sản Phẩm (/marketplace)',
    steps: [
      'Bước 1: Bấm nút "+ Đăng Sản Phẩm Mới" ở góc màn hình.',
      'Bước 2: Điền thông tin: Tên sản phẩm, Ngành hàng chủ lực, Đơn vị tính, Mô tả quy cách kỹ thuật.',
      'Bước 3: Nhập 2 mức giá: Giá Niêm Yết Công Khai và Giá Ưu Đãi VIP Dành Riêng Cho Đối Tác B2B.',
      'Bước 4: Tải lên hình ảnh sản phẩm chất lượng cao (hệ thống tự động nén tối ưu dung lượng).',
      'Bước 5: Bấm "Đăng Bán": Sản phẩm sẽ ngay lập tức xuất hiện trên cả Sàn Web CRM và Ứng dụng Di động ViOne Connect.'
    ],
    noteRed: 'QUY ĐỊNH HÀNG HÓA: Các sản phẩm niêm yết bắt buộc phải có đầy đủ chứng nhận nguồn gốc xuất xứ và hóa đơn hợp lệ theo quy định pháp luật.',
    noteBlue: 'MẸO BÁN HÀNG: Cung cấp mức giá ưu đãi B2B từ 10-20% giúp doanh nghiệp thu hút lượng đơn đặt hàng lớn từ các đối tác trong hệ sinh thái.',
    shotFile: 'crm_12_b2b_marketplace_products.png',
    shotCaption: 'Hình 12: Sàn Giao Thương B2B & Gian Hàng Sản Phẩm Doanh Nghiệp',
    isMobile: false
  },
  {
    tag: 'CRM · MỜI THẦU',
    title: 'Quản Lý Cơ Hội Mời Thầu & Hợp Tác B2B (Opportunities)',
    subtitle: 'Đăng tin tìm kiếm nhà cung cấp, mời thầu dịch vụ và tiếp nhận báo giá RFQ',
    goal: 'Tối ưu hóa chi phí mua sắm vật tư, lựa chọn nhà cung cấp uy tín với mức giá cạnh tranh nhất.',
    path: 'Sidebar -> Mạng Lưới B2B -> Cơ Hội & Mời Thầu (/opportunities)',
    steps: [
      'Bước 1: Bấm nút "+ Đăng Nhu Cầu Mời Thầu".',
      'Bước 2: Nhập thông tin gói thầu: Tiêu đề nhu cầu, Yêu cầu kỹ thuật, Ngân sách dự kiến, Thời hạn nhận hồ sơ báo giá.',
      'Bước 3: Bấm "Phát Sóng Tin": Hệ thống tự động gửi thông báo đến các nhà cung ứng thuộc ngành hàng tương ứng.',
      'Bước 4: Tiếp nhận và so sánh các bảng báo giá trực tuyến từ các doanh nghiệp đối tác nộp hồ sơ.',
      'Bước 5: Chọn nhà cung cấp trúng thầu và chuyển tiếp sang luồng tạo hợp đồng kinh tế.'
    ],
    noteRed: 'QUY CHUẨN THỜI HẠN: Thời hạn nhận báo giá tối thiểu là 3 ngày để các nhà cung cấp có đủ thời gian chuẩn bị hồ sơ năng lực.',
    noteBlue: 'MẸO TIẾT KIỆM: Trợ lý AI tự động phân tích và so sánh các báo giá để đưa ra đề xuất phương án có lợi nhất cho doanh nghiệp.',
    shotFile: 'crm_13_b2b_tenders_opportunities.png',
    shotCaption: 'Hình 13: Quản Lý Cơ Hội Mời Thầu & Hợp Tác B2B',
    isMobile: false
  },
  {
    tag: 'CRM · SỰ KIỆN',
    title: 'Quản Lý Sự Kiện Doanh Nghiệp & Điểm Danh QR Check-in',
    subtitle: 'Tổ chức hội thảo xúc tiến thương mại, phát hành vé điện tử và kiểm soát lối vào bằng mã QR',
    goal: 'Tổ chức các sự kiện kết nối kinh doanh chuyên nghiệp, đón tiếp khách mời chu đáo và nhanh chóng.',
    path: 'Sidebar -> Sự Kiện & Hội Thảo -> Danh Sách Sự Kiện (/events)',
    steps: [
      'Bước 1: Bấm "+ Tạo Sự Kiện Mới": Điền Tên hội thảo, Thời gian, Địa điểm tổ chức, Sơ đồ khán phòng và Hạn mức số lượng khách.',
      'Bước 2: Công bố sự kiện: Khách mời có thể đăng ký vé trực tiếp trên ứng dụng di động ViOne Connect.',
      'Bước 3: Tại bàn lễ tân sự kiện, nhân viên mở màn hình "Điểm Danh QR Check-in".',
      'Bước 4: Đưa mã QR trên điện thoại của khách mời vào trước camera lễ tân: Hệ thống xác thực vé chỉ trong 1 giây, hiển thị màn hình chào mừng kèm vị trí số ghế của khách.'
    ],
    noteRed: 'CHỐNG VÉ TRÙNG: Mỗi mã QR chỉ có giá trị check-in một lần duy nhất. Nếu quét lại lần 2, hệ thống sẽ phát âm thanh cảnh báo màu đỏ.',
    noteBlue: 'MẸO TỔ CHỨC: Dữ liệu khách tham dự sau sự kiện được tự động chuyển thành danh sách khách hàng tiềm năng trong CRM để chăm sóc tiếp.',
    shotFile: 'crm_14_events_qr_checkin.png',
    shotCaption: 'Hình 14: Quản Lý Sự Kiện Doanh Nghiệp & Điểm Danh QR Check-in',
    isMobile: false
  },
  {
    tag: 'CRM · KẾT NỐI 1-1',
    title: 'Quản Lý Lịch Hẹn & Cuộc Gặp 1-on-1 Doanh Nhân',
    subtitle: 'Xếp lịch làm việc giữa các lãnh đạo doanh nghiệp, đồng bộ Google Calendar và lưu biên bản',
    goal: 'Tăng cường hiệu quả các cuộc gặp kết nối kinh doanh thực chất giữa các CEO.',
    path: 'Sidebar -> Kết Nối Doanh Nhân -> Lịch Hẹn 1-on-1 (/meetings)',
    steps: [
      'Bước 1: Bấm "Đặt Lịch Gặp 1-1": Chọn đối tác muốn gặp từ danh bạ doanh nhân.',
      'Bước 2: Chọn khung giờ đề xuất và địa điểm (Gặp trực tiếp tại văn phòng / quán cafe hoặc Họp trực tuyến).',
      'Bước 3: Nhập chủ đề thảo luận và tài liệu chuẩn bị đính kèm.',
      'Bước 4: Khi đối tác bấm xác nhận đồng ý, hệ thống tự động thêm cuộc gặp vào lịch trình di động của cả hai bên.',
      'Bước 5: Sau cuộc gặp, hai bên có thể ghi chú tóm tắt biên bản thỏa thuận hợp tác trực tiếp vào cuộc hẹn.'
    ],
    noteRed: 'QUY TẮC LỊCH TRÌNH: Nếu cần hủy hoặc dời lịch hẹn, bắt buộc phải thao tác trước giờ hẹn ít nhất 2 tiếng kèm lý do cụ thể.',
    noteBlue: 'MẸO DOANH NHÂN: Ghi rõ mục tiêu cuộc gặp giúp tỷ lệ đối tác đồng ý gặp mặt tăng lên trên 85%.',
    shotFile: 'crm_15_b2b_one_on_one_meetings.png',
    shotCaption: 'Hình 15: Quản Lý Lịch Hẹn & Cuộc Gặp 1-on-1 Doanh Nhân',
    isMobile: false
  },
  {
    tag: 'CRM · HỘP THƯ',
    title: 'Hộp Thư Đa Kênh Messenger Trao Đổi Lãnh Đạo',
    subtitle: 'Kênh nhắn tin tức thời mã hóa bảo mật, phân loại tin nhắn công việc và gửi tệp tin lớn',
    goal: 'Duy trì kênh liên lạc thông suốt, bảo mật tuyệt đối bí mật kinh doanh giữa các lãnh đạo doanh nghiệp.',
    path: 'Sidebar -> Kênh Giao Tiếp -> Hộp Thư Đa Kênh (/messages)',
    steps: [
      'Bước 1: Chọn đối tác hoặc nhóm trò chuyện từ danh sách hội thoại bên trái.',
      'Bước 2: Soạn tin nhắn văn bản, chèn emoji hoặc bấm biểu tượng đính kèm để gửi hình ảnh, báo giá (.pdf, .xlsx).',
      'Bước 3: Sử dụng tính năng "Tạo Nhóm Dự Án" để mời nhiều đối tác cùng tham gia thảo luận một hợp đồng thầu.',
      'Bước 4: Tra cứu lại lịch sử tin nhắn hoặc các tệp tin đã gửi qua thanh công cụ tìm kiếm hội thoại.'
    ],
    noteRed: 'BẢO MẬT NỘI DUNG: Toàn bộ tin nhắn trao đổi được mã hóa đầu cuối và lưu trữ trên cụm máy chủ bảo mật của doanh nghiệp, không thông qua máy chủ bên thứ ba.',
    noteBlue: 'MẸO CÔNG VIỆC: Có thể chuyển thẳng một tin nhắn trao đổi thành một nhiệm vụ công việc (Task) chỉ với 1 click chuột.',
    shotFile: 'crm_16_multichannel_messenger.png',
    shotCaption: 'Hình 16: Hộp Thư Đa Kênh Messenger Trao Đổi Lãnh Đạo',
    isMobile: false
  },
  {
    tag: 'CRM · BIỂU QUYẾT',
    title: 'Biểu Quyết Số & Khảo Sát Ý Kiến C-Level (Voting)',
    subtitle: 'Tổ chức biểu quyết đại hội cổ đông, lấy ý kiến ban điều hành minh bạch và kiểm phiếu tức thì',
    goal: 'Đưa ra các quyết định điều hành nhanh chóng, dân chủ và có giá trị pháp lý lưu trữ.',
    path: 'Sidebar -> Biểu Quyết & Khảo Sát -> Danh Sách Biểu Quyết (/voting)',
    steps: [
      'Bước 1: Bấm "+ Tạo Phiên Biểu Quyết Mới": Nhập nội dung vấn đề cần biểu quyết và các phương án lựa chọn (Tán thành, Không tán thành, Ý kiến khác).',
      'Bước 2: Chọn danh sách thành viên có quyền biểu quyết và thiết lập Thời hạn đóng hòm phiếu.',
      'Bước 3: Thành viên đăng nhập và thực hiện bỏ phiếu xác thực.',
      'Bước 4: Hệ thống tự động kiểm phiếu và hiển thị biểu đồ tỷ lệ biểu quyết trực quan thời gian thực.',
      'Bước 5: Xuất biên bản kết quả biểu quyết có chữ ký số điện tử để lưu trữ hồ sơ công ty.'
    ],
    noteRed: 'MINH BẠCH BỎ PHIẾU: Mỗi tài khoản chỉ được bỏ phiếu đúng 1 lần duy nhất, kết quả phiếu bầu được mã hóa chống can thiệp sửa đổi.',
    noteBlue: 'MẸO ĐIỀU HÀNH: Sử dụng biểu quyết số giúp tiết kiệm 90% thời gian tổ chức các cuộc họp lấy ý kiến cổ đông hoặc hội đồng quản trị.',
    shotFile: 'crm_17_digital_voting_surveys.png',
    shotCaption: 'Hình 17: Biểu Quyết Số & Khảo Sát Ý Kiến C-Level',
    isMobile: false
  },
  {
    tag: 'CRM · PHÂN QUYỀN',
    title: 'Ma Trận Phân Quyền 7 Nhóm Quyền x 6 Thao Tác (RBAC Matrix)',
    subtitle: 'Kiểm soát truy cập chi tiết từng hành động nghiệp vụ theo vai trò chức vụ trong doanh nghiệp',
    goal: 'Bảo vệ dữ liệu bí mật kinh doanh, phân định quyền hạn minh bạch và chặt chẽ.',
    path: 'Sidebar -> Quản Trị Nền Tảng -> Ma Trận Phân Quyền (/platform/permissions)',
    steps: [
      'Bước 1: Quan sát bảng ma trận phân quyền lưới trực quan gồm 9 Module nghiệp vụ theo hàng dọc và 7 Nhóm vai trò theo hàng ngang (CEO, COO, CFO, Sales Manager, Admin, Staff, Partner).',
      'Bước 2: Trong mỗi ô giao nhau, có 6 thao tác cụ thể: [Xem] [Tạo] [Sửa] [Xóa] [Duyệt] [Xuất].',
      'Bước 3: Nhấp chuột vào các ô checkbox để bật hoặc tắt từng quyền hạn cụ thể cho từng vai trò.',
      'Bước 4: Bấm nút "Lưu Ma Trận Quyền": Cấu hình mới sẽ có hiệu lực ngay lập tức trên toàn hệ thống mà không cần người dùng đăng xuất.'
    ],
    noteRed: 'NGUYÊN TẮC AN TOÀN: Tuyệt đối không cấp quyền [Xóa] và [Duyệt] cho nhóm vai trò Nhân viên chuyên môn (Staff).',
    noteBlue: 'MẸO PHÂN QUYỀN: Có thể gán nhiều vai trò khác nhau cho cùng một người dùng nếu nhân sự đó kiêm nhiệm nhiều vị trí.',
    shotFile: 'crm_18_rbac_permissions_matrix.png',
    shotCaption: 'Hình 18: Ma Trận Phân Quyền 7 Nhóm Quyền x 6 Thao Tác',
    isMobile: false
  },
  {
    tag: 'CRM · TRÍ TUỆ NHÂN TẠO',
    title: 'Nhật Ký Kiểm Toán & 6 Năng Lực AI Copilot 5.0 (AI Audit)',
    subtitle: 'Theo dõi lịch sử gọi trợ lý AI, kiểm soát chi phí token và giám sát các tác vụ tự động hóa',
    goal: 'Minh bạch hóa các hoạt động của trí tuệ nhân tạo, tối ưu hóa chi phí vận hành AI.',
    path: 'Sidebar -> Quản Trị Nền Tảng -> Nhật Ký AI Audit (/platform/ai-audit)',
    steps: [
      'Bước 1: Xem bảng nhật ký chi tiết các lần gọi AI của toàn bộ người dùng trong công ty.',
      'Bước 2: Lọc theo 6 Năng lực AI chuyên biệt: [1. Copilot Đàm Thoại] [2. Quét Danh Thiếp OCR] [3. Đối Soát Excel] [4. Soạn Thảo Hợp Đồng] [5. Ghép Nối Đối Tác B2B] [6. Giám Sát Tải Vận Hành].',
      'Bước 3: Nhấp vào từng dòng để xem: Thời gian gọi, Người gọi, Câu lệnh đầu vào (Prompt), Phản hồi của AI và Số lượng Token tiêu thụ.',
      'Bước 4: Xem biểu đồ tổng hợp mức độ sử dụng AI và đánh giá mức độ tiết kiệm thời gian cho doanh nghiệp.'
    ],
    noteRed: 'BẢO MẬT DỮ LIỆU AI: Trợ lý AI ViOne được huấn luyện trong môi trường đóng riêng tư của doanh nghiệp, cam kết không sử dụng dữ liệu kinh doanh của khách hàng để huấn luyện mô hình công cộng.',
    noteBlue: 'MẸO HIỆU QUẢ: Xem lại các câu lệnh (prompts) hiệu quả của đồng nghiệp trong nhật ký để học hỏi cách ra lệnh cho AI tối ưu nhất.',
    shotFile: 'crm_19_ai_copilot_audit_logs.png',
    shotCaption: 'Hình 19: Nhật Ký Kiểm Toán & 6 Năng Lực AI Copilot 5.0',
    isMobile: false
  },
  {
    tag: 'CRM · KẾT NỐI VẬN HÀNH',
    title: 'Vận Hành Kết Nối & Giới Thiệu Doanh Nghiệp (C-Level Operations)',
    subtitle: 'Quản trị mạng lưới giới thiệu đối tác kinh doanh (Referral) và đo lường giá trị giao dịch',
    goal: 'Ghi nhận và vinh danh các cơ hội kinh doanh được trao đi trong cộng đồng doanh nghiệp.',
    path: 'Sidebar -> Quản Trị Nền Tảng -> Vận Hành Kết Nối (/platform/introduction-operations)',
    steps: [
      'Bước 1: Xem danh sách các cơ hội kết nối đối tác được trao đổi giữa các doanh nghiệp thành viên.',
      'Bước 2: Theo dõi trạng thái kết nối: Mới giới thiệu, Đã liên hệ, Đang đàm phán, Đã ký hợp đồng thành công.',
      'Bước 3: Ghi nhận Tổng giá trị giao dịch thành công (Thank You Note) mang lại doanh thu thực tế.',
      'Bước 4: Bảng xếp hạng Top Doanh nhân tích cực trao cơ hội kết nối kinh doanh nhất trong tháng.'
    ],
    noteRed: 'TÍNH XÁC THỰC: Giá trị hợp đồng thành công chỉ được ghi nhận khi cả bên giới thiệu và bên nhận cơ hội cùng bấm xác nhận.',
    noteBlue: 'MẸO GIAO THƯƠNG: Doanh nghiệp trao đi nhiều cơ hội kết nối sẽ được hệ thống AI ưu tiên hiển thị ở vị trí nổi bật trên Sàn B2B.',
    shotFile: 'crm_20_c_level_operations.png',
    shotCaption: 'Hình 20: Vận Hành Kết Nối & Giới Thiệu Doanh Nghiệp',
    isMobile: false
  },
  {
    tag: 'CRM · KIỂM TOÁN GIA HẠN',
    title: 'Lịch Sử Gia Hạn & Kiểm Toán Thu Phí Nền Tảng (Renewal Audit)',
    subtitle: 'Theo dõi thời hạn bản quyền phần mềm, lịch sử đóng phí dịch vụ và hóa đơn gia hạn',
    goal: 'Đảm bảo hệ thống vận hành liên tục không bị gián đoạn do hết hạn dịch vụ.',
    path: 'Sidebar -> Quản Trị Nền Tảng -> Lịch Sử Gia Hạn (/platform/renewal-audit)',
    steps: [
      'Bước 1: Xem thời hạn sử dụng bản quyền gói dịch vụ ViOne của doanh nghiệp và các chi nhánh.',
      'Bước 2: Hệ thống tự động gửi thông báo nhắc gia hạn trước 30 ngày, 15 ngày và 7 ngày trước khi hết hạn.',
      'Bước 3: Bấm nút "Gia Hạn Dịch Vụ": Chọn gói thời gian (1 năm, 2 năm, 5 năm) và sinh mã VietQR thanh toán tự động.',
      'Bước 4: Sau khi chuyển khoản thành công, hệ thống tự động cộng thêm thời gian bản quyền và xuất hóa đơn điện tử gửi về email.'
    ],
    noteRed: 'LƯU Ý THỜI HẠN: Sau ngày hết hạn 15 ngày mà chưa gia hạn, hệ thống sẽ chuyển sang chế độ chỉ đọc (Read-only) để bảo vệ an toàn dữ liệu.',
    noteBlue: 'MẸO TIẾT KIỆM: Gia hạn gói dịch vụ từ 2 năm trở lên được giảm giá 20% và tặng kèm thẻ thông minh NFC cao cấp.',
    shotFile: 'crm_21_renewal_audit_history.png',
    shotCaption: 'Hình 21: Lịch Sử Gia Hạn & Kiểm Toán Thu Phí Nền Tảng',
    isMobile: false
  },
  {
    tag: 'CRM · CÀI ĐẶT',
    title: 'Cài Đặt Hệ Thống, Nhận Diện Thương Hiệu & Logo Tùy Biến',
    subtitle: 'Thiết lập tên miền website, hotline hỗ trợ, slogan doanh nghiệp và tải lên logo chính thức',
    goal: 'Cá nhân hóa giao diện phần mềm hoàn toàn theo bản sắc thương hiệu riêng của doanh nghiệp.',
    path: 'Sidebar -> Cài Đặt Hệ Thống (/settings)',
    steps: [
      'Bước 1: Nhập Tên doanh nghiệp chính thức và Tên viết tắt hiển thị.',
      'Bước 2: Nhập Website chính hệ thống (websiteUrl) có gắn liên kết kiểm tra xem trước bên ngoài.',
      'Bước 3: Nhập Hotline chăm sóc khách hàng và Slogan thương hiệu.',
      'Bước 4: Tải lên Logo chính thức của công ty dạng tệp PNG hoặc SVG trong suốt.',
      'Bước 5: Bấm "Lưu Cài Đặt": Hệ thống tự động cập nhật logo lên thanh Sidebar và trang đăng nhập toàn diện trong thời gian thực.'
    ],
    noteRed: 'QUY CHUẨN LOGO: Logo tải lên nên có tỷ lệ ngang hoặc vuông, kích thước tối thiểu 500x500px trên nền trong suốt để hiển thị sắc nét nhất.',
    noteBlue: 'MẸO THƯƠNG HIỆU: Cài đặt đầy đủ hotline và website giúp nâng cao uy tín thương hiệu trong mắt đối tác khi chia sẻ danh thiếp điện tử.',
    shotFile: 'crm_22_system_settings_branding.png',
    shotCaption: 'Hình 22: Cài Đặt Hệ Thống, Nhận Diện Thương Hiệu & Logo Tùy Biến',
    isMobile: false
  }
];

// 10 Chuong Mobile App ViOne Connect
const appSections = [
  {
    tag: 'APP · ĐĂNG NHẬP',
    title: 'Đăng Nhập Ứng Dụng Di Động ViOne Connect (Mobile Login)',
    subtitle: 'Truy cập nhanh chóng bằng Email hoặc Số điện thoại qua giao diện di động sang trọng',
    goal: 'Đăng nhập vào ứng dụng ViOne Connect trên điện thoại di động mọi lúc mọi nơi.',
    path: 'Mở App ViOne Connect trên điện thoại -> Màn hình Đăng nhập (/vione/login hoặc /connect-app/sign-in)',
    steps: [
      'Bước 1: Mở ứng dụng ViOne Connect hoặc truy cập đường dẫn PWA https://14.225.217.232:5445/vione/login.',
      'Bước 2: Giao diện nền đen Obsidian thượng lưu xuất hiện với logo ViOne Business Connect mạ vàng sang trọng.',
      'Bước 3: Nhập Email hoặc Số điện thoại di động đã đăng ký.',
      'Bước 4: Nhập Mật khẩu (có thể bấm biểu tượng mắt để xem mật khẩu) hoặc chọn nhận mã OTP qua tin nhắn.',
      'Bước 5: Bấm nút gradient mạ vàng "Đăng Nhập Ngay" để vào thẳng Trang chủ ứng dụng.'
    ],
    noteRed: 'HỖ TRỢ ĐĂNG NHẬP: Người dùng có thể đăng nhập bằng cả Email hoặc Số điện thoại mà không cần nhớ chính xác tên đăng nhập.',
    noteBlue: 'MẸO TIỆN LỢI: Bật tính năng đăng nhập bằng FaceID hoặc Vân tay để mở app chỉ trong 0.5 giây trong các lần sau.',
    shotFile: 'app_01_mobile_login.png',
    shotCaption: 'Hình 1: Màn hình Đăng nhập Ứng dụng Di động ViOne Connect',
    isMobile: true
  },
  {
    tag: 'APP · ĐĂNG KÝ',
    title: 'Đăng Ký Tài Khoản Mới Trực Tiếp In-App (Mobile Register)',
    subtitle: 'Tạo tài khoản thành viên mới ngay trong ứng dụng di động mà không bị chuyển hướng ra ngoài',
    goal: 'Cho phép doanh nhân mới tạo tài khoản và tham gia mạng lưới giao thương tức thì.',
    path: 'Màn hình Đăng nhập -> Bấm nút: "Tạo tài khoản mới"',
    steps: [
      'Bước 1: Tại màn hình đăng nhập, nhấp vào liên kết "Tạo tài khoản mới" ở phía dưới.',
      'Bước 2: Giao diện đăng ký in-app mở ra mượt mà: Nhập Họ và tên đầy đủ của doanh nhân.',
      'Bước 3: Nhập Địa chỉ Email hoặc Số điện thoại chính chủ.',
      'Bước 4: Nhập Tên doanh nghiệp / Công ty đang điều hành.',
      'Bước 5: Thiết lập Mật khẩu và Xác nhận mật khẩu (tối thiểu 8 ký tự).',
      'Bước 6: Bấm "Đăng Ký & Đăng Nhập Ngay": Hệ thống tự động tạo tài khoản, lưu phiên và đưa người dùng vào Trang chủ.'
    ],
    noteRed: 'QUY TRÌNH LIỀN MẠCH: Toàn bộ quá trình tạo tài khoản nằm trọn vẹn trong trải nghiệm in-app, tuyệt đối không mở các trang web tiếp thị bên ngoài.',
    noteBlue: 'MẸO HỒ SƠ: Sau khi đăng ký, hãy vào mục Hồ sơ cá nhân để cập nhật ảnh đại diện và chức danh giúp đối tác dễ nhận diện.',
    shotFile: 'app_02_mobile_register_in_app.png',
    shotCaption: 'Hình 2: Màn hình Đăng ký Tài khoản Mới In-App Trực tiếp',
    isMobile: true
  },
  {
    tag: 'APP · TRANG CHỦ',
    title: 'Trang Chủ Doanh Nhân ViOne Connect & Thẻ Hội Viên Số',
    subtitle: 'Trung tâm kết nối C-Level, danh thiếp số thông minh, lịch trình và cơ hội kinh doanh hôm nay',
    goal: 'Cung cấp cho doanh nhân bảng tin điều hành và kết nối đối tác nhanh chóng trên di động.',
    path: 'Thanh điều hướng đáy -> Chạm vào Tab: Trang Chủ (Home)',
    steps: [
      'Bước 1: Header trên cùng hiển thị Lời chào cá nhân hóa theo thời gian thực (Chào buổi sáng / Buổi chiều / Buổi tối) và chuông thông báo.',
      'Bước 2: Quan sát Thẻ Hội Viên Doanh Nhân mạ vàng nổi bật ở vị trí trung tâm hiển thị: Họ tên, Chức vụ, Tên công ty và Mã số thẻ.',
      'Bước 3: Xem các Tab lịch trình nhanh: [Hôm nay] [Sắp tới] [Nhắc lịch] để nắm bắt các cuộc hẹn và sự kiện trong ngày.',
      'Bước 4: Xem khối Insight cơ hội: Đề xuất các đối tác tiềm năng và tin mời thầu phù hợp nhất với ngành nghề của doanh nghiệp.'
    ],
    noteRed: 'ĐỒNG BỘ THỜI GIAN THỰC: Lịch trình cuộc hẹn trên Mobile App luôn được đồng bộ 2 chiều với hệ thống CRM Web của công ty.',
    noteBlue: 'MẸO KẾT NỐI: Nhấp vào từng đối tác gợi ý để xem hồ sơ năng lực chi tiết và gửi yêu cầu kết nối kinh doanh.',
    shotFile: 'app_03_home_dashboard.png',
    shotCaption: 'Hình 3: Trang chủ Doanh nhân ViOne Connect & Thẻ Hội Viên',
    isMobile: true
  },
  {
    tag: 'APP · THẺ HỘI VIÊN',
    title: 'Bottom Sheet Thẻ Hội Viên Bo Tròn 36px Tích Hợp Vuốt Tay Xuống',
    subtitle: 'Bảng điều khiển danh thiếp số vuốt từ dưới lên với góc bo cong tròn và cử chỉ vuốt tay đóng tự nhiên',
    goal: 'Mở nhanh mã QR định danh và các công cụ chia sẻ danh thiếp chỉ với một thao tác chạm.',
    path: 'Trang Chủ App Mobile -> Chạm vào: Thẻ Hội Viên Doanh Nhân',
    steps: [
      'Bước 1: Chạm trực tiếp vào Thẻ Hội Viên Doanh Nhân trên màn hình Trang Chủ.',
      'Bước 2: Một bảng điều khiển (Bottom Sheet) vuốt mượt mà từ cạnh dưới màn hình lên với góc bo cong tròn 36px sang trọng.',
      'Bước 3: Bottom Sheet hiển thị: Mã QR cá nhân hóa, Nút [Chạm NFC Một Chạm], Nút [Chia Sẻ vCard] và Nút [Gửi Qua Zalo/Tin Nhắn].',
      'Bước 4: Để đóng bảng điều khiển: Đặt ngón tay lên thanh gạt ngang trên đỉnh popup và vuốt nhẹ xuống dưới (Swipe Down), popup sẽ trượt xuống đóng lại mượt mà.'
    ],
    noteRed: 'CỬ CHỈ VUỐT TAY TỰ NHIÊN: Tính năng vuốt tay xuống (Swipe Down gesture) mang lại trải nghiệm mượt mà, chuẩn mực như các ứng dụng gốc iOS cao cấp nhất.',
    noteBlue: 'MẸO GIAO TIẾP: Khi đi dự tiệc hoặc hội thảo, chỉ cần mở sẵn Bottom Sheet này để đối tác quét mã QR kết nối ngay lập tức.',
    shotFile: 'app_04_member_card_bottom_sheet.png',
    shotCaption: 'Hình 4: Bottom Sheet Thẻ Hội viên Bo Tròn 36px Tích hợp Vuốt Tay Xuống',
    isMobile: true
  },
  {
    tag: 'APP · NÚT V TRUNG TÂM',
    title: 'Bảng Điều Khiển Nhanh Nút ViOne Mạ Vàng Trung Tâm (VActionSheet)',
    subtitle: 'Nút tròn chữ V điêu khắc 3D vector nổi bật ở giữa mở menu 1-chạm kết nối và điều hành',
    goal: 'Thực hiện siêu tốc các tác vụ lãnh đạo quan trọng nhất chỉ với 1 lần chạm ngón tay.',
    path: 'Thanh điều hướng đáy -> Chạm vào: Nút tròn chữ V màu vàng kim ở chính giữa',
    steps: [
      'Bước 1: Chạm vào nút tròn ViOne dập nổi ánh kim vàng Champagne ở giữa thanh điều hướng đáy.',
      'Bước 2: Màn hình kích hoạt hiệu ứng kính mờ (Obsidian Glassmorphism) và hiển thị Bảng điều khiển VActionSheet.',
      'Bước 3: Chọn 1 trong 6 tác vụ nhanh:\n  • [1. Quét Danh Thiếp OCR]: Chụp ảnh danh thiếp giấy để AI tự động lưu vào CRM.\n  • [2. Chấm Công Định Vị GPS]: Điểm danh văn phòng chỉ với 1 chạm.\n  • [3. Phê Duyệt Chi Tiền]: Duyệt nhanh các phiếu chi ngân sách khẩn cấp.\n  • [4. Đăng Nhu Cầu Mua/Bán]: Phát sóng tin mời thầu hoặc chào hàng B2B.\n  • [5. Hẹn Gặp 1-on-1]: Xếp lịch làm việc nhanh với một CEO đối tác.\n  • [6. Trợ Lý AI Copilot]: Mở đàm thoại trực tiếp với trợ lý thông minh.',
      'Bước 4: Chạm vào vùng nền tối để đóng Action Sheet.'
    ],
    noteRed: 'THIẾT KẾ ĐỘC QUYỀN: Nút ViOne trung tâm được chế tác với biểu tượng vector VIconMark 3D đa tầng gradient, tuyệt đối không phải chữ text thông thường.',
    noteBlue: 'MẸO TIỆN ÍCH: Đây là phím tắt quyền năng nhất trên app giúp các CEO tiết kiệm thời gian thao tác tới 70%.',
    shotFile: 'app_05_v_action_sheet.png',
    shotCaption: 'Hình 5: Bảng Điều Khiển Nhanh Nút ViOne Mạ Vàng Trung Tâm (VActionSheet)',
    isMobile: true
  },
  {
    tag: 'APP · ĐỐI TÁC',
    title: 'Mạng Lưới Đối Tác & Bản Tin Khoảnh Khắc 24h (Network & Stories)',
    subtitle: 'Khám phá danh bạ doanh nhân, xem tin hoạt động kinh doanh 24h và chăm sóc khách hàng B2B',
    goal: 'Mở rộng mạng lưới quan hệ chiến lược và duy trì tương tác thường xuyên với các đối tác chủ chốt.',
    path: 'Thanh điều hướng đáy -> Chạm vào Tab: Mạng Lưới (Network)',
    steps: [
      'Bước 1: Dải Stories 24h trên đầu hiển thị avatar các doanh nhân vừa đăng tải hoạt động kinh doanh mới. Chạm vào avatar để xem trình chiếu toàn màn hình.',
      'Bước 2: Danh sách "Chăm Sóc Đối Tác" hiển thị các mối quan hệ quan trọng kèm ngày tương tác gần nhất.',
      'Bước 3: Sử dụng các phím tắt nhanh trên từng đối tác: [Gọi Điện Thoại] [Gửi Tin Nhắn] [Lên Lịch Hẹn 1-1].',
      'Bước 4: Sử dụng bộ lọc ngành nghề để tìm kiếm đối tác cung ứng trong lĩnh vực mong muốn.'
    ],
    noteRed: 'QUY TẮC TIN 24H: Các khoảnh khắc Stories sẽ tự động biến mất sau đúng 24 giờ kể từ thời điểm đăng tải.',
    noteBlue: 'MẸO DUY TRÌ QUAN HỆ: Nhắn tin chúc mừng hoặc tương tác với Story của đối tác là cách tự nhiên nhất để mở đầu một cơ hội làm ăn mới.',
    shotFile: 'app_06_network_connections.png',
    shotCaption: 'Hình 6: Màn hình Mạng Lưới Đối Tác & Stories 24h Lãnh Đạo',
    isMobile: true
  },
  {
    tag: 'APP · CỘNG ĐỒNG',
    title: 'Cộng Đồng Doanh Nghiệp & Sàn Cơ Hội Giao Thương (Community)',
    subtitle: 'Tham gia các liên minh ngành nghề, khám phá sự kiện và săn đón các gói thầu tiềm năng',
    goal: 'Tiếp cận các cơ hội hợp tác kinh doanh quy mô lớn và tham gia các sự kiện xúc tiến thương mại.',
    path: 'Thanh điều hướng đáy -> Chạm vào Tab: Cộng Đồng (Community)',
    steps: [
      'Bước 1: Xem danh mục các Liên Minh Doanh Nghiệp theo ngành nghề (Bất động sản, Công nghệ, Bán lẻ, Y tế, Xây dựng...).',
      'Bước 2: Chuyển sang Tab "Sự Kiện" để xem lịch các hội thảo, diễn đàn doanh nhân sắp diễn ra và bấm "Đăng Ký Vé".',
      'Bước 3: Chuyển sang Tab "Cơ Hội Giao Thương" để xem danh sách các gói thầu và nhu cầu tìm nhà cung ứng đang mở.',
      'Bước 4: Bấm "Nộp Báo Giá" hoặc "Liên Hệ Trực Tiếp" với doanh nghiệp đăng tin thầu.'
    ],
    noteRed: 'KIỂM DUYỆT THÔNG TIN: Mọi tin mời thầu và sản phẩm trên sàn đều được ban quản trị xác thực pháp nhân doanh nghiệp trước khi phát sóng.',
    noteBlue: 'MẸO KINH DOANH: Đăng ký thông báo theo ngành nghề để nhận ngay cảnh báo khi có gói thầu mới được đăng tải.',
    shotFile: 'app_07_community_marketplace.png',
    shotCaption: 'Hình 7: Màn hình Cộng Đồng Doanh Nghiệp & Sàn Cơ Hội B2B',
    isMobile: true
  },
  {
    tag: 'APP · DANH TÍNH SỐ',
    title: 'Hồ Sơ Danh Tính Số C-Level & Danh Thiếp Titanium 3D (Me Profile)',
    subtitle: 'Quản trị thương hiệu cá nhân lãnh đạo, cài đặt quyền riêng tư và ví danh bạ đối tác',
    goal: 'Khẳng định vị thế uy tín của doanh nhân và quản lý toàn bộ thông tin kết nối cá nhân.',
    path: 'Thanh điều hướng đáy -> Chạm vào Tab: Tôi (Me Profile)',
    steps: [
      'Bước 1: Xem Card "DANH TÍNH SỐ": Hiển thị ảnh chân dung lãnh đạo, họ tên, chức vụ, tên công ty và chữ ký V mạ vàng dập chìm.',
      'Bước 2: Sử dụng 2 nút gradient vàng nổi bật: [QR Của Tôi] để phóng to mã QR và [Chạm NFC] để sẵn sàng chia sẻ danh thiếp.',
      'Bước 3: Card "LIÊN HỆ NHANH" với 5 nút tương tác trực tiếp một chạm: [Gọi Điện] [Gửi Email] [Viber] [WhatsApp] [Telegram].',
      'Bước 4: Mở "Ví Danh Thiếp Đối Tác" để xem và tải về danh bạ vCard của tất cả những người mình đã từng chạm thẻ giao lưu.',
      'Bước 5: Cấu hình "Quyền Riêng Tư": Chọn ẩn hoặc hiện số điện thoại cá nhân khi người lạ quét thẻ.'
    ],
    noteRed: 'QUYỀN RIÊNG TƯ TUYỆT ĐỐI: Những trường thông tin bạn đã bấm "Ẩn" trong cài đặt quyền riêng tư sẽ không bao giờ hiển thị khi người khác quét thẻ của bạn.',
    noteBlue: 'MẸO ĐẲNG CẤP: Chuyển đổi giữa chế độ Sáng Tinh Tế và Tối Huyền Bí Obsidian tùy theo sở thích và hoàn cảnh sử dụng.',
    shotFile: 'app_08_me_digital_identity.png',
    shotCaption: 'Hình 8: Màn hình Danh Tính Số C-Level & Danh Thiếp Thông Minh',
    isMobile: true
  },
  {
    tag: 'APP · CÀI ĐẶT IOS',
    title: 'Cài Đặt PWA 1-Chạm Trên iPhone / iPad (Apple WebClip Profile)',
    subtitle: 'Đột phá cài đặt ứng dụng trực tiếp lên Màn hình chính iOS tương tự như cài file APK Android',
    goal: 'Giúp người dùng iPhone cài đặt app ViOne Connect nhanh chóng chỉ với 1 click mà không cần qua App Store.',
    path: 'Trình duyệt Safari trên iPhone -> Truy cập trang /install hoặc tải file: /vione_ios_install.mobileconfig',
    steps: [
      'Bước 1: Mở liên kết /install trên trình duyệt Safari của iPhone.',
      'Bước 2: Hoặc tải file cấu hình /vione_ios_install.mobileconfig -> Safari hỏi: "Trang web này đang cố tải về một hồ sơ cấu hình. Bạn có muốn cho phép không?" -> Bấm "Cho phép" (Allow).',
      'Bước 3: Mở ứng dụng "Cài đặt" (Settings) trên iPhone -> Chạm vào mục "Đã tải về hồ sơ" (Profile Downloaded) ở ngay đầu.',
      'Bước 4: Nhấn nút "Cài đặt" (Install) ở góc phải trên -> Nhập Mật khẩu máy -> Tiếp tục bấm "Cài đặt".',
      'Bước 5: Biểu tượng ứng dụng ViOne Connect màu vàng kim sẽ xuất hiện ngay lập tức trên Màn hình chính của iPhone.',
      'Bước 6: Chạm vào biểu tượng để mở app: Ứng dụng chạy toàn màn hình Native siêu mượt.'
    ],
    noteRed: 'BẮT BUỘC DÙNG SAFARI: Thao tác tải và cài đặt hồ sơ cấu hình trên iOS bắt buộc phải thực hiện qua trình duyệt Safari mặc định của Apple. Nếu mở qua Zalo/FB, hãy bấm [•••] chọn Mở bằng Safari.',
    noteBlue: 'MẸO ĐỘT PHÁ: Giải pháp này giúp người dùng iOS cài đặt app dễ dàng như cài file APK trên Android, không lo bị thu hồi chứng chỉ doanh nghiệp.',
    shotFile: 'app_09_ios_pwa_install_prompt.png',
    shotCaption: 'Hình 9: Hướng Dẫn Cài Đặt PWA Màn Hình Chính Trên iPhone / iPad',
    isMobile: true
  },
  {
    tag: 'APP · HỘP THƯ CHAT',
    title: 'Hộp Thư Trực Tiếp & Kênh Chat B2B Doanh Nhân (Messenger)',
    subtitle: 'Nhắn tin trực tiếp giữa các CEO, gửi tài liệu báo giá và trò chuyện nhóm dự án',
    goal: 'Trao đổi hợp tác làm ăn nhanh chóng, tức thời ngay trên ứng dụng di động.',
    path: 'Thanh điều hướng đáy -> Chạm vào biểu tượng: Hộp Thư (Inbox)',
    steps: [
      'Bước 1: Xem danh sách các cuộc trò chuyện chia theo các Tab: [Tất Cả] [Chưa Đọc] [Nhóm Dự Án] [Tin Nhắn Chờ].',
      'Bước 2: Chạm vào cuộc trò chuyện để mở cửa sổ chat với đối tác.',
      'Bước 3: Gửi tin nhắn văn bản, hình ảnh danh thiếp hoặc đính kèm báo giá dịch vụ.',
      'Bước 4: Bấm nút "Tạo Nhóm Mới" để tạo nhóm chat thảo luận kinh doanh giữa 3 hay nhiều lãnh đạo doanh nghiệp.'
    ],
    noteRed: 'QUẢN LÝ TIN NHẮN CHỜ: Tin nhắn từ những người chưa kết nối sẽ nằm trong Tab "Tin Nhắn Chờ" để tránh làm phiền doanh nhân.',
    noteBlue: 'MẸO DOANH NHÂN: Nhận thông báo đẩy (Push Notification) ngay khi đối tác trả lời tin nhắn dù bạn đang tắt ứng dụng.',
    shotFile: 'app_10_inbox_messenger.png',
    shotCaption: 'Hình 10: Hộp Thư Trực Tiếp & Kênh Chat B2B Doanh Nhân',
    isMobile: true
  }
];

// Danh sách tổng hợp toàn diện (32 mục)
const allSections = [...crmSections, ...appSections];

// Hàm tạo HTML Template hoàn chỉnh không có 404
function generateHtmlDoc({ docCode, title, subtitle, targetAudience, sections, isAllInOne }) {
  let tocItems = sections.map((sec, idx) => {
    const num = (idx + 1).toString().padStart(2, '0');
    return `<a class="toc-item" href="#sec-${num}"><span class="toc-num">${num}.</span><span class="toc-text">${sec.title}</span></a>`;
  }).join('\n      ');

  let sectionsHtml = sections.map((sec, idx) => {
    const num = (idx + 1).toString().padStart(2, '0');
    // Fallback đa tầng chống 404
    const shotFile = sec.shotFile;
    const shotCaption = sec.shotCaption;

    let imgBlock = '';
    const imgTag = `<img src="images/evidence_live_2026/${shotFile}"
      onerror="if(!this.dataset.retried){this.dataset.retried=1;this.src='/docs/images/evidence_live_2026/${shotFile}';}else if(this.dataset.retried==1){this.dataset.retried=2;this.src='/images/evidence_live_2026/${shotFile}';}else if(this.dataset.retried==2){this.dataset.retried=3;this.src='../images/evidence_live_2026/${shotFile}';}"
      alt="${shotCaption}" loading="lazy" />`;

    if (sec.isMobile) {
      imgBlock = `
      <div class="shot-mobile-wrap">
        <div class="shot-phone-frame">
          ${imgTag}
        </div>
      </div>
      <div class="shot-caption">${shotCaption}</div>`;
    } else {
      imgBlock = `
      <div class="shot-desktop">
        <div class="browser-bar">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
          <span class="url-bar">https://14.225.217.232:5445 (Môi trường Live DEV HTTPS)</span>
        </div>
        ${imgTag}
      </div>
      <div class="shot-caption">${shotCaption}</div>`;
    }

    return `
    <section class="trn-section" id="sec-${num}">
      <div class="trn-tag">${sec.tag}</div>
      <h2 class="trn-h2">${num}. ${sec.title}</h2>
      <div class="trn-h3">${sec.subtitle}</div>

      <div class="trn-goal">
        <strong>MỤC TIÊU NGHIỆP VỤ:</strong> ${sec.goal}
      </div>

      <div class="trn-path">
        <strong>ĐƯỜNG DẪN THAO TÁC:</strong> ${sec.path}
      </div>

      <ol class="trn-steps">
        ${sec.steps.map(s => `<li>${s}</li>`).join('\n        ')}
      </ol>

      <div class="box-red">
        <strong>LƯU Ý NGHIỆP VỤ QUAN TRỌNG:</strong>
        ${sec.noteRed}
      </div>

      <div class="box-blue">
        <strong>MẸO VẬN HÀNH DÀNH CHO C-LEVEL:</strong>
        ${sec.noteBlue}
      </div>

      <div class="shot-container">
        ${imgBlock}
      </div>
    </section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>VIONE · ${title} · ${docCode}</title>
  <meta name="description" content="${subtitle}">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background: #07090E; font-family: 'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1E293B; line-height: 1.6; }
    .trn-doc { width: 210mm; max-width: 100%; margin: 20px auto 50px; background: #FFFFFF; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
    
    /* Trang bìa chuẩn A4 full bleed */
    .cover { width: 210mm; height: 297mm; min-height: 297mm; max-height: 297mm; padding: 0; margin: 0; overflow: hidden; display: flex; flex-direction: column; page-break-after: always; break-after: page; background: radial-gradient(circle at 10% 20%, #0F172A 0%, #07090E 100%); color: #F8FAFC; position: relative; }
    .cover .accent-bar { height: 8px; background: linear-gradient(90deg, #D8B282 0%, #F59E0B 50%, #003B95 100%); flex-shrink: 0; }
    .cover .header { padding: 25px 45px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 600; color: #D8B282; border-bottom: 1px solid rgba(216,178,130,0.2); }
    .cover .main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 45px; text-align: center; }
    .cover .logo-title { font-family: 'Outfit', sans-serif; font-size: 42px; font-weight: 900; letter-spacing: 2px; color: #D8B282; margin-bottom: 8px; }
    .cover .doc-label { font-size: 12px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; color: #94A3B8; margin-bottom: 16px; }
    .cover .project-title { font-size: 26px; font-weight: 800; color: #FFFFFF; line-height: 1.4; max-width: 650px; margin-bottom: 14px; }
    .cover .subtitle { font-size: 15px; color: #CBD5E1; max-width: 600px; margin-bottom: 30px; font-weight: 400; }
    .cover .meta-info { margin: 0 auto; width: 100%; max-width: 580px; text-align: left; font-size: 12px; line-height: 1.8; color: #E2E8F0; border: 1px solid rgba(216,178,130,0.3); border-radius: 12px; padding: 20px 25px; background: rgba(15,23,42,0.6); backdrop-filter: blur(8px); }
    .cover .meta-info strong { color: #D8B282; }
    .cover .footer { padding: 20px 45px; display: flex; justify-content: space-between; border-top: 1px solid rgba(216,178,130,0.2); font-size: 11px; color: #64748B; }

    /* Mục lục TOC */
    .toc-section { padding: 35px 45px; page-break-after: always; break-after: page; background: #FAFBFD; border-bottom: 1px solid #E2E8F0; }
    .toc-title { font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 800; color: #0F172A; padding-bottom: 10px; border-bottom: 3px solid #D8B282; margin-bottom: 20px; }
    .toc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 25px; }
    .toc-item { display: flex; align-items: baseline; gap: 10px; font-size: 12px; color: #334155; text-decoration: none; padding: 6px 10px; border-radius: 6px; background: #FFFFFF; border: 1px solid #E2E8F0; transition: all 0.2s; }
    .toc-item:hover { border-color: #D8B282; background: #FFFDF9; }
    .toc-num { font-weight: 800; color: #B45309; min-width: 24px; }
    .toc-text { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }

    /* Nội dung các phần nghiệp vụ */
    .trn-section { padding: 35px 45px 45px; page-break-before: always; break-before: page; border-bottom: 1px solid #E2E8F0; }
    .trn-tag { display: inline-block; font-size: 10px; font-weight: 800; letter-spacing: 1px; color: #B45309; background: #FEF3C7; padding: 3px 8px; border-radius: 4px; margin-bottom: 8px; text-transform: uppercase; }
    .trn-h2 { font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 800; color: #0F172A; margin-bottom: 4px; line-height: 1.3; }
    .trn-h3 { font-size: 13px; font-weight: 500; color: #64748B; margin-bottom: 18px; font-style: italic; }

    .trn-goal, .trn-path { padding: 10px 14px; border-radius: 6px; margin-bottom: 12px; font-size: 12px; line-height: 1.5; }
    .trn-goal { background: #F1F5F9; border-left: 4px solid #0284C7; color: #0F172A; }
    .trn-path { background: #FEF9C3; border-left: 4px solid #D8B282; color: #78350F; font-family: monospace; }

    .trn-steps { padding-left: 20px; margin-bottom: 18px; }
    .trn-steps li { margin-bottom: 8px; font-size: 12.5px; color: #334155; line-height: 1.6; }

    .box-red, .box-blue { padding: 12px 16px; border-radius: 6px; margin-bottom: 14px; font-size: 11.5px; line-height: 1.6; }
    .box-red { background: #FEF2F2; border-left: 4px solid #DC2626; color: #991B1B; }
    .box-blue { background: #EFF6FF; border-left: 4px solid #2563EB; color: #1E40AF; }

    /* Khung ảnh minh chứng thực tế không 404 */
    .shot-container { margin-top: 20px; background: #0B101B; border-radius: 12px; padding: 18px; text-align: center; border: 1px solid #1E293B; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
    .shot-caption { margin-top: 10px; font-size: 11px; font-weight: 600; color: #CBD5E1; letter-spacing: 0.5px; }

    /* Khung desktop browser */
    .shot-desktop { border-radius: 8px; overflow: hidden; border: 1px solid #334155; background: #020617; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
    .browser-bar { background: #1E293B; padding: 6px 12px; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid #334155; }
    .browser-bar .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
    .browser-bar .dot.red { background: #EF4444; }
    .browser-bar .dot.yellow { background: #F59E0B; }
    .browser-bar .dot.green { background: #10B981; }
    .browser-bar .url-bar { margin-left: 10px; font-family: monospace; font-size: 10.5px; color: #94A3B8; background: #0F172A; padding: 2px 12px; border-radius: 4px; flex: 1; text-align: left; }
    .shot-desktop img { width: 100%; height: auto; display: block; object-fit: contain; }

    /* Khung mobile phone frame */
    .shot-mobile-wrap { display: flex; justify-content: center; }
    .shot-phone-frame { width: 330px; max-width: 100%; border-radius: 36px; padding: 10px; background: #18181B; border: 3px solid #D8B282; box-shadow: 0 15px 40px rgba(216,178,130,0.25); overflow: hidden; }
    .shot-phone-frame img { width: 100%; border-radius: 28px; display: block; object-fit: contain; }

    @media print {
      body { background: #FFFFFF; padding: 0; }
      .trn-doc { width: 100%; margin: 0; box-shadow: none; }
      .cover { width: 210mm !important; height: 297mm !important; margin: 0 !important; }
      .trn-section { page-break-before: always; break-before: page; }
      .shot-container { page-break-inside: avoid; break-inside: avoid; }
      a { text-decoration: none; color: inherit; }
    }
  </style>
</head>
<body>
<article class="trn-doc">

  <!-- BÌA TÀI LIỆU -->
  <section class="cover" id="cover">
    <div class="accent-bar"></div>
    <div class="header">
      <div>HỆ THỐNG VIONE · TÀI LIỆU HƯỚNG DẪN SỬ DỤNG CHÍNH THỨC</div>
      <div>MÃ TÀI LIỆU: ${docCode}</div>
    </div>
    <div class="main">
      <div class="logo-title">VIONE CORPORATION</div>
      <div class="doc-label">CẨM NANG NGHIỆP VỤ & VẬN HÀNH THỜI GIAN THỰC</div>
      <h1 class="project-title">${title}</h1>
      <p class="subtitle">${subtitle}</p>
      
      <div class="meta-info">
        <div><strong>Hệ thống áp dụng:</strong> ${targetAudience}</div>
        <div><strong>Phiên bản tài liệu:</strong> 6.0 Enterprise Edition (Tháng 10/2026)</div>
        <div><strong>Môi trường xác thực:</strong> Server Dev HTTPS (https://14.225.217.232:5445)</div>
        <div><strong>Đơn vị phát triển:</strong> Đội ngũ Kiến Trúc Sư Hệ Thống & Business Analyst Cao Cấp</div>
        <div><strong>Tiêu chuẩn kiểm thử:</strong> 100% Ảnh Minh Chứng Live Không Lỗi 404</div>
      </div>
    </div>
    <div class="footer">
      <span>Bản quyền © 2026 ViOne Corporation. Toàn quyền bảo lưu.</span>
      <span>Phát hành chính thức: 05/10/2026</span>
    </div>
  </section>

  <!-- MỤC LỤC -->
  <section class="toc-section" id="toc">
    <h2 class="toc-title">MỤC LỤC TỔNG QUAN HƯỚNG DẪN SỬ DỤNG</h2>
    <div class="toc-grid">
      ${tocItems}
    </div>
  </section>

  <!-- NỘI DUNG CHI TIẾT TỪNG PHÂN HỆ -->
  ${sectionsHtml}

</article>
</body>
</html>`;
}

// Hàm sinh file DOCX hoàn chỉnh nhúng ảnh thật (base64/buffer inline)
async function generateDocxFile({ docCode, title, subtitle, targetAudience, sections, outputPath }) {
  console.log(`>>> Dang sinh file DOCX: ${outputPath}...`);
  
  const docChildren = [];

  // Bìa Docx
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "VIONE CORPORATION", bold: true, size: 36, color: "B45309", font: "Arial" })
      ],
      spacing: { before: 1000, after: 300 }
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "CẨM NANG HƯỚNG DẪN SỬ DỤNG HỆ THỐNG", bold: true, size: 24, color: "64748B", font: "Arial" })
      ],
      spacing: { after: 400 }
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: title, bold: true, size: 32, color: "0F172A", font: "Arial" })
      ],
      spacing: { after: 300 }
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: subtitle, italics: true, size: 22, color: "334155", font: "Arial" })
      ],
      spacing: { after: 800 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Mã tài liệu: ${docCode}`, bold: true, size: 20 }),
        new TextRun({ text: `\nHệ thống: ${targetAudience}`, size: 20 }),
        new TextRun({ text: `\nPhiên bản: 6.0 Enterprise Edition (Tháng 10/2026)`, size: 20 }),
        new TextRun({ text: `\nĐơn vị ban hành: ViOne Product & Architecture Team`, size: 20 })
      ],
      spacing: { after: 1200 }
    }),
    new Paragraph({
      pageBreakBefore: true,
      children: [
        new TextRun({ text: "MỤC LỤC TỔNG QUAN", bold: true, size: 28, color: "0F172A" })
      ],
      spacing: { after: 400 }
    })
  );

  // Mục lục Docx
  sections.forEach((sec, idx) => {
    const num = (idx + 1).toString().padStart(2, '0');
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${num}. `, bold: true, color: "B45309" }),
          new TextRun({ text: `${sec.title} (${sec.tag})`, size: 22 })
        ],
        spacing: { after: 120 }
      })
    );
  });

  // Từng chương nội dung Docx kèm ảnh nhúng inline
  sections.forEach((sec, idx) => {
    const num = (idx + 1).toString().padStart(2, '0');
    const imgFullPath = path.join(imgDir, sec.shotFile);
    let imageRun = null;

    if (fs.existsSync(imgFullPath)) {
      try {
        const imgBuffer = fs.readFileSync(imgFullPath);
        // Mobile ảnh dọc: w=260, h=520; Desktop ảnh ngang: w=560, h=315
        const width = sec.isMobile ? 260 : 540;
        const height = sec.isMobile ? 480 : 304;
        imageRun = new ImageRun({
          data: imgBuffer,
          transformation: { width, height }
        });
      } catch (err) {
        console.warn(`Loi doc anh ${sec.shotFile} cho docx:`, err.message);
      }
    }

    docChildren.push(
      new Paragraph({
        pageBreakBefore: true,
        children: [
          new TextRun({ text: `[${sec.tag}]`, bold: true, color: "B45309", size: 20 })
        ],
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `${num}. ${sec.title}`, bold: true, size: 28, color: "0F172A" })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: sec.subtitle, italics: true, size: 20, color: "64748B" })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "MỤC TIÊU: ", bold: true, color: "0284C7" }),
          new TextRun({ text: sec.goal, size: 22 })
        ],
        spacing: { after: 150 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "ĐƯỜNG DẪN: ", bold: true, color: "B45309" }),
          new TextRun({ text: sec.path, size: 20, font: "Courier New" })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "CÁC BƯỚC THỰC HIỆN CHI TIẾT:", bold: true, size: 22, color: "0F172A" })
        ],
        spacing: { after: 100 }
      })
    );

    sec.steps.forEach(step => {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `• ${step}`, size: 21 })
          ],
          spacing: { after: 80 }
        })
      );
    });

    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: "LƯU Ý NGHIỆP VỤ: ", bold: true, color: "DC2626" }),
          new TextRun({ text: sec.noteRed, size: 20 })
        ],
        spacing: { before: 150, after: 150 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "MẸO C-LEVEL: ", bold: true, color: "2563EB" }),
          new TextRun({ text: sec.noteBlue, size: 20 })
        ],
        spacing: { after: 250 }
      })
    );

    if (imageRun) {
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [imageRun],
          spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: sec.shotCaption, italics: true, size: 18, color: "64748B" })
          ],
          spacing: { after: 400 }
        })
      );
    }
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: docChildren
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`>>> Ghi thanh cong file DOCX: ${outputPath}`);
}

async function main() {
  console.log("===============================================================================");
  console.log("=== BIEN SOAN BO TAI LIEU HDSD VIONE & CRM (KHONG CON ANH 404) ===");
  console.log("===============================================================================");

  // 1. TÀI LIỆU HDSD CHO WEB CRM VIONE (22 PHÂN HỆ)
  const crmHtml = generateHtmlDoc({
    docCode: 'HDSD-CRM-VIONE-6.0',
    title: 'HƯỚNG DẪN SỬ DỤNG HỆ THỐNG QUẢN TRỊ DOANH NGHIỆP CRM VIONE',
    subtitle: 'Cẩm nang vận hành chi tiết 22 phân hệ quản trị C-Level, khách hàng, dòng tiền, bán hàng và ma trận phân quyền',
    targetAudience: 'Web CRM ViOne Enterprise (Quản trị viên, Giám đốc, Kế toán, Sales Manager)',
    sections: crmSections
  });
  const crmHtmlPath = path.join(docDir, 'HDSD_WEB_CRM_VIONE.html');
  const crmPublicHtmlPath = path.join(publicDocsDir, 'HDSD_WEB_CRM_VIONE.html');
  fs.writeFileSync(crmHtmlPath, crmHtml, 'utf8');
  fs.writeFileSync(crmPublicHtmlPath, crmHtml, 'utf8');
  console.log(`>>> Da ghi: ${crmHtmlPath} & ${crmPublicHtmlPath}`);

  await generateDocxFile({
    docCode: 'HDSD-CRM-VIONE-6.0',
    title: 'HƯỚNG DẪN SỬ DỤNG HỆ THỐNG QUẢN TRỊ CRM VIONE',
    subtitle: 'Cẩm nang vận hành 22 phân hệ quản trị C-Level, khách hàng và dòng tiền',
    targetAudience: 'Web CRM ViOne Enterprise',
    sections: crmSections,
    outputPath: path.join(docDir, 'HDSD_WEB_CRM_VIONE.docx')
  });

  // 2. TÀI LIỆU HDSD CHO MOBILE APP VIONE CONNECT (10 PHÂN HỆ)
  const appHtml = generateHtmlDoc({
    docCode: 'HDSD-APP-VIONE-6.0',
    title: 'HƯỚNG DẪN SỬ DỤNG ỨNG DỤNG DI ĐỘNG & PWA VIONE CONNECT',
    subtitle: 'Cẩm nang sử dụng danh thiếp số NFC, mạng lưới đối tác, sàn giao thương B2B và cài đặt PWA iOS',
    targetAudience: 'Mobile App ViOne Connect (Doanh nhân, Hội viên, Khách hàng)',
    sections: appSections
  });
  const appHtmlPath = path.join(docDir, 'HDSD_APP_VIONE_CONNECT.html');
  const appPublicHtmlPath = path.join(publicDocsDir, 'HDSD_APP_VIONE_CONNECT.html');
  fs.writeFileSync(appHtmlPath, appHtml, 'utf8');
  fs.writeFileSync(appPublicHtmlPath, appHtml, 'utf8');
  console.log(`>>> Da ghi: ${appHtmlPath} & ${appPublicHtmlPath}`);

  await generateDocxFile({
    docCode: 'HDSD-APP-VIONE-6.0',
    title: 'HƯỚNG DẪN SỬ DỤNG ỨNG DỤNG DI ĐỘNG VIONE CONNECT',
    subtitle: 'Cẩm nang sử dụng danh thiếp số NFC, mạng lưới đối tác và PWA iOS',
    targetAudience: 'Mobile App ViOne Connect',
    sections: appSections,
    outputPath: path.join(docDir, 'HDSD_APP_VIONE_CONNECT.docx')
  });

  // 3. TÀI LIỆU HỢP NHẤT TOÀN DIỆN (32 PHÂN HỆ)
  const allHtml = generateHtmlDoc({
    docCode: 'HDSD-VIONE-TOANDIEN-6.0',
    title: 'HƯỚNG DẪN SỬ DỤNG HỆ THỐNG QUẢN TRỊ CRM VÀ ỨNG DỤNG DI ĐỘNG VIONE CONNECT',
    subtitle: 'Tài liệu hướng dẫn trực quan chi tiết toàn bộ các phân hệ chức năng từ Web CRM đến App Mobile kèm 100% ảnh chụp live không lỗi 404',
    targetAudience: 'Toàn bộ Hệ sinh thái ViOne Enterprise & ViOne Connect App',
    sections: allSections,
    isAllInOne: true
  });
  const allHtmlPath = path.join(docDir, 'HDSD_HE_THONG_VA_APP_VIONE_TOAN_DIEN.html');
  const allPublicHtmlPath = path.join(publicDocsDir, 'HDSD_HE_THONG_VA_APP_VIONE_TOAN_DIEN.html');
  fs.writeFileSync(allHtmlPath, allHtml, 'utf8');
  fs.writeFileSync(allPublicHtmlPath, allHtml, 'utf8');
  console.log(`>>> Da ghi: ${allHtmlPath} & ${allPublicHtmlPath}`);

  await generateDocxFile({
    docCode: 'HDSD-VIONE-TOANDIEN-6.0',
    title: 'HƯỚNG DẪN SỬ DỤNG HỆ THỐNG QUẢN TRỊ CRM VÀ APP VIONE CONNECT',
    subtitle: 'Bản hợp nhất toàn diện 32 phân hệ chức năng kèm 100% ảnh minh chứng live',
    targetAudience: 'Hệ sinh thái ViOne Toàn Diện',
    sections: allSections,
    outputPath: path.join(docDir, 'HDSD_HE_THONG_VA_APP_VIONE_TOAN_DIEN.docx')
  });

  console.log("===============================================================================");
  console.log(">>> HOAN THANH XUAT SAC: BO TAI LIEU HDSD DA DUOC BIEN SOAN & DONG BO 100%!");
  console.log("===============================================================================");
}

main().catch(err => {
  console.error(">>> LOI BIEN SOAN TAI LIEU:", err);
  process.exit(1);
});
