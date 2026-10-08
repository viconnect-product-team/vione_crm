const fs = require('fs');
const path = require('path');
const docx = require('docx');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, AlignmentType } = docx;

const rootDir = path.resolve(__dirname, '..');
const docDir = path.join(rootDir, 'document');
const publicDocsDir = path.join(rootDir, 'apps', 'vione_app_fe', 'public', 'docs');

if (!fs.existsSync(docDir)) fs.mkdirSync(docDir, { recursive: true });
if (!fs.existsSync(publicDocsDir)) fs.mkdirSync(publicDocsDir, { recursive: true });

console.log('>>> [HDSD VIONE 6.0 NO-IMAGES] Bat dau bien soan Huong Dan Su Dung 100% Text & Workflow UI (TRIET TIEU ANH 404)...');

// ==========================================
// 22 CHUYÊN ĐỀ WEB CRM VIONE
// ==========================================
const crmSections = [
  {
    tag: 'CRM · XÁC THỰC',
    title: 'Đăng Nhập Quản Trị Hệ Thống CRM ViOne Phong Cách Sáng Sang Trọng',
    subtitle: 'Truy cập cổng điều hành doanh nghiệp với nhận diện Champagne Gold và bảo mật đa kênh',
    goal: 'Đăng nhập an toàn vào bảng điều hành số CRM ViOne qua tài khoản doanh nghiệp hoặc quản trị viên.',
    path: 'Trình duyệt Web Desktop -> Truy cập: https://14.225.217.232:5445/auth',
    steps: [
      'Bước 1: Mở trình duyệt web (Google Chrome, Microsoft Edge, Safari) và truy cập địa chỉ https://14.225.217.232:5445/auth.',
      'Bước 2: Giao diện đăng nhập phong cách Light Mode sang trọng xuất hiện với ảnh nền kiến trúc đô thị ngọc trai và khung viền Champagne Gold.',
      'Bước 3: Nhập địa chỉ Email doanh nghiệp (ví dụ: admin@vione.vn) hoặc Số điện thoại vào ô Identifier.',
      'Bước 4: Nhập Mật khẩu bảo mật và bấm nút "Đăng Nhập Vào Hệ Thống".',
      'Bước 5: Hệ thống xác thực token JWT, lưu phiên an toàn và tự động chuyển hướng vào Bảng Điều Hành C-Level (/dashboard).'
    ],
    noteRed: 'LƯU Ý BẢO MẬT: Sau 5 lần nhập sai mật khẩu liên tiếp, tài khoản sẽ tạm thời bị khóa trong 15 phút để phòng chống tấn công dò quét brute-force.',
    noteBlue: 'MẸO SỬ DỤNG: Quản trị viên có thể sử dụng tính năng "Ghi nhớ đăng nhập" để duy trì phiên làm việc trong 30 ngày an toàn.',
    workflow: [
      { step: '01', action: 'Nhập Định Danh', ui: 'Ô nhập liệu Identifier', input: 'Email công ty hoặc SĐT di động', output: 'Format hợp lệ' },
      { step: '02', action: 'Mật Khẩu & Bảo Mật', ui: 'Ô nhập liệu Password', input: 'Mật khẩu băm an toàn', output: 'Mã hóa client-side' },
      { step: '03', action: 'Xác Thực Token', ui: 'API POST /api/auth/login', input: 'Payload JSON JWT', output: 'Trả về Access Token & Profile' },
      { step: '04', action: 'Điều Hướng Dashboard', ui: 'Router TanStack Start', input: 'Session Authenticated', output: 'Chuyển hướng /dashboard' }
    ]
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
    workflow: [
      { step: '01', action: 'Truy Vấn KPI Realtime', ui: 'Metric Cards Header', input: 'Tenant ID & Kỳ báo cáo', output: 'Doanh thu, Deals, Khách hàng' },
      { step: '02', action: 'Phân Tích Dòng Tiền', ui: 'Biểu đồ Cash Flow 12 tháng', input: 'Dữ liệu thu chi sổ cái', output: 'Biểu đồ đường & cột trực quan' },
      { step: '03', action: 'Cảnh Báo Vận Hành', ui: 'Notification Alert Box', input: 'Quá hạn SLA & Hợp đồng', output: 'Badge đỏ cảnh báo C-Level' },
      { step: '04', action: 'Phím Tắt Xuất Báo Cáo', ui: 'Nút Export Executive PDF', input: 'Click 1-chạm', output: 'Tải báo cáo tóm lược CEO' }
    ]
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
    workflow: [
      { step: '01', action: 'Thu Thập Đa Kênh', ui: 'NFC, OCR, Form, API Web', input: 'Contact Data & Mã số thuế', output: 'Bản ghi khách hàng mới' },
      { step: '02', action: 'AI Scoring', ui: 'AI Matcher Engine', input: 'Ngành nghề, quy mô vốn', output: 'Điểm tiềm năng 0 - 100' },
      { step: '03', action: 'Phân Bổ Nhân Sự', ui: 'Lead Assignment Matrix', input: 'Chọn Sales Executive', output: 'Gửi thông báo nhận lead' },
      { step: '04', action: 'Hồ Sơ 360 Độ', ui: 'Customer Detail Modal', input: 'Nhấp xem chi tiết', output: 'Hợp đồng, Báo giá, Lịch sử gọi' }
    ]
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
    workflow: [
      { step: '01', action: 'Tạo Thương Vụ', ui: 'Nút [+ Tạo Cơ Hội]', input: 'Tên deal, Giá trị dự kiến', output: 'Card mới tại Cột Giai đoạn 1' },
      { step: '02', action: 'Kéo Thả Tiến Trình', ui: 'Bảng kéo thả Kanban Drag&Drop', input: 'Di chuyển card qua 5 cột', output: 'Cập nhật xác suất chốt %' },
      { step: '03', action: 'Đính Kèm Báo Giá', ui: 'Tab Báo Giá Điện Tử', input: 'File báo giá PDF / link', output: 'Gửi khách hàng qua Zalo/Email' },
      { step: '04', action: 'Chốt Hợp Đồng', ui: 'Cột [5. Won/Closed]', input: 'Kéo thả thành công', output: 'Sinh phiếu thu & Chúc mừng deal' }
    ]
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
    workflow: [
      { step: '01', action: 'Khai Báo Pháp Nhân', ui: 'Form Thông tin Doanh nghiệp', input: 'Tên pháp nhân, MST, Logo', output: 'Công ty mẹ / Chi nhánh' },
      { step: '02', action: 'Thiết Lập Bản Đồ GPS', ui: 'Bản đồ số & Tọa độ Lat/Long', input: 'Tọa độ GPS + Bán kính (m)', output: 'Khoanh vùng chấm công hợp lệ' },
      { step: '03', action: 'Gán Trưởng Chi Nhánh', ui: 'Dropdown Danh sách nhân sự', input: 'Chọn Giám đốc chi nhánh', output: 'Phân quyền điều hành vùng' },
      { step: '04', action: 'Kích Hoạt Multi-Tenant', ui: 'Cơ sở dữ liệu độc lập', input: 'Lưu thiết lập', output: 'Tách biệt báo cáo từng chi nhánh' }
    ]
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
    workflow: [
      { step: '01', action: 'Đọc Mã Chip UID', ui: 'Đầu đọc NFC / Camera QR', input: 'Mã số chip vật lý', output: 'Nhận diện thẻ mới 100%' },
      { step: '02', action: 'Gán Chủ Sở Hữu', ui: 'Bảng danh sách nhân viên', input: 'Chọn nhân sự thụ hưởng', output: 'Liên kết hồ sơ chức danh' },
      { step: '03', action: 'Chọn Mẫu 3D Card', ui: 'Giao diện mẫu Titanium/Gold', input: 'Tùy biến chữ ký V chìm', output: 'Sinh trang cá nhân /card/:code' },
      { step: '04', action: 'Quản Trị Vòng Đời', ui: 'Nút [Khóa] / [Mở] / [Thu Hồi]', input: 'Click 1-chạm admin', output: 'Vô hiệu hóa thẻ khi nghỉ việc' }
    ]
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
    workflow: [
      { step: '01', action: 'Khởi Tạo Công Việc', ui: 'Modal [+ Giao Nhiệm Vụ]', input: 'Tiêu đề, mô tả, deadline', output: 'Tạo Task ID duy nhất' },
      { step: '02', action: 'Gán Trách Nhiệm', ui: 'Dropdown Nhân sự & Phòng ban', input: 'Người phụ trách & Phối hợp', output: 'Bắn Push Notification tức thì' },
      { step: '03', action: 'Theo Dõi Trạng Thái', ui: 'Bảng Kanban 4 cột tiến độ', input: 'Cập nhật % hoàn thành', output: 'Chờ làm -> Đang làm -> Hoàn thành' },
      { step: '04', action: 'Nghiệm Thu KPI', ui: 'Nút [Nghiệm Thu & Đóng Việc]', input: 'Xác nhận của Quản lý', output: 'Cộng điểm KPI nhân sự' }
    ]
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
    workflow: [
      { step: '01', action: 'Thu Thập Task Đang Chạy', ui: 'Database Tasks Engine', input: 'Trạng thái in_progress', output: 'Tính tổng WIP của từng user' },
      { step: '02', action: 'Tô Màu Bản Đồ Nhiệt', ui: 'Giao diện Heatmap trực quan', input: 'Thang đo 1-3, 4, ≥5 việc', output: 'Xanh (Tốt), Vàng (Cao), Đỏ (Quá tải)' },
      { step: '03', action: 'Cảnh Báo Quá Tải', ui: 'Badge Cảnh báo Lãnh đạo', input: 'Nhân sự có WIP ≥ 5 việc', output: 'Gợi ý điều phối chia sẻ việc' },
      { step: '04', action: 'Điều Chuyển 1-Chạm', ui: 'Thao tác kéo thả task', input: 'Chuyển task sang người rảnh', output: 'Tối ưu hóa năng suất toàn đội' }
    ]
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
    workflow: [
      { step: '01', action: 'Xác Thực Tọa Độ GPS', ui: 'Vị trí vệ tinh thiết bị', input: 'Khoảng cách tới văn phòng', output: 'Hợp lệ nếu bán kính ≤ 50m' },
      { step: '02', action: 'Nhận Diện AI FaceID', ui: 'Camera chụp selfie real', input: 'Khuôn mặt nhân viên', output: 'Đối soát khuôn mặt gốc 99%' },
      { step: '03', action: 'Ghi Nhận Bảng Công', ui: 'Bảng attendance_logs', input: 'Timestamp chính xác', output: 'Trạng thái: Đúng giờ / Đi muộn' },
      { step: '04', action: 'Xuất Bảng Công Tháng', ui: 'Nút [Tổng Hợp Bảng Công]', input: 'Kỳ trả lương tháng', output: 'File Excel tính lương chuẩn mực' }
    ]
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
    workflow: [
      { step: '01', action: 'Tạo Đề Xuất Cấp 1', ui: 'Form Đề Nghị Thanh Toán', input: 'Số tiền, lý do chi, hóa đơn', output: 'Trạng thái: Chờ Trưởng phòng duyệt' },
      { step: '02', action: 'Thẩm Định Cấp 2', ui: 'Giao diện duyệt Trưởng phòng', input: 'Kiểm tra chứng từ đính kèm', output: 'Duyệt chuyển tiếp lên Giám đốc' },
      { step: '03', action: 'Phê Duyệt Cấp 3', ui: 'Giao diện duyệt CEO/CFO', input: 'Xét duyệt ngân sách công ty', output: 'Trạng thái: Đã duyệt chi tiền' },
      { step: '04', action: 'Sinh Mã VietQR Napas', ui: 'Mã QR thanh toán 24/7', input: 'Số TK thụ hưởng + Số tiền', output: 'Kế toán quét thanh toán 1 giây' }
    ]
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
    workflow: [
      { step: '01', action: 'Phân Loại Sổ Quỹ', ui: 'Quỹ Tiền Mặt & Quỹ Ngân Hàng', input: 'Tài khoản nguồn/đích', output: 'Số dư biến động thời gian thực' },
      { step: '02', action: 'Ghi Nhận Giao Dịch', ui: 'Phiếu Thu / Phiếu Chi điện tử', input: 'Chứng từ, định khoản nợ có', output: 'Tự động cập nhật số dư ròng' },
      { step: '03', action: 'Đối Soát Tự Động', ui: 'Ngân hàng kết nối VietQR', input: 'Webhook gạch nợ tự động', output: 'Khớp số dư sổ cái và ngân hàng' },
      { step: '04', action: 'Xuất Báo Cáo Tài Chính', ui: 'Nút [Xuất Sổ Cái Excel]', input: 'Kỳ kế toán quý/năm', output: 'Báo cáo lưu chuyển tiền tệ' }
    ]
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
      'Bước 5: Bấm "Xuất Bản Sản Phẩm": Sản phẩm sẽ xuất hiện ngay trên gian hàng chung của cộng đồng doanh nhân.'
    ],
    noteRed: 'CHÍNH SÁCH GIÁ B2B: Mức giá ưu đãi B2B chỉ hiển thị với các đối tác đã xác thực doanh nghiệp thành công.',
    noteBlue: 'MẸO BÁN HÀNG: Cập nhật chính sách chiết khấu số lượng lớn để kích thích các doanh nghiệp khác đặt hàng làm quà tặng hoặc cung ứng định kỳ.',
    workflow: [
      { step: '01', action: 'Khai Báo Sản Phẩm', ui: 'Form Thông tin Sản phẩm', input: 'Tên, ngành hàng, quy cách', output: 'Tạo mã SKU định danh' },
      { step: '02', action: 'Cấu Hình Giá B2B', ui: '2 Tầng giá: Bán lẻ & B2B VIP', input: 'Mức chiết khấu đối tác', output: 'Bảo mật biên lợi nhuận' },
      { step: '03', action: 'Kiểm Duyệt Nội Dung', ui: 'Hệ thống AI & Admin duyệt', input: 'Hình ảnh, mô tả sản phẩm', output: 'Xác thực chất lượng 100%' },
      { step: '04', action: 'Phát Sóng Gian Hàng', ui: 'Sàn Marketplace cộng đồng', input: 'Xuất bản công khai', output: 'Tiếp cận hàng nghìn CEO đối tác' }
    ]
  },
  {
    tag: 'CRM · SỰ KIỆN',
    title: 'Quản Trị Sự Kiện Doanh Nghiệp & Soát Vé QR Tự Động',
    subtitle: 'Tổ chức hội thảo, diễn đàn giao thương B2B, phát hành vé điện tử và check-in tốc độ cao',
    goal: 'Chuyên nghiệp hóa công tác tổ chức sự kiện, kiểm soát an ninh cửa ra vào chính xác.',
    path: 'Sidebar -> Mạng Lưới B2B -> Sự Kiện Doanh Nghiệp (/events)',
    steps: [
      'Bước 1: Bấm "+ Tạo Sự Kiện Mới" và nhập: Tên sự kiện, Thời gian diễn ra, Địa điểm tổ chức, Quy mô khách mời.',
      'Bước 2: Thiết lập các hạng vé: Vé Thường (Miễn phí) hoặc Vé VIP B2B (Có thu phí).',
      'Bước 3: Bấm "Xuất Bản": Hệ thống tự động gửi thư mời kèm mã QR cá nhân hóa đến danh bạ đối tác.',
      'Bước 4: Tại cửa đón tiếp: Lễ tân dùng camera điện thoại quét mã QR của khách, màn hình báo "Check-in Thành Công" trong 0.2 giây.'
    ],
    noteRed: 'QUY TRÌNH CHECK-IN: Mỗi mã QR chỉ có giá trị check-in một lần duy nhất để chống việc quay vòng vé lậu.',
    noteBlue: 'MẸO TỔ CHỨC: Tích hợp vòng quay may mắn (Lucky Draw) tự động quay số theo mã vé của các khách đã check-in thực tế.',
    workflow: [
      { step: '01', action: 'Lên Kế Hoạch Sự Kiện', ui: 'Form Tạo Sự Kiện Mới', input: 'Tên, ngày giờ, địa điểm, VIP', output: 'Trang landing đăng ký vé' },
      { step: '02', action: 'Phát Hành Vé Điện Tử', ui: 'Engine sinh vé QR động', input: 'Thông tin khách tham dự', output: 'Mã QR vé VIP gửi về Email/App' },
      { step: '03', action: 'Soát Vé Check-in Siêu Tốc', ui: 'Camera Scanner tại bàn lễ tân', input: 'Quét mã QR của khách', output: 'Ghi nhận có mặt trong 0.2s' },
      { step: '04', action: 'Quay Số May Mắn', ui: 'Màn hình Lucky Draw tự động', input: 'Danh sách khách đã check-in', output: 'Vinh danh người trúng giải' }
    ]
  },
  {
    tag: 'CRM · BIỂU QUYẾT',
    title: 'Quản Lý Biểu Quyết Số & Đại Hội Cổ Đông Trực Tuyến',
    subtitle: 'Hệ thống bỏ phiếu điện tử minh bạch, kiểm phiếu tức thì và bảo mật mã hóa kết quả',
    goal: 'Tổ chức các cuộc họp biểu quyết trực tuyến minh bạch, loại bỏ hoàn toàn việc kiểm phiếu thủ công.',
    path: 'Sidebar -> Quản Trị C-Level -> Biểu Quyết & Bầu Cử (/voting)',
    steps: [
      'Bước 1: Bấm "+ Tạo Phiên Biểu Quyết Mới" và nhập tiêu đề phiên họp (ví dụ: Thông qua kế hoạch kinh doanh năm 2027).',
      'Bước 2: Thiết lập danh sách các phương án lựa chọn: [Đồng ý], [Không đồng ý], [Ý kiến khác].',
      'Bước 3: Gán trọng số biểu quyết: Biểu quyết theo số cổ phần sở hữu hoặc theo nguyên tắc 1 người 1 phiếu.',
      'Bước 4: Mở cổng biểu quyết: Cổ đông hoặc thành viên HĐQT đăng nhập và bấm chọn phương án trực tiếp trên app.',
      'Bước 5: Đóng cổng và công bố kết quả: Hệ thống tự động vẽ biểu đồ tỷ lệ % biểu quyết tức thì.'
    ],
    noteRed: 'TÍNH BẤT BIẾN: Kết quả phiếu bầu sau khi gửi sẽ được mã hóa bằng chữ ký số bảo mật, không ai có thể can thiệp hay sửa đổi kết quả.',
    noteBlue: 'MẸO PHÁP LÝ: Xuất biên bản kiểm phiếu có đóng dấu mộc điện tử để lưu vào hồ sơ pháp lý công ty hợp lệ.',
    workflow: [
      { step: '01', action: 'Thiết Lập Nội Dung Biểu Quyết', ui: 'Form Tạo Phiên Họp HĐQT', input: 'Nội dung tờ trình, phương án', output: 'Tạo phòng bỏ phiếu số' },
      { step: '02', action: 'Gán Trọng Số Cổ Phần', ui: 'Cơ chế tính điểm theo Equity', input: 'Tỷ lệ sở hữu vốn của user', output: 'Xác lập quyền biểu quyết' },
      { step: '03', action: 'Bỏ Phiếu Trực Tuyến', ui: 'Nút biểu quyết trên Mobile/Web', input: 'Lựa chọn phương án', output: 'Ký số bảo mật phiếu bầu' },
      { step: '04', action: 'Công Bố Kết Quả Realtime', ui: 'Biểu đồ tỷ lệ % đồng thuận', input: 'Đóng cổng bỏ phiếu', output: 'Xuất biên bản đại hội PDF' }
    ]
  },
  {
    tag: 'CRM · HOA HỒNG',
    title: 'Quản Lý Chiết Khấu, Chính Sách Hoa Hồng & Điểm Thưởng B2B',
    subtitle: 'Tự động tính toán hoa hồng giới thiệu đối tác, quản lý ví điểm thưởng và đổi quà doanh nghiệp',
    goal: 'Kích thích mạng lưới đối tác giới thiệu khách hàng mới thông qua chính sách trả thưởng minh bạch.',
    path: 'Sidebar -> Quản Trị Bán Hàng -> Hoa Hồng & Điểm Thưởng (/perks hoặc /commissions)',
    steps: [
      'Bước 1: Cấu hình tỷ lệ hoa hồng cho từng nhóm sản phẩm: Hoa hồng bán hàng trực tiếp (10%) và Hoa hồng giới thiệu đối tác B2B (5%).',
      'Bước 2: Khi hợp đồng được chuyển sang trạng thái "Đã Thanh Toán", hệ thống tự động tính số tiền hoa hồng cho người giới thiệu.',
      'Bước 3: Xem bảng tổng hợp công nợ hoa hồng phải trả cho các đối tác môi giới theo tháng.',
      'Bước 4: Bấm "Phê Duyệt Trả Thưởng": Hệ thống sinh lệnh chuyển tiền tự động qua VietQR đến tài khoản của đối tác.'
    ],
    noteRed: 'QUY ĐỊNH CHI TRẢ: Hoa hồng chỉ được tất toán khi hợp đồng gốc đã thu đủ 100% tiền từ khách hàng.',
    noteBlue: 'MẸO ĐỐI TÁC: Quy đổi hoa hồng thành Điểm thưởng B2B (V-Points) để thanh toán các dịch vụ khác trong hệ sinh thái với mức ưu đãi 10%.',
    workflow: [
      { step: '01', action: 'Cấu Hình Quy Tắc Hoa Hồng', ui: 'Bảng tỷ lệ % theo sản phẩm', input: 'Mức % trực tiếp & gián tiếp', output: 'Chính sách thưởng minh bạch' },
      { step: '02', action: 'Tự Động Tính Thưởng', ui: 'Trigger thanh toán hợp đồng', input: 'Giá trị hợp đồng thực thu', output: 'Cộng tiền vào ví hoa hồng' },
      { step: '03', action: 'Đối Soát Bảng Kê', ui: 'Bảng chi tiết hoa hồng đối tác', input: 'Dữ liệu giao dịch tháng', output: 'Kế toán thẩm định số tiền' },
      { step: '04', action: 'Thanh Toán 1-Chạm', ui: 'Lệnh chi tự động VietQR', input: 'Bấm duyệt trả thưởng', output: 'Tất toán tiền về STK đối tác' }
    ]
  },
  {
    tag: 'CRM · QUYỀN LỢI',
    title: 'Quản Trị Quyền Lợi Thành Viên & Hạng Đối Tác Chiến Lược',
    subtitle: 'Phân hạng đối tác (Silver, Gold, Platinum, Diamond) và tự động mở khóa các đặc quyền tương ứng',
    goal: 'Chăm sóc và giữ chân các khách hàng VIP và đối tác chiến lược quan trọng nhất của doanh nghiệp.',
    path: 'Sidebar -> Quản Trị Khách Hàng -> Hạng Đối Tác & Quyền Lợi (/benefits hoặc /tiers)',
    steps: [
      'Bước 1: Thiết lập 4 Hạng Đối Tác: Bạc (Silver), Vàng (Gold), Bạch Kim (Platinum), Kim Cương (Diamond).',
      'Bước 2: Cài đặt hạn mức doanh số tích lũy để thăng hạng (ví dụ: Đạt 500 triệu/năm tự động lên hạng Gold).',
      'Bước 3: Gán các đặc quyền cho từng hạng: Mức chiết khấu mua hàng, Vé mời sự kiện VIP thường niên, Ưu tiên hỗ trợ kỹ thuật 24/7.',
      'Bước 4: Theo dõi bảng xếp hạng thăng/hạ hạng của các đối tác theo chu kỳ đánh giá năm.'
    ],
    noteRed: 'THÔNG BÁO THĂNG HẠNG: Hệ thống tự động gửi thư chúc mừng và trao chứng nhận điện tử đến tài khoản đối tác ngay khi được nâng hạng.',
    noteBlue: 'MẸO CSKH: Tặng quà sinh nhật doanh nghiệp tự động cho các đối tác từ hạng Platinum trở lên để gia tăng sự gắn kết.',
    workflow: [
      { step: '01', action: 'Thiết Lập 4 Hạng VIP', ui: 'Bảng cấu hình Tiers', input: 'Silver, Gold, Platinum, Diamond', output: 'Hạn mức doanh số tích lũy' },
      { step: '02', action: 'Gán Quyền Lợi Đặc Quyền', ui: 'Danh mục Perks & Benefits', input: 'Chiết khấu %, Vé VIP sự kiện', output: 'Kích hoạt quyền lợi tương ứng' },
      { step: '03', action: 'Tự Động Thăng Hạng', ui: 'Job tính lũy kế doanh số', input: 'Tổng chi tiêu của đối tác', output: 'Nâng hạng + Gửi thiệp mừng' },
      { step: '04', action: 'Cấp Chứng Nhận Đối Tác', ui: 'Huy hiệu số mạ vàng', input: 'Hồ sơ doanh nghiệp', output: 'Hiển thị huy hiệu VIP trên sàn' }
    ]
  },
  {
    tag: 'CRM · HỢP ĐỒNG',
    title: 'Quản Trị Hợp Đồng Kinh Tế Điện Tử & Chữ Ký Số',
    subtitle: 'Lưu trữ hợp đồng tập trung, theo dõi thời hạn hiệu lực, cảnh báo gia hạn và ký kết trực tuyến',
    goal: 'Quản lý toàn bộ vòng đời hợp đồng kinh tế an toàn, không lo thất lạc hoặc quên gia hạn.',
    path: 'Sidebar -> Quản Trị Bán Hàng -> Hợp Đồng Kinh Tế (/contracts)',
    steps: [
      'Bước 1: Bấm "+ Tạo Hợp Đồng Mới" và chọn Mẫu hợp đồng chuẩn (Hợp đồng mua bán, Cung cấp dịch vụ, Đại lý phân phối).',
      'Bước 2: Điền thông tin pháp nhân khách hàng: Tên công ty, Đại diện ký, Giá trị hợp đồng, Thời hạn hiệu lực.',
      'Bước 3: Tải lên bản thảo hợp đồng dạng PDF hoặc sử dụng mẫu soạn thảo trực tiếp trên hệ thống.',
      'Bước 4: Gửi yêu cầu ký số: Hai bên đại diện pháp luật sử dụng chứng thư số USB Token hoặc Chữ ký số SmartCA để ký trực tiếp.',
      'Bước 5: Hợp đồng đã ký được lưu trữ trên hạ tầng phân tán MinIO có mã băm toàn vẹn (SHA-256).'
    ],
    noteRed: 'CẢNH BÁO HẾT HẠN: Hệ thống tự động gửi email và thông báo cho Trưởng phòng kinh doanh trước 30 ngày đối với các hợp đồng sắp hết hiệu lực.',
    noteBlue: 'MẸO PHÁP CHẾ: Mọi lịch sử xem, tải xuống và chỉnh sửa hợp đồng đều được lưu vết kiểm toán bất biến.',
    workflow: [
      { step: '01', action: 'Tạo Dự Thảo Hợp Đồng', ui: 'Kho mẫu hợp đồng kinh tế', input: 'Chọn template + Khách hàng', output: 'Tự động điền thông tin pháp lý' },
      { step: '02', action: 'Trình Ký Trực Tuyến', ui: 'Cổng ký số tích hợp SmartCA', input: 'Chứng thư số điện tử hợp lệ', output: 'Đóng dấu mộc số & Thời gian' },
      { step: '03', action: 'Lưu Trữ Mã Hóa', ui: 'Hạ tầng Object Storage MinIO', input: 'Tệp PDF đã ký đầy đủ', output: 'Lưu trữ an toàn chuẩn AES-256' },
      { step: '04', action: 'Cảnh Báo Gia Hạn', ui: 'Bộ đếm đếm ngược ngày hết hạn', input: 'Mốc 30 - 15 - 7 ngày trước hạn', output: 'Tự động nhắc tái ký hợp đồng' }
    ]
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
    workflow: [
      { step: '01', action: 'Chọn Nhóm Vai Trò', ui: '7 Vai trò (CEO, COO, CFO, Sales...)', input: 'Danh sách chức vụ', output: 'Hiển thị ma trận phân quyền' },
      { step: '02', action: 'Cấu Hình 6 Thao Tác', ui: 'Grid Checkbox: Xem/Tạo/Sửa/Xóa/Duyệt/Xuất', input: 'Bật/tắt từng quyền hạn', output: 'Thiết lập phạm vi thao tác' },
      { step: '03', action: 'Lưu Trữ RBAC Policy', ui: 'API PATCH /platform/permissions', input: 'Ma trận cấu hình mới', output: 'Lưu vào CSDL PostgreSQL' },
      { step: '04', action: 'Áp Dụng Thời Gian Thực', ui: 'Tầng Guard NestJS & Client Cache', input: 'Token JWT context', output: 'Cập nhật quyền hạn tức thì' }
    ]
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
    workflow: [
      { step: '01', action: 'Ghi Nhận Lệnh Prompt', ui: 'AI Request Interceptor', input: 'Câu hỏi & Context người dùng', output: 'Lưu nhật ký gọi AI' },
      { step: '02', action: 'Phân Loại 6 Năng Lực', ui: 'Bộ định tuyến AI Capabilities', input: 'Mục đích đàm thoại/OCR/Matching', output: 'Gán thẻ năng lực tương ứng' },
      { step: '03', action: 'Đo Lường Token Tiêu Thụ', ui: 'Token Cost Analytics', input: 'Input tokens + Output tokens', output: 'Tính toán chi phí vận hành' },
      { step: '04', action: 'Báo Cáo Hiệu Quả AI', ui: 'Dashboard ROI Tiết Kiệm Thời Gian', input: 'Thống kê tác vụ tự động', output: 'Đo lường năng suất doanh nghiệp' }
    ]
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
    workflow: [
      { step: '01', action: 'Trao Cơ Hội Kết Nối', ui: 'Form Referral Connection', input: 'Doanh nghiệp giới thiệu & Đối tác', output: 'Tạo cơ hội giao thương mới' },
      { step: '02', action: 'Theo Dõi Đàm Phán', ui: 'Trạng thái kết nối 4 bước', input: 'Cập nhật tiến độ tiếp xúc', output: 'Minh bạch tiến trình hợp tác' },
      { step: '03', action: 'Ghi Nhận Thank You Note', ui: 'Xác nhận giá trị hợp đồng', input: 'Doanh thu phát sinh thực tế', output: 'Tích lũy giá trị giao dịch' },
      { step: '04', action: 'Vinh Danh Bảng Vàng', ui: 'Leaderboard Doanh Nhân Tháng', input: 'Tổng điểm kết nối thành công', output: 'Tăng uy tín và xếp hạng AI' }
    ]
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
    workflow: [
      { step: '01', action: 'Theo Dõi Hạn Bản Quyền', ui: 'Bảng License Expiration', input: 'Ngày bắt đầu & Ngày hết hạn', output: 'Trạng thái hoạt động bình thường' },
      { step: '02', action: 'Cảnh Báo Tự Động', ui: 'Email & Chuông thông báo', input: 'Mốc 30-15-7 ngày trước hạn', output: 'Nhắc nhở Ban Giám Đốc' },
      { step: '03', action: 'Thanh Toán Gia Hạn', ui: 'Cổng VietQR Napas 24/7', input: 'Chọn gói bản quyền 1-5 năm', output: 'Gạch nợ tức thì trong 1 giây' },
      { step: '04', action: 'Cấp Hóa Đơn Điện Tử', ui: 'Hệ thống E-Invoice tự động', input: 'Thông tin xuất hóa đơn công ty', output: 'Gửi hóa đơn GTGT về email' }
    ]
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
    workflow: [
      { step: '01', action: 'Nhập Thông Tin Nhận Diện', ui: 'Form Cài Đặt Thương Hiệu', input: 'Tên cty, websiteUrl, hotline, slogan', output: 'Cập nhật hồ sơ doanh nghiệp' },
      { step: '02', action: 'Tải Lên Logo Bản Quyền', ui: 'Bộ tải tệp MinIO Uploader', input: 'File ảnh PNG/SVG trong suốt', output: 'Lưu đường dẫn logo bền vững' },
      { step: '03', action: 'Đồng Bộ Giao Diện', ui: 'Sự kiện association-changed', input: 'Lưu vào localStorage & CSDL', output: 'Cập nhật Sidebar & Auth tức thì' },
      { step: '04', action: 'Kiểm Tra Xem Trước', ui: 'Nút [Xem Trước Website Chính]', input: 'Click mở tab mới', output: 'Xác minh đường dẫn hoạt động tốt' }
    ]
  }
];

// ==========================================
// 15 CHUYÊN ĐỀ APP MOBILE VIONE CONNECT
// ==========================================
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
      'Bước 3: Nhập Email hoặc Số điện thoại di động đã đăng ký (9-12 chữ số).',
      'Bước 4: Nhập Mật khẩu (có nút ẩn/hiện) hoặc chọn nhận mã OTP qua tin nhắn SMS.',
      'Bước 5: Bấm nút gradient mạ vàng "Đăng Nhập Ngay" để vào thẳng Trang chủ ứng dụng.'
    ],
    noteRed: 'HỖ TRỢ ĐĂNG NHẬP: Người dùng có thể đăng nhập bằng cả Email hoặc Số điện thoại mà không cần nhớ chính xác tên đăng nhập.',
    noteBlue: 'MẸO TIỆN LỢI: Bật tính năng đăng nhập bằng FaceID hoặc Vân tay để mở app chỉ trong 0.5 giây trong các lần sau.',
    workflow: [
      { step: '01', action: 'Mở Màn Hình Đăng Nhập', ui: 'Giao diện Luxury Obsidian', input: 'Chọn Email hoặc Số điện thoại', output: 'Form đăng nhập thông minh' },
      { step: '02', action: 'Nhập Mật Khẩu / OTP', ui: 'Ô nhập liệu bảo mật', input: 'Password hoặc mã 6 số OTP', output: 'Xác thực an toàn đa kênh' },
      { step: '03', action: 'Lưu Phiên Session', ui: 'Bộ nhớ AsyncStorage/Cookie', input: 'Token JWT trả về từ server', output: 'Lưu trạng thái đăng nhập 30 ngày' },
      { step: '04', action: 'Chuyển Vào Trang Chủ', ui: 'Bottom Tab Bar Điều Hướng', input: 'Đăng nhập thành công', output: 'Mở màn hình Executive Home' }
    ]
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
    workflow: [
      { step: '01', action: 'Kích Hoạt Chế Độ Đăng Ký', ui: 'Nút [Tạo Tài Khoản Mới]', input: 'Click chuyển mode in-app', output: 'Mở form đăng ký tức thì' },
      { step: '02', action: 'Khai Báo Doanh Nhân', ui: 'Họ tên, SĐT/Email, Công ty', input: 'Dữ liệu định danh thực', output: 'Kiểm tra trùng lặp trên CSDL' },
      { step: '03', action: 'Khởi Tạo Danh Tính Số', ui: 'API POST /api/auth/register', input: 'Mật khẩu bảo mật', output: 'Sinh tài khoản & vCard ban đầu' },
      { step: '04', action: 'Vào Thẳng Ứng Dụng', ui: 'Tự động đăng nhập', input: 'Phiên làm việc mới', output: 'Chuyển thẳng vào Executive Home' }
    ]
  },
  {
    tag: 'APP · TRANG CHỦ',
    title: 'Trang Chủ Doanh Nhân ViOne Connect & Lịch Trình Điều Hành 4 Danh Mục',
    subtitle: 'Trung tâm kết nối C-Level, danh thiếp số thông minh, lịch trình 4 danh mục và khối điều hành',
    goal: 'Cung cấp cho doanh nhân bảng tin điều hành, lịch làm việc và kết nối đối tác nhanh chóng trên di động.',
    path: 'Thanh điều hướng đáy -> Chạm vào Tab: Trang Chủ (Home)',
    steps: [
      'Bước 1: Header trên cùng hiển thị Lời chào cá nhân hóa theo thời gian thực và Avatar mạ vàng bấm mở Profile Drawer.',
      'Bước 2: Quan sát Thẻ Hội Viên Doanh Nhân mạ vàng nổi bật ở vị trí trung tâm hiển thị: Họ tên, Chức vụ, Tên công ty và Mã số thẻ.',
      'Bước 3: Sử dụng 4 Tab lịch trình điều hành: [Hôm nay] [Sắp tới] [Lời nhắc] và [🎙️ Ghi âm] để quản lý mọi hoạt động và nghe lại giọng nói khoảnh khắc.',
      'Bước 4: Xem khối Giám sát Vận hành C-Level: Điểm danh nhân sự, phê duyệt tài chính và tiến độ công việc Kanban.',
      'Bước 5: Thanh định vị AI: Tích hợp nút [📍 Bật vị trí] để sẵn sàng quét người dùng ViOne quanh đây.'
    ],
    noteRed: 'ĐỒNG BỘ THỜI GIAN THỰC: Mọi lịch hẹn cơ hội được chấp nhận qua tin nhắn chat sẽ tự động xuất hiện ngay trong Tab [Hôm nay].',
    noteBlue: 'MẸO LÃNH ĐẠO: Chạm vào tab [🎙️ Ghi âm] để nghe lại các đoạn ghi âm khoảnh khắc với sóng âm và trình phát inline tiện lợi.',
    workflow: [
      { step: '01', action: 'Chào Hỏi Cá Nhân Hóa', ui: 'Header thời gian thực', input: 'Buổi sáng / chiều / tối', output: 'Lời chào ấm áp + Chuông thông báo' },
      { step: '02', action: 'Thẻ Doanh Nhân Vàng', ui: 'Card Danh Thiếp Trung Tâm', input: 'Chạm vào thẻ', output: 'Mở Bottom Sheet vuốt tay xuống' },
      { step: '03', action: '4 Tab Lịch Trình', ui: '[Hôm nay][Sắp tới][Nhắc][Ghi âm]', input: 'Chuyển đổi danh mục', output: 'Lịch hẹn B2B & Audio khoảnh khắc' },
      { step: '04', action: 'Giám Sát Vận Hành', ui: 'Khối Điều Hành 3 Màu Chuẩn', input: 'Trắng - Đen - Vàng Đồng', output: 'Chấm công, Duyệt chi, Giao việc' }
    ]
  },
  {
    tag: 'APP · THẺ DOANH NHÂN',
    title: 'Bottom Sheet Thẻ Doanh Nhân Bo Tròn 36px Tích Hợp Vuốt Tay Xuống',
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
    workflow: [
      { step: '01', action: 'Chạm Thẻ Mở Drawer', ui: 'Sự kiện chạm onTap thẻ', input: 'Thao tác ngón tay', output: 'Drawer trượt lên từ đáy màn hình' },
      { step: '02', action: 'Hiển Thị QR & NFC', ui: 'Mã QR nét cao + Chip NFC', input: 'Hồ sơ doanh nhân thực', output: 'Sẵn sàng quét và chạm kết nối' },
      { step: '03', action: 'Chia Sẻ Danh Bạ vCard', ui: 'Nút [Tải vCard .vcf]', input: 'Bấm 1-chạm', output: 'Lưu thẳng vào danh bạ điện thoại' },
      { step: '04', action: 'Vuốt Tay Xuống Đóng', ui: 'PanResponder Gestures', input: 'Vuốt xuống ≥ 50px', output: 'Popup trượt xuống đóng êm ái' }
    ]
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
    workflow: [
      { step: '01', action: 'Chạm Nút V Vàng Kim', ui: 'VIconMark 3D Vector tròn', input: 'Thao tác chạm 1-click', output: 'Kích hoạt VActionSheet nổi' },
      { step: '02', action: 'Hiển Thị Kính Mờ', ui: 'Obsidian Backdrop Blur', input: 'Làm mờ nền ứng dụng', output: 'Tập trung 6 phím tắt quyền lực' },
      { step: '03', action: 'Chọn Lối Tắt Tác Vụ', ui: 'Lưới 6 Icon Hành Động', input: 'Quét OCR, Chấm công, Duyệt...', output: 'Mở tức thì màn hình nghiệp vụ' },
      { step: '04', action: 'Đóng Menu Siêu Tốc', ui: 'Chạm vùng ngoài / Vuốt tay', input: 'Chạm backdrop', output: 'Thu gọn mượt mà về thanh đáy' }
    ]
  },
  {
    tag: 'APP · ĐỐI TÁC',
    title: 'Mạng Lưới Đối Tác & Bản Tin Khoảnh Khắc 24h (Network & Stories)',
    subtitle: 'Khám phá danh bạ doanh nhân, xem tin hoạt động kinh doanh 24h và chăm sóc khách hàng B2B',
    goal: 'Mở rộng mạng lưới quan hệ chiến lược và duy trì tương tác thường xuyên với các đối tác chủ chốt.',
    path: 'Thanh điều hướng đáy -> Chạm vào Tab: Mạng Lưới (Network)',
    steps: [
      'Bước 1: Header màn hình hiển thị Avatar tròn mạ vàng của bạn, bên cạnh nút Quét card.',
      'Bước 2: Dải Stories 24h trên đầu hiển thị thẻ Tạo tin 24h (lấy ảnh thật và tên thật của bạn) cùng avatar các doanh nhân vừa đăng tải hoạt động mới. Chạm vào avatar để xem trình chiếu toàn màn hình.',
      'Bước 3: Khối banner AI Copilot Matcher gợi ý các đối tác có độ tương thích kinh doanh cao.',
      'Bước 4: Danh sách "Chăm Sóc Đối Tác" hiển thị các mối quan hệ quan trọng kèm ngày tương tác gần nhất và các phím tắt: [Gọi Điện] [Nhắn Tin] [Hẹn Gặp 1-1].',
      'Bước 5: Bộ lọc ngành nghề chuẩn màu Nâu Gradient ViOne cho phép lọc nhanh đối tác theo chuyên môn.'
    ],
    noteRed: 'QUY TẮC TIN 24H: Các khoảnh khắc Stories sẽ tự động biến mất sau đúng 24 giờ kể từ thời điểm đăng tải.',
    noteBlue: 'MẸO DUY TRÌ QUAN HỆ: Nhắn tin chúc mừng hoặc tương tác với Story của đối tác là cách tự nhiên nhất để mở đầu một cơ hội làm ăn mới.',
    workflow: [
      { step: '01', action: 'Tạo Tin 24h Stories', ui: 'Nút Tạo Tin Avatar Thật', input: 'Chọn ảnh/video hoạt động', output: 'Xuất bản story tồn tại 24 giờ' },
      { step: '02', action: 'Xem Story Đối Tác', ui: 'Trình chiếu Fullscreen Stories', input: 'Chạm avatar doanh nhân', output: 'Xem ảnh, văn bản và nhắn tin chúc mừng' },
      { step: '03', action: 'Bộ Lọc Ngành Nghề', ui: 'Filter Chips Nâu Gradient ViOne', input: 'Chọn lĩnh vực kinh doanh', output: 'Lọc tức thì đối tác phù hợp' },
      { step: '04', action: 'Chăm Sóc 1-Chạm', ui: 'Nút Gọi, Nhắn tin, Hẹn gặp', input: 'Bấm trực tiếp trên thẻ', output: 'Kết nối đàm phán ngay lập tức' }
    ]
  },
  {
    tag: 'APP · 2 KIỂU CỘNG ĐỒNG',
    title: 'Phân Hệ 2 Kiểu Cộng Đồng Doanh Nghiệp (B2B Networking vs Công Ty Nội Bộ)',
    subtitle: 'Tách bạch tuyệt đối không gian giao lưu đối tác B2B bên ngoài và không gian điều hành nội bộ công ty',
    goal: 'Phục vụ đồng thời hai nhu cầu cốt lõi của doanh nghiệp: Kết nối giao thương bên ngoài và Giao việc quản trị bên trong.',
    path: 'Thanh điều hướng đáy -> Chạm Tab: Cộng Đồng (Community)',
    steps: [
      'Bước 1: Tại màn hình danh sách cộng đồng, nhận diện 2 loại hình qua huy hiệu nổi bật: [🤝 MẠNG LƯỚI B2B] hoặc [🏢 CÔNG TY NỘI BỘ].',
      'Bước 2: Khi truy cập Cộng Đồng B2B Networking:\n  • Nút hành động trên Header: `+ Đăng cơ hội`, `+ Đăng bài`, `+ Chia sẻ SK`.\n  • Các Tab nghiệp vụ: [Cơ hội], [Bảng tin], [Sự kiện], [Thành viên].\n  • Tuyệt đối KHÔNG có tính năng giao việc nhân sự hay giám sát trong cộng đồng B2B.',
      'Bước 3: Khi truy cập Cộng Đồng Nội Bộ Công Ty:\n  • Nút hành động trên Header: `+ Giao việc`, `+ Đăng bài`, `+ Chia sẻ SK`.\n  • Các Tab nghiệp vụ: [Công việc], [Giám sát CRM], [Bảng tin], [Sự kiện], [Nhân sự].\n  • Tuyệt đối KHÔNG có tính năng đăng cơ hội giao thương B2B trong cộng đồng công ty.',
      'Bước 4: Chia sẻ sự kiện đối tác ngoài: Bấm `+ Chia sẻ SK` -> Nhập link sự kiện bên ngoài vào modal ShareEventModal để quảng bá cho thành viên.'
    ],
    noteRed: 'QUY TẮC PHÂN LẬP NGHIÊM NGẶT: Hệ thống kiểm soát quyền chặt chẽ theo loại hình cộng đồng, không cho phép giao việc nhân viên trong cộng đồng giao lưu B2B và không đăng tin thầu rao bán trong cộng đồng nội bộ.',
    noteBlue: 'MẸO ĐIỀU HÀNH: Giám đốc tạo một cộng đồng công ty để tập hợp toàn bộ nhân viên và tham gia các cộng đồng B2B để săn cơ hội thầu.',
    workflow: [
      { step: '01', action: 'Phân Loại Mô Hình', ui: 'Community Type Selector', input: 'b2b_networking vs company_internal', output: 'Thiết lập cấu trúc tab riêng biệt' },
      { step: '02', action: 'Cộng Đồng B2B', ui: 'Header Actions B2B', input: '+ Đăng cơ hội, + Đăng bài, + Chia sẻ SK', output: 'Mở rộng giao thương đối tác ngoài' },
      { step: '03', action: 'Cộng Đồng Nội Bộ', ui: 'Header Actions Nội Bộ', input: '+ Giao việc, + Đăng bài, + Chia sẻ SK', output: 'Điều hành khép kín trong doanh nghiệp' },
      { step: '04', action: 'Chia Sẻ Sự Kiện Ngoài', ui: 'Modal ShareEventModal', input: 'Tên SK, ngày giờ, link bên ngoài', output: 'Quảng bá sự kiện vào bảng tin chung' }
    ]
  },
  {
    tag: 'APP · GIAO VIỆC NỘI BỘ',
    title: 'Quy Trình Giao Việc & Nhận Việc 1-Chạm Trong Cộng Đồng Công Ty',
    subtitle: 'Giám đốc giao việc, nhân viên bấm nhận việc tức thời và giám sát tiến độ chăm sóc khách hàng CRM',
    goal: 'Số hóa 100% quy trình làm việc trong doanh nghiệp, kiểm soát thời gian thực việc nhận và hoàn thành công việc.',
    path: 'Cộng Đồng Nội Bộ Công Ty -> Tab: Công Việc (Tasks) & Tab: Giám Sát (Supervision)',
    steps: [
      'Bước 1: Giám đốc bấm nút "+ Giao việc" trên Header hoặc trong Tab Công việc -> Mở form giao việc chi tiết.',
      'Bước 2: Nhập: Tiêu đề công việc, Mô tả nhiệm vụ, Chọn nhân viên phụ trách từ danh sách công ty, Thiết lập Thời hạn hoàn thành (Deadline), Chọn khách hàng CRM liên quan.',
      'Bước 3: Gửi công việc: Nhân viên phụ trách nhận được thông báo thời gian thực. Khi mở Tab Công việc, công việc hiển thị ở trạng thái "Chờ nhận việc" kèm nút bấm nổi bật [⚡ TIẾN HÀNH NHẬN VIỆC].',
      'Bước 4: Nhân viên bấm [⚡ TIẾN HÀNH NHẬN VIỆC]: Trạng thái công việc chuyển ngay sang "Đang làm" (in_progress), hệ thống ghi nhận chính xác mốc thời gian nhận việc (acceptedAt) và bắn thông báo xác nhận về máy Giám đốc.',
      'Bước 5: Giám đốc mở Tab "Giám Sát": Theo dõi ma trận nhân sự, danh sách khách hàng từng nhân viên đang chăm sóc, giai đoạn phễu và hoạt động thực tế.'
    ],
    noteRed: 'KIỂM SOÁT THỜI GIAN THỰC: Giám đốc biết chính xác nhân viên đã bấm nhận việc hay chưa thông qua nút [⚡ TIẾN HÀNH NHẬN VIỆC] và mốc thời gian acceptedAt.',
    noteBlue: 'MẸO VẬN HÀNH: Liên kết công việc với khách hàng CRM giúp nhân viên mở trực tiếp hồ sơ khách hàng chỉ với 1 chạm ngay trong chi tiết công việc.',
    workflow: [
      { step: '01', action: 'Giám Đốc Giao Việc', ui: 'Form Giao Việc Nội Bộ', input: 'Tiêu đề, nhân viên, deadline, CRM lead', output: 'Bắn thông báo tức thì đến nhân viên' },
      { step: '02', action: 'Chờ Nhận Việc', ui: 'Badge Vàng [assigned]', input: 'Hiển thị trên app nhân viên', output: 'Xuất hiện nút [⚡ TIẾN HÀNH NHẬN VIỆC]' },
      { step: '03', action: 'Nhận Việc 1-Chạm', ui: 'Nút [⚡ TIẾN HÀNH NHẬN VIỆC]', input: 'Nhân viên click xác nhận', output: 'Chuyển in_progress + Ghi acceptedAt' },
      { step: '04', action: 'Giám Sát Bán Hàng', ui: 'Tab Giám Sát Supervision', input: 'Ma trận nhân sự & Khách hàng CRM', output: 'Báo cáo trực quan cho Giám đốc' }
    ]
  },
  {
    tag: 'APP · QUẢN TRỊ CỘNG ĐỒNG',
    title: 'Quyền Quản Trị Cộng Đồng Gia Đình ViOne Cho Admin Nền Tảng',
    subtitle: 'Admin hệ thống được cấp quyền Quản trị viên đầy đủ, tự do chỉnh sửa tên, ảnh đại diện, ảnh bìa và giới thiệu',
    goal: 'Trao toàn quyền quản trị cộng đồng trung tâm Gia đình ViOne cho các tài khoản quản trị viên nền tảng.',
    path: 'Cộng Đồng Gia Đình ViOne -> Bấm nút: [⚙️ Chỉnh sửa cộng đồng] trên Header',
    steps: [
      'Bước 1: Đăng nhập bằng tài khoản Quản trị viên (Admin/Owner) và truy cập cộng đồng "Gia đình ViOne".',
      'Bước 2: Hệ thống tự động nhận diện quyền Quản trị viên (canEdit = true, viewerRole = "admin") và hiển thị nút mạ vàng [⚙️ Chỉnh sửa cộng đồng]. Trong tab Thành viên, tài khoản được gắn nhãn "Quản trị viên".',
      'Bước 3: Nhấp vào [⚙️ Chỉnh sửa cộng đồng] để mở modal EditCommunityModal chuyên dụng.',
      'Bước 4: Chỉnh sửa các trường thông tin: Tên cộng đồng, Tải lên Ảnh đại diện (Logo) mới, Tải lên Ảnh bìa (Banner) mới, Cập nhật Khẩu hiệu (Tagline), Mô tả chi tiết và Loại hình cộng đồng.',
      'Bước 5: Bấm "Lưu Thay Đổi": Thông tin cộng đồng được cập nhật ngay lập tức lên CSDL và đồng bộ tới toàn bộ thành viên.'
    ],
    noteRed: 'QUYỀN HẠN BẢO MẬT: Nút [⚙️ Chỉnh sửa cộng đồng] chỉ hiển thị với các tài khoản Admin hoặc Chủ sở hữu cộng đồng. Thành viên thông thường chỉ có quyền xem.',
    noteBlue: 'MẸO THẨM MỸ: Ảnh bìa cộng đồng nên có tỷ lệ 16:9 chất lượng cao và ảnh đại diện logo tròn để hiển thị đẹp nhất trên màn hình điện thoại.',
    workflow: [
      { step: '01', action: 'Nhận Diện Quyền Admin', ui: 'Backend Check canEdit=true', input: 'User ID là Admin hoặc Owner', output: 'Hiển thị nút [⚙️ Chỉnh sửa cộng đồng]' },
      { step: '02', action: 'Mở Modal Chỉnh Sửa', ui: 'Modal EditCommunityModal', input: 'Click nút bánh răng quản trị', output: 'Load thông tin hiện tại vào form' },
      { step: '03', action: 'Cập Nhật Logo & Banner', ui: 'Upload file ảnh MinIO', input: 'Chọn ảnh logo và banner mới', output: 'Xem trước hình ảnh trực tiếp' },
      { step: '04', action: 'Lưu & Đồng Bộ', ui: 'API PATCH /connect-app/community/:id', input: 'Gửi payload chỉnh sửa', output: 'Cập nhật thành công cho toàn mạng' }
    ]
  },
  {
    tag: 'APP · CƠ HỘI B2B & HẸN GẶP',
    title: 'Quy Trình Quan Tâm Cơ Hội B2B & Đề Xuất Hẹn Gặp Qua Thẻ Chat Tương Tác',
    subtitle: 'Bày tỏ quan tâm cơ hội, gửi thẻ tương tác hẹn gặp vào chat và tự động ghim cuộc gặp vào lịch trình trang chủ',
    goal: 'Biến cơ hội kinh doanh thành các cuộc gặp mặt thực tế 1-on-1, xúc tiến giao thương nhanh chóng.',
    path: 'Cộng Đồng B2B -> Tab Cơ Hội -> Xem Chi Tiết Cơ Hội -> Bấm [Quan tâm]',
    steps: [
      'Bước 1: Xem chi tiết một cơ hội kinh doanh trên Sàn Cơ Hội B2B.',
      'Bước 2: Bấm nút [Quan tâm]: Hệ thống ghi nhận lượt quan tâm, bắn thông báo cho người đăng cơ hội và hiển thị thêm nút nổi bật [📅 Nhắn tin hẹn gặp trao đổi cơ hội].',
      'Bước 3: Bấm nút [📅 Nhắn tin hẹn gặp trao đổi cơ hội] -> Mở modal ProposeOpportunityMeetingModal: Chọn Ngày hẹn, Giờ hẹn, Hình thức gặp (Trực tiếp hoặc Video Call ViOne) và Lời nhắn hợp tác -> Bấm "Gửi Đề Xuất Hẹn Gặp".',
      'Bước 4: Thẻ tương tác OpportunityMeetingProposalCard xuất hiện trong luồng chat của người đăng với 2 nút: [Đồng ý hẹn] và [Từ chối].',
      'Bước 5: Khi người đăng bấm [Đồng ý hẹn]: Cuộc gặp tự động được lưu vào CSDL lịch trình, kích hoạt sự kiện meeting-scheduled, xuất hiện ngay trong Tab [Hôm nay] trên Trang chủ ExecutiveHome của cả hai bên, đồng thời bắn thông báo xác nhận.',
      'Bước 6: Đối với Người Đăng Cơ Hội: Có thể xem danh sách toàn bộ đối tác quan tâm (interestedMembers) kèm thông tin công ty và nút hẹn gặp nhanh.'
    ],
    noteRed: 'TỰ ĐỘNG HÓA LỊCH TRÌNH: Khi bấm [Đồng ý hẹn], cuộc gặp được ghim thẳng vào lịch trình làm việc trang chủ mà không cần nhập liệu thủ công.',
    noteBlue: 'MẸO KẾT NỐI: Người đăng cơ hội nên kiểm tra thường xuyên danh sách đối tác quan tâm để chủ động đề xuất lịch hẹn với các đối tác tiềm năng nhất.',
    workflow: [
      { step: '01', action: 'Bấm Quan Tâm Cơ Hội', ui: 'Nút [Quan Tâm] chi tiết cơ hội', input: 'Thao tác click của đối tác', output: 'Hiện nút [📅 Nhắn tin hẹn gặp] + Bắn notify' },
      { step: '02', action: 'Gửi Đề Xuất Hẹn Gặp', ui: 'Modal ProposeOpportunityMeeting', input: 'Ngày, giờ, địa điểm, lời nhắn', output: 'Gửi thẻ card tương tác vào luồng chat' },
      { step: '03', action: 'Thẻ Tương Tác Trong Chat', ui: 'Card [🤝 ĐỀ XUẤT HẸN GẶP]', input: '2 Nút: [Đồng ý hẹn] / [Từ chối]', output: 'Người đăng phản hồi chỉ với 1 chạm' },
      { step: '04', action: 'Tự Động Lên Lịch Trang Chủ', ui: 'Sự kiện meeting-scheduled', input: 'Bấm [Đồng ý hẹn]', output: 'Ghim vào Lịch [Hôm nay] của cả 2 bên' }
    ]
  },
  {
    tag: 'APP · GHI ÂM KHOẢNH KHẮC',
    title: 'Lưu Vết Ghi Âm Khoảnh Khắc (Voice Moments) & Danh Mục Lịch Sử Trang Chủ',
    subtitle: 'Ghi âm giọng nói khi đăng khoảnh khắc, tự động lưu vết lịch sử và nghe lại trực tiếp trên trang chủ',
    goal: 'Lưu giữ những ghi chú giọng nói quan trọng và giúp lãnh đạo dễ dàng nghe lại mọi lúc mọi nơi.',
    path: 'Đăng Khoảnh Khắc -> Thu âm giọng nói -> Trang Chủ ExecutiveHome -> Tab: [🎙️ Ghi âm]',
    steps: [
      'Bước 1: Khi tạo bài viết hoặc khoảnh khắc trong ứng dụng, người dùng bấm vào biểu tượng Micro để thu âm giọng nói (MomentVoiceNote).',
      'Bước 2: Sau khi thu âm và đăng khoảnh khắc thành công, tệp âm thanh tự động được lưu vết vào kho lưu trữ lịch sử vba_voice_moments_history và phát sự kiện voice-moment-saved.',
      'Bước 3: Mở Trang chủ ExecutiveHome: Quan sát thanh tab lịch trình có thêm danh mục thứ 4 [🎙️ Ghi âm ({count})] bên cạnh Hôm nay, Sắp tới, Lời nhắc.',
      'Bước 4: Nhấp vào Tab [🎙️ Ghi âm]: Danh sách toàn bộ các bản ghi âm khoảnh khắc xuất hiện kèm ngày giờ thu âm, thời lượng, trích đoạn nội dung và sóng âm trực quan.',
      'Bước 5: Bấm nút Play/Pause trên từng bản ghi âm để nghe lại giọng nói trực tiếp với trình phát audio inline handleTogglePlayVoice.'
    ],
    noteRed: 'LƯU VẾT BỀN VỮNG: Mọi bản ghi âm giọng nói đều được lưu vết thời gian thực, đảm bảo không bị thất lạc khi chuyển đổi qua lại giữa các màn hình.',
    noteBlue: 'MẸO GHI CHÚ: Sử dụng ghi âm khoảnh khắc để ghi lại các ý tưởng kinh doanh chớp nhoáng hoặc tóm tắt nhanh sau các cuộc họp đối tác.',
    workflow: [
      { step: '01', action: 'Thu Âm Giọng Nói', ui: 'Thành phần MomentVoiceNote', input: 'Nói vào microphone điện thoại', output: 'Tệp audio wav/mp3 chất lượng cao' },
      { step: '02', action: 'Tự Động Lưu Vết Lịch Sử', ui: 'Kho vba_voice_moments_history', input: 'Đăng khoảnh khắc thành công', output: 'Phát sự kiện voice-moment-saved' },
      { step: '03', action: 'Hiển Thị Danh Mục Trang Chủ', ui: 'Tab [🎙️ Ghi âm] tại ExecutiveHome', input: 'Chuyển tab danh mục 4', output: 'Danh sách các bản ghi âm kèm sóng âm' },
      { step: '04', action: 'Nghe Lại Trực Tiếp Inline', ui: 'Nút Play/Pause & Audio Player', input: 'Chạm nút nghe lại', output: 'Phát âm thanh sắc nét ngay trên trang chủ' }
    ]
  },
  {
    tag: 'APP · AI COPILOT',
    title: 'Trí Tuệ Nhân Tạo ViOne AI Copilot 5.0 Thông Minh Toàn Năng',
    subtitle: 'Tìm kiếm đoạn ghi âm theo giọng nói, quét người dùng quanh đây và phân tích động cơ hội kèm Evidence Cards',
    goal: 'Cung cấp trợ lý điều hành giọng nói tiếng Việt toàn năng, hỗ trợ tối đa cho các quyết định của lãnh đạo C-Level.',
    path: 'Trang Chủ -> Bấm nút Micro AI hoặc Chạm nút ViOne mạ vàng -> Chọn: Trợ Lý AI Copilot',
    steps: [
      'Bước 1: Chạm vào biểu tượng Trợ lý AI ViOne Copilot để mở cửa sổ đàm thoại giọng nói thông minh.',
      'Bước 2: Tìm kiếm đoạn ghi âm khoảnh khắc: Ra lệnh bằng giọng nói: "tìm đoạn ghi âm tại khoảnh khắc" -> AI tự động quét kho lịch sử ghi âm, phản hồi giọng nói và hiển thị thẻ Voice Moment Evidence có nút nghe lại và thanh sóng âm trực tiếp trong hộp thoại AI.',
      'Bước 3: Quét người dùng ViOne quanh đây: Hỏi AI: "quanh đây có ai dùng ViOne không" -> AI kích hoạt định vị trong bán kính (km), yêu cầu cấp quyền vị trí, hiển thị danh sách người dùng lân cận hoặc phản hồi lịch sự kèm gợi ý mở rộng bán kính.',
      'Bước 4: Phân tích động cơ hội kinh doanh: Hỏi AI: "tôi được bao nhiêu quan tâm cơ hội của tôi" -> AI tính toán chính xác số lượt và hiển thị thẻ Opportunity Evidence Cards kèm nút [Xem đối tác quan tâm] và [Hẹn gặp].',
      'Bước 5: Kiểm tra cuộc gặp điều hành: Hỏi AI: "tôi có cuộc gặp nào không" -> AI tổng hợp chi tiết các cuộc gặp đã xác nhận và hiển thị thẻ Meeting Evidence Cards kèm nút [Vào phòng họp video] và [Xem lịch].',
      'Bước 6: Đa thông báo tương tác: Hệ thống tự động bắn thông báo thời gian thực cho mọi tương tác (tin nhắn người lạ, đối tác quan tâm cơ hội, đề xuất hẹn gặp, đối tác đồng ý hẹn, kết nối thành công).'
    ],
    noteRed: 'DYNAMIC TOÀN DIỆN: AI Copilot tuyệt đối không lặp lại câu hỏi của người dùng và luôn đưa ra số liệu thực tế kèm thẻ bằng chứng tương tác (Evidence Cards).',
    noteBlue: 'MẸO RA LỆNH: Có thể hỏi AI bất kỳ câu hỏi nào về lịch trình hôm nay, tình hình chấm công nhân sự, hay duyệt chi ngân sách.',
    workflow: [
      { step: '01', action: 'Ra Lệnh Bằng Giọng Nói', ui: 'Giao diện ViOneVoiceAssistant', input: 'Nói lệnh tiếng Việt tự nhiên', output: 'Nhận diện giọng nói chính xác' },
      { step: '02', action: 'Tìm Đoạn Ghi Âm Khoảnh Khắc', ui: 'Thẻ Voice Moment Evidence Card', input: '"tìm đoạn ghi âm tại khoảnh khắc"', output: 'Hiển thị audio player + Nghe lại inline' },
      { step: '03', action: 'Quét Người Dùng Quanh Đây', ui: 'API /connect-app/nearby-users', input: '"quanh đây có ai dùng ViOne không"', output: 'Danh sách doanh nhân theo bán kính km' },
      { step: '04', action: 'Phân Tích Cơ Hội & Cuộc Gặp', ui: 'Thẻ Opportunity & Meeting Cards', input: '"tôi được bao nhiêu quan tâm..."', output: 'Evidence Cards có nút hành động 1-chạm' }
    ]
  },
  {
    tag: 'APP · DANH TÍNH SỐ',
    title: 'Hồ Sơ Danh Tính Số C-Level, Danh Thiếp Titanium 3D & Chia Sẻ Chạm NFC',
    subtitle: 'Quản trị thương hiệu cá nhân lãnh đạo, chạm danh thiếp NFC một chạm và ví danh bạ đối tác',
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
    workflow: [
      { step: '01', action: 'Xem Danh Tính Số 3D', ui: 'Card Titanium Lật Mặt 3D', input: 'Chạm lật mặt trước/sau', output: 'Ảnh chân dung, chức danh, chữ ký V' },
      { step: '02', action: 'Chạm Chia Sẻ NFC', ui: 'Nút [Chạm NFC]', input: 'Chạm lưng điện thoại đối tác', output: 'Mở danh thiếp công khai chỉ 1 giây' },
      { step: '03', action: '5 Kênh Liên Hệ Nhanh', ui: 'Gọi, Mail, Viber, WA, Telegram', input: 'Chạm icon tương tác', output: 'Mở ứng dụng liên lạc tương ứng' },
      { step: '04', action: 'Ví Danh Thiếp Đối Tác', ui: 'Kho lưu trữ Card Vault', input: 'Danh bạ đã quét/chạm', output: 'Tải tệp danh bạ vCard .vcf về máy' }
    ]
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
      'Bước 6: Chạm vào biểu tượng để mở app: Ứng dụng chạy toàn màn hình Native siêu mượt, loại bỏ hoàn toàn thanh địa chỉ Safari.'
    ],
    noteRed: 'BẮT BUỘC DÙNG SAFARI: Thao tác tải và cài đặt hồ sơ cấu hình trên iOS bắt buộc phải thực hiện qua trình duyệt Safari mặc định của Apple. Nếu mở qua Zalo/FB, hãy bấm [•••] chọn Mở bằng Safari.',
    noteBlue: 'MẸO ĐỘT PHÁ: Giải pháp này giúp người dùng iOS cài đặt app dễ dàng như cài file APK trên Android, không lo bị thu hồi chứng chỉ doanh nghiệp.',
    workflow: [
      { step: '01', action: 'Mở Safari & Tải Profile', ui: 'Trình duyệt Safari iPhone', input: 'Link /vione_ios_install.mobileconfig', output: 'Hộp thoại Apple: Cho phép tải về' },
      { step: '02', action: 'Mở Cài Đặt Máy', ui: 'Cài Đặt (iOS Settings)', input: 'Mục "Đã tải về hồ sơ"', output: 'Xem hồ sơ ViOne Business Connect' },
      { step: '03', action: 'Xác Nhận Cài Đặt', ui: 'Nút [Cài Đặt] góc phải trên', input: 'Nhập Passcode mở máy', output: 'Xác nhận cài đặt WebClip Profile' },
      { step: '04', action: 'Icon Màn Hình Chính', ui: 'Home Screen iPhone', input: 'Chạm biểu tượng ViOne', output: 'Chạy Fullscreen Native 100%' }
    ]
  },
  {
    tag: 'APP · HỘP THƯ & CUỘC GỌI',
    title: 'Hộp Thư Trực Tiếp & Cuộc Gọi WebRTC Thoại & Video Real Dual-Theme',
    subtitle: 'Nhắn tin trực tiếp giữa các CEO, gửi thẻ tương tác hẹn gặp, gọi thoại và gọi video nghe giọng thực tế 100%',
    goal: 'Trao đổi hợp tác làm ăn nhanh chóng, thực hiện cuộc gọi chất lượng cao với âm thanh rõ nét.',
    path: 'Thanh điều hướng đáy -> Chạm vào biểu tượng: Hộp Thư (Inbox)',
    steps: [
      'Bước 1: Xem danh sách các cuộc trò chuyện chia theo các Tab: [Tất Cả] [Chưa Đọc] [Nhóm Dự Án] [Tin Nhắn Chờ].',
      'Bước 2: Chạm vào cuộc trò chuyện để mở cửa sổ chat với đối tác. Nhận diện các thẻ tương tác hẹn gặp trao đổi cơ hội với nút [Đồng ý hẹn] và [Từ chối].',
      'Bước 3: Gọi thoại WebRTC (Voice Call): Chạm biểu tượng Điện thoại -> Cuộc gọi kết nối tức thì, giọng nói đàm thoại hai chiều rõ nét qua Web Audio API không bị chặn autoplay.',
      'Bước 4: Gọi video WebRTC (Video Call): Chạm biểu tượng Camera -> Khởi tạo video hai chiều sắc nét với tính năng khử tiếng vọng và lọc tiếng ồn.',
      'Bước 5: Thiết kế Full Dual-Theme: Giao diện cuộc gọi hỗ trợ hoàn hảo cả Theme Sáng (nền trắng ngọc trai mạ vàng đồng, tên đối phương màu đen obsidian sắc nét) và Theme Tối (Obsidian Navy chữ trắng tinh khôi).'
    ],
    noteRed: 'KẾT NỐI ÂM THANH THỰC TẾ: Công nghệ Web Audio API định tuyến luồng âm thanh trực tiếp từ microphone đối phương, đảm bảo nghe thấy giọng nói 100%.',
    noteBlue: 'MẸO BẬT ÂM THANH: Nếu trình duyệt có chính sách hạn chế autoplay, ứng dụng trang bị sẵn nút "🔊 Bật âm thanh đối phương" để mở tiếng ngay tức thì.',
    workflow: [
      { step: '01', action: 'Hộp Thư 4 Danh Mục', ui: 'Tab [Tất cả][Chưa đọc][Nhóm][Chờ]', input: 'Phân loại tin nhắn', output: 'Tránh thư rác làm phiền CEO' },
      { step: '02', action: 'Thẻ Hẹn Gặp Chat', ui: 'OpportunityMeetingProposalCard', input: 'Thẻ đề xuất trong hội thoại', output: 'Phản hồi [Đồng ý] / [Từ chối] tức thời' },
      { step: '03', action: 'Gọi Thoại WebRTC', ui: 'Web Audio API Stream Routing', input: 'Nút [Gọi Điện Thoại]', output: 'Đàm thoại 2 chiều nghe giọng 100%' },
      { step: '04', action: 'Gọi Video Dual-Theme', ui: 'Giao diện Full Sáng & Tối', input: 'Nút [Gọi Video Call]', output: 'Khử tiếng vọng & Video HD sắc nét' }
    ]
  },
  {
    tag: 'APP · KẾT NỐI SONG PHƯƠNG',
    title: 'Bắt Tay Kết Nối Song Phương Thời Gian Thực Qua Mã QR & WebSocket (Incoming QR Handshake)',
    subtitle: 'Quét mã QR kết nối tức thì, tự động kích hoạt Modal yêu cầu kết nối song phương thời gian thực trên cả Web và Mobile',
    goal: 'Thiết lập quy trình bắt tay giao thương hai chiều minh bạch, người được quét nhận thông báo và quyết định đồng ý kết nối ngay lập tức.',
    path: 'Thanh điều hướng đáy / Header -> Quét QR (ScanQrModal) -> Phát sự kiện WebSocket qr:connect',
    steps: [
      'Bước 1: Doanh nhân A mở chức năng Quét QR trên ứng dụng ViOne Mobile hoặc Web PWA.',
      'Bước 2: Hướng camera vào mã QR danh thiếp của Doanh nhân B (hoặc quét NFC). Ứng dụng giải mã token danh thiếp và phát sự kiện WebSocket "qr:connect" lên ConnectAppGateway.',
      'Bước 3: Ngay lập tức, màn hình ứng dụng của Doanh nhân B (dù đang dùng Web hay Native App) tự động bật Modal kết nối song phương (IncomingConnectionModal / IncomingQrConnectionModal).',
      'Bước 4: Doanh nhân B xem đầy đủ thông tin: Ảnh đại diện, họ tên, chức vụ, tên công ty của Doanh nhân A kèm lời mời kết nối kinh doanh.',
      'Bước 5: Doanh nhân B bấm nút [Đồng ý kết nối] mạ vàng Champagne Gold: Hệ thống phát sự kiện "connection:respond" (accept), tự động lưu kết nối vào CSDL, bắn thông báo thành công cho Doanh nhân A và mở kênh trò chuyện trực tiếp 1-1.'
    ],
    noteRed: 'AN TOÀN DANH TÍNH DOANH NHÂN: Người được quét hoàn toàn chủ động từ chối nếu không phù hợp qua nút [Để sau / Từ chối], đảm bảo tuyệt đối quyền riêng tư và tránh bị làm phiền.',
    noteBlue: 'MẸO GIAO THƯƠNG: Kết nối song phương thành công sẽ tự động mở khóa tính năng chia sẻ danh thiếp vCard và cho phép gửi thẻ đề xuất hẹn gặp 1-on-1 trong hộp thư chat.',
    workflow: [
      { step: '01', action: 'Quét QR Danh Thiếp', ui: 'ScanQrModal Camera View', input: 'Mã QR Doanh nhân B', output: 'Phát socket qr:connect' },
      { step: '02', action: 'Thông Báo Song Phương', ui: 'IncomingQrConnectionModal', input: 'Sự kiện connection:incoming', output: 'Bật Modal tức thì trên thiết bị B' },
      { step: '03', action: 'Phản Hồi Kết Nối', ui: 'Nút [Đồng ý] / [Để sau]', input: 'Thao tác chạm của B', output: 'Phát socket connection:respond' },
      { step: '04', action: 'Đồng Bộ Danh Bạ', ui: 'Network Contacts & Chat', input: 'Event connection:accepted', output: 'Lưu CSDL & mở kênh Chat 1-1' }
    ]
  },
  {
    tag: 'APP · TRỢ LÝ AI & HỒ SƠ',
    title: 'Trợ Lý ViOne AI Copilot Đa Năng C-Level & Quản Lý Hồ Sơ Cá Nhân Native Parity',
    subtitle: 'Trợ lý AI thông minh giải đáp mọi dữ liệu nền tảng, thiết kế giao diện không che khuất, và trình chỉnh sửa hồ sơ C-Level thuần Native',
    goal: 'Cung cấp năng lực trợ lý ảo thông thái nắm trọn vẹn thông tin tài khoản, sự kiện, cộng đồng và chuẩn hóa công cụ chỉnh sửa danh thiếp số trên di động.',
    path: 'Header Trang Chủ / Tab Tôi -> Trợ lý AI ViOne Copilot / Nút [Chỉnh sửa hồ sơ]',
    steps: [
      'Bước 1: Chạm vào Trợ lý AI ViOne Copilot (nút micro hoặc nút AI nổi có thể kéo thả PanResponder và đóng mở linh hoạt).',
      'Bước 2: Giao diện AI xuất hiện với cấu trúc chuẩn: Header cố định không đè lấn sóng micro, Footer nhập câu hỏi luôn neo cứng ở đáy qua KeyboardAvoidingView.',
      'Bước 3: Người dùng có thể hỏi bất kỳ câu hỏi nào: "Sự kiện nào đang diễn ra?", "Tôi đang tham gia những cộng đồng nào?", "Tài khoản của tôi có bao nhiêu kết nối?", "Tôi có cơ hội kinh doanh nào mới không?". AI phân tích ngữ cảnh người dùng theo thời gian thực và trả lời chi tiết kèm Evidence Cards và Suggested Actions.',
      'Bước 4: Tại màn hình Tôi (ProfileScreen), chạm nút "Chỉnh sửa" mở EditProfileModal chuẩn Native: Cập nhật họ tên hiển thị, chức danh, công ty, ngành nghề, số điện thoại, email, website và tiểu sử điều hành.',
      'Bước 5: Bấm [Lưu thay đổi]: Dữ liệu đồng bộ tức thì lên hệ thống, cập nhật danh thiếp số 3D Titanium và phản ánh ngay vào thẻ hồ sơ hiển thị cho đối tác.'
    ],
    noteRed: 'KHÔNG RẬP KHUÔN: AI Copilot liên tục truy vấn dữ liệu thực tế từ tài khoản và hệ thống, cam kết phản hồi chính xác 100% mọi dữ liệu trong hệ sinh thái ViOne.',
    noteBlue: 'MẸO QUẢN TRỊ AI: Người dùng có thể tắt nút AI nổi ở trang chủ khi muốn màn hình thoáng hơn, và dễ dàng bật lại bất kỳ lúc nào tại mục Cài Đặt trên Tab Tôi.',
    workflow: [
      { step: '01', action: 'Kích Hoạt AI Copilot', ui: 'Floating AI / Header Micro', input: 'Voice hoặc Text câu hỏi', output: 'Mở ViOneVoiceAssistantModal' },
      { step: '02', action: 'Phân Tích Động', ui: 'Backend AiService API', input: 'Context user & nền tảng', output: 'Dữ liệu sự kiện, cộng đồng, leads' },
      { step: '03', action: 'Hiển Thị Trực Quan', ui: 'Evidence Cards & Action Chips', input: 'Response Markdown & Chips', output: 'Trả lời thông thái không rập khuôn' },
      { step: '04', action: 'Chỉnh Sửa Hồ Sơ', ui: 'EditProfileModal Native', input: 'Form 8 trường thông tin', output: 'Lưu CSDL & Cập nhật danh thiếp' }
    ]
  },
  {
    tag: 'APP · 5 PHÂN HỆ NÂNG CẤP',
    title: 'Hoàn Thiện 5 Phân Hệ Trọng Yếu: AI Copilot Typewriter, Đăng Tin & Khoảnh Khắc, Hộp Thư, Thẻ Doanh Nhân & CRM Khách Hàng',
    subtitle: 'Nâng cấp toàn diện trải nghiệm người dùng với AI trung thực, luồng tạo nội dung linh hoạt, chat liền mạch và quản trị khách hàng C-Level',
    goal: 'Cung cấp trải nghiệm mượt mà, chính xác và chuyên nghiệp nhất trên toàn bộ hệ sinh thái ứng dụng ViOne.',
    path: 'Trang Chủ / Mạng Lưới / Đăng Khoảnh Khắc / Hộp Thư / Khách Hàng CRM',
    steps: [
      'Bước 1: Trợ lý AI ViOne Copilot: Khi hỏi về bạn bè kết nối ("tôi có bao nhiêu bạn bè"), AI truy vấn CSDL PostgreSQL thực tế, báo trung thực số 0 nếu chưa có kết nối, loại bỏ triệt để ảo giác 156 bạn bè; đồng thời chữ hiển thị mượt mà theo hiệu ứng máy đánh chữ Typewriter Streaming với con trỏ nhấp nháy.',
      'Bước 2: Đăng Tin & Khoảnh Khắc: Chủ đề/chuyên mục hoàn toàn không bắt buộc (chạm để chọn hoặc bỏ chọn qua nút "[Bỏ chọn chủ đề]"), ảnh mẫu được gỡ bỏ để người dùng đăng bài chữ thuần túy hoặc ảnh thực tế từ camera/thư viện mà không bị mất ảnh sau khi xuất bản.',
      'Bước 3: Hộp Thư Tin Nhắn: Danh sách hiển thị đầy đủ mọi tài khoản đã từng nhắn tin qua lại, hệ thống tự động bóc tách tiền tố "th-" và tự khởi tạo luồng chat với người dùng mới mà không phát sinh lỗi UUID.',
      'Bước 4: Thẻ Doanh Nhân Trang Chủ: Ảnh bìa và ảnh đại diện tự động đồng bộ từ dữ liệu danh tính người dùng; modal chỉnh sửa nhanh được tối ưu chỉ còn đúng 1 nút tải ảnh bìa và 1 nút tải avatar tinh gọn.',
      'Bước 5: Quản Trị Khách Hàng CRM: Tab Khách hàng trang bị 4 thẻ chỉ số Pipeline (Quy mô cơ hội, Đang đàm phán, Tỷ lệ chốt deal, Lịch chăm sóc tuần), kèm stepper tiến trình 4 giai đoạn, bộ chọn Deal Health và dòng thời gian ghi nhật ký chăm sóc đa kênh.'
    ],
    noteRed: 'DỮ LIỆU CHÍNH XÁC & MINH BẠCH: Toàn bộ thông tin hiển thị từ AI, danh bạ đến CRM đều được đối soát trực tiếp từ CSDL thực, đảm bảo sự trung thực tuyệt đối cho lãnh đạo.',
    noteBlue: 'MẸO SỬ DỤNG: Dùng nút chuyển giai đoạn 1-chạm trong chi tiết khách hàng CRM để cập nhật tức thì trạng thái đàm phán hợp đồng cho toàn bộ đội ngũ bán hàng.',
    workflow: [
      { step: '01', action: 'AI Typewriter Streaming', ui: 'ViOneVoiceAssistantModal', input: 'Câu hỏi người dùng', output: 'Gõ chữ từng ký tự kèm con trỏ nhấp nháy' },
      { step: '02', action: 'Đăng Tin Tự Do', ui: 'PostMomentModal / CreateNews', input: 'Tùy chọn chủ đề & ảnh', output: 'Lưu bền vững storage_path media' },
      { step: '03', action: 'Nhắn Tin Liền Mạch', ui: 'Hộp thư Messenger', input: 'Bóc tách tiền tố th-', output: 'Mở kênh chat 1-1 không lỗi UUID' },
      { step: '04', action: 'CRM Pipeline Stepper', ui: 'CustomerDetailModal', input: 'Chạm chuyển 4 giai đoạn deal', output: 'Cập nhật realtime phễu bán hàng' }
    ]
  }
];

const allSections = [...crmSections, ...appSections];

// ==========================================
// HÀM TẠO HTML TEMPLATE KHÔNG CÓ BẤT KỲ ẢNH NÀO
// ==========================================
function generateHtmlDoc({ docCode, title, subtitle, targetAudience, sections }) {
  let tocItems = sections.map((sec, idx) => {
    const num = (idx + 1).toString().padStart(2, '0');
    return `<a class="toc-item" href="#sec-${num}"><span class="toc-num">${num}.</span><span class="toc-text">${sec.title}</span></a>`;
  }).join('\n      ');

  let sectionsHtml = sections.map((sec, idx) => {
    const num = (idx + 1).toString().padStart(2, '0');

    // Sơ đồ luồng thao tác trực quan (Workflow Matrix Table)
    const workflowRows = (sec.workflow || []).map(w => `
      <tr>
        <td class="wf-step-col"><span class="step-badge">${w.step}</span></td>
        <td class="wf-act-col"><strong>${w.action}</strong></td>
        <td class="wf-ui-col"><code>${w.ui}</code></td>
        <td class="wf-in-col">${w.input}</td>
        <td class="wf-out-col"><span class="out-tag">${w.output}</span></td>
      </tr>
    `).join('\n');

    return `
    <section class="trn-section" id="sec-${num}">
      <div class="trn-tag">${sec.tag}</div>
      <h2 class="trn-h2">${num}. ${sec.title}</h2>
      <div class="trn-h3">${sec.subtitle}</div>

      <div class="trn-goal">
        <strong>MỤC TIÊU NGHIỆP VỤ:</strong> ${sec.goal}
      </div>

      <div class="trn-path">
        <strong>ĐƯỜNG DẪN THAO TÁC:</strong> <code>${sec.path}</code>
      </div>

      <div class="steps-container">
        <h4 class="steps-title">TRÌNH TỰ THAO TÁC NGHIỆP VỤ:</h4>
        <ol class="trn-steps">
          ${sec.steps.map(s => `<li>${s}</li>`).join('\n          ')}
        </ol>
      </div>

      <div class="workflow-box">
        <div class="wf-header">
          <span class="wf-title">MA TRẬN QUY TRÌNH & THÔNG SỐ XỬ LÝ (WORKFLOW SPECIFICATION)</span>
          <span class="wf-badge-gold">Xác thực: 100% Khớp Mã Nguồn</span>
        </div>
        <table class="wf-table">
          <thead>
            <tr>
              <th style="width: 8%;">Bước</th>
              <th style="width: 20%;">Hành Động</th>
              <th style="width: 25%;">Thành Phần Giao Diện</th>
              <th style="width: 25%;">Dữ Liệu Đầu Vào / Ràng Buộc</th>
              <th style="width: 22%;">Kết Quả Đầu Ra & Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            ${workflowRows}
          </tbody>
        </table>
      </div>

      <div class="box-red">
        <strong>LƯU Ý NGHIỆP VỤ QUAN TRỌNG:</strong>
        ${sec.noteRed}
      </div>

      <div class="box-blue">
        <strong>MẸO VẬN HÀNH DÀNH CHO C-LEVEL:</strong>
        ${sec.noteBlue}
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
    .trn-h2 { font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 800; color: #0F172A; margin-bottom: 4px; line-height: 1.3; }
    .trn-h3 { font-size: 13px; color: #64748B; margin-bottom: 18px; font-weight: 400; }

    .trn-goal { background: #F8FAFC; border-left: 4px solid #0284C7; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 12px; font-size: 12.5px; color: #1E293B; }
    .trn-goal strong { color: #0284C7; font-weight: 700; margin-right: 6px; }

    .trn-path { background: #FFFBEB; border-left: 4px solid #D97706; padding: 10px 16px; border-radius: 0 8px 8px 0; margin-bottom: 18px; font-size: 12px; color: #78350F; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .trn-path strong { color: #B45309; margin-right: 6px; font-weight: 700; }
    .trn-path code { background: #FEF3C7; padding: 2px 6px; border-radius: 4px; font-weight: 600; color: #92400E; }

    .steps-container { margin-bottom: 20px; background: #FAFBFD; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px 20px; }
    .steps-title { font-size: 12px; font-weight: 800; color: #0F172A; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 10px; }
    .trn-steps { margin-left: 20px; font-size: 12.5px; line-height: 1.8; color: #334155; }
    .trn-steps li { margin-bottom: 6px; }

    /* Bảng Ma trận Quy trình & Thông số (Thay thế hoàn toàn ảnh) */
    .workflow-box { margin: 20px 0; border: 1px solid #CBD5E1; border-radius: 8px; overflow: hidden; background: #FFFFFF; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .wf-header { background: #0F172A; color: #FFFFFF; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; }
    .wf-title { font-weight: 700; letter-spacing: 0.5px; color: #F1F5F9; }
    .wf-badge-gold { background: #D8B282; color: #000000; font-weight: 800; padding: 2px 8px; border-radius: 4px; font-size: 10px; text-transform: uppercase; }
    .wf-table { width: 100%; border-collapse: collapse; font-size: 11.5px; text-align: left; }
    .wf-table th { background: #F1F5F9; color: #334155; font-weight: 700; padding: 8px 12px; border-bottom: 2px solid #CBD5E1; border-right: 1px solid #E2E8F0; }
    .wf-table th:last-child { border-right: none; }
    .wf-table td { padding: 9px 12px; border-bottom: 1px solid #E2E8F0; border-right: 1px solid #E2E8F0; vertical-align: middle; }
    .wf-table td:last-child { border-right: none; }
    .wf-table tr:nth-child(even) { background: #F8FAFC; }
    .step-badge { display: inline-block; background: #0F172A; color: #D8B282; font-weight: 800; font-size: 10px; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; }
    .wf-table code { background: #EEF2F6; color: #0284C7; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-family: monospace; }
    .out-tag { display: inline-block; background: #DCFCE7; color: #166534; font-weight: 600; padding: 2px 8px; border-radius: 4px; font-size: 11px; border: 1px solid #BBF7D0; }

    .box-red { background: #FEF2F2; border: 1px solid #FCA5A5; border-left: 4px solid #DC2626; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 12px; font-size: 12px; color: #991B1B; line-height: 1.6; }
    .box-red strong { color: #DC2626; margin-right: 6px; font-weight: 800; }

    .box-blue { background: #EFF6FF; border: 1px solid #93C5FD; border-left: 4px solid #2563EB; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px; font-size: 12px; color: #1E40AF; line-height: 1.6; }
    .box-blue strong { color: #2563EB; margin-right: 6px; font-weight: 800; }

    @media print {
      body { background: #FFFFFF; }
      .trn-doc { width: 100%; margin: 0; box-shadow: none; }
      .cover, .toc-section, .trn-section { page-break-after: always; break-after: page; }
    }
  </style>
</head>
<body>
<article class="trn-doc">

  <!-- BÌA A4 -->
  <section class="cover">
    <div class="accent-bar"></div>
    <div class="header">
      <div>HỆ THỐNG VIONE · TÀI LIỆU HƯỚNG DẪN SỬ DỤNG CHÍNH THỨC</div>
      <div>MÃ TÀI LIỆU: ${docCode}</div>
    </div>
    <div class="main">
      <div class="logo-title">VIONE CORPORATION</div>
      <div class="doc-label">CẨM NANG NGHIỆP VỤ & VẬN HÀNH THỜI GIAN THỰC (PHIÊN BẢN 100% TEXT & WORKFLOW)</div>
      <h1 class="project-title">${title}</h1>
      <p class="subtitle">${subtitle}</p>
      
      <div class="meta-info">
        <div><strong>Hệ thống áp dụng:</strong> ${targetAudience}</div>
        <div><strong>Phiên bản tài liệu:</strong> 6.0 Enterprise Edition (Tháng 10/2026)</div>
        <div><strong>Môi trường xác thực:</strong> Server Dev HTTPS (https://14.225.217.232:5445)</div>
        <div><strong>Đơn vị phát triển:</strong> Đội ngũ Kiến Trúc Sư Hệ Thống & Business Analyst Cao Cấp</div>
        <div><strong>Tiêu chuẩn tài liệu:</strong> 100% Ma Trận Quy Trình Trực Quan - Tuyệt Đối Không Lỗi Ảnh 404</div>
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

// ==========================================
// HÀM TẠO FILE DOCX KHÔNG CÓ BẤT KỲ ẢNH NÀO
// ==========================================
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
        new TextRun({ text: "CẨM NANG HƯỚNG DẪN SỬ DỤNG HỆ THỐNG TOÀN DIỆN", bold: true, size: 24, color: "64748B", font: "Arial" })
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
        new TextRun({ text: `\nQuy chuẩn: 100% Ma Trận Quy Trình Trực Quan (Zero 404 Images)`, size: 20 }),
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

  // Từng chương nội dung Docx - 100% Text & Bảng Table (KHÔNG DÙNG ImageRun)
  sections.forEach((sec, idx) => {
    const num = (idx + 1).toString().padStart(2, '0');

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
          new TextRun({ text: "MỤC TIÊU NGHIỆP VỤ: ", bold: true, color: "0284C7" }),
          new TextRun({ text: sec.goal, size: 22 })
        ],
        spacing: { after: 150 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "ĐƯỜNG DẪN THAO TÁC: ", bold: true, color: "B45309" }),
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

    // Bảng Ma trận quy trình thao tác trong Word Docx
    if (sec.workflow && sec.workflow.length > 0) {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: "MA TRẬN QUY TRÌNH & THÔNG SỐ XỬ LÝ (WORKFLOW MATRIX):", bold: true, size: 20, color: "0F172A" })
          ],
          spacing: { before: 200, after: 120 }
        })
      );

      const tableRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Bước", bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: "Hành Động", bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: "Thành Phần Giao Diện", bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: "Dữ Liệu Đầu Vào / Ràng Buộc", bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: "Kết Quả Đầu Ra", bold: true })] })
          ]
        })
      ];

      sec.workflow.forEach(w => {
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: w.step, bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: w.action, bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: w.ui })] }),
              new TableCell({ children: [new Paragraph({ text: w.input })] }),
              new TableCell({ children: [new Paragraph({ text: w.output })] })
            ]
          })
        );
      });

      docChildren.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE }
        })
      );
    }

    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: "LƯU Ý NGHIỆP VỤ: ", bold: true, color: "DC2626" }),
          new TextRun({ text: sec.noteRed, size: 20 })
        ],
        spacing: { before: 200, after: 150 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "MẸO C-LEVEL: ", bold: true, color: "2563EB" }),
          new TextRun({ text: sec.noteBlue, size: 20 })
        ],
        spacing: { after: 300 }
      })
    );
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: docChildren
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`  -> Da xuat ban DOCX: ${outputPath}`);
}

// ==========================================
// THỰC THI XUẤT BẢN TOÀN BỘ BỘ TÀI LIỆU
// ==========================================
async function buildAllDocs() {
  console.log('>>> [1/3] Xuat ban Tai Lieu HDSD Web CRM ViOne (22 Chuong)...');
  const crmHtml = generateHtmlDoc({
    docCode: 'HDSD-VIONE-WEB-CRM-6.0',
    title: 'HƯỚNG DẪN SỬ DỤNG HỆ THỐNG QUẢN TRỊ CRM VIONE C-LEVEL',
    subtitle: 'Cẩm nang vận hành 22 phân hệ quản trị doanh nghiệp, bán hàng B2B, chấm công và tài chính',
    targetAudience: 'Ban Giám Đốc, Quản Lý Chi Nhánh, Phòng Kinh Doanh, Kế Toán, Nhân Sự & Quản Trị Hệ Thống',
    sections: crmSections
  });
  const crmHtmlPath = path.join(docDir, 'HDSD_WEB_CRM_VIONE.html');
  fs.writeFileSync(crmHtmlPath, crmHtml);
  fs.copyFileSync(crmHtmlPath, path.join(publicDocsDir, 'HDSD_WEB_CRM_VIONE.html'));

  const crmDocxPath = path.join(docDir, 'HDSD_WEB_CRM_VIONE.docx');
  await generateDocxFile({
    docCode: 'HDSD-VIONE-WEB-CRM-6.0',
    title: 'HƯỚNG DẪN SỬ DỤNG HỆ THỐNG QUẢN TRỊ CRM VIONE C-LEVEL',
    subtitle: 'Cẩm nang vận hành 22 phân hệ quản trị doanh nghiệp, bán hàng B2B, chấm công và tài chính',
    targetAudience: 'Ban Giám Đốc, Quản Lý Chi Nhánh, Phòng Kinh Doanh, Kế Toán, Nhân Sự & Quản Trị Hệ Thống',
    sections: crmSections,
    outputPath: crmDocxPath
  });
  fs.copyFileSync(crmDocxPath, path.join(publicDocsDir, 'HDSD_WEB_CRM_VIONE.docx'));

  console.log('>>> [2/3] Xuat ban Tai Lieu HDSD Mobile App ViOne Connect (17 Chuong)...');
  const appHtml = generateHtmlDoc({
    docCode: 'HDSD-VIONE-CONNECT-APP-6.0',
    title: 'HƯỚNG DẪN SỬ DỤNG ỨNG DỤNG DI ĐỘNG VIONE CONNECT C-LEVEL',
    subtitle: 'Cẩm nang giao thương B2B, cộng đồng 2 kiểu, danh thiếp số NFC, trợ lý AI Copilot đa năng, kết nối QR song phương và WebRTC',
    targetAudience: 'Lãnh Đạo C-Level, Doanh Nhân Thành Viên, Đối Tác Giao Thương Mạng Lưới ViOne',
    sections: appSections
  });
  const appHtmlPath = path.join(docDir, 'HDSD_APP_VIONE_CONNECT.html');
  fs.writeFileSync(appHtmlPath, appHtml);
  fs.copyFileSync(appHtmlPath, path.join(publicDocsDir, 'HDSD_APP_VIONE_CONNECT.html'));

  const appDocxPath = path.join(docDir, 'HDSD_APP_VIONE_CONNECT.docx');
  await generateDocxFile({
    docCode: 'HDSD-VIONE-CONNECT-APP-6.0',
    title: 'HƯỚNG DẪN SỬ DỤNG ỨNG DỤNG DI ĐỘNG VIONE CONNECT C-LEVEL',
    subtitle: 'Cẩm nang giao thương B2B, cộng đồng 2 kiểu, danh thiếp số NFC, trợ lý AI Copilot đa năng, kết nối QR song phương và WebRTC',
    targetAudience: 'Lãnh Đạo C-Level, Doanh Nhân Thành Viên, Đối Tác Giao Thương Mạng Lưới ViOne',
    sections: appSections,
    outputPath: appDocxPath
  });
  fs.copyFileSync(appDocxPath, path.join(publicDocsDir, 'HDSD_APP_VIONE_CONNECT.docx'));

  console.log(`>>> [3/3] Xuat ban Tai Lieu Hop Nhat Toan Dien (${allSections.length} Chuong)...`);
  const allHtml = generateHtmlDoc({
    docCode: 'HDSD-VIONE-ENTERPRISE-MASTER-6.0',
    title: 'HƯỚNG DẪN SỬ DỤNG HỢP NHẤT HỆ THỐNG CRM & APP MOBILE VIONE TOÀN DIỆN',
    subtitle: `Bộ tài liệu chuẩn hóa ${allSections.length} chuyên đề bao quát trọn vẹn mọi luồng nghiệp vụ trên Web và Di động`,
    targetAudience: 'Toàn Thể Ban Lãnh Đạo, Nhân Sự Doanh Nghiệp & Mạng Lưới Đối Tác Doanh Nhân B2B',
    sections: allSections
  });
  const allHtmlPath = path.join(docDir, 'HDSD_HE_THONG_VA_APP_VIONE_TOAN_DIEN.html');
  fs.writeFileSync(allHtmlPath, allHtml);
  fs.copyFileSync(allHtmlPath, path.join(publicDocsDir, 'HDSD_HE_THONG_VA_APP_VIONE_TOAN_DIEN.html'));

  const allDocxPath = path.join(docDir, 'HDSD_HE_THONG_VA_APP_VIONE_TOAN_DIEN.docx');
  await generateDocxFile({
    docCode: 'HDSD-VIONE-ENTERPRISE-MASTER-6.0',
    title: 'HƯỚNG DẪN SỬ DỤNG HỢP NHẤT HỆ THỐNG CRM & APP MOBILE VIONE TOÀN DIỆN',
    subtitle: `Bộ tài liệu chuẩn hóa ${allSections.length} chuyên đề bao quát trọn vẹn mọi luồng nghiệp vụ trên Web và Di động`,
    targetAudience: 'Toàn Thể Ban Lãnh Đạo, Nhân Sự Doanh Nghiệp & Mạng Lưới Đối Tác Doanh Nhân B2B',
    sections: allSections,
    outputPath: allDocxPath
  });
  fs.copyFileSync(allDocxPath, path.join(publicDocsDir, 'HDSD_HE_THONG_VA_APP_VIONE_TOAN_DIEN.docx'));

  // Tạo thêm bản Markdown tóm tắt hợp nhất
  let mdSummary = `# HƯỚNG DẪN SỬ DỤNG HỢP NHẤT HỆ THỐNG CRM & APP MOBILE VIONE (${allSections.length} CHUYÊN ĐỀ)\n\n`;
  mdSummary += `**Mã tài liệu:** HDSD-VIONE-MASTER-6.0 | **Ngày ban hành:** 08/10/2026 | **Phiên bản:** 6.0 Enterprise\n\n---\n\n`;
  mdSummary += `### DANH MỤC ${allSections.length} CHUYÊN ĐỀ NGHIỆP VỤ (100% TEXT & WORKFLOW - ZERO 404 IMAGES)\n\n`;
  allSections.forEach((s, i) => {
    const num = (i + 1).toString().padStart(2, '0');
    mdSummary += `#### ${num}. [${s.tag}] ${s.title}\n`;
    mdSummary += `- **Mục tiêu:** ${s.goal}\n`;
    mdSummary += `- **Đường dẫn:** \`${s.path}\`\n`;
    mdSummary += `- **Các bước:**\n${s.steps.map(step => `  * ${step}`).join('\n')}\n`;
    mdSummary += `- **Lưu ý:** ${s.noteRed}\n`;
    mdSummary += `- **Mẹo C-Level:** ${s.noteBlue}\n\n`;
  });
  const allMdPath = path.join(docDir, 'HDSD_HE_THONG_VA_APP_VIONE_TOAN_DIEN.md');
  fs.writeFileSync(allMdPath, mdSummary);
  fs.copyFileSync(allMdPath, path.join(publicDocsDir, 'HDSD_HE_THONG_VA_APP_VIONE_TOAN_DIEN.md'));

  console.log('>>> [HOAN TAT 100%] Da xuat ban day du 3 bo tai lieu HDSD (HTML, DOCX, MD) khong dung anh, dong bo sang public/docs!');
}

buildAllDocs().catch(err => {
  console.error('Loi khi tao HDSD:', err);
});
